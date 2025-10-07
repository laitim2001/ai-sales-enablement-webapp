# PROJECT-INDEX.md 智能分析報告

> **生成時間**: 2025-10-07T16:01:39.160Z
> **分析工具**: analyze-project-index-smart.js (多視圖索引感知版本)
> **分析範圍**: 全項目文件索引

---

## 📊 執行摘要

### 設計理解
PROJECT-INDEX.md 採用**多視圖索引設計**:
- ✅ 同一文件在不同視圖出現是**正常的** (如: docs目錄視圖、快速導航視圖、優先級視圖)
- ⚠️ 同一表格內重複或相同目錄被多次完整索引才是**真正的問題**

### 整體統計
- **實際文件總數**: 864
- **唯一索引文件**: 559
- **章節總數**: 118 (113 內容章節 + 5 多視圖章節)
- **索引健康度**: 64.7%

### 真正的問題統計
- ⚠️ **表格內重複**: 0 個
- ⚠️ **目錄重複索引**: 8 個
- ⚠️ **缺失索引**: 305 個文件
- ⚠️ **幽靈條目**: 0 個條目

---

## 🔄 真正的重複問題

### 表格內重複


### 目錄重複索引


#### `docs/`
被索引 2 次:

1. **章節**: 📚 docs/ - 項目文檔中心 (行 44)
   - 包含 5 個文件


2. **章節**: 📋 項目核心文檔 (docs/) (行 96)
   - 包含 50 個文件



#### `lib/search/`
被索引 2 次:

1. **章節**: 🔍 lib/search/ - Week 5 智能搜索系統 (行 157)
   - 包含 9 個文件


2. **章節**: 🔍 搜索引擎模組 (lib/search/) - Week 5 新增 (行 1514)
   - 包含 3 個文件



#### `scripts/`
被索引 2 次:

1. **章節**: 🛠️ scripts/ - 部署和維護腳本 (行 995)
   - 包含 17 個文件


2. **章節**: 📦 項目配置 (根目錄) (行 1858)
   - 包含 3 個文件



#### `components/knowledge/`
被索引 2 次:

1. **章節**: 📚 知識庫組件 (components/knowledge/) (行 1196)
   - 包含 22 個文件


2. **章節**: 📝 更新格式 (行 2084)
   - 包含 4 個文件



#### `lib/security/`
被索引 2 次:

1. **章節**: 🔐 安全模組 (lib/security/) - MVP Phase 2 Sprint 3 Week 5 (行 1568)
   - 包含 14 個文件


2. **章節**: 🔬 單元測試 (__tests__/) (行 1699)
   - 包含 5 個文件



#### `lib/performance/`
被索引 2 次:

1. **章節**: ⚡ 性能模組 (lib/performance/) - MVP Phase 2 Sprint 4 Week 7 (行 1615)
   - 包含 3 個文件


2. **章節**: 🔬 單元測試 (__tests__/) (行 1699)
   - 包含 3 個文件



#### `lib/resilience/`
被索引 2 次:

1. **章節**: ⚡ 性能模組 (lib/performance/) - MVP Phase 2 Sprint 4 Week 7 (行 1615)
   - 包含 3 個文件


2. **章節**: 🔬 單元測試 (__tests__/) (行 1699)
   - 包含 3 個文件



#### `./`
被索引 2 次:

1. **章節**: 📋 根目錄重要文檔 (行 1665)
   - 包含 11 個文件


2. **章節**: 📦 項目配置 (根目錄) (行 1858)
   - 包含 12 個文件



---

## 🔍 缺失索引完整列表

- `.eslintrc.json`
- `C:ai-sales-enablement-webapptempREADME.md`
- `index-sync-report.json`
- `jest.config.workflow.js`
- `jest.setup.workflow.js`
- `mvp-progress-report.json`
- `test-results.json`
- `scripts/add-missing-files-to-index.js`
- `scripts/analyze-project-index-smart.js`
- `scripts/analyze-project-index.js`
- `scripts/check-index-completeness.js`
- `scripts/fix-project-index.js`
- `scripts/quick-load-test.js`
- `scripts/run-audit-log-migration.ts`
- `scripts/seed-folders.ts`
- `scripts/test-encryption-performance.ts`
- `prisma/schema.prisma`
- `e2e/rbac/role-permissions.spec.ts`
- `poc/dynamics-365-mock.js`
- `poc/dynamics-365-test-mock.js`
- `poc/mock-data/README.md`
- `poc/node_modules/asynckit/bench.js`
- `poc/node_modules/asynckit/index.js`
- `poc/node_modules/asynckit/lib/abort.js`
- `poc/node_modules/asynckit/lib/async.js`
- `poc/node_modules/asynckit/lib/defer.js`
- `poc/node_modules/asynckit/lib/iterate.js`
- `poc/node_modules/asynckit/lib/readable_asynckit.js`
- `poc/node_modules/asynckit/lib/readable_parallel.js`
- `poc/node_modules/asynckit/lib/readable_serial.js`
- `poc/node_modules/asynckit/lib/readable_serial_ordered.js`
- `poc/node_modules/asynckit/lib/state.js`
- `poc/node_modules/asynckit/lib/streamify.js`
- `poc/node_modules/asynckit/lib/terminator.js`
- `poc/node_modules/asynckit/parallel.js`
- `poc/node_modules/asynckit/serial.js`
- `poc/node_modules/asynckit/serialOrdered.js`
- `poc/node_modules/asynckit/stream.js`
- `poc/node_modules/axios/dist/axios.js`
- `poc/node_modules/axios/dist/axios.min.js`
- `poc/node_modules/axios/dist/esm/axios.js`
- `poc/node_modules/axios/dist/esm/axios.min.js`
- `poc/node_modules/axios/index.js`
- `poc/node_modules/axios/lib/adapters/adapters.js`
- `poc/node_modules/axios/lib/adapters/fetch.js`
- `poc/node_modules/axios/lib/adapters/http.js`
- `poc/node_modules/axios/lib/adapters/xhr.js`
- `poc/node_modules/axios/lib/axios.js`
- `poc/node_modules/axios/lib/cancel/CanceledError.js`
- `poc/node_modules/axios/lib/cancel/CancelToken.js`
- `poc/node_modules/axios/lib/cancel/isCancel.js`
- `poc/node_modules/axios/lib/core/Axios.js`
- `poc/node_modules/axios/lib/core/AxiosError.js`
- `poc/node_modules/axios/lib/core/AxiosHeaders.js`
- `poc/node_modules/axios/lib/core/buildFullPath.js`
- `poc/node_modules/axios/lib/core/dispatchRequest.js`
- `poc/node_modules/axios/lib/core/InterceptorManager.js`
- `poc/node_modules/axios/lib/core/mergeConfig.js`
- `poc/node_modules/axios/lib/core/settle.js`
- `poc/node_modules/axios/lib/core/transformData.js`
- `poc/node_modules/axios/lib/defaults/index.js`
- `poc/node_modules/axios/lib/defaults/transitional.js`
- `poc/node_modules/axios/lib/env/classes/FormData.js`
- `poc/node_modules/axios/lib/env/data.js`
- `poc/node_modules/axios/lib/helpers/AxiosTransformStream.js`
- `poc/node_modules/axios/lib/helpers/AxiosURLSearchParams.js`
- `poc/node_modules/axios/lib/helpers/bind.js`
- `poc/node_modules/axios/lib/helpers/buildURL.js`
- `poc/node_modules/axios/lib/helpers/callbackify.js`
- `poc/node_modules/axios/lib/helpers/combineURLs.js`
- `poc/node_modules/axios/lib/helpers/composeSignals.js`
- `poc/node_modules/axios/lib/helpers/cookies.js`
- `poc/node_modules/axios/lib/helpers/deprecatedMethod.js`
- `poc/node_modules/axios/lib/helpers/estimateDataURLDecodedBytes.js`
- `poc/node_modules/axios/lib/helpers/formDataToJSON.js`
- `poc/node_modules/axios/lib/helpers/formDataToStream.js`
- `poc/node_modules/axios/lib/helpers/fromDataURI.js`
- `poc/node_modules/axios/lib/helpers/HttpStatusCode.js`
- `poc/node_modules/axios/lib/helpers/isAbsoluteURL.js`
- `poc/node_modules/axios/lib/helpers/isAxiosError.js`
- `poc/node_modules/axios/lib/helpers/isURLSameOrigin.js`
- `poc/node_modules/axios/lib/helpers/null.js`
- `poc/node_modules/axios/lib/helpers/parseHeaders.js`
- `poc/node_modules/axios/lib/helpers/parseProtocol.js`
- `poc/node_modules/axios/lib/helpers/progressEventReducer.js`
- `poc/node_modules/axios/lib/helpers/readBlob.js`
- `poc/node_modules/axios/lib/helpers/resolveConfig.js`
- `poc/node_modules/axios/lib/helpers/speedometer.js`
- `poc/node_modules/axios/lib/helpers/spread.js`
- `poc/node_modules/axios/lib/helpers/throttle.js`
- `poc/node_modules/axios/lib/helpers/toFormData.js`
- `poc/node_modules/axios/lib/helpers/toURLEncodedForm.js`
- `poc/node_modules/axios/lib/helpers/trackStream.js`
- `poc/node_modules/axios/lib/helpers/validator.js`
- `poc/node_modules/axios/lib/helpers/ZlibHeaderTransformStream.js`
- `poc/node_modules/axios/lib/platform/browser/classes/Blob.js`
- `poc/node_modules/axios/lib/platform/browser/classes/FormData.js`
- `poc/node_modules/axios/lib/platform/browser/classes/URLSearchParams.js`
- `poc/node_modules/axios/lib/platform/browser/index.js`
- `poc/node_modules/axios/lib/platform/common/utils.js`
- `poc/node_modules/axios/lib/platform/index.js`
- `poc/node_modules/axios/lib/platform/node/classes/FormData.js`
- `poc/node_modules/axios/lib/platform/node/classes/URLSearchParams.js`
- `poc/node_modules/axios/lib/platform/node/index.js`
- `poc/node_modules/axios/lib/utils.js`
- `poc/node_modules/call-bind-apply-helpers/actualApply.js`
- `poc/node_modules/call-bind-apply-helpers/applyBind.js`
- `poc/node_modules/call-bind-apply-helpers/functionApply.js`
- `poc/node_modules/call-bind-apply-helpers/functionCall.js`
- `poc/node_modules/call-bind-apply-helpers/index.js`
- `poc/node_modules/call-bind-apply-helpers/reflectApply.js`
- `poc/node_modules/call-bind-apply-helpers/test/index.js`
- `poc/node_modules/combined-stream/lib/combined_stream.js`
- `poc/node_modules/delayed-stream/lib/delayed_stream.js`
- `poc/node_modules/dotenv/config.js`
- `poc/node_modules/dotenv/lib/cli-options.js`
- `poc/node_modules/dotenv/lib/env-options.js`
- `poc/node_modules/dotenv/lib/main.js`
- `poc/node_modules/dunder-proto/get.js`
- `poc/node_modules/dunder-proto/set.js`
- `poc/node_modules/dunder-proto/test/get.js`
- `poc/node_modules/dunder-proto/test/index.js`
- `poc/node_modules/dunder-proto/test/set.js`
- `poc/node_modules/es-define-property/index.js`
- `poc/node_modules/es-define-property/test/index.js`
- `poc/node_modules/es-errors/eval.js`
- `poc/node_modules/es-errors/index.js`
- `poc/node_modules/es-errors/range.js`
- `poc/node_modules/es-errors/ref.js`
- `poc/node_modules/es-errors/syntax.js`
- `poc/node_modules/es-errors/test/index.js`
- `poc/node_modules/es-errors/type.js`
- `poc/node_modules/es-errors/uri.js`
- `poc/node_modules/es-object-atoms/index.js`
- `poc/node_modules/es-object-atoms/isObject.js`
- `poc/node_modules/es-object-atoms/RequireObjectCoercible.js`
- `poc/node_modules/es-object-atoms/test/index.js`
- `poc/node_modules/es-object-atoms/ToObject.js`
- `poc/node_modules/es-set-tostringtag/index.js`
- `poc/node_modules/es-set-tostringtag/test/index.js`
- `poc/node_modules/follow-redirects/debug.js`
- `poc/node_modules/follow-redirects/http.js`
- `poc/node_modules/follow-redirects/https.js`
- `poc/node_modules/follow-redirects/index.js`
- `poc/node_modules/form-data/lib/browser.js`
- `poc/node_modules/form-data/lib/form_data.js`
- `poc/node_modules/form-data/lib/populate.js`
- `poc/node_modules/function-bind/implementation.js`
- `poc/node_modules/function-bind/index.js`
- `poc/node_modules/function-bind/test/index.js`
- `poc/node_modules/get-intrinsic/index.js`
- `poc/node_modules/get-intrinsic/test/GetIntrinsic.js`
- `poc/node_modules/get-proto/index.js`
- `poc/node_modules/get-proto/Object.getPrototypeOf.js`
- `poc/node_modules/get-proto/Reflect.getPrototypeOf.js`
- `poc/node_modules/get-proto/test/index.js`
- `poc/node_modules/gopd/gOPD.js`
- `poc/node_modules/gopd/index.js`
- `poc/node_modules/gopd/test/index.js`
- `poc/node_modules/has-symbols/index.js`
- `poc/node_modules/has-symbols/shams.js`
- `poc/node_modules/has-symbols/test/index.js`
- `poc/node_modules/has-symbols/test/shams/core-js.js`
- `poc/node_modules/has-symbols/test/shams/get-own-property-symbols.js`
- `poc/node_modules/has-symbols/test/tests.js`
- `poc/node_modules/has-tostringtag/index.js`
- `poc/node_modules/has-tostringtag/shams.js`
- `poc/node_modules/has-tostringtag/test/index.js`
- `poc/node_modules/has-tostringtag/test/shams/core-js.js`
- `poc/node_modules/has-tostringtag/test/shams/get-own-property-symbols.js`
- `poc/node_modules/has-tostringtag/test/tests.js`
- `poc/node_modules/hasown/index.js`
- `poc/node_modules/math-intrinsics/abs.js`
- `poc/node_modules/math-intrinsics/constants/maxArrayLength.js`
- `poc/node_modules/math-intrinsics/constants/maxSafeInteger.js`
- `poc/node_modules/math-intrinsics/constants/maxValue.js`
- `poc/node_modules/math-intrinsics/floor.js`
- `poc/node_modules/math-intrinsics/isFinite.js`
- `poc/node_modules/math-intrinsics/isInteger.js`
- `poc/node_modules/math-intrinsics/isNaN.js`
- `poc/node_modules/math-intrinsics/isNegativeZero.js`
- `poc/node_modules/math-intrinsics/max.js`
- `poc/node_modules/math-intrinsics/min.js`
- `poc/node_modules/math-intrinsics/mod.js`
- `poc/node_modules/math-intrinsics/pow.js`
- `poc/node_modules/math-intrinsics/round.js`
- `poc/node_modules/math-intrinsics/sign.js`
- `poc/node_modules/math-intrinsics/test/index.js`
- `poc/node_modules/mime-db/index.js`
- `poc/node_modules/pg/lib/client.js`
- `poc/node_modules/pg/lib/connection-parameters.js`
- `poc/node_modules/pg/lib/connection.js`
- `poc/node_modules/pg/lib/crypto/cert-signatures.js`
- `poc/node_modules/pg/lib/crypto/sasl.js`
- `poc/node_modules/pg/lib/crypto/utils-legacy.js`
- `poc/node_modules/pg/lib/crypto/utils-webcrypto.js`
- `poc/node_modules/pg/lib/crypto/utils.js`
- `poc/node_modules/pg/lib/defaults.js`
- `poc/node_modules/pg/lib/index.js`
- `poc/node_modules/pg/lib/native/client.js`
- `poc/node_modules/pg/lib/native/index.js`
- `poc/node_modules/pg/lib/native/query.js`
- `poc/node_modules/pg/lib/query.js`
- `poc/node_modules/pg/lib/result.js`
- `poc/node_modules/pg/lib/stream.js`
- `poc/node_modules/pg/lib/type-overrides.js`
- `poc/node_modules/pg/lib/utils.js`
- `poc/node_modules/pg-cloudflare/dist/empty.js`
- `poc/node_modules/pg-cloudflare/dist/index.js`
- `poc/node_modules/pg-connection-string/index.js`
- `poc/node_modules/pg-int8/index.js`
- `poc/node_modules/pg-pool/index.js`
- `poc/node_modules/pg-protocol/dist/b.js`
- `poc/node_modules/pg-protocol/dist/buffer-reader.js`
- `poc/node_modules/pg-protocol/dist/buffer-writer.js`
- `poc/node_modules/pg-protocol/dist/inbound-parser.test.js`
- `poc/node_modules/pg-protocol/dist/index.js`
- `poc/node_modules/pg-protocol/dist/messages.js`
- `poc/node_modules/pg-protocol/dist/outbound-serializer.test.js`
- `poc/node_modules/pg-protocol/dist/parser.js`
- `poc/node_modules/pg-protocol/dist/serializer.js`
- `poc/node_modules/pg-protocol/esm/index.js`
- `poc/node_modules/pgpass/lib/helper.js`
- `poc/node_modules/pgpass/lib/index.js`
- `poc/node_modules/postgres-array/index.js`
- `poc/node_modules/postgres-bytea/index.js`
- `poc/node_modules/postgres-date/index.js`
- `poc/node_modules/postgres-interval/index.js`
- `poc/node_modules/proxy-from-env/index.js`
- `poc/node_modules/proxy-from-env/test.js`
- `poc/node_modules/split2/bench.js`
- `poc/node_modules/split2/index.js`
- `poc/node_modules/split2/test.js`
- `poc/node_modules/uuid/dist/commonjs-browser/index.js`
- `poc/node_modules/uuid/dist/commonjs-browser/md5.js`
- `poc/node_modules/uuid/dist/commonjs-browser/native.js`
- `poc/node_modules/uuid/dist/commonjs-browser/nil.js`
- `poc/node_modules/uuid/dist/commonjs-browser/parse.js`
- `poc/node_modules/uuid/dist/commonjs-browser/regex.js`
- `poc/node_modules/uuid/dist/commonjs-browser/rng.js`
- `poc/node_modules/uuid/dist/commonjs-browser/sha1.js`
- `poc/node_modules/uuid/dist/commonjs-browser/stringify.js`
- `poc/node_modules/uuid/dist/commonjs-browser/v1.js`
- `poc/node_modules/uuid/dist/commonjs-browser/v3.js`
- `poc/node_modules/uuid/dist/commonjs-browser/v35.js`
- `poc/node_modules/uuid/dist/commonjs-browser/v4.js`
- `poc/node_modules/uuid/dist/commonjs-browser/v5.js`
- `poc/node_modules/uuid/dist/commonjs-browser/validate.js`
- `poc/node_modules/uuid/dist/commonjs-browser/version.js`
- `poc/node_modules/uuid/dist/esm-browser/index.js`
- `poc/node_modules/uuid/dist/esm-browser/md5.js`
- `poc/node_modules/uuid/dist/esm-browser/native.js`
- `poc/node_modules/uuid/dist/esm-browser/nil.js`
- `poc/node_modules/uuid/dist/esm-browser/parse.js`
- `poc/node_modules/uuid/dist/esm-browser/regex.js`
- `poc/node_modules/uuid/dist/esm-browser/rng.js`
- `poc/node_modules/uuid/dist/esm-browser/sha1.js`
- `poc/node_modules/uuid/dist/esm-browser/stringify.js`
- `poc/node_modules/uuid/dist/esm-browser/v1.js`
- `poc/node_modules/uuid/dist/esm-browser/v3.js`
- `poc/node_modules/uuid/dist/esm-browser/v35.js`
- `poc/node_modules/uuid/dist/esm-browser/v4.js`
- `poc/node_modules/uuid/dist/esm-browser/v5.js`
- `poc/node_modules/uuid/dist/esm-browser/validate.js`
- `poc/node_modules/uuid/dist/esm-browser/version.js`
- `poc/node_modules/uuid/dist/esm-node/index.js`
- `poc/node_modules/uuid/dist/esm-node/md5.js`
- `poc/node_modules/uuid/dist/esm-node/native.js`
- `poc/node_modules/uuid/dist/esm-node/nil.js`
- `poc/node_modules/uuid/dist/esm-node/parse.js`
- `poc/node_modules/uuid/dist/esm-node/regex.js`
- `poc/node_modules/uuid/dist/esm-node/rng.js`
- `poc/node_modules/uuid/dist/esm-node/sha1.js`
- `poc/node_modules/uuid/dist/esm-node/stringify.js`
- `poc/node_modules/uuid/dist/esm-node/v1.js`
- `poc/node_modules/uuid/dist/esm-node/v3.js`
- `poc/node_modules/uuid/dist/esm-node/v35.js`
- `poc/node_modules/uuid/dist/esm-node/v4.js`
- `poc/node_modules/uuid/dist/esm-node/v5.js`
- `poc/node_modules/uuid/dist/esm-node/validate.js`
- `poc/node_modules/uuid/dist/esm-node/version.js`
- `poc/node_modules/uuid/dist/index.js`
- `poc/node_modules/uuid/dist/md5-browser.js`
- `poc/node_modules/uuid/dist/md5.js`
- `poc/node_modules/uuid/dist/native-browser.js`
- `poc/node_modules/uuid/dist/native.js`
- `poc/node_modules/uuid/dist/nil.js`
- `poc/node_modules/uuid/dist/parse.js`
- `poc/node_modules/uuid/dist/regex.js`
- `poc/node_modules/uuid/dist/rng-browser.js`
- `poc/node_modules/uuid/dist/rng.js`
- `poc/node_modules/uuid/dist/sha1-browser.js`
- `poc/node_modules/uuid/dist/sha1.js`
- `poc/node_modules/uuid/dist/stringify.js`
- `poc/node_modules/uuid/dist/uuid-bin.js`
- `poc/node_modules/uuid/dist/v1.js`
- `poc/node_modules/uuid/dist/v3.js`
- `poc/node_modules/uuid/dist/v35.js`
- `poc/node_modules/uuid/dist/v4.js`
- `poc/node_modules/uuid/dist/v5.js`
- `poc/node_modules/uuid/dist/validate.js`
- `poc/node_modules/uuid/dist/version.js`
- `poc/node_modules/xtend/immutable.js`
- `poc/node_modules/xtend/mutable.js`
- `poc/node_modules/xtend/test.js`

---

## 👻 幽靈條目完整列表



---

## 📂 目錄詳細統計 (僅內容章節)

| 目錄 | 實際文件 | 索引條目 | 差異 | 覆蓋率 | 索引章節數 |
|------|----------|----------|------|--------|-----------|
| . | 32 | 25 | -7 | 78.1% | 4 |
| lib | 125 | 130 | +5 | 104.0% | 31 |
| components | 114 | 115 | +1 | 100.9% | 16 |
| app | 120 | 124 | +4 | 103.3% | 18 |
| __tests__ | 35 | 35 | 0 | 100.0% | 1 |
| docs | 82 | 83 | +1 | 101.2% | 4 |
| claudedocs | 6 | 6 | 0 | 100.0% | 1 |
| scripts | 29 | 23 | -6 | 79.3% | 3 |
| prisma | 1 | 0 | -1 | 0.0% | 0 |
| e2e | 13 | 12 | -1 | 92.3% | 1 |
| types | 5 | 5 | 0 | 100.0% | 2 |
| poc | 302 | 15 | -287 | 5.0% | 2 |

---

## 🎯 修復建議

### 1. 處理真正的重複 (優先級: 🔴 高)
- 表格內重複: 0 個 → 移除重複條目
- 目錄重複索引: 8 個 → 合併或移除冗餘章節

### 2. 補充缺失索引 (優先級: 🟡 中)
- 總計: 305 個未索引文件
- 方法: 為新增文件添加適當的索引條目

### 3. 清理幽靈條目 (優先級: 🟢 低)
- 總計: 0 個過時條目
- 方法: 移除指向已刪除文件的索引

---

**報告結束**
