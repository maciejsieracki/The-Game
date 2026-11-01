'use strict';
/**
 * R-WEB-CAPITAL-SPACING-MEASURE-Q1 — narzędzie pomiarowe (read-only, zero zmian w gra/src).
 *
 * Mierzy odległości między stolicami różnych cywilizacji po pełnej ścieżce startu
 * (generateMap -> buildClusterStartPlan), dla zadanych rozmiarów / typów świata /
 * udziałów lądu / ziaren. Bundluje źródła esbuildem do katalogu mktemp (poza gra/),
 * więc NIE uruchamia `npm run build`/`dev`.
 *
 * Użycie:
 *   node gra/tools/capital-spacing-measure.cjs \
 *     --sizes Standardowy,Mały --types kontynenty,pangea,wyspy \
 *     --lf 0.30,def --seeds 1,2,3,4,5 [--epoch kamien] [--max-types] \
 *     [--gra /sciezka/do/gra] [--out wynik.json] [--label nazwa]
 *
 *   --lf   lista udziałów lądu; "def" = domyślny dla typu (defaultLandFractionForTyp)
 *   --rivers 1  włącz generowanie rzek (domyślnie wyłączone: ~100 s/mapę, nie zmienia ląd/morze)
 *   --gra  korzeń `gra/` do zmierzenia (domyślnie ten, w którym leży narzędzie);
 *          pozwala mierzyć starszy commit rozpakowany przez `git archive`.
 *   esbuild: require('esbuild') z gra/node_modules LUB env CIV_ESBUILD_DIR (katalog z node_modules).
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const Module = require('module');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return def;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}

const GRA = path.resolve(arg('gra', path.join(__dirname, '..')));
const SIZES = String(arg('sizes', 'Standardowy')).split(',');
const TYPES = String(arg('types', 'kontynenty,pangea,wyspy')).split(',');
const LFS = String(arg('lf', 'def')).split(',');
const SEEDS = String(arg('seeds', '1,2,3,4,5')).split(',').map(Number);
const EPOCH = String(arg('epoch', 'kamien'));
const USE_MAX_TYPES = arg('max-types', false) === true;
const OUT = arg('out', null);
const LABEL = String(arg('label', path.basename(path.dirname(GRA)) || 'gra'));

function loadEsbuild() {
  const dirs = [GRA, path.join(__dirname, '..'), process.env.CIV_ESBUILD_DIR, process.cwd()].filter(Boolean);
  for (const d of dirs) {
    try {
      return require(require.resolve('esbuild', { paths: [d] }));
    } catch (_) { /* next */ }
  }
  throw new Error('Brak esbuild: ustaw CIV_ESBUILD_DIR na katalog z node_modules/esbuild');
}
const esbuild = loadEsbuild();

// Bundle poza gra/ (mktemp), ale z absWorkingDir = GRA, żeby rozwiązywać importy i JSON.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'capsep-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
const rel = (p) => JSON.stringify(path.join(GRA, p).replace(/\\/g, '/'));
fs.writeFileSync(entry, `
export { buildClusterStartPlan } from ${rel('src/game/cluster-start')};
export { generateMap, ROZMIAR_DIMS, rozmiarFromMenuLabel } from ${rel('src/map/generator')};
export { setRiverGenPhaseOverride, setRiverGenEnabledOverride } from ${rel('src/map/riverGenSwitch')};
export {
  capitalMinSeparationForMap, capitalMinSeaDistForMap, capitalMaxSeaDistForMap,
  clusterCenterPlacementSepForMap, clusterBodyBufferRadius, clusterBodySeparationForMap,
} from ${rel('src/map/clusters')};
export { hexDistanceAxial, buildSeaDistanceField, defaultLandFractionForTyp } from ${rel('src/map/gen-helpers')};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA,
  logLevel: 'silent', nodePaths: [path.join(GRA, 'node_modules')],
});
const M = require(bundle);
const RIVERS = arg('rivers', '0') !== '0'; // domyślnie BEZ rzek (rzeki ~100 s/mapę Standard, nie wpływają na ląd/morze)
try { M.setRiverGenPhaseOverride('main'); } catch (_) { /* starsze commity */ }
try { if (!RIVERS) M.setRiverGenEnabledOverride(false); } catch (_) { /* starsze commity */ }

const civs = JSON.parse(fs.readFileSync(path.join(GRA, 'data/civs.json'), 'utf8'));
const eStart = JSON.parse(fs.readFileSync(path.join(GRA, 'data/e-start-params.json'), 'utf8'));
const mapGen = JSON.parse(fs.readFileSync(path.join(GRA, 'data/map-gen-params.json'), 'utf8'));

function pct(sorted, p) {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}
function median(a) { const s = a.slice().sort((x, y) => x - y); return pct(s, 0.5); }

function scaleParams(label) {
  const sk = eStart.skala_mapy && eStart.skala_mapy[label];
  const rywale = sk ? sk.miasta_panstwa : 6;
  let typy = sk ? sk.typy_cywilizacji : 6;
  const pe = sk && sk.typy_cywilizacji_per_epoka && sk.typy_cywilizacji_per_epoka[EPOCH];
  if (pe) typy = USE_MAX_TYPES ? pe.max : pe.default;
  return { rywale, typy, rywaleAi: sk ? sk.rywale_ai : null };
}

function captureWarns(fn) {
  const warns = [];
  const orig = console.warn;
  console.warn = (...a) => { warns.push(a.join(' ')); };
  try { return { res: fn(), warns }; } finally { console.warn = orig; }
}

const rows = [];
for (const sizeLabel of SIZES) {
  const rozmiar = M.rozmiarFromMenuLabel(sizeLabel);
  const [w, h] = M.ROZMIAR_DIMS[rozmiar];
  const { rywale, typy } = scaleParams(sizeLabel);
  for (const typ of TYPES) {
    for (const lfRaw of LFS) {
      const lf = lfRaw === 'def' ? M.defaultLandFractionForTyp(typ) : Number(lfRaw);
      for (const seed of SEEDS) {
        const t0 = Date.now();
        const map = M.generateMap(w, h, seed, typ, {
          landFraction: lf,
          mapSizeMenuLabel: sizeLabel,
          worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
        });
        const genMs = Date.now() - t0;
        let landHexes = 0, bandHexes = 0;
        const sd = M.buildSeaDistanceField(map.hexes);
        const cw = map.szerokoscQ || w, ch = map.wysokoscR || h;
        const { res: plan, warns } = captureWarns(() => M.buildClusterStartPlan({
          map, civs, seed, playerCivId: 'grecy', rywaleNaKlaster: rywale, aktywneTypy: typy, startEpochId: EPOCH,
        }));
        const rozKl = plan.placement.rozmiarMapy;
        const minSep = M.capitalMinSeparationForMap(rozKl, cw, ch);
        const placeSep = M.clusterCenterPlacementSepForMap(rozKl, cw, ch);
        const seaLo = M.capitalMinSeaDistForMap(rozKl, cw, ch);
        const seaHi = M.capitalMaxSeaDistForMap(rozKl, cw, ch);
        for (const hx of Object.values(map.hexes)) {
          const tb = hx.terenBazowy;
          if (tb === 'morze' || tb === 'plytkie_morze' || tb === 'wybrzeze' || tb === 'gory') continue;
          landHexes++;
          const d = sd.get(hx.coords.q + ',' + hx.coords.r);
          if (d !== undefined && d >= seaLo && d <= seaHi) bandHexes++;
        }
        // Stolice cywilizacji: gracz + stolice klastrów obcych typów.
        const caps = [{ typ: 'player', q: plan.playerStartHex.q, r: plan.playerStartHex.r }];
        for (const fc of plan.foreignTypeClusters) {
          const p = fc.positions[0];
          if (p) caps.push({ typ: fc.typ, q: p.q, r: p.r });
        }
        // Wszystkie miasta startowe z etykietą typu (gracz+rywale tego samego typu = 'player').
        const cities = [{ typ: 'player', q: plan.playerStartHex.q, r: plan.playerStartHex.r }];
        for (const fc of plan.foreignTypeClusters) for (const p of fc.positions) cities.push({ typ: fc.typ, q: p.q, r: p.r });
        for (const p of plan.pendingSameTypeRivalHexes || []) cities.push({ typ: 'player', q: p.q, r: p.r });
        const D = (a, b) => M.hexDistanceAxial(a.q, a.r, b.q, b.r);
        const pairs = [];
        let minPairPlayer = false, minPairD = Infinity;
        for (let i = 0; i < caps.length; i++) for (let j = i + 1; j < caps.length; j++) {
          const d = D(caps[i], caps[j]);
          pairs.push(d);
          if (d < minPairD) { minPairD = d; minPairPlayer = i === 0; }
        }
        // Klasyfikacja par miast różnych cywilizacji (zarzut Evaluatora): stolica-stolica,
        // stolica-MP (bufor bryły ceil(S/2) dotyczy WYŁĄCZNIE MP wokół obcej stolicy), MP-MP.
        // Pozycja 0 grupy = stolica, reszta = miasta-państwa klastra; MP gracza = pendingSameTypeRivalHexes.
        const grp = [{ id: 'player', cap: caps[0], mps: (plan.pendingSameTypeRivalHexes || []).map((p) => ({ q: p.q, r: p.r })) }];
        for (const fc of plan.foreignTypeClusters) {
          grp.push({ id: fc.typ, cap: { q: fc.positions[0].q, r: fc.positions[0].r }, mps: fc.positions.slice(1).map((p) => ({ q: p.q, r: p.r })) });
        }
        const bufR = M.clusterBodyBufferRadius(M.clusterBodySeparationForMap(rozKl, cw, ch));
        let capMpMin = Infinity, mpMpMin = Infinity, bufViol = 0, bufViolMin = Infinity, mpTotal = 0;
        for (let i = 0; i < grp.length; i++) for (let j = 0; j < grp.length; j++) {
          if (i === j) continue;
          for (const m of grp[i].mps) {
            const dc = D(m, grp[j].cap);
            capMpMin = Math.min(capMpMin, dc);
            if (bufR > 0 && dc < bufR) { bufViol++; bufViolMin = Math.min(bufViolMin, dc); }
            if (j > i) for (const m2 of grp[j].mps) mpMpMin = Math.min(mpMpMin, D(m, m2));
          }
        }
        for (const g of grp) mpTotal += g.mps.length;
        // Stolice surowego computeClusters (przed relokacją gracza / HARD apply).
        const rawCaps = (plan.placement.klastry || []).map((k) => {
          const c = (k.miasta || []).find((m) => m.isCapital) || (k.miasta || [])[0];
          return c ? { q: c.q, r: c.r } : null;
        }).filter(Boolean);
        let rawMin = Infinity;
        for (let i = 0; i < rawCaps.length; i++) for (let j = i + 1; j < rawCaps.length; j++) rawMin = Math.min(rawMin, D(rawCaps[i], rawCaps[j]));
        // Środki Voronoi (centrum) vs faktyczne stolice: dryf stolicy od środka + min. para środków.
        const centers = (plan.placement.klastry || []).map((k) => ({ q: k.centrum.q, r: k.centrum.r }));
        let centerMin = Infinity;
        for (let i = 0; i < centers.length; i++) for (let j = i + 1; j < centers.length; j++) centerMin = Math.min(centerMin, D(centers[i], centers[j]));
        const drifts = (plan.placement.klastry || []).map((k) => {
          const c = (k.miasta || []).find((m) => m.isCapital) || (k.miasta || [])[0];
          return c ? D(k.centrum, c) : null;
        }).filter((x) => x != null);
        const playerShift = rawCaps.length ? D(rawCaps[plan.placement.playerTypIndex] || rawCaps[0], caps[0]) : null;
        const nn = caps.map((c, i) => Math.min(...caps.map((o, j) => (i === j ? Infinity : D(c, o)))));
        let cityMin = Infinity;
        for (let i = 0; i < cities.length; i++) for (let j = i + 1; j < cities.length; j++) {
          if (cities[i].typ !== cities[j].typ) cityMin = Math.min(cityMin, D(cities[i], cities[j]));
        }
        // Górne ograniczenie osiągalnego rozproszenia: greedy farthest-point (k-center) z hexu gracza
        // na (a) puli z bramką seaDist>=seaLo (jak w generatorze), (b) całym lądzie bez bramki.
        const poolAll = [], poolGate = [];
        for (const hx of Object.values(map.hexes)) {
          const tb = hx.terenBazowy;
          if (tb === 'morze' || tb === 'plytkie_morze' || tb === 'wybrzeze' || tb === 'gory') continue;
          const o = { q: hx.coords.q, r: hx.coords.r };
          poolAll.push(o);
          const d = sd.get(o.q + ',' + o.r);
          if (d !== undefined && d >= seaLo) poolGate.push(o);
        }
        const greedyMin = (pool, k) => {
          if (pool.length < k) return null;
          const chosen = [caps[0]];
          const minD = pool.map((o) => D(o, caps[0]));
          let worst = Infinity;
          for (let n = 1; n < k; n++) {
            let bi = 0;
            for (let i = 1; i < pool.length; i++) if (minD[i] > minD[bi]) bi = i;
            worst = Math.min(worst, minD[bi]);
            chosen.push(pool[bi]);
            for (let i = 0; i < pool.length; i++) minD[i] = Math.min(minD[i], D(pool[i], pool[bi]));
          }
          return worst;
        };
        const ubGate = greedyMin(poolGate, caps.length);
        const ubNoGate = greedyMin(poolAll, caps.length);
        const requested = plan.placement.requestedTypy ?? typy;
        rows.push({
          size: sizeLabel, w, h, rozKl, typ, lf, seed, genMs,
          land: landHexes, band: bandHexes, minSep, placeSep, seaLo, seaHi,
          caps: caps.map((c) => `${c.typ}@${c.q},${c.r}`),
          poolGate: poolGate.length, ubGate, ubNoGate,
          requested, placedCivs: caps.length, placementTypes: plan.placement.aktywneTypy,
          capMin: pairs.length ? Math.min(...pairs) : null,
          centerMin: Number.isFinite(centerMin) ? centerMin : null, driftMedian: drifts.length ? median(drifts) : null, driftMax: drifts.length ? Math.max(...drifts) : null,
          minPairPlayer, rawCapMin: Number.isFinite(rawMin) ? rawMin : null, rawN: rawCaps.length, playerShift,
          capNnMedian: nn.length > 1 ? median(nn) : null,
          pairsLt2Sep: pairs.filter((d) => d < 2 * minSep).length,
          pairsTotal: pairs.length,
          cityMinDiffCiv: Number.isFinite(cityMin) ? cityMin : null,
          capMpMin: Number.isFinite(capMpMin) ? capMpMin : null, mpMpMin: Number.isFinite(mpMpMin) ? mpMpMin : null,
          bufR, bufViol, bufViolMin: Number.isFinite(bufViolMin) ? bufViolMin : null, mpTotal,
          warnClusters: warns.filter((x) => x.includes('[clusters]')).length,
          warnSpawn: warns.filter((x) => x.includes('[cluster-spawn]')).length,
          warnSample: warns.slice(0, 2),
        });
      }
    }
  }
}

// Agregacja: size × typ × lf
const groups = new Map();
for (const r of rows) {
  const k = `${r.size}|${r.typ}|${r.lf}`;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(r);
}
const summary = [];
for (const [k, rs] of groups) {
  const caps = rs.map((r) => r.capMin).filter((x) => x != null);
  const r0 = rs[0];
  summary.push({
    key: k, n: rs.length, dims: `${r0.w}x${r0.h}`, rozKl: r0.rozKl, minSep: r0.minSep, placeSep: r0.placeSep,
    sea: `${r0.seaLo}-${r0.seaHi}`,
    landAvg: Math.round(rs.reduce((a, r) => a + r.land, 0) / rs.length),
    bandAvg: Math.round(rs.reduce((a, r) => a + r.band, 0) / rs.length),
    bandMin: Math.min(...rs.map((r) => r.band)),
    requested: r0.requested,
    poolGateAvg: Math.round(rs.reduce((a, r) => a + r.poolGate, 0) / rs.length),
    ubGateMedian: median(rs.map((r) => r.ubGate).filter((x) => x != null)),
    ubNoGateMedian: median(rs.map((r) => r.ubNoGate).filter((x) => x != null)),
    placedAvg: +(rs.reduce((a, r) => a + r.placedCivs, 0) / rs.length).toFixed(2),
    placedMin: Math.min(...rs.map((r) => r.placedCivs)),
    capMinOfMin: caps.length ? Math.min(...caps) : null,
    minPairWithPlayerPct: Math.round(100 * rs.filter((r) => r.minPairPlayer).length / rs.length),
    centerMinMedian: median(rs.map((r) => r.centerMin).filter((x) => x != null)),
    driftMedian: median(rs.map((r) => r.driftMedian).filter((x) => x != null)),
    driftMaxMax: Math.max(...rs.map((r) => r.driftMax ?? 0)),
    rawCapMinMedian: median(rs.map((r) => r.rawCapMin).filter((x) => x != null)),
    playerShiftMedian: median(rs.map((r) => r.playerShift).filter((x) => x != null)),
    capMedianOfMin: caps.length ? median(caps) : null,
    pairsLt2Sep: rs.reduce((a, r) => a + r.pairsLt2Sep, 0),
    mapsLt25: rs.filter((r) => r.capMin != null && r.capMin < 25).length,
    mapsLt30: rs.filter((r) => r.capMin != null && r.capMin < 30).length,
    bufR: r0.bufR, mpTotalAvg: +(rs.reduce((a, r) => a + r.mpTotal, 0) / rs.length).toFixed(1),
    capMpMinOfMin: Math.min(...rs.map((r) => (r.capMpMin == null ? 999 : r.capMpMin))),
    mpMpMinOfMin: Math.min(...rs.map((r) => (r.mpMpMin == null ? 999 : r.mpMpMin))),
    mapsBufViol: rs.filter((r) => r.bufViol > 0).length, bufViolTotal: rs.reduce((a, r) => a + r.bufViol, 0),
    cityMinDiffCivMin: Math.min(...rs.map((r) => (r.cityMinDiffCiv == null ? 999 : r.cityMinDiffCiv))),
    warnClusters: rs.reduce((a, r) => a + r.warnClusters, 0),
    warnSpawn: rs.reduce((a, r) => a + r.warnSpawn, 0),
    genMsAvg: Math.round(rs.reduce((a, r) => a + r.genMs, 0) / rs.length),
  });
}
const out = { label: LABEL, gra: GRA, epoch: EPOCH, seeds: SEEDS, rows, summary };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
for (const s of summary) console.log(JSON.stringify(s));
const all = rows.filter((r) => r.capMin != null);
console.log(JSON.stringify({
  label: LABEL, maps: rows.length,
  pctMapsAnyPairLt25: +(100 * all.filter((r) => r.capMin < 25).length / (all.length || 1)).toFixed(1),
  pctMapsAnyPairLt30: +(100 * all.filter((r) => r.capMin < 30).length / (all.length || 1)).toFixed(1),
}));
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* ignore */ }
void mapGen;
