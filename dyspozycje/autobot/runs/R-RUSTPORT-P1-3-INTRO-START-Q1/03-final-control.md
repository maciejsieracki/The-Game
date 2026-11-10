STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-3-INTRO-START-Q1
GOAL: Pilot — ekran intro/start w żywym Chromium, pin main=edb8fb56.
RUNDY: 1/5 (5 zarzutów — głównie nadmiarowe/niezweryfikowane twierdzenia, nie błędy metody — Obrona
naprawiła, Final Control ODDAL po niezależnej weryfikacji zrzutu, kodu i procesów)

**METODA ZWALIDOWANA — to jest wzorzec dla P1.4-P1.9/P1.15:** świeży checkout → `npm ci` → dev server
uruchomiony BEZPOŚREDNIO przez `node ./node_modules/vite/bin/vite.js --port <N> --strictPort`
(z pominięciem `predev`/`export-data`, co omija zakaz CLAUDE.md i nie dotyka `gra/data`) → Playwright na
`/opt/pw-browsers/chromium` → zrzut ekranu → opis z odniesieniem do kodu źródłowego → **obowiązkowe
ubicie procesu** (potwierdzone w tym temacie: PID zabity, port zamknięty, brak wiszącego procesu).

ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-3-INTRO-START.md`,
`dyspozycje/rust-port/p1/screenshots/P1-3-intro-start.png` (1,33 MB, 1600×900, realne menu, nie
puste/czarne).

Potwierdzone: `git status gra/data` czyste przed i po, menu zgodne z `mainMenu.ts`/`main.ts`. Poprawki
po zarzutach: usunięto błędne twierdzenie "tylko dev" dla pozycji "Test wydajności" (w kodzie dodawana
bezwarunkowo), usunięto niezweryfikowane opisy HUD/Ustawień (brak dowodu na zrzucie), skrócono raport
do limitu.

BLOKADY: brak. Nieustalony błąd konsoli 404 odłożony do P1.16 (nie blokuje tego tematu).
NASTĘPNY KROK: integracja orkiestratora, replikacja wzorca na P1.4-P1.9/P1.15.
DEPLOY/PUSH: NIE WYKONANO
