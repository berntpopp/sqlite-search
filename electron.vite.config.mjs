import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/main/index.js')
        },
        output: {
          format: 'es'
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron/preload',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/preload/index.js')
        },
        output: {
          format: 'es'
        }
      }
    }
  },
  renderer: {
    root: '.',
    publicDir: 'public',
    build: {
      outDir: 'dist-electron/renderer',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html')
        }
      }
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    plugins: [
      vue(),
      vuetify({
        autoImport: true,
        styles: {
          configFile: 'src/styles/settings.scss'
        }
      }),
      Components({
        dts: true,
        dirs: ['src/components'],
        resolvers: []
      }),
      AutoImport({
        imports: [
          'vue',
          'pinia',
          {
            vuetify: ['useTheme', 'useDisplay']
          }
        ],
        dts: 'src/auto-imports.d.ts',
        eslintrc: {
          enabled: true
        }
      })
    ]
  }
})
