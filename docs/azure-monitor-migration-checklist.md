# Azure Monitor 遷移檢查清單

## 📋 遷移概述

本文檔提供從 Prometheus + Grafana 遷移到 Azure Application Insights 的完整檢查清單。

**遷移優勢**:
- ✅ **零代碼修改**: 只需更改環境變數
- ✅ **平滑切換**: 5-10 分鐘完成遷移
- ✅ **可回滾**: 隨時切回 Prometheus
- ✅ **並行運行**: 支持雙寫驗證

**預估時間**: 2-4 小時（包括驗證和調整）

---

## Phase 1: 準備階段（預估 30 分鐘）

### ✅ 1.1 環境準備

- [ ] 確認 Azure 訂閱已啟用
- [ ] 確認有足夠的 Azure 權限創建資源
- [ ] 確認開發/測試/生產環境分別配置
- [ ] 準備成本預算評估

**執行人**: DevOps / Platform Engineer
**截止日期**: _________

### ✅ 1.2 創建 Azure Application Insights 資源

**開發環境**:
```bash
az monitor app-insights component create \
  --app ai-sales-platform-dev \
  --location eastus \
  --resource-group ai-sales-rg-dev \
  --application-type web
```

- [ ] 開發環境 Application Insights 已創建
- [ ] 測試環境 Application Insights 已創建
- [ ] 生產環境 Application Insights 已創建

**執行人**: DevOps Engineer
**截止日期**: _________

### ✅ 1.3 獲取連接字符串

```bash
# 開發環境
az monitor app-insights component show \
  --app ai-sales-platform-dev \
  --resource-group ai-sales-rg-dev \
  --query connectionString -o tsv

# 測試環境
az monitor app-insights component show \
  --app ai-sales-platform-test \
  --resource-group ai-sales-rg-test \
  --query connectionString -o tsv

# 生產環境
az monitor app-insights component show \
  --app ai-sales-platform-prod \
  --resource-group ai-sales-rg-prod \
  --query connectionString -o tsv
```

- [ ] 開發環境連接字符串已獲取並安全存儲
- [ ] 測試環境連接字符串已獲取並安全存儲
- [ ] 生產環境連接字符串已獲取並安全存儲

**執行人**: DevOps Engineer
**截止日期**: _________

### ✅ 1.4 配置採樣率

**成本優化策略**:

| 環境 | 採樣率 | 預估月成本 | 用途 |
|------|--------|-----------|------|
| 開發 | 50-100% | $5-20 | 詳細調試 |
| 測試 | 30-50% | $10-30 | 充分測試 |
| 生產 | 10-20% | $30-100 | 成本優化 |

- [ ] 採樣率已根據環境和預算確定
- [ ] 採樣策略已文檔化

**執行人**: DevOps Lead
**截止日期**: _________

### ✅ 1.5 備份當前 Prometheus 數據

```bash
# 創建 Prometheus 數據快照
docker-compose -f docker-compose.monitoring.yml exec prometheus \
  promtool tsdb snapshot /prometheus

# 複製快照到安全位置
cp -r monitoring/prometheus-data/snapshots/* /backup/prometheus-$(date +%Y%m%d)/

# 導出關鍵儀表板配置
cp -r monitoring/grafana/dashboards /backup/grafana-dashboards-$(date +%Y%m%d)/
```

- [ ] Prometheus 數據已備份
- [ ] Grafana 儀表板配置已導出
- [ ] 備份已驗證可恢復

**執行人**: DevOps Engineer
**截止日期**: _________

---

## Phase 2: 測試階段（預估 1 小時）

### ✅ 2.1 開發環境測試

**步驟 1: 更新環境變數**
```bash
# .env.development
MONITORING_BACKEND=azure
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=xxx;IngestionEndpoint=https://eastus-xxx.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/"
AZURE_SAMPLING_RATE=1.0
AZURE_LIVE_METRICS=true
```

- [ ] 環境變數已更新
- [ ] 連接字符串格式已驗證

**步驟 2: 啟動應用**
```bash
npm run dev
```

- [ ] 應用啟動成功
- [ ] 啟動日誌顯示: `[Monitoring] Initializing Azure Application Insights backend`
- [ ] 無錯誤日誌

**步驟 3: 驗證數據發送**

- [ ] 訪問 Azure Portal > Application Insights > Live Metrics
- [ ] 看到實時請求數據流
- [ ] 看到實時依賴調用（資料庫、外部 API）
- [ ] 看到實時異常追蹤

**步驟 4: 執行測試請求**
```bash
# 測試 API 端點
curl http://localhost:3000/api/health
curl http://localhost:3000/api/knowledge-base/search -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}'
```

- [ ] 請求在 Live Metrics 中可見
- [ ] Transaction search 中可以找到請求
- [ ] End-to-end transaction 追蹤完整

**步驟 5: 驗證業務指標**

- [ ] Application Insights > Logs (Kusto)
- [ ] 執行查詢驗證自定義指標:

```kusto
// 用戶註冊事件
customEvents
| where name == "UserRegistration"
| take 10

// AI 服務調用
customEvents
| where name == "AIServiceCall"
| take 10

// HTTP 請求指標
requests
| summarize count(), avg(duration) by name
| order by count_ desc
```

- [ ] 自定義事件正常記錄
- [ ] 自定義屬性完整
- [ ] 指標數據準確

**執行人**: Backend Developer + DevOps
**截止日期**: _________

### ✅ 2.2 並行運行驗證（可選但推薦）

**目的**: 同時運行 Prometheus 和 Azure，對比數據一致性

**配置雙寫**:
```bash
# 暫時保留 Prometheus，同時發送到 Azure
# 保持 docker-compose.monitoring.yml 運行
docker-compose -f docker-compose.monitoring.yml up -d

# 應用同時發送到兩個後端
# 註: 需要代碼支持多後端（見運維手冊 "並行運行" 章節）
```

**驗證步驟**:
- [ ] Prometheus 和 Azure 都收到數據
- [ ] 對比關鍵指標數據一致性:
  - [ ] HTTP 請求總數 (±5% 誤差可接受)
  - [ ] 平均響應時間 (±10% 誤差可接受)
  - [ ] 錯誤率 (應該一致)
- [ ] 採樣率影響已理解和接受

**對比查詢範例**:

Prometheus:
```promql
sum(increase(http_requests_total[1h]))
```

Azure (Kusto):
```kusto
requests
| where timestamp > ago(1h)
| summarize count()
```

**執行人**: Backend Developer
**截止日期**: _________

### ✅ 2.3 性能影響評估

**測試場景**:
- [ ] 正常負載測試 (100 req/s)
- [ ] 高負載測試 (500 req/s)
- [ ] 峰值負載測試 (1000 req/s)

**監控指標**:
- [ ] 應用 CPU 使用率變化: ___% → ___% (應 < 5% 增長)
- [ ] 應用記憶體使用變化: ___MB → ___MB (應 < 10% 增長)
- [ ] P95 響應時間變化: ___ms → ___ms (應 < 5% 增長)

**結論**:
- [ ] 性能影響可接受
- [ ] 或已識別優化措施: _________________

**執行人**: Performance Engineer
**截止日期**: _________

---

## Phase 3: 遷移執行（預估 30 分鐘）

### ✅ 3.1 測試環境遷移

**預遷移檢查**:
- [ ] 所有開發環境測試通過
- [ ] 回滾計劃已準備
- [ ] 團隊已通知計劃遷移時間

**執行遷移**:
```bash
# 1. 更新測試環境配置
# .env.test
MONITORING_BACKEND=azure
APPLICATIONINSIGHTS_CONNECTION_STRING="..."
AZURE_SAMPLING_RATE=0.5
AZURE_LIVE_METRICS=true

# 2. 部署到測試環境
npm run deploy:test

# 3. 驗證部署
curl https://test.ai-sales-platform.com/api/health
```

**遷移後驗證**:
- [ ] 應用啟動成功
- [ ] Azure Live Metrics 顯示數據
- [ ] 執行冒煙測試通過
- [ ] 關鍵業務流程正常
- [ ] 無嚴重錯誤或警告

**運行時間**: ___小時
**執行人**: DevOps Engineer
**截止日期**: _________

### ✅ 3.2 配置 Azure 告警規則

**參考 Prometheus 告警規則遷移**:

| Prometheus 規則 | Azure 對應 | 狀態 |
|----------------|-----------|------|
| APICompletelyDown | Availability test | [ ] |
| HighErrorRate | Failed requests rate > 5% | [ ] |
| SlowAPIResponse | Response time P95 > 2s | [ ] |
| HighCPUUsage | Performance counter > 85% | [ ] |
| HighMemoryUsage | Performance counter > 95% | [ ] |

**配置位置**: Azure Portal > Application Insights > Alerts

**告警動作組**:
- [ ] Email 通知已配置
- [ ] Slack/Teams Webhook 已配置 (可選)
- [ ] 告警路由規則已設置 (P1/P2/P3/P4)

**執行人**: DevOps Engineer + SRE
**截止日期**: _________

### ✅ 3.3 創建 Azure 儀表板

**儀表板清單**:

1. **系統概覽儀表板**
   - [ ] 應用可用性
   - [ ] 請求總量
   - [ ] 錯誤率
   - [ ] 平均響應時間

2. **API 性能儀表板**
   - [ ] 端點請求率
   - [ ] 端點響應時間 (P50/P95/P99)
   - [ ] 狀態碼分佈
   - [ ] 最慢端點排名

3. **業務指標儀表板**
   - [ ] 用戶註冊/登入
   - [ ] AI 服務調用和 Token 使用
   - [ ] 知識庫搜尋
   - [ ] Dynamics 365 同步

4. **依賴性能儀表板**
   - [ ] 資料庫查詢性能
   - [ ] 外部 API 調用 (Azure OpenAI, Dynamics 365)
   - [ ] 緩存性能

**配置方法**:
- [ ] 使用 Azure Portal UI 手動創建
- [ ] 或使用 ARM 模板自動化部署
- [ ] 儀表板已共享給團隊

**執行人**: DevOps Engineer
**截止日期**: _________

### ✅ 3.4 生產環境遷移（最後一步）

**前置條件**:
- [ ] 測試環境運行至少 3-7 天無問題
- [ ] 所有告警規則已配置並測試
- [ ] 所有儀表板已創建並驗證
- [ ] 回滾計劃已文檔化並演練
- [ ] 變更管理批准已獲得
- [ ] 團隊和利益相關者已通知

**遷移窗口**: _________ (選擇低流量時段)

**執行步驟**:
```bash
# 1. 創建生產環境快照 (回滾點)
git tag monitoring-migration-$(date +%Y%m%d-%H%M)
git push origin --tags

# 2. 更新生產環境配置
# .env.production
MONITORING_BACKEND=azure
APPLICATIONINSIGHTS_CONNECTION_STRING="..."
AZURE_SAMPLING_RATE=0.2  # 生產環境使用較低採樣率
AZURE_LIVE_METRICS=true

# 3. 部署到生產環境
npm run deploy:production

# 4. 實時監控部署
# 觀察 Azure Live Metrics

# 5. 驗證關鍵指標
# - 應用可用性: 100%
# - 錯誤率: < 1%
# - 響應時間: 正常範圍內
```

**遷移後立即驗證 (前 15 分鐘)**:
- [ ] 應用可訪問且響應正常
- [ ] Azure Live Metrics 顯示實時數據
- [ ] 無 Critical 或 High 告警觸發
- [ ] 關鍵業務流程執行測試通過
- [ ] 錯誤率在正常範圍內
- [ ] 響應時間在正常範圍內

**遷移後短期監控 (前 1 小時)**:
- [ ] 持續觀察 Live Metrics
- [ ] 檢查是否有異常告警
- [ ] 查看 Transaction search 了解請求詳情
- [ ] 對比與測試環境的行為一致性

**遷移後中期監控 (前 24 小時)**:
- [ ] 每 2 小時檢查一次關鍵儀表板
- [ ] 審查所有觸發的告警
- [ ] 收集團隊反饋
- [ ] 記錄任何問題和解決方案

**執行人**: DevOps Lead + On-Call Engineer
**截止日期**: _________

---

## Phase 4: 遷移後優化（預估 1 小時）

### ✅ 4.1 成本監控和優化

**每日檢查（前 7 天）**:
- [ ] 查看 Azure Cost Management
- [ ] 驗證實際成本 vs 預算
- [ ] 記錄數據量: ___GB/天

**成本優化措施**:
- [ ] 如成本超預算，調整採樣率: ___ → ___
- [ ] 配置智能採樣策略 (保留關鍵事件 100% 採樣)
- [ ] 優化日誌級別和數據保留期限

**每週成本審查**:
- [ ] Week 1 成本: $___
- [ ] Week 2 成本: $___
- [ ] Week 3 成本: $___
- [ ] Week 4 成本: $___

**執行人**: FinOps / DevOps Lead
**截止日期**: _________

### ✅ 4.2 查詢和告警微調

**Kusto 查詢優化**:
- [ ] 識別慢查詢並優化
- [ ] 添加有用的自定義查詢到收藏夾
- [ ] 創建查詢別名供團隊使用

**告警規則調整**:
- [ ] 審查前 7 天的告警記錄
- [ ] 識別誤報告警: _____________
- [ ] 調整閾值或增加緩衝時間
- [ ] 記錄漏報告警: _____________
- [ ] 添加新的告警規則

**執行人**: SRE / DevOps Engineer
**截止日期**: _________

### ✅ 4.3 團隊培訓

**培訓內容**:
- [ ] Azure Application Insights 界面導覽
- [ ] Live Metrics 使用
- [ ] Transaction search 和追蹤分析
- [ ] Kusto 查詢語言基礎
- [ ] 儀表板使用和自定義
- [ ] 告警處理流程

**培訓形式**:
- [ ] 文檔分享: `docs/monitoring-usage-examples.md`
- [ ] 內部研討會 (1 小時)
- [ ] 實踐演練 (30 分鐘)

**參與人員**:
- [ ] Backend Developers
- [ ] Frontend Developers
- [ ] QA Engineers
- [ ] Product Managers (儀表板查看)

**執行人**: DevOps Lead
**截止日期**: _________

### ✅ 4.4 文檔更新

**需要更新的文檔**:
- [ ] `README.md` - 更新監控章節
- [ ] `docs/monitoring-operations-manual.md` - 標註 Azure 為主要後端
- [ ] `docs/monitoring-usage-examples.md` - 添加 Azure 特定範例
- [ ] `docs/onboarding.md` - 新成員入職培訓文檔

**新增文檔**:
- [ ] `docs/azure-kusto-queries.md` - 常用 Kusto 查詢範例
- [ ] `docs/azure-dashboard-guide.md` - Azure 儀表板使用指南

**執行人**: Technical Writer / DevOps
**截止日期**: _________

---

## Phase 5: 清理（可選）

### ✅ 5.1 停用 Prometheus + Grafana（遷移後 30 天）

**前置條件**:
- [ ] Azure Monitor 穩定運行至少 30 天
- [ ] 團隊對 Azure 界面熟悉
- [ ] 無計劃回滾到 Prometheus
- [ ] 所有數據已備份

**停用步驟**:
```bash
# 1. 最終數據備份
docker-compose -f docker-compose.monitoring.yml exec prometheus \
  promtool tsdb snapshot /prometheus
cp -r monitoring/prometheus-data/snapshots/* /backup/prometheus-final/

# 2. 停止監控服務
docker-compose -f docker-compose.monitoring.yml down

# 3. 保留配置文件（不刪除，以備將來參考）
# 保留 docker-compose.monitoring.yml
# 保留 monitoring/ 目錄

# 4. 移除未使用的 Docker volumes（可選）
# docker volume rm ai-sales-prometheus-data
# docker volume rm ai-sales-grafana-data
```

**文檔更新**:
- [ ] 更新 `README.md` 移除 Prometheus 啟動指令
- [ ] 標註 Prometheus 配置為"歷史參考"

**執行人**: DevOps Engineer
**截止日期**: _________ (遷移後 30-60 天)

---

## 回滾計劃

### 🚨 緊急回滾（如遷移後發現嚴重問題）

**觸發條件**:
- 應用可用性 < 95%
- 錯誤率 > 10%
- 無法獲取監控數據
- 性能嚴重降級 (響應時間 >2x 正常值)

**回滾步驟 (5-10 分鐘)**:
```bash
# 1. 回滾環境變數
MONITORING_BACKEND=prometheus
# 移除 APPLICATIONINSIGHTS_CONNECTION_STRING

# 2. 重新啟動 Prometheus + Grafana
docker-compose -f docker-compose.monitoring.yml up -d

# 3. 重新部署應用
npm run deploy:production

# 4. 驗證 Prometheus 恢復
curl http://localhost:9464/metrics
# 訪問 http://localhost:9090

# 5. 驗證 Grafana 儀表板
# 訪問 http://localhost:3001
```

**回滾後行動**:
- [ ] 通知團隊和利益相關者
- [ ] 根因分析: _________________
- [ ] 制定修復計劃
- [ ] 重新評估遷移時機

**執行人**: On-Call Engineer + DevOps Lead
**決策權**: DevOps Lead / Engineering Manager

---

## 簽核和批准

### 遷移準備審查

- [ ] **技術審查** - 所有技術準備完成
  - 簽核人: _________________
  - 日期: _________

- [ ] **成本審查** - 預算已批准
  - 簽核人: _________________
  - 日期: _________

- [ ] **安全審查** - 安全要求已滿足
  - 簽核人: _________________
  - 日期: _________

### 遷移執行批准

- [ ] **測試環境遷移批准**
  - 批准人: _________________
  - 日期: _________

- [ ] **生產環境遷移批准**
  - 批准人: _________________
  - 日期: _________

### 遷移完成確認

- [ ] **遷移成功確認**
  - 確認人: _________________
  - 日期: _________
  - 備註: _________________

---

## 附錄: 常見問題

### Q1: 遷移會導致數據丟失嗎？

**答**: 不會。OpenTelemetry 架構確保平滑切換，但建議：
- 在遷移前備份 Prometheus 數據
- 在遷移後保留 Prometheus 30 天以便對比
- 如果關鍵，可以並行運行雙寫一段時間

### Q2: 如何驗證遷移成功？

**答**: 檢查以下三點：
1. Azure Live Metrics 顯示實時數據
2. Transaction search 可以找到最近的請求
3. 自定義事件和指標正常記錄

### Q3: 遷移後成本超預算怎麼辦？

**答**: 立即調整採樣率：
```bash
# 將採樣率從 0.5 降至 0.2
AZURE_SAMPLING_RATE=0.2
```
重新部署後，成本應降低 60%。

### Q4: 可以保留 Prometheus 作為備份嗎？

**答**: 可以，建議在遷移後保留 30-60 天：
- 保持 Prometheus 運行但不作為主要監控
- 或配置雙寫（應用同時發送到兩個後端）
- 驗證 Azure 穩定後再停用 Prometheus

### Q5: Kusto 查詢語言難學嗎？

**答**: 如果熟悉 SQL，Kusto 很容易上手：
- 基本語法類似 SQL
- 文檔和範例豐富
- 參考 `docs/azure-kusto-queries.md` 快速入門

### Q6: 如何比較 Prometheus 和 Azure 的數據？

**答**: 使用對應的查詢：

Prometheus (請求總數):
```promql
sum(increase(http_requests_total[1h]))
```

Azure (請求總數):
```kusto
requests
| where timestamp > ago(1h)
| summarize count()
```

注意採樣率差異：Azure 結果需除以採樣率得到估算總數。

---

**文檔版本**: v1.0
**最後更新**: 2025-06-22
**維護者**: DevOps Team
**審核者**: Engineering Manager
