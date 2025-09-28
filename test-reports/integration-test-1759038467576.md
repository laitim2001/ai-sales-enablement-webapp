# 系統整合測試報告

## 測試摘要

- **執行時間**: 2025-09-28T05:47:47.572Z
- **總測試數**: 32
- **通過**: 14
- **失敗**: 18
- **成功率**: 43.8%
- **執行時長**: 6903ms

## 環境信息

- **Node.js 版本**: v22.19.0
- **平台**: win32
- **Azure OpenAI**: ✅ 已配置
- **Dynamics 365**: ✅ 已配置

## 測試套件結果

### DATABASE
- 通過: 5/5 (100.0%)
- 失敗: 0

### API
- 通過: 0/5 (0.0%)
- 失敗: 5

### AI
- 通過: 1/2 (50.0%)
- 失敗: 1

### MONITORING
- 通過: 3/3 (100.0%)
- 失敗: 0

### CRM
- 通過: 5/17 (29.4%)
- 失敗: 12

## 失敗詳情

1. **2.1 健康檢查端點**: 健康檢查失敗: 503
2. **2.2 客戶 API**: 客戶 API 返回格式錯誤
3. **2.3 提案範本 API**: 提案範本 API 失敗: 500
4. **2.4 知識庫搜索 API**: 知識庫搜索 API 失敗: 401
5. **6.1 並發 API 請求**: 並發請求成功率過低: 0/10
6. **3.1 Azure OpenAI 連接**: Azure OpenAI 連接失敗: 404
7. **1.1 基本認證功能**: Dynamics 365 認證失敗: invalid_scope: Error(s): 70011 - Timestamp: 2025-09-28 05:47:45Z - Description: AADSTS70011: The provided request must include a 'scope' input parameter. The provided value for the input parameter 'scope' is not valid. The scope 本地開發時不需要/.default is not valid. Trace ID: cdc80f51-c90f-4082-b712-985c9af13000 Correlation ID: d21bb3f4-3302-4d56-9241-261f6ca28dcf Timestamp: 2025-09-28 05:47:45Z - Correlation ID: d21bb3f4-3302-4d56-9241-261f6ca28dcf - Trace ID: cdc80f51-c90f-4082-b712-985c9af13000
8. **1.2 權杖快取機制**: Dynamics 365 認證失敗: invalid_scope: Error(s): 70011 - Timestamp: 2025-09-28 05:47:46Z - Description: AADSTS70011: The provided request must include a 'scope' input parameter. The provided value for the input parameter 'scope' is not valid. The scope 本地開發時不需要/.default is not valid. Trace ID: c2617630-ed4f-4abd-ad96-9d5293849e00 Correlation ID: 5964a950-9f83-4eff-845b-c0cc6ebd25bd Timestamp: 2025-09-28 05:47:46Z - Correlation ID: 5964a950-9f83-4eff-845b-c0cc6ebd25bd - Trace ID: c2617630-ed4f-4abd-ad96-9d5293849e00
9. **1.3 認證錯誤處理**: 暫時跳過 - 需要模擬環境
10. **2.1 基本連接測試**: 無法連接到 Dynamics 365 API
11. **2.2 實體查詢測試**: Dynamics 365 API 請求失敗: Dynamics 365 認證失敗: invalid_scope: Error(s): 70011 - Timestamp: 2025-09-28 05:47:46Z - Description: AADSTS70011: The provided request must include a 'scope' input parameter. The provided value for the input parameter 'scope' is not valid. The scope 本地開發時不需要/.default is not valid. Trace ID: fd81c219-96ac-4fab-b482-1fc4e83f3900 Correlation ID: eff4c7b6-2ee4-4850-b992-ab78368030f8 Timestamp: 2025-09-28 05:47:46Z - Correlation ID: eff4c7b6-2ee4-4850-b992-ab78368030f8 - Trace ID: fd81c219-96ac-4fab-b482-1fc4e83f3900
12. **2.3 查詢參數測試**: Dynamics 365 API 請求失敗: Dynamics 365 認證失敗: invalid_scope: Error(s): 70011 - Timestamp: 2025-09-28 05:47:46Z - Description: AADSTS70011: The provided request must include a 'scope' input parameter. The provided value for the input parameter 'scope' is not valid. The scope 本地開發時不需要/.default is not valid. Trace ID: f5c19936-e727-4252-abe6-d6f69ea11501 Correlation ID: 2ba84862-0458-4913-bca7-c269cc56f5d0 Timestamp: 2025-09-28 05:47:46Z - Correlation ID: 2ba84862-0458-4913-bca7-c269cc56f5d0 - Trace ID: f5c19936-e727-4252-abe6-d6f69ea11501
13. **3.2 增量同步測試**: 同步實體 accounts 失敗: 同步帳戶資料失敗: Dynamics 365 API 請求失敗: Dynamics 365 認證失敗: invalid_scope: Error(s): 70011 - Timestamp: 2025-09-28 05:47:46Z - Description: AADSTS70011: The provided request must include a 'scope' input parameter. The provided value for the input parameter 'scope' is not valid. The scope 本地開發時不需要/.default is not valid. Trace ID: d3a55dcb-2c2f-452b-9770-19d204f11000 Correlation ID: 673b6bae-f789-480a-930f-47ceff884627 Timestamp: 2025-09-28 05:47:46Z - Correlation ID: 673b6bae-f789-480a-930f-47ceff884627 - Trace ID: d3a55dcb-2c2f-452b-9770-19d204f11000
14. **4.3 認證過期處理**: Dynamics 365 認證失敗: invalid_scope: Error(s): 70011 - Timestamp: 2025-09-28 05:47:46Z - Description: AADSTS70011: The provided request must include a 'scope' input parameter. The provided value for the input parameter 'scope' is not valid. The scope 本地開發時不需要/.default is not valid. Trace ID: 5a07eb10-7487-4ab0-97de-8fc67cc61100 Correlation ID: d9ab0e59-426d-4e89-86c7-25d27e9b8c8d Timestamp: 2025-09-28 05:47:46Z - Correlation ID: d9ab0e59-426d-4e89-86c7-25d27e9b8c8d - Trace ID: 5a07eb10-7487-4ab0-97de-8fc67cc61100
15. **5.1 單次查詢性能**: Dynamics 365 API 請求失敗: Dynamics 365 認證失敗: invalid_scope: Error(s): 70011 - Timestamp: 2025-09-28 05:47:46Z - Description: AADSTS70011: The provided request must include a 'scope' input parameter. The provided value for the input parameter 'scope' is not valid. The scope 本地開發時不需要/.default is not valid. Trace ID: f60d37fb-573b-46c9-b96b-c01702616a00 Correlation ID: a6b116ae-e4e8-4159-978e-6dd020c0ff48 Timestamp: 2025-09-28 05:47:46Z - Correlation ID: a6b116ae-e4e8-4159-978e-6dd020c0ff48 - Trace ID: f60d37fb-573b-46c9-b96b-c01702616a00
16. **5.2 並發查詢性能**: Dynamics 365 API 請求失敗: Dynamics 365 認證失敗: invalid_scope: Error(s): 70011 - Timestamp: 2025-09-28 05:47:47Z - Description: AADSTS70011: The provided request must include a 'scope' input parameter. The provided value for the input parameter 'scope' is not valid. The scope 本地開發時不需要/.default is not valid. Trace ID: 5a70e414-0276-4153-b0d5-cc1e36fd1c00 Correlation ID: 6f571570-20ed-4777-a74b-2eda350a33f5 Timestamp: 2025-09-28 05:47:47Z - Correlation ID: 6f571570-20ed-4777-a74b-2eda350a33f5 - Trace ID: 5a70e414-0276-4153-b0d5-cc1e36fd1c00
17. **5.3 大量數據查詢**: Dynamics 365 API 請求失敗: Dynamics 365 認證失敗: invalid_scope: Error(s): 70011 - Timestamp: 2025-09-28 05:47:47Z - Description: AADSTS70011: The provided request must include a 'scope' input parameter. The provided value for the input parameter 'scope' is not valid. The scope 本地開發時不需要/.default is not valid. Trace ID: 4043d819-9cc9-4420-85f9-b9f95d595e01 Correlation ID: d12d019a-3cc4-4871-bda6-a9a6f8dbe0a8 Timestamp: 2025-09-28 05:47:47Z - Correlation ID: d12d019a-3cc4-4871-bda6-a9a6f8dbe0a8 - Trace ID: 4043d819-9cc9-4420-85f9-b9f95d595e01
18. **6.1 健康檢查整合**: Dynamics 365 服務狀態異常: DOWN

## 建議

- **[HIGH] RELIABILITY**: 系統穩定性需要改善，成功率低於 80%
- **[MEDIUM] 2.1**: 2.1 模組存在多個問題，需要重點檢查
- **[MEDIUM] 2.2**: 2.2 模組存在多個問題，需要重點檢查
- **[MEDIUM] 2.3**: 2.3 模組存在多個問題，需要重點檢查
- **[MEDIUM] 6.1**: 6.1 模組存在多個問題，需要重點檢查

---
*報告生成時間: 2025-09-28T05:47:47.572Z*
