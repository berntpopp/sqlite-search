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
      // Vue 3 Composition API best practices
      'vue/component-api-style': ['error', ['script-setup']], // Enforce <script setup>
      'vue/multi-word-component-names': 'warn',
      'vue/no-unused-vars': 'error',
      'vue/no-setup-props-destructure': 'error', // Prevent props destructuring loss of reactivity
      'vue/no-deprecated-destroyed-lifecycle': 'error',
      'vue/no-deprecated-dollar-listeners-api': 'error',
      'vue/no-deprecated-dollar-scopedslots-api': 'error',
      'vue/no-v-for-template-key-on-child': 'error', // Vue 3 key placement
      'vue/valid-v-memo': 'error',
      'vue/require-explicit-emits': 'error', // Require explicit emits definition
      'vue/prefer-import-from-vue': 'error',

      // Code organization
      'vue/component-tags-order': [
        'error',
        {
          order: ['template', 'script', 'style'],
        },
      ],
      'vue/block-lang': [
        'error',
        {
          script: { lang: 'js' }, // Can be changed to 'ts' when fully migrated
        },
      ],

      // Best practices
      'vue/no-unused-components': 'error',
      'vue/no-useless-v-bind': 'error',
      'vue/no-useless-template-attributes': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',
      'vue/v-on-event-hyphenation': ['error', 'always'],
      'vue/attribute-hyphenation': ['error', 'always'],

      // JavaScript/ES6+ best practices
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
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
