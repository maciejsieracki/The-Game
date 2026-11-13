STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-B-Q1
GOAL: po zakończeniu tury skarbiec i spichlerz państwa nie poniżej zera (tury 1–10 wolne); gracz: blokada „Zakończ turę” przy prognozie < 0 z komunikatem co zmienić, tylko gdy istnieje ruch naprawczy; brak ruchu naprawczego = brak blokady (bez zakleszczenia).
ZMIANY/COMMIT: baza 507d312ce (origin/main, A zintegrowany). Allowlista: gra/src/game/no-negative-stocks.ts (kosztArmii w NnsFoodProjection, decideEndTurnGate), gra/src/main.ts (import, cache prognozy w refreshLiveEmpireRatesUnsafe, nnsGateForPlayer, warunek w canPlayerInitiateEndTurn, komunikat w hintEndTurnBlocked), NOWY gra/tools/no-negative-stocks-endturn-test.cjs, runs/R-WEB-ECON-NO-NEGATIVE-STOCKS-B-Q1/10-operator-claude.md. Commit: patrz pole sha w StructuredOutput. Nie dotknięto hud.ts, bottomBarHud.ts (patrz BLOKADY).
TESTY (surowe wyniki z tej rundy):
- node gra/tools/no-negative-stocks-endturn-test.cjs: 14 passed, 0 failed (nowy)
- node gra/tools/no-negative-stocks-projection-test.cjs: 49 passed, 0 failed (A, regresja)
- node gra/tools/no-negative-stocks-test.cjs: 25 passed, 0 failed (regresja)
- npx tsc --noEmit --ignoreDeprecations 5.0: exit 0, 0 błędów (bez flagi tsc zgłasza TS5101 dla baseUrl w tsconfig.json; to błąd konfiguracji, nie kodu; zainstalowane TypeScript 5.9.3)
- tools/end-turn-modal-sequencing-test.cjs: 40 pass, 1 fail ([A5] launchSiegeStormFromMap: showPreBattle defaultAction manual bez auto) — NIE_ZMIERZONO na bazie; zmiana nie dotyka showPreBattle, ale nie potwierdzone
- tools/end-turn-gameplay-runtime-test.cjs: NIE_ZMIERZONO (wymaga WORLD_GEN_DIST z direct-Vite; środowisko)
- tools/end-turn-input-stability-test.cjs: NIE_ZMIERZONO (brak przeglądarki Playwright: chromium_headless_shell nie zainstalowany)
- npm run build / dev: NIE WYKONANO (zakaz)
- Chromium / zrzut zablokowanego przycisku / mutacja w grze żywej: NIE_ZMIERZONO (brak przeglądarki w tym środowisku)
- Symulacja headless 15x3x150: NIE_ZMIERZONO (to podtemat C)
BLOKADY / ZAŁOŻENIA:
1. Dźwignie (uproszczenie, bezpieczny kierunek): w bramce liczony jest wyłącznie „rozwiązanie wszystkich jednostek” — zysk skarbca = utrzymanieJednostki (_lastBogactwoUtrzymanieJednostek), zysk spichlerza = kosztArmii z projekcji. Podatki NIE są liczone (brak wiarygodnej projekcji w HUD), więc gracz, którego deficyt dałby się pokryć samymi podatkami, nie zostanie zablokowany. Skutek: blokada działa rzadziej niż dispatch zakłada; brak zakleszczenia zachowany.
2. Spichlerz: po rozwiązaniu wszystkich jednostek brak spichlerza po turze = spichlerzStolicy (≥ 0 gdy zapasy są dodatnie). Blokada spichlerza działa tylko gdy zysk armii pokrywa brak.
3. Prognoza skarbca w main.ts = zapisany stan skarbca + _lastBogactwoRate (netto HUD = pieniadz − utrzymanieRazem). To ta sama arytmetyka co blok „Bank treasury” (test (e) sprawdza wzór, nie wywołanie bloku). Wariant projectTreasuryAfterTick z econ nie został użyty, bo podgląd HUD nie niesie upkeepByOwner.
4. Prognoza spichlerza: projectEmpireFoodAfterTick na KOPII stanu, econ = podgląd HUD (preview), jednostki = jednostki gracza (playerEconUnitsForUpkeep, camping=false). Realny tick używa econ po autoracjach i wszystkich jednostek; rozjazd możliwy, nie zmierzony.
5. Koszt: prognoza liczona w refreshLiveEmpireRatesUnsafe (dirty-gated), czyli tylko po zmianie ekonomii. Koszt wywołania (klon stanów wszystkich właścicieli) NIE_ZMIERZONO.
6. HUD: przycisk nie dostał osobnego stanu/tekstu (hud.ts, bottomBarHud.ts poza zakresem tej rundy). Komunikat pojawia się przy próbie zakończenia tury (hintEndTurnBlocked → showHintMessage, 6 s). Przycisk jest wyłączony przez canPlayerInitiateEndTurn, bo canEndTurn() go woła.
7. Odchylenie od allowlisty: w main.ts poza „canPlayerInitiateEndTurn i dostarczeniem komunikatu” dodano także import, deklaracje cache i obliczenie prognozy w refreshLiveEmpireRatesUnsafe. Bez tego bramka nie ma danych. Do decyzji Evaluatora/FC.
8. Tury 1–10 wolne (evaluateEndTurnStocks), stary zapis z ujemnym stanem i niepogarszającą się prognozą nie blokuje (wyjatekStarego), brak dźwigni = brak blokady.
9. Ruch naprawczy w rozumieniu „istnieje” = suma zysku dźwigni ≥ brak (czyRuchNaprawczy). Dla skarbca i spichlerza jedyna dźwignia to rozwiązanie wszystkich jednostek.
RUNDY: 1/5 (Operator r1)
NASTĘPNY KROK: Evaluator (Sonnet): zweryfikować allowlistę main.ts (pkt 7), koszt refresh (pkt 5), zgodność prognozy z blokiem banku (pkt 3–4); rozważyć dołożenie podatków do dźwigni przed live-testem; zrobić żywy test Chromium (kryterium d) i mutację (usunięcie warunku nnsGateForPlayer w canPlayerInitiateEndTurn powinno czerwienić test (f)). Podtemat C (AI, runner 15×3×150) nadal po tym temacie.
UWAGI-DLA-ORKIESTRATORA:
- Dispatch r1 wskazywał kandydat c43597936 jako bazę; to przodek 507d312ce (sprawdzone merge-base). Użyto 507d312ce zgodnie z DODATKIEM.
- Oryginalny 00-dispatch.md istnieje tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0.
- W środowisku nie było node_modules w gra/; wykonano `npm ci --ignore-scripts` (bez build/dev).
- Szukać w hud.ts komunikatu blokady na przycisku (kryterium d wymaga zrzutu zablokowanego przycisku) — w tej rundzie nie wykonano.
DEPLOY/PUSH: NIE WYKONANO
