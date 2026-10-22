# P3-23 — FLATTEN etap 3 (mnożniki → konkretne liczby), runda 2

**TEMAT:** R-RUSTPORT-P3-23-FLATTEN-STAGE3-Q1 · **DOMAIN:** GAME · **Runda:** 2/5
**Baza:** `rust-port/parity-v2` @ `2a45e340` (zawiera P3.19 etap 1, P3.22 etap 2 r1–5).
**Commit rundy 1 (Operator):** `7e37c6ec`. **Runda 2 (odpowiedź na zarzuty Evaluatora r1):** commit tego dokumentu (SHA w raporcie orkiestratora).
**Pin weba:** `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do katalogu scratch poza repo).

## 0. Status

- **Zamknięte (ROZWINIĘTE):**
  - WALKA — macierz counter (35g, `combat.rs:207-215` → tabela), runda 1.
  - WALKA — obrona strukturalna (struktury: `web BIERZE NAJWYŻSZY`), runda 2 — reguła zmieniona z sumy na max.
- **Otwarte (ETAP 3, runda 3):** WALKA `combat.rs:456,461` (klasa c), DYPLOMACJA poza tabelą (`diplomacy.rs`), 35p (P3-18), WZROST 35b, SPOŁECZEŃSTWO 35n, WIOSKI 35c (BEZ MECHANIKI w Rust), RUCH 35i, MAPA 35j–k, PRODUKCJA 19–21, 22b (dane PN), AI 35a/35a2/35o5, dług testu `tests/derived_values.rs:777-833`.
- **Grupa WALKA NIE jest zamknięta** (zostają `combat.rs:456,461`). Sekcja 0 r1 twierdząca „zamknięto grupę WALKA w całości” była **FAŁSZYWA** i jest wycofana.
- **Kryterium binarne etapu 3 NIE jest spełnione.** Dispatch wymaga pełnych grup; runda 2 domyka WALKA (bez 456/461) i NIE domyka pozostałych grup. Zakres pozostały → runda 3.
- Status rundy: **PASS-WITH-NOTES** (zarzuty przyjęte i naprawione, zakres etapu otwarty).

## 1. Odpowiedzi na zarzuty Evaluatora r1 (7e37c6ec)

| # | Zarzut | Decyzja | Dowód / zmiana |
|---|---|---|---|
| 1 | Grupy nie są pełne; struktury nie zrobione; „nie poprzestawaj na jednej małej grupie” | PRZYJMUJĘ (częściowo wykonane w r2) | Struktury zrobione w r2 (sekcja 3). Reszta grup jawnie ETAP 3 z klasą i plik:linia (sekcja 4). Naruszenie „jednej grupy na rundę” przyjmuję — r2 dodaje drugą grupę (struktury), a pozostałe grupy idą do rundy 3, nie są udawane. |
| 2 | Fałszywe „grupa WALKA zamknięta w całości” | PRZYJMUJĘ | Sekcja 0 przepisana. WALKA zawiera otwarte `combat.rs:456,461`. |
| 3 | `gate-fmt-r1.log` 0 bajtów, brak `EXIT=` | PRZYJMUJĘ | Nowe logi z markerem: `dowody/gate-fmt-r2.log` (`EXIT=0`), `dowody/gate-clippy-r2.log` (`EXIT=0`), `dowody/gate-test-r2.log` (`EXIT=0`). Logi r1 zostają jako historia (r1 fmt nieważny). |
| 4a | 35i ruch: `pathfinding.rs:250-251` to mnożnik w domenie; sekcja 4 pokazuje „—” | PRZYJMUJĘ | Wiersz poprawiony: `domain/pathfinding.rs:250-251` (`road_divisor: 3`, `paved_road_divisor: 5`), użycie `pathfinding.rs:294-295`. Web `gra/src/map/road-movement.ts:14` (`ROAD_MOVE_SPEED_MULT = 3`), `:29` (`ROAD_BRUK_MOVE_SPEED_MULT = 5`). Klasa a, ETAP 3. Wywołanie z pętli gry: NIE_ZMIERZONO (wywołania w `domain/ai_turn.rs`, `events.rs`, `terrain.rs`; poza `bridge.rs`/`playable.rs`). |
| 4b | 35b wzrost: `city_growth.rs:44-85,219,468` nie zapisany | PRZYJMUJĘ | Wiersz poprawiony: `domain/city_growth.rs:45` (pole `growth_threshold_multiplier`), `:67,:85` (domyślnie `1.0`), `:219` (użycie w `growth_threshold`), `:461-469` (`advance_city_growth_with_multiplier`). Wywołań tej funkcji w `src/` **brak** (`git grep` → tylko definicja i re-eksport w `lib.rs:15,18`); test `tests/city_growth.rs:120` ustawia `2.0`. Mnożnik „w czasie gry” w domenie = API bez wywołania z gry → ETAP 3, klasa b, web `gra/src/game/population-growth-v85.ts:92,:101`. |
| 4c | 35c wioski: `playable.rs:172` `NOT_IMPLEMENTED` → BEZ MECHANIKI, nie ETAP 3 | PRZYJMUJĘ | Status **BEZ MECHANIKI (Rust)**. `git grep -niE "village|wioska" -- rust-port/engine/src` → trafienia tylko w `ai_turn.rs` (pole `village` tile'a do wyboru celu zwiadu/zakładania miasta, NIE nagroda za wioskę) oraz `playable.rs:117,156,172` (flaga `villageRewardsEnabled`, `NOT_IMPLEMENTED`). Brak mnożnika nagrody za wioskę w domenie. Web `gra/src/game/villageRewards.ts:42,:48` (VILLAGE_GOLD_ERA_MULT / VILLAGE_TECH_ERA_MULT) — ETAP 3 tylko jako „do decyzji, czy wdrażać mechanikę”. |
| 5 | Grep literałów tylko w `combat.rs`; trzeba objąć pathfinding, city_growth, resztę | PRZYJMUJĘ częściowo | Sprawdzone w r2: `combat.rs` (`git grep -nE "1\.(50\|25\|15)\b"` → 0 trafień), `pathfinding.rs` (`road_divisor`/`paved_road_divisor`, wiersz 35i), `city_growth.rs` (wiersz 35b). Pełny inwentarz `domain/**` NIE został wykonany w r2 — pozostałe pliki domeny (`diplomacy.rs`, `map_generator.rs`, `society`, `production`, `ai_turn.rs`) wchodzą do rundy 3 z własnym `git grep`. Wynik częściowy oznaczony NIE_ZMIERZONO tam, gdzie nie przeszukano. |
| 6 | Relabel `combat.rs:470,475` (w rzeczywistości 456,461) na ETAP 4 bez próby webowej | PRZYJMUJĘ | Przywrócone: **ETAP 3, klasa c** (ciągła funkcja straty `(0.25 - 0.15*advantage).clamp(0.10,0.25)`, zgodnie z konwencją P3-22: klasa c = funkcja ciągła w zmiennej). Próba webowa r2: `git grep`/`grep` po `gra/src` za wzorcem `0.15`/`0.25`+advantage/loss → **brak odpowiednika** w webie (trafienia tylko w UI/animacji/kulturze). Status: web counterpart NIE ZNALEZIONY (nie to samo co „ETAP 4”). Decyzja dla rundy 3: czy to mechanika webu (wtedy wektor) czy wyłącznie Rust (wtedy BEZ MECHANIKI w webie — do decyzji właściciela). |
| 7 | Barbarzyńcy to promienie/tury, nie mnożniki | PRZYJMUJĘ | Przeklasyfikowane: **NIE MNOŻNIK — usunięte z zakresu etapu 3**. Web `gra/src/game/diplomacy-barbarian-cooperation.ts:10` (`BARBARIAN_COOPERATION_RADIUS = 2`), `:21` (`BARBARIAN_COOPERATION_TURNS = 3`), `:25` (`..._DURATION_CHOICES = [5,10,15]`) — czas i promień, nie mnożnik. Ten sam wniosek jest w P3-22 sekcja 1 (wiersz „Barbarzyńcy … NIE-LICZBA mnożnikowa”). |
| 8 | 22b cennik PN oznaczone ETAP 3 bez uzasadnienia | PRZYJMUJĘ | Przeklasyfikowane na **BEZ MECHANIKI (dane, nie mnożnik)**, zgodnie z dispatchem. Web `gra/data/diplomacy.json:158` (`pn_zloto`, `skala: 1`, „1 PN = 1 ¤”) to opis skali, nie mnożnik gry. Rust: parser danych `src/data/civilizations.rs:659-677` (`pn_zloto`, `pn_praca`, `pn_zywnosc`); brak mnożnika w domenie. |
| 9 | Zakres linii struktur `combat.rs:244-252` (funkcja to 244-266) | PRZYJMUJĘ | Funkcja `structure_defense_multiplier` = `combat.rs:230-…` (po zmianie r2 zakres się zmienia; patrz sekcja 3). Stare `244-252` było tylko blokiem sumy. |
| 10 | Dług `tests/derived_values.rs` bez wiersza statusu | PRZYJMUJĘ | Dodany wiersz: **ETAP 3 (runda 3), dług testu**. `rust-port/engine/tests/derived_values.rs:777-833` (`diplomacy_multipliers_cover_each_constant_once_with_web_values`, asercje `BUILDING_PN_FACTOR`, `TREATY_DURATION_*`) pinuje wartości DYPLOMACJI. NIE ruszany w r2 (nie jest częścią WALKA). |
| 11 | Kryterium „tabela było/jest” i „lista zmian testów” spełnione tylko dla jednej macierzy | PRZYJMUJĘ | Zgodne. Tabele było/jest są w sekcji 2 (counter) i 3 (struktury). Lista zmian testów: sekcja 4. Kryterium etapu nadal NIE spełnione. |

Pozytywne sprawdzenia Evaluatora (linie webu) potwierdzam bez zmian: `main.ts:26917`, `population-growth-v85.ts:92,101`, `villageRewards.ts:42,48`, `road-movement.ts:14,29`, `society-breakdown.ts:399`, `diplomacy.ts:676,1281`, `converters.ts:56`, `building-resource-gate.ts:329,332`, `ai.ts:1265`, `ai-major-absorb.ts:10`, `map-gen-params-loader.ts:21,24`, `newGameMapDefaults.ts:255,419`.

## 2. Macierz counter (35g) — ROZWINIĘTE (runda 1, bez zmian w r2)

| Wiersz | Klasa | Web (pin edb8fb56) | Rust przed (`2a45e340`) | Rust po | Status |
|---|---|---|---|---|---|
| 35g macierz typów | a | `gra/src/game/combat.ts:527-549` (`counterMultiplier`), `gra/data/counters.json` (17 wierszy) | `rust-port/engine/src/domain/combat.rs` `match` z literałami `1.50/1.25/1.15` | `rust-port/engine/data/derived/counter-multipliers.json` (8×8 = 64 pary); odczyt `counter_multiplier_value` w `src/data/derived.rs`; `combat.rs:201-203` | ROZWINIĘTE (czytane przez domenę, NIE w pętli gry — zob. ZAŁOŻENIE 1) |

Tabela było/jest (pary niezerowe, 15 z 64; pozostałe 49 = `1.0` w obu):

| Para (atakujący → cel) | Było | Jest | Web (uruchomiony kod) | Zgodność |
|---|---|---|---|---|
| spearman → mount | 1.50 | 1.5 | 1.5 | tak |
| mount → distance | 1.50 | 1.5 | 1.5 | tak |
| mount → slinger | 1.50 | 1.5 | 1.5 | tak |
| slinger → spearman | 1.50 | 1.5 | 1.5 | tak |
| swordsman → mount | 1.50 | 1.5 | 1.5 | tak |
| falangite → mount | 1.50 | 1.5 | 1.5 | tak |
| mount → offensive | 1.25 | 1.25 | 1.25 | tak |
| offensive → swordsman | 1.25 | 1.25 | 1.25 | tak |
| swordsman → spearman | 1.15 | 1.15 | 1.15 | tak |
| spearman → spearman | 1.15 | 1.15 | 1.15 | tak |
| mount → spearman | 1.15 | 1.15 | 1.15 | tak |
| distance → spearman | 1.15 | 1.15 | 1.15 | tak |
| naval → spearman | 1.15 | 1.15 | 1.15 | tak |
| offensive → distance | 1.15 | 1.15 | 1.15 | tak |
| offensive → slinger | 1.15 | 1.15 | 1.15 | tak |

Rozbieżności: **0**. Dowód: generator `gen-counter-web.mjs` (uruchomiony kod weba) + `verify-counter-web.py` → `dowody/verify-counter-r1.log` (`ROZBIEZNOSCI: 0`).

## 3. Obrona strukturalna (WALKA — struktury) — ROZWINIĘTE w r2

**Zmiana reguły:** Rust SUMOWAŁ bonusy (`1 + wall + fort + outpost`), web BIERZE NAJWYŻSZY (wg Q1=A: web 1:1).

| Wiersz | Klasa | Web (pin edb8fb56) | Rust przed | Rust po (r2) | Status |
|---|---|---|---|---|---|
| obrona strukturalna | a (reguła) | `gra/src/main.ts:26953-26979` (`structureDefenseBonusFor`): miasto z murami → `cityWallDefenseBonusPercent` (`gra/src/game/city-defense.ts:55-75`) zwraca się ALBO (`if (wallBonus > 0) return wallBonus;`), inaczej ulepszenie terenu `fort` → `return 100`, `posterunek` → `return 50`, inaczej `return 0`. Jeden wynik, bez sumowania. | `combat.rs:230-252` `structure_defense_multiplier`: `1.0 + (wall? MUR) + (fort? FORT_TERENOWY) + (outpost? POSTERUNEK)` | `combat.rs:230-…`: `1.0 + max(wall? MUR, fort? FORT_TERENOWY, outpost? POSTERUNEK)`; wartości procentów nadal z `combat-ai-multipliers.json` | ROZWINIĘTE (reguła + test relacyjny) |

Tabela było/jest (wartości z `combat-ai-multipliers.json`: MUR 200, fort terenowy 100, posterunek 50):

| Zestaw struktur (siege) | Było (suma) | Jest (max) | Web odpowiednik |
|---|---|---|---|
| brak | 1.0 | 1.0 | 0 |
| tylko wall | 3.0 | 3.0 | 200 → 3.0 |
| tylko fort | 2.0 | 2.0 | 100 → 2.0 |
| tylko outpost | 1.5 | 1.5 | 50 → 1.5 |
| wall + fort + outpost | 4.5 | 3.0 | jeden wynik, najwyższy = 200 → 3.0 |
| fort + outpost | 2.5 | 2.0 | jeden wynik, najwyższy = 100 → 2.0 |

**Zmiany testów (jawnie):**
- `tests/combat.rs::effective_strength_applies_counters_terrain_and_siege_structures` — oczekiwana siła obrońcy **6_750 → 4_500** (`10*100*1.5(Hills)*1.0(counter) = 1500`; mnożnik struktur 4.5 → 3.0). Uzasadnienie: zmiana reguły na web (max). Test NIE został osłabiony — nadal pinuje pełny wynik `effective_strength` z trzema strukturami naraz; zmienił się tylko oczekiwany wynik zgodnie z regułą.
- NOWY `tests/structure_defense_max.rs` (3 testy, RELACJE, bez pinów wartości): brak struktur = 1.0; poza oblężeniem = 1.0; wall+fort+outpost == wall; fort+outpost == fort; wall > fort > outpost > 1.0.
- Brak innych zmian istniejących testów.

**Weryfikacja:** web `structureDefenseBonusFor` NIE jest ładowalna w node (`main.ts`, zależności DOM/gra) — generator w tej rundzie NIE został dodany. Dowód = odczyt kodu `main.ts:26953-26979` (wiersze cytowane powyżej) i test relacyjny Rust. Rozbieżność między tym odczytem a Rust: 0 (po zmianie). Wektor numeryczny webu dla struktur: **NIE_ZMIERZONO** (do rundy 3, jeśli owner zażąda).

**Efekt w grze:** `combat.rs` jest martwy w rozgrywce (ZAŁOŻENIE 1), więc zmiana NIE zmienia zachowania gry.

## 4. Testy i gate

| Bramka | Wynik | Plik |
|---|---|---|
| `cargo fmt -- --check` (r2) | EXIT=0 | `dowody/gate-fmt-r2.log` |
| `cargo clippy --offline --all-targets -- -D warnings` (r2) | EXIT=0 | `dowody/gate-clippy-r2.log` |
| `cargo test --offline` (r2) | EXIT=0, **381 passed, 0 failed** (42 bloki wyników) | `dowody/gate-test-r2.log` |
| baza przed zmianą (`2a45e340`) | EXIT=0, 373 passed | `dowody/base-test.log` |
| r1 (historia) | fmt log 0 bajtów (nieważny), clippy/test EXIT=0 | `dowody/gate-*-r1.log` |

381 = 373 (baza) + 5 (`counter_multipliers.rs`, r1) + 3 (`structure_defense_max.rs`, r2). Zmiany: `tests/combat.rs` (1 asercja, patrz sekcja 3).

Grep literałów w domenie WALKI: `git grep -nE "1\.(50|25|15)\b" -- rust-port/engine/src/domain/combat.rs` → **0 trafień**. Struktury: `git grep -nE "\} \+ if structures"` → 0 trafień (suma usunięta).

Build: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_e461f64a-457-3 CARGO_PROFILE_DEV_DEBUG=0`, `cargo --offline`. Katalog targetu zostanie usunięty po zakończeniu rundy. `Cargo.lock` NIE jest commitowany (untracked).

## 5. Stan grup etapu 3 (ETAP 3 = runda 3, z klasą i plik:linia)

| Grupa / pozycja | Klasa | Plik:linia (web) | Domena Rust (plik:linia) | Status |
|---|---|---|---|---|
| WALKA `combat.rs:456,461` (straty auto-resolve) | c | brak odpowiednika w webie (NIE ZNALEZIONO: grep `gra/src` po `0.15`/`0.25`+advantage) | `combat.rs:456,461` (`loss_fractions`, `(0.25 - 0.15*advantage).clamp(0.10,0.25)`) | ETAP 3 (runda 3) — decyzja: mechanika webu czy tylko Rust |
| DYPLOMACJA poza inwentarzem | a | `gra/src/game/diplomacy.ts:676`, `:1281` | `diplomacy.rs:410,412,415,975,1108,1110,1120` | ETAP 3 (runda 3) |
| Dług testu DYPLOMACJI | — | — | `tests/derived_values.rs:777-833` (pinuje wartości) | ETAP 3 (runda 3), NIE ruszany |
| 35p archetypy | b | — | `diplomacy.rs:1027-1158` | ETAP 3 → P3-18 |
| 35b WZROST | b | `gra/src/game/population-growth-v85.ts:92,:101` | `city_growth.rs:45,67,85,219,461-469` (API bez wywołania z gry) | ETAP 3 (runda 3) |
| 35n SPOŁECZEŃSTWO | a | `gra/src/game/society-breakdown.ts:399` | NIE_ZMIERZONO (nie przeszukano w r2) | ETAP 3 (runda 3) |
| 35c WIOSKI | a | `gra/src/game/villageRewards.ts:42,:48` | BRAK mnożnika w domenie (`playable.rs:172` NOT_IMPLEMENTED) | BEZ MECHANIKI (Rust); do decyzji, czy wdrażać |
| 35i RUCH | a | `gra/src/map/road-movement.ts:14,:29` | `pathfinding.rs:250-251` (dane), `:294-295` (użycie) | ETAP 3 (runda 3); wywołanie z gry NIE_ZMIERZONO |
| 35j–k MAPA | a/b | `gra/src/map/newGameMapDefaults.ts:255,:419`; `gra/src/map/gen-helpers.ts:2181,:2480`; `gra/src/data/map-gen-params-loader.ts:21,:24` | NIE_ZMIERZONO (`map_generator.rs` ma stałe generacji — do klasyfikacji w r3) | ETAP 3 (runda 3) |
| 19–21 PRODUKCJA/magazyn/ludność | a | `gra/src/game/citizen-resource-upkeep.ts`; `gra/src/game/converters.ts:56`; `gra/src/game/building-resource-gate.ts:329,:332` | NIE_ZMIERZONO | ETAP 3 (runda 3) |
| 22b cennik PN | dane | `gra/data/diplomacy.json:158` (`pn_zloto`, skala 1) | dane: `src/data/civilizations.rs:659-677`; brak mnożnika w domenie | BEZ MECHANIKI (dane, nie mnożnik) |
| AI 35a/35a2/35o5 | a / próg | `gra/src/game/ai.ts:1265`, `:4568`; `gra/src/game/ai-major-absorb.ts:10` | NIE_ZMIERZONO (`ai_turn.rs` — do r3) | ETAP 3 (runda 3); `ai.ts` nie ładuje się w node |
| Barbarzyńcy | — | `gra/src/game/diplomacy-barbarian-cooperation.ts:10,:21,:25` (promień/tury, NIE mnożnik) | — | NIE MNOŻNIK — poza zakresem mnożników |

## 6. ZAŁOŻENIA (bez pytania, do decyzji właściciela)

1. **ZAŁOŻENIE:** `combat.rs` jest martwy w rozgrywce (P3-22 sekcja 12.0 #1). Tabele counter i reguła struktur są ROZWINIĘTE w sensie „czytane przez domenę i testowane”, NIE „używane w grze”. Nie podpinano walki do pętli gry (dispatch). **Do decyzji właściciela:** czy podpinać walkę do pętli gry (osobny temat).
2. **ZAŁOŻENIE:** counter jako 64 pary (pełny stan skończony, Q3=A), nie 15 wierszy, żeby tabela była edytowalna także dla par dziś neutralnych.
3. **ZAŁOŻENIE:** reguła struktur = max (web 1:1, Q1=A). Zmiana wpływa tylko na `combat.rs`, który nie jest w grze.

## 7. Allowlista rundy 2

- `rust-port/engine/src/domain/combat.rs` (reguła max w `structure_defense_multiplier`; komentarz).
- `rust-port/engine/tests/combat.rs` (jedna asercja 6_750 → 4_500 z uzasadnieniem).
- `rust-port/engine/tests/structure_defense_max.rs` (nowy, 3 testy relacyjne).
- `dyspozycje/rust-port/p3/P3-23-FLATTEN-STAGE3.md` (ten dokument).
- `dyspozycje/autobot/runs/R-RUSTPORT-P3-23-FLATTEN-STAGE3-Q1/dowody/gate-{fmt,clippy,test}-r2.log`.

Allowlista r1 (bez zmian): `data/derived/counter-multipliers.json`, `src/data/derived.rs` (blok counter), `src/domain/combat.rs` (counter), `tests/counter_multipliers.rs`, generator i weryfikator counter, logi r1.

Zero zmian w `bridge.rs`, `playable.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`. Push: NIE WYKONANO.

---

## 8. Runda 3/5 (Operator r3, TEMAT R-RUSTPORT-P3-23-FLATTEN-STAGE3-Q1)

**Baza:** `rust-port/parity-v2` @ `e810d0d3` + cherry-pick `7e37c6ec` (r1, tabela counter) i `278ff735` (r2, struktury max). Wynik cherry-picka: `f5987be8` (counter), `3f3c48d8` (struktury). Pin weba: `edb8fb56`.

**Zakres wykonany w r3: TYLKO inwentarz i klasyfikacja (bez nowych tabel).** Grupy WZROST 35b, RUCH 35i, SPOŁECZEŃSTWO 35n, PRODUKCJA 19–21, MAPA 35j–k, AI 35a NIE zostały zaimplementowane w tej rundzie (brak tabel, parserów, generatorów i weryfikatorów). Uczciwy stan: etap 3 NIE jest zamknięty; kryterium binarne NIE spełnione.

### 8.1 Statusy pozycji etapu 3 (stan na koniec r3)

| Pozycja | Klasa | Web (pin edb8fb56) | Rust (plik:linia) | Status r3 | Uzasadnienie |
|---|---|---|---|---|---|
| 35g counter | a | `gra/src/game/combat.ts:527-549`, `gra/data/counters.json` | `data/derived/counter-multipliers.json`, `src/domain/combat.rs:188-203` | ROZWINIĘTE (r1) | tabela 8×8, 0 rozbieżności |
| Struktury (reguła max) | a | `gra/src/main.ts:26953-26979`, `gra/src/game/city-defense.ts:55-75` | `src/domain/combat.rs:230-…` | ROZWINIĘTE (r2) | `combat.rs` nieużywany w grze (ZAŁOŻENIE 1) |
| WALKA `combat.rs:456,461` | c | brak odpowiednika (grep `gra/src` `0.15`/`0.25`+advantage: 0 trafień) | `combat.rs:456,461` | ETAP 3 (otwarte) | decyzja właściciela: mechanika tylko w Rust → BEZ MECHANIKI w webie |
| WZROST 35b | b | `gra/src/game/population-growth-v85.ts:92,:101` | `src/domain/city_growth.rs:45,67,85,219,223-235,461-469` | ETAP 3 (otwarte); w grze NIEUŻYWANE | `git grep` poza `domain/city_growth.rs` i testami: 0 wywołań `advance_city_growth*`/`growth_threshold_with_multiplier` w `src/`, `bridge.rs`, `playable.rs` |
| RUCH 35i | a | `gra/src/map/road-movement.ts:14` (`ROAD_MOVE_SPEED_MULT = 3`), `:29` (`ROAD_BRUK_MOVE_SPEED_MULT = 5`) | `src/domain/pathfinding.rs:237-238,250-251` (literały 3/5), `:292-298` | ETAP 3 (otwarte); w grze NIEUŻYWANE | `git grep` `find_path|movement_cost|path_cost|reachable` w `src/`/`tests/`: tylko `domain/pathfinding.rs` i testy; `ai_turn.rs:1394` używa `terrain.rs:91` (inna funkcja, bez divisorów) |
| WIOSKI 35c | a | `gra/src/game/villageRewards.ts:42,:48` | brak mnożnika w domenie; `playable.rs:172` NOT_IMPLEMENTED | BEZ MECHANIKI (Rust) | — |
| 22b cennik PN | dane | `gra/data/diplomacy.json:158` | `src/data/civilizations.rs:659-677` | BEZ MECHANIKI (dane) | — |
| DYPLOMACJA (`diplomacy.rs`) | a | `gra/src/game/diplomacy.ts:676,:1281` | `diplomacy.rs:222-224,327-329` (literały `1.0` trust/respect/gift), `:2008-2055` (basket PN, już przez `diplomacy_multiplier_by_key`), `:3077-3111` (czas traktatu, już przez `diplomacy_multiplier_value`) | CZĘŚCIOWO ROZWINIĘTE w etapie 1; literały `diplomacy.rs` poza tabelą: NIE_ZMIERZONO w r3 | do r4 |
| Dług testu `tests/derived_values.rs:777-833` | — | — | pinuje wartości DYPLOMACJI | ETAP 3 (otwarte), NIE ruszany | — |
| 35p archetypy | b | — | `diplomacy.rs:1027-1158` | → P3-18 | — |
| SPOŁECZEŃSTWO 35n | a | `gra/src/game/society-breakdown.ts:399` | NIE_ZMIERZONO | ETAP 3 (otwarte) | do r4 |
| PRODUKCJA 19–21 | a | `gra/src/game/converters.ts:56`, `gra/src/game/building-resource-gate.ts:329,:332` | `src/domain/resource_production.rs`, `improvements.rs`, `turn_economy.rs` — NIE_ZMIERZONO (nie zaklasyfikowano) | ETAP 3 (otwarte) | do r4 |
| MAPA 35j–k | a/b | `gra/src/map/newGameMapDefaults.ts:255,:419`; `gra/src/data/map-gen-params-loader.ts:21,:24` | `src/domain/map_generator.rs` (200 trafień wzorca ogólnego) — NIE_ZMIERZONO | ETAP 3 (otwarte) | do r4 |
| AI 35a / 35a2 / 35o5 | a / próg | `gra/src/game/ai.ts:1265,:4568`; `gra/src/game/ai-major-absorb.ts:10` | `src/domain/ai_turn.rs` (89 trafień ogólnych) — NIE_ZMIERZONO | ETAP 3 (otwarte) | do r4 |
| Barbarzyńcy | — | `gra/src/game/diplomacy-barbarian-cooperation.ts:10,:21,:25` (promień/tury) | `src/domain/barbarians.rs` | NIE MNOŻNIK — poza zakresem | — |

### 8.2 Wynik `git grep` (r3)

- Wzorzec `\*|/|round|MULT` w `rust-port/engine/src/domain` daje znacznie więcej niż 74 trafień (sumarycznie ok. 1 000+ linii, głównie komentarze, geometria hex i indeksy). Pełna klasyfikacja KAŻDEGO trafienia NIE została wykonana w r3 — to dług, nie zakończony krok.
- Węższy grep nazw mnożnikowych (`MULT|multiplier|_mult|divisor`, bez komentarzy): **91 linii**. Klasyfikacja: `city_growth.rs` (wzrost, 35b), `combat.rs` (counter/terrain/struktury — już tabele, poza `combat.rs:456,461`), `diplomacy.rs` (trust/respect/gift literały `1.0` + basket/treaty), `pathfinding.rs` (RUCH, literały 3/5), `trade.rs:1481,1559` (`trade_multiplier_value`, już tabela — ROZWINIĘTE w etapie 1/2), `rng.rs:5` (`LCG_MULTIPLIER` — stała PRNG, klasa: NIE mnożnik gry, nie-mnożnik).
- Komenda: `git grep -nE 'MULT|multiplier|_mult|divisor' -- rust-port/engine/src/domain | grep -vE '^\S+:\s*//'`.

### 8.3 Tabela było/jest (r3)

Brak zmian wartości w r3. Tabela counter (r1) i struktury (r2) bez zmian, zob. sekcje 2–3.

### 8.4 Zmiany testów (r3)

Brak zmian w `rust-port/engine/tests/*.rs` w tej rundzie. Dług `tests/derived_values.rs:777-833` NIE naprawiony (ETAP 3).

### 8.5 Bramki (r3, PEŁNE surowe logi)

| Bramka | Wynik | Plik |
|---|---|---|
| `cargo fmt -- --check` | EXIT=0 | `dowody/gate-fmt-r3.log` (7 B, sam marker) |
| `cargo clippy --offline --all-targets -- -D warnings` | EXIT=0 | `dowody/gate-clippy-r3.log` |
| `cargo test --offline` | EXIT=0, **381 passed, 0 failed** | `dowody/gate-test-r3.log` |

Build: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_059cda80-fd8-1`; katalog targetu usunięty po bramkach. `Cargo.lock` nie commitowany.

### 8.6 Do decyzji właściciela (ZAŁOŻENIA, bez pytania)

1. ZAŁOŻENIE: moduły `combat.rs`, `city_growth.rs`, `pathfinding.rs` NIE są podpięte do pętli gry (potwierdzone grepem 8.1). Tabele w tych obszarach są „testowane”, nie „używane w grze”. Podpięcie to osobny temat.
2. ZAŁOŻENIE: WALKA `combat.rs:456,461` (klasa c) bez odpowiednika w webie — do decyzji: wdrożyć mechanikę w webie (wtedy wektor) czy zostawić jako BEZ MECHANIKI (Rust-only).
3. ZAŁOŻENIE: grupy r4 w kolejności: SPOŁECZEŃSTWO 35n → PRODUKCJA 19–21 → MAPA 35j–k → AI 35a → DYPLOMACJA literały → dług testu `derived_values.rs`.

### 8.7 Allowlista r3

- `dyspozycje/rust-port/p3/P3-23-FLATTEN-STAGE3.md` (sekcja 8).
- `dyspozycje/autobot/runs/R-RUSTPORT-P3-23-FLATTEN-STAGE3-Q1/dowody/gate-{fmt,clippy,test}-r3.log`.

Zero zmian w kodzie w r3. Zero zmian w `bridge.rs`, `playable.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`. Push: NIE WYKONANO.

**STATUS r3:** PASS-WITH-NOTES (bramki zielone; zakres etapu 3 NIE zamknięty — inwentarz + klasyfikacja, bez implementacji nowych grup).

---

## 9. Runda 4/5 (Operator r4, TEMAT R-RUSTPORT-P3-23-FLATTEN-STAGE3-Q1)

**Baza:** `e9bfe1eb` (Operator r3; zawiera `f5987be8` counter i `3f3c48d8` struktury). Odtworzono z commita r3, bez cherry-picka.
**Worktree:** `/home/user/The-Game/.claude/worktrees/wf_059cda80-fd8-3`. Katalog targetu: `/home/user/cargo-target-shared/wf_059cda80-fd8-3` (poprzednio w sekcji 8.5 wpisano `…-fd8-1` — to był błąd przepisania; właściwy katalog to `-fd8-3`). Katalog usunięty po bramkach.

**Samoocena statusu: FAIL.** Zakres rundy 4 wg dispatchu (pełne grupy) NIE został wykonany. Wykonano jedną pełną grupę (RUCH 35i). Kryterium binarne etapu NIE jest spełnione. Kolejne grupy → runda 5 (lista w 9.1).

### 9.0 Odpowiedzi na zarzuty Evaluatora r3

| # | Zarzut | Decyzja | Dowód / zmiana |
|---|---|---|---|
| 1 | Zakres r3 niewykonany (WZROST, RUCH, SPOŁECZEŃSTWO, PRODUKCJA, MAPA, AI) | PRZYJMUJĘ (częściowo naprawione) | r4 domyka RUCH 35i (tabela + parser + wiązanie domeny + generator web + weryfikator + test kształtu, sekcja 9.3). WZROST, SPOŁECZEŃSTWO, PRODUKCJA, MAPA, AI nadal otwarte → ETAP 3 na r5 (9.1). |
| 2 | PASS-WITH-NOTES niezgodny z kryterium binarnym | PRZYJMUJĘ | Status r4 = FAIL (samoocena, nagłówek 9). |
| 3 | Statusy `NIE_ZMIERZONO` poza dozwolonym zbiorem | PRZYJMUJĘ | Usunięte. Wszystkie pozycje w 9.1 mają status ROZWINIĘTA / BEZ MECHANIKI / KLASA C / ETAP 3 z plik:linia. Brak `NIE_ZMIERZONO` w tabeli 9.1. |
| 4 | Brak dowodu `git grep` i klasyfikacji trafień; „74” nie odtwarza się | PRZYJMUJĘ częściowo | Odtworzone liczby (9.2): wzorzec `\*|/|round|MULT` w `rust-port/engine/src/domain` = **1283 trafień w 28 plikach** (nie 74; wzorzec ogólny zawiera komentarze, indeksy i geometrię). Wąski wzorzec `MULT|multiplier|_mult|divisor` = **112 trafień w 8 plikach** (wcześniej podane 91 — błąd liczenia r3). Trafienia wąskiego wzorca są sklasyfikowane per plik:linia w 9.2. Wzorca ogólnego (1283) NIE klasyfikowano pojedynczo — pliki bez trafień wąskich mają status ETAP 3 (r5), a nie „—”. |
| 5 | Dług testu `tests/derived_values.rs:777-833` nienaprawiony | PRZYJMUJĘ — NAPRAWIONE | Piny wartości w `diplomacy_multipliers_cover_each_constant_once_with_web_values` zastąpione testem kształtu i relacji (odczyt po id/kluczu = wartość wiersza; wartości skończone; mapy niepuste). Lista zmian testów: 9.4. Ujawniony dług pozostały: `basket_and_treaty_duration_read_diplomacy_table` (`derived_values.rs`, od ~linii 911) nadal pinuje wyniki domeny (`basket_side_difficulty_multiplier`, `treaty_duration_pn_multiplier`) — ETAP 3 (r5). |
| 6 | Niespójne statusy `combat.rs:456,461` | PRZYJMUJĘ | Ujednolicone: **KLASA C** (9.1). Uzasadnienie: ciągła funkcja straty `(0.25 - 0.15*advantage).clamp(0.10, 0.25)` (klasa c wg konwencji P3-22). Web: brak odpowiednika — `git grep`-równoważny odczyt `gra/src/game/combat*.ts` po `0.15|0.25`: trafienia tylko `combat.ts:201` (`combatNormField(progRaw, 0.25)` — próg dezercji, nie strata) i `combat.ts:349` (komentarz). Decyzja właściciela: mechanika tylko w Rust → BEZ MECHANIKI w webie, albo wdrożyć w webie. Dodatkowo odkryto nieklasyfikowany literał w tej samej grupie: `combat.rs:453` `Winner::Draw => (0.50, 0.50)` → KLASA C (ten sam mechanizm straty). |
| 7 | Katalog targetu `…-fd8-1` vs worktree `…-fd8-2` | PRZYJMUJĘ | Worktree tego agenta to `wf_059cda80-fd8-3`. Właściwy katalog targetu: `/home/user/cargo-target-shared/wf_059cda80-fd8-3`. Sekcja 8.5 zawiera błędną nazwę; nie poprawiam jej retroaktywnie w tekście r3, opisuję tu. |
| 8 | Potwierdzenie WZROST (`city_growth.rs`) i RUCH (`pathfinding.rs`) bez wywołań z gry; wioski i PN | PRZYJMUJĘ (potwierdzenie bez zmian) | Ponownie: `git grep` wywołań `advance_city_growth*`, `find_path`, `movement_cost` w `src/` poza domeną — 0 trafień poza definicjami i testami (sekcja 8.1). |

### 9.1 Statusy pozycji etapu 3 (stan na koniec r4)

| Pozycja | Klasa | Web (pin edb8fb56) | Rust (plik:linia) | Status r4 |
|---|---|---|---|---|
| 35g counter | a | `gra/src/game/combat.ts:527-549`, `gra/data/counters.json` | `data/derived/counter-multipliers.json`, `src/domain/combat.rs:188-203` | ROZWINIĘTE (r1) |
| Struktury (max) | a | `gra/src/main.ts:26953-26979`, `gra/src/game/city-defense.ts:55-75` | `src/domain/combat.rs:230-…` | ROZWINIĘTE (r2) |
| WALKA straty auto-resolve `combat.rs:456,461` i remis `:453` | c | brak odpowiednika w webie (9.0 #6) | `src/domain/combat.rs:453,456,461` | KLASA C (decyzja właściciela: mechanika webu czy Rust-only) |
| RUCH 35i — dzielniki drogi ÷3, bruku ÷5 | a | `gra/src/map/road-movement.ts:14` (`ROAD_MOVE_SPEED_MULT = 3`), `:29` (`ROAD_BRUK_MOVE_SPEED_MULT = 5`), `:81`, `:78` | tabela `data/derived/road-movement-multipliers.json`; `src/domain/pathfinding.rs:250-251` (czyta tabelę przez `data::derived::road_movement_divisor`), użycie `:292-298` | ROZWINIĘTE (r4): tabela + parser + wiązanie + generator + weryfikator 0 rozbieżności (9.3). Wywołanie `movement_cost` z gry: BRAK (ZAŁOŻENIE 1). |
| RUCH 35i — podłoga bruku 1/5 | a | `gra/src/map/road-movement.ts:57`, `:78` | `data/derived/road-movement-multipliers.json` (`ROAD_BRUK_MIN_MOVE_COST`); w Rust brak podłogi | ROZWINIĘTE (równoważność dla kosztów całkowitych ≥ 1, dowód `dowody/road-web-vs-rust.txt` blok C). Koszty ułamkowe (np. 0,5) nie istnieją w domenie Rust. |
| RUCH — `ROAD_MIN_MOVE_COST` 1/3 | a | `gra/src/map/road-movement.ts:32` — stała NIECZYTANA w `gra/src` (9.3, A2) | wiersz tabeli | BEZ MECHANIKI (martwa stała webu) |
| WZROST 35b — `growth_threshold_multiplier`, stałe bazowe wzrostu | b | `gra/src/game/population-growth-v85.ts:92,:101` (`civMatrixGrowthDifficultyMultiplier` 0.5/1/1.5 wobec składnika macierzy cywilizacji) | `src/domain/city_growth.rs:21-29` (stałe), `:45,:67,:85,:219,:230-235`, `:461-469` (API bez wywołania z gry) | ETAP 3 (r5). Odwzorowanie: web mnoży składnik macierzy cywilizacji, Rust ma ogólny mnożnik tempa — różne wielkości, decyzja mapowania w r5. |
| WIOSKI 35c | a | `gra/src/game/villageRewards.ts:42,:48` | brak mnożnika w domenie; `src/domain/playable.rs:172` NOT_IMPLEMENTED | BEZ MECHANIKI (Rust) |
| 22b cennik PN | dane | `gra/data/diplomacy.json:158` | `src/data/civilizations.rs:659-677` | BEZ MECHANIKI (dane) |
| DYPLOMACJA — literały `diplomacy.rs` | a | `gra/src/game/diplomacy.ts:676,:1281` | `src/domain/diplomacy.rs:222-224,327-329` (`1.0` trust/respect/gift) | ETAP 3 (r5) |
| DYPLOMACJA — dług testu `tests/derived_values.rs:777-833` | — | — | piny wartości usunięte | ROZWINIĘTE (r4, 9.4). Pozostały dług: `basket_and_treaty_duration_read_diplomacy_table` (ETAP 3, r5). |
| SPOŁECZEŃSTWO 35n | a | `gra/src/game/society-breakdown.ts:399` | brak modułu domeny społeczeństwa (9.2, wąski/szeroki grep); `src/data/economy_society.rs` = dane | ETAP 3 (r5) |
| PRODUKCJA 19–21 | a | `gra/src/game/converters.ts:56`, `gra/src/game/building-resource-gate.ts:329,:332` | brak `production.rs`/`economy.rs` w `src/domain/`; kandydat `src/domain/resource_production.rs` (26 trafień szerokich, 0 wąskich) | ETAP 3 (r5) |
| MAPA 35j–k | a/b | `gra/src/map/newGameMapDefaults.ts:255,:419`; `gra/src/data/map-gen-params-loader.ts:21,:24` | `src/domain/map_generator.rs` (200 trafień szerokich, 0 wąskich; literały kształtu terenu `:16-17`, `:250-253`, `:497-500`, … nieklasyfikowane) | ETAP 3 (r5) |
| AI 35a / 35a2 / 35o5 | a / próg | `gra/src/game/ai.ts:1265,:4568`; `gra/src/game/ai-major-absorb.ts:10` | `src/domain/ai_turn.rs` (89 trafień szerokich, 0 wąskich) | ETAP 3 (r5) |
| Barbarzyńcy | — | `gra/src/game/diplomacy-barbarian-cooperation.ts:10,:21,:25` (promień/tury) | `src/domain/barbarians.rs` | NIE MNOŻNIK (poza zakresem) |
| 35p archetypy | b | — | `src/domain/diplomacy.rs:1027-1158` | → P3-18 |

Grupy do r5 (kolejność wagi, każda PEŁNA): WZROST 35b → SPOŁECZEŃSTWO 35n → PRODUKCJA 19–21 → MAPA 35j–k → AI 35a → DYPLOMACJA literały + `basket_and_treaty_duration…`.

### 9.2 `git grep`-owy inwentarz mnożników w `rust-port/engine/src/domain` (r4)

Polecenia (Grep, równoważne `rg -c`): (a) `MULT|multiplier|_mult|divisor` → 112 w 8 plikach; (b) `\*|/|round|MULT` → 1283 w 28 plikach.

| Plik | (a) wąski | (b) szeroki | Klasa / status |
|---|---|---|---|
| `diplomacy.rs` | 46 | 146 | ROZWINIĘTE (tabela, 22/35d/35e/35m, 1/2 linii) + literały `:222-224,:327-329` ETAP 3 (r5) + pozostałe trafienia szerokie ETAP 3 (r5) |
| `combat.rs` | 31 | 57 | ROZWINIĘTE: `:188-203` (counter), `:230-…` (struktury), `:240` konwersja procent→ułamek `/100.0` (nie-mnożnik). KLASA C: `:453,:456,:461`. Nie-mnożnik: `:493` (walidacja argumentu `>= 0.0`). Pozostałe trafienia szerokie: ETAP 3 (r5) |
| `city_growth.rs` | 17 | 114 | ETAP 3 (r5) — WZROST 35b (9.1). Stałe `:21-29` ETAP 3 (r5). Trafienia `:244-292,:362-384` (wzrost ułamkowy, `/100.0` procent) — klasyfikacja r5 |
| `pathfinding.rs` | 9 | 48 | ROZWINIĘTE (RUCH, `:237-251` pola/domyślne przez tabelę, `:292-298` użycie). Pozostałe: `:5` komentarz |
| `trade.rs` | 4 | 88 | ROZWINIĘTE: `:1481`, `:1559` (tabela HANDEL). ETAP 3 (r5): `:1465,:1470` (`base * (1 + bonus)` — bonus z parametru domknięcia, wiązanie do tabeli do sprawdzenia), `:1426` (`/ 5.0` — do klasyfikacji). Pozostałe: zaokrąglenia/filtry (nie-mnożnik) |
| `building_costs.rs` | 1 | 50 | nie-mnożnik (`:210` komentarz); reszta szeroka ETAP 3 (r5) |
| `recruitment.rs` | 2 | 38 | nie-mnożnik (`:215,:220` komentarze „no multiplier at runtime”); reszta szeroka ETAP 3 (r5) |
| `rng.rs` | 2 | 24 | nie-mnożnik: `:5` `LCG_MULTIPLIER` (stała PRNG); `:7` `UNIT_SCALE` (skala losowania) |
| `map_generator.rs` | 0 | 200 | ETAP 3 (r5) — MAPA |
| `ai_turn.rs` | 0 | 89 | ETAP 3 (r5) — AI |
| `resource_production.rs` | 0 | 26 | ETAP 3 (r5) — PRODUKCJA |
| `barbarians.rs` | 0 | 45 | NIE MNOŻNIK (9.1); `:288` `retreat_health_fraction: 0.30` — próg, nie mnożnik gry (nie-mnożnik, do zapisania w r5) |
| `improvements.rs` | 0 | 28 | ETAP 3 (r5) — trafienia szerokie nieklasyfikowane |
| `turn_economy.rs` | 0 | 52 | ETAP 3 (r5) — trafienia szerokie nieklasyfikowane |
| `events.rs` | 0 | 95 | ETAP 3 (r5) — trafienia szerokie nieklasyfikowane |
| pozostałe (`replay.rs` 38, `save_load.rs` 46, `playable.rs` 25, `terrain.rs` 21, `hex.rs` 8, `ids.rs` 16, `session.rs` 2, `state.rs` 5, `player.rs` 1, `unit_epoch.rs` 10, `types.rs` 9, `mod.rs` 1, `error.rs` 1) | 0 | 258 | ETAP 3 (r5) — trafienia szerokie nieklasyfikowane (geometria/indeksy/serializacja w większości, do potwierdzenia) |

Brak trafień wąskich w `map_generator.rs`, `ai_turn.rs`, `resource_production.rs` oznacza brak nazwanych mnożników (`MULT`, `multiplier`, `_mult`, `divisor`); literały zmiennoprzecinkowe w tych plikach nadal wymagają klasyfikacji (r5).

### 9.3 RUCH 35i — tabela, wiązanie, dowód

- Tabela: `rust-port/engine/data/derived/road-movement-multipliers.json` (4 wiersze: `ROAD_MOVE_SPEED_MULT`=3, `ROAD_BRUK_MOVE_SPEED_MULT`=5, `ROAD_BRUK_MIN_MOVE_COST`=0.2, `ROAD_MIN_MOVE_COST`=1/3).
- Parser: `rust-port/engine/src/data/derived.rs` (`parse_road_movement_multipliers`, `road_movement_value`, `road_movement_divisor` — dzielnik musi być całkowity ≥ 1).
- Wiązanie domeny: `rust-port/engine/src/domain/pathfinding.rs` `MovementRules::default()` — `road_divisor`/`paved_road_divisor` z tabeli (dawne literały 3/5 usunięte).
- Generator (uruchamia kod TS weba): `gen-road-web.mjs` + `gen-loader-register.mjs` + `gen-loader-hooks.mjs` (w runie) przez `node --experimental-transform-types --import …/gen-loader-register.mjs …/gen-road-web.mjs <KORZEN> <wyjście>`; `KORZEN` = `git archive edb8fb56 gra/src gra/data`. Wynik: `dowody/road-web.json` (12 wektorów: brak/droga/bruk × koszt {0.5,1,2,3}).
- Weryfikator niezależny: `verify-road-web.py` (nie używa kodu weba ani generatora; liczy z tekstu `road-movement.ts`). Wynik: `dowody/road-web-vs-rust.txt` → **ROZBIEŻNOŚCI: 0** (A: stałe regex = tabela; A2: stałe z uruchomionego kodu = regex; B: wektory webu = oczekiwane z tabeli; C: model całkowitoliczbowy Rust `koszt*15 / dzielnik` = wektory webu dla kosztów całkowitych ≥ 1).
- Uwaga o zakresie dowodu: blok C weryfikatora to MODEL formuły Rust w Pythonie, nie uruchomienie kodu Rust. Uruchomienie kodu Rust pokrywa test `tests/road_movement_multipliers.rs` (wiązanie `MovementRules::default()` = tabela) oraz pełny `cargo test` (384 passed).
- Test kształtu BEZ pinów wartości: `rust-port/engine/tests/road_movement_multipliers.rs` (3 testy: zestaw 4 ID raz każdy, klasa a, statusy; dzielniki całkowite i wiązanie domeny; podłoga dodatnia i < 1).
- Brak wywołania `movement_cost` z gry (ZAŁOŻENIE 1): tabela jest ROZWINIĘTA w sensie „czytana przez domenę i testowana”, nie „używana w grze”.

### 9.4 Lista zmian testów (r4)

- `rust-port/engine/tests/derived_values.rs`, `diplomacy_multipliers_cover_each_constant_once_with_web_values`: usunięto asercje wartości (≈ 25 bloków `assert_eq!` z liczbami) (`diplomacy_multiplier_value(...) == X`, `diplomacy_multiplier_by_key(...) == X`). Zastąpiono pętlą kształtu: każda wartość klasy a skończona i równa odczytowi po id; każda mapa klasy b niepusta, wartości skończone, równe odczytowi po kluczu. Asercje liczności (15 wierszy, 15 unikalnych ID), zbioru ID, klas i statusów ZACHOWANE. Asercja zbioru NL (`TREATY_DURATION_MULTIPLIER_ACTIONS`) ZACHOWANA (zbiór enumerowany z webu, nie wartość edytowalna).
- NOWY `rust-port/engine/tests/road_movement_multipliers.rs` (3 testy, bez pinów wartości).
- Brak innych zmian testów. Test `tests/combat.rs` i `tests/structure_defense_max.rs` bez zmian.

### 9.5 Bramki (r4, PEŁNE surowe logi)

| Bramka | Wynik | Plik |
|---|---|---|
| `cargo fmt -- --check` | EXIT=0 (po `cargo fmt` na trzech zmienionych plikach i nowym teście) | `dowody/gate-fmt-r4.log` |
| `cargo clippy --offline --all-targets -- -D warnings` | EXIT=0 | `dowody/gate-clippy-r4.log` |
| `cargo test --offline` | EXIT=0, **384 passed, 0 failed** (381 z r3 + 3 nowe) | `dowody/gate-test-r4.log` |
| weryfikator RUCH | ROZBIEŻNOŚCI: 0, EXIT=0 | `dowody/road-web-vs-rust.txt` |

`Cargo.lock` powstał przy buildzie i NIE jest commitowany. Katalog targetu usunięty po bramkach.

### 9.6 Do decyzji właściciela (ZAŁOŻENIA, bez pytania)

1. ZAŁOŻENIE 1 (bez zmian): moduły `combat.rs`, `city_growth.rs`, `pathfinding.rs` NIE są podpięte do pętli gry. Tabele są „testowane”, nie „używane w grze”.
2. ZAŁOŻENIE 2: WALKA straty `combat.rs:453,456,461` (klasa c) bez odpowiednika w webie — wdrożyć mechanikę w webie (wtedy wektor) czy zostawić BEZ MECHANIKI w webie (Rust-only).
3. ZAŁOŻENIE 3: RUCH — podłoga bruku nieobecna w Rust; równoważna dla całkowitych kosztów ≥ 1 (dowód w 9.3). Koszty ułamkowe nie są modelowane w domenie.
4. ZAŁOŻENIE 4: `ROAD_MIN_MOVE_COST` (1/3) — stała martwa w webie; w tabeli jako BEZ MECHANIKI.

### 9.7 Allowlista r4

- `rust-port/engine/data/derived/road-movement-multipliers.json` (nowy)
- `rust-port/engine/src/data/derived.rs` (dopisek: parser RUCH)
- `rust-port/engine/src/domain/pathfinding.rs` (wiązanie dzielników z tabeli)
- `rust-port/engine/tests/derived_values.rs` (dług DYPLOMACJI, 9.4)
- `rust-port/engine/tests/road_movement_multipliers.rs` (nowy)
- `dyspozycje/rust-port/p3/P3-23-FLATTEN-STAGE3.md` (ten dokument, sekcja 9)
- `dyspozycje/autobot/runs/R-RUSTPORT-P3-23-FLATTEN-STAGE3-Q1/**`: `gen-road-web.mjs`, `gen-loader-register.mjs`, `gen-loader-hooks.mjs`, `verify-road-web.py`, `dowody/gate-{fmt,clippy,test}-r4.log`, `dowody/road-web-vs-rust.txt`, `dowody/road-web.json` (`dowody/` jest w `.gitignore` — pliki dodane jawnie `git add -f`).

Zero zmian w `bridge.rs`, `playable.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`. Push: NIE WYKONANO. Deploy: NIE WYKONANO.

**STATUS r4:** FAIL (samoocena: zakres pełnych grup nie wykonany — wykonano RUCH 35i; pozostałe grupy → runda 5; bramki zielone 384/384).
**RUNDY:** 4/5. **NASTĘPNY KROK:** runda 5 — WZROST 35b → SPOŁECZEŃSTWO 35n → PRODUKCJA 19–21 → MAPA 35j–k → AI 35a → DYPLOMACJA literały + dług `basket_and_treaty_duration…`; ETAP 4 tylko z klasą i plik:linia dla tego, czego nie zmieści.
