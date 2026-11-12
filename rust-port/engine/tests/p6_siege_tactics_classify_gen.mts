// P6 SIEGE-TAKTYKA KLASY (#217, R-RUSTPORT-P6-SIEGE-TAKTYKA-KLASY-Q1, runda 1 Operatora): generator wektorow
// WYKONUJACY TEKST PINU (pin 07d2fbd72) dla czterech klasyfikatorow wejscia: `canShoot` (:1457-1459), `isSiegeUnit`
// (:1552-1559), `isSiegeTower` (:1561-1564), `normName` (:1648-1650, zaleznosc), `_isRam` (:7402-7405).
//
// Uruchomienie (z korzenia repo; katalog roboczy modulu POZA repo):
//   CLASSIFY_GEN_SCRATCH=<katalog poza repo> node --experimental-strip-types \
//     rust-port/engine/tests/p6_siege_tactics_classify_gen.mts
//
// Wyjscia = wykonanie doslownych linii pinu w harnessie Node (bez recznej kopii logiki). Jedyne przeksztalcenia:
// usuniecie typow TS (Node --experimental-strip-types), `private` -> nic, `export function` -> `function`.
// Straznik: SHA-256 wycietych fragmentow musi zgadzac sie z FRAGMENT_SHA256 (PRINT_HASH=1 wypisuje wartosc).
//
// Dane wejsciowe: `gra/data/units.json` z pinu (75 jednostek; pola `Typ`, `Jednostka`, `Nazwa EN`) plus lista
// przypadkow brzegowych (diakrytyki, wielkosc liter, spacje, null/undefined, pusty napis) i deterministyczne
// losowanie (mulberry32, seed 217).
//
// WEJSCIE ROZPISANE NA WIDOK RUST (zgodny z `ClassifyUnit` w siege_tactics_classify.rs): pole = null, gdy wartosc JS
// jest null/undefined (lub brak `stats`); w przeciwnym razie `String(v)`. Te same reguly koduja wejscie JS, wiec
// wynik pinu i wejscie Rust opisuja ten sam przypadek.

import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const BS_PATH = 'gra/src/battle/battleScene.ts';
const UNITS_PATH = 'gra/data/units.json';
// Hash fragmentow pinu (wyliczany przez PRINT_HASH=1). Zmiana pinu -> blad straznika.
const FRAGMENT_SHA256 = '10c0ec94d60eb96440d396b114e81c81936374684f1f11648c7775fce9453c41';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitText = (path: string): string =>
  execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const BS = gitText(BS_PATH).split('\n');

// Blok od linii startowej (1-based) do pierwszej linii dopasowanej przez `closeRe` (wlacznie, po linii startowej).
function block(lines: string[], start: number, closeRe: RegExp): string[] {
  const out: string[] = [];
  for (let i = start - 1; i < lines.length; i++) {
    out.push(lines[i]);
    if (i >= start && closeRe.test(lines[i])) return out;
  }
  throw new Error(`brak domkniecia bloku od linii ${start}`);
}
const TOP_END = /^\}$/;
const METHOD_END = /^ {2}\}$/;

const FR = {
  canShoot: block(BS, 1457, TOP_END),
  isSiegeUnit: block(BS, 1552, TOP_END),
  isSiegeTower: block(BS, 1561, TOP_END),
  normName: block(BS, 1648, TOP_END),
  isRam: block(BS, 7402, METHOD_END),
};
const FRAGMENT_ORDER = ['canShoot', 'isSiegeUnit', 'isSiegeTower', 'normName', 'isRam'] as const;
const digest = createHash('sha256')
  .update(FRAGMENT_ORDER.map((k) => FR[k].join('\n')).join('\n---\n'))
  .digest('hex');
if (process.env.PRINT_HASH) console.log(`FRAGMENT_SHA256=${digest}`);
if (FRAGMENT_SHA256 !== '__SET_AFTER_FIRST_RUN__' && digest !== FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu klasyfikatorow nie zgadzaja sie z hashem: ${digest}`);
}

// Metoda `_isRam` -> wewnatrz klasy harnessu (usuniecie `private`).
const asMethod = (l: string): string => l.replace(/^  private /, '  ');

const moduleSrc = [
  ...FR.canShoot,
  ...FR.isSiegeUnit,
  ...FR.isSiegeTower,
  ...FR.normName,
  'class BattleScene {',
  ...FR.isRam.map(asMethod),
  '}',
  'export { canShoot, isSiegeUnit, isSiegeTower, normName, BattleScene };',
].join('\n');

const scratch = process.env.CLASSIFY_GEN_SCRATCH ?? mkdtempSync(join(tmpdir(), 'classify-gen-'));
mkdirSync(scratch, { recursive: true });
const modPath = join(scratch, 'p6_classify_pin_module.mts');
writeFileSync(modPath, moduleSrc, 'utf8');
const M: any = await import(pathToFileURL(modPath).href);
const { canShoot, isSiegeUnit, isSiegeTower, normName, BattleScene } = M;
const isRam = (bu: unknown): boolean => new BattleScene()._isRam(bu);

// ---------- PRNG (mulberry32, seed 217) ----------
let seed = 217 >>> 0;
const rnd = (): number => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;

// ---------- dane: jednostki z pinu + przypadki brzegowe ----------
type Rec = { Typ?: unknown; Jednostka?: unknown; 'Nazwa EN'?: unknown };
const UNITS: Rec[] = JSON.parse(gitText(UNITS_PATH));

const EDGE_NAMES: string[] = [
  'Taran', 'Taran okuty', 'TARAN', 'taran', 'Tarańska', 'Wieża oblężnicza', 'WIEŻA OBLĘŻNICZA', 'Wieża Oblężnicza',
  'wieza oblezna', 'Wieża obl.', 'Katapulta', 'katapulta', 'Łucznik', 'Ławnik', 'Battering Ram', 'battering ram',
  'Siege Tower', 'siege tower', 'Catapult', 'catapult', 'Ballista', 'Strażnik bram Harappy', 'Ramię', 'Ćma', 'Ąęśćżźńó',
  'Żołnierz z ŁÓDZI', 'Piechota', 'Jeździec', 'Rycerz', 'Machina oblężnicza', 'wieża', 'Oblężnicza wieża',
  'Ram', 'Mur', '', ' ', '  Taran  ', 'Taran\tokuty', 'Wieża oblężnicza ',
];
const TYP_VALUES: unknown[] = [undefined, null, 'Siege', ' Siege ', 'Siege\t', 'siege', 'SIEGE', 'Swordsman', '', ' ', 0, 1];
const NAME_VALUES: unknown[] = [undefined, null, '', ...EDGE_NAMES, 'Taran', 'Katapulta', 'Wieża oblężnicza'];

type Spec = { statsUndefined: boolean; typ: unknown; jednostka: unknown; nazwa: unknown };
const specs: Spec[] = [];
// 1) jednostki z pinu: cztery warianty kazdej (pelne pola; Jednostka null -> nazwa; brak Jednostka; Typ z bialymi znakami)
for (const u of UNITS) {
  const jed = u.Jednostka ?? '';
  const nazwaEn = u['Nazwa EN'] ?? jed;
  specs.push({ statsUndefined: false, typ: u.Typ, jednostka: u.Jednostka, nazwa: nazwaEn });
  specs.push({ statsUndefined: false, typ: u.Typ, jednostka: null, nazwa: jed });
  specs.push({ statsUndefined: false, typ: u.Typ, jednostka: undefined, nazwa: jed });
  specs.push({ statsUndefined: false, typ: ` ${String(u.Typ)} `, jednostka: jed, nazwa: nazwaEn });
}
// 2) przypadki brzegowe nazw i typow
for (const n of EDGE_NAMES) {
  specs.push({ statsUndefined: false, typ: undefined, jednostka: n, nazwa: 'x' });
  specs.push({ statsUndefined: false, typ: null, jednostka: null, nazwa: n });
  specs.push({ statsUndefined: true, typ: undefined, jednostka: undefined, nazwa: n });
  specs.push({ statsUndefined: false, typ: 'Siege', jednostka: n, nazwa: n });
}
// 3) deterministyczne losowanie kombinacji
for (let i = 0; i < 400; i++) {
  specs.push({
    statsUndefined: rnd() < 0.1,
    typ: pick(TYP_VALUES),
    jednostka: pick(NAME_VALUES),
    nazwa: pick(NAME_VALUES),
  });
}

// Widok Rust: null dla null/undefined (lub brak stats), inaczej String(v).
const rustView = (v: unknown): string | null => (v === undefined || v === null ? null : String(v));

const categories: Record<string, number> = {};
const bump = (k: string): void => {
  categories[k] = (categories[k] ?? 0) + 1;
};

const nameCases = specs.map((s) => {
  const bu: any = {
    nazwa: s.nazwa,
    stats: s.statsUndefined ? undefined : { Typ: s.typ, Jednostka: s.jednostka },
  };
  const out = {
    isSiegeUnit: isSiegeUnit(bu) as boolean,
    isSiegeTower: isSiegeTower(bu) as boolean,
    isRam: isRam(bu) as boolean,
  };
  const typTrim = String(rustView(s.statsUndefined ? undefined : s.typ) ?? '').trim();
  const typHit = typTrim === 'Siege';
  if (out.isSiegeUnit) bump(typHit ? 'isSiegeUnit:typ' : 'isSiegeUnit:name');
  else bump('isSiegeUnit:false');
  bump(out.isSiegeTower ? 'isSiegeTower:true' : 'isSiegeTower:false');
  bump(out.isRam ? 'isRam:true' : 'isRam:false');
  return {
    in: {
      typ: s.statsUndefined ? null : rustView(s.typ),
      jednostka: s.statsUndefined ? null : rustView(s.jednostka),
      nazwa: rustView(s.nazwa),
    },
    ...out,
  };
});

// canShoot: rangedBase x ammoLeft (wartosci graniczne, NaN, Infinity; JSON koduje jako napis)
const AMMO: Array<number | string> = [0, -1, 0.5, 1, 3, 1e9, 'NaN', 'Infinity', '-Infinity', -0];
const ammoJs = (a: number | string): number => (typeof a === 'string' ? Number(a) : a);
const shootCases: Array<{ in: { rangedBase: boolean; ammoLeft: number | string }; canShoot: boolean }> = [];
for (const rb of [true, false]) {
  for (const a of AMMO) {
    const ru = { rangedBase: rb, ammoLeft: ammoJs(a) };
    const out = canShoot(ru) as boolean;
    bump(out ? 'canShoot:true' : 'canShoot:false');
    shootCases.push({ in: { rangedBase: rb, ammoLeft: a }, canShoot: out });
  }
}

// normName: rozklad (diakrytyki, wielkosc liter)
const NORM_IN: string[] = [...EDGE_NAMES, 'Łódź', 'ŁÓDŹ', 'Ąęśćżźńó', 'Zażółć gęślą jaźń', 'Ŗ ŗ', 'É é È è Ü ü Ö ö', 'Ñ ñ Ç ç'];
const normCases = NORM_IN.map((s) => {
  const out = normName(s) as string;
  bump(out !== s.toLowerCase() ? 'normName:changed' : 'normName:plain');
  return { in: s, out };
});

const vectors = {
  meta: {
    pin: PIN,
    generator: 'rust-port/engine/tests/p6_siege_tactics_classify_gen.mts',
    fragmentSha256: digest,
    seed: 217,
    unitsSource: UNITS_PATH,
    unitCount: UNITS.length,
    unitNames: UNITS.map((u) => String(u.Jednostka)),
    nameCases: nameCases.length,
    cases: nameCases.length + shootCases.length + normCases.length,
    note: 'Wyjscia = wykonanie doslownych linii pinu (canShoot, isSiegeUnit, isSiegeTower, normName, _isRam) w harnessie. ' +
      'Wejscie w widoku Rust (null = null/undefined/brak stats, inaczej String(v)).',
    categories,
  },
  names: nameCases,
  canShoot: shootCases,
  normName: normCases,
};

const outDir = join(here, 'p6_siege_tactics_classify_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(vectors, null, 1) + '\n', 'utf8');
console.log(`cases=${vectors.meta.cases} names=${nameCases.length} canShoot=${shootCases.length} normName=${normCases.length}`);
console.log(JSON.stringify(categories));
