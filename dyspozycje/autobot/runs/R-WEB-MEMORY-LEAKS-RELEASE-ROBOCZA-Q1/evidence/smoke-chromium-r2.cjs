// Smoke Chromium r2 (odtwarzalny: sciezki z argumentow/ENV, zero hardkodow worktree).
// Uzycie: SMOKE_BUNDLE_DIR=<katalog z Gra-ROBOCZA.html> SMOKE_PLAYWRIGHT_FROM=<gra/> \
//         SMOKE_CHROME=<chrome> SMOKE_TURNS=8 node smoke-chromium-r2.cjs <katalog-wyjsciowy>
const path = require('path'), fs = require('fs'), http = require('http');
const ROOT = process.env.SMOKE_BUNDLE_DIR;
const GRA = process.env.SMOKE_PLAYWRIGHT_FROM;
const CHROME = process.env.SMOKE_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TURNS = parseInt(process.env.SMOKE_TURNS || '8', 10);
const OUT = process.argv[2];
if (!ROOT || !GRA || !OUT) { console.log('brak SMOKE_BUNDLE_DIR / SMOKE_PLAYWRIGHT_FROM / katalogu wyjsciowego'); process.exit(2); }
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { console.log('SERVER 404 for', req.url); res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); fs.createReadStream(f).pipe(res);
});
const ts = () => new Date().toISOString().slice(11, 19);
const log = (...a) => console.log(ts(), ...a);
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port;
  const b = await chromium.launch({ executablePath: CHROME, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [], mem = [], bad = [];
  let currentTurn = 1;
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error') errs.push('console.error: ' + m.text() + ' @ ' + JSON.stringify(m.location()));
    if (m.text().includes('[memdebug]')) { mem.push(m.text()); log('MEM', m.text()); }
  });
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  page.on('requestfailed', r => bad.push('FAILED ' + r.url() + ' ' + (r.failure() && r.failure().errorText)));
  const body = async () => (await page.evaluate(() => document.body.innerText));
  const turnNo = async () => { const m = (await body()).match(/TURA (\d+)/); return m ? parseInt(m[1], 10) : null; };
  const visibleButtons = () => page.evaluate(() => [...document.querySelectorAll('button')].filter(e => e.offsetParent !== null).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 40)).filter(Boolean));
  await page.goto(`http://127.0.0.1:${port}/Gra-ROBOCZA.html?memdebug=1`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(5000);
  await page.getByText('ROZPOCZNIJ GRĘ').click(); await page.waitForTimeout(2000);
  await page.getByText('ROZPOCZNIJ KONFIGURACJĘ').click(); await page.waitForTimeout(2000);
  const W = page.locator('.civ-newgame'); await W.getByText(/Epoka kamienia/i).first().click(); await page.waitForTimeout(800);
  await page.getByRole('button', { name: /dalej/i }).click(); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /dalej/i }).click(); await page.waitForTimeout(1500);
  await page.fill('input[type=text],input[type=number]', '7').catch(() => log('seed fill fail'));
  await page.getByText(/ROZPOCZNIJ GRE/i).click();
  const t0 = Date.now();
  await page.waitForTimeout(3000);
  await page.waitForFunction(() => !document.body.innerText.includes('Tworzenie świata'), null, { timeout: 900000, polling: 2000 }).catch(() => log('worldgen wait timeout'));
  log('worldgen done after ms', Date.now() - t0);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(OUT, 'r2-smoke-t1.png') });
  const cv = await page.evaluate(() => ({ canvases: document.querySelectorAll('canvas').length, hud: /TURA \d+/.test(document.body.innerText) }));
  log('canvas/HUD', JSON.stringify(cv));
  const dismiss = async () => {
    for (let k = 0; k < 8; k++) {
      const clicked = await page.evaluate(() => {
        const re = /^(OK|Zamknij|Wróć|Dalej|Rozumiem|Kontynuuj|Zamknij okno|Pomiń|Zamknij kartę|✕.*)$/i;
        const bs = [...document.querySelectorAll('button')].filter(x => x.offsetParent !== null && re.test(x.innerText.trim()) && !/MENU|WYJDŹ/i.test(x.innerText));
        if (bs[0]) { const t = bs[0].innerText; bs[0].click(); return t; } return null;
      });
      if (!clicked) break; log('  dismissed', clicked); await page.waitForTimeout(500);
    }
  };
  let founded = false;
  const pts = []; for (let r = 0; r <= 12; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) pts.push([700 + dx * 30, 450 + dy * 30]);
  for (const [x, y] of pts) {
    await page.mouse.click(x, y); await page.waitForTimeout(250);
    if (!(await body()).includes('kliknij podświetlony hex')) { founded = true; log('city founded, click at', x, y); break; }
  }
  await page.waitForTimeout(3000);
  await dismiss();
  await page.screenshot({ path: path.join(OUT, 'r2-smoke-after-found.png') });
  log('founded', founded, 'turn', await turnNo());
  const trend = [];
  for (let t = 0; t < TURNS; t++) {
    const before = await turnNo(); const memBefore = mem.length;
    await dismiss();
    await page.getByRole('button', { name: /ZAKOŃCZ TURĘ/i }).click({ timeout: 30000 }).catch(e => log('end-turn click fail', e.message.slice(0, 100)));
    let after = before, waited = 0;
    while (waited < 180000) {
      await page.waitForTimeout(3000); waited += 3000;
      await dismiss();
      after = await turnNo();
      if (after !== null && before !== null && after > before && mem.length > memBefore) break;
    }
    if (!(after > before)) {
      log('STALL: turn did not advance. buttons:', JSON.stringify(await visibleButtons()));
      log('STALL body tail:', (await body()).replace(/\s+/g, ' ').slice(-600));
      await page.screenshot({ path: path.join(OUT, 'r2-smoke-stall-' + (t + 1) + '.png') });
      await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
    }
    log('end-turn #' + (t + 1), 'TURA', before, '->', after, 'memdebug new lines:', mem.length - memBefore, 'waited ms', waited);
    trend.push({ n: t + 1, before, after, newMem: mem.length - memBefore });
  }
  await page.screenshot({ path: path.join(OUT, 'r2-smoke-after-turns.png') });
  console.log('MEMDEBUG_LOGS_BEGIN'); mem.forEach(l => console.log(l)); console.log('MEMDEBUG_LOGS_END');
  console.log('TREND', JSON.stringify(trend));
  console.log('BAD_RESPONSES', JSON.stringify(bad));
  console.log('ERRORS', JSON.stringify(errs));
  await b.close(); srv.close();
});
