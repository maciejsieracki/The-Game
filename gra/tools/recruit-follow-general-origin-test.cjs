'use strict';
// R-WEB-RECRUIT-FOLLOW-GENERAL-BY-ORIGIN-Q1: „Idź do wodza” zapisywane przy zamówieniu rekrutacji.
// Zamówienie bezpośrednio w mieście -> OFF; z Armii/Rekrutacji -> dziedziczy globalny przełącznik;
// intencja trwa w kolejce do zrodzenia; stary zapis bez pola -> globalny przełącznik.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

const root = path.resolve(__dirname, '..');
const built = esbuild.buildSync({
  stdin: { contents: "export * from './src/game/production.ts'; export { serializeGame, deserializeGame } from './src/game/save.ts';", resolveDir: root, sourcefile: 'follow-origin-entry.ts' },
  bundle: true, platform: 'node', format: 'cjs', target: 'es2020', write: false, logLevel: 'silent',
});
const mod = { exports: {} };
new Function('module', 'exports', built.outputFiles[0].text)(mod, mod.exports);
const { recruitFollowGeneralForOrder, resolveRecruitFollowGeneral, enqueueRecruitment, advanceRecruitmentGated, serializeGame, deserializeGame } = mod.exports;

let pass = 0;
const ok = label => { pass += 1; console.log(`PASS ${label}`); };

// 1. Pochodzenie zamówienia -> intencja.
assert.equal(recruitFollowGeneralForOrder('city', true), false); ok('city order defaults OFF even when the empire toggle is ON');
assert.equal(recruitFollowGeneralForOrder('city', false), false); ok('city order is OFF when the empire toggle is OFF');
assert.equal(recruitFollowGeneralForOrder('army', true), true); ok('Army/recruitment order inherits an ON toggle');
assert.equal(recruitFollowGeneralForOrder('army', false), false); ok('Army/recruitment order inherits an OFF toggle');

// 2. Zrodzenie: zapisana intencja wygrywa z globalnym przełącznikiem; brak pola = legacy fallback.
assert.equal(resolveRecruitFollowGeneral({ followGeneral: false }, true), false); ok('stored OFF intent beats ON toggle at spawn');
assert.equal(resolveRecruitFollowGeneral({ followGeneral: true }, false), true); ok('stored ON intent beats OFF toggle at spawn');
assert.equal(resolveRecruitFollowGeneral({}, true), true); ok('legacy item without origin falls back to ON toggle');
assert.equal(resolveRecruitFollowGeneral({}, false), false); ok('legacy item without origin falls back to OFF toggle');

// 3. Intencja trwa w kolejce: enqueue + advance (costAlreadyPaid) nie gubi pola; partia zachowuje ją per sztukę.
const base = { kind: 'jednostka', id: 'Lucznik', nazwa: 'Łucznik', koszt: 10 };
let prod = { kolejka: [], postep: 0 };
prod = enqueueRecruitment(prod, { ...base, followGeneral: false });
prod = enqueueRecruitment(prod, { ...base, followGeneral: true });
prod = enqueueRecruitment(prod, { ...base, followGeneral: false });
const spawned = advanceRecruitmentGated(prod, { population: 10, manpower: 10 }, 1, 3, true);
assert.deepEqual(spawned.completed.map(it => it.followGeneral), [false, true, false]); ok('queued batch keeps per-order intent until spawn (3 units, mixed origins)');
assert.equal(spawned.prod.rekrutacja, undefined); ok('spawned items leave the queue');

// 4. Save/load: cityProd z intencją przechodzi serializację; legacy bez pola zostaje bez pola.
const snapshot = { wersja: 3, tura: 1, units: [], cities: [], exploredByHuman: [], gracze: [], humanOwnerIds: [0], activeHumanOwnerId: 0,
  cityProd: { c1: { kolejka: [], postep: 0, rekrutacja: [{ ...base, followGeneral: false }, { ...base, followGeneral: true }] },
    c2: { kolejka: [], postep: 0, rekrutacja: [{ ...base }] } } };
const loaded = deserializeGame(serializeGame(snapshot));
assert.deepEqual(loaded.cityProd.c1.rekrutacja.map(it => it.followGeneral), [false, true]); ok('save roundtrip preserves stored follow intent');
assert.equal('followGeneral' in loaded.cityProd.c2.rekrutacja[0], false); ok('legacy queued item stays without the field after load');

// 5. Kontrakt wiązania (main.ts / cityPanel.ts): źródła zamówień i spawn używają intencji.
const mainSrc = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
const panelSrc = fs.readFileSync(path.join(root, 'src/ui/cityPanel.ts'), 'utf8');
assert.match(mainSrc, /recruitFollowGeneralForOrder\(opts\.origin \?\? 'city', recruitFollowGeneralDefault\)/); ok('purchaseRecruitmentUnit stamps intent from origin (default city)');
assert.match(mainSrc, /purchase: \(cityId, count\) => purchaseRecruitmentUnit\(cityId, unitId, empireRecruitCityKoszt\(cityId, unitId, koszt\), ownerId, count, \{ origin: 'army' \}\)/); ok('empire recruitment panel orders carry origin army');
// Obie kopie configureCityPanel (pierwsza po starcie, druga po Nowej grze) muszą przekazywać origin.
const countOf = (src, re) => (src.match(new RegExp(re.source, 'g')) || []).length;
assert.equal(countOf(mainSrc, /onPurchaseUnit: \(cityId: string, itemId: string, koszt: number, quantity = 1, origin: RecruitOrigin = 'city'\)/), 2); ok('both configureCityPanel copies: onPurchaseUnit forwards origin');
assert.equal(countOf(mainSrc, /onPurchaseGeneral: \(cityId: string, itemId: string, koszt: number, origin: RecruitOrigin = 'city'\)/), 2); ok('both configureCityPanel copies: onPurchaseGeneral forwards origin (incl. post-new-game copy)');
assert.equal(countOf(mainSrc, /\{ isGeneral: true, origin \}\)/), 1 + 1); ok('both general callbacks pass origin into purchaseRecruitmentUnit');
// Wiązanie zapisu intencji z realnym enqueue w purchaseRecruitmentUnit (mutacja usuwająca ...followIntent czerwieni test).
const purchStart = mainSrc.indexOf('function purchaseRecruitmentUnit(');
const purchEnd = mainSrc.indexOf('function purchaseRecruitmentUnits(', purchStart);
const purchBody = mainSrc.slice(purchStart, purchEnd);
assert.ok(purchStart >= 0 && purchEnd > purchStart);
assert.match(purchBody, /enqueueRecruitment\(nextProd, \{\s*\.\.\.item,[\s\S]*?\.\.\.followIntent,\s*\}\);/); ok('purchaseRecruitmentUnit: enqueue call spreads followIntent into every queued unit');
assert.match(mainSrc, /followGeneral: resolveRecruitFollowGeneral\(rec, recruitFollowGeneralDefault\)/); ok('recruitment-queue spawn reads stored intent with legacy fallback');
assert.match(panelSrc, /recruitUnit\(entry\.city, entry\.item, batch, false, 'army'\)/); ok('Army batch recruit passes army origin');
assert.match(panelSrc, /recruitUnit\(city, item, quantity, true, opts\?\.armyBatch \? 'army' : 'city'\)/); ok('Army cards pass army origin, city cards city origin');
assert.match(panelSrc, /cfg\.onPurchaseGeneral\?\.\(cityId, offer\.item!\.id, offer\.item!\.koszt, 'army'\)/); ok('Army general card passes army origin');
console.log(`\n${pass} assertions passed`);
