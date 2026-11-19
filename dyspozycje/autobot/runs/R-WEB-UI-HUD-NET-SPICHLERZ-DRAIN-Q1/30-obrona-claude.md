# R-WEB-UI-HUD-NET-SPICHLERZ-DRAIN-Q1 — obrona Operatora (Claude, runda 2)

STATUS: PASS-WITH-NOTES (zarzuty 1, 2, 3, 5 przyjęte i naprawione; zarzut 4 — dowód na żywo — NIE ZMIERZONO)
DOMAIN: GAME (UI/raportowanie HUD, bez zmiany ekonomii)
TEMAT: R-WEB-UI-HUD-NET-SPICHLERZ-DRAIN-Q1
GOAL: HUD netto surowca odejmuje drenaż Spichlerza (Ceramika 77 → 67, zgodnie z Δstanu).
BAZA: ef6cf45d6 (kandydat), naprawa na tej gałęzi; detach od ef6cf45d6.

## Odpowiedzi na zarzuty

1. Regresja M2 w resource-cards-gross-net-test.cjs — PRZYJMUJĘ, naprawione bez zmiany pliku testu.
   Wzorzec mutanta M2 to literał `netto: Math.round(r.ratePerTurn - resourceUsageSum(r) - resourceConverterInputSum(r)),`.
   Ten literał zostawiłem w resource-gross-net.ts (netto przed drenażem, potem `netto: przedDrenazem.netto - drenaz`).
   Wynik: resource-cards-gross-net-test 24 pass, 0 fail (zgodnie z bazą d425dd0a3).
   Uwaga: gra/tools/resource-cards-gross-net-test.cjs NIE pasuje do allowlisty (`resource-gross-net-*.cjs`), nie został zmieniony.

2. Brak testu behawioralnego empireSpichlerzDrainRatesForOwner — PRZYJMUJĘ, naprawione.
   Logika przeniesiona do `spichlerzDrainRatesForOwner` w resource-gross-net.ts; main.ts tylko deleguje (z parametrami i `operationalBuiltIds`).
   Funkcje Spichlerza wstrzykiwane przez `SpichlerzDrainDeps` (tylko `import type`), żeby moduł pozostał bez importów wykonawczych (test M2 bundluje kopię z TMP).
   Testy I.1–I.6 (prawdziwe funkcje + econ-params): Spichlerz I, dwa Spichlerze przy puli 15, Spichlerz II + sól, Spichlerz II bez soli, cudzy owner/brak Spichlerza, brak mutacji wejścia.
   Mutanty: I.M1 (`return {}`) i I.M2 (dryRun bez kumulacji) — oba wykryte przez testy I.1/I.2.

3. Tautologia w sekcji H — PRZYJMUJĘ, naprawione.
   Sekcja H używa teraz prawdziwej mutacji kopii resource-gross-net.ts (usunięcie odjęcia drenażu): wynik netto 77 != 67, test A by padł.
   Wcześniej czerwonego przebiegu przed poprawką nie wykonano (NIE ZMIERZONO) — mutacje wykonano na obecnym kodzie.

4. Dowód w żywej grze — PRZYJMUJĘ jako otwarte: NIE ZMIERZONO w tej rundzie.
   Nie uruchomiono biegu dymnego seed 4242 (bundle poza repo, odczyt tooltipu HUD). Ścieżka main.ts jest teraz pokryta
   przez ten sam helper co testy I.*, ale przepływ builtOf/cities w main.ts pozostaje sprawdzony tylko statycznie (test S).
   Wymagany bieg live przed READY_FOR_DEPLOY.

5. Drenaż dryRun per miasto bez kumulacji — PRZYJMUJĘ, naprawione.
   Helper kopiuje miasta i odejmuje pulę kumulatywnie w kolejności listy (jak silnik). Test I.2 (pula 15, dwa Spichlerze → drenaż 10, nie 20) i mutant I.M2.

## ZMIANY-COMMIT

Pliki (allowlista): gra/src/game/resource-gross-net.ts, gra/src/main.ts, gra/tools/hud-net-building-drain-test.cjs, dyspozycje/autobot/runs/R-WEB-UI-HUD-NET-SPICHLERZ-DRAIN-Q1/30-obrona-claude.md.
Nie zmieniono: hud.ts, economy-upkeep.ts, gra/data/**, resource-cards-gross-net-test.cjs, WERSJE.md.
Commit: patrz pole sha w odpowiedzi (SHA czubka tej pracy).

## TESTY (surowe liczby z własnych biegów)

- tsc --noEmit: exit 0
- hud-net-building-drain-test: 36 ok, 0 FAIL (przed poprawką kodu 25/0 — nowe testy I/H/S)
- resource-cards-gross-net-test: 24 pass, 0 fail
- hud-shortage-alert-converter: 17 ok, 0 FAIL
- resource-gross-net-converter-inputs: 18 ok, 0 FAIL
- hud-resource-card-state: 7 ok, 0 FAIL
- hud-resource-deficit-red: 41 pass, 0 fail
- hud-gross-net-rest: 820 ok, 0 fail
- hud-topbar-grid-gross-net (CHROME_PATH=/usr/bin/google-chrome): 1150 ok, 0 fail
- gross-net-numbers-only-unify: 35 ok, 0 FAIL
- resource-card-numbers-only: 14 pass, 0 fail
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: ALL GREEN
- ai-unit-replace-same-rules-test: 45 passed, 0 failed
- combat-test: All sanity checks passed.
- ai-economy-measure-hook-test (CHROME_PATH): 23/23 zielone

Uwaga: pierwsze uruchomienia hud-topbar i ai-economy-measure-hook bez CHROME_PATH padły na czasie/przeglądarce; po ustawieniu CHROME_PATH przeszły.
unit-replace-full-cost (39/1 wg Evaluatora) nie był uruchamiany w tej rundzie; wg raportu Operatora rundy 1 jest to FAIL pre-existing na bazie d425dd0a3.

## BLOKADY

- Dowód na żywo (zarzut 4): NIE ZMIERZONO.
- Czerwony przed poprawką (runda 1): NIE ZMIERZONO (nie wykonano na bazie).

## ZAŁOŻENIA

- Drenaż HUD liczony kumulatywnie przez kopię puli ownera w kolejności listy miast — odwzorowuje kolejność silnika tylko przybliżenie (silnik może płacić w innej kolejności; wynik różni się wyłącznie przy niewystarczającej puli).
- Parametry drenażu z econ-params wg trudności (`loadSpichlerzDrainParams`), jak w silniku.

## UWAGI-DLA-ORKIESTRATORA

- Allowlista: resource-cards-gross-net-test.cjs ma wzorzec M2 zależny od literału netto. Zostawiłem literał, więc nie trzeba zmieniać tego pliku. Jeśli FC uzna, że trzeba go zaktualizować, to wymaga rozszerzenia allowlisty.
- unit-replace-full-cost: pre-existing FAIL (wg rundy 1) — poza zakresem tego tematu.

RUNDY: 2/5 (obrona po FAIL rundy 1)
NASTĘPNY KROK: Evaluator (runda 2) — weryfikacja zarzutów 1–3, 5 i bieg live (zarzut 4) przed Final Control.
DEPLOY/PUSH: NIE WYKONANO
