/**
 * ================================================================
 * AI銷售賦能平台 - 敏感欄位加密配置 (lib/security/sensitive-fields-config.ts)
 * ================================================================
 *
 * 【檔案功能】
 * 定義需要進行欄位級加密的數據模型和欄位清單。
 * 提供統一的敏感欄位配置管理,確保敏感資料的一致性加密。
 *
 * 【主要職責】
 * • 敏感欄位定義 - 明確指定哪些Model的哪些欄位需要加密
 * • 加密優先級 - 定義HIGH/MEDIUM/LOW三級優先級
 * • 配置管理 - 集中管理所有敏感欄位配置
 * • 性能優化 - 支援選擇性加密和批量處理
 * • 合規支援 - 符合GDPR、PDPA等資料保護法規
 *
 * 【安全等級定義】
 * • HIGH (關鍵) - 個人身份資訊(PII)、財務資訊、機密商業數據
 * • MEDIUM (敏感) - 聯繫資訊、業務記錄、內部備註
 * • LOW (一般) - 非機密描述、公開資訊
 *
 * 【相關檔案】
 * • lib/security/encryption.ts - 加密服務實現
 * • lib/security/azure-key-vault.ts - 金鑰管理服務
 * • prisma/schema.prisma - 資料庫Schema定義
 * • scripts/test-encryption-performance.ts - 加密性能測試
 *
 * 【更新記錄】
 * - Sprint 3 Week 5: 初始配置 - Customer、Contact、SalesOpportunity敏感欄位
 * ================================================================
 */

/**
 * 敏感欄位安全等級
 */
export enum SensitivityLevel {
  HIGH = 'HIGH',     // 關鍵敏感資料: PII、財務、機密商業數據
  MEDIUM = 'MEDIUM', // 一般敏感資料: 聯繫資訊、業務記錄
  LOW = 'LOW'        // 低敏感資料: 非機密描述資訊
}

/**
 * 敏感欄位配置介面
 */
export interface SensitiveFieldConfig {
  /** 數據模型名稱 (對應Prisma Model) */
  model: string;
  /** 需要加密的欄位清單 */
  fields: string[];
  /** 安全等級 */
  sensitivity: SensitivityLevel;
  /** 是否啟用加密 (可用於暫時停用特定模型的加密) */
  enabled: boolean;
  /** 描述 */
  description: string;
}

/**
 * 所有敏感欄位的配置清單
 *
 * 【配置原則】
 * 1. **個人身份資訊(PII)優先**: email, phone等個人資訊必須加密
 * 2. **業務機密保護**: notes, description等可能含機密資訊的欄位加密
 * 3. **合規性考量**: 符合GDPR第32條(資料加密)和PDPA要求
 * 4. **性能平衡**: 根據敏感度和使用頻率選擇性加密
 * 5. **可維護性**: 集中配置,易於審計和更新
 */
export const SENSITIVE_FIELDS_CONFIG: SensitiveFieldConfig[] = [
  // ==========================================
  // 客戶相關模型
  // ==========================================
  {
    model: 'Customer',
    fields: ['email', 'phone', 'notes'],
    sensitivity: SensitivityLevel.HIGH,
    enabled: true,
    description: '客戶聯繫資訊和內部備註(可能包含敏感商業資訊)'
  },
  {
    model: 'Contact',
    fields: ['email', 'phone', 'notes'],
    sensitivity: SensitivityLevel.HIGH,
    enabled: true,
    description: '聯繫人個人資訊和備註'
  },

  // ==========================================
  // 銷售機會模型
  // ==========================================
  {
    model: 'SalesOpportunity',
    fields: ['description', 'notes'],
    sensitivity: SensitivityLevel.MEDIUM,
    enabled: true,
    description: '銷售機會詳細描述和內部備註(可能包含定價、策略等機密)'
  },

  // ==========================================
  // 知識庫模型
  // ==========================================
  {
    model: 'KnowledgeBase',
    fields: ['content'],
    sensitivity: SensitivityLevel.MEDIUM,
    enabled: false, // 暫時停用,因為知識庫內容較大,加密會顯著影響性能
    description: '知識庫文檔內容(可能包含公司內部資訊和機密)'
  },

  // ==========================================
  // 提案模型
  // ==========================================
  {
    model: 'Proposal',
    fields: ['content'],
    sensitivity: SensitivityLevel.HIGH,
    enabled: false, // 暫時停用,待性能測試後決定
    description: '提案文檔內容(包含定價、條款等機密商業資訊)'
  },

  // ==========================================
  // API金鑰模型 (額外保護層)
  // ==========================================
  {
    model: 'ApiKey',
    fields: ['key_hash'],
    sensitivity: SensitivityLevel.HIGH,
    enabled: false, // key_hash已經是bcrypt hash,加密作為額外保護層(可選)
    description: 'API金鑰Hash(雖然已hash,加密可提供額外保護層)'
  },

  // ==========================================
  // 通知系統
  // ==========================================
  {
    model: 'Notification',
    fields: ['content'],
    sensitivity: SensitivityLevel.LOW,
    enabled: false, // 通知內容通常不含敏感資訊
    description: '通知內容(一般不含敏感資訊,可選加密)'
  }
];

/**
 * 根據Model名稱獲取敏感欄位配置
 *
 * @param modelName - Prisma模型名稱
 * @returns 敏感欄位配置,如果不存在則返回undefined
 *
 * @example
 * const customerConfig = getSensitiveFieldsConfig('Customer');
 * if (customerConfig && customerConfig.enabled) {
 *   // 加密Customer的敏感欄位
 * }
 */
export function getSensitiveFieldsConfig(modelName: string): SensitiveFieldConfig | undefined {
  return SENSITIVE_FIELDS_CONFIG.find(config => config.model === modelName);
}

/**
 * 獲取指定模型需要加密的欄位清單
 *
 * @param modelName - Prisma模型名稱
 * @param onlyEnabled - 是否只返回啟用的配置 (默認: true)
 * @returns 需要加密的欄位名稱陣列
 *
 * @example
 * const fieldsToEncrypt = getSensitiveFields('Customer');
 * // 返回: ['email', 'phone', 'notes']
 */
export function getSensitiveFields(modelName: string, onlyEnabled: boolean = true): string[] {
  const config = getSensitiveFieldsConfig(modelName);
  if (!config) {
    return [];
  }

  if (onlyEnabled && !config.enabled) {
    return [];
  }

  return config.fields;
}

/**
 * 檢查指定欄位是否為敏感欄位
 *
 * @param modelName - Prisma模型名稱
 * @param fieldName - 欄位名稱
 * @param onlyEnabled - 是否只檢查啟用的配置 (默認: true)
 * @returns true表示該欄位為敏感欄位且需要加密
 *
 * @example
 * if (isSensitiveField('Customer', 'email')) {
 *   // 加密email欄位
 * }
 */
export function isSensitiveField(
  modelName: string,
  fieldName: string,
  onlyEnabled: boolean = true
): boolean {
  const fields = getSensitiveFields(modelName, onlyEnabled);
  return fields.includes(fieldName);
}

/**
 * 獲取所有已啟用的敏感欄位配置
 *
 * @returns 已啟用的敏感欄位配置陣列
 *
 * @example
 * const enabledConfigs = getEnabledSensitiveFieldsConfigs();
 * // 用於批量加密操作或性能測試
 */
export function getEnabledSensitiveFieldsConfigs(): SensitiveFieldConfig[] {
  return SENSITIVE_FIELDS_CONFIG.filter(config => config.enabled);
}

/**
 * 獲取指定安全等級的所有配置
 *
 * @param level - 安全等級
 * @param onlyEnabled - 是否只返回啟用的配置 (默認: true)
 * @returns 符合指定安全等級的配置陣列
 *
 * @example
 * const highSensitivityConfigs = getSensitiveFieldsConfigsByLevel(SensitivityLevel.HIGH);
 * // 用於優先處理高敏感度資料的加密
 */
export function getSensitiveFieldsConfigsByLevel(
  level: SensitivityLevel,
  onlyEnabled: boolean = true
): SensitiveFieldConfig[] {
  return SENSITIVE_FIELDS_CONFIG.filter(
    config => config.sensitivity === level && (!onlyEnabled || config.enabled)
  );
}

/**
 * 配置統計資訊
 *
 * @returns 敏感欄位配置的統計資訊
 *
 * @example
 * const stats = getSensitiveFieldsStats();
 * console.log(`已啟用模型: ${stats.enabledModels}, 總敏感欄位: ${stats.totalFields}`);
 */
export function getSensitiveFieldsStats() {
  const enabled = getEnabledSensitiveFieldsConfigs();
  const totalFields = SENSITIVE_FIELDS_CONFIG.reduce((sum, config) => sum + config.fields.length, 0);
  const enabledFields = enabled.reduce((sum, config) => sum + config.fields.length, 0);

  return {
    totalModels: SENSITIVE_FIELDS_CONFIG.length,
    enabledModels: enabled.length,
    totalFields,
    enabledFields,
    byLevel: {
      high: getSensitiveFieldsConfigsByLevel(SensitivityLevel.HIGH, false).length,
      medium: getSensitiveFieldsConfigsByLevel(SensitivityLevel.MEDIUM, false).length,
      low: getSensitiveFieldsConfigsByLevel(SensitivityLevel.LOW, false).length
    },
    byLevelEnabled: {
      high: getSensitiveFieldsConfigsByLevel(SensitivityLevel.HIGH, true).length,
      medium: getSensitiveFieldsConfigsByLevel(SensitivityLevel.MEDIUM, true).length,
      low: getSensitiveFieldsConfigsByLevel(SensitivityLevel.LOW, true).length
    }
  };
}
