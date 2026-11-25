'use strict';
/**
 * unit-replace-multitype-walk-test.cjs -- R-WEB-UNIT-REPLACE-MULTITYPE-WALK-ALL-GROUPS-Q2
 * "Zastap" przy zaznaczeniu RoZNYCH typow w armii przechodzi PO KOLEI przez wszystkie typy:
 * kazdy typ z zamiennikiem dostaje swoj modal; typy bez zamiennika sa nazwane w komunikacie;
 * "Pomin ten typ" idzie dalej; Zakoncz/Esc przerywa caly lancuch i mowi, ile zostalo.
 * Test STANU (bez regexow po zrodle): wycinamy funkcje z main.ts, uruchamiamy je w vm ze stubami
 * i wywolujemy callbacki modali tak, jak klikalby gracz.
 * Run z gra/:  node tools/unit-replace-multitype-walk-test.cjs
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');

let passed = 0; let failed = 0;
function assert(ok, label) { if (ok) { passed++; console.log('  [OK] ' + label); } else { failed++; console.error('  [FAIL] ' + label); } }

/** Wytnij funkcje `name` (4 spacje wciecia w main.ts) do zamykajacego "\n    }\n". */
function extractFn(src, name) {
  const start = src.indexOf('    function ' + name + '(');
  if (start < 0) throw new Error('brak funkcji ' + name);
  const end = src.indexOf('\n    }\n', start);
  return src.slice(start, end + 7);
}
function toJs(ts) { return esbuild.transformSync(ts, { loader: 'ts', target: 'node18' }).code; }

const NAMES = [
  'pickedUnitsOnStack', 'unitReplaceTargetsOnStack', 'unitReplaceEligible',
  'openUnitReplaceForSelection', 'unitReplaceGroupLabel', 'unitReplaceSkipNote',
  'unitReplaceHasPending', 'unitReplaceHintWithTail', 'unitReplaceChainStopped', 'openUnitReplaceGroupPicker',
];
const src = NAMES.map(n => extractFn(main, n)).join('\n');

// Zastepcze definicje (zamiennik = typ z tabeli; pusta lista = bez zamiennika).
const REPL = { Wojownik: ['Wlocznik'], Konnica: ['Rydwan'], Procarz: [], Zwiadowca: [] };

function makeRun(stack, pickedIds) {
  const modals = []; const hints = []; const singles = []; const performed = [];
  const ctx = {
    // R-WEB-HUD-ME-RESIDUAL-Q1 r2: funkcje z main.ts czytaja ME() (gracz aktywny); stub = fotel jednoosobowy 0.
    ME: () => 0,
    playerStackAt: () => stack,
    stackPickState: { key: 'k', ids: new Set(pickedIds) },
    armyPickKey: () => 'k',
    isUnitInPlayerTerritory: () => true,
    computeUnitReplacements: (u) => (REPL[u.typeId] || []).map(id => ({ id, nazwa: id })),
    sortByUnitPowerDescending: (a) => a,
    lookupUnitDef: () => ({}),
    unitIconSvg: () => '',
    unitReplaceFullCost: () => ({ money: 0, stock: {} }),
    replaceUnitMoneyCost: () => 0,
    unitReplaceCostTimes: () => ({ money: 0, stock: {} }),
    unitReplaceAffordableCount: (d, id, n) => n,
    unitReplaceStockText: () => '',
    unitStockShortfallLabel: () => null,
    superUnitLimitViolation: () => null,
    reservedUnitTypeNamesForOwner: () => [],
    unitReplaceCtx: () => ({ empireResourceStock: {} }),
    ownerSurowcePoolFor: () => ({}),
    unitReplaceStockMissingLabel: () => null,
    unitAtak: () => 0, unitObrona: () => 0, effectiveMaxHp: () => 0, unitHealth: () => 0,
    unitParametryBonusFrac: () => 0, veteranCombatBonusFrac: () => 0,
    player: { skarbiec: 1000 },
    showUnitReplacePicker: (o) => { modals.push(o); },
    showHintMessage: (m) => { hints.push(m); },
    openUnitReplacePicker: (u) => { singles.push(u.id); },
    performUnitReplace: (id, newType) => {
      performed.push(id + '>' + newType);
      const u = stack.find(x => x.id === id);
      if (u) u.replaceUsedThisTurn = true;
      return true;
    },
  };
  vm.createContext(ctx);
  vm.runInContext(toJs(src) + '\nthis.openSel = openUnitReplaceForSelection;', ctx);
  return { ctx, modals, hints, singles, performed };
}

function mkStack() {
  // Wojownik x3 (zwykli), Wojownik-wódz, Procarz x2 (bez zamiennika), Konnica x1, Zwiadowca x1 (bez zamiennika).
  return [
    { id: 'a1', typeId: 'Wojownik', ownerId: 0, isGeneral: false, q: 0, r: 0 },
    { id: 'a2', typeId: 'Wojownik', ownerId: 0, isGeneral: false, q: 0, r: 0 },
    { id: 'a3', typeId: 'Wojownik', ownerId: 0, isGeneral: false, q: 0, r: 0 },
    { id: 'g1', typeId: 'Wojownik', ownerId: 0, isGeneral: true, q: 0, r: 0 },
    { id: 'p1', typeId: 'Procarz', ownerId: 0, isGeneral: false, q: 0, r: 0 },
    { id: 'p2', typeId: 'Procarz', ownerId: 0, isGeneral: false, q: 0, r: 0 },
    { id: 'k1', typeId: 'Konnica', ownerId: 0, isGeneral: false, q: 0, r: 0 },
    { id: 'z1', typeId: 'Zwiadowca', ownerId: 0, isGeneral: false, q: 0, r: 0 },
  ];
}
const ALL = ['a1', 'a2', 'a3', 'g1', 'p1', 'p2', 'k1', 'z1'];

console.log('\n== A. przejscie przez WSZYSTKIE typy (pick, skip, pick) ==');
{
  const stack = mkStack();
  const run = makeRun(stack, ALL);
  run.ctx.openSel(stack[0]);
  assert(run.modals.length === 1, 'po "Zastap" otwiera sie modal dla pierwszego typu z zamiennikiem');
  const m1 = run.modals[0];
  assert(m1 && m1.groupLabel === 'grupa 1/3', 'pasek: grupa 1/3 (3 typy z zamiennikiem: Wojownik, wodz, Konnica)');
  assert(m1 && typeof m1.note === 'string' && m1.note.includes('Bez zamiennika: Procarz ×2, Zwiadowca'),
    'typy bez zamiennika wymienione po nazwie w komunikacie (Procarz ×2, Zwiadowca)');
  assert(m1 && typeof m1.onSkip === 'function', 'modal ma "Pomin ten typ" (onSkip)');

  m1.onPick('Wlocznik');
  assert(run.performed.filter(x => x.endsWith('>Wlocznik')).length === 3, 'zamiana grupy 1: wszystkie 3 zwykle Wojownicy');
  assert(run.modals.length === 2, 'po zamianie grupy 1 OD RAZU kolejny modal (grupa 2)');
  const m2 = run.modals[1];
  assert(m2 && m2.groupLabel === 'grupa 2/3' && m2.unitName.includes('Wódz') === true, 'grupa 2/3 to wodz (osobno, jak dotad)');

  // Grupa 2 (wodz) - zaznaczenie NIE znika po zamianie grupy 1: wodz nadal dostaje swoj modal i zamiane.
  m2.onSkip();
  assert(run.modals.length === 3 && run.modals[2].groupLabel === 'grupa 3/3', 'Pomin ten typ przechodzi do grupy 3/3');
  assert(run.performed.indexOf('g1>Wlocznik') === -1, 'Pomin nie zamienia wodza');

  run.modals[2].onPick('Rydwan');
  assert(run.performed.includes('k1>Rydwan'), 'grupa 3 (Konnica): zamiana dostaje swoja jednostke');
  assert(run.modals.length === 3, 'po ostatniej grupie nie ma kolejnego modala');
  const last = run.hints[run.hints.length - 1] || '';
  assert(last.includes('Bez zamiennika: Procarz ×2, Zwiadowca'), 'koncowy komunikat nadal wymienia typy bez zamiennika');
  // Regresja (zarzut Evaluatora 3): uwaga koncowa NIE nadpisuje toastu podsumowania ostatniej zamiany.
  assert(last.includes('Zastąp: Konnica → Rydwan') && last.includes('Bez zamiennika'),
    'ostatni toast niesie jednoczesnie podsumowanie zamiany i uwage o typach bez zamiennika');
}

console.log('\n== B. Pomin wszystkie typy -> brak zamian, komunikat o brakach ==');
{
  const stack = mkStack();
  const run = makeRun(stack, ALL);
  run.ctx.openSel(stack[0]);
  run.modals[0].onSkip();
  run.modals[1].onSkip();
  run.modals[2].onSkip();
  assert(run.performed.length === 0, 'same Pomin: nic nie zamienione');
  assert(run.modals.length === 3, 'same Pomin: kazdy typ z zamiennikiem dostal swoj modal (3)');
  const last = run.hints[run.hints.length - 1] || '';
  assert(last.includes('Bez zamiennika'), 'po przejsciu calosci: typy bez zamiennika nadal nazwane');
}

console.log('\n== C. Zakoncz / Esc w srodku -> przerywa lancuch i podaje ile zostalo ==');
{
  const stack = mkStack();
  const run = makeRun(stack, ALL);
  run.ctx.openSel(stack[0]);
  run.modals[0].onPick('Wlocznik');     // grupa 1 zamieniona
  run.modals[1].onCancel();              // Esc / Zakoncz w grupie 2
  assert(run.modals.length === 2, 'Esc/Zakoncz konczy lancuch (brak modala grupy 3)');
  const last = run.hints[run.hints.length - 1] || '';
  assert(last.includes('niezałatwione typy (2 z 3)'), 'komunikat: niezalatwione typy 2 z 3');
  assert(last.includes('Wódz: Wojownik ×1') && last.includes('Konnica ×1'), 'komunikat wymienia zostale typy po nazwie');
  assert(run.performed.includes('a1>Wlocznik') && !run.performed.includes('k1>Rydwan'), 'po przerwaniu zamiany grupy 3 nie ma');
}

console.log('\n== D. jedna pozycja w zaznaczeniu = jeden typ, brak lancucha ==');
{
  const stack = mkStack();
  const run = makeRun(stack, ['k1']);
  run.ctx.openSel(stack[0]);
  assert(run.modals.length === 1 && run.modals[0].groupLabel === undefined, 'jeden typ: modal bez paska grupy');
  run.modals[0].onPick('Rydwan');
  assert(run.performed.join() === 'k1>Rydwan' && run.modals.length === 1, 'jeden typ: zamiana i koniec, bez kolejnego modala');
}

console.log('\n== E. wszystkie zaznaczone bez zamiennika -> brak modala grupowego ==');
{
  const stack = mkStack();
  const run = makeRun(stack, ['p1', 'p2']);
  run.ctx.openSel(stack[0]);
  assert(run.modals.length === 0 && run.singles.length === 1, 'brak kwalifikujacych sie: stary komunikat przyczyny (openUnitReplacePicker)');
}

console.log('\n== F. wlasciwosci pod spodem ==');
{
  assert(!/selectedId/.test(src), 'lancuch nie czyta selectedId (zrodlem prawdy jest zaznaczenie)');
  const picker = fs.readFileSync(path.join(root, 'src', 'ui', 'unitReplacePicker.ts'), 'utf8');
  assert(picker.includes('Pomiń ten typ') && picker.includes('opts.onSkip'), 'modal ma przycisk "Pomin ten typ" wiazany z onSkip');
}

console.log('\nwynik: ' + passed + ' OK, ' + failed + ' FAIL');
process.exit(failed > 0 ? 1 : 0);
