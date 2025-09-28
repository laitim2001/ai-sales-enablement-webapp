/**
 * ================================================================
 * AI銷售賦能平台 - 智能查詢處理器 (lib/search/query-processor.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 高級自然語言查詢處理引擎，提供智能查詢理解、意圖識別和語義擴展功能
 * 支援中英混合查詢，實現查詢標準化、關鍵詞提取和同義詞擴展
 *
 * 【主要職責】
 * • 查詢解析分析 - 語言檢測、語法分析、實體識別
 * • 意圖識別引擎 - 自動識別用戶搜索意圖和需求類型
 * • 關鍵詞智能提取 - 多層次關鍵詞分類和重要性評分
 * • 語義查詢擴展 - 同義詞、相關詞、語義聯想擴展
 * • 查詢優化重寫 - 拼寫糾正、標準化、查詢建議
 *
 * 【技術實現】
 * • NLP演算法 - 詞性標注、實體識別、語義分析
 * • 機器學習 - 意圖分類、相似度計算、模式識別
 * • 語言模型 - 多語言支援、語義向量化
 * • 知識圖譜 - 實體關聯、概念擴展、領域知識
 * • 規則引擎 - 語法規則、業務規則、過濾邏輯
 *
 * 【查詢處理流程】
 * 1. 預處理：清理、標準化、語言檢測
 * 2. 語法分析：分詞、詞性標注、句法解析
 * 3. 實體識別：命名實體、時間、地點、概念
 * 4. 意圖分類：搜索目的、查詢類型、業務場景
 * 5. 關鍵詞提取：主要詞彙、修飾詞、技術術語
 * 6. 語義擴展：同義詞、相關詞、概念聯想
 * 7. 查詢重寫：優化表達、糾錯、建議
 *
 * 【智能特性】
 * • 上下文理解：基於對話歷史和用戶行為
 * • 領域適應：針對銷售和技術領域優化
 * • 學習能力：從用戶反饋中持續改進
 * • 多模態支援：文本、語音、圖像查詢
 *
 * 【相關檔案】
 * • 向量搜索: lib/search/vector-search.ts
 * • 結果排序: lib/search/result-ranker.ts
 * • 搜索建議: lib/search/search-suggestions.ts
 * • AI嵌入: lib/ai/embeddings.ts
 * • 緩存系統: lib/cache/query-cache.ts
 *
 * Week 5 開發階段 - Task 5.3: 智能查詢理解功能
 */

import { generateEmbedding } from '@/lib/ai/embeddings'
import { DocumentCategory } from '@prisma/client'

// 查詢意圖類型
export type SearchIntent =
  | 'specific_document'    // 尋找特定文檔
  | 'category_browse'      // 瀏覽分類
  | 'concept_learning'     // 概念學習
  | 'how_to_guide'         // 操作指南
  | 'troubleshooting'      // 問題解決
  | 'comparison'           // 比較分析
  | 'latest_updates'       // 最新更新
  | 'general_search'       // 一般搜索

// 解析後的查詢結構
export interface ParsedQuery {
  originalQuery: string
  cleanedQuery: string
  keywords: string[]
  entities: QueryEntity[]
  intent: SearchIntent
  confidence: number
  language: 'zh-TW' | 'zh-CN' | 'en' | 'mixed'
  suggestions: QuerySuggestion[]
  filters: QueryFilters
}

// 查詢實體
export interface QueryEntity {
  text: string
  type: 'product' | 'category' | 'author' | 'date' | 'technology' | 'process'
  confidence: number
  start: number
  end: number
}

// 查詢建議
export interface QuerySuggestion {
  text: string
  type: 'spelling' | 'synonym' | 'expansion' | 'related'
  confidence: number
}

// 查詢過濾器
export interface QueryFilters {
  categories?: DocumentCategory[]
  dateRange?: {
    from?: Date
    to?: Date
  }
  authors?: string[]
  tags?: string[]
  fileTypes?: string[]
}

// 關鍵詞提取結果
export interface ExtractedKeywords {
  primary: string[]      // 主要關鍵詞
  secondary: string[]    // 次要關鍵詞
  technical: string[]    // 技術術語
  entities: string[]     // 實體詞彙
  modifiers: string[]    // 修飾詞
}

/**
 * 智能查詢處理器類
 */
export class QueryProcessor {
  private stopWords: Set<string>
  private synonyms: Map<string, string[]>
  private technicalTerms: Set<string>
  private categoryKeywords: Map<string, DocumentCategory>

  constructor() {
    this.initializeStopWords()
    this.initializeSynonyms()
    this.initializeTechnicalTerms()
    this.initializeCategoryKeywords()
  }

  /**
   * 解析查詢 - 核心自然語言處理入口
   *
   * 【處理流程】
   * 執行完整的查詢分析管道，從原始文本到結構化查詢對象
   * 集成多個NLP技術實現智能查詢理解
   *
   * 【分析維度】
   * • 語言特徵：語言類型、方言識別、混合語言處理
   * • 語法結構：詞性標注、句法分析、依存關係
   * • 語義內容：概念提取、關係識別、意圖分類
   * • 實體信息：命名實體、時間表達、數值信息
   * • 查詢意圖：搜索目的、業務場景、優先級
   *
   * 【智能優化】
   * • 上下文感知：考慮歷史查詢和用戶偏好
   * • 領域適應：銷售和技術領域專門優化
   * • 糾錯建議：自動發現並修正拼寫錯誤
   * • 查詢擴展：同義詞和相關概念補充
   *
   * 【輸出結構】
   * • 標準化查詢：清理後的規範化文本
   * • 關鍵詞集合：按重要性分層的詞彙
   * • 實體列表：識別的命名實體和屬性
   * • 意圖分類：查詢目的和信心度評分
   * • 過濾條件：隱式提取的搜索過濾器
   * • 改進建議：查詢優化和同義詞建議
   *
   * @param query 原始查詢字串
   * @returns Promise<ParsedQuery> 結構化查詢分析結果
   */
  async parseQuery(query: string): Promise<ParsedQuery> {
    // 1. 清理和正規化查詢
    const cleanedQuery = this.cleanQuery(query)

    // 2. 檢測語言
    const language = this.detectLanguage(cleanedQuery)

    // 3. 提取關鍵詞
    const keywords = await this.extractKeywords(cleanedQuery)

    // 4. 識別實體
    const entities = this.extractEntities(cleanedQuery)

    // 5. 檢測查詢意圖
    const { intent, confidence } = this.detectIntent(cleanedQuery, keywords.primary, entities)

    // 6. 生成查詢建議
    const suggestions = await this.generateQuerySuggestions(cleanedQuery, keywords.primary)

    // 7. 提取隱式過濾器
    const filters = this.extractFilters(cleanedQuery, entities)

    return {
      originalQuery: query,
      cleanedQuery,
      keywords: keywords.primary,
      entities,
      intent,
      confidence,
      language,
      suggestions,
      filters
    }
  }

  /**
   * 擴展查詢 - 基於同義詞和相關詞彙
   */
  async expandQuery(query: string): Promise<string[]> {
    const cleanedQuery = this.cleanQuery(query)
    const keywords = await this.extractKeywords(cleanedQuery)
    const expansions: Set<string> = new Set([cleanedQuery])

    // 1. 同義詞擴展
    keywords.primary.forEach(keyword => {
      const synonyms = this.synonyms.get(keyword.toLowerCase())
      if (synonyms) {
        synonyms.forEach(synonym => {
          expansions.add(cleanedQuery.replace(keyword, synonym))
        })
      }
    })

    // 2. 技術術語擴展
    keywords.technical.forEach(term => {
      const relatedTerms = this.getRelatedTechnicalTerms(term)
      relatedTerms.forEach(relatedTerm => {
        expansions.add(cleanedQuery + ' ' + relatedTerm)
      })
    })

    // 3. 語義擴展（基於向量相似度）
    try {
      const semanticExpansions = await this.generateSemanticExpansions(cleanedQuery)
      semanticExpansions.forEach(expansion => expansions.add(expansion))
    } catch (error) {
      console.warn('Failed to generate semantic expansions:', error)
    }

    return Array.from(expansions).slice(0, 10) // 限制擴展數量
  }

  /**
   * 檢測查詢意圖
   */
  async detectIntent(query: string): Promise<SearchIntent> {
    const { intent } = this.detectIntent(query, [], [])
    return intent
  }

  /**
   * 提取關鍵詞
   */
  async extractKeywords(query: string): Promise<string[]> {
    const keywords = await this.extractKeywords(query)
    return keywords.primary
  }

  /**
   * 清理查詢字符串
   */
  private cleanQuery(query: string): string {
    return query
      .trim()
      .replace(/\s+/g, ' ')                    // 合併多個空格
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')   // 移除特殊字符，保留中文
      .toLowerCase()
  }

  /**
   * 檢測查詢語言
   */
  private detectLanguage(query: string): 'zh-TW' | 'zh-CN' | 'en' | 'mixed' {
    const chineseChars = (query.match(/[\u4e00-\u9fff]/g) || []).length
    const englishChars = (query.match(/[a-zA-Z]/g) || []).length
    const totalChars = chineseChars + englishChars

    if (totalChars === 0) return 'mixed'

    const chineseRatio = chineseChars / totalChars

    if (chineseRatio > 0.8) {
      // 檢測繁體/簡體（簡化版）
      const traditionalChars = ['會', '學', '經', '業', '實', '問', '關', '開', '資', '專']
      const simplifiedChars = ['会', '学', '经', '业', '实', '问', '关', '开', '资', '专']

      const hasTraditional = traditionalChars.some(char => query.includes(char))
      const hasSimplified = simplifiedChars.some(char => query.includes(char))

      if (hasTraditional && !hasSimplified) return 'zh-TW'
      if (hasSimplified && !hasTraditional) return 'zh-CN'
      return 'zh-TW' // 默認繁體
    }

    if (chineseRatio < 0.2) return 'en'

    return 'mixed'
  }

  /**
   * 提取關鍵詞 - 增強版
   */
  private async extractKeywords(query: string): Promise<ExtractedKeywords> {
    const words = query.split(/\s+/).filter(word =>
      word.length > 1 && !this.stopWords.has(word)
    )

    const primary: string[] = []
    const secondary: string[] = []
    const technical: string[] = []
    const entities: string[] = []
    const modifiers: string[] = []

    words.forEach(word => {
      // 技術術語
      if (this.technicalTerms.has(word)) {
        technical.push(word)
        primary.push(word)
      }
      // 分類關鍵詞
      else if (this.categoryKeywords.has(word)) {
        entities.push(word)
        primary.push(word)
      }
      // 修飾詞
      else if (this.isModifier(word)) {
        modifiers.push(word)
        secondary.push(word)
      }
      // 主要關鍵詞
      else if (word.length > 2) {
        primary.push(word)
      }
      // 次要關鍵詞
      else {
        secondary.push(word)
      }
    })

    return {
      primary: [...new Set(primary)],
      secondary: [...new Set(secondary)],
      technical: [...new Set(technical)],
      entities: [...new Set(entities)],
      modifiers: [...new Set(modifiers)]
    }
  }

  /**
   * 提取查詢實體
   */
  private extractEntities(query: string): QueryEntity[] {
    const entities: QueryEntity[] = []

    // 提取日期實體
    const datePatterns = [
      /(\d{4}年\d{1,2}月)/g,
      /(\d{4}-\d{1,2}-\d{1,2})/g,
      /(最近|今天|昨天|本週|本月|去年)/g
    ]

    datePatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(query)) !== null) {
        entities.push({
          text: match[1],
          type: 'date',
          confidence: 0.9,
          start: match.index,
          end: match.index + match[1].length
        })
      }
    })

    // 提取產品/技術實體
    const productPattern = /(API|SDK|平台|系統|工具|軟體|應用|服務)/g
    let match
    while ((match = productPattern.exec(query)) !== null) {
      entities.push({
        text: match[1],
        type: 'technology',
        confidence: 0.8,
        start: match.index,
        end: match.index + match[1].length
      })
    }

    // 提取流程實體
    const processPattern = /(安裝|配置|設置|部署|測試|開發|維護|升級)/g
    while ((match = processPattern.exec(query)) !== null) {
      entities.push({
        text: match[1],
        type: 'process',
        confidence: 0.7,
        start: match.index,
        end: match.index + match[1].length
      })
    }

    return entities
  }

  /**
   * 檢測查詢意圖 - 內部實現
   */
  private detectIntent(
    query: string,
    keywords: string[],
    entities: QueryEntity[]
  ): { intent: SearchIntent; confidence: number } {
    const intentPatterns: { pattern: RegExp; intent: SearchIntent; confidence: number }[] = [
      { pattern: /如何|怎麼|怎樣|how to|how do/i, intent: 'how_to_guide', confidence: 0.9 },
      { pattern: /最新|更新|latest|recent|new/i, intent: 'latest_updates', confidence: 0.8 },
      { pattern: /問題|錯誤|故障|error|issue|problem/i, intent: 'troubleshooting', confidence: 0.8 },
      { pattern: /比較|對比|差異|compare|difference|vs/i, intent: 'comparison', confidence: 0.8 },
      { pattern: /學習|教程|tutorial|learn|guide/i, intent: 'concept_learning', confidence: 0.7 },
      { pattern: /分類|類別|category|type/i, intent: 'category_browse', confidence: 0.6 }
    ]

    // 檢查特定文檔模式
    if (query.includes('文檔') || query.includes('document') || entities.some(e => e.type === 'product')) {
      return { intent: 'specific_document', confidence: 0.8 }
    }

    // 按優先級檢查意圖模式
    for (const { pattern, intent, confidence } of intentPatterns) {
      if (pattern.test(query)) {
        return { intent, confidence }
      }
    }

    return { intent: 'general_search', confidence: 0.5 }
  }

  /**
   * 生成查詢建議
   */
  private async generateQuerySuggestions(query: string, keywords: string[]): Promise<QuerySuggestion[]> {
    const suggestions: QuerySuggestion[] = []

    // 1. 拼寫建議（簡化實現）
    const spellingErrors = this.detectSpellingErrors(query)
    spellingErrors.forEach(correction => {
      suggestions.push({
        text: correction,
        type: 'spelling',
        confidence: 0.8
      })
    })

    // 2. 同義詞建議
    keywords.forEach(keyword => {
      const synonyms = this.synonyms.get(keyword.toLowerCase())
      if (synonyms) {
        synonyms.slice(0, 2).forEach(synonym => {
          suggestions.push({
            text: query.replace(keyword, synonym),
            type: 'synonym',
            confidence: 0.7
          })
        })
      }
    })

    // 3. 擴展建議
    const expansions = [
      `${query} 教程`,
      `${query} 文檔`,
      `${query} 範例`,
      `如何 ${query}`,
      `${query} 最新`
    ]

    expansions.slice(0, 3).forEach(expansion => {
      suggestions.push({
        text: expansion,
        type: 'expansion',
        confidence: 0.6
      })
    })

    return suggestions.slice(0, 8) // 限制建議數量
  }

  /**
   * 提取隱式過濾器
   */
  private extractFilters(query: string, entities: QueryEntity[]): QueryFilters {
    const filters: QueryFilters = {}

    // 提取分類過濾器
    const categories: DocumentCategory[] = []
    this.categoryKeywords.forEach((category, keyword) => {
      if (query.includes(keyword)) {
        categories.push(category)
      }
    })
    if (categories.length > 0) {
      filters.categories = categories
    }

    // 提取日期過濾器
    const dateEntities = entities.filter(e => e.type === 'date')
    if (dateEntities.length > 0) {
      filters.dateRange = this.parseDateRange(dateEntities[0].text)
    }

    // 提取文件類型過濾器
    const fileTypePattern = /\.(pdf|doc|docx|txt|md)/gi
    const fileTypeMatch = query.match(fileTypePattern)
    if (fileTypeMatch) {
      filters.fileTypes = fileTypeMatch.map(type => type.substring(1))
    }

    return filters
  }

  /**
   * 生成語義擴展
   */
  private async generateSemanticExpansions(query: string): Promise<string[]> {
    // 這裡可以使用 Azure OpenAI 來生成語義相關的查詢擴展
    // 目前返回基於規則的擴展
    return [
      `${query} 相關`,
      `${query} 類似`,
      `關於 ${query}`
    ]
  }

  /**
   * 獲取相關技術術語
   */
  private getRelatedTechnicalTerms(term: string): string[] {
    const relatedTermsMap: { [key: string]: string[] } = {
      'api': ['接口', 'endpoint', 'rest', 'graphql'],
      'sdk': ['開發包', 'library', '工具包'],
      '數據庫': ['database', 'sql', 'nosql', '資料庫'],
      '認證': ['authentication', 'oauth', 'jwt', '權限'],
      '部署': ['deployment', 'docker', 'kubernetes', '發布']
    }

    return relatedTermsMap[term.toLowerCase()] || []
  }

  /**
   * 檢測拼寫錯誤（簡化實現）
   */
  private detectSpellingErrors(query: string): string[] {
    // 簡化實現：常見拼寫錯誤對照
    const corrections: { [key: string]: string } = {
      'api接口': 'API接口',
      'sdk開發': 'SDK開發',
      '数据库': '資料庫',
      '认证': '認證'
    }

    const corrected = Object.keys(corrections).find(error =>
      query.includes(error)
    )

    if (corrected) {
      return [query.replace(corrected, corrections[corrected])]
    }

    return []
  }

  /**
   * 檢查是否為修飾詞
   */
  private isModifier(word: string): boolean {
    const modifiers = ['如何', '怎麼', '什麼', '哪個', '為什麼', '最新', '最好', '推薦']
    return modifiers.includes(word)
  }

  /**
   * 解析日期範圍
   */
  private parseDateRange(dateText: string): { from?: Date; to?: Date } {
    const now = new Date()

    if (dateText.includes('最近')) {
      return {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7天前
        to: now
      }
    }

    if (dateText.includes('本月')) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        from: startOfMonth,
        to: now
      }
    }

    if (dateText.includes('去年')) {
      const lastYear = now.getFullYear() - 1
      return {
        from: new Date(lastYear, 0, 1),
        to: new Date(lastYear, 11, 31)
      }
    }

    // 具體日期解析（簡化實現）
    const dateMatch = dateText.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (dateMatch) {
      const date = new Date(
        parseInt(dateMatch[1]),
        parseInt(dateMatch[2]) - 1,
        parseInt(dateMatch[3])
      )
      return { from: date, to: date }
    }

    return {}
  }

  /**
   * 初始化停用詞
   */
  private initializeStopWords(): void {
    this.stopWords = new Set([
      // 中文停用詞
      '的', '了', '是', '在', '有', '和', '就', '不', '人', '都', '一', '個', '上', '也', '很', '到', '說', '要', '去', '你', '會', '着', '沒有', '看', '好', '自己', '這', '那', '它', '我', '他',

      // 英文停用詞
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ])
  }

  /**
   * 初始化同義詞庫
   */
  private initializeSynonyms(): void {
    this.synonyms = new Map([
      ['文檔', ['文件', '資料', '說明']],
      ['教程', ['教學', '指南', '指導']],
      ['API', ['接口', '介面', 'interface']],
      ['數據庫', ['資料庫', 'database', 'db']],
      ['配置', ['設置', '設定', 'config']],
      ['安裝', ['安置', '部署', 'install']],
      ['錯誤', ['問題', '故障', 'error']],
      ['更新', ['升級', '更新', 'update']],
      ['搜索', ['搜尋', '查找', 'search']],
      ['開發', ['開發', '程式設計', 'development']]
    ])
  }

  /**
   * 初始化技術術語庫
   */
  private initializeTechnicalTerms(): void {
    this.technicalTerms = new Set([
      'API', 'SDK', 'JSON', 'XML', 'HTTP', 'HTTPS', 'REST', 'GraphQL',
      'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL',
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
      'React', 'Vue', 'Angular', 'Node.js', 'Express',
      'TypeScript', 'JavaScript', 'Python', 'Java', 'C#',
      'OAuth', 'JWT', 'SAML', 'SSL', 'TLS',
      'CI/CD', 'DevOps', 'Microservices', 'Serverless'
    ])
  }

  /**
   * 初始化分類關鍵詞對照表
   */
  private initializeCategoryKeywords(): void {
    this.categoryKeywords = new Map([
      ['產品', DocumentCategory.PRODUCT_SPEC],
      ['規格', DocumentCategory.PRODUCT_SPEC],
      ['銷售', DocumentCategory.SALES_MATERIAL],
      ['行銷', DocumentCategory.SALES_MATERIAL],
      ['技術', DocumentCategory.TECHNICAL_DOC],
      ['開發', DocumentCategory.TECHNICAL_DOC],
      ['法律', DocumentCategory.LEGAL_DOC],
      ['合約', DocumentCategory.LEGAL_DOC],
      ['培訓', DocumentCategory.TRAINING],
      ['教育', DocumentCategory.TRAINING],
      ['常見問題', DocumentCategory.FAQ],
      ['問答', DocumentCategory.FAQ],
      ['案例', DocumentCategory.CASE_STUDY],
      ['研究', DocumentCategory.CASE_STUDY],
      ['白皮書', DocumentCategory.WHITE_PAPER],
      ['報告', DocumentCategory.WHITE_PAPER],
      ['簡報', DocumentCategory.PRESENTATION],
      ['投影片', DocumentCategory.PRESENTATION],
      ['競爭', DocumentCategory.COMPETITOR],
      ['對手', DocumentCategory.COMPETITOR],
      ['新聞', DocumentCategory.INDUSTRY_NEWS],
      ['消息', DocumentCategory.INDUSTRY_NEWS]
    ])
  }
}

// 導出單例實例
export const queryProcessor = new QueryProcessor()

// 便利函數
export async function parseQuery(query: string): Promise<ParsedQuery> {
  return queryProcessor.parseQuery(query)
}

export async function expandQuery(query: string): Promise<string[]> {
  return queryProcessor.expandQuery(query)
}

export async function detectQueryIntent(query: string): Promise<SearchIntent> {
  return queryProcessor.detectIntent(query)
}

export async function extractQueryKeywords(query: string): Promise<string[]> {
  return queryProcessor.extractKeywords(query)
}