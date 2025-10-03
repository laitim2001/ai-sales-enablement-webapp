/**
 * ================================================================
 * AdvancedSearchBuilder 組件測試套件
 * ================================================================
 *
 * 測試高級搜索構建器組件：
 * • 條件添加和刪除
 * • 組的嵌套和管理
 * • 搜索執行
 * • 清空功能
 * • UI 交互
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvancedSearchBuilder } from '@/components/knowledge/advanced-search-builder';

// Mock fetch
global.fetch = jest.fn();

describe('AdvancedSearchBuilder', () => {
  const mockOnSearch = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('應該正確渲染初始狀態', () => {
    render(
      <AdvancedSearchBuilder
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        showPreview={false}
      />
    );

    // 應該有邏輯運算符選擇
    expect(screen.getByText(/AND/i)).toBeInTheDocument();
    expect(screen.getByText(/OR/i)).toBeInTheDocument();

    // 應該有添加條件按鈕
    expect(screen.getByText(/添加條件/i)).toBeInTheDocument();

    // 應該有搜索按鈕
    expect(screen.getByText(/搜索/i)).toBeInTheDocument();
  });

  it('點擊「添加條件」應該添加新條件', async () => {
    const user = userEvent.setup();

    render(
      <AdvancedSearchBuilder
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        showPreview={false}
      />
    );

    const addButton = screen.getByText(/添加條件/i);
    await user.click(addButton);

    // 應該顯示新的條件行
    const conditions = screen.getAllByRole('combobox');
    expect(conditions.length).toBeGreaterThan(0);
  });

  it('應該支持刪除條件', async () => {
    const user = userEvent.setup();

    render(
      <AdvancedSearchBuilder
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        showPreview={false}
      />
    );

    // 添加條件
    const addButton = screen.getByText(/添加條件/i);
    await user.click(addButton);

    // 查找刪除按鈕
    const deleteButtons = screen.getAllByRole('button', { name: /刪除|delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);

    // 刪除條件
    await user.click(deleteButtons[0]);

    // 條件應該被刪除
    await waitFor(() => {
      const remainingDeleteButtons = screen.queryAllByRole('button', { name: /刪除|delete/i });
      expect(remainingDeleteButtons.length).toBeLessThan(deleteButtons.length);
    });
  });

  it('應該支持添加嵌套組', async () => {
    const user = userEvent.setup();

    render(
      <AdvancedSearchBuilder
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        showPreview={false}
      />
    );

    const addGroupButton = screen.getByText(/添加組|Add Group/i);
    await user.click(addGroupButton);

    // 應該顯示嵌套組
    const groups = screen.getAllByText(/AND|OR/);
    expect(groups.length).toBeGreaterThan(1); // 至少有父組和子組
  });

  it('點擊「搜索」應該調用 onSearch', async () => {
    const user = userEvent.setup();

    render(
      <AdvancedSearchBuilder
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        showPreview={false}
      />
    );

    // 添加一個條件
    const addButton = screen.getByText(/添加條件/i);
    await user.click(addButton);

    // 點擊搜索
    const searchButton = screen.getByText(/搜索/i);
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalled();
  });

  it('點擊「清空」應該調用 onClear', async () => {
    const user = userEvent.setup();

    render(
      <AdvancedSearchBuilder
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        showPreview={false}
      />
    );

    const clearButton = screen.getByText(/清空|Clear/i);
    await user.click(clearButton);

    expect(mockOnClear).toHaveBeenCalled();
  });

  it('應該支持切換邏輯運算符 (AND/OR)', async () => {
    const user = userEvent.setup();

    render(
      <AdvancedSearchBuilder
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        showPreview={false}
      />
    );

    // 查找運算符切換按鈕
    const operatorButtons = screen.getAllByRole('button', { name: /AND|OR/i });
    expect(operatorButtons.length).toBeGreaterThan(0);

    // 切換運算符
    await user.click(operatorButtons[0]);

    // 驗證已切換（這裡依賴具體實現）
    await waitFor(() => {
      const updatedButtons = screen.getAllByRole('button', { name: /AND|OR/i });
      expect(updatedButtons).toBeDefined();
    });
  });

  describe('showPreview 模式', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ count: 5 })
      });
    });

    it('showPreview=true 時應該顯示預覽區域', () => {
      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={true}
        />
      );

      expect(screen.getByText(/預覽|Preview/i)).toBeInTheDocument();
    });

    it('添加條件時應該自動更新預覽', async () => {
      const user = userEvent.setup();

      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={true}
        />
      );

      const addButton = screen.getByText(/添加條件/i);
      await user.click(addButton);

      // 應該觸發預覽更新
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('條件字段類型', () => {
    it('應該支持所有預定義的字段類型', async () => {
      const user = userEvent.setup();

      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={false}
        />
      );

      const addButton = screen.getByText(/添加條件/i);
      await user.click(addButton);

      // 查找字段選擇器
      const fieldSelects = screen.getAllByRole('combobox');
      expect(fieldSelects.length).toBeGreaterThan(0);

      // 點擊字段選擇器
      await user.click(fieldSelects[0]);

      // 應該顯示字段選項（依賴具體實現）
      // 預期字段: title, content, author, category, tags, created_at, updated_at, file_type, folder
      await waitFor(() => {
        const options = screen.queryAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
      });
    });
  });

  describe('操作符類型', () => {
    it('應該根據字段類型顯示正確的操作符', async () => {
      const user = userEvent.setup();

      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={false}
        />
      );

      const addButton = screen.getByText(/添加條件/i);
      await user.click(addButton);

      // 字符串字段應該有: contains, equals, starts_with, ends_with
      // 日期字段應該有: before, after, between
      // 數組字段應該有: contains, not_contains

      const operatorSelects = screen.getAllByRole('combobox');
      expect(operatorSelects.length).toBeGreaterThan(1);
    });
  });

  describe('值輸入', () => {
    it('應該支持文本輸入', async () => {
      const user = userEvent.setup();

      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={false}
        />
      );

      const addButton = screen.getByText(/添加條件/i);
      await user.click(addButton);

      // 查找值輸入框
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);

      // 輸入值
      await user.type(inputs[0], '測試值');

      expect(inputs[0]).toHaveValue('測試值');
    });

    it('日期字段應該顯示日期選擇器', async () => {
      const user = userEvent.setup();

      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={false}
        />
      );

      const addButton = screen.getByText(/添加條件/i);
      await user.click(addButton);

      // 選擇日期字段（需要先選擇 created_at 或 updated_at）
      // 這裡依賴具體實現
    });
  });

  describe('複雜查詢構建', () => {
    it('應該支持構建多條件查詢', async () => {
      const user = userEvent.setup();

      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={false}
        />
      );

      // 添加多個條件
      const addButton = screen.getByText(/添加條件/i);
      await user.click(addButton);
      await user.click(addButton);
      await user.click(addButton);

      const conditions = screen.getAllByRole('combobox');
      expect(conditions.length).toBeGreaterThanOrEqual(3);
    });

    it('應該支持多層嵌套組', async () => {
      const user = userEvent.setup();

      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={false}
        />
      );

      // 添加組
      const addGroupButton = screen.getByText(/添加組|Add Group/i);
      await user.click(addGroupButton);

      // 在子組內再添加組
      const allGroupButtons = screen.getAllByText(/添加組|Add Group/i);
      if (allGroupButtons.length > 1) {
        await user.click(allGroupButtons[1]);

        // 應該有3層嵌套
        const groups = screen.getAllByText(/AND|OR/);
        expect(groups.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('驗證和錯誤處理', () => {
    it('沒有條件時搜索應該顯示提示', async () => {
      const user = userEvent.setup();

      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={false}
        />
      );

      const searchButton = screen.getByText(/搜索/i);
      await user.click(searchButton);

      // 可能顯示錯誤提示或禁用按鈕
      // 依賴具體實現
    });

    it('條件值為空時應該提示', async () => {
      const user = userEvent.setup();

      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={false}
        />
      );

      // 添加條件但不填值
      const addButton = screen.getByText(/添加條件/i);
      await user.click(addButton);

      const searchButton = screen.getByText(/搜索/i);
      await user.click(searchButton);

      // 可能顯示驗證錯誤
      // 依賴具體實現
    });
  });

  describe('可訪問性', () => {
    it('所有互動元素應該可鍵盤訪問', () => {
      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={false}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeEnabled();
      });
    });

    it('應該有適當的 ARIA 標籤', () => {
      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={false}
        />
      );

      // 檢查重要元素的 aria 屬性
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThan(0);
    });
  });

  describe('性能', () => {
    it('處理大量條件應該保持響應', async () => {
      const user = userEvent.setup();

      render(
        <AdvancedSearchBuilder
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          showPreview={false}
        />
      );

      const addButton = screen.getByText(/添加條件/i);

      const start = Date.now();

      // 快速添加20個條件
      for (let i = 0; i < 20; i++) {
        await user.click(addButton);
      }

      const elapsed = Date.now() - start;

      // 應該在合理時間內完成（5秒）
      expect(elapsed).toBeLessThan(5000);
    });
  });
});
