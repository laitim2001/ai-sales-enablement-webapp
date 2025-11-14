/**
 * @fileoverview CalendarView組件
📋 功能說明：
- 日曆可視化視圖（日/週/月視圖）
- Microsoft Graph日曆事件展示
- 會議準備包快速關聯
- 事件詳情查看和編輯
- 同步狀態展示
- 篩選和搜索功能
📊 使用場景：
- 日曆管理頁面
- 會議準備流程
- 日程規劃功能
作者：Claude Code
日期：2025-10-05
Sprint：Sprint 7 Phase 3
 * @module components/calendar/CalendarView
 *
 * CalendarView組件
 * 📋 功能說明：
 * - 日曆可視化視圖（日/週/月視圖）
 * - Microsoft Graph日曆事件展示
 * - 會議準備包快速關聯
 * - 事件詳情查看和編輯
 * - 同步狀態展示
 * - 篩選和搜索功能
 * 📊 使用場景：
 * - 日曆管理頁面
 * - 會議準備流程
 * - 日程規劃功能
 * 作者：Claude Code
 * 日期：2025-10-05
 * Sprint：Sprint 7 Phase 3
 *
 * @created 2025-10-08
 * @lastModified 2025-11-14
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Video,
  Plus,
  RefreshCw,
  Filter,
  Search,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon
} from 'lucide-react';
import { CalendarEvent, SyncStatus } from '@/lib/calendar/calendar-sync-service';

/**
 * 視圖類型
 */
export type CalendarViewType = 'day' | 'week' | 'month';

/**
 * CalendarView 組件屬性
 */
export interface CalendarViewProps {
  /** 日曆事件列表 */
  events?: CalendarEvent[];
  /** 是否載入中 */
  loading?: boolean;
  /** 錯誤信息 */
  error?: string;
  /** 同步狀態 */
  syncStatus?: SyncStatus;
  /** 初始視圖類型 */
  defaultViewType?: CalendarViewType;
  /** 初始選中日期 */
  defaultDate?: Date;
  /** 事件點擊回調 */
  onEventClick?: (event: CalendarEvent) => void;
  /** 創建事件回調 */
  onCreateEvent?: (startDateTime: Date) => void;
  /** 關聯準備包回調 */
  onLinkPrepPackage?: (eventId: string) => void;
  /** 同步回調 */
  onSync?: () => void;
  /** 刷新回調 */
  onRefresh?: () => void;
  /** 自定義類名 */
  className?: string;
}

/**
 * CalendarView組件
 *
 * @example
 * ```tsx
 * <CalendarView
 *   events={calendarEvents}
 *   loading={isLoading}
 *   syncStatus={syncStatus}
 *   onEventClick={(event) => showEventDetails(event)}
 *   onLinkPrepPackage={(eventId) => linkPrepPackage(eventId)}
 *   onSync={() => syncCalendar()}
 * />
 * ```
 */
export function CalendarView({
  events = [],
  loading = false,
  error,
  syncStatus,
  defaultViewType = 'week',
  defaultDate = new Date(),
  onEventClick,
  onCreateEvent,
  onLinkPrepPackage,
  onSync,
  onRefresh,
  className = ''
}: CalendarViewProps) {

  // 視圖類型
  const [viewType, setViewType] = useState<CalendarViewType>(defaultViewType);

  // 選中日期
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);

  // 搜索關鍵詞
  const [searchQuery, setSearchQuery] = useState('');

  // 篩選條件
  const [filterOnlineMeetings, setFilterOnlineMeetings] = useState(false);

  // 獲取視圖範圍的開始和結束日期
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    switch (viewType) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        // 獲取週一
        const dayOfWeek = start.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        start.setDate(start.getDate() + diff);
        start.setHours(0, 0, 0, 0);
        // 獲取週日
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate: start, endDate: end };
  }, [selectedDate, viewType]);

  // 篩選事件
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // 時間範圍篩選
    result = result.filter(event => {
      const eventStart = new Date(event.start.dateTime);
      return eventStart >= startDate && eventStart <= endDate;
    });

    // 搜索篩選
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event =>
        event.subject.toLowerCase().includes(query) ||
        event.body?.content?.toLowerCase().includes(query) ||
        event.location?.displayName?.toLowerCase().includes(query)
      );
    }

    // 線上會議篩選
    if (filterOnlineMeetings) {
      result = result.filter(event => event.isOnlineMeeting);
    }

    return result;
  }, [events, startDate, endDate, searchQuery, filterOnlineMeetings]);

  // 導航到上一期間
  const navigatePrevious = useCallback(() => {
    const newDate = new Date(selectedDate);
    switch (viewType) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    setSelectedDate(newDate);
  }, [selectedDate, viewType]);

  // 導航到下一期間
  const navigateNext = useCallback(() => {
    const newDate = new Date(selectedDate);
    switch (viewType) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    setSelectedDate(newDate);
  }, [selectedDate, viewType]);

  // 回到今天
  const navigateToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  // 格式化日期標題
  const dateTitle = useMemo(() => {
    switch (viewType) {
      case 'day':
        return selectedDate.toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
      case 'week':
        return `${startDate.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return selectedDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
    }
  }, [selectedDate, viewType, startDate, endDate]);

  // 錯誤狀態
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-center space-y-4">
          <div className="bg-destructive/10 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">載入日曆時發生錯誤</h3>
            <p className="text-muted-foreground mt-1">{error}</p>
          </div>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              重試
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 載入骨架屏
  if (loading && events.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 工具欄 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* 左側：視圖切換和導航 */}
        <div className="flex items-center gap-2">
          <Tabs value={viewType} onValueChange={(v) => setViewType(v as CalendarViewType)}>
            <TabsList>
              <TabsTrigger value="day">日</TabsTrigger>
              <TabsTrigger value="week">週</TabsTrigger>
              <TabsTrigger value="month">月</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1 ml-4">
            <Button onClick={navigatePrevious} variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button onClick={navigateToday} variant="outline" size="sm">
              今天
            </Button>
            <Button onClick={navigateNext} variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <span className="text-lg font-semibold ml-4">{dateTitle}</span>
        </div>

        {/* 右側：操作按鈕 */}
        <div className="flex items-center gap-2">
          {/* 同步狀態 */}
          {syncStatus && (
            <Badge variant={syncStatus.isSyncing ? 'secondary' : 'outline'}>
              {syncStatus.isSyncing ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  同步中
                </>
              ) : syncStatus.lastSyncAt ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  已同步
                </>
              ) : (
                '未同步'
              )}
            </Badge>
          )}

          {onSync && (
            <Button onClick={onSync} variant="outline" size="sm" disabled={syncStatus?.isSyncing}>
              <RefreshCw className="h-4 w-4 mr-1" />
              同步
            </Button>
          )}

          {onCreateEvent && (
            <Button onClick={() => onCreateEvent(new Date())} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              創建事件
            </Button>
          )}
        </div>
      </div>

      {/* 篩選和搜索 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索事件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md"
          />
        </div>
        <Button
          variant={filterOnlineMeetings ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterOnlineMeetings(!filterOnlineMeetings)}
        >
          <Video className="h-4 w-4 mr-1" />
          線上會議
        </Button>
      </div>

      {/* 事件列表 */}
      {viewType === 'day' && (
        <DayView
          events={filteredEvents}
          date={selectedDate}
          onEventClick={onEventClick}
          onLinkPrepPackage={onLinkPrepPackage}
        />
      )}

      {viewType === 'week' && (
        <WeekView
          events={filteredEvents}
          startDate={startDate}
          endDate={endDate}
          onEventClick={onEventClick}
          onLinkPrepPackage={onLinkPrepPackage}
        />
      )}

      {viewType === 'month' && (
        <MonthView
          events={filteredEvents}
          month={selectedDate}
          onEventClick={onEventClick}
          onLinkPrepPackage={onLinkPrepPackage}
        />
      )}

      {/* 統計信息 */}
      <div className="text-sm text-muted-foreground text-center border-t pt-4">
        <div className="flex items-center justify-center gap-4">
          <span>共 {filteredEvents.length} 個事件</span>
          {syncStatus?.lastSyncAt && (
            <>
              <span>•</span>
              <span>最後同步: {new Date(syncStatus.lastSyncAt).toLocaleString('zh-TW')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 日視圖組件
 */
interface DayViewProps {
  events: CalendarEvent[];
  date: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onLinkPrepPackage?: (eventId: string) => void;
}

function DayView({ events, date, onEventClick, onLinkPrepPackage }: DayViewProps) {
  // 按小時分組事件
  const eventsByHour = useMemo(() => {
    const hours: { [hour: number]: CalendarEvent[] } = {};
    events.forEach(event => {
      const eventStart = new Date(event.start.dateTime);
      const hour = eventStart.getHours();
      if (!hours[hour]) hours[hour] = [];
      hours[hour].push(event);
    });
    return hours;
  }, [events]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="divide-y">
        {Array.from({ length: 24 }, (_, i) => i).map(hour => (
          <div key={hour} className="flex">
            <div className="w-20 p-2 text-sm text-muted-foreground border-r bg-muted/50">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="flex-1 p-2 min-h-[60px]">
              {eventsByHour[hour]?.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={onEventClick}
                  onLinkPrepPackage={onLinkPrepPackage}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 週視圖組件
 */
interface WeekViewProps {
  events: CalendarEvent[];
  startDate: Date;
  endDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onLinkPrepPackage?: (eventId: string) => void;
}

function WeekView({ events, startDate, endDate, onEventClick, onLinkPrepPackage }: WeekViewProps) {
  // 獲取週的所有日期
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  // 按日期分組事件
  const eventsByDay = useMemo(() => {
    const days: { [dateKey: string]: CalendarEvent[] } = {};
    events.forEach(event => {
      const eventStart = new Date(event.start.dateTime);
      const dateKey = eventStart.toISOString().split('T')[0];
      if (!days[dateKey]) days[dateKey] = [];
      days[dateKey].push(event);
    });
    return days;
  }, [events]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day, idx) => (
          <div key={idx} className="p-2 text-center border-r last:border-r-0 bg-muted/50">
            <div className="text-xs text-muted-foreground">
              {day.toLocaleDateString('zh-TW', { weekday: 'short' })}
            </div>
            <div className="text-lg font-semibold">
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weekDays.map((day, idx) => {
          const dateKey = day.toISOString().split('T')[0];
          const dayEvents = eventsByDay[dateKey] || [];
          return (
            <div key={idx} className="p-2 border-r last:border-r-0 min-h-[400px]">
              <div className="space-y-1">
                {dayEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact
                    onClick={onEventClick}
                    onLinkPrepPackage={onLinkPrepPackage}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 月視圖組件
 */
interface MonthViewProps {
  events: CalendarEvent[];
  month: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onLinkPrepPackage?: (eventId: string) => void;
}

function MonthView({ events, month, onEventClick, onLinkPrepPackage }: MonthViewProps) {
  // 獲取月份的所有日期（包括填充日期）
  const monthDays = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const days: Date[] = [];

    // 添加前置填充日期
    const firstDayOfWeek = firstDay.getDay();
    const paddingStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = paddingStart; i > 0; i--) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - i);
      days.push(date);
    }

    // 添加當月日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), i));
    }

    // 添加後置填充日期
    const remaining = 42 - days.length; // 6週 * 7天
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(lastDay);
      date.setDate(date.getDate() + i);
      days.push(date);
    }

    return days;
  }, [month]);

  // 按日期分組事件
  const eventsByDay = useMemo(() => {
    const days: { [dateKey: string]: CalendarEvent[] } = {};
    events.forEach(event => {
      const eventStart = new Date(event.start.dateTime);
      const dateKey = eventStart.toISOString().split('T')[0];
      if (!days[dateKey]) days[dateKey] = [];
      days[dateKey].push(event);
    });
    return days;
  }, [events]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {['週一', '週二', '週三', '週四', '週五', '週六', '週日'].map((day, idx) => (
          <div key={idx} className="p-2 text-center text-sm font-medium border-r last:border-r-0 bg-muted/50">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {monthDays.map((day, idx) => {
          const dateKey = day.toISOString().split('T')[0];
          const dayEvents = eventsByDay[dateKey] || [];
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={idx}
              className={`p-2 border-r border-b last:border-r-0 min-h-[100px] ${
                !isCurrentMonth ? 'bg-muted/20' : ''
              } ${isToday ? 'bg-primary/5' : ''}`}
            >
              <div className={`text-sm ${isToday ? 'font-bold text-primary' : isCurrentMonth ? '' : 'text-muted-foreground'}`}>
                {day.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    minimal
                    onClick={onEventClick}
                    onLinkPrepPackage={onLinkPrepPackage}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} 更多
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 事件卡片組件
 */
interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  minimal?: boolean;
  onClick?: (event: CalendarEvent) => void;
  onLinkPrepPackage?: (eventId: string) => void;
}

function EventCard({ event, compact = false, minimal = false, onClick, onLinkPrepPackage }: EventCardProps) {
  const startTime = new Date(event.start.dateTime).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (minimal) {
    return (
      <div
        className="text-xs p-1 rounded bg-primary/10 hover:bg-primary/20 cursor-pointer truncate"
        onClick={() => onClick?.(event)}
      >
        {startTime} {event.subject}
      </div>
    );
  }

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onClick?.(event)}>
        <CardContent className="p-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{event.subject}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {startTime}
              </div>
            </div>
            {event.isOnlineMeeting && (
              <Video className="h-3 w-3 text-primary flex-shrink-0" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{event.subject}</CardTitle>
          {event.isOnlineMeeting && (
            <Badge variant="secondary" className="flex-shrink-0">
              <Video className="h-3 w-3 mr-1" />
              線上
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {startTime} - {new Date(event.end.dateTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
        </div>

        {event.location?.displayName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {event.location.displayName}
          </div>
        )}

        {event.attendees && event.attendees.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {event.attendees.length} 位參與者
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={() => onClick?.(event)}>
            查看詳情
          </Button>
          {onLinkPrepPackage && (
            <Button size="sm" variant="outline" onClick={() => onLinkPrepPackage(event.id)}>
              <LinkIcon className="h-3 w-3 mr-1" />
              關聯準備包
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CalendarView;
