'use strict';
/**
 * siege-tower-breach-everywhere-test.cjs
 *
 * R-WEB-SIEGE-TOWER-BREACH-EVERYWHERE-Q1 (decyzja wlasciciela 2026-11-03, ABC-B):
 * wieza obleznicza liczy sie jako WYLOM WSZEDZIE -- takze w bitwie taktycznej:
 * atakujacy, ktory wszedl wieza na korone muru/palisady, otwiera miasto do
 * zdobycia bez taranu/katapulty (spojnie z Auto/„Pomin", gdzie kazda machina,
 * takze wieza, daje wylom). Bez wiezy i bez machin -- nadal brak zdobycia (R1).
 *
 * CZESC A -- PRAWDZIWE funkcje (esbuild game/city-fortification.ts): R5
 *   attackerWallEntryIsBreach + sklejenie z canCaptureCity/meleeBlockedByWall;
 *   zgodnosc z autoStormBreach (Auto). MUTACJE funkcji => czerwono.
 * CZESC B -- PRAWDZIWA SCENA w Chromium (vite build z lustrzanego korzenia poza repo,
 *   ?playtest=oblezenie-duze[&fort=palisada]): realny _activateUnit wieza -> piechota
 *   wspina sie -> wallEverBreached -> canCaptureCity; kontrola bez wiezy (brak wylomu);
 *   obronca na koronie nie jest wylomem; po wylomie melee bije obroncow z muru (R2).
 *   MUTACJE zrodla sceny => czerwono.
 * CZESC C -- Auto (main.ts) + parytet: pinezki zrodla (autoStormBreach(isSiegeUnit)).
 *
 * Zmienne srodowiska:
 *   STB_SRC  -- alternatywny katalog `src` (np. eksport origin/main: pomiar RED).
 *   STB_SHOT -- sciezka zrzutu JPEG sceny po wspieciu.
 *   STB_TAG  -- etykieta w logu.
 *   STB_SKIP_MUT=1 -- bez mutacji scenowych.
 * Usage (z gra/): TMPDIR=/dev/shm node tools/siege-tower-breach-everywhere-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) { console.error('playwright missing'); process.exit(1); }

const GRA = path.resolve(__dirname, '..');
const SRC_DIR = process.env.STB_SRC ? path.resolve(process.env.STB_SRC) : path.join(GRA, 'src');
const TAG = process.env.STB_TAG || 'STB';
const RUN = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const TMP_ROOT = path.join(os.tmpdir(), `civ-stb-${RUN}`);
fs.mkdirSync(TMP_ROOT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(TMP_ROOT, { recursive: true, force: true }); } catch { /* best-effort */ } });

let pass = 0; let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

const FORT_REL = 'src/game/city-fortification.ts';
const SCENE_REL = 'src/battle/battleScene.ts';

function makeRoot(variant, mutations) {
  const root = path.join(TMP_ROOT, `root-${variant}`);
  fs.mkdirSync(root, { recursive: true });
  for (const f of ['index.html', 'vite.config.ts', 'tsconfig.json', 'package.json']) {
    fs.copyFileSync(path.join(GRA, f), path.join(root, f));
  }
  for (const d of ['data', 'node_modules']) {
    fs.symlinkSync(fs.realpathSync(path.join(GRA, d)), path.join(root, d), 'dir');
  }
  fs.cpSync(SRC_DIR, path.join(root, 'src'), { recursive: true });
  for (const m of mutations || []) {
    const p = path.join(root, m.file);
    const s = fs.readFileSync(p, 'utf8');
    if (s.indexOf(m.from) < 0) {
      if (process.env.STB_SRC) { console.log('[mut-skip] ' + variant + ': brak wzorca (src pre-zmiana)'); continue; }
      throw new Error('Mutacja niemozliwa (' + variant + '): brak wzorca w ' + m.file + ': ' + m.from.slice(0, 70));
    }
    fs.writeFileSync(p, s.replace(m.from, m.to), 'utf8');
  }
  return root;
}

function bundleFort(variant, mutations) {
  const root = makeRoot('fort-' + variant, mutations);
  const outfile = path.join(TMP_ROOT, `fort-${variant}.cjs`);
  esbuild.buildSync({
    entryPoints: [path.join(root, FORT_REL)], bundle: true, platform: 'node', format: 'cjs',
    outfile, logLevel: 'silent', loader: { '.json': 'json' },
  });
  return require(outfile);
}

function buildVite(variant, mutations) {
  const root = makeRoot('vite-' + variant, mutations);
  const outDir = path.join(TMP_ROOT, `dist-${variant}`);
  execSync(
    `node ${JSON.stringify(path.join(GRA, 'node_modules/vite/bin/vite.js'))} build`
    + ` --outDir ${JSON.stringify(outDir)} --emptyOutDir`,
    { cwd: root, stdio: 'pipe', maxBuffer: 128 * 1024 * 1024 },
  );
  fs.rmSync(root, { recursive: true, force: true });
  if (!fs.existsSync(path.join(outDir, 'index.html'))) throw new Error('brak index.html (' + variant + ')');
  return outDir;
}

// ---------------------------------------------------------------------------
// CZESC A
// ---------------------------------------------------------------------------
function partA(F, label) {
  const out = [];
  const ok = (name, cond, detail) => out.push({ name: label + ' ' + name, cond: !!cond, detail });
  const hasApi = typeof F.attackerWallEntryIsBreach === 'function';
  ok('API R5 attackerWallEntryIsBreach istnieje', hasApi);
  if (!hasApi) return out;
  ok('A1 atakujacy na koronie (wspial sie wieza) => wylom', F.attackerWallEntryIsBreach('atk', true) === true);
  ok('A2 atakujacy NIE na koronie => brak wylomu', F.attackerWallEntryIsBreach('atk', false) === false);
  ok('A3 obronca na koronie => NIE wylom (obroncy stoja tam od startu)', F.attackerWallEntryIsBreach('def', true) === false);
  ok('A4 obronca poza korona => brak wylomu', F.attackerWallEntryIsBreach('def', false) === false);
  for (const lbl of ['palisada', 'mury']) {
    const fort = F.cityHasFortification([lbl]);
    ok(`A5 ${lbl}: bez wiezy/machin (brak wejscia na korone) => miasto NIE do zdobycia (R1 bez zmian)`,
      F.canCaptureCity(fort, F.attackerWallEntryIsBreach('atk', false)) === false);
    ok(`A6 ${lbl}: atakujacy na koronie (wieza) => miasto DO zdobycia`,
      F.canCaptureCity(fort, F.attackerWallEntryIsBreach('atk', true)) === true);
  }
  ok('A7 bez obwarowania: zdobycie bez zmian (zawsze)', F.canCaptureCity(F.cityHasFortification([]), false) === true);
  ok('A8 po wejsciu wieza melee atakujacy bija obroncow z muru (R2 po wylomie)',
    F.meleeBlockedByWall({ attackerIsMelee: true, attackerOnWall: false, defenderOnWall: true, wallBreached: F.attackerWallEntryIsBreach('atk', true) }) === false
    && F.meleeBlockedByWall({ attackerIsMelee: true, attackerOnWall: false, defenderOnWall: true, wallBreached: false }) === true);
  // Spojnosc z Auto: wieza (jak kazda machina) w skladzie => wylom; taktyka: wieza, ktora wprowadzila piechote => wylom.
  ok('A9 Auto: autoStormBreach(machina w skladzie) true / bez machin false (bez zmian)',
    F.autoStormBreach(true) === true && F.autoStormBreach(false) === false);
  ok('A10 PARYTET Auto == taktyka: wieza w skladzie + wejscie na mur => ten sam wynik zdobycia',
    F.canCaptureCity(true, F.autoStormBreach(true)) === F.canCaptureCity(true, F.attackerWallEntryIsBreach('atk', true))
    && F.canCaptureCity(true, F.autoStormBreach(false)) === F.canCaptureCity(true, F.attackerWallEntryIsBreach('atk', false)));
  return out;
}

// ---------------------------------------------------------------------------
// CZESC B -- prawdziwa scena
// ---------------------------------------------------------------------------
async function launch() {
  try { return await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] }); }
  catch (e) { return await chromium.launch({ headless: true, args: ['--no-sandbox'] }); }
}

async function measureScene(browser, outDir, fort, scenario, shotPath) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const q = '?playtest=oblezenie-duze' + (fort ? '&fort=' + fort : '');
  await page.goto('file://' + path.join(outDir, 'index.html') + q, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__lastBattleScene, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const m = await page.evaluate((scn) => {
    const bs = window.__lastBattleScene;
    try { bs._endDeployPhase(); } catch (e) { /* deploy moze byc zakonczony */ }
    const wc = bs.siegeWallCol; const wb = wc - 1;
    const isTower = (u) => /wieza oblezn|siege tower/i.test(String((u.bu.stats && u.bu.stats['Jednostka']) || u.bu.nazwa || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l'));
    const atkAlive = bs.atk.filter((u) => !u.dead);
    // Skład playtestu nie zawiera wieży: w scenariuszu "tower" JEDNA machinę (Taran) przemianowujemy na
    // "Wieża oblężnicza" (dane jednostki), reszta to realny kod sceny (isSiegeTower po nazwie/stats).
    let tower = atkAlive.find((u) => isTower(u));
    if (!tower && scn === 'tower') {
      tower = atkAlive.find((u) => u.bu.stats && u.bu.stats['Typ'] === 'Siege' && !bs._isCatapult(u.bu));
      if (tower) {
        tower.bu.stats = Object.assign({}, tower.bu.stats, { 'Jednostka': 'Wieża oblężnicza' });
        tower.bu.nazwa = 'Wieża oblężnicza';
      }
    }
    const hasTowerInRoster = !!tower && isTower(tower);
    // Wymuszamy tryb "bez doktryny", żeby aktywacja doszła do kodu wspinaczki (ruch piechoty = wspinaczka wieżą).
    bs._manualMode = false; bs._isUnitDoctrineAuto = () => false;
    const grunt = atkAlive.find((u) => !u.mounted && !isTower(u) && !bs._isCatapult(u.bu) && u.bu.stats && u.bu.stats['Typ'] === 'Swordsman');
    if (grunt) { grunt.ammoLeft = 0; grunt.shootingEnabled = false; }
    const out = {
      wallCol: wc, hasTowerInRoster, hasGrunt: !!grunt,
      defOnWallAtStart: bs.def.filter((u) => !u.dead && u.onWallWalkway).length,
      breachedAtStart: bs.wallEverBreached === true,
      gateHp: bs.gateHp,
      atkSummary: atkAlive.slice(0, 0).map((u) => [String((u.bu.stats && u.bu.stats['Jednostka']) || u.bu.nazwa), u.mounted === true, u.rangedBase === true, (u.bu.stats && u.bu.stats['Typ']) || '']),
    };
    if (!grunt) return out;
    const place = (u, c, r) => {
      bs.occByKey.delete(u.q + ',' + u.r);
      u.q = c; u.r = r; bs.occByKey.set(c + ',' + r, u);
    };
    // Wolny rzad przy murze: nikt (zywy) nie stoi w (wb, r), (wb, r+1), (wc, r).
    let row = -1;
    for (let r = 4; r < 160; r++) {
      const keys = [wb + ',' + r, wb + ',' + (r + 1), wc + ',' + r, (wb - 1) + ',' + r];
      if (keys.every((k) => !bs.occByKey.has(k))) { row = r; break; }
    }
    out.row = row;
    if (row < 0) return out;
    // Atakujacy w (wb, row), tuz obok miejsca wiezy (wb, row+1). Zadne inne akcje (reczne zlecenia) nie przeszkadzaja.
    grunt.moveLeft = 5;
    place(grunt, wb, row);
    if (scn === 'tower' && tower) {
      place(tower, wb, row + 1);
      tower.moveLeft = 5;
      let tDone = false;
      try { bs._activateUnit(tower, () => { tDone = true; }); } catch (e) { out.towerErr = String(e); }
      out.towerRegistered = bs.towerAtWallRows.has(row + 1);
      out.towerDbg = { done: tDone, q: tower.q, r: tower.r, rows: Array.from(bs.towerAtWallRows), routed: tower.routed, dead: tower.dead, ram: bs._isRam(tower.bu), manual: bs._manualMode };
    }
    out.breachedBefore = bs.wallEverBreached === true;
    out.gruntOnWallBefore = grunt.onWallWalkway === true;
    let gDone = false;
    try { bs._activateUnit(grunt, () => { gDone = true; }); } catch (e) { out.activateErr = String(e); }
    out.gruntOnWallAfter = grunt.onWallWalkway === true;
    out.gruntPos = [grunt.q, grunt.r];
    out.breachedAfter = bs.wallEverBreached === true;
    out.logBreach = bs.log.filter((l) => /WYLOM: atakujacy/.test(l)).length;
    // R1: czy miasto moze byc zdobyte (ta sama regula co main.ts: canCaptureCity(fortified, res.wallBreached))
    out.finishWallBreached = bs.wallEverBreached;
    // R2 po wylomie: melee atakujacy (nie na murze) vs obronca na koronie -- blokada znika tylko po wylomie
    const defOnWall = bs.def.find((u) => !u.dead && u.onWallWalkway);
    if (defOnWall) {
      const probe = atkAlive.find((u) => u !== grunt && !u.onWallWalkway && !bs._isCatapult(u.bu) && !isTower(u) && !u.mounted && u.bu.stats && u.bu.stats['Typ'] === 'Swordsman');
      if (probe) { probe.ammoLeft = 0; }
      if (probe && typeof bs._meleeBlockedByWall === 'function') out.meleeBlockedAfter = bs._meleeBlockedByWall(probe, defOnWall);
    }
    return out;
  }, scenario);
  if (shotPath && scenario === 'tower') {
    try { await page.screenshot({ path: shotPath, type: 'jpeg', quality: 55, timeout: 150000 }); } catch (e) { console.log('[shot] blad: ' + e); }
  }
  await page.close();
  return { m, errors };
}

function partB(tower, ctl, label, F) {
  const out = [];
  const ok = (name, cond, detail) => out.push({ name: label + ' ' + name, cond: !!cond, detail });
  const t = tower.m; const c = ctl.m;
  ok('B0 scena oblezenia: sa atakujacy wieza + piechota; wolny rzad przy murze', t.hasTowerInRoster && t.hasGrunt && t.row >= 0, t);
  ok('B1 start sceny: brak wylomu mimo obroncow na koronie (obronca na murze nie jest wylomem)',
    t.breachedAtStart === false && t.defOnWallAtStart > 0, { breached: t.breachedAtStart, defOnWall: t.defOnWallAtStart });
  ok('B2 wieza stoi przy murze (towerAtWallRows) po realnej aktywacji', t.towerRegistered === true, t.towerRegistered);
  ok('B3 piechota wspiela sie po wiezy na korone muru', t.gruntOnWallBefore === false && t.gruntOnWallAfter === true, t);
  ok('B4 WYLOM: wejscie wieza na mur ustawia wallEverBreached', t.breachedBefore === false && t.breachedAfter === true, t);
  ok('B5 miasto obwarowane MOZE byc zdobyte (canCaptureCity(true, wallBreached))', F.canCaptureCity(true, t.finishWallBreached === true) === true, t.finishWallBreached);
  ok('B6 R2 po wylomie: melee z podstawy muru bije obroncow na koronie (blokada zniknela)', t.meleeBlockedAfter === false, t.meleeBlockedAfter);
  ok('B7 w logu bitwy jest wpis o wylomie', t.logBreach === 1, t.logBreach);
  // Kontrola: bez wiezy, ta sama piechota przy murze -- nie wspina sie, brak wylomu, miasto nie padnie
  ok('B8 KONTROLA bez wiezy: piechota przy murze NIE wchodzi na korone', c.gruntOnWallAfter === false, c);
  ok('B9 KONTROLA bez wiezy i bez machin: brak wylomu => miasto obwarowane NIE do zdobycia (R1)',
    c.breachedAfter === false && F.canCaptureCity(true, c.finishWallBreached === true) === false, c);
  ok('B10 KONTROLA bez wylomu: R2 nadal blokuje melee na obroncy z muru', c.meleeBlockedAfter === true, c.meleeBlockedAfter);
  ok('B11 brak bledow JS (pageerror)', tower.errors.length === 0 && ctl.errors.length === 0, [tower.errors, ctl.errors]);
  return out;
}

function report(items) { for (const it of items) check(it.name, it.cond, it.detail); }

async function main() {
  console.log('[' + TAG + '] SRC=' + SRC_DIR);
  // CZESC A
  const Fbase = bundleFort('base', []);
  report(partA(Fbase, '[A base]'));
  const mutsA = {
    'brak sprawdzenia strony (obronca na koronie = wylom)': [{ file: FORT_REL, from: "return side === 'atk' && onWallWalkway === true;", to: 'return onWallWalkway === true;' }],
    'ignoruje wejscie na korone (zawsze false)': [{ file: FORT_REL, from: "return side === 'atk' && onWallWalkway === true;", to: 'return false;' }],
    'kazdy atakujacy = wylom (bez wejscia na mur)': [{ file: FORT_REL, from: "return side === 'atk' && onWallWalkway === true;", to: "return side === 'atk';" }],
  };
  for (const [nm, muts] of Object.entries(mutsA)) {
    const items = partA(bundleFort('mutA-' + nm.length, muts), '[A mut]');
    const red = items.filter((i) => !i.cond);
    check('A-MUT ' + nm + ' => test CZERWONY (nietautologiczny)', red.length > 0, red.length);
  }
  // CZESC C -- Auto / zrodlo
  const mainSrc = fs.readFileSync(path.join(SRC_DIR, 'main.ts'), 'utf8');
  const sceneSrc = fs.readFileSync(path.join(SRC_DIR, 'battle/battleScene.ts'), 'utf8');
  check('C1 Auto/szturm: autoStormBreach(isSiegeUnit) w szturmie i fortifiedCityCaptureBlocked (wieza = Rola "Oblężnicza" = machina)',
    /canCaptureCity\(fortified, autoStormBreach\(hasMachine\)\)/.test(mainSrc)
    && /res\.wallBreached\s*\n\s*\?\? autoStormBreach\(atkRoster\.some\(u => isSiegeUnit\(unitDefFor\(u\)\)\)\)/.test(mainSrc));
  const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data/units.json'), 'utf8'));
  const ul = Array.isArray(units) ? units : (units.units || units.jednostki || Object.values(units));
  const wieza = ul.find((u) => u && u['Jednostka'] === 'Wieża oblężnicza');
  check('C2 dane: Wieza obleznicza ma Role (linia) = Oblężnicza (Auto traktuje ja jak machine => wylom)', !!wieza && wieza['Rola (linia)'] === 'Oblężnicza', wieza && wieza['Rola (linia)']);
  check('C3 scena: wynik bitwy niesie wallBreached (main.ts uzywa go zamiast autoStormBreach)',
    /\.\.\.\(this\.siegeWallCol >= 0 \? \{ wallBreached: this\.wallEverBreached \} : \{\}\)/.test(sceneSrc));
  check('C4 scena: wspiecie wieza wola attackerWallEntryIsBreach i ustawia wallEverBreached',
    /ru\.onWallWalkway = true;\s*\n[\s\S]{0,200}attackerWallEntryIsBreach\(ru\.side, ru\.onWallWalkway\) && !this\.wallEverBreached\) \{\s*\n\s*this\.wallEverBreached = true;/.test(sceneSrc));
  check('C5 skip(): "Pomin" z maszyna (takze wieza) w skladzie = wylom (bez zmian)',
    /this\.siegeWallCol >= 0 && this\.atk\.some\(u => !u\.dead && isSiegeUnit\(u\.bu\)\)\) \{\s*\n\s*this\.wallEverBreached = true;/.test(sceneSrc));

  // CZESC B
  const mutScene = {
    'brak ustawienia wylomu przy wspieciu': [{ file: SCENE_REL, from: 'if (attackerWallEntryIsBreach(ru.side, ru.onWallWalkway) && !this.wallEverBreached) {', to: 'if (false) {' }],
  };
  const t0 = Date.now();
  const distBase = buildVite('base', []);
  console.log('[' + TAG + '] vite base ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  const browser = await launch();
  for (const fort of ['', 'palisada']) {
    const lbl = fort || 'mur';
    const tw = await measureScene(browser, distBase, fort, 'tower', fort ? '' : (process.env.STB_SHOT || ''));
    const ct = await measureScene(browser, distBase, fort, 'control', '');
    console.log('[' + TAG + '] POMIAR ' + lbl + ' tower ' + JSON.stringify(tw.m));
    console.log('[' + TAG + '] POMIAR ' + lbl + ' control ' + JSON.stringify(ct.m));
    report(partB(tw, ct, '[B ' + lbl + ']', Fbase));
  }
  if (!process.env.STB_SKIP_MUT) {
    for (const [nm, muts] of Object.entries(mutScene)) {
      const d = buildVite('mut-' + nm.length, muts);
      const tw = await measureScene(browser, d, '', 'tower', '');
      const ct = await measureScene(browser, d, '', 'control', '');
      const items = partB(tw, ct, '[B mut]', Fbase);
      const red = items.filter((i) => !i.cond);
      check('B-MUT ' + nm + ' => test CZERWONY (nietautologiczny): ' + red.map((i) => i.name.slice(0, 40)).join(' | '), red.length > 0, red.length);
      fs.rmSync(d, { recursive: true, force: true });
    }
    // Mutacja C4: pinezka musi zgasnac po usunieciu okablowania
    const mutated = sceneSrc.replace('attackerWallEntryIsBreach(ru.side, ru.onWallWalkway) && !this.wallEverBreached', 'false');
    check('C-MUT usuniecie okablowania wylomu lamie pinezke C4',
      mutated !== sceneSrc && !/attackerWallEntryIsBreach\(ru\.side, ru\.onWallWalkway\) && !this\.wallEverBreached\) \{/.test(mutated));
  }
  await browser.close();
  console.log('--- ' + pass + ' ok, ' + fail + ' fail');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
