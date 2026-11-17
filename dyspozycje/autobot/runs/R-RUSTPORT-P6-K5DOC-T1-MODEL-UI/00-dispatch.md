# DISPATCH R-RUSTPORT-P6-K5DOC-T1-MODEL-UI (runda 1) — model doktryny grupy (#263, odblokowuje #264)

DOMENA: GAME (Rust, engine, model stanu). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator SONNET, FC SONNET. BEZ UI i BEZ renderer/.
BAZA (jedyna): `origin/rust-port/parity-v2` = `760be5187`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`: typ `GroupDoctrine` (l. 1938: defensive|steady|aggressive|skirmish|manual), pola `unitDoctrine` (2041) i `doctrine` (2059), `_ensureGroupMeta`, `_setGroupDoctrine`. Użycie w sterowniku: 6076–6097 (`_executeGroupDoctrineStep`). Znajdź dokładne funkcje: `git grep -n "_ensureGroupMeta\|_setGroupDoctrine\|GroupDoctrine" 07d2fbd72 -- gra/src`.

## CEL
Port modelu konfiguracji doktryny grupy po stronie domeny (bez UI): typ `GroupDoctrine`, meta grupy z domyślną wartością, `ensure_group_meta` (tworzy brakującą meta przy pierwszym dostępie, idempotentnie), `set_group_doctrine` (zapis z walidacją wartości z pinu). Wykonywanie kroku doktryny (`_executeGroupDoctrineStep`) jest POZA zakresem (#264).

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_doctrine_model.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (+1 linia `pub mod`)
- `rust-port/engine/tests/p6_k5doc_t1*.rs`, `p6_k5doc_t1_gen.mjs`, `p6_k5doc_t1_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T1-MODEL-UI/**`

## NIE ROBIĆ
- Nie zmieniaj `gra/`, `renderer/`, `view-model/`, `Cargo.lock`, `siege_tactics_loop.rs` (wiring to #264).
- Nie dodawaj nazwy modelu do trailerów. Nie używaj `#[ignore]`.

## WEKTORY / TESTY
- Każdy wariant `GroupDoctrine` z pinu (5 wartości) — parse/format zgodny z pinem.
- `ensure_group_meta`: pierwsze wywołanie tworzy meta z domyślną doktryną z pinu; drugie nie nadpisuje.
- `set_group_doctrine`: nieznana wartość → błąd; poprawna → zapis i odczyt.
- Wektory generowane wykonaniem tekstu pina przez TypeScript (jak p6_k5doc_t7a_gen.mjs), każdy z `plik:linia`.
- Mutacje (MUSZĄ dać FAIL): (a) domyślna doktryna inna niż w pinie; (b) `ensure` nadpisuje istniejącą meta; (c) walidacja pomija jedną z wartości.

## BRAMKI (crate civ-engine w `rust-port/engine`)
- `CARGO_TARGET_DIR` poza repo; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`.
- `df -h /` przed bramkami i mutacjami: ≥ 8 GB, inaczej BLOCK INFRA z liczbą GB.
- `cargo fmt --check -p civ-engine`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test p6_k5doc_t1`; `cargo test --all-targets --no-fail-fast` (w tle, `timeout 1800`). Kody wyjścia w raporcie.

## KRYTERIA KOŃCA
1. Wektory zielone; mutacje FAIL; bramki EXIT 0.
2. Commit jawnym `git add`, bez `Cargo.lock`, bez push do parity. Raport `01-operator-r1.md`.
