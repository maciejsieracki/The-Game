'use strict';
/**
 * army-type-chips-test.cjs -- R-WEB-UI-ARMY-PICK-SELECT-ALL-BY-TYPE-Q1
 * Skróty „zaznacz wszystkich <typ>” nad listami jednostek armii: panel podziału, panel scalania
 * (wybór do połączenia) i rząd chipów w pasku stosu (hexContextTooltip). Testy uruchamiają PRAWDZIWE
 * funkcje paneli (bundle esbuild + jsdom), bez regexów w kodzie źródłowym.
 *
 * Run z gra/:  node tools/army-type-chips-test.cjs
 * Mutacja (kontrola czerwienią):  node tools/army-type-chips-test.cjs --mutate
 *   --mutate psuje przełączanie chipa (pętla dodawania/usuwania jest pusta) i test MUSI wtedy czerwienić.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { JSDOM } = require(path.resolve(__dirname, '..', 'node_modules', 'jsdom'));

const UI_DIR = path.resolve(__dirname, '..', 'src', 'ui');
const MUTATE = process.argv.includes('--mutate');
const BRAND_STUB = 'export function unitIconSvg(){return "<svg></svg>";}'
  + 'export function brandIconSvg(){return "<svg></svg>";}'
  + 'export function mapResourceIconSvg(){return "<svg></svg>";}'
  + 'export function terrainIconSvg(){return "<svg></svg>";}';
const ENTRY = `
import * as asp from './armySplitPanel';
import * as amp from './armyMergePickPanel';
import * as chips from './armyTypeChips';
import * as tip from './hexContextTooltip';
window.__asp = asp; window.__amp = amp; window.__chips = chips; window.__tip = tip;
`;

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.error('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

async function buildBundle() {
  const plugins = [{
    name: 'army-type-chips-stubs',
    setup(b) {
      b.onResolve({ filter: /brandAssets$/ }, () => ({ path: 'brand-stub', namespace: 'stub' }));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: BRAND_STUB, loader: 'js' }));
      if (MUTATE) {
        b.onLoad({ filter: /armyTypeChips\.ts$/ }, (args) => {
          const src = fs.readFileSync(args.path, 'utf8');
          const mutated = src.replace('for (const id of group.ids) {', 'for (const id of ([] as string[])) {');
          if (mutated === src) throw new Error('mutacja: nie znaleziono pętli w toggleArmyTypeChip');
          return { contents: mutated, loader: 'ts' };
        });
      }
    },
  }];
  const result = await esbuild.build({
    stdin: { contents: ENTRY, resolveDir: UI_DIR, sourcefile: 'army-type-chips-entry.ts', loader: 'ts' },
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    write: false,
    logLevel: 'silent',
    plugins,
  });
  return result.outputFiles[0].text;
}

/** Dane armii: 6 łuczników, 4 procarze, 2 wojowników + generał (typeId Wojownik). Ostatni = generał. */
function armyRows() {
  const rows = [];
  for (let i = 1; i <= 6; i++) rows.push({ id: 'a' + i, typeId: 'Lucznik', name: 'Łucznik' });
  for (let i = 1; i <= 4; i++) rows.push({ id: 'p' + i, typeId: 'Procarz', name: 'Procarz' });
  rows.push({ id: 'w1', typeId: 'Wojownik', name: 'Wojownik' });
  rows.push({ id: 'w2', typeId: 'Wojownik', name: 'Wojownik' });
  rows.push({ id: 'g1', typeId: 'Wojownik', name: 'Wojownik', commanderTitle: 'Generał' });
  return rows;
}

function sorted(a) { return [...a].sort(); }

async function main() {
  const code = await buildBundle();
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const win = dom.window;
  win.eval(code);
  const { __asp: asp, __amp: amp, __chips: chips, __tip: tip } = win;
  const doc = win.document;
  const $ = (sel) => doc.querySelector(sel);
  const $$ = (sel) => Array.from(doc.querySelectorAll(sel));
  const fire = (el, type) => el.dispatchEvent(new win.Event(type, { bubbles: true }));

  // --- 0. kontrakt helpera (czyste funkcje) --------------------------------------------------
  console.log('\n== 0. grupowanie i stan chipa (czyste funkcje) ==');
  const units = armyRows().map(u => ({ id: u.id, typeId: u.typeId, name: u.name, isGeneral: u.commanderTitle !== undefined }));
  const groupsWithGen = chips.groupUnitsByType(units, { includeGenerals: true });
  const groupsNoGen = chips.groupUnitsByType(units, { includeGenerals: false });
  check('grupy po typeId z generałem: 3 typy', groupsWithGen.length === 3, groupsWithGen.map(g => g.typeId));
  check('Wojownik z generałem liczy 3 jednostki', groupsWithGen.find(g => g.typeId === 'Wojownik').ids.length === 3);
  check('bez generała Wojownik liczy 2 jednostki', groupsNoGen.find(g => g.typeId === 'Wojownik').ids.length === 2);
  const lucz = groupsWithGen.find(g => g.typeId === 'Lucznik');
  const selHelper = new Set(['a1']);
  check('stan chipa: część (1 z 6)', chips.armyTypeChipInfo(lucz, selHelper).state === 'part');
  const selHelper2 = new Set(lucz.ids);
  check('stan chipa: wszystkie (6 z 6)', chips.armyTypeChipInfo(lucz, selHelper2).state === 'all');
  check('stan chipa: brak (0 z 6)', chips.armyTypeChipInfo(lucz, new Set()).state === 'none');
  const toggleSet = new Set(['a1']);
  chips.toggleArmyTypeChip(toggleSet, lucz);
  check('klik przy części zaznacza WSZYSTKIE jednostki typu (6)', lucz.ids.every(id => toggleSet.has(id)) && toggleSet.size === 6, [...toggleSet]);
  chips.toggleArmyTypeChip(toggleSet, lucz);
  check('klik przy wszystkich odznacza typ, inne bez zmian', toggleSet.size === 0, [...toggleSet]);

  // --- A. panel podziału armii ------------------------------------------------------------------
  console.log('\n== A. panel „Rozdziel armię” (armySplitPanel) ==');
  asp.showArmySplitPanel({
    hexLabel: '(10,5)',
    units: armyRows().map(u => ({ id: u.id, typeId: u.typeId, name: u.name, commanderTitle: u.commanderTitle })),
    destHexes: [{ q: 11, r: 5, label: 'Heks E' }, { q: 9, r: 5, label: 'Heks W' }],
    onSplit: (ids) => { win.__splitCalls = (win.__splitCalls || []).concat([ids]); },
    onCancel() {},
  });
  const splitChip = (typeId) => $('.civ-asp [data-chip-type="' + typeId + '"]');
  check('split: rząd chipów istnieje (role=group)', $('.civ-atc-row[role="group"]') !== null);
  check('split: 3 chipy (po jednym na typ)', $$('.civ-asp [data-chip-type]').length === 3, $$('.civ-asp [data-chip-type]').length);
  check('split: chip Łucznik = „Łucznik ×6” (stan none)', splitChip('Lucznik').textContent === 'Łucznik ×6' && splitChip('Lucznik').classList.contains('none'), splitChip('Lucznik').textContent);
  // Domyślnie zaznaczony jest ostatni wiersz = generał (Wojownik) -> chip Wojownik w stanie części.
  check('split: chip Wojownik = część 1/3 (domyślnie zaznaczony generał)', splitChip('Wojownik').textContent === 'Wojownik 1/3' && splitChip('Wojownik').classList.contains('part'), splitChip('Wojownik').textContent);
  check('split: chip Wojownik ma aria-pressed=false przy części', splitChip('Wojownik').getAttribute('aria-pressed') === 'false');

  const splitChecked = () => $$('.civ-asp-u input').filter(i => i.checked).map(i => i.getAttribute('data-uid'));
  splitChip('Lucznik').click();
  check('split: klik Łucznik zaznacza dokładnie 6 łuczników (+ domyślny generał, nic innego)',
    JSON.stringify(sorted(splitChecked())) === JSON.stringify(sorted(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'g1'])), sorted(splitChecked()));
  check('split: po zaznaczeniu chip Łucznik = all, aria-pressed=true',
    splitChip('Lucznik').classList.contains('all') && splitChip('Lucznik').getAttribute('aria-pressed') === 'true');
  splitChip('Lucznik').click();
  check('split: drugi klik Łucznik odznacza łuczników; generał zostaje',
    JSON.stringify(splitChecked()) === JSON.stringify(['g1']), splitChecked());
  check('split: chip Łucznik wraca do none', splitChip('Lucznik').classList.contains('none'));

  splitChip('Procarz').click();
  check('split: klik Procarz zaznacza 4 procarzy, nie rusza łuczników',
    JSON.stringify(sorted(splitChecked())) === JSON.stringify(sorted(['p1', 'p2', 'p3', 'p4', 'g1'])), sorted(splitChecked()));

  // Ręczne odznaczenie jednego procarza -> chip w części.
  const p2 = $('.civ-asp-u input[data-uid="p2"]');
  p2.checked = false;
  fire(p2, 'change');
  check('split: ręczne odznaczenie p2 -> chip Procarz = część 3/4', splitChip('Procarz').textContent === 'Procarz 3/4' && splitChip('Procarz').classList.contains('part'), splitChip('Procarz').textContent);
  splitChip('Procarz').click();
  check('split: klik chipa w części dopina WSZYSTKIE procarze (4/4)', JSON.stringify(sorted(splitChecked())) === JSON.stringify(sorted(['p1', 'p2', 'p3', 'p4', 'g1'])), sorted(splitChecked()));

  // Wojownik: stan część (generał) -> klik zaznacza też dwóch wojowników; drugi klik odznacza trzech.
  splitChip('Wojownik').click();
  check('split: klik Wojownik przy części zaznacza wszystkich 3 (w tym generała)',
    splitChecked().includes('w1') && splitChecked().includes('w2') && splitChecked().includes('g1'), splitChecked());
  splitChip('Wojownik').click();
  check('split: drugi klik Wojownik odznacza też generała (reguła typu)',
    !splitChecked().includes('w1') && !splitChecked().includes('w2') && !splitChecked().includes('g1'), splitChecked());
  check('split: po odznaczeniu Wojownika zostają same procarze', JSON.stringify(sorted(splitChecked())) === JSON.stringify(sorted(['p1', 'p2', 'p3', 'p4'])), sorted(splitChecked()));

  // Potwierdzenie działa na zaznaczonym zbiorze z chipów (callback dostaje właściwe id).
  $('.civ-asp [data-go]').click();
  const lastCall = (win.__splitCalls || []).slice(-1)[0];
  check('split: „Rozdziel” przekazuje dokładnie zaznaczony zbiór (procarze)',
    lastCall !== undefined && JSON.stringify(sorted(lastCall)) === JSON.stringify(['p1', 'p2', 'p3', 'p4']), lastCall);
  asp.hideArmySplitPanel();

  // Reguła „na źródle musi zostać ≥1 jednostka”: 2 łuczników, klik chipa zaznacza obu -> Rozdziel nieaktywny.
  asp.showArmySplitPanel({
    hexLabel: '(1,1)',
    units: [{ id: 'x1', typeId: 'Lucznik', name: 'Łucznik' }, { id: 'x2', typeId: 'Lucznik', name: 'Łucznik' }],
    destHexes: [{ q: 2, r: 1, label: 'Heks E' }],
    onSplit: () => { win.__guardCalls = (win.__guardCalls || 0) + 1; },
    onCancel() {},
  });
  $('.civ-asp [data-chip-type="Lucznik"]').click();
  check('split: chip zaznaczający CAŁY stos blokuje „Rozdziel” (aria-disabled=true)', $('.civ-asp [data-go]').getAttribute('aria-disabled') === 'true');
  $('.civ-asp [data-go]').click();
  check('split: zablokowany „Rozdziel” nie wywołuje onSplit', (win.__guardCalls || 0) === 0, win.__guardCalls);
  asp.hideArmySplitPanel();

  // --- B. panel scalania (wybór do połączenia) --------------------------------------------------
  console.log('\n== B. panel „Połącz armie” (armyMergePickPanel) ==');
  let mergeIds = null;
  amp.showArmyMergePickPanel({
    hexLabel: '(10,5)',
    sourceUnits: armyRows().map(u => ({ id: u.id, typeId: u.typeId, name: u.name, commanderTitle: u.commanderTitle })),
    targets: [{ q: 11, r: 5, label: 'Sąsiedni stos', units: [] }],
    onMerge: (ids) => { mergeIds = ids; },
    onCancel() {},
  });
  const mergeChip = (typeId) => $('.civ-ampk [data-chip-type="' + typeId + '"]');
  const mergeChecked = () => $$('.civ-ampk-u input').filter(i => i.checked).map(i => i.getAttribute('data-uid'));
  check('merge: 3 chipy po typie', $$('.civ-ampk [data-chip-type]').length === 3, $$('.civ-ampk [data-chip-type]').length);
  check('merge: domyślnie wszystkie zaznaczone -> chip Łucznik = all', mergeChip('Lucznik').classList.contains('all'));
  mergeChip('Lucznik').click();
  check('merge: klik Łucznik (all) odznacza 6 łuczników, reszta zaznaczona',
    JSON.stringify(sorted(mergeChecked())) === JSON.stringify(sorted(['p1', 'p2', 'p3', 'p4', 'w1', 'w2', 'g1'])), sorted(mergeChecked()));
  check('merge: chip Łucznik wraca do none po odznaczeniu', mergeChip('Lucznik').classList.contains('none'));
  mergeChip('Lucznik').click();
  check('merge: ponowny klik zaznacza łuczników', mergeChecked().length === 13, mergeChecked().length);
  mergeChip('Procarz').click();
  check('merge: klik Procarz (all) odznacza 4 procarzy',
    JSON.stringify(sorted(mergeChecked())) === JSON.stringify(sorted(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'w1', 'w2', 'g1'])), sorted(mergeChecked()));
  mergeChip('Wojownik').click();
  check('merge: klik Wojownik (all) odznacza 3 wojowników z generałem', !mergeChecked().includes('g1') && !mergeChecked().includes('w1') && !mergeChecked().includes('w2'), mergeChecked());
  $('.civ-ampk [data-go]').click();
  check('merge: „Połącz” przekazuje wyłącznie zaznaczone łuczniki',
    mergeIds !== null && JSON.stringify(sorted(mergeIds)) === JSON.stringify(sorted(['a1', 'a2', 'a3', 'a4', 'a5', 'a6'])), mergeIds);
  amp.hideArmyMergePickPanel();

  // --- C. pasek stosu w podpowiedzi (hexContextTooltip) -----------------------------------------
  console.log('\n== C. pasek stosu w podpowiedzi (buildUnitStackTypeChipsHtml) ==');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cards = [
    ...['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map((id, i) => ({ id, typeId: 'Lucznik', name: 'Łucznik', picked: i < 2, hp: 10, hpMax: 10, ruchLeft: 1, ruchMax: 2, icon: '', active: false })),
    ...['p1', 'p2', 'p3', 'p4'].map(id => ({ id, typeId: 'Procarz', name: 'Procarz', picked: false, hp: 10, hpMax: 10, ruchLeft: 1, ruchMax: 2, icon: '', active: false })),
    { id: 'w1', typeId: 'Wojownik', name: 'Wojownik', picked: false, hp: 10, hpMax: 10, ruchLeft: 1, ruchMax: 2, icon: '', active: false },
    { id: 'w2', typeId: 'Wojownik', name: 'Wojownik', picked: false, hp: 10, hpMax: 10, ruchLeft: 1, ruchMax: 2, icon: '', active: false },
    { id: 'g1', typeId: 'Wojownik', name: 'Wojownik', commanderTitle: 'Generał', picked: false, hp: 10, hpMax: 10, ruchLeft: 1, ruchMax: 2, icon: '', active: true },
  ];
  const holder = doc.createElement('div');
  holder.innerHTML = tip.buildUnitStackTypeChipsHtml(cards, esc);
  const tipChips = Array.from(holder.querySelectorAll('[data-act]'));
  check('tooltip: 3 chipy (Łucznik, Procarz, Wojownik; generał nie liczy się do grupy)', tipChips.length === 3, tipChips.length);
  const tipChip = (typeId) => holder.querySelector('[data-act="pick-type:' + typeId + '"]');
  check('tooltip: chip Łucznik = część 2/6 (dwa zaznaczone)', tipChip('Lucznik') && tipChip('Lucznik').textContent === 'Łucznik 2/6' && tipChip('Lucznik').getAttribute('data-state') === 'part', tipChip('Lucznik') && tipChip('Lucznik').textContent);
  check('tooltip: chip Procarz = brak ×4', tipChip('Procarz') && tipChip('Procarz').textContent === 'Procarz ×4' && tipChip('Procarz').getAttribute('data-state') === 'none');
  check('tooltip: chip Wojownik liczy 2 (bez generała) ×2', tipChip('Wojownik') && tipChip('Wojownik').textContent === 'Wojownik ×2');
  check('tooltip: chip ma aria-label i aria-pressed', tipChip('Lucznik').getAttribute('aria-pressed') === 'false' && !!tipChip('Lucznik').getAttribute('aria-label'));
  check('tooltip: pojedyncza jednostka bez chipa-pustki (pusty stos bez grup -> pusty HTML)',
    tip.buildUnitStackTypeChipsHtml([{ id: 'g9', typeId: 'Wojownik', name: 'Wojownik', commanderTitle: 'Wódz' }], esc) === '');

  console.log(`\nSUMMARY army-type-chips-test${MUTATE ? ' [MUTATE]' : ''}: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
