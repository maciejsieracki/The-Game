STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-9-MAP-HUD-PANELS-Q1
GOAL: P1.9 z PLAN-PORT-RUST-TAURI-20261020.md §4 — ekran mapy/HUD/panele/tooltipy/dialogi (stan gry
po wejściu do rozgrywki), na pinie main=edb8fb56. Replikacja zwalidowanego wzorca z P1.3
(`dyspozycje/autobot/runs/R-RUSTPORT-P1-3-INTRO-START-Q1/03-final-control.md`). To OSTATNI
specyficzny ekran z listy P1.3-P1.9 — po nim zostaje tylko P1.15 (indeks zrzutów, zbiorczy).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

WAŻNA POPRAWKA PROCESOWA (z P1.4): przy sprzątaniu procesu dev-servera ubijaj WYŁĄCZNIE PID
zapisany PRZEZ SIEBIE na starcie (np. `$!` zaraz po uruchomieniu w tle), NIGDY przez dopasowanie
wzorca nazwy/portu (`pkill -f vite`, przeszukiwanie `ps` po porcie innym niż własny). W tym kontenerze
działa RÓWNOLEGLE kilka innych tematów z własnymi serwerami Vite na innych portach — ubicie cudzego
procesu psuje inny temat.

ZADANIE
W świeżym, izolowanym checkoucie `main` (edb8fb56), w `gra/`:
1. `npm ci`.
2. Dev server BEZPOŚREDNIO przez Vite (pomijając `predev`): uruchom w tle, zapisz PID (`$!`),
   `node ./node_modules/vite/bin/vite.js --port <wolny port 5180-5199> --strictPort &`. Sprawdzić
   `git status gra/data` czyste.
3. Playwright (`/opt/pw-browsers/chromium`) — dojść do stanu właściwej rozgrywki (po wygenerowaniu
   świata — patrz P1-8-WORLD-GENERATION.md dla kroków, użyj najmniejszego/najszybszego rozmiaru mapy).
4. Zrzuty: widok mapy ogólny, HUD (górny pasek zasobów/tura), otwarty panel miasta (klik na miasto
   gracza jeśli istnieje na starcie), tooltip (hover nad polem/jednostką jeśli możliwy do wywołania
   automatycznie), menu/dialog w grze (np. menu pauzy) →
   `dyspozycje/rust-port/p1/screenshots/P1-9-map-hud-*.png` (ponumerowane).
5. Opisać w `dyspozycje/rust-port/p1/P1-9-MAP-HUD-PANELS.md`: elementy HUD (co pokazują, skąd dane),
   dostępne panele i jak się je otwiera, odniesienie do pliku/komponentu źródłowego dla każdego.
6. OBOWIĄZKOWO ubić WŁASNY proces dev servera na końcu (dokładnie ten PID z kroku 2, potwierdzić że
   zniknął, i że port jest wolny) — zgodnie z poprawką procesową powyżej.

ANTY-HALUCYNACYJNA REGUŁA
Jak w P1.3: zakaz opisu bez faktycznego zrzutu z TEJ rundy.

BINARNE KRYTERIUM SUKCESU
Plik `.md` istnieje, co najmniej 3 różne zrzuty (mapa, HUD, panel/dialog) istnieją i są sensowne,
`git status gra/data` potwierdzone czyste, WŁASNY proces dev servera ubity z potwierdzeniem PID.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-9-MAP-HUD-PANELS.md`,
`dyspozycje/rust-port/p1/screenshots/P1-9-map-hud-*.png`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-9-MAP-HUD-PANELS-Q1/**`. Odczyt: `gra/**` (świeży checkout
main edb8fb56). Zero zapisu w ORYGINALNYM repo `gra/**`. Zakaz `npm run build`/`npm run dev`, zakaz
`git add -A`.

IZOLACJA
Świeży, osobny checkout/clone `main` (edb8fb56) w scratchpadzie sesji — NIE w `/home/user/The-Game`.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli dev server nie startuje — status INFRA.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
