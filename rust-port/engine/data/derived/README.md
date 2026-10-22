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

## Runda 4 (P3-19): wiersze 12-18, 25 oraz osie (b)

- `building-work-states.json`: Praca budynku (oś b): poziom x `pace` x `tryb` x zniżka cywilizacji (65 wierszy x 30 wartości).
  `tryb` = poziom trudności x gracz/AI (`normalny`, `latwy_gracz`, `latwy_ai`, `trudny_gracz`, `trudny_ai`).
- `unit-gold-states.json`: złoto zakupu jednostki (oś b): `pace` x `tryb` x zniżka rekrutacji (75 x 30).
- `building-gold-upkeep.json`: utrzymanie złota budynku per poziom (wiersz 12; 65 wierszy).
- `unit-food.json`: żywność wojska w setnych (wiersz 13): `stan` (ruch/obóz) x `terytorium` x `poziom_trudnosci` (75 x 12).
- `racje.json`: żywność na mieszkańca przy poziomie racji 0..6 co 0,5 (wiersz 14).
- `research-costs.json`: koszt badań (wiersz 15): `tempo` x `tryb` (32 x 15).
- `improvement-work.json`: Praca ulepszeń terenu (wiersze 16 i 25; 22 wiersze).
- `wonder-work.json`: Praca i żywność cudów (wiersz 17; 19 wierszy).
- `storage-caps.json`: limity magazynu per epoka x poziom trudności (wiersz 18). Liczba Magazynów
  jest wejściem jawnym funkcji, nie kolumną tabeli (P3-19 R4 §3).

Odczyt w domenie: `parse_*` i metody `lookup` w `src/data/derived.rs`. Silnik Rust nie ma dziś
stanów (b) (tempo kosztów, trudność, zniżka cywilizacji jako wejście gry), więc wiersze, dla których
Rust nie ma mechaniki (12-18, 25), są NIEUŻYWANE w silniku (P3-19 R4.6).
