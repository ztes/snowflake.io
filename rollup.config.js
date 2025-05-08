import path from 'path'
import { defineConfig } from 'rollup'
import dts from 'rollup-plugin-dts'
import { babel } from '@rollup/plugin-babel'
import ts from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { terser } from 'rollup-plugin-terser'

export default defineConfig([
  // 1. ESM 输出（现代浏览器/Node.js ESM）
  {
    input: path.resolve(__dirname, './src/index.ts'),
    output: {
      file: path.resolve(__dirname, './framework/es/snowflake.io.js'),
      format: 'esm',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      resolve({ extensions: ['.ts', '.js'] }),
      commonjs(),
      ts({
        tsconfig: path.resolve(__dirname, './tsconfig.json'),
        useTsconfigDeclarationDir: true,
      }),
      babel({
        babelHelpers: 'bundled',
        presets: [['@babel/preset-env', { modules: false }]],
        extensions: ['.ts', '.js'],
      }),
      terser({ module: true }),
      json(),
    ],
  },

  // 2. CJS 输出（Node.js CommonJS）
  {
    input: path.resolve(__dirname, './src/index.ts'),
    output: {
      file: path.resolve(__dirname, './framework/cjs/snowflake.io.cjs'), // 使用 .cjs 扩展名
      format: 'cjs',
      exports: 'auto',
      sourcemap: true,
    },
    plugins: [
      resolve({ extensions: ['.ts', '.js'] }),
      commonjs(),
      ts({
        tsconfig: path.resolve(__dirname, './tsconfig.json'),
        useTsconfigDeclarationDir: true,
      }),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env'],
        extensions: ['.ts', '.js'],
      }),
      terser(),
      json(),
    ],
  },

  // 3. 类型声明（.d.ts）
  {
    input: path.resolve(__dirname, './src/index.ts'),
    output: {
      file: path.resolve(__dirname, './framework/es/index.d.ts'),
      format: 'esm',
    },
    plugins: [dts()],
  },
])
