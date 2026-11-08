'use strict';
/** R-WEB-ARMY-SCOUT-NOT-LEADER-Q1 — zwiadowca w armii nie jest liderem i nie blokuje ataku. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'army-scout-leader-'));
const ENTRY = path.join(TMP, 'entry.ts');
const OUT = path.join(TMP, 'bundle.cjs');
const SRC = path.resolve(__dirname, '..', 'src');
fs.writeFileSync(ENTRY, `
export { resolveEnemyCityClick, armyLeaderForSelection } from ${JSON.stringify(SRC + '/map/map-attack-city')};
export { pickStackLeader, isNonCombatTypeName, combatAnchorFor } from ${JSON.stringify(SRC + '/game/stack-leader')};
export { pickStackRepresentative, unitAtRepresentative, computeStackDisplay } from ${JSON.stringify(SRC + '/game/armyMerge')};
export { sortArmyStackGeneralsFirst } from ${JSON.stringify(SRC + '/ui/armyStackLabel')};
export { computePlayerVisibility, buildUnitSightResolver } from ${JSON.stringify(SRC + '/game/visibility')};
`);
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: OUT, logLevel: 'silent' });
const M = require(OUT);

let ok = 0, fail = 0;
function assert(c, msg) { if (c) { ok++; console.log('  [OK]', msg); } else { fail++; console.error('  [FAIL]', msg); } }

const mk = (id, typeId, extra = {}) => ({
  id, typeId, category: typeId === 'Zwiadowca' ? 'zwiadowca' : 'piechota', ownerId: 0,
  q: 4, r: 0, ruch: 3, ruchLeft: 3, hp: 20, ...extra,
});
const att = { Wojownik: 4, Zwiadowca: 0 };
const attackOf = u => att[u.typeId] ?? 4;
const city = { id: 'c1', ownerId: 1, q: 5, r: 0, name: 'Ateny', maMur: true, population: 3 };

console.log('T1 lider stosu');
const scoutA = mk('a-scout', 'Zwiadowca'); // id leksykalnie pierwsze
const w1 = mk('w1', 'Wojownik'), w2 = mk('w2', 'Wojownik');
assert(M.pickStackLeader([scoutA, w1, w2], attackOf).id === 'w1', 'zwiadowca (id pierwsze) nie jest liderem; remis po id');
assert(M.pickStackLeader([scoutA, w2], () => 0).id === 'w2', 'nawet przy sile 0 lider bojowy, nie zwiadowca');
assert(M.pickStackLeader([scoutA], attackOf).id === 'a-scout', 'sam zwiadowca = dotychczasowe zachowanie');
assert(M.pickStackRepresentative([scoutA, w1], () => 0).id === 'w1', 'pickStackRepresentative omija zwiadowcę');
assert(M.unitAtRepresentative(4, 0, [scoutA, w1], () => 0).id === 'w1', 'klik na heks -> jednostka bojowa');

console.log('T2 atak miasta ze zwiadowcą zaznaczonym w armii');
const units = [scoutA, w1, w2];
for (const sel of [scoutA, w1]) {
  const act = M.resolveEnemyCityClick({ city, selectedUnit: sel, units, playerOwnerId: 0 });
  assert(act.kind === 'attack_choice' && act.attacker.id !== 'a-scout', 'sel=' + sel.id + ' -> attack_choice, atakujący nie jest zwiadowcą (' + act.kind + ')');
}
const openCity = { ...city, maMur: false, q: 5 };
const act2 = M.resolveEnemyCityClick({ city: openCity, selectedUnit: scoutA, units, playerOwnerId: 0 });
assert(act2.kind === 'field_battle' || act2.kind === 'capture_empty', 'miasto bez muru: ' + act2.kind);
const aloneAct = M.resolveEnemyCityClick({ city, selectedUnit: scoutA, units: [scoutA], playerOwnerId: 0 });
assert(aloneAct.kind === 'hint_civilian', 'sam zwiadowca nadal dostaje hint_civilian');
const otherStackScout = mk('s2', 'Zwiadowca', { stackGroupId: 'inny' });
const act3 = M.resolveEnemyCityClick({ city, selectedUnit: otherStackScout, units: [otherStackScout, mk('w3', 'Wojownik', { stackGroupId: '0|4,0' })], playerOwnerId: 0 });
assert(act3.kind === 'hint_civilian', 'zwiadowca z INNEJ armii na tym samym heksie nie dziedziczy ataku');

console.log('T3 kolejność kart: zwiadowca ostatni');
const cards = [{ id: 's', name: 'Zwiadowca' }, { id: 'w', name: 'Wojownik' }, { id: 'g', name: 'Wojownik', commanderTitle: 'Generał' }, { id: 'o', name: 'Osadnik' }, { id: 'w2', name: 'Łucznik' }];
const ord = M.sortArmyStackGeneralsFirst(cards).map(c => c.id).join(',');
assert(ord === 'g,w,w2,s,o', 'generał, bojowe, potem cywile: ' + ord);

console.log('T4 widoczność = max zasięgów (zwiadowca podnosi)');
const defs = [{ Jednostka: 'Wojownik', 'Widok pola': 2, Ruch: 3 }, { Jednostka: 'Zwiadowca', 'Widok pola': 5, Ruch: 6 }];
const sight = M.buildUnitSightResolver(defs, 2);
assert(sight(w1) === 2 && sight(scoutA) === 5, 'zasięgi per jednostka: wojownik 2, zwiadowca 5');

console.log('T5 kotwica ataku na jednostkę (R2): zwiadowca nie jest kotwicą');
const anchor = M.combatAnchorFor(scoutA, [scoutA, w1, w2], attackOf);
assert(anchor.id === 'w1', 'combatAnchorFor(zwiadowca) -> wojownik (' + anchor.id + ')');
assert(M.combatAnchorFor(w2, [scoutA, w1, w2], attackOf).id === 'w2', 'bojowa kotwica bez zmian');
assert(M.combatAnchorFor(scoutA, [scoutA], attackOf).id === 'a-scout', 'sam zwiadowca bez zmian');
const sameG = (a, b) => (a.stackGroupId ?? 'x') === (b.stackGroupId ?? 'x');
const scoutOther = mk('s9', 'Zwiadowca', { stackGroupId: 'inny' });
assert(M.combatAnchorFor(scoutOther, [scoutOther, w1], attackOf, sameG).id === 's9', 'inna grupa -> bez zmian');
const wEmb = mk('we', 'Wojownik', { embarked: true });
assert(M.combatAnchorFor(scoutA, [scoutA, wEmb], attackOf).id === 'a-scout', 'zaokrętowany nie jest kotwicą');

console.log('T6 lider wg siły ataku, nie HP (R2)');
const weakHp = mk('b-weak', 'Wojownik', { hp: 5 }), tanky = mk('c-tank', 'Lucznik', { hp: 40 });
const str = { 'b-weak': 6, 'c-tank': 3 };
const lead = M.armyLeaderForSelection(scoutA, [scoutA, weakHp, tanky], 0, u => str[u.id] ?? 0);
assert(lead.id === 'b-weak', 'ranny wojownik o wyższym ataku wygrywa z łucznikiem o wyższym HP (' + lead.id + ')');
const noMove = mk('nm', 'Wojownik', { ruchLeft: 0 });
assert(M.resolveEnemyCityClick({ city, selectedUnit: scoutA, units: [scoutA, noMove], playerOwnerId: 0 }).kind === 'hint_civilian', 'bojowi bez ruchu -> hint_civilian (poprawne)');

console.log(`\n${ok} OK, ${fail} FAIL`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* ignore */ }
process.exit(fail ? 1 : 0);
