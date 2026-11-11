# P6-REPIN-EKONOMIA-CERAMIKA-GARNCARSTWO — tabela dryfu i stan po REPIN (runda 2)

TEMAT: R-RUSTPORT-REPIN-EKONOMIA-CERAMIKA-GARNCARSTWO-Q1 · RUNDA 2/5 · DOMAIN: GAME (RUST)
BAZA RUST: `origin/rust-port/parity-v2` = `43f4064b0` · BAZA WEB (pin): `origin/main` = `638e90bea` (FALA <= 606).
Uwaga: `origin/main` w czasie pracy wskazywal juz `f14894c61`; REPIN liczony wzgledem pinu z dispatchu (638e90bea).

Legenda: ZMIERZONO = wynik grepa/odczytu pliku z podanego commita; ZAŁOŻENIE = luka przyjeta do akceptacji.

## 1. Mechanizmy

| # | Mechanizm | Web 638e90bea (plik:linia) | Rust przed (43f4064b0) | Rust po (ten temat) | Test / status |
|---|---|---|---|---|---|
| 1 | Domyslny wspolczynnik utrzymania surowcowego | `gra/src/game/economy-upkeep.ts:688` `DEFAULT_BUILDING_RESOURCE_UPKEEP_RATIO = 1` | brak (stala 5.0 w `turn_economy.rs:1675`) | `turn_economy.rs:1681` `DEFAULT_BUILDING_RESOURCE_UPKEEP_RATIO = 1.0` | `p6_8e_upkeep_p2::building_resource_upkeep_matches_web` ZGODNE |
| 2 | Model proporcjonalny: per typ z `koszt_surowce` = floor(surowe utrzymanie Pieniadza(poziom) x ratio) | `economy-upkeep.ts:716–748` `buildingResourceUpkeep` | `turn_economy.rs:1687–1700` stala 5 szt./typ (DRYF, ZMIERZONO) | `turn_economy.rs:1723` `building_resource_upkeep(building, level, ratio)`; surowe utrzymanie `:1703` | ZGODNE (wektory z webu 638e90bea, 792 przypadki) |
| 3 | Stala ilosc `utrzymanie_surowce` (ceramika 2) | `gra/data/buildings.json:406` (port), `:553` (spichlerz_ii), `:906` (akwedukt), `:2099` (laznia_publiczna) | brak pola w rekordzie | `data/buildings_tech.rs:113` (`UtrzymanieSurowce`), galaz w `turn_economy.rs:1723`, mapowanie `turn_economy_tick.rs:121` | `p6_repin_ekonomia_ceramika_data::utrzymanie_surowce_ceramika_2_only_on_four_buildings` ZGODNE |
| 4 | Wspolczynnik z danych | `gra/data/econ-params.json:425` `budynki.utrzymanie_surowce_wspolczynnik` (1/1/1) | brak klucza | `rust-port/engine/data/econ-params.json` (grupa `budynki`); pole `economy_society.rs` `EconParamsBudynki`; odczyt `turn_economy.rs:1685` | `p6_8e_upkeep_p2::read_building_resource_upkeep_ratio_matches_web` ZGODNE |
| 5 | Garncarstwo: piate po czterech podstawach | `gra/data/tech.json` (Garncarstwo: Poziom 1, Koszt nauki 40, prereq `Obróbka drewna + Rolnictwo + Łowiectwo + Oswojenie zwierząt`) | `data/tech.json:26–39`: Poziom 2, prereq `—` (DRYF) | `data/tech.json` = bajtowa kopia webu | `p6_repin_ekonomia_ceramika_data::garncarstwo_fifth_basic_tech_after_four_basics` ZGODNE |
| 5a | Koszt Garncarstwa | web: 40 PN (`tech.json`; decyzja #195 = 40) | — | 40 | ZAŁOŻENIE: dispatch podawal „koszt 5 PN” — niezgodne z webem i z decyzja #195; przyjeto 40 |
| 6 | Ha'amonga: martwe bonusy lowie_rybackie / laka | web `gra/data/wonders.json` — brak `bonusy.teren` | `data/wonders.json:264–267` (dwa wpisy) | `data/wonders.json` = bajtowa kopia webu | `p6_repin_ekonomia_ceramika_data::haamonga_has_no_dead_terrain_bonuses` ZGODNE |
| 7 | Dane budynkow/tech/cudow | `gra/data/buildings.json`, `tech.json`, `wonders.json` @638e90bea | rozjechane (data/*.json, 271/70/17 linii diffu) | bajtowa kopia (zgodnie z istniejacym trybem z REPIN-DANE-20261029 §1) | patrz sekcja 3 (testy czerwone poza allowlista) |
| 8 | Sygnatury podgladu owner | `economy-upkeep.ts:794`, `:965` (ratio jako OSTATNI argument) | — | `preview_owner_*` przyjmuje `ratio` (przed `units`/closure) | ZAŁOZENIE: kolejnosc argumentow Rust != web (semantyka ta sama) |

## 2. Dryf poza tym tematem (NIE_ZMIERZONO w tej rundzie, zostaje do kolejnych tematow)

- `rust-port/engine/data/derived/*.json` (np. `research-costs.json`, `building-gold-upkeep.json`, `building-work-states.json`) nie regenerowane z nowych danych.
- Koszty technologii web (np. Gospodarka wodna 72→180, Garncarstwo) — tabela badan Rust jeszcze stara.
- Liczba budynkow web: 43 (Rust testy pinowe nadal 42).

## 3. Testy po zmianie (cargo test, CARGO_INCREMENTAL=0)

- Zielone: `p6_8e_upkeep_p2` (13/13 + nowy `read_building_resource_upkeep_ratio_matches_web`), `p6_repin_ekonomia_ceramika_data` (4/4), lib (22/22), `p6_m12_compute` (12/12) i pozostale binarki bez zmian.
- Czerwone poza allowlista (18 testow, 10 binarek; przed zmiana wszystkie zielone): `data_buildings_tech` (2), `data_compliance` (5), `derived_values` (2), `p6_1b_playerstate` (2), `p6_7b_cost` (1), `p6_7b_tables` (1), `p6_adv_q5_tick` (2), `p6_adv_q6_wire` (1), `p6_empirefood_e2e` (1), `p6_order_lane` (1). Przyczyna: pinowane liczby/identyfikatory oraz dane derived ze starego pinu.
