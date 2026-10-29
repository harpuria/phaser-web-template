import { ESLint } from 'eslint';
import { expect, it } from 'vitest';

const eslint = new ESLint();
const imports = [
  "import '../game/assets';",
  "import type { Progress } from '../game/save'; export type Save = Progress;",
  "export { progressSchema } from '../game/save';",
  "export * from '../game/save';",
  "void import('../game/assets');",
  "export type Save = import('../game/save').Progress;",
];

it.each(['src/core/boundary.ts', 'src/services/boundary.ts'])(
  'rejects game imports from %s',
  async (filePath) => {
    for (const source of imports) {
      const [result] = await eslint.lintText(source, { filePath });
      expect(
        result?.messages.some((message) =>
          ['no-restricted-imports', 'no-restricted-syntax'].includes(
            message.ruleId ?? '',
          ),
        ),
        source,
      ).toBe(true);
    }
  },
);

it('allows game composition and reusable dependencies', async () => {
  for (const [filePath, source] of [
    ['src/app.ts', "import './game/save';"],
    ['src/game/scenes.ts', "import '../core/input';"],
    ['src/core/boundary.ts', "import './store';"],
    ['src/services/boundary.ts', "import '../core/store';"],
  ]) {
    const [result] = await eslint.lintText(source!, { filePath: filePath! });
    expect(result?.errorCount).toBe(0);
  }
});
