STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-GRANARY2-PISMO-ROYAL-RENAME-Q1
GOAL: Spichlerz II (id spichlerz_ii) dostaje technologię odblokowującą „Pismo” (zamiast Garncarstwo) i nazwę wyświetlaną „Spichlerz Królewski”; id i logika bez zmian.
ZMIANY/COMMIT: baza origin/main 3aa1b3a2a. Zmienione pliki (allowlista): gra/data/buildings.json (nazwa, techUnlock=Pismo tylko dla spichlerz_ii, wymagania/uwagi/opis/top3; wzmianki w top3/uwagach Spichlerza I przemianowane na nową nazwę), gra/data/tech.json (Pismo: „Odblokowuje budynek” = „Biblioteka; Spichlerz Królewski”), gra/src/ui/empireDetailTypes.ts (uchwała „Solanka zapasowa”: opis, źródło), gra/src/ui/hud.ts (tooltip uchwały), gra/src/data/wikiBundle.json (5 wystąpień nazwy), gra/tools/granary2-tech-data-guard-test.cjs (oczekiwana technologia Pismo, opisy testów). Commit: 4188954d6 (zmiany kodu i danych; ten plik raportu w commicie następnym).
TESTY:
- granary2-tech-data-guard-test: PASS 14 / FAIL 0 (EXIT=0)
- tsc --noEmit (po npm ci --ignore-scripts): EXIT=0
- spichlerz-cap-citypanel-wiring, spichlerz-deficyt-scalenie, spichlerz-drain-keys, spichlerz-drain-pipeline, spichlerz-hud-params-parity, spichlerz-panel-food-parity, spichlerz-widocznosc, spichlerz-wzrost: EXIT=0 każdy
- popcap-spichlerz2-akwedukt20, deposit-building-gate, building-resource-visibility, building-resource-visibility-ui, city-panel-growth-percent-separator, production-overflow, ai-granary-prog-populacji-spojnosc: EXIT=0 każdy
- ai-test: 274 passed, 20 failed (zgodnie z baseline 274/20 z dispatchu; 20 FAIL to te same przypadki, niezwiązane z nazwą, np. T2S-b2, T4S-d, T10b)
- git diff --check: czysto
- Brak „Spichlerz II” w widocznych tekstach gra/src i gra/data poza komentarzami w kodzie i polami developerskimi (patrz BLOKADY).
BLOKADY:
1. NIE_ZMIERZONO: weryfikacja w Chromium (zrzut panelu miasta, czerwony chip „Pismo”, dostępność po Piśmie + Spichlerzu I) nie wykonana w tej rundzie. Dowód wizualny do dorobienia w rundzie 2.
2. Napisy poza allowlistą (nie zmieniane): gra/data/econ-params.json (opisy przy spichlerz_ii_prog_ludnosci i budynek_spichlerz_ii_zuzywa_*), gra/data/resources.json (Uwagi), docs/ (PORADNIK-GRACZA, encyklopedia, decyzje). Pola developerskie lub dokumentacja; wymagają decyzji o rozszerzeniu allowlisty.
3. Komentarze w gra/src (ai.ts, economy.ts, building-resource-gate.ts itd.) nadal zawierają „Spichlerz II”. Nie są widoczne dla gracza, nie zmieniane.
4. Spichlerz I pozostaje „Spichlerz” (bez zmian). Nie stwierdzono w UI napisu „Spichlerz I”.
5. Odmiana: „Spichlerze Królewskie” (M.lm.) i „Spichlerza Królewskiego” (D.lp.) w uchwale. Tabele wiki zachowują mianownik.
6. wikiBundle.json jest generowany z docs/. Po zmianie bundle różni się od docs/ do czasu zmiany docs (poza allowlistą).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja diffu i testów), następnie Final Control; w rundzie 2 zrzut Chromium panelu miasta.
DEPLOY/PUSH: NIE WYKONANO
