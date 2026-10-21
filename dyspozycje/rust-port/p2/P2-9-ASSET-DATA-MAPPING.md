# P2.9 — Mapowanie danych web `gra/data/*.json` → struktury Rust (katalog faktów)

**Temat:** `R-RUSTPORT-P2-9-ASSET-DATA-MAPPING-Q1` · **Runda:** 2/5 · **Rola:** Operator (Haiku 5.5 medium, poprawka po zarzutach #1–#19 Evaluatora/Final Control rundy 1)
**Status:** wynik Operatora, do Evaluatora i Final Control. Katalog faktów, NIE decyzja projektowa.

**Piny:** web `main` = `edb8fb56` (odczyt: `git archive edb8fb56 gra/data`); Rust = `rust-port/parity-v2` = `9e33fc77` (odczyt: `git archive rust-port/parity-v2 rust-port/engine`, zakres: `src/`, `tests/`, `benches/`). `rust-port/engine` = biblioteka referencyjna (GOAL §0 poz. 1); pin cytowania nie oznacza zgody na kontynuację kodu.

## 0. Metoda i kryteria (binarne, per klucz)

Każdy **unikalny klucz JSON** (rekurencyjnie, wszystkie poziomy każdego z 29 plików JSON; `earth-mask-source.png` poza zakresem) dostał jeden status na podstawie grep-u po pełnym korpusie Rust (`src/`, `tests/`, `benches/`):

| Status | Znaczenie | Dowód w tabeli |
|---|---|---|
| `SERDE` | klucz/ID występuje jako `rename = "…"` lub `alias = "…"` w Rust (serde) | plik:linia |
| `LITERAL` | klucz występuje jako literał `"…"` w Rust (lookup/fixture/test) | plik:linia |
| `PRZEMIANOWANE` | klucz po normalizacji (bez diakrytyki, camelCase→snake_case) pasuje do nazwy pola `pub` struct | nowa nazwa pola |
| `SLOWO` | klucz występuje tylko jako słowo w `src/` (komentarz/zmienna) — **NIE jest dowodem mapowania** | — |
| `META` | klucz dokumentacyjny `_…` (`_opis`, `_meta`, `_maciej_kroki`, …) bez odpowiednika — poza zakresem domeny | — |
| `BRAK` | brak jakiegokolwiek trafienia w Rust | — |

Uwaga metodyczna: trafienia `SERDE`/`LITERAL` dla krótkich, ogólnych kluczy (`id`, `opis`, `typ`, `version`) oraz `LITERAL` dla wartości-słów (`medium`, `konie`, `wegiel`) pokazują tylko, że ciąg występuje w kodzie; NIE dowodzą, że klucz JSON jest tym samym polem. Czytaj je przez kolumnę dowodu. Klucze liczbowe (`1`) nie są dopasowywane literalnie. Klucze `_…` nie dostają statusu `PRZEMIANOWANE`. `1:1` nazywam tylko status `SERDE`/`PRZEMIANOWANE` z dowodem — `LITERAL` i `SLOWO` są zawsze oznaczone **(słaby)** i nie dowodzą zgodności; reszta nie jest zgodna.

## 1. Kryterium 1–3 per plik (29 plików JSON; `earth-mask-source.png` poza zakresem)

Kolumny: (1) struktura Rust tak/nie + ścieżka; (2) zgodność kluczy — liczba kluczy unikalnych i rozkład statusów; (3) loader tak/nie.

| # | Plik | Klucze unik. | SERDE | LITERAL | PRZEMIAN. | SŁOWO | META | BRAK | (1) Struktura Rust | (3) Loader |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| 1 | `ai-params.json` | 139 | 0 | 0 | 0 | 0 | 0 | 139 | `ai_turn.rs`: `AiTurnOptions`, `ArchetypeMods` (military/science/economy/defense), `CityScoreWeights` — kształt częściowy, wartości w kodzie; 136 parametrów AI nie ma odpowiednika | NIE |
| 2 | `auto-battle-params.json` | 11 | 0 | 0 | 0 | 0 | 2 | 9 | BRAK | NIE |
| 3 | `buildings.json` | 41 | 6 | 1 | 0 | 5 | 0 | 29 | `building_costs.rs`: `BuildingCost`, `canonical_building_costs()` — 40 z 42 rekordów (brak `warsztat_oblezniczy`, `akademia_wojskowa`); wartości 40/40 zgodne (§3) | NIE — tabela hard-coded (`building_costs.rs:103-108`, komentarz: loader dopiero w przyszłości) |
| 4 | `citizen-resource-upkeep.json` | 9 | 1 | 0 | 0 | 1 | 2 | 5 | BRAK (`city_growth.rs` wymienia słowo „citizen” bez struktury z tego pliku) | NIE |
| 5 | `city-names-pools.json` | 17 | 15 | 0 | 0 | 0 | 0 | 2 | `diplomacy.rs`: enum `CivilizationKind` — 15/15 ID pul jako `rename` wartości; pule nazw miast (`nazwa_pl`, `miasta_cywilizacji`) BRAK | NIE |
| 6 | `civ-ai.json` | 13 | 0 | 0 | 0 | 0 | 1 | 12 | BRAK (`ai_turn.rs` nie czyta profilu per cywilizacja) | NIE |
| 7 | `civ-matrix.json` | 113 | 1 | 1 | 0 | 5 | 1 | 105 | BRAK (`paramDefs`, macierz modyfikatorów — brak odpowiednika) | NIE |
| 8 | `civ-params.json` | 9 | 0 | 0 | 0 | 0 | 1 | 8 | BRAK | NIE |
| 9 | `civs.json` | 31 | 3 | 2 | 0 | 0 | 0 | 26 | `types.rs`: `CivilizationDto` (DTO); `diplomacy.rs`: `CivilizationKind` (15 ID + `generic`, `drobna_cywilizacja`, `babilon` ponad web); bonusy, wodzowie, kolory, ikony — BRAK | NIE |
| 10 | `combat-params.json` | 49 | 0 | 0 | 0 | 1 | 3 | 45 | `combat.rs`: `CombatInput`, `CounterBonus`, `DefenseStructures`; wartości jako stałe w kodzie, bez odczytu pliku | NIE |
| 11 | `counters.json` | 5 | 0 | 0 | 0 | 1 | 0 | 4 | `combat.rs`: `CounterBonus` (pole struktury; tabela 17 wpisów nie jest wczytywana) | NIE |
| 12 | `diplomacy-acceptance-points.json` | 54 | 30 | 6 | 0 | 0 | 1 | 17 | `diplomacy.rs`: `TreatyKind` (rename: pokoj, sojusz_pelny, nap, umowa_handlowa, …), `BasketItemKind`, `ProposalPnOptions`; tabela punktów BRAK | NIE |
| 13 | `diplomacy.json` | 229 | 5 | 2 | 0 | 8 | 1 | 213 | `diplomacy.rs`: `DiplomacyParams` (pola snake_case, nazwy pojęć, nie klucze web `params`), `TreatyKind`, `ValueCatalog`, `ResourceAccessGrant`; sekcje `perNacja`, `akcje_dyplomatyczne`, `panel_sterowania` BRAK | NIE |
| 14 | `e-start-params.json` | 77 | 2 | 7 | 0 | 3 | 1 | 64 | `playable.rs`: pola konfiguracji (`city_states_count`, `city_state_difficulty_override`) z `NOT_IMPLEMENTED` (`playable.rs:167`); sekcje startu BRAK | NIE |
| 15 | `econ-params.json` | 130 | 6 | 3 | 0 | 0 | 0 | 121 | `trade.rs`: `RawTradeParameters` (`#[serde(rename = "handel_szlaki")]`, `#[serde(rename = "ekonomia_miasta")]`), `RawParamRow` (easy/normal/hard), `load_trade_route_params` (`trade.rs:1875`); `city_growth.rs`: `CityGrowthParams`; pozostałe 5 sekcji BRAK | CZĘŚCIOWO — `RawTradeParameters` deserializuje już sparsowany obiekt (`trade.rs:1868`); brak odczytu pliku; brak testu na prawdziwym `econ-params.json` (grep `tests/`: 0 trafień) |
| 16 | `epoka-ludnosc-manpower.json` | 10 | 0 | 0 | 0 | 1 | 2 | 7 | `unit_epoch.rs`: `Epoch` (3 warianty: Stone/Bronze/Iron) vs 10 epok w pliku; manpower BRAK (P2.1 M4) | NIE |
| 17 | `map-gen-params.json` | 60 | 6 | 8 | 0 | 2 | 2 | 42 | `map_generator.rs`: `MapGenerator`, `WorldType`, `ClimateBand`, `Terrain`; parametry (mgła, gęstość, złoża) w kodzie | NIE |
| 18 | `miasto-params.json` | 32 | 4 | 0 | 0 | 0 | 0 | 28 | `city_growth.rs`: `CityGrowthParams` (część pól wzrostu); 26 parametrów BRAK | NIE |
| 19 | `power-params.json` | 56 | 3 | 0 | 0 | 2 | 4 | 47 | BRAK (formuła siły armii: P2.1 M8 tylko wzorzec ADAPT) | NIE |
| 20 | `resources.json` | 4 | 0 | 0 | 0 | 0 | 0 | 4 | `resource_production.rs`: `ResourceKey` — 9 wariantów (drewno, kamien, glina, ruda, ruda_zelaza, ruda_cyny, sol, zloto, kon) z 15 surowców; 6 BRAK w enumie (§2) | NIE |
| 21 | `society-params.json` | 127 | 4 | 0 | 0 | 0 | 0 | 123 | `diplomacy.rs`: pola zaufania za religię (`same_religion_trust_per_turn`, `different_religion_trust_per_turn`) i `technology_trust_threshold` — NIE są mapowaniem tego pliku; zdrowie/szczęście/kultura/porządek/prawo BRAK (P2.1 M10) | NIE |
| 22 | `tech.json` | 22 | 0 | 0 | 0 | 2 | 2 | 18 | `diplomacy.rs`: `TechDefinition` (`id`, `prerequisites`, `era`, `tier`) — 4 pola bez czytania `tech.json`; drzewko 32 technologii BRAK (P2.1 M12) | NIE |
| 23 | `terrain-combat.json` | 6 | 0 | 0 | 0 | 0 | 0 | 6 | BRAK tabeli z pliku (`combat.rs` ma enum `Terrain`, bez wczytywania) | NIE |
| 24 | `terrain-improvements.json` | 67 | 30 | 0 | 0 | 2 | 3 | 32 | `improvements.rs`: `ImprovementKey` — 22 warianty = 22 rekordy web (§2, zgodne 22/22); `Production`, `Deposit` | NIE |
| 25 | `terrain-movement.json` | 10 | 7 | 0 | 1 | 2 | 0 | 0 | `pathfinding.rs`: `TerrainType`, `MovementRules`, `MovementCost`; `map_generator.rs`: `Terrain` (rename Laka/Rownina/…) | NIE |
| 26 | `terrain-yields.json` | 12 | 0 | 1 | 0 | 0 | 0 | 11 | `resource_production.rs`: `ResourceYield` (pola plonów) — tabela `terrain_types` BRAK | NIE |
| 27 | `ui-params.json` | 20 | 0 | 1 | 0 | 3 | 1 | 15 | BRAK (UI poza domeną — P2.1 §2) | NIE |
| 28 | `units.json` | 63 | 4 | 0 | 0 | 6 | 0 | 53 | `recruitment.rs`: `UnitRecruitment`, `canonical_recruitment_costs()` — 75/75 nazw zgodnych; WARTOŚCI 75/75 rozbieżne (§3) | NIE — tabela hard-coded (`recruitment.rs:204-205`) |
| 29 | `wonders.json` | 111 | 21 | 0 | 0 | 5 | 1 | 84 | `trade.rs`: parametr `wonder_trade_bonus_for_owner` (`trade.rs:1451`); struktura cudów BRAK (P2.1 M12) | NIE |
| — | `earth-mask-source.png` | — | — | — | — | — | — | — | nie dotyczy (plik PNG, bez kluczy JSON; poza zakresem wg dispatch §0, ale zapisany tu dla kompletności 30/30) | nie dotyczy |

**Suma unikalnych kluczy (per plik):** 1527. Rozkład: BRAK 1269, LITERAL 32 (wszystkie słabe), META 28, PRZEMIANOWANE 1, SERDE 148, SLOWO 49 (wszystkie słabe; w tym 2 zbieżności nazw po korekcie rundy 2). Wiersz 30 (`earth-mask-source.png`) nie wchodzi do sumy.

## 2. Mapowanie ID-wartości (surowce, ulepszenia, tereny, cywilizacje, budynki, jednostki)

To są wartości, nie klucze JSON, ale to one są ID danych (kryterium P2.9 `ID assetów/danych`). Każdy wiersz ma dowód z grepu/parsowania.

### 2a. `resources.json` — 15 surowców (rekord `Surowiec` → ID Rust)

| # | `Surowiec` (web) | ID kandydat (ASCII) | `Typ` | Rust `ResourceKey` (`resource_production.rs`) | Dowód literału poza enumem |
|---|---|---|---|---|---|
| 1 | Żywność | `zywnosc` | surowy | NIE | BRAK w enumie |
| 2 | Drewno | `drewno` | surowy | TAK (`drewno`) |  |
| 3 | Kamień | `kamien` | surowy | TAK (`kamien`) |  |
| 4 | Glina | `glina` | surowy | TAK (`glina`) |  |
| 5 | Ruda | `ruda` | surowy | TAK (`ruda`) |  |
| 6 | Ruda żelaza | `ruda_zelaza` | surowy | TAK (`ruda_zelaza`) |  |
| 7 | Ruda cyny | `ruda_cyny` | surowy | TAK (`ruda_cyny`) |  |
| 8 | Koń | `kon` | hodowla | TAK (`kon`) |  |
| 9 | Sól | `sol` | surowy | TAK (`sol`) |  |
| 10 | Złoto | `zloto` | surowy | TAK (`zloto`) |  |
| 11 | Cegła | `cegla` | przetworzony | NIE | BRAK w enumie |
| 12 | Ceramika | `ceramika` | przetworzony | NIE | BRAK w enumie |
| 13 | Brąz | `braz` | przetworzony | NIE | BRAK w enumie |
| 14 | Żelazo | `zelazo` | surowy | NIE | BRAK w enumie |
| 15 | Stal | `stal` | przetworzony | NIE | BRAK w enumie |

Wniosek 2a: 9/15 surowców ma wariant `ResourceKey` ze zgodnym ID (`drewno`, `kamien`, `glina`, `ruda`, `ruda_zelaza`, `ruda_cyny`, `sol`, `zloto`, `kon`); **6/15 brak w `ResourceKey`** (`zywnosc`, `cegla`, `ceramika`, `braz`, `zelazo`, `stal`). Część z nich występuje jako literał w innych plikach Rust (np. `"zelazo"`, `"braz"` w `recruitment.rs`), ale nie jako wariant enum — to nie jest mapowanie kompletne.

### 2b. `terrain-improvements.json` — 22 rekordy ulepszeń

Zbiór ID web (22) = zbiór `rename` w `ImprovementKey` (`improvements.rs`, 22 warianty): **ZGODNY 22/22**. Wszystkie 22 ID zgodne literalnie (`farma`, `irygacja`, `bydlo`, `owce`, `lama`, `stadnina`, `tartak`, `oboz_lowiecki`, `glinianka`, `kamieniolom`, `kopalnia_miedzi`, `kopalnia_zelaza`, `kopalnia_cyny`, `kopalnia_zlota`, `warzelnia_soli`, `lodzie_rybackie`, `tarasy`, `droga`, `droga_brukowana`, `wyrab`, `fort`, `posterunek`). **Pola rekordu** (`nazwa`, `epoka`, `bonus`, `surowiecOdblokowany`, `teren`, `warunek`, `koszt_praca`, `tech`, `odblokowuje`, `uwagi`, `historia`) — w `ImprovementKey` BRAK; ID ulepszenia nie niesie pól rekordu.

### 2c. `terrain-movement.json` / `terrain-combat.json` / `terrain-yields.json` — nazwy terenów

- `terrain-movement.json` `costs` (8): `Laka`, `Rownina`, `Pustynia`, `Wybrzeze`, `Wzgorza`, `Gory`, `Morze`, `Polarny` — w Rust `map_generator.rs` `Terrain` ma `rename` dla 7 z nich (`Laka`, `Rownina`, `Pustynia`, `Wzgorza`, `Gory`, `Morze`, `Polarny`); **`Wybrzeze` BRAK** (Rust ma `PlytkieMorze` = `ShallowSea`, nie ma odpowiednika 1:1 — mapowanie wymaga decyzji w P2.2).
- `terrain-combat.json` `Teren` (7 wartości, np. `Płaskie (równina/łąka)`, `Las`, `Rzeka`, `Wybrzeże / Morze`) — opisowe etykiety, **BRAK** ID w Rust.
- `terrain-yields.json` `terrain_types[].Teren` (8: `Łąka`, `Równina`, `Wzgórza`, `Góry`, `Wybrzeże`, `Morze`, `Pustynia`, `Polarny`) — **BRAK** ID w Rust (etykiety polskie, bez `rename`).

### 2d. `city-names-pools.json` ↔ `civs.json` — 15 cywilizacji

Klucze `city-names-pools.json` (15): grecy, rzymianie, chinczycy, inkowie, zulusi, egipt, sumer, celtowie, germanie, harappa, hetyci, slowianie, babilonia, asyria, fenicjanie. W `diplomacy.rs` `CivilizationKind` (rename wartości): **15/15 zgodnych** (`grecy`, `rzymianie`, `chinczycy`, `inkowie`, `zulusi`, `egipt`, `sumer`, `celtowie`, `germanie`, `harappa`, `hetyci`, `slowianie`, `babilonia`, `asyria`, `fenicjanie`), **0 brakujących**. Rust ma dodatkowo: `generic`, `drobna_cywilizacja`, `babilon` (duplikat semantyczny `babilonia` — niezgodność do rozstrzygnięcia w P2.2). Mapowanie `civs.json` `Cywilizacja` (display, np. `Grecy`) → ID enumu jest tylko domysłem po kolejności i NIE jest dowiedzione przez kod; nie traktować jako zgodne.

### 2e. `buildings.json` — ID budynków

Rekordy web: 42. Rekordy Rust (`canonical_building_costs()`): 40, wszystkie 40 ID istnieją w web. **Brak w Rust (2):** `warsztat_oblezniczy`, `akademia_wojskowa`.

### 2f. `units.json` — ID jednostek

Rekordy web (`Jednostka`): 75. Rekordy Rust (`canonical_recruitment_costs()`, `unit_id`): 75. Zbiór nazw zgodny: **75/75 Rust → web; 75/75 web → Rust** (nazwy są display, np. `Wojownik`, nie ID ASCII).

## 3. Porównanie wartości (nie tylko kluczy) — dowód z parsowania

- **buildings.json vs `building_costs.rs`:** 40/40 rekordów zgodne (`kosztBudowy`→`base_work`, `przyrostKosztu`→`work_increment`, `koszt_surowce`→`resource_cost`, sprawdzone per rekord). Rozbieżności: **0**. (Mapowanie nazw pól jest więc PRZEMIANOWANIEM z dowodem wartości, nie samą zgodnością nazw.)
- **units.json vs `recruitment.rs`:** 0/75 zgodne; **75/75 rozbieżne.** Przykłady: Wojownik — web `Pieniądz (koszt)`=5, `Surowiec (ilość)`=13 (Drewno); Rust `gold_cost`=10, `stock_cost`=drewno 50. Wszystkie rozbieżności są w `koszt` (Rust = 2× web) lub `stock`. Historia `gra/data/units.json` (`git log` od `edb8fb56`, najnowszy → najstarszy): od `4c1126de` włącznie wartość Wojownika to 5/13 (pin `edb8fb56` = 5/13); `f5a1ce51` ma koszt 10 i ilość 25; commity `2b53a793` i starsze mają 10/50 — to wartości Rust. Wniosek: tabela Rust jest **zamrożonym starszym stanem** units.json, nie kopią pinu `edb8fb56`. Komentarz w `recruitment.rs:204` („mirrored from gra/data/units.json”) jest nieaktualny względem pinu.

## 4. Loader (kryterium 3)

- `rust-port/engine/src/`, `tests/`, `benches/` nie zawierają żadnego odczytu plików (`fs::read`, `read_to_string`, `File::open`, `include_str!`, `include_bytes!`). Odwołania do plików danych w `rust-port/engine` na `parity-v2` (`git grep 'gra/data'`): **4 trafienia z prefiksem `gra/data/`**: `building_costs.rs:103`, `combat.rs:182`, `recruitment.rs:204`, `tests/terrain_movement_fix.rs:3`. **2 dalsze** odwołania działają po samej nazwie pliku, bez prefiksu: `building_costs.rs:8` (`buildings.json`) i `domain/pathfinding.rs:228` (`terrain-movement.json`). Wszystkie 6 to komentarze dokumentacyjne — nie wykonują odczytu.
- `serde_json` jest zależnością (`Cargo.toml`), ale w `tests/` służy wyłącznie do round-trip stanu/zapisu (`tests/smoke.rs`, `tests/save_load.rs`, `tests/rng.rs`, …), nie do wczytania plików danych.
- Jedyny element zbliżony do loadera danych: `trade.rs:1868` `RawTradeParameters` + `load_trade_route_params` (`trade.rs:1875`) — deserializacja **z już sparsowanego obiektu**, bez ścieżki pliku i bez testu na `econ-params.json`. Status: CZĘŚCIOWO.
- Dwie tabele hard-coded (`building_costs.rs:108`, `recruitment.rs:205`) z komentarzem o braku loadera (`building_costs.rs:103-107`).
- Wniosek kryterium 3: **loader dla 30 plików: NIE** (jedna częściowa struktura deserializowalna w `trade.rs`, bez wczytania pliku).

## 5. Rozstrzygnięcie kluczy `_…` (zarzut #2 rundy 1)

Klucze `_opis`, `_maciej_kroki`, `_meta`, `_formuly`, `_nazewnictwo`, `_kara`, `_komentarz`, `_drzewko_model_opis` i podobne są **dokumentacją schematu JSON**, nie danymi domeny. Status `META` = poza zakresem mapowania. Ich brak w Rust nie jest niezgodnością, ale P3.5–P3.7 musi zdecydować, czy loader je ignoruje (rekomendacja: ignoruj, zachowaj w pliku). To jest fakt o klasyfikacji, nie decyzja projektowa.

## 6. Ograniczenia

- Dowód per klucz = trafienie tekstowe (grep) i heurystyka normalizacji; nie dowodzi semantycznej zgodności wartości, poza sekcjami z §3 (buildings, units).
- Wartości pozostałych plików (ai-params, diplomacy, econ-params, combat-params itd.) NIE są porównywane wartościowo w tym temacie — tylko klucze. Rozbieżności wartości są zadaniem P2.10 / P3.5–P3.7.
- Pin Rust = `9e33fc77`; `main` (`edb8fb56`) zawiera starszą kopię `rust-port/engine/src/domain/` (18 plików, zob. P2.1 §Piny) — porównanie w tym dokumencie używa `parity-v2`.
- `SLOWO` nie jest zgodnością; zero zmian w `gra/**`; zero nowego kodu Rust.

## 7. Appendix — per klucz (wszystkie unikalne klucze, rekurencyjnie)

### ai-params.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `trudnosc_poziom1_bonus_produkcja` | (top) | BRAK |  |
| `wartosc` | trudnosc_poziom1_bonus_produkcja | BRAK |  |
| `sekcja` | trudnosc_poziom1_bonus_produkcja | BRAK |  |
| `opis` | trudnosc_poziom1_bonus_produkcja | BRAK |  |
| `trudnosc_poziom1_bonus_nauka` | (top) | BRAK |  |
| `trudnosc_poziom1_startowe_jednostki` | (top) | BRAK |  |
| `trudnosc_poziom1_startowe_miasta` | (top) | BRAK |  |
| `trudnosc_poziom1_bonus_walka` | (top) | BRAK |  |
| `trudnosc_poziom1_agresja_mnoznik` | (top) | BRAK |  |
| `trudnosc_poziom1_dyplomacja_aktywnosc` | (top) | BRAK |  |
| `trudnosc_poziom1_cel_obranie` | (top) | BRAK |  |
| `trudnosc_poziom2_bonus_produkcja` | (top) | BRAK |  |
| `trudnosc_poziom2_bonus_nauka` | (top) | BRAK |  |
| `trudnosc_poziom2_startowe_jednostki` | (top) | BRAK |  |
| `trudnosc_poziom2_startowe_miasta` | (top) | BRAK |  |
| `trudnosc_poziom2_bonus_walka` | (top) | BRAK |  |
| `trudnosc_poziom2_agresja_mnoznik` | (top) | BRAK |  |
| `trudnosc_poziom2_dyplomacja_aktywnosc` | (top) | BRAK |  |
| `trudnosc_poziom2_cel_obranie` | (top) | BRAK |  |
| `trudnosc_poziom3_bonus_produkcja` | (top) | BRAK |  |
| `trudnosc_poziom3_bonus_nauka` | (top) | BRAK |  |
| `trudnosc_poziom3_startowe_jednostki` | (top) | BRAK |  |
| `trudnosc_poziom3_startowe_miasta` | (top) | BRAK |  |
| `trudnosc_poziom3_bonus_walka` | (top) | BRAK |  |
| `trudnosc_poziom3_agresja_mnoznik` | (top) | BRAK |  |
| `trudnosc_poziom3_dyplomacja_aktywnosc` | (top) | BRAK |  |
| `trudnosc_poziom3_cel_obranie` | (top) | BRAK |  |
| `archetype_grecy_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_grecy_nauka_priorytet` | (top) | BRAK |  |
| `archetype_grecy_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_grecy_obrona_priorytet` | (top) | BRAK |  |
| `archetype_rzym_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_rzym_nauka_priorytet` | (top) | BRAK |  |
| `archetype_rzym_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_rzym_obrona_priorytet` | (top) | BRAK |  |
| `archetype_chiny_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_chiny_nauka_priorytet` | (top) | BRAK |  |
| `archetype_chiny_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_chiny_obrona_priorytet` | (top) | BRAK |  |
| `archetype_zulusi_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_zulusi_nauka_priorytet` | (top) | BRAK |  |
| `archetype_zulusi_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_zulusi_obrona_priorytet` | (top) | BRAK |  |
| `archetype_inkowie_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_inkowie_nauka_priorytet` | (top) | BRAK |  |
| `archetype_inkowie_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_inkowie_obrona_priorytet` | (top) | BRAK |  |
| `archetype_egipt_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_egipt_nauka_priorytet` | (top) | BRAK |  |
| `archetype_egipt_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_egipt_obrona_priorytet` | (top) | BRAK |  |
| `archetype_sumer_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_sumer_nauka_priorytet` | (top) | BRAK |  |
| `archetype_sumer_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_sumer_obrona_priorytet` | (top) | BRAK |  |
| `dyplomacja_strach_prog_nap` | (top) | BRAK |  |
| `dyplomacja_strach_prog_trybut` | (top) | BRAK |  |
| `dyplomacja_relacja_handel` | (top) | BRAK |  |
| `dyplomacja_relacja_startowa_rywale` | (top) | BRAK |  |
| `dyplomacja_relacja_prog_wojna` | (top) | BRAK |  |
| `dyplomacja_max_propozycji_ture` | (top) | BRAK |  |
| `dyplomacja_zdrowie_armii_pokój` | (top) | BRAK |  |
| `ai_diplomacja_prog_wojna_sila` | (top) | BRAK |  |
| `ai_diplomacja_prog_wojna_agresja` | (top) | BRAK |  |
| `ai_diplomacja_prog_trybut` | (top) | BRAK |  |
| `ai_diplomacja_prog_pokoj_slabosc` | (top) | BRAK |  |
| `ai_diplomacja_prog_sojusz` | (top) | BRAK |  |
| `ai_diplomacja_prog_handel` | (top) | BRAK |  |
| `ai_diplomacja_prog_trybut_krytyczny` | (top) | BRAK |  |
| `ai_diplomacja_prog_trybut_agresja_max` | (top) | BRAK |  |
| `ai_diplomacja_prog_handel_archetyp_min` | (top) | BRAK |  |
| `ai_sojusz_obowiazek_min_ratio` | (top) | BRAK |  |
| `ai_sojusz_obowiazek_min_ratio_pokojowy` | (top) | BRAK |  |
| `ai_sojusz_obowiazek_max_wojny` | (top) | BRAK |  |
| `ai_sojusz_obowiazek_min_zaufanie` | (top) | BRAK |  |
| `ai_wycofanie_hp_prog` | (top) | BRAK |  |
| `ekspansja_min_dystans_miast` | (top) | BRAK |  |
| `ekspansja_min_score_hex` | (top) | BRAK |  |
| `ekspansja_zagroz_zasieg` | (top) | BRAK |  |
| `ekspansja_heurystyka_zywnosc_pkt` | (top) | BRAK |  |
| `ekspansja_heurystyka_praca_pkt` | (top) | BRAK |  |
| `ekspansja_heurystyka_handel_pkt` | (top) | BRAK |  |
| `ekspansja_heurystyka_rzeka_pkt` | (top) | BRAK |  |
| `ekspansja_heurystyka_surowiec_pkt` | (top) | BRAK |  |
| `ekspansja_heurystyka_granica_kara` | (top) | BRAK |  |
| `barbarzyncy_start_tura` | (top) | BRAK |  |
| `barbarzyncy_max_obozy` | (top) | BRAK |  |
| `barbarzyncy_min_dystans_miasto` | (top) | BRAK |  |
| `barbarzyncy_odstep_obozow` | (top) | BRAK |  |
| `barbarzyncy_interwal_spawnu` | (top) | BRAK |  |
| `barbarzyncy_jednostek_na_oboz` | (top) | BRAK |  |
| `barbarzyncy_zasieg_kontroli` | (top) | BRAK |  |
| `barbarzyncy_zasieg_agresji` | (top) | BRAK |  |
| `barbarzyncy_prog_odwrotu_hp` | (top) | BRAK |  |
| `barbarzyncy_limit_tur_osierocony` | (top) | BRAK |  |
| `archetype_celtowie_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_celtowie_nauka_priorytet` | (top) | BRAK |  |
| `archetype_celtowie_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_celtowie_obrona_priorytet` | (top) | BRAK |  |
| `archetype_germanie_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_germanie_nauka_priorytet` | (top) | BRAK |  |
| `archetype_germanie_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_germanie_obrona_priorytet` | (top) | BRAK |  |
| `archetype_harappa_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_harappa_nauka_priorytet` | (top) | BRAK |  |
| `archetype_harappa_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_harappa_obrona_priorytet` | (top) | BRAK |  |
| `archetype_hetyci_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_hetyci_nauka_priorytet` | (top) | BRAK |  |
| `archetype_hetyci_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_hetyci_obrona_priorytet` | (top) | BRAK |  |
| `archetype_slowianie_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_slowianie_nauka_priorytet` | (top) | BRAK |  |
| `archetype_slowianie_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_slowianie_obrona_priorytet` | (top) | BRAK |  |
| `archetype_babilonia_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_babilonia_nauka_priorytet` | (top) | BRAK |  |
| `archetype_babilonia_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_babilonia_obrona_priorytet` | (top) | BRAK |  |
| `archetype_asyria_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_asyria_nauka_priorytet` | (top) | BRAK |  |
| `archetype_asyria_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_asyria_obrona_priorytet` | (top) | BRAK |  |
| `archetype_fenicjanie_wojsko_priorytet` | (top) | BRAK |  |
| `archetype_fenicjanie_nauka_priorytet` | (top) | BRAK |  |
| `archetype_fenicjanie_ekonomia_priorytet` | (top) | BRAK |  |
| `archetype_fenicjanie_obrona_priorytet` | (top) | BRAK |  |
| `cuda_poziom1_prog_koszt_x` | (top) | BRAK |  |
| `cuda_poziom1_throttle_tur` | (top) | BRAK |  |
| `cuda_poziom2_prog_koszt_x` | (top) | BRAK |  |
| `cuda_poziom2_throttle_tur` | (top) | BRAK |  |
| `cuda_poziom3_prog_koszt_x` | (top) | BRAK |  |
| `cuda_poziom3_throttle_tur` | (top) | BRAK |  |
| `cuda_stuck_relax_tur_max` | (top) | BRAK |  |
| `ludy_morza_max_obozy` | (top) | BRAK |  |
| `ludy_morza_rajd_zasieg` | (top) | BRAK |  |
| `ludy_morza_rajd_okres_latwy` | (top) | BRAK |  |
| `ludy_morza_rajd_okres_normalny` | (top) | BRAK |  |
| `ludy_morza_rajd_okres_trudny` | (top) | BRAK |  |

### auto-battle-params.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `_opis` | (top) | META | klucz dokumentacyjny `_` |
| `_maciej_kroki` | (top) | META | klucz dokumentacyjny `_` |
| `kalibracja` | (top) | BRAK |  |
| `straty` | (top) | BRAK |  |
| `L_MAX` | straty | BRAK |  |
| `p_atk` | straty | BRAK |  |
| `p_def` | straty | BRAK |  |
| `L_MIN` | straty | BRAK |  |
| `remis_pct` | straty | BRAK |  |
| `coef_zwyciezca` | straty | BRAK |  |
| `coef_przegrany` | straty | BRAK |  |

### buildings.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `id` | (top) | SERDE | src/domain/trade.rs:236 |
| `dajeSzczescie` | (top) | BRAK |  |
| `nazwa` | (top) | BRAK |  |
| `kategoria` | (top) | BRAK |  |
| `grupa` | (top) | BRAK |  |
| `epokaWejscia` | (top) | BRAK |  |
| `maksPoziom` | (top) | BRAK |  |
| `nazwyPoziomow` | (top) | BRAK |  |
| `baza` | (top) | BRAK |  |
| `praca` | baza | SERDE | src/domain/diplomacy.rs:1413 (+2) |
| `pieniadz` | baza | SERDE | src/domain/improvements.rs:185 |
| `zywnosc` | baza | SERDE | src/domain/diplomacy.rs:1691 (+1) |
| `nauka` | baza | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `kultura` | baza | BRAK |  |
| `zadowolenie` | baza | BRAK |  |
| `obrona` | baza | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `mnoznik` | baza | BRAK |  |
| `przyrost` | (top) | BRAK |  |
| `kosztBudowy` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `przyrostKosztu` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `utrzymanie` | (top) | BRAK |  |
| `przyrostUtrzymania` | (top) | BRAK |  |
| `wymagania` | (top) | BRAK |  |
| `uwagi` | (top) | BRAK |  |
| `historia` | (top) | BRAK |  |
| `opis` | (top) | BRAK |  |
| `top3` | (top) | BRAK |  |
| `tytul` | top3 | BRAK |  |
| `tekst` | top3 | BRAK |  |
| `techUnlock` | (top) | BRAK |  |
| `koszt_surowce` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `drewno` | koszt_surowce | SERDE | src/domain/resource_production.rs:8 |
| `kamien` | koszt_surowce | SERDE | src/domain/improvements.rs:189 (+1) |
| `upgradeFrom` | (top) | BRAK |  |
| `cegla` | koszt_surowce | LITERAL (słaby) | src/domain/building_costs.rs:126 (+19) |
| `wymaganySurowiec` | (top) | BRAK |  |
| `poziomTechGate` | (top) | BRAK |  |
| `6` | poziomTechGate | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `lokalizacja` | (top) | BRAK |  |
| `odblokowuje` | (top) | BRAK |  |
| `suppressed` | (top) | BRAK |  |

### citizen-resource-upkeep.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `_opis` | (top) | META | klucz dokumentacyjny `_` |
| `_kara` | (top) | META | klucz dokumentacyjny `_` |
| `szczescieZaDostepny` | _kara | BRAK |  |
| `szczescieZaBrakujacy` | _kara | BRAK |  |
| `rozwojPctZaBrakujacy` | _kara | BRAK |  |
| `epoki` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `epoka` | epoki | BRAK |  |
| `nazwa` | epoki | BRAK |  |
| `surowce` | epoki | SERDE | src/domain/diplomacy.rs:2454 |

### city-names-pools.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `grecy` | (top) | SERDE | src/domain/diplomacy.rs:803 |
| `nazwa_pl` | grecy | BRAK |  |
| `miasta_cywilizacji` | grecy | BRAK |  |
| `rzymianie` | (top) | SERDE | src/domain/diplomacy.rs:805 |
| `chinczycy` | (top) | SERDE | src/domain/diplomacy.rs:807 |
| `inkowie` | (top) | SERDE | src/domain/diplomacy.rs:809 |
| `zulusi` | (top) | SERDE | src/domain/diplomacy.rs:811 |
| `egipt` | (top) | SERDE | src/domain/diplomacy.rs:813 |
| `sumer` | (top) | SERDE | src/domain/diplomacy.rs:817 |
| `celtowie` | (top) | SERDE | src/domain/diplomacy.rs:819 |
| `germanie` | (top) | SERDE | src/domain/diplomacy.rs:821 |
| `harappa` | (top) | SERDE | src/domain/diplomacy.rs:823 |
| `hetyci` | (top) | SERDE | src/domain/diplomacy.rs:825 |
| `slowianie` | (top) | SERDE | src/domain/diplomacy.rs:827 |
| `babilonia` | (top) | SERDE | src/domain/diplomacy.rs:829 |
| `asyria` | (top) | SERDE | src/domain/diplomacy.rs:831 |
| `fenicjanie` | (top) | SERDE | src/domain/diplomacy.rs:833 |

### civ-ai.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `cywilizacje` | (top) | BRAK |  |
| `Cywilizacja` | cywilizacje | BRAK |  |
| `agresywnosc` | cywilizacje | BRAK |  |
| `ekspansywnosc` | cywilizacje | BRAK |  |
| `priorytetMilitarny` | cywilizacje | BRAK |  |
| `priorytetEkonomia` | cywilizacje | BRAK |  |
| `priorytetNauka` | cywilizacje | BRAK |  |
| `tolerancjaRyzyka` | cywilizacje | BRAK |  |
| `sklonnoscDoPodboju` | cywilizacje | BRAK |  |
| `profilMapy` | cywilizacje | BRAK |  |
| `uwagi` | cywilizacje | BRAK |  |
| `_meta` | (top) | META | klucz dokumentacyjny `_` |
| `zrodlo` | _meta | BRAK |  |

### civ-matrix.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `_meta` | (top) | META | klucz dokumentacyjny `_` |
| `version` | _meta | LITERAL (słaby) | tests/replay.rs:275 (+7) |
| `source` | _meta | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `formula_mul_proc` | _meta | BRAK |  |
| `formula_mul_abs` | _meta | BRAK |  |
| `formula_add` | _meta | BRAK |  |
| `formula_flag` | _meta | BRAK |  |
| `kolumny` | _meta | BRAK |  |
| `cywilizacje` | _meta | BRAK |  |
| `paramDefs` | (top) | BRAK |  |
| `meta_mnoznik_waluta` | paramDefs | BRAK |  |
| `domena` | paramDefs | BRAK |  |
| `jednostka` | paramDefs | SERDE | src/domain/diplomacy.rs:1697 |
| `modul` | paramDefs | BRAK |  |
| `formula` | paramDefs | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `walka_atak_piechota` | paramDefs | BRAK |  |
| `walka_atak_lukownicy` | paramDefs | BRAK |  |
| `walka_atak_kawaleria` | paramDefs | BRAK |  |
| `walka_atak_rydwany` | paramDefs | BRAK |  |
| `walka_atak_obleczenie` | paramDefs | BRAK |  |
| `walka_atak_morska` | paramDefs | BRAK |  |
| `walka_atak_wszystkie` | paramDefs | BRAK |  |
| `walka_obrona_piechota` | paramDefs | BRAK |  |
| `walka_obrona_lukownicy` | paramDefs | BRAK |  |
| `walka_obrona_kawaleria` | paramDefs | BRAK |  |
| `walka_obrona_rydwany` | paramDefs | BRAK |  |
| `walka_obrona_obleczenie` | paramDefs | BRAK |  |
| `walka_obrona_morska` | paramDefs | BRAK |  |
| `walka_pancerz_piechota` | paramDefs | BRAK |  |
| `walka_pancerz_lukownicy` | paramDefs | BRAK |  |
| `walka_pancerz_kawaleria` | paramDefs | BRAK |  |
| `walka_pancerz_rydwany` | paramDefs | BRAK |  |
| `walka_uderzenie_piechota` | paramDefs | BRAK |  |
| `walka_uderzenie_kawaleria` | paramDefs | BRAK |  |
| `walka_uderzenie_rydwany` | paramDefs | BRAK |  |
| `walka_dystans_lukownicy` | paramDefs | BRAK |  |
| `walka_dystans_rydwany` | paramDefs | BRAK |  |
| `walka_hp_piechota` | paramDefs | BRAK |  |
| `walka_hp_kawaleria` | paramDefs | BRAK |  |
| `walka_hp_rydwany` | paramDefs | BRAK |  |
| `walka_ruch_bitwa_proc` | paramDefs | BRAK |  |
| `walka_zasieg_proc` | paramDefs | BRAK |  |
| `walka_oblezenie_proc` | paramDefs | BRAK |  |
| `walka_koszt_rekrutacji_proc` | paramDefs | BRAK |  |
| `walka_atak_piechota_teren_las` | paramDefs | BRAK |  |
| `walka_obrona_piechota_teren_las` | paramDefs | BRAK |  |
| `walka_atak_piechota_terytorium_wlasne` | paramDefs | BRAK |  |
| `walka_obrona_piechota_terytorium_wlasne` | paramDefs | BRAK |  |
| `walka_atak_piechota_w_murze` | paramDefs | BRAK |  |
| `walka_obrona_piechota_w_murze` | paramDefs | BRAK |  |
| `walka_atak_piechota_runda_szarzy` | paramDefs | BRAK |  |
| `walka_obrona_piechota_runda_szarzy` | paramDefs | BRAK |  |
| `walka_atak_piechota_teren_plytkie_morze` | paramDefs | BRAK |  |
| `walka_obrona_piechota_teren_plytkie_morze` | paramDefs | BRAK |  |
| `walka_ruch_piechota_teren_plytkie_morze` | paramDefs | BRAK |  |
| `walka_ruch_rydwany` | paramDefs | BRAK |  |
| `eko_praca_proc` | paramDefs | BRAK |  |
| `eko_pieniadz_proc` | paramDefs | BRAK |  |
| `eko_pieniadz_port_proc` | paramDefs | BRAK |  |
| `eko_zywnosc_proc` | paramDefs | BRAK |  |
| `eko_nauka_proc` | paramDefs | BRAK |  |
| `eko_kultura_proc` | paramDefs | BRAK |  |
| `eko_luksus_proc` | paramDefs | BRAK |  |
| `eko_zadowolenie_proc` | paramDefs | BRAK |  |
| `eko_handel_brutto_proc` | paramDefs | BRAK |  |
| `eko_korupcja_proc` | paramDefs | BRAK |  |
| `prod_koszt_budynku_proc` | paramDefs | BRAK |  |
| `prod_koszt_jednostki_proc` | paramDefs | BRAK |  |
| `prod_szybkosc_budynku_proc` | paramDefs | BRAK |  |
| `prod_szybkosc_jednostki_proc` | paramDefs | BRAK |  |
| `prod_rush_koszt_proc` | paramDefs | BRAK |  |
| `lud_wzrost_proc` | paramDefs | BRAK |  |
| `lud_spadek_proc` | paramDefs | BRAK |  |
| `lud_zdrowie_proc` | paramDefs | BRAK |  |
| `lud_zadowolenie_bazowe` | paramDefs | BRAK |  |
| `lud_limit_populacji` | paramDefs | BRAK |  |
| `mp_regen_proc` | paramDefs | BRAK |  |
| `mp_max_proc` | paramDefs | BRAK |  |
| `mp_koszt_jednostki_proc` | paramDefs | BRAK |  |
| `wealth_cap_proc` | paramDefs | BRAK |  |
| `wealth_mnoznik_proc` | paramDefs | BRAK |  |
| `kultura_naplyw_proc` | paramDefs | BRAK |  |
| `religia_spread_proc` | paramDefs | BRAK |  |
| `porzadek_produkcja_proc` | paramDefs | BRAK |  |
| `porzadek_pieniadz_proc` | paramDefs | BRAK |  |
| `porzadek_nauka_proc` | paramDefs | BRAK |  |
| `porzadek_kultura_proc` | paramDefs | BRAK |  |
| `porzadek_wzrost_proc` | paramDefs | BRAK |  |
| `obl_obrona_miasta_proc` | paramDefs | BRAK |  |
| `obl_mur_proc` | paramDefs | BRAK |  |
| `obl_machines_proc` | paramDefs | BRAK |  |
| `dip_sklonnosc_sojusze` | paramDefs | BRAK |  |
| `dip_lojalnosc` | paramDefs | BRAK |  |
| `dip_prog_wojny` | paramDefs | BRAK |  |
| `dip_pamietliwosc` | paramDefs | BRAK |  |
| `dip_otwartosc_handel` | paramDefs | BRAK |  |
| `dip_nastawienie_bazowe` | paramDefs | BRAK |  |
| `dip_agresja_archetyp` | paramDefs | BRAK |  |
| `dip_handlowosc_archetyp` | paramDefs | BRAK |  |
| `ai_agresywnosc` | paramDefs | BRAK |  |
| `ai_ekspansywnosc` | paramDefs | BRAK |  |
| `ai_priorytet_militarny` | paramDefs | BRAK |  |
| `ai_priorytet_ekonomia` | paramDefs | BRAK |  |
| `ai_priorytet_nauka` | paramDefs | BRAK |  |
| `ai_tolerancja_ryzyka` | paramDefs | BRAK |  |
| `ai_sklonnosc_podboju` | paramDefs | BRAK |  |
| `ai_profil_obronna` | paramDefs | BRAK |  |
| `defaults` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `Cywilizacja` | cywilizacje | BRAK |  |
| `typCywilizacji` | cywilizacje | BRAK |  |
| `ikonaId` | cywilizacje | BRAK |  |
| `tier` | cywilizacje | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `params` | cywilizacje | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |

### civ-params.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `cywilizacje` | (top) | BRAK |  |
| `Cywilizacja` | cywilizacje | BRAK |  |
| `preferowaneBudynki` | cywilizacje | BRAK |  |
| `preferowaneJednostki` | cywilizacje | BRAK |  |
| `modWzrostu` | cywilizacje | BRAK |  |
| `modEkonomii` | cywilizacje | BRAK |  |
| `uwagi` | cywilizacje | BRAK |  |
| `_meta` | (top) | META | klucz dokumentacyjny `_` |
| `zrodlo` | _meta | BRAK |  |

### civs.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `cywilizacje` | (top) | BRAK |  |
| `Cywilizacja` | cywilizacje | BRAK |  |
| `Styl / charakter` | cywilizacje | BRAK |  |
| `Jednostka specjalna` | cywilizacje | BRAK |  |
| `Bonus startowy` | cywilizacje | BRAK |  |
| `Bonusy/minusy (do dopracowania)` | cywilizacje | BRAK |  |
| `Uwagi` | cywilizacje | BRAK |  |
| `Religia` | cywilizacje | LITERAL (słaby) | src/domain/diplomacy.rs:1800 |
| `mnoznikHandelPieniadz` | cywilizacje | BRAK |  |
| `ikonaId` | cywilizacje | BRAK |  |
| `wodzowiePula` | cywilizacje | BRAK |  |
| `wodzowie` | cywilizacje | BRAK |  |
| `kamien` | cywilizacje | SERDE | src/domain/improvements.rs:189 (+1) |
| `braz` | cywilizacje | LITERAL (słaby) | src/domain/diplomacy.rs:1776 (+87) |
| `zelazo` | cywilizacje | SERDE | src/domain/improvements.rs:57 |
| `antyk` | cywilizacje | BRAK |  |
| `kolorHex` | cywilizacje | BRAK |  |
| `bonusy` | cywilizacje | BRAK |  |
| `typ` | cywilizacje | SERDE | src/domain/diplomacy.rs:1718 |
| `cel` | cywilizacje | BRAK |  |
| `wartosc` | cywilizacje | BRAK |  |
| `opis` | cywilizacje | BRAK |  |
| `realizuje` | cywilizacje | BRAK |  |
| `typCywilizacji` | cywilizacje | BRAK |  |
| `archetyp` | cywilizacje | BRAK |  |
| `epokaWejscia` | cywilizacje | BRAK |  |
| `epokiStartowe` | cywilizacje | BRAK |  |
| `nazwyMiast` | cywilizacje | BRAK |  |
| `start_gry` | (top) | BRAK |  |
| `Parametr` | start_gry | BRAK |  |
| `Wartość` | start_gry | BRAK |  |

### combat-params.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `_opis` | (top) | META | klucz dokumentacyjny `_` |
| `macierz_v2` | (top) | BRAK |  |
| `hit_base` | macierz_v2 | BRAK |  |
| `hit_min` | macierz_v2 | BRAK |  |
| `hit_max` | macierz_v2 | BRAK |  |
| `dmg_scale` | macierz_v2 | BRAK |  |
| `pancerz_divisor` | macierz_v2 | BRAK |  |
| `max_rounds` | macierz_v2 | BRAK |  |
| `tw_v3` | (top) | BRAK |  |
| `ss5l_legacy` | (top) | BRAK |  |
| `hit_per_point` | ss5l_legacy | BRAK |  |
| `counter_multiplier` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `morale_przewaga_mocy` | (top) | BRAK |  |
| `wspolczynnik_proc` | morale_przewaga_mocy | BRAK |  |
| `sufit_proc` | morale_przewaga_mocy | BRAK |  |
| `epsilon_ponad_flee` | morale_przewaga_mocy | BRAK |  |
| `_epsilon_ponad_flee_opis` | morale_przewaga_mocy | META | klucz dokumentacyjny `_` |
| `river_attack_mult` | (top) | BRAK |  |
| `brod` | (top) | BRAK |  |
| `ruchMult` | brod | BRAK |  |
| `karaAtak` | brod | BRAK |  |
| `karaObrona` | brod | BRAK |  |
| `bonusObronaBrzegu` | brod | BRAK |  |
| `oblężenie` | (top) | BRAK |  |
| `wall_base_obrona` | oblężenie | BRAK |  |
| `wall_per_level_obrona` | oblężenie | BRAK |  |
| `wall_max_level` | oblężenie | BRAK |  |
| `wall_pancerz_fraction` | oblężenie | BRAK |  |
| `hill_defense_mult` | oblężenie | BRAK |  |
| `mountain_defense_mult` | oblężenie | BRAK |  |
| `fortify_obrona_bonus` | oblężenie | BRAK |  |
| `fortify_obrona_proc` | oblężenie | BRAK |  |
| `_fortify_obrona_proc_opis` | oblężenie | META | klucz dokumentacyjny `_` |
| `militia_pop_fraction` | oblężenie | BRAK |  |
| `militia_strength_fraction` | oblężenie | BRAK |  |
| `siege_max_rounds` | oblężenie | BRAK |  |
| `siege_ai` | (top) | BRAK |  |
| `t1_assault_ratio` | siege_ai | BRAK |  |
| `t2_build_min_ratio` | siege_ai | BRAK |  |
| `t3_starve_min_ratio` | siege_ai | BRAK |  |
| `t2_max_wait_turns` | siege_ai | BRAK |  |
| `units_per_extra_machine` | siege_ai | BRAK |  |
| `unit_power` | (top) | BRAK |  |
| `charge_divisor` | unit_power | BRAK |  |
| `missile_divisor` | unit_power | BRAK |  |
| `hp_field_divisor` | unit_power | BRAK |  |
| `hp_siege_divisor` | unit_power | BRAK |  |
| `battle_loot` | (top) | BRAK |  |
| `recruit_cost_pct` | battle_loot | BRAK |  |

### counters.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `Typ atakujący` | (top) | BRAK |  |
| `Cel (typ)` | (top) | BRAK |  |
| `Bonus` | (top) | BRAK |  |
| `Rodzaj (Atak/Obrona)` | (top) | BRAK |  |
| `Status` | (top) | SLOWO (słaby) | zbieżność nazwy, NIE mapowanie: Rust `diplomacy.rs:110` `status` to pole `Relation` (status relacji dyplomatycznej), nie statystyka z counters.json |

### diplomacy-acceptance-points.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `_opis` | (top) | META | klucz dokumentacyjny `_` |
| `traktaty` | (top) | BRAK |  |
| `pokoj` | traktaty | SERDE | src/domain/diplomacy.rs:75 (+3) |
| `punkty` | traktaty | BRAK |  |
| `jednostka` | traktaty | SERDE | src/domain/diplomacy.rs:1697 |
| `uwaga` | traktaty | BRAK |  |
| `sojusz_pelny` | traktaty | SERDE | src/domain/diplomacy.rs:1366 (+1) |
| `prog_relacja` | traktaty | BRAK |  |
| `sojusz_defensywny` | traktaty | SERDE | src/domain/diplomacy.rs:1364 (+1) |
| `nap` | traktaty | SERDE | src/domain/diplomacy.rs:690 (+2) |
| `umowa_szlakow` | traktaty | SERDE | src/domain/diplomacy.rs:1370 (+1) |
| `umowa_handlowa` | traktaty | SERDE | src/domain/diplomacy.rs:1370 (+1) |
| `handel` | traktaty | SERDE | src/domain/diplomacy.rs:538 (+2) |
| `granice` | traktaty | SERDE | src/domain/diplomacy.rs:2716 |
| `tech` | traktaty | SERDE | src/domain/diplomacy.rs:1695 (+2) |
| `wasal` | traktaty | SERDE | src/domain/diplomacy.rs:1372 (+1) |
| `prog_respekt` | traktaty | BRAK |  |
| `trybut_zadanie` | traktaty | SERDE | src/domain/diplomacy.rs:2712 |
| `trybut_oferta` | traktaty | SERDE | src/domain/diplomacy.rs:2714 |
| `namow_wojne` | traktaty | SERDE | src/domain/diplomacy.rs:2720 |
| `prog_zaufanie` | traktaty | BRAK |  |
| `ultimatum` | traktaty | SERDE | src/domain/diplomacy.rs:2722 |
| `dar` | traktaty | SERDE | src/domain/diplomacy.rs:550 |
| `koszyk_pn` | (top) | BRAK |  |
| `zloto` | koszyk_pn | SERDE | src/domain/diplomacy.rs:1411 (+3) |
| `pn_per_unit` | koszyk_pn | BRAK |  |
| `zrodlo` | koszyk_pn | BRAK |  |
| `praca` | koszyk_pn | SERDE | src/domain/diplomacy.rs:1413 (+2) |
| `zywnosc` | koszyk_pn | SERDE | src/domain/diplomacy.rs:1691 (+1) |
| `surowiec_ilosc` | koszyk_pn | SERDE | src/domain/diplomacy.rs:1701 |
| `pn_per_szt` | koszyk_pn | BRAK |  |
| `drewno` | koszyk_pn | SERDE | src/domain/resource_production.rs:8 |
| `glina` | koszyk_pn | SERDE | src/domain/improvements.rs:53 (+2) |
| `kamien` | koszyk_pn | SERDE | src/domain/improvements.rs:189 (+1) |
| `ruda` | koszyk_pn | SERDE | src/domain/resource_production.rs:14 |
| `ruda_zelaza` | koszyk_pn | SERDE | src/domain/resource_production.rs:16 |
| `cegla` | koszyk_pn | LITERAL (słaby) | src/domain/building_costs.rs:126 (+19) |
| `sol` | koszyk_pn | SERDE | src/domain/improvements.rs:63 (+1) |
| `kon` | koszyk_pn | SERDE | src/domain/improvements.rs:51 (+1) |
| `ceramika` | koszyk_pn | LITERAL (słaby) | src/domain/diplomacy.rs:1775 (+1) |
| `braz` | koszyk_pn | LITERAL (słaby) | src/domain/diplomacy.rs:1776 (+87) |
| `zelazo` | koszyk_pn | SERDE | src/domain/improvements.rs:57 |
| `stal` | koszyk_pn | LITERAL (słaby) | src/domain/diplomacy.rs:1778 (+1) |
| `wegiel` | koszyk_pn | LITERAL (słaby) | src/domain/diplomacy.rs:1780 (+1) |
| `zloze` | koszyk_pn | SERDE | src/domain/diplomacy.rs:1693 |
| `przyklady` | koszyk_pn | BRAK |  |
| `konie` | koszyk_pn | LITERAL (słaby) | src/domain/diplomacy.rs:1836 |
| `miedz` | koszyk_pn | SERDE | src/domain/improvements.rs:55 |
| `sweetener` | (top) | BRAK |  |
| `pn_na_punkt_ease` | sweetener | BRAK |  |
| `max_ease_punkty` | sweetener | BRAK |  |
| `opis` | sweetener | BRAK |  |
| `fair_trade` | (top) | BRAK |  |
| `kurs_relacja_baza` | fair_trade | BRAK |  |

### diplomacy.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `params` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `handelZawarcie_zaufanie` | params | BRAK |  |
| `pomocSojusznikowi_zaufanie` | params | BRAK |  |
| `wspolnyWrogNawiazanie_zaufanie` | params | BRAK |  |
| `dar_zaufanie` | params | BRAK |  |
| `zlamanaPaktGracz_zaufanie` | params | BRAK |  |
| `zlamanaPaktAI_zaufanie` | params | BRAK |  |
| `zdrada_zaufanie` | params | BRAK |  |
| `szpiegWykryty_zaufanie` | params | BRAK |  |
| `rywalizacjaTenSamTyp_zaufanie` | params | BRAK |  |
| `miastoPanstwoSameCiv_zaufanie` | params | BRAK |  |
| `roznicaKulturowa_zaufanie` | params | BRAK |  |
| `przewagaMilitarna_respekt` | params | BRAK |  |
| `slabszyMilitarnie_respekt` | params | BRAK |  |
| `wygraBitwa_respekt` | params | BRAK |  |
| `trybut_respekt` | params | BRAK |  |
| `wspolnyWrogAkceptacja_respekt` | params | BRAK |  |
| `handel_zaufanie_perTura` | params | BRAK |  |
| `sojusz_zaufanie_perTura` | params | BRAK |  |
| `nap_zaufanie_perTura` | params | BRAK |  |
| `pokoj_zaufanie_perTura` | params | BRAK |  |
| `aktywnyPakt_zaufanie_perTura` | params | BRAK |  |
| `dobraWola_zaufanie_perTura` | params | BRAK |  |
| `wspolnyWrog_zaufanie_perTura` | params | BRAK |  |
| `wspolnaReligia_zaufanie_perTura` | params | BRAK |  |
| `odmiennaReligia_zaufanie_perTura` | params | BRAK |  |
| `ekspansjaGranica_zaufanie_perTura` | params | BRAK |  |
| `urazyHistoryczne_zaufanie_perTura` | params | BRAK |  |
| `progSojuszZaufanie` | params | BRAK |  |
| `progWymianaTechZaufanie` | params | BRAK |  |
| `progWasalizacjaRespekt` | params | BRAK |  |
| `progWchloniecieRespekt` | params | BRAK |  |
| `progMinimalnyRelacja` | params | BRAK |  |
| `progSojuszRelacja` | params | BRAK |  |
| `progUmowaMinRelacja` | params | BRAK |  |
| `startZaufanie` | params | BRAK |  |
| `startRespekt` | params | BRAK |  |
| `mnoznikZaufania` | params | BRAK |  |
| `mnoznikRespektu` | params | BRAK |  |
| `mnoznikPodarunku` | params | BRAK |  |
| `turyEfektuPodarunku` | params | BRAK |  |
| `progPoboczneAkceptacja` | params | BRAK |  |
| `progPoboczneHandel` | params | BRAK |  |
| `progPoboczneWojna` | params | BRAK |  |
| `progNapRelacja` | params | BRAK |  |
| `progHandelRelacja` | params | BRAK |  |
| `progSojuszPartnerRwMin` | params | BRAK |  |
| `progSojuszPartnerRwMax` | params | BRAK |  |
| `progSojuszPremiaSilniejszyMax` | params | BRAK |  |
| `progSojuszPremiaMilSkok` | params | BRAK |  |
| `progSojuszPremiaRespektSkok` | params | BRAK |  |
| `progSojuszSlabyProponentMilRatio` | params | BRAK |  |
| `progSojuszPremiaSilniejszyInny` | params | BRAK |  |
| `progSojuszWillingnessMin` | params | BRAK |  |
| `progSojuszKaraSilniejszyMax` | params | BRAK |  |
| `progSojuszKaraMilSkok` | params | BRAK |  |
| `progSojuszKaraAllySkok` | params | BRAK |  |
| `progSojuszHegemonMilRatio` | params | BRAK |  |
| `progSojuszHegemonProposerMaxMil` | params | BRAK |  |
| `progSojuszPremiaGracz2xMilRatio` | params | BRAK |  |
| `progSojuszPremiaGracz2xMinZaufanie` | params | BRAK |  |
| `progSojuszPremiaGracz2xBonus` | params | BRAK |  |
| `progSojuszPremiaGracz3xMilRatio` | params | BRAK |  |
| `progSojuszPremiaGracz3xMinZaufanie` | params | BRAK |  |
| `progSojuszPremiaGracz3xBonus` | params | BRAK |  |
| `progTrybutMinGoldPerTurn` | params | BRAK |  |
| `progTrybutZadanieMinRespekt` | params | BRAK |  |
| `progTrybutOfertaNearWarRatio` | params | BRAK |  |
| `progTrybutOfertaNearWarZaufanie` | params | BRAK |  |
| `progTrybutOfertaMinGold` | params | BRAK |  |
| `progTrybutOfertaBaseGold` | params | BRAK |  |
| `progTrybutOfertaEpokaGold` | params | BRAK |  |
| `progHandelWillingnessMin` | params | BRAK |  |
| `progNamowWojneZaufanie` | params | BRAK |  |
| `progNamowWojneBribeBase` | params | BRAK |  |
| `progGraniceZaufanie` | params | BRAK |  |
| `progGraniceRelacja` | params | BRAK |  |
| `progGraniceWojskoweRespekt` | params | BRAK |  |
| `karaPrzemarszNieautoryzowany_zaufanie_perTura` | params | BRAK |  |
| `progUltimatumMilitaryRatio` | params | BRAK |  |
| `progUltimatumMinGold` | params | BRAK |  |
| `progWasalDefaultGoldPerTurn` | params | BRAK |  |
| `graczWchlonieciePoWasaluTur` | params | BRAK |  |
| `graczWchloniecieKosztBaza` | params | BRAK |  |
| `graczWchloniecieKosztPerLudnosc` | params | BRAK |  |
| `graczWchloniecieKosztMin` | params | BRAK |  |
| `wiarygodnoscSkalaMin` | params | BRAK |  |
| `wiarygodnoscSkalaMax` | params | BRAK |  |
| `wiarygodnoscProgWzorCnoty` | params | BRAK |  |
| `wiarygodnoscProgWiarolomny` | params | BRAK |  |
| `wiarygodnoscStartLatwy` | params | BRAK |  |
| `wiarygodnoscStartNormalny` | params | BRAK |  |
| `wiarygodnoscStartTrudny` | params | BRAK |  |
| `wiarygodnoscN1BezOstrzezenia` | params | BRAK |  |
| `wiarygodnoscN1KarencjaTur` | params | BRAK |  |
| `wiarygodnoscN2ZlamaniePaktuNap` | params | BRAK |  |
| `wiarygodnoscN2ZlamaniePaktuSojusz` | params | BRAK |  |
| `wiarygodnoscN3AtakWOknieKarencji` | params | BRAK |  |
| `wiarygodnoscN3KarencjaBezterminoweTur` | params | BRAK |  |
| `wiarygodnoscN4OdmowaObowiazkuSojuszu` | params | BRAK |  |
| `wiarygodnoscN5ZerwanieTraktatCzasowy` | params | BRAK |  |
| `wiarygodnoscN5ZerwanieHandelCzasowy` | params | BRAK |  |
| `wiarygodnoscN6NiedotrzymanieHandluCyklicznego` | params | BRAK |  |
| `wiarygodnoscN6ProgTurZRzedu` | params | BRAK |  |
| `wiarygodnoscN7NieautoryzowanyPrzemarsz` | params | BRAK |  |
| `wiarygodnoscOdwetOknoTur` | params | BRAK |  |
| `wiarygodnoscS1SojuszPerTure` | params | BRAK |  |
| `wiarygodnoscS2NapPerTure` | params | BRAK |  |
| `wiarygodnoscS3HandelPerTureLatwy` | params | BRAK |  |
| `wiarygodnoscS3HandelPerTureNormalny` | params | BRAK |  |
| `wiarygodnoscS3HandelPerTureTrudny` | params | BRAK |  |
| `wiarygodnoscS4PrzemarszPerTureLatwy` | params | BRAK |  |
| `wiarygodnoscS4PrzemarszPerTureNormalny` | params | BRAK |  |
| `wiarygodnoscS4PrzemarszPerTureTrudny` | params | BRAK |  |
| `wiarygodnoscP1FiniszSojusz` | params | BRAK |  |
| `wiarygodnoscP2FiniszNap` | params | BRAK |  |
| `wiarygodnoscP2FiniszHandel` | params | BRAK |  |
| `wiarygodnoscP3FiniszHandelCykliczny` | params | BRAK |  |
| `wiarygodnoscP4BezWojny30Tur` | params | BRAK |  |
| `wiarygodnoscP4OknoBezWojnyTur` | params | BRAK |  |
| `wiarygodnoscP5PomocSojusznikowi` | params | BRAK |  |
| `wiarygodnoscCzasZapomnieniaKaraLatwy` | params | BRAK |  |
| `wiarygodnoscCzasZapomnieniaKaraNormalny` | params | BRAK |  |
| `wiarygodnoscCzasZapomnieniaKaraTrudny` | params | BRAK |  |
| `wiarygodnoscCzasZapomnieniaNagrodaLatwy` | params | BRAK |  |
| `wiarygodnoscCzasZapomnieniaNagrodaNormalny` | params | BRAK |  |
| `wiarygodnoscCzasZapomnieniaNagrodaTrudny` | params | BRAK |  |
| `wiarygodnoscTrwalaPodlogaProcent` | params | BRAK |  |
| `wiarygodnoscZaufanieDzielnikPerTura` | params | BRAK |  |
| `wiarygodnoscTempoAmplituda` | params | BRAK |  |
| `wiarygodnoscZaufanieDryfNa100` | params | BRAK |  |
| `wiarygodnoscProgSojuszMin` | params | BRAK |  |
| `wiarygodnoscProgNapMin` | params | BRAK |  |
| `handel_zloze` | (top) | BRAK |  |
| `_opis` | handel_zloze | META | klucz dokumentacyjny `_` |
| `dostep_scope` | handel_zloze | BRAK |  |
| `prog_relacja_min` | handel_zloze | BRAK |  |
| `kurs_relacja_baza` | handel_zloze | BRAK |  |
| `cena_baza` | handel_zloze | BRAK |  |
| `glina` | handel_zloze | SERDE | src/domain/improvements.rs:53 (+2) |
| `sol` | handel_zloze | SERDE | src/domain/improvements.rs:63 (+1) |
| `konie` | handel_zloze | LITERAL (słaby) | src/domain/diplomacy.rs:1836 |
| `wegiel` | handel_zloze | LITERAL (słaby) | src/domain/diplomacy.rs:1780 (+1) |
| `miedz` | handel_zloze | SERDE | src/domain/improvements.rs:55 |
| `zelazo` | handel_zloze | SERDE | src/domain/improvements.rs:57 |
| `handel_waluta` | (top) | BRAK |  |
| `wartosc_katalog` | (top) | BRAK |  |
| `decyzja` | wartosc_katalog | BRAK |  |
| `pn_zloto` | wartosc_katalog | BRAK |  |
| `skala` | wartosc_katalog | BRAK |  |
| `zrodlo` | wartosc_katalog | BRAK |  |
| `pn_praca` | wartosc_katalog | BRAK |  |
| `pn_tech` | wartosc_katalog | BRAK |  |
| `pole` | wartosc_katalog | BRAK |  |
| `tempo` | wartosc_katalog | BRAK |  |
| `pn_zloze` | wartosc_katalog | BRAK |  |
| `scope` | wartosc_katalog | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `pn_ulepszenie` | wartosc_katalog | BRAK |  |
| `handel` | wartosc_katalog | SERDE | src/domain/diplomacy.rs:538 (+2) |
| `uwaga` | wartosc_katalog | BRAK |  |
| `pn_jednostka` | wartosc_katalog | BRAK |  |
| `pn_budynek` | wartosc_katalog | BRAK |  |
| `skalowanie` | wartosc_katalog | BRAK |  |
| `pn_budynek_skalowanie` | wartosc_katalog | BRAK |  |
| `pn_surowiec_boolean` | wartosc_katalog | BRAK |  |
| `regula` | wartosc_katalog | BRAK |  |
| `pn_zywnosc` | wartosc_katalog | BRAK |  |
| `jednostki_na_pn` | wartosc_katalog | BRAK |  |
| `handel_prog_relacja` | wartosc_katalog | BRAK |  |
| `dostep_zloze_wojna` | wartosc_katalog | BRAK |  |
| `utrata_w_trakcie_wojny` | wartosc_katalog | BRAK |  |
| `wymaga_renegocjacji_po_pokoju` | wartosc_katalog | BRAK |  |
| `pn_relacja` | (top) | BRAK |  |
| `pn_na_zaufanie` | pn_relacja | BRAK |  |
| `max_zaufanie_na_ture` | pn_relacja | BRAK |  |
| `min_nadmiar_pn` | pn_relacja | BRAK |  |
| `prog_dar_relacja` | pn_relacja | BRAK |  |
| `dobra_wola_po_wymianie` | pn_relacja | BRAK |  |
| `dobra_wola_tur` | pn_relacja | BRAK |  |
| `dobra_wola_min_nadmiar_pn` | pn_relacja | BRAK |  |
| `dobra_wola_zaufanie_per_tura` | pn_relacja | BRAK |  |
| `akcje_dyplomatyczne` | (top) | BRAK |  |
| `Akcja` | akcje_dyplomatyczne | BRAK |  |
| `Opis` | akcje_dyplomatyczne | BRAK |  |
| `Dostępne: Główni rywale` | akcje_dyplomatyczne | BRAK |  |
| `Dostępne: Poboczni` | akcje_dyplomatyczne | BRAK |  |
| `Koszt` | akcje_dyplomatyczne | BRAK |  |
| `Efekt` | akcje_dyplomatyczne | BRAK |  |
| `parametry_relacji` | (top) | BRAK |  |
| `Parametr` | parametry_relacji | BRAK |  |
| `Zakres` | parametry_relacji | BRAK |  |
| `Wartość startowa` | parametry_relacji | BRAK |  |
| `zmiany_parametrów` | (top) | BRAK |  |
| `Zdarzenie / Działanie` | zmiany_parametrów | BRAK |  |
| `Zmiana` | zmiany_parametrów | BRAK |  |
| `Znak (+/−)` | zmiany_parametrów | BRAK |  |
| `Typ (co turę / jednorazowo)` | zmiany_parametrów | BRAK |  |
| `Uwagi` | zmiany_parametrów | BRAK |  |
| `respekt_-_czynniki` | (top) | BRAK |  |
| `Czynnik` | respekt_-_czynniki | BRAK |  |
| `Waga (%)` | respekt_-_czynniki | BRAK |  |
| `panel_sterowania` | (top) | BRAK |  |
| `A` | panel_sterowania | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `name` | panel_sterowania | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `records` | panel_sterowania | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `Komponent Potegi` | panel_sterowania | BRAK |  |
| `Klucz` | panel_sterowania | BRAK |  |
| `B` | panel_sterowania | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `Wartość` | panel_sterowania | BRAK |  |
| `C` | panel_sterowania | BRAK |  |
| `Akcja / warunek` | panel_sterowania | BRAK |  |
| `Próg` | panel_sterowania | BRAK |  |
| `D` | panel_sterowania | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `Stan / zdarzenie ciągłe` | panel_sterowania | BRAK |  |
| `Δ Zaufanie/turę` | panel_sterowania | BRAK |  |
| `E` | panel_sterowania | BRAK |  |
| `Mnożnik / parametr` | panel_sterowania | BRAK |  |
| `F` | panel_sterowania | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `DANE WEJŚCIOWE (żółte = edytowalne)` | panel_sterowania | BRAK |  |
| `WYNIKI (zielone = formuły)` | panel_sterowania | BRAK |  |
| `perNacja` | (top) | BRAK |  |
| `Cywilizacja` | perNacja | BRAK |  |
| `sklonnoscSojusze` | perNacja | BRAK |  |
| `lojalnosc` | perNacja | BRAK |  |
| `progWojny` | perNacja | BRAK |  |
| `pamietliwosc` | perNacja | BRAK |  |
| `otwartoscHandel` | perNacja | BRAK |  |
| `nastawienieBazowe` | perNacja | BRAK |  |
| `uwagi` | perNacja | BRAK |  |

### e-start-params.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `_opis` | (top) | META | klucz dokumentacyjny `_` |
| `defaulty` | (top) | BRAK |  |
| `player_civ_id` | defaulty | BRAK |  |
| `start_epoch_id` | defaulty | BRAK |  |
| `map_quality_default` | defaulty | BRAK |  |
| `render_quality_bundled` | defaulty | BRAK |  |
| `city_limit_base_default` | defaulty | BRAK |  |
| `skala_mapy` | (top) | BRAK |  |
| `Malenki` | skala_mapy | BRAK |  |
| `rywale_ai` | skala_mapy | BRAK |  |
| `miasta_panstwa` | skala_mapy | BRAK |  |
| `typy_cywilizacji` | skala_mapy | BRAK |  |
| `typy_cywilizacji_per_epoka` | skala_mapy | BRAK |  |
| `kamien` | skala_mapy | SERDE | src/domain/improvements.rs:189 (+1) |
| `default` | skala_mapy | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `min` | skala_mapy | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `max` | skala_mapy | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `braz` | skala_mapy | LITERAL (słaby) | src/domain/diplomacy.rs:1776 (+87) |
| `zelazo` | skala_mapy | SERDE | src/domain/improvements.rs:57 |
| `hex_w` | skala_mapy | BRAK |  |
| `hex_h` | skala_mapy | BRAK |  |
| `Mały` | skala_mapy | LITERAL (słaby) | tests/playable_slice.rs:133 (+1) |
| `Standardowy` | skala_mapy | LITERAL (słaby) | src/domain/playable.rs:131 (+2) |
| `Duży` | skala_mapy | BRAK |  |
| `Ogromny` | skala_mapy | BRAK |  |
| `Super Huge` | skala_mapy | LITERAL (słaby) | tests/playable_slice.rs:154 |
| `generator_e2` | (top) | BRAK |  |
| `resource_mult_low` | generator_e2 | BRAK |  |
| `resource_mult_normal` | generator_e2 | BRAK |  |
| `resource_mult_high` | generator_e2 | BRAK |  |
| `resource_baseline_rarity` | generator_e2 | BRAK |  |
| `river_base_low` | generator_e2 | BRAK |  |
| `river_base_normal` | generator_e2 | BRAK |  |
| `river_base_high` | generator_e2 | BRAK |  |
| `river_scale_mala` | generator_e2 | BRAK |  |
| `river_scale_srednia` | generator_e2 | BRAK |  |
| `river_scale_duza` | generator_e2 | BRAK |  |
| `river_scale_ogromna` | generator_e2 | BRAK |  |
| `desert_threshold_low` | generator_e2 | BRAK |  |
| `desert_threshold_normal` | generator_e2 | BRAK |  |
| `desert_threshold_high` | generator_e2 | BRAK |  |
| `forest_threshold_low` | generator_e2 | BRAK |  |
| `forest_threshold_normal` | generator_e2 | BRAK |  |
| `forest_threshold_high` | generator_e2 | BRAK |  |
| `tempo_gry` | (top) | BRAK |  |
| `szybka` | tempo_gry | BRAK |  |
| `standardowa` | tempo_gry | BRAK |  |
| `dluga` | tempo_gry | BRAK |  |
| `city_limits` | (top) | BRAK |  |
| `10` | city_limits | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `15` | city_limits | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `20` | city_limits | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `koszt_budynkow_pace` | (top) | BRAK |  |
| `niski` | koszt_budynkow_pace | LITERAL (słaby) | src/domain/playable.rs:75 (+2) |
| `normalny` | koszt_budynkow_pace | LITERAL (słaby) | src/domain/barbarians.rs:335 (+3) |
| `wysoki` | koszt_budynkow_pace | LITERAL (słaby) | src/domain/playable.rs:77 (+2) |
| `koszt_jednostek_pace` | (top) | BRAK |  |
| `zwyciestwo` | (top) | BRAK |  |
| `ostatnia_epoka_v1` | zwyciestwo | BRAK |  |
| `prog_dominacji_power` | zwyciestwo | BRAK |  |
| `dominacja_wymaga_ostatniej_epoki` | zwyciestwo | BRAK |  |
| `nauka_wymaga_rakiety` | zwyciestwo | BRAK |  |
| `kreator_zaawansowane` | (top) | BRAK |  |
| `seed_mode_default` | kreator_zaawansowane | BRAK |  |
| `manual_seed_default` | kreator_zaawansowane | BRAK |  |
| `barbarians_enabled_default` | kreator_zaawansowane | BRAK |  |
| `battle_always_manual_default` | kreator_zaawansowane | BRAK |  |
| `fog_debug_reveal_all_default` | kreator_zaawansowane | BRAK |  |
| `victory_power_and_dominance_default` | kreator_zaawansowane | BRAK |  |
| `decyzje_kanon` | (top) | BRAK |  |
| `e1_reset_nowa_gra` | decyzje_kanon | BRAK |  |
| `e1_tech_kaskada_epok` | decyzje_kanon | BRAK |  |
| `e1_ziemia_preset_staly` | decyzje_kanon | BRAK |  |
| `e1_zloza_tylko_gory` | decyzje_kanon | BRAK |  |
| `e1_zloza_ukryte_do_epoki` | decyzje_kanon | BRAK |  |
| `e2_barbarzyncy_do_przed_sredniowiecza` | decyzje_kanon | BRAK |  |
| `e2_buntownicy_od_sredniowiecza` | decyzje_kanon | BRAK |  |

### econ-params.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `ekonomia_miasta` | (top) | SERDE | src/domain/trade.rs:1871 |
| `próg_wzrostu_wspolczynnik` | ekonomia_miasta | BRAK |  |
| `easy` | ekonomia_miasta | SERDE | src/domain/diplomacy.rs:424 |
| `normal` | ekonomia_miasta | SERDE | src/domain/diplomacy.rs:427 |
| `hard` | ekonomia_miasta | SERDE | src/domain/diplomacy.rs:429 |
| `jednostka` | ekonomia_miasta | SERDE | src/domain/diplomacy.rs:1697 |
| `opis` | ekonomia_miasta | BRAK |  |
| `spichlerz_zachowanie_po_wzroscie` | ekonomia_miasta | BRAK |  |
| `handel_surowiec_min_stock` | ekonomia_miasta | LITERAL (słaby) | src/domain/trade.rs:1937 |
| `akwedukt_prog_ludnosci` | ekonomia_miasta | BRAK |  |
| `spichlerz_prog_ludnosci` | ekonomia_miasta | BRAK |  |
| `akwedukt_max_ludnosci` | ekonomia_miasta | BRAK |  |
| `zywnosc_zuzytka_populacja` | ekonomia_miasta | BRAK |  |
| `zywnosc_jednostka_ruch` | ekonomia_miasta | BRAK |  |
| `zywnosc_jednostka_oboz` | ekonomia_miasta | BRAK |  |
| `suwak_handel_nauka_domyslnie` | ekonomia_miasta | BRAK |  |
| `suwak_handel_pieniadz_domyslnie` | ekonomia_miasta | BRAK |  |
| `suwak_handel_luksus_domyslnie` | ekonomia_miasta | BRAK |  |
| `suwak_praca_budynki_domyslnie` | ekonomia_miasta | BRAK |  |
| `suwak_praca_teren_domyslnie` | ekonomia_miasta | BRAK |  |
| `suwak_zywnosc_rozwoj_domyslnie` | ekonomia_miasta | BRAK |  |
| `glod_wojska_hp_frac` | ekonomia_miasta | BRAK |  |
| `glod_wojska_karencja_tur` | ekonomia_miasta | BRAK |  |
| `glod_wojska_stat_mult` | ekonomia_miasta | BRAK |  |
| `zloto_deficyt_hp_frac` | ekonomia_miasta | BRAK |  |
| `zloto_deficyt_karencja_tur` | ekonomia_miasta | BRAK |  |
| `zloto_deficyt_stat_mult` | ekonomia_miasta | BRAK |  |
| `zywnosc_mnoznik_terytorium_wlasne` | ekonomia_miasta | BRAK |  |
| `zywnosc_mnoznik_poza_terytorium` | ekonomia_miasta | BRAK |  |
| `spichlerz_pojemnosc_zapasow_panstwa` | ekonomia_miasta | BRAK |  |
| `armia_odklad_bez_spichlerza` | ekonomia_miasta | BRAK |  |
| `armia_odklad_ze_spichlerzem` | ekonomia_miasta | BRAK |  |
| `racje_zywnosc_1` | ekonomia_miasta | BRAK |  |
| `racje_zywnosc_2` | ekonomia_miasta | BRAK |  |
| `racje_zywnosc_3` | ekonomia_miasta | BRAK |  |
| `racje_wzrost_proc_1` | ekonomia_miasta | BRAK |  |
| `racje_wzrost_proc_2` | ekonomia_miasta | BRAK |  |
| `racje_wzrost_proc_3` | ekonomia_miasta | BRAK |  |
| `korupcja_wspolczynnik_dystansu` | ekonomia_miasta | BRAK |  |
| `korupcja_wspolczynnik_miast` | ekonomia_miasta | BRAK |  |
| `korupcja_cap` | ekonomia_miasta | BRAK |  |
| `budynki` | (top) | BRAK |  |
| `budynek_mlyn_mnoznik_pracy` | budynki | BRAK |  |
| `budynek_mlyn_bonus_pracy` | budynki | BRAK |  |
| `budynek_cegielnia_bonus_pracy` | budynki | BRAK |  |
| `budynek_targowisko_bonus_handlu` | budynki | BRAK |  |
| `budynek_stolarnia_bonus_drewna_civ` | budynki | BRAK |  |
| `budynek_kamieniarski_bonus_kamienia_civ` | budynki | BRAK |  |
| `budynek_garncarnia_bonus_zywnosci_lokalnie` | budynki | BRAK |  |
| `ulepszenie_surowcowe_upkeep_praca` | budynki | BRAK |  |
| `budynek_mennica_mnoznik` | budynki | BRAK |  |
| `budynek_biblioteka_bonus_nauki` | budynki | BRAK |  |
| `budynek_akademia_bonus_nauki` | budynki | BRAK |  |
| `waluta_mnoznik` | budynki | BRAK |  |
| `targowisko_praca_na_pieniadz_mnoznik` | budynki | BRAK |  |
| `budynek_tartak_przepustowosc` | budynki | BRAK |  |
| `budynek_cegielnia_przepustowosc` | budynki | BRAK |  |
| `budynek_huta_przepustowosc` | budynki | BRAK |  |
| `budynek_odlewnia_zelaza_przepustowosc` | budynki | BRAK |  |
| `budynek_wielka_odlewnia_przepustowosc` | budynki | BRAK |  |
| `budynek_garncarnia_przepustowosc` | budynki | BRAK |  |
| `budynek_spichlerz_zuzywa_ceramika` | budynki | BRAK |  |
| `budynek_spichlerz_ii_zuzywa_sol` | budynki | BRAK |  |
| `budynek_spichlerz_ii_zuzywa_ceramika` | budynki | BRAK |  |
| `utrzymanie_budynek` | budynki | BRAK |  |
| `teren_mapa` | (top) | BRAK |  |
| `teren_rzeka_zywnosc` | teren_mapa | BRAK |  |
| `teren_rzeka_praca` | teren_mapa | BRAK |  |
| `teren_rzeka_handel` | teren_mapa | BRAK |  |
| `teren_las_zywnosc` | teren_mapa | BRAK |  |
| `teren_las_handel` | teren_mapa | BRAK |  |
| `teren_las_drewno` | teren_mapa | BRAK |  |
| `teren_las_praca` | teren_mapa | BRAK |  |
| `ulepszenie_farma_zywnosc` | teren_mapa | BRAK |  |
| `ulepszenie_irygacja_zywnosc` | teren_mapa | BRAK |  |
| `ulepszenie_kopalnia_kamien` | teren_mapa | BRAK |  |
| `ulepszenie_droga_ruch` | teren_mapa | BRAK |  |
| `ulepszenie_pastwisko_bydlo_produkcja` | teren_mapa | BRAK |  |
| `ulepszenie_pastwisko_owce_zywnosc` | teren_mapa | BRAK |  |
| `wealth` | (top) | BRAK |  |
| `wealth_cap_na_epoke` | wealth | BRAK |  |
| `wealth_prog_na_poziom` | wealth | BRAK |  |
| `wealth_mnoznik_na_poziom` | wealth | BRAK |  |
| `wealth_utrzymanie_baza` | wealth | BRAK |  |
| `wealth_utrzymanie_przy_cap` | wealth | BRAK |  |
| `wealth_zachowanie_po_awansie` | wealth | BRAK |  |
| `wealth_zadowolenie_max` | wealth | BRAK |  |
| `wealth_kara_zero` | wealth | BRAK |  |
| `wealth_immunitet_tur` | wealth | BRAK |  |
| `globalne` | (top) | BRAK |  |
| `kurs_pieniadz_praca` | globalne | BRAK |  |
| `mennica_mnoznik_po_walucie` | globalne | BRAK |  |
| `luksus_przelicznik_zadowolenie` | globalne | BRAK |  |
| `magazyn_baza_zywnosc` | globalne | BRAK |  |
| `magazyn_baza_surowce` | globalne | BRAK |  |
| `magazyn_bonus_surowce_na_budynek` | globalne | BRAK |  |
| `magazyn_centralny_baza_zywnosc` | globalne | BRAK |  |
| `magazyn_centralny_bonus_zywnosc_na_budynek` | globalne | BRAK |  |
| `magazyn_mnoznik_spichlerz` | globalne | BRAK |  |
| `utrzymanie_jednostka_standard` | globalne | BRAK |  |
| `ai_rush_jednostka_rezerwa_zlota` | globalne | BRAK |  |
| `ai_rush_jednostka_max_na_ture` | globalne | BRAK |  |
| `ai_suwaki_deficyt_zywnosc_prog` | globalne | BRAK |  |
| `ai_suwaki_nadwyzka_zywnosc_prog` | globalne | BRAK |  |
| `ai_suwaki_krok_zywnosc_rozwoj` | globalne | BRAK |  |
| `ai_suwaki_krok_praca_nauka` | globalne | BRAK |  |
| `ai_suwaki_min_odstep_tur` | globalne | BRAK |  |
| `skarbiec_centralny_lokalizacja` | globalne | BRAK |  |
| `handel_szlaki` | (top) | SERDE | src/domain/trade.rs:1869 |
| `lad_max_dystans` | handel_szlaki | LITERAL (słaby) | src/domain/trade.rs:1889 (+1) |
| `morze_max_dystans` | handel_szlaki | LITERAL (słaby) | src/domain/trade.rs:1893 (+1) |
| `dochody_ladowe` | handel_szlaki | BRAK |  |
| `dochody_morskie` | handel_szlaki | BRAK |  |
| `handel_surowce` | (top) | BRAK |  |
| `cena_drewno` | handel_surowce | BRAK |  |
| `cena_glina` | handel_surowce | BRAK |  |
| `cena_kamien` | handel_surowce | BRAK |  |
| `cena_ruda` | handel_surowce | BRAK |  |
| `cena_ruda_zelaza` | handel_surowce | BRAK |  |
| `cena_ruda_cyny` | handel_surowce | BRAK |  |
| `cena_cegla` | handel_surowce | BRAK |  |
| `cena_sol` | handel_surowce | BRAK |  |
| `cena_kon` | handel_surowce | BRAK |  |
| `cena_ceramika` | handel_surowce | BRAK |  |
| `cena_braz` | handel_surowce | BRAK |  |
| `cena_zelazo` | handel_surowce | BRAK |  |
| `cena_stal` | handel_surowce | BRAK |  |
| `cena_zloto` | handel_surowce | BRAK |  |
| `cena_wegiel` | handel_surowce | BRAK |  |
| `pakiet_wielkosc` | handel_surowce | BRAK |  |

### epoka-ludnosc-manpower.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `_opis` | (top) | META | klucz dokumentacyjny `_` |
| `_formuly` | (top) | META | klucz dokumentacyjny `_` |
| `ludnoscAbsolutna` | _formuly | BRAK |  |
| `manpowerMax` | _formuly | BRAK |  |
| `kosztRekrutacji` | _formuly | BRAK |  |
| `epoki` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `epoka` | epoki | BRAK |  |
| `ludekNaLudka` | epoki | BRAK |  |
| `manpowerNaLudka` | epoki | BRAK |  |
| `manpowerNaJednostke` | epoki | BRAK |  |

### map-gen-params.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `_meta` | (top) | META | klucz dokumentacyjny `_` |
| `opis` | _meta | BRAK |  |
| `panel` | _meta | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `export` | _meta | BRAK |  |
| `mgla` | (top) | BRAK |  |
| `default_sight_jednostki` | mgla | BRAK |  |
| `wartosc` | mgla | BRAK |  |
| `gestosc` | (top) | BRAK |  |
| `surowce_mult` | gestosc | BRAK |  |
| `low` | gestosc | LITERAL (słaby) | tests/playable_slice.rs:180 (+2) |
| `medium` | gestosc | LITERAL (słaby) | src/domain/playable.rs:36 (+11) |
| `high` | gestosc | LITERAL (słaby) | tests/playable_slice.rs:176 (+6) |
| `baseline_rarity_mult` | gestosc | BRAK |  |
| `rzeki_max_mala_mapa` | gestosc | BRAK |  |
| `river_scale` | gestosc | BRAK |  |
| `mala` | gestosc | BRAK |  |
| `srednia` | gestosc | BRAK |  |
| `duza` | gestosc | BRAK |  |
| `ogromna` | gestosc | BRAK |  |
| `super` | gestosc | LITERAL (słaby) | src/domain/diplomacy.rs:3942 (+1) |
| `desert_noise_threshold` | gestosc | BRAK |  |
| `forest_noise_threshold` | gestosc | BRAK |  |
| `mountain_noise_threshold` | gestosc | BRAK |  |
| `highland_noise_threshold` | gestosc | BRAK |  |
| `relief_land_fraction` | gestosc | BRAK |  |
| `mountain` | gestosc | BRAK |  |
| `highland` | gestosc | BRAK |  |
| `relief_overflow_cap_frac` | gestosc | BRAK |  |
| `_opis` | gestosc | META | klucz dokumentacyjny `_` |
| `pasma_gorskie` | gestosc | BRAK |  |
| `hexy_na_pasmo` | gestosc | BRAK |  |
| `max_pasm_na_mase` | gestosc | BRAK |  |
| `dlugosc_min` | gestosc | BRAK |  |
| `dlugosc_max` | gestosc | BRAK |  |
| `min_masa_hexow` | gestosc | BRAK |  |
| `obrzeze_szansa` | gestosc | BRAK |  |
| `mapa_skala` | (top) | BRAK |  |
| `aktywne_typy` | mapa_skala | BRAK |  |
| `domyslni_rywale` | mapa_skala | BRAK |  |
| `generator` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `default_width` | generator | BRAK |  |
| `default_height` | generator | BRAK |  |
| `rozmiar_dims` | generator | BRAK |  |
| `malenki` | generator | LITERAL (słaby) | src/domain/playable.rs:604 |
| `maly` | generator | LITERAL (słaby) | src/domain/playable.rs:610 |
| `standardowy` | generator | BRAK |  |
| `duzy` | generator | BRAK |  |
| `ogromny` | generator | BRAK |  |
| `superogromny` | generator | BRAK |  |
| `deposit_rules` | (top) | BRAK |  |
| `miedz` | deposit_rules | SERDE | src/domain/improvements.rs:55 |
| `rarity` | deposit_rules | BRAK |  |
| `zelazo` | deposit_rules | SERDE | src/domain/improvements.rs:57 |
| `glina` | deposit_rules | SERDE | src/domain/improvements.rs:53 (+2) |
| `konie` | deposit_rules | LITERAL (słaby) | src/domain/diplomacy.rs:1836 |
| `wegiel` | deposit_rules | LITERAL (słaby) | src/domain/diplomacy.rs:1780 (+1) |
| `sol` | deposit_rules | SERDE | src/domain/improvements.rs:63 (+1) |
| `zloto` | deposit_rules | SERDE | src/domain/diplomacy.rs:1411 (+3) |
| `cyna` | deposit_rules | SERDE | src/domain/improvements.rs:59 |
| `metal_deposit_min_era` | (top) | BRAK |  |

### miasto-params.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `min_dystans_miast` | (top) | BRAK |  |
| `wartosc` | min_dystans_miast | BRAK |  |
| `jednostka` | min_dystans_miast | SERDE | src/domain/diplomacy.rs:1697 |
| `opis` | min_dystans_miast | BRAK |  |
| `jednostka_koszt_ludnosci` | (top) | BRAK |  |
| `manpower_regen_proc_max_tura` | (top) | BRAK |  |
| `manpower_regen_blok_oblezenie` | (top) | BRAK |  |
| `manpower_uzupelnienie_hp_proc_max_tura` | (top) | BRAK |  |
| `easy` | manpower_uzupelnienie_hp_proc_max_tura | SERDE | src/domain/diplomacy.rs:424 |
| `normal` | manpower_uzupelnienie_hp_proc_max_tura | SERDE | src/domain/diplomacy.rs:427 |
| `hard` | manpower_uzupelnienie_hp_proc_max_tura | SERDE | src/domain/diplomacy.rs:429 |
| `jednostka_koszt_domyslny` | (top) | BRAK |  |
| `zaloz_miasto_koszt_praca` | (top) | BRAK |  |
| `zaloz_miasto_koszt_ludnosci` | (top) | BRAK |  |
| `jednostka_koszt_rola_wsparcie` | (top) | BRAK |  |
| `jednostka_koszt_rola_dystans` | (top) | BRAK |  |
| `jednostka_koszt_rola_wrecz` | (top) | BRAK |  |
| `jednostka_koszt_rola_konnica` | (top) | BRAK |  |
| `zasieg_okolicy_miasta` | (top) | BRAK |  |
| `zasieg_okolicy_max` | (top) | BRAK |  |
| `praca_udzial_budynki` | (top) | BRAK |  |
| `bonus_obrona_mur_proc` | (top) | BRAK |  |
| `bonus_obrona_cytadela_proc` | (top) | BRAK |  |
| `bonus_obrona_baszta_proc` | (top) | BRAK |  |
| `bonus_obrona_palisada_proc` | (top) | BRAK |  |
| `zasieg_okolicy_baza` | (top) | BRAK |  |
| `zasieg_okolicy_pop5` | (top) | BRAK |  |
| `zasieg_okolicy_pop10` | (top) | BRAK |  |
| `udzial_output_produkcja` | (top) | BRAK |  |
| `udzial_output_pieniadz` | (top) | BRAK |  |
| `udzial_output_nauka` | (top) | BRAK |  |
| `udzial_output_rozwoj` | (top) | BRAK |  |

### power-params.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `_opis` | (top) | META | klucz dokumentacyjny `_` |
| `_nazewnictwo` | (top) | META | klucz dokumentacyjny `_` |
| `pl_ui` | _nazewnictwo | BRAK |  |
| `en` | _nazewnictwo | BRAK |  |
| `wycofane` | _nazewnictwo | BRAK |  |
| `decyzja` | _nazewnictwo | BRAK |  |
| `modul_ts` | _nazewnictwo | BRAK |  |
| `_formuly` | (top) | META | klucz dokumentacyjny `_` |
| `rekrutEkw` | _formuly | BRAK |  |
| `powerBase` | _formuly | BRAK |  |
| `power` | _formuly | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `respekt` | _formuly | SERDE | src/domain/diplomacy.rs:107 |
| `mnoznikEpoki` | (top) | BRAK |  |
| `_status` | mnoznikEpoki | META | klucz dokumentacyjny `_` |
| `1` | mnoznikEpoki | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `2` | mnoznikEpoki | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `3` | mnoznikEpoki | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `4` | mnoznikEpoki | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `5` | mnoznikEpoki | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `6` | mnoznikEpoki | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `7` | mnoznikEpoki | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `8` | mnoznikEpoki | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `9` | mnoznikEpoki | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `10` | mnoznikEpoki | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `skladniki` | (top) | BRAK |  |
| `jednostka_wojskowa` | skladniki | BRAK |  |
| `pkt` | skladniki | BRAK |  |
| `wojskowy` | skladniki | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `opis` | skladniki | BRAK |  |
| `wygrana_bitwa` | skladniki | SERDE | src/domain/diplomacy.rs:556 |
| `ludek` | skladniki | BRAK |  |
| `rekrut_ekw_jednostki` | skladniki | BRAK |  |
| `miasto` | skladniki | BRAK |  |
| `heks_terytorium` | skladniki | BRAK |  |
| `budynki` | skladniki | BRAK |  |
| `tech_zbadane` | skladniki | BRAK |  |
| `ulepszenie_terenu` | skladniki | BRAK |  |
| `kultura_imperium` | skladniki | BRAK |  |
| `religia_jednosc` | skladniki | BRAK |  |
| `kalibracja` | (top) | BRAK |  |
| `scenariusz` | kalibracja | BRAK |  |
| `powerOczekiwany` | kalibracja | BRAK |  |
| `cel` | kalibracja | BRAK |  |
| `opcje` | (top) | BRAK |  |
| `liczy_osadnik_w_armii` | opcje | BRAK |  |
| `wartosc` | opcje | BRAK |  |
| `typ` | opcje | SERDE | src/domain/diplomacy.rs:1718 |
| `bitwa_wspolczynnik_flat` | opcje | BRAK |  |
| `bitwa_power_model` | opcje | BRAK |  |
| `hud_etykieta` | opcje | BRAK |  |
| `hud_etykieta_en` | opcje | BRAK |  |
| `mnoznik_epoki_aktywny` | opcje | BRAK |  |
| `uwagi` | (top) | BRAK |  |
| `power_vs_respekt` | uwagi | BRAK |  |
| `stary_model` | uwagi | BRAK |  |
| `panel_b` | uwagi | BRAK |  |

### resources.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `Surowiec` | (top) | BRAK |  |
| `Typ` | (top) | BRAK |  |
| `Źródło / budynek` | (top) | BRAK |  |
| `Uwagi` | (top) | BRAK |  |

### society-params.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `zdrowie` | (top) | BRAK |  |
| `zdrowie_rzeka` | zdrowie | BRAK |  |
| `easy` | zdrowie | SERDE | src/domain/diplomacy.rs:424 |
| `normal` | zdrowie | SERDE | src/domain/diplomacy.rs:427 |
| `hard` | zdrowie | SERDE | src/domain/diplomacy.rs:429 |
| `jednostka` | zdrowie | SERDE | src/domain/diplomacy.rs:1697 |
| `opis` | zdrowie | BRAK |  |
| `zdrowie_akwedukt` | zdrowie | BRAK |  |
| `zdrowie_studnia` | zdrowie | BRAK |  |
| `zdrowie_targowisko` | zdrowie | BRAK |  |
| `zdrowie_laznia_publiczna` | zdrowie | BRAK |  |
| `zdrowie_ceramika` | zdrowie | BRAK |  |
| `zdrowie_male_miasto_bonus` | zdrowie | BRAK |  |
| `zdrowie_bonus_osiedle_pop` | zdrowie | BRAK |  |
| `zdrowie_kara_zagęszczenie` | zdrowie | BRAK |  |
| `zdrowie_prog_zagęszczenia` | zdrowie | BRAK |  |
| `zdrowie_kara_bagno` | zdrowie | BRAK |  |
| `zdrowie_bonus_las` | zdrowie | BRAK |  |
| `zdrowie_kara_dzungla` | zdrowie | BRAK |  |
| `zdrowie_kara_zanieczyszczenie` | zdrowie | BRAK |  |
| `zdrowie_kara_brak_wody` | zdrowie | BRAK |  |
| `zdrowie_modyfikator_wzrostu` | zdrowie | BRAK |  |
| `zdrowie_prog_stagnacja` | zdrowie | BRAK |  |
| `zdrowie_prog_ubytek_populacji` | zdrowie | BRAK |  |
| `zdrowie_tempo_ubytku` | zdrowie | BRAK |  |
| `szczescie` | (top) | BRAK |  |
| `szczescie_luksus_na_mieszkanca` | szczescie | BRAK |  |
| `szczescie_ustroj_bonus` | szczescie | BRAK |  |
| `szczescie_religia_dominujaca` | szczescie | BRAK |  |
| `szczescie_kultura_dominujaca` | szczescie | BRAK |  |
| `szczescie_male_miasto_bonus` | szczescie | BRAK |  |
| `szczescie_bonus_osiedle_pop` | szczescie | BRAK |  |
| `szczescie_bonus_stolica_easy` | szczescie | BRAK |  |
| `szczescie_prog_zagęszczenia` | szczescie | BRAK |  |
| `szczescie_kara_wojna` | szczescie | BRAK |  |
| `szczescie_skala_kultura_religia` | szczescie | BRAK |  |
| `szczescie_podatki_min` | szczescie | BRAK |  |
| `szczescie_podatki_max` | szczescie | BRAK |  |
| `szczescie_podatki_prog_pct` | szczescie | BRAK |  |
| `szczescie_max_epoka` | szczescie | BRAK |  |
| `szczescie_pct_cap` | szczescie | BRAK |  |
| `szczescie_max_pop_odniesienia` | szczescie | BRAK |  |
| `szczescie_max_pop_wspolczynnik` | szczescie | BRAK |  |
| `kultura` | (top) | BRAK |  |
| `kultura_palac` | kultura | BRAK |  |
| `kultura_swiatynia` | kultura | BRAK |  |
| `kultura_biblioteka` | kultura | BRAK |  |
| `kultura_amfiteatr` | kultura | BRAK |  |
| `kultura_cud_bonus` | kultura | BRAK |  |
| `kultura_specjalista_artysta` | kultura | BRAK |  |
| `kultura_prog_zasieg_1` | kultura | BRAK |  |
| `kultura_prog_zasieg_2` | kultura | BRAK |  |
| `kultura_prog_zasieg_3` | kultura | BRAK |  |
| `kultura_zadowolenie_100pct` | kultura | BRAK |  |
| `kultura_zadowolenie_75pct` | kultura | BRAK |  |
| `kultura_zadowolenie_50pct` | kultura | BRAK |  |
| `kultura_kara_zadowolenie_lt50` | kultura | BRAK |  |
| `kultura_kara_zadowolenie_lt25` | kultura | BRAK |  |
| `kultura_konwersja_baza_tura` | kultura | BRAK |  |
| `kultura_konwersja_swiatynia` | kultura | BRAK |  |
| `kultura_konwersja_amfiteatr` | kultura | BRAK |  |
| `kultura_konwersja_biblioteka` | kultura | BRAK |  |
| `kultura_konwersja_palac` | kultura | BRAK |  |
| `kultura_konwersja_stela` | kultura | BRAK |  |
| `kultura_konwersja_sad` | kultura | BRAK |  |
| `kultura_konwersja_laznia` | kultura | BRAK |  |
| `kultura_konwersja_cel_100pct` | kultura | BRAK |  |
| `kultura_konwersja_cap_tura` | kultura | BRAK |  |
| `kultura_presja_proc_tura` | kultura | BRAK |  |
| `religia` | (top) | BRAK |  |
| `religia_prog_dominacji` | religia | BRAK |  |
| `religia_szybkosc_szerzenia_bazowa` | religia | BRAK |  |
| `religia_swiatynia_bonus_szerzenia` | religia | BRAK |  |
| `religia_szerzenie_max_dystans` | religia | BRAK |  |
| `religia_zadowolenie_dominujaca` | religia | BRAK |  |
| `religia_swiatynia_zadowolenie` | religia | BRAK |  |
| `religia_jednosc_bonus_produkcja` | religia | BRAK |  |
| `religia_kara_obca` | religia | BRAK |  |
| `religia_kara_brak_religii` | religia | BRAK |  |
| `religia_bonus_dyplomacja_wspolna` | religia | BRAK |  |
| `religia_kara_dyplomacja_rozna` | religia | BRAK |  |
| `religia_bonus_dyplomacja_misja` | religia | BRAK |  |
| `religia_konwersja_bazowa` | religia | BRAK |  |
| `religia_konwersja_swiatynia` | religia | BRAK |  |
| `religia_konwersja_kregi` | religia | BRAK |  |
| `religia_konwersja_cel` | religia | BRAK |  |
| `religia_presja_proc_tura` | religia | BRAK |  |
| `religie_cywilizacji` | (top) | BRAK |  |
| `Cywilizacja` | religie_cywilizacji | BRAK |  |
| `Religia / wyznanie` | religie_cywilizacji | BRAK |  |
| `Główne bóstwo / idea` | religie_cywilizacji | BRAK |  |
| `Wpływ na parametry (bonusy) [propozycja, edytowalne]` | religie_cywilizacji | BRAK |  |
| `porzadek` | (top) | BRAK |  |
| `porzadek_waga_szczescie` | porzadek | BRAK |  |
| `porzadek_waga_prawo` | porzadek | BRAK |  |
| `porzadek_prog_bunt_skrajny_pct` | porzadek | BRAK |  |
| `porzadek_grace_tur_bunt` | porzadek | BRAK |  |
| `porzadek_prog_t1` | porzadek | BRAK |  |
| `porzadek_prog_t2` | porzadek | BRAK |  |
| `porzadek_kara_produkcja_t1` | porzadek | BRAK |  |
| `porzadek_kara_pieniadz_t1` | porzadek | BRAK |  |
| `porzadek_kara_nauka_t1` | porzadek | BRAK |  |
| `porzadek_kara_kultura_t1` | porzadek | BRAK |  |
| `porzadek_kara_wzrost_t1` | porzadek | BRAK |  |
| `porzadek_ryzyko_buntu_t1` | porzadek | BRAK |  |
| `porzadek_bonus_produkcja_t2` | porzadek | BRAK |  |
| `porzadek_bonus_handel_t2` | porzadek | BRAK |  |
| `prawo` | (top) | BRAK |  |
| `prawo_garnizon_per_jednostka` | prawo | BRAK |  |
| `prawo_garnizon_cap_jednostek` | prawo | BRAK |  |
| `prawo_dom_starszyzny` | prawo | BRAK |  |
| `prawo_dwor_zarzadcy` | prawo | BRAK |  |
| `prawo_pretorium` | prawo | BRAK |  |
| `prawo_trybunal` | prawo | BRAK |  |
| `prawo_sad` | prawo | BRAK |  |
| `prawo_palac` | prawo | BRAK |  |
| `prawo_palac_ii` | prawo | BRAK |  |
| `prawo_palac_iii` | prawo | BRAK |  |
| `prawo_garnizon_budynek_epoka` | prawo | BRAK |  |
| `prawo_bonus_osada` | prawo | BRAK |  |
| `prawo_bonus_osiedle_pop` | prawo | BRAK |  |
| `prawo_bonus_osada_prog` | prawo | BRAK |  |
| `prawo_max_epoka` | prawo | BRAK |  |
| `prawo_pct_cap` | prawo | BRAK |  |
| `prawo_max_pop_odniesienia` | prawo | BRAK |  |
| `prawo_max_pop_wspolczynnik` | prawo | BRAK |  |
| `prawo_bonus_stolica_easy` | prawo | BRAK |  |

### tech.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `drzewko_model` | (top) | BRAK |  |
| `_drzewko_model_opis` | (top) | META | klucz dokumentacyjny `_` |
| `tempo_gry` | (top) | BRAK |  |
| `szybka` | tempo_gry | BRAK |  |
| `standardowa` | tempo_gry | BRAK |  |
| `dluga` | tempo_gry | BRAK |  |
| `_opis` | tempo_gry | META | klucz dokumentacyjny `_` |
| `technologie` | (top) | BRAK |  |
| `Technologia` | technologie | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `Epoka` | technologie | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `Poziom` | technologie | BRAK |  |
| `Dostęp do surowca.` | technologie | BRAK |  |
| `wymagany budynek` | technologie | BRAK |  |
| `Wymaga (prereq)` | technologie | BRAK |  |
| `Odblokowuje surowiec.` | technologie | BRAK |  |
| `Odblokowuje budynek` | technologie | BRAK |  |
| `Koszt nauki` | technologie | BRAK |  |
| `Uwagi` | technologie | BRAK |  |
| `Odblokowuje ulepszenie terenu` | technologie | BRAK |  |
| `Historia` | technologie | BRAK |  |
| `awansDoEpoki` | technologie | BRAK |  |
| `wymagane ulepszenie` | technologie | BRAK |  |

### terrain-combat.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `Teren` | (top) | BRAK |  |
| `Koszt wejścia (ruch)` | (top) | BRAK |  |
| `Bonus Obrona` | (top) | BRAK |  |
| `Δ Zasięg (dystansowi)` | (top) | BRAK |  |
| `Kawaleria/Rydwan` | (top) | BRAK |  |
| `Efekt specjalny` | (top) | BRAK |  |

### terrain-improvements.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `_meta` | (top) | META | klucz dokumentacyjny `_` |
| `opis` | _meta | BRAK |  |
| `bonus_pola` | _meta | BRAK |  |
| `epoka` | _meta | BRAK |  |
| `decyzje_MIASTO` | _meta | BRAK |  |
| `kanon_zywnosc_hodowla` | _meta | BRAK |  |
| `decyzje_EKONOMIA` | _meta | BRAK |  |
| `klucze_surowcow_ASCII` | _meta | BRAK |  |
| `pole_surowiec_ilosc_tura` | _meta | BRAK |  |
| `farma` | (top) | SERDE | src/domain/improvements.rs:72 |
| `nazwa` | farma | BRAK |  |
| `bonus` | farma | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `zywnosc` | farma | SERDE | src/domain/diplomacy.rs:1691 (+1) |
| `praca` | farma | SERDE | src/domain/diplomacy.rs:1413 (+2) |
| `handel` | farma | SERDE | src/domain/diplomacy.rs:538 (+2) |
| `surowiecOdblokowany` | farma | BRAK |  |
| `teren` | farma | BRAK |  |
| `warunek` | farma | BRAK |  |
| `koszt_praca` | farma | BRAK |  |
| `tech` | farma | SERDE | src/domain/diplomacy.rs:1695 (+2) |
| `odblokowuje` | farma | BRAK |  |
| `uwagi` | farma | BRAK |  |
| `historia` | farma | BRAK |  |
| `irygacja` | (top) | SERDE | src/domain/improvements.rs:74 |
| `bydlo` | (top) | SERDE | src/domain/improvements.rs:45 (+1) |
| `surowiecOdblokowany_uwaga` | bydlo | BRAK |  |
| `owce` | (top) | SERDE | src/domain/improvements.rs:47 (+1) |
| `lama` | (top) | SERDE | src/domain/improvements.rs:49 (+1) |
| `cywilizacje` | lama | BRAK |  |
| `stadnina` | (top) | SERDE | src/domain/improvements.rs:82 |
| `surowiec_ilosc_tura` | stadnina | BRAK |  |
| `glinianka` | (top) | SERDE | src/domain/improvements.rs:88 |
| `glina` | glinianka | SERDE | src/domain/improvements.rs:53 (+2) |
| `kamieniolom` | (top) | SERDE | src/domain/improvements.rs:90 |
| `kamien` | kamieniolom | SERDE | src/domain/improvements.rs:189 (+1) |
| `oboz_lowiecki` | (top) | SERDE | src/domain/improvements.rs:86 |
| `pieniadz` | oboz_lowiecki | SERDE | src/domain/improvements.rs:185 |
| `wyrab` | (top) | SERDE | src/domain/improvements.rs:110 |
| `typ` | wyrab | SERDE | src/domain/diplomacy.rs:1718 |
| `wycinka` | wyrab | BRAK |  |
| `praca_per_tura` | wyrab | BRAK |  |
| `tury` | wyrab | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `usuwa_nakladke` | wyrab | BRAK |  |
| `tartak` | (top) | SERDE | src/domain/improvements.rs:84 |
| `tarasy` | (top) | SERDE | src/domain/improvements.rs:104 |
| `cywilizacje_uwaga` | tarasy | BRAK |  |
| `lodzie_rybackie` | (top) | SERDE | src/domain/improvements.rs:102 |
| `warzelnia_soli` | (top) | SERDE | src/domain/improvements.rs:100 |
| `fort` | (top) | SERDE | src/domain/improvements.rs:112 |
| `bonus_obrona_proc` | fort | BRAK |  |
| `bonus_wymaga_obozowania` | fort | BRAK |  |
| `zasieg_pol` | fort | BRAK |  |
| `zasieg_terytorium` | fort | BRAK |  |
| `zasieg_kontroli` | fort | BRAK |  |
| `droga` | (top) | SERDE | src/domain/improvements.rs:106 |
| `droga_brukowana` | (top) | SERDE | src/domain/improvements.rs:108 |
| `bonus_ruch` | droga_brukowana | BRAK |  |
| `bonus_ruch_uwaga` | droga_brukowana | BRAK |  |
| `upgradeFrom` | droga_brukowana | BRAK |  |
| `kopalnia_miedzi` | (top) | SERDE | src/domain/improvements.rs:92 |
| `kopalnia_zelaza` | (top) | SERDE | src/domain/improvements.rs:94 |
| `kopalnia_cyny` | (top) | SERDE | src/domain/improvements.rs:96 |
| `kopalnia_zlota` | (top) | SERDE | src/domain/improvements.rs:98 |
| `posterunek` | (top) | SERDE | src/domain/improvements.rs:114 |
| `tech_uwaga` | posterunek | BRAK |  |
| `_miasto_zasieg_ref` | (top) | META | klucz dokumentacyjny `_` |
| `_komentarz` | _miasto_zasieg_ref | META | klucz dokumentacyjny `_` |

### terrain-movement.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `costs` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `Laka` | costs | SERDE | src/domain/map_generator.rs:76 |
| `Rownina` | costs | SERDE | src/domain/map_generator.rs:78 |
| `Pustynia` | costs | SERDE | src/domain/map_generator.rs:80 |
| `Wybrzeze` | costs | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `Wzgorza` | costs | SERDE | src/domain/map_generator.rs:82 |
| `Gory` | costs | SERDE | src/domain/map_generator.rs:84 |
| `Morze` | costs | SERDE | src/domain/map_generator.rs:72 |
| `Polarny` | costs | SERDE | src/domain/map_generator.rs:86 |
| `forestExtra` | (top) | PRZEMIANOWANE | pole `forest_extra` (src/domain/pathfinding.rs:235) |

### terrain-yields.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `terrain_types` | (top) | BRAK |  |
| `Teren` | terrain_types | BRAK |  |
| `Żywność` | terrain_types | BRAK |  |
| `Praca` | terrain_types | BRAK |  |
| `Podatek` | terrain_types | BRAK |  |
| `Drewno` | terrain_types | BRAK |  |
| `Kamień` | terrain_types | LITERAL (słaby) | src/domain/unit_epoch.rs:24 (+1) |
| `Glina` | terrain_types | BRAK |  |
| `Suma` | terrain_types | BRAK |  |
| `Uwagi` | terrain_types | BRAK |  |
| `terrain_modifiers` | (top) | BRAK |  |
| `Modyfikator` | terrain_modifiers | BRAK |  |

### ui-params.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `_opis` | (top) | META | klucz dokumentacyjny `_` |
| `panel_miasta` | (top) | BRAK |  |
| `rush_cost_mnoznik` | panel_miasta | BRAK |  |
| `okolica_promien` | panel_miasta | BRAK |  |
| `okolica_hex_px` | panel_miasta | BRAK |  |
| `font_scale` | panel_miasta | BRAK |  |
| `label` | panel_miasta | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `px` | panel_miasta | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `font_scale_domyslna_px` | panel_miasta | BRAK |  |
| `menu` | (top) | BRAK |  |
| `wersja` | menu | BRAK |  |
| `etap` | menu | BRAK |  |
| `muzyka_fade_in_ms` | menu | BRAK |  |
| `muzyka_opoznienie_startu_ms` | menu | BRAK |  |
| `ustawienia` | menu | BRAK |  |
| `key` | menu | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `opts` | menu | BRAK |  |
| `descs` | menu | BRAK |  |
| `domyslny` | menu | LITERAL (słaby) | src/domain/diplomacy.rs:4032 |
| `nowa_gra` | (top) | BRAK |  |

### units.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `Jednostka` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `Historia` | (top) | BRAK |  |
| `Epoka` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `Kultura` | (top) | BRAK |  |
| `Tech` | (top) | BRAK |  |
| `Pieniądz (koszt)` | (top) | SERDE | src/domain/diplomacy.rs:3889 |
| `Ludność` | (top) | BRAK |  |
| `Surowiec` | (top) | BRAK |  |
| `Surowiec (ilość)` | (top) | BRAK |  |
| `Utrzymanie (Pieniądz/turę)` | (top) | BRAK |  |
| `żywność/turę` | (top) | BRAK |  |
| `Atak` | (top) | BRAK |  |
| `Uderzenie` | (top) | BRAK |  |
| `Obrona` | (top) | BRAK |  |
| `Ruch` | (top) | SERDE | src/domain/diplomacy.rs:3874 |
| `Ruch w bitwie (heksy)` | (top) | BRAK |  |
| `Health` | (top) | SLOWO (słaby) | zbieżność nazwy, NIE mapowanie: Rust `city_growth.rs:103` `health` to wskaźnik zdrowia miasta (modyfikator przepływu żywności), nie statystyka jednostki z units.json (75 wystąpień) |
| `Próg dezercji (% health)` | (top) | BRAK |  |
| `Widok pola` | (top) | BRAK |  |
| `Atak dystansowy` | (top) | BRAK |  |
| `Zasięg ataku (hex)` | (top) | BRAK |  |
| `Ilość pocisków` | (top) | BRAK |  |
| `W zamian za` | (top) | BRAK |  |
| `Super-jednostka` | (top) | SERDE | src/domain/diplomacy.rs:3881 |
| `Uwagi` | (top) | BRAK |  |
| `Rola (linia)` | (top) | SERDE | src/domain/diplomacy.rs:3876 |
| `Pancerz` | (top) | BRAK |  |
| `Przebicie` | (top) | BRAK |  |
| `Kara obrony z flanki (%)` | (top) | BRAK |  |
| `Kara obrony z tyłu (%)` | (top) | BRAK |  |
| `Morale bazowe` | (top) | BRAK |  |
| `Morale ucieczki` | (top) | BRAK |  |
| `Nazwa EN` | (top) | BRAK |  |
| `Typ` | (top) | BRAK |  |
| `Klasa` | (top) | BRAK |  |
| `Nacja` | (top) | BRAK |  |
| `Bonus vs Swordsman %` | (top) | BRAK |  |
| `Bonus vs Spearman %` | (top) | BRAK |  |
| `Bonus vs Falangite %` | (top) | BRAK |  |
| `Bonus vs Offensive %` | (top) | BRAK |  |
| `Bonus vs Distance %` | (top) | BRAK |  |
| `Bonus vs Mount %` | (top) | BRAK |  |
| `Bonus vs Slinger %` | (top) | BRAK |  |
| `Zmiana na` | (top) | BRAK |  |
| `Zastąp specjalnie` | (top) | BRAK |  |
| `Dostępna w epokach` | (top) | BRAK |  |
| `meleeAttack` | (top) | BRAK |  |
| `meleeDefence` | (top) | BRAK |  |
| `weaponDamage` | (top) | BRAK |  |
| `piercing` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `armor` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `chargeBonus` | (top) | BRAK |  |
| `health` | (top) | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `missileAttack` | (top) | BRAK |  |
| `fieldPower` | (top) | BRAK |  |
| `Utrzymanie surowiec` | (top) | BRAK |  |
| `Utrzymanie surowiec (ilość)` | (top) | BRAK |  |
| `Opis` | (top) | BRAK |  |
| `Top3` | (top) | BRAK |  |
| `tytul` | Top3 | BRAK |  |
| `tekst` | Top3 | BRAK |  |
| `wallAttack` | (top) | BRAK |  |
| `siegePower` | (top) | BRAK |  |

### wonders.json

| Klucz | Sekcja (top-level) | Status | Dowód / nowa nazwa |
|---|---|---|---|
| `_meta` | (top) | META | klucz dokumentacyjny `_` |
| `opis` | _meta | BRAK |  |
| `dostep_E` | _meta | BRAK |  |
| `dostep_R` | _meta | BRAK |  |
| `cuda_wyscigowe` | _meta | BRAK |  |
| `cuda_wyscigowe_epoka` | _meta | BRAK |  |
| `1` | _meta | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `id` | _meta | SERDE | src/domain/trade.rs:236 |
| `nazwa` | _meta | BRAK |  |
| `epoka` | _meta | BRAK |  |
| `profil` | _meta | BRAK |  |
| `2` | _meta | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `3` | _meta | BRAK | klucz liczbowy: dopasowania literalne pomijane (bez znaczenia jako ID) |
| `cuda_wyscigowe_uwaga` | _meta | BRAK |  |
| `wszystkie_cywilizacje` | _meta | BRAK |  |
| `wieki` | _meta | BRAK |  |
| `antyk` | _meta | BRAK |  |
| `epoki` | _meta | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `sredniowiecze` | _meta | BRAK |  |
| `renesans_plus` | _meta | BRAK |  |
| `absolut` | _meta | BRAK |  |
| `domyslnie_antyk` | _meta | BRAK |  |
| `koniec_sredniowiecza` | _meta | BRAK |  |
| `decyzja` | _meta | BRAK |  |
| `po_absolut` | _meta | BRAK |  |
| `hex` | _meta | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `utrzymanie_wygasly` | _meta | BRAK |  |
| `utrzymanie_wygasly_opis` | _meta | BRAK |  |
| `jedyny_efekt` | _meta | BRAK |  |
| `typ` | _meta | SERDE | src/domain/diplomacy.rs:1718 |
| `wartosc` | _meta | BRAK |  |
| `silnik` | _meta | BRAK |  |
| `budowa` | _meta | BRAK |  |
| `harappa_v1` | _meta | BRAK |  |
| `chinczycy_v1` | _meta | BRAK |  |
| `celtowie_v1` | _meta | BRAK |  |
| `koszt_jednostka` | _meta | BRAK |  |
| `bonus_miasto` | _meta | BRAK |  |
| `bonus_cywilizacja` | _meta | BRAK |  |
| `bonus_cywilizacja_typy` | _meta | BRAK |  |
| `dyplomacja_wpływ` | _meta | BRAK |  |
| `wojna_wsparcie` | _meta | BRAK |  |
| `relacje_zaufanie` | _meta | BRAK |  |
| `relacje_respekt` | _meta | BRAK |  |
| `armia_xp` | _meta | BRAK |  |
| `armia_morale` | _meta | BRAK |  |
| `walka_procent` | _meta | BRAK |  |
| `pobor_regen` | _meta | BRAK |  |
| `handel_procent` | _meta | BRAK |  |
| `nauka_procent` | _meta | BRAK |  |
| `produkcja_procent` | _meta | BRAK |  |
| `magazyn_pojemnosc` | _meta | BRAK |  |
| `wzrost_ludnosci_procent` | _meta | BRAK |  |
| `jednorazowe` | _meta | BRAK |  |
| `fortyfikacja_mapa` | _meta | BRAK |  |
| `handel_turystyka` | _meta | BRAK |  |
| `bonus_zasieg` | _meta | BRAK |  |
| `bonus_teren` | _meta | BRAK |  |
| `bonus_specjalne` | _meta | BRAK |  |
| `kanon_bonusow_2026` | _meta | BRAK |  |
| `bonus_miasto_mnoznik` | _meta | BRAK |  |
| `bonus_moc` | _meta | BRAK |  |
| `kanon_tech_wejscie` | _meta | BRAK |  |
| `cuda` | (top) | BRAK |  |
| `dostep` | cuda | BRAK |  |
| `cywilizacje` | cuda | BRAK |  |
| `techUnlock` | cuda | BRAK |  |
| `wymagaTerenu` | cuda | BRAK |  |
| `epokaWejscia` | cuda | BRAK |  |
| `maxNaSwiecie` | cuda | BRAK |  |
| `kosztBudowy` | cuda | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `utrzymanie` | cuda | BRAK |  |
| `bonusy` | cuda | BRAK |  |
| `miasto` | cuda | BRAK |  |
| `pieniadz` | cuda | SERDE | src/domain/improvements.rs:185 |
| `praca` | cuda | SERDE | src/domain/diplomacy.rs:1413 (+2) |
| `teren` | cuda | BRAK |  |
| `typTerenu` | cuda | BRAK |  |
| `warunek` | cuda | BRAK |  |
| `specjalne` | cuda | BRAK |  |
| `historia` | cuda | BRAK |  |
| `kultura` | cuda | BRAK |  |
| `cel` | cuda | BRAK |  |
| `zywnosc` | cuda | SERDE | src/domain/diplomacy.rs:1691 (+1) |
| `uwagi` | cuda | BRAK |  |
| `nazwaAlt` | cuda | BRAK |  |
| `zadowolenie` | cuda | BRAK |  |
| `drewno` | cuda | SERDE | src/domain/resource_production.rs:8 |
| `nauka` | cuda | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `obrona` | cuda | SLOWO (słaby) | tylko jako słowo w src (komentarz/zmienna), bez dowodu mapowania |
| `panstwa` | (top) | BRAK |  |
| `egipt` | panstwa | SERDE | src/domain/diplomacy.rs:813 |
| `kolejnosc` | panstwa | BRAK |  |
| `sumer` | panstwa | SERDE | src/domain/diplomacy.rs:817 |
| `babilonia` | panstwa | SERDE | src/domain/diplomacy.rs:829 |
| `grecy` | panstwa | SERDE | src/domain/diplomacy.rs:803 |
| `hetyci` | panstwa | SERDE | src/domain/diplomacy.rs:825 |
| `celtowie` | panstwa | SERDE | src/domain/diplomacy.rs:819 |
| `harappa` | panstwa | SERDE | src/domain/diplomacy.rs:823 |
| `fenicjanie` | panstwa | SERDE | src/domain/diplomacy.rs:833 |
| `germanie` | panstwa | SERDE | src/domain/diplomacy.rs:821 |
| `inkowie` | panstwa | SERDE | src/domain/diplomacy.rs:809 |
| `chinczycy` | panstwa | SERDE | src/domain/diplomacy.rs:807 |
| `rzymianie` | panstwa | SERDE | src/domain/diplomacy.rs:805 |
| `asyria` | panstwa | SERDE | src/domain/diplomacy.rs:831 |
| `zulusi` | panstwa | SERDE | src/domain/diplomacy.rs:811 |
| `slowianie` | panstwa | SERDE | src/domain/diplomacy.rs:827 |
| `parkowane_epoka4plus` | (top) | BRAK |  |
| `epokaDocelowa` | parkowane_epoka4plus | BRAK |  |
| `epokaDocelowaOpis` | parkowane_epoka4plus | BRAK |  |
| `aktywne` | parkowane_epoka4plus | BRAK |  |
