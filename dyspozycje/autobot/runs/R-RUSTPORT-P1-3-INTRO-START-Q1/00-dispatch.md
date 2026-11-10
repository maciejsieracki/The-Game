STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-3-INTRO-START-Q1
GOAL: P1.3 z PLAN-PORT-RUST-TAURI-20261020.md §4 — przejść ręcznie (żywy Chromium) ekran intro/start
gry, na pinie main=edb8fb56. PILOT pierwszego tematu wymagającego żywej przeglądarki w tym projekcie —
jeśli ten temat przejdzie, posłuży jako wzorzec dla P1.4-P1.9/P1.15.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
W świeżym, izolowanym checkoucie `main` (edb8fb56), w katalogu `gra/`:
1. `npm ci` (nie `npm install`).
2. Uruchomić dev server BEZPOŚREDNIO przez Vite, z pominięciem skryptu `predev` (ten uruchamia
   `export-data` i nadpisuje pliki `gra/data/*.json` — zakazane poza allowlistą tego tematu):
   `node ./node_modules/vite/bin/vite.js --port <wolny port w zakresie 5180-5199>`.
   PO uruchomieniu natychmiast sprawdzić `git status gra/data` — musi być czyste (dowód, że
   `export-data` się nie uruchomił). Jeśli nieczyste — przerwać i zgłosić BLOKADĘ, nie kontynuować.
3. Playwright (Chromium już zainstalowany, `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`,
   `executablePath: '/opt/pw-browsers/chromium'`) otworzyć `http://localhost:<port>/`.
4. Zrobić zrzut ekranu (zapisać w `dyspozycje/rust-port/p1/screenshots/P1-3-intro-start.png`),
   zebrać widoczny tekst/DOM głównych elementów ekranu startowego (przyciski, komunikaty, layout).
5. Opisać w `dyspozycje/rust-port/p1/P1-3-INTRO-START.md`: co się dzieje na tym ekranie, jakie są
   dostępne akcje/przejścia (np. "Nowa gra", wczytaj zapis, ustawienia), jedno zdanie o przeznaczeniu
   każdego widocznego elementu, z odniesieniem do pliku/komponentu źródłowego realizującego ten ekran
   (ustal przez devtools/React component name albo przez grep po tekście widocznym na ekranie).
6. OBOWIĄZKOWO ubić proces dev servera (np. zapamiętany PID, `kill`) na końcu — nie zostawiać wiszącego
   procesu.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz opisywania ekranu z pamięci/dawnego audytu bez faktycznego zrzutu ekranu z TEJ rundy. Zrzut musi
istnieć jako plik PNG w allowliście, raport musi podać jego dokładną ścieżkę i rozmiar w bajtach.

BINARNE KRYTERIUM SUKCESU
Plik `.md` istnieje, zrzut `.png` istnieje i ma rozsądny rozmiar (>10 KB, nie pusty/czarny — sprawdzić
wymiary), `git status gra/data` potwierdzone jako czyste PRZED zrobieniem zrzutu, dev server proces
ubity na końcu (podać PID i wynik `kill`).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-3-INTRO-START.md`,
`dyspozycje/rust-port/p1/screenshots/P1-3-intro-start.png`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-3-INTRO-START-Q1/**`. Odczyt: `gra/**` (świeży checkout main
edb8fb56). Zero zapisu w ORYGINALNYM repo `gra/**` (praca w scratch checkoucie, nie w
`/home/user/The-Game/gra`). Zakaz `npm run build`/`npm run dev` (z powodu `predev`/`prebuild`), zakaz
`git add -A`.

IZOLACJA
Świeży, osobny checkout/clone `main` (edb8fb56) w scratchpadzie sesji — NIE w
`/home/user/The-Game` (to jest checkout sesji orkiestratora na innej gałęzi, nie dotykać).

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli dev server w ogóle nie startuje (błąd
środowiska, nie kodu) — status INFRA, nie FAIL, i jawny opis błędu.

OGRANICZENIA WYJŚCIA
Raport max ok. 350 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
