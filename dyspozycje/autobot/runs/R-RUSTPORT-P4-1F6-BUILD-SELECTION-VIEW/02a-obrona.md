# 02a — Obrona Operatora: R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW (runda 1)

STATUS: PASS-WITH-NOTES (obrona; bez zmian kodu)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW
GOAL: buildHighlight (4 tryby + filtr cofania w producencie), selection z UiState, port start_reveal — wg pinu `07d2fbd72`.
ZMIANY/COMMIT: tylko ten plik (allowlista `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW/**`). Kod bez zmian względem `24f57d810`; baza obrony = `073915d08` (raport Evaluatora).
TESTY: bez nowych uruchomień cargo — obrona nie zmienia kodu; obowiązują bramki odtworzone przez Evaluatora na `24f57d81` (fmt/clippy/test --lib/--all-targets EXIT 0, 3667 passed; mutacje a/b/c FAIL EXIT 101). Dysk w chwili obrony: `df -h /` = 5,8 GB wolnego (< 8 GB) — zmiana kodu wymagałaby nowej bramki, której przy tym dysku nie wolno uruchomić (kryterium 3), dlatego wszystkie punkty zamknięto dokumentacyjnie.
BLOKADY: brak blokujących. Zależności do rejestru — niżej (Z-1, Z-2, Z-4).
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control na podstawie `02-evaluator.md` + tego pliku.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 0. Kontekst (bramki Evaluatora)
PRZYJMUJĘ. Wyniki Evaluatora zastępują stan „BLOCK / niekompilowane” z `01-operator-r1.md` (patrz zarzut 6).

### 1. Producent bez wołającego w Rust — zależność niezapisana
PRZYJMUJĘ (dokumentacyjnie). `REJESTR-RUST.md` jest poza allowlistą tego tematu, więc zależność wpisuję tutaj jako jawny wpis do przeniesienia przez orkiestratora przy integracji:

**Z-1 (zależność, do REJESTR-RUST.md):** `overlays_view::build_highlight`, `overlays_view::selection` i `start_reveal::StartRevealContext` nie mają w Rust wołającego produkcyjnego (wołane tylko z `tests/view_overlays_build.rs` i `tests/start_reveal.rs`). Składacz `OverlaysViewDto` (temat P4-1G Q6 / #237 / PRIO-3D-2 albo osobny temat składacza) musi podać ze stanu:
- `can_found_player_city_at` ← `StartRevealContext::can_found_player_city_at` (z `playerStartHexFor` i `startRevealRadius` ze stanu gry);
- `qualifying_wonder_hexes` ← `wonder_placement::list_qualifying_wonder_hexes_for_owner` (pin `main.ts:16365`);
- `qualifying_hexes` ← `get_qualifying_hexes` z buildApi (pin `main.ts:16376`), na `map_hexes`;
- `pending_undo_keys` ← `PendingImprovementsTurn::undo_key_set()` zebrane do `HashSet<String>` (pin `main.ts:16377`);
- `SelectionUi.selected_unit_id` ← `UiState.selectedUnitId` (kontrakt §3.7, D-CMD-12) + filtr właściciela (Z-4).

### 2. foundingTerritoryOpts / ownerEra / cityLimitBase nieprzeniesione
PRZYJMUJĘ (dokumentacyjnie). Przeniesienie wymagałoby plików spoza allowlisty (dispatch §ZAKRES 4: „nie rozszerzaj allowlisty samodzielnie”).

**Z-2 (luka, do REJESTR-RUST.md):** bazowy wynik `canFoundCity` (z `foundingTerritoryOpts` = `withinTerritory` z fortami, `ownerEra`, `cityLimitBase`) podaje wołający przez domknięcie w `StartRevealContext`. Port tych opcji należy do tematu składacza z Z-1 (albo osobnego tematu „founding territory opts”), wg pinu `07d2fbd72`, bez wymyślania reguł.

### 3. Testy cofania na kluczach ręcznych
PRZYJMUJĘ jako uwagę bez blokady; zgodność formatu potwierdzam dowodem, test integracyjny odkładam do tematu składacza (Z-1).
Dowód zgodności formatu:
- pin `gra/src/game/pending-improvements.ts:16-17`: `pendingImprovementId(hexKey, key) = \`${hexKey}:${improvementKey}\``;
- Rust `rust-port/engine/src/domain/improvements.rs:1213-1215`: `pending_improvement_id` = `format!("{hex_key}:{improvement_key}")`, `undo_key_set()` (l.1252) zwraca te id;
- producent `overlays_view.rs:64`: `format!("{q},{r}:{improvement_key}")` — identyczne, o ile `hex_key` = `"q,r"` (webowe `keyOf`), co jest kontraktem wołającego.
**Z-3 (do tematu składacza):** test end-to-end: `PendingImprovementsTurn::add` → `undo_key_set()` → `build_highlight` usuwa heks. Nie dodany teraz, bo zmiana testów wymaga nowej bramki cargo, a dysk = 5,8 GB (< 8 GB).

### 4. selection bez isMe(u.ownerId)
PRZYJMUJĘ (dokumentacyjnie — wariant „odpowiedzialność wołającego”, dopuszczony w zarzucie). Dowód z pinu: `main.ts:7117` (`syncPlayerUnitSelectionOnMap`) ma `if (!u || !isMe(u.ownerId)) return;`; `main.ts:7251-7262` (`selectPlayerUnit`) ustawia `selectedId` tylko dla jednostki gracza (ścieżka wyboru własnej jednostki), więc `selectedId` w webie z założenia wskazuje własną jednostkę.
**Z-4 (do REJESTR-RUST.md):** `overlays_view::selection` nie filtruje właściciela; składacz (Z-1) MUSI podać `selected_unit_id` tylko gdy jednostka należy do lokalnego gracza (odpowiednik `isMe(u.ownerId)`, pin `main.ts:7117`), albo dodać ten filtr w temacie składacza. Bez tego obca jednostka dałaby `SelectionDto`.

### 5. Kolejna kopia hex_distance w start_reveal
PRZYJMUJĘ jako uwagę porządkową, bez zmiany w tym temacie. Kopie już istnieją (`pathfinding.rs:1030/1037`, `state.rs:912`, `turn_economy_loop.rs:290`, `diplomacy_siege_war_gate.rs:59` i in.); użycie cudzej funkcji wymagałoby zmiany widoczności poza allowlistą. Wynik poprawny (potwierdzony testem granicy i mutacją b). Kandydat na osobny temat porządkowy „wspólny hex_distance”.

### 6. Nieaktualny status w 01-operator-r1.md / konflikt overlays_view.rs
PRZYJMUJĘ. Status `BLOCK (dysk, niekompilowane)` w `01-operator-r1.md` jest historyczny; obowiązującym dowodem bramek jest `02-evaluator.md` (`073915d08`). Konflikt w `overlays_view.rs` z 1F3/1F4/1F5 — rozwiązuje orkiestrator przy integracji (dispatch §NIE ROBIĆ); nie cofałem cudzych zmian.

## Podsumowanie
Wszystkie 6 zarzutów PRZYJĘTE, zamknięte dokumentacyjnie (Z-1..Z-4 do przeniesienia do `dyspozycje/rust-port/REJESTR-RUST.md` przez orkiestratora przy integracji). Kod i testy bez zmian względem `24f57d810`.
