import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { build } from 'esbuild';
import ts from 'typescript';

const bundled = await build({ entryPoints: ['src/lib/translations.ts'], bundle: true, write: false, platform: 'node', format: 'esm' });
const { dictionaries, translate, SUPPORTED_LANGUAGES, isLocale, localeDirection } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const tokens = (text) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();

test('every language includes every English message and preserves interpolation tokens', () => {
  assert.equal(SUPPORTED_LANGUAGES.length, 20);
  for (const [locale] of SUPPORTED_LANGUAGES) {
    for (const [key, english] of Object.entries(dictionaries.en)) {
      assert.ok(dictionaries[locale][key]?.trim(), `${locale} is missing ${key}`);
      assert.deepEqual(tokens(dictionaries[locale][key]), tokens(english), `${locale}: ${key}`);
    }
  }
});

test('literal translation calls in every dashboard component have dictionary entries', () => {
  const filenames = readdirSync('src/components/dashboard').filter((file) => file.endsWith('.tsx')).map((file) => `src/components/dashboard/${file}`);
  filenames.push('src/components/ui/dialog.tsx', 'src/components/ui/sheet.tsx');
  for (const filename of filenames) {
    const source = ts.createSourceFile(filename, readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node) => {
      const brandLabels = new Set(['Wix Media Manager', 'Cloudinary', 'SKU']);
      if (ts.isJsxText(node) && /[A-Za-z]/.test(node.text)) {
        assert.ok(brandLabels.has(node.text.trim()), `${filename}: untranslated JSX text ${node.text.trim()}`);
      }
      if (ts.isJsxAttribute(node) && ['label', 'title', 'description', 'hint', 'placeholder', 'aria-label'].includes(node.name.getText(source)) && node.initializer && ts.isStringLiteral(node.initializer) && /[A-Za-z]/.test(node.initializer.text)) {
        assert.ok(brandLabels.has(node.initializer.text) || node.initializer.text === 'US, GB, NG', `${filename}: untranslated ${node.name.getText(source)} ${node.initializer.text}`);
      }
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const key = node.arguments[0].text;
        assert.ok(Object.hasOwn(dictionaries.en, key), `${filename}: missing ${key}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
});

test('fallbacks are readable and interpolation never interprets user content', () => {
  assert.equal(translate('Unknown server error', 'es'), 'Unknown server error');
  assert.equal(translate('Files: {{count}}', 'en', { count: 5 }), 'Files: 5');
  assert.equal(translate('Unknown {{name}}', 'en', { name: '$& {{count}}' }), 'Unknown $& {{count}}');
  assert.equal(translate('Unknown {{name}}', 'en'), 'Unknown {{name}}');
  assert.equal(isLocale('invalid'), false);
  assert.equal(isLocale('es'), true);
  assert.equal(localeDirection('ar'), 'rtl');
  assert.equal(localeDirection('ur'), 'rtl');
  assert.equal(localeDirection('es'), 'ltr');
});
