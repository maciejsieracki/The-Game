STATUS: PASS-WITH-NOTES (kryterium 3 czasu: tura 1 w normie, wielotura AI NIE spełniona -- decyzja orkiestratora)
DOMAIN: GAME
TEMAT: R-WEB-AI-MOVE-RANGE-Q1
GOAL: AI, miasta-państwa i barbarzyńcy idą w jednej turze pełnym budżetem ruchu jak gracz (nie 1 heks).
BAZA: 96d1c4b0 (r2), commit r3 na wierzchu. Brak push, brak deploy.
ZMIANY/COMMIT: gra/src/game/ai-move-range.ts, ai.ts, barbarians.ts, warAllInCapital.ts (decyzja b: cel w zasięgu i wolny jest krokiem); gra/tools/ai-move-range-test.cjs, war-allin-capital-test.cjs, ai-move-range-terrain-bench.cjs (nowy); logi r1/r3 i evidence-bench-terrain-r3.log.
RUNDY: 3/5

## Z1: logi i przyczyny
- r1 odtworzony: `01-operator-r1.md` (oryginał nie został zapisany; przyczyny plik:linia: ai.ts:860, barbarians.ts:759, ai-city-capture-executor.ts:138, main.ts:36289/36312, main.ts:31732).
- r2 już był w repo (`01-operator-r2.md`).

## Decyzja (b) orkiestratora (cel w zasięgu, wolny = krok)
- `farthestStepWithinBudget` (ai-move-range.ts): ostatni heks trasy jest krokiem, gdy mieści się w budżecie i nie jest w `blockedKeys`. Zajęty cel zostaje poza wyborem (krok do sąsiada). AI: przekazany zbiór `occ`; barbarzyńcy: `occupied`.
- `extendWalk` (warAllInCapital.ts): heks docelowy dopuszczony, o ile nie jest obcym miastem (`nav.blocked`) i jest wolny (`isFreeFor`).
- ZAŁOŻENIE: egzekutor (main.ts, `blockedKeys` z `addForeignCityBlocks` + zajęte heksy) obcina koniec trasy do ostatniego wolnego heksu, więc nie wchodzi na obce miasto ani na zajęty cel. Barbarzyńcy w main.ts (gałąź bez egzekutora, `bu.q = bcmd.toQ`) mogą teraz przeskoczyć dalej na pusty heks; obcego miasta nie wchodzą, bo `barbarians.ts` nie dopuszcza zajętego celu. NIE_ZMIERZONO w pełnej grze.

## Z7: sekcja 6 war-allin-capital-test.cjs
- Baza domyślna: `fcd86933` (origin/main sprzed zmiany zasięgu), `WAR_ALLIN_BASE_REF` nadpisuje.
- 6a: baza fcd86933 ZAWIERA moduł warAllInCapital (`git cat-file -e fcd86933:gra/src/game/warAllInCapital.ts`), więc oczekiwanie "false" było nieaktualne -> teraz `true`.
- 6b: referencje hashów OFF (HEAD) = `REF_OFF`; baza pre-zasięg = `REF_BASE_PRE_RANGE` (zmierzone live w tej rundzie: aiVsAi 49f36d28989cf940, aiVsPlayer 22a63c096e698720, barbarians 65542d56510bcef9, noLandPath 176b6b39e9773451). Różnica OFF vs baza jest zamierzona (pełny zasięg także przy fladze OFF).
- 1a: PRZED ma bitwy = 3 (`REF_AI_OFF_BATTLES`); wcześniej 0 wynikało z 1-heksowego ruchu.
- 6c: flaga ON != baza -- przechodzi.
- Stan na origin/main (fcd86933) sprzed r3: r2 raportował 85 passed / 6 failed (6a, 6b x4, 6c) -- wynik z r2 pkt 7, NIE_PONOWNIE_ZMIERZONO w r3 (brak drzewa bazowego z działającym `git` w teście).

## Z3: pomiar PRZED/PO na mapie z terenem (bez main.ts)
Skrypt: `gra/tools/ai-move-range-terrain-bench.cjs`; mapa 40x20 (laka, wzgórza koszt 2, lasy); 10 jednostek; 8 tur; budżet 2/5/8; PRE = `git archive fcd86933 gra/src gra/data`. Pełny log: `evidence-bench-terrain-r3.log`.

| scenariusz (B) | hex/ruch PRZED -> PO | hex/jedn. (decyzja) PRZED -> PO | budżet/ruch PRZED -> PO | det. (hash x2) |
|---|---|---|---|---|
| AI ogólne (2/5/8) | 1,00 -> 1,49 / 3,70 / 5,93 | 0,82 -> 1,10 / 2,96 / 5,19 | 0,57/0,23/0,14 -> 0,80/0,78/0,79 | OK x3 |
| barbarzyńcy (2/5/8) | 1,00 -> 1,84 / 4,25 / 6,09 | 0,90 -> 1,57 / 1,71 / 1,69 | 0,51/0,21/0,13 -> 0,99/0,94/0,82 | OK x3 |
| planer wojny (2/5/8) | 1,00 -> 1,85 / 3,28 / 3,93 | 0,78 -> 1,23 / 1,76 / 2,01 | 0,52/0,21/0,13 -> 0,94/0,74/0,55 | OK x3 |

- Budżet/ruch PO ~0,8 (AI) i ~0,9 (barb) budżetu: koszt terenu zjada resztę, zgodnie z truncatePathWithinBudget (MIN-MOVE).
- Część jednostek nie rusza się (bez ruchu 13-73%): cele/ataki/zajęte heksy. Przyczyna NIE_ZMIERZONO per jednostka.
- Barbarzyńcy B=8: 73% bez ruchu; przyczyna NIE_ZMIERZONO (nie badano).

Czas (mediana 6 powtórzeń, PO/PRE):
- tura 1 (ten sam stan): AI 1,11 / 1,29 / 1,44; barb 1,04 / 0,99 / 1,36; planer 0,88 / 1,21 / 1,30.
- 8 tur: AI 0,98 / 3,53 / 3,85; barb 0,79 / 0,50 / 0,43; planer 1,15 / 0,91 / 0,88.
- Bezwzględnie: ok. 2-3 ms na turę 1 dla 10 jednostek; 6-7 ms średnio na turę w 8 turach.
- Wzrost wielotury AI wynika z tego, że jednostki PO docierają do wroga w ciągu 2-3 tur i liczą ataki (PRE nie dociera). Hipoteza, NIE_ZMIERZONO (brak profilu). Narzut samego przycięcia (`truncatePathWithinBudget`, liniowy) nie jest widoczny w pomiarze egzekutora (0,06 ms PRE vs ok. 0,6-1,5 ms PO przy długich trasach: koszt computePath do dalszego celu, nie przycięcia).
- Wniosek: kryterium 3 (x1,3) spełnione dla tury 1 z marginesem poniżej 1,44 (B=8 AI), NIE spełnione dla wielotury AI (x3,5-3,9). Decyzja orkiestratora.

## Testy (HEAD r3)
- `ai-move-range-test.cjs`: 46 passed, 0 failed (A8 zmieniony na wolny cel = krok; A8b/A8c nowe; D1-D4 mutacje czerwone; F-AVG 1/2/5/8 = PO).
- `war-allin-capital-test.cjs`: 95 passed, 0 failed.
- `barbarzyncy-krazenie-test.cjs`: 249 passed, 0 failed.
- `ai-test.cjs`: 276 passed, 18 failed (baseline dispatchu bez zmiany).
- `logic-test.cjs`: 213/213 OK. `barb-city-behavior-test.cjs`: 178 passed, 0 failed. `barbarians-test.cjs`: 213 passed, 0 failed. `siege-ai-test.cjs`: 17 ok, 0 fail. `ai-city-capture-integration-test.cjs`: OK (14).
- `npx tsc --noEmit`: exit 0.
- Vite bezpośredni (`node node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-r3`): exit 0, 69 871 kB.

## BLOKADY (decyzje, nie techniczne)
1. Wielotura AI: czas x3,5-3,9 względem PRE (kryterium 3 wymaga x1,3). Decyzja: zaakceptować, czy szukać optymalizacji (cache ścieżek w decideAITurn).
2. Pliki poza dispatchową allowlistą (r2 pkt 10, zatwierdzenie orkiestratora): ai-move-range.ts (nowy), war-allin-capital-harness.cjs, barbarzyncy-krazenie-test.cjs.
3. Kolizje celu między jednostkami (r2 pkt 8): NIE_ZMIERZONO w pełnej turze; poza zakresem r3.

NASTĘPNY KROK: Evaluator r3 (bez zmian w kodzie poza tym commitem); Final Control po werdykcie.
DEPLOY/PUSH: NIE WYKONANO
