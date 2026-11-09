'use strict';

// R-WEB-UI-GENERAL-HEX-RING-OUTLINE-Q1: obwódka wokół wodza = ZEWNĘTRZNY OBRYS 7 hexów
// (hex wodza + 6 sąsiadów), w kolorze cywilizacji, o grubości min. kilku px na ekranie.
// Test jednostkowy na module render/generalHexRing.ts (bez przeglądarki) + kontrola
// wiązania w render/units.ts (ring tylko dla wodza, bez raycast, dziecko sceny, nie żetonu).

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const esbuild = require(require.resolve('esbuild', { paths: [ROOT, process.cwd()] }));
const THREE = require(require.resolve('three', { paths: [ROOT, process.cwd()] }));

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'general-hex-ring-test-'));
const OUT = path.join(TMP, 'entry.cjs');

let pass = 0;
let fail = 0;
function check(label, ok, detail) {
  if (ok) { pass++; console.log('PASS:', label); }
  else { fail++; console.error('FAIL:', label, detail ?? ''); }
}
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

function bundle() {
  esbuild.buildSync({
    entryPoints: [path.join(ROOT, 'src/render/generalHexRing.ts')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: OUT,
    logLevel: 'silent',
    nodePaths: [path.resolve(path.dirname(require.resolve('three', { paths: [ROOT, process.cwd()] })), '..', '..')],
  });
  return require(OUT);
}

const mod = bundle();
const R = 1.0; // HEX_R (hexutil.ts)
const SQRT3 = Math.sqrt(3);

// --- 1. Obrys: 18 krawędzi zewnętrznych, zamknięta pętla o obwodzie 18R ---
const loop = mod.getGeneralRingLoop();
const n = loop.points.length;
check('obrys 7 hexów ma 18 narożników (18 krawędzi zewnętrznych)', n === 18, `n=${n}`);

let perimeter = 0;
let closed = true;
for (let i = 0; i < n; i++) {
  const p = loop.points[i];
  const q = loop.points[(i + 1) % n];
  perimeter += Math.hypot(q.x - p.x, q.z - p.z);
}
check('obwód obrysu = 18 × R (każda krawędź hexa wchodzi raz)', near(perimeter, 18 * R, 1e-5), `perimeter=${perimeter}`);
// zamknięcie: każdy punkt ma dokładnie dwóch sąsiadów na obwodzie (brak rozłączeń)
const keyOf = (p) => `${Math.round(p.x * 1e5)},${Math.round(p.z * 1e5)}`;
const degree = new Map();
for (let i = 0; i < n; i++) {
  const a = keyOf(loop.points[i]);
  const b = keyOf(loop.points[(i + 1) % n]);
  degree.set(a, (degree.get(a) || 0) + 1);
  degree.set(b, (degree.get(b) || 0) + 1);
}
for (const [, d] of degree) if (d !== 2) closed = false;
check('pętla obrysu jest zamknięta (stopień 2 w każdym punkcie)', closed && degree.size === n);

// --- 2. Obrys omija hex wodza i leży poza jego wnętrzem ---
const inradius = (SQRT3 / 2) * R;
const minDist = Math.min(...loop.points.map((p) => Math.hypot(p.x, p.z)));
check('obrys leży poza hexem wodza (min odległość ≥ inradius)', minDist >= inradius - 1e-6, `min=${minDist}`);
const maxDist = Math.max(...loop.points.map((p) => Math.hypot(p.x, p.z)));
check('najdalsze narożniki obrysu = √7 R (narożnik sąsiada)', near(maxDist, Math.sqrt(7) * R, 1e-5), `max=${maxDist}`);

// --- 3. Normale wskazują na zewnątrz (dodatni iloczyn z wektorem od środka do krawędzi) ---
let outward = true;
for (let i = 0; i < n; i++) {
  const p = loop.points[i];
  const q = loop.points[(i + 1) % n];
  const mx = (p.x + q.x) / 2;
  const mz = (p.z + q.z) / 2;
  const nr = loop.normals[i];
  if (mx * nr.x + mz * nr.z <= 0) outward = false;
}
check('normale krawędzi skierowane na zewnątrz obrysu', outward);

// --- 4. Geometria pasa w kolorze cywilizacji, bez wpływu na klikanie ---
const COLOR = 0x2a7fd4;
const ring = mod.createGeneralHexRing(COLOR);
check('pas ma kolor cywilizacji właściciela', ring.mesh.material.color.getHex() === COLOR);
check('pas jest w płaszczyźnie XZ (y = 0)', (() => {
  const pos = ring.mesh.geometry.attributes.position.array;
  for (let i = 1; i < pos.length; i += 3) if (pos[i] !== 0) return false;
  return true;
})());
check('pas nie przechwytuje raycastów (klikalność hexów bez zmian)', (() => {
  const rc = new THREE.Raycaster(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -1, 0));
  const out = [];
  ring.mesh.raycast(rc, out);
  return out.length === 0;
})());
check('pas nie zasłania wodza: wnętrze obrysu bez wierzchołków pasa', (() => {
  const pos = ring.mesh.geometry.attributes.position.array;
  for (let i = 0; i < pos.length; i += 3) {
    if (Math.hypot(pos[i], pos[i + 2]) < inradius) return false;
  }
  return true;
})());
check('pas ma renderOrder nad hexami i pod żetonami', ring.mesh.renderOrder > 0 && ring.mesh.renderOrder < 55);

// --- 5. Grubość: zapis w miejscu, bez zmiany liczby wierzchołków ---
const vertsBefore = ring.mesh.geometry.attributes.position.count;
const w1 = ring.width;
ring.setWidth(w1 * 2);
check('setWidth zmienia grubość bez realokacji geometrii', ring.width === w1 * 2 &&
  ring.mesh.geometry.attributes.position.count === vertsBefore);
// pas o szerokości w: każdy kwadrat krawędzi ma wierzchołki wewnętrzne/zewnętrzne w odległości ~w·|m|
const pos2 = ring.mesh.geometry.attributes.position.array;
let maxSpan = 0;
for (let i = 0; i < pos2.length; i += 18) {
  // trójkąt 1: (ai, bi, bj) – odległość ai–bi to radialna grubość w narożniku
  const d = Math.hypot(pos2[i + 3] - pos2[i], pos2[i + 5] - pos2[i + 2]);
  if (d > maxSpan) maxSpan = d;
}
check('pas w rzeczywistości ma wskazaną grubość (zewnętrzna krawędź dalej o ~w)', maxSpan > w1 * 2 * 0.9, `span=${maxSpan}`);
ring.dispose();

// --- 6. Minimalna grubość w pikselach przy oddaleniu ---
const FOV = 50;
const VH = 900;
function pxOf(camDist) {
  const w = mod.generalRingWorldWidth(camDist, FOV, VH);
  const worldPerPx = (2 * camDist * Math.tan((FOV * Math.PI) / 360)) / VH;
  return w / worldPerPx;
}
check('przy dużym oddaleniu pas ma ≥ 4 px (min. kilka px)', [200, 400, 800].every((d) => pxOf(d) >= mod.GENERAL_RING_MIN_PX - 1e-6),
  `px=${[200, 400, 800].map(pxOf)}`);
check('przy zbliżeniu pas ma bazową grubość świata', near(mod.generalRingWorldWidth(5, FOV, VH), mod.GENERAL_RING_BASE_WIDTH));
check('grubość rośnie wraz z oddaleniem (skalowanie z zoomem)', mod.generalRingWorldWidth(800, FOV, VH) > mod.generalRingWorldWidth(400, FOV, VH));
check('brak poprawnych danych kamery → bazowa grubość', mod.generalRingWorldWidth(0, FOV, VH) === mod.GENERAL_RING_BASE_WIDTH);

// --- 6b. Wysokość pasa: nad najwyższym z 7 hexów obrysu (nie przysłaniany przez wyższego sąsiada) ---
check('generalRingY: pas = najwyższy teren z 7 hexów + odstęp', near(mod.generalRingY([0.2, 0.5, 0.1, 0.38]), 0.5 + mod.GENERAL_RING_LIFT),
  `y=${mod.generalRingY([0.2, 0.5, 0.1, 0.38])}`);
check('generalRingY: wzgórze sąsiada wyżej niż wódz → pas nad wzgórzem', mod.generalRingY([0.06, 0.6]) > 0.6);
check('generalRingY: brak danych → poziom 0 + odstęp', near(mod.generalRingY([]), mod.GENERAL_RING_LIFT));
check('generalRingY: wartości niepoprawne (NaN) są pomijane', near(mod.generalRingY([NaN, 0.3]), 0.3 + mod.GENERAL_RING_LIFT));
check('GENERAL_RING_HEX_OFFSETS: 7 hexów (środek + 6 sąsiadów)', mod.GENERAL_RING_HEX_OFFSETS.length === 7);

// --- 7. Wiązanie w units.ts: obwódka tylko dla wodza, poza żetonem, z LOD ---
const unitsSrc = fs.readFileSync(path.join(ROOT, 'src/render/units.ts'), 'utf8');
check('units.ts: ring tworzony tylko gdy hasCommander (wczesny powrót bez wodza)',
  /_syncGeneralRing\(unit: RuntimeUnit, hasCommander: boolean\)[\s\S]*?if \(!hasCommander\) \{[\s\S]*?return;/.test(unitsSrc));
check('units.ts: ring jest obiektem sceny, nie dzieckiem żetonu (brak scalania części)',
  /this\.scene\.add\(ring\.mesh\)/.test(unitsSrc) && !/group\.add\(ring/.test(unitsSrc));
check('units.ts: widoczność pasa zgodna z żetonem (mgła / ukryty non-reprezentant)',
  /entry\.ring\.mesh\.visible = this\.tokens\.get\(id\)\?\.visible === true/.test(unitsSrc));
check('units.ts: wysokość pasa z najwyższego z 7 hexów (generalRingY + topYAt), nie z jednego hexa',
  /generalRingY\(tops\)/.test(unitsSrc) && /GENERAL_RING_HEX_OFFSETS\.map\(\(\[dq, dr\]\) => this\.topYAt\(unit\.q \+ dq, unit\.r \+ dr\)\)/.test(unitsSrc));
check('units.ts: setTokenWorldPosition przesuwa pas wodza razem z żetonem (X/Z)',
  /setTokenWorldPosition\(id: string[\s\S]*?generalRings\.get\(id\)[\s\S]*?ring\.mesh\.position\.x = x;[\s\S]*?ring\.mesh\.position\.z = z;/.test(unitsSrc));
check('main.ts: LOD grubości pasa wołany w pętli renderu',
  /unitRenderer\.applyGeneralRingLod\(dist, camera\.fov, canvas\.clientHeight\)/.test(
    fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8')));

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* sprzątanie best-effort */ }

console.log(`\nWynik: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
