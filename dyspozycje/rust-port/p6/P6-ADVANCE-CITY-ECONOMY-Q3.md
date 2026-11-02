# P6-ADVANCE-CITY-ECONOMY-Q3 — utrzymanie Pracy, parametry P5, zdrowie i woda ticku ekonomii

Temat: `R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q3-Q1` (dlug `-Q3` z `P6-ADVANCE-CITY-ECONOMY.md`). Pin weba `4bbef081d`
(`gra/src/game/turn-economy.ts`), baza Rust `ad99ca68e` (`rust-port/parity-v2`).

## 1. Zakres i numeracja

Numeracja -Q3/-Q4/-Q5 ujednolicona w `P6-ADVANCE-CITY-ECONOMY.md` (tabela sek. 2 + sek. 4): `-Q3` = P4, P5, P10
(`loadHealthParams`), P16; `-Q4` = petla miast (P12, P17, P18, P19, P20); `-Q5` = P23 + wiazanie z `ai_turn`.
P16 NIE zalezy od P17: zdrowie jest wejsciem `toEconomyCity` (web `:2524-2527` liczy, `:2536` przekazuje).

## 2. Tabela plastrow

| Web (pin) | Rust | Status |
|---|---|---|
| P4 `computePracaUpkeepByOwner` `:917-945` (+ `loadResourceImprovementUpkeepCost` `:900-906`), wolane `:2320` | `turn_economy_upkeep.rs compute_praca_upkeep_by_owner`, `load_resource_improvement_upkeep_cost` | zaportowane |
| P5 `loadUpkeepParams`/`loadStorageParams`/`buildRationParams`/`buildUnitUpkeepTable` `:2323-2329` | `turn_economy_upkeep.rs load_advance_upkeep_params` (WOLA istniejace `economy_upkeep_p1/p2`, `growth_v85`), `unit_rows_from_json_str` (kolejnosc kluczy) | wolane z nowej funkcji |
| P10 `loadHealthParams` `:377-413` (wolane `:2421`) | `turn_economy_health.rs load_health_params`, `HealthParams::osiedle_pop_bonus` | zaportowane |
| P16 `cityHasWaterAccess` `:420-445`, `scanCityVicinityTerrain` `:356-372`, `computeCityHealth` `:456-519` (wolane `:2519-2527`) | `city_has_water_access[_in]`, `scan_city_vicinity_terrain`, `compute_city_health` | zaportowane |
| wiazanie ticku `:2320`, `:2323-2329`, `:2421`, `:2519-2527` | `turn_economy_advance.rs advance_city_economy_upkeep_health` (addytywnie; istniejace sygnatury bez zmian, tylko `pub(crate)` dla `raw_row_from_value`, `difficulty_enum`) | wpiete |

Wejscie: `&[state::City]`, `TerrainContext`, wynik fazy zasobow (`AdvanceResourceOutcome::per_city` — stan Spichlerza),
`society-params.json`, wiersze `units.json`. Wynik: `pracaUpkeepByOwner`, parametry P5, `HealthParams`, `zdrowie` per miasto.

## 3. Wektory i dowody

* `tests/p6_adv_q3_vectors/q3.json` (3.6 MB <= 6 MB) z URUCHOMIONEGO, prawdziwego `advanceCityEconomy` i
  eksportowanych funkcji (esbuild 0.21.5 w `mktemp`-podobnym katalogu, zrodla z czystego `git archive 4bbef081d
  gra/src gra/data`, ZERO buildu/dev w `gra/`; instrumentacja tylko w pamieci: zrzut parametrow P5/P10 i eksport
  `computeCityHealth`/`loadHealthParams`). Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q3-Q1/gen-p6-adv-q3-vectors.mjs`.
* 666 scenariuszy tickowych (360 losowych; 120 brzegow `hedge` pop 0..9 x trudnosc x budynki wodne; 30 `hfrac`
  ulamkowych populacji; 90 `las` — las w dystansie 0..9 x pop 1..9; 51+15 brzegow kosztu Pracy `upk` — koszt 0, 0.24/0.25/
  0.26, 0.49/0.5/0.51, ..., ujemny, napis, brak wiersza/grupy, wiersz-napis/tablica; mnozniki epoki 1/2/4), 90 `directPraca`
  (fort/posterunek/`order`), 900 `hdirect` (`computeCityHealthBreakdown`, `cityHasWaterAccess`: uszkodzone `societyRaw`,
  ulamkowe/nieskonczone `q,r`, bez kontekstu mapy), 128 `hparams` (`loadHealthParams` x 4 trudnosci w tym nieznana),
  700 `hfull` (`computeCityHealth` z bonusem Spichlerza i nadwyzka Garncarni), 80 `hriver` (jedno-/kilkuheksowe
  `riverPaths`, miasto na sciezce), 160 `p5direct` (uszkodzone `econ-params`), 120 `unitDirect` (uszkodzone wiersze `units.json`).
* Test Rust `tests/p6_adv_q3_pipeline.rs` (10 testow, porownanie BITOWE `f64`): wszystkie klasy powyzej.
* Weryfikator `python3 -I` (`verify-p6-adv-q3.py`, wynik `verify-output.txt`): 0 rozbieznosci, niezaleznie z TEKSTU weba:
  upkeep Pracy (666 + 90), zdrowie (1187 miast bez Spichlerza; 525 ze Spichlerzem pominiete), `hdirect`, `hparams`,
  `hfull`, `hriver`, P5 (160) i tabela jednostek ze `scaleCostByEpoch` (120). NIE liczone niezaleznie: zdrowie ze
  Spichlerzem w scenariuszach tickowych (bonus zalezy od drenazu; pokrywa je `hfull` + test Rust), runtime-bramka budynkow.

## 4. Zalozenia

* `hasBagno` (`:367`) jest nieosiagalne: `TenBazowy` (`types/hex.ts:12-24`) ma 8 wartosci bez `bagno`, `TerrainType` Rust tak samo; port: `false`.
* `q/r` miasta nieoznaczajace calkowitego heksa (ulamkowe, NaN, poza `i32`) nie trafiaja w zaden klucz `"q,r"` -> woda `false`, skan pusty (jak web; wektory `hdirect` z `0.5`, `1e21`, `NaN`).
* Trudnosc spoza `easy|normal|hard`: zdrowie jak web (same fallbacki, wektory `weird`); P5 uzywa istniejacego `difficulty_enum` (nieznana -> `normal`; nieosiagalne, web ma typ `Difficulty`).
* `data.econParams` zawsze podane (`None` -> same fallbacki).
* `hex_like_of` skopiowane lokalnie (wersja z `turn_economy_territory.rs` jest prywatna, plik poza allowlista).
* **Domkniecie NIE_ZMIERZONO z -Q2A (ulamkowe `q/r` miasta, adapter `as i32`)**: web tworzy miasta wylacznie przez `foundCity`/`foundCityAt`
  (`cities.ts:1235-1260`, `:1269-1290`), a oba wolaja `canFoundCity`, ktore odrzuca `!(\`${q},${r}\` in map.hexes)` (`cities.ts:1181-1183`);
  klucze `map.hexes` sa calkowite (`mapSnapshot.ts:320`, petle generatora po calkowitych `q,r`), wiec `City.q/r` z fundacji sa calkowite
  i `as i32` jest bezstratne. NIE_ZMIERZONO: miasta wczytane z zapisu poza `foundCity*` (poza zakresem).

## 5. Mutacje

93 mutanty (`mutate.py`: 29 w `turn_economy_upkeep.rs`, 45 w `turn_economy_health.rs`, 19 w wiazaniu `turn_economy_advance.rs`):
zabite 80, rownowazne 13, przezyli nierownowazni 0. Netto 100%, brutto 86.0% (ekwiwalenty z dowodem dopuszczone dispatchem).
Wyniki: `mutacje-wynik.txt`. (1. przebieg: `H22` — usuniecie sprawdzenia heksu miasta na `riverPaths` — przezyl, bo losowe sciezki
mialy >= 2 sasiednie heksy; zamkniete klasa `hriver` z jednoheksowymi sciezkami i miastem na sciezce.)

Rownowazne (dowod plik:linia):
* U01 brak zewnetrznego `max(0, koszt)` oraz U02 brak wewnetrznego `max(0, ..)`: web `:917-945` ma OBA zacisniecia; przy jednym wynik jest ten sam (koszt < 0 -> `round(<=0)` -> wewnetrzne `max` daje 0; koszt >= 0 i mnoznik > 0 -> `round >= 0`).
* U04 brak wczesnego `continue` dla pustych kluczy: `turn_economy_upkeep.rs` petla `for key in &imp_keys` jest pusta, `upkeep` = 0, `if upkeep > 0.0` falsz.
* U09 `round()` zamiast `js_round`: argument >= 0 (koszt zacisniety >= 0, mnoznik > 0); roznica (polowki ujemne) nieosiagalna.
* U26 `UnitCell::Null` -> `Other`: `build_unit_upkeep_table` (`turn_economy.rs:2001-2025`) czyta `Jednostka` (tylko `Text`), `Utrzymanie*` (tylko `Num`) i `epoch_of` (`:1992`, `_ => Other`) — `Null` i `Other` traktowane identycznie (rozne dopiero w `build_unit_food_table`, `:2089`).
* H16 brak `is_finite()`: `serde_json::Number::as_f64` z JSON nigdy nie jest `NaN`/`Inf`.
* H17/H18 brak `is_object()`: `serde_json::Value::get(&str)` na nie-obiekcie zwraca `None` (web: `zd[key]` na napisie/tablicy = `undefined`).
* H33 `>=` zamiast `>` dla zageszczenia: przy rownosci skladnik `kara * 0` = ±0 i nie zmienia `z` (`z` startuje od +0.0).
* H42 brak `truthy(osiedle)`: wartosc z JSON skonczona; dodanie 0/-0 nie zmienia sumy.
* H45 brak `break`: tylko optymalizacja (`has_las` raz ustawione).
* W16 `built_ids` zamiast `runtime`: wektory wolaja bez resolvera etykiet (web `:1670` zwraca `builtIds`); z resolverem bramka usuwa tylko budynki z `DEPOSIT_LINKED_BUILDING_LABELS` (`building-resource-gate.ts:64-76`: garncarnia, cegielnia, spichlerz_ii, stolarnia, kamieniarski, kuznia, odlewnia_brazu, mennica), a zdrowie czyta wylacznie `studnia`/`targowisko`/`akwedukt`/`laznia_publiczna`.
* W18 `ceramika_active`/`sol_active` = false: `spichlerz_health_bonus` (`building_costs.rs:1447-1455`) czyta tylko `ma_spichlerz_pop`/`ma_spichlerz_ii_pop`.

## 6. Bramki (logi `gate-*.txt`, kazdy z jedna linia `EXIT=`)

* `cargo fmt --check`, `cargo clippy -j 2 --all-targets -- -D warnings`, `git diff --check` (po `git add -N`): EXIT=0.
* PELNY `cargo test -j 2 --no-fail-fast` PO ostatniej zmianie kodu/testow: lib 22 + shardy s0-s4 (389/401/469/418/351) = 2050 passed / 0 failed.
  PRZED: 2040 / 0 na `ad99ca68e` (log Final Control `-Q2A-Q1/03-final-control.md`); roznica +10 = 10 nowych testow tego tematu.
  PRZED nie zmierzone ponownie w tym worktree (NIE_ZMIERZONO; zgodnosc 2040 + 10 = 2050 co do sztuki).

## 7. Dlug

* Petla plonow miast (P17), korupcja (P12), Wealth/`splitPraca`/handel (P18), oblezenie/wzrost (P19), manpower per miasto (P20) — `-Q4`.
* Utrzymanie per owner (P23) i wiazanie z `ai_turn`/`turn_economy.rs` — `-Q5`; wiazanie z petla gry NIE_ZMIERZONO.
