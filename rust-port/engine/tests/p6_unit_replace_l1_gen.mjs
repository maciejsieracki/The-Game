// P6-UNIT-REPLACE-L1 (R-RUSTPORT-P6-UNIT-REPLACE-L1-Q1): generator wektorow awansow piechoty.
//
// Uruchomienie (Node 22, bez zaleznosci):
//   node rust-port/engine/tests/p6_unit_replace_l1_gen.mjs <sciezka/do/gra/data/units.json z pinu> \
//        rust-port/engine/tests/p6_unit_replace_l1_vectors/infantry-promotion.json
//
// Wejscie: plik `gra/data/units.json` z pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75
// (odczyt: `git show 07d2fbd72f758705f8e1d59cc4968027ffbafe75:gra/data/units.json > <plik>`).
// Wyjscie: wektory JSON, z ktorych test Rust (`tests/p6_unit_replace_l1.rs`) porownuje
// wynik `available_replacements_for` z celami `Zastąp specjalnie` z pinu. Nic nie jest wpisywane recznie.

import { readFileSync, writeFileSync } from 'node:fs';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const INFANTRY = new Set(['Swordsman', 'Spearman', 'Falangite', 'Offensive']);
const BLANK = new Set(['', '-', '—']);

const [, , unitsPath, outPath] = process.argv;
if (!unitsPath || !outPath) {
  console.error('uzycie: node p6_unit_replace_l1_gen.mjs <pin units.json> <wyjscie.json>');
  process.exit(2);
}

const units = JSON.parse(readFileSync(unitsPath, 'utf8'));
const byName = new Map(units.map(u => [String(u.Jednostka).trim(), u]));

const str = v => (v === undefined || v === null ? null : String(v));

// Pelne wiersze wejsciowe (pola czytane przez `UnitReplaceRow`), kolejnosc z pinu.
const rows = units.map(u => ({
  Jednostka: str(u.Jednostka),
  Epoka: str(u.Epoka),
  'Pieniądz (koszt)': typeof u['Pieniądz (koszt)'] === 'number' ? u['Pieniądz (koszt)'] : null,
  'Super-jednostka': str(u['Super-jednostka']),
  'Rola (linia)': str(u['Rola (linia)']),
  Surowiec: str(u.Surowiec),
  Typ: str(u.Typ),
  Nacja: str(u.Nacja),
  Tech: str(u.Tech),
  'W zamian za': str(u['W zamian za']),
  'Zastąp specjalnie': str(u['Zastąp specjalnie']),
}));

// Awanse piechoty: cel = pole `Zastąp specjalnie` z pinu, rozbity na `/` (kolejnosc z pinu).
const infantry = [];
for (const u of units) {
  if (!INFANTRY.has(String(u.Typ).trim())) continue;
  const raw = String(u['Zastąp specjalnie'] ?? '').trim();
  if (BLANK.has(raw)) continue;
  const targets = raw.split('/').map(s => s.trim()).filter(Boolean);
  for (const t of targets) {
    if (!byName.has(t)) throw new Error(`cel spoza pinu: ${u.Jednostka} -> ${t}`);
    if (!INFANTRY.has(String(byName.get(t).Typ).trim())) throw new Error(`cel spoza piechoty: ${u.Jednostka} -> ${t}`);
  }
  infantry.push({
    source: String(u.Jednostka).trim(),
    zastap: raw,
    targets,
  });
}

// Wszystkie technologie wystepujace w pinie (wektory: wszystkie odblokowane).
const techs = [...new Set(units.map(u => String(u.Tech ?? '').trim()).filter(t => t && !BLANK.has(t)))].sort();

const doc = {
  pin: PIN,
  source: 'gra/data/units.json',
  note: 'Wygenerowane przez p6_unit_replace_l1_gen.mjs. Nie edytowac recznie.',
  techs,
  rows,
  infantry,
};

writeFileSync(outPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
const edges = infantry.reduce((a, s) => a + s.targets.length, 0);
console.log(`[p6-unit-replace-l1-gen] OK: zrodla=${infantry.length} krawedzi=${edges} jednostek=${rows.length} techs=${techs.length} -> ${outPath}`);
