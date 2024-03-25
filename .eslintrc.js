const { defineConfig } = require('eslint-define-config')

module.exports = defineConfig({
    root: true,
    env: {
        node: true,
        browser: true,
        es2021: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended', // typescript-eslint推荐规则,
        // 'plugin:prettier/recommended'
    ],
    rules: {}
})
