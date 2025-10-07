/**
 * @fileoverview ================================================================AI銷售賦能平台 - 智能搜索建議組件================================================================【組件功能】提供實時的智能搜索建議，包括歷史搜索、熱門搜索、相關搜索和自動完成功能。【主要特性】• 實時建議 - 輸入時即時顯示建議• 多來源整合 - 歷史/熱門/相關搜索• 鍵盤導航 - 上下鍵選擇，Enter確認• 高亮匹配 - 匹配部分高亮顯示• 智能排序 - 根據相關性和時效性排序@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12 - Advanced Search Phase 3
 * @module components/knowledge/search-suggestions
 * @description
 * ================================================================AI銷售賦能平台 - 智能搜索建議組件================================================================【組件功能】提供實時的智能搜索建議，包括歷史搜索、熱門搜索、相關搜索和自動完成功能。【主要特性】• 實時建議 - 輸入時即時顯示建議• 多來源整合 - 歷史/熱門/相關搜索• 鍵盤導航 - 上下鍵選擇，Enter確認• 高亮匹配 - 匹配部分高亮顯示• 智能排序 - 根據相關性和時效性排序@author Claude Code@date 2025-10-03@sprint Sprint 6 Week 12 - Advanced Search Phase 3
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ClockIcon,
  FireIcon,
  MagnifyingGlassIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { SearchHistoryManager, SearchSuggestion } from '@/lib/knowledge/search-history-manager';

/**
 * 組件屬性
 */
interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  onClose: () => void;
  isOpen: boolean;
  maxSuggestions?: number;
}

/**
 * 智能搜索建議組件
 */
export function SearchSuggestions({
  query,
  onSelect,
  onClose,
  isOpen,
  maxSuggestions = 8
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * 加載建議（節流）
   */
  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      const results = SearchHistoryManager.getSuggestions(query, maxSuggestions);
      setSuggestions(results);
      setSelectedIndex(-1);
    }, 200); // 200ms節流

    return () => clearTimeout(timer);
  }, [query, maxSuggestions]);

  /**
   * 鍵盤事件處理
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            onSelect(suggestions[selectedIndex].text);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, suggestions, selectedIndex, onSelect, onClose]);

  /**
   * 點擊外部關閉
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  /**
   * 高亮匹配文本
   */
  const highlightMatch = (text: string, query: string): JSX.Element => {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
      return <span>{text}</span>;
    }

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
      <span>
        {before}
        <span className="font-semibold text-indigo-600">{match}</span>
        {after}
      </span>
    );
  };

  /**
   * 獲取建議類型圖標
   */
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history':
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
      case 'popular':
        return <FireIcon className="h-4 w-4 text-orange-500" />;
      case 'related':
        return <SparklesIcon className="h-4 w-4 text-purple-500" />;
      case 'autocomplete':
        return <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />;
      default:
        return <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  /**
   * 獲取建議類型標籤
   */
  const getSuggestionLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history':
        return '歷史搜索';
      case 'popular':
        return '熱門搜索';
      case 'related':
        return '相關搜索';
      case 'autocomplete':
        return '自動完成';
      default:
        return '';
    }
  };

  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto"
    >
      <ul className="py-2">
        {suggestions.map((suggestion, index) => (
          <li
            key={`${suggestion.type}-${suggestion.text}-${index}`}
            className={`px-4 py-2.5 cursor-pointer transition-colors ${
              index === selectedIndex
                ? 'bg-indigo-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelect(suggestion.text)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex items-center gap-3">
              {/* 類型圖標 */}
              <div className="flex-shrink-0">
                {getSuggestionIcon(suggestion.type)}
              </div>

              {/* 建議文本 */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900">
                  {highlightMatch(suggestion.text, query)}
                </div>

                {/* 元數據 */}
                {suggestion.metadata && (
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                      {getSuggestionLabel(suggestion.type)}
                    </span>

                    {suggestion.type === 'history' && suggestion.metadata.results_count !== undefined && (
                      <span>{suggestion.metadata.results_count} 個結果</span>
                    )}

                    {suggestion.type === 'popular' && suggestion.metadata.search_count !== undefined && (
                      <span>{suggestion.metadata.search_count} 次搜索</span>
                    )}
                  </div>
                )}
              </div>

              {/* 相關性評分（可選） */}
              {suggestion.score > 50 && (
                <div className="flex-shrink-0">
                  <span className="text-xs text-indigo-600 font-medium">
                    {Math.round(suggestion.score)}%
                  </span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* 提示信息 */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>使用 ↑↓ 鍵選擇，Enter 確認</span>
          <span>Esc 關閉</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 熱門搜索展示組件
 */
interface PopularSearchesProps {
  onSelect: (term: string) => void;
  limit?: number;
}

export function PopularSearches({ onSelect, limit = 10 }: PopularSearchesProps) {
  const [popularTerms, setPopularTerms] = useState<Array<{ term: string; count: number }>>([]);

  useEffect(() => {
    const terms = SearchHistoryManager.getPopularTerms(limit);
    setPopularTerms(terms);
  }, [limit]);

  if (popularTerms.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
        <FireIcon className="h-4 w-4 text-orange-500" />
        熱門搜索
      </h3>
      <div className="flex flex-wrap gap-2">
        {popularTerms.map((term, index) => (
          <button
            key={`${term.term}-${index}`}
            onClick={() => onSelect(term.term)}
            className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors"
          >
            {term.term}
            <span className="ml-1.5 text-xs text-gray-500">({term.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 搜索歷史展示組件
 */
interface RecentSearchesProps {
  onSelect: (query: string) => void;
  onClear?: () => void;
  limit?: number;
}

export function RecentSearches({ onSelect, onClear, limit = 5 }: RecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState<Array<{
    id: string;
    query: string;
    timestamp: number;
    results_count: number;
  }>>([]);

  useEffect(() => {
    const history = SearchHistoryManager.getHistory(limit);
    setRecentSearches(history);
  }, [limit]);

  /**
   * 格式化時間
   */
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes}分鐘前`;
    if (hours < 24) return `${hours}小時前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-TW');
  };

  if (recentSearches.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">尚無搜索歷史</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <ClockIcon className="h-4 w-4 text-gray-500" />
          最近搜索
        </h3>
        {onClear && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            清空歷史
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {recentSearches.map((search) => (
          <li
            key={search.id}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
            onClick={() => onSelect(search.query)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{search.query}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatTime(search.timestamp)} · {search.results_count} 個結果
              </p>
            </div>
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
