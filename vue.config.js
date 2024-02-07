// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,

  pluginOptions: {
    vuetify: {
			// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
		},
      //based on https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/1588
    electronBuilder: {
        preload: 'src/preload.js',
      builderOptions: {
        extraResources: ['src', 'src/res/', 'src/db/'],
        icon: 'public/logo.png',
      },
      externals: ['knex', 'sqlite3'],
    },
  }
})