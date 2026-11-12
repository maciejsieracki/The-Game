// P6-UNIT-REPLACE-L3-DEFS: generator wektorow dla portu web `categoryOf`
// (gra/src/units/setup.ts) do plikow JSON czytanych przez test Rust
// `tests/p6_unit_replace_defs.rs`.
//
// Uruchomienie (z dowolnego katalogu; sciezki bezwzgledne):
//   node gen-category-vectors.mjs <pin/setup.ts> <pin/units.json> <rust/units.json> <out-dir>
//
// Wyjscie (w <out-dir>):
//   category-vectors-pin.json    - wiersz na jednostke z PINU: wejscie + kategoria z node(pin categoryOf)
//   category-vectors-rust.json   - wiersz na jednostke z rust-port/engine/data/units.json: wejscie + kategoria
//                                  z node(pin categoryOf) na danych Rust (ta sama funkcja, dane Rust)
//   category-vectors-edge.json   - przypadki skrajne i nieznane typy (pisane recznie, wynik z node)
//   category-discrepancies.json  - jednostki, dla ktorych kategoria rozni sie miedzy pinem a danymi Rust
//                                  (rozbieznosc DANYCH, nie portu; nie rozstrzygana tutaj)
//
// Funkcja jest wykonywana z TYPE-STRIPPING tekstu pinu (bez zadnej przeróbki logiki).
import fs from 'node:fs';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [, , setupPath, pinUnitsPath, rustUnitsPath, outDir] = process.argv;
if (!setupPath || !pinUnitsPath || !rustUnitsPath || !outDir) {
  console.error('usage: node gen-category-vectors.mjs <setup.ts> <pin units.json> <rust units.json> <out-dir>');
  process.exit(2);
}

const lines = fs.readFileSync(setupPath, 'utf8').split('\n');
const start = lines.findIndex((l) => l.startsWith('function normalizeForMatch'));
const end = lines.findIndex((l) => l.startsWith('// listUnitTypes'));
if (start < 0 || end < 0 || end <= start) {
  throw new Error('nie znaleziono bloku normalizeForMatch/categoryOf w setup.ts');
}
const fragment = lines.slice(start, end).join('\n');
const js = stripTypeScriptTypes(fragment);
const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const categoryOf = mod.categoryOf;
if (typeof categoryOf !== 'function') throw new Error('categoryOf nie wyeksportowane z fragmentu');

// Wejscie w ksztalcie web: (name, role, isSuper, typ) jak w listUnitTypes().
function inputFromRecord(u) {
  return {
    name: u.Jednostka ?? '',
    role: u['Rola (linia)'] ?? '',
    is_super: u['Super-jednostka'] === 'TAK',
    typ: u['Typ'] ?? '',
  };
}
function withExpected(input) {
  return { ...input, expected: categoryOf(input.name, input.role, input.is_super, input.typ) };
}

const pinUnits = JSON.parse(fs.readFileSync(pinUnitsPath, 'utf8'));
const rustUnits = JSON.parse(fs.readFileSync(rustUnitsPath, 'utf8'));

const pinRows = pinUnits.map((u) => ({ ...withExpected(inputFromRecord(u)) }));
const rustRows = rustUnits.map((u) => ({ ...withExpected(inputFromRecord(u)) }));

// Przypadki skrajne: nazwy z diakrytykami, kolejnosc regul, super nad wszystkim, typ bez slow kluczowych,
// "Offensive" (celowo bez fallbacku), pusty typ, nieznany typ, puste napisy.
const edgeInputs = [
  { name: 'Osadnik', role: '', is_super: false, typ: '' },
  { name: 'Robotnik', role: '', is_super: false, typ: '' },
  { name: 'Zwiadowca', role: '', is_super: false, typ: '' },
  { name: 'Łucznik', role: '', is_super: false, typ: '' },
  { name: 'Łuczniczka', role: '', is_super: false, typ: '' },
  { name: 'Legion Rzymski', role: '', is_super: false, typ: '' },
  { name: 'Legionista', role: 'Wręcz', is_super: false, typ: 'Swordsman' },
  { name: 'Wojownik tyrreński', role: '', is_super: false, typ: 'Offensive' },
  { name: 'Wojownik', role: '', is_super: false, typ: 'Offensive' },
  { name: 'Wojownik', role: '', is_super: false, typ: '' },
  { name: 'Wojownik', role: '', is_super: false, typ: null },
  { name: 'Piechota hetycka', role: '', is_super: false, typ: 'Spearman' },
  { name: 'Gwardia Ishtar', role: '', is_super: false, typ: 'Swordsman' },
  { name: 'Gwardia Ishtar', role: '', is_super: false, typ: 'Nieznany typ' },
  { name: 'Okręt', role: 'Morska', is_super: false, typ: 'Naval' },
  { name: 'Rydwan', role: '', is_super: false, typ: 'Mount' },
  { name: 'Rydwan', role: '', is_super: true, typ: 'Swordsman' },
  { name: 'Osadnik', role: '', is_super: true, typ: '' },
  { name: 'Taran', role: '', is_super: false, typ: '' },
  { name: 'Katapulta', role: 'Oblężnicza', is_super: false, typ: 'Siege' },
  { name: 'Falanga', role: '', is_super: false, typ: '' },
  { name: 'Hoplita', role: '', is_super: false, typ: '' },
  { name: 'Champi', role: '', is_super: false, typ: 'Offensive' },
  { name: 'Maczuga gwiazdzista (champi)', role: '', is_super: false, typ: 'Offensive' },
  { name: 'Topór bojowy', role: '', is_super: false, typ: 'Offensive' },
  { name: 'Konnica lekka', role: 'Konnica', is_super: false, typ: 'Mount' },
  { name: 'Jeździec', role: '', is_super: false, typ: 'Distance' },
  { name: 'Procarz', role: '', is_super: false, typ: 'Slinger' },
  { name: '', role: '', is_super: false, typ: '' },
  { name: '', role: '', is_super: true, typ: '' },
  { name: 'Nieznana jednostka XYZ', role: 'Brak', is_super: false, typ: 'Brak' },
  { name: 'Ż', role: 'Ł', is_super: false, typ: 'Ś' },
];
const edgeRows = edgeInputs.map(withExpected);

// Rozbieznosci danych: pin vs Rust po nazwie (Jednostka). Obie kategorie liczone ta sama funkcja.
const pinByName = new Map(pinRows.map((r) => [r.name, r]));
const rustByName = new Map(rustRows.map((r) => [r.name, r]));
const discrepancies = [];
for (const [name, rr] of rustByName) {
  const pr = pinByName.get(name);
  if (!pr) {
    discrepancies.push({ name, kind: 'brak-w-pinie', rust: rr.expected, pin: null });
    continue;
  }
  const sameInput = pr.role === rr.role && pr.is_super === rr.is_super && pr.typ === rr.typ;
  if (pr.expected !== rr.expected || !sameInput) {
    discrepancies.push({
      name,
      kind: pr.expected !== rr.expected ? 'kategoria-rozna' : 'dane-rozne-kategoria-ta-sama',
      rust: rr.expected,
      pin: pr.expected,
      rust_input: { role: rr.role, is_super: rr.is_super, typ: rr.typ },
      pin_input: { role: pr.role, is_super: pr.is_super, typ: pr.typ },
    });
  }
}
for (const [name, pr] of pinByName) {
  if (!rustByName.has(name)) discrepancies.push({ name, kind: 'brak-w-rust', rust: null, pin: pr.expected });
}

fs.mkdirSync(outDir, { recursive: true });
const write = (file, data) => fs.writeFileSync(path.join(outDir, file), JSON.stringify(data, null, 2) + '\n');
write('category-vectors-pin.json', pinRows);
write('category-vectors-rust.json', rustRows);
write('category-vectors-edge.json', edgeRows);
write('category-discrepancies.json', discrepancies);

const summary = {
  pin_units: pinRows.length,
  rust_units: rustRows.length,
  edge: edgeRows.length,
  discrepancies: discrepancies.length,
  discrepancy_kinds: discrepancies.reduce((acc, d) => ({ ...acc, [d.kind]: (acc[d.kind] ?? 0) + 1 }), {}),
};
console.log(JSON.stringify(summary, null, 2));
