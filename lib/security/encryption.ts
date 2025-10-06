/**
 * 資料加密工具模組
 *
 * 功能：
 * - 提供欄位級別的資料加密/解密
 * - 支援 AES-256-GCM 對稱加密
 * - 自動金鑰管理（環境變數）
 * - 加密資料版本控制
 *
 * 使用場景：
 * - 敏感客戶資料加密（電話、Email）
 * - API Key 和 Token 加密儲存
 * - 個人身份資訊（PII）保護
 *
 * 安全等級：
 * - 算法：AES-256-GCM（AEAD，提供機密性和完整性）
 * - 金鑰長度：256位
 * - IV：隨機生成，每次加密使用不同IV
 * - 認證標籤：128位
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 3 - 安全加固與合規
 */

import * as crypto from 'crypto';
import { AzureKeyVaultService } from './azure-key-vault';

/**
 * 加密配置接口
 */
interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  authTagLength: number;
  version: string;
  useKeyVault?: boolean; // 是否使用 Azure Key Vault 管理金鑰
  keyVaultSecretName?: string; // Key Vault 中的 Secret 名稱
}

/**
 * 加密結果接口
 */
interface EncryptedData {
  version: string;
  iv: string;
  authTag: string;
  encrypted: string;
}

/**
 * 默認加密配置
 * 使用業界標準的 AES-256-GCM
 */
const DEFAULT_CONFIG: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256位 / 8 = 32字節
  ivLength: 16,  // 128位 / 8 = 16字節
  authTagLength: 16, // 128位 / 8 = 16字節
  version: 'v1', // 加密版本標識，方便未來升級算法
  useKeyVault: process.env.USE_AZURE_KEY_VAULT === 'true', // 是否使用 Azure Key Vault
  keyVaultSecretName: 'encryption-master-key', // Key Vault Secret 名稱
};

/**
 * 加密服務類
 *
 * 使用示例：
 * ```typescript
 * const encryptionService = EncryptionService.getInstance();
 * const encrypted = encryptionService.encrypt('sensitive data');
 * const decrypted = encryptionService.decrypt(encrypted);
 * ```
 */
export class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: Buffer;
  private config: EncryptionConfig;
  private keyVaultService?: AzureKeyVaultService;
  private keyLoadPromise?: Promise<void>;
  private keyLoaded: boolean = false;

  /**
   * 私有構造函數，實現單例模式
   */
  private constructor() {
    this.config = DEFAULT_CONFIG;
    this.encryptionKey = this.getOrCreateEncryptionKey();

    // 如果啟用 Key Vault,初始化服務
    if (this.config.useKeyVault) {
      this.keyVaultService = AzureKeyVaultService.getInstance();
    }
  }

  /**
   * 獲取加密服務單例實例
   */
  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * 獲取或創建加密金鑰
   *
   * 優先級：
   * 1. Azure Key Vault (如果啟用且可用)
   * 2. 環境變數 ENCRYPTION_KEY（生產環境）
   * 3. 自動生成（開發環境，不安全）
   *
   * @returns 加密金鑰 Buffer
   * @throws {Error} 生產環境未設置 ENCRYPTION_KEY 且 Key Vault 不可用
   */
  private getOrCreateEncryptionKey(): Buffer {
    // 優先級1: 嘗試從 Azure Key Vault 獲取金鑰
    if (this.config.useKeyVault) {
      try {
        // 注意: 這是同步構造,實際金鑰獲取會在首次加密/解密時進行
        console.log('[EncryptionService] Azure Key Vault integration enabled');
        console.log('[EncryptionService] Will fetch encryption key from Key Vault on first use');
        // 返回臨時金鑰,將在首次使用時替換為真實金鑰
        return Buffer.alloc(this.config.keyLength);
      } catch (error) {
        console.error('[EncryptionService] Failed to initialize Key Vault, falling back to environment variable');
      }
    }

    const envKey = process.env.ENCRYPTION_KEY;

    // 優先級2: 生產環境必須設置加密金鑰
    if (process.env.NODE_ENV === 'production' && !envKey && !this.config.useKeyVault) {
      throw new Error(
        'ENCRYPTION_KEY must be set in production environment or USE_AZURE_KEY_VAULT must be enabled. ' +
        'Generate one using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
      );
    }

    // 使用環境變數中的金鑰
    if (envKey) {
      try {
        const keyBuffer = Buffer.from(envKey, 'base64');

        // 驗證金鑰長度
        if (keyBuffer.length !== this.config.keyLength) {
          throw new Error(
            `Invalid ENCRYPTION_KEY length. Expected ${this.config.keyLength} bytes, got ${keyBuffer.length} bytes`
          );
        }

        console.log('[EncryptionService] Using encryption key from environment variable');
        return keyBuffer;
      } catch (error) {
        throw new Error(`Failed to parse ENCRYPTION_KEY: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 優先級3: 開發環境：生成臨時金鑰（僅用於測試）
    console.warn(
      '[EncryptionService] WARNING: Using auto-generated encryption key. ' +
      'This is only suitable for development. Set ENCRYPTION_KEY in production.'
    );
    return crypto.randomBytes(this.config.keyLength);
  }

  /**
   * 從 Azure Key Vault 加載加密金鑰
   *
   * @private
   * @returns Promise<void>
   */
  private async loadKeyFromVault(): Promise<void> {
    if (this.keyLoaded || !this.keyVaultService || !this.config.keyVaultSecretName) {
      return;
    }

    // 確保只加載一次
    if (this.keyLoadPromise) {
      return this.keyLoadPromise;
    }

    this.keyLoadPromise = (async () => {
      try {
        console.log(`[EncryptionService] Loading encryption key from Azure Key Vault: ${this.config.keyVaultSecretName}`);

        const keyBase64 = await this.keyVaultService.getSecret(this.config.keyVaultSecretName);
        const keyBuffer = Buffer.from(keyBase64, 'base64');

        // 驗證金鑰長度
        if (keyBuffer.length !== this.config.keyLength) {
          throw new Error(
            `Invalid Key Vault encryption key length. Expected ${this.config.keyLength} bytes, got ${keyBuffer.length} bytes`
          );
        }

        this.encryptionKey = keyBuffer;
        this.keyLoaded = true;

        console.log('[EncryptionService] Successfully loaded encryption key from Azure Key Vault');
      } catch (error) {
        console.error('[EncryptionService] Failed to load encryption key from Key Vault:', error);

        // 回退到環境變數金鑰
        const envKey = process.env.ENCRYPTION_KEY;
        if (envKey) {
          console.log('[EncryptionService] Falling back to ENCRYPTION_KEY environment variable');
          this.encryptionKey = Buffer.from(envKey, 'base64');
          this.keyLoaded = true;
        } else {
          throw new Error(
            'Failed to load encryption key from Key Vault and ENCRYPTION_KEY is not set. ' +
            `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    })();

    return this.keyLoadPromise;
  }

  /**
   * 確保加密金鑰已加載
   *
   * @private
   * @returns Promise<void>
   */
  private async ensureKeyLoaded(): Promise<void> {
    if (this.config.useKeyVault && !this.keyLoaded) {
      await this.loadKeyFromVault();
    }
  }

  /**
   * 加密字符串資料
   *
   * 加密流程：
   * 1. 確保加密金鑰已加載（從 Key Vault 或環境變數）
   * 2. 生成隨機 IV（初始化向量）
   * 3. 使用 AES-256-GCM 加密
   * 4. 提取認證標籤
   * 5. 組合版本、IV、標籤、密文
   * 6. Base64 編碼返回
   *
   * @param plaintext - 待加密的明文
   * @returns Promise<string> Base64 編碼的加密資料（包含版本、IV、標籤）
   * @throws {Error} 加密失敗
   */
  public async encrypt(plaintext: string): Promise<string> {
    // 確保金鑰已加載
    await this.ensureKeyLoaded();
    try {
      // 1. 生成隨機 IV
      const iv = crypto.randomBytes(this.config.ivLength);

      // 2. 創建加密器
      const cipher = crypto.createCipheriv(
        this.config.algorithm,
        this.encryptionKey,
        iv
      );

      // 3. 加密資料
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // 4. 提取認證標籤（GCM 模式提供）
      const authTag = (cipher as any).getAuthTag();

      // 5. 組合加密資料
      const encryptedData: EncryptedData = {
        version: this.config.version,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        encrypted: encrypted,
      };

      // 6. 序列化並返回
      return Buffer.from(JSON.stringify(encryptedData)).toString('base64');
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 解密字符串資料
   *
   * 解密流程：
   * 1. 確保加密金鑰已加載（從 Key Vault 或環境變數）
   * 2. Base64 解碼
   * 3. 解析版本、IV、標籤、密文
   * 4. 驗證版本兼容性
   * 5. 使用 AES-256-GCM 解密
   * 6. 驗證認證標籤（防篡改）
   * 7. 返回明文
   *
   * @param encryptedText - Base64 編碼的加密資料
   * @returns Promise<string> 解密後的明文
   * @throws {Error} 解密失敗、版本不兼容、資料被篡改
   */
  public async decrypt(encryptedText: string): Promise<string> {
    // 確保金鑰已加載
    await this.ensureKeyLoaded();
    try {
      // 1. Base64 解碼並解析
      const encryptedData: EncryptedData = JSON.parse(
        Buffer.from(encryptedText, 'base64').toString('utf8')
      );

      // 2. 驗證版本
      if (encryptedData.version !== this.config.version) {
        throw new Error(
          `Unsupported encryption version: ${encryptedData.version}. Current version: ${this.config.version}`
        );
      }

      // 3. 解析 IV 和認證標籤
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');

      // 4. 創建解密器
      const decipher = crypto.createDecipheriv(
        this.config.algorithm,
        this.encryptionKey,
        iv
      );

      // 5. 設置認證標籤（必須在解密前設置）
      (decipher as any).setAuthTag(authTag);

      // 6. 解密資料
      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // 認證失敗表示資料可能被篡改
      if (error instanceof Error && error.message.includes('auth')) {
        throw new Error('Decryption failed: Data integrity check failed (possible tampering)');
      }

      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 批量加密多個欄位
   *
   * 使用場景：加密物件中的多個敏感欄位
   *
   * @param data - 包含敏感資料的物件
   * @param fields - 需要加密的欄位名稱陣列
   * @returns Promise<T> 加密後的物件（原物件不變）
   */
  public async encryptFields<T extends Record<string, any>>(
    data: T,
    fields: (keyof T)[]
  ): Promise<T> {
    const encrypted = { ...data };

    for (const field of fields) {
      const value = data[field];

      // 只加密非空字符串
      if (typeof value === 'string' && value.length > 0) {
        encrypted[field] = await this.encrypt(value) as any;
      }
    }

    return encrypted;
  }

  /**
   * 批量解密多個欄位
   *
   * 使用場景：解密從資料庫讀取的加密資料
   *
   * @param data - 包含加密資料的物件
   * @param fields - 需要解密的欄位名稱陣列
   * @returns Promise<T> 解密後的物件（原物件不變）
   */
  public async decryptFields<T extends Record<string, any>>(
    data: T,
    fields: (keyof T)[]
  ): Promise<T> {
    const decrypted = { ...data };

    for (const field of fields) {
      const value = data[field];

      // 只解密非空字符串
      if (typeof value === 'string' && value.length > 0) {
        try {
          decrypted[field] = await this.decrypt(value) as any;
        } catch (error) {
          // 解密失敗時保留原值，避免整個操作失敗
          console.error(`Failed to decrypt field "${String(field)}":`, error);
        }
      }
    }

    return decrypted;
  }

  /**
   * 生成新的加密金鑰（用於金鑰輪換）
   *
   * 使用場景：
   * - 定期金鑰輪換（建議每 90-180 天）
   * - 安全事件響應
   * - 初始系統設置
   *
   * @returns Base64 編碼的新金鑰
   */
  public static generateNewKey(): string {
    const key = crypto.randomBytes(DEFAULT_CONFIG.keyLength);
    return key.toString('base64');
  }

  /**
   * 驗證加密金鑰格式是否正確
   *
   * @param key - Base64 編碼的金鑰
   * @returns 是否為有效金鑰
   */
  public static validateKey(key: string): boolean {
    try {
      const keyBuffer = Buffer.from(key, 'base64');
      return keyBuffer.length === DEFAULT_CONFIG.keyLength;
    } catch {
      return false;
    }
  }

  /**
   * 哈希敏感資料（單向，不可逆）
   *
   * 使用場景：
   * - API Key 哈希儲存
   * - Token 哈希儲存
   * - 密碼哈希（應使用 bcrypt 或 argon2）
   *
   * @param data - 待哈希的資料
   * @param salt - 可選的鹽值
   * @returns SHA-256 哈希值（Hex 編碼）
   */
  public hash(data: string, salt?: string): string {
    const hash = crypto.createHash('sha256');

    if (salt) {
      hash.update(salt);
    }

    hash.update(data);
    return hash.digest('hex');
  }

  /**
   * 生成隨機令牌
   *
   * 使用場景：
   * - API Key 生成
   * - 重置密碼令牌
   * - 驗證碼生成
   *
   * @param length - 令牌長度（字節數）
   * @param encoding - 編碼方式（默認 base64url）
   * @returns 隨機令牌
   */
  public static generateToken(
    length: number = 32,
    encoding: 'base64' | 'base64url' | 'hex' = 'base64url'
  ): string {
    const token = crypto.randomBytes(length);

    if (encoding === 'base64url') {
      return token
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    }

    return token.toString(encoding);
  }
}

/**
 * 便利函數：快速加密
 */
export async function encrypt(plaintext: string): Promise<string> {
  return EncryptionService.getInstance().encrypt(plaintext);
}

/**
 * 便利函數：快速解密
 */
export async function decrypt(encryptedText: string): Promise<string> {
  return EncryptionService.getInstance().decrypt(encryptedText);
}

/**
 * 便利函數：快速哈希
 */
export function hash(data: string, salt?: string): string {
  return EncryptionService.getInstance().hash(data, salt);
}

/**
 * 便利函數：生成令牌
 */
export function generateToken(length?: number, encoding?: 'base64' | 'base64url' | 'hex'): string {
  return EncryptionService.generateToken(length, encoding);
}

/**
 * 便利函數：生成加密金鑰
 */
export function generateEncryptionKey(): string {
  return EncryptionService.generateNewKey();
}

/**
 * 導出默認實例
 */
export default EncryptionService.getInstance();
