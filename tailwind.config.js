/**
 * ================================================================
 * 檔案名稱: Tailwind CSS 配置檔案
 * 檔案用途: AI銷售賦能平台的樣式框架配置與設計系統
 * 開發階段: 生產環境
 * ================================================================
 *
 * 功能索引:
 * 1. 內容掃描配置 - 自動偵測需要樣式的檔案路徑
 * 2. 暗色模式支援 - class-based 暗色主題切換
 * 3. 容器佈局系統 - 響應式容器與斷點設定
 * 4. 色彩設計系統 - HSL色彩變數與語義化色彩
 * 5. 元件動畫系統 - 手風琴展開/收合動畫
 *
 * 設計特色:
 * - CSS變數驅動的動態主題系統
 * - 語義化色彩命名（primary、secondary、destructive等）
 * - 響應式設計支援（2xl: 1400px最大寬度）
 * - 無障礙友善的對比色搭配
 *
 * 依賴套件:
 * - tailwindcss-animate: 提供動畫工具類
 *
 * 注意事項:
 * - 色彩值需在CSS變數中定義（:root, [data-theme]）
 * - 暗色模式透過 'dark' class 觸發
 * - 動畫需配合 Radix UI 元件使用
 *
 * 更新記錄:
 * - Week 1: 建立設計系統基礎配置
 * - Week 3: 新增動畫與互動元件支援
 * ================================================================
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // 暗色模式：透過class控制，配合主題切換元件
  darkMode: ["class"],

  // 內容掃描：自動偵測使用Tailwind類別的檔案
  content: [
    './pages/**/*.{ts,tsx}',      // Pages Router 頁面
    './components/**/*.{ts,tsx}',  // 共用元件
    './app/**/*.{ts,tsx}',        // App Router 頁面與佈局
    './src/**/*.{ts,tsx}',        // 額外源碼目錄
  ],
  // 主題設定：自訂設計系統的核心配置
  theme: {
    // 容器佈局：統一的頁面寬度與響應式設定
    container: {
      center: true,           // 自動置中
      padding: "2rem",        // 左右內距
      screens: {
        "2xl": "1400px",      // 最大寬度限制
      },
    },

    // 擴展預設主題：新增自訂樣式而不覆蓋預設值
    extend: {
      // 色彩系統：基於CSS變數的動態主題色彩
      colors: {
        // 基礎色彩：佈局與互動元素
        border: "hsl(var(--border))",           // 邊框色
        input: "hsl(var(--input))",             // 輸入框背景
        ring: "hsl(var(--ring))",               // 焦點環顏色
        background: "hsl(var(--background))",   // 頁面背景
        foreground: "hsl(var(--foreground))",   // 主要文字色

        // 主要色彩：品牌色與重要按鈕
        primary: {
          DEFAULT: "hsl(var(--primary))",               // 主要品牌色
          foreground: "hsl(var(--primary-foreground))", // 主要色上的文字
        },

        // 次要色彩：輔助按鈕與區塊
        secondary: {
          DEFAULT: "hsl(var(--secondary))",               // 次要色
          foreground: "hsl(var(--secondary-foreground))", // 次要色上的文字
        },

        // 警告色彩：危險操作與錯誤狀態
        destructive: {
          DEFAULT: "hsl(var(--destructive))",               // 危險/錯誤色
          foreground: "hsl(var(--destructive-foreground))", // 危險色上的文字
        },

        // 靜音色彩：低對比的次要內容
        muted: {
          DEFAULT: "hsl(var(--muted))",               // 靜音背景色
          foreground: "hsl(var(--muted-foreground))", // 靜音文字色
        },

        // 強調色彩：突出顯示與提示
        accent: {
          DEFAULT: "hsl(var(--accent))",               // 強調背景色
          foreground: "hsl(var(--accent-foreground))", // 強調文字色
        },

        // 彈出視窗：下拉選單與對話框
        popover: {
          DEFAULT: "hsl(var(--popover))",               // 彈窗背景
          foreground: "hsl(var(--popover-foreground))", // 彈窗文字
        },

        // 卡片元件：內容容器與面板
        card: {
          DEFAULT: "hsl(var(--card))",               // 卡片背景
          foreground: "hsl(var(--card-foreground))", // 卡片文字
        },
      },

      // 圓角半徑：基於CSS變數的動態圓角系統
      borderRadius: {
        lg: "var(--radius)",                    // 大圓角
        md: "calc(var(--radius) - 2px)",       // 中圓角
        sm: "calc(var(--radius) - 4px)",       // 小圓角
      },

      // 關鍵影格：自訂動畫效果定義
      keyframes: {
        // 手風琴展開動畫
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        // 手風琴收合動畫
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },

      // 動畫工具類：可直接在HTML中使用的動畫效果
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",  // 展開動畫
        "accordion-up": "accordion-up 0.2s ease-out",      // 收合動畫
      },
    },
  },

  // 外掛程式：擴展Tailwind功能的第三方套件
  plugins: [
    require("tailwindcss-animate"),  // 動畫工具類，提供預設動畫效果
  ],
}