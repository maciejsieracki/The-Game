'use strict';
/**
 * wojny-kamien-audyt-analiza.cjs — analiza surowych pomiarów z wojny-kamien-audyt.cjs.
 * TEMAT: P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1. Wejście: seed-*.json. Wyjście: tabele MD + summary.json.
 *   node tools/wojny-kamien-audyt-analiza.cjs --in <katalog> [--out <plik.md>]
 */
const fs = require('fs');
const path = require('path');

const argOf = (f, d) => { const i = process.argv.indexOf(f); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const IN = path.resolve(argOf('--in', '.'));
const OUT_MD = argOf('--out', null);

const files = fs.readdirSync(IN).filter(f => /^seed-\d+\.json$/.test(f)).sort();
if (files.length === 0) { console.error('brak plików seed-*.json w ' + IN); process.exit(1); }

const med = (a) => { if (a.length === 0) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const f3 = (n) => (n == null ? '—' : Number(n).toFixed(3));

const out = [];
const summary = { seeds: [] };
const L = (s) => out.push(s);

for (const file of files) {
  const d = JSON.parse(fs.readFileSync(path.join(IN, file), 'utf8'));
  const seed = d.seed;
  const S = { seed, params: d.params, turnsRun: (d.snapshots.length ? d.snapshots[d.snapshots.length - 1].turn : 0), elapsedS: d.elapsedS };
  L('');
  L('## Ziarno ' + seed + ' — ' + S.turnsRun + ' tur, ' + d.elapsedS + ' s, pierwsze miasto gracza: ' + d.foundedFirstCity);
  L('');
  L('Parametry menu (domyślne kreatora): ' + JSON.stringify(d.params));
  L('');

  // --- P4: czy gracz (owner 0) jest kandydatem wymuszonej wojny Kamienia ---
  const candRecs = d.stoneCand || [];
  const zeroInAiList = candRecs.filter(r => r.aiOwnerList.includes(0)).length;
  const zeroInCand = candRecs.filter(r => r.candidates.includes(0)).length;
  S.stoneCandRecords = candRecs.length;
  S.zeroInAiOwnerList = zeroInAiList;
  S.zeroInStoneCandidates = zeroInCand;
  L('### P4 — czy gracz może być celem wymuszonej wojny Kamienia');
  L('');
  L('| miara | wartość |');
  L('|---|---|');
  L('| wywołań budowy listy kandydatów (`stoneCandidates`) | ' + candRecs.length + ' |');
  L('| z nich zawierających owner 0 w `aiOwnerList` | ' + zeroInAiList + ' |');
  L('| z nich zawierających owner 0 w `stoneCandidates` | ' + zeroInCand + ' |');
  L('');

  // --- P1: wojny wymuszone Kamienia ---
  const owners = d.owners || [];
  const byTurn = new Map();
  for (const o of owners) {
    if (!byTurn.has(o.turn)) byTurn.set(o.turn, []);
    byTurn.get(o.turn).push(o);
  }
  const turnsSorted = [...byTurn.keys()].sort((a, b) => a - b);
  const pairFirstSeen = new Map(); const pairLastSeen = new Map();
  for (const t of turnsSorted) {
    const pairs = new Set();
    for (const o of byTurn.get(t)) for (const p of o.activePairs) pairs.add(p);
    for (const p of pairs) { if (!pairFirstSeen.has(p)) pairFirstSeen.set(p, t); pairLastSeen.set(p, t); }
  }
  const forcedFromConsole = (d.consoleLines || []).filter(l => /KAMIEN-WYMUSZONA-WOJNA: AI\d+/.test(l));
  S.forcedStoneWars = [...pairFirstSeen.keys()].map(p => ({
    pair: p, firstTurn: pairFirstSeen.get(p), lastTurn: pairLastSeen.get(p),
    durationTurns: pairLastSeen.get(p) - pairFirstSeen.get(p) + 1,
  }));
  S.forcedStoneConsoleLines = forcedFromConsole.length;
  L('### P1 — wojny WYMUSZONE epoki Kamienia (mechanizm forced-war-stone)');
  L('');
  if (S.forcedStoneWars.length === 0) {
    L('**0 wojen wymuszonych.** (0 par w `stoneForceWarActiveByPairKey` przez cały przebieg; '
      + forcedFromConsole.length + ' logów konsoli mechanizmu.)');
  } else {
    L('| para (atakujący×cel) | tura startu | ostatnia tura aktywna | długość [tur] |');
    L('|---|---|---|---|');
    for (const w of S.forcedStoneWars) L('| ' + w.pair + ' | ' + w.firstTurn + ' | ' + w.lastTurn + ' | ' + w.durationTurns + ' |');
  }
  L('');
  // Sciezka mechanizmu Kamienia per glowna cywilizacja AI: pending -> cel -> cycle
  const mainAi = [...new Set(owners.filter(o => !o.isCityState).map(o => o.ownerId))].sort((a, b) => a - b);
  L('Ścieżka mechanizmu Kamienia per główna cywilizacja AI (pierwsza tura, w której…):');
  L('');
  L('| AI | pierwszy raz `pending` | pierwszy raz wybrany cel (`stoneTarget`) | pierwszy raz `cycle` | tur z celem, bez wojny | pierwsza tura poza Kamieniem |');
  L('|---|---|---|---|---|---|');
  const sciezka = [];
  for (const oid of mainAi) {
    const recs = owners.filter(o => o.ownerId === oid).sort((a, b) => a.turn - b.turn);
    const fPending = recs.find(r => r.pending.includes(oid));
    const fTarget = recs.find(r => r.stoneTarget != null);
    const fCycle = recs.find(r => r.cycle.includes(oid));
    const targetNoWar = recs.filter(r => r.stoneTarget != null && r.wars === 0).length;
    const fNotStone = recs.find(r => r.epoch !== 1);
    const row = { ownerId: oid, firstPending: fPending ? fPending.turn : null,
      firstTarget: fTarget ? fTarget.turn : null, firstCycle: fCycle ? fCycle.turn : null,
      turnsTargetNoWar: targetNoWar, firstNonStoneTurn: fNotStone ? fNotStone.turn : null };
    sciezka.push(row);
    L('| ' + oid + ' | ' + (row.firstPending == null ? '**nigdy**' : row.firstPending)
      + ' | ' + (row.firstTarget == null ? '**nigdy**' : row.firstTarget)
      + ' | ' + (row.firstCycle == null ? '**nigdy**' : row.firstCycle)
      + ' | ' + row.turnsTargetNoWar
      + ' | ' + (row.firstNonStoneTurn == null ? 'zostaje w Kamieniu' : row.firstNonStoneTurn) + ' |');
  }
  S.sciezkaMechanizmu = sciezka;
  L('');
  // stan mechanizmu: pending / cycle / epoka
  const lastByOwner = new Map();
  for (const o of owners) lastByOwner.set(o.ownerId, o);
  L('Stan mechanizmu na końcu przebiegu (per AI owner):');
  L('');
  L('| owner | miast | epoka | wojen | pending? | cycle? | miasto-państwo? |');
  L('|---|---|---|---|---|---|---|');
  for (const [oid, o] of [...lastByOwner.entries()].filter(e => !e[1].isCityState).sort((a, b) => a[0] - b[0])) {
    L('| ' + oid + ' | ' + o.cityCount + ' | ' + o.epoch + ' | ' + o.wars + ' | '
      + (o.pending.includes(oid) ? 'TAK' : 'nie') + ' | ' + (o.cycle.includes(oid) ? 'TAK' : 'nie')
      + ' | ' + (o.isCityState ? 'TAK' : 'nie') + ' |');
  }
  S.ownersEnd = [...lastByOwner.values()].filter(o => !o.isCityState);
  S.ownersEndCityStateCount = [...lastByOwner.values()].filter(o => o.isCityState).length;
  L('');

  // --- Wszystkie wojny (dowolny mechanizm) z migawek relacji ---
  const warFirst = new Map();
  for (const sn of d.snapshots) for (const w of sn.wars) if (!warFirst.has(w)) warFirst.set(w, sn.turn);
  S.allWarPairsFirstTurn = [...warFirst.entries()].map(([p, t]) => ({ pair: p, turn: t }));
  L('### Wszystkie pary w stanie wojny (dowolny mechanizm, z `getDiploRelation`)');
  L('');
  if (warFirst.size === 0) L('**Brak jakiejkolwiek pary w stanie wojny przez cały przebieg.**');
  else {
    L('| para ownerów | pierwsza tura ze stanem wojny |');
    L('|---|---|');
    for (const [p, t] of [...warFirst.entries()].sort((a, b) => a[1] - b[1])) L('| ' + p + ' | ' + t + ' |');
  }
  L('');

  // --- P2/e: bramy wojny AI → GRACZ ---
  const vsPlayer = d.gatesVsPlayer || [];
  S.gateRecordsTotal = d.gatesTotal || 0;
  S.gateRecordsVsPlayer = vsPlayer.length;
  const aiIds = [...new Set(vsPlayer.map(g => g.me))].sort((a, b) => Number(a) - Number(b));
  L('### P2 — bramy `wypowiedz_wojne` AI → GRACZ (owner 0), per AI');
  L('');
  L('Warunki priorytetu 4 w `ai.ts` (`decideAIDiplomacy`): `!stanWojny` · `!peaceLocked` · `!hasNapTreaty` · '
    + '`willingnessWar > 0` · `rw >= progSila` · `effAgresja >= progAgresja` · `score < progRel`.');
  L('');
  L('| AI | ocen (tur) | rw min | rw mediana | rw max | prog siły | ile tur rw>=prog | effAgresja | prog agresji | ile tur agresja OK | score mediana | prog relacji | ile tur score<prog | willWar>0 | ile tur WSZYSTKIE warunki OK |');
  L('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  const perAi = [];
  for (const ai of aiIds) {
    const rows = vsPlayer.filter(g => g.me === ai);
    const rws = rows.map(r => r.rw);
    const scores = rows.map(r => r.score);
    const progS = rows[0].progSila, progA = rows[0].progAgresja, progR = rows[0].progRel;
    const okSila = rows.filter(r => r.rw >= r.progSila).length;
    const okAgr = rows.filter(r => r.effAgresja >= r.progAgresja).length;
    const okRel = rows.filter(r => r.score < r.progRel).length;
    const okWill = rows.filter(r => r.willWar > 0).length;
    const okAll = rows.filter(r => !r.stanWojny && !r.peaceLocked && !r.nap && r.willWar > 0
      && r.rw >= r.progSila && r.effAgresja >= r.progAgresja && r.score < r.progRel).length;
    perAi.push({ ai, n: rows.length, rwMin: Math.min(...rws), rwMed: med(rws), rwMax: Math.max(...rws),
      progSila: progS, okSila, effAgresja: rows[0].effAgresja, progAgresja: progA, okAgr,
      scoreMed: med(scores), progRel: progR, okRel, okWill, okAll });
    L('| ' + ai + ' | ' + rows.length + ' | ' + f3(Math.min(...rws)) + ' | ' + f3(med(rws)) + ' | ' + f3(Math.max(...rws))
      + ' | ' + f3(progS) + ' | ' + okSila + ' | ' + f3(rows[0].effAgresja) + ' | ' + f3(progA) + ' | ' + okAgr
      + ' | ' + f3(med(scores)) + ' | ' + progR + ' | ' + okRel + ' | ' + okWill + ' | **' + okAll + '** |');
  }
  S.perAiVsPlayer = perAi;
  L('');
  if (vsPlayer.length > 0) {
    const allRw = vsPlayer.map(g => g.rw);
    S.rwVsPlayer = { n: allRw.length, min: Math.min(...allRw), median: med(allRw), max: Math.max(...allRw),
      overThreshold: vsPlayer.filter(g => g.rw >= g.progSila).length };
    L('**Rozkład `respektWzgledny` AI-vs-gracz (wszystkie AI, wszystkie tury, ziarno ' + seed + '):** '
      + 'n=' + allRw.length + ' · min=' + f3(Math.min(...allRw)) + ' · mediana=' + f3(med(allRw))
      + ' · max=' + f3(Math.max(...allRw)) + ' · liczba odczytów >= progu siły: ' + S.rwVsPlayer.overThreshold);
  } else {
    S.rwVsPlayer = null;
    L('**BRAK DOWODU dla rozkładu `respektWzgledny` AI-vs-gracz: 0 rekordów** — żadne AI nie miało gracza '
      + 'w `relacje` przekazanych do `decideAIDiplomacy` (patrz gate `diplomaticallyDiscoveredOwners` w main.ts).');
  }
  L('');
  // rozbicie: który warunek blokował, licząc KAŻDY niespełniony
  const blockCount = { stanWojny: 0, peaceLocked: 0, nap: 0, willWar0: 0, rwPonizejProgu: 0, agresjaPonizejProgu: 0, scoreZaWysoki: 0 };
  for (const g of vsPlayer) {
    if (g.stanWojny) blockCount.stanWojny++;
    if (g.peaceLocked) blockCount.peaceLocked++;
    if (g.nap) blockCount.nap++;
    if (!(g.willWar > 0)) blockCount.willWar0++;
    if (!(g.rw >= g.progSila)) blockCount.rwPonizejProgu++;
    if (!(g.effAgresja >= g.progAgresja)) blockCount.agresjaPonizejProgu++;
    if (!(g.score < g.progRel)) blockCount.scoreZaWysoki++;
  }
  S.blockCountVsPlayer = blockCount;
  // Sprzecznosc konstrukcyjna: relacja z GRACZEM ma respekt = round(100*rw), wiec
  // score = zaufanie + respekt >= 100*rw. Brama wymaga jednoczesnie rw>=progSila i score<progRel.
  const bothOk = vsPlayer.filter(g => g.rw >= g.progSila && g.score < g.progRel).length;
  const diffs = vsPlayer.map(g => g.score - 100 * g.rw);
  S.kontradykcja = {
    ocen: vsPlayer.length,
    rwNadProgiem: vsPlayer.filter(g => g.rw >= g.progSila).length,
    scorePodProgiem: vsPlayer.filter(g => g.score < g.progRel).length,
    obaJednoczesnie: bothOk,
    minScoreMinus100Rw: diffs.length ? Math.min(...diffs) : null,
    maxScoreMinus100Rw: diffs.length ? Math.max(...diffs) : null,
    progSilaMin: vsPlayer.length ? Math.min(...vsPlayer.map(g => g.progSila)) : null,
    progRelMax: vsPlayer.length ? Math.max(...vsPlayer.map(g => g.progRel)) : null,
  };
  L('**Test sprzeczności konstrukcyjnej (AI → gracz):** `respekt` w relacji z graczem jest ustawiany jako '
    + '`computeRespekt(potAI, potPlr) = round(100·rw)` (main.ts), a `score = zaufanie + respekt`, '
    + 'więc `score >= 100·rw`. Brama wymaga JEDNOCZEŚNIE `rw >= progSila` i `score < progRel`.');
  L('');
  L('| miara | wartość |');
  L('|---|---|');
  L('| ocen AI→gracz | ' + S.kontradykcja.ocen + ' |');
  L('| z tego `rw >= progSila` | ' + S.kontradykcja.rwNadProgiem + ' |');
  L('| z tego `score < progRel` | ' + S.kontradykcja.scorePodProgiem + ' |');
  L('| **oba warunki naraz** | **' + S.kontradykcja.obaJednoczesnie + '** |');
  L('| min(`score` − 100·`rw`) | ' + f3(S.kontradykcja.minScoreMinus100Rw) + ' |');
  L('| max(`score` − 100·`rw`) | ' + f3(S.kontradykcja.maxScoreMinus100Rw) + ' |');
  L('| min `progSila` | ' + f3(S.kontradykcja.progSilaMin) + ' · max `progRel` | ' + S.kontradykcja.progRelMax + ' |');
  L('');
  L('**Rozbicie na powód — ile z ' + vsPlayer.length + ' ocen (AI × tura) miało dany warunek NIESPEŁNIONY:**');
  L('');
  L('| warunek niespełniony | liczba ocen | % |');
  L('|---|---|---|');
  for (const [k, v] of Object.entries(blockCount)) {
    L('| ' + k + ' | ' + v + ' | ' + (vsPlayer.length ? (100 * v / vsPlayer.length).toFixed(1) : '—') + '% |');
  }
  L('');

  // AI vs AI dla porównania (agregat per tura + rekordy przechodzące CAŁĄ bramę)
  const agg = d.gatesVsAiAggByTurn || [];
  const passing = d.gatesVsAiPassing || [];
  if (agg.length > 0) {
    const n = agg.reduce((a, x) => a + x.n, 0);
    const rwMin = Math.min(...agg.map(x => x.rwMin));
    const rwMax = Math.max(...agg.map(x => x.rwMax));
    const rwAvg = agg.reduce((a, x) => a + x.rwSum, 0) / n;
    const over = agg.reduce((a, x) => a + x.rwOverProg, 0);
    const allOk = agg.reduce((a, x) => a + x.allOk, 0);
    S.vsAiAggregate = { n, rwMin, rwMax, rwAvg, rwOverProg: over, allOk,
      blkScore: agg.reduce((a, x) => a + x.blkScore, 0),
      blkAgresja: agg.reduce((a, x) => a + x.blkAgresja, 0),
      blkRw: agg.reduce((a, x) => a + x.blkRw, 0),
      blkWillWar0: agg.reduce((a, x) => a + x.blkWillWar0, 0),
      blkNap: agg.reduce((a, x) => a + x.blkNap, 0),
      blkStanWojny: agg.reduce((a, x) => a + x.blkStanWojny, 0),
      blkPeaceLocked: agg.reduce((a, x) => a + x.blkPeaceLocked, 0) };
    L('**Dla porównania — brama wojny AI-vs-AI (ten sam priorytet 4):** n=' + n + ' ocen · rw min='
      + f3(rwMin) + ' · średnia=' + f3(rwAvg) + ' · max=' + f3(rwMax) + ' · rw>=progu: ' + over
      + ' · **ocen z WSZYSTKIMI warunkami spełnionymi: ' + allOk + '**');
    L('');
    L('| warunek niespełniony (AI-vs-AI) | liczba ocen | % |');
    L('|---|---|---|');
    for (const [k, v] of Object.entries({ stanWojny: S.vsAiAggregate.blkStanWojny,
      peaceLocked: S.vsAiAggregate.blkPeaceLocked, nap: S.vsAiAggregate.blkNap,
      willWar0: S.vsAiAggregate.blkWillWar0, rwPonizejProgu: S.vsAiAggregate.blkRw,
      agresjaPonizejProgu: S.vsAiAggregate.blkAgresja, scoreZaWysoki: S.vsAiAggregate.blkScore })) {
      L('| ' + k + ' | ' + v + ' | ' + (100 * v / n).toFixed(1) + '% |');
    }
    L('');
    S.vsAiPassingSample = passing.slice(0, 20);
    if (passing.length > 0) {
      L('Rekordy AI-vs-AI przechodzące CAŁĄ bramę (pierwsze 20): ' + JSON.stringify(passing.slice(0, 20)));
      L('');
    }
  }

  // --- P3: przejmowanie miast-państw vs pierwsza wojna ---
  L('### P3 — przejmowanie miast-państw klastra a moment pierwszej wojny');
  L('');
  L('| tura | miast-państw żywych | miast AI (suma) | miast gracza | par w stanie wojny |');
  L('|---|---|---|---|---|');
  const p3 = [];
  for (const sn of d.snapshots) {
    const cs = sn.owners.filter(o => (o.clusterCityState || o.cityStateCopy) && !o.eliminated && o.cityCount > 0).length;
    const aiC = sn.owners.filter(o => o.ownerId > 0 && !o.barbarian && !(o.clusterCityState || o.cityStateCopy)).reduce((a, o) => a + o.cityCount, 0);
    const plC = sn.owners.filter(o => o.ownerId === 0).reduce((a, o) => a + o.cityCount, 0);
    p3.push({ turn: sn.turn, cs, aiC, plC, wars: sn.wars.length });
  }
  for (const r of p3) if (r.turn % 5 === 0 || r.turn <= 2) L('| ' + r.turn + ' | ' + r.cs + ' | ' + r.aiC + ' | ' + r.plC + ' | ' + r.wars + ' |');
  S.p3 = p3;
  L('');

  // --- Brama isOwnerClusterCityState: kiedy glowna cywilizacja AI przestaje sie kwalifikowac ---
  L('### Brama `!isOwnerClusterCityState(ownerId, ...)` w wyzwalaczu wojny Kamienia (main.ts:28025)');
  L('');
  L('| główna cywilizacja AI | `isOwnerClusterCityState` w turze 1 | pierwsza tura, w której staje się `true` | miast w tej turze | wartość w turze 20 (start mechanizmu) |');
  L('|---|---|---|---|---|');
  const flip = [];
  const mainIds = [...new Set(d.snapshots.flatMap(sn => sn.owners
    .filter(o => o.ownerId > 0 && !o.cityStateCopy && !o.barbarian).map(o => o.ownerId)))].sort((a, b) => a - b);
  for (const oid of mainIds) {
    const series = d.snapshots.map(sn => ({ turn: sn.turn, o: sn.owners.find(x => x.ownerId === oid) }))
      .filter(x => x.o);
    if (series.length === 0) continue;
    const t1 = series[0];
    const fl = series.find(x => x.o.clusterCityState);
    const t20 = series.find(x => x.turn === 20);
    const row = { ownerId: oid, atTurn1: t1.o.clusterCityState, flipTurn: fl ? fl.turn : null,
      citiesAtFlip: fl ? fl.o.cityCount : null, atTurn20: t20 ? t20.o.clusterCityState : null };
    flip.push(row);
    L('| ' + oid + ' | ' + (row.atTurn1 ? 'true' : 'false') + ' | ' + (row.flipTurn == null ? 'nigdy' : '**' + row.flipTurn + '**')
      + ' | ' + (row.citiesAtFlip == null ? '—' : row.citiesAtFlip) + ' | '
      + (row.atTurn20 == null ? '—' : (row.atTurn20 ? '**true → wykluczony**' : 'false')) + ' |');
  }
  S.clusterGuardFlip = flip;
  L('');

  // --- P5: widoczność dla gracza ---
  const warLogWar = (d.warLog || []).filter(e => /^war-/.test(e.id || ''));
  S.warLogEntries = (d.warLog || []).length;
  S.warLogWarEntries = warLogWar.length;
  S.warLogWarSample = warLogWar.slice(0, 5);
  L('### P5 — czy gracz w ogóle dostaje sygnał o wojnach');
  L('');
  L('| miara | wartość |');
  L('|---|---|');
  L('| wpisów w panelu Wydarzeń (`warEventLog`) łącznie | ' + S.warLogEntries + ' |');
  L('| z nich wpisów o wypowiedzeniu wojny (`war-*`) | ' + warLogWar.length + ' |');
  L('| par AI×AI w stanie wojny (z relacji) | ' + [...warFirst.keys()].filter(p => !p.startsWith('0x')).length + ' |');
  L('');

  if (d.turnTimings && d.turnTimings.length) {
    const ms = d.turnTimings.map(t => t.ms);
    S.turnMs = { min: Math.min(...ms), median: med(ms), max: Math.max(...ms) };
    L('Czas jednej tury [ms]: min=' + S.turnMs.min + ' · mediana=' + S.turnMs.median + ' · max=' + S.turnMs.max);
    L('');
  }
  summary.seeds.push(S);
}

const md = out.join('\n');
if (OUT_MD) fs.writeFileSync(path.resolve(OUT_MD), md, 'utf8');
fs.writeFileSync(path.join(IN, 'summary.json'), JSON.stringify(summary, null, 1), 'utf8');
console.log(md);
