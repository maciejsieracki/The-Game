// Generator wektorow r4 (R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1, runda 4) dla symboli economy.ts@91dc998a:
//   #7  buildingGivesHappiness (L514-516)            -> fn 'buildingGivesHappiness'
//   #8  buildingHappinessAtLevel (L523-533)          -> fn 'buildingHappinessAtLevel'
//   #11 cityBuildingEntriesFromBuiltIds (L589-609)   -> fn 'cityBuildingEntriesFromBuiltIds' (tablica i Set)
//   #15 civBonusyForCivKey (L765-781)                -> fn 'civBonusyForCivKey'
//   #17 cityYieldPerTurn (L819-1047)                 -> fn 'cityYieldPerTurn'
//   #22 corruptionRate (L1190-1199, M6)              -> fn 'corruptionRate'
//   #3  buildTerrainYields (L399-407, duplikaty)     -> fn 'buildTerrainYieldsSynthetic'
//
// Wejscia:
//   argv[2] = bundle esbuild z KOPII PINU 91dc998a (entry: export * z economy.ts). W kopii tymczasowej
//             (poza repo) dodano `export` do czterech funkcji prywatnych oraz shim testowy
//             `globalThis.__TERRAIN_ROWS__` w buildTerrainYields (cialo petli bez zmian).
//   argv[3] = katalog gra/data z pinu (terrain-improvements.json, terrain-yields.json, civ-matrix.json).
//   argv[4] = wyjscie JSON.
// Uzycie: node 10-gen-economy-city-vectors-r4.mjs <bundle.mjs> <gra/data> <wyjscie.json>
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , bundlePath, dataDir, outPath] = process.argv;
const E = await import(pathToFileURL(bundlePath).href);

// Liczby zawsze jako tekst (String(x)); specjalne: NaN, Infinity, -Infinity, -0.
const numE = (x) => {
  if (typeof x !== 'number') throw new Error('numE: ' + typeof x);
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  // Zawsze tekst (String(x)): parser serde_json bez float_roundtrip nie zaokragla wiernie liczb JSON.
  return String(x);
};
const numStr = (x) => String(numE(x));
// Wartosc JS-owa (pole opcjonalne) zapisana jako tag: absent | null | num | str | bool | json.
const tagOf = (v) => {
  if (v === undefined) return { kind: 'absent' };
  if (v === null) return { kind: 'null' };
  if (typeof v === 'number') return { kind: 'num', v: numE(v) };
  if (typeof v === 'string') return { kind: 'str', v };
  if (typeof v === 'boolean') return { kind: 'bool', v };
  return { kind: 'json', v };
};

let seed = 0x4e5a1c27;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const intIn = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const chance = (p) => rnd() < p;

const improvements = JSON.parse(readFileSync(join(dataDir, 'terrain-improvements.json'), 'utf8'));
const IMP_KEYS = Object.keys(improvements).filter((k) => k !== '_meta' && k !== '_miasto_zasieg_ref');
const civMatrix = JSON.parse(readFileSync(join(dataDir, 'civ-matrix.json'), 'utf8'));
const terrainYields = JSON.parse(readFileSync(join(dataDir, 'terrain-yields.json'), 'utf8'));
const CIV_IDS = [];
for (const c of civMatrix.cywilizacje) {
  for (const id of [c.ikonaId, c.typCywilizacji, c.Cywilizacja]) {
    if (typeof id === 'string' && id.length > 0) CIV_IDS.push(id);
  }
}
const CIV_KEY_POOL = [...new Set([...CIV_IDS, ...CIV_IDS.map((s) => s.toUpperCase()), 'nieznany', ''])];

const vectors = [];
const KEYS5 = ['praca', 'pieniadz', 'zywnosc', 'nauka', 'kultura'];
const VAL_POOL = [0, 1, 2, 3, 5, -1, 0.5, 2.5, 10];

// ---- building record (JS record: baza/przyrost keys, dajeSzczescie, zadowolenie) -------------
// Zwraca { record (JS), tag (wejscie do Rust) }.
const makeRecord = (id) => {
  const baza = {}; const przyrost = {};
  for (const k of KEYS5) {
    if (chance(0.85)) baza[k] = pick(VAL_POOL);
    if (chance(0.85)) przyrost[k] = pick(VAL_POOL);
  }
  // zadowolenie: absent | num | null | str (poza typeof number)
  const bz = pick(['absent', 'num', 'num', 'num', 'null', 'str']);
  if (bz === 'num') baza.zadowolenie = pick([0, 2, 4, 1, 3]);
  if (bz === 'null') baza.zadowolenie = null;
  if (bz === 'str') baza.zadowolenie = '4';
  const pz = pick(['absent', 'num', 'num', 'zero']);
  if (pz === 'num') przyrost.zadowolenie = pick([1, 2, -1, 0.5]);
  if (pz === 'zero') przyrost.zadowolenie = 0;
  const rec = { id, baza, przyrost };
  const dz = pick(['absent', 'true', 'true', 'false', 'null', 'strtrue', 'num1', 'num0']);
  if (dz === 'true') rec.dajeSzczescie = true;
  if (dz === 'false') rec.dajeSzczescie = false;
  if (dz === 'null') rec.dajeSzczescie = null;
  if (dz === 'strtrue') rec.dajeSzczescie = 'true';
  if (dz === 'num1') rec.dajeSzczescie = 1;
  if (dz === 'num0') rec.dajeSzczescie = 0;
  return rec;
};
// Tag rekordu dla Rust: kazde pole numeryczne jako tag (absent -> NaN po stronie Rust).
const tagBaza = (o) => {
  const t = {};
  for (const k of [...KEYS5, 'zadowolenie']) t[k] = tagOf(o?.[k]);
  return t;
};

// ---- #7 buildingGivesHappiness -------------------------------------------------------------
const GIVES_POOL = [true, false, undefined, null, 'true', 'tak', 1, 0, '', [], {}];
for (let i = 0; i < 60; i++) {
  const v = pick(GIVES_POOL);
  const b = {};
  if (v !== undefined) b.dajeSzczescie = v;
  const out = E.buildingGivesHappiness(b);
  vectors.push({ fn: 'buildingGivesHappiness', in: { dajeSzczescie: tagOf(v) }, out: out });
}

// ---- #8 buildingHappinessAtLevel -----------------------------------------------------------
const LEVELS_H = [1, 2, 3, 0, -1, 0.5, 2.7, 5, -0, NaN];
for (let i = 0; i < 300; i++) {
  const rec = makeRecord('x');
  const level = pick(LEVELS_H);
  // Domena przyrost.zadowolenie: liczba lub brak (dane JSON; nieliczbowe tekst poza domena).
  const out = E.buildingHappinessAtLevel(rec, level);
  vectors.push({
    fn: 'buildingHappinessAtLevel',
    in: {
      dajeSzczescie: tagOf(rec.dajeSzczescie),
      bazaZadowolenie: tagOf(rec.baza.zadowolenie),
      przyrostZadowolenie: tagOf(rec.przyrost.zadowolenie),
      level: numE(level),
    },
    out: numE(out),
  });
}

// ---- #11 cityBuildingEntriesFromBuiltIds --------------------------------------------------
const BID_POOL = ['port', 'koszary', 'swiatynia', 'spichlerz', 'akwedukt', 'sad', 'nieznany'];
const TECH_POOL = ['zelazo', 'pismo', 'kolo'];
for (let i = 0; i < 300; i++) {
  const catalog = [];
  const ids = [...new Set(BID_POOL.filter(() => chance(0.7)))];
  for (const id of ids) {
    const rec = {
      id,
      epokaWejscia: intIn(0, 5),
      maksPoziom: intIn(1, 3),
    };
    const g = pick(['absent', 'null', 'obj', 'obj']);
    if (g === 'null') rec.poziomTechGate = null;
    if (g === 'obj') {
      const gate = {};
      // Klucz = poziom progowy (web: Number(levelKey)), wartosc = nazwa technologii; production.ts L255-258.
      for (let l = 0; l < intIn(1, 2); l++) gate[String(intIn(2, 4))] = pick(TECH_POOL);
      rec.poziomTechGate = gate;
    }
    catalog.push(rec);
  }
  // Duplikat id w katalogu (web `catalog.find` = PIERWSZY wpis): drugi wpis o tym samym id, inne parametry.
  if (catalog.length && chance(0.4)) {
    catalog.push({ ...pick(catalog), maksPoziom: intIn(1, 4), epokaWejscia: intIn(0, 5) });
  }
  // Nieznane id w liście budynków miasta: pomijane.
  const built = Array.from({ length: intIn(0, 6) }, () => pick([...ids, 'nieznany', ...ids.slice(0, 1)]));
  const epoch = intIn(0, 6);
  const uform = pick(['absent', 'null', 'array', 'set', 'array']);
  const techs = Array.from(new Set(Array.from({ length: intIn(0, 3) }, () => pick(TECH_POOL))));
  let unlocked;
  if (uform === 'array') unlocked = techs;
  else if (uform === 'set') unlocked = new Set(techs);
  else if (uform === 'null') unlocked = null;
  const outEntries = E.cityBuildingEntriesFromBuiltIds(built, catalog, epoch, unlocked);
  vectors.push({
    fn: 'cityBuildingEntriesFromBuiltIds',
    in: {
      builtIds: built,
      catalog: catalog.map((r) => ({
        id: r.id, epokaWejscia: r.epokaWejscia, maksPoziom: r.maksPoziom,
        poziomTechGate: r.poziomTechGate === undefined ? { kind: 'absent' }
          : r.poziomTechGate === null ? { kind: 'null' }
            : { kind: 'obj', entries: Object.entries(r.poziomTechGate) },
      })),
      cityEpoch: epoch,
      unlockedTechs: uform === 'absent' ? { kind: 'absent' } : uform === 'null' ? { kind: 'null' }
        : { kind: 'list', items: techs, form: uform },
    },
    out: outEntries.map((e) => ({ id: e.record.id, level: numE(e.level) })),
  });
}

// ---- #15 civBonusyForCivKey ---------------------------------------------------------------
const CIVS_FIELD_POOL = ['absent', 'null', 'str', 'num', 'id', 'id', 'id'];
const pickIdentity = () => {
  const r = pick(CIVS_FIELD_POOL);
  if (r === 'absent') return undefined;
  if (r === 'null') return null;
  if (r === 'str') return pick(['', ' ', 'Polska']);
  if (r === 'num') return 5;
  return pick(CIV_IDS);
};
const makeBonusy = () => {
  const r = pick(['absent', 'null', 'list', 'list', 'empty']);
  if (r === 'absent') return undefined;
  if (r === 'null') return null;
  if (r === 'empty') return [];
  return Array.from({ length: intIn(1, 3) }, () => ({ typ: pick(['handel', 'nauka', 'walka']), cel: pick(['wszystko', 'piechota']), wartosc: pick([0.1, 2, 1.5]) }));
};
for (let i = 0; i < 200; i++) {
  let civKey = pick([undefined, null, '', ...CIV_KEY_POOL.slice(0, 40), ...CIV_KEY_POOL.slice(0, 40)]);
  const cvar = pick(['absent', 'null', 'obj', 'obj', 'obj']);
  let civs;
  let rowsTag = null;
  if (cvar === 'obj') {
    const cv = pick(['absent', 'null', 'arr', 'arr', 'arr']);
    if (cv === 'arr') {
      const rows = [];
      for (let r = 0; r < intIn(0, 5); r++) {
        const rr = pick(['null', 'num', 'str', 'obj', 'obj', 'obj', 'obj']);
        if (rr === 'null') { rows.push(null); continue; }
        if (rr === 'num') { rows.push(0); continue; }
        if (rr === 'str') { rows.push('abc'); continue; }
        const row = {};
        const a = pickIdentity(); if (a !== undefined) row.ikonaId = a;
        const b = pickIdentity(); if (b !== undefined) row.typCywilizacji = b;
        const c = pickIdentity(); if (c !== undefined) row.Cywilizacja = c;
        const bz = makeBonusy(); if (bz !== undefined) row.bonusy = bz;
        rows.push(row);
      }
      // Duplikat tozsamosci (web: PIERWSZY pasujacy wiersz wygrywa): kopia z innym bonusy na koncu.
      const objRows = rows.filter((r) => r && typeof r === 'object');
      if (objRows.length && chance(0.6)) rows.push({ ...pick(objRows), bonusy: [{ typ: 'walka', cel: 'wszystko', wartosc: 1.5 }] });
      civs = { cywilizacje: rows };
    } else if (cv === 'null') {
      civs = { cywilizacje: null };
    } else {
      civs = {};
    }
    rowsTag = cv;
  } else if (cvar === 'null') {
    civs = null;
  }
  // Klucz czesto wybierany sposrod tozsamosci wierszy (zeby trafic w duplikaty).
  const rowIds = (civs?.cywilizacje ?? []).flatMap((r) => (r && typeof r === 'object'
    ? [r.ikonaId, r.typCywilizacji, r.Cywilizacja].filter((x) => typeof x === 'string' && x.length > 0) : []));
  if (rowIds.length && chance(0.7)) civKey = pick(rowIds);
  const out = E.civBonusyForCivKey(civKey, civs);
  vectors.push({
    fn: 'civBonusyForCivKey',
    in: {
      civKey: tagOf(civKey),
      civs: cvar === 'absent' ? { kind: 'absent' } : cvar === 'null' ? { kind: 'null' } : { kind: 'json', v: civs, shape: rowsTag },
    },
    out: out,
  });
}

// ---- #22 corruptionRate (M6: cap NaN / min) -------------------------------------------------
for (let i = 0; i < 300; i++) {
  const dist = pick([0, 0, 1, 3, 7, 12, 20, 0.5]);
  const cities = pick([1, 2, 3, 5, 9, 0]);
  const params = {
    korupcjaWspolczynnikDystansu: pick([0, 0.5, 1, 2.5, 0.1]),
    korupcjaWspolczynnikMiast: pick([0, 1, 2, 5, 0.25]),
    korupcjaCap: pick([0.5, 0.9, 1, 0.25, 0, 0.3333, NaN]),
  };
  const out = E.corruptionRate(dist, cities, params);
  vectors.push({
    fn: 'corruptionRate',
    in: {
      dystansOdStolicy: numE(dist),
      liczbaWszystkichMiast: numE(cities),
      wspolczynnikDystansu: numE(params.korupcjaWspolczynnikDystansu),
      wspolczynnikMiast: numE(params.korupcjaWspolczynnikMiast),
      cap: numE(params.korupcjaCap),
    },
    out: numE(out),
  });
}

// ---- #3 buildTerrainYields na syntetycznych wierszach (duplikaty, nieznane etykiety) ----------
const realRows = terrainYields.terrain_types;
for (let i = 0; i < 60; i++) {
  const rows = [];
  for (const r of realRows) if (chance(0.7)) rows.push({ ...r });
  // duplikat etykiety z innymi wartosciami (ostatni wygrywa)
  for (let d = 0; d < intIn(0, 3); d++) {
    const src = pick(realRows);
    rows.splice(intIn(0, rows.length), 0, { ...src, 'Żywność': intIn(0, 9), 'Praca': intIn(0, 9) });
  }
  if (chance(0.5)) rows.push({ ...pick(realRows), Teren: 'Nieznany teren' });
  if (chance(0.3)) { const x = { ...pick(realRows) }; delete x.Teren; rows.push(x); }
  const shuffled = rows.slice();
  if (chance(0.5)) shuffled.reverse();
  globalThis.__TERRAIN_ROWS__ = shuffled;
  let out;
  try {
    out = E.buildTerrainYields();
  } finally {
    globalThis.__TERRAIN_ROWS__ = undefined;
  }
  const outObj = {};
  for (const k of Object.keys(out).sort()) {
    const y = out[k];
    outObj[k] = { zywnosc: numE(y.zywnosc), praca: numE(y.praca), handel: numE(y.handel), drewno: numE(y.drewno),
      kamien: numE(y.kamien), glina: numE(y.glina), ruda: numE(y.ruda), ruda_zelaza: numE(y.ruda_zelaza) };
  }
  vectors.push({ fn: 'buildTerrainYieldsSynthetic', in: { rows: shuffled }, out: outObj });
}

// ---- #17 cityYieldPerTurn -----------------------------------------------------------------
const TEREN = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'morze', 'pustynia', 'polarny', 'nieznany'];
const NAKL = ['brak', 'las', 'zloze_rudy', 'zloze_gliny', 'nieznany'];
const IMP_POOL = [...IMP_KEYS, 'nieznany', ''];
const BUILD_IDS = ['port', 'port_wielki', 'koszary', 'swiatynia', 'mlyn', 'biblioteka', 'sad'];
const PROC = [0, 10, 25, 33, 50, 100, 60, 0.5];
const makeTile = () => {
  const tile = { terenBazowy: pick(TEREN) };
  if (chance(0.9)) tile.nakladka = pick(NAKL);
  if (chance(0.8)) tile.maRzeke = pick([true, false, true]);
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
  return tile;
};
const tagTile = (t) => ({
  terenBazowy: t.terenBazowy,
  nakladka: tagOf(t.nakladka),
  maRzeke: tagOf(t.maRzeke),
  ulepszeniaKeys: t.ulepszeniaKeys === undefined ? { kind: 'absent' }
    : t.ulepszeniaKeys === null ? { kind: 'null' } : { kind: 'list', items: t.ulepszeniaKeys },
  ulepszenieKey: tagOf(t.ulepszenieKey),
  zloze: tagOf(t.zloze),
});
const OUT_KEYS = ['praca', 'pieniadz', 'zywnosc', 'nauka', 'luksus', 'kultura', 'zadowolenie', 'zywnoscBrutto',
  'handelBrutto', 'pracaTerenu', 'pracaBudynkow', 'pieniadzZPracy', 'pieniadzBudynkow', 'drewnoTerenu',
  'kamienTerenu', 'glinaTerenu', 'rudaTerenu', 'rudaZelazaTerenu'];
for (let i = 0; i < 300; i++) {
  const civKey = pick([undefined, null, '', ...CIV_KEY_POOL, ...CIV_KEY_POOL.slice(0, 15)]);
  const city = {
    id: 'c',
    ludnosc: intIn(0, 12),
    zdrowie: 0,
    czyStolica: false,
    maSpichlerz: false,
    maAkwedukt: false,
    magazynZywnosci: 0,
    kolejkaProdukcji: [],
    podziałPracy: { procentBudynki: 50 },
    podziałHandlu: { procentNauka: pick(PROC), procentPieniadz: pick(PROC), procentLuksus: pick(PROC) },
    specjalisci: Array.from({ length: intIn(0, 3) }, () => pick(['uczony', 'poborca', 'artysta'])),
  };
  if (civKey !== undefined) city.civKey = civKey;
  const tiles = Array.from({ length: intIn(0, 5) }, makeTile);
  const bldgs = Array.from({ length: intIn(0, 4) }, () => {
    const rec = makeRecord(pick(BUILD_IDS));
    return { record: rec, level: pick([1, 2, 3, 0, -1, 0.5, 2.7, 5]) };
  });
  const params = {
    budynekMlynMnoznikPracy: pick([1, 1.2, 1.5, 0.8, 2]),
    budynekMlynBonusPracy: pick([0, 1, 2.5, 5]),
    budynekCegielniBonusPracy: pick([0, 0.1, 0.25, 0.5]),
    korupcjaCap: pick([0.5, 0.9, 1, 0.25, 0]),
    mennicaMnoznikPoWalucie: pick([1, 1.5, 1.62, 1.38, 2]),
    budynekBibliotekaBonusNauki: pick([0, 0.5, 0.25]),
    budynekAkademiaBonusNauki: pick([0, 0.1, 0.2]),
    budynekGarncarniaBonusZywnosci: pick([0, 0.1, 0.5]),
    zywnoscZuzytkaPopulacja: pick([0.5, 1, 2]),
  };
  const opt = (p, vals) => (chance(p) ? pick(vals) : undefined);
  const ctx = {
    wojskoZuzycieZywnosci: pick([0, 1, 2.5]),
    strataFraction: pick([0, 0.1, 0.25, 0.4, 0.6, 0.9, 1, 0.05]),
    maMlyn: chance(0.5),
    maCegielnia: chance(0.5),
    maTargowisko: chance(0.5),
    maMennica: chance(0.5),
    maBiblioteka: opt(0.8, [true, false]),
    maAkademia: opt(0.8, [true, false]),
    walutaOdkryta: opt(0.8, [true, false]),
    civHandelMult: opt(0.5, [1, 0.5, 1.15, 0]),
    civNaukaMult: opt(0.5, [1, 1.15, 0.5, 2]),
    premiaHandluTrasHandlowych: opt(0.5, [0, 0.05, 0.5, 0.95, 3.5, -1]),
    additionalTax: opt(0.5, [0, 2, -3, 7.5]),
    liczbaGarncarni: opt(0.5, [0, 1, 3]),
  };
  for (const k of Object.keys(ctx)) if (ctx[k] === undefined) delete ctx[k];
  const out = E.cityYieldPerTurn(city, tiles, bldgs, params, ctx);
  const outObj = {};
  for (const k of OUT_KEYS) outObj[k] = numE(out[k]);
  vectors.push({
    fn: 'cityYieldPerTurn',
    in: {
      civKey: tagOf(civKey),
      ludnosc: numE(city.ludnosc),
      procentNauka: numE(city.podziałHandlu.procentNauka),
      procentPieniadz: numE(city.podziałHandlu.procentPieniadz),
      procentLuksus: numE(city.podziałHandlu.procentLuksus),
      poborcaCount: city.specjalisci.filter((s) => s === 'poborca').length,
      tiles: tiles.map(tagTile),
      buildings: bldgs.map((b) => ({
        id: b.record.id,
        level: numE(b.level),
        baza: tagBaza(b.record.baza),
        przyrost: tagBaza(b.record.przyrost),
        dajeSzczescie: tagOf(b.record.dajeSzczescie),
      })),
      params: Object.fromEntries(Object.entries(params).map(([k, v]) => [k, numE(v)])),
      ctx: Object.fromEntries(Object.entries(ctx).map(([k, v]) => [k, tagOf(v)])),
    },
    out: outObj,
  });
}

writeFileSync(outPath, JSON.stringify({ pin: '91dc998a', source: 'gra/src/game/economy.ts via esbuild bundle (r4)',
  count: vectors.length, vectors }));
console.log('vectors=' + vectors.length);
