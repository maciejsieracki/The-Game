'use strict';
/**
 * tech-pottery-fifth-test.cjs — R-WEB-TECH-POTTERY-FIFTH-AFTER-FOUR-BASICS-Q1.
 * Garncarstwo (Garncarstwo / pottery) wymaga WSZYSTKICH czterech technologii poziomu 1:
 * Obróbka drewna + Rolnictwo + Łowiectwo + Oswojenie zwierząt. Jest więc piątą technologią
 * do wynalezienia w Kamieniu. Koszt nauki przywrócony do 40 (R-WEB-STONE-RESEARCH-COSTS-PRIORITY-Q1); Poziom (1) NIE jest zmieniany.
 *
 * Uruchom z gra/: node tools/tech-pottery-fifth-test.cjs
 *
 * Weryfikuje:
 *   - prereq Garncarstwa = dokładnie 4 podstawy (format „+”), koszt 40, Poziom 1 bez zmian;
 *   - w osi epoki (orderedTechsInEpoch) Garncarstwo stoi po czterech podstawach;
 *   - availableTechs: niedostępne bez którejkolwiek z czterech, dostępne po wszystkich;
 *   - drzewo bez cykli (validateTechGraph), głębokość: Garncarstwo 1, Wymiana 2, Brązownictwo 2;
 *   - Wymiana i Brązownictwo (oraz Pismo, Religia) osiągalne z pustego stanu;
 *   - zapis gry: zbadany Garncarstwo zostaje w ukonczone (chooseAIResearch/availableTechs nie cofają);
 *   - AI: chooseAIResearch nie zawiesza się, 5. wybór to Garncarstwo po czterech podstawach.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch {
    console.error('[tech-pottery-fifth-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.tech-pottery-fifth-entry.ts');
const BUNDLE = path.resolve(__dirname, '.tech-pottery-fifth-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { availableTechs, createResearchState } from '../src/game/research';
export {
  orderedTechsInEpoch,
  linearDepthInEpoch,
  validateTechGraph,
} from '../src/game/tech-tree';
export { chooseAIResearch } from '../src/game/ai';\n`,
  'utf8',
);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[tech-pottery-fifth-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const T = require(BUNDLE);
const techRoot = JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data', 'tech.json'), 'utf8'));
const techs = techRoot.technologie;
const byName = new Map(techs.map((t) => [t.Technologia, t]));

const BASICS = ['Obróbka drewna', 'Rolnictwo', 'Łowiectwo', 'Oswojenie zwierząt'];
const POT = 'Garncarstwo';

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}
function st(done) {
  return { ...T.createResearchState(), ukonczone: [...done] };
}
function avail(done) {
  return T.availableTechs(st(done), techs);
}

// --- [1] dane -----------------------------------------------------------------
const pot = byName.get(POT);
ok(pot !== undefined, 'tech.json zawiera Garncarstwo');
ok(pot['Wymaga (prereq)'] === BASICS.join(' + '),
  `prereq Garncarstwa = „${BASICS.join(' + ')}” (got „${pot['Wymaga (prereq)']}”)`);
ok(pot['Koszt nauki'] === 40, 'koszt nauki Garncarstwa = 40 (przywrócony koszt bazowy)');
ok(pot.Poziom === 1, 'Poziom Garncarstwa bez zmian (1)');
ok(pot.Epoka === 'Kamień', 'Garncarstwo w epoce Kamień');
for (const b of BASICS) {
  const t = byName.get(b);
  ok(t && t['Wymaga (prereq)'] === '—', `podstawa „${b}” nie ma prereq (startowa)`);
}

// --- [2] pozycja w osi epoki ---------------------------------------------------
const kamien = T.orderedTechsInEpoch(techs, 'Kamień').map((t) => t.Technologia);
const potIdx = kamien.indexOf(POT);
ok(potIdx >= 0, 'Garncarstwo jest w osi Kamienia');
for (const b of BASICS) {
  ok(kamien.indexOf(b) < potIdx, `w osi epoki „${b}” przed Garncarstwem`);
}

// --- [3] availableTechs --------------------------------------------------------
ok(!avail([]).includes(POT), 'Garncarstwo NIEDOSTĘPNE na starcie (bez podstaw)');
for (const b of BASICS) {
  ok(avail([]).includes(b), `podstawa „${b}” dostępna na starcie`);
}
for (const missing of BASICS) {
  const done = BASICS.filter((x) => x !== missing);
  ok(!avail(done).includes(POT), `Garncarstwo NIEDOSTĘPNE bez „${missing}”`);
}
ok(avail(BASICS).includes(POT), 'Garncarstwo DOSTĘPNE po wszystkich czterech podstawach');
ok(!avail([...BASICS, POT]).includes(POT), 'zbadane Garncarstwo nie jest ponownie dostępne');

// --- [4] graf: cykle i głębokość -------------------------------------------------
const val = T.validateTechGraph(techs);
ok(val.ok, `validateTechGraph OK (${(val.errors || []).join('; ') || 'brak błędów'})`);
ok(T.linearDepthInEpoch(POT, techs) === 1, 'głębokość Garncarstwa = 1');
ok(T.linearDepthInEpoch('Wymiana', techs) === 2, 'głębokość Wymiany = 2');
ok(T.linearDepthInEpoch('Brązownictwo', techs) === 2, 'głębokość Brązownictwa = 2');

// --- [5] osiągalność z pustego stanu (bez bramek budynków) -----------------------
let done = new Set();
for (let guard = 0; guard < 100; guard++) {
  const next = avail([...done]);
  if (next.length === 0) break;
  next.forEach((n) => done.add(n));
}
for (const name of ['Wymiana', 'Brązownictwo', 'Pismo', 'Religia', POT]) {
  ok(done.has(name), `„${name}” osiągalne z pustego stanu`);
}
ok(done.size === techs.length, `wszystkie ${techs.length} technologii osiągalne (got ${done.size})`);

// --- [6] zapis gry: zbadane Garncarstwo zostaje ---------------------------------
const saved = st(['Garncarstwo']);
let savedAvail = null;
try {
  savedAvail = T.availableTechs(saved, techs);
} catch (e) {
  savedAvail = null;
}
ok(savedAvail !== null, 'availableTechs nie rzuca dla zapisu z zbadanym Garncarstwem bez podstaw');
ok(saved.ukonczone.includes(POT), 'zapis: Garncarstwo pozostaje w ukonczone (bez cofania)');
ok(savedAvail && !savedAvail.includes(POT), 'zapis: zbadane Garncarstwo nie wraca do listy dostępnych');

// --- [7] AI: kolejność badań i brak zawieszenia ----------------------------------
function aiSequence(opts) {
  const doneSet = new Set();
  const picks = [];
  for (let guard = 0; guard < 80; guard++) {
    const pick = T.chooseAIResearch(techs, doneSet, { techData: techs, ...opts });
    if (pick === null) {
      ok(avail([...doneSet]).length === 0, 'AI zwraca null tylko gdy nic nie jest dostępne');
      break;
    }
    picks.push(pick);
    doneSet.add(pick);
  }
  return picks;
}
const aiDefault = aiSequence({});
ok(aiDefault.length === techs.length, `AI bada wszystkie ${techs.length} technologii bez zawieszenia (got ${aiDefault.length})`);
ok(aiDefault[4] === POT, `AI: 5. wybór = Garncarstwo (got „${aiDefault[4]}”)`);
ok(new Set(aiDefault.slice(0, 4)).size === 4 && BASICS.every((b) => aiDefault.slice(0, 4).includes(b)),
  'AI: pierwsze 4 wybory = cztery podstawy Kamienia');
const aiThreat = aiSequence({ underThreat: true, myCitiesCount: 1 });
ok(aiThreat.length === techs.length, `AI pod zagrożeniem bada wszystkie (got ${aiThreat.length})`);
ok(aiThreat.indexOf(POT) === 4, `AI pod zagrożeniem: Garncarstwo 5. (got index ${aiThreat.indexOf(POT)})`);

console.log(`tech-pottery-fifth-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
