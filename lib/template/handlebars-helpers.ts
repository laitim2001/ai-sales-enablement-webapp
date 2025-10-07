/**
 * @fileoverview Handlebars 自定義 Helpers為 Handlebars 模板引擎註冊自定義輔助函數
 * @module lib/template/handlebars-helpers
 * @description
 * Handlebars 自定義 Helpers為 Handlebars 模板引擎註冊自定義輔助函數
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import Handlebars from 'handlebars';

/**
 * 註冊所有 Handlebars 自定義 helpers
 */
export function registerHandlebarsHelpers(): void {
  // 日期格式化 helper
  Handlebars.registerHelper('formatDate', function(date: Date | string, format?: string) {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;

    if (format === 'short') {
      return d.toLocaleDateString('zh-TW');
    } else if (format === 'long') {
      return d.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      return d.toLocaleString('zh-TW');
    }
  });

  // 貨幣格式化 helper
  Handlebars.registerHelper('formatCurrency', function(amount: number, currency = 'TWD') {
    if (typeof amount !== 'number') return '';

    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: currency
    }).format(amount);
  });

  // 數字格式化 helper
  Handlebars.registerHelper('formatNumber', function(num: number, decimals = 0) {
    if (typeof num !== 'number') return '';

    return num.toLocaleString('zh-TW', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  });

  // 條件判斷 helper
  Handlebars.registerHelper('eq', function(a: any, b: any) {
    return a === b;
  });

  Handlebars.registerHelper('ne', function(a: any, b: any) {
    return a !== b;
  });

  Handlebars.registerHelper('gt', function(a: number, b: number) {
    return a > b;
  });

  Handlebars.registerHelper('lt', function(a: number, b: number) {
    return a < b;
  });

  // 陣列操作 helper
  Handlebars.registerHelper('join', function(array: any[], separator = ', ') {
    if (!Array.isArray(array)) return '';
    return array.join(separator);
  });

  // 字串操作 helper
  Handlebars.registerHelper('uppercase', function(str: string) {
    return str ? str.toUpperCase() : '';
  });

  Handlebars.registerHelper('lowercase', function(str: string) {
    return str ? str.toLowerCase() : '';
  });

  Handlebars.registerHelper('truncate', function(str: string, length = 100) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
  });

  // 計算 helper
  Handlebars.registerHelper('add', function(a: number, b: number) {
    return a + b;
  });

  Handlebars.registerHelper('subtract', function(a: number, b: number) {
    return a - b;
  });

  Handlebars.registerHelper('multiply', function(a: number, b: number) {
    return a * b;
  });

  Handlebars.registerHelper('divide', function(a: number, b: number) {
    return b !== 0 ? a / b : 0;
  });

  // 百分比 helper
  Handlebars.registerHelper('percent', function(num: number, decimals = 1) {
    if (typeof num !== 'number') return '';
    return (num * 100).toFixed(decimals) + '%';
  });

  // 預設值 helper
  Handlebars.registerHelper('default', function(value: any, defaultValue: any) {
    return value != null ? value : defaultValue;
  });

  // JSON 字串化 helper (用於調試)
  Handlebars.registerHelper('json', function(obj: any) {
    return JSON.stringify(obj, null, 2);
  });
}
