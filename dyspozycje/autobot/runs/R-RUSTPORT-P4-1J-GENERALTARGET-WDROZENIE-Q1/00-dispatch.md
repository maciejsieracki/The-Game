# DISPATCH R-RUSTPORT-P4-1J-GENERALTARGET-WDROZENIE-Q1 (runda 1) — pole generalTargetId w PlayablePlannedMarch + zapis/odczyt (#221)

DOMENA: GAME (silnik, stan i zapis). Model: Operator HAIKU, Evaluator SONNET, Obrona HAIKU, FC SONNET.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` (aktualny czubek, zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło specyfikacji: `dyspozycje/rust-port/p4/P4-1J-GENERALTARGET-ROZPOZNANIE.md` §2 i §5 — punkty 1, 2, 3, 6, 7 (odczytaj OBOWIĄZKOWO).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES (TYLKO punkty 1, 2, 3, 6, 7 z §5)
1. `playable.rs`: pole `general_target_id` w `PlayablePlannedMarch` (typ wg wzorca pola obok; komentarz `:554-555` zaktualizować, bo jest nieaktualny).
2. `save_load.rs:837`: przekazać realne `general_target_id` zamiast `None`.
3. `save_load.rs` `restore_playable_planned_marches` (od ~`:903`): zachować pole zamiast raportować `general_target_dropped`; gałąź `planned-march.ts:466` (wpis generała przy współrzędnych = pozycja jednostki) odwzorować zgodnie z pinem.
6. Aktualizacja asercji utrwalających lubę: `tests/p4_1j_planned_march_state.rs:352`, `tests/p4_1j_planned_march_pin_vectors.rs:207-208, 363, 378, 399`; komentarze `general_quick_follow.rs:13-15` i `pathfinding.rs:2188` (`:455` → `:466`). NIE luzować asercji — zmieniać oczekiwania na zgodne z pinem.
7. Wektory (NOWE, tylko warstwa PlayableState): zapis i odczyt w obie strony z polem wg pina `planned-march.ts:466-496`. Generator `.mjs` na pinie + strażnik SHA-256 wyciętych fragmentów. NIE duplikuj wektorów pathfinding (`p6_repin_wojna_2_r3_planned_march.rs`, `p6_repin_wojna_2_r4_save.rs`, `p6_repin_wojna_3_hook.rs`).

## POZA ZAKRESEM (zostaw jawnie jako NIE_ZMIERZONO, NIE implementuj)
- Punkt 4: podpięcie `sync_general_march_targets` do punktów `main.ts:31547, 31563, 31664, 31676, 31693, 44120` — wymaga stanu generałów w PlayableState; osobny temat.
- Punkt 5: ścieżka rekrutacji `main.ts:14975-14986` i czyszczenie `main.ts:25920` — osobna decyzja orkiestratora.

## BRAMKI (EXIT zapisany)
`cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test p4_1j_planned_march_state`; `cargo test --test p4_1j_planned_march_pin_vectors`; `cargo test --test p4_1j_planned_march_bounds`.

## KRYTERIA KOŃCA
1. Pole obecne w `PlayablePlannedMarch`; zapis i odczyt przechodzą w obie strony (test + wektory pinu).
2. Brak `general_target_dropped` dla pola, które web zapisuje.
3. Mutacja „zgub pole przy zapisie” (`save_load.rs:837` → `None`) MUSI dać FAIL w nowych testach.
4. Bramki EXIT 0. Brak `#[ignore]`, brak osłabionych asercji.
5. Punkty 4 i 5 jawnie NIE_ZMIERZONO w raporcie.

## ALLOWLISTA (wyłącznie)
- `rust-port/engine/src/domain/playable.rs`
- `rust-port/engine/src/domain/save_load.rs`
- `rust-port/engine/src/domain/general_quick_follow.rs` (komentarz)
- `rust-port/engine/src/domain/pathfinding.rs` (komentarz `:2188`, jeśli potrzebny)
- `rust-port/engine/tests/p4_1j_planned_march_state.rs`
- `rust-port/engine/tests/p4_1j_planned_march_pin_vectors.rs`
- `rust-port/engine/tests/p4_1j_general_target_vectors*` (NOWE: `gen.mjs`, `vectors.json`, test)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1J-GENERALTARGET-WDROZENIE-Q1/**`

Commit jawnym `git add` tych ścieżek. NIE commituj `Cargo.lock`. NIE `git add -A`. Bez push do parity. Target CARGO poza repo; usuń po bramkach.
