STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-SURRENDER-Q1 (W8 podzial 3/3), obrona Operatora runda 2
GOAL: port do Rust resolveSiegeSurrender i handleSiegeCapitulationPhase jako czyste funkcje wolane z wyniku siege_city_turn; wektory z pinu; test behawioralny dla pieciu scenariuszy.
ZMIANY/COMMIT: lokalny commit na R-RUSTPORT-P6-SIEGE-SURRENDER-Q1-wip/operator-r2 (baza: c9c21bb98 = Operator r1). SHA: patrz sekcja "SHA" na dole. Nie pushowano, nie integrowano. Allowlista: rust-port/engine/src/domain/siege_surrender.rs, rust-port/engine/tests/p6_siege_surrender.rs, rust-port/engine/tests/p6_siege_surrender_gen.mjs, rust-port/engine/tests/p6_siege_surrender_vectors/vectors.json, dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-SURRENDER-Q1/02a-obrona.md. Bez Cargo.lock, bez gra/, bez mod.rs (modul juz zadeklarowany w r1).
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --lib EXIT 0 (48 passed); cargo test --test p6_siege_surrender EXIT 0 (10 passed). Generator: node tests/p6_siege_surrender_gen.mjs <main.ts@pin> <units/setup.ts@pin> daje bajtowo identyczny vectors.json (cmp). Pliki pinu wyciagniete przez git show 07d2fbd72 do katalogu scratchpad, poza repo. Cargo.lock wygenerowany przez cargo i nie commitowany; CARGO_TARGET_DIR poza repo.
BLOKADY: patrz "Odpowiedzi na zarzuty" pozycja 1 (zakres czesciowy wymaga decyzji orkiestratora).
RUNDY: 2/5 (obrona Operatora po FAIL/PASS-WITH-NOTES Evaluatora r1)
NASTEPNY KROK: decyzja orkiestratora: (a) zaakceptowac zakres r2 (predykaty, linker, besieger, wektory wykonane) i przeniesc galaz Transfer do osobnego tematu Q2 po W8 1/3 i W8 r3; albo (b) ponowic temat z pelna kompozycja galezi Transfer w tym temacie.
DEPLOY/PUSH: NIE WYKONANO

---

## Odpowiedzi na zarzuty

### 1. GOAL niespelniony (brak skutkow kapitulacji) - PRZYJMUJE CZESCIOWO
Zarzut prawdziwy: zadna funkcja nie zmienia `city.ownerId`, galaz Transfer nie jest wykonywana. Dodane w r2: `besieger_owner_for_city`, `surrender_tick_action` (lacznik), `resolve_surrender_path`, `transfer_removal_ids`, `end_map_siege_fields`, `surrender_population_after`, `handle_siege_capitulation_phase`. Skutki przejecia (populacja, wojna, cuda, raporty, kolejka, racje, pola stolicy) NIE zostaly zlozone w funkcje; tabela w naglowku `siege_surrender.rs` pokazuje, ktore sa BRAK i ktore ISTNIEJA (patrz 2). Nie zrobiono tego w tej rundzie, bo kompozycja wymaga zaleznosci BRAK (applyCapturePopulationLoss, wonder transfer, runCapitalCapturePlunder, noteCityCapture, recordCityCaptureEvent, applyLiveSafeRationForCity) i decyzji o ich zakresie. Proponuje decyzje: Q2 (kompozycja Transfer) po W8 1/3 i W8 r3, albo zaakceptowanie zakresu czesciowego jako wejscia do W8 r3.

### 2. Blokada "brak tych modulow w Rust" jest niezweryfikowana - PRZYJMUJE (korekta blokady)
Zarzut prawdziwy: grep po `rust-port/engine/src` znajduje istniejace klocki: `sanitize_build_queue` (production_queue.rs:206), `filter_queue` (production_queue.rs:288), `clear_city_state_flag_on_capture` (state.rs:1252), `apply_post_capture_law_override` (order_effects_lane.rs:194), `tick_rebel_protection_end_of_turn` (order_effects_lane.rs:171, inna funkcja niz triggerRebelProtectionWarConsequence), `record_war_city_loss` (diplomacy_war_peace_profile.rs:470), `register_regular_war_city_loss` (war_turn_declare.rs:385), `siege_defender_units` (siege_starvation.rs:220). Tabela web -> Rust jest w naglowku `siege_surrender.rs` (kolumna "stan"). Zgodnosc semantyczna pozycji ISTNIEJE/ISTNIEJE? NIE zweryfikowana. Pozycje BRAK zweryfikowane grepem po nazwie: applyCapturePopulationLoss, beginWonderTransferWatch, settleWonderTransfer, noteCityCapture, runCapitalCapturePlunder, recordCityCaptureEvent, capturePopLossReportRow, applyLiveSafeRationForCity.

### 3. Brak besiegerOwnerForCity - PRZYJMUJE (port)
Dodano `besieger_owner_for_city(city, stored, units)` (kolejnosc: oblegajacyOwnerId, siegeBesiegerByCity, sasiad hexDistance==1 z pierwszej obcej jednostki w kolejnosci wejscia). Wektory: 40 przypadkow z WYKONANIA `besiegerOwnerForCity` i `hexDistance` z pinu (main.ts:17634, units/setup.ts:361). Zalozenie Z-SU-4: wspolrzedne heksowe `i64`. Dodany test jednostkowy i wektorowy.

### 4. Wektory tautologiczne, generator to transkrypcja - PRZYJMUJE (przebudowa generatora)
Zarzut trafny. Generator nie transkrybuje juz logiki: wycina po nazwie z pliku pinu (`extractFn`, od deklaracji do domykajacego nawiasu o tym samym wciecie), zdejmuje typy przez `node:module.stripTypeScriptTypes` i wykonuje w `with` na Proxy. Nieznany identyfikator nie jest cichym stubem: staje sie wywolaniem zapisanym w logu. Galaz resolveSiegeSurrender jest klasyfikowana z logu wywolan pinu (`showHintMessage` -> noCaptor, `areEnemyOwners` -> notEnemy, sentinel `Stop` w `enterCityAfterSurrender` -> transfer, brak obu -> noCity). Oczekiwania: branch, splice (usuniete id), `city.population` po `Math.max(1, ...)`, pola `endMapSiege`. Reprodukowalnosc: drugi przebieg daje bajtowo ten sam plik (cmp). OGRANICZENIE (do zapisu w raporcie): wykonanie zatrzymuje sie na `enterCityAfterSurrender`, wiec wektory NIE obejmuja skutkow po tym punkcie; atrapy dla identyfikatorow spoza `vars` zwracaja undefined (zarejestrowane w logu, nie ma logiki weba w atrapie).

### 5. Slabe asercje - PRZYJMUJE (wszystkie trzy podpunkty)
(a) `vectors_end_and_population_match_pin`: asercje ida teraz z pola `expect` wektora (wczesniej zahardkodowane).
(b) Closure `are_enemy` w tescie path: usunieta regula `a==9 || b==9` i `a==b`. Tablica par z pinu (wlacznie z 9) jest jedynym zrodlem. Brak pary = panic.
(c) `scenario_attrition_without_surrender_holds_city`: asercja o SetPending usunieta; teraz `surrender_tick_action(d, ...) == None` (web nie wola faz, gdy setLegacyPending = false i surrenderNow = false).
Dodatkowo: scenariusz tick 2 przepisany wg kodu pinu: po ustawieniu flagi `siegeStarvationState` zwraca surrender (nie legacy), wiec lacznik daje `Surrender`. Galaz `CapitulationPhase(Resolve)` jest w tym przeplywie nieosiagalna - web ma ja dla zgodnosci, a test to dokumentuje.

### 6. Brak lacznika decyzja -> akcja - PRZYJMUJE
Dodano `surrender_tick_action(&SiegeTurnDecision, pending, food) -> SurrenderTickAction` (None / CapitulationPhase(...) / Surrender), odwzorowujacy web main.ts:38864-38868 (legacy ma pierwszenstwo, `else if surrenderNow`). Dokumentacja: wolac po decyzji, PRZED `next_siege_turn`. Testy: `linker_none_without_decision`, `linker_legacy_routes_to_phase_and_surrender_to_resolve`, scenariusze tick 1/tick 2. Podpiecie do petli tury pozostaje zalezne od W8 r3 (zgodnie z dispatchem).

### 7. end_map_siege_fields: Some(false)/None - ODRZUCAM (dowod)
Czytelnicy po stronie Rust: `siege_starvation.rs:134` (`oblegane != Some(true)`), `:146` (`siege_capitulation_pending == Some(true)`), `:159` (`siege_starve_start_max_hp.filter(|s| *s > 0.0)`). Zadna sciezka nie rozroznia `Some(false)` od `None`. Po stronie web: `!city.oblegane` / `city.siegeCapitulationPending` (prawdziwosc), `cities.filter(c => c.oblegane === true)` (main.ts:13141), `typeof number && > 0` dla startu. `false` i `undefined` (po `delete`) daja tu ten sam wynik. Uwaga dodana w komentarzu funkcji `end_map_siege_fields`. Wektory `ends` potwierdzaja: web `delete` -> null w wektorze, Rust `None`.

## Zalozenia (nowe i stare)
* Z-SU-1..3: bez zmian (opisane w naglowku).
* Z-SU-4 (nowe): wspolrzedne heksowe `i64` (dane gry: calkowite).

## Co NIE zostalo zmierzone
* Zachowania web w przegladarce (test na zywo) - NIE_ZMIERZONO.
* Skutki po `enterCityAfterSurrender` w pinie - NIE_ZMIERZONO (wektory konczy sentinel).
* Pelna galaz Transfer w Rust - NIE ZROBIONO (pozycja 1).

## Dysk i sprzatanie
* Przed startem r2: `df -h /` pokazal 11 GB wolnego (wczesniej 5.4 GB; nie startowalem bez tego).
* CARGO_TARGET_DIR w scratchpad (poza repo); usuwany po zakonczeniu bramek.
* Cargo.lock wygenerowany przez cargo i usuniety przed commitem.
