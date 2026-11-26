# R-RUSTPORT-P4-413-FQ-SPEED-MIDCHANGE-DIV-Q1 — Evaluator r1 (adwersarialny)

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-413-FQ-SPEED-MIDCHANGE-DIV-Q1
GOAL: koniec KAŻDEGO odcinka `_raf` w toku przy zmianie prędkości wyznaczany siatką klatek obowiązującą w klatkach odcinka, jak w pinie `07d2fbd72`; bez zmian przy stałej prędkości; 40/40 wektorów, lista `ROZBIEZNE_FQ_SPEED_MIDCHANGE` pusta.
ZMIANY/COMMIT: oceniany kod Operatora `d70c4cf7c` (gałąź `rust-port-wip/413-fq-speed-midchange-div`), baza `31b47d9d954b2638dcb049c990a0373ed848de54` = `origin/rust-port/parity-v2` (merge-base potwierdzony, brak przesunięcia). Evaluator nie zmienia kodu; jedyny plik tej rundy: ten raport.
TESTY: odtworzone przez Evaluatora (§2) — engine fmt 0 / clippy 0 / pełny test 0 (558 binarek, 4364 passed / 0 failed / 1 ignored); client fmt 0 / clippy 0 / test 0 (66 passed); renderer gpu OFF fmt 0 / clippy 0 / test 0 (758 passed, `Cargo.lock` cofnięty). Mutanty: 9 (§4), z czego 1 nierównoważny przeżywa wszystkie testy. Sonda pinu (generator z rozszerzonym obserwatorem, §3.2): 74 przypadki, 0 zastosowanych.
BLOKADY: brak infrastrukturalnych. Zarzuty Z1 (GOAL niedomknięty, raport §3.5 nieprawdziwy) i Z2 (nierównoważny mutant przeżywa) wymagają rundy Operatora.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (`02a-obrona.md`) → runda r2 Operatora z poprawkami Z1/Z2 (ten sam ID).
DEPLOY/PUSH: NIE WYKONANO.

## 1. Zgodność z dispatchem (rzeczy sprawdzone i w porządku)

- Baza: `git merge-base rust-port-wip/413-… origin/rust-port/parity-v2` = `31b47d9d9…` = parity-v2 w chwili oceny. OK.
- Allowlista: diff `31b47d9d9..d70c4cf7c` = `siege_tactics_loop.rs` (+701), `siege_battle_session.rs` (+6, poza listą, uzasadnione w §3.4: jedyny punkt `set_speed_idx`, kontrakt publiczny bez zmian), `p6_k5loop_wiring_a_pin.rs` (lista 9 → `[&str; 0]` + zmiana warunku kontroli czułości strażnika), raport. Wektory, generator i `gra/` bez zmian; MD5 `speed_change_vectors.json` = `a374deaea878eca21ff4166817fb03a9`.
- Zmiana testu poza literą allowlisty (§6.1 Operatora): sprawdzona. Warunek `listed || ROZBIEZNE_FQ_SPEED_MIDCHANGE.is_empty()` utrzymuje kontrolę czułości strażnika (asercja `straz_sprawdzona` nadal wymaga wykrycia podmienionego zdarzenia); żadna asercja ani mutant sterownika nie usunięte/osłabione (`git diff | grep '^-.*assert'` = 0 linii). Brak `#[ignore]`. Uwaga przyjęta.
- Pin (`git show 07d2fbd72:gra/src/battle/battleScene.ts`): `_now()` = `vNow` (`:9403`); `_setSpeedIdx` (`:9518-9527`) zmienia tylko `speedMul`; `_doMove` (`:8752-8775`) kończy przy `p >= 1` sprawdzanym w każdej klatce; `_doMeleeAttack` (`:9115-9172`) cios przy `localT >= BLOW_HIT_T`, koniec lunge przy `localT >= BLOW_LUNGE_MS`, potem `_schedule(BLOW_SETTLE_MS)` z tej klatki; trafienie strzału w callbacku `_schedule(RANGED_FLY_MS)` z `_now()` = klatka odpalenia (`:9223-9228`); `_drainTimers` (`:9616-9634`) nie przesuwa `vNow` do `due`. Opis Operatora §1 zgodny z tekstem pinu.
- Oczekiwania testów jednostkowych przeliczone ręcznie z pinu: `cios_w_trakcie_wypadu_na_nowej_siatce_w_dol` (1064 + 6·16 = 1160 ≥ 1160) i `ogon_wypadu_po_zmianie_przed_ciosem` (siatka 32 od 1016: cios 1176, koniec lunge 1272 ≥ 1260, `due` 1492, odpalenie 1496) — poprawne.
- Wybór techniczny (przeliczenie przy `set_speed_idx` zamiast pętli per klatka) — zasadny: siatka po zmianie jest jednorodna do następnej zmiany, więc „pierwsza klatka `vNow + k·F ≥ target`” jest dokładnie tym, co pin wyznaczy klatka po klatce; strażnik bitowej zgodności `due` daje tożsamość przy stałej prędkości (potwierdzone: wszystkie stare wektory zielone).

## 2. Bramki odtworzone (Evaluator, własne `CARGO_TARGET_DIR` w scratchpadzie, usunięte; jeden build naraz)

| Crate | fmt --check | clippy --all-targets -D warnings | test --all-targets --no-fail-fast |
|---|---|---|---|
| engine | EXIT 0 | EXIT 0 | EXIT 0 — 558 binarek, 4364 passed / 0 failed / 1 ignored |
| client | EXIT 0 | EXIT 0 | EXIT 0 — 66 passed |
| renderer (gpu OFF) | EXIT 0 | EXIT 0 | EXIT 0 — 758 passed; przepisany `renderer/Cargo.lock` cofnięty |

Dysk przed bramką renderera: 14 GB wolnego, brak innych buildów. Po rundzie: brak procesów `cargo`, worktree czysty.

## 3. Zarzuty

### Z1 (BLOKUJĄCY) — dwa odcinki `_raf` w sesji nie są przeliczane; raport §3.5 twierdzi inaczej

GOAL dispatchu: „chwila KOŃCA **każdego** odcinka w toku (…, krok ruchu, …)”. Plan `_raf` (`put_raf_plan`) powstaje tylko w trzech miejscach: `attack_tail` (cios), `take_tail` (koniec lunge), `march_advance`/`MarchStage::StepEnd` (krok marszu przyrostowego). Pozostają dwa kroki `_doMove`, które w sesji produkcyjnej (`march_incremental = true`) są liczone ATOMOWO jako `BodyDone` bez planu, więc `SiegeLoop::respeed` ich nie rusza:

1. **Falanga, jeden krok** — `ProdBody::phalanx_action`, gałąź `PhalanxDecision::Move` (`siege_tactics_loop.rs` ok. `:5310-5316`): `body_step(...)` → `PhalanxRun::Finished(step_ms(..), ..)` → `start` zwraca `dur` = `frame_raf(F, MOVE_STEP_MS)` → `schedule_body(.., RafPlanKey::Done(u))` bez planu. Pin: `_phalanxAction` `:6641` `this._doMove(ru, nc, nr, () => { done(); })` — koniec przy `p >= 1` w klatce NOWEJ siatki. Ścieżka falangi nie ma wariantu przyrostowego (sprawdzone: brak `march_incremental` w gałęzi `phalanx`, `:6112-6122`).
2. **`_advanceToward`** (oblężenie atakującego) — `ProdBody::siege_atk_advance_toward` (`:7436-7488`): `dur: step_ms(&res, self.frame_ms)` → `BodyDone` bez planu; wołane z `:5979` i `:7326`. Pin: `_advanceToward` `:7892-7916` kończy się `this._doMove(ru, nc, nr, done)`.

Mechanizm rozjazdu jest identyczny z tym, który Operator zmierzył dla 122/333/118/rt_mur (klasa „koniec kroku skwantyzowany starą siatką”), tylko w innej gałęzi ciała. Raport §3.5 („Odcinki NIE objęte: … z `attack_pre > 0` (… poza sesją) … W sesji marsze są przyrostowe”) pomija oba przypadki — jest nieprawdziwy co do kompletności.

Pomiar (dowód, że wektory tych ścieżek nie pokrywają): kopia generatora (poza repo, `p6_k5loop_wiring_a_gen.mjs` z dodatkowym obserwatorem: znacznik `ru.phalanx` i flaga wywołania `_advanceToward` przy `_doMove`, bez zmiany tekstu pinu, strażnik SHA-256 zielony) z nowymi rodzajami chwili zmiany `movingPh`/`movingAdv`, para x64→x1, `afterRound: 1`, dla wszystkich 37 scenariuszy bazowych z klatką produkcyjną = 74 przypadki: **0/74 zastosowanych** (`POMINIETY … 0/1 zmian` w każdym; wszystkie 4 części EXIT 0). Żaden scenariusz bazowy nie wykonuje kroku falangi ani `_advanceToward` po 1. turze, więc 40/40 wektorów nie mówi nic o tych gałęziach — rozjazd tam jest NIE_ZMIERZONY wektorowo, ale wynika wprost z kodu (brak planu ⇒ `due` siatką sprzed zmiany).

Wymagane w r2:
- plan `RafPlan { ms: MOVE_STEP_MS, then: 0, frame }` dla `RafPlanKey::Done(unit)` w obu gałęziach, gdy krok wykonany (`step_ms > 0`; przy odmowie `_siegeMoveRefused` krok = 0 i plan zbędny — strażnik i tak go odrzuci);
- test jednostkowy każdej z gałęzi (zmiana prędkości w połowie kroku, oczekiwanie z pinu jak w `koniec_kroku_marszu_na_nowej_siatce`);
- jeśli to możliwe — wektor pinu (scenariusz bazowy z falangą i z `_advanceToward`), inaczej jawny wpis NIE_ZMIERZONO w raporcie;
- korekta §3.5 raportu (pełna lista odcinków `_raf` z pinu: `_doMove` z każdego wołającego, `_doMeleeAttack`; które mają plan, które są nominalne `_schedule`).

### Z2 (BLOKUJĄCY) — nierównoważny mutant `respeed` przeżywa wszystkie testy

Mutant E4: usunięcie aktualizacji `p.anchor = now; p.frame = frame;` w `SiegeLoop::respeed` (plan po przeliczeniu zostaje z kotwicą i klatką sprzed zmiany). Wynik: lib `respeed_tests`/`p413_*` EXIT 0, wektory `zmiana_predkosci_*` EXIT 0 — **przeżywa**.

Nie jest równoważny. Kontrprzykład (dwie zmiany w jednym klocku ogona): cios przy x64 (siatka 1024) w chwili `t`, koniec lunge (`target = t0 + 260`) zaplanowany na starej siatce `E1 ≥ t + 1024`; zmiana na x1 → poprawnie `E2` = pierwsza klatka siatki 16 ≥ target, `due = E2 + 220`; lunge kończy się w `E2`; kolejna zmiana (np. na x8) w trakcie settle, `now > E2`. Kod Operatora: `end_old = E2 ≤ now` ⇒ bez zmian (pin: `_schedule(220)` jest nominalny). Mutant: `end_old = E1 > now` ⇒ przelicza `due = now + 220` ≠ `E2 + 220`. Rozjazd z pinem o ≥ 1 klatkę, niewykryty.

Wymagane w r2: test jednostkowy z dwiema zmianami w jednym odcinku (co najmniej: druga zmiana w trakcie settle po końcu lunge wyznaczonym nową siatką; oraz druga zmiana w toku kroku po pierwszej), który zabija E4.

### Uwagi (nieblokujące, do decyzji Obrony/FC)

- U1 — pokrycie wektorowe gałęzi: mutanty E3 (brak `+ then` w `respeed`), E7 (strażnik planu przyjmuje każdy plan) i E8 (brak planu ciosu w `attack_tail`) zabijają WYŁĄCZNIE testy jednostkowe; wektory 40/40 przechodzą. Wektory nie zawierają więc zmiany „po ciosie przed końcem lunge” ani przypadku, w którym przeliczenie chwili CIOSU zmienia klatkę (3 wektory klasy L naprawia `take_tail`, nie `respeed`). Przy E8 test strukturalny `p413_cios_wreczny_ma_plan_raf_od_chwili_wywolania` jest jedynym strażnikiem produkcyjnego `ProdBody`. Zalecenie: wektor pinu `lunge` z parą, w której cios przesuwa się o klatkę (np. x4→x1 tuż po starcie wypadu).
- U2 — doc-komentarz przesunięty: `put_raf_plan` wstawiono między doc-komentarz `begin_shot` (`K5LOOP-CLOSE r3/r4: wystrzał _doRangedAttack …`, `:5316-5321`) a `fn begin_shot`; ten opis jest teraz doc-komentarzem `put_raf_plan`, a `begin_shot` nie ma żadnego.
- U3 — `SiegeLoop::raf_plans` rośnie bez ograniczeń między zmianami prędkości (wpisy dla odpalonych klocków usuwane wyłącznie w `respeed`); przy długiej bitwie bez zmiany prędkości — tysiące martwych wpisów i liniowe `find` przy pierwszym `respeed`. Brak wpływu na wynik (identyfikatory zegara unikalne), ale do posprzątania (np. przy odpaleniu klocka albo `retain` po `id` obecnych w kolejce).
- U4 — akcje renderera `Melee.hit_at`, `Shot.land_at`, `TowerShot.land_at` dalej liczone w chwili startu (Operator §3.5, dług #405) — przyjęte jako poza zakresem D-413-2, do rejestru.

## 4. Mutanty (każda nowa gałąź; Evaluator, zastosowane na kopii pliku i cofnięte, worktree czysty)

Polecenia: `cargo test --lib -- respeed_tests p413_` oraz `cargo test --test p6_k5loop_wiring_a_pin -- zmiana_predkosci`.

| ID | Mutacja | lib (EXIT/FAIL) | wektory (EXIT/FAIL) | Wynik |
|---|---|---|---|---|
| E1 | `respeed` = no-op | 101 / 3 | 101 / 1 | zabity |
| E2 | `end_old <= now` → `<` | 0 | 0 | przeżywa — równoważny (przy `end_old == now`: `then = 0` ⇒ klocek już odpalony i nieobecny w kolejce; `then > 0` ⇒ `first_frame_at_or_after(now, F, target ≤ now) = now`, ten sam `due`) |
| E3 | `respeed` bez `+ p.then` | 101 / 1 | 0 | zabity tylko lib (U1) |
| E4 | bez `p.anchor = now; p.frame = frame` | 0 | 0 | **przeżywa — nierównoważny (Z2)** |
| E5 | `complete_shot`: zawsze `hit_at` | 101 / 1 | 101 / 1 | zabity |
| E6 | `take_tail`: zawsze ogon z `start` | 101 / 1 | 101 / 1 | zabity |
| E7 | strażnik planu bez porównania bitowego `due` | 101 / 1 | 0 | zabity tylko lib (U1) |
| E8 | brak planu ciosu w `attack_tail` | 101 / 1 | 0 | zabity tylko lib (U1) |
| E9 | brak planu końca kroku (`StepEnd`) | 101 / 1 | 101 / 1 | zabity |

8 mutantów sterownika z #412 (`zmiana_predkosci_w_trakcie_mutanty_sterownika_daja_fail`): zielone w pełnym `cargo test` engine (zabite).

## 5. Pozycje 9 → 0

Atrybucja Operatora (§2, tabela wyłączeń) zgadza się z moimi mutantami: E1 (bez `respeed`) psuje wektory klasy „koniec kroku” (E9 też), E6 psuje 3× L, E5 psuje 123/191. Lista pusta i 40/40 potwierdzone w pełnym teście (EXIT 0). Kryterium 1 i 2 dispatchu spełnione; kryterium 3 („dla każdej zmiany w kodzie test odcinka w toku”) i GOAL („każdego odcinka”) — nie, z powodu Z1/Z2.

## 6. Werdykt

FAIL. Rdzeń naprawy jest poprawny i zgodny z pinem (9 → 0, bez regresji w 4364 testach, client 66, renderer 758), ale: (Z1) dwa odcinki `_doMove` w sesji (krok falangi, `_advanceToward`) zostały bez przeliczenia, a raport twierdzi, że nieobjęte są tylko odcinki spoza sesji; (Z2) aktualizacja kotwicy/klatki planu w `respeed` nie ma żadnego strażnika — nierównoważny mutant przeżywa. Oba do poprawy w r2 tym samym ID; U1–U3 zalecane przy okazji.
