# P4-30 — Obrazy na CPU: JPG, SVG, emoji (`raster::image`, RR-T8c)

TEMAT: `R-RUSTPORT-P4-30-IMAGES-Q1` · DOMAIN: GAME · runda 1/5 · Operator (Opus 5.5 medium)
Baza kodu: `origin/rust-port/parity-v2` @ `453c3c79` (RR-T8a + RR-T8b zintegrowane). Web: pin `edb8fb56` (czytany przez `git show` / `git archive` do scratchpadu poza repo; zero buildu weba, zero zmian w `gra/**`).
Decyzje wejściowe (dispatch): **D-TXT-3 = C** (najpierw zrzuty, potem wybór — rozstrzygnięcie w §3), **D-TXT-4 = A** (progi metryki jak RR-T8a/b + ocena wzrokowa właściciela później), **D-TXT-5 = A** (Chromium z tymi samymi plikami), **D-TXT-6 = A** (`resvg`/`usvg` + osobny dekoder JPG), MSRV 1.87. Plan: `P4-25-TEXT-RASTER-AUDIT.md` §6 (wiersz RR-T8c); rasteryzator `P4-28-RASTER-SHAPES.md`, tekst `P4-29-TEXT-FONTS.md`.
Dowody surowe (w commicie, `*.log` dodane `git add -f`): `dyspozycje/autobot/runs/R-RUSTPORT-P4-30-IMAGES-Q1/dowody/` — `01-gates.{sh,log}`, `05-determinism.{sh,log}`, `06-chromium-refs-repro.{sh,log}`, `07-image-tests.sh` + `07-image-tests-nocapture.log` (pełne tabele), `08-mutations.{py,log}`, `png/` (arkusze porównań Chromium | Rust | |różnica|×4).

Konwencja: `plik:linia` bez prefiksu = `gra/src/` w pinie `edb8fb56`. `[zewn.]` = wiedza o wnętrzu Chromium/Skia spoza repo, **nieczytana w źródłach** — sprawdzana wyłącznie empirycznie. `NIE_ZMIERZONO` = nie sprawdzone.

---

## 0. Streszczenie

1. Nowy podmoduł `rust-port/renderer/src/raster/image/` (`mod.rs`, `jpeg.rs`, `svg.rs`, `emoji.rs`, `mip.rs`) + `pub mod image;` w `raster/mod.rs`. `src/lib.rs` **nietknięty**. `#![forbid(unsafe_code)]` bez zmian. `raster/canvas.rs`: 2 hooki `pub(crate)` na `RasterImage` + 1 na `Canvas2dLite` (§10), **zero nowych `pub fn`** (listy RR-T8a/RR-T8b zielone).
2. Zależności (wyłącznie dozwolone): **`zune-jpeg =0.5.15`** (`default-features = false, features = ["std"]` → bez SIMD, crate kompiluje się pod własnym `forbid(unsafe_code)`) i **`resvg =0.48.1`** (`default-features = false`; `usvg` przez reeksport `resvg::usvg`). `tiny-skia` dostaje jawnie cechę `png-format` (dekodowanie bitmap PNG emoji; ta sama wersja crate'a). Lock: +26 wpisów (24 kompilowane). Build + testy na **rustc 1.87.0: EXIT=0** (§8).
3. **D-TXT-3 = C rozstrzygnięte zrzutami (§3):** w webie (Chromium) emoji z prezentacją domyślną „emoji” są **kolorowe**, symbole z prezentacją tekstową — **monochromatyczne** w kolorze `fillStyle`. Wybór: **kolorowy podzbiór Noto Color Emoji** (23 glify, **45 188 B**, OFL 1.1, przepis i sha256 w `assets/emoji/SOURCES.txt`) + istniejące **mono DejaVu** dla ⚔ ☠ ◆ — wybór per znak, tak jak przeglądarka.
4. **Emoji vs Chromium 141 (zmierzone, §4):** szerokości `measureText` **252/255 bit w bit** (model: advance bitmapy × f32 `size/ppem`, obcięty do 16.16; 3 jawne odchylenia: rozmiar ułamkowy 20,3 px i 2 długie ciągi 16 ikon R4 przy 48/96 px o 1 ulp f32); linie bazowe fontu emoji **72/72 bit w bit**; ZAŁOŻENIE Z-7 z P4-25 **potwierdzone**: alfa `fillStyle` mnoży kolorowy glif, RGB `fillStyle` ignorowane; pozycja glifu 1/4 px w poziomie, cały px w pionie; skalowanie bitmapy = poziom mip `floor(log2(1/skala))` (box 2×2) + bilinear.
5. **Obrazy (§5):** JPG portret 1:1 vs libjpeg-turbo: max |Δ| = 4, SSIM 0,99925. Pomniejszanie bitmap (portrety 256 → 29…116 px) — ten sam model mip co emoji (bez niego SSIM medalionu T14×1 = 0,924, z nim 0,9975). SVG — rasteryzacja **wektorowa w rozdzielczości urządzenia** (zmierzone: bitmapa rozmiaru własnego skalowana ⇒ SSIM do 0,911). `prepareSvgForCanvas`: **270/270 wyników identycznych znak w znak** z funkcją weba uruchomioną w node (w tym `toFixed(2)` JS z zaokrągleniem „połówka w górę”).
6. **Sceny: 43** (T10 ×7, T11 ×6, medalion T14 ×6 + ikona produkcji T14 ×3, T1, T2, T3, T12 ×3, T13 ×3, 12 semantycznych) — **wszystkie w progach RR-T8a/b** (SSIM ≥ 0,985, mean_abs ≤ 1,5, px>16 ≤ 5 %) **poza jednym jawnym wyjątkiem** `t14_prod_icon_x1` (mean_abs 1,576 > 1,5; SSIM 0,992 i px>16 2,95 % w progach; §6.2).
7. Determinizm: złote hashe 43 scen identyczne na rustc **1.87.0 i 1.97.0, debug i release, ×2** (§7). Referencje Chromium wygenerowane drugi raz — `MANIFEST.sha256` identyczny.
8. Mutacje: **21/21 zabitych** (§9). Bramy: fmt / clippy / clippy `gpu` / test stable / test 1.87.0 — EXIT=0 (§8).

---

## 1. Zakres i wykonanie GOAL

| Wymóg dispatchu | Stan |
|---|---|
| (1) dekoder JPG, MSRV 1.87, `forbid(unsafe_code)`, uzasadnienie | `raster::image::jpeg::decode_jpeg` na `zune-jpeg 0.5.15`; uzasadnienie §2.1 |
| (2) SVG: port `prepareSvgForCanvas` + `resvg`/`usvg`, MSRV 1.87, bez zbędnych cech | `raster::image::svg::{prepare_svg_for_canvas, SvgImage, draw_svg}`; `resvg` `default-features = false` (bez `text`, `system-fonts`, `memmap-fonts`, `svgz`, `raster-images`) §2.2 |
| (3) emoji/symbole ⚔ ☠ ◆ 👤 🔥 🍞 🔨 💰 + 16 ikon R4 wg D-TXT-3 = C: zrzuty → wybór → ZAŁOŻENIE z przykładami | §3 (zrzuty z repo, decyzja Z-30-3, arkusze `dowody/png/`); `raster::image::emoji` |
| (4) `drawImage` ze skalą i `clip` dla zdekodowanych obrazów (użyć istniejącego `drawImage`) | JPG: `mip::draw_bitmap` → `Canvas2dLite::draw_image` (poziom mip, potem istniejące `drawImage`, klip i cień z płótna); SVG: warstwa urządzenia → `draw_image` 1:1 (§5) |
| sceny T10, T11, medalion T14, T1, T2, T3, T12, T13 vs Chromium 141 (SSIM/mean_abs, progi RR-T8a/b) | §6 — 43 sceny |
| determinizm hash RGBA 2+ przebiegi, 1.87 vs najnowszy | §7 |
| mutacje ≥ 15 | §9 — 21 mutacji |
| manifest sha256 fixtur | `tests/fixtures/image/MANIFEST.sha256` + test `image_assets::fixtures_match_manifest_sha256`; `assets/emoji/MANIFEST.sha256` + `emoji_assets_match_manifest_sha256` |
| dozwolone zależności wyłącznie JPG + `resvg`/`usvg` (+ przechodnie), lock commitowany | §2 |
| obrazy testowe z repo, minimalny podzbiór ≤ 6 MB | 3 portrety JPG (29 436 B) + 7 SVG (2 830 B) z pinu (`git show edb8fb56:…`), §5; fixtury razem **2 503 610 B** (≤ 8 MB) |

**Rozstrzygnięcia luk jako ZAŁOŻENIE** (bez pytania, zgodnie z instrukcją):
- **Z-30-0 (szablon dispatchu):** sekcja KONTEKST mówi „bez nowych zależności, `Cargo.lock` nie ruszać” i „dopisz `pub mod` w `src/lib.rs`”; GOAL i ALLOWLISTA każą dodać dekoder JPG i `resvg`, commitować lock i dopisać `pub mod image;` w `raster/mod.rs`. Przyjęto GOAL+ALLOWLISTĘ (jak Z-28-1, Z-29-0). Lista „przeczytaj OBOWIĄZKOWO” (P4-4, P4-3, P4-8, P4-11, P4-6) to szablon tematów modelowych; merytorycznie wiążące są P4-25 (§2–§6, przeczytane), P4-28 i P4-29 (przeczytane w całości) — wzorzec weryfikacji = Chromium Canvas 2D (P4-28/29), nie esbuild/three (P4-11).
- **Z-30-1 (`png-format` w `tiny-skia`):** dekodowanie bitmap PNG kolorowych glifów (CBDT) wymaga dekodera PNG. Nie dodano nowego crate'a: `png` jest już przechodnią zależnością `resvg`, a `tiny-skia` (ta sama wersja) ma cechę `png-format`, którą `resvg` i tak włącza. Zapisano ją jawnie, by nie polegać na unifikacji cech.
- **Z-30-2 (cecha `simd` tiny-skia):** `resvg` włącza domyślne cechy `tiny-skia` (`std`, `simd`, `png-format`); tego nie da się wyłączyć bez forka. **Zmierzone:** złote hashe RR-T8a (`raster_scenes`) i RR-T8b (`text_scenes`) bez zmian (testy zielone na x86_64, stable i 1.87.0). Inne architektury: NIE_ZMIERZONO (jak w P4-28/29).
- **Z-30-3 (D-TXT-3 = C):** §3.
- **Z-30-4 (API emoji):** pliki `raster/text/**` są poza allowlistą RR-T8c, więc `Canvas2dLite::fill_text` (lista zamknięta RR-T8b) **nie** rysuje emoji — nadal rysuje `.notdef` dla znaku spoza fontów tekstowych. Tekst z emoji idzie przez `raster::image::emoji::{fill_text, measure_text}` z jawnym `TextStyle` (font / `textAlign` / `textBaseline` — dokładnie trzy przypisania, które web robi przed `fillText`), a każdy fragment bez emoji deleguje do `Canvas2dLite::fill_text`. Wpięcie w `Canvas2dLite::fill_text` = jedna zmiana w `raster/text/mod.rs` w kolejnej paczce (RR-T8d albo MOD-08/10), do decyzji orkiestratora.
- **Z-30-5 (stan przejściowy):** jak P4-25 Z-2 — rysujemy stan końcowy (tarcza + portret/sygnet), bez fazy „tarcza z glifem zastępczym przed wczytaniem obrazka”; glif zastępczy ma osobne sceny (`t10_fallback_glyph_*`), bo jest trwałym stanem, gdy obrazka brak.
- **Z-30-6 (wejścia testowe):** obrazy testowe są fixturami (`tests/fixtures/image/input/`), nie zasobami gry: `assets/images/**` nie powstał (rejestr zasobów i ścieżki portretów to RR-T5 / P4-9; `rust-port/assets/portraits/` już istnieje). `inputs_are_the_pin_bytes` sprawdza sha256 wejść wobec zakodowanych w teście hashy blobów pinu (`git show edb8fb56:gra/src/assets/portrety/<f> | sha256sum`) — bezwarunkowo, bez zależności od `gra/` obok crate'a (obrona r1, zarzut 5).

---

## 2. Zależności

### 2.1 Dekoder JPG: `zune-jpeg =0.5.15`
| kryterium | `zune-jpeg 0.5.15` (wybrany) | `jpeg-decoder 0.3.2` |
|---|---|---|
| MSRV | 1.75.0 (`cargo info`), **zbudowany na 1.87.0** | 1.61.0 |
| `forbid(unsafe_code)` | `#![cfg_attr(not(any(feature = "x86", feature = "neon")), forbid(unsafe_code))]` (`zune-jpeg-0.5.15/src/lib.rs:163`) — u nas cechy tylko `std` (`cargo tree -e features -i zune-jpeg`: jedynie `"std"` od `civ-renderer`), więc **forbid aktywny** | tylko z cechą `platform_independent` (`jpeg-decoder-0.3.2/src/lib.rs:31`) |
| zależności | `zune-core` | domyślnie `rayon` (`Cargo.toml:41`) — wątki, cięższe drzewo |
| determinizm | ścieżka skalarna, bez SIMD i wątków | zależny od `rayon`/SIMD przy domyślnych cechach |
| zgodność z Chromium | scena `x_jpeg_portrait_1to1`: max |Δ| = 4, mean 0,10, SSIM 0,99925 | NIE_ZMIERZONO |
| uwaga | `resvg` używa tego samego dekodera w cesze `raster-images` (u nas wyłączonej) | — |

Portrety: baseline JPEG 256×256, YCbCr 4:2:0 (marker SOF0, próbkowanie Y 2×2 — zmierzone na `portrait-grecy-braz.jpg`).

### 2.2 SVG: `resvg =0.48.1` (`usvg` przez `resvg::usvg`)
`rust-version = 1.85.0`; `#![forbid(unsafe_code)]` w `resvg-0.48.1/src/lib.rs:8` i `usvg-0.48.1/src/lib.rs:49`. Cechy domyślne `[svgz, text, system-fonts, memmap-fonts, raster-images]` — **wszystkie wyłączone** (ikony brand-booka nie mają tekstu ani osadzonych bitmap; brak fontów systemowych zgodnie z D-RR-4 = A). Rasteryzuje na `tiny-skia 0.12.0` — tym samym crate'cie co `Canvas2dLite`.

### 2.3 Lock
Nowe wpisy (26): `adler2 crc32fast data-url euclid fdeflate flate2 float-cmp imagesize kurbo memchr miniz_oxide(×2: 0.8.9, 0.9.1) pico-args png polycool resvg rgb roxmltree simd-adler32 simplecss siphasher svgtypes usvg zlib-rs zune-core zune-jpeg`. Kompilowane 24 (`cargo tree -e normal`); `euclid` i `zlib-rs` są w locku jako opcjonalne, niewłączone. Wszystkie wybrane przez resolver `incompatible-rust-versions = "fallback"` (`.cargo/config.toml`) — build na 1.87.0 przechodzi (§8).

---

## 3. D-TXT-3 = C — jak wyglądają emoji w webie (zrzuty z repo) i wybór

Przejrzane zrzuty (`git ls-files | grep -iE '\.(png|jpe?g)$'` — 434 pliki; obejrzane te, które pokazują emoji/symbole w UI lub mapę; wszystkie powstały w Chromium na Linuksie w środowisku agentów — UA w `tests/fixtures/text/versions.txt` tego samego typu):

| zrzut | co widać | wniosek |
|---|---|---|
| `dyspozycje/autobot/runs/P-DYPLO-KARTA-DECYZJI-DISMISS-UCIETY-Q1/zrzuty/R-karta-buntu.png` (pasek u góry, przycisk „🌍 Inne cyw.”) | 🌍 U+1F30D — **kolorowa** kula ziemska (niebiesko-zielona) | znak z `Emoji_Presentation=Yes` → **kolorowy font emoji** |
| `dyspozycje/autobot/runs/P-SCIENCEHUB-TOOLTIP-EMOJI-ZAMIAST-IKON-Q1/dowody-wizualne/PRZED/01-tooltip-obleznictwo-PRZED.png` | ⚗ U+2697 przed „Koszt nauki” — **mono, zielony jak tekst**; 🏛 U+1F3DB przed „budynek: Koszary” — **mono, w kolorze tekstu**; ▶ mono | znaki z domyślną prezentacją **tekstową** → glif monochromatyczny w kolorze tekstu |
| `dyspozycje/autobot/runs/R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1/dowody/mapa-stolica-gracza-runda4-zblizenie.png` | pigułka miasta: medalion z portretem JPG, korona, nazwa; brak emoji | potwierdza T14 (portret przycięty kołem) |
| `dyspozycje/autobot/runs/P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1/dowody/przed-hud-mapy-lewy.png`, `P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1/dowody/PRZED-surowce.png` | ikony SVG brand-booka (kreska `#e8d88a`), żadnych emoji | — |

Zrzutów T1/T3/T12/T13 (🔥 ☠ 👤 🍞🔨💰 na mapie) w repo **nie ma** (szukano po nazwach `okolic|plon|robotn|worker|bunt|revolt|glod|oblez|siege|emoji` w obu gałęziach: 0 trafień) — dlatego reguła z UI (ten sam Chromium, ten sam mechanizm fallbacku fontów) jest przeniesiona na kanwy.

**ZAŁOŻENIE Z-30-3 (wybór D-TXT-3):** odtwarzamy regułę przeglądarki, nie jedną z opcji A/B „na sztywno”:
- 👤 🔥 🍞 🔨 💰 i 16 ikon R4 (wszystkie poza ⛏ 🏔 🏛 🛡 🛤 mają `Emoji_Presentation=Yes`) → **kolorowy podzbiór Noto Color Emoji** (na Linuksie to właśnie ten font daje kolor; Windows: Segoe UI Emoji — inny rysunek, też kolorowy);
- ⚔ ☠ ◆ (prezentacja tekstowa) → **mono DejaVu Sans** w kolorze `fillStyle` (już w RR-T8b; T3 ☠ czerwony `#e01e1e`, T2 ⚔ czarny — jak w webie);
- łańcuch per znak: rodziny stosu (mapowanie RR-T8b + `"Noto Color Emoji"` → podzbiór) → DejaVu Sans → podzbiór emoji (zastępuje systemowy fallback emoji).
- **Wyjątek do oceny wzrokowej:** ⛏ 🏔 🏛 🛡 🛤 mają prezentację tekstową, ale DejaVu ich nie ma (P4-25 §3.3) — u nas (i w referencji Chromium z tymi samymi fontami) są kolorowe z Noto; na zrzucie tooltipa 🏛 był mono z nieustalonego fontu systemowego środowiska agentów. Dotyczy wyłącznie R4 (kotwice DOM, RR-T8e). NIE_ZMIERZONO na Windows.

Przykłady „zrzut vs render” (arkusze `dowody/png/<scena>.png`: Chromium | Rust | |różnica|×4, na szarym tle): `t1_revolt_fire`, `t2_siege_swords`, `t3_starving_skull`, `t12_worker_owner0`, `t13_okolica_worked`, `x_emoji_r4_icons`, `x_emoji_alpha_and_colour`, `t10_civ_portrait_grecy-braz`, `t11_badge_soft_l2`, `t14_medallion_portrait_x2`.

---

## 4. Emoji — implementacja i pomiary

### 4.1 Szerokość (`widths.tsv`, 255 wierszy) — `image_metrics::emoji_widths_match_chromium_bit_for_bit`
Zmierzone w Chromium: advance kolorowego glifu **nie** pochodzi z `hmtx` (2550/2048 em), lecz z metryki bitmapy CBDT (136 px przy 109 ppem): 48 px → 59,88990783691406 = 136·48/109 w f32. Szczegółowe bity dopasowano na 129 rozmiarach (6–128 px co 1 + 5 ułamkowych): **`trunc(f32(136 · f32(size/109)) · 65536) / 65536`** — skala strike'u w f32, potem obcięcie do 16.16 (pozycje HarfBuzz) — 128/129. Warianty odrzucone (skrypt dopasowania w scratchpadzie, poza repo): f64 + zaokrąglenie do 16.16 — 95/129, f32 + zaokrąglenie — 78/129, f32 z dokładnego ilorazu + obcięcie — 118/129.
Wynik testu: **252/255 bit w bit** (`to_bits`); 3 **jawne odchylenia** (lista `KNOWN_WIDTH_DEVIATIONS` w teście, z ograniczeniem |Δ|): `20.3px` 🔥 (25,3284 vs 25,3160 — rozmiar ułamkowy, model nieustalony; web używa wyłącznie całkowitych rozmiarów emoji: `Math.round` w `cityOkolicaOverlay.ts:154-155`, literały w `cities.ts:714`, `workerFieldOverlay.ts:98`, `cityOkolicaOverlay.ts:139`), oraz ciąg 16 ikon R4 przy 48 px i 96 px (o 1 ulp f32: 958,238525… vs 958,238464…; kolejność akumulacji w Blink nieodtworzona; web rysuje te ikony po jednej, 16 px — wtedy zgodność bitowa).

### 4.2 Kolor i alfa (Z-7) — eksperyment w Chromium + sceny
Ten sam glif 🔥 48 px z `fillStyle` = `#ffffff`, `rgba(255,0,0,1)`, `rgba(255,255,255,0.5)`, `rgba(0,0,255,0.25)`: piksele dla białego i czerwonego **identyczne** (np. `f4 43 36 ff`), masa alfa 355 517 → 178 358 (×0,5017) → 89 179 (×0,2508), RGB bez zmian (`f3 42 36 80`). **Z-7 potwierdzone:** alfa `fillStyle` mnoży bitmapę, RGB ignorowane. W kodzie: `PixmapPaint::opacity` = alfa koloru wypełnienia (dla gradientu 1,0 — web nie rysuje emoji gradientem). Scena `x_emoji_alpha_and_colour`; mutacja I01.

### 4.3 Położenie i skalowanie
- Początek glifu: kwantyzacja **x do 1/4 px, y do całego px** (jak glify konturowe RR-T8b). Eksperyment: przesunięcie x o 0,25/0,5/0,75 px przesuwa centroid alfy o +0,26/+0,50/+0,75; y o 0,25 — bez zmian, o 0,5 — skok o 1 px. Scena `x_emoji_subpixel`; mutacje I02, I03.
- Prostokąt bitmapy: `(bearingX·s, −bearingY·s, 136·s, 128·s)`, `s = size/109` (metryki CBDT z własnego czytnika CBLC/CBDT — `ttf-parser` nie zwraca advance; zgodność offsetu i PNG z `ttf-parser` sprawdza test jednostkowy).
- Filtr (SSIM, wybrane sceny):

| wariant | t1 🔥 48 px | x_emoji_subpixel | x_emoji_r4_icons | t13_okolica_idle |
|---|---|---|---|---|
| bicubic bez mip | 0,9758 | 0,9533 | 0,9607 | 0,9917 |
| bilinear bez mip | 0,9767 | 0,9541 | 0,9618 | 0,9919 |
| nearest | 0,9590 | 0,9451 | 0,9534 | 0,9904 |
| mip `round(log2)` + bilinear | 0,9988 | 0,9966 | 0,9520 | 0,9897 |
| **mip `floor(log2(1/s))` (box 2×2) + bilinear** (wybrany) | **0,9988** | **0,9966** | **0,9990** | **0,9987** |

### 4.4 Wybór źródła i linie bazowe
`source_chain` (§3); test jednostkowy `selection_is_per_character` (👤 → emoji, ⚔ → DejaVu Bold, w stosie T13 ⚔ → emoji, cyfra → Liberation). Linia bazowa całego napisu z **pierwszej** twarzy łańcucha (Chromium: font główny) — dla stosu T13 (`"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`) to font emoji: wzory P4-29 §3.3 na jego metrykach OS/2/hhea (1900/500, upem 2048). `baselines.tsv`: **72/72 bit w bit** (`image_metrics::emoji_baselines_match_chromium`); mutacja I10.

---

## 5. Obrazy

### 5.1 Pomniejszanie bitmap (`raster::image::mip`)
Chromium 141 (programowy raster) przy `drawImage` z pomniejszeniem bierze poziom mip `floor(log2(1/skala))` (box 2×2, zaokrąglenie `(a+b+c+d+2)>>2`) i próbkuje go dwuliniowo (`[zewn.]` mechanizm; model wyznaczony pomiarem). `MippedImage` buduje łańcuch do 1×1, `draw_bitmap` wybiera poziom ze skali urządzenia (CTM × prostokąt docelowy / rozmiar obrazu, większa oś) i woła **istniejące** `Canvas2dLite::draw_image` (bilinear, krawędzie bez AA, klip, cień — RR-T8a). SSIM bez mip → z mip: `t10_civ_portrait_grecy-braz` 0,9776 → 0,9907, `t14_medallion_portrait_x1` 0,9243 → 0,9975, `x2` 0,9530 → 0,9956, `x3` 0,9846 → 0,9957, `x4` 0,9800 → 0,9940, `x_jpeg_downscale` 0,9725 → 0,9973. Mutacje I18–I20.

### 5.2 SVG
`draw_svg`: dokument renderowany przez `resvg` wprost do warstwy rozmiaru płótna z transformacją CTM × prostokąt docelowy × (rozmiar docelowy / rozmiar własny), potem warstwa składana 1:1 (`draw_image` z transformacją jednostkową — klip i stan płótna zachowane, CTM przywracane). Porównanie strategii (SSIM):

| scena | wektor w rozdzielczości urządzenia (wybrany) | bitmapa rozmiaru własnego + mip | bitmapa 2× rozmiaru własnego + mip |
|---|---|---|---|
| t11_badge_soft_l2 | **0,9974** | 0,9383 | 0,9832 |
| t14_prod_icon_x3 | **0,9987** | 0,9111 | 0,9987 |
| x_svg_scaled_x3 | **0,9975** | 0,9654 | 0,9913 |
| x_svg_rotated_clipped | **0,9986** | 0,9436 | 0,9885 |

Dodatkowo sprawdzone i odrzucone dla wektora: nadpróbkowanie ×2 / ×4 (box) — średnio gorzej; przesunięcie o ±0,05 px — gorzej (centroid różni się o ≤ 0,055 px, to różnica AA, nie przesunięcie).

### 5.3 `prepareSvgForCanvas`
Port (`svg::prepare_svg_for_canvas`): `currentColor` → kolor, `stroke-width="<[0-9.]+>"` → `parseFloat × boost` przez **`js_to_fixed`** (ECMA-262: „większe n przy remisie” = połówka w górę na dokładnej wartości binarnej; Rust `{:.2}` zaokrągla remisy do parzystej — inaczej np. dla 1,6875). Referencja: **funkcja weba ze źródła pinu** (`render/unitOwnerEmblem.ts:224`, typy usunięte `node:module.stripTypeScriptTypes`), uruchomiona w node na 7 wejściach SVG + 2 przypadkach brzegowych × 6 kolorów × 5 współczynników (1,6; 1,2; 1; 1,125; 0,5): **270/270 identycznych** (`image_metrics::prepare_svg_for_canvas_matches_the_web_function`). Wejścia SVG = wynik `normalizeSvg` (`ui/icons/brandAssets.ts:50-61`, też ze źródła pinu) dla dokładnie tych wywołań, które robi `main.ts:8528-8541`.

---

## 6. Sceny vs Chromium 141

Generator `tests/fixtures/image/gen.mjs` (node v22.22.0, playwright 1.56.1, **Chromium 141.0.7390.37** headless, `--disable-gpu --force-color-profile=srgb --font-render-hinting=none` — jak RR-T8b). Fonty ładowane jako `FontFace` z **tych samych plików** (`assets/fonts/*`, `assets/emoji/*`); obrazy z **tych samych bajtów** (JPG jako data-URI; SVG przez funkcje weba `prepareSvgForCanvas` + `svgToDataUri` ze źródła pinu). Kod scen to transkrypcja weba z `plik:linia` przy każdej scenie (`scenes.tsv`, kolumna źródła); `drawYieldLine` (T13) wykonywany w przeglądarce dosłownie, a w Rust przez port w teście.

### 6.1 Wyniki (`image_scenes::scenes_match_chromium`, pełny log `dowody/07-image-tests-nocapture.log`)
Progi **jak RR-T8a/b**: SSIM ≥ 0,985, mean_abs ≤ 1,5, px>16 ≤ 5 %.

| scena | rozmiar | max | mean_abs | px>16 % | SSIM | źródło (pin `edb8fb56`) |
|---|---|---|---|---|---|---|
| `t10_civ_portrait_grecy-braz` | 128x128 | 123 | 1.081 | 2.37 | 0.9907 | render/unitOwnerEmblem.ts:385-399 (drawDisc + drawPortrait + ring) |
| `t10_civ_portrait_zulusi-zelazo` | 128x128 | 123 | 1.103 | 2.36 | 0.9908 | render/unitOwnerEmblem.ts:385-399 (drawDisc + drawPortrait + ring) |
| `t10_citystate_sigil_grecy` | 128x128 | 91 | 1.028 | 2.84 | 0.9909 | render/unitOwnerEmblem.ts:376-384 |
| `t10_barbarian_sigil` | 128x128 | 91 | 0.646 | 2.93 | 0.9931 | render/unitOwnerEmblem.ts:366-374 |
| `t10_civ_sigil_default` | 128x128 | 91 | 1.012 | 2.98 | 0.9912 | render/unitOwnerEmblem.ts:403-410 (no portrait → civ sigil) |
| `t10_fallback_glyph_barbarian` | 128x128 | 91 | 0.714 | 3.23 | 0.9930 | render/unitOwnerEmblem.ts:256-263 (drawDisc + fallback glyph) |
| `t10_fallback_glyph_civ` | 128x128 | 91 | 0.924 | 2.89 | 0.9918 | render/unitOwnerEmblem.ts:256-263 (drawDisc + fallback glyph) |
| `t11_badge_soft_l1` | 128x128 | 80 | 0.323 | 1.07 | 0.9981 | render/unitUpgradeBadges.ts:281-298 + :334-339 |
| `t11_badge_soft_l2` | 128x128 | 80 | 0.563 | 1.54 | 0.9974 | render/unitUpgradeBadges.ts:281-298 + :334-339 |
| `t11_badge_soft_l3` | 128x128 | 80 | 0.394 | 1.58 | 0.9979 | render/unitUpgradeBadges.ts:281-298 + :334-339 |
| `t11_badge_armor_l1` | 128x128 | 80 | 0.255 | 0.89 | 0.9986 | render/unitUpgradeBadges.ts:281-298 + :334-339 |
| `t11_badge_armor_l2` | 128x128 | 80 | 0.428 | 1.03 | 0.9981 | render/unitUpgradeBadges.ts:281-298 + :334-339 |
| `t11_badge_armor_l3` | 128x128 | 80 | 0.306 | 1.09 | 0.9985 | render/unitUpgradeBadges.ts:281-298 + :334-339 |
| `t14_medallion_portrait_x1` | 40x40 | 49 | 1.190 | 2.62 | 0.9975 | render/cityMapStatChip.ts:546-572 (portrait, setTransform :846-851) |
| `t14_medallion_portrait_x2` | 80x80 | 52 | 0.998 | 2.50 | 0.9956 | render/cityMapStatChip.ts:546-572 (portrait, setTransform :846-851) |
| `t14_medallion_portrait_x3` | 120x120 | 64 | 0.786 | 1.81 | 0.9957 | render/cityMapStatChip.ts:546-572 (portrait, setTransform :846-851) |
| `t14_medallion_portrait_x4` | 160x160 | 71 | 0.812 | 1.95 | 0.9940 | render/cityMapStatChip.ts:546-572 (portrait, setTransform :846-851) |
| `t14_medallion_sigil_x1` | 40x40 | 30 | 0.937 | 2.19 | 0.9972 | render/cityMapStatChip.ts:546-572 (city-state sigil :617-622) |
| `t14_medallion_sigil_x3` | 120x120 | 64 | 0.519 | 1.37 | 0.9962 | render/cityMapStatChip.ts:546-572 (city-state sigil :617-622) |
| `t14_prod_icon_x1` ⚠ §6.2 | 24x24 | 47 | 1.5755 | 2.95 | 0.9921 | render/cityMapStatChip.ts:658-667 (drawProdIcon 16 px, boost 1.2 :648) |
| `t14_prod_icon_x2` | 48x48 | 127 | 0.948 | 2.43 | 0.9964 | render/cityMapStatChip.ts:658-667 (drawProdIcon 16 px, boost 1.2 :648) |
| `t14_prod_icon_x3` | 72x72 | 39 | 0.492 | 0.89 | 0.9987 | render/cityMapStatChip.ts:658-667 (drawProdIcon 16 px, boost 1.2 :648) |
| `t1_revolt_fire` | 64x64 | 15 | 0.373 | 0.00 | 0.9988 | render/cities.ts:708-716 |
| `t2_siege_swords` | 128x128 | 51 | 0.074 | 0.54 | 0.9998 | render/siegeMarker.ts:35-44 |
| `t3_starving_skull` | 128x128 | 70 | 0.528 | 2.15 | 0.9982 | render/units.ts:6287-6298 |
| `t12_worker_owner0` | 64x64 | 36 | 0.544 | 0.73 | 0.9983 | render/workerFieldOverlay.ts:63-102 |
| `t12_worker_owner1` | 64x64 | 23 | 0.137 | 0.20 | 0.9994 | render/workerFieldOverlay.ts:63-102 |
| `t12_worker_owner3` | 64x64 | 23 | 0.128 | 0.20 | 0.9993 | render/workerFieldOverlay.ts:63-102 |
| `t13_okolica_idle` | 128x72 | 49 | 0.293 | 0.40 | 0.9987 | render/cityOkolicaOverlay.ts:145-228 (3 lines, no worker) |
| `t13_okolica_worked` | 128x98 | 49 | 0.369 | 0.66 | 0.9991 | render/cityOkolicaOverlay.ts:119-228 (worker badge, worked lines) |
| `t13_okolica_one_line` | 128x46 | 36 | 0.217 | 0.31 | 0.9989 | render/cityOkolicaOverlay.ts:145-228 (1 line) |
| `x_emoji_alpha_and_colour` | 192x64 | 15 | 0.230 | 0.00 | 0.9989 | Z-7: fillStyle alpha multiplies a colour glyph, its RGB is ignored |
| `x_emoji_subpixel` | 260x40 | 15 | 0.452 | 0.00 | 0.9966 | origin quantisation: x in 1/4 px, y whole px |
| `x_emoji_sizes` | 400x120 | 19 | 0.168 | 0.01 | 0.9996 | sizes 13 16 18 20 48 104 |
| `x_emoji_r4_icons` | 420x40 | 17 | 0.329 | 0.01 | 0.9990 | P4-25 §3.3: the 16 R4 icons (DOM chip, 16 px span) on canvas |
| `x_emoji_mixed_text` | 300x60 | 38 | 0.098 | 0.22 | 0.9996 | per-character fallback inside one fillText (text + emoji + symbol) |
| `x_emoji_scaled_ctm` | 120x60 | 14 | 0.188 | 0.00 | 0.9997 | setTransform(2) + emoji (T13-like 16 px) |
| `x_emoji_clip_shadow` | 80x80 | 36 | 0.256 | 0.44 | 0.9991 | clip + shadow apply to a colour glyph |
| `x_jpeg_portrait_1to1` | 256x256 | 4 | 0.101 | 0.00 | 0.9992 | JPG decode (zune-jpeg vs libjpeg-turbo), drawImage 1:1 |
| `x_jpeg_downscale` | 100x100 | 15 | 0.503 | 0.00 | 0.9973 | JPG drawImage 256 → 96 (T10 scale), no clip |
| `x_svg_intrinsic` | 48x48 | 48 | 0.303 | 1.69 | 0.9976 | SVG drawn at its intrinsic 40×40 |
| `x_svg_scaled_x3` | 72x72 | 68 | 0.432 | 1.18 | 0.9975 | SVG under setTransform(3): vector at device resolution |
| `x_svg_rotated_clipped` | 100x100 | 47 | 0.230 | 0.84 | 0.9986 | SVG under rotate + clip |

### 6.2 Jedyny wyjątek: `t14_prod_icon_x1`
Ikona produkcji 16 px (`cityMapStatChip.ts:658-667`, boost 1,2 → kreska 1,2 px urządzenia, końcówki okrągłe) na płótnie 24×24 — niemal każdy piksel to krawędź AA, a średnia liczona po małym płótnie. mean_abs **1,5755** (log `dowody/07-image-tests-nocapture.log`:67; w raportach zaokrąglone do 1,576) > 1,5 przy SSIM 0,992 i px>16 2,95 % (w progach); ta sama ikona ×2: 0,95, ×3: 0,49 — w progach. Masa alfa 0,997 referencji, centroid różni się o 0,003/0,055 px; różnica wyłącznie w pokryciu AA krawędzi kresek (tiny-skia/resvg vs Skia w Chromium). Próby poprawy (§5.2) pogarszały wynik. Test ma **jawną listę wyjątków** `MEAN_ABS_EXCEPTIONS = [("t14_prod_icon_x1", 1.6)]` — SSIM i px>16 nadal ścisłe, a próg wyjątku jest zmierzoną wartością zaokrągloną w górę (regresja nadal wykrywana). Do decyzji Evaluatora/orkiestratora: akceptacja jako odchylenie (D-TXT-4 = A przewiduje ocenę wzrokową) albo dalsza praca nad AA kresek SVG.

### 6.3 Co ocenić wzrokiem (po RR-T5, wymaga GPU — NIE_ZMIERZONO)
Na ekranie gry, porównanie z webem na maszynie właściciela (D-RR-2, D-TXT-4 = A): kolorowe emoji Noto zamiast Segoe UI Emoji (Windows) — 🔥 T1, 👤 T12/T13, 🍞🔨💰 T13 (inny rysunek, ten sam rozmiar i układ); ⚔ T2 i ☠ T3 mono DejaVu; ⛏ 🏔 🏛 🛡 🛤 w R4 kolorowe (§3); portrety w medalionach T10/T14 przy LOD 1–4 i po mipmapach GPU (T11); grubość kresek ikon SVG przy małych rozmiarach (§6.2).

---

## 7. Determinizm (`dowody/05-determinism.log`)
`image_scenes::scenes_match_golden_hashes` (FNV-1a 64 bufora premultiplied, `tests/fixtures/image/golden.tsv`, 43 sceny) — 8 przebiegów: rustc **1.87.0** i **1.97.0** × debug/release × 2:
```
golden.tsv body (scene lines) sha256: 97d347062ec15e5f8f85deadc6dc53a00b43a4863142196d73949a1768687f2d
toolchain=1.87.0 profile=debug run=1 scenes=43 sha256(hashes)=97d347062ec15e5f8f85deadc6dc53a00b43a4863142196d73949a1768687f2d EXIT=0
toolchain=1.87.0 profile=debug run=2 scenes=43 sha256(hashes)=97d347062ec15e5f8f85deadc6dc53a00b43a4863142196d73949a1768687f2d EXIT=0
toolchain=1.87.0 profile=--release run=1 scenes=43 sha256(hashes)=97d347062ec15e5f8f85deadc6dc53a00b43a4863142196d73949a1768687f2d EXIT=0
toolchain=1.87.0 profile=--release run=2 scenes=43 sha256(hashes)=97d347062ec15e5f8f85deadc6dc53a00b43a4863142196d73949a1768687f2d EXIT=0
toolchain=stable profile=debug run=1 scenes=43 sha256(hashes)=97d347062ec15e5f8f85deadc6dc53a00b43a4863142196d73949a1768687f2d EXIT=0
toolchain=stable profile=debug run=2 scenes=43 sha256(hashes)=97d347062ec15e5f8f85deadc6dc53a00b43a4863142196d73949a1768687f2d EXIT=0
toolchain=stable profile=--release run=1 scenes=43 sha256(hashes)=97d347062ec15e5f8f85deadc6dc53a00b43a4863142196d73949a1768687f2d EXIT=0
toolchain=stable profile=--release run=2 scenes=43 sha256(hashes)=97d347062ec15e5f8f85deadc6dc53a00b43a4863142196d73949a1768687f2d EXIT=0
```
Wszystkie 8 przebiegów EXIT=0, sha256 hashy identyczny z `golden.tsv` (stable = rustc 1.97.0).
Platforma x86_64 Linux; inne architektury NIE_ZMIERZONO. Przebłogosławienie: `IMAGE_BLESS=1 cargo test --test image_scenes scenes_match_golden_hashes` (tylko po świadomej zmianie). Zrzuty: `IMAGE_DUMP=<katalog>`. `rendering_twice_is_identical` — dwa rendery w jednym procesie bajt w bajt.
Referencje Chromium wygenerowane drugi raz (`dowody/06-chromium-refs-repro.log`): `gen EXIT=0`, `MANIFEST IDENTICAL (67 entries)`, `files not OK: 0` — wszystkie fixtury, wejścia, 43 referencje `ref/*.rgba` i tabele bajt w bajt jak w pierwszym przebiegu.

---

## 8. Testy i bramy

| plik | testy | co sprawdza |
|---|---|---|
| `src/raster/image/*` (unit) | 8 | `toFixed` JS (wartości z node), `parseFloat` prefiksu, podmiana w SVG, podzbiór emoji (23 glify, metryki, PNG dekoduje się), czytnik CBDT vs `ttf-parser`, wybór źródła per znak, poziomy mip, uśrednianie box |
| `tests/image_scenes.rs` | 3 | §6, złote hashe, dwukrotny render |
| `tests/image_metrics.rs` | 3 | §4.1, §4.4, §5.3 |
| `tests/image_assets.rs` | 4 | sha256 (wektory NIST), `assets/emoji/MANIFEST.sha256` + rozmiar ≤ 2 MB + bajty w binarce, `tests/fixtures/image/MANIFEST.sha256` + ≤ 8 MB, wejścia = bajty z `gra/src/assets/portrety/` |

Bramy — `dowody/01-gates.log` (surowe logi z `EXIT=`):
```
## pwd /home/user/The-Game/.claude/worktrees/wf_5b41339e-109-1/rust-port/renderer  HEAD 453c3c79  (working tree: 12 changed/untracked paths)
## rustc rustc 1.97.0 (2d8144b78 2026-07-07) | 1.87: rustc 1.87.0 (17067e9ac 2025-05-09)
$ cargo fmt --all -- --check
EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings
EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings
EXIT=0
$ cargo test --locked --all-targets
EXIT=0
$ cargo +1.87.0 test --locked --all-targets
EXIT=0
(suma `test result` w obu przebiegach testów: 544 passed, 0 failed = 272 na toolchain; clippy na 1.87.0 — cargo-clippy niezainstalowany dla 1.87.0 w kontenerze, NIE_ZMIERZONO jak w P4-28/29)
```

Po bramach: z `assets/emoji/LICENSE-NotoColorEmoji.txt` usunięto końcową pustą linię (`git diff --check`), w `SOURCES.txt` dopisano tę informację i przeliczono `assets/emoji/MANIFEST.sha256`; `cargo test --locked --test image_assets` ponownie: 4 passed, EXIT=0 (font bez zmian, sha256 `c956fc0f…`).

---

## 9. Mutacje (`dowody/08-mutations.py`, log `dowody/08-mutations.log`)
Każda mutacja = jedna podmiana fragmentu (asercja jednokrotnego wystąpienia), uruchomienie `cargo test --lib raster::image` + `tests/image_{scenes,metrics,assets}.rs`, przywrócenie pliku.

| ID | plik | mutacja | wynik | zabija |
|---|---|---|---|---|
| I01 | `src/raster/image/emoji.rs` | fillStyle alpha ignored for colour glyphs (Z-7) | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| I02 | `src/raster/image/emoji.rs` | colour glyph origin x snapped to 1/2 px instead of 1/4 px | **KILLED** | scenes_match_golden_hashes |
| I03 | `src/raster/image/emoji.rs` | colour glyph origin y not snapped to whole pixels | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| I04 | `src/raster/image/emoji.rs` | no mip level for colour glyphs (bilinear from the 109 ppem strike) | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| I05 | `src/raster/image/emoji.rs` | colour glyph filter nearest instead of bilinear | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| I06 | `src/raster/image/emoji.rs` | emoji advance rounded instead of truncated to 16.16 | **KILLED** | emoji_widths_match_chromium_bit_for_bit |
| I07 | `src/raster/image/emoji.rs` | emoji advance from the f64 scale (no f32 strike scale) | **KILLED** | emoji_widths_match_chromium_bit_for_bit |
| I08 | `src/raster/image/emoji.rs` | emoji face before the DejaVu fallback (⚔ ☠ become colour) | **KILLED** | emoji_widths_match_chromium_bit_for_bit, raster::image::emoji::tests::selection_is_per_character |
| I09 | `src/raster/image/emoji.rs` | CSS family "Noto Color Emoji" not mapped to the emoji face | **KILLED** | emoji_baselines_match_chromium, emoji_widths_match_chromium_bit_for_bit, raster::image::emoji::tests::selection_is_per_character |
| I10 | `src/raster/image/emoji.rs` | baseline always from the outline primary face (emoji-primary stacks) | **KILLED** | emoji_baselines_match_chromium |
| I11 | `src/raster/image/emoji.rs` | bitmap vertical bearing sign flipped | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| I12 | `src/raster/image/emoji.rs` | text runs placed with the style baseline (double shift) | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| I13 | `src/raster/image/svg.rs` | toFixed with Rust half-to-even ({:.2}) instead of JS half-up | **KILLED** | prepare_svg_for_canvas_matches_the_web_function |
| I14 | `src/raster/image/svg.rs` | currentColor not replaced | **KILLED** | prepare_svg_for_canvas_matches_the_web_function, raster::image::svg::tests::prepare_replaces_colour_and_width |
| I15 | `src/raster/image/svg.rs` | SVG rasterised at its intrinsic size and scaled as a bitmap | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| I16 | `src/raster/image/svg.rs` | SVG drawn without the current transform | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| I17 | `src/raster/image/svg.rs` | device layer compositing does not restore the transform | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| I18 | `src/raster/image/mip.rs` | bitmap drawImage without mip levels | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| I19 | `src/raster/image/mip.rs` | mip box average truncates instead of rounding | **KILLED** | raster::image::mip::tests::half_averages_with_rounding, scenes_match_golden_hashes |
| I20 | `src/raster/image/mip.rs` | mip level = ceil instead of floor (one level too small) | **KILLED** | raster::image::mip::tests::levels, scenes_match_chromium, scenes_match_golden_hashes |
| I21 | `src/raster/image/jpeg.rs` | JPEG red and blue swapped | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |

**Wynik: 21/21 zabitych** (`dowody/08-mutations.log`, EXIT=0, pierwszy przebieg).

---

## 10. Zmiany poza `raster/image/**` (uzasadnienie)
- `raster/mod.rs`: wyłącznie `pub mod image;`.
- `raster/canvas.rs` (dozwolone „minimalne dotknięcia, jeśli konieczne”), wszystko `pub(crate)`, **zero nowych `pub fn`** (`tests/raster_api_closed.rs`, `tests/text_api_closed.rs` zielone):
  1. `RasterImage::from_pixmap(Pixmap)` — opakowanie pixmapy premultiplied z `resvg` / dekodera PNG / mipmap bez stratnego obiegu premultiplied → straight → premultiplied (jedyny publiczny konstruktor `from_straight_rgba8` przyjmuje straight);
  2. `RasterImage::pixmap()` — odczyt pikseli do budowy łańcucha mip;
  3. `Canvas2dLite::fill_color_alpha()` — alfa koloru wypełnienia (Z-7: Chromium mnoży kolorowy glif przez alfę `fillStyle`); stan płótna jest prywatny, więc bez tego hooka nie da się odtworzyć T12/T13 (alfa 0,92/0,95).
- `Cargo.toml`: `resvg`, `zune-jpeg`, cecha `png-format` w `tiny-skia` (Z-30-1); `Cargo.lock` (§2.3).
- `assets/emoji/**`: font-podzbiór, licencja, `SOURCES.txt`, `MANIFEST.sha256` (razem 52 958 B).

---

## 11. ZAŁOŻENIA (zbiorczo) i NIE_ZMIERZONO
- Z-30-0 … Z-30-6: §1. D-TXT-3: Z-30-3 (§3). Progi metryki: Z-28-6 (D-TXT-4 = A); wyjątek §6.2.
- Z-30-7: skala do wyboru poziomu mip = większa skala osi (przy niejednorodnej skali; web skaluje jednorodnie). Nieparzysty wymiar przy połowieniu: ostatni wiersz/kolumna powielone (u nas nie występuje do używanych poziomów).
- Z-30-8: kolorowy glif przy obrocie/pochyleniu CTM — bez kwantyzacji początku (jak RR-T8b); web nie rysuje emoji pod obrotem.
- Z-30-9: alfa dla wypełnienia gradientem = 1,0 (web nie używa gradientu przy emoji).
- NIE_ZMIERZONO: wygląd na Windows (Segoe UI Emoji / Symbol, DirectWrite) i z GPU; determinizm poza x86_64; `clippy` na 1.87.0 (niezainstalowany w kontenerze, jak P4-28/29); model szerokości emoji dla rozmiarów ułamkowych; kolejność akumulacji szerokości długich ciągów emoji w Blink; ocena prawna znaku towarowego „Noto” `[zewn.]`; atlas/upload/mipmapy GPU (RR-T8d); wpięcie emoji w `Canvas2dLite::fill_text` (Z-30-4).

DEPLOY/PUSH: NIE WYKONANO
