STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5H-Q1
GOAL: obrona Operatora (runda 1/5) wobec 4 zarzutow Evaluatora z 02-evaluator.md (commit 1fa5e81c0, poza tym branchem).
ZMIANY/COMMIT: baza fdc7847a1 (operator r1). Zmieniony tylko rust-port/engine/src/domain/siege_tactics_activate.rs (komentarze/kontrakt, zero zmian logiki) i ten raport. SHA poprawki: patrz sekcja SHA. Brak push, brak integracji, brak gra/, brak Cargo.lock.
TESTY (CARGO_TARGET_DIR poza repo, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0):
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 56 passed, EXIT 0
- cargo test --test p6_siege_tactics_activate: 2 passed, EXIT 0
- Pozostale suity siege (end, endcheck, breach, walk, tower, blow, autobatch): EXIT 0, 7 suit ok (uruchomione po pierwszej poprawce komentarzy). Druga poprawka (komentarze traitu ActivateOps) zmienila wylacznie `///`; po niej ponowiono fmt, clippy, lib i activate (zielone).
BLOKADY: brak.
RUNDY: 1/5 (obrona)
NASTEPNY KROK: Evaluator (r2) ocenia 02a-obrona.md i commit SHA; Final Control po PASS.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1: brak wolajacego w Rust; zaleznosc od petli tury nieudokumentowana. PRZYJMUJE (dokumentacja + dowod)
Dowod stanu faktycznego: `grep -rn "activate_unit\|siege_tactics_activate" rust-port` daje tylko `domain/mod.rs:96` (rejestracja) i samo siege_tactics_activate.rs. Wolajacego nie ma, zgodnie z zarzutem.
Poprawka: w `//!` modulu dopisano sekcje "Wolajacy i zaleznosci" z: brakiem wolajacego, wymaganiem petli tury (K5F/K5G, `done()`) i przypisaniem tresci delegatow do linii pinu (`_advanceToward` :7892 -> K1/K1b; `_doAttack` :8787 -> `_singleBlow` :8809 (K5I); `wallEverBreached` :7647, :7759, :8073 -> K4; wieze -> K3 przez `tower_ops`).
Dokument K5 (`b2336c005:dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md`) jest poza allowlista Operatora i NIE zostal zmieniony. Dopisanie tam zalecam przy integracji (wlasciciel: orkiestrator).

### Zarzut 2: zakres wezszy niz GOAL (K1/K1b/K4/K5I niewolane; K3 tylko adapter; BlowInput do zrobienia). ODRZUCAM w czesci dotyczacej K1/K1b/K4/K5I, PRZYJMUJE uwage o K3 i BlowInput jako otwarte zadanie
Dowod z pinu (`gra/src/battle/battleScene.ts`, pin 07d2fbd72, zakres `_activateUnit` :6048-6299): wywolania w tym zakresie to wylacznie `_doAttack`, `_advanceToward`, `_attackWallTile`, `_rangedAction`, `_fleeStep`, `_cavalryAction`, `_phalanxAction`, `_advanceStep`, `_fallBackStep`, `_startRout`, `_performPlayerOrder`, `_executeGroupDoctrineStep`, oraz zapytania `_rangedTargetInRange`, `_targetInRange`, `_advanceCoord`, `_nearestEnemy`, `_applyTerrainRange`, wieze K3. Brak bezposredniego wywolania `_singleBlow`, `_siegeWalkTo`, `_siegeMoveRefused`, `_siegeSafeApproach` ani `wallEverBreached` w tym zakresie (sprawdzone grepem).
Ciala delegatow: `_doAttack` :8787 -> `_singleBlow` :8809 (K5I); `_advanceToward` :7892 -> `_siegeWalkTo` :8006 / `_siegeSafeApproach` :8107 / `_siegeMoveRefused` :7963 (K1/K1b); `wallEverBreached` ustawiany w :3721, :7647, :7759, :8073 (K4), poza cialem `_activateUnit`.
Wniosek: zgodnie z GOAL (wyjscie = zamiary/zdarzenia, "NIE portuj efektow sceny") te moduly nie sa wolane przez maszyne z definicji; ich wiazanie to klocki delegatow. Dotyczy to K1, K1b, K4 i K5I.
Uczciwie zaznaczam rozbieznosc: litera GOAL ("funkcje K1/K1b/K3/K4/K5I jako wywolania istniejacych modulow") nie jest spelniona dla K1/K1b/K4/K5I w tym klocku. Interpretacja "zdarzenia-zamiary" jest zgodna z reszta dispatchu, ale orkiestrator powinien to potwierdzic przy Final Control.
K3: uwaga trafna. Adapter `tower_ops` to trzy przekazania do `siege_tactics_tower`. Logike K3 pokrywaja jego wlasne testy (`p6_siege_tactics_tower`, 12 testow zielone). Test `adapter_k3_wieza_przy_murze_konczy_na_ram_tower_step` sprawdza tylko scenariusz ram-tower w sciezce aktywacji.
BlowInput (K5I-2): nie ma go w tym klocku, bo cios jest w `_doAttack`, a ten jest zamiarem. To otwarte zadanie (K5I-2 / K5I2b), nie defekt K5h.

### Zarzut 3: wektory skryptuja zapytania jedna stala na aktywacje; kolejnosc wywolan nieudowodniona. ODRZUCAM (dowod), z dopiskiem dokumentacyjnym
Dowod czystosci zapytan w pinie: `_rangedTargetInRange` :7041 (tylko lokalne `best`, `bestD`, zwrot), `_targetInRange` :8373 (lokalne `enemies`, `inReach`, zwrot), `_advanceCoord` :6537 (`return ru.side === 'atk' ? ru.q : -ru.q`), `_nearestEnemy` :8296 (lokalne `best`, `bestD`, zwrot). Zadna z nich nie zapisuje stanu.
Wartosci zapytan zaleza wylacznie od stanu. W obrebie aktywacji stan zmienia sie tylko przez `ru.dryCol`/`ru.heldAfterFallback` (flagi ustawiane w galeziach, nie wplywajace na zapytania przed nimi) i przez zdarzenia (ruch/atak), po ktorych maszyna wraca. Jedyna sekwencja z dwoma `_advanceCoord` (U7.6: :6251 dryCol, :6263 movedBack) ma miedzy nimi tylko `_targetInRange` (czysta) i brak ruchu, wiec obie wartosci sa rowne.
Zastrzezenie NIE_ZMIERZONO: liczba i kolejnosc wywolan zapytan NIE sa w wektorach (wektory zapisuja zdarzenia, tagi galezi i stan). Dowod opiera sie na czystosci kodu pinu. Kolejnosc wywolan w galezi U7.6 w Rust (advance_coord, target_in_range, advance_coord, nearest_enemy_pos) jest zgodna z kolejnoscia w pinie wg przegladu Evaluatora; nie jest to dowiedzione testem. Uzupelnienie testowe (licznik wywolan w generatorze) nie jest wymagane do zamkniecia kryterium binarnego GOAL.
Dopisek: odkrylem, ze `_targetInRange` i `_rangedTargetInRange` czytaja `ru.range` (dla `canShoot`). Wynik zapytan zalezy wiec od `range` po `_applyTerrainRange`. Dopisano to do dokumentacji traitu `ActivateOps` (kontrakt kolejnosci). Zmiana sygnatur (przekazanie `&ActivateUnit` do zapytan) to osobna decyzja dla integracji.

### Zarzut 4: flagi klas statyczne; wynik `_applyTerrainRange` nie wplywa; przyszly wolajacy musi liczyc po `_applyTerrainRange`. PRZYJMUJE dokumentacje kontraktu; ODRZUCAM wymog kolejnosci
Dowod: `canShoot(ru)` = `return ru.rangedBase && ru.ammoLeft > 0;` (pin :1457). Predykat NIE czyta `range`, wiec `_applyTerrainRange` na niego nie wplywa. `isSiegeUnit(bu)` :1552 i `isSiegeTower(bu)` :1561 czytaja `bu.stats`, a `_isRam(bu)` :7402 czyta `bu.stats`/`bu.nazwa`. Sa to wiec wlasciwosci jednostki, nie aktywacji.
Stalosc w aktywacji: `ammoLeft` zmienia sie tylko przez atak (zdarzenie `Attack`), po ktorym maszyna zwraca `return`. Flagi sa wiec stale w jednej aktywacji.
Poprawka: w polu `ActivateUnit::can_shoot` dopisano kontrakt (liczyc PRZED wywolaniem, stan sprzed aktywacji; predykat nie czyta `range`). Logika bez zmian.

## SHA
Poprawka (komentarze + kontrakt w siege_tactics_activate.rs, raport 02a-obrona.md): patrz git log HEAD na galezi detached (commit po fdc7847a1).
