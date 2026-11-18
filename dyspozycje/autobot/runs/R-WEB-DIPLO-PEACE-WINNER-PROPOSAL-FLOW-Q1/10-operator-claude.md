# R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1 — Operator (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dyplomacja/UI)
TEMAT: R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1
GOAL: silny gracz widzi blokadę 10 tur wojny PRZED kliknięciem (wyszarzony przycisk „Zaproponuj pokój" z licznikiem „dostępne za N tur"). Pozostałe punkty GOAL (kierunek płatności, konkretny powód odmowy AI, zgoda słabszej zmęczonej AI) NIE zrobione w tej rundzie — patrz BLOKADY.

BAZA: da727c9a416f729b825576a974665aed7726fed7 (origin/main), worktree detached.

ZMIANY-COMMIT: commit na gałęzi detached tego worktree (SHA w polu sha odpowiedzi). Allowlista:
- gra/src/game/diplomacy-peace-proposal-timing.ts — nowa funkcja `peaceProposalTurnsLeft(turnsAtWar)` (pełne tury do odblokowania; ta sama reguła co `peaceProposalBlocked`).
- gra/src/game/diplomacy-locks.ts — pole `turnsAtWar?` w `DiplomacyActionLockContext`; gałąź `case '10'` zwraca `locked: true` z notką „dostępne za N tur" gdy `peaceProposalBlocked('pokoj', true, turnsAtWar)`. `undefined` = brak blokady (wsteczna zgodność fikstur).
- gra/src/main.ts — `buildDiplomacyLockContextBase` przekazuje `turnsAtWar: atWar ? diploWarStateFor(ME(), ownerId).turnsAtWar : 0` (ta sama para/orientacja co `peaceProposalIsTooEarly`). Bez zmian w bloku marszu i civTest.
- gra/tools/diplo-peace-winner-proposal-flow-test.cjs — NOWY test (esbuild stdin, bez zapisu plików).
- dyspozycje/autobot/runs/R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1/10-operator-claude.md — ten raport.

Efekt: przycisk pokoju (i wpis „Możliwe umowy") jest wyszarzony już przy otwarciu audiencji, z tooltipem/notką „dostępne za N tur". Reguła liczbowa (10 tur) NIE zmieniona. Silnik (`peaceProposalIsTooEarly`, `evaluateProposal`) bez zmian.

TESTY (surowe wyjścia, `node` w gra/):
- `npx tsc --noEmit` → exit 0.
- diplo-peace-winner-proposal-flow-test (nowy) → `SUMA: PASS=20 FAIL=0`, exit 0.
- diplomacy-locks-test → 88 passed, 0 failed.
- diplomacy-audience-actions-test → 20 passed, 0 failed.
- diplo-nap-trust-30-test → 25/25 passed.
- diplo-quick-actions-labels-test → 38 OK, 0 FAIL.
- diplo-alliance-gate-test → 19 PASS, 0 FAIL.
- diplo-nap-border-threshold-test → 14 OK, 0 FAIL.
- handel-wymiana-tech-gate-test → 35 passed, 0 failed.
- diplo-war-peace-gate-test, diplomacy-tech-chip-filter-and-multi-deal-test, diplo-truce-r1-test → exit 0 (bez linii podsumowania w wyjściu).
- logic-test → LOGIC OK (213/213); research-test → ALL GREEN; tech-tree-test → 20 pass, 0 fail; combat-test → exit 0 („All sanity checks passed"); unit-replace-archer-slinger-test → 51 OK, 0 FAIL.
- Brak regresji w uruchomionych testach. Znane długie czerwone bazowe (weaker-seeks/main-guard/gate G/truce-r4) NIE były uruchamiane osobno w tej rundzie.
- Dowód live (Chromium/zrzut): NIE ZMIERZONO (brak uruchomienia przeglądarki w tej rundzie).

BLOKADY (niezrobione w rundzie 1):
1. Kierunek płatności „przegrywający płaci miastami" — NIE ZBADANO w tej rundzie; wymaga weryfikacji względem zatwierdzonych decyzji (6000 PN × (1 − L)) i ewent. DECISION_REQUIRED.
2. Konkretny powód odmowy AI (r5Gate: za wcześnie / silniejsza AI / bilans PW / bramka relacji) w komunikacie po kliknięciu — NIE ZROBIONE; `evaluateProposal` zwraca już `reason`, ale brak potwierdzenia ścieżki do UI.
3. Zgoda słabszej zmęczonej AI na propozycję gracza — NIE ZBADANE (poza zakresem tej rundy).
4. Tekst „Brakuje 1218 PW" (zrzut) — NIE ZBADANE: źródło w `diplomacyAcceptanceBalance.ts` (ta sama ścieżka co diagnoza 2b/1e), nie ruszane.
5. Wyjaśnienie tabeli przypadków autor×adresat×zmęczenie 0,28/0,8/1 — tylko blokada tur jest pokryta testem; zmęczenie nie jest częścią tego zmienionego kodu.

RUNDY: 1/5 (ostatni werdykt: brak — pierwsza runda Operatora).
NASTĘPNY KROK: Evaluator sprawdza zakres allowlisty i test; potem runda 2 na punkty 1–3 z BLOKAD (ewent. DECISION_REQUIRED dla kierunku płatności).
UWAGI-DLA-ORKIESTRATORA: dispatch wskazywał plik `00-dispatch.md` w origin/main — w origin/main go nie ma (jest tylko w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0); odczytany z gałęzi. Nie tworzono nowych sesji/zadań/harmonogramów.
DEPLOY/PUSH: NIE WYKONANO
