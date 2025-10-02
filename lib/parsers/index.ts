/**
 * ================================================================
 * AI銷售賦能平台 - 文件解析器統一導出
 * ================================================================
 *
 * 【檔案功能】
 * 統一導出所有文件解析器，提供便捷的文件類型檢測和自動解析功能
 *
 * 【支持格式】
 * • PDF - pdf-parse
 * • Word - mammoth (.docx, .doc)
 * • Excel - xlsx (.xlsx, .xls, .csv)
 * • 圖片 - tesseract.js (PNG, JPG, JPEG)
 *
 * 【使用示例】
 * ```ts
 * import { detectFileType, parseFile } from '@/lib/parsers'
 *
 * const buffer = await readFile('document.pdf')
 * const type = detectFileType(buffer, 'document.pdf')
 * const result = await parseFile(buffer, type)
 * console.log(result.text)
 * ```
 */

// 導出所有解析器
export * from './pdf-parser'
export * from './word-parser'
export * from './excel-parser'
export * from './image-ocr-parser'

import { PDFParser } from './pdf-parser'
import { WordParser } from './word-parser'
import { ExcelParser } from './excel-parser'
import { ImageOCRParser } from './image-ocr-parser'

/**
 * 支持的文件類型枚舉
 */
export enum FileType {
  PDF = 'pdf',
  WORD = 'word',
  EXCEL = 'excel',
  CSV = 'csv',
  IMAGE = 'image',
  UNKNOWN = 'unknown',
}

/**
 * 文件類型檢測結果
 */
export interface FileTypeResult {
  /** 文件類型 */
  type: FileType
  /** MIME 類型 */
  mimeType: string
  /** 文件擴展名 */
  extension?: string
}

/**
 * 通用解析結果介面
 */
export interface ParseResult {
  /** 提取的文本內容 */
  text: string
  /** 文件類型 */
  fileType: FileType
  /** 文件大小（字節） */
  fileSize: number
  /** 解析耗時（毫秒） */
  parseTime: number
  /** 額外元數據（視文件類型而定） */
  metadata?: Record<string, any>
  /** 警告信息 */
  warnings?: string[]
}

/**
 * 從文件擴展名推斷文件類型
 *
 * @param filename - 文件名
 * @returns 文件類型
 */
export function getFileTypeFromExtension(filename: string): FileType {
  const ext = filename.toLowerCase().split('.').pop() || ''

  switch (ext) {
    case 'pdf':
      return FileType.PDF

    case 'doc':
    case 'docx':
      return FileType.WORD

    case 'xls':
    case 'xlsx':
      return FileType.EXCEL

    case 'csv':
      return FileType.CSV

    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return FileType.IMAGE

    default:
      return FileType.UNKNOWN
  }
}

/**
 * 從 Buffer 檢測文件類型
 *
 * 通過文件頭魔數檢測實際文件類型
 *
 * @param buffer - 文件 Buffer
 * @param filename - 文件名（可選，用於輔助判斷）
 * @returns 文件類型檢測結果
 */
export function detectFileType(
  buffer: Buffer,
  filename?: string
): FileTypeResult {
  // 優先通過文件頭檢測
  if (PDFParser.isPDF(buffer)) {
    return {
      type: FileType.PDF,
      mimeType: 'application/pdf',
      extension: 'pdf',
    }
  }

  if (WordParser.isWord(buffer)) {
    // 區分 .doc 和 .docx
    const isDOCX = buffer[0] === 0x50 && buffer[1] === 0x4b
    return {
      type: FileType.WORD,
      mimeType: isDOCX
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/msword',
      extension: isDOCX ? 'docx' : 'doc',
    }
  }

  if (ExcelParser.isExcel(buffer)) {
    // 區分 .xls 和 .xlsx
    const isXLSX = buffer[0] === 0x50 && buffer[1] === 0x4b
    return {
      type: FileType.EXCEL,
      mimeType: isXLSX
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/vnd.ms-excel',
      extension: isXLSX ? 'xlsx' : 'xls',
    }
  }

  if (ImageOCRParser.isImage(buffer)) {
    const mimeType = ImageOCRParser.getImageMimeType(buffer)
    const extension = mimeType?.split('/')[1]
    return {
      type: FileType.IMAGE,
      mimeType: mimeType || 'image/unknown',
      extension,
    }
  }

  // 如果文件頭檢測失敗，嘗試從文件名推斷
  if (filename) {
    const typeFromExt = getFileTypeFromExtension(filename)
    if (typeFromExt === FileType.CSV) {
      return {
        type: FileType.CSV,
        mimeType: 'text/csv',
        extension: 'csv',
      }
    }
  }

  // 無法識別
  return {
    type: FileType.UNKNOWN,
    mimeType: 'application/octet-stream',
  }
}

/**
 * 自動解析文件
 *
 * 根據文件類型自動選擇合適的解析器
 *
 * @param buffer - 文件 Buffer
 * @param fileType - 文件類型（可選，不提供則自動檢測）
 * @param filename - 文件名（可選）
 * @returns 通用解析結果
 * @throws Error 如果文件類型不支持或解析失敗
 */
export async function parseFile(
  buffer: Buffer,
  fileType?: FileType,
  filename?: string
): Promise<ParseResult> {
  // 自動檢測文件類型
  const detectedType = fileType || detectFileType(buffer, filename).type

  // 根據文件類型選擇解析器
  switch (detectedType) {
    case FileType.PDF: {
      const result = await new PDFParser().parseFromBuffer(buffer, filename)
      return {
        text: result.text,
        fileType: FileType.PDF,
        fileSize: result.fileSize,
        parseTime: result.parseTime,
        metadata: result.metadata,
      }
    }

    case FileType.WORD: {
      const result = await new WordParser().parseFromBuffer(buffer, filename)
      return {
        text: result.text,
        fileType: FileType.WORD,
        fileSize: result.fileSize,
        parseTime: result.parseTime,
        metadata: result.metadata,
        warnings: result.warnings,
      }
    }

    case FileType.EXCEL:
    case FileType.CSV: {
      const result = await new ExcelParser().parseFromBuffer(buffer, filename)
      return {
        text: result.text,
        fileType: detectedType,
        fileSize: result.fileSize,
        parseTime: result.parseTime,
        metadata: result.metadata,
      }
    }

    case FileType.IMAGE: {
      const parser = new ImageOCRParser()
      try {
        const result = await parser.parseFromBuffer(buffer, filename)
        return {
          text: result.text,
          fileType: FileType.IMAGE,
          fileSize: result.fileSize,
          parseTime: result.parseTime,
          metadata: {
            confidence: result.confidence,
            language: result.language,
            lines: result.lines,
            words: result.words,
          },
          warnings: result.warnings,
        }
      } finally {
        await parser.terminate()
      }
    }

    default:
      throw new Error(
        `不支持的文件類型: ${detectedType}${filename ? ` (${filename})` : ''}`
      )
  }
}

/**
 * 批量解析文件
 *
 * 並行解析多個文件，提升處理效率
 *
 * @param files - 文件 Buffer 數組
 * @param filenames - 文件名數組（可選，與 files 一一對應）
 * @returns 解析結果數組
 */
export async function parseFiles(
  files: Buffer[],
  filenames?: string[]
): Promise<ParseResult[]> {
  return Promise.all(
    files.map((buffer, index) => {
      const filename = filenames?.[index]
      return parseFile(buffer, undefined, filename)
    })
  )
}
