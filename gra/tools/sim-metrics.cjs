'use strict';
/**
 * sim-metrics.cjs -- R-WEB-TEST-HOOK-HEADLESS-GAME-Q1 (+ R-WEB-MEASURE-ROBOCZA-Q1).
 *
 * Symulacja wielu tur na PRAWDZIWEJ grze (headless Chromium, hak ?testhook=1).
 *
 * Użycie (z katalogu gra/):
 *   node tools/sim-metrics.cjs --seeds 101,102 --turns 60 --ai 5 [--cs 2]
 *       [--difficulty normal] [--era kamien] [--policy pass|accept-all-offers|reject-all-offers]
 *       [--flag warRulesMultiwar=false] [--flag diploTickWarBrake=false] [--flag diploSensibleDeals=false]
 *       [--no-auto-battles] [--json]
 *
 * Polityka gracza dla ofert handlowych AI->gracz (negotiationTable): rozpatrywana, gdy bramka końca
 * tury ją zablokowała (pierwsza próba końca tury -> blokada -> rozpatrzenie -> ponowna próba).
 *   pass / reject-all-offers = odrzuć; accept-all-offers = akceptuj.
 *
 * Tabela (jedna linia na seed) i blok `diplo` w --json. Metryki i ich definicje: patrz
 * `diploSummary` poniżej oraz gra/tools/README-sim-harness.md.
 *
 * Kod wyjścia: 0 gdy przebieg dokończył się bez pageerror i bez TIMEOUT tury; 1 w przeciwnym razie.
 */

const { withSimBundle, launchBrowser, openSimPage, waitForHook, runSim } = require('./lib/game-sim-harness.cjs');

function parseArgs(argv) {
  const a = {
    seeds: [101, 102], turns: 60, ai: 5, cs: 2, difficulty: 'normal', era: 'kamien',
    policy: 'pass', flags: {}, autoBattles: true, json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === '--seeds') a.seeds = String(v()).split(',').map(Number);
    else if (k === '--turns') a.turns = Number(v());
    else if (k === '--ai') a.ai = Number(v());
    else if (k === '--cs') a.cs = Number(v());
    else if (k === '--difficulty') a.difficulty = v();
    else if (k === '--era') a.era = v();
    else if (k === '--policy') a.policy = v();
    else if (k === '--flag') {
      const [name, raw] = String(v()).split('=');
      a.flags[name] = raw === 'null' ? null : raw === 'true' ? true : raw === 'false' ? false : raw;
    }
    else if (k === '--no-auto-battles') a.autoBattles = false;
    else if (k === '--json') a.json = true;
    else throw new Error('sim-metrics: nieznana opcja ' + k);
  }
  if (a.seeds.some(s => !Number.isInteger(s) || s <= 0)) throw new Error('sim-metrics: seedy muszą być dodatnimi liczbami całkowitymi');
  if (!['pass', 'accept-all-offers', 'reject-all-offers'].includes(a.policy)) throw new Error('sim-metrics: nieznana polityka ' + a.policy);
  return a;
}

function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Rozkład liczb: min / mediana / max (null gdy pusto). */
function spread(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((x, y) => x - y);
  return { min: s[0], med: median(s), max: s[s.length - 1] };
}

const pairKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/** Id wpisu warEventLog: `war-<tura>-<agresor>-<cel>`. */
function parseWarId(id) {
  const m = /^war-(\d+)-(-?\d+)-(-?\d+)$/.exec(id || '');
  return m ? { turn: Number(m[1]), declarer: Number(m[2]), target: Number(m[3]) } : null;
}

/** Tura, w której wystąpiła linia konsoli (po znaczniku czasu ściennego). */
function turnOfTime(metrics, t) {
  for (const m of metrics) {
    if (t >= m.tStart - 300 && t <= m.tEnd + 300) return m;
  }
  return null;
}

/**
 * R-WEB-MEASURE-ROBOCZA-Q1: metryki dyplomacji z danych per tura.
 * snap0 = stan po starcie (przed turą 1), m = metryki tur.
 * ZAŁOŻENIA: gracz = playerId z haka; epoka wojny = max(epoka strony A, epoka strony B) w turze wybuchu;
 * agresor wojny gracza = declarer z warEventLog; agresor AI-AI NIE jest w stanie gry (NIE_ZMIERZONO),
 * dla wojen AI->gracz i wymuszonych wojen epoki agresor pochodzi z linii konsoli.
 */
function diploSummary(m, snap0, snapEnd, consoleLines) {
  const playerId = snap0.playerId;
  const lines = consoleLines || [];
  // Linie konsoli przypisane do tur.
  const linesByTurn = new Map();
  for (const ln of lines) {
    const t = turnOfTime(m, ln.t);
    if (!t) continue;
    if (!linesByTurn.has(t.turn)) linesByTurn.set(t.turn, []);
    linesByTurn.get(t.turn).push(ln.text);
  }

  // R1 / start wojen.
  const before40 = m.filter(t => t.turn < 40);
  const warsBeforeT40 = before40.length ? before40[before40.length - 1].wars : 0;
  const warsAtTurn = Object.fromEntries(m.filter(t => [10, 20, 30, 40, 50, 60].includes(t.turn)).map(t => [t.turn, t.wars]));

  // Nowe wojny per tura (pary, które weszły w stan wojny).
  let prevSet = new Set(snap0.wars.map(([a, b]) => pairKey(a, b)));
  const newWars = []; // { turn, a, b, eraLabel }
  const eraAt = (turn, id) => {
    const t = m.find(x => x.turn === turn);
    return t && t.eras ? t.eras[String(id)] : undefined;
  };
  for (const t of m) {
    const cur = new Set((t.warPairs || []).map(([a, b]) => pairKey(a, b)));
    for (const k of cur) {
      if (prevSet.has(k)) continue;
      const [a, b] = k.split('-').map(Number);
      const ea = eraAt(t.turn, a);
      const eb = eraAt(t.turn, b);
      const eraLabel = Math.max(ea || 1, eb || 1);
      newWars.push({ turn: t.turn, a, b, eraLabel });
    }
    prevSet = cur;
  }
  const warStartTurns = [...new Set(newWars.map(w => w.turn))];
  const newWarsByEra = {};
  for (const w of newWars) newWarsByEra[w.eraLabel] = (newWarsByEra[w.eraLabel] || 0) + 1;

  // R2: max wojen na cywilizację w kamieniu (era === 1) -- po wszystkich turach.
  let maxWarsPerCivStone = 0;
  let maxWarsPerCivAny = 0;
  for (const t of m) {
    const count = new Map();
    for (const [a, b] of t.warPairs || []) {
      count.set(a, (count.get(a) || 0) + 1);
      count.set(b, (count.get(b) || 0) + 1);
    }
    for (const [owner, c] of count) {
      maxWarsPerCivAny = Math.max(maxWarsPerCivAny, c);
      if (t.eras && t.eras[String(owner)] === 1) maxWarsPerCivStone = Math.max(maxWarsPerCivStone, c);
    }
  }

  // R3: wojny epoki na epokę. Wymuszone (log R-EPOKA-*-WYMUSZONA-WOJNA) liczone per epoka wybuchu.
  const forcedEraWarsByEra = {};
  const forcedEraWarTurns = [];
  for (const [turn, arr] of linesByTurn) {
    for (const text of arr) {
      const mm = /AI(\d+) wypowiada wymuszon.*?AI(\d+)/.exec(text);
      if (!mm) continue;
      const t = m.find(x => x.turn === turn);
      const e = Math.max((t.eras || {})[mm[1]] || 1, (t.eras || {})[mm[2]] || 1);
      forcedEraWarsByEra[e] = (forcedEraWarsByEra[e] || 0) + 1;
      forcedEraWarTurns.push(turn);
    }
  }
  const maxForcedEraWarsPerEra = Math.max(0, ...Object.values(forcedEraWarsByEra));

  // Wojny gracza (warEventLog): agresor = declarer.
  const playerEvs = [...new Set(snapEnd.playerWarEvents || [])].map(parseWarId).filter(Boolean);
  const playerDeclaredByPlayer = playerEvs.filter(e => e.declarer === playerId).length;
  const playerWarsAgainstPlayer = playerEvs.filter(e => e.declarer !== playerId).length;

  // Wojny AI->gracz i PM->gracz z konsoli (agresor = nadawca komunikatu).
  let aiToPlayerConsole = 0;
  let pmToPlayerConsole = 0;
  for (const arr of linesByTurn.values()) {
    for (const text of arr) {
      if (/AI\d+ wypowiada wojne graczowi/.test(text)) aiToPlayerConsole++;
      if (/PM\d+ wypowiada wojne graczowi/.test(text)) pmToPlayerConsole++;
    }
  }

  // Kryzys Zaufania (kolejka = liczba par z licznikiem > 0).
  let crisisMaxQueue = 0;
  let crisisMaxCounter = 0;
  let crisisTurnsNonEmpty = 0;
  for (const t of m) {
    const vals = Object.values(t.crisis || {});
    crisisMaxQueue = Math.max(crisisMaxQueue, vals.filter(v => v > 0).length);
    crisisMaxCounter = Math.max(crisisMaxCounter, ...vals);
    if (vals.some(v => v > 0)) crisisTurnsNonEmpty++;
  }

  // Zaufanie AI<->AI (bez par z graczem) w czasie.
  const trustAIAIAt = {};
  for (const t of m) {
    if (![10, 20, 30, 40, 50, 60].includes(t.turn) || !t.trust) continue;
    const vals = Object.entries(t.trust)
      .filter(([k]) => !k.split('-').map(Number).includes(playerId))
      .map(([, v]) => v);
    trustAIAIAt[t.turn] = spread(vals);
  }

  // Zdobyte miasta: zmiana właściciela tego samego heksu między startem a końcem.
  let citiesChanged = 0;
  let citiesLostByPlayer = 0;
  let citiesGainedByPlayer = 0;
  for (const [hex, owner0] of Object.entries(snap0.cityOwners || {})) {
    const ownerEnd = (snapEnd.cityOwners || {})[hex];
    if (ownerEnd === undefined || ownerEnd === owner0) continue;
    citiesChanged++;
    if (owner0 === playerId) citiesLostByPlayer++;
    if (ownerEnd === playerId) citiesGainedByPlayer++;
  }

  // Oferty handlowe AI->gracz (unikalne po id).
  const offerMap = new Map();
  for (const t of m) for (const o of (t.tradeOffers || [])) if (!offerMap.has(o.id)) offerMap.set(o.id, { ...o, turn: t.turn });
  const offers = [...offerMap.values()];
  const reasons = {};
  const actions = {};
  for (const o of offers) {
    const r = o.reason || '(brak)';
    reasons[r] = (reasons[r] || 0) + 1;
    actions[o.actionId] = (actions[o.actionId] || 0) + 1;
  }
  const bilans = offers.map(o => o.bilansPW).filter(v => typeof v === 'number');
  const blockedTurns = m.filter(t => t.blockedByOffer);
  const released = blockedTurns.filter(t => t.releasedAfterResolve === true).length;
  const notReleased = blockedTurns.filter(t => t.releasedAfterResolve === false).map(t => t.turn);
  const perTurn = m.map(t => (t.tradeOffers || []).length);

  return {
    playerId,
    warsBeforeT40,
    warsAtTurn,
    firstWarTurn: warStartTurns.length ? warStartTurns[0] : null,
    warStartTurns,
    newWarsTotal: newWars.length,
    newWarsByEra,
    maxWarsPerCivStone,
    maxWarsPerCivAny,
    forcedEraWarsByEra,
    forcedEraWarTurns,
    maxForcedEraWarsPerEra,
    playerDeclaredByPlayer,
    playerWarsAgainstPlayer,
    aiToPlayerConsole,
    pmToPlayerConsole,
    crisisMaxQueue,
    crisisMaxCounter,
    crisisTurnsNonEmpty,
    trustAIAIAt,
    citiesChanged,
    citiesLostByPlayer,
    citiesGainedByPlayer,
    tradeOffersUnique: offers.length,
    tradeOffersPerTurn: spread(perTurn),
    tradeBilansMin: bilans.length ? Math.min(...bilans) : null,
    tradeBilansNegative: bilans.filter(v => v < 0).length,
    tradeReasons: reasons,
    tradeActions: actions,
    blockedTurns: blockedTurns.map(t => t.turn),
    blockedReleased: released,
    blockedNotReleased: notReleased,
    endBlockedTurns: m.filter(t => t.endBlocked).map(t => t.turn),
    // Linie [EndTurn] z konsoli per tura (przyczyna blokady końca tury, do audytu zwolnień).
    endTurnLines: Object.fromEntries([...linesByTurn.entries()]
      .map(([turn, arr]) => [turn, arr.filter(x => /EndTurn/.test(x)).slice(0, 5)])
      .filter(([, arr]) => arr.length > 0)),
    resolvedOnBlockTotal: m.reduce((s, t) => s + (t.resolvedOnBlock || 0), 0),
  };
}

function summarizeRun(res, turns) {
  const m = res.metrics;
  const before40 = m.filter(t => t.turn < 40);
  const warsBefore40 = before40.length ? before40[before40.length - 1].wars : 0;
  // Typy cywilizacji na mapie = AI + gracz (ZAŁOŻENIE R2, patrz main.ts civTypesCount = aiCount+1).
  const civTypes = (res.aiCount || 0) + 1;
  const warsEnd = res.snapEnd.warCount;
  // Oferty liczone UNIKALNIE po id (kolejka pending jest sumowana co turę -- nie sumujemy).
  const offerIds = new Set(m.flatMap(t => t.offerIds || []));
  const offers = offerIds.size;
  const offersNeg = res.snapEnd.offers.filter(o => o.goldOnce !== null && o.goldOnce < 0).length;
  return {
    turnsRun: m.length,
    turnsRequested: turns,
    warsBefore40,
    warsEnd,
    civTypes,
    warsPerCiv: civTypes ? +(warsEnd / civTypes).toFixed(2) : null,
    maxWars: Math.max(0, ...m.map(t => t.wars)),
    offersTotal: offers,
    offersNegative: offersNeg,
    turnMsMedian: median(m.map(t => t.ms)),
    hashEnd: m.length ? m[m.length - 1].hash : res.snapEnd.hash,
    startMs: res.startMs,
    diplo: diploSummary(m, res.snap0, res.snapEnd, res.consoleLines),
  };
}

function printTable(rows) {
  const cols = [
    ['seed', 'seed'], ['wojnyT40', 'wojny przed T40'], ['firstWar', 'pierwsza wojna'],
    ['maxStone', 'max wojen/cyw. (kamien)'], ['maxEraForced', 'max wojen epoki/epoke'],
    ['newWars', 'nowe wojny'], ['warsEnd', 'wojny koniec'],
    ['playerAgg', 'gracz=agresor'], ['aiToPlayer', 'AI->gracz'], ['cities', 'miasta zmienione'],
    ['offers', 'oferty handl. (unik.)'], ['bilanNeg', 'oferty bilans<0'],
    ['blocked', 'tury zablokowane'], ['released', 'zwolnione'],
    ['turnMs', 'czas tury med. ms'], ['turns', 'tury'], ['errors', 'pageerror'], ['hash', 'hash'],
  ];
  const cells = rows.map(r => {
    const d = r.summary.diplo || {};
    return {
      seed: String(r.seed),
      wojnyT40: String(r.summary.warsBefore40),
      firstWar: String(d.firstWarTurn ?? '-'),
      maxStone: String(d.maxWarsPerCivStone ?? '-'),
      maxEraForced: String(d.maxForcedEraWarsPerEra ?? '-'),
      newWars: String(d.newWarsTotal ?? '-'),
      warsEnd: String(r.summary.warsEnd),
      playerAgg: String(d.playerDeclaredByPlayer ?? '-'),
      aiToPlayer: String(d.playerWarsAgainstPlayer ?? '-'),
      cities: String(d.citiesChanged ?? '-'),
      offers: String(d.tradeOffersUnique ?? '-'),
      bilanNeg: String(d.tradeBilansNegative ?? '-'),
      blocked: String((d.blockedTurns || []).length),
      released: String(d.blockedReleased ?? '-'),
      turnMs: String(r.summary.turnMsMedian),
      turns: `${r.summary.turnsRun}/${r.summary.turnsRequested}`,
      errors: String(r.pageErrors.length),
      hash: r.summary.hashEnd,
    };
  });
  const cols2 = cols.map(([k, h]) => [k, h]);
  const widths = cols2.map(([k, h]) => Math.max(h.length, ...cells.map(c => c[k].length)));
  const line = (vals) => vals.map((v, i) => v.padEnd(widths[i])).join(' | ');
  console.log(line(cols2.map(c => c[1])));
  console.log(widths.map(w => '-'.repeat(w)).join('-+-'));
  for (const c of cells) console.log(line(cols2.map(([k]) => c[k])));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const results = [];
  let failed = false;
  await withSimBundle(async ({ bundleDir }) => {
    const browser = await launchBrowser();
    try {
      for (const seed of args.seeds) {
        const { page, context, pageErrors, consoleLines } = await openSimPage(browser, { bundleDir, testhook: true });
        try {
          await waitForHook(page);
          const res = await runSim(page, {
            seed, turns: args.turns, aiCount: args.ai, cityStates: args.cs,
            difficulty: args.difficulty, era: args.era, policy: args.policy,
            flags: args.flags, autoResolveBattles: args.autoBattles,
          });
          const summary = summarizeRun({ ...res, aiCount: args.ai, consoleLines }, args.turns);
          const timedOut = res.metrics.some(t => String(t.hash).startsWith('TIMEOUT'));
          if (pageErrors.length || timedOut || summary.turnsRun < args.turns) failed = true;
          results.push({ seed, summary, pageErrors, timedOut, flags: args.flags, policy: args.policy, startSnapshot: res.snap0, metrics: res.metrics });
        } catch (e) {
          failed = true;
          results.push({ seed, summary: { turnsRun: 0, turnsRequested: args.turns, warsBefore40: 0, warsEnd: 0, civTypes: 0, warsPerCiv: null, maxWars: 0, offersTotal: 0, offersNegative: 0, turnMsMedian: null, hashEnd: 'ERROR', startMs: 0, diplo: {} }, pageErrors: [String(e && e.message || e).slice(0, 300)], timedOut: false, flags: args.flags, policy: args.policy });
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  });
  if (args.json) console.log(JSON.stringify(results, null, 2));
  else {
    printTable(results);
    for (const r of results) {
      if (r.pageErrors.length) console.log(`seed ${r.seed} pageerror(y): ${r.pageErrors.length} -> ${r.pageErrors[0]}`);
    }
  }
  process.exitCode = failed ? 1 : 0;
}

if (require.main === module) {
  main().catch(e => { console.error('[sim-metrics] BŁĄD:', e && e.message || e); process.exitCode = 1; });
}

module.exports = { parseArgs, summarizeRun, diploSummary, spread, median, parseWarId };
