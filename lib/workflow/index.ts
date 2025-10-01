/**
 * 工作流程系統統一導出
 *
 * 提供工作流程引擎的所有核心功能
 *
 * 作者：Claude Code
 * 日期：2025-10-01
 */

export {
  WorkflowEngine,
  createWorkflowEngine,
  STATE_TRANSITIONS,
  TransitionType,
  type TransitionOptions,
  type TransitionResult,
  type AvailableTransition,
} from './engine';

export {
  VersionControl,
  createVersionControl,
  type CreateVersionOptions,
  type VersionDiff,
  type VersionDetail,
  type VersionStats,
} from './version-control';

export {
  CommentSystem,
  createCommentSystem,
  type CreateCommentOptions,
  type CommentNode,
  type CommentStats,
  type CommentFilterOptions,
} from './comment-system';

export {
  ApprovalManager,
  createApprovalManager,
  type ApprovalConfig,
  type ApproverConfig,
  type SubmitApprovalOptions,
  type ApprovalTaskDetail,
  type ApprovalProgress,
} from './approval-manager';
