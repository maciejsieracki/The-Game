'use strict';
/**
 * ai-siege-requires-war-test.cjs — R-WEB-AI-SIEGE-WITHOUT-WAR-Q1.
 * Oblężenie / szturm miasta TYLKO w stanie wojny między stronami.
 * Prawdziwe funkcje: diplomacy-siege-war-gate.ts (+ mapSiegeDetect.ts, barbarians.ts).
 * Mutacja: podmiana bramki na `return true` MUSI złamać test.
 * Run from gra/:  node tools/ai-siege-requires-war-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const WORK = fs.mkdtempSync(path.join(fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir(), 'siege-war-'));

function bundle(gateSrcPath, tag) {
  const entry = path.join(WORK, `entry-${tag}.ts`);
  fs.writeFileSync(entry, `
export * from ${JSON.stringify(gateSrcPath.replace(/\.ts$/, ''))};
export { detectAutoSiegeOnCity } from ${JSON.stringify(GRA + '/src/game/mapSiegeDetect')};
export { BARBARIAN_OWNER_ID } from ${JSON.stringify(GRA + '/src/game/barbarians')};
`, 'utf8');
  const out = path.join(WORK, `bundle-${tag}.cjs`);
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out,
    absWorkingDir: GRA, logLevel: 'silent',
  });
  return require(out);
}

const GATE_SRC = path.join(GRA, 'src', 'game', 'diplomacy-siege-war-gate.ts');

function runSuite(M, label, quiet) {
  let ok = 0, fail = 0;
  const assert = (c, msg) => {
    if (c) { ok++; if (!quiet) console.log('  [OK]', msg); }
    else { fail++; if (!quiet) console.error('  [FAIL]', msg); }
  };
  const BARB = M.BARBARIAN_OWNER_ID;
  // Relacje: 'a_b' (a<b) -> status. Stub dokładnie jak areEnemyOwners w main.ts.
  const rel = new Map();
  const key = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
  const areEnemies = (a, b) => {
    if (a === b) return false;
    if (a === BARB || b === BARB) return true;
    return (rel.get(key(a, b)) || 'neutralni') === 'wojna';
  };

  const city = { id: 'delfy', ownerId: 0, q: 0, r: 0, name: 'Delfy', maMur: true, population: 4 };
  // ~12 stosów AI (owner 3) dookoła miasta gracza
  const ring = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  const aiUnits = ring.map(([q, r], i) => ({ id: 'ai' + i, ownerId: 3, typeId: 'Hastati', q, r, ruchLeft: 2 }));
  const playerUnit = { id: 'p0', ownerId: 0, typeId: 'Hastati', q: 0, r: 0, ruchLeft: 2 };
  const units = [playerUnit, ...aiUnits];

  // --- 1. BEZ WOJNY: brak oblężenia i brak ataku ---
  for (const st of ['neutralni', 'pokoj', 'rozejm', 'nap', 'sojusz']) {
    rel.set(key(0, 3), st);
    assert(M.detectWarAutoSiegeOnCity(city, units, areEnemies) === null, `status=${st}: brak auto-oblężenia`);
    assert(M.siegeAllowedBetween(3, 0, areEnemies) === false, `status=${st}: siegeAllowedBetween=false (AI->gracz)`);
    assert(M.siegeAllowedBetween(0, 3, areEnemies) === false, `status=${st}: siegeAllowedBetween=false (gracz->AI)`);
    assert(M.enemyUnitsAdjacentToCity(city, units, areEnemies).length === 0, `status=${st}: brak wrogich stosów przy murze`);
  }
  // Dowód błędu historycznego: stara detekcja zakłada oblężenie bez względu na wojnę.
  rel.set(key(0, 3), 'pokoj');
  const legacy = M.detectAutoSiegeOnCity(city, units);
  assert(legacy !== null && legacy.tryb === 'oblezenie', 'REGRESJA-DOWÓD: legacy detectAutoSiegeOnCity zakłada oblężenie w pokoju (bug źródłowy)');

  // --- 2. Z WOJNĄ: oblężenie działa ---
  rel.set(key(0, 3), 'wojna');
  const ctx = M.detectWarAutoSiegeOnCity(city, units, areEnemies);
  assert(ctx !== null && ctx.tryb === 'oblezenie' && ctx.oblegajacyOwnerId === 3, 'wojna: auto-oblężenie zakładane przez właściciela 3');
  assert(M.siegeAllowedBetween(3, 0, areEnemies) === true, 'wojna: siegeAllowedBetween=true');
  assert(M.isSiegeStillValid(city, 3, units, areEnemies) === true, 'wojna + stos przy murze: oblężenie ważne');
  assert(M.isSiegeStillValid(city, 3, [playerUnit], areEnemies) === false, 'wojna, brak stosu przy murze: oblężenie nieważne');

  // --- 3. Pokój po wojnie: oblężenie zdjęte ---
  rel.set(key(0, 3), 'pokoj');
  assert(M.isSiegeStillValid(city, 3, units, areEnemies) === false, 'po pokoju: oblężenie (stos nadal przy murze) NIE jest ważne');
  rel.set(key(0, 3), 'wojna');
  rel.set(key(0, 3), 'neutralni');
  assert(M.isSiegeStillValid(city, 3, units, areEnemies) === false, 'po zakończeniu wojny (neutralni): oblężenie nieważne');

  // --- 4. Mieszany: tylko wrogi stos zakłada oblężenie, nie neutralny sąsiad ---
  rel.set(key(0, 3), 'pokoj');
  rel.set(key(0, 4), 'wojna');
  const mixed = [playerUnit, aiUnits[0], { id: 'e4', ownerId: 4, typeId: 'Hastati', q: 0, r: 1, ruchLeft: 2 }];
  const ctxMixed = M.detectWarAutoSiegeOnCity(city, mixed, areEnemies);
  assert(ctxMixed !== null && ctxMixed.oblegajacyOwnerId === 4, 'mieszany: kotwicą jest wróg (4), nie neutralny (3)');
  rel.delete(key(0, 4));

  // --- 5. Barbarzyńcy: z definicji w wojnie (bez wpisu relacji) ---
  const barbUnit = { id: 'b0', ownerId: BARB, typeId: 'Hastati', q: 1, r: 0, ruchLeft: 2 };
  const ctxB = M.detectWarAutoSiegeOnCity(city, [playerUnit, barbUnit], areEnemies);
  assert(ctxB !== null && ctxB.oblegajacyOwnerId === BARB, 'barbarzyńcy oblegają bez wpisanej relacji');
  assert(M.siegeAllowedBetween(BARB, 0, areEnemies) === true, 'barbarzyńcy: siegeAllowedBetween=true');

  // --- 6. Wojna wymuszona / państwo-miasto = relacja 'wojna' w tej samej mapie ---
  const csCity = { id: 'cs', ownerId: 7, q: 5, r: 5, name: 'Miasto-Państwo', maMur: true, population: 3 };
  const forcedAtk = { id: 'f0', ownerId: 2, typeId: 'Hastati', q: 5, r: 6, ruchLeft: 2 };
  rel.set(key(2, 7), 'wojna'); // wojna wymuszona / wojna państwa-miasta
  const ctxF = M.detectWarAutoSiegeOnCity(csCity, [forcedAtk], areEnemies);
  assert(ctxF !== null && ctxF.oblegajacyOwnerId === 2, 'wojna wymuszona/państwo-miasto (status wojna): oblężenie działa');
  rel.set(key(2, 7), 'pokoj');
  assert(M.detectWarAutoSiegeOnCity(csCity, [forcedAtk], areEnemies) === null, 'ta sama para po pokoju: brak oblężenia');

  // --- 7. Własne miasto / brak muru ---
  assert(M.siegeAllowedBetween(0, 0, areEnemies) === false, 'własne miasto: brak oblężenia');
  rel.set(key(0, 3), 'wojna');
  assert(M.detectWarAutoSiegeOnCity({ ...city, maMur: false }, units, areEnemies) === null, 'bez muru: detekcja oblężenia = null (bez zmiany reguły)');

  return { ok, fail };
}

// Strażnik main.ts: bramka faktycznie podpięta w punktach ustanawiania/zdejmowania oblężenia.
function mainGuard() {
  const src = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
  let ok = 0, fail = 0;
  const has = (re, msg) => { if (re.test(src)) { ok++; console.log('  [OK]', msg); } else { fail++; console.error('  [FAIL]', msg); } };
  const body = (name) => {
    const i = src.indexOf('function ' + name);
    return i < 0 ? '' : src.slice(i, i + 3500);
  };
  const inFn = (name, re, msg) => {
    if (re.test(body(name))) { ok++; console.log('  [OK]', msg); } else { fail++; console.error('  [FAIL]', msg); }
  };
  inFn('startMapSiege', /siegeAllowedBetween\([^)]*areEnemyOwners/, 'main.ts startMapSiege: bramka wojny');
  inFn('validateActiveSieges', /siegeAllowedBetween\([^)]*areEnemyOwners/, 'main.ts validateActiveSieges: zdejmuje oblężenie bez wojny');
  inFn('validateActiveSieges', /isSiegeStillValid\(/, 'main.ts validateActiveSieges: isSiegeStillValid');
  inFn('scanAutoSiegesAfterAiTurn', /detectWarAutoSiegeOnCity\([^)]*areEnemyOwners/, 'main.ts scanAutoSiegesAfterAiTurn: detekcja z bramką wojny');
  inFn('executeSilentSiegeStorm', /siegeAllowedBetween\([^)]*areEnemyOwners/, 'main.ts executeSilentSiegeStorm: bramka wojny');
  inFn('offerCityAttackChoice', /siegeAllowedBetween\([^)]*areEnemyOwners/, 'main.ts offerCityAttackChoice: bramka wojny');
  inFn('refreshSiegeMarkers', /siegeAllowedBetween\([^)]*areEnemyOwners/, 'main.ts refreshSiegeMarkers: obóz tylko z wrogich jednostek');
  has(/migracja starych zapisów[^\n]*\n\s*validateActiveSieges\(\)/, 'main.ts load: migracja zdejmuje oblężenia bez wojny');
  return { ok, fail };
}

console.log('ai-siege-requires-war-test');
console.log('[real]');
const real = runSuite(bundle(GATE_SRC, 'real'), 'real', false);
console.log('[main.ts guard]');
const guard = mainGuard();

// Mutacja: bramka zawsze przepuszcza -> suite MUSI zgłosić porażki.
console.log('[mutation: siegeAllowedBetween -> return true]');
const mutSrc = fs.readFileSync(GATE_SRC, 'utf8');
const MUT_LINE = 'return areEnemies(besiegerOwnerId, defenderOwnerId);';
let mutKilled = false;
if (!mutSrc.includes(MUT_LINE)) {
  console.error('  [FAIL] mutacja: nie znaleziono linii bramki');
} else {
  const mutPath = path.join(WORK, 'gate-mut.ts');
  // zachowaj względne importy -> absolutne
  const mutated = mutSrc.replace(MUT_LINE, 'return true;')
    .replace(/from '\.\/cities'/, `from ${JSON.stringify(GRA + '/src/game/cities')}`)
    .replace(/from '\.\.\/units\/setup'/g, `from ${JSON.stringify(GRA + '/src/units/setup')}`)
    .replace(/from '\.\/mapSiegeDetect'/, `from ${JSON.stringify(GRA + '/src/game/mapSiegeDetect')}`);
  fs.writeFileSync(mutPath, mutated, 'utf8');
  const mut = runSuite(bundle(mutPath, 'mut'), 'mut', true);
  mutKilled = mut.fail > 0;
  console.log(`  mutant: ${mut.fail} asercji padło (oczekiwane > 0)`);
  console.log(mutKilled ? '  [OK] mutacja zabita' : '  [FAIL] mutacja przeżyła');
}

fs.rmSync(WORK, { recursive: true, force: true });
const totalFail = real.fail + guard.fail + (mutKilled ? 0 : 1);
console.log(`--- ${real.ok + guard.ok} ok, ${totalFail} fail`);
process.exit(totalFail > 0 ? 1 : 0);
