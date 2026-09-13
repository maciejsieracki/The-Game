R-KREATOR-DOLNA-NAWIGACJA-Q1 — DOWÓD OPERATORA

Data pomiaru: 2026-09-13T11:38:47+00:00
HEAD: 6af03c01939834b0876507a4e001275453528a06
BASE_HEAD: ff9ce26a663c53c9f711e50536eb10f59dc4b70b
Branch: hermes/R-KREATOR-DOLNA-NAWIGACJA-Q1
Worktree: /home/ubuntu/projects/The-Game-worktrees/R-KREATOR-DOLNA-NAWIGACJA-Q1-bugs

1. Zakres i ścieżka DOM

Dolna nawigacja jest tworzona w `newGameFlow.ts:2050-2085` jako `.civ-newgame .nav`.
- Krok 1 (Intro): brak `.nav`, działa CTA „Rozpocznij konfigurację”.
- Krok 2 (Epoka): `.nav .nb.back` + aktywny `.nav .nb.next`.
- Krok 3 (Cywilizacja): `.nav .nb.back` + aktywny `.nav .nb.next`.
- Krok 4 (Ustawienia): aktywny `.nav .nb.back`; brak `Dalej` z założenia. `Start` jest renderowany w `.sett-actions` przez `renderSettStep` (`:1737-1747`).
- Kliknięcie `Start` przy wyłączonym hot-seat przechodzi do kroku 5 i wywołuje callback startu.

Warstwa layoutu:
- `:842` `.civ-newgame{position:fixed;inset:0;overflow:auto;...}`.
- `:864-865` naturalny pionowy przepływ `.flow-body` i `.content`.
- `:1009-1013` rozmiar/kolor/disabled `.nav` i przycisków.
- `:975-976` ustawienia + panel AI są dwiema kolumnami.
- `:1042-1047` panel AI ma ukryty nadmiar i scroll wyłącznie w `.ai-civ-scroll`.
- `:2101-2108` po montażu panel AI dostaje `max-height` równy zmierzonej wysokości lewej siatki.

2. Rzeczywista reprodukcja

Komenda:
`node --check tools/newgame-bottom-navigation-test.cjs`
Wynik: PASS.

Komenda runtime:
`PLAYWRIGHT_BROWSERS_PATH=/home/ubuntu/.cache/ms-playwright node tools/newgame-bottom-navigation-test.cjs`
Test buduje świeży bundle Vite, uruchamia prawdziwe Chromium/Playwright, ustawia `deviceScaleFactor=1`, przechodzi kreator, zaznacza 5 cywilizacji AI, mierzy `getBoundingClientRect`, sprawdza hit-test środka i klika Wstecz/Dalej/Start.
Wynik końcowy: `70 pass · 0 fail`.

2K DCI — 2048x1080, deviceScaleFactor=1
- `window.devicePixelRatio=1`.
- Krok 2: Wstecz `top=561.765625, bottom=597.765625`; Dalej `top=561.765625, bottom=597.765625`; oba `disabled=false`, `fullyInViewport=true`, `hitByCenter=true`.
- Krok 3: Wstecz i Dalej `top=927.03125, bottom=963.03125`; oba `disabled=false`, `fullyInViewport=true`, `hitByCenter=true`.
- Krok 4 po zaznaczeniu 5/5 AI: dolna `.nav` `left=524, top=857.328125, right=1524, bottom=910.328125, width=1000, height=53`.
- Krok 4 po zaznaczeniu 5/5 AI: `Start` `top=754.953125, bottom=800.953125, width=332.59375, height=46`, `disabled=false`, `fullyInViewport=true`, `hitByCenter=true`.
- Root: `scrollTop=0`, `scrollHeight=1080`, `clientHeight=1080`.
- Kliknięcie Wstecz po scenariuszu 5/5 wraca do kroku Cywilizacja.
- Ponowne wejście do ustawień i kliknięcie Start ukrywa kreator przez realną ścieżkę callbacku.
- Zero `console.error`/`pageerror`.

4K UHD — 3840x2160, deviceScaleFactor=1
- `window.devicePixelRatio=1`.
- Krok 2: Wstecz `top=561.765625, bottom=597.765625`; Dalej `top=561.765625, bottom=597.765625`; oba `disabled=false`, `fullyInViewport=true`, `hitByCenter=true`.
- Krok 3: Wstecz i Dalej `top=927.03125, bottom=963.03125`; oba `disabled=false`, `fullyInViewport=true`, `hitByCenter=true`.
- Krok 4 po zaznaczeniu 5/5 AI: dolna `.nav` `left=1420, top=857.328125, right=2420, bottom=910.328125, width=1000, height=53`.
- Krok 4 po zaznaczeniu 5/5 AI: `Start` `top=754.953125, bottom=800.953125, width=332.59375, height=46`, `disabled=false`, `fullyInViewport=true`, `hitByCenter=true`.
- Root: `scrollTop=0`, `scrollHeight=2160`, `clientHeight=2160`.
- Kliknięcie Wstecz po scenariuszu 5/5 wraca do kroku Cywilizacja.
- Ponowne wejście do ustawień i kliknięcie Start ukrywa kreator przez realną ścieżkę callbacku.
- Zero `console.error`/`pageerror`.

3. Kontrola czułości oracla

Na żywym DOM test wstrzykuje `.civ-newgame .nav{display:none !important;}`.
- 2K: test wykrywa mutację jako niewidoczną, a po usunięciu stylu `.nav` wraca do viewport.
- 4K: test wykrywa mutację jako niewidoczną, a po usunięciu stylu `.nav` wraca do viewport.
To potwierdza, że `fullyInViewport` nie jest tautologią.

4. Bramki statyczne i regresje

- `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0, 0 błędów.
- `node ./node_modules/vite/bin/vite.js build --outDir dist-r-kreator-dolna-nawigacja-build --emptyOutDir`: exit 0, 888 modułów, 27.83 s. Katalog builda usunięty po pomiarze.
- `node tools/tech-tree-test.cjs`: 19 pass, 0 fail.
- `node tools/research-test.cjs`: 33 pass, 0 fail.
- `node tools/start-preview-test.cjs`: 1 pass, 5 fail — istniejący test bazowy, niezależny od tej zmiany; nowy test nie modyfikuje danych ani `start-preview`.
- `node tools/ruch-swiata-tempo-test.cjs`: 33 pass, 2 fail — istniejący test bazowy, niezależny od tej zmiany; nowy test nie modyfikuje `main.ts` ani tempa ruchu.
- Próba istniejącego `newgame-sett-grid-layout-test.cjs`: 66 pass, 4 fail. Wszystkie 4 czerwone asercje dotyczą nieaktualnego porównania odstępów: test porównuje 16.00 px `sett-layout -> start-preview` z 59.59 px `start-preview -> kontener sett-actions`; po dodaniu wiersza hot-seat druga odległość obejmuje dodatkową zawartość. Nie jest to pomiar widoczności dolnej nawigacji i nie pochodzi z nowego pliku.
- `git diff --check`: czysto; nowy plik przeszedł kontrolę whitespace.

5. Hashe artefaktów

- `gra/src/ui/newGameFlow.ts`: `7ba486932b017a8f271d339f289ebb957c6c0498d18b20747962d2b3c6464113`.
- `gra/tools/newgame-bottom-navigation-test.cjs`: `8620ece3115a71bfe117496b6ce3204ea53b551420f3a8a4a3214cd338a844c7`.
- `runtime.log`: `d7b7156d825b6ec02133b90f975de43d11944ff2549b03faf2ad3e9a3bb16fd8`.
- `build.log`: `6cdd7cf3e34a1cc1fa0b7d7e5f7a7db6fba7582c708c355a5f1a235156e6a438`.

Wniosek Operatora: przy aktualnym HEAD wariant A rozwiązuje zgłoszoną klasę zasłaniania. Brak podstaw do patcha produkcyjnego; pozostawiono źródło bez zmian i dodano regresję real-browser dla wymaganych wymiarów oraz przepływu przycisków.
