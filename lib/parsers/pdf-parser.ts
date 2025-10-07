/**
 * @fileoverview ================================================================AI銷售賦能平台 - PDF文件解析器================================================================【檔案功能】使用 pdf-parse 套件解析 PDF 文件，提取純文本內容支持多頁 PDF，自動處理編碼和格式【主要職責】• PDF文件讀取 - 從 Buffer 或文件路徑讀取 PDF• 文本提取 - 提取所有頁面的純文本內容• 元數據提取 - 提取標題、作者、創建日期等信息• 錯誤處理 - 處理損壞或加密的 PDF 文件【使用場景】• 批量上傳 - 用戶上傳 PDF 文件到知識庫• 內容索引 - 為搜索引擎建立索引• 嵌入向量 - 為 AI 搜索生成向量【技術依賴】• pdf-parse - PDF 解析核心套件• Buffer - Node.js 二進制數據處理【相關檔案】• lib/parsers/word-parser.ts - Word 文檔解析器• lib/parsers/excel-parser.ts - Excel/CSV 解析器• lib/parsers/image-ocr-parser.ts - 圖片 OCR 解析器
 * @module lib/parsers/pdf-parser
 * @description
 * ================================================================AI銷售賦能平台 - PDF文件解析器================================================================【檔案功能】使用 pdf-parse 套件解析 PDF 文件，提取純文本內容支持多頁 PDF，自動處理編碼和格式【主要職責】• PDF文件讀取 - 從 Buffer 或文件路徑讀取 PDF• 文本提取 - 提取所有頁面的純文本內容• 元數據提取 - 提取標題、作者、創建日期等信息• 錯誤處理 - 處理損壞或加密的 PDF 文件【使用場景】• 批量上傳 - 用戶上傳 PDF 文件到知識庫• 內容索引 - 為搜索引擎建立索引• 嵌入向量 - 為 AI 搜索生成向量【技術依賴】• pdf-parse - PDF 解析核心套件• Buffer - Node.js 二進制數據處理【相關檔案】• lib/parsers/word-parser.ts - Word 文檔解析器• lib/parsers/excel-parser.ts - Excel/CSV 解析器• lib/parsers/image-ocr-parser.ts - 圖片 OCR 解析器
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import pdf from 'pdf-parse'

/**
 * PDF 解析結果介面
 */
export interface PDFParseResult {
  /** 提取的純文本內容 */
  text: string
  /** 總頁數 */
  pages: number
  /** PDF 元數據 */
  metadata: {
    /** 標題 */
    title?: string
    /** 作者 */
    author?: string
    /** 主題 */
    subject?: string
    /** 創建日期 */
    creationDate?: Date
    /** 修改日期 */
    modificationDate?: Date
    /** PDF 版本 */
    pdfVersion?: string
  }
  /** 文件大小（字節） */
  fileSize: number
  /** 解析耗時（毫秒） */
  parseTime: number
}

/**
 * PDF 解析器選項
 */
export interface PDFParserOptions {
  /** 最大文件大小（字節），預設 50MB */
  maxFileSize?: number
  /** 最大頁數限制，預設 500 頁 */
  maxPages?: number
  /** 是否提取元數據，預設 true */
  extractMetadata?: boolean
}

/**
 * PDF 文件解析器類
 *
 * 提供 PDF 文件解析功能，支持從 Buffer 或文件路徑讀取
 *
 * @example
 * ```ts
 * const parser = new PDFParser()
 * const result = await parser.parseFromBuffer(fileBuffer)
 * console.log(result.text) // 提取的文本內容
 * console.log(result.pages) // 總頁數
 * ```
 */
export class PDFParser {
  private options: Required<PDFParserOptions>

  constructor(options: PDFParserOptions = {}) {
    this.options = {
      maxFileSize: options.maxFileSize ?? 50 * 1024 * 1024, // 50MB
      maxPages: options.maxPages ?? 500,
      extractMetadata: options.extractMetadata ?? true,
    }
  }

  /**
   * 從 Buffer 解析 PDF 文件
   *
   * @param buffer - PDF 文件的 Buffer 數據
   * @param filename - 文件名（可選，用於錯誤提示）
   * @returns PDF 解析結果
   * @throws Error 如果文件過大、頁數超限或解析失敗
   */
  async parseFromBuffer(
    buffer: Buffer,
    filename?: string
  ): Promise<PDFParseResult> {
    const startTime = Date.now()

    // 驗證文件大小
    if (buffer.length > this.options.maxFileSize) {
      throw new Error(
        `PDF文件過大: ${(buffer.length / 1024 / 1024).toFixed(2)}MB ` +
        `(最大允許: ${(this.options.maxFileSize / 1024 / 1024).toFixed(2)}MB)`
      )
    }

    try {
      // 解析 PDF
      const data = await pdf(buffer)

      // 驗證頁數
      if (data.total > this.options.maxPages) {
        throw new Error(
          `PDF頁數過多: ${data.total}頁 ` +
          `(最大允許: ${this.options.maxPages}頁)`
        )
      }

      // 提取元數據
      const metadata: PDFParseResult['metadata'] = {}
      if (this.options.extractMetadata && data.info) {
        const info = data.info as any
        metadata.title = info.Title || undefined
        metadata.author = info.Author || undefined
        metadata.subject = info.Subject || undefined
        metadata.pdfVersion = info.PDFFormatVersion || undefined

        // 解析日期
        if (info.CreationDate) {
          metadata.creationDate = this.parsePDFDate(info.CreationDate)
        }
        if (info.ModDate) {
          metadata.modificationDate = this.parsePDFDate(info.ModDate)
        }
      }

      // 清理文本內容
      const cleanedText = this.cleanText(data.text)

      const parseTime = Date.now() - startTime

      return {
        text: cleanedText,
        pages: data.total,
        metadata,
        fileSize: buffer.length,
        parseTime,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤'
      throw new Error(
        `PDF解析失敗${filename ? ` (${filename})` : ''}: ${errorMessage}`
      )
    }
  }

  /**
   * 從 Base64 字符串解析 PDF
   *
   * @param base64 - Base64 編碼的 PDF 數據
   * @param filename - 文件名（可選）
   * @returns PDF 解析結果
   */
  async parseFromBase64(
    base64: string,
    filename?: string
  ): Promise<PDFParseResult> {
    const buffer = Buffer.from(base64, 'base64')
    return this.parseFromBuffer(buffer, filename)
  }

  /**
   * 清理提取的文本
   *
   * 移除多餘的空白、換行和特殊字符
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
   * 解析 PDF 日期格式
   *
   * PDF 日期格式: D:YYYYMMDDHHmmSSOHH'mm'
   *
   * @param dateString - PDF 日期字符串
   * @returns Date 對象，解析失敗返回 undefined
   */
  private parsePDFDate(dateString: string): Date | undefined {
    try {
      // PDF 日期格式: D:20231201120000+08'00'
      const match = dateString.match(
        /D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/
      )
      if (!match) return undefined

      const [, year, month, day, hour, minute, second] = match
      return new Date(
        parseInt(year),
        parseInt(month) - 1, // 月份從 0 開始
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      )
    } catch {
      return undefined
    }
  }

  /**
   * 驗證是否為有效的 PDF 文件
   *
   * 檢查 PDF 文件頭 (%PDF-)
   *
   * @param buffer - 文件 Buffer
   * @returns 是否為 PDF 文件
   */
  static isPDF(buffer: Buffer): boolean {
    // PDF 文件以 "%PDF-" 開頭
    return buffer.length > 4 && buffer.toString('utf8', 0, 5) === '%PDF-'
  }
}

/**
 * 便捷函數：從 Buffer 解析 PDF
 *
 * @param buffer - PDF 文件 Buffer
 * @param options - 解析選項
 * @returns PDF 解析結果
 */
export async function parsePDF(
  buffer: Buffer,
  options?: PDFParserOptions
): Promise<PDFParseResult> {
  const parser = new PDFParser(options)
  return parser.parseFromBuffer(buffer)
}

/**
 * 便捷函數：從 Base64 解析 PDF
 *
 * @param base64 - Base64 編碼的 PDF
 * @param options - 解析選項
 * @returns PDF 解析結果
 */
export async function parsePDFFromBase64(
  base64: string,
  options?: PDFParserOptions
): Promise<PDFParseResult> {
  const parser = new PDFParser(options)
  return parser.parseFromBase64(base64)
}
