'use strict';
/**
 * web-turn-slowdown-texsmoke.cjs — R-WEB-TURN-SLOWDOWN-Q2 runda 2 (zarzut 4 Evaluatora):
 * odtworzenie konfiguracji smoke z `R-WEB-MEMORY-LEAKS-RELEASE-ROBOCZA-Q1/evidence/
 * smoke-chromium-r2.cjs` (UI: ROZPOCZNIJ GRĘ → konfiguracja → Epoka kamienia → seed 7,
 * założenie miasta kliknięciem, „ZAKOŃCZ TURĘ” przyciskiem; viewport 1400×900, `?memdebug=1`),
 * w której zaobserwowano NIEUSTALONY wzrost `textures` 18→21→22 w turach 7–9, z dodanym
 * spisem tekstur sceny Z TOŻSAMOŚCIĄ (`__turnSlowdownTestDebug.textureCensusDetail()`:
 * `Texture.id`, typ obiektu, rozmiar obrazu, nazwa obiektu/rodzica) po każdej turze.
 *
 * Wynik: <out>/texsmoke.json (per tura: linia memdebug, spis), <out>/texsmoke-diff.txt
 * (per tura: tekstury dodane/usunięte względem poprzedniej tury), <out>/texsmoke.log.
 *
 * Użycie (z gra/): node tools/web-turn-slowdown-texsmoke.cjs --dist <katalog z index.html>
 *                  --out <katalog> [--turns 9] [--html index.html]
 */
const path = require('path');
const fs = require('fs');
const http = require('http');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const ROOT = path.resolve(arg('dist', ''));
const OUT = arg('out');
const TURNS = Number(arg('turns', '9'));
const HTML = arg('html', 'index.html');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
if (!arg('dist') || !OUT) { console.error('Użycie: --dist <katalog> --out <katalog>'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const logLines = [];
const log = (...a) => { const l = new Date().toISOString().slice(11, 19) + ' ' + a.join(' '); logLines.push(l); console.log(l); };

const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); fs.createReadStream(f).pipe(res);
});
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port;
  const b = await chromium.launch({ executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const mem = [];
  page.on('console', (m) => { if (m.text().includes('[memdebug]')) { mem.push(m.text()); log('MEM', m.text()); } });
  const body = async () => (await page.evaluate(() => document.body.innerText));
  const turnNo = async () => { const m = (await body()).match(/TURA (\d+)/); return m ? parseInt(m[1], 10) : null; };
  await page.goto(`http://127.0.0.1:${port}/${HTML}?memdebug=1`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForTimeout(5000);
  await page.getByText('ROZPOCZNIJ GRĘ').click(); await page.waitForTimeout(2000);
  await page.getByText('ROZPOCZNIJ KONFIGURACJĘ').click(); await page.waitForTimeout(2000);
  const W = page.locator('.civ-newgame'); await W.getByText(/Epoka kamienia/i).first().click(); await page.waitForTimeout(800);
  await page.getByRole('button', { name: /dalej/i }).click(); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /dalej/i }).click(); await page.waitForTimeout(1500);
  await page.fill('input[type=text],input[type=number]', '7').catch(() => log('seed fill fail'));
  await page.getByText(/ROZPOCZNIJ GRE/i).click();
  await page.waitForTimeout(3000);
  await page.waitForFunction(() => !document.body.innerText.includes('Tworzenie świata'), null, { timeout: 900000, polling: 2000 }).catch(() => log('worldgen wait timeout'));
  await page.waitForTimeout(5000);
  const dismiss = async () => {
    for (let k = 0; k < 8; k++) {
      const clicked = await page.evaluate(() => {
        const re = /^(OK|Zamknij|Wróć|Dalej|Rozumiem|Kontynuuj|Zamknij okno|Pomiń|Zamknij kartę|✕.*)$/i;
        const bs = [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null && re.test(x.innerText.trim()) && !/MENU|WYJDŹ/i.test(x.innerText));
        if (bs[0]) { const t = bs[0].innerText; bs[0].click(); return t; } return null;
      });
      if (!clicked) break; log('  dismissed', clicked); await page.waitForTimeout(500);
    }
  };
  const pts = []; for (let r = 0; r <= 12; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) pts.push([700 + dx * 30, 450 + dy * 30]);
  for (const [x, y] of pts) {
    await page.mouse.click(x, y); await page.waitForTimeout(250);
    if (!(await body()).includes('kliknij podświetlony hex')) { log('city founded, click at', x, y); break; }
  }
  await page.waitForTimeout(3000);
  await dismiss();
  const census = async () => page.evaluate(() => window.__turnSlowdownTestDebug.textureCensusDetail());
  const per = [{ turn: await turnNo(), mem: null, census: await census() }];
  for (let t = 0; t < TURNS; t++) {
    const before = await turnNo(); const memBefore = mem.length;
    await dismiss();
    await page.getByRole('button', { name: /ZAKOŃCZ TURĘ/i }).click({ timeout: 30000 }).catch((e) => log('end-turn click fail', e.message.slice(0, 100)));
    let after = before, waited = 0;
    while (waited < 180000) {
      await page.waitForTimeout(3000); waited += 3000;
      await dismiss();
      after = await turnNo();
      if (after !== null && before !== null && after > before && mem.length > memBefore) break;
    }
    const c = await census();
    per.push({ turn: after, mem: mem[mem.length - 1] || null, census: c });
    log('end-turn #' + (t + 1), 'TURA', before, '->', after, 'sceneTextures=' + c.length);
  }
  const lines = [];
  for (let i = 1; i < per.length; i++) {
    const prev = new Map(per[i - 1].census.map((x) => [x.texId, x]));
    const cur = new Map(per[i].census.map((x) => [x.texId, x]));
    const added = [...cur.values()].filter((x) => !prev.has(x.texId));
    const removed = [...prev.values()].filter((x) => !cur.has(x.texId));
    const tm = (per[i].mem || '').match(/textures=(\d+)/);
    lines.push(`TURA ${per[i].turn}: renderer.info textures=${tm ? tm[1] : '?'} · tekstury sceny=${per[i].census.length} · +${added.length} −${removed.length}`);
    for (const x of added) lines.push(`   + id=${x.texId} ${x.key} obj="${x.obj}" parent="${x.parent}" grand="${x.grand}"`);
    for (const x of removed) lines.push(`   - id=${x.texId} ${x.key} obj="${x.obj}" parent="${x.parent}" grand="${x.grand}"`);
  }
  const hist = {};
  for (const x of per[per.length - 1].census) hist[x.key] = (hist[x.key] || 0) + 1;
  lines.push('KONIEC: spis wg klucza = ' + JSON.stringify(hist));
  fs.writeFileSync(path.join(OUT, 'texsmoke.json'), JSON.stringify(per, null, 1));
  fs.writeFileSync(path.join(OUT, 'texsmoke-diff.txt'), lines.join('\n') + '\n');
  fs.writeFileSync(path.join(OUT, 'texsmoke.log'), logLines.join('\n') + '\n');
  console.log(lines.join('\n'));
  await b.close(); srv.close();
});
