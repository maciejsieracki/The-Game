// Generator wektorow P6.M06B1 (finalizacja wybrzeza i wod srodladowych: maxOceanBayDepth,
// purgeReliefValleyWater, trimDeepOceanBays, finalizeCoastAndInlandWater, thickenCoastAndSmoothInlets,
// flattenFalseCoastalRiverNotches; gen-helpers.ts:4649-4939).
// URUCHAMIA prawdziwy kod TS weba (pin edb8fb56). Zadnej logiki nie przepisujemy.
// Uzycie (z katalogu webu wyeksportowanego przez `git archive edb8fb56 gra/src gra/data`):
//   node --experimental-transform-types --no-warnings --import ./m06b1-loader-register.mjs \
//        ./gen-m06b1-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
// Mapy sa zapisywane raz (tablica `maps`) i wskazywane przez indeks w przypadkach. Stan mapy:
// [klucz, terenBazowy, nakladka, zloze(0/1), rzekaObecna(0/1), rzekaKrawedzie[]].
// Kazda funkcja dostaje SWIEZA kopie mapy (z tablicy `maps`), wiec przypadki sa niezalezne.
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m06b1-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;
const G = await import(pathToFileURL(`${mapDir}/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;

const f = (x) => (Object.is(x, -0) ? '-0' : String(x));
const rng = G.mulberry32(20261030);
const rnd = () => rng();
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

// ---------- stan: zapis / odczyt ----------
const keyOf = (q, r) => `${q},${r}`;
function dumpObj(hexes) {
  return Object.entries(hexes).map(([k, h]) => [
    k,
    h.terenBazowy,
    h.nakladka,
    h.zloze ? 1 : 0,
    h.rzeka.obecna ? 1 : 0,
    [...h.rzeka.krawedzie],
  ]);
}
function buildObj(rows) {
  const o = {};
  for (const [k, terr, nak, z, ro, ed] of rows) {
    const [q, r] = k.split(',').map(Number);
    o[k] = { coords: { q, r }, terenBazowy: terr, nakladka: nak, rzeka: { obecna: ro === 1, krawedzie: [...ed] }, ...(z ? { zloze: 'rudy' } : {}) };
  }
  return o;
}

const maps = [];
const addMap = (hexesObj) => {
  maps.push(dumpObj(hexesObj));
  return maps.length - 1;
};

// ---------- generatory map ----------
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

// Losowa mapa W x H: bloby lądu (spacer), morze/plytkie, gory/wzgorza, rzeki, zloza, lasy.
// enclosedP: prawdopodobienstwo morza WEWNATRZ lądu (odciete zatoki) i plytkiego w ladzie.
function randMap(W, H, landFrac, mtnShare, riverP, depP, enclosedP) {
  const keys = [];
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) keys.push(keyOf(q, r));
  const land = new Set();
  const target = Math.round(keys.length * landFrac);
  const seeds = Math.max(1, Math.round(keys.length / 40));
  const frontier = [];
  for (let i = 0; i < seeds; i++) {
    const k = keys[Math.floor(rnd() * keys.length)];
    land.add(k);
    frontier.push(k);
  }
  let guard = 0;
  while (land.size < target && frontier.length && guard++ < keys.length * 50) {
    const idx = Math.floor(rnd() * frontier.length);
    const [q, r] = frontier[idx].split(',').map(Number);
    const [dq, dr] = DIRS[Math.floor(rnd() * DIRS.length)];
    const nq = q + dq;
    const nr = r + dr;
    if (nq >= 0 && nq < W && nr >= 0 && nr < H) {
      const nk = keyOf(nq, nr);
      if (!land.has(nk)) {
        land.add(nk);
        frontier.push(nk);
      }
    }
    if (rnd() < 0.02) frontier.splice(idx, 1);
  }
  const rows = [];
  for (const k of keys) {
    const isLand = land.has(k);
    let terr;
    if (isLand) {
      const x = rnd();
      if (rnd() < enclosedP) terr = rnd() < 0.7 ? TB.Morze : TB.PlytkieMorze;
      else if (x < mtnShare) terr = TB.Gory;
      else if (x < mtnShare * 1.6) terr = TB.Wzgorza;
      else terr = [TB.Laka, TB.Rownina, TB.Pustynia][ri(0, 2)];
    } else {
      terr = rnd() < 0.8 ? TB.Morze : TB.PlytkieMorze;
    }
    const water = terr === TB.Morze || terr === TB.PlytkieMorze;
    const nak = !water && rnd() < 0.1 ? NK.Las : NK.Brak;
    const zloze = (!water && rnd() < depP) || (water && rnd() < 0.03) ? 1 : 0;
    let ro = 0;
    let ed = [];
    if (rnd() < riverP) {
      ro = 1;
      const n = ri(1, 3);
      const set = new Set();
      while (set.size < n) set.add(ri(0, 5));
      ed = [...set].sort((a, b) => a - b);
    }
    const [q, r] = k.split(',').map(Number);
    rows.push([k, terr, nak, zloze, ro, ed]);
    void q; void r;
  }
  return { W, H, rows };
}

// Mapa 7x7 wypelniona `base`, z nadpisaniami { key: [terr, nak?, zloze?, ro?, ed?] }.
function grid(W, H, base, over = {}) {
  const rows = [];
  for (let q = 0; q < W; q++) {
    for (let r = 0; r < H; r++) {
      const k = keyOf(q, r);
      const o = over[k];
      const terr = o ? o[0] : base;
      rows.push([k, terr, o && o[1] ? o[1] : NK.Brak, o && o[2] ? 1 : 0, o && o[3] ? 1 : 0, o && o[4] ? o[4] : []]);
    }
  }
  return rows;
}

// ---------- rejestr przypadkow ----------
const cases = { ocean: [], purge: [], trim: [], finalize: [], thicken: [], flatten: [] };
const hits = {};
const bump = (name, n = 1) => {
  hits[name] = (hits[name] ?? 0) + n;
};

// ===== 1. maxOceanBayDepth (bez mapy): rozmiary wokol progow floor(min/6) = 4 i 16 =====
for (let m = 1; m <= 110; m++) {
  for (const [w, h] of [[m, m], [m, m + 7], [90, m]]) {
    const v = G.maxOceanBayDepth(w, h);
    cases.ocean.push({ id: `ocean-${w}x${h}`, w, h, out: f(v) });
    const scaled = Math.floor(Math.min(w, h) / 6);
    if (scaled === 4 || scaled === 16 || scaled === 3 || scaled === 5 || scaled === 15 || scaled === 17) bump(`ocean_scaled_${scaled}`);
  }
}

// ===== 2. purgeReliefValleyWater =====
// 2a. Losowe mapy.
const randIdx = [];
for (let i = 0; i < 120; i++) {
  const W = ri(6, 18);
  const H = ri(6, 16);
  const landFrac = [0.35, 0.5, 0.65][i % 3];
  const mtn = [0.1, 0.25, 0.4][(i >> 1) % 3];
  const m = randMap(W, H, landFrac, mtn, 0.1, 0.1, [0.0, 0.08, 0.15][i % 3]);
  randIdx.push({ W, H, mi: addMap(buildObj(m.rows)) });
}
// 2b. Mapy graniczne 7x7: srodek = woda, k z 6 sasiadow = Laka/Gory/Wzgorza; dry = liczba suchych,
// relief = liczba Gor/Wzgorz sposrod suchych. Dla wiekszego pokrycia progow >=2 i >=3 dry/relief
// przebiegamy pelna siatke dry 1..6, relief 0..dry, srodek Morze lub Plytkie, obwod: Laka lub Morze.
const DIRS7 = DIRS; // ten sam porzadek sasiadow
const center = keyOf(3, 3);
const nb7 = DIRS7.map(([dq, dr]) => keyOf(3 + dq, 3 + dr));
for (let dry = 1; dry <= 6; dry++) {
  for (let relief = 0; relief <= dry; relief++) {
    for (const cTerr of [TB.Morze, TB.PlytkieMorze]) {
      for (const border of ['laka', 'morze']) {
        const over = {};
        over[center] = [cTerr];
        nb7.forEach((k, i) => {
          if (i < dry) over[k] = [i < relief ? TB.Gory : (i % 2 ? TB.Laka : TB.Rownina)];
          else over[k] = [i % 2 ? TB.Morze : TB.PlytkieMorze];
        });
        const base = TB.Laka;
        const rows = grid(7, 7, base, over);
        if (border === 'morze') {
          for (const row of rows) {
            const [q, r] = row[0].split(',').map(Number);
            if (q === 0 || r === 0 || q === 6 || r === 6) row[1] = TB.Morze;
          }
        }
        const mi = addMap(buildObj(rows));
        const sub = { dry, relief, cTerr, border, W: 7, H: 7 };
        cases.purge.push({ id: `purge-t-d${dry}-r${relief}-${cTerr}-${border}`, mi, W: 7, H: 7, sub });
      }
    }
  }
}
for (const x of randIdx) cases.purge.push({ id: `purge-r-${x.mi}`, mi: x.mi, W: x.W, H: x.H });
// statystyka trafien progow: dla kazdego (hex woda, nie-brzeg) liczba Gor/Wzgorz i suchych sasiadow
for (const mi of [...randIdx.map((x) => x.mi), ...cases.purge.filter((c) => c.sub).map((c) => c.mi)]) {
  const hexes = buildObj(maps[mi].map((row) => row));
  for (const [k, h] of Object.entries(hexes)) {
    if (h.terenBazowy !== TB.Morze && h.terenBazowy !== TB.PlytkieMorze) continue;
    const { q, r } = h.coords;
    let relief = 0;
    let dry = 0;
    for (const [dq, dr] of DIRS) {
      const nh = hexes[keyOf(q + dq, r + dr)];
      if (!nh || nh.terenBazowy === TB.Morze || nh.terenBazowy === TB.PlytkieMorze) continue;
      dry++;
      if (nh.terenBazowy === TB.Gory || nh.terenBazowy === TB.Wzgorza) relief++;
    }
    for (const [name, v, t] of [['purge_relief', relief, 2], ['purge_dry', dry, 3]]) {
      if (v === t - 1) bump(`${name}_lt`);
      if (v === t) bump(`${name}_eq`);
      if (v === t + 1) bump(`${name}_gt`);
    }
    void k;
  }
}

// ===== 3. trimDeepOceanBays (losowe mapy z odcietym morzem) =====
for (let i = 0; i < 80; i++) {
  const W = ri(6, 18);
  const H = ri(6, 16);
  const m = randMap(W, H, [0.4, 0.6, 0.75][i % 3], 0.15, 0.05, 0.1, [0.05, 0.12, 0.2][i % 3]);
  const mi = addMap(buildObj(m.rows));
  cases.trim.push({ id: `trim-r-${i}`, mi, W, H, maxDepth: [undefined, 3, 9][i % 3] ?? null });
}

// ===== 4. finalizeCoastAndInlandWater (maxPasses 1..5, opcjonalna pula) =====
const finMaps = [];
for (let i = 0; i < 60; i++) {
  const W = ri(7, 18);
  const H = ri(7, 16);
  const m = randMap(W, H, [0.3, 0.5, 0.7][i % 3], 0.12, 0.05, 0.1, [0.1, 0.2, 0.3][i % 3]);
  const mi = addMap(buildObj(m.rows));
  finMaps.push({ mi, W, H });
  for (const mp of [1, 2, 3, 4, 5]) {
    cases.finalize.push({ id: `fin-${i}-p${mp}`, mi, W, H, maxPasses: mp, pool: null });
  }
  for (const pool of [2, 5]) {
    cases.finalize.push({ id: `fin-${i}-pool${pool}`, mi, W, H, maxPasses: 3, pool });
  }
}
// trafienia progu przebiegu: czy wynik przy N-1 przebiegach rozni sie od N (na tych samych mapach)
for (const { mi, W, H } of finMaps) {
  const res = {};
  for (const mp of [1, 2, 3, 4, 5]) {
    const hx = buildObj(maps[mi]);
    G.finalizeCoastAndInlandWater(hx, W, H, mp);
    res[mp] = JSON.stringify(dumpObj(hx));
  }
  for (const mp of [2, 3, 4, 5]) if (res[mp] !== res[mp - 1]) bump(`fin_passes_diff_${mp}`);
}

// ===== 5. thickenCoastAndSmoothInlets (coastWidth: domyslny 2, 1, 2, 3) =====
const thickMaps = [];
for (let i = 0; i < 60; i++) {
  const W = ri(7, 18);
  const H = ri(7, 16);
  const m = randMap(W, H, [0.35, 0.55, 0.7][i % 3], 0.12, 0.05, 0.1, [0.05, 0.15, 0.25][i % 3]);
  const mi = addMap(buildObj(m.rows));
  thickMaps.push({ mi, W, H });
  for (const cw of ['default', 1, 2, 3]) {
    cases.thicken.push({ id: `thick-${i}-w${cw}`, mi, W, H, coastWidth: cw });
  }
}
// granice progu (a) >= 4: srodek Morze w 7x7, k z 6 sasiadow Laka (k=0..6), obwod Morze lub Laka
for (let k = 0; k <= 6; k++) {
  for (const shallow of [false, true]) {
    const over = {};
    nb7.forEach((key, i) => {
      over[key] = [i < k ? TB.Laka : (shallow ? TB.PlytkieMorze : TB.Morze)];
    });
    const rows = grid(7, 7, TB.Morze, over);
    const mi = addMap(buildObj(rows));
    for (const cw of ['default', 1, 2, 3]) {
      cases.thicken.push({ id: `thick-t-k${k}-s${shallow ? 1 : 0}-w${cw}`, mi, W: 7, H: 7, coastWidth: cw });
    }
  }
}
// trafienia progu >= 4 (wszystkie Morze, nie-brzeg, w mapach wejsciowych)
for (const { mi, W, H } of thickMaps) {
  const hx = buildObj(maps[mi]);
  for (const [k, h] of Object.entries(hx)) {
    if (h.terenBazowy !== TB.Morze) continue;
    const { q, r } = h.coords;
    if (Math.min(q, r, W - 1 - q, H - 1 - r) < 2) continue;
    let land = 0;
    for (const [dq, dr] of DIRS) {
      const nh = hx[keyOf(q + dq, r + dr)];
      if (nh && nh.terenBazowy !== TB.Morze && nh.terenBazowy !== TB.PlytkieMorze) land++;
    }
    if (land === 3) bump('thick_land_eq3');
    if (land === 4) bump('thick_land_eq4');
    if (land === 5) bump('thick_land_eq5');
    void k;
  }
}

// ===== 6. flattenFalseCoastalRiverNotches (prog >= 5 sasiadow Morze) =====
for (let i = 0; i < 80; i++) {
  const W = ri(7, 18);
  const H = ri(7, 16);
  const m = randMap(W, H, [0.4, 0.6, 0.75][i % 3], 0.12, 0.2, 0.1, [0.05, 0.15, 0.25][i % 3]);
  cases.flatten.push({ id: `flat-r-${i}`, mi: addMap(buildObj(m.rows)), W, H });
}
// granice progu (>= 5): srodek Plytkie, k sasiadow Morze (k=3..6), reszta Laka; z rzeka i bez.
for (let k = 3; k <= 6; k++) {
  for (const riverOn of [false, true]) {
    const over = {};
    over[keyOf(3, 3)] = [TB.PlytkieMorze, NK.Brak, 0, riverOn ? 1 : 0, riverOn ? [2] : []];
    nb7.forEach((key, i) => {
      over[key] = [i < k ? TB.Morze : TB.Laka];
    });
    const mi = addMap(buildObj(grid(7, 7, TB.Laka, over)));
    cases.flatten.push({ id: `flat-t-k${k}-r${riverOn ? 1 : 0}`, mi, W: 7, H: 7 });
  }
}
// trafienia progu morzeN >= 5 (Plytkie, nie-brzeg, bez rzeki)
for (const c of cases.flatten) {
  const hx = buildObj(maps[c.mi]);
  for (const [k, h] of Object.entries(hx)) {
    if (h.terenBazowy !== TB.PlytkieMorze || h.rzeka.obecna) continue;
    const { q, r } = h.coords;
    if (Math.min(q, r, c.W - 1 - q, c.H - 1 - r) < 2) continue;
    let morze = 0;
    for (const [dq, dr] of DIRS) if (hx[keyOf(q + dq, r + dr)]?.terenBazowy === TB.Morze) morze++;
    if (morze === 4) bump('flat_morze_eq4');
    if (morze === 5) bump('flat_morze_eq5');
    if (morze === 6) bump('flat_morze_eq6');
    void k;
  }
}

// ===== 7. (runda 3) NAKLADKA NA WODZIE: osobny generator (ovRng, ziarno 20261031), dopisany NA KONCU =====
// Zarzut FC r2: w starych wektorach heksy wodne maja wylacznie nakladke `brak`, wiec resety nakladki
// w purge/flatten/pierscieniu thicken nie sa obserwowalne. Tu: losowe mapy 7..12 x 7..12 z nakladka
// `las` na czesci heksow wodnych (i ladowych). Stare kategorie (1..6) i stare mapy NIE sa zmieniane:
// nowe przypadki sa DOPISANE na koncu kazdej tablicy (prefiks = stare wektory).
const ovRng = G.mulberry32(20261031);
const ovr = () => ovRng();
const ovi = (a, b) => a + Math.floor(ovr() * (b - a + 1));
const OV_TERR = [TB.Morze, TB.Morze, TB.PlytkieMorze, TB.PlytkieMorze, TB.Laka, TB.Rownina, TB.Gory, TB.Wzgorza, TB.Pustynia];
function ovMap(W, H) {
  const rows = [];
  for (let q = 0; q < W; q++) {
    for (let r = 0; r < H; r++) {
      const terr = OV_TERR[ovi(0, OV_TERR.length - 1)];
      const water = terr === TB.Morze || terr === TB.PlytkieMorze;
      const nak = (water && ovr() < 0.5) || (!water && ovr() < 0.2) ? NK.Las : NK.Brak;
      const zloze = ovr() < 0.1 ? 1 : 0;
      let ro = 0;
      let ed = [];
      if (ovr() < 0.2) {
        ro = 1;
        ed = [ovi(0, 5)];
      }
      rows.push([keyOf(q, r), terr, nak, zloze, ro, ed]);
    }
  }
  return rows;
}
const ovWaterLas = (rows) => rows.filter((x) => (x[1] === TB.Morze || x[1] === TB.PlytkieMorze) && x[2] === NK.Las).length;
// Mapy morskie (60% Morze, 25% Plytkie, 15% Laka): flatten (>=5 sasiadow Morze) i pierscien thicken
// (b) wymagaja gęstego morza; losowe mapy o rownym rozkladzie daja ich za malo (zmierzone: 0 resetow flatten).
function ovSeaMap(W, H) {
  const rows = [];
  for (let q = 0; q < W; q++) {
    for (let r = 0; r < H; r++) {
      const x = ovr();
      const terr = x < 0.6 ? TB.Morze : x < 0.85 ? TB.PlytkieMorze : TB.Laka;
      const water = terr === TB.Morze || terr === TB.PlytkieMorze;
      const nak = (water && ovr() < 0.5) || (!water && ovr() < 0.2) ? NK.Las : NK.Brak;
      const zloze = ovr() < 0.1 ? 1 : 0;
      let ro = 0;
      let ed = [];
      if (ovr() < 0.15) {
        ro = 1;
        ed = [ovi(0, 5)];
      }
      rows.push([keyOf(q, r), terr, nak, zloze, ro, ed]);
    }
  }
  return rows;
}
let ovHexes = 0;
const addOvCases = (rows, W, H, tag) => {
  ovHexes += ovWaterLas(rows);
  const mi = addMap(buildObj(rows));
  cases.purge.push({ id: `purge-ov-${tag}`, mi, W, H });
  cases.trim.push({ id: `trim-ov-${tag}`, mi, W, H, maxDepth: [undefined, 3][tag.length % 2] ?? null });
  cases.flatten.push({ id: `flat-ov-${tag}`, mi, W, H });
  cases.thicken.push({ id: `thick-ov-${tag}-wdefault`, mi, W, H, coastWidth: 'default' });
  cases.thicken.push({ id: `thick-ov-${tag}-w3`, mi, W, H, coastWidth: 3 });
  cases.finalize.push({ id: `fin-ov-${tag}-p3`, mi, W, H, maxPasses: 3, pool: null });
  cases.finalize.push({ id: `fin-ov-${tag}-pool2`, mi, W, H, maxPasses: 3, pool: 2 });
};
for (let i = 0; i < 30; i++) {
  const W = ovi(7, 12);
  const H = ovi(7, 12);
  addOvCases(ovMap(W, H), W, H, `${i}`);
}
for (let i = 0; i < 20; i++) {
  const W = ovi(7, 12);
  const H = ovi(7, 12);
  addOvCases(ovSeaMap(W, H), W, H, `s${i}`);
}
bump('overlay_water_las_hexes_in_inputs', ovHexes);

// ---------- uruchomienie funkcji web ----------
function runCase(kind, c) {
  if (kind === 'ocean') return { ret: c.out };
  const hx = buildObj(maps[c.mi]);
  if (kind === 'purge') {
    const ret = G.purgeReliefValleyWater(hx, c.W, c.H);
    return { ret: f(ret), state: dumpObj(hx) };
  }
  if (kind === 'trim') {
    const ret = G.trimDeepOceanBays(hx, c.W, c.H, c.maxDepth ?? undefined);
    return { ret: f(ret), state: dumpObj(hx) };
  }
  if (kind === 'finalize') {
    const opts = c.pool == null ? undefined : { maxInlandPoolSize: c.pool };
    G.finalizeCoastAndInlandWater(hx, c.W, c.H, c.maxPasses, opts);
    return { ret: null, state: dumpObj(hx) };
  }
  if (kind === 'thicken') {
    const ret = c.coastWidth === 'default' ? G.thickenCoastAndSmoothInlets(hx, c.W, c.H) : G.thickenCoastAndSmoothInlets(hx, c.W, c.H, c.coastWidth);
    return { ret: f(ret), state: dumpObj(hx) };
  }
  if (kind === 'flatten') {
    const ret = G.flattenFalseCoastalRiverNotches(hx, c.W, c.H);
    return { ret: f(ret), state: dumpObj(hx) };
  }
  throw new Error(`kind ${kind}`);
}

const result = { cases: {}, maps, stats: hits, meta: {} };
for (const kind of Object.keys(cases)) {
  result.cases[kind] = cases[kind].map((c) => {
    const o = runCase(kind, c);
    const rec = { id: c.id, ...c, output: o };
    // mapa wejsciowa jest w `maps[mi]`; `maps` mialo juz stan wejsciowy
    return rec;
  });
}
result.meta = {
  temat: 'R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1',
  pin_web: 'edb8fb56',
  generator: 'gen-m06b1-vectors.mjs',
  counts: Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, v.length])),
};
writeFileSync(out, JSON.stringify(result));
console.log(JSON.stringify({ counts: result.meta.counts, stats: hits, maps: maps.length }));
