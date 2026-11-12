STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5-AUDYT-Q1
GOAL: audyt pętli tur taktycznych K5 (dokument; klocek opcjonalny)
ZMIANY/COMMIT: Evaluator dopisuje tylko 02-evaluator.md. Oceniany commit operatora 30e48df5b (rodzic a70375e52 = baza z dispatchu).
TESTY: git diff --check 30e48df5b~1..30e48df5b: EXIT 0. git diff --name-only a70375e52..30e48df5b: 2 pliki (01-operator-r1.md, P6-SIEGE-TAKTYKA.md), 0 plików .rs, allowlista OK. Pin 07d2fbd72 odczytany przez git show: 20771 linii, SHA-256 d784735e...d21d zgodny. cargo fmt/clippy/test NIE uruchamiane: brak zmian .rs, brak klocka (kryterium 4 dispatchu = diff bez .rs, spełnione). Brak #[ignore]/osłabionych asercji (brak kodu). Wektory na pinie: nie dotyczy (wariant dokumentowy).
BLOKADY: brak blokad technicznych.
RUNDY: 1/5 (Evaluator)

ZARZUTY (numerowane):
1. (kryterium 2, istotny) L8 `_armyMoraleRatio` oznaczone PARTIAL / "pełna wersja z dowódcą NIE_ZMIERZONO" (K5.8, 01-operator-r1 BLOKADY c). Pin :9988-9991 to jednolinijkowe `return armyMoraleRatioWithoutCommander(arr)`: wersji z dowódcą nie ma. Dane były w pinie, więc wiersz powinien być PORTED (`army_leadership.rs:123`). Dispatch zabrania NIE_ZMIERZONO tam, gdzie dane są w pinie; zarzut Operatora (b/c) jest fałszywą niepewnością. Poprawić L8 i L7 (uwaga "BRAK ... army_morale_ratio" bez dowódcy).
2. (kryterium 1, istotny) Krok U7 `_activateUnit` opisany "wg nazw", bez numerów linii pinu dla gałęzi (kawaleria/falanga/strzelcy/melee) i bez kolejności; w K5.3 i BLOKADY jawnie "NIE_ZMIERZONO w całości" (:6048-6299). Kryterium 1 wymaga linii pinu dla KAŻDEGO kroku pętli. Nie spełnione dla U7. Wymagane: kolejność gałęzi z numerami linii (np. 6187 maszyny atakującego, 6199 wall, 6225 obrońca w oblężeniu).
3. (kryterium 2) L14 `_schedule/_drainTimers`: "events.rs:412 inny model, NIE sprawdzone pod kątem równoważności". Dane w repo (events.rs:405-412 `schedule(turn, phase, event)` to kolejka po turze/fazie, nie po `due` ms i `id`), więc wniosek (nierównoważne) dało się wyprowadzić od razu. Zostawione NIE_ZMIERZONO bez powodu.
4. (kompletność) Brak ścieżki `skip()` gdy `!started` => `_skipInstantFallback` (:3691, :3715-3750) + `computeInstantResult` (:20389) w K5.2-K5.8: drugi, nie-pętlowy tor zakończenia bitwy (ustawia `finished`, `_endWinner`, bez `_checkEnd`). Jest tylko wzmianka o fladze w tabeli §1 wiersz 18. Powinien być wiersz L w tabeli i uwaga w K5.2/K5.5 (wejścia do końca bitwy). Ryzyko dla K5j/K6.
5. (drobne) Wejście SKIP cytowane jako `:3696-3704`; funkcja `skip()` zaczyna się ok. :3677 (guard `finished/_ffActive`, `lastInstantDefBonus`, `_endDeployPhase`). Zakres linii zawężony, pomija krok `deployPhase`/`!started`.
6. (drobne) K5.1 podaje `_autoBatchToken` przy starcie fali `:5726`; w pinie inkrement to `:5730` (`const token = ++this._autoBatchToken`). Numer linii błędny o 4. Pozostałe sprawdzone linie zgodne: 5568-5581, 5631-5689, 5979-6030, 10153-10240, 9415-9437, 9449-9497, 9245-9294, 3615-3631, stałe 1014/1023/1119/1125/1128, `roundNo++` wyłącznie :5636, `Math.random` w logice wyłącznie :8960 (pozostałe to audio, od :11030), `_checkEnd` wołane z :5635/:5963/:5982.

POTWIERDZONE (zarzuty NIE postawione, sprawdzone adwersarialnie):
- K5.9 martwa gałąź SZTURM ODPARTY: potwierdzona. `_stalled=true` tylko :5580; `_updateStallWatch` wychodzi przy `siegeWallCol>=0` (:5571); `siegeWallCol` deklaracja :2448 (-1), jedyne przypisanie :4033; reset `_stalled=false` :10550. Blok :10172 bramkowany `_stalled`. Wniosek poprawny, Q1 (rekomendacja A) zasadne jako ABC gameplay.
- Kolejność `_beginTurn` T0.1-T0.9 i `_checkEnd` 1-10 zgodne z pinem.
- Odniesienia Rust (`siege_tactics_end.rs:48,56`, `siege_no_breach.rs:27,53,69`, `army_leadership.rs:123,146`) istnieją na bazie.

NASTĘPNY KROK: Operator poprawia zarzuty 1-4 (dokument), 5-6 kosmetyka. Zarzuty 1-2 blokują kryteria 1 i 2 dispatchu, więc werdykt formalnie wymaga rundy poprawkowej; merytoryka K5.9 i szkielet K5.10 są poprawne, ale kryteria binarne 1 i 2 niespełnione => FAIL, powrót do tego samego ID (Operator).
DEPLOY/PUSH: NIE WYKONANO
