import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginSecurity from 'eslint-plugin-security'
import globals from 'globals'
import configPrettier from 'eslint-config-prettier'

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-electron/**',
      '**/.vscode/**',
      '**/public/**',
      '**/coverage/**',
      '**/.auto-imports.d.ts',
      '**/.components.d.ts',
      '**/playwright-report/**',
      '**/e2e-results/**',
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  pluginSecurity.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Vue 3 best practices (only using rules that exist in current eslint-plugin-vue)
      'vue/multi-word-component-names': 'warn',
      'vue/no-unused-vars': 'error',
      'vue/no-unused-components': 'error',

      // JavaScript/ES6+ best practices
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',

      // Security plugin adjustments
      // detect-object-injection disabled: original author recommends disabling for CI
      // as it was designed for manual code review assistance and is too noisy
      // See: https://github.com/eslint-community/eslint-plugin-security/issues/21
      'security/detect-object-injection': 'off',
    },
  },
  {
    files: ['electron/**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off', // Allow console in electron main process
      // File paths in Electron main come from trusted file dialogs, not untrusted user input
      // See: https://github.com/eslint-community/eslint-plugin-security/blob/main/docs/rules/detect-non-literal-fs-filename.md
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
  {
    files: ['tests/e2e/**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off', // Allow console in e2e tests
      'no-empty-pattern': 'off', // Allow empty pattern in Playwright fixtures
    },
  },
  configPrettier, // Must be last to override formatting rules
]
