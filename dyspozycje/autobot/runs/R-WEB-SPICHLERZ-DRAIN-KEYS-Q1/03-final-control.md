STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-SPICHLERZ-DRAIN-KEYS-Q1
GOAL: Zużycie Spichlerza (Ceramika I/II, Sól II) czytane z econ-params.json wg trudności; 25/25/25 bez zmian.
ZMIANY/COMMIT: weryfikowany HEAD 037fa0e59 (kod cc8b6a261 na 68e07ccb2 na 4d1916f2c). Ten raport: jedyna zmiana FC.
TESTY (własne, HEAD 037fa0e59): tsc --noEmit EXIT=0; spichlerz-drain-keys 44/0; spichlerz-drain-pipeline 21/0 (GOLDEN-DIGEST 9fe8c371... zgodny z logami base i head); owned-building-inactive 4/0; empire-food-b5 34/0; owner-economy 20/0; panel-food-parity 11/0; diplomacy 148/0; war-era-counter 82/0.
Własna mutacja okablowania (advanceCityEconomy podaje SPICHLERZ_DRAIN_DEFAULT_PARAMS zamiast spichlerzDrainParams): pipeline-test 10 pass / 11 FAIL (zarzut 1 Evaluatora rozwiązany). Mutacja cofnięta, drzewo czyste.
Allowlista: diff 4d1916f2c..HEAD tylko econ-params.json (opisy), building-resource-gate.ts, turn-economy.ts, gra/tools/*, runs/<ID>/**. Logi: 34 pliki w gates-head i gates-base, po jednej linii EXIT=. Pełnych 32 bramek NIE powtarzano (NIE_ZMIERZONO samodzielnie; oparte na logach).
WERDYKT ZARZUTÓW:
1 ODDAL (naprawione w r2: test przez advanceCityEconomy, mutacja pada).
2 ODDAL (default w tickEmpireResourcePipeline usunięty; default w paySpichlerzDrainForCity/resolveOwnedBuildingInactiveStatus = ta sama stała fallback 25, usunięcie wymaga cityPanel.ts poza allowlistą - ZAŁOŻENIE).
3 ODDAL (golden zmierzony na bazie i head, digest identyczny; I+II = jedna wypłata ceramiki wg II - udokumentowane ZAŁOŻENIE).
4 ODDAL do orkiestratora: wpis R-WEB-SPICHLERZ-HUD-PARAMS-Q1 (cityPanel.ts:1281, :9278 przekazać loadSpichlerzDrainParams, potem usunąć default) musi być w rejestrze przed integracją; nie jest defektem kodu rundy. Przy obecnych 25/25/25 zachowanie identyczne.
BLOKADY: brak techniczny; warunek rejestracji R-WEB-SPICHLERZ-HUD-PARAMS-Q1.
RUNDY: 3/5
NASTĘPNY KROK: integracja orkiestratora; SHA do integracji = SHA commitu tego raportu (nad 037fa0e59). Kolejność: niezależne od origin/rust-port/parity-v2 (zmiany tylko gra/, bez rust-port/**) - dowolna kolejność, brak konfliktu plikowego.
DEPLOY/PUSH: NIE WYKONANO
