STATUS: PASS-WITH-NOTES (partia F zrobiona; partie D i E oraz pełny cargo test NIE_ZMIERZONO — temat NIEZAMKNIĘTY)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-3-Q1
GOAL: Port wielowojenności dyplomacji (LEDGER r5): partia D, partia E, port hunków F (brakeWarOutcome, isWarMarchOpenForPair, evaluateInterCivWarGate) 1:1 z gra/src.
BAZA: origin/rust-port/parity-v2 d6414fcf1 (detached); pin webu origin/main (wypakowanie git archive poza repo, Node 22.22).
ZMIANY/COMMIT:
- Partia F (commit: patrz SHA w sekcji niżej po commicie).
  - `rust-port/engine/src/domain/diplomacy_tick_war_brake.rs`: `BrakeWarOutcome`, `brake_war_outcome` (web `brakeWarOutcome`, D7).
  - `rust-port/engine/src/domain/diplomacy_multiwar_gate.rs`: `is_war_march_open_for_pair` (web `isWarMarchOpenForPair`).
  - `rust-port/engine/tests/p6_dyplomacja_multiwar3_f.rs` + `p6_dyplomacja_multiwar3_f_data/{brake,march}.json` (wektory z uruchomionego weba: 784 + 35).
  - `dyspozycje/rust-port/p6/P6-DYPLOMACJA-MULTIWAR-3.md` (tabela web→Rust, pomiar D/E, odstępstwa).
  - `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-3-Q1/` (generator gen-f.mts, loadery, ten raport).
- Allowlista: zachowana. Zero zmian w gra/**, WERSJE.md, Cargo.toml, renderer, src-tauri. Cargo.lock NIE dodany (artefakt builda, usunięty).
TESTY:
- cargo fmt --check: OK (po `cargo fmt` na zmienionych plikach).
- cargo clippy --lib --test p6_dyplomacja_multiwar3_f -- -D warnings: OK.
- cargo test --lib: 22/22.
- cargo test --test p6_dyplomacja_multiwar3_f: 3/3 (brake 784 wektory, march 35 wektorów + granice 39/40/41).
- cargo test --test p6_repin_wojna_c_war_brake: 2/2 (pick_war_declarer bez regresji).
- cargo test --test p6_dyplo_multiwar_interciv: 2/2.
- 0 nowych #[ignore].
- Pełny clippy --all-targets i pełny cargo test (wszystkie binarki) — NIE_ZMIERZONO (zakres tej rundy: tylko dotknięte binarki).
- Mutacje partii F — NIE_ZMIERZONO.
BLOKADY:
- Partia D (`diplomacy-siege-war-gate.ts`, 111 linii) — NIE zrobiona: wymaga portu typów City/RuntimeUnit i classifyCityAttack (mapSiegeDetect.ts); szacunek 120–160 LOC, 1 partia.
- Partia E (`diplomacy-locks.ts` case '2' + pozostałe, ok. 136 linii) — NIE zrobiona; szacunek 180–260 LOC, 1 partia.
- PeaceBalanceShape::Kinked NIE usunięty: używany przez wektory p6_dyplo_multiwar2_peace_ai ("kinked") i p6_dyplo_multiwar2_peace_helpers; zostaje oznaczony ODSTEPSTWO OD WEBU (dispatch: usuwać tylko gdy nic go nie używa).
- evaluateInterCivWarGate: zgodność z hunkiem l.~123/156 ponownie NIE_ZMIERZONO (obecne od partii A).
- Pełny cargo test — NIE_ZMIERZONO.
- Dysk: wolne ok. 6,4–7,7 GB na starcie i po bramkach (próg 1,5 GB nie naruszony).
ZAŁOŻENIA:
- `undefined` tury w wektorach = NaN w Rust (web: `undefined >= 40` = false).
- `undefined`/`null` tagu epoki = None.
- `is_player` w `brake_war_outcome` jako zamknięcie (brak zależności od stanu gry).
RUNDY: 1/5
NASTĘPNY KROK: runda 2 (ten sam ID): partia D (diplomacy_siege_war_gate.rs + wektory z gen-siege-war-gate.mts), potem partia E (diplomacy_locks.rs case '2'), potem pełny cargo test i mutacje ≥85%. Final Control na commicie partii F po integracji orkiestratora.
DEPLOY/PUSH: NIE WYKONANO (commity lokalne, bez push).
