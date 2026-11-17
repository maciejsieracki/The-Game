# DISPATCH R-RUSTPORT-P6-R7K7C-WIRING (runda 1) — wpięcie apply_dipl_deltas_to_state w advance_turn (#106, #298, #299)

DOMENA: GAME (Rust, engine, tura dyplomacji). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator SONNET, FC SONNET. BEZ renderer/ i gra/ (poza odczytem).
BAZA (jedyna): `origin/rust-port/parity-v2` = `760be5187`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/`: znajdź wołający deltas dyplomacji w turze (`git grep -n "R7K7\|applyDipl\|dipl.*delta\|zarejestrujDelta" 07d2fbd72 -- gra/src`) i zasadę "brak wpisu = 0" (wartość domyślna bez wpisu w tabeli).
RUST: `rust-port/engine/src/domain/turn_war_dipl_steps.rs:1034` (`apply_dipl_deltas_to_state`, istnieje, NIEWOŁANE w produkcji), `rust-port/engine/src/domain/playable.rs:1400` (`advance_turn`), `playable.rs:1717` (test trzech tur po stores).

## CEL
Wpiąć `apply_dipl_deltas_to_state` w `advance_turn` w kolejności zgodnej z pinem, zapewnić parytet "brak wpisu = 0", dopisać wektory ≥ 150 dla samego apply i dla D3 (#299).

## ALLOWLISTA
- `rust-port/engine/src/domain/playable.rs` (wiring w `advance_turn`)
- `rust-port/engine/src/domain/turn_war_dipl_steps.rs` (tylko jeśli potrzebna zmiana sygnatury; inaczej bez zmian)
- `rust-port/engine/tests/p6_r7k7c*.rs`, `p6_r7k7c_gen.mjs`, `p6_r7k7c_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-WIRING/**`

## NIE ROBIĆ
- Nie zmieniaj `gra/`, `renderer/`, `view-model/`, `Cargo.lock`, innych modułów domain poza allowlistą.
- Decyzje gameplay (kolejność faz, progi) NIE są Twoje: jeśli pin i Rust się rozjeżdżają, zapisz w raporcie jako DECISION_REQUIRED, nie wybieraj.
- Nie dodawaj nazwy modelu do trailerów. Nie używaj `#[ignore]`.

## WEKTORY / TESTY
- Wektory `apply_dipl_deltas_to_state` ≥ 150 przypadków, generowane wykonaniem tekstu pina przez TypeScript, każdy z `plik:linia`.
- Test "brak wpisu = 0": brak wpisu w tabeli daje zerową deltę (nie błąd, nie brak zmiany).
- Test wiringu: trzy tury `advance_turn` z deltami; wynik zgodny z wektorami.
- Mutacje (MUSZĄ dać FAIL): (a) usunięcie wywołania z `advance_turn`; (b) "brak wpisu" traktowany jako błąd; (c) zamiana kolejności apply względem poprzedniego kroku tury.

## BRAMKI (crate civ-engine w `rust-port/engine`)
- `CARGO_TARGET_DIR` poza repo; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`.
- `df -h /` przed bramkami i mutacjami: ≥ 8 GB, inaczej BLOCK INFRA z liczbą GB.
- `cargo fmt --check -p civ-engine`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test p6_r7k7c`; `cargo test --all-targets --no-fail-fast` (w tle, `timeout 1800`). Kody wyjścia w raporcie.

## KRYTERIA KOŃCA
1. Wiring w `advance_turn`, wektory ≥150 zielone, mutacje FAIL, bramki EXIT 0.
2. Commit jawnym `git add`, bez `Cargo.lock`, bez push do parity. Raport `01-operator-r1.md`.

## DODATEK r2 (orkiestrator, po BLOCK INFRA r1 + FC FAIL: bramki nieuruchomione, brak wektorów D3, rozjazd parytetu, mutant (c))
Rozstrzygnięcia orkiestratora (reguła 8/9: parytet z pinem, decyzje techniczne podejmuje orkiestrator).
- BAZA r2: `f0eb32ab8` (wip r1 Obrony; zawiera wiring w `advance_turn` i poprawkę rollbacku ekonomii). Sprawdź `git merge-base --is-ancestor origin/rust-port/parity-v2 f0eb32ab8`; jeśli parity się przesunęło — zrób rebase na parity i zapisz SHA.
- ZARZUT 5 (rozjazd Ledger D3 vs pula Pracy): ROZSTRZYGNIĘTE — zgodnie z pinem. Pin podłogowuje pulę przy KAŻDYM zapisie (`setOwnerPracaPool`, `gra/src/main.ts:34879-34882`, wołania `main.ts:24015-24016`, `12588-12589`). Zmień `rust-port/engine/src/domain/turn_war_dipl_steps.rs` (ledger D3, ok. 399–412): podłoga po każdym zapisie, saldo płatnika sprawdzane. ALLOWLISTA rozszerzona jednorazowo o ten plik — tylko zmiana ledgera D3, nic więcej.
- ZARZUT 6 (rollback): zostaje poprawka Obrony w `playable.rs` (`economy_before`, przywracanie w obu ścieżkach błędu). Dodaj test dowodzący przywrócenia salda skarbca po błędzie `phases.len() != PHASE_COUNT`.
- ZARZUT 4 (wektory D3, #299): WYMAGANE ≥ 150 wektorów dla D3 ORAZ ≥ 150 dla apply. Wektory muszą pochodzić z generatora (wykonanie tekstu pina przez TypeScript), nie ręcznie. Wektory apply muszą obejmować SEKWENCJE przepływów w jednej turze dla tego samego właściciela (nie jedną zagregowaną operację), bo pin wywołuje `setOwnerPracaPool` wielokrotnie.
- ZARZUT 3 (test wiringu): wartości z generatora, nie policzone ręcznie; co najmniej dwa scenariusze (w tym Work/praca i handel cykliczny zasobami).
- ZARZUT 7 (mutant c, zamiana kolejności apply): ROZSTRZYGNIĘTE — po poprawce podłogi (zarzut 5) kolejność przepływów ma obserwowalny efekt; mutant (c) MUSI dać FAIL. Jeśli nadal przeżywa — zgłoś DECISION_REQUIRED, nie uznawaj za równoważny.
- ZARZUT 8 (wielu ludzi, is_human): poza zakresem (#282). Nie ruszaj.
- MUTACJE (MUSZĄ dać FAIL): (a) usunięcie wywołania z `run_diplomacy_war_phase`; (b) brak wpisu traktowany jako błąd; (c) zamiana kolejności przepływów (po poprawce podłogi); (d) usunięcie podłogi po zapisie (ledger D3); (e) rollback bez economy.
- BRAMKI: `cargo fmt --check -p civ-engine`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test p6_r7k7c`; `cargo test --all-targets --no-fail-fast` (w tle, `timeout 1800`). Kody wyjścia w raporcie.
- DYSK: ≥ 8 GB przed startem i przed każdą mutacją (`df -h /`). Przy < 8 GB: BLOCK INFRA z liczbą GB.
- Trailery commitów: BEZ nazwy modelu (#289). Raport `02-operator-r2.md`. Commit jawnym `git add`, bez `Cargo.lock`, bez push do parity.
