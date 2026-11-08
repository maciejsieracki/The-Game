STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1
GOAL: Pozycja 7 kolejki (port oblezenia i zdobyczy 1:1 z webem). Runda 1: pomiar symbol po symbolu + partia 1 (glod garnizonu i poddanie, czysta decyzja `siegeStarvationState`).
BAZA: Rust `c86c686bb` (rust-port/parity-v2); pin web `a61337844` (origin/main). Branch: `rust/repin-oblezenie-zdobycze-q1`.
ZMIANY-COMMIT: SHA w sekcji "COMMIT" ponizej (po commicie). Allowlista: `rust-port/engine/src/domain/siege_starvation.rs` (nowy), `rust-port/engine/src/domain/mod.rs` (+1 `pub mod`), `rust-port/engine/tests/p6_oblezenie_glod.rs` (nowy), `dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-ZDOBYCZE.md` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1/01-operator-r1.md` (nowy). Brak zmian w gra/**, renderer, src-tauri, Cargo.toml, WERSJE.md.
POMIAR: tabela symbol -> status w `P6-REPIN-OBLEZENIE-ZDOBYCZE.md` §1. Najwazniejsze: Rust ma 0 plikow siege*.rs i wonder_transfer*.rs; ZGODNE: applyArmyStarvationHpLoss (turn_economy_attrition.rs:54), mnoznik struktur oblez. (combat.rs:230); CZESCIOWE: atrycja N3 (turn_economy_attrition.rs:266), blokada rekrutacji (recruitment.rs:2315); BRAK: planSurrenderEntry, planLastStandSortie, planWonderTransfers, BATTLE_MAX_PER_SIDE, battleReserveNotice, faza kapitulacji w main.ts.
TESTY:
- rustfmt --edition 2021 --check (nowe pliki): exit 0
- cargo clippy --lib --test p6_oblezenie_glod -- -D warnings: exit 0
- cargo test --test p6_oblezenie_glod: 23 passed, 0 failed, exit 0
- wektory: web siege-starvation.ts (a61337844) pod Node 22 --experimental-strip-types; zgodnosc Rust z web na 20 wejsciach (oczekiwania w testach jawne)
- mutanty reczne: (a) `<` -> `<=` przy progu 0,5 => FAIL 1 test (zabita); (b) `food > 0` -> `>= 0` => FAIL 4 testy (zabita); plik przywrocony, 23/23
- mutation score >= 85% (cargo-mutants): NIE_ZMIERZONO (narzedzie nie uruchomione)
- cargo test --no-fail-fast baseline 2155/0: NIE_ZMIERZONO (dysk 2,8-3,8 GB wspolny z 4 operatorami; pelna kompilacja nie byla bezpieczna; target-oblezenie usuniety po bramkach)
- git diff --check: czysto (brak wynikow)
BLOKADY: (1) pelny baseline i mutation score NIE_ZMIERZONO (dysk); (2) partie P2-P6 niezrobione w tej rundzie (zakres > 600 LOC; kolejnosc w dokumencie); (3) pin z dispatchu `4bbef081d` nie zweryfikowany - pomiar wykonany na `a61337844`; (4) `handleSiegeCapitulationPhase`/`resolveSiegeSurrender` (main.ts) - dlug, nowe ID przy P6.
RUNDY: 1/5
NASTEPNY KROK: runda 2 (ten sam ID): partia P2 - `siege_enter_city.rs` (planSurrenderEntry) + `siege_sortie.rs` (planLastStandSortie), testy N-1/N/N+1/NaN, wektory z Node na a61337844. Zalecenie: Operator Haiku; wektory Node jak w r1.
DEPLOY/PUSH: NIE WYKONANO
COMMIT: podany w odpowiedzi koncowej (lokalny commit, bez push).
