'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { JSDOM } = require('jsdom');
const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const LEADER_STUB = path.join(STUB_DIR, 'cyclic-duration-leader-stub.ts');
const BRAND_STUB = path.join(STUB_DIR, 'cyclic-duration-brand-stub.ts');
const ENTRY = path.join(__dirname, '.cyclic-duration-entry.ts');
const BUNDLE = path.join(__dirname, '.cyclic-duration-bundle.cjs');
fs.mkdirSync(STUB_DIR, { recursive: true });
fs.writeFileSync(LEADER_STUB, [
  'export function leaderPortraitUrl() { return null; }', 'export function leaderName() { return null; }',
  'export function leaderNameFromPool() { return null; }', 'export function civDisplayNameFromKey() { return null; }',
  'export function civCardDisplayName(l) { return l; }', 'export function civIconIdFromCivLabel() { return null; }',
].join('\n'));
fs.writeFileSync(BRAND_STUB, [
  'brandIconSvg', 'improvementIconSvg', 'mapResourceIconSvg', 'terrainIconSvg', 'buildingIconSvg',
  'unitIconSvg', 'civIconSvg', 'epochIconSvg', 'settingIconSvg', 'brandMenuComponentsCss',
  'menuIconSvg', 'brandMenuEmblemSvg', 'newGameIntroEmblemSvg', 'brandMotionCss',
  'brandMenuBackgroundCss', 'svgThumbHtml',
].map(f => `export function ${f}() { return ''; }`).join('\n'));
fs.writeFileSync(ENTRY, "export { showTradeBasketModal, dealDurationHtml, dealDurationControlOptions } from '../src/ui/diplomacyTradeBasket.ts';\n");
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement; global.Element = dom.window.Element; global.Node = dom.window.Node;
try { Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true }); } catch {}
global.requestAnimationFrame = cb => setTimeout(cb, 0); global.cancelAnimationFrame = clearTimeout;
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
const ctx = {
  civName: 'Rzym', relacjaTotal: 180, playerSkarbiec: 500, progHandelRelacja: 0,
  giveQuantityResourceOptions: [{ id: 'drewno', label: 'Drewno', maxQty: 300 }],
  receiveQuantityResourceOptions: [{ id: 'wegiel', label: 'Węgiel', maxQty: 300 }],
};
const action = { id: '14', label: 'Umowa wymiany surowców' };
let pass = 0, fail = 0;
function ok(value, name) { if (value) pass++; else fail++; console.log(value ? '  OK:' : '  FAIL:', name); }
function box() { return document.querySelector('.civ-diplo-basket-overlay > div'); }
function q(s) { return [...box().querySelectorAll(s)]; }
function click(el) { if (!el) throw new Error('missing element for click'); el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); }
function chooseAndAdd(side, type, resource, qty) {
  click(q('.cdb-chip-typ').find(b => b.dataset.side === side && b.dataset.value === type));
  if (resource) click(q('.cdb-chip-resqty').find(b => b.dataset.side === side && b.dataset.value === resource));
  const input = q('.cdb-res-qty-num').find(i => i.dataset.side === side);
  if (input && qty) input.value = String(qty);
  click(q('.cdb-add-btn').find(b => b.dataset.side === side && b.dataset.editIdx == null));
}
async function main() {
  await esbuild.build({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE,
    absWorkingDir: GRA, logLevel: 'silent', loader: { '.json': 'json', '.svg': 'text', '.css': 'text', '.mp3': 'empty', '.png': 'empty' },
    plugins: [{ name: 'stub-assets', setup(b) {
      b.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_STUB }));
      b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
    } }],
  });
  const { showTradeBasketModal, dealDurationHtml, dealDurationControlOptions } = require(BUNDLE);
  let submitted;
  showTradeBasketModal('trade', action, ctx, p => { submitted = p; }, () => {});
  chooseAndAdd('give', 'surowiec_ilosc', 'drewno', 10);
  chooseAndAdd('recv', 'surowiec_ilosc', 'wegiel', 10);
  click(q('.cdb-chip-mode').find(b => b.dataset.value === 'per_turn'));
  const duration = q('.cdb-deal-turns')[0];
  const deltas = q('.cdb-duration .cdb-qty-step').map(b => b.dataset.delta);
  ok(duration?.max === '30', 'cyclic exchange duration input caps at 30');
  ok(deltas.includes('1') && deltas.includes('10') && !deltas.includes('100'), '+1/+10 remain; misleading +100 is removed');
  ok(q('.cdb-duration-indefinite').some(b => b.textContent.trim() === 'Bezterminowo'), 'duration control exposes Bezterminowo');
  const cyclicOptions = dealDurationControlOptions(false, 'per_turn', true, true);
  ok(cyclicOptions.maxTurns === 30 && cyclicOptions.allowIndefinite,
    'per-turn quantity exchange selects max-30 indefinite controls');
  click(q('.cdb-duration-indefinite')[0]);
  ok(q('.cdb-duration-indefinite')[0].getAttribute('aria-pressed') === 'true', 'indefinite option becomes selected');
  click(q('.cdb-submit')[0]);
  ok(submitted?.exchangeDurationTurns === null, 'submitting indefinite exchange produces explicit null');
  ok(submitted?.turns === 15, 'valuation horizon remains finite and separate from expiry');
  let counterofferPayload;
  showTradeBasketModal('trade', action, ctx, p => { counterofferPayload = p; }, () => {}, {
    giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 10 }],
    receiveItems: [{ typ: 'surowiec_ilosc', id: 'wegiel', ilosc: 10 }],
    resourceTradeMode: 'per_turn', turns: 15, exchangeDurationTurns: null,
  });
  click(q('.cdb-chip-mode').find(b => b.dataset.value === 'per_turn'));
  ok(q('.cdb-duration-indefinite')[0].getAttribute('aria-pressed') === 'true', 'counteroffer prefill restores indefinite selection');
  click(q('.cdb-chip-turn').find(b => b.dataset.turns === '30'));
  ok(q('.cdb-deal-turns')[0].value === '30' && q('.cdb-duration-indefinite')[0].getAttribute('aria-pressed') === 'false',
    'selecting finite 30 turns replaces the indefinite selection');
  click(q('.cdb-submit')[0]);
  ok(counterofferPayload?.exchangeDurationTurns === 30,
    'switching to finite duration submits numeric 30 for counteroffer');

  const accessOptions = dealDurationControlOptions(true, 'per_turn', true, true);
  const accessHost = document.createElement('div');
  accessHost.innerHTML = dealDurationHtml(15, true, 'Czas umowy (tur, max 20)', 'Dostęp trwa przez wybrany czas.',
    accessOptions.maxTurns, accessOptions.allowIndefinite);
  const accessInput = accessHost.querySelector('.cdb-deal-turns');
  ok(accessOptions.maxTurns === 20 && !accessOptions.allowIndefinite && accessInput?.max === '20',
    'resource-access mode retains its prior 20-turn cap');
  ok(!accessHost.querySelector('.cdb-duration-indefinite')
    && accessHost.querySelector('.cdb-qty-step[data-delta="100"]') != null,
  'resource-access mode does not show the cyclic-only Bezterminowo control');
  for (const f of [ENTRY, BUNDLE, LEADER_STUB, BRAND_STUB]) { try { fs.unlinkSync(f); } catch {} }
  console.log(`\n${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
}
main().catch(err => { console.error(err); process.exit(1); });
