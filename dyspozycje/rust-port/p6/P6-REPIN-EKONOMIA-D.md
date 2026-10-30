# P6-REPIN-EKONOMIA-D — dossier tematu (krok 4b, część D)

**Temat:** `R-RUSTPORT-REPIN-EKONOMIA-D-Q1` · **Runda:** 1/5 · **Rola:** Operator-impl
**Baza:** `origin/rust-port/parity-v2` = `d961b14b4` (zawiera `84136f57` i `d961b14b`).
**Pin weba (cel):** `91dc998a5f1b51ad29e0f4785edfd45655445c53` · **Pin dotychczasowy:** `edb8fb56` (bez zmian w manifestach).

## Tabela: zmiana → web → Rust → test → status

| Zmiana (web, pin 91dc998a) | Plik:linia weba | Plik:linia Rust | Test / wektor | Status |
|---|---|---|---|---|
| `WorkTaxConversion` (typ wyniku) | `gra/src/game/work-tax.ts:2-6` | `rust-port/engine/src/domain/work_tax.rs` (`struct WorkTaxConversion`) | `parity_convert_work_pool_to_tax`, `parity_execute_manual_work_tax_conversion` | PORTOWANE |
| `taxForWorkAmount` | `work-tax.ts:8-12` | `work_tax.rs` `tax_for_work_amount` | `parity_tax_for_work_amount` (529 wektorów), `boundary_tax_floor_and_rate_defaults` | PORTOWANE |
| `ownerCanConvertWorkToTax` | `work-tax.ts:14-24` | `work_tax.rs` `owner_can_convert_work_to_tax` | `parity_owner_can_convert_work_to_tax` (90), `structural_can_convert_requires_human_and_targowisko` | PORTOWANE |
| `serializePendingWorkTax` | `work-tax.ts:26-28` | `work_tax.rs` `serialize_pending_work_tax` | `parity_serialize_pending_work_tax` (9), `structural_serialize_then_restore_roundtrip` | PORTOWANE |
| `restorePendingWorkTax` | `work-tax.ts:30-41` | `work_tax.rs` `restore_pending_work_tax` | `parity_restore_pending_work_tax` (20), `structural_restore_rejects_bad_rows_and_overwrites_in_place` | PORTOWANE |
| `convertWorkPoolToTax` | `work-tax.ts:43-58` | `work_tax.rs` `convert_work_pool_to_tax` | `parity_convert_work_pool_to_tax` (1600), `structural_work_not_spent_when_tax_rounds_to_zero`, `structural_disabled_or_empty_request_spends_nothing`, `boundary_pool_and_request_are_sanitized` | PORTOWANE |
| `executeManualWorkTaxConversion` | `work-tax.ts:60-77` | `work_tax.rs` `execute_manual_work_tax_conversion` + trait `WorkTaxDeps` | `parity_execute_manual_work_tax_conversion` (96, z kolejnoscia wywolan `set`/`tax`) | PORTOWANE |
| `gra/src/game/economy.ts` (diff 329 linii, `cityYieldPerTurn`, Mennica, praca→podatek) | `gra/src/game/economy.ts` (hunki NIE przeanalizowane w tej rundzie) | — | — | NASTĘPNA-PARTIA (krok 2 dispatchu po work-tax) |

Nowy plik `work-tax.ts` jest w całości nowy (status A w REPIN-DELTA §3, wiersz 65), więc każda linia jest zmianą behawioralną.

## Wektory

- `rust-port/engine/tests/p6_repin_d_work_tax_vectors/web-vectors.json` (≈317 KB, ≤10 MB).
- Generowane przez URUCHOMIENIE `work-tax.ts` z `git show 91dc998a:gra/src/game/work-tax.ts` pod `node 22 --experimental-strip-types` (generator poza repo, w katalogu scratchpad sesji). Wejścia: siatka liczb z brzegami (`-1, -0.5, 0, 0.4, 0.5, 0.99, 1, 1.5, 2, 2.9999, 3, 7, 10, 99.99, 100, 101, 1e6`, `NaN`, `±Infinity`, `null`, `undefined`, `'5'`), pule i zadania N-1/N/N+1 względem progów podatku, wszystkie kombinacje `enabled`, kolekcje zapisu z duplikatami i wierszami złej długości.
- Kodowanie: `NaN`/`±Infinity` jako tekst, `undefined`/`null`/`'5'` jako nie-liczba (w Rust = NaN; JS `Number.isFinite` zwraca false dla każdej nie-liczby, więc zachowanie jest równoważne).
- Dla walidacji rozbieżności: 0 (wszystkie 13 testów zielone).

## Założenia (luki rozstrzygnięte ZAŁOŻENIEM)

- Z-WT-1: liczby JS → `f64`; `Number.isFinite` → `f64::is_finite`; identyfikatory właściciela → `f64` (zachowuje odrzucanie NaN/Infinity bez zakładania typu w silniku).
- Z-WT-2: `restorePendingWorkTax(unknown)` → `serde_json::Value`; liczba = `Value::Number`, reszta nie-liczba.
- Z-WT-3: `Map<number, number>` → `Vec<(f64, f64)>` w kolejności wstawiania; duplikat klucza nadpisuje wartość na istniejącej pozycji (jak `Map.set`).
- Z-WT-4: `deps` → trait `WorkTaxDeps` (lustro kontraktu zywej gry; adapter gry nie jest częścią tej partii).
- Z-WT-5: w tej partii NIE podpinano funkcji do silnika (brak wywołań w `state`/`session`); integracja z turą to osobna partia po `economy.ts`, bo web `work-tax.ts` nie ma wywołań turowych (`No turn automation lives here`).

## Mutacje

- M1 (wykonana): `candidate_tax > 0.0` → `candidate_tax >= 0.0` w `convert_work_pool_to_tax`. Wynik: 3 testy padają (`structural_work_not_spent_when_tax_rounds_to_zero`, `parity_convert_work_pool_to_tax`, `parity_execute_manual_work_tax_conversion`). Zabite. Plik przywrócony z kopii, sprawdzony.
- M2..Mn: NIE_ZMIERZONO (pełna seria mutacji nie była w zakresie tej rundy; kolejne mutacje po partii `economy.ts`).

## Bramki (runda 1)

- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (po zamianie `map_or(false, …)` na `is_some_and`).
- `cargo test --no-fail-fast` (rust-port/engine): EXIT=0, suma 1551 passed / 0 failed. Nowe: `p6_repin_d_work_tax` 13/13. Dispatch podaje baseline 1272; rozbieżność liczebności NIE_ZMIERZONO (nie uruchomiono baseline na czystym `d961b14b4`).
- `git diff --check`: czysty.

## Kolejne partie (NASTĘPNA-PARTIA)

1. `economy.ts` hunk po hunku (329 linii diffu, `cityYieldPerTurn`, Mennica, praca→podatek). Wymaga wcześniejszego `git diff edb8fb56 91dc998a -- gra/src/game/economy.ts`, klasyfikacji zmian i ustalenia modułu Rust (kandydat: `domain/city_growth.rs` / nowy `economy_yield.rs`).
2. Wektory `economy` przeliczyć z weba 91dc998a (pliki ≤10 MB).
3. Mutacje na nowych gałęziach `economy.ts`.
4. Odświeżenie pinu / kopii bajtowych (poza tym tematem, REPIN-DELTA §6).
