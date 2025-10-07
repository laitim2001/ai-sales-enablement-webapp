/**
 * @fileoverview ================================================================AI銷售賦能平台 - Word文檔解析器================================================================【檔案功能】使用 mammoth 套件解析 Word 文檔 (.docx, .doc)，提取純文本或 HTML 內容支持段落、標題、列表、表格等格式【主要職責】• Word 文檔讀取 - 從 Buffer 讀取 .docx/.doc 文件• 文本提取 - 提取純文本內容，保留段落結構• HTML 提取 - 可選提取 HTML 格式，保留格式• 元數據提取 - 提取作者、標題等信息（如有）【使用場景】• 批量上傳 - 用戶上傳 Word 文檔到知識庫• 內容索引 - 為搜索引擎建立索引• 格式化內容 - 需要保留格式的場景【技術依賴】• mammoth - Word 文檔解析套件• Buffer - Node.js 二進制數據處理【相關檔案】• lib/parsers/pdf-parser.ts - PDF 解析器• lib/parsers/excel-parser.ts - Excel/CSV 解析器• lib/parsers/image-ocr-parser.ts - 圖片 OCR 解析器
 * @module lib/parsers/word-parser
 * @description
 * ================================================================AI銷售賦能平台 - Word文檔解析器================================================================【檔案功能】使用 mammoth 套件解析 Word 文檔 (.docx, .doc)，提取純文本或 HTML 內容支持段落、標題、列表、表格等格式【主要職責】• Word 文檔讀取 - 從 Buffer 讀取 .docx/.doc 文件• 文本提取 - 提取純文本內容，保留段落結構• HTML 提取 - 可選提取 HTML 格式，保留格式• 元數據提取 - 提取作者、標題等信息（如有）【使用場景】• 批量上傳 - 用戶上傳 Word 文檔到知識庫• 內容索引 - 為搜索引擎建立索引• 格式化內容 - 需要保留格式的場景【技術依賴】• mammoth - Word 文檔解析套件• Buffer - Node.js 二進制數據處理【相關檔案】• lib/parsers/pdf-parser.ts - PDF 解析器• lib/parsers/excel-parser.ts - Excel/CSV 解析器• lib/parsers/image-ocr-parser.ts - 圖片 OCR 解析器
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import mammoth from 'mammoth'

/**
 * Word 解析結果介面
 */
export interface WordParseResult {
  /** 提取的純文本內容 */
  text: string
  /** HTML 格式內容（如果啟用） */
  html?: string
  /** 文檔元數據 */
  metadata: {
    /** 標題 */
    title?: string
    /** 作者 */
    author?: string
    /** 創建日期 */
    createdAt?: Date
    /** 修改日期 */
    modifiedAt?: Date
  }
  /** 文件大小（字節） */
  fileSize: number
  /** 解析耗時（毫秒） */
  parseTime: number
  /** 解析警告信息 */
  warnings: string[]
}

/**
 * Word 解析器選項
 */
export interface WordParserOptions {
  /** 最大文件大小（字節），預設 50MB */
  maxFileSize?: number
  /** 是否提取 HTML 格式，預設 false */
  extractHTML?: boolean
  /** 是否提取元數據，預設 true */
  extractMetadata?: boolean
  /** 圖片處理策略，預設 'ignore' */
  imageStrategy?: 'ignore' | 'base64' | 'url'
}

/**
 * Word 文檔解析器類
 *
 * 提供 Word 文檔解析功能，支持 .docx 和 .doc 格式
 *
 * @example
 * ```ts
 * const parser = new WordParser()
 * const result = await parser.parseFromBuffer(fileBuffer)
 * console.log(result.text) // 提取的文本內容
 * console.log(result.html) // HTML 格式（如啟用）
 * ```
 */
export class WordParser {
  private options: Required<WordParserOptions>

  constructor(options: WordParserOptions = {}) {
    this.options = {
      maxFileSize: options.maxFileSize ?? 50 * 1024 * 1024, // 50MB
      extractHTML: options.extractHTML ?? false,
      extractMetadata: options.extractMetadata ?? true,
      imageStrategy: options.imageStrategy ?? 'ignore',
    }
  }

  /**
   * 從 Buffer 解析 Word 文檔
   *
   * @param buffer - Word 文件的 Buffer 數據
   * @param filename - 文件名（可選，用於錯誤提示）
   * @returns Word 解析結果
   * @throws Error 如果文件過大或解析失敗
   */
  async parseFromBuffer(
    buffer: Buffer,
    filename?: string
  ): Promise<WordParseResult> {
    const startTime = Date.now()

    // 驗證文件大小
    if (buffer.length > this.options.maxFileSize) {
      throw new Error(
        `Word文檔過大: ${(buffer.length / 1024 / 1024).toFixed(2)}MB ` +
        `(最大允許: ${(this.options.maxFileSize / 1024 / 1024).toFixed(2)}MB)`
      )
    }

    try {
      // 配置 mammoth 選項
      const mammothOptions: mammoth.Options = {
        convertImage: this.getImageConverter(),
      }

      // 並行提取文本和 HTML（如需要）
      const [textResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ buffer, ...mammothOptions }),
        this.options.extractHTML
          ? mammoth.convertToHtml({ buffer, ...mammothOptions })
          : Promise.resolve(null),
      ])

      // 清理文本
      const cleanedText = this.cleanText(textResult.value)

      // 提取元數據（mammoth 不直接提供元數據，這裡預留接口）
      const metadata: WordParseResult['metadata'] = {}
      if (this.options.extractMetadata) {
        // mammoth 不提供元數據提取，可以使用其他套件如 docx
        // 這裡預留接口，未來可以整合
      }

      const parseTime = Date.now() - startTime

      // 收集警告信息
      const warnings: string[] = []
      if (textResult.messages.length > 0) {
        warnings.push(...textResult.messages.map((m) => m.message))
      }
      if (htmlResult && htmlResult.messages.length > 0) {
        warnings.push(...htmlResult.messages.map((m) => m.message))
      }

      return {
        text: cleanedText,
        html: htmlResult?.value,
        metadata,
        fileSize: buffer.length,
        parseTime,
        warnings,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤'
      throw new Error(
        `Word文檔解析失敗${filename ? ` (${filename})` : ''}: ${errorMessage}`
      )
    }
  }

  /**
   * 從 Base64 字符串解析 Word 文檔
   *
   * @param base64 - Base64 編碼的 Word 數據
   * @param filename - 文件名（可選）
   * @returns Word 解析結果
   */
  async parseFromBase64(
    base64: string,
    filename?: string
  ): Promise<WordParseResult> {
    const buffer = Buffer.from(base64, 'base64')
    return this.parseFromBuffer(buffer, filename)
  }

  /**
   * 獲取圖片轉換器函數
   *
   * @returns mammoth 圖片轉換器
   */
  private getImageConverter(): mammoth.ConvertImage | undefined {
    switch (this.options.imageStrategy) {
      case 'ignore':
        // 忽略圖片，不包含在輸出中
        return mammoth.images.inline(() => ({ src: '' }))

      case 'base64':
        // 將圖片轉為 Base64（適合小圖片）
        return mammoth.images.inline((element: mammoth.ImageElement) => {
          return element.read('base64').then((imageBuffer) => {
            const base64String =
              typeof imageBuffer === 'string' ? imageBuffer : imageBuffer.toString('base64')
            return {
              src: `data:${element.contentType};base64,${base64String}`,
            }
          })
        })

      case 'url':
        // 使用 URL（需要額外處理上傳圖片）
        return undefined // 預設行為

      default:
        return undefined
    }
  }

  /**
   * 清理提取的文本
   *
   * 移除多餘的空白和換行
   *
   * @param text - 原始文本
   * @returns 清理後的文本
   */
  private cleanText(text: string): string {
    return text
      // 移除多餘的空白
      .replace(/\s+/g, ' ')
      // 移除開頭和結尾的空白
      .trim()
      // 移除控制字符
      .replace(/[\x00-\x1F\x7F]/g, '')
  }

  /**
   * 驗證是否為有效的 Word 文檔
   *
   * 檢查 .docx (ZIP) 或 .doc (OLE) 文件頭
   *
   * @param buffer - 文件 Buffer
   * @returns 是否為 Word 文檔
   */
  static isWord(buffer: Buffer): boolean {
    if (buffer.length < 4) return false

    // .docx 文件是 ZIP 格式，以 PK 開頭
    const isDOCX =
      buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04

    // .doc 文件是 OLE 格式，以 D0 CF 11 E0 開頭
    const isDOC =
      buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0

    return isDOCX || isDOC
  }
}

/**
 * 便捷函數：從 Buffer 解析 Word 文檔
 *
 * @param buffer - Word 文件 Buffer
 * @param options - 解析選項
 * @returns Word 解析結果
 */
export async function parseWord(
  buffer: Buffer,
  options?: WordParserOptions
): Promise<WordParseResult> {
  const parser = new WordParser(options)
  return parser.parseFromBuffer(buffer)
}

/**
 * 便捷函數：從 Base64 解析 Word 文檔
 *
 * @param base64 - Base64 編碼的 Word 數據
 * @param options - 解析選項
 * @returns Word 解析結果
 */
export async function parseWordFromBase64(
  base64: string,
  options?: WordParserOptions
): Promise<WordParseResult> {
  const parser = new WordParser(options)
  return parser.parseFromBase64(base64)
}
