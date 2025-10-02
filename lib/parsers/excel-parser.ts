/**
 * ================================================================
 * AI銷售賦能平台 - Excel/CSV 文件解析器
 * ================================================================
 *
 * 【檔案功能】
 * 使用 xlsx 套件解析 Excel (.xlsx, .xls) 和 CSV 文件
 * 支持多工作表、公式、格式化數值等功能
 *
 * 【主要職責】
 * • Excel 文件讀取 - 從 Buffer 讀取 .xlsx/.xls 文件
 * • CSV 文件讀取 - 解析 CSV 格式數據
 * • 工作表解析 - 支持多工作表提取
 * • 數據轉換 - 將表格數據轉為結構化文本或 JSON
 *
 * 【使用場景】
 * • 批量上傳 - 用戶上傳 Excel/CSV 文件到知識庫
 * • 數據導入 - 從表格導入結構化數據
 * • 內容索引 - 為搜索引擎建立索引
 *
 * 【技術依賴】
 * • xlsx - Excel/CSV 解析核心套件
 * • Buffer - Node.js 二進制數據處理
 *
 * 【相關檔案】
 * • lib/parsers/pdf-parser.ts - PDF 解析器
 * • lib/parsers/word-parser.ts - Word 文檔解析器
 * • lib/parsers/image-ocr-parser.ts - 圖片 OCR 解析器
 */

import * as XLSX from 'xlsx'

/**
 * Excel 解析結果介面
 */
export interface ExcelParseResult {
  /** 提取的純文本內容（所有工作表合併） */
  text: string
  /** 工作表數據（如果啟用結構化輸出） */
  sheets?: SheetData[]
  /** 文件元數據 */
  metadata: {
    /** 工作表數量 */
    sheetCount: number
    /** 工作表名稱列表 */
    sheetNames: string[]
    /** 總行數 */
    totalRows: number
    /** 總列數 */
    totalColumns: number
  }
  /** 文件大小（字節） */
  fileSize: number
  /** 解析耗時（毫秒） */
  parseTime: number
}

/**
 * 工作表數據介面
 */
export interface SheetData {
  /** 工作表名稱 */
  name: string
  /** 行數 */
  rows: number
  /** 列數 */
  columns: number
  /** 數據（二維數組） */
  data: any[][]
  /** JSON 格式數據（第一行為表頭） */
  json?: Record<string, any>[]
}

/**
 * Excel 解析器選項
 */
export interface ExcelParserOptions {
  /** 最大文件大小（字節），預設 50MB */
  maxFileSize?: number
  /** 最大行數限制，預設 10000 行 */
  maxRows?: number
  /** 是否提取結構化數據，預設 false */
  extractStructured?: boolean
  /** 是否將第一行作為表頭（JSON 格式），預設 true */
  firstRowAsHeader?: boolean
  /** 是否只解析第一個工作表，預設 false */
  firstSheetOnly?: boolean
  /** 空值處理策略 */
  emptyValueStrategy?: 'keep' | 'skip' | 'placeholder'
}

/**
 * Excel/CSV 文件解析器類
 *
 * 提供 Excel 和 CSV 文件解析功能
 *
 * @example
 * ```ts
 * const parser = new ExcelParser({ extractStructured: true })
 * const result = await parser.parseFromBuffer(fileBuffer)
 * console.log(result.text) // 提取的文本內容
 * console.log(result.sheets) // 結構化工作表數據
 * ```
 */
export class ExcelParser {
  private options: Required<ExcelParserOptions>

  constructor(options: ExcelParserOptions = {}) {
    this.options = {
      maxFileSize: options.maxFileSize ?? 50 * 1024 * 1024, // 50MB
      maxRows: options.maxRows ?? 10000,
      extractStructured: options.extractStructured ?? false,
      firstRowAsHeader: options.firstRowAsHeader ?? true,
      firstSheetOnly: options.firstSheetOnly ?? false,
      emptyValueStrategy: options.emptyValueStrategy ?? 'skip',
    }
  }

  /**
   * 從 Buffer 解析 Excel/CSV 文件
   *
   * @param buffer - Excel/CSV 文件的 Buffer 數據
   * @param filename - 文件名（可選，用於錯誤提示）
   * @returns Excel 解析結果
   * @throws Error 如果文件過大、行數超限或解析失敗
   */
  async parseFromBuffer(
    buffer: Buffer,
    filename?: string
  ): Promise<ExcelParseResult> {
    const startTime = Date.now()

    // 驗證文件大小
    if (buffer.length > this.options.maxFileSize) {
      throw new Error(
        `Excel文件過大: ${(buffer.length / 1024 / 1024).toFixed(2)}MB ` +
        `(最大允許: ${(this.options.maxFileSize / 1024 / 1024).toFixed(2)}MB)`
      )
    }

    try {
      // 讀取工作簿
      const workbook = XLSX.read(buffer, {
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false,
      })

      // 獲取要處理的工作表名稱
      const sheetNames = this.options.firstSheetOnly
        ? [workbook.SheetNames[0]]
        : workbook.SheetNames

      // 解析所有工作表
      const sheets: SheetData[] = []
      let totalRows = 0
      let totalColumns = 0
      const textParts: string[] = []

      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) continue

        // 獲取工作表範圍
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
        const rows = range.e.r - range.s.r + 1
        const columns = range.e.c - range.s.c + 1

        // 驗證行數
        if (rows > this.options.maxRows) {
          throw new Error(
            `工作表 "${sheetName}" 行數過多: ${rows}行 ` +
            `(最大允許: ${this.options.maxRows}行)`
          )
        }

        totalRows += rows
        totalColumns = Math.max(totalColumns, columns)

        // 提取數據
        const data = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: this.getEmptyValue(),
          raw: false, // 格式化數值為文本
        }) as any[][]

        // 過濾空行
        const filteredData = this.filterEmptyRows(data)

        // 提取文本
        const sheetText = this.dataToText(filteredData)
        textParts.push(`[${sheetName}]\n${sheetText}`)

        // 提取結構化數據（如需要）
        if (this.options.extractStructured) {
          const json = this.options.firstRowAsHeader && filteredData.length > 0
            ? XLSX.utils.sheet_to_json(worksheet, { defval: this.getEmptyValue() })
            : undefined

          sheets.push({
            name: sheetName,
            rows,
            columns,
            data: filteredData,
            json,
          })
        }
      }

      const parseTime = Date.now() - startTime

      return {
        text: textParts.join('\n\n'),
        sheets: this.options.extractStructured ? sheets : undefined,
        metadata: {
          sheetCount: sheetNames.length,
          sheetNames,
          totalRows,
          totalColumns,
        },
        fileSize: buffer.length,
        parseTime,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤'
      throw new Error(
        `Excel文件解析失敗${filename ? ` (${filename})` : ''}: ${errorMessage}`
      )
    }
  }

  /**
   * 從 Base64 字符串解析 Excel/CSV
   *
   * @param base64 - Base64 編碼的 Excel/CSV 數據
   * @param filename - 文件名（可選）
   * @returns Excel 解析結果
   */
  async parseFromBase64(
    base64: string,
    filename?: string
  ): Promise<ExcelParseResult> {
    const buffer = Buffer.from(base64, 'base64')
    return this.parseFromBuffer(buffer, filename)
  }

  /**
   * 將二維數據轉為文本
   *
   * @param data - 二維數組數據
   * @returns 文本字符串（Tab 分隔）
   */
  private dataToText(data: any[][]): string {
    return data
      .map((row) =>
        row
          .map((cell) => {
            if (cell === null || cell === undefined) return ''
            return String(cell).trim()
          })
          .join('\t')
      )
      .join('\n')
  }

  /**
   * 過濾空行
   *
   * @param data - 原始數據
   * @returns 過濾後的數據
   */
  private filterEmptyRows(data: any[][]): any[][] {
    if (this.options.emptyValueStrategy === 'keep') {
      return data
    }

    return data.filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && cell !== '')
    )
  }

  /**
   * 獲取空值替代值
   *
   * @returns 空值替代
   */
  private getEmptyValue(): any {
    switch (this.options.emptyValueStrategy) {
      case 'placeholder':
        return '[空]'
      case 'keep':
        return null
      case 'skip':
      default:
        return ''
    }
  }

  /**
   * 驗證是否為有效的 Excel 文件
   *
   * 檢查 .xlsx (ZIP) 或 .xls (OLE) 文件頭
   *
   * @param buffer - 文件 Buffer
   * @returns 是否為 Excel 文件
   */
  static isExcel(buffer: Buffer): boolean {
    if (buffer.length < 4) return false

    // .xlsx 文件是 ZIP 格式，以 PK 開頭
    const isXLSX =
      buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04

    // .xls 文件是 OLE 格式，以 D0 CF 11 E0 開頭
    const isXLS =
      buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0

    return isXLSX || isXLS
  }

  /**
   * 驗證是否為有效的 CSV 文件
   *
   * 簡單檢查是否包含逗號或換行符（CSV 特徵）
   *
   * @param buffer - 文件 Buffer
   * @returns 是否可能為 CSV 文件
   */
  static isCSV(buffer: Buffer): boolean {
    try {
      const text = buffer.toString('utf8', 0, Math.min(1000, buffer.length))
      return text.includes(',') || text.includes('\n')
    } catch {
      return false
    }
  }
}

/**
 * 便捷函數：從 Buffer 解析 Excel/CSV
 *
 * @param buffer - Excel/CSV 文件 Buffer
 * @param options - 解析選項
 * @returns Excel 解析結果
 */
export async function parseExcel(
  buffer: Buffer,
  options?: ExcelParserOptions
): Promise<ExcelParseResult> {
  const parser = new ExcelParser(options)
  return parser.parseFromBuffer(buffer)
}

/**
 * 便捷函數：從 Base64 解析 Excel/CSV
 *
 * @param base64 - Base64 編碼的 Excel/CSV 數據
 * @param options - 解析選項
 * @returns Excel 解析結果
 */
export async function parseExcelFromBase64(
  base64: string,
  options?: ExcelParserOptions
): Promise<ExcelParseResult> {
  const parser = new ExcelParser(options)
  return parser.parseFromBase64(base64)
}
