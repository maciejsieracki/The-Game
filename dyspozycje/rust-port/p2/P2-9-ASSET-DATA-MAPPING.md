# P2.9 — Mapowanie danych web `gra/data/*.json` → struktury Rust (katalog faktów)

**Temat:** `R-RUSTPORT-P2-9-ASSET-DATA-MAPPING-Q1` · **Runda:** 1/5 · **Rola:** Operator (Haiku 5.5 medium)
**Status:** wynik Operatora, do Evaluatora i Final Control. Katalog faktów, NIE decyzja projektowa (decyzje w P2.2+).

**Piny:**
- web `main` = `edb8fb56` — dane czytane przez `git show edb8fb56:gra/data/<plik>`.
- Rust = `rust-port/parity-v2` = `9e33fc77` — katalog `rust-port/engine/src/domain/` (i `bridge.rs`), czytany przez `git show rust-port/parity-v2:…`.
- Pin cytowania nie oznacza zgody na kontynuację kodu z gałęzi (GOAL §0 poz. 1: `rust-port/engine` = biblioteka referencyjna).

**Metoda (dowody):**
- Lista plików: `git ls-tree edb8fb56 gra/data/` — 30 pozycji (29 JSON + `earth-mask-source.png`).
- Loader: `git grep` na `rust-port/parity-v2` po `fs::read`, `read_to_string`, `File::open`, `include_str`, `include_bytes`, `from_str` oraz nazwach plików `*.json`. Wynik: **żadnego wczytania plików `gra/data` w kodzie `src/`**. `serde_json` występuje tylko w `Cargo.toml` (dep), `bridge.rs`/`domain` (`to_string`/`from_str` na DTO) i w `tests/`. Odniesienia do `gra/data/*.json` w `src/` są wyłącznie w komentarzach dokumentacyjnych (`building_costs.rs:8,103`, `combat.rs:182`, `recruitment.rs:204`, `pathfinding.rs:228`).
- Porównanie wartości (skrypt Node, odczyt pinu, bez zapisów do repo): `buildings.json` ↔ `canonical_building_costs()` (42 rekordy), `units.json` ↔ `canonical_recruitment_costs()` (75 rekordów).

## 1. Tabela 30 plików

Legenda: **TAK** = istnieje struktura odpowiadająca plikowi; **CZĘŚCIOWO** = istnieje element domeny (część pól/parametrów), brak pełnego odwzorowania; **BRAK** = brak odpowiednika po grep-ie (nazwa + pola). Kolumna „Zgodność kluczy” podaje dowód albo listę przemianowań stare→nowe.

| # | Plik (pin `edb8fb56`) | (1) Struktura Rust (`parity-v2`) | (2) Zgodność kluczy | (3) Loader |
|---|---|---|---|---|
| 1 | `ai-params.json` | CZĘŚCIOWO — `ai_turn.rs` `ArchetypeMods` (military/science/economy/defense), `CityScoreWeights`, `AiTurnOptions` | NIE — 136 kluczy top-level brak w Ruście; klucze EN | NIE |
| 2 | `auto-battle-params.json` | CZĘŚCIOWO — `combat.rs` (`CombatInput`, `CombatResult`, straty) | NIE — brak sekcji `kalibracja`, `straty` | NIE |
| 3 | `buildings.json` | **TAK** — `building_costs.rs:17` `BuildingCost`, `canonical_building_costs()` (42 wiersze) | Przemianowane: `id`→`building_id`, `kosztBudowy`→`base_work`, `przyrostKosztu`→`work_increment`, `koszt_surowce`→`resource_cost`. **Wartości: 42/42 zgodne** (`kosztBudowy`, `przyrostKosztu`, `koszt_surowce`, klucze surowców ASCII). Pozostałe **23 z 27** unikalnych kluczy rekordów (`dajeSzczescie`, `nazwa`, `kategoria`, `grupa`, `epokaWejscia`, `maksPoziom`, `nazwyPoziomow`, `baza`, `przyrost`, `utrzymanie`, `przyrostUtrzymania`, `wymagania`, `uwagi`, `historia`, `opis`, `top3`, `techUnlock`, `upgradeFrom`, `wymaganySurowiec`, `poziomTechGate`, `lokalizacja`, `odblokowuje`, `suppressed`) — BRAK w Ruście (dowód: literał `"klucz"` w `src/`: 1 z 27, tylko `id`) | NIE (tablica hard-coded; `building_costs.rs:103` „until the data-loader boundary is introduced”) |
| 4 | `citizen-resource-upkeep.json` | BRAK | — | NIE |
| 5 | `city-names-pools.json` | BRAK pul nazw (grep `city_name`/`name_pool`: brak). Uwaga: 15 kluczy top-level to identyfikatory cywilizacji (`grecy`, `egipt`, `sumer`…), które występują jako literały w `ai_turn.rs:710-717` i `diplomacy.rs:803+` (`serde rename`) — same klucze, nie pule | — | NIE |
| 6 | `civ-ai.json` | CZĘŚCIOWO — `ai_turn.rs` archetypy AI (`ArchetypeMods`, delty archetypów ok. `ai_turn.rs:707`) | NIE — `agresywnosc`, `ekspansywnosc`, `priorytetMilitarny`… brak 1:1 | NIE |
| 7 | `civ-matrix.json` | BRAK (brak `paramDefs`, brak macierzy 93 parametrów) | — | NIE |
| 8 | `civ-params.json` | CZĘŚCIOWO — `ai_turn.rs` `ArchetypeMods` (pola `military/science/economy/defense`; `economy` ≈ `modEkonomii` jako pojęcie; **brak pola ≈ `modWzrostu`** — literał `modWzrostu`/`modEkonomii` w Ruście: 0) | NIE — `Cywilizacja`, `modWzrostu`, `modEkonomii`, `preferowaneBudynki`, `preferowaneJednostki`, `uwagi`: literał 0/2 top-level; brak 1:1 |
| 9 | `civs.json` | CZĘŚCIOWO — `diplomacy.rs` `CivilizationKind` (enum; progi zaufania hard-coded `:885-898`), `playable.rs` `PlayablePlayer` (`civ_id`, `civ_name`) | NIE — `Cywilizacja`, `Bonus startowy`, `kolorHex`, `wodzowie`, `bonusy` BRAK | NIE |
| 10 | `combat-params.json` | CZĘŚCIOWO — `combat.rs` (modyfikatory terenu/struktur jako jawne parametry) | NIE — `macierz_v2`, `tw_v3`, `counter_multiplier`, `morale_*`, `brod`, `siege_ai` BRAK | NIE |
| 11 | `counters.json` | CZĘŚCIOWO — `combat.rs:5` `CounterBonus {target_type, multiplier}`; `combat.rs:184` `counter_multiplier()` z **wbudowaną tabelą** (komentarz: „mirrors every confirmed attack counter”) | Przemianowane: `Cel (typ)`→`target_type`, `Bonus` (`"+50%"`, string)→`multiplier` (f64), `Typ atakujący`→argument `attacker_type`. BRAK: `Rodzaj (Atak/Obrona)`, `Status`. **Wartości porównane (runda 2):** 16 wpisów liczbowych ↔ `counter_multiplier()` (ta sama para atakujący→cel, mnożnik z `Bonus`: +50%→1.50, +25%→1.25, +15%→1.15): **16/16 zgodne**. 1 wpis (`Obrona`, „Atak z flanki → Falangite/Distance/Slinger”, `Bonus` „−50%”) **nie ma odpowiednika** w tabeli (`counter_multiplier` zwraca 1.0) — rozbieżność | NIE (tabela w kodzie) |
| 12 | `diplomacy-acceptance-points.json` | CZĘŚCIOWO — `diplomacy.rs:206` `DiplomacyParams` („copied from the diplomacy and acceptance-points data contracts”), np. `minor_acceptance_respect` (`:293`) | NIE — klucze EN snake_case (`traktaty`, `koszyk_pn`, `sweetener`, `fair_trade` BRAK jako sekcje) | NIE |
| 13 | `diplomacy.json` | CZĘŚCIOWO — `diplomacy.rs` `DiplomacyParams` (≈40 pól, np. `same_religion_trust_per_turn` `:240`, `technology_trust_threshold` `:245`), `DiplomaticProposal`, `UnitDefinition` (patrz wiersz 29) | NIE — `params` (132 klucze) → pola snake_case EN, przemianowane; sekcje `akcje_dyplomatyczne`, `perNacja`, `pn_relacja`, `wartosc_katalog`, `panel_sterowania` BRAK | NIE |
| 14 | `e-start-params.json` | CZĘŚCIOWO — `playable.rs` `StartGameParams`, `PlayableAdvancedParams` (`building_cost_pace`, `unit_cost_pace`, `population_growth_pace`, `world_movement_pace`, `city_limit_base`, `victory_mode`, `barbarians_level`) | NIE — sekcje `defaulty`, `skala_mapy`, `generator_e2`, `kreator_zaawansowane`, `decyzje_kanon` BRAK; `playable.rs:167` `"cityStatesCount:NOT_IMPLEMENTED"` | NIE |
| 15 | `earth-mask-source.png` | BRAK — `map_generator.rs` ma proceduralne `earth_mask()` (nie czyta PNG) | — | NIE (asset, P3.8) |
| 16 | `econ-params.json` | CZĘŚCIOWO — `city_growth.rs` `CityGrowthParams` (`growth_threshold_base`, `population_cap`, `granary_food_retention`, …) | NIE — `próg_wzrostu_wspolczynnik`, `zywnosc_jednostka_ruch`, `suwak_*` BRAK; sekcje `teren_mapa`, `handel_szlaki` BRAK | NIE |
| 17 | `epoka-ludnosc-manpower.json` | BRAK — manpower nie istnieje w Ruście (P2.1 M4) | — | NIE |
| 18 | `map-gen-params.json` | CZĘŚCIOWO — `map_generator.rs` `MapGenerator`, `WorldType`, `Mulberry32` (generator bez parametrów z pliku) | NIE — `mgla`, `gestosc`, `mapa_skala`, `deposit_rules` BRAK | NIE |
| 19 | `miasto-params.json` | CZĘŚCIOWO — `city_growth.rs` `CityGrowthParams`, `minimum_population` (`:…`), `aqueduct_population_cap` | NIE — 26 kluczy (koszty, regeneracja manpower, oblężenie, odległości) w większości BRAK | NIE |
| 20 | `power-params.json` | BRAK (`power`/`power-ranking` są w web M7 i nie mają odpowiednika) | — | NIE |
| 21 | `resources.json` | CZĘŚCIOWO — `improvements.rs` `Deposit`, `ImprovementKey`; `resource_production.rs` `ResourceKey`, `ResourceYield`; surowce jako stringi (`drewno`, `kamien`) w `building_costs::ResourceStock` | NIE — `Surowiec`, `Typ`, `Źródło / budynek`, `Uwagi` BRAK jako struktura | NIE |
| 22 | `society-params.json` | BRAK pełnej struktury; fragmenty: `city_growth.rs` `health_growth_modifier` (≈`zdrowie`), `diplomacy.rs` `same_religion_trust_per_turn` (≈`religia`) | NIE — `szczescie`, `kultura`, `porzadek`, `prawo`, `religie_cywilizacji` BRAK | NIE |
| 23 | `tech.json` | CZĘŚCIOWO — `diplomacy.rs` `TechDefinition {id, prerequisites, era, tier}` (mapowanie wnioskowane z nazw pól: `Technologia`→`id`, `Wymaga (prereq)`→`prerequisites`, `Epoka`→`era`, `Poziom`→`tier`; wartości nie porównane) | NIE — `Koszt nauki`, `Odblokowuje budynek`, `Odblokowuje ulepszenie terenu`, `wymagany budynek`, `Dostęp do surowca.`, `Uwagi`, `Historia` BRAK; `drzewko_model`, `tempo_gry` BRAK | NIE |
| 24 | `terrain-combat.json` | CZĘŚCIOWO — `combat.rs` `Terrain` (enum) + modyfikatory terenu jako parametr wejściowy | NIE — tabela 7 terenów (`Bonus Obrona`, `Δ Zasięg`, `Kawaleria/Rydwan`) BRAK jako dane | NIE |
| 25 | `terrain-improvements.json` | CZĘŚCIOWO — `resource_production.rs` `normalize_improvement_key()`, `resolve_resource_production(key, era)`, `resource_yield_for_improvement()`; `improvements.rs` `ImprovementKey`, `Tile`, `Production` | NIE/NIEZWERYFIKOWANE — 22 rekordy (`farma`, `irygacja`, `kopalnia_zlota`, …): **22/22 id występują jako literały w `resource_production.rs`/`improvements.rs`** (dowód: literał `"id"` w `src/`); pełna zgodność zbioru (brak id nadmiarowych po stronie Rust) nieporównana. Pola `nazwa`, `epoka`, `bonus`, `teren`, `warunek`, `koszt_praca`, `tech`, `odblokowuje` BRAK jako struktura | NIE |
| 26 | `terrain-movement.json` | **TAK (częściowo)** — `pathfinding.rs:228` `MovementRules` (`Default` „mirrors `terrain-movement.json`”) | Przemianowane: `Laka`→`grassland`, `Rownina`→`plains`, `Pustynia`→`desert`, `Wzgorza`→`hills`, `forestExtra`→`forest_extra`. **Wartości zgodne:** 1, 1, 2, 2, forest 1. BRAK pól: `Wybrzeze` (99), `Gory` (99), `Morze` (99), `Polarny` (99) — w Ruście teren niedostępny = `None`. Pola Rust bez wpisu w JSON: `river_cost`, `road_divisor`, `paved_road_divisor` | NIE (wartości w `Default`; `tests/terrain_movement_fix.rs:3` cytuje plik jako fixture) |
| 27 | `terrain-yields.json` | BRAK (plony bazowe w kodzie: `ResourceYield`, `ai_turn.rs:153` `with_yields`; brak struktury `terrain_types`/`terrain_modifiers`) | NIE | NIE |
| 28 | `ui-params.json` | BRAK (UI poza domeną; P5) | — | NIE |
| 29 | `units.json` | CZĘŚCIOWO — `recruitment.rs:13` `UnitRecruitment`, `canonical_recruitment_costs()` (75 rekordów, komentarz „mirrored from `gra/data/units.json`”); `diplomacy.rs` `UnitDefinition` z aliasami serde `"Ruch"`, `"Rola (linia)"`, `"Super-jednostka"` | Mapowanie pól: `Jednostka`→`unit_id`, `Typ`→`unit_type`, `Pieniądz (koszt)`→`gold_cost`, `Utrzymanie (Pieniądz/turę)`→`gold_upkeep`, `Surowiec`+`Surowiec (ilość)`→`stock_cost`, `Utrzymanie surowiec`+`(ilość)`→`resource_upkeep`, `Super-jednostka`→`super_unit`. **Wartości: 0 z 75 rekordów w pełni zgodnych** — np. Wojownik: `gold_cost` 10 vs JSON 5, stock `drewno` 50 vs JSON `Drewno` 13, upkeep 10 vs 3; Zwiadowca: 8 vs 4, JSON `Surowiec` = null. Klucze surowców w Ruście lowercase (`drewno`, `braz`), w JSON `Drewno`, `Brąz`. **Mapowane: 9 z 61 unikalnych kluczy** (`Jednostka`, `Typ`, `Pieniądz (koszt)`, `Utrzymanie (Pieniądz/turę)`, `Surowiec`, `Surowiec (ilość)`, `Utrzymanie surowiec`, `Utrzymanie surowiec (ilość)`, `Super-jednostka`); **52 z 61 BRAK** poza mapowaniem (dowód: literał `"klucz"` w `src/`: 4 z 61, tj. `Pieniądz (koszt)`, `Ruch`, `Super-jednostka`, `Rola (linia)`) | NIE |
| 30 | `wonders.json` | BRAK (P2.1 M12: brak modułu cudów; tylko parametry `trade.rs:1451`, `diplomacy.rs:245`) | — | NIE |

## 2. Wnioski z dowodów (fakty)

1. **Brak loadera danych `gra/data` w całym `rust-port/engine` na `parity-v2`.** Wszystkie 30 wierszy mają „Loader: NIE”. Wartości są wpisane w kod (`canonical_*()`, `Default`, wbudowane tabele).
2. **Zgodność wartości — dwa dowody mierzone:**
   - `buildings.json` → `building_costs.rs`: 42/42 zgodne w `kosztBudowy`, `przyrostKosztu`, `koszt_surowce`.
   - `units.json` → `recruitment.rs`: 0/75 w pełni zgodnych; komentarz „mirrored from units.json” jest **nieprawdziwy** dla wartości kosztów/utrzymania/surowców.
3. **Przemianowania kluczy są systematyczne:** pola Rust w snake_case EN (`base_work`, `gold_cost`, `grassland`), klucze JSON po polsku/camelCase. Jedyne dokładne klucze to aliasy serde w `diplomacy.rs` `UnitDefinition` (`Ruch`, `Rola (linia)`, `Super-jednostka`) i `#[serde(rename = …)]` w innych modułach (np. `diplomacy.rs:3879` `superJednostka`), które **nie są podpięte do żadnego pliku** — nie ma kodu, który czyta `units.json`.
4. **Pliki bez odpowiednika (BRAK):** `citizen-resource-upkeep`, `city-names-pools`, `civ-matrix`, `epoka-ludnosc-manpower`, `power-params`, `terrain-yields`, `ui-params`, `wonders`, `earth-mask-source.png`.
5. **Rozbieżność z P1.12:** P1.12 podaje 5 plików różniących się od `edb8fb56` w lokalnym HEAD `e5c959c2`; niniejszy katalog używa wyłącznie pinu `edb8fb56`.

## 2a. Dowód per klucz — literał w kodzie (runda 2)

Metoda: dla każdego unikalnego klucza top-level (oraz kluczy rekordów w tablicach) z 29 plików JSON na `edb8fb56` sprawdzono, czy występuje jako **pełny literał w cudzysłowie** w `rust-port/engine/src/**/*.rs` na `9e33fc77` (skrypt Node, bez zapisów do repo). Ograniczenie: nie rozstrzyga znaczenia pola; trafienie w komentarzu lub stałej nie jest mapowaniem.

- Razem: **408** unikalnych kluczy top-level, **44** trafień literalnych (w tym 22 id z `terrain-improvements`, 15 identyfikatorów cywilizacji w `city-names-pools`, 4 w `units`, 2 w `econ-params`, 1 w `buildings` (`id`)).
- Zero trafień dla: `ai-params` (0/136), `e-start-params` (0/11), `diplomacy` (0/11), `miasto-params` (0/26), `society-params` (0/7), `combat-params` (0/12), `civs` (0/2), `civ-ai` (0/2; 10 kluczy profilu w zagnieżdżeniu: 0/10), `tech` (0/4), `terrain-combat` (0/6), `terrain-movement` (0/2), `map-gen-params` (0/7), `counters` (0/5), `resources` (0/4), `auto-battle-params` (0/4).
- `auto-battle-params`: `_opis` i `_maciej_kroki` to **teksty instrukcji UI**, nie dane gry (nie są mapowane — zamierzone).

## 3. Ograniczenia

- Pełne porównanie pole po polu wykonano **tylko** dla wierszy 3 (wartości), 11 (counters: 16/16 liczbowych), 26 (wartości), 29 (wartości). Dla pozostałych CZĘŚCIOWO/BRAK oznaczenia „NIE” opierają się na: literale w 2a oraz na braku pełnej struktury 1:1 — **NIE są porównaniem każdego klucza**. Kryterium (2) dispatchu (dowód per klucz) jest więc **niespełnione** dla wierszy oznaczonych CZĘŚCIOWO/BRAK poza 3, 11, 26, 29 i wierszem 25 (tylko obecność id).
- Mapowanie `tech.json` → `TechDefinition` (wiersz 23) jest wnioskowane z nazw pól i nie zostało zweryfikowane wartościami.
- Rozstrzygnięcie „REUSE/ADAPT/REPLACE” nie jest częścią tego katalogu (P1.17 / P2.2+).
- Wynik nie jest dowodem zachowania logiki; to katalog odwzorowania nazw i obecności struktur.

## 4. Zarzut do rozstrzygnięcia w kolejnych tematach (fakt, nie decyzja)

- `recruitment.rs` (`canonical_recruitment_costs`) i jego komentarz źródłowy są rozbieżne z `units.json` na pinie `edb8fb56`. Naprawa wartości/loadera należy do P3.5–P3.7 (przeniesienie 1:1), a nie do tego katalogu.
- Komentarze „mirrored from”/„canonical” w `building_costs.rs:103`, `recruitment.rs:204`, `combat.rs:182` opisują stan oczekiwany, nie zweryfikowany.
