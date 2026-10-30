STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-DELTA-2-Q1
GOAL: REPIN-DELTA-2 (faza U0): pomiar delty weba po pinie edb8fb56 / 91dc998a do origin/main dc8a3adc (hunki etapu 2, dryf K01–K09, kopie frontend-v2, wektory do regeneracji, pin docelowy, korekta U1–U5, 27 nowych plików). Dokumentacja, zero zmian kodu.
ZMIANY/COMMIT: allowlista: `dyspozycje/rust-port/p6/REPIN-DELTA-2.md` (NOWY, główny wynik) oraz `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-2-Q1/**` (ten raport + skrypty pomiarowe w `tools/`). Brak zmian w `rust-port/**`, `src-tauri/**`, `gra/**`. SHA commitu: wpisany w sekcji „Commit” poniżej.
TESTY:
- Pin odczytu: `origin/main` = dc8a3adc989bc82aab2cde6bb747c883f949fc1a (git fetch origin main).
- Liczby bazowe: commity edb8fb56..origin/main = 186; 91dc998a..origin/main = 99; edb8fb56..91dc998a = 87; plików gra/src+gra/data zmienionych od edb8fb56 = 101 (27 nowych); etap 2 = 23 pliki, +1733/−358; hunki etapu 2 = 251.
- Liczba plików z TODO/CZĘŚĆ (etap 1 do domknięcia) = 50; wszystkie 101 plików ma wpis w tabeli tematów (brak braków).
- Dryf K-bloków (parity-v2 db102531, narzędzia z tools/dom-harness):
  - K09A: measure-k09a-drift.mjs EXIT 0, 9/9 SAME.
  - K08D: measure-k08d-drift.mjs EXIT 1, 2/11 zmienione (buildHandelDetailCard, buildWealthDetailCard).
  - K08E: measure-k08e-drift.mjs EXIT 0, kopie 0/12 rozjechane, pin vs main 11 SAME + 1 DRIFT(1) (buildTopBarRekruciDetailCard).
  - K01–K07, K08A–C: NIE_ZMIERZONO (brak narzędzia measure-k0* na parity-v2); zastępczo pomiar funkcji cityPanel.ts: 300 funkcji, 278 identycznych, 22 zmienione, 0 usunięte, 6 nowych.
- Kopie frontend-v2: verify-pin-copies.mjs plików=435 niezgodnych=0 (EXIT 0); względem origin/main identyczne=433, rozjechane=2 (src/ui/armyMergePanel.ts, src/ui/unitActionBarHtml.ts).
- Wektory: 89 plików rust-port/engine/tests/*_vectors/* z literałem pinu (66 edb8fb56, 23 91dc998a); generatory w dyspozycje/autobot/runs: 69 z edb8fb56, 10 .mjs z 91dc998a; meta.pin nie istnieje w rust-port/ (parity-v2).
- Bramki cargo/npm: nie dotyczą (zgodnie z dispatchem). `git diff --check`: patrz sekcja „Kontrola” poniżej.
BLOKADY: brak blokad technicznych. Luki (przyjęte jako ZAŁOŻENIE w dokumencie, sekcja 9): (1) klasyfikacja hunków heurystyczna (behawioralna = górny szacunek); (2) brak narzędzia pomiaru dla K01–K07 i K08A–C; (3) brak pliku meta.pin; (4) weryfikatory Python nie objęte pomiarem; (5) tematy spoza U1–U5 (REPIN-MAIN, REPIN-AUTOIMPR, REPIN-DANE-2, REPIN-ZAPIS-AUDIO) przypisane do U1; (6) konflikt tematu warAllInCapital.ts (P6.11–12 vs WOJNA-NOWE-D) rozstrzygnięty na WOJNA-NOWE-D.
RUNDY: 1/5 (ostatni werdykt: brak; to pierwsza runda Operatora)
NASTĘPNY KROK: Evaluator (weryfikacja liczb z komend z sekcji 8 dokumentu REPIN-DELTA-2.md, wybór zalecanego pinu dc8a3adc, sprawdzenie zakresu allowlisty), następnie Final Control. Dopiero po nich U1 (WOJNA-2: formationRules refresh i wektor formation-rules.json jako pierwszy temat).
DEPLOY/PUSH: NIE WYKONANO

## Kontrola
- Pin docelowy zalecany: dc8a3adc (do powtórzenia przed U4: `git rev-list --count dc8a3adc..origin/main`).
- Najważniejsze ustalenia: (a) etap 2 dotyka 23 plików, w tym battleScene.ts (+443/−58) i main.ts (+207/−64) — oba zależą od U5/REPIN-MAIN; (b) K08D i K08E już dryfują względem pinu (wcześniejszy plan mówił o braku dryfu); (c) dwie kopie frontend-v2 (armyMergePanel, unitActionBarHtml) są rozjechane z main; (d) formation-rules.json wymaga zmiany treści, nie tylko pinu.
- Skrypty pomiarowe (w tym katalogu `tools/`): hunks.mjs (klasyfikacja hunków), join.mjs (złączenie z tabelą planu), copies-drift.mjs (kopie vs main), cp-funcs.mjs (dryf funkcji cityPanel). Wejścia: `git diff -U0` i archiwa `git archive` z pinów; ścieżki w skryptach wskazują na katalog roboczy sesji.

## Commit
SHA: (uzupełnione po commicie, patrz historia gałęzi `wf/R-RUSTPORT-REPIN-DELTA-2-Q1`)
