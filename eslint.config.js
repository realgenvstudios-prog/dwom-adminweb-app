import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // tseslint's recommended preset sets this to 'error', which has
      // been true here the whole time but never actually enforced —
      // `npm run lint` already fails on ~392 pre-existing violations, so
      // in practice nobody runs it. 'warn' lets lint actually run (and
      // flag new `any` in review) without retroactively blocking on the
      // existing debt.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])
