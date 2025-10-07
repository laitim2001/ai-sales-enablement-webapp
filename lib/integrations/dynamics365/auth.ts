/**
 * @fileoverview Dynamics 365 OAuth 2.0 認證管理器功能：- Microsoft Graph API 認證流程- Dynamics 365 Web API 存取權限管理- Access Token 和 Refresh Token 自動管理- 多租戶支援和錯誤處理作者：Claude Code創建時間：2025-09-28
 * @module lib/integrations/dynamics365/auth
 * @description
 * Dynamics 365 OAuth 2.0 認證管理器功能：- Microsoft Graph API 認證流程- Dynamics 365 Web API 存取權限管理- Access Token 和 Refresh Token 自動管理- 多租戶支援和錯誤處理作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';

// Dynamics 365 認證配置介面
interface Dynamics365Config {
  tenantId: string;           // Azure 租戶 ID
  clientId: string;           // 應用程式 (客戶端) ID
  clientSecret: string;       // 客戶端密鑰
  resource: string;           // Dynamics 365 組織 URL
  scopes: string[];          // 存取權限範圍
}

// 認證結果介面
interface TokenResponse {
  accessToken: string;        // 存取權杖
  refreshToken?: string;      // 刷新權杖
  expiresAt: Date;           // 過期時間
  tokenType: string;         // 權杖類型
  scope: string;             // 授權範圍
}

// 認證錯誤類型
export class Dynamics365AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'Dynamics365AuthError';
  }
}

/**
 * Dynamics 365 OAuth 2.0 認證管理器
 *
 * 使用 Microsoft Authentication Library (MSAL) Node.js
 * 實現標準的 OAuth 2.0 客戶端憑證流程
 */
export class Dynamics365AuthManager {
  private confidentialClient: ConfidentialClientApplication;
  private config: Dynamics365Config;
  private cachedToken?: TokenResponse;

  constructor() {
    // 從環境變數載入配置
    this.config = {
      tenantId: process.env.DYNAMICS_365_TENANT_ID!,
      clientId: process.env.DYNAMICS_365_CLIENT_ID!,
      clientSecret: process.env.DYNAMICS_365_CLIENT_SECRET!,
      resource: process.env.DYNAMICS_365_RESOURCE!,
      scopes: [`${process.env.DYNAMICS_365_RESOURCE!}/.default`]
    };

    // 驗證必要的環境變數
    this.validateConfig();

    // 初始化 MSAL 客戶端
    this.confidentialClient = new ConfidentialClientApplication({
      auth: {
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        authority: `https://login.microsoftonline.com/${this.config.tenantId}`
      }
    });
  }

  /**
   * 驗證 Dynamics 365 配置的完整性
   * 確保所有必要的環境變數都已設置
   */
  private validateConfig(): void {
    const requiredVars = [
      'DYNAMICS_365_TENANT_ID',
      'DYNAMICS_365_CLIENT_ID',
      'DYNAMICS_365_CLIENT_SECRET',
      'DYNAMICS_365_RESOURCE'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Dynamics365AuthError(
        `缺少必要的環境變數: ${missingVars.join(', ')}`,
        'MISSING_CONFIG',
        { missingVars }
      );
    }
  }

  /**
   * 獲取有效的存取權杖
   *
   * 使用客戶端憑證流程獲取 Dynamics 365 API 存取權限
   * 實現自動快取和權杖刷新機制
   *
   * @returns Promise<string> 有效的存取權杖
   */
  async getAccessToken(): Promise<string> {
    try {
      // 檢查快取的權杖是否仍然有效
      if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
        return this.cachedToken.accessToken;
      }

      // 使用客戶端憑證流程獲取新權杖
      const clientCredentialRequest = {
        scopes: this.config.scopes,
      };

      const response = await this.confidentialClient.acquireTokenByClientCredential(
        clientCredentialRequest
      );

      if (!response) {
        throw new Dynamics365AuthError(
          '無法獲取存取權杖',
          'TOKEN_ACQUISITION_FAILED'
        );
      }

      // 快取權杖資訊
      this.cachedToken = {
        accessToken: response.accessToken,
        expiresAt: new Date(response.expiresOn!),
        tokenType: response.tokenType || 'Bearer',
        scope: response.scopes?.join(' ') || ''
      };

      return response.accessToken;

    } catch (error) {
      throw new Dynamics365AuthError(
        `Dynamics 365 認證失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        'AUTHENTICATION_FAILED',
        error
      );
    }
  }

  /**
   * 檢查權杖是否仍然有效
   *
   * 考慮 5 分鐘的緩衝時間以避免邊界情況
   *
   * @param token 要檢查的權杖資訊
   * @returns boolean 權杖是否有效
   */
  private isTokenValid(token: TokenResponse): boolean {
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 分鐘緩衝
    return token.expiresAt.getTime() > (now.getTime() + bufferTime);
  }

  /**
   * 清除快取的權杖
   *
   * 在發生認證錯誤或需要強制重新認證時使用
   */
  clearTokenCache(): void {
    this.cachedToken = undefined;
  }

  /**
   * 獲取認證標頭
   *
   * 返回用於 HTTP 請求的完整認證標頭
   *
   * @returns Promise<{Authorization: string}> 認證標頭物件
   */
  async getAuthHeaders(): Promise<{ Authorization: string }> {
    const accessToken = await this.getAccessToken();
    return {
      Authorization: `Bearer ${accessToken}`
    };
  }

  /**
   * 測試 Dynamics 365 連接
   *
   * 驗證認證配置和 API 連接是否正常工作
   *
   * @returns Promise<boolean> 連接測試結果
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('Dynamics 365 連接測試失敗:', error);
      return false;
    }
  }

  /**
   * 獲取當前配置資訊 (不含敏感資料)
   *
   * 用於診斷和調試目的
   *
   * @returns 不含敏感資料的配置資訊
   */
  getConfigInfo() {
    return {
      tenantId: this.config.tenantId,
      clientId: this.config.clientId,
      resource: this.config.resource,
      scopes: this.config.scopes,
      hasClientSecret: !!this.config.clientSecret,
      tokenCached: !!this.cachedToken,
      tokenValid: this.cachedToken ? this.isTokenValid(this.cachedToken) : false
    };
  }
}

// 單例模式 - 確保整個應用程式使用同一個認證管理器實例
let authManagerInstance: Dynamics365AuthManager | null = null;

/**
 * 獲取 Dynamics 365 認證管理器的單例實例
 *
 * @returns Dynamics365AuthManager 認證管理器實例
 */
export function getDynamics365AuthManager(): Dynamics365AuthManager {
  if (!authManagerInstance) {
    authManagerInstance = new Dynamics365AuthManager();
  }
  return authManagerInstance;
}

/**
 * 快速存取函數 - 獲取存取權杖
 *
 * @returns Promise<string> 有效的存取權杖
 */
export async function getDynamics365AccessToken(): Promise<string> {
  const authManager = getDynamics365AuthManager();
  return authManager.getAccessToken();
}

/**
 * 快速存取函數 - 獲取認證標頭
 *
 * @returns Promise<{Authorization: string}> 認證標頭
 */
export async function getDynamics365AuthHeaders(): Promise<{ Authorization: string }> {
  const authManager = getDynamics365AuthManager();
  return authManager.getAuthHeaders();
}