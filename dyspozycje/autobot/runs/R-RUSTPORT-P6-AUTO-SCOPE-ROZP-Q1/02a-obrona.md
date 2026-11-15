# R-RUSTPORT-P6-AUTO-SCOPE-ROZP-Q1 — 02a Obrona Operatora (runda 1, odpowiedź na Evaluatora 02-evaluator.md)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (read-only; zero zmian kodu gry)
TEMAT: R-RUSTPORT-P6-AUTO-SCOPE-ROZP-Q1
GOAL: rozstrzygnąć 6 zarzutów Evaluatora (02-evaluator.md) do 01-rozpoznanie.md; przyjęte poprawki wiążą jako korekta tabeli, zależności i rekomendacji.
ZMIANY/COMMIT: ten plik (`02a-obrona.md`). `01-rozpoznanie.md` NIE zmieniany; jego błędy są wprost skorygowane w sekcji „Poprawki wiążące” poniżej. Kod, `gra/`, Cargo.lock nietknięte. Brak push.
BAZA: `32fbf52d1` (Evaluator r1; zawiera commit Operatora `96bf9232d`, który jest jego przodkiem).
TESTY: NIE_URUCHAMIANO cargo. Powód: rozpoznanie i obrona są odczytem; wolne miejsce na `/` = 5,6 GB, poniżej progu 8 GB z dispatchu dla tematów z kodem Rust. Zweryfikowano odczytem: pin `07d2fbd72:gra/src/battle/battleScene.ts` (wyeksportowany do scratchpadu), Rust na `32fbf52d1`, plik wektorów `p6_siege_tactics_roundcap_vectors/vectors.json` (parsowany skryptem Python, tylko odczyt).
BLOKADY: brak
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control na 01-rozpoznanie.md + 02-evaluator.md + 02a-obrona.md, z uwzględnieniem poprawek wiążących.
DEPLOY/PUSH: NIE WYKONANO

---

## Odpowiedzi na zarzuty

### Zarzut 1 — V1/V2 zależą od #112. PRZYJMUJĘ.

Dowód (pin `07d2fbd72`):
- `_activateUnit` wywołuje doktrynę przed resztą gałęzi: `battleScene.ts:6091-6097`. Warunek to `!this._manualMode && !siegeDefenderNeverDoctrine && !siegeMachineNeverDoctrine`, potem `_isUnitDoctrineAuto(ru)` i `_executeGroupDoctrineStep(ru, meta, done)`; przy `true` następuje `return`.
- Jednostka bez grupy i bez `unitDoctrine`: `_getEffectiveDoctrine` = `'steady'` (`17612-17619`), `_isUnitDoctrineAuto` = `true` (`17621-17631`), a `_effectiveMetaForUnit` daje `{doctrine:'steady', autoPlay:true}` (`17633-17637`).
- W `_executeGroupDoctrineStep` (`17966`) gałąź `steady` zwraca `true` we wszystkich ścieżkach: konnica `17992-17994`, strzelec `18001-18005` i `18014-18016`, zwykły `steady` `18022-18024` (`_advanceStep`, `return true`). Jednostka steady niekonna i niestrzelająca kończy więc aktywację na `6097`; gałęzie `6105-6298` (okrążenie, facing, strzelec, cios, marsz) są dla takiej jednostki nieosiągalne.
- Rust: `plan_unit` jest tylko metodą traitu `AutoBatchEnv` (`siege_tactics_autobatch.rs:264`); jedyna implementacja to test `p6_siege_tactics_autobatch.rs:125`. Produkcyjnej implementacji nie ma (`grep -rn "fn plan_unit"` na `32fbf52d1`).

Korekta: V1 i V2 **nie są niezależne od #112** dla domyślnej jednostki. Są niezależne tylko dla jednostek z `unitDoctrine='manual'` lub z grupą `autoPlay=false`, a i wtedy planowanie przechodzi przez resztę `_activateUnit`, która wymaga #109 (morale) lub #123 (ruch/facing). Niezależne od #112 pozostają V5 i V6 (zakończenie i halt).

### Zarzut 2 — V13 jest POKRYTE; opis „remis morale → obrońca” błędny. PRZYJMUJĘ.

Dowód:
- Pin `_roundCapVerdict` (`battleScene.ts:9449-9464`): gałąź bez wyłomu (`siegeWallCol>=0 && !wallEverBreached`) daje remis; w pozostałych przypadkach, po `FF_MAX_ROUNDS` (`:1125`, = 400), zwraca `ratioA <= ratioD ? 'obronca' : 'atakujacy'`. Remisu przy morale nie ma.
- Rust `round_cap_verdict` (`siege_no_breach.rs:69-88`) ma tę samą strukturę (`atk <= def → Defender`), a `ff_cap_step` i `begin_turn` (`siege_tactics_roundcap.rs`) korzystają z niego bez duplikacji.
- Wektory `p6_siege_tactics_roundcap_vectors/vectors.json`: sekcje `gate` 600, `beginTurn` 400, `ff` 500. Przypadki bez muru (`state.wallPresent=false`): gate 300, beginTurn 211, ff 234, razem **745** (zgodnie z rozpoznaniem). Z nich z `roundNo>=400`: 87 + 51 + 54 = **192**, z oczekiwaniem `obronca`/`atakujacy`. Są też przypadki remisu wartości (`ratioA == ratioD`, np. `1 vs 1 → obronca`).

Korekta: V13 = **POKRYTE (werdykt, wektory)**. Nie trzeba pisać nowego wektora. Zostaje wyłącznie integracja przez pętlę (`#113`). Zależność od #109 dotyczy **wejść** werdyktu (`_armyMoraleRatio` w produkcji wymaga poprawnych skutków ciosu z #109), a nie samej funkcji werdyktu.

### Zarzut 3 — ProdBody oznaczony POKRYTE zawyża stan produkcyjny. PRZYJMUJĘ.

Dowód:
- `siege_tactics_loop.rs:700`: „NIE WPINAĆ do [`SiegeLoop`] przed osobnymi tematami”. Blok wyjaśnia, że `_resolveBlowOutcome` i `BLOW_HIT_T` nie są zaimplementowane.
- `siege_tactics_loop.rs:995-1003`: `ProdBody` traktuje `wall_col >= 0` jako `oblezenie` i wyłącza `strzelec`/`doktryna` do `unported`.
- `siege_tactics_loop.rs:541-545`: `SeqEvent::BeginAutoBatchPhase` przerywa pętlę (`halt_unsupported`).

Korekta: wiersze 2b/2c, które w rozpoznaniu są „POKRYTE (`p6_siege_tactics_loop_body_pin`)”, należy czytać jako **„POKRYTE (ciało, wektory) + BRAK (wiring, #113)”**. Stan produkcyjny pętli nie obejmuje AUTO bez oblężenia.

### Zarzut 4 — łańcuch zależności niepełny (#109 → #112). PRZYJMUJĘ.

Zależność „#112 po OUTCOME” pochodzi z deklaracji kolejki (opis #112 w kolejce zadań), a nie z kodu pina. Przechodnio:
- V7, V8 i V1/V2 (dla domyślnej jednostki) zależą od #112, a #112 od #109.
- V8 dodatkowo od #148.

Kolejność poprawna: **#109 → #112 → {V1/V2 dla domyślnej jednostki, V7, V8}**.

### Zarzut 5 — teza „praktycznie cała AUTO bez oblężenia poza zakresem” niezmierzona; pominięto doktrynę atakujących w oblężeniu. PRZYJMUJĘ (zmierzone teraz).

Pomiar `_executeGroupDoctrineStep` (`17966-18123`):
- Gałęzie i zwroty: `defensive` `17967-17985` → `true`; `skirmish` `17986-17987` → wynik `_executeSkirmishDoctrineStep` (**NIE_ZMIERZONO**, nie czytano tej funkcji); `steady`+konnica `17992-17994` → `true`; `steady`+strzelec `18001-18016` → `true`; `steady` `18022-18024` → `true`; `aggressive` `18027-18061` → `true`; gałąź domyślna `18064-18123` → `true`.
- Wniosek: poza `skirmish` funkcja zwraca `true` we wszystkich gałęziach. Dla domyślnej jednostki steady to jest blokada całej reszty aktywacji.

Doktryna w pinie dotyczy też **atakujących w oblężeniu** (nie-maszyn): `battleScene.ts:6091-6092` wyłącza tylko obrońców w oblężeniu (`siegeDefenderNeverDoctrine`) i maszyny oblężnicze atakującego (`siegeMachineNeverDoctrine`). Zatem #112 dotyczy także ścieżki oblężenia atakującego, a nie tylko AUTO bez oblężenia. Pętla produkcyjna ProdBody wyłącza oblężenie wcześniej (`:995-996`), więc ta ścieżka wpływa na sterownik K5 dopiero po wpięciu (#113).

### Zarzut 6 — testy nieuruchomione; brak wektorów dla `_executeQueuedOrders` (3603) i `_ffEnterAuto` (3709). PRZYJMUJĘ.

- Testy: **NIE_ZMIERZONO** (patrz nagłówek: cargo nie uruchomiono; wolne 5,6 GB < 8 GB). Status „POKRYTE (test)” w rozpoznaniu należy czytać jako „POKRYTE (istnieje test/plik wektorów; zielony wynik NIE_ZMIERZONO)”.
- `_executeQueuedOrders` (`battleScene.ts:3603`) i `_ffEnterAuto` (`:3709`): nie ma ich na liście wektorów sekcji 3. Dopisać jako kandydatów V15 i V16 w następnej rundzie, z zależnością od decyzji o trybie ręcznym (V14) i nieobjętych jeszcze wejść do przewijania. Ich zależności od #109/#112 **nie zostały zbadane** (NIE_ZMIERZONO).

---

## Poprawki wiążące (korekta 01-rozpoznanie.md)

1. Sekcja 4, wiersz „Cała AUTO bez oblężenia”: zależność brzmi **#112 (twardy) → #109 (przechodnio)**; dla V1/V2 dotyczy domyślnej jednostki (bez `unitDoctrine`, bez grupy).
2. Sekcja 4, zdanie „Ścieżki od #97/#118 niezależne od #109: V1, V2 (tylko dla jednostek bez doktryny)”: **nieprawdziwe**. Poprawnie: niezależne od #112 i #109 są **V5 i V6**. V1/V2 są niezależne od #112 wyłącznie dla jednostek z `unitDoctrine='manual'` lub grupą `autoPlay=false`, a i wtedy zależą od `_advanceStep` (#123) i reszty aktywacji.
3. Sekcja 5, pkt 1 „Wektory V1, V5, V6 od razu”: korekta na **„V5 i V6 od razu; V1/V2 dopiero po #112”**.
4. Sekcja 3, V13: status **POKRYTE (werdykt + wektory 192 przypadków z `roundcap≥400`)**; opis „remis morale → obrońca” usunąć; poprawnie: `ratioA <= ratioD ? obronca : atakujacy` (`battleScene.ts:9449-9464`).
5. Sekcja 2b/2c: adnotacja „POKRYTE” dla ciała ProdBody = „ciało i wektory; BRAK wiringu (#113)”.
6. Sekcja 6 NIE_ZMIERZONO: dopisać (a) zwrot `_executeSkirmishDoctrineStep` (`:17987`), (b) zależności `_executeQueuedOrders` i `_ffEnterAuto`, (c) doktrynę atakującego w oblężeniu jako ścieżkę wpływającą na #112.

---

## Werdykt obrony

Przyjęte: zarzuty 1, 2, 3, 4, 5, 6 (wszystkie z korektami wyżej). Odrzucone: brak.
Najważniejsza korekta merytoryczna: **V1/V2 nie są niezależne od #112** (zarzut 1), a V13 jest pokryty na poziomie werdyktu (zarzut 2).
