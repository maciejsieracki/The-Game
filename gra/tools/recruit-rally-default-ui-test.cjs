'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { JSDOM } = require(path.join(__dirname, '..', 'node_modules', 'jsdom'));

const root = path.resolve(__dirname, '..');
async function main() {
const built = await esbuild.build({
  stdin: { contents: "export { configureEmpireMassRecruitment, renderMassRecruitmentSection, mountMassRecruitmentControls } from './src/ui/empireDetailPanel.ts';", resolveDir: root, sourcefile: 'rally-ui-entry.ts' },
  bundle: true, platform: 'node', format: 'cjs', target: 'es2020', write: false, logLevel: 'silent',
  plugins: [{ name: 'brand-assets-stub', setup(build) {
    // R-WEB-TEST-DEBT-BASELINE-Q3: src/ui/brandTokenVars.ts i brandAssets importuja *.css?raw / *.svg?raw
    // (Vite-only). Atrapa tekstowa wystarcza: test dotyczy panelu rekrutacji, nie brandingu.
    build.onResolve({ filter: /\?raw$/ }, args => ({ path: args.path, namespace: 'rally-raw' }));
    build.onLoad({ filter: /.*/, namespace: 'rally-raw' }, () => ({ contents: '', loader: 'text' }));
    // import.meta.glob (Vite-only) -> pusty obiekt, jak w general-capital-recruitment-order-test.
    build.onLoad({ filter: /\.ts$/ }, args => {
      let contents = require('fs').readFileSync(args.path, 'utf8');
      if (contents.includes('import.meta.glob')) contents = contents.replace(/import\.meta\.glob/g, '(() => ({}))');
      return { contents, loader: 'ts', resolveDir: require('path').dirname(args.path) };
    });
  } }],
});
// R-WEB-TEST-DEBT-BASELINE-Q3: globalny document (jsdom) musi istniec PRZED ewaluacja bundla
// (modul rejestruje listenery przy ładowaniu: bindTechHintLinkDelegation).
global.document = new JSDOM('<!doctype html><html><body></body></html>').window.document;
const mod = { exports: {} };
new Function('module', 'exports', built.outputFiles[0].text)(mod, mod.exports);
const { configureEmpireMassRecruitment, renderMassRecruitmentSection, mountMassRecruitmentControls } = mod.exports;

let enabled = true;
let changed;
configureEmpireMassRecruitment({ getRecruitFollowGeneralDefault: () => enabled,
  onRecruitFollowGeneralDefaultChange: value => { enabled = value; changed = value; } });
const state = { stock: {}, treasury: 100, manpower: 10, queuedCount: 0, completedCount: 0 };
const html = renderMassRecruitmentSection([], state);
const dom = new JSDOM(`<div id="army">${html}</div>`);
global.document = dom.window.document;
assert.match(html, /data-recruit-follow-general checked/);
assert.match(html, /Idź do wodza/);
assert.match(html, /nowe jednostki będą maszerować i śledzić jego pozycję/);
const host = document.querySelector('#army');
mountMassRecruitmentControls(host, {}, () => false, () => false);
const toggle = host.querySelector('[data-recruit-follow-general]');
toggle.checked = false;
toggle.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
assert.equal(changed, false);
assert.equal(enabled, false);
console.log('PASS production Army recruitment UI renders the rally default and persists toggle changes');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
