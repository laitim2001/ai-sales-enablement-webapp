/**
 * GDPR/PDPA 合規功能
 *
 * 功能：
 * - 個人資料導出（Right to Data Portability）
 * - 個人資料刪除（Right to be Forgotten）
 * - 資料處理記錄
 * - 同意管理
 *
 * 使用方式：
 * ```typescript
 * // 導出用戶資料
 * const data = await GDPRService.exportUserData(userId);
 *
 * // 刪除用戶資料
 * await GDPRService.deleteUserData(userId, { reason: 'User request' });
 *
 * // 記錄同意
 * await GDPRService.recordConsent(userId, {
 *   type: ConsentType.MARKETING,
 *   granted: true,
 * });
 * ```
 *
 * @author Claude Code
 * @date 2025-10-01
 * @epic Sprint 3 - 安全加固與合規
 */

/**
 * 同意類型
 */
export enum ConsentType {
  NECESSARY = 'necessary', // 必要功能（不可拒絕）
  FUNCTIONAL = 'functional', // 功能性
  ANALYTICS = 'analytics', // 分析
  MARKETING = 'marketing', // 營銷
  THIRD_PARTY = 'third_party', // 第三方共享
}

/**
 * 資料類別
 */
export enum DataCategory {
  PERSONAL = 'personal', // 個人基本資料
  CONTACT = 'contact', // 聯繫方式
  ACCOUNT = 'account', // 帳戶資料
  USAGE = 'usage', // 使用記錄
  PREFERENCES = 'preferences', // 偏好設定
  SENSITIVE = 'sensitive', // 敏感資料
}

/**
 * 刪除狀態
 */
export enum DeletionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * 同意記錄
 */
export interface ConsentRecord {
  id?: number;
  userId: number;
  type: ConsentType;
  granted: boolean;
  grantedAt: Date;
  revokedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  version: string; // 隱私政策版本
}

/**
 * 用戶資料導出結果
 */
export interface UserDataExport {
  userId: number;
  exportedAt: Date;
  format: 'json' | 'csv';
  categories: DataCategory[];
  data: {
    personal?: Record<string, any>;
    contact?: Record<string, any>;
    account?: Record<string, any>;
    usage?: any[];
    preferences?: Record<string, any>;
    consents?: ConsentRecord[];
  };
}

/**
 * 資料刪除請求
 */
export interface DeletionRequest {
  id?: number;
  userId: number;
  requestedAt: Date;
  status: DeletionStatus;
  reason: string;
  completedAt?: Date;
  deletedCategories?: DataCategory[];
  error?: string;
}

/**
 * 資料處理記錄
 */
export interface ProcessingRecord {
  id?: number;
  userId: number;
  timestamp: Date;
  activity: string; // 處理活動描述
  category: DataCategory;
  purpose: string; // 處理目的
  legalBasis: string; // 法律依據
  recipient?: string; // 資料接收方
}

/**
 * GDPR 同意存儲（內存實現）
 */
class ConsentStorage {
  private consents: Map<string, ConsentRecord[]> = new Map();

  async save(consent: ConsentRecord): Promise<ConsentRecord> {
    const key = `${consent.userId}-${consent.type}`;
    const existing = this.consents.get(key) || [];
    existing.push(consent);
    this.consents.set(key, existing);
    return consent;
  }

  async get(userId: number, type?: ConsentType): Promise<ConsentRecord[]> {
    if (type) {
      const key = `${userId}-${type}`;
      return this.consents.get(key) || [];
    }

    // 獲取用戶所有同意記錄
    const userConsents: ConsentRecord[] = [];
    for (const [key, consents] of this.consents.entries()) {
      if (key.startsWith(`${userId}-`)) {
        userConsents.push(...consents);
      }
    }
    return userConsents;
  }

  async clear(): Promise<void> {
    this.consents.clear();
  }
}

/**
 * GDPR 刪除請求存儲
 */
class DeletionStorage {
  private requests: Map<number, DeletionRequest> = new Map();
  private nextId = 1;

  async save(request: DeletionRequest): Promise<DeletionRequest> {
    const id = request.id || this.nextId++;
    const savedRequest = { ...request, id };
    this.requests.set(id, savedRequest);
    return savedRequest;
  }

  async get(id: number): Promise<DeletionRequest | null> {
    return this.requests.get(id) || null;
  }

  async getByUserId(userId: number): Promise<DeletionRequest[]> {
    return Array.from(this.requests.values()).filter((r) => r.userId === userId);
  }

  async update(id: number, updates: Partial<DeletionRequest>): Promise<void> {
    const request = this.requests.get(id);
    if (request) {
      Object.assign(request, updates);
    }
  }

  async clear(): Promise<void> {
    this.requests.clear();
    this.nextId = 1;
  }
}

/**
 * GDPR 服務
 */
export class GDPRService {
  private static consentStorage = new ConsentStorage();
  private static deletionStorage = new DeletionStorage();
  private static currentPrivacyPolicyVersion = '1.0.0';

  /**
   * 記錄用戶同意
   */
  static async recordConsent(
    userId: number,
    params: {
      type: ConsentType;
      granted: boolean;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
      userId,
      type: params.type,
      granted: params.granted,
      grantedAt: new Date(),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      version: this.currentPrivacyPolicyVersion,
    };

    return this.consentStorage.save(consent);
  }

  /**
   * 撤銷用戶同意
   */
  static async revokeConsent(
    userId: number,
    type: ConsentType
  ): Promise<ConsentRecord> {
    return this.recordConsent(userId, {
      type,
      granted: false,
    });
  }

  /**
   * 獲取用戶同意狀態
   */
  static async getConsents(
    userId: number,
    type?: ConsentType
  ): Promise<ConsentRecord[]> {
    return this.consentStorage.get(userId, type);
  }

  /**
   * 檢查用戶是否同意
   */
  static async hasConsent(userId: number, type: ConsentType): Promise<boolean> {
    const consents = await this.getConsents(userId, type);

    if (consents.length === 0) {
      // 必要功能默認同意
      return type === ConsentType.NECESSARY;
    }

    // 獲取最新的同意狀態
    const latest = consents[consents.length - 1];
    return latest.granted;
  }

  /**
   * 導出用戶資料
   */
  static async exportUserData(
    userId: number,
    options?: {
      format?: 'json' | 'csv';
      categories?: DataCategory[];
    }
  ): Promise<UserDataExport> {
    const format = options?.format || 'json';
    const categories = options?.categories || Object.values(DataCategory);

    const exportData: UserDataExport = {
      userId,
      exportedAt: new Date(),
      format,
      categories,
      data: {},
    };

    // 導出個人資料
    if (categories.includes(DataCategory.PERSONAL)) {
      exportData.data.personal = await this.exportPersonalData(userId);
    }

    // 導出聯繫資料
    if (categories.includes(DataCategory.CONTACT)) {
      exportData.data.contact = await this.exportContactData(userId);
    }

    // 導出帳戶資料
    if (categories.includes(DataCategory.ACCOUNT)) {
      exportData.data.account = await this.exportAccountData(userId);
    }

    // 導出使用記錄
    if (categories.includes(DataCategory.USAGE)) {
      exportData.data.usage = await this.exportUsageData(userId);
    }

    // 導出偏好設定
    if (categories.includes(DataCategory.PREFERENCES)) {
      exportData.data.preferences = await this.exportPreferencesData(userId);
    }

    // 導出同意記錄
    exportData.data.consents = await this.getConsents(userId);

    return exportData;
  }

  /**
   * 請求刪除用戶資料
   */
  static async requestDeletion(
    userId: number,
    reason: string
  ): Promise<DeletionRequest> {
    const request: DeletionRequest = {
      userId,
      requestedAt: new Date(),
      status: DeletionStatus.PENDING,
      reason,
    };

    return this.deletionStorage.save(request);
  }

  /**
   * 執行資料刪除
   */
  static async executeDelete(requestId: number): Promise<DeletionRequest> {
    const request = await this.deletionStorage.get(requestId);
    if (!request) {
      throw new Error(`Deletion request not found: ${requestId}`);
    }

    try {
      // 更新狀態為進行中
      await this.deletionStorage.update(requestId, {
        status: DeletionStatus.IN_PROGRESS,
      });

      // 執行刪除（模擬）
      await this.performDeletion(request.userId);

      // 更新狀態為完成
      await this.deletionStorage.update(requestId, {
        status: DeletionStatus.COMPLETED,
        completedAt: new Date(),
        deletedCategories: Object.values(DataCategory),
      });

      const updated = await this.deletionStorage.get(requestId);
      return updated!;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.deletionStorage.update(requestId, {
        status: DeletionStatus.FAILED,
        error: errorMessage,
      });

      const updated = await this.deletionStorage.get(requestId);
      return updated!;
    }
  }

  /**
   * 獲取刪除請求
   */
  static async getDeletionRequest(requestId: number): Promise<DeletionRequest | null> {
    return this.deletionStorage.get(requestId);
  }

  /**
   * 獲取用戶的刪除請求
   */
  static async getUserDeletionRequests(userId: number): Promise<DeletionRequest[]> {
    return this.deletionStorage.getByUserId(userId);
  }

  /**
   * 設置隱私政策版本
   */
  static setPrivacyPolicyVersion(version: string): void {
    this.currentPrivacyPolicyVersion = version;
  }

  /**
   * 獲取隱私政策版本
   */
  static getPrivacyPolicyVersion(): string {
    return this.currentPrivacyPolicyVersion;
  }

  /**
   * 清空所有資料（用於測試）
   */
  static async clear(): Promise<void> {
    await this.consentStorage.clear();
    await this.deletionStorage.clear();
  }

  /**
   * 導出個人資料（模擬）
   */
  private static async exportPersonalData(userId: number): Promise<Record<string, any>> {
    return {
      id: userId,
      name: `User ${userId}`,
      dateOfBirth: '1990-01-01',
    };
  }

  /**
   * 導出聯繫資料（模擬）
   */
  private static async exportContactData(userId: number): Promise<Record<string, any>> {
    return {
      email: `user${userId}@example.com`,
      phone: '+1234567890',
      address: '123 Main St',
    };
  }

  /**
   * 導出帳戶資料（模擬）
   */
  private static async exportAccountData(userId: number): Promise<Record<string, any>> {
    return {
      username: `user${userId}`,
      createdAt: '2023-01-01',
      lastLoginAt: '2025-10-01',
    };
  }

  /**
   * 導出使用記錄（模擬）
   */
  private static async exportUsageData(userId: number): Promise<any[]> {
    return [
      { action: 'login', timestamp: '2025-10-01T10:00:00Z' },
      { action: 'view_page', timestamp: '2025-10-01T10:05:00Z' },
    ];
  }

  /**
   * 導出偏好設定（模擬）
   */
  private static async exportPreferencesData(
    userId: number
  ): Promise<Record<string, any>> {
    return {
      language: 'zh-TW',
      theme: 'dark',
      notifications: true,
    };
  }

  /**
   * 執行資料刪除（模擬）
   */
  private static async performDeletion(userId: number): Promise<void> {
    // 模擬刪除過程
    await new Promise((resolve) => setTimeout(resolve, 10));

    // 在實際實現中，這裡會執行：
    // 1. 刪除用戶帳戶
    // 2. 刪除個人資料
    // 3. 匿名化使用記錄
    // 4. 刪除同意記錄
    // 5. 清理關聯資料
  }
}

/**
 * 導出便利函數
 */
export const recordConsent = GDPRService.recordConsent.bind(GDPRService);
export const revokeConsent = GDPRService.revokeConsent.bind(GDPRService);
export const getConsents = GDPRService.getConsents.bind(GDPRService);
export const hasConsent = GDPRService.hasConsent.bind(GDPRService);
export const exportUserData = GDPRService.exportUserData.bind(GDPRService);
export const requestDeletion = GDPRService.requestDeletion.bind(GDPRService);
export const executeDelete = GDPRService.executeDelete.bind(GDPRService);
