STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-TOWER-TARGET-Q1
GOAL: Obrona Operatora (Haiku) na zarzuty FC r1 wobec kodu 786f049c5. Każdy zarzut: PRZYJMUJĘ (poprawka+dowód+commit) albo ODRZUCAM (dowód).
ZMIANY/COMMIT: brak zmian w kodzie Rust i w teście. Dodany tylko ten raport (02a-obrona.md). SHA: patrz sekcja „SHA” na końcu. Kod operatora: 786f049c5 (nie zmieniony).
BAZA WORKTREE: wykonano `git checkout --detach 786f049c5` (gałąź wip/... jest zajęta przez inny worktree; kod sprawdzony na tym SHA, ancestor 23e33793e = OK).

## Odpowiedzi na zarzuty

### Z1. Brak własnego generatora .mjs i strażnika SHA-256 dla nowego testu; reużyto vectors.json — ODRZUCAM (dowód)
- Generator i strażnik istnieją w tym samym temacie (commit b2e284cf1): `rust-port/engine/tests/p6_tower_target_gen.mjs` (197 linii). Strażnik: `createHash('sha256')` na wyciętych liniach pinu, `throw` przy niezgodności (linie ~56-61), hash `1321c316517057e97159f84ce0688edf9837cd63a6507ca8d484d2b2637b3ffc` w `meta.fragmentSha256`.
- Dowód odtworzenia: uruchomiono `node p6_tower_target_gen.mjs` (z `TOWER_TARGET_SCRATCH` poza repo). Wynik: `git status` czysty, `git diff --stat` puste, czyli vectors.json po regeneracji jest bajt-w-bajt identyczny. Hash bez zmian: `1321c316…3ffc`.
- Nowy test `p6_tower_target_wiring.rs` konsumuje te same wektory (600 przypadków z `meta.cases`, `assert!(cases.len() >= 150)`), a więc ten sam strażnik obejmuje jego dane. Test sam nie liczy SHA; strażnik żyje w generatorze.
- Zastrzeżenie dla FC: dispatch mówi „generator .mjs” dla nowego testu. Reużycie jest świadomą decyzją (ten sam pin, te same fragmenty), nie nową wiedzą. Jeśli FC uzna to za niezgodne z kryterium 2, wymagana jest decyzja orkiestratora.

### Z2. Wiązanie martwe w produkcji (SiegeLoop bez produkcyjnego wołającego, #113) — PRZYJMUJĘ jako fakt, bez zmiany kodu
- Dowód: `grep` po `src` i `tests`: `SiegeLoop::new` występuje tylko w `tests/p6_siege_tactics_loop.rs:176` i w teście wiringu. `tower_target_index` wołany tylko z `siege_tactics_loop.rs:308` (apply `FireSiegeTowers`). `tower_targeting` domyślnie `None` (`siege_tactics_loop.rs:243-244`).
- Wiązanie jest produkcyjnym kodem modułu (nie testem), ale pętla oblężenia nie ma jeszcze wejścia z gry: to zakres #113 (K5LOOP-WIRING), poza allowlistą tego tematu i poza GOAL („w miejscu i kolejności zgodnej z pinem”, nie „podpięcie całej pętli”).
- Konsekwencja do decyzji orkiestratora: kryterium 1 jest spełnione na poziomie modułu, nie na poziomie gry. `pick_tower_target` nie jest osiągalny z gry, dopóki nie zrobi tego #113. Proponuję PASS-WITH-NOTES z tą adnotacją.
- Uwaga: `tower_log` nie ma konsumenta. Zgodne z zakresem (#96 wykonuje strzał i odczyt logu).

### Z3. Kolejność względem pinu nieudowodniona (FireSiegeTowers przed resetem acted/move_left i activate_next) — ODRZUCAM (dowód)
Dowód z kodu, nie z testu:
1. Pin: `_fireSiegeTowers` (pin, ok. :4208-4225) nie wybiera celu synchronicznie. Każdy `_fireOneTower` jest planowany przez `_schedule(delay, …)`. Pin `_schedule` (ok. :9595-9606) wrzuca callback do `vTimers` z `due = now + ms`, a wykonuje go pompa timerów po zakończeniu synchronicznego `_beginTurn`. Pick (`pickTowerTarget`) w pinie odbywa się więc PO synchronicznej części `_beginTurn` (w tym po `_activateNext` pierwszej jednostki).
2. Rust: `begin_turn` (`siege_tactics_turnseq.rs:228-287`) zbiera zdarzenia do `out`; `SiegeLoop::apply` (`siege_tactics_loop.rs:297-310`) wykonuje pick dopiero po powrocie `begin_turn` (i `activate_next`, które jest w tym samym wywołaniu). Kolejność jest więc taka sama: pick po synchronicznej części tury, także po resecie acted/move_left.
3. Co realnie czyta pick: `dead`, `fading_out`, `routed`, `removed`, `hp`, pozycje. Sprawdzone: `LoopBody::start` przyjmuje `&TurnSeqState` (`siege_tactics_loop.rs:48`, `:687`), więc nie może mutować wrogów. `TurnSeqEnv` ma cztery metody; jedyna mutująca to `fire_siege_towers` (patrz Z4). `begin_turn` i `activate_next` zmieniają tylko `acted`, `move_left`, `turn_order`, `turn_idx`, `round_no` (`siege_tactics_turnseq.rs:245-283`). Mutacje `dead/routed/hp` są w `complete` (`siege_tactics_loop.rs:807, 879-881`), a `complete` nie jest wołane z `begin_turn` ani `activate_next`.
4. Wniosek: między początkiem `begin_turn` a pickiem nie zmienia się żadne wejście picka poza efektem `fire_siege_towers` (Z4). Różnica w kolejności nie zmienia wyniku.
- Brak nowego testu „zmiana stanu przed pickiem”: w obecnym kodzie nie ma ścieżki, która by taką zmianę wywołała, więc test byłby pusty. Gdy #96 dołoży strzał zmieniający wroga przed pickiem, trzeba będzie dopisać test i porównać z pinem.

### Z4. Stub `fire_siege_towers` wykonuje się przed pickiem; wieża-atakujący mogłaby zostać `dead` — ODRZUCAM (dowód)
- Stub (`siege_tactics_loop.rs:199-209`) ustawia `dead = true` tylko dla jednostki wskazanej w `self.tower`. Wieże obrońcy są w `def`, a pick filtruje `atk` (`tower_target_index`, `siege_tactics_loop.rs:93-115`). Stub nie może więc zmienić puli celów.
- Pin: strzelec wieży jest syntetyczny (komentarz w pinie: „nie jest w zadnym rosterze”, `dead:true` dla `_gainMorale`), a wieże należą do obrońcy (komentarz R4: „strzelaja wiezyczki obroncy”). Wieża nie jest jednostką `atk` w żadnym przypadku.
- Stub jest zgodny z `TurnSeqEnv::fire_siege_towers` (`siege_tactics_turnseq.rs:137-138`: „Może zmienić jednostki (np. zabić) przed zbudowaniem turnOrder”), a nie z kolejnością pinu dla picka. To zakres #96.
- Zastrzeżenie: w teście `tower: None`, więc stub nie jest testowany w tym temacie.

### Z5. Wiele wież i stagger 180 ms niemodelowane; jeden wpis tower_log na turę — PRZYJMUJĘ jako udokumentowane ograniczenie, bez zmiany kodu
- Zgodne z dispatchem: „Nie implementuj strzału wież (to #96)”. Pin: `stagger += 180` i osobne `_schedule` na wieżę (ok. :4215-4222). Rust: jeden `FireSiegeTowers` na turę, jeden wpis `tower_log`. To ograniczenie jest jawne w komentarzu `tower_log` (`siege_tactics_loop.rs:228-232`) i w raporcie 01.
- Zawężenie: wiring odpowiada na pytanie „który wróg byłby celem jednej wieży na początku tury”. Nie odpowiada na „kolejność ognia wielu wież” (#96).

### Z6. `atk_pos` statyczne (CombatUnit nie niesie współrzędnych), błędne w turach >1 — PRZYJMUJĘ jako znany dług #113
- Dowód: `CombatUnit` (`siege_tactics_unit.rs`) nie ma pól q/r. `TowerTargeting.atk_pos` jest wejściem wywołującego (`siege_tactics_loop.rs:78-90`), a `expect` panikuje przy braku wpisu. To jawnie opisany dług, już zapisany w raporcie 01 (sekcja BLOKADY).
- Naprawa wymaga pozycji w `CombatUnit` albo w `TurnSeqState`, czyli zmiany poza allowlistą (#113). Nie robię tego w tym temacie.
- Zawężenie dla FC: wybór celu jest poprawny dla danych wejściowych z wektorów (600 przypadków) i wiązania testowego; dla tur >1 po ruchu wrogów jest niepoprawny, dopóki #113 nie dostarczy aktualnych pozycji.

### Z7. 01-operator-r1.md nadpisał raport poprzedniej rundy tego samego ID — PRZYJMUJĘ (fakt zapisany, bez zmiany pliku)
- Dowód: `git log -- .../01-operator-r1.md`: commit `ed70002a1` („raport Operatora r1”), potem `33f59bfa7` nadpisał plik (32+/23-). Poprzednia treść (runda czystej funkcji, FC PASS-WITH-NOTES „bez wpinania”) jest dostępna w `ed70002a1`.
- Nie przywracam starej treści do `01-operator-r1.md`, bo allowlista tematu zawiera ten plik jako plik bieżącej rundy. Decyzja, czy archiwizować poprzednią rundę (np. jako `01-operator-r0.md`), należy do orkiestratora.

### Z8. Commit bez nazwy modelu wg dispatchu vs Co-Authored-By z remindera — PRZYJMUJĘ jako konflikt do rozstrzygnięcia przez orkiestratora
- Dispatch: „Commit bez nazwy modelu; ostatnia linia: Claude-Session: …”. Reminder o atrybucji (dołączony do sesji): `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>`.
- Ten commit (`SHA` poniżej) jest zgodny z dispatchem (bez `Co-Authored-By`, z `Claude-Session`). Nie zmieniam SHA kodu 786f049c5 (rewrite nie jest potrzebny do obrony). Decyzja: orkiestrator wybiera, czy doda `Co-Authored-By` w integracji.

## Bramki
- Nie uruchamiałem ponownie `cargo` (zarzut nie dotyczy kodu). Zarzut końcowy objął odtworzenie zielonych bramek (fmt 0, clippy 0, lib 99 ok, wiring 2 ok, p6_siege* 39 plików ok) — zgodnie z treścią zarzutu, nie zmierzono w tej rundzie.
- Regeneracja wektorów: `node p6_tower_target_gen.mjs` (TOWER_TARGET_SCRATCH poza repo): git diff puste, sha256 `1321c316…3ffc` (ZMIERZONO w tej rundzie).

## Wnioski dla orkiestratora
- Zarzuty bez zmiany kodu: Z1, Z3, Z4 odrzucone z dowodem; Z2, Z5, Z6, Z7, Z8 przyjęte jako ograniczenia lub decyzje.
- Kryterium 1 (produkcyjny wołający) spełnione tylko na poziomie modułu. Wymaga decyzji, czy PASS-WITH-NOTES wystarczy przed #113.
- Najbliższy krok: FC r2 na tym samym SHA kodu z tym raportem obrony. Zmiana zakresu (wiring w grze) to #113, a nie ta runda.

NASTĘPNY KROK: Evaluator/FC r2 na 786f049c5 + ten raport; decyzja orkiestratora w sprawie Z2 (scope #113) i Z8 (attribution).
DEPLOY/PUSH: NIE WYKONANO
