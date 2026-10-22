# P6.M17 - Snapshot mapy do zapisu (port `gra/src/map/mapSnapshot.ts` do Rust)

Temat: `R-RUSTPORT-P6-M17-SNAPSHOT-MAPY-Q1` - DOMAIN: GAME - RUNDA 1/5 (Operator).
Pin web: `edb8fb56`. Baza Rust: `origin/rust-port/parity-v2` @ `faca762c` (674 testy).
Artefakty runu: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M17-SNAPSHOT-MAPY-Q1/`.

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
  (wlacznie z kolejnoscia `Object.keys`) i porownuje z wyjsciem weba: `checks=856 rozbieznosci=0` (`verify-m17-r1.log`).
  Zawiera 20 kotwic tekstowych zrodla (np. `if (hex.zloze)`, `!= null` dla `zlozeMinEra`, `=== 1`, listy pol `denseFields`/`sparseFields`).
- Rust: porownanie strukturalne JSON z liczbami BITOWO (`to_bits`) ORAZ bajt w bajt tekstu `serde_json::to_string` z
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
| :301 | `buildGameMapFromSnapshot` | PORTOWANY (+ `Result`, Z-M17-3) | `build_game_map_from_snapshot` | `rebuild_matches_web` (66: 54 ok + 12 bledy) |
| :323-342 | zastosowanie kolumn rzadkich + `widocznosc[playerId] = ...` | PORTOWANY | j.w. | wektory `widocznosc-kolejnosc-kluczy`, `rzadkie-nadpisanie`, `duplikat-wspolrzednych` |
| :344-351 | wynik `GameMap` (`riverPaths` bez kopii) | PORTOWANY (`clone`) | `SnapshotMap` | `rebuild_matches_web` |
| :365 | `isValidMapSnapshot` | PORTOWANY (na `serde_json::Value`, web: `unknown`) | `is_valid_map_snapshot` | `is_valid_matches_web_for_all_vectors` (665) |
| :376-393 | listy `denseFields` / `sparseFields` | PORTOWANY | stale tablice w `is_valid_map_snapshot` | j.w. + kotwica w weryfikatorze (lista z TEKSTU zrodla) |
| :395-401 | walidacja `widocznosc` (3 tablice rownej dlugosci) | PORTOWANY | j.w. | j.w. |
| types/hex.ts, types/map.ts | `Hex`, `GameMap`, enumy | NIE-DOTYCZY (poza zakresem; Z-M17-1/2) | lokalne `SnapshotHex`/`SnapshotMap`, pola tekstowe jako `String` | - |

RUNDA-2: brak elementow z zakresu M17.

## 3. Zalozenia i swiadome decyzje

- **Z-M17-1 (model)**: M01 (wlasciciel `MapHex`) biegnie rownolegle z rozlaczna allowlista, a `mapgen/types.rs` jest szkieletem.
  M17 definiuje lokalny `SnapshotHex`/`SnapshotMap` (te same pola co `Hex` weba + 4 pola dynamiczne). Adapter `From<MapHex>` doda integracja
  po M01 (nie zmienia formatu snapshotu).
- **Z-M17-2**: `terenBazowy`/`nakladka`/`ulepszenie`/`widocznosc` jako `String` - web nie waliduje wartosci, snapshot ich nie interpretuje.
- **Z-M17-3 (jedyne odstepstwo zachowania)**: dla niepoprawnych indeksow web po cichu daje `undefined` (indeks `dict` poza zakresem; w `widocznosc`
  powstaje nawet klucz `"undefined"`) albo rzuca `TypeError` (indeks heksa poza zakresem, za krotka kolumna). Rust zwraca `MapSnapshotError`
  (`DictIndex`/`HexIndex`/`ColumnLength`). Wektory z weba dokumentuja te przypadki (`outcome: undefined|throws`, 12 przypadkow), test wymaga `Err`.
  Dla poprawnych indeksow wynik jest 1:1. `isValidMapSnapshot` celowo tego nie sprawdza (jak w webie).
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
- **Dla P6.20** (`save_load.rs`): wolac `serialize_map_for_save` / `build_game_map_from_snapshot` / `is_valid_map_snapshot`; format JSON jest bajtowo zgodny z webem (`fmt: 2`).

## 4. Testy: bylo / jest

| | przed (`faca762c`) | po |
|---|---|---|
| liczba testow `cargo test` | 674 | 685 (685 zielonych, 0 czerwonych) |
| nowe pliki testow | - | `p6_m17_serialize.rs` (5), `p6_m17_rebuild.rs` (4), `p6_m17_validate.rs` (2) = 11 |
| zmienione testy istniejace | - | 0 (zadnego nie edytowano ani nie oslabiono; `p6_m00_skeleton.rs` i `domain/mod.rs` nietkniete, naglowek `//!` z pelnym ID wlasciciela zachowany) |

Gate (surowe pelne logi z `EXIT=`): `gate-fmt-r1.log` (EXIT=0), `gate-clippy-r1.log` (`--all-targets -D warnings`, EXIT=0), `gate-test-r1.log` (`cargo test --no-fail-fast`, EXIT=0).
Weryfikator: `verify-m17-r1.log` (`checks=856 rozbieznosci=0`, EXIT=0). Generator: `gen-m17-r1.log`.

Mutacje (`mutate-m17.py`, `mutation-evidence-r1.txt` + `mutation-evidence-r1b.txt`): 34 mutanty, 34 wykryte. W pierwszym przebiegu przezyl `valid: n >= 0`
(brak wektora o ksztalcie poprawnym i `n = 0`); dodano wektory `empty-columns-n0` i `single-hex-n1` i mutant jest wykrywany (`r1b`). Pierwszy przebieg
(`r1`) zakonczyl sie `EXIT=1` wylacznie z powodu tego jednego mutanta; pozostale 33 wykryte w `r1`.

## 5. Uwagi dla orkiestratora

- `Cargo.lock` powstaje lokalnie (brak w repo) - NIE jest commitowany.
- Wektory ~1,5 MB (porownywalnie z `p6_m14_vectors`); najwiekszy plik `validate.json` (mutacje pelnych snapshotow).
- Uczciwa uwaga o przebiegu mutacji: pierwszy start `mutate-m17.py` zostal zabity przez limit czasu tla (plik zostal zmutowany mutantem
  `serialize: riverPaths pominiete`); stan przywrocono recznie i potwierdzono `cmp` z kopia wzorcowa oraz zielonymi testami, po czym uruchomiono pelny przebieg od nowa
  (`mutation-evidence-r1.txt`).
