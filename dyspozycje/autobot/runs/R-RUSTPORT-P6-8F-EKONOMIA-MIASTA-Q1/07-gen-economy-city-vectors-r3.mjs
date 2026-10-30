// Generator wektorow r3 (R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1, runda 3) dla domkniecia symboli
// economy.ts@91dc998a: loadEconParams (#1), terrainRowToTileYield (#2), buildTerrainYields (#3),
// terrainModifier (#4), tileYield (#5), buildingValue (#6, wszystkie klucze), resolvePopulationCapMatrixDelta (#19).
//
// Wejscia:
//   argv[2] = bundle esbuild z PLIKOW PINU 91dc998a (entry: export * z economy.ts; w kopii tymczasowej
//             trzy funkcje nieeksportowane (terrainRowToTileYield, buildTerrainYields, terrainModifier)
//             dostaly slowo `export` — zmiana TYLKO w kopii poza repo, plik w repo nietkniety).
//   argv[3] = katalog gra/data z pinu (terrain-improvements.json, civ-matrix.json).
//   argv[4] = wyjscie JSON.
// Uzycie: node 07-gen-economy-city-vectors-r3.mjs <bundle.mjs> <gra/data> <wyjscie.json>
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , bundlePath, dataDir, outPath] = process.argv;
const E = await import(pathToFileURL(bundlePath).href);

const num = (x) => {
  if (typeof x !== 'number') throw new Error('num: ' + typeof x);
  if (Object.is(x, -0)) return '-0';
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  return String(x);
};

let seed = 0x0b5e8f03;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const intIn = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const improvements = JSON.parse(readFileSync(join(dataDir, 'terrain-improvements.json'), 'utf8'));
const IMP_KEYS = Object.keys(improvements).filter((k) => k !== '_meta' && k !== '_miasto_zasieg_ref');
const civMatrix = JSON.parse(readFileSync(join(dataDir, 'civ-matrix.json'), 'utf8'));
const CIV_KEYS = civMatrix.cywilizacje.map((c) => c.typCywilizacji);

const vectors = [];

// ---- #1 loadEconParams --------------------------------------------------------------------
const EM_KEYS = ['próg_wzrostu_wspolczynnik', 'spichlerz_zachowanie_po_wzroscie', 'akwedukt_prog_ludnosci',
  'spichlerz_prog_ludnosci', 'akwedukt_max_ludnosci', 'zywnosc_zuzytka_populacja',
  'zdrowie_modyfikator_wspolczynnik', 'korupcja_wspolczynnik_dystansu', 'korupcja_wspolczynnik_miast',
  'korupcja_cap', 'suwak_handel_nauka_domyslnie', 'suwak_handel_pieniadz_domyslnie',
  'suwak_handel_luksus_domyslnie', 'suwak_praca_budynki_domyslnie', 'suwak_praca_teren_domyslnie'];
const BU_KEYS = ['budynek_mlyn_mnoznik_pracy', 'budynek_mlyn_bonus_pracy', 'budynek_cegielnia_bonus_pracy',
  'budynek_targowisko_bonus_handlu', 'budynek_biblioteka_bonus_nauki', 'budynek_akademia_bonus_nauki',
  'budynek_garncarnia_bonus_zywnosci_lokalnie', 'budynek_mennica_mnoznik', 'waluta_mnoznik'];
const GL_KEYS = ['mennica_mnoznik_po_walucie'];
const RAW_NUM = [0, 1, 2, 3, 5, 8, 12, 16, 20, 50, 60, 0.05, 0.1, 0.25, 0.5, 1.5, 2.5, 10, 30, 70, 100, -1, -2.5, 1e-9, 1e21];
const rawVal = () => pick([
  () => pick(RAW_NUM), () => pick(RAW_NUM), () => pick(RAW_NUM),
  () => 'abc', () => '5', () => null, () => undefined, () => true,
])();
// Wiersz parametru: brak (undefined = klucz pominiety), null, liczba/tekst/tablica (bez `easy` itd.)
// albo obiekt z poziomami trudnosci i metadanymi.
const rawRow = () => {
  const kind = pick(['absent', 'null', 'num', 'str', 'arr', 'obj', 'obj', 'obj']);
  if (kind === 'absent') return undefined;
  if (kind === 'null') return null;
  if (kind === 'num') return 5;
  if (kind === 'str') return 'x';
  if (kind === 'arr') return [1, 2];
  const row = {};
  for (const d of ['easy', 'normal', 'hard', 'extreme']) {
    if (rnd() < 0.85) row[d] = rawVal();
  }
  if (rnd() < 0.3) row.jednostka = 'x';
  return row;
};
// Grupa (ekonomia_miasta / budynki / globalne): brak, null, nie-obiekt albo obiekt z wierszami.
const rawGroup = (keys) => {
  const r = rnd();
  if (r < 0.08) return undefined;
  if (r < 0.14) return null;
  if (r < 0.2) return pick([7, 'str', [1, 2]]);
  const g = {};
  for (const k of keys) {
    if (rnd() < 0.85) {
      const row = rawRow();
      if (row !== undefined) g[k] = row;
    }
  }
  return g;
};
const DIFFS = ['easy', 'normal', 'hard', 'extreme'];
for (let i = 0; i < 400; i++) {
  const raw = {};
  const a = rawGroup(EM_KEYS); if (a !== undefined) raw.ekonomia_miasta = a;
  const b = rawGroup(BU_KEYS); if (b !== undefined) raw.budynki = b;
  const c = rawGroup(GL_KEYS); if (c !== undefined) raw.globalne = c;
  // Wejscie przechodzi przez JSON (jak plik econ-params.json); wektor zapisuje ten sam tekst.
  const text = JSON.stringify(raw);
  const parsed = JSON.parse(text);
  const difficulty = pick(DIFFS);
  const out = E.loadEconParams(parsed, difficulty);
  const outNum = {};
  for (const k of Object.keys(out)) outNum[k] = num(out[k]);
  vectors.push({ fn: 'loadEconParams', in: { raw: parsed, difficulty }, out: outNum });
}

// ---- #2 terrainRowToTileYield (syntetyczne wiersze JSON-owe) -------------------------------
const ROW_FIELDS = ['Żywność', 'Praca', 'Podatek', 'Handel', 'Drewno', 'Kamień', 'Glina'];
const ROW_VALS = [0, -0, 1, -1, 2.5, -3, 7, '3', '', ' 4 ', 'abc', '1e2', '-0', '0x1A', '+5', '5.', '.5', 'Infinity', '-Infinity',
  true, false, null, undefined];
const toTagged = (v) => {
  if (v === undefined) return { kind: 'absent' };
  if (v === null) return { kind: 'null' };
  if (typeof v === 'number') return { kind: 'num', v: num(v) };
  if (typeof v === 'string') return { kind: 'str', v };
  return { kind: 'bool', v };
};
for (let i = 0; i < 400; i++) {
  const row = {};
  const tagged = {};
  for (const f of ROW_FIELDS) {
    if (rnd() < 0.2) continue; // pole nieobecne
    const v = pick(ROW_VALS);
    if (v === undefined) continue;
    row[f] = v;
    tagged[f] = toTagged(v);
  }
  const out = E.terrainRowToTileYield(row);
  vectors.push({
    fn: 'terrainRowToTileYield',
    in: { row: tagged },
    out: { zywnosc: num(out.zywnosc), praca: num(out.praca), handel: num(out.handel), drewno: num(out.drewno),
      kamien: num(out.kamien), glina: num(out.glina), ruda: num(out.ruda), ruda_zelaza: num(out.ruda_zelaza) },
  });
}

// ---- #3 buildTerrainYields (dane realne z pinu) -------------------------------------------
{
  const t = E.buildTerrainYields();
  const keys = Object.keys(t).sort();
  const outObj = {};
  for (const k of keys) {
    const y = t[k];
    outObj[k] = { zywnosc: num(y.zywnosc), praca: num(y.praca), handel: num(y.handel), drewno: num(y.drewno),
      kamien: num(y.kamien), glina: num(y.glina), ruda: num(y.ruda), ruda_zelaza: num(y.ruda_zelaza) };
  }
  vectors.push({ fn: 'buildTerrainYields', in: {}, out: outObj });
}

// ---- #4 terrainModifier (dane realne z pinu) ----------------------------------------------
for (const name of ['Rzeka', 'Las (nakładka)', 'Brak', '', 'rzeka', 'Las', 'Rzeka ']) {
  const y = E.terrainModifier(name);
  vectors.push({
    fn: 'terrainModifier',
    in: { name },
    out: { zywnosc: num(y.zywnosc), praca: num(y.praca), handel: num(y.handel), drewno: num(y.drewno),
      kamien: num(y.kamien), glina: num(y.glina), ruda: num(y.ruda), ruda_zelaza: num(y.ruda_zelaza) },
  });
}

// ---- #5 tileYield -------------------------------------------------------------------------
const TEREN = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'morze', 'pustynia', 'polarny', 'nieznany'];
const NAKL = ['brak', 'las', 'zloze_rudy', 'zloze_gliny', 'nieznany'];
const IMP_POOL = [...IMP_KEYS, 'nieznany', ''];
for (let i = 0; i < 500; i++) {
  const tile = { terenBazowy: pick(TEREN) };
  if (rnd() < 0.9) tile.nakladka = pick(NAKL);
  if (rnd() < 0.8) tile.maRzeke = pick([true, false, true]);
  const uk = pick(['absent', 'null', 'empty', 'list', 'list']);
  if (uk === 'null') tile.ulepszeniaKeys = null;
  else if (uk === 'empty') tile.ulepszeniaKeys = [];
  else if (uk === 'list') tile.ulepszeniaKeys = Array.from({ length: intIn(1, 3) }, () => pick(IMP_POOL));
  const ek = pick(['absent', 'null', 'empty', 'key', 'key', 'key']);
  if (ek === 'null') tile.ulepszenieKey = null;
  else if (ek === 'empty') tile.ulepszenieKey = '';
  else if (ek === 'key') tile.ulepszenieKey = pick(IMP_POOL);
  const zk = pick(['absent', 'null', 'zloze_rudy', 'zloze_gliny']);
  if (zk === 'null') tile.zloze = null;
  else if (zk !== 'absent') tile.zloze = zk;
  const out = E.tileYield(tile);
  vectors.push({
    fn: 'tileYield',
    in: {
      terenBazowy: tile.terenBazowy,
      nakladka: tile.nakladka === undefined ? { kind: 'absent' } : tile.nakladka,
      maRzeke: tile.maRzeke === undefined ? { kind: 'absent' } : tile.maRzeke,
      ulepszeniaKeys: tile.ulepszeniaKeys === undefined ? { kind: 'absent' }
        : tile.ulepszeniaKeys === null ? { kind: 'null' } : { kind: 'list', items: tile.ulepszeniaKeys },
      ulepszenieKey: tile.ulepszenieKey === undefined ? { kind: 'absent' }
        : tile.ulepszenieKey === null ? { kind: 'null' } : { kind: 'str', v: tile.ulepszenieKey },
      zloze: tile.zloze === undefined ? { kind: 'absent' } : tile.zloze === null ? { kind: 'null' } : { kind: 'str', v: tile.zloze },
    },
    out: { zywnosc: num(out.zywnosc), praca: num(out.praca), handel: num(out.handel), drewno: num(out.drewno),
      kamien: num(out.kamien), glina: num(out.glina), ruda: num(out.ruda), ruda_zelaza: num(out.ruda_zelaza) },
  });
}

// ---- #6 buildingValue (wszystkie klucze; generyczna formula) ------------------------------
const BKEYS = ['praca', 'pieniadz', 'zywnosc', 'nauka', 'kultura', 'zadowolenie', 'nieznany'];
const BNUM = [0, -0, 1, 2, 3, -2, 0.5, 2.7, -0.5, 10, 100, NaN, Infinity, -Infinity, 1e-9, 4.999999];
const BLEVEL = [1, 2, 3, 0, -1, 0.5, 2.7, -0, NaN, Infinity, -Infinity, 1e300, 5, 0.99];
for (let i = 0; i < 500; i++) {
  const key = pick(BKEYS);
  const baza = {}; const przyrost = {};
  for (const k of BKEYS) {
    if (rnd() < 0.8) baza[k] = pick(BNUM);
    if (rnd() < 0.8) przyrost[k] = pick(BNUM);
  }
  const level = pick(BLEVEL);
  const b = { id: 'x', baza, przyrost, epokaWejscia: 1, maksPoziom: 1 };
  const out = E.buildingValue(b, level, key);
  vectors.push({
    fn: 'buildingValue',
    in: {
      key,
      baza: BKEYS.map((k) => (k in baza ? { k, v: num(baza[k]) } : { k, v: 'absent' })),
      przyrost: BKEYS.map((k) => (k in przyrost ? { k, v: num(przyrost[k]) } : { k, v: 'absent' })),
      level: num(level),
    },
    out: num(out),
  });
}

// ---- #19 resolvePopulationCapMatrixDelta (dane realne: wbudowana macierz) -----------------
const CIV_POOL = [...CIV_KEYS, 'nieznany', '', null, undefined];
for (let i = 0; i < 200; i++) {
  const k = pick(CIV_POOL);
  const out = E.resolvePopulationCapMatrixDelta(k);
  vectors.push({
    fn: 'resolvePopulationCapMatrixDelta',
    in: { civKey: k === undefined ? { kind: 'absent' } : k === null ? { kind: 'null' } : { kind: 'str', v: k } },
    out: num(out),
  });
}

// ---- #12, #13, #14, #16 mnoznik handlu/pieniadza, civEconomyYieldMultipliers (dane realne) -------
const CIV_IDS = [];
for (const c of civMatrix.cywilizacje) {
  for (const id of [c.ikonaId, c.typCywilizacji, c.Cywilizacja]) {
    if (typeof id === 'string' && id.length > 0) CIV_IDS.push(id, id.toUpperCase());
  }
}
const CIV_POOL2 = [...new Set([...CIV_IDS, 'nieznany', '', null, undefined])];
const tagKey = (k) => (k === undefined ? { kind: 'absent' } : k === null ? { kind: 'null' } : { kind: 'str', v: k });
const optNum = (x) => (x === undefined ? { kind: 'absent' } : { kind: 'num', v: num(x) });
for (let i = 0; i < 200; i++) {
  const k = pick(CIV_POOL2);
  vectors.push({ fn: 'civMatrixMnoznikHandelPieniadzRaw', in: { civKey: tagKey(k) }, out: optNum(E.civMatrixMnoznikHandelPieniadzRaw(k)) });
}
for (let i = 0; i < 200; i++) {
  const k = pick(CIV_POOL2);
  const fb = pick([1, 0.7, 0, -0, 2.5, NaN]);
  vectors.push({ fn: 'mnoznikHandelPieniadzForCiv', in: { civKey: tagKey(k), fallback: num(fb) },
    out: num(E.mnoznikHandelPieniadzForCiv(k, null, fb)) });
}
for (let i = 0; i < 200; i++) {
  const k = pick(CIV_POOL2);
  const diff = pick(['easy', 'normal', 'hard']);
  const fb = pick([1, 0.7, 0, -0, 2.5, NaN, -0.5]);
  vectors.push({ fn: 'mnoznikHandelPieniadzForCivByDifficulty', in: { civKey: tagKey(k), difficulty: diff, fallbackScaled: num(fb) },
    out: num(E.mnoznikHandelPieniadzForCivByDifficulty(k, null, diff, fb)) });
}
for (let i = 0; i < 100; i++) {
  const bonusy = Array.from({ length: intIn(0, 3) }, () => ({ typ: pick(['handel', 'nauka']), v: pick([0, 1, 1.5]) }));
  const r = E.civEconomyYieldMultipliers(bonusy);
  vectors.push({ fn: 'civEconomyYieldMultipliers', in: { bonusy }, out: { handel: num(r.handel), nauka: num(r.nauka) } });
}

writeFileSync(outPath, JSON.stringify({ pin: '91dc998a', source: 'gra/src/game/economy.ts via esbuild bundle (r3)',
  count: vectors.length, vectors }));
console.log('vectors=' + vectors.length);
