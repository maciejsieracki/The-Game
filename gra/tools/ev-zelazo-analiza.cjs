'use strict';
/**
 * ev-zelazo-analiza.cjs — analiza zrzutów z `ev-zelazo-pomiar.cjs` (Evaluator,
 * R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1). Liczy WYŁĄCZNIE z zapisanych zrzutów, bez gry.
 *
 * Sprawdza niezależnie:
 *  K4  — wypowiedzenia wojny Żelaza w turze awansu (powod zawiera R-EPOKA-ZELAZO)
 *  K5  — gracz (ownerId 0), miasta-państwa, kopie typu i barbarzyńcy NIGDY nie są
 *        celem ani napastnikiem wymuszonej wojny Żelaza; ani razu w puli kandydatów
 *  WYZWALACZ — czy awans do epoki 3 uzbraja ironForceWarPendingOwners i z jakiego prev
 *
 * Uruchomienie: node tools/ev-zelazo-analiza.cjs <katalog-ze-zrzutami>
 */
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(process.argv[2] || '.');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && !f.startsWith('partial-')).sort();
const IRON_RE = /R-EPOKA-ZELAZO-WYMUSZONA-WOJNA/;

const out = [];
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  // UWAGA: `clusterCityState` jest DYNAMICZNE (wada Z1 — przed odblokowaniem majorzy też
  // wychodzą na miasta-państwa), więc do sprawdzenia puli używamy WYŁĄCZNIE trwałych
  // klasyfikacji: `csCopy` (typCityCopyOwners) i `simplified` (simplifiedDiplomacyOwners),
  // które nie zmieniają się w trakcie rozgrywki. Dynamiczne Z1 raportujemy osobno.
  const csIds = new Set();
  const barbIds = new Set();
  const z1DynamicIds = new Set();
  for (const snap of j.snapshots.concat([j.finalAudit])) {
    for (const o of snap.owners) {
      if (o.csCopy || o.simplified) csIds.add(o.ownerId);
      if (o.clusterCityState) z1DynamicIds.add(o.ownerId);
      if (o.barbarian) barbIds.add(o.ownerId);
    }
  }
  const ironDows = j.dows.filter(d => IRON_RE.test(d.powod));
  const allDows = j.dows;

  // K5 — naruszenia liczone NA MOMENT wypowiedzenia (klasyfikacja zapisana w rekordzie).
  const k5 = [];
  for (const d of ironDows) {
    if (d.attackerId === 0) k5.push({ kind: 'gracz-napastnikiem', d });
    if (d.targetId === 0) k5.push({ kind: 'gracz-celem', d });
    if (d.attackerIsCityState || d.attackerIsCsCopy) k5.push({ kind: 'MP-napastnikiem', d });
    if (d.targetIsCityState || d.targetIsCsCopy) k5.push({ kind: 'MP-celem', d });
    if (d.attackerIsBarb) k5.push({ kind: 'barbarzynca-napastnikiem', d });
    if (d.targetIsBarb) k5.push({ kind: 'barbarzynca-celem', d });
  }
  // K5 — pula kandydatów nigdy nie zawiera gracza ani znanego MP/barbarzyńcy.
  const candViolations = [];
  const candUnion = new Set();
  for (const c of j.cands) {
    for (const oid of c.candidates) {
      candUnion.add(oid);
      if (oid === 0) candViolations.push({ turn: c.turn, ownerId: c.ownerId, oid, kind: 'gracz-w-puli' });
      if (csIds.has(oid)) candViolations.push({ turn: c.turn, ownerId: c.ownerId, oid, kind: 'MP-w-puli' });
      if (barbIds.has(oid)) candViolations.push({ turn: c.turn, ownerId: c.ownerId, oid, kind: 'barb-w-puli' });
    }
  }

  // WYZWALACZ — wejścia do epoki 3 i czy uzbroiły rejestr.
  const entries = j.eras.filter(e => e.prev < 3 && e.next >= 3);
  const armedOk = entries.filter(e => e.ironArmed).length;
  const prevHist = {};
  for (const e of entries) prevHist['prev=' + e.prev + '->next=' + e.next] = (prevHist['prev=' + e.prev + '->next=' + e.next] || 0) + 1;
  const wouldMissStrict = entries.filter(e => !(e.prev === 2 && e.next === 3)).length;

  out.push({
    plik: f,
    label: j.label,
    seed: j.seed,
    baseline: j.baseline,
    unblock: j.unblock,
    tury: j.snapshots.length,
    sekundy: j.elapsedS,
    dzwigniaTura: j.lever ? j.lever.turn : null,
    dzwigniaEpoki: j.lever ? j.lever.result.map(r => r.ownerId + ':' + r.eraBefore + '->' + r.eraAfter) : null,
    ironPendingPoDzwigni: j.lever ? j.lever.ironAfter.pending : null,
    odblokowanie: j.unblockInfo
      ? { tura: j.unblockInfo.turn, odkryto: j.unblockInfo.met, skasowanoFlagMP: j.unblockInfo.clearedCsFlags.length }
      : null,
    rekordowAwansu: j.eras.length,
    wejscDoZelaza: entries.length,
    wejscUzbrojonych: armedOk,
    rozkladPrevNext: prevHist,
    wejscKtoreZgubilbySztywny2do3: wouldMissStrict,
    wszystkichWypowiedzen: allDows.length,
    wypowiedzenZelaza: ironDows.map(d => ({
      tura: d.turn, napastnik: d.attackerId, cel: d.targetId,
      epokaNapastnika: d.attackerEra, epokaCelu: d.targetEra, warstwa: d.dipLayer,
    })),
    wypowiedzenInne: allDows.filter(d => !IRON_RE.test(d.powod))
      .map(d => ({ tura: d.turn, napastnik: d.attackerId, cel: d.targetId, powod: d.powod.slice(0, 70) })),
    unieKandydatow: Array.from(candUnion).sort((a, b) => a - b),
    ownerzyMP_trwale: Array.from(csIds).sort((a, b) => a - b),
    ownerzyZ1_dynamicznie: Array.from(z1DynamicIds).sort((a, b) => a - b).length,
    majorzyKtorychZ1DotknelPrzedOdblokowaniem: (j.snapshots[0] ? j.snapshots[0].owners : [])
      .filter(o => o.clusterCityState && !o.csCopy && !o.simplified).map(o => o.ownerId),
    ownerzyBarb: Array.from(barbIds).sort((a, b) => a - b),
    naruszeniaK5: k5,
    naruszeniaPuliK5: candViolations,
    parYZelazaNaKoniec: j.finalIronState.activePairs.map(p => p[0]),
    wojnyNaKoniec: j.finalAudit.wars,
    konsola: j.consoleLines.filter(l => IRON_RE.test(l)),
  });
}

console.log(JSON.stringify(out, null, 1));
