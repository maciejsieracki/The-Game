# P6.5A - jednostki: zycie, czesc A (`armyMerge.ts`, `unit-cost-tempo.ts`, `unit-replace-context.ts`)

Temat: `R-RUSTPORT-P6-5A-JEDNOSTKI-ZYCIE-A-Q1` (DOMAIN: GAME), runda 1/5, rola Operator.
Pin web: `edb8fb56`. Baza Rust: `origin/rust-port/parity-v2` (`1570419b`, silnik 595 testow).
Artefakty runu (generator, weryfikator, mutacje, logi bramek): `dyspozycje/autobot/runs/R-RUSTPORT-P6-5A-JEDNOSTKI-ZYCIE-A-Q1/`.

## 1. Werdykt rundy 1 (stan faktyczny)

| Pytanie | Odpowiedz |
|---|---|
| Co jest portowane? | Wszystkie eksporty i symbole prywatne z trzech plikow (tabela §3): 56 wierszy = 45 PORTOWANY, 8 PORTOWANY-Z-WSTRZYKNIETYMI (logika portowana, wartosci czesci zaleznosci z domkniec), 2 PORTOWANY-ZAWEZONY (typ stocku zawezony do u32, ZA6), 1 DANE-JUZ-W-RUST, 0 NIE-DOTYCZY, 0 RUNDA-2 w sensie symbolu zrodlowego. |
| Dowod "PORTOWANY" | Kod Rust + test + wektory z URUCHOMIONEGO weba (pin) + niezalezny weryfikator Python (0 rozbieznosci) + mutacje wykrywane (§6). |
| Co zostaje na kolejna runde / inny temat? | Zaleznosci importowane przez `armyMerge.ts`, ktore NIE naleza do tych trzech plikow, sa w Rust **wstrzykiwane domknieciami** (§4, ZA2) - ich wlasny port to osobne tematy (`auto-battle-power.ts`, `unit-building-bonuses.ts` = czesc B, `veteran.ts`). Konkretny typ `AvailabilityContext` (`production.ts`) - RUNDA-2 (§7). |
| Bramki | fmt `EXIT=0`, clippy `--all-targets -D warnings` `EXIT=0`, test `EXIT=0`: 626 przeszlo, 0 nie (595 bazowych + 31 nowych); surowe logi: `gate-fmt-r1.log`, `gate-clippy-r1.log`, `gate-test-r1.log`. |
| Zmiany poza allowlista | Brak (§9). |

## 2. Zrodla przeczytane w calosci (liczby linii)

Czytane w calosci komendami `sed -n` po wyodrebnieniu `git archive edb8fb56 gra/src gra/data` do wlasnego katalogu poza repo.

| Plik | Linie (`wc -l`) | Linie niepuste | Eksporty (regex `^export`) |
|---|---|---|---|
| `gra/src/game/armyMerge.ts` | 1015 | 954 | 48 (44 funkcje + 4 interfejsy/typy; `grep -cE '^export'` = 48, `^export function` = 44, `^export (interface\|type)` = 4) + 3 symbole prywatne (`NEIGH`, `stackGroupSeq`, `findRejectHex`) = 51 wierszy tabeli dla `armyMerge.ts`; razem z 3 + 2 pozostalych = 56 |
| `gra/src/game/unit-cost-tempo.ts` | 39 | 36 | 3 (`KOSZT_JEDNOSTEK_PACE`, `KosztJednostekPace`, `applyUnitCostPace`) |
| `gra/src/game/unit-replace-context.ts` | 63 | 60 | 2 (`ReplaceAvailabilityCtxParams`, `buildReplaceAvailabilityCtx`) |

Liczby niepuste zgadzaja sie z dispatchem (954 / 36 / 60). Liczba wierszy tabeli symboli (56 = 51 + 3 + 2) jest wymuszana skryptem `gen-symbols-p65a.py` (blad, gdy eksport TS nie ma wiersza albo wiersz wskazuje symbol spoza zrodla lub Rust).

Przeczytane dodatkowo (zaleznosci, tylko w zakresie uzytym przez `armyMerge.ts`): `game/auto-battle-power.ts` (`sumRosterFieldM`, `isFieldBattleUnit`), `game/unit-power.ts`, `game/unit-building-bonuses.ts` (`armorPathBadgeLevel`, `softPathBadgeLevel`, `pathBadgeLevelFromPp`), `game/veteran.ts` (`veteranLevel`, `veteranStarCount`), `units/setup.ts` (`RuntimeUnit`, `keyOf`), `game/production.ts` (`AvailabilityContext`), `data/combat-params.json` (`unit_power`). Dokumenty: `P6-25-MAPA-GAP.md` §4/§6/§6a/§9 (jego Z1-Z6 dotycza generatora map - NIE-DOTYCZY tutaj; wiersze P6.5 sa tylko propozycja P6.0 §6b), `P6-0-GAP-ANALYSIS.md` wiersze 16/169/171, wzorce P6.4 (`pathfinding.rs::ruch_jednostek`, `tests/p6_4_*`, skrypty runu P6.4).

## 3. Tabela symboli (kazdy eksport ma status)

Zrodlo: `symbols-p65a-r1.tsv` (generowana skryptem; kolumny `zrodlo_web`, `symbol`, `rodzaj`, `status`, `odpowiednik_rust`, `test`, `uwaga`).

| zrodlo_web | symbol | rodzaj | status | odpowiednik Rust | test | uwaga |
|---|---|---|---|---|---|---|
| `gra/src/game/armyMerge.ts:20` | `StackDisplayInfo` | interface | PORTOWANY | `src/domain/recruitment.rs:787` | p6_5a_display::compute_stack_display_matches_web_order_and_vitals | pola starving/goldDeficit ustawia wolajacy (main.ts); compute_stack_display zostawia None (klucze sprawdzone w wektorze) |
| `gra/src/game/armyMerge.ts:56` | `stackGroupIdOf` | function | PORTOWANY | `src/domain/recruitment.rs:475` | p6_5a_stack::stack_group_id_and_render_key_match_web + stack_group_id_agrees_with_p64_port_on_the_same_unit | drugi port na modelu StosJednostka; pierwszy w P6.4 (pathfinding.rs, DANE-JUZ-W-RUST dla RuchJednostka) - test zgodnosci obu |
| `gra/src/game/armyMerge.ts:64` | `sameStackGroup` | function | PORTOWANY | `src/domain/recruitment.rs:489` | p6_5a_stack::same_stack_group_and_stack_key_match_web | - |
| `gra/src/game/armyMerge.ts:71` | `freshStackGroupId` | function | PORTOWANY | `src/domain/recruitment.rs:505` | p6_5a_stack::fresh_and_shared_stack_group_ids_match_web_sequence | Date.now() = wejscie now_ms; licznik modulu = StackGroupSeq |
| `gra/src/game/armyMerge.ts:82` | `assignSharedStackGroupId` | function | PORTOWANY | `src/domain/recruitment.rs:520` | p6_5a_stack::fresh_and_shared_stack_group_ids_match_web_sequence | - |
| `gra/src/game/armyMerge.ts:88` | `visibleStackOnHex` | function | PORTOWANY | `src/domain/recruitment.rs:540` | p6_5a_stack::visible_colocated_and_garrison_queries_match_web | - |
| `gra/src/game/armyMerge.ts:110` | `coLocatedForMergePrompt` | function | PORTOWANY | `src/domain/recruitment.rs:560` | p6_5a_stack::visible_colocated_and_garrison_queries_match_web | - |
| `gra/src/game/armyMerge.ts:128` | `adjacentVisibleArmyHexes` | function | PORTOWANY | `src/domain/recruitment.rs:588` | p6_5a_stack::adjacent_army_hexes_and_active_stack_match_web | - |
| `gra/src/game/armyMerge.ts:161` | `activeUnitStack` | function | PORTOWANY | `src/domain/recruitment.rs:630` | p6_5a_stack::adjacent_army_hexes_and_active_stack_match_web | - |
| `gra/src/game/armyMerge.ts:176` | `enterGarnizon` | function | PORTOWANY | `src/domain/recruitment.rs:647` | p6_5a_stack::garrison_and_field_fortify_transitions_match_web | - |
| `gra/src/game/armyMerge.ts:193` | `exitGarnizon` | function | PORTOWANY | `src/domain/recruitment.rs:657` | p6_5a_stack::garrison_and_field_fortify_transitions_match_web | - |
| `gra/src/game/armyMerge.ts:219` | `enterFieldFortify` | function | PORTOWANY | `src/domain/recruitment.rs:670` | p6_5a_stack::garrison_and_field_fortify_transitions_match_web + transition_chains_* | obie fortyfikacje naraz osiagalne (lancuchy) |
| `gra/src/game/armyMerge.ts:238` | `exitFieldFortify` | function | PORTOWANY | `src/domain/recruitment.rs:678` | p6_5a_stack::garrison_and_field_fortify_transitions_match_web | - |
| `gra/src/game/armyMerge.ts:317` | `allDefendersFortifiedInGarnizon` | function | PORTOWANY | `src/domain/recruitment.rs:690` | p6_5a_stack::all_defenders_and_wake_stack_match_web | - |
| `gra/src/game/armyMerge.ts:324` | `pickStackRepresentative` | function | PORTOWANY | `src/domain/recruitment.rs:715` | p6_5a_display::representative_matches_web_including_utf16_id_order_and_nan_attack | pusty stos: web rzuca TypeError, Rust zwraca None (zmierzone w wektorze: threw=true) |
| `gra/src/game/armyMerge.ts:337` | `garrisonUnitsOnHex` | function | PORTOWANY | `src/domain/recruitment.rs:610` | p6_5a_stack::visible_colocated_and_garrison_queries_match_web | - |
| `gra/src/game/armyMerge.ts:378` | `stackRenderKey` | function | PORTOWANY | `src/domain/recruitment.rs:740` | p6_5a_stack::stack_group_id_and_render_key_match_web | - |
| `gra/src/game/armyMerge.ts:383` | `computeStackDisplay` | function | PORTOWANY-Z-WSTRZYKNIETYMI | `src/domain/recruitment.rs:798` | p6_5a_display::compute_stack_display_matches_web_order_and_vitals | kolejnosc Set/Map zachowana; zaleznosci vitals wstrzykiwane |
| `gra/src/game/armyMerge.ts:448` | `unitAtRepresentative` | function | PORTOWANY | `src/domain/recruitment.rs:845` | p6_5a_display::unit_at_representative_matches_web | - |
| `gra/src/game/armyMerge.ts:463` | `findAdjacentEmptyHexes` | function | PORTOWANY | `src/domain/recruitment.rs:870` | p6_5a_ruch::adjacent_empty_and_split_destinations_match_web | - |
| `gra/src/game/armyMerge.ts:483` | `SplitDestHex` | interface | PORTOWANY | `src/domain/recruitment.rs:894` | p6_5a_ruch::adjacent_empty_and_split_destinations_match_web | - |
| `gra/src/game/armyMerge.ts:494` | `findSplitDestHexes` | function | PORTOWANY | `src/domain/recruitment.rs:901` | p6_5a_ruch::adjacent_empty_and_split_destinations_match_web | etykieta z army-merge-params.json |
| `gra/src/game/armyMerge.ts:512` | `assignBounceHexesForUnits` | function | PORTOWANY | `src/domain/recruitment.rs:927` | p6_5a_ruch::bounce_hex_assignment_matches_web_including_duplicates_and_blocking | - |
| `gra/src/game/armyMerge.ts:559` | `findBounceHexFromOrigin` | function | PORTOWANY | `src/domain/recruitment.rs:1009` | p6_5a_ruch::bounce_from_origin_and_separate_return_hex_match_web | wraz z prywatnym findRejectHex (fn find_reject_hex) |
| `gra/src/game/armyMerge.ts:593` | `stackKey` | function | PORTOWANY | `src/domain/recruitment.rs:388` | p6_5a_stack::same_stack_group_and_stack_key_match_web | = keyOf (P6.4: ruch_jednostek::key_of) |
| `gra/src/game/armyMerge.ts:621` | `computeSeparateReturn` | function | PORTOWANY | `src/domain/recruitment.rs:1020` | p6_5a_ruch::separate_return_matches_web_bitwise | - |
| `gra/src/game/armyMerge.ts:667` | `resolveSeparateReturnHex` | function | PORTOWANY | `src/domain/recruitment.rs:1038` | p6_5a_ruch::bounce_from_origin_and_separate_return_hex_match_web | - |
| `gra/src/game/armyMerge.ts:683` | `stackHudMergeSplitActions` | function | PORTOWANY | `src/domain/recruitment.rs:1069` | p6_5a_ruch::hud_actions_match_web | identyfikatory i etykiety z army-merge-params.json |
| `gra/src/game/armyMerge.ts:707` | `stackRuchLeft` | function | PORTOWANY | `src/domain/recruitment.rs:1108` | p6_5a_ruch::ruch_pools_match_web_bitwise | - |
| `gra/src/game/armyMerge.ts:717` | `planningStackRuchLeft` | function | PORTOWANY | `src/domain/recruitment.rs:1124` | p6_5a_ruch::ruch_pools_match_web_bitwise | - |
| `gra/src/game/armyMerge.ts:722` | `planningUnitRuchLeft` | function | PORTOWANY | `src/domain/recruitment.rs:1116` | p6_5a_ruch::ruch_pools_match_web_bitwise | - |
| `gra/src/game/armyMerge.ts:735` | `wakeStackForMoveOrder` | function | PORTOWANY | `src/domain/recruitment.rs:695` | p6_5a_stack::all_defenders_and_wake_stack_match_web | - |
| `gra/src/game/armyMerge.ts:754` | `stackRuchMax` | function | PORTOWANY | `src/domain/recruitment.rs:1132` | p6_5a_ruch::ruch_pools_match_web_bitwise | - |
| `gra/src/game/armyMerge.ts:775` | `stackHpPool` | function | PORTOWANY | `src/domain/recruitment.rs:1140` | p6_5a_display::hp_pool_matches_web_including_nonfinite_and_overfull_hp | - |
| `gra/src/game/armyMerge.ts:833` | `stackFieldPowerM` | function | PORTOWANY-Z-WSTRZYKNIETYMI | `src/domain/recruitment.rs:1163` | p6_5a_display::field_power_passes_roster_in_web_order_and_returns_sum | sumRosterFieldM (auto-battle-power.ts) wstrzykiwane; roster (typ+definicja, kolejnosc) asertowany wzgledem weba |
| `gra/src/game/armyMerge.ts:854` | `stackArmorBadgeLevel` | function | PORTOWANY-Z-WSTRZYKNIETYMI | `src/domain/recruitment.rs:1201` | p6_5a_display::badge_and_veteran_maxima_match_web | armorPathBadgeLevel (unit-building-bonuses.ts, czesc B) wstrzykiwane |
| `gra/src/game/armyMerge.ts:864` | `stackSoftBadgeLevel` | function | PORTOWANY-Z-WSTRZYKNIETYMI | `src/domain/recruitment.rs:1209` | p6_5a_display::badge_and_veteran_maxima_match_web | softPathBadgeLevel (czesc B) wstrzykiwane |
| `gra/src/game/armyMerge.ts:874` | `stackVeteranLevel` | function | PORTOWANY-Z-WSTRZYKNIETYMI | `src/domain/recruitment.rs:1217` | p6_5a_display::badge_and_veteran_maxima_match_web | veteranLevel (veteran.ts) wstrzykiwane |
| `gra/src/game/armyMerge.ts:892` | `stackVeteranStarCount` | function | PORTOWANY-Z-WSTRZYKNIETYMI | `src/domain/recruitment.rs:1232` | p6_5a_display::badge_and_veteran_maxima_match_web | veteranStarCount (veteran.ts) wstrzykiwane |
| `gra/src/game/armyMerge.ts:902` | `StackVitals` | interface | PORTOWANY | `src/domain/recruitment.rs:751` | p6_5a_display::stack_vitals_matches_web | - |
| `gra/src/game/armyMerge.ts:926` | `StackVitalsDeps` | interface | PORTOWANY-Z-WSTRZYKNIETYMI | `src/domain/recruitment.rs:775` | p6_5a_display::stack_vitals_matches_web | web ma 2 pola (maxHpOf, defOf); Rust ma 7 domkniec: +sumRosterFieldM, armorBadge, softBadge, veteranLevel, veteranStarCount (zaleznosci z innych plikow TS, nieportowane: ZA2, §7) |
| `gra/src/game/armyMerge.ts:934` | `stackVitals` | function | PORTOWANY-Z-WSTRZYKNIETYMI | `src/domain/recruitment.rs:1247` | p6_5a_display::stack_vitals_matches_web | - |
| `gra/src/game/armyMerge.ts:954` | `syncStackRuchLeft` | function | PORTOWANY | `src/domain/recruitment.rs:1267` | p6_5a_ruch::sync_and_deduct_match_web | - |
| `gra/src/game/armyMerge.ts:961` | `deductStackRuchLeft` | function | PORTOWANY | `src/domain/recruitment.rs:1278` | p6_5a_ruch::sync_and_deduct_match_web | - |
| `gra/src/game/armyMerge.ts:966` | `unitWithStackRuch` | function | PORTOWANY | `src/domain/recruitment.rs:1289` | p6_5a_ruch::unit_with_pooled_ruch_matches_web | tozsamosc referencji (===) nie dotyczy Rust: zwracana kopia; wartosc sprawdzona |
| `gra/src/game/armyMerge.ts:976` | `unitWithPlanningStackRuch` | function | PORTOWANY | `src/domain/recruitment.rs:1305` | p6_5a_ruch::unit_with_pooled_ruch_matches_web | jw. |
| `gra/src/game/armyMerge.ts:988` | `countLawGarrisonOnCityHex` | function | PORTOWANY | `src/domain/recruitment.rs:1318` | p6_5a_stack::law_garrison_counts_match_web | - |
| `gra/src/game/armyMerge.ts:1003` | `unitsOnCityHexForLaw` | function | PORTOWANY | `src/domain/recruitment.rs:1328` | p6_5a_stack::law_garrison_counts_match_web | - |
| `gra/src/game/armyMerge.ts:16` | `NEIGH` | prywatny | DANE-JUZ-W-RUST | `sasiedzi` | p6_5a_ruch::adjacent_empty_and_split_destinations_match_web | kolejnosc sasiadow z tabeli P6.4 (teren.sasiedzi); zgodnosc z TS sprawdza verify-p65a-vectors.py (tabela_vs_TS.sasiedzi) |
| `gra/src/game/armyMerge.ts:68` | `stackGroupSeq` | prywatny | PORTOWANY | `src/domain/recruitment.rs:495` | p6_5a_stack::fresh_and_shared_stack_group_ids_match_web_sequence | licznik modulu |
| `gra/src/game/armyMerge.ts:569` | `findRejectHex` | prywatny | PORTOWANY | `src/domain/recruitment.rs:980` | p6_5a_ruch::bounce_from_origin_and_separate_return_hex_match_web | prywatna; wywolywana przez findBounceHexFromOrigin |
| `gra/src/game/unit-cost-tempo.ts:19` | `KOSZT_JEDNOSTEK_PACE` | const | PORTOWANY | `src/data/derived.rs:1829` | p6_5a_cost::table_constants_equal_the_running_web_object + p6_5a_tables | tabela data/derived/unit-cost-tempo.json (edytowalna), wartosci = obiekt z uruchomionego weba |
| `gra/src/game/unit-cost-tempo.ts:25` | `KosztJednostekPace` | type | PORTOWANY | `src/domain/recruitment.rs:1346` | p6_5a_cost::unit_cost_pace_matches_web_bitwise | typ TS (`keyof typeof KOSZT_JEDNOSTEK_PACE | number`) ma odpowiednik Rust UnitCostPace::Key(&str) | Multiplier(f64); zachowanie dla nieznanego klucza zmierzone wektorami |
| `gra/src/game/unit-cost-tempo.ts:33` | `applyUnitCostPace` | function | PORTOWANY | `src/domain/recruitment.rs:1355` | p6_5a_cost::unit_cost_pace_matches_web_bitwise | Math.round/Math.max semantyka JS (js_round/js_max) |
| `gra/src/game/unit-replace-context.ts:50` | `ReplaceAvailabilityCtxParams` | type | PORTOWANY-ZAWEZONY | `src/domain/recruitment.rs:1380` | p6_5a_cost::replace_context_keeps_every_field_and_the_required_stock | generyczne po polach reszta AvailabilityContext (production.ts, poza zakresem: RUNDA-2 konkretny typ); empireResourceStock obowiazkowy (typ nie-Option); ZAWEZENIE: web Record<string, number>, Rust BTreeMap<String,u32> - wartosci ujemne/ulamkowe/NaN/Infinity nie sa reprezentowalne i nie sa zmierzone (ZA6, §7: NIE_ZMIERZONO) |
| `gra/src/game/unit-replace-context.ts:59` | `buildReplaceAvailabilityCtx` | function | PORTOWANY-ZAWEZONY | `src/domain/recruitment.rs:1393` | p6_5a_cost::replace_context_keeps_every_field_and_the_required_stock | `{...params}`; tozsamosc referencji obiektow nie dotyczy Rust; zawezenie wartosci stocku do u32 jak wyzej (ZA6, §7) |

Statusy: `PORTOWANY` = pelny port bez zaleznosci od domkniec ani zawezen; `PORTOWANY-Z-WSTRZYKNIETYMI` = logika symbolu portowana i zmierzona, ale czesc wartosci pochodzi z domkniec podawanych przez wolajacego (`sumRosterFieldM`, `armorPathBadgeLevel`, `softPathBadgeLevel`, `veteranLevel`, `veteranStarCount` - ZA2; ich wlasny port to RUNDA-2 / inne tematy, §7) - dotyczy 8 symboli: `computeStackDisplay` (sciezka vitals), `stackFieldPowerM`, `stackArmorBadgeLevel`, `stackSoftBadgeLevel`, `stackVeteranLevel`, `stackVeteranStarCount`, `StackVitalsDeps`, `stackVitals`; `PORTOWANY-ZAWEZONY` = port z udokumentowanym zawezeniem typu (ZA6; `ReplaceAvailabilityCtxParams`, `buildReplaceAvailabilityCtx`).

Wyjasnienia statusow nietypowych:
- `NEIGH` (DANE-JUZ-W-RUST): kolejnosc sasiadow to `ruch-jednostek-params.json` `teren.sasiedzi` z P6.4; dowod: `verify-p65a-vectors.py` porownuje te tablice z literalem w `armyMerge.ts:16-18` (`tabela_vs_TS.sasiedzi`), a testy `p6_5a_ruch` (kolejnosc wynikow `findAdjacentEmptyHexes`/bounce) i mutacja M16 dowodza, ze kod z niej korzysta.
- `KosztJednostekPace` (PORTOWANY; wczesniej blednie NIE-DOTYCZY - sprzeczne z istniejacym odpowiednikiem i testem): typ TS `keyof typeof KOSZT_JEDNOSTEK_PACE | number` ma w Rust odpowiednik `UnitCostPace::Key(&str) | Multiplier(f64)` (`recruitment.rs:1346`), dowod `p6_5a_cost::unit_cost_pace_matches_web_bitwise`; zachowanie dla nieznanego klucza (`NaN`) jest zmierzone wektorami (`brak`, `toString`, `__proto__`, `constructor`, pusty napis). Jedna klasyfikacja: PORTOWANY.
- `StackVitalsDeps` (PORTOWANY-Z-WSTRZYKNIETYMI): web ma 2 pola (`maxHpOf`, `defOf`, `armyMerge.ts:926-931`), Rust ma 7 domkniec (`recruitment.rs:775-783`): te 2 + `sum_roster_field_m`, `armor_badge_level`, `soft_badge_level`, `veteran_level`, `veteran_star_count` (zaleznosci importowane przez web z innych plikow; ZA2).
- `stackGroupIdOf` istnieje juz w P6.4 (`pathfinding.rs::ruch_jednostek::stack_group_id_of`, na typie `RuchJednostka`); tu drugi port na typie `StosJednostka` (pelny `RuntimeUnit`-podzbior armyMerge). Test `stack_group_id_agrees_with_p64_port_on_the_same_unit` dowodzi zgodnosci obu na 90 wektorach.

## 4. Decyzje i zalozenia (zamiast pytan)

- **ZA1 (model danych).** `StosJednostka` jest podzbiorem `RuntimeUnit` czytanym/pisanym przez `armyMerge.ts`; pola opcjonalne weba to `Option` (rozroznienie "brak" vs `false` jest obserwowalne, np. `exitGarnizon` ustawia `sentry=false`, a `enterGarnizon` nie dotyka `sentry`). Wspolrzedne `i32`, liczby ruchu/HP `f64` z semantyka JS (`NaN`, `-0`, `Math.min/max/round` jako `js_min/js_max/js_round`, porownanie napisow jako UTF-16 `js_str_lt`) - wszystko potwierdzone wektorami z `NaN`, `Infinity`, `-0` oraz identyfikatorami spoza BMP.
- **ZA2 (zaleznosci spoza zakresu).** Web importuje do `armyMerge.ts`: `sumRosterFieldM`, `armorPathBadgeLevel`, `softPathBadgeLevel`, `veteranLevel`, `veteranStarCount` (i `maxHpOf`/`defOf` wstrzykiwane juz w webie). Pierwsze piec to inne pliki (inne tematy/czesc B). Rust przyjmuje je jako domkniecia w `StackVitalsDeps<D>`. Test weryfikuje **logike stosu** (kolejnosc rosteru z typem i definicja, maksimum po stosie, wartosci domyslne, pusty stos) wzgledem weba, a **wartosci tych zaleznosci** pochodza z wektorow (wyniki prawdziwych funkcji weba na tych samych jednostkach). Niezaleznie `verify-p65a-vectors.py` reimplementuje te zaleznosci ze zrodel TS (`sumRosterFieldM` z `combat-params.json`, progi odznak, poziomy weterana) i potwierdza zapisane wartosci (`dep.*`, `computeStackDisplay.rosterSums`: 0 rozbieznosci). Pelny port tych funkcji pozostaje w ich tematach.
- **ZA3 (zegar i licznik).** `Date.now()` w `freshStackGroupId` jest wejsciem (`now_ms`); licznik modulu to `StackGroupSeq` (jedna instancja = jeden modul JS). Generator podmienia `Date.now` na stala przed kazdym wywolaniem prawdziwego kodu.
- **ZA4 (pusty stos w `pickStackRepresentative`).** Web rzuca `TypeError` (`reduce` bez wartosci poczatkowej); Rust zwraca `None`. Zmierzone w wektorze (`threw: true`); wolajacy w webie nigdy nie wola jej na pustym stosie (`computeStackDisplay` grupuje niepuste, `unitAtRepresentative` sprawdza dlugosc).
- **ZA5 (tozsamosc referencji).** Web zwraca ten sam obiekt, gdy nic sie nie zmienia (`unitWithStackRuch`, `unitWithPlanningStackRuch`) i wspoldzieli zagniezdzone referencje w `buildReplaceAvailabilityCtx`. Rust zwraca kopie o tej samej wartosci; testy porownuja WARTOSCI (wektory zawieraja flage `same`, `newObject`, `sameStockRef` jako dokumentacje zachowania weba).
- **ZA6 (generyczny `AvailabilityContext`).** `production.ts` nie jest portowany; `ReplaceAvailabilityCtxParams<R>`/`AvailabilityContext<R>` niosa reszte pol jako parametr typu `R` oraz `empire_resource_stock` (w parametrach wymagany - typ nie-`Option`, w kontekscie `Option`, jak `NonNullable` w TS). Test sprawdza zachowanie kluczy i zgodnosc `empireResourceStock` na danych o ksztalcie prawdziwego kontekstu. **ZAWEZENIE TYPU (nie 1:1):** web ma `empireResourceStock?: Readonly<Record<string, number>>` (`production.ts:462`), Rust `ResourceStock = BTreeMap<String, u32>` (`recruitment.rs:11`), wiec wartosci ujemne, ulamkowe, `NaN`, `Infinity` oraz wartosci > `u32::MAX` nie sa reprezentowalne; wektor (`gen-p65a-vectors.mjs`, kontekst zamiennika) uzywa wylacznie nieujemnych calkowitych (`{brąz:3}`, `{brąz:0, żelazo:5}`, `{drewno:12, kamień:7, ...}`). Dla wartosci spoza u32 **NIE_ZMIERZONO / RUNDA-2** (§7); wiersze `ReplaceAvailabilityCtxParams` i `buildReplaceAvailabilityCtx` maja dlatego status PORTOWANY-ZAWEZONY. Funkcja jedynie kopiuje stock, wiec zawezenie dotyczy reprezentacji, nie logiki.
- **ZA7 (dane balansowe).** Stale/teksty/progi w `data/derived/army-merge-params.json` (prefiks i separator id stosu, podstawa 36, etykiety akcji i "W miescie (ten heks)", prog 2 jednostek, poczatkowe poziomy odznak/weterana/gwiazdek) i `data/derived/unit-cost-tempo.json` (mnozniki `niski/normalny/wysoki` + dolna granica kosztu); parsery w `data/derived.rs` (dopisek na koncu). Elementy strukturalne (0, 1, 0.5 w zaokragleniu, format klucza `q,r`, separator/przyrostek stosu z P6.4) opisuje `dowody/grep-literals-r1.txt`.

## 5. Testy i wektory

Nowe pliki: `tests/p6_5a_stack.rs` (10 testow), `p6_5a_display.rs` (7), `p6_5a_ruch.rs` (8), `p6_5a_cost.rs` (4), `p6_5a_tables.rs` (2) = **31 testow**, wspolne `tests/p6_5a_vectors/common.rs`, wektory `tests/p6_5a_vectors/{stack,display,ruch,cost}.json` (~4,3 MB, ~4,9 tys. przypadkow z uruchomionego weba, generator `gen-p65a-vectors.mjs`, deterministyczny LCG).

| Plik wektorow | Przypadki | Co obejmuje |
|---|---|---|
| `stack.json` | 1725 | tozsamosc i klucz stosu, sekwencja `freshStackGroupId`/`assignSharedStackGroupId` (licznik > 36), widocznosc/garnizon/co-located, sasiednie stosy, `activeUnitStack`, przejscia garnizon/fortyfikacja (w tym lancuchy konczace sie OBIEMA fortyfikacjami), `wakeStackForMoveOrder`, zliczanie Prawa |
| `display.json` | 816 | reprezentant (remisy po id w kolejnosci UTF-16: `\uFF5E` vs `😀`, `NaN` w ataku), `computeStackDisplay` (stosy > 1, dwa stosy o tym samym id reprezentanta - nadpisanie `Map.set`, z vitals i bez), pula HP (nieskonczone/ujemne/zerowe max, HP > max), moc pola z rosterem, maksima odznak i weterana, `stackVitals` |
| `ruch.json` | 1656 | puste/przejezdne sasiednie heksy, cele rozdzielenia, bounce (powielone id, zablokowany pierscien), zwrot ruchu (klamra `u.ruch`, ujemny/`NaN`/`Infinity` odjety), heks powrotu (wrog, nieprzejezdny), akcje paska (7 x 2 x 4 kombinacji), pule ruchu (puste stosy, snapshoty, `-0`), `sync/deduct`, `unitWithStackRuch` |
| `cost.json` | 734 | `applyUnitCostPace` (27 baz x 20 tempow, w tym polowki, `0.49999999999999994`, `NaN`, nieznane klucze `toString`/`__proto__`, plus siatka kreatora), stale z obiektu weba, `buildReplaceAvailabilityCtx` (5 x 4 kontekstow) |

Porownanie `f64` jest **bitowe** (`to_bits`; `NaN == NaN`; `-0` != `0`). Liczby niecalkowite w wektorach sa zapisane jako `{"$f": "<String(x)>"}` (bez bledu 1 ulp serde_json). Testy ksztaltu tabel (`p6_5a_tables.rs`) nie pinuja wartosci balansowych.

**Niezalezny weryfikator** `verify-p65a-vectors.py` (Python, osobna implementacja czytana ze zrodel TS, bez Rust i bez Node): `PRZYPADKOW: 10317`, `ROZBIEZNOSCI: 0` (`verify-p65a-r1.log`, `EXIT=0`); obejmuje tez porownanie tabel Rust ze stalymi odczytanymi REGEXEM z tekstu TS (`tabela_vs_TS.*`: 14 kontroli). Weryfikator zostal sprawdzony negatywnie (zmiana mnoznika `normalny` w kopii tabeli daje `ROZBIEZNOSCI: 1`).

## 6. Mutacje (testy wykrywaja zmiany)

`mutate-p65a.py`: 41 mutacji kodu lub tabel, kazda uruchamia wskazany test, plik jest przywracany. Wynik: **40 WYKRYTA, 1 NIEWYKRYTA - M10 jest mutacja ROWNOWAZNA** (prog `m <= 0` vs `m < 0` w `stack_hp_pool`: dla `m == 0` oba warianty wnosza 0 do obu sum, wiec zachowanie jest identyczne; zastepcza mutacja M41 usuwajaca kontrole skonczonosci jest wykrywana). Mutacja M31 wykryla poczatkowa luke pokrycia (brak wektorow z dwoma stosami o tym samym id reprezentanta) - dopisano dedykowane wektory.

| Mutacja | Plik | Test | Wynik | exit |
|---|---|---|---|---|
| M01-widoczny-bez-garnizonu | `src/domain/recruitment.rs` | `p6_5a_stack` | WYKRYTA | 101 |
| M02-colocated-bez-oblezen | `src/domain/recruitment.rs` | `p6_5a_stack` | WYKRYTA | 101 |
| M03-garnizon-odwrocony | `src/domain/recruitment.rs` | `p6_5a_stack` | WYKRYTA | 101 |
| M04-exit-garnizon-sentry | `src/domain/recruitment.rs` | `p6_5a_stack` | WYKRYTA | 101 |
| M05-fortify-auto-explore | `src/domain/recruitment.rs` | `p6_5a_stack` | WYKRYTA | 101 |
| M06-remis-id-utf8 | `src/domain/recruitment.rs` | `p6_5a_display` | WYKRYTA | 101 |
| M07-remis-id-kierunek | `src/domain/recruitment.rs` | `p6_5a_display` | WYKRYTA | 101 |
| M08-klucz-renderu-garnizon | `src/domain/recruitment.rs` | `p6_5a_stack` | WYKRYTA | 101 |
| M09-hp-bez-dolnej-klamry | `src/domain/recruitment.rs` | `p6_5a_display` | WYKRYTA | 101 |
| M10-hp-prog-maksimum | `src/domain/recruitment.rs` | `p6_5a_display` | NIEWYKRYTA | 0 |
| M11-zwrot-bez-klamry-ruch | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M12-zwrot-ujemny-odjety | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M13-powrot-wrog | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M14-bounce-wirtualna-zajetosc | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M15-bounce-wlasne-id | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M16-sasiedzi-kolejnosc | `data/derived/ruch-jednostek-params.json` | `p6_5a_ruch` | WYKRYTA | 101 |
| M17-planowanie-bez-fortyfikacji-pola | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M18-min-znak-zera | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M19-round-polowka | `src/domain/recruitment.rs` | `p6_5a_cost` | WYKRYTA | 101 |
| M20-koszt-dolna-granica | `src/domain/recruitment.rs` | `p6_5a_cost` | WYKRYTA | 101 |
| M21-tempo-normalny | `data/derived/unit-cost-tempo.json` | `p6_5a_cost` | WYKRYTA | 101 |
| M22-min-koszt-tabela | `data/derived/unit-cost-tempo.json` | `p6_5a_cost` | WYKRYTA | 101 |
| M23-etykieta-ten-heks | `data/derived/army-merge-params.json` | `p6_5a_ruch` | WYKRYTA | 101 |
| M24-hud-prog-rozdzielenia | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M25-hud-rozdziel-wylaczony | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M26-id-stosu-podstawa | `src/domain/recruitment.rs` | `p6_5a_stack` | WYKRYTA | 101 |
| M27-sync-domyslne-minimum | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M28-odejmij-bez-klamry | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M29-ruch-stosu-pojedynczy | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M30-plakietka-prog | `src/domain/recruitment.rs` | `p6_5a_display` | WYKRYTA | 101 |
| M31-map-nadpisanie | `src/domain/recruitment.rs` | `p6_5a_display` | WYKRYTA | 101 |
| M32-moc-pustego-stosu | `src/domain/recruitment.rs` | `p6_5a_display` | WYKRYTA | 101 |
| M33-weteran-start | `data/derived/army-merge-params.json` | `p6_5a_display` | WYKRYTA | 101 |
| M34-wake-sentry | `src/domain/recruitment.rs` | `p6_5a_stack` | WYKRYTA | 101 |
| M35-obroncy-pusty-roster | `src/domain/recruitment.rs` | `p6_5a_stack` | WYKRYTA | 101 |
| M36-aktywny-stos-garnizon | `src/domain/recruitment.rs` | `p6_5a_stack` | WYKRYTA | 101 |
| M37-reprezentant-pojedynczy | `src/domain/recruitment.rs` | `p6_5a_display` | WYKRYTA | 101 |
| M38-etykieta-split-brak | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M39-puste-heksy-garnizon | `src/domain/recruitment.rs` | `p6_5a_ruch` | WYKRYTA | 101 |
| M41-hp-skonczonosc | `src/domain/recruitment.rs` | `p6_5a_display` | WYKRYTA | 101 |
| M40-odznaka-start | `data/derived/army-merge-params.json` | `p6_5a_display` | WYKRYTA | 101 |

## 7. NIE_ZMIERZONO / RUNDA-2 (jawna lista)

- Wlasny port `sumRosterFieldM` / `isFieldBattleUnit` (`auto-battle-power.ts`), `armorPathBadgeLevel` / `softPathBadgeLevel` (`unit-building-bonuses.ts`, czesc B) i `veteranLevel` / `veteranStarCount` (`veteran.ts`): poza zakresem tego tematu; zaleznosci sa wstrzykiwane, a ich wartosci zweryfikowane tylko wektorami i reimplementacja w weryfikatorze (nie sa kodem silnika). **RUNDA-2 / inne tematy.**
- Konkretny `AvailabilityContext` (`production.ts:417`, ~30 pol) i `availableReplacementsFor`: poza zakresem (production.ts); tu tylko kontrakt kopiujacy (ZA6). **RUNDA-2 / temat `production.ts`.**
- Podpiecie `army_merge` pod `bridge.rs`/`state.rs` (np. stos jako czesc stanu gry) - zabronione allowlista (`bridge.rs`, `domain/mod.rs`); modul jest dostepny jako `domain::recruitment::army_merge`.
- `empireResourceStock` z wartosciami spoza `u32` (ujemne, ulamkowe, `NaN`, `Infinity`, > `u32::MAX`): typ Rust `BTreeMap<String, u32>` ich nie reprezentuje, wektory zawieraja tylko nieujemne calkowite (ZA6). **NIE_ZMIERZONO / RUNDA-2** (rozszerzenie do `f64` razem z konkretnym `AvailabilityContext`).
- Zachowanie przy `q`/`r` niecalkowitych: web dopuszcza liczby, Rust `i32`; wektory zawieraja wylacznie calkowite wspolrzedne (jak w grze; mapa heksagonalna). **NIE_ZMIERZONO** dla niecalkowitych.
- Tozsamosc referencji (ZA5) - NIE-DOTYCZY w Rust.
- Pamiec/czas: brak pomiarow wydajnosci (niewymagane).

## 8. Tabela bylo/jest i zmiany testow

| Wielkosc | Bylo (`1570419b`) | Jest |
|---|---|---|
| Testy silnika (`cargo test`) | 595 | 626 (+31, wszystkie nowe w `tests/p6_5a_*.rs`) |
| Zmiany istniejacych testow | - | brak (zadnego istniejacego testu nie edytowano, nie osłabiono, nie usunieto) |
| `domain/recruitment.rs` | 289 linii (koszty rekrutacji) | + modul `pub mod army_merge` (istniejacy kod bez zmian) |
| `data/derived.rs` | 1786 linii | + dopisek na koncu (parsery `unit-cost-tempo.json`, `army-merge-params.json`) |
| `data/derived/*.json` | 32 pliki | + `unit-cost-tempo.json`, `army-merge-params.json` |
| Nowe pliki testow | - | `p6_5a_{stack,display,ruch,cost,tables}.rs` + `p6_5a_vectors/` |

## 9. Zero zmian poza allowlista - samokontrola

`git status --short` w worktree: zmodyfikowane `rust-port/engine/src/domain/recruitment.rs` i `rust-port/engine/src/data/derived.rs` (dopisek na koncu); nowe `rust-port/engine/data/derived/{unit-cost-tempo,army-merge-params}.json`, `rust-port/engine/tests/p6_5a_*.rs`, `rust-port/engine/tests/p6_5a_vectors/**`, ten dokument i `dyspozycje/autobot/runs/R-RUSTPORT-P6-5A-JEDNOSTKI-ZYCIE-A-Q1/**`. Nietknięte: `bridge.rs`, `Cargo.toml`, `domain/mod.rs`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`. `Cargo.lock` (wygenerowany lokalnie) i `target` NIE sa commitowane; budowa w `CARGO_TARGET_DIR=/home/user/cargo-target-shared/<worktree>` z `CARGO_INCREMENTAL=0`.

## 10. Jak odtworzyc

Metoda generatora wektorow: odstepstwo od dispatchu ("funkcje wycinaj WERBATIM"). Generator **nie wycina** funkcji z TS; `gen-p65a-vectors.mjs` laduje przez `p65a-loader-hooks.mjs` CALE moduly TS z pinu `edb8fb56` (`armyMerge.ts`, `unit-cost-tempo.ts`, `unit-replace-context.ts` oraz graf ich importow) i uruchamia je w Node bez stubow i bez przepisywania. To metoda mocniejsza od wycinania (kod jest nietkniety, w tym jego zaleznosci i stan modulu, np. `stackGroupSeq`), ale to INNA metoda niz wskazana; zadeklarowane tu jawnie.

```text
# wektory (z katalogu runu; WEB_ROOT = wypakowany git archive edb8fb56 gra/src gra/data)
node --experimental-transform-types --no-warnings --import ./p65a-loader-register.mjs ./gen-p65a-vectors.mjs <WEB_ROOT> rust-port/engine/tests/p6_5a_vectors
python3 -I verify-p65a-vectors.py <WEB_ROOT> rust-port/engine
python3 mutate-p65a.py rust-port/engine <CARGO_TARGET_DIR> all
cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test     # w rust-port/engine
```
