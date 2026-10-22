# P3-22 — FLATTEN-MULTIPLIERS, ETAP 2 (runda 1/5, Operator)

STATUS: PASS-WITH-NOTES (runda 1/5). Zakres etapu 2 jest duży. Ta runda domyka TYLKO grupę HANDEL (2 stałe). Pozostałe grupy są ETAP 3 (lista niżej, z klasą i plik:linia z P3-19 R4.3/R4.4). Nie są to pozycje „niezmierzone".

TEMAT: R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1
BAZA: `origin/rust-port/parity-v2` = `86311e3b` (detached). Pin weba: `edb8fb56`.
Źródło listy: `dyspozycje/rust-port/p3/P3-19-FLATTEN-MULTIPLIERS.md` (gałąź `claude/sprawdzenie-funkcjonalnosci-ek4ra0`), R4.3, R4.4, Załącznik D.

## 1. Status pozycji zakresu

Legenda: ROZWINIĘTE = tabela + test kształtu + wiązanie domeny; BEZ MECHANIKI = tabela NIEUŻYWANA, Rust nie ma mechaniki; ETAP 3 = nierozwinięte w tej rundzie, klasa i plik:linia podane.

| # | Pozycja | Klasa | Plik:linia (web, pin edb8fb56) | Status w R1 |
|---|---|---|---|---|
| H1 | TRADE_ROUTE_INTERNATIONAL_MULTIPLIER = 2 | a | definicja `gra/src/game/trade-routes.ts:1558`, użycie `:1575` | BEZ MECHANIKI (tabela `trade-multipliers.json`) |
| H2 | FALLBACK_TRADE_MULT = 1 | a | definicja `gra/src/game/culture-religion.ts:1268`, użycie `:1313` | BEZ MECHANIKI (tabela `trade-multipliers.json`) |
| 19 | citizen-resource-upkeep (utrzymanie ludności) | a | `gra/src/game/citizen-resource-upkeep.ts`, `gra/data/citizen-resource-upkeep.json` | ETAP 3 (produkcja/ludność) |
| 20 | throughputFallback x5 | a | `gra/src/game/converters.ts:56`, `:82-83` | ETAP 3 (produkcja) |
| 21 | Spichlerz: odpływ x5 | a | `gra/src/game/building-resource-gate.ts:329`, `:332`, `:383` | ETAP 3 (populacja/magazyn) |
| 22 | Dyplomacja: BUILDING_PN_FACTOR, BASKET_PN_DIFFICULTY_MULT_*, cennik PN | a + b | `gra/src/game/diplomacy-value-catalog.ts:35`, `:136`, `:146`, `:284-301` | ETAP 3 (dyplomacja) |
| 35a | AI_MAJOR_EARLY_ECON_BUILDING_MULT | a | `gra/src/game/ai.ts:1265` | ETAP 3 (AI) |
| 35b | CIV_MATRIX_GROWTH_DIFFICULTY_MULT | b | `gra/src/game/population-growth-v85.ts:92`, `:101` | ETAP 3 (wzrost) |
| 35c | VILLAGE_GOLD_ERA_MULT / VILLAGE_TECH_ERA_MULT | a | `gra/src/game/villageRewards.ts:42`, `:48`, `:137` | ETAP 3 (nagrody wiosek) |
| 35d | TREATY_DURATION_MULTIPLIER_ACTIONS | a (flaga) | `gra/src/game/diplomacy-proposals.ts:595`, `:617` | ETAP 3 (dyplomacja) |
| 35e | AI_DIPLOMACY_GENEROSITY_GOLD_MULT | b | `gra/src/game/diplomacy-economy.ts:164`, `:171` | ETAP 3 (dyplomacja) |
| 35f | HILL_DEFENSE_MULT / MOUNTAIN_DEFENSE_MULT | a | `gra/src/game/siege.ts:118`, `:124` | ETAP 3 (walka) |
| 35g | COUNTER_MULT | a | `gra/src/game/combat.ts:20` | ETAP 3 (walka) |
| 35h | EMBARK_DEFENSE_MULT | a | `gra/src/game/embarkation.ts:28`, `main.ts:27801` | ETAP 3 (walka) |
| 35i | ROAD_MOVE_SPEED_MULT / ROAD_BRUK_MOVE_SPEED_MULT | a | `gra/src/map/road-movement.ts:14`, `:29` | ETAP 3 (ruch) |
| 35j | RESOURCE_BASELINE_RARITY_MULT, RELIEF_OVERFLOW_CAP_MULT, MOUNTAIN_RANGE_REGROW_TARGET_MULT | a | `gra/src/map/newGameMapDefaults.ts:419`, `gra/src/map/gen-helpers.ts:2181`, `:2480` | ETAP 3 (mapa) |
| 35k | RIVER_SCALE_BY_SIZE, FALLBACK_RESOURCE_MULT, FALLBACK_RIVER_SCALE | b | `gra/src/map/newGameMapDefaults.ts:255`, `gra/src/data/map-gen-params-loader.ts:21`, `:24` | ETAP 3 (mapa) |
| 35l | BROD_RUCH_MULT, MORALE_ARMY_COLLAPSE_MULT, MORALE_HIT_LOSS_SCALE | a | `gra/src/battle/battleScene.ts:918`, `:1050`, `:1071` | ETAP 3 (bitwa) |
| 35m | SISTER_ALLIANCE_THRESHOLD_SCALE | b | `gra/src/game/diplomacy.ts:702` | ETAP 3 (dyplomacja) |
| 35n | FALLBACK_SOCIETY_SCALE | a | `gra/src/game/society-breakdown.ts:399` | ETAP 3 (społeczeństwo) |
| 35o | Pozostałe stałe z R4.4 (AI/handel/dyplomacja) | a/b | wg R4.4 tabeli w P3-19 | ETAP 3 |

Uwagi do tabeli:
- Wiersz 35 jest rozbity na podgrupy 35a–35o dla czytelności; źródłem klas i plik:linia jest P3-19 R4.4 (nie re-weryfikowane grepem w tej rundzie poza H1/H2).
- Wzmianka o `TRADE_ROUTE_INCOME_HALF_DIVISOR = 2` (`trade-routes.ts`, redukcja dochodu `ceil/2`) nie jest w liście R4.4. Klasyfikacja: a, wpisana do ETAP 3 jako kandydat do potwierdzenia.
- `BUILDING_GOLD_PURCHASE_MULT` (production.ts:635) jest ROZWINIĘTE w R4.2 (wiersz 8 ext.) i nie jest częścią tej rundy.
- Klasa C w tej rundzie: brak pozycji. Żadna pozycja z grupy HANDEL nie jest ciągła.

## 2. Wiązanie w Rust (dowód `git grep`)

```
git grep -n -E "TRADE_ROUTE_INTERNATIONAL|FALLBACK_TRADE|international|cityTradeMultiplier" HEAD -- rust-port
```
Wynik: zero trafień poza nowym kodem tej rundy (`src/data/derived.rs`, `data/derived/trade-multipliers.json`, `tests/derived_values.rs`). `rust-port/engine/src/domain/trade.rs` nie ma tras międzynarodowych ani mnożnika religijnego, więc H1 i H2 są BEZ MECHANIKI. Domena nie była zmieniona.

## 3. Pliki zmienione w tej rundzie

- `rust-port/engine/data/derived/trade-multipliers.json` (NOWY): 2 wiersze, klasa a, pole `rust` z adnotacją „bez mechaniki”.
- `rust-port/engine/src/data/derived.rs`: +26 linii (stała `TRADE_MULTIPLIERS_JSON`, struktury `TradeMultipliersFile` / `TradeMultiplierRow`, `parse_trade_multipliers()`). Brak zmian istniejącego kodu.
- `rust-port/engine/tests/derived_values.rs`: +19 linii (test `trade_multipliers_cover_each_constant_once_with_class_a`). Brak zmian istniejących testów. `cargo fmt` nie zmienił istniejących linii (`git diff` nie pokazuje usuniętych linii).
- `dyspozycje/rust-port/p3/P3-22-FLATTEN-STAGE2.md` (NOWY, ten dokument).
- `dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/` (logi bramek).

Poza zakresem (nie dotknięte): `bridge.rs`, `playable.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `domain/**`.

## 4. Tabela było/jest zmian zachowania

| Element | Było | Jest | Zmiana zachowania |
|---|---|---|---|
| TRADE_ROUTE_INTERNATIONAL_MULTIPLIER | brak w Rust | tabela, wartość 2, NIEUŻYWANA | brak (0) |
| FALLBACK_TRADE_MULT | brak w Rust | tabela, wartość 1, NIEUŻYWANA | brak (0) |
| Testy istniejące | 358 zielonych | 358 zielonych + 1 nowy | brak zmian w testach |

## 5. Zmiany testów

Brak zmiany istniejących testów. Dodano 1 test kształtu (`trade_multipliers_cover_each_constant_once_with_class_a`): 2 wiersze, unikalne ID, klasa a, wartość ≥ 1, pole `rust` zaczyna się od „bez mechaniki”.

## 6. Bramki (surowe logi w katalogu runu)

- `dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/gate-fmt.log`: `cargo fmt --check`, `EXIT=0` (po jednorazowym `cargo fmt`).
- `dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/gate-clippy.log`: `cargo clippy --offline --all-targets -- -D warnings`, `EXIT=0`.
- `dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/gate-test.log`: `cargo test --offline`, `EXIT=0`, 359 zaliczonych, 0 błędów (baseline przed zmianą: 358, plik `baseline-test-pre-change.log`, `EXIT=0`).

Build: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_6b09c6e4-c20-1 CARGO_PROFILE_DEV_DEBUG=0`. Katalog `target` po zakończeniu do usunięcia (patrz sekcja 7).

## 7. Otwarte punkty i ustalenia

- P-R1-1: Brak wektora zgodności z webem dla H1/H2 (generator `gen-*.mjs` nie był uruchamiany). Wartości zweryfikowane literałem w źródle, `grep -n` na `edb8fb56`. Wektor z nagrania weba: NIE_ZMIERZONO.
- P-R1-2: Wejścia stanów (b) w API domeny (P-R4-1 z P3-19) nadal otwarte. Decyzja właściciela.
- P-R1-3: Pozycje `pieniadzMnoznik` (martwa flaga → NIEUŻYWANE) i `utrzymanie_surowcowe_na_ture` (web czyta, Rust nie ma mechaniki) z rozstrzygnięć administracyjnych NIE są w tej rundzie wykonane. Przechodzą do ETAP 3 razem z ich grupą.
- P-R1-4: Kolejność grup do rundy 2: dyplomacja (22, 35d, 35e, 35m), AI (35a), walka/oblężenie (35f–35h, 35l), wzrost (35b), mapa (35j, 35k), społeczeństwo (35n), wioski (35c), ruch (35i). Każda grupa osobno, pełna.

## 8. Wnioski

Grupa HANDEL zamknięta (2/2). Zakres etapu 2 NIE jest zamknięty: 16 podgrup ETAP 3 z klasą i plik:linia. Binarne kryterium sukcesu etapu 2 nie jest spełnione w tej rundzie.
