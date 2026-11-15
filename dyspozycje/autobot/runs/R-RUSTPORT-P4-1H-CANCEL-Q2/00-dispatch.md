# DISPATCH R-RUSTPORT-P4-1H-CANCEL-Q2 (runda 1) — `cancel_planned_march` 1:1 z `clearPlannedMarch` (P4-1H / #217)

DOMENA: GAME (komenda mapy, stan planów marszu). MODEL: OPUS we wszystkich rolach (seria P4-1 wg listy zadań właściciela).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `2799cdd4b` (zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło specyfikacji: `dyspozycje/rust-port/p4/P4-1H-COMMANDS-ROZPOZNANIE.md` §1.1 (tabela), §4 wiersz `R-RUSTPORT-P4-1H-CANCEL-Q2` (OBOWIĄZKOWO), §5 pkt 1 (decyzja techniczna).
Decyzja techniczna (już w `REJESTR-RUST.md`, sekcja 15.11 19:4x): nieznana lub obca jednostka → `Err` (`UnitNotFound` / `UnitNotOwned`), spójnie z `move_unit`. Web tej ścieżki nie ma (każdy wołający podaje istniejącą jednostkę).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
- `PlayableGame::cancel_planned_march(unit_id, force)` 1:1 z gałęzią `unitId !== undefined` z `clearPlannedMarch` (`gra/src/main.ts:31051-31056`):
  - `!force` i plan ma `attack_unit_id` → brak zmian (return).
  - w pozostałych przypadkach usuń wpis z 4 map: `planned_marches`, `march_attack_targets`, `march_stop_notified`, `march_stop_detail` (odpowiedniki w Rust — zweryfikuj nazwy w `playable.rs`).
  - brak planu → `Ok(())`, bez zmian (idempotencja, §1.1).
  - nieznana / obca jednostka → `Err` (patrz decyzja techniczna).
- `EngineCommand::CancelPlannedMarch { unit_id, force }` w obu adapterach `bridge.rs` (wg §1.1: `:270-300` i `:375-395`, zweryfikuj aktualne linie).
- Gałęzie globalne (`unitId === undefined`, `:31057-31070`) są POZA zakresem (brak wołającego).

## WEKTORY / TESTY (nowy plik `tests/p4_1h_cancel_planned_march.rs`)
(a) `force=false` + plan z `attack_unit_id` → stan bajt-w-bajt bez zmian;
(b) `force=false` bez ataku → 4 mapy wyczyszczone dla tej jednostki;
(c) `force=true` z atakiem → wyczyszczone;
(d) brak planu → `Ok`, stan bez zmian;
(e) podwójne wywołanie → drugie `Ok`, bez zmian;
(f) inne jednostki z planami nietknięte, kolejność `planned_marches` zachowana;
(g) nieznana jednostka → `Err(UnitNotFound)`; obca jednostka → `Err(UnitNotOwned)`; stan bez zmian;
mutacja „pomiń warunek attack” musi dać FAIL (udokumentuj wynik w raporcie).
Wartości oczekiwane z kodu pinu (`git show 07d2fbd72:gra/src/main.ts`), nie z pamięci. Brak wektorów z uruchomionego webu jest dopuszczalny dla tego tematu — zapisz to jako NIE_ZMIERZONO.

## KRYTERIA KOŃCA
1. Testy (a)–(g) zielone; mutacja daje FAIL.
2. Bramki EXIT 0: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` (w `rust-port/engine`), z kodami wyjścia w raporcie.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Ten sam kontrakt zachowania w obu adapterach `bridge.rs`.

## ALLOWLISTA
- `rust-port/engine/src/domain/playable.rs`
- `rust-port/engine/src/bridge.rs`
- `rust-port/engine/tests/p4_1h_cancel_planned_march.rs` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-CANCEL-Q2/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo; usuń po bramkach.
Dług `#[ignore]` z bazy (1 test) nie jest Twoim zadaniem — nie ruszaj.
