/**
 * @fileoverview Security Module ExportsCentralized export for all security-related services
 * @module lib/security/index
 * @description
 * Security Module ExportsCentralized export for all security-related services
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

// RBAC Core
export * from './rbac';
export * from './permission-middleware';

// Audit Logging
export * from './audit-log';
export * from './audit-log-prisma';

// Fine-Grained Permissions
export * from './field-level-permissions';
export * from './resource-conditions';
export * from './action-restrictions';
export * from './fine-grained-permissions';

// Encryption
export * from './encryption';
export {
  SensitivityLevel,
  type EncryptionFieldConfig,
  SENSITIVE_FIELDS_CONFIG,
  getSensitiveFieldsConfig,
  getEnabledSensitiveFieldsConfigs,
  getSensitiveFieldsConfigsByLevel,
  getSensitiveFields,
  isEncryptedField,
  // Note: isSensitiveField is deprecated and exported from field-level-permissions instead
} from './sensitive-fields-config';

// Azure Key Vault
export * from './azure-key-vault';

// Edit Lock (Collaboration)
// Note: edit-lock-manager is not yet implemented
// export * from './edit-lock-manager';
