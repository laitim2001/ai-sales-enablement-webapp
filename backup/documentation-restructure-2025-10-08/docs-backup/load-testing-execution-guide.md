# MVP2 負載測試執行指南

> **創建日期**: 2025-10-07
> **目的**: 提供完整的負載測試執行步驟和注意事項
> **測試工具**: autocannon
> **預計耗時**: 3天 (完整測試套件)

---

## 📋 前置條件檢查清單

### 1. 系統需求
- [ ] Node.js v18+ 已安裝
- [ ] PostgreSQL + pgvector 已安裝並運行
- [ ] Redis 已安裝並運行 (如有使用)
- [ ] 至少8GB RAM可用
- [ ] 至少4核CPU可用
- [ ] SSD磁碟空間充足

### 2. 應用程序準備
- [ ] 開發服務器正在運行 (`npm run dev` 或 `npm run start`)
- [ ] 數據庫已遷移 (`npm run db:migrate`)
- [ ] 測試數據已就緒
- [ ] Azure OpenAI配置正確
- [ ] 環境變數已設置完成

### 3. 測試數據準備
為了獲得準確的測試結果，建議預先創建以下測試數據:

```bash
# 執行數據庫seed腳本
npm run db:seed

# 或手動創建測試數據
# - 用戶: 至少100個測試用戶
# - 知識庫文章: 至少1000篇
# - 向量數據: 至少5000條
# - 會議記錄: 至少500條
```

---

## 🔑 JWT Token準備

負載測試需要有效的JWT token進行身份驗證。

### 方法1: 通過API獲取Token
```bash
# 登入獲取token
curl -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin_password"
  }' | jq -r '.accessToken'
```

### 方法2: 設置環境變數
```bash
# Linux/macOS
export LOAD_TEST_TOKEN="your_jwt_token_here"

# Windows (PowerShell)
$env:LOAD_TEST_TOKEN = "your_jwt_token_here"

# Windows (CMD)
set LOAD_TEST_TOKEN=your_jwt_token_here
```

### ⚠️ Token注意事項
- JWT token通常有過期時間（本項目為15分鐘）
- 長時間測試需要定期更新token
- 建議為負載測試創建專用的長效token

---

## 🚀 執行測試

### 1. 煙霧測試 (Smoke Test)
**目的**: 驗證系統基本功能和測試腳本

```bash
# 快速煙霧測試 (30秒, 10連接)
npm run test:load:smoke

# 完整煙霧測試 (5分鐘, 10連接)
node scripts/load-test-runner.js smoke
```

**預期結果**:
- ✅ 錯誤率 < 1%
- ✅ 所有請求成功返回2xx狀態碼
- ✅ 平均響應時間 < 100ms

**如果失敗**:
1. 檢查服務器是否正在運行
2. 驗證JWT token是否有效
3. 確認API端點是否可訪問
4. 查看服務器日誌排查錯誤

---

### 2. 負載測試 (Load Test)
**目的**: 測試系統在不同負載級別下的表現

```bash
# 執行完整負載測試
npm run test:load:load
```

**測試階段**:
1. **Stage 1**: 100並發用戶 × 10分鐘
2. **冷卻期**: 30秒
3. **Stage 2**: 300並發用戶 × 10分鐘
4. **冷卻期**: 30秒
5. **Stage 3**: 500並發用戶 × 15分鐘

**預期結果**:
| 負載級別 | 目標RPS | P95響應時間 | 錯誤率 |
|---------|---------|------------|-------|
| 100用戶  | > 300   | < 500ms    | < 0.5% |
| 300用戶  | > 800   | < 1000ms   | < 1%   |
| 500用戶  | > 1000  | < 2000ms   | < 1%   |

---

### 3. 壓力測試 (Stress Test)
**目的**: 找出系統極限和性能瓶頸

```bash
# 執行壓力測試
npm run test:load:stress
```

**測試階段**:
1. **Stage 1**: 700並發用戶 × 10分鐘
2. **冷卻期**: 30秒
3. **Stage 2**: 1000並發用戶 × 10分鐘

**觀察指標**:
- 系統響應時間變化
- 錯誤率上升趨勢
- CPU/內存使用率
- 數據庫連接池狀態
- 可能出現的超時或崩潰

---

### 4. 完整測試套件
**目的**: 執行所有測試（煙霧 + 負載 + 壓力）

```bash
# 執行完整測試套件
npm run test:load:all
```

**總耗時**: 約90分鐘
- 煙霧測試: 5分鐘
- 負載測試: 30分鐘 + 冷卻期
- 壓力測試: 20分鐘 + 冷卻期

---

## 📊 監控和觀察

### 1. 實時監控
在測試運行期間，建議同時監控以下指標:

#### 系統資源監控
```bash
# Linux/macOS - 監控CPU和內存
top

# Windows - 任務管理器
Ctrl + Shift + Esc

# Node.js進程監控
pm2 monit  # 如果使用PM2
```

#### 數據庫監控
```bash
# PostgreSQL活動連接
psql -c "SELECT count(*) FROM pg_stat_activity;"

# 查看慢查詢
psql -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

#### 應用程序日誌
```bash
# 實時查看應用日誌
tail -f logs/application.log

# Windows
Get-Content logs\application.log -Wait
```

### 2. 性能指標收集

測試期間應記錄:
- ✅ CPU使用率 (目標: < 80%)
- ✅ 內存使用率 (目標: < 85%)
- ✅ 數據庫連接數 (目標: < 最大連接數的80%)
- ✅ 網絡I/O
- ✅ 磁碟I/O
- ✅ API響應時間分布
- ✅ 錯誤類型和頻率

---

## 📝 測試報告生成

### 1. 自動生成的報告
測試結束後，腳本會自動生成JSON格式的報告:

```
load-test-results/
├── smoke-test_2025-10-07T12-00-00.json
├── load-test-stage1_2025-10-07T12-10-00.json
├── load-test-stage2_2025-10-07T12-25-00.json
├── load-test-stage3_2025-10-07T12-40-00.json
├── stress-test-stage1_2025-10-07T13-00-00.json
└── stress-test-stage2_2025-10-07T13-15-00.json
```

### 2. 報告內容
每個報告包含:
- 測試時長
- 總請求數
- 成功/失敗請求數
- 錯誤率
- 響應時間統計 (mean, P50, P95, P99, max)
- 吞吐量 (RPS, Bytes/s)
- 連接數

### 3. 手動分析
使用報告數據分析:

```bash
# 查看測試報告
cat load-test-results/load-test-stage3_*.json | jq '.'

# 提取關鍵指標
cat load-test-results/*.json | jq '{
  test: .title,
  rps: .requests.average,
  p95: .latency.p95,
  errors: .errors
}'
```

---

## 🔧 故障排查

### 常見問題

#### 1. 所有請求返回401 Unauthorized
**原因**: JWT token無效或已過期
**解決**: 重新生成token並更新環境變數

#### 2. 高錯誤率 (>5%)
**可能原因**:
- 數據庫連接池耗盡
- API超時
- 內存不足導致OOM
- Azure OpenAI限流

**排查步驟**:
1. 查看應用程序日誌
2. 檢查數據庫連接數
3. 監控內存使用
4. 檢查Azure OpenAI調用次數

#### 3. 響應時間過長 (P95 > 2s)
**可能原因**:
- 數據庫查詢未優化
- 缺少索引
- 向量搜索性能問題
- CPU瓶頸

**優化方向**:
1. 分析慢查詢日誌
2. 添加數據庫索引
3. 優化查詢邏輯
4. 考慮緩存熱點數據

#### 4. 系統崩潰或服務不響應
**可能原因**:
- 內存洩漏
- 連接洩漏
- 事件循環阻塞

**排查步驟**:
1. 檢查進程是否存活
2. 查看系統資源使用
3. 分析core dump (如有)
4. 檢查錯誤日誌

---

## 📈 性能優化建議

根據測試結果，可能需要的優化:

### 1. 數據庫優化
```sql
-- 添加常用查詢索引
CREATE INDEX idx_knowledge_base_search ON knowledge_base USING gin(to_tsvector('english', content));
CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_created_at ON knowledge_base(created_at DESC);

-- 優化向量搜索
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base USING ivfflat(embedding vector_cosine_ops);
```

### 2. 應用程序優化
- 實施Redis緩存層
- 優化API響應大小
- 實施請求限流
- 添加熔斷機制
- 優化數據庫連接池配置

### 3. 架構優化
- 考慮讀寫分離
- 實施CDN緩存靜態資源
- 使用負載均衡器
- 實施水平擴展

---

## 🎯 成功標準

### 必須達成 (Must Have)
- ✅ 500並發用戶下，P95響應時間 < 2秒
- ✅ 錯誤率 < 1%
- ✅ 系統可持續運行30分鐘無崩潰
- ✅ CPU使用率 < 80%
- ✅ 內存使用率 < 85%

### 期望達成 (Should Have)
- ⭐ 1000並發用戶峰值負載可承受
- ⭐ P99響應時間 < 5秒
- ⭐ RPS > 1000
- ⭐ 24小時穩定運行（耐久測試）

### 可選達成 (Nice to Have)
- 💡 P95響應時間 < 1秒
- 💡 99.9%可用性
- 💡 自動擴展能力

---

## 📅 測試時程建議

### Day 1: 準備和煙霧測試
- **上午**: 環境準備、數據準備
- **下午**: 煙霧測試、問題修復

### Day 2: 負載測試
- **上午**: 執行100/300用戶負載測試
- **下午**: 執行500用戶負載測試、性能分析

### Day 3: 壓力測試和報告
- **上午**: 執行700/1000用戶壓力測試
- **下午**: 結果分析、報告撰寫、優化建議

---

## 📞 支持和聯繫

如遇到問題:
1. 查看 `docs/load-testing-plan.md` 了解測試設計
2. 檢查 `load-test-results/` 目錄的測試報告
3. 查看應用程序日誌排查具體錯誤

---

## ⚠️ 重要提醒

1. **生產環境測試**: 如在生產環境執行，請選擇低流量時段
2. **數據備份**: 測試前備份重要數據
3. **告警設置**: 配置監控告警避免服務中斷
4. **逐步增加負載**: 不要一次性施加最大負載
5. **Token管理**: 為長時間測試創建長效token
6. **資源監控**: 持續監控系統資源使用情況

---

## 🎉 測試完成後

1. ✅ 保存所有測試報告
2. ✅ 記錄性能瓶頸和優化點
3. ✅ 更新系統配置文檔
4. ✅ 制定性能優化計劃
5. ✅ 定期重複測試驗證優化效果
