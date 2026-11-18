'use strict';
/**
 * player-ai-autopilot-test.cjs -- R-WEB-ECONOMY-MEASURE-PLAYER-AUTOPILOT-Q1: test haka autopilota gracza (pomiar).
 *
 * Asercje (zywa gra, headless Chromium, bundle vite poza repo):
 *  1) pod ?civTest=1 hak `__aiEconomyMeasure.setPlayerAiAutopilotForTest` istnieje; domyslnie stan = false.
 *  2) setter(true) -> stan true; setter(false) -> stan false (hak przelacza flage, nie jest no-op).
 *  3) bez ?civTest=1 hak nie istnieje (`__aiEconomyMeasure === undefined`) -- nie ma powierzchni produkcyjnej.
 *  4) mutacja (--mutant 1): kopia bundla, w ktorej setter ignoruje argument (flaga zostaje false) MUSI oblac asercje 2.
 *
 * Nie testuje zachowania ruchow gracza (to dowodzi bieg dymny `ai-economy-measure-run.cjs --player-ai 1` i parytet
 * flagi OFF z bazy, opisane w raporcie runu).
 *
 * Uzycie (z gra/): node tools/player-ai-autopilot-test.cjs [--dist <abs-dist>] [--mutant 1]
 *   Bez --dist bundle budowany do os.tmpdir() (vite, poza repo). Wyjscie: 0 = zielone, 1 = czerwone.
 *   Brak przegladarki (CHROME_PATH / /usr/bin/chromium) -> SKIP, kod 0.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const GRA_DIR = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';
const MUTANT = arg('mutant', '0') === '1';
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok });
  console.log((ok ? 'ZIELONE ' : 'CZERWONE ') + name + (detail ? ' :: ' + detail : ''));
}

function buildDist(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  execFileSync(process.execPath, [path.join(GRA_DIR, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--outDir', outDir, '--emptyOutDir'],
    { cwd: GRA_DIR, stdio: 'inherit', timeout: 500000 });
  return outDir;
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const n of fs.readdirSync(src)) {
    const s = path.join(src, n);
    const d = path.join(dst, n);
    if (fs.statSync(s).isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

/** Mutacja: setter ignoruje argument (flaga zostaje false). Zmiana tylko w KOPII bundla. */
function makeMutant(dist, outDir) {
  copyDir(dist, outDir);
  let touched = 0;
  for (const n of fs.readdirSync(outDir)) {
    if (!n.endsWith('.js') && !n.endsWith('.html')) continue;
    const f = path.join(outDir, n);
    const txt = fs.readFileSync(f, 'utf8');
    // Bundle zminifikowany: `setPlayerAiAutopilotForTest:d=>{x=d===!0}` -> setter no-op (flaga zostaje false).
    const re = /setPlayerAiAutopilotForTest:\s*([\w$]+)\s*=>\s*\{\s*[\w$]+\s*=\s*\1\s*===\s*!0\s*\}/g;
    if (!re.test(txt)) continue;
    re.lastIndex = 0;
    fs.writeFileSync(f, txt.replace(re, (_m, p) => 'setPlayerAiAutopilotForTest:' + p + '=>{}'));
    touched++;
  }
  if (touched === 0) throw new Error('mutacja: nie znaleziono setter-a w bundlu (zmiana nazwy?)');
  return outDir;
}

async function main() {
  let chromium = null;
  try { ({ chromium } = require(path.join(GRA_DIR, 'node_modules', 'playwright'))); } catch (_) { chromium = null; }
  if (!chromium || !fs.existsSync(CHROME)) {
    console.log('SKIP: brak playwright lub przegladarki (' + CHROME + ') -- kod 0');
    process.exit(0);
  }
  let dist = arg('dist', '');
  dist = dist ? path.resolve(dist) : buildDist(path.join(os.tmpdir(), 'player-ai-autopilot-dist'));
  if (MUTANT) dist = makeMutant(dist, path.join(os.tmpdir(), 'player-ai-autopilot-mutant'));
  const url = 'file://' + path.join(dist, 'index.html');
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.goto(url + '?civTest=1&civSeed=4242', { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__aiEconomyMeasure, null, { timeout: 180000 });
    const def = await page.evaluate(() => window.__aiEconomyMeasure.playerAiAutopilotForTestState());
    check('1 hak istnieje, domyslnie false', def === false, 'state=' + def);
    await page.evaluate(() => window.__aiEconomyMeasure.setPlayerAiAutopilotForTest(true));
    const on = await page.evaluate(() => window.__aiEconomyMeasure.playerAiAutopilotForTestState());
    await page.evaluate(() => window.__aiEconomyMeasure.setPlayerAiAutopilotForTest(false));
    const off = await page.evaluate(() => window.__aiEconomyMeasure.playerAiAutopilotForTestState());
    check('2 setter przelacza flage (true -> false)', on === true && off === false, 'on=' + on + ' off=' + off);
    const page2 = await browser.newPage();
    await page2.goto(url + '?civSeed=4242', { waitUntil: 'load', timeout: 180000 });
    await page2.waitForTimeout(3000);
    const absent = await page2.evaluate(() => window.__aiEconomyMeasure === undefined);
    check('3 bez ?civTest=1 hak nie istnieje', absent === true, 'absent=' + absent);
  } finally {
    await browser.close();
  }
  const bad = results.filter(r => !r.ok).length;
  console.log('WYNIK: ' + (results.length - bad) + '/' + results.length + ' zielone' + (MUTANT ? ' (mutant)' : ''));
  process.exit(bad === 0 ? 0 : 1);
}

main().catch(e => {
  console.error('BLAD: ' + ((e && e.stack) || e));
  process.exit(1);
});
