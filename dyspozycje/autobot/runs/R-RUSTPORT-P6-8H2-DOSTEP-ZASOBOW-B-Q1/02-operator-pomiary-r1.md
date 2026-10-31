STATUS: PASS-WITH-NOTES (pomiary i gate'y zamknięte; zakres tematu NIE spełniony: 13 z 16 funkcji resource-access.ts i wektory z pinu)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8H2-DOSTEP-ZASOBOW-B-Q1
GOAL: P6.8H2 partia B — pomiary niezależne na commicie 598da6429: mutacje gałęzi sterujących, gate'y fmt/clippy/test z logami EXIT, dokument tematu, raport.
ZMIANY/COMMIT: detached HEAD 598da6429 -> commit pomiarowy (SHA w git log po commicie). Allowlista: `rust-port/engine/src/domain/resource_access/capital_labels.rs` (rustfmt, bez zmiany zachowania); `rust-port/engine/tests/p6_8h2_capital_labels.rs` (rustfmt + nowy test `stolica_bonus_honours_designated_capital`); `dyspozycje/rust-port/p6/P6-8H2-DOSTEP-ZASOBOW-B.md` (tabela mutantów, gate'y); run: `02-operator-pomiary-r1.md`, `gate-*.txt`, `mutacje-p6-8h2-b.py`, `mutacje-wyniki-{a,b}.txt`. `Cargo.lock` (artefakt builda, nieśledzony) NIE commitowany.
TESTY:
- `cargo fmt --check -p civ-engine`: EXIT=0 (przed: EXIT=1, tylko nowe pliki partii B).
- `cargo clippy -p civ-engine --all-targets -- -D warnings`: EXIT=0.
- `cargo test --test p6_8h2_capital_labels`: 11 passed, EXIT=0 (było 10).
- `cargo test --test p6_8h_access`: 13 passed (regresja), EXIT=0.
- `cargo test -p civ-engine`: 1951 passed, 0 failed, EXIT=0 (baza 1940 + 11).
- Mutacje (19 mutantów, `capital_labels.rs`): 19 KILLED, 0 SURVIVED po dodaniu testu. M13 (stolica ignoruje designated) przed dodaniem testu: SURVIVED; po: KILLED.
- Poprawka pomiarowa: skrypt mutacji przywraca mtime pliku (cargo nie rebuilduje po copy2 bez `utime`); bez tego regresja biegła na artefakcie mutanta (fałszywy FAIL, usunięty przez `touch` i ponowny run).
BLOKADY:
(1) 13 z 16 funkcji resource-access.ts NIE portowane (następna runda Operatora).
(2) Wektory z pinu 91dc998a NIE wygenerowane (wektory ręczne wg kontraktu web).
(3) `clearCityCultureMix` (state.rs:544-581) i `placedImprovementsWithZlotoTradeGrant` (main.ts) NIE zbadane w tej rundzie.
(4) NIE_ZMIERZONO jako mutant: 13 pozostałych wpisów tabel `surowiec_key_label`/`zloze_label` (pokryte asercjami równości) oraz gałąź `if let Some` w `surowiec_label_or_capitalized`.
(5) ZAŁOŻENIE: `found_order` wstrzykiwany (brak `cityFoundOrder` w Rust; grep = brak).
(6) Brak niezależnego weryfikatora (Evaluator) w tej rundzie — wynik to pomiar Operatora.
RUNDY: 2/5 (runda 1: impl; runda 2: pomiary, bez zmian zakresu)
NASTĘPNY KROK: Evaluator (Sonnet 5.5) na commit pomiarowy; potem Operator r3 na 13 funkcji resource-access.ts i wektory z pinu 91dc998a.
DEPLOY/PUSH: NIE WYKONANO (merge do main i push wymagają READY_FOR_DEPLOY po Evaluator i Final Control oraz osobnej autoryzacji; gałąź nie wypchnięta).
