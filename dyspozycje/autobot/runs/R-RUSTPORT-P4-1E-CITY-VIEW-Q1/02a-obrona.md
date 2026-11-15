# R-RUSTPORT-P4-1E-CITY-VIEW-Q1 — Obrona Operatora, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1E-CITY-VIEW-Q1
GOAL: producent widoku miast (OwnerViewDto / CityViewDto / CityBadgeDto) z PlayableState, wartosci zgodne z webem (pin 07d2fbd72)
ZMIANY/COMMIT: gen/scenarios.json (+1 scenariusz), tests/view_city_pin_vectors.rs (wektory zregenerowane generatorem + 1 test + asercje pokrycia Z1-Z3), gen/mutacje.py (+E4, E14, E7, E8), ten raport; kod producenta city_view.rs BEZ ZMIAN; commit na galezi obrona/R-RUSTPORT-P4-1E-CITY-VIEW-Q1 (rodzic 017634d06 = Evaluator r1, dziadek 1e24318c9 = Operator r1); SHA w wyniku Obrony
TESTY: §3 (bramki z kodami wyjscia), §2 (mutacje)
BLOKADY: brak; dlug Z4 do rejestru (§1, Z4) - wpis robi orkiestrator (REJESTR-RUST.md poza allowlista tematu)
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTEPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
```

Baza: commit Evaluatora `017634d06` (zawiera kod Operatora `1e24318c9` i raport `02-evaluator.md`), gałąź
`obrona/R-RUSTPORT-P4-1E-CITY-VIEW-Q1`. `git merge-base --is-ancestor a01363d5f HEAD` = 0.
Najpierw web (pin `07d2fbd72`), potem Rust: przeczytane `git show 07d2fbd72:gra/src/main.ts` linie 2898-2907
(`unitCountOnHex`) i 34995-35003 (`capitalCityIdForOwner`), `game/capital-capture.ts:60-85` (`cityFoundOrder`,
`oldestCityOfOwner`), `game/civ-visual.ts:8-17, 59-70` (`OWNER_COLORS_FALLBACK`, `civColorForOwner`),
`game/display-names.ts:110-125` (`shouldForceCultureIconForOwner`), `:171+` (`formatCityMapLabel`).

## 1. Odpowiedzi na zarzuty

### Z1 (FAIL) — jawna stolica nie pokryta wektorem — PRZYJMUJĘ

Poprawka: nowy scenariusz `przeniesiona_stolica_obce_jednostki_paleta` w `gen/scenarios.json`:
- właściciel 1 (`grecy`, obcy dla widza 0, relacja `wojna`): miasto 2 `Ateny` (najstarsze, `isCapital: false`) i miasto 5
  `Korynt` (`isCapital: true`). Pin (`capitalCityIdForOwner`, `main.ts:35000-35001`) daje `capitalCityId = 5`;
  `oldestCityOfOwner` dałby 2.
- dodatkowo widz 0: miasto 1 `Roma` (najstarsze, bez stolicy) i 3 `Ostia` (`isCapital: true`) → pin `capitalCityId = 3`.

Wektory przeliczone generatorem z pinu (`gen_city_view_vectors.py`, nie ręcznie). Wynik pinu dla scenariusza:
`owner 1: capitalCityId = 5`, `owner 0: capitalCityId = 3`; odznaki: `city2.isCapital = false`, `city5.isCapital = true`,
`city1.isCapital = false`, `city3.isCapital = true`.

Uwaga do etykiety: na pinie `formatCityMapLabel` dla obcej stolicy zwraca nazwę miasta (`foreignCapitalMapName`,
R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1), więc mutant E4 nie zmienia `cityName`; zmienia `capitalCityId` i
`badge.isCapital` (dwa miasta) — to wystarcza do zabicia mutanta.

Dowód: test `przeniesiona_stolica_obce_jednostki_paleta_zgodne_z_pinem` + asercja pokrycia w
`wektory_pokrywaja_galezie_producenta` (liczy z WEJŚĆ scenariusza: właściciel obcy dla widza, ma miasto `isCapital`,
`capitalCityId` ≠ najmniejszy id jego miast). Mutant E4 dopisany do `gen/mutacje.py` → ZABITY (§2).

### Z2 (FAIL) — obca jednostka na heksie miasta — PRZYJMUJĘ

Poprawka w tym samym scenariuszu: jednostki `{owner 1 @ (1,1)}`, `{owner 0 @ (1,1)}` (heks miasta 1 widza) i
`{owner 0 @ (6,3)}` (heks obcego miasta 5). Pin (`main.ts:2901-2907`, wszystkie jednostki na heksie): `city1.unitCountOnHex = 2`,
`city5.unitCountOnHex = 1`. Mutant E14 (filtr po właścicielu miasta) dałby 1 i 0.

Dowód: asercja pokrycia (z wejść: miasto, na którego heksie stoi jednostka innego właściciela, i `unitCountOnHex > 0`
w wektorze pinu) + E14 w `gen/mutacje.py` → ZABITY (§2).

### Z3 (uwaga) — paleta zapasowa i `padStart(6,'0')` — PRZYJMUJĘ

Poprawka w tym samym scenariuszu: gracze 6 (`player-6`) i 7 (`player-7`), klucze spoza `civs.json` (ścieżka
`PlayableGame::add_player`). Sprawdzone w webie, że nie są miastami-państwami (`shouldForceCultureIconForOwner`: brak
`startCityState`, poza `simplifiedOwners`/`typCopyOwners`, klucz ≠ klucz widza), więc `ringHex` nie jest `null`.
Wynik pinu: owner 6 → `color = 0x00acc1` (44225), `ringHex = "#00acc1"` (zero wiodące); owner 7 → `color = 0xf06292`,
`ringHex = "#f06292"` (7 % 8 = 7, a 7 % 7 = 0 → `0xffd54a`).

Dowód: dwie asercje pokrycia (właściciel z `displayName = null` i `id % 7 ≠ id % 8`; `ringHex` zaczynający się od `#0`)
+ E7 i E8 w `gen/mutacje.py` → ZABITE (§2).

### Z4 (uwaga, dług do rejestru) — PRZYJMUJĘ (bez zmiany kodu; wpis rejestru dla orkiestratora)

Obie konwencje są wspólne dla harnessu i Rust, więc wektory ich nie weryfikują. Zostają jawnym długiem. Treść wpisu do
`dyspozycje/rust-port/REJESTR-RUST.md` (plik poza allowlistą tematu — wpis wykonuje orkiestrator przy integracji):

- **DLUG-P4-1E-EPOKA-WLASCICIELA**: `OwnerViewDto.era` / `CityBadgeDto.era` = `gameStartEra()` dla wszystkich właścicieli
  (`city_view.rs` `empire_epoch_for_owner` z `EpochSource::DerivedFromStartEra`; harness `:96-99`). Web
  `empireEpochForOwner` (`main.ts:2419-2422`) ma epokę per człowiek (`ownerEraByOwner`) i per AI. `PlayableState` nie niesie
  epok per właściciel (luka odziedziczona z WIRE-WAR-EPOKA). NIE_ZMIERZONO do czasu stanu epok w `PlayableState`.
- **DLUG-P4-1E-JAWNA-STOLICA**: web trzyma jawną stolicę w `capitalCityIdByOwner` (`main.ts:35000`, follow-up „przenieś
  stolicę”, `capital-capture.ts:88+`); Rust czyta ją jako „pierwsze miasto właściciela z `is_capital`” (konwencja
  `war_world_view.rs:103`). Rozgałęzienie jawna/zapasowa jest teraz pokryte wektorem (Z1), ale samo odwzorowanie
  `capitalCityIdByOwner` ↔ `PlayableCity.is_capital` (np. dwa miasta z `is_capital` u jednego właściciela) jest
  ZAŁOŻENIEM, nie wektorem pinu.

### Z5 (uwaga, bez akcji) — PRZYJMUJĘ (bez zmian)

`is_barbarian = false` i `UnknownOwner` zamiast webowego `'grecy'` zostają udokumentowanym NIE_ZMIERZONO (raport
Operatora §7 pkt 5 i 7). Brak zmian.

## 2. Test mutacji (po poprawce)

`python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/gen/mutacje.py` (30 mutantów = 26 Operatora + E4, E14,
E7, E8), `CARGO_TARGET_DIR` w scratchpadzie (unikalny katalog), plik `city_view.rs` po przebiegu identyczny z kopią
sprzed przebiegu (`cmp`).

Wynik: **30/30 zabitych, 0 przeżyło**, skrypt EXIT 0, każdy mutant `cargo test` EXIT 101; `cmp` → plik przywrócony.

| Mutant (Evaluator r1) | Przed obroną (02-evaluator.md §4) | Po obronie |
|---|---|---|
| E4 jawna stolica pominięta (`find(|c| false && c.is_capital …)`) | PRZEŻYŁ (0) | ZABITY (101) |
| E14 `unitCountOnHex` tylko jednostki właściciela miasta | PRZEŻYŁ (0) | ZABITY (101) |
| E7 `ring_hex` bez dopełnienia (`{color:x}`) | PRZEŻYŁ (0) | ZABITY (101) |
| E8 paleta zapasowa `% 7` | PRZEŻYŁ (0) | ZABITY (101) |

Pozostałe 26 mutantów Operatora: ZABITE (101) jak w r1 (stare scenariusze nie zmienione, ich wektory w bloku bajt w bajt
te same — generator dopisuje tylko czwarty scenariusz).

## 3. Bramki

`rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo
(unikalny, usunięty po bramkach); `Cargo.lock` lokalny, nie commitowany.

| Bramka | Wynik | Kod wyjścia |
|---|---|---|
| `cargo fmt --check` | czysto (po `cargo fmt` na nowym fragmencie testu) | 0 |
| `cargo clippy --all-targets -- -D warnings` | `Finished`, 0 ostrzeżeń | 0 |
| `cargo test --all-targets` (pełny) | 3393 passed, 0 failed, 1 ignored (istniejący `e2e::dump_tick1_econ_for_web_generator`, nie z tego tematu); r1: 3392 → +1 nowy test scenariusza | 0 |
| `cargo test --test view_city_pin_vectors` (część pełnego przebiegu) | 12 passed, 0 failed, 0 ignored | 0 |
| `git diff --check` | czysto | 0 |
| `python3 -I …/gen/gen_city_view_vectors.py --check` | `OK: blok wektorow zgodny z pinem 07d2fbd72` | 0 |
| stare wektory (scenariusze 1-3) vs `017634d06` | identyczne (porównanie JSON w Pythonie: `old == new[:3]` → `True`, `stubbedModules` = `["three"]`) | — |

## 4. Allowlista

Zmienione w tej rundzie (wszystko w allowliście dispatchu):
- `rust-port/engine/tests/view_city_pin_vectors.rs` (blok `PIN_VECTORS` z generatora; licznik scenariuszy 3 → 4; nowy test
  scenariusza; asercje pokrycia Z1-Z3; formatowanie `cargo fmt`)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/gen/scenarios.json` (+1 scenariusz)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/gen/mutacje.py` (+4 mutanty)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/02a-obrona.md` (ten raport)

Zero zmian w `city_view.rs`, `mod.rs`, `Cargo.toml`, `gra/**`, `view-model/**`, `renderer/**`, `src-tauri/**`,
`bridge.rs`, `playable.rs`, `save_load.rs`, `state.rs`. Brak `#[ignore]`, brak osłabionych asercji (stare asercje bez zmian,
doszły nowe).
