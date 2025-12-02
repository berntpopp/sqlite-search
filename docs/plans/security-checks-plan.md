# Security and Dependency Checks Plan

## Current State

### Already Configured
- **Dependabot** (`.github/dependabot.yml`): Weekly npm and GitHub Actions updates with grouping

### Missing
- No `pnpm audit` in CI pipeline
- No GitHub CodeQL scanning
- No ESLint security plugin
- No Electron-specific security checks

## Implementation Plan

### Phase 1: Add pnpm audit to CI (High Priority)

Add vulnerability scanning to the existing build workflow:

```yaml
- name: Security audit
  run: pnpm audit --audit-level=high
```

**Rationale**: Catches known vulnerabilities in dependencies before merge. Use `--audit-level=high` to avoid failing on low/moderate issues that may have no fixes available.

### Phase 2: Add GitHub CodeQL (High Priority)

Create `.github/workflows/codeql.yml`:

```yaml
name: CodeQL

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'  # Weekly Monday 6 AM

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v6
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript
      - uses: github/codeql-action/analyze@v3
```

**Rationale**: GitHub's SAST tool catches security issues like XSS, SQL injection, and insecure patterns in JavaScript/TypeScript code.

### Phase 3: Add ESLint Security Plugin (Medium Priority)

Install and configure `eslint-plugin-security`:

1. Install: `pnpm add -D eslint-plugin-security`
2. Update `eslint.config.js`:
   ```javascript
   import security from 'eslint-plugin-security'
   // Add to flat config
   security.configs.recommended
   ```

**Rationale**: Catches insecure code patterns during linting (eval, child_process without sanitization, etc.).

### Phase 4: Electron Security Audit (Low Priority, Optional)

Consider adding `@aspect-apps/electronegativity-cli` for Electron-specific checks:

```bash
pnpm add -D @aspect-apps/electronegativity-cli
npx electronegativity -i ./electron
```

**Rationale**: Checks for Electron security misconfigurations (contextIsolation, nodeIntegration, etc.). Note: This project already follows Electron security best practices with contextIsolation enabled.

## Implementation Order

1. **Phase 1**: pnpm audit in build.yml - immediate value, minimal effort
2. **Phase 2**: CodeQL workflow - comprehensive SAST, GitHub-native
3. **Phase 3**: ESLint security plugin - catches issues at development time
4. **Phase 4**: Electronegativity - optional, Electron-specific (project already secure)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/build.yml` | Modify | Add pnpm audit step |
| `.github/workflows/codeql.yml` | Create | CodeQL security scanning |
| `eslint.config.js` | Modify | Add security plugin |
| `package.json` | Modify | Add eslint-plugin-security |

## Success Criteria

- [ ] pnpm audit runs on every PR
- [ ] CodeQL scans on push/PR to main
- [ ] ESLint security rules enabled
- [ ] No high/critical vulnerabilities in dependencies
- [ ] Security tab in GitHub repo shows CodeQL results
