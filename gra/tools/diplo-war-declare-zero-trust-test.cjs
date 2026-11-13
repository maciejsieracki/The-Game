'use strict';
/**
 * diplo-war-declare-zero-trust-test.cjs — R-WEB-DIPLO-WAR-DECLARE-ZERO-TRUST-Q1 (krok 3 z 4).
 *
 * Decyzje właściciela (2026-11-13):
 *  - AI wypowiada wojnę (priorytet 4) tylko gdy Zaufanie pary < 30 ORAZ siła militarna AI jest
 *    większa o co najmniej 20% (compareMilitaryStrength, NIE Power, NIE rw).
 *  - Charakter cywilizacji (effAgresja, willingnessWar) nadal decyduje, czy AI z tego skorzysta.
 *  - Hamulec zerowego Zaufania: po N kolejnych turach Zaufania = 0 wypowiada silniejsza strona
 *    wg siły militarnej (remis: większa armia, potem mniejszy id); gracz nigdy automatycznie (D7).
 *  - Ostrzeżenie dla gracza: jedno na epizod zerowego Zaufania (licznik === 1).
 *  - Wojna epoki, bramki R1/R2, karencja i blokady pokoju/paktu bez zmian.
 *
 * Sekcje (a)–(h) wg dispatchu:
 *  (a) Zaufanie 25, AI silniejsze o 25%  → wypowiedzenie przy gotowości AI
 *  (b) Zaufanie 25, AI silniejsze o 19%  → brak
 *  (c) AI słabsze o ponad 20%            → brak (także przy zaufaniu < 30)
 *  (d) Zaufanie 0 przez N tur            → wypowiada; N−1 tur → nie (N = 3..7)
 *  (e) Zaufanie 0, silniejszy gracz      → brak automatycznej wojny
 *  (f) Ostrzeżenie raz na epizod         → licznik === 1 tylko w pierwszej turze zera
 *  (g) Karencja / pakt / pokój blokują   → brak wypowiedzenia
 *  (h) Mutacje: stary próg rw / licznik relacji są wykrywalne (źródło + zachowanie)
 *
 * Run from gra/:  node tools/diplo-war-declare-zero-trust-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing (npm ci --ignore-scripts w gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const BUNDLE = path.resolve(__dirname, '.diplo-war-declare-zero-trust-bundle.cjs');
const entryFile = path.resolve(__dirname, '.diplo-war-declare-zero-trust-entry.ts');

fs.writeFileSync(entryFile, `
export { decideAIDiplomacy } from '../src/game/ai.ts';
export { compareMilitaryStrength, militaryBrakeOutcome, DEFAULT_MILITARY_STRENGTH_PARAMS } from '../src/game/diplomacy-military-strength.ts';
export { advanceCrisisCounter, crisisStepForPair } from '../src/game/diplomacy-tick-war-brake.ts';
export { PROG_WOJNA_ZAUFANIE } from '../src/game/diplomacy-war-peace-profile.ts';
`, 'utf8');

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

async function main() {
  await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
    loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
  });

  const {
    decideAIDiplomacy, compareMilitaryStrength, militaryBrakeOutcome, DEFAULT_MILITARY_STRENGTH_PARAMS,
    advanceCrisisCounter, crisisStepForPair, PROG_WOJNA_ZAUFANIE,
  } = require(BUNDLE);

  const wojny = (cmds) => cmds.filter(c => c.type === 'wypowiedz_wojne');

  // Relacja wrogiego partnera; AI silniejsze o `procent` (siła AI = partner × (1 + procent/100)).
  function input({ zaufanie = 25, aiSila = 125, partnerSila = 100, turn = 30, extra = {} } = {}) {
    return {
      myPlayerId: 'ai-1',
      myTypCywilizacji: 'grecy',
      agresja: 0.8,
      currentTurn: turn,
      relacje: [{
        partnerId: 'rzym-1',
        partnerTypCywilizacji: 'rzymianie',
        relation: { zaufanie, respekt: 5, status: 'neutralni' },
        respektWzgledny: 0.55,
        silaMilitarnaAI: { sila: aiSila, armiaPkt: aiSila },
        silaMilitarnaPartner: { sila: partnerSila, armiaPkt: partnerSila },
        stanWojny: false,
        peaceLocked: false,
        hasNapTreaty: false,
        ...extra,
      }],
    };
  }

  // Parametry z JSON (nie z kodu): próg Zaufania i próg przewagi militarnej.
  const warPeace = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'diplomacy-war-peace-params.json'), 'utf8'));
  const tick = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'diplomacy-tick-params.json'), 'utf8'));
  const mil = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'diplomacy-military-strength-params.json'), 'utf8'));

  // ---- (0) parametry ----
  console.log('(0) parametry z JSON');
  ok(PROG_WOJNA_ZAUFANIE === 30 && warPeace.wypowiedzenieZaufanie.progZaufaniaWojny === 30,
    `próg Zaufania do wypowiedzenia = 30 (JSON ${warPeace.wypowiedzenieZaufanie.progZaufaniaWojny})`);
  ok(DEFAULT_MILITARY_STRENGTH_PARAMS.progPrzewagiProc === 20 && mil.progPrzewagiProc.wartosc === 20,
    'próg przewagi siły militarnej = 20% (diplomacy-military-strength-params.json)');
  ok(tick.p6.kryzysProgZaufania === 0, 'hamulec zerowego Zaufania: p6.kryzysProgZaufania = 0');

  // ---- (a) ----
  console.log('(a) Zaufanie 25, AI silniejsze o 25% → wypowiedzenie przy gotowości AI');
  const a = decideAIDiplomacy(input({ zaufanie: 25, aiSila: 125 }), undefined, 1, 1, 'normal');
  ok(wojny(a).length === 1 && wojny(a)[0].targetId === 'rzym-1',
    `wypowiedz_wojne wobec rzym-1 (zmierzone: ${JSON.stringify(a.map(c => c.type))})`);

  // ---- (b) ----
  console.log('(b) Zaufanie 25, AI silniejsze o 19% → brak');
  const b = decideAIDiplomacy(input({ zaufanie: 25, aiSila: 119 }), undefined, 1, 1, 'normal');
  ok(wojny(b).length === 0, `brak wypowiedzenia (zmierzone: ${JSON.stringify(b.map(c => c.type))})`);
  const bExact = decideAIDiplomacy(input({ zaufanie: 25, aiSila: 120 }), undefined, 1, 1, 'normal');
  ok(wojny(bExact).length === 1, 'dokładnie +20% JEST przewagą (≥), wypowiedzenie');

  // ---- (c) ----
  console.log('(c) AI słabsze o ponad 20% → brak, także przy zaufaniu < 30');
  const c1 = decideAIDiplomacy(input({ zaufanie: 5, aiSila: 70, partnerSila: 100 }), undefined, 1, 1, 'normal');
  ok(wojny(c1).length === 0, `zaufanie 5, AI 70 vs 100 → brak (zmierzone: ${JSON.stringify(c1.map(c => c.type))})`);
  const c2 = decideAIDiplomacy(input({ zaufanie: 0, aiSila: 100, partnerSila: 100 }), undefined, 1, 1, 'normal');
  ok(wojny(c2).length === 0, 'zaufanie 0, równa siła → brak wypowiedzenia z priorytetu 4 (remis nie daje przewagi)');

  // ---- (d) ----
  console.log('(d) hamulec zerowego Zaufania: N kolejnych tur → wojna; N−1 → nie');
  const warP6 = { kryzysProgZaufania: tick.p6.kryzysProgZaufania, kryzysOstrzezenieTurPrzed: tick.p6.kryzysOstrzezenieTurPrzed };
  for (const n of [3, 4, 5, 6, 7]) {
    let counter = 0;
    let readyAt = -1;
    for (let t = 1; t <= n + 2; t++) {
      const step = advanceCrisisCounter(counter, 0, { ...warP6, kryzysTurDoWojny: n });
      counter = step.counter;
      if (step.warTriggerReady && readyAt < 0) readyAt = t;
    }
    ok(readyAt === n, `N=${n}: gotowość wojny w turze ${readyAt} (oczekiwano ${n})`);
    const before = advanceCrisisCounter(n - 2, 0, { ...warP6, kryzysTurDoWojny: n });
    ok(before.warTriggerReady === false, `N=${n}: N−1 tur zera → brak wypowiedzenia`);
  }
  // liczy się Zaufanie, nie Relacja: dodatnie Zaufanie zeruje licznik
  const reset = advanceCrisisCounter(3, 1, { ...warP6, kryzysTurDoWojny: 5 });
  ok(reset.counter === 0, 'Zaufanie > 0 zeruje licznik (histereza)');

  // ---- (e) ----
  console.log('(e) Zaufanie 0, silniejszy gracz → brak automatycznej wojny; AI o włos silniejsza → wojna');
  const isPlayer = (id) => id === '0';
  const eP = militaryBrakeOutcome({ id: '0', sila: 101, armiaPkt: 101 }, { id: '1', sila: 100, armiaPkt: 100 }, isPlayer);
  ok(eP.declarer === '0' && eP.mayDeclare === false, 'gracz silniejszy o włos: mayDeclare = false (D7)');
  const eA = militaryBrakeOutcome({ id: '0', sila: 100, armiaPkt: 100 }, { id: '1', sila: 101, armiaPkt: 101 }, isPlayer);
  ok(eA.declarer === '1' && eA.mayDeclare === true, 'AI silniejsza o włos (bez progu 20%): wypowiada');
  const eTie = militaryBrakeOutcome({ id: '2', sila: 100, armiaPkt: 50 }, { id: '1', sila: 100, armiaPkt: 40 }, isPlayer);
  ok(eTie.declarer === '2', 'remis siły → większa armia wypowiada');
  const eTieId = militaryBrakeOutcome({ id: '2', sila: 100, armiaPkt: 50 }, { id: '1', sila: 100, armiaPkt: 50 }, isPlayer);
  ok(eTieId.declarer === '1', 'remis siły i armii → mniejszy id wypowiada');
  const cmpOrder = compareMilitaryStrength({ id: '1', sila: 100, armiaPkt: 50 }, { id: '2', sila: 100, armiaPkt: 50 });
  const cmpRev = compareMilitaryStrength({ id: '2', sila: 100, armiaPkt: 50 }, { id: '1', sila: 100, armiaPkt: 50 });
  ok(cmpOrder.silniejszyId === cmpRev.silniejszyId, 'wynik remisu nie zależy od kolejności argumentów');

  // ---- (f) ----
  console.log('(f) ostrzeżenie raz na epizod zerowego Zaufania (licznik === 1)');
  const trustSeq = [0, 0, 0, 5, 0, 0];
  let cnt = 0;
  const warnings = [];
  trustSeq.forEach((z, i) => {
    const step = crisisStepForPair(cnt, z, false, { ...warP6, kryzysTurDoWojny: 5 });
    cnt = step.counter;
    if (cnt === 1) warnings.push(i);
  });
  ok(JSON.stringify(warnings) === JSON.stringify([0, 4]),
    `dwa epizody zera → dwa ostrzeżenia (w turach ${JSON.stringify(warnings)}), zero w środku epizodu`);

  // ---- (g) ----
  console.log('(g) karencja / rozejm / pakt / pokój blokują wypowiedzenie');
  const g1 = decideAIDiplomacy(input({ zaufanie: 5, extra: { peaceLocked: true } }), undefined, 1, 1, 'normal');
  ok(wojny(g1).length === 0, 'peaceLocked (rozejm/pokój) blokuje');
  const g2 = decideAIDiplomacy(input({ zaufanie: 5, extra: { hasNapTreaty: true } }), undefined, 1, 1, 'normal');
  ok(wojny(g2).length === 0, 'pakt o nieagresji blokuje');
  const g3 = decideAIDiplomacy(input({ zaufanie: 5, turn: 10 }), undefined, 1, 1, 'normal');
  ok(wojny(g3).length === 0, 'okno wczesnej fazy (tura 10, major vs major) blokuje');
  const g4 = decideAIDiplomacy(input({ zaufanie: 5, extra: { stanWojny: true } }), undefined, 1, 1, 'normal');
  ok(wojny(g4).length === 0, 'stan wojny: priorytet 4 nie wypowiada ponownie');

  // ---- (h) ----
  console.log('(h) mutacje: stary próg rw i licznik relacji są wykrywalne');
  const SRC = (rel) => fs.readFileSync(path.resolve(GRA, 'src', rel), 'utf8');
  const AI = SRC('game/ai.ts');
  const MAIN = SRC('main.ts');
  ok(!AI.includes('rw >= effProgWojnaSila'), 'ai.ts: brak starego progu siły względnej rw w bramce wojny');
  ok(!AI.includes('score < progMinimalnyRelacja'), 'ai.ts: brak starego warunku Relacji < progMinimalnyRelacja');
  ok(AI.includes('< PROG_WOJNA_ZAUFANIE') && AI.includes("compareMilitaryStrength(milAiSide, milPartnerSide).przewaga === 'A'"),
    'ai.ts: bramka = Zaufanie < PROG_WOJNA_ZAUFANIE + przewaga militarna AI');
  ok(MAIN.includes('const zaufanie = getDiploRelation(a, b).zaufanie;') && !MAIN.includes('const zaufanie = relationScore('),
    'main.ts: licznik kryzysu czyta Zaufanie pary');
  ok(MAIN.includes('diploMilitaryBrakeOutcome(sa, sb)') && MAIN.includes('diploMilitaryBrakeOutcome(e.ownerA, e.ownerB)'),
    'main.ts: kolejka wojen i ostrzeżenie używają siły militarnej (diploMilitaryBrakeOutcome)');
  ok(!MAIN.includes('brakeWarOutcome(') && !MAIN.includes('objectivePowerForOwner(sa) }'),
    'main.ts: hamulec nie używa już Power (brakeWarOutcome usunięte z kolejki)');
  // mutacja zachowaniowa: przywrócenie starego progu rw (0.6) zmieniłoby wynik sekcji (b)
  const mutRw = decideAIDiplomacy(input({ zaufanie: 25, aiSila: 119 }), { progWojnaSila: 0.1 }, 1, 1, 'normal');
  ok(wojny(mutRw).length === 0, 'obniżony próg rw nie otwiera wypowiedzenia bez przewagi militarnej (rw nie steruje)');

  console.log(`\ndiplo-war-declare-zero-trust-test: ${pass} OK, ${fail} FAIL`);
  try { fs.unlinkSync(entryFile); } catch { /* ignore */ }
  try { fs.unlinkSync(BUNDLE); } catch { /* ignore */ }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
