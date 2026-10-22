# P3-23 — FLATTEN etap 3 (mnożniki → konkretne liczby), runda 1

**TEMAT:** R-RUSTPORT-P3-23-FLATTEN-STAGE3-Q1 · **DOMAIN:** GAME · **Runda:** 1/5
**Baza:** `rust-port/parity-v2` @ `2a45e340` (zawiera P3.19 etap 1, P3.22 etap 2 r1–5).
**Pin weba:** `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do katalogu scratch poza repo).
**Dokumenty wejściowe:** `dyspozycje/rust-port/p3/P3-22-FLATTEN-STAGE2.md` (sekcje 1b, 10.6, 11.3, 12),
`dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/` (wzorzec generatora i weryfikatora).

## 0. Status rundy

- Zamknięta w tej rundzie: grupa **WALKA — macierz counter (wiersz 35g, `combat.rs:207-215`)**, w całości
  (tabela, parser, podpięcie w domenie, test kształtu, generator uruchamiający kod weba, niezależny weryfikator,
  0 rozbieżności).
- **Kryterium binarne etapu 3 NIE jest spełnione.** Pozostałe grupy są w sekcji 4 jako ETAP 3 (runda 2) lub ETAP 4
  z klasą i plik:linia. Dispatch dopuszcza zamknięcie części zakresu w rundzie.
- Status rundy: **PASS-WITH-NOTES** (zakres rundy wykonany, zakres etapu otwarty).

## 1. Macierz counter (35g) — ROZWINIĘTE

| Wiersz | Klasa | Web (pin edb8fb56) | Rust przed (`2a45e340`) | Rust po (r1) | Status |
|---|---|---|---|---|---|
| 35g `COUNTER_MULT` / macierz typów | a | `gra/src/game/combat.ts:527-549` (`counterMultiplier`), dane `gra/data/counters.json` (17 wierszy, 15 × Atak potwierdzone), `battleScene.ts:1267` (normCounters) | `rust-port/engine/src/domain/combat.rs:200-217` — `match (attacker, defender)` z literałami `1.50` / `1.25` / `1.15` | `rust-port/engine/data/derived/counter-multipliers.json` (8 × 8 = 64 pary, pola `atakujacy`, `cel`, `mnoznik`); odczyt `counter_multiplier_value` w `src/data/derived.rs`; `combat.rs:200-202` wywołuje tabelę | ROZWINIĘTE (czytane przez kod domeny; patrz sekcja 3 — NIE w pętli gry) |

Zasady: pary bez wpisu w `counters.json` mają mnożnik `1.0` (brak premii) i są w tabeli jawnie (64 pary, nie ma braków).
Wiersze `Rodzaj=Obrona` (np. „Atak z flanki” −50%) NIE są macierzą counter — web ich nie czyta w `counterMultiplier`.
Jawne `bonuses_vs_type` jednostki nadal mają pierwszeństwo nad tabelą (zachowanie bez zmian, test `explicit_unit_bonus_overrides_table`).

### 1a. Tabela było/jest (pary niezerowe)

| Para (atakujący → cel) | Było (literał Rust) | Jest (tabela) | Web (uruchomiony kod) | Zgodność |
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

Pozostałe 49 par: było `1.0` (brak literału, `_ => 1.0`), jest `1.0`, web `1.0`. Rozbieżności: **0**.
Dowód: `dowody/verify-counter-r1.log` (`PAR_NIEZERO_OCZEKIWANE: 15`, `PAR_NIEZERO_STARE_LITERAL: 15`, `ROZBIEZNOSCI: 0`).

### 1b. Dowody weryfikacji (plik:linia / komenda)

- Generator (uruchomiony kod TS weba): `dyspozycje/autobot/runs/R-RUSTPORT-P3-23-FLATTEN-STAGE3-Q1/gen-counter-web.mjs`
  → `dowody/counter-web.json` (64 pary). Uruchomienie: `node --experimental-transform-types --import <abs>/gen-loader-register.mjs <abs>/gen-counter-web.mjs <KORZEN> <wyjscie>`.
- Niezależny weryfikator (bez kodu weba, reguła z `combat.ts:527-549` przepisana w Pythonie):
  `dyspozycje/autobot/runs/R-RUSTPORT-P3-23-FLATTEN-STAGE3-Q1/verify-counter-web.py` → `dowody/verify-counter-r1.log`.
  Porównuje: A) tabela Rust vs oczekiwane; B) wynik kodu weba vs oczekiwane; C) stara macierz literalowa (`dowody/combat-before.rs`) vs tabela.
- Brak mnożników literalnych w domenie: `git grep -nE "1\.(50|25|15)\b" -- rust-port/engine/src/domain/combat.rs` → brak trafień (EXIT 1).

## 2. Testy

- Dodany: `rust-port/engine/tests/counter_multipliers.rs` (5 testów): pełna macierz typ × typ bez duplikatów;
  klucze kanoniczne; mnożniki skończone i > 0; odczyt tabeli dla każdej pary; domena czyta tabelę i daje `1.0` dla
  nieznanego typu; jawny bonus jednostki nadpisuje tabelę. **Żaden test nie pinuje wartości mnożnika.**
- Zmienione istniejące testy: **brak**. `tests/combat.rs` przechodzi bez zmian (wartości zachowane).
- Dług z sekcji 12.0 (`tests/derived_values.rs` pinuje wartości DYPLOMACJI) — NIE ruszany w tej rundzie (ETAP 3).

## 3. Do decyzji właściciela (ZAŁOŻENIA podjęte bez pytania)

1. **ZAŁOŻENIE:** moduł `combat.rs` jest martwy w rozgrywce (P3-22 sekcja 12.0 #1: w Rust nie ma wywołania
   `effective_strength` / `resolve_combat` z pętli gry). Tabela counter jest więc ROZWINIĘTA w sensie
   „czytana przez kod domeny i testowana”, **NIE** w sensie „używana w grze”. Nie podpinałem `combat.rs` do gry
   (zgodnie z dispatchem). Do decyzji: czy podpinać walkę do pętli gry (osobny temat).
2. **ZAŁOŻENIE:** wiersze macierzy trzymane są jako 64 pary (pełny stan skończony, Q3=A), a nie jako 15 wierszy,
   bo tabela ma być edytowalna bez zmiany kodu także dla par dziś neutralnych.

## 4. Pozostałe pozycje etapu 3 (klasa i plik:linia; NIE zrobione w rundzie 1)

Każda pozycja poniżej ma status ETAP 3 (runda 2) lub ETAP 4. Plik:linia z P3-22 sekcja 1b / 11.3 / 12.

| Grupa | Pozycje | Klasa | Plik:linia (web) | Domena Rust | Status |
|---|---|---|---|---|---|
| WALKA — struktury | obrona strukturalna: web BIERZE NAJWYŻSZY (`main.ts:26917-26931`, `structureDefenseBonusFor`), Rust SUMUJE (`combat.rs:244-252`, `structure_defense_multiplier`) | a (reguła) | `gra/src/main.ts:26917`; `gra/src/game/city-defense.ts:55-75` | `combat.rs:244-252`, testy `tests/combat.rs` (sumowanie) | ETAP 3, runda 2 — wymaga zmiany reguły i testu; web nie jest ładowalny w node (main.ts), weryfikacja przez odczyt kodu |
| WALKA | `combat.rs:470,475` (`(0.25 - 0.15*advantage).clamp(0.10,0.25)`) | c | brak odpowiednika (NIE_ZMIERZONO) | `combat.rs:470,475` | ETAP 4 (klasa c, nie ma wiersza webu do wektora) |
| DYPLOMACJA (poza inwentarzem) | `diplomacy.rs:410,412,415,975,1108,1110,1120` | a | `gra/src/game/diplomacy.ts:676`, `:1281` | `diplomacy.rs` | ETAP 3 (runda 2) |
| 35p archetypy | `diplomacy.rs:1027-1158` | b | — | `diplomacy.rs` | ETAP 3 → P3-18 |
| 35b wzrost | CIV_MATRIX_GROWTH_DIFFICULTY_MULT | b | `gra/src/game/population-growth-v85.ts:92`, `:101` | — | ETAP 3 |
| 35n społeczeństwo | FALLBACK_SOCIETY_SCALE | a | `gra/src/game/society-breakdown.ts:399` | — | ETAP 3 |
| 35c wioski | VILLAGE_GOLD_ERA_MULT / VILLAGE_TECH_ERA_MULT | a | `gra/src/game/villageRewards.ts:42`, `:48` | — | ETAP 3 |
| 35i ruch | ROAD_MOVE_SPEED_MULT / ROAD_BRUK_MOVE_SPEED_MULT | a | `gra/src/map/road-movement.ts:14`, `:29` | — | ETAP 3 |
| 35j–k mapa | RESOURCE_BASELINE_RARITY_MULT; RELIEF_OVERFLOW_CAP_MULT; MOUNTAIN_RANGE_REGROW_TARGET_MULT; RIVER_SCALE_BY_SIZE; FALLBACK_* | a/b | `gra/src/map/newGameMapDefaults.ts:255,419`; `gra/src/map/gen-helpers.ts:2181,2480`; `gra/src/data/map-gen-params-loader.ts:21,24` | — | ETAP 3 |
| 19–21 produkcja/magazyn/ludność | citizen-resource-upkeep; throughputFallback x5; Spichlerz odpływ x5 | a | `gra/src/game/citizen-resource-upkeep.ts`; `gra/src/game/converters.ts:56`; `gra/src/game/building-resource-gate.ts:329,332` | — | ETAP 3 |
| 22b cennik PN | `pn_zloto`, `pn_praca`, `pn_zywnosc` | dane | `gra/data/diplomacy.json:158` | — | ETAP 3 (dane, nie mnożnik) |
| AI 35a/35a2/35o5 | AI_MAJOR_EARLY_ECON_BUILDING_MULT; TERYTORIUM_MNOZNIK; AI_MAJOR_ABSORB_POWER_RATIO_MIN | a / próg | `gra/src/game/ai.ts:1265`, `:4568`; `gra/src/game/ai-major-absorb.ts:10` | — | ETAP 3 (ai.ts nie ładuje się w node) |
| Barbarzyńcy | NL-mnożnikowa | NL | `gra/src/game/diplomacy-barbarian-cooperation.ts:10,21,25` | `barbarians.rs` (brak literałów mnożnikowych, NIE_ZMIERZONO) | ETAP 3 |

Literały `diplomacy.rs` poza tabelą i dług testu `derived_values.rs` są w tej samej rundzie 2 jako osobny wpis.

## 5. Gate (surowe wyjścia w `dowody/`)

| Bramka | Wynik | Plik |
|---|---|---|
| `cargo fmt -- --check` | EXIT=0 | `dowody/gate-fmt-r1.log` |
| `cargo clippy --offline --all-targets -- -D warnings` | EXIT=0 | `dowody/gate-clippy-r1.log` |
| `cargo test --offline` | EXIT=0, **378 passed, 0 failed** (baza 373 + 5 nowych) | `dowody/gate-test-r1.log` |
| baza przed zmianą (`2a45e340`) | EXIT=0, 373 passed | `dowody/base-test.log` |

Build: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_e461f64a-457-1 CARGO_PROFILE_DEV_DEBUG=0`, `--offline`.
Po zakończeniu katalog targetu zostanie usunięty. `Cargo.lock` NIE jest commitowany (untracked, wygenerowany przez build).

## 6. Allowlista rundy 1

- `rust-port/engine/data/derived/counter-multipliers.json` (nowy)
- `rust-port/engine/src/data/derived.rs` (dodany blok `counter_multiplier_value`, bez zmian istniejących funkcji)
- `rust-port/engine/src/domain/combat.rs` (`counter_multiplier`: match → tabela; import)
- `rust-port/engine/tests/counter_multipliers.rs` (nowy)
- `dyspozycje/rust-port/p3/P3-23-FLATTEN-STAGE3.md` (nowy, ten dokument)
- `dyspozycje/autobot/runs/R-RUSTPORT-P3-23-FLATTEN-STAGE3-Q1/**`

Zero zmian w `bridge.rs`, `playable.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`.
Push: NIE WYKONANO.
