'use strict';
/**
 * unit-replace-ai-vs-player-test.cjs -- R-WEB-UNIT-REPLACE-AI-INSTANT-BRONZE-AND-PLAYER-BLOCKED-Q1
 *
 * DIAGNOSTYKA + bramka regresji (pure logic, bez DOM/przegladarki). Run z gra/:
 *   node tools/unit-replace-ai-vs-player-test.cjs
 *
 * Czesc A (AI): symulacja wejscia AI w epoke Brazu -- N jednostek "Wojownik" (Kamien), AI ma
 *   Brazownictwo + Koszary + Braz w magazynie. Liczy: ile zamian w jednej turze, ile Pieniadza,
 *   ile Brazu (zuzycie), oraz ile Brazu kosztowalaby REKRUTACJA tych samych jednostek.
 * Czesc B (gracz): tabela typ jednostki x zamienniki x powod nieoferowania (Grecja, epoka Brazu).
 * Czesc C: asercje (fakty o regulach -- jesli ktos zmieni regule, test to pokaze).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.unit-replace-aivp-entry.ts');
const bundle = path.resolve(__dirname, '.unit-replace-aivp-bundle.cjs');
fs.writeFileSync(entry, `
export { promoteAiUnitForEra } from '../src/game/ai-era-unit-promotion';
export { availableReplacementsFor, newestAvailableSameTypeUnit, unitProductionItem, epochNumber } from '../src/game/production';
export { unitResourceUpkeep } from '../src/game/economy-upkeep';
export { unitStockCost } from '../src/game/building-stock-cost';
export { buildReplaceAvailabilityCtx } from '../src/game/unit-replace-context';
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
} catch (e) { console.error(e.message || e); process.exit(1); }
const M = require(bundle);
const units = require('../data/units.json');
const data = { units, buildings: [] };
const def = n => units.find(u => u.Jednostka === n);

let passed = 0; let failed = 0;
function assert(ok, label) { if (ok) { passed++; console.log('  [OK] ' + label); } else { failed++; console.error('  [FAIL] ' + label); } }

const TECH_BR = ['Brązownictwo'];
function ctx(over) {
  return Object.assign({
    epoch: 2, civUnitNacja: 'Grecja', civBonusy: [], builtBuildingIds: ['koszary'],
    empireResourceStock: { drewno: 1000, braz: 542 }, kosztJednostekPace: 'niski', difficulty: 'normal', ownerId: 7,
  }, over || {});
}

// ---------------- Czesc A: AI ----------------
console.log('\n== A. AI wchodzi w epoke Brazu: 90 x Wojownik ==');
function aiRun(n, treasury0, c, techs) {
  let treasury = treasury0; let promoted = 0; let spent = 0;
  const army = Array.from({ length: n }, (_, i) => ({ ownerId: 7, typeId: 'Wojownik', category: 'Wrecz', hp: 20, hpMax: 20, ruchLeft: 1, replaceUsedThisTurn: false, id: i }));
  const deps = {
    oldDefinition: v => def(v.typeId),
    candidates: v => M.availableReplacementsFor(v.typeId, data, techs, c).map(i => def(i.id)).filter(Boolean),
    newestSameRole: (v, cs) => M.newestAvailableSameTypeUnit(v.typeId, cs.map(d => d.Jednostka), units),
    epochNumber: M.epochNumber,
    unitCost: id => M.unitProductionItem(id, data, [], 'niski', 7, 'normal')?.koszt ?? 0,
    currentTreasury: () => treasury, setTreasury: v => { spent += treasury - v; treasury = v; },
    oldMaxHp: () => 20, newMaxHp: () => 28, category: t => String(t['Rola (linia)'] ?? ''),
  };
  for (const u of army) if (M.promoteAiUnitForEra(u, deps)) promoted++;
  const to = army.find(u => u.typeId !== 'Wojownik')?.typeId;
  return { promoted, spent, treasuryLeft: treasury, to, zeroedMove: army.filter(u => u.ruchLeft === 0).length };
}
const oldCost = M.unitProductionItem('Wojownik', data, [], 'niski', 7, 'normal').koszt;
const newCost = M.unitProductionItem('Wojownik z mieczem i tarczą', data, [], 'niski', 7, 'normal').koszt;
const surcharge = Math.max(0, newCost - oldCost);
const recruitStock = M.unitStockCost(def('Wojownik z mieczem i tarczą'));
const upkeepOld = M.unitResourceUpkeep(def('Wojownik'));
const upkeepNew = M.unitResourceUpkeep(def('Wojownik z mieczem i tarczą'));
console.log(`koszt Pieniadz: Wojownik=${oldCost}, Wojownik z mieczem i tarcza=${newCost}, doplata=${surcharge}`);
console.log(`koszt REKRUTACJI surowiec (nowa): ${JSON.stringify(recruitStock)}; utrzymanie surowiec stara=${JSON.stringify(upkeepOld)} nowa=${JSON.stringify(upkeepNew)}`);
const rows = [];
for (const t of [0, 100, 270, 1000, 100000]) {
  const r = aiRun(90, t, ctx(), TECH_BR);
  rows.push(r);
  console.log(`skarb=${t}: zamian=${r.promoted}/90, Pieniadz=${r.spent}, Braz zuzyty=0 (brak odliczenia), cel=${r.to}, ruch=0 u ${r.zeroedMove}`);
}
const full = rows[4];
console.log(`Gdyby zamiana kosztowala jak rekrutacja: Braz ${(recruitStock.braz || 0) * full.promoted} (pelny) vs 0 (obecnie); przyrost utrzymania Brazu/ture: ${((upkeepNew.braz || 0) - (upkeepOld.braz || 0)) * full.promoted}`);

// ---------------- Czesc B: gracz (Grecja, epoka Brazu) ----------------
console.log('\n== B. Gracz (Grecja, epoka Brazu): typ x zamienniki x powod ==');
function names(arr) { return arr.map(i => i.id); }
const scen = {
  'pelne bramki (Koszary+Brazownictwo+Braz>0)': { c: ctx(), techs: TECH_BR },
  'bez Koszar w miescie/ctx': { c: ctx({ builtBuildingIds: [] }), techs: TECH_BR },
  'bez techu Brazownictwo': { c: ctx(), techs: [] },
  'epoka imperium=1 (Kamien)': { c: ctx({ epoch: 1 }), techs: TECH_BR },
  'Braz=0, widok Zastap (showStock)': { c: ctx({ empireResourceStock: { drewno: 10, braz: 0 }, showStockGatedUnits: true }), techs: TECH_BR },
  'Braz=0, bez showStock (AI/walidacja)': { c: ctx({ empireResourceStock: { drewno: 10, braz: 0 } }), techs: TECH_BR },
};
const probe = ['Wojownik', 'Wojownik z mieczem i tarczą', 'Wojownik mykeński', 'Włócznik', 'Łucznik', 'Oszczepnik', 'Konnica', 'Rydwan (woły)'];
const out = {};
for (const [sn, s] of Object.entries(scen)) {
  out[sn] = {};
  console.log('-- ' + sn);
  for (const p of probe) {
    const r = names(M.availableReplacementsFor(p, data, s.techs, s.c));
    out[sn][p] = r;
    console.log(`   ${p} -> ${r.length ? r.join(' | ') : '(brak)'}`);
  }
}

// ---------------- Czesc C: asercje faktow ----------------
console.log('\n== C. Asercje ==');
const full1 = out['pelne bramki (Koszary+Brazownictwo+Braz>0)'];
assert(full1['Wojownik'].includes('Wojownik z mieczem i tarczą') && full1['Wojownik'].includes('Wojownik mykeński'),
  'gracz-Grecja, pelne bramki: Wojownik ma zamienniki Brazu (Wojownik z mieczem i tarcza, mykenski)');
assert(!full1['Wojownik'].some(n => /Wojownik germański|khopesh|fenicki|Sherden/.test(n)), 'zamienniki innych nacji niewidoczne (unitAllowedForCivNation)');
assert(out['bez Koszar w miescie/ctx']['Wojownik'].length === 0, 'BRAK Koszar w ctx (miasto garnizonu) -> Wojownik nie ma zadnych zamiennikow Brazu (przyczyna "pusty Zastap" w miescie bez Koszar)');
assert(out['bez techu Brazownictwo']['Wojownik'].length === 0, 'brak techu Brazownictwo -> brak zamiennikow');
assert(out['epoka imperium=1 (Kamien)']['Wojownik'].length === 0, 'epoka imperium 1 -> brak zamiennikow Brazu');
assert(out['Braz=0, bez showStock (AI/walidacja)']['Wojownik'].length === 0 && out['Braz=0, widok Zastap (showStock)']['Wojownik'].length > 0,
  'Braz=0: AI/walidacja chowa, widok gracza pokazuje wyszarzone (R-WEB-RECRUIT-LIST-REGRESSION-Q1 r3)');
// "wyzszy rzad" = tylko ten sam Typ albo pole "Zastap specjalnie"
assert(!full1['Wojownik'].includes('Włócznik') && !full1['Wojownik'].includes('Konnica'), 'Zastap = TEN SAM Typ (Swordsman); Wojownik -> Wlocznik/Konnica NIE jest oferowane (regula z projektu, nie blad)');
// AI
assert(rows[0].promoted === 0, 'AI ze skarbem 0: 0 zamian (dopłata Pieniadzem jest egzekwowana)');
assert(rows[4].promoted === 90, 'AI z duzym skarbem: wszystkie 90 jednostek zamienione W JEDNEJ TURZE (brak limitu na ture)');
assert(rows[4].spent === surcharge * 90, 'AI placi tylko doplate Pieniadza (nowa-stara) x liczba');
assert((recruitStock.braz || 0) > 0 && rows[4].promoted === 90, 'FAKT: zamiana (AI i gracz) NIE pobiera Brazu, mimo ze rekrutacja pobiera ' + (recruitStock.braz || 0) + ' Brazu/szt. (do decyzji ABC)');
const mainSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
const pr = mainSrc.slice(mainSrc.indexOf('function performUnitReplace('), mainSrc.indexOf('function buildPlayerCityListEntries'));
assert(!/unitStockCost|deductBuildingStockCostAcrossCities/.test(pr), 'performUnitReplace (gracz) tez nie pobiera surowca -- symetria z AI');
const up = mainSrc.slice(mainSrc.indexOf('function upgradeAiUnitsForEra('), mainSrc.indexOf('function bestGeneralUnitForOwner'));
assert(!/isUnitInPlayerTerritory/.test(up), 'FAKT: AI nie sprawdza terytorium (gracz tak) -- asymetria zasiegu');

console.log(`\nunit-replace AI vs gracz: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); } catch {}
try { fs.unlinkSync(bundle); } catch {}
if (failed) process.exit(1);
