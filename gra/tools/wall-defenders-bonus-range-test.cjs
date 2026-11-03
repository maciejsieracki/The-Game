'use strict';
/**
 * wall-defenders-bonus-range-test.cjs
 *
 * R-WEB-WALL-DEFENDERS-BONUS-RANGE-Q1 (decyzja wlasciciela 2026-11-03):
 *  (1) bonus obrony z obwarowania (mur +200%, palisada +100%, Cytadela/Baszta +100%)
 *      dla KAZDEGO obroncy NA murze albo ZA linia muru (wewnatrz miasta) -- nie tylko
 *      na koronie; NIE dla atakujacych ani obroncow POZA murem;
 *  (2) strzelec-obronca NA koronie muru/palisady ma zasieg x2 (w gore); nie-strzelec,
 *      machiny (katapulty) i wiezyczki bez zmian.
 *
 * CZESC A -- PRAWDZIWE funkcje (esbuild game/city-defense.ts): regula "wewnatrz
 *   obwarowania", wartosci bonusu mur/palisada z miasto-params.json, zasieg x2.
 *   + MUTACJE kodu produkcyjnego (>= zamiast >, brak sprawdzenia strony) => czerwono.
 * CZESC B -- PRAWDZIWA SCENA w Chromium (vite build z lustrzanego korzenia poza repo,
 *   ?playtest=oblezenie-duze[&fort=palisada]): BattleScene._wallBonusProcFor (ta sama
 *   funkcja co _singleBlow), ru.range po _applyTerrainRange, parytet "Pomin"
 *   (skip() -> lastInstantDefBonus) z taktyka; MUTACJE zrodla sceny => czerwono.
 * CZESC C -- Auto (main.ts structureDefenseBonusFor): pinezka zrodla + ta sama funkcja.
 *
 * Zmienne srodowiska:
 *   WDBR_SRC   -- alternatywny katalog `src` (np. eksport HEAD sprzed zmiany: pomiar RED).
 *   WDBR_SHOT  -- sciezka zrzutu JPEG sceny (wariant base).
 *   WDBR_TAG   -- etykieta w logu.
 * Usage (z gra/): TMPDIR=/dev/shm node tools/wall-defenders-bonus-range-test.cjs
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
const SRC_DIR = process.env.WDBR_SRC ? path.resolve(process.env.WDBR_SRC) : path.join(GRA, 'src');
const TAG = process.env.WDBR_TAG || 'WDBR';
const RUN = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const TMP_ROOT = path.join(os.tmpdir(), `civ-wdbr-${RUN}`);
fs.mkdirSync(TMP_ROOT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(TMP_ROOT, { recursive: true, force: true }); } catch { /* best-effort */ } });

let pass = 0; let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

const DEF_REL = 'src/game/city-defense.ts';
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
      // Pre-zmiana (WDBR_SRC) brak miejsca mutacji -- dla RED pomijamy, inaczej twardy blad.
      if (process.env.WDBR_SRC) { console.log('[mut-skip] ' + variant + ': brak wzorca (src pre-zmiana)'); continue; }
      throw new Error('Mutacja niemozliwa (' + variant + '): brak wzorca w ' + m.file + ': ' + m.from.slice(0, 70));
    }
    fs.writeFileSync(p, s.replace(m.from, m.to), 'utf8');
  }
  return root;
}

function bundleDef(variant, mutations) {
  const root = makeRoot('def-' + variant, mutations);
  const outfile = path.join(TMP_ROOT, `def-${variant}.cjs`);
  esbuild.buildSync({
    entryPoints: [path.join(root, DEF_REL)], bundle: true, platform: 'node', format: 'cjs',
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

const params = JSON.parse(fs.readFileSync(path.join(GRA, 'data/miasto-params.json'), 'utf8'));
const P = {
  mur: params.bonus_obrona_mur_proc.wartosc, cytadela: params.bonus_obrona_cytadela_proc.wartosc,
  baszta: params.bonus_obrona_baszta_proc.wartosc, palisada: params.bonus_obrona_palisada_proc.wartosc,
};

// ---------------------------------------------------------------------------
// CZESC A
// ---------------------------------------------------------------------------
function partA(D, label, expectGreen) {
  const out = [];
  const ok = (name, cond, detail) => out.push({ name: label + ' ' + name, cond: !!cond, detail });
  const hasApi = typeof D.defenderInsideFortification === 'function'
    && typeof D.fortificationDefenseBonusForUnit === 'function'
    && typeof D.wallCrownShooterRange === 'function';
  ok('API reguly "wewnatrz obwarowania" istnieje (defenderInsideFortification/fortificationDefenseBonusForUnit/wallCrownShooterRange)', hasApi);
  if (!hasApi) return out;
  const W = 23;
  const inside = (o) => D.defenderInsideFortification(Object.assign({ side: 'def', onWallWalkway: false, q: W + 3, siegeWallCol: W }, o));
  ok('A1 obronca na koronie (onWallWalkway) => wewnatrz', inside({ onWallWalkway: true, q: W }) === true);
  ok('A2 obronca ZA murem (q > wallCol), nie na koronie => wewnatrz', inside({ q: W + 3 }) === true);
  ok('A3 obronca tuz za murem (q = wallCol+1) => wewnatrz', inside({ q: W + 1 }) === true);
  ok('A4 obronca POZA murem (q < wallCol) => NIE', inside({ q: W - 2 }) === false);
  ok('A5 obronca w kaflu muru bez korony (wyburzony/brama, q = wallCol) => NIE', inside({ q: W }) === false);
  ok('A6 atakujacy za murem => NIE', inside({ side: 'atk', q: W + 3 }) === false);
  ok('A7 atakujacy, ktory wspial sie na korone (wieza) => NIE', inside({ side: 'atk', onWallWalkway: true, q: W }) === false);
  ok('A8 brak sceny oblezenia (wallCol -1): tylko flaga korony', inside({ siegeWallCol: -1, q: 5 }) === false
    && inside({ siegeWallCol: -1, q: 5, onWallWalkway: true }) === true);
  const mur = D.cityWallDefenseBonusPercent(['mury'], P);
  const pal = D.cityWallDefenseBonusPercent(['palisada'], P);
  const palMur = D.cityWallDefenseBonusPercent(['palisada', 'mury'], P);
  const full = D.cityWallDefenseBonusPercent(['mury', 'fort', 'baszta'], P);
  ok('A9 wartosci z danych: mur=+200, palisada=+100, mur zastepuje palisade, mur+cyt+baszta=400',
    mur === 200 && pal === 100 && palMur === 200 && full === 400, { mur, pal, palMur, full });
  const b = (o, tot) => D.fortificationDefenseBonusForUnit(Object.assign({ side: 'def', onWallWalkway: false, q: W + 3, siegeWallCol: W }, o), tot);
  ok('A10 wewnatrz muru (nie korona): +200% (mur)', b({}, mur) === 200, b({}, mur));
  ok('A11 wewnatrz palisady (nie korona): +100% (palisada)', b({}, pal) === 100, b({}, pal));
  ok('A12 na koronie: bonus bez zmian (+200)', b({ onWallWalkway: true, q: W }, mur) === 200);
  ok('A13 poza murem: 0', b({ q: W - 2 }, mur) === 0);
  ok('A14 atakujacy: 0 (takze na koronie)', b({ side: 'atk', onWallWalkway: true, q: W }, mur) === 0 && b({ side: 'atk' }, mur) === 0);
  ok('A15 brak obwarowania (0): 0 nawet wewnatrz', b({}, 0) === 0);
  const r = D.wallCrownShooterRange;
  ok('A16 zasieg x2 w gore: 1->2, 2->4, 3->6, 4->8, 1.5->3, 2.2->5 (ceil), 0->0',
    r(1) === 2 && r(2) === 4 && r(3) === 6 && r(4) === 8 && r(1.5) === 3 && r(2.2) === 5 && r(0) === 0,
    [r(1), r(2), r(3), r(4), r(1.5), r(2.2), r(0)]);
  void expectGreen;
  return out;
}

// ---------------------------------------------------------------------------
// CZESC B -- pomiar na prawdziwej scenie
// ---------------------------------------------------------------------------
async function launch() {
  try { return await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] }); }
  catch (e) { return await chromium.launch({ headless: true, args: ['--no-sandbox'] }); }
}

async function measureScene(browser, outDir, fort, shotPath) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const q = '?playtest=oblezenie-duze' + (fort ? '&fort=' + fort : '');
  await page.goto('file://' + path.join(outDir, 'index.html') + q, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__lastBattleScene, { timeout: 30000 });
  await page.waitForTimeout(1500);

  const m = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const wc = bs.siegeWallCol;
    const hasApi = typeof bs._wallBonusProcFor === 'function';
    // Pre-zmiana (brak API): odczyt dawnej formuly battleScene.ts:~8465 `onWallWalkway ? total : 0`.
    const bonusOf = (u) => hasApi ? bs._wallBonusProcFor(u) : (u.onWallWalkway ? bs.wallDefenseTotalProc : 0);
    const isCata = (u) => bs._isCatapult(u.bu);
    const def = bs.def.filter((u) => !u.dead);
    const crownMelee = def.find((u) => u.onWallWalkway && !u.rangedBase && !isCata(u));
    const crownArcher = def.find((u) => u.onWallWalkway && u.rangedBase && !isCata(u));
    const crownCata = def.find((u) => u.onWallWalkway && isCata(u));
    const rest = def.find((u) => !u.onWallWalkway);
    const out = {
      hasApi, wallCol: wc, total: bs.wallDefenseTotalProc,
      n: { def: def.length, crownMelee: !!crownMelee, crownArcher: !!crownArcher, crownCata: !!crownCata, rest: !!rest },
    };
    const withPos = (u, q, onWall, fn) => {
      const o = { q: u.q, onWall: u.onWallWalkway }; u.q = q; u.onWallWalkway = onWall;
      try { return fn(); } finally { u.q = o.q; u.onWallWalkway = o.onWall; }
    };
    if (crownMelee) {
      out.crown = bonusOf(crownMelee);
      out.interior = withPos(crownMelee, wc + 3, false, () => bonusOf(crownMelee));
      out.interiorJustBehind = withPos(crownMelee, wc + 1, false, () => bonusOf(crownMelee));
      out.outside = withPos(crownMelee, wc - 2, false, () => bonusOf(crownMelee));
      out.wallTileNoCrown = withPos(crownMelee, wc, false, () => bonusOf(crownMelee));
    }
    if (rest) out.restPos = { q: rest.q, onWall: rest.onWallWalkway, bonus: bonusOf(rest) };
    const atk = bs.atk.find((u) => !u.dead);
    if (atk) {
      const o = { q: atk.q, w: atk.onWallWalkway };
      atk.onWallWalkway = true; atk.q = wc;
      out.atkOnCrown = hasApi ? bs._wallBonusProcFor(atk) : (atk.side === 'def' ? bs.wallDefenseTotalProc : 0);
      atk.q = o.q; atk.onWallWalkway = o.w;
    }
    // Zasieg
    if (crownArcher) {
      bs._applyTerrainRange(crownArcher);
      const onCrown = crownArcher.range;
      const o = crownArcher.onWallWalkway;
      crownArcher.onWallWalkway = false; bs._applyTerrainRange(crownArcher);
      const off = crownArcher.range;
      crownArcher.onWallWalkway = o; bs._applyTerrainRange(crownArcher);
      out.archer = { rangeBase: crownArcher.rangeBase, onCrown, offCrown: off, atStart: null };
    }
    if (crownCata) {
      bs._applyTerrainRange(crownCata);
      out.cata = { rangeBase: crownCata.rangeBase, range: crownCata.range };
    }
    if (crownMelee) {
      bs._applyTerrainRange(crownMelee);
      out.melee = { rangeBase: crownMelee.rangeBase, range: crownMelee.range };
    }
    // Zasieg od STARTU (podswietlenie UI czyta ru.range bez aktywacji): swieza scena => lista strzelcow na koronie.
    out.startRanges = def.filter((u) => u.onWallWalkway && u.rangedBase && !isCata(u))
      .slice(0, 6).map((u) => ({ base: u.rangeBase, range: u.range }));
    return out;
  });

  // Rozstrzygniecie "Pomin" -- parytet z taktyka. Pozycje: korona / za murem / poza murem.
  const skipM = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const wc = bs.siegeWallCol;
    const hasApi = typeof bs._wallBonusProcFor === 'function';
    const def = bs.def.filter((u) => !u.dead && !bs._isCatapult(u.bu));
    if (def.length < 3) return { skipped: 'za malo obroncow' };
    const crown = def.find((u) => u.onWallWalkway);
    const others = def.filter((u) => u !== crown);
    const inner = others[0]; const outer = others[1];
    inner.onWallWalkway = false; inner.q = wc + 3;
    outer.onWallWalkway = false; outer.q = wc - 2;
    const tactical = hasApi
      ? { crown: bs._wallBonusProcFor(crown), inner: bs._wallBonusProcFor(inner), outer: bs._wallBonusProcFor(outer) }
      : null;
    const pos = { crown: [crown.q, crown.r], inner: [inner.q, inner.r], outer: [outer.q, outer.r] };
    let err = null;
    try { bs.skip(); } catch (e) { err = String(e); }
    const rows = Array.isArray(bs.lastInstantDefBonus) ? bs.lastInstantDefBonus : null;
    const pick = (p) => {
      if (!rows) return null;
      const r = rows.find((x) => x.q === p[0] && x.r === p[1]);
      return r ? r.pct : null;
    };
    return {
      hasApi, tactical, err, hasInstantField: !!rows,
      instant: { crown: pick(pos.crown), inner: pick(pos.inner), outer: pick(pos.outer) },
    };
  });

  if (shotPath) {
    // Zrzut (jpeg <= 1 MB): scena z murem i obroncami; po skip() ekran konca -- wiec robimy zrzut z osobnej strony.
    try {
      const p2 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
      await p2.goto('file://' + path.join(outDir, 'index.html') + q, { waitUntil: 'load', timeout: 120000 });
      await p2.waitForFunction(() => !!window.__lastBattleScene, { timeout: 30000 });
      await p2.waitForTimeout(2500);
      await p2.screenshot({ path: shotPath, type: "jpeg", quality: 55, timeout: 150000 });
      await p2.close();
    } catch (e) { console.log('[shot] blad: ' + e); }
  }
  await page.close();
  return { m, skipM, errors };
}

function partB(res, label, mur, isPal) {
  const out = [];
  const ok = (name, cond, detail) => out.push({ name: label + ' ' + name, cond: !!cond, detail });
  const { m, skipM } = res;
  const exp = isPal ? P.palisada : P.mur;
  ok('B0 total bonus sceny = ' + exp + '% (' + (isPal ? 'palisada' : 'mur') + ')', m.total === exp, m.total);
  ok('B0b scena ma obroncow: korona-wrecz, korona-strzelec, poza korona', m.n.crownMelee && m.n.crownArcher && m.n.rest, m.n);
  ok('B1 obronca na koronie: bonus ' + exp + '%', m.crown === exp, m.crown);
  ok('B2 obronca ZA murem (q=wallCol+3, nie korona): bonus ' + exp + '% (NOWA REGULA)', m.interior === exp, m.interior);
  ok('B3 obronca tuz za murem (q=wallCol+1): bonus ' + exp + '%', m.interiorJustBehind === exp, m.interiorJustBehind);
  ok('B4 obronca POZA murem (q=wallCol-2): 0', m.outside === 0, m.outside);
  ok('B5 kafel muru bez korony (wyburzony): 0', m.wallTileNoCrown === 0, m.wallTileNoCrown);
  ok('B6 atakujacy na koronie: 0 (bonus nie dotyczy atakujacych)', m.atkOnCrown === 0, m.atkOnCrown);
  ok('B7 jednostka startujaca ZA murem (jazda/machina) ma bonus ' + exp + '%', m.restPos && m.restPos.bonus === exp, m.restPos);
  if (m.archer) {
    ok('B8 strzelec na koronie: zasieg x2 (' + m.archer.offCrown + ' -> ' + m.archer.onCrown + ')',
      m.archer.offCrown > 0 && m.archer.onCrown === Math.ceil(m.archer.offCrown * 2), m.archer);
    ok('B9 zasieg strzelca na koronie widoczny juz od STARTU sceny (podswietlenie UI)',
      m.startRanges.length > 0 && m.startRanges.every((r) => r.range === Math.ceil(r.base * 2) || r.range > r.base),
      m.startRanges);
  } else ok('B8 scena ma strzelca na koronie', false);
  if (m.melee) ok('B10 wrecz na koronie: zasieg bez zmian (0)', m.melee.range === m.melee.rangeBase, m.melee);
  if (m.cata) ok('B11 katapulta na koronie: zasieg bez zmian (stala regula, bez x2)', m.cata.range === m.cata.rangeBase, m.cata);
  ok('B12 "Pomin" zwraca bonus per obronca (lastInstantDefBonus)', skipM.hasInstantField === true, skipM);
  if (skipM.hasInstantField) {
    ok('B13 PARYTET Pomin: korona/za murem/poza murem = ' + exp + '/' + exp + '/0',
      skipM.instant.crown === exp && skipM.instant.inner === exp && skipM.instant.outer === 0, skipM.instant);
    ok('B14 PARYTET taktyka == Pomin (te same trzy wartosci)',
      skipM.tactical && skipM.tactical.crown === skipM.instant.crown && skipM.tactical.inner === skipM.instant.inner
      && skipM.tactical.outer === skipM.instant.outer, { tactical: skipM.tactical, instant: skipM.instant });
  }
  ok('B15 brak bledow JS (pageerror)', res.errors.length === 0, res.errors);
  void mur;
  return out;
}

function report(items) {
  for (const it of items) check(it.name, it.cond, it.detail);
}

async function main() {
  console.log('[' + TAG + '] SRC=' + SRC_DIR);
  // CZESC A
  const Dbase = bundleDef('base', []);
  report(partA(Dbase, '[A base]'));
  // mutacje A
  const DmutEq = bundleDef('mutEq', [{ file: DEF_REL, from: 'ctx.siegeWallCol >= 0 && ctx.q > ctx.siegeWallCol', to: 'ctx.siegeWallCol >= 0 && ctx.q >= ctx.siegeWallCol' }]);
  const DmutSide = bundleDef('mutSide', [{ file: DEF_REL, from: "if (ctx.side !== 'def') return false;", to: '' }]);
  const DmutInside = bundleDef('mutInside', [{ file: DEF_REL, from: 'return ctx.siegeWallCol >= 0 && ctx.q > ctx.siegeWallCol;', to: 'return false;' }]);
  const DmutRange = bundleDef('mutRange', [{ file: DEF_REL, from: 'Math.ceil(effectiveRange * WALL_CROWN_RANGE_MULT)', to: 'Math.floor(effectiveRange * 1.5)' }]);
  for (const [nm, D] of [['q>=wallCol (kafel muru liczony jako wnetrze)', DmutEq], ['brak sprawdzenia strony (atakujacy)', DmutSide],
    ['brak reguly "za murem" (tylko korona)', DmutInside], ['zasieg x1.5 floor', DmutRange]]) {
    const items = partA(D, '[A mut]');
    const red = items.some((i) => !i.cond);
    check('A-MUT ' + nm + ' => test CZERWONY (nietautologiczny)', red, items.filter((i) => !i.cond).length);
  }
  // CZESC C -- Auto
  const mainSrc = fs.readFileSync(path.join(SRC_DIR, 'main.ts'), 'utf8');
  const i0 = mainSrc.indexOf('function structureDefenseBonusFor(q: number, r: number): number {');
  const body = i0 >= 0 ? mainSrc.slice(i0, i0 + 900) : '';
  check('C1 Auto: structureDefenseBonusFor(miasto) = cityWallDefenseBonusPercent (ta sama funkcja co taktyka; dla CALEGO rostera obroncow na heksie miasta)',
    /cityOnHex[\s\S]*cityWallDefenseBonusPercent\(builtIds[\s\S]*if \(wallBonus > 0\) return wallBonus/.test(body));
  check('C2 Auto: effectiveDefenderM stosuje bonus do CALEJ Obrony rostera (split.defense * (1 + combinedDefPct/100))',
    /terrAdjDefense = split\.defense \* \(1 \+ combinedDefPct \/ 100\)/.test(mainSrc));

  // CZESC B
  const mutScene = {
    inside: [{ file: SCENE_REL, from: 'return fortificationDefenseBonusForUnit(\n      { side: u.side, onWallWalkway: u.onWallWalkway === true, q: u.q, siegeWallCol: this.siegeWallCol },',
      to: 'return fortificationDefenseBonusForUnit(\n      { side: u.side, onWallWalkway: u.onWallWalkway === true, q: u.q, siegeWallCol: -1 },' }],
    skip: [{ file: SCENE_REL, from: '{ side: d.ru.side, onWallWalkway: defOnWall, q: d.ru.q, siegeWallCol },',
      to: '{ side: d.ru.side, onWallWalkway: defOnWall, q: d.ru.q, siegeWallCol: -1 },' }],
    range: [{ file: SCENE_REL, from: 'if (this._isWallCrownShooter(ru)) ru.range = wallCrownShooterRange(ru.range);', to: '' }],
  };
  const dist = {};
  const t0 = Date.now();
  dist.base = buildVite('base', []);
  console.log('[' + TAG + '] vite base ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  const browser = await launch();
  const base = await measureScene(browser, dist.base, '', process.env.WDBR_SHOT || '');
  console.log('[' + TAG + '] POMIAR mur ' + JSON.stringify(base.m));
  console.log('[' + TAG + '] POMIAR skip ' + JSON.stringify(base.skipM));
  report(partB(base, '[B mur]', true, false));
  const basePal = await measureScene(browser, dist.base, 'palisada', '');
  console.log('[' + TAG + '] POMIAR palisada ' + JSON.stringify(basePal.m));
  console.log('[' + TAG + '] POMIAR skip palisada ' + JSON.stringify(basePal.skipM));
  report(partB(basePal, '[B palisada]', true, true));

  if (!process.env.WDBR_SKIP_MUT) {
    for (const key of ['inside', 'skip', 'range']) {
      dist[key] = buildVite('mut-' + key, mutScene[key]);
      const r = await measureScene(browser, dist[key], '', '');
      const items = partB(r, '[B mut-' + key + ']', true, false);
      const red = items.filter((i) => !i.cond);
      check('B-MUT ' + key + ' => test CZERWONY (nietautologiczny): ' + red.map((i) => i.name.slice(0, 40)).join(' | '), red.length > 0, red.length);
      fs.rmSync(dist[key], { recursive: true, force: true });
    }
  }
  await browser.close();
  console.log('--- ' + pass + ' ok, ' + fail + ' fail');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
