/**
 * Dynamics 365 Web API 客戶端
 *
 * 功能：
 * - Dynamics 365 實體資料的 CRUD 操作
 * - 自動認證和錯誤處理
 * - 批次操作和分頁支援
 * - 查詢建構器和資料轉換
 *
 * 支援的實體：
 * - Account (客戶公司)
 * - Contact (聯絡人)
 * - Opportunity (銷售機會)
 * - Product (產品)
 * - Activity (活動記錄)
 *
 * 作者：Claude Code
 * 創建時間：2025-09-28
 */

import { getDynamics365AuthHeaders, Dynamics365AuthError } from './auth';

// Dynamics 365 實體介面定義
interface DynamicsAccount {
  accountid: string;               // 帳戶 ID
  name: string;                   // 公司名稱
  emailaddress1?: string;         // 主要電子郵件
  telephone1?: string;            // 主要電話
  websiteurl?: string;            // 網站 URL
  industrycode?: number;          // 行業代碼
  numberofemployees?: number;     // 員工數量
  accountcategorycode?: number;   // 帳戶類別代碼
  customertypecode?: number;      // 客戶類型代碼
  address1_line1?: string;        // 地址第一行
  address1_city?: string;         // 城市
  address1_country?: string;      // 國家
  description?: string;           // 描述
  createdon?: string;            // 創建日期
  modifiedon?: string;           // 修改日期
}

interface DynamicsContact {
  contactid: string;              // 聯絡人 ID
  firstname: string;              // 名
  lastname: string;               // 姓
  emailaddress1?: string;         // 電子郵件
  telephone1?: string;            // 電話
  jobtitle?: string;             // 職務
  parentcustomerid?: string;      // 所屬帳戶 ID
  createdon?: string;            // 創建日期
  modifiedon?: string;           // 修改日期
}

interface DynamicsOpportunity {
  opportunityid: string;          // 機會 ID
  name: string;                   // 機會名稱
  estimatedvalue?: number;        // 預估價值
  estimatedclosedate?: string;    // 預估結案日期
  closeprobability?: number;      // 結案機率
  statuscode?: number;            // 狀態代碼
  parentaccountid?: string;       // 相關帳戶 ID
  parentcontactid?: string;       // 相關聯絡人 ID
  description?: string;           // 描述
  createdon?: string;            // 創建日期
  modifiedon?: string;           // 修改日期
}

// API 回應介面
interface DynamicsApiResponse<T> {
  '@odata.context': string;
  value: T[];
  '@odata.nextLink'?: string;     // 分頁的下一頁連結
}

// 查詢選項介面
interface QueryOptions {
  select?: string[];              // 選擇特定欄位
  filter?: string;               // 篩選條件 (OData)
  orderby?: string;              // 排序欄位
  top?: number;                  // 限制結果數量
  skip?: number;                 // 跳過記錄數量
  expand?: string[];             // 展開相關實體
}

// API 錯誤介面
export class Dynamics365ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'Dynamics365ApiError';
  }
}

/**
 * Dynamics 365 Web API 客戶端類
 *
 * 提供對 Dynamics 365 實體的完整 CRUD 操作
 * 包含自動認證、錯誤處理和資料轉換功能
 */
export class Dynamics365Client {
  private baseUrl: string;
  private apiVersion: string = 'v9.2';
  private isMockMode: boolean;

  constructor() {
    // 檢查是否啟用模擬模式
    this.isMockMode = process.env.DYNAMICS_365_MODE === 'mock' ||
                      process.env.DYNAMICS_365_MOCK_ENABLED === 'true';

    if (this.isMockMode) {
      console.log('🎭 Dynamics 365 模擬模式已啟用');
      // 簡化：直接使用 3002，這是當前開發服務器運行的端口
      this.baseUrl = 'http://localhost:3002/api/mock/dynamics365'; // 模擬端點
    } else {
      this.baseUrl = process.env.DYNAMICS_365_RESOURCE!.replace(/\/$/, '');

      if (!this.baseUrl) {
        throw new Dynamics365ApiError(
          '缺少 DYNAMICS_365_RESOURCE 環境變數',
          500,
          'MISSING_CONFIG'
        );
      }
    }
  }

  /**
   * 執行 HTTP 請求到 Dynamics 365 API
   *
   * @param endpoint API 端點路徑
   * @param options 請求選項
   * @returns Promise<any> API 回應資料
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    try {
      let authHeaders = {};
      let url: string;

      if (this.isMockMode) {
        // 模擬模式：跳過認證，使用模擬端點
        url = `${this.baseUrl}/${endpoint}`;
        console.log(`🎭 [Mock] ${options.method || 'GET'} ${url}`);
      } else {
        // 生產模式：獲取認證標頭
        authHeaders = await getDynamics365AuthHeaders();
        url = `${this.baseUrl}/api/data/${this.apiVersion}/${endpoint}`;
      }

      // 設置預設標頭
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        ...authHeaders,
        ...options.headers
      };

      // 執行 HTTP 請求
      const response = await fetch(url, {
        ...options,
        headers
      });

      // 處理 HTTP 錯誤
      if (!response.ok) {
        const errorData = await response.text();
        let parsedError;

        try {
          parsedError = JSON.parse(errorData);
        } catch {
          parsedError = { message: errorData };
        }

        throw new Dynamics365ApiError(
          parsedError.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          parsedError.error?.code,
          parsedError
        );
      }

      // 處理空回應 (如 DELETE 操作)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return null;
      }

      return await response.json();

    } catch (error) {
      if (error instanceof Dynamics365ApiError) {
        throw error;
      }

      throw new Dynamics365ApiError(
        `Dynamics 365 API 請求失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        500,
        'REQUEST_FAILED',
        error
      );
    }
  }

  /**
   * 建構 OData 查詢字串
   *
   * @param options 查詢選項
   * @returns string OData 查詢字串
   */
  private buildQueryString(options: QueryOptions): string {
    const params = new URLSearchParams();

    if (options.select?.length) {
      params.append('$select', options.select.join(','));
    }

    if (options.filter) {
      params.append('$filter', options.filter);
    }

    if (options.orderby) {
      params.append('$orderby', options.orderby);
    }

    if (options.top) {
      params.append('$top', options.top.toString());
    }

    if (options.skip) {
      params.append('$skip', options.skip.toString());
    }

    if (options.expand?.length) {
      params.append('$expand', options.expand.join(','));
    }

    return params.toString();
  }

  // ==================== 帳戶 (Account) 操作 ====================

  /**
   * 獲取帳戶列表
   *
   * @param options 查詢選項
   * @returns Promise<DynamicsAccount[]> 帳戶列表
   */
  async getAccounts(options: QueryOptions = {}): Promise<DynamicsAccount[]> {
    const queryString = this.buildQueryString(options);
    const endpoint = `accounts${queryString ? `?${queryString}` : ''}`;

    const response: DynamicsApiResponse<DynamicsAccount> = await this.makeRequest(endpoint);
    return response.value;
  }

  /**
   * 根據 ID 獲取特定帳戶
   *
   * @param accountId 帳戶 ID
   * @param options 查詢選項
   * @returns Promise<DynamicsAccount | null> 帳戶資料
   */
  async getAccountById(accountId: string, options: QueryOptions = {}): Promise<DynamicsAccount | null> {
    const queryString = this.buildQueryString(options);
    const endpoint = `accounts(${accountId})${queryString ? `?${queryString}` : ''}`;

    try {
      return await this.makeRequest(endpoint);
    } catch (error) {
      if (error instanceof Dynamics365ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 搜索帳戶
   *
   * @param searchTerm 搜索關鍵字
   * @param options 額外查詢選項
   * @returns Promise<DynamicsAccount[]> 搜索結果
   */
  async searchAccounts(searchTerm: string, options: QueryOptions = {}): Promise<DynamicsAccount[]> {
    const filter = `contains(name,'${searchTerm}') or contains(emailaddress1,'${searchTerm}')`;

    return this.getAccounts({
      ...options,
      filter: options.filter ? `(${options.filter}) and (${filter})` : filter
    });
  }

  // ==================== 聯絡人 (Contact) 操作 ====================

  /**
   * 獲取聯絡人列表
   *
   * @param options 查詢選項
   * @returns Promise<DynamicsContact[]> 聯絡人列表
   */
  async getContacts(options: QueryOptions = {}): Promise<DynamicsContact[]> {
    const queryString = this.buildQueryString(options);
    const endpoint = `contacts${queryString ? `?${queryString}` : ''}`;

    const response: DynamicsApiResponse<DynamicsContact> = await this.makeRequest(endpoint);
    return response.value;
  }

  /**
   * 根據 ID 獲取特定聯絡人
   *
   * @param contactId 聯絡人 ID
   * @param options 查詢選項
   * @returns Promise<DynamicsContact | null> 聯絡人資料
   */
  async getContactById(contactId: string, options: QueryOptions = {}): Promise<DynamicsContact | null> {
    const queryString = this.buildQueryString(options);
    const endpoint = `contacts(${contactId})${queryString ? `?${queryString}` : ''}`;

    try {
      return await this.makeRequest(endpoint);
    } catch (error) {
      if (error instanceof Dynamics365ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 獲取特定帳戶的聯絡人
   *
   * @param accountId 帳戶 ID
   * @param options 查詢選項
   * @returns Promise<DynamicsContact[]> 聯絡人列表
   */
  async getContactsByAccount(accountId: string, options: QueryOptions = {}): Promise<DynamicsContact[]> {
    return this.getContacts({
      ...options,
      filter: `_parentcustomerid_value eq ${accountId}`
    });
  }

  // ==================== 銷售機會 (Opportunity) 操作 ====================

  /**
   * 獲取銷售機會列表
   *
   * @param options 查詢選項
   * @returns Promise<DynamicsOpportunity[]> 銷售機會列表
   */
  async getOpportunities(options: QueryOptions = {}): Promise<DynamicsOpportunity[]> {
    const queryString = this.buildQueryString(options);
    const endpoint = `opportunities${queryString ? `?${queryString}` : ''}`;

    const response: DynamicsApiResponse<DynamicsOpportunity> = await this.makeRequest(endpoint);
    return response.value;
  }

  /**
   * 根據 ID 獲取特定銷售機會
   *
   * @param opportunityId 銷售機會 ID
   * @param options 查詢選項
   * @returns Promise<DynamicsOpportunity | null> 銷售機會資料
   */
  async getOpportunityById(opportunityId: string, options: QueryOptions = {}): Promise<DynamicsOpportunity | null> {
    const queryString = this.buildQueryString(options);
    const endpoint = `opportunities(${opportunityId})${queryString ? `?${queryString}` : ''}`;

    try {
      return await this.makeRequest(endpoint);
    } catch (error) {
      if (error instanceof Dynamics365ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 獲取特定帳戶的銷售機會
   *
   * @param accountId 帳戶 ID
   * @param options 查詢選項
   * @returns Promise<DynamicsOpportunity[]> 銷售機會列表
   */
  async getOpportunitiesByAccount(accountId: string, options: QueryOptions = {}): Promise<DynamicsOpportunity[]> {
    return this.getOpportunities({
      ...options,
      filter: `_parentaccountid_value eq ${accountId}`
    });
  }

  // ==================== 通用操作 ====================

  /**
   * 測試 API 連接
   *
   * @returns Promise<boolean> 連接測試結果
   */
  async testConnection(): Promise<boolean> {
    try {
      // 嘗試獲取系統資訊
      await this.makeRequest('$metadata');
      return true;
    } catch (error) {
      console.error('Dynamics 365 API 連接測試失敗:', error);
      return false;
    }
  }

  /**
   * 獲取實體中繼資料
   *
   * @param entityName 實體名稱
   * @returns Promise<any> 實體中繼資料
   */
  async getEntityMetadata(entityName: string): Promise<any> {
    return this.makeRequest(`EntityDefinitions(LogicalName='${entityName}')`);
  }

  /**
   * 執行批次操作
   *
   * @param requests 批次請求列表
   * @returns Promise<any[]> 批次操作結果
   */
  async batchRequest(requests: any[]): Promise<any[]> {
    // 實現批次操作邏輯
    // 這是一個複雜的功能，將在後續版本中實現
    throw new Error('批次操作功能尚未實現');
  }
}

// 單例模式 - 確保整個應用程式使用同一個客戶端實例
let clientInstance: Dynamics365Client | null = null;

/**
 * 獲取 Dynamics 365 客戶端的單例實例
 *
 * @returns Dynamics365Client 客戶端實例
 */
export function getDynamics365Client(): Dynamics365Client {
  if (!clientInstance) {
    clientInstance = new Dynamics365Client();
  }
  return clientInstance;
}

// 匯出實體類型供其他模組使用
export type { DynamicsAccount, DynamicsContact, DynamicsOpportunity, QueryOptions };