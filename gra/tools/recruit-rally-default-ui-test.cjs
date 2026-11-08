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
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: 'brand-assets-stub', namespace: 'rally-test' }));
    build.onLoad({ filter: /.*/, namespace: 'rally-test' }, () => ({
      contents: 'export const brandIconSvg=()=>""; export const mapResourceIconSvg=()=>"";', loader: 'js',
    }));
  } }],
});
const mod = { exports: {} };
new Function('module', 'exports', built.outputFiles[0].text)(mod, mod.exports);
const { configureEmpireMassRecruitment, renderMassRecruitmentSection, mountMassRecruitmentControls } = mod.exports;

let enabled = true;
let changed;
configureEmpireMassRecruitment({ getRecruitFollowGeneralDefault: () => enabled,
  onRecruitFollowGeneralDefaultChange: value => { enabled = value; changed = value; } });
const state = { stock: {}, treasury: 100, manpower: 10, queuedCount: 0, completedCount: 0 };
const html = renderMassRecruitmentSection([], state);
assert.match(html, /data-recruit-follow-general checked/);
assert.match(html, /Idź do wodza/);
assert.match(html, /nowe jednostki będą maszerować i śledzić jego pozycję/);
const dom = new JSDOM(`<div id="army">${html}</div>`);
global.document = dom.window.document;
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
