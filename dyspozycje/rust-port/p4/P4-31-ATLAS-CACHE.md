# P4-31 — RR-T8d: klucze treści, cache tekstur, mipmapy, skala DPI×LOD, upload (R-RUSTPORT-P4-31-ATLAS-CACHE-Q1)

Temat: `R-RUSTPORT-P4-31-ATLAS-CACHE-Q1`, DOMAIN: GAME, runda 1/5 (Operator). Plan: `P4-25-TEXT-RASTER-AUDIT.md` §6, wiersz RR-T8d. Baza: `rust-port/parity-v2` @ `672c2059` (RR-T8a/b/c zintegrowane).
Kod: `rust-port/renderer/src/raster/atlas/**` (+ jedna linia `pub mod atlas;` w `src/raster/mod.rs`). Testy: `tests/atlas_{keys,mip,nturns,gpu,json}.rs`. Fixtury: `tests/fixtures/atlas/**` (2,4 MB). Dowody surowe: `dyspozycje/autobot/runs/R-RUSTPORT-P4-31-ATLAS-CACHE-Q1/dowody/`.

Konwencja: `plik:linia` bez prefiksu = `gra/src/render/` w pinie `edb8fb56`; `three.module.js:N` = `three@0.169.0/build/three.module.js`. `NIE_ZMIERZONO` = nie sprawdzone. `[zewn.]` = wiedza spoza repo, nieczytana w źródłach.

## 0. Streszczenie

1. **Klucze treści (pkt 1 GOAL) — bit w bit z działającym webem.** Port `cityMapBadgeKey` (oba przeciążenia), `formatCityGrowthPercentLabel`, `cityBadgeLodSegment`, `civSigilCacheKey`, `leaderPortraitCacheKey`, `prodIconCacheKey`, `ownerEmblemKey` (T10), `workerSpriteCacheKey` (T12), klucz T11 `${path}:${level}`. Wektory z uruchomionego kodu weba (`gen.ts`, esbuild + three@0.169.0): **1761 + 546 + 4074 + 1612 = 7993 kluczy/etykiet, 0 niezgodności** (`tests/atlas_keys.rs`). Semantyka JS odtworzona dokładnie: `String.prototype.trim` (U+FEFF tak, U+0085 nie — inaczej niż `str::trim`), `toLowerCase`, `Math.floor/round/max` z `|| 1`, `Number#toString` (`Infinity`, `1e+21`), `toFixed(1)`, U+2212.
2. **Polityka cache (pkt 2) — klasa M2 usunięta konstrukcyjnie i sprawdzona testem.** `TextureCache` na **istniejącym** rejestrze RR-T6 (`assets::Cache` + `Owned`, bez duplikacji): licznik odwołań, port poprawki weba M2 `pruneUnusedStatChipTextures` (`5d9534e0` `cities.ts:608-619`), port `disposeCityMapBadgeTexturesForOtherLod` (300/300 przypadków jak w webie), przycinanie końca tury RR-T6, LRU. `BadgeTextures` = księgowanie `_syncStatChip`. **Test N=200 tur** (40 miast, zmiany wzrostu/produkcji/populacji/LOD co turę, 5353 tekstur utworzonych): po każdej turze liczba żywych tekstur = liczba różnych kluczy na ekranie ≤ liczba miast (tura 10: 14/14, 50: 24/24, 200: 40/40). Ten sam przebieg bez prune (model pinu) rośnie do **668** wpisów — test rozróżnia.
3. **Mipmapy CPU (pkt 3) — zmierzone na WebGL2 Chromium 141 (ANGLE → Vulkan → SwiftShader).** Model: każdy poziom z poprzedniego, próbkowanie dwuliniowe środka (`(i+½)·W/w − ½`, f32 jak blit GPU); RGBA8: zaokrąglenie połówek do parzystej, sRGB: filtr w świetle liniowym. Wynik: **RGBA8 parzyste rozmiary 12550/12550 bit w bit**; RGBA8 nieparzyste 99,66 %, sRGB 98,95 % / 99,85 %, zawsze ≤ 1 LSB. Filtr GL u właściciela (ANGLE → D3D11): **NIE_ZMIERZONO** (GL zostawia go implementacji).
4. **Skala DPI×LOD z limitem 2048 (pkt 4)** — czyste funkcje, 2342/2342 wektorów z weba bit w bit (LOD z odległości, mnożnik LOD, `badgePixelRatio`, `badgeCanvasScale`, `Math.round(W·s)`); dla każdej osiągalnej plakietki (W ≤ 463, H ≤ 70 px CSS) limit nie zadziała (463·4 = 1852). Limit 2048 = `wgpu::Limits::downlevel_defaults().max_texture_dimension_2d` (test).
5. **Upload (pkt 5)** — CPU: niepremultiplikacja jak Chromium przy `texImage2D` (zmierzona, 99,33 %, ≤ 1 LSB), ustawienia T1–T15 z kodu weba + domyślnych Three r169 (odkrycie: T1–T6 i T15 **mają** mipmapy i są `RGBA8` bez sRGB — P4-25 miał to jako `[zewn., niezweryfikowane]`), blending Three `NormalBlending`. GPU (`--features gpu`): `Rgba8UnormSrgb`/`Rgba8Unorm`, wszystkie poziomy przez `Queue::write_texture`, sampler, `BlendState`; **kompiluje się i przechodzi clippy z `--features gpu`**; test z urządzeniem `#[ignore]` (brak adaptera w kontenerze, spike P4-15 u właściciela).
6. **Rejestr zasobów (pkt 6)** — użyty `assets` (RR-T6): `Assets`, `Cache`, `Owned`, `FakeGpu`; LOD z `core::zoom_lod` (P4-17). Nic nie zduplikowano; `assets/**` i `core/**` bez zmian.
7. **Mutacje 27/27 zabite** (`dowody/08-mutations.log`). Determinizm: fixtury odtworzone drugi raz bajt w bajt; ślad N tur identyczny przy tym samym ziarnie. **Zero nowych zależności**, `Cargo.toml`/`Cargo.lock` bez zmian, `forbid(unsafe_code)` zostaje.

## 1. Metoda (reprodukcja)

```bash
# klucze/skala (web pin edb8fb56, three@0.169.0, esbuild@0.24.0, node v22.22.0) — poza repo:
bash rust-port/renderer/tests/fixtures/atlas/gen.sh <scratch>
# WebGL2 (Playwright 1.56.1, Chromium 141.0.7390.37, SwiftShader):
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node rust-port/renderer/tests/fixtures/atlas/gen_gl.mjs <out>
# odtworzenie obu i porównanie sha256: dowody/06-fixtures-repro.{sh,log}
# bramki: dowody/01-gates.{sh,log}; mutacje: dowody/08-mutations.{py,log}
```

Adaptacje generatora kluczy (pełna tabela: `tests/fixtures/atlas/README.md`): funkcje prywatne modułów stają się importowalne przez **dopisanie** jednej linii `export { … };` do kopii pliku w scratchu (ciała funkcji nietknięte); `window.devicePixelRatio` podstawiany przez `globalThis.window`; dwa fragmenty niebędące funkcjami skopiowane dosłownie (`unitUpgradeBadges.ts:312`, `cityMapStatChip.ts:848-849`).

Pomiary modeli mipmap i niepremultiplikacji dopasowywano skryptami jednorazowymi w scratchu (numpy), na większym zbiorze (dodatkowo 512×168 T7, 256×213 T8; 166 860 tekseli). Do repo trafił zestaw zredukowany (0,95 MB); liczby w tym dokumencie pochodzą z testów Rust na fixturze w repo.

## 2. Klucze treści (pkt 1)

| Funkcja Rust (`raster::atlas::keys`) | Web | Wektory | Wynik |
|---|---|---|---|
| `city_map_badge_key` | `cityMapBadgeKey(input)` `cityMapStatChip.ts:962-1012` | 1761 | 1761/1761 |
| `city_map_badge_key_legacy` | `cityMapBadgeKey(name, pop)` `:966-969` | 546 | 546/546 |
| `format_city_growth_percent_label` | `:744-750` | 4074 | 4074/4074 |
| `civ_sigil_cache_key` | `:583-585` | 18 | 18/18 |
| `leader_portrait_cache_key` | `:607-610` | 288 | 288/288 |
| `prod_icon_cache_key` | `:631-633` | 24 | 24/24 |
| `owner_emblem_key` (T10) | `unitOwnerEmblem.ts:306-312`, `:426-428` | 1216 | 1216/1216 |
| `worker_sprite_cache_key` (T12) | `workerFieldOverlay.ts:58-60` | 60 | 60/60 |
| `upgrade_badge_key` (T11) | `unitUpgradeBadges.ts:312` | 6 | 6/6 |
| `city_badge_lod_segment` | `:1015-1017` | 13 | 13/13 |

Pokrycie przypadków brzegowych (zbiory w `gen.ts`): białe znaki Unicode (U+00A0, U+FEFF, U+0085, U+2028/2029, U+3000, U+200B, U+180E, VT/FF), sigma końcowa, `İ`, `Ǆ`, `ẞ`, `ﬀ`, znak Kelvina, populacje 0/−0/NaN/±∞/0,5/1,9/1e21/1e300/2^53+2, wzrost na remisach dziesiętnych (−0,05, 0,45, 1,005, 99,95), ±1e21, 5e−324, ery 0/−0,4/2,5/3,5/NaN/±∞/1e21, LOD 1,5/3/NaN/2+ulp.

Obserwacja o webie (zachowana dla zgodności, ZAŁOŻENIE Z-31-3): klucz **nie zawiera** `ownerColor`, `prodCategoryLabel`, `prodItemName`, `prodPaused`, choć są rysowane (`cityMapStatChip.ts:17-78` vs `:998-1011`). Np. wstrzymanie kolejki przy tym samym froncie nie zmienia klucza, więc rozwinięta (hover) plakietka może pokazywać stary stan. Rust robi to samo; ewentualna poprawka to zmiana zachowania względem weba (decyzja poza tym tematem).

## 3. Cache i cykl życia (pkt 2, pkt 6)

`raster::atlas::cache`:
- `TextureCache<R>` — klucz (string weba) → `Owned<Texture, R>` w `assets::Cache` (RR-T6). Uchwyt sceny = klon `Owned` (licznik odwołań). Polityki: `prune_unused(live)` (port `pruneUnusedStatChipTextures`, `5d9534e0` `cities.ts:608-619`), `purge_other_lod(lod)` (port `disposeCityMapBadgeTexturesForOtherLod`, `cityMapStatChip.ts:1034-1047`), `end_of_turn()` (RR-T6: wpis trzymany tylko przez cache → out), LRU z `CachePolicy` (liczba wpisów / bajty), `clear()` („nowa gra”, `disposeCityStatChipTextures` `:1130-1133`).
- `BadgeTextures<R>` — sloty obiektów jak `statSprites`/`statSpriteKeys` (`cities.ts:850-878`): ten sam klucz → ta sama tekstura bez pracy (`:865-869`); inny klucz → nowa (najpierw nowa, potem stara zwolniona); `set_lod_level` = `setBadgeZoomLod` (`:582-588`); `finish_sync()` = czyszczenie LOD po zmianie poziomu (`:573-576`) + prune (`5d9534e0` `:593`).

Web — stan w pinie: `statTexCache` (`cities.ts:415`) traci wpisy tylko przy zmianie LOD i w `dispose()` (`:697`), więc rośnie o każdą kombinację wzrost/produkcja/populacja (M2, P4-3 §7.1). Poprawka weba istnieje dopiero w `5d9534e0` (po pinie) — port bierze jej semantykę.

Testy (`tests/atlas_nturns.rs`, backend `FakeGpu` liczący alokacje):

| Test | Wynik |
|---|---|
| N=200 tur, ziarno `0x5eed0031`, 12→40 miast | po każdej turze: tekstury = różne żywe klucze = wpisy cache ≤ miasta; t10 14/14, t50 24/24, t200 40/40; utworzono 5353 tekstury; wzrost t10→t200 tekstur (26) ≤ wzrost miast (26); po zniszczeniu renderera 0 żywych |
| model pinu (bez prune, tylko czyszczenie LOD) | maks. **668** wpisów (> 10 × 40) — wzrost M2 odtworzony, więc test N tur rozróżnia |
| LRU 8 wpisów przy 40 żywych kluczach | cache ≤ 8, a tekstury pokazywane żyją (licznik odwołań): żywe = klucze na ekranie |
| determinizm | ten sam ziarno → ten sam ślad (FNV-1a), inne ziarno → inny |
| klucz współdzielony | 1 tekstura, `ref_count` 3 (cache + 2 sloty) → 2 → zwolniona po `finish_sync` |
| przebudowa w miejscu 1000 cykli (pop 1→10→1, produkcja) | liczniki wracają dokładnie; każda zastąpiona tekstura zwolniona (`frees + 1 = allocations`) |
| zmiana LOD | 3 tekstury starego poziomu idą w czyszczenie LOD, prune nie ma już nic |
| `lod_purge_matches_web` | 300/300 przebiegów `disposeCityMapBadgeTexturesForOtherLod` z weba: ta sama liczba zwolnionych i ten sam zbiór zostawionych |

Uwaga z mutacji (A15): wyłączenie samego `prune_unused` zabija tylko test jednostkowy klucza współdzielonego, nie test N tur — bo `end_of_turn` (RR-T6) zwalnia te same wpisy najpóźniej na końcu tury. To zamierzone podwójne zabezpieczenie (prune = zachowanie weba w trakcie tury, `end_of_turn` = gwarancja P4-3 §7.3 pkt 4).

## 4. Mipmapy (pkt 3)

### 4.1 Kto ma mipmapy (zweryfikowane w źródłach three@0.169.0)

Mipmapy powstają, gdy `generateMipmaps && minFilter ∉ {Nearest, Linear}` (three.module.js:24241-24245). Domyślnie `minFilter = LinearMipmapLinearFilter`, `generateMipmaps = true`, `colorSpace = NoColorSpace`, `premultiplyAlpha = false` (`src/textures/Texture.js:22`, `:60-61`). Ustawienia producentów (grep `CanvasTexture|minFilter|colorSpace|generateMipmaps` w pinie):

| Producent | Linia | minFilter | colorSpace → format | Mipmapy |
|---|---|---|---|---|
| T1 🔥 | `cities.ts:718` | domyślny | brak → `RGBA8` | **tak** |
| T2 ⚔ | `siegeMarker.ts:46` | domyślny | brak → `RGBA8` | **tak** |
| T3–T6 | `units.ts:6298`, `:6356`, `:6386`, `:6598` | domyślny | brak → `RGBA8` | **tak** |
| T7 | `unitStatPlate.ts:437-443` | `LinearMipmapLinear` | sRGB → `SRGB8_ALPHA8` | tak |
| T8 | `unitStatPlate.ts:573-575` | `Linear` | sRGB | nie |
| T9 | `unitStatPlate.ts:618-621` | `LinearMipmapLinear` | sRGB | tak |
| T10 | `unitOwnerEmblem.ts:349-351` | `Linear` | sRGB | nie |
| T11 | `unitUpgradeBadges.ts:324-327` | `LinearMipmapLinear` | sRGB | tak |
| T12 | `workerFieldOverlay.ts:104-106` | `Linear` | sRGB | nie |
| T13 | `cityOkolicaOverlay.ts:210-212` | `Linear` | sRGB | nie |
| T14 | `cityMapStatChip.ts:1076-1078` | `Linear` | sRGB | nie |
| T15 | `battle/battleScene.ts:18662` | domyślny | brak → `RGBA8` | **tak** |

`RGBA8` vs `SRGB8_ALPHA8`: three.module.js:24337. Liczba poziomów: `Math.log2(Math.max(w,h)) + 1` (three.module.js:24401; WebGL obcina do liczby całkowitej) = `floor(log2(max)) + 1`. W Rust: `upload::Producer::options()` (test jednostkowy z tą tabelą).

### 4.2 Filtr `generateMipmap` — pomiar

Referencja: `gl.generateMipmap` po `texStorage2D` jak w Three, odczyt każdego poziomu przez framebuffer (`gen_gl.mjs`). Jedyna dostępna implementacja GL: **Chromium 141 → ANGLE → Vulkan → SwiftShader** (`renderer` w fixturze). Wnioski z dopasowania (skrypty jednorazowe; warianty odrzucone w nawiasach):

- każdy poziom liczony z **poprzedniego** poziomu;
- rozmiar parzysty: średnia 2×2; **RGBA8: remisy do parzystej** — 100 % (połówki w górę: 75 %, f32 sum: 92,6 %);
- rozmiar nieparzysty: próbkowanie dwuliniowe środka tekselu docelowego w f32 (`ratio = f32(W)/f32(w)`, `p = (i+½)·ratio − ½`) — box 2×2 z pominiętym wierszem daje błąd do 128 (test `naive_box_filter_is_rejected_on_odd_sizes`); f64 zamiast f32: 97,9 %;
- sRGB: RGB dekodowane do światła liniowego, filtrowane, kodowane, połówki w górę (filtrowanie na zakodowanych bajtach: 1–2 % zgodności, maks. błąd 73); alfa liniowo, połówki w górę.

Zgodność modelu Rust (`tests/atlas_mip.rs`, krok z poziomu GL / cały łańcuch od poziomu 0):

| Klasa | Krok (bit w bit) | Łańcuch od poziomu 0 | maks. \|Δ\| |
|---|---|---|---|
| RGBA8, rozmiar parzysty | **12550/12550** | 12549/12550 (błąd odziedziczony z wcześniejszego poziomu nieparzystego) | 0 / 1 |
| RGBA8, nieparzysty | 3247/3258 (99,66 %) | 3246/3258 | 1 |
| sRGB, parzysty | 12418/12550 (98,95 %) | 12399/12550 | 1 |
| sRGB, nieparzysty | 3253/3258 (99,85 %) | 3232/3258 | 1 |

Co jest wiarygodnie odtwarzalne: struktura filtra (z poprzedniego poziomu, blit dwuliniowy, sRGB w świetle liniowym) i bajty RGBA8 parzystych poziomów. Reszta (resztkowe ≤ 1 LSB w sRGB — prawdopodobnie przybliżona funkcja potęgowa SwiftShadera `[zewn.]`) — nieodtworzone. Filtr na sprzęcie właściciela (ANGLE → D3D11; D3D11 `GenerateMips` jest zdefiniowany przez sterownik `[zewn.]`) — **NIE_ZMIERZONO**; to dotyczy też tego, czy sRGB jest tam filtrowane liniowo.

Rust generuje mipmapy na alfie prostej (straight), dokładnie jak web (canvas → niepremultiplikacja → `generateMipmap`), więc odtwarza też ciemne obwódki przy krawędziach przezroczystości, które ma web.

## 5. Upload (pkt 5)

### 5.1 Ścieżka Three r169 (źródła)

- `UNPACK_PREMULTIPLY_ALPHA_WEBGL = texture.premultiplyAlpha` = `false` (three.module.js:24887; `Texture.js:61`) → przeglądarka niepremultiplikuje kanwę; tekstura ma alfę prostą.
- `UNPACK_COLORSPACE_CONVERSION_WEBGL = NONE` przy zgodnych prymariach (three.module.js:24884-24889).
- Materiały: `premultipliedAlpha = false` (`src/materials/Material.js:70`) → `NormalBlending` = `blendFuncSeparate(SRC_ALPHA, ONE_MINUS_SRC_ALPHA, ONE, ONE_MINUS_SRC_ALPHA)` (three.module.js:23288-23289). Wariant premultiplikowany: `ONE, ONE_MINUS_SRC_ALPHA` (:23262-23263).

### 5.2 Niepremultiplikacja Chromium — pomiar

256×64 tekseli (alfa 0,5/256 … 255,5/256, losowe RGB) wysłane z `premultiply=true` (bajty kanwy) i `false` (to, co dostaje Three). Model `c' = round_half_even(c·255/a)` w f64: **48632/48960 kanałów (99,33 %), maks. |Δ| = 1**; alfa bez zmian; `a = 0` → (0,0,0,0). Odrzucone: `floor` 54 %, połówki w górę 98,7 %, połówki w dół 97,7 %, warianty f32 ≤ 99,25 %. `getImageData` różni się od ścieżki `texImage2D` o ≤ 1 (98,4 % zgodnych) — to dwie różne konwersje w Chromium. Dokładna formuła Skia/Chromium: **NIE_ZMIERZONO**.

### 5.3 API Rust

`raster::atlas::upload`: `AlphaMode::{Straight (domyślny, zgodny z webem), Premultiplied}`, `TexFormat::{Rgba8UnormSrgb, Rgba8Unorm}`, `MinFilter`, `Producer::options()` (tabela §4.1), `unpremultiply`, `prepare(premul, w, h, opts) -> TextureData` (konwersja alfy → łańcuch mip), `blend_for`. Wejście: `Canvas2dLite::pixels_premultiplied()` (tiny-skia, premultiplikowane sRGB).
`raster::atlas::gpu` (`--features gpu`): `wgpu_format`, `wgpu_blend_state`, `texture_descriptor` (`TEXTURE_BINDING | COPY_DST`, liczba poziomów z danych), `sampler_descriptor` (liniowy mag/min, `MipmapFilterMode::Linear` dla `LinearMipmapLinear`, `ClampToEdge` = domyślne `ClampToEdgeWrapping` Three), `upload(device, queue, label, data)` — `Queue::write_texture` dla każdego poziomu (bez wymogu wyrównania 256 B, który dotyczy tylko kopii bufor↔tekstura). Moduł `src/gpu.rs` nie był zmieniany (allowlista: tylko gdy konieczne — nie było).

Testy GPU (`tests/atlas_gpu.rs`): bez urządzenia — formaty, `BlendState` (straight = SRC_ALPHA…, premultiplied = `BlendState::PREMULTIPLIED_ALPHA_BLENDING`), deskryptory T9 (7 poziomów, `Rgba8UnormSrgb`), `MAX_TEXTURE_SIZE == Limits::downlevel_defaults().max_texture_dimension_2d`. Z urządzeniem (`#[ignore]`, powód w atrybucie): upload T9 i odczyt każdego poziomu (`copy_texture_to_buffer`, wiersze 256 B) == dane CPU. `gpu_probe` w kontenerze: `SKIPPED: no GPU adapter` (log 01).

## 6. Skala DPI×LOD (pkt 4)

`raster::atlas::scale`: `badge_pixel_ratio(dpr)` (`:149-152`, `None` = brak `window` → 1), `badge_canvas_scale(dpr, lod)` (`:183-185`), `canvas_px_with_limit(W, H, s, limit)` = `Math.round(W·s)` × `Math.round(H·s)` (`:848-849`) + strażnik limitu, `badge_canvas_px` (z `MAX_TEXTURE_SIZE = 2048`). LOD z odległości i mnożnik LOD: istniejące `core::zoom_lod::{city_badge_lod_level_for_dist, city_badge_lod_texture_scale}` (P4-17), sprawdzone tymi samymi wektorami.

Wektory: 317 odległości, 11 poziomów, 13 segmentów, 23 DPR (w tym 0, −0, NaN, ±∞, 1e−300, 3−ulp), 184 skale, 1794 rozmiary kanwy (W ∈ {1 … 463, 512, 1000}, H ∈ {48, 70}) — **2342/2342 bit w bit**. Dla W ≤ 463 (najszersza osiągalna plakietka, `:124-128`) żadna kombinacja nie dotyka limitu; dla W = 512/1000 przy skali 4 web dałby 2048/4000 px — Rust zmniejsza skalę tak, by dłuższy bok = 2048 i oznacza `clamped` (ZAŁOŻENIE Z-31-2; web w takim przypadku zdałby się na `resizeImage` Three do `MAX_TEXTURE_SIZE` sprzętu `[zewn.]`, przypadek nieosiągalny).

## 7. Bramki (surowe logi: `dowody/01-gates.log`)

`cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0; `cargo clippy --locked --all-targets --features gpu -- -D warnings` EXIT=0; `cargo test --locked --all-targets` EXIT=0 (rustc 1.97.0; 304 passed, 0 failed); `cargo test --locked --features gpu --test atlas_gpu --test gpu_probe` EXIT=0 (atlas_gpu: 2 passed, 1 ignored; probe: `SKIPPED: no GPU adapter`); `cargo +1.87.0 test --locked --all-targets` EXIT=0 (304 passed, 0 failed; przed nim `cargo clean`, bo dysk kontenera jest współdzielony — pierwsza próba bez czyszczenia padła na `No space left on device`, §10). `git diff --check` EXIT=0, `Cargo.toml`/`Cargo.lock` bez zmian, `#![forbid(unsafe_code)]` w `src/lib.rs`.

## 8. Mutacje (`dowody/08-mutations.{py,log}`) — 27/27 zabitych

Klucze (A01–A11: trim Rust zamiast JS, brak `toLowerCase`, `floor`→`round`, era `round`→`floor`, kropka zamiast przecinka, `-` zamiast U+2212, LOD 1 nierozpoznany, domyślne `b`, segment `w` z `hoverExpanded`, klucz barbarzyńców, odwrócony pierścień robotnika), skala (A12–A14: limit 4→5, DPR 3→2, brak limitu 2048), cache (A15–A19: prune nic nie zwalnia, czyszczenie LOD odwrócone, brak skrótu „ten sam klucz”, brak prune w `finish_sync`, zmiana LOD nie planuje czyszczenia), mip (A20–A23: połówki w górę, brak przesunięcia środka, sRGB na bajtach zakodowanych, o jeden poziom za mało), upload (A24–A27: obcięcie zamiast zaokrąglenia, mipmapy dla `LinearFilter`, blend `ONE` zamiast `SRC_ALPHA`, T1–T6/T15 jako sRGB).

## 9. Założenia

- **Z-31-1 (szablon dispatchu):** lista „przeczytaj OBOWIĄZKOWO” (P4-4, P4-3, P4-8, P4-11, P4-6) to szablon tematów modelowych. Merytorycznie wiążące dla RR-T8d: P4-25 (§2, §4.3, §6), P4-3 §7, kod `assets/**` (RR-T6) i `raster/**` (RR-T8a–c), P4-30 (§4–§5). P4-4 przejrzany w częściach o `CanvasTexture`/LOD (§3.4, `:195`, `:512`, `:557`), P4-6 w części o cesze `gpu`/CI, P4-11 jako wzorzec weryfikacji (fixtura + README + generator poza repo); P4-8 (geometria) nie dotyczy tekstur — nie użyty. Model „drzewo mesh” z KONTEKSTU dispatchu dotyczy tematów modelowych — tu niepotrzebny.
- **Z-31-2:** strażnik 2048 w Rust zmniejsza skalę zamiast tworzyć większą teksturę (dla osiągalnych plakietek nieaktywny, zweryfikowane).
- **Z-31-3:** klucze zachowują pominięcia weba (`ownerColor`, `prodCategoryLabel`, `prodItemName`, `prodPaused`) — §2.
- **Z-31-4:** domyślny `AlphaMode::Straight` (zgodność z webem, z jego obwódkami mipmap); `Premultiplied` dostępny, nieużywany.
- **Z-31-5:** model mipmap = SwiftShader (jedyny zmierzony GL); na innym GL różnice ≤ kilku LSB są oczekiwane, ale niezmierzone.
- **Z-31-6:** kolejność kluczy w `TextureCache::keys()` jest posortowana (web: kolejność wstawiania `Map`); porównanie z webem jako zbiory. Kolejność nie wpływa na wynik żadnej polityki.
- **Z-31-7:** test N tur używa symulowanego świata (stałe ziarno), nie AI gry — silnik Rust nie jest częścią tej paczki; liczniki są z prawdziwego rejestru RR-T6 i `FakeGpu`.

## 10. NIE_ZMIERZONO / ograniczenia

Filtr `generateMipmap` i niepremultiplikacja na ANGLE → D3D11 (Windows właściciela) oraz na innych sterownikach. Dokładna formuła niepremultiplikacji Chromium (model ≤ 1 LSB). Pamięć adaptera (test N tur liczy zasoby rejestru, nie VRAM). Upload na prawdziwym GPU (test `#[ignore]`). Porównanie liczników z `?perfDebug=1` weba (P4-3 §7.3 pkt 7, wymaga uruchomienia gry). Wersja Unicode `toLowerCase` V8 vs `core` dla znaków spoza zbioru wektorów (identyfikatory gry są ASCII/PL). Środowisko: pierwsza próba bramki MSRV 1.87 padła na pełnym dysku kontenera (`No space left on device`, linker); log tej próby nadpisano przebiegiem z `cargo clean` przed krokiem 1.87 (EXIT=0) — to ograniczenie środowiska, nie kodu.

## 11. Do oceny wzrokiem po RR-T5 (u właściciela, z GPU)

1. T9 cyfry mocy i T7 tło tabliczki przy oddalonej kamerze (mipmapy, migotanie cienkich obrysów) — porównać z webem na tej samej klatce.
2. Ciemne obwódki na krawędziach przezroczystości T1–T6/T11 przy pomniejszeniu (efekt mipmap na alfie prostej — web ma je także).
3. T1–T6, T15 jako `Rgba8Unorm` (bez dekodowania sRGB): jasność/nasycenie ikon 🔥 ⚔ ☠ vs web.
4. T14 plakietka miasta po przejściach progu LOD (5,5 / 11 j.św.) i przy DPI 1/1,5/2/3 — ostrość, brak „skoku” wielkości.
5. Hover plakietki po wstrzymaniu kolejki (Z-31-3) — czy stan „wstrzymana” się odświeża (w webie nie).
