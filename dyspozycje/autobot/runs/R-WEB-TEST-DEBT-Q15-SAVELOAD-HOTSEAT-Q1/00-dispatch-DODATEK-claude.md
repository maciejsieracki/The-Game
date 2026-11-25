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
