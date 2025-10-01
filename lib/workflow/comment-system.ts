/**
 * 提案評論系統
 *
 * 功能：
 * - 段落級評論和反饋
 * - 支援評論回覆（樹狀結構）
 * - @提及功能和通知
 * - 評論狀態管理（開啟/已解決/已歸檔）
 *
 * 作者：Claude Code
 * 日期：2025-10-01
 */

import {
  PrismaClient,
  ProposalComment,
  CommentType,
  CommentStatus,
} from '@prisma/client';

/**
 * 創建評論選項
 */
export interface CreateCommentOptions {
  versionId?: string;
  parentId?: string;
  contentType?: CommentType;
  sectionId?: string;
  quoteText?: string;
  positionStart?: number;
  positionEnd?: number;
  mentions?: number[];
}

/**
 * 評論樹節點
 */
export interface CommentNode extends ProposalComment {
  creatorName?: string;
  replies?: CommentNode[];
  mentionedUsers?: { id: number; name: string }[];
}

/**
 * 評論統計
 */
export interface CommentStats {
  total: number;
  open: number;
  resolved: number;
  archived: number;
  byUser: Record<number, number>;
}

/**
 * 評論過濾選項
 */
export interface CommentFilterOptions {
  status?: CommentStatus;
  userId?: number;
  versionId?: string;
  sectionId?: string;
  includeReplies?: boolean;
}

/**
 * 評論系統類
 */
export class CommentSystem {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 創建評論
   *
   * @param proposalId - 提案ID
   * @param userId - 評論者ID
   * @param content - 評論內容
   * @param options - 創建選項
   * @returns 創建的評論
   */
  async createComment(
    proposalId: number,
    userId: number,
    content: string,
    options: CreateCommentOptions = {}
  ): Promise<ProposalComment> {
    // 1. 驗證提案是否存在
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    // 2. 處理@提及
    const mentions = options.mentions || this.extractMentions(content);

    // 3. 創建評論
    const comment = await this.prisma.proposalComment.create({
      data: {
        proposal_id: proposalId,
        version_id: options.versionId,
        parent_id: options.parentId,
        content,
        content_type: options.contentType || CommentType.TEXT,
        section_id: options.sectionId,
        quote_text: options.quoteText,
        position_start: options.positionStart,
        position_end: options.positionEnd,
        mentions,
        created_by: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    // 4. 發送@提及通知
    if (mentions.length > 0) {
      await this.sendMentionNotifications(comment.id, mentions);
    }

    return comment;
  }

  /**
   * 回覆評論
   *
   * @param commentId - 父評論ID
   * @param userId - 回覆者ID
   * @param content - 回覆內容
   * @param options - 創建選項
   * @returns 創建的回覆
   */
  async replyToComment(
    commentId: string,
    userId: number,
    content: string,
    options: Omit<CreateCommentOptions, 'parentId'> = {}
  ): Promise<ProposalComment> {
    // 1. 獲取父評論
    const parentComment = await this.prisma.proposalComment.findUnique({
      where: { id: commentId },
    });

    if (!parentComment) {
      throw new Error(`Comment ${commentId} not found`);
    }

    // 2. 創建回覆（繼承父評論的提案ID和版本ID）
    const reply = await this.createComment(
      parentComment.proposal_id,
      userId,
      content,
      {
        ...options,
        parentId: commentId,
        versionId: options.versionId || parentComment.version_id || undefined,
      }
    );

    // 3. 發送回覆通知給父評論的作者
    await this.sendReplyNotification(reply.id, commentId);

    return reply;
  }

  /**
   * 解決評論
   *
   * @param commentId - 評論ID
   * @param userId - 解決者ID
   * @returns 更新後的評論
   */
  async resolveComment(
    commentId: string,
    userId: number
  ): Promise<ProposalComment> {
    return this.prisma.proposalComment.update({
      where: { id: commentId },
      data: {
        status: CommentStatus.RESOLVED,
        resolved_by: userId,
        resolved_at: new Date(),
      },
    });
  }

  /**
   * 重新開啟評論
   *
   * @param commentId - 評論ID
   * @returns 更新後的評論
   */
  async reopenComment(commentId: string): Promise<ProposalComment> {
    return this.prisma.proposalComment.update({
      where: { id: commentId },
      data: {
        status: CommentStatus.OPEN,
        resolved_by: null,
        resolved_at: null,
      },
    });
  }

  /**
   * 歸檔評論
   *
   * @param commentId - 評論ID
   * @returns 更新後的評論
   */
  async archiveComment(commentId: string): Promise<ProposalComment> {
    return this.prisma.proposalComment.update({
      where: { id: commentId },
      data: {
        status: CommentStatus.ARCHIVED,
      },
    });
  }

  /**
   * 更新評論內容
   *
   * @param commentId - 評論ID
   * @param content - 新內容
   * @param userId - 更新者ID
   * @returns 更新後的評論
   */
  async updateComment(
    commentId: string,
    content: string,
    userId: number
  ): Promise<ProposalComment> {
    // 1. 驗證用戶權限（只能更新自己的評論）
    const comment = await this.prisma.proposalComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error(`Comment ${commentId} not found`);
    }

    if (comment.created_by !== userId) {
      throw new Error('Unauthorized: Can only update own comments');
    }

    // 2. 更新評論
    const mentions = this.extractMentions(content);

    return this.prisma.proposalComment.update({
      where: { id: commentId },
      data: {
        content,
        mentions,
        updated_at: new Date(),
      },
    });
  }

  /**
   * 刪除評論
   *
   * @param commentId - 評論ID
   * @param userId - 刪除者ID
   * @returns 刪除結果
   */
  async deleteComment(commentId: string, userId: number): Promise<boolean> {
    // 1. 驗證用戶權限
    const comment = await this.prisma.proposalComment.findUnique({
      where: { id: commentId },
      include: { replies: true },
    });

    if (!comment) {
      throw new Error(`Comment ${commentId} not found`);
    }

    if (comment.created_by !== userId) {
      throw new Error('Unauthorized: Can only delete own comments');
    }

    // 2. 如果有回覆，不允許刪除（改為歸檔）
    if (comment.replies.length > 0) {
      await this.archiveComment(commentId);
      return true;
    }

    // 3. 刪除評論
    await this.prisma.proposalComment.delete({
      where: { id: commentId },
    });

    return true;
  }

  /**
   * 獲取提案的評論列表
   *
   * @param proposalId - 提案ID
   * @param options - 過濾選項
   * @returns 評論列表
   */
  async getComments(
    proposalId: number,
    options: CommentFilterOptions = {}
  ): Promise<CommentNode[]> {
    const where: any = {
      proposal_id: proposalId,
      parent_id: null, // 只獲取頂層評論
    };

    if (options.status) {
      where.status = options.status;
    }

    if (options.userId) {
      where.created_by = options.userId;
    }

    if (options.versionId) {
      where.version_id = options.versionId;
    }

    if (options.sectionId) {
      where.section_id = options.sectionId;
    }

    const comments = await this.prisma.proposalComment.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        replies: options.includeReplies !== false ? {
          include: {
            creator: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
        } : false,
      },
      orderBy: { created_at: 'desc' },
    });

    // 轉換為樹狀結構
    return comments.map((comment) => ({
      ...comment,
      creatorName: `${comment.creator.first_name} ${comment.creator.last_name}`,
      replies: options.includeReplies !== false
        ? (comment.replies as any[]).map((reply: any) => ({
            ...reply,
            creatorName: `${reply.creator.first_name} ${reply.creator.last_name}`,
          }))
        : undefined,
    }));
  }

  /**
   * 獲取評論線程（包含所有回覆）
   *
   * @param commentId - 評論ID
   * @returns 評論線程
   */
  async getCommentThread(commentId: string): Promise<CommentNode | null> {
    const comment = await this.prisma.proposalComment.findUnique({
      where: { id: commentId },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        replies: {
          include: {
            creator: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
            replies: true, // 支援多層回覆
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!comment) {
      return null;
    }

    return {
      ...comment,
      creatorName: `${comment.creator.first_name} ${comment.creator.last_name}`,
      replies: (comment.replies as any[]).map((reply: any) => ({
        ...reply,
        creatorName: `${reply.creator.first_name} ${reply.creator.last_name}`,
      })),
    };
  }

  /**
   * 獲取評論統計
   *
   * @param proposalId - 提案ID
   * @returns 統計信息
   */
  async getCommentStats(proposalId: number): Promise<CommentStats> {
    const comments = await this.prisma.proposalComment.findMany({
      where: { proposal_id: proposalId },
      select: {
        status: true,
        created_by: true,
      },
    });

    const stats: CommentStats = {
      total: comments.length,
      open: 0,
      resolved: 0,
      archived: 0,
      byUser: {},
    };

    for (const comment of comments) {
      // 按狀態統計
      if (comment.status === CommentStatus.OPEN) stats.open++;
      else if (comment.status === CommentStatus.RESOLVED) stats.resolved++;
      else if (comment.status === CommentStatus.ARCHIVED) stats.archived++;

      // 按用戶統計
      if (!stats.byUser[comment.created_by]) {
        stats.byUser[comment.created_by] = 0;
      }
      stats.byUser[comment.created_by]++;
    }

    return stats;
  }

  /**
   * 批量解決評論
   *
   * @param commentIds - 評論ID數組
   * @param userId - 解決者ID
   * @returns 更新數量
   */
  async resolveMultipleComments(
    commentIds: string[],
    userId: number
  ): Promise<number> {
    const result = await this.prisma.proposalComment.updateMany({
      where: {
        id: { in: commentIds },
      },
      data: {
        status: CommentStatus.RESOLVED,
        resolved_by: userId,
        resolved_at: new Date(),
      },
    });

    return result.count;
  }

  /**
   * 從內容中提取@提及
   *
   * @param content - 評論內容
   * @returns 用戶ID數組
   */
  private extractMentions(content: string): number[] {
    // 匹配 @userId 或 @[userId] 格式
    const mentionPattern = /@\[?(\d+)\]?/g;
    const mentions: number[] = [];
    let match;

    while ((match = mentionPattern.exec(content)) !== null) {
      const userId = parseInt(match[1], 10);
      if (!mentions.includes(userId)) {
        mentions.push(userId);
      }
    }

    return mentions;
  }

  /**
   * 發送提及通知
   *
   * @param commentId - 評論ID
   * @param userIds - 被提及的用戶ID數組
   */
  private async sendMentionNotifications(
    commentId: string,
    userIds: number[]
  ): Promise<void> {
    try {
      // 動態導入通知引擎（避免循環依賴）
      const { NotificationEngine } = await import('@/lib/notification/engine');
      const { NotificationType, NotificationCategory, NotificationPriority, NotificationChannel } = await import('@prisma/client');

      const notificationEngine = new NotificationEngine(this.prisma);

      // 獲取評論詳細信息
      const comment = await this.prisma.proposalComment.findUnique({
        where: { id: commentId },
        include: {
          proposal: true,
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      });

      if (!comment) return;

      const creatorName = `${comment.creator.first_name || ''} ${comment.creator.last_name || ''}`.trim() || '某用戶';

      // 為每個被提及的用戶發送通知
      for (const userId of userIds) {
        // 不給自己發送通知
        if (userId === comment.created_by) continue;

        await notificationEngine.createNotification({
          recipientId: userId,
          type: NotificationType.COMMENT_MENTION,
          category: NotificationCategory.COMMENT,
          priority: NotificationPriority.NORMAL,
          title: `${creatorName} 在評論中提到了您`,
          message: `在提案「${comment.proposal.title}」的評論中：${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}`,
          data: {
            commentId: comment.id,
            proposalId: comment.proposal_id,
            createdBy: comment.created_by,
            creatorName
          },
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          actionUrl: `/dashboard/proposals/${comment.proposal_id}?commentId=${comment.id}`,
          actionText: '查看評論'
        });
      }
    } catch (error) {
      console.error('Failed to send mention notifications:', error);
      // 不拋出錯誤，避免影響評論創建流程
    }
  }

  /**
   * 發送評論回覆通知
   *
   * @param commentId - 新評論ID
   * @param parentCommentId - 父評論ID
   */
  private async sendReplyNotification(
    commentId: string,
    parentCommentId: string
  ): Promise<void> {
    try {
      const { NotificationEngine } = await import('@/lib/notification/engine');
      const { NotificationType, NotificationCategory, NotificationPriority, NotificationChannel } = await import('@prisma/client');

      const notificationEngine = new NotificationEngine(this.prisma);

      // 獲取評論和父評論信息
      const comment = await this.prisma.proposalComment.findUnique({
        where: { id: commentId },
        include: {
          proposal: true,
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      });

      const parentComment = await this.prisma.proposalComment.findUnique({
        where: { id: parentCommentId },
        include: {
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      });

      if (!comment || !parentComment) return;

      // 不給自己發送通知
      if (comment.created_by === parentComment.created_by) return;

      const replyCreatorName = `${comment.creator.first_name || ''} ${comment.creator.last_name || ''}`.trim() || '某用戶';

      // 通知父評論的作者
      await notificationEngine.createNotification({
        recipientId: parentComment.created_by,
        type: NotificationType.COMMENT_REPLY,
        category: NotificationCategory.COMMENT,
        priority: NotificationPriority.NORMAL,
        title: `${replyCreatorName} 回覆了您的評論`,
        message: `在提案「${comment.proposal.title}」中：${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}`,
        data: {
          commentId: comment.id,
          parentCommentId,
          proposalId: comment.proposal_id,
          createdBy: comment.created_by
        },
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        actionUrl: `/dashboard/proposals/${comment.proposal_id}?commentId=${comment.id}`,
        actionText: '查看回覆'
      });
    } catch (error) {
      console.error('Failed to send reply notification:', error);
    }
  }
}

/**
 * 工廠函數：創建評論系統實例
 */
export function createCommentSystem(prisma: PrismaClient): CommentSystem {
  return new CommentSystem(prisma);
}
