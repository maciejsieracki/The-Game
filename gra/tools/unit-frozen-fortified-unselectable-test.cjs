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
 *  A-merge (runda 2, ta sama funkcja unitChecks => mutacje je lamia): LACZENIE zamrozonej
 *     jednostki (garnizon-sierota / fortyfikacja w polu) z duza armia, na PRAWDZIWYCH funkcjach
 *     normalizeMergedFortify + syncStackRuchLeft + visibleStackOnHex + exit*: armia wybieralna,
 *     bez blokady, pula ruchu > 0, odfortyfikowanie jednym ruchem calego stosu, split.
 *  D. ZYWA (Chromium, bundle w /dev/shm): realny klik w osierocony garnizon, laczenie przez
 *     REALNY panel `Polacz armie` (sierota i fortyfikacja w polu + duza armia), przycisk
 *     fortyfikacji calego stosu, rozdzielenie, hover, zero pageerror/console.error.
 *     Flaga `--no-live` pomija.
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

  // ---- A-MERGE (runda 2): laczenie zamrozonej jednostki z duza armia, prawdziwe funkcje ----
  if (typeof M.normalizeMergedFortify !== 'function') { chk('A8 normalizeMergedFortify istnieje', false); return bad + 1; }
  const doMerge = (all, garn, cityHere) => {
    M.normalizeMergedFortify(all, garn, cityHere);
    M.assignSharedStackGroupId(all);
    M.syncStackRuchLeft(all);
  };
  const bigArmy = (q, r, n, extra) => { const a = []; for (let i = 0; i < n; i++) a.push(mk('b' + q + '_' + i, q, r, extra)); return a; };

  // A8: sierota (garnizon poza miastem, ruch 0) + duza armia 26 -> po scaleniu wszyscy wybieralni.
  {
    const army = bigArmy(30, 30, 26);
    const o = mk('orph', 30, 30, { inGarnizon: true, fortifyRuchSnapshot: 2, ruchLeft: 0 });
    const all = [...army, o];
    doMerge(all, true /* preferGarnizon z calej armii */, M.hasOwnCityAt([city], 30, 30, 0));
    chk('A8 merge sierota+26: nikt nie jest inGarnizon', all.every(u => u.inGarnizon !== true));
    chk('A8b merge sierota+26: klik wybiera armie', M.unitAtRepresentative(30, 30, all, atk) !== null);
    chk('A8c merge sierota+26: stos widoczny 27 (split/ruch widza wszystkich)', M.visibleStackOnHex(all, 30, 30, 0).length === 27);
    chk('A8d merge sierota+26: pula ruchu > 0 (ruszalna)', M.stackRuchLeft(all) > 0 && all.every(u => u.ruchLeft === M.stackRuchLeft(all)), M.stackRuchLeft(all));
  }
  // A9: fortyfikacja W POLU (ruch 0, snapshot 2) + duza armia (ruch 2) -> armia NIE jest zamrozona.
  {
    const army = bigArmy(31, 31, 26);
    const fz = mk('fld', 31, 31, { ufortyfikowanyWPolu: true, fortifyRuchSnapshot: 2, ruchLeft: 0 });
    const all = [...army, fz];
    // REPRO bledu bez normalizacji: sync=MIN -> cala armia 0, a zdjecie fortyfikacji nie pomaga.
    const raw = JSON.parse(JSON.stringify(all));
    M.syncStackRuchLeft(raw);
    for (const u of raw) M.exitFieldFortify(u);
    chk('A9 REPRO bez normalizacji: pula=0 nawet po zdjeciu fortyfikacji (zamrozenie)', M.stackRuchLeft(raw) === 0, M.stackRuchLeft(raw));
    doMerge(all, false, false);
    chk('A9b merge pole+26: nikt nie ufortyfikowany w polu', all.every(u => u.ufortyfikowanyWPolu !== true));
    chk('A9c merge pole+26: pula ruchu > 0', M.stackRuchLeft(all) > 0 && all.every(u => u.ruchLeft > 0), all.map(u => u.ruchLeft).slice(0, 3));
    chk('A9d merge pole+26: snapshot skasowany, wybieralna, split widzi 27',
      all.every(u => u.fortifyRuchSnapshot === undefined) && M.unitAtRepresentative(31, 31, all, atk) !== null
        && M.visibleStackOnHex(all, 31, 31, 0).length === 27);
  }
  // A10: ponowne "Ufortyfikuj" calego stosu z jedna jednostka juz ufortyfikowana -> zdjecie NIE zamraza.
  {
    const st = [mk('x1', 32, 32), mk('x2', 32, 32), mk('x3', 32, 32, { ufortyfikowanyWPolu: true, fortifyRuchSnapshot: 2, ruchLeft: 0 })];
    for (const u of st) M.enterFieldFortify(u);
    chk('A10 re-fortify nie nadpisuje snapshotu zerem', st[2].fortifyRuchSnapshot === 2, st[2].fortifyRuchSnapshot);
    for (const u of st) M.exitFieldFortify(u);
    chk('A10b po zdjeciu fortyfikacji calego stosu kazdy ma ruch > 0',
      st.every(u => u.ruchLeft > 0 && u.ufortyfikowanyWPolu === false), st.map(u => u.ruchLeft));
  }
  // A11: legalny garnizon we WLASNYM miescie przy laczeniu zostaje (wszyscy w garnizonie).
  {
    const inC = [mk('c1', 5, 5, { inGarnizon: true, fortifyRuchSnapshot: 2, ruchLeft: 0 }), mk('c2', 5, 5, { inGarnizon: true, fortifyRuchSnapshot: 2, ruchLeft: 0 })];
    const arr = [mk('c3', 5, 5), mk('c4', 5, 5, { ufortyfikowanyWPolu: true, fortifyRuchSnapshot: 2, ruchLeft: 0 })];
    const all = [...inC, ...arr];
    doMerge(all, true, M.hasOwnCityAt([city], 5, 5, 0));
    chk('A11 merge w WLASNYM miescie: wszyscy w garnizonie, bez fortyfikacji w polu',
      all.every(u => u.inGarnizon === true && u.ufortyfikowanyWPolu !== true));
  }
  // A12: jednostka oblegajaca zachowuje fortyfikacje w polu przy laczeniu (legalny stan).
  {
    const sg = mk('sg', 6, 6, { ufortyfikowanyWPolu: true, fortifyRuchSnapshot: 2, ruchLeft: 0, oblegaCityId: 'c9' });
    M.normalizeMergedFortify([sg, mk('sg2', 6, 6)], false, false);
    chk('A12 oblegajaca zachowuje fortyfikacje w polu', sg.ufortyfikowanyWPolu === true && sg.fortifyRuchSnapshot === 2);
  }
  // A13: merge nie dotyka stanow, gdy nic nie jest zamrozone (idempotencja / brak regresji).
  {
    const all = bigArmy(33, 33, 5);
    chk('A13 merge zwyklych: 0 zmian', M.normalizeMergedFortify(all, false, false) === 0);
  }
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
  has('C5 merge (panel) wola normalizeMergedFortify z warunkiem wlasnego miasta',
    /const cityHereMerge = hasOwnCityAt\(cities, srcQ, srcR, active\.ownerId\);\s*const preferGarnizon = all\.some\(x => x\.inGarnizon === true\) && cityHereMerge;\s*normalizeMergedFortify\(all, preferGarnizon, cityHereMerge\);/);
  has('C6 merge (ruch na heks) wola normalizeMergedFortify z garnizonMode + wlasne miasto',
    /garnizonMode = existing\.every\(x => x\.inGarnizon === true\);[\s\S]{0,500}normalizeMergedFortify\(onHex, garnizonMode && hasOwnCityAt\(/);
  has('C10 przycisk fortyfikacji: stan i akcja na poziomie CALEGO stosu',
    /isFieldFortified = stack\.some\(su => su\.ufortyfikowanyWPolu === true\)/);
  has('C10b handler fortify zdejmuje fortyfikacje dla calego stosu (stack.some)',
    /if \(playerStackAt\(u\)\.some\(su => su\.ufortyfikowanyWPolu === true\)\) \{\s*const fieldStack = playerStackAt\(u\);\s*for \(const su of fieldStack\) exitFieldFortify\(su\);/);
  has('C11 hover leczy (raz na zmiane heksu)', /healInconsistentUnits\('hover'\)/);
  has('C12 hak __frozenTestDebug tylko przy ?civTest=1', /if \(isCivTestEnabled\(window\.location\.search\)\) \(window as any\)\.__frozenTestDebug = \{/);
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
    ['M7 merge nie zdejmuje fortyfikacji w polu', 'if (!u.oblegaCityId && u.ufortyfikowanyWPolu === true && exitFieldFortify(u)) changed += 1;', 'void 0;'],
    ['M8 re-fortify nadpisuje snapshot', 'if (u.ufortyfikowanyWPolu !== true || u.fortifyRuchSnapshot === undefined) {\n    u.fortifyRuchSnapshot = u.ruchLeft;\n  }', 'u.fortifyRuchSnapshot = u.ruchLeft;'],
    ['M9 merge nie zdejmuje garnizonu-sieroty', 'if (!cityHere && exitGarnizon(u)) changed += 1;', 'void 0;'],
    ['M10 merge zdejmuje tez fortyfikacje oblegajacych', 'if (!u.oblegaCityId && u.ufortyfikowanyWPolu === true && exitFieldFortify(u))', 'if (u.ufortyfikowanyWPolu === true && exitFieldFortify(u))'],
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
  // LIVE_RED=1: RED warstwy D -- bundle z WYLACZONA normalizacja laczenia (normalizeMergedFortify=no-op,
  // enterFieldFortify nieidempotentne); plik zawsze przywracany (try/finally).
  const origMerge = fs.readFileSync(MERGE_SRC, 'utf8');
  if (process.env.LIVE_RED === '1') {
    const red = origMerge.replace('  let changed = 0;\n  for (const u of all) {\n    if (garnizon && cityHere) {', '  let changed = 0;\n  if (all.length >= 0) return 0;\n  for (const u of all) {\n    if (garnizon && cityHere) {');
    if (red === origMerge) { ok('D0r wzorzec LIVE_RED znaleziony', false); return; }
    fs.writeFileSync(MERGE_SRC, red, 'utf8');
  }
  try {
    execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${outDir} --emptyOutDir`, { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  } catch (e) {
    fs.writeFileSync(MERGE_SRC, origMerge, 'utf8');
    ok('D0 build bundla', false, String(e.message).slice(0, 200));
    return;
  }
  fs.writeFileSync(MERGE_SRC, origMerge, 'utf8');
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
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

    // ---- Runda 2: REALNE laczenie przez panel, przycisk fortyfikacji stosu, split, hover ----
    const D = (fn, arg) => page.evaluate(fn, arg);
    // Po D5 (koniec tury w pustej piaskownicy) gra pokazuje ekran zwyciestwa (.vsc-*), ktory
    // przechwytuje wskaznik -- zdejmij go, by dalsze kliki/hover szly w mape (jak u gracza).
    await D(() => { document.querySelector('.vsc-stage')?.parentElement?.remove(); });
    const settle = (ms) => page.waitForTimeout(ms || 500);
    const clickMergeBtn = async () => {
      await page.waitForSelector('.civ-amp-overlay [data-act="merge"]', { timeout: 8000 });
      // Klik DOM w przycisk panelu (ta sama obsluga click co mysz).
      await page.$eval('.civ-amp-overlay [data-act="merge"]', (el) => el.click());
      await settle(600);
    };
    // D7: duza armia (20) + SIEROTA-garnizon (bez heal po drodze) -> REALNY panel "Polacz armie".
    const h7 = await D(() => window.__frozenTestDebug.freeLandHex());
    const army7 = await D(([q, r]) => { const d = window.__frozenTestDebug; const ids = d.spawn(q, r, 20, { group: 'gA' }); d.focus(q, r); return ids; }, [h7.q, h7.r]);
    await settle(700);
    await D((id) => window.__frozenTestDebug.select(id), army7[0]);
    const orph7 = await D(([q, r]) => window.__frozenTestDebug.spawn(q, r, 1, { garnizon: true, ruchLeft: 0, group: 'gB' }), [h7.q, h7.r]);
    const mid7 = await D(([q, r]) => window.__frozenTestDebug.unitsAt(q, r), [h7.q, h7.r]);
    ok('D7 scenariusz: 20 zwyklych + 1 sierota inGarnizon (przed scaleniem)', mid7.length === 21 && mid7.filter(u => u.inGarnizon).length === 1, mid7.length);
    await D(() => window.__frozenTestDebug.openMerge());
    await clickMergeBtn();
    const aft7 = await D(([q, r]) => window.__frozenTestDebug.unitsAt(q, r), [h7.q, h7.r]);
    ok('D7b po scaleniu: 21 jednostek, NIKT nie jest inGarnizon (blokada nie zarazila armii)',
      aft7.length === 21 && aft7.every(u => !u.inGarnizon), aft7.filter(u => u.inGarnizon).length);
    ok('D7c po scaleniu: kazda jednostka ma ruch > 0', aft7.every(u => u.ruchLeft > 0), aft7.map(u => u.ruchLeft).slice(0, 3));
    const info7 = await D((id) => window.__frozenTestDebug.stackInfo(id), army7[0]);
    ok('D7d stos = 21 (jedna armia), pula ruchu > 0', info7 && info7.size === 21 && info7.pool > 0, info7);
    const pos7 = await D(([q, r]) => window.__frozenTestDebug.screenOf(q, r), [h7.q, h7.r]);
    await D(() => window.__frozenTestDebug.select('__none__'));
    await page.mouse.click(pos7.x, pos7.y);
    await settle(600);
    const sel7 = await D(() => window.__frozenTestDebug.selectedId());
    ok('D7e REALNY KLIK w scalona armie ja wybiera', sel7 !== null && (army7.includes(sel7) || orph7.includes(sel7)), sel7);
    // D8: przycisk fortyfikacji dziala na CALY stos (wlacz / wylacz), po wylaczeniu pula > 0.
    await D(() => window.__frozenTestDebug.hudAction('fortify'));
    await settle(400);
    const f1 = await D((id) => window.__frozenTestDebug.stackInfo(id), army7[0]);
    ok('D8 przycisk Ufortyfikuj: caly stos ufortyfikowany w polu', f1 && f1.allField === true, f1);
    await D(() => window.__frozenTestDebug.hudAction('fortify'));
    await settle(400);
    const f2 = await D((id) => window.__frozenTestDebug.stackInfo(id), army7[0]);
    ok('D8b przycisk Zdejmij fortyfikacje: nikt nie ufortyfikowany, pula ruchu > 0 (odfortyfikowanie jednym przyciskiem)',
      f2 && f2.anyField === false && f2.pool > 0, f2);
    // D9: REALNE rozdzielenie scalonej armii (panel Rozdziel): 2 jednostki na wolny heks obok.
    await D(() => window.__frozenTestDebug.openSplit());
    await page.waitForSelector('.civ-asp-overlay input[data-uid]', { timeout: 8000 });
    const nInputs = await page.locator('.civ-asp-overlay input[data-uid]').count();
    ok('D9 panel Rozdziel widzi wszystkie 21 jednostek', nInputs === 21, nInputs);
    await page.$$eval('.civ-asp-overlay input[data-uid]', (els) => { els[0].click(); els[1].click(); });
    const destSel = page.locator('.civ-asp-overlay .civ-asp-dest').first();
    const dq = Number(await destSel.getAttribute('data-dq')); const dr = Number(await destSel.getAttribute('data-dr'));
    await page.$eval('.civ-asp-overlay .civ-asp-dest', (el) => el.click());
    await page.$eval('.civ-asp-overlay [data-go]', (el) => el.click());
    await settle(700);
    const atDest = await D(([q, r]) => window.__frozenTestDebug.unitsAt(q, r), [dq, dr]);
    const atSrc = await D(([q, r]) => window.__frozenTestDebug.unitsAt(q, r), [h7.q, h7.r]);
    ok('D9b po rozdzieleniu: >=2 na celu, razem 21, nikt nie zamrozony',
      atDest.length >= 2 && atDest.length + atSrc.length === 21 && atDest.concat(atSrc).every(u => !u.inGarnizon), { dest: atDest.length, src: atSrc.length });
    // D10: fortyfikacja W POLU (1 jednostka, ruch 0) + duza armia (19) -> REALNE scalenie -> armia ruszalna.
    const h10 = await D(() => window.__frozenTestDebug.freeLandHex());
    const army10 = await D(([q, r]) => { const d = window.__frozenTestDebug; const ids = d.spawn(q, r, 19, { group: 'gC' }); d.focus(q, r); return ids; }, [h10.q, h10.r]);
    await settle(600);
    await D((id) => window.__frozenTestDebug.select(id), army10[0]);
    await D(([q, r]) => window.__frozenTestDebug.spawn(q, r, 1, { field: true, ruchLeft: 0, group: 'gD' }), [h10.q, h10.r]);
    await D(() => window.__frozenTestDebug.openMerge());
    await clickMergeBtn();
    const aft10 = await D(([q, r]) => window.__frozenTestDebug.unitsAt(q, r), [h10.q, h10.r]);
    ok('D10 po scaleniu pole+19: 20 jednostek, nikt ufortyfikowany, kazda z ruchem > 0',
      aft10.length === 20 && aft10.every(u => !u.field && u.ruchLeft > 0), aft10.filter(u => u.field || u.ruchLeft <= 0).length);
    const info10 = await D((id) => window.__frozenTestDebug.stackInfo(id), army10[0]);
    ok('D10b stos 20, pula ruchu > 0, bez fortyfikacji', info10 && info10.size === 20 && info10.pool > 0 && !info10.anyField, info10);
    // D11: HOVER nad osierocona jednostka -- leczy, brak bledow strony/konsoli.
    const h11 = await D(() => window.__frozenTestDebug.freeLandHex());
    await D(([q, r]) => { const d = window.__frozenTestDebug; d.spawn(q, r, 2, { garnizon: true, ruchLeft: 0 }); d.focus(q, r); }, [h11.q, h11.r]);
    await settle(1800);
    const healBefore = await D(() => window.__frozenTestDebug.healCount());
    const pos11 = await D(([q, r]) => window.__frozenTestDebug.screenOf(q, r), [h11.q, h11.r]);
    await page.mouse.move(pos11.x - 40, pos11.y - 40);
    await page.mouse.move(pos11.x, pos11.y, { steps: 6 });
    await settle(700);
    const u11 = await D(([q, r]) => window.__frozenTestDebug.unitsAt(q, r), [h11.q, h11.r]);
    const healAfter = await D(() => window.__frozenTestDebug.healCount());
    const topEl = await D(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.tagName + '.' + e.className : null; }, [pos11.x, pos11.y]);
    ok('D11 hover leczy osierocona jednostke (licznik rosnie, flaga zdjeta)', healAfter > healBefore && u11.every(u => !u.inGarnizon), { healBefore, healAfter, topEl, pos11 });

    ok('D12 zero pageerror/console.error (klik, merge, fortyfikacja, split, hover, start tury)', errors.length === 0, errors.slice(0, 3));
  } finally {
    await browser.close();
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

main().catch((e) => { console.error(e); process.exit(2); });
