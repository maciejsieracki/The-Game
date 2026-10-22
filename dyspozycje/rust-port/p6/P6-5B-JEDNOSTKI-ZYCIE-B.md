# P6.5B - jednostki: zycie, czesc B (`manpower.ts`, `unit-building-bonuses.ts`)

Temat: `R-RUSTPORT-P6-5B-JEDNOSTKI-ZYCIE-B-Q1` (DOMAIN: GAME), runda 1/5, rola Operator.
Pin web: `edb8fb56`. Baza Rust: `origin/rust-port/parity-v2` @ `50b49360` (silnik 745 testow; zawiera czesc A - `recruitment::army_merge`).
Artefakty runu (generator, weryfikator, mutacje, logi bramek): `dyspozycje/autobot/runs/R-RUSTPORT-P6-5B-JEDNOSTKI-ZYCIE-B-Q1/`.

## 1. Werdykt rundy 1 (stan faktyczny)

| Pytanie | Odpowiedz |
|---|---|
| Co jest portowane? | Wszystkie eksporty i symbole prywatne z dwoch plikow (tabela §3): 103 wierszy = 2 DANE-JUZ-W-RUST, 92 PORTOWANY, 1 PORTOWANY-LOKALNIE, 8 PORTOWANY-ZAWEZONY. 0 NIE-DOTYCZY, 0 RUNDA-2 w sensie symbolu zrodlowego. |
| Dowod "PORTOWANY" | Kod Rust + test + wektory z URUCHOMIONEGO weba (pin) + niezalezny weryfikator Python (0 rozbieznosci) + mutacje wykrywane (§6). |
| Domkniecia wstrzykniete w P6.5A | `armorPathBadgeLevel` / `softPathBadgeLevel` leza w `unit-building-bonuses.ts` i SA TERAZ PORTEM (`combat::unit_building_bonuses`); test `p6_5b_tables::p65a_badge_closures_are_closed_by_the_real_path_badge_port` podaje je jako domkniecia do `stack_armor_badge_level` / `stack_soft_badge_level` na wektorach P6.5A (`stackBadges`, web: 0 rozbieznosci). Status `PORTOWANY-Z-WSTRZYKNIETYMI` -> `PORTOWANY` dla tych dwoch symboli (tabela §8). `sumRosterFieldM`, `veteranLevel`, `veteranStarCount` NIE leza w tych plikach (grep: `manpower.ts` i `unit-building-bonuses.ts` nie zawieraja `sumRosterFieldM`) - zostaja wstrzykiwane (P6.5A ZA2, §7). |
| Co zostaje na kolejna runde / inny temat? | Tylko to, co jawnie nie nalezy do tych plikow: `sumRosterFieldM`/`isFieldBattleUnit` (`auto-battle-power.ts`), `veteranLevel`/`veteranStarCount` (`veteran.ts`), podpiecie pod `bridge.rs`/`state.rs` (zabronione allowlista), pelny `isCivilianUnit` w swoim temacie (`units/setup.ts`; tu port lokalny zbioru, §4 ZA3). |
| Bramki | fmt `EXIT=0`, clippy `--all-targets -D warnings` `EXIT=0`, test `EXIT=0`: 777 przeszlo, 0 nie (745 bazowych + 32 nowych); surowe, pelne logi: `gate-fmt-r1.log`, `gate-clippy-r1.log`, `gate-test-r1.log`. |
| Zmiany poza allowlista | Brak (§9). |

## 2. Zrodla przeczytane w calosci (liczby linii)

Czytane w calosci (`Read` bez ograniczen zakresu) po wyodrebnieniu `git archive edb8fb56 gra/src gra/data` do wlasnego katalogu poza repo (`mktemp -d`).

| Plik | Linie (`wc -l`) | Linie niepuste (`grep -c -v '^\s*$'`) | Eksporty (regex `^export`) |
|---|---|---|---|
| `gra/src/game/manpower.ts` | 877 | 798 | 52 (40 funkcji, 11 interfejsow/typow, 1 stala) + 10 symboli prywatnych (`ROWS`, `MAX_EPOKA`, `ParamRow`, `DEFAULT_REGEN`, `DEFAULT_REPLENISH_PCT`, `CityReplenishFields`, `ReplenishmentCandidate`, `allocateProportionalReplenishment`, `scaledManpower`, `CityRecruitFields`) |
| `gra/src/game/unit-building-bonuses.ts` | 526 | 488 | 33 (17 funkcji, 7 interfejsow/typow, 9 stalych) + 5 symboli prywatnych (`mnoznikOf`, `MAX_UPGRADE_CHAIN_DEPTH`, `chainMnoznikContribution`, `sumMnoznikForPresentBuildings`, `pathBadgeLevelFromPp`) |

Liczby niepuste zgadzaja sie z dispatchem (798 / 488). Liczba wierszy tabeli symboli jest wymuszana skryptem `gen-symbols-p65b.py` (blad, gdy eksport TS nie ma wiersza albo wiersz wskazuje symbol/test spoza zrodla, Rust lub testow).

Przeczytane dodatkowo (zaleznosci, tylko fragmenty/grep w zakresie uzytym przez te dwa pliki): `units/setup.ts:190-199` (`CIVILIAN_CATEGORIES`, `CIVILIAN_TYPE_IDS`, `isCivilianUnit`), `game/cities.ts` (typ `City`: `population`, `manpower`, `oblegane`, `q`, `r`; id miast `'city' + cities.length`, `cities.ts:1249`), `main.ts:3932` (id jednostek), `data/epoka-ludnosc-manpower.json`, `data/miasto-params.json`, `data/buildings.json`. Dokumenty przeczytane: `P6-5A-JEDNOSTKI-ZYCIE-A.md` (w calosci; wzorzec i lista wstrzyknietych domkniec), skrypty runu P6.5A (`gen-p65a-vectors.mjs`, `verify-p65a-vectors.py`, `mutate-p65a.py`, `gen-symbols-p65a.py`, loader bez stubow - w calosci), `P6-0-GAP-ANALYSIS.md` (wiersze 16/117/167/169/171 i wiersz planu P6.5 - grep, NIE w calosci). **NIE przeczytane w tej rundzie** (dispatch: "przeczytaj OBOWIAZKOWO"): `p3/P3-22-FLATTEN-STAGE2.md` i skrypty `R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/` (zastapione identycznym wariantem "loader bez stubow" z P6.5A, ktory z nich pochodzi), `p2/P2-3-ENTITY-IDS.md`, `p2/P2-5-COMMANDS.md`, `PLAN-PORT-RUST-TAURI-20261020.md` §P6, `LEDGER.md`. Skutek do oceny przez Evaluatora: typy id (`ids.rs`) - port uzywa `String` jak P6.5A (`StosJednostka`), mapowanie na typy `ids.rs` nalezy do integracji ze `state.rs` (RUNDA-2, §7); komendy P2-5 nie sa uzywane przez te dwa pliki.

## 3. Tabela symboli (kazdy eksport ma status)

Zrodlo: `symbols-p65b-r1.tsv` (generowana skryptem `gen-symbols-p65b.py`; kolumny `zrodlo_web`, `symbol`, `rodzaj`, `status`, `odpowiednik_rust`, `test`, `uwaga`). Numery linii Rust dotycza stanu po `cargo fmt`.

| zrodlo_web | symbol | rodzaj | status | odpowiednik Rust | test | uwaga |
|---|---|---|---|---|---|---|
| `gra/src/game/manpower.ts:30` | `EpokaManpowerRow` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1596` | p6_5b_manpower::era_table_and_citizen_scalars_match_web | liczby f64 |
| `gra/src/game/manpower.ts:37` | `CityManpowerSnapshot` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2192` | p6_5b_manpower::city_pool_functions_match_web | - |
| `gra/src/game/manpower.ts:56` | `ManpowerRegenParams` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1674` | p6_5b_manpower::regen_gain_matches_web_including_default_params | domyslne = ManpowerRegenParams::default_params() z manpower-params.json |
| `gra/src/game/manpower.ts:68` | `ManpowerDifficulty` | type | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1692` | p6_5b_manpower::raw_param_loaders_match_web | - |
| `gra/src/game/manpower.ts:70` | `ManpowerReplenishParams` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1700` | p6_5b_manpower::raw_param_loaders_match_web | - |
| `gra/src/game/manpower.ts:82` | `loadManpowerReplenishParams` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1710` | p6_5b_manpower::raw_param_loaders_match_web + p6_5b_manpower::game_default_params_equal_the_running_web_defaults | surowy miasto-params jako MiastoManpowerRaw (wartosci nie-liczbowe = None); raw=None to domyslny argument weba (prawdziwy plik) |
| `gra/src/game/manpower.ts:99` | `ManpowerHealUnit` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1845` | p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol | - |
| `gra/src/game/manpower.ts:117` | `syncLiveUnitHp` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1867` | p6_5b_manpower::besieged_location_sort_key_sync_and_civilian_match_web | - |
| `gra/src/game/manpower.ts:132` | `isUnitInBesiegedLocation` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1875` | p6_5b_manpower::besieged_location_sort_key_sync_and_civilian_match_web | argumenty rozwiniete: owner_id, q, r |
| `gra/src/game/manpower.ts:143` | `replenishmentUnitSortKey` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1891` | p6_5b_manpower::besieged_location_sort_key_sync_and_civilian_match_web | klucze 2/0/1 w manpower-params.json |
| `gra/src/game/manpower.ts:152` | `ManpowerReplenishResult` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1904` | p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol | - |
| `gra/src/game/manpower.ts:158` | `manpowerHealCapForTurn` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1914` | p6_5b_manpower::heal_cost_and_cap_match_web | - |
| `gra/src/game/manpower.ts:169` | `manpowerCostForHeal` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1927` | p6_5b_manpower::heal_cost_and_cap_match_web | - |
| `gra/src/game/manpower.ts:179` | `maxAffordableManpowerHeal` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1935` | p6_5b_manpower::heal_cost_and_cap_match_web | - |
| `gra/src/game/manpower.ts:274` | `tickManpowerUnitReplenishment` | function | PORTOWANY-ZAWEZONY | `rust-port/engine/src/domain/recruitment.rs:2594` | p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol | domkniecia resolveOwnerEra/resolveOwnerBonusy/getMaxHp/onUnitHpChanged to PARAMETRY weba (nie zaleznosci z innych plikow); ZAWEZENIA: getMaxHp zawsze dostaje jednostke (web: opcjonalny arg), localeCompare (ICU) zawezone do ASCII 0x20-0x7E (zmierzone); reszta NIE_ZMIERZONO, komparatory niespojne (NaN) NIE_ZMIERZONO |
| `gra/src/game/manpower.ts:373` | `loadManpowerRegenParams` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1734` | p6_5b_manpower::raw_param_loaders_match_web + p6_5b_manpower::game_default_params_equal_the_running_web_defaults | - |
| `gra/src/game/manpower.ts:385` | `CivBonusPoborLite` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1758` | p6_5b_manpower::civ_bonus_multipliers_match_web | wartosc: tylko liczby (typeof) - lista napisow/napis to None |
| `gra/src/game/manpower.ts:396` | `civManpowerRegenMult` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1771` | p6_5b_manpower::civ_bonus_multipliers_match_web | - |
| `gra/src/game/manpower.ts:415` | `civManpowerMaxMult` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1788` | p6_5b_manpower::civ_bonus_multipliers_match_web | - |
| `gra/src/game/manpower.ts:431` | `civManpowerMults` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1805` | p6_5b_manpower::civ_bonus_multipliers_match_web | krotka (regenMult, maxMult) |
| `gra/src/game/manpower.ts:445` | `manpowerRegenGain` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2234` | p6_5b_manpower::regen_gain_matches_web_including_default_params | - |
| `gra/src/game/manpower.ts:462` | `tickManpowerRegen` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2251` | p6_5b_manpower::city_pool_functions_match_web | - |
| `gra/src/game/manpower.ts:479` | `epokaManpowerRow` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2040` | p6_5b_manpower::era_table_and_citizen_scalars_match_web | - |
| `gra/src/game/manpower.ts:484` | `clampLudki` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2057` | p6_5b_manpower::era_table_and_citizen_scalars_match_web | - |
| `gra/src/game/manpower.ts:489` | `cityLudnoscAbsolutna` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2071` | p6_5b_manpower::era_table_and_citizen_scalars_match_web | - |
| `gra/src/game/manpower.ts:495` | `formatObywateleLabel` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2076` | p6_5b_format::citizen_label_matches_web | Number#toString: js_number_to_string |
| `gra/src/game/manpower.ts:502` | `cityManpowerMax` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2098` | p6_5b_manpower::pool_and_cost_scalars_match_web | - |
| `gra/src/game/manpower.ts:508` | `SCOUT_TYPE_ID` | const | PORTOWANY | `rust-port/engine/src/data/derived.rs:2563` | p6_5b_tables::table_constants_equal_the_running_web | manpower-params.json |
| `gra/src/game/manpower.ts:510` | `isScoutTypeId` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2104` | p6_5b_manpower::pool_and_cost_scalars_match_web | - |
| `gra/src/game/manpower.ts:515` | `unitManpowerCost` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2109` | p6_5b_manpower::pool_and_cost_scalars_match_web | - |
| `gra/src/game/manpower.ts:520` | `unitManpowerCostForType` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2114` | p6_5b_manpower::pool_and_cost_scalars_match_web | - |
| `gra/src/game/manpower.ts:530` | `cityManpowerCurrent` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2122` | p6_5b_manpower::city_pool_functions_match_web | - |
| `gra/src/game/manpower.ts:541` | `EmpirePoborTotals` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2136` | p6_5b_manpower::empire_totals_match_web | - |
| `gra/src/game/manpower.ts:548` | `empireSumaLudkow` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2144` | p6_5b_manpower::empire_totals_match_web | - |
| `gra/src/game/manpower.ts:561` | `rekrutUnitEquivalents` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2156` | p6_5b_manpower::pool_and_cost_scalars_match_web | - |
| `gra/src/game/manpower.ts:567` | `empirePoborTotals` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2165` | p6_5b_manpower::empire_totals_match_web | - |
| `gra/src/game/manpower.ts:585` | `cityManpowerSnapshot` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2204` | p6_5b_manpower::city_pool_functions_match_web | parametry odnowy z prawdziwego miasto-params.json (jak web) |
| `gra/src/game/manpower.ts:612` | `canAffordUnitManpower` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2274` | p6_5b_manpower::city_pool_functions_match_web | - |
| `gra/src/game/manpower.ts:624` | `empireManpowerCurrent` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2288` | p6_5b_manpower::empire_totals_match_web | - |
| `gra/src/game/manpower.ts:636` | `deductManpowerFromEmpire` | function | PORTOWANY-ZAWEZONY | `rust-port/engine/src/domain/recruitment.rs:2315` | p6_5b_manpower::empire_deduct_refund_and_spawn_mutate_like_web | mutuje miasta; localeCompare (ICU) zawezone do ASCII 0x20-0x7E (zmierzone); reszta NIE_ZMIERZONO |
| `gra/src/game/manpower.ts:664` | `refundManpowerToEmpire` | function | PORTOWANY-ZAWEZONY | `rust-port/engine/src/domain/recruitment.rs:2353` | p6_5b_manpower::empire_deduct_refund_and_spawn_mutate_like_web | mutuje miasta; localeCompare (ICU) zawezone do ASCII 0x20-0x7E (zmierzone); reszta NIE_ZMIERZONO |
| `gra/src/game/manpower.ts:698` | `canAffordUnitManpowerEmpire` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2394` | p6_5b_manpower::empire_totals_match_web | _recruitingCity/_popCost nieuzywane jak w webie |
| `gra/src/game/manpower.ts:713` | `tryDeductUnitSpawnCostsEmpire` | function | PORTOWANY-ZAWEZONY | `rust-port/engine/src/domain/recruitment.rs:2438` | p6_5b_manpower::empire_deduct_refund_and_spawn_mutate_like_web | mutuje miasta; localeCompare (ICU) zawezone do ASCII 0x20-0x7E (zmierzone); reszta NIE_ZMIERZONO |
| `gra/src/game/manpower.ts:755` | `UnitSpawnBlockReason` | type | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2412` | p6_5b_manpower::spawn_and_refund_functions_match_web | napisy powodow w manpower-params.json |
| `gra/src/game/manpower.ts:757` | `UnitSpawnDeduction` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2429` | p6_5b_manpower::spawn_and_refund_functions_match_web | - |
| `gra/src/game/manpower.ts:769` | `tryDeductUnitSpawnCosts` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2438` | p6_5b_manpower::spawn_and_refund_functions_match_web | - |
| `gra/src/game/manpower.ts:808` | `refundUnitSpawnToCity` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2528` | p6_5b_manpower::spawn_and_refund_functions_match_web | domyslny popCost=1: default_refund_pop_cost() |
| `gra/src/game/manpower.ts:827` | `refreshManpowerAfterPopChange` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2551` | p6_5b_manpower::city_pool_functions_match_web | - |
| `gra/src/game/manpower.ts:846` | `spendManpower` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2572` | p6_5b_manpower::city_pool_functions_match_web | - |
| `gra/src/game/manpower.ts:858` | `formatPopulationAbs` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2744` | p6_5b_format::population_formats_match_web | Number#toString: js_number_to_string (wlacznie z remisami najkrotszej reprezentacji) |
| `gra/src/game/manpower.ts:870` | `formatManpower` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2768` | p6_5b_format::population_formats_match_web | - |
| `gra/src/game/manpower.ts:875` | `allEpokaManpowerRows` | function | DANE-JUZ-W-RUST | `rust-port/engine/src/domain/recruitment.rs:1608` | p6_5b_tables::table_constants_equal_the_running_web | tabela epok z data/epoka-ludnosc-manpower.json (economy_society.rs, identyczna z pinem: kopia danych weba w weryfikatorze) |
| `gra/src/game/manpower.ts:50` | `ROWS` | prywatny | DANE-JUZ-W-RUST | `rust-port/engine/src/domain/recruitment.rs:1608` | p6_5b_tables::table_constants_equal_the_running_web | OnceLock z economy_society::parse_epoka_ludnosc_manpower |
| `gra/src/game/manpower.ts:52` | `MAX_EPOKA` | prywatny | PORTOWANY | `rust-port/engine/src/data/derived.rs:2480` | p6_5b_tables::table_constants_equal_the_running_web | manpower-params.json: epoka.max |
| `gra/src/game/manpower.ts:54` | `ParamRow` | prywatny | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1635` | p6_5b_manpower::raw_param_loaders_match_web | surowe wartosci miasto-params; prawdziwy plik: MiastoManpowerRaw::game() |
| `gra/src/game/manpower.ts:63` | `DEFAULT_REGEN` | prywatny | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1681` | p6_5b_manpower::game_default_params_equal_the_running_web_defaults | manpower-params.json: domyslne_regen |
| `gra/src/game/manpower.ts:75` | `DEFAULT_REPLENISH_PCT` | prywatny | PORTOWANY | `rust-port/engine/src/data/derived.rs:2496` | p6_5b_manpower::game_default_params_equal_the_running_web_defaults | manpower-params.json: domyslne_uzupelnienie_hp_proc |
| `gra/src/game/manpower.ts:129` | `CityReplenishFields` | prywatny | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1818` | p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol | jeden struktura ManpowerCity (nadzbior pol Pick<City,...>) |
| `gra/src/game/manpower.ts:189` | `ReplenishmentCandidate` | prywatny | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1949` | p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol | jednostka jako indeks w liscie |
| `gra/src/game/manpower.ts:206` | `allocateProportionalReplenishment` | prywatny | PORTOWANY-ZAWEZONY | `rust-port/engine/src/domain/recruitment.rs:1963` | p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol | martwy zapis usedMp po inicjalizacji remainingMp pominiety; localeCompare (ICU) zawezone do ASCII 0x20-0x7E (zmierzone); reszta NIE_ZMIERZONO |
| `gra/src/game/manpower.ts:440` | `scaledManpower` | prywatny | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2088` | p6_5b_manpower::pool_and_cost_scalars_match_web | - |
| `gra/src/game/manpower.ts:633` | `CityRecruitFields` | prywatny | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1818` | p6_5b_manpower::empire_deduct_refund_and_spawn_mutate_like_web | jak CityReplenishFields |
| `gra/src/game/unit-building-bonuses.ts:59` | `MnoznikBuildingLookup` | interface | PORTOWANY | `rust-port/engine/src/domain/combat.rs:519` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids | baza.mnoznik splaszczone do baza_mnoznik: Option<f64> |
| `gra/src/game/unit-building-bonuses.ts:67` | `ARMOR_BUILDING_IDS` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:526` | p6_5b_tables::table_constants_equal_the_running_web | unit-building-bonuses.json |
| `gra/src/game/unit-building-bonuses.ts:70` | `SOFT_STAT_BUILDING_IDS` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:531` | p6_5b_tables::table_constants_equal_the_running_web | unit-building-bonuses.json |
| `gra/src/game/unit-building-bonuses.ts:83` | `mnoznikRoleForBuildingId` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:543` | p6_5b_bonuses::building_roles_and_real_game_data_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:171` | `cityArmorBonusPercent` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:655` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids + p6_5b_bonuses::building_roles_and_real_game_data_match_web | w tym prawdziwe dane gry (buildings.json) |
| `gra/src/game/unit-building-bonuses.ts:179` | `citySoftStatBonusPercent` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:663` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids + p6_5b_bonuses::building_roles_and_real_game_data_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:195` | `cumulativeMnoznikForBuildingId` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:671` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids + p6_5b_bonuses::chain_depth_limit_matches_web | - |
| `gra/src/game/unit-building-bonuses.ts:212` | `UnitBuildingProgress` | interface | PORTOWANY | `rust-port/engine/src/domain/combat.rs:693` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | pola nie-liczbowe = None |
| `gra/src/game/unit-building-bonuses.ts:218` | `unitPancerzBonusProc` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:706` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:223` | `unitParametryBonusProc` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:711` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:292` | `UnitPathBadgeLevel` | type | PORTOWANY | `rust-port/engine/src/domain/combat.rs:716` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | u8 0-3 |
| `gra/src/game/unit-building-bonuses.ts:295` | `ARMOR_PATH_MAX_PP` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:721` | p6_5b_tables::table_constants_equal_the_running_web | unit-building-bonuses.json |
| `gra/src/game/unit-building-bonuses.ts:297` | `SOFT_PATH_MAX_PP` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:726` | p6_5b_tables::table_constants_equal_the_running_web | unit-building-bonuses.json |
| `gra/src/game/unit-building-bonuses.ts:300` | `ARMOR_PATH_LEVEL_MAX_PP` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:752` | p6_5b_tables::table_constants_equal_the_running_web | wyliczane z max_pp i liczba_tercji |
| `gra/src/game/unit-building-bonuses.ts:306` | `SOFT_PATH_LEVEL_MAX_PP` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:757` | p6_5b_tables::table_constants_equal_the_running_web | wyliczane z max_pp i liczba_tercji |
| `gra/src/game/unit-building-bonuses.ts:325` | `armorPathBadgeLevel` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:776` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web + p6_5b_tables::p65a_badge_closures_are_closed_by_the_real_path_badge_port | zamyka domkniecie wstrzykniete w P6.5A (stackArmorBadgeLevel) |
| `gra/src/game/unit-building-bonuses.ts:334` | `softPathBadgeLevel` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:781` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web + p6_5b_tables::p65a_badge_closures_are_closed_by_the_real_path_badge_port | zamyka domkniecie wstrzykniete w P6.5A (stackSoftBadgeLevel) |
| `gra/src/game/unit-building-bonuses.ts:339` | `unitPancerzBonusFrac` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:786` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:344` | `unitParametryBonusFrac` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:791` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:359` | `bestBuildingProgressAfterCityVisit` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:808` | p6_5b_bonuses::city_visit_gain_progress_and_hint_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:373` | `buildingProgressWouldChange` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:822` | p6_5b_bonuses::city_visit_gain_progress_and_hint_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:384` | `BuildingBonusGain` | interface | PORTOWANY | `rust-port/engine/src/domain/combat.rs:834` | p6_5b_bonuses::city_visit_gain_progress_and_hint_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:396` | `applyCityVisitBonusGain` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:843` | p6_5b_bonuses::city_visit_gain_progress_and_hint_match_web | mutuje pola procentowe |
| `gra/src/game/unit-building-bonuses.ts:421` | `formatBuildingBonusGainHint` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:896` | p6_5b_bonuses::city_visit_gain_progress_and_hint_match_web + p6_5b_bonuses::gain_hint_text_matches_web_for_arbitrary_gains | szablony w unit-building-bonuses.json; podstawianie jednoprzebiegowe |
| `gra/src/game/unit-building-bonuses.ts:438` | `unitBuildingBonusLabel` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:935` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:454` | `PathBadgeLevel` | type | PORTOWANY | `rust-port/engine/src/domain/combat.rs:718` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | alias zgodnosci |
| `gra/src/game/unit-building-bonuses.ts:456` | `PATH_A_MAX_PP` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:731` | p6_5b_tables::table_constants_equal_the_running_web | alias |
| `gra/src/game/unit-building-bonuses.ts:458` | `PATH_B_MAX_PP` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:736` | p6_5b_tables::table_constants_equal_the_running_web | alias |
| `gra/src/game/unit-building-bonuses.ts:477` | `BuildingCombatBonus` | interface | PORTOWANY | `rust-port/engine/src/domain/combat.rs:958` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:484` | `ZERO_BUILDING_COMBAT_BONUS` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:964` | p6_5b_tables::table_constants_equal_the_running_web | - |
| `gra/src/game/unit-building-bonuses.ts:487` | `buildingCombatBonusForUnit` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:970` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:497` | `StatMultipliersLike` | interface | PORTOWANY-ZAWEZONY | `rust-port/engine/src/domain/combat.rs:982` | p6_5b_bonuses::stat_multiplier_merge_matches_web | ZAWEZENIE: web generyczny (T extends StatMultipliersLike), Rust dokladnie 6 pol |
| `gra/src/game/unit-building-bonuses.ts:512` | `mergeBuildingBonusIntoStatMultipliers` | function | PORTOWANY-ZAWEZONY | `rust-port/engine/src/domain/combat.rs:997` | p6_5b_bonuses::stat_multiplier_merge_matches_web | zwraca &mut do tej samej struktury (web: ten sam obiekt - wektor `same`) |
| `gra/src/game/unit-building-bonuses.ts:89` | `mnoznikOf` | prywatny | PORTOWANY | `rust-port/engine/src/domain/combat.rs:554` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids | - |
| `gra/src/game/unit-building-bonuses.ts:99` | `MAX_UPGRADE_CHAIN_DEPTH` | prywatny | PORTOWANY | `rust-port/engine/src/data/derived.rs:2612` | p6_5b_bonuses::chain_depth_limit_matches_web | unit-building-bonuses.json |
| `gra/src/game/unit-building-bonuses.ts:113` | `chainMnoznikContribution` | prywatny | PORTOWANY | `rust-port/engine/src/domain/combat.rs:585` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids + p6_5b_bonuses::chain_depth_limit_matches_web | String#trim: is_js_whitespace (U+FEFF tak, U+0085 nie) |
| `gra/src/game/unit-building-bonuses.ts:152` | `sumMnoznikForPresentBuildings` | prywatny | PORTOWANY | `rust-port/engine/src/domain/combat.rs:629` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids | - |
| `gra/src/game/unit-building-bonuses.ts:312` | `pathBadgeLevelFromPp` | prywatny | PORTOWANY | `rust-port/engine/src/domain/combat.rs:762` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | siatka progow 0.5 pp |
| `gra/src/units/setup.ts` | `isCivilianUnit` | function | PORTOWANY-LOKALNIE | `rust-port/engine/src/domain/recruitment.rs:1861` | p6_5b_manpower::besieged_location_sort_key_sync_and_civilian_match_web + p6_5b_tables::civilian_set_is_resolved_from_the_table | zaleznosc manpower.ts spoza zakresu (units/setup.ts:196); zbiory kategorii/typow w manpower-params.json; wektor z uruchomionego weba (isCivilianUnit) |
| `<ECMAScript>` | `String.prototype.localeCompare` | builtin | PORTOWANY-ZAWEZONY | `rust-port/engine/src/domain/recruitment.rs:1543` | p6_5b_format::locale_compare_matches_web_for_ascii | localeCompare (ICU) zawezone do ASCII 0x20-0x7E (zmierzone); reszta NIE_ZMIERZONO |
| `<ECMAScript>` | `Number.prototype.toString` | builtin | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1433` | p6_5b_format::number_to_string_matches_web | wlacznie z dokladnymi remisami najkrotszej reprezentacji (parzysta ostatnia cyfra) |

Statusy: `PORTOWANY` = pelny port bez zawezen; `PORTOWANY-ZAWEZONY` = port z udokumentowanym zawezeniem (ZA2 `localeCompare` tylko ASCII, ZA5 `StatMultipliersLike` bez generyka, `getMaxHp` zawsze z jednostka); `PORTOWANY-LOKALNIE` = zaleznosc spoza dwoch plikow zportowana w tym temacie (ZA3); `DANE-JUZ-W-RUST` = dane/tabela istnieja i sa czytane z istniejacego parsera (dowod: kopia `data/*.json` w silniku == plik weba, `verify-p65b-vectors.py` `kopia_danych.*`, plus wektor `consts` z uruchomionego weba).

## 4. Decyzje i zalozenia (zamiast pytan)

- **ZA1 (model danych).** `ManpowerCity` jest nadzbiorem pol `Pick<City, ...>` czytanych/pisanych przez `manpower.ts` (jedna struktura zastepuje `CityReplenishFields` i `CityRecruitFields`); `manpower: Option<f64>` (`None` = `undefined`), `oblegane: Option<bool>`, `q`/`r` `i32`, `population` `f64`. `ManpowerHealUnit` odpowiada interfejsowi weba (`hp`, `hpMax`, `q`, `r`, `inGarnizon` opcjonalne). Liczby to `f64` z semantyka JS (`NaN`, `-0`, `Math.floor/ceil/min/max/round` jako `floor`/`ceil`/`army_merge::js_min/js_max/js_round`, `||` na `NaN`/`0`) - potwierdzone wektorami z `NaN`, `Infinity`, `-0`, wartosciami ujemnymi i ulamkowymi. Wspolrzedne `i32` (jak P6.5A: niecalkowite NIE_ZMIERZONO).
- **ZA2 (`localeCompare`).** Web sortuje id miast i jednostek przez `a.id.localeCompare(b.id)` (ICU, locale srodowiska; zmierzone `en-US`) w `deductManpowerFromEmpire`, `refundManpowerToEmpire` i `allocateProportionalReplenishment`. Rust nie ma ICU (nowa zaleznosc zabroniona allowlista). Port: kolejnosc ICU dla ASCII 0x20-0x7E ZMIERZONA w uruchomionym Node (`Intl.Collator`, `sensitivity: base`) i zapisana jako edytowalna tabela `data/derived/locale-compare-ascii.json` (poziom 1: znaki, wielkosc liter ignorowana; poziom 3: male przed wielkimi); wektory: 18641 par napisow z weba (caly ASCII x ASCII + id podobne do prawdziwych + warianty wielkosci liter), 0 rozbieznosci. Id w grze to ASCII: miasta `'city' + n` (`cities.ts:1249`), jednostki `'prod_' + turn + '_' + cityId + '_' + <losowy base36>` (`main.ts:3932`). **Poza ASCII: NIE_ZMIERZONO** - Rust zapasowo porownuje jednostki UTF-16; zmierzone na 256 parach (16 napisow spoza ASCII/z znakami sterujacymi) zapasowa sciezka rozni sie od weba w 134 parach (`format.json` `collate.nonAscii`), wiec nie nalezy jej uzywac dla id spoza ASCII (RUNDA-2, §7).
- **ZA3 (`isCivilianUnit`).** `tickManpowerUnitReplenishment` wola `isCivilianUnit` z `units/setup.ts:196` (poza dwoma plikami tematu). Zbiory (`CIVILIAN_CATEGORIES`, `CIVILIAN_TYPE_IDS`) sa w `manpower-params.json` (`cywilne`), funkcja `is_civilian_unit` ma wektor z URUCHOMIONEGO weba (80 par kategoria x typ); pelny port `units/setup.ts` zostaje w swoim temacie (tam nalezy ewentualna deduplikacja).
- **ZA4 (domkniecia `tickManpowerUnitReplenishment`).** `resolveOwnerEra`, `resolveOwnerBonusy`, `getMaxHp`, `onUnitHpChanged` sa PARAMETRAMI weba (nie importami z innych plikow) i pozostaja domknieciami Rust. Wektory zapisuja protokol wywolan z weba: kolejnosc `resolveOwnerEra`/`resolveOwnerBonusy` (wlasciciele w kolejnosci pierwszego wystapienia jednostki), `getMaxHp(typeId, unit)` z `hp`/`hpMax` jednostki W CHWILI wywolania (przed nadpisaniem `hpMax`), `onUnitHpChanged(id, hp, hpMax)` (kolejnosc i wartosci); test asertuje cala te sekwencje. ZAWEZENIE: drugi argument `getMaxHp` (opcjonalny w webie) jest w Rust zawsze podawany.
- **ZA5 (`StatMultipliersLike`).** Web: `mergeBuildingBonusIntoStatMultipliers<T extends StatMultipliersLike>(mods: T, ...)` mutuje i zwraca ten sam obiekt dowolnego typu strukturalnie zgodnego. Rust: konkretna struktura z 6 polami (`atk`, `obrona`, `pancerz`, `uderzenie`, `rangedAtk`, `health`) i `&mut` w obie strony (wektor `same`: web zwraca ten sam obiekt). Pola spoza interfejsu (generyczne `T`) nie sa reprezentowane - ZAWEZENIE (civ-bonuses.ts nie jest portowany tutaj).
- **ZA6 (`Number#toString`).** Etykiety weba skladaja liczby przez `${x}` / `String(x)` / `+ ' mln'`. Rust: `js_number_to_string` (algorytm ECMAScript Number::toString na najkrotszych cyfrach `{:e}`); przy DOKLADNYM remisie dwoch najkrotszych kandydatow ECMAScript wybiera parzysta ostatnia cyfre, a Rust zwraca wieksza (np. `-2199212936684489.25` -> web `...489.2`) - obsluzone w `shortest_digits` (znalezione przez wektor, naprawione, wektory remisow dodane: 400 liczb typu `n + 0.25/0.75/0.125/0.375`). 2949 liczb (zakresy `1e-9`..`1e25`, ujemne, `NaN`, `Infinity`, `-0`, granice wykladnika `1e21`/`1e-7`), 0 rozbieznosci.
- **ZA7 (dane balansowe).** Stale/teksty/progi z KODU weba: `data/derived/manpower-params.json` (granice epoki, minimalna liczba ludkow, `Zwiadowca`, 100 jako gorna granica procentu, domyslne odnowa/leczenie, dolne granice mnoznikow, nazwy typow bonusow, klucze sortowania, powody blokady, zbior cywilnych, teksty i progi formatowania, domyslny `popCost` zwrotu), `data/derived/unit-building-bonuses.json` (id sciezek, maksima pp 45/50, limit glebokosci lancucha 32, liczba tercji, podstawa procentu, teksty), `data/derived/locale-compare-ascii.json` (ZA2). Parsery i singletony w `data/derived.rs` (dopisek na koncu pliku). Tabela epok (`epoka-ludnosc-manpower.json`) i `miasto-params.json` byly juz w silniku (`data/economy_society.rs`) - czytane stamtad, kopia identyczna z plikiem weba. Elementy strukturalne (0, 1, `0.5` w zaokragleniu, indeksy tablic, format `{:e}`) opisuje `dowody/grep-literals-r1.txt`.
- **ZA8 (sortowanie).** Web `Array#sort` jest stabilne, a komparator zwraca liczbe (`NaN` = rowne). Rust: wlasne stabilne sortowanie wstawianie (`stable_sort_by`) z komparatorem `f64` (bez paniki dla niespojnych komparatorow). Dla spojnych komparatorow wynik jest identyczny z kazdym stabilnym sortowaniem; mieszanki `NaN`/skonczonych (niespojne) NIE_ZMIERZONO (nieosiagalne dla skonczonych pul; wektory z `NaN` w `maxMult` daja komparator rowny `NaN` wszedzie).
- **ZA9 (`unit-building-bonuses`).** `MnoznikBuildingLookup.baza` (`{ mnoznik? } | null`) jest splaszczone do `baza_mnoznik: Option<f64>` (`None` = brak/`null`/nie-liczba), `upgradeFrom` do `Option<String>` (nie-napis = `''`). `String#trim` weba: wlasny zbior znakow (ECMAScript WhiteSpace + LineTerminator; U+FEFF obcinany, U+0085 NIE - inaczej niz `str::trim`). Wektory: ` `, `﻿`, `\u0085`, ` `, `　`, `᠎` w `upgradeFrom`. Duplikaty `id` w liscie: pozniejszy wygrywa (`Map`). Prawdziwe dane gry: wektory `"$real"` uzywaja `data/buildings.json` (ten sam plik po stronie weba i Rust).
- **ZA10 (zakres `combat.rs`).** Do `domain/combat.rs` dopisano WYLACZNIE modul `unit_building_bonuses` (bonusy budynkow jednostek); istniejacy kod walki bez zmian.

## 5. Testy i wektory

Nowe pliki: `tests/p6_5b_format.rs` (5 testow), `p6_5b_manpower.rs` (13), `p6_5b_replenish.rs` (1), `p6_5b_bonuses.rs` (7), `p6_5b_tables.rs` (6) = **32 testow**, wspolne `tests/p6_5b_vectors/common.rs`, wektory `tests/p6_5b_vectors/{format,manpower,replenish,buildings}.json` (generator `gen-p65b-vectors.mjs`, deterministyczny LCG; 61501 przypadkow z uruchomionego weba).

| Plik wektorow | Rozmiar | Przypadki | Grupy (liczba przypadkow) |
|---|---|---|---|
| `format.json` | 729 KB | 23008 | fmt.numberToString=2949, fmt.formatPopulationAbs=847, fmt.formatObywateleLabel=315, collate.pairs=18641, collate.nonAscii=256 |
| `manpower.json` | 5468 KB | 29423 | scalar.epokaManpowerRow=23, scalar.clampLudki=17, scalar.cityLudnoscAbsolutna=391, scalar.cityManpowerMax=2000, scalar.unitManpowerCost=368, scalar.unitManpowerCostForType=1200, scalar.rekrutUnitEquivalents=1500, scalar.isScoutTypeId=9, scalar.manpowerCostForHeal=1764, scalar.maxAffordableManpowerHeal=5000, scalar.manpowerHealCapForTurn=1210, scalar.manpowerRegenGain=1500, scalar.regenGainDefaults=9, params.replenish=1221, params.regen=228, params.civ=1503, city.cityManpowerCurrent=700, city.tickManpowerRegen=700, city.cityManpowerSnapshot=700, city.canAffordUnitManpower=700, city.refreshManpowerAfterPopChange=700, city.spendManpower=700, city.refundUnitSpawnToCity=700, city.tryDeductUnitSpawnCosts=700, city.empireTotals=500, city.canAffordEmpire=500, city.refundDefaults=200, mut.deduct=900, mut.refund=900, mut.tryDeductEmpire=900, misc.isUnitInBesiegedLocation=800, misc.replenishmentUnitSortKey=800, misc.syncLiveUnitHp=300, misc.isCivilianUnit=80 |
| `replenish.json` | 2342 KB | 950 | cases=950 |
| `buildings.json` | 2056 KB | 8120 | mnoznikRoleForBuildingId=57, cityBonus=2000, cumulative=2000, depth=63, real=64, realCumulative=42, unitProc=33, badgeGrid=125, apply=1200, hint=1936, merge=600 |

Porownanie `f64` jest **bitowe** (`to_bits`; `NaN == NaN`; `-0` != `0`). Liczby niecalkowite i `|x| > 2^53` w wektorach sa zapisane jako `{"$f": "<String(x)>"}` (bez bledu 1 ulp `serde_json`; blad znaleziony na wektorze `1.2345678901234568e20`, naprawiony w generatorze). Testy ksztaltu tabel (`p6_5b_tables.rs`) nie pinuja wartosci balansowych; osobny test porownuje tabele ze stalymi z URUCHOMIONEGO weba (`consts`).

**Niezalezny weryfikator** `verify-p65b-vectors.py` (Python, osobna implementacja czytana ze zrodel TS, bez Rust i bez Node; wlasne `Number#toString`, `localeCompare`, `trim`, `Math.*`): `PRZYPADKOW: 81336`, `ROZBIEZNOSCI: 0` (`verify-p65b-r1.log`, `EXIT=0`); obejmuje tez porownanie tabel Rust ze stalymi odczytanymi REGEXEM z tekstu TS (`tabela_vs_TS.*`) i kopii danych weba w silniku. Weryfikator zostal sprawdzony negatywnie (zmiana `proc_max_na_ture`/`max_pp` w kopii tabel oraz podmiana jednego wyniku w kopii wektora dala `ROZBIEZNOSCI` > 0: `dowody/verify-negative-r1.txt`).

## 6. Mutacje (testy wykrywaja zmiany)

`mutate-p65b.py`: 53 mutacji kodu lub tabel, kazda uruchamia wskazany test, plik jest przywracany. Wynik: **52 WYKRYTA** z 53 (szczegoly i surowe wyjscie: `dowody/mutation-evidence-r1.txt`).

Tryb wykonania (odstepstwo od wzorca P6.5A, jawnie): maszyna byla wspoldzielona z innymi tematami (load ~20, jeden build ~7 min). M01-M05 wykonano w trybie pojedynczym (jedna mutacja = jeden `cargo test --test <binarium>`; `dowody/mutation-evidence-r1-part0.txt`), pozostale 48 w trybie GRUPOWYM: `mutate-p65b.py` laczy w jeden build 1-3 mutacje, ktorych binaria testowe sa ROZLACZNE i ktorych kod nie wplywa na binaria pozostalych czlonkow grupy (bonusy budynkow -> `p6_5b_bonuses`/`p6_5b_tables`; manpower -> `p6_5b_manpower`/`p6_5b_replenish`; formaty -> `p6_5b_format`), uruchamia `cargo test --no-fail-fast --test ... --test ...` i bierze werdykt z wyniku binarium danej mutacji (`test result: FAILED` = WYKRYTA); skrypt wymusza rozne binaria w grupie (`assert`). Kazda mutacja podmienia DOKLADNIE jedno wystapienie wzorca (tryb `check` weryfikuje), plik jest przywracany (tryb `check` po przebiegu: wszystkie wzorce znow wystepuja 1x).

**M02 jest mutacja ROWNOWAZNA** (`clampLudki`: `Math.max(1, Math.floor(p) || 1)`; usuniecie warunku `floored == 0.0` zostawia `js_max(1, 0) = 1`, wynik identyczny dla kazdego wejscia) - wynik NIEWYKRYTA jest oczekiwany; zastepcza mutacja M33 (usuniecie dolnej granicy `js_max(min, ...)`) jest WYKRYTA. Pierwszy przebieg grupowy mial blad parsera wyjscia (stdout/stderr rozdzielone, wszystkie werdykty `BLAD-BUDOWY`) - naprawiony (`stderr=STDOUT`) i przebieg powtorzony w calosci; wynik ponizej pochodzi z drugiego przebiegu.

Mutacja wykryta w trakcie pracy przez wektory, nie przez mutator: `js_number_to_string` zwracalo wieksza cyfre przy dokladnym remisie najkrotszej reprezentacji (ZA6) - naprawione, remisy dodane do wektorow; mutacja M25 pilnuje tej galezi.

| Mutacja | Plik | Test | Wynik | exit |
|---|---|---|---|---|
| M01-epoka-bez-gornej-klamry | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M02-ludki-zero-nie-jest-1 | `src/domain/recruitment.rs` | `p6_5b_manpower` | NIEWYKRYTA | 0 |
| M03-skalowanie-round | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M04-zwiadowca-ma-koszt | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M05-pula-bez-floor | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M06-regen-blok-oblegane-false | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M07-regen-round | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M08-limit-leczenia-ceil | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M09-koszt-leczenia-floor | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M10-max-leczenie-ceil | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M11-odejmij-remis-bez-id | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M12-odejmij-kierunek | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M13-zwrot-kierunek-miejsca | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M14-zwrot-bez-limitu-miejsca | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M15-locale-wielkie-przed-malymi | `data/derived/locale-compare-ascii.json` | `p6_5b_format` | WYKRYTA | 101 |
| M16-locale-kolejnosc-znakow | `data/derived/locale-compare-ascii.json` | `p6_5b_format` | WYKRYTA | 101 |
| M17-przydzial-round | `src/domain/recruitment.rs` | `p6_5b_replenish` | WYKRYTA | 101 |
| M18-reszta-kierunek-luki | `src/domain/recruitment.rs` | `p6_5b_replenish` | WYKRYTA | 101 |
| M19-reszta-remis-id-odwrocony | `src/domain/recruitment.rs` | `p6_5b_replenish` | WYKRYTA | 101 |
| M20-oblezenie-bez-wlasciciela | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M21-hp-bez-klamry | `src/domain/recruitment.rs` | `p6_5b_replenish` | WYKRYTA | 101 |
| M22-hpmax-bez-uzupelnienia | `src/domain/recruitment.rs` | `p6_5b_replenish` | WYKRYTA | 101 |
| M23-cywilne-tylko-kategorie | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M24-callback-hpmax | `src/domain/recruitment.rs` | `p6_5b_replenish` | WYKRYTA | 101 |
| M25-liczba-remis-parzysta | `src/domain/recruitment.rs` | `p6_5b_format` | WYKRYTA | 101 |
| M26-liczba-prog-wykladnika | `src/domain/recruitment.rs` | `p6_5b_format` | WYKRYTA | 101 |
| M27-format-prog-tys-calkowite | `data/derived/manpower-params.json` | `p6_5b_format` | WYKRYTA | 101 |
| M28-mnoznik-max-dolna-granica | `data/derived/manpower-params.json` | `p6_5b_manpower` | WYKRYTA | 101 |
| M29-domyslny-regen | `data/derived/manpower-params.json` | `p6_5b_manpower` | WYKRYTA | 101 |
| M30-tabela-epok-max | `data/derived/manpower-params.json` | `p6_5b_manpower` | WYKRYTA | 101 |
| M31-zwrot-limit-ludnosci | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M32-przyrost-puli-przy-wzroscie | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| M33-ludki-bez-dolnej-granicy | `src/domain/recruitment.rs` | `p6_5b_manpower` | WYKRYTA | 101 |
| B01-trim-rust | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B02-glebokosc-lancucha | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B03-bez-globalnego-licznika | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B04-ogniwa-spoza-sciezki | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B05-mnoznik-ujemny | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B06-duplikat-id-pierwszy | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B07-prog-tercji-ceil | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B08-odznaka-granica-pierwsza | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B09-najlepszy-bez-max | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B10-zmiana-i-zamiast-lub | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B11-zapis-parametrow-pominiety | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B12-separator-wzmianki | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B13-scalanie-bez-zasiegu | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B14-prawda-bez-nan | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B15-procent-podstawa | `data/derived/unit-building-bonuses.json` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B16-etykieta-separator | `data/derived/unit-building-bonuses.json` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B17-sciezka-bez-wielkiej-kuzni | `data/derived/unit-building-bonuses.json` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B18-limit-lancucha-tabela | `data/derived/unit-building-bonuses.json` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B19-proc-jednostki-nieskonczone | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |
| B20-zamkniecie-5a-tercje | `data/derived/unit-building-bonuses.json` | `p6_5b_tables` | WYKRYTA | 101 |

## 7. NIE_ZMIERZONO / RUNDA-2 (jawna lista)

- **`localeCompare` poza ASCII 0x20-0x7E** (ZA2): Rust zapasowo UTF-16; rozbieznosc z webem zmierzona (134/256 par). RUNDA-2 / konieczny pelny kollator ICU (nowa zaleznosc) albo gwarancja ASCII po stronie generatora id.
- **Komparatory niespojne** (mieszanka `NaN` i skonczonych w pulach miast): nieosiagalne dla skonczonych danych; brak wektora (ZA8).
- **Typy id** (`ids.rs`, P2-3): port uzywa `String` jak P6.5A; mapowanie na `CityId`/`UnitId` przy integracji ze `state.rs` (RUNDA-2).
- **`q`/`r` niecalkowite** (miasta/jednostki) i `ownerId` nie-calkowity: web dopuszcza liczby, Rust `i32`/`i64`; wektory zawieraja wylacznie calkowite. NIE_ZMIERZONO.
- **`getMaxHp` bez drugiego argumentu** (inni wolajacy weba): zawezone do zawsze podawanej jednostki (ZA4).
- **Generyczne `T extends StatMultipliersLike`** (ZA5) - konkretna struktura; pola dodatkowe `CivStatMultipliers` (`civ-bonuses.ts`) poza zakresem.
- **Wlasny port** `sumRosterFieldM` / `isFieldBattleUnit` (`auto-battle-power.ts`), `veteranLevel` / `veteranStarCount` (`veteran.ts`), pelnego `units/setup.ts` (w tym `isCivilianUnit` jako samodzielny eksport): inne tematy.
- Podpiecie `manpower`/`unit_building_bonuses` pod `bridge.rs`/`state.rs`/`session.rs` (np. wolanie `tick_manpower_unit_replenishment` w turze): zabronione allowlista (`bridge.rs`, `domain/mod.rs`); moduly dostepne jako `domain::recruitment::manpower` i `domain::combat::unit_building_bonuses`.
- Pamiec/czas: brak pomiarow wydajnosci (niewymagane); sortowanie wstawianie O(n^2) dla list jednostek jednego wlasciciela (web: TimSort) - bez wplywu na wynik.

## 8. Tabela bylo/jest i zmiany testow

| Wielkosc | Bylo (`50b49360`) | Jest |
|---|---|---|
| Testy silnika (`cargo test`) | 745 | 777 (+32, wszystkie nowe w `tests/p6_5b_*.rs`) |
| Zmiany istniejacych testow | - | brak (zadnego istniejacego testu nie edytowano, nie oslabiono, nie usunieto) |
| `domain/recruitment.rs` | 1401 linii (koszty rekrutacji + `army_merge`) | + modul `pub mod manpower` (istniejacy kod bez zmian) |
| `domain/combat.rs` | 498 linii (auto-walka) | + modul `pub mod unit_building_bonuses` (istniejacy kod bez zmian) |
| `data/derived.rs` | 2462 linii | + dopisek na koncu (parsery 3 plikow `data/derived/*.json`) |
| `data/derived/*.json` | 38 plikow | + `manpower-params.json`, `unit-building-bonuses.json`, `locale-compare-ascii.json` |
| Nowe pliki testow | - | `p6_5b_{format,manpower,replenish,bonuses,tables}.rs` + `p6_5b_vectors/` |

**Aktualizacja statusow P6.5A (tylko w tym dokumencie; `P6-5A-JEDNOSTKI-ZYCIE-A.md` nie edytowany):**

| Symbol P6.5A | Status w P6.5A | Status po P6.5B | Uzasadnienie |
|---|---|---|---|
| `stackArmorBadgeLevel` (`armyMerge.ts:854`) | PORTOWANY-Z-WSTRZYKNIETYMI | **PORTOWANY** | `armorPathBadgeLevel` zportowane (`combat::unit_building_bonuses::armor_path_badge_level`); test `p6_5b_tables::p65a_badge_closures_are_closed_by_the_real_path_badge_port` |
| `stackSoftBadgeLevel` (`armyMerge.ts:864`) | PORTOWANY-Z-WSTRZYKNIETYMI | **PORTOWANY** | `softPathBadgeLevel` zportowane (`soft_path_badge_level`); ten sam test |
| `StackVitalsDeps`, `stackVitals`, `computeStackDisplay` (sciezka vitals) | PORTOWANY-Z-WSTRZYKNIETYMI (7 domkniec) | PORTOWANY-Z-WSTRZYKNIETYMI (5 domkniec do zamkniecia przez wolajacego z portem: 2 odznaki zamkniete) | zostaja wstrzykiwane `sumRosterFieldM`, `veteranLevel`, `veteranStarCount` (poza tymi plikami); odznaki podaje sie portem z `unit_building_bonuses` |
| `stackFieldPowerM` | PORTOWANY-Z-WSTRZYKNIETYMI | bez zmian | `sumRosterFieldM` (`auto-battle-power.ts`) - brak w `manpower.ts` (grep) |

## 9. Zero zmian poza allowlista - samokontrola

`git status --short` w worktree: zmodyfikowane `rust-port/engine/src/domain/recruitment.rs`, `rust-port/engine/src/domain/combat.rs` (tylko modul `unit_building_bonuses` na koncu) i `rust-port/engine/src/data/derived.rs` (dopisek na koncu); nowe `rust-port/engine/data/derived/{manpower-params,unit-building-bonuses,locale-compare-ascii}.json`, `rust-port/engine/tests/p6_5b_*.rs`, `rust-port/engine/tests/p6_5b_vectors/**`, ten dokument i `dyspozycje/autobot/runs/R-RUSTPORT-P6-5B-JEDNOSTKI-ZYCIE-B-Q1/**`. Nietknięte: `bridge.rs`, `Cargo.toml`, `domain/mod.rs`, `tests/p6_m00_skeleton.rs`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`. `Cargo.lock` (wygenerowany lokalnie) i `target` NIE sa commitowane; budowa w `CARGO_TARGET_DIR=/home/user/cargo-target-shared/<worktree>` z `CARGO_INCREMENTAL=0`; po zakonczeniu usunieto wlasny podkatalog. `git diff --check` czysty.

## 10. Jak odtworzyc

Metoda generatora wektorow: odstepstwo od dispatchu ("moduly ladowane przez loader bez stubow logiki LUB wycinane werbatim"): generator **nie wycina** funkcji z TS; `gen-p65b-vectors.mjs` laduje przez `p65b-loader-hooks.mjs` CALE moduly TS z pinu `edb8fb56` (`manpower.ts`, `unit-building-bonuses.ts` oraz graf ich importow: `units/setup.ts`, dane JSON) i uruchamia je w Node bez stubow i bez przepisywania (wariant "loader bez stubow" dopuszczony przez dispatch).

```text
# wektory (z katalogu runu; WEB_ROOT = wypakowany git archive edb8fb56 gra/src gra/data)
node --experimental-transform-types --no-warnings --import ./p65b-loader-register.mjs ./gen-p65b-vectors.mjs <WEB_ROOT> rust-port/engine/tests/p6_5b_vectors
python3 -I verify-p65b-vectors.py <WEB_ROOT> rust-port/engine
python3 -I gen-symbols-p65b.py <WEB_ROOT> rust-port/engine > symbols-p65b-r1.tsv
python3 -I grep-literals-p65b.py rust-port/engine > dowody/grep-literals-r1.txt
python3 -I mutate-p65b.py rust-port/engine <CARGO_TARGET_DIR> all
cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test     # w rust-port/engine
```
