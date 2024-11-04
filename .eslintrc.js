module.exports = {
    env: {
      node: true,
      es2021: true,
      jest: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:prettier/recommended',
    ],
    parserOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prettier/prettier': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
    ignorePatterns: ['node_modules/', 'dist/', 'coverage/'],
  };