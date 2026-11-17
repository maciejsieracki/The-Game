'use strict';
/*
 * R-WEB-ARMY-MERGE-JOIN-BESIEGING-TYPEID-CRASH-Q2 (runda 2) -- harness live w Chromium.
 * Uruchomienie: DIST=<katalog z buildem> MODE=<tryb> [SHOT=<png>] node repro-merge-besieger-only-move-live.cjs
 * Tryby: siege1 | army3 | siege1-h3 | army3-h3 | siege1-sel | army3-sel | mvbes
 *   mvbes = ruszona jednostka OBLEGAJĄCA na heksie rezydenta (wszystkie ruszone oblegające).
 * BUILD: vite build --minify false z kopii gra/ POZA repo, z jedną linią debug przed installCivTestHooks:
 *   (window as any).__mergeDbg = { units: () => units, cities: () => cities,
 *     select: (id) => selectPlayerUnit(id), promptMerge: (ids, q, r) => promptMergeIfCoLocated(ids, q, r, 0, 0),
 *     deferred: () => deferredMergePrompts, flush: () => flushDeferredMergePrompts() };
 * Wynik na buildzie PRZED poprawką (mvbes): TypeError "Cannot read properties of undefined (reading 'typeId')"
 *   at mergeUnitRow <- promptMergeIfCoLocated. Na buildzie PO poprawce: brak błędu, brak panelu.
 * Ścieżka do node_modules (playwright) i chromium: poniżej, względem katalogu gra/ worktree.
 */
const path = require('path');
const http = require('http');
const fs = require('fs');
const WT = process.env.GRA_DIR || '/home/user/The-Game/.claude/worktrees/wf_a1b6b4d3-53c-3/gra';
const { chromium } = require(path.join(WT, 'node_modules', 'playwright'));
const DIST = process.env.DIST;
const MODE = process.env.MODE || 'siege1';
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push({ msg: e.message, stack: e.stack }));
  await page.goto(`http://127.0.0.1:${port}/index.html?playtest=mapa&civTest=1`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__mergeDbg && window.__civTest, null, { timeout: 240000 });
  await page.waitForTimeout(1500);
  const setup = await page.evaluate((MODE) => {
    const D = window.__mergeDbg, C = window.__civTest;
    const cand = C.foundCandidates(1)[0];
    if (!cand) return { err: 'no candidate' };
    C.foundCity(cand.q, cand.r);
    const city = D.cities().find(c => c.ownerId === 0);
    if (!city) return { err: 'city not founded' };
    const nBes = MODE.startsWith('army3') ? 3 : 1;
    const aid = C.addUnit(0, city.q + 1, city.r, false);
    const A = D.units().find(u => u.id === aid);
    if (!A) return { err: 'addA failed' };
    const q = A.q, r = A.r;
    const bes = [A];
    for (let i = 1; i < nBes; i++) { const x = C.addUnit(0, q, r, false); bes.push(D.units().find(u => u.id === x)); }
    for (const b of bes) { b.oblegaCityId = city.id; b.ruchLeft = 0; }
    city.oblegane = true; city.siegeArmyGroupId = A.stackGroupId;
    const bid = C.addUnit(0, q, r, false);
    const B = D.units().find(u => u.id === bid);
    if (!B) return { err: 'addB failed' };
    B.ruchLeft = 2;
    if (MODE.startsWith('mvbes')) {
      delete B.oblegaCityId;
      D.promptMerge([A.id], q, r);
      return { A: A.id, B: B.id, q, r, mode: 'mvbes', deferred: D.deferred().length };
    }
    if (MODE.endsWith('-sel')) D.select(A.id);
    D.promptMerge([B.id], q + 2, r);
    if (MODE.endsWith('-sel')) D.select(B.id);
    if (MODE.includes('h3')) {
      const idx = D.units().findIndex(u => u.id === A.id);
      if (idx >= 0) D.units().splice(idx, 1);
    }
    return { A: A.id, B: B.id, q, r, city: [city.q, city.r], n: bes.length, deferred: D.deferred().length };
  }, MODE);
  console.log('MODE', MODE, 'SETUP', JSON.stringify(setup));
  await page.waitForTimeout(500);
  const nPanel = await page.evaluate(() => !!document.querySelector('[data-act="merge"]'));
  console.log('PANEL_OPEN', nPanel);
  if (nPanel) {
    await page.evaluate(() => document.querySelector('[data-act="merge"]').click());
    await page.waitForTimeout(1500);
  }
  console.log('ERRORS', errs.length);
  for (const e of errs.slice(0, 2)) console.log('ERR:', e.msg, '\n', (e.stack || '').split('\n').slice(0, 14).join('\n'));
  const boot = await page.evaluate(() => (document.body.innerText || '').includes('BOOT ERROR'));
  console.log('BOOT_ERROR_SCREEN', boot);
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
  await browser.close();
  server.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
