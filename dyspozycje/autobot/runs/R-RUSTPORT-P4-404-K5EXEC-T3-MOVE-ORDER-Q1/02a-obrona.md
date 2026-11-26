# R-RUSTPORT-P4-404-K5EXEC-T3-MOVE-ORDER-Q1 — Obrona Operatora, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-404-K5EXEC-T3-MOVE-ORDER-Q1 (#404, krok T3)
GOAL: `_performPlayerOrder` `hold`/`none`/`move` (pin `07d2fbd72` `battleScene.ts:18280-18353`), `_firstStepTowardMoveDestination` (`:18478-18527`) i rozkaz ruchu doktryny `skirmish` wykonany w pętli bitwy zamiast tagu `doktryna-rozkaz-ruchu`.
ZMIANY/COMMIT: gałąź `rust-port-wip/404-move-order-obrona`, commit `37f8fbc09` (rodzic: raport Evaluatora `9e1582154`, czyli kod Operatora `474d6f855` + raport). Pliki: `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (tryb `WIRING_A_MOVE_ORDER_STEPS`, dopisek przypadków krawędzi), `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/move_order_step_vectors.json` (plik nowy w tym temacie, regenerowany; prefiks bajt w bajt), `rust-port/engine/tests/p4_404_move_order.rs` (asercje pokrycia krawędzi + nowy test kontraktu), `rust-port/engine/src/domain/player_order_move.rs` (nazwa i docstring parametru `siege_manual_handled`, logika bez zmian). Wszystkie w allowliście dispatchu. Ten raport w commicie Obrony.
TESTY: §6.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Final Control (`03-final-control.md`) na `37f8fbc09` (+ commit raportu).
DEPLOY/PUSH: NIE WYKONANO

## N-E1 — mutant E02 (BFS bez testu granic) przeżywa: PRZYJMUJĘ (z ustaleniem, że w grze mutant jest równoważny)

Ustalenie z pinu (nowe, nie było w raporcie Evaluatora ani Operatora): każda scena bitwy pinu ma ogrodzenie strefy gry.
`_fencePlayableZone` (`battleScene.ts:4004-4013`, wołane bezwarunkowo w konstruktorze `:2812`) zamienia każde pole poza
`PLAY_COL0..PLAY_COL1` × `PLAY_ROW0..PLAY_ROW1` (`:664-670`: kolumny 10..57, rzędy 23..132) na `BTerrain.River`, które jest
nieprzejezdne (`battle-terrain.ts:791-794`). Później pin otwiera tylko pola muru/bramy w obrębie strefy (`_breachWallTile`
`:7638-7645` na rzędzie atakującego, brama `:7762-7774` przy `midRow`). Zmierzone na trzech scenach generatora: kolumny 0..9
i 58..67 mają 0 pól przejezdnych, ramka ma szerokość ≥ 10 pól. Rust ma to samo (`battle_setup.rs:76` `in_playable`, port
`_fencePlayableZone`). Wniosek: w każdym osiągalnym stanie bitwy BFS zatrzymuje się na ogrodzeniu i nie dochodzi do krawędzi
planszy, więc w grze mutant E02 jest RÓWNOWAŻNY. Dlatego mój pierwszy dopisek (kotwice przy kolumnie 0 itd. na scenie pinu)
dał 0 przypadków: nie ma tam żadnego pola przejezdnego.

Kontrakt czystej funkcji `first_step_toward_move_destination` (test granic `:18509` przy `_passableForUnit` poza planszą =
true) jest jednak publiczny i jego zgodność z tekstem pinu przy krawędzi należy sprawdzić. Poprawka (bez zmian kodu portu):
- Generator (`WIRING_A_MOVE_ORDER_STEPS`): na końcu każdej sceny blok przypadków krawędzi (`c0`, `cMax`, `r0`, `rMax`), liczony
  na tej samej scenie pinu z ZDJĘTYM ogrodzeniem (River poza strefą → Plains, Wall/Gate bez zmian; kafle przywracane po
  bloku). Plansza nieprzejezdności zapisana jako osobny klucz `<scena>~bez-ogrodzenia|0/1`. Jednostka przenoszona na linię
  krawędzi, cel wzdłuż krawędzi albo w głąb, w 80% droga zachłanna zablokowana (wymusza BFS). Decyzję liczy tekst pinu
  (`_performPlayerOrder`, `_firstStepTowardMoveDestination`), jak w pozostałych przypadkach.
- Osobne ziarno LCG (główne ziarno zachowane), przypadki doklejone na koniec `cases`/`firstStep`: dotychczasowe 900 + 402 +
  120 przypadków i plansze nieprzejezdności są bajt w bajt jak w pliku Operatora (porównanie JSON: `True True True True`).
- Nowy plik: 1140 przypadków `move` (+240 krawędzi, 60 na każdą krawędź; 46 przez BFS), 642 `firstStep` (+240 krawędzi,
  84 z drogą). MD5 `8f2c1cbee02088696f16c5659415411c` (było `d90c1973…`). Regeneracja powtórzona: ten sam MD5.
- Test Rust: asercje pokrycia `brzeg-c0/cMax/r0/rMax ≥ 50` i `brzeg-bfs ≥ 30` (ruch) oraz `brzeg-* ≥ 50`, `brzeg-droga ≥ 60`
  (BFS wprost), żeby regeneracja nie mogła po cichu zgubić tych przypadków.

Dowód: mutant E02 (usunięty warunek `if !(0..BF_COLS).contains(&col) || !(0..BF_ROWS).contains(&row) { continue; }`)
**ZABITY**: `p4_404_move_order` 3 ok / 2 FAILED (`rozkaz_ruchu_move_zgodny_z_pinem`, `pierwszy_krok_bfs_zgodny_z_pinem`).
Źródło przywrócone (`cmp` z kopią = identyczne).

## N-E2 — `none` + `atk` + mur mapowane bezwarunkowo na `SiegeManual`: PRZYJMUJĘ (doprecyzowanie kontraktu + test)

Evaluator ma rację: pin `:18286` to `if (this._performSiegeManualOrder(ru, done)) return true;`, a ciało `:18435-18475` może
zwrócić `false` po przejściu bramki `:18436`, i wtedy `none` idzie dalej do `:18287-18296`. Parametr nazywał się
`siege_manual` i był opisany jako „pierwsza bramka”, co jest nadmiernym uproszczeniem. Poprawka w `player_order_move.rs`:
- parametr przemianowany na `siege_manual_handled` i opisany jako WYNIK `_performSiegeManualOrder` (nie jego bramka), z jawnym
  wymaganiem dla H3: wołający liczy pełny wynik tej funkcji; `hold` (`:18282`) jest sprawdzany wcześniej, a `move` jest
  wyłączony bramką `ord.type !== 'move'`, więc od argumentu nie zależą. Logika bez zmian (funkcja nie ma wołającego
  produkcyjnego; `ProdOps::perform_player_order` w pętli nie korzysta z tego argumentu).
- nowy test `oblezenie_reczne_tylko_gdy_obsluzone`: `none` + `true` → `SiegeManual`, `none` + `false` → gałąź doktryny (przypadek
  z wektorów pinu), `hold` + `true` → `Hold`, `move` → ten sam `Move(..)` dla `true` i `false`.
- w `rozkaz_hold_none_zgodny_z_pinem` asercja, że żaden przypadek wektorów nie przechodzi bramki oblężenia ręcznego (generator
  je pomija), więc `false` jest tam prawdziwym wynikiem pinu.
Dowód: mutant E06 (usunięta linia `PlayerOrder::None if siege_manual_handled => PerformOrder::SiegeManual`) **ZABITY**
(`oblezenie_reczne_tylko_gdy_obsluzone` FAILED). Do mapy H3 (dla orkiestratora): „H3 musi przekazać wynik
`_performSiegeManualOrder` (`:18435-18475`), `false` ⇒ gałąź `none` (`:18287-18296`)”. Wektory pinu dla tej ścieżki = zakres H3.

## N-E3 — bitwy pokrywają tylko krok zachłanny prosty i BFS: ODRZUCAM jako zarzut wobec T3 (przyjmuję jako uwagę dla T5/H4)

Dowód: w bitwie AUTO rozkaz ruchu wydaje wyłącznie doktryna `skirmish` (`:18087-18124`); `_executeGroupDoctrineStep`
obsługuje wszystkie 5 doktryn, więc gałąź końcowa `:18063-18083` jest nieosiągalna; `skirmish ≠ steady` zeruje unik
cofania i bramkę zwarcia; sąsiedni wróg jest sprawdzany przed wydaniem rozkazu (`_pickAdjacentTargetByPriority`);
`firingTiles` jest puste. Evaluator potwierdził to sam (§4). Pozostałe klasy kryterium 1 są w tym temacie nieosiągalne w
bitwie i są pokryte wektorami kroku wykonanymi z tekstu pinu (po tej rundzie: `cel-pozycja` 47, `sasiedni-wrog` 556,
skośny 199, obejście kolumną 58 / rzędem 24, BFS 57, blokada zwarcia 66, blokada linii 61, unik cofania ≥ 30, krawędź 240).
Bitwy z rozkazem gracza (`ProdOps::perform_player_order` z kolejki T1) wymagają wiringu H4/T5 i tam muszą powstać wektory
bitew; wpisuję to jako wymaganie mapy kroków, nie jako brak T3.

## N-E4 — ścieżka atomowa ciała i siatka `mounted` na terenie `niedostepne`: CZĘŚCIOWO ODRZUCAM (dowód), resztę przyjmuję jako dług

- Ścieżka atomowa (`move_order_exec && !march_incremental`, `siege_tactics_loop.rs:6223`): ma to samo uzasadnienie co
  istniejący przełącznik `march_incremental` (MARCH-INCREMENTAL, #393): starsze testy ciała działają w trybie atomowym, a
  sesja produkcyjna (`siege_battle_session.rs`) włącza oba przełączniki. Gałąź jest martwa w produkcji i bez testu —
  usunięcie zmieniłoby kontrakt `ProdBody` poza zakresem T3. Przyjmuję jako dług do decyzji orkiestratora przy T5/H4
  (usunąć razem z trybem atomowym albo pokryć testem).
- Siatka `mounted`: w pinie `_passableForUnit` dla jazdy różni się od piechoty tylko mnożnikiem `cavalryTerrainMultiplier`
  (`:7436-7443`); dla trzech scen kroku zbiory nieprzejezdne `|0` i `|1` są identyczne (zmierzył Evaluator). Gra może mieć
  teren `NIEDOSTEPNE` dla jazdy tylko na scenach z odpowiednim presetem — to NIE_ZMIERZONO w tym temacie; mutant E09
  jest równoważny tylko w testowanych scenach. Do dopisania scena z takim terenem przy T5 (wpisuję w mapę).

## N-E5 (formalne) — brak sekcji „Pliki spoza allowlisty”: PRZYJMUJĘ

Pliki spoza allowlisty (dopisek do raportu Operatora):
| plik | zmiana | uzasadnienie |
|---|---|---|
| `rust-port/engine/src/domain/siege_battle_session.rs` | +3 linie: `body.move_order_exec = true;` + komentarz | D-404-OP-1: bez tego tag `doktryna-rozkaz-ruchu` nie znika w sesji produkcyjnej (kryterium 1); przełącznik w `ProdBody` domyślnie `false` zachowuje kontrakt starszych wektorów z atrapą `_performPlayerOrder`. |
| `rust-port/renderer/Cargo.lock` | w `git diff --stat 2c8583731` (+34) | to różnica baz (`2c8583731` vs faktyczna baza `6793a7da4` po #405), nie zmiana tematu; `git diff 6793a7da4 474d6f855 -- rust-port/renderer` = pusto. |
W tej rundzie Obrona nie zmienia plików spoza allowlisty. Decyzja D-404-OP-1 do wpisu orkiestratora w `REJESTR-RUST.md`
(Obrona nie edytuje rejestru).

## Dowody Evaluatora (pozycja 6 listy zarzutów)

Nie jest zarzutem; przyjmuję liczby. Po tej rundzie aktualne: §6.

## 6. Testy (CARGO_TARGET_DIR w scratchpadzie, CARGO_INCREMENTAL=0, debug=0)

| bramka | wynik |
|---|---|
| `cargo fmt --check` (engine) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (engine) | EXIT 0 |
| `cargo test --test p4_404_move_order` | 5/5 ok |
| pełny `cargo test --all-targets --no-fail-fast` (engine, w tle) | EXIT 0 — **4378 passed, 0 failed, 1 ignored** (559 sekcji; +1 = nowy test `oblezenie_reczne_tylko_gdy_obsluzone`; ignored sprzed tematu) |
| mutant E02 (granice BFS) | ZABITY (2 testy FAILED) |
| mutant E06 (`none` ignoruje `siege_manual_handled`) | ZABITY (1 test FAILED) |
| regeneracja `move_order_step_vectors.json` ×2 | MD5 `8f2c1cbee02088696f16c5659415411c` obie |
| prefiks starych przypadków / plansz | bajt w bajt (JSON równy) |
| `git diff --check` | czysto |

## NIE_ZMIERZONO

- Wektory bitew (`move_order_vectors.json`) — bez zmian w tej rundzie, nie regenerowane.
- Teren `NIEDOSTEPNE` dla jazdy w scenach kroku (N-E4).
- Client i renderer (nie zmieniane, D-404-4).
