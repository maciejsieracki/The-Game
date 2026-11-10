# P4-29 — Fonty i tekst na CPU (`raster::text`, RR-T8b)

TEMAT: `R-RUSTPORT-P4-29-TEXT-FONTS-Q1` · DOMAIN: GAME · runda 1/5 · Operator (Opus 5.5 medium)
Baza kodu: `origin/rust-port/parity-v2` @ `d8429335` (RR-T8a zintegrowany). Web: pin `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do scratchpadu poza repo, tylko odczyt; generator czyta dane przez `git show edb8fb56:…`; zero buildu weba, zero zmian w `gra/**`).
Decyzje wejściowe (dispatch): **D-TXT-1 = A** (Liberation Sans/Serif Regular+Bold, DejaVu Sans), **D-TXT-2 = A** (fallback per glif; ZAŁOŻENIE wg dispatchu), **D-TXT-4 = A** (+ ocena wzrokowa właściciela później), **D-TXT-5 = A** (Chromium z tymi samymi plikami fontów), **D-TXT-6 = A** (`ab_glyph` kontury+metryki, `rustybuzz` GPOS), MSRV 1.87. Plan: `P4-25-TEXT-RASTER-AUDIT.md` §6 (RR-T8b), rasteryzator: `P4-28-RASTER-SHAPES.md`.
Dowody surowe (w commicie, `*.log` dodane `git add -f`): `dyspozycje/autobot/runs/R-RUSTPORT-P4-29-TEXT-FONTS-Q1/dowody/` — `01-gates.{sh,log}` (bramy), `05-determinism.{sh,log}`, `06-chromium-refs-repro.{sh,log}`, `07-text-tests.sh` + `07-text-tests-nocapture.log` (pełne tabele), `08-mutations.{py,log}` + `08a-mutations-first-pass.log`.

Konwencja: `plik:linia` bez prefiksu = `gra/src/` w pinie `edb8fb56`. `[zewn.]` = wiedza o wnętrzu Chromium/Skia spoza repo, **nieczytana w źródłach** — sprawdzana wyłącznie empirycznie (§4–§5). `NIE_ZMIERZONO` = nie sprawdzone.

---

## 0. Streszczenie

1. Nowy podmoduł `rust-port/renderer/src/raster/text/` (`mod.rs`, `font.rs`, `fonts.rs`) + `pub mod text;` w `raster/mod.rs`. `Canvas2dLite` dostaje 6 członków tekstowych (`set_font`, `set_text_align`, `set_text_baseline`, `fill_text`, `stroke_text`, `measure_text`) — **dokładnie** te z P4-25 §4.1, lista zamknięta testem `tests/text_api_closed.rs`. `#![forbid(unsafe_code)]` bez zmian. `src/lib.rs` **nietknięty** (moduł jest podmodułem `raster`).
2. Zależności: **`ab_glyph =0.2.32`**, **`rustybuzz =0.20.1`** (obie `default-features = false, features = ["std"]`). Lock: +10 pakietów (`ab_glyph`, `ab_glyph_rasterizer`, `owned_ttf_parser`, `ttf-parser`, `rustybuzz`, `core_maths`, `unicode-bidi-mirroring`, `unicode-ccc`, `unicode-properties`, `unicode-script`); `libm`, `bitflags`, `smallvec`, `bytemuck`, `log` były już w locku. Build + testy na **rustc 1.87.0: EXIT=0** (§7). Bez `cosmic-text`/`vello`.
3. Fonty w `rust-port/renderer/assets/fonts/`: 6 plików TTF + 2 licencje + `SOURCES.txt` + `MANIFEST.sha256`, razem **3 069 998 B** (≤ 6 MB). Wkompilowane `include_bytes!`. Test `text_fonts::fonts_match_manifest_sha256` liczy sha256 (własna implementacja FIPS 180-4 sprawdzona wektorami NIST) i porównuje z bajtami w binarce.
4. **`measureText().width`: 5 121/5 121 szerokości bit w bit jak Chromium 141** (test porównuje `to_bits` — obrona r1) (max |Δ| = 0; wszystkie 1 543 unikalne nazwy miast po `toUpperCase` + z „…”, etykiety WZROST% −25…25 co 0,25, liczby, `×N`, cyfry T9, wiersze hover z `buildings.json`/`units.json`, 22+25 liter, interpunkcja, pary kerningowe, symbole z fallbackiem). **Decyzje przycięcia „…”: 12 714/12 714 identyczne** (2 578 przycięte przez web; w tym przypadki brzegowe `maxW == measureText` i wejścia 1–2 jednostek UTF-16 — obrona r1).
5. Linie bazowe (`textBaseline` ×6) — 216/216 wartości `TextMetrics.alphabeticBaseline` zgodne (3 rodziny × 2 grubości × 12 rozmiarów × 6). Parser skrótu `font`: 43/43 sondy (z `bolder` — obrona r1) zgodnych z Chromium co do akceptacji, rozmiaru i grubości.
6. **Sceny: 36** (T5 ×3, T6 ×3, **T9 ×10 cyfr**, T15 ×4, T10 glif ×2, T13 cyfry z cieniem ×2, T14 tekst ×4 skale + wiersz hover, 7 scen semantycznych) — **wszystkie w progach RR-T8a**: SSIM min **0,9933**, mean_abs max **1,34**, px>16 max **4,35 %** (§5).
7. `toUpperCase`: 1 665/1 665 nazw miast i 1 680 punktów kodowych (Latin/Greek/Cyrillic/Armenian + Latin Ext. Additional) identycznie jak V8 (node v22); w całej tablicy V8 (1 552 zmieniających się znaków) **0 różnic**.
8. Determinizm: złote hashe 36 scen identyczne na rustc **1.87.0 i 1.97.0, debug i release, ×2** (§6). Referencje Chromium wygenerowane drugi raz — `MANIFEST.sha256` **identyczny**.
9. Mutacje: **23/23 zabite** (§8) + obrona r1: **9/9** (§8a, w tym E03/E05/E09 Evaluatora). Bramy: fmt / clippy / clippy `gpu` / test stable / test 1.87.0 — EXIT=0 (§7).

---

## 1. Zakres i wykonanie GOAL

| Wymóg dispatchu | Stan |
|---|---|
| pliki fontów D-TXT-1 = A + licencje + sha256 | §2.1; `assets/fonts/{LiberationSans,LiberationSerif}-{Regular,Bold}.ttf`, `DejaVuSans{,-Bold}.ttf` — kopie z `/usr/share/fonts/truetype/` (pakiety `fonts-liberation 1:2.1.5-3`, `fonts-dejavu-core 2.37-8`), `LICENSE-*.txt` z `/usr/share/doc/<pakiet>/copyright` |
| parser skrótu CSS `font` | `raster::text::parse_font` (§3.1), sondy vs Chromium `fontparse.tsv` |
| stos rodzin → font dołączony, fallback per glif | `map_family` + `face_chain` + wybór per znak w `shape_text` (§3.2) |
| metryki/advance/kerning: `ab_glyph` + `rustybuzz`, skala ≠ PxScale | §3.3; test `px_scale_is_not_the_css_em`, mutacja M08 |
| `textAlign`/`textBaseline` | §3.4, `baselines.tsv` |
| `fillText`/`strokeText` jako kontury przez `Canvas2dLite` | §3.5 (styl, gradient, cień, klip, CTM, `lineJoin`) |
| `measureText().width` | §4.1 |
| przycinanie „…” po jednostkach UTF-16 (`truncateName`) | `truncate_name` (`cityMapStatChip.ts:767-779`), `truncate_hover_line` (`:711-716`); §4.2 |
| `toUpperCase` (22 znaki §3.3) | `js_to_upper_case`; §4.4 |
| BEZ emoji/SVG/JPG, BEZ atlasu | emoji → `.notdef` czcionki podstawowej (test `emoji_are_out_of_scope_and_render_notdef`); brak atlasu/uploadu |
| weryfikacja (1) szerokości vs Chromium 141 | §4.1 — bit w bit |
| (2) 22 znaki + interpunkcja bez `.notdef` | `text_fonts::charset_has_no_notdef` |
| (3) T5, T6, T9, T15 vs Chromium SSIM/mean_abs | §5 |
| (4) determinizm 2+ przebiegi, 1.87 vs najnowszy | §6 |
| (5) mutacje ≥ 15 | §8 — 23/23 |
| (6) fonty: manifest sha256 | `assets/fonts/MANIFEST.sha256` + test; fonty są też w `tests/fixtures/text/MANIFEST.sha256` |
| tylko `ab_glyph`, `rustybuzz`; lock commitowany; MSRV 1.87 | §0 pkt 2, §7 |

**Rozstrzygnięcia luk jako ZAŁOŻENIE** (bez pytania, zgodnie z instrukcją):
- **Z-29-0:** sekcja KONTEKST dispatchu (szablon) mówi „bez nowych zależności, `Cargo.lock` nie ruszać” i „dopisz `pub mod` w `src/lib.rs`”; GOAL i ALLOWLISTA każą dodać `ab_glyph`/`rustybuzz`, commitować lock i dopisać `pub mod text;` w `raster/mod.rs`. Przyjęto GOAL+ALLOWLISTĘ (jak Z-28-1 w P4-28). `src/lib.rs` nie zmieniony. Lista „przeczytaj OBOWIĄZKOWO” (P4-4, P4-3, P4-8, P4-11, P4-6) to szablon tematów modelowych; merytorycznie wiążące były P4-25 i P4-28 (przeczytane w całości) — wzorzec weryfikacji wzięto z P4-28 (Chromium Canvas 2D), nie z P4-11 (esbuild/three), z tego samego powodu co Z-28-4.
- **Z-29-1 (mapowanie rodzin):** `Arial`, `Helvetica`, `sans-serif`, `Liberation Sans`, `Arimo` → Liberation Sans; `Times New Roman`, `Times`, `serif`, `Liberation Serif`, `Tinos` → Liberation Serif; `DejaVu Sans` → DejaVu Sans; **każda inna rodzina (`Segoe UI`, `Segoe UI Symbol`, `Segoe UI Emoji`, `Georgia`, `Tahoma`, …) jest pomijana** jak niezainstalowana. Skutek: stos `Georgia, "Times New Roman", serif` → Liberation Serif (zgodne z wnioskiem P4-25 §3.5, że pomiar weba `213,9 px` był na Liberation Serif — potwierdzone tu bit w bit: `UMGUNGUNDLOVU` = 213,876953125); stosy z `Segoe UI` → Liberation Sans przez `Arial`.
- **Z-29-2 (ostatni fallback):** po rodzinach stosu zawsze DejaVu Sans w grubości wg CSS (zastępuje fallback systemowy przeglądarki). Daje ☠ ◆ ⚔ jako glify monochromatyczne — **D-TXT-3 pozostaje otwarte** (emoji/kolor to RR-T8c). Znak, którego nie ma żaden font → `.notdef` fontu podstawowego.
- **Z-29-3 (grubość):** dostępne 400 i 700, więc reguła dopasowania CSS Fonts 4 §5.2 daje: waga > 500 → Bold (600, 700, 900 → 700), w przeciwnym razie Regular (500 → 400). **T9 `900`** rysowany Bold 700 (P4-25 §3.5: brak odmiany Black w D-TXT-1 = A). Chromium z tymi samymi plikami robi to samo (szerokości cyfr T9 bit w bit, brak syntetycznego pogrubienia — SSIM T9 ≥ 0,993).
- **Z-29-4 (kursywa/small-caps/stretch):** parsowane (wartość nie jest odrzucana), ale **nie renderowane** — web ich nie używa (P4-25 §3.2), fontów kursywnych nie dołączono. Chromium zsyntetyzowałby skos; różnica nieobserwowalna dla obecnego kodu.
- **Z-29-5 (jednostki rozmiaru):** `px pt pc in cm mm q` oraz `em`/`%` względem domyślnych 10 px (zmierzone: `12em` → 120 px, `12%` → 1,2 px); `rem`, `ex`, `ch`, jednostki viewportu i słowa kluczowe (`medium`) — odrzucane (web używa tylko `px`).
- **Z-29-6 (hinting referencji):** referencje z `--font-render-hinting=none` (P4-25 Z-4: bez hintingu). Zmierzone (§5.3): z `full` Chromium **zaokrągla advance do całych px** (4 980/5 105 szerokości inne, 131 decyzji przycięcia innych) — to nie jest zachowanie, które zmierzył web (`cityMapStatChip.ts:113-114`: 44,453 px, ułamek). Sonda bez flagi (`p1` w scratchpadzie): `UMGUNGUNDLOVU` 213,876953125, `−99,9%` 44,45263671875 — jak `none`.

---

## 2. Fonty

### 2.1 Pliki (`rust-port/renderer/assets/fonts/`)

| plik | B | sha256 (początek) | pakiet / licencja |
|---|---|---|---|
| LiberationSans-Regular.ttf | 410 820 | `4659bc0c…` | fonts-liberation 1:2.1.5-3 / SIL OFL 1.1 |
| LiberationSans-Bold.ttf | 414 568 | `3973aa50…` | j.w. |
| LiberationSerif-Regular.ttf | 393 692 | `705903ae…` | j.w. |
| LiberationSerif-Bold.ttf | 370 196 | `9e66c25e…` | j.w. |
| DejaVuSans.ttf | 759 720 | `ae7b7855…` | fonts-dejavu-core 2.37-8 / Bitstream Vera + zmiany DejaVu w domenie publicznej |
| DejaVuSans-Bold.ttf | 708 920 | `5c1247ac…` | j.w. |
| LICENSE-Liberation.txt, LICENSE-DejaVu.txt, SOURCES.txt, MANIFEST.sha256 | — | pełne hashe w `MANIFEST.sha256` | — |

**Uwaga licencyjna (korekta wobec dispatchu):** dispatch nazywa cały zestaw „OFL”. Liberation **jest** OFL 1.1 (`LICENSE-Liberation.txt:5-9`); **DejaVu nie jest OFL** — to licencja Bitstream Vera + zmiany w domenie publicznej (`LICENSE-DejaVu.txt:8-11`, `License: bitstream-vera`); `GPL-2+` w tym pliku dotyczy wyłącznie pakietowania Debiana (`Files: debian/*`, `:53-58`), nie fontów. Licencja Vera pozwala na redystrybucję z oprogramowaniem; warunek: zmodyfikowane fonty muszą zmienić nazwę (nie modyfikujemy). Ocena prawna: `[zewn.]`, NIE_ZMIERZONO.

### 2.2 Mapowanie stosów weba (Z-29-1, Z-29-2)

| stos weba (plik:linia) | łańcuch twarzy w Rust |
|---|---|
| `700 22px Georgia, "Times New Roman", serif` (`cityMapStatChip.ts:802`) | Liberation Serif Bold → DejaVu Sans Bold |
| `700 16px / 700 13px / 600 11px / bold 11px Arial, Helvetica, sans-serif` (`:803`, `:94`, `:707`, `:684`) | Liberation Sans Bold → DejaVu Sans Bold |
| `bold 26px / bold 20px Segoe UI, Arial, sans-serif` (`units.ts:6382`, `:6594`) | Liberation Sans Bold → DejaVu Sans Bold |
| `900 118px "Segoe UI", Arial, sans-serif` (`unitStatPlate.ts:609`) | Liberation Sans Bold → DejaVu Sans Bold |
| `bold 58px / bold 20px "Segoe UI Symbol", "Segoe UI", Arial, sans-serif` (`unitOwnerEmblem.ts:260`, `cityMapStatChip.ts:577`) | Liberation Sans Bold → DejaVu Sans Bold (☠/◆ z DejaVu) |
| `bold 16px sans-serif` (`battle/battleScene.ts:18658`) | Liberation Sans Bold → DejaVu Sans Bold |
| `48px serif` (`cities.ts:714`) | Liberation Serif → DejaVu Sans (🔥: brak → `.notdef`, RR-T8c) |

---

## 3. Implementacja

### 3.1 Parser `font` (`src/raster/text/font.rs`)
Gramatyka CSS Fonts 4: `[style || variant || weight || stretch]? size[/line-height]? family#`. Wagi `normal|bold|bolder|lighter|1–1000` (`bolder`/`lighter` względem domyślnej 400 → 700/100), rodziny w cudzysłowach lub ciągi identyfikatorów łączone spacją, generyczne `serif`/`sans-serif` (`"sans-serif"` w cudzysłowie = nazwa rodziny). Niepoprawna wartość → `set_font` zwraca `false` i **zostawia poprzednią** (jak Canvas). Domyślnie `10px sans-serif`. Nierozwiązany cudzysłów kończy się z końcem wejścia (zmierzone: Chromium akceptuje `12px 'unterminated`). Porównanie: `fontparse.tsv` (39 sond: wszystkie fonty weba + przypadki brzegowe) — akceptacja, rozmiar i waga zgodne we wszystkich (`text_metrics::font_shorthand_parsing_matches_chromium`).

### 3.2 Wybór fontu i kształtowanie (`shape_text`)
1. Tekst: U+0009/000A/000C/000D → spacja (HTML „replace all ASCII whitespace with spaces”).
2. Dla każdego znaku pierwsza twarz z łańcucha, która ma glif (cmap ≠ 0) — **fallback per glif** (D-TXT-2 = A).
3. Segmenty: maksymalne ciągi tej samej twarzy, **przy czym każda spacja U+0020 to osobny segment**. Zmierzone: Blink kształtuje słowo po słowie (`CachingWordShaper` `[zewn.]`) — bez tego 197 szerokości różniło się (np. `GEBEL BARKAL` 174,217 vs 175,431 px, kerning `L␠`/`␠B`), a 12 decyzji przycięcia było innych; z segmentacją: 0.
4. Każdy segment: `rustybuzz::shape` (LTR, skrypt zgadywany, domyślne cechy: `kern`/GPOS, `liga`, …). Pozycje w jednostkach fontu × **`size / unitsPerEm`** (nie `ab_glyph::PxScale`, które jest wysokością ascent−descent; P4-25 §4.2 — test `px_scale_is_not_the_css_em`: `−99,9%` 700 13 px = **44,45263671875**, dokładnie wartość Chromium i podstawa `ceil` = 45 w `cityMapStatChip.ts:113-114`).
5. `measureText().width` = suma advance (f64; wartości są dokładnymi ułamkami binarnymi `size/2048`, stąd zgodność bit w bit).

### 3.3 Metryki linii bazowych (`baseline_shift`, zmierzone w Chromium 141)
Przesunięcie w dół od `y` do linii alfabetycznej, z twarzy podstawowej (pierwszej z łańcucha):
- `top` = `round64(typoAsc / (typoAsc + typoDesc) · size)` (OS/2 typo, znormalizowane do em; zaokrąglenie do 1/64 px, 26.6), `middle` = top − size/2, `bottom` = top − size, `alphabetic` = 0;
- `hanging` = `float(0,8 · round(hhea.ascent · size / upem))`, `ideographic` = −`round(hhea.descent · size / upem)`.
Wyprowadzone z danych `baselines.tsv` (np. Liberation Sans 13 px: top 10,078125 = 645/64; DejaVu 100 px: 75,984375 — remis 4 862,5 zaokrąglony w górę). 216/216 zgodne (porównanie w precyzji f32, bo Chromium zwraca `float`). Mutacje M02, M03, M04, M18, M22.

### 3.4 Wyrównanie
`start`/`left` 0, `center` −w/2, `end`/`right` −w (kierunek zawsze `ltr`; `direction` nieużywane przez web).

### 3.5 Rysowanie (`fill_text` / `stroke_text`)
Kontury z `ab_glyph::Font::outline` (TrueType: odcinki i krzywe kwadratowe; kontury rozpoznawane po nieciągłości i jawnym odcinku zamykającym, który dokłada `ab_glyph`) → **jedna ścieżka w przestrzeni urządzenia** (`tiny_skia::PathBuilder`) → `Canvas2dLite` wypełnia (non-zero, AA) albo obrysowuje (`lineWidth`, `lineJoin`, czapka `butt`, miter 10, grubość w jednostkach użytkownika) **z tym samym stylem, gradientem, cieniem i klipem co kształty**. Bieżąca ścieżka (`beginPath`…) nie jest dotykana (scena `x_text_path_untouched`).
**Pozycjonowanie glifów (zmierzone, §5.2):** przy CTM bez obrotu/pochylenia początek każdego glifu w przestrzeni urządzenia jest kwantyzowany do **1/4 px w poziomie** i **całego piksela w pionie** (subpixel positioning pamięci glifów Skii `[zewn.]`, odtworzone empirycznie). Przy obrocie — bez kwantyzacji (lepsza zgodność `x_text_rotated_gradient`). Mutacje M06, M07, M20.
**AA:** pokrycie w skali szarości tiny-skia, bez hintingu i subpikseli (P4-25 Z-4).

### 3.6 Zmiany w `raster/canvas.rs` (poza `text/**`, uzasadnienie)
Dispatch dopuszcza „minimalne udostępnienie API `Canvas2dLite` potrzebne do rysowania konturów glifów”. Zmiany (wyłącznie `pub(crate)`, **zero nowych `pub fn`** — lista RR-T8a w `tests/raster_api_closed.rs` bez zmian i zielona):
1. pole `text: TextState` w prywatnym `State` (+ `Default`) — w Canvas 2D `font`/`textAlign`/`textBaseline` należą do stanu zapisywanego przez `save()`/`restore()` (scena `x_text_save_restore_font`, mutacja M23); nie da się tego zrobić poza `canvas.rs`, bo `State` jest prywatny;
2. `ctm()`, `text_state()`, `text_state_mut()` — odczyt CTM i stanu tekstu z modułu `text`;
3. `fill_device_path(path)` — wypełnienie ścieżki stylem wypełnienia + cień + klip (te same 3 linie co `fill()`, ale bez bieżącej ścieżki);
4. `stroke_device_path(path)` — wydzielona z dotychczasowego `stroke_segs` (który teraz ją woła; zachowanie kształtów bit w bit — złote hashe `raster_scenes` bez zmian).
`raster/path.rs`: **bez zmian**. `raster/mod.rs`: wyłącznie `pub mod text;`.

---

## 4. Weryfikacja metryk (bez rasteru)

Generator `tests/fixtures/text/gen.mjs` (node v22.22.0, playwright 1.56.1, **Chromium 141.0.7390.37** headless, `--disable-gpu --force-color-profile=srgb --font-render-hinting=none`). Fonty ładowane jako `FontFace` pod prywatnymi nazwami (`CivLiberationSans`, …) z **tych samych plików** co `assets/fonts/`; stosy weba tłumaczone `mapFont()` (druga, niezależna implementacja Z-29-1) + zawsze `CivDejaVuSans` na końcu, więc Chromium nie sięga do fontów systemowych. Dane weba z pinu przez `git show edb8fb56:gra/data/{city-names-pools,buildings,units}.json`.

### 4.1 Szerokości (`widths.tsv`, 5 105 wierszy) — `text_metrics::measure_text_widths_match_chromium`
**max |Δ| = 0**; od obrony r1 test porównuje **bitowo** (`to_bits`, ±0 równe) zamiast tolerancji 1e-9 — mutacja „+1 ulp” (O7) jest zabijana. Zawartość: 1 543 unikalne nazwy miast (z 1 665 wartości) po `trim().toUpperCase()` fontem nazwy, te same + „…”, 201 etykiet `formatCityGrowthPercentLabel` (kopia `cityMapStatChip.ts:741-747`) + „—”, liczby populacji/tur/grup/plonów, `×2…×99`, cyfry 0–9 `900 118px`, 42+75 wierszy hover, oraz dla każdego z 16 fontów weba: każdy z 22+25 znaków i interpunkcji osobno, ciągi znaków, „ZAŻÓŁĆ GĘŚLĄ JAŹŃ”, pary kerningowe `AV To LT Wa Yo Te P. F, VA «»`; ☠ ◆ ⚔ `A☠B` `◆1` w 6 stosach (fallback).

### 4.2 Przycinanie (`truncate.tsv`, 12 714 przypadków; obrona r1: +94 brzegowe, §8a) — `truncation_decisions_match_the_web`
Web: pętle **dosłownie** z `cityMapStatChip.ts:767-779` (`truncateName`) i `:711-716` (wiersz hover) wykonane w Chromium. Rust: `truncate_name` / `truncate_hover_line` — pętla po **jednostkach UTF-16** (`Vec<u16>`, `pop()` = `slice(0,-1)`, `len()` = `length`; połówka pary zastępczej → U+FFFD przy pomiarze). Budżety nazw 305, 285, 266, 240, 213,8, 180, 120, 60 px (z `CITY_NAME_BUDGET_BASE` 305 `:138` minus sloty `:87-88`, `:199`). **0 różnic**, 2 532 przypadki przycięte.

### 4.3 Linie bazowe i parser — §3.1, §3.3.

### 4.4 `toUpperCase` (`text_upper.rs`)
`upper.tsv`: wszystkie punkty kodowe, dla których `toUpperCase` w V8 (node v22.22.0) zmienia znak (1 552). Rust `str::to_uppercase`: 22 litery §3.3 → identycznie; `ßı` → `SSI` jak JS; 1 665/1 665 nazw miast; 1 680 punktów kodowych bloków europejskich ściśle; w całej tablicy 0 różnic (różnica wersji Unicode V8/Rust możliwa w przyszłości — test ścisły tylko dla bloków europejskich).

---

## 5. Sceny vs Chromium (piksele)

### 5.1 Wyniki (`text_scenes::scenes_match_chromium`, pełny log `dowody/07-text-tests-nocapture.log`)
Metryka i progi **jak RR-T8a** (`raster::metric`; ZAŁOŻENIE Z-28-6 / D-TXT-4 = A): SSIM ≥ 0,985, mean_abs ≤ 1,5, px>16 ≤ 5 %.

| scena (źródło) | max | mean | px>16 % | SSIM |
|---|---|---|---|---|
| t5_stack_badge_x2 / x3 / x12 (`units.ts:6374-6385`, cała kanwa) | 51 | 1,16 / 1,19 / 1,28 | 3,93 / 3,96 / **4,35** | 0,9954 / 0,9953 / 0,9954 |
| t6_turn_label_1 / 7 / 23 (`units.ts:6580-6597`) | 33–74 | 0,14–0,29 | 0,34–1,01 | 0,9990–0,9997 |
| t9_power_digit_0…9 (`unitStatPlate.ts:608-617`, `strokeText` 28 px round + `fillText`, 900 118px) | 36–111 | 0,22–0,73 | 0,66–3,42 | **0,9933**–0,9988 |
| t15_group_number_1 / 2 / 7 / 10 (`battleScene.ts:18652-18661`) | 18–34 | 0,12–0,48 | 0,13–0,77 | 0,9989–0,9994 |
| t10_glyph_barbarian ☠ / civ ◆ (`unitOwnerEmblem.ts:260-263`, DejaVu mono) | 80 / 42 | 0,56 / 0,11 | 1,45 / 0,26 | 0,9980 / 0,9995 |
| t13_yield_digits_idle / worked (`cityOkolicaOverlay.ts:157-178`, cień 2/3 px) | 46 / 41 | 0,18 / 0,19 | 0,49 / 0,51 | 0,9981 / 0,9993 |
| t14_text_x1 / x1_5 / x2 / x3 (`cityMapStatChip.ts:851`, `:898-925`, `:759-763`, `:577-580`, `:684-687`) | 63–85 | **1,34** / 0,41 / 0,60 / 0,21 | 3,43 / 0,87 / 1,44 / 0,59 | 0,9943 / 0,9980 / 0,9969 / 0,9985 |
| t14_hover_row_x2 (`:707-717`) | 68 | 0,50 | 1,59 | 0,9978 |
| x_text_align / baselines / rotated_gradient / charset_sans / charset_serif / save_restore_font / path_untouched | 41–66 | 0,13–0,30 | 0,80–2,23 | 0,9983–0,9996 |

### 5.2 Skąd różnice i co zmierzono
- **Pozycjonowanie glifów** (największy efekt, zmierzone wariantami): bez kwantyzacji 25/36 scen poza progami (T9 SSIM 0,950, centroid alfy T9 przesunięty o +0,5 px w pionie); `y` do całego px → w progach poza trzema (T5: px>16 5,15–5,37 %); `y` całe + `x` 1/4 px → **36/36**; `x` do całego px — gorzej (T15 SSIM 0,946). Dla obróconej sceny kwantyzacja pogarsza (mean 0,25 → 0,43), więc wyłączona przy obrocie.
- **Pokrycie AA glifów:** Chromium rysuje ciemny tekst wyraźnie „cieniej” — masa alfa `x_text_charset_sans` (tekst `#101010`) w Chromium 542 844 vs nasze 692 878 (−22 %), a jasny glif `t10_glyph_civ` (`#f4ead2`) tylko −1,3 %. Pasuje do korekcji gamma/kontrastu masek glifów Skii zależnej od jasności koloru `[zewn., niezweryfikowane]`; **nie odtwarzano** (wymagałoby tablic Skii, poza D-TXT-6). To dominuje w `max_abs` i px>16 scen z małym ciemnym tekstem (T5, T14 x1).
- Kwantyzacja AA tiny-skia (krok 1/4 pokrycia, P4-28 §5.3) — jak w kształtach.

### 5.3 Wpływ hintingu Chromium (pomiar Z-29-6)
Ten sam generator z `--font-render-hinting=full` (wynik w scratchpadzie, nie w repo): 4 980/5 105 szerokości inne (całe px, np. `GRECY` 80 vs 79,449), 131/12 620 decyzji przycięcia innych, sceny: SSIM do 0,826, max_abs 255. Wniosek: referencje i implementacja bez hintingu (Z-4); zachowanie web-u na Windows (DirectWrite) — **NIE_ZMIERZONO**.

### 5.4 Co ocenić wzrokiem (po RR-T5, wymaga GPU — NIE_ZMIERZONO)
Ocena 1:1 na ekranie gry, porównanie z webem na maszynie właściciela (D-RR-2, D-TXT-4 = A): cyfry T9 po mipmapach (obrys 28 px przy oddalonej kamerze), `×N` T5 i numery tur T6 (mały ciemny/jasny tekst — różnica gęstości AA §5.2), nazwa miasta T14 przy LOD 1–4 (Liberation Serif zamiast Georgii — inny kształt, ta sama metryka co Times New Roman), wiersz hover 11 px, symbole ☠/◆ z DejaVu (D-TXT-3), cyfry T13 z cieniem.

---

## 6. Determinizm (`dowody/05-determinism.log`)
`text_scenes::scenes_match_golden_hashes` (FNV-1a 64 bufora premultiplied, `tests/fixtures/text/golden.tsv`, 36 scen) — 8 przebiegów: rustc **1.87.0** i **1.97.0** × debug/release × 2: wszystkie EXIT=0, sha256 wydrukowanych hashy identyczny. Platforma x86_64 Linux; inne architektury NIE_ZMIERZONO. Przebłogosławienie: `TEXT_BLESS=1 cargo test --test text_scenes scenes_match_golden_hashes` (tylko po świadomej zmianie). Zrzuty: `TEXT_DUMP=<katalog>`.
Referencje Chromium wygenerowane drugi raz: `MANIFEST.sha256` (51 wpisów, w tym `gen.mjs` i 6 fontów) **identyczny** (`dowody/06-chromium-refs-repro.log`). Rozmiar `tests/fixtures/text/`: 3 858 973 B (< 8 MB) — nic nie pominięto.

---

## 7. Testy i bramy

| plik | testy | co sprawdza |
|---|---|---|
| `src/raster/text/*` (unit) | 10 | parser (formy weba, prefiksy, błędne wartości, cudzysłów), mapowanie stosów, PxScale ≠ em, fallback per glif, białe znaki, `round_64` |
| `tests/text_metrics.rs` | 6 | §4.1–4.3, niepoprawny font zostaje, domyślny `10px sans-serif` |
| `tests/text_scenes.rs` | 4 | §5, złote hashe, dwukrotny render, kompletność manifestu |
| `tests/text_fonts.rs` | 6 | sha256 (wektory NIST), sha256 fixtur `tests/fixtures/text/MANIFEST.sha256` (obrona r1), manifest + rozmiar ≤ 6 MB + bajty w binarce, brak `.notdef` (22+25+ASCII+`×…−—·%,!→`), fallback ☠◆⚔ → DejaVu, emoji → `.notdef` (RR-T8c) |
| `tests/text_upper.rs` | 3 | §4.4 |
| `tests/text_api_closed.rs` | 3 | 6 członków tekstowych, brak nieużywanych, `canvas.rs` bez nowych `pub fn` |

Bramy — `dowody/01-gates.log` (surowe logi z `EXIT=`):
```
$ cargo fmt --all -- --check                                         EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings                 EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings  EXIT=0
$ cargo test --locked --all-targets           (rustc 1.97.0)         EXIT=0   253 passed, 0 failed
$ cargo +1.87.0 test --locked --all-targets   (MSRV rustc 1.87.0)    EXIT=0   253 passed, 0 failed
(HEAD bazowy d8429335; skrypt dowody/01-gates.sh; clippy na 1.87.0 — cargo-clippy niezainstalowany w kontenerze, NIE_ZMIERZONO jak w P4-28)
Po bramach: z LICENSE-DejaVu.txt usunięto 2 końcowe spacje (git diff --check) i przeliczono assets/fonts/MANIFEST.sha256;
`cargo test --locked --test text_fonts` ponownie: 5 passed, EXIT=0 (pliki TTF bez zmian).
```

---

## 8. Mutacje (`dowody/08-mutations.py`, log `dowody/08-mutations.log`)
Każda mutacja = jedna podmiana fragmentu (asercja jednokrotnego wystąpienia), uruchomienie `cargo test --lib raster::text` + 5 plików `text_*`, przywrócenie pliku.

| ID | plik | mutacja | wynik | zabija |
|---|---|---|---|---|
| M01 | `src/raster/text/mod.rs` | no word-by-word shaping (kerning across spaces) | **KILLED** | measure_text_widths_match_chromium, truncation_decisions_match_the_web |
| M02 | `src/raster/text/mod.rs` | em-box ascent not rounded to 1/64 px | **KILLED** | baselines_match_chromium, raster::text::tests::round_64_is_26_6 |
| M03 | `src/raster/text/mod.rs` | middle baseline = em ascent - size/3 | **KILLED** | baselines_match_chromium |
| M04 | `src/raster/text/mod.rs` | hanging baseline kept in f64 (Chromium: float) | **KILLED** | baselines_match_chromium |
| M05 | `src/raster/text/mod.rs` | textAlign center shifts by the full width | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| M06 | `src/raster/text/mod.rs` | glyph origin y not snapped to whole pixels | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| M07 | `src/raster/text/mod.rs` | glyph origin x snapped to 1/2 px instead of 1/4 px | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| M08 | `src/raster/text/mod.rs` | advance scale = PxScale height (ascent-descent) instead of em | **KILLED** | measure_text_widths_match_chromium, raster::text::tests::px_scale_is_not_the_css_em, truncation_decisions_match_the_web |
| M09 | `src/raster/text/mod.rs` | shaping without the kern feature (no GPOS kerning) | **KILLED** | measure_text_widths_match_chromium, truncation_decisions_match_the_web |
| M10 | `src/raster/text/mod.rs` | per-glyph fallback disabled (always the primary face) | **KILLED** | raster::text::tests::per_glyph_fallback_switches_face, symbols_fall_back_to_dejavu |
| M11 | `src/raster/text/mod.rs` | tab not replaced by a space | **KILLED** | raster::text::tests::whitespace_is_replaced_by_space |
| M12 | `src/raster/text/mod.rs` | truncateName measures without the ellipsis | **KILLED** | truncation_decisions_match_the_web |
| M13 | `src/raster/text/fonts.rs` | weight 500 selects Bold | **KILLED** | raster::text::fonts::tests::web_stacks_map_like_a_browser_without_windows_fonts |
| M14 | `src/raster/text/fonts.rs` | sans-serif mapped to DejaVu Sans | **KILLED** | measure_text_widths_match_chromium |
| M15 | `src/raster/text/font.rs` | bold = 600 | **KILLED** | font_shorthand_parsing_matches_chromium, raster::text::font::tests::prefix_keywords_and_line_height, raster::text::font::tests::web_font_strings_parse |
| M16 | `src/raster/text/font.rs` | em relative to 16px | **KILLED** | font_shorthand_parsing_matches_chromium, raster::text::font::tests::prefix_keywords_and_line_height |
| M17 | `src/raster/canvas.rs` | fillText painted with the stroke style | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| M18 | `src/raster/text/mod.rs` | ideographic baseline sign flipped | **KILLED** | baselines_match_chromium |
| M19 | `src/raster/text/mod.rs` | glyph outline y not flipped (font y-up kept) | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| M20 | `src/raster/text/mod.rs` | origin snapping also under rotation | **KILLED** | scenes_match_golden_hashes |
| M21 | `src/raster/text/mod.rs` | invalid font resets to the default instead of keeping the value | **KILLED** | invalid_font_keeps_previous_value |
| M22 | `src/raster/text/mod.rs` | bottom baseline = -em ascent | **KILLED** | baselines_match_chromium |
| M23 | `src/raster/canvas.rs` | text state not part of save/restore (restore keeps current text state) | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |

**Wynik: 23/23 zabitych** (`dowody/08-mutations.log`, EXIT=0). Historia (uczciwie): pierwszy przebieg (`dowody/08a-mutations-first-pass.log`) dał **22/23** — przeżyła M04 (hanging liczone w f64 zamiast `float`), bo `baselines_match_chromium` porównywał w precyzji f32. Test zaostrzono do porównania bitowego (`to_bits`; wszystkie wartości Chromium i nasze są dokładnymi ułamkami binarnymi) i powtórzono cały zestaw.

---

## 8a. Obrona r1 (zarzuty Evaluatora r1, PASS-WITH-NOTES)

Zmiany wyłącznie w `tests/fixtures/text/{gen.mjs,widths.tsv,truncate.tsv,fontparse.tsv,MANIFEST.sha256}`, `tests/text_metrics.rs`, `tests/text_fonts.rs` i tym dokumencie. Kod `src/**` bez zmian. Referencje odtworzone tym samym `gen.mjs` w Chromium 141.0.7390.37: **wszystkie 36 plików `ref/*.rgba`, `scenes.tsv`, `baselines.tsv`, `upper.tsv`, `city_names.txt`, `versions.txt` — sha256 identyczne jak w r1** (zmieniły się tylko pliki z nowymi wierszami). Fixtury: 3 869 084 B (≤ 8 MB).

| # | zarzut | odpowiedź | dowód |
|---|---|---|---|
| 1 | E03 (`<=`→`<` w `truncate_name`) przeżyła — brak przypadku `maxW == measureText(name)` | **PRZYJMUJĘ.** `gen.mjs`: `maxW` podany jako `['w', tekst]` jest liczony **w Chromium** (`measureText(tekst).width`, dokładny float) — 40 nazw z budżetem = szerokość nazwy (`cityMapStatChip.ts:773` `<=`), 40 z budżetem = szerokość `nazwa[..-2]+'…'` (pętla `:775` `>` w równości), 3+3 analogicznie dla wiersza hover (`:711`, `:713`). Test liczy i wymaga ≥ 40 przypadków „mieści się dokładnie” (zmierzone 43). | O1 KILLED; O4 (`>`→`>=` w pętli nazwy), O5 (`>`→`>=` hover) KILLED |
| 2 | E09 (`units.len() > 1` → `> 2`) i E05 (`bolder` → 400) przeżyły | **PRZYJMUJĘ.** Hover `AB`, `Ż·`, `WA` (2 jednostki) i `A`, `·` (1) przy `maxW = 1`; nazwy `AB`, `ŻÓ`, `A` (strażnik `s.length > 1`, `:774`). Sondy `fontparse.tsv`: `bolder 10px x`, `bolder 22px Arial, sans-serif`, `italic bolder 12px x` (Chromium serializuje `bold` → 700) i `bolder lighter 12px x` (odrzucone — dwie wagi). Dodatkowo `widths.tsv` +16 wierszy `bolder`/`lighter` (wybór twarzy Bold/Regular, bit w bit). | O2, O3, O6 KILLED |
| 3 | `measureText` porównywane z tolerancją 1e-9, nie `to_bits` | **PRZYJMUJĘ.** `same_bits()` (`to_bits`, ±0 równe) we `measure_text_widths_match_chromium` i `baselines_match_chromium`; `WIDTH_TOL` usunięty. | O7 (szerokość ×(1+ε), +1 ulp) KILLED |
| 4 | `manifest_lists_every_fixture` nie sprawdza sha256 fixtur | **PRZYJMUJĘ.** Nowy `text_fonts::fixtures_match_manifest_sha256` liczy sha256 (ta sama implementacja FIPS 180-4) każdej linii `tests/fixtures/text/MANIFEST.sha256` (fixtury, 36 `ref/*.rgba`, 6 fontów przez `../../../assets/fonts/`) i wymaga, by każdy plik katalogu i `ref/` był na liście. Wyjątek jawny: `golden.tsv` — pisany przez test Rust (`TEXT_BLESS=1`), nie przez `gen.mjs`, więc nie w manifeście generatora (ujawnione przez nowy test przy pierwszym uruchomieniu). | O8 (dopisany bajt w `versions.txt`), O9 (1 bit w `ref/t10_glyph_civ.rgba`) KILLED |
| 5 | `dowody/01-gates.log` pokazuje HEAD bazowy `d8429335` | **PRZYJMUJĘ (formalnie).** Bramy r1 biegły na drzewie roboczym przed commitem. W obronie bramy uruchomione **po** commicie kodu obrony — `dowody/02-obrona-gates.log` zapisuje HEAD = SHA tego commita. | `dowody/02-obrona-gates.log` |

Mutacje obrony: `dowody/02-obrona-mutations.py`, log `dowody/02-obrona-mutations.log` — **9/9 KILLED** (O1–O9).

## 9. ZAŁOŻENIA (zbiorczo) i NIE_ZMIERZONO
- Z-29-0 … Z-29-6: §1. Progi metryki: Z-28-6 (D-TXT-4 = A).
- Z-29-7: emoji i znaki spoza wszystkich trzech rodzin → `.notdef` twarzy podstawowej (Chromium sięgnąłby po font systemowy); to zakres RR-T8c/D-TXT-3. W scenach i tabelach takich znaków nie ma.
- Z-29-8: kontury ab_glyph są rozpoznawane po nieciągłości; kontur zaczynający się dokładnie w punkcie końca poprzedniego zostałby sklejony — dla fill (non-zero) bez znaczenia, dla stroke możliwe dodatkowe złącze. W fontach Liberation/DejaVu nieobserwowane w scenach (T9 `strokeText` w progach).
- Z-29-9: `fillText` składa wszystkie glify w jedną ścieżkę non-zero; Skia rysuje maski glifów osobno — różnica tylko przy nakładających się glifach z półprzezroczystym kolorem (w tekstach weba nie występuje).
- NIE_ZMIERZONO: zachowanie Chromium na Windows/DirectWrite i z GPU (referencje = raster programowy Linux); korekcja gamma/kontrastu masek glifów Skii (§5.2); determinizm poza x86_64; `clippy` na 1.87.0 (niezainstalowany w kontenerze, jak w P4-28); wygląd po mipmapach/GPU (§5.4); emoji/obrazy (RR-T8c); atlas/upload (RR-T8d).

DEPLOY/PUSH: NIE WYKONANO
