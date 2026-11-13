const http = require('http');
const fs = require('fs');
const { chromium } = require('/home/user/The-Game/.claude/worktrees/wf_964d6bdc-430-3/gra/node_modules/playwright');
const DIST = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/dist-r4o';
const srv = http.createServer((req, res) => {
  const p = req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0];
  try { const d = fs.readFileSync(DIST + p); res.writeHead(200, { 'content-type': p.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); res.end(d); }
  catch { res.writeHead(404); res.end(); }
});
(async () => {
  await new Promise(r => srv.listen(8766, '127.0.0.1', r));
  const b = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => { const t = m.text(); if (/NewGame\] Mapa|rror/.test(t)) logs.push(t.slice(0, 120)); });
  await page.goto('http://127.0.0.1:8766/index.html', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__buildRequestTestDebug, undefined, { timeout: 120000 });
  console.log('hooks ok');
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
  const t0 = Date.now();
  while (!logs.some(l => /NewGame\] Mapa/.test(l)) && Date.now() - t0 < 200000) await new Promise(r => setTimeout(r, 500));
  await page.waitForFunction(() => { const s = window.__cityStateStartUnitsTestDebug.dumpState(); return s.playerStartHex && s.awaitingFirstPlayerCity; }, undefined, { timeout: 200000 });
  console.log('found', await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()));
  await new Promise(r => setTimeout(r, 1500));

  const st0 = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
  const city = st0.cities.find(c => c.ownerId === 0);
  console.log('city', JSON.stringify(city));
  await page.evaluate(() => { window.__buildRequestTestDebug.unlockAllTech(); });
  const click = async (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
  console.log('focus zrown', await click('[data-ulepszenia-empire-focus="zrownowazone"]'));
  console.log('wyrab', await click('[data-ulepszenia-empire-wyrab]'));
  await page.evaluate(() => { const i = document.querySelector('[data-ulepszenia-empire-percent]'); if (i) { i.value = '100'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); } });
  const scan = () => page.evaluate((c) => {
    const out = {};
    for (let dq = -6; dq <= 6; dq++) for (let dr = -6; dr <= 6; dr++) {
      const q = c.q + dq, r = c.r + dr; const l = window.__buildRequestTestDebug.getPlacedLayers(q, r);
      if (l && l.length) out[q + ',' + r] = l;
    }
    return out;
  }, city);
  const TURNS = parseInt(process.env.TURNS || '25', 10);
  for (let t = 0; t < TURNS; t++) {
    await page.evaluate(() => { window.__buildRequestTestDebug.setPlayerPracaPool(100000); });
    await page.evaluate(() => { const b = document.querySelector('[data-end]'); if (b) b.click(); });
    const t1 = Date.now();
    const cur = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState().turn);
    while (Date.now() - t1 < 20000) {
      const nt = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState().turn);
      if (nt > cur) break;
      await new Promise(r => setTimeout(r, 300));
    }
  }
  const fin = await scan();
  const counts = {};
  for (const l of Object.values(fin)) for (const k of l) counts[k] = (counts[k] || 0) + 1;
  console.log('turn', await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState().turn));
  console.log('placed hexes', Object.keys(fin).length, 'counts', JSON.stringify(counts));
  console.log('center', JSON.stringify(fin[city.q + ',' + city.r] || []));
  console.log(logs.join('\n'));
  await b.close();
  srv.close();
})().catch(e => { console.log('ERR', e.message.slice(0, 300)); process.exit(1); });
