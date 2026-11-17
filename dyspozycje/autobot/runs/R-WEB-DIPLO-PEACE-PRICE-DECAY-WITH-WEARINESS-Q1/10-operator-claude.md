# R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 — raport Operatora, runda 3/5

STATUS: FAIL (samoocena Operatora: zakres R3 tylko częściowo zrealizowany; patrz BLOKADY)
DOMAIN: GAME (dyplomacja, balans)
TEMAT: R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1
GOAL: cena pokoju = cenaStartPn × (1 − L), cenaStartPn = 6000, L = poziom zmęczenia pary; jedna funkcja ceny dla panelu, AI (dobrowolne, AI↔AI) i pokoju wymuszonego; bez progu min. 3 miast; stolica nigdy; wiki/UI zgodne.
BAZA: 76a1739fddb415edc2204c404e9aab43e6cf5b30 (origin/main), checkout --detach, bez merge kandydata bc67097a9.
ZMIANY-COMMIT: patrz sekcja „Commit” na końcu (SHA podany w polu sha odpowiedzi).

## Decyzje właściciela użyte w tej rundzie (DODATEK 2, ABC 2026-11-17)
- DR-1 = A: cena przy L=1 wynosi 0 i zostaje 0; pokój wymuszony przy cenie 0 zapada bez oddania miasta. Nie dodano minimum ceny.
- DR-2 = zgodnie z GOAL: jedna funkcja ceny używana wszędzie; bramka relacji daje cenę 0 jak dotąd.
- Pkt 6 FC (guard cashPn>0 && given==0 w remisie): zostawione jak w r2 (remis z ceną > 0 nie kończy wojny); w tej rundzie zmieniono warunek na „brak pełnego pokrycia” (patrz niżej).

## Zrealizowane (w kodzie, commit)
1. `gra/data/war-weariness-params.json`: sekcja `cenaPokoju.cenaStartPn = 6000`. Pole `przegrywajacy.minMiastPoOddaniu = 3` zostaje w JSON jako martwy parametr (opisany `_minMiastPoOddaniu`); nie steruje już żadną ofertą ani wymuszeniem.
2. `gra/src/game/war-weariness.ts`:
   - `wearinessPeaceCashPn(level)` = round(6000 × (1 − clamp(level, 0, 1))) — jedyne miejsce liczenia ceny.
   - `WearinessTickDeps.price(winner, loser, level)` dostaje poziom pary; tick przekazuje `lvl`.
   - Pokój wymuszony: cena z `wearinessPeaceCashPn(lvl)`, `cityCap = ownCities` (bez − 3); pokój zapada tylko gdy cena = 0 albo plan pokrywa cenę w całości (`forcedPlan.full`). Gdy cena > 0 i brak pełnego pokrycia (np. tylko stolica) → wojna trwa.
   - Oferta przegrywającego: `maxCities = min(limit stopnia, ownCities)` (bez − 3).
3. `gra/src/main.ts`:
   - Prośby AI↔AI (`tickAiAiPeaceRequests`, kind 'pokoj'): cena = `wearinessPeaceCashPn(poziom pary)`, gdy bramka relacji otwarta (dotychczasowe `aiAiPeaceRequiredPn(...) > 0`); rozejm bez zmian.
   - Tick zmęczenia AI↔AI (`tickAiAiWarWeariness`, w tym gracz↔AI): `requiredPn = relBasedPn > 0 ? wearinessPeaceCashPn(level) : 0`. Stałe 185/554 i minimum bilansu `aiAiPeaceRequiredPn` jako podłoga ceny odpadają w tych ścieżkach (bilans nadal sprawdza `isAiAiPeaceBalanceAllowed` przy akceptacji dobrowolnej).
   - Helper `aiAiPairWearinessLevel(a, b)`.
4. `gra/src/game/diplomacy-proposals.ts` (sciezka R5: gracz autor → AI respondent): `cenaPokojuPn = basePnCfg × priceMultiplier > 0 ? wearinessPeaceCashPn(wearyLevel) : 0`; pozycja Z (`wearinessPeaceItemPw`) nie jest liczona; `basePn = cenaPokojuPn` (cała cena miastami).
5. Dokumentacja: `docs/encyklopedia/pojecia/rozejm-pokoj.md` (cena maleje ze zmęczeniem, 615 PW usunięte z opisu, brak progu 3 miast), `docs/encyklopedia/pojecia/zmeczenie-wojna.md` (wiersz „Pokój wymuszony”, adnotacja martwego parametru). `gra/src/data/wikiBundle.json` zregenerowany przez `gra/tools/bundle-wiki-for-game.cjs` (wynik: „22 rozdz. + 185 haseł (~1318 KB)”).

## Tabela (a) z uruchomienia kodu
Źródło: `wearinessPeaceCashPn` i `planEscalatedPeacePayment` z `gra/src/game/war-weariness.ts` (skrypt pomocniczy poza repo, wejście: miasta po 1840 PN = wycena bez zmian, stolica oznaczona jako zakazana, `maxCities` = liczba miast przegrywającego). Kolumny: poziom L | miasta | cena PN | oddane miasta | pokryte PN | nadpłata PN | pełne pokrycie.

| L | miasta | cena PN | oddane | pokryte PN | nadpłata PN | pełne |
|---|---|---|---|---|---|---|
| 0,00 | 1 | 6000 | 1 | 1840 | 0 | nie |
| 0,00 | 2 | 6000 | 2 | 3680 | 0 | nie |
| 0,00 | 3 | 6000 | 3 | 5520 | 0 | nie |
| 0,00 | 5 | 6000 | 4 | 7360 | 1360 | tak |
| 0,00 | 8 | 6000 | 4 | 7360 | 1360 | tak |
| 0,25 | 1 | 4500 | 1 | 1840 | 0 | nie |
| 0,25 | 2 | 4500 | 2 | 3680 | 0 | nie |
| 0,25 | 3 | 4500 | 3 | 5520 | 1020 | tak |
| 0,25 | 5 | 4500 | 3 | 5520 | 1020 | tak |
| 0,25 | 8 | 4500 | 3 | 5520 | 1020 | tak |
| 0,50 | 1 | 3000 | 1 | 1840 | 0 | nie |
| 0,50 | 2 | 3000 | 2 | 3680 | 680 | tak |
| 0,50 | 3 | 3000 | 2 | 3680 | 680 | tak |
| 0,50 | 5 | 3000 | 2 | 3680 | 680 | tak |
| 0,50 | 8 | 3000 | 2 | 3680 | 680 | tak |
| 0,75 | 1 | 1500 | 1 | 1840 | 340 | tak |
| 0,75 | 2 | 1500 | 1 | 1840 | 340 | tak |
| 0,75 | 3 | 1500 | 1 | 1840 | 340 | tak |
| 0,75 | 5 | 1500 | 1 | 1840 | 340 | tak |
| 0,75 | 8 | 1500 | 1 | 1840 | 340 | tak |
| 1,00 | 1–8 | 0 | 0 | 0 | 0 | tak |

Uwaga do tabeli: przy L = 0 i 1–3 miastach pełnego pokrycia nie ma (pokój nie zapadnie w wymuszeniu; w ofercie dobrowolnej zależy od stopnia i bilansu). Nadpłata przepada (wariant B z FPBAL, bez reszty).

## Testy (surowe wyniki, uruchomione na tym commicie przed commitem)
- `node_modules/.bin/tsc --noEmit` → exit 0.
- Pięć bramek referencyjnych: `tools/logic-test.cjs` → „LOGIC OK (213/213)”; `tools/tech-tree-test.cjs` → „20 pass, 0 fail”; `tools/research-test.cjs` → „ALL GREEN”; `tools/unit-replace-test.cjs` → „WSZYSTKIE TESTY ZIELONE (21/21)”; `tools/combat-test.cjs` → „All sanity checks passed.” (wszystkie exit 0).
- Testy zmęczenia/pokoju (exit 0): `diplo-peace-price-decay-test` PASS=12 FAIL=0 (z candidate bc67097a9, bez zmian w treści); `diplo-peace-price-wiring-test` PASS=14 FAIL=0 (NOWY); `diplo-weariness-forced-peace-test` PASS=14; `diplo-weariness-forced-peace-wiring-test` 13/0; `diplo-weariness-city-only-test` PASS=30; `ai-war-weariness-peace-test` PASS=101; `diplo-weariness-as-pw-peace-item-test` PASS=194 FAIL=0 (zaktualizowane asercje (e) do nowego modelu); `diplo-weariness-pw-behavior-test` 147/0 (zaktualizowane (b3): cena 6000·(1−t/40) z odrzuceniem przy cenie > 0, pokój bez miast przy cenie 0); `diplo-weariness-20-turns-test` PASS=31; `diplo-weariness-migration-peak-test` PASS=7; `diplo-peace-ai-ai-nonnegative-test` 21/0; `diplo-peace-balance-accept-test` 32/0 (zaktualizowane C2: przy 120 turach cena 0 → pokój bez miast); `diplo-peace-stance-wiring-test` 10/0; `diplo-weariness-c615-both-cities-test` PASS=11; `diplo-weariness-display-test` ALL PASSED; `diplo-weariness-stages-view-test` 22/0; `diplo-weariness-pw-row-ui-test` 10/0.
- Zmiany w starych testach są zmianami oczekiwań wynikających z DR-1 i nowego modelu (nie osłabieniem sprawdzeń); każda ma komentarz z odwołaniem do decyzji.

## Symulacja (b) `gra/tools/weary40-sim-measure.cjs`
Uruchomiona domyślnie (`--variant both`, seedy 1–3, 150 tur, 4–6 cywilizacji) — wynik surowy zapisany w `scratchpad/weary40-after.txt`. Dla wariantów zwróconych przez skrypt:
- seed 1: wariant „po”: cityTransfers 4, eliminated 0, avgWarTurns 25,5, warsRunningAtEnd 0; wariant „przed”: cityTransfers 2, eliminated 0, avgWarTurns 10,4, warsRunningAtEnd 0.
- seed 2: „po”: cityTransfers 4, eliminated 0, avgWarTurns 25,07, warsRunningAtEnd 0; „przed”: cityTransfers 1, eliminated 1, avgWarTurns 9,27, warsRunningAtEnd 4.
- seed 3: „po”: cityTransfers 0, eliminated 0, avgWarTurns 19, warsRunningAtEnd 0; „przed”: cityTransfers 0, eliminated 0, avgWarTurns 9, warsRunningAtEnd 0.
NIE ZWERYFIKOWANO: co dokładnie oznacza wariant „przed” w skrypcie (nie sprawdzono, czy odpowiada bazie 76a1739). Wniosek surowy: średni czas wojny rośnie ~2–2,5× (z ~9–10 do ~19–25 tur), eliminacji brak w „po”. To jest pytanie do właściciela (patrz UWAGI).

## BLOKADY (niezrealizowane albo niepotwierdzone)
1. (e) Chromium / żywy podgląd ceny ≈6000 w t1 wojny i niższej po kilku turach: NIE ZMIERZONO.
2. (b) Wiki/Civpedia: zmienione tylko dwa hasła (rozejm-pokoj, zmeczenie-wojna); `gra/data/diplomacy.json` nie zawiera tekstów o cenie (sprawdzone grepem: brak „615/185/554/min. 3 miasta”). Komentarz w `gra/src/game/ai.ts:6617` („615, stała C”) nadal opisuje starą cenę — plik spoza allowlisty, nie zmieniono.
3. (b) Panel dyplomacji / audiencja: NIE zmieniono. Ścieżka info AI→gracz (`diplomacy-proposals.ts`, ok. l. 1436 `wearinessPeaceItemPw(basePnCfg, aiToPlayerLevel)`) nadal liczy pozycję Z (kwadratowa) i jest pokazywana w `ui/diplomacyAcceptanceBalance.ts` (wiersz „Zmęczenie wojną”). To NIE jest jeszcze jedna prawda ceny.
4. Funkcja `wearinessPeaceItemPw` i krzywa `wearinessPeaceX` zostają w kodzie (używane przez ścieżkę info AI→gracz); do usunięcia po pkt 3.
5. Pokój zmęczeniowy przy cenie > 0 bez pełnego pokrycia: teraz wojna trwa (wymuszony) — w ofercie dobrowolnej zachowano poprzednią logikę (oferta odrzucona, jeśli bilans nie domyka). Osobny test „tylko stolica + cena > 0 → wojna trwa” jest pokryty przez `diplo-peace-price-decay-test` (P-testy), nie przez test wywołań produkcyjnych.
6. Brak testu mutanta „powrót do 3 miast” dla nowej ścieżki main.ts (test wiringowy sprawdza obecność funkcji i brak `minMiastPoOddaniu` w ofertach/wymuszeniu, nie zachowanie w grze).
7. Nie wykonano `npm run build` (zakaz); `vite` nie uruchomiono.

## UWAGI-DLA-ORKIESTRATORA
- Pytanie ABC do właściciela (nowe, nie blokuje kodu): symulacja pokazuje dłuższe wojny (średnio ~19–25 tur zamiast ~9–10 w wariancie „przed”). Czy akceptujemy dłuższe wojny kosztem ceny 6000 na starcie, czy zmienić `pelneTur`/cenę startową?
- Pytanie ABC: w ofercie dobrowolnej przy cenie > 0 i pełnym braku miast przegrywający czeka dalej (poprzednia logika) — potwierdzić, że taka sama zasada ma obowiązywać w pokoju wymuszonym (obecnie tam, dla L < 1, wymuszenia nie ma; przy L = 1 cena = 0).
- Plik `.claude-cand.patch` (kopia patcha z bc67097a9) leży nieśledzony w korzeniu worktree; NIE jest częścią commita. Nie usunięto go (zakaz rm).
- `gra/node_modules` zainstalowano w worktree (`npm ci --ignore-scripts`), nie jest śledzony.
- Wiki/UI/Chromium wymagają osobnej rundy (R4) albo pracy orkiestratora przy merge; propozycja zakresu R4: panel/audiencja na `wearinessPeaceCashPn`, usunięcie `wearinessPeaceItemPw` z ścieżki info, ai.ts komentarz 615, Civpedia pozostałe hasła, Chromium (obejrzeć t1 ≈6000 i spadek).

## Commit
Commit obejmuje wyłącznie zmienione pliki (bez `git add -A`): 2 dokumenty, `war-weariness-params.json`, `wikiBundle.json`, `diplomacy-proposals.ts`, `war-weariness.ts`, `main.ts`, 9 testów `gra/tools/*.cjs` (8 zmodyfikowanych + 2 nowe), niniejszy raport.

RUNDY: 3/5 (Operator); bez zużycia rund Evaluatora.
NASTĘPNY KROK: runda 4 Operatora na pozostałe pkt (ścieżka info AI→gracz i UI, ai.ts komentarz, Civpedia, Chromium) albo decyzja ABC o długości wojen z pkt UWAGI; potem Evaluator/FC.
DEPLOY/PUSH: NIE WYKONANO
