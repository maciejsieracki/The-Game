# R-RUSTPORT-P4-1H-MOVE-MODEL-Q4 — Evaluator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-MOVE-MODEL-Q4 (#250)
GOAL: adapter PlayableState -> RuchMapa / RuchJednostka / MoveOccupancy + moved_by_player_this_turn
ZMIANY/COMMIT: oceniany kod e669ffa1e3f3a2afa0756b0e971a4e76aa82a798 (rodzic 1bacc7621 = origin/rust-port/parity-v2,
               merge-base --is-ancestor potwierdzone); ten raport = jedyny plik commitu Evaluatora
TESTY (odtworzone niezaleznie, rust-port/engine, CARGO_TARGET_DIR poza repo, usuniety po bramkach):
  cargo fmt --check                                EXIT 0
  cargo clippy --all-targets -- -D warnings         EXIT 0
  cargo test --lib                                  EXIT 0 (124 passed, 0 failed, 0 ignored)
  cargo test --test p4_1h_move_model                EXIT 0 (9/9)
  cargo test --all-targets --no-fail-fast           EXIT 0 (suma: 3547 passed, 0 failed, 1 ignored =
                                                    istniejacy wczesniej e2e::dump_tick1_econ_for_web_generator)
  mutacje-r1.sh M1..M6                              wszystkie FAIL (M1: 3 testy, M2: 2, M3: 1, M4: 1, M5: 1, M6: 1)
  git diff --check 1bacc7621 e669ffa1e              czysto
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control r1
DEPLOY/PUSH: NIE WYKONANO
```

## Co sprawdzono
- Allowlista: diff 1bacc7621..e669ffa1e = 7 plikow, wszystkie w allowliscie. `save_load.rs` lezy faktycznie w
  `src/domain/save_load.rs` (dispatch podaje `src/save_load.rs` — jedyny plik o tej nazwie; zmiana ograniczona
  do `moved_by_player_this_turn.clear()` + zdanie doc-komentarza). `mod.rs`: tylko deklaracja modulu.
  Brak `Cargo.lock` w commicie.
- Brak `#[ignore]` w nowych plikach, brak usunietych/oslabionych asercji (diff src zawiera wylacznie dodatki
  poza zmiana `const fn base_type_id` -> `pub(crate)` i `unit.clone()` -> `self.state.units[unit_index].clone()`
  wymuszona borrow-checkerem).
- Weryfikacja wartosci z pinu 07d2fbd72 (git show): `terrain-movement.json` (Rownina 1, Wzgorza 2, Morze 99,
  forestExtra 1), `setup.ts:438-445` (>=90 -> Infinity), `setup.ts:639-657` (terrainMoveCost, las = base+extra),
  `setup.ts:759-776` (buildMoveOccupancy: obce -> blokada, wlasne -> passThrough tylko gdy heks niezablokowany),
  `main.ts:14578-14584` (occupiedForMove + foreignCityHexKeys, `occ.passThrough.delete`),
  `city-hex-movement.ts:66-75` (foreignCityHexKeys: `c.ownerId !== unitOwnerId`), `main.ts:31026-31028`
  (markPlayerMovedUnit), `:31284` (wywolanie po bramkach planMarchTo), `:38144` (clear przed odnowieniem ruchu),
  `:46280` (clear przy wczytaniu). Zgodne z kodem i komentarzami testu.
- Testy behawioralne: oczekiwane wartosci sa literalami policzonymi z pinu (nie z kodu Rust); scenariusze
  pokrywaja koszt != 1 (wzgorza 2, las 2, morze Inf, drogi 1/3, 2/3, 0.2), heks z wlasna jednostka (passThrough),
  heks z wrogiem + wlasna (blokada bez passThrough), obce miasto z wlasna jednostka (blokada, usuniete z
  passThrough), wlasne miasto (nic), perspektywa wroga, przyciecie segmentu `plan_path_turns_occ` na wlasnej
  jednostce z kontrola czulosci bez passThrough.
- Wolajacy w Rust: `PlayableState::move_model()` / `occupied_for_move()` sa publicznym API; w produkcji wolane
  dopiero przez Q5/Q6 (#251/#252) — zgodnie z rozpisaniem P4-1H (adapter jako wejscie dla preview/move).
  `moved_by_player_this_turn` ma wolajacego produkcyjnego (`move_unit`, `advance_turn`, `restore_playable_planned_marches`).

## Zarzuty / uwagi (ponumerowane; zadna nie blokuje)
1. **Napiecie z dispatchem §ZAKRES 3** („NIE zmieniaj zachowania `move_unit`”): Operator dodal w `move_unit`
   oznaczenie `mark_player_moved_unit`. Wymaga tego jednak §WEKTORY („ustawiane po ruchu gracza”) oraz web
   (`main.ts:31284`); geometria ruchu, bledy i koszt pozostaja bez zmian, oznaczenie nastepuje po wszystkich
   bramkach (po nim `move_unit` nie moze juz zwrocic bledu). Uznaje za zgodne z intencja; FC/orkiestrator
   niech potwierdzi interpretacje.
2. **Drobna duplikacja z RJ-REPIN Q3**: `occupied_for_move` powtarza inline petle `foreignCityHexKeys`
   zamiast wolac istniejace `pathfinding::foreign_city_hex_keys` (zwraca klucze `String` "q,r", a
   `MoveOccupancy` uzywa `(i32,i32)` — stad zapewne decyzja). Semantyka identyczna (porownanie `owner_id !=`).
   Dispatch prosil „uzyj jego funkcji, nie duplikuj” — do rozwazenia przy Q5/Q6, nie blokuje.
3. **Decyzja u8 vs f64 nie jest zapisana w REJESTR-RUST.md** (dispatch: „do zapisu przed wyslaniem”) —
   plik poza allowlista Operatora, wiec to zadanie orkiestratora. Wybrany wariant (model f64 jak pin, magazyn
   `PlayableUnit.movement` u8 do Q6) jest bezstratny na dzis, ale `move_unit` nadal robi `saturating_sub` na u8;
   Q6 musi przejsc na f64 przed pierwszym odjeciem kosztu ulamkowego (Operator to jawnie zapisal).
4. **Konwencja wlasciciela**: adapter przekazuje surowe `PlayerId` (gracz = 1), web ma gracza = 0 i
   barbarzyncow < 0. Model ruchu porownuje wlascicieli tylko rownoscia, wiec dzis bez skutku; jesli Q5/Q6
   wprowadza logike zalezna od `ownerId === 0` / `< 0` (np. embarkacja barbarzyncow), adapter trzeba bedzie
   rozszerzyc o mapowanie.
5. **Zapis**: dispatch mowi „zapis/odczyt w `save_load.rs`”; Operator zgodnie z webem (pole niezapisywane w
   `save.ts`) tylko czysci zbior przy wczytaniu. Pole jest serializowane w DTO `PlayableState` wylacznie gdy
   niepuste (golden bez pola bajt w bajt — test). Zgodne z pinem.
6. Odwzorowanie `Forest -> Rownina + las` i `Hills -> Wzgorza` daja ten sam koszt (2); odroznia je jedynie
   test `odwzorowanie_terenu_i_kompletnosc_mapy` (asercja na `teren_of`). Wystarczajace, odnotowuje.
