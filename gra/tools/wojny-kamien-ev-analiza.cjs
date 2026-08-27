'use strict';
/**
 * wojny-kamien-ev-analiza.cjs — redukcja zrzutow harnessu Evaluatora do tabel.
 * TEMAT: P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1
 *
 * Wejscie: pliki <tag>-seed-<n>.json z tools/wojny-kamien-ev.cjs
 * Wyjscie: markdown na stdout + summary JSON (--json <plik>)
 */
const fs = require('fs');
const path = require('path');

const argOf = (f, d) => { const i = process.argv.indexOf(f); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const IN = argOf('--in', '/tmp/ev-out');
const JSON_OUT = argOf('--json', null);
const files = process.argv.slice(2).filter(a => a.endsWith('.json') && fs.existsSync(a));
const list = files.length > 0 ? files
  : fs.readdirSync(IN).filter(f => f.endsWith('.json')).map(f => path.join(IN, f)).sort();

const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const out = [];
const summary = [];

for (const f of list) {
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (d.partial) { out.push(`\n> ${path.basename(f)} — plik CZASTKOWY (przebieg nieukonczony)\n`); }
  const snaps = d.snaps || [];
  if (snaps.length === 0) continue;
  const S = { file: path.basename(f), seed: d.seed, tag: d.tag, params: d.params,
    turnsRun: snaps[snaps.length - 1].t, elapsedS: d.elapsedS, notes: d.notes };

  // --- 1. WOJNY: diff macierzy relacji miedzy turami ---
  const decl = [];
  for (let i = 1; i < snaps.length; i++) {
    const prev = new Set(snaps[i - 1].warPairs);
    for (const k of snaps[i].warPairs) {
      if (!prev.has(k)) {
        const [a, b] = k.split('_').map(Number);
        decl.push({ turn: snaps[i].t, pair: k,
          withPlayer: a === 0 || b === 0,
          forcedStone: snaps[i].stoneActive.includes(k),
          forcedBronze: snaps[i].bronzeActive.includes(k) });
      }
    }
  }
  const ended = [];
  for (let i = 1; i < snaps.length; i++) {
    const cur = new Set(snaps[i].warPairs);
    for (const k of snaps[i - 1].warPairs) if (!cur.has(k)) ended.push({ turn: snaps[i].t, pair: k });
  }
  S.warDeclarations = decl;
  S.warEndings = ended;
  S.warsAtEnd = snaps[snaps.length - 1].warPairs;
  S.warsWithPlayer = decl.filter(x => x.withPlayer).length;
  S.warsAiAi = decl.filter(x => !x.withPlayer).length;
  S.forcedStoneWars = decl.filter(x => x.forcedStone).length;

  // --- 2. MECHANIZM WYMUSZONEJ WOJNY KAMIENIA ---
  const firstPending = {}; const firstCycle = {};
  let anyPendingTurn = null, anyStoneActiveTurn = null;
  for (const s of snaps) {
    for (const o of s.stonePending) if (firstPending[o] == null) firstPending[o] = s.t;
    for (const o of s.stoneCycle) if (firstCycle[o] == null) firstCycle[o] = s.t;
    if (anyPendingTurn == null && s.stonePending.length > 0) anyPendingTurn = s.t;
    if (anyStoneActiveTurn == null && s.stoneActive.length > 0) anyStoneActiveTurn = s.t;
  }
  S.stone = { firstPending, firstCycle, anyPendingTurn, anyStoneActiveTurn,
    pendingAtEnd: snaps[snaps.length - 1].stonePending,
    stoneActiveAtEnd: snaps[snaps.length - 1].stoneActive };

  // --- 3. KLASYFIKATOR MIASTO-PANSTWO (bramka !isOwnerClusterCityState) ---
  // "Glowna cywilizacja AI" = owner nie bedacy kopia typu ani uproszczonym na starcie.
  const first = snaps[0];
  const mainAi = first.owners.filter(o => o.o > 0 && !o.typCopy && !o.simpl).map(o => o.o);
  const csFlip = {};
  const cityCountAtFlip = {};
  for (const s of snaps) {
    for (const o of s.owners) {
      if (!mainAi.includes(o.o)) continue;
      if (o.isCS && csFlip[o.o] == null) { csFlip[o.o] = s.t; cityCountAtFlip[o.o] = o.cities; }
    }
  }
  const last = snaps[snaps.length - 1];
  S.mainAi = mainAi;
  S.mainAiCsFlipTurn = csFlip;
  S.mainAiCitiesAtFlip = cityCountAtFlip;
  S.mainAiStillNotCsAtEnd = last.owners.filter(o => mainAi.includes(o.o) && !o.isCS && !o.elim).map(o => o.o);

  // --- 3b. KONSOLIDACJA KLASTROW (hipoteza wlasciciela: "najpierw przejmuja swoje MP") ---
  // Liczba wlascicieli posiadajacych choc jedno miasto ze znacznikiem startCityState.
  const csOwnersSeries = snaps.map(s2 => ({
    t: s2.t,
    csOwners: s2.owners.filter(o => o.csCities > 0).length,
    origCsOwners: s2.owners.filter(o => o.csCities > 0 && !mainAi.includes(o.o)).length,
  }));
  let stabilizedAt = null;
  for (let i = 0; i < csOwnersSeries.length; i++) {
    const v = csOwnersSeries[i].origCsOwners;
    if (csOwnersSeries.slice(i).every(x => x.origCsOwners === v)) { stabilizedAt = csOwnersSeries[i].t; break; }
  }
  S.konsolidacja = { seria: csOwnersSeries, stabilizacjaOdTury: stabilizedAt,
    origCsStart: csOwnersSeries[0].origCsOwners, origCsKoniec: csOwnersSeries[csOwnersSeries.length - 1].origCsOwners };

  // --- 3c. WOJNY WG `countActiveWarsForOwner` (druga, niezalezna miara od macierzy) ---
  S.maxActiveWarsAnyOwner = Math.max(...snaps.map(s2 => Math.max(0, ...s2.owners.map(o => o.wars))));

  // --- 4. BRAMA AI -> GRACZ (od strony STANU: respekt = round(100*rw), score = zaufanie+respekt) ---
  const rws = []; let nObs = 0, nRwOverProg = 0, nScoreUnder30 = 0, nBoth = 0;
  let minScoreMinusRespekt = Infinity;
  let skippedUndiscovered = 0;
  for (const s of snaps) {
    const disc = new Set(s.discovered);
    for (const p of s.playerPairs) {
      if (p.s === 'wojna') continue;
      // Respekt pary 0_x jest przeliczany (main.ts computeRespekt) TYLKO dla AI odkrytych
      // przez gracza — dla reszty w mapie siedzi wartosc domyslna, wiec nie jest pomiarem.
      if (!disc.has(p.o)) { skippedUndiscovered++; continue; }
      nObs++;
      const rw = (p.r || 0) / 100;
      rws.push(rw);
      const okRw = rw >= 0.6;              // PROG_WOJNA_SILA (bez modyfikatorow trudnosci)
      const okScore = p.score < 30;        // progMinimalnyRelacja
      if (okRw) nRwOverProg++;
      if (okScore) nScoreUnder30++;
      if (okRw && okScore) nBoth++;
      const gap = p.score - (p.r || 0);    // = zaufanie (>= 0 zawsze)
      if (gap < minScoreMinusRespekt) minScoreMinusRespekt = gap;
    }
  }
  S.playerGate = { obs: nObs, pominietoNieodkrytych: skippedUndiscovered, rwMin: rws.length ? Math.min(...rws) : null,
    rwMed: med(rws), rwMax: rws.length ? Math.max(...rws) : null,
    rwOverProg: nRwOverProg, scoreUnder30: nScoreUnder30, bothConditions: nBoth,
    minZaufanie: minScoreMinusRespekt === Infinity ? null : minScoreMinusRespekt };

  // --- 5. WARSTWA DYPLOMACJI + census komend ---
  const c = d.cmd || { byTurn: [], warRecords: [], total: 0 };
  let lf = 0, ls = 0, lp = 0, rawW = 0, keptW = 0, rawWP = 0, keptWP = 0;
  for (const t of c.byTurn) { lf += t.layerFull; ls += t.layerSimpl; lp += t.layerPre;
    rawW += t.rawWarTotal; keptW += t.keptWarTotal; rawWP += t.rawWarVsPlayer; keptWP += t.keptWarVsPlayer; }
  S.layers = { records: c.total, full: lf, simplified: ls, pre_contact: lp,
    rawWarCmds: rawW, keptWarCmds: keptW, rawWarVsPlayer: rawWP, keptWarVsPlayer: keptWP,
    warRecords: c.warRecords };

  // --- 6. CO WIDZI GRACZ (punkt 5 dispatchu) ---
  const evIds = new Set(); const evAll = [];
  for (const s of snaps) for (const e of s.warEvents) if (!evIds.has(e.id)) { evIds.add(e.id); evAll.push({ t: s.t, ...e }); }
  const panelOther = new Set(); const panelOtherAll = [];
  for (const s of snaps) for (const w of s.panelWarsBetweenOthers) {
    const k = w.civA + '|' + w.civB; if (!panelOther.has(k)) { panelOther.add(k); panelOtherAll.push({ t: s.t, ...w }); }
  }
  S.playerVisible = {
    warEventCards: evAll.filter(e => e.kind === 'enemy' || /wojn/i.test(e.title || '')),
    allEventCards: evAll.length,
    panelWarsWithPlayerAtEnd: last.panelWarsWithPlayer,
    panelWarsBetweenOthersEver: panelOtherAll,
    discoveredFirst: snaps[0].discovered, discoveredLast: last.discovered,
    ownersTotal: last.owners.length,
  };

  summary.push(S);

  // --- markdown ---
  out.push(`\n## ${S.file} — ziarno ${S.seed}, tag \`${S.tag}\`, tur ${S.turnsRun}, ${S.elapsedS}s`);
  out.push(`params: ${JSON.stringify(S.params)}`);
  out.push(`\n**Wojny (diff macierzy \`diplomacyRelations\`):** wypowiedzen ${decl.length} `
    + `(z graczem ${S.warsWithPlayer}, AI↔AI ${S.warsAiAi}, wymuszonych Kamienia ${S.forcedStoneWars}); `
    + `zakonczen ${ended.length}; w stanie wojny na koniec: ${JSON.stringify(S.warsAtEnd)}`);
  if (decl.length) {
    out.push('\n| tura | para | z graczem | wymuszona Kamien | wymuszona Braz |\n|---|---|---|---|---|');
    for (const x of decl) out.push(`| ${x.turn} | ${x.pair} | ${x.withPlayer ? 'TAK' : 'nie'} | ${x.forcedStone ? 'TAK' : 'nie'} | ${x.forcedBronze ? 'TAK' : 'nie'} |`);
  }
  out.push(`\n**Mechanizm Kamienia:** pierwsza tura z niepustym \`stoneForceWarPendingOwners\`: `
    + `${S.stone.anyPendingTurn == null ? '**NIGDY**' : S.stone.anyPendingTurn}; `
    + `pierwsza tura z \`stoneForceWarActiveByPairKey\`: ${S.stone.anyStoneActiveTurn == null ? '**NIGDY**' : S.stone.anyStoneActiveTurn}`);
  out.push(`\n**Bramka \`!isOwnerClusterCityState\`:** glownych AI na starcie: ${mainAi.length} (${mainAi.join(', ')}). `
    + `Nadal NIE-miasto-panstwo na koniec: ${S.mainAiStillNotCsAtEnd.length} (${S.mainAiStillNotCsAtEnd.join(', ') || 'brak'}).`);
  out.push('\n| owner | tura przeskoku na "miasto-panstwo" | miast w tej turze |\n|---|---|---|');
  for (const o of mainAi) out.push(`| ${o} | ${csFlip[o] == null ? 'nigdy' : csFlip[o]} | ${cityCountAtFlip[o] == null ? '-' : cityCountAtFlip[o]} |`);
  out.push(`\n**Konsolidacja klastrow:** wlascicieli z miastem \`startCityState\` (bez glownych AI): `
    + `${S.konsolidacja.origCsStart} → ${S.konsolidacja.origCsKoniec}; stabilizacja od tury `
    + `${S.konsolidacja.stabilizacjaOdTury == null ? '—' : S.konsolidacja.stabilizacjaOdTury}. `
    + `Max \`countActiveWarsForOwner\` u dowolnego ownera w calym przebiegu: **${S.maxActiveWarsAnyOwner}**.`);
  out.push(`\n**Brama AI→gracz (ze stanu, tylko AI ODKRYTE przez gracza):** obserwacji ${S.playerGate.obs} `
    + `(pominieto ${S.playerGate.pominietoNieodkrytych} odczytow par z AI nieodkrytym — dla nich silnik nie przelicza respektu); `
    + `rw min/mediana/max = ${S.playerGate.rwMin} / ${S.playerGate.rwMed} / ${S.playerGate.rwMax}; `
    + `rw>=0,6: ${S.playerGate.rwOverProg}; score<30: ${S.playerGate.scoreUnder30}; **oba naraz: ${S.playerGate.bothConditions}**; `
    + `min(zaufanie)=${S.playerGate.minZaufanie}`);
  out.push(`\n**Warstwa dyplomacji (census komend na granicy main.ts):** rekordow ${S.layers.records}; `
    + `full ${S.layers.full} / simplified ${S.layers.simplified} / **pre_contact ${S.layers.pre_contact}**; `
    + `komend \`wypowiedz_wojne\`: surowych ${S.layers.rawWarCmds} (w gracza ${S.layers.rawWarVsPlayer}), `
    + `po filtrze warstwy ${S.layers.keptWarCmds} (w gracza ${S.layers.keptWarVsPlayer})`);
  out.push(`\n**Co widzi gracz:** kart Wydarzen o wojnie: ${S.playerVisible.warEventCards.length}; `
    + `wojny AI↔AI widoczne w panelu dyplomacji (kiedykolwiek): ${S.playerVisible.panelWarsBetweenOthersEver.length}; `
    + `odkrytych nacji: ${S.playerVisible.discoveredLast.length}/${S.playerVisible.ownersTotal} `
    + `(${JSON.stringify(S.playerVisible.discoveredLast)})`);
  if (S.notes && S.notes.length) out.push(`\n**Noty przebiegu:** ${JSON.stringify(S.notes)}`);
}

console.log(out.join('\n'));
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ generated: new Date().toISOString(), seeds: summary }, null, 1), 'utf8');
