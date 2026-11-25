# R-WEB-TEST-DEBT-CLUSTERPLAN-Q1 — cluster-plan-name-test (seed 202) po polarze + wyjątek bramki tmp dla odczytu

DOMAIN: GAME (testy) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main ee0f73c325a7a35597c7211f8aad8636190d741b (zawiera polar FALA 898). Bez deployu, zero zmian w gra/src i gra/data (błąd gry → tylko kandydat R-WEB-*).

## Kontekst
(1) gra/tools/cluster-plan-name-test.cjs: 2 passed / 4 failed (seed 202: „brak odrzuconego slotu” — fixture nie daje już odrzuconego slotu; Q14-D1 UWAGI-8: do zbadania po POLAR A1; czerwony także na bazie 180d518b1 przed polarem — dwukrotnie potwierdzone w TMPDIR/Q14-D1C). Polar jest już w main, więc stan dziś trzeba zmierzyć od nowa. Podejrzenie: zmiany generatora/capital-sep (log „obnizono do 5”) zmieniły fixture seed 202.
(2) bramki-tmpdir-unikalnosc: TMPLAST2 obszedł regułę R2 przez path.resolve w realpath-mutation-test.cjs (odczyt readdir katalogu tmp nie jest zapisem). Właściwa poprawka: wyjątek R2 dla czysto odczytowego użycia w samej bramce (gra/tools/bramki-tmpdir-unikalnosc-test.cjs) z własnym testem bramki (przypadek odczytu = dozwolony, przypadek zapisu stałej nazwy = FAIL), a następnie usunięcie obejścia path.resolve + komentarza.
## Zadanie
1. cluster-plan-name-test: uruchom solo na bazie; ustal przyczynę z dowodem (git log -S zawężony do gra/src gra/data gra/tools; log capital-sep); klasyfikuj STARY-PIN (fixture seed 202 nie odpowiada obowiązującemu generatorowi: znajdź seed/układ, w którym slot jest odrzucany, zachowując cel testu „nazwa klastra przy odrzuceniu slotu”; asercji nie osłabiaj; mutacja czerwona), HARNESS, BŁĄD-GRY (minimalne odtworzenie + cytat reguły; test zostaje czerwony; kandydat R-WEB-*), NIE-ZMIERZONO.
2. Bramka tmpdir: wyjątek odczytu (R2) z testem bramki; usuń obejście path.resolve w realpath-mutation-test.cjs; bramka PASS (0 trafień), mutacja (stała nazwa zapisu) → czerwona.
Commit po każdym punkcie. ZAKAZ BLOCK bez blokady technicznej.
## Allowlista
gra/tools/cluster-plan-name-test.cjs, gra/tools/bramki-tmpdir-unikalnosc-test.cjs, gra/tools/resource-ledger-realpath-mutation-test.cjs, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-CLUSTERPLAN-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana gra/src i gra/data, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po pracy usuń node_modules/logi z /tmp.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; climate-band PASS; bramki-tmpdir PASS. Zacommituj i zwróć SHA.
## Binarne kryterium
cluster-plan-name sklasyfikowany z dowodem i (jeśli STARY-PIN) zielony z mutacją czerwoną; bramka tmpdir z wyjątkiem odczytu PASS i z mutacją czerwoną; obejście path.resolve usunięte; bramki zielone.
