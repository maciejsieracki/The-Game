# P6.8I - auto-ulepszenia (port `gra/src/game/auto-improvements.ts` + `relief-preserving-improvements.ts`)

Temat: R-RUSTPORT-P6-8I-AUTO-ULEPSZENIA-Q1. Stan na runde 4 (Operator).
**Pin wektorow: `4bbef081d`** (zmiana pinu z `91dc998a` - decyzja administracyjna orkiestratora 2026-11-01, DELTA-3).
Baza kodu: `a56a4370d` + merge `origin/rust-port/parity-v2` (`d977ad560`, parity-v2 >= `5f618f748`).

STATUS tematu: **PASS-WITH-NOTES do oceny FC** (kod P1+P2+P3 sportowany, bramki zielone; niedomkniecia jawnie nizej:
4 mutanty NIE_ZABITE, dryf zaleznosci `territory.rs`).

## Relief (P3, C5 zamkniete - NIE RUSZANE)

`git diff 91dc998a 4bbef081d -- gra/src/game/relief-preserving-improvements.ts` = puste (plik identyczny na obu pinach),
wiec `auto_improvements/relief_preserving.rs` i wektory `relief.json` (pin `91dc998a`) pozostaja wazne.
Mutanty reliefu: 15/15 KILLED (M1-M8 + X1-X7 FC: prefiks `kopalnia` bez podkreslnika, usuniecie bydlo/owce/lama/kamieniolom,
`starts_with` kluczy jawnych i legacy) - `mutacje/relief-wynik-r4.txt`, skrypt `mutacje/mutate-relief.sh`.

N4 (tartak, ZALOZENIE administracyjne): `git show origin/main:gra/src/game/relief-preserving-improvements.ts | grep -n tartak` ->
linie 9 i 24: web na `origin/main` MA `tartak` w `PRESERVES_HILL_RELIEF_EXPLICIT_KEYS`. Zgodne z pinem i z Rust
(`relief_preserving.rs:10`). Brak rozbieznosci.

## Tabela symboli (`auto-improvements.ts`, pin 4bbef081d)

Legenda: PORTED+TESTED = port + wektory z weba + mutacje (patrz sekcja Mutacje); NOWE = nowy symbol od pinu 91dc998a.

| Symbol TS | Status | Rust | Dowod |
|---|---|---|---|
| `AutoImprovementCity`, `AutoImprovementPick` | PORTED+TESTED | `auto_improvements/opts.rs` | `p6_8i_pick.rs` (wszystkie scenariusze) |
| `AI_IMPROVEMENT_PRIORITY` (21 kluczy, tartak przed oboz) | PORTED+TESTED | `auto_improvements.rs` | `helper_constants_match_web` |
| `ULEPSZENIA_FOCUS_ZYWNOSC` | PORTED+TESTED | jw. | jw. |
| `ULEPSZENIA_ZYWNOSCIOWE` (= `ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE`) | PORTED+TESTED, NOWE | jw. | jw. |
| `FOREST_BUILDING_KEYS` | PORTED, NOWE | jw. | mutant C37 KILLED |
| `ULEPSZENIA_FOCUS_SUROWCE`, `_INFRASTRUKTURA`, `_ZROWNOWAZONE` (alias listy priorytetow) | PORTED+TESTED | jw. + `priorities_for_ulepszenia_focus` | `helper_priorities_deficits_and_city_limit_match_web`, A03/A04 KILLED |
| `ZERO_YIELD_IMPROVEMENTS` | PORTED+TESTED | jw. | stale + C58/C59/C61 KILLED |
| `JEDEN_NA_ILU_OBYWATELI`, `WYRAB_MIN_FOREST_IN_RADIUS`, `AUTO_ULEPSZENIA_PRACA_RESERVE` | PORTED+TESTED | jw. | `helper_constants_match_web`; H03/H59/H73 KILLED |
| `hasNonFoodResourceDeficit` | PORTED+TESTED | `has_non_food_resource_deficit` | wektory helperow; A01 KILLED |
| `AutoImprovementSurplusReport`, `freshSurplusReport` | PORTED+TESTED | `opts.rs`, `fresh_surplus_report` | raporty w scenariuszach; S30-S34 KILLED |
| `prioritiesForUlepszeniaFocus` | PORTED+TESTED | `priorities_for_ulepszenia_focus` | wektory (7 focusow x skipWyrab); A02-A04 KILLED |
| `PickAutoImprovementsOpts` (+ domkniecia) | PORTED | `opts.rs` (`Option<&dyn Fn>`, `RefCell` na raport) | scenariusze z `fn` |
| `FOOD_LIVESTOCK_STAGE_KEYS`, `FOOD_STAGE_MAX_ITEMS_PER_CITY`, `FoodStageDef`, `FOOD_STAGES` (E1-E6) | PORTED+TESTED, NOWE | `auto_improvements.rs` | scenariusze etapowe; P09-P18 |
| `RIVER_DEVELOPMENT_KEYS` | PORTED+TESTED, NOWE | jw. | C88 KILLED |
| `IMPROVEMENT_FOR_DEFICIT`, `deficitImprovementKeys`, `actionableDeficitKeys` | PORTED+TESTED, NOWE | `deficit_improvement_keys`, `actionable_deficit_keys` | `helper_constants_match_web`, wektory; A05-A07 KILLED |
| `ROAD_KEYS` (+ `ROAD_KEY_SET`) | PORTED+TESTED, NOWE | `ROAD_KEYS` | stala + C41/P45 KILLED |
| `isCityLimitExhausted` | PORTED+TESTED, NOWE | `is_city_limit_exhausted` | 480 przypadkow (base x era x lista miast, NaN/Infinity); A08-A12 KILLED |
| `FORT_CLAIM_MIN_NEW_HEXES`, `FORT_CLAIM_KEYS`, `FortClaimArgs` | PORTED+TESTED, NOWE | `fort_claim.rs` (`FortBudget`) | F29 KILLED |
| `pickFortClaims` (E-FORT) | PORTED+TESTED (z dryfem, niżej), NOWE | `fort_claim::pick_fort_claims` | 80 pickow fort + 83 posterunek; F01-F45 (patrz Mutacje) |
| `isFoodStageCity` | PORTED+TESTED, NOWE | `pick.rs` | P67/P68 KILLED |
| `pickAutoImprovementsSinglePass` (wewn.) | PORTED+TESTED, NOWE (podzial) | `single_pass.rs` + `city_phases.rs` + `hex_phases.rs` | 2212 scenariuszy; C*, H*, S* |
| `pickAutoImprovements` (P2) | PORTED+TESTED | `pick.rs::pick_auto_improvements` | jw.; P* |
| `preservesHillReliefKey`, `preservesHillRelief`, `PRESERVES_HILL_RELIEF_EXPLICIT_KEYS` (P3) | PORTED+TESTED (zamkniete) | `relief_preserving.rs` | 8 testow, 15/15 mutantow |

Liczba symboli: 8I-P1 (stale/helpery/typy) i 8I-P3 (relief) zamkniete; 8I-P2 = `pickAutoImprovements` + `pickAutoImprovementsSinglePass`
(wewn.) + `pickFortClaims`, podzielone na pliki <= 600 LOC (zadna funkcja/plik nie przekracza limitu; najwiekszy plik
`city_phases.rs` 442 LOC). Zaden symbol nie jest NIE_PORTOWANY.

## Zaleznosci i ZALOZENIA

Reuzyte z Rust (bez duplikatow): `improvement_build::{BuildMap, BuildHex, ImprovementBuildState, Qualifier, get_improvement_meta,
is_improvement_tech_unlocked, hex_keys_within_radius, hex_has_deposit_reserve, deposit_allows_player_improvement,
is_farm_base_terrain}`, `improvements::is_improvement_allowed_for_civ`, `terrain::{CityNode, axial_distance,
city_range_for_population}`, `territory::TerritoryNode`, `start_position::Overlay`.

1. **Dryf `territory.rs` (zaleznosc poza allowlista).** `terrain::city_territory_radius` czyta jeszcze stare `zasieg_terytorium`
   fort 10 / posterunek 5 z `data/terrain-improvements.json`, a `territory_owner_at` ma stara semantyke (najblizszy wezel);
   pin 4bbef081d: fort 5 / posterunek 3, miasto przed fortem, `order` w wezle (REPIN-DELTA-3). Picker uzywa stalych pinu lokalnie
   (`FORT_TERRITORY_RADIUS_PIN`, `OUTPOST_TERRITORY_RADIUS_PIN`, `territory_radius_pin`) - dla miast tozsame z
   `city_territory_radius`. `territoryOwnerAt(...) === null` liczone jako "zaden wezel nie obejmuje heksu" (rownowazne dla
   null-owosci). **Skutek:** kwalifikator Rust (`Qualifier`, nie moj) przy wezlach fortu/posterunku w `territoryNodes` rozni sie od
   weba -> 40 scenariuszy `fortNodes` (poza ostrym zakresem; 5 recznych `fort-wlasny-*`/`fort-obcy-*` x2 sa ostre i zgodne).
   Test staje sie ostry dla WSZYSTKICH automatycznie, gdy `city_territory_radius(fort)==5 && (posterunek)==3` (flaga `repinned`).
   **Ryzyko integracji R-DELTA3-TERRITORY.**
2. `farmPriorityOnlyWorked`: pole ustawiane w `pickAutoImprovements`, brak konsumenta w pojedynczym przebiegu (grep na pinie) -
   portowane jako martwe pole (`opts.rs`).
3. `map` w opcjach to `Option<&BuildMap>` (web: wymagane); brak = pusty wynik (nieosiagalne dla wolajacych).
4. `Qualifier::new` jest budowany przy kazdym `qualifies` (zywy stan `workingPlaced`, jak referencja do `Map` w webie) i mapa jest
   klonowana na przebieg; wydajnosc = NASTEPNA-PARTIA (po integracji z wolajacymi), bez wplywu na zachowanie.
5. Semantyka JS: `Math.max/min` propaguja NaN (`js_max/js_min`); sortowanie `id` miast po jednostkach UTF-16 (`cmp_js_str`, nie
   bajty UTF-8); `city.population || 0` -> `pop_or_zero` (NaN -> 0). Klucz niedoboru o nazwie wlasciwosci `Object.prototype`
   (web: `TypeError`) NIE jest portowany (jak w M16).
6. `focus` spoza czterech wartosci -> `UlepszeniaFocus::Other` (lista zrownowazona, ale `focus === 'zrownowazone'` falsz), jak `default:` weba.
7. Mapy wektorow dopisywane po scenariuszach losowych (ciag PRNG stabilny); `pick.json` 3,58 MB (limit 6 MB).

## Wektory

Generator W REPO: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8I-AUTO-ULEPSZENIA-Q1/gen-p6-8i-pick-vectors.mjs` (sciezki wzgledne; loader
`repin-b-loader-*.mjs`, jedyny wyjatek od "zero stubow": `render/improvements.ts` -> wycinek typ+tablica `IMPROVEMENTS`, bez `three`).
Uruchomienie: `git archive 4bbef081d gra/src gra/data` do `mktemp -d`, potem
`node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs ./gen-p6-8i-pick-vectors.mjs <WEB_ROOT> <OUT>`
(zakaz buildu w `gra/`). Pliki: `tests/p6_8i_vectors/pick.json` (2212 scenariuszy, 1273 niepuste, 46 map; losowe `rnd-*`, etapowe
`stg-*`, fort `fort-*`, gorskie `fortg-*`, reczne celowane `r4b-*` i brzegowe: NaN/Infinity/ujemne pule, procenty, rezerwa,
populacja NaN/ujemna/Infinity, sort id UTF-16, brak miast/territoryNodes) i `helpers.json` (stale, priorytety, niedobory,
`isCityLimitExhausted` 480 przypadkow, `wyrabTechUnlockedEmpty`).
Testy: `tests/p6_8i_pick.rs` (5 testow) + `tests/p6_8i_relief.rs` (8, bez zmian).

## Mutacje (N2)

Skrypt W REPO: `mutacje/mutate-8i-pick.py` (366 mutantow; podmiana n-tego wystapienia tekstu, `cargo test --test p6_8i_pick`,
przywrocenie pliku), scalenie wynikow `mutacje/merge-wyniki.py` -> `mutacje/pick-wynik-final.txt`
(przebieg 1: `pick-wynik.txt`; rerun po wektorach celowanych: `pick-wynik-r2.txt`, `pick-wynik-r3.txt`).
**Wynik: 366 mutantow = 306 KILLED + 56 EKWIWALENT + 4 NIE_ZABITY, 0 nieskategoryzowanych.**
Pokrycie: kazda galez sterujaca `hex_allows_key`, `river_krok0_ok`, `hill_tartak_pending`, `key_blocked_on_hex`, `build_city_env`
(filtry priorytetow, budzet, sortowanie), `finish_env`, `river_to_develop`, FAZA 0, KROK 0, FAZA 1, FAZA 2, sonda, `single_pass`
(budzet, imperium cap, horse stock, report), `fort_claim` (okregi, zysk, remisy, budzet), `pick` (etapy E1-E6, zapasowa, fort, drogi,
`after`/sondy `unlimited`), helpery P1.

### Mutanty ekwiwalentne (56) - dowody

Pelna lista z dowodami: `mutacje/merge-wyniki.py` (tablica `EKWIWALENTY`; kazdy wpis = skrot dowodu plik:linia/regula) i
`mutacje/pick-wynik-final.txt`. Grupy: (a) `wyrab` nie ma bramki technologicznej (C16, H25, H69 - test `wyrab_has_no_tech_gate_like_web`);
(b) `qualifies()` odrzuca klucz obecny na heksie (`improvement_build.rs:1152`) - guardy warstwy redundantne (C21, C89, F21);
(c) podwojne straznik budzetu (rownosc przy koszcie > 0): H06-H08, H12, H21, H22, H34, H49, H50, H65, H74, S09, S11-S14, F13;
(d) kolejnosc/idempotencja: C97, F09, F16, F34, F38, F41; (e) martwe/redundantne: C15, C49, C60, C69, C73, H02, H42, H43, H53,
H55, H88, H89, S20, F06, F07, F12, P03, P09, P31, P32, P34, P46, P48, P61, P62, P66, A16.

### Konstrukcje NIE zabite / niezmutowane (tabela, N2)

| Konstrukcja | Powod |
|---|---|
| F40 (`own_nodes.push` nowego fortu w `pick_fort_claims`) | wplyw tylko na tie-break `dist`; brak scenariusza z remisem zysku (NASTEPNA-PARTIA) |
| P24 (`road_cities` przy `demandDriven=false`) | wymaga mapy bez celow zapasowych przy `cityLimitExhausted`; osiagalne tylko blokada technologii (NIE_ZMIERZONO) |
| P36 (warunek `!deficit_is_pending_now` przed fortem) | wymaga kosztu fortu < kosztu ulepszenia niedoboru; w danych pinu fort/posterunek >= 60 > kamieniolom 22/tartak 25 - nieosiagalne |
| P38 (`record(&fort_picks)` dla przebiegu innych miast) | wymaga geometrii fort -> heks obronny innego miasta (NIE_ZMIERZONO) |
| `if !placed_one { break; }` w FAZIE 2 (`hex_phases.rs`) | usuniecie = petla nieskonczona (nie mutowane; warunek konieczny terminacji) |
| Wezly fortu/posterunku w `territoryNodes` (F01/F02 zabite na scenariuszach ostrych; reszta pokrycia wezlow w dryfie) | zob. ZALOZENIE 1 |

## Bramki (N3)

Logi W REPO: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8I-AUTO-ULEPSZENIA-Q1/logs/gate-r4-*.txt` (jedna linia `EXIT=` na koncu, sciezka
worktree zamaskowana `<WORKTREE>`, target `/dev/shm/p6-8i-r4`), skrypt `gate-r4.sh`:
`fmt` EXIT=0; `clippy --all-targets -D warnings` EXIT=0; `test8i` (5+8 testow) EXIT=0; `testfull` 1987 passed / 0 failed EXIT=0
(baza parity-v2 1940 + testy 8I); `git diff --check` czysty.
Usunieto przestarzale `logs/gate-p6-8i-*.txt` (pusta linia przed EXIT=, sciezka obcego worktree) - zastapione `gate-r4-*`.

## Ryzyka integracji / NASTEPNA-PARTIA

- R-DELTA3-TERRITORY: patrz ZALOZENIE 1; po repinie `territory.rs` test `repinned` przelacza 40 scenariuszy w tryb ostry.
- Wydajnosc kwalifikatora i klonowania mapy (ZALOZENIE 4) przed podlaczeniem do petli tury.
- Wolajacy (AI/gracz: `isCityLimitExhausted`, `getFocus`, budzet) nie istnieja jeszcze w Rust - `pick_auto_improvements` i helpery P1 nie
  maja produkcyjnego wywolujacego (NASTEPNA-PARTIA: integracja `ai_turn`/komendy gracza); dowod: `git grep pick_auto_improvements -- rust-port/engine/src`
  zwraca wylacznie definicje i re-eksport.
