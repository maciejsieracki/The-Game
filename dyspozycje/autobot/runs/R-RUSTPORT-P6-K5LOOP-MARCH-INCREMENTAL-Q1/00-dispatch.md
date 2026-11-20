# R-RUSTPORT-P6-K5LOOP-MARCH-INCREMENTAL-Q1 — marsz jednostki (`_siegeWalkTo`) krok po kroku jak w pinie (kandydaci c1 118 / 196 / 221, klasa A)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus. Podstawa: `REJESTR-RUST.md` wpisy PIN3-DIVERGENCE (D-PIN3-1…5, klasa A) i FRAME-QUANT (D-FQ-1…3, długi MARCH-INCREMENTAL), raporty `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1/` (§3–§4: opis klasy A) oraz `R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1/` (§6 długi), `engine/tests/p6_k5loop_wiring_a_pin.rs` (lista `ROZBIEZNE_B_WIRA_PIN_3` = 3 bliźniaki `_klatka1`: `a3_las_mix_d3l_palisada_118_klatka1`, `a3_gory_lucz2_d5_palisada_196_klatka1`, `a3_rown_lucz2_d3l_mury_221_klatka1`), `engine/src/domain/siege_tactics_loop.rs` (`ProdSiegeWalk`, `do_move`, `walk_timeline`/`take_tail`, marsz K1b). NAJPIERW web (pin `07d2fbd72`): `gra/src/**/battleScene.ts` `_siegeWalkTo` (`:8006-8019`), `_bfsFirstStep`, `_doMove`, kolejność kroków marszu względem zdarzeń innych jednostek (strzał wieży, cios) przy kolejnych krokach; dokładnie czym różni się marsz w pinie (decyzja przy KAŻDYM kroku) od Rusta (marsz liczony atomowo przy starcie aktywacji — klasa A z PIN3). Dopiero potem Rust.
BAZA: `origin/rust-port/parity-v2` w chwili startu (`3e5db0673` w dniu dispatchu; zawiera FRAME-QUANT; wpisz faktyczny SHA). `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
Zamknąć klasę A: wynik Rust bajt w bajt zgodny z pinem dla kandydatów c1 118, 196, 221 (w każdym kroku klatki, w tym @1 i @16 ms) — marsz jednostki ma decydować o kolejnym kroku przy każdym kroku (jak pin), a nie atomowo przy starcie aktywacji.
1. Zdiagnozować w pinie, co dokładnie zmienia się między krokami marszu (np. rozbicie innej jednostki przez wieżę w trakcie marszu → inny cel/ścieżka/stan), i odtworzyć to w modelu marszu Rust (krokowa maszyna stanów `ProdSiegeWalk`, bez zmiany reguł gameplay).
2. Zachować zgodność 125/128 + nowych 3 (docelowo 128/128 @1 ms i @16 ms), wszystkich 42 wektorów i bliźniaków `_klatka1`/`_klatka4`, determinizm i niezależność od podziału na `StepSiegeBattle`.
3. Usunąć `ROZBIEZNE_B_WIRA_PIN_3` (lista ma być pusta) i zastąpić wyjątki zwykłymi wektorami bajt w bajt; jeśli któryś z trzech okaże się inną klasą — sklasyfikować jawnie i zostawić wyjątek z numerem długu.
4. Przy okazji (tylko jeśli ten sam mechanizm): 127 @32 ms (dług FQ-SPEED NIE jest w zakresie — tylko odnotować wynik pomiaru), D-PIN3-3-SHOT-ID — NIE w zakresie, chyba że ten sam diff.
Poza zakresem: `bridge.rs`, `client`, `renderer`, nowa mechanika gameplay (gdy pin jej nie ma → STOP i zgłoś).

## ALLOWLISTA
`rust-port/engine/src/domain/siege_tactics_loop.rs`, `engine/src/domain/siege_battle_session.rs` (tylko poprawki uzasadnione pinem), generator `engine/tests/p6_k5loop_wiring_a_gen.mjs` (strażnik SHA pinu i MD5 zachować; regeneracja wektorów, tylko dopiski), wektory `engine/tests/p6_k5loop_wiring_a_pin_vectors/*` (UWAGA: faktyczna ścieżka — `p6_k5loop_wiring_a_pin_vectors`, nie `p6_k5loop_wiring_a_vectors`), `engine/tests/p6_k5loop_wiring_a*.rs`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-MARCH-INCREMENTAL-Q1/*`. Nie ruszać: `bridge.rs`, `siege_battle_apply.rs`, `city_capture_apply.rs`, `playable.rs`, `siege_surrender.rs`/`siege_transfer*.rs` (KAPITULACJA/I6-DLUGI w toku), `client`, `renderer`, `src-tauri`, `gra/`.

## KRYTERIA KOŃCA
Test pin-vs-Rust: 128/128 kandydatów c1 zgodnych @1 i @16 ms (poza jawnie sklasyfikowanym wyjątkiem z numerem długu), lista `ROZBIEZNE_B_WIRA_PIN_3` pusta, 42+ wektorów bajt w bajt (stare bez zmian). Mutanty ≥ 20 w logice kroku marszu (każdy zabity lub jawnie równoważny, w tym mutant „marsz atomowy” = FAIL). Tabela „zamknięte / zostaje długiem”.

## BRAMKI (EXIT 0)
`cargo fmt --all -- --check`; `cargo clippy --all-targets -- -D warnings`; testy dotknięte (`p6_k5loop_wiring_a*`, `p6_k5loop_wiring_b*`, `bridge_contract`, `p6_k5loop_*`, `p6_zdobycie_miasta_a*`); pełny `cargo test --all-targets --no-fail-fast` przed werdyktem (checkout musi zawierać `dyspozycje/`). `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` z nazwą tematu; **wszystkie pliki tymczasowe/logi/skrypty mutantów w scratchpadzie z ID tematu w nazwie (`march-inc-*`) — scratchpad jest współdzielony z innymi tematami (incydent mut.log)**; w tle `setsid nohup`; po bramce usuń własny target.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak linii Co-Authored-By z nazwą modelu (dozwolona `Claude-Session:`). Commituj WIP wcześnie (rundy mogą paść z timeoutem/restartem kontenera). Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; sekcja „Długi”.
