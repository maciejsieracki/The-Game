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
- Z-4: `targetLandFraction = NaN` -> brak zmian (web: porownania z NaN falszywe). Testowane wektorami NaN (runda 2:
  `apply_nan_target_changes_nothing`, `rebalance_nan_target_matches_web`; NaN zapisany w JSON jako string).
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

- Bazowy generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A5-LAD-MORZE-ULAMEK-Q1/gen-m06a5-landfrac-vectors.mjs`
  (seed `20261031`) -> `rust-port/engine/tests/p6_m06a5_vectors/landfrac-vectors.json` (~0.8 MB), testy
  `tests/p6_m06a5_landfrac.rs` (5 testow, 510 przypadkow; nietkniete w rundzie 2).
- Generator rundy 2 (domkniecie zarzutow): `gen-m06a5-landfrac-edge-vectors.mjs` (seed `20261101`, oczekiwania
  z uruchomionego weba, pin `edb8fb56`, instrumentacja tylko w kopii archiwum repo w katalogu tymczasowym poza repo)
  -> `rust-port/engine/tests/p6_m06a5_vectors/landfrac-edge-vectors.json` (~1.0 MB), testy
  `tests/p6_m06a5_landfrac_edge.rs` (7 testow).
- Przypadki brzegowe rundy 2:
  - NaN: `apply_nan` 8, `rebalance_nan` 8.
  - Granica `tolerancja_score_sortowanie` (web `Math.abs(sb-sa) > 0.04`): jawne pary bez RNG (`apt_x_*`, 4 przypadki):
    `0.0/0.04` i `0.04/0.0` (roznica f64 == 0.04 dokladnie, remis -> kolejnosc wstawiania), `0.0/0.0399` (remis),
    `0.0/0.0401` (galaz score). Wynik zalezy od galezi, wiec `>` vs `>=` i progi 0.0399/0.0401 daja inna mape.
    Dodatkowo 60 losowych przypadkow z `TIE_VALUES` (0.0/0.0399/0.04/0.0401/0.11/0.15/0.5).
  - Brakujacy klucz w `landScores` (web `?? 0`): `apply_missing` 40, `sort_missing` 30.
  - Progi clamp 0.15/0.85 i sasiedzi 0.1499/0.1501/0.8499/0.8501 (`apply_clamp`, 60; mapy dobrane tak, ze
    `Math.round(t*clamp)` rozni sie miedzy wartosciami progowymi).
  - Okno `tolerancja_odleglosci_centrum` (0.015): `sort_tol_centrum`, 12 par o tym samym brzegu, |ca-cb| w (0.015, 0.0151]
    i (0.0149, 0.015].
- Stale progi JSON maja mutacje zabijane wektorami (patrz pomiary), z wyjatkiem `pangea_min_score_wypelnienia` (ponizej).
- Limity: oba pliki wektorow < 10 MB (cel 8 MB).
- Wynik: wszystkie przypadki zgodne z webem, 0 rozbieznosci; testy bazowe 5/5, edge 7/7.

## Pomiary i domkniecie zarzutow (runda 2, Operator-obrona)

Dowody w run dir `R-RUSTPORT-P6-M06A5-LAD-MORZE-ULAMEK-Q1/`: `mutations-r2-obrona.log` (46 mutacji, `RESTORE-OK`),
`gate-fmt-r2obrona.log`, `gate-clippy-r2obrona.log`, `gate-test-r2obrona.log`, `mut-r2.py`,
`gen-m06a5-landfrac-edge-vectors.mjs`. Pomiary r2 (`mutations-r2.log`, `02-operator-pomiary-r2.md`) sa historia.

- Bramki (surowe logi, `EXIT=0`): fmt; clippy `--all-targets -D warnings`; test `--no-fail-fast`: 1277 passed / 0 failed
  (baza 1270 + 7 testow edge).
- Mutacje (46): 37 zabitych, 9 przezytych.
- Zarzuty z pomiaru Evaluatora (r1):
  - Z-1 (NaN): PRZYJETY. `nan-guard-off` KILLED przez `apply_nan_target_changes_nothing`, `rebalance_nan_target_matches_web`.
  - Z-2 (remis 0.04): PRZYJETY. `tol-score-ge` KILLED przez `apply_score_tolerance_boundary_matches_web` (wczesniej
    tylko przez clamp; jawne pary `0.0/0.04` daja roznice f64 dokladnie 0.04). Mutanty `json-tol-score-0.0399` / `0.0401`
    tez KILLED przez ten sam test.
  - Z-3 (brak score): PRZYJETY. `sort-default-score-1` KILLED przez `sort_missing_score_defaults_to_zero_like_web`.
  - Z-4 (progi): PRZYJETY w czesci. `json-clamp-*`, `json-tol-score-*`, `json-tol-centrum-*` KILLED przez wektory
    (`apply_clamp_thresholds_match_web`, `apply_score_tolerance_boundary_matches_web`, `sort_center_tolerance_window_matches_web`)
    oraz test stalych. `json-pangea-min-*` KILLED tylko przez `landfrac_data_matches_web_constants` (patrz nizej).
  - Z-5 (strefa wewnetrzna): ODRZUCONY jako luka wektorowa; dowod martwosci (ponizej). Wektory 23x23 nie zmieniaja wyniku.
  - Z-6 (przestarzala sekcja): PRZYJETY. Sekcja NIE_ZMIERZONO zastapiona pomiarami tej rundy.

### Klasyfikacja 9 przezytych mutacji

- EKWIWALENTNE z dowodem z kodu:
  - `grow-lt-to-le`, `erode-gt-to-ge`: przy `land == target_land` petla wzrostu/erozji konczy sie na pierwszym
    `break` (`if land >= target_land` / `if land <= target_land`) przed jakakolwiek zmiana; komparatory sortowania nie maja efektow ubocznych.
  - `interior-pass-off`, `interior-no-border-gate`, `interior-threshold-ge`, `interior-threshold-minus1`,
    `interior-sort-reversed` (5): przebieg 2 `applyLandFractionByScore` jest martwy. Szerokosc pasa oceanu
    `map_border_ocean_hexes` = 2 (`mapgen-terrain-class.json` `twardy_ocean_hex`), a `is_in_map_border` = `dist < 2`.
    `interiorOk` = `hex_border_distance > 10`; odleglosc jest calkowita, wiec `interiorOk` => dist >= 11 => `borderOk`.
    Przebieg 1 konczy sie dopiero przy `land >= target_land`, wiec gdy wchodzi przebieg 2 (`land < target_land`), wszystkie
    morza z `borderOk && maskOk` zostaly zamienione na lad, a kandydatow przebiegu 2 nie ma. Zadna mutacja w tej galezi nie zmienia wyniku.
  - `rebal-caps-enforce-swap`: `applyMarginalLandZoneCaps` i sortowanie zalezy tylko od klasyfikacji woda/lad dla pierscieni
    d >= 2; cap(d < 2) = 0, wiec kolejnosc enforce/caps nie zmienia koncowego stanu pierscieni 0-1 (ocena z r1, nie kwestionowana przez zarzuty).
- EKWIWALENTNE EMPIRYCZNIE: `sort-center-tol-ge` (zero trafien f64 `|ca-cb| == 0.015` dla siatek 1..24 x 1..24,
  `verify-m06a5-r2.log`). Brak dowodu z kodu; zarzuty go nie wskazuja.

### Stale progi i pangea_min

- `pangea_min_score_wypelnienia` (0.11) jest konsumowany tylko przez `rebalance_land_fraction_with_margins`, ktore
  wywoluje `apply_land_fraction_by_score` z `LandFractionFillBias::Center`. Galaz `mask_ok` sprawdza prog wylacznie w trybie `Mask`,
  wiec wartosc nie wplywa na wynik w partii 1. Jedyne zabezpieczenie to test stalej `landfrac_data_matches_web_constants`
  (`json-pangea-min-0.1101/0.1099` KILLED).

Zalozenia (bez pytan): luki wykryte przez Evaluatora zamkniete wektorami i testami (bez zmiany kodu `landsea.rs`).
Pliki `landsea.rs` i `mapgen-landsea-fill.json` nietkniete (`RESTORE-OK` po kazdej serii mutacji).

## Dryf po pinie (zakres 3186-4374)

`git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 1 plik, 24 wstawienia / 16 usuniec.
Hunki w liniach starych 5992-10804 (pelny diff: `drift-gen-helpers-edb8fb56-origin-main-r1.diff`).
W zakresie 3186-4374 brak zmian. Przepiecia pinu nie wykonano (zgodnie z dispatchem).

## Co nie wchodzi w ten temat

- Pozostale 8 symboli partii 2+ (lista wyzej) - osobne ID.
- Odswiezenie wektorow po przepieciu pinu - osobny temat (po R-RUSTPORT-REPIN-DELTA-Q1).
- Zmian w `relief.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `renderer/**`, `src-tauri/**`.
