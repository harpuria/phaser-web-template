import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/core/**/*.ts', 'src/services/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)game(/|$)',
              message:
                'Reusable core/services must not import game-specific modules. Pass data or callbacks from app.ts instead.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            ':matches(ImportExpression, TSImportType)[source.value=/(^|\\u002F)game(\\u002F|$)/]',
          message:
            'Reusable core/services must not dynamically import game-specific modules or their types.',
        },
      ],
    },
  },
);
