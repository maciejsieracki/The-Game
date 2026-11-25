# R-WEB-HARNESS-CHROME-SAVE-RESUME-SIGSEGV-Q1 — crash Chromium przy wznowieniu zapisu (harness testów live)

DOMAIN: INFRA/GAME (testy live) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 79bdf0dfda5eec4f1d4e16370239cbe09c5a210a. Bez deployu, zero zmian w gra/src i gra/data (chyba że dochodzenie wykaże błąd gry — wtedy tylko opis kandydata R-WEB-*).

## Kontekst
Raporty Q14-B r2, DIPLOLEVELS, CHROMEHELPER: wznawianie przebiegu live ze slotu (fazy load zapisu w openGame) kończy się SIGSEGV Chromium (dwukrotnie powtórzone). To blokuje pomiary zapis/wczytanie (zadanie #72: równoważność wznowionego biegu z ciągłym, wczytanie aktywnej gry po reloadzie) i wznawialne runnery (diplomacy-harder-measure-run.cjs --stop-at). Dotychczasowa ocena: crash Chromium, nie błąd gry — NIE ZMIERZONO.
## Zadanie
1. Odtwórz minimalnie: uruchom wznawialny runner (np. node gra/tools/diplomacy-harder-measure-run.cjs ... --stop-at <tura> a potem wznowienie) na bundlu zbudowanym POZA repo (vite build do katalogu poza repo — wg zasad C-001: node ./node_modules/vite/bin/vite.js build --outDir <katalog w /tmp> --emptyOutDir) i zapisz, w którym kroku pada Chromium (openGame / load / IndexedDB / rozmiar zapisu).
2. Zdiagnozuj przyczynę z dowodem: uruchom Chromium z flagami (--disable-gpu, --disable-dev-shm-usage, --js-flags=--max-old-space-size=…, tryb headless nowy/stary), zmierz rozmiar zapisu i pamięć procesu w chwili crashu (dmesg/ps), sprawdź, czy pada też na zapisie tworzonym świeżo w tej samej sesji; czy to limit pamięci kontenera (OOM), /dev/shm, czy deterministyczny bug.
3. Napraw HARNESS (helper gra/tools/_chrome-path.cjs i/lub wspólne uruchamianie Chrome w runnerach — minimalna zmiana, np. dodanie flag, większy shm, sekwencyjne uruchamianie), tak by wznowienie ze slotu działało; pokaż: bieg w dwóch odcinkach = bieg ciągły (ten sam stan w turze docelowej, hash/streszczenie) albo NIE ZMIERZONO z konkretnym powodem.
4. Jeśli przyczyną jest błąd gry (np. zapis niepoprawnie się wczytuje) — NIE naprawiaj gry; opisz minimalne odtworzenie i cytat obowiązującej reguły jako kandydata R-WEB-*.
## Allowlista
gra/tools/_chrome-path.cjs, nowe gra/tools/*-resume-*.cjs, gra/tools/diplomacy-harder-measure-run.cjs (tylko uruchamianie Chrome/wznawianie), dyspozycje/analizy/HARNESS-CHROME-WZNOWIENIE-2026-11-25.md, dyspozycje/autobot/runs/R-WEB-HARNESS-CHROME-SAVE-RESUME-SIGSEGV-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build tylko vite z --outDir poza repo), zmiana gra/src i gra/data, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background, git log -S nad całym repo bez ścieżki. Jeden Chromium naraz; po pracy pkill własnych procesów chrome. Dysk >= 4 GB; po bramkach usuń gra/node_modules i bundle z /tmp.
## Bramki
tsc 0; logic 213; ai-test 297/0; test hooka/runnera, którego dotykasz (np. diplomacy-measure-resume-test 8/0). Zacommituj i zwróć SHA.
## Binarne kryterium
Dokument z przyczyną i dowodem; wznowienie ze slotu nie crashuje na 3 kolejnych próbach LUB jawne NIE ZMIERZONO z listą sprawdzonych hipotez; bieg w dwóch odcinkach vs ciągły porównany; bramki zielone.
