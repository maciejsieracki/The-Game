# R-WEB-MEASURE-HARDER-RUNNER-LONG-RUN-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzia pomiarowe; zero zmian gra/src)
TEMAT: R-WEB-MEASURE-HARDER-RUNNER-LONG-RUN-Q1
GOAL: runner diplomacy-harder-measure-run.cjs ma mieć autopilot gracza (`--player-ai`, domyślnie 1), obsługę pokoju wymuszonego i zamykanie blokad przez jedno źródło selektorów; bieg dowodowy ≤45 tur.
ZMIANY-COMMIT: gra/tools/diplomacy-harder-measure-run.cjs, gra/tools/diplomacy-harder-measure-analyze.cjs, gra/tools/diplomacy-harder-measure-hook-test.cjs (allowlista) oraz ten raport. Baza: de14a49a9. SHA commita: pole sha w wyniku Operatora.

## Co zrobiono
- `--player-ai 0|1` (domyślnie 1): po starcie gry i foundFirstCity, przed pierwszym endTurn, wywołanie `__aiEconomyMeasure.setPlayerAiAutopilotForTest(true)` z odczytem `playerAiAutopilotForTestState()`; błąd, gdy odczyt != true.
- `acceptForcedPeace` (measure-forced-peace.cjs) wołane w `playOneTurn` przed sprawdzeniem canEnd; licznik `forcedPeaceAccepted` w wierszu i w summary (counters). Wiersz ma też `playerAi`; summary ma `graczAdnotacja`.
- Zamykanie kart technologii: NIE dodano nowej pętli. Runner już wywołuje `base.closeEndTurnModals`, które używa `TECH_SEL` z measure-close-modals.cjs. Premisa dispatchu (c) była nieaktualna.
- Analizator: pairType bez zmiany semantyki kolumn (pole `gracz`); `autopilotNote` dopisuje „gracz = autopilot” do nagłówka, gdy wiersze mają playerAi=1.
- Test haka/runnera: sekcja C (wiązanie runnera + 2 mutacje kopii w pamięci). Mutacje wykrywane.

## TESTY (surowe wyniki)
- node --check: 3/3 OK.
- analyze --selftest: 11 zielonych, 0 czerwonych, EXIT=0.
- measure-forced-peace-test: 13/13 ZIELONE.
- measure-close-modals --selftest: SELFTEST ZIELONY (5).
- diplomacy-harder-measure-hook-test (z bundlem, CHROME_PATH=/usr/bin/google-chrome): WYNIK: 18 zielonych, 0 czerwonych (15 dawnych + 3 z sekcji C).
- tsc --noEmit: EXIT=0, 0 linii wyjścia.
- logic-test 213, tech-tree 20, research 33, unit-replace 21, combat 6: NIE ZMIERZONO (zmiana dotyczy tylko narzędzi pomiarowych, nie gra/src).
- Bundle: vite build do katalogu w scratchpadzie sesji (poza repo), EXIT=0.

## Bieg dowodowy (seed 4242, --harder 1 --player-ai 1, świeży profil, --turns 45)
- Wynik: endTurn=45, rows=44, stop=null, wallSec=208, jeden Chromium.
- Bez NaN (grep: 0). playerAi=1 w 44 wierszach. Log: `player-ai autopilot=1`.
- Wojny w turach 5/10/…/40: 0; tura 45: 3 (wojny w wierszu 45 = 7). Pary 79, pominięte 12, owners 14, gracz 0.
- forcedPeaceAccepted = 0 (w 45 turach nie wystąpił pokój wymuszony; ścieżka akceptacji NIE została wykonana na żywo — NIE ZMIERZONO).
- Zamknięcia modali = 0; battlesAuto i gateActiveTurns = 0.
- Efekt autopilota vs pasywny gracz: NIE ZMIERZONO (brak biegu OFF z autopilotem 0 w tym zadaniu).

## BLOKADY
- Brak blokady kodu. Dowód ścieżki pokoju wymuszonego i porównanie autopilot 0/1 wymagają biegów orkiestratora.

## RUNDY
1/5

## NASTĘPNY KROK
Orkiestrator: po integracji uruchomić długi bieg (kontener może mieć restarty). Polecenie, z katalogu gra/ (bundle, profil i wyjście poza repo; <abs> = absolutne ścieżki):

CHROME_PATH=/usr/bin/google-chrome setsid nohup node tools/diplomacy-harder-measure-run.cjs --dist <abs>/dist-harder --out <abs>/out-150-on --profile <abs>/profile-150-on --seed 4242 --turns 150 --harder 1 --player-ai 1 --every 5 > <abs>/run-150-on.log 2>&1 &

Dla OFF: ten sam bieg z `--harder 0`, osobne --profile i --out. Jeden Chromium naraz. Analiza: node tools/diplomacy-harder-measure-analyze.cjs --off <abs>/out-150-off --on <abs>/out-150-on

DEPLOY/PUSH: NIE WYKONANO
