/**
 * ================================================================
 * AI銷售賦能平台 - 圖片 OCR 解析器
 * ================================================================
 *
 * 【檔案功能】
 * 使用 Tesseract.js 進行光學字符識別 (OCR)，從圖片中提取文本
 * 支持多種圖片格式 (PNG, JPG, JPEG) 和多種語言
 *
 * 【主要職責】
 * • 圖片 OCR - 從圖片中識別文字
 * • 多語言支持 - 中文、英文等多種語言
 * • 置信度分析 - 評估識別準確度
 * • 文本清理 - 移除噪音和錯誤識別
 *
 * 【使用場景】
 * • 批量上傳 - 用戶上傳圖片文件到知識庫
 * • 文檔數字化 - 掃描件轉文本
 * • 截圖處理 - 從截圖提取信息
 *
 * 【技術依賴】
 * • tesseract.js - OCR 引擎（基於 Tesseract OCR）
 * • Buffer - Node.js 二進制數據處理
 *
 * 【性能考量】
 * • OCR 處理較慢，建議非同步處理
 * • 高解析度圖片會增加處理時間
 * • 建議使用隊列系統批量處理
 *
 * 【相關檔案】
 * • lib/parsers/pdf-parser.ts - PDF 解析器
 * • lib/parsers/word-parser.ts - Word 文檔解析器
 * • lib/parsers/excel-parser.ts - Excel/CSV 解析器
 */

import { createWorker, Worker } from 'tesseract.js'

/**
 * OCR 解析結果介面
 */
export interface OCRParseResult {
  /** 提取的文本內容 */
  text: string
  /** 識別置信度 (0-100) */
  confidence: number
  /** 文本行數 */
  lines: number
  /** 識別的單詞數 */
  words: number
  /** 使用的語言 */
  language: string
  /** 文件大小（字節） */
  fileSize: number
  /** 解析耗時（毫秒） */
  parseTime: number
  /** 警告信息 */
  warnings: string[]
}

/**
 * OCR 解析器選項
 */
export interface OCRParserOptions {
  /** 最大文件大小（字節），預設 10MB（圖片建議較小） */
  maxFileSize?: number
  /** OCR 語言，預設 'chi_tra+eng' (繁體中文+英文) */
  language?: string
  /** 最小置信度閾值 (0-100)，低於此值會警告 */
  minConfidence?: number
  /** 是否進行圖片預處理，預設 true */
  preprocessImage?: boolean
}

/**
 * 支持的 OCR 語言
 */
export const OCRLanguages = {
  CHINESE_TRADITIONAL: 'chi_tra',
  CHINESE_SIMPLIFIED: 'chi_sim',
  ENGLISH: 'eng',
  JAPANESE: 'jpn',
  KOREAN: 'kor',
  /** 中英混合（繁體） */
  ZH_TW_EN: 'chi_tra+eng',
  /** 中英混合（簡體） */
  ZH_CN_EN: 'chi_sim+eng',
} as const

/**
 * 圖片 OCR 解析器類
 *
 * 提供圖片 OCR 文字識別功能
 *
 * @example
 * ```ts
 * const parser = new ImageOCRParser({ language: 'chi_tra+eng' })
 * const result = await parser.parseFromBuffer(imageBuffer)
 * console.log(result.text) // 識別的文本
 * console.log(result.confidence) // 識別置信度
 * ```
 */
export class ImageOCRParser {
  private options: Required<OCRParserOptions>
  private worker: Worker | null = null

  constructor(options: OCRParserOptions = {}) {
    this.options = {
      maxFileSize: options.maxFileSize ?? 10 * 1024 * 1024, // 10MB
      language: options.language ?? OCRLanguages.ZH_TW_EN,
      minConfidence: options.minConfidence ?? 60,
      preprocessImage: options.preprocessImage ?? true,
    }
  }

  /**
   * 初始化 Tesseract Worker
   *
   * Worker 會被重用以提升性能
   */
  private async initWorker(): Promise<Worker> {
    if (this.worker) {
      return this.worker
    }

    const worker = await createWorker(this.options.language, 1, {
      logger: (m) => {
        // 可以添加日誌記錄
        if (m.status === 'recognizing text') {
          // console.log(`OCR 進度: ${(m.progress * 100).toFixed(0)}%`)
        }
      },
    })

    this.worker = worker
    return worker
  }

  /**
   * 從 Buffer 解析圖片（OCR）
   *
   * @param buffer - 圖片文件的 Buffer 數據
   * @param filename - 文件名（可選，用於錯誤提示）
   * @returns OCR 解析結果
   * @throws Error 如果文件過大或 OCR 失敗
   */
  async parseFromBuffer(
    buffer: Buffer,
    filename?: string
  ): Promise<OCRParseResult> {
    const startTime = Date.now()

    // 驗證文件大小
    if (buffer.length > this.options.maxFileSize) {
      throw new Error(
        `圖片文件過大: ${(buffer.length / 1024 / 1024).toFixed(2)}MB ` +
        `(最大允許: ${(this.options.maxFileSize / 1024 / 1024).toFixed(2)}MB)`
      )
    }

    try {
      // 初始化 Worker
      const worker = await this.initWorker()

      // 執行 OCR 識別
      const result = await worker.recognize(buffer)
      const { text, confidence } = result.data
      const lines = (result.data as any).lines
      const words = (result.data as any).words

      // 清理文本
      const cleanedText = this.cleanText(text)

      const parseTime = Date.now() - startTime

      // 檢查置信度
      const warnings: string[] = []
      if (confidence < this.options.minConfidence) {
        warnings.push(
          `識別置信度較低: ${confidence.toFixed(2)}% ` +
          `(建議 ≥ ${this.options.minConfidence}%)`
        )
      }

      if (cleanedText.length < 10) {
        warnings.push('識別文本過短，可能為空白或低質量圖片')
      }

      return {
        text: cleanedText,
        confidence,
        lines: lines.length,
        words: words.length,
        language: this.options.language,
        fileSize: buffer.length,
        parseTime,
        warnings,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤'
      throw new Error(
        `OCR識別失敗${filename ? ` (${filename})` : ''}: ${errorMessage}`
      )
    }
  }

  /**
   * 從 Base64 字符串解析圖片（OCR）
   *
   * @param base64 - Base64 編碼的圖片數據
   * @param filename - 文件名（可選）
   * @returns OCR 解析結果
   */
  async parseFromBase64(
    base64: string,
    filename?: string
  ): Promise<OCRParseResult> {
    // 移除 data:image/xxx;base64, 前綴（如有）
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    return this.parseFromBuffer(buffer, filename)
  }

  /**
   * 清理提取的文本
   *
   * 移除 OCR 常見的噪音字符和多餘空白
   *
   * @param text - 原始 OCR 文本
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
      // 移除 OCR 常見噪音字符
      .replace(/[­\u00AD\u200B-\u200D\uFEFF]/g, '')
  }

  /**
   * 終止 Worker
   *
   * 釋放資源，建議在不再需要 OCR 時調用
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
  }

  /**
   * 驗證是否為支持的圖片格式
   *
   * 檢查 PNG, JPEG, GIF 等常見圖片格式
   *
   * @param buffer - 文件 Buffer
   * @returns 是否為圖片文件
   */
  static isImage(buffer: Buffer): boolean {
    if (buffer.length < 4) return false

    // PNG: 89 50 4E 47
    const isPNG =
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47

    // JPEG: FF D8 FF
    const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff

    // GIF: 47 49 46 38
    const isGIF =
      buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38

    return isPNG || isJPEG || isGIF
  }

  /**
   * 獲取圖片 MIME 類型
   *
   * @param buffer - 文件 Buffer
   * @returns MIME 類型，未知返回 undefined
   */
  static getImageMimeType(buffer: Buffer): string | undefined {
    if (buffer.length < 4) return undefined

    // PNG
    if (
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
    ) {
      return 'image/png'
    }

    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg'
    }

    // GIF
    if (
      buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38
    ) {
      return 'image/gif'
    }

    return undefined
  }
}

/**
 * 便捷函數：從 Buffer 進行 OCR 識別
 *
 * @param buffer - 圖片文件 Buffer
 * @param options - OCR 選項
 * @returns OCR 解析結果
 */
export async function parseImageOCR(
  buffer: Buffer,
  options?: OCRParserOptions
): Promise<OCRParseResult> {
  const parser = new ImageOCRParser(options)
  try {
    return await parser.parseFromBuffer(buffer)
  } finally {
    // 確保 Worker 被終止
    await parser.terminate()
  }
}

/**
 * 便捷函數：從 Base64 進行 OCR 識別
 *
 * @param base64 - Base64 編碼的圖片數據
 * @param options - OCR 選項
 * @returns OCR 解析結果
 */
export async function parseImageOCRFromBase64(
  base64: string,
  options?: OCRParserOptions
): Promise<OCRParseResult> {
  const parser = new ImageOCRParser(options)
  try {
    return await parser.parseFromBase64(base64)
  } finally {
    // 確保 Worker 被終止
    await parser.terminate()
  }
}
