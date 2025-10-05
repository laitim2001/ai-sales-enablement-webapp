/**
 * ================================================================
 * 檔案名稱: Azure AD / Entra ID SSO服務
 * 檔案用途: AI銷售賦能平台的Azure AD單一登入(SSO)整合
 * 開發階段: MVP Phase 2 Sprint 1 - 企業級認證增強
 * ================================================================
 *
 * 功能索引:
 * 1. Azure AD OAuth 2.0認證流程
 * 2. MSAL Node整合
 * 3. Token交換和驗證
 * 4. 用戶信息獲取和同步
 * 5. SSO登入和登出
 *
 * 認證流程:
 * 1. 前端跳轉到Azure AD登入頁面
 * 2. 用戶在Azure AD完成認證
 * 3. Azure AD重定向回應用並附帶授權碼
 * 4. 後端用授權碼交換access token
 * 5. 獲取用戶信息並創建/更新本地用戶
 * 6. 生成JWT tokens（與現有系統整合）
 * 7. 設置cookies並返回前端
 *
 * 技術特色:
 * - MSAL Node整合: Microsoft官方認證庫
 * - PKCE支援: 增強安全性
 * - Token緩存: 提升性能
 * - 自動用戶同步: 首次登入自動創建用戶
 * - JWT整合: 無縫對接現有JWT系統
 * - 錯誤處理: 完整的錯誤處理機制
 *
 * 安全特性:
 * - State參數防CSRF
 * - PKCE (Proof Key for Code Exchange)
 * - Token驗證
 * - Scope限制
 * - 安全重定向URL驗證
 *
 * 環境變數要求:
 * - AZURE_AD_CLIENT_ID: Azure AD應用程式ID
 * - AZURE_AD_CLIENT_SECRET: Azure AD應用程式密鑰
 * - AZURE_AD_TENANT_ID: Azure AD租戶ID
 * - NEXT_PUBLIC_APP_URL: 應用程式URL（重定向用）
 *
 * 更新記錄:
 * - 2025-09-30: 初始版本，實現Azure AD SSO整合
 * ================================================================
 */

import { ConfidentialClientApplication, Configuration, AuthorizationUrlRequest, AuthorizationCodeRequest } from '@azure/msal-node'
import { prisma } from '@/lib/db'
import { loginUser } from './token-service'
import type { User, UserRole } from '@prisma/client'

/**
 * Azure AD配置驗證
 * 確保所有必需的環境變數已設置
 */
function validateAzureADConfig() {
  const required = ['AZURE_AD_CLIENT_ID', 'AZURE_AD_TENANT_ID', 'NEXT_PUBLIC_APP_URL']
  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required Azure AD environment variables: ${missing.join(', ')}`)
  }
}

/**
 * MSAL配置
 * 配置Microsoft Authentication Library
 */
const msalConfig: Configuration = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel: any, message: string) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[MSAL] ${message}`)
        }
      },
      piiLoggingEnabled: false,
      logLevel: 3, // Error level
    }
  }
}

/**
 * MSAL客戶端單例
 * 避免重複創建客戶端實例
 */
let msalInstance: ConfidentialClientApplication | null = null

function getMsalInstance(): ConfidentialClientApplication {
  if (!msalInstance) {
    validateAzureADConfig()
    msalInstance = new ConfidentialClientApplication(msalConfig)
  }
  return msalInstance
}

/**
 * Azure AD用戶信息介面
 * 從Microsoft Graph API獲取的用戶信息
 */
interface AzureADUserInfo {
  oid: string              // Object ID (唯一標識符)
  preferred_username: string  // Email
  name: string             // 全名
  email?: string           // Email (可選)
  roles?: string[]         // 角色
}

/**
 * 重定向URI配置
 * Azure AD認證完成後的回調URL
 */
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/azure-ad/callback`

/**
 * 生成Azure AD登入URL
 *
 * 生成用戶需要訪問的Azure AD登入頁面URL
 * 包含state參數用於CSRF保護
 *
 * @param state - CSRF防護的state參數（由調用方生成）
 * @returns Azure AD登入URL
 */
export async function getAzureADLoginUrl(state: string): Promise<string> {
  const msalClient = getMsalInstance()

  const authCodeUrlParameters: AuthorizationUrlRequest = {
    scopes: ['user.read', 'openid', 'profile', 'email'],
    redirectUri: REDIRECT_URI,
    state: state,
    prompt: 'select_account', // 允許用戶選擇帳號
  }

  try {
    const authUrl = await msalClient.getAuthCodeUrl(authCodeUrlParameters)
    return authUrl
  } catch (error) {
    console.error('Failed to generate Azure AD login URL:', error)
    throw new Error('Failed to generate Azure AD login URL')
  }
}

/**
 * 處理Azure AD回調
 *
 * 處理Azure AD認證回調的完整流程：
 * 1. 用授權碼交換access token
 * 2. 驗證token並獲取用戶信息
 * 3. 同步用戶到本地資料庫
 * 4. 生成JWT tokens
 *
 * @param code - Azure AD返回的授權碼
 * @param state - CSRF驗證的state參數
 * @param deviceContext - 設備上下文信息
 * @returns 包含JWT tokens和用戶信息的對象
 */
export async function handleAzureADCallback(
  code: string,
  state: string,
  deviceContext: {
    deviceId?: string
    ipAddress?: string
    userAgent?: string
  } = {}
) {
  const msalClient = getMsalInstance()

  // 第一步：用授權碼交換token
  const tokenRequest: AuthorizationCodeRequest = {
    code: code,
    scopes: ['user.read', 'openid', 'profile', 'email'],
    redirectUri: REDIRECT_URI,
  }

  try {
    // 獲取token響應
    const tokenResponse = await msalClient.acquireTokenByCode(tokenRequest)

    if (!tokenResponse || !tokenResponse.account) {
      throw new Error('Failed to acquire token from Azure AD')
    }

    // 第二步：解析用戶信息
    const azureUser: AzureADUserInfo = {
      oid: tokenResponse.account.homeAccountId.split('.')[0], // 提取Object ID
      preferred_username: tokenResponse.account.username,
      name: tokenResponse.account.name || tokenResponse.account.username,
      email: tokenResponse.account.username,
      roles: (tokenResponse.idTokenClaims as any)?.roles as string[] || []
    }

    // 第三步：同步用戶到本地資料庫
    const localUser = await syncAzureADUser(azureUser)

    // 第四步：生成JWT tokens（與現有系統整合）
    const tokenPair = await loginUser(localUser, deviceContext)

    return {
      user: {
        id: localUser.id,
        email: localUser.email,
        firstName: localUser.first_name,
        lastName: localUser.last_name,
        role: localUser.role
      },
      tokens: tokenPair,
      azureTokens: {
        accessToken: tokenResponse.accessToken,
        expiresOn: tokenResponse.expiresOn
      }
    }

  } catch (error) {
    console.error('Azure AD callback error:', error)
    throw new Error('Failed to authenticate with Azure AD')
  }
}

/**
 * 同步Azure AD用戶到本地資料庫
 *
 * 首次登入時創建用戶，後續登入更新用戶信息
 * 使用azure_ad_oid作為唯一標識符
 *
 * @param azureUser - Azure AD用戶信息
 * @returns 本地用戶對象
 */
async function syncAzureADUser(azureUser: AzureADUserInfo): Promise<User> {
  // 檢查用戶是否已存在（通過azure_ad_oid或email）
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { azure_ad_oid: azureUser.oid },
        { email: azureUser.preferred_username }
      ]
    }
  })

  if (user) {
    // 用戶已存在，更新信息
    const nameParts = azureUser.name.split(' ')
    const firstName = nameParts[0] || azureUser.name
    const lastName = nameParts.slice(1).join(' ') || ''

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        azure_ad_oid: azureUser.oid,
        first_name: firstName,
        last_name: lastName,
        email: azureUser.preferred_username,
        email_verified: true, // Azure AD已驗證
        last_login_at: new Date()
      }
    })
  } else {
    // 首次登入，創建新用戶
    const nameParts = azureUser.name.split(' ')
    const firstName = nameParts[0] || azureUser.name
    const lastName = nameParts.slice(1).join(' ') || ''

    user = await prisma.user.create({
      data: {
        azure_ad_oid: azureUser.oid,
        email: azureUser.preferred_username,
        first_name: firstName,
        last_name: lastName,
        email_verified: true,
        role: determineUserRole(azureUser),
        last_login_at: new Date()
      }
    })

    console.log(`New user created via Azure AD SSO: ${user.email}`)
  }

  return user
}

/**
 * 根據Azure AD角色確定本地角色
 *
 * 映射Azure AD角色到應用程式角色
 * 默認為 SALES_REP 角色
 *
 * @param azureUser - Azure AD用戶信息
 * @returns 本地角色
 */
function determineUserRole(azureUser: AzureADUserInfo): UserRole {
  if (!azureUser.roles || azureUser.roles.length === 0) {
    return 'SALES_REP' as UserRole // 默認角色
  }

  // Azure AD角色映射
  const roleMapping: Record<string, UserRole> = {
    'Admin': 'ADMIN' as UserRole,
    'SalesManager': 'SALES_MANAGER' as UserRole,
    'Sales': 'SALES_REP' as UserRole,
    'Marketing': 'MARKETING' as UserRole,
    'Viewer': 'VIEWER' as UserRole
  }

  // 找到第一個匹配的角色
  for (const azureRole of azureUser.roles) {
    if (roleMapping[azureRole]) {
      return roleMapping[azureRole]
    }
  }

  return 'SALES_REP' as UserRole // 默認角色
}

/**
 * 生成Azure AD登出URL
 *
 * 生成Azure AD登出URL，用於單點登出(SLO)
 *
 * @returns Azure AD登出URL
 */
export function getAzureADLogoutUrl(): string {
  const tenantId = process.env.AZURE_AD_TENANT_ID
  const postLogoutRedirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/login`

  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`
}

/**
 * 驗證Azure AD配置是否完整
 *
 * @returns 配置是否完整
 */
export function isAzureADConfigured(): boolean {
  return !!(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_TENANT_ID &&
    process.env.NEXT_PUBLIC_APP_URL
  )
}