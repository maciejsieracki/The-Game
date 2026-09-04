'use strict';
/**
 * minimapa-ikona-robotnik-kolor-live-test.cjs
 * TEMAT: R-MINIMAPA-IKONA-ROBOTNIK-KOLOR-Q1 (Operator, runda 1).
 *
 * Dowodzi kryteriów końca 1-4 (00-dispatch.md) na FAKTYCZNIE wyrenderowanej stronie
 * w żywym Chromium — `getComputedStyle` + geometria z realnego DOM + zrzuty ekranu,
 * nigdy sam odczyt kodu ani jsdom (R-PROC-AUTOBOT.md §9 pkt 6a):
 *   (1) przycisk worker (`[data-act="worker-toggle"]`) w `.civ-hud-util-dock` niesie
 *       inline SVG ze `stroke="currentColor"` (ZERO emoji U+1F464), a `getComputedStyle`
 *       daje `color` ORAZ rozwiązany `stroke` ścieżek = rgb(232,216,138) — złoto motywu.
 *   (2) to samo dla przycisku deposit/kilof (`[data-act="deposit-toggle"]`, ZERO U+26CF).
 *   (3) klik obu przycisków nadal togglują stan (`.on`/`aria-pressed`) I realnie zmieniają
 *       obraz mapy 3D (pomiar pikseli zrzutu, nie odczyt zmiennej); kolor pozostaje złoty
 *       także w stanie aktywnym.
 *   (4) rozmiar/wyrównanie zmierzone w żywym DOM: ikony 20x20 CSS px, oba przyciski
 *       42x42 jak sąsiednie kontrolki zoom, wspólna oś pionowa rzędu (±1 px), a wysokość
 *       całego `.civ-hud-util-dock` identyczna jak w bundlu PRZED (brak rozjazdu wiersza).
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI (R-PROC-AUTOBOT.md §9 pkt 6a — „zmutuj źródło i pokaż,
 * że test faktycznie czerwienieje"): te same odczyty uruchomione na DWÓCH bundlach —
 *   PRZED = `git merge-base HEAD origin/main` (baza brancha w momencie dispatchu, NIE
 *           ruchomy żywy `origin/main` — C-034/C-056/C-059); `src/ui/hud.ts` tymczasowo
 *           podmieniony na treść z tej bazy, budowa, przywrócenie w `finally`.
 *   PO    = bieżący worktree (ten dispatch).
 * W bundlu PRZED oba przyciski nie mają ŻADNEGO elementu `<svg>` (więc `currentColor`
 * nie ma na czym zadziałać) i niosą surowe znaki emoji — test to sprawdza jawnie i
 * przewraca się, gdyby PRZED wyglądał tak samo jak PO.
 *
 * C-001 — jedyna dozwolona kompilacja to `vite build` bezpośrednio z node_modules
 * (CLAUDE.md / R-PROC-AUTOBOT.md §9 pkt 1), outDir POZA drzewem repo (`os.tmpdir()`),
 * NIGDY `npm run build`.
 *
 * Usage (z gra/): node tools/minimapa-ikona-robotnik-kolor-live-test.cjs
 *   --shots <katalog>  katalog na zrzuty (domyślnie <tmp>/civ-ikona-robotnik-kolor-shots)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, execSync } = require('child_process');
const { PNG } = require(path.resolve(__dirname, '..', 'node_modules', 'pngjs'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[minimapa-ikona-robotnik-kolor-live-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT_AFTER = path.join(os.tmpdir(), 'civ-ikona-robotnik-kolor-after');
const OUT_BEFORE = path.join(os.tmpdir(), 'civ-ikona-robotnik-kolor-before');

/** Jedyny plik dotknięty tym dispatchem (allowlista 00-dispatch.md). */
const TOUCHED_FILES = ['src/ui/hud.ts'].map(p => path.join(GRA, p));

/** Złoto motywu z `.civ-hud-util-dock .b-util-toggle{color:#e8d88a}` (hud.ts). */
const ZLOTO = 'rgb(232, 216, 138)';
const EMOJI_WORKER = '\u{1F464}';
const EMOJI_PICKAXE = '\u{26CF}';

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots') || path.join(os.tmpdir(), 'civ-ikona-robotnik-kolor-shots');
fs.mkdirSync(SHOTS, { recursive: true });

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  OK  ' + name); }
  else { fail++; console.error(' FAIL ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function buildBundle(outDirAbs) {
  fs.rmSync(outDirAbs, { recursive: true, force: true });
  const rel = path.relative(GRA, outDirAbs);
  execFileSync(
    process.execPath,
    ['./node_modules/vite/bin/vite.js', 'build', '--outDir', rel, '--emptyOutDir'],
    { cwd: GRA, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(outDirAbs, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + outDirAbs);
  }
}

const PRZED_REF = execSync('git merge-base HEAD origin/main', { cwd: GRA }).toString('utf8').trim();

function buildBeforeBundle() {
  const originals = TOUCHED_FILES.map(p => fs.readFileSync(p, 'utf8'));
  try {
    for (const p of TOUCHED_FILES) {
      const rel = path.relative(GRA, p).replace(/\\/g, '/');
      const legacy = execSync(`git show ${PRZED_REF}:gra/${rel}`, {
        cwd: GRA, maxBuffer: 1024 * 1024 * 64,
      }).toString('utf8');
      fs.writeFileSync(p, legacy, 'utf8');
    }
    buildBundle(OUT_BEFORE);
  } finally {
    TOUCHED_FILES.forEach((p, i) => fs.writeFileSync(p, originals[i], 'utf8'));
  }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[minimapa-ikona-robotnik-kolor-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

const VIEWPORT = { width: 1920, height: 1080 };
const CENTER_CLIP = { x: VIEWPORT.width / 2 - 220, y: VIEWPORT.height / 2 - 220, width: 440, height: 440 };

async function gotoPlaytestMapa(page, outDirAbs) {
  const url = 'file://' + path.join(outDirAbs, 'index.html') + '?playtest=mapa';
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud', { timeout: 120000 });
  for (let i = 0; i < 90; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined, { timeout: 120000 },
  );
  await page.waitForSelector('.civ-hud-util-dock', { timeout: 30000 });
  await wait(400);
}

function diffPixelCount(bufA, bufB, threshold = 30) {
  const a = PNG.sync.read(bufA);
  const b = PNG.sync.read(bufB);
  const len = Math.min(a.data.length, b.data.length);
  let diff = 0;
  for (let i = 0; i < len; i += 4) {
    const d = Math.abs(a.data[i] - b.data[i])
      + Math.abs(a.data[i + 1] - b.data[i + 1])
      + Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (d > threshold) diff++;
  }
  return diff;
}

/**
 * Wszystko, co o ikonie da się powiedzieć TYLKO z żywej przeglądarki: obecność elementu
 * `<svg>`, jego atrybut `stroke`, ROZWIĄZANY przez silnik `getComputedStyle` kolor
 * (`color` przycisku i `stroke` każdej ścieżki — `currentColor` rozwija się dopiero tutaj),
 * surowy tekst przycisku (emoji zostawia znak, SVG nie) oraz geometria.
 */
async function readIconFacts(page, act) {
  return page.evaluate((act) => {
    const dock = document.querySelector('.civ-hud-util-dock');
    const btn = dock ? dock.querySelector(`[data-act="${act}"]`) : null;
    if (!btn) return { present: false };
    const svg = btn.querySelector('svg');
    const geom = svg ? svg.getBoundingClientRect() : null;
    const br = btn.getBoundingClientRect();
    const shapes = svg ? Array.from(svg.querySelectorAll('path,circle,rect,line,polyline,polygon')) : [];
    return {
      present: true,
      hasSvg: !!svg,
      svgStrokeAttr: svg ? svg.getAttribute('stroke') : null,
      svgFillAttr: svg ? svg.getAttribute('fill') : null,
      viewBox: svg ? svg.getAttribute('viewBox') : null,
      // Surowy tekst przycisku: dla emoji to sam znak, dla inline SVG pusty string.
      text: (btn.textContent || '').trim(),
      btnColor: getComputedStyle(btn).color,
      btnBgColor: getComputedStyle(btn).backgroundColor,
      btnBgImage: getComputedStyle(btn).backgroundImage.slice(0, 90),
      svgColor: svg ? getComputedStyle(svg).color : null,
      // ROZWIĄZANY stroke — dowód, że `currentColor` faktycznie dziedziczy złoto.
      shapeStrokes: shapes.map(s => getComputedStyle(s).stroke),
      shapeFills: shapes.map(s => getComputedStyle(s).fill),
      shapeCount: shapes.length,
      on: btn.classList.contains('on'),
      ariaPressed: btn.getAttribute('aria-pressed'),
      svgW: geom ? Math.round(geom.width * 10) / 10 : null,
      svgH: geom ? Math.round(geom.height * 10) / 10 : null,
      btnW: Math.round(br.width * 10) / 10,
      btnH: Math.round(br.height * 10) / 10,
      btnCenterY: Math.round((br.top + br.height / 2) * 10) / 10,
    };
  }, act);
}

async function readDockGeometry(page) {
  return page.evaluate(() => {
    const dock = document.querySelector('.civ-hud-util-dock');
    if (!dock) return null;
    const r = dock.getBoundingClientRect();
    const kids = Array.from(dock.querySelectorAll('button')).map((b) => {
      const br = b.getBoundingClientRect();
      return {
        act: b.getAttribute('data-act'),
        w: Math.round(br.width * 10) / 10,
        h: Math.round(br.height * 10) / 10,
        centerY: Math.round((br.top + br.height / 2) * 10) / 10,
      };
    });
    return {
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
      kids,
    };
  });
}

/** Zrzut SAMEGO przycisku — barwa ikony bez tła reszty rzędu. */
async function shotButton(page, act, label) {
  const r = await page.evaluate((act) => {
    const b = document.querySelector(`.civ-hud-util-dock [data-act="${act}"]`);
    if (!b) return null;
    const g = b.getBoundingClientRect();
    return { x: Math.round(g.x), y: Math.round(g.y), width: Math.round(g.width), height: Math.round(g.height) };
  }, act);
  const buf = await page.screenshot({ clip: r });
  fs.writeFileSync(path.join(SHOTS, label + '.png'), buf);
  return buf;
}

/** Zrzut CAŁEGO rzędu `.civ-hud-util-dock` — worker + deposit OBOK kontrolek zoom
 *  w JEDNYM kadrze (wymóg anty-halucynacyjny 00-dispatch.md). */
async function shotDock(page, label) {
  const g = await readDockGeometry(page);
  const clip = {
    x: Math.max(0, g.x - 12), y: Math.max(0, g.y - 12),
    width: Math.min(VIEWPORT.width - Math.max(0, g.x - 12), g.w + 24),
    height: Math.min(VIEWPORT.height - Math.max(0, g.y - 12), g.h + 24),
  };
  const buf = await page.screenshot({ clip });
  fs.writeFileSync(path.join(SHOTS, label + '.png'), buf);
  return { buf, clip };
}

/**
 * Statystyka barw zrzutu. `gold` = piksele w odcieniu złota motywu (#e8d88a: jasne, ciepłe,
 * R≈G>B). `obceChlodne` = piksele wyraźnie ZIMNE/niebieskie — dokładnie ten sygnał, na który
 * skarżył się właściciel: emoji 👤 rysowane wielokolorową czcionką emoji systemu IGNORUJE CSS
 * `color`, więc sylwetka wychodzi niebiesko-ciemna zamiast złota. Po naprawie tego sygnału
 * ma nie być w ogóle (SVG dziedziczy `currentColor`).
 */
function goldPixelStats(buf) {
  const img = PNG.sync.read(buf);
  let gold = 0;
  let obceChlodne = 0;
  let total = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    const r = img.data[i]; const g = img.data[i + 1]; const b = img.data[i + 2]; const a = img.data[i + 3];
    if (a < 200) continue;
    total++;
    if (r > 150 && g > 140 && b < g - 25 && r >= g - 20) gold++;
    if (b > 120 && b > r + 40) obceChlodne++;
  }
  return { gold, obceChlodne, total };
}

/**
 * Wspólny pomiar toggle'a dla OBU bundli: szum tła (dwa zrzuty bez kliku) i realna
 * zmiana obrazu mapy 3D po kliku. Dzięki temu „zero regresji funkcjonalnej" (kryterium 3)
 * jest dowodzone PORÓWNANIEM PRZED vs PO, nie arbitralnym progiem pikseli — nakładka
 * złóż rysuje rzadkie znaczniki, więc jej sygnał jest z natury mniejszy niż robotników.
 */
async function measureToggle(page, act) {
  const noiseA = await page.screenshot({ clip: CENTER_CLIP });
  await wait(500);
  const noiseB = await page.screenshot({ clip: CENTER_CLIP });
  const noise = diffPixelCount(noiseA, noiseB);

  const before = await readIconFacts(page, act);
  const mapBefore = await page.screenshot({ clip: CENTER_CLIP });
  await page.locator(`[data-act="${act}"]`).first().click();
  await wait(500);
  const after = await readIconFacts(page, act);
  const mapAfter = await page.screenshot({ clip: CENTER_CLIP });
  return { noise, mapDiff: diffPixelCount(mapBefore, mapAfter), before, after };
}

async function withPage(outDirAbs, fn) {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: VIEWPORT });
    const consoleErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push(String(err)));
    await gotoPlaytestMapa(page, outDirAbs);
    return await fn(page, consoleErrors);
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// PO — bieżący worktree: pełny zestaw asercji kryteriów 1-4.
// ---------------------------------------------------------------------------
async function scenarioPo() {
  console.log('\n=== PO (bieżący worktree, ten dispatch) ===');
  return withPage(OUT_AFTER, async (page, consoleErrors) => {
    const dockOff = await readDockGeometry(page);
    // Nakładki worker/deposit startują WŁĄCZONE (klasa `.on`) — etykieta zrzutu niesie
    // faktyczny stan odczytany z DOM, nie założony z góry.
    const stanA = (await readIconFacts(page, 'worker-toggle')).on ? 'aktywne' : 'nieaktywne';
    const { buf: shotOff } = await shotDock(page, `po-dock-stan-poczatkowy-${stanA}`);

    for (const [act, emoji, label] of [
      ['worker-toggle', EMOJI_WORKER, 'worker'],
      ['deposit-toggle', EMOJI_PICKAXE, 'deposit'],
    ]) {
      const f = await readIconFacts(page, act);
      check(`[${label}] przycisk obecny w .civ-hud-util-dock`, f.present === true, f);
      check(`[${label}] niesie inline <svg> (nie emoji)`, f.hasSvg === true, f);
      check(`[${label}] svg stroke="currentColor"`, f.svgStrokeAttr === 'currentColor', f.svgStrokeAttr);
      check(`[${label}] svg fill="none"`, f.svgFillAttr === 'none', f.svgFillAttr);
      check(`[${label}] viewBox="0 0 24 24"`, f.viewBox === '0 0 24 24', f.viewBox);
      check(`[${label}] ZERO surowego emoji w treści przycisku`, !f.text.includes(emoji), f.text);
      // KRYTERIUM 1/2 — realny getComputedStyle w żywym Chromium.
      check(`[${label}] getComputedStyle(button).color = ${ZLOTO}`, f.btnColor === ZLOTO, f.btnColor);
      check(`[${label}] getComputedStyle(svg).color = ${ZLOTO}`, f.svgColor === ZLOTO, f.svgColor);
      check(`[${label}] ma >=1 kształt rysowany`, f.shapeCount >= 1, f.shapeCount);
      check(`[${label}] KAŻDY kształt: rozwiązany stroke = ${ZLOTO} (currentColor zadziałał)`,
        f.shapeCount >= 1 && f.shapeStrokes.every(s => s === ZLOTO), f.shapeStrokes);
      check(`[${label}] KAŻDY kształt: fill=none (linia, nie wypełnienie)`,
        f.shapeFills.every(s => s === 'none'), f.shapeFills);
      // KRYTERIUM 4 — geometria z żywego DOM, nie z deklaracji w kodzie.
      check(`[${label}] ikona 20x20 CSS px`, f.svgW === 20 && f.svgH === 20, { w: f.svgW, h: f.svgH });
      check(`[${label}] przycisk 42x42 (jak reszta rzędu)`, f.btnW === 42 && f.btnH === 42, { w: f.btnW, h: f.btnH });
    }

    // KRYTERIUM 4 — wspólna oś pionowa całego rzędu (worker/deposit/zoom-/zoom+/fullscreen).
    const centers = dockOff.kids.map(k => k.centerY);
    const spread = Math.max(...centers) - Math.min(...centers);
    check('rząd: wszystkie przyciski na wspólnej osi pionowej (spread <= 1 px)', spread <= 1,
      { spread, kids: dockOff.kids });
    check('rząd: worker + deposit + kontrolki zoom w tym samym docku',
      ['worker-toggle', 'deposit-toggle', 'zoom-out', 'zoom-in'].every(a => dockOff.kids.some(k => k.act === a)),
      dockOff.kids.map(k => k.act));

    // KRYTERIUM 1/2 — dowód barwy z PIKSELI realnego zrzutu, nie tylko z CSS.
    const statsOff = goldPixelStats(shotOff);
    check('zrzut rzędu: piksele złota obecne', statsOff.gold > 200, statsOff);
    const btnStats = {};
    for (const [act, label] of [['worker-toggle', 'worker'], ['deposit-toggle', 'deposit']]) {
      btnStats[act] = goldPixelStats(await shotButton(page, act, 'po-przycisk-' + label));
      const f = await readIconFacts(page, act);
      console.log(`  info  PO przycisk ${label}: piksele=${JSON.stringify(btnStats[act])}`
        + ` bg=${f.btnBgColor} bgImage=${f.btnBgImage}`);
    }

    // KRYTERIUM 3 — toggle nadal działa i realnie zmienia obraz mapy 3D.
    const toggles = {};
    for (const [act, label] of [['worker-toggle', 'worker'], ['deposit-toggle', 'deposit']]) {
      const m = await measureToggle(page, act);
      toggles[act] = m;
      check(`[${label}] klik przełącza klasę .on`, m.before.on !== m.after.on,
        { before: m.before.on, after: m.after.on });
      check(`[${label}] klik przełącza aria-pressed`, m.before.ariaPressed !== m.after.ariaPressed,
        { before: m.before.ariaPressed, after: m.after.ariaPressed });
      check(`[${label}] klik realnie zmienia obraz mapy 3D ponad szum tła`,
        m.mapDiff > Math.max(20, m.noise * 3), { mapDiff: m.mapDiff, szum: m.noise });
      // Kolor w stanie AKTYWNYM (tło .on ma inny kontrast — ikona nadal musi być złota).
      check(`[${label}] stan AKTYWNY: rozwiązany stroke nadal = ${ZLOTO}`,
        m.after.shapeStrokes.length >= 1 && m.after.shapeStrokes.every(s => s === ZLOTO), m.after.shapeStrokes);
    }

    const stanB = (await readIconFacts(page, 'worker-toggle')).on ? 'aktywne' : 'nieaktywne';
    const { buf: shotOn } = await shotDock(page, `po-dock-po-kliku-${stanB}`);
    const statsOn = goldPixelStats(shotOn);
    check(`zrzut rzędu (stan ${stanB}): piksele złota obecne`, statsOn.gold > 200, statsOn);
    check('zrzuty pokrywają OBA stany przycisków (aktywny i nieaktywny)', stanA !== stanB,
      { stanA, stanB });
    // UWAGA: kadr CAŁEGO rzędu ma 12 px marginesu i łapie teren mapy (błękit wody), więc
    // miary „obcych, zimnych pikseli" NIE prowadzimy tutaj — tylko na kadrze SAMEGO
    // przycisku (porównanie PRZED vs PO na końcu pliku), gdzie w kadrze nie ma nic innego.

    check('brak błędów konsoli/strony', consoleErrors.length === 0, consoleErrors.slice(0, 5));
    return { dockOff, statsOff, btnStats, toggles };
  });
}

// ---------------------------------------------------------------------------
// PRZED — bundle z `git merge-base HEAD origin/main`: dowód nietautologiczności.
// ---------------------------------------------------------------------------
async function scenarioPrzed() {
  console.log(`\n=== PRZED (${PRZED_REF.slice(0, 8)}, źródło zmutowane do stanu sprzed naprawy) ===`);
  return withPage(OUT_BEFORE, async (page) => {
    const dockOff = await readDockGeometry(page);
    const stanPrzed = (await readIconFacts(page, 'worker-toggle')).on ? 'aktywne' : 'nieaktywne';
    const { buf } = await shotDock(page, `przed-dock-stan-poczatkowy-${stanPrzed}`);
    const stats = goldPixelStats(buf);

    for (const [act, emoji, label] of [
      ['worker-toggle', EMOJI_WORKER, 'worker'],
      ['deposit-toggle', EMOJI_PICKAXE, 'deposit'],
    ]) {
      const f = await readIconFacts(page, act);
      check(`PRZED [${label}] NIE ma żadnego <svg> (currentColor nie ma na czym zadziałać)`,
        f.present === true && f.hasSvg === false, f);
      check(`PRZED [${label}] treść przycisku to surowy znak emoji ${JSON.stringify(emoji)}`,
        f.text.includes(emoji), f.text);
      check(`PRZED [${label}] zero kształtów rysowanych dziedziczących kolor`, f.shapeCount === 0, f.shapeCount);
    }
    const btnStats = {};
    for (const [act, label] of [['worker-toggle', 'worker'], ['deposit-toggle', 'deposit']]) {
      btnStats[act] = goldPixelStats(await shotButton(page, act, 'przed-przycisk-' + label));
      console.log(`  info  PRZED piksele przycisku ${label}: ${JSON.stringify(btnStats[act])}`);
    }
    // Ten sam pomiar toggle'a co w PO — punkt odniesienia dla „zero regresji funkcjonalnej".
    const toggles = {};
    for (const act of ['worker-toggle', 'deposit-toggle']) toggles[act] = await measureToggle(page, act);
    console.log('  info  PRZED piksele rzędu:', JSON.stringify(stats));
    return { dockOff, stats, btnStats, toggles };
  });
}

(async () => {
  console.log('[minimapa-ikona-robotnik-kolor-live-test] budowa bundla PO (bieżący worktree)…');
  buildBundle(OUT_AFTER);
  console.log('[minimapa-ikona-robotnik-kolor-live-test] budowa bundla PRZED (' + PRZED_REF.slice(0, 8) + ')…');
  buildBeforeBundle();

  const po = await scenarioPo();
  const przed = await scenarioPrzed();

  // KRYTERIUM 4 — brak przesunięcia/rozjazdu wysokości wiersza wobec stanu sprzed naprawy.
  console.log('\n=== PORÓWNANIE PRZED vs PO ===');
  check('wysokość rzędu .civ-hud-util-dock bez zmian (±1 px)',
    Math.abs(po.dockOff.h - przed.dockOff.h) <= 1, { po: po.dockOff.h, przed: przed.dockOff.h });
  check('szerokość rzędu .civ-hud-util-dock bez zmian (±2 px)',
    Math.abs(po.dockOff.w - przed.dockOff.w) <= 2, { po: po.dockOff.w, przed: przed.dockOff.w });
  check('pozycja rzędu bez zmian (±1 px)',
    Math.abs(po.dockOff.y - przed.dockOff.y) <= 1 && Math.abs(po.dockOff.x - przed.dockOff.x) <= 1,
    { po: [po.dockOff.x, po.dockOff.y], przed: [przed.dockOff.x, przed.dockOff.y] });

  // KRYTERIUM 1/2 — realny dowód „złote, nie ciemna sylwetka": w kadrze SAMEGO przycisku
  // worker po naprawie jest istotnie więcej pikseli złota niż przed nią (emoji U+1F464
  // rysowane czcionką emoji ignoruje CSS `color`), a mniej pikseli ciemnego tuszu.
  // PRZED: emoji 👤 rysowane czcionką emoji systemu wychodzi NIEBIESKĄ sylwetką (ignoruje CSS
  // `color`) — to jest dokładnie objaw zgłoszony przez właściciela. PO: sygnał znika do zera.
  check('PRZED przycisk worker MA obce, zimne piksele (emoji ignoruje CSS color)',
    przed.btnStats['worker-toggle'].obceChlodne > 50, przed.btnStats['worker-toggle']);
  for (const [act, label] of [['worker-toggle', 'worker'], ['deposit-toggle', 'deposit']]) {
    const a = przed.btnStats[act];
    const b = po.btnStats[act];
    check(`PO przycisk ${label}: ZERO obcych, zimnych pikseli (ikona w całości złota)`,
      b.obceChlodne === 0, { przed: a, po: b });
    check(`przycisk ${label}: nie mniej pikseli złota niż przed naprawą`, b.gold >= a.gold,
      { przed: a, po: b });
  }

  // KRYTERIUM 3 — zero regresji funkcjonalnej: ten sam rząd wielkości zmiany obrazu mapy 3D
  // po kliku co przed naprawą (a nie arbitralny próg pikseli).
  for (const [act, label] of [['worker-toggle', 'worker'], ['deposit-toggle', 'deposit']]) {
    const a = przed.toggles[act];
    const b = po.toggles[act];
    check(`toggle ${label}: nakładka nadal reaguje jak przed naprawą (>=60% sygnału PRZED)`,
      a.mapDiff > 0 && b.mapDiff >= a.mapDiff * 0.6,
      { przedDiff: a.mapDiff, poDiff: b.mapDiff, przedSzum: a.noise, poSzum: b.noise });
  }

  console.log('\nZrzuty: ' + SHOTS);
  console.log(`\n${pass} pass / ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('[minimapa-ikona-robotnik-kolor-live-test] BŁĄD:', e && e.stack ? e.stack : e);
  process.exit(1);
});
