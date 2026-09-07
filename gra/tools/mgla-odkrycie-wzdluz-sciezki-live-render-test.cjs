'use strict';
/**
 * mgla-odkrycie-wzdluz-sciezki-live-render.cjs — P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1.
 *
 * Kryterium konca 4 (00-dispatch.md): "Zywy render w headless Chromium: Zwiadowca przechodzi
 * przez duzy obszar w jednej turze -- teren na trasie widoczny jako odkryty (nie czarny/
 * nieodkryty) po ruchu, porownanie zrzutu PRZED i PO."
 *
 * OGRANICZENIE ARCHITEKTONICZNE (recon, potwierdzone tresc `barb-camp-destruction-test.cjs`):
 * main.ts jest monolitycznym plikiem z zaleznosciami DOM/THREE -- ZADEN test w tym repo go nie
 * bundluje ani nie steruje pelna gra 3D w Chromium dla logiki nie-wizualnej (ta klasa tematow w
 * tym repo dostaje test bundlowanego modulu + weryfikacje "static:" nad zrodlem main.ts -- patrz
 * SEKCJA D w mgla-odkrycie-wzdluz-sciezki-test.cjs). Klikanie w konkretny heks na plotnie 3D bez
 * nowego haka debug (poza allowlista tego tematu -- main.ts ograniczone WYLACZNIE do trzech
 * nazwanych miejsc) nie ma w tym repo precedensu (sprawdzone: zero testow klika w
 * .civ-map-canvas/#map-canvas na wspolrzednych heksu).
 *
 * Ten plik jest wiec DOWODEM CZESCIOWYM, uczciwie tak oznaczonym: zywy render w PRAWDZIWEJ,
 * headless Chromium, PRAWDZIWEJ (niezmodyfikowanej, zbundlowanej z gra/src/game/visibility.ts)
 * funkcji `computeVisibleAlongPath` -- NIE reimplementacja logiki, ten sam kod co main.ts wola.
 * Renderuje siatke heksow: SZARY = nieodkryty ("czarny" z kryterium), ZIELONY = odkryty. Zrzut
 * PRZED (widocznosc tylko z pozycji koncowej -- stary bug) i PO (unia sciezki -- naprawa).
 * Rzeczywiste wpiecie w main.ts (KTORE heksy main.ts faktycznie przekazuje) jest dowiedzione
 * OSOBNO, statycznie, w mgla-odkrycie-wzdluz-sciezki-test.cjs sekcja D -- ten plik dowodzi, ze
 * SAMA funkcja realnie odkrywa wiecej terenu wzdluz sciezki, wizualnie, w przegladarce.
 *
 * Usage (z gra/): node tools/mgla-odkrycie-wzdluz-sciezki-live-render.cjs [--shots <dir>]
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
// SPRZATANIE PO PRZERWANYM PRZEBIEGU — BEZ dotykania dyspozycji sygnalow.
// Wczesniejsza wersja rejestrowala tu handlery SIGINT/SIGTERM/SIGHUP. To bylo GORSZE niz
// wyciek katalogu. Rejestracja handlera zdejmuje domyslna akcje sygnalu, a sygnal
// dostarczony w trakcie synchronicznego `execSync` (`vite build` — czyli wiekszosc czasu
// zycia tej bramki) NIE odpala handlera JS w ogole i zostaje POLKNIETY. Zmierzone na
// minimalnej reprodukcji i na tej bramce: bez handlera SIGTERM daje `exit=143` natychmiast,
// z handlerem proces zyje dalej i konczy sie `exit=0`. Bramka tracila zabijalnosc, a
// przerwany przebieg raportowal SUKCES — dokladnie ten falszywy ZIELONY, ktory ten temat
// ma likwidowac. Dlatego handlerow sygnalow tu nie ma i byc nie moze.
// Zamiast tego przy STARCIE kasujemy wlasne osierocone katalogi z poprzednich przebiegow,
// ktorych proces juz nie zyje. Dziala takze po SIGKILL, nieprzechwytywalnym z definicji.
(() => {
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  // Sygnatura nazw nadawana przez ten temat: `<baza>-<pid>-<6 znakow>` (+ ewent. rozszerzenie).
  const STALE = /-(\d+)-[a-z0-9]{6}(?:\.[A-Za-z0-9]+)?$/;
  const alive = (pid) => {
    try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
  };
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      const m = STALE.exec(ent);
      if (!m) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;   // zrzuty sa DOWODEM (§9 pkt 6)
      const pid = Number(m[1]);
      // Cudzy (albo wlasny) ZYWY przebieg zostaje nietkniety — kasujemy wylacznie sieroty.
      if (!Number.isInteger(pid) || pid === process.pid || alive(pid)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots') || path.join(
  GRA_ROOT, '..', 'dyspozycje', 'autobot', 'runs', 'P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1', 'dowody',
);
fs.mkdirSync(SHOTS, { recursive: true });

let pass = 0, fail = 0;
function assert(cond, msg, detail) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg, detail !== undefined ? '-- ' + JSON.stringify(detail) : ''); }
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) {
    console.error('[mgla-sciezka-live-render] playwright nie znaleziony -- npm i -D playwright');
    process.exit(1);
  }

  // Bundel PRZEGLADAROWY (iife) z realnego, niezmodyfikowanego modulu visibility.ts.
  const bundleJs = esbuild.buildSync({
    entryPoints: [path.join(GRA_ROOT, 'src', 'game', 'visibility.ts')],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'VisMod',
    write: false,
    logLevel: 'silent',
  }).outputFiles[0].text;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{background:#111;margin:0;padding:16px;font-family:monospace;color:#eee}
    .grid{display:grid;grid-template-columns:repeat(14,18px);gap:1px;margin-bottom:18px}
    .hex{width:18px;height:18px;background:#3a3a3a}
    .hex.explored{background:#3fae55}
    .hex.path{outline:2px solid #ffd23f}
    h2{font-size:13px;margin:4px 0}
  </style></head><body>
    <h2 id="title-before">PRZED (widocznosc tylko z pozycji koncowej -- stary bug)</h2>
    <div class="grid" id="grid-before"></div>
    <h2 id="title-after">PO (unia widocznosci z calej sciezki -- naprawa)</h2>
    <div class="grid" id="grid-after"></div>
    <script>${bundleJs}</script>
    <script>
      const { computeVisibleAt, computeVisibleAlongPath } = VisMod;
      const Q0 = -3, Q1 = 10, R0 = -3, R1 = 10;
      const map = { szerokoscQ: 14, wysokoscR: 14, seed: 1, hexes: {} };
      for (let q = Q0; q <= Q1; q++) for (let r = R0; r <= R1; r++) map.hexes[q + ',' + r] = { placeholder: true };

      const RUCH = 6, SIGHT = 1;
      const pathHexes = [];
      for (let i = 1; i <= RUCH; i++) pathHexes.push({ q: i, r: 0 });
      const dest = pathHexes[pathHexes.length - 1];

      const before = computeVisibleAt(dest.q, dest.r, map, SIGHT);
      const after = computeVisibleAlongPath(pathHexes, map, SIGHT);

      window.__mglaLiveResult = {
        beforeSize: before.size,
        afterSize: after.size,
        midPathHexInBefore: before.has('1,1'),
        midPathHexInAfter: after.has('1,1'),
        beforeSubsetOfAfter: [...before].every(k => after.has(k)),
      };

      function renderGrid(elId, visibleSet) {
        const el = document.getElementById(elId);
        for (let r = R0; r <= R1; r++) {
          for (let q = Q0; q <= Q1; q++) {
            const div = document.createElement('div');
            const key = q + ',' + r;
            div.className = 'hex' + (visibleSet.has(key) ? ' explored' : '')
              + (pathHexes.some(h => h.q === q && h.r === r) ? ' path' : '');
            el.appendChild(div);
          }
        }
      }
      renderGrid('grid-before', before);
      renderGrid('grid-after', after);
    </script>
  </body></html>`;

  const htmlPath = path.join(os.tmpdir(), `mgla-sciezka-live-render-${TMPDIR_RUN_ID}.html`);
  fs.writeFileSync(htmlPath, html, 'utf8');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    browser = await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 700 } });
    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await page.goto('file://' + htmlPath, { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__mglaLiveResult);

    const result = await page.evaluate(() => window.__mglaLiveResult);
    console.log('[mgla-sciezka-live-render] wynik z realnej Chromium:', JSON.stringify(result));

    assert(consoleErrors.length === 0, 'zero bledow JS w trakcie renderu', consoleErrors);
    assert(result.afterSize > result.beforeSize,
      'ZYWA Chromium: PO (unia sciezki) ma wiecej odkrytych heksow niz PRZED (pozycja koncowa)', result);
    assert(result.midPathHexInBefore === false,
      'ZYWA Chromium: heks przy poczatku sciezki (1,1) NIE odkryty w PRZED (bug odtworzony wizualnie)');
    assert(result.midPathHexInAfter === true,
      'ZYWA Chromium: heks przy poczatku sciezki (1,1) odkryty w PO (naprawa widoczna wizualnie)');
    assert(result.beforeSubsetOfAfter === true,
      'ZYWA Chromium: regresja -- PRZED jest podzbiorem PO (widocznosc koncowa zachowana)');

    await page.locator('#grid-before').screenshot({ path: path.join(SHOTS, 'sciezka-przed.png') });
    await page.locator('#grid-after').screenshot({ path: path.join(SHOTS, 'sciezka-po.png') });
    console.log('[mgla-sciezka-live-render] zrzuty zapisane w', SHOTS);
  } finally {
    await browser.close();
  }

  console.log('\n' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
