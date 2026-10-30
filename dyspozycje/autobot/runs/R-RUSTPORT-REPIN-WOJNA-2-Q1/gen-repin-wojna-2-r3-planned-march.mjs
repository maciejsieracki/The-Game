// Generator wektorow REPIN-WOJNA-2 R3 (planned-march.ts: generalTargetId w save/load).
// Zrodlo: gra/src/game/planned-march.ts @ dc8a3adc, linie 13-31 (typy) oraz 426-490 (validateAutoMarchFromSave,
// plannedMarchesFromSave, plannedMarchesToSave) - kod WEBA BEZ ZMIAN, wycinany dosłownie do pliku roboczego poza repo.
// Jedyna modyfikacja: typ RuntimeUnit (import z units/setup, nieosiagalny bez calego lancucha) zastapiony
// lokalna deklaracja typu; `import` i `export` zachowane. node --experimental-strip-types usuwa typy.
//
// Uruchomienie: node --experimental-strip-types ./gen-repin-wojna-2-r3-planned-march.mjs <WEB_ROOT> <WORK_DIR> <OUT_FILE>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, workDir, outFile] = process.argv.slice(2);
if (!webRoot || !workDir || !outFile) throw new Error('uzycie: <WEB_ROOT> <WORK_DIR> <OUT_FILE>');

const src = readFileSync(join(webRoot, 'gra/src/game/planned-march.ts'), 'utf8').split('\n');
const lineRange = (a, b) => src.slice(a - 1, b).join('\n');
// zakres typow: interfejsy PlannedMarchDest / AutoMarchSave / PlannedMarchesSave (linie 13-31)
const typeBlock = lineRange(13, 31);
// zakres funkcji: validateAutoMarchFromSave .. koniec plannedMarchesToSave (linie 425-490)
const fnBlock = lineRange(425, 490);
if (!fnBlock.includes('export function validateAutoMarchFromSave')) throw new Error('zla linia validateAutoMarchFromSave');
if (!fnBlock.includes('export function plannedMarchesToSave')) throw new Error('zla linia plannedMarchesToSave');
mkdirSync(workDir, { recursive: true });
const modSrc = [
  'type RuntimeUnit = { id: string; ownerId: number; q: number; r: number };',
  typeBlock,
  fnBlock,
  '',
].join('\n');
writeFileSync(join(workDir, 'pm-save.ts'), modSrc);
const PM = await import(pathToFileURL(join(workDir, 'pm-save.ts')).href);

// ---- deterministyczny PRNG (LCG) ----
let seed = 20261031;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const randInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// wartosci wejsciowe: liczba skonczona, brak (undefined), null (= niefinite w JSON), NaN-owa reprezentacja
const coord = () => {
  const x = rnd();
  if (x < 0.06) return undefined;
  if (x < 0.1) return null;
  return randInt(0, 4);
};
const strField = () => pick([undefined, undefined, '', 'x1', 'g1', 'g2']);

const counts = {
  fromSaveCases: 0,
  kept: 0,
  dropped: 0,
  keptWithGeneral: 0,
  droppedStaleWithGeneralEmpty: 0,
  stalePosWithGeneral: 0,
  stalePosNoGeneral: 0,
  legacyAdded: 0,
  toSaveCases: 0,
  toSaveWithGeneral: 0,
  toSaveEmptyMarch: 0,
};

const toObj = (entries) => {
  const o = {};
  for (const [k, v] of entries) o[k] = v;
  return o;
};

// ---- plannedMarchesFromSave ----
const fromSave = [];
for (let c = 0; c < 900; c++) {
  const nUnits = randInt(1, 4);
  const units = [];
  for (let i = 0; i < nUnits; i++) {
    units.push({ id: `u${i}`, ownerId: rnd() < 0.85 ? 0 : 1, category: 'piechota', q: randInt(0, 4), r: randInt(0, 4) });
  }
  const nPlanned = randInt(0, 4);
  const plannedEntries = [];
  const used = new Set();
  for (let i = 0; i < nPlanned; i++) {
    // uid: zwykle istniejaca jednostka, czasem nieistniejaca
    const uid = rnd() < 0.9 ? pick(units).id : 'ghost';
    if (used.has(uid)) continue;
    used.add(uid);
    const unit = units.find((u) => u.id === uid);
    let destQ = coord();
    let destR = coord();
    // czesto: cel = aktualna pozycja jednostki (przypadek "stale" z generalTargetId)
    if (unit && rnd() < 0.4) {
      destQ = unit.q;
      destR = unit.r;
    }
    const dest = rnd() < 0.05 ? null : {
      destQ,
      destR,
      attackUnitId: strField(),
      generalTargetId: strField(),
    };
    plannedEntries.push([uid, dest]);
  }
  let saved = null;
  if (rnd() < 0.3) {
    const lu = pick(units);
    saved = { leaderId: rnd() < 0.9 ? lu.id : 'ghost', destQ: coord(), destR: coord() };
    if (saved.destQ === undefined) delete saved.destQ;
    if (saved.destR === undefined) delete saved.destR;
    if (rnd() < 0.2) saved.destQ = lu.q;
    if (rnd() < 0.2) saved.destR = lu.r;
  }
  const owner = 0;
  // wejscie dla web: JSON-owe null -> undefined (niefinite), absent -> brak klucza
  const toWebDest = (d) => {
    if (!d) return d;
    const o = {};
    if (d.destQ !== undefined) o.destQ = d.destQ === null ? undefined : d.destQ;
    if (d.destR !== undefined) o.destR = d.destR === null ? undefined : d.destR;
    if (d.attackUnitId !== undefined) o.attackUnitId = d.attackUnitId;
    if (d.generalTargetId !== undefined) o.generalTargetId = d.generalTargetId;
    return o;
  };
  const webPlanned = plannedEntries.length === 0 && rnd() < 0.5
    ? undefined
    : toObj(plannedEntries.map(([u, d]) => [u, toWebDest(d)]));
  const webSaved = saved === null ? undefined : { leaderId: saved.leaderId, destQ: saved.destQ === null ? undefined : saved.destQ, destR: saved.destR === null ? undefined : saved.destR };
  const out = PM.plannedMarchesFromSave(webSaved, webPlanned, units, owner);
  const outEntries = [...out.entries()];
  counts.fromSaveCases++;
  for (const [uid, d] of plannedEntries) {
    const u = units.find((x) => x.id === uid);
    const valid = d && Number.isFinite(d.destQ) && Number.isFinite(d.destR) && u && u.ownerId === owner;
    if (!valid) { counts.dropped++; continue; }
    const stale = u.q === d.destQ && u.r === d.destR;
    const hasGen = typeof d.generalTargetId === 'string' && d.generalTargetId.length > 0;
    if (stale && hasGen) counts.stalePosWithGeneral++;
    if (stale && !hasGen) counts.stalePosNoGeneral++;
    if (hasGen) counts.keptWithGeneral++;
    if (d.generalTargetId === '' && stale) counts.droppedStaleWithGeneralEmpty++;
  }
  counts.kept += outEntries.length;
  const webOutArr = outEntries.map(([uid, d]) => [uid, d]);
  if (saved && webOutArr.some(([uid]) => uid === saved.leaderId) && !(webPlanned && webPlanned[saved.leaderId])) counts.legacyAdded++;
  fromSave.push({
    units,
    owner,
    saved,
    planned: plannedEntries.length === 0 && webPlanned === undefined ? null : plannedEntries.map(([u, d]) => [u, d]),
    out: JSON.parse(JSON.stringify(webOutArr)),
  });
}

// ---- plannedMarchesToSave ----
const toSave = [];
for (let c = 0; c < 300; c++) {
  const n = randInt(0, 3);
  const marches = [];
  const used = new Set();
  for (let i = 0; i < n; i++) {
    const uid = `u${randInt(0, 5)}`;
    if (used.has(uid)) continue;
    used.add(uid);
    const d = { destQ: randInt(0, 4), destR: randInt(0, 4), attackUnitId: strField(), generalTargetId: strField() };
    if (d.attackUnitId === undefined) delete d.attackUnitId;
    if (d.generalTargetId === undefined) delete d.generalTargetId;
    marches.push([uid, d]);
  }
  const map = new Map(marches.map(([u, d]) => [u, { ...d }]));
  const got = PM.plannedMarchesToSave(map);
  counts.toSaveCases++;
  if (marches.length === 0) counts.toSaveEmptyMarch++;
  if (marches.some(([, d]) => typeof d.generalTargetId === 'string' && d.generalTargetId.length > 0)) counts.toSaveWithGeneral++;
  toSave.push({
    marches,
    out: JSON.parse(JSON.stringify(got)),
  });
}

const doc = {
  source: 'gra/src/game/planned-march.ts @ dc8a3adc (validateAutoMarchFromSave, plannedMarchesFromSave, plannedMarchesToSave, 1:1)',
  generator: 'dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/gen-repin-wojna-2-r3-planned-march.mjs',
  seed: 20261031,
  counts,
  fromSave,
  toSave,
};
const text = JSON.stringify(doc);
writeFileSync(outFile, text);
console.log(JSON.stringify(counts));
console.log(`bytes=${Buffer.byteLength(text)}`);
