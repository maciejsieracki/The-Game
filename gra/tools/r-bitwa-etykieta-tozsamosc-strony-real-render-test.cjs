'use strict';
/**
 * r-bitwa-etykieta-tozsamosc-strony-real-render-test.cjs
 * R-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1 -- zywy dowod w Chromium (Playwright), GOAL 1+2.
 *
 * ZGLOSZENIE (wlasciciel, 2026-09-03, ze zrzutem ekranu): "w wyniku bitwy jest
 * informacja 'wojownik wygrywa', a powinno byc 'gracz wygrywa'. Po lewej stronie
 * powinna byc informacja 'Grecy' zamiast 'wojownik', a po drugiej stronie powinna
 * byc 'Korynt, Grecy, panstwo-miasto' zamiast 'wojownik'. Ikona panstwa-miasta
 * powinna znajdowac sie po prawej stronie, a po lewej stronie ikona cywilizacji,
 * ktora atakuje."
 *
 * Pasek naglowka bitwy i popup "Wynik bitwy" to JEDEN i TEN SAM widok --
 * postBattleSummary.ts, wolany zarowno live podczas bitwy jak i na jej koncu
 * (recon dispatchu, potwierdzone). Ten test laduje PRAWDZIWY, produkcyjny artefakt
 * `vite build` (dokladnie ten kod, ktory dostaje gracz -- C-001, zero dev servera,
 * zero mockowania DOM) i przez hook window.__postBattleSummaryTestDebug (dodany w
 * postBattleSummary.ts, ten sam wzorzec co __eraTestDebug/__cityStateStartUnitsTestDebug
 * w main.ts) woła PRAWDZIWY buildPostBattleSummary()+showPostBattleSummary() dla trzech
 * scenariuszy z dispatchu: (A) gracz pelna cywilizacja vs miasto-panstwo, (B) wieloosobowy
 * roster, (C) barbarzynca -- i sprawdza zywy DOM + zrzuty ekranu.
 *
 * ── CO TA BRAMKA DOWODZI, A CZEGO NIE (RUNDA 3, zarzut Evaluatora 3) ─────────
 * Evaluator ma RACJE: `build()`/`show()` przez `__postBattleSummaryTestDebug` to
 * WSTRZYKNIECIE `BattleSummarySide`, wiec ta bramka NIE jest dowodem kryteriow konca
 * 3 (ikona miasta-panstwa) i 5 (ikona barbarzyncy) — omija cala droge, ktora w
 * prawdziwej grze USTALA `isCityState`/`isBarbarian`/`civIconId`
 * (main.ts `preBattleSideFromRoster` -> `new BattleScene(opts)` -> pola klasy ->
 * `_buildBattleSummaryData`). Poprzednia runda uznala te kryteria za spelnione na tej
 * podstawie — to bylo bledne i zostaje wycofane.
 *
 * DOWODZI (i tylko tyle): `buildCommanderCorner` — czysta funkcja widoku nad
 * `BattleSummarySide`, zero THREE.js/WebGL — dla zadanej tozsamosci strony renderuje
 * DOKLADNIE ta ikone, co `mkCommanderCard`: portret wladcy (pelna cywilizacja) /
 * `civIconSvg` (miasto-panstwo) / `brandIconSvg('chip-death')` (barbarzyncy), oraz
 * bold = civLabel i werdykt "<civLabel> wygrywa". Asercje porownuja SVG znak w znak z
 * `civIconSvg`/`brandIconSvg`/`PB_SVG.commander` odczytanymi z tego samego bundla.
 *
 * NIE DOWODZI: ze realna bitwa z miastem-panstwem/barbarzyncem faktycznie doprowadza
 * takie `BattleSummarySide` do tej funkcji. To pokrywa ZYWA bramka
 * `r-bitwa-etykieta-tozsamosc-strony-live-atak-test.cjs` — dzis wylacznie dla dwoch
 * PELNYCH cywilizacji (medalion `<img>` = portret wladcy, przez cala realna sciezke,
 * dwa sandboxy). Dla miasta-panstwa i barbarzyncy zaden sandbox gry (`?playtest=walka`,
 * `?playtest=mapa`, `?playtest=oblez`) takiej bitwy nie stawia (recon rundy 3:
 * `?playtest=mapa` ma `cityStatesCount: 0` na sztywno w `doStartPlaytestMapaSwiata`,
 * `?playtest=walka` to dwie jednostki bez miast, w obu zero barbarzyncow przez 20+
 * realnych tur), a doprowadzenie do niej w realnej, generowanej grze wymaga
 * wyprodukowania jednostki i realnego przemarszu ~5 heksow — patrz raport rundy 3,
 * zarzut 3: kryteria 3 (polowa: miasto-panstwo) i 5 pozostaja NIEDOWIEDZIONE ZYWO.
 *
 * Usage (z gra/):
 *   node tools/r-bitwa-etykieta-tozsamosc-strony-real-render-test.cjs
 *     [--dist <index.html>]  uzyj gotowego artefaktu vite zamiast budowac go w teście
 *     [--shots <katalog>]    zapisz zrzuty A/B/C do <katalog>
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');

function argOf(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}
const DIST_ARG = argOf('--dist');
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
// Przerwanie (SIGTERM z `timeout`, SIGINT z Ctrl-C, SIGHUP) nie odpala haka `exit`.
// Przekierowujemy je na process.exit(), zeby sprzatanie wyzej wykonalo sie tak samo.
// SIGKILL jest nieprzechwytywalny i zostawi katalog — to jedyna luka i jest swiadoma.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { process.exit(130); });
}
const SHOTS = argOf('--shots') || fs.mkdtempSync(path.join(os.tmpdir(), 'pbs-shots-'));
fs.mkdirSync(SHOTS, { recursive: true });

let chromium;
try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
catch (e) { console.error('Brak playwright w node_modules -- ' + e.message); process.exit(1); }

function findChromiumExecutable() {
  // Sandbox tego repo trzyma rewizje playwrighta w /opt/pw-browsers pod inna
  // nazwa niz oczekuje zainstalowany pakiet playwright -- jesli domyslne
  // uruchomienie sie nie powiedzie, probujemy jawnej sciezki najnowszej
  // dostepnej rewizji chromium-*/chrome-linux/chrome.
  const base = '/opt/pw-browsers';
  if (!fs.existsSync(base)) return null;
  const dirs = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort();
  for (const d of dirs.reverse()) {
    const p = path.join(base, d, 'chrome-linux', 'chrome');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function assert(cond, label) {
  if (!cond) throw new Error('ASSERT FAIL: ' + label);
  console.log('  [OK] ' + label);
}

async function readCorners(page) {
  return page.evaluate(() => {
    const wraps = Array.from(document.querySelectorAll('div'))
      .filter((el) => el.style.position === 'absolute' && el.style.top === '30px');
    const [atkCorner, defCorner] = wraps;
    // wrap children: [0]=medal (medalion), [1]=txt (name + sub); name = txt.children[0]
    const nameOf = (corner) => corner.children[1]?.children[0]?.textContent || '';
    const medalOf = (corner) => corner.children[0];
    const m1 = medalOf(atkCorner);
    const m2 = medalOf(defCorner);
    return {
      atkName: nameOf(atkCorner),
      defName: nameOf(defCorner),
      bodyText: document.body.textContent || '',
      atkHasImg: !!m1.querySelector('img'),
      defHasImg: !!m2.querySelector('img'),
      atkSvg: m1.querySelector('svg')?.outerHTML || null,
      defSvg: m2.querySelector('svg')?.outerHTML || null,
    };
  });
}

async function buildDist() {
  const outDir = path.join(os.tmpdir(), `civ-bitwa-etyk-dist-${TMPDIR_RUN_ID}`);
  console.log('Buduje produkcyjny artefakt vite -> ' + outDir + ' (C-001: vite bezposrednio z node_modules, poza npm run build)...');
  execFileSync(process.execPath, [
    path.join(GRA, 'node_modules', 'vite', 'bin', 'vite.js'),
    'build', '--outDir', outDir, '--emptyOutDir',
  ], { cwd: GRA, stdio: 'inherit' });
  return path.join(outDir, 'index.html');
}

(async () => {
  const distIndex = DIST_ARG ? path.resolve(DIST_ARG) : await buildDist();
  if (!fs.existsSync(distIndex)) throw new Error('Brak artefaktu: ' + distIndex);

  const execPath = findChromiumExecutable();
  const browser = await chromium.launch(execPath ? { executablePath: execPath, args: ['--no-sandbox'] } : {});
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto('file://' + distIndex, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => !!(window).__postBattleSummaryTestDebug, { timeout: 20000 });
  console.log('Hook __postBattleSummaryTestDebug obecny w produkcyjnym bundlu (vite build).');

  // ---------------------------------------------------------------------
  // SCENARIUSZ A: gracz (Grecy) atakuje miasto-panstwo Korynt, 1 jednostka
  // vs 1 jednostka -- KRYTERIA KONCA 1,2,3.
  // ---------------------------------------------------------------------
  await page.evaluate(() => {
    const d = (window).__postBattleSummaryTestDebug;
    const data = d.build({
      winner: 'atakujacy',
      atkLabel: 'Grecy', // = civLabel, jak POPRAWIONY _sideDisplayLabel('atk') dzis zwraca
      defLabel: 'Korynt · Grecy · miasto-państwo',
      atkCivLabel: 'Grecy',
      defCivLabel: 'Korynt · Grecy · miasto-państwo',
      atkCivIconId: 'grecy',
      defCivIconId: 'grecy',
      atkIsCityState: false,
      defIsCityState: true,
      atkIsBarbarian: false,
      defIsBarbarian: false,
      atkEra: 1,
      defEra: 1,
      playerSide: 'atk',
      mode: 'manual',
      // typeId celowo != civLabel -- jednostka to "Wojownik", ale to NIE ma sie wyswietlac bold.
      atkBefore: [{ id: 'a1', typeId: 'Wojownik', kategoria: 'miecznik', hp: 20, maxHp: 20 }],
      defBefore: [{ id: 'd1', typeId: 'Hoplita', kategoria: 'wlocznik', hp: 0, maxHp: 18 }],
      lookupHp: (id) => (id === 'a1' ? 18 : null),
    });
    d.show(data, () => {});
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(SHOTS, 'A-gracz-vs-panstwo-miasto.png') });
  const domA = await readCorners(page);
  const iconsA = await page.evaluate(() => {
    const d = (window).__postBattleSummaryTestDebug;
    return { civIconGrecy: d.civIconSvg('grecy', 30), commanderFallback: d.commanderFallbackSvg };
  });
  assert(domA.atkName === 'Grecy', 'A: bold nazwa LEWA (atakujący) = "Grecy", NIE "Wojownik" (KRYTERIUM 1); otrzymano: ' + domA.atkName);
  assert(domA.defName.startsWith('Korynt'), 'A: bold nazwa PRAWA (obrońca) zaczyna się "Korynt"; otrzymano: ' + domA.defName);
  assert(!domA.bodyText.includes('Wojownik wygrywa'), 'A: brak "Wojownik wygrywa" w DOM');
  assert(domA.bodyText.includes('Grecy wygrywa'), 'A: werdykt "Grecy wygrywa" widoczny w DOM (KRYTERIUM 2)');
  assert(domA.atkHasImg, 'A: ikona LEWA (atakujący, pełna cywilizacja) = portret władcy <img> (KRYTERIUM 3)');
  assert(!domA.defHasImg, 'A: ikona PRAWA (obrońca, miasto-państwo) NIE jest portretem');
  assert(domA.defSvg === iconsA.civIconGrecy, 'A: ikona PRAWA = civIconSvg("grecy") dokładnie, symbol kultury (KRYTERIUM 3)');
  assert(domA.defSvg !== iconsA.commanderFallback, 'A: ikona PRAWA różna od generycznego PB_SVG.commander');

  // ---------------------------------------------------------------------
  // SCENARIUSZ B: wiele jednostek w rosterze (snaps.length>1) -- KRYTERIUM 4.
  // ---------------------------------------------------------------------
  await page.evaluate(() => {
    const d = (window).__postBattleSummaryTestDebug;
    const data = d.build({
      winner: 'obronca',
      atkLabel: 'Rzymianie', // civLabel, niezaleznie od licznosci rosteru (3 jednostki)
      defLabel: 'Kartagina',
      atkCivLabel: 'Rzymianie',
      defCivLabel: 'Kartagina',
      atkCivIconId: 'rzymianie',
      defCivIconId: 'kartagina',
      atkEra: 1,
      defEra: 1,
      playerSide: 'atk',
      mode: 'manual',
      atkBefore: [
        { id: 'a1', typeId: 'Hastati', kategoria: 'miecznik', hp: 10, maxHp: 20 },
        { id: 'a2', typeId: 'Lucznik', kategoria: 'lucznik', hp: 5, maxHp: 16 },
        { id: 'a3', typeId: 'Konnica', kategoria: 'konnica', hp: 0, maxHp: 22 },
      ],
      defBefore: [{ id: 'd1', typeId: 'Hoplita', kategoria: 'wlocznik', hp: 18, maxHp: 18 }],
      lookupHp: (id) => ({ a1: 10, a2: 5, a3: null, d1: 18 }[id] ?? null),
    });
    d.show(data, () => {});
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(SHOTS, 'B-wieloosobowy-roster.png') });
  const domB = await readCorners(page);
  assert(domB.atkName === 'Rzymianie', 'B: roster 3 jednostek -- bold nazwa = civLabel "Rzymianie" (NIE "Skład (3)"/typ jednostki), KRYTERIUM 4; otrzymano: ' + domB.atkName);

  // ---------------------------------------------------------------------
  // SCENARIUSZ C: barbarzyńca jako jedna ze stron -- KRYTERIUM 5.
  // ---------------------------------------------------------------------
  await page.evaluate(() => {
    const d = (window).__postBattleSummaryTestDebug;
    const data = d.build({
      winner: 'atakujacy',
      atkLabel: 'Rzymianie',
      defLabel: 'Barbarzyńcy',
      atkCivLabel: 'Rzymianie',
      defCivLabel: 'Barbarzyńcy',
      atkCivIconId: 'rzymianie',
      defCivIconId: 'grecy', // fallback bez prawdziwej kultury -- MUSI byc ignorowany dla barbarzyncy
      atkIsBarbarian: false,
      defIsBarbarian: true,
      atkEra: 1,
      defEra: 1,
      playerSide: 'atk',
      mode: 'manual',
      atkBefore: [{ id: 'a1', typeId: 'Hastati', kategoria: 'miecznik', hp: 15, maxHp: 20 }],
      defBefore: [{ id: 'd1', typeId: 'Barbarzyńca', kategoria: 'miecznik', hp: 0, maxHp: 18 }],
      lookupHp: (id) => (id === 'a1' ? 15 : null),
    });
    d.show(data, () => {});
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(SHOTS, 'C-barbarzynca.png') });
  const domC = await readCorners(page);
  const iconsC = await page.evaluate(() => {
    const d = (window).__postBattleSummaryTestDebug;
    return { chipDeath: d.brandIconSvg('chip-death', 30), civIconGrecyFallback: d.civIconSvg('grecy', 30) };
  });
  assert(domC.defName === 'Barbarzyńcy', 'C: civLabel barbarzyńcy sensowny, nie "undefined"/puste; otrzymano: ' + domC.defName);
  assert(!domC.defHasImg, 'C: barbarzyńca NIE dostaje portretu władcy');
  assert(domC.defSvg === iconsC.chipDeath, 'C: ikona barbarzyńcy = brandIconSvg("chip-death") dokładnie, KRYTERIUM 5');
  assert(domC.defSvg !== iconsC.civIconGrecyFallback, 'C: ikona barbarzyńcy NIE jest civIconSvg (nawet gdy civIconId fallbackuje na "grecy")');

  console.log('\nZrzuty: ' + SHOTS);
  console.log('Błędy konsoli przeglądarki: ' + consoleErrors.length);
  for (const e of consoleErrors.slice(0, 10)) console.log('  ' + e);

  await browser.close();
  console.log('\nR-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1 (real-render): WSZYSTKIE ASERCJE PASS.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
