/**
 * @fileoverview 會議系統統一導出
📋 檔案用途：
提供會議系統所有模組的統一導出入口
🔗 導出模組：
- meeting-prep-package.ts - 會議準備包管理系統
- meeting-intelligence-analyzer.ts - 會議智能分析引擎（AI）
作者：Claude Code
日期：2025-10-05
更新：2025-10-05 (Sprint 7 Phase 2)
 * @module lib/meeting/index
 *
 * 會議系統統一導出
 * 📋 檔案用途：
 * 提供會議系統所有模組的統一導出入口
 * 🔗 導出模組：
 * - meeting-prep-package.ts - 會議準備包管理系統
 * - meeting-intelligence-analyzer.ts - 會議智能分析引擎（AI）
 * 作者：Claude Code
 * 日期：2025-10-05
 * 更新：2025-10-05 (Sprint 7 Phase 2)
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

// 會議準備包系統
export {
  MeetingPrepPackageManager,
  createMeetingPrepPackageManager,
  PrepPackageType,
  PrepPackageStatus,
  PrepItemType,
  type MeetingPrepPackage,
  type PrepPackageItem,
  type PrepPackageTemplate,
} from './meeting-prep-package';

// 會議智能分析系統（AI）
export {
  MeetingIntelligenceAnalyzer,
  createMeetingIntelligenceAnalyzer,
  type MeetingInfo,
  type MeetingInsights,
  type MeetingRecommendations,
  type RelatedResources
} from './meeting-intelligence-analyzer';
