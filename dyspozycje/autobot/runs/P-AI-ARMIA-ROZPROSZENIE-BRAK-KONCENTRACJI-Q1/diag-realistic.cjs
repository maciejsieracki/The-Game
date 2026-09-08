'use strict';
/**
 * Diagnoza zywa (Operator runda 1) — P-AI-ARMIA-ROZPROSZENIE-BRAK-KONCENTRACJI-Q1.
 * Realistyczny scenariusz: 5 miast AI rozsianych po duzej mapie (odleglosci miedzy
 * miastami > ARMY_CONCENTRATION_RADIUS=4), kazde z 2-jednostkowym garnizonem stojacym
 * PRZY miescie (nie na jednym stosie) -- typowy stan po kilkudziesieciu turach produkcji,
 * BEZ zadnego zagrozenia (0 frontow). decideAITurn wolane po kolei, realne komendy
 * 'move' stosowane do pozycji. Mierzone clusterUnitsByProximity co ture.
 */
const fs = require('fs');
const path = require('path');
const GRA = '/home/user/wt-ai-armia-koncentracja/gra';
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.diag-realistic-entry.ts');
const bundle = path.resolve(__dirname, '.diag-realistic-bundle.cjs');
fs.writeFileSync(entry, `
export { decideAITurn, countThreatFronts } from ${JSON.stringify(GRA + '/src/game/ai')};
export { clusterUnitsByProximity, ARMY_CONCENTRATION_RADIUS } from ${JSON.stringify(GRA + '/src/game/army-concentration')};
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
const C = require(bundle);

function bigMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak',
      ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}

function unit(id, q, r, extra = {}) {
  return { id, ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, ...extra };
}

const OWNER = 1;
const map = bigMap(60, 60);
// 5 miast realistycznie rozsianych (typowa gra: stolica + 4 kolonie), odleglosci
// miedzy sasiednimi miastami 12-18 hex -- DUZO wiecej niz ARMY_CONCENTRATION_RADIUS=4.
const cities = [
  { id: 'cap', ownerId: OWNER, q: 30, r: 30, name: 'Stolica', population: 8 },
  { id: 'c1', ownerId: OWNER, q: 12, r: 30, name: 'C1', population: 5 },
  { id: 'c2', ownerId: OWNER, q: 48, r: 30, name: 'C2', population: 5 },
  { id: 'c3', ownerId: OWNER, q: 30, r: 12, name: 'C3', population: 5 },
  { id: 'c4', ownerId: OWNER, q: 30, r: 48, name: 'C4', population: 5 },
];
// Kazde miasto ma 2-jednostkowy garnizon STOJACY OBOK miasta (typowy stan po produkcji
// -- jednostka wychodzi z kolejki na heks miasta/sasiedni, NIE inGarnizon:true -- zwykla
// jednostka polowa, tak jak realnie po zejsciu z produkcji zanim gracz/AI cokolwiek z nia
// zrobi). Brak wroga -- 0 frontow.
const myUnits = [];
for (const c of cities) {
  myUnits.push(unit(`${c.id}-a`, c.q, c.r));
  myUnits.push(unit(`${c.id}-b`, c.q + 1, c.r));
}

const testData = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
const TURNS = Number(process.env.DIAG_TURNS || 40);

console.log('# P-AI-ARMIA-ROZPROSZENIE-BRAK-KONCENTRACJI-Q1 — diagnoza zywa (Operator runda 1)');
console.log(`# 5 miast rozsianych (dystans miasto-miasto 12-18hex >> promien=${C.ARMY_CONCENTRATION_RADIUS}), `
  + `10 jednostek (2/miasto), 0 frontow zagrozenia, ${TURNS} tur`);

const history = [];
for (let t = 0; t < TURNS; t++) {
  for (const u of myUnits) u.ruchLeft = u.ruch;
  const cmds = C.decideAITurn(OWNER, myUnits, cities, map, testData, { civType: 'grecy', currentTurn: t });
  const moveCmds = cmds.filter(c => c.type === 'move');
  for (const cmd of moveCmds) {
    const u = myUnits.find(x => x.id === cmd.unitId);
    if (u === undefined) continue;
    u.q = cmd.toQ; u.r = cmd.toR;
  }
  const clusters = C.clusterUnitsByProximity(myUnits, C.ARMY_CONCENTRATION_RADIUS);
  const sizes = clusters.map(g => g.length).sort((a, b) => b - a);
  history.push({ t, nClusters: clusters.length, sizes, nMoves: moveCmds.length, nCmds: cmds.length });
}

for (const h of [history[0], history[1], history[4], history[9], history[19], history[TURNS - 1]].filter(Boolean)) {
  console.log(`  tura ${h.t + 1}: klastrow=${h.nClusters} rozklad=[${h.sizes.join(',')}] `
    + `komend-ruchu=${h.nMoves}/${h.nCmds}`);
}
console.log(`\nWERDYKT: klastrow na starcie=${history[0].nClusters}, po ${TURNS} turach=${history[TURNS - 1].nClusters} `
  + `(10 jednostek razem). ${history[TURNS - 1].nClusters < history[0].nClusters ? 'KONSOLIDACJA nastapila' : 'BRAK konsolidacji -- jednostki pozostaly rozproszone'}.`);

// ---------------------------------------------------------------------------
// SCENARIO B: identyczne 5 miast/garnizonow, ale z JEDNYM wedrujacym
// barbarzynca w poblizu KAZDEGO miasta (dystans 6 hex -- w zasiegu
// isHomeDefenseThreatForCity dla kazdego miasta pop 5-8, promien+4>=9), NIGDY
// nieatakowanym (poza zasiegiem ataku jednostek), NIGDY nieusuwanym --
// symuluje typowa sytuacje "gdzies w poblizu kazdego miasta kraze barbarzynca"
// na duzej mapie. Ta sama miara: liczba klastrow WLASNYCH jednostek w czasie.
// ---------------------------------------------------------------------------
const myUnitsB = [];
for (const c of cities) {
  myUnitsB.push(unit(`${c.id}-a`, c.q, c.r));
  myUnitsB.push(unit(`${c.id}-b`, c.q + 1, c.r));
}
const barbs = cities.map(c => unit(`barb-${c.id}`, c.q + 6, c.r, { ownerId: 0 }));

console.log(`\n# SCENARIO B: jak wyzej + 1 barbarzynca krazacy w poblizu KAZDEGO miasta `
  + `(dystans 6hex, w zasiegu isHomeDefenseThreatForCity, nigdy nie w zasiegu ataku)`);
const historyB = [];
for (let t = 0; t < TURNS; t++) {
  for (const u of myUnitsB) u.ruchLeft = u.ruch;
  const allUnits = [...myUnitsB, ...barbs];
  const cmds = C.decideAITurn(OWNER, allUnits, cities, map, testData, { civType: 'grecy', currentTurn: t });
  const moveCmds = cmds.filter(c => c.type === 'move');
  for (const cmd of moveCmds) {
    const u = myUnitsB.find(x => x.id === cmd.unitId);
    if (u === undefined) continue;
    u.q = cmd.toQ; u.r = cmd.toR;
  }
  const clusters = C.clusterUnitsByProximity(myUnitsB, C.ARMY_CONCENTRATION_RADIUS);
  const sizes = clusters.map(g => g.length).sort((a, b) => b - a);
  historyB.push({ t, nClusters: clusters.length, sizes, nMoves: moveCmds.length, nCmds: cmds.length });
}
for (const h of [historyB[0], historyB[1], historyB[9], historyB[19], historyB[TURNS - 1]].filter(Boolean)) {
  console.log(`  tura ${h.t + 1}: klastrow=${h.nClusters} rozklad=[${h.sizes.join(',')}] `
    + `komend-ruchu=${h.nMoves}/${h.nCmds}`);
}
console.log(`\nWERDYKT SCENARIO B: klastrow na starcie=${historyB[0].nClusters}, po ${TURNS} turach=${historyB[TURNS - 1].nClusters}. `
  + `${historyB[TURNS - 1].nClusters < historyB[0].nClusters ? 'KONSOLIDACJA nastapila mimo barbarzyncow' : 'BRAK KONSOLIDACJI -- kazdy garnizon zostaje trwale wykluczony jako obronca domu'}.`);

try { fs.unlinkSync(entry); } catch {}
try { fs.unlinkSync(bundle); } catch {}
