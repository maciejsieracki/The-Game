'use strict';
/**
 * R-WEB-MARCH-MULTITURN-NOT-RESUMED-LIVE-REPRO-Q1 -- ZYWY test marszu wieloturowego w Chromium.
 * Prawdziwa gra (build vite POZA repo, sonda `window.__mr` wstrzykiwana w pamieci przez
 * tools/march-multiturn-live-vite.config.ts). Scenariusze: wyznacz cel, potem TYLKO „Zakończ turę".
 *   S1 piechota, cel daleko po drodze            S2 reczny ruch 1 heks, potem cel
 *   S3 stos dwoch jednostek                      S4 konnica, cel na 2 tury
 *   S6 wlasna jednostka na koncu pierwszego segmentu  S7 zapis+wczytanie w trakcie marszu
 * Asercja: jednostka dochodzi do celu po <= 3 klikach „Zakończ turę" (ceil(dystans/ruch)+1),
 * bez klikania jednostki, plan znika.
 *
 * Uzycie:
 *   node gra/tools/march-multiturn-live-test.cjs [--only S1,S2] [--dist <katalog>]
 *   node gra/tools/march-multiturn-live-test.cjs --mutant no-eot   (mutacja (b): musi byc CZERWONY)
 * Wymaga chromium (MM_CHROMIUM, domyslnie /opt/pw-browsers/chromium-1194/chrome-linux/chrome).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const args = process.argv.slice(2);
const argv = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const ONLY = argv('--only', 'S1,S2,S3,S4,S6,S7').split(',');
const MUTANT = argv('--mutant', '');
const SEED = 424242;
const MAX_CLICKS = 3;
const CHROMIUM = process.env.MM_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PORT = 18000 + Math.floor(Math.random() * 1000);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);

const SCEN = {
  S1: { type: 'Wojownik', minlen: 7, pre: null, reload: false },
  S2: { type: 'Wojownik', minlen: 7, pre: 'manual1', reload: false },
  S3: { type: 'Wojownik', minlen: 7, pre: 'stack2', reload: false },
  S4: { type: 'Konnica', minlen: 13, pre: null, reload: false },
  S6: { type: 'Wojownik', minlen: 7, pre: 'blocker', reload: false },
  S7: { type: 'Wojownik', minlen: 7, pre: null, reload: true },
};

function build(dist) {
  const cfg = path.join(GRA, 'tools', 'march-multiturn-live-vite.config.ts');
  const env = Object.assign({}, process.env, { MM_DIST: dist });
  if (MUTANT) env.MM_MUTANT = MUTANT;
  const r = spawnSync(path.join(GRA, 'node_modules', '.bin', 'vite'), ['build', '-c', cfg], {
    cwd: GRA, env, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 540000,
  });
  if (r.status !== 0) { console.error(r.stdout.slice(-1500), r.stderr.slice(-1500)); throw new Error('vite build failed'); }
}

function serve(dir) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const p = path.join(dir, decodeURIComponent(req.url.split('?')[0]) || 'index.html');
      fs.readFile(p === dir + '/' ? path.join(dir, 'index.html') : p, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'content-type': p.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
        res.end(data);
      });
    });
    srv.listen(PORT, '127.0.0.1', () => resolve(srv));
  });
}

async function settle(page, timeout = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const s = await page.evaluate(() => ({ b: window.__mr.busy(), k: window.__mr.blockers() })).catch(() => null);
    if (s && !s.b.anim && !s.b.pre && !s.b.scene && s.b.queue.length === 0 && !s.k.endInProg) return true;
    await sleep(200);
  }
  return false;
}

async function clickEndTurn(page) {
  await settle(page);
  const before = await page.evaluate(() => window.__mr.turn());
  await page.evaluate(() => { window.__aiTradeWiringTestDebug.grantPlayerGold(200); window.__aiTradeWiringTestDebug.grantPlayerFood(200); });
  await page.evaluate(() => window.__mr.endTurn());
  const t0 = Date.now();
  let t = before;
  while (Date.now() - t0 < 90000) {
    t = await page.evaluate(() => window.__mr.turn());
    if (t > before) break;
    await sleep(200);
  }
  await settle(page);
  return t > before;
}

async function unitState(page, uid) {
  return page.evaluate(uid => {
    const m = window.__mr;
    const u = m.units().find(x => x.id === uid);
    const plan = m.plans().find(p => p.id === uid);
    const st = m.stops().find(x => x[0] === uid);
    return { pos: u ? [u.q, u.r] : null, ruchLeft: u ? u.ruchLeft : null, planned: !!plan, dest: plan ? [plan.d.destQ, plan.d.destR] : null, stop: st ? st[1] : null };
  }, uid);
}

// R-WEB-MARCH-OWN-UNIT-STOP-LOSES-MP-AND-INDICATOR-Q1 (S8): wskaznik w DOM panelu jednostki.
async function indicatorOf(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.uc-march-queued, .uc-march-paused');
    return el ? { cls: el.className.includes('uc-march-paused') ? 'paused' : 'queued', text: (el.textContent || '').trim().slice(0, 120) } : null;
  });
}

// S8: rozwija panel wybranej jednostki (linie statusu) i czyta wskaźnik z DOM.
async function indicatorNow(page, uid) {
  await page.evaluate(id => window.__mr.expand(id), uid).catch(() => null);
  return indicatorOf(page);
}

async function runScenario(browser, name, port) {
  const sc = SCEN[name];
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  page.on('dialog', d => d.accept());
  const res = { scen: name, ok: false, rows: [] };
  try {
    await page.goto(`http://127.0.0.1:${port}/index.html?civTest=1`, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => window.__mr && window.__mr.ready, undefined, { timeout: 120000 });
    await page.evaluate(s => window.__mr.start(s), SEED);
    await sleep(400);
    if ((await page.evaluate(() => window.__mr.foundCity())) === 'found-failed') throw new Error('found city failed');
    await settle(page);
    const sh = await page.evaluate(() => window.__mr.startHex());
    const uid = await page.evaluate(({ type, q, r }) => window.__civTest.addUnit(0, q, r, false, type), { type: sc.type, q: sh.q + 1, r: sh.r });
    if (sc.pre === 'stack2') await page.evaluate(({ type, q, r }) => window.__civTest.addUnit(0, q, r, false, type), { type: sc.type, q: sh.q + 1, r: sh.r });
    await sleep(200);
    const tgt = await page.evaluate(({ uid, minlen }) => {
      const m = window.__mr; const sc0 = m.startHex();
      for (let rad = minlen; rad <= 14; rad++) for (let dq = -rad; dq <= rad; dq++) for (let dr = -rad; dr <= rad; dr++) {
        if (Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) !== rad) continue;
        const q = sc0.q + dq, r = sc0.r + dr;
        const p = m.path(uid, q, r);
        if (p && p.length >= minlen + 1) return { q, r, len: p.length, path: p };
      }
      return null;
    }, { uid, minlen: sc.minlen });
    if (!tgt) throw new Error('no target');
    const startKey = (sh.q + 1) + ',' + sh.r;
    const ruch = (await unitState(page, uid)).pos ? (await page.evaluate(id => window.__mr.units().find(x => x.id === id).ruch, uid)) : 0;
    if (sc.pre === 'manual1') {
      const step = tgt.path.find(s => s !== startKey).split(',').map(Number);
      await page.evaluate(({ uid, q, r }) => window.__mr.move(uid, q, r), { uid, q: step[0], r: step[1] });
      await settle(page);
    }
    if (sc.pre === 'blocker') {
      const steps = tgt.path.filter(s => s !== startKey);
      const at = steps[Math.min(ruch - 1, steps.length - 1)].split(',').map(Number);
      await page.evaluate(({ type, q, r }) => window.__civTest.addUnit(0, q, r, false, type), { type: sc.type, q: at[0], r: at[1] });
    }
    await page.evaluate(({ uid, q, r }) => window.__mr.plan(uid, q, r), { uid, q: tgt.q, r: tgt.r });
    await settle(page);
    res.target = [tgt.q, tgt.r];
    res.ruch = ruch;
    res.rows.push({ label: 'after-plan', ...(await unitState(page, uid)), indicator: await indicatorNow(page, uid), dom: await page.evaluate(() => window.__mr.dom()) });
    let arrivedAt = null;
    for (let i = 1; i <= MAX_CLICKS && arrivedAt === null; i++) {
      if (sc.reload && i === 2) await page.evaluate(() => window.__mr.reloadSave());
      const ok = await clickEndTurn(page);
      const st = await unitState(page, uid);
      res.rows.push({ label: 'endturn#' + i, advanced: ok, ...st, indicator: await indicatorNow(page, uid) });
      if (st.planned === false && st.dest === null && st.pos && st.pos[0] === tgt.q && st.pos[1] === tgt.r) arrivedAt = i;
    }
    res.arrivedAtClick = arrivedAt;
    res.ok = arrivedAt !== null;
    // S6 (R-WEB-MARCH-OWN-UNIT-STOP-LOSES-MP-AND-INDICATOR-Q1): po planie zostaje MP (ruchLeft>0) i wolna droga
    // -- pozostaly ruch MUSI sie wykorzystac na koniec tury 1 (jednostka ruszyla sie), nie przepasc.
    if (name === 'S6' && res.rows.length >= 2 && res.rows[0].ruchLeft > 0) {
      const moved = res.rows[1].pos && res.rows[0].pos && (res.rows[1].pos[0] !== res.rows[0].pos[0] || res.rows[1].pos[1] !== res.rows[0].pos[1]);
      if (!moved) { res.ok = false; res.error = (res.error || '') + ' S6: pozostaly ruch przepadl na koniec tury 1'; }
    }
    // S8: po wyznaczeniu celu wskaznik „marsz ruszy na koniec tury” MUSI byc w DOM; po dojsciu znika.
    const lastRow = res.rows[res.rows.length - 1];
    if (!(res.rows[0] && res.rows[0].indicator && res.rows[0].indicator.cls === 'queued')) {
      res.ok = false; res.error = (res.error || '') + ' S8: brak wskaznika marszu po planie';
    }
    if (arrivedAt !== null && lastRow.indicator !== null) {
      res.ok = false; res.error = (res.error || '') + ' S8: wskaznik nie zniknal po dojsciu';
    }
    res.errs = errs.slice(0, 5);
  } catch (e) {
    res.error = String(e && e.message || e).slice(0, 300);
  } finally {
    await page.close();
  }
  log(`${res.ok ? 'PASS' : 'FAIL'} ${name} ${JSON.stringify({ target: res.target, ruch: res.ruch, arrivedAtClick: res.arrivedAtClick, error: res.error })}`);
  for (const row of res.rows) log('   ', JSON.stringify(row));
  return res;
}

(async () => {
  const dist = argv('--dist', '') || fs.mkdtempSync(path.join(os.tmpdir(), 'mm-live-dist-'));
  if (!argv('--dist', '')) {
    log('build vite poza repo ->', dist, MUTANT ? '(mutant ' + MUTANT + ')' : '');
    build(dist);
  }
  const srv = await serve(dist);
  const browser = await chromium.launch({
    executablePath: CHROMIUM, headless: true,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const results = [];
  try {
    for (const name of ONLY) results.push(await runScenario(browser, name, PORT));
  } finally {
    await browser.close();
    srv.close();
  }
  const failed = results.filter(r => !r.ok).map(r => r.scen);
  if (MUTANT) {
    // Mutacja (b): przywrocenie bledu (usuniete EOT) musi dac czerwony wynik.
    const red = failed.length > 0;
    log(red ? `MUTANT RED OK (czerwone: ${failed.join(',')})` : 'MUTANT NOT DETECTED -- test zielony przy mutacji');
    process.exit(red ? 0 : 1);
  }
  log(failed.length === 0 ? `ALL PASS (${results.length})` : `FAILED: ${failed.join(',')}`);
  process.exit(failed.length === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
