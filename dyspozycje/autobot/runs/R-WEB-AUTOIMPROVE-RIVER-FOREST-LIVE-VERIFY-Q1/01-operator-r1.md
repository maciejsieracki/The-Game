STATUS: PASS-WITH-NOTES (diagnoza + dowód na żywej grze; poprawka AI przygotowana jako patch POZA allowlistą — niezacommitowana w src)
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTOIMPROVE-RIVER-FOREST-LIVE-VERIFY-Q1
GOAL: dowieść w realnym `endTurn` (Chromium, `?civTest=1`), że las przy rzece na polu obywatela jest wycinany w pierwszej możliwej turze (Żywność, Zrównoważony, AI) albo znaleźć i naprawić przyczynę.

ZMIANY/COMMIT: nowe narzędzie pomiarowe `gra/tools/autoimprove-river-forest-live-verify-q1.cjs` (tylko odczyt przez `window.__civTest`; zero zmian w `gra/src`), dowody w `runs/<ID>/evidence/*.json`, `proposed-ai-sibling-exclusion.patch`, logi `gate-*.txt`. SHA: patrz commit tego raportu (git log -1 na gałęzi worktree). Baza: origin/main ee269b6ed. Bundle vite zbudowany POZA repo (scratchpad), usunięty po pracy; node_modules usunięty.

WYNIKI (żywa gra, seedy 18/7/42, mapa Malenki, 3 miasta gracza, 100% Pracy, tech odblokowane):
1. Gracz, pola z obywatelem NA lesie przy rzece (Łąka/Równina), obsadzone przez hak `setCityWorkers` (seed 18, 9-10 pól):
   - Żywność: wszystkie 9 wyciętych w PIERWSZEJ turze (turn 1->2). KROK 0 działa w realnej ścieżce `main.ts`.
   - Zrównoważony: 0 wyciętych w turze 1, 10 w turze 2 (opóźnienie o 1 turę). Przyczyna zmierzona: KROK 1 (niedobór drewna) postawił w turze 1 sześć tartaków (`layerCounts`: tartak 0 -> 6) i `auto-improvements.ts:~879` (`deficitPicks.length > 0 ? []`) pomija wtedy wycinkę rzeczną. Opóźnienie = 1 tura na starcie gry; w dalszych turach 0 chybień (seed 18, 25 tur). NIE_ZMIERZONO: częstość w grze >30 tur (niedobór drewna zwykle znika po turze 1-2).
2. Gracz, obsadzenie AUTO (jak w prawdziwej grze, seedy 18/7/42): w terytorium jest 66/43/64 heksów las+rzeka+baza pod farmę, ale obywatele stoją na nich odpowiednio 4/0/0 (auto-rozdział wg plonów, `turn-economy.ts::resolveWorkedTiles`, las ma niski plon). Seed 18 Żywność: 4/4 wyciętych w turze 1 (0 chybień). Seedy 7 i 42: 0 wycinek w 22 turach, powód = „heks bez obywatela” (reguła SIMPLE-FOOD-RULE `hexAllowsKey`, `auto-improvements.ts:1879`). To jest najbardziej prawdopodobne źródło powtarzanego zgłoszenia właściciela: picker poprawnie czeka na obywatela, a auto-rozdział obywateli prawie nigdy nie ustawia go na lesie.
3. AI: dwie osobne przyczyny.
   a) PRAWDZIWY BŁĄD (potwierdzony): `ai.ts:~2800` liczy pola z obywatelami przez `workedHexCoordsForCity(..., undefined /*excludeHexKeys*/, civEra)`, a silnik/gracz podaje `computeLostToNearerSiblingByCity`. Gdy terytoria miast AI się nakładają (od ok. tury 20), zbiór AI różni się od realnego i picker odrzuca heksy faktycznie obsadzone („heks bez obywatela”). Pomiar seed 18, 28 tur, Żywność: heksy las+rzeka z obywatelem, niewycięte w 2 kolejnych turach, suma = 72 PRZED; 5 PO patchu (las rzeczny AI 325 -> 306 PRZED vs 325 -> 286 PO). Seed 42: 20 PRZED i 20 PO (to wczesne tury 1-7, bez decyzji pickera — NIE_ZMIERZONO powodu; prawdopodobnie bramka Pracy AI `ai.ts` `pracaAvailable <= pracaSurplusGate`).
   b) Patch: `proposed-ai-sibling-exclusion.patch` (ai.ts: nowe pole `improvementExcludeHexKeysByCity` w `AITurnOpts` i użycie w `workedHexKeysForAiCity`; main.ts: jedno przekazanie parametru). `ai.ts` NIE jest na allowliście dispatchu (wpis `ai-improvements*.ts` nie istnieje), więc NIE zacommitowałem go do `gra/src`; wymaga rozszerzenia allowlisty w rundzie 2.

TESTY:
- tsc --noEmit (czyste drzewo): EXIT=0 (`gate-tsc.txt`).
- Regresje na drzewie Z patchem (21 testów z listy): 17 EXIT=0; timeouty (124 przy 120 s): autoimprove-irrigation-after-farms, autoimprove-stages-q1, farma-cofnij-nieaktualny-wpis, tartak-wzgorze-las-real-render.
- Baza (bez patcha) dla tych 4: te same timeouty dla 3 z nich (140 s), farma-cofnij EXIT=0 (przy patchu timeout — NIE rozstrzygnięto, czy flake; powtórzyć w rundzie 2 z dłuższym limitem). Pliki: `gate-tests-patched.txt`, `gate-tests-baseline-timeouts.txt`.
- RED/GREEN Chromium dla poprawki, mutacje, zrzuty: NIE_ZMIERZONO (poprawka nie zacommitowana; brak zrzutów — metryka liczbowa zamiast wizualnej).

BLOKADY / DECYZJE WŁAŚCICIELA:
1. Auto-rozdział obywateli prawie nie obsadza lasu przy rzece, więc przy regule „tylko pod obywatelem” las nie jest wycinany (seed 7, 42: 0 w 22 turach). Naprawa to zmiana produktowa (okolica/turn-economy lub luzowanie reguły dla lasu rzecznego) — poza allowlistą i sprzeczna z ograniczeniem „tylko pola obywateli”.
2. Odroczenie przez KROK 1 (niedobór) w Zrównoważonym: 1 tura w typowym starcie (zmierzone na seedzie 18).
3. Allowlista nie obejmuje `ai.ts` — potrzebna zgoda na zacommitowanie patcha AI.

RUNDY: 1/5
NASTĘPNY KROK: orchestrator rozszerza allowlistę o `gra/src/game/ai.ts` -> runda 2: wdrożenie patcha, test RED/GREEN w Chromium (`autoimprove-river-forest-live-verify-q1.cjs`, metryka aiRfPersistMissed), powtórka regresji z dłuższym limitem; decyzja właściciela w sprawie pkt 1.
DEPLOY/PUSH: NIE WYKONANO
