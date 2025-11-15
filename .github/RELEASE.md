# Release Process

This document describes how to create releases for sqlite-search using the automated CI/CD pipeline.

## Automated Build Pipeline

The project uses GitHub Actions to automatically build and release the application for Windows, macOS, and Linux.

### Workflows

#### 1. Build Workflow (`.github/workflows/build.yml`)

**Triggers:**

- Push to `main` branch
- Push to any `feat/**` branch
- Pull requests to `main`

**Actions:**

- Runs on all three platforms (Windows, macOS, Linux)
- Installs dependencies with pnpm
- Runs linter and type checker
- Builds the Vue/Electron app
- Creates test builds (without code signing)

**Purpose:** Ensures code quality and that builds work on all platforms before merging.

#### 2. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**

- Push of version tags (e.g., `v0.4.0`, `v1.0.0`)

**Actions:**

- Builds production-ready installers for all platforms
- Publishes artifacts to GitHub Releases
- Uploads installers as downloadable assets

**Purpose:** Automates the release process when you tag a new version.

## Creating a Release

### Step 1: Update Version

Update the version in `package.json`:

```json
{
  "version": "0.5.0"
}
```

### Step 2: Commit Changes

```bash
git add package.json
git commit -m "chore: bump version to 0.5.0"
```

### Step 3: Create and Push Tag

```bash
git tag v0.5.0
git push origin main
git push origin v0.5.0
```

### Step 4: Monitor Build

1. Go to the [Actions tab](https://github.com/berntpopp/sqlite-search/actions) on GitHub
2. Watch the "Release" workflow execute
3. Wait for all platform builds to complete (typically 10-20 minutes)

### Step 5: Publish Release

1. Go to [Releases](https://github.com/berntpopp/sqlite-search/releases)
2. Find the draft release created by the workflow
3. Review the artifacts:
   - **Windows:** `.exe` installer (NSIS)
   - **macOS:** `.dmg` installer
   - **Linux:** `.AppImage` and `.deb` files
4. Edit the release notes if needed
5. Click "Publish release"

## Downloadable Artifacts

After publishing, users can download installers from:

```
https://github.com/berntpopp/sqlite-search/releases/latest
```

### Platform-Specific Downloads

- **Windows:** `sqlite-search-Setup-{version}.exe`
- **macOS:** `sqlite-search-{version}.dmg` (requires macOS 10.13+)
- **Linux:** `sqlite-search-{version}.AppImage` (universal)
- **Linux (Debian/Ubuntu):** `sqlite-search_{version}_amd64.deb`

## Code Signing (Optional)

Currently, releases are built without code signing. To enable code signing:

### Windows Code Signing

Add these secrets to your repository:

- `WINDOWS_CERTS`: Base64-encoded `.pfx` certificate file
- `WINDOWS_CERTS_PASSWORD`: Certificate password

### macOS Code Signing

Add these secrets to your repository:

- `MAC_CERTS`: Base64-encoded `.p12` certificate file
- `MAC_CERTS_PASSWORD`: Certificate password

**To add secrets:**

1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its name and value

## Auto-Updates

The app is configured to check for updates from GitHub Releases. Users will be notified when new versions are available.

## Troubleshooting

### Build Fails on One Platform

- Check the Actions log for specific errors
- Platform-specific issues won't block other platforms
- You can manually re-run failed jobs

### Release Not Created

- Ensure the tag starts with `v` (e.g., `v1.0.0`, not `1.0.0`)
- Check that the tag was pushed to the remote repository
- Verify the workflow file syntax is correct

### Missing Artifacts

- Ensure the build completed successfully
- Check that the `dist` directory contains the expected files
- Verify electron-builder configuration in `package.json`

## Best Practices

1. **Always test builds** locally before tagging a release
2. **Use semantic versioning**: `MAJOR.MINOR.PATCH`
3. **Write clear release notes** describing changes
4. **Test installers** on each platform before publishing
5. **Keep dependencies updated** for security

## Manual Build (Local)

To build locally for testing:

```bash
# Install dependencies
pnpm install

# Build for current platform
pnpm run build
pnpm run build:dist

# Output will be in the `dist` directory
```

## Additional Resources

- [electron-builder Documentation](https://www.electron.build/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
