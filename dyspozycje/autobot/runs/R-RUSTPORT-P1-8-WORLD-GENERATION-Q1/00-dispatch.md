STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-8-WORLD-GENERATION-Q1
GOAL: P1.8 z PLAN-PORT-RUST-TAURI-20261020.md §4 — generowanie świata (kilka seedów), na pinie
main=edb8fb56. Replikacja zwalidowanego wzorca z P1.3
(`dyspozycje/autobot/runs/R-RUSTPORT-P1-3-INTRO-START-Q1/03-final-control.md`).
UWAGA: poprzedni audyt (archiwum OpenClaw) odnotował, że generowanie "Standardowy" (duży rozmiar mapy)
NIE kończy się w rozsądnym czasie (stall) na starych pinach — sprawdzić, czy ten problem nadal
istnieje na edb8fb56, nie zakładać że jest naprawiony ani że nadal występuje.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
W świeżym, izolowanym checkoucie `main` (edb8fb56), w `gra/`:
1. `npm ci`.
2. Dev server BEZPOŚREDNIO przez Vite (pomijając `predev`): `node ./node_modules/vite/bin/vite.js
   --port <wolny port 5180-5199> --strictPort`. Sprawdzić `git status gra/data` czyste.
3. Playwright (`/opt/pw-browsers/chromium`) — dojść do ekranu generowania świata (po wyborze
   epoki/cywilizacji/rozmiaru mapy). Wygenerować świat dla co NAJMNIEJ 2 różnych rozmiarów mapy
   (najmniejszy dostępny i jeden większy — np. "Malenki" i "Standardowy" wg P1.6), z TIMEOUTEM na
   próbę (np. 60-90s) — jeśli generowanie nie kończy się w tym czasie, to jest WAŻNE ZNALEZISKO, nie
   błąd do ukrycia: odnotować dokładnie po jakim czasie przerwano, nie czekać w nieskończoność.
4. Zrzut ekranu wygenerowanej mapy dla każdego przetestowanego rozmiaru →
   `dyspozycje/rust-port/p1/screenshots/P1-8-worldgen-<rozmiar>.png`.
5. Opisać w `dyspozycje/rust-port/p1/P1-8-WORLD-GENERATION.md`: czas generowania per rozmiar (albo
   timeout), czy wynik jest deterministyczny dla tego samego seeda (wygenerować dwa razy z tym samym
   seedem jeśli UI na to pozwala, porównać), odniesienie do pliku/komponentu źródłowego generatora.
6. OBOWIĄZKOWO ubić proces dev servera na końcu (PID + potwierdzenie, port wolny) — NIEZALEŻNIE od
   tego czy generowanie się powiodło czy przerwano przez timeout.

ANTY-HALUCYNACYJNA REGUŁA
Jak w P1.3: zakaz opisu bez faktycznej próby z TEJ rundy. Nie zakładać wyniku na podstawie starego
audytu archiwum — zmierzyć na żywo na pinie `edb8fb56`.

BINARNE KRYTERIUM SUKCESU
Plik `.md` istnieje, co najmniej 2 rozmiary mapy faktycznie przetestowane (sukces z czasem ALBO jawny
timeout z podanym czasem), zrzuty dla udanych generacji, dev server ubity NIEZALEŻNIE od wyniku.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-8-WORLD-GENERATION.md`,
`dyspozycje/rust-port/p1/screenshots/P1-8-worldgen-*.png`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-8-WORLD-GENERATION-Q1/**`. Odczyt: `gra/**` (świeży checkout
main edb8fb56). Zero zapisu w ORYGINALNYM repo `gra/**`. Zakaz `npm run build`/`npm run dev`, zakaz
`git add -A`.

IZOLACJA
Świeży, osobny checkout/clone `main` (edb8fb56) w scratchpadzie sesji — NIE w `/home/user/The-Game`.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli dev server nie startuje — status INFRA.
Timeout przy generowaniu NIE jest FAIL tego tematu (to jest właśnie szukane znalezisko) — FAIL byłby
tylko brak próby/brak dowodu.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
