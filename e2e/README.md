# 🧪 Knowledge Base E2E Test Suite

This directory contains comprehensive end-to-end tests for the knowledge base functionality using Playwright.

## 📋 Test Coverage

### Core Functionality Tests
- **Navigation Tests** (`navigation.spec.ts`) - Route handling and page transitions
- **Main Page Tests** (`main-page.spec.ts`) - Knowledge base list and filtering
- **Create Page Tests** (`create-page.spec.ts`) - Document creation workflow
- **Upload Page Tests** (`upload-page.spec.ts`) - File upload and processing
- **Search Page Tests** (`search-page.spec.ts`) - Intelligent search functionality
- **Details Page Tests** (`details-page.spec.ts`) - Document viewing and metadata
- **Edit Page Tests** (`edit-page.spec.ts`) - Document editing and versioning

### Quality Assurance Tests
- **Performance Tests** (`performance.spec.ts`) - Load times, Core Web Vitals, resource usage
- **Integration Tests** (`integration.spec.ts`) - Cross-feature workflows and data flow

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Ensure Playwright browsers are installed
npx playwright install
```

### Running Tests

#### Full Test Suite
```bash
# Run all knowledge base tests with comprehensive reporting
npm run test:e2e:knowledge
```

#### Individual Test Suites
```bash
# Navigation and routing tests
npm run test:e2e:knowledge:navigation

# Main knowledge base page tests
npm run test:e2e:knowledge:main

# Document creation tests
npm run test:e2e:knowledge:create

# File upload functionality tests
npm run test:e2e:knowledge:upload

# Search functionality tests
npm run test:e2e:knowledge:search

# Document details view tests
npm run test:e2e:knowledge:details

# Document editing tests
npm run test:e2e:knowledge:edit

# Performance and load testing
npm run test:e2e:knowledge:performance

# Integration and workflow tests
npm run test:e2e:knowledge:integration
```

#### Quick Testing
```bash
# Run only navigation and main page tests (fastest)
npm run test:e2e:knowledge:quick
```

#### Debug Mode
```bash
# Run with Playwright UI for debugging
npm run test:e2e:ui
```

## 📊 Test Reports

After running tests, comprehensive reports are generated in:
- **HTML Report**: `e2e-results/knowledge-base/test-report.html` - Visual test results dashboard
- **JSON Report**: `e2e-results/knowledge-base/test-results.json` - Machine-readable results

### Report Features
- ✅ Test success/failure statistics
- ⏱️ Performance metrics and timing
- 📈 Success rate trends
- 🐛 Detailed error messages and stack traces
- 📱 Mobile vs desktop test results
- 🔄 Cross-browser compatibility results

## 🧩 Test Architecture

### Page Object Model
Tests use data attributes (`data-testid`) for reliable element selection:
```typescript
// Good - Stable selectors
await page.click('[data-testid="create-button"]')

// Avoid - Fragile selectors
await page.click('.btn-primary')
```

### Test Data Management
- **Fixtures**: Test files and data in `e2e/fixtures/`
- **Authentication**: Shared auth state in `e2e/fixtures/auth.ts`
- **Test Cleanup**: Automatic cleanup of generated test data

### Error Handling
- Graceful handling of network errors
- Timeout management for slow operations
- Screenshot capture on failures
- Video recording for complex scenarios

## 🔧 Configuration

### Playwright Configuration
Configuration in `playwright.config.ts`:
```typescript
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  // ... more config
})
```

### Browser Support
Tests run on:
- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit/Safari (Desktop)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

### Environment Variables
```bash
# Base URL for testing (default: http://localhost:3000)
BASE_URL=http://localhost:3000

# CI environment detection
CI=true
```

## 📋 Test Checklist

### Before Running Tests
- [ ] Application is running on `http://localhost:3000`
- [ ] Database is properly seeded with test data
- [ ] All required services are running
- [ ] Network connection is stable

### Test Categories

#### ✅ Functional Tests
- [ ] Page navigation and routing
- [ ] Form submissions and validations
- [ ] File upload and processing
- [ ] Search functionality
- [ ] CRUD operations
- [ ] User authentication

#### ⚡ Performance Tests
- [ ] Page load times < 5 seconds
- [ ] Search operations < 8 seconds
- [ ] File upload processing < 30 seconds
- [ ] Core Web Vitals within thresholds
- [ ] Memory usage within limits

#### 📱 Responsive Tests
- [ ] Mobile viewport compatibility
- [ ] Touch interactions
- [ ] Responsive layout adaptations
- [ ] Mobile navigation
- [ ] Performance on mobile devices

#### 🔄 Integration Tests
- [ ] Cross-page state management
- [ ] Authentication persistence
- [ ] Data consistency
- [ ] Error recovery
- [ ] Concurrent user scenarios

## 🐛 Debugging Tests

### Running Single Tests
```bash
# Run specific test file
npx playwright test e2e/knowledge-base/navigation.spec.ts

# Run specific test case
npx playwright test e2e/knowledge-base/navigation.spec.ts -g "should navigate to create page"

# Run with debug mode
npx playwright test --debug e2e/knowledge-base/create-page.spec.ts
```

### Debug Features
- **Screenshots**: Captured on failures
- **Videos**: Recorded for failed tests
- **Traces**: Complete interaction traces
- **Console Logs**: Application console output
- **Network Logs**: API request/response monitoring

### Common Issues

#### Test Failures
```bash
# Check if application is running
curl http://localhost:3000

# Verify database connection
npm run db:studio

# Check browser installation
npx playwright install --dry-run
```

#### Timeout Issues
```typescript
// Increase timeout for slow operations
await page.waitForSelector('[data-testid="search-results"]', {
  timeout: 15000
})
```

#### Element Not Found
```typescript
// Wait for element to be visible
await expect(page.locator('[data-testid="submit-button"]')).toBeVisible()

// Check element state before interaction
const button = page.locator('[data-testid="submit-button"]')
await expect(button).toBeEnabled()
await button.click()
```

## 📊 Performance Metrics

### Threshold Targets
- **Page Load Time**: < 5 seconds
- **First Contentful Paint (FCP)**: < 2 seconds
- **Largest Contentful Paint (LCP)**: < 4 seconds
- **Search Operations**: < 8 seconds
- **File Upload Processing**: < 30 seconds
- **Memory Usage**: < 50MB per page

### Monitoring
Performance metrics are automatically collected and reported:
```typescript
// Example performance assertion
const loadTime = Date.now() - startTime
expect(loadTime).toBeLessThan(5000)
```

## 🔒 Security Testing

### Authentication Tests
- Login/logout workflows
- Session persistence
- Protected route access
- Permission-based actions

### Data Protection
- No sensitive data in test reports
- Secure test user credentials
- Proper test data cleanup

## 🚀 CI/CD Integration

### GitHub Actions
Tests can be integrated into CI/CD pipelines:
```yaml
- name: Run Knowledge Base E2E Tests
  run: npm run test:e2e:knowledge
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
```

### Test Environment Setup
```bash
# Start services for testing
npm run services:start

# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Run tests
npm run test:e2e:knowledge
```

## 📚 Writing New Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup for each test
    await page.goto('/dashboard/knowledge')
  })

  test('should perform specific action', async ({ page }) => {
    // Test implementation
    await page.click('[data-testid="action-button"]')
    await expect(page.locator('[data-testid="result"]')).toBeVisible()
  })
})
```

### Best Practices
1. **Use Data Attributes**: Always use `data-testid` for element selection
2. **Wait for States**: Use `waitFor` methods instead of arbitrary timeouts
3. **Descriptive Names**: Write clear, descriptive test names
4. **Independent Tests**: Each test should be able to run independently
5. **Clean Up**: Ensure tests clean up any data they create

### Test Data Guidelines
- Use meaningful test data that reflects real usage
- Avoid hardcoded values; use variables and constants
- Clean up test data after test completion
- Use different test data for different scenarios

## 📞 Support

For issues with the test suite:
1. Check the troubleshooting section above
2. Review test logs and reports
3. Run tests in debug mode
4. Check GitHub issues for similar problems

---

**Generated by Knowledge Base E2E Test Suite v1.0.0**