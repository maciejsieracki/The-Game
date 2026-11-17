# R-RUSTPORT-P4-1Q6-2-BUILD-HIGHLIGHT-PARITY-R1 — Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1Q6-2-BUILD-HIGHLIGHT-PARITY-R1
GOAL: przy aktywnym trybie budowy z PUSTYM zbiorem heksów producent nakładek (`build_highlight`, `unit_overlays_view`) zwraca to samo co web (pin `07d2fbd72`), bez zmiany pozostałych trybów.

## Obiekt oceny

- Commit Operatora: `4f520783c` (gałąź `rust-port-wip/p4-1q6-2-build-highlight-r1`), jeden commit nad bazą.
- Baza z dispatchu: `326fd5545` (= `origin/rust-port/parity-v2`). `git merge-base --is-ancestor 326fd5545 4f520783c` = prawda.
- `git diff --stat 326fd5545 4f520783c`: 5 plików, wszystkie z allowlisty:
  `engine/src/domain/overlays_view.rs` (+32/-7), `engine/tests/p4_1q6_2_build_highlight.rs` (nowy),
  `engine/tests/p4_1q6_2_gen.mjs` (nowy), `engine/tests/p4_1q6_2_vectors/vectors.json` (nowy),
  `runs/.../01-operator-r1.md`. Brak `Cargo.lock`, renderera i view-modelu. Commit bez `Co-Authored-By` (#289).
- W diffie brak `#[ignore]`, `should_panic` i usuniętych asercji (`grep '^-.*assert'` = 0 trafień).

## Weryfikacja pinu (czytane samodzielnie, `git show 07d2fbd72:gra/src/main.ts`)

- `refreshBuildHighlight` `:16351-16396`: `foundCityMode` -> `unitRenderer.setHighlight(qual)` (`:16359`); `activeWonderId` -> `setHighlight(new Set(...))` (`:16366`); brak trybu (`!buildModeOpen || !activeImprovementKey || !buildApi`) -> `clearHighlight()` (`:16369-16373`); kopalnia -> `clearHighlight()` + `refreshMineEligibleOverlay(hexes)` (`:16386-16389`); ulepszenie -> `setHighlight(hexes, IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)` (`:16392-16395`).
- `syncPlayerUnitSelectionOnMap` `:7115-7135`: zasięg = `unitRenderer.setHighlight(reachable)` (`:7123-7125`), czyli ta sama jedna warstwa.
- Wniosek Operatora jest poprawny: w każdej z trzech gałęzi aktywnego trybu budowy warstwa zasięgu znika niezależnie od liczby heksów. `build_highlight_mode_active` = `found_city_mode || wonder_active || (build_mode_open && klucz niepusty)` odpowiada zaprzeczeniu warunku `:16369` (bez `buildApi`, którego Rust nie modeluje, zgodnie z F6).
- Refaktor `build_highlight` (`match` z guardem) daje to samo co poprzednie dwa `return no_layer()` (klucz `None`/pusty albo `!build_mode_open`), bo found/wonder wychodzą wcześniej.

## Bramki odtworzone (worktree Evaluatora, detached `4f520783c`; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (engine) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (engine) | EXIT 0 |
| `cargo test --test p4_1q6_2_build_highlight` | EXIT 0; 5 passed, 0 failed, 0 ignored |
| `cargo test --all-targets --no-fail-fast` (engine) | EXIT 0; 524 binarek, 3907 passed, 0 failed, 1 ignored (ignored poza tym tematem; diff nie dodaje `#[ignore]`) |
| Generator `node rust-port/engine/tests/p4_1q6_2_gen.mjs` (Node 22.23.4) | 12 wektorów, SHA-256 fragmentów `b2ccd939…899b`; `vectors.json` po regeneracji bajtowo identyczny (`git status` czysty) |
| Bramka renderera | nie uruchamiana (dispatch); `unit_overlays_view` / `build_highlight_mode_active` nie mają wołających poza engine (grep w `rust-port`) |

## Mutacje (własne, plik przywrócony po każdej, `cmp` = identyczny)

| Mutacja | Wynik |
|---|---|
| (a) wygaszanie zasięgu tylko przy niepustym zbiorze budowy | FAIL: `q6_2_pusty_zbior_budowy_wygasza_zasieg`, `q6_2_wektory_pinu_warstwa_podswietlenia` |
| (b) kopalnia zwraca `no_layer()` (czyści podświetlenie budowy) | FAIL: 3 testy, w tym `q6_2_kopalnia_zachowuje_heksy_budowy` |
| (c) zwykły tryb ruchu `Vec::new()` zamiast `reachable_overlay` | FAIL: `q6_2_tryb_ruchu_zachowuje_zasieg`, `q6_2_wektory_pinu_warstwa_podswietlenia` |
| (d, dodatkowa) usunięty `wonder_active` z warunku trybu | FAIL: 3 testy (tabela, pusty zbiór, wektory) |
| (e, dodatkowa) usunięty `found_city_mode` z warunku trybu | FAIL: 3 testy (tabela, pusty zbiór, wektory) |

## Zarzuty / uwagi (nieblokujące)

1. Gałąź `buildModeOpen && brak klucza` (np. po `onSelectWonder(null)` albo odznaczeniu cudu, `main.ts:26775-26793`, gdzie `buildModeOpen` zostaje `true`): web woła `clearHighlight()`, a producent zwraca `reachable_overlay(state)`. Parytet zależy od tego, że wołający wyczyści zaznaczenie przy otwarciu budowy (`onOpenBuild` -> `clearPlayerUnitSelection()`, `:26702-26703`). Operator to jawnie zapisał (BLOKADY p. 3), test wyklucza ten przypadek asercją. Kontrakt musi trafić do tematu DTO-BRIDGE (#308/#364).
2. `layer_of` w teście przepisuje regułę adaptera renderera (`unit_highlight`, `mine_eligible_group`); rozjazd adaptera i kopii wykryje dopiero test po stronie renderera (BLOKADY p. 2, osobny temat).
3. Komentarz „KNOWN DIVERGENCE of Q6-2” w `rust-port/renderer/src/view/units.rs` jest po zmianie nieaktualny (poza allowlistą, osobny temat dokumentacyjny).
4. Wektory używają jednego stanu (korytarz 4 heksów, jednostka z zasięgiem niepustym), więc nie ma wektora z jednostką bez ruchu w trybie budowy. Wynik i tak jest pusty w obu gałęziach, więc to nie zmienia oceny.

## Werdykt

Zmiana jest poprawna wg pinu, mieści się w allowliście, wszystkie bramki są zielone, a mutacje (a)(b)(c) i dwie dodatkowe dają FAIL. PASS-WITH-NOTES ze względu na uwagi 1-3 (kontrakt wołającego i nieaktualny komentarz renderera, oba poza allowlistą).

ZMIANY/COMMIT: ocena `4f520783c`; Evaluator dodaje tylko ten plik.
TESTY: jak w tabelach wyżej.
BLOKADY: brak blokujących; uwagi 1-3 jako osobne tematy.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora / Final Control r1.
DEPLOY/PUSH: NIE WYKONANO
