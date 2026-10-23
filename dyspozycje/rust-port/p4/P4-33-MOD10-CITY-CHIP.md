# P4-33 — MOD-10: nakładki miast (`cities::overlay`)

TEMAT: `R-RUSTPORT-P4-33-MOD10-CITY-CHIP-Q1` · DOMAIN: GAME · runda 2/5 (obrona po FAIL Evaluatora r1) · Operator (Opus 5.5 medium)

> **Runda 2 (obrona):** odpowiedzi na zarzuty 1–3 Evaluatora r1 — §6.3 (lokalne miary pikseli), §6.4 (ślad rysowania vs Chromium, w tym napis wiersza hover), §9.2 (mutacje r2: każda zabita testem innym niż złoty hash). Piksele wszystkich referencji i złote hashe Rust bez zmian względem r1.
Paczka katalogu: `R-RUSTPORT-P4-MOD-10-CITY-CHIP` (`P4-4-MODEL-CATALOG.md` §4 wiersz 10: `cityMapStatChip` (1 133), `cityOkolicaOverlay`, `workerFieldOverlay` → `<renderer>/cities/overlay/**`, zależności 8 (rasteryzator), 9, **13** (`cityOkolicaOverlay → rangeOverlay`); §1 wiersze 15, 16, 85: 1 133 / 347 / 211 LOC).
Baza kodu: `origin/rust-port/parity-v2` @ `95b91471` (raster shapes/text/image, atlas P4.31, `units::overlay` P4.32 zintegrowane). Web: pin `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do scratchpadu poza repo; zero buildu weba, zero zmian w `gra/**`).
Dowody surowe (w commicie, `*.log` przez `git add -f`): `dyspozycje/autobot/runs/R-RUSTPORT-P4-33-MOD10-CITY-CHIP-Q1/dowody/` — `01-gates.{sh,log}`, `05-determinism.{sh,log}`, `06-generator-repro.{sh,log}`, `07-cityoverlay-tests-nocapture.log` (pełne tabele), `08-mutations.{py,log}`.

Konwencja: `plik:linia` bez prefiksu = `gra/src/` w pinie `edb8fb56`; w sekcjach o jednym module `:linia` = linia tego modułu (`cityMapStatChip.ts` = `CMSC`, `cityOkolicaOverlay.ts` = `COO`, `workerFieldOverlay.ts` = `WFO`). `NIE_ZMIERZONO` = nie sprawdzone.

---

## 0. Streszczenie

1. Nowy moduł `rust-port/renderer/src/cities/overlay/` (`mod.rs`, `stat_chip.rs`, `okolica.rs`, `worker_field.rs`) + `src/cities/mod.rs` (jedna deklaracja `pub mod overlay;`, ZAŁOŻENIE Z-33-0) + jedna linia `pub mod cities;` w `src/lib.rs`. Zero nowych zależności, `Cargo.toml`/`Cargo.lock` nietknięte, `#![forbid(unsafe_code)]` bez zmian; `geom/**`, `pick/**`, `assets/**`, `camera/**`, `terrain/**`, `models/**`, `decor/**`, `core/**`, `jsmath/**`, `raster/**`, `units/**` — nietknięte (tylko używane).
2. **Port 1:1 wszystkich wywołań `ctx.*`** trzech modułów na `Canvas2dLite` (RR-T8a): plakietka miasta (tarcza obrony, medalion cywilizacji z portretem / sygnetem / ◆, korona stolicy, nazwa z przycinaniem, WZROST%, glif produkcji, kółko populacji, wiersz hover z ostrzeżeniem), etykiety plonów okolicy (🍞 🔨 💰, odznaka 👤, cienie cyfr), ikony pracowników 👤. Tekst przez `raster::text`, emoji / symbole przez `raster::image::emoji` (D-TXT-3 z P4-30: 🍞 🔨 💰 👤 kolorowe z podzbioru Noto, ◆ monochromatyczny z DejaVu Sans), SVG i JPG przez `raster::image`, klucze i skala DPI × LOD przez `raster::atlas` (P4.31). Tekstury: `CanvasTexture` = RGBA8 (straight, jak `getImageData`) + premultiplied + metadane Three (`minFilter`, `magFilter`, `generateMipmaps`, `colorSpace`, `flipY`, `version`). Układ: sprite'y jako dane (`SpriteNode`: pozycja, skala, `center`, `renderOrder`, `visible`, `userData`, parametry `SpriteMaterial`, tekstura przez `TextureRef`) i — dla okolicy — grupy MOD-13 `OverlayGroup` (`models::misc::range::build_range_overlay_group_game`, bez zmian w `models/**`). Wejścia jako DTO — **zero logiki gry** (§1, Z-33-1).
3. **Referencje = uruchomiony kod weba** (nie transkrypcja): trzy moduły z pinu zbundlowane esbuild 0.24.0 + three@0.169.0, wywołane przez ich prawdziwe eksporty w **Chromium 141** (prawdziwy Canvas 2D, te same pliki fontów) na trzech stronach o `devicePixelRatio` 1, 2 i 1,5 — 34 plakietki, 7 drzew okolicy (61 etykiet), 3 przypadki pól pracowników (9 tekstur ikon), funkcje pomocnicze, stałe. Liczby drzew okolicy / pracowników z tego samego bundla w **node v22.22.0** (konwencja wszystkich fixtur MOD); Chromium daje 18 różnic w ostatnim bicie (§4.3).
4. **Wyniki:** drzewa okolicy **bit w bit** (7 drzew, 12 902 porównania: grupy zasięgu/centrum/obrabianych — typ, nazwa, `renderOrder`, `frustumCulled`, materiał, tablice f32 pozycji/normalnych/UV, indeksy, macierze instancji; sprite'y etykiet), drzewa pracowników bit w bit (740 porównań, w tym przebieg mgły i powrót bez mgły), sprite'y i metadane 34 plakietek bit w bit (1 631 porównań), pomocnicze 111/111, stałe 22/22; **tekstury: 133 porównania (34 stany końcowe + 27 początkowych plakietek, 2 rysunki `drawCityMapBadgeCanvas*`, 61 etykiet, 9 ikon) w progach RR-T8a/b/c** (SSIM ≥ 0,985, mean_abs ≤ 1,5, px>16 ≤ 5 %) z **dwoma jawnymi wyjątkami mean_abs** (stolice ×1: 1,5170 i 1,5173 ≤ 1,6; §6.2); najgorszy SSIM 0,99483.
5. Determinizm: złote hashe (104 wiersze: 34 plakietki × 2 stany, 61 etykiet, 9 ikon) identyczne na rustc **1.87.0 i stable (1.97.0), debug i release, ×2** (§7). Generator referencji uruchomiony ponownie do osobnego katalogu — `MANIFEST.sha256` identyczny.
6. Mutacje: r1 **26/26 zabitych** (§9.1); r2 **28/28 zabitych, każda testem innym niż złoty hash / `rendering_twice`** (§9.2). Bramy: fmt / clippy / clippy `gpu` / test stable / test 1.87.0 — EXIT=0 (§8).
7. **Runda 2:** lokalne miary pikseli `win6` / `px>64` z limitami per grupa w każdym porównaniu z Chromium (§6.3) oraz **ślad rysowania** porównywany z Chromium zdarzenie po zdarzeniu — 133 malowania, 2 396 porównań, 474 `fillText` bit w bit, 12 wierszy hover (4 przycięte) — 0 różnic (§6.4).

---

## 1. Zakres i wykonanie GOAL

| Wymóg dispatchu | Stan |
|---|---|
| nakładki miast rysowane przez `Canvas2dLite` — port 1:1 `cityMapStatChip.ts`, `cityOkolicaOverlay.ts`, `workerFieldOverlay.ts` | §2; mapa funkcja weba → funkcja Rust w §2.1 |
| wszystkie wywołania `ctx.*`, układ, kolory, teksty (fonty `raster::text`, emoji/SVG `raster::image`; emoji R4 wg D-TXT-3) | kolejność i wartości jak w webie (`plik:linia` w doc-komentarzach); geometria w f64 z tą samą kolejnością działań; emoji przez `raster::image::emoji` (łańcuch fontów jak przeglądarka) |
| klucze tekstur przez `raster::atlas` | `city_map_badge_key`, `civ_sigil_cache_key`, `leader_portrait_cache_key`, `prod_icon_cache_key`, `worker_sprite_cache_key`, `badge_canvas_px` — re-eksport z `raster::atlas::{keys,scale}` (bez duplikatów) |
| dane wejściowe jako DTO (bez logiki gry) | `CityMapBadgeInput` (ta sama struktura co klucze P4.31), `CityMapBadgeAssets` (odpowiednik trzech setterów `main.ts:8531-8535`), `OkolicaMap` (teren + wynik `hexHasCoveringTerrainImprovement` jako zbiór), `CityOkolicaOverlayParams` (`yield_of` jak `params.yieldOf`), `worked_by_owner: &[(HexKey, f64)]` |
| `cityOkolicaOverlay → rangeOverlay` z MOD-13 (`models/misc`) | `build_range_overlay_group_game` (prawdziwy sampler reliefu; style miasta nie mają `hugTerrainRelief`) |
| tekstura RGBA + metadane | `CanvasTexture` (§2.2) |
| weryfikacja jak P4.32: Chromium 141 na kodzie weba, SSIM ≥ 0,985 / mean ≤ 1,5 / px>16 ≤ 5 %, wyjątki jawnie | §6 — wszystko w progach, 2 jawne wyjątki mean_abs (§6.2) |
| determinizm 1.87 vs najnowszy | §7 |
| mutacje ≥ 15 | §9 — 26/26 |
| fixtury z manifestem sha256 | `tests/fixtures/cityoverlay/MANIFEST.sha256` (98 wpisów: 91 plików fixtury + 7 fontów) + test; razem z README, manifestem i `golden.tsv` 5 277 209 B (≤ 8 MB) |
| bez uploadu GPU | brak — tylko CPU |

**ZAŁOŻENIA** (luki dispatchu rozstrzygnięte bez pytania):
- **Z-33-0 (moduł `cities`):** `src/cities/` **nie istniał** (modele miast żyją w `models/cities`, poza allowlistą). Allowlista daje `src/cities/overlay/**` i „minimalne `pub mod overlay;` w `cities/mod.rs` (opisz)”, KONTEKST — jedną linię w `lib.rs`. Utworzono `src/cities/mod.rs` (2 linie dokumentacji + `pub mod overlay;`) i dopisano `pub mod cities;` w `lib.rs` — ten sam wzorzec co Z-32-1 (`units`).
- **Z-33-1 (granica DTO):** logika gry zostaje u wywołującego: `hexHasCoveringTerrainImprovement` (`game/terrain-improvements.ts:326-330`) → wejście `OkolicaMap::covering_improvement` (generator liczy je PRAWDZIWĄ funkcją gry dla każdego heksa mapy testowej); plony → callback `yield_of` (web: `params.yieldOf`, `main.ts:5760`); obrabiane pola, zasięg i właściciel → parametry; `workedByOwner` → lista par. `hexKeysWithinRadius` (`game/okolica.ts:66-77`) i `hexDistance` (`units/setup.ts:354-359`) to czysta geometria heksów — przeniesione jako prywatne funkcje `okolica.rs`, żeby kolejność wyliczania zasięgu była webowa (od niej zależy kolejność instancji i etykiet).
- **Z-33-2 (źródło liczb):** liczby drzew okolicy / pracowników z node v22.22.0 (V8 12.4) — konwencja fixtur MOD (`jsmath` crate'a = node); sprite'y plakietek z Chromium, bo ich skala zależy od szerokości z `measureText` (stub node nie mierzy); to czysta arytmetyka (`0.52 · w / h`) bez `Math.*`, w której V8 obu wersji się nie różni. Różnice Chromium↔node: §4.3.
- **Z-33-3 (adaptacja środowiska, nie kodu weba):** w generatorze (1) setter `CanvasRenderingContext2D.font` mapuje stosy fontów weba na dołączone pliki (`mapFont` z `tests/fixtures/overlay/gen.mjs`), (2) `window.Image` opakowany, by poczekać na wszystkie `onload`/`onerror`. Kod trzech modułów — bez zmian.
- **Z-33-4 (asynchroniczne obrazki i kolejki):** web rysuje plakietkę synchronicznie, potem przerysowuje TĘ SAMĄ kanwę po każdym wczytanym obrazku (sygnet, portret, ikona produkcji; `CMSC:1080-1109`), a kolejki `createImageRequestQueue` (`CMSC:228-297`) decydują tylko KIEDY obrazek przychodzi. Rust zwraca oba końce sekwencji: `initial` (bez obrazków, `version` 1) i `texture` (po wszystkich obrazkach, które się wczytują; `version` = 1 + ich liczba — porównane z `texture.version` weba). Obrazek, który się nie wczytuje (`onerror`, pusty SVG, brak źródła), w webie nie woła callbacku (`unitOwnerEmblem.ts:315-321`) — w Rust po prostu go nie ma. Cache obrazków i kolejki należą do wywołującego (RR-T8d). W generatorze settery są wołane przed KAŻDĄ plakietką (czyszczą cache obrazków, `clearImages`), więc każda idzie ścieżką zimną; przypadek `cached_minimal` sprawdza trafienie w cache tekstur wywołującego (ten sam obiekt, bez nowego rysowania).
- **Z-33-5 (źródła obrazków w teście):** sygnety = `civIconSvg(civ, 40)` (grecy, zulusi, egipt, nieznana → `civ-default`; id `brak` → `''`), ikony produkcji = `buildingIconSvg(undefined, 'spichlerz')` i `unit-spear` @24 (`unitIconSvg` dla `Wlocznik`), portrety = bajty trzech JPG pinu kluczowane `"<civ trim lower>|<max(1, round(era) || 1)>"` — źródło testowe, bo prawdziwe `leaderPortraitUrl` (`ui/leaderPortraits.ts:195-207`) wymaga `import.meta.glob`; te same reguły w `FxAssets` testu Rust.
- **Z-33-6 (jedna struktura wejścia):** `CityMapBadgeInput` z `raster::atlas::keys` (P4.31) ma już wszystkie pola `CMSC:17-78`, także rysowane, a nieobecne w kluczu — użyta wprost (re-eksport), bez drugiej kopii.
- **Z-33-7 (sufit tekstury):** rozmiar kanwy przez `badge_canvas_px` (P4.31, Z-31-2): dla każdej osiągalnej plakietki = web (`Math.round(W·dpr)`, `CMSC:848-849`); strażnik 2048 px działa tylko poza zasięgiem weba.
- **Z-33-8 (funkcje sceny):** `syncCityOkolicaOverlay` / `disposeCityOkolicaOverlayGroup` / `disposeWorkerFieldOverlayGroup` / `disposeWorkerFieldSpriteCache` / `disposeCityStatChipTextures` to zarządzanie obiektami sceny i pamięcią GPU (integracja, RR-T5/RR-T8d) — nieportowane; `syncWorkerFieldOverlay` przeniesione jako `sync_worker_field_overlay` (zwraca `None` dla pustej mapy, jak web `null`), `syncWorkerFieldOverlayFog` jako `sync_worker_field_overlay_fog` (mutacja danych sprite'ów), `disposeCityMapBadgeTexturesForOtherLod` jako `badge_keys_for_other_lod` (lista kluczy do zwolnienia).
- **Z-33-9 (rozmiar fixtur):** stany początkowe plakietek ×2 / ×1,5 / LOD nie są zapisywane (różnią się od wariantu ×1 tylko skalą; oszczędność ~2 MB); ich stan końcowy — tak.
- **Z-33-10 (obrazek nieistniejącej ikony produkcji):** `prodIconSvgFn` zwraca `''` dla nieznanego id (`prod_unknown_icon`) → brak ikony, slot zostaje — jak web.
- **Z-33-11 (wyjątki):** 2 wyjątki mean_abs ≤ 1,6 (§6.2), test `mean_abs_exceptions_are_needed` pilnuje, że oba są potrzebne.
- **Z-33-12 (r2, ślad rysowania):** zakres śladu = `clearRect`, `fillStyle`, `shadowColor`, `shadowBlur`, `shadowOffsetY`, `fillText` (tekst, surowy font, `textAlign`, `textBaseline`, pozycja). Ścieżki, `strokeStyle`, `lineWidth`, `drawImage` nie są śledzone (pod progami pikseli §6/§6.3). Rejestracja w kodzie produkcyjnym przez `cities::overlay::trace` (thread-local, aktywna tylko w `trace::capture`) — nie zmienia pikseli (złote hashe = r1).
- **Z-33-13 (r2, limity lokalne):** okno 6 × 6 px urządzenia i próg różnicy 64 dobrane jako najprostsze miary rozdzielające bazę od C07/C19/C21 (§6.3); limity per grupa (plakietki / etykiety / ikony), bo baza różni się między grupami (14,36 / 13,44 / 5,50).

---

## 2. Implementacja

### 2.1 Mapa web → Rust

| web (`edb8fb56`) | Rust (`cities::overlay::…`) |
|---|---|
| `CMSC:17-78` `CityMapBadgeInput` | `stat_chip::CityMapBadgeInput` (= `raster::atlas::keys::CityMapBadgeInput`) |
| `CMSC:80-206` stałe (`DEFENSE_COLORS`, `CIV_*`, `PROD_SLOT_W`, `GROWTH_FONT`, `HOVER_ROW_H`, `CITY_NAME_BUDGET_BASE`, `CAPITAL_*`) | stałe `stat_chip::*` |
| `CMSC:147-185` `badgePixelRatio` / `badgeCanvasScale` | `raster::atlas::scale::badge_canvas_px` (P4.31) |
| `CMSC:299-357` settery `setCityMapBadgeCivSigil` / `LeaderPortrait` / `ProdIcon` | cecha `stat_chip::CityMapBadgeAssets` |
| `CMSC:359-403` `wallKindFromBuilt`, `defenseTierFromWallKind`, `defenseTierFromCity`, `civInitialForIconId` | `wall_kind_from_built`, `defense_tier_from_wall_kind`, `defense_tier_from_city`, `civ_initial_for_icon_id` |
| `CMSC:405-424` `roundedRect` | `rounded_rect` (prywatna; promień bez ograniczenia, jak web) |
| `CMSC:427-458` `drawDefenseShield`, `:467-517` `drawCapitalCrown`, `:519-537` `drawCivMedallionDisc`, `:546-581` `drawCivMedallion` | `draw_defense_shield`, `draw_capital_crown`, `draw_civ_medallion_disc`, `draw_civ_medallion` |
| `CMSC:583-655` `request*Image` (+ klucze cache) | `load_badge_images` (+ re-eksport kluczy z `raster::atlas::keys`) |
| `CMSC:658-688` `drawProdIcon`, `drawResourceWarningIcon`, `:691-721` `drawHoverProdRow`, `:753-764` `drawGrowthLabel`, `:766-779` `truncateName` | `draw_prod_icon`, `draw_resource_warning_icon`, `hover_row_line` + `draw_hover_prod_row`, `draw_growth_label`, `raster::text::truncate_name` / `truncate_hover_line` (P4.29) |
| `CMSC:744-750` `formatCityGrowthPercentLabel` | `raster::atlas::keys::format_city_growth_percent_label` (P4.31) |
| `CMSC:782-937` `paintCityMapBadgeOntoCanvas` | `badge_layout` (układ CSS) + `paint_city_map_badge` |
| `CMSC:940-958` `drawCityMapBadgeCanvas(Legacy)` | `paint_city_map_badge` + `legacy_input` |
| `CMSC:960-1017` `cityMapBadgeKey`, `cityBadgeLodSegment` | re-eksport `city_map_badge_key`, `city_map_badge_key_legacy`, `city_badge_lod_segment` |
| `CMSC:1034-1047` `disposeCityMapBadgeTexturesForOtherLod` | `badge_keys_for_other_lod` |
| `CMSC:1052-1125` `makeCityMapBadgeSprite` | `render_city_map_badge` (tekstura, oba stany) + `city_map_badge_sprite` |
| `COO:19-45` style, `:79-110` stałe | `okolica::CITY_*_OVERLAY_STYLE`, stałe `okolica::*` |
| `COO:70-76` `yieldLabelLines`, `:119-143` `drawWorkerBadge`, `:145-181` `drawYieldLine`, `:183-229` `makeLabelSprite`, `:232-237` `placeYieldLabelSprite` | `yield_label_lines`, `draw_worker_badge`, `draw_yield_line`, `label_canvas_height` + `render_yield_label` + `yield_label_sprite` |
| `COO:239-249` `collectRangeKeys` (+ `game/okolica.ts:66-77`, `units/setup.ts:354-359`) | `collect_range_keys` (+ prywatne `hex_keys_within_radius`, `hex_distance`) |
| `COO:252-307` `buildCityOkolicaOverlayGroup` | `build_city_okolica_overlay` → `CityOkolicaOverlay` |
| `WFO:12-48` stałe, paleta, `workerOwnerColor(Rgba)`, `hexToRgba` | `worker_field::*`, `cities::overlay::hex_to_rgba` |
| `WFO:63-109` `getWorkerIconTexture`, `:111-127` `makeWorkerIconSprite` | `render_worker_icon`, `worker_icon_sprite` |
| `WFO:130-173` `buildWorkerFieldOverlayGroup`, `syncWorkerFieldOverlay`, `:176-194` `syncWorkerFieldOverlayFog` | `build_worker_field_overlay`, `sync_worker_field_overlay`, `sync_worker_field_overlay_fog` (+ `core::fog_dim::fog_brightness_for_hex`, P4.17) |

### 2.2 `CanvasTexture`, sprite'y
- `CanvasTexture`: `width`, `height` (piksele urządzenia), `rgba` (straight RGBA8, wiersz 0 = góra), `premultiplied`, `hash` (FNV-1a 64), `min_filter` (`LinearFilter` 1006 — wszystkie tekstury MOD-10), `mag_filter` (1006), `generate_mipmaps` (`true`, domyślne Three), `srgb`, `flip_y` (`true`), `version` (1 + przerysowania po wczytaniu obrazka).
- `SpriteNode` / `SpriteMaterial`: `position`, `scale`, `center`, `renderOrder` (plakietka 12, pracownik 18, etykieta 20), `visible`, `userData.hexKey` (pracownik), `userData.labelWorldHeight` (etykieta), materiał: biały kolor, `map` (`TextureRef::{CityBadge(klucz), WorkerIcon(klucz), YieldLabel(heks)}`), `transparent`, `depthTest`, `depthWrite`, `toneMapped`, `opacity`, `userData.fogBaseOpacity`. Domyślne Three, których dane nie niosą (`rotation` 0, `sizeAttenuation` true), są sprawdzane po stronie weba.
- Okolica: `CityOkolicaOverlay { range, center, worked?, yields? }` — trzy grupy MOD-13 przemianowane jak w webie (`okolica-range`, `okolica-city-center`, `okolica-worked`) + lista `YieldLabel { hex, lines, worker, sprite, texture }` (grupa `okolica-yields`).

---

## 3. Generator referencji (`tests/fixtures/cityoverlay/gen.ts` + `gen.mjs`, README tamże)

### 3.1 Co jest uruchamiane
`gen.ts` importuje trzy moduły **bez zmian** i woła ich eksporty: settery plakietki, `makeCityMapBadgeSprite` (oba przeciążenia), `drawCityMapBadgeCanvas`, `drawCityMapBadgeCanvasLegacy`, `cityMapBadgeKey`, `disposeCityMapBadgeTexturesForOtherLod`, `wallKindFromBuilt`, `defenseTierFromWallKind`, `defenseTierFromCity`, `civInitialForIconId`, `buildCityOkolicaOverlayGroup`, `syncWorkerFieldOverlay`, `syncWorkerFieldOverlayFog`, `workerOwnerColor`, `workerOwnerColorRgba`, eksportowane style i paletę; `hexHasCoveringTerrainImprovement` (gra) liczy wejście. Tekstury = kanwy `texture.image` (`getImageData`) — plakietka: zaraz po `makeCityMapBadgeSprite` (stan początkowy) i po wczytaniu wszystkich obrazków (stan końcowy); drzewa = rekordy obiektów Three.

### 3.2 Wejścia
- **34 plakietki** (strona dpr 1: 30, dpr 2: 3, dpr 1,5: 1): bez assetów (2, settery nigdy niewołane), pełny major z portretem (obrona 2, stolica, WZROST 5,5, produkcja budynku), zuluska stolica `uMgungundlovu` (WZROST −99,9 %, produkcja jednostki), najszersza (`Kartagena Hiszpańska Wielka` → `KARTAGENA HIS…` przy budżecie 214 px, −100,5 %; `uMgungundlovu` zmierzone w Rust na 213,877 px — komentarz weba `CMSC:104` podaje 213,9 px z żywego Chromium — mieści się w budżecie 221 px), miasto-państwo (sygnet zamiast portretu), MP bez sygnetu, Egipt (portret ery 1, WZROST 0 %), nieznana cywilizacja (`civ-default`, 12,25 % → `12,3%`), `' Grecy '` z białymi znakami (era 2,4 → portret ery 2), głód (`—`), −0,04 % (`0%`), populacja 0 / NaN / 2,9 / 1234, nazwy `''` (→ `MIASTO`), `'   '` (→ pusta), `straße łódź` (→ `STRASSE ŁÓDŹ`), produkcja bez rodzaju i z nieznaną ikoną, 6 wariantów hover (pełny z ostrzeżeniem, wstrzymana, wstrzymana z pozycją, samo ostrzeżenie, przycięcie długiej nazwy, hover bez szczegółów), sama stolica, LOD 1 / 2 / 1,5 (→ 0), trafienie w cache, przeciążenie `(cityName, population)`;
- **okolica** — mapa 11×11 (heksy |q+r| ≤ 5, dziura w `4,-1`), wszystkie 8 terenów, ulepszenia `farma` (zakrywa), `droga`, `droga`+`droga_brukowana` (nie zakrywają), `droga`+`kopalnia_miedzi` (zakrywa), `brak`; centrum z ulepszeniem zakrywającym (etykieta zostaje, `COO:292`); plony: brak, zera, ujemne, NaN, ułamki 1,5 / 0,25, 1e21 i 1e-7 (`String(n)`), do trzech wierszy; 7 przypadków: zasięg 2 / 3 / 1 / 2,5 / NaN (pusty zasięg), krawędź mapy z obrabianym heksem spoza mapy (`9,9`), `showYields: false`, właściciel domyślny / 3 / 9 (zawinięcie palety) / 1;
- **pracownicy** — 11 pól (właściciele 0, 1, 9, −1, 1,5, 2, 3, 7, gracz 0 i 2; Morze, Góry, heks spoza mapy pomijane), drugi gracz, pusta mapa (`null`); mgła: widoczne / odkryte / nieodkryte, potem bez mgły.

### 3.3 Wersje (`versions.txt`)
node v22.22.0, playwright 1.56.1, **Chromium 141.0.7390.37** (`--disable-gpu --force-color-profile=srgb --font-render-hinting=none`), three 0.169.0, esbuild 0.24.0.

---

## 4. Drzewa i liczby — bit w bit

### 4.1 Okolica (`okolica_trees_match_the_web_bit_for_bit`)
7 drzew — **12 902 porównania, 0 różnic**: nazwa i typ grupy, kolejność i nazwy dzieci, każda grupa zasięgu (MOD-13): typ obiektu (`InstancedMesh` / `LineSegments`), nazwa, `renderOrder`, `frustumCulled`, transformacja (identyczność), materiał (typ, `color.getHex()`, kolor liniowy — bity f64, `transparent`, `opacity`, `depthWrite`, `depthTest`, `side`, `polygonOffset*`), tablice f32 pozycji / normalnych / UV, indeksy, `count` i `instanceMatrix`; etykiety: sprite (pozycja / skala / `center` — bity, `renderOrder`, `visible`, `userData.labelWorldHeight`, materiał) + metadane tekstury (rozmiar 128 × 46…98, filtry, `version`).

### 4.2 Pracownicy, plakietki, pomocnicze
- `worker_trees_match_the_web_bit_for_bit`: 3 przypadki, 740 porównań — sprite'y (pozycja nad terenem `+0,18`, skala 0,72, `opacity` 0,9, `fogBaseOpacity`, `userData.hexKey`), spójna bijekcja tekstura weba ↔ klucz `workerSpriteCacheKey` (9 tekstur: m.in. `1|ring:0` i `9|ring:0` to dwa obiekty weba o identycznych pikselach), przebieg mgły (widoczne 1, odkryte `0,9·0,55`, nieodkryte `visible = false`) i powrót bez mgły.
- `chip_sprites_match_the_web_bit_for_bit`: 34 plakietki, 1 631 porównań — klucz, rozmiar kanwy w pikselach urządzenia (np. 311×48, ×2: 622×96, ×1,5: 684×72, LOD 2 przy dpr 2: 776×192 — sufit 4), metadane, `version` (1 + liczba wczytanych obrazków: 1…4), sprite (`0,52·w/h`, (0, 0,92, 0), `renderOrder` 12, materiał `transparent` / `depthTest: false` / `depthWrite: true` / `toneMapped: false`).
- `chip_helpers_match_the_web` 111/111 (mury, poziomy, inicjały — w tym `ßab` → `SS`, `łotysze` → `Ł`, emoji → `?` —, 31 kluczy, czystka LOD dla 0 / 1 / 2 / 1,5 / brak, kolory właścicieli dla 11 id); `constants_match_the_web` 22/22.

### 4.3 Chromium 141 vs node 22 (`chromium_tree_differences_are_last_bit_noise`)
Ten sam bundle w Chromium daje **18 różnic** (lista w `city.json` → `chromiumDiffs`): 13 kanałów koloru liniowego o **1 ulp** (`THREE.Color.setHex` → `SRGBToLinear` → `Math.pow`, jak §4.2 P4-32) i 5 tablic f32 wierzchołków linii obwódki, w których pojedyncze elementy bliskie 0 różnią się o ≤ 1e-6 (np. `±1,1e-16` — `Math.cos`/`Math.sin` narożników heksa). Test odrzuca każdą inną różnicę. Wniosek dla RR-T5: bez znaczenia po konwersji do f32 i 8 bitów; NIE_ZMIERZONO na GPU.

---

## 5. Tekstury — co jest rysowane

| tekstura | płótno (px CSS) | filtr | pochodzenie |
|---|---|---|---|
| plakietka miasta | W × 48 (70 z hover), W = 134…456 w fixturze (sufit osiągalny 463, `CMSC:156-161`), × skala DPI·LOD ≤ 4 | Linear | `CMSC:782-937`, sprite `:1111-1124` |
| etykieta plonów | 128 × 46…98 | Linear | `COO:183-229` |
| ikona pracownika | 64 × 64 | Linear | `WFO:63-109` |

---

## 6. Tekstury vs Chromium 141 (pełne tabele: `dowody/07-cityoverlay-tests-nocapture.log`)

Progi **jak RR-T8a/b/c**: SSIM ≥ 0,985, mean_abs ≤ 1,5, px>16 ≤ 5 %. Dodatkowo bitowo: rozmiar płótna, `minFilter`, `magFilter`, `generateMipmaps`, `colorSpace`, `flipY`, `version` (§4.2).

### 6.1 Wyniki (zakresy; każdy wiersz w logu)

| grupa | porównań | max_abs | mean_abs | px>16 % | SSIM (min) |
|---|---|---|---|---|---|
| plakietki ×1 — stan końcowy | 28 | 53–76 | 1,1123–1,5173 | 1,648–3,287 | 0,99483 |
| plakietki ×1 — stan początkowy | 27 | 53–76 | 1,0776–1,4904 | 1,710–3,194 | 0,99483 |
| plakietki ×2 / ×1,5 / ×3 / sufit ×4 (LOD 1–2, dpr 2 i 1,5) — stan końcowy | 6 | 52–123 | 0,6110–1,0841 | 0,738–1,917 | 0,99588 |
| `drawCityMapBadgeCanvas(hover_full)`, `…Legacy` | 2 | 62–68 | 1,0776–1,2690 | 1,916–2,209 | 0,99534 |
| etykiety okolicy | 61 | 35–55 | 0,1543–0,6556 | 0,109–1,183 | 0,99661 |
| ikony pracowników | 9 | 23–36 | 0,0872–0,5436 | 0,195–0,732 | 0,99835 |

(Razem 133 porównania; plakietki ×1 liczone z przypadkami `cached_minimal` i `legacy`; wiersze o identycznych referencjach — np. ta sama etykieta na kilku heksach — nie są usuwane.)

### 6.2 Wyjątki (jawne, `MEAN_ABS_EXCEPTIONS` w teście)

| plakietka | mean_abs | limit wyjątku | SSIM | px>16 % |
|---|---|---|---|---|
| `zulu_capital_long@main` (stan końcowy) | 1,5170 | 1,6 | 0,99487 | 3,130 |
| `capital_only@main` (stan końcowy) | 1,5173 | 1,6 | 0,99580 | 2,799 |

Przyczyna (zmierzone na `capital_only`, mapa różnic kanał po kanale, skrypt w scratchpadzie): na całej pigułce półprzezroczysty ciemny gradient tła (`CMSC:856-859`, `rgba(16,22,34,0.96)` → `rgba(8,10,16,0.94)`) jest w Rust o **0–1 poziom jaśniejszy** niż w Chromium, naprzemiennie kolumnami (wzorzec o okresie 2 px — zgodny z ditheringiem gradientów Skii, którego tiny-skia nie robi; przyczyna w kodzie Chromium NIE_ZMIERZONO), oraz **2–4 poziomy** na cienkim (1,2 px) wewnętrznym pierścieniu stolicy (`CMSC:866-879`, AA cienkiej kreski). To właściwości warstwy `raster` (RR-T8a), poza allowlistą; obie plakietki są stolicami ×1, a ich stany początkowe (1,4904 / 1,4833) i wszystkie inne plakietki mieszczą się w 1,5. `mean_abs_exceptions_are_needed` pilnuje, że wyjątki nie są martwe.

---

### 6.3 Lokalne miary pikseli (r2, zarzuty 1–2)

Progi globalne (§6) uśredniają po całej teksturze, więc mała, realna wada (glif 👤 13 → 16 px, rozmycie cienia dwóch cyfr, separator w wierszu hover) może się pod nimi zmieścić — zarzut 1 Evaluatora r1 **przyjęty**, potwierdzony pomiarem (tabela niżej). Od r2 każde porównanie tekstury z Chromium (`report` w teście) liczy dodatkowo — na pikselach premultiplied, różnica piksela = największa różnica kanału:

- `win6` — największa średnia różnicy w dowolnym oknie **6 × 6 px urządzenia** (obraz całkowy, `local_diff`);
- `px>64` — liczba pikseli o różnicy > 64.

Limity per grupa, z pomiaru niezmutowanego portu (133 porównania, `dowody/07-cityoverlay-tests-nocapture-r2.log`, kolumny `win6 | px>64`):

| grupa | max `win6` zmierzone | limit `win6` | max `px>64` | limit `px>64` |
|---|---|---|---|---|
| plakietki (wszystkie dpr, oba stany, `drawCityMapBadgeCanvas*`) | 14,36 | **20** | 5 | **12** |
| etykiety okolicy | 13,44 | **15** | 0 | **12** |
| ikony pracowników | 5,50 | **10** | 0 | **12** |

Pomiar na trzech wadach z zarzutu (skrypt sondy w scratchpadzie; to samo w `dowody/08-mutations-r2.log`):

| mutacja | najgorsza tekstura | `win6` | `px>64` | max_abs | wynik r2 (piksele) |
|---|---|---|---|---|---|
| C07 separator ' · ' → ' - ' | `hover_full@dpr2 final` | 84,64 | 28 | 192 | zabita (`chip_textures_match_chromium`) |
| C19 👤 13 → 16 px | `edge (4,-2) worker=true` | 82,44 | 59 | 227 | zabita (`okolica_textures_match_chromium`) |
| C21 rozmycie cienia cyfr 3 → 2 | `edge (4,-2) worker=true` | 16,03 | 0 | 57 | zabita (`okolica_textures_match_chromium`), **margines cienki**: 16,03 vs limit 15 vs baza 13,44 |

Dla C21 margines pikselowy jest jawnie mały (rozmycie 2 vs 3 px przy 16 px cyfrach to zmiana rzędu AA); dlatego C21 (i każda zmiana stanu cienia / koloru / fontu / tekstu) ma **drugie, niezależne od progów** zabezpieczenie: ślad rysowania (§6.4), porównywany dokładnie. `local_limits_are_tight` pilnuje, że każdy limit jest ≥ zmierzonego maksimum grupy i co najwyżej o 6 nad nim (limit nie może po cichu zrobić się luźny) oraz że miara widzi zmianę jednego piksela.

### 6.4 Ślad rysowania vs Chromium (r2, zarzuty 1 i 3)

Generator (`gen.mjs`) owija w Chromium `fillStyle` / `shadowColor` / `shadowBlur` / `shadowOffsetY` (settery) oraz `clearRect` / `fillText` / `save` / `restore` z `CanvasRenderingContext2D.prototype`: wrapper tylko zapisuje zdarzenie i woła natywną implementację (piksele `ref/*.rgba` identyczne z r1 — `dowody/06-generator-repro-r2.log`). Dla każdej referencji `city.json → traces[<ref>]` = zdarzenia malowania od ostatniego `clearRect`; `fillText` niesie tekst, **surowy** napis fontu ustawiony przez web (przed `mapFont`, z `save`/`restore`), `textAlign`, `textBaseline` i bity f64 `x`, `y`.

Po stronie Rust te same wywołania idą przez `src/cities/overlay/trace.rs` (`trace::set_fill_style`, `set_fill_style_gradient`, `set_shadow_*`, `clear_rect`, zdarzenie `fillText` w pomocnikach `fill_text` trzech modułów); poza `trace::capture` koszt to jeden odczyt thread-local, piksele bez zmian (złote hashe = r1).

| test | co porównuje | wynik |
|---|---|---|
| `draw_traces_match_chromium` | 133 malowania (34 plakietki: końcowy + 27 początkowych, 2 `drawCityMapBadgeCanvas*`, 61 etykiet, 9 ikon), zdarzenie po zdarzeniu, **dokładnie** (pozycje bitowo) | **2 396 porównań, 0 różnic**; 474 wywołania `fillText` — tekst, font, wyrównanie i pozycja bit w bit (także pozycje zależne od `measureText`: nazwa, WZROST%, wiersz hover, cyfry plonów) |
| `hover_row_text_matches_chromium` | napis wiersza hover (`CMSC:691-721`: separator ' · ', „wstrzymana”, „Brak surowców…”, przycięcie z „…” do `maxTextW`) | 12 wierszy hover, w tym **4 przycięte**, 0 różnic |

Mutacje zabite przez ślad (§9.2): C07 (tekst), C19 (font `bold 16px`), C21 (`shadowBlur`), C27 (`shadowOffsetY`), C28 (`shadowColor`), a także C09/C10/C11/C13 itd. Ślad nie obejmuje ścieżek (arc / lineTo / quadraticCurveTo), `strokeStyle`, `lineWidth`, `drawImage` — te zostają pod progami pikseli §6 i §6.3 (ZAŁOŻENIE Z-33-12: zakres śladu = tekst + wypełnienie + cień, czyli dokładnie klasy wad z zarzutu; rozszerzenie na ścieżki NIE_ZMIERZONO).

---

## 7. Determinizm (`dowody/05-determinism.log`)
`textures_match_golden_hashes` (FNV-1a 64 bufora premultiplied, `tests/fixtures/cityoverlay/golden.tsv`: 34 plakietki × (initial, final) + 61 etykiet + 9 ikon = 104 wiersze) — 8 przebiegów: rustc **1.87.0** i **stable 1.97.0** × debug/release × 2:

```
golden.tsv body sha256: 935404a7fa5c145aff7ada9add9ff5974cc537b88af22fad32073e5f89176561  (104 textures)
toolchain=1.87.0 profile=debug run=1 textures=104 sha256(hashes)=935404a7fa5c145aff7ada9add9ff5974cc537b88af22fad32073e5f89176561 EXIT=0
toolchain=1.87.0 profile=debug run=2 textures=104 sha256(hashes)=935404a7fa5c145aff7ada9add9ff5974cc537b88af22fad32073e5f89176561 EXIT=0
toolchain=1.87.0 profile=--release run=1 textures=104 sha256(hashes)=935404a7fa5c145aff7ada9add9ff5974cc537b88af22fad32073e5f89176561 EXIT=0
toolchain=1.87.0 profile=--release run=2 textures=104 sha256(hashes)=935404a7fa5c145aff7ada9add9ff5974cc537b88af22fad32073e5f89176561 EXIT=0
toolchain=stable profile=debug run=1 textures=104 sha256(hashes)=935404a7fa5c145aff7ada9add9ff5974cc537b88af22fad32073e5f89176561 EXIT=0
toolchain=stable profile=debug run=2 textures=104 sha256(hashes)=935404a7fa5c145aff7ada9add9ff5974cc537b88af22fad32073e5f89176561 EXIT=0
toolchain=stable profile=--release run=1 textures=104 sha256(hashes)=935404a7fa5c145aff7ada9add9ff5974cc537b88af22fad32073e5f89176561 EXIT=0
toolchain=stable profile=--release run=2 textures=104 sha256(hashes)=935404a7fa5c145aff7ada9add9ff5974cc537b88af22fad32073e5f89176561 EXIT=0
```
Przebłogosławienie: `CITYOVERLAY_BLESS=1 cargo test --test cityoverlay_web_parity textures_match_golden_hashes` (tylko po świadomej zmianie). `rendering_twice_is_identical` — dwa rendery w jednym procesie identyczne. Generator referencji (Chromium + node) uruchomiony ponownie do osobnego katalogu: `MANIFEST.sha256` **identyczny** (sha256 `de47236a…543832` = zatwierdzony, `dowody/06-generator-repro.log`). Platforma x86_64 Linux; inne — NIE_ZMIERZONO.

---

## 8. Testy i bramy

| plik | testy | co sprawdza |
|---|---|---|
| `src/cities/overlay/*` (unit) | 9 | portret ignorowany dla miasta-państwa (obraz 2×2 — §9 C02), inicjały (`ßab` → `SS`), mury/poziomy, reguły wiersza hover, układ plakietki z pustą nazwą, wysokości etykiet, pomijanie plonów ≤ 0 / NaN, kolejność wyliczania zasięgu i pusty zasięg dla NaN, zawijanie palety (JS `%`) |
| `src/cities/overlay/trace.rs` (unit, r2) | 1 | segmenty po `clearRect`, brak zapisu poza `capture` |
| `tests/cityoverlay_web_parity.rs` | 18 (r1: 15) | §4, §4.3, §6 (+ wyjątki, + limity lokalne §6.3, `local_limits_are_tight`), §6.4 (`draw_traces_match_chromium`, `hover_row_text_matches_chromium`), §7, SHA-256 (wektory FIPS), manifest fixtur + ≤ 8 MB, wejścia = wejścia RR-T8c |

Bramy r2: `dowody/01-gates-r2.log` (ten sam skrypt `01-gates.sh`, czysty target w scratchpadzie, `CARGO_INCREMENTAL=0`, `CARGO_PROFILE_DEV_DEBUG=0` — współdzielony dysk):

```
$ cargo fmt --all -- --check                                        EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings                EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings EXIT=0
$ cargo test --locked --all-targets                                 EXIT=0   passed=348 failed=0
$ cargo +1.87.0 test --locked --all-targets                         EXIT=0   passed=348 failed=0
```
348 = 344 (r1) + 3 nowe testy integracyjne + 1 test jednostkowy `trace`. Złote hashe (`golden.tsv`, bez zmian od r1) przechodzą na 1.87.0 i stable (debug) oraz w release (`dowody/07-cityoverlay-tests-nocapture-r2.log`, pełne tabele z kolumnami `win6 | px>64`). Pierwszy przebieg bram r2 wykrył `jsmath_wiring::no_platform_transcendentals_anywhere_in_src` (zmienna `log` w teście jednostkowym `trace.rs` wyglądała dla skanera jak `f64::log`) — zmienna przemianowana, przebieg powtórzony = log wyżej; przebieg mutacji §9.2 był przed tą zmianą nazwy (bez wpływu na zachowanie). Poniżej log r1.

Bramy — `dowody/01-gates.log` (surowe logi z `EXIT=`; poniżej linie poleceń, kodów wyjścia i sum, wiersze `test result` — w logu):

```
## pwd /home/user/The-Game/.claude/worktrees/wf_2652eab6-49a-1/rust-port/renderer  HEAD 95b91471  (working tree: 101 changed/untracked paths under rust-port/renderer)
## rustc rustc 1.97.0 (2d8144b78 2026-07-07) | 1.87: rustc 1.87.0 (17067e9ac 2025-05-09)
$ cargo fmt --all -- --check
EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings
EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings
EXIT=0
$ cargo test --locked --all-targets
EXIT=0
## disk after cargo clean: /dev/vda        252G   27G   13G  69% /
$ cargo +1.87.0 test --locked --all-targets
EXIT=0
## p433-test-stable.txt: passed=344 failed=0
## p433-test-187.txt: passed=344 failed=0
$ git diff --cached --check && git diff --check   (run after the explicit git add of the allowlist)
EXIT=0
```


---

## 9. Mutacje (`dowody/08-mutations.py`, log r1 `dowody/08-mutations.log`, log r2 `dowody/08-mutations-r2.log`)

### 9.1 Runda 1
Każda mutacja = jedna podmiana fragmentu w `src/cities/overlay/*.rs` (asercja jednokrotnego wystąpienia), uruchomienie `cargo test --lib cities::overlay` + `--test cityoverlay_web_parity`, przywrócenie pliku (także przy SIGTERM/SIGINT). Przed bazowym przebiegiem skrypt sprawdza, że każdy fragment występuje dokładnie raz.

| ID | file | mutation | result | killed by |
|---|---|---|---|---|
| C01 | `src/cities/overlay/stat_chip.rs` | name budget base 305 -> 260 (round-3 value) | **KILLED** | chip_sprites_match_the_web_bit_for_bit, chip_textures_match_chromium, mean_abs_exceptions_are_needed, textures_match_golden_hashes |
| C02 | `src/cities/overlay/stat_chip.rs` | portrait also drawn for a city-state | **KILLED** | cities::overlay::stat_chip::tests::portrait_is_ignored_for_a_city_state |
| C03 | `src/cities/overlay/stat_chip.rs` | pill ring 2 px -> 1 px | **KILLED** | chip_textures_match_chromium, textures_match_golden_hashes |
| C04 | `src/cities/overlay/stat_chip.rs` | capital inner ring inset 6 -> 5 | **KILLED** | chip_textures_match_chromium, textures_match_golden_hashes |
| C05 | `src/cities/overlay/stat_chip.rs` | growth slot width not rounded up (Math.ceil dropped) | **KILLED** | chip_sprites_match_the_web_bit_for_bit, chip_textures_match_chromium, textures_match_golden_hashes |
| C06 | `src/cities/overlay/stat_chip.rs` | hover row budget without the web's '- x' | **KILLED** | chip_textures_match_chromium, textures_match_golden_hashes |
| C07 | `src/cities/overlay/stat_chip.rs` | hover row separator ' · ' -> ' - ' | **KILLED** | textures_match_golden_hashes |
| C08 | `src/cities/overlay/stat_chip.rs` | production icon requested without a prodKind | **KILLED** | chip_sprites_match_the_web_bit_for_bit, chip_textures_match_chromium, textures_match_golden_hashes |
| C09 | `src/cities/overlay/stat_chip.rs` | medallion disc green darkened by 0.6 instead of 0.55 | **KILLED** | chip_textures_match_chromium, textures_match_golden_hashes |
| C10 | `src/cities/overlay/stat_chip.rs` | name font 22 px -> 21 px | **KILLED** | chip_sprites_match_the_web_bit_for_bit, chip_textures_match_chromium, mean_abs_exceptions_are_needed, textures_match_golden_hashes |
| C11 | `src/cities/overlay/stat_chip.rs` | palisade shield drawn in the gold palette | **KILLED** | chip_textures_match_chromium, textures_match_golden_hashes |
| C12 | `src/cities/overlay/stat_chip.rs` | badge sprite world height 0.52 -> 0.5 | **KILLED** | chip_sprites_match_the_web_bit_for_bit |
| C13 | `src/cities/overlay/stat_chip.rs` | population digits without the +1 px offset | **KILLED** | chip_textures_match_chromium, textures_match_golden_hashes |
| C14 | `src/cities/overlay/stat_chip.rs` | legacy overload with another civ | **KILLED** | chip_textures_match_chromium, textures_match_golden_hashes |
| C15 | `src/cities/overlay/okolica.rs` | worked-field digits 1.28 -> 1.2 | **KILLED** | okolica_textures_match_chromium, textures_match_golden_hashes |
| C16 | `src/cities/overlay/okolica.rs` | label lifted by 0.4 instead of 0.38 of its height | **KILLED** | okolica_trees_match_the_web_bit_for_bit |
| C17 | `src/cities/overlay/okolica.rs` | city centre hidden under a covering improvement | **KILLED** | okolica_textures_match_chromium, okolica_trees_match_the_web_bit_for_bit, textures_match_golden_hashes |
| C18 | `src/cities/overlay/okolica.rs` | range ring excluded (< instead of <=) | **KILLED** | cities::overlay::okolica::tests::range_enumeration_order, okolica_textures_match_chromium, okolica_trees_match_the_web_bit_for_bit, textures_match_golden_hashes |
| C19 | `src/cities/overlay/okolica.rs` | okolica 👤 glyph 13 px -> 16 px (world-map size) | **KILLED** | textures_match_golden_hashes |
| C20 | `src/cities/overlay/okolica.rs` | shallow sea treated as unworkable (isWaterTerrain) | **KILLED** | okolica_textures_match_chromium, okolica_trees_match_the_web_bit_for_bit, textures_match_golden_hashes |
| C21 | `src/cities/overlay/okolica.rs` | worked digits with the idle shadow blur | **KILLED** | textures_match_golden_hashes |
| C22 | `src/cities/overlay/worker_field.rs` | player worker badge radius 11 -> 12 | **KILLED** | textures_match_golden_hashes, worker_textures_match_chromium |
| C23 | `src/cities/overlay/worker_field.rs` | worker icon opacity 0.9 -> 1 | **KILLED** | worker_trees_match_the_web_bit_for_bit |
| C24 | `src/cities/overlay/worker_field.rs` | fog: unexplored worker icons stay visible | **KILLED** | worker_trees_match_the_web_bit_for_bit |
| C25 | `src/cities/overlay/worker_field.rs` | palette index wraps negatives (JS % keeps the sign) | **KILLED** | chip_helpers_match_the_web, cities::overlay::worker_field::tests::palette_wraps_like_js_modulo |
| C26 | `src/cities/overlay/mod.rs` | undefined owner colour painted white instead of black | **KILLED** | chip_helpers_match_the_web, cities::overlay::worker_field::tests::palette_wraps_like_js_modulo, textures_match_golden_hashes, worker_textures_match_chromium |

**Wynik: 26/26 zabitych** (`dowody/08-mutations.log`, EXIT=0; po przebiegu drzewo `src/cities/overlay` bez zmian).
Historia (jawnie): pierwszy przebieg dał 24/26 — przeżyły C02 (portret dla miasta-państwa: przez `render_city_map_badge` równoważna, bo web i port w ogóle nie zamawiają portretu dla MP, `CMSC:1097`; zabija ją dopiero nowy test jednostkowy `portrait_is_ignored_for_a_city_state` na publicznym `paint_city_map_badge` = `drawCityMapBadgeCanvas` z treścią medalionu) i C17 (centrum pod ulepszeniem zakrywającym: w pierwszej mapie testowej centrum miało puste plony, więc etykiety i tak nie było — generator dostał jawne plony centrum `{2, 1, 1}`, fixtura odtworzona, złote hashe przebłogosławione po przeglądzie: doszły wyłącznie dwa wiersze etykiet centrum). Drugi przebieg przerwał się na asercji fragmentu C13 (po `cargo fmt` wywołanie stało w kilku liniach) — fragment poprawiony, dodana kontrola wstępna; trzeci, pełny przebieg = tabela wyżej.

---

### 9.2 Runda 2 (zarzut 1: C07, C19, C21 zabijał tylko złoty hash)

Ten sam skrypt; zmiany: fragment C21 dostosowany do `trace::set_shadow_blur(ctx, …)` (ta sama mutacja), dwie nowe mutacje stanu cienia (C27 `shadowOffsetY` 1 → 2, C28 alfa cienia obrabianych cyfr 0,75 → 0,6) i kolumna **„without the golden hash”** — czy mutację zabił test inny niż `textures_match_golden_hashes` / `rendering_twice_is_identical` (porównania z webem lub testy jednostkowe reguł z pinu); skrypt kończy się kodem ≠ 0, jeśli którakolwiek mutacja przeżyła albo zabił ją wyłącznie złoty hash.

**Wynik: 28/28 zabitych, 28/28 testem innym niż złoty hash** (`dowody/08-mutations-r2.log`, EXIT=0). Trzy mutacje z zarzutu:

| ID | r1 zabita przez | r2 zabita przez |
|---|---|---|
| C07 separator hover | `textures_match_golden_hashes` | `chip_textures_match_chromium` (`win6`), `draw_traces_match_chromium`, `hover_row_text_matches_chromium`, `local_limits_are_tight` + złoty hash |
| C19 👤 13 → 16 px | `textures_match_golden_hashes` | `okolica_textures_match_chromium` (`win6`/`px>64`), `draw_traces_match_chromium` (font), `local_limits_are_tight` + złoty hash |
| C21 rozmycie cienia | `textures_match_golden_hashes` | `okolica_textures_match_chromium` (`win6`, cienki margines §6.3), `draw_traces_match_chromium` (`shadowBlur`), `local_limits_are_tight` + złoty hash |

Ślad rysowania zabija 17/28 (C01 C05 C06 C07 C09 C10 C11 C13 C15 C17 C18 C19 C20 C21 C26 C27 C28); porównania tekstur z Chromium 22/28; `hover_row_text_matches_chromium` C06 C07 C10. Pozostałe zabijają porównania bitowe drzew / sprite'ów (C12, C16, C23, C24) lub testy jednostkowe reguł z pinu (C02, C25). Linia „diff after the run” w logu pokazuje zmiany r2 względem commita r1 (niezacommitowane w chwili przebiegu), nie pozostałości mutacji — skrypt przywraca każdy plik po mutacji.

Przebieg: pierwszy przebieg r2 przerwałem (SIGTERM, pliki przywrócone przez handler) po C09, bo współdzielony dysk się zapełnił (`No space left on device` → fałszywy „compile error” w C10); po zwolnieniu miejsca pełny przebieg od nowa = log wyżej.

## 10. Obserwacje o webie (bez zmian w `gra/**`; do ewentualnych zgłoszeń)
- **W-1:** `cityMapBadgeKey` (`CMSC:962-1012`) pomija rysowane pola `ownerColor`, `prodCategoryLabel`, `prodItemName`, `prodPaused` (znane z P4-31 §3). Zmierzone w pierwszym przebiegu generatora: plakietka z inną nazwą pozycji w hover, ale tym samym kluczem, dostała z cache teksturę poprzedniej (`version` 3 przed jakimkolwiek rysowaniem) — nieaktualny wiersz hover.
- **W-2:** `drawHoverProdRow` (`CMSC:699`) liczy `maxTextW = w - x - warnW - 6`, a wywołanie (`:935`) przekazuje już `w = W - padX·2`: budżet tekstu wiersza hover jest o `padX` (10 px) węższy niż pigułka pozwala. Port odtwarza to 1:1 (mutacja C06).
- **W-3:** `('   ' || 'Miasto').trim()` (`CMSC:789`) daje pustą nazwę, nie „MIASTO” (fallback działa tylko dla `''`).
- **W-4:** ciepły cache obrazków: gdy sygnet tej samej cywilizacji jest już wczytany, `makeCityMapBadgeSprite` przerysowuje synchronicznie (`version` 2 od razu, zmierzone na przeciążeniu legacy w pierwszym przebiegu) — tylko kolejność, wynik ten sam.
- **W-5:** `workerOwnerColor` (`WFO:34-36`) dla id ujemnego lub ułamkowego zwraca `undefined` → `rgba(0,0,0,a)` (czarna ikona); id ≥ 8 zawija (`9` = `1`), ale daje osobny klucz cache i osobną teksturę o tych samych pikselach.
- **W-6:** etykiety okolicy (`COO:195-212`) tworzą nową `CanvasTexture` dla każdego heksa przy każdym `syncOkolicaOverlay` — bez cache (koszt, nie błąd).

## 11. Co ocenić wzrokiem po RR-T5 (wymaga GPU — NIE_ZMIERZONO)
1. Plakietka miasta przy kamerze gry na trzech progach LOD (`CITY_BADGE_LOD_NEAR_DIST` 5,5 / `MID` 11): ostrość nazwy, przejście tekstur przy przekraczaniu progu (czystka LOD), brak rozmycia przy dpr 1,5 i 2.
2. Medalion 16 px: czytelność portretu po pomniejszeniu 256 → 29 px (mip), sygnet MP vs portret majora, kolor tarczy właściciela.
3. Korona i podwójna obwódka stolicy w skali mapy (17×13 px), tarcza obrony szara / złota.
4. Wiersz hover: ikona ostrzeżenia i wygląd przycięcia na ekranie (sam napis, separator i miejsce przycięcia — zgodne z Chromium, §6.4).
5. Etykiety plonów okolicy: emoji 🍞 🔨 💰 (Noto) vs Segoe UI Emoji na Windows, złote cyfry z cieniem na polach 👤, nakładanie się etykiet na heksach z reliefem.
6. Ikony 👤 na mapie świata: kolory palety właścicieli, obwódka gracza, przyciemnienie mgłą (`opacity 0,9·0,55`), `renderOrder` 18 / 20 / 12 względem jednostek i miast (`depthTest: false`).

## 12. NIE_ZMIERZONO
Wygląd na GPU i na Windows (Segoe UI / Segoe UI Emoji / Georgia — tu Liberation Serif), determinizm poza x86_64, `clippy` na 1.87.0 (niezainstalowany komponent, jak P4-28…32), upload / mipmapy GPU (RR-T8d), cache tekstur i kolejki obrazków po stronie Rust (Z-33-4), przyczyna różnicy gradientu w Chromium (§6.2), prawdziwe `leaderPortraitUrl` (Z-33-5), ślad ścieżek / obrysów / `drawImage` (Z-33-12).

DEPLOY/PUSH: NIE WYKONANO
