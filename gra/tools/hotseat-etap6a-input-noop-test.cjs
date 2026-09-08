'use strict';
/**
 * hotseat-etap6a-input-noop-test.cjs — R-HOTSEAT-ETAP6A-INPUT-Q1.
 *
 * Bramka dowodu no-op dla migracji kategorii "input" (klik/zaznaczenie/ruch/atak/marsz/
 * cykl jednostek, klastry A-H recon `R-HOTSEAT-ETAP6A-RECON-INPUT-Q1/01-operator-runda1-
 * analiza.md`) z `ownerId===0/!==0` na `isMe(ownerId)`/`!isMe(ownerId)`/`ME()` — z
 * `humanOwnerId` faktycznie podłączonym w klastrze D+F (`executePlannedMarchesEndTurn`/
 * `applyMarchSegmentInstant`/`endActiveHumanTurn`/`renderLoop`).
 *
 * WZORZEC (przejęty 1:1, nie budowany od zera): `buildBundle`/`launchBrowser`/
 * `closeBrowserSafely`/`mulberry32InitScript`/`pollUntil`/`gotoMainMenu`/
 * `startRealNewGame` z `hotseat-etap4-noop-test.cjs`; rzut heks->piksel
 * (`axialToWorld`/`hexToPixel`, TA SAMA kamera co gra: elewacja 52°, fov 50) z
 * `r-bitwa-etykieta-tozsamosc-strony-live-atak-test.cjs`.
 *
 * METODA (recon §5, PRZED i PO na TYM SAMYM seedzie, Chromium nie headless-Node -- klastry
 * B/C/E/G są DOM-bound, klastry D/F zależą od stanu animacji/renderLoop):
 *  1. Dwa bundle'e: "PRZED" = kod z HEAD tej gałęzi (`git show HEAD:...`, sprzed tej rundy --
 *     główny materiał dowodu anty-samooszukiwania, nie snapshot z pamięci), skopiowany do
 *     osobnego katalogu roboczego i zbudowany; "PO" = kod w bieżącym worktree (ten sam,
 *     który zbudują bramki referencyjne). `node_modules` symlinkowany (identyczny
 *     `package.json`, zero realnej instalacji).
 *  2. Ta sama sekwencja PRAWDZIWYCH zdarzeń wskaźnika/klawiatury na obu bundle'ach, ten sam
 *     seed PRNG (mulberry32, Math.random podmieniony PRZED jakimkolwiek skryptem strony):
 *     real `startNewGame`+`foundPlayerStartCity` (`__cityStateStartUnitsTestDebug`, TA SAMA
 *     funkcja co klik "Start"), potem 20 tur, KAŻDA z realnym klikiem selekcji (klaster A/B),
 *     realnym klikiem ruchu na sąsiedni heks (klaster B/C/F), co 3. turę realnym klikiem
 *     zlecenia marszu wieloturowego na daleki heks (klaster C plan + D kontynuacja na
 *     koniec tury), realną Spacją (klaster A3 cykl), oportunistycznym realnym klikiem ataku
 *     gdy jednostka innego właściciela stoi sąsiednio (klaster B13/B14/E1), i realnym
 *     `window.__eraTestDebug.endTurn()` (== `advanceSeat()` == `endActiveHumanTurn(
 *     HUMAN_OWNER_PRIMARY)`, TA SAMA funkcja co przycisk "Zakończ turę" -- klaster D+F
 *     wykonuje się W ŚRODKU tego wywołania).
 *  3. Po KAŻDEJ turze: `explored` (posortowane klucze, `__mglaSciezkaTestDebug.
 *     getExploredKeys()`), `units`/`cities` (`__cityStateStartUnitsTestDebug.dumpState()`,
 *     id/ownerId/typeId/q/r -- pozycje/liczba/właściciel, czyli dokładnie to, na co wpływają
 *     migrowane gałęzie select/move/attack/march/cycle) i numer tury -- kanoniczny
 *     JSON.stringify z kluczami posortowanymi rekurencyjnie -> SHA-256.
 *  4. PASS = TURNS/TURNS identycznych hashy PRZED vs PO na `humanOwnerIds=[0]` (jedyny
 *     fotel dziś, więc `isMe(0)===true` zawsze -- behawioralny no-op).
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (nietautologiczność): bramka buduje też TRZECI wariant
 * "ZEPSUTY" -- kopia bieżącego (PO) kodu z `isMe()` (fundament WSZYSTKICH 42 migrowanych
 * miejsc klastrów A-H) na sztywno zwracającym `false` (patrz `prepareMutatedGraDir()`) -- i
 * potwierdza, że porównanie PO vs ZEPSUTY na tym samym seedzie/sekwencji DAJE rozbieżność
 * (żadna jednostka gracza nie da się zaznaczyć/ruszyć/zaatakować, więc świat "zamarza" od
 * tury 1), czyli że sekwencja kliknięć tej bramki faktycznie DOTYKA migrowanego kodu, a nie
 * jest tautologicznie
 * zielona niezależnie od kodu. Jeśli hak testowy nie działa headless, bramka kończy się
 * BLOCK (exit 2), nie redukuje liczby tur.
 *
 * Bramka (z katalogu gra/): node tools/hotseat-etap6a-input-noop-test.cjs — exit 0 = zielona.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TURNS = Number(process.env.HOTSEAT6A_TURNS) || 20; // BINARNE KRYTERIUM (dispatch + plan §C "20 tur")
const RNG_SEED = 135797;
const CITY_STATES_COUNT = 2;

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OLD_GRA_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6a-input-OLD-${RUN_ID}`);
const OLD_OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6a-input-OLD-dist-${RUN_ID}`);
const NEW_OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6a-input-NEW-dist-${RUN_ID}`);

process.on('exit', () => {
  for (const d of [OLD_GRA_DIR, OLD_OUT_DIR, NEW_OUT_DIR, MUTATED_GRA_DIR, MUTATED_OUT_DIR]) {
    try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
});

function log(msg) { console.log('[hotseat-etap6a-input-noop] ' + msg); }

// --- PRZED (HEAD sprzed tej rundy): kopia gra/ z main.ts/army-cycle.ts z `git show HEAD:...`
function prepareOldGraDir() {
  log('przygotowanie katalogu "PRZED" (kod z HEAD, sprzed tej rundy)...');
  fs.rmSync(OLD_GRA_DIR, { recursive: true, force: true });
  fs.mkdirSync(OLD_GRA_DIR, { recursive: true });
  // Kopiujemy CAŁE gra/ (poza node_modules/dist -- symlink/build osobno), bo vite potrzebuje
  // pełnego drzewa (config, index.html, reszta src/*, które NIE są dotknięte tą rundą).
  for (const ent of fs.readdirSync(GRA_DIR)) {
    if (ent === 'node_modules' || ent === 'dist') continue;
    fs.cpSync(path.join(GRA_DIR, ent), path.join(OLD_GRA_DIR, ent), { recursive: true });
  }
  fs.symlinkSync(path.join(GRA_DIR, 'node_modules'), path.join(OLD_GRA_DIR, 'node_modules'));
  for (const rel of ['src/main.ts', 'src/game/army-cycle.ts']) {
    const oldContent = execSync(`git show HEAD:gra/${rel}`, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    fs.writeFileSync(path.join(OLD_GRA_DIR, rel), oldContent, 'utf8');
  }
  log('katalog "PRZED" gotowy -> ' + OLD_GRA_DIR);
}

// --- ZEPSUTY (nietautologiczność): kopia bieżącego (PO) kodu z `isMe()` na sztywno
// `false` -- dowodzi, że ta bramka realnie reaguje na złamanie migracji klastrów A-H,
// a nie jest zielona niezależnie od kodu (REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu).
const MUTATED_GRA_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6a-input-MUT-${RUN_ID}`);
const MUTATED_OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6a-input-MUT-dist-${RUN_ID}`);

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
  // Mutacja najsilniejsza z możliwych dla tego tematu: `isMe()` (fundament WSZYSTKICH 42
  // migrowanych miejsc klastrów A-H) zwraca zawsze `false` -- żadna jednostka gracza nie
  // powinna dać się zaznaczyć/ruszyć/zaatakować/zmarszować/zcyklować. Jeśli ta bramka mimo
  // to dałaby PO===ZEPSUTY, oznaczałoby to że jej sekwencja kliknięć w ogóle nie dotyka
  // żadnego z 42 zmigrowanych miejsc -- czyli że test byłby tautologicznie zielony.
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
  }, 180000, 'world-generated');

  const founded = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  if (!founded) throw new Error('foundPlayerStartCity() zwróciło false -- stolica gracza nie założona');

  await pollUntil(page, () => {
    const dbg = (window).__cityStateStartUnitsTestDebug;
    const st = dbg.dumpState();
    const playerHasCity = st.cities.some((c) => c.ownerId === 0);
    return { ready: st.awaitingFirstPlayerCity === false && playerHasCity, playerHasCity };
  }, 30000, 'city-founded');

  await wait(400);

  // ZNALEZISKO tej rundy: `startNewGame`+`foundPlayerStartCity` (bootstrap 1:1 z
  // `hotseat-etap4/5-...-test.cjs`) NIE daje graczowi ŻADNEJ jednostki startowej -- 8
  // jednostek widocznych zaraz po foundowaniu to WYŁĄCZNIE "diffbonus" jednostki AI/miast-
  // -państw (`spawnDifficultyBonusUnit`, ownerId 1-8), zero ownerId===0. Bez jednostki
  // gracza klik/zaznaczenie/ruch/atak/marsz/cykl (klastry A-H) są strukturalnie
  // niewykonalne -- realny spawner testowy `__mglaSciezkaTestDebug.spawnPlayerScout(q, r)`
  // (`spawnDifficultyBonusUnit(0, 'Zwiadowca', q, r)`, TA SAMA funkcja co spawn AI, tylko
  // ownerId=0 -- już użyty przez `hotseat-etap5-no-leak-test.cjs`) daje 3 zwiadowców gracza
  // na deterministycznych, wolnych heksach lądowych wokół stolicy -- ten sam seed/kolejność
  // wywołań w PRZED/PO/ZEPSUTY, więc no-op jest nadal ważny.
  await page.evaluate(() => {
    const dbg = (window).__mglaSciezkaTestDebug;
    const ranges = [[1, 2], [2, 4], [4, 6]];
    for (const [lo, hi] of ranges) {
      const hex = dbg.findFreeLandNearPlayerCity(lo, hi);
      if (hex) dbg.spawnPlayerScout(hex.q, hex.r);
    }
  });
  await wait(300);
}

// --- Rzut heks -> piksel: TA SAMA kamera co gra (przejęte z r-bitwa-...-live-atak-test.cjs) ---
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

const NEIGHBOR_OFFSETS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

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
  return page.evaluate(() => {
    const hotSeat = (window).__hotSeatTestDebug;
    return {
      dbg: (window).__cityStateStartUnitsTestDebug.dumpState(),
      explored: (window).__mglaSciezkaTestDebug.getExploredKeys().slice().sort(),
      // R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 hak (`snapshotVisibleState`), ponownie użyty tu:
      // `selectedId`/`plannedMarchesSize` -- dokładnie pola z planu no-op recon §5.
      selectedId: hotSeat ? hotSeat.snapshotVisibleState().selectedId : null,
      plannedMarchesSize: hotSeat ? hotSeat.snapshotVisibleState().plannedMarchesSize : null,
    };
  });
}

// --- Sekwencja realnych akcji input (klik/zaznaczenie/ruch/atak/marsz/cykl) jednej tury ---
async function playOneTurn(page, turnIdx) {
  const before = await dumpWorld(page);
  const myUnits = before.dbg.units.filter((u) => u.ownerId === 0);
  const foreignUnits = before.dbg.units.filter((u) => u.ownerId !== 0);

  // KLASTER E/B13-B14: atak oportunistyczny, jeśli jednostka innego właściciela stoi
  // dokładnie sąsiednio do dowolnej jednostki gracza (dystans osiowy 1).
  const hexDist = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  let attacked = false;
  for (const mine of myUnits) {
    const foe = foreignUnits.find((f) => hexDist(mine, f) === 1);
    if (foe) {
      await clickHex(page, mine.q, mine.r); // klaster A2/B: zaznaczenie
      await wait(250);
      await clickHex(page, foe.q, foe.r); // klaster B13/B14/E1: atak
      await wait(500);
      // Ewentualna zgoda na wojnę (withPlayerWarConsent) -- realny przycisk dialogu.
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"], .btn'));
        const t = btns.find((b) => /wypowiedz|wypowiedź|tak|potwierd|zaatakuj|wojn/i.test(b.textContent || '')
          && b.offsetParent !== null);
        if (t) t.click();
      });
      await wait(500);
      attacked = true;
      break;
    }
  }

  // KLASTER A/B/C/F: zaznaczenie + ruch na sąsiedni heks, dla jednostki #0 (deterministyczna,
  // sortowanie po id z dumpState -- ten sam porządek w OLD i NEW przy identycznym seedzie).
  if (!attacked && myUnits.length > 0) {
    const lead = myUnits.slice().sort((a, b) => (a.id < b.id ? -1 : 1))[0];
    await clickHex(page, lead.q, lead.r); // A2/B: select
    await wait(250);
    for (const [dq, dr] of NEIGHBOR_OFFSETS) {
      const tq = lead.q + dq, tr = lead.r + dr;
      await clickHex(page, tq, tr); // B/C: move click
      await wait(400);
      const after = await dumpWorld(page);
      const moved = after.dbg.units.find((u) => u.id === lead.id);
      if (moved && (moved.q !== lead.q || moved.r !== lead.r)) break; // realny ruch nastąpił
    }
  }

  // KLASTER C (plan)/D (kontynuacja na koniec tury): co 3. turę, zlecenie marszu na daleki
  // heks -- w 1 turze ruchu prawdopodobnie nie starczy, więc `plannedMarches` przenosi
  // kontynuację na `executePlannedMarchesEndTurn`/`applyMarchSegmentInstant` (klaster D).
  if (turnIdx % 3 === 0 && myUnits.length > 1) {
    const marcher = myUnits.slice().sort((a, b) => (a.id < b.id ? -1 : 1))[1];
    await clickHex(page, marcher.q, marcher.r);
    await wait(250);
    const far = await page.evaluate(() => (window).__mglaSciezkaTestDebug.findFreeLandNearPlayerCity(4, 7));
    if (far) { await clickHex(page, far.q, far.r); await wait(300); }
  }

  // KLASTER A3/A4: Spacja -- cykl do następnej armii z dostępnym ruchem.
  await page.keyboard.press('Space');
  await wait(250);

  // KLASTER D+F: `endTurn()` == `advanceSeat()` == `endActiveHumanTurn(HUMAN_OWNER_PRIMARY)`
  // -- TA SAMA funkcja co przycisk "Zakończ turę".
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
  return {
    turnRequested: turnIdx, turn: world.turn, dbg: after.dbg, explored: after.explored,
    selectedId: after.selectedId, plannedMarchesSize: after.plannedMarchesSize,
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
        turn: snap.turn, dbg: snap.dbg, explored: snap.explored,
        selectedId: snap.selectedId, plannedMarchesSize: snap.plannedMarchesSize,
      });
      hashes.push(sha256(canon));
      log(`[${label}] tura ${i} (turn=${snap.turn}, units=${snap.dbg.units.length}, `
        + `cities=${snap.dbg.cities.length}, explored=${snap.explored.length}, `
        + `selectedId=${snap.selectedId}, plannedMarches=${snap.plannedMarchesSize}): `
        + `hash=${hashes[hashes.length - 1].slice(0, 12)}...`);
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
    console.error('[hotseat-etap6a-input-noop-test] BLOCK: playwright nie znaleziony.');
    process.exit(2);
  }

  try {
    prepareOldGraDir();
    prepareMutatedGraDir();
    buildBundle(OLD_GRA_DIR, OLD_OUT_DIR, 'PRZED');
    buildBundle(GRA_DIR, NEW_OUT_DIR, 'PO');
    buildBundle(MUTATED_GRA_DIR, MUTATED_OUT_DIR, 'ZEPSUTY');
  } catch (e) {
    console.error('[hotseat-etap6a-input-noop-test] BLOCK: build nie powiódł się:', e.message || e);
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
    // Nietautologiczność: tylko tyle tur, ile trzeba, żeby przynajmniej jedna (turnIdx=3)
    // trafiła w gałąź marszu wieloturowego klastra C/D (`turnIdx % 3 === 0`).
    runMut = await runOnceWithRetry(chromium, mutHtml, 'ZEPSUTY');
  } catch (e) {
    console.error('[hotseat-etap6a-input-noop-test] BLOCK: hak testowy nie zadziałał headless:', e && e.stack ? e.stack : e);
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

  // Nietautologiczność: ZEPSUTY (klaster D z celowo złym ownerem) MUSI dać przynajmniej
  // jedną rozbieżność wobec PO na tym samym seedzie/sekwencji -- jeśli nie daje, ta bramka
  // byłaby zielona niezależnie od realnego zachowania klastra D+F.
  const mutCmp = compareHashes(runNew.hashes, runMut.hashes, TURNS);
  console.log(`\n=== Nietautologiczność: PO vs ZEPSUTY -- ${mutCmp.matchCount}/${TURNS} identycznych `
    + `(oczekiwana ROZBIEŻNOŚĆ, pierwsza w turze ${mutCmp.firstMismatch}) ===`);
  const mutationDetected = mutCmp.matchCount < TURNS;
  if (!mutationDetected) {
    console.error('BLOCK: bramka nie wykryła celowo zepsutego klastra D -- test jest tautologiczny.');
  }

  const pass = matchCount === TURNS
    && runOld.hashes.length === TURNS
    && runNew.hashes.length === TURNS
    && runOld.jsExceptions.length === 0
    && runNew.jsExceptions.length === 0
    && mutationDetected;

  console.log(`\nhotseat-etap6a-input-noop-test: ${pass ? 'PASS' : 'FAIL'} `
    + `(${matchCount}/${TURNS} identycznych PRZED/PO, jsExcPRZED=${runOld.jsExceptions.length}, `
    + `jsExcPO=${runNew.jsExceptions.length}, nietautologiczność=${mutationDetected ? 'OK' : 'BRAK'})`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error('[hotseat-etap6a-input-noop-test] BLOCK: nieoczekiwany wyjątek:', e && e.stack ? e.stack : e);
  process.exit(2);
});
