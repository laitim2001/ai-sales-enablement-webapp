/**
 * @fileoverview 推薦系統統一導出
📋 檔案用途：
提供推薦系統所有模組的統一導出入口
🔗 導出模組：
- recommendation-engine.ts - 個性化推薦引擎核心
作者：Claude Code
創建時間：2025-10-05
Sprint：Sprint 7 Phase 2
 * @module lib/recommendation/index
 *
 * 推薦系統統一導出
 * 📋 檔案用途：
 * 提供推薦系統所有模組的統一導出入口
 * 🔗 導出模組：
 * - recommendation-engine.ts - 個性化推薦引擎核心
 * 作者：Claude Code
 * 創建時間：2025-10-05
 * Sprint：Sprint 7 Phase 2
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

export {
  // 推薦引擎類
  RecommendationEngine,
  createRecommendationEngine,

  // 類型定義
  type RecommendationItem,
  type RecommendationResult,
  type RecommendationRequest,
  type RecommendationFeedback
} from './recommendation-engine';
