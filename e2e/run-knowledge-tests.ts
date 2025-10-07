#!/usr/bin/env ts-node

/**
 * @fileoverview Knowledge Base E2E Test Runner - 知識庫端到端測試套件
 * @module e2e/run-knowledge-tests
 * @description
 * Comprehensive test suite for knowledge base functionality
 * 測試範圍：
 * - 知識庫CRUD操作
 * - 搜索和過濾功能
 * - 版本控制和歷史記錄
 * - 權限和訪問控制
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'

interface TestSuite {
  name: string
  file: string
  description: string
  estimatedTime: string
}

interface TestResult {
  suite: string
  passed: number
  failed: number
  skipped: number
  duration: number
  errors: string[]
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'Navigation',
    file: 'knowledge-base/navigation.spec.ts',
    description: 'Tests for routing and navigation between knowledge base pages',
    estimatedTime: '2-3 minutes'
  },
  {
    name: 'Main Page',
    file: 'knowledge-base/main-page.spec.ts',
    description: 'Tests for knowledge base list page functionality',
    estimatedTime: '3-4 minutes'
  },
  {
    name: 'Create Page',
    file: 'knowledge-base/create-page.spec.ts',
    description: 'Tests for creating new knowledge base items',
    estimatedTime: '4-5 minutes'
  },
  {
    name: 'Upload Page',
    file: 'knowledge-base/upload-page.spec.ts',
    description: 'Tests for file upload functionality',
    estimatedTime: '5-6 minutes'
  },
  {
    name: 'Search Page',
    file: 'knowledge-base/search-page.spec.ts',
    description: 'Tests for intelligent search functionality',
    estimatedTime: '4-5 minutes'
  },
  {
    name: 'Details Page',
    file: 'knowledge-base/details-page.spec.ts',
    description: 'Tests for knowledge base item details view',
    estimatedTime: '3-4 minutes'
  },
  {
    name: 'Edit Page',
    file: 'knowledge-base/edit-page.spec.ts',
    description: 'Tests for editing knowledge base items',
    estimatedTime: '4-5 minutes'
  },
  {
    name: 'Performance',
    file: 'knowledge-base/performance.spec.ts',
    description: 'Performance and load testing',
    estimatedTime: '5-7 minutes'
  },
  {
    name: 'Integration',
    file: 'knowledge-base/integration.spec.ts',
    description: 'End-to-end workflow and integration tests',
    estimatedTime: '8-10 minutes'
  }
]

class KnowledgeTestRunner {
  private results: TestResult[] = []
  private startTime: number = 0
  private reportDir: string = ''

  constructor() {
    this.reportDir = path.join(process.cwd(), 'e2e-results', 'knowledge-base')
    this.ensureReportDirectory()
  }

  private ensureReportDirectory(): void {
    if (!existsSync(this.reportDir)) {
      mkdirSync(this.reportDir, { recursive: true })
    }
  }

  private log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
    const timestamp = new Date().toISOString()
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      reset: '\x1b[0m'     // Reset
    }

    console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`)
  }

  private async runSingleSuite(suite: TestSuite): Promise<TestResult> {
    this.log(`Running ${suite.name} tests...`, 'info')
    this.log(`Description: ${suite.description}`, 'info')
    this.log(`Estimated time: ${suite.estimatedTime}`, 'info')

    const suiteStartTime = Date.now()
    const result: TestResult = {
      suite: suite.name,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: []
    }

    try {
      // Run playwright test for specific suite
      const command = `npx playwright test ${suite.file} --reporter=json`
      const output = execSync(command, {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 600000 // 10 minutes timeout
      })

      // Parse JSON output
      const testOutput = JSON.parse(output)

      // Extract results
      if (testOutput.stats) {
        result.passed = testOutput.stats.passed || 0
        result.failed = testOutput.stats.failed || 0
        result.skipped = testOutput.stats.skipped || 0
      }

      // Extract errors if any
      if (testOutput.errors && testOutput.errors.length > 0) {
        result.errors = testOutput.errors.map((error: any) => error.message || error.toString())
      }

      result.duration = Date.now() - suiteStartTime

      if (result.failed === 0) {
        this.log(`✅ ${suite.name} tests completed successfully`, 'success')
        this.log(`   Passed: ${result.passed}, Duration: ${result.duration}ms`, 'success')
      } else {
        this.log(`❌ ${suite.name} tests completed with failures`, 'error')
        this.log(`   Passed: ${result.passed}, Failed: ${result.failed}, Duration: ${result.duration}ms`, 'error')
      }

    } catch (error) {
      result.failed = 1
      result.errors.push(error instanceof Error ? error.message : String(error))
      result.duration = Date.now() - suiteStartTime

      this.log(`❌ ${suite.name} tests failed to run`, 'error')
      this.log(`   Error: ${result.errors[0]}`, 'error')
    }

    return result
  }

  private generateHTMLReport(): void {
    const totalTests = this.results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0)
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0)
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0)
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0)
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)

    const html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Knowledge Base E2E Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .header h1 { color: #2563eb; font-size: 2.5rem; margin-bottom: 10px; }
        .header .subtitle { color: #6b7280; font-size: 1.2rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .summary-card h3 { font-size: 2rem; margin-bottom: 5px; }
        .summary-card p { color: #6b7280; font-weight: 500; }
        .passed { color: #16a34a; }
        .failed { color: #dc2626; }
        .skipped { color: #d97706; }
        .duration { color: #7c3aed; }
        .suites { display: grid; gap: 20px; }
        .suite { background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .suite-header { padding: 20px; border-bottom: 1px solid #e5e7eb; }
        .suite-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 5px; }
        .suite-stats { display: flex; gap: 20px; margin-top: 10px; }
        .stat { display: flex; align-items: center; gap: 5px; }
        .stat-icon { width: 12px; height: 12px; border-radius: 50%; }
        .errors { padding: 20px; background: #fef2f2; }
        .error-item { background: white; padding: 15px; border-radius: 5px; margin-bottom: 10px; border-left: 4px solid #dc2626; }
        .footer { text-align: center; margin-top: 40px; color: #6b7280; }
        .status-success { background: #dcfce7; border-left: 4px solid #16a34a; }
        .status-error { background: #fef2f2; border-left: 4px solid #dc2626; }
        .status-warning { background: #fef3c7; border-left: 4px solid #d97706; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Knowledge Base E2E Test Report</h1>
            <p class="subtitle">Comprehensive test results for knowledge base functionality</p>
            <p class="subtitle">Generated on ${new Date().toLocaleString('zh-TW')}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3 class="passed">${totalPassed}</h3>
                <p>Tests Passed</p>
            </div>
            <div class="summary-card">
                <h3 class="failed">${totalFailed}</h3>
                <p>Tests Failed</p>
            </div>
            <div class="summary-card">
                <h3 class="skipped">${totalSkipped}</h3>
                <p>Tests Skipped</p>
            </div>
            <div class="summary-card">
                <h3 class="duration">${Math.round(totalDuration / 1000)}s</h3>
                <p>Total Duration</p>
            </div>
        </div>

        <div class="suites">
            ${this.results.map(result => `
                <div class="suite ${result.failed > 0 ? 'status-error' : result.skipped > 0 ? 'status-warning' : 'status-success'}">
                    <div class="suite-header">
                        <div class="suite-title">
                            ${result.failed > 0 ? '❌' : result.skipped > 0 ? '⚠️' : '✅'} ${result.suite}
                        </div>
                        <div class="suite-stats">
                            <div class="stat">
                                <div class="stat-icon" style="background: #16a34a;"></div>
                                <span>${result.passed} passed</span>
                            </div>
                            <div class="stat">
                                <div class="stat-icon" style="background: #dc2626;"></div>
                                <span>${result.failed} failed</span>
                            </div>
                            <div class="stat">
                                <div class="stat-icon" style="background: #d97706;"></div>
                                <span>${result.skipped} skipped</span>
                            </div>
                            <div class="stat">
                                <div class="stat-icon" style="background: #7c3aed;"></div>
                                <span>${Math.round(result.duration / 1000)}s</span>
                            </div>
                        </div>
                    </div>
                    ${result.errors.length > 0 ? `
                        <div class="errors">
                            <h4 style="margin-bottom: 10px; color: #dc2626;">Errors:</h4>
                            ${result.errors.map(error => `
                                <div class="error-item">
                                    <code>${error}</code>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>🤖 Generated by Knowledge Base E2E Test Runner</p>
            <p>Total execution time: ${Math.round((Date.now() - this.startTime) / 1000)} seconds</p>
        </div>
    </div>
</body>
</html>
    `

    const reportPath = path.join(this.reportDir, 'test-report.html')
    writeFileSync(reportPath, html)
    this.log(`📊 HTML report generated: ${reportPath}`, 'success')
  }

  private generateJSONReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0),
        passed: this.results.reduce((sum, r) => sum + r.passed, 0),
        failed: this.results.reduce((sum, r) => sum + r.failed, 0),
        skipped: this.results.reduce((sum, r) => sum + r.skipped, 0),
        duration: this.results.reduce((sum, r) => sum + r.duration, 0),
        success_rate: this.results.reduce((sum, r) => sum + r.passed, 0) / Math.max(1, this.results.reduce((sum, r) => sum + r.passed + r.failed, 0))
      },
      suites: this.results,
      metadata: {
        runner: 'Knowledge Base E2E Test Runner',
        version: '1.0.0',
        platform: process.platform,
        node_version: process.version,
        total_execution_time: Date.now() - this.startTime
      }
    }

    const reportPath = path.join(this.reportDir, 'test-results.json')
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    this.log(`📄 JSON report generated: ${reportPath}`, 'success')
  }

  async runAllTests(options: { suite?: string; parallel?: boolean } = {}): Promise<void> {
    this.startTime = Date.now()

    this.log('🚀 Starting Knowledge Base E2E Test Suite', 'info')
    this.log(`📁 Reports will be saved to: ${this.reportDir}`, 'info')

    let suitesToRun = TEST_SUITES

    // Filter by specific suite if requested
    if (options.suite) {
      suitesToRun = TEST_SUITES.filter(suite =>
        suite.name.toLowerCase().includes(options.suite!.toLowerCase())
      )

      if (suitesToRun.length === 0) {
        this.log(`❌ No test suites found matching: ${options.suite}`, 'error')
        return
      }
    }

    this.log(`📝 Running ${suitesToRun.length} test suite(s)`, 'info')

    // Run tests sequentially (parallel execution can be added later)
    for (const suite of suitesToRun) {
      const result = await this.runSingleSuite(suite)
      this.results.push(result)
    }

    // Generate reports
    this.log('📊 Generating test reports...', 'info')
    this.generateHTMLReport()
    this.generateJSONReport()

    // Summary
    const totalTests = this.results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0)
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0)
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0)
    const totalDuration = Math.round((Date.now() - this.startTime) / 1000)

    this.log('🏁 Test execution completed!', 'info')
    this.log(`📈 Results: ${totalPassed} passed, ${totalFailed} failed out of ${totalTests} total tests`,
      totalFailed === 0 ? 'success' : 'error')
    this.log(`⏱️  Total execution time: ${totalDuration} seconds`, 'info')

    if (totalFailed > 0) {
      this.log('❌ Some tests failed. Check the detailed reports for more information.', 'error')
      process.exit(1)
    } else {
      this.log('✅ All tests passed successfully!', 'success')
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const options: { suite?: string; parallel?: boolean } = {}

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--suite' && i + 1 < args.length) {
      options.suite = args[i + 1]
      i++
    } else if (arg === '--parallel') {
      options.parallel = true
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Knowledge Base E2E Test Runner

Usage: npm run test:e2e:knowledge [options]

Options:
  --suite <name>    Run specific test suite (e.g., navigation, search)
  --parallel        Run tests in parallel (experimental)
  --help, -h        Show this help message

Available test suites:
${TEST_SUITES.map(suite => `  - ${suite.name.toLowerCase()}: ${suite.description}`).join('\n')}

Examples:
  npm run test:e2e:knowledge
  npm run test:e2e:knowledge -- --suite navigation
  npm run test:e2e:knowledge -- --suite search --parallel
      `)
      return
    }
  }

  const runner = new KnowledgeTestRunner()
  await runner.runAllTests(options)
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  })
}

export { KnowledgeTestRunner, TEST_SUITES }