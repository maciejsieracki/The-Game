STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-ZAPIS-MIGRACJE-FALA509-Q1
GOAL: Runda 2 (odpowiedz na zarzuty rundy 1): migracja nadmiaru wodzow i siatki stosu jako plan zgodny z webem (wektory z uruchomionego weba), testy przez SaveSnapshot dla flag meta, tabela luk z pomiarem. Podpiecie migracji do stanu gry NIE zrobione — zablokowane modelem danych (ponizej).
ZMIANY/COMMIT: baza e4edcd4ae (operator r1). Commit lokalny (SHA w sekcji DEPLOY/PUSH), bez push. Allowlista: rust-port/engine/src/domain/save_migrations.rs (NOWY), rust-port/engine/src/domain/mod.rs (+1 linia `pub mod save_migrations;`), rust-port/engine/tests/p6_zapis_migracje_generals_vectors.rs, p6_zapis_migracje_stack_vectors.rs, p6_zapis_migracje_snapshot_flags.rs (NOWE), rust-port/engine/tests/p6_zapis_migracje_vectors/ (NOWE: 2 pliki JSON z webu, 2 generatory .mjs), dyspozycje/rust-port/p6/P6-ZAPIS-MIGRACJE-FALA509.md (tabela luk), runs/R-RUSTPORT-P6-ZAPIS-MIGRACJE-FALA509-Q1/01-operator-r2.md. Plik poza allowlista: brak.
TESTY:
- Wektory z WEBU (Node v22.22.0, origin/main gra/src/game/generals.ts `planGeneralLimitDemotions`): 407 przypadkow, 151 z degradacja; Rust zgodny co do listy id. Test: p6_zapis_migracje_generals_match_web_vectors PASS.
- Wektory z WEBU (Node v22.22.0, origin/main gra/src/game/army-stack-limit.ts `planOversizedStackSplits`): 303 przypadki, 258 z ruchami, 1 z nieumieszczonymi (3 reczne + losowe); Rust zgodny co do kolejnosci ruchow i listy nieumieszczonych. Test: p6_zapis_migracje_stack_split_matches_web_vectors PASS.
- p6_zapis_migracje_snapshot_flags (3 testy przez pelny SaveSnapshot: stary zapis bez pol, nowe pola round-trip, zle typy): 3 PASS.
- p6_zapis_migracje_meta_flags (runda 1): 5 PASS.
- Lib (w tym 6 testow save_migrations): 28 passed, 0 failed.
- Regresja: save_load 8, p6_zapis_erawar_save 11, p6_repin_wojna_2_r4_save 5, p6_zapis_erawar_counts 6, replay 6 — 0 failed.
- cargo fmt -- --check: rc=0. cargo clippy --all-targets -- -D warnings: rc=0 (po poprawce typu `over`).
- git diff --check: do uruchomienia przed commitem (patrz SHA).
BLOKADY:
(1) Demotion wodzow NIE podpiety do wczytania. ZMIERZONO: UnitDto (types.rs) nie ma pola isGeneral ani kolejnosci narodzin; SaveSnapshot czyta format SnapshotWire (version/state/event_queue/rng), nie format weba (wersja/tura/units/gracze, main.ts:36855). Wymaga zmiany modelu (types.rs spoza allowlisty).
(2) Siatka stosu NIE podpieta. ZMIERZONO: wywolanie w webie przy wczytaniu main.ts:46573 i na starcie tury main.ts:37754; zalezy od mapHexPassableForUnit + canUnitOccupyCityHex (main.ts:4341) — w Rust brak tego zestawu w stanie gry.
(3) Konsumenci flag: auto_build_gate::is_auto_build_allowed_for_owner — 0 wywolan poza definicja (ZMIERZONO grepem); playerEpochWar — uzywany tylko przez accessor. Podpiecie wymaga pola w stanie gry.
(4) Migracja wlasciciela cudu: web nie ma migracji zapisu (zgodnie z dispatchem nie portowano).
(5) NIE_ZMIERZONO: plannedMarches — zgodnosc planned_marches_to_save (pathfinding.rs:2250) z planned-march.ts:438-462 nie porownana w tej rundzie.
(6) NIE_ZMIERZONO: pola dyplomacji/oblezenia (W1) — poza zakresem rundy.
(7) Wektory z WEB SaveSnapshot (pelna sciezka wczytania webowego zapisu) — NIE WYKONANO (brak odczytu formatu weba w Rust).
(8) Dodatkowe ZAŁOŻENIA: (a) isGeneral = tylko JSON true (web `=== true`); (b) epoka brakujaca w wektorze = 1; (c) limit >= 0 w planie stosu (web slice(limit) dla ujemnego limitu ma inna semantyke); (d) wspolrzedne i wlasciciele stosu = liczby calkowite; (e) kolejnosc w planie stosu = kolejnosc wejsciowa (jak web).
RUNDY: 2/5; ostatni werdykt rundy 1: FAIL (zarzuty przyjete i zrealizowane czesciowo: demotion i stos ZROBIONE jako plan z wektorami; wiazanie do stanu gry ODRZUCONE jako wymagajace zmiany modelu, z dowodem w blokadach 1-2); decyzja wymagana: brak.
NASTEPNY KROK: runda 3 (lub osobny temat): zmiana UnitDto o pole generala/kolejnosc narodzin + odczyt zapisu weba w SnapshotWire albo decyzja o formacie; potem podpiecie demotion i stosu do wczytania; potem wektory SaveSnapshot ze starym zapisem webowym.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny, bez git push; Cargo.lock i target/ usuniete po bramce).
