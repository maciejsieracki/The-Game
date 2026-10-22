# P3-22 — FLATTEN-MULTIPLIERS, ETAP 2 (runda 2/5, Operator, poprawka po FAIL)

STATUS: PASS-WITH-NOTES (runda 2/5). Zamknięta grupa HANDEL w całości (6 wierszy: H1–H6). Zakres etapu 2 NIE jest zamknięty: grupy dyplomacja, AI, wzrost, wioski, mapa, walka/oblężenie, ruch, społeczeństwo są ETAP 3 z klasą i plik:linia (sekcja 1, każdy plik:linia sprawdzony skryptem).

TEMAT: R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1
BAZA: `86311e3b` (origin/rust-port/parity-v2). Commit rundy 1: `5c90c3b1`. Pin weba: `edb8fb56`.
DOWODY: `dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/` (skrypty `gen-trade-web.py`, `verify-trade-web.py`, `check-etap3.py`; logi bramek `gate-fmt.log`, `gate-clippy.log`, `gate-test.log`; katalog `dowody/`).

## 0. Odpowiedzi na zarzuty rundy 1

| # | Zarzut | Odpowiedź | Dowód |
|---|---|---|---|
| 1 | Brak generatora i niezależnego weryfikatora weba | PRZYJMUJĘ. Dodano `gen-trade-web.py` (generator) i `verify-trade-web.py` (weryfikator; szuka definicji po całym `gra/src`, a nie po numerze linii). Wynik: 6/6 wierszy, 0 rozbieżności. OGRANICZENIE: stałe są literałami TS, a w środowisku nie ma loadera TS, więc generator czyta literał z podanej linii i NIE uruchamia kodu weba. Wektor z uruchomionego kodu weba: NIE_ZMIERZONO. | `dowody/gen-trade-web.log`, `dowody/verify-trade-web.log` (EXIT=0, `LICZBA ROZBIEZNOSCI: 0`) |
| 2 | Brak wiersza `TRADE_ROUTE_INCOME_HALF_DIVISOR` (ceil/2) | PRZYJMUJĘ. Dodano wiersz H3 (klasa a, BEZ MECHANIKI). Rust nie ma kroku ceil(x/2) w dochodzie tras (`grep '/ 2\|div_ceil\|\.ceil('` na `domain/trade.rs`: brak trafień). Rozbieżność zachowania Rust–web w tym kroku NIE_ZMIERZONO (nie porównywano wartości dochodu); zachowania nie zmieniano. | `dowody/grep-handel-rust.txt`, JSON wiersz H3 |
| 3 | Wiersz `35o` jako kategoria zbiorcza | PRZYJMUJĘ. `35o` rozbite na konkretne pozycje 35o1–35o9 z plik:linia (sekcja 1). | `dowody/check-etap3.log` (48 × OK) |
| 4 | Brak jawnego wykluczenia `BLOCKED_COMBAT_MULTIPLIER` | PRZYJMUJĘ. Wykluczone jawnie jako NIE-LICZBA (zbiór identyfikatorów parametrów oznaczonych BLOCKED, nie współczynnik). Plik:linia zweryfikowano: `gra/src/game/civ-matrix-semantic.ts:221` (definicja), `:286`, `:370` (użycie). | pozycja NL-1 w sekcji 1 |
| 5 | Plik:linia ETAP 3 przepisane bez ponownego sprawdzenia | PRZYJMUJĘ. Każda pozycja ETAP 3 z listy w `check-etap3.py` (48 wpisów) sprawdzona na `edb8fb56`: w podanej linii musi wystąpić identyfikator. Wynik: 0 błędów. | `dowody/check-etap3.log` (`LICZBA BLEDOW ETAP3: 0`) |
| 6 | Kolejność grup (HANDEL zamiast dyplomacji) | PRZYJMUJĘ z uzasadnieniem. HANDEL zamknięto jako pierwszą grupę, bo w rundzie 1 była jedyną grupą domykalną w jednej rundzie (6 wierszy klasy a/b, jedna domena tras, bez wejść stanów do API). Dyplomacja wymaga wejść stanów (b) i tabel per trudność (wiersze 22, 35e, 35m) — jest pierwszą grupą kolejnej rundy (runda 3) i nie zostanie odłożona bez decyzji. Barbarzyńcy: w inwentarzu nie ma stałych-mnożników; `BARBARIAN_COOPERATION_*` to promienie i czasy (NIE-LICZBA mnożnikowa), wpisane jawnie w sekcji 1. | sekcja 1, sekcja 8 |
| 7 | Rozstrzygnięcia administracyjne niewykonane | PRZYJMUJĘ i WYKONUJĘ w dokumencie. `pieniadzMnoznik` = NIEUŻYWANE (sekcja 7). `utrzymanie_surowcowe_na_ture` = dane zachowane, NIEUŻYWANE w Rust, odnotowane (sekcja 7). | `dowody/grep-admin-*.txt` |
| 8 | Test sprawdza tylko `wartosc >= 1` | PRZYJMUJĘ. Test przepisany na asercje wartości (2, 2, 1, 0.05, 1) i wartości per trudność (+0.5 / 0 / −0.5). Test został dodany w rundzie 1 (przed nią nie istniał), więc jego przepisanie nie osłabia testów bazowych. Lista zmian testów: sekcja 5. | `tests/derived_values.rs` |
| 9 | Brak pełnych surowych wyjść w dokumencie | PRZYJMUJĘ. Pełne logi z `echo "EXIT=$?"` w katalogu runu (sekcja 6), nie wyciągi. | `gate-fmt.log`, `gate-clippy.log`, `gate-test.log` |
| 10 | Brak dowodu `git grep` na brak mnożników w domenie objętej etapem | PRZYJMUJĘ. Dowód w sekcji 2 i w `dowody/grep-handel-rust.txt`. | sekcja 2 |
| 11 | Wejścia stanów (b) w API odłożone na decyzję właściciela | PRZYJMUJĘ rozstrzygnięcie dispatchu, bez nowej decyzji właściciela: parametry są jawne (wybór typu w rundzie, w której pojawia się mechanika klasy b). W HANDEL nie ma mechaniki klasy b w Rust (H6 BEZ MECHANIKI), więc w tej rundzie nic nie wymaga wejścia stanu. Ustalenie dla rundy 3: w `domain/` nie ma jednego typu trudności — `enum Difficulty` jest zduplikowany w `domain/trade.rs:1852`, `domain/diplomacy.rs:429`, `domain/barbarians.rs:300`; wybór/ujednolicenie wymaga decyzji technicznej (wpis do sekcji 8). | sekcja 8, grep w sekcji 2 |

Zarzut dodatkowy (ustalenie Operatora rundy 2, nie z listy Evaluatora): H4/H5 nie były w inwentarzu rundy 1; po ich wykryciu w rundzie 2 ustalono, że `domain/trade.rs` MA mechanikę dla obu stałych (`TRADE_ROUTE_BUILDING_BONUS_RATE` i `PORT_SEA_TRADE_BONUS_PIENIADZ` jako literały). Zgodnie z dispatchem pkt (3) wiersze H4 i H5 są ROZWINIĘTE: domena czyta je z tabeli. Zachowanie bez zmian (wartości identyczne).

## 1. Status pozycji zakresu

Legenda: ROZWINIĘTE = tabela + test + odczyt w domenie; BEZ MECHANIKI = tabela NIEUŻYWANA, Rust nie ma mechaniki; ETAP 3 = nierozwinięte w tej rundzie, klasa i plik:linia podane (zweryfikowane `check-etap3.py`); NL = nie-liczba (nie współczynnik).

### 1a. Grupa HANDEL (zamknięta w tej rundzie)

| # | Pozycja | Klasa | Plik:linia (web, pin edb8fb56) definicja / użycie | Status R2 |
|---|---|---|---|---|
| H1 | TRADE_ROUTE_INTERNATIONAL_MULTIPLIER = 2 | a | `gra/src/game/trade-routes.ts:1558` / `:1575` | BEZ MECHANIKI |
| H2 | FALLBACK_TRADE_MULT = 1 | a | `gra/src/game/culture-religion.ts:1268` / `:1313` | BEZ MECHANIKI |
| H3 | TRADE_ROUTE_INCOME_HALF_DIVISOR = 2 | a | `gra/src/game/trade-routes.ts:1565` / `:1576` | BEZ MECHANIKI |
| H4 | TRADE_ROUTE_BUILDING_BONUS_RATE = 0.05 | a | `gra/src/game/trade-routes.ts:1646` / `:1670` | ROZWINIĘTE: `domain/trade.rs:1478–1481` (funkcja `trade_route_building_bonus_rate()`), użycie `:1491` |
| H5 | PORT_SEA_TRADE_BONUS_PIENIADZ = 1 | a | `gra/src/game/trade-routes.ts:1742` / `:1746` | ROZWINIĘTE: `domain/trade.rs:1556–1559` (funkcja `port_sea_trade_bonus_pieniadz()`), użycie: `SeaTradeBonusParams::default()` (`:1539`) |
| H6 | MNOZNIK_HANDEL_TRUDNOSC_DELTA = {easy: +0.5, normal: 0, hard: −0.5} | b (trudność) | `gra/src/game/economy.ts:810` / `:840` | BEZ MECHANIKI (Rust czyta pole `civilizations.rs:70` tylko w deserializacji; domena go nie czyta) |

Wiersze parametrów tras (nie mnożniki; wymienione, bo leżą w tym samym module):
- HP1 `DEFAULT_TRADE_ROUTE_PARAMS` — `gra/src/game/trade-routes.ts:173` — klasa a (dystanse), ETAP 3 (parametry tras, poza zakresem mnożników).
- HP2 `DEFAULT_TRADE_ROUTE_INCOME_PARAMS` — `gra/src/game/trade-routes.ts:1541` — klasa a (dochód), ETAP 3; w Rust odpowiednik to `DEFAULT_TRADE_ROUTE_INCOME_PARAMS` w `domain/trade.rs` (parametry ładowane z danych, `load_trade_route_income_params`), porównanie wartości NIE_ZMIERZONO.
- HP3 `DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS` — `gra/src/game/trade-routes.ts:1978` — klasa a (rezerwa), ETAP 3.

### 1b. Pozostałe pozycje ETAP 3 (klasa i plik:linia, każda sprawdzona `check-etap3.py`)

| # | Pozycja | Klasa | Plik:linia (web) | Status R2 |
|---|---|---|---|---|
| 19 | citizen-resource-upkeep (utrzymanie ludności) | a | `gra/src/game/citizen-resource-upkeep.ts`, `gra/data/citizen-resource-upkeep.json` (pliki istnieją) | ETAP 3 (ludność, nie koszt budowy) |
| 20 | throughputFallback x5 | a | `gra/src/game/converters.ts:56` | ETAP 3 (produkcja) |
| 21 | Spichlerz: odpływ x5 | a | `gra/src/game/building-resource-gate.ts:329` `SPICHLERZ_DRAIN_CERAMIKA_PER_TURN`, `:332` `SPICHLERZ_DRAIN_SOL_PER_TURN` | ETAP 3 (magazyn) |
| 22 | Dyplomacja: BUILDING_PN_FACTOR; BASKET_PN_DIFFICULTY_MULT_PLAYER_GIVE/RECEIVE (b); cennik PN | a + b | `gra/src/game/diplomacy-value-catalog.ts:35` (użycie `:222`), `:136`, `:146` | ETAP 3, RUNDA 3 (pierwsza grupa) |
| 35a | AI_MAJOR_EARLY_ECON_BUILDING_MULT = 0.70 | a | `gra/src/game/ai.ts:1265` | ETAP 3 (AI) |
| 35a2 | TERYTORIUM_MNOZNIK = 1.25 | a | `gra/src/game/ai.ts:4568` (użycie `:4647`) | ETAP 3 (AI) — nowa pozycja rundy 2 |
| 35b | CIV_MATRIX_GROWTH_DIFFICULTY_MULT (b) | b | `gra/src/game/population-growth-v85.ts:92` (użycie `:101`) | ETAP 3 (wzrost) |
| 35c | VILLAGE_GOLD_ERA_MULT / VILLAGE_TECH_ERA_MULT | a | `gra/src/game/villageRewards.ts:42`, `:48` | ETAP 3 (wioski) |
| 35d | TREATY_DURATION_MULTIPLIER_ACTIONS (flaga) | a | `gra/src/game/diplomacy-proposals.ts:595` (użycie `:617`) | ETAP 3 (dyplomacja) |
| 35e | AI_DIPLOMACY_GENEROSITY_GOLD_MULT (b) | b | `gra/src/game/diplomacy-economy.ts:164` (użycie `:171`) | ETAP 3 (dyplomacja) |
| 35f | HILL_DEFENSE_MULT / MOUNTAIN_DEFENSE_MULT | a | `gra/src/game/siege.ts:118`, `:124` | ETAP 3 (oblężenie) |
| 35g | COUNTER_MULT | a | `gra/src/game/combat.ts:20` | ETAP 3 (walka) |
| 35h | EMBARK_DEFENSE_MULT = 0.5 | a | `gra/src/game/embarkation.ts:28` | ETAP 3 (walka) |
| 35i | ROAD_MOVE_SPEED_MULT / ROAD_BRUK_MOVE_SPEED_MULT | a | `gra/src/map/road-movement.ts:14`, `:29` | ETAP 3 (ruch) |
| 35j | RESOURCE_BASELINE_RARITY_MULT; RELIEF_OVERFLOW_CAP_MULT; MOUNTAIN_RANGE_REGROW_TARGET_MULT | a | `gra/src/map/newGameMapDefaults.ts:419`; `gra/src/map/gen-helpers.ts:2181`, `:2480` | ETAP 3 (mapa) |
| 35k | RIVER_SCALE_BY_SIZE; FALLBACK_RESOURCE_MULT (b); FALLBACK_RIVER_SCALE (b) | a/b | `gra/src/map/newGameMapDefaults.ts:255`; `gra/src/data/map-gen-params-loader.ts:21`, `:24` | ETAP 3 (mapa) |
| 35l | BROD_RUCH_MULT; MORALE_HIT_LOSS_SCALE; MORALE_ARMY_COLLAPSE_MULT (+ próg MORALE_ARMY_COLLAPSE_RATIO = 0.40) | a | `gra/src/battle/battleScene.ts:918`, `:1050`, `:1071`; próg `:1070` | ETAP 3 (bitwa) |
| 35l2 | BROD_BONUS_BRZEG (+15% obrona brzegu), BROD_KARA_ATAK, BROD_KARA_OBRONA (−25%) | a | `gra/src/battle/battleScene.ts:921`, `:919`, `:920` | ETAP 3 (bitwa) — nowa pozycja rundy 2 |
| 35m | SISTER_ALLIANCE_THRESHOLD_SCALE (b) | b | `gra/src/game/diplomacy.ts:702` | ETAP 3 (dyplomacja) |
| 35n | FALLBACK_SOCIETY_SCALE | a | `gra/src/game/society-breakdown.ts:399` | ETAP 3 (społeczeństwo) |
| 35o1 | FORTIFY_OBRONA_BONUS (domyślny bonus obrony przy umocnieniu) | a | `gra/src/game/siege.ts:131` | ETAP 3 (walka) — nowa pozycja rundy 2 |
| 35o2 | VETERAN_BONUS_FRAC (indeks 0–3 = poziom weterana) | b (skończony zbiór) | `gra/src/game/veteran.ts:71` | ETAP 3 (walka) — nowa pozycja rundy 2 |
| 35o3 | Bonusy obrony miasta (`MUR` 200, `CYTADELA` 100, `BASZTA` 100, `PALISADA` 100 — wartości z danych, fallback w kodzie) | a | `gra/src/main.ts:26889`, `:26890`, `:26891`, `:26892` | ETAP 3 (walka/miasta) — nowa pozycja rundy 2 |
| 35o4 | SIEGE_AI_T1_ASSAULT_RATIO, SIEGE_AI_T2_BUILD_MIN_RATIO, SIEGE_AI_T3_STARVE_MIN_RATIO (progi, nie mnożniki) | a (próg) | `gra/src/game/siegeAi.ts:37`, `:43`, `:46` | ETAP 3 (oblężenie AI) — klasa do potwierdzenia |
| 35o5 | AI_MAJOR_ABSORB_POWER_RATIO_MIN = 10 (próg) | a (próg) | `gra/src/game/ai-major-absorb.ts:10` | ETAP 3 (AI) — klasa do potwierdzenia |
| 35o6 | BARBARIAN_COOPERATION_RADIUS / _TURNS / _DEFAULT_DURATION_TURNS (promień, czas) | NL-mnożnikowa | `gra/src/game/diplomacy-barbarian-cooperation.ts:10`, `:21`, `:25` | POZA DEFINICJĄ MNOŻNIKA (promień/czas); do decyzji w rundzie domykającej |
| 35o7 | GLOBAL_RESEARCH_COST_MULT = R_STAWKI_KOSZT_MULT (koszty badań) | a | `gra/src/game/difficulty-cost.ts:41`; `gra/src/game/r-stawki-strojenie.ts:6` | POZA ZAKRESEM (koszty, P3-19) — jawnie wykluczone z etapu 2 |
| NL-1 | BLOCKED_COMBAT_MULTIPLIER | NL | `gra/src/game/civ-matrix-semantic.ts:221` (definicja), `:286`, `:370` (użycie) | NIE-LICZBA (zbiór identyfikatorów BLOCKED) — wykluczone |
| NL-2 | PRESENTATION: `*_SCALE` w `gra/src/render/`, `gra/src/ui/`, `gra/src/wonderpreview/` (28 identyfikatorów wg `check-etap3.py`) | NIE-BALANS | — | wykluczone (P3-19 R4.4) |

Uwaga o pokryciu inwentarza: regex z P3-19 Załącznik D został uruchomiony przez `check-etap3.py` (rozszerzony o BONUS/RATIO) na `gra/src` pin `edb8fb56`: 114 identyfikatorów, 0 poza listą dokumentu poza warstwą prezentacji. Wzorzec nie łapie nazw bez słowa kluczowego (np. `BROD_KARA_*`); te dopisano ręcznie (35l2).

## 2. Wiązanie w Rust (dowód `git grep`, working tree po rundzie 2)

Polecenie: `git grep -n -E "TRADE_ROUTE_INTERNATIONAL|FALLBACK_TRADE|TRADE_ROUTE_INCOME_HALF|MNOZNIK_HANDEL|TRADE_ROUTE_BUILDING_BONUS_RATE|PORT_SEA_TRADE_BONUS|international|cityTradeMultiplier|mnoznik_handel_pieniadz|mnoznikHandel" -- rust-port/engine/src rust-port/engine/tests` (pełne wyjście: `dowody/grep-handel-rust.txt`):
- `domain/trade.rs:1478–1481` — funkcja `trade_route_building_bonus_rate()` czyta tabelę (H4); `:1491` — użycie w `trade_route_building_bonus_for_route_with_params`.
- `domain/trade.rs:1556–1559` — funkcja `port_sea_trade_bonus_pieniadz()` czyta tabelę (H5); `:1539` — `SeaTradeBonusParams::default()`.
- `data/civilizations.rs:69–70` — pole `mnoznik_handel_pieniadz` (deserializacja; brak czytnika w domenie) → H6 BEZ MECHANIKI.
- Brak trafień dla `international`, `FALLBACK_TRADE`, `cityTradeMultiplier` w `domain/`: H1, H2 BEZ MECHANIKI.
- `grep '/ 2\|div_ceil\|\.ceil('` w `domain/trade.rs`: brak trafień → H3 BEZ MECHANIKI.

Dowód braku mnożników w czasie gry w plikach domeny objętych grupą: po rundzie 2 w `domain/trade.rs` nie ma literałów `0.05` ani `1`/`2` jako stałych bonusu (usunięto `pub const TRADE_ROUTE_BUILDING_BONUS_RATE: f64 = 0.05;` i `pub const PORT_SEA_TRADE_BONUS_PIENIADZ: u64 = 1;`; wartości przychodzą z `data/derived/trade-multipliers.json`). Pozostałe liczby w `trade.rs` (np. `/ 5.0` w `total_distance_income_impl`, `sea_max_distance: 20`) to parametry dochodu, nie pozycje tej grupy — ODNOTOWANE jako ETAP 3 (HP1–HP3).

## 3. Pliki zmienione w rundzie 2

- `rust-port/engine/data/derived/trade-multipliers.json`: 6 wierszy (H1–H6). Pole `wartosc` (f64) dla klasy a; `wartosci_po_trudnosci` dla klasy b.
- `rust-port/engine/src/data/derived.rs`: `TradeMultiplierRow.wartosc: Option<f64>`, `wartosci_po_trudnosci: Option<BTreeMap<String,f64>>` (`serde(default)`), funkcja `trade_multiplier_value(id)` (OnceLock).
- `rust-port/engine/src/domain/trade.rs`: `trade_route_building_bonus_rate()` i `port_sea_trade_bonus_pieniadz()` zamiast dwóch stałych; `SeaTradeBonusParams::default()` używa funkcji.
- `rust-port/engine/tests/derived_values.rs`: test z rundy 1 przepisany (sekcja 5).
- `dyspozycje/rust-port/p3/P3-22-FLATTEN-STAGE2.md` (ten dokument).
- `dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/**` (skrypty, logi, dowody).
- Poza zakresem (nie dotknięte): `bridge.rs`, `playable.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `civilizations.rs`. `Cargo.lock` jest untracked i NIE jest commitowany.

## 4. Tabela było/jest zmian zachowania

| Element | Było | Jest | Zmiana zachowania |
|---|---|---|---|
| TRADE_ROUTE_BUILDING_BONUS_RATE (H4) | literał `0.05` w `domain/trade.rs` | odczyt z tabeli, wartość `0.05` | brak (0) |
| PORT_SEA_TRADE_BONUS_PIENIADZ (H5) | literał `1` (stała i `Default`) | odczyt z tabeli, wartość `1` | brak (0) |
| H1, H2, H3, H6 | brak w Rust | tabela, NIEUŻYWANE | brak (0) |
| Testy istniejące | zielone | zielone, bez zmian | brak |
| Liczba testów | 358 (baseline z raportu rundy 1, NIE odtworzony w rundzie 2) → 359 (runda 1) | 359 | brak zmiany liczby względem rundy 1 |

## 5. Zmiany testów (jawna lista)

- Brak zmian istniejących testów.
- `trade_multipliers_cover_each_constant_once_with_class_a` (runda 1, nowy) → przepisany na `trade_multipliers_cover_each_constant_once_with_values`. Powód: zarzut 8 (test sprawdzał tylko `wartosc >= 1`). Nowy test: 6 wierszy, unikalne ID, wektory wartości (2, 2, 1, 0.05, 1; delta easy 0.5 / normal 0 / hard −0.5), klasa a ma `wartosc` i nie ma mapy, status każdego wiersza to `BEZ MECHANIKI` lub `ROZWINIĘTE` (dokładnie 2 ROZWINIĘTE), wiązanie domeny (`trade_route_building_bonus_rate() == 0.05`, `port_sea_trade_bonus_pieniadz() == 1`).
- Liczba testów: 359, bez zmiany względem rundy 1.

## 6. Bramki (pełne surowe logi w katalogu runu)

Budowanie: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_6b09c6e4-c20-3 CARGO_PROFILE_DEV_DEBUG=0`, w `rust-port/engine`.
- `gate-fmt.log`: `cargo fmt --check` — wynik `EXIT=0` (po jednorazowym `cargo fmt`, który zmienił wyłącznie linie nowego kodu tej rundy).
- `gate-clippy.log`: `cargo clippy --offline --all-targets -- -D warnings` — `EXIT=0`.
- `gate-test.log`: `cargo test --offline --no-fail-fast` — `EXIT=0`, 359 zaliczonych (sumy `test result: ok`), 0 niezaliczonych.
- `dowody/gen-trade-web.log`: `EXIT=0`, wartości z literałów weba.
- `dowody/verify-trade-web.log`: `sprawdzono wierszy: 6 z 6`, `LICZBA ROZBIEZNOSCI: 0`, `EXIT=0`.
- `dowody/check-etap3.log`: 48 × OK, `LICZBA BLEDOW ETAP3: 0`, `EXIT=0`.

## 7. Rozstrzygnięcia administracyjne orkiestratora (wykonane)

- `pieniadzMnoznik` (wiersz 27 P3-19) = MARTWA FLAGA → oznaczona NIEUŻYWANE. Dowód web (`dowody/grep-admin-pieniadz-web.txt`): tylko definicja `playerState.ts:75`, pole `:112`, init `:153`, zapis `:451`, reset `main.ts:28633, 37086, 37434, 37711, 37930`, komentarze `:28, :39`; brak odczytu wartości do kosztu lub dochodu. Dowód Rust (`dowody/grep-admin-pieniadz-rust.txt`): brak trafień dla `PIENIADZ_MNOZNIK` / `pieniadzMnoznik` (trafienia `pieniadz_mnoznik` dotyczą niepowiązanego `targowisko_praca_na_pieniadz_mnoznik`). Nie tworzono tabeli: wartość nie ma czytnika.
- `utrzymanie_surowcowe_na_ture` (wiersz 7 P3-19) = dane ZACHOWANE w `building-stock-costs.json`, oznaczone NIEUŻYWANE w `derived.rs` i README (dowód: `dowody/grep-admin-utrzymanie-rust.txt`). Doprecyzowanie względem P3-19 §3, §9: web nie czyta pola o tej nazwie (`grep` w `edb8fb56` na `utrzymanie_surowcowe_na_ture` w `gra/`: 0 trafień, `dowody/grep-admin-utrzymanie-web.txt`). Reguła, którą pole odwzorowuje, jest w webie: `buildingResourceUpkeep` (`gra/src/game/economy-upkeep.ts:686–698`) dodaje `BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE` (= 5, `economy-upkeep.ts:679`) za każdy klucz `koszt_surowce` o wartości > 0. Zatem tabela jest pochodną tej reguły, a nie kopią pola webowego. Mechanika utrzymania budynków w Rust nie istnieje → NIEUŻYWANE w silniku.

## 8. Otwarte punkty i kolejność

- P-R2-1: Rozbieżność zachowania Rust–web w kroku ceil(x/2) dochodu tras (H3) — NIE_ZMIERZONO; wymaga porównania wartości dochodu w osobnym temacie (poza etapem 2).
- P-R2-2: Wektor z uruchomionego kodu weba (nie literał) — NIE_ZMIERZONO (brak loadera TS w środowisku).
- P-R2-3: Typ trudności w `domain/`: trzy duplikaty `enum Difficulty` (`trade.rs:1852`, `diplomacy.rs:429`, `barbarians.rs:300`), brak `DifficultyLevel` w `domain/types.rs`. Decyzja techniczna przed rundą 3 (dyplomacja, wiersz 22 i 35e/35m — wymagają wejścia trudności).
- P-R2-4: Klasy progów (35o4, 35o5) i pozycji NL (35o6) do potwierdzenia w rundzie domykającej.
- Kolejność rundy 3 (zobowiązanie): dyplomacja (22, 35d, 35e, 35m) → AI (35a, 35a2, 35o5) → walka/oblężenie (35f, 35g, 35h, 35l, 35l2, 35o1–35o4) → wzrost (35b) → mapa (35j, 35k) → społeczeństwo (35n) → wioski (35c) → ruch (35i) → produkcja/magazyn/ludność (19–21). Każda grupa pełna, nie połowiczna.
- Tabela H6 (klasa b) i HP1–HP3 nie mają jeszcze wejścia do API domeny: brak mechaniki w Rust, więc nie ma czego podpinać w tej rundzie.

## 9. Wnioski

Grupa HANDEL zamknięta: 6 wierszy (4 BEZ MECHANIKI, 2 ROZWINIĘTE). Binarne kryterium etapu 2 NIE jest spełnione (poza HANDEL 16+ grup ETAP 3). Bramki fmt/clippy/test EXIT=0, 359 testów. DEPLOY/PUSH: NIE WYKONANO.
