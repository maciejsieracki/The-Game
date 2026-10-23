# P4-35 — RR-T8f: jedna ścieżka tekstu (tekst konturowy + kolorowe emoji)

TEMAT: `R-RUSTPORT-P4-35-TEXT-EMOJI-UNIFY-Q1` · DOMAIN: GAME · runda 1/5 · Operator (Opus 5.5 medium)
Baza kodu: `origin/rust-port/parity-v2` @ `33300688` (RR-T8a/b/c, atlas P4.31, `units::overlay` P4.32, `cities::overlay` P4.33 zintegrowane; P4.34 `labels/**` — **nie** zintegrowany: `git log --oneline origin/rust-port/parity-v2 | grep -c P4.34` = 0, katalogu `src/labels` brak).
Referencja: **Chromium 141.0.7390.37** (playwright 1.56.1, headless, `--disable-gpu --force-color-profile=srgb --font-render-hinting=none`) z **tymi samymi plikami fontów** co crate (D-TXT-5 = A, jak RR-T8a/b/c).
Dowody surowe (w commicie, `*.log` przez `git add -f`): `dyspozycje/autobot/runs/R-RUSTPORT-P4-35-TEXT-EMOJI-UNIFY-Q1/dowody/`.

Konwencja: `plik:linia` bez prefiksu = `gra/src/` w pinie `edb8fb56` (sprawdzane `git show edb8fb56:gra/src/<plik> | sed -n <linia>p`). `NIE_ZMIERZONO` = nie sprawdzone.

---

## 0. Streszczenie

1. **Z-30-4 domknięte.** `Canvas2dLite::fill_text` / `stroke_text` / `measure_text` (lista zamknięta RR-T8b, `tests/text_api_closed.rs` — bez zmian, 6 metod) same wybierają glif per znak regułą przeglądarki z P4-30 (D-TXT-2 fallback per znak, D-TXT-3: 👤 🔥 🍞 🔨 💰 + ikony R4 kolorowe z podzbioru Noto, ⚔ ☠ ◆ mono DejaVu w kolorze stylu, Z-7 alfa stylu mnoży glif kolorowy). Napis bez glifu kolorowego idzie **dokładnie** dotychczasowym potokiem RR-T8b; napis z glifem kolorowym — algorytmem RR-T8c przeniesionym za te metody.
2. Stare API RR-T8c `raster::image::emoji::{fill_text, measure_text}` zostało jako **cienka delegacja** (3 przypisania stanu + `ctx.fill_text`; scratch canvas + `ctx.measure_text`) — bez `#[deprecated]`, żeby nie dotykać wywołujących (§2.3). Wywołujące w `units/overlay/**` i `cities/overlay/**` — **bez zmian** (niekonieczne: ich złote hashe i porównania z Chromium bit w bit jak przed zmianą).
3. **Dwa nowe fakty zmierzone w Chromium 141** (i odtworzone): (a) linia bazowa napisu bez emoji też pochodzi z fontu **głównego** łańcucha — gdy stos zaczyna się od `"Noto Color Emoji"` (T13), cyfry „12” stoją na metrykach fontu emoji (144/144 bit w bit, §3.1); (b) `strokeText` rysuje glif kolorowy **wypełniony**, z alfą `strokeStyle` (`lineWidth` i `fillStyle` bez wpływu; §3.2).
4. **`measureText().width` napisów mieszanych: 308/308 bit w bit** (`to_bits`, 14 fontów weba × 22 napisy). Model: szerokości przebiegów w `f32` i akumulacja w `f32` (§4). Dotychczasowy model RR-T8c (suma `f64`) dawał 288/308 — 20 błędów, wszystkie > 256 px. RR-T8c `image/widths.tsv`: nadal 252/255 + te same 3 udokumentowane odchylenia.
5. **18 scen vs Chromium** (wyłącznie publiczne API `Canvas2dLite`): 16 w progach RR-T8a/b/c (SSIM ≥ 0,985, mean_abs ≤ 1,5, px>16 ≤ 5 %), najgorszy SSIM w progach 0,98565; **2 jawne wyjątki** z przyczyną w AA konturów RR-T8b, nie w RR-T8f — scena kontrolna **bez emoji** (`m15`, nietknięta gałąź RR-T8b) odstaje tak samo (§5.2).
6. **Niezmienność:** wszystkie istniejące testy zielone bez re-blessu — złote hashe RR-T8a (`raster/golden.tsv`), RR-T8b (`text/golden.tsv`), RR-T8c (`image/golden.tsv`), MOD-08 (`overlay`), MOD-10 (`cityoverlay`), progi i ślady rysowania. Dodatkowo 18 scen RR-T8c bez `drawImage` odtworzonych **przez `Canvas2dLite::fill_text`** (bez `emoji::*`) daje hashe **identyczne** z `image/golden.tsv` (§6).
7. Determinizm: złote hashe 18 scen + wszystkie istniejące identyczne na rustc **1.87.0 i stable 1.97.0** (§7). Generator uruchomiony dwukrotnie — referencje, szerokości, linie bazowe, próby identyczne (sha256).
8. Mutacje: **15/16 zabitych** (≥ 10 wymagane), 1 równoważna w praktyce, opisana (§9). Bramy: fmt / clippy / clippy `gpu` / test stable / test 1.87.0 (§8).
9. Zero nowych zależności, `Cargo.toml`/`Cargo.lock` nietknięte, `#![forbid(unsafe_code)]` bez zmian, `lib.rs` bez zmian (nowy moduł nie powstał), `labels/**`, `geom/pick/assets/camera/terrain/models/decor/core/jsmath/**`, `gra/**`, `src-tauri/**`, `engine/**` — nietknięte.

---

## 1. Zakres i wykonanie GOAL

| Wymóg dispatchu | Stan |
|---|---|
| `Canvas2dLite::fill_text`/`stroke_text`/`measure_text` same wybierają glif (D-TXT-3, Z-7) | `raster/text/mod.rs`: `draw_text` → `emoji::has_color_glyph` ? `emoji::draw_mixed` : potok RR-T8b; `measure_text` analogicznie (§2) |
| fallback per glif (D-TXT-2) | łańcuch `emoji::source_chain` (rodziny stosu → DejaVu Sans → podzbiór Noto), wybór per znak — bez zmian względem RR-T8c, teraz wewnątrz metod `Canvas2dLite` |
| poprawne `measureText().width` dla ciągów mieszanych | 308/308 bit w bit (§4) |
| złote hashe RR-T8a/b/c i MOD-08/10 bit w bit tam, gdzie nie ma emoji | wszystkie złote hashe bez zmian (także tam, gdzie emoji **są**) — §6, logi bram |
| tam, gdzie wołano `emoji::fill_text` — wynik identyczny z nową ścieżką | delegacja + test `image_text_scenes_through_canvas_fill_text_match_rr_t8c_golden` (18/18 hashy) + `emoji_measure_text_is_canvas_measure_text` (563/563 `to_bits`) — §6 |
| wywołujące tylko jeśli konieczne; stare API jako cienka delegacja albo `#[deprecated]` | wywołujące bez zmian; delegacja (§2.3) |
| testy mieszanych ciągów vs Chromium 141, generator jak RR-T8a–c, fonty z gry | `tests/fixtures/textmix/gen.mjs`, 18 scen, napisy typu „Zbrojmistrz ⚔ 12 ☠ 3 👤” w fontach weba (`plik:linia` w `gen.mjs` i kolumnie źródła `scenes.tsv`) — §5 |
| szerokości `measureText` bit w bit dla ciągów mieszanych | §4 |
| determinizm 1.87 vs najnowszy | §7 |
| mutacje ≥ 10 | §9 |
| brak nowych zależności | `git diff --stat` — `Cargo.*` nietknięte |

**ZAŁOŻENIE Z-35-0 (szablon dispatchu):** lista „przeczytaj OBOWIĄZKOWO” (P4-4, P4-3, P4-8, P4-11, P4-6) i wzorzec „esbuild/three, `scene` bez WebGL” to szablon tematów modelowych (jak Z-30-0 w P4-30). Merytorycznie wiążące dla tekstu są P4-25 §4, P4-29 (potok RR-T8b, §3.3 linie bazowe, §5 sceny) i P4-30 (§1 Z-30-4, §3 D-TXT-3, §4 emoji) — przeczytane; wzorzec weryfikacji = prawdziwy Chromium Canvas 2D (D-TXT-5 = A), jak RR-T8a/b/c. Plik `lib.rs` nie wymagał linii `pub mod` (żaden nowy moduł crate'a).

---

## 2. Architektura

### 2.1 Jedna ścieżka
`raster/text/mod.rs`:
- `measure_text(text)`: `emoji::has_color_glyph(font, text)` ? `emoji::mixed_width(font, text)` : `shape_text(font, text).width` (gałąź bez emoji = kod RR-T8b bez zmian).
- `fill_text` / `stroke_text` → prywatne `draw_text(text, x, y, TextPaint::{Fill,Stroke})`: niekończone `x`/`y` → nic; napis z glifem kolorowym → `emoji::draw_mixed`; w przeciwnym razie potok RR-T8b (`shape_text` → wyrównanie → `build_path` → `fill_device_path` / `stroke_device_path`) — jedyna zmiana: przesunięcie linii bazowej z `emoji::emoji_aware_baseline_shift` (font główny łańcucha, §3.1); dla każdego stosu, w którym pierwszą **rozpoznaną** rodziną (po mapowaniu RR-T8b) nie jest `"Noto Color Emoji"`, to ta sama funkcja RR-T8b `baseline_shift` (pierwsza twarz `source_chain` = `Text(pierwsza twarz face_chain)`, `emoji.rs` `source_chain` vs `text/fonts.rs` `face_chain`).
- `paint_outline_run` (crate-private): jeden przebieg konturowy napisu mieszanego, pióro na linii alfabetycznej — dokładnie to, co RR-T8c robił wywołaniem `ctx.fill_text(s, pen, base_y)` przy `textAlign = left`, `textBaseline = alphabetic` (bez przełączania stanu tam i z powrotem).
- `TextState::{font, align, baseline}` (crate-private gettery) i `TextPaint` (crate-private). Lista publicznych metod `impl Canvas2dLite` w `raster/text/` — bez zmian (6), `tests/text_api_closed.rs` zielony.

`raster/image/emoji.rs`:
- `has_color_glyph(spec, text)` — przełącznik: czy któryś znak (po przygotowaniu białych znaków) pochodzi z twarzy emoji; łańcuch budowany tylko, gdy znak w ogóle jest w podzbiorze Noto (koszt dla zwykłego tekstu: jedno wyszukiwanie `cmap` na znak).
- `mixed_width` (§4), `draw_mixed` — algorytm RR-T8c (`fill_text` z P4-30) przeniesiony: wyrównanie po całkowitej szerokości, jedna linia bazowa z fontu głównego, przebiegi konturowe przez `paint_outline_run` (wypełnione albo obrysowane), glify kolorowe jako bitmapy (`draw_color_glyph` bez zmian) z alfą `fillStyle` (`fillText`) albo `strokeStyle` (`strokeText`, §3.2).
- `pick_source` (wspólna dla `glyph_source` i `runs`): łańcuch budowany raz na napis zamiast raz na znak — wynik identyczny.

### 2.2 Hook w `canvas.rs` (allowlista: „tylko hooki”)
Jedna funkcja crate-private `stroke_color_alpha()` — lustro istniejącej `fill_color_alpha()` (RR-T8c) dla `strokeStyle`. Publiczna powierzchnia RR-T8a (`tests/raster_api_closed.rs`) bez zmian.

### 2.3 Stare API i wywołujące
`emoji::fill_text(ctx, &TextStyle, …)` = `set_font` + `set_text_align` + `set_text_baseline` + `ctx.fill_text`; `emoji::measure_text(font, text)` = scratch 1×1 + `set_font` (None dla niepoprawnego `font`, jak dotąd) + `ctx.measure_text`. **Nie** oznaczono `#[deprecated]`: oznaczenie wymusiłoby zmianę 4 wywołujących (`units/overlay/emblem.rs:171`, `cities/overlay/{okolica.rs:170,175, worker_field.rs:120, stat_chip.rs:406}`) albo `#[allow]` przy nich (`clippy -D warnings`), a dispatch dopuszcza zmianę wywołujących „tylko jeśli konieczne”. Migracja na `Canvas2dLite::fill_text` to zmiana mechaniczna do osobnej decyzji orkiestratora (ZAŁOŻENIE Z-35-1).

---

## 3. Fakty z Chromium 141 (nowe względem P4-30)

### 3.1 Linia bazowa napisu bez emoji = font główny (`baselines.tsv`, 144 wiersze)
`measureText(t).alphabeticBaseline` dla `t ∈ {"12", "A", "A🔥", "🔥 3"}` × 6 linii bazowych × 6 fontów (T13 13/16/17 px, `bold 16px Segoe UI, Arial`, `24px Arial`, `48px serif`): **wartość zależy wyłącznie od fontu, nie od tekstu** — np. T13 16 px `top`: −12,671875 dla „12” i dla „A🔥” (metryki twarzy emoji: 1900/500, upem 2048). Test `textmix_baselines_match_chromium`: **144/144 bit w bit** z `emoji_aware_baseline_shift`. Wniosek: RR-T8b dla napisu bez emoji w stosie T13 brał metryki Liberation Sans (`face_chain` pomija „Noto Color Emoji”) — błąd ujawniony i naprawiony (scena `m04_text_only_emoji_primary`, mutacja U03). Żaden istniejący test nie miał takiego przypadku (wszystkie złote hashe bez zmian).

### 3.2 `strokeText` z glifem kolorowym (`probes.tsv`)
Płótno 80×60, `40px Arial`, 🔥 w (10, 30), `middle`; sumy kanałów straight RGBA:

| próba | R | G | B | A |
|---|---|---|---|---|
| `fillText`, `fillStyle #0000ff` | 275383 | 153154 | 49813 | 247556 |
| `strokeText`, `#ff0000`, `lineWidth 3` | 275383 | 153154 | 49813 | 247556 |
| `strokeText`, `#00ff00`, `lineWidth 12` | 275383 | 153154 | 49813 | 247556 |
| `strokeText`, `rgba(255,0,0,0.5)` | 272538 | 151740 | 49160 | 124201 |
| `strokeText`, `fillStyle` alfa 0,5, `strokeStyle` nieprzezroczysty | 275383 | 153154 | 49813 | 247556 |

Wniosek (dokładny): glif kolorowy w `strokeText` = ten sam obraz co w `fillText`; `lineWidth`, kolor RGB i `fillStyle` bez wpływu; alfa `strokeStyle` mnoży (masa alfa ×0,5017). Odtworzone: `draw_mixed` z `TextPaint::Stroke` rysuje bitmapę z `stroke_color_alpha()`, przebiegi konturowe obrysowuje. Test `textmix_stroke_probe_matches_chromium`: u nas obrysy nieprzezroczyste **identyczne** z wypełnieniem (równość bitowa sum), stosunek mas alfa 0,5016 vs 0,5017 (≤ 0,002), sumy kanałów vs Chromium ≤ 3 % (różnica próbkowania bitmapy, ta sama co w scenach P4-30 §4.3). Web: `strokeText` tylko dla cyfr Mocy (`render/unitStatPlate.ts:615`) — bez emoji; reguła ma znaczenie dla poprawności API, nie dla obecnych scen gry.

---

## 4. Szerokości napisów mieszanych (`widths.tsv`, 308 wierszy)

14 fontów weba (`gen.mjs` `F`: `workerFieldOverlay.ts:98`, `cityOkolicaOverlay.ts:138`, `:85-86` ×3 rozmiary, `:87-88`, `cities.ts:714`, `siegeMarker.ts:42`, `units.ts:6294` (40 px), `main.ts:12856`, `unitStatPlate.ts:609` (28 px), 3 Arial) × 22 napisy (m.in. „Zbrojmistrz ⚔ 12 ☠ 3 👤”, „🍞 3 🔨 2 💰 5”, „⛏ Kopalnia 🌾 Farma 🏛”, „Łódź🏰Kraków”, „AV🔥AV”, „a\t🔥”, „ 👤 ”, „👤👤👤 3”, „12”).

| model | textmix 308 | RR-T8c `image/widths.tsv` 255 |
|---|---|---|
| RR-T8c: suma `f64` szerokości przebiegów | 288 | 252 (+3 znane) |
| **wybrany: szerokość przebiegu → `f32`, akumulacja `f32`** | **308** | **252 (+ te same 3 znane)** |
| akumulacja `f32` per glif kolorowy | 308 | 250 (gubi 2 wiersze 16 ikon R4 @16 px) |
| podział przebiegów konturowych na słowa (spacje osobno) + `f32` | 308 | 252 — nierozróżnialny od wybranego na danych; odrzucony jako zbędny (mutacja-sonda w r1 przeżyła) |

**ZAŁOŻENIE Z-35-3:** model dopasowany na danych (Blink trzyma szerokości tekstu jako `float` `[zewn., niezweryfikowane w źródłach Blink]`). Wszystkie 20 wierszy, które model `f64` gubił, mają szerokość > 256 px (tam `f32` ma 15 bitów ułamka, a pozycje HarfBuzz 16) — dla napisów gry (≤ 256 px) oba modele dają ten sam wynik, dlatego złote hashe nie drgnęły. Trzy odchylenia RR-T8c (`20.3px` 🔥 — rozmiar ułamkowy; 16 ikon R4 @48 i @96 px — 1 ulp `f32`) **pozostają** niewyjaśnione; próbowane i odrzucone (skrypt w scratchpadzie, poza repo): sekwencyjna/drzewiasta akumulacja, grupy 2–16 glifów, podział na „słowa” wg prezentacji emoji (32 warianty) — żaden nie trafia jednocześnie @16, @48 i @96 px. Web nie rysuje tych ciągów (ikony R4 po jednej, 16 px — `main.ts:12863-12867`).

Wyrównanie (`center`/`end`/`right`) w `draw_mixed` używa tej samej szerokości `f32`; pozycje kolejnych przebiegów — sumy `f64` (różnica < 1e-4 px, poniżej kwantyzacji 1/4 px; mutacja U09).

---

## 5. Sceny vs Chromium 141

Generator `tests/fixtures/textmix/gen.mjs` (node v22.22.0, playwright 1.56.1, Chromium 141.0.7390.37; fonty jako `FontFace` z `assets/fonts/*` i `assets/emoji/*`; mapowanie stosów = kopia `mapFamily`/`mapFont` z `image/gen.mjs`). Odtwarzanie w Rust (`tests/textmix_chromium.rs`) **tylko przez publiczne API `Canvas2dLite`** — żadnego wywołania `raster::image::emoji`. Progi jak RR-T8a/b/c (ZAŁOŻENIE D-TXT-4 = A).

### 5.1 Wyniki (`textmix_scenes_match_chromium`, pełny log `dowody/03-textmix-nocapture.log`)

| scena | rozmiar | max | mean_abs | px>16 % | SSIM | źródło |
|---|---|---|---|---|---|---|
| `m01_stat_line_left_middle` ⚠ §5.2 | 180x24 | 74 | 1.9634 | 4.907 | 0.98341 | font `cityOkolicaOverlay.ts:138` + „Zbrojmistrz ⚔ 12 ☠ 3 👤” |
| `m02_worker_center` | 150x28 | 64 | 1.4554 | 3.643 | 0.98971 | font `workerFieldOverlay.ts:98`, center/middle |
| `m03_yield_emoji_stack_top` | 160x24 | 55 | 0.8694 | 1.432 | 0.99362 | stos T13 `cityOkolicaOverlay.ts:85-86`, top, alfa 0,95 |
| `m04_text_only_emoji_primary` | 200x40 | 50 | 0.2389 | 0.975 | 0.99831 | „12” bez emoji w stosie T13, 6 linii bazowych (§3.1) |
| `m05_right_align` | 200x34 | 52 | 0.6151 | 1.809 | 0.99787 | `bold 20px Arial`, right |
| `m06_end_align_serif` | 220x64 | 67 | 0.5544 | 1.683 | 0.99667 | `cities.ts:714`, end |
| `m07_skull_symbol_stack` | 160x56 | 61 | 0.4977 | 1.830 | 0.99772 | stos `units.ts:6294`, „☠ 3 👤” czerwony |
| `m08_stroke_then_fill` | 200x44 | 57 | 0.7577 | 2.739 | 0.99623 | wzorzec `unitStatPlate.ts:609-618` (strokeText + fillText) |
| `m09_stroke_alpha_emoji` | 120x36 | 24 | 0.2702 | 0.116 | 0.99885 | strokeText, alfa `strokeStyle` na glifie kolorowym |
| `m10_fill_alpha` | 120x30 | 16 | 0.1808 | 0.000 | 0.99883 | alfa `fillStyle` na tekście i emoji w jednym wywołaniu |
| `m11_shadow_mixed` | 140x36 | 43 | 0.6671 | 1.270 | 0.99722 | cień |
| `m12_scaled_ctm` | 360x40 | 74 | 1.1798 | 2.681 | 0.99545 | `setTransform(2)` (`cityMapStatChip.ts:846-851`) |
| `m13_r4_label` | 200x20 | 69 | 1.4855 | 3.200 | 0.98565 | `12px Arial` + ⛏ 🌾 🏛 w etykiecie |
| `m14_hanging_ideographic` | 120x44 | 28 | 0.2901 | 0.341 | 0.99916 | hanging / ideographic |
| `m15_text_only_regression` ⚠ §5.2 | 120x24 | 69 | 2.0011 | 5.278 | 0.98458 | **kontrolna, bez emoji** (gałąź RR-T8b) |
| `m16_subpixel_mixed` | 200x28 | 42 | 0.4504 | 0.643 | 0.99782 | ułamkowe x/y |
| `m17_symbols_mono` | 200x40 | 56 | 0.3513 | 1.175 | 0.99741 | ⚔☠◆ mono obok 👤 |
| `m18_siege_word` | 420x110 | 49 | 0.1244 | 0.457 | 0.99932 | `siegeMarker.ts:42` |

### 5.2 Wyjątki — AA konturów RR-T8b, nie RR-T8f
`m01` i `m15`: mały (13 px) **jasny** (`#f0e6c8`) pogrubiony Liberation Sans na przezroczystym tle. `m15` nie zawiera ani jednego glifu kolorowego — rysuje go nietknięta gałąź RR-T8b — i odstaje tak samo (mean 2,00, SSIM 0,9846, px>16 5,28 %) jak `m01` (mean 1,96, SSIM 0,9834). Przyczyna opisana w P4-29 §5.3 (pokrycie AA masek glifów Skii zależne od jasności koloru — nieodtwarzane, D-TXT-6); RR-T8b mierzył mały tekst na nieprzezroczystych tłach (T14), gdzie różnica alfa się nie ujawnia. Każda scena, w której dominują glify kolorowe albo większy tekst, jest w progach. Test ma jawną listę `EXCEPTIONS` z granicami = zmierzone wartości zaokrąglone na zewnątrz (`m01`: SSIM ≥ 0,983, mean ≤ 2,0, px>16 ≤ 5,0 %; `m15`: ≥ 0,984, ≤ 2,01, ≤ 5,3 %), więc regresja nadal jest wykrywana. **Do decyzji Evaluatora/orkiestratora:** akceptacja jako odchylenie RR-T8b (ocena wzrokowa D-TXT-4 = A) albo osobny temat AA małego jasnego tekstu.

---

## 6. Zgodność ze starą ścieżką (RR-T8c) — „wynik identyczny z nową ścieżką”

1. **Wszystkie istniejące złote hashe bez re-blessu** (log bram `dowody/01-gates.log`): `raster_scenes` (RR-T8a), `text_scenes` (RR-T8b), `image_scenes` (RR-T8c — sceny z emoji rysowane przez `emoji::fill_text`, teraz delegację), `overlay_web_parity` (MOD-08: emblemat z glifem zastępczym przez `emoji::fill_text`), `cityoverlay_web_parity` (MOD-10: okolica/pracownicy/plakietka przez `emoji::fill_text`/`measure_text`, w tym ślad rysowania 474 `fillText` bit w bit) oraz `image_metrics` (szerokości i linie bazowe RR-T8c).
2. `textmix_unify::image_text_scenes_through_canvas_fill_text_match_rr_t8c_golden` — 18 scen RR-T8c bez `drawImage` (T1, T2, T3, T10 glif zastępczy ×2, T12 ×3, T13 ×3, `x_emoji_*` ×7) odtworzonych **wyłącznie** przez `Canvas2dLite::{set_font, set_text_align, set_text_baseline, fill_text, measure_text}` (w tym port `drawYieldLine` na `ctx.measureText`): **18/18 hashy = `image/golden.tsv`** (zapisanych przez kod RR-T8c przed zmianą).
3. `emoji_measure_text_is_canvas_measure_text` — 563/563 (`image/widths.tsv` + `textmix/widths.tsv`) `to_bits` równe.
4. `fill_text_draws_colour_glyphs_not_notdef` — 👤 w `bold 16px Segoe UI, Arial` przez `fill_text`: bitmapa kolorowa (przed RR-T8f: `.notdef` w kolorze wypełnienia), szerokość = advance bitmapy; ⚔ ☠ ◆ monochromatyczne w kolorze `fillStyle`.
5. `text_without_colour_glyphs_is_the_rr_t8b_pipeline` — dla napisów bez glifu kolorowego `measure_text` = `shape_text` (`to_bits`), w tym ⚔ ☠ ◆ w stosach tekstowych.

---

## 7. Determinizm
`dowody/05-determinism.{sh,log}`: `textmix_golden_hashes` (18 scen, `golden.tsv`), `image_text_scenes_through_canvas_fill_text_match_rr_t8c_golden` oraz złote hashe RR-T8a (`raster_scenes`), RR-T8b (`text_scenes`), RR-T8c (`image_scenes`), MOD-08, MOD-10 — rustc **1.87.0** i **stable 1.97.0**, **debug i release**: wszystkie 4 konfiguracje `EXIT=0`, sha256 listy 18 hashy textmix identyczne (`312d1543…7e7d`) we wszystkich czterech. Generator: trzy przebiegi `gen.mjs` — 1. i 2. dały identyczne sha256 wszystkich `ref/*.rgba`, `widths.tsv`, `baselines.tsv`, `probes.tsv` (między nimi zmieniono tylko cytat `plik:linia` w komentarzach i kolumnie źródła `scenes.tsv`); 3. przebieg na kopii w osobnym katalogu poza repo (`dowody/06-generator-repro.{sh,log}`): `MANIFEST.sha256` **identyczny** z wersją w repo (`DIFF_EXIT=0`). Inne architektury niż x86_64: NIE_ZMIERZONO (jak P4-28/29/30).

---

## 8. Bramy
`dowody/01-gates.{sh,log}` — pełne surowe logi z `echo "EXIT=$?"`: `cargo fmt --all -- --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo clippy --locked --all-targets --features gpu -- -D warnings`, `cargo test --locked --all-targets` (stable), `cargo +1.87.0 test --locked --all-targets`. Clippy na 1.87.0: NIE_ZMIERZONO (komponent niezainstalowany, jak P4-28/29/30).

---

## 9. Mutacje
`dowody/08-mutations.{py,log}` — 16 mutacji kodu produkcyjnego (`raster/text/mod.rs`, `raster/image/emoji.rs`), każda osobno (`cargo test --no-fail-fast`: `textmix_manifest`, `textmix_chromium`, `textmix_unify`, `image_scenes`, `image_metrics`, `text_scenes`, `overlay_web_parity`, `cityoverlay_web_parity`). **15/16 zabitych**, każda zabita także testem innym niż złoty hash (porównanie z Chromium, szerokości bit w bit, próba `strokeText` albo test zgodności `textmix_unify`):

| id | mutacja | zabija m.in. |
|---|---|---|
| U01 | `fill_text`/`stroke_text` nigdy nie wchodzą w ścieżkę kolorową (stan sprzed RR-T8f, `.notdef`) | `fill_text_draws_colour_glyphs_not_notdef`, `image_text_scenes_…_rr_t8c_golden`, `textmix_scenes_match_chromium`, `textmix_stroke_probe…`, MOD-10 `okolica/worker_textures_match_chromium` |
| U02 | `measure_text` ignoruje advance bitmapy | `textmix_widths…`, `emoji_widths…` (RR-T8c), MOD-10 `draw_traces_match_chromium` |
| U03 | linia bazowa napisu bez emoji z pierwszej twarzy konturowej (RR-T8b) zamiast głównej | `textmix_scenes_match_chromium` (`m04`), `textmix_golden_hashes` |
| U04 | szerokość: suma `f64` przebiegów (model RR-T8c) | `textmix_widths_match_chromium_bit_for_bit` |
| U05 | `f32` tylko na sumie końcowej | `textmix_widths…` |
| U06 | przebieg kolorowy akumulowany w `f32` per glif | `emoji_widths_match_chromium_bit_for_bit` (16 ikon R4 @16 px) |
| U07 | `strokeText`: alfa glifu z `fillStyle` | `textmix_stroke_probe…`, `textmix_scenes…` (`m09`) |
| U08 | `strokeText` pomija glify kolorowe | `textmix_stroke_probe…`, `textmix_scenes…` |
| U09 | wyrównanie po sumie `f64` zamiast szerokości `f32` | **przeżyła — równoważna w praktyce**: różnica < 1e-4 px, poniżej kwantyzacji początku glifu 1/4 px (§4); żaden napis testowy nie trafia w granicę kwantyzacji |
| U10 | `has_color_glyph` ignoruje łańcuch (⚔ ☠ w stosie tekstowym → ścieżka kolorowa) | w 1. przebiegu przeżyła (dla rozmiarów całkowitych szerokość `f32` = `f64`); dodany przypadek `bold 20.3px Arial` > 256 px z ⚔ ☠ → zabita przez `text_without_colour_glyphs_is_the_rr_t8b_pipeline` (2. przebieg) |
| U11 | napis mieszany: `textBaseline` ignorowane | `image_text_scenes…`, `scenes_match_chromium` (RR-T8c), `textmix_scenes…`, MOD-10 |
| U12 | napis mieszany: `center` jak `right` | j.w. |
| U13 | `strokeText` mieszany wypełnia przebiegi konturowe | `textmix_scenes_match_chromium` (`m08`) |
| U14 | delegacja `emoji::fill_text` gubi `textBaseline` | MOD-10 `chip/okolica/worker_textures_match_chromium`, `local_limits_are_tight` |
| U15 | napis mieszany: `end`/`right` jak `left` | `textmix_scenes…` (`m05`, `m06`) |
| U16 | alfa glifu kolorowego zawsze 1 (Z-7 utracone) | `scenes_match_chromium` (RR-T8c `x_emoji_alpha_and_colour`), `textmix_scenes…`, `image_text_scenes…` |

---

## 10. ZAŁOŻENIA, NIE_ZMIERZONO, ocena wzrokowa

- **Z-35-0** szablon dispatchu (§1). **Z-35-1** stare API jako delegacja bez `#[deprecated]` (§2.3). **Z-35-2** wywołujące bez zmian (niekonieczne — §6). **Z-35-3** model szerokości `f32` (§4). **Z-35-4** wyjątki `m01`/`m15` (§5.2) — przyczyna RR-T8b. **Z-35-5** napisy testowe syntetyczne („napisy typu” z dispatchu) w prawdziwych fontach weba; web rysuje dziś mieszane ciągi w jednym `fillText` wyłącznie w scenach P4-30 (np. glif zastępczy, T13) — RR-T8f dotyczy API, nie nowych miejsc rysowania. **Z-35-6** `strokeText` glifu kolorowego (§3.2) — przypadek nieużywany przez web.
- NIE_ZMIERZONO: wygląd na Windows (Segoe UI Emoji/Symbol); GPU; architektury ≠ x86_64; clippy 1.87.0; 3 odchylenia szerokości RR-T8c (§4); źródła Blink dla modelu `f32` (wnioskowane z pomiaru).
- **Ocena wzrokowa właściciela po RR-T5 (D-TXT-4 = A):** etykiety okolicy (🍞 🔨 💰 + cyfry) i ikony pracowników 👤 na mapie; linia bazowa cyfr w stosie T13 (§3.1) — w grze cyfry okolicy idą fontem Arial (`YIELD_DIGIT_FONT`), więc zmiana nie powinna być widoczna; mały jasny tekst 13 px (§5.2) na tle mapy.

---

## 11. Pliki
- `rust-port/renderer/src/raster/text/mod.rs` — jedna ścieżka (`draw_text`, `paint_text_path`, `paint_outline_run`, `TextPaint`, gettery `TextState`), dokumentacja modułu.
- `rust-port/renderer/src/raster/image/emoji.rs` — `has_color_glyph`, `mixed_width`, `draw_mixed`, `pick_source`; `fill_text`/`measure_text` jako delegacje.
- `rust-port/renderer/src/raster/canvas.rs` — hook `stroke_color_alpha` (§2.2).
- `rust-port/renderer/tests/textmix_chromium.rs`, `textmix_unify.rs`, `textmix_manifest.rs`.
- `rust-port/renderer/tests/fixtures/textmix/` — `gen.mjs`, `scenes.tsv`, `ref/*.rgba` (18), `widths.tsv`, `baselines.tsv`, `probes.tsv`, `versions.txt`, `MANIFEST.sha256`, `golden.tsv` — razem ~692 KB (≤ 4 MB).
