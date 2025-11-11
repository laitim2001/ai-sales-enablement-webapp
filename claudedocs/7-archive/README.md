# 📦 歷史歸檔

> **用途**: 歸檔已完成的Sprint、過期報告、廢棄文檔
> **受眾**: 需要查閱歷史記錄的人員

## 📂 歸檔分類

### **已完成的Sprint**
- `completed-sprints/` - 100%完成的Sprint文檔
  - 格式: `sprint-X/` (包含完整的計劃、實施、回顧文檔)

### **舊報告**
- `old-reports/` - 超過1個月的狀態報告和驗證報告
  - 格式: `YYYY-MM/` (按月份歸檔)

### **已廢棄文檔**
- `deprecated-docs/` - 不再使用的文檔（保留作為參考）
  - 格式: `YYYY-MM-DD-document-name.md`

---

## 📋 歸檔規則

### **何時歸檔**:
- ✅ **Sprint完成後**: Sprint文檔移至completed-sprints/
- 📅 **每月月初**: 上月報告移至old-reports/
- 🗑️ **文檔廢棄時**: 立即移至deprecated-docs/

### **保留期限**:
- `completed-sprints/`: 永久保留
- `old-reports/`: 保留1年
- `deprecated-docs/`: 保留6個月後評估刪除

### **命名規範**:
```
completed-sprints/sprint-X/
old-reports/YYYY-MM/weekly-report-weekXX.md
deprecated-docs/YYYY-MM-DD-deprecated-feature-plan.md
```

---

**最後更新**: 2025-11-11
