/**
 * @fileoverview 備份調度器 - 統一管理資料庫和文件系統備份
 * @module scripts/backup/backup-scheduler
 * @description 備份調度器 - 統一管理資料庫和文件系統備份
 *
 * 功能：
 * - 統一執行資料庫和文件系統備份
 * - 備份結果統計和報告
 * - 錯誤處理和通知
 * - 適合整合到 cron job 或 Windows Task Scheduler
 *
 * 使用方式：
 * ```bash
 * # 完整備份 (資料庫 + 文件系統)
 * npx tsx scripts/backup/backup-scheduler.ts --type full
 *
 * # 增量備份
 * npx tsx scripts/backup/backup-scheduler.ts --type incremental
 *
 * # 只備份資料庫
 * npx tsx scripts/backup/backup-scheduler.ts --database-only
 *
 * # 只備份文件系統
 * npx tsx scripts/backup/backup-scheduler.ts --files-only
 * ```
 *
 * Cron 排程建議：
 * ```
 * # 每日凌晨2點完整備份
 * 0 2 * * * cd /path/to/project && npx tsx scripts/backup/backup-scheduler.ts --type full
 *
 * # 每6小時增量備份
 * 0 */6 * * * cd /path/to/project && npx tsx scripts/backup/backup-scheduler.ts --type incremental
 * ```
 *
 * @author Claude Code
 * @date 2025-10-06
 * @epic Sprint 3 Week 6 - 資料備份系統
 */

import DatabaseBackupManager from './database-backup';
import FileSystemBackupManager from './file-system-backup';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 備份調度配置
 */
export interface BackupScheduleConfig {
  type: 'full' | 'incremental';
  databaseOnly?: boolean;
  filesOnly?: boolean;
  notifyOnFailure?: boolean;
  reportPath?: string;
}

/**
 * 備份調度結果
 */
export interface BackupScheduleResult {
  success: boolean;
  timestamp: string;
  database?: {
    success: boolean;
    backupFile: string;
    size: number;
    checksum: string;
    duration: number;
    error?: string;
  };
  files?: {
    success: boolean;
    backupFile: string;
    fileCount: number;
    size: number;
    checksum: string;
    duration: number;
    error?: string;
  };
  totalDuration: number;
  errors: string[];
}

/**
 * 備份調度器
 */
export class BackupScheduler {
  private config: BackupScheduleConfig;

  constructor(config: Partial<BackupScheduleConfig> = {}) {
    this.config = {
      type: 'full',
      databaseOnly: false,
      filesOnly: false,
      notifyOnFailure: true,
      reportPath: './backups/reports',
      ...config,
    };
  }

  /**
   * 執行備份調度
   */
  async execute(): Promise<BackupScheduleResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    console.log(`╔════════════════════════════════════════════════════╗`);
    console.log(`║  🚀 備份調度器 - Sprint 3 Week 6                   ║`);
    console.log(`╚════════════════════════════════════════════════════╝`);
    console.log(``);
    console.log(`📅 執行時間: ${new Date().toLocaleString('zh-TW')}`);
    console.log(`🎯 備份類型: ${this.config.type.toUpperCase()}`);
    console.log(`📊 備份範圍: ${this.getBackupScope()}`);
    console.log(``);
    console.log(`─────────────────────────────────────────────────────\n`);

    const result: BackupScheduleResult = {
      success: true,
      timestamp,
      totalDuration: 0,
      errors: [],
    };

    // 資料庫備份
    if (!this.config.filesOnly) {
      console.log(`📦 [1/2] 資料庫備份`);
      console.log(`─────────────────────────────────────────────────────\n`);

      try {
        const dbManager = new DatabaseBackupManager({
          type: this.config.type as any,
        });

        const dbResult = await dbManager.backup();

        result.database = {
          success: dbResult.success,
          backupFile: dbResult.backupFile,
          size: dbResult.size,
          checksum: dbResult.checksum,
          duration: dbResult.duration,
          error: dbResult.error,
        };

        if (!dbResult.success) {
          result.success = false;
          result.errors.push(`資料庫備份失敗: ${dbResult.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.success = false;
        result.errors.push(`資料庫備份異常: ${errorMessage}`);
        result.database = {
          success: false,
          backupFile: '',
          size: 0,
          checksum: '',
          duration: 0,
          error: errorMessage,
        };
      }

      console.log(``);
    }

    // 文件系統備份
    if (!this.config.databaseOnly) {
      console.log(`📁 [2/2] 文件系統備份`);
      console.log(`─────────────────────────────────────────────────────\n`);

      try {
        const filesManager = new FileSystemBackupManager({
          type: this.config.type as any,
        });

        const filesResult = await filesManager.backup();

        result.files = {
          success: filesResult.success,
          backupFile: filesResult.backupFile,
          fileCount: filesResult.fileCount,
          size: filesResult.totalSize,
          checksum: filesResult.checksum,
          duration: filesResult.duration,
          error: filesResult.error,
        };

        if (!filesResult.success) {
          result.success = false;
          result.errors.push(`文件系統備份失敗: ${filesResult.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.success = false;
        result.errors.push(`文件系統備份異常: ${errorMessage}`);
        result.files = {
          success: false,
          backupFile: '',
          fileCount: 0,
          size: 0,
          checksum: '',
          duration: 0,
          error: errorMessage,
        };
      }

      console.log(``);
    }

    result.totalDuration = Date.now() - startTime;

    // 生成報告
    await this.generateReport(result);

    // 打印總結
    this.printSummary(result);

    // 失敗通知
    if (!result.success && this.config.notifyOnFailure) {
      await this.sendFailureNotification(result);
    }

    return result;
  }

  /**
   * 生成備份報告
   */
  private async generateReport(result: BackupScheduleResult): Promise<void> {
    if (!this.config.reportPath) {
      return;
    }

    try {
      // 確保報告目錄存在
      await fs.mkdir(this.config.reportPath, { recursive: true });

      const reportFileName = `backup-report-${result.timestamp.replace(/[:.]/g, '-')}.json`;
      const reportPath = path.join(this.config.reportPath, reportFileName);

      await fs.writeFile(reportPath, JSON.stringify(result, null, 2), 'utf-8');

      console.log(`📄 報告已生成: ${reportPath}`);
    } catch (error) {
      console.error(`⚠️ 生成報告失敗:`, error);
    }
  }

  /**
   * 打印總結
   */
  private printSummary(result: BackupScheduleResult): void {
    console.log(`\n╔════════════════════════════════════════════════════╗`);
    console.log(`║  📊 備份總結                                       ║`);
    console.log(`╚════════════════════════════════════════════════════╝\n`);

    // 資料庫備份總結
    if (result.database) {
      console.log(`📦 資料庫備份:`);
      if (result.database.success) {
        console.log(`   ✅ 成功`);
        console.log(`   📁 文件: ${path.basename(result.database.backupFile)}`);
        console.log(`   📊 大小: ${this.formatBytes(result.database.size)}`);
        console.log(`   ⏱️ 耗時: ${(result.database.duration / 1000).toFixed(2)}秒`);
      } else {
        console.log(`   ❌ 失敗: ${result.database.error}`);
      }
      console.log(``);
    }

    // 文件系統備份總結
    if (result.files) {
      console.log(`📁 文件系統備份:`);
      if (result.files.success) {
        console.log(`   ✅ 成功`);
        if (result.files.backupFile) {
          console.log(`   📁 文件: ${path.basename(result.files.backupFile)}`);
          console.log(`   📊 文件數: ${result.files.fileCount}`);
          console.log(`   📊 大小: ${this.formatBytes(result.files.size)}`);
          console.log(`   ⏱️ 耗時: ${(result.files.duration / 1000).toFixed(2)}秒`);
        } else {
          console.log(`   ℹ️ 無需備份 (源目錄為空或無變更)`);
        }
      } else {
        console.log(`   ❌ 失敗: ${result.files.error}`);
      }
      console.log(``);
    }

    // 總體狀態
    console.log(`🎯 總體狀態: ${result.success ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`⏱️ 總耗時: ${(result.totalDuration / 1000).toFixed(2)}秒`);

    if (result.errors.length > 0) {
      console.log(`\n⚠️ 錯誤清單:`);
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log(``);
  }

  /**
   * 發送失敗通知
   */
  private async sendFailureNotification(result: BackupScheduleResult): Promise<void> {
    console.log(`📧 發送備份失敗通知...`);

    // 注意: 實際實施時應整合郵件服務 (例如 SendGrid, AWS SES)
    // 這裡僅記錄錯誤日誌

    const logPath = './backups/backup-errors.log';

    try {
      const errorLog = `
[${result.timestamp}] 備份失敗報告
─────────────────────────────────────
備份類型: ${this.config.type}
備份範圍: ${this.getBackupScope()}
錯誤數量: ${result.errors.length}

錯誤詳情:
${result.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

─────────────────────────────────────
`;

      await fs.appendFile(logPath, errorLog, 'utf-8');

      console.log(`✅ 錯誤日誌已記錄: ${logPath}`);
      console.log(`📝 提示: 建議整合郵件通知服務以接收即時警報`);
    } catch (error) {
      console.error(`⚠️ 記錄錯誤日誌失敗:`, error);
    }
  }

  /**
   * 獲取備份範圍描述
   */
  private getBackupScope(): string {
    if (this.config.databaseOnly) {
      return '資料庫';
    }
    if (this.config.filesOnly) {
      return '文件系統';
    }
    return '資料庫 + 文件系統';
  }

  /**
   * 格式化字節大小
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * CLI 執行入口
 */
async function main() {
  const args = process.argv.slice(2);

  const typeArg = args.find((arg) => arg.startsWith('--type='));
  const type = typeArg ? (typeArg.split('=')[1] as 'full' | 'incremental') : 'full';

  const databaseOnly = args.includes('--database-only');
  const filesOnly = args.includes('--files-only');

  const scheduler = new BackupScheduler({
    type,
    databaseOnly,
    filesOnly,
  });

  const result = await scheduler.execute();

  if (!result.success) {
    console.error(`\n❌ 備份調度失敗\n`);
    process.exit(1);
  }

  console.log(`\n🎉 所有備份操作完成！\n`);
  process.exit(0);
}

// 如果直接執行此腳本，運行main函數
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 備份調度器錯誤:', error);
    process.exit(1);
  });
}

export default BackupScheduler;
