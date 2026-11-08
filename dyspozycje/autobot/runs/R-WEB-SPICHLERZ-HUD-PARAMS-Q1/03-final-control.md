STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-SPICHLERZ-HUD-PARAMS-Q1
GOAL: Panel miasta liczy zuzycie Spichlerza z tych samych parametrow co silnik (`loadSpichlerzDrainParams`, wg trudnosci); pominiecie parametru = blad kompilacji, nie ciche 25.
ZMIANY/COMMIT: Final Control weryfikowal `1b2fd0f31` (kod `1d31fa318`, baza `37148c80a`). Allowlista: diff wzgledem bazy to cityPanel.ts (2 wywolania), building-resource-gate.ts, 4 testy gra/tools/*-test.cjs, raport Operatora, logi gates-*. Zero zmian w gra/data, gra-robocza, WERSJE.md, rust-port, turn-economy.ts. SHA do integracji: SHA commitu tego raportu (nad `1b2fd0f31`).
TESTY (uruchomione samodzielnie): `tsc --noEmit` EXIT=0; spichlerz-hud-params-parity 66/0; spichlerz-drain-keys 44/0; spichlerz-drain-pipeline 21/0; owned-building-inactive 4/0; spichlerz-panel-food-parity 11/0; empire-food-b5 34/0; owner-economy 20/0. Z logow gates-post (EXIT=0): diplomacy 148/0, war-era-counter 82/0, ring 15/0; 35/35 logow z linia EXIT=. Wszystkie wolania paySpichlerzDrainForCity/resolveOwnedBuildingInactiveStatus w src podaja parametry (cityPanel 1283, 9286; turn-economy 1358, 1797; gate 622). SPICHLERZ_DRAIN_DEFAULT_PARAMS usunieta. Mutacja 25/25/25 w cityPanel: test pada (potwierdzone przez Operatora i Evaluatora).
ZARZUTY: brak. Uwagi Evaluatora 1-4 (kruchy regex wiringu, parytet odtwarza computeView recznie, brak weryfikacji w przegladarce przy 25/25/25, czerwone testy wspolne PRE/POST w bazie) -> ODDAL (nie dotycza tego diffu / nie blokuja kryteriow).
BLOKADY: brak
RUNDY: 1/5 (Final Control)
KOLEJNOSC: baza `37148c80a` (DRAIN-KEYS) musi byc w main przed tym tematem; temat dotyczy wylacznie `gra/` webowego i jest rozlaczny z origin/rust-port/parity-v2 (brak wspolnych plikow) — kolejnosc wzgledem parity-v2 dowolna.
NASTEPNY KROK: integracja orkiestratora (cherry-pick/merge na main po DRAIN-KEYS), potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
