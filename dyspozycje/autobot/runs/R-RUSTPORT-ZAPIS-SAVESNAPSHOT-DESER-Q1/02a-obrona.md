STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-SAVESNAPSHOT-DESER-Q1
GOAL: usunąć publiczny Deserialize z SaveSnapshot; wczytywanie wyłącznie z migracją (load_save_snapshot, load_replay_log_json).
ZMIANY/COMMIT: brak zmian kodu w r1-obrona; tylko ten dokument. Baza: origin/rust-port/parity-v2 = ca25d6fd2. Odniesienia do SHA: raport r1 = 10868848f; ten dokument = commit podany w odpowiedzi orkiestratora (bez push).
TESTY: NIE_ZMIERZONO. Nie uruchamiano cargo fmt/clippy/test ani cargo check w tej rundzie obrony. Weryfikacja statyczna (grep/git show na ca25d6fd2, bez kompilacji) opisana poniżej.
BLOKADY: patrz zarzuty; decyzja ABC właściciela wymagana (zarzut 6).
RUNDY: obrona 1/5 w ramach etapu 1; ostatni werdykt: Evaluator r1 (FAIL/BLOCK wg orkiestratora); decyzja wymagana.
NASTĘPNY KROK: decyzja ABC właściciela (rozszerzyć allowlistę albo zawęzić GOAL/kryteria), następnie Operator r2 na tym samym ID.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1: premisa dispatchu jest fałszywa (derive vs ręczna impl)
PRZYJMUJĘ.
Dowód: ca25d6fd2:rust-port/engine/src/domain/save_load.rs:103-104 — `#[derive(Debug, Clone, PartialEq, Eq, Serialize)] pub struct SaveSnapshot`, bez Deserialize w derive. Linia 759: `impl<'de> Deserialize<'de> for SaveSnapshot` (ręczna implementacja, wewnętrznie przez `SnapshotWire`). Dispatch błędnie opisywał derive. Kryterium 2 („brak derive Deserialize na SaveSnapshot”) jest więc spełnione trywialnie i nie oddaje intencji. Poprawna formuła kryterium: brak `impl Deserialize for SaveSnapshot` oraz brak wywołań `serde_json::from_str/from_value::<SaveSnapshot>` poza ścieżką z migracją.

### Zarzut 2: usunięcie impl psuje kompilację (replay.rs, zapis_loader.rs)
PRZYJMUJĘ.
Dowód (statyczny): ca25d6fd2:rust-port/engine/src/domain/replay.rs:43 — pole `snapshot: Option<SaveSnapshot>` w `ReplayStep<I>`; linia 52 — `#[derive(Deserialize)] struct ReplayStepWire<I> { ... snapshot: Option<SaveSnapshot> }`. Derive wymaga `SaveSnapshot: Deserialize`, więc bez impl powstaje błąd E0277 (zgodnie z probe r1: 4 błędy, replay.rs:46, :52, zapis_loader.rs:44). Dodatkowo ca25d6fd2:zapis_loader.rs:44 — `let mut snapshot: SaveSnapshot = serde_json::from_str(text)` — produkcyjna ścieżka `load_save_snapshot` sama zależy od impl. Wniosek: usunięcie impl wymaga, by `load_save_snapshot` deserializował przez prywatny typ wire (np. `SnapshotWire` udostępniony `pub(crate)`), a `ReplayStepWire` przełączył się na ten sam mechanizm. Oba pliki (replay.rs, zapis_loader.rs) są poza allowlistą dispatchu (zapis_loader.rs tylko warunkowo na helper).
Uwaga: probe r1 nie był ponownie uruchomiony w tej obronie (NIE_ZMIERZONO); wniosek o E0277 wynika z reguły trait-bound, a nie z kompilacji.

### Zarzut 3: co najmniej 6 plików testów poza allowlistą deserializuje SaveSnapshot surowo
PRZYJMUJĘ, lista orkiestratora jest niepełna. Zweryfikowane na ca25d6fd2:
- p6_repin_wojna_2_r4_save.rs: linie 126, 156, 198, 295, 382 (from_value), 398 — `SaveSnapshot` surowo.
- p6_repin_wojna_3_hook.rs: linie 399, 466, 513, 542, 557 — surowo.
- p6_wire_war_state_snapshot.rs: linie 106, 124, 136, 150, 158, 172 — surowo (from_value).
- p6_zapis_erawar_save.rs: linie 98, 110, 126, 139, 149 — surowo.
- p6_zapis_loader_migrate.rs: linia 102 (`raw_loaded: SaveSnapshot = from_str`, test jawnie sprawdza surowe ładowanie) — to test kontraktu „raw nie migruje”; po usunięciu impl ten kontrakt nie da się wyrazić, więc wymaga decyzji, nie tylko przepięcia.
- p6_zapis_migracje_snapshot_flags.rs: linie 82, 104, 114 — surowo.
- p6_zapis_migracje_snapshot_load.rs: linie 100, 104 — helper zwraca SaveSnapshot z from_value; PRAWDOPODOBNIE surowo, do potwierdzenia w r2 po typie helpera.
- p6_zapis_era_zapisu.rs: używa `serde_json::Value` (88, 225); czy wywołuje SaveSnapshot — do potwierdzenia w r2.
- p6_zapis_replay_migrate.rs: deserializuje `ReplayLog` (112, 240), nie SaveSnapshot wprost; zależy pośrednio od ReplayStepWire w replay.rs.
- tests/replay.rs: deserializuje `ReplayLog<Input>` (113, 250, 270-308); pośrednio od replay.rs.
- tests/save_load.rs: 127, 137, 140, 157 — surowo (patrz zarzut 4).
Bramki z dispatchu (`cargo test --lib`, `--test save_load --test p6_zapis_loader_migrate --test p6_zapis_migracje_snapshot_load`) NIE obejmują p6_repin_*, p6_wire_*, p6_zapis_erawar_save, p6_zapis_migracje_snapshot_flags, p6_zapis_era_zapisu, replay.rs. Zgoda z orkiestratorem: pełny `cargo test` byłby czerwony bez poszerzenia allowlisty.

### Zarzut 4: tests/save_load.rs używa from_str::<SaveSnapshot> w asercjach błędów; przepięcie wymaga zmiany struktury
PRZYJMUJĘ.
Dowód: ca25d6fd2:rust-port/engine/tests/save_load.rs:1-8 — `#[path = "../src/domain/events.rs"] mod events;` oraz `#[path = "../src/domain/save_load.rs"] #[allow(dead_code)] mod save_load;`. Plik testowy kompiluje save_load.rs jako osobny moduł, bez dostępu do `crate::domain::zapis_loader`. Przepięcie asercji na `load_save_snapshot` wymaga albo dołączenia zapis_loader.rs tym samym `#[path]` (i jego zależności), albo użycia publicznego API `civ_engine::...` (nieweryfikowane w tej obronie, czy zapis_loader jest eksportowany). Asercje (błąd dla wersji 99, brakującego rng, legacy rng, niepoprawnego stanu) należy zachować jako te same asercje na ścieżce produkcyjnej, bez osłabiania.

### Zarzut 5: Operator nie naruszył reguł (brak #[ignore], brak osłabionych asercji, brak zmian poza raportem, brak pushu)
PRZYJMUJĘ jako stwierdzenie faktu.
Dowód: commit 10868848f zmienia wyłącznie `01-operator-r1.md` (1 plik, +15 linii). Probe z usunięciem impl został wycofany (worktree czysty według raportu r1). Ocena, że BLOCK był właściwy zamiast wyjścia poza allowlistę, jest zgodna z regułami; nie jest to jednak zgoda właściciela na zakres.

### Zarzut 6: bramki NIE_ZMIERZONO; potrzebna decyzja ABC właściciela
PRZYJMUJĘ. Operator nie wybiera zakresu sam.
Opcje do decyzji właściciela (ABC):
- A (zalecane przez orkiestratora): poszerzyć allowlistę o replay.rs, zapis_loader.rs (pełna zmiana deserializacji przez prywatny wire, nie tylko helper), listę testów z zarzutu 3 oraz zmianę struktury tests/save_load.rs. Kryteria przepisać: brak `impl Deserialize for SaveSnapshot`; wszystkie wczytania przez `load_save_snapshot` / `load_replay_log_json`; asercje zachowane. Test „raw nie migruje” (p6_zapis_loader_migrate:102) wymaga osobnej decyzji: usunąć kontrakt czy zamienić na test braku ścieżki publicznej.
- B: zawęzić GOAL. Uwaga: impl trait nie da się ukryć (zawsze publiczny), więc zawężenie oznacza pozostawienie `Deserialize` i zgodę na raw deserializację; kryterium 2 nie byłoby wtedy spełnione.

Po decyzji: Operator r2 na tym samym ID z pełnymi bramkami (fmt, clippy, cargo test --lib, testy przepięte), CARGO_TARGET_DIR poza repo i usuwany po bramkach. Wolne miejsce na / w chwili obrony: 3,5 GB (poniżej 8 GB progu dla Rust z zasady 5; to ograniczenie dla startu r2, nie dla tej dokumentacji).
