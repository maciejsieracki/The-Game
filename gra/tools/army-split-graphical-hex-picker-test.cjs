'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));
const UI_DIR = path.resolve(__dirname, '..', 'src', 'ui');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'army-split-hex-picker-'));
const STUB = path.join(TMP, 'brandAssets.ts');
const OUT = path.join(TMP, 'panel.cjs');
const shotArg = process.argv.indexOf('--shots');
const SHOTS = shotArg >= 0 ? path.resolve(process.argv[shotArg + 1]) : null;
fs.writeFileSync(STUB, 'export function unitIconSvg(){return "<svg></svg>";}');
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.error('FAIL: ' + name + (detail ? ' — ' + JSON.stringify(detail) : '')); }
}
const source = fs.readFileSync(path.join(UI_DIR, 'armySplitPanel.ts'), 'utf8')
  + '\n;(window).__asp={showArmySplitPanel,hideArmySplitPanel};';
async function main() {
  await esbuild.build({ stdin: { contents: source, resolveDir: UI_DIR, sourcefile: 'armySplitPanel.ts', loader: 'ts' },
    bundle: true, platform: 'browser', format: 'iife', outfile: OUT, logLevel: 'silent',
    plugins: [{ name: 'brand-stub', setup(b) { b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB })); } }] });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.setContent('<!doctype html><html><head></head><body style="margin:0;background:#080a12"></body></html>');
  await page.addScriptTag({ path: OUT });
  const neighbors = [
    ['E', 1, 0], ['NE', 1, -1], ['NW', 0, -1], ['W', -1, 0], ['SW', -1, 1], ['SE', 0, 1],
  ].map(([direction, dq, dr]) => ({ q: 10 + dq, r: 5 + dr, direction, terrain: 'Łąka', available: true }));
  const dests = neighbors.map(n => ({ q: n.q, r: n.r, label: `(${n.q},${n.r})` }));
  dests.push({ q: 10, r: 5, label: 'W mieście (ten heks)' });
  const open = async (disabled = false) => page.evaluate(({ neighbors, dests, disabled }) => {
    window.__calls = [];
    const cells = disabled ? neighbors.map((n, i) => i === 2 ? { ...n, available: false, reason: 'Teren nieprzejezdny' } : n) : neighbors;
    window.__asp.showArmySplitPanel({ hexLabel: '(10,5)', units: [{ id: 'u1', name: 'Wojownik' }, { id: 'u2', name: 'Łucznik' }],
      neighbors: cells, destHexes: dests, onSplit: (ids, q, r) => window.__calls.push({ ids, q, r }), onCancel() {} });
  }, { neighbors, dests, disabled });
  await open();
  if (SHOTS) {
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: path.join(SHOTS, 'army-split-picker-1280x800.png') });
  }
  check('diagram displays source and six labeled map directions', await page.locator('.civ-asp-cell').count() === 7);
  const mapText = await page.locator('.civ-asp-map').innerText();
  check('graphical cells and source marker show no coordinate labels', !/\(\s*-?\d+\s*,\s*-?\d+\s*\)/.test(mapText)
    && mapText.includes('ARMIA') && mapText.includes('Łąka'));
  check('same-city source choice is selectable in the center', await page.locator('.civ-asp-cell.center').evaluate(el => el.tagName === 'BUTTON'));
  for (const n of neighbors) {
    await open();
    await page.locator(`.civ-asp-cell.${n.direction}`).click();
    await page.locator('[data-go]').click();
    const call = await page.evaluate(() => window.__calls[0]);
    check(`${n.direction} selects its matching axial destination`, call?.q === n.q && call?.r === n.r && call.ids?.[0] === 'u2', call);
  }
  await open(true);
  const blocked = page.locator('.civ-asp-cell.NW');
  check('unavailable terrain neighbor is disabled and explains why', await blocked.isDisabled() && (await blocked.getAttribute('aria-label')).includes('Teren nieprzejezdny'));
  await page.locator('.civ-asp-cell.center').click();
  await page.locator('[data-go]').click();
  const cityCall = await page.evaluate(() => window.__calls[0]);
  check('same-city destination still returns the source coordinates', cityCall?.q === 10 && cityCall?.r === 5, cityCall);
  await open();
  await page.setViewportSize({ width: 853, height: 533 });
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'army-split-picker-150-percent-equivalent.png') });
  const zoomFit = await page.evaluate(() => {
    const panel = document.querySelector('.civ-asp').getBoundingClientRect();
    const map = document.querySelector('.civ-asp-map').getBoundingClientRect();
    return { panelRight: panel.right, panelBottom: panel.bottom, mapRight: map.right, viewport: { width: innerWidth, height: innerHeight } };
  });
  check('picker fits 150 percent equivalent viewport', zoomFit.panelRight <= zoomFit.viewport.width + 1
    && zoomFit.panelBottom <= zoomFit.viewport.height + 1 && zoomFit.mapRight <= zoomFit.panelRight + 1, zoomFit);
  await page.setViewportSize({ width: 360, height: 640 });
  const fit = await page.evaluate(() => {
    const panel = document.querySelector('.civ-asp').getBoundingClientRect();
    const map = document.querySelector('.civ-asp-map').getBoundingClientRect();
    const tiles = [...document.querySelectorAll('.civ-asp-cell')].map(el => el.getBoundingClientRect());
    return { panelRight: panel.right, mapRight: map.right, maxTileRight: Math.max(...tiles.map(r => r.right)), viewport: innerWidth };
  });
  check('picker fits narrow viewport without horizontal overflow', fit.panelRight <= fit.viewport + 1 && fit.mapRight <= fit.panelRight + 1 && fit.maxTileRight <= fit.mapRight + 1, fit);
  const focusable = await page.locator('.civ-asp-cell.E').evaluate(el => { el.focus(); return document.activeElement === el; });
  check('direction buttons can receive keyboard focus', focusable);
  await browser.close();
  console.log(`\narmy-split-graphical-hex-picker-test: ${pass} pass, ${fail} fail`);
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exitCode = fail ? 1 : 0;
}
main().catch(err => { console.error(err); process.exitCode = 1; });
