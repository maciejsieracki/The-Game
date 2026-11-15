# DISPATCH R-RUSTPORT-P4-1H-RJ-REPIN-Q3 (runda 1) — dryf `RJ` (ruch marszu) do pinu `07d2fbd72` (P4-1H / #217)

DOMENA: GAME (ruch jednostek, planowanie marszu). MODEL: OPUS we wszystkich rolach (seria P4-1 wg listy zadań właściciela).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `be49ff3c3` (zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło specyfikacji: `dyspozycje/rust-port/p4/P4-1H-COMMANDS-ROZPOZNANIE.md` §3 (wiersze R1–R4 i R6; R5 tylko zbadać, R7 zamknięte przez #221) i §4 wiersz `R-RUSTPORT-P4-1H-RJ-REPIN-Q3`.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES (parytet 1:1 z pinem, zasada 9)
- R1: `plan_path_turns` — trim segmentu przez `trimSegmentEndOffPassThrough(truncatePathToBudget(...), path.length, occupied)` (`pm.ts:271-275`).
- R2: `should_stop_at_obstacle` — ten sam trim (`pm.ts:311-313`).
- R3: `execute_march_step` — pusty segment + `isPassThroughHex(fullPath[0])` → `obstacle` z detailem „własna jednostka na trasie — brak wolnego heksu w zasięgu” (`pm.ts:388-400`); dziś zawsze `NoMovement` (`pathfinding.rs:2084-2087`).
- R4: `compute_path` w zakresie oblężenia — `siegeBlocksEntry` także dla celu (`setup.ts:1027`, `:1139`).
- R6: `isNotifiableMarchStop`, `marchPausedLabel`, `registerMarchStop`, `clearMarchStop` (`pm.ts:511-546`) jako funkcje domeny z wejściem stanu `march_stop_notified` / `march_stop_detail`.
- `trim_path_to_stack_room` (`army-stack-limit.ts:86`) — wymagane przez §1.3/§3; przenieś z pinu z wektorami.
- R5: NIE implementować. Tylko zbadać i zapisać w raporcie, czy `computeReachable@07` różni się poza `passThrough`. Wynik to NIE_ZMIERZONO albo lista różnic.
- Wejście `MoveOccupancy.passThrough` i `siegeBlocksEntry` jako jawne parametry (predykaty), nie globalny stan.

## WEKTORY (NOWE, z URUCHOMIONEGO kodu pinu)
- Generator `rust-port/engine/tests/p4_1h_rj_repin_vectors/gen.mjs`: wykonuje `pm.ts`/`setup.ts`/`army-stack-limit.ts` z `git archive 07d2fbd72` (poza repo, w katalogu roboczym), strażnik SHA-256 wyciętych fragmentów, zapis `vectors.json`. Node ≥ 22.18 (eksperymentalne strip-types, jak w P4-1B).
- ≥ 200 przypadków obejmujących: pass-through na środku trasy, na końcu segmentu, jedyny heks w zasięgu, cel = własna jednostka = scalenie, oblężenie celu i heksu pośredniego, limit stosu (wartość jawnie: `armyStackLimit()` = 500; wektory granic: stos 499 + 1 dopuszczony, 500 + 1 odmowa).
- Stare `p6_4_*` (`edb8fb56`): aktualizuj oczekiwania TYLKO gdy wektor z `07d2fbd72` zmienia wynik; każda zmiana z uzasadnieniem w raporcie. Nie luzuj asercji.
- Mutacje (wszystkie muszą dać FAIL): usunięcie trimu (R1/R2), pusty segment bez obstacle (R3), brak blokady oblężenia dla celu (R4), brak `trim_path_to_stack_room`.
- Zapisz liczbę przypadków per kategoria w raporcie.

## KRYTERIA KOŃCA
1. Wektory pinu zgodne z Rust we wszystkich ≥200 przypadkach; strażnik SHA-256 zielony.
2. Mutacje z listy dają FAIL (wyniki w raporcie).
3. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`; kody wyjścia w raporcie.
4. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.

## ALLOWLISTA
- `rust-port/engine/src/domain/pathfinding.rs`
- `rust-port/engine/src/domain/army_follow_auto_merge.rs` (lub NOWY moduł limitu stosu `rust-port/engine/src/domain/army_stack_limit.rs`)
- `rust-port/engine/src/domain/mod.rs` (wyłącznie rejestracja nowego modułu, jeśli powstaje)
- `rust-port/engine/tests/p4_1h_rj_repin*.rs` (NOWE)
- `rust-port/engine/tests/p4_1h_rj_repin_vectors/**` (NOWE: `gen.mjs`, `vectors.json`)
- `rust-port/engine/tests/p6_4_*` (tylko wg zasady wyżej)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-RJ-REPIN-Q3/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo; usuń po bramkach.
Dług `#[ignore]` z bazy (1 test) nie jest Twoim zadaniem.
