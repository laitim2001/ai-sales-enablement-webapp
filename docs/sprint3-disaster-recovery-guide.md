# 災難恢復指南 (Disaster Recovery Guide)

**文件版本**: 1.0
**最後更新**: 2025-10-06
**適用範圍**: Sprint 3 Week 6 - 資料備份與災難恢復
**維護者**: IT運維團隊

---

## 📋 目錄

1. [災難恢復概述](#災難恢復概述)
2. [恢復時間目標 (RTO/RPO)](#恢復時間目標-rtorpo)
3. [備份策略](#備份策略)
4. [災難場景與恢復流程](#災難場景與恢復流程)
5. [備份驗證程序](#備份驗證程序)
6. [定期演練計劃](#定期演練計劃)
7. [緊急聯絡清單](#緊急聯絡清單)

---

## 🎯 災難恢復概述

本系統為**內部使用的銷售賦能平台**，災難恢復策略聚焦於：
- ✅ **業務連續性**: 最小化系統停機時間
- ✅ **資料完整性**: 確保客戶和銷售數據不遺失
- ✅ **快速恢復**: 4小時內恢復關鍵業務功能

### 災難定義

本系統定義的災難包括但不限於：
- 資料庫伺服器故障
- 檔案系統損壞
- 應用程式伺服器故障
- 人為誤操作 (誤刪除資料)
- 網路安全事件 (ransomware, 資料洩露)
- 自然災害 (火災、水災導致機房損壞)

---

## ⏱️ 恢復時間目標 (RTO/RPO)

### Recovery Time Objective (RTO) - 恢復時間目標

**定義**: 從災難發生到系統恢復正常運行所需的最大時間

| 系統組件 | RTO目標 | 優先級 | 備註 |
|---------|---------|--------|------|
| 資料庫 (PostgreSQL) | **4小時** | 🔴 極高 | 核心業務資料 |
| 應用程式伺服器 | **2小時** | 🔴 極高 | 部署自動化 |
| 檔案系統 (uploads/) | **8小時** | 🟡 高 | 非即時關鍵 |
| Azure OpenAI服務 | **1小時** | 🟡 高 | 依賴第三方服務 |

**整體RTO目標**: **4小時內恢復關鍵業務功能**

### Recovery Point Objective (RPO) - 恢復點目標

**定義**: 可容忍的最大資料遺失時間

| 資料類型 | RPO目標 | 備份頻率 | 備註 |
|---------|---------|----------|------|
| 客戶資料 | **≤6小時** | 每6小時增量 | 每日完整備份 |
| 銷售提案 | **≤6小時** | 每6小時增量 | 每日完整備份 |
| 知識庫文章 | **≤24小時** | 每日完整備份 | 低變更頻率 |
| 上傳檔案 | **≤24小時** | 每日完整備份 | 歷史檔案 |

**整體RPO目標**: **最多遺失最近6小時的資料變更**

---

## 💾 備份策略

### 1. 資料庫備份 (PostgreSQL)

#### 完整備份 (Full Backup)
- **頻率**: 每日凌晨02:00執行
- **保留期**: 30天
- **格式**: SQL (使用pg_dump)
- **壓縮**: gzip (約70%壓縮率)
- **加密**: AES-256 (使用環境變數中的ENCRYPTION_KEY)

**執行命令**:
```bash
npx tsx scripts/backup/database-backup.ts --type=full
```

#### 增量備份 (Incremental Backup)
- **頻率**: 每6小時執行 (08:00, 14:00, 20:00)
- **保留期**: 7天
- **實施方式**: PostgreSQL WAL歸檔 (需配置postgresql.conf)

**執行命令**:
```bash
npx tsx scripts/backup/database-backup.ts --type=incremental
```

### 2. 檔案系統備份 (uploads/)

#### 完整備份
- **頻率**: 每日凌晨03:00執行
- **保留期**: 30天
- **格式**: tar.gz
- **排除**: *.tmp, *.temp, .DS_Store, Thumbs.db

**執行命令**:
```bash
npx tsx scripts/backup/file-system-backup.ts --type=full
```

#### 增量備份
- **頻率**: 每日14:00執行
- **保留期**: 7天
- **範圍**: 最近24小時修改的檔案

**執行命令**:
```bash
npx tsx scripts/backup/file-system-backup.ts --type=incremental
```

### 3. 統一備份調度

**執行命令** (推薦使用統一調度器):
```bash
# 完整備份 (資料庫 + 檔案系統)
npx tsx scripts/backup/backup-scheduler.ts --type=full

# 增量備份
npx tsx scripts/backup/backup-scheduler.ts --type=incremental
```

### 4. 備份存儲位置

| 備份類型 | 主存儲位置 | 異地備份 | 備註 |
|---------|-----------|----------|------|
| 資料庫備份 | `/backups/database/` | ☁️ Azure Blob Storage (待實施) | 本地 + 雲端雙重保障 |
| 檔案備份 | `/backups/files/` | ☁️ Azure Blob Storage (待實施) | 本地 + 雲端雙重保障 |
| 備份報告 | `/backups/reports/` | 本地 | JSON格式備份執行報告 |

---

## 🚨 災難場景與恢復流程

### 場景1: 資料庫完全損壞

**災難描述**: PostgreSQL資料庫檔案損壞，無法啟動

**恢復流程**:

1. **停止應用程式** (防止進一步資料損壞)
   ```bash
   pm2 stop ai-sales-platform
   # 或 systemctl stop ai-sales-platform
   ```

2. **評估損壞程度**
   ```bash
   # 檢查PostgreSQL日誌
   tail -n 100 /var/log/postgresql/postgresql-*.log

   # 嘗試啟動PostgreSQL
   sudo systemctl start postgresql
   ```

3. **選擇恢復點**
   ```bash
   # 列出可用備份
   ls -lh /backups/database/ | grep backup-

   # 查看備份日誌
   cat /backups/database/backup-log.json | jq '.[] | select(.type=="full") | {timestamp, fileName, size}'
   ```

4. **創建PostgreSQL新資料庫**
   ```bash
   sudo -u postgres psql

   postgres=# DROP DATABASE IF EXISTS ai_sales_db;
   postgres=# CREATE DATABASE ai_sales_db;
   postgres=# \q
   ```

5. **恢復備份**

   **如果是未加密的備份**:
   ```bash
   # 解壓縮
   gunzip -k /backups/database/backup-2025-10-06.sql.gz

   # 恢復到資料庫
   psql -h localhost -U username -d ai_sales_db -f /backups/database/backup-2025-10-06.sql
   ```

   **如果是加密的備份**:
   ```bash
   # 先解密 (需要ENCRYPTION_KEY環境變數)
   # 參考scripts/restore/decrypt-backup.sh (待實施)

   # 解壓縮 → 恢復
   ```

6. **驗證資料完整性**
   ```bash
   psql -h localhost -U username -d ai_sales_db

   -- 檢查資料表數量
   SELECT count(*) FROM information_schema.tables WHERE table_schema='public';

   -- 檢查關鍵資料表
   SELECT count(*) FROM "Customer";
   SELECT count(*) FROM "Proposal";
   SELECT count(*) FROM "KnowledgeBase";

   \q
   ```

7. **啟動應用程式**
   ```bash
   pm2 start ai-sales-platform
   # 或 systemctl start ai-sales-platform
   ```

8. **測試業務功能**
   - 登入系統
   - 查詢客戶資料
   - 建立測試提案
   - 檢查知識庫搜尋

**預估恢復時間**: 2-4小時 (取決於資料庫大小)

---

### 場景2: 誤刪除客戶資料

**災難描述**: 使用者或程式碼錯誤導致批量刪除客戶資料

**恢復流程**:

1. **立即停止刪除操作**
   - 如果是程式碼錯誤，立即停止應用程式
   - 如果是使用者誤操作，立即禁用該使用者帳號

2. **評估損失範圍**
   ```sql
   -- 檢查審計日誌 (如果已實施Week 8審計系統)
   SELECT * FROM "AuditLog"
   WHERE action = 'DELETE'
     AND resource_type = 'Customer'
     AND created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```

3. **選擇恢復策略**
   - **選項A**: 從最新備份恢復 (如果刪除時間在RPO範圍內)
   - **選項B**: 部分資料恢復 (從備份中導出刪除的記錄)

4. **部分資料恢復** (推薦方法):

   ```bash
   # 恢復備份到臨時資料庫
   gunzip -k /backups/database/backup-latest.sql.gz

   sudo -u postgres psql
   postgres=# CREATE DATABASE ai_sales_db_restore;
   postgres=# \q

   psql -h localhost -U username -d ai_sales_db_restore -f /backups/database/backup-latest.sql
   ```

   ```sql
   -- 導出被刪除的客戶資料
   \copy (SELECT * FROM "Customer" WHERE id IN (列出被刪除的ID)) TO '/tmp/deleted_customers.csv' WITH CSV HEADER;

   -- 在生產資料庫中恢復
   \c ai_sales_db
   \copy "Customer" FROM '/tmp/deleted_customers.csv' WITH CSV HEADER;
   ```

5. **驗證恢復結果**
   ```sql
   SELECT count(*) FROM "Customer";
   -- 確認數量恢復正常
   ```

6. **事後分析**
   - 記錄災難原因
   - 實施預防措施 (例如: 軟刪除策略)

**預估恢復時間**: 30分鐘 - 2小時

---

### 場景3: 檔案系統損壞

**災難描述**: /uploads目錄檔案損壞或誤刪除

**恢復流程**:

1. **評估損失範圍**
   ```bash
   # 檢查uploads目錄狀態
   ls -lR ./uploads/

   # 統計檔案數量
   find ./uploads -type f | wc -l
   ```

2. **選擇最新備份**
   ```bash
   ls -lh /backups/files/ | grep file-backup-
   cat /backups/files/file-backup-log.json | jq '.[-1]'
   ```

3. **恢復檔案**
   ```bash
   # 創建臨時目錄
   mkdir -p ./uploads-restore

   # 解壓縮備份
   tar -xzf /backups/files/file-backup-latest.tar.gz -C ./uploads-restore/

   # 比較差異
   diff -r ./uploads ./uploads-restore/

   # 恢復遺失的檔案
   rsync -av ./uploads-restore/ ./uploads/
   ```

4. **驗證檔案完整性**
   ```bash
   # 統計恢復後的檔案數量
   find ./uploads -type f | wc -l

   # 檢查關鍵檔案
   ls -lh ./uploads/proposals/
   ls -lh ./uploads/knowledge-base/
   ```

**預估恢復時間**: 1-2小時

---

## ✅ 備份驗證程序

### 自動驗證

備份腳本已內建驗證機制：
- ✅ **校驗和驗證**: SHA-256確保備份完整性
- ✅ **壓縮包驗證**: tar/gzip完整性測試
- ✅ **日誌記錄**: 所有備份操作詳細記錄

### 手動驗證 (每週執行)

**1. 資料庫備份驗證**:
```bash
# 列出所有資料庫備份
ls -lh /backups/database/

# 檢查備份日誌
cat /backups/database/backup-log.json | jq '.[-5:]'

# 解壓縮最新備份並檢查SQL語法
gunzip -c /backups/database/backup-latest.sql.gz | head -n 50
```

**2. 檔案備份驗證**:
```bash
# 列出所有檔案備份
ls -lh /backups/files/

# 檢查備份內容 (不解壓縮)
tar -tzf /backups/files/file-backup-latest.tar.gz | head -n 20

# 驗證檔案數量
tar -tzf /backups/files/file-backup-latest.tar.gz | wc -l
```

**3. 備份完整性測試** (每月執行):
```bash
# 完整解壓縮驗證
mkdir -p /tmp/backup-verify
tar -xzf /backups/files/file-backup-latest.tar.gz -C /tmp/backup-verify/

# 隨機抽樣驗證10個檔案
find /tmp/backup-verify -type f | shuf -n 10 | xargs -I {} file {}

# 清理
rm -rf /tmp/backup-verify
```

---

## 🧪 定期演練計劃

### 演練頻率

| 演練類型 | 頻率 | 負責人 | 文檔要求 |
|---------|------|--------|---------|
| 資料庫恢復演練 | **每季** | 資料庫管理員 | 演練報告 |
| 檔案恢復演練 | **每季** | 系統管理員 | 演練報告 |
| 完整災難恢復演練 | **每半年** | IT經理 | 詳細演練報告 + 改進計劃 |

### 演練流程

**1. 準備階段** (演練前1週):
- 確認演練時間和範圍
- 準備測試環境
- 通知相關人員

**2. 執行階段** (演練當天):
- 模擬災難場景
- 執行恢復流程
- 記錄每個步驟的時間
- 拍照/錄影記錄過程

**3. 驗證階段**:
- 檢查恢復的資料完整性
- 測試業務功能
- 對比RTO/RPO目標

**4. 總結階段** (演練後1週內):
- 撰寫演練報告
- 識別改進點
- 更新災難恢復文檔

### 演練檢查清單

#### 資料庫恢復演練檢查清單

- [ ] 準備測試環境 (隔離的資料庫實例)
- [ ] 選擇最新完整備份
- [ ] 記錄開始時間
- [ ] 創建新資料庫
- [ ] 恢復備份
- [ ] 驗證資料表數量
- [ ] 驗證關鍵資料記錄數
- [ ] 測試應用程式連接
- [ ] 記錄結束時間
- [ ] 計算RTO達成率
- [ ] 撰寫演練報告

#### 完整災難恢復演練檢查清單

- [ ] 模擬完全伺服器故障
- [ ] 準備新伺服器/虛擬機
- [ ] 安裝作業系統和依賴
- [ ] 恢復資料庫備份
- [ ] 恢復檔案備份
- [ ] 配置應用程式
- [ ] 啟動應用程式
- [ ] 測試所有業務功能
- [ ] 驗證RTO/RPO目標
- [ ] 撰寫詳細報告
- [ ] 更新改進計劃

---

## 📞 緊急聯絡清單

### 關鍵人員聯絡資訊

| 角色 | 姓名 | 電話 | 電子郵件 | 備註 |
|------|------|------|---------|------|
| IT經理 | [姓名] | [電話] | [郵件] | 災難決策 |
| 資料庫管理員 | [姓名] | [電話] | [郵件] | 資料庫恢復 |
| 系統管理員 | [姓名] | [電話] | [郵件] | 伺服器管理 |
| 應用開發負責人 | [姓名] | [電話] | [郵件] | 應用程式問題 |
| 業務負責人 | [姓名] | [電話] | [郵件] | 業務影響評估 |

### 第三方供應商聯絡

| 供應商 | 服務類型 | 聯絡電話 | 支援Email | 支援等級 |
|--------|---------|---------|-----------|---------|
| Azure Support | 雲端服務 | +886-XXX-XXXX | azure-support@microsoft.com | Premium |
| PostgreSQL Support | 資料庫 | [電話] | [郵件] | Community/Enterprise |
| [硬體供應商] | 伺服器硬體 | [電話] | [郵件] | 4小時on-site |

### 緊急通知流程

```
災難發生
    ↓
1. 系統管理員評估災難嚴重度 (5分鐘內)
    ↓
2. 通知IT經理 (立即)
    ↓
3. 通知業務負責人 (15分鐘內)
    ↓
4. 召集恢復團隊 (30分鐘內)
    ↓
5. 執行災難恢復流程
    ↓
6. 每小時更新恢復狀態給業務團隊
    ↓
7. 恢復完成後通知所有相關人員
```

---

## 📊 附錄：備份腳本快速參考

### 資料庫備份

```bash
# 完整備份
npx tsx scripts/backup/database-backup.ts --type=full

# 增量備份 (需配置WAL歸檔)
npx tsx scripts/backup/database-backup.ts --type=incremental

# 環境變數設置
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
export BACKUP_DIR="./backups/database"
export ENCRYPTION_KEY="[Base64編碼的32字節金鑰]"
```

### 檔案系統備份

```bash
# 完整備份
npx tsx scripts/backup/file-system-backup.ts --type=full

# 增量備份 (最近24小時)
npx tsx scripts/backup/file-system-backup.ts --type=incremental

# 環境變數設置
export UPLOAD_DIR="./uploads"
export BACKUP_DIR="./backups/files"
```

### 統一備份調度

```bash
# 完整備份 (資料庫 + 檔案)
npx tsx scripts/backup/backup-scheduler.ts --type=full

# 只備份資料庫
npx tsx scripts/backup/backup-scheduler.ts --database-only

# 只備份檔案
npx tsx scripts/backup/backup-scheduler.ts --files-only
```

### Cron排程設置 (Linux/MacOS)

```bash
# 編輯crontab
crontab -e

# 添加備份排程
# 每日02:00完整備份
0 2 * * * cd /path/to/project && npx tsx scripts/backup/backup-scheduler.ts --type=full >> /var/log/backup.log 2>&1

# 每6小時增量備份 (08:00, 14:00, 20:00)
0 8,14,20 * * * cd /path/to/project && npx tsx scripts/backup/backup-scheduler.ts --type=incremental >> /var/log/backup.log 2>&1
```

### Windows Task Scheduler設置

```powershell
# 創建每日備份任務
schtasks /create /tn "AI-Sales-Platform-Full-Backup" /tr "cd C:\path\to\project && npx tsx scripts/backup/backup-scheduler.ts --type=full" /sc daily /st 02:00 /ru SYSTEM

# 創建每6小時備份任務
schtasks /create /tn "AI-Sales-Platform-Incremental-Backup" /tr "cd C:\path\to\project && npx tsx scripts/backup/backup-scheduler.ts --type=incremental" /sc daily /st 08:00 /ri 360 /du 24:00 /ru SYSTEM
```

---

## 📝 文檔維護

**下次審查日期**: 2025-11-06
**審查週期**: 每月
**文檔擁有者**: IT運維團隊

**變更歷史**:
- 2025-10-06 v1.0: 初始版本 (Sprint 3 Week 6)

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**
**Co-Authored-By**: Claude <noreply@anthropic.com>
