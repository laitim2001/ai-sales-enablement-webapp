# 系統整合測試報告

## 測試摘要

- **執行時間**: 2025-09-28T05:44:38.501Z
- **總測試數**: 16
- **通過**: 3
- **失敗**: 13
- **成功率**: 18.8%
- **執行時長**: 3277ms

## 環境信息

- **Node.js 版本**: v22.19.0
- **平台**: win32
- **Azure OpenAI**: ✅ 已配置
- **Dynamics 365**: ✅ 已配置

## 測試套件結果

### DATABASE
- 通過: 2/5 (40.0%)
- 失敗: 3

### API
- 通過: 0/5 (0.0%)
- 失敗: 5

### AI
- 通過: 1/2 (50.0%)
- 失敗: 1

### MONITORING
- 通過: 0/3 (0.0%)
- 失敗: 3

### CRM
- 通過: 0/1 (0.0%)
- 失敗: 1

## 失敗詳情

1. **1.2 基本 CRUD 操作**: 
Invalid `prisma.customer.update()` invocation in
C:\ai-sales-enablement-webapp\tests\integration\system-integration.test.js:96:27

  93 }
  94 
  95 // 更新測試
→ 96 await prisma.customer.update({
       where: {
         id: 1
       },
       data: {
         status: "ACTIVE"
                 ~~~~~~~~
       }
     })

Invalid value for argument `status`. Expected CustomerStatus.
2. **1.3 複雜查詢和關聯**: 
Invalid `prisma.customer.findMany()` invocation in
C:\ai-sales-enablement-webapp\tests\integration\system-integration.test.js:112:45

  109 // 測試 1.3: 複雜查詢和關聯
  110 await runTest('database', '1.3 複雜查詢和關聯', async () => {
  111   // 測試複雜查詢
→ 112   const customers = await prisma.customer.findMany({
          include: {
            interactions: true,
            opportunities: true,
            ~~~~~~~~~~~~~
        ?   assignedUser?: true,
        ?   callRecords?: true,
        ?   proposals?: true,
        ?   salesOpportunities?: true,
        ?   documents?: true,
        ?   contacts?: true,
        ?   proposalGenerations?: true
          },
          where: {
            created_at: {
              gte: new Date("2025-08-29T05:44:35.233Z")
            }
          },
          take: 5
        })

Unknown field `opportunities` for include statement on model `Customer`. Available options are marked with ?.
3. **1.4 事務處理**: 
Invalid `tx.interaction.create()` invocation in
C:\ai-sales-enablement-webapp\tests\integration\system-integration.test.js:139:48

  136   }
  137 });
  138 
→ 139 const interaction = await tx.interaction.create({
        data: {
          customer_id: 2,
          type: "EMAIL",
          direction: "OUTBOUND",
          subject: "Test Transaction",
          content: "This is a transaction test",
      +   description: String
        }
      })

Argument `description` is missing.
4. **2.1 健康檢查端點**: invalid json response body at http://localhost:3001/api/health reason: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
5. **2.2 客戶 API**: invalid json response body at http://localhost:3001/api/customers reason: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
6. **2.3 提案範本 API**: invalid json response body at http://localhost:3001/api/proposal-templates reason: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
7. **2.4 知識庫搜索 API**: invalid json response body at http://localhost:3001/api/knowledge-base/search reason: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
8. **6.1 並發 API 請求**: 並發請求成功率過低: 0/10
9. **3.1 Azure OpenAI 連接**: Azure OpenAI 連接失敗: 404
10. **4.1 系統監控端點**: invalid json response body at http://localhost:3001/api/health?detailed=true reason: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
11. **4.2 服務健康檢查**: invalid json response body at http://localhost:3001/api/health?service=DATABASE reason: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
12. **4.3 性能指標收集**: invalid json response body at http://localhost:3001/api/health?detailed=true reason: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
13. **CRM 整合測試執行**: Cannot find module '../../lib/integrations/dynamics365/auth'
Require stack:
- C:\ai-sales-enablement-webapp\tests\integration\crm-integration.test.js
- C:\ai-sales-enablement-webapp\tests\integration\system-integration.test.js
- C:\ai-sales-enablement-webapp\scripts\run-integration-tests.js

## 建議

- **[HIGH] RELIABILITY**: 系統穩定性需要改善，成功率低於 80%

---
*報告生成時間: 2025-09-28T05:44:38.501Z*
