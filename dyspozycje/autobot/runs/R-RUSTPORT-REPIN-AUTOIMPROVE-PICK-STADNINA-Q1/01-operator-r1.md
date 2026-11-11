STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-AUTOIMPROVE-PICK-STADNINA-Q1
GOAL: runda 3/5 (DODATEK 2): klasyfikacja 947 niezgodności, port D2/D3, `p6_8i_pick` 0 failed, jeden pin cffe39cb9, 4 scenariusze, M16 `droga`, bramki.
BAZA: kod operatora a535debbb + merge origin/rust-port/parity-v2 (cd7145e23), bez konfliktów. Web = cffe39cb9. (Plik nazwany 01-operator-r1.md wg dispatchu; to jest RUNDA 3/5.)
MODEL: Sonnet 5.5 (uzasadnienie w DODATKU 2).
ZMIANY/COMMIT: SHA w sekcji końcowej (commit na gałęzi `pick-r3` worktree). Pliki: auto_improvements/pick.rs (kaskada etapów + sonda bez miast 0%), city_phases.rs (bydło poza rzeką), auto_improvements.rs + improvement_build.rs (stała STADNINA_FREE_FROM_ERA), tests/p6_8i_pick.rs (SHARD/NAMES), p6_8i_relief, p6_repin_autoimpr_terrain (+dług łodzie 6/6/6), p6_m16_qualifier (droga odblokowana), p6_m16_gallery/rules/common (pin), wektory relief/terrain/gate/roadplan/qualifier regenerowane z weba cffe39cb9, dyspozycje/rust-port/p6/P6-REPIN-AUTOIMPROVE-PICK.md, runs/.../tools (skrypty klasyfikacji i generatory).
KLASYFIKACJA 947 (ablacja, tools/classify/): D2 bydło/pastwiska (web a4396c3d8) 835 zależnych; D3a kaskada etapów (web 9420ae1da, sprawca cf236dafc) 279; D3b sonda pomija miasta 0% (a4396c3d8) 11; wyłącznie: B 662, A+B 167, A 107, C 5, A+B+C 5, B+C 1 = 947. Baseline odtworzony dokładnie (947).
TESTY:
- p6_8i_pick: 5 passed, 0 failed (pełny 551 s; partie SHARD 0/2 209 s i 1/2 185 s) — 5128 scenariuszy zgodnych, w tym rnd-961, ra-rnd-1, ra-rnd-24, ra-rnd-247.
- Pin: jeden `cffe39cb9` w p6_8i_pick/relief/terrain(gate,roadplan)/m16_*; `grep 180c08305` w tych plikach: 0.
- M16 droga: SUPERSEDED_KEY usunięty; qualifier.json z cffe39cb9 (482 wpisy droga vs 502); p6_m16_* zielone (qualifier 4, gallery 2, rules 15, tables 5, doc 1, divergence 1).
- fmt --check OK; clippy --all-targets -D warnings OK.
- Pełny cargo test --no-fail-fast partiami: lib + 348 binarek (bez pick) = 2564 passed, 0 failed, 1 ignored (istniejący generator e2e::dump_tick1_econ_for_web_generator); + pick 5 passed. Brak nowych #[ignore].
BLOKADY: brak.
ZAŁOŻENIA/DŁUG:
1. Łodzie rybackie 6/6/6 (web FISHING-BOATS): data/terrain-improvements.json poza allowlistą i zmiana łamała economy_city_vectors_r3/r4 i p6_23 (pin starszy) — dane Rust bez zmian; w p6_repin_autoimpr_terrain pominięto 81 przypadków `lodzie_rybackie` (17+51+13, wymuszone assert_eq). Osobny temat REPIN ekonomii.
2. Stała STADNINA_FREE_FROM_ERA przeniesiona do auto_improvements.rs (r2 wprowadził literał 3.0 w improvement_build.rs i łamał p6_m16_tables::improvement_build_has_no_balance_number_literals); re-eksport w improvement_build.rs.
3. P6_8I_SHARD/P6_8I_NAMES dodane do testu pick (narzędzia; asercje bez zmian poza warunkiem nonempty dla trybów filtrowanych jak dotąd dla P6_8I_ONLY).
4. p6_m16_doc.rs cytuje inwentarz z edb8fb56 w komentarzu (test zielony).
5. Wektory generowane z `git archive cffe39cb9 gra/src gra/data` poza repo (Node 22, --experimental-transform-types, bez esbuild).
RUNDY: 3/5; poprzednie: r1 FAIL (pomiar), r2 FAIL (947 niezgodnych).
NASTĘPNY KROK: Evaluator (Sonnet) -> Final Control; po PASS integracja do parity-v2 (kod na a535debbb+cd7145e23 jest już zmergowany). Osobno: REPIN ekonomii (łodzie 6/6/6).
DEPLOY/PUSH: NIE WYKONANO
