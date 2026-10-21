# Tabele wartości kosztów surowcowych (derived)

Źródło prawdy do ręcznego balansu kosztów surowcowych jednostek i budynków.
Liczby są jawne: zmieniasz konkretną wartość w JSON, a nie mnożnik.

Pliki:
- `unit-stock-costs.json`: 75 jednostek. Pola: `surowiec` (koszt rekrutacji, z `kon`),
  `utrzymanie_surowiec`, `baza` (pochodzenie wartości z `units.json`).
- `building-stock-costs.json`: 42 budynki. Pola: `koszt_surowce`,
  `utrzymanie_surowcowe_na_ture` (dane gotowe, NIEUŻYWANE w silniku, zob. P3-19 §9),
  `baza_koszt_surowce` (pochodzenie wartości z `buildings.json`).

Zasady:
- Silnik czyta te liczby przez `include_str!` (`src/data/derived.rs`) i nie mnoży
  niczego w czasie gry.
- Wartości startowe powstały jednorazowo (bootstrap) z danych bazowych `data/*.json`
  i reguł weba (pin `edb8fb56`). Generator i niezależne sprawdzenie:
  `dyspozycje/autobot/runs/R-RUSTPORT-P3-19-FLATTEN-MULTIPLIERS-Q1/`.
- Testy w `tests/derived_values.rs` sprawdzają KSZTAŁT i KOMPLETNOŚĆ (każda jednostka
  i budynek, znane klucze, wartości całkowite > 0), a nie zgodność ze wzorem.
  Zmiana liczby balansu nie wymaga zmiany testu, o ile kształt pozostaje poprawny.
- Nie edytuj plików bazowych `data/*.json` w celu zmiany kosztu surowcowego;
  edytuj tabelę tutaj.
