STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-DELTA-4-Q1
GOAL: Repin pinu weba 4bbef081d -> 23dd158e9: tabela delty 100%, port hunków z istniejącym modułem Rust, wektory z uruchomionego weba.

ZARZUTY EVALUATORA (r1) I ODPOWIEDŹ
1. Mutacje 88% (T07/T09/T16): PRZYJMUJĘ. Dodano `topup_bound.json` (99 wektorów granicznych z weba); T07, T09, T16 (+ nowy T17) ubite. Razem 55 mutantów, 53 ubite = 96% brutto; M12 ekwiwalent udowodniony webmutem; P15 jawnie nieubity (patrz BLOKADY).
2. Poz. 23–25 zepchnięte do długu: PRZYJMUJĘ. Zaportowane w `cluster_compute.rs`, `cluster_layout.rs`, `cluster_mass.rs`; wektory M09–M12 i P6.1C zregenerowane z weba; `capital_min_separation_for_map_pin` jest wołane przez `compute_clusters`/`build_cluster_spawn_plan`. Mutanty P01–P18: 17/18 ubitych.
3. Brak niezależnego weryfikatora Python -I: PRZYJMUJĘ. `tools/verify_repin4.py` (freshwater, capsep, sight, visibility, pełny topUp fazy 1–3, 320 przypadków) -> `VERIFY_OK`.
4. Hashe map: ODRZUCAM jako poprawkę, ODNOTOWUJĘ jako OTWARTE. `mapgen/generate.rs` to stub, potok `generateMap` poza zakresem; zweryfikowane funkcje czyste i `compute_clusters`/spawn plan na mapach z weba.
5. Poz. 16 (mgła): PRZYJMUJĘ. Moduł istniał (`domain/state.rs`, `terrain::visibility`); r1 błędnie uznała brak. Dodano `compute_player_visibility_with_extra` (Z5), wektory `visibility.json` (160 przypadków, 62 ze zmianą wyniku), mutanty V01–V02 ubite.
6. Niespójne liczby w dokumencie: PRZYJMUJĘ. Poprawiono: topup 221 (143 z dosypem) + bound 99 (63) = 320; rozmiary plików z `ls`.

ZMIANY-COMMIT: r2 na bazie WIP `65833be1a` (D4-ob): `f7150e6f1`, `b554d888d`, `08ba9f38d`, `65833be1a`, `86cd0a034` oraz końcowy (SHA w odpowiedzi orkiestratorowi). Poza allowlistą (założenia w `REPIN-DELTA-4.md`): Z1 (`terrain_map.rs`, `economy_society_part2.rs`), Z5 (`state.rs`), Z6 (generator M09), Z7 (`p6_m12_tables.rs`, `p6_1c_llama_seed.rs`). Zero zmian w `gra/**`, `turn_economy_{wire,tick,loop,empirefood,attrition,order*}.rs`, `Cargo.toml`, `renderer/**`, `src-tauri/**`, `WERSJE.md`.

TESTY (po ostatniej zmianie kodu): pełny `cargo test -j 2` w 6 shardach = 2087 passed, 0 failed (baza 2082 + 5 nowych). `gate-fmt.txt` EXIT=0, `gate-clippy.txt` (-D warnings, --all-targets) EXIT=0, każdy log z jedną linią `EXIT=`. Weryfikator Python -I: VERIFY_OK.

BLOKADY: (a) hashe całych map — brak potoku `generateMap`; (b) P15 — brak wektora dla archipelagu drobnych wysp z polarnymi (NIE_ZMIERZONO osiągalności); (c) regeneracja wektorów M09–M12/P6.1C: odtwarzanie starych pinów bajt-w-bajt przyjęte z opisu commitu 08ba9f38d, nieodtwarzane ponownie w r2; (d) pozostały dług: ai.ts/pickBonusCityHex, domyślny udział lądu (`playable.rs`), `generateMap`.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2 (ten sam ID), następnie Final Control.
DEPLOY-PUSH: NIE WYKONANO
