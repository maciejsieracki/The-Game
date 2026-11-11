'use strict';
/**
 * fortifications-stack-repro-test.cjs
 *
 * R-WEB-FORTIFICATIONS-UPGRADE-CHAIN-ANALYSIS-Q1 (2026-11-11) -- test ODTWARZAJACY (read-only wobec
 * kodu gry). Dokumentuje OBECNE zachowanie lancucha fortyfikacji Palisada (palisada) -> Mury kamienne
 * (mury_kamienne) -> Mury ceglane (mury) w SILNIKU (bez UI), na PRAWDZIWYCH funkcjach:
 *   production.ts (applyCompletedBuildingIds, buildableProduction, buildingProductionItem),
 *   building-stock-cost.ts (buildingStockCost), economy-upkeep.ts (buildingUpkeep, buildingResourceUpkeep),
 *   city-defense.ts (cityWallDefenseBonusPercent), city-fortification.ts.
 *
 * OBECNE zachowanie (ten test ma PRZEJSC):
 *   O1 po UKONCZENIU wyzszego etapu nizszy znika z cityBuilt (applyCompletedBuildingIds) -- w stanie
 *      ustalonym stoi NAJWYZEJ JEDNA fortyfikacja z lancucha, utrzymanie jest za jedna.
 *   O2 ALE kazdy etap jest budowany jako NOWY budynek za PELNY koszt (Praca + surowce), bez zwrotu/
 *      odliczenia za zastepowany etap; w buildings.json NIE MA pola upgradeFrom dla palisada/mury_kamienne/
 *      mury, wiec w UI sa pod "Buduj", nie pod "Ulepsz" (sekcja "Ulepsz" = tylko poziomy tego samego id).
 *   O3 w trakcie budowy wyzszego etapu stary stoi nadal i placi utrzymanie (okno nakladania).
 *   O4 z kolejki mozna zamowic naraz palisada + mury_kamienne + mury (blokada dziala tylko "wyzszy blokuje
 *      nizszy", nie odwrotnie) => potrojna oplata za budowe; stare zapisy / kolejki moga miec kilka naraz.
 *   O5 bonus obrony NIE sumuje sie (bierze sie najwyzszy), ale utrzymanie SUMUJE sie dla kazdego id w
 *      cityBuilt (legacy zapis z kilkoma fortyfikacjami).
 *
 * OCZEKIWANE DOCELOWE (decyzja wlasciciela, jeszcze NIEWDROZONE): lancuch przez upgradeFrom + "Ulepsz"
 * (awans zastepuje poprzednika; koszt awansu wg decyzji ABC: pelny / roznica / z czesciowym zwrotem),
 * w miescie najwyzej jedna fortyfikacja takze w kolejce i w migrowanych zapisach.
 * Po wdrozeniu asercje O2/O4/O5 beda wymagaly aktualizacji (patrz raport).
 *
 * Usage (z gra/): node tools/fortifications-stack-repro-test.cjs
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
let pass = 0; let fail = 0;
function assert(c, m) { if (c) { pass++; console.log('  [OK]', m); } else { fail++; console.error('  [FAIL]', m); } }

const RUN = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT = path.join(os.tmpdir(), `fort-stack-${RUN}`);
fs.mkdirSync(OUT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* best-effort */ } });

const entry = path.join(OUT, 'entry.ts');
fs.writeFileSync(entry, `
export { applyCompletedBuildingIds, buildableProduction, buildingProductionItem, enqueue } from '${GRA.replace(/\\/g, '/')}/src/game/production';
export { buildingStockCost } from '${GRA.replace(/\\/g, '/')}/src/game/building-stock-cost';
export { buildingUpkeep, buildingResourceUpkeep, totalBuildingUpkeep, totalBuildingResourceUpkeep } from '${GRA.replace(/\\/g, '/')}/src/game/economy-upkeep';
export { cityWallDefenseBonusPercent } from '${GRA.replace(/\\/g, '/')}/src/game/city-defense';
export { cityFortificationKind } from '${GRA.replace(/\\/g, '/')}/src/game/city-fortification';
`);
const outfile = path.join(OUT, 'bundle.cjs');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile, logLevel: 'silent', loader: { '.json': 'json' } });
const M = require(outfile);

const bRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const buildings = Array.isArray(bRaw) ? bRaw : (bRaw.budynki || bRaw.buildings || bRaw);
const params = JSON.parse(fs.readFileSync(path.join(GRA, 'data/miasto-params.json'), 'utf8'));
const data = { buildings, units: [] };
const def = id => buildings.find(b => b.id === id);
const CHAIN = ['palisada', 'mury_kamienne', 'mury'];
const dparams = {
  mur: params.bonus_obrona_mur_proc.wartosc,
  cytadela: params.bonus_obrona_cytadela_proc.wartosc,
  baszta: params.bonus_obrona_baszta_proc.wartosc,
  palisada: params.bonus_obrona_palisada_proc.wartosc,
  murKamienny: params.bonus_obrona_mur_kamienny_proc.wartosc,
};
const TECHS = ['Obróbka drewna', 'Murarstwo', 'Budownictwo'];
const city = { id: 'c1', name: 'Test', ownerId: 0 };
const fmt = o => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(',') || '-';

function snapshot(label, built, queue = []) {
  const recs = built.map(id => ({ record: def(id), level: 1 }));
  const gold = M.totalBuildingUpkeep(recs);
  const res = M.totalBuildingResourceUpkeep(recs, 1);
  const bonus = M.cityWallDefenseBonusPercent(built, dparams);
  const q = queue.map(i => i.id);
  console.log(`  ${label.padEnd(44)} built=[${built.join(',')}] queue=[${q.join(',')}] upkeepGold=${gold} upkeepRes={${fmt(res)}} defBonus=+${bonus}%`);
  return { gold, res, bonus, built: built.slice() };
}
function availableIds(built, queue) {
  return M.buildableProduction(city, data, TECHS, { epoch: 3, builtBuildingIds: built, productionQueue: queue })
    .filter(i => CHAIN.includes(i.id)).map(i => i.id);
}
function item(id) { return M.buildingProductionItem(id, data, 1); }

console.log('\n=== (1) DANE (buildings.json / miasto-params.json) ===');
for (const id of CHAIN) {
  const d = def(id);
  const stock = M.buildingStockCost(d);
  const pr = item(id);
  console.log(`  ${id.padEnd(14)} epoka=${d.epokaWejscia} tech="${d.techUnlock}" kosztBudowy=${d.kosztBudowy} praca(efekt)=${pr.koszt} surowce={${fmt(stock)}} utrzymanie=${d.utrzymanie}+${d.przyrostUtrzymania}/poz maksPoziom=${d.maksPoziom} upgradeFrom=${JSON.stringify(d.upgradeFrom ?? null)} upkeepGold(L1)=${M.buildingUpkeep(d, 1)} upkeepRes(L1)={${fmt(M.buildingResourceUpkeep(d, 1, 1))}}`);
}
console.log(`  bonus obrony: palisada=+${dparams.palisada}% mur_kamienny=+${dparams.murKamienny}% mur_ceglany=+${dparams.mur}%`);
assert(CHAIN.every(id => !!def(id)), 'D1 wszystkie trzy definicje istnieja');
assert(CHAIN.every(id => !(def(id).upgradeFrom || '').trim()), 'D2 (O2) brak pola upgradeFrom w lancuchu palisada/mury_kamienne/mury');
assert(def('palisada').utrzymanie === 1 && def('mury_kamienne').utrzymanie === 2 && def('mury').utrzymanie === 2, 'D3 utrzymanie bazowe 1 / 2 / 2');
assert(dparams.palisada === 100 && dparams.murKamienny === 150 && dparams.mur === 200, 'D4 bonusy +100/+150/+200');

console.log('\n=== (2) SCENARIUSZ SEKWENCYJNY: palisada -> mury kamienne -> mury ceglane ===');
let built = []; let queue = [];
let tot = { praca: 0, stock: {} };
const addCost = id => {
  tot.praca += item(id).koszt;
  for (const [k, v] of Object.entries(M.buildingStockCost(def(id)))) tot.stock[k] = (tot.stock[k] || 0) + v;
};
const rows = [];
rows.push(snapshot('T0 start (brak fortyfikacji)', built));
// budowa palisady
addCost('palisada'); queue = [item('palisada')];
rows.push(snapshot('T1 palisada w kolejce (koszt pobrany)', built, queue));
built = M.applyCompletedBuildingIds(built, 'palisada', buildings); queue = [];
rows.push(snapshot('T2 palisada ukonczona', built));
const availAfterPal = availableIds(built, queue);
console.log(`  dostepne do budowy po palisadzie: [${availAfterPal.join(',')}]`);
assert(availAfterPal.includes('mury_kamienne') && availAfterPal.includes('mury'), 'S1 (O2) po palisadzie "Buduj" oferuje Mury kamienne I Mury ceglane jako NOWE budynki');
// budowa murow kamiennych
addCost('mury_kamienne'); queue = [item('mury_kamienne')];
const sOverlap = snapshot('T3 mury kamienne w kolejce (palisada stoi)', built, queue);
assert(built.includes('palisada') && sOverlap.gold === M.buildingUpkeep(def('palisada'), 1), 'S2 (O3) w trakcie budowy stoi stara palisada i placi utrzymanie');
built = M.applyCompletedBuildingIds(built, 'mury_kamienne', buildings); queue = [];
const sStone = snapshot('T4 mury kamienne ukonczone', built);
assert(built.length === 1 && built[0] === 'mury_kamienne', 'S3 (O1) po ukonczeniu mury_kamienne palisada ZNIKA (jedna fortyfikacja)');
// budowa murow ceglanych
addCost('mury'); queue = [item('mury')];
snapshot('T5 mury ceglane w kolejce (kamienne stoja)', built, queue);
built = M.applyCompletedBuildingIds(built, 'mury', buildings); queue = [];
const sBrick = snapshot('T6 mury ceglane ukonczone', built);
assert(built.length === 1 && built[0] === 'mury', 'S4 (O1) po ukonczeniu mury kamienne ZNIKAJA (jedna fortyfikacja)');
assert(sBrick.gold === M.buildingUpkeep(def('mury'), 1) && sStone.gold === M.buildingUpkeep(def('mury_kamienne'), 1), 'S5 utrzymanie w stanie ustalonym = tylko aktualna fortyfikacja');
const full = ['palisada', 'mury_kamienne', 'mury'].map(id => ({ id, praca: item(id).koszt, stock: M.buildingStockCost(def(id)) }));
console.log(`  SUMA kosztow zaplaconych za sciezke palisada->kamienne->ceglane: praca=${tot.praca} surowce={${fmt(tot.stock)}}`);
console.log(`  koszt samych murow ceglanych (gdyby zbudowac od razu): praca=${item('mury').koszt} surowce={${fmt(M.buildingStockCost(def('mury')))}}`);
assert(tot.praca === full.reduce((s, f) => s + f.praca, 0), 'S6 (O2) lacznie placi sie PELNY koszt Pracy kazdego z trzech etapow (bez odliczenia za zastepowany)');
assert(tot.stock.drewno === full.reduce((s, f) => s + (f.stock.drewno || 0), 0), 'S7 (O2) lacznie placi sie PELNY koszt surowcow kazdego etapu (drewno z 3 etapow)');

console.log('\n=== (3) KOLEJKA: kilka fortyfikacji zamowionych naraz (O4) ===');
{
  const q0 = [item('palisada')];
  const avail1 = availableIds([], q0);
  console.log(`  palisada w kolejce -> dostepne: [${avail1.join(',')}]`);
  assert(avail1.includes('mury_kamienne') && avail1.includes('mury'), 'Q1 (O4) przy palisadzie w kolejce MOZNA zamowic mury kamienne i ceglane (blokada tylko wyzszy->nizszy)');
  const q1 = [item('palisada'), item('mury_kamienne')];
  const avail2 = availableIds([], q1);
  console.log(`  palisada+mury_kamienne w kolejce -> dostepne: [${avail2.join(',')}]`);
  assert(avail2.includes('mury'), 'Q2 (O4) mozna dolozyc do kolejki jeszcze mury ceglane (trzy oplaty za jedno miasto)');
  const avail3 = availableIds(['mury'], []);
  assert(!avail3.includes('palisada') && !avail3.includes('mury_kamienne'), 'Q3 zabezpieczenie: gdy stoja mury ceglane, nizsze etapy nie sa oferowane');
  // odwrocona kolejnosc ukonczenia (stale kolejki / zapisy)
  let b = M.applyCompletedBuildingIds([], 'mury', buildings);
  b = M.applyCompletedBuildingIds(b, 'palisada', buildings);
  b = M.applyCompletedBuildingIds(b, 'mury_kamienne', buildings);
  console.log(`  ukonczenie w odwrotnej kolejnosci (mury, palisada, mury_kamienne) -> built=[${b.join(',')}]`);
  assert(b.length === 1 && b[0] === 'mury', 'Q4 straznik ukonczenia: zawsze zostaje najwyzszy etap, ale ZAPLACONO za wszystkie trzy');
}

console.log('\n=== (4) LEGACY ZAPIS: kilka fortyfikacji w cityBuilt naraz (O5) ===');
{
  const legacy = ['palisada', 'mury_kamienne', 'mury'];
  const s = snapshot('legacy: palisada+kamienne+ceglane', legacy);
  const expectedGold = legacy.reduce((a, id) => a + M.buildingUpkeep(def(id), 1), 0);
  assert(s.gold === expectedGold && s.gold > M.buildingUpkeep(def('mury'), 1), 'L1 (O5) utrzymanie Pieniadza SUMUJE sie dla kazdego id w cityBuilt');
  assert(s.bonus === dparams.mur, 'L2 (O5) bonus obrony NIE sumuje sie -- tylko najwyzszy (+200%)');
  assert((s.res.drewno || 0) === legacy.reduce((a, id) => a + (M.buildingResourceUpkeep(def(id), 1, 1).drewno || 0), 0), 'L3 (O5) utrzymanie surowcowe tez sie sumuje (drewno)');
  const one = snapshot('porownanie: tylko mury ceglane', ['mury']);
  console.log(`  nadplata legacy vs jedna fortyfikacja: zloto +${s.gold - one.gold}/ture, drewno +${(s.res.drewno || 0) - (one.res.drewno || 0)}/ture, kamien +${(s.res.kamien || 0) - (one.res.kamien || 0)}/ture, cegla +${(s.res.cegla || 0) - (one.res.cegla || 0)}/ture`);
  assert(M.cityFortificationKind(legacy) === 'mur', 'L4 rozpoznanie obwarowania: mur');
}

console.log('\n=== (5) PARYTET GRACZ / AI (pinezki zrodla) ===');
{
  const prod = fs.readFileSync(path.join(GRA, 'src/game/production.ts'), 'utf8');
  const main = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
  const ai = fs.readFileSync(path.join(GRA, 'src/game/ai.ts'), 'utf8');
  const completions = (main.match(/applyCompletedBuildingIds\(/g) || []).length;
  assert(/isWallTierBlockedByStrongerWall\(b\.id, builtList, queue\)/.test(prod) && (prod.match(/isWallTierBlockedByStrongerWall\(b\.id/g) || []).length === 2, 'P1 blokada "wyzszy blokuje nizszy" jest we wspolnej dostepnosci (availableProduction) dla gracza i AI');
  assert(completions === 1 && /cityBuilt\.set\(cityId, applyCompletedBuildingIds\(/.test(main), 'P2 jedyna sciezka ukonczenia budynku (gracz i AI, tick produkcji miasta) = applyCompletedBuildingIds');
  assert(/!built\.includes\('palisada'\) && !built\.includes\('mury'\) && !built\.includes\('mury_kamienne'\)/.test(ai), 'P3 AI (ai.ts) nie forsuje palisady gdy stoi mur -- ta sama funkcja kosztu i ukonczenia co gracz');
}

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
