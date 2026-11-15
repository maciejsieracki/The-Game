# R-RUSTPORT-P4-1E-CITY-VIEW-Q1 — Final Control, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1E-CITY-VIEW-Q1
GOAL: producent widoku miast (OwnerViewDto / CityViewDto / CityBadgeDto) z PlayableState, wartosci zgodne z webem (pin 07d2fbd72)
ZMIANY/COMMIT: oceniany kod = fb10d83eb (Obrona r1; rodzic 017634d06 Evaluator r1; dziadek 1e24318c9 Operator r1; a01363d5f przodkiem);
               ten raport = commit FC na lokalnej galezi fc/R-RUSTPORT-P4-1E-CITY-VIEW-Q1 (rodzic fb10d83eb), bez push
TESTY: §3 (bramki odtworzone niezaleznie), §4 (mutanty Obrony odtworzone niezaleznie)
BLOKADY: brak; dlug Z4 do REJESTR-RUST.md (wpis orkiestratora przy integracji, plik poza allowlista)
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora na rust-port/parity-v2 (uwaga: parity-v2 = 62ff9de35, przesunela sie od bazy a01363d5f; merge-tree przed FF)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Ancestry i allowlista (sprawdzone samodzielnie)

- `git merge-base --is-ancestor a01363d5f fb10d83eb` → 0 (OK). Lancuch: a01363d5f → 1e24318c9 → 017634d06 → fb10d83eb.
- `git diff --stat a01363d5f fb10d83eb`: 11 plikow, wszystkie w allowliscie dispatchu:
  `rust-port/engine/src/domain/city_view.rs` (nowy), `rust-port/engine/src/domain/mod.rs` (wylacznie `pub mod city_view;`,
  alfabetycznie miedzy `city_towers` i `civ_bonuses`), `rust-port/engine/Cargo.toml` (wylacznie
  `civ-view-model = { path = "../view-model" }`), `rust-port/engine/tests/view_city_pin_vectors.rs` (nowy),
  `dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/**` (raporty, generator, harness, scenariusze, mutacje).
- Zero zmian w `gra/**`, `view-model/**`, `renderer/**`, `src-tauri/**`, `bridge.rs`, `playable.rs`, `save_load.rs`, `state.rs`.
- `Cargo.lock` nie jest w zadnym commicie tematu (lokalny, usuniety po bramkach).
- Brak `#[ignore]` w `city_view.rs` i `tests/view_city_*`; `#![forbid(unsafe_code)]` w `city_view.rs:39`.
- Commity bez nazwy modelu w tresci; ostatnia linia `Claude-Session: …` (zgodnie z dispatchem).
- Runda Obrony zmienila tylko: `tests/view_city_pin_vectors.rs`, `gen/scenarios.json`, `gen/mutacje.py`, `02a-obrona.md`
  (`git diff --stat 017634d06 fb10d83eb`); kod producenta `city_view.rs` bez zmian.

## 2. Orzeczenia po zarzutach

| Zarzut | Orzeczenie | Dowod |
|---|---|---|
| Z1 (FAIL) jawna stolica bez wektora | **ODDAL** (naprawione w Obronie) | Scenariusz `przeniesiona_stolica_obce_jednostki_paleta`: wlasciciel 1 (obcy, wojna) ma miasto 2 (najstarsze, bez flagi) i 5 (`isCapital`) → wektor pinu `capitalCityId = 5`, `city5.badge.isCapital = true`, `city2 = false`; widz 0 → `capitalCityId = 3`. Harness odwzorowuje `capitalCityIdForOwner` 1:1 z `main.ts:34999-35003` (sprawdzone `git show 07d2fbd72:gra/src/main.ts`). Mutant E4 odtworzony przeze mnie: ZABITY (101, 1 test FAILED). |
| Z2 (FAIL) obca jednostka na heksie miasta | **ODDAL** (naprawione) | Jednostki wlasciciela 1 i 0 na heksie (1,1) miasta 1 → `unitCountOnHex = 2`; jednostka 0 na heksie (6,3) obcego miasta 5 → 1. Web `unitCountOnHex` (`main.ts:2901-2907`) liczy wszystkie jednostki — sprawdzone. Mutant E14: ZABITY (101). |
| Z3 (uwaga) paleta zapasowa i `padStart` | **ODDAL** (naprawione) | Gracze 6 i 7 z kluczami spoza `civs.json`: wektor `owner 6: color 0x00acc1, ringHex "#00acc1"` (zero wiodace), `owner 7: color 0xf06292` (7%8 ≠ 7%7). `OWNER_COLORS_FALLBACK` i `ownerId % OWNER_COLORS_FALLBACK.length` potwierdzone w `game/civ-visual.ts:8-17, 69`. Mutanty E7, E8: ZABITE (101). |
| Z4 (uwaga, dlug) epoka per wlasciciel + odwzorowanie jawnej stolicy | **ODDAL jako zarzut kodu; DLUG do rejestru** | Obie konwencje jawne w raporcie Operatora §7 pkt 4 i 6 oraz w 02a §1 (tresc wpisow DLUG-P4-1E-EPOKA-WLASCICIELA i DLUG-P4-1E-JAWNA-STOLICA). `PlayableState` nie niesie epok per wlasciciel ani mapy `capitalCityIdByOwner` — to luka stanu, nie bledu producenta; poprawka wymaga zmian poza allowlista (`playable.rs`). Orkiestrator wpisuje oba dlugi do `dyspozycje/rust-port/REJESTR-RUST.md` przy integracji. |
| Z5 (uwaga) `is_barbarian = false`, `UnknownOwner` zamiast `'grecy'` | **ODDAL** | Udokumentowane NIE_ZMIERZONO (Operator §7 pkt 5 i 7); blad zamiast cichej wartosci domyslnej jest zgodny z regula „bez cichych domyslnych”. |

Brak orzeczen NAPRAW. Brak pozycji DO DECYZJI CZLOWIEKA (gameplay rozstrzyga web; Z4/Z5 to jawne NIE_ZMIERZONO / dlug techniczny).

## 3. Bramki (odtworzone samodzielnie, `rust-port/engine`, kod fb10d83eb)

Srodowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` unikalny w scratchpadzie
(poza repo, usuniety po bramkach), `Cargo.lock` lokalny (usuniety, niecommitowany).

| Bramka | Wynik | Kod wyjscia |
|---|---|---|
| `cargo fmt --check` | czysto | 0 |
| `cargo clippy --all-targets -- -D warnings` | `Finished`, 0 ostrzezen | 0 |
| `cargo test --all-targets` | 3393 passed, 0 failed, 1 ignored (istniejacy `e2e::dump_tick1_econ_for_web_generator`, nie z tematu) | 0 dla kazdej z 468 binarek testowych |
| `view_city_pin_vectors` (w powyzszym) | 12 passed, 0 failed, 0 ignored | 0 |
| `git diff --check a01363d5f fb10d83eb` | czysto | 0 |
| `python3 -I …/gen/gen_city_view_vectors.py --check` | `OK: blok wektorow zgodny z pinem 07d2fbd72` | 0 |

Uwaga INFRA (bez wplywu na werdykt): dwa przebiegi `cargo test --all-targets` w tle zostaly przerwane z zewnatrz (brak
`TEST_EXIT`, proces martwy; drugi exit 144) przy wspolbieznych buildach innych tematow. Pelny zestaw wykonalem wiec jako
skompilowane przez `cargo test --all-targets --no-run` binarki testowe uruchamiane po kolei z katalogu crate'u
(468 binarek, kazda EXIT 0, sumy wyzej); kompilacja `--all-targets` zakonczona bez bledow.

## 4. Test mutacji (odtworzony samodzielnie dla mutantow Obrony)

Te same wzorce co `gen/mutacje.py` (E4, E14, E7, E8), `cargo test -q --test view_city_pin_vectors`:

| Mutant | Wynik |
|---|---|
| E4 jawna stolica pominieta (zawsze najstarsze) | ZABITY, exit 101, 11 passed / 1 failed |
| E14 jednostki na heksie tylko wlasciciela miasta | ZABITY, exit 101, 11/1 |
| E7 `ring_hex` bez dopelnienia do 6 cyfr | ZABITY, exit 101, 11/1 |
| E8 paleta zapasowa `% 7` | ZABITY, exit 101, 11/1 |

`city_view.rs` po przebiegu identyczny z kopia sprzed (`cmp` → OK). Pozostale 26 mutantow Operatora: nie odtwarzalem
(Evaluator r1 odtworzyl 7/11 swoich, Obrona raportuje 30/30); stare wektory scenariuszy 1-3 sa niezmienione, a kod
producenta bez zmian od r1, wiec ich wynik nie mogl sie pogorszyc.

## 5. Kontrola merytoryczna (web najpierw)

Sprawdzone `git show 07d2fbd72:…`: `render/cities.ts:855-931` (`_isCapitalCity`, `_cityMapLabel`, `_buildBadgeInput`:
`prodActive`, `prodPaused`, `prodCategoryLabel`, `resourceWarning` tylko przy niepustym koszcie, wzrost tylko dla miast widza,
`growthStarving`, `isCityState`, `era`), `main.ts:2945-3004` (`getLevel` clamp 1..10, `getWallKind` `'mur'→'stone'`,
`getRevolt` `bunt || revoltWarning`, `getCivIconId` = `civTypeForOwner`), `main.ts:2901-2907`, `4080-4082`, `34999-35003`,
`game/civ-visual.ts:8-17, 59-70`. Rust `city_view.rs` odpowiada 1:1 we wszystkich tych punktach.

## 6. Notatki dla integracji

1. `rust-port/parity-v2` = `62ff9de35` (nie `a01363d5f`): przed FF/merge zrobic `git merge-tree` i pelne bramki na wyniku.
2. Wpisy do `REJESTR-RUST.md`: DLUG-P4-1E-EPOKA-WLASCICIELA, DLUG-P4-1E-JAWNA-STOLICA (tresc w 02a §1, Z4);
   NIE_ZMIERZONO z raportu Operatora §7 (m.in. producent `growthPercent` / `computeView` nieportowany, `is_barbarian`).
3. Dysk po sprzataniu FC: 6.1 GB wolnego na `/` (ponizej progu 8 GB dla nowych tematow Rust wg CLAUDE.md zasada 5).
