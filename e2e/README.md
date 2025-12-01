# E2E Testing with Playwright

End-to-end testing for the sqlite-search Electron application using Playwright.

## Prerequisites

- **Windows 10/11** (PowerShell)
- **Node.js** >= 20.16.0
- **pnpm** >= 9.0.0

> **Important**: E2E tests must be run in PowerShell on Windows, NOT in WSL2.
> Electron requires a display server which WSL2 doesn't reliably provide.

## Quick Start (PowerShell)

```powershell
# 1. Open PowerShell (not WSL2)
# 2. Navigate to project directory
cd C:\development\sqlite-search

# 3. Install dependencies
pnpm install

# 4. Build the application
pnpm run build

# 5. Run E2E tests
pnpm run test:e2e
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm run test:e2e` | Run all E2E tests |
| `pnpm run test:e2e:headed` | Run tests with visible browser window |
| `pnpm run test:e2e:ui` | Open Playwright UI mode (interactive) |
| `pnpm run test:e2e:debug` | Run tests in debug mode |

## Test Structure

```
e2e/
├── fixtures/
│   └── electron.js      # Electron test fixtures (app launch, window)
├── app-launch.spec.js   # Application launch tests
├── search.spec.js       # Search functionality tests
└── README.md            # This file
```

## Testing Against Built App

By default, tests run against the development build (`dist-electron/`).

To test the packaged application (closer to production):

```powershell
# Build the distributable first
pnpm run build:dist

# Run tests against built app
$env:TEST_BUILT_APP="true"
pnpm run test:e2e
```

## Test Artifacts

After running tests, artifacts are saved to:

- `e2e-results/` - Test results, screenshots, videos
- `playwright-report/` - HTML test report

### Viewing the Report

```powershell
# Open the HTML report in browser
npx playwright show-report playwright-report
```

### Viewing Traces

Failed tests capture traces that can be viewed at [trace.playwright.dev](https://trace.playwright.dev):

1. Find the trace file in `e2e-results/`
2. Go to https://trace.playwright.dev
3. Drag and drop the `.zip` trace file

## Writing Tests

### Using Test Fixtures

```javascript
import { test, expect } from './fixtures/electron.js'

test('my test', async ({ window, takeScreenshot }) => {
  // window - the main Electron browser window
  // takeScreenshot - helper to capture screenshots

  await window.locator('[data-testid="search-input"]').fill('test')
  await takeScreenshot('my-test')
})
```

### Available Fixtures

| Fixture | Description |
|---------|-------------|
| `electronApp` | The Electron application instance |
| `window` | The main browser window (Page object) |
| `takeScreenshot` | Helper function to capture named screenshots |

### Data Test IDs

Use `data-testid` attributes to locate elements reliably:

| Element | Test ID |
|---------|---------|
| Search input | `search-input` |
| Search button | `search-button` |
| Table selector | `table-selector` |
| Column selector | `column-selector` |
| Results card | `results-card` |
| Results table | `results-table` |
| Results count | `results-count` |

### Example Test

```javascript
test('should perform search', async ({ window }) => {
  // Wait for app to be ready
  await window.waitForTimeout(2000)

  // Fill search input
  const searchInput = window.locator('[data-testid="search-input"]')
  await searchInput.fill('BRCA1 AND NM_007294.4')

  // Click search button
  await window.locator('[data-testid="search-button"]').click()

  // Wait for results
  await window.waitForSelector('[data-testid="results-table"]', {
    timeout: 10000
  })

  // Verify results exist
  const resultsTable = window.locator('[data-testid="results-table"]')
  await expect(resultsTable).toBeVisible()
})
```

## Troubleshooting

### Tests fail with "Cannot find module"

Make sure dependencies are installed:

```powershell
pnpm install
```

### Tests timeout on launch

1. Ensure the app is built:
   ```powershell
   pnpm run build
   ```

2. If testing built app, ensure it's packaged:
   ```powershell
   pnpm run build:dist
   ```

### "No display" errors

You're likely running in WSL2. Switch to PowerShell:

```powershell
# Open PowerShell (not WSL2 terminal)
cd C:\development\sqlite-search
pnpm run test:e2e
```

### Tests pass locally but fail in CI

- Check GitHub Actions artifacts for screenshots and videos
- CI runs on fresh machines; ensure all dependencies are declared
- Linux CI uses `xvfb` for display emulation

## CI Integration

E2E tests run automatically on:
- Push to `main` branch
- Pull requests to `main`
- Push to `feature/**` branches

Results are uploaded as artifacts and retained for 30 days.

See `.github/workflows/e2e-tests.yml` for configuration.

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Electron API](https://playwright.dev/docs/api/class-electron)
- [electron-playwright-helpers](https://www.npmjs.com/package/electron-playwright-helpers)
