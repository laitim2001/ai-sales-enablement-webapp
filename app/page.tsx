/**
 * ================================================================
 * 檔案名稱: 應用程式首頁
 * 檔案用途: AI銷售賦能平台的歡迎頁面與功能介紹
 * 開發階段: 生產環境
 * ================================================================
 *
 * 功能索引:
 * 1. 品牌標題展示 - 平台名稱與視覺識別
 * 2. 視覺效果元素 - 漸層背景與動態視覺效果
 * 3. 功能特色介紹 - 四大核心功能預覽卡片
 * 4. 響應式佈局 - 桌面與行動裝置適配
 *
 * 展示的核心功能:
 * - CRM Integration: Dynamics 365整合
 * - AI Search: Azure OpenAI智能搜索
 * - Smart Proposals: AI輔助提案生成
 * - Analytics: 銷售數據分析
 *
 * 設計特色:
 * - 居中對稱佈局，專業簡潔
 * - 漸層視覺效果，現代感設計
 * - 懸停互動效果，提升用戶體驗
 * - 暗色模式支援
 *
 * 注意事項:
 * - 作為未登入用戶的第一印象頁面
 * - 需要與認證系統整合導向登入頁
 * - 功能介紹需與實際功能保持同步
 *
 * 更新記錄:
 * - Week 1: 建立基礎首頁佈局
 * - Week 3: 新增功能介紹卡片
 * ================================================================
 */

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      {/* 頁面標題區塊：品牌名稱與識別 */}
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center lg:text-left">
          AI Sales Enablement Platform
        </h1>
      </div>

      {/* 視覺效果區塊：漸層背景與中央圖示 */}
      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-full sm:before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full sm:after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        {/* 火箭圖示：象徵創新與成長 */}
        <div className="text-6xl font-semibold">🚀</div>
      </div>

      {/* 功能介紹網格：四大核心功能展示 */}
      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        {/* 功能卡片 1：CRM 整合 */}
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            CRM Integration
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Connect with Dynamics 365 for seamless customer data access.
          </p>
        </div>

        {/* 功能卡片 2：AI 智能搜索 */}
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            AI Search
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Intelligent knowledge base search powered by Azure OpenAI.
          </p>
        </div>

        {/* 功能卡片 3：智能提案生成 */}
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            Smart Proposals
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Generate personalized proposals with AI assistance.
          </p>
        </div>

        {/* 功能卡片 4：數據分析 */}
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            Analytics
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Track sales performance and customer insights.
          </p>
        </div>
      </div>
    </main>
  )
}