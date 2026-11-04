'use strict';
/**
 * siege-badge-zorder-live-test.cjs -- R-WEB-SIEGE-BADGE-ZORDER-Q1 (Chromium, ?civTest=1, zywa zbudowana gra).
 * Sprawdza REALNYM renderem (elementFromPoint), ze plakietka oblezenia lezy POD panelami/oknami/tooltipem/toastem
 * i NAD kanwa terenu. Mutacja: wymuszenie starego z-index 340 musi pokazac blad (plakietka przebija panel).
 * Usage (z gra/): node tools/siege-badge-zorder-live-test.cjs --dist <katalog vite build> [--shots <katalog>]
 */
const fs = require('fs');
const path = require('path');
const argOf = (flag) => { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : null; };
const DIST = argOf('--dist');
const SHOTS = argOf('--shots');
if (DIST === null) { console.error('brak --dist <katalog>'); process.exit(2); }
const URL = 'file://' + path.resolve(DIST, 'index.html') + '?playtest=mapa&civTest=1';
const CHROME = process.env.CHROME_BIN || '/opt/pw-browsers/chromium';
let pass = 0; let fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
    await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
    await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 180000 });
    await page.waitForFunction(() => window.__siegeBadgeTestDebug !== undefined && window.__civTest !== undefined, { timeout: 120000 });
    { let clear = 0;
      for (let i = 0; i < 400 && clear < 3; i++) {
        const busy = await page.evaluate(() => /Tworzenie świata/.test(document.body.innerText));
        clear = busy ? 0 : clear + 1; await wait(1000);
      } }
    await wait(1500);
    let st = await page.evaluate(() => window.__civTest.state());
    if (st.cities.length === 0) {
      const cand = await page.evaluate(() => window.__civTest.foundCandidates(1));
      if (cand.length) await page.evaluate((c) => window.__civTest.foundCity(c.q, c.r), cand[0]);
      await wait(1500);
      st = await page.evaluate(() => window.__civTest.state());
    }
    const city = st.cities.find(c => c.ownerId === st.me) || st.cities[0];
    check('jest miasto do inscenizacji', !!city);
    await page.evaluate(({ id }) => window.__siegeBadgeTestDebug.setSiege(id, 30, false), { id: city.id });
    await wait(800);

    const info = await page.evaluate(() => {
      const el = document.querySelector('.civ-siege-html-label');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const z = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).zIndex : null; };
      return { rect: { x: r.x, y: r.y, w: r.width, h: r.height }, display: getComputedStyle(el).display, zLabel: getComputedStyle(el).zIndex,
        zHud: z('.civ-hud'), zToast: z('#civ-hint-toast'), zDim: z('.civ-ux-dim-full'), zSide: z('.civ-side-panel'),
        zCanvasParent: (() => { const c = document.querySelector('canvas'); return c ? getComputedStyle(c).zIndex : null; })() };
    });
    check('plakietka oblezenia jest w DOM i widoczna', !!info && info.display !== 'none' && info.rect.w > 20, info);
    console.log('  POMIAR z-index: ' + JSON.stringify(info));
    check('z-index plakietki < winieta UI (298)', Number(info.zLabel) < 298, info.zLabel);
    if (info.zHud !== null) check('z-index plakietki < .civ-hud', Number(info.zLabel) < Number(info.zHud), info);
    if (info.zToast !== null) check('z-index plakietki < toast', Number(info.zLabel) < Number(info.zToast), info);

    const cx = info.rect.x + info.rect.w / 2; const cy = info.rect.y + info.rect.h / 2;
    // punkt na pigulce, ktory na pewno trafia w plakietke (badge ma pointer-events:auto)
    const hitBadge = await page.evaluate(() => {
      const b = document.querySelector('.civ-siege-surrender'); if (!b) return null;
      const r = b.getBoundingClientRect();
      const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, hitLabel: !!(e && e.closest('.civ-siege-html-label')) };
    });
    check('bez nakladek: plakietka jest NAD terenem (elementFromPoint = plakietka)', !!hitBadge && hitBadge.hitLabel, hitBadge);

    // Sondy paneli o REALNYCH z-index warstw UI: panel boczny 305, panel/menu 311, toast 320, tooltip 325, modal 400.
    const probes = [['panel boczny', 305], ['panel miasta/imperium', 311], ['toast', 320], ['tooltip', 325], ['modal', 400]];
    async function probeAll(expectCovered, tag) {
      for (const [name, z] of probes) {
        const r = await page.evaluate(({ z, x, y }) => {
          const p = document.createElement('div');
          p.id = '__zprobe'; p.style.cssText = 'position:fixed;left:' + (x - 150) + 'px;top:' + (y - 60) + 'px;width:300px;height:120px;background:#223;pointer-events:auto;z-index:' + z;
          document.body.appendChild(p);
          const e = document.elementFromPoint(x, y);
          const covered = e === p;
          p.remove();
          return covered;
        }, { z, x: hitBadge.x, y: hitBadge.y });
        check(tag + ' ' + name + ' (z=' + z + ') zaslania plakietke: ' + (expectCovered && z > 0 ? true : z > 340), r === (expectCovered ? true : z > 340), r);
      }
    }
    await probeAll(true, 'PO:');
    if (SHOTS) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.evaluate(({ x, y }) => {
        const p = document.createElement('div'); p.id = '__zprobe';
        p.style.cssText = 'position:fixed;left:' + (x - 40) + 'px;top:' + (y - 40) + 'px;width:300px;height:140px;background:#1c2540;border:2px solid #8aa;color:#fff;font:14px Arial;padding:8px;z-index:305';
        p.textContent = 'Panel boczny (z=305) - plakietka musi byc POD nim';
        document.body.appendChild(p);
      }, hitBadge);
      const clip = { x: Math.max(0, hitBadge.x - 200), y: Math.max(0, hitBadge.y - 120), width: 480, height: 300 };
      await page.screenshot({ path: path.join(SHOTS, 'po-panel-nad-plakietka.jpg'), type: 'jpeg', quality: 60, clip });
      await page.evaluate(() => document.getElementById('__zprobe').remove());
      await page.screenshot({ path: path.join(SHOTS, 'po-plakietka-nad-terenem.jpg'), type: 'jpeg', quality: 60, clip });
    }
    // MUTACJA (PRZED): stary z-index 340 -> plakietka przebija panel/toast/tooltip, test musi to wykryc.
    await page.evaluate(() => { document.querySelector('.civ-siege-html-label').style.zIndex = '340'; });
    await probeAll(false, 'MUTACJA(340):');
    if (SHOTS) {
      await page.evaluate(({ x, y }) => {
        const p = document.createElement('div'); p.id = '__zprobe';
        p.style.cssText = 'position:fixed;left:' + (x - 40) + 'px;top:' + (y - 40) + 'px;width:300px;height:140px;background:#1c2540;border:2px solid #8aa;color:#fff;font:14px Arial;padding:8px;z-index:305';
        p.textContent = 'Panel boczny (z=305) - PRZED: plakietka (340) przebija';
        document.body.appendChild(p);
      }, hitBadge);
      await page.screenshot({ path: path.join(SHOTS, 'przed-mutacja-340.jpg'), type: 'jpeg', quality: 60, clip: { x: Math.max(0, hitBadge.x - 200), y: Math.max(0, hitBadge.y - 120), width: 480, height: 300 } });
      await page.evaluate(() => document.getElementById('__zprobe').remove());
    }
    check('brak bledow strony (pageerror)', errors.length === 0, errors.slice(0, 3));
  } finally {
    await browser.close();
  }
  console.log('\nPASS=' + pass + ' FAIL=' + fail);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error('BLAD TESTU', e); process.exit(2); });
