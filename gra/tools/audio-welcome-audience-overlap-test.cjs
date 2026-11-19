'use strict';
/**
 * audio-welcome-audience-overlap-test.cjs — R-WEB-AUDIO-WELCOME-TO-AUDIENCE-MUSIC-OVERLAP-Q1
 *
 * Realny headless Chromium. Bundle Vite z malego wejscia (poza repo, w katalogu
 * scratch) wola PRAWDZIWE moduly: muzyka-antyczna.ts (startMusic/startDiplomacyMusic)
 * i civWelcomeScreen.ts (showCivWelcomeScreen + klik „Audiencja"). Instrumentacja
 * window.Audio (addInitScript) liczy elementy <audio>, ktore REALNIE graja.
 *
 * Asercje (stan graniczny = JEDNA muzyka naraz):
 *  W1. Przywitanie innej cywilizacji -> audiencja (inny civId): w CALYM przejsciu
 *      (0..4,5 s po kliknieciu) co najwyzej 1 grajacy element; po 3 s dokladnie 1.
 *  W2. Przywitanie -> audiencja tej samej cywilizacji: ta sama playlista gra dalej
 *      (bez restartu i bez dubla): max 1 grajacy; czas odtwarzania rosnie (t nie cofa sie).
 *  W3. Nigdy nie wraca muzyka gry (mapa) w trakcie przejscia: w zadnej probce nie
 *      grają jednoczesnie muzyka gry i nakladka dyplomacji.
 *  W4. Zamkniecie audiencji -> zero utworow cywilizacji, wraca muzyka gry (1 element).
 *  W5. Zero pageerror / console.error (poza 404 zasobow — nie dotyczy tego testu).
 *
 * Przed poprawka (ten sam harness, baseline zmierzony PRZED zmiana):
 *   przywitanie grecy -> audiencja rzymianie: 3 grajace w +0 ms (przywitanie + muzyka gry + nowa),
 *   2 w +100 ms; tez sama cywilizacja: muzyka gry wraca na ~0,3 s obok przywitania.
 *
 * Usage (z gra/): node tools/audio-welcome-audience-overlap-test.cjs [scratchDirAbs]
 *   Pomija build, gdy SKIP_BUILD=1 i bundle juz jest w scratch.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'audio-welcome-overlap-' + process.pid);
const DIST = path.join(SCRATCH, 'dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mp3': 'audio/mpeg', '.css': 'text/css', '.json': 'application/json' };
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

function writeHarness() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.writeFileSync(path.join(SCRATCH, 'index.html'),
    '<!doctype html><html><head><meta charset="utf-8"><title>overlap</title></head>\n' +
    '<body><script type="module" src="./entry.ts"></script></body></html>\n');
  const m = (f) => path.join(GRA_DIR, 'src', f).split(path.sep).join('/');
  fs.writeFileSync(path.join(SCRATCH, 'entry.ts'), [
    `import { startMusic, startDiplomacyMusic, stopDiplomacyMusic, isMusicPlaying } from '${m('audio/muzyka-antyczna')}';`,
    `import { showCivWelcomeScreen } from '${m('ui/civWelcomeScreen')}';`,
    'const Orig = window.Audio;',
    'const all: HTMLAudioElement[] = [];',
    'function A(...a: any[]) { const e = new (Orig as any)(...a); all.push(e); return e; }',
    '(A as any).prototype = (Orig as any).prototype;',
    '(window as any).Audio = A;',
    'const probe = () => all.filter((e) => !e.paused && e.hasAttribute("src")).map((e) => ({',
    '  dur: e.duration, t: e.currentTime, vol: e.volume, src: e.src.slice(-48),',
    '}));',
    '(window as any).__probe = probe;',
    '(window as any).__music = () => isMusicPlaying();',
    '(window as any).__startGameMusic = () => startMusic("mapa");',
    '(window as any).__openWelcome = (civ: string, otherCiv: string) => {',
    '  showCivWelcomeScreen({',
    '    ownerId: 1, civKey: civ, friendly: true, seed: 1, era: 1, leaderName: null, playMusic: true,',
    '    onAudience: () => { startDiplomacyMusic(otherCiv); },',
    '    onClose: () => {},',
    '  } as any);',
    '};',
    '(window as any).__clickAudience = () => (document.querySelector(\'[data-cww="audience"]\') as HTMLElement | null)?.click();',
    '(window as any).__closeAudience = () => stopDiplomacyMusic();',
    '(window as any).__ready = true;',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(SCRATCH, 'vite.config.mjs'),
    `import { defineConfig } from ${JSON.stringify(path.join(GRA_DIR, 'node_modules/vite/dist/node/index.js').split(path.sep).join('/'))};\n` +
    `export default defineConfig({ root: ${JSON.stringify(SCRATCH.split(path.sep).join('/'))}, logLevel: 'warn', ` +
    `build: { outDir: ${JSON.stringify(DIST.split(path.sep).join('/'))}, emptyOutDir: true, modulePreload: false } });\n`);
}

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(DIST, 'index.html'))) {
    console.log('[overlap] SKIP_BUILD=1 — uzywam istniejacego bundle:', DIST);
    return;
  }
  writeHarness();
  console.log('[overlap] vite build harnessu do katalogu tymczasowego:', DIST);
  execSync(`node ./node_modules/vite/bin/vite.js build --config ${JSON.stringify(path.join(SCRATCH, 'vite.config.mjs'))}`,
    { cwd: GRA_DIR, stdio: 'pipe' });
}

function serve() {
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const p = path.join(DIST, rel);
    fs.readFile(p, (err, buf) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => resolve(srv)));
}

async function launch(chromium) {
  const args = ['--autoplay-policy=no-user-gesture-required'];
  try { return await chromium.launch({ headless: true, args }); }
  catch (e) {
    return await chromium.launch({
      headless: true, executablePath: FALLBACK_CHROME,
      args: [...args, '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

/** Probka: liczba grajacych elementow, czy gra muzyka gry, nazwy zrodel. */
async function sample(page) {
  return page.evaluate(() => {
    const p = window.__probe();
    return { n: p.length, music: window.__music(), p: p.map((x) => ({ t: +x.t.toFixed(2), vol: +x.vol.toFixed(2), src: x.src })) };
  });
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[overlap] playwright nie znaleziony'); process.exit(1); }
  buildBundle();
  const srv = await serve();
  const port = srv.address().port;

  const errors = [];
  const browser = await launch(chromium);
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/status of 404/.test(m.text())) errors.push('console.error: ' + m.text()); });

  try {
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__ready, undefined, { timeout: 60000 });

    console.log('W1 przywitanie grecy -> audiencja rzymianie (inny civId)');
    await page.evaluate(() => window.__startGameMusic());
    await wait(1200);
    await page.evaluate(() => window.__openWelcome('grecy', 'rzymianie'));
    await wait(1500);
    const before = await sample(page);
    assert('W1a przed audiencja gra WYLACZNIE przywitanie', before.n === 1 && !before.music && before.p[0].src.includes('grecy_przywitanie'), before);
    await page.evaluate(() => window.__clickAudience());
    let maxN = 0;
    let musicLeak = false;
    const t0 = Date.now();
    const trace = [];
    while (Date.now() - t0 < 4500) {
      const s = await sample(page);
      trace.push(s.n);
      maxN = Math.max(maxN, s.n);
      if (s.music && s.n > 0) musicLeak = true;
      await wait(40);
    }
    const after = await sample(page);
    assert('W1b w CALYM przejsciu co najwyzej 1 grajacy utwor (max=' + maxN + ')', maxN <= 1, trace);
    assert('W1c nigdy nie wraca muzyka gry obok nakladki dyplomacji', !musicLeak);
    assert('W1d po 4,5 s dokladnie 1 utwor: audiencja (rzymianie)',
      after.n === 1 && after.p[0].src.includes('rzymianie_przywitanie'), after);

    console.log('W2 przywitanie grecy -> audiencja grecy (ta sama playlista)');
    await page.evaluate(() => window.__openWelcome('grecy', 'grecy'));
    await wait(1200);
    const before2 = await sample(page);
    const tBefore = before2.p[0] ? before2.p[0].t : -1;
    await page.evaluate(() => window.__clickAudience());
    let maxN2 = 0;
    const t02 = Date.now();
    while (Date.now() - t02 < 3000) {
      const s = await sample(page);
      maxN2 = Math.max(maxN2, s.n);
      await wait(40);
    }
    const after2 = await sample(page);
    assert('W2a ta sama playlista: max 1 grajacy (bez dubla, max=' + maxN2 + ')', maxN2 <= 1, maxN2);
    assert('W2b ta sama playlista gra dalej bez restartu (t rosnie)',
      after2.n === 1 && after2.p[0].src.includes('grecy_przywitanie') && after2.p[0].t > tBefore, { tBefore, after2 });

    console.log('W3 zamkniecie audiencji -> muzyka gry');
    // zamkniecie audiencji = hideDiplomacyAudience -> stopDiplomacyMusic (ten sam eksport)
    await page.evaluate(() => window.__closeAudience());
    await wait(1200);
    const closed = await sample(page);
    assert('W3a po zamknieciu brak utworow cywilizacji, wraca muzyka gry (1 element)',
      closed.n === 1 && closed.music && !closed.p[0].src.includes('przywitanie'), closed);

    assert('W5 zero pageerror / console.error', errors.length === 0, errors);
  } catch (e) {
    fail++;
    console.error(' FAIL wyjatek:', e && e.stack || e);
  } finally {
    await browser.close();
    srv.close();
  }
  console.log(`\n${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
