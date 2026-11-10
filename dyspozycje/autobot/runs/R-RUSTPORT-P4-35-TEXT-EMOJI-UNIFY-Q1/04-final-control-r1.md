STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-35-TEXT-EMOJI-UNIFY-Q1
GOAL: RR-T8f — jedna ścieżka tekstu (`Canvas2dLite::fill_text`/`stroke_text`/`measure_text` same wybierają glif: emoji kolorowe Noto, ⚔ ☠ ◆ mono DejaVu, fallback per glif, alfa stylu mnoży glif kolorowy), `measureText().width` mieszanych bit w bit vs Chromium 141, zero zmian istniejących wyników.

ZMIANY/COMMIT:
- `origin/rust-port/parity-v2` przesunął się od oceny Evaluatora: `51a62a89` → `ba5dca73` (zintegrowany P4.34, `labels/**`, który woła `emoji::fill_text`/`glyph_source`/`color_advance`). Final Control odtworzył łańcuch na aktualnym tipie (cherry-pick bez konfliktów):
  1. `88c5b184` = Operator `35e8ab7b`,
  2. `ea5dad49` = Obrona `0f40cf74`,
  3. ten raport (commit na `ea5dad49`).
- Kolejność integracji: `ba5dca73` → `88c5b184` → `ea5dad49` → raport FC (fast-forward).
- Allowlista: zmiany Obrony tylko w `emoji.rs` (komentarz), `tests/textmix_chromium.rs`, `tests/fixtures/textmix/**`, `P4-35-TEXT-EMOJI-UNIFY.md`, `runs/<ID>/**`. Zero zmian w `Cargo.*`, `lib.rs`, `labels/**`, `overlay/**`.

TESTY (Final Control, samodzielnie, na `ea5dad49`; osobny `CARGO_TARGET_DIR`, `CARGO_INCREMENTAL=0`, bez debuginfo — mało miejsca na dysku):

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT=0 |
| `cargo clippy --locked --all-targets -- -D warnings` | EXIT=0 |
| `cargo clippy --locked --all-targets --features gpu -- -D warnings` | EXIT=0 |
| `cargo test --locked --all-targets` (rustc 1.97.0) | EXIT=0, 382/0 (360 tematu + testy P4.34 `labels_*`) |
| `cargo +1.87.0 test --locked --all-targets` | EXIT=0, 382/0 |
| `git diff --check HEAD~2 HEAD` | EXIT=0 |

- Testy `labels_anchors` 8/0, `labels_layout` 7/0, `labels_scenes` 4/0 przechodzą na nowej ścieżce — złote wyniki P4.34 bez zmian.
- Wektory względem weba: ponowny przebieg `tests/fixtures/textmix/gen.mjs` (Chromium 141.0.7390.37, kopia poza repo) → `scenes=18 widths=308 baselines=144 probes=7`, `diff -r` z repo EXIT=0 (wszystkie `ref/*.rgba`, w tym `aa_*`, `widths.tsv`, `baselines.tsv`, `probes.tsv`, `MANIFEST.sha256` bit w bit).
- `dowody/09-chromium-gradient-probe.mjs` uruchomiony samodzielnie: `fill_grad_*` i `stroke_grad_0.5` = `275383 153154 49813 247556` = `fill_opaque` (pełna alfa glifu kolorowego przy gradiencie).
- Mutacja FC-M1 (`emoji.rs:521` `unwrap_or(1.0)` → `unwrap_or(0.5)`): ZABITA — `fill_grad_alpha_0.5 channel 3: rust 124291 chromium 247556`, EXIT=101. Drzewo przywrócone.

ORZECZENIA:
1. Zarzut 1 (`m01`/`m15` poza progami) — ODDAL. Odchylenie jawnie opisane (P4-35 §5.2), granice = pomiar zaokrąglony na zewnątrz, przyczyna zmierzona kontrolami AA (jasny tekst na przezroczystym płótnie, z emoji i bez; ten sam tekst ciemny lub na nieprzezroczystym tle mieści się w progach), istniało przed zmianą (hash `m15` bazy = nowy). Dispatch dopuszcza „jawnie opisane odchylenie”; precedens `t14`. Nie jest to decyzja produktowa. Uwaga dla orkiestratora: AA jasnego tekstu RR-T8b jako ewentualny osobny temat.
2. Zarzut 2 (cytat, niezmierzona przyczyna) — ODDAL (naprawione): cytat P4-29 §5.2 `:161` zgodny z plikiem, teza o T14 usunięta, pomiar w teście i fixturach odtworzonych przez FC.
3. Zarzut 3 (gradient a glif kolorowy) — ODDAL (naprawione): zachowanie zmierzone w Chromium, test zabija E5 i FC-M1; `strokeStyle` gradient bez setera w API → ZAŁOŻENIE Z-35-7, pomiar powtórzony przez FC.

BLOKADY: brak. Do decyzji orkiestratora (nieblokujące): migracja 4 wywołujących + `#[deprecated]` (Z-35-1), 3 niewyjaśnione odchylenia szerokości RR-T8c.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (`ea5dad49` + raport FC na `origin/rust-port/parity-v2` @ `ba5dca73`, fast-forward), potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
