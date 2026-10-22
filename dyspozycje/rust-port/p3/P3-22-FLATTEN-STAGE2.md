# P3-22 — FLATTEN-MULTIPLIERS, ETAP 2 (runda 3/5, Operator, obrona po FAIL Evaluatora r3)

STATUS (runda 3/5): zamknięte w tej rundzie: grupa DYPLOMACJA (wiersze 22, 35d, 35e, 35m — 11 wierszy tabeli, sekcja 10) oraz unifikacja `enum Difficulty` (sekcja 10.5). Zakres etapu 2 NIE jest zamknięty: AI (35a), barbarzyńcy, walka/oblężenie, wzrost, mapa, społeczeństwo, wioski, ruch, produkcja (19–21) są ETAP 3 (sekcja 1b/10.6) i wchodzą do rundy 4. Binarne kryterium etapu 2 NIE jest spełnione (patrz sekcja 10.7).

Poprzedni status rundy 2: PASS-WITH-NOTES. Zamknięta grupa HANDEL w całości (6 wierszy: H1–H6). Zakres etapu 2 NIE jest zamknięty: grupy dyplomacja, AI, wzrost, wioski, mapa, walka/oblężenie, ruch, społeczeństwo są ETAP 3 z klasą i plik:linia (sekcja 1, każdy plik:linia sprawdzony skryptem).

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

## 10. RUNDA 3 (Operator, obrona po FAIL Evaluatora r3)

Baza: `origin/rust-port/parity-v2` = `708755ea` (worktree przed pracą: czysty, detached; wcześniejszy HEAD sesji `cfc26c17` nie był bazą i został porzucony). Pin weba: `edb8fb56`.

### 10.1 Odpowiedzi na zarzuty Evaluatora r3

| # | Zarzut (skrót) | Odpowiedź | Dowód |
|---|---|---|---|
| 1 | Zakres r3 niewykonany (DYPLOMACJA, AI, barbarzyńcy, walka) | PRZYJMUJĘ częściowo. DYPLOMACJA wykonana w całości (tabela, parser, podpięcie w domenie, test, wektory, generator i weryfikator). AI, barbarzyńcy i walka NIE są wykonane w tej rundzie; przechodzą do rundy 4 jako ETAP 3 z klasą i plik:linia (sekcja 1b, potwierdzone `check-etap3-r3.log`). | sekcja 10.2, 10.6 |
| 2 | Brak statusu pozycji per grupa | PRZYJMUJĘ dla DYPLOMACJI (sekcja 10.2, status per wiersz). Pozostałe grupy: status ETAP 3 z plik:linia w sekcji 1b. | `dowody/check-etap3-r3.log` (OK, 0 błędów) |
| 3 | Brak wpisu rundy 3 | PRZYJMUJĘ. Ten wpis (sekcja 10). | sekcja 10 |
| 4 | Brak generatora i weryfikatora dla grupy poza HANDEL | PRZYJMUJĘ dla DYPLOMACJI: `gen-diplomacy-web.mjs` URUCHAMIA kod TS weba (node `--experimental-transform-types` + loader `gen-loader-*.mjs`, nie literały); `verify-diplomacy-web.py` niezależnie porównuje tabelę z wartościami z uruchomienia i z literałami regex. Sanity: zmieniona wartość (8→9) daje 7 rozbieżności, exit 1. | `dowody/gen-diplomacy-web.log`, `dowody/verify-diplomacy-web.log` (0 rozbieżności) |
| 5 | `enum Difficulty` nie zunifikowany | PRZYJMUJĘ i WYKONUJĘ: jeden typ w `domain/types.rs:497`, re-eksport z `domain::{diplomacy,barbarians,trade}`. | sekcja 10.5; `git grep "enum Difficulty"` = 1 trafienie |
| 6 | Rozstrzygnięcia administracyjne niewykonane (`pieniadzMnoznik`, `utrzymanie_surowcowe_na_ture`) | ODRZUCAM z dowodem: wykonano w rundzie 2 (sekcja 7 tego dokumentu; `dowody/grep-admin-*.txt`). W rundzie 3 nie zmieniano. Zarzut dotyczy stanu rundy 2 sprzed zapisu sekcji 7. | sekcja 7; `dowody/grep-admin-pieniadz-web.txt`, `dowody/grep-admin-utrzymanie-web.txt` |
| 7 | Uzasadnienie BLOKADY błędne (dispatch nie przewiduje rundy 4) | PRZYJMUJĘ. Dispatch dopuszcza zamknięcie części zakresu w rundzie i resztę jako ETAP 3 z klasą i plik:linia; to zrobiono (sekcja 10.6). | sekcja 10.6 |
| 8 | Brak dowodu technicznego (gate-fmt/clippy/test, check-etap3) | PRZYJMUJĘ. Pełne logi z `EXIT=` w katalogu runu (sekcja 10.4). | `gate-fmt.log`, `gate-clippy.log`, `gate-test.log`, `dowody/check-etap3-r3.log` |
| 9 | Brak tabeli było/jest i listy zmian testów | PRZYJMUJĘ. Sekcje 10.3 i 10.4. | sekcja 10.3, 10.4 |
| 10 | Brak `git grep` na mnożniki w domenie objętej etapem | PRZYJMUJĘ, WYNIK NEGATYWNY: `domain/diplomacy.rs:1022–1063` (`archetype_aggression`, `archetype_trade`) zawiera literały współczynników spoza inwentarza P3-19. Kryterium „brak mnożników w plikach domeny objętych etapem” NIE jest spełnione dla `diplomacy.rs`. Pozycja dopisana do ETAP 3 (10.6, pozycja 35p). | `dowody/grep-dyplo-rust.txt` |
| 11 | Brak `cargo` w r3 (brak pomiaru) | ODRZUCAM: build wykonany (fmt/clippy/test z `EXIT=` w logach; `cargo test` 362 zaliczone, 0 niezaliczonych). Zarzut 11 r3 dotyczy innego stanu (worktree bez zmian), ta runda ma zmiany. | `gate-test.log` |
| 12 | Brak dowodu czystości worktree i SHA | PRZYJMUJĘ. Wynik `git status --short` (przed pracą: pusty) i `git rev-parse HEAD` = `708755ea` (sekcja 10 wyżej). Worktree innego Operatora (`wf_4a60bbaf-350-1`) nie był dostępny z tej izolacji; ta runda pracuje w `wf_4a60bbaf-350-3`. | sekcja 10 |

### 10.2 Status pozycji grupy DYPLOMACJA (zamknięta w tej rundzie)

Tabela edytowalna: `rust-port/engine/data/derived/diplomacy-multipliers.json` (11 wierszy). Parser i akcesory: `src/data/derived.rs` (`diplomacy_multiplier_value`, `diplomacy_multiplier_by_key`). Wartości zaobserwowane z URUCHOMIONEGO kodu weba: `dowody/diplomacy-web-values.json`.

| # | Pozycja (web) | Klasa | Definicja / użycie web | Status R3 |
|---|---|---|---|---|
| D1 | BUILDING_PN_FACTOR = 1.1 | a | `gra/src/game/diplomacy-value-catalog.ts:35` / `:217–224`; dane `gra/data/diplomacy.json:192` | BEZ MECHANIKI (domena nie liczy PN budynku; `civilizations.rs:674` tylko deserializacja) |
| D2 | BASKET_PN_DIFFICULTY_MULT_PLAYER_GIVE (easy 1.5 / normal 1.0 / hard 0.5) | b | `diplomacy-value-catalog.ts:136` / `:175–185` | ROZWINIĘTE: `domain/diplomacy.rs` `basket_side_difficulty_multiplier()` czyta tabelę |
| D3 | BASKET_PN_DIFFICULTY_MULT_PLAYER_RECEIVE (easy 0.5 / normal 1.0 / hard 1.5) | b | `diplomacy-value-catalog.ts:146` / `:175–185` | ROZWINIĘTE (jak D2) |
| D4 | TREATY_DURATION_MULTIPLIER_ACTIONS = {nap, trybut_zadanie, trybut_oferta} | NL (zbiór akcji) | `diplomacy-proposals.ts:595` / `:617` | NL. ROZBIEŻNOŚĆ: Rust `treaty_duration_pn_multiplier()` liczy też `Peace` (web: `pokoj` = x1 dla każdego czasu, sonda `treaty_probe`). ZACHOWANIE NIE ZMIENIONE — decyzja właściciela (czy Peace ma mieć mnożnik). |
| D5 | TREATY_DURATION_UNLIMITED_MULT = 8 | a | `diplomacy-proposals.ts:621` | ROZWINIĘTE: `domain/diplomacy.rs` `treaty_duration_pn_multiplier()` |
| D6 | TREATY_DURATION_MIN_TURNS = 10 | a | `diplomacy-proposals.ts:622` | ROZWINIĘTE (jak D5) |
| D7 | TREATY_DURATION_MAX_TURNS = 20 | a | `diplomacy-proposals.ts:622` | ROZWINIĘTE (jak D5) |
| D8 | TREATY_DURATION_TURNS_PER_DOUBLING = 5 | a | `diplomacy-proposals.ts:623` | ROZWINIĘTE (jak D5) |
| D9 | TREATY_DURATION_GEOMETRIC_BASE = 2 | a | `diplomacy-proposals.ts:623` | ROZWINIĘTE (jak D5) |
| D10 | AI_DIPLOMACY_GENEROSITY_GOLD_MULT (easy 1.0 / normal 0.5 / hard 0.3) | b | `diplomacy-economy.ts:164` / `:179` | BEZ MECHANIKI (`grep -i generos rust-port/engine/src`: brak mechaniki hojności AI) |
| D11 | SISTER_ALLIANCE_THRESHOLD_SCALE (low 0.6 / normal 0.3 / strong 0.15) | b | `diplomacy.ts:702` / `:729` | BEZ MECHANIKI (brak sojuszu między siostrami w Rust). Klucze jak w webie (low/normal/strong), NIE easy/normal/hard. |

Pozycja 22 „cennik PN”: wartości cennika są w danych `gra/data/diplomacy.json:158` (`pn_zloto`, `pn_praca`, `pn_zywnosc`), a nie stałą kodu; wiązanie z danymi jest z P3-17 i NIE jest mnożnikiem tej grupy → ETAP 3 (sekcja 10.6, pozycja 22b), NIE_ZMIERZONO w tej rundzie.

Założenie (ZAŁOŻENIE rundy 3): stan (b) trudności w API domeny = typ `domain::Difficulty` (jawny parametr, `ProposalPnOptions.difficulty`), zgodnie z P-R4-1 dispatchu. Stan „low/normal/strong” (D11) nie ma wejścia w Rust, bo mechanika jest BEZ MECHANIKI.

### 10.3 Tabela było/jest zmian zachowania (runda 3)

| Element | Było | Jest | Zmiana zachowania |
|---|---|---|---|
| `enum Difficulty` (3 duplikaty) | `trade.rs:1852` bez serde; `diplomacy.rs:429` serde lowercase, Default=normal; `barbarians.rs:300` serde domyślny (`Easy`) | jeden typ `domain/types.rs:497` (serde lowercase), re-eksport z trzech modułów | Brak w JSON: typ `barbarians::Difficulty` nie występuje w żadnej strukturze serializowanej (grep: tylko parametry funkcji). Zmiana tylko nazw serializacji tego typu, której nikt nie używa (0 zmian w danych). |
| Koszyk PN x trudność (D2, D3) | literały `match` 1.5/1.0/0.5 i 0.5/1.0/1.5 | odczyt z `diplomacy-multipliers.json` | 0 (wartości identyczne; test `basket_and_treaty_duration_read_diplomacy_table`) |
| Mnożnik czasu traktatu NAP/trybut (D5–D9) | literały 8.0, 10.0, 20.0, 5.0, 2.0 | odczyt z tabeli | 0 (wektory: 0→8, 5→1, 10→1, 12→2^0,4, 15→2, 20→4, 25→4; test) |
| Mnożnik czasu traktatu Peace | liczony (Rust) | liczony (Rust) — bez zmiany | 0; rozbieżność z webem POZOSTAJE (D4), test pinuje stan obecny z komentarzem |
| AI hojność (D10), sojusz siostrzany (D11) | brak w Rust | tabela NIEUŻYWANA | 0 |
| BUILDING_PN_FACTOR (D1) | brak w Rust | tabela NIEUŻYWANA | 0 |

### 10.4 Zmiany testów i bramki

Zmiany testów (jawnie):
- Brak zmian istniejących asercji. `cargo fmt` przeformatował linie nowych funkcji w `src/data/derived.rs` i `tests/derived_values.rs` (zmiany tylko w kodzie tej rundy; `git diff --stat` potwierdza).
- Nowe testy w `tests/derived_values.rs`: `diplomacy_multipliers_cover_each_constant_once_with_web_values` (11 wierszy, ID raz, klasy, wektory web), `basket_and_treaty_duration_read_diplomacy_table` (koszyk x rola x trudność, czas traktatu NAP i rozbieżność Peace pinowana), `difficulty_is_one_type_across_domain_modules` (jeden typ, klucze, serde).
- Liczba testów: 359 (runda 2) → 362 (runda 3), 0 niezaliczonych.

Bramki (pełne surowe logi w katalogu runu, każdy z `EXIT=`):
- `gate-fmt.log`: `cargo fmt --check` → `EXIT=0`.
- `gate-clippy.log`: `cargo clippy --offline --all-targets -- -D warnings` → `EXIT=0`.
- `gate-test.log`: `cargo test --offline --no-fail-fast` → `EXIT=0`, 362 passed, 0 failed.
- `dowody/gen-diplomacy-web.log`: generator uruchomił kod weba → `EXIT=0`.
- `dowody/verify-diplomacy-web.log`: `sprawdzono wierszy: 11 z 11`, `LICZBA ROZBIEZNOSCI: 0`, `EXIT=0`.
- `dowody/check-etap3-r3.log`: `LICZBA BLEDOW ETAP3: 0`, `EXIT=0`.
- Build: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_4a60bbaf-350-3 CARGO_PROFILE_DEV_DEBUG=0`, `--offline`. Katalog targetu usunięty po pracy. `rust-port/engine/Cargo.lock` powstał przy buildzie, jest nieśledzony i NIE jest commitowany.

Narzędzie uruchamiające web: `node --experimental-transform-types --import ./gen-loader-register.mjs ./gen-diplomacy-web.mjs <KORZEN> <wyjście>`, KORZEŃ = `git archive edb8fb56 gra/src gra/data` rozpakowany poza repo. Loader (`gen-loader-hooks.mjs`) dopisuje `.ts` / `/index.ts` i czyta `.json`. Bez `--experimental-transform-types` enumy TS nie działają (Node 22.22: `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`).

### 10.5 Unifikacja `enum Difficulty` (decyzja techniczna z dispatchu)

Jeden typ: `rust-port/engine/src/domain/types.rs` (`Difficulty`, `Default` = Normal, serde `easy`/`normal`/`hard`, metoda `key()`). Re-eksport zachowujący ścieżki: `domain::Difficulty`, `domain::diplomacy::Difficulty`, `domain::barbarians::Difficulty`, `domain::trade::Difficulty`. `git grep "enum Difficulty" -- rust-port/engine/src` → 1 trafienie (`types.rs:497`).

### 10.6 Status zakresu po rundzie 3 (ETAP 3 z klasą i plik:linia)

- AI (wiersz 35a): `ai.ts:1265` (AI_MAJOR_EARLY_ECON_BUILDING_MULT, a), `ai.ts:4568` (TERYTORIUM_MNOZNIK, a) — ETAP 3, runda 4 (plik:linia z sekcji 1b, zweryfikowane `check-etap3-r3.log`).
- Barbarzyńcy: `diplomacy-barbarian-cooperation.ts:10, :21, :25` (NL-mnożnikowa, sekcja 1b, 35o6). Brak stałych-mnożników w inwentarzu barbarzyńców; `barbarians.rs` nie ma literałów mnożnikowych w tej rundzie NIE_ZMIERZONO → ETAP 3.
- Walka/oblężenie (35f–h, 35l, 35l2, 35o1–35o4): ETAP 3, runda 4 (sekcja 1b).
- Wzrost (35b, b): `population-growth-v85.ts:92`; mapa (35j–k); społeczeństwo (35n); wioski (35c); ruch (35i); produkcja/magazyn/ludność (19–21): ETAP 3 (sekcja 1b).
- 22b cennik PN (dane `gra/data/diplomacy.json:158`): ETAP 3.
- 35p (NOWA, rozbieżność z przeglądu r3): `archetype_aggression` i `archetype_trade` w `rust-port/engine/src/domain/diplomacy.rs:1022–1063` — literały per cywilizacja (wartości 0.15–0.90), klasa b (skończony zbiór cywilizacji), NIE w inwentarzu P3-19; odpowiednik w webie NIE_ZMIERZONO → ETAP 3, runda 4, z decyzją właściciela, czy wchodzą do etapu 2.

### 10.7 Stan kryterium etapu 2 (uczciwie)

- Spełnione: HANDEL (6 wierszy), DYPLOMACJA (11 wierszy), unifikacja `Difficulty`, bramki EXIT=0, 362 testy ≥ 358.
- NIE spełnione: brak mnożników w czasie gry w plikach domeny objętych etapem — `domain/diplomacy.rs` nadal ma literały archetypów (35p); AI, barbarzyńcy, walka, wzrost, mapa, społeczeństwo, wioski, ruch, produkcja 19–21 niezrobione (ETAP 3).
- Rozbieżność Rust–web NIEROZSTRZYGNIĘTA (wymaga decyzji właściciela, nie zmieniano): Peace w mnożniku czasu traktatu (D4); ceil(x/2) dochodu tras (H3, z rundy 2).

### 10.8 Pliki zmienione w rundzie 3

- `rust-port/engine/data/derived/diplomacy-multipliers.json` (nowy).
- `rust-port/engine/src/data/derived.rs` (akcesory dyplomacji).
- `rust-port/engine/src/domain/types.rs`, `mod.rs`, `diplomacy.rs`, `barbarians.rs`, `trade.rs` (Difficulty; koszyk i czas traktatu czytają tabelę).
- `rust-port/engine/tests/derived_values.rs` (3 nowe testy).
- `dyspozycje/rust-port/p3/P3-22-FLATTEN-STAGE2.md` (ten dokument).
- `dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/`: `gen-diplomacy-web.mjs`, `gen-loader-hooks.mjs`, `gen-loader-register.mjs`, `verify-diplomacy-web.py`, `check-etap3.py` (bez zmian), `dowody/*` (nowe logi), `gate-*.log` (zaktualizowane).
- Poza zakresem (nietknięte): `bridge.rs`, `playable.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`.

DEPLOY/PUSH: NIE WYKONANO.

## 11. RUNDA 4 (Operator, po FAIL Final Control r3)

Baza: `origin/rust-port/parity-v2` = `bf59164b` (checkout detached), potem `git cherry-pick 3e6940fc` (runda 3: DYPLOMACJA + `Difficulty`), wynik `76f5f4d9`. Pin weba: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` rozpakowane poza repo).

### 11.1 Zakres rundy 4 i status

| # | Pozycja (web) | Klasa | Status R4 | Dowód |
|---|---|---|---|---|
| D4 | TREATY_DURATION_MULTIPLIER_ACTIONS: Peace | NL (zbior) | ROZWINIETE: Rust zgodny z webem (pokoj x1) | `dowody/web-diplo-values-r4.json` (pokoj 9/9 = 1); `derived_values.rs`, `tests/diplomacy.rs` |
| 35a | AI_MAJOR_EARLY_ECON_BUILDING_MULT = 0.70 | a | BEZ MECHANIKI (tabela NIEUZYWANA) | `ai.ts:1265` (literal), `ai.ts:2039` (uzycie); Rust: brak mnoznika, `ai_turn.rs:958-984` (priorytety calkowite) |
| 35a2 | TERYTORIUM_MNOZNIK = 1.25 | a | BEZ MECHANIKI (NIEUZYWANA) | `ai.ts:4568` (literal), `ai.ts:4647`; Rust: brak silaAI z terytorium |
| 35o5 | AI_MAJOR_ABSORB_POWER_RATIO_MIN = 10 (prog) | a | BEZ MECHANIKI (NIEUZYWANA) | `ai-major-absorb.ts:10` (uruchomiony), `:73`; Rust: brak `instant_annex` |
| 35f | HILL_DEFENSE_MULT = 1.5 / MOUNTAIN_DEFENSE_MULT = 1.75 | a | ROZWINIETE w tabeli i w `combat.rs` (`terrain_defense_multiplier`), ALE plik `combat.rs` NIE jest w drzewie `domain/mod.rs`; dolacza go wylacznie `tests/combat.rs` (`#[path]`) | `siege.ts:118,124` (uruchomiony), `combat-params.json:46-47` |
| 35o3 | MUR 200 / CYTADELA 100 / BASZTA 100 / PALISADA 100 (miasto) | a | MUR: ROZWINIETE (`wall`, tylko przez `tests/combat.rs`); CYTADELA, BASZTA, PALISADA: BEZ MECHANIKI (Rust nie ma tych budynkow, NIEUZYWANE) | `miasto-params.json:79,84,89,94`; `city-defense.ts:55` (uruchomiony, probki 6/6) |
| 35o3b | Fort terenowy 100 / posterunek 50 (structureDefBonusPct) | a | ROZWINIETE (`fort`, `outpost`; tylko przez `tests/combat.rs`) | `terrain-improvements.json` (`fort`, `posterunek`, `bonus_obrona_proc`); `combat.ts:327-328` |
| 35o1 | FORTIFY_OBRONA_BONUS = 2 / FORTIFY_OBRONA_PROC = 50 | a | BEZ MECHANIKI (pola `units_combat.rs:248-249` tylko deserializowane) | `siege.ts:131` (uruchomiony), `combat-params.json:48-49`, `city-defense.ts:170` |
| 35o2 | VETERAN_BONUS_FRAC {0:0, 1:0.10, 2:0.15, 3:0.20} | b (poziom 0-3) | BEZ MECHANIKI (brak weterana w `domain/`) | `veteran.ts:71` (uruchomiony, 4/4) |
| 35h | EMBARK_DEFENSE_MULT = 0.5 | a | BEZ MECHANIKI (brak obrony na wodzie w `domain/`) | `embarkation.ts:28` (uruchomiony); `git grep -i embark -- rust-port/engine/src/domain` = tylko ruch |
| 35o4 | SIEGE_AI T1 1.8 / T2 1.4 / T3 1.1 (progi) | a (prog) | BEZ MECHANIKI (brak oblezenia AI; `units_combat.rs:259-261` tylko deserializacja) | `siegeAi.ts:37,43,46` (uruchomiony), `combat-params.json:56-58` |
| 35l | MORALE_HIT_LOSS_SCALE 100 / MORALE_ARMY_COLLAPSE_RATIO 0.40 / MORALE_ARMY_COLLAPSE_MULT 1.3 | a | BEZ MECHANIKI (Rust: tylko `morale_factor`, `combat.rs:241`) | `battleScene.ts:1050,1070,1071` (ODCZYT_LITERALU: plik nie laduje sie w Node) |
| 35l2 | BROD_RUCH 0.5 / KARA_ATAK 0.25 / KARA_OBRONA 0.25 / BONUS_BRZEG 0.15 | a | BEZ MECHANIKI (brak brodu w `domain/`) | `combat-params.json:33-39` (JSON), `battleScene.ts:918-921` |
| 35g | COUNTER_MULT = 1.5 (domyslny) | a | ETAP 3 (patrz 11.3) | `combat.ts:20`, `combat.ts:513-548`; Rust: literalowa macierz `combat.rs:208-209` |
| 35p | `archetype_aggression` / `archetype_trade` | b | ETAP 3 → P3-18 (tabele zakodowane na stale, nie mnozniki) | `diplomacy.rs:1022-1063` (poza inwentarzem P3-19) |
| 35o6 | BARBARIAN_COOPERATION_RADIUS / _TURNS / _DEFAULT_DURATION_TURNS | NL | NIE-MNOZNIK (promien/czas) — poza zakresem etapu 2 | `diplomacy-barbarian-cooperation.ts:10,21,25`; Rust `barbarians.rs`: brak literalow mnoznikowych z inwentarza (`grep-literals-r4.txt`) |

Grupa BARBARZYNCY: w inwentarzu nie ma wiersza klasy a/b poza 35o6 (NL). Status: ZAMKNIETE jako NL/BEZ MECHANIKI, bez tabeli.
Grupa AI: 35a, 35a2, 35o5 ZAMKNIETE jako BEZ MECHANIKI z tabela NIEUZYWANA (ai.ts nie laduje sie w Node: wartosci z odczytu literalu, pole `zrodlo_wartosci`).
Grupa WALKA/OBLEZENIE: 35f, 35o3, 35o3b, 35o1, 35o2, 35h, 35o4, 35l, 35l2 ZAMKNIETE (ROZWINIETE albo BEZ MECHANIKI); 35g ETAP 3.

### 11.2 Tabela `rust-port/engine/data/derived/combat-ai-multipliers.json` (25 wierszy)

Parser i akcesory: `src/data/derived.rs` (`combat_ai_multiplier_value`, `combat_ai_multiplier_by_key`). Generator URUCHAMIA kod weba: `dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/gen-combat-web.mjs` (wynik: `dowody/web-combat-values.json`). Weryfikator niezalezny: `verify-combat-web.py` → `LICZBA ROZBIEZNOSCI: 0`, EXIT=0.
Wiersze ROZWINIETE: 5 (HILL, MOUNTAIN, MUR, FORT_TERENOWY, POSTERUNEK). NIEUZYWANE: 20. Status NIEUZYWANE nie moze byc czytany przez kod (sprawdza weryfikator).

### 11.3 ETAP 3 (z klasa i plik:linia, NIE zrobione w rundzie 4)

- 35g COUNTER_MULT (a): `gra/src/game/combat.ts:20`, uzycie `:513-548`. Rust: macierz literalowa `rust-port/engine/src/domain/combat.rs:208-209` (1.50, 1.25, 1.15 w `counter_multiplier`) oraz `combat.rs:224` (Forest 1.25, poza inwentarzem). Wymaga przepiecia macierzy na dane `counters.json` — osobny temat.
- Poza inwentarzem P3-19 (zgloszone, NIE zmieniane): `rust-port/engine/src/domain/diplomacy.rs:668,670,714,716` (wspolczynnik `0.5` w `w/100*0.5` — wplyw relacji na PN; brak odpowiednika w inwentarzu). Klasa: do klasyfikacji w rundzie 5.
- Rozbieznosc struktur (NIE zmieniona, zgloszona): Rust `structure_defense_multiplier` SUMUJE wall+fort+outpost; web `structureDefenseBonusFor` (main.ts) bierze NAJWYZSZY wariant (miasto → `cityWallDefenseBonusPercent`, potem fort, potem posterunek). Dotyczy hexa z kilkoma strukturami naraz; nie zmieniano w R4.
- Wiersze z odczytem literalu (ai.ts, battleScene.ts): wartosci sprawdzone regexem weryfikatora; NIE sa uruchomione w Node (`ai.ts` wymaga pakietu `three`, niedostepnego w archiwum). NIE_ZMIERZONO: wynik uruchomionego kodu tych dwoch plikow.
- Barbarzyncy: 35o6 (NL, promien/czas) poza zakresem etapu 2.

### 11.4 Tabela było/jest zmian zachowania (runda 4)

| Element | Było | Jest | Zmiana zachowania |
|---|---|---|---|
| Mnoznik czasu traktatu `Peace` (`treaty_duration_pn_multiplier`) | liczony jak NAP (20 tur = x4, 15 tur = x2, 0 = x8) | x1 dla kazdego czasu (zbior akcji z webu: nap, trybut_zadanie, trybut_oferta) | TAK: decyzja `Peace` (`evaluate_proposal`) nie zalezy od czasu. Wektor web: `dowody/web-diplo-values-r4.json` (pokoj 9/9 = 1). Test `tests/diplomacy.rs::peace_price_uses_treaty_duration_precedence_and_multiplier` PRZEPISANY (11.5). `derived_values.rs`: Peace = 1.0 dla 0,-3,5,10,12,15,20,25. |
| Wzgorze / gory (`terrain_defense_multiplier`, `combat.rs`, tylko test) | literal 1.5 / 1.75 | odczyt tabeli 1.5 / 1.75 | 0 (wartosci identyczne) |
| Structure (`structure_defense_multiplier`, `combat.rs`, tylko test) | literal 2.0 / 1.0 / 0.5 | odczyt tabeli: MUR 200, FORT 100, POSTERUNEK 50 (÷100) | 0 (wartosci identyczne; `tests/combat.rs` przechodzi bez zmian) |
| Nowe wiersze NIEUZYWANE (20) | brak | tabela, bez wiazania | 0 |

### 11.5 Zmiany testow (jawna lista)

- `tests/diplomacy.rs::peace_price_uses_treaty_duration_precedence_and_multiplier`: PRZEPISANY. Powod: test pinowal mnoznik czasu dla Peace (1999 odrzucone przy 20 turach, 4000 przy bezterminowym). Po decyzji Q1=A (web 1:1) progi mnoznikowe sa nieprawdziwe. Nowy test: decyzja Peace nie zalezy od czasu (rownosc z 10 turami) oraz 500 PN przy 20 turach = accepted. Test FAIL po zmianie Peace byl zgodny z oczekiwaniem zmiany i nie zostal zlagodzony.
- `tests/derived_values.rs`: sekcja Peace (2.0) zamieniona na 1.0 z wektorami web; reszta bez zmian.
- Nowy `tests/combat_ai_multipliers.rs` (3 testy): ksztalt/kompletnosc/statusy (25 wierszy, ID raz), wektory web (klasa a + veterani), arytmetyka cityWall (100/200/300/400).
- Zadnej asercji nie osłabiono.

### 11.6 Testy i bramki (surowe logi w katalogu runu)

Liczba testow: po R4 = **365**, 0 failed (baza po cherry-picku R3 = 362).
Podzial (z `gate-test-r4.log`): lib = 6, testy integracyjne (`tests/*.rs`) = 359, doc-testy = 0. Rozbieznosc sum R3 (362 vs 367) jest raportowana jawnie w tym podziale.
- `gate-fmt-r4.log`: `cargo fmt --check` → `EXIT=0`.
- `gate-clippy-r4.log`: `cargo clippy --offline --all-targets -- -D warnings` → `EXIT=0`.
- `gate-test-r4.log`: `cargo test --offline --no-fail-fast` → `EXIT=0`, 365 passed, 0 failed.
- `dowody/`: `web-combat-values.json`, `web-diplo-values-r4.json`; `verify-combat-web.py` → 0 rozbieznosci.
- `grep-literals-r4.txt`: pozostale literaly mnoznikowe w domenie objetej etapem (ETAP 3 / poza inwentarzem, 11.3).
- Build: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_cfef13c9-7c9-1 CARGO_PROFILE_DEV_DEBUG=0`, `--offline`. Po pracy katalog targetu usuniety. `Cargo.lock` nieśledzony, NIE commitowany.

### 11.7 Stan kryterium etapu 2 (uczciwie)

- Spelnione: HANDEL (R2), DYPLOMACJA (R3, Peace w R4), unifikacja `Difficulty` (R3), AI (35a, 35a2, 35o5 — BEZ MECHANIKI z tabela), BARBARZYNCY (NL, brak mnoznikow z inwentarza), WALKA/OBLEZENIE bez 35g (ROZWINIETE albo BEZ MECHANIKI), bramki EXIT=0, 365 testow ≥ 358.
- NIE spelnione: 35g (ETAP 3, `combat.rs:208-209`), WZROST 35b, MAPA 35j-k, SPOLECZENSTWO 35n, WIOSKI 35c, RUCH 35i, produkcja 19-21, 22b (dane cennika), 35p (P3-18), `diplomacy.rs:668-716` (poza inwentarzem), rozbieznosc struktur (sumowanie vs najwyzszy). Te pozycje wchodza do rundy 5 albo do osobnego tematu.
- Ograniczenie wiarygodnosci: mechanika walki (`combat.rs`) NIE jest czescia silnika (plik poza `domain/mod.rs`; dolaczany tylko przez `tests/combat.rs`). Wiersze WALKA oznaczone ROZWINIETE sa podpiete do funkcji testowanej, nie do rozgrywki. Do decyzji właściciela: podpiecie modulu do drzewa albo usuniecie martwego kodu.

### 11.8 Pliki zmienione w rundzie 4

- `rust-port/engine/data/derived/combat-ai-multipliers.json` (nowy); `rust-port/engine/src/data/derived.rs` (akcesory); `rust-port/engine/src/domain/combat.rs` (odczyt tabeli, tylko przez `tests/combat.rs`); `rust-port/engine/src/domain/diplomacy.rs` (Peace = x1).
- `rust-port/engine/tests/derived_values.rs`, `rust-port/engine/tests/diplomacy.rs` (przepisany test Peace), `rust-port/engine/tests/combat_ai_multipliers.rs` (nowy).
- `dyspozycje/rust-port/p3/P3-22-FLATTEN-STAGE2.md` (ta sekcja); `dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/`: `gen-combat-web.mjs`, `verify-combat-web.py`, `grep-literals-r4.txt`, `gate-*-r4.log`, `dowody/web-combat-values.json`, `dowody/web-diplo-values-r4.json`.
- Poza zakresem (nietkniete): `bridge.rs`, `playable.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`.
- PUSH: NIE WYKONANO.
