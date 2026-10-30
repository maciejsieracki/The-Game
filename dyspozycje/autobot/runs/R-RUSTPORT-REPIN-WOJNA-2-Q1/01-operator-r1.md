STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-2-Q1
GOAL: REPIN-WOJNA-2, runda 1: port delty weba 91dc998a → dc8a3adc dla formationRules (U1), battle-mode (U2). Pin docelowy dc8a3adc (założenie: GOAL dispatchu; BAZA wskazywała 91dc998a, przodka dc8a3adc).
ZMIANY-COMMIT:
- 3d744de8 port(rust): U1 formationRules (initialBattleSlots: meleeLines/archerLines, rzędy per pasmo, skrzydła jazdy; compact rename). Pliki: `rust-port/engine/src/domain/formation_rules.rs`, `tests/p6_repin_wojna_a_formation.rs`, `tests/p6_repin_wojna_a_vectors/formation-rules.json` (regeneracja z weba dc8a3adc).
- 2117c4bf port(rust): U2 battle-mode (`isAutomaticOnlyBattleMode`). Pliki: `src/domain/battle_mode.rs` (nowy), `src/domain/mod.rs` (+`pub mod battle_mode`), `tests/p6_repin_wojna_2_battle_mode.rs`, `tests/p6_repin_wojna_2_vectors/battle-mode.json`.
- Dossier: `dyspozycje/rust-port/p6/P6-REPIN-WOJNA-2.md` (tabela zmiana → web → Rust → test → status). Raport i logi: commit tego raportu.
- Brak zmian w gra/**, renderer, src-tauri, Cargo.toml, WERSJE.md. Cargo.lock lokalny, niecommitowany.
TESTY:
- `cargo fmt --all -- --check` EXIT=0 (`fmt-final.log`)
- `cargo clippy --all-targets -- -D warnings` EXIT=0 (`clippy-final.log`)
- `cargo test --no-fail-fast` EXIT=0: passed 1446, failed 0 (`test-final.log`; baza a8083660 = 1443/0, +3 testy battle_mode)
- Wektory formation: classify 2031, slots 711, compact 1872 (0 rozbieżności z uruchomionym webem dc8a3adc).
- Mutanty zabite: M1 rank_size=per, M2 ignorowanie linii, M3 limit skrzydeł 3→2 (każdy: FAIL w `formation_groups_and_slots_match_web`, pozostałe 4 testy OK), M4 battle-mode is_some (FAIL 2/3). Logi `mut-b1-*.log`, `mut-b2-M4-battle-mode.log`.
- `git diff --check` czysty.
BLOKADY: brak technicznych. Poza zakresem tej rundy (NASTĘPNA-PARTIA): generals.ts (U3), generalQuickFollow.ts (U4, zależny od U3 i planned-march), integracja battle-mode z zapisem (main.ts:29056, :40818). Pozostałe nie-mutowane gałęzie: NIE_ZMIERZONO dla NaN/nieskończonego rankWidth (web propaguje NaN, Rust f64::max je ignoruje; wektory tego nie obejmują).
ZAŁOŻENIA:
- Z-1: pin = dc8a3adc (GOAL). Delta liczona 91dc998a..dc8a3adc: formationRules 85 linii zmienionych, battle-mode +14, generalQuickFollow +161 (nowy), generals +50 (nowy).
- Z-2: battleAlwaysManual modelowany jako Option<bool>; nie-boolowskie wartości → None (web `=== false` równoważnie).
- Z-3: wektory army-leadership / ai-era-unit-promotion nie wymagają regeneracji (brak delty między pinami).
RUNDY: 1/5
NASTĘPNY KROK: runda 2 (ten sam ID): U3 `domain/generals.rs` (generals.ts) z wektorami z weba dc8a3adc i mutantami; potem U4 `general_quick_follow.rs`; następnie integracja battle-mode z zapisem. Obieg: Evaluator/Final Control przed integracją.
DEPLOY/PUSH: NIE WYKONANO
