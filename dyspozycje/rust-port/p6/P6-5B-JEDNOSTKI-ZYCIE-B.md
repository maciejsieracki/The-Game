# P6.5B - jednostki: zycie, czesc B (`manpower.ts`, `unit-building-bonuses.ts`)

Temat: `R-RUSTPORT-P6-5B-JEDNOSTKI-ZYCIE-B-Q1` (DOMAIN: GAME), runda 2/5, rola Operator (obrona po FAIL Evaluatora r1; commit r1 `90a879a0`).
Pin web: `edb8fb56`. Baza Rust: `origin/rust-port/parity-v2` @ `50b49360` (silnik 745 testow; zawiera czesc A - `recruitment::army_merge`).
Artefakty runu (generator, weryfikator, mutacje, logi bramek): `dyspozycje/autobot/runs/R-RUSTPORT-P6-5B-JEDNOSTKI-ZYCIE-B-Q1/`.

## 0. Obrona rundy 2: odpowiedzi na zarzuty Evaluatora r1 (6 zarzutow)

Kazdy zarzut ma werdykt PRZYJMUJE (poprawka + dowod) albo ODRZUCAM (dowod). Surowe, pelne logi bramek r2: `gate-fmt-r2.log`, `gate-clippy-r2.log`, `gate-test-r2.log` (katalog runu).

| # | Zarzut | Werdykt | Poprawka / dowod |
|---|---|---|---|
| 1 | 8 wierszy `PORTOWANY-ZAWEZONY` poza slownikiem statusow | PRZYJMUJE (czesciowo domkniete, reszta RUNDA-2 z lista) | Slownik wymuszony skryptem (`gen-symbols-p65b.py`: status spoza {PORTOWANY, DANE-JUZ-W-RUST, NIE-DOTYCZY, RUNDA-2} = blad). **Domkniete (zawezenia zniknely):** (a) `StatMultipliersLike` / `mergeBuildingBonusIntoStatMultipliers` - funkcja jest teraz generyczna `<T: StatMultipliers>` (cecha z szescioma dostepami), konkretna struktura `StatMultipliersLike` ja implementuje; nowy test `p6_5b_bonuses::stat_multiplier_merge_is_generic_over_any_structural_type` (typ z innym ukladem pol i polem dodatkowym nietknietym, 600 wektorow z weba) + mutacje B13/B21 (§6) -> PORTOWANY; (b) `getMaxHp`: ODRZUCAM jako zawezenie - jedyne wywolanie weba `manpower.ts:315` to `getMaxHp(u.typeId, u)` (ZAWSZE z jednostka, `manpower.ts:285` opcjonalnosc dotyczy tylko typu parametru), wiec Rust (domkniecie dostaje jednostke) zachowuje sie identycznie; wektory protokolu domkniec (ZA4) bez zmian. **Pozostaje RUNDA-2 (lista R2-1, R2-2, §7):** `tickManpowerUnitReplenishment`, `allocateProportionalReplenishment`, `deductManpowerFromEmpire`, `refundManpowerToEmpire`, `tryDeductUnitSpawnCostsEmpire` (zaleznosc od `localeCompare` poza zmierzonym zakresem i od komparatorow z `NaN`) oraz sam `String.prototype.localeCompare`. Rdzen kazdej z tych funkcji jest dowiedziony wektorami (ZA2, ZA8) - status RUNDA-2 dotyczy WYLACZNIE listy R2-1/R2-2, nie nowego zakresu portu. |
| 2 | Dokumenty obowiazkowe nieprzeczytane | PRZYJMUJE | Przeczytane w r2 (zakresy wymienione w §2a, z jawna lista zakresow NIEPRZECZYTANYCH: m.in. P2-5 tabele akcji 90-481, P3-22 linie 41-84, reszta tabeli luk P6-0 §3): `P6-0`, `P3-22`, `P2-3`, `P2-5`, `PLAN` (calosc, §P6 197-222), `LEDGER`. Dowod, granica odczytu i skutki dla portu: §2 (zdanie o dokumentach) i §2a. Skutki: (i) wykryte pominiete w r1 wnioski P2-3 D-ID-1/D-ID-3 (id jako `u64` newtype, `legacy_id: String` tylko w tabeli importu; tie-break `localeCompare` po id napisowym musi byc odtworzony przy integracji - nowa pozycja §7 I-1); (ii) wzorzec P3-22 (stale w tabelach, testy bez pinow wartosci, status per wiersz z plik:linia) - zgodny z implementacja r1. |
| 3 | `isCivilianUnit` lokalnie (poza slownikiem), tabela `cywilne` bez mechanizmu synchronizacji | PRZYJMUJE | Status wiersza: RUNDA-2 (R2-3) + UDOKUMENTOWANY WYJATEK (§4 ZA3: lokalny port zbioru zamiast wstrzykniecia z P6.5A/ZA2, bo funkcja jest wolana wewnatrz `tickManpowerUnitReplenishment`/`isUnitInBesiegedLocation`/`replenishmentUnitSortKey`, ktore sa portem 1:1). Mechanizm synchronizacji: `check-p65b-civilian-sync.py` (zbiory `CIVILIAN_*` i ksztalt ciala `isCivilianUnit` z pinu == tabela `cywilne`; `dowody/civilian-sync-r2.txt`: ROZBIEZNOSCI 0; test negatywny `dowody/civilian-sync-negative-r2.txt`: ROZBIEZNOSCI 1) oraz istniejacy test `table_constants_equal_the_running_web` (tabela == `CIVILIAN_*` z URUCHOMIONEGO weba). |
| 4 | 7 wierszy TSV wskazuje linie bez nazwanego symbolu | PRZYJMUJE | `gen-symbols-p65b.py` zapisuje teraz kolumne `symbol_rust` (identyfikator pod wskazana linia) i WYMAGA adnotacji `ALIAS:` w uwadze, gdy nazwa TS nie wystepuje w tym identyfikatorze (blad generatora bez adnotacji). Dodane adnotacje: `ParamRow` -> `MiastoManpowerRaw`, `CityReplenishFields` / `CityRecruitFields` -> `ManpowerCity`, `MAX_EPOKA` -> `ManpowerEpokaBounds.max`, `DEFAULT_REPLENISH_PCT` -> `ManpowerDefaultReplenish`, `SCOUT_TYPE_ID` -> pole `scout_type_id`, `MAX_UPGRADE_CHAIN_DEPTH` -> pole `max_glebokosc_lancucha` (+ `DEFAULT_REGEN`, `ROWS`, `StatMultipliersLike`). |
| 5 | `localeCompare` zmierzone tylko w en-US | PRZYJMUJE | `measure-localecompare-locales.mjs` -> `dowody/localecompare-locales-r2.txt` (Node 22.22.0, ICU 77.1): 71 lokalizacji (70 ma dane ICU; `eu` bez danych daje wynik jak en-US), 33 456 par ASCII na lokalizacje + 160 000 par id-ksztaltow gry (`city<n>`, `prod_<tura>_city<n>_<base36>`, `barb_*`, `barbcity_*`, `synth_*`). **Wynik:** ASCII rozni sie od en-US w 18 lokalizacjach (da, nb, nn, cs, sk, hr, bs, tr, az, lt, lv, et, mt, sq, fil, th, haw, cy); dla id-ksztaltow gry roznia sie tylko 3 (et: 2, th: 202, haw: 4 par z 160 000). Pozostale 68 z 71 lokalizacji = en-US dla id gry (probka 160 000 par z deterministycznego LCG, nie wszystkie mozliwe id). Zakres twierdzenia w tabeli: tylko en-US; reszta wpisana do R2-1 / NIE_ZMIERZONO (§7). |
| 6 | Mutacje grupowe: brak dowodu rozlacznosci binariow | PRZYJMUJE (i wykryta realna luka r1) | `dowody/mutation-independence-r2.txt` (`check-mutation-independence.py`, naruszen 0): binaria `p6_5b_format/manpower/replenish` nie importuja `domain::combat`, `p6_5b_bonuses` nie importuje `recruitment`, `recruitment.rs` nie odwoluje sie do `combat`, a `combat::unit_building_bonuses` uzywa z `recruitment` WYLACZNIE `js_max` i `js_number_to_string`. Z analizy wynikla luka w r1: grupy `[M25,M21,M29]`, `[M26,M22]`, `[M27,M24]` laczyly kilka mutacji M* na wspolnym kodzie/binariach (a M25/M26 siedza w `js_number_to_string` uzywanym przez combat). `mutate-p65b.py` wymusza teraz: max 1 mutacja B* i 1 M* w grupie oraz M25/M26 tylko pojedynczo; 7 tych mutacji + 3 dotknietych zmiana kodu (B13, B14, B21) przeliczono w r2 (§6, `dowody/mutation-evidence-r2.txt`). |

## 1. Werdykt rundy 1 (stan faktyczny)

| Pytanie | Odpowiedz |
|---|---|
| Co jest portowane? | Wszystkie eksporty i symbole prywatne z dwoch plikow (tabela §3): stan r2: 103 wierszy = 94 PORTOWANY, 2 DANE-JUZ-W-RUST, 7 RUNDA-2 (lista R2-1..R2-3, §7), 0 NIE-DOTYCZY; slownik statusow zamkniety i wymuszony generatorem (r1 mial 8 PORTOWANY-ZAWEZONY + 1 PORTOWANY-LOKALNIE: patrz §0). |
| Dowod "PORTOWANY" | Kod Rust + test + wektory z URUCHOMIONEGO weba (pin) + niezalezny weryfikator Python (0 rozbieznosci) + mutacje wykrywane (§6). |
| Domkniecia wstrzykniete w P6.5A | `armorPathBadgeLevel` / `softPathBadgeLevel` leza w `unit-building-bonuses.ts` i SA TERAZ PORTEM (`combat::unit_building_bonuses`); test `p6_5b_tables::p65a_badge_closures_are_closed_by_the_real_path_badge_port` podaje je jako domkniecia do `stack_armor_badge_level` / `stack_soft_badge_level` na wektorach P6.5A (`stackBadges`, web: 0 rozbieznosci). Status `PORTOWANY-Z-WSTRZYKNIETYMI` -> `PORTOWANY` dla tych dwoch symboli (tabela §8). `sumRosterFieldM`, `veteranLevel`, `veteranStarCount` NIE leza w tych plikach (grep: `manpower.ts` i `unit-building-bonuses.ts` nie zawieraja `sumRosterFieldM`) - zostaja wstrzykiwane (P6.5A ZA2, §7). |
| Co zostaje na kolejna runde / inny temat? | Tylko to, co jawnie nie nalezy do tych plikow: `sumRosterFieldM`/`isFieldBattleUnit` (`auto-battle-power.ts`), `veteranLevel`/`veteranStarCount` (`veteran.ts`), podpiecie pod `bridge.rs`/`state.rs` (zabronione allowlista), pelny `isCivilianUnit` w swoim temacie (`units/setup.ts`; tu port lokalny zbioru, §4 ZA3). |
| Bramki | fmt `EXIT=0`, clippy `--all-targets -D warnings` `EXIT=0`, test `EXIT=0`: r1 777 przeszlo (745 + 32), **r2 778 przeszlo, 0 nie (745 + 33)**; surowe, pelne logi: `gate-{fmt,clippy,test}-r1.log` oraz `gate-{fmt,clippy,test}-r2.log`. Weryfikator r2: `verify-p65b-r2.log` (PRZYPADKOW 81336, ROZBIEZNOSCI 0, wektory nie zmienione w r2). |
| Zmiany poza allowlista | Brak (§9). |

## 2. Zrodla przeczytane w calosci (liczby linii)

Czytane w calosci (`Read` bez ograniczen zakresu) po wyodrebnieniu `git archive edb8fb56 gra/src gra/data` do wlasnego katalogu poza repo (`mktemp -d`).

| Plik | Linie (`wc -l`) | Linie niepuste (`grep -c -v '^\s*$'`) | Eksporty (regex `^export`) |
|---|---|---|---|
| `gra/src/game/manpower.ts` | 877 | 798 | 52 (40 funkcji, 11 interfejsow/typow, 1 stala) + 10 symboli prywatnych (`ROWS`, `MAX_EPOKA`, `ParamRow`, `DEFAULT_REGEN`, `DEFAULT_REPLENISH_PCT`, `CityReplenishFields`, `ReplenishmentCandidate`, `allocateProportionalReplenishment`, `scaledManpower`, `CityRecruitFields`) |
| `gra/src/game/unit-building-bonuses.ts` | 526 | 488 | 33 (17 funkcji, 7 interfejsow/typow, 9 stalych) + 5 symboli prywatnych (`mnoznikOf`, `MAX_UPGRADE_CHAIN_DEPTH`, `chainMnoznikContribution`, `sumMnoznikForPresentBuildings`, `pathBadgeLevelFromPp`) |

Liczby niepuste zgadzaja sie z dispatchem (798 / 488). Liczba wierszy tabeli symboli jest wymuszana skryptem `gen-symbols-p65b.py` (blad, gdy eksport TS nie ma wiersza albo wiersz wskazuje symbol/test spoza zrodla, Rust lub testow).

Przeczytane dodatkowo (zaleznosci, tylko fragmenty/grep w zakresie uzytym przez te dwa pliki): `units/setup.ts:190-199` (`CIVILIAN_CATEGORIES`, `CIVILIAN_TYPE_IDS`, `isCivilianUnit`), `game/cities.ts` (typ `City`: `population`, `manpower`, `oblegane`, `q`, `r`; id miast `'city' + cities.length`, `cities.ts:1249`), `main.ts:3932` (id jednostek), `data/epoka-ludnosc-manpower.json`, `data/miasto-params.json`, `data/buildings.json`. Dokumenty przeczytane: `P6-5A-JEDNOSTKI-ZYCIE-A.md` (w calosci; wzorzec i lista wstrzyknietych domkniec), skrypty runu P6.5A (`gen-p65a-vectors.mjs`, `verify-p65a-vectors.py`, `mutate-p65a.py`, `gen-symbols-p65a.py`, loader bez stubow - w calosci), `P6-0-GAP-ANALYSIS.md` (stan r1: wiersze 16/117/167/169/171 i wiersz planu P6.5 - grep; w r2 doczytane wg zdania ponizej). **Dokumenty obowiazkowe z dispatchu: w rundzie 1 NIE przeczytane, w rundzie 2 przeczytane** (§2a, zarzut 2 Evaluatora r1): `p6/P6-0-GAP-ANALYSIS.md` (435 linii), `p3/P3-22-FLATTEN-STAGE2.md` (441), `p2/P2-3-ENTITY-IDS.md` (380), `p2/P2-5-COMMANDS.md` (668), `PLAN-PORT-RUST-TAURI-20261020.md` (305), `LEDGER.md` (195) - odczyt zakresami linii z wersji `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`git show`); przy odczycie szerokosc dlugich wierszy tabel obcieto do 220-480 znakow (granica odczytu opisana jawnie w §2a), P6-0 §3 (183 wiersze tabeli luk) przejrzane w wierszach P6.5/P6.1 i w §0, §1, §5, §6a, §6b, §9 - wnioski i ich skutek dla portu w §2a.

## 2a. Dokumenty obowiazkowe z dispatchu (zarzut 2 Evaluatora r1): dowod odczytu i skutki dla portu

Odczyt w r2: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<sciezka>` do pliku roboczego poza repo, nastepnie `sed -n` wskazanymi zakresami linii (kolumna "Czesci przeczytane"; zakresy nieprzeczytane wymienione jawnie). **Granica odczytu (jawnie):** przy odczycie ucieto szerokosc dlugich wierszy tabel do 220-480 znakow (`cut -c`), wiec prawe kolumny najdluzszych wierszy (np. uwagi w tabelach P2-3 §5, P2-5 §2, LEDGER) nie zostaly przeczytane litera po literze; liczby linii: `wc -l`.

| Dokument | Linie | Czesci przeczytane (zakresy) | Wniosek wazny dla P6.5B | Skutek |
|---|---|---|---|---|
| `p6/P6-0-GAP-ANALYSIS.md` | 435 | 1-60 (§0-§1a), wiersze tabeli luk §3 dla P6.1/P6.5 wskazane grepem (`P6.5`, `P6.1`), 299-435 (§5, §6b, §6a, §7-§9); NIE przeczytane wiersz po wierszu: pozostale ok. 150 wierszy §3 (183 wiersze) i §2 (graf), §4 | P6.5 = 2336 LOC web, allowlista `recruitment.rs`, `combat.rs` (tylko bonusy budynkow), `tests/p6_5_*.rs` (wg §6b; dispatch zmienil nazwy testow na `p6_5b_*`); wiersz 117 `manpower.ts` (798 LOC, 52 eksporty) = CZESCIOWO tier domena, `PORTOWANE-1:1` = 0 do czasu wektorow z weba (§0); regula: pole danych w Rust nie jest odpowiednikiem funkcji | zgodne z r1: status PORTOWANY tylko z wektorem z URUCHOMIONEGO weba + testem; kolizje allowlisty `combat.rs` z P6.13 (sekwencyjnie) - dopisany tylko modul `unit_building_bonuses` |
| `p3/P3-22-FLATTEN-STAGE2.md` | 441 | 1-40, 85-441 (sekcje 0, 2-12; NIE przeczytane: 41-84, tabela 1b ETAP 3 z 48 pozycjami) | Stale balansowe/mnozniki -> edytowalne tabele `data/derived/*.json` + parser w `data/derived.rs`; testy bez pinow wartosci (zarzut 5 r4: porownanie tabeli z literalem w tescie = pin); status per wiersz z plik:linia; generator URUCHAMIA kod weba (loader `.ts`), weryfikator niezalezny z testem negatywnym; zakaz ogolnych etykiet | r1 stosowal ten sam wzorzec (loader bez stubow, `verify-p65b-vectors.py` + test negatywny, `manpower-params.json`, `unit-building-bonuses.json`); w r2 dochodza test negatywny `check-p65b-civilian-sync.py` i walidacja lokalizacji w generatorze tabeli |
| `p2/P2-3-ENTITY-IDS.md` | 380 | 1-81, 127-298, §9 (299-380) | D-ID-1: `u64` newtype (`CityId`/`UnitId`/`PlayerId`), `legacy_id: String` tylko jako tabela mapowania importu poza `GameState`; D-ID-3: nowe id z licznika w stanie (nie `Math.random`/`'city'+length`); D-ID-7: `enum OwnerRef { Player, Barbarian, Rebel }` zamiast liczb ze znakiem; D-ID-10: `UnitState.kind` = klucz katalogu danych; D-ID-11: pola `manpower` itd. maja placeholdery w `GameState` | port uzywa `String` jak P6.5A (`StosJednostka`): to warstwa funkcji czystych na polach `Pick<City,...>`; mapowanie na `CityId`/`UnitId`/`OwnerRef` nalezy do integracji ze `state.rs` (poza allowlista). **Nowy wniosek r2 (I-1, §7):** web sortuje remisy po `a.id.localeCompare(b.id)` na id NAPISOWYM (`'city'+n`, `'prod_...'`); przy `u64` id kolejnosc remisow zalezy od postaci napisowej id (`"city10" < "city2"` w ICU) - integracja musi zachowac postac napisowa (`legacy_id`) lub odtworzyc te kolejnosc, inaczej zmieni sie wynik `deductManpowerFromEmpire`/`refundManpowerToEmpire`/`allocateProportionalReplenishment` |
| `p2/P2-5-COMMANDS.md` | 668 | 1-89 (§0, §1, §2 legenda, §2.1 rekrutacja R1-R6), 482-581 (§3-§6), 654-668 (§9); NIE przeczytane: 90-481 (tabele §2.2-§2.13 akcji spoza rekrutacji, ok. 390 wierszy) | R1/R2/R3/R6 `recruit_units` (zakup/kolejka) i R5 `recruit_cancel` (zwrot) uzywaja manpower: wolaja `tryDeductUnitSpawnCostsEmpire`, `refundUnitSpawnToCity`, `canAffordUnitManpowerEmpire`; typy argumentow komend: `CityId`, `UnitId`, `unit_type: String` (klucz `units.json`, D-CMD-7) | funkcje portu sa wywolywalne przez przyszle komendy rekrutacji bez zmiany sygnatur poza mapowaniem id (I-1); wpiecie do `bridge.rs`/komend jest zabronione allowlista |
| `PLAN-PORT-RUST-TAURI-20261020.md` | 305 | 1-305 (w tym §P6 197-222) | P6.4-P6.5: "jednostki: tworzenie, lifecycle, ruch, kolejka aktywnosci, manpower/HP, upgrade"; kazdy modul: test stanu przed/po, przypadki negatywne, readback; zasady: web = referencja read-only, zakaz drugiej uproszczonej gry, PASS wymaga niezaleznych faz | zakres P6.5B (manpower/HP + bonusy budynkow) zgodny z P6.5; zero zmian w `gra/**` |
| `LEDGER.md` | 195 | 1-195 (wiersze tabeli rund obciete do 130 znakow przy odczycie; wiersze P6 163-193 odczytane z grepem po `P6`/`manpower`/`cywil`) | precedensy: P6.5A zintegrowany (wiersz 193: 56 symboli, 45 PORTOWANY, 8 PORTOWANY-Z-WSTRZYKNIETYMI); P6.1C/P6.1D/P6.23/M14: ten sam wzorzec obrona -> Final Control; P6-M00 test szkieletu rozstrzygniety administracyjnie | brak konfliktu z allowlista; kolejnosc P6.4 -> P6.5 spelniona (baza zawiera P6.4) |

## 3. Tabela symboli (kazdy eksport ma status)

Zrodlo: `symbols-p65b-r2.tsv` (generowana skryptem `gen-symbols-p65b.py`; kolumny `zrodlo_web`, `symbol`, `rodzaj`, `status`, `odpowiednik_rust`, `symbol_rust`, `test`, `uwaga`; r1: `symbols-p65b-r1.tsv`). Poprawka r2 (zarzut 4): kolumna `symbol_rust` + wymagana adnotacja `ALIAS:` przy niezgodnosci nazw; dopasowanie symbolu po CALYM identyfikatorze (r1 wskazywalo dla `tryDeductUnitSpawnCosts` linie 2438 funkcji `..._empire` zamiast 2486 - blad znaleziony i naprawiony w r2). Numery linii Rust dotycza stanu po `cargo fmt`.

| zrodlo_web | symbol | rodzaj | status | odpowiednik Rust | symbol Rust | test | uwaga |
|---|---|---|---|---|---|---|---|
| `gra/src/game/manpower.ts:30` | `EpokaManpowerRow` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1596` | `EpokaManpowerRow` | p6_5b_manpower::era_table_and_citizen_scalars_match_web | liczby f64 |
| `gra/src/game/manpower.ts:37` | `CityManpowerSnapshot` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2192` | `CityManpowerSnapshot` | p6_5b_manpower::city_pool_functions_match_web | - |
| `gra/src/game/manpower.ts:56` | `ManpowerRegenParams` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1674` | `ManpowerRegenParams` | p6_5b_manpower::regen_gain_matches_web_including_default_params | domyslne = ManpowerRegenParams::default_params() z manpower-params.json |
| `gra/src/game/manpower.ts:68` | `ManpowerDifficulty` | type | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1692` | `ManpowerDifficulty` | p6_5b_manpower::raw_param_loaders_match_web | - |
| `gra/src/game/manpower.ts:70` | `ManpowerReplenishParams` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1700` | `ManpowerReplenishParams` | p6_5b_manpower::raw_param_loaders_match_web | - |
| `gra/src/game/manpower.ts:82` | `loadManpowerReplenishParams` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1710` | `load_manpower_replenish_params` | p6_5b_manpower::raw_param_loaders_match_web + p6_5b_manpower::game_default_params_equal_the_running_web_defaults | surowy miasto-params jako MiastoManpowerRaw (wartosci nie-liczbowe = None); raw=None to domyslny argument weba (prawdziwy plik) |
| `gra/src/game/manpower.ts:99` | `ManpowerHealUnit` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1845` | `ManpowerHealUnit` | p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol | - |
| `gra/src/game/manpower.ts:117` | `syncLiveUnitHp` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1867` | `sync_live_unit_hp` | p6_5b_manpower::besieged_location_sort_key_sync_and_civilian_match_web | - |
| `gra/src/game/manpower.ts:132` | `isUnitInBesiegedLocation` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1875` | `is_unit_in_besieged_location` | p6_5b_manpower::besieged_location_sort_key_sync_and_civilian_match_web | argumenty rozwiniete: owner_id, q, r |
| `gra/src/game/manpower.ts:143` | `replenishmentUnitSortKey` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1891` | `replenishment_unit_sort_key` | p6_5b_manpower::besieged_location_sort_key_sync_and_civilian_match_web | klucze 2/0/1 w manpower-params.json |
| `gra/src/game/manpower.ts:152` | `ManpowerReplenishResult` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1904` | `ManpowerReplenishResult` | p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol | - |
| `gra/src/game/manpower.ts:158` | `manpowerHealCapForTurn` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1914` | `manpower_heal_cap_for_turn` | p6_5b_manpower::heal_cost_and_cap_match_web | - |
| `gra/src/game/manpower.ts:169` | `manpowerCostForHeal` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1927` | `manpower_cost_for_heal` | p6_5b_manpower::heal_cost_and_cap_match_web | - |
| `gra/src/game/manpower.ts:179` | `maxAffordableManpowerHeal` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1935` | `max_affordable_manpower_heal` | p6_5b_manpower::heal_cost_and_cap_match_web | - |
| `gra/src/game/manpower.ts:274` | `tickManpowerUnitReplenishment` | function | RUNDA-2 | `rust-port/engine/src/domain/recruitment.rs:2594` | `tick_manpower_unit_replenishment` | p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol | domkniecia resolveOwnerEra/resolveOwnerBonusy/getMaxHp/onUnitHpChanged to PARAMETRY weba (nie zaleznosci z innych plikow); getMaxHp: ZAMKNIETE - jedyne wywolanie weba to manpower.ts:315 `getMaxHp(u.typeId, u)` ZAWSZE z jednostka, opcjonalnosc drugiego argumentu dotyczy tylko typu wywolujacego (domkniecie Rust ignorujace argument = web); pozostalo: R2-1: localeCompare (ICU) tylko ASCII 0x20-0x7E w en-US (zmierzone); poza tym NIE_ZMIERZONO (lista R2-1 w dokumencie); R2-2: komparatory z NaN w polach miasta NIE_ZMIERZONO (nieosiagalne dla skonczonych danych) |
| `gra/src/game/manpower.ts:373` | `loadManpowerRegenParams` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1734` | `load_manpower_regen_params` | p6_5b_manpower::raw_param_loaders_match_web + p6_5b_manpower::game_default_params_equal_the_running_web_defaults | - |
| `gra/src/game/manpower.ts:385` | `CivBonusPoborLite` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1758` | `CivBonusPoborLite` | p6_5b_manpower::civ_bonus_multipliers_match_web | wartosc: tylko liczby (typeof) - lista napisow/napis to None |
| `gra/src/game/manpower.ts:396` | `civManpowerRegenMult` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1771` | `civ_manpower_regen_mult` | p6_5b_manpower::civ_bonus_multipliers_match_web | - |
| `gra/src/game/manpower.ts:415` | `civManpowerMaxMult` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1788` | `civ_manpower_max_mult` | p6_5b_manpower::civ_bonus_multipliers_match_web | - |
| `gra/src/game/manpower.ts:431` | `civManpowerMults` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1805` | `civ_manpower_mults` | p6_5b_manpower::civ_bonus_multipliers_match_web | krotka (regenMult, maxMult) |
| `gra/src/game/manpower.ts:445` | `manpowerRegenGain` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2234` | `manpower_regen_gain` | p6_5b_manpower::regen_gain_matches_web_including_default_params | - |
| `gra/src/game/manpower.ts:462` | `tickManpowerRegen` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2251` | `tick_manpower_regen` | p6_5b_manpower::city_pool_functions_match_web | - |
| `gra/src/game/manpower.ts:479` | `epokaManpowerRow` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2040` | `epoka_manpower_row` | p6_5b_manpower::era_table_and_citizen_scalars_match_web | - |
| `gra/src/game/manpower.ts:484` | `clampLudki` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2057` | `clamp_ludki` | p6_5b_manpower::era_table_and_citizen_scalars_match_web | - |
| `gra/src/game/manpower.ts:489` | `cityLudnoscAbsolutna` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2071` | `city_ludnosc_absolutna` | p6_5b_manpower::era_table_and_citizen_scalars_match_web | - |
| `gra/src/game/manpower.ts:495` | `formatObywateleLabel` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2076` | `format_obywatele_label` | p6_5b_format::citizen_label_matches_web | Number#toString: js_number_to_string |
| `gra/src/game/manpower.ts:502` | `cityManpowerMax` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2098` | `city_manpower_max` | p6_5b_manpower::pool_and_cost_scalars_match_web | - |
| `gra/src/game/manpower.ts:508` | `SCOUT_TYPE_ID` | const | PORTOWANY | `rust-port/engine/src/data/derived.rs:2563` | `scout_type_id` | p6_5b_tables::table_constants_equal_the_running_web | ALIAS: SCOUT_TYPE_ID -> pole ManpowerParams.scout_type_id (data/derived.rs, manpower-params.json: scout_type_id); wartosc czytana przez is_scout_type_id |
| `gra/src/game/manpower.ts:510` | `isScoutTypeId` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2104` | `is_scout_type_id` | p6_5b_manpower::pool_and_cost_scalars_match_web | - |
| `gra/src/game/manpower.ts:515` | `unitManpowerCost` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2109` | `unit_manpower_cost` | p6_5b_manpower::pool_and_cost_scalars_match_web | - |
| `gra/src/game/manpower.ts:520` | `unitManpowerCostForType` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2114` | `unit_manpower_cost_for_type` | p6_5b_manpower::pool_and_cost_scalars_match_web | - |
| `gra/src/game/manpower.ts:530` | `cityManpowerCurrent` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2122` | `city_manpower_current` | p6_5b_manpower::city_pool_functions_match_web | - |
| `gra/src/game/manpower.ts:541` | `EmpirePoborTotals` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2136` | `EmpirePoborTotals` | p6_5b_manpower::empire_totals_match_web | - |
| `gra/src/game/manpower.ts:548` | `empireSumaLudkow` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2144` | `empire_suma_ludkow` | p6_5b_manpower::empire_totals_match_web | - |
| `gra/src/game/manpower.ts:561` | `rekrutUnitEquivalents` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2156` | `rekrut_unit_equivalents` | p6_5b_manpower::pool_and_cost_scalars_match_web | - |
| `gra/src/game/manpower.ts:567` | `empirePoborTotals` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2165` | `empire_pobor_totals` | p6_5b_manpower::empire_totals_match_web | - |
| `gra/src/game/manpower.ts:585` | `cityManpowerSnapshot` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2204` | `city_manpower_snapshot` | p6_5b_manpower::city_pool_functions_match_web | parametry odnowy z prawdziwego miasto-params.json (jak web) |
| `gra/src/game/manpower.ts:612` | `canAffordUnitManpower` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2274` | `can_afford_unit_manpower` | p6_5b_manpower::city_pool_functions_match_web | - |
| `gra/src/game/manpower.ts:624` | `empireManpowerCurrent` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2288` | `empire_manpower_current` | p6_5b_manpower::empire_totals_match_web | - |
| `gra/src/game/manpower.ts:636` | `deductManpowerFromEmpire` | function | RUNDA-2 | `rust-port/engine/src/domain/recruitment.rs:2315` | `deduct_manpower_from_empire` | p6_5b_manpower::empire_deduct_refund_and_spawn_mutate_like_web | mutuje miasta; R2-1: localeCompare (ICU) tylko ASCII 0x20-0x7E w en-US (zmierzone); poza tym NIE_ZMIERZONO (lista R2-1 w dokumencie); R2-2: komparatory z NaN w polach miasta NIE_ZMIERZONO (nieosiagalne dla skonczonych danych) |
| `gra/src/game/manpower.ts:664` | `refundManpowerToEmpire` | function | RUNDA-2 | `rust-port/engine/src/domain/recruitment.rs:2353` | `refund_manpower_to_empire` | p6_5b_manpower::empire_deduct_refund_and_spawn_mutate_like_web | mutuje miasta; R2-1: localeCompare (ICU) tylko ASCII 0x20-0x7E w en-US (zmierzone); poza tym NIE_ZMIERZONO (lista R2-1 w dokumencie); R2-2: komparatory z NaN w polach miasta NIE_ZMIERZONO (nieosiagalne dla skonczonych danych) |
| `gra/src/game/manpower.ts:698` | `canAffordUnitManpowerEmpire` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2394` | `can_afford_unit_manpower_empire` | p6_5b_manpower::empire_totals_match_web | _recruitingCity/_popCost nieuzywane jak w webie |
| `gra/src/game/manpower.ts:713` | `tryDeductUnitSpawnCostsEmpire` | function | RUNDA-2 | `rust-port/engine/src/domain/recruitment.rs:2438` | `try_deduct_unit_spawn_costs_empire` | p6_5b_manpower::empire_deduct_refund_and_spawn_mutate_like_web | mutuje miasta; R2-1: localeCompare (ICU) tylko ASCII 0x20-0x7E w en-US (zmierzone); poza tym NIE_ZMIERZONO (lista R2-1 w dokumencie); R2-2: komparatory z NaN w polach miasta NIE_ZMIERZONO (nieosiagalne dla skonczonych danych) |
| `gra/src/game/manpower.ts:755` | `UnitSpawnBlockReason` | type | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2412` | `UnitSpawnBlockReason` | p6_5b_manpower::spawn_and_refund_functions_match_web | napisy powodow w manpower-params.json |
| `gra/src/game/manpower.ts:757` | `UnitSpawnDeduction` | interface | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2429` | `UnitSpawnDeduction` | p6_5b_manpower::spawn_and_refund_functions_match_web | - |
| `gra/src/game/manpower.ts:769` | `tryDeductUnitSpawnCosts` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2486` | `try_deduct_unit_spawn_costs` | p6_5b_manpower::spawn_and_refund_functions_match_web | - |
| `gra/src/game/manpower.ts:808` | `refundUnitSpawnToCity` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2528` | `refund_unit_spawn_to_city` | p6_5b_manpower::spawn_and_refund_functions_match_web | domyslny popCost=1: default_refund_pop_cost() |
| `gra/src/game/manpower.ts:827` | `refreshManpowerAfterPopChange` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2551` | `refresh_manpower_after_pop_change` | p6_5b_manpower::city_pool_functions_match_web | - |
| `gra/src/game/manpower.ts:846` | `spendManpower` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2572` | `spend_manpower` | p6_5b_manpower::city_pool_functions_match_web | - |
| `gra/src/game/manpower.ts:858` | `formatPopulationAbs` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2744` | `format_population_abs` | p6_5b_format::population_formats_match_web | Number#toString: js_number_to_string (wlacznie z remisami najkrotszej reprezentacji) |
| `gra/src/game/manpower.ts:870` | `formatManpower` | function | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2768` | `format_manpower` | p6_5b_format::population_formats_match_web | - |
| `gra/src/game/manpower.ts:875` | `allEpokaManpowerRows` | function | DANE-JUZ-W-RUST | `rust-port/engine/src/domain/recruitment.rs:1608` | `all_epoka_manpower_rows` | p6_5b_tables::table_constants_equal_the_running_web | tabela epok z data/epoka-ludnosc-manpower.json (economy_society.rs, identyczna z pinem: kopia danych weba w weryfikatorze) |
| `gra/src/game/manpower.ts:50` | `ROWS` | prywatny | DANE-JUZ-W-RUST | `rust-port/engine/src/domain/recruitment.rs:1608` | `all_epoka_manpower_rows` | p6_5b_tables::table_constants_equal_the_running_web | ALIAS: ROWS -> all_epoka_manpower_rows() (OnceLock z economy_society::parse_epoka_ludnosc_manpower) |
| `gra/src/game/manpower.ts:52` | `MAX_EPOKA` | prywatny | PORTOWANY | `rust-port/engine/src/data/derived.rs:2480` | `ManpowerEpokaBounds` | p6_5b_tables::table_constants_equal_the_running_web | ALIAS: MAX_EPOKA -> ManpowerEpokaBounds.max (struktura min/max z manpower-params.json: epoka) |
| `gra/src/game/manpower.ts:54` | `ParamRow` | prywatny | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1635` | `MiastoManpowerRaw` | p6_5b_manpower::raw_param_loaders_match_web | ALIAS: ParamRow -> MiastoManpowerRaw (surowe wartosci miasto-params; prawdziwy plik: MiastoManpowerRaw::game()) |
| `gra/src/game/manpower.ts:63` | `DEFAULT_REGEN` | prywatny | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1681` | `default_params` | p6_5b_manpower::game_default_params_equal_the_running_web_defaults | ALIAS: DEFAULT_REGEN -> ManpowerRegenParams::default_params() (manpower-params.json: domyslne_regen) |
| `gra/src/game/manpower.ts:75` | `DEFAULT_REPLENISH_PCT` | prywatny | PORTOWANY | `rust-port/engine/src/data/derived.rs:2496` | `ManpowerDefaultReplenish` | p6_5b_manpower::game_default_params_equal_the_running_web_defaults | ALIAS: DEFAULT_REPLENISH_PCT -> ManpowerDefaultReplenish (easy/normal/hard z manpower-params.json: domyslne_uzupelnienie_hp_proc) |
| `gra/src/game/manpower.ts:129` | `CityReplenishFields` | prywatny | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1818` | `ManpowerCity` | p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol | ALIAS: CityReplenishFields -> ManpowerCity (jedna struktura, nadzbior pol Pick<City,...> obu aliasow web) |
| `gra/src/game/manpower.ts:189` | `ReplenishmentCandidate` | prywatny | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1949` | `ReplenishmentCandidate` | p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol | jednostka jako indeks w liscie |
| `gra/src/game/manpower.ts:206` | `allocateProportionalReplenishment` | prywatny | RUNDA-2 | `rust-port/engine/src/domain/recruitment.rs:1963` | `allocate_proportional_replenishment` | p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol | martwy zapis usedMp (manpower.ts:260, wartosc nigdy nie czytana po inicjalizacji remainingMp:240) pominiety; R2-1: localeCompare (ICU) tylko ASCII 0x20-0x7E w en-US (zmierzone); poza tym NIE_ZMIERZONO (lista R2-1 w dokumencie) |
| `gra/src/game/manpower.ts:440` | `scaledManpower` | prywatny | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:2088` | `scaled_manpower` | p6_5b_manpower::pool_and_cost_scalars_match_web | - |
| `gra/src/game/manpower.ts:633` | `CityRecruitFields` | prywatny | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1818` | `ManpowerCity` | p6_5b_manpower::empire_deduct_refund_and_spawn_mutate_like_web | ALIAS: CityRecruitFields -> ManpowerCity (jak CityReplenishFields) |
| `gra/src/game/unit-building-bonuses.ts:59` | `MnoznikBuildingLookup` | interface | PORTOWANY | `rust-port/engine/src/domain/combat.rs:519` | `MnoznikBuildingLookup` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids | baza.mnoznik splaszczone do baza_mnoznik: Option<f64> |
| `gra/src/game/unit-building-bonuses.ts:67` | `ARMOR_BUILDING_IDS` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:526` | `armor_building_ids` | p6_5b_tables::table_constants_equal_the_running_web | unit-building-bonuses.json |
| `gra/src/game/unit-building-bonuses.ts:70` | `SOFT_STAT_BUILDING_IDS` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:531` | `soft_stat_building_ids` | p6_5b_tables::table_constants_equal_the_running_web | unit-building-bonuses.json |
| `gra/src/game/unit-building-bonuses.ts:83` | `mnoznikRoleForBuildingId` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:543` | `mnoznik_role_for_building_id` | p6_5b_bonuses::building_roles_and_real_game_data_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:171` | `cityArmorBonusPercent` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:655` | `city_armor_bonus_percent` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids + p6_5b_bonuses::building_roles_and_real_game_data_match_web | w tym prawdziwe dane gry (buildings.json) |
| `gra/src/game/unit-building-bonuses.ts:179` | `citySoftStatBonusPercent` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:663` | `city_soft_stat_bonus_percent` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids + p6_5b_bonuses::building_roles_and_real_game_data_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:195` | `cumulativeMnoznikForBuildingId` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:671` | `cumulative_mnoznik_for_building_id` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids + p6_5b_bonuses::chain_depth_limit_matches_web | - |
| `gra/src/game/unit-building-bonuses.ts:212` | `UnitBuildingProgress` | interface | PORTOWANY | `rust-port/engine/src/domain/combat.rs:693` | `UnitBuildingProgress` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | pola nie-liczbowe = None |
| `gra/src/game/unit-building-bonuses.ts:218` | `unitPancerzBonusProc` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:706` | `unit_pancerz_bonus_proc` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:223` | `unitParametryBonusProc` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:711` | `unit_parametry_bonus_proc` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:292` | `UnitPathBadgeLevel` | type | PORTOWANY | `rust-port/engine/src/domain/combat.rs:716` | `UnitPathBadgeLevel` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | u8 0-3 |
| `gra/src/game/unit-building-bonuses.ts:295` | `ARMOR_PATH_MAX_PP` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:721` | `armor_path_max_pp` | p6_5b_tables::table_constants_equal_the_running_web | unit-building-bonuses.json |
| `gra/src/game/unit-building-bonuses.ts:297` | `SOFT_PATH_MAX_PP` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:726` | `soft_path_max_pp` | p6_5b_tables::table_constants_equal_the_running_web | unit-building-bonuses.json |
| `gra/src/game/unit-building-bonuses.ts:300` | `ARMOR_PATH_LEVEL_MAX_PP` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:752` | `armor_path_level_max_pp` | p6_5b_tables::table_constants_equal_the_running_web | wyliczane z max_pp i liczba_tercji |
| `gra/src/game/unit-building-bonuses.ts:306` | `SOFT_PATH_LEVEL_MAX_PP` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:757` | `soft_path_level_max_pp` | p6_5b_tables::table_constants_equal_the_running_web | wyliczane z max_pp i liczba_tercji |
| `gra/src/game/unit-building-bonuses.ts:325` | `armorPathBadgeLevel` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:776` | `armor_path_badge_level` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web + p6_5b_tables::p65a_badge_closures_are_closed_by_the_real_path_badge_port | zamyka domkniecie wstrzykniete w P6.5A (stackArmorBadgeLevel) |
| `gra/src/game/unit-building-bonuses.ts:334` | `softPathBadgeLevel` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:781` | `soft_path_badge_level` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web + p6_5b_tables::p65a_badge_closures_are_closed_by_the_real_path_badge_port | zamyka domkniecie wstrzykniete w P6.5A (stackSoftBadgeLevel) |
| `gra/src/game/unit-building-bonuses.ts:339` | `unitPancerzBonusFrac` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:786` | `unit_pancerz_bonus_frac` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:344` | `unitParametryBonusFrac` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:791` | `unit_parametry_bonus_frac` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:359` | `bestBuildingProgressAfterCityVisit` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:808` | `best_building_progress_after_city_visit` | p6_5b_bonuses::city_visit_gain_progress_and_hint_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:373` | `buildingProgressWouldChange` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:822` | `building_progress_would_change` | p6_5b_bonuses::city_visit_gain_progress_and_hint_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:384` | `BuildingBonusGain` | interface | PORTOWANY | `rust-port/engine/src/domain/combat.rs:834` | `BuildingBonusGain` | p6_5b_bonuses::city_visit_gain_progress_and_hint_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:396` | `applyCityVisitBonusGain` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:843` | `apply_city_visit_bonus_gain` | p6_5b_bonuses::city_visit_gain_progress_and_hint_match_web | mutuje pola procentowe |
| `gra/src/game/unit-building-bonuses.ts:421` | `formatBuildingBonusGainHint` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:896` | `format_building_bonus_gain_hint` | p6_5b_bonuses::city_visit_gain_progress_and_hint_match_web + p6_5b_bonuses::gain_hint_text_matches_web_for_arbitrary_gains | szablony w unit-building-bonuses.json; podstawianie jednoprzebiegowe |
| `gra/src/game/unit-building-bonuses.ts:438` | `unitBuildingBonusLabel` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:935` | `unit_building_bonus_label` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:454` | `PathBadgeLevel` | type | PORTOWANY | `rust-port/engine/src/domain/combat.rs:718` | `PathBadgeLevel` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | alias zgodnosci |
| `gra/src/game/unit-building-bonuses.ts:456` | `PATH_A_MAX_PP` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:731` | `path_a_max_pp` | p6_5b_tables::table_constants_equal_the_running_web | alias |
| `gra/src/game/unit-building-bonuses.ts:458` | `PATH_B_MAX_PP` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:736` | `path_b_max_pp` | p6_5b_tables::table_constants_equal_the_running_web | alias |
| `gra/src/game/unit-building-bonuses.ts:477` | `BuildingCombatBonus` | interface | PORTOWANY | `rust-port/engine/src/domain/combat.rs:958` | `BuildingCombatBonus` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:484` | `ZERO_BUILDING_COMBAT_BONUS` | const | PORTOWANY | `rust-port/engine/src/domain/combat.rs:964` | `ZERO_BUILDING_COMBAT_BONUS` | p6_5b_tables::table_constants_equal_the_running_web | - |
| `gra/src/game/unit-building-bonuses.ts:487` | `buildingCombatBonusForUnit` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:970` | `building_combat_bonus_for_unit` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | - |
| `gra/src/game/unit-building-bonuses.ts:497` | `StatMultipliersLike` | interface | PORTOWANY | `rust-port/engine/src/domain/combat.rs:982` | `StatMultipliers` | p6_5b_bonuses::stat_multiplier_merge_matches_web + p6_5b_bonuses::stat_multiplier_merge_is_generic_over_any_structural_type | ALIAS: interfejs strukturalny TS = cecha `StatMultipliers` (szesc dostepow *_mut) + konkretna struktura `StatMultipliersLike` z dokladnie tymi polami (r2: zawezenie ZAMKNIETE - funkcja scalania jest generyczna) |
| `gra/src/game/unit-building-bonuses.ts:512` | `mergeBuildingBonusIntoStatMultipliers` | function | PORTOWANY | `rust-port/engine/src/domain/combat.rs:1030` | `merge_building_bonus_into_stat_multipliers` | p6_5b_bonuses::stat_multiplier_merge_matches_web + p6_5b_bonuses::stat_multiplier_merge_is_generic_over_any_structural_type | generyczna <T: StatMultipliers> jak `<T extends StatMultipliersLike>`; zwraca &mut do tej samej wartosci (web: ten sam obiekt - wektor `same`); test generyczny: inny typ z polem dodatkowym nietknietym |
| `gra/src/game/unit-building-bonuses.ts:89` | `mnoznikOf` | prywatny | PORTOWANY | `rust-port/engine/src/domain/combat.rs:554` | `mnoznik_of` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids | - |
| `gra/src/game/unit-building-bonuses.ts:99` | `MAX_UPGRADE_CHAIN_DEPTH` | prywatny | PORTOWANY | `rust-port/engine/src/data/derived.rs:2612` | `max_glebokosc_lancucha` | p6_5b_bonuses::chain_depth_limit_matches_web | ALIAS: MAX_UPGRADE_CHAIN_DEPTH -> pole max_glebokosc_lancucha (data/derived.rs, unit-building-bonuses.json) |
| `gra/src/game/unit-building-bonuses.ts:113` | `chainMnoznikContribution` | prywatny | PORTOWANY | `rust-port/engine/src/domain/combat.rs:585` | `chain_mnoznik_contribution` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids + p6_5b_bonuses::chain_depth_limit_matches_web | String#trim: is_js_whitespace (U+FEFF tak, U+0085 nie) |
| `gra/src/game/unit-building-bonuses.ts:152` | `sumMnoznikForPresentBuildings` | prywatny | PORTOWANY | `rust-port/engine/src/domain/combat.rs:629` | `sum_mnoznik_for_present_buildings` | p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids | - |
| `gra/src/game/unit-building-bonuses.ts:312` | `pathBadgeLevelFromPp` | prywatny | PORTOWANY | `rust-port/engine/src/domain/combat.rs:762` | `path_badge_level_from_pp` | p6_5b_bonuses::unit_progress_badges_and_fractions_match_web | siatka progow 0.5 pp |
| `gra/src/units/setup.ts:196` | `isCivilianUnit` | function | RUNDA-2 | `rust-port/engine/src/domain/recruitment.rs:1861` | `is_civilian_unit` | p6_5b_manpower::besieged_location_sort_key_sync_and_civilian_match_web + p6_5b_tables::civilian_set_is_resolved_from_the_table + p6_5b_tables::table_constants_equal_the_running_web | R2-3 (WYJATEK UDOKUMENTOWANY, dokument ZA3): zaleznosc manpower.ts spoza dwoch plikow tematu, portowana LOKALNIE (nie wstrzykiwana jak w P6.5A/ZA2) - zbiory CIVILIAN_CATEGORIES/CIVILIAN_TYPE_IDS w manpower-params.json (cywilne); synchronizacja: check-p65b-civilian-sync.py (zrodlo pinu == tabela, test negatywny) + test porownujacy tabele z CIVILIAN_* z URUCHOMIONEGO weba; pelny port/wstrzykniecie w temacie units/setup |
| `<ECMAScript>` | `String.prototype.localeCompare` | builtin | RUNDA-2 | `rust-port/engine/src/domain/recruitment.rs:1543` | `locale_compare` | p6_5b_format::locale_compare_matches_web_for_ascii | ALIAS: builtin ECMAScript localeCompare -> locale_compare; R2-1: localeCompare (ICU) tylko ASCII 0x20-0x7E w en-US (zmierzone); poza tym NIE_ZMIERZONO (lista R2-1 w dokumencie); zmierzone w r2: dowody/localecompare-locales-r2.txt |
| `<ECMAScript>` | `Number.prototype.toString` | builtin | PORTOWANY | `rust-port/engine/src/domain/recruitment.rs:1433` | `js_number_to_string` | p6_5b_format::number_to_string_matches_web | ALIAS: builtin ECMAScript Number#toString -> js_number_to_string; wlacznie z dokladnymi remisami najkrotszej reprezentacji (parzysta ostatnia cyfra) |

Statusy: `PORTOWANY` = pelny port bez zawezen; `PORTOWANY-ZAWEZONY` = port z udokumentowanym zawezeniem (ZA2 `localeCompare` tylko ASCII, ZA5 `StatMultipliersLike` bez generyka, `getMaxHp` zawsze z jednostka); `PORTOWANY-LOKALNIE` = zaleznosc spoza dwoch plikow zportowana w tym temacie (ZA3); `DANE-JUZ-W-RUST` = dane/tabela istnieja i sa czytane z istniejacego parsera (dowod: kopia `data/*.json` w silniku == plik weba, `verify-p65b-vectors.py` `kopia_danych.*`, plus wektor `consts` z uruchomionego weba).

## 4. Decyzje i zalozenia (zamiast pytan)

- **ZA1 (model danych).** `ManpowerCity` jest nadzbiorem pol `Pick<City, ...>` czytanych/pisanych przez `manpower.ts` (jedna struktura zastepuje `CityReplenishFields` i `CityRecruitFields`); `manpower: Option<f64>` (`None` = `undefined`), `oblegane: Option<bool>`, `q`/`r` `i32`, `population` `f64`. `ManpowerHealUnit` odpowiada interfejsowi weba (`hp`, `hpMax`, `q`, `r`, `inGarnizon` opcjonalne). Liczby to `f64` z semantyka JS (`NaN`, `-0`, `Math.floor/ceil/min/max/round` jako `floor`/`ceil`/`army_merge::js_min/js_max/js_round`, `||` na `NaN`/`0`) - potwierdzone wektorami z `NaN`, `Infinity`, `-0`, wartosciami ujemnymi i ulamkowymi. Wspolrzedne `i32` (jak P6.5A: niecalkowite NIE_ZMIERZONO).
- **ZA2 (`localeCompare`).** Web sortuje id miast i jednostek przez `a.id.localeCompare(b.id)` (ICU, locale srodowiska; zmierzone `en-US`) w `deductManpowerFromEmpire`, `refundManpowerToEmpire` i `allocateProportionalReplenishment`. Rust nie ma ICU (nowa zaleznosc zabroniona allowlista). Port: kolejnosc ICU dla ASCII 0x20-0x7E ZMIERZONA w uruchomionym Node (`Intl.Collator`, `sensitivity: base`) i zapisana jako edytowalna tabela `data/derived/locale-compare-ascii.json` (poziom 1: znaki, wielkosc liter ignorowana; poziom 3: male przed wielkimi); wektory: 18641 par napisow z weba (caly ASCII x ASCII + id podobne do prawdziwych + warianty wielkosci liter), 0 rozbieznosci. Id w grze to ASCII: miasta `'city' + n` (`cities.ts:1249`), jednostki `'prod_' + turn + '_' + cityId + '_' + <losowy base36>` (`main.ts:3932`). **Poza ASCII: NIE_ZMIERZONO** - Rust zapasowo porownuje jednostki UTF-16; zmierzone na 256 parach (16 napisow spoza ASCII/z znakami sterujacymi) zapasowa sciezka rozni sie od weba w 134 parach (`format.json` `collate.nonAscii`), wiec nie nalezy jej uzywac dla id spoza ASCII (RUNDA-2, §7). **Pomiar r2 (zarzut 5):** kolejnosc ASCII zmierzono tez w 71 lokalizacjach (`dowody/localecompare-locales-r2.txt`): 18 lokalizacji (da, nb, nn, cs, sk, hr, bs, tr, az, lt, lv, et, mt, sq, fil, th, haw, cy) rozni sie od en-US dla ogolnych napisow ASCII; dla id-ksztaltow gry roznia sie tylko et (2 z 160 000 par), th (202) i haw (4). Web wola `a.id.localeCompare(b.id)` BEZ argumentu locale, wiec wynik zalezy od jezyka przegladarki gracza; port jest zweryfikowany WYLACZNIE dla en-US (i dla lokalizacji rownych en-US na id gry, wg pomiaru) - reszta w R2-1 (§7).
- **ZA3 (`isCivilianUnit`).** `tickManpowerUnitReplenishment` wola `isCivilianUnit` z `units/setup.ts:196` (poza dwoma plikami tematu). Zbiory (`CIVILIAN_CATEGORIES`, `CIVILIAN_TYPE_IDS`) sa w `manpower-params.json` (`cywilne`), funkcja `is_civilian_unit` ma wektor z URUCHOMIONEGO weba (80 par kategoria x typ); pelny port `units/setup.ts` zostaje w swoim temacie (tam nalezy ewentualna deduplikacja). **WYJATEK UDOKUMENTOWANY (r2, zarzut 3):** inaczej niz w P6.5A/ZA2 (gdzie zaleznosci spoza plikow byly WSTRZYKIWANE jako domkniecia), `isCivilianUnit` jest zalezoscia WEWNETRZNA ciala funkcji portowanych 1:1 (`isUnitInBesiegedLocation`, `replenishmentUnitSortKey` i petla `tickManpowerUnitReplenishment`), a jej wynik zalezy tylko od dwoch stalych zbiorow napisow; dlatego zbiory sa danymi (`manpower-params.json`/`cywilne`), a nie parametrem. Status wiersza: RUNDA-2 (R2-3: pelny port albo wstrzykniecie w temacie `units/setup`). Duplikacja danych jest pilnowana: `check-p65b-civilian-sync.py` (zbiory i ksztalt ciala funkcji z pinu == tabela, ROZBIEZNOSCI 0; test negatywny: 1) oraz test `table_constants_equal_the_running_web` (tabela == `CIVILIAN_*` z uruchomionego weba).
- **ZA4 (domkniecia `tickManpowerUnitReplenishment`).** `resolveOwnerEra`, `resolveOwnerBonusy`, `getMaxHp`, `onUnitHpChanged` sa PARAMETRAMI weba (nie importami z innych plikow) i pozostaja domknieciami Rust. Wektory zapisuja protokol wywolan z weba: kolejnosc `resolveOwnerEra`/`resolveOwnerBonusy` (wlasciciele w kolejnosci pierwszego wystapienia jednostki), `getMaxHp(typeId, unit)` z `hp`/`hpMax` jednostki W CHWILI wywolania (przed nadpisaniem `hpMax`), `onUnitHpChanged(id, hp, hpMax)` (kolejnosc i wartosci); test asertuje cala te sekwencje. **getMaxHp (r2): brak zawezenia** - drugi argument jest opcjonalny wylacznie w TYPIE parametru weba (`manpower.ts:285`); jedyne wywolanie w `manpower.ts` to `getMaxHp(u.typeId, u)` (`manpower.ts:315`, zawsze z jednostka), a domkniecie Rust dostaje jednostke i moze ja zignorowac - zachowanie identyczne z webem.
- **ZA5 (`StatMultipliersLike`).** Web: `mergeBuildingBonusIntoStatMultipliers<T extends StatMultipliersLike>(mods: T, ...)` mutuje i zwraca ten sam obiekt dowolnego typu strukturalnie zgodnego. Rust (r2, zawezenie ZAMKNIETE): cecha `StatMultipliers` (szesc dostepow `atk_mut`, `obrona_mut`, `pancerz_mut`, `uderzenie_mut`, `ranged_atk_mut`, `health_mut`) odpowiada interfejsowi strukturalnemu `StatMultipliersLike`; funkcja `merge_building_bonus_into_stat_multipliers<'a, T: StatMultipliers>(mods: &'a mut T, ...) -> &'a mut T` jest generyczna jak web (`&mut` w obie strony; wektor `same`: web zwraca ten sam obiekt). Konkretna struktura `StatMultipliersLike` z 6 polami implementuje te ceche; pola dodatkowe innego typu nie sa dotykane (test `stat_multiplier_merge_is_generic_over_any_structural_type`: typ `WideMods` z innym ukladem pol i polem `extra`, te same 600 wektorow z weba). Implementacja cechy dla `CivStatMultipliers` (`civ_bonuses.rs`, poza allowlista) = zadanie integracji (I-2, §7).
- **ZA6 (`Number#toString`).** Etykiety weba skladaja liczby przez `${x}` / `String(x)` / `+ ' mln'`. Rust: `js_number_to_string` (algorytm ECMAScript Number::toString na najkrotszych cyfrach `{:e}`); przy DOKLADNYM remisie dwoch najkrotszych kandydatow ECMAScript wybiera parzysta ostatnia cyfre, a Rust zwraca wieksza (np. `-2199212936684489.25` -> web `...489.2`) - obsluzone w `shortest_digits` (znalezione przez wektor, naprawione, wektory remisow dodane: 400 liczb typu `n + 0.25/0.75/0.125/0.375`). 2949 liczb (zakresy `1e-9`..`1e25`, ujemne, `NaN`, `Infinity`, `-0`, granice wykladnika `1e21`/`1e-7`), 0 rozbieznosci.
- **ZA7 (dane balansowe).** Stale/teksty/progi z KODU weba: `data/derived/manpower-params.json` (granice epoki, minimalna liczba ludkow, `Zwiadowca`, 100 jako gorna granica procentu, domyslne odnowa/leczenie, dolne granice mnoznikow, nazwy typow bonusow, klucze sortowania, powody blokady, zbior cywilnych, teksty i progi formatowania, domyslny `popCost` zwrotu), `data/derived/unit-building-bonuses.json` (id sciezek, maksima pp 45/50, limit glebokosci lancucha 32, liczba tercji, podstawa procentu, teksty), `data/derived/locale-compare-ascii.json` (ZA2). Parsery i singletony w `data/derived.rs` (dopisek na koncu pliku). Tabela epok (`epoka-ludnosc-manpower.json`) i `miasto-params.json` byly juz w silniku (`data/economy_society.rs`) - czytane stamtad, kopia identyczna z plikiem weba. Elementy strukturalne (0, 1, `0.5` w zaokragleniu, indeksy tablic, format `{:e}`) opisuje `dowody/grep-literals-r1.txt`.
- **ZA8 (sortowanie).** Web `Array#sort` jest stabilne, a komparator zwraca liczbe (`NaN` = rowne). Rust: wlasne stabilne sortowanie wstawianie (`stable_sort_by`) z komparatorem `f64` (bez paniki dla niespojnych komparatorow). Dla spojnych komparatorow wynik jest identyczny z kazdym stabilnym sortowaniem; mieszanki `NaN`/skonczonych (niespojne) NIE_ZMIERZONO (nieosiagalne dla skonczonych pul; wektory z `NaN` w `maxMult` daja komparator rowny `NaN` wszedzie).
- **ZA9 (`unit-building-bonuses`).** `MnoznikBuildingLookup.baza` (`{ mnoznik? } | null`) jest splaszczone do `baza_mnoznik: Option<f64>` (`None` = brak/`null`/nie-liczba), `upgradeFrom` do `Option<String>` (nie-napis = `''`). `String#trim` weba: wlasny zbior znakow (ECMAScript WhiteSpace + LineTerminator; U+FEFF obcinany, U+0085 NIE - inaczej niz `str::trim`). Wektory: ` `, `﻿`, `\u0085`, ` `, `　`, `᠎` w `upgradeFrom`. Duplikaty `id` w liscie: pozniejszy wygrywa (`Map`). Prawdziwe dane gry: wektory `"$real"` uzywaja `data/buildings.json` (ten sam plik po stronie weba i Rust).
- **ZA10 (zakres `combat.rs`).** Do `domain/combat.rs` dopisano WYLACZNIE modul `unit_building_bonuses` (bonusy budynkow jednostek); istniejacy kod walki bez zmian.

## 5. Testy i wektory

Nowe pliki: `tests/p6_5b_format.rs` (5 testow), `p6_5b_manpower.rs` (13), `p6_5b_replenish.rs` (1), `p6_5b_bonuses.rs` (8; r2: +`stat_multiplier_merge_is_generic_over_any_structural_type`), `p6_5b_tables.rs` (6) = **33 testow** (r1: 32), wspolne `tests/p6_5b_vectors/common.rs`, wektory `tests/p6_5b_vectors/{format,manpower,replenish,buildings}.json` (generator `gen-p65b-vectors.mjs`, deterministyczny LCG; 61501 przypadkow z uruchomionego weba).

| Plik wektorow | Rozmiar | Przypadki | Grupy (liczba przypadkow) |
|---|---|---|---|
| `format.json` | 729 KB | 23008 | fmt.numberToString=2949, fmt.formatPopulationAbs=847, fmt.formatObywateleLabel=315, collate.pairs=18641, collate.nonAscii=256 |
| `manpower.json` | 5468 KB | 29423 | scalar.epokaManpowerRow=23, scalar.clampLudki=17, scalar.cityLudnoscAbsolutna=391, scalar.cityManpowerMax=2000, scalar.unitManpowerCost=368, scalar.unitManpowerCostForType=1200, scalar.rekrutUnitEquivalents=1500, scalar.isScoutTypeId=9, scalar.manpowerCostForHeal=1764, scalar.maxAffordableManpowerHeal=5000, scalar.manpowerHealCapForTurn=1210, scalar.manpowerRegenGain=1500, scalar.regenGainDefaults=9, params.replenish=1221, params.regen=228, params.civ=1503, city.cityManpowerCurrent=700, city.tickManpowerRegen=700, city.cityManpowerSnapshot=700, city.canAffordUnitManpower=700, city.refreshManpowerAfterPopChange=700, city.spendManpower=700, city.refundUnitSpawnToCity=700, city.tryDeductUnitSpawnCosts=700, city.empireTotals=500, city.canAffordEmpire=500, city.refundDefaults=200, mut.deduct=900, mut.refund=900, mut.tryDeductEmpire=900, misc.isUnitInBesiegedLocation=800, misc.replenishmentUnitSortKey=800, misc.syncLiveUnitHp=300, misc.isCivilianUnit=80 |
| `replenish.json` | 2342 KB | 950 | cases=950 |
| `buildings.json` | 2056 KB | 8120 | mnoznikRoleForBuildingId=57, cityBonus=2000, cumulative=2000, depth=63, real=64, realCumulative=42, unitProc=33, badgeGrid=125, apply=1200, hint=1936, merge=600 |

Porownanie `f64` jest **bitowe** (`to_bits`; `NaN == NaN`; `-0` != `0`). Liczby niecalkowite i `|x| > 2^53` w wektorach sa zapisane jako `{"$f": "<String(x)>"}` (bez bledu 1 ulp `serde_json`; blad znaleziony na wektorze `1.2345678901234568e20`, naprawiony w generatorze). Testy ksztaltu tabel (`p6_5b_tables.rs`) nie pinuja wartosci balansowych; osobny test porownuje tabele ze stalymi z URUCHOMIONEGO weba (`consts`).

**Niezalezny weryfikator** `verify-p65b-vectors.py` (Python, osobna implementacja czytana ze zrodel TS, bez Rust i bez Node; wlasne `Number#toString`, `localeCompare`, `trim`, `Math.*`): `PRZYPADKOW: 81336`, `ROZBIEZNOSCI: 0` (`verify-p65b-r1.log`, `EXIT=0`); obejmuje tez porownanie tabel Rust ze stalymi odczytanymi REGEXEM z tekstu TS (`tabela_vs_TS.*`) i kopii danych weba w silniku. Weryfikator zostal sprawdzony negatywnie (zmiana `proc_max_na_ture`/`max_pp` w kopii tabel oraz podmiana jednego wyniku w kopii wektora dala `ROZBIEZNOSCI` > 0: `dowody/verify-negative-r1.txt`).

## 6. Mutacje (testy wykrywaja zmiany)

`mutate-p65b.py`: 54 mutacje kodu lub tabel (r1: 53; r2: +B21), kazda uruchamia wskazany test, plik jest przywracany. Wynik: **53 WYKRYTA** z 54, 1 NIEWYKRYTA (M02, rownowazna, patrz nizej). Surowe wyjscie: r1 `dowody/mutation-evidence-r1.txt` (+ `-part0`), **r2 `dowody/mutation-evidence-r2.txt`** (przeliczone w r2: B13, B14, B21, M33, M11 oraz pojedynczo M25, M21, M29, M26, M22, M27, M24; wiersze r2 w tabeli ponizej nadpisuja r1 dla tych mutacji).

**Runda 2 - zmiana wazna dla wiarygodnosci mutacji grupowych (zarzut 6).** Werdykt czlonka grupy jest wazny tylko, gdy mutacja drugiego czlonka nie moze zmienic wyniku jego binarium. Dowod statyczny: `dowody/mutation-independence-r2.txt` (`check-mutation-independence.py`, NARUSZEN 0): `p6_5b_format/_manpower/_replenish` nie importuja `domain::combat`; `p6_5b_bonuses` nie importuje `recruitment`; `recruitment.rs` nie odwoluje sie do `combat`; `combat::unit_building_bonuses` uzywa z `recruitment` WYLACZNIE `js_max` i `js_number_to_string`; dane `unit-building-bonuses.json` czyta tylko `combat.rs`, a `manpower-params.json` / `locale-compare-ascii.json` tylko `recruitment.rs`. Konsekwencje: (a) grupa B* + M* jest wazna (rozlaczne kody i dane) pod warunkiem, ze M* nie lezy w `js_number_to_string`; (b) w r1 istnialy grupy z DWIEMA mutacjami M* na wspolnym kodzie i binariach (`[M25,M21,M29]`, `[M26,M22]`, `[M27,M24]`), a M25/M26 mutuja `js_number_to_string` (uzywane przez combat) - ten uklad NIE byl udowodniony jako niezalezny; `mutate-p65b.py` wymusza teraz asercjami max 1 mutacje B* i 1 M* na grupe oraz M25/M26 wylacznie pojedynczo, a 7 mutacji z tych grup przeliczono pojedynczo w r2 (wszystkie WYKRYTE, patrz tabela).

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
| B21-cecha-zdrowie-na-atk (r2, nowa) | `src/domain/combat.rs` | `p6_5b_bonuses` | WYKRYTA | 101 |

## 7. NIE_ZMIERZONO / RUNDA-2 (jawna lista)

**Lista RUNDA-2 (jedyna dopuszczona przyczyna statusu RUNDA-2 w tabeli §3; generator wymaga odwolania `R2-n` w wierszu):**

- **R2-1: `localeCompare` (ICU) poza zmierzonym zakresem.** Dotyczy wierszy: `String.prototype.localeCompare`, `tickManpowerUnitReplenishment`, `allocateProportionalReplenishment`, `deductManpowerFromEmpire`, `refundManpowerToEmpire`, `tryDeductUnitSpawnCostsEmpire`. Zmierzone i pokryte wektorami: ASCII 0x20-0x7E w en-US (18 641 par). NIE zmierzone / niepokryte: (a) znaki spoza ASCII 0x20-0x7E (Rust zapasowo porownuje UTF-16, rozni sie od weba w 134 z 256 par); (b) lokalizacje inne niz en-US: pomiar r2 pokazal, ze 18 z 71 lokalizacji daje inna kolejnosc ASCII (a dla id-ksztaltow gry: et, th, haw) - `dowody/localecompare-locales-r2.txt`; (c) inne wersje ICU / silniki przegladarek niz Node 22.22.0 + ICU 77.1. Warunek zamkniecia: pelny kollator ICU w Rust (nowa zaleznosc, wymaga zmiany `Cargo.toml` - poza allowlista) ALBO gwarancja po stronie integracji, ze remisy rozstrzyga porownanie ustalone jako regula gry (decyzja produktowa: web zalezy dzis od jezyka przegladarki gracza).
- **R2-2: komparatory z `NaN` w polach miast.** Dotyczy wierszy `tickManpowerUnitReplenishment` (poprzez `deduct`), `deductManpowerFromEmpire`, `refundManpowerToEmpire`, `tryDeductUnitSpawnCostsEmpire`. Mieszanka `NaN` i skonczonych w puli sortowanej komparatorem (`curDiff`, `roomDiff`) daje komparator niespojny; web (TimSort/V8) i `stable_sort_by` w Rust sa zgodne dla komparatorow spojnych (ZA8), niezmierzone dla niespojnych. Nieosiagalne dla skonczonych danych gry; brak wektora.
- **R2-3: `isCivilianUnit`** (`units/setup.ts:196`): port lokalny zbioru + udokumentowany wyjatek (ZA3); pelny port albo wstrzykniecie w temacie `units/setup`.

**Zamkniete w r2 (nie sa juz zawezeniem):** `getMaxHp` (jedyne wywolanie weba zawsze z jednostka, ZA4); generyczne `T extends StatMultipliersLike` (ZA5: cecha `StatMultipliers` + test generyczny).

**NIE_ZMIERZONO (poza statusami symboli):**

- **`q`/`r` niecalkowite** (miasta/jednostki) i `ownerId` nie-calkowity: web dopuszcza liczby, Rust `i32`/`i64`; wektory zawieraja wylacznie calkowite.
- **Integracja ze stanem (poza allowlista; zadania dla tematu podpiecia `state.rs`):** I-1 typy id (`ids.rs`, P2-3 D-ID-1/D-ID-3): port uzywa `String` jak P6.5A; po przejsciu na `CityId`/`UnitId` (`u64`) tie-break `localeCompare` musi byc liczony na postaci napisowej id (`'city'+n`, `'prod_...'`) albo zachowac `legacy_id`, inaczej zmieni sie kolejnosc remisow; I-2 implementacja cechy `StatMultipliers` dla `CivStatMultipliers` (`civ_bonuses.rs`).
- **Wlasny port** `sumRosterFieldM` / `isFieldBattleUnit` (`auto-battle-power.ts`), `veteranLevel` / `veteranStarCount` (`veteran.ts`), pelnego `units/setup.ts` (w tym `isCivilianUnit` jako samodzielny eksport): inne tematy.
- Podpiecie `manpower`/`unit_building_bonuses` pod `bridge.rs`/`state.rs`/`session.rs` (np. wolanie `tick_manpower_unit_replenishment` w turze): zabronione allowlista (`bridge.rs`, `domain/mod.rs`); moduly dostepne jako `domain::recruitment::manpower` i `domain::combat::unit_building_bonuses`.
- Pamiec/czas: brak pomiarow wydajnosci (niewymagane); sortowanie wstawianie O(n^2) dla list jednostek jednego wlasciciela (web: TimSort) - bez wplywu na wynik.

## 8. Tabela bylo/jest i zmiany testow

| Wielkosc | Bylo (`50b49360`) | Jest |
|---|---|---|
| Testy silnika (`cargo test`) | 745 | 778 (+33, wszystkie nowe w `tests/p6_5b_*.rs`; r1: 777) |
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
python3 -I gen-symbols-p65b.py <WEB_ROOT> rust-port/engine > symbols-p65b-r2.tsv
python3 -I check-p65b-civilian-sync.py <WEB_ROOT> rust-port/engine
python3 -I check-mutation-independence.py rust-port/engine
node measure-localecompare-locales.mjs > dowody/localecompare-locales-r2.txt
python3 -I grep-literals-p65b.py rust-port/engine > dowody/grep-literals-r1.txt
python3 -I mutate-p65b.py rust-port/engine <CARGO_TARGET_DIR> all
cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test     # w rust-port/engine
```

## 11. Surowe, pelne wyjscia bramek r2 (kopie plikow `gate-*-r2.log`, bez wyciec)

### 11.1 `cargo fmt --check` (rust-port/engine; `gate-fmt-r2.log`)

```text
EXIT=0
```

### 11.2 `cargo clippy --all-targets -- -D warnings` (rust-port/engine; `gate-clippy-r2.log`)

```text
    Updating crates.io index
     Locking 17 packages to latest compatible versions
   Compiling proc-macro2 v1.0.107
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling serde_json v1.0.154
    Checking once_cell v1.21.4
   Compiling serde v1.0.229
    Checking tracing-core v0.1.36
    Checking itoa v1.0.18
    Checking pin-project-lite v0.2.17
    Checking memchr v2.8.3
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling serde_derive v1.0.229
   Compiling tracing-attributes v0.1.31
    Checking tracing v0.1.44
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_e07c9cb9-1c9-3/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 1m 05s
EXIT=0
```

### 11.3 `cargo test` (rust-port/engine; `gate-test-r2.log`)

```text
   Compiling serde_core v1.0.229
   Compiling once_cell v1.21.4
   Compiling zmij v1.0.23
   Compiling itoa v1.0.18
   Compiling memchr v2.8.3
   Compiling tracing-core v0.1.36
   Compiling pin-project-lite v0.2.17
   Compiling tracing v0.1.44
   Compiling serde_json v1.0.154
   Compiling serde v1.0.229
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_e07c9cb9-1c9-3/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 2m 07s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 13 tests
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test ai_turn_default_city_parameters_match_ai_params_json ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test hex_city_score_enemy_penalty_follows_threat_range_option ... ok
test wounded_units_retreat_before_attacking ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test counts_per_extension_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_validator_rejects_missing_file ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test negative_validator_rejects_wrong_size ... ok
test sha1_matches_known_vectors ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.29s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test effective_work_cost_is_raw_work_web_one_to_one ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_id.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/city_id-693b1037fdbc4b08)

running 6 tests
test barbarian_city_garrison_json_keeps_numeric_city_id ... ok
test barbarian_cleared_cities_round_trip_as_numbers ... ok
test city_id_conversions_round_trip ... ok
test city_id_map_keys_stay_numeric_in_json ... ok
test city_id_ordering_matches_raw_value ... ok
test city_id_serializes_as_bare_number ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/combat-7737db4785daf590)

running 7 tests
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat_ai_multipliers.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/combat_ai_multipliers-52898acb951a9ad0)

running 5 tests
test table_has_each_row_once_with_known_class_and_status ... ok
test accessors_return_the_table_value_not_a_constant ... ok
test city_structure_bonuses_are_positive_and_mur_is_the_largest_single_bonus ... ok
test veteran_levels_are_complete_and_non_decreasing ... ok
test las_row_is_class_a_and_marked_read_by_domain ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/counter_multipliers.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/counter_multipliers-c944a65d0a384717)

running 5 tests
test domain_reads_table_and_unknown_types_give_no_bonus ... ok
test explicit_unit_bonus_overrides_table ... ok
test table_is_readable_for_every_pair_and_misses_are_none ... ok
test table_lists_each_type_pair_once_with_finite_positive_multiplier ... ok
test table_type_keys_are_canonical ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test buildings_json_parses ... ok
test wonders_json_parses ... ok
test tech_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test civs_count_and_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test roundtrip_covers_all_29_data_files ... ok
test rt_ai_params ... ok
test rt_auto_battle_params ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test collection_id_sets_match_web_pin ... ok
test rt_city_names_pools ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_citizen_resource_upkeep ... ok
test rt_civ_params ... ok
test rt_civ_ai ... ok
test rt_combat_params ... ok
test rt_buildings ... ok
test rt_civs ... ok
test rt_diplomacy ... ok
test rt_counters ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_e_start_params ... ok
test rt_econ_params ... ok
test rt_map_gen_params ... ok
test rt_power_params ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_miasto_params ... ok
test rt_society_params ... ok
test rt_tech ... ok
test rt_terrain_combat ... ok
test rt_terrain_movement ... ok
test rt_terrain_improvements ... ok
test rt_ui_params ... ok
test rt_civ_matrix ... ok
test rt_units ... ok
test rt_wonders ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_resources ... ok
test rt_terrain_yields ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_missing_file_is_file_missing ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_unreadable_file_is_io ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.66s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/derived_values.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/derived_values-7eb2b3615468dd51)

running 25 tests
test building_gold_upkeep_has_one_row_per_building_level ... ok
test basket_and_treaty_duration_read_diplomacy_table ... ok
test building_table_has_exactly_the_42_canonical_ids_once_each ... ok
test difficulty_is_one_type_across_domain_modules ... ok
test building_table_key_shape_is_known_resources_and_mirrors_the_base_keys ... ok
test building_table_palac_has_no_stock_cost_and_others_do ... ok
test domain_building_costs_read_the_building_table_values_without_recomputing_them ... ok
test diplomacy_multipliers_cover_each_constant_once_with_web_values ... ok
test domain_recruitment_reads_the_gold_table_without_recomputation ... ok
test improvement_and_wonder_tables_cover_every_entry_once ... ok
test domain_recruitment_reads_the_unit_table_values_without_recomputing_them ... ok
test gold_table_has_exactly_the_75_units_once_each_and_known_eras ... ok
test research_costs_cover_each_tech_tempo_and_axis_once ... ok
test trade_multipliers_cover_each_constant_once_with_values ... ok
test racje_cover_every_half_step_from_zero_to_six_once ... ok
test storage_caps_cover_each_era_and_difficulty_once ... ok
test building_work_states_cover_each_building_level_and_axis_combination_exactly_once ... ok
test unit_food_has_twelve_states_per_unit_and_integer_hundredths ... ok
test unit_table_epoch_field_matches_units_json ... ok
test unit_gold_states_cover_each_unit_and_axis_combination_exactly_once ... ok
test unit_table_keeps_the_units_json_base_as_provenance ... ok
test unit_table_key_shape_and_positive_integer_values ... ok
test unit_table_has_one_row_per_units_json_record_and_no_extra_rows ... ok
test work_table_has_exactly_the_42_buildings_once_each_and_positive_values ... ok
test work_table_is_read_by_the_domain_without_recomputation ... ok

test result: ok. 25 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/diplomacy-d94c0845f92f376e)

running 32 tests
test alliance_uses_configured_hegemon_threshold ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test peace_price_is_independent_of_treaty_duration ... ok
test production_diplomacy_api_is_public ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test annexation_requires_vassal_economy_orientation ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test diplomacy_unit_prices_match_units_json_for_every_row ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/events-987aa8790b10a253)

running 8 tests
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/owner_ref.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/owner_ref-92f476c7f4239a8a)

running 10 tests
test owner_and_camp_fields_are_plain_numbers_in_struct_json ... ok
test owner_ref_accessors_and_player_conversion ... ok
test camp_id_is_a_transparent_newtype ... ok
test owner_ref_hash_agrees_with_equality ... ok
test owner_ref_legacy_conversions_match_the_sentinels ... ok
test owner_ref_refuses_player_ids_that_do_not_fit_the_legacy_number ... ok
test owner_ref_rejects_unknown_negative_numbers ... ok
test owner_ref_ordering_matches_the_legacy_i64_order ... ok
test owner_ref_serializes_every_variant_as_the_legacy_number ... ok
test player_keyed_maps_keep_numeric_string_keys ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s

     Running tests/p6_1_civ_entry_epoch.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1_civ_entry_epoch-c29112b12d237024)

running 8 tests
test civ_entry_epoch_matches_web_vectors ... ok
test civ_availability_matches_web_vectors_for_every_game_epoch ... ok
test civ_entry_label_matches_web_vectors ... ok
test civ_ids_available_match_web_roster_vectors ... ok
test strict_epoch_ids_reject_non_canonical_spellings ... ok
test game_epoch_hud_label_matches_web_vectors ... ok
test game_epoch_index_matches_web_for_every_probe ... ok
test game_epoch_order_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_first_player_city.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1_first_player_city-e31375affc71b1c0)

running 5 tests
test awaiting_first_city_matches_web_for_owner_zero ... ok
test awaiting_first_city_matches_web_for_explicit_owner_one ... ok
test denied_message_matches_web_constant ... ok
test hex_in_start_reveal_matches_web_vectors ... ok
test validate_placement_matches_web_vectors ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s

     Running tests/p6_1_owner_seats.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1_owner_seats-1a3aae5c483a1e2f)

running 6 tests
test hot_seat_cycles_and_skips_unknown_active ... ok
test human_seats_match_web_vectors ... ok
test human_owner_primary_matches_web ... ok
test major_ai_owner_matches_web_vectors ... ok
test stub_constants_are_the_web_sentinels ... ok
test web_owner_minus_five_is_out_of_domain_and_not_representable ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_rng_mulberry.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1_rng_mulberry-617bdab005dd8b1f)

running 2 tests
test mulberry32_matches_web_make_rng_vectors_bit_for_bit ... ok
test mulberry32_is_not_the_lcg_stream ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1b_playerstate.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1b_playerstate-7e0df28b40755091)

running 19 tests
test error_research_step_is_atomic_on_missing_cost ... ok
test parity_cheapest_tie_break_uses_utf16_order ... ok
test hot_seat_two_human_owners_have_independent_player_states ... ok
test error_missing_cost_for_unknown_tempo_and_mode ... ok
test parity_constants_and_defaults_match_web ... ok
test parity_per_row_functions ... ok
test parity_gates_available_and_cheapest ... ok
test parity_research_costs_equal_web_scaled_research_cost ... ok
test parity_vectors_use_the_engine_tech_data ... ok
test serde_missing_research_queue_defaults_to_empty ... ok
test table_constants_are_read_from_data_not_literals ... ok
test table_edit_of_research_cost_changes_the_step ... ok
test table_epoch_map_and_sentinels_come_from_data ... ok
test table_every_engine_tech_has_a_research_cost_for_every_axis ... ok
test table_player_state_params_shape ... ok
test table_research_cost_rows_agree_with_tech_json ... ok
test parity_scenarios_from_web ... ok
test parity_epoch_number ... ok
test parity_parse_prereqs_and_prereqs_met ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.19s

     Running tests/p6_1c_braz_access.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1c_braz_access-043839ba2b428854)

running 7 tests
test city_has_piec_hutniczy_matches_web ... ok
test has_braz_access_matches_web ... ok
test normalize_improvement_key_matches_web ... ok
test normalize_improvement_key_known_keys_equal_data_keys ... ok
test prototype_keys_are_out_of_domain_and_do_not_change_braz_outcome ... ok
test bootstrap_table_values_equal_web_constants ... ok
test empire_has_kopalnia_miedzi_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.20s

     Running tests/p6_1c_llama_seed.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1c_llama_seed-e56bbca479ca6477)

running 3 tests
test hex_keys_within_radius_matches_web_loop_order ... ok
test hash_pos_matches_web_hash_pos_verbatim ... ok
test seed_inca_llama_deposits_matches_web_for_all_cases ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.68s

     Running tests/p6_1c_start_cluster.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1c_start_cluster-584791c0a8e00ea4)

running 8 tests
test land_hexes_filter_matches_web_rule ... ok
test display_label_for_slot_matches_web ... ok
test pick_second_human_start_hex_matches_web ... ok
test constants_and_start_relations_match_web ... ok
test second_human_without_legal_hex_yields_no_second_seat_derived_from_code ... ok
test vectors_cover_the_branches_of_build_cluster_start_plan ... ok
test build_cluster_start_plan_matches_web_for_all_cases ... ok
test second_human_civ_equal_to_player_civ_is_rejected_like_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.69s

     Running tests/p6_1c_tables.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1c_tables-2a37790854995833)

running 4 tests
test llama_table_has_sane_shape ... ok
test braz_table_has_sane_shape_and_consistent_references ... ok
test cluster_table_has_sane_shape ... ok
test start_tables_parse_with_deny_unknown_fields ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.26s

     Running tests/p6_1d_city_names.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1d_city_names-4bfda12150196ed9)

running 13 tests
test city_name_with_suffix_matches_web ... ok
test nazwa_klastra_at_matches_web ... ok
test collect_used_city_names_matches_web ... ok
test pick_next_city_name_from_names_matches_web_for_synthetic_queues ... ok
test pool_length_constants_match_web ... ok
test cluster_rival_from_pool_matches_web ... ok
test embedded_pool_data_is_byte_identical_to_data_used_for_vectors ... ok
test resolve_state_city_name_matches_web ... ok
test rival_pool_index_matches_web ... ok
test validate_city_names_pools_matches_web ... ok
test suggest_and_ai_founding_names_match_web ... ok
test state_city_name_at_matches_web ... ok
test pick_capital_foreign_regular_match_web_for_real_pools ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.21s

     Running tests/p6_1d_civ_bonuses.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1d_civ_bonuses-30f5c7450cfc6997)

running 14 tests
test building_cost_discount_matches_web ... ok
test embedded_data_is_byte_identical_to_data_used_for_vectors ... ok
test empty_bonus_list_gives_zero_multipliers ... ok
test is_combat_modifier_bonus_matches_web ... ok
test apply_multiplier_matches_web ... ok
test matrix_bonusy_match_web_for_every_civ_key_variant ... ok
test real_civs_bonuses_convert_without_loss ... ok
test movement_range_siege_wall_multipliers_match_web ... ok
test terrain_forest_detection_matches_web ... ok
test unit_combat_category_matches_web_for_every_unit ... ok
test unit_matches_cel_matches_web_for_every_unit_and_cel ... ok
test strip_diacritics_matches_web_function_cut_verbatim ... ok
test bonus_applies_per_entry_matches_web_for_multi_entry_lists ... ok
test bonus_applies_and_stat_multipliers_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 10.57s

     Running tests/p6_1d_tables.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1d_tables-7c67743f1f351b01)

running 4 tests
test city_name_constants_have_consistent_shape ... ok
test matrix_specs_have_consistent_shape_and_known_param_ids ... ok
test rules_have_known_stats_and_param_ids ... ok
test diacritics_table_maps_single_chars_outside_ascii ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s

     Running tests/p6_1e_civ_matrix.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1e_civ_matrix-d0b7dd9cf60d4be3)

running 21 tests
test ai_params_and_diplomacy_rows_match_web ... ok
test ai_fallback_branches_are_actually_exercised ... ok
test civ_matrix_param_at_difficulty_matches_web ... ok
test civ_matrix_param_def_matches_web ... ok
test ai_by_typ_resolvers_match_web ... ok
test civ_matrix_param_matches_web ... ok
test consumer_status_polarity_band_baseline_match_web_per_parameter ... ok
test civ_matrix_params_at_difficulty_matches_web_order_and_values ... ok
test apply_civ_matrix_param_matches_web ... ok
test every_matrix_cell_parses_exactly_like_js ... ok
test median_matches_web ... ok
test param_order_and_rows_match_web_for_every_scenario ... ok
test data_files_are_byte_identical_to_web_pin ... ok
test proc_sum_and_apply_proc_match_web ... ok
test ai_profiles_and_norms_match_web ... ok
test scale_parameters_are_clamped_and_shifted_only_for_skala ... ok
test status_visibility_is_true_only_for_real_gameplay ... ok
test synthetic_cell_grid_matches_web ... ok
test profile_by_key_resolution_matches_web ... ok
test snapshot_and_profiles_match_web ... ok
test every_status_for_every_parameter_matches_web_texts ... ok

test result: ok. 21 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.88s

     Running tests/p6_1e_civ_names.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1e_civ_names-80674a5ae9a4508e)

running 11 tests
test assign_invariants_hold_on_real_roster ... ok
test find_klastra_display_validate_match_web ... ok
test make_rng_streams_match_web_for_every_seed ... ok
test constants_match_web ... ok
test pool_views_ai_founded_and_validation_match_web ... ok
test reexports_behave_like_web ... ok
test rotate_preferred_matches_web ... ok
test civ_ids_from_roster_matches_web ... ok
test assign_ai_civ_types_matches_web ... ok
test pick_active_civ_pool_matches_web ... ok
test start_foreign_rival_state_names_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.93s

     Running tests/p6_1e_js_compat.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1e_js_compat-08e1cb152706a259)

running 8 tests
test intensity_label_matches_web ... ok
test is_integer_and_min_max_clamp_follow_js ... ok
test number_to_string_matches_js_for_every_vector ... ok
test math_round_matches_js_bit_for_bit ... ok
test parameter_label_matches_web ... ok
test trim_matches_js_string_trim ... ok
test formatted_value_matches_web ... ok
test to_fixed_matches_js_for_every_digit_count ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s

     Running tests/p6_1e_tables.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_1e_tables-9dc9ef20c17d92b2)

running 7 tests
test parameter_label_dictionary_has_nonempty_entries_and_suffix_rule ... ok
test semantic_table_has_text_for_every_status_and_placeholder ... ok
test params_table_is_consistent_with_matrix_and_civs ... ok
test semantic_neutral_band_rules_cover_every_parameter_definition ... ok
test tables_parse_and_are_cached ... ok
test semantic_table_sets_reference_existing_parameters_and_are_disjoint ... ok
test modules_contain_no_balance_or_data_literals ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_23_fort.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_23_fort-324dd86b69e58eeb)

running 5 tests
test fort_rules_table_references_known_improvements ... ok
test territory_dependencies_match_web ... ok
test evacuation_hex_matches_web ... ok
test fort_node_conversion_and_reservation_match_web ... ok
test takeover_on_city_founded_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.34s

     Running tests/p6_23_hexmove.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_23_hexmove-a546770c25695422)

running 4 tests
test foreign_city_blocks_match_web ... ok
test ai_entry_into_empty_enemy_city_matches_web ... ok
test city_at_hex_and_occupancy_match_web ... ok
test foreign_city_blocks_feed_pathfinding_and_roads_use_p3_23_divisors ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.14s

     Running tests/p6_23_improvements.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_23_improvements-2f6107250ed9d0bf)

running 10 tests
test applying_bonuses_matches_web ... ok
test catalog_key_order_equals_json_file_order_including_meta_rows ... ok
test era_and_cost_scaling_match_web ... ok
test constants_match_web ... ok
test migration_functions_match_web ... ok
test prototype_keys_pass_normalize_like_in_web ... ok
test rules_tables_have_consistent_shape ... ok
test normalize_and_lookup_functions_match_web ... ok
test hex_layer_functions_match_web ... ok
test territory_and_ore_yields_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.44s

     Running tests/p6_23_order.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_23_order-b99acb8ea5803b82)

running 11 tests
test engine_society_params_match_web_subset_used_by_vectors ... ok
test fallback_params_equal_web_constant ... ok
test happiness_breakdown_matches_web ... ok
test evaluate_order_matches_web ... ok
test compute_order_matches_web ... ok
test order_shape_invariants_hold_for_any_table_values ... ok
test load_order_params_matches_web ... ok
test order_effects_matches_web ... ok
test order_tier_matches_web ... ok
test pick_revolt_migration_target_matches_web ... ok
test order_effects_to_yield_mults_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.61s

     Running tests/p6_23_tables.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_23_tables-6de635983c184b19)

running 3 tests
test ulepszenia_reguly_table_references_existing_improvements_only ... ok
test teren_ruch_reguly_table_has_nonempty_lists ... ok
test porzadek_params_table_is_complete_and_finite ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_4_core.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_4_core-1b564fea4bb5288e)

running 10 tests
test hex_distance_matches_web ... ok
test path_cost_matches_web ... ok
test constants_read_from_running_web_match_tables ... ok
test road_modifier_matches_web_including_floor_and_special_costs ... ok
test stack_group_id_matches_web ... ok
test terrain_and_embark_costs_match_web_on_maps ... ok
test compute_reachable_matches_web_order_and_min_move ... ok
test visibility_helpers_match_web ... ok
test compute_path_matches_web_including_ties_and_edge_destinations ... ok
test terrain_cost_combinations_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.76s

     Running tests/p6_4_embark.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_4_embark-1585566f17a207b0)

running 4 tests
test can_unit_embark_matches_web ... ok
test water_hex_queries_match_web ... ok
test apply_embark_state_after_move_matches_web ... ok
test move_cost_fn_for_matches_web_on_every_map_hex ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.57s

     Running tests/p6_4_march.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_4_march-bae7bfc63cf555d2)

running 6 tests
test save_validation_and_round_trip_match_web ... ok
test fog_frontier_and_fog_plan_match_web ... ok
test truncate_path_to_budget_matches_web_including_min_move ... ok
test should_stop_at_obstacle_matches_web ... ok
test execute_march_step_matches_web ... ok
test plan_path_turns_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.87s

     Running tests/p6_4_rally.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_4_rally-4bbcd32c03f67cc3)

running 3 tests
test launch_leaders_one_per_stack_match_web ... ok
test load_from_save_and_number_parsing_match_web ... ok
test set_clear_and_save_sequences_match_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/p6_4_scout.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_4_scout-573fb211c9224499)

running 5 tests
test explore_scores_match_web ... ok
test scout_flags_match_web ... ok
test run_scouts_auto_explore_matches_web ... ok
test pick_scout_explore_target_matches_web_including_rng_use ... ok
test advance_scout_auto_explore_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 17.35s

     Running tests/p6_4_tables.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_4_tables-d82f71a9bfb2cdbc)

running 4 tests
test numeric_rows_have_sane_shape_without_pinning_values ... ok
test text_rows_are_nonempty_and_distinct ... ok
test neighbour_table_is_six_distinct_adjacent_offsets ... ok
test table_parses_and_every_row_names_its_web_source ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_5a_cost.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_5a_cost-a4777603b2625768)

running 4 tests
test table_constants_equal_the_running_web_object ... ok
test replace_context_keeps_every_field_and_the_required_stock ... ok
test unit_cost_pace_matches_web_bitwise ... ok
test js_round_matches_half_up_semantics ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_5a_display.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_5a_display-f61d69c84dc8b548)

running 7 tests
test compute_stack_display_matches_web_order_and_vitals ... ok
test field_power_passes_roster_in_web_order_and_returns_sum ... ok
test stack_vitals_matches_web ... ok
test representative_matches_web_including_utf16_id_order_and_nan_attack ... ok
test badge_and_veteran_maxima_match_web ... ok
test hp_pool_matches_web_including_nonfinite_and_overfull_hp ... ok
test unit_at_representative_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.17s

     Running tests/p6_5a_ruch.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_5a_ruch-0e062d5664866c50)

running 8 tests
test adjacent_empty_and_split_destinations_match_web ... ok
test hud_actions_match_web ... ok
test bounce_hex_assignment_matches_web_including_duplicates_and_blocking ... ok
test sync_and_deduct_match_web ... ok
test bounce_from_origin_and_separate_return_hex_match_web ... ok
test ruch_pools_match_web_bitwise ... ok
test separate_return_matches_web_bitwise ... ok
test unit_with_pooled_ruch_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.17s

     Running tests/p6_5a_stack.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_5a_stack-32bcaffc556db8d5)

running 10 tests
test adjacent_army_hexes_and_active_stack_match_web ... ok
test garrison_and_field_fortify_transitions_match_web ... ok
test all_defenders_and_wake_stack_match_web ... ok
test fresh_and_shared_stack_group_ids_match_web_sequence ... ok
test law_garrison_counts_match_web ... ok
test stack_group_id_agrees_with_p64_port_on_the_same_unit ... ok
test stack_group_id_and_render_key_match_web ... ok
test transition_chains_match_web_including_both_fortifications_at_once ... ok
test same_stack_group_and_stack_key_match_web ... ok
test visible_colocated_and_garrison_queries_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.51s

     Running tests/p6_5a_tables.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_5a_tables-c73c4ca1005ab433)

running 2 tests
test army_params_parse_and_have_sane_shape ... ok
test tempo_table_parses_and_has_distinct_keys_with_positive_multipliers ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_5b_bonuses.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_5b_bonuses-02e0bfe8577aeac4)

running 8 tests
test building_roles_and_real_game_data_match_web ... ok
test chain_depth_limit_matches_web ... ok
test gain_hint_text_matches_web_for_arbitrary_gains ... ok
test stat_multiplier_merge_matches_web ... ok
test unit_progress_badges_and_fractions_match_web ... ok
test stat_multiplier_merge_is_generic_over_any_structural_type ... ok
test city_visit_gain_progress_and_hint_match_web ... ok
test city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.55s

     Running tests/p6_5b_format.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_5b_format-8864aed56360906f)

running 5 tests
test number_to_string_matches_web ... ok
test citizen_label_matches_web ... ok
test locale_compare_table_is_the_measured_primary_order ... ok
test locale_compare_matches_web_for_ascii ... ok
test population_formats_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.47s

     Running tests/p6_5b_manpower.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_5b_manpower-0a099d61a31307ee)

running 13 tests
test city_pool_functions_match_web ... ok
test besieged_location_sort_key_sync_and_civilian_match_web ... ok
test civ_bonus_multipliers_match_web ... ok
test game_default_params_equal_the_running_web_defaults ... ok
test empire_deduct_refund_and_spawn_mutate_like_web ... ok
test opt_helpers_are_consistent ... ok
test empire_totals_match_web ... ok
test era_table_and_citizen_scalars_match_web ... ok
test pool_and_cost_scalars_match_web ... ok
test heal_cost_and_cap_match_web ... ok
test raw_param_loaders_match_web ... ok
test regen_gain_matches_web_including_default_params ... ok
test spawn_and_refund_functions_match_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 6.35s

     Running tests/p6_5b_replenish.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_5b_replenish-11d5c4ac4b77306b)

running 1 test
test replenishment_matches_web_state_results_and_closure_protocol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.87s

     Running tests/p6_5b_tables.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_5b_tables-4f918dda2f6680dd)

running 6 tests
test civilian_set_is_resolved_from_the_table ... ok
test era_table_rows_are_contiguous_and_cover_the_clamp_range ... ok
test tables_are_loaded_from_the_embedded_json_files ... ok
test tables_parse_and_have_the_expected_shape ... ok
test p65a_badge_closures_are_closed_by_the_real_path_badge_port ... ok
test table_constants_equal_the_running_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.20s

     Running tests/p6_m00_skeleton.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m00_skeleton-1864ffd75187226a)

running 5 tests
test doc_row_lists_expected_counts ... ok
test files_exist_and_start_with_owner_doc_header ... ok
test mapgen_mod_declares_exactly_doc_modules ... ok
test domain_mod_declares_top_level_skeleton_modules ... ok
test skeleton_headers_name_full_owner_ids_from_table ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s

     Running tests/p6_m01_climate.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m01_climate-fc8a7dd62f5452ac)

running 7 tests
test forest_threshold_matches_web_bit_for_bit ... ok
test desert_assignment_predicate_matches_web ... ok
test polar_predicate_matches_web ... ok
test world_type_and_climate_band_serde_literals_match_web ... ok
test climate_band_default_arguments_and_ignored_q_match_web ... ok
test climate_band_sweep_matches_web_for_every_height_and_row ... ok
test water_terrain_predicate_matches_web_for_every_terrain ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s

     Running tests/p6_m01_earth_mask.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m01_earth_mask-1779c36a54b4d8e3)

running 10 tests
test derived_mask_file_is_the_single_source_of_mask_data ... ok
test hex_to_norm_edges_match_web ... ok
test bit_at_clamps_out_of_range_coordinates_like_web ... ok
test mask_dimensions_and_bbox_match_web_bit_for_bit ... ok
test named_constants_match_web_exports ... ok
test polar_rows_inner_dimensions_and_buffers_match_web_for_heights_0_to_600 ... ok
test sample_template_land_nan_is_sea ... ok
test all_288000_mask_bits_match_the_web_rows ... ok
test sample_template_land_matches_web_on_thousands_of_points ... ok
test hex_to_template_norm_template_land_subsample_and_threshold_match_web_for_all_dims ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.32s

     Running tests/p6_m01_params_shape.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m01_params_shape-188a388bb5a09197)

running 9 tests
test climate_is_polar_outside_the_map ... ok
test ocean_buffers_never_shrink_with_height_and_respect_their_lower_bound ... ok
test params_files_parse_and_have_the_expected_shape ... ok
test subsample_and_threshold_tiers_never_decrease_resolution_for_bigger_maps ... ok
test climate_bands_are_ordered_north_to_south_and_cover_the_playable_rows ... ok
test template_sampling_is_zero_outside_the_unit_square ... ok
test mask_file_is_well_formed ... ok
test params_floats_are_parsed_exactly_from_the_raw_json_text ... ok
test template_land_respects_border_and_polar_buffers_and_yields_binary_values ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.14s

     Running tests/p6_m01_prims.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m01_prims-963d8aed92ec098f)

running 14 tests
test all_three_mulberry32_implementations_match_web_for_every_seed_and_step ... ok
test hex_directions_match_web_in_every_implementation ... ok
test cos_lerp_matches_web_bit_for_bit ... ok
test hex_key_matches_web_format ... ok
test fbm_matches_web_bit_for_bit_for_all_octave_counts ... ok
test js_cos_outside_the_medium_range_stays_within_one_ulp_and_keeps_special_values ... ok
test hex_distance_matches_web_on_the_full_grid_in_every_implementation ... ok
test hex_distance_matches_web_for_large_coordinates ... ok
test js_to_int32_follows_ecmascript_to_int32 ... ok
test perm_table_matches_web_for_all_256_entries ... ok
test js_cos_matches_v8_math_cos_bit_for_bit_in_the_supported_range ... ok
test value_noise_matches_web_bit_for_bit_including_huge_and_negative_coordinates ... ok
test mulberry32_state_is_the_seed_until_first_draw ... ok
test vectors_come_from_the_pinned_web_run ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.13s

     Running tests/p6_m02_deposit_river.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m02_deposit_river-aa1b079e2438a847)

running 7 tests
test metal_deposit_min_era_table_matches_web ... ok
test parse_helpers_cover_all_tokens ... ok
test deposit_visibility_matches_web ... ok
test ensure_meta_and_hidden_count_match_web ... ok
test river_switch_keys_match_names_the_web_queried ... ok
test river_switch_matches_web ... ok
test river_switch_without_environment_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/p6_m02_float_parse.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m02_float_parse-bdfe4c125f45e686)

running 1 test
test table_floats_are_read_without_rounding_error ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m02_generator.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m02_generator-aad7149729b35309)

running 4 tests
test normalization_matches_web ... ok
test menu_labels_match_web ... ok
test size_from_menu_label_and_label_to_dims_match_web ... ok
test size_dims_and_order_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m02_new_game.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m02_new_game-fb7bd264e697cc8f)

running 11 tests
test constants_match_web ... ok
test clamp_miasta_panstwa_count_matches_web ... ok
test density_to_label_round_trips_where_web_does ... ok
test civ_menus_with_rosters_match_web ... ok
test land_fraction_functions_match_web ... ok
test map_size_label_from_dims_matches_web ... ok
test resolve_world_gen_numbers_matches_web ... ok
test river_map_params_match_web_bitwise ... ok
test tier_functions_match_web ... ok
test world_generation_presets_match_web ... ok
test per_label_functions_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.59s

     Running tests/p6_m02_quality.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m02_quality-07b289bbbb867c75)

running 4 tests
test web_quirk_ignores_z_with_dot ... ok
test per_label_functions_match_web ... ok
test tier_to_label_and_preset_match_web ... ok
test constants_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m02_tables.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m02_tables-abfdd889c351ab6b)

running 7 tests
test every_section_names_its_web_source ... ok
test land_and_toggle_tables_are_consistent ... ok
test map_label_thresholds_are_ascending_and_known ... ok
test per_size_menus_cover_every_size ... ok
test river_rules_have_sane_ranges ... ok
test size_tables_are_consistent ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m09_rivals.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m09_rivals-3d2871a7b9753cde)

running 19 tests
test group_foreign_type_clusters_matches_web ... ok
test constants_match_web_and_aliases_are_not_separate_numbers ... ok
test foreign_buffer_gate_matches_web ... ok
test cluster_pack_radius_matches_web ... ok
test half_plane_axis_matches_web_bitwise ... ok
test is_in_half_plane_matches_web ... ok
test land_pool_near_core_matches_web ... ok
test hexes_at_distance_matches_web ... ok
test map_helpers_match_web ... ok
test nearest_legal_land_matches_web ... ok
test hub_chain_matches_web ... ok
test hub_chain_result_does_not_depend_on_seed_as_in_web ... ok
test rival_slots_degenerate_inputs_do_not_panic ... ok
test pack_rival_cities_matches_web ... ok
test shuffle_in_place_matches_web ... ok
test vectors_identify_the_same_maps_as_p6_1c ... ok
test pack_around_capital_matches_web ... ok
test rival_slots_match_web_on_real_maps ... ok
test rival_candidate_hexes_match_web_on_real_maps ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 9.13s

     Running tests/p6_m09_tables.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m09_tables-0380ed37b51ae447)

running 3 tests
test every_value_has_web_source_and_sane_shape ... ok
test start_city_state_distance_is_not_the_cities_ts_constant ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m14_range.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m14_range-11a976a1d8c0add9)

running 3 tests
test territory_keys_by_owner_match_web ... ok
test culture_range_matches_web ... ok
test religion_range_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.14s

     Running tests/p6_m14_territory.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m14_territory-ba89cbcff9a8795a)

running 8 tests
test axial_distance_matches_web_and_integer_variant ... ok
test city_range_for_population_matches_web ... ok
test city_territory_radius_matches_web ... ok
test city_sight_radius_matches_web ... ok
test owner_tie_goes_to_first_node ... ok
test territory_owner_at_matches_web ... ok
test is_in_territory_matches_web ... ok
test is_player_territory_hex_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.30s

     Running tests/p6_m14_wonder.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m14_wonder-96491650d658ea23)

running 4 tests
test shape_candidates_are_sorted_land_and_exclude_center ... ok
test list_for_city_matches_web ... ok
test pick_matches_web ... ok
test list_for_owner_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.99s

     Running tests/p6_m14_work.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/p6_m14_work-1ce45b3a771ecceb)

running 8 tests
test city_center_keys_match_web ... ok
test build_territory_nodes_matches_web ... ok
test reconcile_without_reczne_is_noop ... ok
test is_territory_hex_owned_by_matches_web ... ok
test reconcile_all_matches_web ... ok
test workable_filter_matches_web ... ok
test reczne_key_legal_matches_web ... ok
test reconcile_for_owner_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.65s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test canonical_state_dto_vector_round_trips_through_json ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.33s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.17s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test multiple_layers_stack_additively_per_resource ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/road_movement_multipliers.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/road_movement_multipliers-10cca6a7ed28e576)

running 3 tests
test road_divisors_are_integers_read_from_the_table ... ok
test road_floor_row_is_readable_and_positive ... ok
test road_movement_table_covers_each_constant_once ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test canonical_state_round_trips_through_serde ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/structure_defense_max.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/structure_defense_max-97cd066d284c179b)

running 3 tests
test combined_structures_equal_the_strongest_single_structure ... ok
test structures_are_ignored_outside_siege ... ok
test no_structure_gives_neutral_multiplier ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test trade_routes_do_not_cross_tundra ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test diff_and_serialization_preserve_route_contract ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test settlement_credits_income_before_paying_expenses ... ok
test flow_helpers_are_deterministic_and_saturating ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_e07c9cb9-1c9-3/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 6 tests
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test p6_1_civ_entry_api_is_exercised ... ok
test current_and_previous_epochs_are_available ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```
