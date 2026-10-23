# P6.6A - miasta: zakladanie, czesc A (`city-founding.ts`, `city-hex-clear.ts`, `conquest-stability.ts`, `visibility.ts`)

Temat: `R-RUSTPORT-P6-6A-MIASTA-ZAKLADANIE-A-Q1` (DOMAIN: GAME), runda 1/5, rola Operator.
Pin web: `edb8fb56`. Baza Rust: `origin/rust-port/parity-v2` @ `95b91471` (silnik 865 testow wg dispatchu; `a29c1657` jest jego przodkiem - sprawdzone `git merge-base --is-ancestor`).
Artefakty runu (generator, weryfikator, mutacje, tabela symboli, logi bramek): `dyspozycje/autobot/runs/R-RUSTPORT-P6-6A-MIASTA-ZAKLADANIE-A-Q1/`.
Czesc B (`cities.ts` 1293 LOC, `empire-city-defaults.ts` 525, `display-names.ts` 288) NIE jest ruszana (osobny, pozniejszy temat; ten sam `state.rs`).

## 1. Werdykt rundy 1 (stan faktyczny)

| Pytanie | Odpowiedz |
|---|---|
| Co jest portowane? | Wszystkie eksporty i symbole prywatne czterech plikow (tabela §3): 49 wierszy = 40 PORTOWANY, 7 PORTOWANY-Z-WSTRZYKNIETYMI, 1 NIE-DOTYCZY, 1 DANE-JUZ-W-RUST, 0 RUNDA-2. Slownik statusow zamkniety i wymuszony generatorem `gen-symbols-p66a.py`. |
| Dowod "PORTOWANY" | Kod Rust + test + wektory z URUCHOMIONEGO weba (pin; PRAWDZIWY kod TS ladowany loaderem, zero stubow logiki) + niezalezny weryfikator Python (0 rozbieznosci) + mutacje wykrywane (§6). |
| Domkniecia wstrzykniete | Tylko zaleznosci spoza tych czterech plikow, ktorych w Rust jeszcze nie ma: `hexToWorkedTile` (turn-economy.ts), `sameCultureCircle` (diplomacy-display.ts, P6.14), `convertCulture` / `convertViaTemple` / `cityBorderRadius` (culture-religion.ts, P6.16), `Math.random` (rand). Testy SPRAWDZAJA argumenty tych wywolan wzgledem zapisanych wywolan prawdziwego kodu weba. |
| Co zostaje na kolejna runde / inny temat? | Lista RUNDA-2 w §7 (R2-1..R2-3) oraz zadania integracyjne (podpiecie pod `session.rs`/`bridge.rs`, zabronione allowlista). |
| Bramki | fmt `EXIT=0`, clippy `--all-targets -D warnings` `EXIT=0`, test `EXIT=0`: 902 przeszlo, 0 nie (865 + 37 nowych w `tests/p6_6a_*.rs`) (surowe, pelne logi w §11 i `gate-*-r1.log`). Weryfikator: `verify-p66a-r1.log` (sprawdzen 14808, rozbieznosci 0). |
| Zmiany poza allowlista | Brak (§9). |

## 2. Zrodla przeczytane w calosci (liczby linii)

Czytane w calosci (`cat` calego pliku, bez ograniczen zakresu) po wyodrebnieniu `git archive edb8fb56 gra/src gra/data` do wlasnego katalogu poza repo (`mktemp -d`).

| Plik | Linie (`wc -l`) | Linie niepuste (`grep -c -v '^\s*$'`) | Eksporty (`grep -c '^export '`) |
|---|---|---|---|
| `gra/src/game/city-founding.ts` | 163 | 145 | 11 + 2 symbole prywatne (`ParamRow`, `readParam`) |
| `gra/src/game/city-hex-clear.ts` | 74 | 68 | 4 + 2 prywatne (`HexExt`, `isKeptDeposit`) |
| `gra/src/game/conquest-stability.ts` | 191 | 177 | 11 |
| `gra/src/game/visibility.ts` | 328 | 294 | 21 wierszy `export` (19 symboli: `computeVisible` ma 3 deklaracje - 2 przeciazenia + implementacja; `export { citySightRadius }` to re-eksport) |

Liczby niepuste (145 / 68 / 177 / 294) zgadzaja sie z dispatchem. Liczba wierszy tabeli symboli jest wymuszana skryptem `gen-symbols-p66a.py` (blad, gdy eksport TS nie ma wiersza albo wiersz wskazuje symbol/test spoza zrodla, Rust lub testow).

Przeczytane dodatkowo (zaleznosci - cale funkcje uzyte przez te pliki, odczyt `sed -n` wskazanych zakresow): `culture-religion.ts` (`CultureParams` 166-180, `loadCultureParams` 228-245, `CultureCity` 276-290, `cityBorderRadius` 305-322, `CultureBuildings`/`convertCulture` 400-470, `ReligionParams`/`loadReligionParams` 465-530, `ReligionState` 612-625, `ReligionBuildings`/`convertViaTemple` 1080-1180, `load*PressureParams` 1388-1410), `diplomacy-display.ts` (`civKeyNorm` 92, `civTypCywilizacjiKey` 200-210, `sameCultureCircle` 213-219), `society-inputs.ts` (`clearCityCultureMix` 40-43), `turn-economy.ts` (`hexToWorkedTile` 636-646), `okolica.ts` (1-77: `cityRangeForPopulation`, `citySightRadius`), `units/setup.ts` (`keyOf` 346, `hexDistance` 354, `isWaterTerrain` 678), `data/map-gen-params-loader.ts` (`FALLBACK_SIGHT` 20, `mapGenDefaultSight` 90-94), `types/hex.ts` (enumy `TerenBazowy`, `Nakladka`, `Ulepszenie`, typ `Hex`), `data/miasto-params.json`, `data/map-gen-params.json`, `data/civs.json`, `data/society-params.json`, `data/units.json`.

## 2a. Dokumenty obowiazkowe z dispatchu: dowod odczytu i skutki dla portu

Odczyt: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<sciezka>` do pliku poza repo, nastepnie `sed -n` / `Read` wskazanymi zakresami. Zakresy NIEPRZECZYTANE sa wymienione jawnie.

| Dokument | Linie | Czesci przeczytane (zakresy) | Wniosek wazny dla P6.6A | Skutek |
|---|---|---|---|---|
| `p6/P6-0-GAP-ANALYSIS.md` | 435 | 1-17 (§0 metoda), wiersze tabeli luk §3 dla `city-founding` (133), `city-hex-clear` (134), `conquest-stability` (149), `visibility` (274), `cities`/`display-names`/`empire-city-defaults` (130, 187, 192), `diplomacy-display` (167); §5 (299-325); §6b: wiersz R-RUSTPORT-P6-6-MIASTA-ZAKLADANIE (337, 2790 LOC, `state.rs`, `terrain.rs`) odczytany grepem. NIE przeczytane: pozostale ok. 170 wierszy §3, §2, §4, §6a, §7-§9 | P6.6 = 7 plikow; czesc A to 4 pliki (684 LOC); `conquest-stability` zalezy od `sameCultureCircle` (diplomacy-display, P6.14) i `culture-religion` (P6.16) - brak ich w Rust; `diplomacy-display.sameCultureCircle` jest jawnie wskazane w uwadze Final Control r2 wiersza 68 jako zaleznosc `conquest-stability.ts:18` | Zaleznosci wstrzykniete jako domkniecia (§4 ZA2), nie dublowane |
| `p3/P3-22-FLATTEN-STAGE2.md` | 441 | 1-149 (calosc §0-§9), 150-153 i naglowki sekcji 10-12 (grep `^##`), 400-441 (§12.5-§12.10); NIE przeczytane: 154-399 (szczegoly rund 3-5: tabele dyplomacji/walki) | Stale balansowe/mnozniki -> edytowalne tabele `data/derived/*.json` + parser w `data/derived.rs`; testy bez pinow wartosci; generator URUCHAMIA kod weba; weryfikator niezalezny; bramki z `echo "EXIT=$?"`; `Cargo.lock` nie commitowany | Wzorzec zastosowany: 4 nowe tabele (§4 ZA7), wektory z uruchomionego weba, weryfikator Python |
| `p2/P2-3-ENTITY-IDS.md` | 380 | grep po `found`/`zaloz` (wiersze 246-252: `foundedTurn?`, `foundedByOwner?` - BRAK w Rust) oraz naglowek; NIE przeczytane: reszta | Pola miasta `foundedTurn`/`foundedByOwner` sa czescia `cities.ts` (czesc B), nie moich plikow | Brak skutku dla czesci A; id jako `String` (jak P6.5A/B) |
| `p2/P2-5-COMMANDS.md` | 668 | grep po `found`/`zaloz`/`visibility`/`mgla` (wiersze 47, 99-104 B6/B7/B11, 224 O2, 280-282); NIE przeczytane: reszta | `found_city` (B6, alias B11): `foundCityAt` + `canFoundCity` w `cities.ts` (czesc B); koszt zakladania liczy `evaluateFoundCityAffordance` (moj plik); mgla (O2) to widok bez zmiany `GameState` | Funkcje kosztu sa gotowe pod komende `found_city`; podpiecie = zadanie integracyjne (poza allowlista) |
| `PLAN-PORT-RUST-TAURI-20261020.md` | 305 | 190-225 (§P6, P6.6-P6.8 "Miasta: zalozenie, wzrost populacji, ekonomia, budynki, okolica (worked tiles)"); NIE przeczytane: reszta | Kazdy modul: test stanu przed/po, przypadki negatywne, readback; web = referencja read-only | Zgodne z zakresem |
| `LEDGER.md` | 199 | grep po `found`/`P6.6`/`visibility`/`conquest`/`city-hex` (brak wiersza dla P6.6); NIE przeczytane: reszta | Brak wczesniejszej pracy nad P6.6 | - |

Skrypty wzorcowe: `dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/{gen-loader-hooks.mjs (28 linii), gen-loader-register.mjs (3)}` przeczytane w calosci, `gen-diplomacy-web.mjs` (linie 1-40 z 67) i `verify-diplomacy-web.py` (linie 1-30 z 176) czesciowo; wzorzec rozbudowany o nowsze realizacje tego samego schematu w repo: `R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1/{m14-loader-hooks.mjs (29), m14-loader-register.mjs (3), gen-m14-vectors.mjs (linie 1-80 z 404), verify-m14-vectors.py (1-60 z 441), mutate-m14.py (72, calosc)}` oraz `R-RUSTPORT-P6-5B-JEDNOSTKI-ZYCIE-B-Q1/{gen-symbols-p65b.py (1-50), grep-literals-p65b.py (calosc)}` i dokument `P6-5B-JEDNOSTKI-ZYCIE-B.md` (struktura §0-§11). Nie przeczytane: `gen-combat-web.mjs`, `verify-combat-web.py`, `verify-trade-web.py`, `gen-trade-web.py`, reszta plikow `gen-m14-vectors.mjs` / `verify-m14-vectors.py` / `gen-symbols-p65b.py`.

## 3. Tabela symboli (kazdy eksport i symbol prywatny ma status)

Wygenerowana skryptem `gen-symbols-p66a.py` (`symbols-p66a-r1.tsv`; blad generatora, gdy eksport TS nie ma wiersza, status jest spoza slownika {PORTOWANY, PORTOWANY-Z-WSTRZYKNIETYMI, DANE-JUZ-W-RUST, NIE-DOTYCZY, RUNDA-2}, symbol Rust/test nie istnieje albo brak uwagi przy statusach innych niz PORTOWANY). Numer linii TS = pierwsze wystapienie symbolu w pliku.

| Plik TS | Linia TS | Symbol | Status | Odpowiednik Rust (plik:linia) | Test | Uwaga |
|---|---|---|---|---|---|---|
| `city-founding.ts` | 11 | `FoundCitySourceCity` | PORTOWANY | rust-port/engine/src/domain/state.rs:211 (pub struct FoundCitySourceCity) | `p6_6a_founding::pick_source_city_matches_web_including_rand_protocol` | interfejs -> struct; population f64, ownerId i64 |
| `city-founding.ts` | 23 | `foundCityWorkCost` | PORTOWANY | rust-port/engine/src/domain/state.rs:278 (pub fn found_city_work_cost) | `p6_6a_founding::cost_constants_match_running_web` | wartosc z DANE-JUZ-W-RUST (data/miasto-params.json zaloz_miasto_koszt_praca), zapasowa w city-founding-params.json |
| `city-founding.ts` | 31 | `foundCityPopulationCost` | PORTOWANY | rust-port/engine/src/domain/state.rs:283 (pub fn found_city_population_cost) | `p6_6a_founding::cost_constants_match_running_web` | j.w. zaloz_miasto_koszt_ludnosci |
| `city-founding.ts` | 38 | `FoundCityAffordance` | PORTOWANY | rust-port/engine/src/domain/state.rs:219 (pub struct FoundCityAffordance) | `p6_6a_founding::evaluate_found_city_affordance_matches_web` | reason/sourceCityId -> Option |
| `city-founding.ts` | 48 | `isSubsequentFoundCity` | PORTOWANY | rust-port/engine/src/domain/state.rs:293 (pub fn is_subsequent_found_city) | `p6_6a_founding::is_subsequent_found_city_matches_web` | sygnatura: lista ownerId zamiast {ownerId}[] (web czyta tylko ownerId) |
| `city-founding.ts` | 53 | `AI_FOUNDING_SOURCE_MIN_POP` | PORTOWANY | rust-port/engine/src/domain/state.rs:288 (pub fn ai_founding_source_min_pop) | `p6_6a_founding::cost_constants_match_running_web` | dane: data/derived/city-founding-params.json ai_source_min_pop |
| `city-founding.ts` | 60 | `pickSourceCityForFounding` | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/state.rs:300 (pub fn pick_source_city_for_founding) | `p6_6a_founding::pick_source_city_matches_web_including_rand_protocol` | WSTRZYKNIETE: rand (Math.random) jako &mut dyn FnMut; protokol wywolan (0 lub 1) sprawdzany; undefined -> None |
| `city-founding.ts` | 78 | `EvaluateFoundCityAffordanceOpts` | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/state.rs:348 (pub fn evaluate_found_city_affordance) | `p6_6a_founding::evaluate_found_city_affordance_matches_web` | obiekt opts {rand?} zastapiony parametrem rand (domyslne Math.random nie istnieje w deterministycznym silniku) |
| `city-founding.ts` | 84 | `evaluateFoundCityAffordance` | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/state.rs:348 (pub fn evaluate_found_city_affordance) | `p6_6a_founding::evaluate_found_city_affordance_matches_web` | WSTRZYKNIETE: rand; teksty komunikatow w city-founding-params.json |
| `city-founding.ts` | 130 | `canAffordFoundCity` | PORTOWANY | rust-port/engine/src/domain/state.rs:434 (pub fn can_afford_found_city) | `p6_6a_founding::can_afford_found_city_matches_web` | @deprecated w webie, nadal eksportowana; opts.firstCityFree -> bool |
| `city-founding.ts` | 158 | `foundCityCostLabel` | PORTOWANY | rust-port/engine/src/domain/state.rs:500 (pub fn found_city_cost_label) | `p6_6a_founding::cost_labels_match_web` | szablony w city-founding-params.json |
| `city-founding.ts` | 9 | `ParamRow` | NIE-DOTYCZY | - | `-` | prywatny typ wiersza JSON; zastapiony Option<f64> w read_param |
| `city-founding.ts` | 17 | `readParam` | PORTOWANY | rust-port/engine/src/domain/state.rs:236 (pub fn read_param) | `p6_6a_founding::read_param_accepts_only_finite_numbers` | typeof number && isFinite -> Some(v) skonczone |
| `city-hex-clear.ts` | 24 | `CITY_KEEP_IMPROVEMENT_KEYS` | PORTOWANY | rust-port/engine/src/domain/terrain.rs:494 (pub fn city_keep_improvement_keys) | `p6_6a_hexclear::keep_set_and_predicate_match_web` | dane: data/derived/city-hex-clear-rules.json zostaje_ulepszenia (kolejnosc wstawiania zachowana) |
| `city-hex-clear.ts` | 31 | `cityKeepsImprovement` | PORTOWANY | rust-port/engine/src/domain/terrain.rs:486 (pub fn city_keeps_improvement) | `p6_6a_hexclear::keep_set_and_predicate_match_web` | - |
| `city-hex-clear.ts` | 45 | `clearHexForCityCenter` | PORTOWANY | rust-port/engine/src/domain/terrain.rs:508 (pub fn clear_hex_for_city_center) | `p6_6a_hexclear::clear_hex_for_city_center_matches_web` | mountainClearsAll=true domyslnie: Option<bool>::None |
| `city-hex-clear.ts` | 64 | `applyCityFoundingToHex` | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/terrain.rs:537 (pub fn apply_city_founding_to_hex) | `p6_6a_hexclear::apply_city_founding_to_hex_matches_web` | WSTRZYKNIETE: hexToWorkedTile (turn-economy.ts) jako domkniecie; test sprawdza snapshot PRZED czyszczeniem; city.centerWorkedTile -> &mut Option<T> |
| `city-hex-clear.ts` | 21 | `HexExt` | PORTOWANY | rust-port/engine/src/domain/terrain.rs:470 (pub struct CityCenterHex) | `p6_6a_hexclear::clear_hex_for_city_center_matches_web` | podzbior pol Hex czytanych/zmienianych przez modul + pola dla wstrzyknietego hexToWorkedTile |
| `city-hex-clear.ts` | 36 | `isKeptDeposit` | PORTOWANY | rust-port/engine/src/domain/terrain.rs:499 (fn is_kept_deposit) | `p6_6a_hexclear::clear_hex_for_city_center_matches_web` | dane: zostaja_zloza_nakladki |
| `conquest-stability.ts` | 22 | `isForeignCultureDominant` | PORTOWANY | rust-port/engine/src/domain/state.rs:524 (pub fn is_foreign_culture_dominant) | `p6_6a_conquest::thresholds_match_web` | prog w conquest-stability-params.json |
| `conquest-stability.ts` | 27 | `isConquestUnstable` | PORTOWANY | rust-port/engine/src/domain/state.rs:529 (pub fn is_conquest_unstable) | `p6_6a_conquest::thresholds_match_web` | - |
| `conquest-stability.ts` | 34 | `CityCaptureCultureOpts` | PORTOWANY | rust-port/engine/src/domain/state.rs:550 (pub struct CityCaptureCultureOpts) | `p6_6a_conquest::on_city_captured_culture_matches_web_with_injected_circle` | civKeyForOwner -> Option<&dyn Fn(i64)->String> |
| `conquest-stability.ts` | 40 | `onCityCapturedCulture` | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/state.rs:563 (pub fn on_city_captured_culture) | `p6_6a_conquest::on_city_captured_culture_matches_web_with_injected_circle` | WSTRZYKNIETE: sameCultureCircle (diplomacy-display.ts, P6.14); clearCityCultureMix (society-inputs.ts) - port lokalny 3 linii |
| `conquest-stability.ts` | 63 | `cultureBuildingsFromIds` | PORTOWANY | rust-port/engine/src/domain/state.rs:619 (pub fn culture_buildings_from_ids) | `p6_6a_conquest::building_flags_match_web` | mapowanie id->flaga: conquest-stability-params.json budynki_kulturalne |
| `conquest-stability.ts` | 77 | `religionBuildingsFromIds` | PORTOWANY | rust-port/engine/src/domain/state.rs:640 (pub fn religion_buildings_from_ids) | `p6_6a_conquest::building_flags_match_web` | mapowanie: budynki_religijne |
| `conquest-stability.ts` | 84 | `CultureReligionTickResult` | PORTOWANY | rust-port/engine/src/domain/state.rs:664 (pub struct CultureReligionTickResult) | `p6_6a_conquest::tick_city_culture_religion_matches_web_with_injected_conversions` | generyczny po typie stanu religii |
| `conquest-stability.ts` | 95 | `tickCityCultureReligion` | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/state.rs:676 (pub fn tick_city_culture_religion) | `p6_6a_conquest::tick_city_culture_religion_matches_web_with_injected_conversions` | WSTRZYKNIETE: convertCulture i convertViaTemple (culture-religion.ts, P6.16) jako domkniecia; testy sprawdzaja argumenty wywolan |
| `conquest-stability.ts` | 156 | `conquestUnstableHappinessPenalty` | PORTOWANY | rust-port/engine/src/domain/state.rs:725 (pub fn conquest_unstable_happiness_penalty) | `p6_6a_conquest::revolt_multiplier_and_deprecated_penalties_match_web` | @deprecated, ZAWSZE 0 (decyzja G5); society/difficulty nie wplywaja na wynik i pominiete |
| `conquest-stability.ts` | 172 | `conquestNoGarrisonLawPenalty` | PORTOWANY | rust-port/engine/src/domain/state.rs:734 (pub fn conquest_no_garrison_law_penalty) | `p6_6a_conquest::revolt_multiplier_and_deprecated_penalties_match_web` | @deprecated, ZAWSZE 0 (D5) |
| `conquest-stability.ts` | 183 | `conquestRevoltRiskMultiplier` | PORTOWANY | rust-port/engine/src/domain/state.rs:743 (pub fn conquest_revolt_risk_multiplier) | `p6_6a_conquest::revolt_multiplier_and_deprecated_penalties_match_web` | mnoznik 1.5 w conquest-stability-params.json |
| `visibility.ts` | 25 | `DEFAULT_SIGHT` | PORTOWANY | rust-port/engine/src/domain/state.rs:774 (pub fn default_sight) | `p6_6a_visibility::constants_match_running_web` | wartosc: DANE-JUZ-W-RUST (map-gen-params.json mgla.default_sight_jednostki); FALLBACK_SIGHT w visibility-params.json |
| `visibility.ts` | 31 | `FOG_EXPLORED_BRIGHTNESS` | PORTOWANY | rust-port/engine/src/domain/state.rs:797 (pub fn fog_explored_brightness) | `p6_6a_visibility::constants_match_running_web` | dane: visibility-params.json |
| `visibility.ts` | 34 | `UnitSightResolver` | PORTOWANY | rust-port/engine/src/domain/state.rs:802 (pub type UnitSightResolver) | `p6_6a_visibility::unit_sight_resolver_and_compute_visible_match_web` | - |
| `visibility.ts` | 40 | `buildUnitSightResolver` | PORTOWANY | rust-port/engine/src/domain/state.rs:824 (pub fn build_unit_sight_resolver) | `p6_6a_visibility::unit_sight_resolver_and_compute_visible_match_web` | UnitDef -> UnitSightDef (liczby tylko gdy typeof number); pozniejsza definicja nadpisuje |
| `visibility.ts` | 64 | `computeVisibleAt` | PORTOWANY | rust-port/engine/src/domain/state.rs:885 (pub fn compute_visible_at) | `p6_6a_visibility::compute_visible_at_matches_web` | petla f64 jak w JS; sight niecalkowite -> brak kluczy; +Infinity: web sie nie konczy, Rust zwraca puste (ZALOZENIE) |
| `visibility.ts` | 105 | `computeVisibleAlongPath` | PORTOWANY | rust-port/engine/src/domain/state.rs:892 (pub fn compute_visible_along_path) | `p6_6a_visibility::compute_visible_along_path_matches_web` | - |
| `visibility.ts` | 140 | `computeVisible` | PORTOWANY | rust-port/engine/src/domain/state.rs:885 (pub fn compute_visible) | `p6_6a_visibility::compute_visible_fixed_sight_matches_web` | przeciazenia number/resolver -> enum UnitSight |
| `visibility.ts` | 190 | `addExplored` | PORTOWANY | rust-port/engine/src/domain/state.rs:928 (pub fn add_explored) | `p6_6a_visibility::add_explored_and_render_sets_match_web` | - |
| `visibility.ts` | 210 | `allHexKeys` | PORTOWANY | rust-port/engine/src/domain/state.rs:936 (pub fn all_hex_keys) | `p6_6a_visibility::key_listings_and_terrain_predicates_match_web` | kolejnosc: rosnaco po (q,r) (BTreeMap); web: kolejnosc wstawiania - patrz R2-2 |
| `visibility.ts` | 215 | `isRevealLandTeren` | PORTOWANY | rust-port/engine/src/domain/state.rs:941 (pub fn is_reveal_land_teren) | `p6_6a_visibility::key_listings_and_terrain_predicates_match_web` | - |
| `visibility.ts` | 219 | `allRevealLandKeys` | PORTOWANY | rust-port/engine/src/domain/state.rs:946 (pub fn all_reveal_land_keys) | `p6_6a_visibility::key_listings_and_terrain_predicates_match_web` | kolejnosc j.w. (R2-2) |
| `visibility.ts` | 228 | `isDryLandTeren` | PORTOWANY | rust-port/engine/src/domain/state.rs:955 (pub fn is_dry_land_teren) | `p6_6a_visibility::key_listings_and_terrain_predicates_match_web` | uzywa pathfinding::ruch_jednostek::is_water_terrain (P6.4) |
| `visibility.ts` | 232 | `allDryLandKeys` | PORTOWANY | rust-port/engine/src/domain/state.rs:960 (pub fn all_dry_land_keys) | `p6_6a_visibility::key_listings_and_terrain_predicates_match_web` | kolejnosc j.w. (R2-2) |
| `visibility.ts` | 241 | `exploredSetForRender` | PORTOWANY | rust-port/engine/src/domain/state.rs:969 (pub fn explored_set_for_render) | `p6_6a_visibility::add_explored_and_render_sets_match_web` | web zwraca ten sam obiekt gdy !reveal; Rust zwraca kopie (rownosc wartosci) |
| `visibility.ts` | 256 | `PlayerVisibilityCity` | PORTOWANY | rust-port/engine/src/domain/state.rs:986 (pub struct PlayerVisibilityCity) | `p6_6a_visibility::compute_player_visibility_matches_web` | kultura? -> Option<f64> |
| `visibility.ts` | 263 | `ComputePlayerVisibilityOptions` | PORTOWANY | rust-port/engine/src/domain/state.rs:995 (pub struct ComputePlayerVisibilityOptions) | `p6_6a_visibility::compute_player_visibility_matches_web` | startHex/startRevealRadius -> Option |
| `visibility.ts` | 277 | `computePlayerVisibility` | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/state.rs:1007 (pub fn compute_player_visibility) | `p6_6a_visibility::compute_player_visibility_matches_web` | WSTRZYKNIETE: cityBorderRadius (culture-religion.ts, P6.16) jako domkniecie przekazane do territory::city_sight_radius |
| `visibility.ts` | 307 | `citySightRadius` | DANE-JUZ-W-RUST | rust-port/engine/src/domain/territory.rs:186 (pub fn city_sight_radius) | `p6_6a_visibility::city_sight_radius_reexport_matches_web` | re-eksport okolica.citySightRadius = territory::city_sight_radius (M14); w visibility.rs re-eksport `pub use` |
| `visibility.ts` | 319 | `unitsVisibleOnMap` | PORTOWANY | rust-port/engine/src/domain/state.rs:1039 (pub fn units_visible_on_map) | `p6_6a_visibility::units_visible_on_map_matches_web` | playerOwnerId=0 domyslnie: Option<i64> |

Zaleznosci importowane przez te pliki, ktorych NIE ma w tej tabeli (nie sa eksportami czterech plikow): `convertCulture`, `convertViaTemple`, `cityBorderRadius` (`culture-religion.ts`, P6.16), `sameCultureCircle` (`diplomacy-display.ts`, P6.14), `clearCityCultureMix` (`society-inputs.ts`, port lokalny - ZA3), `hexToWorkedTile` (`turn-economy.ts`), `hexDistance`/`keyOf`/`isWaterTerrain` (`units/setup.ts` - P6.4 `pathfinding::ruch_jednostek`), `citySightRadius`/`cityRangeForPopulation` (`okolica.ts` - M14 `territory`), `mapGenDefaultSight` (`map-gen-params-loader.ts` - `terrain_map::parse_map_gen_params`).

## 4. Decyzje i zalozenia (zamiast pytan)

- **ZA1 (lokalizacja modulow).** `domain/mod.rs` jest poza allowlista, a `mod state;` jest tam PRYWATNY. Moduly `city_founding`, `conquest_stability`, `visibility` leza w `domain/state.rs` (zgodnie z dispatchem i P6-0), `city_hex_clear` w `domain/terrain.rs`. Dostep z zewnatrz (testy integracyjne, kolejne tematy): `domain/terrain.rs` re-eksportuje trzy moduly ze `state.rs` (`pub use super::state::{city_founding, conquest_stability, visibility};` - dozwolone, bo `terrain` jest potomkiem `domain`, a re-eksportowane moduly sa `pub`). Sciezki: `civ_engine::domain::terrain::{city_founding, city_hex_clear, conquest_stability, visibility}`. Gdy temat z prawem do `mod.rs` doda `pub mod state;` albo `pub use state::...`, re-eksport w `terrain.rs` mozna usunac bez zmiany logiki.
- **ZA2 (domkniecia wstrzykniete = zaleznosci spoza zakresu, brak ich w Rust; NIE duplikowane).** (a) `sameCultureCircle` (`diplomacy-display.ts:213`, P6.14); (b) `convertCulture` i `convertViaTemple` (`culture-religion.ts:437`, `:1137`, P6.16); (c) `cityBorderRadius` (`culture-religion.ts:313`, P6.16; jak w `territory::city_sight_radius`, M14); (d) `hexToWorkedTile` (`turn-economy.ts:636`); (e) `Math.random` jako `rand`. Zapisane wektory zawieraja WYNIKI prawdziwego kodu weba dla tych funkcji (`circle`, `cultureCall`, `religionCall`, `border`, `centerAfter`), a domkniecia w testach SPRAWDZAJA argumenty (flagi budynkow, udzial kultury, stan religii, cel konwersji, snapshot heksu przed czyszczeniem) i liczbe wywolan - zly argument lub zbedne wywolanie = test czerwony. Po portach P6.14/P6.16 domkniecia zastapia prawdziwe funkcje (zadanie integracyjne).
- **ZA3 (`clearCityCultureMix`).** `society-inputs.ts:40` (3 linie, import `conquest-stability.ts:19`) jest portowany lokalnie jako `conquest_stability::clear_city_culture_mix`; docelowy wlasciciel to temat `society-inputs`. Przy jego porcie zastapic re-eksportem (RUNDA-2 R2-3).
- **ZA4 (typy).** Id miast i liczby: `population` / `kultura` `f64`, `ownerId` `i64`, wspolrzedne `i32` (jak P6.4 `RuchJednostka`/`RuchMapa`). Zbiory kluczy `Set<"q,r">` -> `BTreeSet<(i32,i32)>` (porownanie w wektorach: posortowane po `(q, r)`; kolejnosc iteracji `Set` weba nieobserwowalna dla konsumentow, ktorzy wolaja `has`/`size`/union). `Hex` -> `RuchHex` (P6.4) dla widocznosci i `CityCenterHex` dla macierzy B; `Nakladka` -> `start_position::Overlay`, `TerenBazowy` -> `pathfinding::ruch_jednostek::TerenBazowy` (widocznosc) i `terrain::TerrainType` (macierz B; ta sama etykieta `Gory`).
- **ZA5 (`computeVisible*` i liczby niecalkowite).** Petla `for (dq=-sight; dq<=sight; dq++)` jest portowana w `f64` (krok 1.0, odleglosc heksowa `f64`, klucz tylko dla calkowitych wspolrzednych - `int_key` z P6.4). Wektory obejmuja `sight` = 0.5, 2.5, 1.9999999999999998, -1, NaN: web zwraca zbiory zgodne z Rust (0 rozbieznosci). `sight = +Infinity`: web NIE KONCZY SIE (petla nieskonczona); Rust zwraca zbior pusty (ZALOZENIE, nieosiagalne: `sight` pochodzi z `Widok pola`/`Ruch`/`citySightRadius`, wszystkie skonczone). Wspolrzedne jednostek/miast niecalkowite: NIE_ZMIERZONO (web dopuszcza liczby, Rust `i32`; wektory zawieraja tylko calkowite).
- **ZA6 (`Number#toString`).** Komunikaty `'Za mało Pracy (potrzeba ' + kosztPraca + ')'` skladaja liczbe przez `js_number_to_string` (`recruitment::manpower`, P6.5B) - nie duplikowane.
- **ZA7 (dane balansowe; zero literalow w nowym kodzie).** (i) Wartosci glowne kosztu zakladania: `data/miasto-params.json` `zaloz_miasto_koszt_praca` / `zaloz_miasto_koszt_ludnosci` (DANE-JUZ-W-RUST: `data::economy_society::parse_miasto_params`), `readParam` -> `FoundCityParams::from_data`; (ii) `data/derived/city-founding-params.json`: wartosci zapasowe `readParam` (20 / 1), prog AI (3), teksty komunikatow i etykiet; (iii) `data/derived/city-hex-clear-rules.json`: macierz B (klucze ulepszen i nakladki-zloza, ktore ZOSTAJA; napis `Ulepszenie.Brak`); (iv) `data/derived/conquest-stability-params.json`: prog obcej kultury (0.5), mnoznik ryzyka buntu (1.5), mapowanie id budynkow na flagi konwersji kultury/religii; (v) `data/derived/visibility-params.json`: `FALLBACK_SIGHT` (3), `FOG_EXPLORED_BRIGHTNESS` (0.175), promien odkrycia startu (5), typId miasta (`city`); wartosc glowna `DEFAULT_SIGHT` = `data/map-gen-params.json` `mgla.default_sight_jednostki` (DANE-JUZ-W-RUST: `terrain_map::parse_map_gen_params`). Parsery: dopisek na koncu `data/derived.rs`. README `data/derived/README.md` nie jest na allowliscie (`*.json`) - nie edytowany; opis tabel jest w polu `meta` kazdego pliku i tutaj.
- **ZA8 (`allHexKeys`, kolejnosc).** Web: kolejnosc wstawiania do `map.hexes`; Rust: `RuchMapa.hexes` to `BTreeMap` (rosnaco po `(q, r)`). Wektory wstawiaja heksy w tej samej kolejnosci (rosnaco po `(q, r)`), wiec kolejnosc zgadza sie bitowo; dla map zbudowanych w innej kolejnosci wynik Rust jest posortowany (RUNDA-2 R2-2).
- **ZA9 (deprecated).** `conquestUnstableHappinessPenalty` / `conquestNoGarrisonLawPenalty`: web zwraca stale 0 (decyzje G5 / D5); Rust zwraca `0.0`, argumenty `society` / `difficulty` (nieuzywane przez web) pominiete w sygnaturze. Test: 130 kombinacji, wszystkie 0.
- **ZA10 (`UnitDef`).** Web czyta `def.Jednostka`, `def['Widok pola']`, `def.Ruch` z obiektow o dowolnym ksztalcie; Rust: `UnitSightDef` z `Option<f64>` (`Some` tylko dla wartosci typu `number`; napis/null/brak -> `None`, jak `typeof`), konwersja z `UnitRecord` (`from_unit_record`). Wektory zawieraja definicje z napisem, `null`, brakiem pola i duplikatami nazwy (pozniejsza nadpisuje).

## 5. Testy i wektory

Nowe pliki: `tests/p6_6a_founding.rs` (10 testow), `p6_6a_hexclear.rs` (3), `p6_6a_conquest.rs` (6), `p6_6a_visibility.rs` (10), `p6_6a_tables.rs` (6) = **35 testow**, wspolne `tests/p6_6a_vectors/common.rs`, wektory `tests/p6_6a_vectors/{founding,hexclear,conquest,visibility}.json` (generator `gen-p66a-vectors.mjs`, deterministyczny Mulberry32 z ziarnem `0x66a0c0de`).

| Plik wektorow | Rozmiar | Przypadki | Grupy (liczba przypadkow) |
|---|---|---|---|
| `founding.json` | 233 KB | 1195 | subsequent=80, pick=420, evaluate=420, canAfford=272, labels=3 |
| `hexclear.json` | 243 KB | 672 | keeps=28, clear=384, apply=260 |
| `conquest.json` | 372 KB | 1399 | foreign=13, unstable=26, captured=420, buildings=260, tick=420, revolt=130, deprecated=130 |
| `visibility.json` | 516 KB | 1321 | at=260, path=100, fixed=120, resolver=260, explored=80, keys=24, render=80, terrainPredicates=8, player=220, onMap=160, border=9 |

Porownanie `f64` jest **bitowe** (`to_bits`; `NaN == NaN`; `-0` != `0`). Liczby niecalkowite w wektorach sa zapisane jako napis `"~<String(x)>"` (parsowany `str::parse::<f64>`, dokladnie): domyslny `serde_json` (bez `float_roundtrip`, `Cargo.toml` poza allowlista) myli sie o 1 ulp - zmierzone na wektorze `tick[14].cultureRateApplied` (`0.015000000000000012` czytane jako `...013`), naprawione w generatorze i `common.rs::num`. Testy ksztaltu (`p6_6a_tables.rs`, `costs_follow_injected_params`, `first_city_is_free_for_any_params`, `read_param_accepts_only_finite_numbers`) nie pinuja wartosci balansowych: sprawdzaja strukture tabel, kompletnosc kluczy, spojnosc z `miasto-params.json` / `map-gen-params.json` i to, ze wstrzykniete parametry steruja wynikiem.

**Niezalezny weryfikator** `verify-p66a-vectors.py` (Python, osobna implementacja czytana z TEKSTU zrodel TS, bez Node i bez Rust): `sprawdzen 14808, rozbieznosci 0 (`verify-p66a-r1.log`, `EXIT=0`)`; porownuje tez tabele `data/derived/*.json` ze stalymi odczytanymi REGEXEM z tekstu TS (`tabela ... vs TS`) oraz liczy niezaleznie `sameCultureCircle` z `civs.json` i `DEFAULT_SIGHT`/`FALLBACK_SIGHT` z danych/zrodla. Test negatywny: `dowody/verify-negative-r1.txt` (zepsute 5 wartosci wektorow -> 5 rozbieznosci, `EXIT=1`).

## 6. Mutacje (testy wykrywaja zmiany)

`mutate-p66a.py`: 61 mutacji kodu Rust (state.rs, terrain.rs) lub tabel JSON (`data/derived`), kazda uruchamia wlasciwe binaria testow (`tests_for`: dla `pick`/`evaluate` - `p6_6a_founding`, dla `hex:` - `p6_6a_hexclear`, dla `conquest`/`captured`/`tick`/`ids` - `p6_6a_conquest`, dla `vis:` - `p6_6a_visibility`, dla tabel JSON dodatkowo `p6_6a_tables`), plik jest przywracany (`try/finally`). Przebieg w 4 czesciach (obciazony host: load average ok. 16 na 4 rdzeniach):

| Czesc | Plik surowego wyjscia | Zakres | Wynik |
|---|---|---|---|
| part0 | `mutation-evidence-r1-part0.txt` | mutacje 1-10 (pick/evaluate/can_afford) | 10 WYKRYTY |
| part1 | `mutation-evidence-r1.txt` (`MUT_SKIP=10`) | mutacje 11-61 | **48 WYKRYTY, 3 PRZEZYL**: `hex: zloza odwrocone`, `hex: las zostaje`, `vis: DEFAULT_SIGHT >= 0` (wszystkie rownowazne dla produkcyjnych danych: kazda nakladka inna niz las jest zostajacym zlozem; `DEFAULT_SIGHT` z danych = wartosc dodatnia) |
| r1b | `mutation-evidence-r1b.txt` | 4 mutacje po wzmocnieniu | **4 WYKRYTY**: dodano testy ksztaltu `clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed` (wstrzykiwane reguly: `clear_hex_for_city_center_with`) i `default_sight_uses_the_data_value_only_when_positive` (`default_sight_from`) - 3 przezywajace sa teraz wykrywane |
| r1c | `mutation-evidence-r1c.txt` | 4 mutacje po refaktorze clippy (`manual_contains`, `if_same_then_else`: dwie galezie `Las`/zloze polaczone w jeden warunek `clears`; `is_subsequent` przez `contains`) | **4 WYKRYTY** |

Stan koncowy: 61 mutacji, 0 niewykrytych (po r1b/r1c). Kolejne uwagi: (1) pierwsze podejscie (jeden bieg, 62 mutacje) zostalo przerwane przez limit czasu zadania w tle; pliki zrodlowe przywrocone z kopii i zweryfikowane `cmp`; (2) mutacje part0/part1 wykonano na tekscie sprzed `cargo fmt`; po `cargo fmt` wszystkie 61 fragmentow nadal wystepuje dokladnie raz (`MUT_CHECK=1`, `przezylo/niekompilujace=0`), wiec skrypt jest odtwarzalny; (3) mutacje tabel: prog AI 3->2, droga nie zostaje, teatr nie daje amfiteatru, prog obcej kultury 0.5->0.4, mnoznik buntu 1.5->1.4.

Wyniki surowe (kopie plikow, bez wyciec):

```text
# mutation-evidence-r1-part0.txt
WYKRYTY   : pick: remis -> ostatni -> 2 testow czerwonych: evaluate_found_city_affordance_matches_web, pick_source_city_matches_web_including_rand_protocol
WYKRYTY   : pick: AI bez progu min -> 3 testow czerwonych: costs_follow_injected_params, evaluate_found_city_affordance_matches_web, pick_source_city_matches_web_including_rand_protocol
WYKRYTY   : pick: gracz tez ma prog AI -> 3 testow czerwonych: pick_source_city_matches_web_including_rand_protocol, evaluate_found_city_affordance_matches_web, costs_follow_injected_params
WYKRYTY   : pick: rand zawsze wolane -> 2 testow czerwonych: evaluate_found_city_affordance_matches_web, pick_source_city_matches_web_including_rand_protocol
WYKRYTY   : pick: bez obslugi NaN/ujemnego indeksu -> 2 testow czerwonych: evaluate_found_city_affordance_matches_web, pick_source_city_matches_web_including_rand_protocol
WYKRYTY   : pick: brak js_min (indeks poza zakresem) -> 2 testow czerwonych: evaluate_found_city_affordance_matches_web, pick_source_city_matches_web_including_rand_protocol
WYKRYTY   : evaluate: komunikat min ludnosci bez progu AI -> 1 testow czerwonych: evaluate_found_city_affordance_matches_web
WYKRYTY   : evaluate: skarbiec <= -> 2 testow czerwonych: first_city_is_free_for_any_params, evaluate_found_city_affordance_matches_web
WYKRYTY   : evaluate: pierwsze miasto platne -> 3 testow czerwonych: first_city_is_free_for_any_params, costs_follow_injected_params, evaluate_found_city_affordance_matches_web
WYKRYTY   : can_afford: ludnosc <= -> 1 testow czerwonych: can_afford_found_city_matches_web

# mutation-evidence-r1.txt
WYKRYTY   : can_afford: skarbiec <= -> 1 testow czerwonych: can_afford_found_city_matches_web
WYKRYTY   : read_param: nieskonczone przechodzi -> 1 testow czerwonych: read_param_accepts_only_finite_numbers
WYKRYTY   : label: odwrocone free -> 2 testow czerwonych: costs_follow_injected_params, cost_labels_match_web
WYKRYTY   : is_subsequent: != zamiast == -> 3 testow czerwonych: costs_follow_injected_params, is_subsequent_found_city_matches_web, evaluate_found_city_affordance_matches_web
WYKRYTY   : tabela: prog AI 3 -> 2 -> 3 testow czerwonych: evaluate_found_city_affordance_matches_web, cost_constants_match_running_web, pick_source_city_matches_web_including_rand_protocol
WYKRYTY   : hex: domyslnie nie-gora -> 1 testow czerwonych: clear_hex_for_city_center_matches_web
WYKRYTY   : hex: gora wykrywana odwrotnie -> 1 testow czerwonych: apply_city_founding_to_hex_matches_web
PRZEZYL   : hex: zloza odwrocone
WYKRYTY   : hex: snapshot po czyszczeniu -> 1 testow czerwonych: apply_city_founding_to_hex_matches_web
WYKRYTY   : hex: gora nie kasuje zloza -> 2 testow czerwonych: clear_hex_for_city_center_matches_web, apply_city_founding_to_hex_matches_web
WYKRYTY   : hex: gora nie kasuje klucza ulepszenia -> 2 testow czerwonych: clear_hex_for_city_center_matches_web, apply_city_founding_to_hex_matches_web
WYKRYTY   : hex: nie-gora kasuje zloza -> 2 testow czerwonych: apply_city_founding_to_hex_matches_web, clear_hex_for_city_center_matches_web
PRZEZYL   : hex: las zostaje
WYKRYTY   : hex: brak heksu tez zapisuje snapshot -> 1 testow czerwonych: apply_city_founding_to_hex_matches_web
WYKRYTY   : tabela: droga nie zostaje -> 1 testow czerwonych: keep_set_and_predicate_match_web
WYKRYTY   : conquest: prog obcej kultury <= -> 2 testow czerwonych: revolt_multiplier_and_deprecated_penalties_match_web, thresholds_match_web
WYKRYTY   : conquest: niestabilny = lub -> 2 testow czerwonych: revolt_multiplier_and_deprecated_penalties_match_web, thresholds_match_web
WYKRYTY   : revolt: garnizon >= 0 -> 1 testow czerwonych: revolt_multiplier_and_deprecated_penalties_match_web
WYKRYTY   : revolt: odwrocony predykat niestabilnosci -> 1 testow czerwonych: revolt_multiplier_and_deprecated_penalties_match_web
WYKRYTY   : captured: clamp bez semantyki JS -> 1 testow czerwonych: on_city_captured_culture_matches_web_with_injected_circle
WYKRYTY   : captured: ten sam wlasciciel nie konczy -> 1 testow czerwonych: on_city_captured_culture_matches_web_with_injected_circle
WYKRYTY   : captured: brak fallbacku kulturaOwnShare -> 1 testow czerwonych: on_city_captured_culture_matches_web_with_injected_circle
WYKRYTY   : captured: kulturaOwnShare inna niz own -> 1 testow czerwonych: on_city_captured_culture_matches_web_with_injected_circle
WYKRYTY   : captured: ten sam okreg nie czysci -> 1 testow czerwonych: on_city_captured_culture_matches_web_with_injected_circle
WYKRYTY   : clear_city_culture_mix: zostaje kulturaOwnShare -> 2 testow czerwonych: clear_city_culture_mix_removes_both_fields, on_city_captured_culture_matches_web_with_injected_circle
WYKRYTY   : tick: konwersja kultury dla share <= 1 -> 1 testow czerwonych: tick_city_culture_religion_matches_web_with_injected_conversions
WYKRYTY   : tick: rate odwrocony -> 1 testow czerwonych: tick_city_culture_religion_matches_web_with_injected_conversions
WYKRYTY   : tick: converted bez religii -> 1 testow czerwonych: tick_city_culture_religion_matches_web_with_injected_conversions
WYKRYTY   : tick: pusta religia wlasciciela konwertuje -> 1 testow czerwonych: tick_city_culture_religion_matches_web_with_injected_conversions
WYKRYTY   : tick: religia bez obcej dominacji -> 1 testow czerwonych: tick_city_culture_religion_matches_web_with_injected_conversions
WYKRYTY   : ids: sad -> stela -> 2 testow czerwonych: tick_city_culture_religion_matches_web_with_injected_conversions, building_flags_match_web
WYKRYTY   : ids: swiatynia -> kregi -> 2 testow czerwonych: tick_city_culture_religion_matches_web_with_injected_conversions, building_flags_match_web
WYKRYTY   : tabela: teatr nie daje amfiteatru -> 2 testow czerwonych: tick_city_culture_religion_matches_web_with_injected_conversions, building_flags_match_web
WYKRYTY   : tabela: prog obcej kultury 0.5 -> 0.4 -> 2 testow czerwonych: revolt_multiplier_and_deprecated_penalties_match_web, thresholds_match_web
WYKRYTY   : tabela: mnoznik buntu 1.5 -> 1.4 -> 1 testow czerwonych: revolt_multiplier_and_deprecated_penalties_match_web
WYKRYTY   : vis: zasieg < zamiast <= -> 5 testow czerwonych: compute_visible_along_path_matches_web, compute_visible_at_matches_web, compute_visible_fixed_sight_matches_web
WYKRYTY   : vis: odleglosc bez trzeciej osi -> 5 testow czerwonych: compute_player_visibility_matches_web, compute_visible_along_path_matches_web, compute_visible_fixed_sight_matches_web
WYKRYTY   : vis: miasto = DEFAULT -> 2 testow czerwonych: compute_player_visibility_matches_web, unit_sight_resolver_and_compute_visible_match_web
WYKRYTY   : vis: Ruch przed Widok pola -> 2 testow czerwonych: compute_player_visibility_matches_web, unit_sight_resolver_and_compute_visible_match_web
PRZEZYL   : vis: DEFAULT_SIGHT >= 0
WYKRYTY   : vis: garnizon wroga widoczny -> 1 testow czerwonych: units_visible_on_map_matches_web
WYKRYTY   : vis: ladu nie odslania plytkiego morza -> 1 testow czerwonych: key_listings_and_terrain_predicates_match_web
WYKRYTY   : vis: dry = nie morze -> 1 testow czerwonych: key_listings_and_terrain_predicates_match_web
WYKRYTY   : vis: miasto z zasiegiem 0 odslania centrum -> 1 testow czerwonych: compute_player_visibility_matches_web
WYKRYTY   : vis: zasieg startu 0 -> 1 testow czerwonych: compute_player_visibility_matches_web
WYKRYTY   : vis: kultura domyslna 100 -> 1 testow czerwonych: compute_player_visibility_matches_web
WYKRYTY   : vis: gracz domyslny 1 -> 1 testow czerwonych: units_visible_on_map_matches_web
WYKRYTY   : vis: render odwrocony -> 1 testow czerwonych: add_explored_and_render_sets_match_web
WYKRYTY   : vis: start nawet przy widocznych -> 1 testow czerwonych: compute_player_visibility_matches_web
WYKRYTY   : vis: sciezka tylko ostatni heks -> 1 testow czerwonych: compute_visible_along_path_matches_web
WYKRYTY   : vis: addExplored nie dodaje -> 1 testow czerwonych: add_explored_and_render_sets_match_web
mutantow=51 przezylo/niekompilujace=3
   hex: zloza odwrocone
   hex: las zostaje
   vis: DEFAULT_SIGHT >= 0
EXIT=1

# mutation-evidence-r1b.txt
WYKRYTY   : hex: zloza odwrocone -> 1 testow czerwonych: clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed
WYKRYTY   : hex: nie-gora kasuje zloza -> 3 testow czerwonych: clear_hex_for_city_center_matches_web, clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed, apply_city_founding_to_hex_matches_web
WYKRYTY   : hex: las zostaje -> 1 testow czerwonych: clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed
WYKRYTY   : vis: DEFAULT_SIGHT >= 0 -> 1 testow czerwonych: default_sight_uses_the_data_value_only_when_positive
mutantow=4 przezylo/niekompilujace=0

# mutation-evidence-r1c.txt
WYKRYTY   : is_subsequent: != zamiast == -> 4 testow czerwonych: costs_follow_injected_params, first_city_is_free_for_any_params, evaluate_found_city_affordance_matches_web
WYKRYTY   : hex: zloza odwrocone -> 1 testow czerwonych: clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed
WYKRYTY   : hex: nie-gora kasuje zloza -> 3 testow czerwonych: clear_hex_for_city_center_matches_web, apply_city_founding_to_hex_matches_web, clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed
WYKRYTY   : hex: las zostaje -> 1 testow czerwonych: clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed
mutantow=4 przezylo/niekompilujace=0
EXIT=0
```

## 7. NIE_ZMIERZONO / RUNDA-2 (jawna lista)

**Lista RUNDA-2 (jedyna dopuszczona przyczyna statusu RUNDA-2 w tabeli §3):** w tej rundzie ZADEN symbol z czterech plikow nie ma statusu RUNDA-2 (49 wierszy: P / PW / DANE / ND). Ponizsze pozycje to ograniczenia i zadania integracyjne, nie niedomkniete symbole:

- **R2-1: podmiana domkniec na prawdziwe porty** (`sameCultureCircle` P6.14; `convertCulture`, `convertViaTemple`, `cityBorderRadius` P6.16; `hexToWorkedTile` turn-economy): po ich porcie wywolujacy podaje referencje do prawdziwych funkcji; testy z tego tematu pozostaja (domkniecia = zapisane wyniki weba).
- **R2-2: kolejnosc `allHexKeys` / `allRevealLandKeys` / `allDryLandKeys`** dla map budowanych w kolejnosci innej niz rosnaco po `(q, r)` (ZA8): Rust zwraca porzadek `BTreeMap`. Zmiana modelu mapy (`RuchMapa` z zachowaniem kolejnosci wstawiania) to zmiana P6.4, poza allowlista.
- **R2-3: `clearCityCultureMix`** (`society-inputs.ts:40`): port lokalny (ZA3); zastapic przy porcie `society-inputs.ts`.

**NIE_ZMIERZONO:**

- Wspolrzedne `q`/`r` niecalkowite i `ownerId` nie-calkowity (ZA5): wektory zawieraja tylko calkowite.
- `sight = +Infinity` w `computeVisible*` (web: petla nieskonczona; Rust: zbior pusty).
- `Math.random` jako domyslny `rand` (`pickSourceCityForFounding`, `evaluateFoundCityAffordance`): wektory podaja `rand` jawnie; domyslne zachowanie niedeterministyczne nie ma odpowiednika w silniku.
- `rand` zwracajacy wartosc spoza `[0,1)` (NaN, ujemna, `>= 1`, `+-Infinity`): ZMIERZONE w wektorach (web zwraca `undefined` dla indeksu poza tablica -> Rust `None`).
- Wydajnosc (`computeVisibleAt` O(sight^2) na wywolanie): bez pomiarow (niewymagane).
- Integracja ze stanem: komenda `found_city` (P2-5 B6/B11) wolajaca `evaluate_found_city_affordance` -> `foundCityAt`, wpiecie `apply_city_founding_to_hex` w finalizacje zalozenia (`main.ts finalizeCityFounding`), wywolanie `tick_city_culture_religion` / `on_city_captured_culture` z petli tury/po bitwie, `compute_player_visibility` w odswiezaniu mgly: zabronione allowlista (`bridge.rs`, `domain/mod.rs`); moduly dostepne jako `domain::terrain::{...}`.
- Czesc B P6.6 (`cities.ts` 1293 LOC, `empire-city-defaults.ts`, `display-names.ts`): osobny temat; zalezne od niego: `canFoundCity`, `foundCityAt`, `centerWorkedTile` w typie `City`, `isOwnerClusterCityState`.

## 8. Tabela bylo/jest i zmiany testow

| Wielkosc | Bylo (`95b91471`) | Jest |
|---|---|---|
| Testy silnika (`cargo test`) | 865 (= 902 - 37; dispatch: baza >= 865) | 902 (+37, wszystkie nowe w `tests/p6_6a_*.rs`) |
| Zmiany istniejacych testow | - | brak (zadnego istniejacego testu nie edytowano, nie oslabiono, nie usunieto) |
| `domain/state.rs` | 190 linii (walidacja stanu kanonicznego) | 1055 linii: + moduly `city_founding`, `conquest_stability`, `visibility` (istniejacy kod bez zmian) |
| `domain/terrain.rs` | 446 linii | 551 linii: + re-eksport trzech modulow ze `state.rs` i modul `city_hex_clear` (istniejacy kod bez zmian) |
| `data/derived.rs` | 2953 linii | 3064 linii: dopisek na koncu (parsery 4 plikow `data/derived/*.json`) |
| `data/derived/*.json` | 44 plikow | 48: + `city-founding-params.json`, `city-hex-clear-rules.json`, `conquest-stability-params.json`, `visibility-params.json` |
| Nowe pliki testow | - | `p6_6a_{founding,hexclear,conquest,visibility,tables}.rs` + `p6_6a_vectors/` |

Rozklad nowych testow (37): `p6_6a_founding` 10, `p6_6a_hexclear` 4, `p6_6a_conquest` 6, `p6_6a_visibility` 11, `p6_6a_tables` 6.

Zachowanie istniejacego kodu bez zmian (0): nowe moduly nie sa wolane z zadnego istniejacego kodu (podpiecie = zadanie integracyjne, §7).

## 9. Zero zmian poza allowlista - samokontrola

`git status --short` w worktree (przed commitem): zmodyfikowane `rust-port/engine/src/domain/state.rs`, `rust-port/engine/src/domain/terrain.rs` (tylko nowe moduly na koncu + re-eksport), `rust-port/engine/src/data/derived.rs` (dopisek na koncu); nowe: `rust-port/engine/data/derived/{city-founding-params,city-hex-clear-rules,conquest-stability-params,visibility-params}.json`, `rust-port/engine/tests/p6_6a_{founding,hexclear,conquest,visibility,tables}.rs`, `rust-port/engine/tests/p6_6a_vectors/**`, `dyspozycje/rust-port/p6/P6-6A-MIASTA-ZAKLADANIE-A.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-6A-MIASTA-ZAKLADANIE-A-Q1/**`. Poza allowlista: `rust-port/engine/Cargo.lock` (untracked, wygenerowany przez cargo, NIE dodawany do commitu). Zero zmian w `bridge.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `domain/mod.rs`, `tests/p6_m00_skeleton.rs`, `data/derived/README.md`. `git diff --check` czysty (patrz §11.4).

## 10. Jak odtworzyc

Metoda generatora wektorow: odstepstwo od dispatchu ("moduly ladowane przez loader bez stubow logiki LUB wycinane werbatim"): wybrano pierwsza opcje - `gen-p66a-vectors.mjs` laduje przez `p66a-loader-hooks.mjs` CALE moduly TS z pinu `edb8fb56` (`city-founding.ts`, `city-hex-clear.ts`, `conquest-stability.ts`, `visibility.ts` oraz ich graf importow, w tym `culture-religion.ts`, `diplomacy-display.ts`, `turn-economy.ts`, `okolica.ts`, `units/setup.ts`), bez stubow i bez przepisywania funkcji.

```text
# wektory (z katalogu runu; WEB_ROOT = wypakowany git archive edb8fb56 gra/src gra/data)
node --experimental-transform-types --no-warnings --import ./p66a-loader-register.mjs ./gen-p66a-vectors.mjs <WEB_ROOT> rust-port/engine/tests/p6_6a_vectors
python3 -I verify-p66a-vectors.py <WEB_ROOT> rust-port/engine/tests/p6_6a_vectors rust-port/engine
python3 -I gen-symbols-p66a.py <WEB_ROOT> rust-port/engine > symbols-p66a-r1.tsv
python3 -I grep-literals-p66a.py rust-port/engine > dowody/grep-literals-r1.txt
# mutacje (z rust-port/engine, ustawione CARGO_TARGET_DIR); MUT_CHECK=1 tylko sprawdza fragmenty; MUT_SKIP=n pomija n pierwszych
python3 -I -u ../../dyspozycje/autobot/runs/R-RUSTPORT-P6-6A-MIASTA-ZAKLADANIE-A-Q1/mutate-p66a.py [fragment-nazwy ...]
cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test     # w rust-port/engine
```

Wymagany Node >= 22.18 (`--experimental-transform-types` dla enumow TS); uzyty: v22.22.0.

## 11. Surowe, pelne wyjscia bramek r1 (kopie plikow `gate-*-r1.log`, bez wyciec)

### 11.1 `cargo fmt --check` (rust-port/engine; `gate-fmt-r1.log`)

```text
EXIT=0
```

### 11.2 `cargo clippy --all-targets -- -D warnings` (rust-port/engine; `gate-clippy-r1.log`)

```text
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_72c1135f-cb2-1/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 2m 09s
EXIT=0
```

### 11.3 `cargo test` (rust-port/engine; `gate-test-r1.log`)

```text
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_72c1135f-cb2-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 2m 14s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 13 tests
test ai_turn_default_city_parameters_match_ai_params_json ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test hex_city_score_enemy_penalty_follows_threat_range_option ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test wounded_units_retreat_before_attacking ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test manifest_dest_paths_are_unique ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_size ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test sha1_matches_known_vectors ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.99s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test effective_work_cost_is_raw_work_web_one_to_one ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/city_id.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/city_id-693b1037fdbc4b08)

running 6 tests
test city_id_map_keys_stay_numeric_in_json ... ok
test barbarian_city_garrison_json_keeps_numeric_city_id ... ok
test city_id_serializes_as_bare_number ... ok
test city_id_conversions_round_trip ... ok
test barbarian_cleared_cities_round_trip_as_numbers ... ok
test city_id_ordering_matches_raw_value ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/combat-7737db4785daf590)

running 7 tests
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat_ai_multipliers.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/combat_ai_multipliers-52898acb951a9ad0)

running 5 tests
test city_structure_bonuses_are_positive_and_mur_is_the_largest_single_bonus ... ok
test accessors_return_the_table_value_not_a_constant ... ok
test las_row_is_class_a_and_marked_read_by_domain ... ok
test table_has_each_row_once_with_known_class_and_status ... ok
test veteran_levels_are_complete_and_non_decreasing ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/counter_multipliers.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/counter_multipliers-c944a65d0a384717)

running 5 tests
test domain_reads_table_and_unknown_types_give_no_bonus ... ok
test explicit_unit_bonus_overrides_table ... ok
test table_lists_each_type_pair_once_with_finite_positive_multiplier ... ok
test table_is_readable_for_every_pair_and_misses_are_none ... ok
test table_type_keys_are_canonical ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test collection_counts_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test rt_auto_battle_params ... ok
test rt_citizen_resource_upkeep ... ok
test rt_city_names_pools ... ok
test rt_civ_ai ... ok
test rt_civ_matrix ... ok
test rt_civ_params ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_combat_params ... ok
test rt_civs ... ok
test rt_counters ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_diplomacy ... ok
test rt_e_start_params ... ok
test rt_econ_params ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_map_gen_params ... ok
test rt_power_params ... ok
test rt_miasto_params ... ok
test rt_resources ... ok
test rt_tech ... ok
test rt_society_params ... ok
test rt_terrain_improvements ... ok
test rt_terrain_combat ... ok
test rt_terrain_movement ... ok
test rt_terrain_yields ... ok
test rt_ui_params ... ok
test rt_wonders ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_ai_params ... ok
test rt_units ... ok
test rt_buildings ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.27s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_unreadable_file_is_io ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_missing_file_is_file_missing ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.59s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/derived_values.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/derived_values-7eb2b3615468dd51)

running 25 tests
test basket_and_treaty_duration_read_diplomacy_table ... ok
test building_table_has_exactly_the_42_canonical_ids_once_each ... ok
test building_table_key_shape_is_known_resources_and_mirrors_the_base_keys ... ok
test building_gold_upkeep_has_one_row_per_building_level ... ok
test building_table_palac_has_no_stock_cost_and_others_do ... ok
test difficulty_is_one_type_across_domain_modules ... ok
test diplomacy_multipliers_cover_each_constant_once_with_web_values ... ok
test domain_building_costs_read_the_building_table_values_without_recomputing_them ... ok
test gold_table_has_exactly_the_75_units_once_each_and_known_eras ... ok
test improvement_and_wonder_tables_cover_every_entry_once ... ok
test building_work_states_cover_each_building_level_and_axis_combination_exactly_once ... ok
test research_costs_cover_each_tech_tempo_and_axis_once ... ok
test storage_caps_cover_each_era_and_difficulty_once ... ok
test trade_multipliers_cover_each_constant_once_with_values ... ok
test unit_food_has_twelve_states_per_unit_and_integer_hundredths ... ok
test racje_cover_every_half_step_from_zero_to_six_once ... ok
test domain_recruitment_reads_the_gold_table_without_recomputation ... ok
test unit_table_epoch_field_matches_units_json ... ok
test unit_gold_states_cover_each_unit_and_axis_combination_exactly_once ... ok
test domain_recruitment_reads_the_unit_table_values_without_recomputing_them ... ok
test unit_table_has_one_row_per_units_json_record_and_no_extra_rows ... ok
test work_table_has_exactly_the_42_buildings_once_each_and_positive_values ... ok
test work_table_is_read_by_the_domain_without_recomputation ... ok
test unit_table_keeps_the_units_json_base_as_provenance ... ok
test unit_table_key_shape_and_positive_integer_values ... ok

test result: ok. 25 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/diplomacy-d94c0845f92f376e)

running 32 tests
test alliance_uses_configured_hegemon_threshold ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test annexation_requires_vassal_economy_orientation ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test peace_price_is_independent_of_treaty_duration ... ok
test production_diplomacy_api_is_public ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test diplomacy_unit_prices_match_units_json_for_every_row ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_movement_costs_are_explicit ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/owner_ref.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/owner_ref-92f476c7f4239a8a)

running 10 tests
test camp_id_is_a_transparent_newtype ... ok
test owner_and_camp_fields_are_plain_numbers_in_struct_json ... ok
test owner_ref_accessors_and_player_conversion ... ok
test owner_ref_hash_agrees_with_equality ... ok
test owner_ref_legacy_conversions_match_the_sentinels ... ok
test owner_ref_refuses_player_ids_that_do_not_fit_the_legacy_number ... ok
test owner_ref_ordering_matches_the_legacy_i64_order ... ok
test owner_ref_rejects_unknown_negative_numbers ... ok
test owner_ref_serializes_every_variant_as_the_legacy_number ... ok
test player_keyed_maps_keep_numeric_string_keys ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_civ_entry_epoch.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1_civ_entry_epoch-c29112b12d237024)

running 8 tests
test civ_availability_matches_web_vectors_for_every_game_epoch ... ok
test civ_ids_available_match_web_roster_vectors ... ok
test civ_entry_label_matches_web_vectors ... ok
test game_epoch_hud_label_matches_web_vectors ... ok
test game_epoch_index_matches_web_for_every_probe ... ok
test strict_epoch_ids_reject_non_canonical_spellings ... ok
test civ_entry_epoch_matches_web_vectors ... ok
test game_epoch_order_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_first_player_city.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1_first_player_city-e31375affc71b1c0)

running 5 tests
test awaiting_first_city_matches_web_for_owner_zero ... ok
test validate_placement_matches_web_vectors ... ok
test denied_message_matches_web_constant ... ok
test awaiting_first_city_matches_web_for_explicit_owner_one ... ok
test hex_in_start_reveal_matches_web_vectors ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_owner_seats.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1_owner_seats-1a3aae5c483a1e2f)

running 6 tests
test hot_seat_cycles_and_skips_unknown_active ... ok
test human_owner_primary_matches_web ... ok
test major_ai_owner_matches_web_vectors ... ok
test human_seats_match_web_vectors ... ok
test stub_constants_are_the_web_sentinels ... ok
test web_owner_minus_five_is_out_of_domain_and_not_representable ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_rng_mulberry.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1_rng_mulberry-617bdab005dd8b1f)

running 2 tests
test mulberry32_is_not_the_lcg_stream ... ok
test mulberry32_matches_web_make_rng_vectors_bit_for_bit ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1b_playerstate.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1b_playerstate-7e0df28b40755091)

running 19 tests
test error_missing_cost_for_unknown_tempo_and_mode ... ok
test hot_seat_two_human_owners_have_independent_player_states ... ok
test error_research_step_is_atomic_on_missing_cost ... ok
test parity_cheapest_tie_break_uses_utf16_order ... ok
test parity_constants_and_defaults_match_web ... ok
test parity_gates_available_and_cheapest ... ok
test parity_per_row_functions ... ok
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

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.98s

     Running tests/p6_1c_braz_access.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1c_braz_access-043839ba2b428854)

running 7 tests
test city_has_piec_hutniczy_matches_web ... ok
test empire_has_kopalnia_miedzi_matches_web ... ok
test has_braz_access_matches_web ... ok
test normalize_improvement_key_known_keys_equal_data_keys ... ok
test normalize_improvement_key_matches_web ... ok
test prototype_keys_are_out_of_domain_and_do_not_change_braz_outcome ... ok
test bootstrap_table_values_equal_web_constants ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/p6_1c_llama_seed.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1c_llama_seed-e56bbca479ca6477)

running 3 tests
test hex_keys_within_radius_matches_web_loop_order ... ok
test hash_pos_matches_web_hash_pos_verbatim ... ok
test seed_inca_llama_deposits_matches_web_for_all_cases ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.52s

     Running tests/p6_1c_start_cluster.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1c_start_cluster-584791c0a8e00ea4)

running 8 tests
test land_hexes_filter_matches_web_rule ... ok
test constants_and_start_relations_match_web ... ok
test display_label_for_slot_matches_web ... ok
test build_cluster_start_plan_matches_web_for_all_cases ... ok
test pick_second_human_start_hex_matches_web ... ok
test second_human_without_legal_hex_yields_no_second_seat_derived_from_code ... ok
test second_human_civ_equal_to_player_civ_is_rejected_like_web ... ok
test vectors_cover_the_branches_of_build_cluster_start_plan ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.93s

     Running tests/p6_1c_tables.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1c_tables-2a37790854995833)

running 4 tests
test start_tables_parse_with_deny_unknown_fields ... ok
test cluster_table_has_sane_shape ... ok
test braz_table_has_sane_shape_and_consistent_references ... ok
test llama_table_has_sane_shape ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1d_city_names.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1d_city_names-4bfda12150196ed9)

running 13 tests
test embedded_pool_data_is_byte_identical_to_data_used_for_vectors ... ok
test nazwa_klastra_at_matches_web ... ok
test collect_used_city_names_matches_web ... ok
test pick_next_city_name_from_names_matches_web_for_synthetic_queues ... ok
test pool_length_constants_match_web ... ok
test resolve_state_city_name_matches_web ... ok
test cluster_rival_from_pool_matches_web ... ok
test rival_pool_index_matches_web ... ok
test suggest_and_ai_founding_names_match_web ... ok
test city_name_with_suffix_matches_web ... ok
test state_city_name_at_matches_web ... ok
test validate_city_names_pools_matches_web ... ok
test pick_capital_foreign_regular_match_web_for_real_pools ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s

     Running tests/p6_1d_civ_bonuses.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1d_civ_bonuses-30f5c7450cfc6997)

running 14 tests
test apply_multiplier_matches_web ... ok
test building_cost_discount_matches_web ... ok
test embedded_data_is_byte_identical_to_data_used_for_vectors ... ok
test is_combat_modifier_bonus_matches_web ... ok
test empty_bonus_list_gives_zero_multipliers ... ok
test matrix_bonusy_match_web_for_every_civ_key_variant ... ok
test real_civs_bonuses_convert_without_loss ... ok
test movement_range_siege_wall_multipliers_match_web ... ok
test terrain_forest_detection_matches_web ... ok
test unit_combat_category_matches_web_for_every_unit ... ok
test unit_matches_cel_matches_web_for_every_unit_and_cel ... ok
test strip_diacritics_matches_web_function_cut_verbatim ... ok
test bonus_applies_per_entry_matches_web_for_multi_entry_lists ... ok
test bonus_applies_and_stat_multipliers_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 12.58s

     Running tests/p6_1d_tables.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1d_tables-7c67743f1f351b01)

running 4 tests
test rules_have_known_stats_and_param_ids ... ok
test diacritics_table_maps_single_chars_outside_ascii ... ok
test city_name_constants_have_consistent_shape ... ok
test matrix_specs_have_consistent_shape_and_known_param_ids ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1e_civ_matrix.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1e_civ_matrix-d0b7dd9cf60d4be3)

running 21 tests
test ai_fallback_branches_are_actually_exercised ... ok
test ai_params_and_diplomacy_rows_match_web ... ok
test apply_civ_matrix_param_matches_web ... ok
test civ_matrix_param_def_matches_web ... ok
test civ_matrix_param_at_difficulty_matches_web ... ok
test civ_matrix_param_matches_web ... ok
test civ_matrix_params_at_difficulty_matches_web_order_and_values ... ok
test consumer_status_polarity_band_baseline_match_web_per_parameter ... ok
test data_files_are_byte_identical_to_web_pin ... ok
test every_matrix_cell_parses_exactly_like_js ... ok
test median_matches_web ... ok
test param_order_and_rows_match_web_for_every_scenario ... ok
test ai_by_typ_resolvers_match_web ... ok
test proc_sum_and_apply_proc_match_web ... ok
test scale_parameters_are_clamped_and_shifted_only_for_skala ... ok
test every_status_for_every_parameter_matches_web_texts ... ok
test status_visibility_is_true_only_for_real_gameplay ... ok
test profile_by_key_resolution_matches_web ... ok
test ai_profiles_and_norms_match_web ... ok
test synthetic_cell_grid_matches_web ... ok
test snapshot_and_profiles_match_web ... ok

test result: ok. 21 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.77s

     Running tests/p6_1e_civ_names.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1e_civ_names-80674a5ae9a4508e)

running 11 tests
test assign_invariants_hold_on_real_roster ... ok
test find_klastra_display_validate_match_web ... ok
test constants_match_web ... ok
test make_rng_streams_match_web_for_every_seed ... ok
test civ_ids_from_roster_matches_web ... ok
test reexports_behave_like_web ... ok
test rotate_preferred_matches_web ... ok
test pick_active_civ_pool_matches_web ... ok
test assign_ai_civ_types_matches_web ... ok
test pool_views_ai_founded_and_validation_match_web ... ok
test start_foreign_rival_state_names_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.21s

     Running tests/p6_1e_js_compat.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1e_js_compat-08e1cb152706a259)

running 8 tests
test math_round_matches_js_bit_for_bit ... ok
test number_to_string_matches_js_for_every_vector ... ok
test is_integer_and_min_max_clamp_follow_js ... ok
test intensity_label_matches_web ... ok
test parameter_label_matches_web ... ok
test trim_matches_js_string_trim ... ok
test formatted_value_matches_web ... ok
test to_fixed_matches_js_for_every_digit_count ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.13s

     Running tests/p6_1e_tables.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_1e_tables-9dc9ef20c17d92b2)

running 7 tests
test params_table_is_consistent_with_matrix_and_civs ... ok
test semantic_neutral_band_rules_cover_every_parameter_definition ... ok
test parameter_label_dictionary_has_nonempty_entries_and_suffix_rule ... ok
test semantic_table_has_text_for_every_status_and_placeholder ... ok
test semantic_table_sets_reference_existing_parameters_and_are_disjoint ... ok
test tables_parse_and_are_cached ... ok
test modules_contain_no_balance_or_data_literals ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_23_fort.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_23_fort-324dd86b69e58eeb)

running 5 tests
test fort_rules_table_references_known_improvements ... ok
test fort_node_conversion_and_reservation_match_web ... ok
test takeover_on_city_founded_matches_web ... ok
test evacuation_hex_matches_web ... ok
test territory_dependencies_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.23s

     Running tests/p6_23_hexmove.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_23_hexmove-a546770c25695422)

running 4 tests
test foreign_city_blocks_feed_pathfinding_and_roads_use_p3_23_divisors ... ok
test city_at_hex_and_occupancy_match_web ... ok
test ai_entry_into_empty_enemy_city_matches_web ... ok
test foreign_city_blocks_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/p6_23_improvements.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_23_improvements-2f6107250ed9d0bf)

running 10 tests
test constants_match_web ... ok
test catalog_key_order_equals_json_file_order_including_meta_rows ... ok
test applying_bonuses_matches_web ... ok
test era_and_cost_scaling_match_web ... ok
test migration_functions_match_web ... ok
test rules_tables_have_consistent_shape ... ok
test normalize_and_lookup_functions_match_web ... ok
test prototype_keys_pass_normalize_like_in_web ... ok
test hex_layer_functions_match_web ... ok
test territory_and_ore_yields_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.63s

     Running tests/p6_23_order.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_23_order-b99acb8ea5803b82)

running 11 tests
test fallback_params_equal_web_constant ... ok
test evaluate_order_matches_web ... ok
test engine_society_params_match_web_subset_used_by_vectors ... ok
test compute_order_matches_web ... ok
test load_order_params_matches_web ... ok
test order_shape_invariants_hold_for_any_table_values ... ok
test happiness_breakdown_matches_web ... ok
test order_effects_matches_web ... ok
test order_effects_to_yield_mults_matches_web ... ok
test order_tier_matches_web ... ok
test pick_revolt_migration_target_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.58s

     Running tests/p6_23_tables.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_23_tables-6de635983c184b19)

running 3 tests
test ulepszenia_reguly_table_references_existing_improvements_only ... ok
test teren_ruch_reguly_table_has_nonempty_lists ... ok
test porzadek_params_table_is_complete_and_finite ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_4_core.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_4_core-1b564fea4bb5288e)

running 10 tests
test constants_read_from_running_web_match_tables ... ok
test hex_distance_matches_web ... ok
test path_cost_matches_web ... ok
test road_modifier_matches_web_including_floor_and_special_costs ... ok
test stack_group_id_matches_web ... ok
test compute_reachable_matches_web_order_and_min_move ... ok
test terrain_and_embark_costs_match_web_on_maps ... ok
test terrain_cost_combinations_match_web ... ok
test compute_path_matches_web_including_ties_and_edge_destinations ... ok
test visibility_helpers_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.92s

     Running tests/p6_4_embark.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_4_embark-1585566f17a207b0)

running 4 tests
test water_hex_queries_match_web ... ok
test can_unit_embark_matches_web ... ok
test apply_embark_state_after_move_matches_web ... ok
test move_cost_fn_for_matches_web_on_every_map_hex ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.19s

     Running tests/p6_4_march.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_4_march-bae7bfc63cf555d2)

running 6 tests
test save_validation_and_round_trip_match_web ... ok
test fog_frontier_and_fog_plan_match_web ... ok
test should_stop_at_obstacle_matches_web ... ok
test truncate_path_to_budget_matches_web_including_min_move ... ok
test plan_path_turns_matches_web ... ok
test execute_march_step_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.55s

     Running tests/p6_4_rally.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_4_rally-4bbcd32c03f67cc3)

running 3 tests
test launch_leaders_one_per_stack_match_web ... ok
test load_from_save_and_number_parsing_match_web ... ok
test set_clear_and_save_sequences_match_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/p6_4_scout.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_4_scout-573fb211c9224499)

running 5 tests
test explore_scores_match_web ... ok
test scout_flags_match_web ... ok
test run_scouts_auto_explore_matches_web ... ok
test pick_scout_explore_target_matches_web_including_rng_use ... ok
test advance_scout_auto_explore_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 26.98s

     Running tests/p6_4_tables.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_4_tables-d82f71a9bfb2cdbc)

running 4 tests
test neighbour_table_is_six_distinct_adjacent_offsets ... ok
test table_parses_and_every_row_names_its_web_source ... ok
test text_rows_are_nonempty_and_distinct ... ok
test numeric_rows_have_sane_shape_without_pinning_values ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_5a_cost.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_5a_cost-a4777603b2625768)

running 4 tests
test js_round_matches_half_up_semantics ... ok
test replace_context_keeps_every_field_and_the_required_stock ... ok
test table_constants_equal_the_running_web_object ... ok
test unit_cost_pace_matches_web_bitwise ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_5a_display.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_5a_display-f61d69c84dc8b548)

running 7 tests
test field_power_passes_roster_in_web_order_and_returns_sum ... ok
test badge_and_veteran_maxima_match_web ... ok
test hp_pool_matches_web_including_nonfinite_and_overfull_hp ... ok
test compute_stack_display_matches_web_order_and_vitals ... ok
test unit_at_representative_matches_web ... ok
test representative_matches_web_including_utf16_id_order_and_nan_attack ... ok
test stack_vitals_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.98s

     Running tests/p6_5a_ruch.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_5a_ruch-0e062d5664866c50)

running 8 tests
test hud_actions_match_web ... ok
test bounce_hex_assignment_matches_web_including_duplicates_and_blocking ... ok
test adjacent_empty_and_split_destinations_match_web ... ok
test bounce_from_origin_and_separate_return_hex_match_web ... ok
test ruch_pools_match_web_bitwise ... ok
test separate_return_matches_web_bitwise ... ok
test sync_and_deduct_match_web ... ok
test unit_with_pooled_ruch_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.84s

     Running tests/p6_5a_stack.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_5a_stack-32bcaffc556db8d5)

running 10 tests
test fresh_and_shared_stack_group_ids_match_web_sequence ... ok
test adjacent_army_hexes_and_active_stack_match_web ... ok
test garrison_and_field_fortify_transitions_match_web ... ok
test all_defenders_and_wake_stack_match_web ... ok
test stack_group_id_agrees_with_p64_port_on_the_same_unit ... ok
test law_garrison_counts_match_web ... ok
test same_stack_group_and_stack_key_match_web ... ok
test stack_group_id_and_render_key_match_web ... ok
test transition_chains_match_web_including_both_fortifications_at_once ... ok
test visible_colocated_and_garrison_queries_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.55s

     Running tests/p6_5a_tables.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_5a_tables-c73c4ca1005ab433)

running 2 tests
test army_params_parse_and_have_sane_shape ... ok
test tempo_table_parses_and_has_distinct_keys_with_positive_multipliers ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_5b_bonuses.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_5b_bonuses-02e0bfe8577aeac4)

running 8 tests
test building_roles_and_real_game_data_match_web ... ok
test gain_hint_text_matches_web_for_arbitrary_gains ... ok
test chain_depth_limit_matches_web ... ok
test stat_multiplier_merge_is_generic_over_any_structural_type ... ok
test stat_multiplier_merge_matches_web ... ok
test unit_progress_badges_and_fractions_match_web ... ok
test city_visit_gain_progress_and_hint_match_web ... ok
test city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 6.03s

     Running tests/p6_5b_format.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_5b_format-8864aed56360906f)

running 5 tests
test citizen_label_matches_web ... ok
test locale_compare_table_is_the_measured_primary_order ... ok
test number_to_string_matches_web ... ok
test locale_compare_matches_web_for_ascii ... ok
test population_formats_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.70s

     Running tests/p6_5b_manpower.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_5b_manpower-0a099d61a31307ee)

running 13 tests
test besieged_location_sort_key_sync_and_civilian_match_web ... ok
test civ_bonus_multipliers_match_web ... ok
test empire_deduct_refund_and_spawn_mutate_like_web ... ok
test city_pool_functions_match_web ... ok
test game_default_params_equal_the_running_web_defaults ... ok
test opt_helpers_are_consistent ... ok
test empire_totals_match_web ... ok
test heal_cost_and_cap_match_web ... ok
test pool_and_cost_scalars_match_web ... ok
test era_table_and_citizen_scalars_match_web ... ok
test raw_param_loaders_match_web ... ok
test regen_gain_matches_web_including_default_params ... ok
test spawn_and_refund_functions_match_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 9.33s

     Running tests/p6_5b_replenish.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_5b_replenish-11d5c4ac4b77306b)

running 1 test
test replenishment_matches_web_state_results_and_closure_protocol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.68s

     Running tests/p6_5b_tables.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_5b_tables-4f918dda2f6680dd)

running 6 tests
test era_table_rows_are_contiguous_and_cover_the_clamp_range ... ok
test civilian_set_is_resolved_from_the_table ... ok
test tables_are_loaded_from_the_embedded_json_files ... ok
test tables_parse_and_have_the_expected_shape ... ok
test p65a_badge_closures_are_closed_by_the_real_path_badge_port ... ok
test table_constants_equal_the_running_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.32s

     Running tests/p6_6a_conquest.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_6a_conquest-230020c5d317bb55)

running 6 tests
test clear_city_culture_mix_removes_both_fields ... ok
test building_flags_match_web ... ok
test thresholds_match_web ... ok
test on_city_captured_culture_matches_web_with_injected_circle ... ok
test revolt_multiplier_and_deprecated_penalties_match_web ... ok
test tick_city_culture_religion_matches_web_with_injected_conversions ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.30s

     Running tests/p6_6a_founding.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_6a_founding-99bc07a6ebb0028d)

running 10 tests
test costs_follow_injected_params ... ok
test evaluate_found_city_affordance_matches_web ... ok
test cost_labels_match_web ... ok
test first_city_is_free_for_any_params ... ok
test can_afford_found_city_matches_web ... ok
test production_params_come_from_data_tables ... ok
test read_param_accepts_only_finite_numbers ... ok
test cost_constants_match_running_web ... ok
test is_subsequent_found_city_matches_web ... ok
test pick_source_city_matches_web_including_rand_protocol ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s

     Running tests/p6_6a_hexclear.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_6a_hexclear-98167207530960b3)

running 4 tests
test clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed ... ok
test clear_hex_for_city_center_matches_web ... ok
test apply_city_founding_to_hex_matches_web ... ok
test keep_set_and_predicate_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/p6_6a_tables.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_6a_tables-49f7fae6dbfdf022)

running 6 tests
test conquest_table_is_well_formed ... ok
test default_sight_comes_from_map_gen_params_when_positive ... ok
test founding_costs_are_present_in_miasto_params ... ok
test founding_table_is_well_formed ... ok
test hex_clear_table_is_well_formed ... ok
test visibility_table_is_well_formed ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_6a_visibility.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_6a_visibility-0615129695460042)

running 11 tests
test compute_visible_along_path_matches_web ... ok
test compute_visible_at_matches_web ... ok
test city_sight_radius_reexport_matches_web ... ok
test add_explored_and_render_sets_match_web ... ok
test default_sight_uses_the_data_value_only_when_positive ... ok
test compute_player_visibility_matches_web ... ok
test key_listings_and_terrain_predicates_match_web ... ok
test constants_match_running_web ... ok
test compute_visible_fixed_sight_matches_web ... ok
test units_visible_on_map_matches_web ... ok
test unit_sight_resolver_and_compute_visible_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.49s

     Running tests/p6_m00_skeleton.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m00_skeleton-1864ffd75187226a)

running 5 tests
test doc_row_lists_expected_counts ... ok
test domain_mod_declares_top_level_skeleton_modules ... ok
test mapgen_mod_declares_exactly_doc_modules ... ok
test skeleton_headers_name_full_owner_ids_from_table ... ok
test files_exist_and_start_with_owner_doc_header ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m01_climate.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m01_climate-fc8a7dd62f5452ac)

running 7 tests
test forest_threshold_matches_web_bit_for_bit ... ok
test polar_predicate_matches_web ... ok
test climate_band_default_arguments_and_ignored_q_match_web ... ok
test world_type_and_climate_band_serde_literals_match_web ... ok
test desert_assignment_predicate_matches_web ... ok
test climate_band_sweep_matches_web_for_every_height_and_row ... ok
test water_terrain_predicate_matches_web_for_every_terrain ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/p6_m01_earth_mask.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m01_earth_mask-1779c36a54b4d8e3)

running 10 tests
test derived_mask_file_is_the_single_source_of_mask_data ... ok
test hex_to_norm_edges_match_web ... ok
test mask_dimensions_and_bbox_match_web_bit_for_bit ... ok
test bit_at_clamps_out_of_range_coordinates_like_web ... ok
test polar_rows_inner_dimensions_and_buffers_match_web_for_heights_0_to_600 ... ok
test named_constants_match_web_exports ... ok
test sample_template_land_nan_is_sea ... ok
test sample_template_land_matches_web_on_thousands_of_points ... ok
test all_288000_mask_bits_match_the_web_rows ... ok
test hex_to_template_norm_template_land_subsample_and_threshold_match_web_for_all_dims ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.61s

     Running tests/p6_m01_params_shape.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m01_params_shape-188a388bb5a09197)

running 9 tests
test climate_is_polar_outside_the_map ... ok
test params_files_parse_and_have_the_expected_shape ... ok
test params_floats_are_parsed_exactly_from_the_raw_json_text ... ok
test subsample_and_threshold_tiers_never_decrease_resolution_for_bigger_maps ... ok
test ocean_buffers_never_shrink_with_height_and_respect_their_lower_bound ... ok
test template_sampling_is_zero_outside_the_unit_square ... ok
test climate_bands_are_ordered_north_to_south_and_cover_the_playable_rows ... ok
test mask_file_is_well_formed ... ok
test template_land_respects_border_and_polar_buffers_and_yields_binary_values ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.18s

     Running tests/p6_m01_prims.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m01_prims-963d8aed92ec098f)

running 14 tests
test hex_directions_match_web_in_every_implementation ... ok
test all_three_mulberry32_implementations_match_web_for_every_seed_and_step ... ok
test hex_distance_matches_web_for_large_coordinates ... ok
test hex_distance_matches_web_on_the_full_grid_in_every_implementation ... ok
test fbm_matches_web_bit_for_bit_for_all_octave_counts ... ok
test hex_key_matches_web_format ... ok
test js_cos_outside_the_medium_range_stays_within_one_ulp_and_keeps_special_values ... ok
test cos_lerp_matches_web_bit_for_bit ... ok
test mulberry32_state_is_the_seed_until_first_draw ... ok
test value_noise_matches_web_bit_for_bit_including_huge_and_negative_coordinates ... ok
test js_cos_matches_v8_math_cos_bit_for_bit_in_the_supported_range ... ok
test vectors_come_from_the_pinned_web_run ... ok
test perm_table_matches_web_for_all_256_entries ... ok
test js_to_int32_follows_ecmascript_to_int32 ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s

     Running tests/p6_m02_deposit_river.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m02_deposit_river-aa1b079e2438a847)

running 7 tests
test metal_deposit_min_era_table_matches_web ... ok
test deposit_visibility_matches_web ... ok
test parse_helpers_cover_all_tokens ... ok
test river_switch_without_environment_matches_web ... ok
test ensure_meta_and_hidden_count_match_web ... ok
test river_switch_keys_match_names_the_web_queried ... ok
test river_switch_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/p6_m02_float_parse.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m02_float_parse-bdfe4c125f45e686)

running 1 test
test table_floats_are_read_without_rounding_error ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m02_generator.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m02_generator-aad7149729b35309)

running 4 tests
test menu_labels_match_web ... ok
test normalization_matches_web ... ok
test size_from_menu_label_and_label_to_dims_match_web ... ok
test size_dims_and_order_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m02_new_game.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m02_new_game-fb7bd264e697cc8f)

running 11 tests
test clamp_miasta_panstwa_count_matches_web ... ok
test constants_match_web ... ok
test density_to_label_round_trips_where_web_does ... ok
test civ_menus_with_rosters_match_web ... ok
test land_fraction_functions_match_web ... ok
test resolve_world_gen_numbers_matches_web ... ok
test river_map_params_match_web_bitwise ... ok
test per_label_functions_match_web ... ok
test map_size_label_from_dims_matches_web ... ok
test tier_functions_match_web ... ok
test world_generation_presets_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.70s

     Running tests/p6_m02_quality.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m02_quality-07b289bbbb867c75)

running 4 tests
test constants_match_web ... ok
test per_label_functions_match_web ... ok
test tier_to_label_and_preset_match_web ... ok
test web_quirk_ignores_z_with_dot ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m02_tables.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m02_tables-abfdd889c351ab6b)

running 7 tests
test map_label_thresholds_are_ascending_and_known ... ok
test every_section_names_its_web_source ... ok
test land_and_toggle_tables_are_consistent ... ok
test river_rules_have_sane_ranges ... ok
test size_tables_are_consistent ... ok
test table_parses_with_deny_unknown_fields ... ok
test per_size_menus_cover_every_size ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_m09_rivals.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m09_rivals-3d2871a7b9753cde)

running 19 tests
test foreign_buffer_gate_matches_web ... ok
test constants_match_web_and_aliases_are_not_separate_numbers ... ok
test group_foreign_type_clusters_matches_web ... ok
test half_plane_axis_matches_web_bitwise ... ok
test cluster_pack_radius_matches_web ... ok
test is_in_half_plane_matches_web ... ok
test land_pool_near_core_matches_web ... ok
test map_helpers_match_web ... ok
test hexes_at_distance_matches_web ... ok
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

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 14.38s

     Running tests/p6_m09_tables.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m09_tables-0380ed37b51ae447)

running 3 tests
test table_parses_with_deny_unknown_fields ... ok
test every_value_has_web_source_and_sane_shape ... ok
test start_city_state_distance_is_not_the_cities_ts_constant ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_m10_masses.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m10_masses-1406512a25778485)

running 16 tests
test alias_constants_are_not_separate_numbers ... ok
test constants_match_web ... ok
test local_land_fraction_and_gate_match_web ... ok
test map_size_label_matches_web_and_params_table ... ok
test allocate_typy_to_masses_matches_web ... ok
test player_mass_gate_over_whole_maps_matches_web ... ok
test mass_qualifies_and_indices_match_web ... ok
test reorder_roster_by_preference_matches_web ... ok
test roster_for_start_epoch_matches_web ... ok
test spawn_habitable_terrain_matches_web ... ok
test thresholds_and_caps_match_web ... ok
test types_have_web_shape ... ok
test vectors_identify_the_maps_used ... ok
test group_habitable_masses_and_cache_match_web ... ok
test region_mass_dominance_matches_web ... ok
test development_space_and_mass_gates_match_web ... ok

test result: ok. 16 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 11.46s

     Running tests/p6_m10_placement.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m10_placement-0ff78516c0b93780)

running 14 tests
test hooks_match_web ... ok
test pick_center_in_mass_matches_web ... ok
test balance_and_enforce_match_web ... ok
test pick_best_local_land_spawn_matches_web ... ok
test pick_center_in_mass_spread_matches_web ... ok
test pick_tied_spawn_land_candidate_matches_web ... ok
test pick_center_on_land_pool_spread_matches_web ... ok
test pick_center_in_mass_with_land_gate_matches_web ... ok
test sort_spawn_candidates_with_spread_bias_matches_web ... ok
test sort_spawn_land_candidates_matches_web ... ok
test voronoi_and_centroid_match_web ... ok
test place_cluster_centers_across_landmasses_matches_web ... ok
test pick_player_cluster_center_matches_web ... ok
test player_start_candidates_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 20.71s

     Running tests/p6_m10_start_scoring.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m10_start_scoring-a1f4519e6663b8a9)

running 4 tests
test score_city_start_hex_over_whole_maps_matches_web ... ok
test reveal_radius_matches_web ... ok
test score_city_start_hex_matches_web ... ok
test find_best_player_start_hex_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.79s

     Running tests/p6_m10_tables.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m10_tables-07a2652eafb05f75)

running 3 tests
test every_value_has_a_web_source_with_file_and_line ... ok
test values_have_sane_shape ... ok
test tables_parse_with_deny_unknown_fields ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m10_v8sort.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m10_v8sort-d4cb86648b856051)

running 2 tests
test js_array_sort_is_stable_for_equal_keys ... ok
test js_array_sort_matches_v8_including_comparator_call_counts ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.56s

     Running tests/p6_m14_range.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m14_range-11a976a1d8c0add9)

running 3 tests
test culture_range_matches_web ... ok
test territory_keys_by_owner_match_web ... ok
test religion_range_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.21s

     Running tests/p6_m14_territory.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m14_territory-ba89cbcff9a8795a)

running 8 tests
test city_sight_radius_matches_web ... ok
test city_territory_radius_matches_web ... ok
test city_range_for_population_matches_web ... ok
test owner_tie_goes_to_first_node ... ok
test axial_distance_matches_web_and_integer_variant ... ok
test is_player_territory_hex_matches_web ... ok
test is_in_territory_matches_web ... ok
test territory_owner_at_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.29s

     Running tests/p6_m14_wonder.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m14_wonder-96491650d658ea23)

running 4 tests
test pick_matches_web ... ok
test shape_candidates_are_sorted_land_and_exclude_center ... ok
test list_for_city_matches_web ... ok
test list_for_owner_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.18s

     Running tests/p6_m14_work.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m14_work-1ce45b3a771ecceb)

running 8 tests
test city_center_keys_match_web ... ok
test build_territory_nodes_matches_web ... ok
test reconcile_without_reczne_is_noop ... ok
test is_territory_hex_owned_by_matches_web ... ok
test reconcile_all_matches_web ... ok
test reconcile_for_owner_matches_web ... ok
test workable_filter_matches_web ... ok
test reczne_key_legal_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.94s

     Running tests/p6_m15_roads.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m15_roads-00c1796d2d44aacd)

running 8 tests
test constants_match_web ... ok
test is_road_key_matches_web ... ok
test has_road_matches_web ... ok
test road_table_shape_and_key_names ... ok
test roads_source_has_no_numeric_data_literals ... ok
test collect_road_keys_matches_web_order ... ok
test p64_ruch_modifier_agrees_with_roads_module ... ok
test apply_modifier_matches_web_bitwise ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.28s

     Running tests/p6_m16_divergence.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m16_divergence-36f41f9340105fdf)

running 1 test
test web_allows_farm_irrigation_terraces_on_deposit_hexes ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.15s

     Running tests/p6_m16_doc.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m16_doc-a783ecb95132fc08)

running 1 test
test document_has_a_status_row_for_every_web_symbol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_m16_gallery.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m16_gallery-40cbda6184b177cf)

running 2 tests
test gallery_terrain_eligible_matches_web ... ok
test gallery_combo_eligible_and_show_model_match_web ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.24s

     Running tests/p6_m16_qualifier.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m16_qualifier-54c27efc7f24500a)

running 4 tests
test forest_build_block_reason_matches_web ... ok
test api_hex_click_and_on_select_match_web ... ok
test api_qualifying_hexes_and_work_cost_match_web ... ok
test qualifier_bits_match_web_for_every_key_and_hex ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 13.53s

     Running tests/p6_m16_rules.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m16_rules-33e7267e34428bc9)

running 15 tests
test can_add_food_layer_matches_web ... ok
test forest_blocking_and_hints_match_web ... ok
test farm_and_owce_base_terrain_match_web ... ok
test deposit_rules_match_web ... ok
test hex_has_road_matches_web ... ok
test improvement_meta_and_tech_gate_match_web ... ok
test format_impact_list_matches_web ... ok
test hex_keys_within_radius_matches_web ... ok
test legacy_farm_layer_and_strip_match_web ... ok
test livestock_dependency_matches_web ... ok
test mine_keys_tarasy_civ_and_food_keys_match_web ... ok
test plan_and_remove_legacy_farms_match_web ... ok
test replaced_by_build_and_impact_match_web ... ok
test strip_improvements_when_forest_removed_matches_web ... ok
test work_cost_scale_matches_web ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.87s

     Running tests/p6_m16_tables.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m16_tables-fd1582fd8a835964)

running 5 tests
test food_and_sector_tables_are_consistent ... ok
test livestock_and_tech_tables_are_consistent ... ok
test terrain_codes_in_tables_are_valid ... ok
test improvement_build_has_no_balance_number_literals ... ok
test rule_keys_are_known_improvements ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/p6_m17_rebuild.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m17_rebuild-60f4b8705aae281a)

running 5 tests
test js_keyed_map_orders_array_index_keys_first ... ok
test rebuild_errors_name_the_failing_field ... ok
test rebuild_error_class_matches_web_failure_class ... ok
test serialize_rebuild_serialize_is_stable_without_duplicate_coords ... ok
test rebuild_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.39s

     Running tests/p6_m17_serialize.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m17_serialize-bc527bf55aa676f5)

running 5 tests
test js_num_writes_integers_without_fraction_and_non_finite_as_null ... ok
test serialize_vectors_touch_every_branch ... ok
test serialize_text_is_byte_identical_to_web_json_stringify ... ok
test snapshot_shape_invariants_hold_for_every_vector ... ok
test serialize_matches_web_structurally ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.34s

     Running tests/p6_m17_validate.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/p6_m17_validate-f52da1b0e7422d55)

running 2 tests
test is_valid_matches_web_for_all_vectors ... ok
test every_serialize_vector_snapshot_has_a_web_validity_vector ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.30s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test canonical_state_dto_vector_round_trips_through_json ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test public_engine_wire_aliases_are_stable ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test multiple_layers_stack_additively_per_resource ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test copied_state_and_forks_reproduce_independent_streams ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/road_movement_multipliers.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/road_movement_multipliers-10cca6a7ed28e576)

running 3 tests
test road_floor_row_is_readable_and_positive ... ok
test road_divisors_are_integers_read_from_the_table ... ok
test road_movement_table_covers_each_constant_once ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test canonical_state_round_trips_through_serde ... ok
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/structure_defense_max.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/structure_defense_max-97cd066d284c179b)

running 3 tests
test combined_structures_equal_the_strongest_single_structure ... ok
test no_structure_gives_neutral_multiplier ... ok
test structures_are_ignored_outside_siege ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test diff_and_serialization_preserve_route_contract ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_72c1135f-cb2-1/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 6 tests
test current_and_previous_epochs_are_available ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test p6_1_civ_entry_api_is_exercised ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### 11.4 `git diff --cached --check` (indeks po jawnym `git add` plikow tematu; `gate-diffcheck-r1.log`)

```text
git diff --cached --check (staging: src/domain/{state,terrain}.rs, data/derived.rs, 4 tabele JSON, tests/p6_6a_*, wektory, artefakty runu)
brak ostrzezen
EXIT=0
```

### 11.5 Weryfikator Python (`verify-p66a-r1.log`)

```text
sprawdzen=14808 rozbieznosci=0
EXIT=0
```

### 11.6 Testy negatywne weryfikatora (`dowody/verify-negative-r1.txt`, `dowody/verify-negative-tables-r1.txt`)

```text
ROZBIEZNOSC pick[3].id: py=None json='zly-id'
ROZBIEZNOSC evaluate[5].kp: py=0.0 json=21.0
ROZBIEZNOSC clear[0]: py={'teren': 'laka', 'nakladka': 'brak', 'ulepszenie': 'brak', 'ulepszenia': None, 'zloze': None, 'improvementKey': None, 'rzeka': False} json={'teren': 'laka', 'nakladka': 'las', 'ulepszenie': 'brak', 'ulepszenia': None, 'zloze': None, 'improvementKey': None, 'rzeka': False}
ROZBIEZNOSC revolt[0]: py=1.0 json=2.0
ROZBIEZNOSC at[0]: py=[] json=['9,9']
sprawdzen=14789 rozbieznosci=5
EXIT=1

ROZBIEZNOSC tabela ai_source_min_pop vs TS: py=2 json=3.0
ROZBIEZNOSC tabela zostaje_ulepszenia vs TS: py=['farma', 'bydlo', 'owce', 'lama', 'stadnina', 'pastwisko', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_zlota', 'kopalnia_cyny', 'kamieniolom', 'glinianka', 'warzelnia_soli', 'droga_brukowana'] json=['farma', 'bydlo', 'owce', 'lama', 'stadnina', 'pastwisko', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_zlota', 'kopalnia_cyny', 'kamieniolom', 'glinianka', 'warzelnia_soli', 'droga', 'droga_brukowana']
ROZBIEZNOSC tabela prog_obca_kultura vs TS: py=0.4 json=0.5
ROZBIEZNOSC tabela budynki_kulturalne vs TS: py={'hasAmfiteatr': ['akademia'], 'hasBiblioteka': ['biblioteka'], 'hasPalac': ['palac', 'palac_ii', 'palac_iii'], 'hasStela': ['stela'], 'hasSad': ['sad'], 'hasLaznia': ['laznia_publiczna']} json={'hasAmfiteatr': ['teatr', 'akademia'], 'hasBiblioteka': ['biblioteka'], 'hasPalac': ['palac', 'palac_ii', 'palac_iii'], 'hasStela': ['stela'], 'hasSad': ['sad'], 'hasLaznia': ['laznia_publiczna']}
ROZBIEZNOSC tabela fog_explored_brightness vs TS: py=0.2 json=0.175
sprawdzen=14808 rozbieznosci=5
EXIT=1
```

### 11.7 Literaly w nowych modulach (`dowody/grep-literals-r1.txt`)

Wszystkie trafienia liczbowe to elementy STRUKTURALNE (0 / 1 neutralne, `+ 1` progu minimalnej ludnosci zrodla, krok petli 1.0, domyslny `ownerId` gracza = 0, `ownerId > 0` = AI jak w webie); liczby balansowe (20 / 1 / 3 / 0.5 / 1.5 / 5 / 0.175 / 3) i teksty sa w tabelach JSON.

```text
# Literaly liczbowe i napisowe w modulach P6.6A (state.rs, terrain.rs); komentarze pominiete
# Klasyfikacja: STRUKTURALNY = elementy neutralne/semantyka JS (0.0, 1.0, `+ 1.0`, krok petli, identyfikatory pol has*,
# format cudzyslowu szablonu), nie dane ani mnozniki balansu. Dane: data/derived/*.json, data/miasto-params.json.
## src/domain/state.rs od linii 193
247: nums=[] strs=['miasto-params.json must parse'] | let miasto = parse_miasto_params().expect("miasto-params.json must parse");
272: nums=[] strs=['{{{name}}}'] | out = out.replace(&format!("{{{name}}}"), value);
307: nums=['0'] strs=[] | let min_pop = if owner_id > 0 {
308: nums=['1.0'] strs=[] | js_max(pop_cost + 1.0, params.ai_source_min_pop)
310: nums=['1.0'] strs=[] | pop_cost + 1.0
327: nums=['1'] strs=[] | if tied.len() == 1 {
328: nums=['0'] strs=[] | return Some(tied[0]);
331: nums=['1.0'] strs=[] | let idx = crate::domain::recruitment::army_merge::js_min(len - 1.0, (rand() * len).floor());
332: nums=['0.0'] strs=[] | if idx.is_nan() || idx < 0.0 {
358: nums=['0.0'] strs=[] | let koszt_praca = if first_free { 0.0 } else { params.work_cost };
360: nums=['0.0'] strs=[] | 0.0
370: nums=[] strs=['koszt'] | &[("koszt", js_number_to_string(koszt_praca))],
390: nums=['0'] strs=[] | let min_needed = if owner_id > 0 {
391: nums=['1.0'] strs=[] | js_max(koszt_ludnosc + 1.0, params.ai_source_min_pop)
393: nums=['1.0'] strs=[] | koszt_ludnosc + 1.0
399: nums=[] strs=['koszt'] | &[("koszt", js_number_to_string(min_needed))],
442: nums=['0.0'] strs=[] | 0.0
447: nums=['0.0'] strs=[] | 0.0
457: nums=[] strs=['koszt'] | &[("koszt", js_number_to_string(koszt_praca))],
464: nums=['1.0'] strs=[] | if !first_city_free && source_city_population - koszt_ludnosc < 1.0 {
469: nums=[] strs=['koszt'] | &[("koszt", js_number_to_string(koszt_ludnosc))],
508: nums=[] strs=['praca'] | ("praca", js_number_to_string(params.work_cost)),
509: nums=[] strs=['ludnosc'] | ("ludnosc", js_number_to_string(params.population_cost)),
558: nums=['0.0', '1.0'] strs=[] | js_max(0.0, js_min(1.0, x))
585: nums=['1.0'] strs=[] | .unwrap_or(1.0),
587: nums=['1.0'] strs=[] | let share = clamp01(1.0 - prev);
626: nums=[] strs=['hasAmfiteatr'] | "hasAmfiteatr" => out.has_amfiteatr = present,
627: nums=[] strs=['hasBiblioteka'] | "hasBiblioteka" => out.has_biblioteka = present,
628: nums=[] strs=['hasPalac'] | "hasPalac" => out.has_palac = present,
629: nums=[] strs=['hasStela'] | "hasStela" => out.has_stela = present,
630: nums=[] strs=['hasSad'] | "hasSad" => out.has_sad = present,
631: nums=[] strs=['hasLaznia'] | "hasLaznia" => out.has_laznia = present,
647: nums=[] strs=['hasSwiatynia'] | "hasSwiatynia" => out.has_swiatynia = present,
648: nums=[] strs=['hasKamienneKregi'] | "hasKamienneKregi" => out.has_kamienne_kregi = present,
690: nums=['1.0'] strs=[] | if share < 1.0 {
692: nums=['0.0'] strs=[] | kultura_skumulowana: 0.0,
718: nums=['0.0'] strs=[] | religion_converted: 0.0,
729: nums=['0.0'] strs=[] | 0.0
739: nums=['0.0'] strs=[] | 0.0
748: nums=['0.0'] strs=[] | if garnizon_count > 0.0 {
749: nums=['1.0'] strs=[] | return 1.0;
752: nums=['1.0'] strs=[] | return 1.0;
778: nums=[] strs=['map-gen-params.json must parse'] | .expect("map-gen-params.json must parse")
789: nums=['0.0'] strs=[] | if value > 0.0 {
878: nums=['1.0'] strs=[] | dr += 1.0;
880: nums=['1.0'] strs=[] | dq += 1.0;
1019: nums=['0.0'] strs=[] | let sight = city_sight_radius(c.population, c.kultura.unwrap_or(0.0), border_radius);
1020: nums=['0.0'] strs=[] | if sight <= 0.0 {
1044: nums=['0'] strs=[] | let player = player_owner_id.unwrap_or(0);
## src/domain/terrain.rs od linii 449
# linii z literalami: 49
```
