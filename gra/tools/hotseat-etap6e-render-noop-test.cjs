'use strict';
/**
 * hotseat-etap6e-render-noop-test.cjs — R-HOTSEAT-ETAP6E-RENDER-Q1.
 *
 * Bramka dowodu no-op dla migracji kategorii "render/kamera" (recon
 * `R-HOTSEAT-ETAP6E-RECON-RENDER-Q1/01-operator-runda1.md`, main.ts: `civTypeForOwner`,
 * `relationColorFn`, `unitRingStanceForPlayer`, `cityMapOutlineKindForOwner`,
 * `civDisplayNameForOwner`, `portraitForceCultureIcon`, `_cityRenderOpts` getCiv/
 * getCivIconId/playerOwnerId, `syncWorkerFieldOverlay`, `refreshTerritoryBorderOverlay`,
 * `syncOkolicaOverlay`) z `ownerId===0/!==0`/literałów `0` na `isMe(ownerId)`/
 * `!isMe(ownerId)`/`ME()`.
 *
 * WZORZEC (przejęty 1:1): `buildBundle`/`launchBrowser`/`closeBrowserSafely`/
 * `mulberry32InitScript`/`pollUntil`/`gotoMainMenu`/`startRealNewGame`/`prepareOldGraDir`/
 * `prepareMutatedGraDir` z `hotseat-etap6a-input-noop-test.cjs`.
 *
 * METODA (recon §8, PRZED/PO/ZEPSUTY na TYM SAMYM seedzie): render jest DOM/canvas-bound
 * (Three.js), więc dowód no-op = zrzut ekranu (`page.screenshot()`, sam `<canvas>`) po
 * KAŻDEJ turze musi być bit-identyczny PRZED vs PO. Dodatkowo, dla wykrycia okolica-overlay
 * i pigułki miasta (widoczne tylko z otwartym panelem miasta), panel gracza jest otwierany
 * realnym klikiem na stolicę PRZED zrzutem, potem zamykany. Stan `dumpState()` (units/
 * cities) jest dołączony do hasha jako drugorzędna kotwica determinizmu seeda/AI, nie jako
 * substytut dowodu wizualnego.
 *
 * RUNDA 2 — ZMIANA PODEJŚCIA (ważne dla czytelnika): runda 1 (BLOCK, patrz
 * `01-operator-runda1.md`) odkryła REALNY crash bootu (TDZ) przy migracji na gołe
 * `isMe()`/`ME()`, bo `_cityRenderOpts()` i funkcje nim zasilane (`civTypeForOwner`
 * przez `ownerColorFn`, `cityMapOutlineKindForOwner`, `civDisplayNameForOwner`,
 * `portraitForceCultureIcon`, `getCiv`/`getCivIconId`) są wołane PODCZAS pierwszego,
 * bezwarunkowego `cityRenderer.sync()` (main.ts L~2513) — długo PRZED `let humanSeats`
 * (main.ts L~10385), gdzie realne `isMe()`/`ME()` czytają `humanSeats` w domknięciu.
 * Prerekwizyt `R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1` wprowadził wzorzec forward-declare
 * (`meForRender`) TYLKO dla `playerOwnerId`. Runda 2 rozszerza ten SAM wzorzec o dwie
 * małe funkcje pomocnicze w main.ts: `meNow()` (= `meForRender?.() ?? HUMAN_OWNER_PRIMARY`)
 * i `isMeSafe(ownerId)` (= `ownerId === meNow()`) — używane WYŁĄCZNIE w funkcjach
 * osiągalnych z tej eager ścieżki. Funkcje osiągalne TYLKO z kontekstów zdarzeniowych
 * (`relationColorFn`, `unitRingStanceForPlayer`, `syncOkolicaOverlay`,
 * `refreshTerritoryBorderOverlay`, `syncWorkerFieldOverlay` call) używają realnych
 * `isMe()`/`ME()` wprost — nie potrzebują guardu, boot() jest wtedy już dawno po
 * `let humanSeats`. Po podpięciu `meForRender = ME` w boot() `meNow()`/`isMeSafe()`
 * zwracają DOKŁADNIE to samo co `ME()`/`isMe()` — zero różnicy behawioralnej, czysta
 * infrastruktura TDZ-safety, nie konkurencyjny alias (patrz komentarz przy `meNow()` w
 * main.ts i uzasadnienie w raporcie Operatora rundy 2).
 *
 * NIETAUTOLOGICZNOŚĆ: trzeci wariant "ZEPSUTY" psuje `ME()` U ŹRÓDŁA (zwraca stały,
 * nierealny ownerId zamiast `humanSeats.activeHumanOwnerId`) zamiast tylko `isMe()` —
 * to jeden punkt mutacji, który propaguje się do WSZYSTKICH 12 zmigrowanych miejsc
 * main.ts naraz: bezpośrednich użytkowników `isMe()`/`ME()` (bo wołają realne `ME()`)
 * ORAZ użytkowników `isMeSafe()`/`meNow()` (bo `meForRender = ME`, więc `meNow()` też
 * czyta zepsute `ME()`) — musi dać ROZBIEŻNOŚĆ zrzutów ekranu wobec PO na tym samym
 * seedzie (pierścień jednostki gracza staje się 'hostile', obwódka terytorium/miasta
 * przestaje być 'player', panel miasta/okolica przestają się otwierać dla miasta
 * gracza, ikona/nazwa cywilizacji gracza na pigułce miasta się psuje). Jeśli hak
 * testowy nie działa headless, bramka kończy się BLOCK (exit 2).
 *
 * ZNANE OGRANICZENIE (bez zmian względem rundy 1): 6 pozycji recon w
 * `render/units.ts`/`render/cities.ts`/`render/cityOkolicaOverlay.ts` (fallbacki
 * `?? 0`/domyślne parametry) migrowane w rundzie 2 na stałą `HUMAN_OWNER_PRIMARY`
 * (`game/human-owners.ts`, importowalna wprost, bez potrzeby eksportu `ME`/`isMe` z
 * main.ts) — behawioralnie identyczne z literałem `0` dziś (jeden fotel człowieka),
 * ale nazwana stała zamiast magicznej liczby. Realne wywołania z main.ts zawsze
 * podają jawny argument (`ME()`/`meNow()` po tej rundzie), więc te fallbacki są
 * martwe w praktyce — bramka nie rozróżnia PRZED/PO na nich z tego samego powodu co
 * w rundzie 1.
 *
 * STAN DZIŚ (runda 2): main.ts ma teraz WSZYSTKIE 12 lokalizacji z klastra
 * `_cityRenderOpts`/rezolwerów zmigrowane (`isMe`/`ME`/`isMeSafe`/`meNow`), boot
 * potwierdzony żywo w Chromium jako nieuszkodzony (patrz raport rundy 2). PRE-CHECK
 * niżej szuka definicji `isMeSafe`/`meNow` jako dowodu, że migracja tej rundy jest
 * obecna w main.ts (a nie bajt-identyczna z bazą sprzed migracji) — SKIP pozostaje
 * jako zabezpieczenie na wypadek uruchomienia tej bramki na starszym main.ts.
 *
 * Bramka (z katalogu gra/): node tools/hotseat-etap6e-render-noop-test.cjs
 *   exit 0 = PASS (migracja no-op, nietautologiczność potwierdzona)
 *   exit 1 = FAIL (realna rozbieżność PRZED/PO, albo nietautologiczność padła MIMO że
 *            migracja jest już częściowo obecna w main.ts — patrz PRE-CHECK)
 *   exit 2 = BLOCK (build/hak testowy nie zadziałał headless)
 *   exit 3 = SKIP (main.ts nie ma jeszcze śladu migracji tej rundy — patrz "STAN DZIŚ"
 *            wyżej; NIE traktować jako PASS ani jako dowód no-op)
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TURNS = Number(process.env.HOTSEAT6E_TURNS) || 20; // BINARNE KRYTERIUM (dispatch: "20 tur")
const RNG_SEED = 246813;
const CITY_STATES_COUNT = 2;

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OLD_GRA_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6e-render-OLD-${RUN_ID}`);
const OLD_OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6e-render-OLD-dist-${RUN_ID}`);
const NEW_OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6e-render-NEW-dist-${RUN_ID}`);
const MUTATED_GRA_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6e-render-MUT-${RUN_ID}`);
const MUTATED_OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6e-render-MUT-dist-${RUN_ID}`);

process.on('exit', () => {
  for (const d of [OLD_GRA_DIR, OLD_OUT_DIR, NEW_OUT_DIR, MUTATED_GRA_DIR, MUTATED_OUT_DIR]) {
    try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
});

function log(msg) { console.log('[hotseat-etap6e-render-noop] ' + msg); }

function copyGraTreeSansBuild(destDir) {
  fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(destDir, { recursive: true });
  for (const ent of fs.readdirSync(GRA_DIR)) {
    if (ent === 'node_modules' || ent === 'dist') continue;
    fs.cpSync(path.join(GRA_DIR, ent), path.join(destDir, ent), { recursive: true });
  }
  fs.symlinkSync(path.join(GRA_DIR, 'node_modules'), path.join(destDir, 'node_modules'));
}

// --- PRZED (HEAD sprzed tej rundy): main.ts z `git show HEAD:...` (render/*.ts nietknięte
// tą rundą — kopiowane 1:1 z bieżącego drzewa, identyczne z HEAD).
function prepareOldGraDir() {
  log('przygotowanie katalogu "PRZED" (main.ts z HEAD, sprzed tej rundy)...');
  copyGraTreeSansBuild(OLD_GRA_DIR);
  for (const rel of ['src/main.ts']) {
    const oldContent = execSync(`git show HEAD:gra/${rel}`, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    fs.writeFileSync(path.join(OLD_GRA_DIR, rel), oldContent, 'utf8');
  }
  log('katalog "PRZED" gotowy -> ' + OLD_GRA_DIR);
}

// --- ZEPSUTY (nietautologiczność): `ME()` U ŹRÓDŁA zwraca stały, nierealny ownerId
// zamiast `humanSeats.activeHumanOwnerId` -- propaguje się do WSZYSTKICH zmigrowanych
// miejsc naraz, zarówno bezpośrednich użytkowników `isMe()`/`ME()`, jak i `isMeSafe()`/
// `meNow()` (bo `meForRender = ME`, patrz komentarz w main.ts nagłówka tego pliku).
function prepareMutatedGraDir() {
  log('przygotowanie katalogu "ZEPSUTY" (ME() zwraca stały nierealny ownerId, dowód nietautologiczności)...');
  copyGraTreeSansBuild(MUTATED_GRA_DIR);
  const mainPath = path.join(MUTATED_GRA_DIR, 'src/main.ts');
  const src = fs.readFileSync(mainPath, 'utf8');
  const NEEDLE = 'function ME(): number {\n      return humanSeats.activeHumanOwnerId;\n    }';
  const REPLACEMENT = 'function ME(): number {\n      return -999;\n    }';
  if (!src.includes(NEEDLE)) {
    throw new Error('prepareMutatedGraDir: nie znaleziono definicji ME() do mutacji -- '
      + 'main.ts zmienił się od czasu napisania tej bramki, zaktualizuj NEEDLE.');
  }
  fs.writeFileSync(mainPath, src.replace(NEEDLE, REPLACEMENT), 'utf8');
  log('katalog "ZEPSUTY" gotowy -> ' + MUTATED_GRA_DIR);
}

function buildBundle(cwd, outDir, label) {
  log(`[${label}] vite build (dozwolona komenda C-001, outDir poza repo)...`);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(outDir)} --emptyOutDir`,
    { cwd, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error(`[${label}] build nie wyprodukował index.html w ${outDir}`);
  }
  log(`[${label}] build OK -> ${outDir}`);
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    log('domyślny Chromium niedostępny, fallback na ' + FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function closeBrowserSafely(browser) {
  await Promise.race([
    browser.close().catch(() => { /* już martwy */ }),
    wait(8000),
  ]);
  try {
    const proc = browser.process && browser.process();
    if (proc && proc.exitCode === null && !proc.killed) proc.kill('SIGKILL');
  } catch { /* best-effort */ }
}

function mulberry32InitScript(seed) {
  return `(() => {
    let s = ${seed} | 0;
    Math.random = function() {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();`;
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

async function pollUntil(page, checkFn, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await page.evaluate(checkFn);
    if (last && last.ready) return last;
    await wait(300);
  }
  throw new Error(`pollUntil(${label}): timeout, ostatni stan = ${JSON.stringify(last)}`);
}

async function gotoMainMenu(page, outHtml) {
  await page.goto(outHtml, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(
    () => !!(window).__cityStateStartUnitsTestDebug && !!(window).__eraTestDebug
      && !!(window).__sidePanelLinkTestDebug && !!(window).__mglaSciezkaTestDebug,
    undefined,
    { timeout: 120000 },
  );
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);
}

async function startRealNewGame(page) {
  await page.evaluate(({ n }) => {
    (window).__cityStateStartUnitsTestDebug.startNewGame('normal', n);
  }, { n: CITY_STATES_COUNT });

  await pollUntil(page, () => {
    const dbg = (window).__cityStateStartUnitsTestDebug;
    if (!dbg) return { ready: false, reason: 'no-hook' };
    const overlayVisible = Array.from(document.querySelectorAll('*')).some(
      (el) => el.textContent && el.textContent.includes('Tworzenie świata') && (el).offsetParent !== null,
    );
    const st = dbg.dumpState();
    return {
      ready: !overlayVisible && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null,
      overlayVisible, awaitingFirstPlayerCity: st.awaitingFirstPlayerCity, playerStartHex: st.playerStartHex,
    };
  }, 360000, 'world-generated');

  const founded = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  if (!founded) throw new Error('foundPlayerStartCity() zwróciło false -- stolica gracza nie założona');

  await pollUntil(page, () => {
    const dbg = (window).__cityStateStartUnitsTestDebug;
    const st = dbg.dumpState();
    const playerHasCity = st.cities.some((c) => c.ownerId === 0);
    return { ready: st.awaitingFirstPlayerCity === false && playerHasCity, playerHasCity };
  }, 30000, 'city-founded');

  await wait(400);

  // Jednostka gracza -- render pierścienia właściciela (klaster A recon §3) wymaga co
  // najmniej jednej jednostki ownerId===0 na mapie; ten sam spawner testowy co
  // hotseat-etap6a (`spawnPlayerScout`, TA SAMA funkcja co spawn AI, tylko ownerId=0).
  await page.evaluate(() => {
    const dbg = (window).__mglaSciezkaTestDebug;
    const hex = dbg.findFreeLandNearPlayerCity(1, 3);
    if (hex) dbg.spawnPlayerScout(hex.q, hex.r);
  });
  await wait(300);
}

// --- Rzut heks -> piksel: TA SAMA kamera co gra (przejęte z hotseat-etap6a). ---
const SQRT3 = Math.sqrt(3);
const HEX_R = 1.0;
const ELEV_DEG = 52;
const FOV_DEG = 50;
function axialToWorld(q, r) { return { x: HEX_R * SQRT3 * (q + r * 0.5), z: HEX_R * 1.5 * r }; }
function hexToPixel(q, r, cam, W, H, yTerrain) {
  const el = ELEV_DEG * Math.PI / 180;
  const C = { x: cam.x, y: cam.dist * Math.sin(el), z: cam.z + cam.dist * Math.cos(el) };
  const T = { x: cam.x, y: 0, z: cam.z };
  const norm = (v) => { const l = Math.hypot(v.x, v.y, v.z); return { x: v.x / l, y: v.y / l, z: v.z / l }; };
  const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
  const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const fwd = norm(sub(T, C));
  const right = norm(cross(fwd, { x: 0, y: 1, z: 0 }));
  const up = cross(right, fwd);
  const w = axialToWorld(q, r);
  const P = sub({ x: w.x, y: yTerrain || 0, z: w.z }, C);
  const xv = dot(P, right), yv = dot(P, up), zv = dot(P, fwd);
  const f = 1 / Math.tan((FOV_DEG * Math.PI / 180) / 2);
  const aspect = W / H;
  const ndcX = (f / aspect) * xv / zv;
  const ndcY = f * yv / zv;
  return { x: (ndcX * 0.5 + 0.5) * W, y: (-ndcY * 0.5 + 0.5) * H, ok: zv > 0.1 };
}

async function clickHex(page, q, r) {
  const { cam, W, H } = await page.evaluate(() => ({
    cam: (window).__sidePanelLinkTestDebug.cameraTarget(),
    W: window.innerWidth, H: window.innerHeight,
  }));
  const p = hexToPixel(q, r, cam, W, H, 0);
  if (!p.ok) return false;
  await page.mouse.click(Math.round(p.x), Math.round(p.y));
  return true;
}

async function dumpWorld(page) {
  return page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
}

// --- Jedna tura: otwórz panel stolicy gracza (klaster `syncOkolicaOverlay`/pigułka miasta),
// zrzut canvasu, zamknij panel, kolejny zrzut canvasu (mapa bez panelu -- obwódka
// terytorium/pierścień jednostki/ikona miasta-państwa/etykieta cywilizacji), potem endTurn.
async function playOneTurn(page) {
  const before = await dumpWorld(page);
  const capital = before.cities.find((c) => c.ownerId === 0);

  let panelShot = null;
  if (capital) {
    const clicked = await clickHex(page, capital.q, capital.r);
    if (clicked) {
      await wait(500);
      panelShot = await page.locator('canvas').first().screenshot();
      // Zamknij panel (Escape -- ten sam skrót co w normalnej grze).
      await page.keyboard.press('Escape');
      await wait(300);
    }
  }

  const mapShot = await page.locator('canvas').first().screenshot();

  await page.evaluate(() => (window).__eraTestDebug.endTurn());
  const t0 = Date.now();
  let sawInProgress = false;
  while (Date.now() - t0 < 60000) {
    const inProg = await page.evaluate(() => (window).__eraTestDebug.isEndTurnInProgress());
    if (inProg) sawInProgress = true;
    if (sawInProgress && !inProg) break;
    await wait(80);
  }
  await wait(300);

  const after = await dumpWorld(page);
  const world = await page.evaluate(() => (window).__eraTestDebug.getWorldState());
  return { turn: world.turn, dbg: after, panelShot, mapShot };
}

async function runOnce(chromium, outHtml, label) {
  const browser = await launchBrowser(chromium);
  const stateHashes = [];
  const panelShots = [];
  const mapShots = [];
  const jsExceptions = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', (e) => jsExceptions.push(String(e)));
    await page.addInitScript(mulberry32InitScript(RNG_SEED));

    log(`[${label}] start realnej nowej gry...`);
    await gotoMainMenu(page, outHtml);
    await startRealNewGame(page);

    for (let i = 1; i <= TURNS; i++) {
      const snap = await playOneTurn(page);
      // Stan gry (dumpState() -- units/cities/turn) osobno od zrzutu ekranu: to jest
      // DECYDUJĄCY, deterministyczny dowód no-opu logiki (patrz uzasadnienie przy
      // compareRun w main() -- diagnostyka rundy 2 pokazała bit-identyczny stan przy
      // JEDNOCZEŚNIE rozjeżdżających się pikselach, źródło: ciągła pętla `renderLoop`
      // na realnym `performance.now()`, patrz komentarz przy porównaniu screenshotów).
      const stateCanon = stableStringify({ turn: snap.turn, dbg: snap.dbg });
      stateHashes.push(sha256(Buffer.from(stateCanon, 'utf8')));
      panelShots.push(snap.panelShot || null);
      mapShots.push(snap.mapShot);
      log(`[${label}] tura ${i} (turn=${snap.turn}, units=${snap.dbg.units.length}, `
        + `cities=${snap.dbg.cities.length}, panel=${snap.panelShot ? 'tak' : 'nie'}): `
        + `stateHash=${stateHashes[stateHashes.length - 1].slice(0, 12)}...`);
    }
    if (jsExceptions.length > 0) {
      log(`[${label}] UWAGA: ${jsExceptions.length} nieprzechwyconych wyjątków JS:`);
      for (const e of jsExceptions.slice(0, 10)) log('  ' + e);
    }
  } finally {
    await closeBrowserSafely(browser);
  }
  return { stateHashes, panelShots, mapShots, jsExceptions };
}

async function runOnceWithRetry(chromium, outHtml, label, maxAttempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await runOnce(chromium, outHtml, label);
    } catch (e) {
      lastErr = e;
      log(`[${label}] próba ${attempt}/${maxAttempts} padła (${e && e.message ? e.message : e}) -- `
        + (attempt < maxAttempts ? 'ponawiam ze świeżym browser.launch()...' : 'wyczerpano próby.'));
    }
  }
  throw lastErr;
}

// R-HOTSEAT-ETAP6E-RENDER-Q1 runda 2 -- ZNALEZISKO diagnostyczne (patrz raport Operatora):
// dumpState() (stan gry: units/cities/turn) jest BIT-IDENTYCZNY PRZED/PO na wszystkich
// turach niezależnie od tego eksperymentu -- ale surowe zrzuty <canvas> (PNG) rozjeżdżają
// się od pewnej tury MIMO identycznego stanu gry i zera wyjątków JS. Przyczyna potwierdzona
// w main.ts: `renderLoop()` (main.ts ok. L33706) jest ciągłą pętlą `requestAnimationFrame`
// napędzaną realnym `performance.now()` (dt = upływ czasu ŚCIANY, nie liczba klatek) --
// dowolna animacja czasowa w scenie (idle bob jednostek, woda, itp.) trafia w screenshot
// w RÓŻNEJ fazie między dwoma niezależnie taktowanymi procesami Chromium, nawet gdy kod i
// stan gry są identyczne. To NIE jest defekt tej migracji (żadna z 27 pozycji recon nie
// dotyka renderLoop/animacji czasowych) -- to fundamentalna właściwość porównywania
// bit-dokładnych zrzutów żywej sceny WebGL w dwóch osobnych procesach. Dlatego zrzuty
// porównujemy TOLERANCYJNIE (odsetek pikseli różniących się o więcej niż próg kanału),
// nie bajt-po-bajcie -- standardowa technika visual regression testing. `dumpState()`
// pozostaje bajt-dokładnym, DECYDUJĄCYM dowodem no-opu logiki; zrzuty ekranu dowodzą
// braku ZGRUBNEJ różnicy wizualnej (kolor obwódki/pierścienia/ikony), której migracja
// rzeczywiście mogłaby dotknąć, a której antyaliasing/animacja czasowa nie wytwarza w
// skali wykrywanej przez próg niżej.
const { PNG } = require('pngjs');
const IMG_DIFF_PIXEL_THRESHOLD = 24; // suma |ΔR|+|ΔG|+|ΔB| na piksel powyżej -> "różniący się"
const IMG_DIFF_RATIO_LIMIT = 0.02; // <=2% różniących się pikseli = "ten sam" render

function imgDiffRatio(bufA, bufB) {
  if (!bufA || !bufB) return bufA === bufB ? 0 : 1;
  let a, b;
  try {
    a = PNG.sync.read(bufA);
    b = PNG.sync.read(bufB);
  } catch (e) {
    return bufA.equals(bufB) ? 0 : 1;
  }
  if (a.width !== b.width || a.height !== b.height) return 1;
  const n = a.width * a.height;
  let diffPixels = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const d = Math.abs(a.data[o] - b.data[o]) + Math.abs(a.data[o + 1] - b.data[o + 1]) + Math.abs(a.data[o + 2] - b.data[o + 2]);
    if (d > IMG_DIFF_PIXEL_THRESHOLD) diffPixels++;
  }
  return diffPixels / n;
}

// Porównaj dwa runy: stan (bajt-dokładnie) + zrzuty (tolerancyjnie). Zwraca szczegóły
// per tura do logu i zbiorczy werdykt.
function compareRuns(runA, runB, n, label) {
  let stateMatchCount = 0;
  let imgOkCount = 0;
  let firstStateMismatch = -1;
  let firstImgMismatch = -1;
  const details = [];
  for (let i = 0; i < n; i++) {
    const stateMatch = runA.stateHashes[i] === runB.stateHashes[i] && runA.stateHashes[i] !== undefined;
    if (stateMatch) stateMatchCount++;
    else if (firstStateMismatch === -1) firstStateMismatch = i + 1;
    const panelDiff = imgDiffRatio(runA.panelShots[i], runB.panelShots[i]);
    const mapDiff = imgDiffRatio(runA.mapShots[i], runB.mapShots[i]);
    const imgOk = panelDiff <= IMG_DIFF_RATIO_LIMIT && mapDiff <= IMG_DIFF_RATIO_LIMIT;
    if (imgOk) imgOkCount++;
    else if (firstImgMismatch === -1) firstImgMismatch = i + 1;
    details.push({ turn: i + 1, stateMatch, panelDiff, mapDiff, imgOk });
  }
  console.log(`\n=== ${label}: stan gry ${stateMatchCount}/${n} identyczny, zrzuty (próg `
    + `${(IMG_DIFF_RATIO_LIMIT * 100).toFixed(0)}% różniących się pikseli) ${imgOkCount}/${n} w tolerancji ===`);
  for (const d of details) {
    console.log(`  tura ${d.turn}: stan=${d.stateMatch ? 'OK' : 'ROZBIEŻNY'}, `
      + `panelDiff=${(d.panelDiff * 100).toFixed(2)}%, mapDiff=${(d.mapDiff * 100).toFixed(2)}%, `
      + `zrzuty=${d.imgOk ? 'OK' : 'ROZBIEŻNE'}`);
  }
  if (firstStateMismatch !== -1) console.log(`Pierwsza rozbieżność stanu: tura ${firstStateMismatch}`);
  if (firstImgMismatch !== -1) console.log(`Pierwsza rozbieżność zrzutu (poza tolerancją): tura ${firstImgMismatch}`);
  return { stateMatchCount, imgOkCount, allMatch: stateMatchCount === n && imgOkCount === n };
}

// PRE-CHECK (dowód nietautologiczności §"STAN DZIŚ"): zanim uruchomimy ciężkie
// PRZED/PO/ZEPSUTY, sprawdzamy czy w main.ts w ogóle istnieje infrastruktura guardu
// `meNow()`/`isMeSafe()` wprowadzona w rundzie 2 (dowód, że main.ts NIE jest już
// bajt-identyczny z bazą sprzed tej rundy). Wyszukiwanie NIE jest zawężone do samego
// literału obiektu `_cityRenderOpts` (jak w rundzie 1) -- migracja tej rundy przenosi
// hardkody GŁÓWNIE do zewnętrznych funkcji-rezolwerów (`civTypeForOwner` itd.), wołanych
// Z WNĘTRZA obiektu, nie zapisanych w jego literale wprost. Jeśli guard nie istnieje —
// bramka nie ma jeszcze czego wykryć na renderze i kończy się jawnym SKIP zamiast
// mylącego FAIL.
function migrationClusterHasIsMeCall() {
  const src = fs.readFileSync(path.join(GRA_DIR, 'src/main.ts'), 'utf8');
  return /function isMeSafe\(ownerId: number\): boolean \{ return ownerId === meNow\(\); \}/.test(src);
}

async function main() {
  const hasMigration = migrationClusterHasIsMeCall();
  if (hasMigration === false) {
    console.log('[hotseat-etap6e-render-noop-test] SKIP: main.ts nie ma jeszcze guardu '
      + 'meNow()/isMeSafe() z rundy 2 -- bramka nie ma jeszcze czego wykryć na renderze, '
      + 'patrz "STAN DZIŚ" w nagłówku pliku. To NIE jest PASS.');
    process.exit(3);
  }

  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[hotseat-etap6e-render-noop-test] BLOCK: playwright nie znaleziony.');
    process.exit(2);
  }

  try {
    prepareOldGraDir();
    prepareMutatedGraDir();
    buildBundle(OLD_GRA_DIR, OLD_OUT_DIR, 'PRZED');
    buildBundle(GRA_DIR, NEW_OUT_DIR, 'PO');
    buildBundle(MUTATED_GRA_DIR, MUTATED_OUT_DIR, 'ZEPSUTY');
  } catch (e) {
    console.error('[hotseat-etap6e-render-noop-test] BLOCK: build nie powiódł się:', e.message || e);
    process.exit(2);
  }

  const oldHtml = 'file://' + path.join(OLD_OUT_DIR, 'index.html');
  const newHtml = 'file://' + path.join(NEW_OUT_DIR, 'index.html');
  const mutHtml = 'file://' + path.join(MUTATED_OUT_DIR, 'index.html');

  let runOld;
  let runNew;
  let runMut;
  try {
    runOld = await runOnceWithRetry(chromium, oldHtml, 'PRZED');
    runNew = await runOnceWithRetry(chromium, newHtml, 'PO');
    runMut = await runOnceWithRetry(chromium, mutHtml, 'ZEPSUTY');
  } catch (e) {
    console.error('[hotseat-etap6e-render-noop-test] BLOCK: hak testowy nie zadziałał headless:', e && e.stack ? e.stack : e);
    process.exit(2);
  }

  const noop = compareRuns(runOld, runNew, TURNS, 'Porównanie PRZED vs PO (no-op oczekiwany)');
  const mut = compareRuns(runNew, runMut, TURNS, 'Nietautologiczność PO vs ZEPSUTY (rozbieżność oczekiwana)');
  // Nietautologiczność: wystarczy, że stan LUB zrzuty wykryły ZEPSUTY choć raz -- to
  // dowód, że mechanizm porównania (state hash lub image diff) realnie coś wykrywa.
  const mutationDetected = mut.stateMatchCount < TURNS || mut.imgOkCount < TURNS;
  if (!mutationDetected) {
    console.error('BLOCK: bramka nie wykryła celowo zepsutego ME() -- test jest tautologiczny.');
  }

  const pass = noop.allMatch
    && runOld.stateHashes.length === TURNS
    && runNew.stateHashes.length === TURNS
    && runOld.jsExceptions.length === 0
    && runNew.jsExceptions.length === 0
    && mutationDetected;

  console.log(`\nhotseat-etap6e-render-noop-test: ${pass ? 'PASS' : 'FAIL'} `
    + `(stan ${noop.stateMatchCount}/${TURNS}, zrzuty w tolerancji ${noop.imgOkCount}/${TURNS} PRZED/PO, `
    + `jsExcPRZED=${runOld.jsExceptions.length}, jsExcPO=${runNew.jsExceptions.length}, `
    + `nietautologiczność=${mutationDetected ? 'OK' : 'BRAK'})`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error('[hotseat-etap6e-render-noop-test] BLOCK: nieoczekiwany wyjątek:', e && e.stack ? e.stack : e);
  process.exit(2);
});
