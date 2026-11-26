# DODATEK (runda 1/5, Operator HAIKU 5.5)
## Fakty
dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md (21 ścieżek, luki L1–L7), WOJNY-EPOKI-PO-ZMIANACH-2026-11-25.md, ELIMINACJA-RELACJA-WOJNY-2026-11-25.md: L2 = martwe stałe po FALI 908 (usunięte wyłączenia forced-epoch w maybeResolveRegularWarOnCityCapture i isForcedPeaceEligiblePair/aiAiForcedPeacePairEligible), stare komentarze „wojny epoki nie kończą się jak klasyczne”; L6 = warWearinessByPairKey nie jest czyszczony przy eliminacji właściciela (eliminateOwner kasuje wpisy relacji, ale nie liczniki zmęczenia).
## Zadanie
1. L2: znajdź w gra/src (grep: forcedEra, eraForced, WAR_END_EXCLUDE, komentarze „nie kończą się”, „pominięte P12/P20”) martwe stałe/komentarze po FALI 908; usuń/zaktualizuj BEZ zmiany zachowania (tsc, testy era-war-end-like-classic 17/0, war-end-reason-log 41/0, forced-war-iron, diplo-forced-peace-pending 40/0 muszą zostać zielone). Wypisz listę usuniętych symboli.
2. L6: przy eliminacji właściciela (eliminateOwner lub odpowiednik) usuń z warWearinessByPairKey wpisy par z jego udziałem; test (czysta funkcja lub źródłowy) z mutacją czerwoną; zmiana nie może wpływać na pary bez wyeliminowanego.
## Allowlista
gra/src/main.ts (tylko miejsca z pkt 1–2), gra/src/game/war-rules-multiwar.ts, gra/src/game/diplomacy-*.ts jeśli tam leżą martwe stałe, gra/src/game/war-weariness*.ts, testy wojen w gra/tools/, nowy gra/tools/war-weariness-elimination-test.cjs, dyspozycje/autobot/runs/R-WEB-WAR-END-CLEANUP-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build do testów live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir), zmiana wartości balansu, osłabianie asercji (zmiana dozwolona WYŁĄCZNIE gdy test koduje nieistniejący fragment kodu — wypisz w raporcie z uzasadnieniem), git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash. Dysk >= 6 GB; usuń node_modules i /tmp/<twoje> po bramkach.
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; testy tematu. Zacommituj i zwróć SHA.
Dodatkowo zielone: era-war-end-like-classic-test 17/0, war-end-reason-log-test 41/0, forced-war-iron-test 54/0, era-war-bronze-player-target-test 45/0, diplo-forced-peace-pending-test 40/0, war-limit-truce-count 19/0.
## Binarne kryterium
Martwe symbole usunięte (lista), L6 naprawione z testem i mutacją czerwoną, zero zmian zachowania w L2, bramki zielone.
