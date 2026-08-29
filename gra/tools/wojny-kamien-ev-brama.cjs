'use strict';
/**
 * wojny-kamien-ev-brama.cjs — wyczerpujace sprawdzenie SPELNIALNOSCI bramy
 * `wypowiedz_wojne` AI -> GRACZ (P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1).
 *
 * TO NIE JEST POMIAR ROZGRYWKI — to sprawdzenie arytmetyczne nad stalymi
 * odczytanymi ze ZRODLA (rzad 2 hierarchii zrodel, §13a). Kazda stala ma
 * przy sobie plik:linia. Pomiar rozgrywki robi `wojny-kamien-ev.cjs`.
 *
 * Brama (ai.ts:4377-4386):
 *   !stanWojny && !peaceLocked && !hasNapTreaty && willingnessWar > 0
 *   && rw >= effProgWojnaSila && effAgresja >= effProgWojnaAgresja
 *   && score < progMinimalnyRelacja
 *
 * Dla PARY Z GRACZEM silnik wymusza (main.ts:27615, :27618, :27644, :27647):
 *   respekt = clamp(round(100 * rw), 0, 100)      // computeRespekt, diplomacy.ts:1586-1593
 *   zaufanie = clamp(..., 0, 100)                 // tickDiplomacy, diplomacy.ts:1738
 *   score    = clamp(zaufanie + respekt, 0, 200)  // relationScore, diplomacy.ts:791-798
 *                                                 // mnozniki = 1 (diplomacy.ts:183-184)
 * czyli score >= respekt >= round(100*rw) — respekt NIE jest niezalezny od rw.
 */
const PROG_WOJNA_SILA = 0.6;                 // ai.ts:3664 + data/ai-params.json:298
const PROG_MIN_RELACJA_BASE = 30;            // diplomacy.ts:172 + data/diplomacy.json params.progMinimalnyRelacja
const DIFF_DELTA = { easy: -10, normal: 0, hard: 10 };   // diplomacy.ts:471-475
const PODBOJ_BOOST = [0, 0.12];              // ai.ts:4218 (sklonnoscDoPodboju >= 4)
const WAR_SILA_BONUS = [0, 0.08, -0.06, -0.10]; // ai.ts:4017 (neutralny), :4032 (peaceful), :4048 (aggressive, risk<7 / risk>=7)

let rows = [];
for (const diff of Object.keys(DIFF_DELTA)) {
  const progRel = Math.max(0, Math.min(200, PROG_MIN_RELACJA_BASE + DIFF_DELTA[diff]));
  for (const pb of PODBOJ_BOOST) {
    for (const wb of WAR_SILA_BONUS) {
      const effProg = Math.max(0.3, PROG_WOJNA_SILA - pb + wb);   // ai.ts:4219-4222
      // Najkorzystniejszy dla wojny przypadek: zaufanie = 0, rw tuz przy progu.
      let sat = 0; let example = null;
      for (let i = 0; i <= 1000; i++) {
        const rw = i / 1000;
        if (rw < effProg) continue;
        const respekt = Math.max(0, Math.min(100, Math.round(100 * rw)));
        for (let z = 0; z <= 100; z++) {
          const score = Math.max(0, Math.min(200, z + respekt));
          if (score < progRel) { sat++; if (!example) example = { rw, zaufanie: z, respekt, score }; }
        }
      }
      rows.push({ diff, progRel, podbojBoost: pb, warSilaBonus: wb,
        effProgWojnaSila: Number(effProg.toFixed(3)), spelnialnych: sat, przyklad: example });
    }
  }
}
const total = rows.reduce((a, r) => a + r.spelnialnych, 0);
console.log('| trudnosc | progMinimalnyRelacja | podbojBoost | warSilaBonus | effProgWojnaSila | par (rw,zaufanie) spelniajacych bramę | przyklad |');
console.log('|---|---|---|---|---|---|---|');
for (const r of rows) {
  console.log(`| ${r.diff} | ${r.progRel} | ${r.podbojBoost} | ${r.warSilaBonus} | ${r.effProgWojnaSila} | **${r.spelnialnych}** | ${r.przyklad ? JSON.stringify(r.przyklad) : '—'} |`);
}
console.log(`\nSUMA spelnialnych kombinacji w calej siatce: **${total}**`);
console.log('Siatka: rw co 0,001 w [0,1] x zaufanie calkowite 0..100 x 3 trudnosci x 2 podbojBoost x 4 warSilaBonus.');
