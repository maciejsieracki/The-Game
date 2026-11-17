'use strict';
/**
 * unit-replace-archer-slinger-test.cjs -- R-WEB-DATA-REPLACE-ARCHER-TO-SLINGER-Q1
 * Łucznik (Kamień, Typ=Distance) może zostać zastąpiony przez Procarza (Brąz, Typ=Slinger)
 * w mechanizmie "Zastąp" (gracz i AI, te same reguły). Run from gra/:
 *   node tools/unit-replace-archer-slinger-test.cjs
 *
 * Testuje REALNE funkcje (availableReplacementsFor z production.ts, bundlowane esbuild-em)
 * na REALNYM data/units.json. Bez regexów po źródle.
 *   1. Brąz + koszary + drewno: Łucznik -> zawiera Procarz, koszt > 0.
 *   2. Kamień (Procarz niedostępny epoką): Łucznik -> NIE zawiera Procarza.
 *   3. Inkowie w Brązie: Łucznik -> zawiera Procarz (Huaracoc); Rzym -> nie zawiera Huaracoc.
 *   4. Brak drewna w magazynie (bramka surowca) -> Procarz znika.
 *   5. Mutacja KOPII danych (pole Łucznika cofnięte do "—") -> Procarz znika.
 *   6. Kierunek jednokierunkowy: Procarz -> Łucznik NIE jest zamiennikiem.
 *   7. Brąz BEZ Koszar: Procarz niedostępny (bramka budynku).
 *   8. Ścieżka AI: promoteAiUnitForEra (ta sama tabela, te same bramki co gracz) awansuje
 *      Łucznika na Procarza w Brązie z pełnym kosztem; w Kamieniu nie; klasa armii zachowana.
 *   9. Narodowi łucznicy Kamienia (egipski, sumeryjski) -> Procarz w Brązie (wpis w units.json).
 *  10. Ścieżka AI dla egipskiego i sumeryjskiego (te same reguły co gracz).
 *  11. R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1 r2: nubijski, akadyjski, asyryjski
 *      (Brąz) i Oszczepnik (Estólica) (Inkowie) -> Procarz; mutacja kopii; AI nubijskiego (Brąz->Brąz)
 *      zapisany jako DECISION_REQUIRED (obecna reguła AI wymaga wzrostu epoki).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[unit-replace-archer-slinger-test] esbuild not found. Run: npm ci (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.unit-replace-archer-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.unit-replace-archer-bundle.cjs');
fs.writeFileSync(ENTRY_FILE,
  "export { availableReplacementsFor } from '../src/game/production';\n" +
  "export { promoteAiUnitForEra } from '../src/game/ai-era-unit-promotion';\n" +
  "export { aiReplaceKeepsArmyClass } from '../src/game/ai-unit-replace-plan';\n", 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE_FILE, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[unit-replace-archer-slinger-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}
const { availableReplacementsFor, promoteAiUnitForEra, aiReplaceKeepsArmyClass } = require(BUNDLE_FILE);
const unitsJson = require('../data/units.json');

let passed = 0, failed = 0;
function check(cond, msg, extra) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + (extra ? ' -- ' + extra : '')); }
}
const TECHS = ['Łucznictwo', 'Brązownictwo', 'Hutnictwo żelaza'];
const idsOf = (data, unit, ctx) =>
  availableReplacementsFor(unit, data, TECHS, ctx).map(i => i.id);

const baseCtx = (epoch, nacja, drewno = 10) => ({
  epoch,
  civUnitNacja: nacja,
  civBonusy: [],
  builtBuildingIds: epoch >= 2 ? ['koszary'] : [],
  empireResourceStock: { braz: 10, zelazo: 10, drewno },
});

const DATA = { buildings: [], units: Object.values(unitsJson) };

console.log('\n[unit-replace-archer-slinger-test] Running tests...\n');

console.log('1. Brąz: Łucznik -> Procarz');
{
  const items = availableReplacementsFor('Łucznik', DATA, TECHS, baseCtx(2, 'Rzym'));
  const procarz = items.find(i => i.id === 'Procarz');
  check(!!procarz, 'Procarz jest na liście zamienników Łucznika w epoce Brązu', JSON.stringify(items.map(i => i.id)));
  check(!!procarz && procarz.kind === 'jednostka' && typeof procarz.koszt === 'number' && procarz.koszt > 0,
    'Procarz ma kind=jednostka i dodatni pełny koszt', JSON.stringify(procarz));
}

console.log('2. Kamień: Procarz niedostępny epoką');
{
  const ids = idsOf(DATA, 'Łucznik', baseCtx(1, 'Rzym'));
  check(!ids.includes('Procarz'), 'w epoce Kamienia Procarz NIE jest zamiennikiem Łucznika', JSON.stringify(ids));
}

console.log('3. Nacja: Procarz (Huaracoc) tylko dla Inków');
{
  const inca = idsOf(DATA, 'Łucznik', baseCtx(2, 'Inkowie'));
  const rome = idsOf(DATA, 'Łucznik', baseCtx(2, 'Rzym'));
  check(inca.includes('Procarz (Huaracoc)'), 'Inkowie w Brązie: Procarz (Huaracoc) na liście', JSON.stringify(inca));
  check(!rome.includes('Procarz (Huaracoc)'), 'Rzym: Procarz (Huaracoc) NIE jest na liście');
}

console.log('4. Bramka surowca: brak drewna -> brak Procarza');
{
  const ids = idsOf(DATA, 'Łucznik', baseCtx(2, 'Rzym', 0));
  check(!ids.includes('Procarz'), 'bez drewna w magazynie Procarz znika z listy (bramka surowca)');
}

console.log('5. Mutacja kopii danych: pole Łucznika cofnięte do "—"');
{
  const mutated = unitsJson.map(u => (u.Jednostka === 'Łucznik' ? { ...u, 'Zastąp specjalnie': '—' } : u));
  const ids = idsOf({ buildings: [], units: mutated }, 'Łucznik', baseCtx(2, 'Rzym'));
  check(!ids.includes('Procarz'), 'po cofnięciu wpisu (mutacja kopii) Procarz znika -- test wykrywa usunięcie zmiany');
}

console.log('6. Kierunek jednokierunkowy');
{
  const ids = idsOf(DATA, 'Procarz', baseCtx(2, 'Rzym'));
  check(!ids.includes('Łucznik'), 'Procarz NIE może zostać zamieniony z powrotem na Łucznika');
}

console.log('7. Brąz bez Koszar: Procarz niedostępny (bramka budynku)');
{
  const ids = idsOf(DATA, 'Łucznik', { ...baseCtx(2, 'Rzym'), builtBuildingIds: [] });
  check(!ids.includes('Procarz'), 'w Brązie bez Koszar Procarz NIE jest zamiennikiem', JSON.stringify(ids));
}

const EPOCH_NUM = { 'Kamień': 1, 'Brąz': 2, 'Żelazo': 3 };
function aiPromote(unitName, ctx, treasury0) {
  const pool = { ...ctx.empireResourceStock };
  const state = { treasury: treasury0 };
  const unit = { typeId: unitName, category: 'Standardowa', hp: 20, hpMax: 20, ruchLeft: 2, replaceUsedThisTurn: false };
  const defOf = id => unitsJson.find(u => u.Jednostka === id);
  const ok = promoteAiUnitForEra(unit, {
    oldDefinition: u => defOf(u.typeId),
    candidates: u => availableReplacementsFor(u.typeId, DATA, TECHS, ctx).map(i => defOf(i.id)).filter(Boolean),
    newestSameRole: (u, cands) => cands.reduce((best, c) => (!best || EPOCH_NUM[c.Epoka] > EPOCH_NUM[best.Epoka] ? c : best), null),
    epochNumber: e => EPOCH_NUM[e] ?? 0,
    unitCost: id => Number(defOf(id)['Pieniądz (koszt)']) || 0,
    stockCost: t => ({ [t['Surowiec']]: Number(t['Surowiec (ilość)']) || 0 }),
    canPayStock: cost => Object.entries(cost).every(([r, n]) => (pool[r] ?? 0) >= n),
    payStock: cost => { for (const [r, n] of Object.entries(cost)) pool[r] -= n; },
    currentTreasury: () => state.treasury,
    setTreasury: v => { state.treasury = v; },
    oldMaxHp: (u, d) => Number(d.health) || 20,
    newMaxHp: t => Number(t.health) || 20,
    category: () => 'Standardowa',
  });
  return { ok, typeId: unit.typeId, treasury: state.treasury, drewno: pool.Drewno };
}

console.log('8. Ścieżka AI: promoteAiUnitForEra awansuje Łucznika na Procarza (te same reguły co gracz)');
{
  const ctx = { ...baseCtx(2, 'Rzym'), empireResourceStock: { braz: 10, zelazo: 10, Drewno: 100, drewno: 100 } };
  const r = aiPromote('Łucznik', ctx, 100);
  check(r.ok && r.typeId === 'Procarz', 'AI w Brązie: Łucznik -> Procarz (promoteAiUnitForEra zwraca ok)', JSON.stringify(r));
  check(r.ok && r.treasury === 96, 'AI płaci pełny koszt Pieniądza Procarza (100 - 4 = 96)', String(r.treasury));
  check(r.ok && r.drewno === 75, 'AI płaci pełny koszt surowca Procarza (drewno 100 - 25 = 75)', String(r.drewno));
  const k = aiPromote('Łucznik', { ...baseCtx(1, 'Rzym'), empireResourceStock: { Drewno: 100, drewno: 100 } }, 100);
  check(!k.ok && k.typeId === 'Łucznik', 'AI w Kamieniu: brak awansu na Procarza (Procarz niedostępny)', JSON.stringify(k));
  check(aiReplaceKeepsArmyClass(unitsJson.find(u => u.Jednostka === 'Łucznik'), unitsJson.find(u => u.Jednostka === 'Procarz')),
    'klasa armii: Łucznik (Distance) -> Procarz (Slinger) zachowuje klasę „dystans”');
}

console.log('9. Narodowi łucznicy Kamienia (egipski, sumeryjski) -> Procarz (R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1)');
{
  const egi = idsOf(DATA, 'Łucznik egipski', baseCtx(2, 'Egipt'));
  check(egi.includes('Procarz'), 'Łucznik egipski w Brązie: Procarz jest na liście zamienników', JSON.stringify(egi));
  const egiKam = idsOf(DATA, 'Łucznik egipski', baseCtx(1, 'Egipt'));
  check(!egiKam.includes('Procarz'), 'Łucznik egipski w Kamieniu: Procarz niedostępny epoką', JSON.stringify(egiKam));
  const sum = idsOf(DATA, 'Łucznik sumeryjski', baseCtx(2, 'Sumer'));
  check(sum.includes('Procarz'), 'Łucznik sumeryjski w Brązie: Procarz jest na liście zamienników', JSON.stringify(sum));
  const egiCost = availableReplacementsFor('Łucznik egipski', DATA, TECHS, baseCtx(2, 'Egipt')).find(i => i.id === 'Procarz');
  check(!!egiCost && egiCost.koszt > 0, 'Łucznik egipski -> Procarz: pełny koszt > 0', JSON.stringify(egiCost));
  const mutated = unitsJson.map(u => (u.Jednostka === 'Łucznik egipski' ? { ...u, 'Zastąp specjalnie': '—' } : u));
  const egiMut = idsOf({ buildings: [], units: mutated }, 'Łucznik egipski', baseCtx(2, 'Egipt'));
  check(!egiMut.includes('Procarz'), 'mutacja kopii (pole Łucznika egipskiego cofnięte do "—") -> Procarz znika');
}

console.log('11. Narodowi łucznicy Brązu (nubijski, akadyjski, asyryjski) i Oszczepnik (Estólica) -> Procarz (odpowiedź właściciela 2026-11-17)');
{
  const nub = idsOf(DATA, 'Łucznik nubijski', baseCtx(2, 'Egipt'));
  check(nub.includes('Procarz'), 'Łucznik nubijski w Brązie: Procarz jest na liście zamienników', JSON.stringify(nub));
  const akad = idsOf(DATA, 'Łucznik akadyjski', baseCtx(2, 'Sumer'));
  check(akad.includes('Procarz'), 'Łucznik akadyjski w Brązie: Procarz jest na liście zamienników', JSON.stringify(akad));
  const asyr = idsOf(DATA, 'Łucznik asyryjski', baseCtx(2, 'Asyria'));
  check(asyr.includes('Procarz'), 'Łucznik asyryjski w Brązie: Procarz jest na liście zamienników', JSON.stringify(asyr));
  const nubCost = availableReplacementsFor('Łucznik nubijski', DATA, TECHS, baseCtx(2, 'Egipt')).find(i => i.id === 'Procarz');
  check(!!nubCost && nubCost.koszt > 0, 'Łucznik nubijski -> Procarz: pełny koszt > 0', JSON.stringify(nubCost));
  const nubNoKoszary = idsOf(DATA, 'Łucznik nubijski', { ...baseCtx(2, 'Egipt'), builtBuildingIds: [] });
  check(!nubNoKoszary.includes('Procarz'), 'Łucznik nubijski bez Koszar: Procarz niedostępny (bramka budynku)');
  const mutNub = unitsJson.map(u => (u.Jednostka === 'Łucznik nubijski' ? { ...u, 'Zastąp specjalnie': '—' } : u));
  check(!idsOf({ buildings: [], units: mutNub }, 'Łucznik nubijski', baseCtx(2, 'Egipt')).includes('Procarz'),
    'mutacja kopii (pole Łucznika nubijskiego cofnięte do "—") -> Procarz znika');
  // Oszczepnik (Estólica) = dystansowa jednostka Inków (Kamień, Specjalna): Procarz standard + Huaracoc (Inkowie)
  const est = idsOf(DATA, 'Oszczepnik (Estólica)', baseCtx(2, 'Inkowie'));
  check(est.includes('Procarz') && est.includes('Procarz (Huaracoc)'),
    'Oszczepnik (Estólica) w Brązie (Inkowie): Procarz i Procarz (Huaracoc) na liście', JSON.stringify(est));
  const estKam = idsOf(DATA, 'Oszczepnik (Estólica)', baseCtx(1, 'Inkowie'));
  check(!estKam.includes('Procarz'), 'Oszczepnik (Estólica) w Kamieniu: Procarz niedostępny epoką', JSON.stringify(estKam));
  const estRome = idsOf(DATA, 'Oszczepnik (Estólica)', baseCtx(2, 'Rzym'));
  check(estRome.includes('Procarz') && !estRome.includes('Procarz (Huaracoc)'),
    'Oszczepnik (Estólica) w Rzymie: Procarz tak, Procarz (Huaracoc) nie (nacja Inkowie)', JSON.stringify(estRome));
  // Procarz (Huaracoc) nie jest zamiennikiem Estólicy poza Inkami (gating nacji)
  check(!estRome.includes('Procarz (Huaracoc)'), 'Huaracoc nie wchodzi do listy dla nacji spoza Inków');
  // AI (DECISION_REQUIRED): promoteAiUnitForEra wymaga WZROSTU epoki; Brąz->Brąz nie awansuje AI.
  // Stan obecny zapisany tu jawnie; po decyzji właściciela (AI same-epoch) zmienić asercję.
  const aiNub = aiPromote('Łucznik nubijski', { ...baseCtx(2, 'Egipt'), empireResourceStock: { braz: 10, zelazo: 10, Drewno: 100, drewno: 100 } }, 100);
  check(!aiNub.ok && aiNub.typeId === 'Łucznik nubijski',
    'DECISION_REQUIRED (AI same-epoch): AI nubijski w Brązie NIE awansuje wg obecnej reguły epoki (promoteAiUnitForEra)', JSON.stringify(aiNub));
  // AI dla Estólicy (Kamień -> Brąz): wzrost epoki, awans dozwolony
  const aiEst = aiPromote('Oszczepnik (Estólica)', { ...baseCtx(2, 'Inkowie'), empireResourceStock: { braz: 10, zelazo: 10, Drewno: 100, drewno: 100 } }, 100);
  check(aiEst.ok, 'AI Oszczepnik (Estólica) Kamień -> Brąz: awans dozwolony (wzrost epoki)', JSON.stringify(aiEst));
}

console.log('10. Ścieżka AI dla narodowych łuczników Kamienia (egipski, sumeryjski): te same reguły co gracz');
{
  const ctxEgi = { ...baseCtx(2, 'Egipt'), empireResourceStock: { braz: 10, zelazo: 10, Drewno: 100, drewno: 100 } };
  const rEgi = aiPromote('Łucznik egipski', ctxEgi, 100);
  check(rEgi.ok && rEgi.typeId === 'Procarz', 'AI w Brązie: Łucznik egipski -> Procarz (promoteAiUnitForEra zwraca ok)', JSON.stringify(rEgi));
  check(rEgi.ok && rEgi.treasury === 96, 'AI płaci pełny Pieniądz Procarza przy zamianie egipskiego (100 - 4 = 96)', String(rEgi.treasury));
  check(rEgi.ok && rEgi.drewno === 75, 'AI płaci pełny surowiec Procarza przy zamianie egipskiego (drewno 100 - 25 = 75)', String(rEgi.drewno));
  const rEgiKam = aiPromote('Łucznik egipski', { ...baseCtx(1, 'Egipt'), empireResourceStock: { Drewno: 100, drewno: 100 } }, 100);
  check(!rEgiKam.ok && rEgiKam.typeId === 'Łucznik egipski', 'AI w Kamieniu: brak awansu Łucznika egipskiego na Procarza (epoka)', JSON.stringify(rEgiKam));
  const ctxSum = { ...baseCtx(2, 'Sumer'), empireResourceStock: { braz: 10, zelazo: 10, Drewno: 100, drewno: 100 } };
  const rSum = aiPromote('Łucznik sumeryjski', ctxSum, 100);
  check(rSum.ok && rSum.typeId === 'Procarz', 'AI w Brązie: Łucznik sumeryjski -> Procarz (promoteAiUnitForEra zwraca ok)', JSON.stringify(rSum));
  check(rSum.ok && rSum.treasury === 96 && rSum.drewno === 75, 'AI płaci pełny koszt Procarza przy zamianie sumeryjskiego (Pieniądz 96, drewno 75)', JSON.stringify(rSum));
  const rSumKam = aiPromote('Łucznik sumeryjski', { ...baseCtx(1, 'Sumer'), empireResourceStock: { Drewno: 100, drewno: 100 } }, 100);
  check(!rSumKam.ok && rSumKam.typeId === 'Łucznik sumeryjski', 'AI w Kamieniu: brak awansu Łucznika sumeryjskiego na Procarza', JSON.stringify(rSumKam));
}

console.log(`\n[unit-replace-archer-slinger-test] ${passed} OK, ${failed} FAIL`);
try { fs.unlinkSync(ENTRY_FILE); fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }
process.exit(failed ? 1 : 0);
