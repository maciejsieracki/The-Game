STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-EKONOMIA-C-Q1
GOAL: REPIN krok 4b, część C (web 91dc998a): mnożnik kosztu budowy ulepszeń terenu 0.5/1/2 w Rust + zamknięcie wektorów M16 i P6.23 z realnego weba 91dc998a.
ZMIANY/COMMIT:
- b1dfaf08 feat(rust-port): port C1+C2 (`improvements.rs:789` nowa `terrain_improvement_construction_era_multiplier`, `improvements.rs:821` `scale_terrain_improvement_work_cost` używa jej); nowy test `tests/p6_repin_c_construction.rs`.
- 720f91f2 test(rust-port): wektory `p6_m16_vectors/{qualifier,rules}.json`, `p6_23_vectors/improvements.json` z URUCHOMIONEGO weba 91dc998a (gallery, order, hexmove, fort bez zmian).
- Dokument: `dyspozycje/rust-port/p6/P6-REPIN-EKONOMIA-C.md` (tabela zmiana → plik:linia weba → plik:linia Rust → test → status).
- Ten raport + logi: commit w gałęzi (SHA w `git log`, ostatni commit tematu).
TESTY:
- `cargo fmt --all -- --check`: EXIT=0 (log gate-fmt-r1.log).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (gate-clippy-r1.log).
- `cargo test --no-fail-fast`: 1276 passed / 0 failed (baseline 1272 + 4 nowe) (gate-test-r1.log).
- Mutacja (stara ścieżka 1/2/4 w scale): FAILED w 3 testach, po przywróceniu zielone (mutation-r1.txt).
- Wektory: qualifier.json 7 737 658 B (<10 MB), rules.json 3 999 579 B; regeneracja z weba 91dc998a, zmiany tylko kosztPraca / work_cost_scale.
- Weryfikatory Python (tekstowe modele edb8fb56, poza allowlistą): P6.23 280 rozbieżności, M16 11037 rozbieżności — WSZYSTKIE z przyczyny: model w Pythonie ma starą formułę 1/2/4 (log: verify-p623-vs-91dc998a-r1.log, verify-m16-vs-91dc998a-r1.log). Autorytatywne porównanie Rust vs realny web: 0 rozbieżności (testy zielone).
BLOKADY:
- Weryfikator M16 nie został zaktualizowany (poza allowlistą); wymaga osobnego tematu.
- Nie zbadano, dlaczego liczba rozbieżności weryfikatora M16 (11037) różni się od liczby zmienionych liści w qualifier (11551): ZAŁOŻENIE: rozbieżność wynika z różnych ścieżek liczenia w modelu Pythona; NIE_ZMIERZONO.
- C5 (`relief-preserving-improvements.ts`, `tartak`) i C6 (`population-growth-v85.ts`) to zmiany behawioralne webu poza częścią C — ZAŁOŻENIE: osobna partia, zgodnie z dispatchem ("osobna partia"); nie portowane w tej rundzie.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) weryfikuje C1/C2, wektory (sha 720f91f2) i brzegi N-1/N/N+1; następnie Obrona/Final Control. Osobne partie: C5 (relief tartak), C6 (population-growth-v85); osobny temat: aktualizacja weryfikatorów Python do formuły budowy.
DEPLOY/PUSH: NIE WYKONANO
