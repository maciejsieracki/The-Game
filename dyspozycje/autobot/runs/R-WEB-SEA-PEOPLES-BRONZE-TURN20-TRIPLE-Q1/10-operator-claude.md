STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SEA-PEOPLES-BRONZE-TURN20-TRIPLE-Q1
GOAL: Epoka Ludów Morza startuje w 20. turze OD WEJŚCIA gracza (owner 0) w Brąz i trwa do jego wejścia w Żelazo; w tym oknie liczba jednostek barbarzyńców (limit na obóz i limit rajdów morskich) x3 względem bazy wybranej trudności barbarzyńców; komunikat raz, z dedupem po save/load; wyłączeni barbarzyńcy pozostają wyłączeni.

BAZA: origin/main cfa5d1e65 (detach). Model Operatora: Haiku 5.5. Runda 1/5.

AUDYT (wynik):
- Istniejący mechanizm Ludów Morza: `gra/src/game/barbarians.ts` (`LUDY_MORZA_BARB_UNIT_IDS`, `pickBronzeBarbUnit`, `spawnSeaPeoplesRaiders`, `loadSeaBarbParams`) i `gra/src/main.ts` (blok tury barbarzyńców, `player.era === 2`, ok. linii 42836-42900). Rozszerzony, nie zduplikowany.
- Gating globalny/gracza: `player.era === 2` (bramka Brązu dla spawnu rajderów i zastąpienia typu). Zostaje bez zmian; okno x3 dokłada się na nią (wymaga era==2 i braku wejścia w Żelazo).
- Gating per właściciel: istniejące mapy `bronzeEraEnterTurnByOwner` i `ironEraEnterTurnByOwner` (main.ts ok. 2280/2376), zapisywane w meta save i odtwarzane przy load, z kluczem 0 = gracz (HUMAN_OWNER_PRIMARY). Użyte jako źródło czasu okna.
- Jednostki na obóz: `BarbParams.unitsPerCamp` (1/2/3 wg trudności: easy/normal/hard, `barbarianUnitsPerCampForDifficulty`), używane w `tickCamps` (limit na obóz) i w `spawnSeaPeoplesRaiders` (limit = maxSeaCamps x unitsPerCamp).
- Powiadomienia: `warEventLog` (SidePanelEvent) z `stampEventTurn` i `trimWarEventLog`, już używane w main.ts.
- Istniejących rajderów NIE usuwam (zgodnie z dispatchem: nie kasować po cichu). Zmiana dotyczy tylko nowych spawnów.

ZMIANY-COMMIT (allowlista):
- gra/src/game/barbarians.ts: nowe pure helpery `SEA_PEOPLES_BOOST_ELAPSED_TURNS` (20), `SEA_PEOPLES_UNIT_MULT` (3), `seaPeoplesBoostActive(bronzeEntry, ironEntry, turn)`, `boostBarbParamsForSeaPeoples(params, active)` (mnoży TYLKO unitsPerCamp), `shouldEmitSeaPeoplesEpochNotice(active, alreadyShown)`.
- gra/src/main.ts (tylko sekcja Ludów Morza i save/load/new-game):
  - import trzech helperów z barbarians;
  - `let seaPeoplesNoticeShown = false` obok `bronzeEraEnterTurnByOwner`;
  - reset `seaPeoplesNoticeShown = false` przy nowej grze (obok `bronzeEraEnterTurnByOwner.clear()`);
  - zapis `seaPeoplesNoticeShown` w save meta; odczyt `saved.meta?.seaPeoplesNoticeShown === true` (brak pola = false);
  - w bloku tury barbarzyńców: `seaPeoplesActive` (era gracza == 2 i okno), jednorazowy wpis w warEventLog ('Epoka Ludów Morza', kind 'enemy', negative), `barbLiveBoosted` używany w `barbLiveForSpawn` (tickCamps) i w `spawnSeaPeoplesRaiders`.
- gra/tools/sea-peoples-boost-test.cjs (NOWY): 42 asercje, standalone (esbuild), bez zmian w logic-harness.
- dyspozycje/autobot/runs/R-WEB-SEA-PEOPLES-BRONZE-TURN20-TRIPLE-Q1/10-operator-claude.md (ten raport).
- Nie zmieniano: gra-robocza/**, WERSJE.md, gra/ dane (data/ai-params.json), wieki/UI, nic w Rust.

TESTY (surowe wyniki z tej rundy):
- `node ./node_modules/typescript/bin/tsc --noEmit` (gra/): exit 0, bez błędów (baza i po zmianach).
- `node tools/barbarians-test.cjs` (baza): 213 passed, 0 failed; po zmianach: 213 passed, 0 failed.
- `node tools/sea-peoples-boost-test.cjs` (NOWY): 42 passed, 0 failed, exit 0. Pokrycie: progi elapsed 18/19/20/21 (Bronze wejście T=100 -> 118 off, 119 off, 120 ON, 121 on); Bronze->Iron (Iron=150: 149 on, 150 off, 151 off); Iron przed elapsed20 (110 -> nigdy); owner-relative (owner A Bronze 50 vs owner B Bronze 100 przy turze 70); trudność: easy 1->3, normal 2->6, hard 3->9; boost zmienia tylko unitsPerCamp (reszta pól identyczna, obiekt bazowy nie mutowany, inactive = ta sama referencja); off mode: `barbariansEnabledForLevel('brak') === false`; notice raz w oknie 118..125 (1 emisja), po symulowanym save/load brak duplikatu (0 emisji w 126..130), stary zapis bez pola -> false.
- Regresje powiązane (uruchomione, wynik nie jest spowodowany moimi zmianami wg zakresu diffu, patrz BLOKADY): era-war-delays-test 55 OK / 0 FAIL; forced-war-bronze-new-game-reset-test 41 PASS / 0 FAIL; forced-war-bronze-main-guard-test 21 PASS / 1 FAIL (asercja o finalizePeaceTreatyBetween / bronzeForceWarActiveByPairKey); forced-war-iron-main-guard-test 34 PASS / 1 FAIL (asercja o finalizePeaceTreatyBetween / cleanupIronForcedWarOnPeace); ai-dlug-porzadki-q1-test: ReferenceError `regularWarCapturedByPairKey is not defined` w skrypcie testu (przed asercjami).
- NIE_ZMIERZONO: uruchomienia tych trzech testów NA BAZIE cfa5d1e65 nie wykonano (brak osobnego checkoutu bazy w tej rundzie); wnioskuję z zakresu diffu (zmienione są tylko barbarians.ts i blok Ludów Morza/save/new-game w main.ts; asercje dotyczą innych funkcji).
- NIE_ZMIERZONO: vite build i przeglądarka (Chromium) - nie uruchamiano; komunikat wymaga wizualnej weryfikacji w grze przed deployem.

BLOKADY / OTWARTE:
- ZAŁOŻENIE (luka dispatchu): okno Epoki Ludów Morza jest kluczowane wyłącznie po graczu (owner 0), bo tylko on ma komunikat i bo barbarzyńcy spawnują globalnie. Parity z AI-owners NIE wdrożona (AI nie ma osobnego okna; ich wejścia w epoki są w tych samych mapach, więc dodanie jest możliwe, ale wymaga decyzji właściciela, czy okno ma dotyczyć też rajdów wymierzonych w AI).
- ZAŁOŻENIE: elapsed = turn - bronzeEntryTurn; aktywne od elapsed >= 20 (turn 120 przy wejściu w turze 100). Jeśli właściciel rozumie „20. turę” jako turn - entry + 1 >= 20, próg przesuwa się o jedną turę (jedna stała `SEA_PEOPLES_BOOST_ELAPSED_TURNS` lub warunek w `seaPeoplesBoostActive`).
- ZAŁOŻENIE: stary zapis wczytany w oknie (bez flagi `seaPeoplesNoticeShown`) pokaże komunikat jeden raz po wczytaniu. Nie da się odtworzyć, czy już był pokazany.
- Istniejący rajderzy nie są usuwani ani wycofywani (zgodnie z dispatchem); nowe spawny są ograniczone już potrojonym limitem (tickCamps i rajdy morskie), czyli rośnie ich liczba, nie tempo spawnu (spawnInterval bez zmian).
- Trzy testy guard (forced-war-bronze-main-guard, forced-war-iron-main-guard, ai-dlug-porzadki-q1) wskazują na funkcje/zmienne, których nie ruszałem; wymagają sprawdzenia na bazie przed integracją (czy były czerwone już na cfa5d1e65).
- Notatka dla integratora: komunikat wpada do warEventLog, więc trafia do zakładki wg istniejącej klasyfikacji (kind 'enemy'); klasyfikacji zakładek nie weryfikowałem w grze.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) na SHA commita poniżej: przegląd diffu barbarians.ts + main.ts (sekcja Ludów Morza), uruchomienie tools/sea-peoples-boost-test.cjs i barbarians-test.cjs, sprawdzenie trzech guard-testów na bazie cfa5d1e65; decyzja właściciela o zakresie parity AI i o progu 20 tury (ZAŁOŻENIE powyżej).
DEPLOY/PUSH: NIE WYKONANO
