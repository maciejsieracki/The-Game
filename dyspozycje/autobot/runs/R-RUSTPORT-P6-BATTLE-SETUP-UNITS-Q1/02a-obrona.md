# R-RUSTPORT-P6-BATTLE-SETUP-UNITS-Q1 — Obrona Operatora (odpowiedz na 02-evaluator.md, runda 1)

```text
STATUS: PASS (obrona: 5 zarzutow PRZYJETYCH z poprawka i dowodem, 2 uwagi PRZYJETE, 1 punkt bez zarzutu)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-BATTLE-SETUP-UNITS-Q1
GOAL: port rozstawienia jednostek (_placeUnits / _placeSiegeDefenders / _repositionSiegeAttackers + initialBattleSlots)
      wg pinu 07d2fbd72, pozycje bajt w bajt z wykonaniem tekstu pinu
ZMIANY/COMMIT: kod obrony e3ec2d944 (rodzic 8ada97582 = raport Evaluatora; galaz rust-port-wip/bsetupunits-ob1, bez push),
      raport ten = kolejny commit na tej samej galezi. Pliki: tests/p6_battle_setup_units_gen.mjs (scenariusze R2-*,
      komentarz N4), tests/p6_battle_setup_units_vectors/vectors.json (zregenerowane), tests/p6_battle_setup_units.rs
      (6 licznikow + progi, fikstura renderera bez odczytu renderer/), src/domain/battle_setup_units.rs (TYLKO
      doc-komentarz place_siege_defenders). Logika silnika bez zmian.
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; p6_battle_setup + p6_battle_setup_units +
      bridge_contract = 15 + 7 + 9 passed, EXIT 0; mutanty E12/E16/E32/E27(x3) ZABITE, E03/E10/E30 przezywaja
      (rownowazne, argumenty §3); pelny cargo test --all-targets --no-fail-fast partiami EXIT=0 (538 binarek, 4051 passed, 0 failed, 1 ignored)
BLOKADY: brak
RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: Final Control (albo Evaluator r2 wg orkiestratora) na e3ec2d944 + ten raport
DEPLOY/PUSH: NIE WYKONANO
```

Baza: galaz Evaluatora `rust-port-wip/bsetupunits-ev1` @ `8ada97582` (kod Operatora `3beb05068`, baza dispatchu
`789d49bd8`). Worktree `wf_61a2a56a-82f-3`, sparse `rust-port dyspozycje src-tauri`, target w scratchpadzie
`bsetupunits/ob/target` (usuniety po bramkach).

## 1. Zarzuty i odpowiedzi

| # | Zarzut | Odpowiedz | Dowod |
|---|---|---|---|
| Z1 | E16 przezyl (`playableRows` bez `-1`) | **PRZYJMUJE** | 6 scenariuszy `R2-E16-*` (§2.1); mutant E16 ZABITY (2 testy FAILED) |
| Z2 | E12 przezyl (dolne skrzydlo bez korpusu, `PLAY_MID_ROW+1` -> `PLAY_MID_ROW`) | **PRZYJMUJE** | pole `synt-pas-skrzydlo-dol` + 3 scenariusze `R2-E12-*`; mutant ZABITY |
| Z3 | E32 przezyl (`mainBandWidth` bez pasma dowodcow) | **PRZYJMUJE** | 3 scenariusze `R2-E32-*`; mutant ZABITY |
| Z4 | E27 przezyl (`haystack` -> nazwa, javelin; analogicznie archer/slinger) | **PRZYJMUJE** | 2 scenariusze `R2-E27-*` z 11 kategoriami zawierajacymi slowo; mutanty E27-jav/arc/sli ZABITE |
| Z5 | argumenty rownowaznosci E03/E10/E30 + liczniki pokrycia z progami | **PRZYJMUJE** | §3 (argumenty + potwierdzenie, ze przezywaja tez na nowych wektorach), §4 (6 licznikow z progami w tescie) |
| N1 | test czyta `../renderer/src/battle/field.rs` | **PRZYJMUJE** | test `fikstura_renderera_max_per_side` sprawdza tylko `renderer_parity.json` (linia, zrodlo, 120 vs 500); plik renderera czyta wylacznie generator |
| N3 | `place_siege_defenders` publiczne, `rowHi < rowLo` poza pinem | **PRZYJMUJE** | doc-komentarz funkcji: zakres zgodnosci = geometria `_carveWallTiles` (0/155/77), zachowanie `debug_assert!`/`max(1)` poza pinem, wolajacy T6 ma podawac `SiegeWallRows::from(&layout)` |
| — | bramki i kod bez zarzutow | bez odpowiedzi (potwierdzone ponownie w §5) | — |

N4 (kosmetyka, nie byla zarzutem w tej rundzie): komentarz przed S18 poprawiony (pola z murem, galaz oblezenia); komentarz
„siegeMode bez muru" przeniesiony nad S17.

## 2. Nowe scenariusze (generator, `p6_battle_setup_units_gen.mjs`)

Dopisane **po** petli losowej `L*`, wiec strumien RNG przypadkow r1 jest nietkniety: porownanie `vectors.json` r1 vs r2 —
172 przypadki r1 identyczne bajt w bajt (`JSON.stringify` kazdego przypadku), wszystkie 21 pol r1 identyczne, dochodzi
1 pole i 14 przypadkow (razem 186 przypadkow, 22 pola). Jednostki `exact(...)` maja wymuszone `commander` (bez losowego
dowodcy 3%), a `runChecked` przed wykonaniem pinu sprawdza licznosci rol **wykonaniem `initialBattleRoleOf` pinu**
(rzuca wyjatek, jesli pasmo nie ma dokladnej licznosci).

### 2.1 E16 — granica `playableRows = PLAY_ROW1 - PLAY_ROW0 - 1 = 108`

Pasmo n z `ceil(n/108) > ceil(n/109)` przy liniach skonfigurowanych < `ceil(n/108)`: pin daje wiecej linii niz mutant.

| Przypadek | Pole / tryb | Pasma na granicy |
|---|---|---|
| `R2-E16-oblezenie-piechota-109` | `mur-wzgorza`, siegeMode | atak: piechota 109 (pin 2x55, mutant 1x109) |
| `R2-E16-oblezenie-lucznicy-109` | `mur-wzgorza`, siegeMode | atak: lucznicy 109 (+3 piechoty) |
| `R2-E16-oblezenie-218-109` | `mury-kamienne-pustynia`, siegeMode | atak: piechota 218 (3x73 vs 2x109), lucznicy 109 |
| `R2-E16-polowa-piechota-217-218` | `polowa-500`, polowe | atak 217, obrona 218 |
| `R2-E16-polowa-lucznicy-109-218` | `polowa-40`, polowe | lucznicy: atak 109, obrona 218 |
| `R2-E16-polowa-325-433` | `polowa-500`, polowe | piechota 325 (4 vs 3 linie), 433 (5 vs 4) |

`meleeLines = archerLines = 1` we wszystkich.

### 2.2 E12 — lustro F8 dla dolnego skrzydla bez korpusu

Pole `synt-pas-skrzydlo-dol` = `polowa-40` przemapowane deterministycznie: wszystko Plains, wiersze 78..83 w kolumnach
10..57 = rzeka. Slot dolnej jazdy (strona bez korpusu) = `PLAY_MID_ROW + 1` = 78; pasmo pinu `max(78, ir-3)..min(..., ir+6)`:
pin wybiera wiersz 84 (pierwszy wolny), mutant dopuscilby wolny wiersz 77 (wynik mutanta: atak indeks 1 na (31, 77)).
Przypadki: `R2-E12-dol-jazda-2v2`, `R2-E12-dol-jazda-5v4` (konnica + rydwany, 2-3 jednostki na dolnym skrzydle),
`R2-E12-dol-jazda-siegeMode-bez-muru` (siegeMode = true na polu bez muru -> galaz polowa).

### 2.3 E32 — pasmo dowodcow najszersze przy obecnej jezdzie

`R2-E32-dowodcy-najszersi-polowa` (atak 3 dowodcow + 1 wojownik + 6 konnicy; obrona 5 dowodcow + 2 lucznikow + 8 konnicy),
`R2-E32-dowodcy-najszersi-oblezenie` (atak 4 + 2 + 7 konnicy, siegeMode), `R2-E32-dowodcy-i-jazda-bez-piechoty`
(tylko dowodcy + jazda). Wiecej niz 2 jazdy na skrzydlo celowo: przy 1 jezdzie na skrzydlo przesuniecie `topRows` o jeden
wiersz konczy sie tym samym polem (pasmo skrzydla jest obciete przez `bodyMin - 1`), przy kolejnych jezdzcach wybor pola
sie rozni (mutant: atak indeks 0.. na innych polach, `p6_battle_setup_units.rs:767`).

### 2.4 E27 — rola z kategorii zawierajacej slowo kluczowe

Jednostka bazowa `Wojownik` (nazwa bez slowa kluczowego), kategorie rozne od dokladnych:
javelin `Javelinmen`, `Atlatl band`, `Estólicos`, `Oszczepnik ciężki`; archer `Łucznicy`, `Archers`, `Kusznik najemny`,
`Crossbowmen`; slinger `Procarze`, `slinger corps`, `Balearic Slingers` (normalizacja NFD/ł usuwa diakrytyki — sprawdzone
wykonaniem pinu: role javelin 8 / archer 8 / slinger 6 na strone). `R2-E27-kategoria-zawiera-polowa` (polowe, obie strony)
i `R2-E27-kategoria-zawiera-oblezenie` (siegeMode, `meleeLines 2`, `archerLines 3`). Mutanty `haystack -> name` dla kazdej
z trzech galezi gina juz na asercji `initialBattleRoleOf` w `unit()` (`left: Melee`), niezaleznie od pozycji.

## 3. Mutanty — wynik (skrypt `scratchpad/bsetupunits/ob/mut.py`: jedna podmiana, `cargo test --test p6_battle_setup_units`, przywrocenie; `git status` czysty po przebiegu)

| ID | Mutant | Wynik na wektorach r2 |
|---|---|---|
| E16 | `formation.rs` `lines_for_band`: `play_row1 - play_row0 - 1.0` -> bez `- 1.0` | **ZABITY** (rozstawienie + pole T5a: 2 FAILED) |
| E12 | `units.rs` dolne skrzydlo: `map_or(PLAY_MID_ROW + 1, ...)` -> `PLAY_MID_ROW` | **ZABITY** (atak idx 1: (31,77) zamiast (31,84)) |
| E32 | `formation.rs` `main_band_width` bez pasma dowodcow | **ZABITY** (2 FAILED) |
| E27-jav | `any(&haystack, javelin)` -> `any(&name, ...)` | **ZABITY** (rola Melee != javelin) |
| E27-arc | `any(&haystack, archer)` -> `any(&name, ...)` | **ZABITY** |
| E27-sli | `any(&haystack, slinger)` -> `any(&name, ...)` | **ZABITY** |
| E03 | `place_one`: `[cr0 + dr, cr0 - dr]` -> `[cr0 - dr, cr0 + dr]` | przezyl — rownowazny (ponizej) |
| E10 | `top_wing`: `ir < PLAY_MID_ROW` -> `<=` | przezyl — rownowazny |
| E30 | gorne skrzydlo: `.min(ir + 3)` usuniete | przezyl — rownowazny |

Argumenty rownowaznosci (dla geometrii pinu; potwierdzone tym, ze mutanty przezywaja takze 14 nowych przypadkow
o skrajnych pasmach i skrzydlach):

* **E03** (kolejnosc `+dr`/`-dr` w `placeOne`). Jedyna osiagalna geometria muru: `rowLo = 0`, `rowHi = 155 = BF_ROWS-1`,
  wiec `span = BF_ROWS` i jednostka k reszty celuje w `(wallCol+2+floor(k/156), k % 156)` — w danej kolumnie rzedy
  celow ida kolejno `0, 1, 2, ...`. Niezmiennik (indukcja po k): w chwili rozstawiania jednostki k wszystkie rzedy
  kolumny celu ponizej `cr0` sa niewolne. Baza: `cr0 = 0`, `cr0 - dr` clampuje do 0 = sam cel (niewolny, skoro szukamy).
  Krok: rzad x < cr0 byl celem wczesniejszej jednostki tej kolumny — zostala na nim (zajety) albo byl niewolny
  (nieprzechodni — teren sie nie zmienia; zajety — zajetosc nigdy nie znika). Jednostki z petli kolumn `dc` (`placeOne`
  krok 2) zajmuja w nowej kolumnie najnizszy wolny rzad od `rowLo`, co zachowuje niezmiennik. Atakujacy stoja w kolumnach
  `< wallCol`, korona na `wallCol` — zadna obca jednostka nie zwalnia ani nie zajmuje rzedow kolumn `>= wallCol+2` inaczej.
  Zatem `cr0 - dr` nigdy nie jest wolne, gdy szukanie trwa: kolejnosc sprawdzania nie zmienia wyniku.
* **E10** (`topWing`: `<` vs `<=`). `top_wing` jest uzywane tylko dla jazdy (`mounted_wing`). Wiersz jazdy pochodzi
  z `topRows` (`< mainRowStart <= MID`) albo `bottomRows` (`> mainRowEnd >= MID`; `mainRowEnd = mid - floor(bw/2) + bw - 1
  >= mid` dla bw >= 1), a clamp `[0, 155]` nie dotyka (`mainRowStart >= mid - 54 = 23`). `ir == MID` dla jazdy jest
  nieosiagalne, wiec `<` i `<=` daja ta sama galaz.
* **E30** (`min(..., ir + 3)` w gornym skrzydle). Gorny rzad jazdy `ir = mainRowStart - 1 - i`, `i < wingRowCount <= 3`,
  wiec `ir + 3 >= mainRowStart`. Z korpusem: najszersze pasmo (per = `mainBandWidth`) ma pierwsza linie pelna, czyli
  zaczyna sie w `mid - floor(per/2) = mainRowStart`, wezsze pasma zaczynaja sie nie wyzej, wiec `bodyMin = mainRowStart`
  i `bodyMin - 1 < ir + 3`. Bez korpusu: `bw = 1`, `mainRowStart = MID`, `MID - 1 < MID <= ir + 3`. `ir + 3` nigdy nie jest
  minimum — usuniecie nie zmienia granicy. (Uwaga: argument opiera sie na `mainBandWidth` liczonym z tych samych pasm co
  `layBand`; mutant E32 to zmienia, ale E32 jest zabity niezaleznie.)
* E14 (stale -1 = -1) — bez zmian wzgledem oceny Evaluatora.

## 4. Liczniki pokrycia rundy 2 (dokladne nazwy; progi w `pokrycie_galezi_rozstawienia`, stale `PROG_*`)

Liczone w tescie z wejscia i wyniku (niezaleznie od implementacji: `band_per` odtwarza wzor `linesForBand` z pinu tylko
do klasyfikacji pokrycia), dla stron rozstawianych przez `place` (atak zawsze, obrona poza galezia oblezenia).

| Licznik | Zmierzone | Prog | Co dowodzi |
|---|---|---|---|
| `pasmo_granica_wierszy_gry` | 10 | 10 (`PROG_PASMO_GRANICA`) | pasma z `per(108) != per(109)` (E16) |
| `jazda_dolne_skrzydlo_bez_korpusu_poza_slotem` | 16 | 8 (`PROG_DOLNE_SKRZYDLO`) | dolna jazda strony bez korpusu odsunieta od slotu przez przeszkode (E12) |
| `pasmo_dowodcow_najszersze_z_jazda` | 5 | 5 (`PROG_DOWODCY_NAJSZERSI`) | strona z jazda, gdzie `per` dowodcow > `per` kazdego innego pasma (E32) |
| `rola_z_kategorii_oszczepnik` | 32 | 20 (`PROG_ROLA_Z_KATEGORII`) | rola tylko z dopasowania kategorii != dokladnej (E27) |
| `rola_z_kategorii_lucznik` | 24 | 20 | jw. |
| `rola_z_kategorii_procarz` | 24 | 20 | jw. |

Dotychczasowe 23 liczniki r1 i ich progi bez zmian (wszystkie spelnione).

## 5. Bramki (`rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, target w scratchpadzie)

| Bramka | EXIT | Wynik |
|---|---|---|
| `node tests/p6_battle_setup_units_gen.mjs` | 0 | straznik SHA przechodzi; 186 przypadkow, 22 pola; MD5 `vectors.json` `1ca6b28aae40e88881b431d34d083f69`, `renderer_parity.json` `ab288df61bf1a7d740a31618a6a75117` (bez zmian) |
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | — |
| `cargo test --test p6_battle_setup --test p6_battle_setup_units --test bridge_contract` | 0 | 15 + 7 + 9 passed |
| pelny `cargo test --all-targets --no-fail-fast` (partie po 40 `--test` + `--lib --benches`, binarki usuwane po partii; dysk 6,3 GB na starcie) | 0 | 14 partii, 538 binarek testowych: 4051 passed, 0 failed, 1 ignored (istniejacy `p6_order_lane::e2e::dump_tick1_econ_for_web_generator`) — te same liczby co u Evaluatora; log `scratchpad/bsetupunits/ob/full.log` |

Allowlista: zmienione tylko pliki z allowlisty dispatchu (`battle_setup_units.rs` — wylacznie komentarz, test, generator,
wektory, raport). `battle_setup*.rs` T5a, `siege_tactics_loop.rs`, `renderer/`, `view-model/`, `bridge.rs`, `Cargo.*`,
`gra/**`, `REJESTR-RUST.md` nietkniete. Brak `#[ignore]`; trailer commitu tylko `Claude-Session:`.

## 6. Dlugi (bez zmian wzgledem r1)

D-T5b-1..7 z `01-operator-r1.md` aktualne (T6 producent DTO / adapter / `attackRange`, DTO-BRIDGE `MAX_PER_SIDE` 120 vs 500,
`DLUG-FORMATION-RULES-WINGRANK`, `FieldMoveTerrain` T6/T7, #369). Nowy punkt dla T6: wolajacy `place_siege_defenders`
przekazuje wylacznie mur z `setup_battle_field` (doc-komentarz, N3).
