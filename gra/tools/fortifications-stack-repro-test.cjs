'use strict';
/**
 * fortifications-stack-repro-test.cjs
 *
 * R-WEB-FORTIFICATIONS-UPGRADE-CHAIN-IMPL-Q1 (2026-11-11) -- test lancucha fortyfikacji
 * Palisada (palisada) -> Mury kamienne (mury_kamienne) -> Mury ceglane (mury) w SILNIKU, na PRAWDZIWYCH funkcjach.
 * Wczesniej (temat ANALYSIS-Q1) dokumentowal zachowanie sprzed zmiany; po wdrozeniu opisuje NOWE zachowanie
 * (czerwony na bazie 4abb6573e, zielony po zmianie):
 *   N1 awans przez relacje upgradeFrom + upgradeSkip: etap, do ktorego stoi nizszy, jest AWANSEM ("Rozbuduj X -> Y"),
 *      przeskok (mury ceglane od zera) dozwolony; w miescie i w kolejce najwyzej JEDEN etap lancucha.
 *   N2 koszt awansu = PELNY koszt nowego etapu (Praca + surowce, decyzja wlasciciela 1), stary znika bez zwrotu.
 *   N3 blokada kolejki w obie strony (nizszy w kolejce blokuje wyzszy i odwrotnie).
 *   N4 migracja zapisu (collapseFortificationChain): z kilku fortyfikacji zostaje najwyzsza, utrzymanie 8 zamiast 14.
 *   N5 UI/AI: pinezki zrodla (sekcja "Ulepsz", parytet AI); AI behawioralnie w tools/fortifications-upgrade-chain-ai-test.cjs;
 *      zywy Chromium w tools/fortifications-upgrade-chain-live-test.cjs.
 * Realne potracenie kosztu: deductBuildingStockCostAcrossCities (ta sama funkcja co main.ts/cityPanel.ts).
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

const G = GRA.replace(/\\/g, '/');
const entry = path.join(OUT, 'entry.ts');
fs.writeFileSync(entry, `
import * as P from '${G}/src/game/production';
export const applyCompletedBuildingIds = P.applyCompletedBuildingIds;
export const collapseFortificationChain = (P as any).collapseFortificationChain;
export const availableProduction = P.availableProduction;
export const buildableProduction = P.buildableProduction;
export const buildingProductionItem = P.buildingProductionItem;
export { buildingStockCost, deductBuildingStockCostAcrossCities } from '${G}/src/game/building-stock-cost';
export { buildingUpkeep, buildingResourceUpkeep, totalBuildingUpkeep, totalBuildingResourceUpkeep } from '${G}/src/game/economy-upkeep';
export { cityWallDefenseBonusPercent } from '${G}/src/game/city-defense';
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
  console.log(`  ${label.padEnd(50)} built=[${built.join(',')}] queue=[${q.join(',')}] upkeepGold=${gold} upkeepRes={${fmt(res)}} defBonus=+${bonus}%`);
  return { gold, res, bonus, built: built.slice() };
}
function item(id) { return M.buildingProductionItem(id, data, 1); }
const offered = (built, queue) => M.availableProduction(city, data, TECHS, { epoch: 3, builtBuildingIds: built, productionQueue: queue })
  .filter(i => CHAIN.includes(i.id));
const idsOf = (built, queue) => offered(built, queue).map(i => i.id);
const nameOf = (built, queue, id) => (offered(built, queue).find(i => i.id === id) || {}).nazwa;
const cities2 = () => [
  { id: 'a', ownerId: 0, surowce: { drewno: 1000, kamien: 1000, cegla: 1000 } },
  { id: 'b', ownerId: 0, surowce: { drewno: 1000, kamien: 1000, cegla: 1000 } },
];
const sumOf = (cs, k) => cs.reduce((a, c) => a + (c.surowce[k] || 0), 0);
// Realne potracenie (deductBuildingStockCostAcrossCities).
function pay(cs, id) {
  const before = { drewno: sumOf(cs, 'drewno'), kamien: sumOf(cs, 'kamien'), cegla: sumOf(cs, 'cegla') };
  M.deductBuildingStockCostAcrossCities(cs, 0, M.buildingStockCost(def(id)));
  return { drewno: before.drewno - sumOf(cs, 'drewno'), kamien: before.kamien - sumOf(cs, 'kamien'), cegla: before.cegla - sumOf(cs, 'cegla') };
}

console.log('\n=== (1) DANE (buildings.json / miasto-params.json) ===');
for (const id of CHAIN) {
  const d = def(id);
  console.log(`  ${id.padEnd(14)} epoka=${d.epokaWejscia} praca(efekt)=${item(id).koszt} surowce={${fmt(M.buildingStockCost(d))}} utrzymanie=${d.utrzymanie}+${d.przyrostUtrzymania}/poz upgradeFrom=${JSON.stringify(d.upgradeFrom ?? null)} upgradeSkip=${JSON.stringify(d.upgradeSkip ?? null)} upkeepGold(L1)=${M.buildingUpkeep(d, 1)}`);
}
assert(CHAIN.every(id => !!def(id)), 'D1 wszystkie trzy definicje istnieja');
assert(def('palisada').upgradeFrom === undefined && def('mury_kamienne').upgradeFrom === 'palisada' && def('mury').upgradeFrom === 'mury_kamienne', 'D2 relacja awansu: mury_kamienne <- palisada, mury <- mury_kamienne');
assert(def('mury_kamienne').upgradeSkip === true && def('mury').upgradeSkip === true, 'D2b przeskok dozwolony (upgradeSkip) dla obu wyzszych etapow');
assert(def('palisada').utrzymanie === 1 && def('mury_kamienne').utrzymanie === 2 && def('mury').utrzymanie === 2, 'D3 utrzymanie bazowe BEZ ZMIAN 1 / 2 / 2');
assert(dparams.palisada === 100 && dparams.murKamienny === 150 && dparams.mur === 200, 'D4 bonusy BEZ ZMIAN +100/+150/+200');
assert(item('palisada').koszt === 22 && item('mury_kamienne').koszt === 35 && item('mury').koszt === 70, 'D5 koszt Pracy BEZ ZMIAN 22 / 35 / 70');
assert(def('fort').upgradeFrom === undefined, 'D6 Cytadela (fort) poza lancuchem: brak upgradeFrom');

console.log('\n=== (2) SCENARIUSZ: Palisada -> Mury kamienne -> Mury ceglane PRZEZ AWANS (tura -> stan) ===');
{
  const cs = cities2();
  let built = []; let queue = [];
  const rows = [];
  const snap = (turn, label) => { const s0 = snapshot(`${turn} ${label}`, built, queue); rows.push({ turn, built: built.slice(), gold: s0.gold, bonus: s0.bonus }); return s0; };
  snap('T0', 'start');
  assert(CHAIN.every(i => idsOf(built, queue).includes(i)), 'S0 od zera oferowane: palisada, mury kamienne i mury ceglane (przeskok)');
  const p1 = pay(cs, 'palisada'); queue = [item('palisada')]; snap('T1', 'palisada w kolejce');
  built = M.applyCompletedBuildingIds(built, 'palisada', buildings); queue = [];
  const s2 = snap('T2', 'palisada ukonczona');
  assert(idsOf(built, queue).includes('mury_kamienne') && idsOf(built, queue).includes('mury') && !idsOf(built, queue).includes('palisada'), 'S1 po palisadzie wyzsze etapy oferowane jako awans, palisada nie');
  assert(nameOf(built, queue, 'mury_kamienne') === 'Rozbuduj Palisada drewniana → Mury kamienne', 'S1b etykieta "Rozbuduj Palisada drewniana -> Mury kamienne" (jest: ' + nameOf(built, queue, 'mury_kamienne') + ')');
  const p2 = pay(cs, 'mury_kamienne'); queue = [item('mury_kamienne')];
  snap('T3', 'awans na mury kamienne w kolejce (palisada stoi)');
  assert(idsOf(built, queue).length === 0, 'S2 gdy awans czeka w kolejce, NIE da sie zamowic innego etapu lancucha (jeden etap naraz)');
  built = M.applyCompletedBuildingIds(built, 'mury_kamienne', buildings); queue = [];
  const s4 = snap('T4', 'mury kamienne ukonczone');
  assert(built.length === 1 && built[0] === 'mury_kamienne', 'S3 awans zastapil palisade: jedna fortyfikacja');
  assert(idsOf(built, queue).join() === 'mury' && nameOf(built, queue, 'mury') === 'Rozbuduj Mury kamienne → Mury ceglane', 'S3b po kamiennych tylko awans na ceglane z etykieta "Rozbuduj ..."');
  const p3 = pay(cs, 'mury'); queue = [item('mury')]; snap('T5', 'awans na mury ceglane w kolejce');
  built = M.applyCompletedBuildingIds(built, 'mury', buildings); queue = [];
  const s6 = snap('T6', 'mury ceglane ukonczone');
  assert(built.length === 1 && built[0] === 'mury', 'S4 po ukonczeniu: jedna fortyfikacja (mury)');
  assert(s6.gold === M.buildingUpkeep(def('mury'), 1) && s4.gold === M.buildingUpkeep(def('mury_kamienne'), 1) && s2.gold === M.buildingUpkeep(def('palisada'), 1), 'S5 utrzymanie w kazdym stanie = tylko za jedna fortyfikacje');
  assert(s2.bonus === 100 && s4.bonus === 150 && s6.bonus === 200, 'S5b bonus obrony 100 -> 150 -> 200 (bez zmian)');
  assert(idsOf(built, queue).length === 0, 'S5c gdy stoja mury ceglane, nic z lancucha nie jest oferowane');
  assert(p1.drewno === 120 && p1.kamien === 0 && p1.cegla === 0, 'F1 palisada: realnie pobrano drewno 120');
  assert(p2.drewno === 160 && p2.kamien === 160 && p2.cegla === 160, 'F2 awans palisada->kamienne: PELNY koszt nowego 160/160/160 (bez odliczenia, bez zwrotu)');
  assert(p3.drewno === 320 && p3.kamien === 320 && p3.cegla === 320, 'F3 awans kamienne->ceglane: PELNY koszt nowego 320/320/320');
  assert(sumOf(cs, 'drewno') === 2000 - 600 && sumOf(cs, 'kamien') === 2000 - 480 && sumOf(cs, 'cegla') === 2000 - 480, 'F4 magazyny po 3 etapach: -600/-480/-480 (stan faktyczny, nie arytmetyka cen)');
  console.log('  TABELA tura -> (budynki fortyfikacyjne, utrzymanie zl, bonus obrony):');
  for (const r of rows) console.log(`    ${r.turn}: [${r.built.join(',') || '-'}] utrzymanie=${r.gold} bonus=+${r.bonus}%`);
  assert(rows.every(r => r.built.length <= 1), 'S6 w zadnej turze wiecej niz jedna fortyfikacja w miescie');
}

console.log('\n=== (3) PRZESKOK: mury ceglane od zera za pelny koszt ===');
{
  const cs = cities2();
  assert(nameOf([], [], 'mury') === 'Mury ceglane', 'P1 od zera nazwa bez "Rozbuduj" (to budowa, nie awans)');
  const pr = item('mury');
  const spent = pay(cs, 'mury');
  assert(pr.koszt === 70 && spent.drewno === 320 && spent.kamien === 320 && spent.cegla === 320, 'P2 przeskok kosztuje pelne 70 Pracy + 320/320/320 (realne potracenie)');
  const b = M.applyCompletedBuildingIds([], 'mury', buildings);
  assert(b.length === 1 && b[0] === 'mury', 'P3 ukonczenie od zera daje jedno "mury"');
  const b2 = M.applyCompletedBuildingIds(['palisada'], 'mury', buildings);
  assert(b2.length === 1 && b2[0] === 'mury', 'P4 przeskok palisada -> mury: palisada znika (nie tylko bezposredni poprzednik)');
  assert(nameOf(['palisada'], [], 'mury') === 'Rozbuduj Palisada drewniana → Mury ceglane', 'P5 etykieta przeskoku z palisady: "Rozbuduj Palisada -> Mury ceglane"');
  const bC = M.applyCompletedBuildingIds(['mury_kamienne', 'koszary'], 'mury', buildings);
  assert(bC.join() === 'koszary,mury', 'P6 inne budynki nietkniete, nizszy etap znika');
}

console.log('\n=== (4) BLOKADA KOLEJKI w obie strony (jeden etap lancucha naraz) ===');
{
  const q = id => [item(id)];
  assert(idsOf([], q('palisada')).length === 0, 'Q1 palisada w kolejce -> zadnego etapu lancucha (ani kamiennych, ani ceglanych)');
  assert(idsOf([], q('mury_kamienne')).length === 0, 'Q2 mury kamienne w kolejce -> ani palisada (nizszy), ani mury (wyzszy)');
  assert(idsOf([], q('mury')).length === 0, 'Q3 mury ceglane w kolejce -> ani palisada, ani kamienne');
  assert(idsOf(['palisada'], q('mury_kamienne')).length === 0, 'Q4 palisada stoi + awans na kamienne w kolejce -> nie da sie dolozyc murow ceglanych');
  assert(idsOf(['mury_kamienne'], q('mury')).length === 0, 'Q5 kamienne stoja + awans na ceglane w kolejce -> nic wiecej');
  assert(idsOf(['mury'], []).length === 0, 'Q6 zabezpieczenie: gdy stoja mury ceglane, nizsze nie sa oferowane');
  let b = M.applyCompletedBuildingIds([], 'mury', buildings);
  b = M.applyCompletedBuildingIds(b, 'palisada', buildings);
  b = M.applyCompletedBuildingIds(b, 'mury_kamienne', buildings);
  assert(b.length === 1 && b[0] === 'mury', 'Q7 straznik ukonczenia: spozniony nizszy etap nie cofa wyzszego');
  const withFort = M.applyCompletedBuildingIds(['mury'], 'fort', buildings);
  assert(withFort.includes('mury') && withFort.includes('fort'), 'Q8 Cytadela (fort) NIE zastepuje murow (osobne budynki)');
}

console.log('\n=== (5) MIGRACJA ZAPISU: kilka fortyfikacji w cityBuilt ===');
{
  const legacy = ['palisada', 'mury_kamienne', 'mury'];
  const before = snapshot('legacy: palisada+kamienne+ceglane', legacy);
  const migrated = M.collapseFortificationChain(legacy, buildings);
  const after = snapshot('po migracji', migrated);
  assert(migrated.length === 1 && migrated[0] === 'mury', 'M1 zostaje NAJWYZSZA (mury)');
  assert(before.gold === 14 && after.gold === 8, 'M2 utrzymanie zl 14 -> 8 (jest ' + before.gold + ' -> ' + after.gold + ')');
  assert((before.res.drewno || 0) === 5 && (after.res.drewno || 0) === 2 && (after.res.kamien || 0) === 2 && (after.res.cegla || 0) === 2, 'M3 utrzymanie surowcow drewno 5 -> 2, kamien/cegla 2');
  assert(before.bonus === 200 && after.bonus === 200, 'M4 bonus obrony bez zmian (+200%)');
  assert(M.collapseFortificationChain(['palisada', 'mury_kamienne'], buildings).join() === 'mury_kamienne', 'M5 para palisada+kamienne -> kamienne');
  assert(M.collapseFortificationChain(['koszary', 'mury', 'palisada', 'fort', 'baszta'], buildings).join() === 'koszary,mury,fort,baszta', 'M6 inne budynki (fort, baszta) nietkniete, kolejnosc zachowana');
  const same = ['koszary', 'mury'];
  assert(M.collapseFortificationChain(same, buildings) === same, 'M7 brak zmian -> ta sama tablica (zero kosztu dla zwyklych zapisow)');
  assert(M.collapseFortificationChain(['fort'], buildings).join() === 'fort', 'M8 sama Cytadela nietknieta');
}

console.log('\n=== (6) UI / AI: pinezki zrodla ===');
{
  const prod = fs.readFileSync(path.join(GRA, 'src/game/production.ts'), 'utf8');
  const main = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
  const ai = fs.readFileSync(path.join(GRA, 'src/game/ai.ts'), 'utf8');
  const ui = fs.readFileSync(path.join(GRA, 'src/ui/cityPanel.ts'), 'utf8');
  assert((prod.match(/isWallTierBlockedByStrongerWall\(b\.id, builtList, queue, data\.buildings\)/g) || []).length === 2, 'U1 blokada lancucha jest we wspolnej dostepnosci (availableProduction + katalog) dla gracza i AI');
  assert(main.split('applyCompletedBuildingIds(').length - 1 === 1 && /collapseFortificationChain\(blt as string\[\], data\.buildings\)/.test(main), 'U2 jedna sciezka ukonczenia; migracja zapisu wpieta przy wczytaniu cityBuilt');
  assert(/skipChainUpgradeSource\(it\.id, built, data\.buildings\)/.test(ui) && /Ulepsz → \$\{def\.nazwa\}/.test(ui), 'U3 UI: etap z poprzednikiem trafia do sekcji "Ulepsz" z etykieta "Ulepsz -> Nazwa"');
  assert(/b\.upgradeSkip !== true && !built\.includes\(upgradeFrom\)/.test(ai), 'U4 AI: filtr upgradeFrom respektuje przeskok (parytet z graczem)');
  assert(!/built\.includes\('mury_kamienne'\) \? 'mury' : 'mury_kamienne', score: 320/.test(ai), 'U5 AI: martwa galez ternary w boost-cie 320 usunieta');
}

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
