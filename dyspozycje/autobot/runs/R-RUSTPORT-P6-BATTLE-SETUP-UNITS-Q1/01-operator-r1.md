# R-RUSTPORT-P6-BATTLE-SETUP-UNITS-Q1 — Operator, runda 1 (T5b: rozstawienie jednostek)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-BATTLE-SETUP-UNITS-Q1
GOAL: port rozstawienia jednostek do silnika (czysta domena) wg pinu 07d2fbd72: _placeUnits (siegeMode + galaz polowa,
      wspolna funkcja place), _placeSiegeDefenders, _repositionSiegeAttackers (no-op), sloty/skrzydla jazdy
      (initialBattleSlots), punktacja kafla tileScore, limit BATTLE_MAX_PER_SIDE; wejscie: listy jednostek + siatka T5a;
      wyjscie: kolumna/wiersz/facing w kolejnosci pinu
ZMIANY/COMMIT: galaz rust-port-wip/bsetupunits-r1 (worktree wf_61a2a56a-82f-1), kod 3beb05068c16776fe8c62fd0f84fee0dbf6325e4
      (baza 789d49bd80ad8d59696ffbbea4dccb9de886b869); raport w commicie nastepnym na tej galezi
TESTY: fmt OK; clippy --all-targets -D warnings OK; nowy test 7/7; trojka bramek 9+15+7 OK; pelny cargo test
      --all-targets --no-fail-fast EXIT=0 (4051 passed, 0 failed, 1 ignored - istniejacy p6_order_lane); mutanty 26/28
      zabite, 2 rownowazne (dowod §5)
BLOKADY: brak (uwagi i dlugi §7)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (02-evaluator.md)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza i worktree

`BAZA:` z dispatchu: `origin/rust-port/parity-v2` po `git fetch` w chwili startu = `789d49bd80ad8d59696ffbbea4dccb9de886b869`
(zgodne z SHA dispatchu `789d49bd8`). `git checkout -B rust-port-wip/bsetupunits-r1 origin/rust-port/parity-v2`.
Wolne na starcie: 13 GB. `CARGO_TARGET_DIR` = scratchpad `bsetupunits/target` (usuniety po bramkach).
Renderera nie budowano (temat go nie dotyka).

## 2. Najpierw web (pin `07d2fbd72`)

Przeczytane (`git show 07d2fbd72:gra/src/battle/battleScene.ts`, `formationRules.ts`):

| Pin | Co robi | Port |
|---|---|---|
| `_placeUnits` `:5276-5553` | `slice(0, MAX_PER_SIDE)`, oblezenie gdy `siegeMode && siegeWallCol >= 0`: atak `place(atk, 'atk', 2, +1, E)`, `_repositionSiegeAttackers()`, obrona `_placeSiegeDefenders`; inaczej `place` obu stron (fronty `ATK/DEF_FRONT_COL` albo `DEPLOY_*` przy `_deployMode`) | `place_units` |
| `place(...)` `:5288-5503` | sloty `initialBattleSlots` → `idealRow/idealCol` (clamp), rozpietosc korpusu bez jazdy, `tileScore` (piechota +40/+20/-15, jazda skrzydla +6/+3/-4, -1 gdy zajete/nieprzechodnie), pasma wierszy (skrzydlo / rozstawienie gracza ±8 / cala strefa), petla `extra < 10` z odcieciem `140 - 3|dr| <= best`, jazda tylko krok w tyl, `formationRank = |idealCol - frontCol|` | `place_side` |
| `_repositionSiegeAttackers` `:4427-4434` | cialo puste ("DISABLED") | `reposition_siege_attackers` = udokumentowany no-op, wolany jak w pinie |
| `_placeSiegeDefenders` `:4442-4744` | korona: wrecz+strzelcy (`!mounted && !siege`) i katapulty obrony (`siege && _isCatapult`), pas ±12 od bramy bez rzedow bramy, katapulty ±4 (`Math.round`), wymuszone stawianie na murze (nadpisanie `occByKey`), facing W; reszta (`mounted || siege && !catapult`) `placeOne` za murem (`wallCol+2+floor(off/span)`, szukanie wierszy ±dr, potem 4 kolumn) | `place_siege_defenders`, `place_one` |
| `initialBattleSlots` / `initialBattleFormation` / `classifyInitialBattleRole` (`formationRules.ts`) | pasma rol, linie 1/2/3, skrzydla jazdy z `wingRank` | `battle_setup_units_formation.rs` |
| `isMounted :1502`, `isPrimaryRanged :1474`, `isSiegeUnit :1552`, `_isCatapult :7408`, `initialBattleRoleOf :1490`, `DEPLOY_* :839-845, :937-941` | klasyfikatory i stale | metody `SetupUnit`, stale |

`arrangeFlankCavalry` i "funkcje punktacji miejsca" z `:776-788` to w pinie KOMENTARZ (funkcja nie istnieje); skrzydla
jazdy liczy `initialBattleSlots`, punktacja = `tileScore` w `place`. Zapisane w naglowku modulu.

RNG: rozstawienie nie uzywa RNG. Generator wykonuje tekst pinu z `Math.random` podmienionym na funkcje rzucajaca
wyjatek: 0 wywolan (D-BS-3). `RollSource` niepotrzebny.

NaN/Inf: `_placeUnits` przyjmuje TABLICE (`slice`), wspolrzedne sa calkowite z siatki — NaN/Inf nie wchodza do funkcji.
Wchodza do siatki (T5a `battleClearSideCap`): scenariusze S8 (`attackers = NaN`) i S9 (`Infinity`) rozstawiaja realne
armie na polu zbudowanym z takich licznosci.

## 3. Zmiany (allowlista)

| Plik | Co |
|---|---|
| `rust-port/engine/src/domain/battle_setup_units.rs` (nowy) | `SetupUnit` (pola czytane przez pin + flaga `ranged` = `isRanged(bu)`), klasyfikatory, `SiegeWallRows` (`From<&SiegeLayout>`), `PlaceUnitsInput`, `PlacedUnit`, `Occupancy` (semantyka `Map` JS: kolejnosc wstawienia, `set` w miejscu), `place_side`, `place_siege_defenders`, `reposition_siege_attackers`, `place_units`, `place_units_on_field` (wejscie = `BattleField` z T5a) |
| `rust-port/engine/src/domain/battle_setup_units_formation.rs` (nowy) | `classifyInitialBattleRole` / `initialBattleFormation` / `initialBattleSlots` pinu `07d2fbd72` (z `wingRank`), normalizacja = `norm_name` |
| `rust-port/engine/src/domain/mod.rs` | tylko 2× `pub mod` |
| `rust-port/engine/tests/p6_battle_setup_units.rs` (nowy) | 7 testow (§4) |
| `rust-port/engine/tests/p6_battle_setup_units_gen.mjs` (nowy) | generator: wykonanie tekstu pinu, straznik SHA-256 |
| `rust-port/engine/tests/p6_battle_setup_units_vectors/{vectors,renderer_parity}.json` (nowe) | MD5 `aa7920a4e6b806152bb3ea162be0ce29` / `ab288df61bf1a7d740a31618a6a75117` |

Nie ruszano: `battle_setup*.rs` T5a (publiczne API wystarczylo), `siege_tactics_loop.rs`, `formation_rules.rs`,
`renderer/`, `view-model/`, `bridge.rs`, `Cargo.toml`/`Cargo.lock`, `gra/**`, `REJESTR-RUST.md`.

Decyzja techniczna (do REJESTR przez orkiestratora): osobny `battle_setup_units_formation.rs` zamiast reuzycia
`formation_rules.rs`, bo ten jest portem pinu `dc8a3adc` i NIE ma `wingRank` (rank skrzydla = `floor(wingIndex/rows)`
zamiast `wingRank + floor(...)`), a jego normalizacja obejmuje tylko czesc Latin Extended-A. Mutant M21 (zachowanie
`formation_rules.rs`) jest zabijany przez wektory pinu — rozbieznosc realna. `formation_rules::initial_battle_slots`
nie ma produkcyjnego wolajacego (tylko `tests/p6_repin_wojna_a_formation.rs`).

## 4. Generator i testy

Generator (`node rust-port/engine/tests/p6_battle_setup_units_gen.mjs`, ~1,5 s, ziarno 7205): ORAKUL = wykonanie tekstu
pinu. CALE pliki (SHA-256): `battle-terrain.ts` `a17735ed…`, `city-towers.ts` `cc715ed6…`, `city-fortification.ts`
`52fd18e9…`, `formationRules.ts` `800ffb60…`; wycinki `battleScene.ts` T5a (te same zakresy co `p6_battle_setup_gen.mjs`)
+ T5b (§2, kazdy z kontrola pierwszej/ostatniej linii) — SHA wycinkow `5c9ce150…`. Konstruktor pinu buduje pole
(T5a) z pominietym `_placeUnits`, potem `_placeUnits` pinu jest wolane na harnessie. Stuby tylko 3D/paski/statystyki
runtime nieczytane przy wyborze pola.

Wektory: 21 pol (13 z `spec` konstruktora + 8 syntetycznych: gesty/rzadki teren, pole bez strefy rzeki, kolumny
42..46/42..45 rzeka, pasy rzeki na granicy pasma skrzydla/rozstawienia), 172 przypadki: 22 nazwane oblezenia (S1–S22),
10 polowych (F1–F10), 140 losowych (L0–L139: rozne pola, 0..70 albo 300..540 jednostek na strone, siegeMode 75%,
rozstawienie gracza 30%, linie 1/2/3). Jednostki: 75 wierszy `units.json` pinu + 19 syntetycznych (katapulta, taran,
wieza, balista oblezenia, konna katapulta, kusznik, procarz, estólica, bez `stats`, bez `Typ`, dowodcy).

Testy `p6_battle_setup_units.rs` (wszystkie OK; straznik 90 s `with_timeout` w petlach wektorow):

| Test | Co sprawdza |
|---|---|
| `naglowek_wektorow_i_straznik_pinu` | pin, SHA `formationRules.ts` i wycinkow, stale (`MAX_PER_SIDE` 500, `DEPLOY_*`, rzedy) |
| `pola_z_t5a_identyczne_z_pinem` | 13 pol: `setup_battle_field` (T5a) = kafle i mur pinu (koniec do konca) |
| `rozstawienie_identyczne_z_pinem` | 172 przypadki: `this.atk`, `this.def` (kolejnosc, indeks, q, r, facing, formationRank, onWallWalkway) i `occByKey` (kolejnosc + wartosci) bajt w bajt; klasyfikatory jednostek vs pin; >= 8 nazwanych siegeMode (22), >= 100 losowych (140); liczniki pokrycia |
| `pole_t5a_jako_wejscie_place_units_on_field` | przypadki na polach z `spec`: `place_units_on_field(BattleField)` = pin (>= 20) |
| `reposition_siege_attackers_to_no_op_jak_w_pinie` | no-op nie zmienia rozstawienia |
| `occupancy_jak_map_js` | semantyka `Map.set` |
| `fikstura_renderera_max_per_side` | fikstura JSON: pin 500, renderer 120, linia `field.rs` niezmieniona (tylko odczyt tekstu) |

Liczniki pokrycia (dokladne nazwy, wynik ostatniego przebiegu / prog): `przypadki_oblezenie` 80/60, `przypadki_polowe`
92/20, `przypadki_rozstawienie_gracza` 46/10, `przypadki_ponad_limit` 7/3, `przypadki_pusta_strona` 24/4,
`przypadki_siegemode_bez_muru` 40/1, `przypadki_linie_2_3` 65/20, `korona_wrecz` 1727/100, `korona_strzelec` 350/30,
`korona_katapulta` 184/10, `korona_wspolny_rzad` 1093/10, `reszta_bezposrednio` 179/3, `reszta_szukanie_rzedu`
1317/50, `reszta_szukanie_kolumny` 210/20, `reszta_bez_miejsca` 51/3, `jazda_skrzydlo` 5800/50,
`jazda_skrzydlo_poza_slotem` 1792/5, `piechota_poza_slotem` 3382/50, `pod_jednostka_las` 165/5, `pod_jednostka_brod`
219/5, `pod_jednostka_wzgorza_skaly` 246/5, `nadpisanie_occ` 1246/10, `dowodca` 595/3.

## 5. Bramki (EXIT 0, `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | OK |
| `cargo clippy --all-targets -- -D warnings` | OK (po ostatniej zmianie kodu) |
| `cargo test --test p6_battle_setup_units` | 7 passed |
| `cargo test --test p6_battle_setup --test p6_battle_setup_units --test bridge_contract` | 9 + 15 + 7 passed |
| `cargo test --all-targets --no-fail-fast` (tlo, `setsid nohup`, EXIT w logu) | `EXIT=0`, 538 binarek, 4051 passed, 0 failed, 1 ignored (`p6_order_lane::e2e::dump_tick1_econ_for_web_generator`, istniejacy) |

Mutanty (skrypt w scratchpadzie, kazdy = jedna podmiana, `cargo test --test p6_battle_setup_units`, plik przywracany;
przebieg koncowy na wektorach z commitu): **26/28 zabitych**.

| ID | Mutant | Wynik |
|---|---|---|
| M01–M03 | `tileScore` piechoty: Plains +40→+20, Ford +20→+40, Forest -15→-4 | zabite |
| M04–M06 | `tileScore` jazdy: Plains +6→+40, Ford +3→+4, Forest -4→-15 | zabite |
| M07 | odciecie 140→100 | zabity |
| M08 | `sc > best` → `>=` | zabity |
| M09 | limit 500→499 | zabity |
| M10 | `SIEGE_ATK_FRONT_COL` 2→3 | zabity |
| M11 / M12 | `DEFENSE_HALF_SPAN` 12→11 / `CATA_HALF_SPAN` 4→3 | zabite |
| M13 | jazda szuka w obu kierunkach kolumn | zabity |
| M14 / M15 | pasmo skrzydla: gora `ir-6`→`ir-5` / dol `hi+5`→`hi+6` | zabite (M14 przez F8) |
| M16 | rozstawienie gracza `ir-8`→`ir-7` | zabity (F9) |
| M17 | `placeOne` kolumny `dc<5`→`dc<4` | zabity (S22) |
| M18 | reszta `wallCol+2`→`+3` | zabity |
| M20 | krok rzedow korony `max(1,n-1)`→`max(1,n)` | zabity |
| M21 | brak `wingRank` (zachowanie `formation_rules.rs`) | zabity |
| M22 | petla `extra` 0..10→0..9 | zabity |
| M23 | `formationRank` bez `abs` | zabity |
| M24 | rzedy bramy: tylko `gate_lo` | zabity |
| M25 | `_isCatapult` bez `balist` | zabity (S20) |
| M26 | `isPrimaryRanged` bez kategorii `oszczepnik` | zabity |
| M27 | `wingRank` przy remisie pasm `>`→`>=` | zabity |
| **M19** | jedna katapulta: `floor((len-1)/2)`→`ceil` | **rownowazny** w kazdym stanie osiagalnym w pinie: mur zawsze z `_carveWallTiles` (`rowLo=0`, `rowHi=155`, `gateRow=PLAY_MID_ROW=77`), pula katapult = rzedy 73..81 bez 76–77 = 7 rzedow, a przy pustej puli `wallRows` = 65..89 bez 76–77 = 23 rzedy; `len-1` parzyste → `floor = ceil` |
| **M28** | odciecie `<= best` → `< best` | **rownowazny**: `140 - 3|dr|` jest gorna granica wyniku (`100 - 3|dr| - 2|dc| + premia`, premia <= 40); pole z granica `== best` ma wynik `<= best`, a aktualizacja wymaga `sc > best` — nie zmienia wyniku |

Dysk: wolne 13 GB na starcie; target usuniety po bramkach (wolne po: 11 GB, inne workery dzialaja).

## 6. Wynik w grze / porcie

Silnik umie rozstawic obie armie jak web: atakujacy przy krawedzi 0 (wrecz z przodu, maszyny z tylu), obroncy na
koronie muru w pasie ±12 wokol bramy (katapulty obrony ±4), jazda i taran/wieza za murem; w bitwie polowej dwa fronty
z jazda na skrzydlach i omijaniem rzeki/lasu wg punktacji pinu. To jest wejscie startowe dla T6 (adapter `PlayableState`
→ rostery) i #369 (petla oblezenia od pozycji startowych z silnika zamiast z renderera).

## 7. Długi (T6 / #369 / DTO-BRIDGE)

| ID | Dlug | Dla |
|---|---|---|
| D-T5b-1 | Producent `SetupUnit` z `PlayableState`/`BattleSetupDto`: `kategoria`, `stats.Typ`, `stats.Jednostka`, `nazwa`, `isArmyCommander` i flaga `ranged` = `attackRange(bu) >= 2` (`:1410-1422`: `missileAttack`/`Atak dystansowy`, `Zasieg ataku (hex)`) | T6 ADAPTER |
| D-T5b-2 | Pola `RuntimeBattleUnit` poza pozycja nie sa liczone: morale obroncow oblezenia ×1,5 (`:4527`, `:4695`), katapulta na koronie `range = max(_attackRangeFor, 6)` i `ranged = true` (`:4706-4709`), `onWallWalkway` (jest w wyniku), `_applyTerrainRange` strzelca na koronie (podwojony zasieg), `moveLeft`/`range` przez `_movementPointsFor`/`_attackRangeFor` u obroncow vs `movementPoints`/`attackRange` u atakujacych | T6 / #369 |
| D-T5b-3 | Wpiecie pozycji startowych w `SiegeLoop`/`ProdBody` oraz `FieldMoveTerrain` w `ProdBody` | #369 (T6/T7) |
| D-T5b-4 | Renderer `battle/field.rs` `MAX_PER_SIDE = 120` (pin 500, R-WEB-BATTLE-CAP-500-Q1); silnik = pin; fikstura `renderer_parity.json` wykrywa zmiane linii | DTO-BRIDGE |
| D-T5b-5 | `formation_rules.rs` (pin `dc8a3adc`) bez `wingRank` i z waska normalizacja; duplikat logiki z `battle_setup_units_formation.rs` — repin/usuniecie po decyzji orkiestratora (`DLUG-FORMATION-RULES-WINGRANK`) | orkiestrator / REPIN |
| D-T5b-6 | `_placeUnitsOneSide` (`:17082`, reset rozstawienia jednej strony w fazie deploy) — poza zakresem; korzysta z tych samych `place`/`_placeSiegeDefenders` | T6/T7 (deploy UI) |
| D-T5b-7 | Snapshoty `_savedAtkBUs`/`_startAtkSnaps` (replay, podsumowanie) — poza zakresem rozstawienia | T6 |

Uwaga parytetu (bez zmiany zachowania): pin stawia jednostki korony WYMUSZENIE — przy wiecej niz ~21 jednostkach
wrecz/strzelcow kilka dzieli rzad, a `occByKey` trzyma ostatnia (licznik `nadpisanie_occ`). Port robi to samo; to
zachowanie webu, nie decyzja portu.

## 8. Commity

* kod: `3beb05068c16776fe8c62fd0f84fee0dbf6325e4` (galaz `rust-port-wip/bsetupunits-r1`), trailer tylko `Claude-Session:`
* raport: commit nastepny na tej galezi
