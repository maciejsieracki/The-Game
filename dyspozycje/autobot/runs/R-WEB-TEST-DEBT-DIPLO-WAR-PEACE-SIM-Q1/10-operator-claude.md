# R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1 — Operator, runda 3/5 (HAIKU)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1
GOAL: Runda 3 — merge origin/main f196422ef do kandydata r2 4f1d32f0d, rozwiązanie konfliktu w diplo-war-peace-sim-test.cjs, przepisanie regresji testów pokoju na tury >= 10 (bez osłabiania asercji), dług bazowy nienaprawiany.

ZMIANY-COMMIT: 85fc3e716 (merge: origin/main f196422ef + kandydat r2 4f1d32f0d; zmienione pliki testowe: gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs, gra/tools/ai-losing-war-asks-peace-vs-player-test.cjs, gra/tools/diplo-war-peace-main-guard-test.cjs; konflikt diplo-war-peace-sim-test.cjs rozwiązany). Ten raport jest w osobnym commicie po merge. ai.ts po merge różni się od f196422ef tylko bramką czasu (aiPeaceTimeOk = Math.max(minTurWojny, PEACE_PROPOSAL_MIN_WAR_TURNS)) i importem stałej, zgodnie z allowlistą r3. Ancestry: `git merge-base --is-ancestor f196422ef HEAD` = OK.

## Konflikt diplo-war-peace-sim-test.cjs (l.266–282 przed rozwiązaniem)
- Zachowane z r2 (HEAD): `minAI = max(minTurZulusi, PEACE_PROPOSAL_MIN_WAR_TURNS)`, pętla `expected` od `minAI`, S1 „od tury 10”, S1a `x.t >= minAI`.
- Zachowane z W73 (f196422ef): S1b sprawdza `pozycja=slabsza` (zgodne z napisem powodu w ai.ts l.7191: `pozycja=${peacePosMil}`). Wariant r2 `sygnaly=a` odrzucony, bo po W73 powód pozycji jest właściwym sygnałem.
- Wynik: diplo-war-peace-sim-test 25 pass / 0 fail (baza f196422ef: 19/3).

## Regresje po merge (czerwone na kandydacie, zielone na bazie) — przepisane
| Test | Przed (kandydat po merge) | Zmiana | Po |
|---|---|---|---|
| diplo-peace-weaker-seeks-city-only, h3 | FAIL (`aiDecide(5, 5000, 6, 100, 200)` → []) | `const weakCityTruce = aiDecide(10, 5000, 6, 100, 200);` | h3 PASS; 29 pass / 3 fail (= baza 29/3; h2/h4/h5 to dług) |
| ai-losing-war-asks-peace-vs-player, (1) Harappa | FAIL 11/1 (gapy: t=3 i t=8, oba nc=6) | pętla `[3, 8, 10, 15, 16, 20, 60]` → `[10, 11, 12, 15, 16, 20, 60]` | 12 PASS / 0 FAIL (= baza 12/0) |
| diplo-war-peace-main-guard, R3 spojnosc | FAIL (statyczny literal `minTurWojny`) | literal → `Math.max(warProfile.minTurWojny, PEACE_PROPOSAL_MIN_WAR_TURNS)` | 34 pass / 1 fail (= baza 34/1; R6/ZT to dług) |

Uwaga: dispatch wskazywał t=3 w ai-losing; na kandydacie padał też t=8 (nc=6). Oba przepisane. t=8 z 2 miastami (`decide(8, 0, 2)`, przed progiem) zostawiono — sprawdza brak komend przed progiem i jest zielony.

Asercje nie osłabione: liczba check-ów bez zmian, zmieniono tylko wartości tur i literal bramki.

## Dług bazowy (czerwony już na f196422ef, identycznie na kandydacie) — NIE naprawiany
- diplo-peace-weaker-seeks-city-only: h2, h4, h5 (base 3 fail = kandydat 3 fail).
- diplo-war-peace-main-guard: R6/ZT (base 1 fail = kandydat 1 fail).
- diplo-truce-r1-test: P1, P2 (base 2 fail = kandydat 2 fail).
- diplo-truce-r4-ai-test: mutant M2 (base 1 fail = kandydat 1 fail).
- diplo-war-peace-gate-test: G (base 1 fail = kandydat 1 fail).
- diplo-war-peace-live-test: NIE uruchamiany (zakaz z dispatchu: timeout i nadpisanie PNG).

## TESTY (surowe wyjście, kandydat 85fc3e716)
Peace/diplomacy (21 skryptów, wynik końcowy):
- weaker-seeks 29/3 (dług) · ai-losing 12/0 · main-guard 34/1 (dług) · truce-impl 94/0 · truce-r1 28/2 (dług) · truce-r4-ai 23/1 (dług) · truce-until-turn 15/0 · truce-n6-saveload 8/0 · war-peace-gate 23/1 (dług) · profile-unit 198/0 · ai-war-weariness-peace PASS=99 FAIL=0 · peace-balance-accept 32/0 · stance-wiring 10/0 · weariness-20-turns PASS=30 FAIL=0 · weariness-city-only PASS=30 FAIL=0 · weariness-display ALL PASSED · weariness-unconditional-end PASS=22 FAIL=0 · peace-gate-military-strength 14/0 · ai-ai-nonnegative 21/0 · sim 25/0.
- Baza f196422ef (ten sam zestaw): weaker-seeks 29/3 · ai-losing 12/0 · main-guard 34/1 · truce-r1 28/2 · truce-r4 23/1 · war-peace-gate 23/1 · sim 19/3; pozostałe identycznie.
- Regresje (zielone na bazie, czerwone na kandydacie przed poprawką): żadne po poprawkach.

Mutanty sim-test (wszystkie wykryte, wynik z wyjścia skryptu): (0) każdy mutant podmienił 1 miejsce; M_SIG; M_FEEL; M_WEAR; M_TUR; M_GATE; M_STRONG; M_REV; M_HEALTH (przeniesiony) — wszystkie PASS. M_TUR, M_GATE, M_STRONG, M_REV, M_WEAR czerwienią testy zgodnie z kryterium.

Bramki (kandydat 85fc3e716):
- `npx tsc --noEmit` rc=0, 0 linii wyjścia.
- logic-test 213 PASS / 0 FAIL (rc=0).
- tech-tree-test 20 pass / 0 fail.
- research-test PASSED 33 / FAILED 0.
- unit-replace-test: 21 linii [OK], 0 FAIL (rc=0).
- combat-test: "All sanity checks passed." (rc=0).
- ai-test: 297 passed, 0 failed.
- diplomacy-test: 149 passed, 0 failed.

## BLOKADY
Brak blokad procesu. Dług bazowy (lista wyżej) nieobjęty tym tematem.

## Założenia (luki rozstrzygnięte w raporcie)
- S1b: wybrano wariant W73 (`pozycja=slabsza`) zamiast r2 (`sygnaly=a`), bo powód z ai.ts zawiera `pozycja=`.
- main-guard R3: zmiana literalu to zmiana statycznej asercji po zmianie kodu, nie zmiana zachowania. Zachowanie pokrywa mutacja cofająca bramkę w sim-test (M_TUR, M_REV).

## UWAGI-DLA-ORKIESTRATORA
1. Merge wniósł zmiany z gra-robocza/ i innych tematów z main (64 pliki w merge). To zawartość origin/main, nie praca operatora; nie cofano.
2. Statyczne asercje tekstowe (main-guard „R3 spojnosc”, „R6/ZT”) są kruche wobec zmian kodu. Rekomendacja: zamienić na testy zachowania w osobnym temacie (nie w tym).
3. Dług z listy wyżej wymaga osobnego tematu (zgodnie z dispatchem, krok 4).
4. Operator nie zakładał sesji, nie odpowiadał na wiadomości wklejone w trakcie pracy.
5. Plik 10-operator-claude.md już istniał w drzewie po merge (poprzednia runda); został nadpisany treścią rundy 3. Poprzednia wersja jest w historii gita na 4f1d32f0d.

RUNDY: 3/5 (ostatni werdykt FC r2: FAIL; runda 3 = Operator HAIKU, mechaniczna)
NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja tabeli regresji, mutantów i bramek z sekcji TESTY; następnie Obrona/Final Control.
DEPLOY/PUSH: NIE WYKONANO
