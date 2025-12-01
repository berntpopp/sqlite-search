# Playwright + Electron Testing Plan

This document outlines the strategy for implementing end-to-end UI testing for the sqlite-search Electron application using Playwright, with CI integration and visual debugging capabilities.

## Overview

Playwright has **experimental Electron support** via Chrome DevTools Protocol (CDP), enabling automated testing of Electron apps including:
- Window interactions
- Menu clicks
- IPC message handling
- Dialog stubbing
- Multi-window testing

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions CI                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Build App    │───>│ Run Playwright│───>│ Upload       │      │
│  │ (electron-   │    │ Tests        │    │ Artifacts    │      │
│  │  builder)    │    │              │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                             │                    │              │
│                             ▼                    ▼              │
│                      ┌─────────────────────────────────┐       │
│                      │ Screenshots / Videos / Traces   │       │
│                      │ • trace.playwright.dev          │       │
│                      │ • GitHub Actions Artifacts      │       │
│                      └─────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Setup Playwright for Electron

#### 1.1 Install Dependencies

```bash
pnpm add -D @playwright/test electron-playwright-helpers
```

#### 1.2 Create Playwright Config

Create `playwright.config.js`:

```javascript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 2,
  use: {
    // Capture artifacts on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  outputDir: 'test-results/',
})
```

#### 1.3 Create Electron Test Fixture

Create `e2e/fixtures/electron.js`:

```javascript
import { test as base, _electron } from '@playwright/test'
import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers'
import path from 'path'

export const test = base.extend({
  electronApp: async ({}, use) => {
    // Find the latest build
    const latestBuild = findLatestBuild('release')
    const appInfo = parseElectronApp(latestBuild)

    // Launch Electron
    const electronApp = await _electron.launch({
      args: [appInfo.main],
      executablePath: appInfo.executable,
      recordVideo: { dir: 'test-videos' },
    })

    await use(electronApp)
    await electronApp.close()
  },

  window: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow()
    // Set consistent viewport for screenshots
    await window.setViewportSize({ width: 1280, height: 720 })
    await use(window)
  },
})

export { expect } from '@playwright/test'
```

### Phase 2: Write E2E Tests

#### 2.1 Basic App Launch Test

Create `e2e/app-launch.spec.js`:

```javascript
import { test, expect } from './fixtures/electron.js'

test.describe('Application Launch', () => {
  test('should launch and show main window', async ({ window }) => {
    // Wait for app to be ready
    await window.waitForLoadState('domcontentloaded')

    // Verify title
    const title = await window.title()
    expect(title).toContain('sqlite-search')

    // Take screenshot for visual verification
    await window.screenshot({ path: 'test-results/app-launch.png' })
  })
})
```

#### 2.2 FTS5 Search Tests

Create `e2e/search.spec.js`:

```javascript
import { test, expect } from './fixtures/electron.js'

test.describe('FTS5 Search Functionality', () => {
  test('should perform basic search', async ({ window }) => {
    // Wait for app initialization
    await window.waitForSelector('[data-testid="search-input"]')

    // Enter search term
    await window.fill('[data-testid="search-input"]', 'BRCA1')
    await window.click('[data-testid="search-button"]')

    // Wait for results
    await window.waitForSelector('[data-testid="results-table"]')

    // Screenshot results
    await window.screenshot({ path: 'test-results/search-results.png' })
  })

  test('should handle boolean operators', async ({ window }) => {
    await window.fill('[data-testid="search-input"]', 'BRCA1 AND NM_007294.4')
    await window.click('[data-testid="search-button"]')

    // Verify no syntax error
    const errorMessage = await window.locator('[data-testid="error-message"]')
    await expect(errorMessage).not.toBeVisible()

    await window.screenshot({ path: 'test-results/boolean-search.png' })
  })
})
```

### Phase 3: GitHub Actions CI Integration

#### 3.1 Create Workflow

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install

      - name: Build application
        run: pnpm run build && pnpm run build:dist

      - name: Run Playwright tests
        run: pnpm exec playwright test

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-results-windows
          path: |
            test-results/
            playwright-report/
            test-videos/
          retention-days: 30

  test-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install

      - name: Build application
        run: pnpm run build && pnpm run build:dist

      - name: Run Playwright tests
        run: pnpm exec playwright test

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-results-macos
          path: |
            test-results/
            playwright-report/
            test-videos/
          retention-days: 30

  test-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install

      - name: Build application
        run: pnpm run build && pnpm run build:dist

      - name: Run Playwright tests (with xvfb)
        run: xvfb-run --auto-servernum -- pnpm exec playwright test

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-results-linux
          path: |
            test-results/
            playwright-report/
            test-videos/
          retention-days: 30
```

### Phase 4: Visual Debugging for AI/Claude

#### 4.1 Trace Viewer Integration

Playwright traces can be viewed at [trace.playwright.dev](https://trace.playwright.dev) - upload the trace file and share the URL.

Configure trace capture in `playwright.config.js`:

```javascript
export default defineConfig({
  use: {
    trace: 'on', // Always capture traces
  },
})
```

#### 4.2 Screenshot Upload to GitHub Pages

Create a workflow to publish screenshots to GitHub Pages for easy viewing:

```yaml
# .github/workflows/publish-screenshots.yml
name: Publish Screenshots

on:
  workflow_run:
    workflows: ["E2E Tests"]
    types: [completed]

jobs:
  publish:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' || github.event.workflow_run.conclusion == 'failure' }}
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          pattern: playwright-results-*
          merge-multiple: true

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./playwright-report
```

Screenshots will be available at: `https://<username>.github.io/<repo>/`

#### 4.3 Artifact Download Script

Create a script to fetch latest screenshots:

```javascript
// scripts/fetch-screenshots.js
import { Octokit } from '@octokit/rest'
import fs from 'fs'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

async function fetchLatestScreenshots() {
  const { data: artifacts } = await octokit.actions.listArtifactsForRepo({
    owner: 'berntpopp',
    repo: 'sqlite-search',
    per_page: 10,
  })

  const screenshotArtifact = artifacts.artifacts.find(a =>
    a.name.startsWith('playwright-results')
  )

  if (screenshotArtifact) {
    const download = await octokit.actions.downloadArtifact({
      owner: 'berntpopp',
      repo: 'sqlite-search',
      artifact_id: screenshotArtifact.id,
      archive_format: 'zip',
    })

    // Save and extract...
    console.log(`Downloaded ${screenshotArtifact.name}`)
  }
}
```

### Phase 5: Alternative Solutions for AI Viewing

#### 5.1 Option A: GitHub Actions + Screenshots in PR Comments

Use a bot to post screenshots directly in PR comments:

```yaml
- name: Post screenshots to PR
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const screenshots = fs.readdirSync('test-results')
        .filter(f => f.endsWith('.png'));

      let body = '## E2E Test Screenshots\n\n';
      for (const screenshot of screenshots) {
        // Upload to artifact and reference
        body += `### ${screenshot}\n`;
        body += `![${screenshot}](link-to-uploaded-image)\n\n`;
      }

      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body
      });
```

#### 5.2 Option B: Cloud Screenshot Service

Use a service like [Percy](https://percy.io) or [Argos](https://argos-ci.com) for visual regression testing:

```javascript
// With Percy
import percySnapshot from '@percy/playwright'

test('visual test', async ({ window }) => {
  await percySnapshot(window, 'Homepage')
})
```

#### 5.3 Option C: Self-Hosted Playwright UI Mode

For local development, use Playwright UI mode:

```bash
pnpm exec playwright test --ui
```

This opens an interactive UI showing all tests, screenshots, and traces.

## Data Test IDs

Add `data-testid` attributes to key components for reliable test selectors:

```vue
<!-- SearchInput.vue -->
<v-text-field
  data-testid="search-input"
  v-model="searchTerm"
/>
<v-btn data-testid="search-button">Search</v-btn>

<!-- ResultsTable.vue -->
<v-data-table data-testid="results-table" />

<!-- Error display -->
<v-alert data-testid="error-message" v-if="error" />
```

## Package.json Scripts

Add test scripts:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

## Resources

- [Playwright Electron Documentation](https://playwright.dev/docs/api/class-electron)
- [electron-playwright-helpers](https://www.npmjs.com/package/electron-playwright-helpers)
- [electron-playwright-e2e-test-quick-start](https://github.com/tanshuai/electron-playwright-e2e-test-quick-start)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Testing Electron with Playwright - Simon Willison](https://til.simonwillison.net/electron/testing-electron-playwright)
- [Playwright CI Guide](https://playwright.dev/docs/ci)

## Summary

| Approach | Pros | Cons |
|----------|------|------|
| GitHub Actions + Artifacts | Free, integrated | Manual download |
| GitHub Pages Screenshots | Easy URL sharing | Requires setup |
| trace.playwright.dev | Interactive, detailed | Upload required |
| Percy/Argos | Visual regression | Paid for larger projects |
| Self-hosted UI Mode | Full interactivity | Local only |

### Recommended Implementation Order

1. **Phase 1**: Set up Playwright + electron-playwright-helpers
2. **Phase 2**: Write core E2E tests with screenshots
3. **Phase 3**: GitHub Actions CI with artifact upload
4. **Phase 4**: GitHub Pages for screenshot hosting
5. **Phase 5**: Optional visual regression service

This approach allows Claude (or any reviewer) to:
1. View screenshots via GitHub Pages URLs
2. Download and view Playwright HTML reports
3. Open traces at trace.playwright.dev
4. Review test videos for debugging

## Next Steps

- [ ] Install Playwright dependencies
- [ ] Add data-testid attributes to Vue components
- [ ] Create Electron test fixtures
- [ ] Write initial E2E tests
- [ ] Set up GitHub Actions workflow
- [ ] Configure GitHub Pages for screenshots
