STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-MERGE-Q1 (etap 1, r2) — obrona Operatora na werdykt Evaluatora 9ae467057
GOAL: odpowiedź na każdy z 8 zarzutów: PRZYJMUJĘ (poprawka/notatka + dowód) albo ODRZUCAM (dowód). Bez zmiany kodu w tej rundzie.
ZMIANY/COMMIT: brak zmian kodu. Commit tylko raportu tej obrony (ten plik). Kod operatora bez zmian: dce632e4f. Baza obrony: 7caff90c0 (raport Operatora r2, zawiera dce632e4f).
TESTY: nie uruchamiano ponownie. Podstawa: bramki z raportu 01-operator-r2.md i odtworzenie Evaluatora (fmt, clippy, lib 114, p6_tower_target_wiring 6, p6_siege*). Dowody poniżej to odczyt kodu (git grep / git show) na dce632e4f.
BLOKADY: brak blokad technicznych. Jedna kwestia do rozstrzygnięcia przez orkiestratora: zarzut 8 (atrybucja commita), patrz punkt 8.
RUNDY: 2/5 (r1 BLOCK bez kodu, r2 etap 1 PASS-WITH-NOTES, obrona r2)
NASTĘPNY KROK: Final Control na 7caff90c0 (kod dce632e4f) z notatkami z tego pliku; zapis zarzutów 2, 3, 4, 5, 6 jako zadań etapu 2 / K5LOOP-WIRING w rejestrze (rejestr poza allowlistą tematu, zapis po stronie orkiestratora).
DEPLOY/PUSH: NIE WYKONANO (brak push do parity-v2, brak integracji).

## Dowody wspólne (dce632e4f, odczyt kodu)

- `pick_tower_target` wołany produkcyjnie: `rust-port/engine/src/domain/siege_tactics_loop.rs:176` (`fire_towers_by_pick`), wywołane z `fire_siege_towers` (`siege_tactics_loop.rs:214-216`), które implementuje `TurnSeqEnv` (`siege_tactics_turnseq.rs:138, 240`). Import: `siege_tactics_loop.rs:38`.
- `SiegeLoop::new` i `ProdBody::new` nie mają wołającego poza testami (`git grep` w `rust-port/engine/src` zwraca tylko definicje i komentarze; wołania: `tests/p6_siege_tactics_loop.rs:179`, `tests/p6_siege_tactics_loop_resume.rs:180`, `tests/p6_siege_tactics_loop_body*.rs`).
- `ProdBody::start` (`siege_tactics_loop.rs:~720-721`): gdy `st.siege_wall_col >= 0` zwraca `"oblezenie"` i NIE wywołuje `activate_unit`. Ścieżka oblężenia w ProdBody nie porusza jednostek i nie aktywuje ich.
- Nic w `rust-port/engine/src` nie zapisuje `activate.q` / `activate.r` poza konstrukcją (`git grep "\.q = "` na pliku pętli: brak trafień poza odczytami).

## Zarzuty

### 1. [średni] Wektory pokrywają tylko czystą funkcję; wiring testowany 5 testami ręcznymi
ODRZUCAM jako zarzut etapu 1.
Dowód: zakres etapu 1 w dispatchu r2 (kryterium 2) wymaga "Test z wektorami z generatora (wykonuje pin), strażnik SHA-256, liczniki > 0" dla `pick_tower_target`. Wektory `vectors_match_pin_pick_tower_target` (`tests/p6_tower_target_wiring.rs:58-69`, strażniki `FILE_SHA256`/`FRAGMENT_SHA256`, asercje liczników `:135-154`) spełniają to. Generator wykonujący `_fireSiegeTowers`/`_fireOneTower` to zakres etapu 2 (dispatch r2, sekcja "POZA ZAKRESEM ETAPU 1"). Pięć testów wiringu (`:244-304`) jest dodatkiem, nie wymogiem etapu 1.
Notatka do etapu 2: PRZYJMUJĘ, że generator wiringu z pinu powstanie w etapie 2.

### 2. [średni] Produkcyjne wołanie `siege_tactics_loop.rs:176` jest martwe do czasu wpięcia
PRZYJMUJĘ jako fakt, ODRZUCAM jako blokadę etapu 1.
Dowód: `SiegeLoop::new` / `ProdBody::new` wołane tylko w testach (patrz wspólne). Kryterium 1 dispatchu r2 brzmi "produkcyjny wołający `pick_tower_target` w `src/` (nie tylko w testach)" — spełnione literalnie (`:176`, `:214-216`). Wpięcie pętli to K5LOOP-WIRING (#113), poza allowlistą tego tematu.
Działanie: brak zmiany kodu. Zapis w rejestrze (`dyspozycje/REJESTR-RUST` lub odpowiednik) jako "ścieżka wież martwa do K5LOOP-WIRING" — wpis po stronie orkiestratora, bo rejestr nie leży w allowliście tematu.

### 3. [średni] `LoopBody::unit_cell` domyślnie `None` cicho pomija jednostkę; ProdBody czyta activate.q/r bez dowodu aktualizacji
ODRZUCAM w części dotyczącej produkcji; PRZYJMUJĘ jako notatkę na przyszłość.
Dowód (produkcja): `ProdBody::unit_cell` (`siege_tactics_loop.rs:696-699`) zawsze zwraca `Some((pu.activate.q, pu.activate.r))`, jeśli jednostka istnieje w `units[ix]`. Domyślne `None` (`:53-55`) nie jest osiągalne przez ProdBody. Brak pozycji dotyczy wyłącznie innych implementacji `LoopBody`, których w produkcji nie ma.
Dowód (aktualizacja pozycji): w ścieżce oblężenia ProdBody zwraca przed `activate_unit` (`:720-721`), więc w tym zakresie pozycje nie są używane do działania i nie zmieniają się. Pozycje startowe są zatem jedynym źródłem, a nic w produkcji ich nie porusza.
Notatka: gdy ruch zostanie zportowany (K5LOOP-RUCH, #123), trzeba dodać aktualizację `activate.q/r` i test; wtedy zarzut 3 staje się realny. Zapisać jako warunek wejścia do K5LOOP-RUCH.
Zmiana domyślnego `None` na błąd/panikę: NIE robię w tej rundzie (poza allowlistą semantyka traitu; cicha pomijalność jest świadomą decyzją dispatchu etapu 1 dla jednostek bez pozycji i pokryta testem `unit_without_cell_is_not_targeted`, `tests/p6_tower_target_wiring.rs:268-274`).

### 4. [niski] Wiersz wieży bez kafla muru pomijany; pin woła `_destroyTowerAtRow`
ODRZUCAM jako zarzut etapu 1.
Dowód: `_destroyTowerAtRow` jest na liście etapu 2 w dispatchu r2 ("POZA ZAKRESEM ETAPU 1 ... _destroyTowerAtRow"). Pominięcie wiersza bez efektu jest jawnie opisane w komentarzu `fire_towers_by_pick` (`:148-153`) i w raporcie 01-operator-r2.md.
Notatka do etapu 2: PRZYJMUJĘ — trzeba dodać `_destroyTowerAtRow` i stan zniszczenia wieży.

### 5. [niski] Brak strażników pinu: `finished`, `towerShooterRow`, `t.destroyed`
ODRZUCAM w zakresie etapu 1; PRZYJMUJĘ notatkę do etapu 2.
Dowód: `finished` — `begin_turn` (`siege_tactics_turnseq.rs:~233`) wychodzi przed `fire_siege_towers` gdy `st.finished`, więc strażnik `finished` jest zachowany przez sekwencję. `towerShooterRow` i `t.destroyed` należą do strzału i stanu zniszczenia, które są etapem 2 (dispatch r2: "strzał wieży przez `single_blow_full` i syntetyczny strzelec (statystyki z wiersza `towerShooterRow`)"). Etap 1 nie strzela: `fire_towers_by_pick` ustawia wyłącznie placeholder `dead` (`:160-190`), więc "strzał bez strzelca" nie zachodzi jako strzał. Placeholder jest dopuszczony dispatchem r2 ("Placeholder strzału (`dead = true`) MOŻE ZOSTAĆ").
Notatka do etapu 2: dodać strażnik `towerShooterRow` i `destroyed` razem ze strzałem.

### 6. [niski] Wybory liczone na starcie tury; pin liczy je w odstępach 180 ms
ODRZUCAM jako zarzut etapu 1.
Dowód: odroczenie `_schedule(180 ms)` i ponowne liczenie po trafieniach to zakres etapu 2 ("odroczenie wystrzału 180 ms przez `_schedule`" w sekcji POZA ZAKRESEM). Komentarz `fire_towers_by_pick` (`:~150-157`) i raport 01 opisują rozbieżność jawnie.
Notatka do etapu 2: PRZYJMUJĘ.

### 7. [niski] Placeholder `dead = true` zostaje; picks mogą się dublować
ODRZUCAM (dopuszczone i idempotentne).
Dowód: dispatch r2 dopuszcza placeholder w etapie 1. Dublowanie: `picked` może zawierać ten sam indeks, a `st.atk[idx].c.dead = true` (`:~190-193`) jest idempotentne, więc wynik stanu nie zmienia się. Test `picks_are_taken_before_placeholder_hits_land` (`tests/p6_tower_target_wiring.rs:278-290`) pokrywa kolejność wyborów przed placeholderami.
Notatka do etapu 2: drugi strzał w ten sam cel przy ranym HP musi być zrobiony razem z realnym strzałem.

### 8. [informacyjny] Commit ma Co-Authored-By z nazwą modelu wbrew dispatchowi
ODRZUCAM poprawkę (commit nie jest zmieniany). Konflikt zgłaszam orkiestratorowi do rozstrzygnięcia.
Fakt: `git show --stat dce632e4f` pokazuje trailer `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>` oraz `Claude-Session:` jako ostatnią linię. Dispatch r2 wymaga "bez nazwy modelu w treści commita".
Powód odrzucenia: instrukcja atrybucji commitów obowiązująca w tej sesji wymaga dokładnie tego trailera (linia Co-Authored-By dla Haiku 5.5 oraz Claude-Session). Dispatch nie jest instrukcją właściciela; to polecenie skryptu. Przepisanie commita usunęłoby wymagany przez atrybucję wiersz. Dlatego zostawiam dce632e4f bez zmian i zostawiam wybór orkiestratorowi: jeśli ma obowiązywać dispatch, trzeba przepisać commit (`git commit --amend` na dce632e4f, bez push) i wtedy trailer z modelem znika, a wiersz Claude-Session zostaje.

## Podsumowanie dla Final Control

- Przyjęte jako notatki (bez zmiany kodu): 2 (fakt martwej ścieżki, do K5LOOP-WIRING), 3 (warunek przy ruchu, K5LOOP-RUCH), 4, 5, 6 (zakres etapu 2).
- Odrzucone z dowodem: 1, 3 (część produkcyjna), 4, 5, 6, 7 (wszystkie jako zarzuty etapu 1), 8 (poprawka nie wykonana, do decyzji orkiestratora).
- Kod operatora bez zmian: dce632e4f. Ten plik nie zmienia kodu i nie zmienia bramek.
