/**
 * 範本引擎測試套件
 *
 * 測試範圍：
 * - Handlebars 範本編譯和渲染
 * - 自定義 Helper 函數
 * - 範本變數驗證
 * - 錯誤處理
 *
 * @author Claude Code
 * @date 2025-10-02
 */

import { TemplateEngine, RenderOptions } from '@/lib/template/template-engine';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  describe('基本範本渲染', () => {
    it('應該能渲染基本變數', () => {
      const template = 'Hello {{name}}!';
      const data = { name: 'World' };

      const result = engine.render(template, data);

      expect(result).toBe('Hello World!');
    });

    it('應該能處理多個變數', () => {
      const template = '{{firstName}} {{lastName}} - {{email}}';
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const result = engine.render(template, data);

      expect(result).toBe('John Doe - john@example.com');
    });

    it('應該能處理嵌套對象', () => {
      const template = '{{user.name}} from {{user.company}}';
      const data = {
        user: {
          name: 'Alice',
          company: 'Tech Corp',
        },
      };

      const result = engine.render(template, data);

      expect(result).toBe('Alice from Tech Corp');
    });

    it('應該能處理不存在的變數', () => {
      const template = 'Hello {{name}}!';
      const data = {};

      const result = engine.render(template, data);

      expect(result).toBe('Hello !');
    });
  });

  describe('Helper 函數測試', () => {
    describe('formatDate', () => {
      it('應該能格式化日期', () => {
        const template = '{{formatDate date}}';
        const data = { date: new Date('2025-10-02T10:30:00') };

        const result = engine.render(template, data);

        expect(result).toContain('2025');
        expect(result).toContain('10');
        expect(result).toContain('02');
      });

      it('應該支持自定義日期格式', () => {
        const template = '{{formatDate date "YYYY/MM/DD"}}';
        const data = { date: new Date('2025-10-02') };

        const result = engine.render(template, data);

        expect(result).toBe('2025/10/02');
      });

      it('應該能處理日期時間格式', () => {
        const template = '{{formatDate date "YYYY-MM-DD HH:mm"}}';
        const data = { date: new Date('2025-10-02T14:30:00') };

        const result = engine.render(template, data);

        expect(result).toMatch(/2025-10-02 \d{2}:\d{2}/);
      });

      it('應該處理無效日期', () => {
        const template = '{{formatDate date}}';
        const data = { date: 'invalid-date' };

        const result = engine.render(template, data);

        expect(result).toBe('invalid-date');
      });
    });

    describe('formatCurrency', () => {
      it('應該能格式化貨幣', () => {
        const template = '{{formatCurrency price}}';
        const data = { price: 50000 };

        const result = engine.render(template, data);

        expect(result).toContain('50');
        expect(result).toContain('000');
      });

      it('應該支持不同貨幣', () => {
        const template = '{{formatCurrency price "USD"}}';
        const data = { price: 1000 };

        const result = engine.render(template, data);

        expect(result).toMatch(/\$|USD/);
      });

      it('應該處理小數', () => {
        const template = '{{formatCurrency price}}';
        const data = { price: 1234.56 };

        const result = engine.render(template, data);

        expect(result).toContain('1');
        expect(result).toContain('234');
      });
    });

    describe('formatNumber', () => {
      it('應該能格式化數字', () => {
        const template = '{{formatNumber count}}';
        const data = { count: 123456 };

        const result = engine.render(template, data);

        expect(result).toContain('123');
        expect(result).toContain('456');
      });

      it('應該支持小數位數', () => {
        const template = '{{formatNumber value 2}}';
        const data = { value: 123.456 };

        const result = engine.render(template, data);

        expect(result).toMatch(/123\.\d{2}/);
      });
    });

    describe('uppercase/lowercase', () => {
      it('應該能轉換為大寫', () => {
        const template = '{{uppercase text}}';
        const data = { text: 'hello world' };

        const result = engine.render(template, data);

        expect(result).toBe('HELLO WORLD');
      });

      it('應該能轉換為小寫', () => {
        const template = '{{lowercase text}}';
        const data = { text: 'HELLO WORLD' };

        const result = engine.render(template, data);

        expect(result).toBe('hello world');
      });
    });

    describe('add/subtract/multiply/divide', () => {
      it('應該能執行加法', () => {
        const template = '{{add a b}}';
        const data = { a: 10, b: 5 };

        const result = engine.render(template, data);

        expect(result).toBe('15');
      });

      it('應該能執行減法', () => {
        const template = '{{subtract a b}}';
        const data = { a: 10, b: 5 };

        const result = engine.render(template, data);

        expect(result).toBe('5');
      });

      it('應該能執行乘法', () => {
        const template = '{{multiply a b}}';
        const data = { a: 10, b: 5 };

        const result = engine.render(template, data);

        expect(result).toBe('50');
      });

      it('應該能執行除法', () => {
        const template = '{{divide a b}}';
        const data = { a: 10, b: 5 };

        const result = engine.render(template, data);

        expect(result).toBe('2');
      });
    });

    describe('eq/ne/gt/lt', () => {
      it('應該能比較相等', () => {
        const template = '{{#if (eq a b)}}Equal{{else}}Not Equal{{/if}}';
        const data1 = { a: 5, b: 5 };
        const data2 = { a: 5, b: 10 };

        expect(engine.render(template, data1)).toBe('Equal');
        expect(engine.render(template, data2)).toBe('Not Equal');
      });

      it('應該能比較不等', () => {
        const template = '{{#if (ne a b)}}Not Equal{{else}}Equal{{/if}}';
        const data = { a: 5, b: 10 };

        const result = engine.render(template, data);

        expect(result).toBe('Not Equal');
      });

      it('應該能比較大於', () => {
        const template = '{{#if (gt a b)}}Greater{{else}}Not Greater{{/if}}';
        const data1 = { a: 10, b: 5 };
        const data2 = { a: 5, b: 10 };

        expect(engine.render(template, data1)).toBe('Greater');
        expect(engine.render(template, data2)).toBe('Not Greater');
      });

      it('應該能比較小於', () => {
        const template = '{{#if (lt a b)}}Less{{else}}Not Less{{/if}}';
        const data1 = { a: 5, b: 10 };
        const data2 = { a: 10, b: 5 };

        expect(engine.render(template, data1)).toBe('Less');
        expect(engine.render(template, data2)).toBe('Not Less');
      });
    });
  });

  describe('條件語句', () => {
    it('應該能處理 if 語句', () => {
      const template = '{{#if show}}Visible{{/if}}';
      const data1 = { show: true };
      const data2 = { show: false };

      expect(engine.render(template, data1)).toBe('Visible');
      expect(engine.render(template, data2)).toBe('');
    });

    it('應該能處理 if-else 語句', () => {
      const template = '{{#if premium}}Premium User{{else}}Regular User{{/if}}';
      const data1 = { premium: true };
      const data2 = { premium: false };

      expect(engine.render(template, data1)).toBe('Premium User');
      expect(engine.render(template, data2)).toBe('Regular User');
    });

    it('應該能處理 unless 語句', () => {
      const template = '{{#unless premium}}Upgrade Now{{/unless}}';
      const data1 = { premium: false };
      const data2 = { premium: true };

      expect(engine.render(template, data1)).toBe('Upgrade Now');
      expect(engine.render(template, data2)).toBe('');
    });
  });

  describe('循環語句', () => {
    it('應該能處理 each 循環', () => {
      const template = '{{#each items}}{{name}},{{/each}}';
      const data = {
        items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      };

      const result = engine.render(template, data);

      expect(result).toBe('A,B,C,');
    });

    it('應該能在循環中使用索引', () => {
      const template = '{{#each items}}{{@index}}:{{name}},{{/each}}';
      const data = {
        items: [{ name: 'A' }, { name: 'B' }],
      };

      const result = engine.render(template, data);

      expect(result).toBe('0:A,1:B,');
    });

    it('應該能處理空數組', () => {
      const template = '{{#each items}}{{name}}{{else}}No items{{/each}}';
      const data = { items: [] };

      const result = engine.render(template, data);

      expect(result).toBe('No items');
    });
  });

  describe('範本驗證', () => {
    it('應該能驗證有效的範本', () => {
      const template = 'Hello {{name}}!';

      const isValid = engine.validate(template);

      expect(isValid.valid).toBe(true);
      expect(isValid.errors).toHaveLength(0);
    });

    it('應該能檢測無效的範本語法', () => {
      const template = 'Hello {{name}!'; // 缺少閉合大括號

      const isValid = engine.validate(template);

      expect(isValid.valid).toBe(false);
      expect(isValid.errors.length).toBeGreaterThan(0);
    });

    it('應該能提取範本變數', () => {
      const template = 'Hello {{firstName}} {{lastName}}! Your email is {{email}}.';

      const variables = engine.extractVariables(template);

      expect(variables).toContain('firstName');
      expect(variables).toContain('lastName');
      expect(variables).toContain('email');
      expect(variables).toHaveLength(3);
    });

    it('應該能處理嵌套變數', () => {
      const template = '{{user.name}} works at {{user.company}}';

      const variables = engine.extractVariables(template);

      expect(variables).toContain('user.name');
      expect(variables).toContain('user.company');
    });
  });

  describe('預覽功能', () => {
    it('應該能生成範本預覽', () => {
      const template = 'Hello {{name}}! You have {{count}} messages.';
      const variables = {
        name: { type: 'text', label: 'Name', required: true },
        count: { type: 'number', label: 'Count', required: true },
      };

      const preview = engine.preview(template, variables);

      expect(preview).toContain('Hello');
      expect(preview).toContain('messages');
    });
  });

  describe('錯誤處理', () => {
    it('應該優雅處理編譯錯誤', () => {
      const template = '{{#if}}invalid{{/if}}'; // 缺少條件

      expect(() => {
        engine.compile(template);
      }).toThrow();
    });

    it('應該處理渲染時錯誤', () => {
      const template = '{{unknownHelper value}}';
      const data = { value: 'test' };

      // Helper 不存在時應該返回空字串或拋出錯誤
      expect(() => {
        engine.render(template, data);
      }).not.toThrow(); // Handlebars 預設會處理未知 helper
    });
  });
});
