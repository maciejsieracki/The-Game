STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-ZAPIS-MIGRACJE-FALA509-Q1
GOAL: Pola i migracje zapisu P6.20-22 wplywajace na stan po wczytaniu (naprawy FC r2 1-5)
ZMIANY/COMMIT: baza 2ad132a1b + merge parity-v2 (1f793b61a, czysty, osobny commit); kod r3 w commicie podanym w raporcie koncowym. Pliki: types.rs (UnitDto.is_general addytywnie), state.rs (demote_generals, relocate_units), save_migrations.rs (demote_generals_over_limit, enforce_army_stack_limit, migrate_loaded_state), save_load.rs (migrate_on_load, auto_build_allowed_for_owner), tests/p6_zapis_migracje_snapshot_load.rs, P6-ZAPIS-MIGRACJE-FALA509.md sekcja 4.
TESTY: fmt OK; clippy --all-targets -D warnings OK; lib 28 ok; save_load 6, state_dto 10, replay 6, p6_repin_wojna_2_r4_save 8, p6_wire_war_state_snapshot 8, p6_zapis_erawar_save 5/counts 11, p6_zapis_migracje_* (generals 1, meta_flags 5, snapshot_flags 3, stack 1, snapshot_load 9 NOWE) — 0 failed, 0 nowych #[ignore]. Baseline na starcie: NIE ZMIERZONO osobno (brak regresji w tych samych binarkach po zmianie).
BLOKADY: brak. ZALOZENIA: patrz sekcja 4 dokumentu luk (era od wolajacego; brak gor w TerrainDto; start tury bez odpowiednika w PlayableState; konsument playerEpochWar w turze poza zakresem).
RUNDY: 3/5
NASTEPNY KROK: Evaluator -> Final Control
DEPLOY/PUSH: NIE WYKONANO
