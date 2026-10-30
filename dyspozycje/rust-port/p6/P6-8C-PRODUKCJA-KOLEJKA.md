# P6.8C — kolejka produkcji miasta (production.ts 1253–1976)

Temat: `R-RUSTPORT-P6-8C-PRODUKCJA-KOLEJKA-Q1` (runda 1/5, Operator-impl).
Pin webu (referencja wektorów i numerów linii): **91dc998a**, `gra/src/game/production.ts`.
Kod: `rust-port/engine/src/domain/production_queue.rs` (nowy moduł, ~430 LOC).
Wektory: `rust-port/engine/tests/p6_8c_vectors/p8c.json` (2880 przypadków, generator
`dyspozycje/autobot/runs/R-RUSTPORT-P6-8C-PRODUKCJA-KOLEJKA-Q1/gen-p6-8c-vectors.mjs`).
Testy: `rust-port/engine/tests/p6_8c_vectors.rs` (13 testów: 3 wektorowe grupy + 10 jawnych progowych).

## Tabela symboli

| Symbol web (pin 91dc998a) | Linia web | Rust (`production_queue.rs`) | Status |
|---|---|---|---|
| `frontItem` | 1253 | `front_item` (:28) | ZROBIONE, wektor + test |
| `etaTurns` | 1268 | `eta_turns` (:33) | ZROBIONE, wektor (336) + test progowy NaN/0 |
| `buildingWorkPerTurn` | 1274 | `building_work_per_turn` (:43) | ZROBIONE, wektor (90) |
| `unitRecruitmentCapacityPerTurn` | 1282 | `unit_recruitment_capacity_per_turn` (:63) | ZROBIONE, wektor (90) + test min 1 |
| `enqueue` | 1318 | `enqueue` (:152) | ZROBIONE, wektor (400) |
| `forfeitedProgressForIndex` | 1366 | `forfeited_progress_for_index` (:91) | ZROBIONE, wektor (100) |
| `bankRemovedBuildingProgress` | 1397 | `bank_removed_building_progress` (:110) | ZROBIONE, wektor (400) + test nadpisania i `__proto__` |
| `withdrawBankedBuildingProgress` | 1420 | `withdraw_banked_building_progress` (:134) | ZROBIONE, wektor (24) + test konsumpcji |
| `sanitizeBuildQueue` | 1440 | `sanitize_build_queue` (:206) | ZROBIONE, wektor (10) + test zwrotu |
| `dropFrontItem` | 1508 | `drop_front_item` w `production_units.rs` (wspoldzielone, `pub(crate)`) | ZROBIONE (reuse, nie port duplikatu) |
| `dequeue` | 1564 | `dequeue` (:251) | ZROBIONE, wektor (400) + test |
| `filterQueue` | 1647 | `filter_queue` (:288) | ZROBIONE, wektor (70) (predykaty nazwane) |
| `promoteToFront` | 1745 | `promote_to_front` (:330) | ZROBIONE, wektor (100) |
| `insertAtFront` | 1826 | `insert_at_front` (:356) | ZROBIONE, wektor (400) |
| `advanceProduction` | 1899 | `advance_production` (:394) | ZROBIONE, wektor (450) + test progu i pauzy |

Zależności zamknięte: `drop_front_item`, `rush_production` (8B2), `CityProduction`/`ProductionItem`
(`production_units`), `js_max` (`civ_matrix::js_compat`). Nie portowano duplikatów.

## Założenia (ZALOZENIE, do weryfikacji przez Evaluatora)

1. **Pin, nie HEAD gry.** Port i wektory są z pinu 91dc998a (2541 linii). Bieżący
   `gra/src/game/production.ts` na `origin/rust-port/parity-v2` (2378 linii) NIE zawiera
   `buildingWorkPerTurn`, `unitRecruitmentCapacityPerTurn` ani parametru `buildingSpeedBonus`
   w `advanceProduction`. Te trzy elementy są w pinie. Rozbieżność zgłoszona w raporcie jako
   otwarty punkt dla orkiestratora (wymaga decyzji, który stan webu jest normatywny).
2. **`city` jako mapa.** Rust przyjmuje tylko pole `postepBudynkowUsuniete` zamiast całego
   `City`: `None` = argument nieobecny, `Some(&mut None)` = miasto bez mapy, `Some(&mut Some(m))`
   = mapa (`Some(pusta)` = web `{}`). Mapa powstaje dopiero przy realnym zapisie.
3. **Indeks jako `f64`.** Indeks całkowity w zakresie to pozycja. NaN, ułamek, ±Infinity i
   poza zakresem dają zachowanie webu dla `undefined` (kopia bez zmian / brak efektu).
4. **Klucz `__proto__`.** Zapis do mapy jest pomijany (web nie może przypisać liczby do
   własności `__proto__`). Odczyt kluczy prototypowych (`constructor`) daje 0, jak w `BTreeMap`.
5. **Porównania NaN.** Web `Math.max(1, NaN)` = NaN; Rust używa `js_max`, nie `f64::max`.
   Wektory porównują bity (`to_bits`), więc -0 i +0 są rozróżniane jak w `Object.is`.

## Bramki (runda 1)

- `cargo fmt --all -- --check`: EXIT=0
- `cargo clippy --all-targets -- -D warnings`: EXIT=0
- `cargo test --test p6_8c_vectors`: 13 passed, 0 failed
- `cargo test --no-fail-fast` (cały silnik): 1770 passed, 0 failed (baseline 1757 + 13 nowych)
- Mutacje: 12/12 WYKRYTYCH (`dyspozycje/autobot/runs/R-RUSTPORT-P6-8C-PRODUKCJA-KOLEJKA-Q1/dowody/mut-p6-8c-{a,b}.log`)

## Status

Kod, wektory i testy: GOTOWE na poziomie Operatora. Do Evaluatora/Obrony: niezależna
weryfikacja wektorów (ponowne uruchomienie generatora na pinie), przegląd założeń 1–5 i decyzja
w sprawie punktu 1 (pin vs HEAD).
