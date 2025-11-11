# Knowledge Base API Documentation

## 概述

知識庫 API 提供了完整的知識管理功能，包括文檔上傳、分類、搜索、標籤管理和處理任務管理。

## 基本信息

- **Base URL**: `/api/knowledge-base`
- **認證**: 所有端點都需要 Bearer Token 認證
- **Content Type**: `application/json` (除文件上傳外)

## API 端點

### 1. 知識庫項目管理

#### GET /api/knowledge-base
獲取知識庫項目列表

**查詢參數**:
- `page` (number, default: 1) - 頁碼
- `limit` (number, default: 20) - 每頁數量
- `category` (enum) - 文檔類別篩選
- `status` (enum) - 文檔狀態篩選
- `search` (string) - 搜索關鍵字
- `tags` (string) - 標籤篩選（逗號分隔）
- `sort` (enum: created_at|updated_at|title) - 排序字段
- `order` (enum: asc|desc) - 排序方向

**響應示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "產品規格文檔",
      "category": "PRODUCT_SPEC",
      "status": "ACTIVE",
      "author": "John Doe",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "creator": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe"
      },
      "tags": [
        {
          "id": 1,
          "name": "產品",
          "color": "#FF5722"
        }
      ],
      "_count": {
        "chunks": 15
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### POST /api/knowledge-base
創建新的知識庫項目

**請求體**:
```json
{
  "title": "文檔標題",
  "content": "文檔內容（可選）",
  "category": "GENERAL",
  "source": "來源（可選）",
  "author": "作者（可選）",
  "language": "zh-TW",
  "metadata": {
    "key": "value"
  },
  "tags": ["標籤1", "標籤2"]
}
```

**響應**: 201 Created，返回創建的項目詳情

#### GET /api/knowledge-base/{id}
獲取單個知識庫項目詳情

**響應包含**:
- 基本信息
- 創建者和更新者信息
- 標籤列表
- 內容分塊列表
- 處理任務歷史
- 統計信息

#### PUT /api/knowledge-base/{id}
更新知識庫項目

**請求體**: 與創建相同，所有字段可選

**特殊行為**:
- 內容變化時會重新觸發向量化處理
- 版本號自動遞增
- 標籤會完全替換（不是追加）

#### DELETE /api/knowledge-base/{id}
刪除知識庫項目

**查詢參數**:
- `hard=true` - 執行硬刪除（完全移除）

**默認行為**: 軟刪除（標記為 DELETED 狀態）

### 2. 搜索功能

#### POST /api/knowledge-base/search
執行知識庫搜索

**請求體**:
```json
{
  "query": "搜索關鍵字",
  "type": "hybrid",
  "category": "GENERAL",
  "tags": ["標籤1"],
  "limit": 10,
  "similarity_threshold": 0.7,
  "include_chunks": true
}
```

**搜索類型**:
- `text` - 傳統文本搜索
- `semantic` - 語義向量搜索
- `hybrid` - 混合搜索（推薦）

**響應示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "相關文檔",
      "search_score": 0.85,
      "search_type": "hybrid",
      "relevant_chunks": [
        {
          "id": 123,
          "content": "匹配的內容片段",
          "chunk_index": 0,
          "similarity_score": 0.92
        }
      ]
    }
  ],
  "metadata": {
    "query": "搜索關鍵字",
    "search_type": "hybrid",
    "total_results": 5,
    "similarity_threshold": 0.7
  }
}
```

### 3. 文件上傳

#### GET /api/knowledge-base/upload
獲取上傳配置

**響應**:
```json
{
  "success": true,
  "data": {
    "supported_mime_types": {
      "text/plain": "txt",
      "application/pdf": "pdf"
    },
    "max_file_size": 10485760,
    "max_file_size_mb": 10,
    "supported_categories": ["GENERAL", "PRODUCT_SPEC"],
    "default_language": "zh-TW",
    "auto_processing": true
  }
}
```

#### POST /api/knowledge-base/upload
上傳文件到知識庫

**Content-Type**: `multipart/form-data`

**表單字段**:
- `file` (File) - 要上傳的文件
- `metadata` (JSON string) - 文檔元數據

**元數據示例**:
```json
{
  "category": "GENERAL",
  "tags": ["上傳"],
  "author": "系統管理員",
  "language": "zh-TW",
  "auto_process": true
}
```

**支持的文件類型**:
- 文本文件: .txt, .md, .csv
- 文檔文件: .pdf, .doc, .docx
- 標記語言: .html
- 數據文件: .json

### 4. 標籤管理

#### GET /api/knowledge-base/tags
獲取標籤列表

**查詢參數**:
- `hierarchical=true` - 獲取層次化結構
- `usage=true` - 包含使用統計
- `parent_id` - 父標籤ID篩選

**響應示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "產品",
      "description": "產品相關標籤",
      "color": "#FF5722",
      "parent_id": null,
      "usage_count": 15,
      "actual_usage_count": 15,
      "children": [
        {
          "id": 2,
          "name": "規格",
          "color": "#FFC107",
          "usage_count": 8
        }
      ]
    }
  ]
}
```

#### POST /api/knowledge-base/tags
創建新標籤

**請求體**:
```json
{
  "name": "標籤名稱",
  "description": "標籤描述（可選）",
  "color": "#FF5722",
  "parent_id": 1
}
```

#### PUT /api/knowledge-base/tags/{id}
更新標籤

#### DELETE /api/knowledge-base/tags/{id}
刪除標籤

**查詢參數**:
- `force=true` - 強制刪除（即使有關聯項目）

### 5. 處理任務管理

#### GET /api/knowledge-base/processing
獲取處理任務列表

**查詢參數**:
- `status` - 任務狀態篩選
- `task_type` - 任務類型篩選
- `knowledge_base_id` - 知識庫項目ID篩選
- `limit` - 數量限制
- `offset` - 偏移量

**響應包含統計信息**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {...},
  "stats": {
    "last_24h": {
      "PENDING": 5,
      "PROCESSING": 2,
      "COMPLETED": 18,
      "FAILED": 1
    },
    "total_pending": 5,
    "total_processing": 2,
    "total_completed": 18,
    "total_failed": 1
  }
}
```

#### POST /api/knowledge-base/processing
手動觸發處理任務

**請求體**:
```json
{
  "knowledge_base_id": 1,
  "task_type": "VECTORIZATION",
  "priority": 7,
  "metadata": {
    "manual_trigger": true
  }
}
```

**任務類型**:
- `DOCUMENT_PARSE` - 文檔解析
- `VECTORIZATION` - 向量化處理
- `CONTENT_EXTRACTION` - 內容提取
- `METADATA_EXTRACTION` - 元數據提取
- `DUPLICATE_CHECK` - 重複檢查
- `INDEX_UPDATE` - 索引更新

#### PUT /api/knowledge-base/processing/{id}
更新處理任務狀態

**請求體**:
```json
{
  "status": "PROCESSING",
  "progress": 0.5,
  "processed_items": 50,
  "total_items": 100,
  "error_message": "錯誤信息（可選）"
}
```

## 數據模型

### DocumentCategory 枚舉
```typescript
enum DocumentCategory {
  GENERAL = "GENERAL",
  PRODUCT_SPEC = "PRODUCT_SPEC",
  SALES_MATERIAL = "SALES_MATERIAL",
  TECHNICAL_DOC = "TECHNICAL_DOC",
  LEGAL_DOC = "LEGAL_DOC",
  TRAINING = "TRAINING",
  FAQ = "FAQ",
  CASE_STUDY = "CASE_STUDY",
  WHITE_PAPER = "WHITE_PAPER",
  PRESENTATION = "PRESENTATION",
  COMPETITOR = "COMPETITOR",
  INDUSTRY_NEWS = "INDUSTRY_NEWS",
  INTERNAL = "INTERNAL"
}
```

### DocumentStatus 枚舉
```typescript
enum DocumentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
  DELETED = "DELETED",
  DRAFT = "DRAFT"
}
```

### ProcessingStatus 枚舉
```typescript
enum ProcessingStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  RETRY = "RETRY"
}
```

## 錯誤處理

### 通用錯誤格式
```json
{
  "success": false,
  "error": "錯誤描述",
  "details": {
    // 詳細錯誤信息（可選）
  }
}
```

### 常見錯誤碼
- `400 Bad Request` - 請求參數無效
- `401 Unauthorized` - 未認證
- `403 Forbidden` - 無權限
- `404 Not Found` - 資源不存在
- `409 Conflict` - 資源衝突（如重複內容）
- `413 Payload Too Large` - 文件過大
- `415 Unsupported Media Type` - 不支持的文件類型
- `500 Internal Server Error` - 服務器錯誤

## 使用示例

### JavaScript/TypeScript
```typescript
// 獲取知識庫列表
const response = await fetch('/api/knowledge-base', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})

const data = await response.json()

// 創建知識庫項目
const createResponse = await fetch('/api/knowledge-base', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '新文檔',
    content: '文檔內容',
    category: 'GENERAL',
    tags: ['新建']
  })
})

// 搜索知識庫
const searchResponse = await fetch('/api/knowledge-base/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: '產品規格',
    type: 'hybrid',
    limit: 10
  })
})

// 文件上傳
const formData = new FormData()
formData.append('file', file)
formData.append('metadata', JSON.stringify({
  category: 'PRODUCT_SPEC',
  tags: ['上傳', '規格'],
  auto_process: true
}))

const uploadResponse = await fetch('/api/knowledge-base/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // 不要設置 Content-Type，讓瀏覽器自動設置
  },
  body: formData
})
```

## 最佳實踐

1. **分頁處理**: 總是使用適當的分頁參數，避免一次加載過多數據
2. **搜索優化**: 使用 hybrid 搜索類型以獲得最佳結果
3. **文件上傳**: 在上傳前檢查文件大小和類型
4. **標籤管理**: 建立合理的標籤層次結構，避免標籤氾濫
5. **錯誤處理**: 總是檢查響應的 success 字段和適當處理錯誤
6. **認證**: 確保在每個請求中包含有效的認證令牌

## 速率限制

- 一般 API 調用: 100 請求/分鐘
- 搜索 API: 20 請求/分鐘
- 文件上傳: 10 請求/分鐘
- 處理任務觸發: 5 請求/分鐘

## 版本控制

當前版本: v1
所有端點都包含版本信息在響應頭中: `X-API-Version: 1.0.0`