# 02a OBRONA OPERATORA — R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-Q1 (runda 1, obrona Haiku)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-Q1
GOAL: odpowiedź na 7 zarzutów Evaluatora (02-evaluator.md, commit f07d5ac91); poprawki tam, gdzie zarzut jest zasadny.
BAZA: 73ad43f25 (Operator r1, gałąź claude/k5loop-q1-operator). Obrona wykonana na tym SHA; push nie wykonano.
SHA OBRONY: patrz sekcja „Commit” na końcu (wpisany po `git commit`).

## Wynik zbiorczy

| # | Zarzut Evaluatora | Werdykt | Zmiana w kodzie |
|---|---|---|---|
| 1 | Zakres: K5H/K5I/K5G nie złożone, single_blow_full nie wołane | PRZYJMUJĘ (bez zmiany kodu w tej rundzie) | nie |
| 2 | Stub `_armyMoraleRatio` zamiast prawdziwej funkcji | PRZYJMUJĘ — naprawione | tak |
| 3 | Stub wież (natychmiastowy kill zamiast schedule 180 ms + `_fireOneTower`) | PRZYJMUJĘ (bez naprawy w tej rundzie, NIE_ZMIERZONO) | nie |
| 4 | Pokrycie wektorów: fadingOut/routed/moveLeft/removed, flee/rout | PRZYJMUJĘ częściowo (mapowanie naprawione, pokrycia brak) | częściowo |
| 5 | `panic!` w sterowniku (BeginAutoBatchPhase, EnterAuto) | PRZYJMUJĘ — naprawione | tak |
| 6 | Niezależność wyniku od podziału na kroki bez osobnego testu | ODRZUCAM część (dowód niejawny 360/360), test osobny PRZYJMUJĘ jako dług | nie |
| 7 | vectors.json rozmiar | PRZYJMUJĘ jako uwaga (rozmiar po regeneracji 7,1 MB) | nie |

## 1. ZAKRES — PRZYJMUJĘ

Zarzut zasadny. Zweryfikowane w 73ad43f25:
- `siege_tactics_loop.rs` nie woła `single_blow_full` ani `activate_unit` (`grep` po `rust-port/engine/src`: `single_blow_full` ma wywołującego tylko w `siege_tactics_blow_full.rs`/`class_adapters` — poza sterownikiem; `activate_unit` w `siege_tactics_class_adapters.rs:96` to osobna funkcja o tej samej nazwie bez wywołania z pętli).
- Ciało jednostki w wektorach to stub `LoopBody` (czas + nop/kill/hurt).
- Nie zmieniam kodu w tej rundzie: złożenie K5H/K5I z `single_blow_full` to osobny zakres. **#91 NIE wolno zamykać** po tej rundzie; status: częściowy (K5F + K5J + zegar + roundcap + endcheck złożone i zweryfikowane wektorami).

## 2. STUB morale — PRZYJMUJĘ, NAPRAWIONE

Zarzut zasadny i głębszy niż opisał Evaluator: pin (`battleScene.ts:9988`) wywołuje `armyMoraleRatioWithoutCommander` z `game/army-leadership.ts`, która wyklucza dowódcę, pomija dead/fadingOut/routed w liczniku i zwraca 1 przy braku jednostek bez dowódcy. Stub formuły różnił się od pina (np. liczył martwe jednostki), a wektory porównywały stub ze stubem.

Poprawka (commit obrony):
- `siege_tactics_loop.rs`: `SiegeEnv::ratio` mapuje `SeqUnit.c` na `ArmyLeaderCombatant` (morale, morale_max z `env.morale_max`, dead, fading_out, routed; `is_army_commander=false`) i woła `army_morale_ratio_without_commander`.
- `p6_siege_tactics_loop_gen.mjs`: usunięto stub `_armyMoraleRatio`; metoda pinu (zakres 9988–9991) i funkcja `armyMoraleRatioWithoutCommander` (wycinek z `army-leadership.ts` po SHA 07d2fbd72) są wykonywane z pinu. Zmieniono `LOOP_FRAGMENT_SHA256` na nowy skrót zbioru fragmentów (`b48108ea742e51fd647ad14e7542f9db83854a42255c5aa68761fb248a3de88c`), bo zbiór wycinków jest celowo większy o metodę morale; pin SHA bez zmian.
- Wektory `vectors.json` wygenerowane ponownie (360 sekwencji, sha fragmentów `b48108ea742e51fd647ad14e7542f9db83854a42255c5aa68761fb248a3de88c`). Statystyki zmieniły się (aktywacje 188802 → 123394), co potwierdza, że stub wpływał na wynik.

Dowód: `cargo test --test p6_siege_tactics_loop` 2/2 PASS na nowych wektorach (EXIT 0). `cargo fmt --check` EXIT 0, `cargo clippy --all-targets -- -D warnings` EXIT 0, `cargo test --lib` 88 passed.

## 3. STUB wież — PRZYJMUJĘ, NIE NAPRAWIONE (NIE_ZMIERZONO)

Zarzut zasadny. Pin (`battleScene.ts:4208`) `_fireSiegeTowers`: pomija zniszczone wieże, niszczy wieżę gdy brak `wallTileHp` na jej rzędzie (`_destroyTowerAtRow`), a pozostałe planuje `_schedule(stagger, _fireOneTower(...))` ze staggerem 180 ms. Rust i generator robią natychmiastowe `dead=true` na jednej jednostce. To NIE jest efekt zewnętrzny (RNG/rendering), tylko logika czasu i kolejności, więc stub jest niedozwolony wg dispatchu. Port `_fireOneTower`/`pickTowerTarget` to osobny, większy zakres (wymaga też kolejności względem `vNow`). Nie naprawiam w tej rundzie.

Uwaga do nagłówka generatora: komentarz „efekt R4, jawny w sekwencji” i nazwa testu `…cover_breach_towers_and_cap` przeceniają pokrycie wież — wieże w wektorach są tylko stubem. Wektory `withTower` = 117 sekwencji, ale nie testują timingu wież.

## 4. POKRYCIE — PRZYJMUJĘ częściowo

- Zasadne: wektory nigdy nie ustawiają `fadingOut`, `removed`, `routed`, `moveLeft>0`; wyłom w trakcie bitwy nie jest składany; brak trybu ręcznego; brak porównania zmiany `moraleMax`; ścieżki flee/rout i filtry kolejki nieprzetestowane.
- Naprawione częściowo: mapowanie w `SiegeEnv::ratio` przekazuje już `fading_out` i `routed` (zgodnie z pinem), ale wektory dalej ich nie generują, więc ta gałąź nie ma dowodu.
- NIE_ZMIERZONO: pokrycie flee/rout/removed/moveLeft i wyłomu w trakcie bitwy. Nie dodaję w tej rundzie.

## 5. PANIC — PRZYJMUJĘ, NAPRAWIONE

Zasadne (moduł nowy, więc to nasz błąd, nie biblioteki). Zamieniono oba `panic!` na jawne zatrzymanie:
- nowe pole `pub unsupported: Option<&'static str>` w `SiegeLoop`;
- `halt_unsupported(clock, reason)` ustawia `unsupported`, `st.finished = true`, `clock.finished = true`, bez zwycięzcy;
- wywołania: `SeqEvent::BeginAutoBatchPhase` (apply) i `FfEvent::EnterAuto` (event).
Wywołujący sprawdza `sl.unsupported` po `run`. `grep -n panic siege_tactics_loop.rs` → brak wyników.
Dowód: kompilacja + clippy `-D warnings` EXIT 0 + testy 2/2 + lib 88. Ścieżki `halt_unsupported` nie pokrywa osobny test (NIE_ZMIERZONO, dług).

Uwaga: generator (`_beginAutoBatchPhase`, `_ffEnterAuto`) nadal rzuca `Error` w harnessie node; wektory nie wchodzą w te ścieżki (`withBreach`/`withTower` są oblężeniem AUTO), więc nie wpływa to na wynik.

## 6. METODA budżetu — ODRZUCAM część, test osobny PRZYJMUJĘ jako dług

Fakt: pin liczy budżet w `_runFastForward` zegarem ściennym (40 ms, odczyt 10 ms na krok), a Rust używa `max_steps = 50_000_000` w jednym wywołaniu `run`. Generator wykonuje pin w wielu wywołaniach `_runFastForward` (3–4 iteracje każde, zegar 10 ms). Rust i pin dają ten sam ślad zdarzeń i stan końcowy na 360/360 sekwencjach, czyli podział na kroki w tym zestawie nie zmienia wyniku. To jest dowód niejawny, a nie osobny test. Osobnego testu niezależności od podziału (np. z wielokrotnym `run` z małym `max_steps`) nie dodaję: obecne `run` zaczyna od `begin_turn` i nie ma API wznowienia, więc taki test wymagałby zmiany API. Traktuję jako dług.

## 7. ROZMIAR vectors.json — PRZYJMUJĘ jako uwagę

Po regeneracji (poprawka 2) plik ma 7,1 MB (wcześniej 10,8 MB). Nie skracam ani nie kompresuję w tej rundzie; decyzja do FC/właściciela (np. skrócenie liczby sekwencji lub format kompaktowy).

## Gdzie co jest

- Kod: `rust-port/engine/src/domain/siege_tactics_loop.rs` (ratio, halt_unsupported, import `army_leadership`).
- Generator: `rust-port/engine/tests/p6_siege_tactics_loop_gen.mjs` (wycinek morale z pinu, guard SHA).
- Wektory: `rust-port/engine/tests/p6_siege_tactics_loop_vectors/vectors.json`.
- Poza commitem: `rust-port/engine/Cargo.lock` (wygenerowany przez build, NIE commitowany wg dispatchu).

## NASTĘPNY KROK

Evaluator/FC: zweryfikować poprawki 2 i 5 (dowód powyżej) oraz potwierdzić werdykty 1, 3, 4, 6, 7 jako NIE_ZMIERZONO. #91 pozostaje otwarte do złożenia K5H/K5I (single_blow_full) i portu wież.

DEPLOY/PUSH: NIE WYKONANO
