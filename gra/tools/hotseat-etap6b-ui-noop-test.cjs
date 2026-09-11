'use strict';
/**
 * hotseat-etap6b-ui-noop-test.cjs — R-HOTSEAT-ETAP6B-UI-Q1.
 *
 * Bramka dowodu no-op dla migracji kategorii "UI/HUD/panele" (klastry U1-U14 main.ts +
 * V1-V11 ui/*.ts, recon `R-HOTSEAT-ETAP6B-RECON-UI-Q1/01-operator-runda1-analiza.md`) z
 * `ownerId===0/!==0` na `isMe(ownerId)`/`!isMe(ownerId)`/`ME()`, PLUS write-site cache
 * `_last*` w `runWorldEndTurn()` podłączony na realny parametr `humanOwnerId`
 * (`endActiveHumanTurn(humanOwnerId)`).
 *
 * WZORZEC (przejęty 1:1 z `hotseat-etap6a-input-noop-test.cjs`): `buildBundle`/
 * `launchBrowser`/`closeBrowserSafely`/`mulberry32InitScript`/`pollUntil`/`gotoMainMenu`/
 * `startRealNewGame`/`stableStringify`/`sha256`/`runOnceWithRetry`/`compareHashes` — bez
 * zmian koncepcyjnych, tylko sekwencja akcji na turę zamieniona z klik-na-mapie (input) na
 * otwieranie paneli UI (ta kategoria).
 *
 * ZAKRES POKRYCIA (jawnie rozliczony, nie milczący) -- panele OTWARTE realnie w tej bramce:
 *  - Panel miasta (`.civ-ux-frame`, cityPanel.ts V1-V8) -- `__hotSeatTestDebug.
 *    openCityPanelForTest(cityId)`/`closeCityPanelForTest()`, TA SAMA ścieżka co klik miasta.
 *  - Panel imperium (`.civ-emp-panel`, U1/U3/U4/U5/U9/U12/U14) -- REALNE kliknięcia chipów
 *    paska HUD `[data-act="skarbiec|kultura|miasta|handel|moc"]` (dokładnie ta sama ścieżka
 *    co klik gracza, `handleHudBarAction` w `ui/hud.ts`), po jednej sekcji na turę (rotacja).
 *  - Pasek HUD (`.civ-hud-bar`, U1/U2) -- zrzut HTML po KAŻDEJ turze (renderowany co tick).
 *  - Stan paneli (`__sidePanelLinkTestDebug.openViews()`) -- zrzut po każdej turze.
 *
 * ŚWIADOMIE NIE OTWARTE w tej bramce (jawnie zgłoszone, nie ukryte) -- panel cudów
 * (placement UI, U6, wymaga odblokowanej technologii cudu -- nieosiągalne w 20 turach od
 * czystego seeda bez fabrykowania stanu tech), panel oblężenia (`.civ-smp`, U-klastry przez
 * `siegeMapPanel.ts` V10, wymaga realnej wojny + muru + wojsk dwóch cywilizacji w kontakcie),
 * przed-bitwa (`.pb-overlay`, preBattle.ts V11, jw.), power overlay bezpośrednio (`.civ-pow-
 * ov`, powerOverlayHud.ts V9) -- w obecnej architekturze `cfg.onOpenEmpireDetail` jest ZAWSZE
 * ustawione przez main.ts (`onOpenEmpireDetail: (section) => openEmpireDetailFromHud(section)`,
 * main.ts), więc gałąź `showPowerOverlay()` w `ui/hud.ts` (`handleHudBarAction`, act==='power')
 * jest DZIŚ NIEOSIĄGALNA z normalnej gry -- klik chipa "moc" idzie przez Empire Detail Panel
 * (pokryty przez sekcję "moc" w rotacji chipów wyżej), nie przez `showPowerOverlay()`. Migracja
 * V9 pozostaje więc bez realnego dowodu behawioralnego w TEJ bramce (kod martwy w obecnej
 * architekturze) -- zgłoszone Evaluatorowi wprost, nie milczane.
 *
 * METODA (jak 6a): dwa bundle'e PRZED (HEAD sprzed tej rundy, `git show HEAD:...`) / PO
 * (bieżący worktree), ta sama sekwencja REALNYCH kliknięć/klawiszy na tym samym seedzie
 * PRNG, hash SHA-256 (kanoniczny JSON, klucze posortowane) po każdej turze z: stanu
 * jednostek/miast (`dumpState`), zawartości otwartego panelu miasta, zawartości panelu
 * imperium (rotowana sekcja), HTML paska HUD, `openViews()`. PASS = wszystkie hashe
 * identyczne PRZED/PO na `humanOwnerIds=[0]` (no-op). Dodatkowo wariant ZEPSUTY (`isMe()`
 * na sztywno `false`) dowodzi nietautologiczności -- MUSI dać rozbieżność (panel miasta nie
 * otworzy się jako panel gracza / chipy pokażą inne wartości).
 *
 * Bramka (z katalogu gra/): node tools/hotseat-etap6b-ui-noop-test.cjs — exit 0 = zielona.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TURNS = Number(process.env.HOTSEAT6B_TURNS) || 20; // BINARNE KRYTERIUM (dispatch: "20 tur")
const RNG_SEED = 246813;
const CITY_STATES_COUNT = 2;
const EMPIRE_SECTIONS = ['skarbiec', 'kultura', 'miasta', 'handel', 'moc'];

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OLD_GRA_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6b-ui-OLD-${RUN_ID}`);
const OLD_OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6b-ui-OLD-dist-${RUN_ID}`);
const NEW_OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6b-ui-NEW-dist-${RUN_ID}`);
const MUTATED_GRA_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6b-ui-MUT-${RUN_ID}`);
const MUTATED_OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6b-ui-MUT-dist-${RUN_ID}`);

process.on('exit', () => {
  for (const d of [OLD_GRA_DIR, OLD_OUT_DIR, NEW_OUT_DIR, MUTATED_GRA_DIR, MUTATED_OUT_DIR]) {
    try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
});

function log(msg) { console.log('[hotseat-etap6b-ui-noop] ' + msg); }

// --- PRZED (HEAD sprzed tej rundy) ---
function prepareOldGraDir() {
  log('przygotowanie katalogu "PRZED" (kod z HEAD, sprzed tej rundy)...');
  fs.rmSync(OLD_GRA_DIR, { recursive: true, force: true });
  fs.mkdirSync(OLD_GRA_DIR, { recursive: true });
  for (const ent of fs.readdirSync(GRA_DIR)) {
    if (ent === 'node_modules' || ent === 'dist') continue;
    fs.cpSync(path.join(GRA_DIR, ent), path.join(OLD_GRA_DIR, ent), { recursive: true });
  }
  fs.symlinkSync(path.join(GRA_DIR, 'node_modules'), path.join(OLD_GRA_DIR, 'node_modules'));
  for (const rel of [
    'src/main.ts', 'src/ui/cityPanel.ts', 'src/ui/siegeMapPanel.ts',
    'src/ui/preBattle.ts', 'src/ui/powerOverlayHud.ts',
  ]) {
    const oldContent = execSync(`git show HEAD:gra/${rel}`, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    fs.writeFileSync(path.join(OLD_GRA_DIR, rel), oldContent, 'utf8');
  }
  log('katalog "PRZED" gotowy -> ' + OLD_GRA_DIR);
}

// --- ZEPSUTY (nietautologiczność): isMe() na sztywno false ---
function prepareMutatedGraDir() {
  log('przygotowanie katalogu "ZEPSUTY" (isMe() na sztywno false, dowód nietautologiczności)...');
  fs.rmSync(MUTATED_GRA_DIR, { recursive: true, force: true });
  fs.mkdirSync(MUTATED_GRA_DIR, { recursive: true });
  for (const ent of fs.readdirSync(GRA_DIR)) {
    if (ent === 'node_modules' || ent === 'dist') continue;
    fs.cpSync(path.join(GRA_DIR, ent), path.join(MUTATED_GRA_DIR, ent), { recursive: true });
  }
  fs.symlinkSync(path.join(GRA_DIR, 'node_modules'), path.join(MUTATED_GRA_DIR, 'node_modules'));
  const mainPath = path.join(MUTATED_GRA_DIR, 'src/main.ts');
  const src = fs.readFileSync(mainPath, 'utf8');
  const NEEDLE = 'function isMe(ownerId: number): boolean {\n      return ownerId === ME();\n    }';
  const REPLACEMENT = 'function isMe(ownerId: number): boolean {\n      return false;\n    }';
  if (!src.includes(NEEDLE)) {
    throw new Error('prepareMutatedGraDir: nie znaleziono definicji isMe() do mutacji -- '
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

function sha256(text) { return crypto.createHash('sha256').update(text, 'utf8').digest('hex'); }

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
      && !!(window).__sidePanelLinkTestDebug && !!(window).__hotSeatTestDebug,
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
}

// --- Zrzut świata + paneli UI (kanoniczny materiał hashowany) ---
async function dumpWorldAndUi(page, section) {
  return page.evaluate(({ sec }) => {
    const dbg = (window).__cityStateStartUnitsTestDebug.dumpState();
    const openViews = (window).__sidePanelLinkTestDebug.openViews();
    const hudBar = document.querySelector('.civ-hud-bar');
    const cityPanelEl = document.querySelector('.civ-ux-frame');
    const empPanelEl = document.querySelector('.civ-emp-panel');
    return {
      dbg,
      openViews,
      hudBarHtml: hudBar ? hudBar.innerHTML : null,
      cityPanelHtml: cityPanelEl ? cityPanelEl.innerHTML : null,
      empPanelSection: sec,
      empPanelHtml: empPanelEl ? empPanelEl.innerHTML : null,
    };
  }, { sec: section });
}

// --- Sekwencja realnych akcji UI (panel miasta + panel imperium, rotacja sekcji) na turę ---
async function playOneTurn(page, turnIdx) {
  const before = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
  const myCity = before.cities.find((c) => c.ownerId === 0);

  // Panel miasta (V1-V8): otwórz realną ścieżką (`openCityPanelForPlayer`), zrzut, zamknij.
  let cityPanelHtml = null;
  if (myCity) {
    const opened = await page.evaluate(
      ({ id }) => (window).__hotSeatTestDebug.openCityPanelForTest(id),
      { id: myCity.id },
    );
    if (opened) {
      await wait(200);
      cityPanelHtml = await page.evaluate(() => {
        const el = document.querySelector('.civ-ux-frame');
        return el ? el.innerHTML : null;
      });
      await page.evaluate(() => (window).__hotSeatTestDebug.closeCityPanelForTest());
      await wait(150);
    }
  }

  // Panel imperium (U1/U3/U4/U5/U9/U12/U14): klik REALNEGO chipa paska HUD, rotacja sekcji.
  const section = EMPIRE_SECTIONS[(turnIdx - 1) % EMPIRE_SECTIONS.length];
  await page.evaluate(({ sec }) => {
    const chip = document.querySelector(`[data-act="${sec}"]`);
    if (chip) chip.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, { sec: section });
  await wait(300);
  const uiSnap = await dumpWorldAndUi(page, section);
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.civ-emp-panel [data-act="close"], .civ-emp-panel .civ-emp-close');
    if (closeBtn) closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await wait(150);

  // Koniec tury: `endTurn()` == `advanceSeat()` == `endActiveHumanTurn(HUMAN_OWNER_PRIMARY)`
  // -- TA SAMA funkcja co przycisk "Zakończ turę"; write-site `runWorldEndTurn(humanOwnerId)`
  // (KRYTYCZNE znalezisko tego tematu) wykonuje się W ŚRODKU tego wywołania.
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

  const world = await page.evaluate(() => (window).__eraTestDebug.getWorldState());
  const finalDbg = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
  return {
    turnRequested: turnIdx, turn: world.turn, dbg: finalDbg,
    cityPanelHtml, empPanelSection: uiSnap.empPanelSection, empPanelHtml: uiSnap.empPanelHtml,
    hudBarHtml: uiSnap.hudBarHtml, openViews: uiSnap.openViews,
  };
}

async function runOnce(chromium, outHtml, label) {
  const browser = await launchBrowser(chromium);
  const hashes = [];
  const jsExceptions = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', (e) => jsExceptions.push(String(e)));
    await page.addInitScript(mulberry32InitScript(RNG_SEED));

    log(`[${label}] start realnej nowej gry...`);
    await gotoMainMenu(page, outHtml);
    await startRealNewGame(page);

    for (let i = 1; i <= TURNS; i++) {
      const snap = await playOneTurn(page, i);
      const canon = stableStringify({
        turn: snap.turn, dbg: snap.dbg, cityPanelHtml: snap.cityPanelHtml,
        empPanelSection: snap.empPanelSection, empPanelHtml: snap.empPanelHtml,
        hudBarHtml: snap.hudBarHtml, openViews: snap.openViews,
      });
      hashes.push(sha256(canon));
      log(`[${label}] tura ${i} (turn=${snap.turn}, sekcja=${snap.empPanelSection}, `
        + `units=${snap.dbg.units.length}, cities=${snap.dbg.cities.length}, `
        + `cityPanel=${snap.cityPanelHtml ? 'OK' : 'BRAK'}, `
        + `empPanel=${snap.empPanelHtml ? 'OK' : 'BRAK'}): hash=${hashes[hashes.length - 1].slice(0, 12)}...`);
    }
    if (jsExceptions.length > 0) {
      log(`[${label}] UWAGA: ${jsExceptions.length} nieprzechwyconych wyjątków JS:`);
      for (const e of jsExceptions.slice(0, 10)) log('  ' + e);
    }
  } finally {
    await closeBrowserSafely(browser);
  }
  return { hashes, jsExceptions };
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

function compareHashes(a, b, n) {
  let matchCount = 0;
  let firstMismatch = -1;
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i] && a[i] !== undefined) matchCount++;
    else if (firstMismatch === -1) firstMismatch = i + 1;
  }
  return { matchCount, firstMismatch };
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[hotseat-etap6b-ui-noop-test] BLOCK: playwright nie znaleziony.');
    process.exit(2);
  }

  try {
    prepareOldGraDir();
    prepareMutatedGraDir();
    buildBundle(OLD_GRA_DIR, OLD_OUT_DIR, 'PRZED');
    buildBundle(GRA_DIR, NEW_OUT_DIR, 'PO');
    buildBundle(MUTATED_GRA_DIR, MUTATED_OUT_DIR, 'ZEPSUTY');
  } catch (e) {
    console.error('[hotseat-etap6b-ui-noop-test] BLOCK: build nie powiódł się:', e.message || e);
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
    console.error('[hotseat-etap6b-ui-noop-test] BLOCK: hak testowy nie zadziałał headless:', e && e.stack ? e.stack : e);
    process.exit(2);
  }

  console.log('\n=== PRZED -- ' + TURNS + ' hashy ===');
  runOld.hashes.forEach((h, idx) => console.log(`  tura ${idx + 1}: ${h}`));
  console.log('\n=== PO -- ' + TURNS + ' hashy ===');
  runNew.hashes.forEach((h, idx) => console.log(`  tura ${idx + 1}: ${h}`));

  const { matchCount, firstMismatch } = compareHashes(runOld.hashes, runNew.hashes, TURNS);
  console.log(`\n=== Porównanie PRZED vs PO: ${matchCount}/${TURNS} identycznych hashy ===`);
  if (firstMismatch !== -1) {
    console.log(`Pierwsza rozbieżność: tura ${firstMismatch}`);
    console.log(`  PRZED[${firstMismatch - 1}] = ${runOld.hashes[firstMismatch - 1]}`);
    console.log(`  PO[${firstMismatch - 1}]    = ${runNew.hashes[firstMismatch - 1]}`);
  }

  // Nietautologiczność: ZEPSUTY (isMe() na sztywno false) MUSI dać przynajmniej jedną
  // rozbieżność wobec PO na tym samym seedzie/sekwencji -- panel miasta przestaje pokazywać
  // widok gracza, chipy imperium przestają liczyć miasta/jednostki gracza jako "moje".
  const mutCmp = compareHashes(runNew.hashes, runMut.hashes, TURNS);
  console.log(`\n=== Nietautologiczność: PO vs ZEPSUTY -- ${mutCmp.matchCount}/${TURNS} identycznych `
    + `(oczekiwana ROZBIEŻNOŚĆ, pierwsza w turze ${mutCmp.firstMismatch}) ===`);
  const mutationDetected = mutCmp.matchCount < TURNS;
  if (!mutationDetected) {
    console.error('BLOCK: bramka nie wykryła celowo zepsutej migracji UI -- test jest tautologiczny.');
  }

  const pass = matchCount === TURNS
    && runOld.hashes.length === TURNS
    && runNew.hashes.length === TURNS
    && runOld.jsExceptions.length === 0
    && runNew.jsExceptions.length === 0
    && mutationDetected;

  console.log(`\nhotseat-etap6b-ui-noop-test: ${pass ? 'PASS' : 'FAIL'} `
    + `(${matchCount}/${TURNS} identycznych PRZED/PO, jsExcPRZED=${runOld.jsExceptions.length}, `
    + `jsExcPO=${runNew.jsExceptions.length}, nietautologiczność=${mutationDetected ? 'OK' : 'BRAK'})`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error('[hotseat-etap6b-ui-noop-test] BLOCK: nieoczekiwany wyjątek:', e && e.stack ? e.stack : e);
  process.exit(2);
});
