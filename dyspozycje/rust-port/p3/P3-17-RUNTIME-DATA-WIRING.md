# P3.17 — Runtime data wiring: audyt tabel i rekrutacja z units.json

STATUS: PASS po Final Control (runda 3): opcja A zastosowana, vector parity_suite zaktualizowany do JSON; patrz Załącznik J. Wcześniejszy BLOCK (rundy 1-2) opisany w §6-§8.
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-17-RUNTIME-DATA-WIRING-Q1
RUNDA: 1/5
BAZA: `origin/rust-port/parity-v2` = `17454b33` (HEAD worktree detached)
PIN danych: `edb8fb56` (`gra/data/*`), kopia w `rust-port/engine/data/units.json`
ZMIANY: niezcommitowane. Runda 1 w worktree `wf_fb9c7958-44a-1`; runda 2 odtworzona w `wf_fb9c7958-44a-3` (BLOCK = bez commita; patrz §6, §0)
DEPLOY/PUSH: NIE WYKONANO

Oznaczenia: **ZMIERZONO** = własna komenda w tym przebiegu; **NIE_ZMIERZONO** = brak pomiaru w tym przebiegu (BLOCK zatrzymał temat przed pełnym audytem).

---

## 0. Odpowiedzi na zarzuty Evaluatora i Final Control (runda 2, ta sama ID)

Stan odtworzony z plików roboczych Operatora (`/home/user/The-Game/.claude/worktrees/wf_fb9c7958-44a-1`, brak commita w rundzie 1): `recruitment.rs`, `tests/recruitment.rs` i ten dokument skopiowane 1:1 do worktree na bazie `origin/rust-port/parity-v2` = `17454b33`. Pozostałe pliki allowlisty porównane `cmp` (identyczne z bazą). Commit NIE wykonany: test `parity_suite` jest czerwony, więc commit byłby czerwony (BLOCK).

| # | Zarzut | Werdykt | Dowód / działanie |
|---|---|---|---|
| 1 | Kryterium binarne: `cargo test` EXIT=101 | **PRZYJMUJĘ** (fakt) | Odtworzone: 323 passed, 1 failed, EXIT=101 (Załącznik G). Nie da się usunąć czerwieni bez zmiany `tests/parity_suite.rs`, czego dispatch zakazuje po cichu. Temat NIE jest PASS. Propozycja zmiany do decyzji: §8 pkt 1. |
| 2 | Test `parity_suite` koduje stare wartości (10/50/10, drewno 57→7); web nie produkuje 10 zł ani 50 drewna | **PRZYJMUJĘ** | Web złoto: `gra/src/game/production.ts:273-289` (`unitCostFromDef`) zwraca surowy `Pieniądz (koszt)` gdy > 0, czyli dla Wojownika 5. Drewno: baza 13 × `epochCostMultiplier` ∈ {×1, ×2, ×4} (`building-stock-cost.ts:28-34, 60-68`) daje {13, 26, 52}; 50 nie jest osiągalne. Brak jawnej propozycji w rundzie 1 — uzupełniona w §8 pkt 1. |
| 3 | Audyt niekompletny: `improvements.rs`, `map_generator.rs`, `ai_turn.rs` DEFAULT_*, `trade.rs:1477`, `barbarians.rs:331-333` | **PRZYJMUJĘ** | Dopisane do §2 jako pozycje 14–18 z pomiarem tam, gdzie się dało (ZMIERZONO) albo NIE_ZMIERZONO z powodem. |
| 4 | `diplomacy.rs:1842-1905` oznaczone NIE_ZMIERZONO; powinno być ROZJECHANA | **PRZYJMUJĘ** (zmierzone) | ZMIERZONO w tym przebiegu: 64 wpisy w zakresie 1842–1905, **0/64 zgodnych** z `units.json` `Pieniądz (koszt)` (Załącznik H). Werdykt pozycji 10: ROZJECHANA. Zarzut podaje 66 wpisów; mój zakres 1842–1905 daje 64, liczba w tabeli jest z mojego pomiaru. |
| 5 | Próbka ≥5 wierszy na tabelę; 12 z 13 pozycji NIE_ZMIERZONO | **PRZYJMUJĘ** częściowo | Rekrutacja: pełne 75/75 (ZMIERZONO). Diplomacy: 64/64 (ZMIERZONO). Pozycje 15, 16, 18: zmierzone częściowo (jednoznaczny klucz JSON tam, gdzie istnieje). Pozycje 14 i 17: NIE_ZMIERZONO. Pozycje 2–9, 11–13: NIE_ZMIERZONO (bez zmian z rundy 1) (zakres audytu poza rekrutacją, dispatch: „tego audytu NIE naprawiaj poza rekrutacją”; pomiar wymaga osobnego tematu). |
| 6 | Test `kon 25 → None` utrwala rozjazd z webem; wymagany komentarz | **PRZYJMUJĘ** | Dodany komentarz w `tests/recruitment.rs` (sekcja Konnica) z odwołaniem do `building-stock-cost.ts:368-369, 383-389, 415-417`. Asercja NIE zmieniona. |
| 7 | §3 pomija fallback roli dla surowego 0 (`production.ts:275-288`) | **PRZYJMUJĘ** | Dopisane w §3. Skutek danych (ZMIERZONO na `pin_units.json`): 9 wierszy ma `Pieniądz (koszt)` = 0 i WSZYSTKIE mają `Super-jednostka == TAK` (Hieros Lochos, Triari, Hu Ben Wei, uThulwana, Królewska Gwardia, Medżaj, Gwardia Królewska Sumeru, Wojownik germański, Evocati). Web dla nich zwraca 0 (`production.ts:280-282`), więc domena z `gold_cost = 0` jest zgodna z webem. Wiersz bez `Super-jednostka` i z kosztem 0 nie istnieje; fallback roli nie wpływa na dane. |
| 8 | §3 przyjmuje `kon` 25 bez odnotowania komentarza „+5 Koni” (`building-stock-cost.ts:398-399`) | **PRZYJMUJĘ** | Potwierdzone: komentarz w `building-stock-cost.ts:398-399` mówi „+5 Koni”, a stała `MOUNT_UNIT_HORSE_STOCK_COST` (`:368-369`) = 25. Rozbieżność WEWNĄTRZ weba, odnotowana w §3. Domena nie wybiera wartości: JSON nie ma kolumny `kon`. |
| 9 | Kopia `units.json` = pin `edb8fb56` bajtowo, ale różni się od bieżącego `gra/data/units.json` w polach bojowych (~60 różnic) | **PRZYJMUJĘ** (liczba poprawiona) | ZMIERZONO: kopia = pin (`cmp`, identyczna). Względem `HEAD` `gra/data/units.json`: 13 wierszy z różnicami, **176 różnic pól**, wszystkie w polach bojowych (Atak, Health, Obrona, Uderzenie, Pancerz, Przebicie, fieldPower, meleeAttack, … ). Pola rekrutacyjne (`Pieniądz (koszt)`, `Surowiec`, `Surowiec (ilość)`, `Utrzymanie*`, `Super-jednostka`) — 0 różnic. Dodane w §5. |
| 10 | Test 75/75 używa własnego `domain_key` i tego samego embeddingu: słabość | **PRZYJMUJĘ** (ograniczenie, bez zmiany kodu) | Test sprawdza zgodność mapowania, nie niezależne źródło. Niezależne sprawdzenie liczb: skrypt Python na `pin_units.json` (Załącznik F, kolumny z JSON) i pomiar diplomacy. Zmiana na niezależne liczby w kodzie byłaby „liczbami w kodzie”, czego dispatch zabrania. |

Wszystkie zarzuty przyjęte; żadnego ODRZUCAM. Zmiana kodu w rundzie 2: tylko komentarz w `tests/recruitment.rs` (zarzut 6). Wartości i asercje bez zmian.

---

## 1. Baseline (PRZED zmianami, ZMIERZONO)

| Komenda (`rust-port/engine`, `CARGO_INCREMENTAL=0`, `CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_fb9c7958-44a-1`) | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT=0 |
| `cargo clippy --all-targets --offline -- -D warnings` | EXIT=0 |
| `cargo test --offline` | 36 sekcji `test result`, suma passed = 323, failed = 0, EXIT=0 |

Surowe pełne wyjścia: Załącznik A (fmt), B (clippy), C (test). Zgodne z oczekiwanym baseline 323.

---

## 2. Audyt tabel danych w `src/domain/**` (krok 1)

Metoda: `git grep`/`grep` po funkcjach i stałych zwracających/zawierających dane gry (koszty, utrzymanie, statystyki, mnożniki, wydajności). Pełny pomiar porównawczy wykonano TYLKO dla rekrutacji. Pozostałe pozycje są zinwentaryzowane, ale nie zmierzone w tym przebiegu.

| # | Tabela / funkcja | Plik:linia (HEAD 17454b33) | Odpowiedni plik JSON | Werdykt |
|---|---|---|---|---|
| 1 | `canonical_recruitment_costs()` (ręczna tabela 75 wierszy) | `src/domain/recruitment.rs:204` | `units.json` | **ROZJECHANA** — ZMIERZONO: 0/75 wierszy zgodnych w pełni; koszt złota zgodny 9/75, utrzymanie złota 75/75, surowiec zgodny 1/75 (Zwiadowca, brak surowca w obu), utrzymanie surowca zgodne 1/75 (Zwiadowca). Szczegóły: §5 i Załącznik F. **Naprawione w tym temacie (kod), BLOCK na teście** |
| 2 | `canonical_building_costs()` | `src/domain/building_costs.rs:108` | `buildings.json` | NIE_ZMIERZONO |
| 3 | `counter_multiplier()` | `src/domain/combat.rs:186` | `counters.json` | NIE_ZMIERZONO |
| 4 | `terrain_defense_multiplier()` | `src/domain/combat.rs:219` | `terrain-combat.json` | NIE_ZMIERZONO |
| 5 | `structure_defense_multiplier()` | `src/domain/combat.rs:229` | `combat-params.json` | NIE_ZMIERZONO |
| 6 | `TerrainType::movement_cost()` / `terrain_movement_cost()` | `src/domain/terrain.rs:91`, `src/domain/pathfinding.rs:272` | `terrain-movement.json` | NIE_ZMIERZONO |
| 7 | `resource_yield_for_improvement()` / `territory_resource_yield_for_improvement()` | `src/domain/resource_production.rs:140,145` | `terrain-yields.json`, `terrain-improvements.json` | NIE_ZMIERZONO |
| 8 | `ResourceYield::with_yields(...)` (literały wydajności AI) | `src/domain/ai_turn.rs:154` | `terrain-yields.json` | NIE_ZMIERZONO |
| 9 | Stałe wzrostu miasta `DEFAULT_*` | `src/domain/city_growth.rs` (eksport `lib.rs`) | `miasto-params.json`, `econ-params.json` | NIE_ZMIERZONO |
| 10 | Wartości jednostek w katalogu PN dyplomacji (lista literałów, np. `Wojownik` = 10.0, `Konnica lancowa asyryjska` = 32.0) | `src/domain/diplomacy.rs:1842–1905` | `units.json` (kolumna `Pieniądz (koszt)`) / `diplomacy.json` **ROZJECHANA** — ZMIERZONO w rundzie 2: 64 wpisy w zakresie 1842–1905, **0/64 zgodnych** z `units.json` `Pieniądz (koszt)`; wszystkie 64 nazwy istnieją w JSON. Wartości to najczęściej 2× koszt JSON (np. `Wojownik` 10.0 vs 5, `Konnica` 22.0 vs 11, `Taran` 14.0 vs 7), wyjątki np. `Wojownik tyrreński` 15.0 vs 8. Pełna lista: Załącznik H. Tabela jest częścią `ValueCatalog` (`let unit_prices = BTreeMap::from([...])`, ok. l.1841) i zasila wycenę koszyka PN (`basket_item_pn`, `diplomacy.rs:1983`). Nie mierzono `diplomacy.json` (osobny temat). |
| 11 | `STEP_TEN_RESOURCES` (lista zasobów) | `src/domain/diplomacy.rs:1919` | `resources.json` | NIE_ZMIERZONO |
| 12 | `TRADE_ROUTE_RESOURCE_KEYS`, `TRADE_BUILDING_IDS`, `PORT_BUILDING_IDS` (klucze, nie liczby) | `src/domain/trade.rs:313,316,1577` | `resources.json`, `buildings.json` | NIE_ZMIERZONO (klucze; zgodność nazw do pomiaru) |
| 13 | Mnożniki dyplomacji (`handel_willingness_multiplier`, `treaty_duration_pn_multiplier`) | `src/domain/diplomacy.rs:3081,3121` | `diplomacy.json`, `diplomacy-acceptance-points.json` | NIE_ZMIERZONO |

| 14 | `Production::resource(...)` + `work/trade/clay/stone` w `improvements_production` (np. `kon` 25, `drewno` 200, `glina` 50, `kamien` 200, `ruda` 20, `ruda_zelaza` 20, `zloto` 1, `sol` 50) | `src/domain/improvements.rs:376–422` | `terrain-improvements.json` / `buildings.json` (nie zidentyfikowano jednoznacznego wiersza) | NIE_ZMIERZONO (co najmniej 9 wierszy w l.376–422; pomiar w osobnym temacie) |
| 15 | Udziały lądu wg typu świata `default_land_fraction` (0.30 / 0.60 / 0.50 / 0.21) | `src/domain/map_generator.rs:495–501` | `map-gen-params.json` | BRAK ODPOWIEDNIKA W JSON — ZMIERZONO: w `data/*.json` nie ma klucza udziału lądu per typ świata; `map-gen-params.json` ma tylko `relief_land_fraction` (inne pojęcie: udział Gór/Wzgórz). Do potwierdzenia w `gra/src` (NIE_ZMIERZONO). |
| 16 | Stałe AI `DEFAULT_MIN_CITY_DISTANCE = 5`, `DEFAULT_THREAT_RANGE = 5`, `DEFAULT_CITY_SCORE_*` (-3, 3, 2, 1, 2, 2) | `src/domain/ai_turn.rs:18–25` | `ai-params.json` | **ROZJECHANA** dla `DEFAULT_MIN_CITY_DISTANCE`: ZMIERZONO 5 vs `ekspansja_min_dystans_miast` = **4** (1 wartość). Pozostałe stałe: NIE_ZMIERZONO. Uwaga: stała jest domyślną wartością (fallback), semantyka do potwierdzenia. |
| 17 | `TRADE_ROUTE_BUILDING_BONUS_RATE = 0.05` | `src/domain/trade.rs:1477` | `econ-params.json` / `society-params.json` (kandydaci: `society-params.json` l.125, 534, 747 z `0.05`, bez jednoznacznego klucza) | NIE_ZMIERZONO (brak jednoznacznego odpowiednika; wymaga decyzji o mapowaniu) |
| 18 | Liczba jednostek w obozie barbarzyńców wg poziomu `barbarian_units_per_camp_for_difficulty` (Easy 1, Normal 2, Hard 3) | `src/domain/barbarians.rs:329–334` | `ai-params.json` `barbarzyncy_jednostek_na_oboz` = 2 | **CZĘŚCIOWO ROZJECHANA** — ZMIERZONO: Normal 2 = 2 zgodne; Easy 1 i Hard 3 nie mają odpowiednika w JSON (JSON ma jedną wartość dla wszystkich poziomów). Uwaga: zarzut mówił o „liczbie obozów”; funkcja zwraca liczbę jednostek na obóz, zgodnie z nazwą klucza JSON. |

Wniosek (runda 2): w `src/domain/**` zinwentaryzowano 18 pozycji. Zmierzone: #1 rekrutacja 75/75 (ROZJECHANA), #10 diplomacy 0/64 (ROZJECHANA), #16 1 wartość (ROZJECHANA), #18 3 wartości (częściowo ROZJECHANA), #15 brak odpowiednika w `data/`. Pozostałe NIE_ZMIERZONO. Pełny audyt pozostałych pozycji przechodzi do osobnego tematu (zgodnie z dispatchem: „tego audytu NIE naprawiaj poza rekrutacją”).

---

## 3. Mapowanie pól `units.json` → `UnitRecruitment` i dowód z weba (krok 2)

Mapowanie zastosowane w kodzie (`rust-port/engine/src/domain/recruitment.rs`, `recruitment_from_unit_record`):

| Pole JSON (`UnitRecord`, `src/data/units_combat.rs`) | Pole domeny | Dowód / uwaga |
|---|---|---|
| `Jednostka` | `unit_id` | klucz 1:1 (wszystkie 75 nazw obecne w starej tabeli) |
| `Typ` | `unit_type` | 1:1 |
| `Pieniądz (koszt)` (`pieniadz_koszt`) | `gold_cost` | web: `gra/src/game/production.ts:274` (`def['Pieniądz (koszt)']`), `gra/src/ui/cityPanel.ts:7949` („Koszt rekrutacji”) |
| `Utrzymanie (Pieniądz/turę)` (`utrzymanie_pieniadz_ture`) | `gold_upkeep` | web: `gra/src/ui/cityPanel.ts:7950–7951` |
| `Surowiec` + `Surowiec (ilość)` | `stock_cost[klucz] = ilość` | web: `gra/src/game/building-stock-cost.ts:407–412` (`unitStockCost`): klucz = `stripDiacriticsLower(Surowiec)`, ilość bazowa z `Surowiec (ilość)`. **Różnica (NIE odwzorowana):** web mnoży ilość przez `scaleCostByEpoch(ilosc, Epoka)` (`building-stock-cost.ts:60–66`, `epochCostMultiplier` `:28–`: epoka ≥3 → ×4, ≥2 → ×2, inaczej ×1; `zelazo` → ×4, `braz` → ×2, `kamien` → ×1). Domena trzyma wartość bazową z JSON. |
| `Utrzymanie surowiec` + `Utrzymanie surowiec (ilość)` | `resource_upkeep[klucz] = ilość` | Mapowanie literalne. Runtime użycia w `gra/src` NIE zlokalizowano w tym przebiegu (NIE_ZMIERZONO); w `gra/src/data/loader.ts:47,49` tylko typy. |
| `Super-jednostka == "TAK"` | `super_unit` | Mapowanie literalne (NIE_ZMIERZONO w webie w tym przebiegu) |

**Klucz zasobu:** `Drewno` → `drewno`, `Brąz` → `braz`, `Żelazo` → `zelazo`. Zgodne z istniejącymi kluczami domeny (`braz`, `zelazo`, `drewno`) i z `stripDiacriticsLower` w webie. Jednoznaczne (3 nazwy w JSON).

**Reguła horyzontu konia (web, NIE odwzorowana):** `building-stock-cost.ts:368–369` (`MOUNT_UNIT_HORSE_STOCK_COST = 25`, `MOUNT_UNIT_HORSE_STOCK_KEY = 'kon'`), `:383–389` (`unitRequiresMountHorseStock`: `Typ == Mount` oprócz `Rydwan (woły)`), `:415–417` (dodanie `kon` × `scaleCostByEpoch`). Stara tabela Rust dawała `kon = 25` dla Konnicy i innych jednostek Mount — to NIE jest wartość z `units.json`; w nowym mapowaniu `kon` zniknął (patrz Załącznik F i §4).

**Uzupełnienia rundy 2 (dowody z `edb8fb56`):**
- Złoto: web `unitCostFromDef` (`gra/src/game/production.ts:273–289`) zwraca surowy `Pieniądz (koszt)` gdy > 0. Fallback roli (`DEFAULT_COST_BY_ROLE`, `:275–288`) działa tylko dla braku/zera kosztu, a zero jest zwracane bez fallbacku wyłącznie dla `Super-jednostka == TAK` (`:280–282`). W danych: 9 wierszy z kosztem 0, wszystkie super (patrz §2 zarzut 7). Domena = JSON, zgodnie z webem dla tych danych.
- Epoka: `epochCostMultiplier` (`building-stock-cost.ts:28–34`) ×1/×2/×4 dla epoki <2 / =2 / ≥3, `scaleCostByEpoch` (`:60–68`) zwraca `max(1, round(cost × mult))` dla kosztu > 0. Drewno Wojownika (baza 13) w webie to więc 13, 26 albo 52 — nigdy 50.
- Dopłata konia: stała `MOUNT_UNIT_HORSE_STOCK_COST = 25` (`building-stock-cost.ts:368–369`) i komentarz nad `unitRequiresMountHorseStock` / `unitStockCost` („+5 Koni”, `:398–399`, również w komentarzu PYTANIE-84 U-15). Rozbieżność WEWNĄTRZ weba: komentarz mówi 5, kod stały 25; który obowiązuje, rozstrzyga właściciel (nie zgadywano). Domena nie ma kolumny `kon` w JSON, więc nie wpisuje 25 ani 5.
- Pin vs bieżący `gra/data/units.json`: patrz §5.

**Decyzja do właściciela (nie rozstrzygnięta w tym temacie):** czy domena ma stosować mnożnik epoki i dopłatę `kon` jak web. Dispatch wymagał mapowania 1:1 z JSON, więc domena = wartości bazowe JSON; efektywne koszty web różnią się (do ×4 dla Żelaza oraz +25×mnożnik kon). To osobny temat rewiringu reguł.

---

## 4. Zmiany kodu (krok 2)

- `rust-port/engine/src/domain/recruitment.rs`: usunięta ręczna tabela (ok. 690 linii literałów); `canonical_recruitment_costs()` = `parse_units()` (embedded `include_str!` z `rust-port/engine/data/units.json`, bajtowo = pin) + `OnceLock` cache; `resource_key()` (małe litery, bez diakrytyków). Publiczne sygnatury (`UnitRecruitment`, `recruitment_for`, `spend_recruitment`, …) i eksporty `lib.rs` BEZ zmian.
- `rust-port/engine/src/data/units_combat.rs`: BEZ zmian (pola `UnitRecord` są już `pub`, nie trzeba akcesorów).
- `rust-port/engine/src/lib.rs`: BEZ zmian.
- `rust-port/engine/Cargo.toml`: BEZ zmian (żadnych nowych zależności).
- `rust-port/engine/tests/recruitment.rs`: zmienione asercje (lista poniżej) + nowy test `canonical_catalog_matches_units_json_for_all_75_rows` (sprawdza 75/75 wierszy względem `parse_units()`: typ, koszt złota, utrzymanie złota, surowiec, utrzymanie surowca, super-jednostka).

Lista zmian w testach (każda ze stare→JSON, uzasadnienie: stare liczby były ręcznym wpisem rozjechanym z `units.json`):

1. `canonical_unit_record_keeps_purchase_and_upkeep_separate`: Wojownik koszt złota 10→5; stock drewno 50→13; utrzymanie drewno 10→3. Konnica: stock braz 50→25; stock `kon` 25→`None` (brak w JSON); utrzymanie braz 10→5.
2. `recruitment_affordability_checks_only_the_one_time_purchase_stock`: Wojownik drewno 57 (true) / 49 (false) → 13 (true) / 12 (false); dodano Włócznik braz 25 (true) / 24 (false).
3. `successful_recruitment_spends_purchase_stock_but_not_future_upkeep`: po zakupie Wojownika drewno 57→44 (było 7); utrzymanie drewno 10→3.
4. `failed_recruitment_is_atomic_and_reports_the_missing_resource`: drewno 49→12; `required` 50→13; `available` 49→12.
5. `upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units`: oczekiwane `braz 10 / drewno 20` → `braz 5 / drewno 6` (2× Wojownik, 1× Włócznik).
6. Nowy test: 75/75 zgodność z `units.json`.

Testy NIE zmienione: `canonical_catalog_contains_all_unit_rows_and_round_trips` (nadal 75 i round-trip), `empty_purchase_cost_is_affordable_and_keeps_stock_unchanged`.

---

## 5. Różnice stare-vs-JSON, 75 jednostek (ZMIERZONO)

Źródło: stara tabela z `git show HEAD:rust-port/engine/src/domain/recruitment.rs` vs `rust-port/engine/data/units.json`. Format wiersza: `gold` = koszt złota, `gup` = utrzymanie złota, `stock` = surowiec+ilość, `up` = utrzymanie surowca+ilość, `sup` = super-jednostka. Pola `typ` i `gup` zgodne we wszystkich 75 wierszach (różnice: `typ` 0, `gup` 0, `sup` 0; `gold` 66, `stock` 74, `up` 74). Wiersz `Zwiadowca` (brak surowca w JSON) różni się tylko kosztem złota.

**Pin vs bieżący `gra/data/units.json` (ZMIERZONO, rozszerzenie zarzutu 9):**
- `rust-port/engine/data/units.json` jest bajtowo identyczny z `git show edb8fb56:gra/data/units.json` (`cmp`).
- Względem `HEAD` (`gra/data/units.json` na `17454b33`) różni się: 13 wierszy, 176 różnic pól (liczby na pole: `health`/`Health`/`Atak`/`weaponDamage`/`Obrona`/`Uderzenie`/`meleeDefence`/`meleeAttack`/`fieldPower`/`Pancerz`/`Przebicie` po 13; `piercing`/`chargeBonus`/`armor` po 9; `missileAttack`/`Atak dystansowy` po 3).
- Pola rekrutacyjne (`Pieniądz (koszt)`, `Utrzymanie (Pieniądz/turę)`, `Surowiec`, `Surowiec (ilość)`, `Utrzymanie surowiec`, `Utrzymanie surowiec (ilość)`, `Super-jednostka`, `Typ`) — 0 różnic. Klucze JSON identyczne (75 rekordów, te same nazwy kluczy).
- Konsekwencja: tabela rekrutacji opiera się na pinie `edb8fb56`, nie na bieżącym HEAD. Dla rekrutacji bez znaczenia; dla pól bojowych (inne tematy) trzeba wskazać pin jawnie. Nie zmieniano danych ani kopii.

---

## 6. Testy: wynik po zmianie i BLOCK (krok 3)

Po zmianach (`rust-port/engine`, pełne wyjścia w Załączniku E/D/F):

- `cargo fmt --all -- --check`: EXIT=0
- `cargo clippy --all-targets --offline -- -D warnings`: EXIT=0
- `cargo test --offline --no-fail-fast`: **323 passed, 1 failed, EXIT=101**
- Runda 2 (odtworzenie na bazie `17454b33` + pliki Operatora + komentarz w `tests/recruitment.rs`): fmt EXIT=0, clippy EXIT=0, test 323 passed / 1 failed / EXIT=101 (ten sam wynik). Pełne surowe logi: Załącznik G (fmt, clippy, test). Commit: BRAK (test czerwony, BLOCK).

Jedyny czerwony test:

```text
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... FAILED
tests/parity_suite.rs:196:5
  left: 5
 right: 10
```

Test `tests/parity_suite.rs:174–204` koduje STARE wartości: `warrior.gold_cost == 10`, `stock_cost("drewno") == Some(50)`, `resource_upkeep("drewno") == Some(10)` i `spend_recruitment(drewno 57)` → `remaining == 7`. Test jest w katalogu `parity_suite` i nazwany „vectors”, więc dispatch klasyfikuje go jako porównanie z danymi referencyjnymi. **Zgodnie z dispatchem: STOP, NIE dostosowano oczekiwań po cichu, plik `tests/parity_suite.rs` NIE został zmieniony.**

Obserwacja do decyzji (nie rozstrzygnięta przeze mnie): wartości 10/50/10 NIE pochodzą z `units.json` (JSON: 5/13/3) ani z reguł weba (web: baza 13 drewna przed mnożnikiem epoki). Wygląda na zapis starej ręcznej tabeli, nie na dane weba — wymaga decyzji właściciela/Final Control, czy vector ma zostać zaktualizowany (kolejna runda, z jawną zmianą) czy zachowany.

**BLOCK, bo:** krok 3 dispatchu wymaga zatrzymania i zgłoszenia, gdy test „vectors” czerwieni się po zmianie. Dlatego zmiany NIE zostały zcommitowane (commit byłby czerwony).

---

## 7. Bariery i kontrola zakresu

- Allowlista: zmienione `rust-port/engine/src/domain/recruitment.rs`, `rust-port/engine/tests/recruitment.rs`; dodany ten dokument. Brak zmian w `src/data/loader.ts`-odpowiednikach, `bridge.rs`, `domain/{ai_turn,playable,barbarians,combat,trade,diplomacy}.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `data/**`.
- `rust-port/engine/Cargo.lock` powstał lokalnie przy `cargo` i jest NIEŚLEDZONY — NIE dodawany do commita.
- Brak `git add -A`; brak push; brak zmian `WERSJE.md`.
- Zmiana w `src/domain/recruitment.rs` przeniosła ręczną tabelę do danych; nie zmieniano wartości JSON.

---

## 8. Wnioski dla kolejnej rundy (decyzje właściciela)

1. Parity vector `building_and_recruitment_vectors_keep_purchase_and_work_costs_separate` (10/50/10): zaktualizować do JSON (5/13/3, drewno 57→44) z jawnym wpisem, czy zachować stare wartości.
2. Mnożnik epoki i dopłata `kon` z weba: wchodzą do domeny czy zostają w warstwie UI/ekonomii?
3. Pełny audyt pozycji 2–13 z §2 (osobny temat).
4. `diplomacy.rs:1842–1905` (wartości PN): ZMIERZONO w rundzie 2, 0/64 zgodnych z `units.json`, werdykt ROZJECHANA (§2 pozycja 10). Decyzja: osobny temat na `diplomacy.rs` (poza zakresem P3-17).

**Propozycja zmiany `parity_suite` (NIE ZASTOSOWANA — czeka na decyzję właściciela/Final Control, dispatch: STOP):**

Opcja A (rekomendowana przez Operatora): zaktualizować asercje testu `building_and_recruitment_vectors_keep_purchase_and_work_costs_separate` (blok `Wojownik`, `tests/parity_suite.rs`, czerwona asercja `left: 5 / right: 10`) do wartości z `units.json`:

```diff
-    assert_eq!(warrior.gold_cost, 10);
+    assert_eq!(warrior.gold_cost, 5); // units.json Pieniądz (koszt) = 5
     assert_eq!(warrior.gold_upkeep, 1);
-    assert_eq!(warrior.stock_cost("drewno"), Some(50));
+    assert_eq!(warrior.stock_cost("drewno"), Some(13)); // units.json Surowiec (ilość) = 13
-    assert_eq!(warrior.resource_upkeep("drewno"), Some(10));
+    assert_eq!(warrior.resource_upkeep("drewno"), Some(3)); // units.json Utrzymanie surowiec (ilość) = 3
     ...
-    assert_eq!(remaining.remaining_stock.get("drewno"), Some(&7));
+    assert_eq!(remaining.remaining_stock.get("drewno"), Some(&44)); // 57 - 13
```

Uzasadnienie: test kodował stare, nie-JSON wartości (dispatch: testy kodujące stare błędne liczby mają być zaktualizowane do JSON, z jawnym wpisem). Zmiana dotyczy `tests/parity_suite.rs`, którego nie ma w allowliście i którego dispatch zakazuje zmieniać po cichu — stąd wymagana decyzja.

Opcja B: zachować `parity_suite` bez zmian. Wtedy kryterium `fmt/clippy/test EXIT=0` jest nie do spełnienia w tym temacie bez zmiany rekrutacji na stare wartości, co sprzeciwiałoby się celowi tematu (jedno źródło prawdy: JSON). Operator NIE rekomenduje.

Opcja C: zmiana decyzji o zakresie (mnożnik epoki i dopłata koni z weba do domeny). Nie zmienia czerwieni `parity_suite` (wartości web też nie są 10/50/10), więc nie rozwiązuje blokady.

Po decyzji A: Operator wykona zmianę w kolejnej rundzie (ten sam ID, 2/5), uruchomi bramki i dopisze wynik do Załącznika.

NASTĘPNY KROK: decyzja Final Control/właściciela o parity vector (pkt 1) przed kolejną rundą Operatora.

RUNDY: 1/5 (BLOCK, nie FAIL). DEPLOY/PUSH: NIE WYKONANO.

---

## Załącznik A - fmt przed zmianą (surowe, EXIT)

```text
EXIT=0
```

## Załącznik B - clippy -D warnings przed zmianą (surowe, EXIT)

```text
     Locking 17 packages to latest compatible versions
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling serde_json v1.0.154
   Compiling serde v1.0.229
    Checking once_cell v1.21.4
    Checking tracing-core v0.1.36
    Checking pin-project-lite v0.2.17
    Checking itoa v1.0.18
    Checking memchr v2.8.3
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling serde_derive v1.0.229
   Compiling tracing-attributes v0.1.31
    Checking tracing v0.1.44
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_fb9c7958-44a-1/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 42.15s
EXIT=0
```

## Załącznik C - cargo test przed zmianą (surowe, pełne, EXIT)

```text
   Compiling serde_core v1.0.229
   Compiling once_cell v1.21.4
   Compiling zmij v1.0.23
   Compiling memchr v2.8.3
   Compiling tracing-core v0.1.36
   Compiling itoa v1.0.18
   Compiling pin-project-lite v0.2.17
   Compiling tracing v0.1.44
   Compiling serde_json v1.0.154
   Compiling serde v1.0.229
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_fb9c7958-44a-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 43.69s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test wounded_units_retreat_before_attacking ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test counts_per_extension_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test sha1_matches_known_vectors ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.65s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/combat-7737db4785daf590)

running 7 tests
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_params_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test rt_ai_params ... ok
test rt_auto_battle_params ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_citizen_resource_upkeep ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_city_names_pools ... ok
test rt_civ_ai ... ok
test collection_id_sets_match_web_pin ... ok
test rt_civ_params ... ok
test rt_combat_params ... ok
test rt_buildings ... ok
test rt_counters ... ok
test rt_civs ... ok
test rt_e_start_params ... ok
test rt_econ_params ... ok
test rt_civ_matrix ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_map_gen_params ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_resources ... ok
test rt_miasto_params ... ok
test rt_society_params ... ok
test rt_power_params ... ok
test rt_diplomacy ... ok
test rt_terrain_combat ... ok
test rt_terrain_improvements ... ok
test rt_terrain_movement ... ok
test rt_terrain_yields ... ok
test rt_ui_params ... ok
test rt_wonders ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test rt_tech ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_ai_params_parses_and_spot_checks ... ok
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_missing_file_is_file_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_unreadable_file_is_io ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.40s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test annexation_requires_vassal_economy_orientation ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/events-987aa8790b10a253)

running 8 tests
test canonical_turn_phases_are_explicit_and_stable ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test built_in_events_map_to_their_responsible_phases ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test coordinates_round_trip_through_the_canonical_map_key ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok
test terrain_qualification_matches_the_world_map_rules ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test map_golden_vector_matches_typescript_core_contract ... ok
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test public_engine_wire_aliases_are_stable ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/recruitment-10fa19ca5709d7f0)

running 7 tests
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test multiple_layers_stack_additively_per_resource ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test copied_state_and_forks_reproduce_independent_streams ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test explicit_v1_constructor_uses_the_same_migration_contract ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test canonical_state_round_trips_through_serde ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test city_rejects_empty_names_and_zero_population ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test land_route_bfs_crosses_desert_field ... ok
test trade_routes_do_not_cross_tundra ... ok
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test diff_and_serialization_preserve_route_contract ... ok
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test pure_preview_does_not_mutate_input_balances ... ok
test flow_helpers_are_deterministic_and_saturating ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok
test current_and_previous_epochs_are_available ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

## Załącznik D - fmt po zmianie (surowe, EXIT)

```text
EXIT=0
```

## Załącznik D2 - clippy -D warnings po zmianie (surowe, EXIT)

```text
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_fb9c7958-44a-1/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 23.72s
EXIT=0
```

## Załącznik E - cargo test po zmianie, --no-fail-fast (surowe, pełne, EXIT=101)

```text
    Finished `test` profile [unoptimized] target(s) in 0.03s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test counts_per_extension_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_validator_rejects_wrong_size ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test sha1_matches_known_vectors ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.57s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/combat-7737db4785daf590)

running 7 tests
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test resolver_is_order_independent_and_preserves_ids ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test wonders_json_parses ... ok
test buildings_json_parses ... ok
test tech_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_ai_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test collection_counts_match_web_pin ... ok
test rt_auto_battle_params ... ok
test rt_ai_params ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_citizen_resource_upkeep ... ok
test rt_civ_ai ... ok
test rt_city_names_pools ... ok
test rt_civ_params ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_combat_params ... ok
test rt_counters ... ok
test rt_civs ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_civ_matrix ... ok
test rt_e_start_params ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_map_gen_params ... ok
test rt_buildings ... ok
test rt_diplomacy ... ok
test rt_econ_params ... ok
test rt_power_params ... ok
test rt_miasto_params ... ok
test rt_terrain_combat ... ok
test rt_resources ... ok
test rt_terrain_movement ... ok
test rt_society_params ... ok
test rt_tech ... ok
test rt_ui_params ... ok
test rt_terrain_yields ... ok
test rt_terrain_improvements ... ok
test web_pin_constants_are_internally_consistent ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_wonders ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_loader-4b1b0c97d63f2050)

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
test neg_missing_file_is_file_missing ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_unreadable_file_is_io ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.41s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test terrain_movement_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test annexation_requires_vassal_economy_orientation ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/events-987aa8790b10a253)

running 8 tests
test canonical_turn_phases_are_explicit_and_stable ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test built_in_events_map_to_their_responsible_phases ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test public_engine_wire_aliases_are_stable ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... FAILED

failures:

---- building_and_recruitment_vectors_keep_purchase_and_work_costs_separate stdout ----

thread 'building_and_recruitment_vectors_keep_purchase_and_work_costs_separate' (10209) panicked at tests/parity_suite.rs:196:5:
assertion `left == right` failed
  left: 5
 right: 10
stack backtrace:
   0: __rustc::rust_begin_unwind
   1: core::panicking::panic_fmt
   2: core::panicking::assert_failed_inner
   3: core::panicking::assert_failed::<u32, u32>
   4: parity_suite::building_and_recruitment_vectors_keep_purchase_and_work_costs_separate
   5: parity_suite::building_and_recruitment_vectors_keep_purchase_and_work_costs_separate::{closure#0}
   6: <parity_suite::building_and_recruitment_vectors_keep_purchase_and_work_costs_separate::{closure#0} as core::ops::function::FnOnce<()>>::call_once
note: Some details are omitted, run with `RUST_BACKTRACE=full` for a verbose backtrace.


failures:
    building_and_recruitment_vectors_keep_purchase_and_work_costs_separate

test result: FAILED. 10 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

error: test failed, to rerun pass `--test parity_suite`
     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test impassable_destination_is_allowed_as_the_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test multiple_layers_stack_additively_per_resource ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test canonical_state_round_trips_through_serde ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test city_rejects_empty_names_and_zero_population ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_unknown_unit_reference ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test trade_routes_do_not_cross_tundra ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test diff_and_serialization_preserve_route_contract ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_credits_income_before_paying_expenses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-1/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test scout_is_available_in_every_epoch ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test current_and_previous_epochs_are_available ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: 1 target failed:
    `--test parity_suite`
EXIT=101
```

## Załącznik F - tabela 75 jednostek stare vs JSON (literalnie)

```text
Wojownik | gold 10->5 | gup 1->1 | stock drewno=50->drewno=13 | up drewno=10->drewno=3 | sup False->False | ROZJECHANA: gold,stock,up
Procarz | gold 8->4 | gup 1->1 | stock drewno=50->drewno=25 | up drewno=10->drewno=5 | sup False->False | ROZJECHANA: gold,stock,up
Oszczepnik | gold 6->3 | gup 1->1 | stock drewno=50->drewno=13 | up drewno=10->drewno=3 | sup False->False | ROZJECHANA: gold,stock,up
Łucznik | gold 6->3 | gup 1->1 | stock drewno=50->drewno=13 | up drewno=10->drewno=3 | sup False->False | ROZJECHANA: gold,stock,up
Zwiadowca | gold 8->4 | gup 0->0 | stock -->- | up -->- | sup False->False | ROZJECHANA: gold
Włócznik | gold 16->8 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Wojownik z mieczem i tarczą | gold 16->8 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Rydwan (woły) | gold 30->15 | gup 3->3 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Konnica | gold 22->11 | gup 3->3 | stock braz=50,kon=25->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Galera | gold 18->9 | gup 3->3 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Falanga | gold 18->9 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Hieros Lochos (Święty Zastęp) | gold 0->0 | gup 0->0 | stock zelazo=75->zelazo=38 | up zelazo=15->zelazo=8 | sup True->True | ROZJECHANA: stock,up
Hastati | gold 18->9 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Triari | gold 0->0 | gup 0->0 | stock zelazo=75->zelazo=38 | up zelazo=15->zelazo=8 | sup True->True | ROZJECHANA: stock,up
Jeździec chiński | gold 28->14 | gup 3->3 | stock braz=50,kon=25->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Hu Ben Wei (Gwardia Tygrysa) | gold 0->0 | gup 0->0 | stock braz=75->braz=38 | up braz=15->braz=8 | sup True->True | ROZJECHANA: stock,up
Impi | gold 16->8 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Oszczepnik Zulu (Izijula) | gold 20->10 | gup 1->1 | stock drewno=50->drewno=13 | up drewno=10->drewno=3 | sup False->False | ROZJECHANA: gold,stock,up
uThulwana (Białe Tarcze) | gold 0->0 | gup 0->0 | stock braz=75->braz=38 | up braz=15->braz=8 | sup True->True | ROZJECHANA: stock,up
Wojownik z maczugą (Chaska) | gold 26->13 | gup 2->2 | stock drewno=50->drewno=13 | up drewno=10->drewno=3 | sup False->False | ROZJECHANA: gold,stock,up
Wojownik z toporem | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Procarz (Huaracoc) | gold 8->4 | gup 1->1 | stock drewno=50->drewno=25 | up drewno=10->drewno=5 | sup False->False | ROZJECHANA: gold,stock,up
Oszczepnik (Estólica) | gold 9->5 | gup 1->1 | stock drewno=50->drewno=13 | up drewno=10->drewno=3 | sup False->False | ROZJECHANA: gold,stock,up
Królewska Gwardia | gold 0->0 | gup 0->0 | stock braz=75->braz=38 | up braz=15->braz=8 | sup True->True | ROZJECHANA: stock,up
Rydwan konny | gold 28->14 | gup 3->3 | stock braz=50,kon=25->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Łucznik egipski | gold 14->7 | gup 1->1 | stock drewno=50->drewno=13 | up drewno=10->drewno=3 | sup False->False | ROZJECHANA: gold,stock,up
Rydwan egipski | gold 32->16 | gup 3->3 | stock braz=50,kon=25->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Wojownik z khopesh | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Medżaj (Gwardia Faraona) | gold 0->0 | gup 0->0 | stock braz=75->braz=38 | up braz=15->braz=8 | sup True->True | ROZJECHANA: stock,up
Łucznik nubijski | gold 20->10 | gup 2->2 | stock drewno=50->drewno=25 | up drewno=10->drewno=5 | sup False->False | ROZJECHANA: gold,stock,up
Łucznik sumeryjski | gold 9->5 | gup 1->1 | stock drewno=50->drewno=13 | up drewno=10->drewno=3 | sup False->False | ROZJECHANA: gold,stock,up
Rydwan sumeryjski | gold 38->19 | gup 3->3 | stock braz=50,kon=25->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Włócznik sumeryjski | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Gwardia Królewska Sumeru | gold 0->0 | gup 0->0 | stock braz=75->braz=38 | up braz=15->braz=8 | sup True->True | ROZJECHANA: stock,up
Wojownik mykeński | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Rydwan mykeński | gold 30->15 | gup 3->3 | stock braz=50,kon=25->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Wojownik Sherden | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Halabardnik Shang | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Rydwan Shang | gold 32->16 | gup 3->3 | stock braz=50,kon=25->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Łucznik akadyjski | gold 16->8 | gup 2->2 | stock drewno=50->drewno=25 | up drewno=10->drewno=5 | sup False->False | ROZJECHANA: gold,stock,up
Gaesatae | gold 14->7 | gup 1->1 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Soldurii | gold 18->9 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Rydwan celtycki | gold 28->14 | gup 3->3 | stock zelazo=50,kon=25->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Wojownik germański | gold 0->0 | gup 2->2 | stock zelazo=75->zelazo=38 | up zelazo=15->zelazo=8 | sup True->True | ROZJECHANA: stock,up
Berserker germański | gold 16->8 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Taran | gold 14->7 | gup 1->1 | stock drewno=75->drewno=19 | up drewno=15->drewno=4 | sup False->False | ROZJECHANA: gold,stock,up
Taran okuty | gold 18->9 | gup 2->2 | stock braz=75->braz=38 | up braz=15->braz=8 | sup False->False | ROZJECHANA: gold,stock,up
Katapulta | gold 18->9 | gup 2->2 | stock zelazo=75->zelazo=38 | up zelazo=15->zelazo=8 | sup False->False | ROZJECHANA: gold,stock,up
Wieża oblężnicza | gold 20->10 | gup 2->2 | stock braz=75->braz=38 | up braz=15->braz=8 | sup False->False | ROZJECHANA: gold,stock,up
Wojownik tyrreński | gold 15->8 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Wojownik szekelesz | gold 14->7 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Konnica lancowa asyryjska | gold 32->16 | gup 3->3 | stock zelazo=50,kon=25->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Konnica łucznicza asyryjska | gold 30->15 | gup 3->3 | stock zelazo=50,kon=25->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Łucznik asyryjski | gold 14->7 | gup 2->2 | stock drewno=50->drewno=25 | up drewno=10->drewno=5 | sup False->False | ROZJECHANA: gold,stock,up
Drużynnik | gold 18->9 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Jeździec z oszczepami | gold 26->13 | gup 3->3 | stock zelazo=50,kon=25->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Strażnik bram Harappy | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Piechota induska | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Garnizon Harappy | gold 18->9 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Rydwan Kapadokijski | gold 34->17 | gup 3->3 | stock braz=50,kon=25->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Piechota hetycka | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Gwardia hetycka | gold 18->9 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Gwardia Ishtar | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Wojownik babiloński | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Piechota neobabilońska | gold 18->9 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Tyrski miecznik | gold 18->9 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Wojownik fenicki | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Gwardia Tyreńska | gold 18->9 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Thorakites | gold 16->8 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Evocati | gold 0->0 | gup 0->0 | stock zelazo=75->zelazo=38 | up zelazo=15->zelazo=8 | sup True->True | ROZJECHANA: stock,up
iButho z iklwa | gold 16->8 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Gwardzista z champi | gold 18->9 | gup 2->2 | stock braz=50->braz=25 | up braz=10->braz=5 | sup False->False | ROZJECHANA: gold,stock,up
Wojownik z żelaznym khopesh | gold 18->9 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Mur tarcz (Sargonid) | gold 18->9 | gup 2->2 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
Miecznik galijski | gold 14->7 | gup 1->1 | stock zelazo=50->zelazo=25 | up zelazo=10->zelazo=5 | sup False->False | ROZJECHANA: gold,stock,up
```

---

## Załącznik G - runda 2: fmt, clippy, cargo test (surowe, pełne, EXIT z echo)

Odtworzone na 17454b33 + pliki Operatora + komentarz w tests/recruitment.rs (sekcja Konnica). Przebieg finalny (po ostatniej edycji pliku).

### G1 fmt

```text
EXIT=0
```

### G2 clippy -D warnings

```text
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_fb9c7958-44a-3/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 0.21s
EXIT=0
```

### G3 cargo test --offline --no-fail-fast

```text
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_fb9c7958-44a-3/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 0.42s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test wounded_units_retreat_before_attacking ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_validator_rejects_wrong_size ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test sha1_matches_known_vectors ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.84s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/combat-7737db4785daf590)

running 7 tests
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test resolver_is_order_independent_and_preserves_ids ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_ai_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test roundtrip_covers_all_29_data_files ... ok
test rt_ai_params ... ok
test rt_auto_battle_params ... ok
test rt_citizen_resource_upkeep ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_civ_ai ... ok
test rt_buildings ... ok
test rt_civ_params ... ok
test rt_city_names_pools ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_combat_params ... ok
test rt_counters ... ok
test rt_civs ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_e_start_params ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_map_gen_params ... ok
test rt_miasto_params ... ok
test rt_power_params ... ok
test rt_resources ... ok
test rt_civ_matrix ... ok
test rt_econ_params ... ok
test rt_diplomacy ... ok
test rt_tech ... ok
test rt_terrain_combat ... ok
test rt_terrain_movement ... ok
test rt_society_params ... ok
test rt_terrain_improvements ... ok
test rt_terrain_yields ... ok
test rt_ui_params ... ok
test web_pin_constants_are_internally_consistent ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_wonders ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_missing_file_is_file_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_unreadable_file_is_io ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.37s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test annexation_requires_vassal_economy_orientation ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test terrain_aliases_describe_the_same_source_values ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test invalid_dimensions_are_rejected_before_allocation ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test public_engine_wire_aliases_are_stable ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... FAILED

failures:

---- building_and_recruitment_vectors_keep_purchase_and_work_costs_separate stdout ----

thread 'building_and_recruitment_vectors_keep_purchase_and_work_costs_separate' (31870) panicked at tests/parity_suite.rs:196:5:
assertion `left == right` failed
  left: 5
 right: 10
stack backtrace:
   0: __rustc::rust_begin_unwind
   1: core::panicking::panic_fmt
   2: core::panicking::assert_failed_inner
   3: core::panicking::assert_failed::<u32, u32>
   4: parity_suite::building_and_recruitment_vectors_keep_purchase_and_work_costs_separate
   5: parity_suite::building_and_recruitment_vectors_keep_purchase_and_work_costs_separate::{closure#0}
   6: <parity_suite::building_and_recruitment_vectors_keep_purchase_and_work_costs_separate::{closure#0} as core::ops::function::FnOnce<()>>::call_once
note: Some details are omitted, run with `RUST_BACKTRACE=full` for a verbose backtrace.


failures:
    building_and_recruitment_vectors_keep_purchase_and_work_costs_separate

test result: FAILED. 10 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

error: test failed, to rerun pass `--test parity_suite`
     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test multiple_layers_stack_additively_per_resource ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test copied_state_and_forks_reproduce_independent_streams ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test canonical_state_round_trips_through_serde ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diff_and_serialization_preserve_route_contract ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test pure_preview_does_not_mutate_input_balances ... ok
test flow_helpers_are_deterministic_and_saturating ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-3/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test current_and_previous_epochs_are_available ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: 1 target failed:
    `--test parity_suite`
EXIT=101
```
---

## Załącznik H - diplomacy.rs 1842-1905 vs units.json (ZMIERZONO, runda 2, surowy wynik skryptu)

```text
entries in 1842-1905: 64
match with units.json Pieniądz (koszt): 0 missing names: 0
('Wojownik', '10.0', 5, 'ROZJ')
('Procarz', '8.0', 4, 'ROZJ')
('Oszczepnik', '6.0', 3, 'ROZJ')
('Łucznik', '6.0', 3, 'ROZJ')
('Zwiadowca', '8.0', 4, 'ROZJ')
('Włócznik', '16.0', 8, 'ROZJ')
('Wojownik z mieczem i tarczą', '16.0', 8, 'ROZJ')
('Rydwan (woły)', '30.0', 15, 'ROZJ')
('Konnica', '22.0', 11, 'ROZJ')
('Galera', '18.0', 9, 'ROZJ')
('Falanga', '18.0', 9, 'ROZJ')
('Hastati', '18.0', 9, 'ROZJ')
('Jeździec chiński', '28.0', 14, 'ROZJ')
('Impi', '16.0', 8, 'ROZJ')
('Oszczepnik Zulu (Izijula)', '20.0', 10, 'ROZJ')
('Wojownik z maczugą (Chaska)', '26.0', 13, 'ROZJ')
('Wojownik z toporem', '18.0', 9, 'ROZJ')
('Procarz (Huaracoc)', '8.0', 4, 'ROZJ')
('Oszczepnik (Estólica)', '9.0', 5, 'ROZJ')
('Rydwan konny', '28.0', 14, 'ROZJ')
('Łucznik egipski', '14.0', 7, 'ROZJ')
('Rydwan egipski', '32.0', 16, 'ROZJ')
('Wojownik z khopesh', '18.0', 9, 'ROZJ')
('Łucznik nubijski', '20.0', 10, 'ROZJ')
('Łucznik sumeryjski', '9.0', 5, 'ROZJ')
('Rydwan sumeryjski', '38.0', 19, 'ROZJ')
('Włócznik sumeryjski', '18.0', 9, 'ROZJ')
('Wojownik mykeński', '18.0', 9, 'ROZJ')
('Rydwan mykeński', '30.0', 15, 'ROZJ')
('Wojownik Sherden', '18.0', 9, 'ROZJ')
('Halabardnik Shang', '18.0', 9, 'ROZJ')
('Rydwan Shang', '32.0', 16, 'ROZJ')
('Łucznik akadyjski', '16.0', 8, 'ROZJ')
('Gaesatae', '14.0', 7, 'ROZJ')
('Soldurii', '18.0', 9, 'ROZJ')
('Rydwan celtycki', '28.0', 14, 'ROZJ')
('Berserker germański', '16.0', 8, 'ROZJ')
('Taran', '14.0', 7, 'ROZJ')
('Taran okuty', '18.0', 9, 'ROZJ')
('Katapulta', '18.0', 9, 'ROZJ')
('Wieża oblężnicza', '20.0', 10, 'ROZJ')
('Wojownik tyrreński', '15.0', 8, 'ROZJ')
('Wojownik szekelesz', '14.0', 7, 'ROZJ')
('Konnica lancowa asyryjska', '32.0', 16, 'ROZJ')
('Konnica łucznicza asyryjska', '30.0', 15, 'ROZJ')
('Łucznik asyryjski', '14.0', 7, 'ROZJ')
('Drużynnik', '18.0', 9, 'ROZJ')
('Jeździec z oszczepami', '26.0', 13, 'ROZJ')
('Strażnik bram Harappy', '18.0', 9, 'ROZJ')
('Piechota induska', '18.0', 9, 'ROZJ')
('Garnizon Harappy', '18.0', 9, 'ROZJ')
('Rydwan Kapadokijski', '34.0', 17, 'ROZJ')
('Piechota hetycka', '18.0', 9, 'ROZJ')
('Gwardia hetycka', '18.0', 9, 'ROZJ')
('Gwardia Ishtar', '18.0', 9, 'ROZJ')
('Wojownik babiloński', '18.0', 9, 'ROZJ')
('Piechota neobabilońska', '18.0', 9, 'ROZJ')
('Tyrski miecznik', '18.0', 9, 'ROZJ')
('Wojownik fenicki', '18.0', 9, 'ROZJ')
('Gwardia Tyreńska', '18.0', 9, 'ROZJ')
('Thorakites', '16.0', 8, 'ROZJ')
('iButho z iklwa', '16.0', 8, 'ROZJ')
('Gwardzista z champi', '18.0', 9, 'ROZJ')
('Wojownik z żelaznym khopesh', '18.0', 9, 'ROZJ')
```

## Załącznik I - units.json: pin edb8fb56 vs HEAD gra/data (ZMIERZONO, runda 2, surowy wynik skryptu)

```text
rows pin/head: 75 75
rows with any field difference: 13
per-field difference counts:
   Atak 13
   Health 13
   Przebicie 13
   Obrona 13
   health 13
   Pancerz 13
   weaponDamage 13
   meleeDefence 13
   Uderzenie 13
   fieldPower 13
   meleeAttack 13
   chargeBonus 9
   piercing 9
   armor 9
   missileAttack 3
   Atak dystansowy 3
total field differences: 176
keys only in pin: []
keys only in head: []
```

---

## Załącznik J - Final Control (runda 3): decyzja i bramki w czystym targecie (surowe, pełne)

Decyzja: opcja A z §8. Vector `parity_suite` był autorstwa Rust (nie fixture z weba) i kodował starą ręczną tabelę 10/50/10; JSON (źródło prawdy z weba) daje 5/13/3, drewno 57-13=44. To nie jest decyzja produktowa. Zmiana: `rust-port/engine/tests/parity_suite.rs`, blok Wojownik (gold 5, stock drewno 13, upkeep drewno 3, remaining 44) z komentarzem. Rozbieżności webu (mnożnik epoki, kon 25 vs "+5 Koni") pozostają poza domeną, odnotowane w §3/§8.

### J1 fmt

```
EXIT=0
```

### J2 clippy -D warnings

```
     Locking 17 packages to latest compatible versions
   Compiling proc-macro2 v1.0.107
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling serde v1.0.229
    Checking once_cell v1.21.4
   Compiling serde_json v1.0.154
    Checking tracing-core v0.1.36
    Checking memchr v2.8.3
   Compiling syn v2.0.119
   Compiling syn v3.0.9
    Checking pin-project-lite v0.2.17
    Checking itoa v1.0.18
   Compiling serde_derive v1.0.229
   Compiling tracing-attributes v0.1.31
    Checking tracing v0.1.44
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_fb9c7958-44a-4/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 31.74s
EXIT=0
```

### J3 cargo test --offline --no-fail-fast

```
   Compiling serde_core v1.0.229
   Compiling once_cell v1.21.4
   Compiling zmij v1.0.23
   Compiling memchr v2.8.3
   Compiling tracing-core v0.1.36
   Compiling pin-project-lite v0.2.17
   Compiling itoa v1.0.18
   Compiling tracing v0.1.44
   Compiling serde_json v1.0.154
   Compiling serde v1.0.229
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_fb9c7958-44a-4/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 34.61s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.49s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/combat-7737db4785daf590)

running 7 tests
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_ai_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test rt_ai_params ... ok
test rt_auto_battle_params ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_citizen_resource_upkeep ... ok
test rt_city_names_pools ... ok
test rt_civ_ai ... ok
test collection_id_sets_match_web_pin ... ok
test rt_buildings ... ok
test rt_civ_params ... ok
test rt_combat_params ... ok
test rt_counters ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_civs ... ok
test rt_e_start_params ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_econ_params ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_map_gen_params ... ok
test rt_miasto_params ... ok
test rt_civ_matrix ... ok
test rt_power_params ... ok
test rt_resources ... ok
test rt_terrain_combat ... ok
test rt_diplomacy ... ok
test rt_terrain_movement ... ok
test rt_terrain_yields ... ok
test rt_terrain_improvements ... ok
test rt_society_params ... ok
test rt_tech ... ok
test rt_ui_params ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test rt_wonders ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_missing_file_is_file_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_unreadable_file_is_io ... ok
test neg_whitespace_only_file_is_empty ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.39s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test terrain_yields_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test annexation_requires_vassal_economy_orientation ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/events-987aa8790b10a253)

running 8 tests
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test built_in_events_map_to_their_responsible_phases ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
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

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test multiple_layers_stack_additively_per_resource ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test copied_state_and_forks_reproduce_independent_streams ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test city_rejects_empty_names_and_zero_population ... ok
test canonical_state_round_trips_through_serde ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test barbarian_camps_never_spawn_on_tundra ... ok
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test land_route_bfs_crosses_desert_field ... ok
test trade_routes_do_not_cross_tundra ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diff_and_serialization_preserve_route_contract ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_credits_income_before_paying_expenses ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_fb9c7958-44a-4/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test current_and_previous_epochs_are_available ... ok
test scout_is_available_in_every_epoch ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

