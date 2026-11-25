'use strict';
/**
 * weary40-sim-measure.cjs -- R-WEB-DIPLO-WEARY40-SIM-MEASURE-Q1: pomiar w Node zmeczenia wojna (40 tur) i pokoju
 * wymuszonego (100%). POMIAR, nie zmiana gry: nic nie zapisuje do gra/src ani gra/data.
 *
 * Co jest PRAWDZIWE (ten sam kod co w grze):
 *   - decideAITurn (ai.ts) przez silnik zastepczy ai-war-defend-home-sim.cjs (bundle esbuild z gra/src),
 *   - runWarWearinessTick + warWearinessLevel (war-weariness.ts) -- tick AI<->AI, pokoj wymuszony, oferty,
 *   - parametry gra/data/war-weariness-params.json (pelneTur 40, progWymuszonyPokoj 1,0).
 * Co jest UPROSZCZONE (model, nie gra; patrz raport):
 *   - mapa 64x36 z 3 miastami/cywilizacje, jednostki bojowe, uproszczona walka (ai-war-defend-home-sim.cjs),
 *   - sila militarna = liczba zywych jednostek (zamiast compareMilitaryStrength z gry),
 *   - PRZED (baza 5bafaa3c3, kod z /tmp/basegra lub --basesrc): proxy ceny = 100*(udzial_zwyciezcy-0,5)*2 PW, miasto = 15 PW;
 *   - PO (kandydat, R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1): PRAWDZIWA funkcja ceny gry wearinessPeaceCashPn(L)
 *     (6000 PN x (1-L)), miasto = 1840 PN (12 obywateli, wycena z raportu CITY-BALANCE), stolica zakazana,
 *   - brak ekonomii, mgly, dyplomacji gracza, deklaracji wojen (wojna startuje na poczatku dla wszystkich par),
 *   - brak decyzji AI o pokoju poza tickiem (w silniku zastepczym decideAITurn nie proponuje pokoju).
 *
 * PRZED (proxy) = te same funkcje z parametrami: pelneTur 20, progWymuszonyPokoj 2,0 (wylaczony), reszta bez zmian.
 * Oznacza to PRZED-parametrowy, NIE bit-w-bit commit 774fd0eec (tam kodu pokoju wymuszonego nie bylo).
 *
 * Uzycie (z gra/):  node tools/weary40-sim-measure.cjs [--turns 150] [--seeds 3] [--variant po|przed|both] [--from 1] [--cities 3]
 *   --cities K: miast na cywilizacje (domyslnie 3 jak w ai-war-defend-home-measure.cjs; 6 = wariant stresowy, bo
 *   przy 3 miastach ochrona minMiastPoOddaniu=3 blokuje jakiekolwiek oddanie miasta).
 * Smoke (<60 s): node tools/weary40-sim-measure.cjs --turns 30 --seeds 1 --variant both
 * Wynik: JSON w stdout (dwa wiersze na ziarno i wariant: skrot + zdarzenia pokoju). Bez zapisu poza gra/tools.
 * Wymaga gra/node_modules/esbuild (i three dla lancucha importow silnika), zgodnych z gra/package.json.
 */
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const path = require('path');
const S = require('./ai-war-defend-home-sim.cjs');
const { WAR_WEARINESS_PARAMS } = (() => {
  // Parametry ladowane z tego samego JSON co gra (bez kopii danych).
  const P = require(path.resolve(__dirname, '..', 'data', 'war-weariness-params.json'));
  return { WAR_WEARINESS_PARAMS: P };
})();

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const TURNS = parseInt(arg('turns', '150'), 10);
const SEEDS = parseInt(arg('seeds', '3'), 10);
const FROM = parseInt(arg('from', '1'), 10);
const VARIANT = arg('variant', 'both');
const BASE_ROOT = path.resolve(arg('basesrc', `${require('os').tmpdir()}/basegra/gra-${TMPDIR_RUN_ID}`));
const CITY_PN_REAL = 1840;

function rng(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

/** Ten sam scenariusz co ai-war-defend-home-measure.cjs (4..6 cywilizacji, 3 miasta, 6 jednostek). */
const CITIES_PER_CIV = Math.max(3, parseInt(arg('cities', '3'), 10));
const CITY_OFFSETS = [[0, 0], [3, 2], [-3, 3], [2, -3], [-2, -3], [4, -1], [-4, 1], [1, 4], [-1, -4], [5, 3], [-5, -2], [3, -5]];

function scenario(seed) {
  const rand = rng(seed * 7919 + 13);
  const n = 4 + (seed % 3);
  const W = 64; const H = 36;
  const cx = W / 2; const cy = H / 2; const rad = 20;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const cities = []; const units = []; const aiOwners = [];
  for (let i = 0; i < n; i++) {
    const owner = i + 1; aiOwners.push(owner);
    const ang = (i / n) * Math.PI * 2 + rand() * 0.2;
    const hx = Math.round(cx + Math.cos(ang) * rad * 1.4);
    const hy = Math.round(cy + Math.sin(ang) * rad * 0.7);
    CITY_OFFSETS.slice(0, CITIES_PER_CIV).forEach(([dq, dr], k) => {
      cities.push(S.mkCity(`c${owner}${String.fromCharCode(97 + k)}`, owner, clamp(hx + dq, 2, W - 3), clamp(hy + dr, 2, H - 3)));
    });
    for (let k = 0; k < 6; k++) {
      units.push(S.mkUnit(`u${owner}_${k}`, owner, clamp(hx + (k % 3) - 1, 1, W - 2), clamp(hy + Math.floor(k / 3) - 1, 1, H - 2)));
    }
  }
  const wars = new Set();
  for (let a = 1; a <= n; a++) for (let b = a + 1; b <= n; b++) wars.add(`${a}_${b}`);
  return { map: S.makeMap(W, H), units, cities, wars, aiOwners, n };
}

const pk = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);

/** Parametry wariantu: PO = plik gry; PRZED = proxy (pelneTur 20, bez pokoju wymuszonego). */
function paramsFor(variant) {
  if (variant === 'po') return WAR_WEARINESS_PARAMS;
  // PRZED = parametry bazy (git show / --basesrc), bez zmian wartosci.
  return JSON.parse(require('fs').readFileSync(path.join(BASE_ROOT, 'data', 'war-weariness-params.json'), 'utf8'));
}

function runOne(seed, variant, E) {
  const P = paramsFor(variant);
  const sc = scenario(seed);
  const state = sc.map ? sc : sc;
  const owners = sc.aiOwners;
  const warStart = new Map(); // pairKey -> tura startu (wojna poczatkowa = 1)
  for (const k of state.wars) warStart.set(k, 1);
  const lockUntil = new Map(); // pairKey -> tura konca karencji (po pokoju)
  const lost = new Map();      // pairKey -> {[owner]: liczba miast utraconych w tej wojnie}
  const prevOwner = new Map(); // cityId -> owner (do wykrywania zmian)
  for (const c of state.cities) prevOwner.set(c.id, c.ownerId);
  const store = new Map();
  const events = [];           // zakonczenia wojen
  const cityLog = [];          // zmiany wlasciciela miast przez pokoj (wymuszony / oferta)
  const priceLog = [];         // cena 0 / 1 miasto / remis
  const snow = { t50: 0, t100: 0, t150: 0 };
  let ticks = 0;
  const cityCount = (o) => state.cities.filter(c => c.ownerId === o).length;
  const unitCount = (o) => state.units.filter(u => u.ownerId === o && u.hp > 0).length;
  const shareOf = (x, y) => {
    const a = unitCount(x), b = unitCount(y);
    return a + b <= 0 ? 0.5 : a / (a + b);
  };
  const weakerOf = (x, y) => {
    const a = unitCount(x), b = unitCount(y);
    if (a !== b) return a < b ? x : y;
    return x > y ? x : y; // remis: wieksza liczba id przegrywa (deterministycznie)
  };
  const warInfo = (a, b) => {
    const key = pk(a, b);
    const ws = warStart.get(key) ?? 1;
    const L = lost.get(key) || {};
    return {
      warStart: ws, turnsAtWar: 0, lostA: L[a] || 0, lostB: L[b] || 0, turnsSinceCityChange: 0,
    };
  };
  // Zamiast warInfo z turnsAtWar: uzupelnione w onTurn (aktualna tura).
  let curTurn = 1;
  const wi = (a, b) => { const w = warInfo(a, b); w.turnsAtWar = curTurn - w.warStart + 1; return w; };
  const priceByPair = new Map(); // pairKey -> cena z wywolania tick (per para w tej turze)

  const deps = {
    store,
    pairs: [],
    pairKey: pk,
    warInfo: wi,
    shareOf,
    weakerOf,
    cityCountOf: cityCount,
    price: (winner, loser, level) => {
      const sh = shareOf(winner, loser);
      // PO: prawdziwa funkcja ceny gry; PRZED: proxy udzialowe.
      const req = variant === 'po' ? RT_PO.wearinessPeaceCashPn(level) : Math.max(0, Math.round(100 * (sh - 0.5) * 2));
      priceByPair.set(pk(winner, loser), { required: req, share: sh, loser, winner });
      return {
        requiredPn: req,
        balanceFor: (covered) => covered - req,
        tolerancePn: 5,
      };
    },
    assets: (loser) => {
      const mine = state.cities.filter(c => c.ownerId === loser).sort((x, y) => (x.id < y.id ? -1 : 1));
      return mine.map((c, i) => ({ kind: 'miasto', id: c.id, amount: 1, pn: variant === 'po' ? CITY_PN_REAL : 15, forbidden: i === 0 }));
    },
    cityCessionOk: () => true,
    battlePending: false,
    pay: (loser, winner, plan) => {
      for (const it of plan.items) {
        const c = state.cities.find(x => x.id === it.id);
        if (c && c.ownerId === loser) { c.ownerId = winner; c.capturedFromOwnerId = loser; }
      }
    },
    finalize: (loser, winner, lockTurns) => {
      const key = pk(loser, winner);
      state.wars.delete(key);
      warStart.delete(key);
      lockUntil.set(key, curTurn + lockTurns);
    },
    params: P,
  };

  const onTurn = (turn, st) => {
    curTurn = turn;
    // 1) zmiany wlasciciela miast w wojnie (zdobycie przez wroga) -> liczniki utrat pary.
    for (const c of st.cities) {
      const prev = prevOwner.get(c.id);
      if (prev !== undefined && prev !== c.ownerId) {
        const key = pk(prev, c.ownerId);
        if (state.wars.has(key)) {
          const L = lost.get(key) || {};
          L[prev] = (L[prev] || 0) + 1;
          lost.set(key, L);
        }
      }
    }
    // 2) pary AI<->AI w wojnie, obie strony maja miasta.
    const pairs = [];
    for (const key of st.wars) {
      const [a, b] = key.split('_').map(Number);
      if (cityCount(a) > 0 && cityCount(b) > 0) pairs.push({ a, b });
    }
    pairs.sort((p, q) => (p.a - q.a) || (p.b - q.b));
    deps.pairs = pairs;
    // 3) tick pokoju (prawdziwa funkcja gry).
    const before = new Map(st.cities.map(c => [c.id, c.ownerId]));
    // Migawka PRZED tickiem: liczba miast i udzial przegrywajacego oraz start wojny (finalize kasuje warStart w tickiem).
    const ownSnap = new Map(owners.map(o => [o, cityCount(o)]));
    const totalSnap = st.cities.length;
    const startSnap = new Map(warStart);
    priceByPair.clear();
    const outs = pairs.length ? (variant === 'po' ? RT_PO : RT_PRZED).runWarWearinessTick({ ...deps, turn }) : [];
    ticks++;
    for (const o of outs) {
      if (o.action === 'forced_peace' || o.action === 'offer_accepted') {
        const [loser, winner] = [o.loser, o.winner];
        const give = o.plan ? o.plan.items.length : 0;
        const kind = o.action === 'forced_peace' ? 'wymuszony(100%)'
          : o.level >= P.zmeczenie.progWymuszonyPokoj ? 'wymuszony(100%)'
            : o.level >= P.zmeczenie.progWzajemnyPokoj ? 'oferta(>=80%)' : 'oferta(<80%)';
        const pr = priceByPair.get(o.pairKey) || {};
        events.push({ turn, pair: o.pairKey, kind, level: +o.level.toFixed(3), stage: o.stage, cities: give,
          loser, winner, priceZero: pr.required === 0, remis: Math.abs((pr.share ?? 0.5) - 0.5) < 1e-9,
          ownCitiesBefore: ownSnap.get(loser) ?? 0, loserShareBefore: +((ownSnap.get(loser) ?? 0) / Math.max(1, totalSnap)).toFixed(3),
          warTurns: turn - (startSnap.get(o.pairKey) ?? 1) });
        if (pr.required === 0 || give === 1 || Math.abs((pr.share ?? 0.5) - 0.5) < 1e-9) {
          priceLog.push({ turn, pair: o.pairKey, kind, cena0: pr.required === 0, miasta: give, remis: Math.abs((pr.share ?? 0.5) - 0.5) < 1e-9 });
        }
        if (give) cityLog.push({ turn, pair: o.pairKey, kind, miasta: give });
      }
    }
    // 4) aktualizacja snapshotu wlascicieli (zmiany z pokoju nie licza sie jako utrata wojenna).
    for (const c of st.cities) prevOwner.set(c.id, c.ownerId);
    // 5) snowball (udzial najwiekszej cywilizacji w miastach) w t50/t100/t150.
    const total = st.cities.length;
    const maxShare = Math.max(0, ...owners.map(o => cityCount(o) / total));
    if (turn === 50) snow.t50 = maxShare;
    if (turn === 100) snow.t100 = maxShare;
    if (turn === 150) snow.t150 = maxShare;
    if (turn === 1) snow.t1 = maxShare;
    // Zapisz tura zakonczenia = wycofanie z wojen (ai-war-defend-home-sim czyta st.wars zywo).
    void before;
  };

  const st = S.simulate(state, { engine: E, homeDefense: false, turns: TURNS, reinforceEvery: 3, onTurn });
  const endWars = [...state.wars].map(k => {
    const [a, b] = k.split('_').map(Number);
    return { pair: k, start: warStart.get(k) ?? 1 };
  });
  const elim = owners.filter(o => cityCount(o) === 0).length;
  const endCounts = owners.map(o => cityCount(o));
  const maxShareEnd = Math.max(...owners.map(o => cityCount(o) / state.cities.length));
  const durations = events.map(e => e.warTurns);
  const avgDur = durations.length ? +(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) : 0;
  const maxDur = durations.length ? Math.max(...durations) : 0;
  return {
    seed, variant, n: owners.length, turns: TURNS,
    warsStartedInitial: scenario(seed).wars.size,
    peaceEvents: events,
    priceCases: priceLog,
    cityTransfers: cityLog.reduce((a, c) => a + c.miasta, 0),
    cityTransfersByKind: cityLog.reduce((a, c) => { a[c.kind] = (a[c.kind] || 0) + c.miasta; return a; }, {}),
    warsRunningAtEnd: endWars.length,
    avgWarTurns: avgDur, maxWarTurns: maxDur,
    eliminated: elim,
    endCityCounts: endCounts,
    snowball: { t1: +(snow.t1 || 0).toFixed(3), t50: +snow.t50.toFixed(3), t100: +snow.t100.toFixed(3), t150: +snow.t150.toFixed(3), maxShareEnd: +maxShareEnd.toFixed(3) },
    avgTurnMs: +(st.perTurnMs.reduce((a, b) => a + b, 0) / st.perTurnMs.length).toFixed(2),
    ticks,
  };
}

function bundleRuntime(root, tag) {
  // Bundle prawdziwego war-weariness.ts (zrodlo gry w root) do pliku tymczasowego obok skryptu, usuwany na koncu.
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  const fs = require('fs');
  const entry = path.resolve(__dirname, `.weary40-entry-${tag}.ts`);
  const bundle = path.resolve(__dirname, `.weary40-bundle-${tag}.cjs`);
  const exp = tag === 'po' ? 'runWarWearinessTick, warWearinessLevel, wearinessPeaceCashPn, WAR_WEARINESS_PARAMS' : 'runWarWearinessTick, warWearinessLevel, WAR_WEARINESS_PARAMS';
  fs.writeFileSync(entry, `export { ${exp} } from ${JSON.stringify(path.resolve(root, 'src', 'game', 'war-weariness.ts'))};\n`, 'utf8');
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, absWorkingDir: root, logLevel: 'silent', loader: { '.json': 'json' } });
  return { bundle, entry, mod: require(bundle) };
}
const _po = bundleRuntime(path.resolve(__dirname, '..'), 'po');
const RT_PO = _po.mod;
const _pr = (VARIANT === 'po') ? null : bundleRuntime(BASE_ROOT, 'przed');
const RT_PRZED = _pr ? _pr.mod : null;

function main() {
  const E = S.loadEngine(null, 'weary40');
  const variants = VARIANT === 'both' ? ['po', 'przed'] : [VARIANT];
  const rows = [];
  for (let seed = FROM; seed < FROM + SEEDS; seed++) {
    for (const v of variants) {
      const r = runOne(seed, v, E);
      rows.push(r);
      // Zwarty wiersz (bez pelnej listy zdarzen) + pelna lista w osobnym polu.
      const { peaceEvents, priceCases, ...short } = r;
      console.log(JSON.stringify({ ...short, peaceCount: peaceEvents.length, priceCases: priceCases.length }));
      console.log(JSON.stringify({ seed, variant: v, peaceEvents, priceCases }));
    }
  }
  S.cleanup(E);
  for (const b of [_po, _pr]) if (b) for (const f of [b.bundle, b.entry]) { try { require('fs').unlinkSync(f); } catch (_) { /* ok */ } }
}

if (require.main === module) main();
module.exports = { runOne, paramsFor, scenario };
