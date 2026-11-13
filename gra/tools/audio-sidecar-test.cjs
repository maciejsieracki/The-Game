'use strict';
/**
 * audio-sidecar-test.cjs — R-WEB-BUILD-SPLIT-AUDIO-SIDECAR-Q1.
 *
 * Bramka podziału buildu: Gra-ROBOCZA.html (kod + dane nie-audio) + pliki-sąsiedzi audio-pack-N.js
 * (całe audio, base64, rejestr window.__CIV_AUDIO__), ładowane <script src> z file:// bez serwera i fetch.
 *
 *   node tools/audio-sidecar-test.cjs --dist <katalog z index.html + audio-pack-N.js> [--skip-guard]
 *
 * Zbuduj wcześniej POZA repo: `node node_modules/vite/bin/vite.js build --outDir <dir> --emptyOutDir`
 * (zakaz `npm run build` w gra/).
 *
 *  S1 w HTML 0 wystąpień `data:audio/` oraz 0 elementów danych audio; HTML zawiera <script src> do każdego pakietu.
 *  S2 pakiety: stałe nazwy audio-pack-1..N (ciągłe), każdy < 90 MB; żaden plik wyjściowy > 95 MB.
 *  S3 każdy mp3 z src/audio/utwory (bez _wykluczone) jest w dokładnie jednym pakiecie, bajty = SHA-256 źródła.
 *  W  (Chromium, file://, Z sąsiadami) ?playtest=mapa: zero pageerror/console.error; muzyka gry gra
 *     (currentTime rośnie); dyplomacja Greków: przywitanie gra (blob: URL, duration, currentTime rośnie);
 *     rejestr window.__CIV_AUDIO__ opróżniony po zdekodowaniu.
 *  N  (Chromium, file://, BEZ sąsiadów — tylko index.html w osobnym katalogu): gra startuje; zero pageerror;
 *     jedyne błędy konsoli to brak pliku audio-pack-N.js (net::ERR_FILE_NOT_FOUND — komunikat przeglądarki o
 *     zasobie, nie błąd gry); żaden <audio> nie gra; otwarcie dyplomacji nie rzuca; HUD działa.
 *  G  (strażnik) build z CIV_OUTPUT_FAIL_BYTES=1000000 kończy się kodem != 0 i komunikatem o pliku wyjściowym.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist');
if (!DIST) { console.error('usage: --dist <dir> [--skip-guard]'); process.exit(2); }
const SKIP_GUARD = process.argv.includes('--skip-guard');
const DIR = path.resolve(DIST);
const GRA = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
function check(name, ok, detail) {
  if (!ok) failed++;
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 500) : ''));
}
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
function walk(dir, re, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, re, out); else if (re.test(e.name)) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------- S: statycznie
const htmlPath = path.join(DIR, 'index.html');
const html = fs.readFileSync(htmlPath, 'latin1');
const packNames = fs.readdirSync(DIR).filter((f) => /^audio-pack-\d+\.js$/.test(f))
  .sort((a, b) => Number(/\d+/.exec(a)[0]) - Number(/\d+/.exec(b)[0]));
check('S1a HTML bez `data:audio/`', !/data:audio\//.test(html));
check('S1b HTML bez elementów danych audio (data-mime="audio/…")', !/data-mime="audio\//.test(html));
const srcTags = [...html.matchAll(/<script src="(audio-pack-\d+\.js)"><\/script>/g)].map((m) => m[1]);
check('S1c HTML ma <script src> dokładnie do wszystkich pakietów (względna ścieżka, kolejność)',
  packNames.length > 0 && JSON.stringify(srcTags) === JSON.stringify(packNames), { packNames, srcTags });
check('S2a nazwy pakietów ciągłe audio-pack-1..N', packNames.every((n, i) => n === `audio-pack-${i + 1}.js`), packNames);
const sizes = Object.fromEntries(fs.readdirSync(DIR).map((f) => [f, fs.statSync(path.join(DIR, f)).size]));
check('S2b każdy pakiet < 90 MB', packNames.every((n) => sizes[n] < 90e6), sizes);
check('S2c żaden plik wyjściowy > 95 MB', Object.values(sizes).every((v) => v <= 95e6), sizes);

const srcMp3 = walk(path.join(GRA, 'src', 'audio', 'utwory'), /\.mp3$/i)
  .filter((f) => !f.split(path.sep).includes('_wykluczone'));
const srcHashes = new Map();
for (const f of srcMp3) srcHashes.set(sha(fs.readFileSync(f)), path.relative(GRA, f));
const packHashes = new Map(); // hash -> ile razy
for (const name of packNames) {
  const body = fs.readFileSync(path.join(DIR, name), 'latin1');
  const re = /r\["([0-9a-f]+)"\]="([A-Za-z0-9+/=]*)";/g; let m;
  while ((m = re.exec(body))) {
    const h = sha(Buffer.from(m[2], 'base64'));
    packHashes.set(h, (packHashes.get(h) || 0) + 1);
  }
}
const missing = [...srcHashes].filter(([h]) => !packHashes.has(h)).map(([, f]) => f);
const extra = [...packHashes.keys()].filter((h) => !srcHashes.has(h));
const dup = [...packHashes].filter(([, n]) => n > 1);
check('S3 każdy mp3 źródłowy w dokładnie jednym pakiecie, bajty = SHA-256 źródła',
  missing.length === 0 && extra.length === 0 && dup.length === 0,
  { srcMp3: srcMp3.length, unique: srcHashes.size, inPacks: packHashes.size, missing, extra: extra.length, dup: dup.length });

// ---------------------------------------------------------------- Chromium
async function launch(chromium) {
  const args = ['--autoplay-policy=no-user-gesture-required'];
  try { return await chromium.launch({ headless: true, args }); } catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME,
      args: [...args, '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}
const INIT = () => {
  const Orig = window.Audio; const all = [];
  function A(...a) { const e = new Orig(...a); all.push(e); return e; }
  A.prototype = Orig.prototype; window.Audio = A;
  window.__audioPlaying = () => all.filter((e) => !e.paused && e.hasAttribute('src'))
    .map((e) => ({ src: e.src.slice(0, 5), dur: e.duration, t: e.currentTime }));
};
async function gotoMapa(page, file) {
  await page.goto('file://' + file + '?playtest=mapa', { waitUntil: 'load', timeout: 180000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 180000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(() => !!window.__musicEraTestDebug && !!window.__truceTestDebug && !!window.__eraTestDebug
    && window.__eraTestDebug.getWorldState().citiesLen > 0, undefined, { timeout: 900000 });
  await wait(300);
}
async function playing(page, ms) {
  let last = [];
  for (const t0 = Date.now(); Date.now() - t0 < ms;) {
    last = await page.evaluate(() => window.__audioPlaying());
    if (last.length && last.every((x) => x.dur > 0)) return last; // duration NaN tuż po play() — czekamy na metadane
    await wait(250);
  }
  return last;
}

async function scenario(label, file, withPacks) {
  const { chromium } = require('playwright');
  const browser = await launch(chromium);
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; const pageErrs = [];
  page.on('pageerror', (e) => pageErrs.push(String(e).slice(0, 300)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const url = (m.location() && m.location().url) || '';
    errs.push({ text: m.text().slice(0, 200), url: url.slice(-40) });
  });
  await page.addInitScript(INIT);
  try {
    await gotoMapa(page, file);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    await page.evaluate(() => window.__musicEraTestDebug.startMusic('mapa'));
    const bg = await playing(page, withPacks ? 15000 : 4000);
    await wait(2000);
    const bg2 = await page.evaluate(() => window.__audioPlaying());
    if (withPacks) {
      check(`${label}1 muzyka gry gra (blob:, duration>0, currentTime rośnie)`,
        bg.length === 1 && bg[0].src === 'blob:' && bg[0].dur > 0 && bg2.length >= 1 && bg2[0].t > bg[0].t + 1, { bg, bg2 });
      await page.evaluate(() => {
        window.__musicEraTestDebug.setOwnerCivForTest(1, 'grecy');
        window.__truceTestDebug.openAudience(1);
      });
      await wait(1500);
      const d1 = await playing(page, 15000);
      await wait(2000);
      const d2 = await page.evaluate(() => window.__audioPlaying());
      check(`${label}2 dyplomacja Greków: przywitanie gra (blob:, currentTime rośnie, 30-60 s)`,
        d1.length === 1 && d1[0].src === 'blob:' && d1[0].dur > 30 && d1[0].dur < 60 && d2.length === 1 && d2[0].t > d1[0].t + 1, { d1, d2 });
      await page.evaluate(() => window.__truceTestDebug.closeAudience());
      const reg = await page.evaluate(() => (window.__CIV_AUDIO__ ? Object.keys(window.__CIV_AUDIO__).length : -1));
      check(`${label}3 rejestr __CIV_AUDIO__ opróżniony po zdekodowaniu (base64 zwolniony)`, reg === 0, { reg });
      check(`${label}4 zero pageerror / console.error`, pageErrs.length === 0 && errs.length === 0, { pageErrs, errs });
    } else {
      check(`${label}1 gra startuje bez sąsiadów, żaden <audio> nie gra`, bg.length === 0 && bg2.length === 0, { bg, bg2 });
      await page.evaluate(() => {
        window.__musicEraTestDebug.setOwnerCivForTest(1, 'grecy');
        window.__truceTestDebug.openAudience(1);
      });
      await wait(3000);
      const d = await page.evaluate(() => window.__audioPlaying());
      await page.evaluate(() => window.__truceTestDebug.closeAudience());
      check(`${label}2 dyplomacja bez sąsiadów: cisza, bez wyjątku`, d.length === 0, { d });
      const hud = await page.locator('.civ-hud, .civ-ux-frame, .civ-cs').count();
      check(`${label}3 HUD gry działa`, hud > 0, { hud });
      check(`${label}4 zero pageerror`, pageErrs.length === 0, pageErrs);
      const foreign = errs.filter((e) => !(/audio-pack-\d+\.js$/.test(e.url) && /ERR_FILE_NOT_FOUND/.test(e.text)));
      check(`${label}5 jedyne błędy konsoli = brak plików audio-pack-N.js (ERR_FILE_NOT_FOUND)`,
        foreign.length === 0 && errs.length === packNames.length, { errs, foreign, expectedMissing: packNames.length });
    }
  } catch (e) {
    check(`${label}X wyjątek scenariusza`, false, String(e && e.stack || e).slice(0, 400));
  }
  await browser.close();
}

async function main() {
  await scenario('W', htmlPath, true);
  const lone = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-nopack-'));
  try {
    fs.copyFileSync(htmlPath, path.join(lone, 'index.html'));
    await scenario('N', path.join(lone, 'index.html'), false);
  } finally { fs.rmSync(lone, { recursive: true, force: true }); }

  if (!SKIP_GUARD) {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-guard-'));
    try {
      const r = spawnSync('node', ['./node_modules/vite/bin/vite.js', 'build', '--outDir', out, '--emptyOutDir'],
        { cwd: GRA, env: { ...process.env, CIV_OUTPUT_FAIL_BYTES: '1000000' }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      const txt = (r.stderr || '') + (r.stdout || '');
      check('G strażnik: build FAIL (kod != 0) gdy plik wyjściowy > progu',
        r.status !== 0 && /plik wyjsciowy .* > 1000000 B/.test(txt),
        { status: r.status, msg: (txt.match(/plik wyjsciowy[^\n]*/) || [''])[0] });
    } finally { fs.rmSync(out, { recursive: true, force: true }); }
  }
  console.log(failed === 0 ? 'audio-sidecar-test: PASS' : `audio-sidecar-test: FAIL (${failed})`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
