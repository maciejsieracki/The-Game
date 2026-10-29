# P6.M06A5 - lad / morze: rodzina ulamka lądu, partia 1

**Temat:** R-RUSTPORT-P6-M06A5-LAD-MORZE-ULAMEK-Q1 (runda 1, Operator-impl).
**Pin webu:** `edb8fb56` (`git archive edb8fb56 gra/src gra/data`, rozpakowane poza repo).
**Baza Rust:** `rust-port/parity-v2` (`origin/rust-port/parity-v2`, zawiera M06A/A2/A3/A4).
**Kontekst:** wzorzec M06A (`P6-M06A-LAD-MORZE-WYBRZEZE-A.md`), M06A4 (`P6-M06A4-LAD-MORZE-RESZTA.md`),
M05B (`P6-M05B-RELIEF-B-POKRYCIE-PASMA.md`).

## Zakres partii 1 i status (binarne kryterium)

| Symbol web (pin edb8fb56) | Status | Implementacja Rust | Dowod |
|---|---|---|---|
| `assignContinentIndices` :3186 | PORTOWANY | `landsea::assign_continent_indices` (zwraca pary w kolejnosci wstawiania) | `tests/p6_m06a5_landfrac.rs::assign_continent_indices_matches_web`, 40 przypadkow |
| `sortLandKeysForErosion` :3207 (prywatna) | PORTOWANY | `landsea::sort_land_keys_for_erosion` (+ `js_array_sort_by`, TimSort V8) | `sort_land_keys_for_erosion_matches_web`, 120 przypadkow; wektory z kopii webu z eksportem wylacznie w kopii |
| `LandFractionFillBias` :3435 | PORTOWANY | `landsea::LandFractionFillBias` (enum `Center`/`Mask`) | uzyte w `apply_*` i `rebalance_*` |
| `PANGEA_LAND_FILL_MIN_SCORE` :3438 + progi :3453, :3222, :3484 | PORTOWANY (dane) | `data/derived/mapgen-landsea-fill.json` + `data::derived::mapgen_landsea_fill()` | `landfrac_data_matches_web_constants` |
| `applyLandFractionByScore` :3444 | PORTOWANY | `landsea::apply_land_fraction_by_score` | `apply_land_fraction_by_score_matches_web`, 260 przypadkow |
| `rebalanceLandFractionWithMargins` :3532 | PORTOWANY | `landsea::rebalance_land_fraction_with_margins` (2 przebiegi + `apply_double_coast_ring` na koncu) | `rebalance_land_fraction_with_margins_matches_web`, 90 przypadkow |

Symbole zakresu z listy dispatchu, poza partia 1 (osobne ID, RUNDA-2 do czasu ich tematow):
`erodePangeaBboxLowScoreRim` :3551, `carvePangeaLongSideGulfs` :3606, `rebalanceLandFractionPangea` :3667,
`applyLandFractionByContinent` :3701, `rebalanceLandSeaRatio` :3791, `pangeaAnnularMaxCorridorWidth` :4329,
`groupDryLandMassKeys` :4338, `isPangeaBridgeWater` :4371.

Zaleznosci przeniesione z innych modułow (bez zmian w nich): `apply_marginal_land_zone_caps`,
`enforce_map_border_ocean`, `hex_border_distance`, `map_center_distance_norm`, `map_margin_land_zone_hexes`
(`terrain_class.rs`); `js_array_sort_by` (`cluster_mass.rs`); `js_round` (`improvements.rs`);
`nearest_continent_zone_index`, `ContinentCenter` (`masks.rs`); `locale_compare` (`recruitment::manpower`).
`MarginZoneHooks` dostal pierwsza implementacje (`LandseaMarginHooks`, prywatna w `landsea.rs`) delegujaca do
`sort_land_keys_for_erosion`.

## Zalozenia (rozstrzygniete bez pytan)

- Z-1: Klucze `"q,r"` sa kanoniczne (jak w M06A). Niekanoniczny klucz w komparatorze = `(0,0)`.
- Z-2: `Object.keys` = kolejnosc wstawiania (`HexRecord`). Wynik `assign_continent_indices` = `Vec` w tej
  kolejnosci (web `Map`); konsumenci wymagajacy lookupu buduja mape sami.
- Z-3: `width ?? 1` w sortowaniu: `dims = None` -> `(1,1)`; `Some((0,h))` -> szerokosc 0 (jak web, `??` nie lapie 0).
- Z-4: `targetLandFraction = NaN` -> brak zmian (web: porownania z NaN falszywe). Nie testowane wektorem (JSON bez NaN).
- Z-5: Mapy wartosci balansowych (0.15/0.85, 0.11, 0.04, 0.015) sa w JSON; kod nie zawiera tych literalow.
  Literal `0.0`/`1` (domyslne score i wymiary) pozostaje jako semantyka `?? 0`/`?? 1` z webu.

## Mechanika JS, ktora trzeba bylo odtworzyc

- `Array.prototype.sort` z komparatorami niekoherentnymi (tolerancje 0.015 / 0.04 / 0.02) -> wynik zalezy
  od algorytmu. Uzyto `js_array_sort_by` (TimSort V8, z M10). Bez tego wektory by sie rozjechaly.
- `Math.round` -> `js_round` (polowki w strone +inf); test wektorowy: `target = (k+0.5)/total` (remisy).
- `Math.max(0.15, Math.min(0.85, t))` -> `f64::clamp` (dla skonczonych `t` identyczne; NaN -> Z-4).
- `a.localeCompare(b)` (tryb `Mask`, remis score) -> `recruitment::manpower::locale_compare` (tabela ASCII).
- `Math.abs`, `Math.sqrt` (`map_center_distance_norm`), `Math.hypot` (`nearest_continent_zone_index`):
  zob. wykaz nizej.

## Wykaz `Math.*` w zakresie partii 1

| Miejsce (Rust) | Funkcja JS | Implementacja |
|---|---|---|
| `landsea::apply_land_fraction_by_score` | `Math.max/min` (clamp), `Math.round`, `Math.abs` | `f64::clamp`, `js_round` (`improvements.rs`), `f64::abs` |
| `landsea::sort_land_keys_for_erosion` | `Math.abs` | `f64::abs` |
| `terrain_class::map_center_distance_norm` (istniejace) | `Math.sqrt` | `f64::sqrt` |
| `masks::nearest_continent_zone_index` (istniejace) | `Math.hypot` | `js_hypot` (masks.rs) |
| `terrain_class::hex_border_distance` (istniejace) | `Math.min` | `js_min` |

Jadra `k_sin/k_cos/rem_pio2` i `masks::v8math` nie byly dotkniete.

## Wektory i testy

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A5-LAD-MORZE-ULAMEK-Q1/gen-m06a5-landfrac-vectors.mjs`
  (loader: `m06a-loader-register.mjs`; seed `20261031`).
- Plik: `rust-port/engine/tests/p6_m06a5_vectors/landfrac-vectors.json` (~0.8 MB; limit 10 MB).
- Liczba przypadkow: apply 260, sort 120, rebalance 90, assign 40.
- Granice zawarte w wektorach: cel `0.149999/0.15` i `0.850001/0.85` (clamp), remisy `Math.round`
  (`(k+0.5)/total`), score rowne progom (siatka 0.01, w tym 0.11 i roznice 0.04), zgodnosc `dims` (brak / `[w,0]` / `[w,h]`).
- Wynik: 510/510 przypadkow zgodnych z webem, 0 rozbieznosci.
- NIE_ZMIERZONO w tej rundzie: pelna macierz N-1/N/N+1 dla kazdego porownania `<`/`<=`/`>=`, mutacje strukturalne,
  dowody rownowaznosci i pomiar trafien na granicach. To zakres Operator-pomiary (runda 2 tego tematu).

## Dryf po pinie (zakres 3186-4374)

`git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 1 plik, 24 wstawienia / 16 usuniec.
Hunki w liniach starych 5992-10804 (pelny diff: `drift-gen-helpers-edb8fb56-origin-main-r1.diff`).
W zakresie 3186-4374 brak zmian. Przepiecia pinu nie wykonano (zgodnie z dispatchem).

## Co nie wchodzi w ten temat

- Pozostale 8 symboli partii 2+ (lista wyzej) - osobne ID.
- Odswiezenie wektorow po przepieciu pinu - osobny temat (po R-RUSTPORT-REPIN-DELTA-Q1).
- Zmian w `relief.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `renderer/**`, `src-tauri/**`.
