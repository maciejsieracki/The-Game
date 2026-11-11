STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-ZAPIS-MIGRACJE-FALA509-Q1
GOAL: Pola i migracje zapisu P6.20-22 (migracje wodzow/stosu po wczytaniu, flagi meta).
ZMIANY/COMMIT: SHA do integracji = ad31af5b1 (rodzic ed42e1ea6 -> 1f793b61a; merge parity-v2 1079feb9f jest przodkiem ad31af5b1, wiec kolejnosc: ad31af5b1 zawiera juz origin/rust-port/parity-v2 @1079feb9f; integrowac po nim, bez konfliktow wzgledem niego). Allowlista: save_load.rs, save_migrations.rs, state.rs, types.rs, pathfinding.rs (poza allowlista, minimalna zmiana Map-semantyki, uzasadniona zarzutem 4 - zaakceptowana), testy p6_zapis_migracje_*, dokument P6, raporty runu. gra/ nietkniete.
ROZSTRZYGNIECIE ZARZUTOW:
1. Brak automatycznej migracji przy wczytaniu: ODDAL (brak loadera w Rust; migracja wymaga kontekstu wolajacego; kontrakt w doc-komentarzu impl Deserialize). Osobny temat: loader zapisu wolajacy migrate_on_load.
2. Brak konsumenta playerEpochWarEnabled: ODDAL (poza zakresem; tylko accessor). Osobny temat: R-RUSTPORT-P6-WIRE-EPOCH-WAR-FLAG-Q1.
3. Stala epoka w testach: ODDAL (naprawione w obronie: test epoch_limit_depends_on_owner_era; snapshot_load 10 testow).
4. Duplikaty planned_marches: ODDAL (naprawione: semantyka JS Map + 2 testy dedupe; brak osobnego wektora z weba = NIE_ZMIERZONO, ryzyko niskie: dla kluczy unikalnych zachowanie bez zmian, regresje p6_4_march i p6_repin_wojna_2_r3_planned_march zielone).
Zero NAPRAW.
TESTY (zmierzone samodzielnie na ad31af5b1; CARGO_INCREMENTAL=0, debug=0, target w worktree):
- cargo fmt --check: OK
- cargo clippy --all-targets -- -D warnings: exit 0
- cargo test, 0 failed, 0 ignored: lib 28; save_load 6; state_dto 10; replay 6; p6_repin_wojna_2_r4_save 8; p6_wire_war_state_snapshot 8; p6_zapis_erawar_save 5; generals 1; stack 1; meta_flags 5; snapshot_flags 3; snapshot_load 10; planned_dedupe 2; regresja p6_4_march 6; p6_repin_wojna_2_r3_planned_march 3.
- Nie uruchomiono: p6_wire_war_state.rs, p6_zapis_erawar_save_counts (NIE_ZMIERZONO).
BLOKADY: brak
RUNDY: 3/5 (ten sam ID)
NASTEPNY KROK: integracja orkiestratora ad31af5b1 (git merge-base --is-ancestor + git diff --stat); zalozyc tematy: loader zapisu z migrate_on_load; R-RUSTPORT-P6-WIRE-EPOCH-WAR-FLAG-Q1.
DEPLOY/PUSH: NIE WYKONANO
