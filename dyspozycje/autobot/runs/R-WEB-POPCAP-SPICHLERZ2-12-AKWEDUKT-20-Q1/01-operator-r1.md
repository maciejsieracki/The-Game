STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-POPCAP-SPICHLERZ2-12-AKWEDUKT-20-Q1
GOAL: Drabinka limitu ludności 5 / Spichlerz I 8 / Spichlerz II 12 / Akwedukt 20 (decyzja właściciela 2026-11-04).

## ZMIANY/COMMIT
Commit: patrz SHA w odpowiedzi orkiestratorowi (ten plik jest w tym samym commicie). Baza: origin/main c4a541a27.
- `gra/data/econ-params.json`: nowy klucz `spichlerz_ii_prog_ludnosci` 12/12/12; `akwedukt_max_ludnosci` 12 -> 20/20/20; opisy zaktualizowane.
- `economy.ts`: pole `spichlerzIIProgLudnosci`, `cityPopulationCap(..., matrixDelta, maSpichlerzII=false)`: Akwedukt > Sp II > Sp I > bazowy. Górny clamp `14` (=12+2) zastąpiony `akweduktMax + 2`; bez tego Akwedukt 20 byłby ucięty do 14. Fallback gdy params bez klucza II: próg Sp I.
- `turn-economy.ts`: odczyt nowego klucza (domyślne 12 / 20).
- `population-growth-v85.ts` (żywa ścieżka): nowy parametr `maSpichlerzII` (z `builtIds.includes('spichlerz_ii')`; ulepszenie usuwa `spichlerz` z builtIds).
- `cityPanel.ts`: cap w panelu/tooltipach z parametrów (Sp I 8, Sp II 12, Akwedukt 20; zero hardkodów).
- `ai.ts`: tylko stała `AI_POP_CAP_WITH_GRANARY_II = 12` w `granaryPriorityBonus` (bez nowych heurystyk; bramek armii nie dotykano).
- Testy: nowy `gra/tools/popcap-spichlerz2-akwedukt20-test.cjs` (45 asercji: 3 trudności, wszystkie stopnie, kombinacje, delta macierzy, silnik v85 i legacy); zaktualizowane `akwedukt-popcap-test.cjs` (stałe 15 były nieaktualne już PRZED zmianą — test failował na baseline) i `spichlerz-cap-citypanel-wiring-test.cjs` (regex źródła przyjmuje 2 nowe argumenty).

ODCHYLENIE OD ALLOWLISTY (do oceny Evaluatora): `gra/src/main.ts` — 2 wywołania `cityPopulationCap` (HUD ~19889, auto-wyżywienie ~35602) dostały jeden dodatkowy argument `builtIds.includes('spichlerz_ii')`. Bez tego HUD i limit auto-wyżywienia liczyłyby Sp II = 8 (rozjazd z silnikiem). Zmiana to 2 linie, bez dotykania logiki AI/armii. Do cofnięcia, jeśli Evaluator uzna za naruszenie.

## ZAŁOŻENIA
Trudności płaskie (easy=normal=hard) dla Sp II i Akweduktu; wymagania budowy/epoka bez zmian; save/load bez zmian (cap z budynków); `ai.ts` nadal zwraca 0 bonusu dla miasta z Akweduktem (sufit 20 nie jest wąskim gardłem); wiki `wikiBundle.json` nie zawiera liczb capu Akweduktu/Spichlerza II (jedyna liczba: przestarzałe „6” bez Akweduktu — istniało przed zmianą, poza zakresem, NIE zmieniano). Komentarz w `society-params.json` o „pop 12 (cap)” to historyczny opis mnożnika — nie zmieniano (mechanizm nie zależy od capu).

## TESTY (logi `gate-*.txt`, każdy z `EXIT=`)
- tsc --noEmit: EXIT=0 (po zmianach).
- RED/GREEN: nowy test na baseline nie ma klucza/parametru (RED z konstrukcji); mutacja Sp II -> próg Sp I: 33 pass / 12 fail (test łapie); po przywróceniu 45/0.
- Regresje PRZED -> PO: akwedukt-popcap 1 fail -> 0; spichlerz-cap-citypanel-wiring 0 -> (po poprawce regexu) 12/0; population-growth-v85, -tempo, -v85-bonus, population-civ-matrix-wiring, empire-food-b5, spichlerz-hud-params-parity, spichlerz-panel-food-parity, spichlerz-drain-pipeline, spichlerz-drain-keys, pr141-population-behavior, auto-wyzywienie-population-growth-live-recalc: EXIT=0 przed i po. 
- Failujące PRZED i PO (niezmienione, poza zakresem): spichlerz-wzrost, spichlerz-widocznosc, spichlerz-deficyt-scalenie (diff logów PRZED/PO identyczny co do wyniku).
- NIE_ZMIERZONO: grupy `*civpedia*`, `*wiki*`, `*building*`, `*econ-params*` (nie uruchomiono; wiki/buildings.json niezmienione).

## POMIAR BALANSU (zadanie 3)
PEŁNA GRA 3 ziarna x 100 tur: NIE_ZMIERZONO — brak Chromium/Playwright browsers w środowisku, a `ai-city-count-sim.cjs` wymaga bundla vite + headless Chromium. Zamiast tego PROXY na prawdziwym `populationGrowth` (jedno miasto, stały netto żywności 8/15/25, 100 tur; `gate-balance-proxy.txt`), pop po 100 turach PRZED -> PO: Sp II: 8 -> 12 (przy netto 8/15/25); Akwedukt solo: 9->9 (netto 8), 12->12 (15), 12->16 (25); Akwedukt+Sp II: 12->15 (8), 12->20 (15), 12->20 (25; cap 20 w turze 54). Sp I i bez budynku bez zmian. Skala: przy dobrej żywności miasto z Akweduktem rośnie do 20 (+67% limitu), efekt na żywność/upkeep (większa ludność = większe zużycie 1/os.) NIE_ZMIERZONO w silniku. Skok nie jest sprzeczny z decyzją właściciela; DECYZJA_WYMAGANA nie zgłaszana, ale pomiar pełnej gry zalecany przed deployem.

## BLOKADY
Brak twardych. Pomiar pełnej gry wymaga Chromium (patrz wyżej).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ocena odchylenia main.ts, ponowne uruchomienie testów); po wdrożeniu REPIN Rust (`econ-params`, `city_population_cap`) — orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
