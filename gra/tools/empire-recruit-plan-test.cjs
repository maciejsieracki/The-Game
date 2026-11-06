'use strict';
/**
 * empire-recruit-plan-test.cjs — R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1
 * Testy jednostkowe czystego planera zbiorczej rekrutacji (game/empire-recruit-plan.ts) przez esbuild.
 * Mutanty (EMPIRE_RECRUIT_MUTANT=uneven|all): nierówny rozdział / ignorowanie blokad muszą dać FAIL.
 * Usage (z gra/): node tools/empire-recruit-plan-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
let src = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'game', 'empire-recruit-plan.ts'), 'utf8');
const mut = process.env.EMPIRE_RECRUIT_MUTANT;
if (mut === 'uneven') {
  // zawsze pierwsze miasto z puli (brak równomiernego rozkładu)
  const m = src.replace('if (best === null) { best = p; continue; }', 'if (best === null) { best = p; continue; } if (true) continue;');
  if (m === src) throw new Error('mutant not applied');
  src = m;
} else if (mut === 'all') {
  const m = src.replace('if (!c.canRecruit) {', 'if (false) {');
  if (m === src) throw new Error('mutant not applied');
  src = m;
}
const js = esbuild.transformSync(src, { loader: 'ts', format: 'cjs' }).code;
const mod = { exports: {} };
new Function('module', 'exports', js)(mod, mod.exports);
const { planEmpireRecruitment, executeEmpireRecruitment, maxAffordableEmpireRecruits } = mod.exports;

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}
const city = (id, o = {}) => ({ cityId: id, canRecruit: true, queuedOfType: 0, queueLength: 0, ...o });
const counts = p => Object.fromEntries(p.assignments.map(a => [a.cityId, a.count]));

let p = planEmpireRecruitment('Wojownik', 5, [city('c1')]);
check('1 miasto, 5 sztuk -> 5 w jednym', counts(p).c1 === 5 && p.assigned === 5 && p.unassigned === 0, p);
p = planEmpireRecruitment('Wojownik', 5, ['a', 'b', 'c', 'd', 'e'].map(i => city(i)));
check('5 miast, 5 sztuk -> po 1', p.assignments.length === 5 && p.assignments.every(a => a.count === 1), p);
p = planEmpireRecruitment('Wojownik', 5, ['c1', 'c2', 'c3'].map(i => city(i)));
check('3 miasta, 5 sztuk -> 2/2/1 (remis po id)', JSON.stringify(counts(p)) === JSON.stringify({ c1: 2, c2: 2, c3: 1 }), p);
p = planEmpireRecruitment('Wojownik', 4, [city('c1'), city('c2', { canRecruit: false, blockedReason: 'oblężenie' }), city('c3')]);
check('miasto z blokadą pomijane + powód',
  counts(p).c2 === undefined && counts(p).c1 === 2 && counts(p).c3 === 2 && p.rejected[0].cityId === 'c2' && p.rejected[0].reason === 'oblężenie', p);
p = planEmpireRecruitment('Wojownik', 3, [city('c1', { canRecruit: false }), city('c2', { canRecruit: false })]);
check('brak zdolnych -> zero przydziałów', p.assigned === 0 && p.assignments.length === 0 && p.unassigned === 3, p);
p = planEmpireRecruitment('Wojownik', 3, [city('c1', { queuedOfType: 2, queueLength: 2 }), city('c2')]);
check('miasto z mniejszą liczbą tego typu w kolejce dostaje pierwsze (c2 x2, c1 x1)', counts(p).c2 === 2 && counts(p).c1 === 1, p);
p = planEmpireRecruitment('Wojownik', 1, [city('c1', { queueLength: 4 }), city('c2', { queueLength: 1 })]);
check('remis typu -> krótsza kolejka łączna (c2)', counts(p).c2 === 1 && counts(p).c1 === undefined, p);
const a1 = JSON.stringify(planEmpireRecruitment('X', 7, [city('c3'), city('c1'), city('c2')]));
const a2 = JSON.stringify(planEmpireRecruitment('X', 7, [city('c2'), city('c3'), city('c1')]));
check('deterministyczny niezależnie od kolejności wejścia', a1 === a2, [a1, a2]);
p = planEmpireRecruitment('X', 10, [city('c1', { maxNewSlots: 2 }), city('c2', { maxNewSlots: 3 })]);
check('limity slotów: 5 przyjętych, 5 nie', p.assigned === 5 && p.unassigned === 5, p);
check('ilość niepoprawna -> 0',
  planEmpireRecruitment('X', NaN, [city('c1')]).assigned === 0 && planEmpireRecruitment('X', -3, [city('c1')]).assigned === 0);

const af = maxAffordableEmpireRecruits({ gold: 100, unitGold: 30, manpower: 1000, unitManpower: 10, stockPool: { drewno: 2 }, unitStock: { drewno: 1 } });
check('afford: min(złoto 3, rekruci 100, surowiec 2) = 2', af.max === 2 && /drewno/.test(af.limiter), af);

let calls = [];
let o = executeEmpireRecruitment({ typLabel: 'Taran', ilosc: 4, miasta: ['c1', 'c2'].map(i => city(i)), purchase: (id, n) => { calls.push([id, n]); return true; } });
check('execute: 4 sztuki na 2 miasta, komunikat', o.accepted === 4 && JSON.stringify(calls) === '[["c1",2],["c2",2]]' && /Zamówiono 4/.test(o.message), [o, calls]);
calls = [];
o = executeEmpireRecruitment({ typLabel: 'Taran', ilosc: 3, miasta: [city('c1', { canRecruit: false, blockedReason: 'oblężenie' })], purchase: () => { calls.push(1); return true; } });
check('execute: brak miasta -> komunikat i zero wywołań',
  o.accepted === 0 && !o.changed && calls.length === 0 && /Brak miasta zdolnego do rekrutacji Taran/.test(o.message), o);
o = executeEmpireRecruitment({ typLabel: 'Taran', ilosc: 5, miasta: [city('c1')], afford: { max: 3, limiter: 'za mało złota' }, purchase: () => true });
check('execute: częściowe 3 z 5 z powodem', o.accepted === 3 && /Przyjęto 3 z 5/.test(o.message) && /złota/.test(o.message), o);

// Redystrybucja po odmowie miasta (zarzut 6): c2 odrzuca -> jego sztuki trafiają do c1/c3, nic nie ginie.
calls = [];
o = executeEmpireRecruitment({ typLabel: 'Taran', ilosc: 6, miasta: ['c1', 'c2', 'c3'].map(i => city(i)),
  purchase: (id, n) => { calls.push([id, n]); return id !== 'c2'; } });
const got = {}; for (const a of o.perCity) got[a.cityId] = a.count;
check('redystrybucja: c2 odmawia -> 6 sztuk w c1/c3 (3/3), c2 pominięte',
  o.accepted === 6 && got.c2 === undefined && got.c1 === 3 && got.c3 === 3 && /Zamówiono 6/.test(o.message), [o, calls]);
o = executeEmpireRecruitment({ typLabel: 'Taran', ilosc: 5, miasta: ['c1', 'c2'].map(i => city(i)), purchase: () => false });
check('redystrybucja: wszystkie odmawiają -> 0 przyjętych, bez pętli', o.accepted === 0 && !o.changed, o);
calls = [];
o = executeEmpireRecruitment({ typLabel: 'Taran', ilosc: 3, miasta: ['c1', 'c2'].map(i => city(i)),
  purchase: (id, n) => { calls.push([id, n]); return id === 'c1'; } });
check('redystrybucja: jedno zdolne miasto przejmuje całość (c1 x3)', o.accepted === 3 && o.perCity.length === 1 && o.perCity[0].cityId === 'c1' && o.perCity[0].count === 3, [o, calls]);

console.log(`\nempire-recruit-plan-test: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
