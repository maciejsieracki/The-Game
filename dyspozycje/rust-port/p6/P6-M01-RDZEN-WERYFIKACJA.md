# P6.M01 - Rdzen generatora mapy: weryfikacja wektorami z weba

Temat: `R-RUSTPORT-P6-M01-RDZEN-WERYFIKACJA-Q1` (DOMAIN: GAME, rozmiar M, 682 LOC web wg P6-25 §6). Runda 1/5, rola Obrona (odpowiedz na FAIL Evaluatora).
Baza: `origin/rust-port/parity-v2` @ `453c3c79` (silnik: 595 testow). Pin weba: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do `mktemp`-owego katalogu poza repo; SHA plikow: `runs/.../web-source-proof.txt`).
Artefakty: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M01-RDZEN-WERYFIKACJA-Q1/`.

## 0. Odpowiedz na zarzuty Evaluatora (kazdy: PRZYJMUJE + poprawka + dowod)

Stan wejsciowy potwierdzony: na bazie nie bylo kodu ani dokumentu M01 (raport Operatora to jedno zdanie o "mutation run"; zadnego artefaktu). Wszystkie 13 zarzutow sa zasadne i zostaly zrealizowane w tej rundzie:

| # | Zarzut | Odpowiedz | Dowod |
|---|---|---|---|
| 1 | brak formatu raportu | PRZYJMUJE | `02-obrona-r1.md` w runie (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTEPNY KROK) |
| 2 | brak dokumentu | PRZYJMUJE | ten plik |
| 3 | brak statusu per eksport | PRZYJMUJE | §2 (tabele A-C: kazdy symbol z zakresow ma status i dowod) |
| 4 | brak wektorow z uruchomionego weba | PRZYJMUJE | `tests/p6_m01_vectors/web-vectors.json` (2 330 064 B) z `gen-m01-web.mjs` uruchomionego na Node v22.22.0 na kodzie wycietym WERBATIM z `gen-helpers.ts`:36-232 i :237-251 oraz calego `earth-land-mask.ts` (SHA-256 wycinkow w wektorach i w `web-source-proof.txt`) |
| 5 | brak weryfikatora Python | PRZYJMUJE | `verify-m01-web.py` (czysty Python, stale i maska parsowane z TEKSTU TS, wlasna transkrypcja fdlibm z dziesietnymi stalymi): `verify-m01-web.log` = 268 185 sprawdzen, 0 rozbieznosci; kontrola negatywna: zmiana jednej komorki wektora -> 1 rozbieznosc, podmiana `fcos` na `math.cos` -> 519 rozbieznosci |
| 6 | brak testu Rust i porownania bitowego | PRZYJMUJE | `tests/p6_m01_prims.rs` (14), `p6_m01_earth_mask.rs` (10), `p6_m01_climate.rs` (7), `p6_m01_params_shape.rs` (9); porownania `f64::to_bits` |
| 7 | brak zmian w `map_generator.rs`/`prims.rs` | PRZYJMUJE | `prims.rs` 633 LOC (z 3 linii); `map_generator.rs` 1546 -> 1236 LOC (§3) |
| 8 | brak audytu literalow i wpisow w `data/derived` | PRZYJMUJE | §5; `grep-literals-prims.txt`; `data/derived/mapgen-core-params.json`, `earth-land-mask.json` + parser w `src/data/derived.rs` (dopisek na koncu) |
| 9 | brak testow ksztaltu i mutacji | PRZYJMUJE | `p6_m01_params_shape.rs` (bez pinow wartosci); mutacje §6: 25/25 wykrytych |
| 10 | brak pelnych logow z `EXIT=` | PRZYJMUJE | `gate-fmt.log`, `gate-clippy.log`, `gate-test.log`, `gate-diffcheck.log` (surowe, niepuste, EXIT=0) |
| 11 | brak `git diff --check` | PRZYJMUJE | `gate-diffcheck.log` (po `git add`, wzgledem indeksu) |
| 12 | allowlista nie weryfikowalna | PRZYJMUJE | §7 (lista plikow z `git status`; dwa jawne odstepstwa) |
| 13 | odlozenie na "mutation run" bez podstawy | PRZYJMUJE | mutacje wykonane synchronicznie: `mutate.py`, `mutacje-przebieg1.log`, `mutacje-przebieg2.log` |

## 1. Odczytane zrodla (pelne odczytanie, liczby linii)

Web (pin `edb8fb56`): `earth-land-mask.generated.ts` 417 linii (naglowek 1-16, 400 wierszy po 720 znakow `0/1` w :17-416, `];` :417; struktura sprawdzona skryptem: 400 x 720, tylko `0/1`), `earth-land-mask.ts` 170 linii (calosc), `gen-helpers.ts` 12 561 linii (zakres M01 :33-232 i :237-251 odczytany w calosci; reszta pliku nalezy do M02-M08, M13). Odczytano takze `types/hex.ts` :12-24 (enum `TerenBazowy`, zalezny `isWaterTerrainLocal`).
Rust: `map_generator.rs` (pierwotnie 1546 linii) odczytany w calosci istotnych czesci (rdzen, maska, klimat, testy), `mapgen/prims.rs` (3 linie), `mapgen/mod.rs`, `rng.rs:100-136`, `hex.rs:1-100`, `data/derived.rs` (naglowek i koncowka), `tests/p6_m00_skeleton.rs`, `tests/p6_1_rng_mulberry.rs`.
Dokumenty: `P6-25-MAPA-GAP.md` (1088 linii): §2 pkt 3-7, §3 wiersze M01, §4 wiersze 97-130, §6, §6a, §9 (Z1-Z6) - przeczytane; pozostale sekcje (§1, §5, §7, §8, §10-§12) nieczytane w calosci (NIE_ZMIERZONO). `P6-0-GAP-ANALYSIS.md` (435 linii): §0 i §5 przeczytane, reszta tabeli §3 nie dotyczy M01. `P6-M00-MAPGEN-SZKIELET.md` (72 linie) przeczytany w calosci. Skrypty wzorcowe P3-22 (`gen-loader-hooks.mjs`, `gen-loader-register.mjs`, `gen-diplomacy-web.mjs`) przeczytane i uzyte jako wzorzec. NIE czytane (nie dotycza mapgen): `P3-22-FLATTEN-STAGE2.md`, `P2-3-ENTITY-IDS.md`, `P2-5-COMMANDS.md`, `PLAN-PORT-RUST-TAURI-20261020.md` §P6, `LEDGER.md` (NIE_ZMIERZONO, czy zawieraja dodatkowe ograniczenia).

## 2. Status kazdego symbolu zakresu

Legenda: PORTOWANY = kod + test + wektor z uruchomionego weba, 0 rozbieznosci; DANE-JUZ-W-RUST (z dowodem); NIE-DOTYCZY (z uzasadnieniem); RUNDA-2 (z lista, §4).

### A. `earth-land-mask.generated.ts`:1-417

| linia | symbol | status | Rust / test |
|---|---|---|---|
| :7 | `EARTH_MASK_W` | PORTOWANY | `data/derived/earth-land-mask.json:szerokosc`, `prims::earth_mask_width`; `mask_dimensions_and_bbox_match_web_bit_for_bit` |
| :8 | `EARTH_MASK_H` | PORTOWANY | `...:wysokosc`, `prims::earth_mask_height`; ten sam test |
| :10 | `EARTH_MASK_BBOX` | PORTOWANY | `...:bbox`, `prims::earth_mask_bbox`; bity f64 = web |
| :16 (+ :17-416 wiersze) | `EARTH_MASK_ROWS` | PORTOWANY | RLE w `earth-land-mask.json`, `prims::earth_mask_bit_at`; `all_288000_mask_bits_match_the_web_rows` (kazdy z 288 000 bitow + liczba jedynek 58 376) oraz `verify-m01-web.py` (dekodowany RLE Rusta == tekst TS) |
| :1-6, :417 | komentarz naglowka, zamkniecie tablicy | NIE-DOTYCZY | brak logiki |

### B. `earth-land-mask.ts` (170 linii; zakresy z dispatchu)

| linie | symbol | status | Rust / test |
|---|---|---|---|
| :21-26 | `EARTH_POLAR_OCEAN_REF_ROWS`, `EARTH_POLAR_OCEAN_REF_INNER_H` | PORTOWANY | `mapgen-core-params.json:earth.polarny_ocean_wiersze_ref / wysokosc_ref`; `named_constants_match_web_exports` |
| :28-31 | `earthNorthOceanRows` | PORTOWANY | `prims::earth_north_ocean_rows`; `polar_rows_inner_dimensions_and_buffers_match_web_for_heights_0_to_600` |
| :33-36 | `earthSouthOceanRows` | PORTOWANY | `prims::earth_south_ocean_rows`; ten sam test |
| :51-52 | `export { earthPolarOceanRows }` | PORTOWANY | `prims::earth_polar_ocean_rows` (ciag :38-50 jest wg P6-25 w M03, ale zaleznosc tego zakresu - zaimplementowane tu, 601 wysokosci) |
| :79-96 | `sampleEarthTemplateLand` | PORTOWANY | `prims::sample_earth_template_land`; `sample_template_land_matches_web_on_thousands_of_points` (4 412 punktow, oba wyniki), `..._nan_is_sea` |
| :98-127 | `earthHexToTemplateNorm` | PORTOWANY | `prims::earth_hex_to_template_norm`; `hex_to_template_norm_template_land_subsample_and_threshold_match_web_for_all_dims` (24 wymiary map) + `hex_to_norm_edges_match_web` |
| :147-170 | `earthTemplateLandAt` | PORTOWANY | `prims::earth_template_land_at`; ten sam test (wszystkie 4 poziomy podprobkowania 1/3/5/7 i 4 progi ulamka lądu) |

Zaleznosci spoza zakresu M01, zaimplementowane tu, bo wynik zakresu od nich zalezy (nakladanie z M03 wg P6-25 §6: :17, :38-50, :53-78, :128-146): `EARTH_PLAYABLE_BORDER`, `earthPlayableInnerHeight/Width`, `earthLandMapRows`, `bitAt`, `earthSubsampleGrid`, `earthLandFractionThreshold`. Wszystkie prywatne w webie, w wycinku wyeksportowane dopiero w skrypcie generatora (wektory bezposrednie, nie tylko posrednie). M03 powinien je wywolywac z `prims`, nie dublowac.

### C. `gen-helpers.ts`:33-232 i :237-251 (pin: 12 561 linii)

| linia | symbol | status | Rust / test |
|---|---|---|---|
| :33 | `export type { RiverMapParams }` | NIE-DOTYCZY | typ zdefiniowany w `newGameMapDefaults.ts` (M02); 0 importow `RiverMapParams` z `gen-helpers` (`grep`) |
| :34 | `import { earthPolarOceanRows, earthTemplateLandAt }` | NIE-DOTYCZY | zaleznosc wewnetrzna weba; w Rust wywolania lokalne w `prims` |
| :47 | `TypSwiata` | DANE-JUZ-W-RUST | `map_generator::WorldType` (serde `kontynenty/pangea/wyspy/ziemia`); `world_type_and_climate_band_serde_literals_match_web` |
| :57 | `mulberry32` | PORTOWANY | `prims::mulberry32_step/mulberry32_unit` (jedyne wyrazenie arytmetyki w `map_generator`); 40 ziaren x 64 krokow, 3 implementacje (`prims`, `map_generator::Mulberry32`, `rng::Mulberry32`) = web bit w bit. Dedup `rng.rs` -> RUNDA-2 (§4) |
| :72 | `buildPermTable` | PORTOWANY | `prims::build_perm_table`; 24 ziarna x 256 elementow |
| :83 | `cosLerp` | PORTOWANY | `prims::cos_lerp` + `prims::js_cos` (§3 pkt 1); 4 506 trojek, 0 rozbieznosci |
| :89 | `valueNoise2D` | PORTOWANY | `prims::value_noise_2d` (+ `js_to_int32`); 4 x 516 punktow (ujemne, 1e10, 2^31, 2^32+7.5) |
| :109 | `fbm` | PORTOWANY | `prims::fbm`; oktawy 0,1,2,3,4(domyslne),5,8 |
| :125 | `HEX_DIRECTIONS` | PORTOWANY | `prims::HEX_DIRECTIONS` jedyne zrodlo; `map_generator::HexCoord::DIRECTIONS` z niego wyprowadzone; `hex.rs::neighbors` zgodne (test) |
| :135 | `hexDistanceAxial` | PORTOWANY | `prims::hex_distance_axial`; `map_generator::HexCoord::distance` deleguje; `hex.rs::distance` zgodne; pelna siatka 9^4 + 2 000 duzych |
| :152 | `isWaterTerrainLocal` (prywatna) | DANE-JUZ-W-RUST | `Terrain::is_water` (+ `prims::is_water_terrain_local`); test dla wszystkich 8 terenow weba |
| :157 | `hexKey` | PORTOWANY / DANE-JUZ-W-RUST | `prims::hex_key`, `hex.rs::key` i `Display`; test formatu |
| :162 | `ClimateZone` | NIE-DOTYCZY | `@deprecated`; jedyny konsument `render/mapRenderStyle.ts:8,773` (UI) |
| :168 | `ClimateBand` | DANE-JUZ-W-RUST | `map_generator::ClimateBand` (nazwy serde = literaly weba); test |
| :178 | `CLIMATE_POLAR_FRAC` | PORTOWANY | `mapgen-core-params.json:klimat.polarny_proc` |
| :180 | `CLIMATE_DESERT_HALF_ROWS` | PORTOWANY | `...pustynia_pol_wiersze` |
| :182 | `CLIMATE_DESERT_HALF_FRAC` | NIE-DOTYCZY | martwy eksport: jedyne trafienie `grep -rn` w `gra/src` to definicja (:182) |
| :184 | `CLIMATE_PLAINS_HALF_FRAC` | PORTOWANY | `...rowniny_pol_proc` |
| :187 | `CLIMATE_PROCEDURAL_LAT_BUFFER_FRAC` | PORTOWANY | `...bufor_proceduralny_proc` (+ `bufor_proceduralny_min_wiersze` z :230) |
| :193 | `climateBandAt` | PORTOWANY | `prims::climate_band_at(r, h, is_earth)`; `climate_band_sweep_matches_web_for_every_height_and_row`: h = 0..260, 300, 400, 600; r od -3 do h+2; oba tryby; 73 628 komorek, wszystkie 7 pasow |
| :216 | `climateZoneAt` | NIE-DOTYCZY | tylko render (`mapRenderStyle.ts:773`) |
| :223 | `isPolarClimateBand` | PORTOWANY | `prims::is_polar_climate_band`; test |
| :228 | `latitudinalOceanBufferRows` | PORTOWANY | `prims::latitudinal_ocean_buffer_rows`; h = 0..600, oba tryby |
| :233-236 | `isInLatitudinalOceanBuffer` | poza zakresem M01 | wg P6-25 §6 nalezy do M04 (zakres dispatchu konczy sie na :232) |
| :238 | `climateForestThreshold` (prywatna) | PORTOWANY | `prims::climate_forest_threshold`; 64 kombinacje (7 pasow + `undefined`) x 8 baz. UWAGA: w pinie 0 wywolan (`grep climateForestThreshold(` - tylko definicja), port zachowany 1:1 dla kompletnosci zakresu |
| :244 | `canAssignClimateDesert` (prywatna) | PORTOWANY | `prims::can_assign_climate_desert`; web: wywolania :953, :991 (konsumenci w M04/M05+) |

## 3. Zmiany w `map_generator.rs` i odkrycia z wektorow

`map_generator.rs` 1546 -> 1236 LOC (usunieto: 120-liniowa tablica RLE maski, `sample_earth_template_land`, `earth_template_land_at`, `earth_polar_ocean_rows`, cialo `climate_band_at`, `cos_lerp`, `value_noise_2d`, `fbm`, cialo `build_permutation`; arytmetyka `Mulberry32` i `HexCoord::distance/DIRECTIONS` delegowane do `prims`). Publiczne API bez zmian (`Mulberry32`, `climate_band_at(r: u32, h, is_earth)`, `HexCoord`). Testy jednostkowe w tym pliku NIE zmienione (dodano tylko `use super::prims::value_noise_2d;`).

Odkrycia (wszystkie z porownania bitowego z uruchomionym webem):

1. **`Math.cos` V8 != `f64::cos` (glibc).** 91 z 4 506 wartosci `cosLerp` rozni sie o 1 ulp (przyklad: `cosLerp(0.427..., -0.147..., 0.966...)`: Rust `-0.14594720276131792`, web `-0.14594720276131784`). To zmienialo ostatnie bity szumu, wiec `generate_map` nie byl bitowo zgodny z webem. Poprawka: `prims::js_cos` = port `ieee754::cos` z V8 (fdlibm: `k_cos`, `k_sin`, `rem_pio2` do 2^19*pi/2; stale z bitow IEEE). Wynik: 0 rozbieznosci na 11 416 argumentach `Math.cos` (w tym okolice k*pi/2) oraz na wszystkich wektorach `cosLerp/valueNoise2D/fbm`. Powyzej zakresu sredniego (generator tam nie wchodzi: `cosLerp` dostaje `t*pi`, `t` w [0,1)) fallback do `f64::cos`, ktorego odchylenie testowane jest na <= 1 ulp. **Zastrzezenie**: ECMAScript pozwala silnikom przyblizac `Math.cos`; wektory pochodza z V8 (Node 22.22.0). Inne silniki (JSC) moga dawac inne ostatnie bity - sam web nie jest wtedy bitowo powtarzalny miedzy przegladarkami (NIE_ZMIERZONO na innych silnikach).
2. **`climateBandAt` poza mapa: dzielenie calkowite.** Rust porownywal `r < height / 2` w `u32` (dzielenie calkowite), web `r < height / 2` w f64. Rozni sie to dla `(h, r)` = `(1, 0)` i `(3, 1)` w obu trybach (`old-vs-new-climate.txt`); wykryte przez sweep wysokosci od 0; mutacja M07 (powrot do dzielenia calkowitego) jest wykrywana. Praktycznie nieosiagalne w grze (patrz pkt 5), ale poprawione.
3. **`ToInt32`.** `value_noise_2d` uzywal `x.floor() as i32` (saturacja); web `Math.floor(x) & 255` robi `ToInt32` (modulo 2^32). Zgodne tylko w zakresie i32; poprawione `js_to_int32` (wektory dla +-1e10, 2^31, 2^32+7.5, 1e15).
4. **Dwie kopie Mulberry32** (`rng.rs:118`, `map_generator.rs`): obie sa bitowo zgodne z webem (40 x 64 wartosci), a krok algorytmu istnieje teraz raz (`prims::mulberry32_step`) dla `map_generator`. `rng.rs` jest poza allowlista -> RUNDA-2 (§4).
5. **`generate_map` jest bez zmian dla probek.** Porownanie bazy i worktree na 160 konfiguracjach (10 rozmiarow x 4 ziarna x 4 typy swiata): identyczne hasze serializacji mapy w 160/160 (`cmp-generate-map.sh`, `hash-base.txt`, `hash-new.txt`, `hash-diff.txt` pusty). Konfiguracje 3x3 i 40x3 (24 z 160) PANIKUJA w bazie i po zmianie (`clamp` z `min > max`, `f64::clamp`): istniejacy blad `generate_map` dla wysokosci 3 - nie naprawiany w M01 (wlasnosc M18), do zgloszenia.
6. **Literaly serde `Terrain`.** Web: `TerenBazowy` = `'laka'`, `'rownina'`, `'wzgorza'`, `'gory'`, `'plytkie_morze'`, `'morze'`, `'pustynia'`, `'polarny'` (`types/hex.ts:12-24`); Rust `Terrain` ma `#[serde(rename = "Laka")]`, `"PlytkieMorze"` itd. (PascalCase). Literaly weba i Rusta NIE sa zgodne. NIE zmieniane (poza zakresem M01; mogą dotyczyc formatu zapisu/mostu) - do rozstrzygniecia w M00-types/M04/M17.

## 4. RUNDA-2 / poza zakresem (jawna lista)

1. **Dedup `rng.rs::Mulberry32`** (cel P6-25 §6a): wymaga edycji `domain/rng.rs` - poza allowlista. Stan: logika zdublowana w 2 miejscach, obie zamrozone tymi samymi wektorami weba (test `all_three_mulberry32_implementations_match_web_for_every_seed_and_step`); `map_generator` korzysta z `prims`.
2. **Model `MapHex` w `mapgen/types.rs`** (Z2 / `P6-M00-MAPGEN-SZKIELET.md` §2 przypisuje go M01): `types.rs` nie jest na allowliscie dispatchu M01, a zakres web M01 nie obejmuje `types/hex.ts`. `types.rs` bez zmian (puste); do przydzialu orkiestratora (osobny temat albo rozszerzenie allowlisty).
3. `Terrain` serde vs web (§3 pkt 6) i panika `generate_map` dla h=3 (§3 pkt 5): zgloszone, nie naprawiane.
4. Brak innych symboli w zakresie: wszystkie pozostale maja status PORTOWANY / DANE-JUZ-W-RUST / NIE-DOTYCZY w §2.

## 5. Audyt literalow (brak danych/mnoznikow w nowym kodzie)

`grep-literals-prims.txt` (`git grep -nE '[0-9]+\.[0-9]+|0x[0-9a-fA-F_]{4,}|\b[0-9]{2,}\b' -- src/domain/mapgen/prims.rs`, 140 linii) + `map_generator-dodane-linie.txt` (linie dodane do `map_generator.rs`: bez literalow liczbowych poza `0`/`6`/`1`). Klasyfikacja pozostalych literalow w `prims.rs`:

- stale algorytmu, NIE balans (nie ida do tabel): `0x6d2b79f5`, `61`, `15`, `7`, `14` (mulberry32); `255`/`256` (rozmiar permutacji, maska indeksu - kontrakt weba); `0.5`, `2.0`, `1.0`, `0.0` (amplituda/czestotliwosc fBm, srodek pasa `center = 0.5` w :199 weba, interpolacja); fdlibm: wspolczynniki `KC*/KS*/PIO2*/INV_PIO2` jako bity IEEE (`from_bits`), progi slow `0x3fe921fb...`, `0.28125`, tablica `NPIO2_HW`; `FBM_DEFAULT_OCTAVES = 4` (domyslny argument weba).
- wartosci kalibracyjne -> `data/derived/mapgen-core-params.json` (klucze: `earth.granica_grywalna`, `polarny_ocean_wiersze_ref`, `polarny_ocean_wysokosc_ref`, `polarny_ocean_limit_proc`, `polarny_ocean_min_wiersze`, `prog_szablonu_ladu`, `podprobkowanie_progi/domyslne`, `prog_ulamka_ladu_progi/domyslny`; `klimat.polarny_proc`, `pustynia_pol_wiersze`, `rowniny_pol_proc`, `bufor_proceduralny_proc/min_wiersze`, `las_prog_wrogi`, `las_umiarkowany_delta`) i dane maski -> `data/derived/earth-land-mask.json`. Parser: `src/data/derived.rs` (dopisek na koncu, `deny_unknown_fields`, `OnceLock`).
- testy ksztaltu (`p6_m01_params_shape.rs`) NIE pinuja tych liczb; pinuje je tylko zrodlo weba w testach wektorowych (zmiana liczby balansu zmienia wynik wzgledem weba - to zamierzona detekcja driftu od weba, zob. M19-M23 w §6, a nie "pin wartosci" w tescie ksztaltu). `params_floats_are_parsed_exactly_from_the_raw_json_text` pilnuje pulapki `serde_json` bez `float_roundtrip` (1 ulp).

## 6. Mutacje (wykonane, nie odlozone)

`mutate.py`: 25 mutacji (kod `prims.rs`, dane JSON, `map_generator.rs`), po kazdej `cargo test` na 4 plikach `p6_m01_*`; plik zawsze przywracany. Przebieg 1 (`mutacje-przebieg1.log`): 22 wykryte, 2 niewykryte (M11-stara, M12-stara) i 1 blad wzorca (M25 po `rustfmt`); przebieg 2 (`mutacje-przebieg2.log`): po zastapieniu M11/M12 i naprawie wzorca M25 - 3/3 wykryte. Lacznie 25/25 mutacji wykrytych (M01-M10, M13-M24 w przebiegu 1; M11, M12, M25 w przebiegu 2).
Dwie mutacje odrzucone jako ROWNOWAZNE (nie do wykrycia przy tych danych, z dowodem): (a) `v >= 0.45` -> `v > 0.45` w `sample_earth_template_land`: roznica tylko dla `v` rownego dokladnie `double(0.45)`, a `v` jest kombinacja dwuliniowa bitow z `tx = fx - x0` o ziarnistosci ulp - nieosiagalne dla realnych `nq/nr`; (b) zmiana przycinania `bitAt` (`H-1` -> `H-2`): wiersze 398 i 399 maski sa identyczne, a wiersze 0-2, kolumny 0 i 719-718 maja 0 jedynek (skrypt w sesji; weryfikowalne `grep`em po `EARTH_MASK_ROWS`) - brzeg to zawsze morze, wiec zachowanie przycinania jest nieobserwowalne.
Wykryte m.in.: stala mulberry, Fisher-Yates, `std cos` zamiast fdlibm (M03), saturacja zamiast `ToInt32` (M04), dzielenie calkowite `height/2` (M07), granice klimatu (M08), `floor` zamiast `round` (M09), limit polarny (M10), zly skladnik dwuliniowy (M12), progi hex/maski (M13-M14), znak delty lasu (M15), `None` w pustyni (M16), kolejnosc kierunkow (M17), dane JSON (M19-M24), delegowanie `HexCoord::distance` (M25).

## 7. Tabela bylo/jest i zmiany testow

| miara | bylo (453c3c79) | jest |
|---|---|---|
| testy `cargo test` | 595 | 635 (+40 nowych, 0 usunietych, 0 oslabionych) |
| `prims.rs` | 3 linie (szkielet) | 633 LOC |
| `map_generator.rs` | 1546 LOC; maska RLE jako literal; stale klimatu/maski w kodzie | 1236 LOC; dane w `data/derived/*.json`; arytmetyka w `prims` |
| `cos` | glibc, 91/4500 rozbieznych o 1 ulp | fdlibm = V8, 0 rozbieznosci |
| wektory z weba dla rdzenia | ~10 punktow, tolerancja `1e-15` | ~268 000 porownan, bity f64 |

Zmiany w istniejacych testach: (1) `src/domain/map_generator.rs` (testy jednostkowe) - wylacznie `use super::prims::value_noise_2d;` (treść testow bez zmian, zachowują tolerancje 1e-15 i wartosci); (2) `tests/p6_m00_skeleton.rs` - patrz §8 odstepstwo 1. Nowe: `tests/p6_m01_prims.rs` 14, `p6_m01_earth_mask.rs` 10, `p6_m01_climate.rs` 7, `p6_m01_params_shape.rs` 9.

## 8. Allowlista i odstepstwa

Zmienione/nowe pliki (`git status`): `src/domain/map_generator.rs`, `src/domain/mapgen/prims.rs`, `tests/p6_m01_*.rs`, `tests/p6_m01_vectors/web-vectors.json`, dokument ten, `dyspozycje/autobot/runs/R-RUSTPORT-P6-M01-RDZEN-WERYFIKACJA-Q1/**` (allowlista) oraz:
1. **ODSTEPSTWO: `tests/p6_m00_skeleton.rs`** (poza allowlista). Test `files_exist_and_are_empty_doc_only` wymaga, by KAZDA linia kazdego pliku szkieletu zaczynala sie od `//!`; wypelnienie `prims.rs` (wymagane przez dispatch) musi go zlamac. Minimalna zmiana: stala `FILLED_BY_OWNER_TOPIC = ["src/domain/mapgen/prims.rs"]`, dla plikow z listy test pomija warunek "tylko `//!`" (zachowuje sprawdzenie obecnosci ID tematu). Pozostale testy szkieletu bez zmian. Kolejne tematy M* beda dopisywac swoje sciezki do tej listy (konflikty addytywne - do rozstrzygniecia przez orkiestratora). Alternatywa: zostawic test czerwony - sprzeczna z bramka `cargo test` EXIT=0.
2. **Rozszerzenie: nowe pliki danych** `data/derived/mapgen-core-params.json` i `data/derived/earth-land-mask.json` (dispatch wymaga tabel `data/derived/*.json` + parsera w `data/derived.rs`; `data/derived.rs` - dopisek na koncu pliku, zgodnie z dispatchem).
Bez zmian: `bridge.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `domain/mod.rs`, `rng.rs`, `mapgen/types.rs`. Nie commitowano `Cargo.lock` ani `target`.

## 9. Bramki

Surowe, pelne logi w runie: `gate-fmt.log` (`cargo fmt --check`, EXIT=0), `gate-clippy.log` (`cargo clippy --all-targets -- -D warnings`, EXIT=0), `gate-test.log` (`cargo test`, EXIT=0, 635 testow, 0 niepowodzen), `gate-diffcheck.log` (`git diff --cached --check`, EXIT=0), `verify-m01-web.log` (0 rozbieznosci / 268 185 sprawdzen). Build: `CARGO_INCREMENTAL=0`, wlasny `CARGO_TARGET_DIR`, `CARGO_PROFILE_DEV_DEBUG=0`; katalog usuniety po zakonczeniu.

## 10. Odtwarzanie

```
git archive edb8fb56 gra/src gra/data | tar -x -C <KORZEN>          # poza repo
node --experimental-transform-types --import ./gen-loader-register.mjs ./gen-m01-web.mjs <KORZEN> web-vectors.json
python3 -I verify-m01-web.py <KORZEN> web-vectors.json <rust-port/engine>
python3 -I mutate.py <rust-port/engine> <CARGO_TARGET_DIR>          # mutacje
```
