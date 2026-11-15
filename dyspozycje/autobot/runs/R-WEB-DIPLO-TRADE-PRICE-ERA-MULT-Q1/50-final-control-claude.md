STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dyplomacja, wycena koszyka handlu surowcami)
TEMAT: R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 (Final Control, runda 4/5)
GOAL: blok handlu surowcem zależy od epoki UMOWY (wyższa z epok stron): Kamień 10 / Brąz 50 / Żelazo 100 szt. za ten sam PN; umowa cykliczna trzyma epokę z chwili zawarcia i nie jest obcinana po awansie.

ZMIANY/COMMIT: kandydat 7c92a5f25374f97d220023a6525f5ac01e9d9595 (kod 9f56ea8cf + raport obrony). Do integracji: 7c92a5f25374f97d220023a6525f5ac01e9d9595.
- Ancestry: origin/main = 807ecebdd3aba4774c478e87a18332c0f1276045 jest przodkiem kandydata (git merge-base --is-ancestor origin/main 7c92a5f25 => OK; origin/main..kandydat = 12 commitów, main..: 0 commitów wstecz). UWAGA: SHA bazy z zadania (8cd4b02a1) istnieje, ale NIE jest przodkiem kandydata; faktyczny origin/main to 807ecebdd (potwierdzony po git fetch) i to jest baza kodu zgodna z DODATKIEM 3.
- git diff --stat 807ecebdd..7c92a5f25: 22 pliki, +1671/-81; wszystkie w allowliście (gra/src/game/diplomacy*.ts, ai-trade-proposal.ts, gra/src/ui/diplomacyTradeBasket.ts + diplomacyNegotiationModal.ts, gra/src/main.ts, gra/data/econ-params.json, diplomacy-acceptance-points.json, gra/tools/diplomacy-trade-era-*, docs/encyklopedia, docs/PORADNIK-GRACZA, wikiBundle, runs/...). Brak WERSJE.md, manifestu, rust-port.

ZARZUTY EVALUATORA — WERDYKT FC:
1. Cykliczne umowy obcinane do 0 po awansie: ODDAL (naprawione). Pole epokaUmowy zamrażane przy zawarciu (buildHandelSurowiecCykliczny), self-heal w tickCyclicResourceTradeDeals (main.ts ~25353) przez cyclicSelfHealPakiety w epoce umowy/pary, min. 1 blok, bez zerowania; transfer jednorazowy (main.ts ~13416) w epoce pary. Dowód mutacyjny ZMIERZONY przeze mnie: cyclic-global => 49/2 czerwone, cyclic-nofreeze => 50/1 czerwone.
2. Pozostałe wywołania bez epoki umowy: ODDAL (naprawione). aiPeacePaymentAssets (main.ts ~38256) w payEra pary; pickResourceTradeRelOffer opakowany withDiplomacyTradeEra(dealTradeEraForOwners) (main.ts ~24410); computeQuickDealBasket opakowuje ziarno w epokę z input.tradeEra. Ścieżki diplomacy-resource-trade-pick.ts:62 i ai-balance:247 działają pod wrapperem wołającego (odczyt kodu; NIE zmierzono dynamicznie w pełnej grze).
3. computeQuickDealBasket bez tradeEra: ODDAL (UI podaje epokę jawnie, fallback = globalna epoka handlu ustawiana przez syncDiplomacyTradeEra; brak realnej ścieżki wycieku).
4. Podłoga 1 bloku vs limit 3x (150/300 szt. w Brązie/Żelazie): DO DECYZJI CZŁOWIEKA (realna decyzja produktowa, ABC właściciela; zgodne w PN, niezgodne w sztukach z literą limitu 3x). Nie blokuje integracji.
5. Dług Rust REPIN (pn_per_szt => pn_per_blok w gra/tools/.dip-audit-bundle.cjs i opisach rust-port): ODDAL do REPIN (poza allowlistą, informacyjnie).
Brak zarzutu w kategorii NAPRAW.

TESTY (ZMIERZONO samodzielnie na 7c92a5f25, po npm ci w gra/):
- tsc --noEmit: exit 0
- 5 bramek referencyjnych: logic-test 213/213; tech-tree-test 20/0; research-test 33/33 ALL GREEN; unit-replace-test 21/21; combat-test 6/6
- trade-era-table 185/0; trade-era-ai 14/0; trade-era-deal 14/0; trade-era-explicit 51/0
- trade-era-dom (realny Chromium, bundle esbuild poza repo): 58 pass / 0 fail (kroki 10/50/100, mieszane epoki, podgląd = bramka w epokach 2 i 3, onSubmit w epoce umowy, brak pageerror)
- diplomacy-value-catalog 82/0; acceptance-points 304/0; ai-offer-balance 29/0; ai-trade-proposal-to-player 25; ai-trade-need-from-surplus 12/0; ai-trade-oneshot-overpay-limit 10; ai-trade-qty-cap 18/0; ai-trade-proposal-branch 10/0; ai-trade-offer-frequency-up 28/0
- Dług bazowy (znany, bez pogorszenia względem liczb z raportu obrony i dispatchu): diplo-truce-r1 28/3, diplomacy-city-cession-r3 56/17, diplomacy-stol-pw-sum 167/1. NIE uruchamiałem ich na samej bazie 807ecebdd (liczby identyczne z raportem obrony); ocena „bez regresji” opiera się na identyczności liczb i na tym, że diff nie dotyka ścieżek tych testów (NIE ZMIERZONO na bazie).
- git diff --check: czysto (brak zmian w drzewie roboczym).
NIE ZMIERZONO: dynamiczny tick umowy cyklicznej w pełnej grze; trade-era-saveload-live (Chromium, pełna gra; wynik 5/0 i 8/0 z raportu obrony, nie powtarzany); pozostałe testy *-live.

BLOKADY: brak.
RUNDY: 4/5 (FC po Obronie r4).
LISTA ZAŁOŻEŃ DO POTWIERDZENIA PRZEZ WŁAŚCICIELA: (a) zapisy sprzed r4 bez pola epokaUmowy => epoka pary w pierwszym ticku, min. 1 blok; (b) epoki powyżej Żelaza = blok 100; (c) zarzut 4 (podłoga 1 bloku vs limit 3x w sztukach).

UWAGI-DLA-ORKIESTRATORA: po integracji sprawdź wikiBundle (regeneracja node tools/bundle-wiki-for-game.cjs, jeśli origin/main pójdzie dalej); REPIN Rust pn_per_szt => pn_per_blok; zadać ABC właściciela w sprawie zarzutu 4; po wdrożeniu wykonać pełny test saveload-live na świeżym buildzie. Wystarczy sprzątnąć node_modules w worktrees (wolne ~13 GB).

NASTĘPNY KROK: integracja orkiestratora (merge 7c92a5f25 do main, FF jest możliwy, bo origin/main jest przodkiem), build poza repo, deploy ROBOCZA po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
