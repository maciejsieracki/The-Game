# R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 — obrona Operatora (runda 3, odpowiedź na zarzuty Evaluatora 125b480be)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (etap C2, obrona po FAIL Evaluatora r2)
GOAL: domknięcie C2 wg dispatchu: wpięcie równoważenia AI w turze, flaga, runner headless 15×3×150, test kar deficytu z wymuszonym minusem, mutacje pomiarowe. Ta runda naprawia defekty kodu i testów; runner headless NIE został wykonany.
BAZA: c459676af (kandydat r2). Branch lokalny: obrona-c-q1.
SHA KOŃCOWE: patrz sekcja ZMIANY-COMMIT (kod: d4586b689; raport: commit tego pliku).

## ZMIANY-COMMIT

- d4586b689 — `gra/src/main.ts`, `gra/tools/no-negative-stocks-c2-test.cjs`. Allowlista zachowana (tylko te dwa pliki + ten raport). Brak zmian w `gra/` poza wymienionymi, brak `npm run build/dev`.
- `gra/src/game/no-negative-stocks.ts` — bez zmian w tej rundzie.

## TESTY (surowe wyniki z tej rundy)

- `npx tsc --noEmit` (gra/): rc=0 (przed i po zmianach).
- `node tools/no-negative-stocks-c2-test.cjs`: **28 passed, 0 failed** (poprzednio 15/0; dołożono 13 asercji: kara deficytu z wymuszonym minusem, wiązanie z main.ts, brak martwego importu, sprzątanie marszu).
- `node tools/no-negative-stocks-ai-test.cjs`: 8 passed, 0 failed.
- `node tools/no-negative-stocks-test.cjs`: 25 passed, 0 failed.
- `node tools/no-negative-stocks-projection-test.cjs`: 49 passed, 0 failed.
- `node tools/gold-deficit-test.cjs`: 55 pass, 0 fail (bez zmian).

### Mutacje (każda przywrócona, sprawdzona `cmp` z kopią)

- M1: usunięcie `aiNnsHoldOwners.clear();` w main.ts → test: `FAIL: main.ts: aiNnsHoldOwners.clear() tuz przed petla bankowania AI`, wynik **27 passed, 1 failed** (rc=1).
- M2: usunięcie `clearPlannedMarch(unitId, true);` w disbandAiSupportUnit → **27 passed, 1 failed** (`FAIL: main.ts: disbandAiSupportUnit sprzata stan marszu`), rc=1.
- M3: w no-negative-stocks.ts `isNnsAiBalanceEnabled() &&` zastąpione `true &&` (flaga ignorowana w logice) → **27 passed, 1 failed** (`FAIL: flaga off: brak dzialania`), rc=1.

## ODPOWIEDZI NA ZARZUTY EVALUATORA

1. **PRZYJMUJĘ.** Runner `gra/tools/no-negative-stocks-headless-measure.cjs` NIE został napisany. Kryterium (a) NIE_ZMIERZONO. Powód: pomiar 15×3×150 wymaga żywego bundla i headless Chromium (wzorzec `measure-ai-trade-offer-frequency.cjs`: limit 480 s na przebieg, wznawianie przez profil), czyli 45 przebiegów po kilka minut plus hak diagnostyczny w main.ts. Nie zrobiono tego w tej rundzie. Status: NIE_ZROBIONE.
2. **PRZYJMUJĘ.** Brak pomiaru, że samo równoważenie nie eliminuje cywilizacji — kryterium (b) NIE_ZMIERZONO. Flaga istnieje (`setNnsAiBalanceEnabled`, domyślnie włączona), ale mutacja pomiarowa z flagą wyłączoną (kryterium d) nie była uruchomiona w grze. Zostaje zrobiona tylko mutacja w logice (M3).
3. **PRZYJMUJĘ — poprawka.** Dodano test kary deficytu przy WYMUSZONYM minusie skarbca w `no-negative-stocks-c2-test.cjs`: `advanceGoldDeficit` z `getOwnerTreasury = -3` daje licznik 1→2→3, atrycję HP dopiero po karencji 3 tury, zerowanie po wyjściu na plus; `applyGoldDeficitStatMultToCombatUnit` daje staty ×0,75 i pancerz bez zmian. Dowód: 28/0 (sekcja TESTY). To jest test ścieżki kary (nie runner tury), więc kryterium (c) w sensie „w trakcie tury” nadal nie jest zamknięte pomiarem.
4. **PRZYJMUJĘ — poprawka + częściowo NIE_ZROBIONE.** Martwy import `isNnsAiBalanceEnabled` usunięty z main.ts (test wymaga jego nieobecności). Mutacja pomiarowa flagi w logice (M3) daje FAIL. Mutacja pomiarowa w grze (flaga off → minusy w pomiarze) NIE wykonana — zależy od runnera (pkt 1).
5. **PRZYJMUJĘ — poprawka.** Wstrzymania nie były czyszczone. Dodano `aiNnsHoldOwners.clear();` tuż przed pętlą bankowania AI w `runWorldEndTurn` (main.ts, przed `for (const oid of aiOwnerIds)`). Bankowanie (ustawienie wstrzymania) i sprawdzenie zakupów w `runAiPhase` są w tej samej turze (ZALOZENIE: `runAiPhase` jest wołany po bankowaniu w `runWorldEndTurn` i nie wykonuje bankowania ponownie; NIE_ZWERYFIKOWANE w grze, bez śladu w teście zachowania). Dowód: M1 → FAIL; statyczny test kolejności `clear` < bankowanie < `decideAiOwnerBalance`. Nie ma testu zachowania w grze (to byłby pomiar z pkt 1).
6. **ODRZUCAM część żądania „projekcja przed tickiem”; PRZYJMUJĘ problem resztkowy.**
   - Dispatch (00-dispatch-DODATEK, pkt C2.1) wymaga „projekcja po ticku (projectNnsAfterTick, raz na właściciela na turę)”, a nie projekcję przed tickiem. Obecny kod używa wartości po ticku (`aiSkarb`, `getEmpireFoodReserve(oid)`), co jest zgodne z dispatchem.
   - PRZYJMUJĘ jako ustalony defekt: skarbiec AI po bankowaniu tury może pozostać ujemny. W bloku bankowania celowo nie podłogujemy (komentarz KARA-Q1 PARYTET AI, main.ts ~39832), a rozwiązanie jednostek wsparcia NIE zwraca złota (`disbandAiSupportUnit` nie dodaje Pieniądza). Wstrzymanie zakupów i rozwiązanie działają w tej samej turze, ale nie podnoszą skarbca z powrotem do zera. Kryterium „≥0 po każdej turze” NIE jest spełnione przez ten etap. Naprawa wymaga decyzji projektowej (zwrot złota z rozwiązania lub prognoza przed tickiem z podatkami) — NIE_ZROBIONE, do decyzji orkiestratora.
7. **PRZYJMUJĘ — częściowo NIE_ZROBIONE (dźwignie niewpięte).**
   - (a) wstrzymanie zakupów: WPIĘTE.
   - (c) rozwiązanie jednostek wsparcia: WPIĘTE (tylko cywilne, poza garnizonem i oblężeniem).
   - (b) podatki przez `decideAIEconomySliders`: NIE wpięte. Funkcja wymaga `AiSliderInputs` (m.in. `lastSliderChangeTurn`, cooldown per właściciel) i jej wejścia nie są składane w punkcie bankowania. NIE_ZROBIONE w tej rundzie.
   - Wstrzymanie kolejki budowy (`wstrzymania: []`) i dźwignia spichlerza (głód/żywność) NIE wpięte. NIE_ZROBIONE.
8. **PRZYJMUJĘ jako ograniczenie (bez zmiany kodu w tej rundzie).** Koszt dźwigni rozwiązania to przybliżenie: `utrzymanieJednostki / liczba cywilnych jednostek`, identyczne dla wszystkich jednostek, więc „najdroższe” nie są rozróżniane przy wybieraniu. ZALOZENIE: przybliżenie jest akceptowane do czasu pomiaru; dokładny koszt per jednostka to osobny temat. Rozwiązywane są tylko jednostki cywilne (wsparcie wojskowe nie jest rozwiązywane) — zgodnie z dispatchem („najdroższe jednostki wsparcia”, nigdy jednostki obronne).
9. **PRZYJMUJĘ — poprawka.** `disbandAiSupportUnit` wywołuje teraz `clearPlannedMarch(unitId, true)` (ta sama ścieżka, którą gracz ma w `disbandPlayerUnit` przez `clearPlannedMarch`), więc `plannedMarches`, `marchAttackTargets`, `marchStopNotified`, `marchStopDetail` nie zostają z martwym wpisem. JSDoc `disbandPlayerUnit` przywrócony nad własną funkcją (błędna kolejność usunięta). Dowód: M2 → FAIL; tsc rc=0.
10. **PRZYJMUJĘ.** Brak testu turowego AI (headless ani w grze). Test `no-negative-stocks-c2-test.cjs` jest asercyjny (logika pure + statyczne wiązanie z main.ts). Test zachowania tury wymaga runnera (pkt 1) — NIE_ZROBIONE.
11. **PRZYJMUJĘ** (potwierdzenie): raport C2 nie deklaruje PASS dla kryteriów a–d.

## BLOKADY

- Runner headless 15 AI × 3 ziarna × 150 tur: NIE_ZROBIONE (kryteria a, b, d — NIE_ZMIERZONO).
- Mutacja pomiarowa flagi w grze (flaga off → minusy w pomiarze): NIE_ZROBIONE.
- Podatki (`decideAIEconomySliders`), wstrzymanie kolejki budowy, dźwignia spichlerza: NIE_ZROBIONE.
- Skarbiec AI po tickach może pozostać ujemny (brak zwrotu złota z rozwiązania, brak projekcji przed tickiem): kryterium „≥0 po turze” NIE spełnione przez C2 (pkt 6).
- Brak `npm run build/dev` (zakaz). Żaden pomiar w grze nie został wykonany; NIE_ZMIERZONO tam, gdzie nie zmierzono.

## UWAGI-DLA-ORKIESTRATORA

- Runner 45 przebiegów jest osobnym tematem (wzorzec: `measure-ai-trade-offer-frequency.cjs`, wznawianie przez MEAS_PROFILE, limit 480 s na przebieg). Wymaga hooka diagnostycznego w main.ts (licznik skarbca/spichlerza po turze) i decyzji, czy hak jest dopuszczalny w gra/src.
- Decyzja projektowa do właściciela (kandydat ABC): czy rozwiązanie jednostek ma zwracać złoto/surowce, czy stan ujemny po tickach ma być dopuszczony do czasu następnej tury AI.
- Wstrzymanie zakupów w tej rundzie jest liczone dla AI po ticku; bramka gracza (podtemat B, `canPlayerInitiateEndTurn`) nie była dotykana.

## RUNDY

3/5 (ten sam ID). Poprzednie: r1 (ecb341abe, FC FAIL), r2 (c459676af, Evaluator FAIL 125b480be).
Ostatni werdykt Evaluatora: FAIL (11 zarzutów).

## NASTĘPNY KROK

Evaluator r3 na commicie kodu d4586b689 + commit tego raportu: sprawdzić wynik 28/0, trzy mutacje (M1–M3) oraz odpowiedzi 1–11. Runner headless i dźwignie (b), kolejki i spichlerza są poza zakresem tej obrony i wymagają osobnego tematu lub decyzji orkiestratora.

DEPLOY/PUSH: NIE WYKONANO
