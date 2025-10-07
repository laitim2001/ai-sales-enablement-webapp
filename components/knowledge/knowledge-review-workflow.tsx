/**
 * @fileoverview ================================================================AI銷售賦能平台 - 知識庫內容審核工作流UI組件================================================================【組件功能】為知識庫文檔提供企業級內容審核工作流介面，包括審核隊列管理、批准/拒絕操作、審核意見系統和版本對比功能。【主要職責】• 審核隊列 - 待審核文檔列表、優先級排序、狀態篩選• 審核操作 - 批准/拒絕決定、審核意見提交、修改建議• 版本對比 - 並排對比修改前後、高亮差異• 工作流狀態 - 草稿→待審核→已批准/已拒絕流程追蹤• 審核歷史 - 完整審核記錄、審核者信息、時間線展示• 通知整合 - 審核結果通知、任務提醒@created 2025-10-07@sprint Sprint 6 - 知識庫管理UI完善
 * @module components/knowledge/knowledge-review-workflow
 * @description
 * ================================================================AI銷售賦能平台 - 知識庫內容審核工作流UI組件================================================================【組件功能】為知識庫文檔提供企業級內容審核工作流介面，包括審核隊列管理、批准/拒絕操作、審核意見系統和版本對比功能。【主要職責】• 審核隊列 - 待審核文檔列表、優先級排序、狀態篩選• 審核操作 - 批准/拒絕決定、審核意見提交、修改建議• 版本對比 - 並排對比修改前後、高亮差異• 工作流狀態 - 草稿→待審核→已批准/已拒絕流程追蹤• 審核歷史 - 完整審核記錄、審核者信息、時間線展示• 通知整合 - 審核結果通知、任務提醒@created 2025-10-07@sprint Sprint 6 - 知識庫管理UI完善
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
  FunnelIcon,
  EyeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import {
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { cn } from '@/lib/utils'

/**
 * 審核狀態枚舉
 */
enum ReviewStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISING = 'REVISING',
}

/**
 * 審核決定枚舉
 */
enum ReviewDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_CHANGES = 'REQUEST_CHANGES',
}

/**
 * 待審核文檔數據結構
 */
interface PendingReviewDocument {
  id: number
  title: string
  category: string
  status: ReviewStatus
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  submittedAt: string
  submittedBy: {
    id: number
    name: string
    avatar?: string
  }
  reviewDeadline?: string
  changesSummary?: string
  tags: Array<{
    id: number
    name: string
    color: string
  }>
}

/**
 * 審核歷史記錄
 */
interface ReviewHistoryItem {
  id: string
  reviewerId: number
  reviewerName: string
  decision: ReviewDecision
  comments: string
  reviewedAt: string
  changes?: string[]
}

/**
 * 審核詳情
 */
interface ReviewDetail {
  document: PendingReviewDocument
  currentVersion: string
  previousVersion?: string
  history: ReviewHistoryItem[]
  assignedReviewers: Array<{
    id: number
    name: string
    status: 'PENDING' | 'COMPLETED'
  }>
}

/**
 * 組件Props
 */
interface KnowledgeReviewWorkflowProps {
  /** 當前用戶ID */
  currentUserId?: number
  /** 是否顯示所有審核（管理員視圖） */
  showAllReviews?: boolean
  /** 自定義類名 */
  className?: string
}

// 分類標籤映射
const categoryLabels: Record<string, string> = {
  GENERAL: '一般',
  PRODUCT_SPEC: '產品規格',
  SALES_MATERIAL: '銷售資料',
  TECHNICAL_DOC: '技術文檔',
  LEGAL_DOC: '法律文件',
  TRAINING: '培訓資料',
  FAQ: '常見問題',
  CASE_STUDY: '案例研究',
  WHITE_PAPER: '白皮書',
  PRESENTATION: '簡報',
  COMPETITOR: '競爭分析',
  INDUSTRY_NEWS: '行業新聞',
  INTERNAL: '內部文檔',
}

// 優先級標籤和顏色
const priorityConfig = {
  LOW: { label: '低', color: 'text-gray-600 bg-gray-100' },
  MEDIUM: { label: '中', color: 'text-blue-600 bg-blue-100' },
  HIGH: { label: '高', color: 'text-orange-600 bg-orange-100' },
  URGENT: { label: '緊急', color: 'text-red-600 bg-red-100' },
}

// 審核狀態標籤和顏色
const reviewStatusConfig = {
  DRAFT: { label: '草稿', color: 'text-gray-600 bg-gray-100' },
  PENDING_REVIEW: { label: '待審核', color: 'text-yellow-700 bg-yellow-100' },
  UNDER_REVIEW: { label: '審核中', color: 'text-blue-700 bg-blue-100' },
  APPROVED: { label: '已批准', color: 'text-green-700 bg-green-100' },
  REJECTED: { label: '已拒絕', color: 'text-red-700 bg-red-100' },
  REVISING: { label: '修訂中', color: 'text-purple-700 bg-purple-100' },
}

/**
 * 知識庫審核工作流主組件
 */
export const KnowledgeReviewWorkflow: React.FC<KnowledgeReviewWorkflowProps> = ({
  currentUserId,
  showAllReviews = false,
  className,
}) => {
  // === 狀態管理 ===
  const [pendingDocuments, setPendingDocuments] = useState<PendingReviewDocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null)
  const [reviewDetail, setReviewDetail] = useState<ReviewDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | 'ALL'>('ALL')
  const [filterPriority, setFilterPriority] = useState<string>('ALL')
  const [reviewComments, setReviewComments] = useState('')
  const [showVersionComparison, setShowVersionComparison] = useState(false)

  /**
   * 載入待審核文檔列表
   */
  const loadPendingDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'ALL') {
        params.append('status', filterStatus)
      }
      if (filterPriority !== 'ALL') {
        params.append('priority', filterPriority)
      }
      if (!showAllReviews && currentUserId) {
        params.append('reviewerId', currentUserId.toString())
      }

      const response = await fetch(`/api/knowledge-base/reviews?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPendingDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Failed to load pending documents:', error)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterPriority, showAllReviews, currentUserId])

  /**
   * 載入審核詳情
   */
  const loadReviewDetail = useCallback(async (documentId: number) => {
    setReviewLoading(true)
    try {
      const response = await fetch(`/api/knowledge-base/${documentId}/review-detail`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReviewDetail(data)
      }
    } catch (error) {
      console.error('Failed to load review detail:', error)
    } finally {
      setReviewLoading(false)
    }
  }, [])

  /**
   * 初始化載入
   */
  useEffect(() => {
    loadPendingDocuments()
  }, [loadPendingDocuments])

  /**
   * 選擇文檔時載入詳情
   */
  useEffect(() => {
    if (selectedDocument) {
      loadReviewDetail(selectedDocument)
    } else {
      setReviewDetail(null)
    }
  }, [selectedDocument, loadReviewDetail])

  /**
   * 提交審核決定
   */
  const handleSubmitReview = useCallback(
    async (decision: ReviewDecision) => {
      if (!selectedDocument || !reviewComments.trim()) {
        alert('請填寫審核意見')
        return
      }

      try {
        const response = await fetch(`/api/knowledge-base/${selectedDocument}/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
          },
          body: JSON.stringify({
            decision,
            comments: reviewComments,
            reviewerId: currentUserId,
          }),
        })

        if (response.ok) {
          alert('審核已提交')
          setReviewComments('')
          setSelectedDocument(null)
          await loadPendingDocuments()
        } else {
          throw new Error('提交審核失敗')
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : '提交審核失敗')
      }
    },
    [selectedDocument, reviewComments, currentUserId, loadPendingDocuments]
  )

  /**
   * 檢查是否逾期
   */
  const isOverdue = (deadline?: string) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6', className)}>
      {/* 左側：審核隊列 */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">審核隊列</h3>
            <Button variant="ghost" size="sm" onClick={loadPendingDocuments}>
              <ArrowPathIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* 篩選器 */}
          <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                狀態
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ReviewStatus | 'ALL')}
              >
                <option value="ALL">全部狀態</option>
                <option value="PENDING_REVIEW">待審核</option>
                <option value="UNDER_REVIEW">審核中</option>
                <option value="APPROVED">已批准</option>
                <option value="REJECTED">已拒絕</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                優先級
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="ALL">全部優先級</option>
                <option value="URGENT">緊急</option>
                <option value="HIGH">高</option>
                <option value="MEDIUM">中</option>
                <option value="LOW">低</option>
              </select>
            </div>
          </div>

          {/* 文檔列表 */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-xs text-gray-500">載入中...</p>
              </div>
            ) : pendingDocuments.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">沒有待審核文檔</p>
              </div>
            ) : (
              pendingDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedDocument === doc.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                  onClick={() => setSelectedDocument(doc.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {categoryLabels[doc.category]}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ml-2',
                        priorityConfig[doc.priority].color
                      )}
                    >
                      {priorityConfig[doc.priority].label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3" />
                      {doc.submittedBy.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {formatDistanceToNow(new Date(doc.submittedAt), {
                        addSuffix: true,
                        locale: zhTW,
                      })}
                    </span>
                  </div>

                  {doc.reviewDeadline && (
                    <div
                      className={cn(
                        'flex items-center gap-1 text-xs',
                        isOverdue(doc.reviewDeadline)
                          ? 'text-red-600'
                          : 'text-gray-500'
                      )}
                    >
                      <ExclamationTriangleIcon className="w-3 h-3" />
                      截止: {new Date(doc.reviewDeadline).toLocaleDateString('zh-TW')}
                      {isOverdue(doc.reviewDeadline) && ' (已逾期)'}
                    </div>
                  )}

                  <div
                    className={cn(
                      'mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                      reviewStatusConfig[doc.status].color
                    )}
                  >
                    {reviewStatusConfig[doc.status].label}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 右側：審核詳情 */}
      <div className="lg:col-span-2 space-y-4">
        {!selectedDocument ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <DocumentIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">選擇文檔進行審核</h3>
            <p className="mt-2 text-sm text-gray-500">
              從左側列表選擇待審核的文檔以查看詳情並提交審核
            </p>
          </div>
        ) : reviewLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">載入審核詳情...</p>
          </div>
        ) : reviewDetail ? (
          <>
            {/* 文檔資訊 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {reviewDetail.document.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{categoryLabels[reviewDetail.document.category]}</span>
                    <span>•</span>
                    <span>
                      提交者: {reviewDetail.document.submittedBy.name}
                    </span>
                    <span>•</span>
                    <span>
                      提交時間:{' '}
                      {new Date(reviewDetail.document.submittedAt).toLocaleDateString(
                        'zh-TW'
                      )}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVersionComparison(!showVersionComparison)}
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  {showVersionComparison ? '隱藏' : '查看'}版本對比
                </Button>
              </div>

              {reviewDetail.document.changesSummary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    變更摘要
                  </h4>
                  <p className="text-sm text-blue-700">
                    {reviewDetail.document.changesSummary}
                  </p>
                </div>
              )}

              {/* 指派審核者 */}
              {reviewDetail.assignedReviewers.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    指派審核者
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {reviewDetail.assignedReviewers.map((reviewer) => (
                      <span
                        key={reviewer.id}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                          reviewer.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {reviewer.status === 'COMPLETED' ? (
                          <CheckCircleIcon className="w-3 h-3" />
                        ) : (
                          <ClockIcon className="w-3 h-3" />
                        )}
                        {reviewer.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 版本對比 */}
            {showVersionComparison && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  版本對比
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      當前版本
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {reviewDetail.currentVersion}
                      </pre>
                    </div>
                  </div>
                  {reviewDetail.previousVersion && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        上一版本
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">
                          {reviewDetail.previousVersion}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 審核歷史 */}
            {reviewDetail.history.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  審核歷史
                </h3>
                <div className="space-y-4">
                  {reviewDetail.history.map((item) => (
                    <div key={item.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {item.reviewerName}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            item.decision === ReviewDecision.APPROVE
                              ? 'bg-green-100 text-green-700'
                              : item.decision === ReviewDecision.REJECT
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          )}
                        >
                          {item.decision === ReviewDecision.APPROVE ? (
                            <>
                              <CheckIcon className="w-3 h-3" />
                              批准
                            </>
                          ) : item.decision === ReviewDecision.REJECT ? (
                            <>
                              <XMarkIcon className="w-3 h-3" />
                              拒絕
                            </>
                          ) : (
                            <>
                              <PencilIcon className="w-3 h-3" />
                              要求修改
                            </>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(item.reviewedAt), {
                            addSuffix: true,
                            locale: zhTW,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{item.comments}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 審核表單 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                提交審核意見
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  審核意見 <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[120px]"
                  placeholder="請詳細說明您的審核意見..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleSubmitReview(ReviewDecision.APPROVE)}
                  disabled={!reviewComments.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  批准
                </Button>

                <Button
                  onClick={() => handleSubmitReview(ReviewDecision.REQUEST_CHANGES)}
                  disabled={!reviewComments.trim()}
                  variant="outline"
                  className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  要求修改
                </Button>

                <Button
                  onClick={() => handleSubmitReview(ReviewDecision.REJECT)}
                  disabled={!reviewComments.trim()}
                  variant="outline"
                  className="border-red-600 text-red-700 hover:bg-red-50"
                >
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  拒絕
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedDocument(null)
                    setReviewComments('')
                  }}
                >
                  取消
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default KnowledgeReviewWorkflow
