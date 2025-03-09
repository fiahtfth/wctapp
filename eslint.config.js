// @ts-check
import eslint from '@eslint/js';
import * as tseslint from '@typescript-eslint/eslint-plugin';
import * as parser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      eslint.configs.recommended,
    ],
    plugins: {
      '@typescript-eslint': tseslint,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      
      // React-specific rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // General best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'complexity': ['warn', { max: 15 }],
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true }],
    },
  },
  {
    ignores: [
      '.next/',
      'node_modules/',
      'public/',
      'out/',
      'build/',
      'dist/',
      '*.config.js',
      '*.d.ts'
    ],
  }
];
