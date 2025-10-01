/**
 * 範本變數替換引擎
 *
 * 功能：
 * - Handlebars 範本編譯和渲染
 * - 自定義 Helper 函數（日期/貨幣/條件/循環）
 * - 範本變數驗證
 * - 安全的 HTML 轉義
 * - 錯誤處理和提示
 *
 * 支援語法：
 * - 基本變數: {{company_name}}
 * - 條件: {{#if is_premium}}...{{/if}}
 * - 循環: {{#each products}}...{{/each}}
 * - Helper: {{formatDate date}} {{formatCurrency price}}
 *
 * @author Claude Code
 * @date 2025-10-02
 */

import Handlebars from 'handlebars';
import { TemplateVariable } from './template-manager';

/**
 * 範本渲染選項
 */
export interface RenderOptions {
  /**
   * 是否允許原型污染（預設 false）
   */
  allowProtoProperties?: boolean;
  /**
   * 是否允許屬性污染（預設 false）
   */
  allowProtoMethods?: boolean;
  /**
   * 是否嚴格模式（變數不存在時拋出錯誤）
   */
  strict?: boolean;
}

/**
 * 範本引擎類
 */
export class TemplateEngine {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * 註冊自定義 Helper 函數
   */
  private registerHelpers() {
    // 日期格式化
    this.handlebars.registerHelper('formatDate', (date: string | Date, format?: string) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;

      format = format || 'YYYY-MM-DD';

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');

      return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes);
    });

    // 貨幣格式化
    this.handlebars.registerHelper('formatCurrency', (amount: number, currency?: string) => {
      if (typeof amount !== 'number') return amount;
      currency = currency || 'TWD';

      const formatted = new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: currency,
      }).format(amount);

      return formatted;
    });

    // 數字格式化（千分位）
    this.handlebars.registerHelper('formatNumber', (num: number, decimals?: number) => {
      if (typeof num !== 'number') return num;
      return num.toLocaleString('zh-TW', {
        minimumFractionDigits: decimals || 0,
        maximumFractionDigits: decimals || 0,
      });
    });

    // 百分比格式化
    this.handlebars.registerHelper('formatPercent', (num: number, decimals?: number) => {
      if (typeof num !== 'number') return num;
      return (num * 100).toFixed(decimals || 0) + '%';
    });

    // 字串大寫
    this.handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // 字串小寫
    this.handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    // 字串首字母大寫
    this.handlebars.registerHelper('capitalize', (str: string) => {
      return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
    });

    // 數學運算 - 加
    this.handlebars.registerHelper('add', (a: number, b: number) => {
      return (a || 0) + (b || 0);
    });

    // 數學運算 - 減
    this.handlebars.registerHelper('subtract', (a: number, b: number) => {
      return (a || 0) - (b || 0);
    });

    // 數學運算 - 乘
    this.handlebars.registerHelper('multiply', (a: number, b: number) => {
      return (a || 0) * (b || 0);
    });

    // 數學運算 - 除
    this.handlebars.registerHelper('divide', (a: number, b: number) => {
      return b !== 0 ? (a || 0) / b : 0;
    });

    // 比較運算 - 等於
    this.handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    // 比較運算 - 不等於
    this.handlebars.registerHelper('ne', (a: any, b: any) => {
      return a !== b;
    });

    // 比較運算 - 大於
    this.handlebars.registerHelper('gt', (a: number, b: number) => {
      return a > b;
    });

    // 比較運算 - 小於
    this.handlebars.registerHelper('lt', (a: number, b: number) => {
      return a < b;
    });

    // 比較運算 - 大於等於
    this.handlebars.registerHelper('gte', (a: number, b: number) => {
      return a >= b;
    });

    // 比較運算 - 小於等於
    this.handlebars.registerHelper('lte', (a: number, b: number) => {
      return a <= b;
    });

    // 邏輯運算 - AND
    this.handlebars.registerHelper('and', (...args: any[]) => {
      const options = args.pop();
      return args.every(Boolean);
    });

    // 邏輯運算 - OR
    this.handlebars.registerHelper('or', (...args: any[]) => {
      const options = args.pop();
      return args.some(Boolean);
    });

    // 邏輯運算 - NOT
    this.handlebars.registerHelper('not', (value: any) => {
      return !value;
    });

    // 陣列長度
    this.handlebars.registerHelper('length', (array: any[]) => {
      return Array.isArray(array) ? array.length : 0;
    });

    // 陣列包含
    this.handlebars.registerHelper('includes', (array: any[], value: any) => {
      return Array.isArray(array) && array.includes(value);
    });

    // JSON 字串化
    this.handlebars.registerHelper('json', (obj: any) => {
      return JSON.stringify(obj, null, 2);
    });

    // 預設值
    this.handlebars.registerHelper('default', (value: any, defaultValue: any) => {
      return value != null ? value : defaultValue;
    });
  }

  /**
   * 編譯範本
   */
  compile(template: string, options?: RenderOptions): HandlebarsTemplateDelegate {
    try {
      return this.handlebars.compile(template, {
        noEscape: false, // 預設轉義 HTML
        strict: options?.strict || false,
        preventIndent: false,
        knownHelpers: {},
        knownHelpersOnly: false,
      });
    } catch (error) {
      throw new Error(`範本編譯失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 渲染範本
   */
  render(template: string, data: Record<string, any>, options?: RenderOptions): string {
    try {
      const compiledTemplate = this.compile(template, options);
      return compiledTemplate(data, {
        allowProtoProperties: options?.allowProtoProperties || false,
        allowProtoMethods: options?.allowProtoMethods || false,
      });
    } catch (error) {
      throw new Error(`範本渲染失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 驗證範本變數
   * 檢查所有必需變數是否都有提供值
   */
  validateVariables(
    variables: Record<string, TemplateVariable>,
    data: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, variable] of Object.entries(variables)) {
      // 檢查必需變數
      if (variable.required && (data[key] === undefined || data[key] === null || data[key] === '')) {
        errors.push(`必需變數 "${variable.label || key}" 缺少值`);
        continue;
      }

      const value = data[key];

      // 跳過未提供的非必需變數
      if (value === undefined || value === null) {
        continue;
      }

      // 類型驗證
      switch (variable.type) {
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push(`變數 "${variable.label || key}" 必須是數字`);
          }
          break;

        case 'date':
          if (isNaN(new Date(value).getTime())) {
            errors.push(`變數 "${variable.label || key}" 必須是有效日期`);
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`變數 "${variable.label || key}" 必須是布爾值`);
          }
          break;

        case 'select':
          if (variable.options && !variable.options.includes(value)) {
            errors.push(`變數 "${variable.label || key}" 的值不在選項範圍內`);
          }
          break;

        case 'multiselect':
          if (!Array.isArray(value)) {
            errors.push(`變數 "${variable.label || key}" 必須是陣列`);
          } else if (variable.options) {
            const invalidValues = value.filter((v) => !variable.options!.includes(v));
            if (invalidValues.length > 0) {
              errors.push(`變數 "${variable.label || key}" 包含無效選項: ${invalidValues.join(', ')}`);
            }
          }
          break;
      }

      // 自定義驗證規則
      if (variable.validation) {
        const validation = variable.validation;

        // 數值範圍驗證
        if (typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            errors.push(validation.message || `變數 "${variable.label || key}" 不能小於 ${validation.min}`);
          }
          if (validation.max !== undefined && value > validation.max) {
            errors.push(validation.message || `變數 "${variable.label || key}" 不能大於 ${validation.max}`);
          }
        }

        // 字串長度驗證
        if (typeof value === 'string') {
          if (validation.min !== undefined && value.length < validation.min) {
            errors.push(validation.message || `變數 "${variable.label || key}" 長度不能少於 ${validation.min}`);
          }
          if (validation.max !== undefined && value.length > validation.max) {
            errors.push(validation.message || `變數 "${variable.label || key}" 長度不能超過 ${validation.max}`);
          }
        }

        // 正則表達式驗證
        if (validation.pattern && typeof value === 'string') {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            errors.push(validation.message || `變數 "${variable.label || key}" 格式不正確`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 提取範本中的變數名稱
   */
  extractVariables(template: string): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      const variable = match[1].trim();
      // 移除 helper 和特殊語法
      const cleanVariable = variable
        .replace(/^#|^\^|^\//, '') // 移除塊助手前綴
        .split(' ')[0] // 取第一個單詞
        .split('.')[0]; // 取第一個屬性

      // 過濾掉 helper 函數和內建關鍵字
      if (
        !['if', 'else', 'unless', 'each', 'with', 'log', 'lookup', 'this'].includes(cleanVariable)
      ) {
        variables.add(cleanVariable);
      }
    }

    return Array.from(variables);
  }

  /**
   * 預覽範本（使用測試數據）
   */
  preview(
    template: string,
    variables: Record<string, TemplateVariable>,
    testData?: Record<string, any>
  ): { html: string; data: Record<string, any> } {
    // 如果沒有提供測試數據，生成預設測試數據
    const data = testData || this.generateTestData(variables);

    try {
      const html = this.render(template, data);
      return { html, data };
    } catch (error) {
      throw new Error(`範本預覽失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 生成測試數據
   */
  private generateTestData(variables: Record<string, TemplateVariable>): Record<string, any> {
    const data: Record<string, any> = {};

    for (const [key, variable] of Object.entries(variables)) {
      if (variable.defaultValue !== undefined) {
        data[key] = variable.defaultValue;
      } else {
        // 根據類型生成測試數據
        switch (variable.type) {
          case 'text':
            data[key] = `範例${variable.label || key}`;
            break;
          case 'number':
            data[key] = 100;
            break;
          case 'date':
            data[key] = new Date().toISOString();
            break;
          case 'boolean':
            data[key] = true;
            break;
          case 'select':
            data[key] = variable.options?.[0] || '';
            break;
          case 'multiselect':
            data[key] = variable.options?.slice(0, 2) || [];
            break;
          default:
            data[key] = `範例${variable.label || key}`;
        }
      }
    }

    return data;
  }
}

// 導出單例實例
export const templateEngine = new TemplateEngine();
