# R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 — Operator r1 (r1 + r1b + r1c + r1d)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (T6)
GOAL: adapter PlayableState -> rostery szturmu/obrony, jednostki bitwy (BattleUnit), pola spawnu, kara morale
      startowa, szablony ciosu (cu + macierz kontr), SetupUnit, wejscia ciala/sceny (ProdBody, ActivateScene,
      SiegeEnv), doctrine_auto (D-T8-N1); rowne wektorom pinu 07d2fbd72; brak cichych zer (AdapterError).
ZMIANY/COMMIT: galaz rust-port-wip/k5loop-adapter-q1-op-r1d; kod + raport = commit podany w §9 (SHA w odpowiedzi
               Operatora; ostatni commit kodu 39d8cb14e). Baza: origin/rust-port-wip/k5loop-adapter-q1-op-r1c @ fbe3d8d2c
               (zawiera merge parity-v2 1e20c2da9; parity-v2 w chwili startu r1d = 1e20c2da9, bez zmian).
TESTY: fmt 0, clippy -D warnings 0, p6_k5loop_adapter 25/25, 6 testow bramki 54/54, pelny cargo test --all-targets
       --no-fail-fast EXIT 0 (4100 ok, 0 failed, 1 ignored poza tematem); mutanty 31/31 ZABITE.
BLOKADY: brak blokad kodu; dlugi w §8 (T7 #369, DTO-BRIDGE, REPIN, stan)
RUNDY: 1/5 (r1 przerwany 2 restartami kontenera i 1 timeoutem: r1b, r1c, r1d = ta sama runda)
NASTEPNY KROK: Evaluator (Opus)
DEPLOY/PUSH: NIE WYKONANO
```

Pin webu: `07d2fbd72` (odczyt `git show`, generator wykonuje tekst pinu ze straznikiem SHA-256 `0a95f5bc…731f51`;
`gra/` bez zmian). Historia rundy: r1 (`b721ba702`, WIP po restarcie) -> r1b (merge parity-v2 `1e20c2da9` w `9677fc3d3`,
kod ciala w `73813a7dd`) -> r1c (`7e22ec4c6`, `fbe3d8d2c`: testy M02/M11/M26) -> r1d (ta czesc: `240a83136`, `39d8cb14e`
+ raport). Szkic raportu z r1 zostal zweryfikowany i przepisany (stan faktyczny, nie szkic).

## 1. Co zrobiono (kod, allowlista)

Pliki (diff `1e20c2da9..HEAD`: 10 plikow, tylko allowlista; w istniejacych plikach produkcyjnych wylacznie
4 linie `pub mod` w `domain/mod.rs`, zadnej zmiany widocznosci):

| Plik | Zawartosc (port pinu) |
|---|---|
| `src/domain/siege_battle_adapter.rs` | `AdapterError` (`CityNotFound`, `AnchorNotFound`, `CityWithoutWall`, `AttackerHasGeneral`, `NoDefenders`, `MissingUnitDef`, `MissingMilitiaRow`, `MissingOwnerContext`, `NonFinite`, `InvalidGate`, `InvariantViolated`); rostery `collectAtkRosterNearCity`/`collectUnitsInRadius`/`shouldIncludeInBattleRoster`/`isCivilianUnit`, `collectDefRosterNearCity`, `defenderUnitsNearCity`, `hasCityDefenders`, Milicja (`militiaRegenTurnsLeft`, `militiaHeadcount`, `militiaSplit`, `buildMilitiaDef/Squad`, `collectCityDefRoster`), `collectSiegeDefRoster` (`main.ts:34802`), `collectSiegeAtkRoster` (`:34758`), `appendReadyMachinesToRoster` (`:18336`), `BATTLE_MAX_PER_SIDE = MAX_PER_SIDE = 500` (`battleScene.ts:721-723`, `cap_side` = `slice` `:5510`) |
| `src/domain/siege_battle_adapter_unit.rs` | `rosterToBattleUnits` + `runtimeToBattleUnit` (`main.ts:33158`; HP, tytul i premia dowodcy, `civBonusy`, trudnosc, glod/deficyt, `__canonical*`), helpery statystyk, `_attackRangeFor`, `_movementPointsFor`, `wallCrownShooterRange`; `SpawnFields` atakujacego (`:5458-5483`), obroncy wewnatrz (`:4527-4566`, morale x1,5) i na koronie (`:4694-4730`, katapulta `max(range, 6)` — `DEF_CATAPULT_CROWN_RANGE = 6`, `:4706`); `_applyStartingMoralePowerPenalty` (`:5597`) z `hpWeightedFieldPower`, `powerAdvantage`, `startingMoralePenaltyFrac`, `applyStartingMoralePenalty`; `counterMultiplier` (macierze atk x def i def x atk); `UnitBlowTemplate` (`toCombatUnit` -> `AttackerCu`/`DefenderCu`); `SetupUnit` (`ranged = attackRange >= 2`); `doctrine_auto_for` (D-T8-N1); `js_log10` (fdlibm) |
| `src/domain/siege_battle_adapter_body.rs` | `apply_terrain_range` + `is_wall_crown_shooter` (`:7490-7502`, `:7467-7470`, dlug T2b N3/D-B7), `siege_machine_range` (`:7530-7534`), `siege_struct_stats` (`_siegeStructureDamage`/`_attackWallTile`), `classify_unit_of`, `body_unit_inputs` z niezmiennikiem Z4 (`can_shoot` => `range_base >= 2`, katapulta korony >= 6), `activate_unit_for` (D-T8-N1, `doctrine_auto` ze stanu ciala), `tower_setup_for` (`_placeSiegeTowers` `:4158-4170`, `strongestRangedUnitForEra`, `towerRangeFor`, `towerRows`), `clamp_era`, `scene_inputs` (`siegeGateCol/Row`, `gateHp`, `siegeWallTilesInit`), `install_body_inputs` (wypelnia istniejacy `ProdBody`) |
| `src/domain/siege_battle_adapter_playable.rs` | `siege_inputs_from_playable(state, city_id, owner_era)`: jednostki, miasto (`maMur` `main.ts:46333`, Garnizon), relacje wojna/sojusz, gotowe machiny |
| `tests/p6_k5loop_adapter.rs` | 25 testow (§3), straznik czasu 90 s (`TIME_GUARD_SECS`) |
| `tests/p6_k5loop_adapter_gen.mjs` | generator wykonujacy tekst pinu (straznik SHA + straznicy linii) |
| `tests/p6_k5loop_adapter_vectors/{vectors.json,log10.json}` | 11 scenariuszy + 4011 par `Math.log10` V8 |

Nie ruszano: `siege_tactics_loop.rs`, `siege_tactics_atk*.rs`, `siege_tactics_actions.rs`, `battle_setup*.rs`,
`bridge.rs`, `renderer/`, `view-model/`, `Cargo.*`, `gra/**`, `REJESTR-RUST.md`.

### Elementy GOAL z dodatku r1b (zweryfikowane w r1d)

| Wymaganie | Stan |
|---|---|
| `gate_hp` jako Option albo jawny blad (dlug T2b N1) | `scene_inputs`: brak bramy / `gateHp` nie > 0 / NaN = `AdapterError::InvalidGate` (test `brama_bez_hp_to_jawny_blad`, M07/M08) |
| `siege_stats`, `range_base`, `siege_towers`, `tower_range`, teren | `body_unit_inputs` + `tower_setup_for` + `install_body_inputs` (test `wejscia_ciala_do_prodbody`, wektory `wiezyczki 312`, `strzelec_wiezy 8`, `taran 4`, `wieza_obl 2`) |
| `_applyTerrainRange` dla ProdBody | `apply_terrain_range` (test `zasieg_terenu_i_korony`, M01/M02/M14) |
| D-B11 `shooting_disabled` jako jedno zrodlo | `BodyUnitInputs::shooting_enabled` -> `activate.shooting_disabled` i `doctrine.shooting_enabled` (M06) |
| zasieg 6 katapulty obroncy na koronie | `DEF_CATAPULT_CROWN_RANGE = 6` (r1b poprawil 5 -> 6, pin `:4706`; M05/M12) |

## 2. Decyzje techniczne (do REJESTR-RUST przez orkiestratora)

- **D-ADP-1 (typ spoza `units.json`).** Pin `lookupUnitDef` (`main.ts:33003-33024`) zwraca rekord zastepczy
  (5/5/2/2/0/30/4, `Ruch w bitwie` 2); sciezka osiagalna (cywil `Robotnik` w rosterze obroncow, `Katapulta polowa`
  w s10). Port: `UnitDefFallback::PinRecord` (rekord 1:1 z pinu) albo `UnitDefFallback::Error`
  (`AdapterError::MissingUnitDef`). Rekomendacja dla T7: `PinRecord`.
- **D-ADP-2 (brak wiersza Milicji).** Pin pomija po cichu; port `AdapterError::MissingMilitiaRow` (na danych pinu
  nieosiagalne).
- **D-ADP-3 (NaN/Inf).** Liczbowe wejscia adaptera z NaN/Inf = `AdapterError::NonFinite`.
- **D-ADP-4 (dryf danych Rust).** `data/combat-params.json` (Milicja) i `data/units.json` roznia sie od pinu;
  adapter bierze `MilitiaParams::pin()` i wiersze jednostek jako jawne wejscie; zrodlo produkcyjne = REPIN.
- **D-ADP-5 (`Math.log10`).** `f64::log10` rozni sie od V8 o 1 ulp; port fdlibm, zgodnosc bit w bit na 4011
  argumentach (M17).
- **D-ADP-6 (szablony ciosu).** Pin liczy `atkMods`/`defMods`, `relativeHit`, teren i szarze wewnatrz `_singleBlow`
  w chwili ciosu; adapter daje wejscia statyczne (cu, macierz kontr, `bracesAgainstCharge`, `mounted`), skladanie
  `FullBlowInput` per cios = T7.
- **D-ADP-7 (luki stanu).** `PlayableState` nie ma generalow, licznika `garnizon`, `militiaRegenAtTurn`,
  `ufortyfikowanyWPolu`/`inGarnizon`, `pancerzBonusProc` -> `false`/`None` (dlug stanu, §8).
- **D-ADP-8 (brama, dlug T2b N1).** `gateHp` nie jest `0.0` po cichu: uklad bez bramy na murze, `gateHp <= 0` lub
  NaN = `AdapterError::InvalidGate` (pin `_carveWallTiles` zawsze daje `gateHp = 400`, `gateOpen = false`).
- **D-ADP-9 (D-B11).** Jedno pole `shooting_enabled` w `BodyUnitInputs`; obie kopie w ciele wypelniane z niego,
  niezmiennik `doctrine.shooting_enabled == !activate.shooting_disabled` z konstrukcji.
- **D-ADP-10 (Z4).** `body_unit_inputs` sprawdza niezmiennik T2b Z4 (`can_shoot` => `range_base >= 2`, katapulta
  korony => `range >= 6`); naruszenie = `AdapterError::InvariantViolated`, nie korekta po cichu.
- **D-ADP-11 (`_applyTerrainRange` jako funkcja czysta).** Pin wola ja przy zejsciu z korony (D-B7); adapter
  udostepnia `apply_terrain_range`/`is_wall_crown_shooter`, wpiecie w miejsca wolania = T7 (bez zmian
  `siege_tactics_loop.rs`).

Gameplay bez odstepstw od webu; pytan ABC brak.

## 3. Testy i wektory

`tests/p6_k5loop_adapter.rs` — 25 testow:

1. `adapter_zgodny_z_tekstem_pinu` — 11 scenariuszy pinu: `s1-piechota`, `s2-jazda-machiny-milicja`, `s3-koalicja`,
   `s4-przewaga`, `s5-general` (= `AttackerHasGeneral`, poza zakresem = jawny blad), `s6-bez-muru`
   (= `CityWithoutWall`), `s7-bez-obroncow` (= `NoDefenders`), `s8-milicja-slabszy-atk`, `s9-odnowa-general-obroncy`,
   `s10-palisada-katapulta-polowa`, `s11-mur-egipt-bez-epoki`. Porownanie: rostery (id, kolejnosc), Milicja, kazda
   jednostka (nazwa, kategoria, `stats`, HP, premie, spawn 17 pol, morale po karze, `cu` 13 pol, `SetupUnit.ranged`,
   `bracesAgainstCharge`), kara (mAtk, mDef, ratio, frac), macierze kontr, wejscia ciala/wiez.
2. `js_log10_zgodny_z_v8` (4011 par).
3. Negatywne (brak cichych zer): `brak_definicji_jednostki_to_blad`, `brak_kontekstu_wlasciciela_to_blad`,
   `brak_wiersza_milicji_to_blad`, `nan_i_inf_w_danych_to_blad`, `brama_bez_hp_to_jawny_blad`.
4. Pozostale: `rekord_zastepczy_pinu_dla_typu_spoza_units_json`, `roster_atakujacego_bez_listy_wlascicieli`,
   `katapulta_korony_i_amunicja_ulamkowa`, `macierz_kontr_reguly_pinu`, `doktryna_auto_ze_stanu_ciala`,
   `stan_gry_mapowany_na_wejscia_rosterow`, `bez_obwarowania_brak_wiezyczek`, `clamp_era_jak_pin`,
   `zasieg_terenu_i_korony`, `wiezyczki_omijaja_oba_kafle_bramy`, `wejscia_ciala_do_prodbody`,
   `niezmienniki_wejsc_ciala`, `limit_strony_jak_pin`.
5. Nowe w r1d (zabijaja przezywajace mutanty): `zasieg_machiny_granica_jeden` (M04), `korona_zaokragla_w_gore`
   (M15), `kara_morale_sufit` (M16), `kara_morale_podloga_nie_podnosi` (M18), `obronca_zasieg_jeden_nie_strzela`
   (M22), rozszerzenie `doktryna_auto_ze_stanu_ciala` o pusty `groupId` (M23). Kazdy zweryfikowany z tekstem pinu
   (`combat.ts:1349-1356`, `:1438-1457`; `battleScene.ts:4548-4551`, `:7530-7534`, `:17612-17630`;
   `city-defense.ts:139-142`).

Liczniki pokrycia (`coverage` w `vectors.json`, asercja w tescie): `scenariusze 11, bledy 3, wiezyczki 312,
strzelec_wiezy 8, machina_zasieg_6 2, taran 4, wieza_obl 2, milicja 17, machiny 5, korona 14, katapulta_korona 2,
jazda 4, strzelcy 29, sojusznik_atk 1, sojusznik_def 1, kara_atk 3, kara_def 5, weteran 3, general_obroncy 1`.

Regeneracja: `node rust-port/engine/tests/p6_k5loop_adapter_gen.mjs` — sprawdzone w r1d: wynik bajt w bajt
(`git status` czysty po uruchomieniu).

## 4. Mutanty

Skrypt odtworzony w r1c i uzyty w r1d: `01-operator-r1-mutanty.py` (ten katalog; kopia robocza w scratchpadzie
`adapter/ms`, `CARGO_TARGET_DIR=adapter/t`). Jeden mutant naraz, plik przywracany po kazdym; werdykt = wynik
`cargo test --test p6_k5loop_adapter`.

| ID | Mutacja | Wynik (r1d) | Test zabijajacy |
|---|---|---|---|
| M01 | strzelec korony bez `side_def` | ZABITY | `zasieg_terenu_i_korony` |
| M02 | `apply_terrain_range` bez `max(0)` | ZABITY | `zasieg_terenu_i_korony` |
| M03 | `_siegeMachineRange` katapulta 6 -> 5 | ZABITY | `wejscia_ciala_do_prodbody`, wektory, `zasieg_machiny_granica_jeden` |
| M04 | `_siegeMachineRange` `>= 1` -> `> 1` | ZABITY (r1c: przezyl) | `zasieg_machiny_granica_jeden` |
| M05 | Z4 minimum katapulty korony 6 -> 2 | ZABITY | `niezmienniki_wejsc_ciala` |
| M06 | D-B11 `shooting_enabled` false | ZABITY | `niezmienniki_wejsc_ciala`, `wejscia_ciala_do_prodbody` |
| M07 | `InvalidGate` `gate_hp > 0` -> `>= 0` | ZABITY | `brama_bez_hp_to_jawny_blad` |
| M08 | `InvalidGate` bez `gate_open` | ZABITY | `brama_bez_hp_to_jawny_blad` |
| M09 | `doctrine_auto` stala `true` | ZABITY | `niezmienniki_wejsc_ciala` |
| M10 | `clamp_era` bez `+0.5` | ZABITY | `clamp_era_jak_pin` |
| M11 | wiezyczki `gate_row_lo` | ZABITY | `wiezyczki_omijaja_oba_kafle_bramy` |
| M12 | zasieg katapulty korony 6 -> 5 | ZABITY | `katapulta_korony_i_amunicja_ulamkowa`, wektory |
| M13 | morale obroncow x1,5 -> x1 | ZABITY | wektory |
| M14 | korona x2 -> x1 | ZABITY | `korona_zaokragla_w_gore`, wektory, `zasieg_terenu_i_korony` |
| M15 | korona `ceil` -> `floor` | ZABITY (r1c: przezyl) | `korona_zaokragla_w_gore` |
| M16 | kara morale bez sufitu | ZABITY (r1c: przezyl) | `kara_morale_sufit` |
| M17 | `js_log10` -> `f64::log10` | ZABITY | wektory |
| M18 | podloga kary bez `min(morale)` | ZABITY (r1c: przezyl) | `kara_morale_podloga_nie_podnosi` |
| M19 | kara bez podlogi | ZABITY | wektory, `kara_morale_podloga_nie_podnosi` |
| M20 | `powerAdvantage` slabsza strona | ZABITY | wektory |
| M21 | `hpWeightedFieldPower` bez zaokraglenia 0,1 | ZABITY | wektory |
| M22 | obronca `rangedBase` `>= 2` -> `>= 1` | ZABITY (pierwszy przebieg r1d: przezyl) | `obronca_zasieg_jeden_nie_strzela` |
| M23 | `doctrine_auto_for` pusty `groupId` | ZABITY (pierwszy przebieg r1d: przezyl) | `doktryna_auto_ze_stanu_ciala` |
| M24 | kontra bez `COUNTER_MULT` dla nieparsowalnego bonusu | ZABITY | `macierz_kontr_reguly_pinu` |
| M25 | roster szturmu promien 1 -> 2 | ZABITY | `roster_atakujacego_bez_listy_wlascicieli`, wektory |
| M26 | `MAX_PER_SIDE` 500 -> 120 | ZABITY | `limit_strony_jak_pin` |
| M27 | cywile obroncy spoza heksu | ZABITY | wektory |
| M28 | `militiaSplit` `ceil` -> `floor` | ZABITY | wektory |
| M29 | `collectSiegeDefRoster` bez `owner_first` | ZABITY | wektory |
| M30 | id machin (indeks) | ZABITY | `stan_gry_mapowany_na_wejscia_rosterow`, wektory |
| M31 | `maMur` bez palisady | ZABITY | `stan_gry_mapowany_na_wejscia_rosterow` |

Wynik: **31/31 ZABITYCH, 0 rownowaznych.** Przebieg 1 r1d (HEAD `240a83136`): 29/31, przezyly M22, M23 ->
dopisane testy (`39d8cb14e`) -> przebieg 2 (`M22 M23`): 2/2 ZABITE. Uwaga do numeracji: lista r1b (M02, M05, M06, M07,
M12, M16, M18 przezyly) przepadla wraz ze skryptem; numeracja powyzej to skrypt odtworzony w r1c — wszystkie
wymienione w dodatku r1c klasy (korona 6, `InvalidGate`, Z4, `doctrine_auto`, kara morale, `log10`) sa pokryte.

## 5. Bramki (EXIT), `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR=scratchpad/adapter/t2`

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 (na `39d8cb14e`) |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 (na `39d8cb14e`) |
| `cargo test --test p6_k5loop_adapter` | 25/25 ok (na `39d8cb14e`), `finished in 0.14s` |
| `--test p6_battle_setup_units --test p6_battle_setup --test bridge_contract --test p6_k5loop_siege_atk_a --test p6_k5loop_siege_def --test p6_k5doc_t8` | 7, 15, 9, 7, 10, 6 ok — EXIT 0 (na `240a83136`; kolejny commit zmienia tylko plik testu adaptera) |
| pelny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, log `scratchpad/adapter/full.log`) | **EXIT 0**, HEAD `240a83136`, 01:31:53Z–01:49:44Z; 541 binarek testowych, 4100 ok, 0 failed, 1 ignored (`e2e::dump_tick1_econ_for_web_generator`, poza tematem, istniejacy); `p6_k5loop_adapter` w tym przebiegu 24/24. Zmiana `240a83136 -> 39d8cb14e` = wylacznie `tests/p6_k5loop_adapter.rs` (+2 asercje/1 test), ponownie uruchomiony osobno: 25/25 |
| generator pinu | bajt w bajt (brak diffu) |

## 6. Granice zakresu (czego NIE ma, jawnie)

- Brak wpiecia w most i `SiegeLoop` (#369/T7). `install_body_inputs` wypelnia istniejacy `ProdBody`; pozycje
  (`place_units`, T5b), `terrain_defence_mult` i teren kafla sa wejsciem wolajacego.
- `FullBlowInput` per cios (D-ADP-6), RNG — T7.
- Wiersze `SiegeWallRows::from(&layout)`, `siege_gate_col/row`, `siege_wall_tiles_init` sa z T5a (`SiegeLayout`);
  adapter je przenosi do `SceneInputs`, nie liczy od nowa.

## 7. Ryzyka

- Dane Rust vs pin (D-ADP-4): produkcja na `data/*` Rust da inne liczby niz pin do czasu REPIN.
- Mnozniki civ zasiegu/ruchu zmierzone w wektorach dla 6 cywilizacji (+ syntetyczny `walka_zasieg_proc` w testach
  M04/M22). Pozostale cywilizacje NIE_ZMIERZONO.
- Dysk przy starcie r1d: 6,1 GB (< 8 GB z dispatchu); uzyto cache `scratchpad/adapter` wskazanego w dodatku r1d,
  bez buildu renderera; minimum w trakcie 4,8 GB.

## 8. Dlugi

| ID | Dlug | Dla |
|---|---|---|
| D-ADP-L1 | Budowa `ProdUnit`/`ProdBody`/`ActivateScene`/`SiegeEnv` z pozycjami + `place_units`, `FullBlowInput` per cios, RNG, wpiecie `apply_terrain_range` w miejsca wolania pinu | #369 (T7) |
| D-ADP-L2 | Porownanie `tower_shooter_nazwa`/`towerRange` z pelna petla (dzis tylko wejscia) | T7 |
| D-ADP-L3 | Generalowie, `garnizon`, `militiaRegenAtTurn`, `ufortyfikowanyWPolu`/`inGarnizon`, `pancerzBonusProc` w `PlayableState` | stan / SAVE-LOAD |
| D-ADP-L4 | REPIN danych: `units.json`, `combat-params.json` blok Milicji | REPIN |
| D-ADP-L5 | Renderer `MAX_PER_SIDE = 120` vs pin 500 | DTO-BRIDGE |
| D-ADP-L6 | `peek`/`consumeReadyMachines` (zuzycie machin po bitwie) | T8 (#354) |
| D-ADP-L7 | `_placeUnitsOneSide`, snapshoty `_savedAtkBUs` | K5EXEC / T7 |
| D-ADP-L8 | Pokrycie mnoznikow civ dla wszystkich cywilizacji (dzis 6) | T7 / REPIN |
| T4 | Brak zmian dla T4 (tagi ciala) z tego tematu | — |

## 9. Commit i sprzatanie

- Galaz `rust-port-wip/k5loop-adapter-q1-op-r1d` (rodzic `fbe3d8d2c`): `240a83136` (testy M04/M15/M16/M18),
  `39d8cb14e` (testy M22/M23), nastepnie commit tego raportu + `01-operator-r1-mutanty.py`. Trailer tylko
  `Claude-Session:`.
- Bez push/deploy/integracji (zakaz).
- Cache `scratchpad/adapter` (t, t2, t3, ms) pozostawiony zgodnie z dodatkiem r1d („nie kasuj”) do uzycia przez
  Evaluatora; do usuniecia przez orkiestratora po zamknieciu tematu.
