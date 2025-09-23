/**
 * PostgreSQL + pgvector 性能測試 POC
 * 測試目標：
 * 1. 驗證 pgvector 擴展安裝和基本功能
 * 2. 測試向量插入性能
 * 3. 測試向量相似性搜索性能
 * 4. 評估不同向量維度的性能影響
 */

require('dotenv').config();
const { Pool } = require('pg');

class PgVectorPOC {
  constructor() {
    this.pool = new Pool({
      user: process.env.POSTGRES_USER || 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'sales_copilot_test',
      password: process.env.POSTGRES_PASSWORD,
      port: process.env.POSTGRES_PORT || 5432,
    });
  }

  /**
   * 測試數據庫連接和 pgvector 擴展
   */
  async testConnection() {
    console.log('🔗 測試 PostgreSQL 連接和 pgvector 擴展...');

    try {
      const client = await this.pool.connect();

      // 測試基本連接
      const versionResult = await client.query('SELECT version()');
      console.log('✅ PostgreSQL 連接成功！');
      console.log(`📋 版本: ${versionResult.rows[0].version.split(' ').slice(0, 2).join(' ')}`);

      // 安裝 pgvector 擴展（如果不存在）
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        console.log('✅ pgvector 擴展已啟用');
      } catch (error) {
        console.error('❌ pgvector 擴展安裝失敗:', error.message);
        throw error;
      }

      // 檢查向量支持
      const vectorTest = await client.query("SELECT '[1,2,3]'::vector");
      console.log('✅ 向量數據類型支持正常');

      client.release();
      return true;

    } catch (error) {
      console.error('❌ 數據庫連接失敗:', error.message);
      return false;
    }
  }

  /**
   * 創建測試用的向量表
   */
  async createTestTable(dimension = 1536) {
    console.log(`\n📋 創建測試表（向量維度: ${dimension}）...`);

    const client = await this.pool.connect();

    try {
      // 刪除舊表（如果存在）
      await client.query('DROP TABLE IF EXISTS vector_test');

      // 創建新表
      await client.query(`
        CREATE TABLE vector_test (
          id SERIAL PRIMARY KEY,
          content TEXT,
          embedding VECTOR(${dimension}),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // 創建向量索引（HNSW - 更適合高維度）
      await client.query(`
        CREATE INDEX ON vector_test
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
      `);

      console.log('✅ 測試表創建成功');

      client.release();
      return true;

    } catch (error) {
      console.error('❌ 創建測試表失敗:', error.message);
      client.release();
      return false;
    }
  }

  /**
   * 生成隨機向量（模擬 OpenAI embedding）
   */
  generateRandomVector(dimension = 1536) {
    return Array.from({ length: dimension }, () => Math.random() - 0.5);
  }

  /**
   * 測試批量向量插入性能
   */
  async testInsertPerformance(batchSize = 1000, dimension = 1536) {
    console.log(`\n📊 測試批量插入性能（批次大小: ${batchSize}, 維度: ${dimension}）...`);

    const client = await this.pool.connect();

    try {
      // 準備測試數據
      const testData = [];
      for (let i = 0; i < batchSize; i++) {
        testData.push({
          content: `測試文檔 ${i + 1}`,
          embedding: this.generateRandomVector(dimension)
        });
      }

      // 批量插入測試
      const startTime = Date.now();

      for (const data of testData) {
        await client.query(
          'INSERT INTO vector_test (content, embedding) VALUES ($1, $2)',
          [data.content, `[${data.embedding.join(',')}]`]
        );
      }

      const duration = Date.now() - startTime;

      console.log('✅ 批量插入完成！');
      console.log(`⏱️  總耗時: ${duration}ms`);
      console.log(`📈 平均每條: ${(duration / batchSize).toFixed(2)}ms`);
      console.log(`🔢 插入速度: ${(batchSize / (duration / 1000)).toFixed(0)} 條/秒`);

      // 檢查實際插入數量
      const countResult = await client.query('SELECT COUNT(*) FROM vector_test');
      console.log(`📋 表中總記錄數: ${countResult.rows[0].count}`);

      client.release();
      return {
        success: true,
        totalTime: duration,
        recordsPerSecond: batchSize / (duration / 1000),
        avgTimePerRecord: duration / batchSize
      };

    } catch (error) {
      console.error('❌ 插入測試失敗:', error.message);
      client.release();
      return { success: false, error: error.message };
    }
  }

  /**
   * 測試向量相似性搜索性能
   */
  async testSearchPerformance(queryCount = 10, dimension = 1536) {
    console.log(`\n🔍 測試向量相似性搜索性能（查詢次數: ${queryCount}）...`);

    const client = await this.pool.connect();

    try {
      const searchTimes = [];

      for (let i = 0; i < queryCount; i++) {
        const queryVector = this.generateRandomVector(dimension);

        const startTime = Date.now();

        const result = await client.query(`
          SELECT content,
                 embedding <=> $1 as distance
          FROM vector_test
          ORDER BY embedding <=> $1
          LIMIT 5
        `, [`[${queryVector.join(',')}]`]);

        const searchTime = Date.now() - startTime;
        searchTimes.push(searchTime);

        if (i === 0) {
          // 顯示第一次查詢的結果樣本
          console.log(`📋 查詢結果樣本 (前3條):`);
          result.rows.slice(0, 3).forEach((row, idx) => {
            console.log(`   ${idx + 1}. ${row.content} (距離: ${parseFloat(row.distance).toFixed(4)})`);
          });
        }
      }

      const avgSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      const minSearchTime = Math.min(...searchTimes);
      const maxSearchTime = Math.max(...searchTimes);

      console.log('✅ 搜索性能測試完成！');
      console.log(`⏱️  平均搜索時間: ${avgSearchTime.toFixed(2)}ms`);
      console.log(`⚡ 最快搜索時間: ${minSearchTime}ms`);
      console.log(`🐌 最慢搜索時間: ${maxSearchTime}ms`);
      console.log(`🎯 搜索速度評估: ${avgSearchTime < 100 ? '優秀' : avgSearchTime < 500 ? '良好' : '需要優化'}`);

      client.release();
      return {
        success: true,
        avgSearchTime,
        minSearchTime,
        maxSearchTime,
        performance: avgSearchTime < 100 ? 'excellent' : avgSearchTime < 500 ? 'good' : 'needs_optimization'
      };

    } catch (error) {
      console.error('❌ 搜索測試失敗:', error.message);
      client.release();
      return { success: false, error: error.message };
    }
  }

  /**
   * 測試不同向量維度的性能影響
   */
  async testDimensionImpact() {
    console.log('\n📐 測試不同向量維度的性能影響...');

    const dimensions = [384, 768, 1536]; // 常見的 embedding 維度
    const results = {};

    for (const dim of dimensions) {
      console.log(`\n--- 測試維度 ${dim} ---`);

      // 創建對應維度的表
      await this.createTestTable(dim);

      // 插入少量測試數據
      const insertResult = await this.testInsertPerformance(100, dim);

      // 測試搜索性能
      const searchResult = await this.testSearchPerformance(5, dim);

      results[dim] = {
        insert: insertResult,
        search: searchResult
      };
    }

    // 總結不同維度的性能
    console.log('\n📊 維度性能對比總結:');
    console.log('維度\t插入速度(條/秒)\t平均搜索時間(ms)\t推薦使用');
    console.log('-'.repeat(60));

    Object.entries(results).forEach(([dim, result]) => {
      if (result.insert.success && result.search.success) {
        const insertRate = Math.round(result.insert.recordsPerSecond);
        const searchTime = result.search.avgSearchTime.toFixed(1);
        const recommended = dim === '1536' ? '✅ (OpenAI默認)' :
                           dim === '768' ? '⚡ (速度優先)' :
                           '📦 (體積優先)';

        console.log(`${dim}\t${insertRate}\t\t\t${searchTime}\t\t${recommended}`);
      }
    });

    return results;
  }

  /**
   * 清理測試數據
   */
  async cleanup() {
    console.log('\n🧹 清理測試數據...');

    const client = await this.pool.connect();

    try {
      await client.query('DROP TABLE IF EXISTS vector_test');
      console.log('✅ 測試數據清理完成');
      client.release();
    } catch (error) {
      console.error('⚠️  清理失敗:', error.message);
      client.release();
    }
  }

  /**
   * 執行完整測試套件
   */
  async runFullTest() {
    console.log('🚀 開始 pgvector 性能測試\n');
    console.log('=' .repeat(60));

    const results = {
      connection: false,
      insert: null,
      search: null,
      dimensions: null
    };

    try {
      // 1. 測試連接和擴展
      results.connection = await this.testConnection();

      if (!results.connection) {
        throw new Error('數據庫連接失敗，無法繼續測試');
      }

      // 2. 測試不同維度的性能
      results.dimensions = await this.testDimensionImpact();

      // 3. 清理測試數據
      await this.cleanup();

    } catch (error) {
      console.error('💥 測試過程發生錯誤:', error.message);
    }

    // 關閉數據庫連接
    await this.pool.end();

    // 總結報告
    console.log('\n' + '=' .repeat(60));
    console.log('📋 pgvector POC 測試總結:');
    console.log(`🔗 數據庫連接: ${results.connection ? '✅ 成功' : '❌ 失敗'}`);

    if (results.dimensions) {
      const hasDimensionResults = Object.values(results.dimensions).some(
        r => r.insert?.success && r.search?.success
      );
      console.log(`📐 多維度測試: ${hasDimensionResults ? '✅ 完成' : '❌ 失敗'}`);
    }

    console.log('\n💡 建議:');
    console.log('   - 對於 MVP，建議使用 1536 維度（OpenAI text-embedding-ada-002 默認）');
    console.log('   - 如果性能是關鍵考慮，可以考慮 768 維度');
    console.log('   - 生產環境建議配置更多 PostgreSQL 緩存和並行設定');

    return results;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const poc = new PgVectorPOC();
  poc.runFullTest()
    .then(results => {
      const success = results.connection &&
                     results.dimensions &&
                     Object.values(results.dimensions).some(r => r.insert?.success);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 測試執行失敗:', error);
      process.exit(1);
    });
}

module.exports = PgVectorPOC;