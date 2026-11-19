STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-ERA-REBALANCE-ENABLE-Q1
GOAL: eraRebalansAktywny=true jako domyslne na ROBOCZEJ (decyzja wlasciciela 2026-11-19, ABC A); testy zgodne z flaga.
ZMIANY/COMMIT: baza df20918b3; gra/data/econ-era-rebalance-params.json (flaga true, opis z cofnieciem = false); 7 plikow gra/tools/*.cjs (patrz TESTY); ten raport. Brak zmian w gra/src/**.
TESTY:
- tsc --noEmit: exit 0
- logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/0; combat 6/6
- econ-era-rebalance-test 37/0 (po zmianach; przed zmianami 28 ok / 9 FAIL)
- ai-economy-measure-hook-test 23/0; hud-shortage-alert-converter 17/0; resource-gross-net-converter-inputs 18/0; hud-resource-card-state 7/0; hud-net-building-drain 36/0
- citizen-consumption-era-mult-test PASS (baseline 77/0; mutacje M1-M3 czerwone)
- citizen-upkeep-era-mult-test 681/0; foundry-throughput-x2-era-mult-test 159/0
- Zmienione testy legacy (jawnie flaga OFF w kontekscie testu): citizen-consumption-era-mult, foundry-throughput-x2, population-growth-v85-bonus, unit-epoch-cost, kamieniolom-kamien-epoka, improvement-era-scaling.
- econ-era-rebalance-test: E1 oczekuje ON; E2/E5/E8 ustawiaja OFF jawnie; mutant M1 przerobiony na "domyslnie OFF" (przy danych ON stary mutant byl niewykrywalny). Asercje nie oslabione, zadnego testu nie usunieto.
- Uruchomione 102 testy z grep-u wartosci epokowych: 81 zielonych po wlaczeniu flagi (w tym 6 zmienionych wyzej, 1 zielony po poprawce); 21 czerwonych: 4 zmienione wyzej (legacy); 17 czerwonych RÓWNIEZ z flaga OFF na oryginalnych danych (stan bazy, nie zwiazane z flaga): auto-fort-claim, autoimprove-irrigation-after-farms (timeout), building-upkeep-resources, citypanel-konwerter-produkcja, ekonomia-5x-inwariant, entity-card-cross-links-nested-overlay, fishing-boats-666, grupa-b-lane, hex-plony-magazyn, hodowla-las, hotseat-etap5-no-leak (timeout), hud-skarbiec, mennica-magazyn, rekrutacja-koszty-polowa-all, stadnina-early-eras-deposit-only, tarasy-cywilizacje, map-improvement-qualify. Dodatkowo zloto-test: 7 fail identycznie z OFF (lacznie 18 bazowych). Przyczyny NIE ZMIERZONO.
- Dym: bieg 30 tur, seed 4242, --player-ai 1, BEZ --rebalance, bundle poza repo (scratchpad/smoke). Bundle zawiera eraRebalansAktywny:!0 (true). Pole ecoRebalance w rekordzie = null, bo runner zapisuje flage tylko przy --rebalance (runner nie zmieniany). Gracz t30 surowceBrutto = 42 (ref. ON 42, OFF 56). Brak NaN w jsonl, brak crash. CHROME_PATH=/usr/bin/google-chrome.
BLOKADY: brak dla celu tematu; 18 testow czerwonych w stanie bazy wymaga osobnego tematu.
RUNDY: 1/5
NASTEPNY KROK: Final Control: przeglad diffu testow (legacy vs aktualizacja) i decyzja o 18 czerwonych testach bazowych.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: runner ai-economy-measure-run.cjs nie zapisuje flagi bez --rebalance; rozwazyc odczyt flagi z bundla (poza tym tematem).
