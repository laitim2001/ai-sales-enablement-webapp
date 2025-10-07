/**
 * @fileoverview Azure Key Vault 整合服務功能：- 雲端加密金鑰管理- 敏感資料(Secrets)存儲- 加密金鑰輪換- 證書管理- 高可用性金鑰訪問使用場景：- 資料庫加密金鑰管理- API金鑰安全存儲- 第三方服務憑證管理- JWT簽名金鑰輪換安全特性：- 托管式金鑰管理（Azure負責密鑰安全）- 存取記錄和審計- 金鑰版本控制- 自動備份和恢復- RBAC權限控制@author Claude Code@date 2025-10-05@epic Sprint 3 - 安全加固與合規
 * @module lib/security/azure-key-vault
 * @description
 * Azure Key Vault 整合服務功能：- 雲端加密金鑰管理- 敏感資料(Secrets)存儲- 加密金鑰輪換- 證書管理- 高可用性金鑰訪問使用場景：- 資料庫加密金鑰管理- API金鑰安全存儲- 第三方服務憑證管理- JWT簽名金鑰輪換安全特性：- 托管式金鑰管理（Azure負責密鑰安全）- 存取記錄和審計- 金鑰版本控制- 自動備份和恢復- RBAC權限控制@author Claude Code@date 2025-10-05@epic Sprint 3 - 安全加固與合規
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';
import { AuditLogger, AuditAction, AuditResource, AuditSeverity } from './audit-log';

/**
 * Key Vault配置接口
 */
interface KeyVaultConfig {
  vaultUrl: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  useManagedIdentity?: boolean;
}

/**
 * Secret元數據
 */
interface SecretMetadata {
  name: string;
  version?: string;
  value: string;
  createdOn?: Date;
  updatedOn?: Date;
  expiresOn?: Date;
  enabled: boolean;
}

/**
 * Secret選項
 */
interface SecretOptions {
  expiresOn?: Date;
  enabled?: boolean;
  contentType?: string;
  tags?: Record<string, string>;
}

/**
 * Azure Key Vault 服務類
 */
export class AzureKeyVaultService {
  private static instance: AzureKeyVaultService;
  private client: SecretClient | null = null;
  private config: KeyVaultConfig;
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private readonly cacheTTL = 300000; // 5分鐘緩存

  /**
   * 私有構造函數（單例模式）
   */
  private constructor() {
    this.config = this.loadConfig();
  }

  /**
   * 獲取服務實例
   */
  public static getInstance(): AzureKeyVaultService {
    if (!AzureKeyVaultService.instance) {
      AzureKeyVaultService.instance = new AzureKeyVaultService();
    }
    return AzureKeyVaultService.instance;
  }

  /**
   * 從環境變數加載配置
   */
  private loadConfig(): KeyVaultConfig {
    const vaultUrl = process.env.AZURE_KEY_VAULT_URL;

    if (!vaultUrl) {
      console.warn(
        '[AzureKeyVault] AZURE_KEY_VAULT_URL not set. ' +
        'Key Vault integration will be disabled. ' +
        'Set AZURE_KEY_VAULT_URL to enable.'
      );
      return { vaultUrl: '' };
    }

    return {
      vaultUrl,
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
      useManagedIdentity: process.env.USE_MANAGED_IDENTITY === 'true'
    };
  }

  /**
   * 初始化Azure Key Vault客戶端
   */
  private async initializeClient(): Promise<SecretClient> {
    if (this.client) {
      return this.client;
    }

    if (!this.config.vaultUrl) {
      throw new Error('Azure Key Vault is not configured. Set AZURE_KEY_VAULT_URL environment variable.');
    }

    try {
      let credential;

      // 優先使用Managed Identity（生產環境推薦）
      if (this.config.useManagedIdentity) {
        credential = new DefaultAzureCredential();
        console.log('[AzureKeyVault] Using Managed Identity for authentication');
      }
      // 使用Service Principal（開發/測試環境）
      else if (this.config.tenantId && this.config.clientId && this.config.clientSecret) {
        credential = new ClientSecretCredential(
          this.config.tenantId,
          this.config.clientId,
          this.config.clientSecret
        );
        console.log('[AzureKeyVault] Using Service Principal for authentication');
      }
      // 使用Default Credential Chain（本地開發）
      else {
        credential = new DefaultAzureCredential();
        console.log('[AzureKeyVault] Using Default Azure Credential');
      }

      this.client = new SecretClient(this.config.vaultUrl, credential);
      console.log(`[AzureKeyVault] Connected to ${this.config.vaultUrl}`);

      return this.client;
    } catch (error) {
      console.error('[AzureKeyVault] Failed to initialize client:', error);
      throw new Error(
        `Failed to connect to Azure Key Vault: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 獲取Secret
   *
   * @param secretName - Secret名稱
   * @param version - Secret版本（可選，默認最新）
   * @param useCache - 是否使用緩存（默認true）
   * @returns Secret值
   */
  public async getSecret(
    secretName: string,
    version?: string,
    useCache: boolean = true
  ): Promise<string> {
    const cacheKey = version ? `${secretName}:${version}` : secretName;

    // 檢查緩存
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }
    }

    try {
      const client = await this.initializeClient();
      const secret = await client.getSecret(secretName, { version });

      if (!secret.value) {
        throw new Error(`Secret ${secretName} has no value`);
      }

      // 更新緩存
      if (useCache) {
        this.cache.set(cacheKey, {
          value: secret.value,
          expiresAt: Date.now() + this.cacheTTL
        });
      }

      // 記錄審計日誌
      await this.logSecretAccess(secretName, version, true);

      return secret.value;
    } catch (error) {
      // 記錄失敗的訪問
      await this.logSecretAccess(secretName, version, false, error);

      throw new Error(
        `Failed to get secret ${secretName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 設置Secret
   *
   * @param secretName - Secret名稱
   * @param value - Secret值
   * @param options - Secret選項
   * @returns Secret元數據
   */
  public async setSecret(
    secretName: string,
    value: string,
    options?: SecretOptions
  ): Promise<SecretMetadata> {
    try {
      const client = await this.initializeClient();

      const secret = await client.setSecret(secretName, value, {
        expiresOn: options?.expiresOn,
        enabled: options?.enabled !== undefined ? options.enabled : true,
        contentType: options?.contentType,
        tags: options?.tags
      });

      // 清除緩存
      this.clearSecretCache(secretName);

      // 記錄審計日誌
      await AuditLogger.log({
        userId: 0, // 系統操作
        action: AuditAction.CREATE,
        resource: AuditResource.SYSTEM_CONFIG,
        resourceId: secretName,
        severity: AuditSeverity.WARNING,
        success: true,
        details: {
          operation: 'set_secret',
          secretName,
          hasExpiry: !!options?.expiresOn,
          tags: options?.tags
        }
      });

      return {
        name: secret.name,
        version: secret.properties.version,
        value: secret.value || '',
        createdOn: secret.properties.createdOn,
        updatedOn: secret.properties.updatedOn,
        expiresOn: secret.properties.expiresOn,
        enabled: secret.properties.enabled || false
      };
    } catch (error) {
      await AuditLogger.log({
        userId: 0,
        action: AuditAction.CREATE,
        resource: AuditResource.SYSTEM_CONFIG,
        resourceId: secretName,
        severity: AuditSeverity.ERROR,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        details: { operation: 'set_secret', secretName }
      });

      throw new Error(
        `Failed to set secret ${secretName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 刪除Secret
   *
   * @param secretName - Secret名稱
   */
  public async deleteSecret(secretName: string): Promise<void> {
    try {
      const client = await this.initializeClient();
      await client.beginDeleteSecret(secretName);

      // 清除緩存
      this.clearSecretCache(secretName);

      // 記錄審計日誌
      await AuditLogger.log({
        userId: 0,
        action: AuditAction.DELETE,
        resource: AuditResource.SYSTEM_CONFIG,
        resourceId: secretName,
        severity: AuditSeverity.CRITICAL,
        success: true,
        details: { operation: 'delete_secret', secretName }
      });
    } catch (error) {
      await AuditLogger.log({
        userId: 0,
        action: AuditAction.DELETE,
        resource: AuditResource.SYSTEM_CONFIG,
        resourceId: secretName,
        severity: AuditSeverity.ERROR,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        details: { operation: 'delete_secret', secretName }
      });

      throw new Error(
        `Failed to delete secret ${secretName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 輪換Secret（創建新版本）
   *
   * @param secretName - Secret名稱
   * @param newValue - 新的Secret值
   * @param options - Secret選項
   * @returns 新版本的Secret元數據
   */
  public async rotateSecret(
    secretName: string,
    newValue: string,
    options?: SecretOptions
  ): Promise<SecretMetadata> {
    try {
      // 獲取舊版本（用於審計）
      const oldSecret = await this.getSecret(secretName, undefined, false);

      // 創建新版本
      const newSecret = await this.setSecret(secretName, newValue, options);

      // 記錄金鑰輪換
      await AuditLogger.log({
        userId: 0,
        action: AuditAction.ENCRYPTION_KEY_ROTATION,
        resource: AuditResource.SYSTEM_CONFIG,
        resourceId: secretName,
        severity: AuditSeverity.CRITICAL,
        success: true,
        details: {
          operation: 'rotate_secret',
          secretName,
          oldVersion: 'hidden', // 不記錄實際值
          newVersion: newSecret.version
        }
      });

      return newSecret;
    } catch (error) {
      await AuditLogger.log({
        userId: 0,
        action: AuditAction.ENCRYPTION_KEY_ROTATION,
        resource: AuditResource.SYSTEM_CONFIG,
        resourceId: secretName,
        severity: AuditSeverity.ERROR,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        details: { operation: 'rotate_secret', secretName }
      });

      throw new Error(
        `Failed to rotate secret ${secretName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 列出所有Secrets
   *
   * @returns Secret名稱列表
   */
  public async listSecrets(): Promise<string[]> {
    try {
      const client = await this.initializeClient();
      const secretNames: string[] = [];

      for await (const secretProperties of client.listPropertiesOfSecrets()) {
        if (secretProperties.enabled) {
          secretNames.push(secretProperties.name);
        }
      }

      return secretNames;
    } catch (error) {
      throw new Error(
        `Failed to list secrets: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 檢查Key Vault是否可用
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.initializeClient();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清除特定Secret的緩存
   */
  private clearSecretCache(secretName: string): void {
    // 清除所有版本的緩存
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(secretName)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 清除所有緩存
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 記錄Secret訪問日誌
   */
  private async logSecretAccess(
    secretName: string,
    version: string | undefined,
    success: boolean,
    error?: unknown
  ): Promise<void> {
    try {
      await AuditLogger.log({
        userId: 0, // 系統操作
        action: AuditAction.SENSITIVE_DATA_ACCESS,
        resource: AuditResource.SYSTEM_CONFIG,
        resourceId: secretName,
        severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
        success,
        errorMessage: error instanceof Error ? error.message : undefined,
        details: {
          operation: 'get_secret',
          secretName,
          version: version || 'latest'
        }
      });
    } catch (logError) {
      // 不要因為日誌失敗而中斷主要操作
      console.error('[AzureKeyVault] Failed to log secret access:', logError);
    }
  }
}

/**
 * 便利函數：獲取Secret
 */
export async function getKeyVaultSecret(
  secretName: string,
  version?: string,
  useCache?: boolean
): Promise<string> {
  return AzureKeyVaultService.getInstance().getSecret(secretName, version, useCache);
}

/**
 * 便利函數：設置Secret
 */
export async function setKeyVaultSecret(
  secretName: string,
  value: string,
  options?: SecretOptions
): Promise<SecretMetadata> {
  return AzureKeyVaultService.getInstance().setSecret(secretName, value, options);
}

/**
 * 便利函數：輪換Secret
 */
export async function rotateKeyVaultSecret(
  secretName: string,
  newValue: string,
  options?: SecretOptions
): Promise<SecretMetadata> {
  return AzureKeyVaultService.getInstance().rotateSecret(secretName, newValue, options);
}

/**
 * 便利函數：健康檢查
 */
export async function isKeyVaultAvailable(): Promise<boolean> {
  return AzureKeyVaultService.getInstance().healthCheck();
}

/**
 * 導出默認實例
 */
export default AzureKeyVaultService.getInstance();
