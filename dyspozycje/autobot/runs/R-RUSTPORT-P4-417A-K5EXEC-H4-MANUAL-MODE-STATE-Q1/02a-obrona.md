STATUS: PASS-WITH-NOTES (Obrona r2: zarzuty 1, 2 i 5 PRZYJETE i naprawione z dowodem; 3 i 4 ODRZUCONE jako zakres r3/czesc B z dowodem; 6 = potwierdzenie bez zarzutu)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-417A-K5EXEC-H4-MANUAL-MODE-STATE-Q1
GOAL: tryb reczny gracza w ciele bitwy (czesc A): stan, wykonanie rozkazow, kolejka; dowod = wektory kroku z wykonania tekstu pinu 07d2fbd72
ZMIANY/COMMIT: baza = `18ce876be` (galaz `rust-port-wip/417a-r2-eval`). Zmieniono WYLACZNIE pliki testowe i raport: `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (+25), `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/manual_body_step_vectors.json`, `rust-port/engine/tests/p4_417a_manual_body_vectors.rs`, ten raport. Kod produkcyjny (`siege_prod_manual.rs`, `siege_tactics_loop.rs`, `player_order_attack.rs`) BEZ zmian (mutanty przywrocone, `git status` czysty poza wymienionymi plikami). SHA commitu: patrz koncowa odpowiedz.
TESTY: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0 (przed ostatnim przebiegiem `cargo fmt`, ktory zmienil tylko uklad kodu testu); `p4_417a_manual_body_vectors` 2 passed (1470/1470 przypadkow; marsz atomowy na WSZYSTKICH przypadkach bez `none`); `p4_417a_manual_mode_state` 41 passed. Pelny `cargo test --all-targets` NIE uruchamiany w tej rundzie obrony (zmiany tylko w jednym pliku testowym i wektorach; kod produkcyjny identyczny z pelnym biegiem Evaluatora: 4432 passed, 0 failed). Straznik SHA-256 pinu `3eeeb760bc0efdbb8108ac3dcf36efe5a202a8f1bec5583ede354abc0d4da34d` bez zmian (nowy blok w tym samym trybie `WIRING_A_MANUAL_BODY_STEPS`, zaden istniejacy tryb nie ruszony). MD5 wektorow: bylo `59e325fda1f0b3e5bbf20185e613f4ea` (1410 przypadkow), jest `4712cb66e49c6d2f546df66edbaa4f0e` (1470; 1410 dotychczasowych przypadkow identycznych co do tresci, doszly pola `unitsAfter`/`occSize` w `expect` i 60 przypadkow nowego wariantu).
BLOKADY: brak
RUNDY: obrona po r2 (rundy Operatora zuzyte: 2/5)
NASTEPNY KROK: Final Control r2; potem r3 (oblezenie reczne + kolejka `execute_units_immediate`)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 (cel = pozycja takze dla `attack`: 0 przypadkow) — PRZYJMUJE, naprawione
Zarzut slusny: wariant jest osiagalny (cel `removed`, ktorego `attack` nie filtruje, `:18397`, stojacy na polu aktora; layout `used` go nie konstruuje). Poprawka: generator (blok `WIRING_A_MANUAL_BODY_STEPS`) po sekcjach muru dodaje dla kazdej z 3 baz po 20 przypadkow `attack`, w ktorych cel (`removed` x2, `routed`, `dead`, `fadingOut`) jest ustawiany na polu aktora, bez wpisu w `occByKey`. Osobny strumien RNG (ziarno `0x417a0000 + baza`, glowne ziarno przywracane), wiec wszystkie 1410 dotychczasowych przypadkow zostalo tresciowo identycznych (sprawdzone skryptem: 0 brakujacych po odjeciu nowych pol `expect`).
Dowod: 60 nowych przypadkow, 0 rozbieznosci pin == Rust. Rozklad wyniku pinu: `removed` na polu aktora -> `move` (31 przypadkow: pin wyprowadza aktora z pola celu, bo `_canStrikeTargetFrom` wymaga `dd >= 1`), `dead`/`fadingOut`/`routed` -> `done` (29, rozkaz zdjety). Nowe asercje pokrycia: `attack/cel-pozycja >= 50`, `attack/cel-pozycja-removed >= 20`, `-routed >= 5`, `-dead >= 5`, `-fadingOut >= 5` (tag `attack/cel-pozycja-<flaga>` w `tags_of`).
Mutant dowodzacy czulosci, na pliku produkcyjnym `siege_tactics_loop.rs:8312` (`can_strike_from`: `dd >= 1` -> `dd >= 0`): ZABITY (31 rozbieznosci, m.in. `attack` "rodzaj attack != pin move"); plik przywrocony.

### Zarzut 2 (stan pozostalych jednostek i `occByKey` nie porownywane) — PRZYJMUJE, naprawione; porownanie ujawnilo roznice atrapy
Generator zapisuje teraz w `expect` `unitsAfter` (dla kazdej jednostki obu rosterow `[q, r, czy occByKey na jej polu wskazuje te jednostke]`) i `occSize`; test Rust buduje to samo z ciala (`units_after_of`, `occ_by_key()`) i porownuje w `diff`.
Pierwszy bieg po dodaniu porownania dal 15 rozbieznosci, wszystkie w przypadkach `none` z doktryna AUTO, w ktorych cialo wykonuje cios. Przyczyna zdiagnozowana (nie "poprawka na sile"): pin stubuje `_doAttack` (brak obrazen), a produkcyjne cialo wykonuje prawdziwy cios i kontratak, po ktorym zabity lub uciekly uczestnik ciosu traci zajetosc pola (`sync_occupancy`: `routed`/`removed`; `dead` analogicznie). To roznica atrapy generatora, nie decyzji. Regula w tescie: pozycje wszystkich jednostek MUSZA byc identyczne; zajetosc moze sie roznic WYLACZNIE dla uczestnika ciosu wykonanego w tej aktywacji (cel albo atakujacy po kontrataku), ktory w Rust jest `dead`/`routed`/`removed`, a `occSize` rozni sie dokladnie o liczbe takich jednostek. Wynik: 1470/1470 zgodnych (w tym tamte 15). Dla przypadkow bez ciosu ciala (ruch, hold, rozkazy reczne) zajetosc i pozycje musza byc identyczne bez wyjatkow.
NIE_ZMIERZONO: flagi `dead`/`routed` pozostalych jednostek po aktywacji z ciosem (pin ich nie zmienia, bo stub); skutek ciosu ciala pokrywaja osobne wektory K5I/K5LOOP.

### Zarzut 3 (`none` z doktryna AUTO tylko piechota wrecz; kolejne kroki marszu po pierwszym) — ODRZUCAM jako zakres tej rundy, jawnie NIE_ZMIERZONO
Zakres r2 w dispatchu: jedna aktywacja (`_activateUnit`) dla `hold`/`none`/`move`/`attack`/`attackMove`. Doktryna strzelca, jazdy i falangi to osobne klocki K5DOC (T5a/T5b/T6/T7), jeszcze nie wykonywane w ciele; pin zwraca tam akcje, ktorych cialo nie wykonuje, wiec porownanie byloby porownaniem z brakujacym portem. Kolejne kroki marszu doktryny (`_schedule(STEP_GAP_MS)`) to osobne wywolania pinu i nie sa domykane w tym tescie (komentarz w tescie). NIE_ZMIERZONO, czesc B (#422).

### Zarzut 4 (mur sceny tylko dla `move`; oblezenie reczne, kolejka, `_siegeSafeApproach`, blokada generala) — ODRZUCAM (zgodne z zakresem), mapa r3
Dispatch r2 pkt 3 wprost: "wariant przy murze = r3"; oblezenie reczne atakujacego (`_performSiegeManualOrder`: ram_tower/tower_climb/infantry_to_tower, `_siegeSafeApproach`) i kolejka `execute_units_immediate` = r3; blokada generala = czesc B (D-417A-7). W r2 pokryte: mur dla `move` i wszystkich rozkazow obroncy (warianty `+mur`).

### Zarzut 5 (progi pokrycia niskie, marsz atomowy na podzbiorze) — PRZYJMUJE, naprawione
Progi podprzyczyn podniesione do wartosci bliskich faktycznym: `attack/cel-routed >= 20` (bylo 5, faktycznie 25), `attack/cel-removed >= 12` (bylo 5, faktycznie 15), `attack/cel-fadingOut >= 13` (bylo 5, faktycznie 17). Marsz atomowy (`march_incremental = false`) sprawdzany teraz na WSZYSTKICH przypadkach bez `none` (asercja >= 1000, bez probkowania co czwartego, wczesniej 284), 0 rozbieznosci. `none` pozostaje poza porownaniem atomowym (marsz wielokrokowy doktryny, jak w zarzucie 3).

### Zarzut 6 (bramki odtworzone, mutanty 13/16) — brak zarzutu; potwierdzam stan
Mutanty z r2 (13 zabitych + 3 rownowazne E5/E6/E14) nienaruszone. Dodatkowo w tej rundzie na plikach produkcyjnych (wszystkie przywrocone):
- `siege_tactics_loop.rs:8312` `dd >= 1` -> `dd >= 0`: ZABITY (31 rozbieznosci, glownie nowy wariant).
- `player_order_attack.rs:221` usuniety filtr `!u.routed` w `enemies_of`: ZABITY (32 rozbieznosci).
- `player_order_attack.rs:334` usuniety `!u.fading_out` w wyszukiwaniu celu `attack`: PRZEZYL, ROWNOWAZNY (ten sam predykat `!u.dead && !u.fading_out` jest juz w `enemies_of` `:221`, z ktorego `find` czerpie kandydatow, wiec warunek w `:334` jest nadmiarowy).

## Lista NIE_ZMIERZONO po obronie r2
- Skutek ciosu ciala (smierc/rout celu, kontratak) na stan jednostek: poza atrapa pinu (K5I/K5LOOP).
- `none` z doktryna strzelca/jazdy/falangi i kolejne kroki marszu doktryny: K5DOC T5a/T5b/T6/T7 i czesc B.
- Oblezenie reczne atakujacego, `_siegeSafeApproach` przy murze, kolejka `execute_units_immediate`: r3.
- Blokada generala i bitwy w czasie rzeczywistym z rozkazem gracza: czesc B (#422).
- Pelny `cargo test --all-targets` po zmianach obrony: nie uruchomiono (patrz TESTY).

## Dysk
Bramki liczone na istniejacym katalogu `/home/user/cargo-target-k5doc-eval` (stary cache zakonczonego tematu K5DOC, brak procesow cargo), bo wolne miejsce wynosilo 7,3 GB (< 8 GB) i nowy target sie nie miescil; katalog nie zostal usuniety (nie jest moj), poza artefaktami budowania tego testu.

---
# Poprzednia obrona (r1), zachowana dla historii

STATUS: PASS-WITH-NOTES (Obrona r1: zarzuty 3, 4 i część 2 przyjęte i naprawione; zarzuty 1 i część 2 dot. wektorów kroku przyjęte, NIENAPRAWIONE w tej rundzie — wymagają rundy 2 Operatora)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-417A-K5EXEC-H4-MANUAL-MODE-STATE-Q1
GOAL: tryb ręczny gracza w ciele bitwy (część A): stan, wykonanie rozkazów, kolejka; dowód = wektory kroku z wykonania tekstu pinu 07d2fbd72
ZMIANY/COMMIT: tylko `rust-port/engine/tests/p4_417a_manual_mode_state.rs` (+284 linii, 10 nowych testów) i ten raport. Kod produkcyjny (`siege_prod_manual.rs`, `siege_tactics_loop.rs`) BEZ zmian względem `72aa1f21d` (potwierdzone `git diff`). Baza `617185ba8` jest przodkiem. Brak `#[ignore]` (0).
TESTY: `cargo test --test p4_417a_manual_mode_state` 41/41 (było 31); `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0. Pełny `cargo test --all-targets` NIE ponawiany: zmiana wyłącznie w pliku testowym, kod produkcyjny identyczny z ocenionym (Evaluator: 562 sekcje, 4420 passed, 0 failed).
BLOKADY: wektory kroku z wykonania pinu dla ciała (kryteria 2/3/4) niedostarczone; patrz zarzut 1
RUNDY: obrona r1; wymagana runda 2 Operatora (zarzut 1)
NASTĘPNY KROK: runda 2 Operatora wg zakresu z zarzutu 1; ponowny Evaluator
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 — brak wektorów KROKU z wykonania pinu dla ciała (kryteria 2/3/4): PRZYJMUJĘ, bez poprawki w tej rundzie
Zarzut jest trafny; Operator sam zapisał to w NIE_ZMIERZONO pkt 1. Nie odrzucam i nie udaję poprawki. Dlaczego nie naprawiam tu: wektor „body-level” wymaga nowego trybu generatora (`p6_k5loop_wiring_a_gen.mjs`, 2394 linii; strażnik SHA-256 `3eeeb760…` musi pozostać, więc tryb za flagą środowiska) wykonującego `_performPlayerOrder` / `_executeUnitsImmediate` pinu na scenie oraz konsumenta Rust, który odtworzy z migawki pinu pełne `ProdBody` (typy i statystyki jednostek dla `_priorityScore`, teren/przejezdność z `impassableBy`, zajętość, doktryny i `_groupMeta`, mur). Tego nie da się wiarygodnie dowieść w rundzie obrony; wymaga rundy 2 Operatora.
Proponowany zakres rundy 2 (do dispatchu DODATEK r2):
1. Nowy tryb generatora (np. `WIRING_A_MANUAL_BODY_VECTORS`) na wzór `WIRING_A_ATTACK_ORDER_STEPS` (generator `:1721-…`, stuby `_doMove`/`_doAttack`/`_refreshQueuedOrderVisuals`), ale z WYKONANIEM `_activateUnit` (`:6048-6112`) dla jednostki gracza w `_manualMode`, z zapisem: `ret`, `kind`/`step`/`attack`, `playerOrder` po, `acted`, `lastAutoMoveFrom`; osobno `_executeUnitsImmediate` (`:18578-18614`: busy-gate, `acted`, filtr `dead/removed/routed/acted/queued`).
2. Rodzaje rozkazów: `hold`, `none` (z/bez doktryny AUTO), `move`, `attack`, `attackMove`, oblężenie ręczne (`_performSiegeManualOrder`) — ze scenami z murem (ścieżka `ApproachSafe`), dzięki czemu powstaje porównanie `fx` `_siegeSafeApproach` z pinem (kryterium 2: wynik liczony portem `siege_safe_approach_goal` w ciele vs wynik z wykonania pinu, nie z `PinTargets`).
3. Progi pokrycia rozbite na podprzyczyny: `dead`, `fadingOut`, `routed`, `removed`, cel = pozycja (także `attack`), z asercją liczników w teście Rust (wzorzec `K5I2B2-POKRYCIE`).
4. Konsument Rust w nowym pliku testowym; budowa `ProdBody` z migawki wymaga rozstrzygnięcia, jak odwzorować statystyki jednostek pinu (ryzyko: `priority_score_cmb` czyta klasę jednostki).
Uwaga dla orkiestratora: zakres jest duży (reszta budżetu ~3 h); rozważ podział na 417A-r2 (wektory kroku dla `hold/none/move/attack/attackMove`) i 417A-r3 (oblężenie ręczne + `fx` `_siegeSafeApproach` + kolejka).

### Zarzut 2 — brak porównania `fx` `_siegeSafeApproach` z pinem i progów pokrycia rozbitych na podprzyczyny: PRZYJMUJĘ, CZĘŚCIOWO NAPRAWIONE
- Progi pokrycia rozbite na podprzyczyny na poziomie ciała: NAPRAWIONE testami `attack_cele_martwy_znikajacy_uciekajacy` (trzy podprzyczyny `dead`, `fadingOut`, `routed` — rozkaz zdjęty, brak ruchu i ciosu) i `attack_move_cel_rowny_pozycji` (cel = pozycja dla `attackMove`; dla `move` istniał `move_na_celu_zdejmuje_rozkaz_i_nic_nie_robi`). `removed` i cel = pozycja dla `attack` (cel `attack` nie ma współrzędnych; w pinie to wróg stojący na polu — pokryte przez `attack` na sąsiada) pozostają do wektorów rundy 2. Są to testy ręczne, NIE wektory z wykonania pinu (patrz zarzut 1) — nie zamykają kryterium 4 w sensie dispatchu.
- `fx` `_siegeSafeApproach` vs pin: NIEZAMKNIĘTE, wchodzi do rundy 2 (pkt 2 zakresu powyżej). Obecny stan zgodny z raportem Operatora: predykat liczony portem Rust, porównanie z pinem NIE_ZMIERZONO.

### Zarzut 3 — mutanty (kryterium 5): PRZYJMUJĘ i NAPRAWIAM
Cztery żywe mutanty Evaluatora na pliku produkcyjnym `siege_prod_manual.rs` zabite nowymi testami (mutacja zapisana w pliku produkcyjnym, `cargo test --test p4_417a_manual_mode_state`, plik przywracany po każdym mutancie; `git status` po serii: czysty poza plikiem testowym):

| Mutant | Zmiana | Wynik | Zabija |
|---|---|---|---|
| M4 | `BlockadeBlocked`: `order_done.then_some(None)` → `None` | ZABITY (40 pass, 1 fail) | `run_of_move_tlumaczy_wszystkie_decyzje` |
| M8 | `side_ix`: `Defender => 1` → `0` | ZABITY | `obronca_jako_gracz_ma_wlasne_rozkazy` (rozkazy A0 i D0 rozłączne, obrońca wykonuje własny rozkaz) |
| M11 | `WalkwayStrike` → zawsze `Done` | ZABITY (39 pass, 2 fail) | `run_of_siege_tlumaczy_wszystkie_decyzje` + `oblezenie_pomost_z_sasiadem_uderza` |
| M12 | `RamTower{handled}` → `None` | ZABITY | `run_of_siege_tlumaczy_wszystkie_decyzje` |

Dodatkowo, żeby nie poprzestać na czterech: M13 (`Climb`→Done), M14 (`InfantryToTower`→Done), M15 (`ApproachClear` bez zdjęcia rozkazu), M16 (`ReachedTarget` bez zdjęcia rozkazu) — wszystkie ZABITE. Łącznie nowe mutanty tej rundy 8/8 zabite; z 22 mutantami Operatora (M01–M22, wszystkie zabite) i 12 Evaluatora (7 zabitych + 4 teraz zabite + M10 nie kompiluje, a więc nieistotny) kryterium 5 jest spełnione na pliku produkcyjnym.
Uwaga o M4: gałąź `BlockadeBlocked` w ciele jest NIEOSIĄGALNA przez `ProdBody`, bo ciało trzyma blokadę generała nieaktywną (D-417A-7; `ProdMoveGates`/`ProdAttackEnv::blockade_allows` z `active: false`). Dlatego mutant jest zabijany testem czystej funkcji produkcyjnej `run_of_move` (zasada D-417A-4: plik produkcyjny, nie kopia). W ciele stanie się osiągalny dopiero z panelem generała (część B); wtedy wektory rundy 2/B powinny go pokryć.

### Zarzut 4 — luki: PRZYJMUJĘ, w większości NAPRAWIONE
- Marsz krokowy (`march_incremental`) dla rozkazów gracza: NAPRAWIONE. `rozkaz_move_w_marszu_krokowym` (start zwraca 0, `march_pending`, jeden zegar końca kroku, po `fire_timer` marsz zakończony i `take_march_done` zgłasza jednostkę, pozycja po pierwszym kroku, brak tagów `unported`, rozkaz trwa) oraz `rozkaz_attack_w_marszu_krokowym_idzie_krokiem`. Ścieżka `exec_order_move` -> `march_move` pokryta dla `move` i `attack`.
- `ram_tower_step` / `tower_climb` / `infantry_to_tower` w trybie ręcznym: CZĘŚCIOWO. Tłumaczenie decyzji na wykonanie (`SiegeRamTower`, `SiegeClimb`, `SiegeInfantry`) pokryte czystymi testami `run_of_siege` (mutanty M12–M14); samo wykonanie tych gałęzi to wywołanie tych samych funkcji `siege_atk_*` co AUTO, a próba zbudowania pełnych scen ciała dla wież/tarana (siege-atk-plan) nie weszła w budżet rundy obrony. NIE_ZMIERZONO na poziomie ciała — do rundy 2 razem z wektorami oblężenia.
- Strona obrońcy: NAPRAWIONE (`obronca_jako_gracz_ma_wlasne_rozkazy`, `obronca_jako_gracz_atakuje_wskazany_cel`).
- `SiegeLoop` z trybem ręcznym E2E: NIEZAMKNIĘTE; w dispatchu D-417A-1 to część B (#422: `activation_done`/`player_unit_idle` w pętli) — ODRZUCAM jako zarzut wobec części A, zostaje w mapie kroków B pkt 7.
- Blokada generała (D-417A-7): ODRZUCAM jako lukę do pokrycia w części A. Dowód: `ProdMoveGates::blockade_allows` i `ProdAttackEnv::blockade_allows` (`siege_tactics_loop.rs:1780`, `:8265`) wołają `dest_allowed_by_blockade` z `BlockadeSettings{active:false}`; żaden publiczny kod ustawiający blokadę w ciele nie istnieje (panel generała pin `:17809-17815`, `:17830` = część B). Test zachowania, którego nie da się wywołać, byłby tautologią. Brak testu to świadoma decyzja zapisana w D-417A-7; port `dest_allowed_by_blockade` ma własne wektory z pinu (T2). Gałąź `BlockadeBlocked` pokryta na poziomie tłumaczenia (M4).

### Zarzut 5 — zgodność z dispatchem (informacja Evaluatora, bez wady): przyjmuję do wiadomości
Bramki, allowlista, baza, brak `#[ignore]`, tryb domyślnie wyłączony, predykaty N1/N2 liczone w ciele: bez uwag. Dodane w tej rundzie: tylko plik testowy z allowlisty (`p4_417a_manual_mode_state.rs`).

## Co zostaje do rundy 2 (zestawienie)
1. Wektory kroku z wykonania pinu dla ciała (kryteria 2, 3): nowy tryb generatora + konsument Rust (zarzut 1).
2. `fx` `_siegeSafeApproach` z wykonania pinu (kryterium 2).
3. Podprzyczyny `removed` i wektorowe progi pokrycia (kryterium 4).
4. Ciało dla `ram_tower_step`/`tower_climb`/`infantry_to_tower` w trybie ręcznym (testy na poziomie sceny).
5. Mapa części B bez zmian względem `01-operator-r1.md` (pkt 1–7).
