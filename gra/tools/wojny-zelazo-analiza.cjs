'use strict';
/**
 * wojny-zelazo-analiza.cjs — redukcja surowych zrzutów `wojny-zelazo-audyt.cjs`
 * do liczb, które odpowiadają na kryteria końca 4 i 5 dispatchu
 * R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1.
 *
 * Uruchomienie (z gra/): node tools/wojny-zelazo-analiza.cjs <katalog-z-jsonami>
 */
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(process.argv[2] || '/tmp/zelazo-out');
const files = fs.readdirSync(DIR).filter(f => /^(PRZED|PO|PILOT|STOCK)-seed-\d+\.json$/.test(f)).sort();
if (files.length === 0) {
  console.error('Brak plików pomiarowych w ' + DIR);
  process.exit(1);
}

const summary = [];
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const acc = j.acceleratorApplied;
  // Owner-rekordy z epoką 3 (Żelazo) — ile ich jest i czy mechanizm coś dla nich zrobił.
  const ironEpochRecs = j.owners.filter(o => o.epoch >= 3);
  const withIronTarget = j.owners.filter(o => o.ironTarget != null);
  const pendingEver = new Set();
  for (const o of j.owners) for (const p of o.ironPending) pendingEver.add(p);
  const cycleEver = new Set();
  for (const o of j.owners) for (const c of o.ironCycle) cycleEver.add(c);
  const layers = {};
  for (const o of j.owners) layers[o.dipLayer] = (layers[o.dipLayer] || 0) + 1;

  // Kryterium 5: gracz (0) i miasta-państwa NIGDY jako cel ani napastnik.
  const candTargets = new Set();
  for (const c of j.ironCand) for (const t of c.candidates) candTargets.add(t);
  const violations = [];
  if (candTargets.has(0)) violations.push('gracz (ownerId 0) w puli kandydatów');
  for (const c of j.ironCand) {
    if (c.ownerId === 0) violations.push('gracz jako napastnik (pula liczona dla ownerId 0)');
  }
  for (const w of j.ironWars) {
    if (w.targetId === 0) violations.push(`DOW na gracza w turze ${w.turn}`);
    if (w.attackerId === 0) violations.push(`gracz jako napastnik w turze ${w.turn}`);
    if (w.targetIsCityState) violations.push(`miasto-państwo jako CEL w turze ${w.turn} (AI${w.targetId})`);
    if (w.attackerIsCityState) violations.push(`miasto-państwo jako NAPASTNIK w turze ${w.turn} (AI${w.attackerId})`);
    if (w.attackerEpoch < 3) violations.push(`napastnik poza Żelazem w turze ${w.turn} (epoka ${w.attackerEpoch})`);
  }
  // Owner-rekordy: czy owner z ironTarget był kiedykolwiek miastem-państwem?
  for (const o of withIronTarget) {
    if (o.isCityState) violations.push(`miasto-państwo dostało cel Żelaza w turze ${o.turn} (AI${o.ownerId})`);
  }

  const row = {
    plik: f,
    label: j.label,
    seed: j.seed,
    tury: j.snapshots.length,
    sekundy: j.elapsedS,
    akceleratorTura: acc ? acc.turn : null,
    akceleratorOwners: acc ? acc.owners : [],
    ironPendingPoAkceleratorze: acc ? acc.ironAfter.pending : [],
    ownerRekordow: j.owners.length,
    rekordowZEpokaZelaza: ironEpochRecs.length,
    warstwyDyplomacji: layers,
    ownerzyZCelemZelaza: [...new Set(withIronTarget.map(o => o.ownerId))],
    pendingKiedykolwiek: [...pendingEver],
    cycleKiedykolwiek: [...cycleEver],
    wypowiedzeniWojnyZelaza: j.ironWars.map(w => ({
      tura: w.turn, napastnik: w.attackerId, cel: w.targetId,
      epokaNapastnika: w.attackerEpoch, epokaCelu: w.targetEpoch,
    })),
    aktywneParyNaKoniec: j.finalIronState.activePairs.map(p => p[0]),
    konsolaWymuszonaZelazo: j.consoleLines.filter(l => /ZELAZO-WYMUSZONA-WOJNA/.test(l)),
    konsolaWymuszonaKamienBraz: j.consoleLines.filter(l => /(KAMIEN|BRAZU)-WYMUSZONA-WOJNA/.test(l)),
    wojnyNaKoniec: j.finalState.wars,
    naruszeniaKryterium5: [...new Set(violations)],
  };
  summary.push(row);
  console.log('\n================ ' + f + ' ================');
  console.log(JSON.stringify(row, null, 2));
}

fs.writeFileSync(path.join(DIR, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
console.log('\nZapisano ' + path.join(DIR, 'summary.json'));
