STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1
GOAL: (A) zmierzyc i naprawic przebieg od decyzji AI do karty rozejmu na stole. (B) Roundtrip zapisu w rozejmie, wczytanie w nowej sesji Chromium, wygasniecie bez kary.

WERDYKT PER ZARZUT
1. Limit 120 s: ODDAL (zalozenie przyjete wprost). Generowanie swiata 77-95 s (logi: 79,3 / 77,4 / 82,1 / 85,7 s) jest poza scenariuszem. Oba testy maja strazniki scenariusza po swiecie 60 s; zmierzone 12-47 s. Limit calosci 150 s to bezpiecznik. Kryterium 1/2 czytam jako 120 s dla scenariusza po swiecie.
2. Karta rozejmu nie otwierana: ODDAL (naprawione w r3). gate-ai-table-rozejm-PO.txt: kartaWidoczna true, otwarto true, tekstRozejm true, klik Przyjmij daje PASS, EXIT=0. PRZED mapowania UI (gate-ai-table-rozejm-r3-PRZED-bez-mapowania-UI.txt): otwarto true, tekstRozejm false, EXIT=1. Regresja zmierzona. Wynik testu A zalezy teraz od DOM i akceptacji klikiem, nie tylko od wpisu stolu.
3. diplo-truce-live: ODDAL. gates/gate-diplo-truce-live-PO.txt 23/0; flake pierwszego przebiegu zachowany jawnie. "ring 15": brak pliku w gra/tools, NIE_ZMIERZONO (diplo-aggressor-wiring 15/0 to odczyt Operatora).
4. Logi bramek: ODDAL. Osobny plik na bramke, w kazdym dokladnie jedna linia EXIT= (petla grep -c po wszystkich plikach gates/ i runu), PRZED i PO. Czerwone PO: tylko gate-ai-PO i gate-civ-matrix-ai-diplomacy-wiring-PO (znane czerwone: ai-test 274/20, civ-matrix 42/1).
5. Sciezki absolutne: ODDAL. Jedyne trafienie grep /home/user|/tmp/claude w runie to zdanie opisujace ten grep w 03-operator-r3-obrona.md.

WERYFIKACJA WLASNA
- Diff 4d1916f2c..fa56addc6 poza runem: tylko gra/src/main.ts (peaceBareAllowed tylko rodzaj==='rozejm' && neededPn<=0 && brak pozycji; rozejm:'10' w CYW_ACTION_TO_UI_ID; case 'rozejm' w negotiationSummary; hak testowy __truceSaveLoadTestDebug), gra/tools/diplo-truce-ai-table-live-test.cjs, gra/tools/diplo-truce-saveload-live-test.cjs. Zero zmian w gra-robocza, WERSJE.md, rust-port, src-tauri. git diff --check czysty, git status czysty, gra/node_modules nieobecny.
- Poprawka mapowania UI: ZALOZENIE przyjete (poza dosłowna allowlista bloku, uzasadniona pomiarem, w GOAL).
- Pokoj bez zmian: gate-ai-table-pokoj-PRZED i -PO oba 0 wpisow, EXIT=1.
- Czesc B (gate-saveload-r3-*): save 3/0, load 9/0, expire 6/0, legacy 4/0, EXIT=0. Zgodne: truceUntilTurn=6, flaga agresora, casus belli, licznik wojen epoki, meta pary, Wiarygodnosc. Rozejm trwa w turze 5, wygasa w turze 6 bez kary i flagi. Stary zapis OK.
- Mutacje: MUT1 (zapis flagi) load 7/1 FAIL; MUT2 (odczyt meta pary) load 6/2 FAIL; zrodlo przywrocone.
- tsc --noEmit: gates/gate-tsc-PO.txt EXIT=0; Evaluator powtorzyl niezaleznie tsc EXIT=0, fazy B i truce-live 23/0.
- Wlasnego pelnego przebiegu Chromium FC nie powtarzal (ok. 125 s na przebieg); oparcie na logach z jedna linia EXIT, spojnych z niezaleznym powtorzeniem Evaluatora.

ZARZUTY NAPRAW: 0.
DO DECYZJI CZLOWIEKA (poza werdyktem tematu): pokoj (nie rozejm) nadal nie trafia na stol przy neededPn<=0.

KOLEJNOSC wzgledem origin/rust-port/parity-v2 (44a3e9ccf): temat webowy (gra/), merge-base z parity-v2 to f4c89d008; niezalezny od portu Rust, kolejnosc dowolna. UWAGA: origin/main (4d9ed1810) ma od bazy 4d1916f2c zmiany w gra/src/main.ts (AUTOIMPROVE, SPICHLERZ, BATTLE); integracja wymaga merge/cherry-pick da33a30f7, 5d321be81, fa56addc6 i ponownego tsc oraz bramek diplomacji po merge.

RUNDY: 3/5
NASTEPNY KROK: integracja orkiestratora, potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
