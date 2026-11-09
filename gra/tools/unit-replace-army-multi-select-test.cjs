'use strict';
/**
 * unit-replace-army-multi-select-test.cjs -- R-WEB-UNIT-REPLACE-ARMY-PANEL-SELECTS-GENERAL-Q1
 * "Zastap" dziala WYLACZNIE na jednostkach zaznaczonych checkboxami panelu armii (nie na wodzu / selectedId).
 * Run z gra/:  node tools/unit-replace-army-multi-select-test.cjs
 * main.ts nie da sie zbundlowac bez DOM: wycinamy funkcje ze zrodla (esbuild transform) i uruchamiamy ze stubami
 * + kontrola okablowania w zrodle.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
const picker = fs.readFileSync(path.join(root, 'src', 'ui', 'unitReplacePicker.ts'), 'utf8');

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

// Prawdziwe funkcje kosztu (bundle pure-logic).
const entry = path.resolve(__dirname, '.unit-replace-multi-entry.ts');
const bundle = path.resolve(__dirname, '.unit-replace-multi-bundle.cjs');
fs.writeFileSync(entry, "export { unitReplaceFullCost, unitReplaceStockMissingLabel, unitReplaceStockText } from '../src/game/unit-replace-cost';\n", 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
const COST = require(bundle);
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (_) { /* ignore */ }

// --- A. cele akcji: zaznaczenie, nie wodz ------------------------------------
console.log('\n== A. cele "Zastap" = zbior zaznaczony ==');
const targetsSrc = extractFn(main, 'unitReplaceTargetsOnStack');
assert(!/selectedId/.test(targetsSrc), 'unitReplaceTargetsOnStack nie czyta selectedId (zadnej "domyslnej" jednostki)');
assert(/pickedUnitsOnStack\(stack\)/.test(targetsSrc), 'zrodlem prawdy jest pickedUnitsOnStack (checkboxy panelu)');
const mk = (n, extra) => Array.from({ length: n }, (_, i) => ({ id: 'u' + i, typeId: 'Wojownik', isGeneral: i === 0, ...(extra || {}) }));
function targetsFor(stack, pickedIds) {
  const ctx = { pickedUnitsOnStack: (st) => st.filter(u => pickedIds.includes(u.id)) };
  vm.createContext(ctx);
  vm.runInContext(toJs(targetsSrc) + '\nthis.fn = unitReplaceTargetsOnStack;', ctx);
  return ctx.fn(stack).map(u => u.id);
}
const stack106 = mk(106);
assert(targetsFor(stack106, []).length === 0, 'stos 106 jednostek, nic nie zaznaczone (wodz = pierwsza karta) -> ZERO celow (nie wodz)');
assert(JSON.stringify(targetsFor(stack106, ['u105'])) === '["u105"]', 'zaznaczono 1 (ostatni rzad) -> cel to dokladnie ta jednostka, nie wodz / nie inna');
assert(JSON.stringify(targetsFor(stack106, ['u3', 'u7', 'u9'])) === '["u3","u7","u9"]', 'zaznaczone 3 -> 3 cele, wodz (u0) pominiety');
assert(targetsFor(stack106, ['u0', 'u5']).join() === 'u0,u5', 'wodz tylko gdy jawnie zaznaczony');
assert(targetsFor([stack106[4]], []).join() === 'u4', 'stos 1-osobowy bez zaznaczenia -> ta jedyna jednostka');

// --- B. okablowanie ------------------------------------------------------------
console.log('\n== B. okablowanie akcji ==');
assert(/actionId === 'replace'\) \{\s*openUnitReplaceForSelection\(u\);/.test(main), "akcja 'replace' woła openUnitReplaceForSelection (nie openUnitReplacePicker(u) na wybranej)");
assert(!/actionId === 'replace'\) \{\s*openUnitReplacePicker\(u\)/.test(main), "stara sciezka replace -> openUnitReplacePicker(u) usunieta");
const forSel = extractFn(main, 'openUnitReplaceForSelection');
assert(/zaznacz w panelu armii/.test(forSel), 'brak zaznaczenia w wiekszym stosie -> prosba o zaznaczenie (komunikat)');
assert(/'G:'/.test(forSel) && /'U:'/.test(forSel), 'grupowanie wg typu; wodz (G:) zawsze w osobnej grupie');
assert(/unitReplaceEligible/.test(forSel), 'grupy tylko z kwalifikujacych sie jednostek (terytorium, 1 zamiana/ture, jest zamiennik)');
const groupSrc = extractFn(main, 'openUnitReplaceGroupPicker');
assert(/count: n/.test(groupSrc) && /affordableCount/.test(groupSrc) && /totalMoneyCost/.test(groupSrc), 'picker dostaje liczbe, ile stac, koszt zbiorczy');
assert(/performUnitReplace\(gu\.id, newTypeId, true\)/.test(groupSrc), 'zbiorcza zamiana wola performUnitReplace per jednostka (ruch/koszt/limity jak dotad)');
assert(/index \+ 1 < groups\.length/.test(groupSrc), 'kolejne grupy typow -> kolejne okna wyboru');
const performSrc = extractFn(main, 'performUnitReplace');
assert(/quiet = false\): boolean/.test(performSrc) && /u\.ruchLeft = 0/.test(performSrc) && /replaceUsedThisTurn = true/.test(performSrc), 'performUnitReplace: zwraca boolean, zuzywa ruch i flage tury');
assert(!/isGeneral\s*=/.test(performSrc), 'zamiana nie rusza isGeneral -> wodz zachowuje role');
assert(/replaceTargets.some\(unitReplaceEligible\)/.test(main), 'przycisk "Zastap" wyszarzony wg zaznaczonych, nie wg wybranej karty');

// --- C. zbiorczy koszt / ile stac ----------------------------------------------
console.log('\n== C. koszt zbiorczy i limit zasobow ==');
const costSrc = extractFn(main, 'unitReplaceCostTimes') + extractFn(main, 'unitReplaceAffordableCount');
function affordCtx(skarb, pool) {
  const ctx = {
    player: { skarbiec: skarb },
    replaceUnitMoneyCost: () => 100,
    ownerSurowcePoolFor: () => pool,
    unitReplaceFullCost: (def, m) => ({ money: m, stock: { braz: 25 } }),
    unitReplaceStockMissingLabel: COST.unitReplaceStockMissingLabel,
  };
  vm.createContext(ctx);
  vm.runInContext(toJs(costSrc) + '\nthis.times = unitReplaceCostTimes; this.afford = unitReplaceAffordableCount;', ctx);
  return ctx;
}
let c = affordCtx(1000, { braz: 1000 });
const t3 = c.times({}, 'X', 3);
assert(t3.money === 300 && t3.stock.braz === 75, 'koszt zbiorczy = pelny koszt rekrutacji x liczba (300 Pieniadza + 75 Braz)');
assert(c.afford({}, 'X', 3, 0) === 3, 'stac na wszystkie 3');
c = affordCtx(250, { braz: 1000 });
assert(c.afford({}, 'X', 3, 0) === 2, 'skarbiec na 2 z 3 -> zamiana 2');
c = affordCtx(1000, { braz: 60 });
assert(c.afford({}, 'X', 3, 0) === 2, 'surowca (60 Braz) na 2 z 3 -> zamiana 2');
c = affordCtx(50, { braz: 1000 });
assert(c.afford({}, 'X', 3, 0) === 0, 'brak Pieniadza -> 0 (pozycja wyszarzona)');
c = affordCtx(1000, {});
assert(c.afford({}, 'X', 2, 0) === 0, 'brak surowca -> 0');

// --- D. picker i aktualny tekst FALA 571 -----------------------------------------
console.log('\n== D. picker ==');
assert(/count\?: number/.test(picker) && /affordableCount\?: number/.test(picker) && /Razem \$\{count\}/.test(picker), 'picker: count, affordableCount, wiersz "Razem N"');
assert(/stać na \$\{affordCount\} z \$\{count\}/.test(picker), 'picker: informacja ile jednostek mozna zastapic');
assert(/Koszt = pełna rekrutacja nowej jednostki/.test(picker), 'tekst FALA 571 ("pelna rekrutacja nowej jednostki")');
assert(!/Dopłata/.test(picker) && !/bez dopłaty/.test(picker), 'stary tekst "Doplata = koszt nowej - koszt starej" / "bez doplaty" nieobecny w sciezce');
assert(/Zastąp — ' \+ esc\(opts\.unitName\)/.test(picker), 'tytul okna z nazwa zaznaczonego typu (unitName = typ zaznaczonej jednostki)');

console.log(`\n[unit-replace-army-multi-select-test] ${failed === 0 ? 'WSZYSTKIE TESTY ZIELONE' : 'BLEDY'} (${passed}/${passed + failed})`);
console.log('Chromium/live panel: NIE_ZMIERZONO (brak playwright/jsdom w piaskownicy; test pokrywa logike i okablowanie).');
process.exit(failed === 0 ? 0 : 1);
