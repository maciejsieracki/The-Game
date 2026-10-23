# P6.M17 - Snapshot mapy do zapisu (port `gra/src/map/mapSnapshot.ts` do Rust)

Temat: `R-RUSTPORT-P6-M17-SNAPSHOT-MAPY-Q1` - DOMAIN: GAME - RUNDA 2/5 (Operator, obrona zarzutow Evaluatora r1; sekcje 0 i 6 sa nowe, reszta zaktualizowana).
Pin web: `edb8fb56`. Baza Rust: `origin/rust-port/parity-v2` @ `faca762c` (674 testy).
Artefakty runu: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M17-SNAPSHOT-MAPY-Q1/`.

## 0. Odczyty obowiazkowe (RUNDA 2, zarzut 1) - co przeczytano i co z tego wynika

Zrodlo dokumentow: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<sciezka>` (kopie robocze poza repo). W rundzie 1 odczyty nie byly cytowane; ponizej wynik z numerami linii.

- **P6-25-MAPA-GAP.md** (1088 linii): §4 wiersze M17 = linie 565-570 (`SparseColumn` :87, `SparseWidocznosc` :97, `SerializedMapData` :111, `serializeMapForSave` :204,
  `buildGameMapFromSnapshot` :301, `isValidMapSnapshot` :365; wszystkie `BRAK`, temat M17; w kolumnie uwag: "Rust: `save_load.rs` (inny format, bez mapy hexow)").
  §6 wiersz tematu = linia 764 (`mapSnapshot.ts`:1-404, allowlista `map_snapshot.rs`/`tests/p6_m17_*`/`tests/p6_m17_vectors/**`, zaleznosc M00, "PRZED P6.20"),
  opis tematu = linia 793 ("format spojny z `SaveSnapshot` (`save_load.rs:79`)"), kolejnosc = linia 863 ("M17 przed P6.20; rozlaczne sciezki"), wiersze P6.20/P6.21 = linie 820-821.
  §9 zalozenia Z1-Z7 (linie 1042-1050): **Z1** kod generatora w `domain/mapgen/`, M17 poza tym (moj kod w `domain/map_snapshot.rs`) - zgodne; **Z2** model `MapHex` z `types/hex.ts`
  (M00 musi go przeczytac) - patrz Z-M17-1; **Z3** rzeki 1:1 (M07) - nie dotyczy M17 (M17 kopiuje `riverPaths`, nie generuje); **Z4** silnik synchroniczny, worker/async NIE portowane -
  zgodne (M17 jest czysta funkcja, bez `await`); **Z5** promien terytorium od wywolujacego - NIE-DOTYCZY; **Z6** rownosc na poziomie hexa dla `maps.json` to kryterium M18 - M17 daje wektory per funkcja;
  **Z7** kolizje §6b liczone wzgledem propozycji P6.0 - M17 ma wlasne pliki, kolizji brak (§6 linia 892 "M00 x M17: `domain/map_snapshot.rs`, sekwencyjnie").
- **P6-0-GAP-ANALYSIS.md** (435 linii): §0 (metoda: wiersze mapowania web->Rust sa RECZNE; `PORTOWANE-1:1` tylko z dowodem), §3 wiersze zapisu: `save.ts` (wiersz 149, 1040 LOC, `CZESCIOWO (heur., domena)`, P6.20),
  `load-map-source.ts` (wiersz 116, 55 LOC, `BRAK (heur.)`, P6.21), `idb-storage.ts`/`fsa-autosave.ts` (NIE-DOTYCZY: backend przegladarkowy); §5: `mapSnapshot` nie jest tam wymieniony (0 trafien w §5) - jest wylacznie w P6-25;
  §6b: P6.20 = `R-RUSTPORT-P6-20-SAVE` (`domain/save_load.rs`, 3 pliki web, 1852 LOC), P6.21 = `R-RUSTPORT-P6-21-LOAD` (55 LOC), sekwencyjnie po P6.20.
- **P3-22-FLATTEN-STAGE2.md**, **P2-3-ENTITY-IDS.md**, **P2-5-COMMANDS.md**, **PLAN-PORT-RUST-TAURI-20261020.md** §P6 (linie 197-212), **LEDGER.md**: `grep -in 'mapSnapshot|serializeMap'` = 0 trafien w P2-3, P2-5, P3-22, PLAN;
  w LEDGER 2 trafienia: wiersz P2-11 (linia 83: "odrzucenie zamiast ryzykownej regeneracji mapy przy braku `mapSnapshot`, bo generator Rust niepotwierdzony") i wiersz M00 (linia 183: puste moduly M14-M17).
  Z P3-22 wzieto wzorzec: generator weba + niezalezny weryfikator (`gen-*.mjs`/`verify-*.py`) i dowody w katalogu runu. Z PLAN §P6: M17 nie ma wlasnego punktu P6.x - to pod-zadanie przed P6.20 (zapis) i P6.21 (wczytanie).
- **P6-M14-TERYTORIUM-ZASIEG-CUDA.md** (147 linii): wzorzec dokumentu (metoda, tabela symboli, swiadome decyzje, bylo/jest, blokady poza allowlista) - uzyty jako szablon tego dokumentu.
- **Web** (pin `edb8fb56`, `git archive` do scratch): `game/save.ts:455` (`mapSnapshot?: SerializedMapData` - OPCJONALNE pole zapisu), `save.ts:733` (`isValidMapSnapshot(obj2.mapSnapshot) ? ... : undefined`),
  `game/load-map-source.ts:20-50` (poprawny snapshot -> `buildGameMapFromSnapshot`; ksztalt niepoprawny/brak -> regeneracja z `seed`; ksztalt poprawny, ale `build` rzuca -> TWARDY BLAD, decyzja wlasciciela N1 2026-08-11).

### Rozstrzygniecie `save_load.rs:79` (zarzut 1)

- Rust `SaveSnapshot` (`domain/save_load.rs:79`) = `{ version: u16 (CURRENT_SNAPSHOT_VERSION = 2, :34), state: GameStateDto, event_queue, rng }`; `GameStateDto.map` to `MapDto { width: u16, height: u16, tiles: Vec<TileDto{position, terrain}> }`
  (`domain/types.rs:153,174`) - **bez** rzek, zlozy, ulepszen, wlascicieli, wiosek, widocznosci i bez kolumn rzadkich.
  Czyli format M17 (`SerializedMapData`, `fmt: 2`) **nie jest** podtypem `SaveSnapshot` i nie moze byc bajtowo "spojny" z nim; liczba `2` w obu miejscach to zbieg okolicznosci (osobne liczniki wersji: `mapSnapshot.ts` `fmt` vs `CURRENT_SNAPSHOT_VERSION`).
- Zgodnie z webem (`save.ts:455`) snapshot mapy jest **osobnym, opcjonalnym polem** obok reszty zapisu. **ZALOZENIE Z-M17-7**: P6.20 dolacza `SerializedMapData` jako osobne pole (np. `Option<SerializedMapData>`) do zapisu
  (z decyzja o podbiciu wersji `SaveSnapshot` po stronie P6.20) i NIE zastepuje nim `GameStateDto.map`; M17 nie edytuje `save_load.rs` (poza allowlista). Wczesniejsze zdanie "format bajtowo zgodny z webem" odnosi sie
  WYLACZNIE do `SerializedMapData` vs `serializeMapForSave` weba, nie do `SaveSnapshot`.
- Konsekwencja dla P6.20/P6.21: `is_valid_map_snapshot` (ksztalt) -> `build_game_map_from_snapshot` (`Err` = odpowiednik `throw` weba = TWARDY BLAD wczytania, nie fallback; patrz Z-M17-3). Brak snapshotu / zly ksztalt = regeneracja z `seed` (zalezy od M18).

## 1. Metoda (anty-halucynacja)

- Zrodlo web przeczytane w CALOSCI: `gra/src/map/mapSnapshot.ts` = 404 linie (`git archive edb8fb56 gra/src gra/data`
  do `mktemp`/scratch poza repo; `wc -l` = 404, kotwica liczby linii w `verify-m17-vectors.py`). Zaleznosci to tylko
  `import type` (`types/map.ts`, `types/hex.ts` - przeczytane), wiec plik laduje sie pod Node 22.22.0
  `--experimental-transform-types` BEZ stubow i loaderow.
- Web URUCHOMIONY: `gen-m17-vectors.mjs` wola prawdziwe `serializeMapForSave`, `buildGameMapFromSnapshot`,
  `isValidMapSnapshot` (import werbatim z git archive) i zapisuje wejscia + wyjscia do
  `rust-port/engine/tests/p6_m17_vectors/{serialize,rebuild,validate}.json` (Mulberry32 o stalym ziarnie; `JSON.stringify`
  weba zapisany jako tekst `text`; NaN/Infinity/-0 w wejsciach jako stringi). Log: `gen-m17-r1.log`
  (`serialize=49 rebuild=66 validate=665`).
- NIEZALEZNY weryfikator: `verify-m17-vectors.py` (Python `-I`, bez Node/TS/Rust) liczy semantyke od nowa z TEKSTU zrodla
  (wlacznie z kolejnoscia `Object.keys`) i porownuje z wyjsciem weba: `checks=856 rozbieznosci=0` (`verify-m17-r1.log`); po rundzie 2: `checks=905 rozbieznosci=0` (`verify-m17-r2.log`, +49 walidacji snapshotow z serialize).
  Zawiera 20 kotwic tekstowych zrodla (np. `if (hex.zloze)`, `!= null` dla `zlozeMinEra`, `=== 1`, listy pol `denseFields`/`sparseFields`).
- Rust: porownanie strukturalne JSON z liczbami BITOWO (`to_bits`; jedyny wyjatek: +0 == -0, bo `JSON.stringify(-0)` daje `"0"` - wektor `liczby-egzotyczne` ma `seed: -0`; patrz `json_eq` w `common.rs`) ORAZ bajt w bajt tekstu `serde_json::to_string` z
  `JSON.stringify` weba (49 - 1 = 48 przypadkow `textExact`).

## 2. Tabela symboli

| Plik:linia (web) | Symbol | Status | Rust | Test |
|---|---|---|---|---|
| mapSnapshot.ts:71 | `HexExt` (typ pomocniczy) | PORTOWANY (pola dynamiczne w modelu) | `SnapshotHex.{zloze,zloze_min_era,ulepszenia,improvement_key}: Option<_>` | wektory `serialize.json` (falsy-pola, random-*) |
| :87 | `SparseColumn<T>` | PORTOWANY | `SparseColumn<T>{hex_idx,val}` (serde `hexIdx`) | `snapshot_shape_invariants_hold_for_every_vector`, `serialize_matches_web_structurally` |
| :92 | `emptySparse` (nieeksp.) | PORTOWANY | prywatna `SparseColumn::empty` | j.w. |
| :97 | `SparseWidocznosc` | PORTOWANY | `SparseWidocznosc` | j.w. |
| :111 | `SerializedMapData` | PORTOWANY (kolejnosc pol == kolejnosc kluczy literalu weba) | `SerializedMapData` | `serialize_text_is_byte_identical_to_web_json_stringify` (48) |
| :204 | `serializeMapForSave` (w tym `intern`, :207) | PORTOWANY | `serialize_map_for_save`, prywatny `Interner` | `serialize_matches_web_structurally` (49), `serialize_text_...` (48) |
| :248-251 | galaz `rzeka.krawedzie` niepuste | PORTOWANY | j.w. | `serialize_vectors_touch_every_branch` + mutacje |
| :252-267 | galezie `zloze`/`zlozeMinEra != null`/`ulepszenia` (truthy)/`improvementKey` | PORTOWANY (falsy-pola: `''`, `0`, `[]`) | j.w. | wektor `falsy-pola` + mutacje |
| :268-274 | `widocznosc` przez `Object.keys` | PORTOWANY (z kolejnoscia JS) | `JsKeyedMap::entries` | `hex_from_json` asercja kolejnosci na kazdym wektorze |
| :290-291 | kopia `riverPaths`/`riverPathKinds` (`?? []`) | PORTOWANY (`?? []` = pusty `Vec` po stronie wywolujacego; kopia = `clone`) | `river_paths.clone()` | `riverPaths-undefined`, `base-3x3` |
| :301 | `buildGameMapFromSnapshot` | PORTOWANY 1:1 dla poprawnych indeksow (54 wektory ok, wartosc po wartosci); ODSTEPSTWO Z-M17-3 dla niepoprawnych (12 wektorow: web `undefined` x8 / `throw` x4 -> Rust `Err` z klasa bledu zgodna z webem, NIE 1:1) | `build_game_map_from_snapshot` | `rebuild_matches_web` (54 ok + 12 Err), `rebuild_error_class_matches_web_failure_class` (12, wariant+pole z `undefinedPaths` weba) |
| :323-342 | zastosowanie kolumn rzadkich + `widocznosc[playerId] = ...` | PORTOWANY | j.w. | wektory `widocznosc-kolejnosc-kluczy`, `rzadkie-nadpisanie`, `duplikat-wspolrzednych` |
| :344-351 | wynik `GameMap` (`riverPaths` bez kopii) | PORTOWANY (`clone`) | `SnapshotMap` | `rebuild_matches_web` |
| :365 | `isValidMapSnapshot` | PORTOWANY (na `serde_json::Value`, web: `unknown`) | `is_valid_map_snapshot` | `is_valid_matches_web_for_all_vectors` (714 = 665 + 49 snapshotow z webowego `serializeMapForSave`), `every_serialize_vector_snapshot_has_a_web_validity_vector` |
| :376-393 | listy `denseFields` / `sparseFields` | PORTOWANY | stale tablice w `is_valid_map_snapshot` | j.w. + kotwica w weryfikatorze (lista z TEKSTU zrodla) |
| :395-401 | walidacja `widocznosc` (3 tablice rownej dlugosci) | PORTOWANY | j.w. | j.w. |
| types/hex.ts, types/map.ts | `Hex`, `GameMap`, enumy | NIE-DOTYCZY (poza zakresem; Z-M17-1/2) | lokalne `SnapshotHex`/`SnapshotMap`, pola tekstowe jako `String` | - |

RUNDA-2 (zakres funkcjonalny): brak elementow z zakresu M17 poza pozycja "odstepstwo Z-M17-3" (decyzja orkiestratora, §6 zarzut 2).

## 3. Zalozenia i swiadome decyzje

- **Z-M17-1 (model)**: M01 (wlasciciel `MapHex`) biegnie rownolegle z rozlaczna allowlista, a `mapgen/types.rs` jest szkieletem.
  M17 definiuje lokalny `SnapshotHex`/`SnapshotMap` (te same pola co `Hex` weba + 4 pola dynamiczne). Adapter `From<MapHex>` doda integracja
  po M01 (nie zmienia formatu snapshotu).
- **Z-M17-2**: `terenBazowy`/`nakladka`/`ulepszenie`/`widocznosc` jako `String` - web nie waliduje wartosci, snapshot ich nie interpretuje.
- **Z-M17-3 (jedyne odstepstwo zachowania)**: dla niepoprawnych indeksow web po cichu daje `undefined` (indeks `dict` poza zakresem; w `widocznosc`
  powstaje nawet klucz `"undefined"`) albo rzuca `TypeError` (indeks heksa poza zakresem, za krotka kolumna). Rust zwraca `MapSnapshotError`
  (`DictIndex`/`HexIndex`/`ColumnLength`). Wektory z weba dokumentuja te przypadki (`outcome: undefined|throws`, 12 przypadkow), test wymaga `Err`.
  Dla poprawnych indeksow wynik jest 1:1. `isValidMapSnapshot` celowo tego nie sprawdza (jak w webie).
  Uzasadnienie (runda 2): 4 przypadki `throw` weba -> `Err` to odpowiednik 1:1 (web: `load-map-source.ts:30-40` traktuje `throw` z `build` jako TWARDY BLAD wczytania). 8 przypadkow `undefined` to w webie
  NIEUMYSLNY wyciek `undefined` do pol mapy (np. klucz `"undefined"` w `widocznosc`) dopiero w dalszym kodzie; port do `Err` jest bezpieczniejszy. Jesli orkiestrator woli 1:1 (sentinel zamiast `Err`), to RUNDA-3 (pole `Option<String>` w modelu).
- **Z-M17-4**: `q`/`r`/krawedzie rzek to `i32` (wspolrzedne siatki sa calkowite w calej grze). `szerokoscQ`/`wysokoscR`/`seed`/`ludnosc`/`zlozeMinEra` to `f64` (`JsNum`).
- **Z-M17-5 (kolejnosc kluczy JS)**: `Object.keys` porzadkuje klucze-indeksy tablicy (kanoniczne liczby 0..2^32-2) rosnaco przed pozostalymi; wpływa to na kolejnosc
  internowania w `dict`, wiec `widocznosc` jest `JsKeyedMap` (test niezalezny od weba + 3 mutacje reguly + wektory z kluczami `"007"`, `"4294967294"`, `"4294967295"`, `"-1"`, `"1.5"`).
- **Z-M17-6 (liczby)**: `JsNum` zapisuje calkowite bez `.0` (jak `JSON.stringify`), nie-skonczone jako `null`. Zgodnosc TEKSTU potwierdzona w zakresie |x| < 1e15;
  liczby egzotyczne (`NaN`, `1e21`, `-1e-7`, `-0`) maja osobny wektor porownywany strukturalnie (`textExact=false`), bez zapisu -> odczytu (null nie wraca do `f64`).
- **Powtorzony klucz `"q,r"` przy odbudowie**: pozycja pierwszego wystapienia, wartosc ostatniego, kolumny rzadkie na osieroconym (nadpisanym) heksie ginely tak jak w webie
  (wektor `duplikat-wspolrzednych`).
- **Stale formatu** (nie balansowe, bez wydzielania do `data/derived`): `SNAPSHOT_FMT = 2`, `NO_OWNER_IDX = -1`, `MAX_ARRAY_INDEX = 2^32-2` (regula JS), progi `1e15` zapisu liczb.
  Brak liczb ani mnoznikow balansowych w module (`grep-literals-r1.txt`). Nie dodano nic do `data/derived.rs` / `data/derived/*.json`.
- **NIE-DOTYCZY**: izolacja od mutacji zrodla w oknie `await` (komentarz weba o Defekcie B) - w Rust wynik `serialize_map_for_save` jest posiadany (kopie), a wejscie pozyczane
  niemutowalnie; nie ma okna wspoldzielenia.
- **Dla P6.20** (`save_load.rs`): wolac `serialize_map_for_save` / `build_game_map_from_snapshot` / `is_valid_map_snapshot`; JSON `SerializedMapData` jest zgodny z webem (`fmt: 2`), ale jest to osobne pole zapisu, nie `SaveSnapshot` (Z-M17-7, sekcja 0).

## 4. Testy: bylo / jest

| | przed (`faca762c`) | po |
|---|---|---|
| liczba testow `cargo test` | 674 | 686 (686 zielonych, 0 czerwonych; r1: 685) |
| nowe pliki testow | - | `p6_m17_serialize.rs` (5), `p6_m17_rebuild.rs` (5; r2: +`rebuild_error_class_matches_web_failure_class`), `p6_m17_validate.rs` (2; r2: drugi test zastapiony) = 12 |
| zmienione testy istniejace | - | 0 (zadnego nie edytowano ani nie oslabiono; `p6_m00_skeleton.rs` i `domain/mod.rs` nietkniete, naglowek `//!` z pelnym ID wlasciciela zachowany) |

Gate (surowe pelne logi z `EXIT=`): `gate-fmt-r1.log` (EXIT=0), `gate-clippy-r1.log` (`--all-targets -D warnings`, EXIT=0), `gate-test-r1.log` (`cargo test --no-fail-fast`, EXIT=0).
Weryfikator: `verify-m17-r1.log` (`checks=856 rozbieznosci=0`, EXIT=0). Generator: `gen-m17-r1.log`.

Gate RUNDY 2 (surowe, pelne): `gate-fmt-r2.log` (EXIT=0), `gate-clippy-r2.log` (EXIT=0), `gate-test-r2.log` (EXIT=0; 686 passed, 0 failed, 86 blokow wynikow), `gen-m17-r2.log` (`serialize=49 rebuild=66 validate=714`), `verify-m17-r2.log` (`checks=905 rozbieznosci=0`).
`serialize.json` i `rebuild.json` po regeneracji sa bajt-identyczne z r1 (`cmp`); `validate.json` ma +49 wektorow na koncu (`serialize:<label>`).

Mutacje - JEDEN pelny przebieg (`mutate-m17.py`, `mutation-evidence-r2.txt`): **35 mutantow, 35 wykrytych, 0 przezylo, EXIT=0** (34 z r1 + 1 nowy: klasa bledu `DictIndex`->`ColumnLength`, wykrywany przez
`rebuild_error_class_matches_web_failure_class`). Przebieg dokonczony bez przerwania; plik zrodlowy po przebiegu zgodny z kopia wzorcowa (`cmp`). Dowody r1/r1b zostaja jako historia.

## 5. Uwagi dla orkiestratora

- `Cargo.lock` powstaje lokalnie (brak w repo) - NIE jest commitowany.
- Wektory ~1,5 MB (porownywalnie z `p6_m14_vectors`); najwiekszy plik `validate.json` (mutacje pelnych snapshotow).
- Uczciwa uwaga o przebiegu mutacji: pierwszy start `mutate-m17.py` zostal zabity przez limit czasu tla (plik zostal zmutowany mutantem
  `serialize: riverPaths pominiete`); stan przywrocono recznie i potwierdzono `cmp` z kopia wzorcowa oraz zielonymi testami, po czym uruchomiono pelny przebieg od nowa
  (`mutation-evidence-r1.txt`).

## 6. RUNDA 2 - odpowiedzi na zarzuty Evaluatora (ten sam ID)

| # | Zarzut | Odpowiedz | Dowod |
|---|---|---|---|
| 1 | Brak dowodu obowiazkowych odczytow; `save_load.rs:79` nierozstrzygniete | PRZYJMUJE. Dodano §0 (odczyty z numerami linii P6-25 §4/§6/§9 Z1-Z7, P6-0 §0/§3/§5/§6b, P3-22, P2-3, P2-5, PLAN §P6, LEDGER, M14). Rozstrzygniecie: `SaveSnapshot`/`MapDto` to inny, uboszy format; snapshot mapy jest OSOBNYM opcjonalnym polem zapisu (web `save.ts:455`), Z-M17-7; sformulowanie "spojny z SaveSnapshot" z P6-25 :793 skorygowane. | §0, Z-M17-7 |
| 2 | Status "1:1" zawyzony dla odbudowy (12 wektorow tylko `is_err()`) | PRZYJMUJE W CZESCI: tabela §2 rozdziela "1:1 dla poprawnych indeksow (54)" od "odstepstwo Z-M17-3 (12)"; test sprawdza teraz wariant+pole bledu wyprowadzone ze sciezek `undefinedPaths` weba (nie tylko `is_err`), +1 mutant. Czy akceptowac `Err` zamiast 1:1 - decyzja orkiestratora; argumenty w Z-M17-3 (web `load-map-source.ts:30-40`: `throw` z `build` = twardy blad, wiec `Err` jest 1:1 dla 4 przypadkow `throw`). Nie portuje `undefined` bez decyzji. | `rebuild_error_class_matches_web_failure_class`, mutant 35 |
| 3 | Test `snapshots_from_serialize_vectors...` ma reczna regule, pusta asercja | PRZYJMUJE. Generator dopisuje 49 wektorow `serialize:<label>` z wynikiem WEBOWEGO `isValidMapSnapshot` (na snapshotach z webowego `serializeMapForSave`); test zastapiony `every_serialize_vector_snapshot_has_a_web_validity_vector` (wejscie == `serialize.json`, oczekiwanie z weba, brak recznej reguly). Weryfikator Python: 905 checks, 0 rozbieznosci. | `gen-m17-r2.log`, `verify-m17-r2.log` |
| 4 | Mutacje nie z jednego przebiegu 34/34 | PRZYJMUJE. Jeden pelny przebieg: 35/35, EXIT=0. | `mutation-evidence-r2.txt` |
| 5 | "Bitowo" a `json_eq` akceptuje +-0 | PRZYJMUJE (opis). Doc i komentarz w `common.rs` mowia: bitowo z JEDYNYM wyjatkiem +0 == -0 (JSON.stringify(-0) = "0"). Kod bez zmian (wplyw zerowy). | §1, `common.rs` |
| 6 | `js_num` pinuje wartosci formatu | ODRZUCAM jako zarzut: to format JSON (3 -> "3"), nie dane gry; Evaluator sam uznal za akceptowalne. Bez zmian. | `grep-literals-r1.txt` |

Zmiany testow (r2): `p6_m17_validate.rs` - 1 test zastapiony (wyzsze wymagania: oczekiwanie z weba); `p6_m17_rebuild.rs` +1 test; zadnego testu nie oslabiono. Zero zmian w `map_snapshot.rs`.
