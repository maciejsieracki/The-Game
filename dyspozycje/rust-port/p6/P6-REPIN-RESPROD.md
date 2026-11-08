# P6-REPIN-RESPROD — usunięcie starej migawki produkcji surowców (dług D-R5-1)

Temat: R-RUSTPORT-REPIN-RESPROD-DUPLIKAT-Q1 (runda 1, Operator, Haiku 5.5).
Baza: `origin/rust-port/parity-v2` @ `0fd287721` (SHA z dispatchu; gałąź została przesunięta do `bf9298737`, nie integrowano).

## 1. Pomiar wołających (przed zmianą, `git grep` na bazie)

Stara rodzina (`domain/resource_production.rs`): `resolve_resource_production`, `resource_production_amount_for_era` (u8),
`stack_resource_production`, `ResourceKey`, `ResourceYield`, `ResourceProductionTotals`, `normalize_improvement_key` (lokalna wersja).

Wołający poza samym modułem:
- `tests/resource_production.rs` (cały plik, 7 testów),
- `tests/parity_suite.rs` (`improvements_and_resource_production_vectors_match_catalogue_rules`),
- `benches/engine_modules.rs` (`growth_and_resource_catalogue_benchmark`, `stack_resource_production` + `ResourceKey::Wood`).

Żywe w module i zostają: `citizen_*`, `compute_citizen_resource_drain`, `resolve_citizen_resource_coverage`,
`citizen_consumption_era_multiplier`, `citizen_upkeep_display_lines` (wołający: `order_effects_lane.rs`, `turn_economy_resources.rs`,
`city_growth.rs`, `tests/p6_8d_*`, `tests/p6_repin_ekonomia_e_citizen.rs`, `tests/p6_repin_ekon_f_m_era.rs`).

Jedyna wersja reguły produkcji: `domain/improvements.rs` — `territory_resource_yield_for_improvement` i
`resource_production_amount_for_era` (web `terrain-improvements.ts`, origin/main 247f1ef2a).

Po zmianie `git grep`/`grep -rn` w `rust-port/` (bez `target/`) nie znajduje żadnego z symboli starej rodziny
(poza niezwiązanym typem `TerritoryResourceYield` z `improvements.rs` / `turn_economy_resources.rs`).

## 2. Asercje zmienione (stara reguła -> wartości z webu)

Web: `resourceProductionAmountForEra` = `Math.round(base * 1.5^(era-1))`, era 2/3 normalizowana, reszta = era 1.
Bazy z `gra/data/terrain-improvements.json` (`surowiec_ilosc_tura`).

| Ulepszenie | baza | era 1 | era 2 | era 3 |
|---|---|---|---|---|
| tartak / kamieniolom / glinianka / warzelnia_soli | 50 | 50 | 75 | 113 |
| kopalnia_miedzi / _zelaza / _cyny | 20 | 20 | 30 | 45 |
| stadnina | 25 | 25 | 38 | 56 |
| kopalnia_zlota | 1 | 1 | 2 | 2 |

Weryfikacja: `node 22.22.0` na danych z `git archive origin/main gra/src gra/data` (skrypt poza repo, wyniki jak w tabeli).

Zmiany asercji:
- `tests/parity_suite.rs`: era 3, `tartak x2 + kamieniolom + glinianka`: drewno 900 -> **226**, kamien 450 -> **113**, glina 50 -> **113**, złoto 0 -> 0.
- `tests/resource_production.rs`: przepisany na `territory_resource_yield_for_improvement` / `resource_production_amount_for_era`:
  - stary wektor 200/300/450 (tartak/kamieniolom) -> 50/75/113;
  - stare stałe płaskie (glinianka 50, kopalnie 20, stadnina 25...) -> wartości bazowe z webu, skalowanie x1,5 na epokę dla **każdego** producenta (dawniej tylko tartak/kamieniolom);
  - stacking: drewno 226, kamień 113, glina 113, złoto brak;
  - era 0/4/99 i NaN -> era 1 (bezpieczne), zgodnie z webem.
- `benches/engine_modules.rs`: `stack_resource_production` -> lokalny `stack_territory_yield` na jednej regule; checksum przyjmuje sumę drewna jako `f64 as u64` (ta sama struktura obciążenia).

## 3. ZAŁOŻENIA (do akceptacji)

- Z1: **Angielskie aliasy** (`lumber_mill`, `quarry`) były obsługiwane tylko przez starą migawkę Rust. Web i kanoniczna
  `normalize_improvement_key` (`improvements.rs`) ich nie znają, więc asercja zmieniona z „akceptuje alias" na „zwraca `None`".
  To zmiana znaczenia testu, nie jego osłabienie; do akceptacji właściciela.
- Z2: Asercje na `ResourceKey::as_str()` (klucze danych) zastąpione literałami `"drewno"`, `"kamien"` itd. (ten sam kontrakt).
- Z3: Bench: rzutowanie `f64 -> u64` w checksumie (tylko do obserwacji, nie do wyniku).

## 4. Bramki

- `cargo fmt --check`: PASS.
- `cargo clippy --all-targets -- -D warnings`: PASS (exit 0, także po edycji komentarzy).
- `cargo test --test resource_production --test parity_suite`: 7/7 i 11/11 PASS.
- Pozostałe binarki `tests/*.rs` (300 plików, uruchamiane w partiach): 0 FAILED. Suma 1259 + 5 + 993 passed w partiach; jedyny `ignored` to pre-existing `e2e::dump_tick1_econ_for_web_generator` (obecny już na bazie; 0 nowych `#[ignore]`).
- `cargo test --lib --bins`: 22 passed, 0 failed.
- Strefa: `gra/**`, `WERSJE.md`, `Cargo.toml`, renderer, `src-tauri` nietknięte.

## 5. Poza allowlistą (zgłoszone, nie zmieniane)

- `rust-port/engine/src/domain/start_position.rs:694` — komentarz wspomina `resource_production::normalize_improvement_key` (tylko dokumentacja, nie symbol kodu).
