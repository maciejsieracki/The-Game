# KOLEJKA RUST — otwarte tematy do uzupełniania slotów (maks. 4 operatorów naraz)

**Stan: 2026-11-16, po FF I4 na parity (rejestr, wpis 17:47 UTC).** Zastępuje migawkę z 15.11 (baza `f7baa3848`), która jest nieaktualna i nie wolno jej używać jako bazy.
Parity: `rust-port/parity-v2` = `55e00a164`.
Dispatch korekty: `dyspozycje/autobot/runs/R-RUSTPORT-P6-REJESTR-KOLEJKA-KOREKTA-Q1/00-dispatch.md` (gałąź `claude/rust-sivvrn`). Korekta statusów w rejestrze: `REJESTR-RUST.md`, sekcja „KOREKTA 2026-11-16”.

**Źródła i pierwszeństwo.** Status tematu: (1) rejestr `dyspozycje/rust-port/REJESTR-RUST.md` (najświeższy wpis), (2) tasklista, (3) dispatch. Rozjazdy oznaczone `NIE_ZMIERZONO` rozstrzyga orkiestrator.

**Zasada slotów.** Maks. 4 operatory naraz. Slot zwolniony = start następnego tematu z tej listy w tej samej turze. Start tylko z dispatchem wypchniętym na `claude/rust-sivvrn`, bazą = czubek FC albo `parity-v2`, zależnościami już zintegrowanymi i bez otwartej decyzji gameplay. Nie startować „dla zapełnienia”.

**Reguła modeli (właściciel, 2026-11-12; wiążąca).** Operator = HAIKU zawsze; SONNET na Operatorze tylko po dwóch nieudanych rundach Haiku tego samego tematu, z uzasadnieniem w dispatchu. Obrona = HAIKU; Evaluator i Final Control = SONNET. Renderer/DTO = OPUS.

## 1. Zintegrowane — usunięte z kolejki

| Temat | Integracja na parity | Uwaga |
|---|---|---|
| #271 P4-1F3 SIEGE-WONDER-VIEW | `9a71caf8a` (FC `25fdeb11a`, FF z `3a8f068f6`) | konflikt add/add w `overlays_view.rs` rozstrzygnięty; 3735 passed |
| #293 P4-1I4 BATTLE-CONSUMER | `55e00a164` (FC `54fa4c704`, FF z `9a71caf8a`) | `refs/keep/…-1I4-fc` odrzucany przez proxy (#294, otwarte) |
| #272 / #273 P4-1F4 / P4-1F5 nakładki | `3a8f068f6` (r2 `86366b5fe`, na `75de326bc`) | ancestry potwierdzona |
| #256 / #262 / #290 K5DOC-T2 / T3 | `75de326bc` (merge `03dfa64c2` i `efa3b7642`) | ancestry potwierdzona |
| #118 K5-AUTO-WEKTORY, część V5/V6 | `b6aa05024` (FC `9a79cc1e3`) | **V1 nie jest zamknięte** — patrz §6 |

## 2. W toku (stan wg rejestru, 17:47 UTC)

- #100 COMBAT-HARNESS — wektory pinu dla pętli dystansu `resolveCombat` (Workflow `wf_a01f4cfa-dd0`).
- #118 K5-LOOP-AUTO, V1 — Workflow `wf_55097f16-9ad` aktywny w rejestrze; status V1 `NIE_ZMIERZONO` (§6).
- #114 ELIMINACJA-GRACZA — tasklista `in_progress`. Korekta: funkcja `eliminate_owner` jest w kodzie, ale nie ma wołającego produkcyjnego (audyt L5). Otwarte wpięcie, patrz §3.

## 3. Gotowe do startu (bez decyzji, zależności spełnione)

1. **#114 wiring eliminacji gracza** — krok 1 wg audytu §5: podpięcie `eliminate_owner` (`eliminacja.rs:48`) w ścieżce, która już zmienia właściciela. Wymaga dispatchu z rozpoznaniem ścieżki wojny/tury.
2. **#310 EKONOMIA-STAN** — pola wejściowe ekonomii w `PlayableState`. Musi być przed #304.
3. **#311 AUTO-FILTR-OBRONCOW** — test czułości dla filtra w `finish_auto_batch_phase` (zarzut FC #118). Tylko testy.
4. **#107 K5LOOP-FACING** — rozpoznanie zakończone (#225). Dispatch do napisania. Zależność od #109 nie jest potwierdzona (patrz §6).

## 4. Otwarte — po zależności

- **#304 EKONOMIA-TURA** — wpięcie `run_economy_tick_for_game` (`turn_economy_wire.rs:234`) w `advance_turn` (audyt L1). Po #310. Rozpoznanie kolejności faz zakończone: `dyspozycje/rust-port/p6/EKONOMIA-TURA-FAZY-ROZPOZNANIE.md`.
- **#305 DYPLOMACJA-GRACZA** — `DeclareWar` w `bridge.rs:309–313` oraz `declare_war_by_player` (`diplomacy_player_war.rs:311`) (audyt L4). Po #286 (wariant A/B wg web).
- **#306 OBLĘŻENIE-WPIĘCIE** — `SiegeLoop` (`siege_tactics_loop.rs:490`) i `combat::resolve` (`combat.rs:381`) w bridge (audyt L2/L3). Po #109 i #113; kolejność zwarcia wg #135/#167/#283.
- **#307 ZDOBYCIE-MIASTA-WPIĘCIE (#115)** — `apply_transfer_with_effects` (`siege_transfer.rs:340`) i `run_capital_capture_plunder` (`siege_capital_plunder.rs:504`) (audyt L5). Po #306 i #114. Tasklista (#285): wstrzymać do W8, opcja B. Do potwierdzenia.
- **#113 K5LOOP-WIRING** — `ProdBody` i `SiegeLoop` jako produkcyjna pętla bitwy oblężniczej. Po #107 i #109.
- **#106 / #298 / #299 R7K7C-WIRING** — `apply_dipl_deltas_to_state` (`turn_war_dipl_steps.rs:1034`) w `advance_turn` oraz wektory ≥150 (#299). **Blokada: #282.**
- **V2, V7–V14 (K5-LOOP-AUTO, #296)** — blokady: #109 (morale/rout po ciosie), #97 (tryb ręczny). V8 dodatkowo #148. Doktryna #112 jest już zamknięta.
- **V15 `_executeQueuedOrders` (`battleScene.ts:3603`), V16 `_ffEnterAuto` (`:3709`)** — brak portu w `engine/src`. Po K5-AUTO-EXEC (`_executeUnitsImmediate`, #268 T3–T7). Decyzja kontraktu #284.
- **#140 COMBAT-HARNESS FC r1 i integracja** — po #100.
- **#165 INTEG-MELEE-PORT, #174 INTEG-JS-MAX-VERIFY** — weryfikacja i FF po pełnym teście.
- **#257–#261, #263–#264 (K5DOC-T1/T4–T8)** — po zależnościach z tasklisty (#263 wymaga decyzji o modelu UI doktryny).
- **#269, #270 PRIO-3D-1/2 (Opus, renderer)** — nakładki i jednostki; po decyzji o drodze DTO (#308).
- **#218 P4-1I BATTLE-EVENTS (Opus)** — zdarzenia bitwy jako snapshot (D-DTO-7). Po #308.

## 5. Decyzje właściciela (ABC) — NIE startować

- **#97** K5-LOOP-AUTO: zakres trybu ręcznego w sterowniku pętli.
- **#135 / #167 / #283** kolejność fazy zwarcia względem `_performPlayerOrder` (pin).
- **#137** NaN/Inf w amunicji i `maxRounds`: zachowanie przy NaN (rozpoznanie PASS-WITH-NOTES, implementacja po decyzji).
- **#282** dispatch przez wszystkie fotele ludzkie (blokuje #106).
- **#284** `ActivateOps`: zmiana kontraktu (blokuje K5-AUTO-EXEC i V15/V16).
- **#286 / #120** CRED-HAK-WYPOWIEDZENIE: wariant A/B wg web (`zarejestrujWypowiedzenie`). Rejestr odnotowuje odpowiedź właściciela z 13.11 — `NIE_ZMIERZONO` (§6).
- **#104 / #172 / #300** ZLOŻA-WIRING: brak `zlozeGrants` w stanie Rust, wymaga zmiany formatu zapisu (poza allowlistą, rejestr BLOCK). Decyzja, jak wpiąć.
- **#253 / #278 / #279 / #281 / #297** mgła fotela (FOG-VIEW), TERRITORY-RANGES, `revealAllLand`.
- **#308** droga DTO z engine do renderera (audyt L6). Pytanie ABC **nie zostało zadane** — orkiestrator decyduje, czy je zgłosić.
- **#15–#19** REPIN-DRYFT 2–6 (odlewnie, handel, łodzie, civBonusy, dane dyplomacji).
- **#177** PIN-MOVE-PLAN (przesunięcie pinu po zamknięciu P6).

## 6. Rozjazdy do uzgodnienia (NIE_ZMIERZONO)

- **#118 V1.** Dispatch korekty traktuje „AUTO V1/V5/V6” jako zamknięte po integracji. Rejestr (wpis o integracji) mówi, że zintegrowano wektory **V5 i V6**. Commit `b6aa05024` ma tytuł „K5-AUTO-WEKTORY-Q1” i nie wymienia V1. V1 zostaje otwarte do potwierdzenia stanu Workflow `wf_55097f16-9ad`.
- **#109 K5LOOP-OUTCOME.** W historii `parity-v2` jest commit `c3e3617b2` „Integracja K5LOOP-OUTCOME (#226): efekty po ciosie w ProdBody::strike” (przodek `55e00a164`). Tasklista pokazuje #109 `pending`, a rejestr nie ma wpisu o tej integracji. Do uzgodnienia, czy #109 jest zamknięte.
- **#114 ELIMINACJA-GRACZA.** Tasklista: `in_progress`. Wpis rejestru: „zintegrowana (INTEG-B21, `cf281d785`)”. Audyt L5: brak wołającego produkcyjnego. Przyjęto stan „wpięcie otwarte”.
- **#120 / #171 / #286 / #160.** Rejestr odnotowuje odpowiedź właściciela z 13.11 odblokowującą hak; tasklista ma #171 `completed`, a #160 (duplikat) `pending`.
- **#98.** Tasklista `in_progress`, a jednocześnie „zablokowane” (po OUTCOME). Rejestr: BLOCK (funkcje wyłomu bez wołającego w produkcji).

## 7. Migawka numerów spoza kolejki (zamknięte, do wiadomości)

Zamknięte wg tasklisty (`completed`) i rejestru, bez pozycji w kolejce: #110/#142 JS-MAX-SIGN (konsolidacja, weryfikacja #174 pending), #116 TOWER-TARGET, #131–#134, #136, #141, #144, #166, #170, #175, #176, #211, #213, #214, #216, #217, #235, #238, #241–#247, #250–#252, #255, #265–#267, #275–#277, #290, #293.

Zamknięte wg audytu, ale z korektą wpięcia: #136 COMBAT-RESOLVE-PETLA (port jest, wołającego brak), #141 eliminate_owner, #175/#115, #213 UNIT-VIEW (`NIE_ZMIERZONO`, brak modułu w `domain/`). Szczegóły w rejestrze, sekcja KOREKTA.
