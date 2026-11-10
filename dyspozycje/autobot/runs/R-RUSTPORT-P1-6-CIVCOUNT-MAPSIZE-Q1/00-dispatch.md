STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-6-CIVCOUNT-MAPSIZE-Q1
GOAL: P1.6 z PLAN-PORT-RUST-TAURI-20261020.md §4 — warianty liczby cywilizacji i rozmiaru mapy, na
pinie main=edb8fb56. Replikacja zwalidowanego wzorca z P1.3
(`dyspozycje/autobot/runs/R-RUSTPORT-P1-3-INTRO-START-Q1/03-final-control.md`).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
W świeżym, izolowanym checkoucie `main` (edb8fb56), w `gra/`:
1. `npm ci`.
2. Dev server BEZPOŚREDNIO przez Vite (pomijając `predev`): `node ./node_modules/vite/bin/vite.js
   --port <wolny port 5180-5199> --strictPort`. Sprawdzić `git status gra/data` czyste.
3. Playwright (`/opt/pw-browsers/chromium`) — dojść do ekranu ustawień nowej gry, gdzie wybiera się
   liczbę cywilizacji i rozmiar mapy (po intro → nowa gra, patrz P1-3-INTRO-START.md).
4. Zrzut ekranu z widocznymi opcjami liczby cywilizacji i rozmiaru mapy →
   `dyspozycje/rust-port/p1/screenshots/P1-6-civcount-mapsize.png`. Jeśli dostępne warianty
   wymagają osobnych interakcji (np. dropdown/slider), zrobić dodatkowe zrzuty pokazujące pełny
   zakres opcji.
5. Opisać w `dyspozycje/rust-port/p1/P1-6-CIVCOUNT-MAPSIZE.md`: wszystkie dostępne wartości liczby
   cywilizacji i rozmiaru mapy, czy są ograniczenia (np. max cywilizacji zależny od rozmiaru mapy —
   sprawdzić przez interakcję, nie zgadywać), odniesienie do pliku/komponentu źródłowego i do danych
   (np. `gra/data/*.json` jeśli wartości są tam zdefiniowane).
6. OBOWIĄZKOWO ubić proces dev servera na końcu (PID + potwierdzenie, port wolny).

ANTY-HALUCYNACYJNA REGUŁA
Jak w P1.3: zakaz opisu bez faktycznego zrzutu z TEJ rundy. Każda wartość liczbowa (np. "do 9
cywilizacji") musi być potwierdzona interakcją z UI w tej rundzie, nie wyczytana z samego kodu bez
sprawdzenia że UI faktycznie na to pozwala.

BINARNE KRYTERIUM SUKCESU
Plik `.md` i co najmniej 1 zrzut `.png` istnieją, `git status gra/data` potwierdzone czyste, dev
server ubity, pełny zakres wartości liczby cywilizacji i rozmiaru mapy potwierdzony przez interakcję.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-6-CIVCOUNT-MAPSIZE.md`,
`dyspozycje/rust-port/p1/screenshots/P1-6-civcount-mapsize*.png`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-6-CIVCOUNT-MAPSIZE-Q1/**`. Odczyt: `gra/**` (świeży checkout
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
