# DODATEK (runda 1/5, Operator HAIKU 5.5)
## Fakty
Operator i Evaluator HOTSEATPEACE: peace-vazne-always-test.cjs czerwony już na b1e4e04ab (M1: fragment z wcięciem 10 spacji nie istnieje w bazie, 0 trafień) — niezwiązane z hotseat. Pokój po rozejmie wpisuje „Rozejm przeszedł w pokój” (finalizePeace port w main.ts truceEndPorts, wpis truce-peace-<tura>-<para> w warEventLog; od FALI 912–918 logika końca rozejmu przeszła przez truceEndAcceptCore/ceny).
## Zadanie
1. Uruchom test na bazie, zidentyfikuj, co dokładnie mutuje M1 i dlaczego 0 trafień (zmiana wcięcia/ kształtu kodu).
2. Zaktualizuj mutację M1 (i ewentualne asercje źródłowe kodujące stary kształt) tak, by mutant po zastosowaniu do AKTUALNEGO kodu czerwienił test; test zielony bez mutacji. Mutacje M2…Mn bez zmian jeśli działają.
3. Raport: stara vs nowa postać mutacji, wyniki PRZED/PO.
## Allowlista
gra/tools/peace-vazne-always-test.cjs, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-PEACE-VAZNE-M1-Q1/**. Kod gry (gra/src) NIE.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build do testów live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir), zmiana wartości balansu, osłabianie asercji (zmiana dozwolona WYŁĄCZNIE gdy test koduje nieistniejący fragment kodu — wypisz w raporcie z uzasadnieniem), git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash. Dysk >= 6 GB; usuń node_modules i /tmp/<twoje> po bramkach.
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; testy tematu. Zacommituj i zwróć SHA.
## Binarne kryterium
peace-vazne-always-test zielony (wszystkie mutanty wykrywane), gra/src bez zmian.
