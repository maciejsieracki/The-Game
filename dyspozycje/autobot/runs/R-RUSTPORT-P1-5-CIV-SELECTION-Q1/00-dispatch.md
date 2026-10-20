STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-5-CIV-SELECTION-Q1
GOAL: P1.5 z PLAN-PORT-RUST-TAURI-20261020.md §4 — przejść ręcznie (żywy Chromium) ekran wyboru
cywilizacji (wszystkie pozycje), na pinie main=edb8fb56. Replikacja zwalidowanego wzorca z P1.3
(`dyspozycje/autobot/runs/R-RUSTPORT-P1-3-INTRO-START-Q1/03-final-control.md`).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
W świeżym, izolowanym checkoucie `main` (edb8fb56), w `gra/`:
1. `npm ci`.
2. Dev server BEZPOŚREDNIO przez Vite (pomijając `predev`): `node ./node_modules/vite/bin/vite.js
   --port <wolny port 5180-5199> --strictPort`. Sprawdzić `git status gra/data` czyste przed zrzutem.
3. Playwright (`/opt/pw-browsers/chromium`) — dojść do ekranu wyboru cywilizacji (przez intro →
   nowa gra, patrz P1-3-INTRO-START.md dla pierwszego kroku; jeśli po drodze jest wybór epoki, wybrać
   dowolną, zanotować którą).
4. Zrzut ekranu z listą WSZYSTKICH dostępnych cywilizacji →
   `dyspozycje/rust-port/p1/screenshots/P1-5-civ-selection.png`. Jeśli lista jest przewijana/dłuższa
   niż jeden ekran, zrobić tyle zrzutów ile potrzeba, żeby pokryć wszystkie pozycje (ponumerować pliki).
5. Opisać w `dyspozycje/rust-port/p1/P1-5-CIV-SELECTION.md`: pełną listę cywilizacji widocznych w UI
   (nazwa, czy ma opis/bonus widoczny na karcie, czy jest zablokowana), porównać liczbę z
   `gra/data/civs.json` (15 cywilizacji wg P1.12) — czy UI pokazuje wszystkie, mechanizm wyboru
   (klik, potwierdzenie), odniesienie do pliku/komponentu źródłowego.
6. OBOWIĄZKOWO ubić proces dev servera na końcu (PID + potwierdzenie, port wolny).

ANTY-HALUCYNACYJNA REGUŁA
Jak w P1.3: zakaz opisu bez faktycznego zrzutu z TEJ rundy. Liczba cywilizacji w opisie musi zgadzać
się z liczbą faktycznie widoczną na zrzutach (nie z `civs.json` automatycznie — jeśli się różni,
odnotować to jako znalezisko, nie ukrywać).

BINARNE KRYTERIUM SUKCESU
Plik `.md` i co najmniej 1 zrzut `.png` istnieją, `git status gra/data` potwierdzone czyste, dev
server ubity, lista cywilizacji w opisie ma policzoną liczbę pozycji z dowodem (zrzut+ewentualnie DOM).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-5-CIV-SELECTION.md`,
`dyspozycje/rust-port/p1/screenshots/P1-5-civ-selection*.png`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-5-CIV-SELECTION-Q1/**`. Odczyt: `gra/**` (świeży checkout main
edb8fb56). Zero zapisu w ORYGINALNYM repo `gra/**`. Zakaz `npm run build`/`npm run dev`, zakaz
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
