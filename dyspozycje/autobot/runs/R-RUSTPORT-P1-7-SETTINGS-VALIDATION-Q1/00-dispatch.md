STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-7-SETTINGS-VALIDATION-Q1
GOAL: P1.7 z PLAN-PORT-RUST-TAURI-20261020.md §4 — ustawienia gry (ekran ustawień/walidacja wyboru
przed startem), na pinie main=edb8fb56. Replikacja zwalidowanego wzorca z P1.3
(`dyspozycje/autobot/runs/R-RUSTPORT-P1-3-INTRO-START-Q1/03-final-control.md`).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
W świeżym, izolowanym checkoucie `main` (edb8fb56), w `gra/`:
1. `npm ci`.
2. Dev server BEZPOŚREDNIO przez Vite (pomijając `predev`): `node ./node_modules/vite/bin/vite.js
   --port <wolny port 5180-5199> --strictPort`. Sprawdzić `git status gra/data` czyste.
3. Playwright (`/opt/pw-browsers/chromium`) — dojść do ekranu ustawień gry (menu głównego "Ustawienia"
   — patrz P1-3-INTRO-START.md — ORAZ ewentualny osobny krok walidacji przed rozpoczęciem nowej gry,
   jeśli istnieje w flow nowej gry).
4. Spróbować wywołać stan błędu walidacji (np. niekompletny wybór, sprzeczne opcje) jeśli taki
   mechanizm istnieje w UI — jeśli nie da się łatwo wywołać, odnotować to wprost, nie zgadywać.
5. Zrzuty ekranu → `dyspozycje/rust-port/p1/screenshots/P1-7-settings-validation*.png` (ekran
   ustawień + stan błędu walidacji jeśli wywołany).
6. Opisać w `dyspozycje/rust-port/p1/P1-7-SETTINGS-VALIDATION.md`: wszystkie opcje ustawień widoczne
   w UI (audio/wideo/sterowanie/inne), jakie reguły walidacji istnieją przy starcie nowej gry (np.
   wymagany wybór cywilizacji, min/max graczy), odniesienie do pliku/komponentu źródłowego.
7. OBOWIĄZKOWO ubić proces dev servera na końcu (PID + potwierdzenie, port wolny).

ANTY-HALUCYNACYJNA REGUŁA
Jak w P1.3: zakaz opisu bez faktycznego zrzutu/interakcji z TEJ rundy.

BINARNE KRYTERIUM SUKCESU
Plik `.md` i co najmniej 1 zrzut `.png` istnieją, `git status gra/data` potwierdzone czyste, dev
server ubity, opisane opcje ustawień i reguły walidacji (albo jawnie odnotowany brak możliwości ich
wywołania w UI).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-7-SETTINGS-VALIDATION.md`,
`dyspozycje/rust-port/p1/screenshots/P1-7-settings-validation*.png`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-7-SETTINGS-VALIDATION-Q1/**`. Odczyt: `gra/**` (świeży
checkout main edb8fb56). Zero zapisu w ORYGINALNYM repo `gra/**`. Zakaz `npm run build`/`npm run dev`,
zakaz `git add -A`.

IZOLACJA
Świeży, osobny checkout/clone `main` (edb8fb56) w scratchpadzie sesji — NIE w `/home/user/The-Game`.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli dev server nie startuje — status INFRA.

OGRANICZENIA WYJŚCIA
Raport max ok. 350 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
