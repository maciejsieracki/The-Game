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
| C5 | `relief-preserving-improvements.ts`: `tartak` dodany do `PRESERVES_HILL_RELIEF_EXPLICIT_KEYS` (+ komentarze) | `gra/src/game/relief-preserving-improvements.ts:23` | brak portu predykatu w `rust-port/engine/src` (NIE_ZMIERZONO: grep `relief`/`PRESERVES` bez trafień w domenie) | — | NASTĘPNA-PARTIA (osobna partia wg dispatchu; zmiana behawioralna) |
| C6 | `population-growth-v85.ts`: era-mnożnik żywienia (`rationEraFoodCostMultiplier`), `growthPercentWithOrderMultiplier`, matrix-aware manpower, `ownerEra` w `computeCityRationCost` | `gra/src/game/population-growth-v85.ts:46–50, 216–220, 287–294, 445–447, 487–540, 584–590` | `rust-port/engine/src/domain/city_growth.rs` (istniejący port P6.7A) | — | NASTĘPNA-PARTIA (osobna partia; duży zakres behawioralny poza częścią C) |

## Wektory (zamknięcie M16 dla części C)

Generatory uruchomione na URUCHOMIONYM webie `91dc998a` (`git archive 91dc998a gra/src gra/data` do katalogu poza repo):

| Plik | Źródło | Zmiana | Rozmiar | Uwagi |
|---|---|---|---|---|
| `tests/p6_m16_vectors/qualifier.json` | `R-RUSTPORT-P6-M16-ULEPSZENIA-BUDOWA-REGULY-Q1/gen-m16-vectors.mjs` | 11551 liści `kosztPraca` (w `api.work_cost` / `qualifying`), reszta identyczna | 7 737 658 B (< 10 MB) | limit 10 MB zachowany bez redukcji reguły |
| `tests/p6_m16_vectors/rules.json` | j.w. | 40 wartości `work_cost_scale` + 22 `kosztPraca` w `meta` | 3 999 579 B | — |
| `tests/p6_m16_vectors/gallery.json` | j.w. | brak zmian (cmp identyczny) | 613 014 B | — |
| `tests/p6_23_vectors/improvements.json` | `R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1/gen-p623-vectors.mjs` | 280 przypadków `scaleTerrainImprovementWorkCost` | — | `meta.pin_web` ustawiony na `91dc998a` ręcznie (generator ma literal `edb8fb56`; generatora nie zmieniano — poza allowlistą) |
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
