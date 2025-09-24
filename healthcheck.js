#!/usr/bin/env node

/**
 * Health Check Script for Production Container
 *
 * This script performs basic health checks on the running application
 * to ensure all critical services are operational.
 */

const http = require('http');

const HEALTH_CHECK_PORT = process.env.PORT || 3000;
const HEALTH_CHECK_HOST = process.env.HOST || 'localhost';
const HEALTH_CHECK_TIMEOUT = parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000');

/**
 * Perform HTTP health check
 */
function performHealthCheck() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: HEALTH_CHECK_HOST,
      port: HEALTH_CHECK_PORT,
      path: '/api/health',
      method: 'GET',
      timeout: HEALTH_CHECK_TIMEOUT
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const healthData = JSON.parse(data);
            if (healthData.status === 'healthy') {
              resolve(healthData);
            } else {
              reject(new Error(`Health check failed: ${healthData.message || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Health check response parsing failed: ${error.message}`));
          }
        } else {
          reject(new Error(`Health check returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Health check request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Health check timed out after ${HEALTH_CHECK_TIMEOUT}ms`));
    });

    req.end();
  });
}

/**
 * Additional system checks
 */
function performSystemChecks() {
  const checks = {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    version: process.version,
    pid: process.pid
  };

  // Check memory usage (warn if RSS > 500MB)
  const memoryUsageMB = checks.memory.rss / 1024 / 1024;
  if (memoryUsageMB > 500) {
    console.warn(`⚠️ High memory usage: ${memoryUsageMB.toFixed(2)}MB`);
  }

  return checks;
}

/**
 * Main health check execution
 */
async function main() {
  const startTime = Date.now();

  try {
    console.log('🔍 Starting health check...');

    // Perform HTTP health check
    const healthResult = await performHealthCheck();
    console.log('✅ HTTP health check passed');

    // Perform system checks
    const systemChecks = performSystemChecks();
    console.log('✅ System checks completed');

    // Calculate check duration
    const duration = Date.now() - startTime;

    console.log('🎉 Health check successful');
    console.log(`📊 Check duration: ${duration}ms`);
    console.log(`💾 Memory usage: ${(systemChecks.memory.rss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`⏱️ Uptime: ${Math.floor(systemChecks.uptime)}s`);

    // Exit with success code
    process.exit(0);

  } catch (error) {
    console.error('❌ Health check failed:', error.message);

    // Log additional debug information
    console.error('🔍 Debug information:');
    console.error(`  - Host: ${HEALTH_CHECK_HOST}`);
    console.error(`  - Port: ${HEALTH_CHECK_PORT}`);
    console.error(`  - Timeout: ${HEALTH_CHECK_TIMEOUT}ms`);
    console.error(`  - Process PID: ${process.pid}`);
    console.error(`  - Node.js version: ${process.version}`);

    // Exit with error code
    process.exit(1);
  }
}

// Handle process signals gracefully
process.on('SIGTERM', () => {
  console.log('📡 Received SIGTERM, exiting health check gracefully');
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('📡 Received SIGINT, exiting health check gracefully');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception in health check:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection in health check:', reason);
  process.exit(1);
});

// Run the health check
main();