import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/lib/products.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness(version, assignments = []) {
  const calls = [];
  const state = { version, v3Response: { products: [], pagingMetadata: {} } };
  const query = {
    startsWith(...args) { calls.push(['search', ...args]); return this; },
    ascending(...args) { calls.push(['asc', ...args]); return this; },
    descending(...args) { calls.push(['desc', ...args]); return this; },
    limit(value) { calls.push(['limit', value]); return this; },
    skip(value) { calls.push(['offset', value]); return this; },
    async find() { return { items: [{ _id: 'p1', name: 'Product' }], hasNext: () => true }; },
  };
  const page = (offset) => ({
    items: assignments.slice(offset, offset + 100),
    hasNext: () => offset + 100 < assignments.length,
    next: async () => page(offset + 100),
  });
  const stores = {
    catalogVersioning: { getCatalogVersion: async () => ({ catalogVersion: state.version }) },
    products: { queryProducts: () => query },
    productsV3: {
      SortOrder: { ASC: 'ASC', DESC: 'DESC' },
      RequestedFields: { DIRECT_CATEGORIES_INFO: 'DIRECT_CATEGORIES_INFO' },
      searchProducts: async (search, options) => {
        calls.push(['v3', JSON.parse(JSON.stringify(search)), JSON.parse(JSON.stringify(options))]);
        return state.v3Response;
      },
    },
  };
  const dataQuery = {
    hasSome(field, ids) { calls.push(['assignments', field, [...ids]]); return this; },
    limit() { return this; },
    find: async () => page(0),
  };
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: (name) => {
      if (name === '@wix/stores') return stores;
      if (name === '@wix/data') return { items: { query: () => dataQuery } };
      if (name === './data') return { COLLECTIONS: { productFiles: 'assignments' }, toProductFile: (v) => v };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return { ...exports, calls, state };
}

test('V1 searches and sorts before requesting a bounded deep page', async () => {
  const h = harness('V1_CATALOG');
  const result = await h.listProducts('Prod', 40, 4000, undefined, 'name-desc');
  assert.deepEqual(h.calls.slice(0, 4), [
    ['search', 'name', 'Prod'], ['desc', 'name', '_id'], ['limit', 40], ['offset', 4000],
  ]);
  assert.equal(result.hasNext, true);
  assert.deepEqual(h.calls[4], ['assignments', 'productId', ['p1']]);
});

test('V3 sends nested search, sort and cursor and reads pagingMetadata', async () => {
  const h = harness('V3_CATALOG');
  h.state.v3Response = { products: [{ _id: 'p2', name: 'Tea' }], pagingMetadata: { hasNext: true, cursors: { next: 'next-page' } } };
  const result = await h.listProducts('Tea', 40, 40, 'page-two', 'name-desc');
  assert.deepEqual(h.calls[0], ['v3', {
    search: { expression: 'Tea', fields: ['name'] },
    sort: [{ fieldName: 'name', order: 'DESC' }],
    cursorPaging: { limit: 40, cursor: 'page-two' },
  }, { fields: ['DIRECT_CATEGORIES_INFO'] }]);
  assert.equal(result.nextCursor, 'next-page');
  assert.equal(result.hasNext, true);
});

test('empty V3 final page skips assignment reads', async () => {
  const h = harness('V3_CATALOG');
  const result = await h.listProducts('', 40, 0);
  assert.equal(result.hasNext, false);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0][1].search, undefined);
});

test('assignment counts are not truncated at the former 5,000-row limit', async () => {
  const h = harness('V1_CATALOG', Array.from({ length: 5001 }, () => ({ productId: 'p1' })));
  assert.equal((await h.listProducts('', 40, 0)).products[0].assignedFilesCount, 5001);
});

test('catalog version is resolved per request, not shared across sites', async () => {
  const h = harness('V1_CATALOG');
  await h.listProducts('', 40, 0);
  h.state.version = 'V3_CATALOG';
  assert.equal((await h.listProducts('', 40, 0)).catalogVersion, 'V3_CATALOG');
});

test('invalid pagination never reaches Wix', async () => {
  const h = harness('V1_CATALOG');
  for (const [limit, offset] of [[NaN, 0], [101, 0], [0, 0], [40, -1], [40, 1.5], [40, Infinity]]) {
    await assert.rejects(h.listProducts('', limit, offset), /Invalid product pagination/);
  }
  assert.equal(h.calls.length, 0);
});
