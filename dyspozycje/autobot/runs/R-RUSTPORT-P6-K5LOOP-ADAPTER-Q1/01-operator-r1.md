# R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 — Operator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (T6)
GOAL: adapter PlayableState -> rostery szturmu, jednostki bitwy (BattleUnit), pola runtime spawnu, kara morale
      startowa, szablony ciosu (cu + macierz kontr), SetupUnit, doctrine_auto (D-T8-N1); rowne wektorom pinu.
ZMIANY/COMMIT: __SHA__ (galaz rust-port-wip/k5loop-adapter-q1, rodzic = baza 5f46a7e18)
TESTY: fmt/clippy/nowy test/6 testow z bramki EXIT 0; pelny engine: patrz §6 (__FULL__)
BLOKADY: brak blokad kodu; dlugi w §8 (T7 #369, DTO-BRIDGE, REPIN)
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Opus)
DEPLOY/PUSH: NIE WYKONANO
```

BAZA: `origin/rust-port/parity-v2` = `5f46a7e18` (zgodnie z dispatchem, sprawdzone `git rev-parse` przy starcie).
Pin webu: `07d2fbd72` (odczyt `git show`/`git archive`, `gra/` bez zmian).

## 1. Co zrobiono (kod, allowlista)

Nowe pliki (bez zmian w istniejacych plikach produkcyjnych poza 3 liniami `pub mod` w `domain/mod.rs`):

| Plik | Zawartosc (port pinu) |
|---|---|
| `rust-port/engine/src/domain/siege_battle_adapter.rs` | `AdapterError`; rostery: `collectAtkRosterNearCity` (+`collectUnitsInRadius`, `shouldIncludeInBattleRoster`, `isCivilianUnit`), `collectDefRosterNearCity`, `defenderUnitsNearCity`, `hasCityDefenders`, Milicja (`militiaRegenTurnsLeft`, `militiaHeadcount`, `militiaSplit`, `militiaEraKey`, `buildMilitiaDef`, `buildMilitiaSquad`, `collectCityDefRoster`), `collectSiegeDefRoster`, `appendReadyMachinesToRoster`, limit `BATTLE_MAX_PER_SIDE = 500`; `collect_siege_rosters` = kolejnosc `launchSiegeStormFromMap` (`main.ts:36808-36835`) z istniejacym portem `siegeBattleSideOwners`; `MilitiaParams::pin()` |
| `rust-port/engine/src/domain/siege_battle_adapter_unit.rs` | `rosterToBattleUnits` + `runtimeToBattleUnit` (HP: `effectiveRuntimeUnitMaxHp`/`syncRuntimeUnitHpState`, tytul dowodcy, premia morale dowodcy, `civBonusy`, `difficultyCombatMult`, glod/deficyt bez cywilow, `__canonical*`); helpery statystyk (`movementPoints`, `attackRange`, `isRanged`, `ammoCount`, `isAntiCavSpear`, `isPhalanx`, `bracesAgainstCharge`, `isNeverRout`, `moraleBaseFor` z weteranem i dowodca, `fleeMoraleFor`, `civUnitShapeForBattleUnit`); metody sceny `_attackRangeFor`, `_movementPointsFor`, `_applyTerrainRange` + `wallCrownShooterRange`; pola spawnu `SpawnFields` dla atakujacego (`:5458-5483`, BEZ mnoznikow civ), obroncy wewnatrz muru (`:4527-4566`, morale x1,5) i na koronie (`:4694-4730`, katapulta `max(range,6)`, `onWallWalkway`, x2 zasiegu strzelca); `_applyStartingMoralePowerPenalty` (`hpWeightedFieldPower`, `powerAdvantage`, `startingMoralePenaltyFrac`, `applyStartingMoralePenalty`); `normCounters` + `counterMultiplier` (macierz par atk x def i def x atk); `UnitBlowTemplate` (`toCombatUnit` -> `AttackerCu`/`DefenderCu`, `bracesAgainstCharge`, `mounted`); `SetupUnit` z flaga `ranged = attackRange >= 2` (D-T5b-1); `doctrine_auto_for` (D-T8-N1, przez `is_unit_doctrine_auto` ze stanu ciala); `js_log10` (port fdlibm/V8 `Math.log10`) |
| `rust-port/engine/src/domain/siege_battle_adapter_playable.rs` | `siege_inputs_from_playable(state, city_id, owner_era)`: jednostki (`ruch_jednostka_of` + HP/postep z `economy.units`), miasto (pozycja, populacja, `maMur` jak `main.ts:46333`, Garnizon z `stores.buildings_by_city`), relacje wojna/sojusz z `war.diplomacy`, gotowe machiny |
| `rust-port/engine/tests/p6_k5loop_adapter.rs` | 12 testow (§3) |
| `rust-port/engine/tests/p6_k5loop_adapter_gen.mjs` | generator: WYKONUJE tekst pinu (moduly czyste w calosci przez wlasny loader TS, wycinki `main.ts` i `battleScene.ts`), straznik SHA-256 `3db0905b…927d68` + straznicy linii |
| `rust-port/engine/tests/p6_k5loop_adapter_vectors/{vectors.json,log10.json}` | wektory (9 scenariuszy) i 4011 par `Math.log10` V8 |

Nie ruszano: `siege_tactics_loop.rs`, `siege_tactics_atk*.rs`, `siege_tactics_actions.rs`, `battle_setup*.rs`, `bridge.rs`,
`renderer/`, `view-model/`, `Cargo.*`, `gra/**`, `REJESTR-RUST.md`. Zadnej zmiany widocznosci w istniejacych modulach
(wszystko potrzebne bylo juz `pub`).

## 2. Decyzje techniczne (do REJESTR-RUST przez orkiestratora)

- **D-ADP-1 (typ spoza `units.json`).** Pin `lookupUnitDef` (`main.ts:33003-33024`) zwraca jawny rekord zastepczy (5/5/2/2/0/30/4,
  `Ruch w bitwie` 2). Wektory pokazaly, ze to sciezka OSIAGALNA w grze: cywil `Robotnik` na heksie miasta wchodzi do rosteru
  obroncow, a `units.json` pinu nie ma wiersza `Robotnik`/`Osadnik`. Port: `UnitDefFallback::PinRecord` (rekord 1:1 z pinu,
  produkcja/parytet) albo `UnitDefFallback::Error` (`AdapterError::MissingUnitDef`, tryb scisly). To nie jest cicha wartosc
  domyslna: rekord jest tekstem pinu i jest jawnie wybierany przez wolajacego. Rekomendacja dla T7: `PinRecord`.
- **D-ADP-2 (brak wiersza Milicji).** Pin `buildMilitiaSquad` pomija brakujacy wiersz bez bledu; port zwraca
  `AdapterError::MissingMilitiaRow` (na danych pinu nieosiagalne: wszystkie 6 nazw `militia_roster` istnieja).
- **D-ADP-3 (NaN/Inf).** Wejscia liczbowe adaptera (statystyki definicji, `hp`, `battlesSurvived`, `parametryBonusProc`,
  `pancerzBonusProc`, populacja, `garnizon`, `militiaRegenAtTurn`, epoka, tura, trudnosc, delta zasiegu korony) z NaN/Inf =
  `AdapterError::NonFinite`. Pin dla `u.hp` nieskonczonego ustawia `maxHp` (`syncRuntimeUnitHpState`), a dla postepu NaN liczy 0;
  na danych gry te wartosci nie wystepuja (JSON zapisu ich nie niesie), dispatch wymaga jawnego bledu.
- **D-ADP-4 (dryf danych Rust).** `rust-port/engine/data/combat-params.json` ma `militia_pop_fraction 0.2` i brak
  `militia_morale_*`/`militia_roster` (pin: 1.0/0.5/0.5/3 + roster), a `data/units.json` rozni sie od pinu (MD5 `fec4796f…` vs
  `92269605…`, temat #27). Adapter bierze parametry Milicji (`MilitiaParams::pin()`) i wiersze jednostek jako jawne wejscie;
  testy uzywaja danych pinu z wektorow. Wybor zrodla danych w produkcji = REPIN (dlug, §8).
- **D-ADP-5 (`Math.log10`).** `f64::log10` rozni sie od V8 o 1 ulp (zmierzone: `log10(3.0095465393794747)` daje
  `0.4785010636067863` vs V8 `0.47850106360678624`), co przenosi sie na `startingMoralePenaltyFrac`. Port fdlibm
  (`e_log10.c` + `e_log.c`, ten sam algorytm co V8) — zgodnosc bit w bit na 4011 argumentach (`log10.json`).
- **D-ADP-6 (szablony ciosu).** Pin liczy `atkMods`/`defMods` (`civCombatStatMultipliers` z terenem kafla i runda szarzy),
  `relativeHit`, teren i `isCharge` WEWNATRZ `_singleBlow` (`:8812-8960`) w chwili ciosu. Statyczny `FullBlowInput` na pare
  bylby niezgodny z pinem po kazdym ruchu, wiec adapter daje statyczne wejscia (cu, `AttackerCu`/`DefenderCu`, macierz
  `counterMultiplier` dla wszystkich par, `bracesAgainstCharge`, `mounted`, kontekst civ/trudnosci), a skladanie
  `FullBlowInput` per cios nalezy do #369 (T7).
- **D-ADP-7 (luki stanu).** `PlayableState` nie ma generalow, licznika `garnizon`, `militiaRegenAtTurn`,
  `ufortyfikowanyWPolu`/`inGarnizon`, `pancerzBonusProc`. Mapowanie daje `false`/`None` zgodnie z modelem stanu (te byty w
  stanie nie istnieja); nie jest to zgadywanie danych, ale jest dlugiem stanu (§8).

Gameplay bez odstepstw od webu; pytan ABC brak.

## 3. Testy i wektory

`tests/p6_k5loop_adapter.rs` (straznik czasu 90 s w tescie wektorowym; wynik `finished in 0.05s`):

1. `adapter_zgodny_z_tekstem_pinu` — 9 scenariuszy pinu (6 bitew + 3 bledy): `s1-piechota`, `s2-jazda-machiny-milicja`,
   `s3-koalicja` (sojusznicy obu stron, cywile, Milicja po sojuszniku obroncy, glod/deficyt), `s4-przewaga` (12 jednostek,
   katapulty atakujacego, Milicja zelazo), `s5-general` (= `AttackerHasGeneral`, D-WIR-2), `s6-bez-muru` (= `CityWithoutWall`),
   `s7-bez-obroncow` (= `NoDefenders`), `s8-milicja-slabszy-atk` (tylko Milicja, kara x0,65 z podloga ucieczki), `s9-odnowa-general-obroncy`
   (odnowa Milicji, generał obroncy = tytul `Generał`, Zulusi/Chinczycy). Porownanie: id i kolejnosc rosterow, definicje Milicji (caly
   wiersz), dla kazdej jednostki: `nazwa`, `kategoria`, `stats` (caly wiersz z `__canonical*`), HP/maxHp, ulamki postepu,
   premie, trudnosc, glod/deficyt, wszystkie pola spawnu (17), morale po karze, `cu` (13 pol), `SetupUnit.ranged`,
   `bracesAgainstCharge`; kara (mAtk, mDef, ratio, frac, slabsza strona); macierze kontr obu kierunkow.
   Liczby w wektorach jako tekst (`String(x)` JS / `parse::<f64>` Rust): `serde_json` bez `float_roundtrip` gubil 1 ulp.
2. `js_log10_zgodny_z_v8` — 4011 par, bit w bit.
3. Negatywne: `brak_definicji_jednostki_to_blad`, `brak_kontekstu_wlasciciela_to_blad`, `brak_wiersza_milicji_to_blad`,
   `nan_i_inf_w_danych_to_blad` (NaN w statystyce, NaN/Inf w HP, NaN w `battlesSurvived`, -Inf w `parametryBonusProc`,
   NaN trudnosci, Inf populacji, NaN delty korony).
4. `rekord_zastepczy_pinu_dla_typu_spoza_units_json`, `roster_atakujacego_bez_listy_wlascicieli`,
   `katapulta_korony_i_amunicja_ulamkowa`, `macierz_kontr_reguly_pinu`, `doktryna_auto_ze_stanu_ciala`,
   `stan_gry_mapowany_na_wejscia_rosterow` (PlayableState: bez muru, sam Garnizon, palisada+Garnizon, machina, kotwica,
   nieznane miasto).

Liczniki pokrycia (nazwy z generatora, zmierzone): `scenariusze 9, bledy 3, milicja 17, machiny 2, korona 11,
katapulta_korona 1, jazda 4, strzelcy 25, sojusznik_atk 1, sojusznik_def 1, kara_atk 2, kara_def 4, weteran 3,
general_obroncy 1`; w Rust: porownane jednostki >= 40, pary kontr >= 100 (asercje).

Regeneracja: `node rust-port/engine/tests/p6_k5loop_adapter_gen.mjs` (wynik bajt w bajt, ziarno nie jest potrzebne — brak
losowosci).

## 4. Mutanty

__MUTANTS__

## 5. Bramki (EXIT), `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` w scratchpadzie tematu (`adapter/target`, usuniety po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p6_k5loop_adapter` | 12/12 ok |
| `--test p6_battle_setup_units --test p6_battle_setup --test bridge_contract --test p6_k5loop_siege_atk_a --test p6_k5loop_siege_def --test p6_k5doc_t8` | 7, 15, 9, 7, 10, 6 ok — EXIT 0 |
| pelny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`) | __FULL__ |

## 6. Granice zakresu (czego NIE ma, jawnie)

- Brak wpiecia w most i `SiegeLoop`/`ProdBody` (dispatch: #369/T7). `ProdUnit`, `ProdBody::units`, `ActivateScene`,
  `SiegeEnv` nie sa budowane przez adapter: wymagaja pozycji z rozstawienia (T5b `place_units`) i decyzji sterownika (T7).
  Adapter daje komplet wejsc jednostkowych do tych struktur (`SetupUnit` dla `place_units`, `SpawnFields` = pola `ru`,
  `doctrine_auto`, `is_catapult`, `ammo`, `ranged_base`, `names` = `AdapterBattleUnit::nazwa`).
- `tower_shooter_nazwa` (`strongestRangedUnitForEra`, `city-towers.ts:105`) i `siege_gate_col/row`, `siege_wall_tiles_init`,
  `SiegeWallRows::from(&layout)` sa juz wyjsciem T5a (`battle_setup::SiegeLayout`) — adapter ich nie dubluje; zlozenie = T7.
- `siege_machine_range` per jednostka = `_siegeMachineRange(ru)` (`:7530-7534`) = `attack_range_for` (jest) z regula
  `r >= 1 ? r : (katapulta ? 6 : 1)` — wolanie przy budowie `ProdBody` w T7.

## 7. Ryzyka

- Dane Rust vs pin (D-ADP-4): produkcja na `rust-port/engine/data/*` da inne liczby niz pin, dopoki REPIN danych nie zamknie
  dryfu `units.json`/`combat-params.json`.
- `civ_bonuses` (Rust) liczy mnozniki zasiegu/ruchu z danych `civ-matrix.json` Rust; w wektorach zgodne dla 6 cywilizacji
  (rzymianie, grecy, egipt, sumer, chinczycy, zulusi). Pozostale cywilizacje NIE_ZMIERZONO.

## 8. Dlugi

| ID | Dlug | Dla |
|---|---|---|
| D-ADP-L1 | Budowa `ProdUnit`/`ProdBody`/`ActivateScene`/`SiegeEnv` z wyjsc adaptera + `place_units` (pozycje), `FullBlowInput` per cios (D-ADP-6), RNG | #369 (T7) |
| D-ADP-L2 | `tower_shooter_nazwa` (`strongestRangedUnitForEra`) i `towerRange` — port `city_towers` do sprawdzenia przy T7 | T7 |
| D-ADP-L3 | Generalowie, licznik `garnizon`, `militiaRegenAtTurn`, `ufortyfikowanyWPolu`/`inGarnizon`, `pancerzBonusProc` w `PlayableState` (D-ADP-7) | stan / SAVE-LOAD |
| D-ADP-L4 | REPIN danych: `units.json` (MD5), `combat-params.json` blok Milicji (D-ADP-4) | REPIN |
| D-ADP-L5 | Renderer `MAX_PER_SIDE = 120` vs pin 500 (D-T5b-4) | DTO-BRIDGE |
| D-ADP-L6 | `peek`/`consumeReadyMachines` (zuzycie machin po bitwie) | T8 (#354) |
| D-ADP-L7 | `_placeUnitsOneSide`, snapshoty `_savedAtkBUs` (D-T5b-6/7) | tryb reczny K5EXEC / T7 |
| D-ADP-L8 | `civ_matrix`: pokrycie mnoznikow zasiegu/ruchu dla wszystkich cywilizacji (dzis 6) | T7 / REPIN |
| T4 | Zadnych zmian dla T4 (tagi ciala) z tego tematu | — |

## 9. Commit i sprzatanie

- Kod + raport: commit `__SHA__` na `rust-port-wip/k5loop-adapter-q1` (rodzic `5f46a7e18`), trailer tylko `Claude-Session:`.
- Bez push/deploy/integracji (zakaz). `CARGO_TARGET_DIR` (`scratchpad/adapter/target`) usuniety po bramkach.
