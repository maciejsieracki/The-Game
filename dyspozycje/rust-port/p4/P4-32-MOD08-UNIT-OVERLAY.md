# P4-32 — MOD-08: nakładki żetonu jednostki (`units::overlay`)

TEMAT: `R-RUSTPORT-P4-32-MOD08-UNIT-OVERLAY-Q1` · DOMAIN: GAME · runda 1/5 · Operator (Opus 5.5 medium)
Paczka katalogu: `R-RUSTPORT-P4-MOD-08-UNIT-OVERLAY` (`P4-4-MODEL-CATALOG.md` §4 wiersz 8, pliki 76–79 tabeli §1: `render/unitOwnerEmblem.ts` 516, `unitStatPlate.ts` 936, `unitUpgradeBadges.ts` 459, `unitVeteranBadges.ts` 294 LOC).
Baza kodu: `origin/rust-port/parity-v2` @ `672c2059` (RR-T8a/b/c zintegrowane). Web: pin `edb8fb56` (`git archive` do scratchpadu poza repo; zero buildu weba, zero zmian w `gra/**`).
Dowody surowe (w commicie, `*.log` przez `git add -f`): `dyspozycje/autobot/runs/R-RUSTPORT-P4-32-MOD08-UNIT-OVERLAY-Q1/dowody/` — `01-gates.{sh,log}`, `05-determinism.{sh,log}`, `06-generator-repro.{sh,log}`, `07-overlay-tests-nocapture.log` (pełne tabele), `08-mutations.{py,log}`.

Konwencja: `plik:linia` bez prefiksu = `gra/src/` w pinie `edb8fb56` (dla czterech modułów: `:linia` = linia w danym module). `NIE_ZMIERZONO` = nie sprawdzone.

---

## 0. Streszczenie

1. Nowy moduł `rust-port/renderer/src/units/overlay/` (`mod.rs`, `emblem.rs`, `stat_plate.rs`, `upgrade_badges.rs`, `veteran_badges.rs`) + `src/units/mod.rs` (jedna linia `pub mod overlay;`, ZAŁOŻENIE Z-32-1) + jedna linia `pub mod units;` w `src/lib.rs`. Zero nowych zależności, `Cargo.toml`/`Cargo.lock` nietknięte, `#![forbid(unsafe_code)]` bez zmian, `geom/**`, `raster/**`, `core/**`, `models/**` nietknięte (tylko używane).
2. **Port 1:1 wszystkich wywołań `ctx.*`** czterech modułów na `Canvas2dLite` (RR-T8a), tekst przez `raster::text` / `raster::image::emoji` (RR-T8b/c), SVG i JPG przez `raster::image` (RR-T8c). Tekstury: `OverlayTexture` = RGBA8 (straight, jak `getImageData`) + premultiplied + metadane Three (`minFilter`, `magFilter`, `generateMipmaps`, `colorSpace`, `flipY`) + nominalny quad (kotwica, rozmiar w świecie) + flaga „przerysowana po wczytaniu obrazka”. Układ: `OverlayTree` (pod-grupa Three jako dane: pozycja/obrót/skala, `renderOrder`, `visible`, `userData`, geometria CPU, parametry materiału, referencje tekstur). Wejścia jako DTO — **zero logiki gry** (poziomy odznak, liczba gwiazdek, wartości pasków i Mocy, kolor właściciela, kontekst właściciela podaje wywołujący, jak `render/units.ts:6141-6170`).
3. **Referencje = uruchomiony kod weba** (nie transkrypcja): cztery moduły z pinu zbundlowane esbuild 0.24.0 + three@0.169.0, wywołane przez ich prawdziwe eksporty w **Chromium 141** (prawdziwy Canvas 2D, te same pliki fontów) — 36 tekstur (+ 15 stanów „przed wczytaniem obrazka”), 111 drzew Three, 416 kluczy emblematu, stałe. Liczby drzew z tego samego bundla w **node v22.22.0** (jak wszystkie fixtury MOD); Chromium daje 10 różnic w ostatnim bicie (§4.2).
4. **Wyniki:** drzewa **bit w bit** (111 drzew, 18 089 porównań: `to_bits` pozycji/obrotów/skal/kolorów liniowych/parametrów materiałów, tablice f32 geometrii, `userData` tokenu); klucze 416/416; stałe 23/23 bit w bit; **tekstury 51/51 (36 końcowych + 15 początkowych) w progach RR-T8a/b/c** (SSIM ≥ 0,985, mean_abs ≤ 1,5, px>16 ≤ 5 %) — **bez wyjątków**; najgorszy SSIM 0,99053 (medalion z portretem), najgorszy mean_abs 1,1031.
5. Determinizm: złote hashe 36 tekstur (×2 fazy) identyczne na rustc **1.87.0 i stable (1.97.0), debug i release, ×2** (§7). Generator referencji uruchomiony drugi raz — `MANIFEST.sha256` identyczny (71 wpisów).
6. Mutacje: **25/25 zabitych** (§9). Bramy: fmt / clippy / clippy `gpu` / test stable / test 1.87.0 — EXIT=0 (§8).

---

## 1. Zakres i wykonanie GOAL

| Wymóg dispatchu | Stan |
|---|---|
| nakładki rysowane przez `Canvas2dLite` do tekstur — port 1:1 czterech modułów | §2; mapa funkcja weba → funkcja Rust w §2.1 |
| wszystkie wywołania `ctx.*`, układ, kolory, teksty (fonty z `raster::text`, SVG/emoji z `raster::image`) | `emblem::{draw_disc, draw_fallback_glyph, draw_portrait, draw_sigil}`, `stat_plate::{render_plate_background, render_power_frame, render_power_digit}`, `upgrade_badges::{draw_plate, draw_icon}` — kolejność i wartości jak w webie (`plik:linia` w doc-komentarzach) |
| dane wejściowe jako struktury (DTO), bez importu logiki gry | `OwnerEmblemContext`, `StatPlateVitals`, poziomy `u8`, liczba gwiazdek `u32`, źródła obrazów przez cechy `OwnerEmblemAssets` / `UpgradeBadgeAssets` (odpowiedniki `setUnitOwnerEmblemAssets` / `setUnitUpgradeBadgeAssets`) |
| tekstura jako bufor RGBA + metadane (rozmiar, kotwica, skala) | `OverlayTexture` (§2.2) |
| sceny vs Chromium 141 z `gen.mjs` (FUNKCJE rysujące weba na prawdziwym Canvas 2D; różne poziomy weterana, odznaki ścieżek, właściciele, liczby statystyk, długości nazw) | §3–§6: 36 tekstur, 111 drzew; „długości nazw” = długości liczby Mocy 1–5 cyfr i postać wykładnicza `1e+21` (moduły MOD-08 nie rysują nazw jednostek — ZAŁOŻENIE Z-32-13) |
| progi SSIM ≥ 0,985, mean ≤ 1,5, px>16 ≤ 5 % (wyjątki jawnie) | §6 — 51/51 w progach, wyjątków brak |
| determinizm hash RGBA, 2+ przebiegi, rustc 1.87 i najnowszy | §7 |
| mutacje ≥ 15 | §9 — 25/25 |
| fixtury z manifestem sha256, wejścia z `gra/src/assets` jako minimalny podzbiór | `tests/fixtures/overlay/MANIFEST.sha256` (71 wpisów) + test; wejścia: 3 portrety JPG + 6 SVG (§3.2); razem fixtury 3 945 686 B (≤ 8 MB) |
| bez uploadu na GPU (RR-T8d) | brak — tylko CPU |

**ZAŁOŻENIA** (luki dispatchu rozstrzygnięte bez pytania):
- **Z-32-0 (szablon):** sekcja KONTEKST opisuje wzorzec modeli 3D (porównanie bitowe meshy, esbuild/three); GOAL opisuje tekstury Canvas vs Chromium (RR-T8a/b/c). Zrobiono **oba**: drzewa Three (bitowo, node) i płótna (metryki, Chromium). Lista „przeczytaj OBOWIĄZKOWO”: P4-4 (§1 wiersze 76–79, §4 wiersz 8, §6 D-MOD-1…9 — przeczytane), P4-30 (w całości — wzorzec RR-T8c, z którego ten temat korzysta), P4-3 (§3, §8 RR-T8/RR-T9, D-RR-4 — przeczytane fragmenty), P4-8 i P4-6 — przeczytany kod `geom/shape.rs` (`extrude_geometry`, `Path2`) i `geom/prims.rs` (`plane_geometry`), z dokumentów tylko to, co ich dotyczy; P4-11 — nie czytany w całości (wzorzec „node + bitowo” przejęty z README fixtur `units_zelazo`).
- **Z-32-1 (moduł `units`):** `src/units/mod.rs` **nie istniał**. Allowlista daje `src/units/overlay/**` i „minimalne `pub mod overlay;` w `units/mod.rs` (jeśli istnieje; opisz)”, a KONTEKST — jedną linię `pub mod <moduł>;` w `lib.rs`. Utworzono `src/units/mod.rs` z jedną deklaracją `pub mod overlay;` (+ 2 linie dokumentacji) i dopisano `pub mod units;` w `lib.rs`. Jeśli inny temat równolegle tworzy `units/mod.rs`, konflikt dotyczy tej jednej linii.
- **Z-32-2 (źródło liczb):** liczby drzew z node v22.22.0 (V8 12.4) — konwencja wszystkich fixtur MOD i `jsmath` crate'a; płótna z Chromium 141. Różnice Chromium↔node w drzewach: §4.2.
- **Z-32-3 (adaptacja środowiska, nie kodu weba):** w stronie generatora (1) setter `CanvasRenderingContext2D.font` mapuje stosy fontów weba na dołączone pliki (`mapFont` z `tests/fixtures/image/gen.mjs`), (2) `window.Image` opakowany, by poczekać na wszystkie `onload`/`onerror` (`loadImageInto`). Kod czterech modułów — bez zmian.
- **Z-32-4 (cache):** web trzyma jedną teksturę na klucz wariantu (`emblem:<key>`, `badge:<ścieżka>:<poziom>`, tło, ramka, cyfry 0–9) i **pierwszy kontekst danego klucza wygrywa**. Rust: czyste funkcje renderujące + funkcje kluczy (`owner_emblem_key`, `TextureRef`); cache należy do wywołującego (RR-T8d / integracja). Test odtwarza regułę „pierwszy wygrywa” (fixtura zawiera przypadek `barb_cs` jako pierwszy kontekst klucza `barb`).
- **Z-32-5 (faza asynchroniczna):** web rysuje dwufazowo (tarcza + glif → po `onload` przerysowanie). Rust zwraca obie fazy: `initial` i `texture` (dla `onerror` / braku źródła / pustego SVG — identyczne, jak w webie). Porównane obie (15 stanów `initial` różnych od końcowych).
- **Z-32-6 (typy DTO):** `vitals.*` = `Option<f64>` (`undefined` = `None`, NaN/±∞ reprezentowalne — test je pokrywa); `ownerColor` = `Option<u32>` (web: `number`; gra podaje `_resolveOwnerColor`, liczbę całkowitą); poziomy ścieżek `u8` (typ weba 0–3; poza 1–3 brak ikony), liczba gwiazdek `u32`.
- **Z-32-7 (portret):** `leaderPortraitUrl` weba zwraca `data:` URI JPG; cecha Rust zwraca bajty JPG (te same bajty). Błąd dekodowania = ścieżka `onerror` weba (zostaje glif, **bez** przejścia na sygnet — jak w webie, bo URL istniał).
- **Z-32-8 (gwiazdki weterana):** moduł weba nie używa Canvas — to bryły `ExtrudeGeometry` + `MeshStandardMaterial`. Port: kształt gwiazdy (`js_cos`/`js_sin` z `jsmath`) → istniejące `geom::extrude_geometry` (bez zmian w `geom/**`), materiały jako dane. Geometria porównana bitowo (108 wierzchołków, 36 trójkątów, normalne, UV, grupy).
- **Z-32-9 (stan po wielu `sync()`):** `build_*` zwracają drzewo świeżego żetonu; `StatPlateSyncState` portuje księgowanie `userData` (`statPlateOwnerKey` / `statPlatePowerKey` / `statPlateBars`) i mówi, co web przebudowuje. Fixtura ma 4 historie tabliczki + historię rządka odznak i gwiazdek: końcowe drzewo weba = świeże drzewo Rust, a `userData` = stan Rust (bitowo).
- **Z-32-10 (kolejność pod-grup w żetonie):** kolejność dodawania tabliczki, rządka odznak i gwiazdek do żetonu wynika z `render/units.ts:6147-6170` (MOD-04, poza paczką); tu każda pod-grupa osobno.
- **Z-32-11 (faza bez assetów):** tekstury bez wstrzykniętego źródła (podglądy/galeria/testy) porównane dla emblematów i odznak; tabliczek w tej fazie nie generowano, bo materiał ikony właściciela jest w webie cache'owany per klucz (`unitStatPlate.ts:474-482`) i po `setUnitOwnerEmblemAssets(null)` nadal trzyma starą teksturę (obserwacja W-3, §10) — gra woła setter raz, przed pierwszym żetonem (`main.ts:8526`).
- **Z-32-12 (legacy):** `applyUnitOwnerEmblem` (duży medalion-sprite, `:480-503`) gra już nie woła; port jako dane (`legacy_owner_emblem_sprite`), porównany bitowo (3 drzewa).
- **Z-32-13 („długości nazw”):** żaden z czterech modułów nie rysuje nazwy jednostki; zmienną długość tekstu ma wyłącznie liczba Mocy (1–5 cyfr, zacieśnianie rozstawu od 4 cyfr, `String(1e21) = "1e+21"`, znaki niecyfrowe pomijane przy zachowaniu indeksu) — pokryte. Slot generała (`GENERAL_SLOT_*`) — tylko stałe, web nic tam nie rysuje.

---

## 2. Implementacja

### 2.1 Mapa web → Rust

| web (`edb8fb56`) | Rust (`units::overlay::…`) |
|---|---|
| `unitOwnerEmblem.ts:91-100` `UnitOwnerEmblemContext`, `:121-128` `UnitOwnerEmblemAssets` | `emblem::OwnerEmblemContext`, `emblem::OwnerEmblemAssets` |
| `:159-205` stałe, `:176-183` `RING_COLOR`, `:186` `DISC_FILL` | stałe `emblem::*`, `EmblemVariant::ring_color` |
| `:242-254` `drawDisc`, `:257-264` `drawFallbackGlyph`, `:267-281` `drawPortrait`, `:284-288` `drawSigil`, `:391-397` pierścień na portrecie | `draw_disc`, `draw_fallback_glyph`, `draw_portrait`, `draw_sigil`, `ring_on_top` |
| `:306-312` `emblemKey` / `:426` `ownerEmblemKey` | `owner_emblem_key` (+ `js_trim`, JS `Math.round`, `String(n)`) |
| `:328-414` `getEmblemAsset` (rozstrzyganie barb → miasto-państwo → portret → sygnet → glif) | `render_owner_emblem` (bez cache, Z-32-4) |
| `:352-358` `SpriteMaterial`, `:480-503` `applyUnitOwnerEmblem` | `owner_emblem_sprite_material`, `legacy_owner_emblem_sprite` |
| `unitStatPlate.ts:92-286` geometria i kolejność rysowania | stałe `stat_plate::*` (wszystkie wyrażenia w tej samej kolejności działań) |
| `:314-326` `roundedRectPath` (z ograniczeniem promienia) | `stat_plate::rounded_rect_path` (prywatna) |
| `:403-447` tło, `:556-577` ramka Mocy, `:600-626` cyfry | `render_plate_background`, `render_power_frame`, `render_power_digit` |
| `:379-393` `makeFlatMaterial` | `overlay::flat_material` |
| `:456-466` pasma HP, `:640-645` `powerText`, `:705-712` `barFraction`, `:737-741` `packBars` | `HpBand`, `power_text`, `bar_fraction`, `pack_bars` |
| `:652-686` `buildPowerGroup`, `:748-754` `makeFillMesh`, `:770-812` `buildPlateGroup`, `:851-908` `applyUnitStatPlate` | `build_stat_plate`, `StatPlateSyncState::apply` |
| `unitUpgradeBadges.ts:115-135` kolory/etykiety, `:156-206` układ rządka, `:213-233` `starsHalfSpan`/`iconCenterX` | `PATH_BADGE_COLOR`, `path_badge_label`, stałe, `stars_half_span`, `icon_center_x` |
| `:270-298` płytka + ikona, `:311-342` `getBadgeAsset` | `draw_plate`, `draw_icon`, `render_upgrade_badge` |
| `:358-360` `packRowState`, `:379-429` `buildBadgeRowGroup` / `applyUnitUpgradeBadgeRow` | `pack_row_state`, `build_upgrade_badge_row` |
| `unitVeteranBadges.ts:153-194` gwiazda + materiały, `:213-265` rząd gwiazdek, `:268-271` poziom → gwiazdki | `veteran_star_shape`, `veteran_star_geometry`, `veteran_star_material`, `veteran_star_outline_material`, `star_offsets_x`, `build_veteran_badge`, `stars_for_level` |
| `unitVitalsPalette.ts` | istniejące `core::vitals` (MOD-01) |

`syncUnitUpgradeBadges` / `syncUnitVeteranBadges` (liczą poziomy z jednostki — logika gry `game/unit-building-bonuses.ts`, `game/veteran.ts`) **nie są portowane** — DTO (dispatch).

### 2.2 `OverlayTexture`, `OverlayTree`
- `OverlayTexture`: `width`, `height`, `rgba` (straight RGBA8, wiersz 0 = góra), `premultiplied`, `hash` (FNV-1a 64), `min_filter` / `mag_filter` (`TextureFilter` → stała Three 1006/1008), `generate_mipmaps` (domyślne `true` Three — także tam, gdzie web zostawia `LinearFilter`), `srgb`, `flip_y`, `anchor` (`Center` / `LeftEdge`), `world_size` (nominalny quad: tło 0,59×0,194, ramka 0,24×0,20, cyfra 0,072×0,126, emblemat w tabliczce 0,20², odznaka 0,24²), `redrawn_after_load` (= `texture.version` 2 w webie).
- `OverlayTree`: węzły w kolejności `traverse` Three; `NodeKind::{Group, Mesh{geometry, material}, Sprite{center, material}}`; `GeometryKind::{QuadCenter, QuadLeft, VeteranStar}` → `geom::Mesh` (`plane_geometry(1,1,1,1)`, przesunięty o +0,5, `extrude_geometry`); `OverlayMaterial` (kolory liniowe przez `terrain::color::Color::from_hex` = `THREE.Color.setHex`, `map` / `emissiveMap` jako `TextureRef`).

---

## 3. Generator referencji (`tests/fixtures/overlay/gen.ts` + `gen.mjs`, README tamże)

### 3.1 Co jest uruchamiane
`gen.ts` importuje cztery moduły **bez zmian** i woła ich eksporty — dokładnie te, których używają `render/units.ts:6141-6170` i `main.ts:8526-8541`: `setUnitOwnerEmblemAssets`, `setUnitUpgradeBadgeAssets`, `ownerEmblemKey`, `ownerEmblemTexture`, `applyUnitStatPlate`, `applyUnitUpgradeBadgeRow`, `applyUnitVeteranBadgeStarCount`, `applyUnitVeteranBadgeLevel`, `applyUnitOwnerEmblem`, `pathBadgeLabel`, eksportowane stałe. Tekstury = kanwy `texture.image` po wczytaniu wszystkich obrazków (`getImageData`), stany `initial` = zrzut kanwy synchronicznie przy pierwszym pojawieniu się tekstury. Drzewa = `traverse` żetonu (`THREE.Group`) po wywołaniu.

### 3.2 Wejścia
- konteksty właściciela (13): pełne cywilizacje z portretem (grecy/2, zulusi/3, egipt/1), bez portretu → sygnet (grecy/1, „nieznana” → `civ-default`), bez sygnetu (`''`) → glif, `civId = null`, miasta-państwa (grecy, zulusi, pusty sygnet, `' nieznana '` z białymi znakami), barbarzyńcy, barbarzyńcy + miasto-państwo;
- 416 kontekstów kluczy (8 `civId` × 13 er, w tym 0, −3, 2,5, 2,4999, 3,5, −0,5, NaN, ±∞, 1e9 × 4 kombinacje flag);
- 19 zestawów vitals: pełne, połowa ruchu, progi HP 60 % i 30 % dokładnie, HP 0, ułamki 0,001 / 0,0021 / 0,002 (próg widoczności 0,002), `undefined`, NaN, ±∞, wartości ujemne, maksimum 0 i ujemne, wartość > maksimum, Moc: brak, 0,4, 0,5, 2,5, 3, 7, 9, 10, 42, 100, 173, 568, 1000, 1234, 99999, 1e21, NaN, ∞, −5; kolory właściciela różne i brak (→ `0xffffff`);
- odznaki: wszystkie 16 par poziomów (0–3 × 0–3) × gwiazdki 0–3 (+ 4 dla 3/3), gwiazdki 0–3, poziomy weterana 1–3, historie;
- assety: SVG = wynik `brandIconSvg(…, 40)` / `civIconSvg(…, 40)` z `normalizeSvg` (`ui/icons/brandAssets.ts:50-61`) ze źródła pinu — 6 plików; portrety = bajty `gra/src/assets/portrety/*.jpg` — 3 pliki; test `inputs_equal_the_rr_t8c_pin_inputs`: bajty identyczne z wejściami RR-T8c, których zgodność z blobami pinu sprawdza `image_assets::inputs_are_the_pin_bytes`.

### 3.3 Wersje (`versions.txt`)
node v22.22.0, playwright 1.56.1, **Chromium 141.0.7390.37** (`--disable-gpu --force-color-profile=srgb --font-render-hinting=none`), three 0.169.0, esbuild 0.24.0.

---

## 4. Drzewa Three — bit w bit (`trees_match_the_web_bit_for_bit`)

### 4.1 Wynik
111 drzew (tabliczka 4 właścicieli × vitals + 4 historie; 65 rządków odznak + 2 bez assetów + historia; 4 + 3 + historia gwiazdek; 3 legacy) — **18 089 porównań, 0 różnic**: typ węzła, nazwa, rodzic, `position` / `rotation` (z kolejnością XYZ) / `scale` (`to_bits`), `renderOrder`, `visible`, `userData` węzła, geometria (pozycje/normalne/UV jako bity f32, indeksy, grupy), materiał (typ, `color` i `emissive` liniowe — bity f64, `map`/`emissiveMap` — spójna bijekcja tekstura weba ↔ `TextureRef`, `transparent`, `depthTest`, `depthWrite`, `toneMapped`, `side`, `opacity`, `roughness`, `metalness`, `flatShading`), a na korzeniu żetonu księgowanie `userData` (`statPlateOwnerKey`, `statPlatePowerKey`, `statPlateBars`, `upgBadgeRowState`, `vetBadgeStarCount`, `ownerEmblemKey`).
Dodatkowo: `emblem_keys_match_the_web` 416/416, `constants_match_the_web_bit_for_bit` 23 stałe + `VETERAN_BADGE_HIT_UD`, `badge_labels_match_the_web` 4/4.

### 4.2 Chromium 141 vs node 22 (`chromium_tree_differences_are_only_last_bit_noise`)
Ten sam bundle w Chromium daje **10 różnic** w drzewach (lista w `overlay.json` → `chromiumTreeDiffs`; generator przerywa przy każdej innej): 8 kanałów koloru liniowego o **1 ulp** (`THREE.Color.setHex` → `SRGBToLinear` → `Math.pow`) i 2 współrzędne punktów obrysu gwiazdy w informacyjnym `params` geometrii (`Math.cos`/`Math.sin`; tablice f32 wierzchołków identyczne). Zmierzone osobno: `SRGBToLinear(i/255)` dla i = 0…255 — **30/256** wyników różni się między V8 node 22 a V8 Chromium 141 (np. i = 17: `0.005605391621829107` vs `…108`). Wniosek dla RR-T5: kolory materiałów liczone w Rust (`jsmath::js_pow` = node) mogą różnić się od przeglądarki o 1 ulp f64 — po konwersji do f32 i 8 bitów bez znaczenia; NIE_ZMIERZONO na GPU.

---

## 5. Tekstury — co jest rysowane

| tekstura | płótno | filtr | pochodzenie (`plik:linia`) |
|---|---|---|---|
| medalion właściciela | 128×128 | Linear | `unitOwnerEmblem.ts:242-288`, `:328-414` |
| tło tabliczki | 512×**168** | LinearMipmapLinear | `unitStatPlate.ts:403-447` (`BG_CANVAS_H` = `Math.round(512·0,194/0,59)`; komentarz `// 130` w `:312` jest nieaktualny — W-1) |
| ramka Mocy (biała, barwiona materiałem) | 256×213 | Linear | `:556-577` |
| cyfra Mocy 0–9 | 72×126 | LinearMipmapLinear | `:600-626` (`900 118px "Segoe UI", Arial, sans-serif` → Liberation Sans Bold; obrys 28 px `lineJoin: round`) |
| odznaka ulepszenia (2 ścieżki × 3 poziomy) | 128×128 | LinearMipmapLinear | `unitUpgradeBadges.ts:285-298`, `:311-342` |

---

## 6. Tekstury vs Chromium 141 (`textures_match_chromium`, pełny log `dowody/07-overlay-tests-nocapture.log`)

Progi **jak RR-T8a/b/c**: SSIM ≥ 0,985, mean_abs ≤ 1,5, px>16 ≤ 5 %. Dodatkowo bitowo: rozmiar płótna, `minFilter`, `magFilter`, `generateMipmaps`, `colorSpace`, `flipY`, `version` (przerysowanie po wczytaniu) i „stan początkowy = końcowy”.

| web id | faza | tekstura (Rust) | płótno | max | mean_abs | px>16 % | SSIM |
|---|---|---|---|---|---|---|---|
| `t0` | final | `OwnerEmblem("civ:grecy:2")` | 128x128 | 123 | 1.0809 | 2.374 | 0.99066 |
| `t0` | initial | `OwnerEmblem("civ:grecy:2")` | 128x128 | 91 | 0.9242 | 2.887 | 0.99177 |
| `t1` | final | `OwnerEmblem("civ:zulusi:3")` | 128x128 | 123 | 1.1031 | 2.362 | 0.99076 |
| `t1` | initial | `OwnerEmblem("civ:zulusi:3")` | 128x128 | 91 | 0.9242 | 2.887 | 0.99177 |
| `t2` | final | `OwnerEmblem("civ:egipt:1")` | 128x128 | 123 | 1.0910 | 2.405 | 0.99053 |
| `t2` | initial | `OwnerEmblem("civ:egipt:1")` | 128x128 | 91 | 0.9242 | 2.887 | 0.99177 |
| `t3` | final | `OwnerEmblem("civ:grecy:1")` | 128x128 | 91 | 1.0078 | 3.101 | 0.99108 |
| `t3` | initial | `OwnerEmblem("civ:grecy:1")` | 128x128 | 91 | 0.9242 | 2.887 | 0.99177 |
| `t4` | final | `OwnerEmblem("civ:nieznana:2")` | 128x128 | 91 | 1.0124 | 2.985 | 0.99117 |
| `t4` | initial | `OwnerEmblem("civ:nieznana:2")` | 128x128 | 91 | 0.9242 | 2.887 | 0.99177 |
| `t5` | final | `OwnerEmblem("civ:brak:2")` | 128x128 | 91 | 0.9242 | 2.887 | 0.99177 |
| `t6` | final | `OwnerEmblem("civ:unknown:2")` | 128x128 | 91 | 0.9242 | 2.887 | 0.99177 |
| `t7` | final | `OwnerEmblem("cs:grecy")` | 128x128 | 91 | 1.0281 | 2.838 | 0.99093 |
| `t7` | initial | `OwnerEmblem("cs:grecy")` | 128x128 | 91 | 0.9418 | 2.631 | 0.99165 |
| `t8` | final | `OwnerEmblem("cs:zulusi")` | 128x128 | 91 | 1.0383 | 2.979 | 0.99100 |
| `t8` | initial | `OwnerEmblem("cs:zulusi")` | 128x128 | 91 | 0.9418 | 2.631 | 0.99165 |
| `t9` | final | `OwnerEmblem("cs:brak")` | 128x128 | 91 | 0.9418 | 2.631 | 0.99165 |
| `t10` | final | `OwnerEmblem("cs:nieznana")` | 128x128 | 91 | 1.0334 | 2.869 | 0.99101 |
| `t10` | initial | `OwnerEmblem("cs:nieznana")` | 128x128 | 91 | 0.9418 | 2.631 | 0.99165 |
| `t11` | final | `OwnerEmblem("barb")` | 128x128 | 91 | 0.6463 | 2.930 | 0.99308 |
| `t11` | initial | `OwnerEmblem("barb")` | 128x128 | 91 | 0.7140 | 3.235 | 0.99299 |
| `t12` | final | `PlateBackground` | 512x168 | 37 | 0.4550 | 0.033 | 0.99146 |
| `t13` | final | `PowerFrame` | 256x213 | 73 | 0.0857 | 0.189 | 0.99967 |
| `t14` | final | `PowerDigit(4)` | 72x126 | 83 | 0.4859 | 1.565 | 0.99742 |
| `t15` | final | `PowerDigit(2)` | 72x126 | 84 | 0.5868 | 2.458 | 0.99616 |
| `t16` | final | `PowerDigit(1)` | 72x126 | 36 | 0.2244 | 0.661 | 0.99876 |
| `t17` | final | `PowerDigit(3)` | 72x126 | 88 | 0.6663 | 2.954 | 0.99465 |
| `t18` | final | `PowerDigit(7)` | 72x126 | 58 | 0.3620 | 1.036 | 0.99831 |
| `t19` | final | `PowerDigit(9)` | 72x126 | 103 | 0.6461 | 2.679 | 0.99455 |
| `t20` | final | `PowerDigit(0)` | 72x126 | 90 | 0.6223 | 2.568 | 0.99471 |
| `t21` | final | `PowerDigit(5)` | 72x126 | 111 | 0.6197 | 2.260 | 0.99502 |
| `t22` | final | `PowerDigit(6)` | 72x126 | 70 | 0.7337 | 3.417 | 0.99390 |
| `t23` | final | `PowerDigit(8)` | 72x126 | 87 | 0.7318 | 2.987 | 0.99325 |
| `t24` | final | `UpgradeBadge(Soft, 1)` | 128x128 | 80 | 0.3228 | 1.074 | 0.99815 |
| `t24` | initial | `UpgradeBadge(Soft, 1)` | 128x128 | 80 | 0.1869 | 0.653 | 0.99900 |
| `t25` | final | `UpgradeBadge(Soft, 2)` | 128x128 | 80 | 0.5629 | 1.538 | 0.99738 |
| `t25` | initial | `UpgradeBadge(Soft, 2)` | 128x128 | 80 | 0.3021 | 0.732 | 0.99866 |
| `t26` | final | `UpgradeBadge(Soft, 3)` | 128x128 | 80 | 0.3940 | 1.581 | 0.99789 |
| `t26` | initial | `UpgradeBadge(Soft, 3)` | 128x128 | 80 | 0.2211 | 0.751 | 0.99892 |
| `t27` | final | `UpgradeBadge(Armor, 1)` | 128x128 | 80 | 0.2546 | 0.885 | 0.99862 |
| `t27` | initial | `UpgradeBadge(Armor, 1)` | 128x128 | 80 | 0.1869 | 0.653 | 0.99900 |
| `t28` | final | `UpgradeBadge(Armor, 2)` | 128x128 | 80 | 0.4278 | 1.031 | 0.99813 |
| `t28` | initial | `UpgradeBadge(Armor, 2)` | 128x128 | 80 | 0.3021 | 0.732 | 0.99866 |
| `t29` | final | `UpgradeBadge(Armor, 3)` | 128x128 | 80 | 0.3058 | 1.086 | 0.99847 |
| `t29` | initial | `UpgradeBadge(Armor, 3)` | 128x128 | 80 | 0.2211 | 0.751 | 0.99892 |
| `t30` | final | `OwnerEmblem("civ:grecy:2") (no assets)` | 128x128 | 91 | 0.9242 | 2.887 | 0.99177 |
| `t31` | final | `OwnerEmblem("cs:grecy") (no assets)` | 128x128 | 91 | 0.9418 | 2.631 | 0.99165 |
| `t32` | final | `OwnerEmblem("barb") (no assets)` | 128x128 | 91 | 0.7140 | 3.235 | 0.99299 |
| `t33` | final | `UpgradeBadge(Soft, 2) (no assets)` | 128x128 | 80 | 0.3021 | 0.732 | 0.99866 |
| `t34` | final | `UpgradeBadge(Armor, 1) (no assets)` | 128x128 | 80 | 0.1869 | 0.653 | 0.99900 |
| `t35` | final | `UpgradeBadge(Armor, 3) (no assets)` | 128x128 | 80 | 0.2211 | 0.751 | 0.99892 |

(51 porównań.)

**Wszystkie 51 porównań w progach, bez wyjątków.** Najsłabsze: medaliony z portretem (SSIM 0,9905–0,9908, mean_abs 1,08–1,10 — ten sam poziom co sceny `t10_civ_portrait_*` RR-T8c, różnice na krawędzi koła przycięcia i w pomniejszeniu JPG 256 → 96 px), cyfry Mocy (SSIM 0,9933–0,9988; obrys 28 px wokół glifu Liberation Sans Bold).

---

## 7. Determinizm (`dowody/05-determinism.log`)
`textures_match_golden_hashes` (FNV-1a 64 bufora premultiplied, `tests/fixtures/overlay/golden.tsv`: 36 tekstur × (initial, final)) — 8 przebiegów: rustc **1.87.0** i **stable 1.97.0** × debug/release × 2:

```
golden.tsv body sha256: 8715a0e13ae78e943822dd3709346b5d3ccf582b6fc529aa741e50bc88d7402c  (36 textures)
toolchain=1.87.0 profile=debug run=1 textures=36 sha256(hashes)=8715a0e13ae78e943822dd3709346b5d3ccf582b6fc529aa741e50bc88d7402c EXIT=0
toolchain=1.87.0 profile=debug run=2 textures=36 sha256(hashes)=8715a0e13ae78e943822dd3709346b5d3ccf582b6fc529aa741e50bc88d7402c EXIT=0
toolchain=1.87.0 profile=--release run=1 textures=36 sha256(hashes)=8715a0e13ae78e943822dd3709346b5d3ccf582b6fc529aa741e50bc88d7402c EXIT=0
toolchain=1.87.0 profile=--release run=2 textures=36 sha256(hashes)=8715a0e13ae78e943822dd3709346b5d3ccf582b6fc529aa741e50bc88d7402c EXIT=0
toolchain=stable profile=debug run=1 textures=36 sha256(hashes)=8715a0e13ae78e943822dd3709346b5d3ccf582b6fc529aa741e50bc88d7402c EXIT=0
toolchain=stable profile=debug run=2 textures=36 sha256(hashes)=8715a0e13ae78e943822dd3709346b5d3ccf582b6fc529aa741e50bc88d7402c EXIT=0
toolchain=stable profile=--release run=1 textures=36 sha256(hashes)=8715a0e13ae78e943822dd3709346b5d3ccf582b6fc529aa741e50bc88d7402c EXIT=0
toolchain=stable profile=--release run=2 textures=36 sha256(hashes)=8715a0e13ae78e943822dd3709346b5d3ccf582b6fc529aa741e50bc88d7402c EXIT=0
```

Przebłogosławienie: `OVERLAY_BLESS=1 cargo test --test overlay_web_parity textures_match_golden_hashes` (tylko po świadomej zmianie). `rendering_twice_is_identical` — dwa rendery w jednym procesie identyczne. Generator referencji (Chromium + node) uruchomiony ponownie do osobnego katalogu: `MANIFEST.sha256` **identyczny** (71 wpisów, `dowody/06-generator-repro.log`). Platforma x86_64 Linux; inne — NIE_ZMIERZONO.

---

## 8. Testy i bramy

| plik | testy | co sprawdza |
|---|---|---|
| `src/units/overlay/*` (unit) | 4 | klucze emblematu (przypadki brzegowe), kotwiczenie portretu u góry (obraz 1×2 — §9 O05), rozmiary płócien i font cyfr, `bar_fraction` / `power_text` |
| `tests/overlay_web_parity.rs` | 11 | §4, §4.2, §6, §7, `rendering_twice_is_identical`, SHA-256 (wektory FIPS), manifest fixtur + ≤ 8 MB, wejścia = wejścia RR-T8c |

Bramy — `dowody/01-gates.log` (surowe logi z `EXIT=`):
```
## pwd /home/user/The-Game/.claude/worktrees/wf_2dc7845f-8c3-1/rust-port/renderer  HEAD 672c2059  (working tree: 75 changed/untracked paths under rust-port/renderer)
## rustc rustc 1.97.0 (2d8144b78 2026-07-07) | 1.87: rustc 1.87.0 (17067e9ac 2025-05-09)
$ cargo fmt --all -- --check
EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.07s
EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_2dc7845f-8c3-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 26.77s
EXIT=0
$ cargo test --locked --all-targets
test result: ok. 58 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.37s
test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.17s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.94s
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.36s
test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.54s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 7.34s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.38s
test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.17s
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.59s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.36s
test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.13s
test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 7.78s
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.81s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 9.39s
test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.57s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.05s
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 21.80s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.33s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.99s
test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.51s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.92s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.10s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.35s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.24s
EXIT=0
## disk after cargo clean: /dev/vda        252G   32G  7.3G  82% /
$ cargo +1.87.0 test --locked --all-targets
test result: ok. 58 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.26s
test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.14s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.54s
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.41s
test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.56s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.82s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.03s
test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.61s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.25s
test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.90s
test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 6.99s
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.13s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 9.07s
test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.52s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.82s
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 16.69s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.67s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.13s
test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.55s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.91s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.75s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.26s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.34s
EXIT=0
## /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tmp.157GuLQQD2/p432-test-stable.txt: passed=287 failed=0
## /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tmp.157GuLQQD2/p432-test-187.txt: passed=287 failed=0
$ git diff --cached --check && git diff --check   (run after the explicit git add of the allowlist)
EXIT=0
```

Po bramach zmieniły się wyłącznie dwie linie komentarza dokumentacji w `tests/overlay_web_parity.rs` (liczby 110→111 i 32/17→36/15); ponownie: `cargo fmt --all -- --check` EXIT=0, `cargo clippy --locked --all-targets -- -D warnings` EXIT=0, `cargo test --locked --test overlay_web_parity` 11 passed.

Incydent środowiskowy (do wiadomości orkiestratora): przy przerywaniu pierwszego przebiegu mutacji użyto `pkill -f "cargo test --locked"`, co na współdzielonej maszynie mogło przerwać równoległe procesy `cargo test` innych sesji (wynik ich bram należy ewentualnie powtórzyć). Przerwany przebieg zostawił w `emblem.rs` mutację O03 — przywrócona ręcznie i zweryfikowana (skrypt mutacji od tej pory przywraca plik także przy SIGTERM); końcowy przebieg 25/25 i bramy — na czystym kodzie.

---

## 9. Mutacje (`dowody/08-mutations.py`, log `dowody/08-mutations.log`)
Każda mutacja = jedna podmiana fragmentu w `src/units/overlay/*.rs` (asercja jednokrotnego wystąpienia), uruchomienie `cargo test --lib units::overlay` + `--test overlay_web_parity`, przywrócenie pliku (także przy SIGTERM).

| ID | plik | mutacja | wynik | zabija |
|---|---|---|---|---|
| O01 | `src/units/overlay/emblem.rs` | variant: city-state checked before barbarians | **KILLED** | textures_match_chromium, textures_match_golden_hashes |
| O02 | `src/units/overlay/emblem.rs` | emblem key not lower-cased | **KILLED** | emblem_keys_match_the_web, units::overlay::emblem::tests::keys_follow_the_web_rules |
| O03 | `src/units/overlay/emblem.rs` | disc radius 54 -> 53 | **KILLED** | textures_match_chromium, textures_match_golden_hashes |
| O04 | `src/units/overlay/emblem.rs` | ring not stroked again over the portrait | **KILLED** | textures_match_chromium, textures_match_golden_hashes |
| O05 | `src/units/overlay/emblem.rs` | portrait centred instead of top-anchored | **KILLED** | units::overlay::emblem::tests::portrait_is_anchored_at_the_top |
| O06 | `src/units/overlay/emblem.rs` | ring width 14 -> 7 (pre R-ZETON-PASKI value) | **KILLED** | textures_match_chromium, textures_match_golden_hashes |
| O07 | `src/units/overlay/emblem.rs` | fallback glyph without the +3 px offset | **KILLED** | textures_match_chromium, textures_match_golden_hashes |
| O08 | `src/units/overlay/emblem.rs` | asset lookup with an untrimmed civId | **KILLED** | textures_match_chromium, textures_match_golden_hashes |
| O09 | `src/units/overlay/stat_plate.rs` | bar gap 0.042 -> 0.028 | **KILLED** | constants_match_the_web_bit_for_bit, rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit, units::overlay::stat_plate::tests::canvas_sizes |
| O10 | `src/units/overlay/stat_plate.rs` | missing bar value = empty bar instead of full | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit, units::overlay::stat_plate::tests::fractions_and_power_text |
| O11 | `src/units/overlay/stat_plate.rs` | HP red band uses < instead of <= | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit |
| O12 | `src/units/overlay/stat_plate.rs` | fill visible threshold 0.002 -> 0 | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit |
| O13 | `src/units/overlay/stat_plate.rs` | packBars floors the movement fraction | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit |
| O14 | `src/units/overlay/stat_plate.rs` | power 0 shown as a digit | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit, units::overlay::stat_plate::tests::fractions_and_power_text |
| O15 | `src/units/overlay/stat_plate.rs` | digit advance not tightened for long numbers | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit |
| O16 | `src/units/overlay/stat_plate.rs` | digit outline width 0.22 -> 0.15 of the height | **KILLED** | textures_match_chromium, textures_match_golden_hashes |
| O17 | `src/units/overlay/stat_plate.rs` | trough corner radius 0.32 -> 0.5 of the bar height | **KILLED** | textures_match_golden_hashes |
| O18 | `src/units/overlay/upgrade_badges.rs` | Barracks badge on the right | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit |
| O19 | `src/units/overlay/upgrade_badges.rs` | icon gap 0.05 -> 0.03 | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit |
| O20 | `src/units/overlay/upgrade_badges.rs` | badge icon stroke not boosted | **KILLED** | textures_match_chromium, textures_match_golden_hashes |
| O21 | `src/units/overlay/veteran_badges.rs` | star inner radius 0.42 -> 0.5 | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit |
| O22 | `src/units/overlay/veteran_badges.rs` | outline star in front of the star | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit |
| O23 | `src/units/overlay/veteran_badges.rs` | star emissive 45 % -> 50 % | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit |
| O24 | `src/units/overlay/mod.rs` | flat plate material single-sided | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit |
| O25 | `src/units/overlay/mod.rs` | JS exponent form of String(n) dropped (1e21 printed in full) | **KILLED** | rendering_twice_is_identical, textures_match_chromium, textures_match_golden_hashes, trees_match_the_web_bit_for_bit, units::overlay::stat_plate::tests::fractions_and_power_text |

**Result: 25/25 killed** (`dowody/08-mutations.log`, EXIT=0). O05 (portret wyśrodkowany zamiast przy górze) jest **równoważny dla wszystkich 45 portretów pinu** (wszystkie 256×256 — zmierzone nagłówkiem SOF), więc zabija go dopiero test jednostkowy z obrazem 1×2 (`portrait_is_anchored_at_the_top`). Przebieg mutacji poprzedza wyłącznie kosmetyczną zmianę testu (aliasy typów pod `clippy::type_complexity`), bez zmian w `src/`.

---

## 10. Obserwacje o webie (bez zmian w `gra/**`; do ewentualnych zgłoszeń)
- **W-1:** `unitStatPlate.ts:312` — komentarz `// 130` przy `BG_CANVAS_H`; faktycznie 168 (zmierzone: płótno weba 512×168) od podniesienia odstępu pasków (`:103`).
- **W-2:** `unitUpgradeBadges.ts:152` — komentarz „dziś 1,08·HEX_R”; `BADGE_ROW_Y` = 1,27 (`unitStatPlate.ts:195`).
- **W-3:** `unitStatPlate.ts:474-482` — materiał ikony właściciela cache'owany per klucz trzyma teksturę sprzed `setUnitOwnerEmblemAssets(…)`; w grze bez skutku (setter raz, przed żetonami).
- **W-4:** `unitVeteranBadges.ts:221` — komentarz „poziom 1 nigdy tu nie trafia”, a `applyUnitVeteranBadgeStarCount(…, 1)` buduje 1 gwiazdkę (kod obsługuje; gwiazdki = wygrane bitwy od fali 106).
- **W-5:** `powerText` (`:640-645`) dla Mocy ≥ 1e21 daje `"1e+21"`; litera i znak są pomijane, ale liczą się do rozstawu — tylko teoretyczne.

## 11. Co ocenić wzrokiem po RR-T5 (wymaga GPU — NIE_ZMIERZONO)
1. Tabliczka przy kamerze gry 52° i domyślnej odległości: czytelność pasków Ruchu/HP, złotej kreski (≥ 1 px przy 720 p), koryt nad wodą i śniegiem; mipmapy tła 512 → ~60 px (GPU, RR-T8d).
2. Cyfry Mocy 1–5 cyfr przy oddalonej kamerze; barwienie ramki kolorem właściciela (materiał emissive × tekstura).
3. Medalion 0,20·HEX_R: rozróżnialność wariantu po kolorze pierścienia (mosiądz / srebro / czerwień), portret po mipmapach.
4. Odznaki Koszar/Kuźni: kreska ikon ×1,6 przy kilkunastu px, rozróżnienie brąz/srebro/złoto.
5. Gwiazdki weterana: oświetlenie `MeshStandardMaterial` (metalness 0,85, emissive 45 %) i ciemna obwódka na jasnym terenie.
6. Kolejność rysowania (`renderOrder` 11–15, `depthTest: false`, `DoubleSide`) względem modeli jednostek i czaszki głodu.

## 12. NIE_ZMIERZONO
Wygląd na GPU i na Windows (fonty Segoe UI / Segoe UI Symbol), determinizm poza x86_64, `clippy` na 1.87.0 (niezainstalowany w kontenerze, jak P4-28/29/30), upload/mipmapy GPU (RR-T8d), kolejność pod-grup w żetonie (MOD-04), cache tekstur po stronie Rust (Z-32-4).

DEPLOY/PUSH: NIE WYKONANO
