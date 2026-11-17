/** node gra/tools/ambush-core-test.cjs — R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 (runda 1: stan, blokady, widoczność, wyzwalacz) */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(__dirname, '.ambush-core-entry.ts');
const BUNDLE = path.join(__dirname, '.ambush-core-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  AMBUSH_FORMATION_MAX_WIDTH,
  AMBUSH_BLOCK_MESSAGES,
  canSetAmbush,
  setAmbush,
  cancelAmbush,
  isUnitAmbushed,
  isStackAmbushed,
  isUnitVisibleToViewer,
  unitsVisibleToViewer,
  isHexOccupiedForViewer,
  resolveAmbushTrigger,
  normalizeAmbushField,
  reconcileAmbush,
} from '../src/game/ambush';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: ROOT,
  logLevel: 'silent',
});

const M = require(BUNDLE);
fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

function unit(over) {
  return Object.assign({
    id: 'u', ownerId: 0, typeId: 'Piechota', category: 'piechota',
    q: 3, r: 4, ruch: 4, ruchLeft: 4, isGeneral: true,
  }, over);
}

const NO_CTX = { cityOnHex: false, inBattle: false };
const WAR = (a, b) => a !== b && (a + b) % 2 === 1; // deterministyczna „wojna” do testów
const PEACE = () => false;

console.log('== 1. Stan zasadzki w jednostce i zgodność wsteczna');
{
  const u = unit({});
  ok(M.isUnitAmbushed(u) === false, 'brak pola ambush = brak zasadzki (stary zapis)');
  const legacy = JSON.parse(JSON.stringify(unit({ id: 'old' })));
  ok(M.isUnitAmbushed(legacy) === false, 'stary zapis (JSON bez pola) ładuje się bez zasadzki');
  const stack = [unit({ id: 'a' }), unit({ id: 'b', ruchLeft: 2 })];
  M.setAmbush(stack);
  ok(stack.every(x => x.ambush === true), 'setAmbush ustawia pole na całym stosie');
  ok(stack.every(x => x.ruchLeft === 0), 'setAmbush zeruje całą pulę ruchu stosu');
  const saved = JSON.parse(JSON.stringify(stack));
  ok(saved.every(x => x.ambush === true), 'stan zasadzki przeżywa serializację JSON (zapis)');
  const copy = JSON.parse(JSON.stringify(stack))[0];
  copy.ruchLeft = 99;
  ok(stack[0].ruchLeft === 0, 'mutacja KOPII nie zmienia oryginału (kopia niezależna)');
  M.cancelAmbush(stack);
  ok(stack.every(x => M.isUnitAmbushed(x) === false), 'cancelAmbush zdejmuje stan');
  ok(stack.every(x => !('ambush' in x)), 'cancelAmbush usuwa pole (brak śladu w zapisie)');
}

console.log('== 2. canSetAmbush — powody blokad po polsku');
{
  const ok1 = M.canSetAmbush([unit({})], NO_CTX);
  ok(ok1.ok === true, 'zwykła armia poza miastem z ruchem może zastawić');
  const city = M.canSetAmbush([unit({})], { cityOnHex: true, inBattle: false });
  ok(city.ok === false && city.reason === 'in-city' && city.message.length > 0, 'w mieście: blokada in-city z komunikatem');
  const siege = M.canSetAmbush([unit({ oblegaCityId: 'c1' })], NO_CTX);
  ok(siege.ok === false && siege.reason === 'besieging', 'oblegająca armia: blokada besieging');
  const zero = M.canSetAmbush([unit({ ruchLeft: 0 })], NO_CTX);
  ok(zero.ok === false && zero.reason === 'no-movement', '0 ruchu: blokada no-movement');
  const battle = M.canSetAmbush([unit({})], { cityOnHex: false, inBattle: true });
  ok(battle.ok === false && battle.reason === 'in-battle', 'w bitwie: blokada in-battle');
  const already = M.canSetAmbush([unit({ ambush: true, ruchLeft: 0 })], NO_CTX);
  ok(already.ok === false && already.reason === 'already-ambushed', 'już w zasadzce: blokada already-ambushed');
  const empty = M.canSetAmbush([], NO_CTX);
  ok(empty.ok === false && empty.reason === 'empty', 'pusty stos: blokada empty');
  // Kolejność: miasto ma pierwszeństwo przed brakiem ruchu (komunikat trafny).
  const both = M.canSetAmbush([unit({ ruchLeft: 0 })], { cityOnHex: true, inBattle: false });
  ok(both.ok === false && both.reason === 'in-city', 'kolejność powodów: miasto przed brakiem ruchu');
}

console.log('== 2b. Zasadzka wymaga generała (decyzja właściciela 2026-11-17)');
{
  const noGen = M.canSetAmbush([unit({ isGeneral: false })], NO_CTX);
  ok(noGen.ok === false && noGen.reason === 'no-general', 'armia BEZ generała: blokada no-general');
  ok(noGen.message === 'Zasadzkę może zastawić tylko armia z generałem.', 'komunikat PL: „Zasadzkę może zastawić tylko armia z generałem.”');
  const undefGen = M.canSetAmbush([unit({ isGeneral: undefined })], NO_CTX);
  ok(undefGen.ok === false && undefGen.reason === 'no-general', 'brak pola isGeneral = nie generał (blokada)');
  const withGen = M.canSetAmbush([unit({ isGeneral: false }), unit({ id: 'g', isGeneral: true })], NO_CTX);
  ok(withGen.ok === true, 'stos z generałem (jednym z wielu) może zastawić');
  const genAlone = M.canSetAmbush([unit({ isGeneral: true })], NO_CTX);
  ok(genAlone.ok === true, 'sam generał może zastawić');
  const noGenCity = M.canSetAmbush([unit({ isGeneral: false })], { cityOnHex: true, inBattle: false });
  ok(noGenCity.reason === 'no-general', 'kolejność: brak generała ma pierwszeństwo przed miastem');
  // Cykl zycia: generał zniknął z zastawionego stosu -> zasadzka wygasa dla calego stosu.
  const gone = [unit({ id: 'k', isGeneral: false, ambush: true, ambushAt: '3,4,0' })];
  const cleared = M.reconcileAmbush(gone, () => false);
  ok(cleared === 1 && gone[0].ambush === undefined, 'generał odszedł, zostały tylko zwykłe jednostki: zasadzka zdjęta');
  const keep = [unit({ id: 'g', isGeneral: true, ambush: true, ambushAt: '3,4,0' }), unit({ id: 'k', isGeneral: false, ambush: true, ambushAt: '3,4,0' })];
  M.reconcileAmbush(keep, () => false);
  ok(keep.every(x => x.ambush === true), 'generał obecny w zastawionym stosie: zasadzka trwa dla całego stosu');
}

console.log('== 3. Widoczność: wróg nie widzi, właściciel widzi');
{
  const mine = unit({ id: 'mine', ownerId: 0, ambush: true, q: 1, r: 1 });
  const enemy = unit({ id: 'en', ownerId: 1, q: 9, r: 9 });
  ok(M.isUnitVisibleToViewer(mine, 0) === true, 'właściciel widzi własną zasadzkę');
  ok(M.isUnitVisibleToViewer(mine, 1) === false, 'AI (właściciel 1) NIE widzi zasadzki gracza');
  ok(M.isUnitVisibleToViewer(mine, 2) === false, 'inny właściciel (państwo-miasto/barbarzyńca) nie widzi zasadzki');
  ok(M.isUnitVisibleToViewer(enemy, 0) === true, 'zwykła jednostka wroga widoczna');
  const list = M.unitsVisibleToViewer([mine, enemy], 1);
  ok(list.length === 1 && list[0].id === 'en', 'lista dla AI odfiltrowuje zasadzkę gracza');
  const listOwner = M.unitsVisibleToViewer([mine, enemy], 0);
  ok(listOwner.length === 2, 'lista dla właściciela zawiera zasadzkę');
}

console.log('== 4. Pathfinding wroga: heks zasadzki jest wolny');
{
  const units = [unit({ id: 'mine', ownerId: 0, ambush: true, q: 2, r: 2 })];
  ok(M.isHexOccupiedForViewer(units, 2, 2, 1) === false, 'dla AI heks zasadzki jest pusty (pathfinding wroga)');
  ok(M.isHexOccupiedForViewer(units, 2, 2, 0) === true, 'dla właściciela heks zajęty (własna armia)');
  const plain = [unit({ id: 'p', ownerId: 0, q: 2, r: 2 })];
  ok(M.isHexOccupiedForViewer(plain, 2, 2, 1) === true, 'zwykła armia gracza nadal blokuje heks dla AI');
}

console.log('== 5. Wyzwalacz: tylko wróg w wojnie, przy wejściu NA heks');
{
  const mk = () => [
    unit({ id: 'a1', ownerId: 0, ambush: true, ruchLeft: 0, q: 5, r: 5 }),
    unit({ id: 'a2', ownerId: 0, ambush: true, ruchLeft: 0, q: 5, r: 5 }),
  ];
  const pokój = mk();
  const rPeace = M.resolveAmbushTrigger(pokój, 5, 5, 1, PEACE);
  ok(rPeace.triggered === false, 'w pokoju wróg NIE uruchamia zasadzki');
  ok(pokój.every(u => u.ambush === true), 'w pokoju stan zasadzki nietknięty');

  const wojna = mk();
  const rWar = M.resolveAmbushTrigger(wojna, 5, 5, 1, WAR);
  ok(rWar.triggered === true && rWar.ambushOwnerId === 0, 'wróg w wojnie wchodzący na heks uruchamia zasadzkę');
  ok(rWar.revealed.length === 2, 'wyzwolenie ujawnia cały stos zasadzki na heksie');
  ok(wojna.every(u => u.ambush === undefined), 'po wyzwoleniu stan zasadzki zdjęty');

  const sasiad = mk();
  sasiad.push(unit({ id: 'obok', ownerId: 1, q: 6, r: 5 }));
  const rNb = M.resolveAmbushTrigger(sasiad, 6, 5, 1, WAR);
  ok(rNb.triggered === false, 'wróg STOJĄCY OBOK (nie na heksie zasadzki) nie uruchamia zasadzki');

  const swój = mk();
  const rOwn = M.resolveAmbushTrigger(swój, 5, 5, 0, WAR);
  ok(rOwn.triggered === false, 'własny ruch nie uruchamia zasadzki');
  ok(swój.every(u => u.ambush === true), 'brak wyzwolenia = brak mutacji');

  // Mutant „bez sprawdzenia ownerId != moverOwnerId": isAtWar zawsze true, a ruch jest WŁASNY.
  const swój2 = mk();
  const rOwn2 = M.resolveAmbushTrigger(swój2, 5, 5, 0, () => true);
  ok(rOwn2.triggered === false, 'własny ruch NIE uruchamia zasadzki nawet gdy isAtWar zawsze true');
  ok(swój2.every(u => u.ambush === true), 'własny ruch przy isAtWar=true: brak mutacji');
}

console.log('== 6. Odrzucone wejścia i wiele zasadzek (pod warunkiem, że nie ma wyzwalacza)');
{
  const units = [unit({ id: 'x', ownerId: 0, q: 0, r: 0 })];
  const r = M.resolveAmbushTrigger(units, 0, 0, 1, WAR);
  ok(r.triggered === false && r.revealed.length === 0, 'heks bez zasadzki: brak wyzwolenia');
}

console.log('== 7. normalizeAmbushField — śmieci w polu nie tworzą zasadzki');
{
  const u = { ambush: null };
  M.normalizeAmbushField(u);
  ok(!('ambush' in u), 'null w polu zamieniony na brak pola');
  const v = { ambush: true };
  ok(M.normalizeAmbushField(v) === false && v.ambush === true, 'prawdziwa zasadzka zostaje nietknięta');
}

console.log('== 8. Stałe');
{
  ok(M.AMBUSH_FORMATION_MAX_WIDTH === 3, 'maksymalna szerokość długiej linii = 3');
  ok(M.isStackAmbushed([unit({ ambush: true }), unit({})]) === true, 'stos z jedną zasadzką liczy się jako zasadzka');
}

console.log(`\nWynik: ${pass} OK, ${fail} FAIL`);
if (fail > 0) process.exit(1);
