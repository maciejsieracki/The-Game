STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-DEFEATED-UNIT-STAYS-ON-BATTLE-HEX-Q1
GOAL: Przegrana grupa, gdy kierunek wprost od zwyciezcy jest zablokowany, odskakuje na inne pole (2 heksy, potem 1), a nie zostaje na heksie bitwy. Obrona zarzutow Evaluatora (f318d89).
ZMIANY-COMMIT: Kod gry bez zmian (gra/src/game/post-battle-map.ts z kandydata 057788a). Zmiana tej rundy: gra/tools/battle-defeat-retreat-blocked-direction-test.cjs (dopisane S6 AUTO, S7 AUTO, S8 zajete 3 heksy). SHA: patrz pole sha w odpowiedzi.
ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJE i naprawiam: dopisany tryb AUTO (bez manualSurvivors). S6 AUTO: odskok 2 heksy na (11,20), pass. S7 AUTO: nic wolnego -> zostaje (11,22), pass.
2. PRZYJMUJE jako osobny temat, bez zmiany w tej rundzie: wybor kierunku "wprost" (pickRetreatTargetAwayFromAttacker, kwadrat euklidesowy) jest zachowaniem sprzed zmiany i wplywa na wszystkie odwroty, takze nieblokowane (S5 kontrola przypina kierunek wprost). Zmiana wymagalaby osobnej rundy z korekta testow dwu-heksowych. Kaskada w tej rundzie nie zalezy od tego wyboru w przypadkach S1-S4.
3. PRZYJMUJE jako uwage poza zakresem (retreatAtkRosterToStart bez kaskady). Nie zmieniane.
4. PRZYJMUJE i mierze: hipoteza A (liczebnosc). Liczebnosc armii wchodzi do odwrotu tylko przez zajetosc heksow (isUnitAt), nie przez licznik. Zwyciezca na jednym heksie (jak na zrzucie) nie blokuje heksow "od zwyciezcy". S8 (3 heksy od zwyciezcy zajete): kaskada nie znajduje wolnego heksu, dotychczasowy fan-out idzie krok 2 i daje (13,20), nie zostaje na heksie bitwy. Stan "zostaje" wystepuje tylko gdy zablokowane sa WSZYSTKIE sasiednie heksy (S3/S7). Nie odtworzono zrzutu wlasciciela z 71 jednostkami (NIE ZMIERZONO na pelnej liczbie); wynik Evaluatora (69 jednostek, (13,20)) zgodny z S8.
TESTY (surowe wyniki, uruchomienie w tym worktree po npm ci --ignore-scripts w gra/):
- battle-defeat-retreat-blocked-direction-test: S1 (11,20) d2; S2 (11,21) d1; S3 (11,22) zostaje; S4 (11,20) d2; S5 (13,20) d2; S6 AUTO (11,20) d2; S7 AUTO (11,22) zostaje; S8 (13,20) d2 -> 16 pass, 0 fail.
- battle-defeat-survivor-retreat-two-hex-test: 44 pass, 0 fail.
- NIE ZMIERZONO w tej rundzie: tsc, logic-test, tech-tree, research, unit-replace, combat (kod gry nie zmieniony), zywy Chromium (opcjonalne), mutacja nowego testu (wykonana przez Evaluatora).
BLOKADY: brak.
RUNDY: 2/5 (odpowiedz na ocene Evaluatora 1/5).
NASTEPNY KROK: Evaluator (weryfikacja S6-S8), potem Final Control. Osobne tematy: kierunek wprost (zarzut 2), retreatAtkRosterToStart (zarzut 3).
DEPLOY/PUSH: NIE WYKONANO
