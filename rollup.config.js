const path = require('path')
import { defineConfig } from 'rollup'
import dts from 'rollup-plugin-dts'
import { uglify } from 'rollup-plugin-uglify'
import babel from 'rollup-plugin-babel'
import ts from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve'
import json from '@rollup/plugin-json'
import commonjs from 'rollup-plugin-commonjs'

const tsPlugin = ts({
  tsconfig: path.resolve(__dirname, './tsconfig.json'), // 导入本地ts配置
  extensions: ['.js', '.ts', '.tsx', '.json'],
})

const dependencies = [
  'bigint-conversion',
  'flake-idgen',
  // 添加其他需要打包的依赖
]

export default defineConfig([
  {
    input: path.resolve(__dirname, './src/index.ts'),
    output: {
      file: path.resolve(__dirname, './framework/umd/snowflake-id-maker.js'),
      format: 'umd',
      name: 'Transform',
      sourcemap: true,
      globals: {
        'flake-idgen': 'flake-idgen',
        'bigint-conversion': 'bigint-conversion',
      },
    },
    //   external: ['flake-idgen', 'bigint-conversion'], // 声明 'some-library' 是外部依赖
    plugins: [resolve(), commonjs(), tsPlugin, uglify(), babel({ exclude: 'node_modules/**' }), json()],
  },
  {
    input: path.resolve(__dirname, './src/index.ts'),
    output: {
      file: path.resolve(__dirname, './framework/es/snowflake-id-maker.js'),
      format: 'esm',
      name: 'Transform',
      sourcemap: true,
      globals: {
        'flake-idgen': 'flake-idgen',
        'bigint-conversion': 'bigint-conversion',
      },
    },
    //   external: ['flake-idgen', 'bigint-conversion'], // 声明 'some-library' 是外部依赖
    plugins: [resolve(), commonjs(), tsPlugin, uglify(), babel({ exclude: 'node_modules/**' }), json()],
  },
  {
    input: path.resolve(__dirname, './src/index.ts'),
    plugins: [dts()],
    output: {
      format: 'esm',
      file: './index.d.ts',
    },
  },
])
