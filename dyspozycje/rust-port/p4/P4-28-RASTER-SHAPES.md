# P4-28 — Rasteryzator kształtów na CPU (`raster::Canvas2dLite`, RR-T8a)

TEMAT: `R-RUSTPORT-P4-28-RASTER-SHAPES-Q1` · DOMAIN: GAME · runda 2/5 (obrona po FAIL Evaluatora r1) · Operator (Opus 5.5 medium)
Baza kodu: `origin/rust-port/parity-v2` @ `9ec9c9d8`. Web: pin `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do scratchpadu poza repo, tylko odczyt; zero buildu weba, zero zmian w `gra/**`).
Decyzje wejściowe: **D-TXT-6 = A** (tiny-skia), **D-RR-4 = A**. Plan paczek: `P4-25-TEXT-RASTER-AUDIT.md` §6 (RR-T8a).
Dowody surowe (pełne logi z `EXIT=`, **w commicie** — `*.log` jest w `.gitignore:20`, więc dodane jawnie `git add -f`): runda 1 `dyspozycje/autobot/runs/R-RUSTPORT-P4-28-RASTER-SHAPES-Q1/dowody/r1/01…09-*.log` (skrypty `dowody/05,06,08,09-*`), runda 2 `dowody/r2-06-*.log`, `dowody/r2-08-*.log`, `dowody/r2-09-*.log` (skrypty `dowody/r2-*`). Odwołania `dowody/0N` w tekście = `dowody/r1/0N-*.log`.

Konwencja: `plik:linia` bez prefiksu = `gra/src/` w pinie `edb8fb56`. `[zewn.]` = wiedza o wnętrzu Chromium/Skia spoza repo — nieczytana w źródłach, **sprawdzana wyłącznie empirycznie** (piksele Chromium, §5). `NIE_ZMIERZONO` = nie sprawdzone.

---

## 0. Streszczenie

1. Nowy moduł `rust-port/renderer/src/raster/` (`mod.rs`, `canvas.rs`, `path.rs`, `color.rs`, `shadow.rs`, `metric.rs`), jedna linia `pub mod raster;` w `src/lib.rs`. `#![forbid(unsafe_code)]` crate'a bez zmian.
2. Zależność **`tiny-skia = "=0.12.0"`, `default-features = false, features = ["std"]`** (bez `simd` i `png-format`). Lock: +4 pakiety (`tiny-skia`, `tiny-skia-path`, `strict-num`, `arrayref`); `arrayvec`, `bytemuck`, `cfg-if`, `log` były już w locku (drzewo wgpu). Build/test na **rustc 1.87.0: EXIT=0** (`dowody/04`).
3. `Canvas2dLite` implementuje **wszystkie 28 kształtowych członków** z 34 z P4-25 §4.1 (34 − 6 tekstowych) i nic poza nimi; test listy zamkniętej `tests/raster_api_closed.rs`.
4. **46 scen** (32 sceny producentów T4–T15 + H1, 12 scen semantycznych `x_*`, 2 syntetyczne obrazy-źródła; §4) wykonanych tym samym op-listem w Rust i w **prawdziwym Chromium 141** (Canvas 2D, software). Wszystkie w progach: SSIM min **0,9914**, mean_abs max **1,08**, px>16 max **3,22 %** (§5). Bitowa zgodność z Chromium niemożliwa (inny skaner AA) — progi to ZAŁOŻENIE do D-TXT-4.
5. **Determinizm**: hash FNV-1a 64 bufora RGBA wszystkich 46 scen identyczny w 8 przebiegach: rustc 1.87.0 i 1.97.0 × debug/release × 2 (`dowody/05`). Referencje Chromium regenerowane drugi raz — `MANIFEST.sha256` identyczny (`dowody/06`).
6. Kolory CSS: 119 sond w Chromium; akceptacja zgodna poza 3 udokumentowanymi wyjątkami, piksel 101/107 bit w bit, reszta ±1, alfa zawsze dokładna (§3.4).
7. Bramy (r2): fmt / clippy (bez i z `gpu`) / `cargo test --locked --all-targets` stable i 1.87.0 — **EXIT=0**, **211** testów zielonych na każdym toolchainie (`dowody/r2-09-final-gates.log`; r1: 207 w `dowody/r1/09-final-gates.log`). Mutacje: **25/25 zabitych (r2; r1: 20/20)** (§7).

---

## 1. Zakres i wykonanie GOAL

| Wymóg dispatchu | Stan |
|---|---|
| `Canvas2dLite` → bufor RGBA8 | `Canvas2dLite::new(w,h)`; wyjście `pixels_premultiplied()` (format kanwy Chromium i tiny-skia), `to_rgba8_straight()` (jak `getImageData`), `rgba_hash()` |
| parser kolorów CSS zgodny z webem | `raster::parse_css_color` — §3.4, porównany z Chromium |
| WYŁĄCZNIE wywołania użyte w webie | 28 członków (§2), nieużywanych brak — test `unused_canvas_members_are_not_implemented` (lista m.in. `globalAlpha`, `bezierCurveTo`, `ellipse`, `createRadialGradient`, `setLineDash`, `scale`, `lineCap`, `miterLimit`, `shadowOffsetX`, `getImageData`) |
| bez tekstu (RR-T8b), bez SVG/JPG/emoji (RR-T8c) | `drawImage` przyjmuje tylko zdekodowany `RasterImage` (RGBA8 albo inna kanwa) |
| zależność tiny-skia 0.12.x, MSRV 1.87, lock commitowany | §0 pkt 2 |
| determinizm 2+ przebiegi, 1.87 vs najnowszy | §6 |
| testy strukturalne znanych pikseli | `tests/raster_unit.rs`, 32 testy (§6) |
| metryka zgodności + ≥30 scen z Chromium | §4–§5 |
| mutacje ≥ 10 | §7 |

**Konflikty w dispatchu rozstrzygnięte jako ZAŁOŻENIE** (bez pytania, zgodnie z instrukcją):
- **Z-28-1:** sekcja KONTEKST mówi „bez nowych zależności, `Cargo.lock` nie ruszać”, a GOAL i ALLOWLISTA każą dodać `tiny-skia` i commitować lock. Przyjęto GOAL (szczegół wygrywa nad szablonem): dodano wyłącznie `tiny-skia`.
- **Z-28-2:** GOAL wymienia `scale` i `lineCap`, ale też każe implementować **wyłącznie** członków użytych w webie wg P4-25 §4.1. Pomiar: `ctx.scale` i `ctx.lineCap` — 0 trafień w 11 plikach z kanwami (grep §2). Nie zaimplementowano; czapka stała `butt`, `miterLimit` stały 10 (domyślne Canvas).
- **Z-28-3:** `shadow*` nie ma w liście GOAL, ale P4-25 §6 przydziela „cień (blur)” do RR-T8a, a Canvas stosuje stan cienia do każdej operacji. Zaimplementowano dla kształtów (RR-T8b użyje tego samego mechanizmu pod tekstem T13).
- **Z-28-4:** „wzorzec weryfikacji P4.11” (uruchomienie kodu weba przez esbuild/three) nie ma sensu dla rasteryzatora: funkcje rysujące weba są prywatne (nie eksportowane), zależą od `document`/THREE, a ich wyjściem jest właśnie wywołanie Canvas 2D. Referencją jest więc **prawdziwy Canvas 2D Chromium** wykonujący **dokładnie ten sam op-list**; sceny to kopie kodu weba z `plik:linia` (`tests/fixtures/raster/gen.mjs`), stałe liczone tymi samymi wzorami w JS.
- **Z-28-5:** obrazy ładowane w webie asynchronicznie (portret JPG, sygnet/ikony SVG) zastąpiono syntetycznymi kanwami-źródłami `src_portrait` 256×256 i `src_icon` 48×48 (dekodowanie to RR-T8c).

---

## 2. Inwentarz `ctx.*` (pomiar ponowiony)

Komenda (w scratchpadzie po `git archive edb8fb56 gra/src gra/data`):
```
grep -rohE "\b(ctx|c|g|context)\.[a-zA-Z]+\b *[(=]?" render/cities.ts render/siegeMarker.ts render/units.ts \
  render/unitStatPlate.ts render/unitOwnerEmblem.ts render/unitUpgradeBadges.ts render/workerFieldOverlay.ts \
  render/cityOkolicaOverlay.ts render/cityMapStatChip.ts battle/battleScene.ts battle/battleMinimap.ts | sort | uniq -c
```
Wynik (członkowie `ctx.`; `g.*` to grupy Three, nie gradient): `fillStyle=` 40, `beginPath` 28, `strokeStyle=` 24, `lineWidth=` 24, `font=` 22, `stroke` 20, `fill` 20, `arc` 20, `fillText` 18, `textBaseline=` 17, `textAlign=` 17, `lineTo` 15, `clearRect` 12, `arcTo` 8, `moveTo` 7, `measureText` 6, `drawImage` 6, `quadraticCurveTo` 5, `closePath` 5, `fillRect` 4, `strokeRect` 3, `shadowColor=` 3, `shadowBlur=` 3, `save` 3, `restore` 3, `createLinearGradient` 2, `clip` 2, `translate` 1, `strokeText` 1, `shadowOffsetY=` 1, `setTransform` 1, `roundRect` 1, `rotate` 1, `lineJoin=` 1 — **identycznie jak P4-25 §4.1**. `addColorStop` (zmienna `grad`): `cityMapStatChip.ts:480-482`, `:857-858`.

Mapowanie Rust ↔ Canvas (z miejscem użycia w webie) jest tabelą `CANVAS_MEMBERS` w `tests/raster_api_closed.rs` (r2: 29 wpisów = 28 członków, `fillStyle` w dwóch postaciach: CSS i gradient; każdy wpis ma cytowanie `plik:linia`, sprawdzone skryptem `sed -n <linia>p`).

**`strokeStyle = <gradient>` (r2, zarzut 2 Evaluatora): NIE implementowane.** Pomiar: `git grep -nE "strokeStyle\s*=" edb8fb56 -- gra/src` — wszystkie przypisania to łańcuchy CSS (literały, stałe kolorów, `pal.stroke` z `DEFENSE_COLORS` `cityMapStatChip.ts:80-82`, `hexToRgba`/`workerOwnerColorRgba`); żadne nie przypisuje gradientu. Metodę `set_stroke_style_gradient` z r1 usunięto i dopisano do listy zakazanej `FORBIDDEN` w `tests/raster_api_closed.rs`; `gen.mjs` rzuca błąd przy próbie przypisania gradientu do `strokeStyle`, a ścieżka `strokeGrad` zniknęła z generatora i z `tests/raster_scenes.rs`. Referencje Chromium odtworzone tym `gen.mjs` są bit w bit takie same (zmienił się tylko wiersz `gen.mjs` w `MANIFEST.sha256`, `dowody/r2-06-chromium-refs-repro.log`).

---

## 3. Semantyka implementacji

### 3.1 Ścieżka
- Punkty ścieżki przechowywane w **przestrzeni urządzenia** — każde wywołanie transformowane przez CTM z chwili wywołania (spec HTML Canvas). Scena `x_path_keeps_old_ctm` (setTransform między budową a `fill`/`stroke`) — mean_abs 0,21 vs Chromium.
- `arc`: kanonikalizacja kątów, pełny obrót = dwa łuki 180° bez domknięcia (brak złącza na szwie), łuki jako stożkowe (conic) ćwiartkowe `w = √2/2` + reszta, konwersja conic → quad w przestrzeni urządzenia z tolerancją **0,25 px**, maks. 2⁵ odcinków (algorytm Skia `[zewn.]`). Pomiar wyboru tolerancji: przy 0,0625 wynik vs Chromium **gorszy** (np. `t5_stack_badge_disc` px>16 3,22 % → 3,61 %, `t10_disc_civ` 2,67 % → 2,81 %), więc zostaje 0,25.
- `arcTo`: linia do pierwszego punktu styczności + jedna conic z kontrolą w `(x1,y1)`, `w = √((1+cos)/2)`; przypadki zdegenerowane (r = 0, punkty współliniowe/powtórzone) → `lineTo(x1,y1)`. Scena `x_arcto_edges` (clamp promienia `unitStatPlate.ts:318`, kolinearność, r = 0): SSIM 0,998.
- `roundRect` (jeden promień, jedyna forma w webie `units.ts:6590`): clamp promienia wg spec, narożniki conic, po nim nowy podścieżka w `(x,y)`.
- `lineTo`/`quadraticCurveTo` bez podścieżki zachowują się jak `moveTo` (spec); `closePath` zaczyna nową podścieżkę w punkcie startu.

### 3.2 Malowanie
- `fill`: non-zero, AA. `stroke`: ścieżka mapowana odwrotnością CTM do przestrzeni użytkownika i obrysowana z CTM (grubość w jednostkach użytkownika), `lineJoin` miter/round/bevel, czapka `butt`, miter limit 10. Kreski ≤ 1 px po transformacji są w tiny-skia (jak w Skia) „hairline” z modulacją pokrycia — narożnik `strokeRect` 1 px nie jest pełny (Chromium tak samo: `h1_battle_minimap` max_abs 16).
- Gradient liniowy: przystanki sortowane stabilnie, `Pad`; brak przystanków albo start = koniec → nic nie maluje (spec; tiny-skia zwróciłby kolor jednolity — obsłużone jawnie). Interpolacja tiny-skia (nieprzemnożona, potem premultiply) zgadza się z Chromium: `x_gradient_pad` max_abs **2**.
- `clip`: maska AA, przecięcie z poprzednią, w stosie stanu (`save/restore`). Pusta ścieżka obcina wszystko.
- `clearRect`: **bez AA** — zmierzone: Chromium czyści całe piksele (`x_clear_rotated`: przy AA max_abs 128 / px>16 2,47 %; bez AA **0 / 0 %, bit w bit**). Realizacja `DestinationOut` (nie `Clear`, bo tiny-skia nakłada maskę klipu na kolor źródła, który `Clear` ignoruje — test `clear_rect_respects_clip` łapał to).
- `drawImage(img, dx, dy, dw, dh)`: próbkowanie dwuliniowe, **krawędzie celu bez AA** — zmierzone: przy AA `x_image_downscale` max_abs 159 / px>16 3,5 %; bez AA **10 / 0 %**, SSIM 0,99994. Chromium nie używa mipmap przy zmniejszaniu 256→29 px (wynik bilinear ≈ Chromium).
- Cień: alfa źródła, przesunięcie `shadowOffsetY`, rozmycie Gaussa **σ = shadowBlur/2** (spec), kolor `shadowColor`, kompozycja pod źródłem w klipie. `x_shadow_worked`/`x_shadow_idle` (parametry `cityOkolicaOverlay.ts:175-177`): mean_abs 0,22 / 0,15, max_abs 37 / 8.
- Funkcje trygonometryczne/`exp` przez `crate::jsmath` (reguła crate'a egzekwowana przez `tests/jsmath_wiring.rs::no_platform_transcendentals_anywhere_in_src`, która wyłapała pierwotne `sin_cos`/`exp`).

### 3.3 Format pikseli
tiny-skia: premultiplied RGBA8, wartości sRGB mieszane wprost (`ColorSpace::Linear` = bez konwersji), czyli jak kanwa 2D Chromium. Wyjście premultiplied i proste. Upload do wgpu (sRGB/premultiplied) — RR-T8d.

### 3.4 Kolory CSS
Formy: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()/rgba()` (przecinki lub spacje + `/ alfa`, liczby lub %), `hsl()/hsla()` (deg/rad/grad/turn), `transparent`, 16 podstawowych nazw HTML. Kanały rgb/hsl kwantyzowane do 8 bitów (zaokrąglenie), alfa ciągła. Błędny ciąg → `false`, poprzednia wartość zostaje (jak Canvas).
Porównanie z Chromium (`tests/raster_color.rs`, `colors.tsv`, 119 sond = wszystkie kolory scen + przypadki brzegowe):
- akceptacja zgodna oprócz **3 udokumentowanych**: `orange`, `rebeccapurple` (pełna tablica 148 nazw poza zakresem — web używa tylko `'transparent'`, `cityOkolicaOverlay.ts:159`, `:179`) oraz `rgb(1 2,3)` (Chromium 141 akceptuje mieszane separatory, CSS Color 4 — nie);
- piksel 1×1 `fillRect`: **101/107 bit w bit**, 6 różni się o 1 (premultiplied), **alfa dokładna we wszystkich** (np. 0,92 → 235).

---

## 4. Sceny (46) i referencje Chromium

Źródło jedyne: `tests/fixtures/raster/scenes.tsv` generowane przez `gen.mjs` (kopie funkcji weba z `plik:linia`). Uruchomienie: `NODE_PATH=/opt/node22/lib/node_modules node gen.mjs` (node v22.22.0, playwright 1.56.1, **Chromium 141.0.7390.37** headless, `--disable-gpu`, `getContext('2d', {willReadFrequently:true})` → raster programowy). Zapisuje `ref/<scena>.rgba` (prosty RGBA8 z `getImageData`), `colors.tsv`, `versions.txt`, `MANIFEST.sha256` (sha256 wszystkich plików, w tym `gen.mjs`). Rozmiar `ref/`: 5 328 344 B (< 8 MB; całość katalogu ≈ 5,4 MB) — nic nie pominięto.

| Producent | Sceny | Źródło |
|---|---|---|
| T4 moneta + belka | `t4_gold_deficit` | `units.ts:6319-6354` |
| T5 krążek stosu | `t5_stack_badge_disc` | `units.ts:6374-6380` |
| T6 tabliczka tury | `t6_turn_label_plate` | `units.ts:6585-6592` |
| T7 tło tabliczki 512×168 | `t7_plate_bg` | `unitStatPlate.ts:403-433`, `:314-326` |
| T8 ramka siły 256×213 | `t8_power_frame` | `unitStatPlate.ts:558-573` |
| T10 medalion | `t10_disc_{civ,cityState,barbarian}`, `t10_portrait` (clip+drawImage+ring), `t10_sigil_city_state` | `unitOwnerEmblem.ts:242-288`, `:378-399` |
| T11 odznaka | `t11_badge_l{1,2,3}`, `t11_badge_l3_icon` | `unitUpgradeBadges.ts:270-298` |
| T12 robotnik | `t12_worker_player`, `t12_worker_other`, `t12_worker_player_owner4` | `workerFieldOverlay.ts:63-97` |
| T13 odznaka robotnika | `t13_worker_badge`, `t13_worker_badge_owner0` | `cityOkolicaOverlay.ts:119-137` |
| T14 pigułka miasta | `t14_pill_plain_x1`, `_capital_x2`, `_hover_x3`, `_portrait_x2`, `_sigil_x1_5`, `_full_x4` (skala maks. 4), `t14_shield_t1_x3`, `t14_shield_t2_x2`, `t14_crown_x4`, `t14_medallion_disc_x1/_x2` | `cityMapStatChip.ts:405-537`, `:546-569`, `:658-682`, `:782-935` |
| T15 ramka grupy | `t15_group_frame` | `battle/battleScene.ts:18646-18656` |
| H1 minimapa (pokrycie; zostaje w DOM wg Z-1) | `h1_battle_minimap` | `battle/battleMinimap.ts:51-93` |
| semantyka | `x_shadow_worked`, `x_shadow_idle`, `x_clear_rotated`, `x_arcto_edges`, `x_arc_partial`, `x_gradient_pad`, `x_hairlines`, `x_round_join`, `x_miter_join`, `x_image_downscale`, `x_path_keeps_old_ctm`, `x_clip_nested_restore` | parametry z cytowanych linii weba |
| źródła obrazów (Z-28-5) | `src_portrait`, `src_icon` | — |

T1, T2, T3 (glify 🔥 ⚔ ☠) i T9 (cyfry `strokeText`) **nie mają części kształtowej** poza `clearRect` — należą do RR-T8b/c. Tekst/glify w T5, T6, T10, T12–T15 pominięte (oznaczone w scenach).
Szerokości tekstów w T14 (`nameW`, `growthW`) są stałymi wejściowymi (w webie `measureText` — RR-T8b); `nameW = 213.877` = zmierzona w P4-25 szerokość `UMGUNGUNDLOVU`.

---

## 5. Metryka zgodności i wyniki (propozycja do D-TXT-4)

### 5.1 Metryka (`raster::metric`)
Na kanałach **premultiplied** (Chromium: `getImageData` → premultiply z zaokrągleniem): `max_abs`, `mean_abs`, `frac_px_over_16` (udział pikseli z różnicą kanału > 16), `ssim` (średnia z R,G,B,A; okno 7×7 jednorodne, krok 1, kowariancja próbkowa, C1=(0,01·255)², C2=(0,03·255)²).
**Progi (ZAŁOŻENIE Z-28-6, do rewizji właściciela w D-TXT-4):** SSIM ≥ 0,985, mean_abs ≤ 1,5, px>16 ≤ 5 % na scenę. `max_abs` raportowany, bez progu (pojedyncze piksele krawędzi różnią się o ≤ 123).

### 5.1a Testy jednostkowe metryki (r2, zarzut 5 Evaluatora)
Czułość metryki jest teraz dowiedziona testami w repo (`src/raster/metric.rs`), nie tylko mutacjami:
- `known_sparse_difference` — 8×8, R +40 w jednym pikselu i G +10 w drugim: `max_abs = 40`, `mean_abs = 50/256` (dokładnie), `frac_px_over_16 = 1/64` (próg 16 rozróżnia 40 od 10), `0 < SSIM < 1`, symetria argumentów;
- `known_constant_offset_ssim` — płaszczyzny stałe 100 vs 110 (7×7): SSIM = `(2·100·110 + C1)/(100² + 110² + C1)` z dokładnością 1e-12, `mean_abs = 10`, `frac_px_over_16 = 0`;
- `inverted_structure_has_negative_ssim` — szachownica vs negatyw 16×16: SSIM < 0, `max_abs = 255`, `frac_px_over_16 = 1`;
- `transparent_hidden_colour_is_ignored_after_premultiply` — ukryty kolor piksela z alfą 0 nie liczy się.
Mutacje metryki M21–M25 (§7) — wynik w `dowody/r2-08-mutations.log`.

### 5.2 Wyniki (pełny log `dowody/r1/07-raster-tests-nocapture.log`)

| scena | max | mean | px>16 % | SSIM |
|---|---|---|---|---|
| t4_gold_deficit | 50 | 0,317 | 1,03 | 0,9979 |
| t5_stack_badge_disc | 51 | 0,951 | **3,22** | 0,9970 |
| t6_turn_label_plate | 33 | 0,079 | 0,21 | 0,9999 |
| t7_plate_bg | 37 | 0,455 | 0,03 | **0,9915** |
| t8_power_frame | 73 | 0,086 | 0,19 | 0,9997 |
| t10_disc_civ / cityState / barbarian | 91 | 0,87 / 0,88 / 0,57 | 2,67 / 2,58 / 2,59 | 0,992 / 0,992 / 0,994 |
| t10_portrait | 123 | 0,900 | 1,98 | 0,9922 |
| t10_sigil_city_state | 91 | 1,015 | 2,59 | **0,9914** |
| t11_badge_l1…l3, l3_icon | 80 | 0,19–0,43 | 0,65–0,84 | 0,998–0,999 |
| t12 (3 sceny) | 23–36 | 0,09–0,51 | 0,20–0,73 | 0,998–0,999 |
| t13 (2 sceny) | 40 | 0,22–0,32 | 0,61 | 0,999 |
| t14_pill_plain_x1 / capital_x2 / hover_x3 | 53 / 52 / 121 | 0,73 / 0,62 / 0,52 | 0,77 / 0,45 / 0,34 | 0,996–0,997 |
| t14_pill_portrait_x2 / sigil_x1_5 / full_x4 | 47 / 54 / 61 | 0,60 / 0,76 / 0,55 | 0,66 / 1,02 / 0,20 | 0,996–0,997 |
| t14_shield_t1_x3 / t2_x2 | 42 / 48 | 0,51 / **1,08** | 1,22 / 2,05 | 0,999 / 0,997 |
| t14_crown_x4 | 36 | 0,420 | 0,37 | 0,9987 |
| t14_medallion_disc_x1 / x2 | 24 / 52 | 0,79 / 0,66 | 1,88 / 2,30 | 0,998 / 0,997 |
| t15_group_frame | **0** | 0 | 0 | **1,0000** |
| h1_battle_minimap | 16 | 0,052 | 0 | 1,0000 |
| x_clear_rotated | **0** | 0 | 0 | **1,0000** |
| x_gradient_pad / x_hairlines | 2 / 2 | 0,15 / 0,03 | 0 | 0,9997 / 1,0000 |
| x_image_downscale | 10 | 0,123 | 0 | 0,9999 |
| x_shadow_worked / idle | 37 / 8 | 0,22 / 0,15 | 0,41 / 0 | 0,9989 / 0,9995 |
| x_arcto_edges / arc_partial / round_join / miter_join / path_keeps_old_ctm / clip_nested_restore | 55 / 70 / 33 / 81 / 15 / 66 | 0,21–0,45 | 0–1,59 | 0,996–0,9997 |

### 5.3 Skąd różnice (zmierzone)
- **Kwantyzacja AA tiny-skia**: skaner nadpróbkowujący z `SUPERSAMPLE_SHIFT = 2` (`tiny-skia-0.12.0/src/scan/path_aa.rs:21`) → pokrycie krawędzi prawie poziomych w krokach 1/4 (wartości 63/127/191 w zrzutach), Chromium daje pokrycie analityczne. Przykład `t10_disc_civ` wiersz y=3: nasze 191, Chromium 220. To dominuje we wszystkich scenach z łukami; nie da się tego usunąć bez innego skanera.
- **Masa alfa** (suma pokrycia) zgodna z Chromium w ±0,5 %: np. `t5` 2545,1 vs 2542,9, `t10_disc_civ` 11130 vs 11178, `t14_medallion_disc_x2` 3609 vs 3616. Obie implementacje leżą nieco poniżej πr² (cięciwy krzywych), stąd tolerancje pól 1–3 % w testach strukturalnych.
- Różnice systemowe semantyki (clearRect/drawImage bez AA) **usunięte** po pomiarze (§3.2).

### 5.4 Co ocenić wzrokiem (po RR-T5, wymaga GPU — NIE_ZMIERZONO)
Ocena 1:1 na ekranie gry: krawędzie pierścieni medalionu T10 (14 px) i tła T7 po mipmapach, pigułka T14 przy LOD 1–4, korona T14 przy małej skali, cień pod liczbami T13 (po RR-T8b), belka T4 (rotacja). Porównanie klatek vs web na maszynie właściciela (D-RR-2).

---

## 6. Testy

| plik | testy | co sprawdza |
|---|---|---|
| `src/raster/*` (unit) | 13 | conic/arc (ćwiartki, otwarty pełny okrąg, CCW), arcTo, kolor, jądro Gaussa, metryka (r2: +4 testy znanych różnic — §5.1a) |
| `tests/raster_unit.rs` | 32 | znane piksele: pełne wypełnienia bit w bit, krawędź AA 75 %/50 %, pole koła/roundRect/arcTo, gradient w punktach kontrolnych i pod CTM, gradienty zdegenerowane, błędy (`IndexSize`, `Syntax`), clip + restore, pusty clip, clearRect w klipie, translate/rotate/setTransform, save/restore stylu, strokeRect, lineWidth ignorowany ≤ 0, joins miter/round/bevel, miter limit 10 (kąt 20° zostaje miter, ~5,7° bevel), cień twardy i rozmyty, drawImage (kopiowanie, ujemny rozmiar), wyjście proste, argumenty nieskończone, `lineTo` bez podścieżki, kolejność przystanków o równym offsecie |
| `tests/raster_color.rs` | 5 | §3.4 (+ kolory nieprzezroczyste bit w bit) |
| `tests/raster_scenes.rs` | 4 | §5 (progi), złote hashe `golden.tsv` (46), dwukrotne renderowanie identyczne, kompletność `MANIFEST.sha256` |
| `tests/raster_api_closed.rs` | 3 | lista zamknięta API, 28 członków P4-25, brak nieużywanych |

Determinizm (`dowody/05`): `scenes_match_golden_hashes` na rustc 1.87.0 i 1.97.0, debug i release, po 2 przebiegi — 8 × EXIT=0, sha256 46 wydrukowanych hashy = sha256 treści `golden.tsv` = `28428dba…9711f7` we wszystkich 8. Platforma: x86_64 Linux; inne architektury NIE_ZMIERZONO (wyłączony `simd` zmniejsza ryzyko rozjazdu ścieżek SIMD, ale nie jest dowodem).
Przebłogosławienie hashy: `RASTER_BLESS=1 cargo test --test raster_scenes scenes_match_golden_hashes` (tylko po świadomej zmianie). Zrzuty do diagnostyki: `RASTER_DUMP=<katalog>`.

### 6.1 Bramy (r1: surowe logi `dowody/r1/01–04`, `dowody/r1/09-final-gates.log`, 207 testów; **r2: `dowody/r2-09-final-gates.log`** — fmt/clippy/clippy gpu/test stable/test 1.87.0 — wszystkie EXIT=0, 211 testów na toolchain; `clippy` dla 1.87.0 niezainstalowany w kontenerze → EXIT=1 „cargo-clippy is not installed”, NIE_ZMIERZONO, poza bramami dispatchu)
```
cargo fmt --all -- --check                                      EXIT=0   (r2-09; r1/01-fmt.log)
cargo clippy --locked --all-targets -- -D warnings              EXIT=0   (r2-09; r1/02-clippy.log)
cargo clippy --locked --all-targets --features gpu -- -D warnings EXIT=0 (r2-09; r1/02-clippy.log)
cargo test --locked --all-targets            (rustc 1.97.0)     EXIT=0   211 passed, 0 failed (r2-09; r1: 207 w r1/09, 203 w r1/03)
cargo +1.87.0 test --locked --all-targets    (MSRV)             EXIT=0   211 passed, 0 failed (r2-09; r1: 207 w r1/09, 203 w r1/04)
```

---

## 7. Mutacje

Skrypt `dowody/08-mutations.py` (r1: M01–M20) i `dowody/r2-08-mutations.py` (r2: M01–M25, cały zestaw powtórzony na kodzie r2; każda mutacja = jedna podmiana fragmentu, asercja jednokrotnego wystąpienia, test `--lib` + 4 pliki `raster_*`, przywrócenie pliku). Wyniki: `dowody/r1/08-mutations.log`, `dowody/r2-08-mutations.log`. Kolumna „zabija” w wierszach M01–M20 — z r1.

| ID | plik | mutacja | wynik | zabija |
|---|---|---|---|---|
| M01 | `src/raster/path.rs` | conic→quad tolerance 4× coarser | **KILLED** | raster::path::tests::big_circle_subdivides, scenes_match_golden_hashes, scenes_match_chromium, clip_limits_drawing_and_restore_removes_it, arc_to_corner_matches_quarter_circle, round_rect_radius_is_clamped_to_half_side |
| M02 | `src/raster/path.rs` | full circle becomes a half circle | **KILLED** | raster::path::tests::full_circle_is_four_quadrants_open, raster::path::tests::big_circle_subdivides, scenes_match_golden_hashes, scenes_match_chromium, clip_limits_drawing_and_restore_removes_it, circle_area_matches_pi_r_squared |
| M03 | `src/raster/path.rs` | arcTo tangent distance formula | **KILLED** | scenes_match_golden_hashes, scenes_match_chromium |
| M04 | `src/raster/path.rs` | roundRect radius not clamped | **KILLED** | round_rect_radius_is_clamped_to_half_side |
| M05 | `src/raster/canvas.rs` | miter limit = tiny-skia default 4 instead of Canvas 10 | **KILLED** | miter_limit_ten_keeps_a_20_degree_miter |
| M06 | `src/raster/canvas.rs` | clearRect anti-aliased (Chromium is not) | **KILLED** | scenes_match_golden_hashes, scenes_match_chromium |
| M07 | `src/raster/canvas.rs` | drawImage nearest instead of bilinear | **KILLED** | scenes_match_golden_hashes, scenes_match_chromium |
| M08 | `src/raster/canvas.rs` | degenerate gradient paints (should paint nothing) | **KILLED** | degenerate_gradients_paint_nothing |
| M09 | `src/raster/canvas.rs` | stroke ignores the CTM for the outline geometry | **KILLED** | scenes_match_golden_hashes, scenes_match_chromium |
| M10 | `src/raster/color.rs` | #rgb expansion ×16 instead of ×17 | **KILLED** | raster::color::tests::forms_used_by_the_web, opaque_colours_are_bit_exact, filled_pixel_matches_chromium_within_one_step |
| M11 | `src/raster/color.rs` | rgb() channel floor instead of round | **KILLED** | opaque_colours_are_bit_exact |
| M12 | `src/raster/shadow.rs` | shadow sigma = blur instead of blur/2 | **KILLED** | scenes_match_golden_hashes, scenes_match_chromium |
| M13 | `src/raster/canvas.rs` | first clip not anti-aliased | **KILLED** | scenes_match_golden_hashes (powtórzone ręcznie — skrypt nie wyłowił nazwy z przeplecionego wyjścia; metryka Chromium tej mutacji NIE wykrywa) |
| M14 | `src/raster/canvas.rs` | restore keeps the clip | **KILLED** | scenes_match_golden_hashes, scenes_match_chromium, clip_limits_drawing_and_restore_removes_it |
| M15 | `src/raster/path.rs` | anticlockwise arcs drawn clockwise | **KILLED** | raster::path::tests::half_arc_ccw_goes_through_top, scenes_match_golden_hashes, scenes_match_chromium |
| M16 | `src/raster/canvas.rs` | rotate() direction inverted | **KILLED** | scenes_match_golden_hashes, scenes_match_chromium, translate_rotate_and_set_transform |
| M17 | `src/raster/canvas.rs` | equal-offset colour stops inserted before (not after) earlier ones | **KILLED** | equal_offset_stops_keep_insertion_order |
| M18 | `src/raster/canvas.rs` | offset-only (blur 0) shadow dropped | **KILLED** | shadow_is_drawn_below_and_offset |
| M19 | `src/raster/path.rs` | lineTo without subpath does not act as moveTo | **KILLED** | line_to_without_subpath_acts_as_move_to |
| M20 | `src/raster/canvas.rs` | gradient ignores the CTM | **KILLED** | scenes_match_golden_hashes, scenes_match_chromium, gradient_follows_the_ctm_at_paint_time |
| M21 | `src/raster/metric.rs` | mean_abs per pixel instead of per channel (r2) | **KILLED** | metric::known_constant_offset_ssim, metric::known_sparse_difference, scenes_match_chromium |
| M22 | `src/raster/metric.rs` | visibly-different cut 16 → 64 (r2) | **KILLED** | metric::known_sparse_difference |
| M23 | `src/raster/metric.rs` | SSIM constant C1 dropped (r2) | **KILLED** | metric::known_constant_offset_ssim, metric::known_sparse_difference |
| M24 | `src/raster/metric.rs` | SSIM ignores the sign of the covariance (r2) | **KILLED** | metric::inverted_structure_has_negative_ssim |
| M25 | `src/raster/metric.rs` | one-sided difference, metric not symmetric (r2) | **KILLED** | metric::inverted_structure_has_negative_ssim, metric::known_sparse_difference, metric::known_constant_offset_ssim |

**Wynik r2: 25/25 zabitych** (`dowody/r2-08-mutations.log`, EXIT=0; M01–M20 z tymi samymi testami zabijającymi co w r1, M13 tym razem nazwany przez skrypt). **Wynik r1: 20/20 zabitych.** Historia (uczciwie): pierwszy przebieg dał 17/20 — przeżyły M05 (miter limit 4 vs 10), M11 (floor vs round w `rgb()`), M17 (kolejność przystanków o równym offsecie), a w przebiegu wstępnym także M19 (`lineTo` bez podścieżki). Dopisano testy `miter_limit_ten_keeps_a_20_degree_miter`, `opaque_colours_are_bit_exact`, `equal_offset_stops_keep_insertion_order`, `line_to_without_subpath_acts_as_move_to` i powtórzono cały zestaw (log powyżej). Wniosek dla D-TXT-4: miękka metryka vs Chromium nie wykrywa M13 (clip bez AA) — od subtelnych regresji chronią złote hashe.

---

## 8. ZAŁOŻENIA (zbiorczo) i NIE_ZMIERZONO

- Z-28-1 … Z-28-5: §1. Z-28-6: progi metryki §5.1 (D-TXT-4).
- Z-28-7: `set_fill_style_gradient` kopiuje gradient w chwili przypisania; w JS `fillStyle` trzyma referencję i późniejsze `addColorStop` zmieniłoby wygląd. Web zawsze dodaje przystanki przed przypisaniem (`cityMapStatChip.ts:479-495`, `:856-859`), więc różnica jest nieobserwowalna dla obecnego kodu.
- Z-28-8: `sin`/`cos`/`exp` przez `jsmath` (f64 → f32) zamiast `sinf`/`cosf` Skii — różnica rzędu kilku ULP f32, nieobserwowalna w pikselach scen.
- Uwaga Evaluatora U1 (r2, bez zmiany): scena `h1_battle_minimap` używa syntetycznych kolorów jednostek; w webie `BATTLE_PLAYER '#3a6ad0'` i `BATTLE_ENEMY '#c84040'` (`battle/battleHudTheme.ts:17,22`). Kolory te są zwykłymi `#rrggbb` (forma pokryta testem `opaque_colours_are_bit_exact`), scena testuje pokrycie geometrii — podmiana zmieniłaby referencje i złote hashe bez zysku dowodowego; do ewentualnego ujednolicenia przy RR-T8b.
- NIE_ZMIERZONO: determinizm poza x86_64; zachowanie Chromium na Windows/GPU (referencje to raster programowy Linux); wygląd po mipmapach/GPU (§5.4); tekst/glify/obrazy (RR-T8b/c).

DEPLOY/PUSH: NIE WYKONANO
