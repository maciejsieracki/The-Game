STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-PANEL-AIAI-BOTH-LABELS-Q1
GOAL: w wojnach AI↔AI na liście „W stanie wojny z" karty rozmówcy widać OBIE strony (zmęczenie/desperacja rozmówcy i partnera). Wojny gracz↔AI bez zmian. Tylko odczyt, bez wpływu na stan/RNG.
ZMIANY/COMMIT: baza e28ae9bd5 (origin/main). Zastosowano patch Operatora z DODATKU (r1-partial-operator.patch, gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0) i przejrzano go krytycznie.
  - gra/src/main.ts: buildAudienceOtherRelations (~8805) zwraca `warWeariness: side.own` i `warWearinessPartner: side.rival` (warWearinessSideView zwraca {own, rival}, zweryfikowane w gra/src/game/war-weariness-view.ts:144).
  - gra/src/ui/diplomacyAudience.ts: typ AudienceRelationPartner.warWearinessPartner; relationPartnerListHtml dostaje nazwę rozmówcy; warWearinessMarkHtml rysuje znacznik „<czyja strona>: <etykieta>" tylko gdy dane istnieją.
  - gra/tools/diplo-panel-aiai-both-labels-test.cjs (nowy, 16 asercji).
  - Commit: patrz pole sha w odpowiedzi. Zawiera wyłącznie te 3 pliki i ten raport (bez git add -A).
  - Uwaga: znaczniki w sekcji relacji mają format „Nazwa: Desperacja N%" także w wojnie gracz↔AI, ale tam p.warWearinessPartner jest undefined, więc nie pojawia się drugi znacznik. Wiersze gracz↔AI w karcie (warWearinessRowsHtml) nie zmieniono.
TESTY:
  - npx tsc --noEmit: exit 0.
  - tools/diplo-panel-aiai-both-labels-test.cjs (po poprawce): Wynik: 16 OK, 0 FAIL, exit 0.
  - Czerwień na bazie (renderer z HEAD, main.ts poprawiony): Wynik: 9 OK, 7 FAIL, exit 1 (A1–A4 czerwone).
  - Mutacja A (main.ts: warWearinessPartner: undefined): Wynik: 14 OK, 2 FAIL (B1, B2), exit 1.
  - Mutacja B (renderer: partnerView = undefined): Wynik: 11 OK, 5 FAIL (A1, A2, A4), exit 1.
  - Regresje (exit 0 każdy): diplo-weariness-display-test (ALL PASSED), diplo-weariness-20-turns-test (PASS=30 FAIL=0), diplo-weariness-city-only-test (PASS=30 FAIL=0), diplo-weariness-unconditional-end-test (PASS=22 FAIL=0), logic-test (exit 0), research-test (PASSED: 33 / FAILED: 0 / TOTAL: 33), combat-test (All sanity checks passed.), tech-tree-test (exit 0, bez linii podsumowania), unit-replace-test (exit 0, bez linii podsumowania).
  - git diff --check (cached i worktree): czysto.
BLOKADY:
  - Weryfikacja live w Chromium (punkt 4 dispatchu) NIE_ZMIERZONO w tej rundzie: nie napisano runnera gra/tools/live-verify-diplo-panel-aiai-both-labels.cjs i nie uruchomiono przeglądarki. Dowód jest logiczny (renderer + wiązanie statyczne) i nie zastępuje zrzutu z gry.
  - Test B0–B3 jest statyczny (czyta źródło main.ts regexem), nie wykonuje buildAudienceOtherRelations.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET): przegląd diffu, potwierdzenie mutacji; opcjonalnie runner live przed FC.
DEPLOY/PUSH: NIE WYKONANO
