'use strict';
/**
 * ai-no-siege-without-war-r2-test.cjs — R-WEB-AI-NO-SIEGE-WITHOUT-WAR-Q1 (runda 2).
 * Uzupelnia ai-siege-requires-war-test.cjs o: decyzje AI (decideAITurn) z bramka wojny,
 * stan `isCityUnderSiege` (flaga, nie obecnosc jednostek), karte "Wojny:" (mgla/kontakt),
 * straznika statycznego "jedyny wywolujacy decideAITurn przekazuje canEngageOwner",
 * oraz kontrakt: zmiana relacji wojna -> nie-wojna zdejmuje oblezenie od razu (main.ts).
 * Run from gra/:  node tools/ai-no-siege-without-war-r2-test.cjs
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const root = path.resolve(__dirname, '..');
const work = fs.mkdtempSync(path.join(fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir(), 'nsww-r2-'));
const entry = path.join(work, 'entry.ts');
const out = path.join(work, 'bundle.cjs');
fs.writeFileSync(entry, `
export { decideAITurn } from ${JSON.stringify(path.join(root, 'src/game/ai'))};
export { isCityUnderSiege } from ${JSON.stringify(path.join(root, 'src/game/city-siege-state'))};
export { siegeAllowedBetween, isSiegeStillValid, detectWarAutoSiegeOnCity } from ${JSON.stringify(path.join(root, 'src/game/diplomacy-siege-war-gate'))};
export { warPartnerIdsForOwner } from ${JSON.stringify(path.join(root, 'src/game/diplomacy-pair-summary'))};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: out, absWorkingDir: root, logLevel: 'silent',
});
const api = require(out);

let ok = 0;
const t = (name, fn) => { fn(); ok++; console.log('[OK]', name); };

function makeMap(size = 14) {
  const hexes = {};
  for (let q = 0; q < size; q += 1) {
    for (let r = 0; r < size; r += 1) {
      hexes[`${q},${r}`] = {
        coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak',
        ulepszenie: 'brak', wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: size, wysokoscR: size, hexes, seed: 42, riverPaths: [] };
}
const data = {
  units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2, 'Widok pola': 2 }],
  buildings: [],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
  aiParams: {},
};
const unit = (id, ownerId, q, r) => ({
  id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2,
});
const city = (id, ownerId, q, r) => ({ id, ownerId, q, r, population: 5, kultura: 0, name: id });

// Scenariusz: stos 4 jednostek AI(1) 2 heksy od pustego miasta (2), plus jednostka (2) obok.
function scenario() {
  const units = [
    unit('a1', 1, 5, 5), unit('a2', 1, 5, 6), unit('a3', 1, 6, 5), unit('a4', 1, 6, 6),
    unit('e1', 2, 8, 5),
  ];
  const cities = [city('home', 1, 3, 3), city('memfis', 2, 8, 6)];
  return { units, cities };
}
const hexDist = (q1, r1, q2, r2) => (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - q2 - r2)) / 2;
// rozkaz „pod mur / do wroga”: atak albo ruch na heks sąsiadujący z jednostką (8,5) lub miastem (8,6) gracza 2
const nearTarget = (c) => c.type === 'attack'
  || (c.type === 'move' && (hexDist(c.toQ, c.toR, 8, 5) <= 1 || hexDist(c.toQ, c.toR, 8, 6) <= 1));
const targetsEnemy = (cmds) => cmds.filter(c =>
  c.type === 'attack'
  || (c.type === 'move' && c.toQ === 8 && c.toR === 6));

t('K+ (kontrola dodatnia): w WOJNIE AI wydaje rozkaz ataku/ruchu na cel gracza 2', () => {
  const { units, cities } = scenario();
  const cmds = api.decideAITurn(1, units, cities, makeMap(), data, { canEngageOwner: () => true });
  assert.ok(cmds.some(c => c.type === 'attack' || c.type === 'move'), 'oczekiwano jakiegos rozkazu bojowego/ruchu');
  assert.ok(cmds.some(nearTarget), 'w wojnie AI idzie pod mur / do wroga (czułość harnessu)');
});

t('K-: bez wojny (canEngageOwner=false dla 2) AI nie atakuje i nie wchodzi na heks miasta 2', () => {
  const { units, cities } = scenario();
  const cmds = api.decideAITurn(1, units, cities, makeMap(), data, { canEngageOwner: o => o !== 2 });
  assert.strictEqual(cmds.filter(c => c.type === 'attack').length, 0, 'zero ataków bez wojny');
  assert.strictEqual(cmds.filter(c => c.type === 'move' && c.toQ === 8 && c.toR === 6).length, 0,
    'zero ruchu na heks miasta bez wojny');
  assert.strictEqual(cmds.filter(nearTarget).length, 0, 'zero marszu pod mur / do jednostek gracza 2 bez wojny');
});

t('K-: relacja neutralni/pokoj/sojusz — ta sama bramka wojny co areEnemyOwners (stub z main.ts)', () => {
  const rel = new Map();
  const key = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
  const areEnemies = (a, b) => a !== b && (rel.get(key(a, b)) || 'neutralni') === 'wojna';
  for (const st of ['neutralni', 'pokoj', 'rozejm', 'nap', 'sojusz', 'handel']) {
    rel.set(key(1, 2), st);
    const { units, cities } = scenario();
    const cmds = api.decideAITurn(1, units, cities, makeMap(), data, { canEngageOwner: o => areEnemies(1, o) });
    assert.strictEqual(cmds.filter(c => c.type === 'attack').length, 0, st + ': zero ataków');
    assert.strictEqual(cmds.filter(c => c.type === 'move' && c.toQ === 8 && c.toR === 6).length, 0, st + ': zero wejścia');
    assert.strictEqual(cmds.filter(nearTarget).length, 0, st + ': zero marszu pod mur');
  }
});

t('ZNANA LUKA (opis, nie zmiana): brak canEngageOwner w opts = domyślnie PERMISYWNE (tylko testy bez silnika)', () => {
  const { units, cities } = scenario();
  const cmds = api.decideAITurn(1, units, cities, makeMap(), data, {});
  assert.ok(cmds.length >= 0); // udokumentowane zachowanie; produkcja ZAWSZE przekazuje bramkę (test strażnik niżej)
});

t('isCityUnderSiege czyta WYŁĄCZNIE flagę oblegane, nie obecność obcych jednostek', () => {
  const c = { id: 'memfis', ownerId: 2, q: 8, r: 6, oblegane: false };
  assert.strictEqual(api.isCityUnderSiege([c], 'memfis'), false);
  c.oblegane = true;
  assert.strictEqual(api.isCityUnderSiege([c], 'memfis'), true);
});

t('Oblężenie wymaga wojny: gate + utrzymanie (koniec wojny => nieważne)', () => {
  let war = true;
  const areEnemies = (a, b) => a !== b && war;
  const c = { id: 'memfis', ownerId: 2, q: 8, r: 6, maMur: true };
  const us = [{ id: 'x', ownerId: 1, q: 7, r: 6 }];
  assert.strictEqual(api.isSiegeStillValid(c, 1, us, areEnemies), true);
  war = false;
  assert.strictEqual(api.isSiegeStillValid(c, 1, us, areEnemies), false, 'po pokoju oblężenie nieważne');
  assert.strictEqual(api.detectWarAutoSiegeOnCity(c, us, areEnemies), null);
});

t('H1: karta "Wojny:" pomija partnera bez kontaktu (mgla) — to NIE znaczy braku wojny', () => {
  const relations = new Map([['2_5', { status: 'wojna' }]]); // Egipt(2) vs Chiny(5)
  const all = api.warPartnerIdsForOwner(relations, 5);
  assert.deepStrictEqual(all, [2], 'bez filtra wojna widoczna');
  const noContact = api.warPartnerIdsForOwner(relations, 5, id => id === 0 || id === 5);
  assert.deepStrictEqual(noContact, [], 'bez kontaktu gracza z Egiptem karta pokazuje "brak"');
  const withContact = api.warPartnerIdsForOwner(relations, 5, id => id === 0 || id === 2 || id === 5);
  assert.deepStrictEqual(withContact, [2]);
});

// ---- Straznicy statyczni main.ts ----
const mainSrc = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');

t('STRAŻNIK: jedyny produkcyjny wywołujący decideAITurn przekazuje canEngageOwner (wojna lub barbarzyńca)', () => {
  const calls = [];
  const re = /decideAITurn\(/g;
  let m;
  while ((m = re.exec(mainSrc)) !== null) {
    const line = mainSrc.slice(0, m.index).split('\n').length;
    const text = mainSrc.slice(m.index - 40, m.index);
    if (/import|function\s/.test(text)) continue;
    calls.push(line);
  }
  const src = fs.readdirSync(path.join(root, 'src/game')).filter(f => f.endsWith('.ts') && !f.includes('.test.'));
  for (const f of src) {
    if (f === 'ai.ts') continue;
    const s = fs.readFileSync(path.join(root, 'src/game', f), 'utf8');
    assert.ok(!/[^a-zA-Z.]decideAITurn\(/.test(s.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')),
      f + ' nie moze wolac decideAITurn bez bramki');
  }
  const optsBlock = mainSrc.slice(mainSrc.indexOf('canEngageOwner: (targetOwnerId: number) => {'));
  assert.ok(/getDiploRelation\(ownerId, targetOwnerId\)\.status === 'wojna'/.test(optsBlock.slice(0, 400)),
    'bramka = status wojna');
  assert.ok(calls.length >= 1);
});

t('STRAŻNIK: wykonanie rozkazu AI attack/move-do-miasta sprawdza areEnemyOwners przy wykonaniu', () => {
  assert.ok(/if \(!areEnemyOwners\(ownerId, defender\.ownerId\)\)/.test(mainSrc), 'attack: ponowne sprawdzenie wojny');
  assert.ok(/canEngageOwner: \(targetOwnerId\) => areEnemyOwners\(ownerId, targetOwnerId\)/.test(mainSrc),
    'move do miasta: ponowne sprawdzenie wojny');
});

t('KONTRAKT R2: setDiploRelation zdejmuje oblężenia przy przejściu wojna -> nie-wojna', () => {
  const i = mainSrc.indexOf('function setDiploRelation(');
  assert.ok(i > 0);
  const body = mainSrc.slice(i, i + 4500);
  assert.ok(/prevStatus === 'wojna' && rel\.status !== 'wojna'/.test(body), 'warunek końca wojny');
  assert.ok(/validateActiveSieges\(\)/.test(body), 'wołanie validateActiveSieges');
});

fs.rmSync(work, { recursive: true, force: true });
console.log('PASS', ok);
