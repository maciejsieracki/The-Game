// P4.7 — pomiar meshy / trojkatow / gabarytow zywych modeli miast i cudow z pinu edb8fb56.
// Uruchamiany WYLACZNIE przez run_measure.py (pliki z `git show edb8fb56:` w katalogu tymczasowym,
// `three` = three-mock.js, bez npm, bez buildu, bez uruchamiania weba).
import { __measure, __extrudeHits } from 'three';
import { buildMiastoKamien, MIASTO_KAMIEN_LAYOUT } from './src/miasto-kamien.ts';
import { buildMiastoBrazGrecja, buildMiastoBrazRzym, MIASTO_BRAZ_LAYOUT } from './src/miasto-braz.ts';
import { buildWonderModel, WONDER_MODEL_IDS } from './src/wonderModels.ts';
import { buildBronzeCityRoblox } from './src/bronzeCityRoblox.ts';
import { BRONZE_CIVS } from './src/bronzeCity.ts';

const CITY_SCALE = 1.38;   // cities.ts:140 CITY_MODEL_SCALE (model niesie wewnetrzne 1/1.38)
const WONDER_SCALE = 1.15; // wonderRenderer.ts:27 WONDER_SCALE
const out: string[] = [];
const p = (s: string) => out.push(s);
const f3 = (x: number) => x.toFixed(3);
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const mean = (a: number[]) => sum(a) / a.length;
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2]! : (s[n / 2 - 1]! + s[n / 2]!) / 2; };

function row(name: string, g: any, worldScale: number) {
  const m = __measure(g);
  p(`${name}\tmesh=${m.meshes}\ttri=${m.tri}${m.triUnknown ? '+?' + m.triUnknown : ''}\tmat=${m.materials}\tmaxY_swiat=${f3(m.maxY * worldScale)}\tmaxR_swiat_rogiAABB=${f3(m.maxR_corners * worldScale)}\t${JSON.stringify(m.kinds)}`);
  return m;
}

type Set = { tri: number[]; mesh: number[] };
const sets: Record<string, Set> = {};

p('## MIASTO KAMIEN (era 1) — buildMiastoKamien(L, {mur})');
sets.kamien = { tri: [], mesh: [] };
for (let L = 1; L <= 10; L++) { const m = row(`kamien L${L} bezMuru`, buildMiastoKamien(L, {}), CITY_SCALE); sets.kamien.tri.push(m.tri); sets.kamien.mesh.push(m.meshes); }
for (const L of [3, 6, 10]) row(`kamien L${L} mur(palisada Biskupin)`, buildMiastoKamien(L, { mur: true }), CITY_SCALE);
p(`DEKLAROWANE (MIASTO_KAMIEN_LAYOUT.triPoziomy): ${JSON.stringify(MIASTO_KAMIEN_LAYOUT.triPoziomy)}`);
p(`ZMIERZONE: ${JSON.stringify(sets.kamien.tri)}`);

for (const [nm, fn] of [['grecja', buildMiastoBrazGrecja], ['rzym', buildMiastoBrazRzym]] as const) {
  p(`## MIASTO BRAZ ${nm} (era >= 2)`);
  sets[nm] = { tri: [], mesh: [] };
  for (let L = 1; L <= 10; L++) { const m = row(`braz-${nm} L${L} bezMuru`, fn(L, {}), CITY_SCALE); sets[nm]!.tri.push(m.tri); sets[nm]!.mesh.push(m.meshes); }
  for (const L of [3, 6, 10]) row(`braz-${nm} L${L} mur`, fn(L, { mur: true }), CITY_SCALE);
  for (const L of [3, 6, 10]) row(`braz-${nm} L${L} palisada`, fn(L, { palisada: true }), CITY_SCALE);
  p(`DEKLAROWANE (MIASTO_BRAZ_LAYOUT.triPoziomy.${nm}): ${JSON.stringify((MIASTO_BRAZ_LAYOUT.triPoziomy as any)[nm])}`);
  p(`ZMIERZONE: ${JSON.stringify(sets[nm]!.tri)}`);
}

p('## BUDZET MIAST NA POZIOM = ceil(srednia 3 zywych zestawow x 1.10)');
p('L\ttri(kamien,grecja,rzym)\tsrednia\tbudzetTri\tmesh(kamien,grecja,rzym)\tsrednia\tbudzetMesh');
for (let i = 0; i < 10; i++) {
  const t = [sets.kamien!.tri[i]!, sets.grecja!.tri[i]!, sets.rzym!.tri[i]!];
  const m = [sets.kamien!.mesh[i]!, sets.grecja!.mesh[i]!, sets.rzym!.mesh[i]!];
  p(`L${i + 1}\t${t.join(',')}\t${mean(t).toFixed(1)}\t${Math.ceil(mean(t) * 1.1)}\t${m.join(',')}\t${mean(m).toFixed(1)}\t${Math.ceil(mean(m) * 1.1)}`);
}
const allTri = [...sets.kamien!.tri, ...sets.grecja!.tri, ...sets.rzym!.tri];
const allMesh = [...sets.kamien!.mesh, ...sets.grecja!.mesh, ...sets.rzym!.mesh];
p(`MIASTA 30 konfiguracji bez muru: tri srednia=${mean(allTri).toFixed(1)} max=${Math.max(...allTri)}; mesh srednia=${mean(allMesh).toFixed(1)} max=${Math.max(...allMesh)}`);
const murG = 324, murR = 344; // roznica tri (mur - bezMuru) — sprawdzana nizej z pomiaru
const dG = row('kontrola mur grecja L3', buildMiastoBrazGrecja(3, { mur: true }), CITY_SCALE).tri - sets.grecja!.tri[2]!;
const dR = row('kontrola mur rzym L3', buildMiastoBrazRzym(3, { mur: true }), CITY_SCALE).tri - sets.rzym!.tri[2]!;
p(`MUR KAMIENNY: grecja +${dG} (deklarowane ${murG}), rzym +${dR} (deklarowane ${murR}); budzet nowego muru = ceil(srednia x 1.10) = ${Math.ceil(((dG + dR) / 2) * 1.1)}`);

p('## CUDA — buildWonderModel(id) bez ownerColor; swiat x1.15');
const wt: number[] = []; const wm: number[] = [];
for (const id of WONDER_MODEL_IDS) { const m = row(`cud ${id}`, buildWonderModel(id), WONDER_SCALE); wt.push(m.tri); wm.push(m.meshes); }
row('cud default (id spoza switch, np. parkowany nalanda)', buildWonderModel('nalanda'), WONDER_SCALE);
row('cud piramidy +ownerBanner', buildWonderModel('piramidy', { ownerColor: 0xff0000 }), WONDER_SCALE);
p(`CUDA n=${wt.length} tri: min=${Math.min(...wt)} max=${Math.max(...wt)} srednia=${mean(wt).toFixed(1)} mediana=${median(wt)} budzet=ceil(srednia x 1.10)=${Math.ceil(mean(wt) * 1.1)}`);
p(`CUDA n=${wm.length} mesh: min=${Math.min(...wm)} max=${Math.max(...wm)} srednia=${mean(wm).toFixed(1)} mediana=${median(wm)} budzet=ceil(srednia x 1.10)=${Math.ceil(mean(wm) * 1.1)}`);

p('## GHOST bronzeCityRoblox (podglad zakladania miasta, L1, bez muru) — referencja ksztaltow per cywilizacja');
for (const c of BRONZE_CIVS) row(`ghost-braz ${c} L1`, buildBronzeCityRoblox(c, 1, 0xffd54a, false), CITY_SCALE);
p(`EXTRUDE_HITS=${__extrudeHits()} (0 = zaden zmierzony model nie uzyl ExtrudeGeometry)`);
console.log(out.join('\n'));
