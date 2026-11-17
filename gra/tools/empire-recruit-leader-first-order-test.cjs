'use strict';
/**
 * empire-recruit-leader-first-order-test.cjs — R-WEB-UI-RECRUIT-LEADER-FIRST-ABOVE-MASS-Q1
 *
 * Statyczny dowód kolejności sekcji „Rekrutacja” (renderMassRecruitmentSection) z kodu produkcyjnego:
 *   nagłówek → wódz ([data-general-recruitment-card]) → „Idź do wodza” ([data-recruit-follow-general])
 *   → masowa rekrutacja ([data-erp-root]) → liczniki / pula / „Rekrutuj wszystko” / miasta.
 * Sprawdzane zarówno bez miast (rows.length === 0), jak i z miastami.
 * Mutacja: stara kolejność (erp przed wodzem) daje FAIL na asercji „erp > follow”.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { JSDOM } = require(path.join(__dirname, '..', 'node_modules', 'jsdom'));

const root = path.resolve(__dirname, '..');
async function main() {
  const built = await esbuild.build({
    stdin: { contents: "export { configureEmpireMassRecruitment, renderMassRecruitmentSection } from './src/ui/empireDetailPanel.ts';", resolveDir: root, sourcefile: 'leader-first-entry.ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020', write: false, logLevel: 'silent',
    plugins: [{ name: 'brand-assets-stub', setup(build) {
      build.onResolve({ filter: /\?raw$/ }, args => ({ path: args.path, namespace: 'leader-raw' }));
      build.onLoad({ filter: /.*/, namespace: 'leader-raw' }, () => ({ contents: '', loader: 'text' }));
      build.onLoad({ filter: /\.ts$/ }, args => {
        let contents = require('fs').readFileSync(args.path, 'utf8');
        if (contents.includes('import.meta.glob')) contents = contents.replace(/import\.meta\.glob/g, '(() => ({}))');
        return { contents, loader: 'ts', resolveDir: require('path').dirname(args.path) };
      });
    } }],
  });
  global.document = new JSDOM('<!doctype html><html><body></body></html>').window.document;
  const mod = { exports: {} };
  new Function('module', 'exports', built.outputFiles[0].text)(mod, mod.exports);
  const { configureEmpireMassRecruitment, renderMassRecruitmentSection } = mod.exports;
  configureEmpireMassRecruitment({ getRecruitFollowGeneralDefault: () => true, onRecruitFollowGeneralDefaultChange: () => {} });

  const state = { stock: { drewno: 5 }, treasury: 100, manpower: 10, queuedCount: 0, completedCount: 0 };
  const cases = [
    ['bez miast', []],
    ['z miastami', [
      { cityId: 'c1', name: 'Alfa', massRecruitment: { queueCount: 0 } },
      { cityId: 'c2', name: 'Beta', massRecruitment: { queueCount: 1 } },
    ]],
  ];
  for (const [name, rows] of cases) {
    const html = renderMassRecruitmentSection(rows, state);
    const dom = new JSDOM(`<div id="army">${html}</div>`);
    const doc = dom.window.document;
    const all = Array.from(doc.querySelectorAll('*'));
    const pos = sel => {
      const el = doc.querySelector(sel);
      return el ? all.indexOf(el) : -1;
    };
    const card = pos('[data-general-recruitment-card]');
    const follow = pos('[data-recruit-follow-general]');
    const erp = pos('[data-erp-root]');
    const after = pos(rows.length ? '[data-mass-recruitment-city]' : '[data-army-recruit-all]');
    assert.ok(card > 0, `${name}: karta wodza obecna`);
    assert.ok(follow > card, `${name}: „Idź do wodza” jest po karcie wodza (${follow} > ${card})`);
    assert.ok(erp > follow, `${name}: masowa rekrutacja (erp) jest po „Idź do wodza” (${erp} > ${follow})`);
    assert.ok(after > erp, `${name}: liczniki/miasta/„Rekrutuj wszystko” są po erp (${after} > ${erp})`);
    console.log(`PASS ${name}: wódz(${card}) < Idź do wodza(${follow}) < erp(${erp}) < reszta(${after})`);
  }
  console.log('PASS empire-recruit-leader-first-order-test: 2/2');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
