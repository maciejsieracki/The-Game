# 02a — Obrona Operatora (R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN, runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (grafika / adapter DTO renderera)
TEMAT: R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN
GOAL: adapter terenu `MapViewDto` + `HexDynDto` + `FogSets` → wejścia renderera (`TerrainInput`, `MapHex`, `OverlayMap`, `OkolicaMap`, `TileYield`, mgła terenu)
ZMIANY/COMMIT: baza obrony = commit Operatora `3463c909a` (na `601ff304c`). Zmiany obrony tylko w allowliście:
`rust-port/renderer/src/view/terrain.rs` (wyłącznie dokumentacja modułu), `rust-port/renderer/tests/view_adapter_terrain.rs`
(2 nowe testy + poprawka fixture'a), ten raport. SHA w podsumowaniu na dole. `Cargo.lock` nie commitowany.
TESTY: niżej (§Bramki).
BLOKADY: brak blokad technicznych. Wpisy w rejestrach poza allowlistą przekazane orkiestratorowi (§Do orkiestratora).
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1: brak wołającego w Rust i brak zapisanej zależności. PRZYJMUJĘ (w zakresie allowlisty)

Potwierdzam: w `src/` nie ma wołającego `terrain_data`, `map_hexes`, `overlay_map`, `okolica_map`, `tile_yield`,
`apply_terrain_fog` ani `terrain_scene_options`. Wołają je tylko testy. Docelowym konsumentem jest integrator sceny renderera
(R1/R2 z `P4-1G-ADAPTER-ROZPOZNANIE.md` §4), nie W8.
Poprawka: dopisałem do dokumentacji modułu `view/terrain.rs` sekcję „Consumers”, która zapisuje ten stan i zależność od R1/R2.
`REJESTR-RUST.md` i `NIEPODPIETE-MODULY.md` są poza allowlistą tematu, więc NIE edytuję ich. Gotowy wpis dla orkiestratora jest w §Do orkiestratora (pkt 1).

### Zarzut 2: luka parytetu `solid_hidden` dla ukryć wywołanych zdarzeniami. PRZYJMUJĘ jako lukę, bez zmiany kodu

Ukrycia dekoru wywoływane zdarzeniami nie dają się odtworzyć z końcowego stanu DTO:
- wycinki lasu: `main.ts:16801`, `:17014`, `:42967`;
- `syncImprovementDecorForHex`: `main.ts:16877-16946`.

Po integracji renderer pokaże więc bryłę tam, gdzie pin ją ukrywa. Naprawa wymaga pola `decor_hidden` w `HexDynDto`.
To zmiana kontraktu w `view-model`, a dispatch §5 zakazuje zmian w `view-model`, więc potrzebny jest osobny temat.
Poprawka w zakresie tematu: w dokumentacji modułu dopisałem skutek luki (np. bryła wzgórza lub góry pod ulepszeniem albo wycięty las nadal widoczne)
i propozycję naprawy (pole `decor_hidden` liczone przez producenta, luka obok L5). Wpis luki dla orkiestratora: §Do orkiestratora (pkt 2).

### Zarzut 3: wektory z ręcznie zbudowanego fixture'a. ODRZUCAM jako wadę

Sam Evaluator ocenia ten punkt jako nieblokujący i zgodny z dispatchem. Dispatch nakazuje mały ręczny fixture
ze źródłem każdej wartości (plik:linia), a fixture to spełnia. Jedyne wartości liczone, czyli wektory `seed`, Evaluator sprawdził w Node.
Zmian nie wprowadzam.

### Zarzut 4: luki pokrycia. PRZYJMUJĘ dwie części, trzecią ODRZUCAM jako wadę adaptera (z dowodem i testem)

- `RiverPathDto.kind = None` i rzeka z pustą listą heksów: PRZYJMUJĘ. Nowy test `rivers_kind_none_and_empty_hexes`
  sprawdza `kind: None` → `None`, pustą listę → pustą listę, kolejność DTO i brak rzek → pusty wektor.
- Duplikaty współrzędnych w `map.hexes`: ODRZUCAM jako wadę adaptera. Kontrakt §1.4 wyklucza je walidatorem
  `civ_view_model::validate_map` (`view-model/src/validate.rs:80-93`, `:191-212`, wariant `ViewError::HexOrder`:
  „This also rules out duplicates and holes”). Adapter zakłada poprawny snapshot, tak jak reszta `view::*`.
  Dla jawności dodałem:
  - zapis tego warunku wstępnego w dokumentacji modułu;
  - test `duplicate_coords_are_rejected_by_validate_map`: fixture przechodzi `validate_map`, duplikat daje `Err(HexOrder)`,
    a bez walidatora `overlay_map` scaliłby wpisy (11 zamiast 12). Ta asercja dokumentuje zachowanie i nie jest wymogiem parytetu.
- Przy okazji poprawiłem fixture. Pierwotny fixture NIE przechodził `validate_map`: zwracał
  `LengthMismatch { field: "map.riverRenderPaths", expected: 1, actual: 0 }`, czyli na jedną rzekę nie było ścieżki renderu (P4-1B-Q3).
  Dodałem jedną ścieżkę renderu. Adapter terenu jej nie czyta, więc oczekiwane wartości pozostałych testów się nie zmieniają.

### Zarzut 5: L1/L2/L5 jako NIE_ZMIERZONO, przypadek `fogOn=false` przy `revealAllLand=true`. Brak zarzutu wobec Operatora

Przyjmuję ustalenie Evaluatora bez zmian. Zależy to od tematu #254 (L1/L2 w kontrakcie).

## Bramki (po poprawkach obrony, `rust-port/renderer`, `CARGO_TARGET_DIR` poza repo, usunięty po bramkach)

- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --all-targets --no-fail-fast`: EXIT 0. Zmierzyłem 68 linii `test result: ok`, łącznie 563 passed, 0 failed, 0 ignored.
  Operator i Evaluator podali 518 passed i 65 zestawów. Różnicy większej niż +2 nowe testy nie wyjaśniłem: NIE_ZMIERZONO
  (prawdopodobnie inny sposób liczenia). Wszystkie zestawy są zielone.
- `cargo test --test view_adapter_terrain`: 18 passed (było 16, doszły 2).
- Mutacje M1–M4 Operatora: kod produkcyjny adaptera nie zmienił się (w `terrain.rs` zmieniła się tylko dokumentacja `//!`),
  więc wyniki Operatora i Evaluatora (8 mutacji, EXIT 101) pozostają ważne. Nie powtarzałem ich.

## Do orkiestratora (poza allowlistą tematu, NIE wykonane)

1. `NIEPODPIETE-MODULY.md` / `REJESTR-RUST.md`: `renderer/src/view/terrain.rs` (`terrain_data`, `map_hexes`, `overlay_map`,
   `okolica_map`, `tile_yield`, `apply_terrain_fog`, `terrain_scene_options`, `solid_hidden_hexes`) nie ma produkcyjnego wołającego.
   Temat wpięcia: integrator sceny renderera R1/R2 (`P4-1G-ADAPTER-ROZPOZNANIE.md` §4), dziś bez tematu.
2. Nowa luka kontraktu obok L5: ukrycia dekoru wywołane zdarzeniami (wycinka lasu `main.ts:16801/17014/42967`,
   `syncImprovementDecorForHex` `main.ts:16877-16946`) nie dają się odtworzyć z `HexDynDto`. Propozycja: pole `decor_hidden: bool`
   w `HexDynDto` liczone przez producenta (zmiana kontraktu, podbicie `CONTRACT_VERSION`), osobny temat `view-model` + producent.

## SHA

Commit obrony: zob. wynik (`git log -1` na gałęzi `wip/R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN-op-r1-obrona`, rodzic `3463c909a`).
