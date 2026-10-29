# P6 · REPIN-EKONOMIA-C (krok 4b, część C) — mnożnik kosztu budowy ulepszeń terenu

Pin: web `edb8fb56` → `91dc998a5f1b51ad29e0f4785edfd45655445c53`. Temat: `R-RUSTPORT-REPIN-EKONOMIA-C-Q1`, runda 1/5.
Manifesty pinu NIE przesunięte (osobny temat po krokach 1–5 wg REPIN-DELTA §6).

## Tabela zmian behawioralnych (część C)

| # | Zmiana w webie 91dc998a | Plik:linia weba | Plik:linia Rust | Test / wektor | Status |
|---|---|---|---|---|---|
| C1 | Nowa `terrainImprovementConstructionEraMultiplier`: epoka ≤1 (lub brak/niepoprawna) → 0.5; 2 → 1; ≥3 → 2·2^(e−3) | `gra/src/game/terrain-improvements.ts:91` | `rust-port/engine/src/domain/improvements.rs:789` (`terrain_improvement_construction_era_multiplier`) | `tests/p6_repin_c_construction.rs` (granice N−1/N/N+1 dla epok 1,2,3; brak/NaN/±Inf); `tests/p6_m16_rules.rs::work_cost_scale_matches_web` | PORTOWANE |
| C2 | `scaleTerrainImprovementWorkCost` używa mnożnika budowy (0.5/1/2) zamiast utrzymania (1/2/4); domyślne `era = 1` | `gra/src/game/terrain-improvements.ts:108` | `rust-port/engine/src/domain/improvements.rs:821` (`scale_terrain_improvement_work_cost`) | `tests/p6_repin_c_construction.rs::scale_work_cost_uses_construction_rates_at_boundaries`; `tests/p6_23_improvements.rs::era_and_cost_scaling_match_web` (280 przypadków); `tests/p6_m16_rules.rs::work_cost_scale_matches_web` (40 wartości); `tests/p6_m16_qualifier.rs` (kosztPraca) | PORTOWANE |
| C3 | `terrainImprovementEraMultiplier` (utrzymanie 1/2/4) — bez zmian behawioralnych (tylko komentarz) | `gra/src/game/terrain-improvements.ts:72–89` | `improvements.rs:756` | `tests/p6_repin_c_construction.rs::construction_is_separated_from_upkeep_multiplier`; wektor `terrainImprovementEraMultiplier` bez zmian | NIE-DOTYCZY (komentarz; zachowanie utrzymane, strażnik w teście) |
| C4 | Komentarze / docstringi (`scaleTerrainImprovementWorkCost`, `TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS`) | `gra/src/game/terrain-improvements.ts:70–76, 103–114` | — | — | NIE-DOTYCZY (niebehawioralne) |
| C5 | `relief-preserving-improvements.ts`: `tartak` dodany do `PRESERVES_HILL_RELIEF_EXPLICIT_KEYS` (+ komentarze) | `gra/src/game/relief-preserving-improvements.ts:23` | brak portu predykatu: `rust-port/engine/src` i `rust-port/renderer/src` bez trafień `PRESERVES_HILL_RELIEF`/`preservesHillRelief` (grep `relief|preserv` @d5ede61e; trafienia renderera to `hug_terrain_relief` i `reliefSurfaceSampler`, nie ten predykat). Predykat jest po stronie renderera (`gra/src/game/` + model 3D) | — | NASTĘPNA-PARTIA (osobna partia wg dispatchu; zmiana behawioralna, wymaga portu w `rust-port/renderer/**`, poza allowlistą tej partii) |
| C6 | `population-growth-v85.ts` — 4 zmiany behawioralne: (a) `rationEraFoodCostMultiplier` 46–50 + parametr `ownerEra` w `computeCityRationCost` 216–220; (b) `growthPercentWithOrderMultiplier` 287–294 + `orderGrowthMultByCity` 537–546; (c) `manpowerMaxMultByOwnerId` / `civManpowerMatrixMults` 446–448, 584–590 | `gra/src/game/population-growth-v85.ts:46–50, 216–220, 287–294, 446–448, 537–546, 584–590` | `rust-port/engine/src/domain/city_growth.rs:1160` (`compute_city_ration_cost`, BEZ mnożnika ery), `city_growth.rs:1200` (`compute_growth_percent_v85`, BEZ mnożnika Order), `rust-port/engine/src/domain/recruitment.rs:1771` (`civ_manpower_max_mult`, BEZ ścieżki matrix) — NIE_ZMIERZONO: grep `order_growth`/`growth_percent_with_order` bez trafień | — | NASTĘPNA-PARTIA (osobna partia; każda podzmiana (a)/(b)/(c) to osobny commit z testem; (a) rozjeżdża Rust z pinem 91dc998a już dziś — koszt żywności miasta) |

## Wektory (zamknięcie M16 dla części C)

Generatory uruchomione na URUCHOMIONYM webie `91dc998a` (`git archive 91dc998a gra/src gra/data` do katalogu poza repo):

| Plik | Źródło | Zmiana | Rozmiar | Uwagi |
|---|---|---|---|---|
| `tests/p6_m16_vectors/qualifier.json` | `R-RUSTPORT-P6-M16-ULEPSZENIA-BUDOWA-REGULY-Q1/gen-m16-vectors.mjs` | 11551 liści `kosztPraca` (w `api.work_cost` / `qualifying`), reszta identyczna | 7 737 658 B (< 10 MB) | limit 10 MB zachowany bez redukcji reguły |
| `tests/p6_m16_vectors/rules.json` | j.w. | `work_cost_scale`: 8 wpisów × 5 wartości `era` = 40 (+ 8 wartości `base`, łącznie 48 liści); `kosztPraca`: 22 wystąpienia, wszystkie w `meta[i].out.kosztPraca` (zweryfikowane parserem JSON @d5ede61e) | 3 999 579 B | — |
| `tests/p6_m16_vectors/gallery.json` | j.w. | brak zmian (cmp identyczny) | 613 014 B | — |
| `tests/p6_23_vectors/improvements.json` | `R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1/gen-p623-vectors.mjs` | 280 przypadków `scaleTerrainImprovementWorkCost` | — | `meta.pin_web` ustawiony na `91dc998a` ręcznie (generator `R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1/gen-p623-vectors.mjs` ma literal `pin_web: 'edb8fb56'` w liniach 1, 252, 429, 503, 610; generatora nie zmieniano — poza allowlistą; po ponownej regeneracji `meta.pin_web` wróci do `edb8fb56`, reszta pliku identyczna — follow-up: poprawka generatora w osobnym temacie) |
| `tests/p6_23_vectors/{order,hexmove,fort}.json` | j.w. | brak zmian (cmp identyczny) | — | — |

## Mutacje

Stara ścieżka 1/2/4 w `scale_terrain_improvement_work_cost` → FAILED w 3 testach (`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-C-Q1/mutation-r1.txt`). Asercje nie osłabione.

## Weryfikatory niezależne (tekstowe modele)

- `R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1/verify-p623-vectors.py <web> rust-port/engine`: 16496 porównań, 280 rozbieżności — WSZYSTKIE w `ti.scaleTerrainImprovementWorkCost` (model Pythona nadal ma starą formułę 1/2/4 z `edb8fb56`). Zgodne z oczekiwaniem zmiany C2; weryfikator wymaga aktualizacji (poza allowlistą, osobny temat).
- `R-RUSTPORT-P6-M16-ULEPSZENIA-BUDOWA-REGULY-Q1/verify-m16-vectors.py`: 138335 porównań, 11037 rozbieżności — ta sama przyczyna (model kosztu budowy w Pythonie = stara formuła). Autorytatywne porównanie to testy Rust na wektorach z realnego weba 91dc998a: 0 rozbieżności.
  ZAŁOŻENIE: różnica 11037 vs 11551 liści wynika z tego, że część wpisów `kosztPraca` jest liczona w weryfikatorze inną ścieżką modelu; nie badano dalej (poza zakresem rundy 1).

## Bramki (runda 1)

- `cargo fmt --all -- --check`: EXIT=0
- `cargo clippy --all-targets -- -D warnings`: EXIT=0
- `cargo test --no-fail-fast` (`rust-port/engine`): 1276 passed / 0 failed (baseline 1272 + 4 nowe testy)
- `git diff --check`: czysty

## Weryfikacja niezależna (runda 1, R-RUSTPORT-REPIN-EKONOMIA-C-Q1-verifier)

- Bramki powtórzone na `bfc79e73` (logi w `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-C-Q1/`): `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo test --no-fail-fast` EXIT=0, suma 1276 passed / 0 failed.
- Wektory: porównanie z przed-zmianą (`84136f57`) dla `qualifier.json`, `rules.json`, `improvements.json`. Wszystkie zmienione wartości numeryczne mają stosunek stare/nowe dokładnie 2.0 (0.5×). Zmiany typu int→float: 433 (qualifier), razem 11118 + 433 = 11551 liści. Zgodne z opisem operatora. Strukturalnie bez zmian kluczy poza `kosztPraca`, `work_cost_scale`, `era` (listy wartości) i `meta.pin_web`.
- Zgodność formuły web vs Rust (ręczne porównanie `terrain-improvements.ts:91–114` @91dc998a z `improvements.rs:789–826`): ta sama normalizacja (`floor`, nie-skończona/brak → 1), ta sama gałąź ≤1→0.5, ==2→1, reszta 2·2^(e−3). Consumenci Rust (`improvement_build.rs:883`, `:922`) używają `scale_terrain_improvement_work_cost`, web consumenci (`improvement-tech.ts:105`, `map/improvement-build.ts:902`, `ui/entityCards/improvementAdapter.ts:163`) używają `scaleTerrainImprovementWorkCost`.
- Mutacja A (granica brązu: `return 1.0` → `return 2.0` w `terrain_improvement_construction_era_multiplier`): FAILED w 5 testach (m.in. `construction_multiplier_stone_bronze_iron_boundaries`, `era_and_cost_scaling_match_web`, `improvement_meta_and_tech_gate_match_web`, `work_cost_scale_matches_web`). Log: `mutation-verifier-A-bronze.log`.
- Mutacja B (usunięcie `floor()`): `sed` trafił w OBIE funkcje (`terrain_improvement_era_multiplier` :759 i nowa :791). FAILED w 2 testach (`construction_multiplier_stone_bronze_iron_boundaries`, `era_and_cost_scaling_match_web`). Log: `mutation-verifier-B-floor.log`. Kod przywrócony (`git checkout --`), drzewo czyste.
- Obserwacja: `terrain_improvement_era_multiplier` (1/2/4) nie ma konsumenta produkcyjnego w `rust-port/engine/src` (tylko definicja `improvements.rs:756` i testy). `resource_upkeep_improvement_keys` (`improvements.rs:1108`) ma wyłącznie konsumentów testowych. Web `computePracaUpkeepByOwner` (`gra/src/game/turn-economy.ts:937` @91dc998a, mnożnik `terrainImprovementEraMultiplier`) nie ma odpowiednika w Rust (grep `upkeep` w `rust-port/engine/src` bez trafień dla naliczania utrzymania ulepszeń). Mnożnik utrzymania NIE zmienił się między pinami (C3), więc to luka sprzed tej rundy, poza zakresem C. ZAŁOŻENIE: osobny temat (NASTĘPNA-PARTIA upkeep), nie działanie w tym temacie.
- Pozostaje jak u operatora: C5 (`relief-preserving-improvements.ts`) i C6 (`population-growth-v85.ts`) to NASTĘPNA-PARTIA; weryfikatory Python poza allowlistą (280 / 11037 rozbieżności, przyczyna: stara formuła w modelu).
- NIE_ZMIERZONO: ponowna regeneracja wektorów z uruchomionego weba `91dc998a` nie była wykonywana w tej rundzie. Zgodność wektorów z webem opiera się na raporcie operatora oraz na tym, że zmiany są dokładnie ×0.5 zgodnie z formułą web.

## Obrona (runda 1): odpowiedzi na zarzuty

Stan odtworzony z `d5ede61e` (łańcuch: `bfc79e73` operator kod+wektory, `d5ede61e` niezależna weryfikacja).

- Z1 — C5 i C6 nieportowane (NASTĘPNA-PARTIA): PRZYJMUJĘ. Dispatch dopuszcza osobną partię. Dowód braku odpowiednika: grep `preserv|relief` w `rust-port/engine/src` i `rust-port/renderer/src` bez trafień dla predykatu (sprawdzone w tej rundzie). C6 ma w Rust port `compute_city_ration_cost` (`city_growth.rs:1160`) bez mnożnika ery; wpis tabeli rozbity na podzmiany (a)/(b)/(c). Brak zmian kodu w tej rundzie.
- Z2 — liczby `22` i `40` w `rules.json`: ODRZUCAM zarzut błędu, PRZYJMUJĘ doprecyzowanie. Parser JSON @d5ede61e: 22 wystąpienia `kosztPraca`, wszystkie w `meta[i].out` (zmierzone). `work_cost_scale` to 8 wpisów z tablicą `era` po 5 wartości = 40; plus 8 wartości `base` (48 liści). Doprecyzowano w tabeli wektorów.
- Z3 — weryfikatory Python czerwone (280 / 11037): PRZYJMUJĘ jako blokadę poza allowlistą. Przyczyna potwierdzona w kodzie weryfikatora: `verify-m16-vectors.py:148` czyta `ERA_MULT` z `TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS` (tabela UTRZYMANIA 1/2/4), a `era_mult` (:239–245) używa jej także dla kosztu budowy. Naprawa wymaga zmiany plików w `dyspozycje/autobot/runs/R-RUSTPORT-P6-*` — poza allowlistą tematu. Osobny temat.
- Z4 — literal `edb8fb56` w generatorze p6_23: PRZYJMUJĘ. Dowód: `gen-p623-vectors.mjs` linie 1, 252, 429, 503, 610 (literal `pin_web`). Ręczne `91dc998a` w `improvements.json` (`meta.pin_web`) jest jedyną różnicą względem regeneracji (potwierdzone w raporcie weryfikatora). Poprawka generatora poza allowlistą; osobny temat.
- Z5 — luka `terrain_improvement_era_multiplier` / upkeep (`turn-economy.ts:937`): PRZYJMUJĘ jako śledzoną lukę. Dowód: sekcja Weryfikacja niezależna, punkt „Obserwacja” (doprecyzowany o `improvements.rs:756`, `:1108`). ZAŁOŻENIE: osobny temat, nie w tej partii.

Zmiany kodu Rust w obronie: brak. Zmiana tej rundy: wyłącznie dokument tabeli i wektorów (allowlista: `dyspozycje/rust-port/p6/P6-REPIN-EKONOMIA-C.md`).
