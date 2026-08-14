'use strict';
/**
 * granice-relacja-dyplomatyczna-test.cjs — R-GRANICE-RELACJA-DYPLOMATYCZNA-Q1 (Maciej, 2026-08-14).
 *
 * Specyfikacja właściciela: oprócz istniejącej ZEWNĘTRZNEJ obwódki granicy terytorium
 * (kolor tożsamościowy cywilizacji z civs.json) dochodzi DRUGA, WEWNĘTRZNA obwódka,
 * o połowę cieńsza, kodująca relację dyplomatyczną gracz↔dana cywilizacja:
 *   - własna cywilizacja (ownerId 0) → ten sam kolor co zewnętrzna (jedna grubsza granica),
 *   - wrogowie (status 'wojna')      → jasny czerwony,
 *   - sojusznicy (status 'sojusz')   → jasny niebieski,
 *   - neutralni ('pokoj'/'neutralni')→ bardzo jaskrawy złoty.
 *
 * Test pokrywa trzy warstwy:
 *   (1) LOGIKA KOLORU — `relationBorderColor` z `src/game/civ-visual.ts` dla wszystkich
 *       czterech statusów z typu `Relation['status']` (game/diplomacy.ts), plus przypadek
 *       ownerId 0 składany tak jak w main.ts.
 *   (2) STRUKTURA MESHU — `buildTerritoryBorderGroup` z `src/render/rangeOverlay.ts`:
 *       DWA meshe na właściciela (zewnętrzny + wewnętrzny) zamiast jednego, wewnętrzny
 *       węższy dokładnie o połowę, skierowany DO WEWNĄTRZ obwodu i uniesiony ponad
 *       zewnętrzny (bez tego z-fighting na wspólnej krawędzi).
 *   (3) WPIĘCIE W main.ts — asercje na źródle, bo main.ts bootuje całą scenę przy imporcie
 *       i nie da się z niego wyciągnąć samej funkcji (ta sama sytuacja co w
 *       camera-zoom-block-test.cjs). Chodzi o to, żeby `relationColorFn` nie mogło po cichu
 *       zniknąć z wywołania `buildTerritoryBorderGroup` ani przestać się odświeżać przy
 *       zmianie statusu dyplomatycznego.
 *
 * Uruchamianie z katalogu gra/: node tools/granice-relacja-dyplomatyczna-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.granice-relacja-entry.ts');
const BUNDLE = path.join(__dirname, '.granice-relacja-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  relationBorderColor,
  RELATION_BORDER_COLOR_WOJNA,
  RELATION_BORDER_COLOR_SOJUSZ,
  RELATION_BORDER_COLOR_NEUTRALNY,
  civColorForOwner,
} from '../src/game/civ-visual';
export {
  buildTerritoryBorderGroup,
  TERRITORY_BORDER_BAND_WIDTH,
  TERRITORY_RELATION_BAND_WIDTH,
  TERRITORY_BORDER_OPACITY,
  TERRITORY_BORDER_Y_BUMP,
  TERRITORY_RELATION_Y_BUMP,
} from '../src/render/rangeOverlay';
export { HEX_R } from '../src/render/hexutil';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  external: ['three'], // jak camera-zoom-block-test.cjs — bundlowanie three puchnie artefakt
  logLevel: 'silent',
});

const M = require(BUNDLE);
const civs = require('../data/civs.json');

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log('  OK', msg);
  } else {
    fail++;
    console.error('FAIL:', msg);
  }
}
const hex = (n) => '#' + Number(n).toString(16).padStart(6, '0');

console.log('granice-relacja-dyplomatyczna-test (R-GRANICE-RELACJA-DYPLOMATYCZNA-Q1)\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. LOGIKA KOLORU — wszystkie 4 statusy z typu Relation['status']
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. relationBorderColor — mapowanie statusu na kolor obwódki');

ok(M.relationBorderColor('wojna') === M.RELATION_BORDER_COLOR_WOJNA,
  `status 'wojna' → czerwony ${hex(M.RELATION_BORDER_COLOR_WOJNA)}`);
ok(M.relationBorderColor('sojusz') === M.RELATION_BORDER_COLOR_SOJUSZ,
  `status 'sojusz' → niebieski ${hex(M.RELATION_BORDER_COLOR_SOJUSZ)}`);
ok(M.relationBorderColor('pokoj') === M.RELATION_BORDER_COLOR_NEUTRALNY,
  `status 'pokoj' → złoty ${hex(M.RELATION_BORDER_COLOR_NEUTRALNY)}`);
ok(M.relationBorderColor('neutralni') === M.RELATION_BORDER_COLOR_NEUTRALNY,
  `status 'neutralni' → złoty ${hex(M.RELATION_BORDER_COLOR_NEUTRALNY)}`);

// Cztery statusy dają TRZY kolory — 'pokoj' i 'neutralni' celowo zlewają się w „neutralny”,
// ale żadne dwa RÓŻNE stany (wojna/sojusz/neutralny) nie mogą mieć tego samego koloru.
{
  const distinct = new Set([
    M.RELATION_BORDER_COLOR_WOJNA,
    M.RELATION_BORDER_COLOR_SOJUSZ,
    M.RELATION_BORDER_COLOR_NEUTRALNY,
  ]);
  ok(distinct.size === 3, 'wojna / sojusz / neutralny to trzy RÓŻNE kolory');
}

// Nieznany status nie może zgasić obwódki (fallback = neutralny złoty).
ok(M.relationBorderColor('cokolwiek') === M.RELATION_BORDER_COLOR_NEUTRALNY,
  'status nierozpoznany → fallback złoty (obwódka nigdy nie znika)');

// Odcienie: czerwony/niebieski/złoty muszą być JASNE (spec: „jasno-czerwone”,
// „jasno-niebieskie”, „super jaskrawy złoty ... bardzo dobrze widoczny”).
{
  const chan = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  const [wr, wg, wb] = chan(M.RELATION_BORDER_COLOR_WOJNA);
  ok(wr > 200 && wr > wg + 100 && wr > wb + 100, 'wojna: dominanta czerwona i jasna (R>200)');
  const [sr, sg, sb] = chan(M.RELATION_BORDER_COLOR_SOJUSZ);
  ok(sb > 200 && sb > sr + 100 && sg > 120, 'sojusz: dominanta niebieska i jasna (B>200)');
  const [nr, ng, nb] = chan(M.RELATION_BORDER_COLOR_NEUTRALNY);
  ok(nr > 240 && ng > 190 && nb < 60, 'neutralny: jaskrawe złoto (R>240, G>190, B<60)');
  // Musi być wyraźnie jaśniejszy/bardziej nasycony niż złoto paneli UI (#d9a441),
  // żeby na mapie 3D nie czytał się jak zwykły element interfejsu.
  const uiGold = 0xd9a441;
  const [ur, ug, ub] = chan(uiGold);
  ok(nr > ur && ng > ug && nb < ub, 'neutralne złoto jaśniejsze/czystsze niż złoto UI #d9a441');
}

// ownerId 0 — reguła z main.ts: wewnętrzna obwódka = DOKŁADNIE kolor zewnętrznej.
{
  const civTypeForOwner = () => 'rzymianie';
  const own = M.civColorForOwner(civs, 0, civTypeForOwner);
  // relationColorFn(0) w main.ts zwraca civColorFn(0) — ten sam resolver, ten sam argument.
  const ownRelation = M.civColorForOwner(civs, 0, civTypeForOwner);
  ok(ownRelation === own, `ownerId 0 → obie obwódki tym samym kolorem ${hex(own)}`);
  ok(ownRelation !== M.RELATION_BORDER_COLOR_WOJNA
    && ownRelation !== M.RELATION_BORDER_COLOR_SOJUSZ
    && ownRelation !== M.RELATION_BORDER_COLOR_NEUTRALNY,
    'kolor własnej cywilizacji (Rzymianie) nie koliduje z żadnym kolorem relacji');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. STRUKTURA MESHU — dwa pasy na właściciela, wewnętrzny o połowę węższy
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. buildTerritoryBorderGroup — struktura grupy obwódek');

const HEX_R = M.HEX_R;
// Minimalna atrapa mapy: render czyta z `map.hexes[klucz]` wyłącznie ISTNIENIE heksa
// (środek liczy z axialToWorld), więc puste obiekty wystarczą.
function fakeMap(keys) {
  const hexes = {};
  for (const k of keys) hexes[k] = {};
  return { hexes };
}

const OWN_COLOR = 0x8b1a1a;   // Rzymianie (gracz)
const ENEMY_COLOR = 0x1e5aa8; // Grecy (AI)

function meshVertices(mesh) {
  const arr = mesh.geometry.getAttribute('position').array;
  const out = [];
  for (let i = 0; i < arr.length; i += 3) out.push({ x: arr[i], y: arr[i + 1], z: arr[i + 2] });
  return out;
}
function radialExtent(mesh, cx, cz) {
  let min = Infinity;
  let max = -Infinity;
  for (const v of meshVertices(mesh)) {
    const d = Math.hypot(v.x - cx, v.z - cz);
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return { min, max };
}
/**
 * Rogi obwodu pojedynczego heksa (0,0) — ta sama konstrukcja co `hexCornerWorld`
 * w map/territory-border.ts (pointy-top: x=R·sin(60°·i), z=R·cos(60°·i)).
 */
function hexLoopCorners(R) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    out.push({ x: R * Math.sin(a), z: R * Math.cos(a) });
  }
  return out;
}
/** Jednostkowe normalne 6 krawędzi heksa (0,0) — z rogów pętli, ta sama konwencja co wyżej. */
function hexEdgeNormals(corners) {
  const out = [];
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    const mx = (a.x + b.x) / 2;
    const mz = (a.z + b.z) / 2;
    const l = Math.hypot(mx, mz) || 1;
    out.push({ nx: mx / l, nz: mz / l });
  }
  return out;
}
/**
 * R-GRANICE-STYK-CZYTELNOSC-Q1 = B (2026-08-14): oba pasy leżą DO WEWNĄTRZ od linii granicy,
 * więc jedyną sensowną miarą jest GŁĘBOKOŚĆ prostopadła od tej linii (0 = dokładnie na niej,
 * wartość dodatnia = w głąb terytorium, ujemna = wyciek poza własne terytorium). Promień od
 * środka heksa tu nie działa: rogi obwodu leżą w HEX_R, a krawędzie w inradiusie — ta sama
 * głębokość dałaby dwie różne wartości promienia. Miara „odsunięcie od najbliższego rogu",
 * której używała poprzednia wersja tego pliku, mierzyła to samo tylko dopóki pas wyrastał
 * wprost z rogów obwodu; po wsunięciu pasów jest bez sensu (miesza wsunięcie z grubością).
 */
function bandDepthRange(mesh, normals, inradius) {
  let min = Infinity;
  let max = -Infinity;
  for (const v of meshVertices(mesh)) {
    let outermost = -Infinity;
    for (const n of normals) {
      const d = v.x * n.nx + v.z * n.nz;
      if (d > outermost) outermost = d;
    }
    const depth = inradius - outermost;
    if (depth < min) min = depth;
    if (depth > max) max = depth;
  }
  return { min, max, thickness: max - min };
}
function meanY(mesh) {
  const vs = meshVertices(mesh);
  return vs.reduce((s, v) => s + v.y, 0) / vs.length;
}

{
  const keys = new Set(['0,0']);
  const byOwner = new Map([[0, keys]]);
  const map = fakeMap(keys);

  // (a) BEZ relationColorFn — zachowanie sprzed zmiany: JEDEN mesh na właściciela.
  const legacy = M.buildTerritoryBorderGroup(map, byOwner, () => OWN_COLOR);
  ok(legacy.children.length === 1, 'bez relationColorFn → 1 mesh na właściciela (kompatybilność wsteczna)');
  ok(legacy.children[0].name === 'territory-border-0', 'bez relationColorFn → tylko territory-border-0');

  // (b) Z relationColorFn — DWA meshe na właściciela.
  const group = M.buildTerritoryBorderGroup(
    map, byOwner, () => OWN_COLOR,
    M.TERRITORY_BORDER_BAND_WIDTH, M.TERRITORY_BORDER_OPACITY,
    () => OWN_COLOR,
  );
  ok(group.children.length === 2, 'z relationColorFn → 2 meshe na właściciela (zamiast 1)');

  const outer = group.children.find((c) => c.name === 'territory-border-0');
  const inner = group.children.find((c) => c.name === 'territory-relation-0');
  ok(!!outer, 'mesh zewnętrzny nazwany territory-border-0');
  ok(!!inner, 'mesh wewnętrzny nazwany territory-relation-0');

  const corners = hexLoopCorners(HEX_R);
  const normals = hexEdgeNormals(corners);
  const INRADIUS = HEX_R * Math.sqrt(3) / 2;
  const dOuter = bandDepthRange(outer, normals, INRADIUS);
  const dInner = bandDepthRange(inner, normals, INRADIUS);
  const eInner = radialExtent(inner, 0, 0);

  // R-GRANICE-STYK-CZYTELNOSC-Q1 = B: ŻADEN pas nie wychodzi poza własne terytorium (głębokość
  // nigdy ujemna) — to jest cała treść decyzji, bo sąsiedzi dzielą tę samą linię granicy.
  ok(dOuter.min >= -1e-6, `pas tożsamości NIE wychodzi poza obwód (min głębokość ${dOuter.min.toFixed(5)})`);
  ok(Math.abs(dOuter.min) < 1e-6, 'pas tożsamości dotyka linii granicy od wewnątrz (głębokość 0)');
  ok(eInner.min < HEX_R - 1e-6, 'pas relacji wchodzi do środka terytorium');

  // „O połowę cieńsza" — mierzone realną geometrią meshy, nie tylko stałą.
  ok(dInner.min >= -1e-6 && Math.abs(dInner.min - dOuter.max) < 1e-6,
    `pas relacji zaczyna się dokładnie tam, gdzie kończy się pas tożsamości (${dInner.min.toFixed(5)})`);
  ok(Math.abs(dOuter.thickness - M.TERRITORY_BORDER_BAND_WIDTH) < 1e-6,
    `pas tożsamości gruby na TERRITORY_BORDER_BAND_WIDTH (${dOuter.thickness.toFixed(4)})`);
  ok(Math.abs(dInner.thickness - M.TERRITORY_RELATION_BAND_WIDTH) < 1e-6,
    `pas relacji gruby na TERRITORY_RELATION_BAND_WIDTH (${dInner.thickness.toFixed(4)})`);
  ok(Math.abs(dOuter.thickness / dInner.thickness - 2) < 1e-6,
    `pas relacji dokładnie o połowę węższy (tożsamość ${dOuter.thickness.toFixed(4)} / relacja ${dInner.thickness.toFixed(4)})`);
  ok(Math.abs(M.TERRITORY_RELATION_BAND_WIDTH - M.TERRITORY_BORDER_BAND_WIDTH / 2) < 1e-9,
    `stała TERRITORY_RELATION_BAND_WIDTH = połowa TERRITORY_BORDER_BAND_WIDTH (${M.TERRITORY_RELATION_BAND_WIDTH})`);

  // Anty-z-fighting: pas wewnętrzny wyżej od zewnętrznego o różnicę bumpów.
  const dy = meanY(inner) - meanY(outer);
  ok(dy > 0, 'pas wewnętrzny uniesiony ponad zewnętrzny (bez z-fightingu na wspólnej krawędzi)');
  ok(Math.abs(dy - (M.TERRITORY_RELATION_Y_BUMP - M.TERRITORY_BORDER_Y_BUMP)) < 1e-6,
    `różnica wysokości = TERRITORY_RELATION_Y_BUMP - TERRITORY_BORDER_Y_BUMP (${dy.toFixed(4)})`);

  // Własna cywilizacja: oba pasy TYM SAMYM kolorem → jedna grubsza, jednolita granica.
  ok(outer.material.color.getHex() === OWN_COLOR && inner.material.color.getHex() === OWN_COLOR,
    `ownerId 0: oba pasy w kolorze cywilizacji ${hex(OWN_COLOR)}`);
}

// Kolory wewnętrznego pasa dla wszystkich czterech statusów — przez REALNY render,
// z relationColorFn złożoną dokładnie tak jak w main.ts.
{
  const keys = new Set(['0,0']);
  const map = fakeMap(keys);
  const relationColorFnLikeMain = (statusByOwner) => (ownerId) => (
    ownerId === 0 ? OWN_COLOR : M.relationBorderColor(statusByOwner[ownerId])
  );

  const cases = [
    ['wojna', M.RELATION_BORDER_COLOR_WOJNA, 'wróg → wewnętrzna obwódka czerwona'],
    ['sojusz', M.RELATION_BORDER_COLOR_SOJUSZ, 'sojusznik → wewnętrzna obwódka niebieska'],
    ['pokoj', M.RELATION_BORDER_COLOR_NEUTRALNY, 'pokój → wewnętrzna obwódka złota'],
    ['neutralni', M.RELATION_BORDER_COLOR_NEUTRALNY, 'neutralny → wewnętrzna obwódka złota'],
  ];

  for (const [status, expected, label] of cases) {
    const byOwner = new Map([[3, keys]]);
    const group = M.buildTerritoryBorderGroup(
      map, byOwner, () => ENEMY_COLOR,
      M.TERRITORY_BORDER_BAND_WIDTH, M.TERRITORY_BORDER_OPACITY,
      relationColorFnLikeMain({ 3: status }),
    );
    const outer = group.children.find((c) => c.name === 'territory-border-3');
    const inner = group.children.find((c) => c.name === 'territory-relation-3');
    ok(!!outer && !!inner, `status '${status}': 2 meshe dla właściciela 3`);
    ok(outer.material.color.getHex() === ENEMY_COLOR,
      `status '${status}': zewnętrzna obwódka NADAL w kolorze cywilizacji ${hex(ENEMY_COLOR)}`);
    ok(inner.material.color.getHex() === expected, `${label} (${hex(expected)})`);
  }
}

// Wielu właścicieli naraz — po 2 meshe na każdego, nazwy per ownerId.
{
  const own = new Set(['0,0', '1,0']);
  const foe = new Set(['5,0']);
  const ally = new Set(['9,0']);
  const map = fakeMap([...own, ...foe, ...ally]);
  const byOwner = new Map([[0, own], [3, foe], [4, ally]]);
  const statusByOwner = { 3: 'wojna', 4: 'sojusz' };
  const group = M.buildTerritoryBorderGroup(
    map, byOwner, (o) => (o === 0 ? OWN_COLOR : ENEMY_COLOR),
    M.TERRITORY_BORDER_BAND_WIDTH, M.TERRITORY_BORDER_OPACITY,
    (o) => (o === 0 ? OWN_COLOR : M.relationBorderColor(statusByOwner[o])),
  );
  ok(group.children.length === 6, '3 właścicieli → 6 meshy (2 na właściciela)');
  const byName = new Map(group.children.map((c) => [c.name, c]));
  ok(byName.get('territory-relation-0').material.color.getHex() === OWN_COLOR,
    'wielu właścicieli: własna obwódka wewnętrzna w kolorze cywilizacji');
  ok(byName.get('territory-relation-3').material.color.getHex() === M.RELATION_BORDER_COLOR_WOJNA,
    'wielu właścicieli: wróg czerwony');
  ok(byName.get('territory-relation-4').material.color.getHex() === M.RELATION_BORDER_COLOR_SOJUSZ,
    'wielu właścicieli: sojusznik niebieski');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. WPIĘCIE W main.ts — na źródle (main.ts bootuje scenę przy imporcie)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Wpięcie w main.ts (asercje na źródle)');

const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');

ok(/function relationColorFn\(ownerId: number\): number \{[\s\S]{0,400}?if \(ownerId === 0\) return civColorFn\(0\);/.test(mainSrc),
  'main.ts: relationColorFn(0) zwraca civColorFn(0) — własna obwódka w kolorze cywilizacji');
ok(/function relationColorFn[\s\S]{0,400}?relationBorderColor\(getDiploRelation\(0, ownerId\)\.status\)/.test(mainSrc),
  'main.ts: relationColorFn czyta getDiploRelation(0, ownerId).status');
ok(/buildTerritoryBorderGroup\(\s*map,\s*byOwner,\s*civColorFn,[\s\S]{0,200}?relationColorFn,/.test(mainSrc),
  'main.ts: relationColorFn wpięte w wywołanie buildTerritoryBorderGroup');
// Ciało setDiploRelation wycięte po nazwie funkcji i pierwszym domknięciu na jej wcięciu —
// pewniejsze niż jeden wielki regex przez komentarze (te potrafią urosnąć i przestrzelić limit).
{
  const start = mainSrc.indexOf('function setDiploRelation(');
  ok(start > 0, 'main.ts: funkcja setDiploRelation istnieje');
  const end = mainSrc.indexOf('\n    }', start);
  const body = start > 0 && end > start ? mainSrc.slice(start, end) : '';
  ok(/refreshTerritoryBorderOverlay\(\)/.test(body),
    'main.ts: setDiploRelation odświeża obwódkę (zmiana relacji przemalowuje granicę od razu)');
  ok(/const prevStatus = diplomacyRelations\.get\(key\)\?\.status;/.test(body),
    'main.ts: setDiploRelation zapamiętuje poprzedni status PRZED zapisem');
  ok(/prevStatus !== rel\.status/.test(body),
    'main.ts: odświeżenie tylko przy realnej zmianie STATUSU (nie co turę przy zaufaniu/respekcie)');
  ok(/\(a === 0 \|\| b === 0\)/.test(body),
    'main.ts: odświeżenie tylko dla par z graczem (AI↔AI nie zmienia koloru żadnej obwódki)');
}

// ─────────────────────────────────────────────────────────────────────────────
try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
