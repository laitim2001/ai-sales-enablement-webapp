/**
 * @fileoverview Microsoft Graph Calendar Mock Service提供開發環境下的模擬日曆服務,無需真實的Azure AD配置功能:- 模擬OAuth認證流程- 模擬日曆事件CRUD操作- 模擬增量同步- 生成測試用日曆數據@module calendar-mock-service
 * @module lib/calendar/calendar-mock-service
 * @description
 * Microsoft Graph Calendar Mock Service提供開發環境下的模擬日曆服務,無需真實的Azure AD配置功能:- 模擬OAuth認證流程- 模擬日曆事件CRUD操作- 模擬增量同步- 生成測試用日曆數據@module calendar-mock-service
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { randomUUID } from 'crypto';

/**
 * 模擬日曆事件接口
 */
export interface MockCalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      name?: string;
      address: string;
    };
    type: 'required' | 'optional';
  }>;
  body?: {
    contentType: 'html' | 'text';
    content: string;
  };
  isOnlineMeeting?: boolean;
  onlineMeetingUrl?: string;
  organizer?: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  createdDateTime: string;
  lastModifiedDateTime: string;
}

/**
 * 模擬同步狀態
 */
interface MockSyncState {
  deltaToken: string;
  lastSyncTime: Date;
  events: Map<string, MockCalendarEvent>;
}

/**
 * 內存存儲的模擬數據
 */
class MockDataStore {
  private events: Map<string, MockCalendarEvent> = new Map();
  private syncStates: Map<string, MockSyncState> = new Map();
  private tokens: Map<string, { accessToken: string; refreshToken: string; expiresAt: Date }> = new Map();

  constructor() {
    // 初始化一些測試事件
    this.initializeMockEvents();
  }

  /**
   * 初始化模擬事件數據
   */
  private initializeMockEvents() {
    const now = new Date();
    const mockEvents: Partial<MockCalendarEvent>[] = [
      {
        subject: '產品演示會議',
        start: {
          dateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Taipei'
        },
        end: {
          dateTime: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Taipei'
        },
        location: { displayName: '會議室A' },
        isOnlineMeeting: true,
        onlineMeetingUrl: 'https://teams.microsoft.com/l/meetup/mock-meeting-1',
        attendees: [
          { emailAddress: { name: '張經理', address: 'zhang@example.com' }, type: 'required' },
          { emailAddress: { name: '李工程師', address: 'li@example.com' }, type: 'required' }
        ],
        body: {
          contentType: 'html',
          content: '<p>與ABC公司討論新產品功能演示</p>'
        }
      },
      {
        subject: '客戶拜訪',
        start: {
          dateTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Taipei'
        },
        end: {
          dateTime: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Taipei'
        },
        location: { displayName: 'XYZ公司總部' },
        isOnlineMeeting: false,
        attendees: [
          { emailAddress: { name: '王總監', address: 'wang@example.com' }, type: 'required' }
        ],
        body: {
          contentType: 'text',
          content: '季度業績檢討和Q4目標討論'
        }
      },
      {
        subject: '每週團隊會議',
        start: {
          dateTime: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Taipei'
        },
        end: {
          dateTime: new Date(now.getTime() + 49 * 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Taipei'
        },
        location: { displayName: '線上會議' },
        isOnlineMeeting: true,
        onlineMeetingUrl: 'https://teams.microsoft.com/l/meetup/mock-meeting-2',
        attendees: [
          { emailAddress: { name: '團隊成員A', address: 'membera@example.com' }, type: 'required' },
          { emailAddress: { name: '團隊成員B', address: 'memberb@example.com' }, type: 'required' },
          { emailAddress: { name: '團隊成員C', address: 'memberc@example.com' }, type: 'optional' }
        ],
        body: {
          contentType: 'text',
          content: '週進度同步和障礙討論'
        }
      }
    ];

    mockEvents.forEach(eventData => {
      const event: MockCalendarEvent = {
        id: randomUUID(),
        subject: eventData.subject!,
        start: eventData.start!,
        end: eventData.end!,
        location: eventData.location,
        attendees: eventData.attendees,
        body: eventData.body,
        isOnlineMeeting: eventData.isOnlineMeeting,
        onlineMeetingUrl: eventData.onlineMeetingUrl,
        organizer: {
          emailAddress: {
            name: '模擬用戶',
            address: 'mock-user@example.com'
          }
        },
        createdDateTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastModifiedDateTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      };

      this.events.set(event.id, event);
    });
  }

  /**
   * 獲取所有事件
   */
  getEvents(): MockCalendarEvent[] {
    return Array.from(this.events.values());
  }

  /**
   * 獲取指定時間範圍的事件
   */
  getEventsByDateRange(startDateTime: string, endDateTime: string): MockCalendarEvent[] {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    return Array.from(this.events.values()).filter(event => {
      const eventStart = new Date(event.start.dateTime);
      return eventStart >= start && eventStart <= end;
    });
  }

  /**
   * 獲取單個事件
   */
  getEvent(eventId: string): MockCalendarEvent | undefined {
    return this.events.get(eventId);
  }

  /**
   * 創建事件
   */
  createEvent(eventData: Partial<MockCalendarEvent>): MockCalendarEvent {
    const now = new Date();
    const event: MockCalendarEvent = {
      id: randomUUID(),
      subject: eventData.subject || '新事件',
      start: eventData.start || {
        dateTime: now.toISOString(),
        timeZone: 'Asia/Taipei'
      },
      end: eventData.end || {
        dateTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'Asia/Taipei'
      },
      location: eventData.location,
      attendees: eventData.attendees || [],
      body: eventData.body,
      isOnlineMeeting: eventData.isOnlineMeeting || false,
      onlineMeetingUrl: eventData.onlineMeetingUrl,
      organizer: {
        emailAddress: {
          name: '模擬用戶',
          address: 'mock-user@example.com'
        }
      },
      createdDateTime: now.toISOString(),
      lastModifiedDateTime: now.toISOString()
    };

    this.events.set(event.id, event);
    return event;
  }

  /**
   * 更新事件
   */
  updateEvent(eventId: string, updates: Partial<MockCalendarEvent>): MockCalendarEvent | null {
    const event = this.events.get(eventId);
    if (!event) return null;

    const updatedEvent: MockCalendarEvent = {
      ...event,
      ...updates,
      id: event.id, // 保持原ID
      lastModifiedDateTime: new Date().toISOString()
    };

    this.events.set(eventId, updatedEvent);
    return updatedEvent;
  }

  /**
   * 刪除事件
   */
  deleteEvent(eventId: string): boolean {
    return this.events.delete(eventId);
  }

  /**
   * 生成模擬token
   */
  generateMockToken(userId: string): { accessToken: string; refreshToken: string; expiresAt: Date } {
    const token = {
      accessToken: `mock-access-token-${randomUUID()}`,
      refreshToken: `mock-refresh-token-${randomUUID()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1小時後過期
    };

    this.tokens.set(userId, token);
    return token;
  }

  /**
   * 驗證模擬token
   */
  validateMockToken(accessToken: string): boolean {
    for (const [, token] of this.tokens) {
      if (token.accessToken === accessToken && token.expiresAt > new Date()) {
        return true;
      }
    }
    return false;
  }

  /**
   * 獲取同步狀態
   */
  getSyncState(userId: string): MockSyncState {
    let state = this.syncStates.get(userId);
    if (!state) {
      state = {
        deltaToken: randomUUID(),
        lastSyncTime: new Date(),
        events: new Map(this.events)
      };
      this.syncStates.set(userId, state);
    }
    return state;
  }

  /**
   * 更新同步狀態
   */
  updateSyncState(userId: string): { deltaToken: string; changes: { added: MockCalendarEvent[]; updated: MockCalendarEvent[]; deleted: string[] } } {
    const state = this.getSyncState(userId);
    const currentEvents = new Map(this.events);

    const changes = {
      added: [] as MockCalendarEvent[],
      updated: [] as MockCalendarEvent[],
      deleted: [] as string[]
    };

    // 檢測新增和更新的事件
    for (const [id, event] of currentEvents) {
      const oldEvent = state.events.get(id);
      if (!oldEvent) {
        changes.added.push(event);
      } else if (event.lastModifiedDateTime !== oldEvent.lastModifiedDateTime) {
        changes.updated.push(event);
      }
    }

    // 檢測刪除的事件
    for (const [id] of state.events) {
      if (!currentEvents.has(id)) {
        changes.deleted.push(id);
      }
    }

    // 更新狀態
    const newDeltaToken = randomUUID();
    this.syncStates.set(userId, {
      deltaToken: newDeltaToken,
      lastSyncTime: new Date(),
      events: new Map(currentEvents)
    });

    return {
      deltaToken: newDeltaToken,
      changes
    };
  }

  /**
   * 重置同步狀態
   */
  resetSyncState(userId: string): void {
    this.syncStates.delete(userId);
  }
}

// 單例模式
const mockDataStore = new MockDataStore();

/**
 * Calendar Mock Service
 *
 * 提供與真實Microsoft Graph API相同的接口,但使用模擬數據
 */
export class CalendarMockService {
  /**
   * 模擬OAuth認證 - 生成授權URL
   */
  static async getAuthorizationUrl(userId: string, state?: string): Promise<string> {
    // 返回模擬的授權URL
    const mockState = state || randomUUID();
    return `http://localhost:3005/api/calendar/auth/callback?code=mock-auth-code-${randomUUID()}&state=${mockState}`;
  }

  /**
   * 模擬OAuth認證 - 交換token
   */
  static async getTokenFromCode(code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    // 模擬token交換延遲
    await new Promise(resolve => setTimeout(resolve, 100));

    // 生成模擬token
    return mockDataStore.generateMockToken('mock-user-id');
  }

  /**
   * 模擬OAuth認證 - 刷新token
   */
  static async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    // 模擬token刷新延遲
    await new Promise(resolve => setTimeout(resolve, 100));

    return mockDataStore.generateMockToken('mock-user-id');
  }

  /**
   * 獲取日曆事件列表
   */
  static async getEvents(
    accessToken: string,
    options?: {
      startDateTime?: string;
      endDateTime?: string;
      top?: number;
    }
  ): Promise<{ value: MockCalendarEvent[] }> {
    // 模擬API延遲
    await new Promise(resolve => setTimeout(resolve, 50));

    let events: MockCalendarEvent[];

    if (options?.startDateTime && options?.endDateTime) {
      events = mockDataStore.getEventsByDateRange(options.startDateTime, options.endDateTime);
    } else {
      events = mockDataStore.getEvents();
    }

    // 應用數量限制
    if (options?.top) {
      events = events.slice(0, options.top);
    }

    return { value: events };
  }

  /**
   * 獲取單個事件
   */
  static async getEvent(accessToken: string, eventId: string): Promise<MockCalendarEvent | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return mockDataStore.getEvent(eventId) || null;
  }

  /**
   * 創建事件
   */
  static async createEvent(
    accessToken: string,
    eventData: Partial<MockCalendarEvent>
  ): Promise<MockCalendarEvent> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockDataStore.createEvent(eventData);
  }

  /**
   * 更新事件
   */
  static async updateEvent(
    accessToken: string,
    eventId: string,
    updates: Partial<MockCalendarEvent>
  ): Promise<MockCalendarEvent | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockDataStore.updateEvent(eventId, updates);
  }

  /**
   * 刪除事件
   */
  static async deleteEvent(accessToken: string, eventId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockDataStore.deleteEvent(eventId);
  }

  /**
   * 增量同步事件
   */
  static async deltaSync(
    accessToken: string,
    userId: string,
    deltaToken?: string
  ): Promise<{
    value: MockCalendarEvent[];
    deltaToken: string;
    changes?: { added: MockCalendarEvent[]; updated: MockCalendarEvent[]; deleted: string[] };
  }> {
    await new Promise(resolve => setTimeout(resolve, 150));

    if (deltaToken) {
      // 執行增量同步
      const { deltaToken: newDeltaToken, changes } = mockDataStore.updateSyncState(userId);
      return {
        value: [...changes.added, ...changes.updated],
        deltaToken: newDeltaToken,
        changes
      };
    } else {
      // 首次同步,返回所有事件
      const state = mockDataStore.getSyncState(userId);
      return {
        value: mockDataStore.getEvents(),
        deltaToken: state.deltaToken
      };
    }
  }

  /**
   * 完整同步事件
   */
  static async fullSync(
    accessToken: string,
    userId: string,
    options?: {
      daysAhead?: number;
      daysBehind?: number;
    }
  ): Promise<{ value: MockCalendarEvent[]; deltaToken: string }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const now = new Date();
    const startDateTime = new Date(now.getTime() - (options?.daysBehind || 7) * 24 * 60 * 60 * 1000).toISOString();
    const endDateTime = new Date(now.getTime() + (options?.daysAhead || 30) * 24 * 60 * 60 * 1000).toISOString();

    const events = mockDataStore.getEventsByDateRange(startDateTime, endDateTime);

    // 重置同步狀態
    mockDataStore.resetSyncState(userId);
    const state = mockDataStore.getSyncState(userId);

    return {
      value: events,
      deltaToken: state.deltaToken
    };
  }

  /**
   * 檢查是否為模擬模式
   */
  static isMockMode(): boolean {
    return process.env.MICROSOFT_GRAPH_MODE === 'mock' ||
           process.env.MICROSOFT_GRAPH_MOCK_ENABLED === 'true';
  }

  /**
   * 獲取模擬用戶信息
   */
  static async getUserInfo(accessToken: string): Promise<{
    displayName: string;
    mail: string;
    userPrincipalName: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
      displayName: '模擬用戶',
      mail: 'mock-user@example.com',
      userPrincipalName: 'mock-user@example.com'
    };
  }
}

export default CalendarMockService;
