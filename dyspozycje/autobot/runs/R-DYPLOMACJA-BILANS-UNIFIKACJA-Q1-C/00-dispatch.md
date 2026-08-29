TEMAT:  R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1-C
RUNDA:  1/5
DATA:   2026-08-29
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high / Final Control Sonnet 5 effort=high (osobne wywołanie Workflow)

## WYZWALACZ
Kontynuacja `R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1` (zintegrowane 2026-08-29, zakres
-a/-b). Final Control tamtego tematu jawnie potwierdził dwa punkty POZA
ówczesnym zakresem (Evaluator, `DECISION_REQUIRED`):
1. Dla kierunku „oni proponują" (incoming) realną bramką akceptacji jest
   `previewIncomingPlayerAccept` (`gra/src/game/diplomacy-acceptance-points.ts`),
   NIE `evaluateProposal` — plik był poza allowlistą -a/-b.
2. `generateCounterOffer` ma rozjazd ról: `aiProposalPlayerBenefitSurplus`/
   `responderPwSurplus` zakładają strukturalnie `proposerOwnerId=AI`, ale ta
   funkcja bywa wołana też z odwrotnymi rolami (gracz-proponent, AI-responder).

Właściciel: „tak otwórz" (2026-08-29, po pytaniu orkiestratora czy rozszerzać
zakres). Bezpośrednie ustalenie w dialogu — nie wymaga turnieju ABC.

## GOAL
Dwie rzeczy, obie wymagają NAJPIERW reconu, nie zgadywania:
(a) Ustalić, czy `previewIncomingPlayerAccept` powinien stosować TĘ SAMĄ
    formułę fair-value (mnożnik relacji, baza traktatu, `handelWillingnessMultiplier`)
    co `evaluateProposal`, czy to świadomie inny, prostszy mechanizm dla
    kierunku incoming. Jeśli recon pokaże realną niespójność (gracz może dostać
    ofertę od AI, którą incoming-gate zaakceptuje mimo że ta sama oferta w
    kierunku odwrotnym zostałaby odrzucona jako nieuczciwa) — ujednolicić.
    Jeśli recon pokaże, że to zamierzony, inny mechanizm bez realnej
    sprzeczności — NIE zmieniać, opisać to jawnie w raporcie i zamknąć punkt
    jako „brak błędu" (nie na siłę szukać pracy tam, gdzie jej nie ma).
(b) Naprawić rozjazd ról proponent/respondent w `generateCounterOffer` —
    funkcja ma dawać SPÓJNY wynik niezależnie od tego, czy AI czy gracz jest
    proponentem. Zmiana MUSI być zweryfikowana behawioralnie (nie tylko
    typami): syntetyczne scenariusze PRZED/PO pokazujące, że kontroferta AI
    dla obu ułożeń ról liczy się tą samą, spójną logiką — z jawnym porównaniem
    wartości liczbowych PRZED i PO zmianie, żeby było widać, czy/jak zmienia
    się siła kontrofert AI (balans gry).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Recon punktu (a) jest jawnie opisany w raporcie z konkretnym wnioskiem:
   „niespójność realna, naprawiona" ALBO „mechanizm świadomie inny, brak
   błędu" — nie pominięty milczeniem.
2. Jeśli (a) wymagał naprawy: analogiczny test do
   `diplomacy-bilans-unifikacja-test.cjs` (z rundy -a/-b) potwierdzający oba
   kierunki (own i incoming) dają spójny wynik dla tych samych syntetycznych
   danych wejściowych.
3. `generateCounterOffer` daje spójny wynik dla obu ułożeń ról — dowiedzione
   testem jednostkowym z co najmniej 2 syntetycznymi scenariuszami per
   ułożenie ról (4 scenariusze łącznie), z wklejonymi PRZED/PO wartościami
   liczbowymi kontroferty.
4. Wszystkie istniejące testy `diplomacy-*.cjs`, `adjust-handel-split-suma-test.cjs`,
   `cuda-handel-test.cjs`, `eot-diplomacy-header-test.cjs` — zielone bez
   pogorszenia (w tym `diplomacy-bilans-unifikacja-test.cjs` 27/27 z rundy
   poprzedniej, BEZ ZMIANY jego oczekiwanych wartości, chyba że recon (a)
   wymaga rozszerzenia — wtedy jawnie opisać które asercje i dlaczego).
5. `node ./node_modules/typescript/bin/tsc --noEmit` (z gra/) → 0 błędów.
6. Pięć bramek referencyjnych zielone bez pogorszenia: logic-test (213/213),
   tech-tree-test (19/19), research-test (33/33), unit-replace-test (13/13),
   combat-test (6/6).
7. Jeśli którakolwiek zmiana realnie zmienia liczby kontroferty AI wobec
   gracza (nie tylko naprawia symetrię ról) — zgłosić to jawnie jako
   potencjalny wpływ na balans, status `DECISION_REQUIRED` dla TEJ konkretnej
   zmiany, nie integrować cicho.

## ALLOWLISTA — nic poza tym
`gra/src/game/diplomacy-acceptance-points.ts` (NOWO dodane wobec -a/-b, jeśli
recon (a) wymaga zmiany), `gra/src/game/diplomacy-proposals.ts`
(`generateCounterOffer` i pomocnicze funkcje roli), `gra/src/game/diplomacy-value-catalog.ts`,
`gra/src/game/diplomacy-ai-offer-balance.ts`, `gra/src/main.ts` (wyłącznie
wywołania dotyczące kontrofert/incoming), nowy plik(i) testowe.
Zakazane bezwzględnie: `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1-C`, baza
JAWNIE `origin/main` (już zawiera zintegrowane -a/-b). Sparse-checkout bez
`gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz „naprawienia" rozjazdu ról przez zmianę, która cicho zmienia balans AI
bez jawnego zgłoszenia (kryterium 7). Zakaz uznania punktu (a) za zamknięty
bez jawnego wniosku recon — milczenie na ten temat w raporcie = zarzut.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje dokładny plik/funkcję z błędem; runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli zakres (a)+(b) razem
okaże się za duży na jedną rundę — dozwolony podział na węzły -a (incoming)/
-b (role generateCounterOffer), zgłoś to jawnie zamiast robić oba na siłę.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, model sędziego §3c) → Operator (obrona, jeśli
zarzuty) → Final Control (werdykt per zarzut, osobne wywołanie Workflow) →
integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push.
