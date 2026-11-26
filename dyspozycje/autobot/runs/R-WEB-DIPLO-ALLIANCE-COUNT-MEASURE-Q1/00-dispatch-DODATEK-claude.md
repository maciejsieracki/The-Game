# DODATEK (runda 1/5, Operator HAIKU 5.5; BAZA = args.cand)
## Kontekst
ALLYCLEAN (reconcileAllianceStatusAfterDeals, gra/src/main.ts + isStaleAllianceStatus/alliancePairsToReset w gra/src/game/diplomacy-treaties.ts) wdrożony FALĄ 913: po zniknięciu umowy sojuszu relacja pary wraca do pokoju. Ryzyko: podmiana sojuszu AI↔AI (okno 1 tura i natychmiastowe odnowienie — dyspozycje/analizy/SOJUSZE-PODMIANA-WZORZEC-2026-11-25.md, ZNIKANIE-SOJUSZY-AI-2026-11-25.md) mogła opierać się na pozostającej relacji; spadek liczby sojuszy AI o >30% = DECISION_REQUIRED.
## Zadanie (pomiar PRZED/PO na dwóch commitach)
1. PRZED: worktree na b1e4e04ab3af27a1241282d5cea1e9a97c2d4617 (main przed ALLYCLEAN); PO: worktree na BAZIE (HEAD origin/main z dispatchu). Ten sam runner i te same ziarna: seed 4242 i 7, tury 1–67 (dla t≥67 jeśli czas pozwala), te same ustawienia nowej gry.
2. Użyj istniejących runnerów (gra/tools/limits-measure.cjs, gra/tools/diplomacy-harder-measure-run.cjs, alliance-limit-ai-t66-test.cjs — przeczytaj nagłówki i flagi; runner jest wznawialny: używaj wznowienia po SIGSEGV Chromium, znany problem #90; Chromium w /opt/pw-browsers/chromium, bez instalacji Playwright; deviceScaleFactor 1). Liczba sojuszy AI liczona z activeDeals (pole „pokój” umów sojuszu), NIE ze statusu relacji (błąd danych z ALLY66).
3. Raport: dla każdego ziarna i wariantu: liczba aktywnych sojuszy AI↔AI w turach 10/20/30/40/50/60/67, maksimum sojuszy na cywilizację (limit 2), liczba nowych umów i usunięć, liczba podmian (okno bez umowy), ile par ma status „sojusz” bez umowy (PO powinno = 0 poza parami same-civ AI↔miasto-państwo). Różnica względna PO vs PRZED. Jeśli Chromium nie startuje/pada mimo ponowień — NIE ZMIERZONO z powodem i liczbą prób; nie zgaduj.
4. Wniosek: spadek >30% → STATUS DECISION_REQUIRED (jedno zdanie konfliktu per wariant: zostawić czyszczenie / przywrócić pozostającą relację / czyścić z opóźnieniem N tur); w przeciwnym razie PASS z liczbami.
## Wynik / allowlista
dyspozycje/analizy/SOJUSZE-LICZBA-PRZED-PO-ALLYCLEAN-2026-11-26.md (+ dane/skrypty pomiarowe w dyspozycje/analizy/), dyspozycje/autobot/runs/R-WEB-DIPLO-ALLIANCE-COUNT-MEASURE-Q1/**.
## Zakazy
Zmiany gra/**, gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/; npm run build/dev w gra/ (build do testów live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir); git add -A; push; spawn_task/create_session/create_trigger/send_later (WOLNO TYLKO narzędzia opisane w dispatchu); run_in_background w Bash. Dysk >= 6 GB; usuń node_modules i /tmp po pomiarach.
## Bramki / kryterium
Brak bramek kodu; git diff --name-only wyłącznie allowlista; dokument z liczbami PRZED/PO dla 2 ziaren albo NIE ZMIERZONO z powodem.
