/**
 * @fileoverview Microsoft Graph OAuth 2.0 配置模組📋 功能說明：- Azure AD OAuth 2.0認證流程- 訪問token管理和刷新- Microsoft Graph API授權配置- Token安全存儲🔗 依賴關係：- @azure/msal-node - Microsoft認證庫- Microsoft Graph API📊 使用場景：- Outlook日曆整合- Teams會議同步- 用戶日曆事件讀取作者：Claude Code日期：2025-10-05Sprint：Sprint 7 Phase 3
 * @module lib/calendar/microsoft-graph-oauth
 * @description
 * Microsoft Graph OAuth 2.0 配置模組📋 功能說明：- Azure AD OAuth 2.0認證流程- 訪問token管理和刷新- Microsoft Graph API授權配置- Token安全存儲🔗 依賴關係：- @azure/msal-node - Microsoft認證庫- Microsoft Graph API📊 使用場景：- Outlook日曆整合- Teams會議同步- 用戶日曆事件讀取作者：Claude Code日期：2025-10-05Sprint：Sprint 7 Phase 3
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { ConfidentialClientApplication, AuthorizationCodeRequest, OnBehalfOfRequest } from '@azure/msal-node';

/**
 * Microsoft Graph OAuth配置接口
 */
export interface GraphOAuthConfig {
  clientId: string;              // Azure AD應用程式ID
  clientSecret: string;          // 應用程式密鑰
  tenantId: string;              // 租戶ID
  redirectUri: string;           // 重定向URI
  scopes: string[];              // 請求的權限範圍
}

/**
 * Token響應接口
 */
export interface TokenResponse {
  accessToken: string;           // 訪問token
  refreshToken?: string;         // 刷新token
  expiresOn: Date;              // 過期時間
  scopes: string[];             // 授權範圍
}

/**
 * Microsoft Graph OAuth管理器
 *
 * 用途：管理OAuth 2.0認證流程和token生命週期
 */
export class MicrosoftGraphOAuth {
  private msalClient: ConfidentialClientApplication;
  private config: GraphOAuthConfig;

  /**
   * 構造函數
   *
   * @param config - OAuth配置
   */
  constructor(config: GraphOAuthConfig) {
    this.config = config;

    // 初始化MSAL客戶端
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
        clientSecret: config.clientSecret
      }
    });
  }

  /**
   * 獲取授權URL
   *
   * 用途：生成OAuth授權流程的初始URL
   *
   * @param state - 狀態參數（用於防止CSRF攻擊）
   * @returns 授權URL
   */
  async getAuthorizationUrl(state?: string): Promise<string> {
    const authCodeUrlParameters = {
      scopes: this.config.scopes,
      redirectUri: this.config.redirectUri,
      state: state || this.generateState()
    };

    return await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  /**
   * 使用授權碼獲取token
   *
   * 用途：OAuth回調後使用授權碼換取訪問token
   *
   * @param code - 授權碼
   * @returns Token響應
   */
  async acquireTokenByCode(code: string): Promise<TokenResponse> {
    const tokenRequest: AuthorizationCodeRequest = {
      code,
      scopes: this.config.scopes,
      redirectUri: this.config.redirectUri
    };

    const response = await this.msalClient.acquireTokenByCode(tokenRequest);

    if (!response) {
      throw new Error('無法獲取訪問token');
    }

    return {
      accessToken: response.accessToken,
      // MSAL internally manages refresh tokens
      expiresOn: response.expiresOn!,
      scopes: response.scopes || this.config.scopes
    };
  }

  /**
   * 使用刷新token獲取新的訪問token
   *
   * 用途：在訪問token過期前刷新
   *
   * @param refreshToken - 刷新token
   * @returns 新的Token響應
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const refreshRequest = {
      refreshToken,
      scopes: this.config.scopes
    };

    const response = await this.msalClient.acquireTokenByRefreshToken(refreshRequest);

    if (!response) {
      throw new Error('無法刷新訪問token');
    }

    return {
      accessToken: response.accessToken,
      refreshToken: refreshToken, // refreshToken is not returned by MSAL, use the original one
      expiresOn: response.expiresOn!,
      scopes: response.scopes || this.config.scopes
    };
  }

  /**
   * 驗證token是否過期
   *
   * @param expiresOn - Token過期時間
   * @param bufferMinutes - 緩衝時間（分鐘），默認5分鐘
   * @returns 是否過期
   */
  isTokenExpired(expiresOn: Date, bufferMinutes: number = 5): boolean {
    const now = new Date();
    const expiryWithBuffer = new Date(expiresOn.getTime() - bufferMinutes * 60 * 1000);
    return now >= expiryWithBuffer;
  }

  /**
   * 生成隨機狀態參數
   *
   * 用途：防止CSRF攻擊
   *
   * @returns 隨機字符串
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * 獲取用戶授權URL（帶提示）
   *
   * @param userId - 用戶ID（可選）
   * @param loginHint - 登錄提示（郵箱）
   * @returns 授權URL
   */
  getAuthorizationUrlWithHint(userId?: string, loginHint?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: this.generateState(),
      response_mode: 'query'
    });

    if (loginHint) {
      params.append('login_hint', loginHint);
    }

    if (userId) {
      params.append('prompt', 'select_account');
    }

    return `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }
}

/**
 * 創建Microsoft Graph OAuth實例
 *
 * 用途：工廠函數，便於創建OAuth管理器
 *
 * @param config - OAuth配置（可選，使用環境變量）
 * @returns OAuth管理器實例
 *
 * @example
 * ```typescript
 * const oauth = createGraphOAuth();
 * const authUrl = oauth.getAuthorizationUrl();
 * ```
 */
export function createGraphOAuth(config?: Partial<GraphOAuthConfig>): MicrosoftGraphOAuth {
  const defaultConfig: GraphOAuthConfig = {
    clientId: process.env.AZURE_AD_CLIENT_ID || '',
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
    tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
    redirectUri: process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
    scopes: [
      'User.Read',
      'Calendars.Read',
      'Calendars.ReadWrite',
      'offline_access'
    ]
  };

  const mergedConfig = { ...defaultConfig, ...config };

  // 驗證必需配置
  if (!mergedConfig.clientId || !mergedConfig.clientSecret) {
    throw new Error('Microsoft Graph OAuth配置缺少必需參數：clientId 和 clientSecret');
  }

  return new MicrosoftGraphOAuth(mergedConfig);
}

/**
 * Token存儲接口
 *
 * 用途：定義token存儲的標準接口
 */
export interface TokenStore {
  /**
   * 保存token
   *
   * @param userId - 用戶ID
   * @param tokenResponse - Token響應
   */
  saveToken(userId: number, tokenResponse: TokenResponse): Promise<void>;

  /**
   * 獲取token
   *
   * @param userId - 用戶ID
   * @returns Token響應或null
   */
  getToken(userId: number): Promise<TokenResponse | null>;

  /**
   * 刪除token
   *
   * @param userId - 用戶ID
   */
  deleteToken(userId: number): Promise<void>;
}

/**
 * 內存Token存儲實現（用於開發/測試）
 *
 * 注意：生產環境應使用數據庫存儲
 */
export class MemoryTokenStore implements TokenStore {
  private tokens: Map<number, TokenResponse> = new Map();

  async saveToken(userId: number, tokenResponse: TokenResponse): Promise<void> {
    this.tokens.set(userId, tokenResponse);
  }

  async getToken(userId: number): Promise<TokenResponse | null> {
    return this.tokens.get(userId) || null;
  }

  async deleteToken(userId: number): Promise<void> {
    this.tokens.delete(userId);
  }

  /**
   * 清除所有token（測試用）
   */
  clear(): void {
    this.tokens.clear();
  }
}

export default MicrosoftGraphOAuth;
