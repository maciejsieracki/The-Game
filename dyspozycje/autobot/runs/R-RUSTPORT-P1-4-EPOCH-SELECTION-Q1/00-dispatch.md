STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-4-EPOCH-SELECTION-Q1
GOAL: P1.4 z PLAN-PORT-RUST-TAURI-20261020.md §4 — przejść ręcznie (żywy Chromium) ekran wyboru epoki,
na pinie main=edb8fb56. Replikacja ZWALIDOWANEGO wzorca z P1.3 (patrz
`dyspozycje/autobot/runs/R-RUSTPORT-P1-3-INTRO-START-Q1/03-final-control.md`).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
W świeżym, izolowanym checkoucie `main` (edb8fb56), w `gra/`:
1. `npm ci`.
2. Dev server BEZPOŚREDNIO przez Vite (pomijając `predev`): `node ./node_modules/vite/bin/vite.js
   --port <wolny port 5180-5199> --strictPort`. Natychmiast po starcie sprawdzić `git status gra/data`
   — musi być czyste; jeśli nie — przerwać, status INFRA.
3. Playwright (`/opt/pw-browsers/chromium`) otworzyć aplikację, przejść z ekranu intro (przycisk
   "Rozpocznij grę" albo odpowiednik — ustalić po P1-3-INTRO-START.md) do ekranu wyboru epoki.
4. Zrzut ekranu → `dyspozycje/rust-port/p1/screenshots/P1-4-epoch-selection.png`.
5. Opisać w `dyspozycje/rust-port/p1/P1-4-EPOCH-SELECTION.md`: wszystkie dostępne epoki do wyboru
   (nazwy, czy są zablokowane/odblokowane, czy jest opis/podgląd), mechanizm wyboru, przejście dalej —
   z odniesieniem do pliku/komponentu źródłowego (grep po widocznym tekście / nazwę komponentu z
   devtools) i do `gra/data/epochs.json` albo odpowiednika z P1.12.
6. OBOWIĄZKOWO ubić proces dev servera na końcu (PID + potwierdzenie `kill`, sprawdzić że port wolny).

ANTY-HALUCYNACYJNA REGUŁA
Jak w P1.3: zakaz opisu bez faktycznego zrzutu z TEJ rundy. Zrzut w allowliście, rozmiar+wymiary
podane, nie czarny/pusty.

BINARNE KRYTERIUM SUKCESU
Plik `.md` i zrzut `.png` istnieją, `git status gra/data` potwierdzone czyste, dev server ubity
(PID + wynik), lista epok zgodna z `gra/data/epochs.json` (albo właściwym plikiem — ustalić i
zacytować).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-4-EPOCH-SELECTION.md`,
`dyspozycje/rust-port/p1/screenshots/P1-4-epoch-selection.png`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-4-EPOCH-SELECTION-Q1/**`. Odczyt: `gra/**` (świeży checkout
main edb8fb56). Zero zapisu w ORYGINALNYM repo `gra/**`. Zakaz `npm run build`/`npm run dev`, zakaz
`git add -A`.

IZOLACJA
Świeży, osobny checkout/clone `main` (edb8fb56) w scratchpadzie sesji — NIE w `/home/user/The-Game`.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli dev server nie startuje — status INFRA.

OGRANICZENIA WYJŚCIA
Raport max ok. 350 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
