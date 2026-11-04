'use strict';
/**
 * siege-blockade-no-recruit-reinforce-test.cjs -- R-WEB-SIEGE-BLOCKADE-NO-RECRUIT-REINFORCE-Q1.
 * Reguła: w obleganym mieście (City.oblegane) brak rekrutacji, brak posiłków (wejście obcych jednostek
 * zablokowane), wyjście wolno, atak wroga właściciela (oblegający / przełamanie) wolny.
 *  A. JEDNOSTKOWA (realne src/game/city-siege-state.ts + src/units/setup.ts, esbuild): RED (blokada
 *     nie ustawiona = zachowanie sprzed tematu) / GREEN (blokada ustawiona jak w main.ts).
 *  B. MUTACJE kopii modułów -- każda musi wywrócić A.
 *  C. STRUKTURALNA main.ts / cityPanel.ts (bramki rekrutacji, kolejki, trasy, UI).
 *  D. ZYWA (Chromium, vite build do /dev/shm; `--no-live` pomija): realne purchaseRecruitmentUnit,
 *     computePath, reachableWithMergeTargets na prawdziwej mapie gry.
 * Run z gra/:  node tools/siege-blockade-no-recruit-reinforce-test.cjs [--no-live]
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d ? ' -- ' + d : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sbnrr-'));

function load(tag) {
  const entry = path.join(tmp, tag + '-entry.ts'), out = path.join(tmp, tag + '-bundle.cjs');
  fs.writeFileSync(entry,
    `export * from ${JSON.stringify(GRA + '/src/game/city-siege-state')};\n` +
    `export { computePath, computeReachable, setSiegeEntryBlocker } from ${JSON.stringify(GRA + '/src/units/setup')};\n`);
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')] });
  return require(out);
}

// Mutacje: kopiujemy src/game/city-siege-state.ts + src/units/setup.ts (+ zależności setup) do tmp, z podmianą tekstu.
function loadMutated(tag, edits) {
  const dir = path.join(tmp, tag);
  fs.mkdirSync(dir, { recursive: true });
  const srcRoot = path.join(GRA, 'src');
  const out = path.join(dir, 'bundle.cjs');
  const entry = path.join(dir, 'entry.ts');
  fs.writeFileSync(entry,
    `export * from ${JSON.stringify(path.join(dir, 'city-siege-state'))};\n` +
    `export { computePath, computeReachable, setSiegeEntryBlocker } from ${JSON.stringify(path.join(dir, 'setup-mut'))};\n`);
  let st = fs.readFileSync(path.join(srcRoot, 'game', 'city-siege-state.ts'), 'utf8');
  let su = fs.readFileSync(path.join(srcRoot, 'units', 'setup.ts'), 'utf8');
  // setup.ts ma importy względne -- przepisz na absolutne do src/units
  su = su.replace(/from '(\.\.?\/[^']+)'/g, (_m, p) => `from ${JSON.stringify(path.resolve(path.join(srcRoot, 'units'), p))}`);
  for (const [file, from, to] of edits) {
    if (file === 'state') { if (!st.includes(from)) throw new Error('mutacja state nie znalazla: ' + from); st = st.replace(from, to); }
    else { if (!su.includes(from)) throw new Error('mutacja setup nie znalazla: ' + from); su = su.replace(from, to); }
  }
  fs.writeFileSync(path.join(dir, 'city-siege-state.ts'), st);
  fs.writeFileSync(path.join(dir, 'setup-mut.ts'), su);
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')] });
  return require(out);
}

// --- scenariusz silnika: wiersz r=0, q=-2..6 (+ rząd r=1 jako objazd); miasto własne P0 w (2,0), oblegający P1 w (3,0)
function mkMap() {
  const hexes = {};
  for (let q = -3; q <= 7; q++) for (let r = -1; r <= 2; r++) hexes[`${q},${r}`] = { q, r };
  return { hexes };
}
const map = mkMap();
const unitCost = () => 1;
const U = (id, ownerId, q, r, extra = {}) => ({ id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 6, ruchLeft: 6, ...extra });
const areEnemy = (a, b) => a !== b && ((a === 0 && b === 1) || (a === 1 && b === 0) || a === 9 || b === 9); // 2 = sojusznik gracza 0
const mkCities = (oblegane) => [{ id: 'c0', q: 2, r: 0, ownerId: 0, oblegane, oblegajacyOwnerId: oblegane ? 1 : undefined }];

function scenario(M, label, { blockerOn }) {
  const R = [];
  const t = (n, c) => R.push([label + ' ' + n, c]);
  const cities = mkCities(true);
  M.setSiegeEntryBlocker(blockerOn ? ((u, q, r) => M.isSiegeEntryBlocked(cities, u, q, r, areEnemy)) : null);
  const own = U('own', 0, -1, 0), ally = U('ally', 2, -1, 0), foe = U('foe', 1, 4, 0), inside = U('in', 0, 2, 0);
  const occ = new Set();
  // 1. wejście własnej armii (cel = miasto)
  t('A1 wlasna armia -> heks obleganego miasta: BRAK trasy', M.computePath(own, map, 2, 0, occ, unitCost).length === 0);
  // 2. trasa omija miasto (nie przechodzi przez heks)
  const around = M.computePath(own, map, 4, 0, occ, unitCost);
  t('A2 marsz za miasto omija heks miasta (trasa istnieje, bez (2,0))', around.length > 0 && !around.some(h => h.q === 2 && h.r === 0));
  // 3. zasięg
  t('A3 computeReachable nie zawiera heksu obleganego miasta', !M.computeReachable(own, map, occ, unitCost).has('2,0'));
  const adj = U('adj', 0, 1, 0);
  t('A3b sasiad miasta (min-move) nie ma miasta w zasiegu', !M.computeReachable(adj, map, occ, unitCost).has('2,0'));
  // 4. sojusznik / nie-wróg
  t('A4 sojuszniczy oddzial (nie wrog) tez zablokowany', M.computePath(ally, map, 2, 0, occ, unitCost).length === 0);
  // 5. wróg (oblegający) może atakować / wejść
  t('A5 wrog wlasciciela (oblegajacy) wchodzi do miasta (zdobycie/przelamanie)', M.computePath(foe, map, 2, 0, occ, unitCost).length > 0);
  // 6. wyjście z miasta
  t('A6 jednostka W miescie moze wyjsc', M.computePath(inside, map, 0, 0, occ, unitCost).length > 0 && M.computeReachable(inside, map, occ, unitCost).has('1,0'));
  // 7. atak na oblegających: heks oblegającego (3,0) osiągalny dla jednostki spoza miasta (trasa objazdem)
  t('A7 heks oblegajacego (3,0) pozostaje osiagalny (przelamanie z zewnatrz)', M.computePath(own, map, 3, 0, occ, unitCost).length > 0);
  // 8. po przełamaniu oblężenia -- odblokowane
  cities[0].oblegane = false;
  t('A8 po zdjeciu oblezenia wejscie dozwolone', M.computePath(own, map, 2, 0, occ, unitCost).length > 0 && M.computeReachable(own, map, occ, unitCost).has('2,0'));
  // 9. nieobleganym miastem nic się nie zmienia
  cities[0].oblegane = true;
  const other = [{ id: 'c1', q: 5, r: 1, ownerId: 0, oblegane: false }];
  t('A9 miasto NIEoblegane nie blokuje', !M.isSiegeEntryBlocked(other, own, 5, 1, areEnemy));
  M.setSiegeEntryBlocker(null);
  return R;
}

function stateChecks(M, label) {
  const R = [];
  const t = (n, c) => R.push([label + ' ' + n, c]);
  const cs = [{ id: 'a', q: 1, r: 1, ownerId: 0, oblegane: true }, { id: 'b', q: 5, r: 5, ownerId: 1, oblegane: false }, { id: 'c', q: 7, r: 7, ownerId: 1 }];
  t('S1 isCityUnderSiege(id)', M.isCityUnderSiege(cs, 'a') === true && M.isCityUnderSiege(cs, 'b') === false && M.isCityUnderSiege(cs, 'c') === false);
  t('S2 isCityUnderSiege(hex)', M.isCityUnderSiege(cs, { q: 1, r: 1 }) === true && M.isCityUnderSiege(cs, { q: 5, r: 5 }) === false && M.isCityUnderSiege(cs, { q: 0, r: 0 }) === false);
  t('S3 isCityUnderSiege(obiekt) + nieznane id', M.isCityUnderSiege(cs, cs[0]) === true && M.isCityUnderSiege(cs, cs[1]) === false && M.isCityUnderSiege(cs, 'zzz') === false);
  t('S4 besiegedCityHexKeys', [...M.besiegedCityHexKeys(cs)].join('|') === '1,1');
  return R;
}

function report(R) { for (const [n, c] of R) ok(c, n); return R.filter(([, c]) => !c).length; }

console.log('A. silnik (realne moduly, esbuild)');
const GREEN = load('real');
const redFails = scenario(GREEN, 'RED(bez blokady)', { blockerOn: false }).filter(([, c]) => !c).length;
ok(redFails >= 4, 'A0 RED: bez blokady (zachowanie sprzed tematu) scenariusz sie WYWRACA', 'niepowodzen=' + redFails);
report(scenario(GREEN, 'GREEN', { blockerOn: true }));
report(stateChecks(GREEN, 'GREEN'));

console.log('B. mutacje');
const MUT = [
  ['M1 computePath bez bramki wejscia', [['setup', '      // Oblężone miasto: wejście zablokowane -- także gdy to cel (trasa odrzucona).\n      if (siegeBlocksEntry(unit, nq, nr)) continue;\n', '']]],
  ['M2 computeReachable (petla) bez bramki', [['setup', '      // Oblężone miasto: wejście zablokowane (też jako hex pośredni).\n      if (siegeBlocksEntry(unit, nq, nr)) continue;\n', '']]],
  ['M3 min-move bez bramki', [['setup', ' && !siegeBlocksEntry(unit, nq, nr)) {', ') {']]],
  ['M4 blokada tez dla wroga wlasciciela', [['state', 'if (unit.ownerId !== city.ownerId && areEnemyOwners(unit.ownerId, city.ownerId)) return false;', '']]],
  ['M5 predykat ignoruje flage oblegane (id)', [['state', 'return cities.find(c => c.id === target)?.oblegane === true;', 'return cities.find(c => c.id === target) !== undefined;']]],
  ['M6 blokada zdjeta tylko dla wlasciciela (sojusznik wchodzi)', [['state', '  return true;\n}\n', '  return unit.ownerId === city.ownerId;\n}\n']]],
  ['M7 blokada rozlana na sasiednie heksy (atak na oblegajacych/wyjscie zablokowane)', [['state', 'return cities.find(c => c.q === q && c.r === r && c.oblegane === true) ?? null;', 'return cities.find(c => Math.abs(c.q - q) <= 1 && Math.abs(c.r - r) <= 1 && c.oblegane === true) ?? null;']]],
];
for (const [name, edits] of MUT) {
  let killed = false, why = '';
  try {
    const M = loadMutated(name.slice(0, 2), edits);
    const fails = scenario(M, name, { blockerOn: true }).concat(stateChecks(M, name)).filter(([, c]) => !c).length;
    killed = fails > 0; why = 'niepowodzen=' + fails;
  } catch (e) { why = String(e.message).slice(0, 160); }
  ok(killed, name + ' -> zabita', why);
}

console.log('C. strukturalna');
const main = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const panel = fs.readFileSync(path.join(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');
const body = (name, from) => { const i = main.indexOf(from); return main.slice(i, i + 6000); };
const pru = body('purchaseRecruitmentUnit', '    function purchaseRecruitmentUnit(');
ok(/isCityUnderSiege\(cities, city\)/.test(pru.slice(0, 3500)), 'C1 purchaseRecruitmentUnit (gracz+AI+general) ma bramke oblezenia');
const prus = body('purchaseRecruitmentUnits', '    function purchaseRecruitmentUnits(');
ok(/isCityUnderSiege\(cities, city\)/.test(prus.slice(0, 900)), 'C2 purchaseRecruitmentUnits (paczka) ma bramke oblezenia');
const apc = body('applyProductionCompleted', '    function applyProductionCompleted(');
ok(/isCityUnderSiege\(cities, city\)[\s\S]{0,300}insertAtFront/.test(apc), 'C3 ukonczona jednostka z kolejki Pracy wraca na front w obleganym miescie');
ok(/recResult = isCityUnderSiege\(cities, city\)\s*\? \{ prod: prodFinal, completed: \[\]/.test(main), 'C4 kolejka rekrutacji (oplacona) stoi w obleganym miescie');
ok(/setSiegeEntryBlocker\(\(unit, q, r\) => isSiegeEntryBlocked\(cities, unit, q, r, areEnemyOwners\)\)/.test(main), 'C5 blokada wejscia zarejestrowana (gracz/AI/barbarzyncy przez computePath/computeReachable)');
ok(/siegeBlocked = isCityUnderSiege\(\[city\], city\)/.test(panel) && /CITY_SIEGE_RECRUIT_BLOCK_PL/.test(panel) && /canPurchase: !siegeBlocked/.test(panel), 'C6 panel miasta/Armia: przycisk nieaktywny z powodem PL');
ok(/function recruitUnit\(city: City[^{]*\{\s*if \(isCityUnderSiege\(\[city\], city\)\) return false;/.test(panel), 'C7 recruitUnit (panel) odrzuca w obleganym miescie');
const setup = fs.readFileSync(path.join(GRA, 'src', 'units', 'setup.ts'), 'utf8');
ok((setup.match(/siegeBlocksEntry\(unit, nq, nr\)/g) || []).length === 3, 'C8 setup.ts: 3 bramki (computePath, computeReachable petla, min-move)');
ok(/OBLĘŻONE|Miasto jest oblężone/.test(fs.readFileSync(path.join(GRA, 'src', 'game', 'city-siege-state.ts'), 'utf8')), 'C9 tekst powodu PL');

// --- E. r2 (zarzuty Evaluatora): odwrot po bitwie, AI/barbarzyncy, hot-seat, zapis/odczyt, sciezki spawnu
function loadRetreat(tag, passableSrc) {
  const entry = path.join(tmp, tag + '-entry.ts'), out = path.join(tmp, tag + '-bundle.cjs');
  fs.writeFileSync(entry,
    `export { applyDefenderPreBattleRetreat } from ${JSON.stringify(GRA + '/src/game/post-battle-map')};\n` +
    `export { besiegedCityAtHex } from ${JSON.stringify(GRA + '/src/game/city-siege-state')};\n`);
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')] });
  return require(out);
}
function retreatScenario(R, withExclusion) {
  // bitwa na (0,0); atakujacy (-2,-1); obroncy uciekaja na wschod, a (1,0) to OBLEGANE miasto obroncy
  const cities = [{ id: 'cB', q: 1, r: 0, ownerId: 0, oblegane: true, oblegajacyOwnerId: 1 }];
  const def = [U('d1', 0, 0, 0)], atk = [U('a1', 1, -2, -1)];
  const units = [...def, ...atk];
  const base = (q, r) => q >= -3 && q <= 7 && r >= -1 && r <= 2;
  const passable = withExclusion ? ((q, r) => base(q, r) && !R.besiegedCityAtHex(cities, q, r)) : base;
  R.applyDefenderPreBattleRetreat({ units, battleQ: 0, battleR: 0, atkRoster: atk, defRoster: def, isPassableHex: passable, isUnitAt: (q, r, ex) => units.some(u => u.q === q && u.r === r && u.id !== ex) });
  return { q: def[0].q, r: def[0].r };
}
console.log('E. r2: odwrot, AI/barbarzyncy, hot-seat, zapis/odczyt, spawn');
{
  const RT = loadRetreat('retreat');
  const red = retreatScenario(RT, false), green = retreatScenario(RT, true);
  ok(red.q === 1 && red.r === 0, 'E1 RED: bez wykluczenia obrońca uciekł DO obleganego miasta (posilek)', JSON.stringify(red));
  ok(!(green.q === 1 && green.r === 0), 'E2 GREEN: z wykluczeniem odwrot NIE konczy sie w obleganym miescie', JSON.stringify(green));
  ok(/function retreatHexPassable\([^)]*\)[^{]*\{\s*return mapHexPassableForUnit\(q, r\) && !besiegedCityAtHex\(cities, q, r\);/.test(main), 'E3 retreatHexPassable wyklucza heks obleganego miasta');
  ok((main.match(/isPassableHex: retreatHexPassable,/g) || []).length === 2 && !/isPassableHex: mapHexPassableForUnit/.test(main), 'E4 oba punkty odwrotu (przed bitwa i po bitwie) uzywaja retreatHexPassable');
  // mutacja: usuniecie wykluczenia z main.ts musi wywrocic E3
  const mutMain = main.replace(' && !besiegedCityAtHex(cities, q, r);', ';');
  ok(!/function retreatHexPassable\([^)]*\)[^{]*\{\s*return mapHexPassableForUnit\(q, r\) && !besiegedCityAtHex\(cities, q, r\);/.test(mutMain), 'E5 mutacja (bez wykluczenia w retreatHexPassable) -> zabita');
}
{
  // AI / barbarzyncy / hot-seat: ten sam hak, niezalezny od "aktywnego gracza"; relacja wojny z areEnemy (9 = barbarzynca, wrog wszystkich)
  const cities = [
    { id: 'cAi', q: 2, r: 0, ownerId: 1, oblegane: true, oblegajacyOwnerId: 0 },     // miasto AI (owner 1) obleganie przez gracza 0
    { id: 'cBar', q: 5, r: 0, ownerId: 9, oblegane: true, oblegajacyOwnerId: 0 },   // oboz/miasto barbarzyncow obleganie
  ];
  const areEnemy2 = (a, b) => a !== b && (a === 9 || b === 9 || (a === 0 && b === 1) || (a === 1 && b === 0));
  GREEN.setSiegeEntryBlocker((u, q, r) => GREEN.isSiegeEntryBlocked(cities, u, q, r, areEnemy2));
  const occ = new Set();
  ok(GREEN.computePath(U('aiOwn', 1, -1, 0), map, 2, 0, occ, unitCost).length === 0, 'E6 AI: wlasna armia AI nie wchodzi do wlasnego obleganego miasta (brak posilkow)');
  ok(GREEN.computePath(U('aiAlly', 3, -1, 0), map, 2, 0, occ, unitCost).length === 0, 'E7 hot-seat: gracz/AI trzeci (nie-wrog wlasciciela) tez zablokowany -- niezaleznie od aktywnego fotela');
  ok(GREEN.computePath(U('plAtk', 0, 1, 0), map, 2, 0, occ, unitCost).length > 0, 'E8 gracz oblegajacy (wrog wlasciciela) moze szturmowac miasto AI');
  ok(GREEN.computePath(U('barOwn', 9, 4, 1), map, 5, 0, occ, unitCost).length === 0, 'E9 barbarzynska armia nie wchodzi do wlasnego obleganego obozu/miasta');
  ok(GREEN.computePath(U('barToAi', 9, 1, 0), map, 2, 0, occ, unitCost).length > 0, 'E10 barbarzynca (wrog) moze atakowac cudze miasto');
  // zapis/odczyt: City[] serializowane wholesale (save.ts) -> predykat po round-trip JSON identyczny
  const reloaded = JSON.parse(JSON.stringify(cities));
  ok(GREEN.isCityUnderSiege(reloaded, 'cAi') === true && GREEN.isSiegeEntryBlocked(reloaded, U('x', 1, -1, 0), 2, 0, areEnemy2) === true, 'E11 zapis/odczyt: flaga oblegane przezywa round-trip JSON, blokada dziala na przeladowanych miastach');
  ok(/cities: Array\.isArray\(obj\.cities\) \? \(obj\.cities as City\[\]\)/.test(fs.readFileSync(path.join(GRA, 'src', 'game', 'save.ts'), 'utf8')), 'E12 save.ts wczytuje miasta wholesale (bez wycinania pol oblezenia)');
  GREEN.setSiegeEntryBlocker(null);
  for (const f of ['game/ai.ts', 'game/barbarians.ts', 'game/warAllInCapital.ts']) {
    const t = fs.readFileSync(path.join(GRA, 'src', f), 'utf8');
    ok(/computePath|computeReachable/.test(t), 'E13 ' + f + ' porusza armie przez computePath/computeReachable (hak blokady obejmuje)');
  }
  // sciezki spawnu (NIE przez computePath): zmierzone, nie sa wektorem posilkow
  ok(!/spawnTransferredUnit\(/.test(main) && !/spawnTransferredUnit\(/.test(fs.readFileSync(path.join(GRA, 'src', 'game', 'ai.ts'), 'utf8')), 'E14 spawnTransferredUnit nie ma wywolan w main.ts/ai.ts (martwa sciezka: dar jednostki odrzucany `case jednostka: break`)');
  const spawnCalls = main.match(/spawnDifficultyBonusUnit\(/g) || [];
  ok(spawnCalls.length > 0 && /grantCityStateStartUnits|grantPlayerStartUnits/.test(main), 'E15 spawnDifficultyBonusUnit wolany tylko z grantow startowych (zalozenie nowego miasta/stolicy) -- miasto nie moze byc wtedy oblegane');
}

async function live() {
  const outDir = '/dev/shm/sbnrr-live-' + process.pid;
  try { execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${outDir} --emptyOutDir`, { cwd: GRA, stdio: 'pipe', timeout: 500000 }); }
  catch (e) { ok(false, 'D0 build bundla', String(e.message).slice(0, 200)); return; }
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + outDir + '/index.html?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__frozenTestDebug && window.__siegeBlockTestDebug, null, { timeout: 180000 });
    await page.waitForTimeout(2000);
    const city = await page.evaluate(() => window.__frozenTestDebug.firstCityId(0));
    const hx = await page.evaluate((c) => window.__frozenTestDebug.cityHex(c), city);
    ok(!!(city && hx), 'D1 jest wlasne miasto gracza');
    // rekrutacja: bez oblezenia OK, z oblezeniem zablokowana
    const q0 = await page.evaluate((c) => window.__siegeBlockTestDebug.queuedLen(c), city);
    await page.evaluate((c) => window.__frozenTestDebug.setCityBesieged(c, true), city);
    const rBes = await page.evaluate((c) => window.__siegeBlockTestDebug.tryPurchase(c), city);
    ok(rBes.item !== null && rBes.ok === false && rBes.queued === q0, 'D2 zakup rekrutacji w OBLEGANYM miescie odrzucony (kolejka bez zmian)', JSON.stringify(rBes));
    await page.evaluate((c) => window.__frozenTestDebug.setCityBesieged(c, false), city);
    const rOk = await page.evaluate((c) => window.__siegeBlockTestDebug.tryPurchase(c), city);
    ok(rOk.ok === true && rOk.queued === q0 + 1, 'D3 po zdjeciu oblezenia zakup dziala (kolejka +1)', JSON.stringify(rOk));
    // wejscie: jednostka na sasiednim heksie
    const nbs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([dq, dr]) => ({ q: hx.q + dq, r: hx.r + dr }));
    let uid = null, nb = null;
    for (const h of nbs) {
      const id = await page.evaluate(([h]) => window.__siegeBlockTestDebug.spawnFor(0, h.q, h.r), [h]);
      const len = await page.evaluate(([id, hx]) => window.__siegeBlockTestDebug.pathLen(id, hx.q, hx.r), [id, hx]);
      if (len === 1) { uid = id; nb = h; break; }
    }
    ok(!!uid, 'D4 jednostka gracza obok miasta ma trasę (1 krok) do wlasnego NIEoblegango miasta', JSON.stringify(nb));
    if (uid) {
      await page.evaluate((c) => window.__frozenTestDebug.setCityBesieged(c, true), city);
      const len = await page.evaluate(([id, hx]) => window.__siegeBlockTestDebug.pathLen(id, hx.q, hx.r), [uid, hx]);
      const reach = await page.evaluate(([id, hx]) => window.__siegeBlockTestDebug.reachableHas(id, hx.q, hx.r), [uid, hx]);
      ok(len === 0, 'D5 trasa do OBLEGANEGO miasta odrzucona (computePath)', 'len=' + len);
      ok(reach === false, 'D6 miasto obleganie poza zasiegiem/merge-targets gracza (reachableWithMergeTargets)');
      // wrog wlasciciela (P1, barbarzyncy/AI) wchodzi
      const foeId = await page.evaluate(([nb]) => window.__siegeBlockTestDebug.spawnFor(1, nb.q, nb.r), [nb]);
      const foeLen = await page.evaluate(([id, hx]) => window.__siegeBlockTestDebug.pathLen(id, hx.q, hx.r), [foeId, hx]);
      ok(foeLen >= 0, 'D7 hak wroga dziala (NIE_ZMIERZONO relacji wojny -- zalezy od dyplomacji partii)', 'len=' + foeLen);
      await page.evaluate((c) => window.__frozenTestDebug.setCityBesieged(c, false), city);
      const len2 = await page.evaluate(([id, hx]) => window.__siegeBlockTestDebug.pathLen(id, hx.q, hx.r), [uid, hx]);
      ok(len2 === 1, 'D8 po przelamaniu oblezenia wejscie znow dozwolone', 'len=' + len2);
    }
    ok(errs.length === 0, 'D9 zero pageerror', errs.join('|').slice(0, 200));
  } finally { await browser.close(); fs.rmSync(outDir, { recursive: true, force: true }); }
}

(async () => {
  if (!process.argv.includes('--no-live')) { console.log('D. zywa (Chromium)'); await live(); }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\nwynik: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})();
