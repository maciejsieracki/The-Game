# R-WEB-TEST-HYGIENE-TMPDIR-UNIQUE-Q1 — unikalne nazwy plików tymczasowych w testach (171 trafień w 98 plikach)

DOMAIN: INFRA (testy) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 180d518b193deca83a7a6e6dab3eba9b7aa83ebe. Bez deployu, zero zmian w gra/src i gra/data.

## Kontekst
gra/tools/bramki-tmpdir-unikalnosc-test.cjs (PASS=2 FAIL=1): 171 trafień stałej nazwy pod os.tmpdir() w 98 plikach tools (R1 38, R3 117, R5 16 — dokładny podział w runs/R-WEB-TEST-DEBT-Q14-D1C/30-obrona-claude.md). Stałe nazwy powodują kolizje przy równoległych biegach testów (4 slotów + heartbeat). Uwaga z Obrony D1C: naiwny sufiks pid łamie pary producent–konsument (ai-economy-dist 4 pliki, ai-economy-profile 3, diag.png 4) — plik tworzony przez jeden skrypt i czytany przez drugi musi dostać wspólną nazwę (np. z argv/zmiennej środowiskowej), nie osobny pid.
## Zadanie
Napraw wszystkie 171 trafień tak, by test bramki był zielony, w paczkach po ~15 plików, commit po każdej paczce: (1) wykryj pary producent–konsument (grep nazwy po całym gra/tools) i zachowaj wspólną ścieżkę (jeden helper w gra/tools/_tmp-unique.cjs: unikalny katalog per proces + możliwość przekazania ścieżki dzieciom przez env); (2) zamień pozostałe stałe nazwy na unikalne; (3) po każdej paczce uruchom solo testy z paczki, które NIE używają Chromium (pełne wyjście), a dla testów live (Chromium) wykonaj node --check i uruchom po jednym reprezentancie na typ (nie wszystkie — limit CPU); wypisz w raporcie, których testów live nie uruchamiano. Asercji nie osłabiaj ani nie usuwaj.
## Allowlista
gra/tools/*.cjs wymienione w wyniku bramki-tmpdir-unikalnosc-test (tylko zmiana nazw plików tymczasowych), nowy gra/tools/_tmp-unique.cjs, dyspozycje/autobot/runs/R-WEB-TEST-HYGIENE-TMPDIR-UNIQUE-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana gra/src i gra/data, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background, git log -S nad całym repo bez ścieżki. Maksymalnie jeden Chromium naraz; po pracy pkill własnych chrome. Dysk >= 4 GB; po bramkach usuń gra/node_modules.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; bramki-tmpdir-unikalnosc-test PASS (0 trafień). Zacommituj i zwróć SHA.
## Binarne kryterium
bramki-tmpdir-unikalnosc zielony (0 trafień); testy nie-live z paczek zielone solo; para producent–konsument zachowana (dowód: test z parą uruchomiony); lista nieuruchomionych testów live w raporcie.
