import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
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
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
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
      'vue/multi-word-component-names': 'warn',
      'vue/no-unused-vars': 'error',
      // 'vue/script-setup-uses-vars' is no longer needed in eslint-plugin-vue >= 9.0
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
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
    },
  },
  configPrettier, // Must be last to override formatting rules
]
