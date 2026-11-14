# R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 — raport Operatora (runda 3/5, SONNET po 2 nieudanych rundach Haiku)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (podtemat C3: równoważenie AI PRZED tickiem + runner headless 15×3×150 + test turowy na realnym wywołaniu)
GOAL: od tury 11 skarbiec i spichlerz każdego AI >= 0 po każdej turze; równoważenie przed końcem tury (tańsze środki najpierw, potem rozwiązanie najdroższych jednostek wsparcia), nigdy eliminacja cywilizacji.

BAZA: kandydat r2 7ba58f0ec + merge origin/main (a5537f3ff; jedyny konflikt: `no-negative-stocks.ts`, rozstrzygnięty zachowaniem OBU bloków — C2 `decideAiOwnerBalance` i B `decideEndTurnGate`) + cherry-pick częściowej pracy przerwanego Operatora r3 (d2caabc3c, 923 linii) — każdy element ZWERYFIKOWANY od nowa (nie przyjęty na wiarę).

## ZMIANY-COMMIT
Commity na gałęzi worktree `r3-op-sonnet` (SHA czubka podany w polu `sha` wyniku): `a5537f3ff` (merge), `211cf2a07` (WIP przerwanego Operatora, zweryfikowany), commit końcowy (poprawki + pomiar + raport).
Allowlista: `gra/src/game/no-negative-stocks.ts`, `gra/src/main.ts` (pętla tury AI + hak `?civTest=1`), `gra/tools/no-negative-stocks-*`, runs/R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1/**. NIE ruszano `canPlayerInitiateEndTurn`/`nnsGateForPlayer`/`hud.ts`, `ai.ts` (nie było potrzeby), `WERSJE.md`, `gra-robocza/`, `rust-port/`.

Zarzuty FC r2 (1, 2, 4, 6, 7, 8, 10) — stan:
1. RÓWNOWAŻENIE PRZED TICKIEM — `nnsAiPreTickBalance` w main.ts wołane tuż przed `advanceCityEconomy` (nie po bankowaniu). Projekcja `projectTreasuryAfterTick` + `projectEmpireFoodAfterTick` raz na właściciela na turę; plan: (a) wstrzymanie zakupów/budowy (`aiNnsHoldOwners`), (b) podatek (Nauka -> Pieniądz, model zysku przez realne `previewCityEconomy` z podmienionym podziałem handlu, nie atrapa), (c) racje żywności (poziom/% rozwoju = 0, zysk liczony projekcją), (d) rozwiązanie jednostek od NAJDROŻSZEJ per jednostka (koszt utrzymania per typ, nie średnia), (e) przeliczenie projekcji po planie (do 4 iteracji) i zapis wyjątku z przyczyną gdy nadal < 0. Suwaki/racje przywracane na początku następnej tury (tylko gdy nikt ich w międzyczasie nie zmienił). Rozwiązanie jednostki usuwa też wpis z `econUnits`, więc realny tick liczy bez niej.
2. RUNNER `gra/tools/no-negative-stocks-headless-measure.cjs` — wznawialny (punkt kontrolny co 10 tur + quickSave przy limicie czasu), tryb przyspieszony (`skipRender`), mutacja `--modes on,off`, klasyfikacja wyjątków. Wyniki w `pomiar-r3/`.
3. TEST TUROWY `gra/tools/no-negative-stocks-c3-turn-test.cjs` na realnym wywołaniu (bundle vite + Chromium, realne „Zakończ turę”): scenariusz 40 dodatkowych jednostek + skarbiec 0.
4. WYDAJNOŚĆ — zmierzona w runnerze (sekcja WYDAJNOŚĆ).
6/7. Martwe dźwignie: `wstrzymania` w `buildAiLevers` zostało opcjonalne i NIEUŻYWANE jako dźwignia salda (wstrzymanie zakupów jest flagą per tura, nie pozycją w planie — nie zmienia salda ticku, chroni następną turę); dźwignie `podatek-skarbiec` (rzeczywisty zysk z projekcji) i `suwak-zywnosc` (nowa, rzeczywisty zysk) są WPIĘTE; `wstrzymania: []`/`podatekSkarbiec: 0` jako atrapy usunięte.
8. Stare zapisy: bez zmian po stronie AI (decyzja orkiestratora dotyczy gracza, B).
10. Czyszczenie wstrzymań per tura: `aiNnsHoldOwners.clear()` na początku `nnsAiPreTickBalance` (r2: przed bankowaniem — przeniesione razem z równoważeniem).

Dodatkowe zmiany tej rundy (poza WIP):
- `main.ts`, hak `?civTest=1` `__nnsMeasureDebug`: `refoundPlayerAnywhere` (bierny gracz bywa podbity — przenosi punkt startu na pierwszy wolny hex i zakłada miasto; klucz hexa parsowany z `"q,r"`, wcześniejsza wersja iterowała po `h.q/h.r` i nie znajdowała nic — błąd znaleziony pomiarem `tried=0`), `disbandPlayerUnits` (bramka „Zakończ turę” gracza z podtematu B zatrzymuje turę, gdy prognoza gracza < 0 i istnieje ruch naprawczy; runner wykonuje ruch naprawczy — rozwiązuje partie jednostek gracza i woła `markCityStateDirty`, bo cache prognozy bramki jest dirty-gated), `debugKillPlayer` (pomoc diagnostyczna). Hak istnieje WYŁĄCZNIE z `?civTest=1`; w produkcji brak powierzchni.
- Runner: klasyfikacja `ciągły dług` vs `nowy minus`, `longestChainTurns`, flaga `cityState` w eliminacjach, diagnostyka odrodzenia gracza, 12 prób końca tury zamiast 6.

## TESTY (surowe wyjścia, na zmienionym drzewie)
- `npx tsc --noEmit` (gra/): rc=0, bez komunikatów (po ostatniej zmianie main.ts).
- `node tools/no-negative-stocks-test.cjs`: 25 passed, 0 failed
- `node tools/no-negative-stocks-projection-test.cjs`: 49 passed, 0 failed
- `node tools/no-negative-stocks-ai-test.cjs`: 8 passed, 0 failed
- `node tools/no-negative-stocks-c2-test.cjs`: 43 passed, 0 failed (decyzja, kara deficytu przy WYMUSZONYM minusie, wiązanie statyczne z main.ts)
- `node tools/no-negative-stocks-c3-turn-test.cjs --dist <bundle>`: `16 passed, 0 failed` (czas 1 min 10 s). Wynik ON: AI z 40 dodatkowymi jednostkami i skarbcem 0 — po turze skarbiec 16,2 (>= 0), `bank.glod=false`, 41 akcji równoważenia, `pokryte=true`; mutacja OFF (flaga wyłączona): skarbiec -163, spichlerz surowy -152, `glod=true`, licznik kar deficytu rośnie (test czerwieni się bez równoważenia).
- Bramki: `logic-test` 213/213, `tech-tree-test` 20/0, `research-test` 33/33, `unit-replace-test` 21/21, `combat-test` 6/6, `unit-power-test` 6 pass/0 fail (uruchomione przed ostatnią zmianą hooków `?civTest=1`, które nie wpływają na logikę tych testów; `tsc` uruchomiony po niej).
- Bundle: `node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist` (poza repo; NIE `npm run build`).

## POMIAR HEADLESS (kryterium a, b, d) — surowe liczby: `pomiar-r3/summary.json`, `pomiar-r3/cell-*.json`
Konfiguracja: realny bundle, Chromium headless, `?civTest=1`, realne `triggerPlayerEndTurn`, mapa Standardowy, 15 typów cywilizacji (ZAŁOŻENIE: „15 cywilizacji AI” = `civTypesCount: 15` w menu; po odjęciu gracza i typów bez właściciela w świecie było 13 pełnych AI + 28 państw-miast na starcie, razem 41 właścicieli AI), ziarna 11, 33, 44. Ziarno 22 POMINIĘTE: generacja świata zawiesza stronę po założeniu pierwszego miasta (poza zakresem; do UWAG).
Gracz bierny (jedno miasto; dosypywane 5000 złota/turę); punkt kontrolny co 10 tur, kilka wznowień z quickSave (uwaga: znane #373 — wznowienie z zapisu nie jest deterministyczne, więc przebiegi po wznowieniu nie są bitowo powtarzalne; wniosek dotyczy własności „>= 0”, nie konkretnej trajektorii).

TRYB ON (równoważenie włączone), 150 tur każde, komórki ukończone (`done: true`, `partial: false`):
| ziarno | wierszy (tura>10, AI×tura) | wierszy < 0 | w tym „ciągły dług” | w tym „nowy minus” | najdłuższy ciąg tur | min skarbiec | min spichlerz surowy |
|---|---|---|---|---|---|---|---|
| 11 | 2403 | 170 | 168 | 2 | 20 | -217 | -4 |
| 33 | 2259 | 122 | 120 | 2 | 15 | -158 | 0 |
| 44 | 2260 | 158 | 157 | 1 | 12 | -158 | 0 |
- Wszystkie naruszenia mieszczą się w turach 11–30. Od tury 31 do 150: **0 naruszeń** w każdej z 3 komórek (min skarbiec 0/2/0, min spichlerz 0/1/1, 0 wierszy `glod`), czyli ~5145 wierszy AI×tura >= 0.
- „Ciągły dług” (445 z 450) = dług odziedziczony z tur wolnych 1–10 (reguła właściciela: tury 1–10 wolne; AI nie równoważy przed turą 11), którego nie da się spłacić w jednej turze: projekcja `skarbiecObecny + netto < 0` nawet przy podatku 100% i bez nadmiarowych jednostek. Równoważenie działa kolejno w każdej turze, dług maleje do zera (najdłuższy ciąg 20 tur). Na T11 w każdym ziarnie 19–27 właścicieli AI zaczyna z długiem. Wyjątki mają przyczynę w `exceptions[].przyczyna` (np. „dług powstały w turach wolnych 1-10”).
- „Nowy minus” (5 z 450; poprzednia tura >= 0): ziarno 11: T14 fenicjanie (skarbiec +322, głód wojska: surowy spichlerz -0,x przy braku dźwigni), T15 grecy (skarbiec 36, spichlerz -4, głód); ziarno 33: T16 państwo-miasto Grecy (skarbiec -2), T21 państwo-miasto Inkowie (-1); ziarno 44: T19 państwo-miasto Harappa (-3). Przyczyna we wszystkich 5: „brak dostępnych dźwigni” (po jednym obrońcy na miasto, wodzowie i oblegający nietykalni, podatek 100%, racje 0 wyczerpane) — odchylenie rzędu 1–4 jednostek, nie systematyczne.
- Eliminacje: 0 pełnych cywilizacji (`eliminated` bez `cityState:false`) we wszystkich 3 komórkach ON. Eliminowane są tylko państwa-miasta (26 w turach 22–23 w KAŻDYM przebiegu, także z wyłączonym równoważeniem — to reguła gry/barbarzyńców, nie skutek równoważenia; kolejne 0–2 później).
- Akcje równoważenia (łącznie 3 ziarna): podatek 527, racje 597, rozwiązanie jednostek 56 — czyli dominują tanie środki; rozwiązanie jednostek jako ostatnia deska.

TRYB OFF (mutacja pomiarowa: flaga wyłączona), 40 tur × 3 ziarna, porównanie na tym samym oknie tur 11–40:
| ziarno | wierszy | < 0 ON | < 0 OFF | nowy minus ON | nowy minus OFF | naruszenia spichlerza/głodu ON | OFF | min skarbiec ON | OFF |
|---|---|---|---|---|---|---|---|---|---|
| 11 | 738 | 170 | 405 | 2 | 15 | 2 | 76 | -217 | -642 |
| 33 | ~750 | 122 | 384 | 2 | 24 | 0 | 36 | -158 | -592 |
| 44 | ~750 | 158 | 416 | 1 | 18 | 0 | 24 | -158 | -519 |
Mutacja jednoznacznie pokazuje minusy (OFF: 53% wierszy < 0, spichlerz do -33; ON: 6,5%, wyłącznie dług z tur wolnych). Ranking: równoważenie nie eliminuje minusów odziedziczonych z tur 1–10, ale eliminuje powstawanie nowych i spłaca dług.

WYDAJNOŚĆ (kryterium 4): `nnsAiPreTickBalance` łącznie dla wszystkich AI na turę: średnio 375–395 ms (maks 750–936 ms), przy średnim czasie całej tury 26–28 s (headless, tryb przyspieszony) = ok. 1,4%. Projekcja raz na właściciela (+ projekcje próbne podatku/racji tylko gdy jest minus), nie O(owners²) na turę w tym miejscu (`projectEmpireFoodAfterTick` dostaje stan jednego właściciela). Koszt rośnie z liczbą miast AI (213 ms w T11 → 486 ms w T81 w jednym ziarnie).

## KRYTERIA — STAN
- (a) 15×3×150, od tury 11 skarbiec i spichlerz każdego AI >= 0: SPEŁNIONE WARUNKOWO. 6922 wierszy ON, 450 < 0, z czego 445 to ciągły dług z tur wolnych 1–10 i 5 to „brak dźwigni” (<= 4 jednostki); od T31 0 naruszeń. Ścisłe „0 naruszeń od tury 11” NIE jest spełnione i nie może być bez zmiany reguły tur wolnych dla AI (patrz UWAGI).
- (b) brak eliminacji przez równoważenie: SPEŁNIONE (0 pełnych cywilizacji; państwa-miasta znikają tak samo przy flagi OFF).
- (c) kary deficytu przy ręcznie wymuszonym minusie: SPEŁNIONE (c2-test 43/0 oraz c3-test: OFF -> licznik kar rośnie, ON -> nie wchodzą).
- (d) mutacja czerwieni test i pomiar: SPEŁNIONE (c3-test OFF; pomiar OFF 1215/2290 wierszy < 0 vs ON).
- (e) tsc 0, bramki, testy ekonomii zielone: SPEŁNIONE (wyżej).

## BLOKADY
Brak blokad technicznych. Ograniczenia pomiaru: ziarno 22 zawiesza stronę (pominięte, zastąpione 44); bierny gracz bywa podbity (1–3 odrodzenia na komórkę; pomiar AI trwa dalej); wznowienia z zapisu niedeterministyczne (#373); czas jednej tury rośnie do ~50 s po T90 (known PERF, nie z równoważenia).

## UWAGI-DLA-ORKIESTRATORA
1. DECYZJA PRODUKTOWA (ABC): dług odziedziczony z tur 1–10 (19–27 właścicieli AI na T11) powoduje 445 z 450 naruszeń. Opcje: A) bez zmian (dług spłacany ~12–20 tur); B) AI równoważy się od tury 1 (rekomendacja: parytet reguł „nigdy poniżej zera” dla AI bez uciążliwości dla gracza; jedna stała `NNS_AI_BALANCE_TURN_MIN`); C) ręczne wyzerowanie długu AI na T11 (sztuczne, niezalecane).
2. Ziarno 22: po założeniu pierwszego miasta gracza strona przestaje odpowiadać (nie zbadano; może być osobnym tematem R-WEB-*).
3. Czas tury rośnie do 50–60 s po T90 przy 13 AI (headless, tryb przyspieszony) — znane R-WEB-PERF-LATE-GAME; wpływa na koszt pomiarów (jedna komórka 150 tur ≈ 1 h).
4. Bramka gracza (B) zatrzymuje turę biernego gracza przy prognozie spichlerza < 0, mimo dosypanego złota; runner omija to ruchem naprawczym. Warto sprawdzić w B, czy komunikat/ruch naprawczy działa dla spichlerza, gdy gracz nie ma już jednostek (był przypadek: blokada utrzymywała się do czasu `markCityStateDirty` — cache prognozy dirty-gated nie odświeża się po bezpośredniej zmianie tablicy jednostek; w grze zmiany idą przez funkcje oznaczające stan, więc to nie błąd gry).
5. Odrodzenie gracza po wczytaniu zapisu: `playerEverOwnedCityByOwner` nie jest w zapisie, więc po wczytaniu gry i utracie ostatniego miasta gra wraca do trybu „pierwsze miasto tylko w kręgu startu” (obserwowane w pomiarze, `awaiting=true` mimo gry w toku). Potencjalny błąd (poza zakresem).

RUNDY: 3/5
NASTĘPNY KROK: Evaluator (Sonnet) — zweryfikować pomiar (`pomiar-r3/summary.json`), klasyfikację „ciągły dług”/„nowy minus”, ABC z UWAGI nr 1.
DEPLOY/PUSH: NIE WYKONANO
