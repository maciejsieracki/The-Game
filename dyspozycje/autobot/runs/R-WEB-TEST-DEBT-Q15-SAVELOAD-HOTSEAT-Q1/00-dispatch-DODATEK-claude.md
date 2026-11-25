# R-WEB-TEST-DEBT-Q15-SAVELOAD-HOTSEAT-Q1 — 5 czerwonych testów zapisu i hotseat + test mutacji zostawiający zmutowany plik

DOMAIN: GAME (testy) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main ca19244c196277a139dfc87aedd90d914dd7d41b. Bez deployu, zero zmian w gra/src i gra/data (błędy gry tylko opisać jako kandydatów R-WEB-*).

## Kontekst
Czerwone także na bazie (FC LEDGERPROBE, FALA 897): gra/tools/hotseat-etap6d-podetap-b-exec-test.cjs, -d-exec-test.cjs, -e-exec-test.cjs (exit 1, ReferenceError withDiplomacyTradeEra), save-load-roundtrip-state-drift-test.cjs (warstwa statyczna OK, dynamiczna Chrome >570 s — timeout 124 w Q14-E kat. E; zmierz osobno z limitem 25 min), save-load-deserialize-fields-audit-test.cjs. Dodatkowo: resource-ledger-realpath-mutation-test.cjs (m01 ZABITA: pominięcie łupu z bitwy → FAIL; timeout 590 s; przy ubiciu zostawia zmutowany main.ts — musi odtwarzać plik także po SIGTERM/timeout, np. kopia + try/finally + handler sygnału).
## Zadanie
Dla każdego z 6 testów: surowe wyjście solo (exit, czas), przyczyna z dowodem (git log -S zawężony do gra/src gra/data gra/tools; ReferenceError withDiplomacyTradeEra — znajdź, gdzie symbol został usunięty/przeniesiony i commit), klasyfikacja STARY-PIN/HARNESS (popraw test do obowiązującej reguły: komentarz 'R-WEB-TEST-DEBT-Q15' + commit/decyzja, asercji nie osłabiaj, mutacja czerwona na bieżącym kodzie), BŁĄD-GRY (minimalne odtworzenie + cytat reguły; test zostaje czerwony; kandydat R-WEB-*, bez pytania), NIE-ZMIERZONO (po wyczerpaniu dowodu, z konkretnym powodem). Dla resource-ledger-realpath-mutation: napraw bezpieczeństwo (przywracanie pliku po przerwaniu), pokaż dowód: ubicie testu w trakcie mutacji (kill -TERM) → plik identyczny z git. Testy Chromium po jednym; długie (>10 min) uruchamiaj setsid nohup timeout 1800 w pierwszym planie i czekaj Monitor/until-pętlą; pkill własnych procesów po pracy.
Paczki, commit po każdym teście. ZAKAZ statusu BLOCK bez blokady technicznej.
## Allowlista
gra/tools/{hotseat-etap6d-podetap-b-exec,hotseat-etap6d-podetap-d-exec,hotseat-etap6d-podetap-e-exec,save-load-roundtrip-state-drift,save-load-deserialize-fields-audit,resource-ledger-realpath-mutation}-test.cjs, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q15-SAVELOAD-HOTSEAT-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build tylko vite --outDir poza repo), zmiana gra/src i gra/data, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Jeden Chromium naraz. Dysk >= 4 GB; po pracy usuń node_modules, bundle, logi z /tmp.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0. Zacommituj i zwróć SHA.
## Binarne kryterium
Każdy z 6 testów ma klasyfikację z dowodem; naprawione zielone solo z mutacją czerwoną; realpath-mutation przywraca plik po ubiciu (dowód); bramki zielone.

## DODATEK rundy 2/5 (orkiestrator, 2026-11-25) — BAZA = bc71c7481fed607736412dfb8c8c8cc710469f06 (potomek ca19244c1; w nim: restore po SIGTERM w realpath-mutation, harness hotseat-B częściowo, deserialize-fields-audit zielony z --dist)
Runda 1: Evaluator FAIL (7 zarzutów), FC FAIL — hotseat B/D/E nadal czerwone, roundtrip i deserialize bez klasyfikacji, backup w /tmp po realpath-mutation. Zakres rundy 2 (NAPRAW, nie opisuj; po jednym teście, commit po każdym):
1. hotseat-etap6d-podetap-b-exec: pada na mergedResourceRatesForOwner 'budynki' — dokończ loader (realne moduły src przez esbuild, brakujące stuby wg wzorca z D1/D1B w repo), asercje bez osłabienia; mutacja czerwona na bieżącym kodzie. Jeśli po 2 próbach loader nadal nie dochodzi do końca → NIE-ZMIERZONO z listą sprawdzonych brakujących zależności (konkretne symbole), nie opis ogólny.
2. hotseat-etap6d-podetap-d-exec: STARY-PIN — wycinki po numerach linii (31620–31675, 32232–32330) zastąp wycinkami po sygnaturach funkcji (kotwice tekstowe), ME() 16 zamiast 13 i 42 zamiast 21 przelicz na obowiązujące liczby z komentarzem 'R-WEB-TEST-DEBT-Q15' + commit zmieniający (git log -S zawężony do gra/src); ReferenceError clusterWarMembers — znajdź gdzie symbol żyje (grep) i dostarcz go w harnessie.
3. hotseat-etap6d-podetap-e-exec: ReferenceError turnEventsFrame — jak wyżej (symbol w harnessie), dokończ do końca testu.
4. save-load-roundtrip-state-drift: uruchom z limitem 25 min: setsid nohup timeout 1500 node gra/tools/save-load-roundtrip-state-drift-test.cjs [--dist <bundle poza repo>] > log & i czekaj Monitor/until-pętlą; sklasyfikuj z dowodem (warstwa statyczna OK; dynamiczna Chrome).
5. save-load-deserialize-fields-audit (plik gra/tools/save-load-deserialize-fields-audit.cjs, bez '-test'): zielony z --dist (dowód z r2 obrony) — sklasyfikuj jako HARNESS (wymaga --dist), dodaj w nagłówku testu instrukcję uruchomienia; evidence/ poza allowlistą nie zostawiać w repo.
6. resource-ledger-realpath-mutation: dołóż usuwanie osieroconych kopii civ-ledger-mut-backup-*.ts z os.tmpdir() przy starcie i po zakończeniu (tylko własne, po pidzie martwego procesu); SIGKILL — NIE-ZMIERZONO z powodem lub test z kill -KILL własnego dziecka (PID dziecka, bez pkill).
ZAKAZ statusu BLOCK/INCOMPLETE bez blokady technicznej; każdy punkt kończy się klasyfikacją z dowodem albo NIE-ZMIERZONO z konkretnym powodem.
Allowlista poprawiona: gra/tools/save-load-deserialize-fields-audit.cjs (bez -test).
