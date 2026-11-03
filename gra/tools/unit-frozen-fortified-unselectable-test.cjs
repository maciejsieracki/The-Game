'use strict';
/**
 * unit-frozen-fortified-unselectable-test.cjs — R-WEB-UNIT-FROZEN-FORTIFIED-UNSELECTABLE-Q1.
 *
 * Zgloszenie: jednostka "zamiera" w stanie ufortyfikowanym, nie da sie jej kliknac, a po
 * polaczeniu z inna armia cala armia dziedziczy blokade.
 * PRZYCZYNA: `inGarnizon===true` poza heksem WLASNEGO miasta (osierocony garnizon) -- filtry
 * mapy (unitAtRepresentative/visibleStackOnHex) pomijaja garnizon, a `preferGarnizon` w
 * main.ts propagowal flage na cala armie przy laczeniu.
 *
 * Warstwy:
 *  A. JEDNOSTKOWA (realny armyMerge.ts, esbuild): reprodukcja (klik=null), samoleczenie,
 *     zachowanie legalnego garnizonu/fortyfikacji w polu, stary zapis (JSON), idempotencja.
 *  B. MUTACJE: zmutowane kopie armyMerge.ts MUSZA wywrocic A.
 *  C. STRUKTURALNA main.ts: heal wpiety w klik / wybor / start tury / wczytanie / evict / cesje;
 *     merge nie propaguje garnizonu poza wlasne miasto.
 *  D. ZYWA (Chromium, bundle w /dev/shm): realny klik w osierocony garnizon, laczenie przez
 *     panel, licznik samoleczenia. Flaga `--no-live` pomija.
 *
 * BASELINE=1 -> armyMerge.ts z origin/main (RED przed naprawa).
 * Uruchomienie (z gra/): node tools/unit-frozen-fortified-unselectable-test.cjs [--no-live]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const MERGE_SRC = path.join(GRA, 'src', 'game', 'armyMerge.ts');
const MAIN_SRC = path.join(GRA, 'src', 'main.ts');
const NO_LIVE = process.argv.includes('--no-live');
const BASELINE = process.env.BASELINE === '1';

let pass = 0;
let fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

function bundleMerge(srcText, tag) {
  const dir = fs.mkdtempSync('/dev/shm/ufu-' + tag + '-');
  // armyMerge.ts importuje wzglednie (../units/setup) -- zapis obok oryginalu, nie w /dev/shm.
  const tsFile = path.join(GRA, 'src', 'game', '.ufu-' + tag + '-' + process.pid + '.ts');
  fs.writeFileSync(tsFile, srcText, 'utf8');
  const out = path.join(dir, 'm.cjs');
  try {
    esbuild.buildSync({ entryPoints: [tsFile], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent' });
  } finally {
    fs.rmSync(tsFile, { force: true });
  }
  const mod = require(out);
  return { mod, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

const mk = (id, q, r, extra) => Object.assign({
  id, ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2,
}, extra || {});

function unitChecks(M, report) {
  let bad = 0;
  const chk = (label, cond, d) => { if (!cond) bad++; if (report) ok(label, cond, d); };
  const atk = () => 1;
  const city = { id: 'c1', q: 5, r: 5, ownerId: 0 };

  // A1: odtworzenie -- osierocony garnizon (poza miastem) jest niewybieralny.
  const orphan = mk('o1', 10, 10, { inGarnizon: true, fortifyRuchSnapshot: 2, ruchLeft: 0 });
  chk('A1 REPRO: garnizon-sierota niewybieralny (unitAtRepresentative=null)',
    M.unitAtRepresentative(10, 10, [orphan], atk) === null);
  chk('A1b REPRO: visibleStackOnHex pusty (merge/ruch go nie widza)',
    M.visibleStackOnHex([orphan], 10, 10, 0).length === 0);

  // A2: samoleczenie -> wybieralny, ruch wraca ze snapshotu, bez sentry.
  if (typeof M.healUnitStates !== 'function') { chk('A2 healUnitStates istnieje', false); return bad + 1; }
  const rep = M.healUnitStates([orphan], [city]);
  chk('A2 heal: 1 garnizon-sierota naprawiony', rep.orphanGarrison === 1 && rep.total === 1, rep);
  chk('A2b po heal: wybieralny kliknieciem', M.unitAtRepresentative(10, 10, [orphan], atk) === orphan);
  chk('A2c po heal: flaga zdjeta, ruch ze snapshotu, snapshot skasowany',
    orphan.inGarnizon === false && orphan.ruchLeft === 2 && orphan.fortifyRuchSnapshot === undefined, orphan);

  // A3: duza armia z jedna zamrozona jednostka (scenariusz "zaraza po polaczeniu").
  const army = [];
  for (let i = 0; i < 26; i++) army.push(mk('a' + i, 112, 101));
  const frozen = mk('fz', 112, 101, { inGarnizon: true, fortifyRuchSnapshot: 2, ruchLeft: 0 });
  army.push(frozen);
  M.healUnitStates(army, [city]);
  chk('A3 armia 27: wszystkie widoczne w stosie po heal',
    M.visibleStackOnHex(army, 112, 101, 0).length === 27);
  chk('A3b armia 27: zadna nie jest inGarnizon', army.every(u => u.inGarnizon !== true));
  chk('A3c armia 27: pula ruchu stosu > 0 (nie zamrozona)', M.stackRuchLeft(army) > 0);

  // A4: legalne stany NIETKNIETE.
  const inCity = mk('g1', 5, 5, { inGarnizon: true, fortifyRuchSnapshot: 2, ruchLeft: 0 });
  const field = mk('f1', 7, 7, { ufortyfikowanyWPolu: true, fortifyRuchSnapshot: 2, ruchLeft: 0 });
  const r2 = M.healUnitStates([inCity, field], [city]);
  chk('A4 garnizon we WLASNYM miescie nietkniety', inCity.inGarnizon === true && inCity.ruchLeft === 0);
  chk('A4b fortyfikacja w polu nietknieta (snapshot zostaje)', field.ufortyfikowanyWPolu === true && field.fortifyRuchSnapshot === 2);
  chk('A4c legalne stany: total=0', r2.total === 0, r2);
  const foreign = mk('g2', 5, 5, { ownerId: 3, inGarnizon: true, fortifyRuchSnapshot: 2 });
  chk('A4d garnizon w CUDZYM miescie = sierota (ownerId miasta != ownerId jednostki)',
    M.healUnitStates([foreign], [city]).orphanGarrison === 1 && foreign.inGarnizon === false);

  // A5: zalegly snapshot / zalegle oblezenie / duplikaty.
  const stale = mk('s1', 8, 8, { fortifyRuchSnapshot: 1 });
  const sieged = mk('z1', 9, 9, { oblegaCityId: 'ghost' });
  const siegedOk = mk('z2', 9, 9, { oblegaCityId: 'c2' });
  const r3 = M.healUnitStates([stale, sieged, siegedOk, mk('s1', 1, 1)],
    [city, { id: 'c2', q: 9, r: 8, ownerId: 1, oblegane: true }], { siege: true });
  chk('A5 zalegly snapshot skasowany', stale.fortifyRuchSnapshot === undefined && r3.staleSnapshot === 1, r3);
  chk('A5b zalegle oblezenie (nieistniejace miasto) zdjete, aktywne zostaje',
    sieged.oblegaCityId === undefined && siegedOk.oblegaCityId === 'c2' && r3.staleSiege === 1, r3);
  chk('A5c duplikat id policzony', r3.duplicateIds === 1, r3);
  const noSiege = mk('z3', 9, 9, { oblegaCityId: 'ghost' });
  M.healUnitStates([noSiege], [city]);
  chk('A5d bez opcji siege oblezenie nietkniete (klik-heal nie rusza oblezen)', noSiege.oblegaCityId === 'ghost');

  // A6: stary zapis (JSON) + idempotencja.
  const saved = JSON.parse(JSON.stringify([mk('p1', 20, 20, { inGarnizon: true }), mk('p2', 20, 20, { inGarnizon: true })]));
  chk('A6 stary zapis: 2 niewybieralne przed heal', M.unitAtRepresentative(20, 20, saved, atk) === null);
  chk('A6b heal naprawia obie', M.healUnitStates(saved, [city]).orphanGarrison === 2 && M.visibleStackOnHex(saved, 20, 20, 0).length === 2);
  chk('A6c idempotencja: drugi przebieg = 0', M.healUnitStates(saved, [city]).total === 0);

  // A7: hasOwnCityAt.
  chk('A7 hasOwnCityAt', M.hasOwnCityAt([city], 5, 5, 0) === true && M.hasOwnCityAt([city], 5, 5, 1) === false && M.hasOwnCityAt([city], 6, 5, 0) === false);
  return bad;
}

function structural() {
  const m = fs.readFileSync(MAIN_SRC, 'utf8');
  const has = (label, re) => ok(label, re.test(m));
  has('C1 heal przed hit-testem klikniecia mapy',
    /healInconsistentUnits\('klik mapy'\);\s*const cu = unitAtRepresentative\(/);
  has('C2 heal przy wyborze jednostki (mapa + lista + panel)',
    /function selectPlayerUnit[\s\S]{0,200}healInconsistentUnits\('wybor jednostki'/);
  has('C3 heal na starcie tury (przed resetem ruchu, z oblezeniem)',
    /healInconsistentUnits\('start tury', \{ siege: true[^}]*\}\);\s*\/\/ Restore movement|healInconsistentUnits\('start tury'[\s\S]{0,200}Restore movement for all units/);
  has('C4 heal po wczytaniu zapisu', /healInconsistentUnits\('wczytanie zapisu'/);
  has('C5 merge (panel) nie propaguje garnizonu poza wlasne miasto',
    /preferGarnizon = all\.some\(x => x\.inGarnizon === true\)\s*&& hasOwnCityAt\(cities, srcQ, srcR, active\.ownerId\)/);
  has('C6 merge (ruch na heks) garnizonMode wymaga wlasnego miasta',
    /garnizonMode = existing\.every\(x => x\.inGarnizon === true\);[\s\S]{0,260}if \(garnizonMode && hasOwnCityAt\(/);
  has('C7 evict zdejmuje garnizon', /u\.r = dest\.r;[\s\S]{0,300}exitGarnizon\(u\);\s*moved = true;/);
  has('C8 cesja miasta zdejmuje garnizon', /u\.r = mv\.r;\s*exitGarnizon\(u\);/);
  has('C9 licznik w logu diagnostycznym', /diagWarn\(\s*'unit-heal'/);
}

async function main() {
  console.log('unit-frozen-fortified-unselectable-test' + (BASELINE ? ' [BASELINE=origin/main]' : ''));
  const srcNow = BASELINE
    ? execSync('git show origin/main:gra/src/game/armyMerge.ts', { cwd: GRA, encoding: 'utf8' })
    : fs.readFileSync(MERGE_SRC, 'utf8');

  console.log('[A] jednostkowa');
  const real = bundleMerge(srcNow, 'real');
  unitChecks(real.mod, true);
  real.cleanup();
  if (BASELINE) { console.log(`\nBASELINE: pass=${pass} fail=${fail}`); process.exit(fail > 0 ? 1 : 0); }

  console.log('[B] mutacje (kazda MUSI wywrocic A)');
  const mutations = [
    ['M1 heal nie leczy sierot', 'if (u.inGarnizon === true && !hasOwnCityAt(cities, u.q, u.r, u.ownerId)) {', 'if (false) {'],
    ['M2 heal leczy rowniez legalny garnizon', 'if (u.inGarnizon === true && !hasOwnCityAt(cities, u.q, u.r, u.ownerId)) {', 'if (u.inGarnizon === true) {'],
    ['M3 hasOwnCityAt ignoruje wlasciciela', 'return cities.some(c => c.ownerId === ownerId && c.q === q && c.r === r);', 'return cities.some(c => c.q === q && c.r === r);'],
    ['M4 heal nie zdejmuje oblezen', "if (opts?.siege === true && u.oblegaCityId) {", 'if (false) {'],
    ['M5 heal nie czysci snapshotu', 'delete u.fortifyRuchSnapshot;\n      rep.staleSnapshot += 1;', 'rep.staleSnapshot += 0;'],
    ['M6 heal kasuje fortyfikacje w polu', 'u.ufortyfikowanyWPolu !== true\n    ) {\n      delete', 'true\n    ) {\n      delete'],
  ];
  for (const [name, from, to] of mutations) {
    if (!srcNow.includes(from)) { ok(name + ' (wzorzec mutacji znaleziony)', false); continue; }
    const b = bundleMerge(srcNow.replace(from, to), 'mut');
    let bad = 0;
    try { bad = unitChecks(b.mod, false); } catch (e) { bad = 1; }
    b.cleanup();
    ok(name + ' -> A sie wywraca', bad > 0);
  }

  console.log('[C] strukturalna main.ts');
  structural();

  if (NO_LIVE) console.log('[D] zywa: POMINIETA (--no-live)');
  else await liveChecks();

  console.log(`\nWYNIK: pass=${pass} fail=${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}

async function liveChecks() {
  console.log('[D] zywa (Chromium)');
  const outDir = '/dev/shm/ufu-live-' + process.pid;
  try {
    execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${outDir} --emptyOutDir`, { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  } catch (e) {
    ok('D0 build bundla', false, String(e.message).slice(0, 200));
    return;
  }
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('file://' + outDir + '/index.html?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(
      () => window.__eraTestDebug && window.__frozenTestDebug
        && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
      null, { timeout: 180000 });
    await page.waitForTimeout(1500);
    const hex = await page.evaluate(() => window.__frozenTestDebug.freeLandHex());
    ok('D0 jest wolny heks ladu poza miastem', !!hex, hex);
    if (!hex) return;
    const hasCity = await page.evaluate(([q, r]) => window.__frozenTestDebug.hasOwnCityAt(q, r), [hex.q, hex.r]);
    ok('D0b heks bez wlasnego miasta', hasCity === false);
    // Scenariusz: 3 jednostki z osieroconym garnizonem + (osobny) wolny heks obok z 2 zwyklymi do laczenia.
    const ids = await page.evaluate(([q, r]) => {
      const d = window.__frozenTestDebug;
      const ids = d.spawn(q, r, 3, { garnizon: true, ruchLeft: 0 });
      d.focus(q, r);
      return ids;
    }, [hex.q, hex.r]);
    await page.waitForTimeout(800);
    const before = await page.evaluate(([q, r]) => window.__frozenTestDebug.unitsAt(q, r), [hex.q, hex.r]);
    ok('D1 scenariusz: 3 jednostki inGarnizon poza miastem', before.length === 3 && before.every(u => u.inGarnizon), before);
    const pos = await page.evaluate(([q, r]) => window.__frozenTestDebug.screenOf(q, r), [hex.q, hex.r]);
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(600);
    const sel = await page.evaluate(() => window.__frozenTestDebug.selectedId());
    ok('D2 REALNY KLIK w zamrozona jednostke ja wybiera', sel !== null && ids.includes(sel), { sel, pos });
    const after = await page.evaluate(([q, r]) => window.__frozenTestDebug.unitsAt(q, r), [hex.q, hex.r]);
    ok('D3 po kliku zadna nie jest inGarnizon, ruch > 0', after.every(u => !u.inGarnizon && u.ruchLeft > 0), after);
    const heals = await page.evaluate(() => window.__frozenTestDebug.healCount());
    ok('D4 licznik samoleczenia >= 3', heals >= 3, heals);
    // Samoleczenie na starcie tury (bez klikania): nowa sierota, koniec tury, brak sierot.
    const hex2 = await page.evaluate(() => {
      const d = window.__frozenTestDebug;
      const h = d.freeLandHex();
      d.spawn(h.q, h.r, 2, { garnizon: true, ruchLeft: 0 });
      return h;
    });
    await page.evaluate(() => window.__eraTestDebug.endTurn());
    for (let i = 0; i < 120; i++) {
      await page.waitForTimeout(1000);
      if (!(await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress()))) break;
    }
    const after2 = await page.evaluate(([q, r]) => window.__frozenTestDebug.unitsAt(q, r), [hex2.q, hex2.r]);
    ok('D5 start tury: sieroty naprawione bez klikania', after2.length >= 2 && after2.every(u => !u.inGarnizon), after2);
    ok('D6 zero bledow strony', errors.length === 0, errors.slice(0, 3));
  } finally {
    await browser.close();
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

main().catch((e) => { console.error(e); process.exit(2); });
