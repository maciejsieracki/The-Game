# P6 - zrodlo `getMaxHp` dla leczenia jednostek w ticku ekonomii (R-RUSTPORT-P6-ECON-TICK-HEAL-MAXHP-Q1)

Pin weba `4bbef081d` (czysty `git archive`), baza Rust `b0057c1c9` (`rust-port/parity-v2`). Dlug -Q7 pkt 4 z
`P6-ADVANCE-CITY-ECONOMY-Q6.md` sek. 8.

## 1. Lancuch `getMaxHp` (web) i status w Rust

Miejsce wywolania: `main.ts:34561-34568` (closure przekazany w `manpowerHeal`):
`effectiveMaxHp(unitHealth(def), unitParametryBonusFrac(liveUnit), veteranCombatBonusFrac(liveUnit))`,
`def = data.units.find(ud => ud.Jednostka === typeId) ?? {}`. Wolajacy: `tickManpowerUnitReplenishment`
(`manpower.ts:275`, wywolanie `getMaxHp(u.typeId, u)` w `:319`) z `advanceCityEconomy` (`turn-economy.ts:2887-2909`).

| Funkcja | Web plik:linia | Rust | Status |
|---|---|---|---|
| closure `manpowerHeal.getMaxHp` | `main.ts:34561` | `unit_health::heal_max_hp` + `UnitHealthSource::{max_hp, as_get_max_hp}` | ZAPORTOWANE (nowe) |
| `effectiveMaxHp` | `unit-card-stats.ts:79` | `unit_health::effective_max_hp` | ZAPORTOWANE |
| `roundCardStat` | `unit-card-stats.ts:65` | `unit_health::round_card_stat` | ZAPORTOWANE |
| `applyMultiplier` | `civ-bonuses.ts:229` | `civ_bonuses::apply_multiplier` (`base*(1+f)`) - tu wpisane wprost, bonusy sumowane PRZED mnozeniem | ISTNIEJE (nieuzyte, bo suma frakcji jest czescia `effectiveMaxHp`) |
| `unitHealth` | `main.ts:29877` | `unit_health::unit_health` (typowany `UnitRecord.health_lc`) i `unit_health_value` (surowy JSON) | ZAPORTOWANE |
| `normFieldVal` | `main.ts:29777` | `unit_health::norm_field_val` + `js_parse_float` | ZAPORTOWANE |
| `unitParametryBonusFrac` / `Proc` | `unit-building-bonuses.ts:344` / `:223` | `combat::unit_building_bonuses::unit_parametry_bonus_frac` / `_proc` | ISTNIEJE (uzyte bez zmian) |
| `veteranCombatBonusFrac` | `veteran.ts:139` | `unit_health::veteran_combat_bonus_frac` | ZAPORTOWANE |
| `veteranStarCount` | `veteran.ts:118` | `unit_health::veteran_star_count` | ZAPORTOWANE |
| `veteranBonusFracForWins` + `VETERAN_BONUS_FRAC` | `veteran.ts:123`, `:71` | `unit_health::veteran_bonus_frac_for_wins`, `VETERAN_BONUS_FRAC` | ZAPORTOWANE |
| `veteranBattlesWon` | `veteran.ts:95` | `unit_health::veteran_battles_won` | ZAPORTOWANE |
| `VETERAN_MAX_BATTLES_TRACKED` | `veteran.ts:65` | `unit_health::VETERAN_MAX_BATTLES_TRACKED` | ZAPORTOWANE |
| `veteranLevel`, `veteranLevelFromBattles`, `veteranBonusFracForLevel`, `veteranBadgeLabel` | `veteran.ts:104-170` | brak | POZA ZAKRESEM (0 uzyc w lancuchu `getMaxHp`; UI/odznaki) |
| `effectiveRuntimeUnitMaxHp`, `syncRuntimeUnitHpState` | `main.ts:29885`, `:29894` | brak | DLUG -Q2 (inne miejsca wywolania: karta, zapis/odczyt, awanse `main.ts:6788,6944,7130,7163`; budowane z tych samych funkcji, ale `lookupUnitDef` `main.ts:29787` ma inny fallback niz closure ticku) |
| `effectiveMaxHp` w walce | `combat.ts:925,938` (po `applyMultiplier` civ) | brak w `combat.rs` (HP bitwy wchodzi jako `u32`) | DLUG -Q2 |
| `getMaxHp(typeId)` bez bonusow (glod armii, deficyt zlota) | `army-starvation.ts:62`, `gold-deficit.ts:225`; wolajacy `main.ts:34785,35011,35285` = `unitHealth(...)` | Rust `turn_economy.rs:680` przyjmuje `Fn(&str)->f64`; zrodlem moze byc `unit_health::unit_health` (typowany) | ZRODLO DOSTEPNE (wpiecie wolajacego poza zakresem) |

## 2. Dostarczone

* `domain/unit_health.rs` (nowy): wszystkie pozycje ZAPORTOWANE powyzej + `UnitHealthSource::new(&[UnitRecord])` z
  `as_get_max_hp()` - gotowe `get_max_hp` dla `HealRequest` / `AdvanceManpowerHealInput` / `run_economy_tick_for_game`
  (adapter nad produkcyjnym `data::units_combat::UnitRecord`, indeks = PIERWSZY wiersz o nazwie jak `Array.find`).
* Zmiana kontraktu: `get_max_hp` w `AdvanceManpowerHealInput` (`turn_economy_advance.rs`) i `HealRequest`
  (`turn_economy_tick.rs`) ma teraz typ `&dyn Fn(&str, &ManpowerHealUnit) -> f64` (zywa jednostka), bo web wola
  `getMaxHp(u.typeId, u)` (`manpower.ts:319`) i bez jednostki nie da sie odczytac `parametryBonusProc` /
  `battlesSurvived`. Poprzednio adapter odrzucal jednostke (`|type_id, _unit| get_max_hp(type_id)`).
  `turn_economy_wire.rs` kompiluje sie bez zmian (przekazuje pole dalej).

## 3. Zalozenia (do akceptacji)

* **Z-HM-1**: zmiana typu `get_max_hp` dotyka plikow spoza allowlisty: `turn_economy_tick.rs` (1 linia typu + komentarz)
  oraz trzech istniejacych testow (`tests/p6_adv_city_econ_heal.rs`, `p6_adv_q5_tick.rs`, `p6_adv_q6_wire.rs`: closure
  `|t|` -> `|t, _u|`, mechaniczne; ich wektory i asercje nietkniete). Alternatywy addytywne (nowe pole) wymagalyby edycji
  zakazanego `turn_economy_wire.rs`.
* **Z-HM-2**: `norm_field_val` dla wartosci spoza liczby/napisu: bool -> 0/1 (web zwraca bool, a `base * (1+f)` koercuje
  tak samo), tablica/obiekt -> `fallback` (web zwrocilby je bez zmian; dane pinu to zawsze liczby calkowite).
* **Z-HM-3**: pola `parametry_bonus_proc` / `battles_survived` w `ManpowerHealUnit` sa `Option<f64>`; napis w tych polach
  (web: `typeof !== 'number'` -> 0) odpowiada `None` (wynik identyczny).
* **Z-HM-4**: pulapka danych: `units.json` ma OBA klucze `health` (TW v3) i `Health` (legacy), rozne w 49 z 75 wierszy
  (Wojownik 22 vs 60). Web czyta `health ?? Health`, wiec Rust uzywa `UnitRecord.health_lc` (NIE `health`). Test
  `lowercase_health_wins_over_capital_health_in_typed_rows` zamraza 49 rozbieznosci.

## 4. Dowody

Generator `runs/R-RUSTPORT-P6-ECON-TICK-HEAL-MAXHP-Q1/gen-p6-heal-maxhp-vectors.mjs` (esbuild w `mktemp -d`, czysty
`git archive 4bbef081d`, zero buildu w `gra/`) uruchamia PRAWDZIWE `effectiveMaxHp`, `unitParametryBonusFrac`,
`veteran*`, `advanceCityEconomy` -> `tickManpowerUnitReplenishment`. Przepisane 1:1 z numerami linii: `normFieldVal`
(`main.ts:29777`), `unitHealth` (`:29877`), closure `getMaxHp` (`:34561`) - `main.ts` nie jest importowalny.
Fixture `tests/p6_heal_maxhp_vectors/maxhp.json` ok. 0,7 MB (limit 6 MB).

Test `tests/p6_heal_maxhp_wire.rs` (8 testow), porownanie bitowe: 148 wektorow `normFieldVal`, 196 `unitHealth`,
1176 `effectiveMaxHp` (siatka + wartosci specjalne + 300 losowych), weteran/parametry/wygrane, 390 wartosci closure
na realnych 75 wierszach `units.json` (+ nieznane typy), 400 scenariuszy e2e (343 leczace, 1640 wywolan `getMaxHp` w
kolejnosci weba, HP po leczeniu, `onUnitHpChanged`, pule miast, `healedCount`, `totalMpSpent`).
Weryfikator `verify-p6-heal-maxhp.py` (`python3 -I`, wlasne wzory, nie uzywa Rust/weba): patrz `verify-output.txt`.

## 5. Mutacje

38 mutantow (`mutate-heal-maxhp.py`, wynik `mutacje-wynik.txt`): zabitych 32, przezylo 6 (wszystkie rownowazne), 0 COMPILE.
Brutto 32/38 = 84,2%; po odjeciu rownowaznych 32/32 = 100% (kryterium: >= 90% brutto ALBO ekwiwalenty z dowodem).
H36 (pierwszy wiersz typu) przezyl do dodania testu `source_takes_first_row_of_duplicated_type_like_array_find`, od
tego czasu zabity. H07 i H09 oznaczone w skrypcie jako prawdopodobnie rownowazne - ZABITE (`-0`, brak sufitu gwiazdek).
H10/H11 puszczone ponownie po refaktorze na `clamp` (clippy).

Mutanty rownowazne (dowody):

* **H10** (`clamp(0.0, 3.0)` -> `min(3.0)`): `veteran_bonus_frac_for_wins` dostaje w lancuchu wylacznie
  `veteran_star_count >= 0`, a dla ujemnych `as usize` saturuje do 0 (rzutowanie f64 -> usize), czyli ten sam indeks.
* **H11** (bez `floor`): `veteran_star_count` zwraca juz `floor` (`veteran_battles_won`); `as usize` obcina
  nieujemne tak samo jak `floor`.
* **H21** (`< 1e-6` -> `< 0.0`): `r = round(n*10)/10` to `k/10` z calkowitego `k`; jest albo dokladna liczba calkowita
  (snap nic nie zmienia), albo odlegla o >= 0,1 od calkowitej (snap nie odpala) - dla |n| < 2^53; powyzej kazdy f64 jest
  calkowity.
* **H26/H27/H28** (strazniki `"—"`, `"---"`, `""` w `norm_field_val`): `parseFloat` tych napisow = NaN, a NaN
  -> `fallback` (`main.ts:29780`), czyli wynik identyczny (strazniki w webie sa redundantne; zachowane 1:1).

## 6. Bramki

fmt EXIT=0, clippy `--all-targets -D warnings` EXIT=0, `diff --check` (po `add -N`) EXIT=0, pelny `cargo test -j 2`
w 7 przebiegach (lib + 6 shardow po `--test`): 2066 passed / 0 failed (baza `b0057c1c9` 2057/0 + 9 nowych testow).
Logi `gate-*.txt`, kazdy z jedna linia `EXIT=`.

## 7. Dlug / dalsze kroki

* -Q2: `effectiveRuntimeUnitMaxHp` / `syncRuntimeUnitHpState` (`main.ts:29885,29894`) i miejsca awansu/ulepszenia
  (`main.ts:6788,6944,7130,7163`) - brak stanu `RuntimeUnit` w Rust; `lookupUnitDef` (`main.ts:29787`) ma inny fallback
  niz closure ticku.
* -Q2: HP bitwy (`combat.ts:925,938`) - `effective_max_hp` jest gotowy, wpiecie w `combat.rs` poza zakresem.
* Wpiecie `unit_health::unit_health` jako `get_max_hp(typeId)` dla glodu armii / deficytu zlota (`main.ts:34785,35011,35285`).
* NIE_ZMIERZONO: e2e przez `run_economy_tick_for_game` z adapterem (wektory Q6 uzywaja mapy `maxHpByType`); sciezka
  `advance_manpower_heal` jest ta sama, ktora tick wola (`turn_economy_tick.rs:301-313` przekazuje to samo pole).
