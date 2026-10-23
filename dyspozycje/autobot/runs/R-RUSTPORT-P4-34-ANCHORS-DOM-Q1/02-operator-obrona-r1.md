STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-34-ANCHORS-DOM-Q1
GOAL: RR-T8e (P4-25 §2.3/§6) — etykiety DOM R4/R5/R15a/R15b rysowane przez Rust na `Canvas2dLite` + wspólny float label, zweryfikowane z Chromium 141 na prawdziwym DOM/CSS weba. Ta runda: obrona Operatora wobec 2 zarzutów Evaluatora (PASS-WITH-NOTES).
ZMIANY/COMMIT: commit obrony na `27090d91` (rodzic) w worktree `wf_c43cd53a-064-3` — SHA w `git log` i w odpowiedzi Operatora dla orkiestratora; bez push. Pliki (allowlista): `src/labels/{anchor,mod,style}.rs`, `tests/labels_anchors.rs`, `tests/labels_scenes.rs` (komentarz), `tests/fixtures/labels/{gen.mjs,consts.tsv,MANIFEST.sha256}`, `dyspozycje/rust-port/p4/P4-34-ANCHORS-DOM.md` (§4, §7, §11), ten raport, `dowody/12-obrona-*`. Bez zmian w Cargo.toml/lock, `lib.rs`, `gra/**`, `ref/*.rgba`.
TESTY: `dowody/12-obrona-gates.log` — fmt, clippy (bez/z `gpu`), `cargo test --locked --all-targets`, `cargo +1.87.0 test` (`labels_layout/scenes/anchors`): wszystkie `EXIT=0`, 49× `test result: ok`, 0 FAILED. `gen.mjs` uruchomiony ponownie (Chromium 141.0.7390.37, three 0.169.0, `dowody/12-obrona-gen.log`): zmienione tylko `gen.mjs`/`consts.tsv`/`MANIFEST.sha256`; wszystkie referencje pikselowe i `*.tsv` poza `consts.tsv` bitowo identyczne; `sha256sum -c` 61/61. Mutacje obrony 2/2 zabite (`dowody/12-obrona-mutacje.log`).
BLOKADY: brak. Dysk współdzielony bliski zapełnienia (2,6 GB wolne po bramkach; katalogi target w scratch usunięte).
RUNDY: 1/5 (obrona po werdykcie Evaluatora PASS-WITH-NOTES)
NASTĘPNY KROK: Final Control R-RUSTPORT-P4-34-ANCHORS-DOM-Q1.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

1. **R15a kotwica nie jako dane; stałe `*_LIFT_Y` nieużywane — PRZYJMUJĘ.**
   - `style.rs`: `R15A_HPBAR_Y = 0.72` (`battleScene.ts:978`), `R15A_LIFT = 0.20` (`battleScene.ts:9115`).
   - `anchor.rs`: `r4_anchor_world`, `r5_anchor_world`, `r15a_anchor_world`, `r15b_anchor_world` — używają `R4_LIFT_Y`, `R5_LIFT_Y`, `R15A_HPBAR_Y + R15A_LIFT`, `R15B_WORLD_Y` (kolejność sumowania jak w JS).
   - `gen.mjs` wycina z pinu wyrażenia wysokości (`unitRenderer.topYAt(q, r) + liftY`, `topY + 1.1`, `wpTopY + HPBAR_Y + 0.20`, `3.2`) i liczy je na 5 wysokościach kafla → `consts.tsv` `anchor_y` (20 wierszy) + `r15a_hpbar_y`, `r15a_lift`.
   - Testy: `anchor_heights_match_the_web` (bitowo, 4×5), `constants_are_the_webs` (+2 asercje), `float_label_frames_match_tick_float_labels` sprawdza teraz, że y kotwicy fixtury (R15a 1.95 = wyrażenie weba na kafelku 1.03, bitowo; R15b 3.2) = funkcja kotwicy.
   - Dowód: mutacja O1 (`a + (b + c)`) → `anchor_heights_match_the_web` FAILED.
2. **`golden.tsv` poza `MANIFEST.sha256` — PRZYJMUJĘ (wariant: dodanie do manifestu + notka w P4-34 §7).**
   - `gen.mjs` dopisuje `golden.tsv` do manifestu, gdy plik istnieje; usunięty wyjątek w `fixtures_match_manifest_sha256`; komentarz w `labels_scenes.rs` opisuje procedurę ponownego „bless” (aktualizacja linii manifestu).
   - Dowód: mutacja O2 (zmieniony `golden.tsv`) → `fixtures_match_manifest_sha256` FAILED; bez mutacji 61/61 OK.
