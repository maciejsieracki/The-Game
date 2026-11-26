'use strict';
/**
 * building-demolish-test.cjs -- R-WEB-BUILDING-DEMOLISH-Q1 (odp. 22C właściciela, 2026-11-26).
 *
 * Kontrakt:
 *  (1) Zwrot = floor(połowa) surowców poniesionych (łańcuch awansów 1..N, przerwany przez upgradeSkip);
 *      Pieniądz i Praca nie wracają; budynek bez kosztu surowcowego (palac) nie daje zwrotu.
 *  (2) demolishBuilding usuwa wszystkie wpisy ID z builtByCity miasta, dopisuje zwrot do puli ownera
 *      (zapas surowców rośnie o zwrot), nie rusza innych miast ani innych budynków miasta.
 *  (3) Budynek nieistniejący / miasto nieistniejące -> removed=false, zero zmian stanu.
 *  (4) Mennica: wyburzenie dozwolone w stolicy i poza stolicą; po wyburzeniu wpis znika z builtByCity.
 *  (5) Mutacje czerwone: zwrot 100% / zwrot 0 / brak usunięcia wpisu -- test wykrywa (uruchom z env
 *      BUILDING_DEMOLISH_MUTANT=... nie jest potrzebne; mutacje robi się ręcznie na kopii, patrz raport).
 *
 * Run from gra/:  node tools/building-demolish-test.cjs
 * Bundluje src/game/building-demolish.ts z esbuild (jak mint-orphan-test.cjs).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[building-demolish-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.building-demolish-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.building-demolish-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { demolishBuilding, demolishRefundFor, paidStockCostForBuilding, refundFromPaidCost } from '../src/game/building-demolish';
export { ownersWithMennica, setOwnerCapitalCityResolver } from '../src/game/turn-economy';
`);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
    absWorkingDir: GRA,
  });
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
}

const lib = require(BUNDLE_FILE);
const { demolishBuilding, demolishRefundFor, paidStockCostForBuilding, refundFromPaidCost } = lib;
const { ownersWithMennica, setOwnerCapitalCityResolver } = lib;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function makeState() {
  return {
    cities: [
      { id: 'stolica', ownerId: 1, surowce: { drewno: 100, kamien: 40, cegla: 0 } },
      { id: 'prow', ownerId: 1, surowce: { drewno: 10, kamien: 0, cegla: 30 } },
      { id: 'obcy', ownerId: 2, surowce: { drewno: 999 } },
    ],
    builtByCity: new Map([
      ['stolica', ['mennica', 'stolarnia', 'mury_kamienne']],
      ['prow', ['mennica', 'targowisko']],
      ['obcy', ['stolarnia']],
    ]),
  };
}

function poolOf(state, ownerId) {
  const p = {};
  for (const c of state.cities) {
    if (c.ownerId !== ownerId || !c.surowce) continue;
    for (const [k, v] of Object.entries(c.surowce)) p[k] = (p[k] ?? 0) + v;
  }
  return p;
}

console.log('[1] Zwrot = floor(połowa) poniesionych surowców');
check('stolarnia (50 drewna) -> zwrot 25 drewna', eq(demolishRefundFor('stolarnia'), { drewno: 25 }), demolishRefundFor('stolarnia'));
check('targowisko (60 drewna) -> zwrot 30 drewna', eq(demolishRefundFor('targowisko'), { drewno: 30 }), demolishRefundFor('targowisko'));
check('mennica (160/160/160) -> zwrot 80/80/80', eq(demolishRefundFor('mennica'), { drewno: 80, kamien: 80, cegla: 80 }), demolishRefundFor('mennica'));
check('palac bez kosztu surowcowego -> zwrot pusty', eq(demolishRefundFor('palac'), {}), demolishRefundFor('palac'));
check('łańcuch kuznia -> kuznia_zelaza: suma poziomów, zwrot połowy (520/520/400 -> 260/260/200)',
  eq(demolishRefundFor('kuznia_zelaza'), { drewno: 260, kamien: 260, cegla: 200 }), demolishRefundFor('kuznia_zelaza'));

console.log('[2] Łańcuch awansów: poniesione = suma poziomów 1..N');
check('mury (poziom 2 z mury_kamienne) -> koszt poniesiony 320 drewna = 160 (mury) + 160 (mury_kamienne)',
  paidStockCostForBuilding('mury').drewno === 320, paidStockCostForBuilding('mury'));
check('mury -> zwrot 160 drewna', demolishRefundFor('mury').drewno === 160, demolishRefundFor('mury'));
check('mury_kamienne (przeskok, upgradeSkip) -> tylko własny koszt 160, bez palisady',
  paidStockCostForBuilding('mury_kamienne').drewno === 160, paidStockCostForBuilding('mury_kamienne'));

console.log('[3] demolishBuilding: usunięcie wpisów, zwrot do puli ownera');
{
  const st = makeState();
  const poolBefore = poolOf(st, 1);
  const res = demolishBuilding(st, 'stolica', 'stolarnia');
  check('wyburzenie istniejącego budynku -> removed=true', res.removed === true, res);
  check('zwrot = {drewno:25}', eq(res.refund, { drewno: 25 }), res.refund);
  check('stolarnia usunięta z listy stolicy', !st.builtByCity.get('stolica').includes('stolarnia'), st.builtByCity.get('stolica'));
  check('pozostałe budynki stolicy nietknięte (mennica, mury_kamienne)',
    eq(st.builtByCity.get('stolica'), ['mennica', 'mury_kamienne']), st.builtByCity.get('stolica'));
  const poolAfter = poolOf(st, 1);
  check('pula ownera 1 wzrosła dokładnie o zwrot (drewno +25)',
    poolAfter.drewno === poolBefore.drewno + 25 && poolAfter.kamien === poolBefore.kamien && (poolAfter.cegla ?? 0) === (poolBefore.cegla ?? 0),
    { before: poolBefore, after: poolAfter });
  check('cudzy owner 2 nietknięty', eq(st.builtByCity.get('obcy'), ['stolarnia']) && poolOf(st, 2).drewno === 999, st.builtByCity.get('obcy'));
}

console.log('[4] Nieistniejący budynek / miasto -> brak zmian');
{
  const st = makeState();
  const before = JSON.stringify([...st.builtByCity.entries()]) + JSON.stringify(st.cities);
  const r1 = demolishBuilding(st, 'stolica', 'kuznia');
  check('budynek, którego nie ma -> removed=false', r1.removed === false && eq(r1.refund, {}), r1);
  const r2 = demolishBuilding(st, 'nieistnieje', 'stolarnia');
  check('miasto, którego nie ma -> removed=false', r2.removed === false && eq(r2.refund, {}), r2);
  const after = JSON.stringify([...st.builtByCity.entries()]) + JSON.stringify(st.cities);
  check('stan miast i budynków bit-w-bit bez zmian', before === after);
}

console.log('[5] Mennica: wyburzenie w stolicy i poza stolicą');
{
  const st = makeState();
  const r = demolishBuilding(st, 'prow', 'mennica');
  check('Mennica poza stolicą -> wolno, removed=true', r.removed === true, r);
  check('Mennica poza stolicą -> zwrot 80/80/80', eq(r.refund, { drewno: 80, kamien: 80, cegla: 80 }), r.refund);
  check('Mennica usunięta z prow', !st.builtByCity.get('prow').includes('mennica'), st.builtByCity.get('prow'));
  const r2 = demolishBuilding(st, 'stolica', 'mennica');
  check('Mennica w stolicy -> wolno, removed=true', r2.removed === true && !st.builtByCity.get('stolica').includes('mennica'), r2);
  const r3 = demolishBuilding(st, 'stolica', 'mennica');
  check('druga Mennica w tym samym mieście już nie istnieje -> removed=false', r3.removed === false, r3);
}

console.log('[6] Wyburzenie wszystkich wpisów ID (duplikaty) -- zostaje reszta');
{
  const st = makeState();
  st.builtByCity.set('stolica', ['targowisko', 'stolarnia', 'targowisko']);
  const r = demolishBuilding(st, 'stolica', 'targowisko');
  check('oba wpisy targowiska usunięte, stolarnia zostaje',
    eq(st.builtByCity.get('stolica'), ['stolarnia']) && r.removed === true, st.builtByCity.get('stolica'));
}

console.log('[7] Mennica: bonus znika po wyburzeniu w stolicy (resolver stolicy bez zmian)');
{
  const st = makeState();
  setOwnerCapitalCityResolver((ownerId) => (ownerId === 1 ? 'stolica' : null));
  const before = ownersWithMennica(st.cities, st.builtByCity);
  check('przed wyburzeniem: właściciel 1 ma bonus Mennicy', before.has(1), [...before]);
  demolishBuilding(st, 'stolica', 'mennica');
  const after = ownersWithMennica(st.cities, st.builtByCity);
  check('po wyburzeniu Mennicy w stolicy: bonus znika', !after.has(1), [...after]);
  setOwnerCapitalCityResolver(null);
}

console.log('[8] Okablowanie: UI -> hook -> logika; AI nie wyburza');
{
  const rd = (f) => fs.readFileSync(path.resolve(GRA, f), 'utf8');
  const panel = rd('src/ui/cityPanel.ts');
  const main = rd('src/main.ts');
  check('cityPanel: przycisk „Wyburz” (bld-demolish-btn) z potwierdzeniem', panel.includes('bld-demolish-btn') && panel.includes('window.confirm(msg)'));
  check('cityPanel: podgląd zwrotu z logiki (demolishRefundFor)', panel.includes("from '../game/building-demolish'") && panel.includes('demolishRefundFor(def.id)'));
  check('cityPanel: CityPanelConfig.onDemolishBuilding wołany po potwierdzeniu', panel.includes('onDemolishBuilding?: (cityId: string, buildingId: string) => void') && panel.includes('cfg.onDemolishBuilding?.(city.id, def.id)'));
  const wires = main.split('onDemolishBuilding: (cityId: string, buildingId: string) => {').length - 1;
  check('main.ts: hook podpięty w OBU konfiguracjach configureCityPanel', wires === 2, wires);
  check('main.ts: hook woła demolishBuilding na cityBuilt i cities', main.includes('demolishBuilding({ cities, builtByCity: cityBuilt }, cityId, buildingId)'));
  const gameDir = path.resolve(GRA, 'src/game');
  const aiHits = fs.readdirSync(gameDir).filter(f => /^ai/.test(f) && fs.readFileSync(path.join(gameDir, f), 'utf8').includes('building-demolish'));
  check('AI (src/game/ai*.ts) nie importuje wyburzania', aiHits.length === 0, aiHits);
}

console.log('[9] Zaokrąglenie w dół i pomijanie zerowych wpisów (nieparzyste wartości; w danych gry koszty są parzyste)');
{
  check('51 drewna -> zwrot 25 (w dół, nie 26)', eq(refundFromPaidCost({ drewno: 51 }), { drewno: 25 }), refundFromPaidCost({ drewno: 51 }));
  check('3 kamienia -> zwrot 1 (w dół)', eq(refundFromPaidCost({ kamien: 3 }), { kamien: 1 }), refundFromPaidCost({ kamien: 3 }));
  check('1 cegły -> połowa 0 -> wpis pominięty (brak klucza)', eq(refundFromPaidCost({ cegla: 1 }), {}), refundFromPaidCost({ cegla: 1 }));
  check('mieszane {drewno:51, kamien:1, cegla:0} -> {drewno:25}',
    eq(refundFromPaidCost({ drewno: 51, kamien: 1, cegla: 0 }), { drewno: 25 }),
    refundFromPaidCost({ drewno: 51, kamien: 1, cegla: 0 }));
  check('pusty koszt -> pusty zwrot', eq(refundFromPaidCost({}), {}));
}

console.log('');
console.log('RESULT: ' + pass + ' pass / ' + fail + ' fail');
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
