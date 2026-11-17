# R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 — raport Operatora, runda 4/5

STATUS: PASS-WITH-NOTES (kod i testy gotowe; RYZYKO balansu z pomiaru weary40-sim wymaga decyzji właściciela, patrz UWAGI; pełna gra w Chromium NIE ZMIERZONO, zmierzono panel z prawdziwym silnikiem)
DOMAIN: GAME (dyplomacja, balans)
TEMAT: R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1
GOAL: cena pokoju = cenaStartPn (6000) × (1 − L), L = poziom zmęczenia pary; ta sama jedna cena na WSZYSTKICH ścieżkach (panel/audiencja, AI→gracz, AI↔AI dobrowolne, prośby AI↔AI, pokój wymuszony); miasta oddane = minimum pokrywające cenę; stolica nigdy; cena > 0 bez pełnego pokrycia = wojna trwa; cena 0 (L=1) = pokój bez miast (DR-1=A); brak stałych 615/185/554 jako ceny i brak progu min. 3 miast; wiki/Civpedia/komentarze spójne.
BAZA: 5bafaa3c335fc1e00a3ab5c68128e98c14808144 (kandydat r3).
ZMIANY/COMMIT: allowlista poniżej; SHA w polu `sha` odpowiedzi (jeden commit, jawne `git add` ścieżek).
RUNDY: 4/5
DEPLOY/PUSH: NIE WYKONANO

## Co zmieniono (gra/, kod)
- `src/game/war-weariness.ts`: `wearinessPeaceCashPn(level)` = round(6000×(1−clamp(L,0,1))) jedyną funkcją ceny. Usunięto `wearinessPeaceItemPw`, `wearinessPeaceX`, `stageCityLimit`, `offerMultiplier`, `wearyMilitaryShare` i pola `minMiastPoOddaniu`, `mnozniStopni`, `mnoznikNaOdrzucenie`, `maxMiastNaPokoj`. Oferta dobrowolna: `required = price.requiredPn`, `maxCities = ownCities` (0 gdy bitwa w toku), akceptacja wymaga `priceCovered = priceZero || plan.full`. Pokój wymuszony: `cityCap = ownCities`, przy cenie > 0 bez `forcedPlan.full` → brak pokoju. `planEscalatedPeacePayment` zostaje jako alias `planCityPeacePayment`.
- `src/game/diplomacy-ai-forced-peace.ts`: `planCityPeacePayment` (zachłannie: najtańsze miasto pokrywające resztę, w przeciwnym razie największe; pomija zakazane/stolicę; zwraca items/coveredPn/shortfallPn/full). Tick AI↔AI i `decideAiPeaceRequest` (kind 'pokoj') zwracają 'wait' bez pełnego pokrycia także po limicie tur.
- `src/game/ai.ts`: usunięto `AI_MIASTO_CENA_POKOJU_PN` (615), `AI_MIASTO_PRZEKAZ_MIN_MIAST`, `aiPickMiastoDoOddania`, blok desperacji/mnożnika. Nowe `aiPlanMiastaDoOddania(miasta, eks, cenaPn)` (minimum miast pokrywających cenę, `full`) i `aiPickMiastoDoZadania(miastaPartnera, cenaPn)` (null przy cenie 0). Oferta AI→gracz używa `wearinessPeaceCashPn(poziom pary)`; komenda niesie `dodatkoweMiasta` gdy trzeba kilku miast.
- `src/game/diplomacy-proposals.ts`: R5 (gracz→AI): `cenaWymaganaPn = actionId === 'pokoj' ? cenaPokojuPn : basePnCfg × mnożnik` (rozejm ma własną bazę i NIE podlega malejącej cenie pokoju); silniejsza AI wymaga miasta o wartości ≥ ceny (komunikat: „cena pokoju maleje ze zmęczeniem wojną”). Gałąź AI→gracz: `basePn = aiToPlayerCenaPn` tylko dla pokoju; pomocnik `aiOfferedCityItems`. Komentarze poprawione.
- `src/ui/diplomacyAcceptanceBalance.ts`: nowy `peacePriceRowHtml` („Cena pokoju: N PN (zmęczenie X%) — maleje z turami wojny” albo „0 PN … pokój bez oddawania miast”); stare wiersze Z usunięte. `diplomacyAudience.ts`, `main.ts`: rozszerzony typ `wearinessInfo.cenaPokojuPn?`; prośby AI↔AI i tick z ceną `wearinessPeaceCashPn`.
- `src/game/diplomacy-war-peace-profile.ts`: komentarze 615 (615 zostaje wyłącznie jako bramka relacji).
- `data/war-weariness-params.json`: sekcja `cenaPokoju.cenaStartPn = 6000`; usunięte parametry `mnozniStopni`, `mnoznikNaOdrzucenie`, `maxMiastNaPokoj`, `minMiastPoOddaniu`; przepisane opisy `_progi`, `_wyczerpanie`, `_LIVE_AUDIT_Q1`, `_pozycjaPW`.
- Dokumentacja: `docs/encyklopedia/pojecia/zmeczenie-wojna.md`, `rozejm-pokoj.md`; `src/data/wikiBundle.json` zregenerowany (`node tools/bundle-wiki-for-game.cjs`).

## Decyzje właściciela użyte
- DR-1 = A: przy L=1 cena = 0, pokój bez miasta; bez minimum ceny.
- DR-2: jedna cena wszędzie; bramka relacji (basePnCfg×mnożnik > 0) daje cenę 0 jak dotąd.

## Tabela (a) — z uruchomienia kodu (`node tools/diplo-peace-price-table-a.cjs`; miasto = 1840 PN, stolica zakazana, bez progu 3 miast)
| L | cena PN | N=1 | N=2 | N=3 | N=5 | N=8 |
|---|---|---|---|---|---|---|
| 0 | 6000 | 0 oddane (brak pokrycia → wojna) | 1 (1840, brak pokrycia → wojna) | 2 (3680, brak pokrycia → wojna) | 4 (7360, nadpłata 1360) | 4 (7360, nadpłata 1360) |
| 0,25 | 4500 | 0 | 1 (1840, wojna) | 2 (3680, wojna) | 3 (5520, nadpłata 1020) | 3 |
| 0,5 | 3000 | 0 | 1 (1840, wojna) | 2 (3680, nadpłata 680) | 2 | 2 |
| 0,75 | 1500 | 0 | 1 (nadpłata 340) | 1 | 1 | 1 |
| 1 | 0 | 0 (pokój bez miast) | 0 | 0 | 0 | 0 |
Uwaga: „oddane” liczy miasta w planie; pokój zapada tylko gdy pokrycie ≥ cena (lub cena 0). Przy małej liczbie miast i wysokiej cenie wojna trwa (zgodnie z GOAL).

## Testy (wszystko uruchomione na końcowym stanie, poza wskazanymi)
- `tsc --noEmit`: exit 0.
- Nowy `tools/diplo-peace-price-production-paths-test.cjs`: PASS=15 FAIL=0 — 4 scenariusze produkcyjne (A panel/R5, B AI→gracz, C prośby AI↔AI, D tick dobrowolny i wymuszony) wywołują prawdziwy kod (esbuild), plus 11 mutantów (M1–M11) wszystkie wykryte.
- Rodzina testów dyplomacji/zmęczenia (37 plików): zielone, m.in. ai-war-weariness-peace 96/0, diplo-weariness-pw-behavior 147/0, diplo-peace-price-decay 12/0, diplo-peace-price-wiring 14/0, as-pw-peace-item 39/0, truce-r1 31/0, city-cession-r3 79/0, json-descriptions-sync 19/0. Testy `*-live-test` (diplo-truce-live, diplo-truce-ai-table-live, diplo-truce-saveload-live, diplo-war-peace-live, diplomacy-city-cession-live) przekroczyły limit 120 s w tym środowisku: NIE ZMIERZONO (nie porównano z bazą).
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 20/20, research-test 33/33, unit-replace-test 21/21, combat-test 6/6.
- Chromium (xvfb, vite + prawdziwy evaluateProposal i renderer): `node tools/pw-weary-table-browser-test.cjs` PASS — ceny z silnika po 11/20/30/40 turach wojny: 4350 / 3000 / 1500 / 0, wiersz „Cena pokoju …” widoczny w DOM, brak starego wiersza Z; zrzuty w /tmp/peace-shots (poza repo). NIE ZMIERZONO: pełna gra z żywą wojną w przeglądarce. Cena „≈6000 w turze 1” NIE jest widoczna w panelu gracza, bo istniejąca reguła blokuje pokój/rozejm przez pierwsze 10 pełnych tur wojny („Pokój i rozejm dostępne po 10 pełnych turach wojny”); pierwsza widoczna cena to 4350 (tura 11, L=0,275).
- Baza dla porównań: kopia `git archive 5bafaa3c3` w /tmp/basegra (poza repo).

## Pomiar weary40-sim (E) — PRAWDZIWA funkcja ceny gry
`node tools/weary40-sim-measure.cjs --turns 150 --seeds 3 --variant both`. PO = kandydat, `wearinessPeaceCashPn(L)` + miasto 1840 PN + stolica zakazana; PRZED = kod i parametry bazy 5bafaa3c3 z proxy ceny udziałowej i miastem 15 PN. Model uproszczony (patrz nagłówek skryptu: wszystkie wojny od tury 1, siła = liczba jednostek, brak ekonomii). Parametrów gry nie zmieniano.
| ziarno | wariant | avgWarTurns | cityTransfers | eliminated | warsRunningAtEnd | miasta na koniec | maxShare |
|---|---|---|---|---|---|---|---|
| 1 | PO | 30,4 | 8 | 0 | 0 | 11/1/1/1/1 | 0,733 |
| 1 | PRZED | 25,5 | 4 | 0 | 0 | 4/4/2/1/4 | 0,267 |
| 2 | PO | 31,93 | 10 | 0 | 0 | 1/1/13/1/1/1 | 0,722 |
| 2 | PRZED | 25,07 | 4 | 0 | 0 | 1/2/4/4/4/3 | 0,222 |
| 3 | PO | 29 | 6 | 0 | 0 | 9/1/1/1 | 0,75 |
| 3 | PRZED | 19 | 0 | 0 | 0 | 3/3/3/3 | 0,25 |
Wniosek: wszystkie wojny kończą się pokojem (0 trwających na koniec), brak eliminacji (stolica chroniona), wojny trwają ~30 tur (PRZED ~19–25). ALE RYZYKO snowballa: w PO najsilniejsza cywilizacja kończy z 72–75% miast (PRZED 22–27%), pozostali z 1 miastem (stolicą). Przyczyna: cena 3000–4350 PN przy mieście ~1840 PN zmusza przegrywającego do oddania 2 miast na wojnę, a w modelu jedna cywilizacja wygrywa wszystkie pary. Ograniczenie modelu: wartość miasta 1840 PN to jedna wycena; realna wycena zależy od obywateli/budynków.

## Błędy znalezione i naprawione w tej rundzie
- Rozejm w R5 błędnie dostawał malejącą cenę pokoju → `cenaWymaganaPn` tylko dla pokoju; testy truce-r1 (P8b, M2) dopasowane.
- Komunikat silniejszej AI mówił „zmęczenie nie obniża tej ceny”, a cena maleje → zmieniony na „cena pokoju maleje ze zmęczeniem wojną”.
- Stare asercje regexowe (`basePn = cenaPokojuPn`) w diplo-peace-price-wiring-test i as-pw-peace-item-test → `cenaWymaganaPn`.
- Tool `pw-weary-table-browser-*` i `weary40-sim-measure.cjs` przepisane pod nowy model (sim używa realnej ceny, wariant PRZED z kodu bazy `--basesrc`).

## UWAGI-DLA-ORKIESTRATORA
1. DECYZJA WŁAŚCICIELA (ABC): snowball w pomiarze — przy cenie 6000×(1−L) i mieście ~1840 PN zwycięzca zbiera 70–75% miast, przegrani zostają ze stolicą. Opcje: A zostawić (zgodnie z GOAL), B limit miast oddawanych na jeden pokój, C przeskalować wycenę miasta (to był wcześniejszy temat CITYSCALE). Nie zmieniałem parametrów.
2. Panel gracza: pierwsza widoczna cena to tura 11 (bramka 10 tur istniejąca wcześniej); decyzja czy skrócić bramkę — poza zakresem.
3. Parametry `czlowiek.*` (m.in. `rwProgBonusMax`, `minMiastAi`) w `war-weariness-params.json` zostają, ale są nieużywane w kodzie.
4. AI przy L=1 nie składa dobrowolnej oferty pokoju (cena 0, `peaceWeakerNoCityVsPlayer` bez zmian); pokój zapada w ticku wymuszonym (cena 0, bez miast).
5. Zgodność zapisów: cena liczona na bieżąco z poziomu zmęczenia, bez nowych pól w zapisie, bez migracji.
6. `wikiBundle.json` zregenerowany (22 rozdz. + 185 haseł). `json-descriptions-sync-test` i `diplomacy-city-cession-r3-test` nie dają się porównać na kopii bazy (brak obiektu commita w /tmp/basegra), zielone na kandydacie.
7. Dług Rust: REPIN modelu ceny pokoju (wearinessPeaceCashPn, planCityPeacePayment) w rust-port.

NASTĘPNY KROK: Evaluator (Sonnet) — przegląd diffu, uruchomienie nowego testu produkcyjnego i mutantów, decyzja właściciela w punkcie 1.
BLOKADY: brak blokad technicznych; niezmierzone: testy *-live (timeout 120 s), pełna gra w Chromium.
