# R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 — raport Operatora (runda 2/5)

STATUS: BLOCK (runda 2 domknięta w większości; jedna bramka nie ma dowodu mutacyjnego w main.ts, a dług D2 (trybut) i krok 4b są poza zakresem tej rundy — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1
GOAL: rozejm i pokój wg siły militarnej: słabsza strona szuka rozejmu/pokoju, silniejsza go odrzuca, opór silniejszej przełamuje wyłącznie miasto (cena PN jak dotąd); bez pieniędzy i surowców jako słodzika. Dotyczy gracza i AI.
BAZA: f2367587e (kandydat startowy wg DODATKU) → merge origin/main (ed95085a2) → commit operatora r2 (SHA w polu sha wyniku).
RUNDY: 2/5 (ta runda = Operator r2)
MODEL: Operator = Haiku (zasada 2). Brak eskalacji do Sonneta.

## Zarzuty FC rundy 1 — stan

| nr | zarzut | status | dowód |
|---|---|---|---|
| 1 | regresje diplo-peace-balance-accept-test (5 FAIL) i diplo-war-peace-main-guard-test (3 FAIL) | ZAMKNIĘTE | balance-accept: 32 pass / 0 fail (A1–A7, B1–B6, C1–C3, Z1–Z3, M1–M3, G1–G7, P0/P0b); main-guard: 35 pass / 0 fail (R3 i mutacje przepisane na pozycję militarną). Sim: 19 pass / 3 fail = S3, S4b, M_TUR (dług bazowy, bez nowych). |
| 2 | dowód mutacyjny (h) dla bramek | CZĘŚCIOWO | Nowy skrypt gra/tools/diplo-peace-gate-mutation-run.cjs: 9/9 mutantów ZABITYCH (patrz TESTY). Brak mutanta dla bramki main.ts (pozycjaMilitarna w diploProposalWarState i w bramce ABC AI↔AI): test zachowania nie ładuje main.ts → NIE_ZMIERZONO. |
| 3 | rozejm z miastem słabszej AI niewdrożony | ZAMKNIĘTE | ai.ts N1a: komenda oferuj_miasto_za_pokoj dostaje rodzaj = aiPeaceProposalKind(tury wojny) (rozejm w okresie rozejmowym); diplomacy-proposals.ts: rodzaj 'rozejm' → actionId 'rozejm', payload.turns = TRUCE_DEFAULT_TURNS, giveItems z miastem. Test f2/f3. |
| 4 | testy pasma (progRozniceSilyPokoj > 0) i przypadku jednego miasta (D3) | ZAMKNIĘTE (poziom funkcji) | g1–g3 (pasmo 20%) i d3 (jedno miasto PN < ceny nie kupuje pokoju). Ścieżka gry z progiem > 0 przez main.ts NIE_ZMIERZONO. |
| 5 | remis rozstrzygany tak samo w ai.ts i main.ts | ZAMKNIĘTE (r1) + test | ai.ts używa id = myPlayerId/partnerId jak main.ts (String(ownerId)); test M1–M3 (deterministyczny remis, dokładnie jedna strona silniejsza). |

## Decyzje orkiestratora z DODATKU — realizacja

- D1 (allowlista + forced-peace): diplomacy-ai-forced-peace.ts zmieniony. Reguła AI↔AI: zwycięzca 'stronger' przyjmuje pokój TYLKO gdy plan składa się z samych miast i pokrywa cenę (plan.full → accept_paid; inaczej wait). Po limicie tur (force) zostaje mechanizm zmęczenia (krok 4b) — ZOSTAWIONY, opisany poniżej jako ZAŁOŻENIE.
- D2 (złoto/surowce nie są słodzikiem): w proposals odrzucane w każdym kierunku (c/d1/d2 testy). W forced-peace planPeacePayment dostaje tylko aktywa 'miasto' (filter). Tribute (oferuj_trybut_za_pokoj, zadaj_trybut) NIE zmieniany — poza tą rundą (ZAŁOŻENIE: trybut to osobna umowa, DODATEK D2).
- D3 (jedno miasto słabszej strony): słabsza AI bez miasta nie proponuje pokoju wobec gracza (ai.ts peaceWeakerNoCityVsPlayer); gracz-słabszy z jednym miastem PN < ceny jest odrzucany (test d3). Brak nowej mechaniki (ZAŁOŻENIE Z5).

## Zmiany (commit operatora r2) — pliki
- gra/src/game/ai.ts — oferuj_miasto_za_pokoj z polem rodzaj (rozejm/pokój); komentarz wymogu 3.
- gra/src/game/diplomacy-proposals.ts — oferuj_miasto_za_pokoj rodzaj 'rozejm' → actionId 'rozejm' + turns; opis komendy dla rozejmu.
- gra/src/game/diplomacy-ai-forced-peace.ts — decideAiPeaceRequest: 'stronger' tylko przy pełnym pokryciu miastami; runAiAiPeaceTick: aktywa tylko miasta (D2).
- gra/tools/diplo-peace-balance-accept-test.cjs — przepisany na pozycję militarną (32/0).
- gra/tools/diplo-war-peace-main-guard-test.cjs — R3 i mutacje na peacePosMil (35/0).
- gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs — +f2, f3, d3, g1–g3 (21/0).
- gra/tools/diplo-peace-gate-mutation-run.cjs — NOWY: dowód mutacyjny (9 mutantów, przywraca oryginał).
- gra/tools/ai-war-nearest-city-peace-2t-test.cjs — fixture gold → miasto (zgodnie z D2); asercje B3/B7/B10/B11/B12 przepisane; B6 rozdzielony (stronger+miasto = accept; stronger+zloto = wait).
- gra/tools/ai-war-weariness-peace-test.cjs — runAI podaje silaMilitarnaAI/Partner (wcześniejsza regresja N1a z rundy 1: 95/1 → 96/0).
- gra/tools/diplo-peace-ai-ai-nonnegative-test.cjs — runTick/weariness: aktywa = miasto (D2); T2 z miastem 100 PN.

## TESTY (surowe liczby z tej rundy)
- npx tsc --noEmit: EXIT 0
- logic-test: EXIT 0
- tech-tree-test: EXIT 0
- research-test: EXIT 0
- unit-replace-test: EXIT 0
- combat-test: EXIT 0
- diplomacy-test: 148 passed, 0 failed
- diplo-military-strength-test: RESULT 27 PASS / 0 FAIL
- diplo-war-battle-counter-test: 35 PASS / 0 FAIL
- diplo-war-declare-zero-trust-test: 43 OK, 0 FAIL
- diplo-trust-numbers-test: 22 pass, 0 fail
- diplo-war-peace-gate-test: 24 pass / 0 fail
- diplo-war-peace-profile-unit-test: 198 pass / 0 fail
- diplo-war-peace-d7-test: 8 pass / 0 fail
- diplo-war-peace-main-guard-test: 35 pass / 0 fail (była 32/3)
- diplo-peace-balance-accept-test: 32 pass / 0 fail (była 24/5; kryterium z DODATKU 29/0 — liczba asercji zwiększona, nie zmniejszona)
- diplo-peace-weaker-seeks-city-only-test: 21 pass / 0 fail (była 15/0)
- diplo-war-peace-sim-test: 19 pass / 3 fail — FAIL dokładnie S3, S4b, M_TUR = dług bazowy (kryterium ≤3 spełnione, bez nowych)
- ai-war-nearest-city-peace-2t-test: WYNIK PASS, MUTACJE 16/16 zabite (była FAIL na 8 asercjach — przepisane wg D2)
- ai-war-weariness-peace-test: PASS=96 FAIL=0 (była 95/1)
- diplo-peace-ai-ai-nonnegative-test: 20 PASS, 0 FAIL (była 19/1)
- diplo-peace-gate-mutation-run: MUTACJE BRAMEK 9/9 zabite:
  - M1 bramka 'silniejsza' (evaluatePeaceAiGate): zabity (weaker-seeks FAIL=2; balance FAIL=3)
  - M2 bramka miasto ≥ PN (proposals r5Gate): zabity (weaker-seeks FAIL=1)
  - M3 odrzucenie złota/surowców (proposals): zabity (weaker-seeks FAIL=2)
  - M4 aiFeelsStronger=false (ai.ts): zabity (balance FAIL=5)
  - M5 peaceWeakerNoCityVsPlayer=false (ai.ts): zabity (balance FAIL=2)
  - M6 forced-peace 'stronger' → accept (ai-war-nearest-city FAIL=1)
  - M7 forced-peace filtr tylko miast usunięty (ai-war-nearest-city FAIL=3)
  - M8 rozejm z miastem (proposals rodzaj): zabity (weaker-seeks FAIL=1)
  - M9 pasmo (diplomacy-military-strength): zabity (weaker-seeks FAIL=2)
- Pozostałe: diplomacy-tests w pełnym zestawie NIE uruchamiane w tej rundzie poza wymienionymi (NIE_ZMIERZONO: diplomacy-proposals-*, diplo-peace-* poza wymienionymi).

## BLOKADY (otwarte)
1. Dowód mutacyjny bramek w main.ts (pozycjaMilitarna w diploProposalWarState ~main.ts:11753 i w tickAiAiPeaceRequests gateVerdict ~main.ts:36588) — NIE_ZMIERZONO: brak testu zachowania ładującego main.ts. Wymaga osobnego harnessu albo decyzji orkiestratora, czy wystarcza test regex (lekcja W45/W47 mówi, że nie).
2. Tribute AI (oferuj_trybut_za_pokoj, priorytet 1) i zadaj_trybut nadal używają złota jako elementu — D2 stwierdza, że trybut to osobna umowa; NIE zmieniono (wymaga potwierdzenia właściciela, czy trybut jest wyjątkiem).
3. Krok 4b (zmęczenie wojną kończy wojny tylko miastami, miara = siła militarna) — poza zakresem; forced-peace 'force' po limicie tur zostaje jako mechanizm zmęczenia i nadal może zapłacić częściowo miastem (ZAŁOŻENIE do kroku 4b).
4. Ścieżka pasma w grze (progRozniceSilyPokoj > 0 przez main.ts) — NIE_ZMIERZONO (pokryte na poziomie funkcji g1–g3).
5. Test c3 (miasto PN ≥ ceny nie odrzucane) jest słabszy niż nazwa sugeruje: harness nie rozwiązuje wartości miasta po id, więc asercja sprawdza tylko brak komunikatu o mieście; ścieżka akceptacji miasta o PN ≥ ceny NIE jest zmierzona. Ten sam problem dotyczy usuniętego f4. Wymaga fixtury stanu z wyceną miasta.

## ZAŁOŻENIA (luki rozstrzygnięte bez pytania)
- Z5/D3: słabsza AI bez miasta nie proponuje pokoju wobec gracza; propozycja gracza-słabszego z 1 miastem poniżej ceny jest odrzucana.
- Forced-peace: planPeacePayment ogranicza się do jednego miasta (limit istniejącej reguły); cover = najtańsze miasto pokrywające resztę, w przeciwnym razie najcenniejsze.
- Rozejm z miastem słabszej AI: rodzaj wg aiPeaceProposalKind (okres rozejmowy wg tur wojny), nie wg aiTruceOrPeaceMode.
- Dług testowy diplo-war-peace-sim-test (S3, S4b, M_TUR) nie jest objęty tą rundą.

## UWAGI-DLA-ORKIESTRATORA
- Harness testu ai-war-nearest-city-peace-2t-test i diplo-peace-ai-ai-nonnegative-test przepisany na miasta zamiast złota; to zmiana fixtur zgodna z D2, a nie osłabienie asercji (ta sama logika bilansu, inne aktywa).
- Regresja N1a z rundy 1 (ai-war-weariness-peace-test: 200 tur + straty) wynikała z przejścia bramki na peacePosMil bez danych siły w teście; naprawione w teście (silaMilitarnaAI/Partner = rw·1000 / (1−rw)·1000), kod nietknięty.
- Brak sesji nowych: w tej rundzie nie użyto żadnych narzędzi tworzących sesje/zadania (zakaz z dispatchu).
- Tokeny: uruchomienie pełnej pętli testów diplomacy zajęło duży budżet; nie ma timeoutów.

## NASTĘPNY KROK
Orkiestrator: (a) decyzja, czy dowód mutacyjny main.ts wystarcza przez regex (wtedy zamknąć BLOKADĘ 1), czy wymagany harness; (b) potwierdzenie czy trybut (D2) jest wyjątkiem; (c) runda 3 tego samego ID: fixtura wyceny miasta (c3/f4), harness main.ts (jeśli wymagany), krok 4b poza tematem.

DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi detached worktree; bez push na main; bez integracji)
