/**
 * mammoth 套件的 TypeScript 類型定義
 *
 * @description 為 mammoth@1.11.0 提供基本的類型支持
 * @see https://github.com/mwilliamson/mammoth.js
 */

declare module 'mammoth' {
  /**
   * 文檔轉換結果接口
   */
  export interface Result<T> {
    /** 轉換後的值 */
    value: T
    /** 轉換過程中的消息 */
    messages: Message[]
  }

  /**
   * 轉換消息接口
   */
  export interface Message {
    /** 消息類型 */
    type: 'error' | 'warning' | 'info'
    /** 消息內容 */
    message: string
  }

  /**
   * 圖片元素接口
   */
  export interface ImageElement {
    /** 讀取圖片數據 */
    read(encoding: 'base64' | 'buffer'): Promise<string | Buffer>
    /** 圖片內容類型 */
    contentType: string
  }

  /**
   * 圖片轉換結果接口
   */
  export interface ImageConvertResult {
    /** 圖片來源 URL 或 Data URI */
    src: string
  }

  /**
   * 圖片轉換器函數類型
   */
  export type ConvertImage = (
    element: ImageElement
  ) => Promise<ImageConvertResult> | ImageConvertResult

  /**
   * mammoth 選項接口
   */
  export interface Options {
    /** 自定義樣式映射 */
    styleMap?: string | string[]
    /** 圖片轉換器 */
    convertImage?: ConvertImage
    /** 是否忽略空段落 */
    ignoreEmptyParagraphs?: boolean
    /** 自定義文檔轉換器 */
    transformDocument?: (document: any) => any
    /** 包含預設樣式映射 */
    includeDefaultStyleMap?: boolean
    /** 包含嵌入樣式映射 */
    includeEmbeddedStyleMap?: boolean
  }

  /**
   * 文檔輸入接口
   */
  export interface DocumentInput {
    /** Buffer 數據 */
    buffer?: Buffer
    /** 文件路徑 */
    path?: string
    /** ArrayBuffer 數據 */
    arrayBuffer?: ArrayBuffer
  }

  /**
   * 圖片轉換器命名空間
   */
  export namespace images {
    /**
     * 創建內聯圖片轉換器
     * @param converter - 圖片轉換函數
     */
    export function inline(converter: ConvertImage): ConvertImage

    /**
     * Base64 圖片轉換器（預設行為）
     */
    export const imgElement: ConvertImage
  }

  /**
   * 提取原始文本
   *
   * @param input - 文檔輸入（buffer 或 path）
   * @returns 包含文本的 Result 對象
   */
  export function extractRawText(
    input: DocumentInput
  ): Promise<Result<string>>

  /**
   * 轉換為 HTML
   *
   * @param input - 文檔輸入（buffer 或 path，可包含options）
   * @returns 包含 HTML 的 Result 對象
   */
  export function convertToHtml(
    input: DocumentInput & Options
  ): Promise<Result<string>>

  /**
   * 轉換為 Markdown
   *
   * @param input - 文檔輸入（buffer 或 path）
   * @param options - mammoth 選項（可選）
   * @returns 包含 Markdown 的 Result 對象
   */
  export function convertToMarkdown(
    input: DocumentInput,
    options?: Options
  ): Promise<Result<string>>

  /**
   * 提取樣式映射
   *
   * @param input - 文檔輸入（buffer 或 path）
   * @returns 樣式映射字符串
   */
  export function extractStyleMap(input: DocumentInput): Promise<string>
}
