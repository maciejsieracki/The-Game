STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-NEWGAME-MENU-REORDER-Q1
GOAL: uklad kroku 4 wg wersji ostatecznej dispatchu (12 kart, 2 kolumny, okno zaawansowane wg KOREKTY 6, etykieta "Wojna epoki").
ZMIANY/COMMIT: oceniany SHA a9d9a28ce (kod 877f6d5fa + wip 0a8876f13 + obrona). Diff do 5ab3d58e2 mieści się w allowliście (newGameFlow.ts, ui-params.json, 4 testy newgame-*, run/**). Bez main.ts, WERSJE.md, rust-port, gra-robocza.
TESTY (odtworzone samodzielnie, npm ci): tsc --noEmit czysto; newgame-menu-reorder-layout PASS (6 konfiguracji); newgame-settings-layout-reposition PASS; newgame-bottom-navigation 270/0; newgame-adv-tooltip 30/0; newgame-sett-grid-layout 74/0; war-era-counter 82/0. Zrzuty obejrzane (realne ikony SVG, nieprzyciemnione).
ZARZUTY: 1-3 (raport/dispatch, zrzuty ze stubami, pomiar bazowy) ODDAL - naprawione w a9d9a28ce. 4 (komentarze "z udziałem gracza") ODDAL - tylko komentarze, widoczna etykieta z ui-params.json zmieniona. Zero NAPRAW. Zero DO DECYZJI.
BLOKADY: brak. Uwaga: baza settings-reposition NIE_ZMIERZONO (test asercjonuje nowy układ); sett-grid baza 6/8 fail (błąd sprzed zmiany).
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora; SHA do integracji = commit z tym plikiem (HEAD brancha worktree), kod identyczny z a9d9a28ce. Kolejność względem origin/rust-port/parity-v2 (44a3e9ccf): niezależne (temat webowy gra/, parity-v2 to port Rust; merge-base f4c89d008); integrować do main webowego, równolegle z DEFAULTS i ADV-APPLY (rozłączne regiony newGameFlow.ts).
DEPLOY/PUSH: NIE WYKONANO
