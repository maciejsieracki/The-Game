'use strict';
/**
 * war-end-vassal-human-probe-test.cjs — R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1 r2 (dowód źródłowy).
 *
 * PROBE, nie test regresji: wypisuje surowe wyniki odczytu kodu (plik:linia) dla
 * ścieżek z analizy dyspozycje/analizy/WOJNA-WASALIZACJA-I-POKOJ-MIEDZYLUDZKI-2026-11-26.md.
 * Nie wymusza żadnego wyniku: zakończenie 0 oznacza, że odczyt się udał; o tym, czy
 * zachowanie jest błędem, decyduje klasyfikacja w analizie.
 *
 * Użycie (z katalogu gra/): node tools/war-end-vassal-human-probe-test.cjs
 */

const fs = require('fs');
const path = require('path');

const GRA_DIR = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(GRA_DIR, rel), 'utf8').split('\n');

/** Zwraca numery linii (1-indexed) pasujące do wzorca w zakresie [from, to]. */
function hits(lines, pattern, from = 1, to = lines.length) {
  const out = [];
  for (let i = from; i <= to && i <= lines.length; i++) {
    if (pattern.test(lines[i - 1])) out.push(i);
  }
  return out;
}

function report(label, value) {
  console.log(`${label}: ${value}`);
}

const main = read('src/main.ts');
const proposals = read('src/game/diplomacy-proposals.ts');
const gates = read('src/game/diplomacy-war-gates.ts');
const modal = read('src/ui/diplomacyNegotiationModal.ts');

console.log('== P17: wasalizacja (akcja 12) w wojnie ==');
report('diplomacy-proposals: blokada akcji w wojnie (stanWojny, poza trybut/ultimatum/pokoj/rozejm)',
  hits(proposals, /stanWojny && actionId !== 'trybut_oferta'/).join(',') || 'BRAK');
report('diplomacy-locks: case 12 zablokowana w wojnie',
  hits(read('src/game/diplomacy-locks.ts'), /zablokowana — trwa wojna/).join(',') || 'BRAK');

console.log('== P17b: trybut_oferta w wojnie ==');
report('diplomacy-war-gates: PEACE_CURRENCY_ACTION_IDS zawiera trybut_oferta',
  hits(gates, /PEACE_CURRENCY_ACTION_IDS = new Set\(.*trybut_oferta/).join(',') || 'BRAK');
const trybutCase = hits(proposals, /case 'trybut_oferta': \{/);
report('diplomacy-proposals: gałąź case trybut_oferta (start)', trybutCase.join(',') || 'BRAK');
if (trybutCase.length) {
  const start = trybutCase[0];
  const wojnaInBranch = hits(proposals, /stanWojny|atWar/, start, start + 40);
  report('  odwołania do stanu wojny w gałęzi trybut_oferta (+40 linii)', wojnaInBranch.join(',') || 'BRAK');
  const goldOnceLine = hits(proposals, /goldOnce != null && payload\.goldOnce > 0/, start, start + 40);
  report('  rozgałęzienie jednorazowe (goldOnce > 0)', goldOnceLine.join(',') || 'BRAK');
}
report('UI modal: case 8 wysyła tributeMode/goldPerTurn (linia)',
  hits(modal, /goldPerTurn: gpt,/).join(',') || 'BRAK');
report('UI modal: case 8 ustawia goldOnce (linie)',
  hits(modal, /goldOnce/).join(',') || 'BRAK (brak goldOnce w module modala)');

console.log('== P21b: pokój między fotelami (hotseat) ==');
const proposeStart = hits(main, /function proposeToHuman\(/)[0];
const respondStart = hits(main, /function respondToHumanProposal\(/)[0];
const finalizeStart = hits(main, /function finalizePeaceTreatyBetween\(/)[0];
report('main.ts: start proposeToHuman / respondToHumanProposal / finalizePeaceTreatyBetween',
  `${proposeStart} / ${respondStart} / ${finalizeStart}`);
report('main.ts: peaceProposalIsTooEarly w proposeToHuman (+12 linii)',
  hits(main, /peaceProposalIsTooEarly\(/, proposeStart, proposeStart + 12).join(',') || 'BRAK');
report('main.ts: peaceProposalIsTooEarly w respondToHumanProposal (+45 linii)',
  hits(main, /peaceProposalIsTooEarly\(/, respondStart, respondStart + 45).join(',') || 'BRAK');
report('main.ts: sprawdzenie atWar/status==wojna w respondToHumanProposal (+45 linii)',
  hits(main, /status === 'wojna'|atWar/, respondStart, respondStart + 45).join(',') || 'BRAK');
report('main.ts: sprawdzenie status==wojna w finalizePeaceTreatyBetween (+12 linii)',
  hits(main, /status === 'wojna'|status !== 'wojna'|atWar/, finalizeStart, finalizeStart + 12).join(',') || 'BRAK');
report('main.ts: wywołania peaceProposalIsTooEarly (wszystkie linie)',
  hits(main, /peaceProposalIsTooEarly\(/).join(','));
report('main.ts: akceptacja zaproponuj_pokoj -> finalizePeaceTreatyBetween',
  hits(main, /finalizePeaceTreatyBetween\(p\.fromOwnerId, p\.toOwnerId\)/).join(',') || 'BRAK');
report('timing: brak wyjątku hotseat/fotel w diplomacy-peace-proposal-timing',
  /hotseat|fotel/i.test(read('src/game/diplomacy-peace-proposal-timing.ts').join('\n')) ? 'JEST' : 'BRAK');

console.log('== Pozostałe odczyty (wasalizacja nie zmienia statusu) ==');
report('main.ts: applyProposalOutcomeImpl trybut_odmowa / trybut_oferta_przyjeta (zaufanie, bez statusu)',
  hits(main, /'trybut_odmowa'|'trybut_oferta_przyjeta'/).join(',') || 'BRAK');
report('main.ts: zapis status w gałęziach wasal/trybut (applyProposalOutcomeImpl, +220 linii)',
  hits(main, /status: 'wojna'|status: 'pokoj'|status: 'neutral'/, 27145, 27370).join(',') || 'BRAK');

console.log('PROBE OK');
