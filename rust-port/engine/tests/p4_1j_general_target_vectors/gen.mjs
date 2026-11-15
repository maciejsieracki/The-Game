// P4-1J-GENERALTARGET-WDROZENIE: generator wektorow zapisu i odczytu pola `generalTargetId`
// planu marszu (warstwa PlayableState) z URUCHOMIONEGO kodu pinu 07d2fbd72.
//
// Generator WYKONUJE funkcje z `gra/src/game/planned-march.ts` (wyciete po nazwie, typy zdjete przez
// node:module stripTypeScriptTypes):
//   * validateAutoMarchFromSave (437-448), plannedMarchesFromSave (451-482, galezie :466 i :471-472),
//   * plannedMarchesToSave (485-501, linia :496).
// Straznik SHA-256: plik zrodlowy i kazdy wyciety fragment musza miec zapisane skroty; inaczej
// generator odmawia pracy (pin nie jest tym, ktory wybrano).
//
// Przypadki:
//   * roundtrip: wpisy `PlannedMarchDest` (web) -> plannedMarchesToSave -> JSON.stringify (zapis)
//                -> JSON.parse -> plannedMarchesFromSave (odczyt) -> `loaded`;
//   * raw:       surowy tekst pol zapisu -> JSON.parse -> plannedMarchesFromSave -> `loaded`.
// Wlasciciel `0` = gracz (web). Przypadki recznie wybrane + LCG (deterministyczny).
//
// Uzycie (WEB_ROOT = katalog z `gra/src/game/planned-march.ts` z pinu, np.
// `git show 07d2fbd72:gra/src/game/planned-march.ts`, poza repo; Node 22.13+):
//   node gen.mjs <WEB_ROOT>                 -> JSON wektorow na stdout
//   node gen.mjs <WEB_ROOT> --check <PLIK>  -> porownanie z plikiem vectors.json (exit 1 przy roznicy)

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT, flag, checkFile] = process.argv.slice(2);
if (!WEB_ROOT) throw new Error('uzycie: gen.mjs <WEB_ROOT> [--check <vectors.json>]');
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const FILE = path.join(WEB_ROOT, 'gra', 'src', 'game', 'planned-march.ts');
const FILE_SHA256 = '12fa88cdf73947d1203e4d3fda414d1398080d436534231f8df78d0329b9ce0e';
const FRAGMENT_SHA256 = {
  validateAutoMarchFromSave: '11c9e255387567fdba34fa0e6e56eff7472341d09441ee82c825becb27f0eebe',
  plannedMarchesFromSave: '127a9238ab3e93d64b94681c41cc695534bb0a573eab642b591971e4132d7daa',
  plannedMarchesToSave: 'be01a3822e5b8dba02dd168271f238473741d45d33423e8f882b4d5e0c4ef4d4',
};

const sha256 = text => createHash('sha256').update(text).digest('hex');

const source = readFileSync(FILE, 'utf8');
if (sha256(source) !== FILE_SHA256) throw new Error(`straznik SHA-256 planned-march.ts: ${sha256(source)} != ${FILE_SHA256} (pin ${PIN})`);
const lines = source.split('\n');

// Wycinek funkcji po nazwie: od deklaracji do domykajacego nawiasu o tym samym wcieciu.
function extractFn(name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const hits = lines.map((l, idx) => (re.test(l) ? idx : -1)).filter(idx => idx >= 0);
  if (hits.length !== 1) throw new Error(`funkcja ${name}: oczekiwano 1 deklaracji, jest ${hits.length}`);
  const start = hits[0];
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  const text = lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
  const hash = sha256(text);
  if (hash !== FRAGMENT_SHA256[name]) throw new Error(`straznik SHA-256 fragmentu ${name}: ${hash} != ${FRAGMENT_SHA256[name]}`);
  return { from: start + 1, to: end + 1, text, sha256: hash };
}

const strip = src => stripTypeScriptTypes(src, { mode: 'strip' });
const fnValidate = extractFn('validateAutoMarchFromSave');
const fnFromSave = extractFn('plannedMarchesFromSave');
const fnToSave = extractFn('plannedMarchesToSave');

const { plannedMarchesFromSave, plannedMarchesToSave } = new Function(`
${strip(fnValidate.text)}
${strip(fnFromSave.text)}
${strip(fnToSave.text)}
return { validateAutoMarchFromSave, plannedMarchesFromSave, plannedMarchesToSave };
`)();

// --- deterministyczny LCG ---
let seed = 0x3a7c91e5;
function rnd() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const U = (id, ownerId, q, r) => ({ id, ownerId, q, r });
const GENERALS = ['g1', 'L', '07', '4294967295', 'gen-ż1', 'x y', 'G-2'];
const ID_POOL = ['1', '2', '3', '5', '7', '10', '12', '100', '4294967294', '4294967295'];

// Zapis (web): wpisy Map -> plannedMarchesToSave -> JSON jak localStorage.
function runRoundtrip(name, units, marches) {
  const saveText = JSON.stringify(plannedMarchesToSave(new Map(marches)));
  const parsed = JSON.parse(saveText);
  const loaded = [...plannedMarchesFromSave(parsed.autoMarch, parsed.plannedMarches, units, 0).entries()];
  return { name, units, marches, saveText, loaded };
}

// Odczyt surowego tekstu zapisu (web).
function runRaw(name, units, rawSave) {
  const parsed = JSON.parse(rawSave);
  const loaded = [...plannedMarchesFromSave(parsed.autoMarch, parsed.plannedMarches, units, 0).entries()];
  return { name, units, rawSave, loaded };
}

const roundtrip = [];
const raw = [];
const baseUnits = [U('1', 0, 0, 0), U('2', 0, 1, 1), U('3', 0, 2, 2), U('5', 1, 3, 3), U('7', 0, 4, 4), U('12', 0, 0, 5)];

// ---- roundtrip: przypadki reczne ----
roundtrip.push(runRoundtrip('pusta mapa: zapis {}, odczyt pusty', baseUnits, []));
roundtrip.push(runRoundtrip('generalTargetId na pozycji innej niz jednostka: zachowany', baseUnits,
  [['3', { destQ: 5, destR: 5, generalTargetId: 'g1' }]]));
roundtrip.push(runRoundtrip('generalTargetId na pozycji jednostki: wpis zostaje (planned-march.ts:466)', baseUnits,
  [['3', { destQ: 2, destR: 2, generalTargetId: 'L' }]]));
roundtrip.push(runRoundtrip('pusty generalTargetId na pozycji jednostki: wpis pominiety', baseUnits,
  [['3', { destQ: 2, destR: 2, generalTargetId: '' }]]));
roundtrip.push(runRoundtrip('pusty generalTargetId na innej pozycji: zapis bez pola', baseUnits,
  [['3', { destQ: 4, destR: 0, generalTargetId: '' }]]));
roundtrip.push(runRoundtrip('generalTargetId i attackUnitId razem', baseUnits,
  [['1', { destQ: 4, destR: 4, attackUnitId: '7', generalTargetId: 'L' }]]));
roundtrip.push(runRoundtrip('mieszane: generał z niekanonicznym id, zwykly marsz, generał', baseUnits,
  [['12', { destQ: 3, destR: 3, generalTargetId: '07' }], ['3', { destQ: 6, destR: 6 }], ['7', { destQ: 1, destR: 6, generalTargetId: 'g1' }]]));
roundtrip.push(runRoundtrip('pierwszy wpis (autoMarch) z generałem: autoMarch bez pola', baseUnits,
  [['5', { destQ: 0, destR: 0, generalTargetId: 'G-2' }], ['2', { destQ: 2, destR: 0 }]]));
roundtrip.push(runRoundtrip('kolejnosc kluczy: indeks 12 przed 3 i 4294967295 po nich', [U('4294967295', 0, 0, 0), ...baseUnits],
  [['4294967295', { destQ: 1, destR: 1, generalTargetId: 'gen-ż1' }], ['12', { destQ: 2, destR: 2, generalTargetId: 'x y' }], ['3', { destQ: 3, destR: 3 }]]));
roundtrip.push(runRoundtrip('generalTargetId na jednostce AI: odfiltrowany przy odczycie', baseUnits,
  [['5', { destQ: 8, destR: 8, generalTargetId: 'g1' }], ['2', { destQ: 9, destR: 9, generalTargetId: 'L' }]]));
roundtrip.push(runRoundtrip('generalTargetId z dlugim napisem', baseUnits,
  [['2', { destQ: 9, destR: 0, generalTargetId: 'g'.repeat(64) }]]));

// ---- roundtrip: LCG ----
for (let i = 0; i < 50; i++) {
  const units = [];
  for (const id of ID_POOL) {
    if (rnd() < 0.7) units.push(U(id, pick([0, 0, 0, 1]), int(0, 6), int(0, 6)));
  }
  const marches = [];
  for (const id of ID_POOL.slice().sort(() => rnd() - 0.5)) {
    if (rnd() < 0.5) continue;
    const unit = units.find(u => u.id === id);
    const atDest = unit && rnd() < 0.3;
    const dest = atDest ? { destQ: unit.q, destR: unit.r } : { destQ: int(-2, 7), destR: int(-2, 7) };
    if (rnd() < 0.25) dest.attackUnitId = pick(ID_POOL);
    const g = rnd();
    if (g < 0.5) dest.generalTargetId = pick(GENERALS);
    else if (g < 0.6) dest.generalTargetId = '';
    marches.push([id, dest]);
  }
  roundtrip.push(runRoundtrip(`losowy zapis generała #${i}`, units, marches));
}

// ---- raw: odczyt tekstu zapisu ----
raw.push(runRaw('brak planu', baseUnits, '{}'));
raw.push(runRaw('generalTargetId na pozycji jednostki: zostaje', baseUnits,
  '{"plannedMarches":{"2":{"destQ":1,"destR":1,"generalTargetId":"L"}}}'));
raw.push(runRaw('generalTargetId pusty na pozycji jednostki: pominiety', baseUnits,
  '{"plannedMarches":{"2":{"destQ":1,"destR":1,"generalTargetId":""}}}'));
raw.push(runRaw('generalTargetId null: brak pola', baseUnits,
  '{"plannedMarches":{"3":{"destQ":6,"destR":6,"generalTargetId":null}}}'));
raw.push(runRaw('generalTargetId liczba (nie napis): odrzucony jak w webie', baseUnits,
  '{"plannedMarches":{"3":{"destQ":6,"destR":6,"generalTargetId":5}}}'));
raw.push(runRaw('generalTargetId true: odrzucony jak w webie', baseUnits,
  '{"plannedMarches":{"3":{"destQ":6,"destR":6,"generalTargetId":true}}}'));
raw.push(runRaw('powtorzony klucz: ostatnia wartosc decyduje o generale', baseUnits,
  '{"plannedMarches":{"3":{"destQ":1,"destR":1,"generalTargetId":"g1"},"7":{"destQ":2,"destR":2},"3":{"destQ":4,"destR":0}}}'));
raw.push(runRaw('generalTargetId z attackUnitId', baseUnits,
  '{"plannedMarches":{"1":{"destQ":4,"destR":4,"attackUnitId":"5","generalTargetId":"g9"}}}'));
raw.push(runRaw('generalTargetId na nieznanej jednostce i na jednostce AI: pominiete', baseUnits,
  '{"plannedMarches":{"99":{"destQ":1,"destR":1,"generalTargetId":"g1"},"5":{"destQ":0,"destR":0,"generalTargetId":"g2"}}}'));
raw.push(runRaw('generalTargetId przy zlym destQ: pominiety wpis', baseUnits,
  '{"plannedMarches":{"2":{"destQ":"1","destR":1,"generalTargetId":"g1"}}}'));
raw.push(runRaw('legacy autoMarch z plannedMarches: generał tylko w plannedMarches', baseUnits,
  '{"autoMarch":{"leaderId":"12","destQ":0,"destR":0},"plannedMarches":{"3":{"destQ":6,"destR":6,"generalTargetId":"L"}}}'));
for (let i = 0; i < 40; i++) {
  const units = [];
  for (const id of ID_POOL) {
    if (rnd() < 0.7) units.push(U(id, pick([0, 0, 1]), int(0, 6), int(0, 6)));
  }
  const parts = [];
  const n = int(0, 5);
  for (let k = 0; k < n; k++) {
    const key = pick(ID_POOL);
    const unit = units.find(u => u.id === key);
    const destQ = unit && rnd() < 0.3 ? unit.q : int(-1, 7);
    const destR = unit && destQ === unit.q && rnd() < 0.7 ? unit.r : int(-1, 7);
    const fields = [`"destQ":${destQ}`, `"destR":${destR}`];
    const g = rnd();
    if (g < 0.4) fields.push(`"generalTargetId":${JSON.stringify(pick(GENERALS))}`);
    else if (g < 0.5) fields.push('"generalTargetId":""');
    else if (g < 0.6) fields.push('"generalTargetId":null');
    if (rnd() < 0.2) fields.push(`"attackUnitId":"${pick(ID_POOL)}"`);
    parts.push(`"${key}":{${fields.join(',')}}`);
  }
  const top = [];
  if (rnd() < 0.2) top.push(`"autoMarch":{"leaderId":"${pick(ID_POOL)}","destQ":${int(0, 6)},"destR":${int(0, 6)}}`);
  if (rnd() < 0.9) top.push(`"plannedMarches":{${parts.join(',')}}`);
  raw.push(runRaw(`losowy odczyt generała #${i}`, units, `{${top.join(',')}}`));
}

const out = {
  pin: PIN,
  sources: {
    'planned-march.ts': [
      `validateAutoMarchFromSave:${fnValidate.from}-${fnValidate.to}`,
      `plannedMarchesFromSave:${fnFromSave.from}-${fnFromSave.to}`,
      `plannedMarchesToSave:${fnToSave.from}-${fnToSave.to}`,
    ],
  },
  fragments: {
    validateAutoMarchFromSave: { sha256: fnValidate.sha256 },
    plannedMarchesFromSave: { sha256: fnFromSave.sha256 },
    plannedMarchesToSave: { sha256: fnToSave.sha256 },
  },
  roundtrip_cases: roundtrip,
  raw_cases: raw,
};
const json = JSON.stringify(out, null, 1) + '\n';

if (flag === '--check') {
  const current = readFileSync(checkFile, 'utf8');
  if (current !== json) {
    console.error('ROZNICA: vectors.json != wynik generatora');
    process.exit(1);
  }
  console.log(`OK: wektory zgodne (roundtrip=${roundtrip.length}, raw=${raw.length}, bajtow=${json.length})`);
} else {
  process.stdout.write(json);
}
