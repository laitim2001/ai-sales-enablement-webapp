/**
 * @fileoverview ================================================================AI銷售賦能平台 - 知識庫推薦系統UI組件================================================================【組件功能】為知識庫提供基於AI的個性化內容推薦介面，包括相關文檔推薦、熱門內容推薦、個性化推薦和推薦反饋機制。【主要職責】• 相關推薦 - 基於當前文檔的相似內容推薦• 熱門推薦 - 基於使用頻率和評分的熱門文檔• 個性化推薦 - 基於用戶行為和偏好的推薦• 推薦理由 - 清晰說明推薦原因• 反饋機制 - 收集用戶對推薦的反饋（喜歡/不喜歡）• 協同過濾 - 基於相似用戶的推薦• 內容相似度 - 基於文檔內容的推薦@created 2025-10-07@sprint Sprint 6 - 知識庫管理UI完善
 * @module components/knowledge/knowledge-recommendation-widget
 * @description
 * ================================================================AI銷售賦能平台 - 知識庫推薦系統UI組件================================================================【組件功能】為知識庫提供基於AI的個性化內容推薦介面，包括相關文檔推薦、熱門內容推薦、個性化推薦和推薦反饋機制。【主要職責】• 相關推薦 - 基於當前文檔的相似內容推薦• 熱門推薦 - 基於使用頻率和評分的熱門文檔• 個性化推薦 - 基於用戶行為和偏好的推薦• 推薦理由 - 清晰說明推薦原因• 反饋機制 - 收集用戶對推薦的反饋（喜歡/不喜歡）• 協同過濾 - 基於相似用戶的推薦• 內容相似度 - 基於文檔內容的推薦@created 2025-10-07@sprint Sprint 6 - 知識庫管理UI完善
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DocumentIcon,
  SparklesIcon,
  FireIcon,
  HeartIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ArrowPathIcon,
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import Link from 'next/link'

/**
 * 推薦策略枚舉
 */
enum RecommendationStrategy {
  COLLABORATIVE = 'collaborative', // 協同過濾
  CONTENT_BASED = 'content_based', // 基於內容
  HYBRID = 'hybrid', // 混合策略
  POPULARITY = 'popularity', // 基於熱度
  RELATED = 'related', // 相關內容
}

/**
 * 推薦項目數據結構
 */
interface RecommendationItem {
  id: number
  title: string
  category: string
  excerpt?: string
  viewCount: number
  likeCount: number
  tags: Array<{
    id: number
    name: string
    color: string
  }>
  updatedAt: string
  reason?: string // 推薦理由
  confidence: number // 推薦置信度 (0-1)
  strategy: RecommendationStrategy
}

/**
 * 推薦響應
 */
interface RecommendationResponse {
  items: RecommendationItem[]
  totalCount: number
  strategy: RecommendationStrategy
  confidence: number
}

/**
 * 組件Props
 */
interface KnowledgeRecommendationWidgetProps {
  /** 當前用戶ID */
  currentUserId?: number
  /** 當前文檔ID（用於相關推薦） */
  currentDocumentId?: number
  /** 推薦策略 */
  strategy?: RecommendationStrategy
  /** 顯示數量 */
  limit?: number
  /** 標題 */
  title?: string
  /** 是否顯示反饋按鈕 */
  showFeedback?: boolean
  /** 是否緊湊模式 */
  compact?: boolean
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

// 推薦策略配置
const strategyConfig = {
  [RecommendationStrategy.COLLABORATIVE]: {
    icon: UserGroupIcon,
    label: '協同推薦',
    description: '基於相似用戶的推薦',
    color: 'text-blue-600',
  },
  [RecommendationStrategy.CONTENT_BASED]: {
    icon: DocumentIcon,
    label: '內容推薦',
    description: '基於文檔相似度',
    color: 'text-green-600',
  },
  [RecommendationStrategy.HYBRID]: {
    icon: SparklesIcon,
    label: 'AI智能推薦',
    description: '混合多種策略',
    color: 'text-purple-600',
  },
  [RecommendationStrategy.POPULARITY]: {
    icon: FireIcon,
    label: '熱門推薦',
    description: '最受歡迎的內容',
    color: 'text-orange-600',
  },
  [RecommendationStrategy.RELATED]: {
    icon: LightBulbIcon,
    label: '相關推薦',
    description: '相關的文檔內容',
    color: 'text-yellow-600',
  },
}

/**
 * 知識庫推薦組件
 */
export const KnowledgeRecommendationWidget: React.FC<
  KnowledgeRecommendationWidgetProps
> = ({
  currentUserId,
  currentDocumentId,
  strategy = RecommendationStrategy.HYBRID,
  limit = 5,
  title,
  showFeedback = true,
  compact = false,
  className,
}) => {
  // === 狀態管理 ===
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set())
  const [dislikedItems, setDislikedItems] = useState<Set<number>>(new Set())

  /**
   * 載入推薦內容
   */
  const loadRecommendations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append('limit', limit.toString())
      params.append('contentType', 'KNOWLEDGE_BASE')
      params.append('strategy', strategy)

      if (currentDocumentId) {
        params.append('excludeIds', currentDocumentId.toString())
        params.append('relatedTo', currentDocumentId.toString())
      }

      const response = await fetch(`/api/recommendations/content?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.data?.items || [])
      } else {
        throw new Error('Failed to load recommendations')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入推薦失敗')
    } finally {
      setLoading(false)
    }
  }, [limit, strategy, currentDocumentId])

  /**
   * 提交推薦反饋
   */
  const submitFeedback = useCallback(
    async (itemId: number, feedback: 'like' | 'dislike') => {
      try {
        await fetch('/api/recommendations/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
          },
          body: JSON.stringify({
            itemId,
            itemType: 'KNOWLEDGE_BASE',
            feedback,
            userId: currentUserId,
          }),
        })

        // 更新本地狀態
        if (feedback === 'like') {
          setLikedItems((prev) => new Set(prev).add(itemId))
          setDislikedItems((prev) => {
            const newSet = new Set(prev)
            newSet.delete(itemId)
            return newSet
          })
        } else {
          setDislikedItems((prev) => new Set(prev).add(itemId))
          setLikedItems((prev) => {
            const newSet = new Set(prev)
            newSet.delete(itemId)
            return newSet
          })
        }
      } catch (error) {
        console.error('Failed to submit feedback:', error)
      }
    },
    [currentUserId]
  )

  /**
   * 初始化載入
   */
  useEffect(() => {
    loadRecommendations()
  }, [loadRecommendations])

  /**
   * 獲取推薦理由文本
   */
  const getReasonText = (item: RecommendationItem): string => {
    if (item.reason) return item.reason

    switch (item.strategy) {
      case RecommendationStrategy.COLLABORATIVE:
        return '相似用戶也查看了此內容'
      case RecommendationStrategy.CONTENT_BASED:
        return '內容與您的興趣相關'
      case RecommendationStrategy.HYBRID:
        return 'AI智能推薦'
      case RecommendationStrategy.POPULARITY:
        return '最受歡迎的內容'
      case RecommendationStrategy.RELATED:
        return '與當前文檔相關'
      default:
        return '推薦給您'
    }
  }

  /**
   * 渲染置信度指示器
   */
  const renderConfidenceIndicator = (confidence: number) => {
    const percentage = Math.round(confidence * 100)
    return (
      <div className="flex items-center gap-1">
        <div className="w-12 bg-gray-200 rounded-full h-1.5">
          <div
            className={cn(
              'h-1.5 rounded-full',
              confidence >= 0.8
                ? 'bg-green-500'
                : confidence >= 0.6
                ? 'bg-blue-500'
                : 'bg-yellow-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{percentage}%</span>
      </div>
    )
  }

  const StrategyIcon = strategyConfig[strategy].icon

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* 標題欄 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StrategyIcon
              className={cn('w-5 h-5', strategyConfig[strategy].color)}
            />
            <h3 className="text-lg font-semibold text-gray-900">
              {title || strategyConfig[strategy].label}
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={loadRecommendations}>
            <ArrowPathIcon className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {strategyConfig[strategy].description}
        </p>
      </div>

      {/* 推薦列表 */}
      <div className={cn('divide-y divide-gray-200', compact ? 'p-2' : 'p-4')}>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-xs text-gray-500">載入推薦...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="ghost" size="sm" onClick={loadRecommendations} className="mt-2">
              重試
            </Button>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8">
            <SparklesIcon className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">暫無推薦內容</p>
          </div>
        ) : (
          recommendations.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'transition-colors hover:bg-gray-50',
                compact ? 'p-2' : 'p-3',
                index > 0 && 'pt-3'
              )}
            >
              <div className="flex items-start gap-3">
                {/* 序號 */}
                <div
                  className={cn(
                    'flex-shrink-0 rounded-full flex items-center justify-center font-semibold',
                    compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm',
                    index < 3
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {index + 1}
                </div>

                {/* 內容 */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/knowledge/${item.id}`}
                    className="block group"
                  >
                    <h4
                      className={cn(
                        'font-medium text-gray-900 group-hover:text-primary truncate',
                        compact ? 'text-sm' : 'text-base'
                      )}
                    >
                      {item.title}
                    </h4>
                  </Link>

                  {!compact && item.excerpt && (
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                      {item.excerpt}
                    </p>
                  )}

                  {/* 元數據 */}
                  <div
                    className={cn(
                      'flex items-center gap-3 text-gray-500',
                      compact ? 'text-xs mt-1' : 'text-xs mt-2'
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      <EyeIcon className="w-3 h-3" />
                      {item.viewCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <HeartIcon className="w-3 h-3" />
                      {item.likeCount}
                    </span>
                    {!compact && (
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {formatDistanceToNow(new Date(item.updatedAt), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </span>
                    )}
                  </div>

                  {/* 標籤 */}
                  {!compact && item.tags && item.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{item.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 推薦理由和置信度 */}
                  {!compact && (
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <SparklesIcon className="w-3 h-3" />
                        <span>{getReasonText(item)}</span>
                      </div>
                      {renderConfidenceIndicator(item.confidence)}
                    </div>
                  )}

                  {/* 反饋按鈕 */}
                  {showFeedback && !compact && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => submitFeedback(item.id, 'like')}
                        className={cn(
                          'h-7 px-2',
                          likedItems.has(item.id) && 'text-green-600 bg-green-50'
                        )}
                      >
                        <HandThumbUpIcon className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => submitFeedback(item.id, 'dislike')}
                        className={cn(
                          'h-7 px-2',
                          dislikedItems.has(item.id) && 'text-red-600 bg-red-50'
                        )}
                      >
                        <HandThumbDownIcon className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 查看更多 */}
      {!loading && recommendations.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <Link href="/dashboard/knowledge/recommendations">
            <Button variant="outline" size="sm" className="w-full">
              查看更多推薦
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default KnowledgeRecommendationWidget
