# P6.M15 - Drogi: reguly ruchu (R-RUSTPORT-P6-M15-DROGI-RUCH-REGULY-Q1)

Pin weba: `edb8fb56`. Runda 1/5. Operator: Sonnet 5.5. Zrodlo: `git archive edb8fb56 gra/src gra/data` do wlasnego `mktemp -d`
poza repo.

## 1. Zakres i odczyt zrodel

| Plik web | Linie w pliku | Przeczytane | Zakres tematu |
|---|---|---|---|
| `gra/src/map/road-movement.ts` | 84 | 1-84 (calosc) | 1-84 |
| `gra/src/map/improvement-build.ts` | 1569 | 1550-1569 (zakres tematu + otoczenie) | 1559-1569 (reszta pliku = M16) |

## 2. Status kazdego symbolu

| # | Symbol web | Status | Rust | Dowod |
|---|---|---|---|---|
| 538 | `ROAD_MOVE_SPEED_MULT` (`road-movement.ts:14`) | PORTOWANY | `roads::road_move_speed_mult()` czyta tabele `data/derived/road-movement-multipliers.json` | `constants_match_web` (bity), `verify-m15-vectors.py` |
| 539 | `ROAD_BRUK_MOVE_SPEED_MULT` (`:29`) | PORTOWANY | `roads::road_bruk_move_speed_mult()` | j.w. |
| 540 | `ROAD_MIN_MOVE_COST` (`:32`) | PORTOWANY (stala martwa w webie: nieczytana przez `applyRoadMovementModifier`) | `roads::road_min_move_cost()` | j.w. |
| 541 | `ROAD_BRUK_MIN_MOVE_COST` (`:57`) | PORTOWANY | `roads::road_bruk_min_move_cost()` | j.w. |
| 542 | `isRoadImprovementKey` (`:59`) | PORTOWANY | `roads::is_road_improvement_key` (nazwy kluczy z `ruch-jednostek-params.json` `teren.ulepszenie_droga*`) | `is_road_key_matches_web` (21 kluczy, w tym wielkosc liter, spacje, klucze prototypu JS) |
| 543 | `hexHasRoad` (`:64`) | PORTOWANY | `roads::hex_has_road` (na `improvements::improvement_keys_for_hex`) | `has_road_matches_web` (326 heksow) |
| 544 | `applyRoadMovementModifier` (`:73`) | PORTOWANY | `roads::apply_road_movement_modifier(cost, &HexLike)`; kopia na `RuchHex` z P6.4 (`pathfinding::ruch_jednostek`) zgodna bitowo z tym samym wektorem | `apply_modifier_matches_web_bitwise` (11 410 wierszy, bity f64 vs web), `p64_ruch_modifier_agrees_with_roads_module` |
| 431 | `collectRoadKeys` (`improvement-build.ts:1560`) | PORTOWANY | `roads::collect_road_keys(&[(String, HexLike)])` - kolejnosc `Object.entries` (klucze-indeksy JS rosnaco, potem wstawianie; duplikat = ostatnia wartosc, pierwsza pozycja) | `collect_road_keys_matches_web_order` (121 map, w tym 4294967294/4294967295, `007`, `-3`) |
| 432 | `isRoadImprovementKey` re-eksport (`improvement-build.ts:1569`) | DANE-JUZ-W-RUST / NIE-DOTYCZY | re-eksport nie ma osobnej logiki; ten sam `roads::is_road_improvement_key` | wiersz 542 |

Wszystkie symbole zakresu maja status PORTOWANY (z wektorem z uruchomionego weba) - brak pozycji RUNDA-2. Typ `GameMap` (parametr
`collectRoadKeys`) jest reprezentowany przez uporzadkowane pary `(klucz, heks)`; `Hex` przez `improvements::HexLike`
(pola uzywane przez te funkcje: `ulepszenie`, `ulepszenia`).

## 3. Wektory i weryfikacja

* `dyspozycje/autobot/runs/R-RUSTPORT-P6-M15-DROGI-RUCH-REGULY-Q1/gen-m15-vectors.mjs` - uruchamia PRAWDZIWY `road-movement.ts`
  (loader ESM jak w M14, `node --experimental-transform-types`, zero stubow). `collectRoadKeys` wyciety WERBATIM z
  `improvement-build.ts:1559-1569` (plik nie laduje sie w Node: import `three`; zdjete tylko adnotacje typow i `export`),
  `hexHasRoad` podpiety z prawdziwego modulu. Wynik: `rust-port/engine/tests/p6_m15_vectors/*.json`.
* Liczby f64 w wektorach sa napisami (`String(v)` z JS); powod: `serde_json` bez `float_roundtrip` czyta liczby JSON z bledem
  1 ulp (wykryte przy `1e-9/3`); test parsuje napis przez `str::parse` (poprawnie zaokraglony).
* `verify-m15-vectors.py` (niezalezny, Python, bez Node/TS/Rust): stale wyciaga regexem z tekstu TS, klucze ulepszen z
  `gra/data/terrain-improvements.json` + `LEGACY_KEY_ALIASES`, wynik liczy sam: `checks=11887 rozbieznosci=0` (`verify-m15-r1.log`).
* Mutacje (`mutate-m15.py`): 15 mutantow, 14 wykrytych; 1 rownowazny (`Infinity` nie zwracane wprost: `inf/dzielnik = inf`
  i `max(podloga, inf) = inf`, wiec wynik identyczny - straznik jest tylko skrotem). Dowody: `mutation-evidence-r1.txt`,
  `mutation-evidence-r1b.txt` (ponowienie dwoch mutantow, ktore w pierwszym przebiegu wypadly jako "nie kompiluje sie" przez
  wyscig mtime przy szybkim przywroceniu pliku).

## 4. Dane (brak literalow)

Mnozniki/podlogi: `data/derived/road-movement-multipliers.json` (P3-23, bez zmian; M15 dodaje czytniki i wektorowy pin w
tescie z weba - wartosci NIE sa pinowane w kodzie testu). Nazwy kluczy drog: `ruch-jednostek-params.json`. Nowy kod
`roads.rs` nie ma literalow liczbowych poza `0`/`1` (`grep-literals-r1.txt`; test `roads_source_has_no_numeric_data_literals`).
Jedyny "stalo-jezykowy" element: granica indeksu tablicy JS `2^32 - 2` zapisana jako `u32::MAX - 1`. Nie dodano nic do
`data/derived.rs`.

## 5. Tabela bylo/jest i zmiany testow

| Obszar | Bylo | Jest |
|---|---|---|
| `domain/roads.rs` | pusty szkielet (naglowek `//!`) | 8 funkcji publicznych, naglowek `Temat wlasciciel:` zachowany |
| `tests/road_movement_multipliers.rs` | test ksztaltu tabeli (bez zmian) | bez zmian |
| Nowe testy | - | `tests/p6_m15_roads.rs`: 8 testow (stale, klucz, hex, modyfikator bitowo, zgodnosc z P6.4, kolejnosc kluczy, ksztalt tabeli, brak literalow) |
| Liczba testow silnika | 674 (baseline) | 682, 0 czerwonych |
| Zmiany istniejacych testow | - | ZADNE (`p6_m00_skeleton.rs` nietkniety; w pierwszym przebiegu naglowek `roads.rs` bez frazy `Temat wlasciciel:` powalil `skeleton_headers_name_full_owner_ids_from_table` - naprawione w kodzie, nie w tescie) |

## 6. Zaleznosci i uwagi

* `pathfinding.rs` (P6.4) ma wlasna, niezalezna kopie modyfikatora na `RuchHex`; poza allowlista - NIE edytowana. Obie sa
  zgodne bitowo z tym samym wektorem weba, wiec ewentualna konsolidacja (jedno zrodlo) jest zadaniem orkiestratora/Q2.
* `Hex.ulepszenie: unknown` (`String(hex.ulepszenie ?? 'brak')`) jest w Rust `Option<String>`; wartosci nietekstowe
  (liczba, obiekt) nie wystepuja w typie `Ulepszenie` weba.
* Bramki: `gate-fmt-r1.log`, `gate-clippy-r1.log`, `gate-test-r1.log` (kazdy z `EXIT=` na koncu).
