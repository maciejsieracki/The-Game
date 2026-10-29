'use strict';
/** R-START-MAP-SEED-REMOVE-Q1: browser and generator regression. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(os.tmpdir(), 'r-start-map-seed-remove-q1');
let passed = 0;
function ok(label, condition) {
  if (!condition) throw new Error('FAIL: ' + label);
  passed++;
  console.log('  PASS ' + label);
}
function chromePaths() {
  const paths = [process.env.CIV_CHROME_PATH, process.env.CHROME_PATH, '/usr/bin/chromium'];
  for (const dir of [path.join(os.homedir(), '.cache/ms-playwright'), '/opt/pw-browsers']) {
    try {
      for (const e of fs.readdirSync(dir).filter(x => x.startsWith('chromium')).sort().reverse()) {
        paths.push(path.join(dir, e, 'chrome-linux64/chrome'), path.join(dir, e, 'chrome-linux/chrome'));
      }
    } catch (_) {}
  }
  return [...new Set(paths.filter(Boolean))].filter(fs.existsSync);
}
async function launch() {
  try { return await chromium.launch({ headless: true }); } catch (first) {
    for (const executablePath of chromePaths()) {
      try { return await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox', '--use-gl=swiftshader'] }); } catch (_) {}
    }
    throw first;
  }
}
async function runBrowser() {
  fs.rmSync(OUT, { recursive: true, force: true });
  execFileSync(process.execPath, ['./node_modules/vite/bin/vite.js', 'build', '--outDir', OUT, '--emptyOutDir'], { cwd: ROOT, stdio: 'inherit' });
  const html = fs.readFileSync(path.join(OUT, 'index.html'));
  const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('.civ-menu .mbtn.primary', { timeout: 60000 });
    await page.locator('.civ-menu .mbtn.primary').click();
    await page.waitForSelector('.civ-newgame .cta-hero');
    await page.locator('.civ-newgame .cta-hero').click();
    await page.waitForSelector('.civ-newgame .epoch-grid');
    await page.locator('.civ-newgame .nav .nb.next').click();
    await page.waitForSelector('.civ-newgame .civ-layout');
    await page.locator('.civ-newgame .nav .nb.next').click();
    await page.waitForSelector('.civ-newgame .sett-layout');
    const seedExists = await page.locator('.civ-newgame input[name="seed"], .civ-newgame [data-runtime-seed="true"]').count();
    const text = await page.locator('.civ-newgame .content').innerText();
    ok('krok ustawień nie renderuje pola seed', seedExists === 0);
    ok('krok ustawień nie pokazuje etykiety ani instrukcji ziarna', !/ziarno mapy|puste = losowy seed|wpisz tę samą liczbę/i.test(text));
    ok('zwykła nawigacja Start jest dostępna', await page.locator('.civ-newgame .nav .nb.next').isEnabled());
    await page.locator('.civ-newgame .seat2-toggle-btn').click();
    await page.locator('.civ-newgame .nav .nb.next').click();
    await page.waitForSelector('.civ-newgame .seat2-dist', { timeout: 10000 });
    const seatText = await page.locator('.civ-newgame .content').innerText();
    ok('ekran fotela 2 nie renderuje pola seed', await page.locator('.civ-newgame input[name="seed"], .civ-newgame [data-runtime-seed="true"]').count() === 0);
    ok('ekran fotela 2 nie pokazuje etykiety ani instrukcji ziarna', !/ziarno mapy|puste = losowy seed|wpisz tę samą liczbę/i.test(seatText));
    ok('ekran fotela 2 zachowuje przycisk rozpoczęcia', await page.locator('.civ-newgame .nav .nb.next').isVisible());
    ok('brak błędów JavaScript w ścieżce ustawień', errors.length === 0);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

function runGeneratorRegression() {
  const bundle = path.join(os.tmpdir(), 'r-start-map-seed-generator-q1.cjs');
  execFileSync(process.execPath, ['./node_modules/esbuild/bin/esbuild', 'src/map/generator.ts', '--bundle', '--platform=node', '--format=cjs', `--outfile=${bundle}`], { cwd: ROOT, stdio: 'inherit' });
  const { generateMap } = require(bundle);
  const snapshot = map => JSON.stringify(Object.keys(map.hexes).sort().map(key => {
    const h = map.hexes[key];
    return [key, h.teren, h.nakladka, h.zasob];
  }));
  const first = generateMap(20, 16, 123456, 'kontynenty');
  const repeat = generateMap(20, 16, 123456, 'kontynenty');
  const other = generateMap(20, 16, 654321, 'kontynenty');
  ok('generator zachowuje identyczny układ dla powtórzonego zapisanego ziarna', snapshot(first) === snapshot(repeat));
  ok('generator nadal rozróżnia różne zapisane ziarna', snapshot(first) !== snapshot(other));
  ok('generator zachowuje seed w wyniku mapy', first.seed === 123456);
}

(async () => {
  runGeneratorRegression();
  await runBrowser();
  console.log(`PASS ${passed}/${passed} — R-START-MAP-SEED-REMOVE-Q1`);
})().catch(error => { console.error(error); process.exitCode = 1; });
