STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1
GOAL: Odpowiedź na zarzuty rundy 1 (partia A) i domknięcie poprawek; zakres B–F nadal otwarty.
ZMIANY/COMMIT: 4f24a7a7b (r2: ponowne użycie ForcedEraTag z diplomacy_multiwar, komentarze pin). Pliki: rust-port/engine/src/domain/diplomacy_multiwar_gate.rs, src/domain/diplomacy_multiwar.rs, tests/p6_dyplo_multiwar2_eraign.rs. Brak zmian w gra/**, WERSJE.md, save_load.rs, Cargo.toml.
TESTY: cargo fmt --check OK; cargo clippy --all-targets -D warnings OK; cargo test --lib 22/22; p6_dyplo_multiwar2_eraign 3/3; p6_dyplo_multiwar_interciv 2/2. Mutacje ręczne (5 mutantów na bramce ERA): M1 bez Iron w ignore-R1 -> 2 FAIL; M2 wojna epoki respektuje NAP -> 2 FAIL; M3 start tur Brązu 20->25 -> 2 FAIL; M4 próg R1 40->39 -> 2 FAIL; M5 bramka bez obejścia R1 -> 2 FAIL. Zabite 5/5. Pełna mutacja ≥85% (cargo-mutants): NIE_ZMIERZONO. Pełny baseline cargo test: NIE_ZMIERZONO.
ODPOWIEDZI NA ZARZUTY:
- Z1 (zduplikowany ForcedEraTag): PRZYJMUJĘ. Usunięto drugi enum; gate re-eksportuje `pub use crate::domain::diplomacy_multiwar::ForcedEraTag` (commit 4f24a7a7b). Ścieżka `diplomacy_multiwar_gate::ForcedEraTag` zachowana, testy bez zmian w logice. Dowód: clippy + 5 testów zielone.
- Z2 (zakres A–F): PRZYJMUJĘ. Partie B (war-weariness), C (forced-peace AI↔AI), D (siege gate), E (locks poza '2'), F (REPIN) NIE ZROBIONE w r2. Temat NIEZAMKNIĘTY; ten werdykt dotyczy wyłącznie partii A.
- Z3 (mutacje/baseline): PRZYJMUJĘ częściowo. Zmierzono 5 ręcznych mutantów bramki ERA (5/5 zabitych). Pełna mutacja ≥85% i pełny baseline NIE_ZMIERZONO.
- Z4 (martwy kod: is_war_treaty_blocked, is_era_forced_war_ignoring_r1 poza modułem, stałe ERA_FORCED_WAR_START_TURNS_*; brak timera ERADELAY i podpięcia ERAIGN): PRZYJMUJĘ jako notę. Funkcje są czystymi portami 1:1 zweryfikowanymi wektorami z weba; podpięcie do ścieżki wypowiedzenia i timera startu po 20 turach wymaga modułu wojny wymuszonej (poza partią A) i jest NIE ZROBIONE.
- Z5 (stale pin w komentarzach, literówka w teście): PRZYJMUJĘ. Literówka „Brak tagi” -> „Brak tagu” (test). Komentarze przy ERA_WAR_PARAMS i ENABLED_FORCED_WAR_ERAS dopisują: wartości zgodne z 5dd53e60f (zweryfikowano: war-rules-params.json 5dd53e60f ma tylko zmianę eraForcedWarStartTurnsFromEra/eraForcedWarIgnoreR1, które nie dotyczą tych literałów). Pełny REPIN pinów = partia F.
NASTĘPNY KROK: runda 3 — partia B (war-weariness), potem C, D, E, F; po każdej partii commit i bramki; podpięcie isWarTreatyBlocked/ERADELAY timera w tej samej rundzie, gdy powstanie moduł wojny wymuszonej.
RUNDY: 2/5. Ostatni werdykt: PASS-WITH-NOTES (r1). Decyzja właściciela: nie wymagana.
DEPLOY/PUSH: NIE WYKONANO (push nie wykonywany).
