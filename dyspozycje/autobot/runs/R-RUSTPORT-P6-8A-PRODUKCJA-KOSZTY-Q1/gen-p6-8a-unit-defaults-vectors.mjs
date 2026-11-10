// P6.8A-P2 (production.ts unitCostFromDef, DEFAULT_UNIT_COST, DEFAULT_COST_BY_ROLE): wektory z weba
// 91dc998a dla trzech wariantow miasto-params.json: realny, brak kluczy rol/domyslnego (fallback literalne),
// inne wartosci (w tym 0 i null). Funkcje nie sa eksportowane z production.ts, wiec ich tekst zrodlowy
// (DEFAULT_UNIT_COST, DEFAULT_COST_BY_ROLE, unitCostFromDef) jest wycinany z production.ts BEZ ZMIAN;
// jedyna zmiana to wstrzykniecie obiektu miastoParams (wariant danych) na poczatku wycinka.
// Uruchomienie (Node 22, z katalogu tego runu, bez builda gra/):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8a-unit-defaults-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIA> <KATALOG_ROBOCZY_POZA_REPO>
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
const scratch = presolve(process.argv[4] ?? '');
if (!process.argv[4]) throw new Error('podaj 3. argument: katalog roboczy poza repo');
mkdirSync(outDir, { recursive: true });
mkdirSync(scratch, { recursive: true });
const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';

const enc = (x) => {
  if (typeof x !== 'number') return x;
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  if (Number.isInteger(x)) return x;
  return { $f: String(x) };
};

const prodText = readFileSync(join(webRoot, 'gra/src/game/production.ts'), 'utf8');
const pick = (re, name) => {
  const m = prodText.match(re);
  if (!m) throw new Error(`nie znaleziono ${name} w production.ts`);
  return m[0];
};
const defaultUnitCostLine = pick(/export const DEFAULT_UNIT_COST[\s\S]*?;\n/, 'DEFAULT_UNIT_COST');
const defaultByRoleBlock = pick(/const DEFAULT_COST_BY_ROLE[\s\S]*?\n\};/, 'DEFAULT_COST_BY_ROLE');
const unitCostFromDefFn = pick(/function unitCostFromDef\(def: UnitDef\): number \{[\s\S]*?\n\}/, 'unitCostFromDef');

const realMiasto = JSON.parse(readFileSync(join(webRoot, 'gra/data/miasto-params.json'), 'utf8'));
const ROLE_KEYS = [
  'jednostka_koszt_domyslny',
  'jednostka_koszt_rola_wsparcie',
  'jednostka_koszt_rola_dystans',
  'jednostka_koszt_rola_wrecz',
  'jednostka_koszt_rola_konnica',
];
const withoutKeys = (m, keys) => {
  const o = { ...m };
  for (const k of keys) delete o[k];
  return o;
};
const variants = {
  realny: realMiasto,
  'brak-rol': withoutKeys(realMiasto, ROLE_KEYS),
  'inne-wartosci': {
    ...realMiasto,
    jednostka_koszt_domyslny: { ...realMiasto.jednostka_koszt_domyslny, wartosc: 7 },
    jednostka_koszt_rola_wrecz: { ...realMiasto.jednostka_koszt_rola_wrecz, wartosc: 33 },
    jednostka_koszt_rola_konnica: { ...realMiasto.jednostka_koszt_rola_konnica, wartosc: 0 },
    jednostka_koszt_rola_dystans: { ...realMiasto.jednostka_koszt_rola_dystans, wartosc: null },
  },
};

// Projekcja jednostek realnych + syntetyczne przypadki rol/kosztow.
const units = JSON.parse(readFileSync(join(webRoot, 'gra/data/units.json'), 'utf8')).map((u) => ({
  Jednostka: u.Jednostka,
  Epoka: u.Epoka,
  'Pieniądz (koszt)': u['Pieniądz (koszt)'],
  'Super-jednostka': u['Super-jednostka'],
  'Rola (linia)': u['Rola (linia)'],
}));
const synthetic = [
  { Jednostka: 's-super0', 'Pieniądz (koszt)': 0, 'Super-jednostka': 'TAK', 'Rola (linia)': 'Wsparcie' },
  { Jednostka: 's-zero', 'Pieniądz (koszt)': 0, 'Rola (linia)': 'Konnica' },
  { Jednostka: 's-ujemny', 'Pieniądz (koszt)': -4, 'Rola (linia)': 'Wrecz' },
  { Jednostka: 's-nan', 'Pieniądz (koszt)': NaN, 'Rola (linia)': 'Dystans' },
  { Jednostka: 's-str', 'Pieniądz (koszt)': '12', 'Rola (linia)': 'Wsparcie' },
  { Jednostka: 's-wsparcie', 'Rola (linia)': 'Wsparcie' },
  { Jednostka: 's-dystans', 'Rola (linia)': 'Dystans' },
  { Jednostka: 's-wrecz-pl', 'Rola (linia)': 'Wręcz' },
  { Jednostka: 's-wrecz', 'Rola (linia)': 'Wrecz' },
  { Jednostka: 's-konnica', 'Rola (linia)': 'Konnica' },
  { Jednostka: 's-rola-nieznana', 'Rola (linia)': 'Nieznana' },
  { Jednostka: 's-rola-pusta', 'Rola (linia)': '' },
  { Jednostka: 's-bez-roli' },
  { Jednostka: 's-rola-null', 'Rola (linia)': null },
];
const allUnits = [...units, ...synthetic];

const out = { pin: PIN, variants: {} };
for (const [name, miasto] of Object.entries(variants)) {
  const modPath = join(scratch, `defaults-${name}.ts`);
  const modText = [
    `const miastoParams: any = ${JSON.stringify(miasto)};`,
    defaultUnitCostLine.replace('export const', 'export const'),
    defaultByRoleBlock,
    `export ${unitCostFromDefFn}`,
    '',
  ].join('\n');
  writeFileSync(modPath, modText);
  const M = await import(pathToFileURL(modPath).href);
  out.variants[name] = {
    miasto: Object.fromEntries(
      Object.entries(miasto)
        .filter(([k]) => ROLE_KEYS.includes(k))
        .map(([k, v]) => [k, v && typeof v === 'object' && 'wartosc' in v ? { wartosc: v.wartosc } : v]),
    ),
    defaultUnitCost: enc(M.DEFAULT_UNIT_COST),
    cases: allUnits.map((u) => {
      const row = {};
      for (const [k, v] of Object.entries(u)) if (v !== undefined) row[k] = typeof v === 'number' ? enc(v) : v;
      return { unit: row, cost: enc(M.unitCostFromDef(u)) };
    }),
  };
}
for (const [name, v] of Object.entries(out.variants)) {
  writeFileSync(join(outDir, `defaults-${name}.json`), JSON.stringify({ pin: PIN, variant: name, ...v }));
  console.log(`defaults ${name}: defaultUnitCost=${JSON.stringify(v.defaultUnitCost)} cases=${v.cases.length}`);
}
