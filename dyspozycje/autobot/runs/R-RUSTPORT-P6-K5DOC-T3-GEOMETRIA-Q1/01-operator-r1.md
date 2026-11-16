# 01-operator-r1 — R-RUSTPORT-P6-K5DOC-T3-GEOMETRIA-Q1 (runda 1, Operator, Haiku)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T3-GEOMETRIA-Q1
GOAL: Port geometrii szyku z pina 07d2fbd72 (C6–C9) po potwierdzeniu osiągalności; port tylko funkcji żywych.
BAZA: origin/rust-port/parity-v2 = 585bb48e0 (worktree detached, pin 07d2fbd72 tylko do odczytu).

## Tabela osiągalności (pin 07d2fbd72, gra/src/battle/battleScene.ts)

| Funkcja | Definicja | Wywołania | Status |
|---|---|---|---|
| C6 `_forwardCol` | :6748 | :6077 (komentarz), :6794 (pośr.), :17645, :17720, :17767, :17789, :17894-17912 | JUŻ W PARITY (`siege_tactics_doctrine_state::forward_col`, T0); zweryfikowane wywołania |
| C7 `_attackFormationRallyPoint` | :17707 | tylko :17939 w `_doctrineMoveDest` gałąź `meta.doctrine === 'steady'` | NIE_PORTOWANE (martwe) |
| C8 `_chargeMoveDest` | :17778 | tylko :17948 w `_doctrineMoveDest` gałąź `meta.doctrine === 'aggressive'` | NIE_PORTOWANE (martwe) |
| C9 `_moveTargetForUnit` | :11442 | :11468, :11629, :17955, :18063 (pośr.), :20316 | ŻYWE — PORTOWANE |

Dowód martwości C7/C8: `_doctrineMoveDest` (:17931) wołane tylko z :18063 (w `_executeGroupDoctrineStep`, :17966) i :18103 (w `_executeSkirmishDoctrineStep`, :18087).
- `_executeGroupDoctrineStep`: dla `steady` zwraca wcześniej (:18022-18025 `_advanceStep`), dla `aggressive` zwraca wcześniej (:18027-18035 `_advanceStep`), `defensive` i `skirmish` zwracają wcześniej. Do :18063 dociera wyłącznie `manual`.
- `_executeSkirmishDoctrineStep`: wejście tylko dla `skirmish` (:17972).
- Zatem gałęzie `steady` (:17938) i `aggressive` (:17947) w `_doctrineMoveDest` nie są osiągalne.
Rozbieżność z rozpoznaniem Z3 (dispatch): potwierdzona — C7 i C8 nieosiągalne.

## ZMIANY/COMMIT
- NOWY `rust-port/engine/src/domain/siege_tactics_doctrine_geometry.rs`: `move_target_for_unit(formation_offset, col, row) -> BoardPos` (1:1 z :11442-11448, clamp do BF_COLS/BF_ROWS z :661-662).
- `rust-port/engine/src/domain/mod.rs`: jedna linia `pub mod siege_tactics_doctrine_geometry;` (wstawiona przed `siege_tactics_doctrine_state`, zgodnie z kolejnością alfabetyczną; cargo fmt).
- NOWY `rust-port/engine/tests/p6_k5doc_geometry.rs` (3 testy).
- NOWY `rust-port/engine/tests/p6_k5doc_geometry_gen.mjs` (replika JS 1:1 pina, generator wektorów).
- NOWY `rust-port/engine/tests/p6_k5doc_geometry_vectors/move_target.json` (7 przypadków) + `SHA256SUMS`.
- NOWY `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T3-GEOMETRIA-Q1/01-operator-r1.md` (ten raport).
- Nie zmieniano: `siege_tactics_loop.rs`, `siege_tactics_doctrine_state.rs`, `gra/`, `Cargo.lock` (nieskomitowany, untracked).

Portowane: C9 `_moveTargetForUnit`. NIE_PORTOWANE (martwe, z plik:linia): C7 `battleScene.ts:17707`, C8 `battleScene.ts:17778`.

## TESTY
- Generator: `node rust-port/engine/tests/p6_k5doc_geometry_gen.mjs` → 7 przypadków. `sha256sum -c SHA256SUMS` → OK.
- `cargo test --test p6_k5doc_geometry`: 3 passed, 0 failed, 0 ignored.
- Bramki w `rust-port/engine` (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo, usunięty po bramkach):
  - `cargo fmt --check`: EXIT 0
  - `cargo clippy --all-targets -- -D warnings`: EXIT 0
  - `cargo test --all-targets --no-fail-fast`: EXIT 0 (494 wyników `test result: ok`, brak FAILED)
- Mutacje (źródło przywrócone, `cmp` OK, po przywróceniu testy 3/3 zielone):
  - (a) odwrócenie kierunku offsetu (`col - dc`, `row - dr`): FAIL (2 testy: pin_vectors, clamp_to_board_edges) — OK.
  - (b) przesunięcie punktu zbiórki o +1 kolumnę (`col + dc + 1`): FAIL (2 testy: pin_vectors, null_offset_identity) — OK.
  - (c) strona obrony zamiast atakującego: NIE_DOTYCZY dla C9 — `move_target_for_unit` nie przyjmuje strony (w pinie `_moveTargetForUnit` nie czyta `side`). Strona wchodzi tylko w C7/C8 (martwe) oraz w `forward_col` (C6, T0; tam wrażliwość już pokryta testami T0).

## BLOKADY
- Mutacja (c) nie ma punktu zaczepienia w portowanym kodzie (patrz wyżej). Wymaga decyzji orkiestratora: zaakceptować NIE_DOTYCZY albo wskazać inną funkcję do mutacji.
- Dispatch zakładał, że C7/C8 zostaną zportowane; są martwe, więc nie portowano (zgodnie z treścią dispatchu).
- Gałąź roboczą: worktree był detached (zgodnie z dispatchem); commit na gałęzi wip (patrz SHA w odpowiedzi).

## RUNDY
1/5 (runda Operatora, bez FAIL)

## NASTĘPNY KROK
Evaluator (Sonnet) na commicie operatora: weryfikacja tabeli osiągalności C7/C8/C9 z pinu, wektorów i mutacji (a)/(b)/(c). Następnie Final Control.

## DEPLOY/PUSH
NIE WYKONANO (Operator nie pushuje i nie integruje; push wymaga osobnej autoryzacji).
