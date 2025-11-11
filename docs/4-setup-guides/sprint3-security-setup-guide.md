# Sprint 3: 安全加固與合規 - 設置指南

> **版本**: 1.0
> **日期**: 2025-10-05
> **Sprint**: Sprint 3 Week 5 - 資料安全強化
> **作者**: Claude Code

## 📋 概述

本文檔詳細說明Sprint 3安全加固功能的設置和配置步驟,包括:
- 資料加密(靜態和傳輸)
- Azure Key Vault整合
- HTTPS/TLS強制
- 角色權限控制(RBAC)
- 審計日誌系統

## 🔐 1. 資料加密設置

### 1.1 欄位級加密

**功能**: 使用AES-256-GCM加密敏感資料

**設置步驟**:

1. **生成加密金鑰**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **設置環境變數** (`.env.local`):
   ```env
   ENCRYPTION_KEY=<your-generated-key>
   ```

3. **使用加密服務**:
   ```typescript
   import { EncryptionService } from '@/lib/security/encryption';

   const encryptionService = EncryptionService.getInstance();

   // 加密
   const encrypted = encryptionService.encrypt('sensitive data');

   // 解密
   const decrypted = encryptionService.decrypt(encrypted);
   ```

**注意事項**:
- ⚠️ 生產環境必須設置`ENCRYPTION_KEY`
- 🔑 金鑰應存儲在Azure Key Vault而非環境變數
- 🔄 建議每90-180天輪換金鑰

### 1.2 Azure Key Vault整合 (生產環境推薦)

**功能**: 雲端金鑰管理服務,提供企業級安全性

**設置步驟**:

1. **創建Azure Key Vault**:
   ```bash
   az keyvault create \
     --name your-key-vault \
     --resource-group your-resource-group \
     --location eastus
   ```

2. **配置環境變數** (`.env.local`):
   ```env
   AZURE_KEY_VAULT_URL=https://your-key-vault.vault.azure.net/
   AZURE_TENANT_ID=your-tenant-id
   AZURE_CLIENT_ID=your-client-id
   AZURE_CLIENT_SECRET=your-client-secret
   USE_MANAGED_IDENTITY=false  # Azure上設為true
   ```

3. **設置訪問策略**:
   ```bash
   az keyvault set-policy \
     --name your-key-vault \
     --spn <client-id> \
     --secret-permissions get list set delete
   ```

4. **存儲加密金鑰到Key Vault**:
   ```typescript
   import { AzureKeyVaultService } from '@/lib/security/azure-key-vault';

   const vault = AzureKeyVaultService.getInstance();

   // 存儲金鑰
   await vault.setSecret('encryption-key', yourEncryptionKey);

   // 獲取金鑰
   const key = await vault.getSecret('encryption-key');
   ```

**生產環境最佳實踐**:
- ✅ 使用Managed Identity(無需密碼)
- ✅ 啟用Key Vault軟刪除
- ✅ 設置訪問日誌和警報
- ✅ 定期審計訪問記錄

### 1.3 資料庫級加密 (PostgreSQL TDE)

**功能**: 透明資料加密(Transparent Data Encryption)

**Azure PostgreSQL設置**:

1. **啟用TDE** (默認啟用):
   ```bash
   az postgres server update \
     --name your-server \
     --resource-group your-resource-group \
     --infrastructure-encryption Enabled
   ```

2. **配置客戶管理的金鑰** (可選):
   ```bash
   az postgres server key create \
     --name your-server \
     --resource-group your-resource-group \
     --kid <key-vault-key-id>
   ```

3. **驗證加密狀態**:
   ```sql
   SELECT name, encryption FROM pg_database;
   ```

**本地PostgreSQL設置**:
```bash
# 安裝pgcrypto擴展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

# 創建加密函數
CREATE OR REPLACE FUNCTION encrypt_data(data text, key text)
RETURNS bytea AS $$
BEGIN
  RETURN pgp_sym_encrypt(data, key);
END;
$$ LANGUAGE plpgsql;
```

## 🔒 2. HTTPS/TLS強制

**功能**: 確保所有連接使用HTTPS加密

**設置步驟**:

1. **配置環境變數** (`.env.local`):
   ```env
   ENABLE_HTTPS_ENFORCEMENT=true
   HSTS_MAX_AGE=31536000
   HSTS_INCLUDE_SUBDOMAINS=true
   HSTS_PRELOAD=false
   ```

2. **更新中間件** (`middleware.ts`):
   ```typescript
   import { createHttpsEnforcementMiddleware } from '@/lib/middleware/https-enforcement';

   const httpsMiddleware = createHttpsEnforcementMiddleware({
     enabled: process.env.ENABLE_HTTPS_ENFORCEMENT === 'true',
     hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'),
     includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS === 'true'
   });

   export async function middleware(request: NextRequest) {
     // HTTPS強制
     const httpsResponse = httpsMiddleware.handle(request);
     if (httpsResponse) return httpsResponse;

     // ... 其他中間件
   }
   ```

3. **本地開發HTTPS** (可選):
   ```bash
   # 生成自簽證書
   mkcert -install
   mkcert localhost 127.0.0.1 ::1

   # 更新next.config.js
   # (Next.js自動處理證書)
   ```

**驗證**:
- ✅ 訪問HTTP應自動重定向到HTTPS
- ✅ 響應包含`Strict-Transport-Security`頭部
- ✅ 瀏覽器顯示安全鎖圖標

## 👥 3. 角色權限控制 (RBAC)

**功能**: 基於角色的訪問控制

**角色層級**:
- `ADMIN`: 系統管理員(完全權限)
- `SALES_MANAGER`: 銷售經理(團隊管理)
- `SALES_REP`: 銷售代表(個人業務)
- `MARKETING`: 市場人員(內容管理)
- `VIEWER`: 訪客(只讀)

**使用示例**:

```typescript
import { RBACService, Resource, Action } from '@/lib/security/rbac';
import { UserRole } from '@prisma/client';

// 檢查權限
const canEdit = RBACService.hasPermission(
  UserRole.SALES_REP,
  Resource.CUSTOMERS,
  Action.UPDATE
);

// 檢查資源擁有權
const owns = RBACService.ownsResource(
  userRole,
  userId,
  resourceOwnerId
);

// API路由中使用
export async function PUT(request: NextRequest) {
  const user = await verifyAccessToken(token);

  if (!RBACService.hasPermission(user.role, Resource.CUSTOMERS, Action.UPDATE)) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  // 執行更新...
}
```

**權限矩陣**:

| 角色 | 客戶 | 提案 | 知識庫 | 系統配置 |
|------|------|------|--------|---------|
| ADMIN | 完全 | 完全 | 完全 | 完全 |
| SALES_MANAGER | 完全 | 審批 | 讀取 | - |
| SALES_REP | 自己的 | 自己的 | 讀取 | - |
| MARKETING | 讀取 | - | 完全 | - |
| VIEWER | 讀取 | 讀取 | 讀取 | - |

## 📊 4. 審計日誌系統

**功能**: 完整的操作審計追蹤

**使用示例**:

```typescript
import { AuditLogger, AuditAction, AuditResource } from '@/lib/security/audit-log';

// 記錄操作
await AuditLogger.log({
  userId: user.id,
  action: AuditAction.UPDATE,
  resource: AuditResource.CUSTOMER,
  resourceId: customerId,
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
  details: { changes: { name: 'New Name' } }
});

// 查詢審計日誌
const logs = await AuditLogger.query({
  userId: user.id,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31')
});

// 獲取統計
const stats = await AuditLogger.getStats({
  userId: user.id
});
```

**自動審計**:
- ✅ 所有CRUD操作
- ✅ 認證和授權事件
- ✅ 權限變更
- ✅ 敏感資料訪問
- ✅ 系統配置變更

## 🔧 5. 部署清單

### 開發環境

- [ ] 設置`ENCRYPTION_KEY`環境變數
- [ ] 安裝npm依賴: `npm install`
- [ ] 運行資料庫遷移(如有)
- [ ] 測試加密/解密功能
- [ ] 驗證RBAC權限
- [ ] 檢查審計日誌

### 生產環境

**必需配置**:
- [ ] 創建Azure Key Vault
- [ ] 配置Key Vault訪問策略
- [ ] 啟用PostgreSQL TDE
- [ ] 設置HTTPS證書
- [ ] 配置HSTS頭部
- [ ] 啟用審計日誌持久化
- [ ] 設置日誌監控和警報

**環境變數檢查**:
```bash
# 必需
ENCRYPTION_KEY=✓
AZURE_KEY_VAULT_URL=✓
DATABASE_URL (with sslmode=require)=✓

# 推薦
USE_MANAGED_IDENTITY=true
ENABLE_HTTPS_ENFORCEMENT=true
HSTS_MAX_AGE=31536000
```

**安全檢查清單**:
- [ ] 所有密碼和金鑰存儲在Key Vault
- [ ] 資料庫使用TDE加密
- [ ] 強制HTTPS連接
- [ ] HSTS頭部已設置
- [ ] RBAC權限已配置
- [ ] 審計日誌已啟用
- [ ] 定期金鑰輪換計劃
- [ ] 安全監控和警報

## 📚 6. 相關文檔

- [加密服務API文檔](../lib/security/encryption.ts)
- [Azure Key Vault服務](../lib/security/azure-key-vault.ts)
- [HTTPS強制中間件](../lib/middleware/https-enforcement.ts)
- [RBAC服務](../lib/security/rbac.ts)
- [審計日誌服務](../lib/security/audit-log.ts)

## ⚠️ 7. 常見問題

### Q: ENCRYPTION_KEY丟失怎麼辦?
**A**: 加密資料將無法解密。請務必:
- 將金鑰備份到Azure Key Vault
- 設置金鑰恢復程序
- 定期驗證備份金鑰

### Q: 如何輪換加密金鑰?
**A**: 使用以下步驟:
1. 生成新金鑰
2. 解密舊資料(使用舊金鑰)
3. 重新加密(使用新金鑰)
4. 更新Key Vault
5. 更新應用配置

### Q: HTTPS在本地開發如何測試?
**A**: 使用`mkcert`生成本地證書:
```bash
mkcert -install
mkcert localhost
```

### Q: RBAC如何添加新角色?
**A**: 修改以下文件:
1. `prisma/schema.prisma` - 添加角色枚舉
2. `lib/security/rbac.ts` - 添加權限映射
3. 運行資料庫遷移

## 🎯 8. 下一步

Sprint 3 Week 6 將實施:
- GDPR/PDPA合規
- 安全掃描與修復
- 合規文檔編寫
- 滲透測試

---

**文檔維護**: 請在修改安全配置時更新本文檔
**支援**: 如有問題請聯繫安全團隊或參考[Azure安全最佳實踐](https://learn.microsoft.com/azure/security/)
