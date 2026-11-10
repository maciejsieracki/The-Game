# P3-5C — DATA BUILDINGS/WONDERS/TECH (Rust serde + include_str!)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-5C-DATA-BUILDINGS-TECH-Q1
GOAL: Przenieść 1:1 dane z `gra/data/buildings.json`, `wonders.json`, `tech.json` do struktur Rust
z `serde::Deserialize`, embedded przez `include_str!`, parsowane w teście jednostkowym.
BAZA: `origin/rust-port/parity-v2` = `9e33fc77` (worktree zresetowany do tego commita).
PIN DANYCH: `gra/data/*.json` na `edb8fb56`. Te 3 pliki są identyczne na `edb8fb56` i `9e33fc77`
(`git diff --stat edb8fb56 9e33fc77 -- gra/data` zmienia tylko `civ-matrix.json`, `civs.json`, `units.json`).

## 1. Zmiany (allowlista)

| Ścieżka | Status | Opis |
|---|---|---|
| `rust-port/engine/data/buildings.json` | NOWY | kopia 1:1 z `gra/data/buildings.json` (`cmp` OK) |
| `rust-port/engine/data/wonders.json` | NOWY | kopia 1:1 z `gra/data/wonders.json` (`cmp` OK) |
| `rust-port/engine/data/tech.json` | NOWY | kopia 1:1 z `gra/data/tech.json` (`cmp` OK) |
| `rust-port/engine/src/data/buildings_tech.rs` | NOWY | struktury `#[derive(Deserialize)]`, `include_str!`, `parse_*()` |
| `rust-port/engine/tests/data_buildings_tech.rs` | NOWY | test z `#[path = "../src/data/buildings_tech.rs"]` |
| `dyspozycje/rust-port/p3/P3-5C-DATA-BUILDINGS-TECH.md` | NOWY | ten dokument |
| `dyspozycje/autobot/runs/R-RUSTPORT-P3-5C-DATA-BUILDINGS-TECH-Q1/01-operator.md` | NOWY | raport Operatora |

Nie zmieniono: `rust-port/engine/src/lib.rs`, `src/domain/mod.rs`, `src/domain/building_costs.rs`,
`rust-port/engine/Cargo.toml`, żadnego istniejącego pliku `.rs`, `gra/**`.

SHA sha256 kopii (identyczne z `gra/data`):
```
9ccfd4d0e5ea0488c83d3d5a4e22a3fb300a80647424531cee1ec25ea54b9703  rust-port/engine/data/buildings.json
4476a0229029e82ffc548a3022433ea68cac44a012044255632d1a815179f9d8  rust-port/engine/data/wonders.json
d22e1e753311276775244aa2355f1d65d1eea7e606c8536ce8baf6005e087278  rust-port/engine/data/tech.json
```

## 2. Kształt danych (z faktycznej zawartości, analiza `json.load` + zliczenie kluczy)

**buildings.json** — tablica 42 obiektów. Stałe klucze (42/42): `id`, `dajeSzczescie`, `nazwa`,
`kategoria`, `grupa`, `epokaWejscia`, `maksPoziom`, `nazwyPoziomow`, `baza`, `przyrost`, `kosztBudowy`,
`przyrostKosztu`, `utrzymanie`, `przyrostUtrzymania`, `wymagania`, `uwagi`, `historia`, `opis`, `top3`,
`techUnlock`. `baza`/`przyrost`: 8 kluczy int (42/42). Opcjonalne: `koszt_surowce` (41; pod-klucze
`drewno` 39, `kamien` 21, `cegla` 11), `upgradeFrom` (10), `wymaganySurowiec` (3), `poziomTechGate` (1,
klucz liczbowy `"6"`), `lokalizacja` (8), `odblokowuje` (5), `suppressed` (1).

**wonders.json** — obiekt z 4 kluczami: `_meta` (ok. 50 pól, w tym zagnieżdżone `absolut`,
`bonus_cywilizacja_typy` (16 pól str), `wieki`, `cuda_wyscigowe_epoka` z kluczami `"1"`..`"3"`),
`cuda` (19), `panstwa` (15 państw, mapa po nazwie, każde `{nazwa, cuda[]}`), `parkowane_epoka4plus` (5;
`nazwaAlt` tylko 1). W `cuda`: `bonusy` zawsze z `miasto` i `specjalne`; `hex` (3), `teren` (6) —
opcjonalne. `specjalne[].wartosc`: 38 int i 19 float → mapowane na `f64`.

**tech.json** — obiekt: `drzewko_model`, `_drzewko_model_opis`, `tempo_gry` (`szybka`, `standardowa`,
`dluga`, `_opis`), `technologie` (32). Klucze z polskimi znakami i spacjami (np. `"Dostęp do surowca."`,
`"Koszt nauki"`) mapowane przez `#[serde(rename)]`. Pola nullable: `Dostęp do surowca.`, `wymagany budynek`,
`Odblokowuje surowiec.`, `Odblokowuje budynek`, `Uwagi`, `Odblokowuje ulepszenie terenu`. Opcjonalne:
`awansDoEpoki` (2), `wymagane ulepszenie` (1).

## 3. Spot-checki liczbowe (wyliczone niezależnie skryptem Python z `json.load`, nie z kodu Rust)

| Plik | Wartość niezależna (Python) | Asercja w teście |
|---|---|---|
| buildings | `len` = 42 | `buildings.len() == 42` |
| buildings | rekordy z `koszt_surowce` = 41 | `== 41` |
| buildings | suma `kosztBudowy` = 1736 | `== 1736` |
| buildings | suma `epokaWejscia` = 89 | `== 89` |
| buildings | `stolarnia`: kosztBudowy 20, przyrostKosztu 10, baza.praca 5, przyrost.praca 3 | identycznie |
| wonders | `cuda` = 19, `panstwa` = 15, `parkowane_epoka4plus` = 5 | identycznie |
| wonders | suma `kosztBudowy` cudów = 4425; `bonusy.specjalne` łącznie = 57 | identycznie |
| wonders | pierwszy cud `piramidy`, kosztBudowy 160 | identycznie |
| tech | `technologie` = 32; suma `Koszt nauki` = 9224 | identycznie |
| tech | pierwsza: `Obróbka drewna`, koszt 5; tempo szybka 1 / standardowa 2 / dluga 4 | identycznie |

Uwaga do P2.9: tam 40/42 rekordów `buildings.json` zgadza się wartościowo z `building_costs.rs`.
Ten temat niczego nie rewiruje (zgodnie z dispatchem), więc to porównanie pozostaje poza zakresem.

## 4. Decyzje

- **serde_json tylko jako dev-dependency.** `Cargo.toml` nie był zmieniany (allowlista: tylko gdy
  konieczne i opisane). Moduł `src/data/buildings_tech.rs` nie jest częścią `lib.rs`; kompiluje się
  wyłącznie w teście przez `#[path]`, który widzi `[dev-dependencies]`. Przy późniejszym podpinaniu do
  biblioteki (temat konsolidacyjny) trzeba dopisać `serde_json` do `[dependencies]`. To jest jawnie
  odnotowany dług, nie błąd tego tematu.
- **`include_str!("../../data/<plik>.json")`** — ścieżka względem `src/data/`, czyli `rust-port/engine/data/`.
- **Liczby**: wszystkie całkowite jako `i64`; `wartosc` w `specjalne` jako `f64` (JSON miesza int i float;
  serde przyjmuje int do `f64`).
- **Pola opcjonalne**: `Option<T>` (brak klucza i `null` → `None`). Pole `Option` przy obecności w 42/42
  rekordów nie występuje; wszystkie `Option` odpowiadają realnym brakom w danych.
- **Klucze liczbowe** (`poziomTechGate."6"`, `cuda_wyscigowe_epoka."1".."3"`, `panstwa`) → `BTreeMap<String, _>`.
- **`#![allow(dead_code)]`** w module: struktury są tylko deserializowane, część pól nie jest czytana.

## 5. Testy — surowe logi

Komenda (z katalogu `rust-port/engine/`, z czasowo wyłączonym debuginfo, bo dysk `/` był pełny):
```
CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_INCREMENTAL=0 \
CARGO_TARGET_DIR=<scratchpad>/target-p3-5c cargo test --test data_buildings_tech
```

Log (exit 0):
```
   Compiling proc-macro2 v1.0.107
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling serde v1.0.229
   Compiling serde_json v1.0.154
   Compiling itoa v1.0.18
   Compiling memchr v2.8.3
   Compiling syn v3.0.9
   Compiling serde_derive v1.0.229
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_f73475a1-668-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 12.02s
     Running tests/data_buildings_tech.rs (.../target-p3-5c/debug/deps/data_buildings_tech-aa02ce6dab933d1a)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
EXIT=0
```

Pierwsza próba (z debuginfo) padła na `No space left on device` podczas kompilacji zależności `syn`
(dysk `/` 100% zajęty przez inne procesy; ~43 MB wolnego). Nie kasowano cudzych plików. Usunięto tylko
własny katalog target z pierwszej próby (52 MB). Druga próba z `DEBUG=0` przeszła bez zmian w kodzie.

Nie uruchomiono pełnego `cargo test` (224 testy wg P3-1-2): zmiana nie dotyka `lib.rs` ani żadnego
modułu biblioteki, a na dysku zabrakło miejsca na pełny build. Pełna regresja to krok konsolidacji.

## 6. Blokady / ograniczenia

- `Cargo.lock` jest generowany przy pierwszym `cargo test` i nie jest w `.gitignore`. Plik został
  usunięty przed commitem i nie jest częścią allowlisty.
- Dysk `/` był pełny (kwestia środowiska, nie kodu). Wymaga zwolnienia miejsca przed pełnym buildem.
- Brak weryfikacji `--offline --locked` (brak `Cargo.lock` w repo na `9e33fc77`).

## 7. Zgodność z dispatchem

| Kryterium | Stan |
|---|---|
| 3/3 pliki JSON mają strukturę Rust | SPEŁNIONE |
| Parsowanie w teście jednostkowym | SPEŁNIONE (3/3 `ok`) |
| Surowy log `cargo test`, exit 0 | SPEŁNIONE (powyżej) |
| Spot-check liczbowy per plik | SPEŁNIONE (sekcja 3) |
| Zero zmian w `lib.rs`, `domain/mod.rs`, `domain/building_costs.rs` | SPEŁNIONE |
| Zero zmian w `gra/**` | SPEŁNIONE |
| Brak PUSH | SPEŁNIONE |

STATUS: PASS-WITH-NOTES (powód: brak pełnego `cargo test` z powodu braku miejsca na dysku i dług
`serde_json` jako dev-dependency).

DEPLOY/PUSH: NIE WYKONANO
