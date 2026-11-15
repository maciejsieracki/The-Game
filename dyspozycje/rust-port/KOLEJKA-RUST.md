# KOLEJKA RUST — gotowe tematy do uzupełniania slotów (maks. 4 operatorów naraz)

**Stan na 15.11 (po integracji P4-1E).** Migawka z 15.11 04:48 UTC jest nieaktualna i zastąpiona tym plikiem.
Temat #228 (`R-RUSTPORT-KOLEJKA-ODSWIEZ-Q1`), dispatch: `dyspozycje/autobot/runs/R-RUSTPORT-KOLEJKA-ODSWIEZ-Q1/00-dispatch.md`.
Baza odświeżenia: `f7baa3848` (= `origin/rust-port/parity-v2`).

**Źródła i pierwszeństwo.** Status tematu ustala się w tej kolejności: (1) rejestr `dyspozycje/rust-port/REJESTR-RUST.md` (najświeższy wpis), (2) tasklista, (3) dispatch. Gdy źródła się rozjeżdżają, pozycja jest oznaczona `NIE_ZMIERZONO` z odnośnikiem — rozstrzyga orkiestrator. Numery #1–#234 są zgodne z tasklistą, z wyjątkami opisanymi przy pozycjach.

Zasada (właściciel, 2026-11-11): zawsze działają cztery tematy operatorskie. Slot zwolniony = w tej samej turze start następnego z tej listy (dispatch gotowy lub pisany od razu). Nie czekać na integrację: temat zależny od niezintegrowanego batcha startuje na czubku batcha (gałąź `rust-port-wip/BATCH*-tip`); FF na parity-v2 daje dokładnie ten commit.

## Parity

- Parity-v2: `f7baa3848` — „Integracja P4-1E CITY-VIEW (FC PASS-WITH-NOTES 185e3c0f3) na parity 10a2fc4af” (FF z `10a2fc4af`, rejestr: sekcja 15.11 17:xx UTC).
- `f2bb11970` NIE jest błędnym SHA. Był to wcześniejszy czubek parity-v2 po integracji WIEZE-2B2 r2 (rejestr, 15.11 04:08 i 04:24), zastąpiony przez kolejne FF. Nie używać go jako bazy. Poprzednia migawka KOLEJKI wskazywała go jako aktualny czubek, co było nieaktualne, nie błędne.

## W toku (operatorzy / Workflow)

1. #98 K5-LOOP-WYLOM — wyłom w trakcie bitwy i ucieczka/rout w pętli. Dispatch nazywa go „wyłom wieży”; wg tasklisty właściwy zakres to wyłom, bo #96 (wieże) jest zamknięte. **Uwaga:** #98 figuruje tu jako `in_progress` (tasklista), a równocześnie w „Zablokowane zależnością” (po OUTCOME). Rejestr: r1 `K5-LOOP-WYLOM-Q1` zakończył się BLOCK (funkcje wyłomu bez produkcyjnego wołającego). Status `NIE_ZMIERZONO` — do rozstrzygnięcia przez orkiestratora.
2. #225 K5LOOP-FACING-ROZPOZNANIE — port `_nearestEnemy` / `_updateFacing` (dispatch: `R-RUSTPORT-P6-K5LOOP-FACING-Q1`).
3. #226 K5LOOP-OUTCOME-ROZPOZNANIE — `_resolveBlowOutcome` / `_targetInRange`, runda 2 (dispatch: `R-RUSTPORT-P6-K5LOOP-OUTCOME-Q1`).
4. #9 Dług UNIT-REPLACE L-3 (po W8) — tasklista `in_progress`; brak wpisu w rejestrze w tej rundzie. `NIE_ZMIERZONO`.
5. #11 Siege #217 (pętla taktyczna oblężenia, po W8) — tasklista `in_progress`; brak wpisu w rejestrze w tej rundzie. `NIE_ZMIERZONO`.

Pozycje 4–5 nie są w dispatchu. Są dopisane, bo tasklista je wymienia jako `in_progress`, a kolejka ma pokazywać wszystkie aktywne tematy.

## Zakończone w tym cyklu

- R7K7C-WIRING-ROZPOZNANIE (#227): FC PASS-WITH-NOTES `5fb5297e4`, dokumenty `a71645fc7`.
- P4-1E CITY-VIEW (#214, integracja #222): zintegrowane na parity (`f7baa3848`). Rejestr odnotowuje integrację; tasklista nadal pokazuje #214 `in_progress` i #222 `pending` — `NIE_ZMIERZONO` w tasklist, do uzgodnienia przez orkiestratora.
- ELIMINACJA-GRACZA (#114): zintegrowana (INTEG-B21, `cf281d785`) wg rejestru; tasklista pokazuje `in_progress`. Do uzgodnienia przez orkiestratora.
- JS-MAX-SIGN (#110): FC PASS-WITH-NOTES (`9a9112a3d`); konsolidacja wg rejestru przeszła przez JS-MAX-SIGN-R2 (#142, integracja `efc77e0cf`). Tasklista pokazuje #110 `in_progress`; finalna weryfikacja to #174 (pending). `NIE_ZMIERZONO`.

## Oczekujące na ponowne rozpoznanie (NIE zakończone)

- R7K7C-STATUS (#176): sprawdzenie integracji R7K7C-WIRING-Q1/Q2 (wynik Workflow `wf_8ddee49c-415`). Wiring na parity NIE wykonany wg notatki operatora. Tasklista: `pending`. Ponowienie rozpoznania: #224 (po zwolnieniu dysku).
- Zwolnienie dysku do ≥ 8 GB przed tematami z kodem Rust: #223 (tasklista `pending`). Stan na 15.11: 2,9 GB wolnego w worktree operatora tematu #228 (dokument, bez cargo).

## Nowe (do dopisania jako pending, bez startu)

Z rozpoznania #227. Brak numerów w tasklist — oznaczone jako `NIE_ZMIERZONO` do czasu nadania numeru.

- R7K7C-PRODUCER — producent AI skarbca/pracy (`turn_war_inputs.rs:713-714`).
- R7K7C-D3-VEC — wektory D3 (tasklista: wzmianka w #89 „D3 → osobne zadanie”).
- PARITY-MISSING0 — parytet „brak wpisu = 0” (powiązane z #106).
- R7K7C-WIRING-IMPL — po PRODUCER; dispatch przez `is_human_owner`; migawka `economy_before` w `advance_turn`.

## Zablokowane decyzją właściciela — NIE startować

- #115 ZDOBYCIE-MIASTA-WIRING: wariant B / A / C (pytanie ABC w czacie). Tasklista: `pending`; rejestr: pending (brak commitów i dispatchów).
- #120 CRED-HAK-WYPOWIEDZENIE: wariant A (nowy wariant EngineCommand) — rekomendowany. **Uwaga:** rejestr odnotowuje odpowiedź właściciela z 13.11 odblokowującą T5 haka (#120/#171), a tasklista ma #171 CRED-HAK-WYPOWIEDZENIE-IMPL = `completed`, #160 (duplikat) = `pending`. Status `NIE_ZMIERZONO` — do rozstrzygnięcia przez orkiestratora.
- DYSTANS: #10 zamknięte, ale wejścia fazy zwarcia (#135, #167) wymagają rozpoznania.
- REPIN-DRYFT 2–6 (#15–#19).
- #106 R7K7C-WIRING: potwierdzenie reguły „brak wpisu = 0” — rekomendacja B. Rejestr: pending, integracja nieznana.

## Zablokowane zależnością od niezintegrowanego kodu / rozpoznania — NIE startować

- #109, #147 K5LOOP-OUTCOME — rozpoznanie #179 w toku (dispatch: #226).
- #107, #121–#125 K5LOOP-FACING — rozpoznanie #178 w toku (dispatch: #225).
- #112, #113, #148 doktryna/strzelec i produkcyjna pętla oblężnicza — po OUTCOME.
- #97, #118, #149, #150 AUTO / WYLOM — po K5LOOP-OUTCOME. #98 — patrz „W toku” (sprzeczność pozycji).
- #100, #135, #137, #167–#169 COMBAT-HARNESS — rozpoznanie wejść fazy zwarcia (#167).
- #104, #172 ZLOZA-WIRING — rozpoznanie (wywołania w `main.ts`). Rejestr: #104 pending, brak commitów.
- #139, #151 serde_json float_roundtrip — decyzja techniczna i `Cargo.toml` (#170 — patrz „Odblokowane”).
- #165 INTEG-MELEE-PORT — weryfikacja przed FF.
- #174 INTEG-JS-MAX-VERIFY — weryfikacja przed FF.

## Odblokowane — pending, bez startu (kolejność i dispatch do ustalenia)

- #211–#218 P4-1B…P4-1I renderer (Opus): MAP-VIEW-PRODUCER, FOG-VIEW, UNIT-VIEW, OVERLAYS-VIEW, VIEW-ADAPTER, MAP-COMMANDS, BATTLE-EVENTS. Rejestr (integracja P4-1E): „odblokowane #211–#218, ich kolejność i start wymagają osobnego dispatchu”. Pominięte w poprzedniej wersji tego pliku — uzupełnione.
- #177 PIN-MOVE-PLAN (econ REPIN): przesunięcie pinu po zamknięciu P6 — pending.
- #223 zwolnienie dysku — patrz „Oczekujące na ponowne rozpoznanie”.
- #224 R7K7C-STATUS ponowne rozpoznanie — patrz „Oczekujące na ponowne rozpoznanie”.

## Odblokowane bez decyzji właściciela — do wykonania przez orkiestratora

- #166 TEST-JS-ROUND-MINUS-ZERO. Duplikat: #231.
- #170 SERDE-FLOAT-ROUNDTRIP — decyzja techniczna (orkiestrator). Duplikat: #232.
- #183 MAPGEN M08/M13/M18 — wpisy w rejestrze jako NIE_ZMIERZONO. Duplikat: #230.
- #219 DTO-DECYZJE — D-DTO-4 / D-DTO-10 (Opus), wg webu. Duplikat: #229.
- #221 generalTargetId P4-1J — luka parytetu. Duplikat: #233.
- #234 K5-LOOP-AUTO-SCOPE — zakres wektorów AUTO bez oblężenia. Pokrywa się z #118 i #157 (duplikaty w tasklist).

Duplikaty #229–#233 są wpisami tasklisty o tym samym temacie co numer podany w nawiasie; kolejka wskazuje pierwszy numer.

## Reguła modeli (właściciel, 2026-11-12; wiążąca)

Operator = HAIKU 5.5 zawsze. SONNET na Operatorze wyłącznie po dwóch nieudanych rundach Haiku TEGO SAMEGO tematu (FAIL/BLOCK bez kodu), z pisemnym uzasadnieniem w dispatchu. Obrona = Haiku; Evaluator i Final Control = Sonnet. Renderer/DTO = Opus. Zadania dokumentacyjne i integracyjne = Haiku. Nie startować zbędnych tematów „dla zapełnienia”, jeśli nie ma realnej pracy bez zależności od decyzji gameplay.

## Zasada startu

Start tylko z dispatchem wypchniętym na `claude/rust-sivvrn`, bazą = czubek FC albo `origin/rust-port/parity-v2`, zależnościami już zintegrowanymi i bez decyzji gameplay.
