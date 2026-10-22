STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-28-RASTER-SHAPES-Q1
GOAL: RR-T8a, rasteryzator kształtów `raster::Canvas2dLite` na tiny-skia (D-TXT-6 = A). Ma obejmować wyłącznie te wywołania `ctx.*`, których web faktycznie używa.
ZMIANY/COMMIT: ocena commitu Operatora `5baad8ae` (baza `9ec9c9d8`). Evaluator dopisuje tylko ten plik.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Co sprawdziłem (Evaluator, Opus 5.5 medium, worktree `wf_99676387-673-2`, detached `5baad8ae`)

- **Allowlista:** `git diff --name-only 9ec9c9d8 5baad8ae` daje 71 plików. Poza `raster/**`, `tests/raster_*`, `fixtures/raster/**`, dokumentem i runem zmieniły się tylko `Cargo.toml` (tiny-skia `=0.12.0`, `default-features=false`, `std`), `Cargo.lock` (+4 pakiety: tiny-skia, tiny-skia-path, strict-num, arrayref; reszta drzewa już w locku) i `src/lib.rs` (+1 linia `pub mod raster;`). `#![forbid(unsafe_code)]` jest w `lib.rs:24`, a w `src/raster` nie ma `unsafe`. Fixtury zajmują 5,3 MB. `git merge-tree` z aktualnym `origin/rust-port/parity-v2` (`a29c1657`) przechodzi czysto.
- **Inwentarz `ctx.*`:** policzyłem sam przez `git grep -ohE '\bctx\.[a-zA-Z]+\b *[(=]?' edb8fb56 -- gra/src/render gra/src/battle`. Wyszło 34 członków (bez pól `ctx.era/civId/isCityState/isBarbarian/city` innego obiektu), czyli tyle samo co P4-25 §4.1. Po odjęciu 6 tekstowych zostaje 28, plus `grad.addColorStop` 5×. `ctx.scale` i `ctx.lineCap` mają 0 trafień, więc Z-28-2 jest potwierdzone. Każdy z 28 członków ma metodę w `canvas.rs` i występuje jako op w `scenes.tsv` (policzone przez `awk`), a większość ma też test w `raster_unit.rs`. Wyjątek: zarzut 2. Sprawdziłem 17 cytowań `plik:linia` z `CANVAS_MEMBERS` i wszystkie trafiają we właściwe wywołanie.
- **Bramki w czystych targetach** (`scratchpad/t197`, `scratchpad/t187`):
  - `cargo fmt --all -- --check`: EXIT=0.
  - `clippy --locked --all-targets -D warnings` bez `gpu` i z `gpu`: EXIT=0.
  - `cargo test --locked --all-targets` na 1.97.0: EXIT=0, 207 passed / 0 failed.
  - `cargo +1.87.0 test --locked --all-targets`: EXIT=0, 207/0. Build tiny-skia 0.12.0 na 1.87.0 przechodzi.
- **Determinizm:** `raster_scenes` z `--release` przeszło 2× na 1.97 i 1× na 1.87. Złote hashe 46/46 są zgodne, a debug na obu toolchainach też przeszedł.
- **Regeneracja referencji:** uruchomiłem `node gen.mjs` (Chromium 141.0.7390.37). EXIT=0, a `git status` jest czysty, czyli `ref/*.rgba`, `colors.tsv`, `scenes.tsv` i `MANIFEST.sha256` odtworzyły się bit w bit. `sha256sum -c MANIFEST.sha256` daje OK dla wszystkich 49 plików.
- **Wierność transkrypcji:** porównałem T4 (`units.ts:6319-6354` z `gen.mjs:523-546`) linia po linii i jest identyczna. Rejestrator `Rec` daje jeden op-list, który wykonują obie strony.
- **Metryka vs Chromium:** zrobiłem własne mutacje i uruchamiałem tylko `scenes_match_chromium`, czyli bez złotych hashy:

| mutacja | wynik |
|---|---|
| σ = blur | WYKRYTA (x_shadow_*) |
| lineWidth ×1,25 | WYKRYTA (prawie wszystkie sceny) |
| promień arc +0,5 | WYKRYTA (≥18 scen) |
| drawImage nearest | WYKRYTA (3 sceny) |
| kanał R w `#rrggbb` XOR 6 | WYKRYTA (2 sceny, a `raster_color` 3 testy) |
| clip wyłączony | WYKRYTA (3 sceny) |

  Metryka działa i wykrywa różnice. Pliki przywrócone, a `git status` jest czysty.
- **Parser CSS:** formy użyte w pinie to `#rrggbb`, `rgba(,)` ze spacjami i bez, `rgb(, )`, `transparent`, wynik `hexToRgba`/`badgeColorCss`, a `hsl` nie występuje. Wszystkie są w `colors.tsv` i są akceptowane. Kolory nieprzezroczyste zgadzają się bit w bit.
- **Mutacje Operatora:** tabela 20/20 w dokumencie §7 jest spójna z kodem. Logu nie da się zweryfikować z commitu (zarzut 1).

## ZARZUTY

1. **Dowody surowe nie trafiły do commitu.** Dokument (§0, §5.2, §6, §6.1, §7) i raport powołują się na `dowody/01-fmt.log`, `02-clippy.log`, `03-test-stable.log`, `04-test-msrv-1.87.log`, `05-determinism.log`, `06-chromium-refs-repro.log`, `07-raster-tests-nocapture.log`, `08-mutations.log` i `09-final-gates.log`. Żadnego z nich nie ma w `5baad8ae`, bo `.gitignore:20` ma `*.log` (`git check-ignore -v`), więc w commicie są tylko skrypty `.sh`/`.py`. Dispatch wymaga „pełnych surowych logów z `echo "EXIT=$?"` w dokumencie”, a dokument zawiera jedynie streszczenie EXIT. Po sprzątnięciu worktree Operatora dowody znikną. Naprawa: zapisać logi jako `.txt` (albo wkleić je do dokumentu) i zaktualizować odwołania.
2. **`set_stroke_style_gradient` wykracza poza zakres i nie ma testu.** W pinie `strokeStyle` nigdy nie dostaje gradientu (`git grep 'ctx.strokeStyle = <ident>'`: tylko `pal.stroke`, `RING_COLOR`, `badgeColorCss`, `workerOwnerColorRgba`, `hexToRgba`, `CAPITAL_*`, `PLATE_BORDER_CSS`). Sam `CANVAS_MEMBERS` przyznaje: „(same IDL slot; not called today)”. Dispatch mówi „WYŁĄCZNIE wywołania faktycznie użyte”. Metody nie wywołuje żadna scena (`strokeGrad` 0 w `scenes.tsv`) ani żaden test w `raster_unit.rs`, a przy tym wymóg „każde ma implementację i test” nie jest spełniony. Naprawa: usunąć metodę (i op `strokeGrad` z harnessu/`Rec`) albo dodać ją do `FORBIDDEN`.
3. **Komentarz `draw_image` przeczy implementacji.** `canvas.rs:565-566` mówi „anti-aliased destination edges”, a kod ustawia `anti_alias: false` (`canvas.rs:595`). Dokument §3.2 opisuje to poprawnie, zgodnie z pomiarem („krawędzie celu bez AA”). Naprawa: poprawić doc-comment.
4. **Niespójna liczba testów w dokumencie.** §1 (tabela) podaje „`tests/raster_unit.rs`, 29 testów”, a §6 i stan faktyczny to 32 (`grep -c '#\[test\]'`). Naprawa: ujednolicić na 32.
5. **Metryka ma test tylko dla obrazów identycznych.** `metric.rs` sprawdza jedynie `identical_images` i `premultiply_rounds`. Nie ma testu, że różne obrazy dają SSIM < 1, `mean_abs` > 0 i poprawny `frac_px_over_16` na znanym przykładzie. Czułość metryki jest dziś dowiedziona tylko pośrednio przez mutacje, które nie zostają w repo jako test. Naprawa: dodać test jednostkowy na znanej różnicy, np. obraz przesunięty o 1 px albo jeden piksel różny o 17, z oczekiwanymi wartościami.

## Uwagi (nie blokują)

- U1: scena H1 używa syntetycznych kolorów jednostek `#e53935`/`#1e88e5`. Prawdziwe to `BATTLE_PLAYER '#3a6ad0'` / `BATTLE_ENEMY '#c84040'` (`battleHudTheme.ts:17,22`, `battleScene.ts:11037`). Format i tak jest pokryty, a H1 zostaje w DOM (Z-1). Warto to oznaczyć w źródle sceny.
- U2: `clippy` na 1.87.0 nie jest zmierzony. Nie jest to bramka dispatchu.

NASTĘPNY KROK: Operator, runda 2/5, ten sam ID. Do naprawy zarzuty 1–5, potem ponowna ocena Evaluatora.
