import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Variables no utilizadas
      'no-unused-vars': ['error', { 
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      
      // Prevenir variables no declaradas (como el error de 'today')
      'no-undef': 'error',
      
      // Prevenir uso de variables antes de declaración
      'no-use-before-define': ['error', { 
        functions: false, 
        classes: true, 
        variables: true 
      }],
      
      // Prevenir redeclaración de variables
      'no-redeclare': 'error',
      
      // Prevenir variables no inicializadas
      'no-undef-init': 'error',
      
      // Prevenir variables globales no declaradas
      'no-implicit-globals': 'error',
      
      // Prevenir funciones no declaradas
      'no-caller': 'error',
      
      // Prevenir eval y similares
      'no-eval': 'error',
      'no-implied-eval': 'error',
      
      // Prevenir console.log en producción (warning)
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      
      // Reglas de React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Prevenir imports no utilizados
      'no-unused-imports': 'off', // Se maneja con no-unused-vars
      
      // Prevenir código muerto
      'no-unreachable': 'error',
      
      // Prevenir comparaciones con NaN
      'use-isnan': 'error',
      
      // Prevenir typeof con undefined
      'valid-typeof': 'error'
    },
  },
])
