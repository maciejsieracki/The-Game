STATUS: BLOCK
DOMAIN: INFRA
BLOKADA_GŁÓWNA: pełna bramka `cargo test --all-targets --no-fail-fast` nie zakończona: wolne miejsce spadło do 6,0 GB (próg 8 GB). Zarzuty merytoryczne przyjęte bez zmiany kodu (sekcja niżej).
TEMAT: R-RUSTPORT-P6-K5DOC-T6-JAZDA (#259) — obrona Operatora r6 na zarzuty Evaluatora r6
GOAL: Odpowiedź na 6 zarzutów Evaluatora (kod na `1af81a8c3`, integracja r5/r6), z dowodem; ewentualna naprawa wyłącznie w zakresie allowlisty.
BAZA: `bdc625b4e` (HEAD worktree; kod identyczny z `1af81a8c3` — `git diff 1af81a8c3 HEAD` = tylko `04-integracja-r6.md`).
ZMIANY/COMMIT: brak zmian kodu w tej obronie. Commit tej obrony = raport `02a-obrona.md` (SHA w sekcji DEPLOY/PUSH niżej). Brak push, brak FF na parity.
TESTY: patrz sekcja „Bramka pełna w obronie” niżej.
BLOKADY: brak blokad kodu. Kryterium procesu „df >= 8 GB przez cały przebieg” nie zostało spełnione w przebiegu Ewaluatora (zarzut 5) — pełna bramka w tej obronie została uruchomiona ponownie, wynik i minimum wolnego miejsca w sekcji niżej.
RUNDY: r6 obrona (Operator r6). Poprzednie obrony: 02a-obrona.md w historii gita (r1).
NASTĘPNY KROK: Ewaluator r6 (ponowna weryfikacja z własnym EXIT) i Final Control na SHA raportu obrony; orkiestrator decyduje o FF na parity po FC PASS.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. Krok 4 `_cavalryAction` (`best_charge_step` po forsowanym ataku) nieosiągalny: PRZYJMUJĘ (fakt), ODRZUCAM konieczność poprawki
- Zweryfikowane w kodzie (`rust-port/engine/src/domain/siege_tactics_cavalry.rs`):
  - `cav_maneuver_step` (linie 268–310) zwraca `None` tylko wtedy, gdy żaden sąsiad nie przechodzi filtra (`occupied`, `passable`, `in_bounds`); każdy przechodzący sąsiad dostaje skończony wynik, a porównanie `score > best_score` startuje od `NEG_INFINITY`, więc `None` = brak kandydata.
  - `best_charge_step` (linie 313–359): gałąź BFS (`bfs_first_step`, linie 169–190) i gałąź `mounted` używają tego samego filtra sąsiedztwa; ostatni fallback `step_toward_local` (linie 227–245) też. Każde `Some` wymaga więc wolnego, przejezdnego sąsiada.
  - Wniosek: krok 4 w `cavalry_action_decide` jest martwy, bo do niego dochodzi się tylko przy `cav_maneuver_step == None` i `moves > 0`. Krok zostaje 1:1 z pinem (`_cavalryAction`, `battleScene.ts:6372–6428`) i jest opisany w komentarzu kodu.
- Decyzja: bez zmiany kodu (dispatch r6: „Kodu NIE zmieniaj”; Evaluator sam stwierdził „nie wymaga poprawki”). Wektor (e) testuje `best_charge_step` wprost, co dispatch przewidział dla (e) (`szarża best_charge_step_key jako ostatnia szansa`).
- Zastrzeżenie: dowód po stronie pina (`_firstStepAlongPathToAttack` i `_stepToward` na `07d2fbd72` też wymagają wolnego sąsiada) nie był sprawdzony linia po linii w tej obronie; dowód dotyczy implementacji Rust.

### 2. `_doMove` emulowany minimalnie (zajętość, pozycja, moveLeft): PRZYJMUJĘ jako ograniczenie zakresu
- Zgadza się: `apply_move` (linia ~361) robi wyłącznie przesunięcie kafelka, zajętość i `moves_left -= 1`. Koszt terenu i facing `_doMove` nie są w T6.
- Wektory T6 nie dowodzą pełnego parytetu `_doMove`. To świadome: pełny `_doMove` to T4c (#314), poza zakresem T6 (dispatch: „wpięcie do T8 / #113”).
- Decyzja: bez zmiany kodu w T6. Wymóg dla T8 / #113: wektory end-to-end z pełnym `_doMove` przed wpięciem. Zapis do `REJESTR-RUST.md` po stronie orkiestratora.

### 3. Dispatch mówi o 7 plikach T6, diff ma 5 kodu/testów + raporty: PRZYJMUJĘ jako rozbieżność opisową
- Faktyczny `git diff --stat 625624d97 HEAD` (9 plików, 402 204 wstawień):
  - kod i testy (5): `rust-port/engine/src/domain/mod.rs` (+1), `siege_tactics_cavalry.rs` (+466), `tests/p6_k5doc_cavalry.rs` (+276), `tests/p6_k5doc_cavalry_gen.mjs` (+411), `tests/p6_k5doc_cavalry_vectors/vectors.json` (+400876);
  - raporty w katalogu run (4): `01-operator-r1.md`, `02a-obrona.md`, `03-integracja-r5.md`, `04-integracja-r6.md`.
- Wszystkie w allowliście T6. Brak `Cargo.lock`, brak zmian w `gra/`, `view-model/`, `renderer/`, brak zmian `siege_tactics_activate.rs`.

### 4. Poprzedni BLOCK Operatora r6 dotyczył wyłącznie progu dysku, nie kodu: PRZYJMUJĘ (fakt)
- Potwierdzone: `04-integracja-r6.md` (BLOCK: „pełna bramka nie mogła się zakończyć przy dysku spadającym poniżej 8 GB”), a kod nie zmieniał się (`git diff 1af81a8c3 bdc625b4e` = tylko raport).
- Wynik pełnej bramki na tym samym kodzie pochodzi z r5 (`03-integracja-r5.md`: fmt EXIT 0, clippy EXIT 0, `p6_k5doc_cavalry` 10/10, pełny `cargo test --all-targets --no-fail-fast` EXIT 0, passed=3810, failed=0, ignored=1 — pre-existing, `p6_order_lane.rs:1530`). Start r5 przy 9,8 GB; minimum wolnego w trakcie r5 NIE_ZMIERZONO.

### 5. Wolne miejsce spadło do 7,1 GB w trakcie pełnego testu Ewaluatora: PRZYJMUJĘ (kryterium procesu nie spełnione)
- Kryterium dispatchu r6 („df >= 8 GB przez cały przebieg”) nie zostało spełnione w przebiegu Ewaluatora. Zielony wynik nie zamienia się więc automatycznie w spełnione kryterium procesu.
- Naprawa: ponowny pełny przebieg w tej obronie (patrz „Bramka pełna w obronie”), z monitorowaniem `df -k /` co 20 s i zapisem minimum. Pełny test nie był uruchamiany przy 4,9 GB ani przy innych ograniczeniach.

### 6. Mutacje (a)–(e): FAIL, przywrócono do HEAD, drzewo czyste: BEZ ZARZUTU (fakt przyjęty, nieweryfikowany w tej obronie)
- Zarzut dotyczy wyniku Ewaluatora, nie Operatora. Stan drzewa tej obrony: `git status --short` puste na `bdc625b4e` przed zapisem raportu. Wyników mutantów nie powtarzałem (poza zakresem obrony; wymagają osobnego przebiegu i czasu).

## Bramka pełna w obronie
- Uruchomiona na `bdc625b4e` (kod = `1af81a8c3`), `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie tej obrony (usunięty po zakończeniu).
- Start: `df -k /` = 9 641 960 KB (9,2 GiB). Monitorowanie co 20 s w `obrona-t6/watch.log`.
- Wynik (log: `obrona-t6/gate.log`, scratchpad tej obrony):
  - `cargo fmt --check` (rust-port/engine): EXIT 0.
  - `cargo clippy --all-targets -- -D warnings`: EXIT 0.
  - `cargo test --all-targets --no-fail-fast`: NIE ZAKOŃCZONO. Przerwane przeze mnie (kill) przy wolnym miejscu na `/` = 6 249 316 KB (6,0 GB, poniżej progu 8 GB; minimum w przebiegu = 6,0 GB; start 9,2 GB). W częściowym wyjściu (1347 linii `... ok`) nie znaleziono `FAILED` ani `panicked`; liczby passed/failed/ignored dla całości: NIE_ZMIERZONO. Test `pick_auto_improvements_matches_pinned_web_vectors` trwał >60 s (zgłoszony już jako #291); nie diagnozowano go w tej obronie.
  - Po przerwaniu: procesy tej bramki zabite, `target` w scratchpadzie usunięty, dysk 9,2 GB wolnego.
- Wniosek: kryterium „df >= 8 GB przez cały przebieg” nie zostało spełnione także w ponowionym przebiegu obrony (zarzut 5 potwierdzony). Pełna bramka na `1af81a8c3` pozostaje BLOCK INFRA (dysk) do czasu przebiegu przy df >= 8 GB przez cały czas. Wolne miejsce spada w trakcie współbieżnych cargo innych worktree, nie tylko przez ten temat.

## Wynik obrony
- Zarzuty 1, 2, 3, 4, 6: przyjęte jako fakty/ograniczenia, bez zmiany kodu (dowody wyżej).
- Zarzut 5: przyjęty. Naprawa = pełny przebieg z dyskiem >= 8 GB przez cały czas (wynik w sekcji „Bramka pełna w obronie”).
- Status BLOCK (INFRA): zarzuty merytoryczne przyjęte; temat nie może przejść do FC bez pełnej bramki przy df >= 8 GB przez cały przebieg. Uwagi 1 i 2 (zakres T8) są zapisem do rejestru, nie blokadą tej rundy.
- Do wznowienia: jeden przebieg `cargo test --all-targets --no-fail-fast` w `rust-port/engine` na `1af81a8c3` (drzewo kodu identyczne z `bdc625b4e` minus raport), z df >= 8 GB przez cały czas; przy spadku poniżej 8 GB przerwać i zapisać BLOCK z liczbą GB.
