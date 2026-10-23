# P4-34 — Kotwice DOM → Rust (RR-T8e): etykiety R4, R5, R15a, R15b na `Canvas2dLite`

TEMAT: `R-RUSTPORT-P4-34-ANCHORS-DOM-Q1` · DOMAIN: GAME · runda 1/5 · Operator (Opus 5.5 medium)
Baza kodu: `origin/rust-port/parity-v2` @ `df3027b7`. Web: pin `edb8fb56` (wyłącznie `git show` w generatorze referencji; zero buildu weba, zero zmian w `gra/**`). Plan: `P4-25-TEXT-RASTER-AUDIT.md` §2.3 i §6 (wiersz RR-T8e). Rasteryzator: RR-T8a (`P4-28`), tekst RR-T8b (`P4-29`), emoji RR-T8c (`P4-30`, D-TXT-3).
Dowody surowe (w commicie, `*.log` dodane `git add -f`): `dyspozycje/autobot/runs/R-RUSTPORT-P4-34-ANCHORS-DOM-Q1/dowody/` — `01-gates.{sh,log}`, `03-probe*.mjs` + `03-probe-*.json` + `03-probes.log` (sondy Chromium) + `03-lineheight-rule.{py,log}`, `05-determinism.{sh,log}`, `06-chromium-refs-repro.{sh,log}`, `07-labels-tests.sh` + `07-labels-tests.log` (pełne tabele), `08-mutations.{py,log}` (+ `08a-…first-pass.log`, `08b-…disk-full.log`), `09-sheets.sh` + `09-sheet.py` + `png/` (7 arkuszy Chromium | Rust | |różnica|×4).

Konwencja: `plik:linia` bez prefiksu = `gra/src/` w pinie `edb8fb56`. `[zewn.]` = wiedza o wnętrzu Chromium spoza repo, nieczytana w źródłach — sprawdzana wyłącznie empirycznie. `NIE_ZMIERZONO` = nie sprawdzone.

---

## 0. Streszczenie

1. **Nowy moduł `civ_renderer::labels`** (`rust-port/renderer/src/labels/`, 6 plików): układ HTML dokładnie tych struktur, które web buduje (padding, `border`, `border-radius`, `<br>`, flex wiersz/kolumna z `gap`, łamanie przy `max-width`, `text-align:center`), rasteryzacja na `Canvas2dLite` (`box-shadow` przycięty na zewnątrz ramki, tło, ramka, `text-shadow` jako rozmycie Gaussa, tekst RR-T8b, emoji R4 przez `raster::image::emoji` wg D-TXT-3), `opacity` elementu, projekcja kotwicy świat → ekran z macierzy kamery i wspólny mechanizm „float label” R15a/R15b (wznoszenie `riseRate·age`, wygaszanie `1 − p²`, usunięcie przy `p ≥ 1`). W `src/lib.rs` dopisana **jedna linia** `pub mod labels;`. Bez nowych zależności, `Cargo.toml`/`Cargo.lock` bez zmian, bez GPU, bez hit-testu.
2. **Układ bit w bit jak Chromium 141** na prawdziwym DOM/CSS weba: 45 scen (87 fragmentów tekstu) + przegląd **1 984 etykiet** (wszystkie 1 528 unikalnych nazw miast puli w R5, R15a 0–300, R15b 0–120, R4 każda ikona × poprawny/niepoprawny) — **0 różnic** (`to_bits`). Zmierzone i odtworzone reguły Blinka (§3): metryki fontu zaokrąglane do px, `line-height` = `LayoutUnit(round64(fs)·k)`, pół-interlinia z podłogą do całego px, szerokość tekstu = `ceil` do 1/64, **tekst DOM kształtowany jednym przebiegiem (kerning przez spację, inaczej niż Canvas)**, **ułamkowy rozmiar fontu = klucz cache fontów obcięty do 1/100 px, FreeType do 26.6** (`<small>` R5 = 11/1,2 px → 9,16 → 9,15625).
3. **Piksele vs Chromium (zrzut elementu DOM)**: 45/45 scen w progach RR-T8a–c (SSIM ≥ 0,985, mean ≤ 1,5, px>16 ≤ 5 %), **bez wyjątków**: SSIM min **0,9873** (R5), mean max **0,92**, px>16 max **3,42 %** (§5). Obejmuje HiDPI ×2 (3 sceny) i klatki zanikania p = 0 / 0,25 / 0,5.
4. **Kotwice i animacja bit w bit z kodem weba** wykonanym w node (three@0.169.0, kod wycięty z pinu): `worldToClientPx` (24 + 6 `null`), `updateSiegeHtmlLabels` (12), `worldToScreen` bitwy (12), położenie chipu R4 (18), prostokąty Chromium z transformacją etykiety (21), `_tickFloatLabels` (48 klatek, 8 usunięć) (§4).
5. Determinizm: złote hashe 45 scen identyczne na rustc **1.87.0 i 1.97.0, debug i release, ×2** (§6). Referencje wygenerowane drugi raz — `MANIFEST.sha256` **identyczny**. Mutacje: **29/29 zabitych** (§7). Bramki: §8.
6. Ocena wzrokowa 1:1 w scenie (sprite na mapie, GPU): **NIE_ZMIERZONO** — lista „co ocenić wzrokiem po RR-T5” w §10.

---

## 1. Zakres i źródła weba

| Grupa | Web (pin `edb8fb56`) | Struktura DOM | Kotwica |
|---|---|---|---|
| R4 chip budowy | `main.ts:12851-12968`: cssText `:12853-12859`, `IMPROVEMENT_CHIP` `:12863-12867`, `innerHTML` `:12959-12964`, ramka `:12965`, położenie `:12967-12968`; ikony `:13049`, `:13052`, `:13061` (🏛), `:13070` (🔨), powód `:13075-13077` | `div` flex (wiersz; kolumna `align-items:flex-start` gdy niepoprawny z powodem) › `span` flex `gap:6px` › [`span 16px/1` ikona, `span` tekst] + `span` powodu `11px`, `max-width:220px` | `hexCenterClientPx` (`:12939-12942`, `topYAt + 1,5`) → `worldToClientPx` (`input/picker.ts:101-117`), `left = Math.round(x + 14)`, `top = Math.round(y − 40)`, bez transformacji |
| R5 oblężenie | `main.ts:14560-14603`: `innerHTML` `:14569`, cssText `:14570-14576`, kotwica `:14566` (`topY + 1,1`), aktualizacja `:14582-14603` | `div` blok, `text-align:center`, `white-space:nowrap` › `span 18px` ⚔ + tekst ` OBŁĘŻENIE` + `<br>` + `<small>` nazwa | `wp.project(camera)`; `z > 1` → ukryte; `left/top = Math.round(…)`; `transform: translate(-50%,-100%)` |
| R15a obrażenia (bitwa) | `battle/battleScene.ts:9091-9117`: tekst `:9093`, styl `:9094-9105`, `floatLabels.push` `:9111-9117` | `div` z tekstem w nakładce bitwy (`:2710-2720`) | `worldToScreen` (`:19419-19432`), `left/top = sp + 'px'`, `transform: translate(-50%, -50%)` |
| R15b mur (bitwa) | `battle/battleScene.ts:7477-7493`: styl `:7480-7485`, push `:7488-7492`; wywołania `:7225` (`'-'+dmg+' (mur)'`, `#ff8800`), `:7311` (`MUR WYBURZONY!`, `#ff4400`) | jak R15a, `13px` | jak R15a |
| R15a/R15b animacja | `battle/battleScene.ts:8624-8642` `_tickFloatLabels` | — | `wp.y += age·riseRate`; `p = min(1, age/duration)`; `p ≥ 1` → usunięcie; `opacity = String(1 − p²)` |

Uwaga nazewnicza: `P4-5B-MAP-UI-SEAM.md` §7 nazywa „R15b” martwy kod `manualBattle.ts:1207`; ten temat używa nazw z `P4-25` §2.3 (R15b = etykiety muru `_spawnWallLabel`), jak dispatch. R6 (galeria dev) poza zakresem (D-UI-7).

Arkusz stylów strony: `gra/index.html` `<style>` (tryb standardów `<!DOCTYPE html>`, `* { margin: 0; padding: 0; box-sizing: border-box; }`) — wpływa na układ; inne reguły CSS dotyczące `span`/`small`/`div` w pinie są zawężone klasami (`git grep -n -E '(^|[^a-zA-Z-])(small|span)\s*\{' edb8fb56 -- 'gra/src/**/*.ts' 'gra/src/**/*.css'` → 9 trafień, wszystkie pod klasą/ID innego komponentu).

**ALLOWLISTA — wykonane zmiany:** `rust-port/renderer/src/labels/{mod,layout,shape,paint,anchor,style}.rs` (nowe), `rust-port/renderer/src/lib.rs` (+1 linia `pub mod labels;` między `jsmath` i `material`), `rust-port/renderer/tests/labels_{layout,scenes,anchors}.rs` (nowe), `rust-port/renderer/tests/fixtures/labels/**` (2 898 057 B < 8 MB, nic nie pominięto), ten dokument, `dyspozycje/autobot/runs/R-RUSTPORT-P4-34-ANCHORS-DOM-Q1/**`. Zero zmian w `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `rust-port/renderer/src/{geom,pick,assets,camera,terrain,models,decor,core,jsmath,raster,units,cities}/**`, `Cargo.toml`, `Cargo.lock`.

## 2. Moduł `labels` (API)

| Plik | Zawartość |
|---|---|
| `mod.rs` | `Label` (`BuildChip{icon,valid,reason}`, `Siege{city}`, `Damage{dmg}`, `Wall{text,color}`) → `layout()`, `transform()`, `render(dsf, opacity)` |
| `style.rs` | stałe weba jako dane (padding, promienie, kolory, cienie, fonty, teksty, tabela ikon `IMPROVEMENT_CHIP`, `riseRate`, `duration`, przesunięcia kotwic) + **dosłowne** łańcuchy CSS weba (`R4_CSS_WEB`, `R5_CSS_WEB`, `R15A_STYLE_WEB`, `R15B_STYLE_WEB`); margines tekstury `shadow_margin` |
| `layout.rs` | `LayoutUnit` (1/64), metryki fontu, `line-height`, pudełka liniowe, `layout_r4/r5/r15a/r15b` → `LabelLayout { width, height, decoration, fragments, text_shadows }` |
| `shape.rs` | pomiar węzła tekstowego DOM (`dom_shape`): jeden przebieg na font, rozmiar klucza fontu (`font_key_px`), rozmiar FreeType (`effective_font_px`), arytmetyka 16.16 |
| `paint.rs` | `render_label(layout, dsf, opacity) → LabelTexture` (premultiplied RGBA8, margines na cienie) |
| `anchor.rs` | `ProjectionCamera` (`Vector3.project`), `world_to_client_px`, `siege_label_position`, `battle_world_to_screen`, `build_chip_left_top`, `anchored_rect` (transformacja etykiety), `FloatLabel::{spawn, frame, screen}` |

Stałe wizualne są w `style.rs` (dane), nie w logice; test `constants_are_the_webs` sprawdza je z wartościami wyciętymi z pinu przez generator (`consts.tsv`) i z dosłownym CSS.

## 3. Układ — reguły Chromium 141 (zmierzone)

Sondy: `dowody/03-probe2.mjs` (wysokości/prostokąty struktur CSS), `03-probe4.mjs` (`measureText` przy ułamkowych rozmiarach), `03-probe5.mjs` (kerning przy 9,1666667 px); wynik `03-probes.log`. Wszystkie w Chromium 141.0.7390.37 headless, te same pliki fontów co `assets/` (D-TXT-5 = A).

### 3.1 Metryki fontu i `line-height`
- Ascent/descent/line gap fontu **podstawowego** (pierwszego w łańcuchu): hhea × rozmiar / upem w `f32`, zaokrąglone do całych px (`floor(x + 0,5)`). Liberation Sans 12 px: 11/3/0; 15 px bold: 14/3/0 (`normal` = 17, zmierzone `17`); 13 px: 12/3/0 (15).
- `line-height: <liczba>` = `LayoutUnit(round64(font-size) · k)` — rozmiar zaokrąglony do 1/64, iloczyn w `f32`, **obcięty** do 1/64. Sonda: 91 wierszy (17 rozmiarów × 4 mnożniki, 5 rozmiarów ułamkowych × 4, 3 struktury) — 91/91 zgodne (`dowody/03-lineheight-rule.{py,log}`) (np. 18 px × 1,3 = 23,4 → **23,390625**; 9,1666667 × 1,3 → 11,921875; 25 × 1,15 → 28,75). Hipotezy odrzucone pomiarem: zaokrąglenie zamiast obcięcia (`18×1,3`), surowy rozmiar bez 1/64 (`9,1666667×1,3`), sufit rozmiaru (`9,1×1,2`).
- Pół-interlinia: `half = (lh − (A+D)·64) / 2` (dzielenie całkowite w `LayoutUnit`), nad tekstem `floor` do całego px, reszta pod tekstem (`16px/1`: tekst o 1 px nad pudełkiem — zmierzone `y = −1`).
- Pudełko liniowe = strut bloku + każde pudełko inline na linii, wyrównane do linii bazowej.

### 3.2 Szerokość tekstu w DOM ≠ `measureText`
Zmierzone na przeglądzie 1 984 etykiet (`sweep.tsv`), kolejne hipotezy:
1. `measureText` (RR-T8b/c) + `ceil` do 1/64: R4, R15 — zgodne; R5 `<small>` — w 45 scenach wszystkie 7 fragmentów `<small>` niezgodne (Chromium węższy o 1/64–0,13 px).
2. **Rozmiar efektywny**: przy ułamkowym `font-size` Chromium rysuje i mierzy font o innym rozmiarze — przewaga `M` (1706 j.) daje dokładnie 9,15625 dla 9,1666667 i 9,171875, 9,171875 dla 9,18, 9,09375 dla 9,1, 9,078125 dla 9,09375, 12,296875 dla 12,3, 12,28125 dla 12,296875, liczby całkowite bez zmian (`03-probes.log`, sonda 4). Reguła zgodna z 11/11: rozmiar klucza cache fontów Blinka = `(unsigned)(size·100)/100` [zewn.: `FontCacheKey`, nieczytane], FreeType = ten rozmiar obcięty do 26.6. Po tej poprawce (przegląd 1 984 etykiet) zostało 15 niezgodnych (wszystkie ze spacją przed `A`/`Y`/`W` albo z parą kerningową `Ta`, `Te`, `Tr`, `Av`, `Ly`).
3. **Kerning przez spację**: Canvas kształtuje słowo po słowie (RR-T8b, `CachingWordShaper`), DOM — cały węzeł jednym przebiegiem (`Calleva Atrebatum`: para `spacja–A`, −0,34 px). Po tej poprawce: 11 niezgodnych o 1/64 px.
4. **Skala kerningu = rozmiar klucza (9,16), nie CSS (9,1666667) ani FreeType (9,15625)**: `Ta` przy 9,1666667 px = 10,00543212890625, czyli T + a (przy 9,15625) + kern −44 554/65 536; dokładnie `(−152·em_mult + 32768) >> 16` przy `x_scale = (int)(9,16f·65536)`; `Av` (−76 j.) analogicznie. Po tej poprawce: **0/1 984 niezgodnych**.

Implementacja `labels::shape::dom_shape`: przy rozmiarze całkowitym arytmetyka identyczna z `raster::text::shape_text` (f64), przy ułamkowym — pozycje 16.16 (przewaga FreeType `FT_MulDiv` przy rozmiarze 26.6 + kerning HarfBuzz `em_mult` przy rozmiarze klucza). Rysowanie: słowo po słowie (silnik RR-T8b) w pozycjach pióra z `dom_shape`, czcionką o rozmiarze efektywnym.

### 3.3 Struktury
- **R4**: wewnętrzny wiersz flex: ikona (`16px/1`, wysokość 16) i tekst (`12px/1.2`, 14,390625); wysokość wiersza = max, wyrównanie w osi poprzecznej `(H − h)/2` w `LayoutUnit` (obcięcie: 0,796875). Kolumna (niepoprawny + powód): wiersz, `gap` 6, powód: szerokość = `min(max-content, 220)`, łamanie zachłanne na spacjach w `LayoutUnit`; szerokość chipu = max(wiersz, powód). Zmierzone: 102×30 (poprawny), 123,359375×30 (niepoprawny), 242×62,375 (z powodem, 2 linie).
- **R5**: dwie linie (`<br>`), strut `bold 11px/1.3` (14,296875); linia 1 = `span 18px` (lh 23,390625) + ` OBŁĘŻENIE`; linia 2 = `<small>` (11/1,2 = 9,166667 px w `f32`, lh 11,921875); szerokość = max szerokości linii (shrink-to-fit), linie centrowane `(W − w)/2` z obcięciem. Zmierzone 106,15625×50,3125 dla krótkich nazw.
- **R15**: jedna linia `normal`, szerokość = tekst.

Wynik: `labels_layout::layout_matches_chromium_bit_for_bit` (45 scen, 87 fragmentów) i `layout_sweep_matches_chromium_bit_for_bit` (1 984 etykiety, 5 076 fragmentów) — **0 różnic**, porównanie `to_bits` pudełka i każdego fragmentu (x, y, w, h).

## 4. Kotwice, transformacje, animacja

Generator wycina z pinu i wykonuje w node (z three@0.169.0): `worldToClientPx` (`input/picker.ts:101-117`), ciało `updateSiegeHtmlLabels` (`main.ts:14582-14603`), `worldToScreen` (`battleScene.ts:19419-19432`), przypisania położenia chipu (`main.ts:12967-12968`), ciało `_tickFloatLabels` (`battleScene.ts:8624-8642`). Dwie kamery: mapy (`_syncCamera` jak `pick::camera::PickCamera` — test sprawdza, że macierze z `PickCamera::matrices` są **bitowo** równe macierzom three) i dowolna druga (fov 45, `lookAt`). Rust: `Vector3.project` = `applyMatrix4(matrixWorld.invert())` → `applyMatrix4(projection)` (`pick::three`).

| Porównanie (`tests/labels_anchors.rs`) | Liczba | Wynik |
|---|---|---|
| `worldToClientPx` (w tym prostokąt z przesunięciem `left/top`) | 24 (6 `null` za płaszczyzną `z > 1`) | bit w bit |
| położenie chipu R4 `Math.round(x+14)`, `Math.round(y−40)` | 18 | bit w bit |
| `updateSiegeHtmlLabels` (`display`, `left`, `top`) | 12 (3 `none`) | bit w bit |
| `worldToScreen` bitwy | 12 | bit w bit |
| prostokąt etykiety w Chromium (`getBoundingClientRect` z transformacją weba) | 21 (R4 ×6, R5 ×6, R15a ×6, R15b ×3) | bit w bit (`f32`) |
| `_tickFloatLabels`: `left`, `top`, `opacity`, usunięcie | 48 klatek (2 kamery × 2 etykiety × 12 czasów; 8 usunięć przy `p ≥ 1`) | bit w bit |

Zmierzona reguła położenia: CSS `left/top` → `LayoutUnit(float)` (obcięcie: `640.0078125px` → 640), `translate(-50%, …)` dokładnie w `f32` względem pudełka w `LayoutUnit` (np. R15b: 640 − 122,765625/2 = 578,6171875).

## 5. Piksele vs Chromium

### 5.1 Metoda
`tests/fixtures/labels/gen.mjs` (node v22.22.0, playwright 1.56.1, Chromium 141.0.7390.37 headless, `--disable-gpu --force-color-profile=srgb --font-render-hinting=none`) buduje element **kodem i CSS wyciętymi z pinu** (cssText, obiekty stylu, `innerHTML`, ciało synchronizacji chipu) w stronie z `<style>` z `gra/index.html`, mapuje rodziny na dołączone fonty (`mapFamilyList`, lustro `raster::text`/`raster::image::emoji`) i robi zrzut strony z przezroczystym tłem (PNG RGBA → dekoder w node → `ref/<scena>.rgba`). Na potrzeby zrzutu element stoi w `(M, M)` z `transform: none` (transformacja i położenie są porównywane liczbowo, §4). Margines `M` = `ceil(1,5·blur + |offset|) + 1` (R4 26, R5 19, R15 10). Metryka i progi jak RR-T8a–c (`raster::metric`, ZAŁOŻENIE D-TXT-4 = A).

### 5.2 Wyniki (`labels_scenes::scenes_match_chromium`, pełny log `dowody/07-labels-tests.log`)

| scena | rozmiar (px urządzenia) | max | mean | px>16 % | SSIM |
|---|---|---|---|---|---|
| `r4_valid_00` | 154x82 | 58 | 0.372 | 0.958 | 0.9953 |
| `r4_valid_01` | 154x82 | 58 | 0.376 | 0.958 | 0.9953 |
| `r4_valid_02` | 154x82 | 58 | 0.363 | 0.958 | 0.9953 |
| `r4_valid_03` | 154x82 | 58 | 0.373 | 0.958 | 0.9953 |
| `r4_valid_04` | 154x82 | 58 | 0.374 | 0.958 | 0.9953 |
| `r4_valid_05` | 154x82 | 58 | 0.364 | 0.958 | 0.9953 |
| `r4_valid_06` | 154x82 | 58 | 0.367 | 0.958 | 0.9953 |
| `r4_valid_07` | 154x82 | 58 | 0.371 | 0.958 | 0.9953 |
| `r4_valid_08` | 154x82 | 58 | 0.371 | 0.958 | 0.9953 |
| `r4_valid_09` | 154x82 | 58 | 0.373 | 0.958 | 0.9953 |
| `r4_valid_10` | 154x82 | 58 | 0.362 | 0.958 | 0.9953 |
| `r4_valid_11` | 154x82 | 58 | 0.368 | 0.958 | 0.9953 |
| `r4_valid_12` | 154x82 | 58 | 0.372 | 0.958 | 0.9953 |
| `r4_valid_13` | 154x82 | 58 | 0.373 | 0.958 | 0.9953 |
| `r4_valid_14` | 154x82 | 58 | 0.368 | 0.958 | 0.9953 |
| `r4_valid_15` | 154x82 | 58 | 0.381 | 0.958 | 0.9953 |
| `r4_valid_16` | 154x82 | 58 | 0.362 | 0.958 | 0.9953 |
| `r4_invalid_farm` | 176x82 | 58 | 0.384 | 0.977 | 0.9945 |
| `r4_invalid_city` | 176x82 | 58 | 0.392 | 0.977 | 0.9946 |
| `r4_invalid_fallback` | 176x82 | 58 | 0.376 | 0.977 | 0.9946 |
| `r4_invalid_road_reason` | 294x115 | 58 | 0.452 | 1.346 | 0.9951 |
| `r4_valid_road_reason_ignored` | 154x82 | 58 | 0.371 | 0.958 | 0.9953 |
| `r4_dsf2_valid` | 308x164 | 55 | 0.193 | 0.406 | 0.9976 |
| `r4_dsf2_reason` | 588x230 | 61 | 0.268 | 0.680 | 0.9976 |
| `r5_0` | 145x89 | 48 | 0.695 | 1.038 | 0.9881 |
| `r5_1` | 145x89 | 48 | 0.737 | 1.108 | 0.9880 |
| `r5_2` | 145x89 | 48 | 0.840 | 1.472 | 0.9876 |
| `r5_3` | 145x89 | 48 | 0.916 | 1.697 | 0.9873 |
| `r5_4` | 145x89 | 48 | 0.754 | 1.116 | 0.9880 |
| `r5_5` | 177x89 | 48 | 0.867 | 1.657 | 0.9879 |
| `r5_dsf2` | 290x178 | 74 | 0.381 | 0.562 | 0.9929 |
| `r15a_1` | 34x37 | 24 | 0.331 | 0.954 | 0.9980 |
| `r15a_7` | 34x37 | 69 | 0.449 | 1.113 | 0.9958 |
| `r15a_23` | 42x37 | 44 | 0.521 | 1.351 | 0.9975 |
| `r15a_105` | 51x37 | 45 | 0.660 | 2.332 | 0.9959 |
| `r15b_dmg_12` | 76x35 | 52 | 0.763 | 2.368 | 0.9972 |
| `r15b_dmg_3` | 69x35 | 38 | 0.758 | 2.774 | 0.9963 |
| `r15b_breach` | 143x35 | 57 | 0.883 | 3.417 | 0.9962 |
| `r15a_dsf2` | 84x74 | 57 | 0.368 | 0.724 | 0.9959 |
| `float_r15a_p000` | 42x37 | 44 | 0.521 | 1.351 | 0.9975 |
| `float_r15b_p000` | 143x35 | 57 | 0.883 | 3.417 | 0.9962 |
| `float_r15a_p025` | 42x37 | 42 | 0.508 | 0.965 | 0.9972 |
| `float_r15b_p025` | 143x35 | 53 | 0.872 | 2.897 | 0.9952 |
| `float_r15a_p050` | 42x37 | 33 | 0.405 | 0.579 | 0.9976 |
| `float_r15b_p050` | 143x35 | 42 | 0.695 | 1.938 | 0.9957 |

**Wyjątki: brak.** Najniższe SSIM: R5 (0,987–0,988). Różnice (arkusze `dowody/png/`): krawędzie AA tekstu (znana różnica pokrycia masek glifów Skii, P4-29 §5.2) i narożniki zaokrąglonej ramki (rasteryzator tiny-skia vs Skia).

### 5.3 Ustalenia z pikseli
- **HiDPI (dsf 2)**: pierwsza wersja (przyciąganie pudełka i linii bazowej w pikselach urządzenia) dawała SSIM 0,962 (R5) i 0,976 (R4 z powodem) — Chromium przyciąga prostokąt pudełka i pozycję tekstu w **px CSS**, potem skaluje (pudełko R5 100 px urządzenia zamiast 101; druga linia 1 px wyżej). Po poprawce 0,9929 / 0,9976. Przy dsf 1 bez zmian.
- `box-shadow`: rozmycie Gaussa σ = blur/2 kształtu pudełka, **przycięte na zewnątrz** ramki (tło 0,88–0,92 nie pokazuje cienia pod spodem).
- `text-shadow`: warstwy od ostatniej (spód) do pierwszej, przesunięcie w całych px, σ = blur/2.
- `opacity`: mnożenie premultiplied RGBA przez `1 − p²` (`f32`); klatki p = 0,25 / 0,5 w progach.
- Kolorowe emoji R4 (16 ikon + 🏛 + 🔨) i ⚔ (monochromatyczny DejaVu) — jak D-TXT-3 (RR-T8c), bez zmian w `raster/**`.

## 6. Determinizm (`dowody/05-determinism.log`)

```text
golden.tsv body (scene lines) sha256: c861fccee4cd75bb40f572ccb11ff61f23e56805efd6e62b0a37238dbba69e0e
toolchain=1.87.0 (1.87.0) profile=debug run=1 scenes=45 sha256(hashes)=c861fccee4cd75bb40f572ccb11ff61f23e56805efd6e62b0a37238dbba69e0e EXIT=0
toolchain=1.87.0 (1.87.0) profile=debug run=2 scenes=45 sha256(hashes)=c861fccee4cd75bb40f572ccb11ff61f23e56805efd6e62b0a37238dbba69e0e EXIT=0
toolchain=1.87.0 (1.87.0) profile=--release run=1 scenes=45 sha256(hashes)=c861fccee4cd75bb40f572ccb11ff61f23e56805efd6e62b0a37238dbba69e0e EXIT=0
toolchain=1.87.0 (1.87.0) profile=--release run=2 scenes=45 sha256(hashes)=c861fccee4cd75bb40f572ccb11ff61f23e56805efd6e62b0a37238dbba69e0e EXIT=0
toolchain=stable (1.97.0) profile=debug run=1 scenes=45 sha256(hashes)=c861fccee4cd75bb40f572ccb11ff61f23e56805efd6e62b0a37238dbba69e0e EXIT=0
toolchain=stable (1.97.0) profile=debug run=2 scenes=45 sha256(hashes)=c861fccee4cd75bb40f572ccb11ff61f23e56805efd6e62b0a37238dbba69e0e EXIT=0
toolchain=stable (1.97.0) profile=--release run=1 scenes=45 sha256(hashes)=c861fccee4cd75bb40f572ccb11ff61f23e56805efd6e62b0a37238dbba69e0e EXIT=0
toolchain=stable (1.97.0) profile=--release run=2 scenes=45 sha256(hashes)=c861fccee4cd75bb40f572ccb11ff61f23e56805efd6e62b0a37238dbba69e0e EXIT=0
```

8/8 przebiegów: ten sam zestaw 45 hashy = `golden.tsv` (test `scenes_match_golden_hashes` asercją, `EXIT=0`). Architektura: x86_64 (inne: NIE_ZMIERZONO).

## 7. Mutacje (`dowody/08-mutations.{py,log}`)

Każda mutacja zmienia jeden fragment (sprawdzane: występuje dokładnie raz), uruchamia testy `--lib labels` i `--no-fail-fast` `labels_scenes`, `labels_layout`, `labels_anchors`, zapisuje testy zabijające i przywraca plik.

| ID | plik | mutacja | wynik | testy zabijające |
|---|---|---|---|---|
| M01 | `src/labels/layout.rs` | LayoutUnit(float) rounds instead of truncating (line-height) | **KILLED** | anchored_rects_match_chromium, layout_matches_chromium_bit_for_bit, layout_sweep_matches_chromium_bit_for_bit, line_height_rules |
| M02 | `src/labels/layout.rs` | text width rounded to 1/64 instead of ceil | **KILLED** | anchored_rects_match_chromium, layout_matches_chromium_bit_for_bit, layout_sweep_matches_chromium_bit_for_bit, scenes_match_golden_hashes |
| M03 | `src/labels/layout.rs` | half-leading not floored to whole px | **KILLED** | anchored_rects_match_chromium, layout_matches_chromium_bit_for_bit, layout_sweep_matches_chromium_bit_for_bit, scenes_match_chromium, scenes_match_golden_hashes, texture_sizes_match_the_generator |
| M04 | `src/labels/layout.rs` | line-height from the raw font size (no 1/64 rounding) | **KILLED** | anchored_rects_match_chromium, layout_matches_chromium_bit_for_bit, layout_sweep_matches_chromium_bit_for_bit, line_height_rules |
| M05 | `src/labels/layout.rs` | font metrics floored instead of rounded | **KILLED** | anchored_rects_match_chromium, layout_matches_chromium_bit_for_bit, layout_sweep_matches_chromium_bit_for_bit, line_height_rules, scenes_match_chromium, scenes_match_golden_hashes, texture_sizes_match_the_generator |
| M06 | `src/labels/layout.rs` | R5 first line not centred | **KILLED** | layout_matches_chromium_bit_for_bit, layout_sweep_matches_chromium_bit_for_bit, scenes_match_chromium, scenes_match_golden_hashes |
| M07 | `src/labels/layout.rs` | R4 text span not centred on the cross axis | **KILLED** | layout_matches_chromium_bit_for_bit, layout_sweep_matches_chromium_bit_for_bit, scenes_match_chromium, scenes_match_golden_hashes |
| M08 | `src/labels/layout.rs` | R4 reason max-width ignored | **KILLED** | anchored_rects_match_chromium, layout_matches_chromium_bit_for_bit, layout_sweep_matches_chromium_bit_for_bit, scenes_match_chromium, scenes_match_golden_hashes, texture_sizes_match_the_generator |
| M09 | `src/labels/layout.rs` | R4 border colours swapped (valid/invalid) | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| M10 | `src/labels/shape.rs` | DOM text shaped word by word (no kerning across spaces) | **KILLED** | layout_sweep_matches_chromium_bit_for_bit |
| M11 | `src/labels/shape.rs` | GPOS kerning scaled by the quantised size instead of the font-key size | **KILLED** | layout_sweep_matches_chromium_bit_for_bit |
| M12 | `src/labels/shape.rs` | font-key size not truncated to 1/100 px | **KILLED** | layout_sweep_matches_chromium_bit_for_bit |
| M13 | `src/labels/style.rs` | `smaller` ratio 1.25 instead of 1.2 | **KILLED** | anchored_rects_match_chromium, layout_matches_chromium_bit_for_bit, layout_sweep_matches_chromium_bit_for_bit, line_height_rules, scenes_match_chromium, scenes_match_golden_hashes, small_is_parent_over_1_2_in_f32, texture_sizes_match_the_generator |
| M14 | `src/labels/paint.rs` | box-shadow not clipped to outside the border box | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| M15 | `src/labels/paint.rs` | shadow Gaussian sigma = blur (CSS: blur / 2) | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| M16 | `src/labels/paint.rs` | text-shadow offsets negated | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| M17 | `src/labels/paint.rs` | element opacity not applied | **KILLED** | float_frames_fade_like_css, scenes_match_chromium, scenes_match_golden_hashes |
| M18 | `src/labels/paint.rs` | box snapped in device px instead of CSS px (HiDPI) | **KILLED** | scenes_match_chromium, scenes_match_golden_hashes |
| M19 | `src/labels/paint.rs` | text baseline not snapped to whole CSS px | **KILLED** | scenes_match_golden_hashes |
| M20 | `src/labels/paint.rs` | text-shadow layers in list order (first at the bottom) | **KILLED** | labels::paint::tests::first_text_shadow_is_on_top |
| M21 | `src/labels/anchor.rs` | translate(-50%, -50%) applied as -100% vertically | **KILLED** | anchored_rects_match_chromium |
| M22 | `src/labels/anchor.rs` | CSS left/top not converted to LayoutUnit (round instead of trunc) | **KILLED** | anchored_rects_match_chromium |
| M23 | `src/labels/anchor.rs` | fade 1 - p instead of 1 - p² | **KILLED** | float_label_frames_match_tick_float_labels |
| M24 | `src/labels/anchor.rs` | float label kept at p == 1 | **KILLED** | float_label_frames_match_tick_float_labels |
| M25 | `src/labels/anchor.rs` | no rise | **KILLED** | float_label_frames_match_tick_float_labels |
| M26 | `src/labels/anchor.rs` | siege position floored instead of Math.round | **KILLED** | projections_match_the_web_bit_for_bit |
| M27 | `src/labels/anchor.rs` | worldToClientPx without the far-plane test | **KILLED** | projections_match_the_web_bit_for_bit |
| M28 | `src/labels/anchor.rs` | Math.round ties to even/away (x - f > 0.5) | **KILLED** | anchored_rects_match_chromium, js_round_is_math_round |
| M29 | `src/labels/style.rs` | R15 glow blur 5 px instead of 6 px | **KILLED** | constants_are_the_webs, scenes_match_chromium, scenes_match_golden_hashes, texture_sizes_match_the_generator |

**Wynik: 29/29 zabitych** (`08-mutations.log`, `EXIT=0`). Historia (uczciwie): pierwszy przebieg (`08a-mutations-first-pass.log`) dał **28/29** — przeżyła M20 (kolejność warstw `text-shadow`): obie warstwy weba są czarne, więc dla danych weba zamiana kolejności jest nieobserwowalna (mutant równoważny w scenach). Dodano test jednostkowy `labels::paint::tests::first_text_shadow_is_on_top` (dwie warstwy w różnych kolorach, CSS: pierwsza na wierzchu). Drugi przebieg (`08b-mutations-second-pass-disk-full.log`) przerwał brak miejsca na dysku współdzielonym (od M12 „KILLED (build)” to błąd zapisu, nie zabicie) — odrzucony; trzeci, pełny przebieg z `CARGO_INCREMENTAL=0` to `08-mutations.log`. Po przebiegu mutacji zmieniono wyłącznie format pustych komórek TSV fixtur (`-` zamiast pustego pola na końcu wiersza — `git diff --check`) i odpowiadające mu 2 parsery w testach; kod `src/labels/**` i referencje `ref/*.rgba` bez zmian; bramki, testy, determinizm i odtworzenie referencji uruchomiono ponownie po tej zmianie (logi 01, 05, 06, 07). M19 zabija tylko złoty hash (przesunięcie linii bazowej o ułamek px przy dsf 1 mieści się w progach metryki).

## 8. Bramki (`dowody/01-gates.log`, surowe, z `EXIT=`)

```text
## pwd /home/user/The-Game/.claude/worktrees/wf_c43cd53a-064-1/rust-port/renderer  HEAD df3027b7  (working tree: 98 changed/untracked paths)
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
```

Wszystkie bramki `EXIT=0`; w obu przebiegach testów łącznie 92 linii `test result: ok`, 0 `FAILED` (pełny log: `01-gates.log`). Uruchomione z `CARGO_INCREMENTAL=0` (współdzielony dysk był bliski zapełnienia, §7), przed commitem (stąd „changed/untracked paths” w nagłówku). `clippy` na 1.87.0: NIE_ZMIERZONO (brak komponentu).

## 9. ZAŁOŻENIA

- **Z-34-0:** sekcja KONTEKST dispatchu każe przeczytać P4-4, P4-3, P4-8, P4-11, P4-6 i generować wektory przez `esbuild`/three (szablon tematów modelowych). Merytorycznie wiążące były P4-25 §2.3/§6, P4-28/29/30 (rasteryzator) i P4-5B §7 (kotwice). Wektory projekcji i animacji generowano kodem weba z pinu w node + three@0.169.0 (scratch poza repo, `THREE_DIR`), bez `esbuild` (kod wycięty z pinu i odarty z typów `node:module stripTypeScriptTypes` — wystarcza, bo wycinki nie mają importów). Piksele — wzorzec RR-T8a–c (Chromium), jak każe GOAL.
- **Z-34-1 (fonty):** jak D-TXT-1 = A / D-TXT-5 = A: `Arial` i `sans-serif` → Liberation Sans, fallback DejaVu Sans, emoji Noto (podzbiór). Wygląd z fontami Windows (Arial, Segoe UI Emoji) — NIE_ZMIERZONO.
- **Z-34-2 (tekstura zamiast DOM):** etykieta jest teksturą rysowaną raz (sprite); położenie ułamkowe (R15 `left = sp.x + 'px'` bez zaokrąglenia) ustawia scena (RR-T5), a Chromium przy położeniu ułamkowym rasteryzuje tekst na nowo w pozycji subpikselowej. Różnica: próbkowanie sprite'a (biliniowe) vs nowa rasteryzacja — NIE_ZMIERZONO (wymaga GPU/sceny).
- **Z-34-3 (HiDPI):** `dsf` całkowity (1, 2 zmierzone); dsf ułamkowy (1,25, 1,5) — NIE_ZMIERZONO.
- **Z-34-4 (zakres treści):** jedyny powód w R4 to `R4_REASON_DROGA` (`main.ts:13075-13077`); łamanie zachłanne na pojedynczych spacjach wystarcza dla tej treści (bez myślników, bez długich słów). Inne treści — poza zakresem weba.
- **Z-34-5 (`<small>`):** UA `font-size: smaller` = rodzic / 1,2 w `f32` (zmierzone `getComputedStyle` 9,16667 px).
- **Z-34-6 (rozmiar klucza fontu):** reguła `(unsigned)(size·100)/100` jest wnioskiem z pomiarów (11 rozmiarów, kerning 2 par, 1 984 etykiet), nie z lektury źródeł Blinka `[zewn.]`.

## 10. NIE_ZMIERZONO i „co ocenić wzrokiem po RR-T5”

NIE_ZMIERZONO: wygląd z fontami Windows i DirectWrite; Chromium z GPU (referencje = raster programowy Linux); dsf ułamkowy; determinizm poza x86_64; `clippy` na 1.87.0 (niezainstalowany komponent, jak P4-28/29); zachowanie sprite'a etykiety na scenie (filtr, mipmapy, położenie subpikselowe, kolejność z innymi nakładkami, `z-index`); nakładka bitwy (`rgba(0,0,0,0.88)` tło overlayu nie jest częścią etykiety).

Do oceny wzrokowej właściciela po RR-T5 (scena z GPU):
1. R4: chip przy kursorze w trybie budowy (ikona kolorowa, ramka złota/czerwona, cień w dół 4 px), wariant „Droga…” w dwóch liniach.
2. R5: czerwona etykieta nad oblężonym miastem, poświata `box-shadow`, ⚔ monochromatyczny.
3. R15a/R15b: liczby obrażeń i „MUR WYBURZONY!” — wznoszenie i wygaszanie w 2 s, czytelność czarnej poświaty na tle bitwy.
4. Ostrość na HiDPI (×2) i przy położeniu ułamkowym (Z-34-2).

## 11. Commit

Jeden commit w izolowanym worktree na bazie `origin/rust-port/parity-v2` @ `df3027b7` (SHA w raporcie Operatora `dyspozycje/autobot/runs/R-RUSTPORT-P4-34-ANCHORS-DOM-Q1/01-operator-r1.md` i w `git log`), jawne `git add` ścieżek z allowlisty, bez push. Konflikt możliwy wyłącznie w linii `pub mod labels;` w `src/lib.rs` (rozwiązuje orkiestrator).
