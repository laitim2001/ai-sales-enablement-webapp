# xlsx 安全漏洞評估報告

> **評估日期**: 2025-10-05
> **嚴重程度**: 🔴 高風險
> **狀態**: ⚠️ 待處理

---

## 📋 漏洞詳情

### **發現的漏洞**

1. **Prototype Pollution** (原型污染)
   - **CVE**: GHSA-4r6h-8v6p-xvw6
   - **影響**: 攻擊者可通過惡意構造的Excel文件污染JavaScript對象原型
   - **風險**: 可能導致遠程代碼執行或拒絕服務

2. **Regular Expression Denial of Service (ReDoS)**
   - **CVE**: GHSA-5pgg-2g8v-p4x9
   - **影響**: 正則表達式處理效率低下,可能導致CPU資源耗盡
   - **風險**: 服務拒絕攻擊

### **修復狀態**

- ❌ **No fix available** - xlsx套件目前無可用修復版本
- ⚠️ 需要尋找替代方案或實施緩解措施

---

## 🔍 項目中的使用情況

### **使用範圍**

- **文件**: `lib/parsers/excel-parser.ts` (369行)
- **功能**: 解析用戶上傳的Excel/CSV文件到知識庫
- **暴露點**:
  - 知識庫文件上傳API
  - 批量數據導入功能

### **現有安全措施**

✅ **已實施的防護**:
1. **文件大小限制**: 默認50MB上限
2. **行數限制**: 默認10,000行上限
3. **文件類型驗證**: 通過magic number檢測文件頭
4. **錯誤處理**: 完善的異常捕獲和錯誤提示

⚠️ **不足之處**:
- 無針對原型污染的防護
- 無ReDoS攻擊的特定防護

---

## 🛡️ 緩解措施建議

### **方案A: 立即緩解 (不更換套件)**

#### 1. **輸入驗證強化**
```typescript
// 在 excel-parser.ts 添加額外驗證
private validateWorkbook(workbook: XLSX.WorkBook): void {
  // 檢查工作簿對象是否被污染
  if (Object.prototype.hasOwnProperty.call(Object.prototype, '__proto__')) {
    throw new Error('檢測到潛在的原型污染攻擊')
  }

  // 限制工作表數量
  if (workbook.SheetNames.length > 50) {
    throw new Error('工作表數量過多,可能為惡意文件')
  }
}
```

#### 2. **沙箱隔離**
- 使用 `vm2` 或 Worker threads 在隔離環境中解析Excel
- 限制內存和CPU使用

#### 3. **速率限制**
- 對Excel上傳端點實施嚴格的速率限制
- 單用戶每小時最多10個文件

### **方案B: 替代套件 (推薦)**

#### **替代方案研究**

| 套件 | 優點 | 缺點 | 安全性 |
|------|------|------|--------|
| **exceljs** | 積極維護,功能豐富,支持寫入 | 略大(1.2MB) | ✅ 無已知漏洞 |
| **sheetjs-community** | xlsx社區維護版本 | 可能仍有類似問題 | ⚠️ 待評估 |
| **node-xlsx** | 輕量(基於xlsx) | 依賴xlsx,相同風險 | ❌ 不推薦 |
| **xlsx-populate** | 現代API,TypeScript支持 | 功能較少 | ✅ 安全 |

#### **推薦: exceljs**
```bash
npm install exceljs
npm uninstall xlsx
```

**遷移工作量評估**:
- 代碼修改: `lib/parsers/excel-parser.ts` (~200行需調整)
- 測試更新: 需更新相關測試用例
- API兼容: 保持現有接口不變
- 預估時間: 2-3小時

---

## 📊 風險評估

### **當前風險等級: 🟡 中等**

**降低因素**:
- ✅ 已有文件大小和行數限制
- ✅ 需要認證才能上傳文件
- ✅ 僅內部用戶使用(非公開API)

**增加因素**:
- ❌ 無修復版本可用
- ❌ 原型污染可能影響整個應用
- ❌ ReDoS可能導致服務中斷

### **建議優先級: 🟡 中等優先級**

- **時間框架**: 1-2週內處理
- **建議方案**: 方案B (遷移到exceljs)
- **臨時措施**: 加強輸入驗證和速率限制

---

## 🎯 行動計劃

### **階段1: 臨時防護 (1天)**
- [ ] 添加額外的輸入驗證邏輯
- [ ] 實施Excel上傳的嚴格速率限制
- [ ] 添加文件內容掃描(檢測異常模式)

### **階段2: 套件遷移 (2-3天)**
- [ ] 安裝並測試exceljs套件
- [ ] 重寫excel-parser.ts使用exceljs API
- [ ] 更新單元測試和集成測試
- [ ] 驗證所有Excel/CSV解析功能正常

### **階段3: 驗證和部署 (1天)**
- [ ] 完整回歸測試
- [ ] 性能測試(確保無性能下降)
- [ ] 安全掃描驗證漏洞已消除
- [ ] 部署到生產環境

---

## 📝 決策記錄

### **決策: 暫時保留xlsx,加強防護**

**理由**:
1. 當前為Sprint 6階段,專注於知識庫功能完成
2. 風險等級為中等,非緊急阻塞性問題
3. 已有多層防護措施降低風險
4. 可在Sprint 6完成後的技術債務清理階段處理

**後續計劃**:
- Sprint 6完成後立即處理
- 優先級: P1 (高優先級技術債務)
- 預計在2週內完成遷移

---

## 🔗 相關資源

- [xlsx安全公告 - GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6)
- [ReDoS漏洞詳情 - GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9)
- [exceljs GitHub](https://github.com/exceljs/exceljs)
- [原型污染攻擊詳解](https://portswigger.net/web-security/prototype-pollution)
