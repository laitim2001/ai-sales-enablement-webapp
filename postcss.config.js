/**
 * ================================================================
 * 檔案名稱: PostCSS 配置
 * 檔案用途: AI銷售賦能平台的CSS後處理器配置
 * 開發階段: 生產就緒
 * ================================================================
 *
 * 功能索引:
 * 1. Tailwind CSS - 工具類優先的CSS框架
 * 2. Autoprefixer - 自動添加瀏覽器前綴
 *
 * 技術特色/核心特色:
 * - 現代CSS工作流: 結合Tailwind和Autoprefixer的最佳實踐
 * - 瀏覽器相容性: 自動處理CSS前綴確保跨瀏覽器支援
 * - 開發效率: Tailwind提供快速UI開發能力
 * - 生產優化: 自動移除未使用的CSS類別
 * - 一致性設計: 通過設計系統確保UI一致性
 *
 * 依賴關係:
 * - tailwindcss: CSS工具類框架
 * - autoprefixer: CSS前綴自動添加工具
 * - PostCSS: CSS後處理器核心
 *
 * 注意事項:
 * - Tailwind配置文件需要單獨配置
 * - 生產環境會自動移除未使用的CSS
 * - Autoprefixer根據browserslist配置添加前綴
 * - 此配置與Next.js內建PostCSS支援完美整合
 *
 * 使用範例:
 * ```css
 * // 在CSS文件中使用Tailwind指令
 * @tailwind base;
 * @tailwind components;
 * @tailwind utilities;
 * ```
 *
 * ```jsx
 * // 在組件中使用Tailwind類別
 * <div className="bg-blue-500 text-white p-4 rounded-lg">
 *   Hello Tailwind!
 * </div>
 * ```
 *
 * 更新記錄:
 * - Week 1: 建立基礎PostCSS配置
 * - Week 2: 整合Tailwind CSS框架
 * - Week 3: 添加Autoprefixer支援
 * - Week 4: 優化生產環境配置
 * ================================================================
 */

module.exports = {
  plugins: {
    /**
     * Tailwind CSS 插件
     *
     * 功能特性:
     * - 工具類優先的CSS開發方法
     * - 預設計的設計系統和調色盤
     * - 響應式設計支援
     * - 暗色模式支援
     * - 自定義組件和工具類
     * - PurgeCSS 整合移除未使用樣式
     *
     * 配置說明:
     * - 空對象使用默認配置
     * - 詳細配置請參考 tailwind.config.js
     * - 支援JIT模式以提高編譯速度
     */
    tailwindcss: {},

    /**
     * Autoprefixer 插件
     *
     * 功能特性:
     * - 根據 Can I Use 數據自動添加CSS前綴
     * - 支援flexbox、grid等現代CSS特性
     * - 移除過時和不必要的前綴
     * - 與browserslist配置整合
     *
     * 配置說明:
     * - 空對象使用默認配置
     * - 瀏覽器支援範圍由 browserslist 控制
     * - 自動處理 -webkit-、-moz- 等前綴
     *
     * 支援的CSS特性:
     * - Flexbox 佈局
     * - CSS Grid 佈局
     * - CSS Transform
     * - CSS Transition
     * - CSS Animation
     * - CSS Variables (自定義屬性)
     */
    autoprefixer: {},
  },
}