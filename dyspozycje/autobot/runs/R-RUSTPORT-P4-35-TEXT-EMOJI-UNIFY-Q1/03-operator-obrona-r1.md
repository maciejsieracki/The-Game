STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-35-TEXT-EMOJI-UNIFY-Q1
GOAL: RR-T8f — jedna ścieżka tekstu: `Canvas2dLite::fill_text`/`stroke_text`/`measure_text` same wybierają glif (emoji kolorowe Noto, ⚔ ☠ ◆ mono DejaVu, fallback per glif, alfa stylu mnoży glif kolorowy), `measureText().width` mieszanych napisów bit w bit vs Chromium 141, zero zmian istniejących wyników.

## Odpowiedzi na zarzuty Evaluatora r1 (`02-evaluator-r1.md`, commit `e146cace`)

Stan odtworzony z commita Operatora `35e8ab7b` (rodzic `33300688`), worktree odizolowany.

### Zarzut 1 — `m01`/`m15` poza progami dispatchu — PRZYJMUJĘ jako punkt do decyzji orkiestratora (bez zmian w kodzie, zgodnie z Evaluatorem)
Wartości i granice `EXCEPTIONS` bez zmian. Obrona dokłada pomiar lokalizujący przyczynę (zarzut 2), który orkiestrator może wziąć pod uwagę: odchylenie występuje tylko dla jasnego tekstu na przezroczystym płótnie, niezależnie od glifów kolorowych.

### Zarzut 2 — złe źródło i niezmierzona przyczyna — PRZYJMUJĘ
- Cytat poprawiony: P4-29 **§5.2** (`P4-29-TEXT-FONTS.md:161`), nie §5.3 (hinting) — w `P4-35-TEXT-EMOJI-UNIFY.md` §5.2 i w komentarzu `EXCEPTIONS` (`tests/textmix_chromium.rs`).
- Teza o tłach T14 usunięta; przyczyna **zmierzona**: 8 kontroli Chromium (`gen.mjs` `aaScenes` → `ref/aa_*.rgba`) — napis `m15` i `m01`, ten sam font, jasny vs `#101010`, przezroczyste vs nieprzezroczyste tło. Nowy test `textmix_aa_controls_localise_the_m01_m15_exception`:
  - jasny na przezroczystym: masa alfa Chromium/nasza **1,0628** (`m15`), 1,0512 (`m01`) — Chromium rysuje jasny tekst grubiej;
  - ciemny na przezroczystym: 0,9958 / 0,9907, **w progach** (SSIM 0,9959 / 0,9949, mean 0,53 / 0,55);
  - oba kolory na tle nieprzezroczystym: w progach (SSIM 0,992–0,995, mean 1,00–1,14).
- Sprzeczność z P4-29 wyjaśniona w dokumencie: P4-29 mierzył inne napisy; kierunek względny jest ten sam (pokrycie Chromium rośnie z jasnością koloru względem nas: tam +20,7 pp, tu +6,7 pp). Mechanizm Skii — NIE_ZMIERZONO.
- Usunięte też własne, niesprawdzone zdanie o miejscu rysowania w grze: `cityOkolicaOverlay.ts:138-142` rysuje tym fontem tylko 👤 na kółku plakietki (`:133-136`) — sprawdzone `git show edb8fb56:gra/src/render/cityOkolicaOverlay.ts | sed -n 130,145p`.

### Zarzut 3 — gradient a glif kolorowy — PRZYJMUJĘ (zmierzone + test)
- Chromium 141, `fillStyle` = gradient liniowy z alfą 0,5 i z alfą 0 we wszystkich stopach: sumy RGBA **identyczne** z `fill_opaque` (275383 153154 49813 247556) → glif kolorowy z pełną alfą. Kod (`unwrap_or(1.0)`) był zgodny, ale niezabezpieczony.
- `probes.tsv`: +2 próby (`fill_grad_alpha_0.5`, `fill_grad_alpha_0`); `textmix_stroke_probe_matches_chromium` sprawdza je (Chromium: równość z `fill_opaque`; Rust: równość bitowa z naszym `fill_opaque`, ≤ 3 % vs Chromium).
- **Mutacja E5 zabita**: `fill_grad_alpha_0.5 channel 0: rust 0 chromium 275383` (`dowody/09-obrona-r1.log`).
- `strokeStyle` = gradient: zmierzone w Chromium (`dowody/09-chromium-gradient-probe.mjs`, wynik w logu — też pełna alfa), ale nieosiągalne przez API `Canvas2dLite` (brak setera gradientu obrysu; tylko `set_fill_style_gradient`, `raster/canvas.rs:308`) — ZAŁOŻENIE Z-35-7 w §10.
- Komentarz `draw_mixed` (`emoji.rs`) uzupełniony o regułę gradientu (tylko dokumentacja).

## Zmiany (allowlista)
`rust-port/renderer/src/raster/image/emoji.rs` (tylko komentarz), `tests/textmix_chromium.rs`, `tests/fixtures/textmix/{gen.mjs, probes.tsv, MANIFEST.sha256, ref/aa_*.rgba ×8}`, `dyspozycje/rust-port/p4/P4-35-TEXT-EMOJI-UNIFY.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-35-TEXT-EMOJI-UNIFY-Q1/{03-operator-obrona-r1.md, dowody/09-*}`. Ponowny `gen.mjs`: wszystkie dotychczasowe `ref/*.rgba`, `scenes.tsv`, `widths.tsv`, `baselines.tsv` — sha256 bez zmian (diff `MANIFEST.sha256`: tylko `gen.mjs`, `probes.tsv` i 8 nowych wpisów `aa_*`). Fixtury 804 661 B (≤ 4 MB). Kod produkcyjny bez zmian zachowania; `golden.tsv` bez re-blessu; `Cargo.*`, `lib.rs`, `labels/**`, `overlay/**` nietknięte.

## Testy (`dowody/09-obrona-r1.{sh,log}`, surowe logi z EXIT; `CARGO_INCREMENTAL=0`, bez debuginfo — dysk)
| krok | wynik |
|---|---|
| Chromium: gradient `fillStyle` (alfa 1 / 0,5 / 0→1 / 0) i `strokeStyle` (alfa 0,5) vs `fill_opaque` | sumy identyczne (275383 153154 49813 247556), EXIT=0 |
| `gen.mjs` w kopii poza repo → `MANIFEST.sha256` | DIFF_EXIT=0 |
| `textmix_chromium` + `textmix_manifest` (nocapture) | EXIT=0, 8/8 |
| mutacja E5 (`unwrap_or(0.0)`) | **zabita**: EXIT=101, `fill_grad_alpha_0.5 channel 0: rust 0 chromium 275383` |
| `cargo fmt --all -- --check` | EXIT=0 |
| `cargo clippy --locked --all-targets -- -D warnings` | EXIT=0 |
| `cargo clippy --locked --all-targets --features gpu -- -D warnings` | EXIT=0 |
| `cargo test --locked --all-targets` stable 1.97.0 | EXIT=0, 360/0 (było 359 + nowy test AA) |
| `cargo +1.87.0 test --locked --all-targets` | EXIT=0, 360/0 |
| złote hashe textmix stable vs 1.87.0 | sha256 `312d1543…7e7d` identyczny (= r1, bez re-blessu) |
| `git diff --check` | EXIT=0 |

Log uruchomiono na brudnym drzewie przed commitem (nagłówek pokazuje HEAD `35e8ab7b` + zmiany obrony).

BLOKADY: brak nowych. Do decyzji orkiestratora (bez zmian): wyjątki `m01`/`m15` (zarzut 1, teraz z pomiarem przyczyny); migracja 4 wywołujących + `#[deprecated]`; 3 odchylenia szerokości RR-T8c.
RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: Evaluator (Opus 5.5 medium) — weryfikacja obrony; zarzut 1 do orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
