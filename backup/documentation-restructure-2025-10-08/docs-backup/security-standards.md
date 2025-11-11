# AI 銷售賦能平台 - 安全規範與標準

## 文件資訊
- **版本**: 1.0
- **建立日期**: 2025-01-23
- **最後更新**: 2025-01-23
- **負責人**: 架構團隊
- **審核狀態**: 待審核

## 1. 概述

本文件定義了 AI 銷售賦能平台的安全規範和標準，補充架構文件第14章的技術實施細節，提供具體的安全操作指南和最佳實踐。

### 1.1 安全目標

- **機密性 (Confidentiality)**: 保護客戶數據和商業機密
- **完整性 (Integrity)**: 確保數據準確性和系統可靠性
- **可用性 (Availability)**: 維持系統高可用性和業務連續性
- **可審計性 (Auditability)**: 提供完整的操作追蹤和合規支持

### 1.2 合規要求

- **GDPR**: 歐盟一般數據保護規範
- **SOC 2 Type II**: 服務組織控制審計
- **ISO 27001**: 信息安全管理體系
- **OWASP Top 10**: Web 應用安全風險

## 2. 身份驗證與授權標準

### 2.1 密碼策略

#### 密碼要求
```typescript
export const PasswordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  prohibitCommonPasswords: true,
  prohibitPersonalInfo: true,
  historyCount: 12, // 不得重複使用最近12個密碼
  maxAge: 90, // 密碼最長有效期（天）
  lockoutThreshold: 5, // 連續失敗次數
  lockoutDuration: 30 // 鎖定時間（分鐘）
};

// 密碼強度驗證正則表達式
export const PasswordRegex = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  numbers: /[0-9]/,
  specialChars: /[!@#$%^&*(),.?":{}|<>]/,
  noSequential: /^(?!.*(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789))/i,
  noRepeating: /^(?!.*(.)\1{2,})/
};
```

#### 多因素驗證 (MFA) 實施
```typescript
// MFA 配置
export const MFAConfig = {
  required: {
    admin: true,
    salesManager: true,
    salesRep: false, // 建議啟用
    marketing: false,
    viewer: false
  },
  methods: [
    'authenticator_app', // TOTP (推薦)
    'sms', // SMS 驗證碼（備用）
    'email', // 電子郵件驗證碼（備用）
    'hardware_token' // 硬體 Token（高安全性場景）
  ],
  backupCodes: {
    count: 10,
    length: 8,
    oneTimeUse: true
  }
};

// MFA 驗證流程
export class MFAService {
  async enableMFA(userId: number, method: string): Promise<MFASetupResult> {
    const secret = this.generateTOTPSecret();
    const qrCode = await this.generateQRCode(secret, userId);

    // 存儲臨時密鑰，等待用戶驗證
    await this.storeTemporarySecret(userId, secret);

    return {
      secret,
      qrCode,
      backupCodes: this.generateBackupCodes()
    };
  }

  async verifyMFA(userId: number, token: string): Promise<boolean> {
    const user = await this.getUser(userId);

    // 驗證 TOTP
    if (this.verifyTOTP(user.mfaSecret, token)) {
      return true;
    }

    // 驗證備用碼
    if (this.verifyBackupCode(userId, token)) {
      return true;
    }

    return false;
  }
}
```

### 2.2 會話管理

#### JWT Token 安全配置
```typescript
export const JWTConfig = {
  algorithm: 'RS256', // 使用非對稱加密
  accessTokenExpiry: '15m', // 存取 Token 15分鐘
  refreshTokenExpiry: '7d', // 刷新 Token 7天
  issuer: 'sales-enablement-platform',
  audience: 'sales-enablement-users',

  // 安全標頭
  securityHeaders: {
    httpOnly: true,
    secure: true, // 僅 HTTPS
    sameSite: 'strict',
    path: '/'
  },

  // Token 輪換策略
  rotation: {
    enabled: true,
    threshold: '50%' // Token 生命周期50%時自動刷新
  }
};

// 會話安全實施
export class SessionSecurity {
  async createSession(user: User, ipAddress: string, userAgent: string): Promise<SessionResult> {
    // 檢查並發會話限制
    await this.enforceSessionLimit(user.id);

    // 生成會話 ID
    const sessionId = this.generateSecureSessionId();

    // 存儲會話資訊
    const session = await this.storeSession({
      sessionId,
      userId: user.id,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    });

    // 生成 JWT Token
    const tokens = await this.generateTokens(user, sessionId);

    return { session, tokens };
  }

  async validateSession(sessionId: string, ipAddress: string): Promise<boolean> {
    const session = await this.getSession(sessionId);

    if (!session || !session.isActive) {
      return false;
    }

    // IP 地址變更檢測
    if (session.ipAddress !== ipAddress) {
      await this.flagSuspiciousActivity(session.userId, 'IP_CHANGE', {
        originalIp: session.ipAddress,
        newIp: ipAddress
      });

      // 可選擇是否終止會話
      if (await this.shouldTerminateSession(session)) {
        await this.terminateSession(sessionId);
        return false;
      }
    }

    // 更新最後活動時間
    await this.updateLastActivity(sessionId);

    return true;
  }
}
```

## 3. 數據保護標準

### 3.1 數據分類與處理

#### 數據分類標準
```typescript
export enum DataClassification {
  PUBLIC = 'public',           // 公開數據
  INTERNAL = 'internal',       // 內部數據
  CONFIDENTIAL = 'confidential', // 機密數據
  RESTRICTED = 'restricted'    // 限制數據
}

export const DataHandlingRules = {
  [DataClassification.PUBLIC]: {
    encryption: false,
    accessControl: 'none',
    retention: 'unlimited',
    transmission: 'any'
  },
  [DataClassification.INTERNAL]: {
    encryption: true,
    accessControl: 'authenticated',
    retention: '7_years',
    transmission: 'secure_channel'
  },
  [DataClassification.CONFIDENTIAL]: {
    encryption: true,
    accessControl: 'role_based',
    retention: '3_years',
    transmission: 'encrypted_only',
    auditRequired: true
  },
  [DataClassification.RESTRICTED]: {
    encryption: true,
    accessControl: 'explicit_permission',
    retention: '1_year',
    transmission: 'encrypted_only',
    auditRequired: true,
    approvalRequired: true
  }
};
```

#### 個人資料保護 (PII)
```typescript
export class PIIProtection {
  // PII 字段識別
  static readonly PII_FIELDS = [
    'email', 'phone', 'address', 'ssn', 'passport',
    'credit_card', 'bank_account', 'date_of_birth'
  ];

  // 數據遮罩
  static maskPII(data: any, userRole: UserRole): any {
    const maskedData = { ...data };

    for (const field of this.PII_FIELDS) {
      if (maskedData[field] && !this.canViewPII(userRole, field)) {
        maskedData[field] = this.maskField(maskedData[field], field);
      }
    }

    return maskedData;
  }

  // 字段遮罩實施
  private static maskField(value: string, fieldType: string): string {
    switch (fieldType) {
      case 'email':
        return this.maskEmail(value);
      case 'phone':
        return this.maskPhone(value);
      case 'credit_card':
        return this.maskCreditCard(value);
      default:
        return '*'.repeat(value.length);
    }
  }

  private static maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    const maskedUser = user.length > 2 ?
      user[0] + '*'.repeat(user.length - 2) + user[user.length - 1] :
      '*'.repeat(user.length);
    return `${maskedUser}@${domain}`;
  }
}
```

### 3.2 加密標準

#### 靜態數據加密
```typescript
export const EncryptionStandards = {
  // 對稱加密
  symmetric: {
    algorithm: 'AES-256-GCM',
    keySize: 256,
    ivSize: 96,
    tagSize: 128
  },

  // 非對稱加密
  asymmetric: {
    algorithm: 'RSA-OAEP',
    keySize: 4096,
    hashFunction: 'SHA-256'
  },

  // 雜湊算法
  hashing: {
    password: 'bcrypt',
    rounds: 12,
    general: 'SHA-256'
  },

  // 密鑰衍生
  keyDerivation: {
    algorithm: 'PBKDF2',
    iterations: 100000,
    saltLength: 32
  }
};

// 數據加密服務
export class DataEncryptionService {
  async encryptSensitiveData(data: string, classification: DataClassification): Promise<EncryptedData> {
    if (classification === DataClassification.PUBLIC) {
      return { data, encrypted: false };
    }

    const key = await this.getDEK(); // 數據加密密鑰
    const iv = crypto.randomBytes(12); // 隨機初始向量

    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(Buffer.from(classification)); // 附加驗證數據

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      data: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      encrypted: true,
      algorithm: 'AES-256-GCM'
    };
  }

  async decryptSensitiveData(encryptedData: EncryptedData): Promise<string> {
    if (!encryptedData.encrypted) {
      return encryptedData.data;
    }

    const key = await this.getDEK();
    const decipher = crypto.createDecipher('aes-256-gcm', key);

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

#### 傳輸安全
```typescript
export const TransportSecurity = {
  // TLS 配置
  tls: {
    minVersion: 'TLSv1.2',
    preferredVersion: 'TLSv1.3',
    ciphers: [
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-SHA384',
      'ECDHE-RSA-AES128-SHA256'
    ],
    curves: ['prime256v1', 'secp384r1'],
    honorCipherOrder: true
  },

  // HSTS 配置
  hsts: {
    maxAge: 31536000, // 1年
    includeSubDomains: true,
    preload: true
  },

  // 證書固定
  certificatePinning: {
    enabled: true,
    pins: [
      'sha256/YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=',
      'sha256/sRHdihwgkaib1P1gxX8HFszlD+7/gTfNvuAybgLPNis='
    ],
    backupPins: [
      'sha256/Tb0uHZ/KQjWh8N9+CZFLc4zx36LONQ55l6laDi1qtT4='
    ]
  }
};
```

## 4. 存取控制標準

### 4.1 角色基礎存取控制 (RBAC)

#### 角色權限矩陣
```typescript
export const RolePermissions = {
  ADMIN: {
    users: ['create', 'read', 'update', 'delete'],
    customers: ['create', 'read', 'update', 'delete'],
    callRecords: ['create', 'read', 'update', 'delete'],
    proposals: ['create', 'read', 'update', 'delete'],
    system: ['configure', 'monitor', 'audit'],
    reports: ['generate', 'export', 'schedule']
  },

  SALES_MANAGER: {
    users: ['read', 'update'], // 只能管理下屬
    customers: ['create', 'read', 'update'],
    callRecords: ['create', 'read', 'update'],
    proposals: ['create', 'read', 'update', 'approve'],
    reports: ['generate', 'export'],
    team: ['manage', 'assign']
  },

  SALES_REP: {
    customers: ['create', 'read', 'update'], // 僅限指派的客戶
    callRecords: ['create', 'read', 'update'], // 僅限自己的記錄
    proposals: ['create', 'read', 'update'], // 僅限自己的提案
    reports: ['generate'] // 僅限個人報告
  },

  MARKETING: {
    customers: ['read'], // 只讀客戶資料
    reports: ['generate', 'export'], // 行銷報告
    campaigns: ['create', 'read', 'update', 'delete']
  },

  VIEWER: {
    customers: ['read'], // 僅限查看
    callRecords: ['read'],
    proposals: ['read'],
    reports: ['generate'] // 僅限標準報告
  }
};

// 權限檢查裝飾器
export function RequirePermission(resource: string, action: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const user = this.getCurrentUser();

      if (!this.hasPermission(user, resource, action)) {
        throw new ForbiddenException(`Insufficient permissions for ${action} on ${resource}`);
      }

      return method.apply(this, args);
    };
  };
}
```

### 4.2 資源層級權限

#### 數據存取範圍
```typescript
export class DataAccessScope {
  static getCustomerScope(user: User): CustomerScope {
    switch (user.role) {
      case UserRole.ADMIN:
        return { type: 'all' };

      case UserRole.SALES_MANAGER:
        return {
          type: 'team',
          teamMembers: user.managedUsers
        };

      case UserRole.SALES_REP:
        return {
          type: 'assigned',
          userId: user.id
        };

      case UserRole.MARKETING:
        return {
          type: 'marketing',
          restrictions: ['no_pii']
        };

      case UserRole.VIEWER:
        return {
          type: 'readonly',
          restrictions: ['no_pii', 'no_financial']
        };

      default:
        return { type: 'none' };
    }
  }

  static applyCustomerFilter(query: any, scope: CustomerScope): any {
    switch (scope.type) {
      case 'all':
        return query; // 無限制

      case 'team':
        return query.whereIn('assigned_user_id', scope.teamMembers);

      case 'assigned':
        return query.where('assigned_user_id', scope.userId);

      case 'marketing':
        return query.select(this.getMarketingFields());

      case 'readonly':
        return query.select(this.getViewerFields());

      default:
        return query.where('1', '0'); // 無數據
    }
  }
}
```

## 5. 安全監控與事件響應

### 5.1 安全事件檢測

#### 異常行為檢測
```typescript
export class SecurityMonitoring {
  // 異常登入檢測
  async detectAnomalousLogin(loginAttempt: LoginAttempt): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    const user = await this.getUser(loginAttempt.userId);

    // 地理位置異常
    const locationAnomaly = await this.checkLocationAnomaly(user, loginAttempt.ipAddress);
    if (locationAnomaly.isAnomalous) {
      alerts.push({
        type: 'LOCATION_ANOMALY',
        severity: 'HIGH',
        description: `Login from unusual location: ${locationAnomaly.location}`,
        recommendation: 'Verify user identity with additional authentication'
      });
    }

    // 設備指紋異常
    const deviceAnomaly = await this.checkDeviceAnomaly(user, loginAttempt.userAgent);
    if (deviceAnomaly.isAnomalous) {
      alerts.push({
        type: 'DEVICE_ANOMALY',
        severity: 'MEDIUM',
        description: `Login from unrecognized device: ${deviceAnomaly.deviceInfo}`,
        recommendation: 'Request device verification'
      });
    }

    // 時間異常
    const timeAnomaly = await this.checkTimeAnomaly(user, loginAttempt.timestamp);
    if (timeAnomaly.isAnomalous) {
      alerts.push({
        type: 'TIME_ANOMALY',
        severity: 'LOW',
        description: `Login at unusual time: ${loginAttempt.timestamp}`,
        recommendation: 'Monitor subsequent activities'
      });
    }

    return alerts;
  }

  // 數據存取模式分析
  async analyzeAccessPatterns(userId: number, timeWindow: number = 24): Promise<AccessAnalysis> {
    const activities = await this.getUserActivities(userId, timeWindow);

    const analysis = {
      totalRequests: activities.length,
      uniqueResources: new Set(activities.map(a => a.resource)).size,
      averageInterval: this.calculateAverageInterval(activities),
      suspiciousPatterns: []
    };

    // 檢測大量數據下載
    const downloadPattern = this.detectBulkDownload(activities);
    if (downloadPattern.isSuspicious) {
      analysis.suspiciousPatterns.push({
        type: 'BULK_DOWNLOAD',
        evidence: downloadPattern.evidence,
        riskLevel: 'HIGH'
      });
    }

    // 檢測異常存取頻率
    const frequencyPattern = this.detectHighFrequency(activities);
    if (frequencyPattern.isSuspicious) {
      analysis.suspiciousPatterns.push({
        type: 'HIGH_FREQUENCY',
        evidence: frequencyPattern.evidence,
        riskLevel: 'MEDIUM'
      });
    }

    return analysis;
  }
}
```

### 5.2 事件響應流程

#### 安全事件分級與響應
```typescript
export enum SecurityIncidentLevel {
  LOW = 1,      // 資訊性事件
  MEDIUM = 2,   // 潛在威脅
  HIGH = 3,     // 確認威脅
  CRITICAL = 4  // 嚴重威脅
}

export const IncidentResponse = {
  [SecurityIncidentLevel.LOW]: {
    responseTime: '24_hours',
    actions: ['log', 'monitor'],
    notifications: ['security_team'],
    escalation: false
  },

  [SecurityIncidentLevel.MEDIUM]: {
    responseTime: '4_hours',
    actions: ['log', 'investigate', 'additional_monitoring'],
    notifications: ['security_team', 'it_manager'],
    escalation: false
  },

  [SecurityIncidentLevel.HIGH]: {
    responseTime: '1_hour',
    actions: ['log', 'investigate', 'containment', 'user_notification'],
    notifications: ['security_team', 'it_manager', 'ciso'],
    escalation: true
  },

  [SecurityIncidentLevel.CRITICAL]: {
    responseTime: '15_minutes',
    actions: ['immediate_containment', 'forensic_analysis', 'customer_notification'],
    notifications: ['security_team', 'it_manager', 'ciso', 'ceo'],
    escalation: true,
    businessContinuity: true
  }
};

export class IncidentResponseService {
  async handleSecurityIncident(incident: SecurityIncident): Promise<ResponseAction[]> {
    const level = this.assessIncidentLevel(incident);
    const response = IncidentResponse[level];
    const actions: ResponseAction[] = [];

    // 記錄事件
    await this.logIncident(incident, level);

    // 執行響應動作
    for (const action of response.actions) {
      switch (action) {
        case 'immediate_containment':
          actions.push(await this.containThreat(incident));
          break;
        case 'investigate':
          actions.push(await this.initiateInvestigation(incident));
          break;
        case 'user_notification':
          actions.push(await this.notifyAffectedUsers(incident));
          break;
        case 'forensic_analysis':
          actions.push(await this.startForensicAnalysis(incident));
          break;
      }
    }

    // 發送通知
    await this.sendNotifications(incident, response.notifications);

    // 啟動升級程序
    if (response.escalation) {
      await this.escalateIncident(incident, level);
    }

    return actions;
  }
}
```

## 6. 安全開發生命周期 (SDL)

### 6.1 程式碼安全檢查

#### 靜態程式碼分析規則
```typescript
export const CodeSecurityRules = {
  // 禁止的函數和方法
  forbiddenFunctions: [
    'eval', 'setTimeout', 'setInterval', // 代碼注入風險
    'innerHTML', 'outerHTML', // XSS 風險
    'document.write', 'document.writeln', // DOM 操作風險
    'exec', 'system', 'shell_exec' // 命令注入風險
  ],

  // 必須的安全標頭
  requiredHeaders: [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Content-Security-Policy',
    'Strict-Transport-Security'
  ],

  // 敏感資料模式
  sensitivePatterns: [
    /password\s*[:=]\s*['"]([^'"]*)['"]/i,
    /api[_-]?key\s*[:=]\s*['"]([^'"]*)['"]/i,
    /secret\s*[:=]\s*['"]([^'"]*)['"]/i,
    /token\s*[:=]\s*['"]([^'"]*)['"]/i
  ],

  // SQL 注入模式
  sqlInjectionPatterns: [
    /select\s+.*\s+from\s+.*\s+where\s+.*\s*\+\s*/i,
    /insert\s+into\s+.*\s+values\s*\(.*\$.*\)/i,
    /update\s+.*\s+set\s+.*\s*=\s*.*\$.*\s+where/i,
    /delete\s+from\s+.*\s+where\s+.*\$.*$/i
  ]
};

// ESLint 安全規則配置
export const ESLintSecurityConfig = {
  plugins: ['security', '@typescript-eslint'],
  rules: {
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error'
  }
};
```

### 6.2 安全測試標準

#### 滲透測試檢查清單
```typescript
export const PenetrationTestChecklist = {
  authentication: [
    'Brute force attack resistance',
    'Password policy enforcement',
    'Account lockout mechanisms',
    'Multi-factor authentication bypass',
    'Session management vulnerabilities'
  ],

  authorization: [
    'Privilege escalation',
    'Horizontal access control',
    'Vertical access control',
    'IDOR (Insecure Direct Object References)',
    'Role-based access control bypass'
  ],

  inputValidation: [
    'SQL injection',
    'NoSQL injection',
    'Cross-site scripting (XSS)',
    'Cross-site request forgery (CSRF)',
    'XML external entity (XXE)',
    'Server-side request forgery (SSRF)',
    'Template injection',
    'Command injection'
  ],

  dataProtection: [
    'Sensitive data exposure',
    'Encryption at rest',
    'Encryption in transit',
    'Key management',
    'Data leakage',
    'Backup security'
  ],

  businessLogic: [
    'Workflow bypass',
    'Rate limiting',
    'Transaction integrity',
    'Time-based attacks',
    'Resource exhaustion'
  ]
};
```

## 7. 合規性要求

### 7.1 GDPR 合規實施

#### 數據處理記錄
```typescript
export class GDPRCompliance {
  async recordDataProcessing(activity: DataProcessingActivity): Promise<void> {
    const record = {
      id: generateUUID(),
      timestamp: new Date(),
      lawfulBasis: activity.lawfulBasis,
      dataSubject: activity.dataSubject,
      personalDataCategories: activity.personalDataCategories,
      recipients: activity.recipients,
      retentionPeriod: activity.retentionPeriod,
      securityMeasures: activity.securityMeasures,
      processor: activity.processor
    };

    await this.saveProcessingRecord(record);
  }

  // 數據主體權利實施
  async handleDataSubjectRequest(request: DataSubjectRequest): Promise<DataSubjectResponse> {
    switch (request.type) {
      case 'ACCESS':
        return this.handleAccessRequest(request);
      case 'RECTIFICATION':
        return this.handleRectificationRequest(request);
      case 'ERASURE':
        return this.handleErasureRequest(request);
      case 'PORTABILITY':
        return this.handlePortabilityRequest(request);
      case 'RESTRICTION':
        return this.handleRestrictionRequest(request);
      case 'OBJECTION':
        return this.handleObjectionRequest(request);
      default:
        throw new Error(`Unsupported request type: ${request.type}`);
    }
  }

  // 資料保護影響評估 (DPIA)
  async conductDPIA(processing: ProcessingActivity): Promise<DPIAResult> {
    const assessment = {
      necessity: this.assessNecessity(processing),
      proportionality: this.assessProportionality(processing),
      risks: this.identifyRisks(processing),
      safeguards: this.identifySafeguards(processing),
      consultation: this.assessConsultationNeeds(processing)
    };

    const riskScore = this.calculateRiskScore(assessment);

    return {
      assessment,
      riskScore,
      recommendation: this.generateRecommendation(riskScore),
      requiresDPO: riskScore >= 7,
      requiresAuthorityConsultation: riskScore >= 9
    };
  }
}
```

### 7.2 SOC 2 控制實施

#### 安全控制矩陣
```typescript
export const SOC2Controls = {
  // 安全性原則
  Security: {
    CC6_1: {
      name: '邏輯和實體存取控制',
      implementation: 'RBAC 系統 + MFA + 實體安全措施',
      testing: '季度存取權限審查',
      evidence: ['存取日誌', '權限矩陣', '實體安全檢查']
    },
    CC6_2: {
      name: '軟體開發前的邏輯存取安全',
      implementation: 'SDL + 安全程式碼審查',
      testing: '每次發布前的安全測試',
      evidence: ['程式碼審查記錄', '安全測試報告']
    },
    CC6_3: {
      name: '網路安全',
      implementation: '防火牆 + IDS/IPS + 網路分段',
      testing: '月度漏洞掃描',
      evidence: ['網路架構圖', '安全配置', '掃描報告']
    }
  },

  // 可用性原則
  Availability: {
    A1_1: {
      name: '可用性和性能監控',
      implementation: 'Azure Monitor + 自動化告警',
      testing: '日常監控檢查',
      evidence: ['監控儀表板', '告警記錄', 'SLA 報告']
    },
    A1_2: {
      name: '備份和恢復',
      implementation: '自動化備份 + 災難恢復計畫',
      testing: '季度災難恢復演習',
      evidence: ['備份記錄', '恢復測試報告']
    }
  }
};
```

## 8. 安全培訓與意識

### 8.1 安全培訓計畫

#### 角色基礎培訓矩陣
```typescript
export const SecurityTrainingMatrix = {
  ALL_USERS: {
    frequency: 'annual',
    modules: [
      'Security Awareness Fundamentals',
      'Password Security',
      'Phishing Recognition',
      'Data Classification',
      'Incident Reporting'
    ],
    assessment: true,
    passingScore: 80
  },

  DEVELOPERS: {
    frequency: 'bi-annual',
    modules: [
      'Secure Coding Practices',
      'OWASP Top 10',
      'Input Validation',
      'Authentication & Authorization',
      'Cryptography Fundamentals'
    ],
    assessment: true,
    passingScore: 85,
    handsonLabs: true
  },

  ADMINS: {
    frequency: 'quarterly',
    modules: [
      'Infrastructure Security',
      'Identity and Access Management',
      'Security Monitoring',
      'Incident Response',
      'Compliance Requirements'
    ],
    assessment: true,
    passingScore: 90,
    certification: 'required'
  }
};
```

## 9. 安全指標與 KPI

### 9.1 安全性能指標

#### 關鍵安全指標
```typescript
export const SecurityKPIs = {
  // 預防性指標
  preventive: {
    'patch_compliance_rate': {
      target: '>95%',
      measurement: 'monthly',
      formula: '(patched_systems / total_systems) * 100'
    },
    'security_training_completion': {
      target: '>98%',
      measurement: 'quarterly',
      formula: '(completed_training / required_training) * 100'
    },
    'vulnerability_scan_coverage': {
      target: '100%',
      measurement: 'weekly',
      formula: '(scanned_assets / total_assets) * 100'
    }
  },

  // 檢測性指標
  detective: {
    'mean_time_to_detection': {
      target: '<1 hour',
      measurement: 'monthly',
      formula: 'avg(detection_time - incident_start_time)'
    },
    'false_positive_rate': {
      target: '<5%',
      measurement: 'monthly',
      formula: '(false_positives / total_alerts) * 100'
    }
  },

  // 響應性指標
  responsive: {
    'mean_time_to_response': {
      target: '<15 minutes (critical), <1 hour (high)',
      measurement: 'monthly',
      formula: 'avg(response_time - detection_time)'
    },
    'incident_resolution_time': {
      target: '<4 hours (critical), <24 hours (high)',
      measurement: 'monthly',
      formula: 'avg(resolution_time - incident_start_time)'
    }
  }
};
```

## 10. 安全檢查清單

### 10.1 部署前安全檢查

#### 生產環境部署檢查清單
```typescript
export const ProductionSecurityChecklist = [
  // 配置安全
  {
    category: 'Configuration',
    items: [
      '移除所有預設帳號和密碼',
      '禁用不必要的服務和連接埠',
      '配置安全標頭 (HSTS, CSP, X-Frame-Options)',
      '啟用 HTTPS 並配置正確的 TLS 設定',
      '設定適當的錯誤處理和日誌記錄',
      '配置防火牆規則',
      '啟用監控和告警'
    ]
  },

  // 身份驗證與授權
  {
    category: 'Authentication & Authorization',
    items: [
      '實施強密碼策略',
      '啟用多因素驗證',
      '配置會話管理',
      '實施角色基礎存取控制',
      '測試權限分離',
      '驗證存取控制邊界'
    ]
  },

  // 數據保護
  {
    category: 'Data Protection',
    items: [
      '實施數據加密（靜態和傳輸）',
      '配置密鑰管理',
      '實施數據分類',
      '設定備份和恢復程序',
      '測試數據洩漏防護',
      '驗證 PII 保護措施'
    ]
  }
];
```

---

*本安全規範文件將持續更新以反映最新的安全威脅和最佳實踐。所有團隊成員都有責任遵守這些安全標準並及時報告任何安全問題。*