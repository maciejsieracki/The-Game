# P3.18 — Ręcznie wpisane tabele danych w `rust-port/engine/src/domain/**`

STATUS: PASS-WITH-NOTES (runda 2; kryterium binarne spełnione: 18/18 pozycji zmierzonych, naprawione ROZJECHANE z JSON mają testy; otwarte rozjechania poza zakresem wypisane w §5)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-18-HARDCODED-TABLES-Q1
RUNDA: 2/5 (odpowiedź Operatora na zarzuty Evaluatora rundy 1, commit `e97a9dfc`)
GOAL: (A) zmierzyć 18 pozycji audytu P3.17 §2 względem `gra/data/*.json` (pin `edb8fb56`) i kodu weba; (B) naprawić pozycje ROZJECHANE z jednoznacznym źródłem w JSON.
BAZA: `d3a73641` (P3.17) → `e97a9dfc` (runda 1) → commit rundy 2 (SHA w raporcie Operatora), detached HEAD w worktree `wf_ff9aec9b-668-3`
PIN danych: `edb8fb56` — `rust-port/engine/data/*.json` bajtowo = `gra/data/*.json` (`cmp`, runda 1)
ZMIANY/COMMIT: §7
DEPLOY/PUSH: NIE WYKONANO

Oznaczenia: **ZMIERZONO** = własna komenda w tym przebiegu (wyjście w Załączniku 4); **NIE DOTYCZY** = udowodnione, że tabela nie istnieje w domenie; **BRAK ODPOWIEDNIKA W JSON** = wartość nie ma klucza w `gra/data` (wartość porównana z kodem weba).

---

## 0. Wynik kryterium binarnego

- **18/18 pozycji zmierzonych** (pozycja 1 — P3.17; 2–9, 13 — w rundzie 2; 10–12, 14–18 — w rundzie 1 i uzupełnione w rundzie 2). Brak `NIE_ZMIERZONO`.
- **Naprawione ROZJECHANE z jednoznacznym źródłem w JSON** (dane z `parse_*`, testy porównują wszystkie wiersze / wszystkie klucze):
  - **#10** `diplomacy.rs` katalog cen jednostek PN: 66 wpisów ręcznych → `units.json` (`Pieniądz (koszt)`); 63/66 starych wartości było dokładnie 2× JSON.
  - **#16** `ai_turn.rs` domyślne progi AI: `min_city_distance` 5 → **4**, `threat_range` 5 → **7** (`ai-params.json`, zgodne z web `getAiParam`).
- **Rozjechania znalezione w rundzie 2, NIE naprawione** (poza allowlistą albo decyzja logiki, nie danych — §5): **#4** Las (`combat.rs`, poza allowlistą), **#13** mnożnik czasu traktatu stosowany do Pokoju (logika).
- `cargo fmt --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo test` EXIT=0, **327 passed** (baseline `d3a73641`: 324 passed; +3 nowe testy: zgodność katalogu PN ze wszystkimi wierszami `units.json`, zgodność domyślnych parametrów AI z `ai-params.json`, zależność `hex_city_score` od `threat_range`).

## 1. Tabela zestawieniowa (18 pozycji)

| # | Tabela / funkcja | Plik:linia (stan po rundzie 2) | Odpowiedni JSON / web | Wynik | Dowód |
|---|---|---|---|---|---|
| 1 | `canonical_recruitment_costs()` | `src/domain/recruitment.rs:217` | `units.json` | NAPRAWIONA w P3.17 (`d3a73641`), poza zakresem tematu | P3-17 §5 |
| 2 | `canonical_building_costs()` | `src/domain/building_costs.rs:108–` (42 rekordy) | `buildings.json`: `kosztBudowy` (baza pracy), `przyrostKosztu`, `koszt_surowce` | **ZGODNA 42/42** (wszystkie trzy pola każdego budynku) | Załącznik 4: `audit2.py` |
| 3 | `counter_multiplier()` | `src/domain/combat.rs:186–213` | `counters.json` (wiersze „Atak” 15/17) | **ZGODNA 15/15** wierszy Atak (pary i mnożniki 1.15/1.25/1.5). LUKA (nie rozjechanie wartości): wiersz Obrona Spearman→Mount (+50%) ma tę samą parę co wiersz Atak; wiersz „Atak z flanki” −50% nie jest zakodowany (`grep -n flank src/domain/combat.rs`: 0 trafień) | Załącznik 4: `audit3.py` |
| 4 | `terrain_defense_multiplier()` | `src/domain/combat.rs:219–226` | `terrain-combat.json` „Bonus Obrona”; web `gra/src/game/combat.ts:633–636` (Las: 1.5 tylko vs dystans/flanka, w pozostałych 1.0), `:642` (pozostałe: `1 + pct/100`) | **ROZJECHANA**: Las (`Forest`) 1.25 vs JSON +50% = 1.5 i web 1.5 warunkowo. Równina 1.0, Wzgórza 1.5, Góry 1.75, Rzeka 1.0 — ZGODNE (4/5). NIE NAPRAWIONA (poza allowlistą `combat.rs`; warunek roli atakującego to logika) — §5 pkt 1 | Załącznik 4: `audit_extra.py` §4 |
| 5 | `structure_defense_multiplier()` | `src/domain/combat.rs:229–239` | `miasto-params.json`: `bonus_obrona_mur_proc`=200, `bonus_obrona_cytadela_proc`=100; web `gra/src/main.ts:26973` (`fort` teren +100), `:26974` (`posterunek` +50) | Mur (`wall`) 200 — **ZGODNA** (JSON). Fort 100 — ZGODNA z JSON (cytadela) i z webem (teren). Outpost 50 — **BRAK ODPOWIEDNIKA W JSON** (ZGODNA z webem, literał `posterunek`). LUKA MODELU: web stackuje mur/cytadelę/bazę/palisadę (`city-defense.ts:56–75`), Rust ma trzy flagi — §5 pkt 7 | Załącznik 4: `audit_extra.py` §5 |
| 6 | `terrain_movement_cost()` / `movement_cost()` | `src/domain/terrain.rs:91–99`; `src/domain/pathfinding.rs:225–249` (`MovementRules::default`), `:272` | `terrain-movement.json` `costs` (8 kluczy), `forestExtra`=1; web `gra/src/map/road-movement.ts:13,17` (droga ÷3, brukowana ÷5), `:37` (rzeka = 1) | **ZGODNA 8/8** kluczy terenu (`99` = None) w obu kopiach (`terrain.rs` i `MovementRules`), `forestExtra` 1 = 1. Rzeka 1 i dzielniki dróg 3/5: **BRAK ODPOWIEDNIKA W JSON**, ZGODNE z webem | Załącznik 4: `audit6b.py` |
| 7 | `resource_yield_for_improvement()` | `src/domain/resource_production.rs:120–145` | `terrain-improvements.json` `surowiec_ilosc_tura` (9 wierszy); web `gra/src/game/terrain-improvements.ts:221` (`normalizeProductionEra`), `:232` (`Math.pow(1.5, era-1)`) | **ZGODNA 9/9** ilości bazowych; skalowanie epok tartak/kamieniołom 200/300/450 — ZGODNE z webem | Załącznik 4: `audit_extra.py` §7 |
| 8 | `ResourceYield::with_yields(...)` (AI) | `src/domain/ai_turn.rs:189` | `terrain-yields.json` | **NIE DOTYCZY**: w `ai_turn.rs` nie ma literałów yield (pola `food/work/trade` = 0 tylko w `Default`); `with_yields` nie ma ŻADNEGO wywołania w `src/` ani `tests/` (`grep -rn 'with_yields(' src tests` → tylko definicja); `terrain-yields.json` nie jest zużywany przez domenę (`grep` → tylko `src/data/loader.rs:220`, `src/data/terrain_map.rs:14,228`). Wpis audytu P3.17 był błędny w tej części | Załącznik 4 (komenda w §2) |
| 9 | Stałe wzrostu miasta `DEFAULT_*` | `src/domain/city_growth.rs:14–31` | `econ-params.json` `ekonomia_miasta` (`akwedukt_prog_ludnosci`, `spichlerz_prog_ludnosci`, `akwedukt_max_ludnosci`, `próg_wzrostu_wspolczynnik`, `spichlerz_zachowanie_po_wzroscie`, wartość `normal`); web `gra/src/game/economy.ts:1210,1217,1224,229` | **ZGODNA 5/5** kluczy JSON (cap 5, 8, 12; próg/mieszk. 16; retencja 0.5). **BRAK ODPOWIEDNIKA W JSON** (ZGODNE z webem literałami): baza progu 20 (`economy.ts:1217`), `zdrowie` 0.05 (`:229`), retencja II 0.7 (`:1224`), minimum 1 mieszkaniec (`:1210`) | Załącznik 4: `audit_extra.py` §9 |
| 10 | Katalog wartości jednostek PN | `src/domain/diplomacy.rs:1856–1868` (`unit_prices_from_units_json`), `ValueCatalog::default` `:1843` | `units.json` `Pieniądz (koszt)`; web `gra/src/game/diplomacy-value-catalog.ts:209–214`, `:497` | **NAPRAWIONA** (runda 1): 66/66 z JSON; runda 2: test czyta SUROWY `units.json`, niezależnie od `parse_units()` | §3.1, Załącznik 1, §4 |
| 11 | `STEP_TEN_RESOURCES` (krok handlu 10) | `src/domain/diplomacy.rs:1870–1884` | **BRAK ODPOWIEDNIKA W JSON** (`resources.json` nie ma pola kroku; sprawdzone: brak klucza `krok` w pliku). Web: `gra/src/game/diplomacy-value-catalog.ts:307–310` (`HANDEL_SUROWCE_KROK10`) | **ZGODNA z webem 13/13** (ta sama kolejność nazw); BRAK ODPOWIEDNIKA w JSON | Załącznik 4: `audit_extra3.py` §11 |
| 12 | `TRADE_BUILDING_IDS`, `PORT_BUILDING_IDS`, `TRADE_ROUTE_RESOURCE_KEYS` | `src/domain/trade.rs:313, 316, 1577` | `buildings.json` `id`; `resources.json` `Surowiec` | **ZGODNA**: `targowisko`, `port`, `port_wielki` = `id` w `buildings.json` (3/3, 2/2); klucze `braz`, `zelazo`, `kon`, `cegla`, `zloto` = `Brąz`, `Żelazo`, `Koń`, `Cegła`, `Złoto` (5/5, po normalizacji diakrytyków i `ł→l`) | Załącznik 4: `audit_extra3.py` §12 |
| 13 | Mnożniki dyplomacji: `handel_willingness_multiplier`, `treaty_duration_pn_multiplier` | `src/domain/diplomacy.rs:3032–3050` (chęć), `:3072–3085` (czas traktatu); `DiplomacyParams` default `:360` | `diplomacy.json` `progHandelWillingnessMin`=0.5; web `gra/src/game/diplomacy-proposals.ts:908,910` (0.15 / 0.20), `:925–941`, `:595–599` (zbiór akcji), `:613–623` (formuła) | Próg 0.5 — **ZGODNY** z JSON (wartość domyślna w kodzie, literał). Nachylenia 0.15/0.20 — **BRAK ODPOWIEDNIKA W JSON**, ZGODNE z webem. Formuła czasu traktatu (×1/×2/×4/×8) — ZGODNA z webem. **ROZJECHANA**: zbiór akcji — Rust (`:3072–3079`) stosuje mnożnik także do `Peace`; web (`:595–599`) tylko `nap`, `trybut_zadanie`, `trybut_oferta`. NIE NAPRAWIONA (logika) — §5 pkt 2 | Załącznik 4: `audit_extra.py` §13 |
| 14 | `production_for()` (21 gałęzi) | `src/domain/improvements.rs:339–` | `terrain-improvements.json` `bonus` i `surowiec_ilosc_tura` | **ZGODNA 20/20** wierszy (bonusy zywnosc/praca/handel/pieniadz/glina/kamien i ilość surowca). Literały zostają (wartości równe) | Załącznik 4: `audit14.py` |
| 15 | `default_land_fraction()` | `src/domain/map_generator.rs:495–502` | **BRAK ODPOWIEDNIKA W JSON** (`map-gen-params.json` ma tylko `relief_land_fraction`). Web: `gra/src/map/gen-helpers.ts:3254–3260` (`pangea` 0.60, `kontynenty` 0.30, `wyspy` 0.50, `ziemia` 0.21) | **ZGODNA z webem 4/4**; BRAK ODPOWIEDNIKA w JSON | Załącznik 4: `audit_extra3.py` §15 |
| 16 | Stałe AI `DEFAULT_*` | `src/domain/ai_turn.rs:23–68` (`ai_params`, akcesory), `:34` (`default_threat_range_value`), `:620` (`impl Default for AiTurnOptions`) | `ai-params.json` `ekspansja_*`; web `gra/src/game/ai.ts:3208` (min dystans), `:1241`, `:1690` (zasięg zagrożenia), `AI_THREAT_RANGE_DEFAULT=7` (`ai-threat-mode.ts:7`) | **ROZJECHANA 2 → NAPRAWIONA**: `min_city_distance` 5 → **4**; `threat_range` 5 → **7**. Sześć wag `city_score` (3/2/1/2/2/−3) — wartości bez zmian, teraz czytane z JSON (`ekspansja_heurystyka_*`, `granica_kara`) | §3.3, §4 |
| 17 | `TRADE_ROUTE_BUILDING_BONUS_RATE = 0.05` | `src/domain/trade.rs:1477` (użycie `:1490`) | **BRAK ODPOWIEDNIKA W JSON** (brak klucza; jedyny `0.05` w `ai-params.json` to bonus walki Trudnego, inne znaczenie). Web: `gra/src/game/trade-routes.ts:1646` | **ZGODNA z webem** (literał 0.05); BRAK ODPOWIEDNIKA w JSON | Załącznik 4: `audit_extra3.py` §17 |
| 18 | `barbarian_units_per_camp_for_difficulty()` | `src/domain/barbarians.rs:329–335` | `ai-params.json` `barbarzyncy_jednostek_na_oboz`=2; web `gra/src/game/barbarians.ts:559–566` (easy 1, hard 3, inaczej 2) | Normal 2 — **ZGODNA** z JSON. Easy 1 i Hard 3 — **BRAK ODPOWIEDNIKA W JSON**, ZGODNE z webem (§5 pkt 3) | Załącznik 4: `audit_extra3.py` §18 |

Uwaga do #18: funkcja zwraca liczbę **jednostek na obóz** (zgodnie z kluczem JSON i webem), nie liczbę obozów.

## 2. Komendy pomiarowe (runda 2)

Wszystkie skrypty leżą w `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/` (czytają `rust-port/engine/` z worktree i `git show edb8fb56:…` dla weba). Pełne wyjście: Załącznik 4 (`scratchpad/r2/evidence-r2.log`, generowane przez `run_evidence.py`).

- `audit2.py` — #2 (42 rekordy, porównanie 3 pól).
- `audit3.py` — #3 (parsowanie ramion `match` z `counter_multiplier`, porównanie z `counters.json`).
- `audit_extra.py` — #4, #5, #7, #9, #13.
- `audit6b.py` — #6 (`terrain.rs` i `MovementRules::default` vs `terrain-movement.json`).
- `audit6.py` — tabele `ValueCatalog::default()` (audyt zarzutu 6, patrz §5 pkt 9).
- `audit14.py` — #14 (20 wariantów `production_for` vs `terrain-improvements.json`).
- `audit_extra3.py` — #11, #12, #15, #17, #18.
- Web (plain `git show`, pin `edb8fb56`): `gra/src/game/combat.ts`, `gra/src/game/city-defense.ts`, `gra/src/main.ts` (26953–26975), `gra/src/game/economy.ts` (229, 1210, 1217, 1224), `gra/src/game/diplomacy-proposals.ts` (595–623, 908–941), `gra/src/game/diplomacy-value-catalog.ts` (75–85, 307–310), `gra/src/game/trade-routes.ts` (1646), `gra/src/game/barbarians.ts` (559–566), `gra/src/map/gen-helpers.ts` (3254–3260), `gra/src/map/road-movement.ts` (13–37), `gra/src/game/terrain-improvements.ts` (221–232).
- Rust (grep): `grep -rn 'with_yields(' src tests` (#8); `grep -rn 'terrain-yields\|terrain_yields' src` (#8); `grep -n flank src/domain/combat.rs` (#3).

## 3. Zmiany kodu (krok B)

### 3.1 `diplomacy.rs` — katalog PN jednostek (#10)

Bez zmian względem rundy 1: literał `BTreeMap::from([...])` (66 wpisów) usunięty; `unit_prices_from_units_json()` (`OnceLock` + `parse_units()`, filtr `pieniadz_koszt > 0`). Zachowanie: Appendix 1.

### 3.2 `improvements.rs` (#14)

Bez zmiany kodu: 20/20 zgodnych (§1). Wyprowadzenie literałów z JSON — §5 pkt 8.

### 3.3 `ai_turn.rs` (#16) — zmiany rundy 1 i 2

Stan po rundzie 2:
- **Źródło danych (zarzut 3):** `ai_params()` = `OnceLock<AiParams>` z `crate::data::economy_society_part2::parse_ai_params()` (typowane pola `ekspansja_*`, `wartosc`). Literał `include_str!` i `serde_json::Value` usunięte z domeny.
- **Testy włączające moduł przez `#[path]`** (`tests/ai_turn.rs`, `tests/terrain_movement_fix.rs`) dostają shim: `#[path = "../src/data/economy_society_part2.rs"] pub mod economy_society_part2;` oraz `pub mod data { pub use crate::economy_society_part2; }`. Bez zmiany asercji. Dlaczego shim, a nie odrzucenie parsera: obie kompilacje `ai_turn.rs` potrzebują ścieżki `crate::data::…`, a shim daje ją bez kopiowania logiki. (Próba `#[path]` wewnątrz modułu inline wskazała na nieistniejący katalog `tests/data/` — odrzucona.)
- **`hex_city_score(…, threat_range: u32)` (zarzut 4):** kara za wrogie sąsiedztwo używa parametru. `find_settler_target` przekazuje `options.threat_range` (`ai_turn.rs:846`). Publiczne `score_city_site` (bez opcji) używa `default_threat_range_value()` = 7, czyli zachowanie domyślne nie zmienia się.
- **Flaga zagrożenia miasta (zarzut 5), `ai_turn.rs:894`:** `unit.position().distance(city) <= input.options.threat_range`. Domyślny zasięg 5 → 7 zmienia też tę flagę: miasto jest „pod zagrożeniem”, gdy wrogi oddział jest ≤7 pól zamiast ≤5. To zmiana zachowania AI, wpisana do tabeli §3.3.1.

#### 3.3.1 Było / jest (zachowanie gry, ai_turn)

| Parametr | było | jest | źródło |
|---|---|---|---|
| `min_city_distance` (domyślna; osadnik nie zakłada miasta bliżej niż `<`) | 5 | **4** | `ekspansja_min_dystans_miast` = 4 |
| `threat_range` (domyślna) | 5 | **7** | `ekspansja_zagroz_zasieg` = 7 |
| kara za wrogie sąsiedztwo w `hex_city_score` (`< threat_range`) | `< 5` | `< options.threat_range` (domyślnie `< 7`) | web `ai.ts:1243`, `:1691` |
| flaga `under_threat` miasta (`<= threat_range`, `ai_turn.rs:894`) | `<= 5` | `<= 7` (domyślnie) | web `ai.ts:1691` |
| `city_score` food / work / trade / river / resource / enemy_penalty | 3/2/1/2/2/−3 | 3/2/1/2/2/−3 (bez zmiany wartości, teraz z JSON) | `ai-params.json` |

## 4. Testy: zmiany jawnie wylistowane

| Plik | Test | Zmiana | Uzasadnienie |
|---|---|---|---|
| `tests/diplomacy.rs` | `canonical_value_catalog_prices_non_quantity_basket_items` | asercja `Unit "Wojownik"`: `Some(10.0)` → `Some(5.0)` (runda 1) | Test autorski Rust, nie nagranie z weba. `units.json` `Pieniądz (koszt)` Wojownika = 5 (`rust-port/engine/data/units.json`, bajtowo = pin). |
| `tests/diplomacy.rs` | `diplomacy_unit_prices_match_units_json_for_every_row` (NOWY, runda 1) | runda 2: czyta **surowy** `data/units.json` przez `serde_json::Value` (`include_str!`), **nie** `parse_units()`; asercja liczby wycenionych (66) z pliku | Zarzut 8: test ma być niezależny od produkcyjnego parsera. 75 wierszy, każdy: `basket_item_pn` == `Pieniądz (koszt)` gdy >0, inaczej `None`. |
| `tests/ai_turn.rs` | `ai_turn_default_city_parameters_match_ai_params_json` (NOWY, runda 1) | bez zmian w rundzie 2 | Czyta `data/ai-params.json` przez `serde_json::Value` (niezależnie od domeny); sprawdza `min_city_distance`=4, `threat_range`=7 i 6 wag `city_score`. |
| `tests/ai_turn.rs` | `hex_city_score_enemy_penalty_follows_threat_range_option` (NOWY, runda 2) | — | Wróg w odległości 6 od pozycji: różnica wyniku między `threat_range` 7 i 5 = `enemy_penalty` (−3). Pilnuje zarzutu 4. |
| `tests/ai_turn.rs`, `tests/terrain_movement_fix.rs` | shim `economy_society_part2` (runda 2) | tylko infrastruktura, bez zmiany asercji | Patrz §3.3. |

Żaden test z wektorem referencyjnym z weba lub nagrania nie został zmieniony ani osłabiony. Nie użyto `#[ignore]`. Brak usuniętych asercji.

## 5. Do decyzji właściciela

1. **ROZJECHANA #4 — Las (`terrain_defense_multiplier`, `combat.rs:219`).** Rust daje 1.25; JSON `terrain-combat.json` „Las” = +50% (1.5); web (`combat.ts:633–636`) daje 1.5 tylko przeciw dystansowi/flance, w pozostałych przypadkach 1.0. Opcje: (a) 1.5 bezwarunkowo (zmiana walki); (b) 1.5 warunkowo — wymaga roli atakującego w sygnaturze funkcji (zmiana API walki, `combat.rs` poza allowlistą tego tematu); (c) zostawić 1.25 jako świadomy odstęp od weba. Nie naprawiono.
2. **ROZJECHANA #13 — zbiór akcji mnożnika czasu traktatu (`diplomacy.rs:3072–3079`).** Rust stosuje ×2^((t−10)/5) także do `Peace`; web (`diplomacy-proposals.ts:595–599`) tylko do `nap`, `trybut_zadanie`, `trybut_oferta`. Opcje: (a) usunąć `Peace` z Rust (zmiana kosztu pokoju); (b) dodać `Peace` do weba. Nie naprawiono (logika, nie tabela).
3. **#18 Easy 1 / Hard 3 (`barbarians.rs:329–335`).** Brak kluczy per poziom w `ai-params.json` (jest jedno `barbarzyncy_jednostek_na_oboz`=2). Opcja: dodać trzy klucze do `gra/data` (zmiana danych, wymaga zgody właściciela).
4. **#15 udział lądu per typ (`map_generator.rs:495`).** Brak klucza w `map-gen-params.json`. Opcja: dodać cztery klucze (wartości identyczne z webem).
5. **#17 bonus handlowy 0.05 (`trade.rs:1477`).** Brak klucza. Opcja: dodać klucz w `econ-params.json` lub `society-params.json`.
6. **#11 `STEP_TEN_RESOURCES` (`diplomacy.rs:1870`).** Brak pola kroku w `resources.json`. Opcja: dodać `krok_handlu` do każdego z 13 surowców.
7. **#5 fort 100 / outpost 50 i model struktur.** Outpost 50 (web: `posterunek`, `main.ts:26974`) i fort 100 (web: `fort` teren, `main.ts:26973`) nie mają kluczy w JSON (`miasto-params.json` ma cytadelę 100). Web stackuje mur/cytadelę/bazę/palisadę (`city-defense.ts:56–75`), Rust ma trzy flagi. Decyzja: wpisać wartości do JSON i ustalić model (zmiana API `DefenseStructures`).
8. **#6 rzeka 1 i dzielniki dróg 3/5; #9 baza progu 20, zdrowie 0.05, retencja II 0.7, minimum 1.** Literały zgodne z webem (`road-movement.ts:13,17,37`; `economy.ts:229,1210,1217,1224`), brak w JSON. Opcja: wpisać do JSON (czysty refaktor, zero zmiany zachowania).
9. **Katalog `ValueCatalog::default()` (`diplomacy.rs:1767–1841`) — audyt zarzutu 6.** Cztery tabele są zgodne z JSON/webem, ale nadal są literałami: `resource_prices_per_block` 15/15 (`econ-params.json` `handel_surowce.cena_*.normal`); `technology_prices` 32/32 (`tech.json` `technologie[].Koszt nauki`, wartość przy tempie Szybka ×1 — web `applyTempoKoszt` (`tempo_gry`) zależy od wybranego tempa, Rust tego nie modeluje); `resource_access_prices` 12/12 (web `diplomacy-value-catalog.ts:75–85`: minimalny `koszt_praca` na `surowiecOdblokowany` w `terrain-improvements.json`); `deposit_prices` 6/6 (`diplomacy.json` `handel_zloze.cena_baza`). Decyzja: czy podpinać do JSON w tym temacie, czy w osobnym.
10. **Wdrożone zmiany zachowania (#10, #16) — potwierdzenie właściciela.** Zmiany są wykonaniem kroku B dispatchu (naprawa rozjechanych tabel, dane z JSON): ceny jednostek PN spadają (w większości o połowę, 63/66), AI: minimalna odległość miast 4, zasięg zagrożenia 7. Jeśli właściciel ich nie akceptuje, korekta idzie przez dane (`units.json`, `ai-params.json`), nie przez przywrócenie literałów.
11. **P3.17 pkt 2 — mnożnik epoki i dopłata `kon`** (`gra/src/game/building-stock-cost.ts:28,60–68,368–417`): bez zmian, decyzja z P3.17.
12. **Luka `counter_multiplier` (#3).** Wiersze Obrona (Spearman vs Mount +50%; flanka −50%) nie są w funkcji. Decyzja modelu walki (dotyczy tego samego pliku co pkt 1).

## 6. Bramki (surowe wyjścia)

Komendy: `cd rust-port/engine`; `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/<worktree> CARGO_PROFILE_DEV_DEBUG=0`. Każde wyjście poniżej kończy się `EXIT=<kod>`.

- **Baseline `d3a73641`** (eksport `git archive d3a73641 rust-port/engine rust-port/assets` do `scratchpad/base/`, bo `tests/assets_manifest.rs` czyta `rust-port/assets/MANIFEST.tsv`): fmt EXIT=0, clippy EXIT=0, test **324 passed**, 0 failed, EXIT=0 — Załącznik 2.
- **Runda 2 (stan commita)**: fmt EXIT=0, clippy EXIT=0, test **327 passed**, 0 failed, EXIT=0 — Załącznik 3.
- Historia (runda 1, `e97a9dfc`): 326 passed; zarzut 7 (brak baseline) przyjęty — baseline wklejony w Załączniku 2.

## 7. Commit rundy 2

- Baza: `e97a9dfc` (detached HEAD w worktree `wf_ff9aec9b-668-3`). Commit rundy 2 — SHA w raporcie Operatora.
- Zmienione pliki (jawne `git add`): `rust-port/engine/src/domain/ai_turn.rs`, `rust-port/engine/tests/ai_turn.rs`, `rust-port/engine/tests/terrain_movement_fix.rs`, `rust-port/engine/tests/diplomacy.rs`, `dyspozycje/rust-port/p3/P3-18-HARDCODED-TABLES.md`.
- `Cargo.lock` (untracked, wygenerowany przez cargo) NIE zacommitowany. Push NIE wykonano.
- Allowlista: brak zmian w `gra/**`, `bridge.rs`, `playable.rs`, `combat.rs`, `Cargo.toml`, `renderer/**`, `src-tauri/**`.

## 8. Odpowiedzi na zarzuty Evaluatora rundy 1

| # | Zarzut | Odpowiedź |
|---|---|---|
| 1 | Kryterium binarne: pozycje 2–9, 13 NIE_ZMIERZONO | **PRZYJĘTE.** Zmierzone w rundzie 2 (§1, Załącznik 4). |
| 2 | Brak dowodów dla #11, #12, #17, #18, „Python bez wyniku” | **PRZYJĘTE.** Komendy w §2, wyjścia w Załączniku 4; każdy wiersz §1 ma skrypt lub komendę. |
| 3 | `include_str!` + `serde_json::Value` zamiast `parse_*` | **PRZYJĘTE.** Domena używa `crate::data::economy_society_part2::parse_ai_params()`; testy `#[path]` dostają shim (§3.3). |
| 4 | `hex_city_score` ignoruje `options.threat_range` | **PRZYJĘTE.** Parametr dodany, `find_settler_target` go przekazuje; test `hex_city_score_enemy_penalty_follows_threat_range_option`. |
| 5 | Flaga `ai_turn.rs:888` nieopisana w tabeli było/jest | **PRZYJĘTE.** Wiersz w §3.3.1 (`under_threat`, `ai_turn.rs:894` po przesunięciu linii). |
| 6 | Tabele `ValueCatalog::default()` poza 18 pozycjami | **PRZYJĘTE.** Audyt 4 tabel (`audit6.py`): 15/15, 32/32, 12/12, 6/6 zgodne; nie podpinano (decyzja §5 pkt 9). |
| 7 | Brak surowych logów baseline | **PRZYJĘTE.** Załącznik 2: pełne wyjścia fmt/clippy/test na `d3a73641`. |
| 8 | Test all-rows liczy przez `parse_units()` | **PRZYJĘTE.** Test czyta surowy JSON (§4). |
| 9 | §5 pkt 8 (rundy 1) pytało o już zacommitowaną zmianę PN, sprzeczne z klasyfikacją #10 jako naprawy | **PRZYJĘTE.** Sformułowanie zmienione: §5 pkt 10 to potwierdzenie wdrożonej naprawy, nie pytanie o jej wykonanie. |

## 9. Historia pracy

- Runda 1 (`e97a9dfc`): #10, #16 naprawione; 9 pozycji NIE_ZMIERZONO; status BLOCK.
- Runda 2 (commit rundy 2): 2–9, 13 zmierzone; #6, #14–#18 i ValueCatalog dopisane z dowodami; #4 i #13 wykryte jako ROZJECHANE (nie naprawione, §5); zarzuty 3–9 przyjęte; status PASS-WITH-NOTES.

---

## Załącznik 1 — `diplomacy.rs` katalog PN jednostek: było / jest (ZMIERZONO, runda 1; bez zmian w rundzie 2)

Źródło „było”: `git diff` usuniętych linii `("Nazwa".to_owned(), X)` z `diplomacy.rs`. Źródło „jest”: `rust-port/engine/data/units.json` kolumna `Pieniądz (koszt)`.

| Jednostka | było (literał) | jest (units.json) |
|---|---|---|
| Wojownik | 10 | 5 |
| Procarz | 8 | 4 |
| Oszczepnik | 6 | 3 |
| Łucznik | 6 | 3 |
| Zwiadowca | 8 | 4 |
| Włócznik | 16 | 8 |
| Wojownik z mieczem i tarczą | 16 | 8 |
| Rydwan (woły) | 30 | 15 |
| Konnica | 22 | 11 |
| Galera | 18 | 9 |
| Falanga | 18 | 9 |
| Hastati | 18 | 9 |
| Jeździec chiński | 28 | 14 |
| Impi | 16 | 8 |
| Oszczepnik Zulu (Izijula) | 20 | 10 |
| Wojownik z maczugą (Chaska) | 26 | 13 |
| Wojownik z toporem | 18 | 9 |
| Procarz (Huaracoc) | 8 | 4 |
| Oszczepnik (Estólica) | 9 | 5 |
| Rydwan konny | 28 | 14 |
| Łucznik egipski | 14 | 7 |
| Rydwan egipski | 32 | 16 |
| Wojownik z khopesh | 18 | 9 |
| Łucznik nubijski | 20 | 10 |
| Łucznik sumeryjski | 9 | 5 |
| Rydwan sumeryjski | 38 | 19 |
| Włócznik sumeryjski | 18 | 9 |
| Wojownik mykeński | 18 | 9 |
| Rydwan mykeński | 30 | 15 |
| Wojownik Sherden | 18 | 9 |
| Halabardnik Shang | 18 | 9 |
| Rydwan Shang | 32 | 16 |
| Łucznik akadyjski | 16 | 8 |
| Gaesatae | 14 | 7 |
| Soldurii | 18 | 9 |
| Rydwan celtycki | 28 | 14 |
| Berserker germański | 16 | 8 |
| Taran | 14 | 7 |
| Taran okuty | 18 | 9 |
| Katapulta | 18 | 9 |
| Wieża oblężnicza | 20 | 10 |
| Wojownik tyrreński | 15 | 8 |
| Wojownik szekelesz | 14 | 7 |
| Konnica lancowa asyryjska | 32 | 16 |
| Konnica łucznicza asyryjska | 30 | 15 |
| Łucznik asyryjski | 14 | 7 |
| Drużynnik | 18 | 9 |
| Jeździec z oszczepami | 26 | 13 |
| Strażnik bram Harappy | 18 | 9 |
| Piechota induska | 18 | 9 |
| Garnizon Harappy | 18 | 9 |
| Rydwan Kapadokijski | 34 | 17 |
| Piechota hetycka | 18 | 9 |
| Gwardia hetycka | 18 | 9 |
| Gwardia Ishtar | 18 | 9 |
| Wojownik babiloński | 18 | 9 |
| Piechota neobabilońska | 18 | 9 |
| Tyrski miecznik | 18 | 9 |
| Wojownik fenicki | 18 | 9 |
| Gwardia Tyreńska | 18 | 9 |
| Thorakites | 16 | 8 |
| iButho z iklwa | 16 | 8 |
| Gwardzista z champi | 18 | 9 |
| Wojownik z żelaznym khopesh | 18 | 9 |
| Mur tarcz (Sargonid) | 18 | 9 |
| Miecznik galijski | 14 | 7 |

## Załącznik 2 — logi BASELINE `d3a73641` (surowe, pełne)

Eksport: `git archive d3a73641 rust-port/engine rust-port/assets` → `scratchpad/base/`. Komendy w `scratchpad/base/rust-port/engine`.

### 2a. `cargo fmt --check`

```text
EXIT=0
```

### 2b. `cargo clippy --all-targets -- -D warnings`

```text
    Updating crates.io index
     Locking 17 packages to latest compatible versions
   Compiling proc-macro2 v1.0.107
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling serde v1.0.229
   Compiling serde_json v1.0.154
    Checking once_cell v1.21.4
    Checking tracing-core v0.1.36
    Checking memchr v2.8.3
    Checking itoa v1.0.18
    Checking pin-project-lite v0.2.17
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling serde_derive v1.0.229
   Compiling tracing-attributes v0.1.31
    Checking tracing v0.1.44
    Checking civ-engine v0.1.0 (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/base/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 32.16s
EXIT=0
```

### 2c. `cargo test`

```text
    Finished `test` profile [unoptimized] target(s) in 0.03s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_validator_rejects_wrong_size ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.72s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/combat-7737db4785daf590)

running 7 tests
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test collection_id_sets_match_web_pin ... ok
test rt_auto_battle_params ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_citizen_resource_upkeep ... ok
test rt_ai_params ... ok
test rt_civ_ai ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_city_names_pools ... ok
test rt_civ_params ... ok
test rt_combat_params ... ok
test rt_counters ... ok
test rt_diplomacy ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_civs ... ok
test rt_buildings ... ok
test rt_e_start_params ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_civ_matrix ... ok
test rt_miasto_params ... ok
test rt_map_gen_params ... ok
test rt_resources ... ok
test rt_power_params ... ok
test rt_terrain_combat ... ok
test rt_econ_params ... ok
test rt_terrain_movement ... ok
test rt_tech ... ok
test rt_terrain_yields ... ok
test rt_ui_params ... ok
test rt_society_params ... ok
test rt_terrain_improvements ... ok
test web_pin_constants_are_internally_consistent ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_wonders ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_unreadable_file_is_io ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_missing_file_is_file_missing ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.35s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test alliance_uses_configured_hegemon_threshold ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test annexation_requires_vassal_economy_orientation ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_can_coexist_with_non_food_layers ... ok
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test public_engine_wire_aliases_are_stable ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test multiple_layers_stack_additively_per_resource ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test copied_state_and_forks_reproduce_independent_streams ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test canonical_state_round_trips_through_serde ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diff_and_serialization_preserve_route_contract ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3-base/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test scout_is_available_in_every_epoch ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test current_and_previous_epochs_are_available ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

## Załącznik 3 — logi RUNDA 2 (stan commita, surowe, pełne)

### 3a. `cargo fmt --check`

```text
EXIT=0
```

### 3b. `cargo clippy --all-targets -- -D warnings`

```text
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_ff9aec9b-668-3/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 1.91s
EXIT=0
```

### 3c. `cargo test`

```text
    Finished `test` profile [unoptimized] target(s) in 0.06s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 13 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test hex_city_score_enemy_penalty_follows_threat_range_option ... ok
test ai_turn_default_city_parameters_match_ai_params_json ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.54s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/combat-7737db4785daf590)

running 7 tests
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_params_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test collection_counts_match_web_pin ... ok
test rt_auto_battle_params ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_ai_params ... ok
test rt_citizen_resource_upkeep ... ok
test rt_civ_ai ... ok
test rt_city_names_pools ... ok
test rt_civ_params ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_buildings ... ok
test rt_combat_params ... ok
test rt_counters ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_civs ... ok
test rt_e_start_params ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_diplomacy ... ok
test rt_map_gen_params ... ok
test rt_civ_matrix ... ok
test rt_miasto_params ... ok
test rt_resources ... ok
test rt_power_params ... ok
test rt_terrain_combat ... ok
test rt_econ_params ... ok
test rt_tech ... ok
test rt_terrain_movement ... ok
test rt_society_params ... ok
test rt_terrain_improvements ... ok
test rt_ui_params ... ok
test rt_terrain_yields ... ok
test web_pin_constants_are_internally_consistent ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_wonders ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_unreadable_file_is_io ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_missing_file_is_file_missing ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.38s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/diplomacy-d94c0845f92f376e)

running 32 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test annexation_requires_vassal_economy_orientation ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test diplomacy_unit_prices_match_units_json_for_every_row ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/events-987aa8790b10a253)

running 8 tests
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_movement_costs_are_explicit ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_qualification_matches_the_world_map_rules ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test impassable_destination_is_allowed_as_the_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test multiple_layers_stack_additively_per_resource ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test canonical_state_round_trips_through_serde ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test land_route_bfs_crosses_desert_field ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diff_and_serialization_preserve_route_contract ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_ff9aec9b-668-3/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test current_and_previous_epochs_are_available ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test scout_is_available_in_every_epoch ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

## Załącznik 4 — pomiary 2–9, 10–18 (surowe wyjścia skryptów)

```text

##### python3 /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/audit2.py
rust records 42 regex matches 42
json buildings 42
only in rust []
only in json []
exact matches 42 of 42
EXIT=0

##### python3 /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/audit3.py
rust attack pairs 15
ATAK spearman -> mount json 1.5 rust 1.5 OK
ATAK mount -> distance json 1.5 rust 1.5 OK
ATAK mount -> slinger json 1.5 rust 1.5 OK
ATAK slinger -> spearman json 1.5 rust 1.5 OK
ATAK swordsman -> spearman json 1.15 rust 1.15 OK
ATAK mount -> offensive json 1.25 rust 1.25 OK
ATAK spearman -> spearman json 1.15 rust 1.15 OK
ATAK mount -> spearman json 1.15 rust 1.15 OK
ATAK swordsman -> mount json 1.5 rust 1.5 OK
ATAK offensive -> swordsman json 1.25 rust 1.25 OK
ATAK falangite -> mount json 1.5 rust 1.5 OK
ATAK distance -> spearman json 1.15 rust 1.15 OK
ATAK naval -> spearman json 1.15 rust 1.15 OK
ATAK offensive -> distance json 1.15 rust 1.15 OK
ATAK offensive -> slinger json 1.15 rust 1.15 OK
Atak rows matched 15 of 15 ; rust pairs not in json Atak rows: []
Obrona rows: [('Spearman', 'Mount', '+50%'), ('Atak z flanki (z boku)', 'Falangite/Distance/Slinger', '−50%')]
EXIT=0

##### python3 /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/audit6.py
counts 15 32 12 6
deposit vs diplomacy.json handel_zloze.cena_baza: 6 / 6 json keys 6 missing []
resource_prices_per_block vs econ-params cena_*: 15 / 15 matched keys 15
technology_prices vs tech.json Koszt nauki: 0 / 32 missing ['Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Rolnictwo', 'Łowiectwo', 'Łucznictwo', 'Oswojenie zwierząt', 'Mistycyzm', 'Wymiana', 'Gospodarka wodna', 'Koło', 'Brązownictwo', 'Żegluga', 'Pismo', 'Religia', 'Jeździectwo', 'Wojskowość', 'Matematyka', 'Handel', 'Kodeks', 'Budownictwo', 'Waluta', 'Astronomia', 'Hutnictwo żelaza', 'Inżynieria', 'Oblężnictwo', 'Filozofia', 'Prawo', 'Drogi brukowane', 'Medycyna', 'Obróbka żelaza', 'Sztuka wojenna']
sample tech row keys ['_key', '_opis', 'dluga', 'standardowa', 'szybka']
access bydlo rust 20.0 json (20, 'bydlo') OK
access owce rust 20.0 json (20, 'owce') OK
access lama rust 20.0 json (20, 'lama') OK
access kon rust 28.0 json (28, 'stadnina') OK
access glina rust 20.0 json (20, 'glinianka') OK
access kamien rust 22.0 json (22, 'kamieniolom') OK
access drewno rust 25.0 json (25, 'tartak') OK
access sol rust 20.0 json (20, 'warzelnia_soli') OK
access ruda rust 22.0 json (22, 'kopalnia_miedzi') OK
access ruda_zelaza rust 22.0 json (22, 'kopalnia_zelaza') OK
access ruda_cyny rust 22.0 json (22, 'kopalnia_cyny') OK
access zloto rust 22.0 json (22, 'kopalnia_zlota') OK
resource_access_prices vs terrain-improvements min koszt_praca: 12 / 12
EXIT=0

##### python3 /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/audit_extra.py
== #4 terrain_defense_multiplier vs terrain-combat.json (Bonus Obrona)
  Plain: rust=1.0 json_bonus=0% -> 1.0 => ZGODNA
  Forest: rust=1.25 json_bonus=50% -> 1.5 => ROZJECHANA
  Hills: rust=1.5 json_bonus=50% -> 1.5 => ZGODNA
  Mountain: rust=1.75 json_bonus=75% -> 1.75 => ZGODNA
  River: rust=1.0 json_bonus=0% -> 1.0 => ZGODNA
  web combat.ts Las:  633 (1.5 only vs dystans/flanka, else 1.0)
  web combat.ts pct :  642
== #5 structure_defense_multiplier vs miasto-params.json / web
  json bonus_obrona_mur_proc = 200
  json bonus_obrona_cytadela_proc = 100
  json bonus_obrona_baszta_proc = 100
  json bonus_obrona_palisada_proc = 100
  web main.ts posterunek: 26974
  web main.ts fort teren: 26973
  rust structure body:
    ['// Structure bonuses are additive percentage points: wall +200%, fort', '// +100%, outpost +50%, matching structureDefenseBonusFor in the game.', '1.0 + if structures.wall { 2.0 } else { 0.0 }', '+ if structures.fort { 1.0 } else { 0.0 }', '+ if structures.outpost { 0.5 } else { 0.0 }']
== #7 resource amounts vs terrain-improvements.json surowiec_ilosc_tura
  tartak: rust=200 json=200 => ZGODNA
  kamieniolom: rust=200 json=200 => ZGODNA
  glinianka: rust=50 json=50 => ZGODNA
  kopalnia_miedzi: rust=20 json=20 => ZGODNA
  kopalnia_zelaza: rust=20 json=20 => ZGODNA
  kopalnia_cyny: rust=20 json=20 => ZGODNA
  warzelnia_soli: rust=50 json=50 => ZGODNA
  stadnina: rust=25 json=25 => ZGODNA
  kopalnia_zlota: rust=1 json=1 => ZGODNA
  web era scaling: 232 ; normalizeProductionEra: 221
== #9 city_growth DEFAULT_* vs econ-params.json / miasto web
  DEFAULT_POPULATION_CAP: rust=5.0 json=5 => ZGODNA
  DEFAULT_GRANARY_POPULATION_CAP: rust=8.0 json=8 => ZGODNA
  DEFAULT_AQUEDUCT_POPULATION_CAP: rust=12.0 json=12 => ZGODNA
  DEFAULT_GROWTH_THRESHOLD_PER_POPULATION: rust=16.0 json=16 => ZGODNA
  DEFAULT_GRANARY_FOOD_RETENTION: rust=0.5 json=0.5 => ZGODNA
  DEFAULT_GROWTH_THRESHOLD_BASE: rust=20.0 json=BRAK (brak klucza w econ-params/miasto-params)
  DEFAULT_HEALTH_GROWTH_MODIFIER: rust=0.05 json=BRAK (brak klucza w econ-params/miasto-params)
  DEFAULT_GRANARY_TIER_TWO_FOOD_RETENTION: rust=0.7 json=BRAK (brak klucza w econ-params/miasto-params)
  DEFAULT_MINIMUM_POPULATION: rust=1 json=BRAK (brak klucza w econ-params/miasto-params)
  web baseThreshold 20: 1217
  web health default 0.05: 229
  web tier-two retention 0.7: 1224
  web min pop (ludnosc > 1): 1210
== #13 diplomacy multipliers vs diplomacy.json / web
  json progHandelWillingnessMin = 0.5
  rust trade_willingness_min default: 0.5
  rust slopes: ['0.15', '0.20']
  web slopes: EASE 908 PENALTY 910
  rust treaty action set: ['Nap', 'TributeDemand', 'TributeOffer', 'Peace']
  web TREATY_DURATION_MULTIPLIER_ACTIONS line: 595
  web treatyDurationPnMultiplier line: 613
EXIT=0

##### python3 /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/audit14.py
rust variants parsed: ['Cattle', 'ClayPit', 'Clearing', 'CopperMine', 'Farm', 'FishingBoats', 'Fort', 'GoldMine', 'HorseRanch', 'HuntingCamp', 'IronMine', 'Irrigation', 'Llama', 'LumberMill', 'Outpost', 'PavedRoad', 'Quarry', 'Road', 'SaltWorks', 'Sheep', 'Terraces', 'TinMine']
  Farm (farma): rust={'zywnosc': 3, 'praca': 3, 'handel': 3} res=None | json={'zywnosc': 3, 'praca': 3, 'handel': 3} res_json=None => ZGODNA
  Irrigation (irygacja): rust={'zywnosc': 5, 'praca': 2, 'handel': 2} res=None | json={'zywnosc': 5, 'praca': 2, 'handel': 2} res_json=None => ZGODNA
  Cattle (bydlo): rust={'zywnosc': 2, 'praca': 4, 'handel': 3} res=None | json={'zywnosc': 2, 'praca': 4, 'handel': 3} res_json=None => ZGODNA
  Sheep (owce): rust={'zywnosc': 1, 'praca': 2, 'handel': 2} res=None | json={'zywnosc': 1, 'praca': 2, 'handel': 2} res_json=None => ZGODNA
  Llama (lama): rust={'zywnosc': 1, 'praca': 3, 'handel': 3} res=None | json={'zywnosc': 1, 'praca': 3, 'handel': 3} res_json=None => ZGODNA
  HorseRanch (stadnina): rust={'praca': 2, 'handel': 2} res=('kon', 25) | json={'praca': 2, 'handel': 2} res_json=25 => ZGODNA
  LumberMill (tartak): rust={'praca': 3, 'handel': 3} res=('drewno', 200) | json={'praca': 3, 'handel': 3} res_json=200 => ZGODNA
  ClayPit (glinianka): rust={'praca': 1, 'handel': 2, 'glina': 10} res=('glina', 50) | json={'praca': 1, 'glina': 10, 'handel': 2} res_json=50 => ZGODNA
  Quarry (kamieniolom): rust={'praca': 1, 'handel': 2, 'kamien': 5} res=('kamien', 200) | json={'praca': 1, 'kamien': 5, 'handel': 2} res_json=200 => ZGODNA
  IronMine (kopalnia_zelaza): rust={'praca': 2, 'handel': 5} res=('ruda_zelaza', 20) | json={'praca': 2, 'handel': 5} res_json=20 => ZGODNA
  GoldMine (kopalnia_zlota): rust={'praca': 2, 'handel': 10} res=('zloto', 1) | json={'praca': 2, 'handel': 10} res_json=1 => ZGODNA
  SaltWorks (warzelnia_soli): rust={'zywnosc': 1, 'praca': 1, 'handel': 3, 'pieniadz': 1} res=('sol', 50) | json={'pieniadz': 1, 'zywnosc': 1, 'praca': 1, 'handel': 3} res_json=50 => ZGODNA
  HuntingCamp (oboz_lowiecki): rust={'zywnosc': 1, 'praca': 1, 'handel': 2, 'pieniadz': 1} res=None | json={'zywnosc': 1, 'pieniadz': 1, 'praca': 1, 'handel': 2} res_json=None => ZGODNA
  Terraces (tarasy): rust={'zywnosc': 3, 'praca': 2, 'handel': 2} res=None | json={'zywnosc': 3, 'praca': 2, 'handel': 2} res_json=None => ZGODNA
  FishingBoats (lodzie_rybackie): rust={'zywnosc': 2, 'praca': 3, 'handel': 3} res=None | json={'zywnosc': 2, 'praca': 3, 'handel': 3} res_json=None => ZGODNA
  CopperMine (kopalnia_miedzi): rust={'praca': 2, 'handel': 5} res=None | json={'praca': 2, 'handel': 5} res_json=20 => ZGODNA
  TinMine (kopalnia_cyny): rust={'praca': 2, 'handel': 5} res=None | json={'praca': 2, 'handel': 5} res_json=20 => ZGODNA
  Road (droga): rust={'handel': 2} res=None | json={'handel': 2} res_json=None => ZGODNA
  PavedRoad (droga_brukowana): rust={'handel': 3} res=None | json={'handel': 3} res_json=None => ZGODNA
  Clearing (wyrab): rust={'handel': 1} res=None | json={'handel': 1} res_json=None => ZGODNA
zgodne: 20 / 20
EXIT=0

##### python3 /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/audit_extra3.py
== #11 STEP_TEN_RESOURCES vs web HANDEL_SUROWCE_KROK10
  rust (13): ['drewno', 'glina', 'kamien', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'cegla', 'sol', 'kon', 'ceramika', 'braz', 'zelazo', 'stal']
  web  (13): ['drewno', 'glina', 'kamien', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'cegla', 'sol', 'kon', 'ceramika', 'braz', 'zelazo', 'stal']
  identical (ordered): True
  web declaration line: 308
  resources.json has krok field?: False
== #12 trade.rs keys vs buildings.json / resources.json
  TRADE_BUILDING_IDS ['targowisko', 'port', 'port_wielki'] [True, True, True]
  PORT_BUILDING_IDS ['port', 'port_wielki'] [True, True]
  TRADE_ROUTE_RESOURCE_KEYS ['braz', 'zelazo', 'kon', 'cegla', 'zloto']
    braz -> resources.json: Brąz
    zelazo -> resources.json: Żelazo
    kon -> resources.json: Koń
    cegla -> resources.json: Cegła
    zloto -> resources.json: Złoto
== #15 default_land_fraction vs web defaultLandFractionForTyp
  rust: [('Continents', '0.30'), ('Pangea', '0.60'), ('Islands', '0.50'), ('Earth', '0.21')]
  web: []
  web line: 3254
== #17 trade bonus rate
  rust: 0.05
  web: TRADE_ROUTE_BUILDING_BONUS_RATE = 0.05; line 1646
== #18 barbarian_units_per_camp_for_difficulty
  rust: [('Easy', '1', '', ''), ('Hard', '3', '', ''), ('', '', 'Normal', '2')]
  web line: 559
  json barbarzyncy_jednostek_na_oboz = 2
  json keys with easy/hard per camp: ['barbarzyncy_jednostek_na_oboz']
EXIT=0

##### python3 /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/audit6b.py
json costs: {'Laka': 1, 'Rownina': 1, 'Pustynia': 2, 'Wybrzeze': 99, 'Wzgorza': 2, 'Gory': 99, 'Morze': 99, 'Polarny': 99} forestExtra: 1
pathfinding MovementRules default: {'grassland': 'Some(1)', 'plains': 'Some(1)', 'desert': 'Some(2)', 'hills': 'Some(2)', 'forest_extra': '1', 'river_cost': '1', 'road_divisor': '3', 'paved_road_divisor': '5'}
terrain.rs movement_cost arms: [('Hills', 'Some(2)'), ('Grassland | Self::Plains', 'Some(1)'), ('Desert', 'Some(2)'), ('Mountains | Self::ShallowWater | Self::Ocean | Self::Tundra', 'None')]
  Laka (Grassland): json=1->1 terrain.rs=1 => ZGODNA
  Rownina (Plains): json=1->1 terrain.rs=1 => ZGODNA
  Pustynia (Desert): json=2->2 terrain.rs=2 => ZGODNA
  Wybrzeze (ShallowWater): json=99->None terrain.rs=None => ZGODNA
  Wzgorza (Hills): json=2->2 terrain.rs=2 => ZGODNA
  Gory (Mountains): json=99->None terrain.rs=None => ZGODNA
  Morze (Ocean): json=99->None terrain.rs=None => ZGODNA
  Polarny (Tundra): json=99->None terrain.rs=None => ZGODNA
terrain.rs movement_cost zgodne: 8 / 8
  pathfinding MovementRules.grassland: rust=Some(1) json=1
  pathfinding MovementRules.plains: rust=Some(1) json=1
  pathfinding MovementRules.desert: rust=Some(2) json=2
  pathfinding MovementRules.hills: rust=Some(2) json=2
  pathfinding forest_extra: rust= 1 json= 1
EXIT=0
```
