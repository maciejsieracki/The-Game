# DODATEK (runda 1/5, Operator HAIKU 5.5; args.cand = ff5223f99 pełny SHA z git rev-parse)
## Kontekst
FC RIVERS3A (raport 50-final-control w runs/R-WEB-MAP-RIVER-RENDER-LEVELS-Q1, wip RIVERS3A-wip/fc 44772d6e3): PASS-WITH-NOTES, blokady przed READY_FOR_DEPLOY: (1) zrzut z żywego Chromium 1280x800 mapa 84x60 seed 1 potwierdzający czytelność trzech poziomów rzek (main > medium > tributary; tributary = 0,30 półszerokości — odchylenie od ~0,5×main, bo medium ma max 0,49); (2) pomiar FPS/kosztu sceny przy 8–146 dodatkowych dopływach.
## Zadanie
1. Zbuduj DWA warianty (każdy do osobnego katalogu /tmp/<unikalny>): kandydat ff5223f99 i baza 7148b2f4e: w worktree: npm ci --ignore-scripts, node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir.
2. Chromium w /opt/pw-browsers/chromium (require('playwright'), bez instalacji, --no-sandbox --headless; deviceScaleFactor 1; viewport 1280x800). Użyj istniejących helperów żywych testów (gra/tools/_live-ready.cjs closeCivWelcome i wzorców innych testów live, np. river-fog-visibility / map-* live) do: nowa gra, mapa 84×60 (Standard, seed 1 jeśli ustawialny), przejście do mapy z odsłoniętym światem (hak civTest lub tryb podglądu bez mgły, jeśli istnieje; inaczej odsłoń mapę przez istniejący hak). Zrób zrzut całej mapy z rzekami (kandydat i baza) oraz zbliżenie 2× na fragment z rzeką główną, średnią i dopływem. Zrzuty PNG zapisz do dyspozycje/analizy/rzeki-render-r3a/ (≤ 1 MB każdy).
3. FPS: w obu wariantach zmierz średni czas klatki (requestAnimationFrame przez 10 s po stabilizacji) przy tym samym widoku, 3 powtórzenia; podaj średnią i różnicę. Jeśli Chromium pada (SIGSEGV, znany #90) — ponawiaj do 3 razy, potem NIE ZMIERZONO z powodem; nie zgaduj.
4. Raport: opis co widać na zrzutach (czy trzy poziomy są odróżnialne, czy dopływy 0,30 są czytelne), liczby FPS, rekomendacja grubości (zostaje 0,30 albo zmiana), bez zmian kodu.
## Allowlista
dyspozycje/analizy/rzeki-render-r3a/** (PNG + skrypt pomiarowy), dyspozycje/autobot/runs/R-WEB-MAP-RIVER-RENDER-VISUAL-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build do testów live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir), zmiana wartości balansu poza zakresem, osłabianie asercji (zmiana dozwolona WYŁĄCZNIE dla testów kodujących stary kontrakt lub pinów generatora map — wypisz w raporcie z uzasadnieniem), git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE — nie wywołuj), run_in_background w Bash. Dysk >= 6 GB; usuń node_modules i /tmp/<twoje> po bramkach.
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; testy tematu; nowy test z mutacją czerwoną. Zacommituj i zwróć SHA.
## Binarne kryterium
Zrzuty kandydat vs baza obecne i opisane; FPS zmierzony (3 powtórzenia) albo NIE ZMIERZONO z powodem i liczbą prób; zero zmian gra/**.
