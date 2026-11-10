STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-DELTA-3-Q1
GOAL: Pomiar delty dc8a3adc -> 4bbef081d (dokumentacja, zero zmian kodu). Wynik w dyspozycje/rust-port/p6/REPIN-DELTA-3.md.
ZMIANY/COMMIT: allowlista: dyspozycje/rust-port/p6/REPIN-DELTA-3.md (NOWY), dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-3-Q1/** . Zmiany kodu: brak (rust-port/**, src-tauri/**, gra/** nietknięte). Commit: 48fecbd12 (wpis w odpowiedzi operatora; SHA nie może być wpisany w sam commit).
TESTY: git diff --check: czysty (rc=0). Pomiar: git diff --name-only -> 47 plików gra/src+gra/data (+4859/-839); git diff -U0 -> 541 hunków, klasa: 418 behawioralnych, 52 komentarz, 19 opis-dane, 39 import/typ, 12 dane-JSON, 1 pusty. Bramki gry (build/testy) nie uruchamiane — brak zmian kodu.
BLOKADY:
- cityPanel K01–K09 i kopie frontend-v2: NIE_ZMIERZONO (REPIN-DELTA-2.md nieobecny w checkoucie; definicji K01–K09 brak).
- Tematy 8H2, 8A, 8G: NIE_ZMIERZONO (ID nie występują w checkoucie w tym znaczeniu; 8I/8I2 dopasowane po treści do R-WEB-AUTOIMPROVE-*).
- 21 hunków bez właściciela (render/unitOwnerEmblem.ts 14, ui/hexContextTooltip.ts 5, data/tech.json 1, data/ui-params.json 1): NIEPRZYPISANY — decyzja orkiestratora.
- Klasyfikacja hunków heurystyczna (skrypt), nie ręczna.
- Brak GOAL-RUST-PORT w repo: nie potwierdzono zakresu portu względem tematów.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator weryfikuje klasyfikację i tabelę wpływu; orkiestrator rozstrzyga 21 hunków NIEPRZYPISANY i ID 8H2/8A/8G.
DEPLOY/PUSH: NIE WYKONANO

Rekomendowana kolejność aktualizacji (skrót): 1) dane/parametry; 2) ekonomia Spichlerz i stawka per epoka (-> resource_production.rs / building_costs.rs); 3) forty/terytorium (promień 10->5); 4) auto-ulepszenia (8I/8I2); 5) wojna/pokój/era-war (brak modułu dyplomacji w domain/); 6) zapis hot-seat, HUD, bitwa.

Najważniejsze zmiany behawioralne (plik:linia): map/territory.ts:85,90 (fort r 10->5); terrain-improvements.json:277,401 (zasięgi fortu 5, Brąz 3); econ-params.json:388,395,402 (Spichlerz I/II: Ceramika/Sól); citizen-resource-upkeep.ts:156-409 (stawka per epoka 1/2/3); main.ts:32278 (usunięty auto-koniec wojen wymuszonych, -187); main.ts:36451 (brak limitu wojny wymuszonej); main.ts:42727-42775 (zapis: pula Pracy, HUD); victory.ts:95-225 (przegrana); battleScene.ts:3465 (standoff).
