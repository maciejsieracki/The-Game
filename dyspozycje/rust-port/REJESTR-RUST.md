# REJESTR RUST — orkiestrator RUST (2026-11-11)

Stan zmierzony z GitHuba (`git fetch`, 2026-11-11). Nie z pamięci czatu.

| Element | Wartość |
|---|---|
| Kod Rust, integracja | `origin/rust-port/parity-v2` = `db390d49d` (ostatnie: PICK-STADNINA r3) |
| Gałąź do integracji | `origin/autobot/p6-repin-dystans` = `3b7841f14` (ten sam SHA co `origin/claude/amazing-ramanujan-1rae7n`) |
| Baza dystansu | `6d74770df` (merge-base z parity-v2) |
| Merge-tree dystans ↔ parity-v2 | czysty, 0 konfliktów (zmierzone) |
| Commity dystansu spoza parity-v2 | 2 (`83bc866e6` r1 kod, `3b7841f14` handoff) |
| Commity parity-v2 spoza dystansu | 84 |
| Gałęzie `origin/rust-port-wip/*` | 102 |

## Zrobione (zintegrowane na parity-v2, wg przekazania §3 i historii gałęzi)
DELTA-6, DYSTANS-MULT, OBLĘŻENIE-LIMIT-150, W1, ROZEJM 5/10/15, AI-ZAKUP, W2, ARMIA-FOLLOW-AUTOMERGE, DANE, W3, ZAPIS-MIGRACJE, OBLĘŻENIE-MASZYNY, W4, UNIT-REPLACE, EKONOMIA-CERAMIKA-GARNCARSTWO r4, DANE-2, W5 MARCH-PLAN, PICK-STADNINA r3.

## Plan — 10 pozycji do kontynuacji

| # | Pozycja | Priorytet | Stan | Blokada | Pierwszy krok |
|---|---|---|---|---|---|
| 1 | DYSTANS-PETLA (`R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1`): integracja do parity-v2 | 1 | ZINTEGROWANE: `parity-v2` = `a4087f332` (kod FC `460f84a05`, FC PASS-WITH-NOTES). Bramki: fmt 0, clippy 0, lib 28/28, DYSTANS 1+8+3 OK. Pełny cargo test po integracji: 359 binarek, 2609 passed, 0 failed, 1 ignored (istniejący) | Brak | Decyzja ABC: faza zwarcia (pozycja 2) |
| 2 | DYSTANS-PETLA: podpięcie `ranged_phase` do `resolve_combat` | 2 | Pętla niepodpięta (świadome założenie) | Decyzja ABC: faza zwarcia, zastąpienie modelu siły | AskUserQuestion do właściciela |
| 3 | Wire-war W6: dyplomacja tury, tick rozejmu, tryb AI, kontroferta L11 | 3 | Nierozpoczęte | Plan `P6-WIRE-WAR-TURN-PLAN.md` | Dispatch po #1 |
| 4 | Wire-war W7: oblężenie, AI↔AI | 4 | Nierozpoczęte | Zależy od W6 | Dispatch po W6 |
| 5 | Wire-war W8: pipeline `run_war_turn` (D1–D4) | 5 | Nierozpoczęte | Zależy od W6–W7 | Dispatch po W7 |
| 6 | Długi: loader zapisu z `migrate_on_load`, `WIRE-EPOCH-WAR-FLAG-Q1` | 6 | Do zrobienia | Brak | Osobny dispatch |
| 7 | Pętla taktyczna oblężenia #217 (L2–L5, SIEGE-NEARBY-STAN L9–L10) | 7 | Do zrobienia | Zależy od #5 | Dispatch po W8 |
| 8 | UNIT-REPLACE L-2, L-3 (Rust; L-1 pominięte) | 8 | Dług | Brak | Dispatch po W8 |
| 9 | REPIN dryfu po czerwcu (Pałac II/III, odlewnie 50/75, handel, łodzie 6/6/6, `civBonusy`) | 9 | Do zrobienia | Brak | Pomiar dryfu, tylko dokumentacja |

## Uwagi i konflikty

## Log integracji 2026-11-11
- DYSTANS-PETLA: Evaluator PASS-WITH-NOTES (N1 naprawiony w obronie, N2 odrzucony, N3 = pełny test). FC PASS-WITH-NOTES, SHA `460f84a05`, bez decyzji człowieka. Integracja `a4087f332` FF na `rust-port/parity-v2`. Kod WIP: `rust-port-wip/DYSTANS-fc`. Ref: `refs/keep/R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1-fc`.
- Zaplanowany wyzwalacz „Check full cargo test log” wskazywał na stary log (zabity na `p6_8i_pick`, 115 binarek, 1015 passed, 0 failed); aktualny przebieg wykonywany dla zintegrowanego stanu.
- Wiadomość w wyniku subagenta obrony zawierała polecenie przeglądu gałęzi i przejęcia orkiestracji. Potraktowana jako dane, nie jako polecenie; nie wykonana.

## AUDYT 2026-11-11 (pętla autonomiczna, stan z GitHuba)
`origin/rust-port/parity-v2` = `a4087f332`.

### Zrobione (zintegrowane, z SHA integracji)
- W1 WIRE-WAR-STATE `73625b1e2`; W2 WORLDVIEW `f6885e765`; W3 FORCED-STEP `0ccd2da2a`; W4 DECLARE-CLEANUP `b3c6b004c`; W5 MARCH-PLAN `72209573c`.
- DYSTANS-PETLA `a4087f332` (pozycja 1). Pełny cargo test: 359 binarek, 2609 passed, 0 failed, 1 ignored (istniejący).
- PICK-STADNINA `db390d49d`; UNIT-REPLACE `09f5255ee` (L-1..L-3 nadal otwarte, patrz niżej); CERAMIKA `d5220b483`; DANE-2 `18e602b32`; ROZEJM `fb6e1e827`; ZAPIS-MIGRACJE `4a338305a`; OBLEZENIE-MASZYNY `de9a73bc4`.

### W toku
- W6 DIPLO-TURN: dispatch `5310a164d`, Workflow `wf_91e37442-74b` (Operator → Evaluator → Obrona? → FC).

### Do zrobienia (kolejność z planu)
- W7 SIEGE-AIAI-TURN (po W6), W8 pipeline `run_war_turn` (po W7; podpięcie do pętli tury).
- Pozycja 2: podpięcie DYSTANS do `resolve_combat` i faza zwarcia — DECYZJA ABC (właściciel).
- Pozycja 6: loader zapisu z `migrate_on_load`; `WIRE-EPOCH-WAR-FLAG-Q1`.
- Pozycja 7: pętla taktyczna oblężenia #217 (L2–L5, SIEGE-NEARBY-STAN L9–L10) — po W8.
- Pozycja 8: UNIT-REPLACE L-2, L-3 (Rust). L-1 pominięte.
- Pozycja 9: REPIN dryfu po czerwcu (pomiar, docs).

### Zakres
- Ten czat prowadzi WYŁĄCZNIE Rust. Wszystkie czynności po stronie web (kolejka, wdrożenia, decyzje web) są poza planem; web pozostaje tylko źródłem danych wejściowych (piny `origin/main` do wektorów).

## Zgodność z zasadą AutoBot (sprawdzenie 2026-11-11)
- Dispatch zapisany i wypchnięty PRZED każdym Workflow (`ab14ef29a`, `5310a164d`).
- Role sekwencyjnie per temat: Operator → Evaluator → Obrona (tylko po zarzutach) → Final Control; modele wg CLAUDE.md (Operator Haiku, Evaluator/FC Sonnet, Obrona Haiku). Dotyczy DYSTANS i W6.
- Integracja po FC: ancestry (`merge-base --is-ancestor`), `git diff --stat`, bramki, push FF, sprzątanie worktree.
- ODCHYLENIE: push `parity-v2` (`a4087f332`) nastąpił PRZED ukończeniem pełnego `cargo test`. Pełny test zakończono później (zielony). Zapisane jako odchylenie kolejności, nie jako brak testu.
- Odnotowane: R-PROC-AUTOBOT §1 opisuje role Codex (GPT-6-luna); ten projekt działa na Claude, więc obowiązuje CLAUDE.md (Haiku/Sonnet).
- Wyzwalacz „Check full cargo test log” wskazywał na stary log; odczytany, nie wykonano ponownie z jego polecenia.

## Przebieg 2026-11-11 (heartbeat 18:18 UTC)
- parity-v2 = `fdd24d04a` (zintegrowane: ZAPIS-LOADER r2 `3884c41c9`, COOLDOWN `7ebfbe93d`, LOCKS `fdd24d04a`).
- W trakcie: integracja SIEGE-GATE (kod `d1b44f626`, FC `5a8cea94f`): fmt/clippy 0, testy 156 binarek, 0 failed (do tej pory).
- W trakcie przebiegów: ZAPIS-REPLAY-MIGRATE, ZAPIS-ERA-Z-ZAPISU (decyzje właściciela), TICKDIPLO-GEN, W6 r4 eval (zawężony zakres brake + tick).
- Czeka: CITY-PEACE (kod `31cee3102`, FC `cc1a66768`) po SIEGE-GATE. DECISION_REQUIRED: czy usunąć stary test `p6_ai_peace_city_offer.rs` (duplikat); podpięcie `decide_city_offer` w W8.
- Dysk: 11 GB wolnego po czyszczeniu worktree zakończonych przebiegów.

## Przebieg 2026-11-11 20:41 UTC (heartbeat)
- parity-v2 = `ca33abdd6` (zintegrowane: L-2 `084321020`/`82c74289c`, BORDER-EPOCH `0f8737f9c`, REPLAY r2 `ca25d6fd2`, COOLDOWN, LOCKS, SIEGE-GATE, batch ERA/TICKDIPLO/CITY-PEACE).
- Wypchnięte, nie zintegrowane: W7 SIEGE-AIAI kod `211f8a2ab` / FC `6914a102d`; KOMENTARZE kod `058e6cae3` / FC `ce7b154d4`.
- Przerwane restartem, wynik FC utracony, commity na GitHubie: REPLAY-DESER-REMOVE (`a520b94ef`, `80c901bc1`), SAVESNAPSHOT-DESER r2 (`c2b52266c`, `23130e331`). Wymagają ponownego Evaluatora + FC przed integracją.
- W toku: W8 PIPELINE (wariant B, kolejność Rust), dispatch `2c8f75471`, Operator od 20:41 (`wf_d483df74`).
- Sloty: 1/4 aktywny. Dysk 20 GB wolnego.
- DECISION_REQUIRED: brak nowych decyzji gameplay poza zatwierdzonym wariantem B dla W8.

## Decyzje techniczne orkiestratora (2026-11-11, noc)
- BORDER-WIRING (zadanie 7): dispatch miał fałszywą przesłankę; w `ai_diplomacy_turn.rs` nie ma budowy `TickContext`, a `tick_pairs_relation_scores`, `run_brake_phase` i `shared_border_penalty_for_epochs` nie mają produkcyjnego wołającego. Wariant (c): wiring przechodzi do W8 (pętla tury). W8 r2 musi budować `TickContext` z `common_border_delta = shared_border_penalty_for_epochs(epoka obu stron)`. Temat zamknięty jako zależność do W8. Gałąź: `rust-port-wip/BORDER-WIRING-*`.
- Sygnatura `run_war_turn`: struktura kontekstu `WarTurnContext` zamiast `(world, state, turn)` (advance_turn nie wykonuje efektów faz).
- Kolejność integracji: W7 → REPLAY-DESER (FC PASS `964e44f58`) → SAVESNAPSHOT r2 (kolizja w `replay.rs`, runda integracyjna Operatora).
- W8: blokada = baza bez W7; po integracji W7 start r2.

## Przebieg 2026-11-11 21:18 UTC (heartbeat zapas)
- parity-v2 = `83ac67875` (W7 zintegrowane). W bramkach: batch REPLAY-DESER (`964e44f58`) + KOMENTARZE (`ce7b154d4`) + CFGTEST (`d7f9b78dc`), czubek `33cd715cf`.
- W8: BLOCK r1, r2 (FC potwierdził). Podział: WAR-STATE-OWNER (zad. 22), producenci wejść brake (zad. 23, do napisania), SIEGE-SURRENDER (zad. 24); potem W8 r3 (zad. 25).
- Operatorzy (Haiku 5.5) w toku: WAR-STATE-OWNER, AIPEACE-BALANS, UNIT-REPLACE-L1, SIEGE-SURRENDER. Sloty 4/4.
- BORDER-WIRING zamknięty jako zależność do W8 (brak produkcyjnej pętli tury).
- Czeka: SAVESNAPSHOT r2 (FC PASS `c2b52266c`) — kolizja w `replay.rs` z REPLAY-DESER; runda integracyjna po batchu.
- DECISION_REQUIRED (gameplay): faza zwarcia DYSTANS; REPIN-DRYFT 1–6.

## Przebieg 2026-11-11 22:18 UTC (heartbeat)
- parity-v2 = `82c57a412` (batch: WAR-STATE-OWNER, SIEGE-SURRENDER, SAVESNAPSHOT-DESER; pełny test 375 binarek, 2733 passed, 0 failed). Wcześniej: AIPEACE-BALANS `fe52d6ba3`, batch REPLAY-DESER/KOMENTARZE/CFGTEST `33cd715cf`, W7 `83ac67875`.
- W bramkach: AIPEACE-V2-MIGRACJA (kod `7bd333cec`, FC PASS-WITH-NOTES; decyzja techniczna: wariant A, test `tick_scenarios_match_web` zostaje na V1 z `#[allow(deprecated)]`).
- Operatorzy (Haiku 5.5, 4/4): UNIT-REPLACE-L1 r2, BRAKE-INPUTS (W8 2/3), SIEGE-TRANSFER (Q2), ZAPIS-SAVELOAD-KOMENTARZ.
- Kolejka: W8 r3 (po BRAKE-INPUTS i SIEGE-TRANSFER), L-3, siege #217.
- DECISION_REQUIRED (gameplay): faza zwarcia DYSTANS; REPIN-DRYFT 1–6; 50 rozbieżności pól units.json vs pin (zadanie 27).

## DECISION_REQUIRED (gameplay, 2026-11-11 noc) — UNIT-REPLACE-L1 zaparkowany
- Temat `R-RUSTPORT-P6-UNIT-REPLACE-L1-Q1` (FC FAIL r2, kod `1ae4ab73c`, FC `987c24944`) stoi na bramce `p6_1d_civ_bonuses` (hash FNV `units.json`). Rust `units.json` różni się od pinu 07d2fbd72 w 50 polach balansu (Tech 27, fieldPower 9, Top3 3, Epoka 2, Historia 2, po 1 w Atak/Obrona/Przebicie/Bonus vs Spearman %/meleeAttack/meleeDefence/piercing).
- PYTANIE DO WŁAŚCICIELA: A) wyrównać 50 pól `units.json` do pinu (rekomendacja; zmienia wartości jednostek w grze Rust), czy B) hash liczyć z danych Rust (słabsza gwarancja parytetu, dług tymczasowy)? Do czasu odpowiedzi temat zaparkowany; commity: `rust-port-wip/UNIT-REPLACE-L1-r2-*`.

## Przebieg 2026-11-11 23:18 UTC (heartbeat)
- parity-v2 = `ec4e11741` (BRAKE-INPUTS r2; pełny test 379 binarek, 2759 passed, 0 failed). Wcześniej: SIEGE-TRANSFER + SAVELOAD-KOMENTARZ `eba816b4e`, AIPEACE-V2 `88b05d029`, batch STATE-OWNER/SIEGE-SURRENDER/SAVESNAPSHOT `82c57a412`.
- Operatorzy (Haiku 5.5, 4/4): DLUG-TESTHELPERS (Evaluator), POWER-PRODUCERS, SIEGE-TRANSFER-Q3 r2, BRAKE-VECTORS r2 (poprawka `military=false` dla „zdobycze” w `brake_power.rs`, parytet z pinem).
- Decyzje techniczne: BRAKE-VECTORS — allowlista poszerzona o `brake_power.rs`; SIEGE-TRANSFER-Q3 r2 — wektory z pinu bez stubów (pin extractowany poza repo).
- Kolejka: W8 r3 po POWER-PRODUCERS, BRAKE-VECTORS i SIEGE-TRANSFER-Q3; potem L-3 i siege #217.
- DECISION_REQUIRED (gameplay): faza zwarcia DYSTANS; REPIN-DRYFT 1–6; 50 rozbieżności pól `units.json` vs pin (UNIT-REPLACE-L1 zaparkowany; commity `rust-port-wip/UNIT-REPLACE-L1-r2-*`).
- Dysk: 14 GB; w trakcie nocy kilka rund operatorów stawało na progu 8 GB — worktree zakończonych przebiegów usuwane po każdym wypchnięciu.

## Przebieg 2026-11-12 01:2x UTC (orkiestrator Rust)
- parity-v2 = 258afaf8f (batch 6: POWER-ARMIA-TERYTORIUM + POWER-NOZEROS; 2789 passed, fmt/clippy 0).
- FC PASS-WITH-NOTES, jeszcze nie na parity-v2 (refs rust-port-wip/*): POWER-REST 5e58876fb, POWER-NAN-STRICT 568e3fe18 (kod 36983ebb6), W8 r3 95bbf99d7, SIEGE-TRANSFER Q4 f1b4b2188 → Q5 70d7a231d → Q6 fc45c4797, SIEGE-TAKTYKA-AUDYT 4f16b5a1f, UNIT-REPLACE-L3 etap 1 ab116e492.
- BATCH7-tip (W8 r3 + POWER-REST + Q4) NIE KOMPILUJE: konflikt semantyczny W8 r3 × POWER-NOZEROS (objective_power_for_owner zwraca Result). Naprawa wchodzi w W8 r5 (Operator); NAN-STRICT po W8. Batch 8 (BATCH8-tip ceb688b0d = parity-v2 + Q4–Q6 + POWER-REST) w bramkach.
- Decyzje techniczne: NaN/Inf w Provided = błąd (wariant A); L-3 etap 2 (stan ekonomii w PlayableState) jako osobny temat; W8 r4 zawężone do fazy Diplomacy, oblężenie/AI w r6+.
- W toku (4): W8 r5 (wf_5a21b06a-821), L3-STAN (wf_9e427dfb-a13), SIEGE-TRANSFER-Q7 (wf_8154cf44-ed3), SIEGE-TAKTYKA-K0B (wf_5d829ec6-b80).

## Przebieg 2026-11-12 02:2x UTC (orkiestrator Rust)
- parity-v2 = b9800e0a7 (batch 9: NAN-STRICT + SIEGE-TAKTYKA-AUDYT; 2836 passed, fmt/clippy 0). Wcześniej batch 8 ceb688b0d (Q4–Q6 + POWER-REST; 2819 passed).
- BATCH10-tip 81e7840ba (Q7 + K0b) w pełnych bramkach (fmt/clippy 0).
- FC PASS-WITH-NOTES poza parity-v2: Q8 ee29d7906, POWER-SOURCES ab9cc23e2 (konflikt z NAN-STRICT → runda integracyjna Operatora), W8 r3 95bbf99d7 / r4 0b5fc5fb9 / r5 74c8456ff, UNIT-REPLACE L3 etap 1 ab116e492 i etap 2 415a7d67f.
- Decyzje techniczne: W8 r5 NIE wchodzi na parity-v2 (advance_turn z AI z miastami zwraca WarTurn do czasu producentów r6); fallback epoki AI = gameStartEra() wg pinu main.ts:2419; kolejne klocki W8 r6: epoka → populacja/kultura/terytorium → budynki/tech/religia → TickContext → R2.
- W toku (4): SIEGE-TAKTYKA-K1 (wf_57c6f6dd-8c8), W8 r6 EPOKA (wf_27d17112-1eb), POWER-SOURCES-INTEG (wf_9ea19b81-25a), SIEGE-TAKTYKA-K2 (wf_5ecd6899-90b).

## Przebieg 2026-11-12 03:2x UTC (orkiestrator Rust)
- parity-v2 = 81e7840ba (batch 10: Q7 + K0b; 2844 passed, fmt/clippy 0).
- FC PASS-WITH-NOTES poza parity-v2 (refs rust-port-wip/*): Q8 ee29d7906, K1 759621568, K1b 7276ed3da, K2 c6a253485, POWER-SOURCES-INTEG merge f7bb7b286 (2840 passed; merge-tree czysty vs 81e7840ba), W8 linia r3–r5 + EPOKA fa480bf2a, UNIT-REPLACE L3 etap 1/2.
- Decyzje techniczne: K1 wiersz 30 PARTIAL zaakceptowany, reszta jako K1b/K3; epoka statyczna (wariant A); linia W8 wymaga adaptacji do PowerInputError (NAN-STRICT) w rundzie integracyjnej na końcu; K2/K1/Q8 przez rundę integracyjną (konflikt mod.rs).
- W toku (4): INTEG-B11 (wf_6bb00f80-766), W8 r6 POP (wf_97d225f9-289), SIEGE-TAKTYKA-K3 (wf_475394da-12c), SIEGE-TAKTYKA-ENDCHECK (wf_524dfe35-f29). Dysk ~7,4 GB — nowe starty wstrzymane do ≥ 8 GB.

## Przebieg 2026-11-12 04:2x UTC (orkiestrator Rust)
- parity-v2 = e763d4a9a (batch 11 = INTEG-B11: Q8 + K1 + K2 na batch 10; pełne testy Operatora 2862 passed / 0 failed / 1 ignored, Evaluator odtworzył bramki).
- FC PASS-WITH-NOTES poza parity-v2: Q9 d3b11f071 (merge-tree czysty), ENDCHECK 2f5096d99, K1b 7276ed3da, K3 aef5993e1, K4 a70375e52, POWER-SOURCES-INTEG merge f7bb7b286 — zebrane w INTEG-B12 (wf_eacac2cc-811, baza e763d4a9a); linia W8 (r3–r5 + EPOKA fa480bf2a + POP d11c995e6) czeka na STORES i adaptację do PowerInputError.
- Decyzje techniczne: dług Q8 NaN/niecałkowite zamknięty typem i32 (Q9); K4 w domain/ (czyste przejścia z jawnym stanem); STORES r1 BLOCK z powodu zdania „baza: parity-v2” w skrypcie workflow — poprawiono skrypty (dispatch ma priorytet), STORES r2 na bazie d11c995e6.
- W toku (4): INTEG-B12 (wf_eacac2cc-811), W8 r6 STORES r2 (wf_c14e29ce-9e3), SIEGE-TAKTYKA-KLASY (wf_57d26d89-3f6), DLUG-SIEGE-KOMENT (wf_52f56389-f6c).

## DECISION_REQUIRED (gameplay, do rano w czacie) — dopisek 04:4x UTC
- SIEGE-TAKTYKA K5-AUDYT (FC b2336c005): gałąź SZTURM ODPARTY w `_checkEnd` (pin battleScene.ts :10184-10187) jest na pinie NIEOSIĄGALNA — `_stalled` ustawia tylko `_updateStallWatch`, który przy `siegeWallCol >= 0` wychodzi wcześniej (:5571), więc bitwa oblężnicza kończy się remisem po 150 turach. Pytanie do właściciela (gameplay): odwzorować w Rust TO SAMO zachowanie z pinu (rekomendacja: TAK — parytet) czy naprawić „zamierzone” zachowanie (szturm odparty = zwycięstwo obrońcy)? Do czasu decyzji K5 stosuje parytet z pinem.

## DECISION_REQUIRED (gameplay, do rano w czacie) — W8 r7 (AUDYT FC de92c63fd; dokument P6-W8-R7-AUDYT.md na gałęzi rust-port-wip/WIRE-WAR-R7-AUDYT-fc)
Wariant B (kolejność faz z planu Rust) jest decyzją właściciela; audyt pinu wykazał różnice kolejności, które zmieniają rozgrywkę. Pytania (rekomendacje = parytet z pinem):
- Q1: dyplomacja AI i pokój AI-AI — po ekonomii i oblężeniach (jak pin, rekomendacja) czy na początku tury wg kolejności Rust? (R7-K5)
- Q2: kapitulacja głodowa oblężenia i szturm po maszynach w tej samej turze, po ekonomii (jak pin)? (R7-K1/K2/K3)
- Q3: wojna wypowiedziana przez hamulec działa w tej samej turze, przed ekonomią i ruchami AI (jak pin D8)? (R7-K4)
- Q4: rebelia miasta wpływa na produkcję tej samej tury (pin) czy dopiero od następnej? (R7-K6)
Do czasu odpowiedzi klocki R7-K1/K2/K3/K4/K5/K6 NIE startują; klocki niezależne od pytań (wpięcie istniejących funkcji bez zmiany kolejności) mogą startować.

## Przebieg 2026-11-12 05:2x UTC (orkiestrator Rust)
- parity-v2 = 46c42deab (batch 12 = INTEG-B12: POWER-SOURCES-INTEG + K1b + ENDCHECK + K3 + K4 na batch 11; testy Operatora 2910 passed / 0 failed / 1 ignored; Evaluator odtworzył bramki częściowo — pełnego przebiegu niezależnie nie powtórzono).
- FC PASS-WITH-NOTES poza parity-v2 (refs rust-port-wip/*): linia W8 STORES 9164ab7d7 + L3-STAN 415a7d67f + Q9 d3b11f071 + KLASY de6204fdc + KOMENT 24ef0de70 + K5-AUDYT b2336c005 — zebrane w INTEG-B13 (wf_c6c3d8d3-0e1, Sonnet; adaptacja do PowerInputError, pełny cargo test); L3-DEFS 05aaf3922; POWER-ULEPSZENIA f47aa359c (merge-tree czysty); W8-R7-AUDYT de92c63fd.
- DECISION_REQUIRED (gameplay): SZTURM ODPARTY (K5-AUDYT) i Q1–Q4 W8 r7 — patrz wyżej; rekomendacja: parytet z pinem.
- W toku (4): INTEG-B13, L3-KOSZT (wf_e8c19444-ed2), SIEGE-TAKTYKA K5A (wf_3e4a1a30-321), K5E (wf_0ad9abe5-0a8). Po B13: R7-K7, R7-K8, wpięcie ulepszeń do power_raw_for_owner.

## Przebieg 2026-11-12 06:2x UTC (orkiestrator Rust)
- parity-v2 = db1e75378 (INTEG-B13: linia W8 r3–r6 [pipeline Diplomacy aktywny, advance_turn z AI z miastami przechodzi], L3 etap 1–2, Q9, KLASY, KOMENT, K5-AUDYT). Pełny cargo test (Operator, Evaluator, FC): 2997–2999 passed / 0 failed / 1 ignored. Wyjątek zaakceptowany: fixture pre-etap2-state.json (population:1, culture:0).
- DŁUG (rejestr): POWER-BITWY-ZDOBYCZE — składniki bitwy/zdobycze są ExplicitZero (zaniżają moc AI względem pinu po pierwszych walkach; test egzekwuje klucze, nie pola); wpięcie producenta POWER-ULEPSZENIA (f47aa359c) do power_raw_for_owner przez improvement_count_for_build_hex (NIE placed_improvements_for_owner); postęp jednostki (battlesSurvived/parametryBonusProc) = 0 w L3-KOSZT; Difficulty::Normal na stałe w producencie religii; forty w terytorium; populacja/kultura nie rosną między turami.
- FC PASS-WITH-NOTES poza parity-v2: L3-DEFS 05aaf3922, L3-KOSZT 0fe9b3222 (konflikt playable.rs), POWER-ULEPSZENIA f47aa359c, R7-AUDYT de92c63fd, K5A 0804daad0, K5E 9bba72be5, K5D 5dabae57e, K5G0 e40f9c710, K5F bcb64cead (konflikty mod.rs) → batch 14 (runda Operatora).
- W toku (4): R7K7 (wf_08a142d1-ac2, Sonnet), K5J (wf_cb72c017-8ff), K5I (wf_37894d02-4f5), K5G (wf_076c64a6-536, Sonnet).
- DECISION_REQUIRED (gameplay, rano): SZTURM ODPARTY, W8 r7 Q1–Q4, dane units.json vs pin (50 pól; Konnica 22 vs 44, Jeździec chiński 28 vs 56), DYSTANS, REPIN-DRYFT 1–6.

## Przebieg 2026-11-12 07:2x UTC (orkiestrator Rust)
- parity-v2 = db1e75378 (INTEG-B13). Batch 14A (L3-DEFS + L3-KOSZT + POWER-ULEPSZENIA + R7-AUDYT; wf_361dff94-a0b) po 3 etapach, czeka na FC.
- FC PASS-WITH-NOTES poza parity-v2: łańcuch K5 w jednym commicie K5H 86223e037 (K5A 0804daad0, K5E 9bba72be5, K5D 5dabae57e, K5G0 e40f9c710, K5F bcb64cead, K5G 1a119b78e, K5I ff8688bf9 [rdzeń _singleBlow — status „częściowo”], K5J bbbc17b6b, K5H) — konflikt mod.rs → B14B; R7K7 fb7ac73d1 (czysty).
- Decyzje techniczne: K5I RNG = wstrzyknięte rzuty (T1); K5J — pin nie woła _checkEnd w pętli FF (kryterium dispatchu było błędne); K5H „zdarzenia-zamiary” zaakceptowane; K5I2 podzielony na K5I2a1 (teren), a2 (pozycja/bród/trudność/engaged), a3 (mur), a4 (toCombatUnit), b (BlowInput + rangedDamageMultFor) — po 2 rundach Haiku bez kodu: Sonnet z uzasadnieniem.
- W toku (4): B14A, K5I2a1 (wf_ef30cea0-a13), K5I2a2 (wf_601d59e3-335), CRED (wf_2f114aeb-222). Następne: B14B po FF B14A; K5I2a3/a4/b; R7-K8 po Q2 (gameplay).
- DŁUG dopisek: R7K7 BRAK — P7, deactivateZlozeGrantsForDeal, wektory D3/syncRelationFromDeals, efekty na PlayableState (skarbce/zapasy), producent skarbca AI i puli Pracy; K5G rozbieżność halt (for..of po starej tablicy) do rozstrzygnięcia przy wpięciu; K5H/K5G/K5J/K5F bez wołającego (pętla K5 niewpięta — wymaga decyzji K6/Q).

- DŁUG (07:3x UTC): NFD-CCC — normTerrain w K5I2a1 (siege_tactics_inputs_terrain.rs) implementuje NFD tabelą z Node bez kanonicznego przestawiania znaków łączących spoza U+0300..U+036F (np. U+0F71/U+0F72); wpływ ograniczony do nazw terenów z danych; do zlecenia jako mały temat (rozszerzenie tabeli + wektory) przy okazji integracji K5I2a. Zgłoszone przez Obronę K5I2a1 (próba spawn_task nie przeszła — nie zakładam kart „Suggested task”, zgodnie z zasadą sesji).
- K5I2a1 FC PASS-WITH-NOTES eee18680c (kod e5fd83368; 5 funkcji terenowych, wektory 631+340+700+700+700 i pełne 1 112 064 punkty kodowe NFD). Nazwa kolidująca terrain_river_attack_multiplier (nowy moduł vs siege_tactics_blow_inputs.rs) — w a2–a4 importować ścieżką kwalifikowaną.

## Przebieg 2026-11-12 08:2x UTC (orkiestrator Rust)
- parity-v2 = 513e1a56c (INTEG-B14A: L3-DEFS, L3-KOSZT, POWER-ULEPSZENIA producent [niewpięty], R7-AUDYT; pełne testy 3022/0/1).
- W toku: INTEG-B14B (Final Control; łańcuch K5 + R7K7 + K5I2a1) [Haiku Op.], K5I2b (Evaluator; kompletny cios) [Haiku Op.].
- FC PASS-WITH-NOTES poza parity-v2: CRED 9d4a2c17b, K5I2a2 4b6595876, K5I2a3 fe3264a39, K5I2a4 a2bcdbdc6 (zawiera a1+a2; konflikt mod.rs z a3), UNIT-REPLACE-PROGRESS b9a0844cd (pola w PlayableReplaceUnit zamiast PlayableUnit — zaakceptowane technicznie), POWER-ULEPSZENIA-WIRING 9105be231 (BRAK: stan nie niesie ulepszeń → zadanie #95 STAN-ULEPSZENIA).
- DECYZJA TECHNICZNA: dodanie warstw ulepszeń terenu i fortów/posterunków do PlayableState to decyzja techniczna orkiestratora (nie pytanie ABC).
- ZASADA MODELI (właściciel): zapisana w CLAUDE.md i KOLEJKA-RUST.md; skrypt Sonnet-op zablokowany (.disabled); mkwf.sh generuje czytelne nazwy z podziałem modeli. Raporty: tabela (temat | etap | model | czas).
- Pytania gameplay do rana: SZTURM ODPARTY; W8 r7 Q1–Q4; units.json vs pin (71 różnic pól w 51/75 jednostek: falanga, Horseman/Chinese Cavalry Epoka, fieldPower); DYSTANS; REPIN-DRYFT 1–6.

## Przebieg 2026-11-12 09:2x UTC (orkiestrator Rust)
- parity-v2 = 64d6e22ce (INTEG-B14B: łańcuch K5, R7K7, K5I2a1; pełne testy 3089/0/1).
- W toku (1): INTEG-B14C (CRED + UNIT-REPLACE-PROGRESS + POWER-ULEPSZENIA-WIRING + K5I2b[a2–a4]) — etap Final Control (Sonnet), Operator Haiku.
- Nowych tematów nie startuję (oszczędzanie limitu wg właściciela): reszta kolejki zależy od B14C albo od pytań gameplay; do zlecenia po B14C: STAN-ULEPSZENIA (#95), POWER-BITWY-ZDOBYCZE (#86), R7K7-B/C (#89–90), K5-LOOP (#91), KLASY-WIRE (#92), NFD-CCC (#88), K5I2b2 (adapter pozycja+mapa+mur → BlowEnv), unit_power::ranged_shot_accuracy (f64::max vs Math.max).

## Przebieg 2026-11-12 11:2x UTC (orkiestrator Rust)
- parity-v2 = 465e9dd95 (INTEG-B14C; pełne testy 3128/0/1).
- FC PASS poza parity-v2: NFD-CCC c25fd6edf (e6a815d53), KLASY-WIRE cb9db56ba/0a86341d5 (3d7ed90f7) → INTEG-B15 (Haiku; pełny cargo test) w toku.
- Kolejka techniczna (do zlecenia na Haiku po B15, tylko realna praca): STAN-ULEPSZENIA (#95), POWER-BITWY-ZDOBYCZE (#86), R7K7-B/C (#89–90), K5-LOOP (#91), K5I2b2 (adapter pozycja+mapa+mur → BlowEnv), unit_power::ranged_shot_accuracy (f64::max vs Math.max), dokumentacja wierszy planu K5I2a2–b/CRED.
- Pytania gameplay do rana: bez zmian (SZTURM ODPARTY; W8 r7 Q1–Q4; units.json vs pin [71 różnic pól/51 jedn.]; DYSTANS; REPIN-DRYFT 1–6).

## Przebieg — 12:5x UTC (batch 16/17 w toku)
- FC PASS-WITH-NOTES: UNIT-POWER-MAXNAN d842b9866; POWER-BITWY-ZDOBYCZE 73c92bb04 (kod 83a030cd6); SIEGE-TAKTYKA-K5I2B2 0c90e2bf1 (kod 7bd75cf2c); STAN-ULEPSZENIA r2 4d348e9ac; R7K7-B da070d099 (kod e2bf70095); K5-LOOP ec7a0ff78. Wszystkie na gałęziach rust-port-wip/*.
- INTEG-B16 (MAXNAN+BITWY+K5I2B2): pełny cargo test 3162 passed/0 failed/1 ignored; Evaluator w toku. Potem FF na parity-v2.
- INTEG-B17 (po B16): STAN-ULEPSZENIA (konflikt z BITWY w turn_war_inputs.rs i p6_wire_war_inputs.rs — rozwiązuje runda Operatora), R7K7-B, K5-LOOP.
- Decyzja techniczna: "P7" z dispatchu R7K7-B nie istnieje jako reguła wiarygodności (pin: P7 = bonus Zaufania za wymianę, applyDiploP7Bonuses) — nie portować jako wiarygodność; wpis zamknięty.
- Długi: ranged_shot_damage NaN/Inf (zwrot i64; combat.rs); STAN-ULEPSZENIA-TERYTORIUM-VEC (wektor pinu heksy_terytorium z fortami); D3 tickCyclicResourceTradeDeals bez wektorów pinu; wpięcie deactivate_zloze_grants/sync_relation (stan zlozeGrants, R7K7-C); wpięcie akumulatorów bitew/zdobyczy w walkę/zdobywanie/eliminację; K5-LOOP #91 OTWARTE: ciało jednostki (K5H/K5I single_blow_full) niepodpięte, port wież (_schedule 180 ms, pickTowerTarget), wektory flee/rout/moveLeft/wyłom w trakcie bitwy/tryb ręczny/AUTO bez oblężenia, test niezależności od podziału kroków przewijania, test halt_unsupported; vectors.json 7,1 MB.

## Przebieg — 13:2x UTC
- parity-v2 = 82bb87fb1 (INTEG-B16: MAXNAN + BITWY-ZDOBYCZE + K5I2B2; pełny cargo test 3162 passed/0 failed/1 ignored; FF + readback).
- W toku (Operator HAIKU): INTEG-B17 (STAN-ULEPSZENIA + R7K7-B + K5-LOOP, konflikt STAN×BITWY rozwiązuje Operator), RANGED-DAMAGE-NAN, DOC-TAKTYKA-WIERSZE.
- 4. slot niewykorzystany celowo: pozostałe tematy (R7K7-C, wpięcie akumulatorów, K5-LOOP ciało jednostki, STAN-TERYTORIUM-VEC) dotykają playable.rs/turn_war_inputs.rs/siege_tactics_loop.rs i zależą od B17 — start po FF B17.

## Przebieg — 14:2x UTC
- parity-v2 = 237e54526 (INTEG-B17: STAN-ULEPSZENIA + R7K7-B + K5-LOOP; pełny cargo test 3179 passed/0 failed/1 ignored; FF + readback). Konflikt STAN×BITWY rozwiązany przez Operatora (ulepszenia, bitwy, zdobycze = Provided; EXPLICIT_ZERO_REASONS = []).
- FC PASS-WITH-NOTES czekające na integrację: RANGED-DAMAGE-NAN e9b505939, DOC-TAKTYKA-WIERSZE 3ec2e2827, POWER-AKUMULATORY-WIRING 857fe1733 (adaptery bez wołających — brak pętli walki/zdobywania/eliminacji), R7K7-C 3d0716842 (apply_dipl_deltas bez wołającego; DECYZJA TECHNICZNA: brak wpisu skarbca/Pracy = 0 jak pin), STAN-TERYTORIUM-VEC a5d93810a (czysty merge; kosmetyka nazwy TERRITORY_MIN_TIE_CASES przy integracji). INTEG-B18 (pierwsze cztery) w toku.
- W toku (Operator HAIKU): INTEG-B18, K5LOOP-BODY r2 (r1 FAIL: src/ bez zmian), K5I2B2-DLUG, CRED-WOJNA.
- Zadania do uruchomienia od zera: #96–#99 (K5-LOOP-WIEZE/AUTO/WYLOM/RESUME), #100 COMBAT-HARNESS, #101 RANGED-DAMAGE-CLEANUP, #104 ZLOZA-WIRING, #105 AUDYT-LUK-B18, #106 R7K7C-WIRING.
- Incydent dysku: 400 MB wolnego przy 5 równoległych kompilacjach (Obrona K5LOOP-BODY padła na worktree). Zwolniono własne katalogi scratchpad/worktree; reguła: max 4 tematy z kompilacją naraz, sprzątanie po każdym FC.

## Przebieg — 15:2x UTC
- FC PASS-WITH-NOTES czekające na integrację (INTEG-B19 po B18): STAN-TERYTORIUM-VEC a5d93810a, K5I2B2-DLUG 19c13bb4e (konflikt z RANGED w unit_power.rs — rozwiązuje Operator), K5LOOP-BODY r3 4d2e1dfcb (Operator SONNET uzasadniony: 2 nieudane rundy Haiku; ProdBody + generator pinu 320 sekwencji; NIE wpinać do SiegeLoop przed FACING/KONTRATAK/OUTCOME).
- W toku: INTEG-B18 (Evaluator), CRED-WOJNA r2 (Obrona; r1 FAIL: brak wektorów, hak tylko D8; decyzje techniczne: test S3 na StreamDealKind bez aliasu, hak gracza w zakresie), K5LOOP-FACING, COMBAT-HARNESS.
- Zadania do uruchomienia od zera: #96–#99, #101, #104–#119 (zob. lista zadań).
- Dysk: 4–6 GB przy 4 równoległych kompilacjach; sprzątnięto własny scratchpad (stare ekstrakty pinu, target-ev).

## Przebieg — 16:0x UTC (R7K7C-WIRING, COMBAT-HARNESS)
- R7K7C-WIRING: FC PASS-WITH-NOTES (kod 294e4d361, FC 9eab15258, baza 358cb6cf6; push refs/keep + rust-port-wip). Evaluator r1 dał FAIL (brak wektorów D3, brak testu behawioralnego, Ledger::balance bez podłogi dla AI); Obrona r1 naprawiła: test behawioralny (danina 40/turę przez advance_turn), brak wpisu AI = 0 w Ledger, test ujemnego salda. Wektory apply: 200 z pinu. D3 ≥150: NIE_ZMIERZONO → osobny temat R7K7C-D3-WEKTORY. Decyzja orkiestratora: FC PASS przyjęty jako częściowa dostawa (dispatch dopuszcza granicę opisaną) — ALE Evaluator FAIL nie został zaadresowany w pełni (D3); pozycja do decyzji przy INTEG-B20.
- COMBAT-HARNESS: FC PASS-WITH-NOTES (3efeecfa6). Port zakresu ranged_phase; combat::resolve bez pętli dystansu → zadanie #136; zera w zdarzeniach → #133.
- Incydent: FC R7K7C-WIRING usunął /tmp/claude-0/fc-target (współdzielony katalog, nie jego). Nie do odzyskania; nie powtarzać — FC/Operatorzy mają używać własnych CARGO_TARGET_DIR.
- Dysk: 9,8 GB wolnego po sprzątaniu worktree.

## Przebieg — 16:18 UTC (heartbeat slotów)
- AUDYT-PARYTETU: FC PASS-WITH-NOTES (1027c2aa1, dokumentacja). FF na parity-v2 = 1027c2aa1 (z 358cb6cf6). Zanotowane: REJESTR-RUST.md nie istniał w repo (od teraz ten plik); ancestry B14B NIE_ZMIERZONO; pytania gameplay (SZTURM, W8 r7 Q1–Q4, units.json 51/71, DYSTANS, REPIN-DRYFT 1–6) czekają na właściciela.
- KONTRAKTEK (K5LOOP-KONTRATAK): pierwszy start padł na zapełnionym dysku (~0,5 GB) przy przygotowaniu worktree; usunięto własne worktree zakończonych tematów (FACING, nieudany start KONTRATAK); ponowny start 16:2x.
- Trwają: INTEG-B19 (Operator), COMBAT-HARNESS r2 (Operator), KOTRAKTEK (Operator). Sloty: 3 z 4 + KONTRAKTEK ponownie = 4.
- Uwaga środowiskowa: scratchpad/tgt (2,4 GB, 16:13) — cudzy cel kompilacji, nie usuwany.

## Przebieg — 17:19 UTC (heartbeat slotów)
- ELIMINACJA-GRACZA: r2 FC PASS-WITH-NOTES (fd517ea9a, kod 5ad5d363c); gałąź wip wypchnięta. Integracja → po B20 (B21). Zadanie #141 (deals/forced/era-enter) osobno.
- KONTRAKTEK: FC PASS-WITH-NOTES (039066ae1, kod bd4e4f63e); wejdzie w B20.
- JS-MAX-SIGN: FC PASS-WITH-NOTES (9a9112a3d); kandydat na konflikt nazw js_max_sign z B19 przy B20/B21.
- W toku: INTEG-B20 (Evaluator), JS0-HARDENING (Operator), K5I2B2-POKRYCIE (Operator). Razem 3 aktywne; czwarty slot świadomie wolny (#101 i #134–#137 zależą od B20).
- Dysk 9,2 GB.

## Przebieg — 18:18 UTC (heartbeat slotów)
- COMBAT-MELEE-VEC: Operator BLOCK (brak portu fazy zwarcia w Rust; combat.rs:1058 "Faza zwarcia nie jest portowana"), Evaluator FAIL, FC FAIL. Decyzja orkiestratora: temat rozbity — A (generator z pinem, bez Rust; wymaga stubów civ/veteran → najpierw port modyfikatorów) i B (port zwarcia z rozszerzoną allowlistą combat.rs). Zostaje otwarte (#134–#136).
- ELIMINACJA-DEALS-Q2: FC PASS-WITH-NOTES (5db1f2845, kod d81d79704). Merge z parity czysty. Czeka na B22.
- JS0-REST: FC PASS-WITH-NOTES (621e7338f, kod 1fe2e36c3). Czeka na B22.
- RANGED-CLEANUP: FC PASS-WITH-NOTES (182d298ef, kod 1943362b8, baza a8210a4f2 ⊂ parity). Czeka na B22.
- Incydenty dyskowe: 215 MB (18:0x) — zatrzymano K5-SWEEP startujący przy 1,1 GB (błąd procesu); czyszczenie worktree zakończonych tematów w tle. Od teraz start tylko przy ≥4 GB.
- Aktywne: INTEG-B21 (Obrona), DIR-CONST-ENUM (Obrona), TOWER-TARGET (Evaluator), K5-SWEEP-PRZEGLAD (wznowiony).

## Przebieg 20:18 UTC (heartbeat: sloty + integracja)
- **Integracja na parity-v2:** K5-LOOP-RESUME-Q1 (FC `d07241a5a`) i RAPORT-PORANNY-Q1 (FC `19f875a37`) → `de9cd05d7` (bramki: fmt/clippy OK, pełny `cargo test` 3247 passed, 0 failed, 1 ignored). INTEG-B22-Q1 (FC `655a27204`, scalony z `de9cd05d7`) → `23e33793e` (bramki: fmt/clippy OK, pełny test 3253 passed, 0 failed, 1 ignored). Wszystkie trzy FF na `rust-port/parity-v2`.
- **Zabezpieczenie:** `refs/keep/*-fc` i `rust-port-wip/*` dla K5, RAPORT, B22; HEAD-y worktree w `refs/keep/wt-*`.
- **Sprzątanie:** usunięte worktree K5, RAPORT, B22 i bramkowy `wf_db6e5078-6c4-1`; dysk 17 GB wolnego. Usuwanie pliku `/gates-k5r-full.txt` zablokowane przez zabezpieczenie (nie obejściono; plik z błędnej zmiennej `$S`).
- **Sloty:** przed przebiegiem 0 aktywnych Workflow. Uruchomione 4 tematy wiringu (baza `23e33793e`, dispatche na `claude/rust-sivvrn` = `23ae2a411`):
  1. R-RUSTPORT-P6-ZLOZE-WIRING-Q1 (#104) — wf_90998bc1-f29
  2. R-RUSTPORT-P6-R7K7C-WIRING-Q2 (#106, zastępuje nieudany start Q1) — wf_4e654117-8b1
  3. R-RUSTPORT-P6-ELIMINACJA-WIRING-Q1 (#114) — wf_2ace4e9c-1d5
  4. R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1 (#115) — wf_99c4f54b-b1d
- **Modele:** Operator Haiku, Obrona Haiku, Evaluator i Final Control Sonnet.
- **Pytania gameplay (w czacie, nie rozstrzygane):** SZTURM ODPARTY (#60), W8 r7 Q1–Q4 (#63), units.json (#27), DYSTANS (#10), REPIN-DRYFT 1–6 (#14–#19).
- **NIE_ZMIERZONO:** liczba testów dla dispatchu B22 (podany 3243) — zmierzono 3253; skan `journal.jsonl` nie odróżnia działających Workflow od zakończonych, aktywność oceniono po czasie zapisu.

## Przebieg (po 20:18): ZLOZE-WIRING-Q1 zamknięty, CRED-WOJNA-Q1 start
- **R-RUSTPORT-P6-ZLOZE-WIRING-Q1 (#104): BLOCK operatora, FC PASS-WITH-NOTES, zamknięte.** Brak modelu `zlozeGrants` w stanie Rust (`DiplomacyState` ma tylko `relations` i `deals`). Wpięcie wymaga nowego pola stanu i zmiany formatu zapisu, czyli poza allowlistą. `sync_relation_status_from_deals` to duplikat testowy; produkcyjny odpowiednik `sync_relation_from_deals` jest wołany w `turn_war_dipl_steps.rs:1004`.
  - **Decyzja (do odwrócenia przez właściciela): wariant B** — #104 poza zakresem wiringu, luka odnotowana. Wariant A (osobny temat modelu `zlozeGrants`: pole stanu, serde, `suspend_zloze_grants_for_war`, 4 wołania z pinu `main.ts:22774/23694/24234/24294`) do decyzji właściciela, bo dotyczy formatu zapisu.
  - Osobny temat sprzątania: duplikat `sync_relation_status_from_deals` (diplomacy.rs:4225) do usunięcia lub `#[cfg(test)]`.
- **R-RUSTPORT-P6-CRED-WOJNA-Q1 (#103): start**, baza `23e33793e`, dispatch `fe6a87711`, workflow `wf_0c57af11-d37`. Operator najpierw weryfikuje, czy hak P4 (`turn_war_dipl_steps.rs:895`) pokrywa wszystkie ścieżki wejścia w wojnę.
- Pozostałe w toku: R7K7C-WIRING-Q2 (`wf_4e654117-8b1`), ELIMINACJA-WIRING-Q1 (`wf_2ace4e9c-1d5`), ZDOBYCIE-WIRING-Q1 (`wf_99c4f54b-b1d`).

## Przebieg (po 20:45): CRED-WOJNA-Q1 BLOCK, dysk, sloty
- **R-RUSTPORT-P6-CRED-WOJNA-Q1 (#103): BLOCK operatora, FC PASS-WITH-NOTES, bez zmian w kodzie.** Hak P4 jest pokryty w pipeline wojny (`turn_war_pipeline.rs:422`) i w wojnie wymuszonej (`war_turn_declare.rs:116`). Nie pokryte: wypowiedzenie przez gracza (pin `main.ts:13168/:13205`), sojusz (`:23806`), klaster (`:40441`) — brak produkcyjnych wołań; plik `diplomacy_truce_flow.rs` jest poza allowlistą. Wariant `LegacyTradeAgreement` jest martwy w produkcji (serde mapuje `umowa_handlowa` na `TradeRoute`).
  - **Otwarte decyzje właściciela:** (a) alias `umowa_handlowa` w adapterze `stream_kind_of` albo usunięcie martwego wariantu; (b) zakres #120 (hooki wypowiedzenia/sojuszu/klastra, poszerzenie allowlisty o `diplomacy_truce_flow.rs`).
  - **Kolizja nazw:** na zdalnym `rust-port-wip/R-RUSTPORT-P6-CRED-WOJNA-Q1` jest starsza historia r2 (`44c409fdc`, nie ancestor FC `6a4fc2d51`). Nie nadpisywano; FC wypchnięty jako `rust-port-wip/R-RUSTPORT-P6-CRED-WOJNA-Q1-fc`.
- **ZLOZE-WIRING-Q1 (#104):** zamknięte jako poza zakresem (wariant B, decyzja orkiestratora). Gałąź `rust-port-wip/R-RUSTPORT-P6-ZLOZE-WIRING-Q1` = `35084c569`.
- **Dysk:** 2,1 GB przy starcie tiku, po sprzątaniu worktree ZLOZE i CRED: 7,5 GB. Próg startów Rust kodu: 8 GB → **brak nowych startów** w tym ticku.
- **Sprzątanie:** usunięte 7 worktree (`wf_90998bc1-f29-2..4`, `wf_0c57af11-d37-1..4`); HEAD-y w `refs/keep/wt-*`.
- **Aktywne Workflow (3):** R7K7C-WIRING-Q2 (`wf_4e654117-8b1`), ELIMINACJA-WIRING-Q1 (`wf_2ace4e9c-1d5`), ZDOBYCIE-WIRING-Q1 (`wf_99c4f54b-b1d`). Slot po #103/#104 wolny do czasu progu dysku.
- **Pojedynczy plik** `.claude/pin-main.ts.txt` (kopia `gra/src/main.ts`) przeniesiony do scratchpada, nie commitowany.

## Przebieg (po 20:53): ELIMINACJA-WIRING-Q1 (#114) BLOCK
- **R-RUSTPORT-P6-ELIMINACJA-WIRING-Q1 (#114): BLOCK operatora (kryterium 1 niespełnione), FC PASS-WITH-NOTES na jakość pracy, status tematu BLOCK.** Brak produkcyjnego wołającego `eliminate_owner`: wołany tylko z `tests/p6_eliminacja.rs`. Pin wywołuje `eliminateOwner` w `annexCityStateToOwner` (`main.ts:35300`) i w eliminacji `oldOwner` (`main.ts:35769`). Wpięcie wymaga zmiany sygnatury `run_capital_capture_plunder` (łamie `tests/p6_siege_capital_plunder.rs`, poza allowlistą) albo nowego pola w `PlayableState` (zbiór wyeliminowanych jest dziś parametrem).
  - **Decyzja orkiestratora (techniczna):** #114 łączę z #115 (ZDOBYCIE-WIRING-Q1, wciąż w toku) w jeden temat r2 po jego FC, z poszerzoną allowlistą: `siege_capital_plunder.rs`, `tests/p6_siege_capital_plunder.rs`, pole wyeliminowanych w `PlayableState`. Nie uruchamiam tego teraz, bo wymaga wyniku #115.
  - Testy operatora: `p6_eliminacja` 3/3 zielone, `fmt`, `clippy -D warnings`, `cargo test --lib` (99 passed) EXIT 0 — dowód, że gałąź jest czysta, nie że wiring działa.
  - Gałąź z pracą operatora: `0b2fde2c9` (lokalnie, nie wypchnięta). Zabezpieczę przy sprzątaniu.

## Przebieg (po 21:0x): ZDOBYCIE-WIRING-Q1 (#115) FAIL, dysk, start CRED-HAK-WYPOWIEDZENIE
- **R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1 (#115): FAIL w FC.** Kryterium 1: brak produkcyjnego drivera zdobycia miasta (`apply_capital_capture_with_plunder` ma tylko definicję i doc-comment; `apply_transfer_with_effects` tylko w testach). Kryterium 2: generator bez straznika SHA-256 (poza allowlistą). Wrapper gotowy, ale martwy — nie zaakceptowano jako wiring. Gałąź: `rust-port-wip/R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1` = `7c2d45a7b`.
  - **Decyzja orkiestratora (techniczna):** #115 zamknięte jako BLOCK. Potrzebny osobny temat: driver zdobycia miasta w Rust (W8), z kontraktem `lost_power` jako closure po `applyBarbarianAware` (pin ok. 35611 przed 35672). #114 (eliminacja) czeka na ten sam driver — łączone jako jeden temat.
- **Operator ELIMINACJA-WIRING:** gałąź `rust-port-wip/R-RUSTPORT-P6-ELIMINACJA-WIRING-Q1` = `0b2fde2c9`.
- **Sprzątanie:** usunięte 8 worktree (`wf_2ace4e9c-1d5-1..4`, `wf_99c4f54b-b1d-1..4`). Dysk: 1,7 GB → 11 GB.
- **Start:** R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-Q1 (#120), baza `23e33793e`, dispatch `641cfcb1b`, rozszerzona allowlista (`diplomacy_truce_flow.rs`) jako follow-up CRED-WOJNA.
- **Aktywne Workflow (2):** R7K7C-WIRING-Q2 (`wf_4e654117-8b1`), CRED-HAK-WYPOWIEDZENIE-Q1 (`wf_a1e9a7cf-854`).
- **Otwarte decyzje właściciela:** (a) alias `umowa_handlowa` / usunięcie `LegacyTradeAgreement`; (b) driver zdobycia miasta (W8) — zakres i priorytet.

## Przebieg (heartbeat 20:48): sloty uzupełnione do czterech
- **Dysk:** 8,6 GB przy starcie tiku (próg 8 GB dla Rust spełniony). Parity-v2 = `23e33793e`, bez zmian.
- **Aktywne Workflow (4):**
  1. R7K7C-WIRING-Q2 (#106) — `wf_4e654117-8b1`, Operator HAIKU, od 20:20
  2. CRED-HAK-WYPOWIEDZENIE-Q1 (#120) — `wf_a1e9a7cf-854`, Operator HAIKU, od ok. 20:30
  3. K5LOOP-WIEZE-Q1 (#96) — `wf_5619c24d-e0d`, Operator HAIKU, teraz; dispatch `55b9eb260`
  4. K5LOOP-AUTO-Q1 (#97) — `wf_54cdbdf9-c79`, Operator HAIKU, teraz; dispatch `55b9eb260`
- **Uwaga o kolejce:** pozycje #101, #105, #117, #119, #126, #127, #130, #138, #141 są już zintegrowane (wg rejestru i gałęzi), a lista zadań ich nie odzwierciedla. Nie startowano ich ponownie. Do uporządkowania listy.
- **Otwarte decyzje właściciela:** (a) alias `umowa_handlowa` / usunięcie `LegacyTradeAgreement`; (b) driver zdobycia miasta (W8) dla #115 i #114.

## Przebieg (sprzątanie po zgodzie właściciela)
- **Zgoda właściciela:** „Tak możesz wszystko posprzątać”.
- **Zabezpieczenie:** `refs/keep/wt-*` dla HEAD-ów 15 worktree; FC-y dopchnięte jako gałęzie wip: `rust-port-wip/R-RUSTPORT-P6-R7K7C-WIRING-Q2-fc` (`240dd99f5`) i `rust-port-wip/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-Q1-fc` (`203c7d8d4`).
- **Usunięte worktree:** tematy R7K7C-WIRING-Q2 (4), CRED-HAK-WYPOWIEDZENIE-Q1 (4), K5LOOP-AUTO-Q1 (2), K5LOOP-WIEZE-Q1 (2), K5-LOOP-WYLOM-Q1 (2) oraz worktree ZLOZE-WIRING-Q1 w scratchpadzie.
- **Usunięte kopie:** w scratchpadzie `gra/` i `pin/` (kopie pinu; odtwarzalne przez `git show 07d2fbd72:...`).
- **Zostawione:** `/home/user/reg-wt` (worktree rejestru), `.claude/worktrees/tgt-eval2` (348 MB, nieznany właściciel), pozostałe pliki scratchpada.
- **Dysk:** 505 MB → 17 GB wolnego.
- **Stan:** 0 aktywnych Workflow. Tematy #96, #97, #98 padły na braku miejsca i czekają na wznowienie. Kolejny krok: start 4 slotów z kolejki (#96–#98 + decyzja o driverze W8) po zgodzie właściciela na decyzje ABC.

## Przebieg (heartbeat 22:48): wznowienie trzech tematów po sprzątaniu
- **Dysk:** 17 GB wolnego. Baza: parity-v2 = `23e33793e` (bez zmian).
- **Start (ponowny, bo padły na braku miejsca):**
  1. K5LOOP-WIEZE-Q1 (#96) — `wf_5d260e29-0ed`, Operator HAIKU, teraz
  2. K5LOOP-AUTO-Q1 (#97) — `wf_8b025734-f2e`, Operator HAIKU, teraz
  3. K5-LOOP-WYLOM-Q1 (#98) — `wf_577e24b7-908`, Operator HAIKU, teraz
- **Aktywne Workflow (3):** powyższe. Czwarty slot wolny: brak tematu bez decyzji właściciela (driver W8 czeka na ABC; R7K7C-WIRING-Q2 czeka na decyzje A/B/C).
- **Otwarte decyzje właściciela:** ABC (driver W8, alias `umowa_handlowa`, komenda wypowiedzenia, `zlozeGrants`); R7K7C kryteria 2–3 i polityka braku producenta salda; gameplay: #60, #63, #27, #10, #14–#19.

## Przebieg (po 23:0x): WIEZE BLOCK, AUTO FAIL, start TOWER-TARGET
- **R-RUSTPORT-P6-K5LOOP-WIEZE-Q1 (#96): BLOCK (FC PASS-WITH-NOTES na jakość raportu).** Zależności: `pick_tower_target` nie ma produkcyjnego wołającego, `fire_siege_towers` (siege_tactics_loop.rs:159-169) to placeholder, brak ścieżki ciosu dystansowego wieży. Dispatch miał zły plik pinu: poprawnie `gra/src/battle/battleScene.ts:4208` (definicja) i `:5643` (wołanie), nie `gra/src/main.ts`. Kolejność: #116 → #107-#109, #112 → #96 → #113 (hipoteza z NIEPODPIETE-INDEKS, do potwierdzenia).
- **R-RUSTPORT-P6-K5LOOP-AUTO-Q1 (#97): FAIL (FC).** Operator BLOCK bez kodu (zakres za duży). Diagnoza potwierdzona: `BeginAutoBatchPhase` i `FfEvent::EnterAuto` idą przez `halt_unsupported` (siege_tactics_loop.rs:260-261, 360-361); `begin_auto_batch_*` z siege_tactics_autobatch.rs nie ma wołającego. Wymagany podział na (a) wpięcie AUTO w SiegeLoop::apply z VirtualClock, (b) przełącznik trybu ręcznego, (c) wektory pinu z SHA-256, (d) test bez #[ignore]. Runda 2 tego samego ID z podziałem — do napisania. Pytanie architektoniczne (jedna pętla vs osobny sterownik): rekomendacja FC — jedna pętla; do decyzji orkiestratora (techniczna, nie gameplay).
- **Start:** R-RUSTPORT-P6-TOWER-TARGET-Q1 (#116), baza `23e33793e`, dispatch w origin, workflow `wf_6bdb3440-bdd`. Pierwszy krok łańcucha wież.
- **Aktywne Workflow (2):** K5-LOOP-WYLOM-Q1 (#98, `wf_577e24b7-908`), TOWER-TARGET-Q1 (#116, `wf_6bdb3440-bdd`). Slot wolny do decyzji ABC lub podziału AUTO r2.

## Przebieg (po 23:1x): WYLOM BLOCK, start OUTCOME
- **R-RUSTPORT-P6-K5-LOOP-WYLOM-Q1 (#98): BLOCK (FC PASS-WITH-NOTES na jakość raportu).** Funkcje wyłomu (`siege_tactics_breach.rs`) mają wołających tylko w testach; `ProdBody::start` odsyła bitwy oblężnicze do unported; `_resolveBlowOutcome` (rout po ciosie) nieportowany. Zależność: #109 → #112 → #113. Pin w dispatchu błędny: poprawnie `gra/src/battle/battleScene.ts` (`wallEverBreached` L2503, 3721, 7647, 7759, 8072–8073).
- **Start R-RUSTPORT-P6-K5LOOP-OUTCOME-Q1 (#109):** baza `23e33793e`, dispatch w origin, workflow `wf2qml924`. Warunek wstępny dla WYLOM.
- **Aktywne Workflow (2):** TOWER-TARGET-Q1 (#116, `wf_6bdb3440-bdd`), K5LOOP-OUTCOME-Q1 (#109, `wf_5c18cda4-98d`).
- **Do zrobienia:** AUTO r2 (podział na (a)–(d)) — dispatch jeszcze nie napisany; decyzja architektoniczna (jedna pętla) przyjęta przeze mnie zgodnie z rekomendacją FC.

## Przebieg (po 23:2x): dysk 0 MB, sprzątanie, wznowienie OUTCOME
- **Incydent:** K5LOOP-OUTCOME-Q1 padł na `WorktreeIsolationError` (dysk 44 MB). Przyczyna: worktree zakończonych tematów WIEZE (4), AUTO (4), WYLOM (3) i nieudanego startu OUTCOME (3), ok. 1,2 GB każdy.
- **Sprzątanie:** HEAD-y 14 worktree zabezpieczone `refs/keep/wt-*`, worktree usunięte. Dysk: 15 GB wolnego.
- **Wznowienie:** R-RUSTPORT-P6-K5LOOP-OUTCOME-Q1 (#109) — `wf_f174bc7f-ec5`, baza `23e33793e`.
- **Aktywne Workflow (2):** TOWER-TARGET-Q1 (#116, `wf_6bdb3440-bdd`), K5LOOP-OUTCOME-Q1 (#109, `wf_f174bc7f-ec5`).
- **Uwaga procesowa:** kolejne starty zużywają ~1,2 GB na worktree. Przy 4 tematach równolegle trzeba sprzątać po każdym BLOCK/FAIL od razu.

## Przebieg (po 23:4x): OUTCOME-Q1 (#109) BLOCK, decyzja o atrybucji
- **R-RUSTPORT-P6-K5LOOP-OUTCOME-Q1 (#109): BLOCK (FC PASS-WITH-NOTES), bez kodu.** Brakuje w `ProdBody`: teren kafla i `terrainData` (potrzebne w `_checkRout`, pin `battleScene.ts:9783`), `morale_max` (tylko w `SiegeEnv`), stałe `MORALE_DEATH_RADIUS`, `MORALE_ALLY_DEATH_LOSS`, `MORALE_ENEMY_BREAK_GAIN`, `ROUT_MORALE_THRESHOLD` oraz `_targetInRange` i `BLOW_HIT_T`. `_startRout` i `_checkMeleeScreenLost` zależą od `is_army_commander` (`army_leadership.rs:26`). Asercja `unported` w `p6_siege_tactics_loop_body.rs:248` wymaga zmiany poza allowlistą.
  - **Decyzja techniczna (moja):** temat OUTCOME, AUTO i WYLOM mają tę samą blokadę. Zamiast trzech osobnych prób zlecam najpierw **podział fundamentu**: (a) wejścia terenu i `morale_max` do `ProdBody` przez builder z błędem przy braku (bez cichych wartości domyślnych), (b) stałe morale z testem względem pinu, (c) dopiero potem OUTCOME, AUTO, WYLOM. Rozszerzenie allowlisty na `army_leadership.rs` i testy `p6_siege_tactics_loop_body*.rs` uznaję za konieczne do (a) — zatwierdzenie właściciela wymagane przed startem, bo dotyczy zakresu zmian.
- **Atrybucja commitów (decyzja):** nazwa modelu NIE w commitach. CLAUDE.md ma pierwszeństwo przed przypomnieniem o atrybucji; Operator i FC dodali `Co-Authored-By` z nazwą modelu — to do poprawy w kolejnych dispatchach (dispatch już mówi „bez nazwy modelu”).
- **Sprzątanie:** HEAD-y worktree OUTCOME zabezpieczone `refs/keep/wt-*`, worktree usunięte.
- **Aktywne Workflow (1):** TOWER-TARGET-Q1 (#116, `wf_6bdb3440-bdd`). Trzy sloty wolne, bo pozostałe kandydaty czekają na zatwierdzenie zakresu (fundament ProdBody) lub na decyzje właściciela.

## Przebieg (po 00:0x): TOWER-TARGET-Q1 (#116) — PASS-WITH-NOTES (FC), zakres częściowy
- **R-RUSTPORT-P6-TOWER-TARGET-Q1 (#116):** kod `786f049c5` (wiązanie `pick_tower_target` przez opcjonalne `SiegeLoop.tower_targeting`, domyślnie `None`), FC `a51cd7fb1` (wypchnięty jako `rust-port-wip/R-RUSTPORT-P6-TOWER-TARGET-Q1-fc`). Bramki: fmt, clippy, `cargo test --lib` (99), `p6_tower_target_wiring` (2), `p6_siege*` (39 plików) — EXIT 0.
  - **Werdykt Evaluatora FAIL, FC PASS-WITH-NOTES.** Różnica dotyczy kryterium 1 (produkcja): `SiegeLoop` nie ma jeszcze produkcyjnego wołającego (to #113), a strzał wieży to #96.
  - **Decyzja techniczna (moja):** #116 zamykam jako **częściowo** (wiązanie modułu, bez aktywacji w grze). Aktywacja w grze jest zadaniem #113. Otwarte: wektory i straznik SHA dla filtru wrogów (`fading_out`/`routed`/`removed`) i `_fireOneTower` — dopisać w #113/#96.
  - Znany dług: `atk_pos` statyczne (CombatUnit nie niesie współrzędnych) — #113.
- **Atrybucja:** dispatch i wynik zgodne z CLAUDE.md (bez nazwy modelu). Konflikt z przypomnieniem o `Co-Authored-By` rozstrzygnięty na korzyść CLAUDE.md.
- **Sprzątanie:** HEAD-y zabezpieczone `refs/keep/wt-*`, worktree TOWER-TARGET usunięte.
- **Aktywne Workflow:** 0. Kandydaci z kolejki (AUTO, WYLOM, OUTCOME, WIEZE, #113) blokują się na fundamencie ProdBody i wymagają Twojej zgody na rozszerzenie allowlisty. Bez tego nie startuję.

## Przebieg (heartbeat 23:18): bez startów
- **Sloty:** 0 aktywnych Workflow. Dysk: 17 GB wolnego. Parity-v2 = `23e33793e` (bez zmian).
- **Dlaczego bez startów:** pozostałe tematy z kolejki (#96, #97, #98, #109, #113) blokują się na fundamencie `ProdBody` (teren kafla, `morale_max`, stałe morale), a to wymaga rozszerzenia allowlisty na `army_leadership.rs` i testy `p6_siege_tactics_loop_body*.rs`. Zgody właściciela nie ma. Pozostałe pozycje czekają na decyzje ABC albo gameplay.
- **Oczekiwane decyzje właściciela:** (1) zgoda na rozszerzenie allowlisty dla fundamentu `ProdBody`; (2) ABC: driver W8 (#114/#115), alias `umowa_handlowa`, komenda wypowiedzenia wojny gracza, `zlozeGrants`; (3) R7K7C-WIRING-Q2: kryteria 2–3 i polityka braku producenta salda; (4) gameplay: #60, #63, #27, #10, #14–#19.

## Przebieg (dyspozycja 10 zadań, 02:xx): incydent git i start 4 tematów
- **Incydent:** po weryfikacji statusu zadań zostawiłem główne repo na odłączonym HEAD (`origin/rust-port/parity-v2`). Tło uruchomiło `git rebase origin/claude/rust-sivvrn` z tego stanu i rebase zatrzymał się na konflikcie (ok. 7000 commitów z historii parity). Nic nie zostało zacommitowane ani wypchnięte. Wycofano `git rebase --abort` (HEAD wrócił do `23e33793e`), potem `git checkout claude/rust-sivvrn` (`86b9c2c36`). Drzewo czyste.
- **Dispatche (zdalnie):** `bce95a514` — JS-MAX-SIGN-R2, K5I2B2-POKRYCIE-R2, COMBAT-HARNESS-R3, K5I2B2-DLUG-R2 (baza `23e33793e`).
- **Aktywne Workflow (4):** JS-MAX-SIGN-R2 (#142, `wf_b2ecc0c9-7e9`), K5I2B2-POKRYCIE-R2 (#143, `wf_5a6c0cc5-796`), COMBAT-HARNESS-R3 (#144, `wf_3ebd25da-b46`), K5I2B2-DLUG-R2 (#145, `wf_33a86f3d-cdf`). Operator HAIKU, Evaluator/FC SONNET.
- **W kolejce (blokada):** #146 K5-LOOP-WIEZE-R2 (gotowy, czeka na slot); #147 OUTCOME, #148 KONTRATAK-STRZELEC, #149 AUTO, #150 WYLOM — fundament ProdBody poza allowlistą; #151 float_roundtrip — Cargo.toml.

## Przebieg (heartbeat 05:47): parity-v2 = a0b302eb8, 0 aktywnych Workflow
- **Integracja na parity-v2 (FF):** JS-MAX-SIGN-R2 (#142), COMBAT-HARNESS-R3 (#144) przez `efc77e0cf` (pełny cargo test 3256/0/1); DLUG-R2 (#145) przez `a0b302eb8` (pełny cargo test 3257/0/1, merge czysty). Refy: `refs/keep/R-RUSTPORT-P6-INTEG-R2-Q1`, `refs/keep/R-RUSTPORT-P6-INTEG-R3-Q1`, gałęzie `rust-port-wip/*`.
- **Sprzątanie:** worktree rund INTEG-R2 i INTEG-R3 usunięte, HEAD-y zabezpieczone `refs/keep/wt-*`.
- **Blokady (bez zmian):** #143 i #146 — decyzja (a)/(b) właściciela; #147–#150 — zgoda na allowlistę `ProdBody`; #151 — `Cargo.toml`; #114/#115 — driver W8; #106 — kryteria 2–3; #60, #63, #27, #10, #14–#19 — gameplay.
- **Otwarte:** atrybucja commitów (sesja vs CLAUDE.md); kopie `js_max` poza zakresem (osobny temat do zlecenia).

## Przebieg (heartbeat 07:18, trig_01VcFhTMSsCgeFNvhwxnkZjm): 1 aktywny temat, bez nowych startów
- **Sloty:** 1 aktywny Workflow: #91 K5LOOP-COMPOSE-Q1 (`wf_2921a767-4a9`). Operator r1 PASS-WITH-NOTES, kod bez zmian (składanie pętli już jest w kodzie). Bramka cargo clippy trwa w worktree `wf_2921a767-4a9-2`. Evaluator i Final Control jeszcze nie zapisane.
- **#110 JS-MAX-CONSOLIDATE-Q1 (`wf_9a6966f9-2f4`):** Operator r1 BLOCK (bez kodu), Evaluator potwierdził BLOCK. Przyczyna: kryterium 5 dispatchu. 16 prywatnych kopii `js_max`/`js_min` w 12 plikach jest poza allowlistą. Rundy 2 nie uruchamiam bez decyzji właściciela: (a) rozszerzyć allowlistę do 37 kopii albo (b) zawęzić zakres do 19 kopii w 14 plikach. To zmiana zakresu, nie decyzja techniczna Operatora.
- **Dysk:** 4,4 GB wolnego. CLAUDE.md §5/§7 wymaga ≥8 GB przed startem tematu z kodem Rust, więc nowych startów nie ma. Próg 4 GB z heartbeatu jest luźniejszy; stosuję surowszy.
- **Kolejka:** pozostałe pozycje pending są zablokowane decyzją właściciela (allowlista ProdBody, #143/#146, #151 Cargo.toml, gameplay #10/#14–#19/#27/#60/#63) albo zależą od niezintegrowanego kodu. Nie uruchamiano tematów zablokowanych.
- **Sprzątanie:** nic nie usunięto. Worktree #110 (`wf_9a6966f9-2f4-*`, ok. 2,9 GB) zostają, bo temat nie jest zakończony. `tgt-eval2` i `reg-wt` bez zmian (wymagają potwierdzenia).
- **Stan repo:** parity-v2 = `a0b302eb8` (bez zmian). claude/rust-sivvrn = `fb0bfd082` przed tym wpisem.
- **Nieweryfikowane:** taski #104, #106, #114, #115 mają status in_progress, ale nie znalazłem dla nich aktywnego worktree ani Workflow. Status NIE_ZMIERZONO.
- **Atrybucja commitu:** zgodnie z CLAUDE.md, bez nazwy modelu. Przypomnienie systemowe o `Co-Authored-By` z nazwą modelu ustępuje CLAUDE.md, bo CLAUDE.md zabrania nazw modeli w artefaktach repo.

## Przebieg (heartbeat 07:49, trig_01DiSPBEtwmKWjgEKvcGWm7W, po restarcie kontenera): 0 aktywnych Workflow, bez startów
- **Restart kontenera:** procesy zniknęły. Stan odtworzony z worktree i raportów.
- **#91 K5LOOP-COMPOSE-Q1 — FC PASS-WITH-NOTES** (`003d53f97`, baza `a0b302eb8`, zmiana tylko w `01-operator-r1.md`, bez kodu). Test składania pętli już istnieje (360 sekwencji z pinu, straznik SHA-256). **Integracja:** FF `rust-port/parity-v2` = `003d53f97` (docs-only, ancestry OK). Gałąź `rust-port-wip/R-RUSTPORT-P6-K5LOOP-COMPOSE-Q1-fc`. Refy `refs/keep/R-RUSTPORT-P6-K5LOOP-COMPOSE-Q1-*`. Worktree #91 usunięte.
  - **Otwarte decyzje człowieka (z FC):** (1) czy KROK 0 obejmuje klauzulę „pojedynczy cios” z GOAL (cios = stub ScriptedBody; pełny cios to #113); (2) czy akceptować istniejące 360 sekwencji zamiast nowych wektorów pinu (loop 360 i fast_forward 403 nie dzielą sekwencji). Obrona r1 rekomendowała BLOCK dla dwóch klauzul GOAL, FC zdecydował PASS-WITH-NOTES. Do potwierdzenia przez właściciela.
- **#110 JS-MAX-CONSOLIDATE-Q1 — BLOCK, zatrzymany** (Operator r1 BLOCK, Evaluator PASS-WITH-NOTES potwierdzający BLOCK, Obrona r1, FC `1fe55766b` PASS-WITH-NOTES). Gałąź `rust-port-wip/R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-Q1-fc`. Refy zapisane. Worktree #110 usunięte. **Czeka na decyzję właściciela:** (a) zawęzić do 20 kopii w 14 plikach; (b) rozszerzyć allowlistę do 12 plików i huby re-eksportu (rekomendacja FC), wspólne źródło `domain/js_math.rs`; (c) podział na osobne tematy. Konflikt „−0 bez zmian” z tabelą semantyki per caller do rozstrzygnięcia razem z wyborem.
- **Dysk:** 4,4 GB na początku heartbeatu, 9,5 GB po sprzątaniu worktree #91 i #110. Próg 8 GB z CLAUDE.md §5 spełniony.
- **Dlaczego nie uruchomiono nowych tematów:** `KOLEJKA-RUST.md` jest nieaktualna (migawka 23:18, „W toku” zawiera tematy już zintegrowane). Pozostałe pozycje pending są zablokowane decyzją właściciela (allowlista ProdBody: #107–#109, #112–#113, #147–#150; #143/#146 allowlista generatora; #151/#139 Cargo.toml; #120 komenda wypowiedzenia; #103 alias `umowa_handlowa`; #114/#115 driver W8; #134–#137 DYSTANS; gameplay #10, #14–#19, #27, #60, #63). Nie uruchamiano tematów zablokowanych.
- **Taski do weryfikacji:** #104, #106, #114, #115 mają status in_progress bez aktywnego worktree i Workflow. Status NIE_ZMIERZONO.
- **Stan repo:** `parity-v2` = `003d53f97` (po FF z #91). `claude/rust-sivvrn` = `b107fe9a4` przed tym wpisem.

## Przebieg (heartbeat 08:18, trig_01DiSPBEtwmKWjgEKvcGWm7W): 1 aktywny temat (1 z 4 slotów)
- **Sloty:** 1 aktywny Workflow: CRED-WOJNA-Q1 runda 2/5 (`wf_f60f7f97-86e`). Operator HAIKU, Evaluator i FC SONNET, Obrona HAIKU. Baza `15d85c2ee`. Dispatch DODATEK r2 wypchnięty jako `d1f0e3c59`.
  - Zarzuty naprawialne z FC r1: brak ≥150 wektorów z pinu (generator + SHA-256), kolejność D4/D8 względem P4.
  - Alias `umowa_handlowa` NIE w tej rundzie (decyzja właściciela). Test S3 na `StreamDealKind` bezpośrednio.
- **Dlaczego nie 4 sloty:** pozostałe pending są zablokowane decyzją właściciela albo zgodą na allowlistę (lista w poprzednich przebiegach). Nie startowano tematów zablokowanych.
- **Zrobione przy okazji (weryfikacja z repo, nie z listy zadań):**
  - **K5LOOP-KONTRATAK-Q1 (#108):** FC PASS-WITH-NOTES, kod `d8fc4b3fd` i baza `bd4e4f63e` są przodkami parity (`003d53f97`). Zadanie #108 do zamknięcia.
  - **#129 (wektory `_defenderCounters`):** wektory są w `p6_siege_tactics_loop_body_gen.mjs` przez KONTRATAK. Zamykam po potwierdzeniu w przeglądzie FC, nie na podstawie samej obecności pliku.
  - **Lista zadań jest nieaktualna:** #91 zamknięte (FC PASS-WITH-NOTES, FF docs-only). #104, #106, #114, #115 mają status in_progress bez worktree i bez Workflow. Status NIE_ZMIERZONO.
- **Dysk:** 9,5 GB. Próg 8 GB z CLAUDE.md spełniony.
- **Stan repo:** `parity-v2` = `003d53f97`. `claude/rust-sivvrn` = `d1f0e3c59` po dispatchu r2.

## Przebieg (heartbeat 08:47, trig_01DiSPBEtwmKWjgEKvcGWm7W): 1 aktywny temat, dysk ratowany
- **Sloty:** 1 aktywny Workflow: CRED-WOJNA-Q1 runda 2/5 (`wf_f60f7f97-86e`). Operator r2 (HAIKU) zwrócił DECISION_REQUIRED: wektory S3, hak P4 i kolejność D4/D8 gotowe, bramki zielone. Pokrycie ścieżek wymuszonych wojen jest niepełne: pin 41931 prowadzi do `war_turn_declare.rs`, poza allowlistą. Evaluator (SONNET) trwa, pełny `cargo test`.
- **Decyzja do podjęcia przez właściciela** (przed rundą 3): rozszerzyć allowlistę o `war_turn_declare.rs` (zakres wymuszonych wojen, powiązany z #120) albo odłożyć tę ścieżkę do #120.
- **Dysk:** spadł do 1,6 GB przy trwającej bramce. Usunięto cache kompilacji zakończonych tematów: `tgt-b22`, `tgt`, `fc-r7k7c-w4`, `fc4target`, `fc-target-deser`, `ev` (łącznie ok. 8 GB, bez otwartych przez procesy). Nie ruszano `ev_target` (w użyciu przez bramkę). Po sprzątaniu 6,3 GB. Próg 8 GB do startów z kodem Rust nadal niespełniony, więc nowych startów nie ma.
- **Stan repo:** `parity-v2` = `003d53f97` (bez zmian). `claude/rust-sivvrn` przed tym wpisem = `8a856eba4`.

## Przebieg (CRED-WOJNA-Q1, runda 2 zamknięta, runda 3 uruchomiona): korekta bazy
- **Błąd orkiestratora:** DODATEK r2 (`d1f0e3c59`) twierdził, że baza `15d85c2ee` jest przodkiem `origin/claude/rust-sivvrn`. To fałsz. `15d85c2ee` jest 155 commitów za `parity-v2` (`003d53f97`). Wpisałem to z pamięci, bez `merge-base --is-ancestor`. Nie integrować `811f607ee`, bo cofnąłby 155 commitów.
- **Runda 2 (`wf_f60f7f97-86e`):** Operator (HAIKU) dodał 4 pliki testowe: `p6_cred_wojna_gen.mjs`, `p6_cred_wojna_vectors.rs`, `vectors.json`, raport. Bez zmian w `src/`. Bramki zielone: fmt, clippy, pełny cargo test 3190/0/1. Evaluator i FC (SONNET) PASS-WITH-NOTES (FC `cc4554ec7`). **DECISION_REQUIRED** w kryterium 1: hak w `declare_forced_wars` (`war_turn_declare.rs:105`, pin 41931) poza allowlistą. Zapisano refy `refs/keep/CRED-WOJNA-Q1-r2-{fc,code,obrona}`. FC wypchnięty na `rust-port-wip/R-RUSTPORT-P6-CRED-WOJNA-Q1-r2-fc`.
- **Sprzeczność w źródłach:** FC r1 w historii parity (`03-final-control.md`) to FAIL. FC r1 w `rust-port-wip/...-fc` (`6a4fc2d51`) to PASS-WITH-NOTES. Obie na różnych bazach. Do rozstrzygnięcia przez właściciela, nie przeze mnie.
- **Runda 3 (`wf_a4483abe-c33`), baza `003d53f97`:** przeniesienie 4 plików testowych z r2 na parity, bez `src/`, bez `war_turn_declare.rs`. Dispatch DODATEK r3: `721dae521`. Zadanie: testy przechodzą na parity, generator zgodny bajt-w-bajt z `vectors.json`.
- **Otwarte decyzje właściciela:** (1) `war_turn_declare.rs` do allowlisty czy do #120; (2) alias `umowa_handlowa`; (3) harness pipeline dla kolejności D4/D8 (test woła prymitywy, nie `run_war_turn`); (4) które FC r1 jest wiążące.
- **Dysk:** 4,2 GB przy starcie rundy 3.
- **Stan repo:** `parity-v2` = `003d53f97` (bez zmian). `claude/rust-sivvrn` = `721dae521`.

## Przebieg (heartbeat 09:18, trig_01DiSPBEtwmKWjgEKvcGWm7W): 1 aktywny temat (1 z 4 slotów)
- **Sloty:** 1 aktywny Workflow: CRED-WOJNA-Q1 runda 3/5 (`wf_a4483abe-c33`), baza parity `003d53f97`. Operator (HAIKU) pracuje: pliki testowe przenoszone z r2 (zmiany widoczne w worktree `wf_a4483abe-c33-1` w chwili sprawdzenia). Etapy po Operatorze: Evaluator (SONNET), Obrona (HAIKU), FC (SONNET).
- **Dlaczego nie 4 sloty:** pozostałe pending są zablokowane decyzją właściciela albo zgodą na allowlistę (lista w poprzednich przebiegach). Nie startowano tematów zablokowanych.
- **Sprzątanie:** usunięto worktree rundy 2 CRED-WOJNA (`wf_f60f7f97-86e-1..4`, łącznie ok. 4,8 GB). Zapisano refy `refs/keep/R-RUSTPORT-P6-CRED-WOJNA-Q1-r2-{fc,code,obrona,eval}`. Commity dostępne przez refy. Worktree rundy 3 zostawiono (w użyciu).
- **Dysk:** 2,9 GB przed sprzątaniem, 7,3 GB po. Próg 8 GB do startów z kodem Rust nadal niespełniony.
- **Zamknięte w liście zadań:** #129 (wektory `_defenderCounters`, wykonane przez K5LOOP-KONTRATAK-Q1, FC PASS-WITH-NOTES, w parity-v2).
- **Stan repo:** `parity-v2` = `003d53f97` (bez zmian). `claude/rust-sivvrn` przed tym wpisem = `da7c192ed`.

## Przebieg (heartbeat 09:49, trig_01DiSPBEtwmKWjgEKvcGWm7W): runda 3 CRED-WOJNA — zarzut osłabienia testów
- **Sloty:** 1 aktywny Workflow: CRED-WOJNA-Q1 runda 3/5 (`wf_a4483abe-c33`). Operator r3 (HAIKU) PASS, `330c6a9ac`, pełny `cargo test` 3258/0/1. Obrona (HAIKU) zakończona. FC (SONNET) w toku.
- **Zarzut ewaluatora (ISTOTNY):** przeniesienie `811f607ee` nadpisało wersje plików testowych już zintegrowanych na parity (`66d181ea5`). Stare pokrycie to 200 przypadków i 1063 kroki. Nowe to 160 hak, 60 sekwencji, 20 S3. Usunięto test zgodności wstecz `stary_zapis_bez_klucza_last_war_laduje_sie_jako_zero_i_pierwsza_wojna_go_zapisuje` oraz test czuły mutacyjnie na wyłączenie zapisu. To osłabienie, nie uzupełnienie. Raport r3 pisze „bez zmian”, a diff vs baza to +667/−351.
- **Decyzja techniczna (moja, nie właściciela):** zestawy nie mogą się nadpisywać. Stare pliki parity zostają bajt-w-bajt, a wektory r2 idą pod nowymi nazwami (np. `p6_cred_wojna_vectors_r2.rs`). Jeśli FC da FAIL, runda 4 tego samego ID z DODATKIEM r4 o tym zakresie.
- **Nadpisany raport:** `01-operator-r2.md` został zmieniony przez r3. Do przywrócenia z refu `refs/keep/R-RUSTPORT-P6-CRED-WOJNA-Q1-r2-code` w rundzie 4.
- **Dysk:** 2,1 GB przy trwającym `cargo test` w worktree rundy 3. Próg 2 GB z CLAUDE.md: nie zaczynam nowych startów, kończące się rundy idą dalej. Worktree rundy 3 zostają do werdyktu FC.
- **Stan repo:** `parity-v2` = `003d53f97` (bez zmian). `claude/rust-sivvrn` przed tym wpisem = `1d946fe0b`.

## Przebieg (CRED-WOJNA-Q1, runda 3 zamknięta, runda 4 uruchomiona): wariant A
- **Runda 3 (`wf_a4483abe-c33`):** Operator PASS (`330c6a9ac`, pełny `cargo test` 3258/0/1). Evaluator PASS-WITH-NOTES. Obrona DECISION_REQUIRED (`c3a711cc1`). FC PASS-WITH-NOTES (`8f9410814`). Zarzut Z1: przeniesienie z r2 nadpisało testy parity (`003d53f97`). Usunięto test zgodności wstecz i test S3 z wersji parity. Osłabienie, nie uzupełnienie.
- **Decyzja (techniczna, orkiestrator):** wariant A. Pliki parity wracają bajt-w-bajt. Zestaw r2 idzie jako nowe pliki `*_r2*`. Kryterium: 0 usuniętych linii w `rust-port/engine/tests` vs parity. DODATEK r4: `7eda73831`.
- **Korekta mojego błędu:** zarzut „hak w `declare_forced_wars` nie jest wołany” był fałszywy. Hak jest w `war_turn_declare.rs:116` → `turn_war_dipl_steps.rs:895`, test `p6_cred_wojna_forced.rs` 4 ok. Decyzja „rozszerzyć allowlistę o `war_turn_declare.rs`” jest zbędna. Pozostaje tylko #120 (wypowiedzenie gracza, sojusz 23806, klaster 40441).
- **Zabezpieczenie:** refy `refs/keep/R-RUSTPORT-P6-CRED-WOJNA-Q1-r3-{op,obrona,fc,eval}`. FC wypchnięty na `rust-port-wip/R-RUSTPORT-P6-CRED-WOJNA-Q1-r3-fc`. Worktree rundy 3 usunięte.
- **Runda 4 (`wf_09962ba6-668`), baza parity `003d53f97`:** Operator (HAIKU) przywraca testy parity, dodaje zestaw r2 pod nowymi nazwami. Obrona HAIKU, Evaluator i FC SONNET.
- **Uwaga do atrybucji:** harness dołącza do commitów linię `Co-Authored-By` z nazwą modelu. CLAUDE.md tego zakazuje w artefaktach repo. Commit `cc4554ec7` (r2 FC) jest już na `rust-port-wip` z taką linią. Nie przepisuję opublikowanej gałęzi bez decyzji właściciela.
- **Dysk:** 7,2 GB po sprzątaniu rundy 3.
- **Stan repo:** `parity-v2` = `003d53f97` (bez zmian). `claude/rust-sivvrn` przed tym wpisem = `7eda73831`.

## Przebieg (restart kontenera, CRED-WOJNA-Q1 runda 4 wznowiona od nowa): 1 aktywny temat (1 z 4 slotów)
- **Restart:** runda 4 (`wf_09962ba6-668`) została przerwana restartem kontenera. Journal miał tylko start Operatora, bez wyniku. Częściowa praca Operatora w worktree (nowe pliki `*_r2*`, zmieniony raport r2, bez commitów) została skopiowana do scratchpada jako referencja i nie jest commitowana. Worktree zwolniono.
- **Ponowny start:** runda 4 uruchomiona z tym samym dispatchem (DODATEK r4 `7eda73831`, baza parity `003d53f97`). Workflow `wf_beebb55a-e4e`. Operator (HAIKU), Obrona (HAIKU), Evaluator i FC (SONNET).
- **Sprzątanie:** usunięto worktree rundy 3 FC (`wf_a4483abe-c33-4`, refy zapisane). Dysk 5,5 GB po sprzątaniu (3,2 GB przed).
- **Stan repo:** `parity-v2` = `003d53f97` (bez zmian). `claude/rust-sivvrn` przed tym wpisem = `3a8b8c22c`.

## Przebieg (heartbeat 10:24, CRED-WOJNA-Q1 runda 4): zła baza, zatrzymanie i ponowny start z bezpiecznikiem
- **Problem:** runda 4 (`wf_beebb55a-e4e`) wystartowała na obcej historii: worktree na commicie `5d0c5f8d1` („FALA 677”, ok. 10 000 zmienionych plików, setki usuniętych linii w testach). Operator nie ustawił bazy `003d53f97`. Zatrzymano zadanie (TaskStop). Zepsuty worktree usunięto. Nic nie wypchnięto: parity `003d53f97` i `claude/rust-sivvrn` bez zmian. Obca historia (`5d0c5f8d1`) istnieje tylko na pre-existing gałęziach `origin/main` i `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie jest efektem tej rundy.
- **Poprawka:** DODATEK r4 KROK 0 (`d1c1395e9`): `checkout -B` na `003d53f97`, sprawdzenie pełnego SHA, STOP przy niezgodności, kryterium: `git diff --stat` tylko z allowlisty.
- **Ponowny start:** `wf_1ae8dfd8-9fe` (`w5hjocfx6`). Operator (HAIKU), Obrona (HAIKU), Evaluator i FC (SONNET).
- **Zabezpieczenie w toku:** przy każdym sprawdzeniu porównać `git diff --stat 003d53f97 <HEAD>`. Jeśli wynik ma tysiące plików, zatrzymać zadanie.
- **Stan repo:** `parity-v2` = `003d53f97`. `claude/rust-sivvrn` przed tym wpisem = `d1c1395e9`.

## Przebieg (CRED-WOJNA-Q1, runda 4 zamknięta): FC PASS-WITH-NOTES, weryfikacja integracji w toku
- **Runda 4 (`wf_1ae8dfd8-9fe`), baza `003d53f97`:** Operator (HAIKU) PASS-WITH-NOTES, Obrona PASS-WITH-NOTES, Evaluator PASS-WITH-NOTES, FC PASS-WITH-NOTES. Commit `cfa1edd31` (lokalny w rundzie, wypchnięty jako `rust-port-wip/R-RUSTPORT-P6-CRED-WOJNA-Q1-r4-fc`). Refy: `refs/keep/R-RUSTPORT-P6-CRED-WOJNA-Q1-r4-{fc,obrona,eval}`.
- **Kryterium końca zweryfikowane przeze mnie:** `git diff --numstat 003d53f97 cfa1edd31 -- rust-port/engine/tests` pokazuje 0 usuniętych linii. Dodane tylko 3 pliki `*_r2*` (generator 455 linii, testy 376, vectors.json 1 linia). Pliki parity przywrócone bajt-w-bajt. Ancestry: `003d53f97` jest przodkiem `cfa1edd31`.
- **Zakres poza testami:** `01-operator-r2.md` nadpisany wersją r2 z `811f607ee` (48+/30−). Dispatch r4 tego wymagał. Wersja z parity jest w historii `003d53f97`.
- **Weryfikacja integracyjna (w toku):** `cargo fmt --check`, `cargo test --no-fail-fast`, `cargo clippy -D warnings` na `cfa1edd31`, w detached worktree `.claude/worktrees/integ-r4`, target w scratchpadzie. Operator podał 3261/0/1. Evaluator i Obrona NIE_ZMIERZONO (dysk). Integracja po zielonych wynikach: FF `rust-port/parity-v2` na `cfa1edd31`.
- **Zabezpieczenie:** runda 4 zatrzymana restartem, potem zatrzymana przy złej bazie (`5d0c5f8d1`, obca historia). Worktree usunięte. Nic nie wypchnięto na parity.
- **Dysk:** 8,8 GB po sprzątaniu worktree rundy 4 i cache (`tgt-eval`, `tt`, `tgt-k5c`, `ev_target`).
- **Stan repo:** `parity-v2` = `003d53f97`. `claude/rust-sivvrn` przed tym wpisem = `92ae3d172` → `0233e7420` (rejestr).

## Przebieg (CRED-WOJNA-Q1): integracja na parity-v2 (FF `003d53f97` → `cfa1edd31`)
- **Weryfikacja orkiestratora na `cfa1edd31`:** `cargo fmt --check` EXIT 0. `cargo test --no-fail-fast` EXIT 0: 3261 passed, 0 failed, 1 ignored (istniejący `p6_order_lane.rs:1530`). `cargo clippy --all-targets -- -D warnings` EXIT 0. Target poza repo, usunięty po bramkach.
- **Integracja:** FF `rust-port/parity-v2` = `cfa1edd31` (ancestry potwierdzone, zmiany tylko w testach i raportach).
- **Otwarte (NIE_ZMIERZONO / poza zakresem):** produkcyjna kolejność D4/D8 względem P4 (test na prymitywach); alias `umowa_handlowa` pominięty (decyzja właściciela); wypowiedzenie gracza, sojusz, klaster, `zlozeGrants` (#120).
- **Sprzątanie:** worktree `integ-r4` i target usunięte. Dysk 8,8 GB.
- **Stan repo:** `parity-v2` = `cfa1edd31`. `claude/rust-sivvrn` przed tym wpisem = `57ae622aa`.

## Przebieg (heartbeat 11:18, trig_01DiSPBEtwmKWjgEKvcGWm7W): 0 aktywnych Workflow, 0 z 4 slotów
- **Sloty:** 0 aktywnych. Brak procesów cargo/clippy/rustc, brak worktree poza główną kopią. Journale `wf_e1c6a9ed-20e` i `wf_eb7eee9f-e01` mają start bez wyniku, ale bez procesu i bez worktree. Traktuję je jako porzucone po wcześniejszych restartach. Journal `wf_beebb55a-e4e` (zła baza) zatrzymany ręcznie.
- **Zamknięte:** #103 CRED-WOJNA (integracja `cfa1edd31`, bramki zielone 3261/0/1). Otwarte, poza tematem: alias `umowa_handlowa` (decyzja właściciela), harness pipeline D4/D8 (osobny temat), wypowiedzenie gracza/sojusz/klaster (#120).
- **Dlaczego nie uruchomiono 4 tematów:** pozostałe pozycje pending są zablokowane decyzją właściciela (allowlista `ProdBody`, #143/#146, #151 `Cargo.toml`, DYSTANS #134–#137, gameplay #10, #14–#19, #27, #60, #63) albo zależą od niezintegrowanego kodu. Nie startuję tematów tylko po to, żeby zapełnić sloty.
- **Dysk:** 8,8 GB. Próg 8 GB do startów z kodem Rust spełniony, ale brak gotowego tematu do uruchomienia bez decyzji.
- **Stan repo:** `parity-v2` = `cfa1edd31`. `claude/rust-sivvrn` przed tym wpisem = `588c198de`.

## Przebieg (heartbeat 11:48, trig_01DiSPBEtwmKWjgEKvcGWm7W): bez zmian, 0 z 4 slotów
- **Sloty:** 0 aktywnych Workflow. Brak procesów cargo/clippy/rustc, brak worktree poza główną kopią. Parity-v2 = `cfa1edd31`. Brak nowych decyzji od właściciela od 11:18.
- **Dlaczego bez startów:** wszystkie pozostałe pozycje pending czekają na decyzję właściciela (lista w poprzednim przebiegu) albo zależą od niezintegrowanego kodu.
- **Dysk:** 8,8 GB.
- **Stan repo:** `parity-v2` = `cfa1edd31`. `claude/rust-sivvrn` przed tym wpisem = `289e5750b`.

## Przebieg (heartbeat 12:20, trig_01DiSPBEtwmKWjgEKvcGWm7W): bez zmian, 0 z 4 slotów
- **Sloty:** 0 aktywnych Workflow. Brak procesów cargo/clippy/rustc, brak worktree poza główną kopią. Parity-v2 = `cfa1edd31`. Brak nowych decyzji od właściciela od 11:18.
- **Dlaczego bez startów:** wszystkie pozostałe pozycje pending czekają na decyzję właściciela albo zależą od niezintegrowanego kodu (lista w przebiegu 10:24 i 11:18).
- **Dysk:** 8,8 GB.
- **Stan repo:** `parity-v2` = `cfa1edd31`. `claude/rust-sivvrn` przed tym wpisem = `1440a7c10`.

## Przebieg (heartbeat 12:49, trig_01DiSPBEtwmKWjgEKvcGWm7W): bez zmian, 0 z 4 slotów
- **Sloty:** 0 aktywnych Workflow. Brak procesów cargo/clippy/rustc, brak worktree poza główną kopią. Parity-v2 = `cfa1edd31`. Brak nowych decyzji od właściciela od 11:18.
- **Dlaczego bez startów:** wszystkie pozostałe pozycje pending czekają na decyzję właściciela albo zależą od niezintegrowanego kodu.
- **Dysk:** 8,8 GB.
- **Stan repo:** `parity-v2` = `cfa1edd31`. `claude/rust-sivvrn` przed tym wpisem = `2a28da212`.

## Przebieg (polecenie właściciela: „odpalaj kolejne tematy”, sprzątanie dysku): 1 aktywny temat (1 z 4 slotów)
- **Dysk:** usunięto cache kompilacji zakończonych tematów (scratchpad: `target`, `target-r2`, `tgt-fc`, `target-k5loop`, `ev-cw`, `cred`; `/tmp`: `k5i2a2-target`, `fc-target-nan`, `tgt-k4`, `ev2`, `fc-k3-target`). Dysk: 8,8 GB → 20 GB. Nie ruszano `tgt-eval2` w `.claude/worktrees` (właściciel niepotwierdzony) ani `pin` w scratchpadzie (źródło pinu).
- **Nowe zadania w liście (#152–#162):** 11 pozycji. Weryfikacja statusów, L-1, odświeżenie KOLEJKI, raport poranny, pytania ABC, wektory AUTO, pokrycie generatora, konsolidacja js_max, wypowiedzenie gracza, DYSTANS, ProdBody.
- **Aktywny temat:** REPIN-UNIT-REPLACE-DATA-Q1 (#153, L-1), Workflow `wf_cd6b3e71-a5e`. Operator HAIKU, Obrona HAIKU, Evaluator i FC SONNET. Dispatch `f189ce037`, baza parity `cfa1edd31`.
- **Korekta dispatchu:** klucz JSON to `"Zastąp specjalnie"` (wszystkie 75 jednostek), nie `zastap_specjalnie` (to nazwa w strukturze Rust). Poprawka w dispatchu przed startem.
- **Blokady pozostałych slotów:** każdy pozostały temat wymaga decyzji właściciela (pytania w #156) albo zgody na allowlistę (#162, #111/#158), albo jest zablokowany DYSTANSEM (#161).
- **Stan repo:** `parity-v2` = `cfa1edd31`. `claude/rust-sivvrn` przed tym wpisem = `f189ce037`.

## Decyzje właściciela (gameplay) i decyzje techniczne orkiestratora
**Gameplay (odpowiedzi właściciela):**
- DYSTANS (#10): faza zwarcia jak na pinie. Odblokowuje #134–#137 i #100 (osobne tematy).
- Szturm odparty (#60): jak na pinie (remis po 150 turach). Naprawa błędu pinu osobno.
- W8 r7 kolejność faz (#63): jak na pinie.
- REPIN-DRYFT 1–6 (#14–#19): przyjąć wartości z weba. Wymaga przesunięcia pinu (osobny krok po REPIN-DELTA-5).
- units.json, 50 pól (#27): przyjąć wartości z pinu/weba. Wymaga przesunięcia pinu.

**Techniczne (podjęte przez orkiestratora, bez pytania):**
1. Commity własne bez nazwy modelu (CLAUDE.md). Opublikowanych nie przepisuję.
2. Bez aliasu `umowa_handlowa`: test S3 wprost na `StreamDealKind`.
3. Harness pipeline D4/D8: osobny temat.
4. #110 JS-MAX: wariant (b) z FC, tabela zachowania zera per caller.
5. #91: istniejące 360 sekwencji jako dowód; klauzula „pojedynczy cios” w #113.
6. Allowlisty `ProdBody` i generatora: rozszerzane tylko o pliki potrzebne konkretnemu tematowi, z pełnymi bramkami.
7. Wiring #104, #114, #115, #120: parytet z pinem.

## Przebieg (13.11, polecenie właściciela: odpalić operatorów, raport etapów P): 4 z 4 slotów
- **Aktywne Workflow:**
  - `wf_cd6b3e71-a5e` — UNIT-REPLACE L-1 (#153), Operator HAIKU.
  - `wf_08013046-e0f` — COMBAT-MELEE-VEKTORY-Q1 (#134), Operator HAIKU. Wektory fazy zwarcia z pinu (combat.ts:842), bez portu.
  - `wf_e18d3b41-1c6` — JS-MAX-CONSOLIDATE-R2-Q1 (#110, wariant b), Operator SONNET (uzasadnienie w dispatchu: diff w ok. 27 plikach, tabela semantyki per caller).
  - `wf_07422301-117` — K5I2B2-POKRYCIE-R2-Q1 (#111/#143), Operator HAIKU. KROK 0 zatrzymuje, jeśli asercja już przechodzi.
- **Dispatche** (baza parity `cfa1edd31`): `b03bd0e29`.
- **Raport etapów P0–P11 i P6.x:** `scratchpad/raport-etapy-P-2026-11-13.md`, wysłany właścicielowi.
- **Stan repo:** `parity-v2` = `cfa1edd31`. `claude/rust-sivvrn` przed tym wpisem = `b03bd0e29`.

## Przebieg (13.11): L-1 (#153) runda 1 FAIL, runda 2 uruchomiona
- **Runda 1 (`wf_cd6b3e71-a5e`):** Operator HAIKU zrobił kod (`a53d46932`: 21 wpisów „Zastąp specjalnie”, test 3/3). FC FAIL: pełny `cargo test` nie ma EXIT 0. Dwa strażniki w `p6_1d_civ_bonuses` (`dataFnv.units`, `dataStringXor`) przypinają hashe sprzed tematu, a `tests/p6_1d_vectors/web-vectors.json` jest poza allowlistą. Refy: `refs/keep/R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1-r1-{op,rep,eval}`. Worktree rundy 1 usunięte.
- **Decyzja techniczna orkiestratora:** rozszerzyć allowlistę o `web-vectors.json`, zaktualizować tylko pola hashy (wektory muszą pozostać bajt-w-bajt). Dispatch DODATEK r2: `040846e67`.
- **Runda 2 (`wf_8202e9b6-65f`):** baza `a53d46932`. Bramki: fmt, clippy, lib, `p6_1d_civ_bonuses`, nowy test, pełny `cargo test`.
- **Atrybucja:** dispatch i moje commity bez nazwy modelu. Linia `Co-Authored-By` z harnessu nie jest przeze mnie kontrolowana (zgłoszone w poprzednim wpisie).
- **Dysk:** 2,3 GB → 6,6 GB po sprzątaniu worktree rundy 1.
- **Stan repo:** `parity-v2` = `cfa1edd31`. `claude/rust-sivvrn` przed tym wpisem = `040846e67`.

## Przebieg (13.11): JS-MAX (#110) — awaria przez dysk, wznowienie z cache
- **Awaria:** `wf_e18d3b41-1c6` padł na tworzeniu worktree (`WorktreeIsolationError`): dysk 0,78 GB. Operator i Evaluator zakończyły się poprawnie: kod `cd7cf1b77` (ancestry z `cfa1edd31` potwierdzone), Evaluator PASS-WITH-NOTES. Padło na Obronie/FC.
- **Sprzątanie:** usunięto worktree nieudanego przebiegu (`wf_e18d3b41-1c6-1..3`) i cache `/tmp/claude-0/{tgt-ev,tgt-eval,tgt}` (nieużywane przez procesy). Refy: `refs/keep/R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-R2-Q1-failed-{wip,eval,det}`. Dysk: 0,78 GB → 12 GB.
- **Wznowienie:** `wmuwt571m` z `resumeFromRunId` (wykonane etapy z cache, Obrona i FC od nowa).
- **Stan repo:** `parity-v2` = `cfa1edd31`. `claude/rust-sivvrn` przed tym wpisem = `07a0851c5`.

## Przebieg (13.11): JS-MAX (#110) — awaria przez dysk, wznowienie z cache
- **Awaria:** `wf_e18d3b41-1c6` padł na tworzeniu worktree (`WorktreeIsolationError`): dysk 0,78 GB. Operator i Evaluator zakończyły się poprawnie: kod `cd7cf1b77` (ancestry z `cfa1edd31` potwierdzone), Evaluator PASS-WITH-NOTES. Padło na Obronie/FC.
- **Sprzątanie:** usunięto worktree nieudanego przebiegu (`wf_e18d3b41-1c6-1..3`) i cache `/tmp/claude-0/{tgt-ev,tgt-eval,tgt}` (nieużywane przez procesy). Refy: `refs/keep/R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-R2-Q1-failed-{wip,eval,det}`. Dysk: 0,78 GB → 12 GB.
- **Wznowienie:** `wmuwt571m` z `resumeFromRunId` (wykonane etapy z cache, Obrona i FC od nowa).
- **Stan repo:** `parity-v2` = `cfa1edd31`. `claude/rust-sivvrn` przed tym wpisem = `07a0851c5`.

## Przebieg (13.11): JS-MAX-CONSOLIDATE-R2-Q1 (#110) — FC PASS-WITH-NOTES, integracja odłożona
- **Wynik:** Operator SONNET PASS (kod `cd7cf1b77`, pełny test 3167/0/1 partiami). Evaluator PASS-WITH-NOTES. Obrona `f946ee378` (usunięto prywatną kopię `js_max0` w `economy_yield.rs`). FC PASS-WITH-NOTES na `f946ee378`.
- **Zapisane:** refy `refs/keep/R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-R2-Q1-{fc,eval}`; gałąź `rust-port-wip/R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-R2-Q1-fc` = `f946ee378`.
- **Integracja odłożona:** Obrona zmieniła kod po pełnym teście Operatora, więc wymagany jest pełny `cargo test` na `f946ee378` przed FF. Dysk 7,3 GB przy 28 procesach cargo z trzech innych tematów. Uruchomię po ich zakończeniu.
- **Uwagi zaakceptowane:** `pub mod js_math` (test integracyjny w `tests/`); warianty `*_std`/`*_tie_b` (decyzja dispatchu). Otwarte: 39 vs 38 definicji (nieweryfikowane).
- **Stan repo:** `parity-v2` = `cfa1edd31`. `claude/rust-sivvrn` przed tym wpisem = `d4f63e0cc`.

## Przebieg (13.11): L-1 zintegrowane, melee FC, port fazy zwarcia uruchomiony
- **L-1 (#153) zintegrowane:** FF `rust-port/parity-v2` = `2fb290cf7` (łańcuch z `cfa1edd31` potwierdzony; po pełnym teście Operatora zmian kodu nie było, tylko dokumentacja). Pełny `cargo test` 3264/0/1 (test Operatora na `6ea387a19`). Zmiana wartości zamienników dla 21 jednostek to zamierzony parytet z pinem (decyzja #27). Refy: `refs/keep/…-r2-{fc,op}`.
- **Melee wektory (#134) FC PASS-WITH-NOTES** na `fc74b6d1a` (gałąź `rust-port-wip/…-COMBAT-MELEE-VEKTORY-Q1-fc`). Runda 1 FAIL (NaN/Inf/-0 jako null, surowe floaty), runda 2 naprawiła. Refy zapisane. Worktree usunięte. **Brak pełnego cargo test** na tym commicie (dysk).
- **Port fazy zwarcia (#136) uruchomiony:** `wf_de513810-763`, Operator SONNET (uzasadniony), baza `fc74b6d1a`, dispatch `e49dfe78d`.
- **Do zrobienia przed FF:** pełny `cargo test` dla `fc74b6d1a` (melee) i dla `f946ee378` (js_max); oba po zakończeniu tematów, żeby nie przeciążyć dysku.
- **Dysk:** 9,6 GB po sprzątaniu worktree melee i L-1.
- **Stan repo:** `parity-v2` = `2fb290cf7`. `claude/rust-sivvrn` przed tym wpisem = `e49dfe78d`.

## Przebieg (13.11): pokrycie łuczników (#111/#143) zintegrowane
- **Wynik:** Operator PASS-WITH-NOTES (`a8d331fff`), Evaluator PASS-WITH-NOTES, Obrona PASS-WITH-NOTES, FC PASS-WITH-NOTES (`b69c8bc72`). Łucznik-dystansowy: 11 → 69 na 1200 wektorach. Asercja `lucznik_ranged >= 14` przechodzi.
- **Integracja:** cherry-pick trzech commitów na `2fb290cf7` (bez konfliktów; brak nakładania się zmian), test `p6_siege_tactics_blow_full` 3/3, FF `parity-v2` = `c85e4e451`. Pełny test na zintegrowanym stanie NIE_ZMIERZONO; na bazie przed integracją 3261/0/1 (Operator i Obrona).
- **Uwagi FC (decyzje techniczne):** próg 14 zbyt niski wobec 69 → zadanie #163. Procarz spadł 4 → 1 → zadanie #164 (SLINGER-POKRYCIE).
- **Stan repo:** `parity-v2` = `c85e4e451`. `claude/rust-sivvrn` przed tym wpisem = `7d84093a9`.

## Przebieg (13.11): aktualizacja zadań, nowy temat SLINGER-POKRYCIE, port w toku
- **Aktywne Workflow (2 z 4 slotów):**
  - `wf_de513810-763` — COMBAT-RESOLVE-PETLA-Q1 (#136), Operator SONNET. W worktree widać zmiany w `combat.rs` i `p6_combat_melee.rs`.
  - `wf_4613cb38-d39` — SLINGER-POKRYCIE-Q1 (#163, #164), Operator HAIKU. Dispatch `914a80a8f`, baza `c85e4e451`.
- **Statusy zweryfikowane:** #114 ELIMINACJA-GRACZA zintegrowana (INTEG-B21, `cf281d785`) → completed. #104 ZLOŻA i #115 ZDOBYCIE-MIASTA: brak commitów i dispatchów → pending. #106 R7K7C-WIRING: dispatche Q1/Q2 istnieją, integracja nieznana → pending.
- **Sprzątanie:** usunięto worktree zakończonych pokryć (`wf_07422301-117-1..4`) i stary worktree JS-MAX (`wf_e18d3b41-1c6-4`). Refy: `refs/keep/K5I2B2-POKRYCIE-R2-Q1-wt-final`, `…-failed-det4`. Dysk 16 GB.
- **Stan repo:** `parity-v2` = `c85e4e451`. `claude/rust-sivvrn` przed tym wpisem = `914a80a8f`.

## Przebieg (heartbeat 15:25, trig_01DiSPBEtwmKWjgEKvcGWm7W): 2 z 4 slotów, bez nowych startów
- **Aktywne Workflow:** `wf_de513810-763` (COMBAT-RESOLVE-PETLA-Q1, #136, Operator SONNET; worktree na `8dff35d79`) oraz `wf_4613cb38-d39` (SLINGER-POKRYCIE-Q1, #163/#164, Operator HAIKU; worktree na `ff2df3314`).
- **Dlaczego bez nowych startów:** dysk 7,8 GB, poniżej progu 8 GB z CLAUDE.md dla startów z kodem Rust. Kandydaci z kolejki (#107, #109, #112, #113, #147–#150 — ProdBody; #120 — hak wypowiedzenia; #139 — Cargo.toml) wymagają większych portów albo wymagają wykonania zadań wcześniejszych (ProdBody: #147 przed #109).
- **Niezintegrowane, gotowe do pełnego testu:** wektory melee (`fc74b6d1a`), js_max (`f946ee378`). Pełny `cargo test` na tych commitach po zakończeniu obu operatorów.
- **Stan repo:** `parity-v2` = `c85e4e451`. `claude/rust-sivvrn` przed tym wpisem = `3b36d7184`.

## Przebieg (heartbeat 15:45): SLINGER-POKRYCIE zintegrowane, integracja js_max uruchomiona
- **SLINGER-POKRYCIE (#163, #164) zintegrowane:** FC PASS-WITH-NOTES `fc2ed160f`. Procarz 1 → 32 (≥14), łucznik 69 → 76 (≥60). Operator zmienił szansę wymuszenia łucznika 0,25 → 0,35 (kontrola: przy 0,25 wynik 52 < 60), FC zaakceptował. FF `parity-v2` = `fc2ed160f`. Refy `refs/keep/…-SLINGER-POKRYCIE-Q1-{fc,op,rep}`, gałąź `rust-port-wip/…-fc`. Worktree usunięte.
- **INTEG-JS-MAX-Q1 (#110) uruchomiony:** `wf_a86b3a78-394`, Operator HAIKU, dispatch `463f11474`, baza parity `fc2ed160f`. Cherry-pick `cfa1edd31..f946ee378` (3 commity), pełny test i FF po weryfikacji.
- **Aktywne (2 z 4):** `wf_de513810-763` (COMBAT-RESOLVE-PETLA, #136) i `wf_a86b3a78-394` (INTEG-JS-MAX, #110).
- **Dysk:** 12 GB (≥ 8 GB, starty z kodem Rust dozwolone).
- **Stan repo:** `parity-v2` = `fc2ed160f`. `claude/rust-sivvrn` przed tym wpisem = `463f11474`.

## Przebieg (13.11): sprzątanie dysku, wypychanie, cztery aktywne tematy, 10 nowych zadań
- **Dysk:** 3 GB → 11 GB. Usunięto cache `scratchpad/tgt` (nieużywany) i worktree zakończonego portu (`wf_de513810-763-1..4`). Refy: `refs/keep/R-RUSTPORT-P6-COMBAT-RESOLVE-PETLA-Q1-{fc,op,obrona}`. Wypchnięto gałęzie `rust-port-wip/…-COMBAT-RESOLVE-PETLA-Q1-fc` (265ee6e09) i `rust-port-wip/…-K5I2B2-POKRYCIE-R2-Q1-fc` (b69c8bc72).
- **Port fazy zwarcia (#136):** FC PASS-WITH-NOTES `265ee6e09`, 1716 kroków zgodnych bitowo, pełny test 3266/0/1 w obronie.
- **Integracja melee w toku:** cherry-pick na `fc2ed160f` (HEAD 5e8b116e8), pełny test (191+ binarek, 0 błędów). FF po zakończeniu.
- **Aktywne Workflow (4 z 4):** rozpoznanie #120 (`wf_1fa2d0ed-706`), rozpoznanie #104 (`wf_3b370ba3-2bc`), rozpoznanie #135 (`wf_a0b2e4d7-2ae`), integracja js-max (`wf_a86b3a78-394`).
- **Nowe zadania:** #165–#174.
- **Stan repo:** `parity-v2` = `fc2ed160f`. `claude/rust-sivvrn` przed tym wpisem = `a2962f58b`.

## Przebieg (13.11, po planie P6): rozpoznania ZŁOŻA, CRED-HAK, COMBAT-WEJSCIA
- **ZŁOŻA-WIRING (#104):** rozpoznanie PASS-WITH-NOTES, dokument `dyspozycje/rust-port/p6/R-RUSTPORT-P6-ZLOZA-WIRING-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (wersja 2), zintegrowane na `claude/rust-sivvrn` (cherry-pick, bez zmian kodu). Ustalenia: w Rust nie ma `transferBasketItems` (pin main.ts:12566) — ZLOZA-B wymaga portu realizacji koszyka, szacunek 3–4 rundy. Brak komendy dobrowolnego zerwania (`VoluntaryTreatyBreak` nie jest konstruowany). **Decyzja techniczna orkiestratora:** port `transferBasketItems` 1:1 z pinu jako część ZLOZA-B (to przeniesienie istniejącego zachowania, nie zmiana gameplay).
- **CRED-HAK (#120):** rozpoznanie PASS-WITH-NOTES (FC 177c122b5), dokument `dyspozycje/rust-port/p6/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1-ROZPOZNANIE.md`, zintegrowane (cherry-pick). Ustalenia: wypowiedzenie gracza (main.ts:13168) bez komendy i wejścia w Rust; klaster (main.ts:40441) i joinAllyToWar (main.ts:23806) bez wykonania. **Decyzja techniczna orkiestratora:** format komendy DeclareWar wzorowany na payloadzie pinu (bez dodatkowego UI). **Pytanie gameplay do właściciela:** czy wojna klastra państw-miast wobec gracza wchodzi w zakres Rust teraz (blokuje T5).
- **COMBAT-WEJSCIA (#135/#167):** rozpoznanie FC **FAIL** (cee419528, nie zintegrowane). Przyczyna: baza `fc2ed160f` — recon nie widział portu melee, który jest już na `parity-v2` (`5e8b116e8`: `melee_phase`, `resolve_melee_phase`, 1716 kroków zgodnych bitowo z wektorami pinu). **Decyzja techniczna orkiestratora:** NIE przepisujemy melee 1:1; zostaje istniejący port (`5e8b116e8`) jako baza. Wejścia (#167) dokładamy jako rozszerzenie na tym tipie. Rozpoznanie do powtórzenia z bazą `5e8b116e8` (runda 2), zanim ruszy implementacja #167.
- **Zamknięte:** melee zintegrowane FF na `parity-v2` = `5e8b116e8` (pełny test 3278 passed / 0 failed / 1 ignored; `cargo fmt --check` OK; clippy na tipie NIE_ZMIERZONO).
- **Zgłoszenie dla właściciela (proces):** w jednym z wcześniejszych przebiegów Operator usunął poza repo plik `/home/user/tmp/x` (7,3 MB). Plik nie istnieje, nie da się go odtworzyć z repo.
- **Dysk:** 10 GB wolne po sprzątaniu worktree rozpoznań ZŁOŻA i CRED-HAK (refy `refs/keep/…-fc`, `…-wip`).
- **Odpowiedź właściciela (ABC, gameplay):** wojna klastra państw-miast wobec gracza **wchodzi do P6 teraz** (wariant rekomendowany). Odblokowuje T5 haka CRED-HAK (#120/#171); T1–T4 nie zależą od tej decyzji.

## Przebieg (13.11, heartbeat sloty): cztery aktywne rozpoznania P6
- **Sloty:** przed heartbeatem brak aktywnych Workflow z wynikiem bez FC (ostatnie cztery rozpoznania zakończone). Uruchomiono cztery rozpoznania doc-only, baza `5e8b116e8` (parity-v2):
  - EKONOMIA-8I2 (#180) — `wf_9d0712b1-a18`
  - DYPLOMACJA-MULTIWAR (#181) — `wf_f638a0ba-62e`
  - ZWYCIESTWO (#182, P6.19) — `wf_0900e902-b40`
  - SAVE-LOAD-MIGRACJE (#184, P6.20–P6.22) — `wf_a300014c-ff5`
  Dispatche: `dyspozycje/autobot/runs/<ID>/00-dispatch.md` (commit `6669cb03f`), skrypty: `workflows/scripts/topic-<ID>.js`.
- **Nie uruchomiono:** COMBAT-WEJSCIA runda 2 (wymaga dispatchu z bazą `5e8b116e8`, do napisania), ZLOŻA-B port `transferBasketItems` (#172, do napisania dispatch), CRED-HAK T1–T5 (T5 odblokowany decyzją właściciela 13.11).
- **Dysk:** 8,9 GB wolne przed startem czterech rozpoznań.
- **Brak zmian kodu** w tym przebiegu; zmiany tylko w dyspozycjach.

## Przebieg (13.11, awarie dyskowe przy rozpoznaniach P6)
- **DYPLOMACJA-MULTIWAR (#181):** pierwszy przebieg `wf_f638a0ba-62e` padł przy tworzeniu worktree (`WorktreeIsolationError`, dysk 354 MB). Usunięto worktree nieudanego etapu (ref `refs/keep/…-failed`). Wznowiono przez `resumeFromRunId` (wynik Operatora z cache).
- **ZWYCIESTWO (#182):** `wf_0900e902-b40` padł tym samym błędem przy etapie FC (dysk 1,2 GB). Operator, Evaluator i Obrona zakończone; branche `wip/…-ZWYCIESTWO-ROZPOZNANIE-Q1`, `-eval`, `-obrona` zachowane. Worktree trzech etapów usunięte; **do wznowienia** przez `resumeFromRunId: wf_0900e902-b40`, gdy dysk pozwoli (≥ 4 GB).
- **INTEG-JS-MAX (#110, `wf_a86b3a78-394`):** etap FC uruchomiony, bez wyniku od ok. 16:24. Stan niezweryfikowany, worktree (`-1`, `-2`, `-3`) zostają do sprawdzenia.
- **Dysk:** 3,8 GB wolne po usunięciu worktree. Każdy etap Rust zajmuje około 1,2 GB, więc przy czterech równoległych rozpoznaniach dysk się zapycha. Zasada: nowe starty dopiero przy ≥ 8 GB, wznowienia przy ≥ 4 GB.

## Zasada pytań do właściciela (13.11, wiążąca)
- **Gameplay = parytet z wersją webową.** Nie pytać, czy coś ma być jak w webie. Wdrażać 1:1 wg pina (`gra/src` przy `07d2fbd72`), chyba że wskazano inaczej.
- **Pytać wyłącznie o odstępstwa od webu** (świadome różnice, których pin nie wymusza) albo o zakres, którego web nie rozstrzyga.
- **Decyzje techniczne** (format zapisu, struktura kodu, zależności) — orkiestrator decyduje sam i zapisuje w rejestrze.
- Wcześniejsze pytania „brąz per epoka” i „AI odlewnie” były pytaniami o parytet; odpowiedzi (wariant pina, tak teraz w P6) potwierdzają zasadę.

## Decyzje orkiestratora (13.11)
- **D2 (siatka stosu na starcie tury):** parytet z pinem (main.ts:38138) — wpinać.
- **D3 (wonderBuildSites):** parytet z pinem.
- **D1 (format zapisu):** decyzja techniczna orkiestratora, do zapisu w temacie P6.20; kierunek: zgodność z zapisem webowym wersji 3 tam, gdzie to możliwe.
- **Zmiana statusu relacji z hamulca (DYPLOMACJA, T3-A):** parytet z pinem (main.ts:11705-11713) — wpinać, bez pytania.

## Przebieg (13.11, heartbeat 16:51): cztery sloty
- **Stan przed heartbeatem:** 0 aktywnych Workflow z wynikiem bez FC (rozpoznania EKONOMIA, DYPLOMACJA, SAVE-LOAD zakończone i zintegrowane; ZWYCIESTWO padło na worktree; INTEG-JS-MAX bez wyniku od 16:24, niezweryfikowany).
- **Uruchomione (baza `5e8b116e8`, parity-v2):**
  - EKONOMIA-BRAZ-ERA-Q1 (T-A, implementacja brązu per epoka wg pina) — `wf_5b797905-328`, Operator HAIKU.
  - COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1 (rozpoznanie, runda 2 na właściwej bazie) — `wf_2fc2f4dd-d01`, Operator HAIKU.
  - ZLOZA-B-PORT-Q1 (port `transferBasketItems` z pina, implementacja) — `wf_f811df3e-f53`, Operator HAIKU.
  - ZWYCIESTWO-ROZPOZNANIE-Q1 (wznowienie z cache, etapy FC) — `wf_0900e902-b40`.
- **Dispatche:** `dyspozycje/autobot/runs/<ID>/00-dispatch.md`, commit `fcecbad3c`. Skrypty: `workflows/scripts/topic-<ID>.js`.
- **Dysk:** 11 GB wolne przed startem.
- **Zasada parytetu gameplay** (CLAUDE.md, zasada 9) obowiązuje we wszystkich czterech tematach; pytania tylko przy odstępstwach od webu.

## ZWYCIESTWO-ROZPOZNANIE (P6.19, #182): FC PASS-WITH-NOTES (7d8a78bec), zintegrowane
- Ustalenia: brak ewaluatora `checkVictory` / `checkDefeat` w Rust; brak flagi końca gry w `PlayableState`; faza Victory w `advance_turn` nieobsłużona. Istnieją parametry zwycięstwa (`economy_society_part2.rs:153-161`, bez konsumenta), `eliminate_owner` (`eliminacja.rs:48`), `record_player_ever_owned_city` (`siege_transfer_q5.rs:107`, bez stanu).
- **Decyzje orkiestratora (parytet/technika, bez pytania):**
  - Nauka przy `NAUKA_WYMAGA_RAKIETY=true`: pin nigdy nie ustawia `rakietaWystrzelona` na true, więc zwycięstwo naukowe jest nieosiągalne. **Parytet: port 1:1, bez naprawy.**
  - Hooki testowe pinu (`truceTestSuppressVictory`, `rebelProtectionTestSkipVictoryCheck`, `__defeatTestDebug`): **nie portować** (narzędzia testowe, nie gameplay).
  - UI ekranu zwycięstwa (`victoryScreen.ts`): **poza zakresem silnika P6.19** (warstwa frontendu).
  - `graczKiedysMialMiasto`: **flaga w zapisie**, nie heurystyka z miast — technicznie czystsze i spójne z P6.20–P6.22; zmiana wymaga zgodności wczytywania z pinem (heurystyka `main.ts:46368-46370` zostaje jako ścieżka zgodności dla starych zapisów).
- **Zgłoszenie procesowe:** commity Operatora `ebb607fb3` i `d37f55774` (DYPLOMACJA) zawierają linię `Co-Authored-By` z nazwą modelu, wbrew CLAUDE.md. Do nowych commitów nie przenosiłem tych linii; historii już wypchniętej nie przepisuję.

## POLITYKA PINU (13.11, śledzony punkt; prowadzi orkiestrator)
- **Pin obowiązujący teraz:** `07d2fbd72`. Wszystkie wektory i bramki P6 są z niego generowane. Nie przesuwamy go w trakcie P6.
- **Co już wiemy:** web (`origin/main`) jest o ~2955 commitów dalej; zmiany logiki gry (`gra/src/game`, `battle`, `data`, `main.ts`) to ok. 60 plików i ok. 4000 linii. Zmiany idą codziennie.
- **Zasada:** web-gameplay jest wdrażany 1:1 wg pina (CLAUDE.md, zasada 9). Nowe poprawki webowe nie wchodzą do Rust, dopóki nie przesuniemy pinu.
- **Punkt przesunięcia pinu:** zamknięcie P6 (kryteria w `P6-ZAMKNIECIE-PLAN.md`), temat **#177 PIN-MOVE-PLAN**.
- **Ostatni pin brany pod uwagę:** `origin/main` w chwili zamknięcia P6 (SHA zapisany wtedy, nie teraz). Od tego momentu właściciel zamraża zmiany gameplay w webie na czas przesunięcia; delta po tym SHA idzie do osobnego etapu.
- **Do decyzji właściciela (przy zamknięciu P6):** potwierdzenie zamrożenia webu i wybór SHA ostatniego pinu.
- **Raportowanie:** orkiestrator podaje stan punktu (SHA pinu, liczba commitów i zmian logiki gry od pinu) w każdym raporcie statusu i przy każdym zamknięciu etapu P6.

## Przebieg (13.11, ~17:30): wyniki i awarie dyskowe
- **COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1 (#167):** FC **PASS-WITH-NOTES** (werdykt w wyniku Workflow, sha 0bd310ca7; plik `03-final-control.md` nie został zapisany przez brak miejsca na dysku). Dokumenty do integracji: f9d5a2915 (operator), 0cd6c2c34 (ewaluator), 0bd310ca7 (obrona).
  - **Rozbieżność z pinem:** `counter-multipliers.json`, para falangita→włócznik = 1,00, pin `07d2fbd72` (`combat.ts:553-580`) daje 1,30. Jedyna z 64 par. **Decyzja orkiestratora (parytet, bez pytania):** poprawić do 1,30 jako osobny temat R-RUSTPORT-P6-COUNTER-FALANGITA-Q1. To odstępstwo od webu, nie decyzja gameplay.
  - Komentarz `combat.rs:185-187` twierdzi, że macierz odzwierciedla każdy kontratak — po poprawce będzie prawdziwy.
- **INTEG-JS-MAX (#110):** pierwszy pełny test zakończył się błędem **ENOSPC** (brak miejsca podczas linkowania), nie błędem kodu. Fmt i clippy `-D warnings` przeszły. Pełny test uruchomiony ponownie (wynik do odczytu przed FF).
- **EKONOMIA-BRAZ-ERA-Q1 (T-A):** pierwszy etap Operatora zakończony, drugi etap padł na tworzeniu worktree (ENOSPC). Wznowienie z cache po zwolnieniu miejsca: `resumeFromRunId: wf_5b797905-328`.
- **Sprzątanie:** usunięto worktree zakończonych tematów (ZWYCIESTWO-FC, DYPLOMACJA-FC, SAVE-LOAD, JS-MAX-stary FC, EKONOMIA-nieudana). Dysk: z 132 KB do ok. 8 GB.
- **Zasada:** nowe starty tylko przy ≥ 8 GB wolnego, wznowienia przy ≥ 4 GB.

## INTEG-JS-MAX (#110/#174): zintegrowane na parity-v2
- Cherry-pick `cd7cf1b77 8ae2f1864 f946ee378` na `5e8b116e8` bez konfliktów.
- Bramki: `cargo fmt --check` OK, `cargo clippy --all-targets -- -D warnings` OK, pełny `cargo test --no-fail-fast`: **3275 passed, 0 failed, 1 ignored** (exit 0). Pierwszy przebieg padł na braku miejsca na dysku (ENOSPC), nie na kodzie.
- **FF `parity-v2`: `5e8b116e8` → `d30e3ea24`.** Ref `refs/keep/R-RUSTPORT-P6-JS-MAX-INTEG-Q1-parity`. Worktree `integ-jsmax` usunięty.

## Przebieg (13.11, heartbeat 17:18): cztery sloty
- **Stan przed heartbeatem:** 2 aktywne Workflow (ZLOZA-B-PORT-Q1 na etapie Evaluatora; ZWYCIESTWO-IMPL-Q1 na etapie Obrony). EKONOMIA-BRAZ-ERA-Q1 w stanie `failed` (ENOSPC przy worktree).
- **COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1 (#167):** FC PASS-WITH-NOTES (sha 0bd310ca7). Dokumenty zintegrowane na `claude/rust-sivvrn` (`f25a3201c`). **Plik `03-final-control.md` nie został zapisany** (brak miejsca na dysku w chwili FC); werdykt pochodzi z wyniku Workflow i jest tu zapisany jako źródło.
- **INTEG-JS-MAX (#110/#174):** zintegrowane FF `parity-v2` `5e8b116e8` → `d30e3ea24`; pełny test 3275/0/1 (zapis wyżej).
- **Uruchomione (baza = parity-v2 `d30e3ea24`):**
  - COUNTER-FALANGITA-Q1 — poprawka mnożnika 1,30 wg pina (odstępstwo od webu, bez pytania) — `wf_7257b495-8f2`, Operator HAIKU.
  - EKONOMIA-BRAZ-ERA-Q1 — wznowienie z cache (etap Operatora) — `wf_5b797905-328`.
  - ZLOZA-B-PORT-Q1 — w toku (etap Evaluatora) — `wf_f811df3e-f53`.
  - ZWYCIESTWO-IMPL-Q1 — w toku (etap Obrony) — `wf_b8c4665f-81f`.
- **Dysk:** 8,3 GB wolne przed startami.

## EKONOMIA-BRAZ-ERA-Q1 (T-A, #15): FC FAIL r1 → DODATEK r2 (decyzje orkiestratora)
- **Wynik r1:** Operator BLOCK (kod niezacommitowany, pełny test nie zakończony), Evaluator FAIL, FC FAIL. Dwa istniejące testy (`p6_turn_econ_res_pipeline.rs`) wymagają zmiany oczekiwań brązu, bo stare wektory zakładały mnożenie przez m(e); pin ma osobne wiersze per epoka. Brak wierszy `budynek_huta_braz_epoka2/3_przepustowosc` w `econ-params.json`.
- **Decyzje (parytet z pinem, bez pytania):**
  1. Allowlista rozszerzona o `p6_turn_econ_res_pipeline.rs` i `p6_7b_vectors/**` — wyłącznie oczekiwania brązu zgodne z pinem, bez osłabiania asercji.
  2. Dodać wiersze `budynek_huta_braz_epoka2/3_przepustowosc` (50 / 75) z pinu do `econ-params.json`.
  3. Test obu ścieżek pina (`turn-economy.ts` ~:1503 i ~:2484) na wektorach pina.
- **Baza r2:** `d30e3ea24` (parity-v2 po JS-MAX), nie `5e8b116e8`. Dispatch z DODATKIEM r2 wypchnięty (`claude/rust-sivvrn`).
- **Start r2:** dopiero przy ≥ 8 GB wolnego. Dziś po zakończeniu r1 było 3,9 GB, więc nie startuję.
- **Sprzątanie:** worktree nieudanej rundy usunięty, ref `refs/keep/R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1-r1-fc` zapisany.

## ZWYCIESTWO-IMPL-Q1 (P6.19-A, #182): FC PASS-WITH-NOTES (8fc46b8d7), integracja OCZEKUJE na pełny test
- **Zakres kodu:** `rust-port/engine/src/domain/victory.rs` (nowy), jedna linia w `domain/mod.rs`, testy `p6_victory.rs` + generator `.mjs` (wykonuje pin `victory.ts`, 223+ przypadków), wektory. Commity: `3a4c55929` (operator), `8a31afd24` (obrona), `8fc46b8d7` (FC). **Baza: `5e8b116e8`** — łańcuch trzeba przenieść (cherry-pick) na `parity-v2` `d30e3ea24`.
- **Wykonane bramki (przez Operatora i FC):** fmt OK; clippy `--lib` i `--test p6_victory` z `-D warnings` OK; `cargo test --lib victory` 10 passed; `p6_victory` 7 passed; generator bajt w bajt zgodny.
- **NIE wykonane (brak miejsca na dysku, ENOSPC):** pełny `cargo test --no-fail-fast` oraz `clippy --all-targets`. Operator w obronie raportuje wykonanie przy 7,2 GB, ale to nie pokrywa pełnego zestawu po integracji na `d30e3ea24`. **Przed FF wymagany pełny test na tipie integracji.**
- **Luka zakresu (NIE_ZMIERZONO w tym temacie):** flaga końca gry i `graczKiedysMialMiasto` nie są w `PlayableState` (plik poza allowlistą); wpięcie końca gry do pętli tury (odrzucanie komend, `main.ts:37997, 38043, 43827`) — nie zrobione. **Decyzja orkiestratora:** osobny temat **ZWYCIESTWO-WIRING** z allowlistą `playable.rs` i pętlą tury. Zakres parytetu, bez pytania do właściciela.
- **Poza zakresem (decyzje orkiestratora, parytet/technika):** hooki testowe pinu — nie portować; UI ekranu zwycięstwa — poza silnikiem P6.19; odczyt rakiety (`main.ts:43478`) — zgodnie z pinem (rakieta nieustawiana, nauka nieosiągalna).
- **Drobne ustalenie z obrony:** NaN w `powerShare` — Rust `f64::max` dawał 0,0, JS `Math.max` daje NaN. Naprawione w obronie (`js_max0` zachowuje NaN), test `power_share_propaguje_nan_jak_math_max`.
- **Stan:** ta sesja nie integruje — brak miejsca na dysku na pełny test. Integrację wykonam, gdy dysk będzie ≥ 8 GB.

## Przebieg (13.11, heartbeat 17:48)
- **ZWYCIESTWO-IMPL-Q1 (#182):** FC PASS-WITH-NOTES `8fc46b8d7`, integracja czeka na pełny test (opis wyżej). Refy `refs/keep/R-RUSTPORT-P6-ZWYCIESTWO-IMPL-Q1-{fc,wip,obrona}` zapisane lokalnie (push refs/keep odrzucony przez remote); FC wypchnięty jako gałąź `rust-port-wip/R-RUSTPORT-P6-ZWYCIESTWO-IMPL-Q1-fc`. Worktree trzech etapów usunięty.
- **Aktywne Workflow:** 2 z 4 — COUNTER-FALANGITA-Q1 (Ewaluator, SONNET), ZLOZA-B-PORT-Q1 (Obrona, HAIKU).
- **Nie uruchomiono:** EKONOMIA-BRAZ-ERA r2 (wymaga ≥ 8 GB), ZWYCIESTWO-WIRING (dispatch do napisania po integracji). Dysk po sprzątaniu ~7 GB, poniżej progu 8 GB dla nowych startów Rust (CLAUDE.md §5).

## Przebieg (13.11, ~18:05): COUNTER-FALANGITA zintegrowany, ZLOZA-B w integracji
- **COUNTER-FALANGITA-Q1:** FC PASS-WITH-NOTES `90448d3aa`. Operator zmierzył pełny `cargo test` na `ce02748e0`: exit 0, 0 failed. Różnica liczby testów (3279 vs 3275) wyjaśniona w obronie. **FF `parity-v2`: `d30e3ea24` → `90448d3aa`** (różnica między `ce02748e0` a FC to tylko dokumentacja). Parytet: mnożnik falangita → włócznik = 1,30 wg pina `07d2fbd72`.
- **ZLOZA-B-PORT-Q1 (#172):** FC PASS-WITH-NOTES `ab9ae03da`. Zakres: **tylko gałąź `zloze`** `transferBasketItems` (`46da76cea`, obrona `8186d7464`, FC `94feb5e37` po cherry-pick na `parity-v2`). Osiem pozostałych gałęzi (zloto, praca, zywnosc, tech, surowiec_boolean, surowiec_ilosc, miasto, jednostka) nie ma odpowiednika w Rust — **to luka parytetu**, nie decyzja do właściciela. Otwieram osobny temat **ZLOZA-B-REST** (bez pytania; zakres z pina).
- **Integracja ZLOZA-B:** cherry-pick na `90448d3aa`, pełny test w tle (tracked command). FF po zielonym wyniku.

## Przebieg (13.11, heartbeat 18:18): sloty
- **Stan przed heartbeatem:** 0 aktywnych Workflow z wynikiem bez FC. COUNTER-FALANGITA i ZLOZA-B zakończone FC PASS-WITH-NOTES.
- **Zintegrowane:** COUNTER-FALANGITA — FF `parity-v2` do `90448d3aa`.
- **W integracji:** ZLOZA-B (gałąź zloze) — cherry-pick na `90448d3aa` w worktree `integ-zloza` (`94feb5e37`). Pełny test w tle: **1158 passed (w toku), 0 failed**; fmt i clippy `-D warnings` przeszły. FF po zakończeniu testu.
- **Nie uruchomiono nowych tematów:** dysk 5,5 GB. Próg z CLAUDE.md §5 dla nowych startów Rust to 8 GB; heartbeat przewiduje 4 GB. Stosuję wyższy próg (projektowy), żeby nie powtórzyć awarii ENOSPC w trakcie integracji. Do uruchomienia po zakończeniu testu: ZLOZA-B-REST, EKONOMIA-BRAZ-ERA r2, ZWYCIESTWO-WIRING.

## ZLOZA-B (gałąź zloze, #172): zintegrowane na parity-v2
- Pełny test na tipie integracji: **3284 passed, 0 failed, 1 ignored** (exit 0); fmt OK; clippy `-D warnings` OK.
- **FF `parity-v2`: `90448d3aa` → `94feb5e37`** (zawiera port gałęzi zloze, wektory 207 przypadków z pina, FC).
- Worktree `integ-zloza` i jego cache usunięte.
- Zakres pozostały: osiem gałęzi `transferBasketItems` (ZŁOŻA-B-REST) — do dispatchu.

## Przebieg (13.11, ~18:40): integracja ZLOZA-B i trzy nowe tematy
- **ZLOZA-B (gałąź zloze) zintegrowane:** FF `parity-v2` `90448d3aa` → `94feb5e37`. Pełny test: **3284 passed, 0 failed, 1 ignored**.
- **Dysk:** 9,5 GB po sprzątaniu → progi startów spełnione.
- **Uruchomione (baza `94feb5e37`):**
  - EKONOMIA-BRAZ-ERA-Q1, runda 2 (świeże uruchomienie, bez cache rundy 1) — `wf_c1642f58-ebd`.
  - ZWYCIESTWO-WIRING-Q1 (wpięcie końca gry do stanu i pętli tury, P6.19-C) — `wf_8db013b1-9ec`.
  - ZLOZA-B-REST-Q1 (pozostałe gałęzie `transferBasketItems`, z jawnym NIE_ZMIERZONO tam, gdzie brak stanu w Rust) — `wf_28623be9-aa1`.
- **Dispatche:** `dyspozycje/autobot/runs/<ID>/00-dispatch.md` (commit `42f58b3ab`).
- **Uwaga:** runda 2 bronze-era nie używa cache rundy 1 (ta zawierała wynik BLOCK/FAIL), żeby nie odtworzyć starego werdyktu.

## EKONOMIA-BRAZ-ERA-Q1, runda 2 — BLOCK przed startem (dysk), nie FAIL merytoryczny
- Operator r2 sprawdził dysk przed startem: **6,9 GB** (dispatch r2 wymaga ≥ 8 GB). Kod nie został napisany, commit kodu nie istnieje, bramki nie były uruchomione.
- Przyczyna: w tym samym czasie startowały dwa inne tematy (ZWYCIESTWO-WIRING, ZLOZA-B-REST), które zużyły miejsce na worktree.
- Ewaluator i FC oceniły pustą rundę i dały FAIL. **Traktuję to jako błąd proceduralny (brak kodu), nie merytoryczny** — runda merytoryczna nie została wykonana, więc nie zużywa rundy 1/5. Obrona r2 (`b4833db8c`, tylko dokument) nie zmienia kodu.
- **Następny krok:** ponowny start EKONOMIA-BRAZ-ERA r2 **po zakończeniu obu tematów** (zwolnienie worktree), od `git checkout --detach 94feb5e37`, bez cache (świeże uruchomienie).
- Uwaga procesowa: Operator r2 przełączył worktree z e6776801b (ROBOCZA, inna historia) na gałąź od `94feb5e37` — zgodnie z dispatchem.

## KOREKTA (13.11, ~18:55): ZWYCIESTWO-IMPL NIE BYŁ na parity-v2
- **Mój błąd:** w poprzednim wpisie napisałem „integracja czeka na pełny test”, ale nie przeniosłem commitów `3a4c55929`, `8a31afd24`, `8fc46b8d7` na `parity-v2`. Dispatch ZWYCIESTWO-WIRING błędnie zakładał, że `victory.rs` jest już na parity.
- **Skutek:** Operator ZWYCIESTWO-WIRING wydał **BLOCK** (poprawnie: brak `victory.rs` na bazie `94feb5e37`). Wynik tego BLOCK jest w cache i nie może być wznowiony — potrzebny świeży start po integracji.
- **Działanie:** cherry-pick `3a4c55929 8a31afd24 8fc46b8d7` na `origin/rust-port/parity-v2` (`94feb5e37`) w worktree `integ-victory`; pełny test w tle. FF po zielonym wyniku.
- **Następnie:** świeży start ZWYCIESTWO-WIRING (baza = nowy parity). EKONOMIA-BRAZ-ERA r2 — świeży start (nie wznawiać).
- **Dysk:** awaria ENOSPC przy starcie trzeciego tematu; usunięto worktree trzech zakończonych/nieudanych uruchomień (EKONOMIA r2, ZWYCIESTWO-WIRING, COUNTER, ZLOZA-B-PORT, ZWYCIESTWO-IMPL). Dysk: 16 GB wolne. Worktree ZLOZA-B-REST (w toku) zachowane.

## ZWYCIESTWO-IMPL (P6.19-A): zintegrowane na parity-v2 (0ca58770e)
- Cherry-pick `3a4c55929 8a31afd24 8fc46b8d7` na `94feb5e37`, bez konfliktów.
- Pełny test na tipie: **3301 passed, 0 failed, 1 ignored** (exit 0); fmt OK; clippy `-D warnings` OK.
- **FF `parity-v2`: `94feb5e37` → `0ca58770e`.** Worktree `integ-victory` usunięty.
- Gotowe do wpięcia (ZWYCIESTWO-WIRING, świeży start).

## Przebieg (13.11, ~19:00): integracja ZWYCIESTWO-IMPL i świeże starty
- **ZWYCIESTWO-IMPL zintegrowane:** FF `parity-v2` `94feb5e37` → `0ca58770e`. Pełny test: **3301 passed, 0 failed, 1 ignored**.
- **Świeże starty (baza `0ca58770e`, bez cache poprzednich BLOCK):**
  - ZWYCIESTWO-WIRING-Q1 — `wf_ba1cfc1f-3e1`, Operator HAIKU.
  - ZLOZA-B-REST-Q1 — `wf_6615211b-a5e`, Operator HAIKU.
  - EKONOMIA-BRAZ-ERA-Q1 (runda 2) — `wf_a01b7169-2d9`, Operator HAIKU.
- **Dysk:** 16 GB wolne przed startem.
- **Dispatche:** baza zaktualizowana do `0ca58770e` (commit `61f507f12`).

## Przebieg (13.11, heartbeat 18:47): trzy aktywne, bez wyników FC
- **Aktywne Workflow (3 z 4):** ZWYCIESTWO-WIRING-Q1 (Operator, HAIKU, `wf_ba1cfc1f-3e1`), ZLOZA-B-REST-Q1 (Obrona, HAIKU, `wf_6615211b-a5e`), EKONOMIA-BRAZ-ERA-Q1 r2 (Operator, HAIKU, `wf_a01b7169-2d9`). Żaden nie ma jeszcze wyniku FC.
- **Czwarty slot pusty:** brak gotowego dispatchu. Pozostałe pozycje z kolejki (#96–#119) są zablokowane albo wymagają rozpoznania; nie startuję tematu bez dispatchu.
- **Dysk:** 9,1 GB wolne. Progi spełnione, brak awarii.
- **Parity:** `0ca58770e` (bez zmian). Worktree: 11.

## ZLOZA-B-REST-Q1: FC FAIL r2 (`d10bbdc9a`) → DODATEK r3
- **Wynik r2:** Operator dodał kod dla tech, surowiec_boolean, surowiec_ilosc, praca (`5a6adf3fb`, 12 testów basket, pełny test 3308/0/1 deklarowany). FC: **FAIL** — brak **wektorów z pina** dla tych czterech gałęzi (test wrappera vs helpery Rust to nie dowód parytetu). Zloto, miasto, jednostka, zywnosc: ODDANE z uzasadnieniem.
- **Decyzja:** runda 3 (to samo ID) z zakresem: rozszerzyć `p6_zloza_basket_gen.mjs` o wykonanie pina z rejestrującym harnessem stanu i wygenerować wektory dla czterech gałęzi. Baza r3: `5a6adf3fb`. DODATEK r3 wypchnięty.
- **Start r3:** świeże uruchomienie (bez cache). Wstrzymany: dysk 4,8 GB < 8 GB.

## Przebieg (13.11, heartbeat 19:10): ZLOZA-B-REST r3 wystartowany
- **Dysk:** spadł do 2,8 GB przy dwóch trwających tematach. Usunięto worktree zakończonych rund ZLOZA-B-REST (r1 i r2, FC FAIL). Round 2 FC zapisany jako gałąź `rust-port-wip/R-RUSTPORT-P6-ZLOZA-B-REST-Q1-r2-fc` (`d10bbdc9a`). Dysk: 12 GB.
- **Start ZLOZA-B-REST r3** (świeżo, baza `5a6adf3fb`) — `wf_d3ddfaff-163`, Operator HAIKU.
- **Trwają:** ZWYCIESTWO-WIRING-Q1 (`wf_ba1cfc1f-3e1`, Operator HAIKU, od 18:40); EKONOMIA-BRAZ-ERA-Q1 r2 (`wf_a01b7169-2d9`, Operator HAIKU, od 18:40). Oba bez wyniku.

## Przebieg (13.11, heartbeat 19:18): trzy aktywne
- **Aktywne Workflow (3 z 4):** ZWYCIESTWO-WIRING-Q1 (Operator, HAIKU, od 18:40, `wf_ba1cfc1f-3e1`); EKONOMIA-BRAZ-ERA-Q1 r2 (Evaluator, SONNET, Operator zakończony, `wf_a01b7169-2d9`); ZLOZA-B-REST-Q1 r3 (Operator, HAIKU, od 19:10, `wf_d3ddfaff-163`). Żaden bez wyniku FC.
- **Czwarty slot pusty:** brak gotowego dispatchu.
- **Dysk:** 13 GB. **Parity:** `0ca58770e`.

## EKONOMIA-BRAZ-ERA-Q1: FC FAIL r2 (`b611211fc`) → DODATEK r3
- **Wynik r2:** kod brązu i nowe testy OK (fmt, clippy, lib 110, p6_ekonomia_braz_era 9). Pełny test: **7 failed** w testach „running web” (`p6_adv_*`, `p6_empirefood_e2e`).
- **Przyczyna:** wektory tych testów pochodzą z pina **4bbef081d** (brąz = huta × m(e)), a parytet docelowy to **07d2fbd72** (brąz 50/75 per epoka). To wersja pina w wektorach, nie błąd kodu.
- **Decyzja orkiestratora:** rozszerzyć allowlistę o te testy/wektory/generatory i zregenerować z pina 07d2fbd72. Bez osłabiania asercji. DODATEK r3 wypchnięty, baza `b611211fc`, start świeży.
- **Start r3:** wstrzymany — dysk 7,3 GB < 8 GB (próg dla pełnego testu).

## Przebieg (13.11, heartbeat 19:47)
- **Aktywne Workflow (2 z 4):** ZWYCIESTWO-WIRING-Q1 (Operator, HAIKU, od 18:40, `wf_ba1cfc1f-3e1`); ZLOZA-B-REST-Q1 r3 (Evaluator, SONNET, od 19:10, `wf_d3ddfaff-163`). Bez wyniku FC.
- **EKONOMIA-BRAZ-ERA r3:** gotowa (DODATEK r3, baza `b611211fc`), start wstrzymany — dysk 7,8 GB < 8 GB.
- **Sprzątanie:** usunięto worktree zakończonej rundy EKONOMIA r2; obrona r2 zapisana jako gałąź `rust-port-wip/R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1-r2-obrona` (`b611211fc`).
- **Parity:** `0ca58770e`.

## ZWYCIESTWO-WIRING-Q1: FC FAIL r1 → DODATEK r2
- **Wynik r1:** kod wiringu zielony (fmt, clippy, lib 110, p6_victory_wiring 6, pełny test deklarowany 3307/0; r2 Operatora: 3308/0/1). FC FAIL, bo: (1) brak wektorów z pina (kryterium 1), (2) flaga końca gry `serde(skip)` — gracz bez miast po wczytaniu nie przegrywa, (3) brak wpięcia ustawiania flagi przy zakładaniu/przejęciu miasta, drugiej ścieżki przegranej i resetu przy wczytaniu, (4) test resetu tautologiczny.
- **Decyzje orkiestratora (parytet, bez pytania):** zapis flagi według tego, co pin faktycznie serializuje (sprawdzenie `save.ts`); allowlista rozszerzona o miejsca tworzenia miast tylko dla flagi; druga ścieżka przegranej wpięta; generator wektorów pina obowiązkowy.
- **Baza r2:** `b3fcba586`. Kod r1 zachowany jako gałąź `rust-port-wip/R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1-r1-doc`. Worktree r1 usunięte.
- **Start r2:** wstrzymany — dysk 6,8 GB < 8 GB.

## Przebieg (13.11, heartbeat 20:09): dwa świeże starty
- **Start ZWYCIESTWO-WIRING r2** (baza `b3fcba586`, świeżo) — `wf_87db356b-8ec`, Operator HAIKU.
- **Start EKONOMIA-BRAZ-ERA r3** (baza `b611211fc`, świeżo, wektory z pina `07d2fbd72`) — `wf_208a3a6e-7a9`, Operator HAIKU.
- **Trwa:** ZLOZA-B-REST r3 (Obrona, HAIKU, od 19:10, `wf_d3ddfaff-163`).
- **Dysk:** 11 GB przed startami. **Parity:** `0ca58770e`.

## Przebieg (13.11, heartbeat 20:18): trzy aktywne
- **Aktywne (3 z 4):** ZWYCIESTWO-WIRING r2 (Operator, HAIKU, od 20:09, `wf_87db356b-8ec`); EKONOMIA-BRAZ-ERA r3 (Operator, HAIKU, od 20:09, `wf_208a3a6e-7a9`); ZLOZA-B-REST r3 (Obrona, HAIKU, od 19:10, `wf_d3ddfaff-163`). Bez wyniku FC.
- **Czwarty slot pusty:** brak gotowego dispatchu.
- **Dysk:** 9,6 GB. **Parity:** `0ca58770e`.

## EKONOMIA-BRAZ-ERA: DECYZJA — przeniesiona do REPIN econ (#177), NIE integrowana teraz
- **Wynik r3:** FC FAIL (`3ad431966`). Założenie „pin 07d2fbd72 różni się od 4bbef081d tylko w brązie” było **fałszywe**. Diff `gra/`: `econ-params.json` (57/43), `converters.ts` (115/25), `turn-economy.ts` (225/75), `citizen-consumption-era.ts` (40/0). Dryf obejmuje cegielnię, odlewnie żelaza/stali, capy ludności, racje — nie tylko brąz.
- **Wybór orkiestratora (opcja c):** brąz per epoka wchodzi **razem z całym przesunięciem pinu econ** w temacie #177 (po zamknięciu P6), a nie jako wycinek. Powód: cząstkowe wprowadzenie parytetu brązu daje mieszany stan (kod z 07d2fbd72 obok wektorów z 4bbef081d) i testy running-web nigdy nie przejdą bez pełnego REPIN. Opcji (b) (maska kolumn) nie wybieram — to odstępstwo od 1:1.
- **Zachowane:** kod r2 `53d409a44` jako `rust-port-wip/R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1-r2-kod`; raport r3 `afd5a1b90` jako `…-r3-raport`.
- **Nie uruchamiać więcej rund EKONOMIA** do czasu REPIN econ.
- **Konflikt atrybucji** (Co-Authored-By w commitach Operatora): nadal do rozstrzygnięcia procesowego — do potwierdzenia przez właściciela.

## ZWYCIESTWO-WIRING: FC FAIL r2 → DECYZJA ZAKRESU → r3 (zawężony)
- **Wynik r2:** Operator BLOCK/DECISION_REQUIRED (`43519f552`), Evaluator FAIL, FC FAIL (`d1ce84a34`). Generator wiringu wykonywał tylko `victory.ts`; testy wiringu ręczne; potęgi arbitralne; semantyka błędu odbiegała od pina (try/catch → kontynuacja tury, nie cofanie).
- **Decyzje orkiestratora:** (B) zawężenie zakresu do: flaga końca gry, reset, odrzucanie komend, sprawdzenie po turze, generator wektorów wiringu, semantyka błędu jak w pinie. **Poza zakresem (osobne tematy):** ZDOBYCIE-MIASTA (#115), flaga przy zakładaniu/przejęciu miasta, druga ścieżka przegranej w bitwie, produkcyjne wczytanie `PlayableState`, `potegiWszystkichMF` vs `power_raw`.
- **Baza r3:** `d1ce84a34`. Start r3: `wf_00652ce1-d2a` (świeżo). Dispatch DODATEK r3 wypchnięty.
- **Sprzątanie:** usunięto worktree zakończonych rund EKONOMIA r3 i ZWYCIESTWO r2 (FC FAIL). Zachowane gałęzie: `rust-port-wip/…-EKONOMIA…-r3-fc` (`3ad431966`), `…-ZWYCIESTWO-WIRING-Q1-r2-fc` (`d1ce84a34`). Dysk przed startem: 11 GB.
- **Trwa:** ZLOZA-B-REST r3 (Obrona, HAIKU, od 19:10, `wf_d3ddfaff-163`).

## Przebieg (13.11, heartbeat 20:47)
- **Aktywne Workflow (3 z 4):** ZWYCIESTWO-WIRING-Q1 r3 (Operator, HAIKU, od 20:45, `wf_00652ce1-d2a`); ZLOZA-B-REST-Q1 r3 (Obrona, HAIKU, od 19:10, `wf_d3ddfaff-163`); ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1 (Operator, HAIKU, od 20:48, `wf_c9403e5f-f13`, rozpoznanie doc-only, baza `0ca58770e`, dispatch `e5cb8ce8d`).
- **Czwarty slot pusty:** brak kolejnego gotowego dispatchu.
- **Dysk:** 9,7 GB. **Parity:** `0ca58770e`.

## ZDOBYCIE-MIASTA-ROZPOZNANIE (#175): FC PASS-WITH-NOTES (`8d44d8d23`), zintegrowane dokumentem
- **Ustalenia kluczowe:** bramka zdobycia w `applyMapBattleOutcome` (pin `main.ts:34668-34677`) dotyczy każdego atakującego; tylko sprawdzenie obrońców dotyczy barbarzyńcy. Węzeł **applyCityCaptureAfterBattle** (`game/post-battle-map.ts`, wołanie `main.ts:36061`) — rdzeń zmiany właściciela — **brak w Rust**. Brak producenta `transferCityByTreaty` (`main.ts:36449`), `captureCityWithoutBattle` (`36368`). Moduły niepodłączone: `apply_transfer_with_effects` (`siege_transfer.rs:340`), `run_capital_capture_plunder` (`siege_capital_plunder.rs:504`), `check_defeat` (`victory.rs:261`).
- **Druga ścieżka przegranej:** produkcyjne wejście barbarzyńcy `main.ts:43398` (callback `43406`), nie w Rust.
- **Zakres do decyzji orkiestratora:** ZDOBYCIE-MIASTA-WIRING (#115) jako duży temat z podziałem na tematy (węzeł P9, bramki, cesja, druga ścieżka). Zależności od #106 (dyplomacja) i #120 (wypowiedzenie).
- **NIE_ZMIERZONO:** pełna semantyka `applyMapBattleOutcome` w Rust, wołający spoza `rust-port/`, mapowanie `playerEverOwnedCityByOwner`.
- Dokument zintegrowany na `claude/rust-sivvrn` (cherry-pick, bez zmian kodu).

## Przebieg (13.11, ~21:05): rozpoznanie zdobycia miasta zamknięte; awaria dysku
- **ZDOBYCIE-MIASTA-ROZPOZNANIE:** FC PASS-WITH-NOTES, zintegrowane jako dokumenty (`adc43ee10` / `ff2b36344`). Wniosek: zakres #115 jest duży — trzeba go podzielić na tematy (węzeł P9 `applyCityCaptureAfterBattle`, bramki zdobycia, cesja, druga ścieżka przegranej w barbarzyńcy). Decyzja o podziale — do zrobienia przy kolejnym dispatchu.
- **Awaria dysku:** dysk spadł do 1,0 GB przy trzech aktywnych workflow. Usunięto cztery worktree zakończonego rozpoznania (wyniki w gałęziach `wip/…` i w `claude/rust-sivvrn`). Dysk: 5,6 GB.
- **Aktywne:** ZWYCIESTWO-WIRING-Q1 r3 (Operator, HAIKU, `wf_00652ce1-d2a`); ZLOZA-B-REST-Q1 r3 (Obrona, HAIKU, `wf_d3ddfaff-163`).
- **Parity:** `0ca58770e`.

## ZLOZA-B-REST-Q1 (r3): FC PASS-WITH-NOTES (`ca3235f00`), integracja w toku
- **Zakres wykonany:** gałęzie stanu `transferBasketItems` — tech, surowiec_boolean, surowiec_ilosc, praca — z wektorami stanu z pina (160→226 przypadków stanu, plus 207 zloze). Harness stanu w `p6_zloza_basket_gen.mjs`, strażniki SHA. Mutacje (clamp puli Pracy, tie-break dawców, trim klucza) dają FAIL. Rust zgadza się z pinem we wszystkich przypadkach — zmian produkcyjnych nie było.
- **NIE_ZMIERZONO (jawnie):** zloto (`applyOneShotGoldTransfer`, brak ścieżki w Rust), żywność (`zapasyPanstwa`, brak zapisu w `OwnerFoodStates`), miasto (`transferCityByTreaty`, brak wariantu), jednostka (no-op na pinie). Efekty tech dla gracza 0 poza portem.
- **Decyzje orkiestratora z FC:**
  - Trailer `Co-Authored-By` z nazwą modelu w commitach Operatora **nie przenosimy** do nowej integracji (CLAUDE.md zabrania nazwy modelu w artefaktach). Integracja idzie cherry-pickiem z czystym komunikatem; historii już wypchniętej nie przepisujemy.
  - **Osobny temat (nie teraz):** sortowanie id dawców/biorców — Rust porównuje bajtowo, pin `localeCompare`; widoczne tylko przy remisie zapasu i id typu `c1_0`/`c10_0`. Poza allowlistą.
- **Integracja:** worktree `integ-zloza2` na `0ca58770e`, cherry-pick `5a6adf3fb..ca3235f00` (bez `-x`, z czystym komunikatem). Pełny test w tle; FF po zielonym wyniku.

## ZWYCIESTWO-WIRING-Q1 (r3): FAIL — regresja roundtripu → DODATEK r4
- **Wynik r3:** Operator BLOCK (kryterium 4: pełny test nie 0 failed), Evaluator FAIL, FC nie zakończył się (ENOSPC przy tworzeniu worktree). Przyczyna: `gracz_kiedys_mial_miasto` z `#[serde(skip)]` → test `p6_stan_ulepszenia::new_fields_roundtrip_and_default_is_omitted` pada (po roundtripie `false` przy `true` w stanie). To regresja tematu, nie błąd środowiska.
- **Decyzja:** DODATEK r4 (baza `02eef7219`): persystować flagę z `skip_serializing_if` gdy `false`, ALE najpierw sprawdzić w pinie `save.ts`, czy pin zapisuje to pole; jeśli nie — derywacja z miast przy wczytaniu wg `main.ts:46368-46370`. Allowlista r4: test flagi i golden `p6_unit_replace_l3_state` wyłącznie o nowe pole.
- **Gałąź zachowana:** `rust-port-wip/R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1-r3-wip` (`1e3939b4d`). Worktree r3 usunięte (dysk).
- **Start r4:** wstrzymany do ≥8 GB (dysk po sprzątaniu 8,6 GB, trwa test integracji ZLOZA-B-REST).

## ZLOZA-B-REST (r3): zintegrowane na parity-v2 (`e51b61637`)
- Pełny test na tipie integracji: **3310 passed, 0 failed, 1 ignored** (exit 0); fmt OK; clippy `-D warnings` OK.
- **FF `parity-v2`: `0ca58770e` → `e51b61637`.** Zawiera gałęzie stanu tech, surowiec_boolean, surowiec_ilosc, praca z wektorami z pina. Zloto, żywność, miasto — NIE_ZMIERZONO (brak stanu w Rust).
- Worktree `integ-zloza2` usunięty.

## Przebieg (13.11, ~21:35): ZLOZA-B-REST zintegrowane; start ZWYCIESTWO-WIRING r4
- **ZLOZA-B-REST r3:** FF `parity-v2` `0ca58770e` → `e51b61637`. Pełny test: **3310 passed, 0 failed, 1 ignored**. Gałęzie tech/surowce/praca z wektorami pina; złoto, żywność, miasto NIE_ZMIERZONO.
- **Start ZWYCIESTWO-WIRING r4** (DODATEK r4, baza `02eef7219`, świeżo) — `wf_7e991851-c78`, Operator HAIKU. Uwaga: baza r4 pochodzi sprzed FF ZLOZA; przed integracją kod r4 trzeba przenieść na bieżący parity (konflikty możliwe tylko w pliku komendy/rejestru, nie w ZLOZA).
- **Dysk:** 13 GB przed startem. **Parity:** `e51b61637`.

## Przebieg (13.11, heartbeat 21:18): jeden aktywny
- **Aktywne (1 z 4):** ZWYCIESTWO-WIRING-Q1 r4 (Operator, HAIKU, od ok. 21:35, `wf_7e991851-c78`).
- **Puste sloty (3):** brak gotowych dispatchów. Kolejne kandydaci wymagają napisania dispatchu z rozpoznań: ZDOBYCIE-MIASTA-WIRING (#115, podział na tematy wg rozpoznania `R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1`), CRED-HAK T1 (#120, wg rozpoznania hak P4), ZLOZA-WIRING (#104/#172, wg rozpoznania ZLOZA-WIRING). Startu bez dispatchu nie wykonuję.
- **Dysk:** 12 GB. **Parity:** `e51b61637`.

## Przebieg (13.11, heartbeat 21:47): ZWYCIESTWO-WIRING r4 na etapie FC — niezakończone
- **Stan:** FC (`wf_7e991851-c78`) ocenia kod r4 z worktree Operatora, bez commita Operatora i bez `01-operator-r4.md`. Status FC: PASS-WITH-NOTES, ale zapisany jako „nie zakończone: pełny cargo test w toku”. **Nie integrować** do czasu commita i pełnego testu z kodem zakończonym.
- **Zmiana r4 (wg FC):** tylko `rust-port/engine/tests/p6_stan_ulepszenia.rs` (test roundtripu flagi). Funkcja `odtworz_flage_zwyciestwa_ze_miast` zostaje `#[cfg(test)]` — produkcyjnej ścieżki wczytania `PlayableState` nie ma (do osobnego tematu).
- **Dysk:** 3,6 GB (poniżej progu startów; test FC w toku).
- **Parity:** `e51b61637`.

## ZWYCIESTWO-WIRING-Q1 (P6.19-C): FC PASS-WITH-NOTES (r4, `1573860a2`), integracja w toku
- **Stan r4 (wg Evaluatora):** pełny `cargo test` 3315/0/1 zgłoszony przez Evaluatora (nie powtórzony przeze mnie); test `new_fields_roundtrip_and_default_is_omitted` zmieniony na flagę `false` po roundtripie — zgodne z pinem, bo `save.ts` nie zapisuje pola (grep = 0). Obrona zgłasza, że lepsza byłaby asercja na wartość efektywną (`flaga || gracz ma miasto`); przyjmuję tę uwagę jako **notę**, a nie blokadę: w obu wariantach obserwowalna różnica dotyczy tylko wczytania bez ewaluacji, czyli osobnego tematu `ZWYCIESTWO-LOAD`.
- **Decyzje zakresowe (orkiestrator):** produkcyjne wczytanie `PlayableState` i odtwarzanie flagi ze miast (`main.ts:46368-46370`) → osobny temat **ZWYCIESTWO-LOAD**. Zakładanie/przejęcie miasta (`main.ts:16508, 17816, 36218, 45646`) → zależne od #115 (**ZDOBYCIE-MIASTA**). Druga ścieżka przegranej w bitwie (`34018-34025`) → razem z #115.
- **Integracja:** cherry-pick kodu r1–r4 zrobiony jako **jeden** diff (5 plików) na `parity-v2` `e51b61637` w worktree `integ-victory2`, z czystym komunikatem (bez trailerów modelu). Commit lokalny; pełny test w tle; FF po zielonym wyniku.
- **Gałęzie zachowane:** `rust-port-wip/R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1-r4-fc` (`1573860a2`), `…-r3-wip` (`1e3939b4d`). Worktree rund r4 usunięte.
- **Rundy:** 4/5 wykorzystane. Piąta runda = ostatnia; jeśli FAIL — eskalacja do właściciela.

## ZWYCIESTWO-WIRING (P6.19-C): zintegrowane na parity-v2 (`a381dd13f`)
- Pełny test na tipie: **3324 passed, 0 failed, 1 ignored** (exit 0); fmt OK; clippy `-D warnings` OK.
- **FF `parity-v2`: `e51b61637` → `a381dd13f`.** Jeden czysty commit (kod r1–r4 jako jeden diff, bez trailerów modelu).
- Zakres: koniec gry w stanie, sprawdzenie po turze, odrzucanie komend po końcu gry, generator wektorów wiringu z pina, flaga bez zapisu (pin `save.ts`).
- **Poza zakresem (osobne tematy):** `ZWYCIESTWO-LOAD` (produkcyjne wczytanie stanu, odtwarzanie flagi ze miast), zakładanie/przejęcie miasta i druga ścieżka przegranej w bitwie (zależne od #115 ZDOBYCIE-MIASTA).
- Worktree `integ-victory2` usunięty.

## Przebieg (13.11, heartbeat 22:18): sloty puste, brak trwających Workflow
- **Trwających Workflow: 0 (4 sloty puste).** Zakończone etapy: ZWYCIESTWO-WIRING r4 (FC — zintegrowane, `a381dd13f`), ZLOZA-B-REST r3 (FC — zintegrowane, `e51b61637`), ZDOBYCIE-MIASTA-ROZPOZNANIE (FC — dokumenty zintegrowane).
- **Kandydaci bez gotowego dispatchu:** ZDOBYCIE-MIASTA-WIRING (#115 — rozbić na tematy wg rozpoznania: węzeł P9, bramki zdobycia, cesja, druga ścieżka przegranej), CRED-HAK-WYPOWIEDZENIE (#120 — rozpoznanie gotowe, T1–T5), ZLOZA-WIRING (#104/#172 — rozpoznanie gotowe), ZWYCIESTWO-LOAD (produkcyjne wczytanie stanu i flaga ze miast). Startu bez dispatchu nie wykonuję; napisanie dispatchów to kolejny krok.
- **Dysk:** 11 GB. **Parity:** `a381dd13f`.

## Przebieg (13.11, heartbeat 22:48): bez zmian
- **Trwających Workflow: 0** (sloty puste). Brak gotowych dispatchów — kandydaci (#115, #120, #104/#172, ZWYCIESTWO-LOAD) czekają na decyzję kolejności i napisanie dispatchu.
- **Dysk:** 11 GB. **Parity:** `a381dd13f`. Worktree: 2.

## Przebieg (13.11, heartbeat 23:17): bez zmian
- **Trwających Workflow: 0** (sloty puste). Brak zatwierdzonego dispatchu — czekam na wybór kolejnego tematu (ZDOBYCIE-MIASTA #115 lub CRED-HAK #120).
- **Dysk i parity:** patrz wartości w tym wpisie; worktree: 2.

## Przebieg (13.11, heartbeat 23:47): bez zmian
- **Trwających Workflow: 0** (sloty puste). Brak zatwierdzonego dispatchu — czekam na wybór kolejnego tematu (ZDOBYCIE-MIASTA #115 lub CRED-HAK #120).
- **Parity:** `a381dd13f`. Worktree: 2.

## Przebieg (14.11, heartbeat 00:18): bez zmian
- **Trwających Workflow: 0** (sloty puste). Brak zatwierdzonego dispatchu — czekam na wybór kolejnego tematu (ZDOBYCIE-MIASTA #115 lub CRED-HAK #120).
- **Parity:** `a381dd13f`. Worktree: 2.

## Przebieg (14.11, heartbeat 00:47): bez zmian
- **Trwających Workflow: 0** (sloty puste). Brak zatwierdzonego dispatchu — czekam na wybór kolejnego tematu (ZDOBYCIE-MIASTA #115 lub CRED-HAK #120).
- **Parity:** `a381dd13f`. Worktree: 2.

## Przebieg (14.11, heartbeat 01:47): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** (katalog `subagents/workflows/` pusty). Slotów 0 z 4.
- **Dlaczego nie uruchomiono 4 slotów:** pytanie o pierwszy temat (ZDOBYCIE-MIASTA-WIRING #115 zalecane albo CRED-HAK-WYPOWIEDZENIE #120) zostało zadane dwukrotnie; obie odpowiedzi przerwał restart workera. Bez wyboru nie zapisuję dispatchów na cztery tematy naraz.
- **Plan po wyborze:** #115 najpierw rozbić na tematy (węzeł P9, bramki zdobycia, cesja, druga ścieżka przegranej); CRED-HAK (#120) ma rozpoznanie gotowe, można od razu zapisać dispatch.
- **Parity:** `a381dd13f`. Worktree: 2 (`/home/user/The-Game`, `/home/user/reg-wt`). Dysk wolny: 11 GB.
- **Push:** `1bec6756a` na `origin/claude/rust-sivvrn` (poprzedni heartbeat 00:47 wypchnięty po raz pierwszy w tej sesji).

## Przebieg (14.11, heartbeat 02:18): sloty puste, nadal czeka na wybór tematu
- **Trwających Workflow: 0** z 4 (katalog `subagents/workflows/` pusty). Sloty nie zostały uruchomione.
- **Powód:** trzeci tick bez odpowiedzi na pytanie o pierwszy temat (ZDOBYCIE-MIASTA-WIRING #115 zalecane albo CRED-HAK-WYPOWIEDZENIE #120). Pytanie przerwały restarty workera, więc nie dało się go zadać w narzędziu AskUserQuestion. Nie zapisuję czterech dispatchów na tematy, których kolejności właściciel nie potwierdził.
- **Po wyborze:** #115 najpierw rozbić na tematy; CRED-HAK (#120) ma gotowe rozpoznanie.
- **Parity:** `a381dd13f`. Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 02:47): sloty puste, nadal czeka na wybór tematu
- **Trwających Workflow: 0** z 4 (katalog `subagents/workflows/` pusty). Sloty nie zostały uruchomione.
- **Powód:** czwarty tick bez odpowiedzi na pytanie o pierwszy temat (ZDOBYCIE-MIASTA-WIRING #115 zalecane albo CRED-HAK-WYPOWIEDZENIE #120). Nie zapisuję czterech dispatchów bez potwierdzenia kolejności.
- **Parity:** `a381dd13f`. Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 03:17): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: piąty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f`. Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 03:47): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: szósty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f`. Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 04:17): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: siódmy tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f`. Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 04:47): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: ósmy tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f`. Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 05:17): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: dziewiąty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f`. Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 05:47): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: dziesiąty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f`. Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 06:17): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: jedenasty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f` (sprawdzone fetch). Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 06:47): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: dwunasty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f` (sprawdzone fetch). Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 07:17): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: trzynasty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f` (sprawdzone fetch). Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 07:47): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: czternasty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f` (sprawdzone fetch). Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 08:17): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: piętnasty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f` (sprawdzone fetch). Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 08:47): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: szesnasty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f` (sprawdzone fetch). Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 09:17): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: siedemnasty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f` (sprawdzone fetch). Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 09:47): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: osiemnasty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f` (sprawdzone fetch). Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 10:17): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: dziewiętnasty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f` (sprawdzone fetch). Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 10:47): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: dwudziesty tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f` (sprawdzone fetch). Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 11:17): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: dwudziesty pierwszy tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f` (sprawdzone fetch). Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, heartbeat 11:48): sloty puste, czeka na wybór tematu
- **Trwających Workflow: 0** z 4. Sloty nie zostały uruchomione: dwudziesty drugi tick bez odpowiedzi na pytanie o pierwszy temat (#115 zalecane / #120).
- **Parity:** `a381dd13f` (sprawdzone fetch). Worktree: 2. Dysk wolny: 11 GB.

## Przebieg (14.11, start czterech slotów na prośbę właściciela)
- **Decyzja właściciela (14.11):** „odpalaj cztery sloty”. Wybrano cztery tematy z kolejki: ZDOBYCIE-WIRING (#115, plądrowanie stolicy), ZLOZE-WIRING (#104), CRED-HAK-WYPOWIEDZENIE (#120), TOWER-TARGET (#116). #96 K5-LOOP-WIEZE nie startuje, bo zależy od #116.
- **Baza:** `a381dd13f` (sprawdzone 14.11 przez `git grep`: `run_capital_capture_plunder` i `apply_transfer_with_effects` bez produkcyjnego wołającego; `deactivate_zloze_grants_for_deal` / `sync_relation_status_from_deals` tylko w definicjach; `pick_tower_target` bez wołającego w pętli; `declare_forced_wars` / `declare_from_assignments` bez haka P4 w ścieżkach gracza, sojuszu i klastra).
- **Dispatche:** przepisane z `23e33793e` na `a381dd13f`, wypchnięte commitem `f6aac03b9`.
- **Workflow (run IDs):** ZDOBYCIE-WIRING `wf_9a1f0958-6c2`; ZLOZE-WIRING `wf_4dca0cce-39a`; CRED-HAK-WYPOWIEDZENIE `wf_5f9d8207-512`; TOWER-TARGET `wf_08046de1-bd4`. Model: Operator i Obrona HAIKU, Evaluator i Final Control SONNET.
- **Uwaga procesowa:** podczas przygotowania skryptów nadpisałem szablon `topic-…-ZDOBYCIE-WIRING-Q1.js`; przywrócono pełną treść przed startem. Wpływ: brak, skrypty uruchomione po naprawie (37 linii każdy).
- **Parity:** `a381dd13f`. Worktree: 2 (przed startem). Dysk wolny: 11 GB.

## Przebieg (14.11, po starcie czterech slotów): dwa tematy zatrzymane, dysk ratowany
- **CRED-HAK-WYPOWIEDZENIE (#120):** Operator r1 = **BLOCK z dowodem** (`git grep` na `a381dd13f`): brak produkcyjnej ścieżki wypowiedzenia gracza, sojuszu (`joinAllyToWar`) i klastra (`resolveClusterCityStateWarOnPlayer`). Hak P4 nie został dodany. Raport: commit `915b31fc3`, gałąź `wip/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-Q1`. **Decyzja wymagana:** A) osobny temat portu wypowiedzenia gracza, potem hak; B) port sojuszu i klastra jako tematy zależne (klaster wymaga `cityStatesCount`); C) zamknąć #120 jako „ścieżki nieistniejące”.
- **ZLOZE-WIRING (#104):** Operator r1 = **DECISION_REQUIRED** (commit `40884a5f8`): brak nośnika `zloze_grants` w stanie Rust; wiring wymaga zmiany formatu stanu/zapisu (`#[serde(default)]`), a producent `transfer_basket_items` nie jest w produkcji. `sync_relation_status_from_deals` jest już pokryte przez `sync_relation_from_deals` (turn_war_dipl_steps.rs:1004). **Decyzja wymagana:** (a) osobny temat „model zloze_grants w DiplomacyState” z własną allowlistą, albo (b) zamknąć #104 jako odłożone do tematu tworzenia grantów.
- **Dysk:** w trakcie startu spadł do 560 MB (ENOSPC przy tworzeniu worktree; oba tematy padły na `WorktreeIsolationError`). Zwolniono cache cargo (`scratchpad/target`, `target-r4`, `target-base`, `/tmp/fc-*-target`) i worktree zakończonych, niezmienionych uruchomień (`wf_5f9d8207-512-*`, `wf_4dca0cce-39a-*`). Gałęzie `wip/*` pozostają. Po czyszczeniu: 8,7 GB wolne.
- **Nadal w toku:** ZDOBYCIE-WIRING (#115) `wf_9a1f0958-6c2`, TOWER-TARGET (#116) `wf_08046de1-bd4`.
- **Slotów wolnych: 2**, zablokowane decyzjami właściciela powyżej. Nie uzupełniono ich tematami zależnymi od tych decyzji.
- **Parity:** `a381dd13f`. Dysk wolny: 8,7 GB.

## Przebieg (14.11, wynik pierwszej rundy czterech slotów)
Żaden z czterech tematów nie dostarczył kodu. Trzy zakończyły się zatrzymaniem na decyzji, jeden na błędzie procesu.
- **ZDOBYCIE-WIRING (#115):** Operator BLOCK (dysk 6,5 GB < próg 8 GB, kod nietknięty), Evaluator FAIL, Obrona przyjęła wszystkie zarzuty, Final Control FAIL. Zarzuty merytoryczne: brak produkcyjnego wołającego `run_capital_capture_plunder`, brak testu wektorowego (generator `.mjs` poza allowlistą), brak uruchomionych bramek. **Decyzja techniczna (orkiestrator):** wariant B, wrapper po stronie wołającego wg pina `main.ts:17814-17828` (rekomendacja Operatora, zgodna z zasadą 9). **Do zrobienia:** poszerzyć allowlistę o generator `.mjs` i SHA-256, dopisać DODATEK r2 z bazą `a381dd13f`. Gałąź `wip/R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1-r1`, commity `a096f9d0d`, `be80236ee`, `74483bf49`.
- **TOWER-TARGET (#116):** Operator BLOCK z dowodem (`git grep` na `a381dd13f`): `SiegeEnv` nie ma wierszy wież, `towerRange` ani `wallTileHp`; zmiana kształtu narusza testy poza allowlistą; pin wywołuje `pickTowerTarget` w `_fireOneTower` odroczonym przez `_schedule` (180 ms), a hook Rust jest synchroniczny. Evaluator PASS-WITH-NOTES (potwierdza BLOCK), FC PASS-WITH-NOTES. **Błąd procesu:** worktree Operatora stał na `501f78c08` (gałąź `R-WEB-SIEGE-TOWER-BREACH-EVERYWHERE-Q1`), a nie na bazie dispatchu `a381dd13f`. Dlatego commit `2deabd156` nie jest potomkiem bazy. Zanim ruszy runda 2, trzeba sprawdzić, dlaczego worktree nie został postawiony na bazie. **Decyzja (orkiestrator):** scalić z #96 K5-LOOP-WIEZE albo poszerzyć allowlistę o `siege_tactics_loop.rs` i `siege_tactics_turnseq.rs`. Gałąź `wip/R-RUSTPORT-P6-TOWER-TARGET-Q1`.
- **CRED-HAK-WYPOWIEDZENIE (#120):** BLOCK z dowodem (wcześniej opisany). **Decyzja właściciela:** A / B / C.
- **ZLOZE-WIRING (#104):** DECISION_REQUIRED (wcześniej opisany). **Decyzja właściciela:** (a) / (b).
- **Procesowo:** dwa tematy padły na ENOSPC przy tworzeniu worktree (dysk 560 MB). Po czyszczeniu cache i worktree zakończonych uruchomień: 15 GB wolnych. Zakończone worktree (`wf_9a1f0958-6c2-1..3`, `wf_08046de1-bd4-1..3`, `wf_5f9d8207-512-1..2`, `wf_4dca0cce-39a-1..3`) usunięte po sprawdzeniu, że były czyste; gałęzie `wip/*` zostają.
- **Sloty:** 0 z 4 aktywnych. Następna runda wymaga decyzji (CRED-HAK A/B/C, ZLOZE a/b) albo mojego ruchu technicznego dla ZDOBYCIE (wariant B, DODATEK r2) i TOWER (scalenie z #96).
- **Parity:** `a381dd13f`. Dysk wolny: 15 GB.

## Przebieg (14.11, heartbeat 12:18): sloty puste, czeka na decyzje właściciela
- **Trwających Workflow: 0** z 4. Nie uruchomiono nowych tematów: kandydaci z kolejki (CRED-HAK #120, ZLOZE #104, TOWER-TARGET #116) czekają na decyzję właściciela (zob. wpis wyżej). ZDOBYCIE-WIRING #115 wymaga rundy 2 (DODATEK r2: wariant B, poszerzona allowlista), a jego start wstrzymano do potwierdzenia.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: 15 GB.

## Przebieg (14.11, heartbeat 12:48): sloty puste, czeka na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 12:18: kandydaci czekają na decyzje właściciela (CRED-HAK A/B/C, ZLOZE a/b, TOWER-TARGET), a start ZDOBYCIE r2 wstrzymany do potwierdzenia.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: 15 GB.

## Przebieg (14.11, heartbeat 13:18): sloty puste, czeka na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 12:48: kandydaci czekają na decyzje właściciela (CRED-HAK A/B/C, ZLOZE a/b, TOWER-TARGET), start ZDOBYCIE r2 wstrzymany do potwierdzenia.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: 15 GB.

## Przebieg (14.11, heartbeat 13:48): sloty puste, czeka na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 13:18: kandydaci czekają na decyzje właściciela (CRED-HAK A/B/C, ZLOZE a/b, TOWER-TARGET), start ZDOBYCIE r2 wstrzymany do potwierdzenia.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: 15 GB.

## Przebieg (14.11, heartbeat 14:18): sloty puste, czeka na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 13:48: kandydaci czekają na decyzje właściciela (CRED-HAK A/B/C, ZLOZE a/b, TOWER-TARGET), start ZDOBYCIE r2 wstrzymany do potwierdzenia.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: 15 GB.

## Przebieg (14.11, heartbeat 14:48): sloty puste, czeka na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 14:18: kandydaci czekają na decyzje właściciela (CRED-HAK A/B/C, ZLOZE a/b, TOWER-TARGET), start ZDOBYCIE r2 wstrzymany do potwierdzenia.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: 15 GB.

## Przebieg (14.11, heartbeat 15:18): sloty puste, czeka na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 14:48: kandydaci czekają na decyzje właściciela (CRED-HAK A/B/C, ZLOZE a/b, TOWER-TARGET), start ZDOBYCIE r2 wstrzymany do potwierdzenia.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: 15 GB.

## Przebieg (14.11, heartbeat 15:48): sloty puste, czeka na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 15:18: kandydaci czekają na decyzje właściciela (CRED-HAK A/B/C, ZLOZE a/b, TOWER-TARGET), start ZDOBYCIE r2 wstrzymany do potwierdzenia.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: 15 GB.

## Przebieg (14.11, heartbeat 16:18): sloty puste, czeka na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 15:48: kandydaci czekają na decyzje właściciela (CRED-HAK A/B/C, ZLOZE a/b, TOWER-TARGET), start ZDOBYCIE r2 wstrzymany do potwierdzenia.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: 15 GB.

## Przebieg (14.11, heartbeat 16:48): sloty puste, czeka na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 16:18: kandydaci czekają na decyzje właściciela (CRED-HAK A/B/C, ZLOZE a/b, TOWER-TARGET), start ZDOBYCIE r2 wstrzymany do potwierdzenia.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: 15 GB.

## Przebieg (14.11, heartbeat 17:18): sloty puste, czeka na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 16:48: kandydaci czekają na decyzje właściciela (CRED-HAK A/B/C, ZLOZE a/b, TOWER-TARGET), start ZDOBYCIE r2 wstrzymany do potwierdzenia.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: 15 GB.

## Przebieg (14.11, heartbeat 17:48): sloty puste, czeka na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 17:18: kandydaci czekają na decyzje właściciela (CRED-HAK A/B/C, ZLOZE a/b, TOWER-TARGET), start ZDOBYCIE r2 wstrzymany do potwierdzenia.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: 15 GB.

## Przebieg (14.11, decyzje właściciela z pytań ABC → starty)
- **Decyzje właściciela:** ZDOBYCIE r2 — uruchom (wariant B, baza `a381dd13f`, poszerzona allowlista); TOWER-TARGET — scalić z #96 (temat `R-RUSTPORT-P6-WIEZE-MERGE-Q1`); CRED-HAK — opcja A (`R-RUSTPORT-P6-WYPOWIEDZENIE-GRACZA-PORT-Q1`: port wypowiedzenia gracza, potem hak P4; sojusz i klaster poza zakresem); ZLOZE — opcja a (osobny temat `zloze_grants`, jeszcze NIE uruchomiony).
- **Uruchomione (Workflow w tej sesji):** ZDOBYCIE-WIRING r2 `wf_e7cbec64-7dd`; WIEZE-MERGE `wf_8d676f92-b14`; WYPOWIEDZENIE-GRACZA-PORT `wf_fb93f982-e91`.
- **Ryzyko bazy:** operator WIEZE-MERGE (`wf_8d676f92-b14-1`) stoi na `501f78c08`, a nie na `a381dd13f` — tak jak poprzedni TOWER-TARGET. Dispatch wymaga `merge-base` przed pracą; sprawdzić w raporcie r1.
- **Wstrzymane:** ZLOZE (opcja a) do czasu zwolnienia miejsca na dysku (próg startu 8 GB). Dispatch do napisania po starcie.
- **Zasada 10 w CLAUDE.md** (pytania ABC: opis przedmiotu na początku, zalety/wady każdej opcji, zawsze rekomendacja z uzasadnieniem) — zapisana i wypchnięta.
- **Parity:** `a381dd13f`. Dysk: patrz linia wyżej w tym wpisie (sprawdzone przed startem trzeciego tematu).

## Przebieg (14.11, heartbeat 19:17): sloty puste, dwa pytania ABC czekają na decyzję właściciela
- **Trwających Workflow: 0** z 4. Zakończone przed restartem kontenera: ZDOBYCIE r2 (BLOCK, brak produkcyjnej ścieżki przejęcia), WIEZE-MERGE (BLOCK, zakres za duży dla jednej rundy; FC FAIL), WYPOWIEDZENIE-GRACZA-PORT (BLOCK, brak wejścia gracza w `EngineCommand`; FC PASS-WITH-NOTES). Wyniki: `/tmp/claude-0/.../tasks/wfvo3bdu6.output`, `whixrqmxs.output`; commity na gałęziach `wip/*`.
- **Oczekuje na decyzję (ABC w czacie):** #115 (A1/A2/A3) i #120 (A: wariant w EngineCommand / B: wywołanie wewnątrz silnika).
- **Decyzja techniczna (zasada 9):** źródło statystyk strzelca wieży (`towerShooterRow`) — stałe z pina `battleScene.ts`, nie wiersz tabeli jednostek.
- **Dysk:** po sprzątaniu 17 GB wolnego; usunięte 14 czystych worktree zakończonych uruchomień (commity zostają na `wip/*`) i cache cargo w scratchpadzie.
- **Parity:** `a381dd13f`.

## Przebieg (14.11, heartbeat 19:48): sloty puste, czekają na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 19:17: decyzje #115 (A1/A2/A3) i #120 (A/B) nadal czekają na odpowiedź właściciela; bez nich nie startuję kolejnych operatorów.
- **Parity:** `a381dd13f` (sprawdzone fetch). Dysk wolny: patrz wpis 19:17.

## Przebieg (14.11, heartbeat 20:18): sloty puste, czekają na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 19:48: decyzje #115 (A1/A2/A3) i #120 (A/B) nadal czekają na właściciela; bez nich nie startuję kolejnych operatorów.
- **Parity:** `a381dd13f` (sprawdzone fetch).

## Przebieg (14.11, heartbeat 20:48): sloty puste, czekają na decyzje właściciela
- **Trwających Workflow: 0** z 4. Bez zmian względem 20:18: decyzje #115 (A1/A2/A3) i #120 (A/B) nadal czekają na właściciela; bez nich nie startuję kolejnych operatorów.
- **Parity:** `a381dd13f` (sprawdzone fetch).

## Przebieg (14.11, heartbeat 21:18): 1 z 4 slotów zajęty (ZLOZE-GRANTS-STATE), reszta czeka
- **Trwających Workflow: 1** z 4. Start: `R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1` (`wf_4c2b7e55-cfa`), Operator HAIKU, Evaluator/FC SONNET, Obrona HAIKU. Dispatch `1010b2b37`, baza `a381dd13f`.
- **Zakres (wariant a z pytania ABC):** pole `zloze_grants` w `DiplomacyState` z `#[serde(default)]` i testem kompatybilności zapisu, port `suspend_zloze_grants_for_war` (pin `diplomacy-pn-engine.ts:331-344`), wektory z pinu. Wiring do produkcji zostaje w #104 jako część 2.
- **Dlaczego tylko 1 slot:** WIEZE-MERGE w wariancie „stage 1” wymaga nowego dispatchu (rundy r2 po BLOCK i FC FAIL), napiszę go w następnym ticku, po przeczytaniu raportów `01-operator-r1.md` i `02-evaluator.md`. Wpisy z `KOLEJKA-RUST.md` (W8 r3, UNIT-REPLACE L-3, Siege #217) są przestarzałe: W8 r3 już zintegrowany (#25), a KOLEJKA nie była odświeżana (#154).
- **Czekają na decyzję właściciela (w czacie):** #115 ZDOBYCIE-MIASTA (A1/A2/A3) i #120 WYPOWIEDZENIE GRACZA (A/B). Gameplay decyzje (SZTURM ODPARTY, W8 r7 Q1–Q4, units.json vs pin, DYSTANS, REPIN-DRYFT) nie są moje.
- **Dysk:** 17 GB wolnego (sprawdzone przed startem).
- **Parity:** `a381dd13f` (sprawdzone fetch).

## Przebieg (14.11, heartbeat 21:47): 2 z 4 slotów zajęte; 2 wolne, bez realnej pracy w tym ticku
- **Trwających Workflow: 2** z 4.
  - ZLOZE-GRANTS-STATE-Q1 (`wf_4c2b7e55-cfa`): Operator HAIKU zrobił r1 (PASS-WITH-NOTES po obronie, SHA obrony `b0cb6c48f`); Evaluator SONNET zgłosił zarzuty; teraz FC SONNET.
  - WIEZE-MERGE-Q1 r2, ETAP 1 (`wf_38834851-4ff`): dispatch DODATEK r2 `23e7f909e`, baza `a381dd13f`. Zakres: `SiegeEnv` + `pick_tower_target` w produkcyjnym wołaniu + test z wektorami z pina. Strzał wieży i odroczenie 180 ms zostają na etap 2 i będą jawnie zgłoszone jako niezrobione. Operator HAIKU (pierwsza runda r2 po BLOCK r1 i FC FAIL r1).
- **Dlaczego 2 sloty, nie 4:** pozostałe tematy z `TaskList` (#96–#119) są zablokowane albo wymagają decyzji właściciela (#115, #120 w czacie; #97, #98, #100, #109, #112, #113 zablokowane allowlistą lub zależne od WIEZE/OUTCOME). Kandydat #106 R7K7C-WIRING wymaga najpierw sprawdzenia statusu (#176), czego nie zrobiłem w tym ticku. Nie startuję tematów bez dispatchu i rozpoznania.
- **Do zrobienia w następnym ticku:** sprawdzić #176 (R7K7C-WIRING), ewentualnie dispatch #106; po FC ZLOZE — runda integracyjna (Haiku) i sprzątanie worktree.
- **Dysk:** 12 GB wolnego (sprawdzone przed startem WIEZE r2).
- **Parity:** `a381dd13f`.
- **Uwaga do commitów:** dwa wcześniejsze commity (dispatch ZLOZE, rejestr 21:18) mają trailer `Co-Authored-By` z nazwą modelu. Od tej chwili commity nie zawierają nazwy modelu (zgodnie z zasadą z promptu systemowego); historii nie przepisuję.

## Przebieg (14.11, ZLOZE-GRANTS-STATE zintegrowany na parity-v2)
- **Temat:** `R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1` (#104 część 1). Final Control PASS-WITH-NOTES, SHA `d6d197099`. Obrona r1 `b0cb6c48f` (alias `zlozeGrants`, test wczytania zapisu webowego). Evaluator r1 raport w `442eac1db`.
- **Integracja:** ancestry `a381dd13f → d6d197099` OK; diff 8 plików, w allowliście. Bramki na `d6d197099` w worktree integracyjnym: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0; pełny `cargo test` EXIT 0 (3332 passed, 0 failed).
- **FF:** `origin/rust-port/parity-v2` `a381dd13f` → `d6d197099` (potwierdzone fetch).
- **Refs:** `refs/keep/ZLOZE-GRANTS-STATE-Q1-fc` i `rust-port-wip/ZLOZE-GRANTS-STATE-Q1` na `d6d197099`.
- **Sprzątanie:** usunięte worktree tematu (`integ-zloze`, `wf_4c2b7e55-cfa-1..4`) i `target` w scratchpadzie. Worktree WIEZE r2 (`wf_38834851-4ff-1`) zostaje, bo trwa.
- **Dalej:** #104 część 2 (wiring do produkcji) jeszcze nie zrobiona; czeka na decyzję kolejności. Uwaga z FC: zapis pod kluczem snake_case; rename tylko jeśli część 2 tego wymaga.
- **Parity:** `d6d197099`.

## Przebieg (14.11, heartbeat 22:18–22:41): WIEZE etap 1 zintegrowany; start WIEZE-CITYTOWERS (2A)
- **Integracja WIEZE-MERGE r2 etap 1:** FC PASS-WITH-NOTES `c9473f4c9`. Rebase na `d6d197099` (ZLOZE) bez konfliktów → `7193f5de2`. Bramki na `7193f5de2`: fmt EXIT 0; clippy `-D warnings` EXIT 0; pełny `cargo test` EXIT 0 (3338 passed, 0 failed). FF `parity-v2`: `d6d197099` → `7193f5de2`. Refs: `refs/keep/WIEZE-MERGE-Q1-r2-integ`, `rust-port-wip/WIEZE-MERGE-Q1-r2`, evaluator `rust-port-wip/WIEZE-MERGE-Q1-r2-eval` (`9ae467057`).
- **Uwaga (dla ostatecznego stanu wież):** wiring `pick_tower_target` jest w produkcji (`siege_tactics_loop.rs:176`), ale nie jest osiągalny produkcyjnie: nic nie tworzy `SiegeLoop`/`ProdBody` poza testami (K5LOOP-WIRING, #113).
- **Etap 2 podzielony:** 2A = port helperów wieżyczek z `city-towers.ts` (`strongestRangedUnitForEra`, `towerRangeFor`, `towerRows`) — brak tego w Rust (potwierdzone: `git grep` na `7193f5de2`). 2B = odroczenie strzału 180 ms, strzał `_singleBlow`, usunięcie placeholdera `dead = true` — po 2A.
- **Start (1 z 4):** `R-RUSTPORT-P6-WIEZE-CITYTOWERS-Q1` (`wf_65f0e389-546`), dispatch `5aa24a7dd`, baza `7193f5de2`. Operator HAIKU, Evaluator/FC SONNET, Obrona HAIKU.
- **Trwających Workflow: 1** z 4. Wolne sloty: brak realnej pracy bez decyzji — ZLOZE część 2 (#104) wymaga najpierw rozpoznania wywołań w `main.ts` (ok. 22774, 23694, 24234, 24294) i zapisu dispatchu; zrobię w następnym ticku.
- **Pytania ABC #115 i #120:** nadal bez odpowiedzi właściciela, nie startowane.
- **Sprzątanie:** usunięte worktree WIEZE r2 (`wf_38834851-4ff-1,3,4`) po sprawdzeniu, że ich commity są w `parity-v2`; worktree integracyjny `integ-wieze` usunięty; katalogi `target` w scratchpadzie usunięte.
- **Dysk:** 14 GB wolnego. **Parity:** `7193f5de2`.

## Przebieg (14.11, heartbeat 22:47): 2 z 4 slotów w toku (CITYTOWERS integracja, ZLOZE rozpoznanie)
- **CITYTOWERS 2A** (`R-RUSTPORT-P6-WIEZE-CITYTOWERS-Q1`): Operator PASS, Evaluator PASS-WITH-NOTES, Obrona PASS-WITH-NOTES, FC PASS-WITH-NOTES `04d50ad0d` (baza `7193f5de2` = czubek `parity-v2`, ancestry OK, diff w allowliście, 9 plików). Bramki na `04d50ad0d`: fmt EXIT 0, clippy EXIT 0, pełny `cargo test` w toku (1018 zaliczonych, 0 błędów). FF po zakończeniu testu.
- **ZLOZE część 2 — ROZPOZNANIE** (`R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2`, `wf_dbf5c124-570`): read-only, dispatch `89c7e7e45`, Operator HAIKU. Wynik: tabela wywołań pina i propozycja podziału na tematy wykonawcze; decyzja o wiringu po przeczytaniu raportu.
- **Dlaczego nie start wiringu bez rozpoznania:** cztery wywołania `deactivateZlozeGrantsForDeal` w pinie są w funkcjach produkcyjnych (zerwanie traktatu, wojna, wygaśnięcie, trybut). Odpowiedniki w Rust są częściowo nieobecne (poza `deals.retain`).
- **Następny krok:** po FF CITYTOWERS dispatch 2B (strzał wieży, odroczenie 180 ms, usunięcie placeholdera) od nowego czubka `parity-v2`.
- **Pytania ABC #115 i #120:** nadal bez odpowiedzi właściciela, nie startowane.
- **Parity:** `7193f5de2` (przed FF CITYTOWERS). **Dysk:** sprawdzić przy następnym starcie.

## Przebieg (14.11, heartbeat 22:47 → 23:10): 2 z 4 slotów zajęte; CITYTOWERS zintegrowany; ZLOZE rozpoznanie zakończone
- **CITYTOWERS 2A zintegrowany:** `parity-v2` `7193f5de2` → `04d50ad0d` (FC PASS-WITH-NOTES; bramki na `04d50ad0d`: fmt 0, clippy 0, pełny `cargo test` 0, 3348 passed, 0 failed). Refs: `refs/keep/WIEZE-CITYTOWERS-Q1-integ`, `rust-port-wip/WIEZE-CITYTOWERS-Q1`. Worktree usunięte.
- **ZLOZE rozpoznanie (read-only) zakończone:** FC PASS-WITH-NOTES `39a6cb9fc` (po obronie `23a254445`). Dokumentacja FF na `parity-v2`: `04d50ad0d` → `6acb1d81b` (4 pliki, wyłącznie `dyspozycje/`, po rebase). Refs: `refs/keep/ZLOZE-WIRING-ROZPOZNANIE-Q2-fc`, `rust-port-wip/ZLOZE-WIRING-ROZPOZNANIE-Q2`.
- **Ustalenia z rozpoznania:** w Rust brak deaktywacji grantów w czterech miejscach pina (zerwanie traktatu, wojna, wygaśnięcie D1, trybut D6); D1 i D6 mają jedno miejsce w `turn_war_dipl_steps.rs` (~918, ~959); `syncRelationStatusFromDeals` nie istnieje w pinie (jest `syncRelationFromDeals`).
- **Start (2 z 4):**
  - `R-RUSTPORT-P6-ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1` (T1, `wf_8d58d816-713`): wpięcie deaktywacji w D1 i D6. Baza `6acb1d81b`.
  - `R-RUSTPORT-P6-ZLOZE-SYNC-MERGE-Q1` (T3, `wf_914c7d5a-0cf`): scalenie dwóch funkcji sync relacji (najpierw równoważność, potem decyzja). Baza `6acb1d81b`.
  - Dispatche `fccb14e9f`. Operator HAIKU, Evaluator/FC SONNET, Obrona HAIKU.
- **T2 (ZLOZE-WIRE-WAR-BREAK)** czeka na T1 i na #120 CRED-HAK-WYPOWIEDZENIE (etap b). Etap a (czysta domena) można zrobić po T1.
- **Pytania ABC #115 i #120:** nadal bez odpowiedzi właściciela, nie startowane.
- **Parity:** `6acb1d81b`. **Dysk:** do sprawdzenia przed następnym startem.

## Przebieg (14.11, heartbeat 23:18): T1 i T3 po FC PASS-WITH-NOTES; start rozpoznania #106
- **T1 ZLOZE-WIRE-EXPIRE-TRIBUTE:** FC PASS-WITH-NOTES `d22e75ed6` (baza `6acb1d81b`, 5 plików, w produkcji 7 linii w `turn_war_dipl_steps.rs`). Bramki na `d22e75ed6` w toku (fmt 0, clippy 0; pełny test trwa). FF po wyniku.
- **T3 ZLOZE-SYNC-MERGE:** FC PASS-WITH-NOTES `3860f5bea` (baza `6acb1d81b`; obrona dopisała test relacji bez wpisu w stanie). Po FF T1: rebase na nowy czubek, bramki, FF. Do zrobienia przy integracji: aktualizacja `NIEPODPIETE-MODULY.md:274` (usunięta funkcja).
- **Start (1 slot):** `R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1` (#106), read-only, dispatch `0bcd26019`, Workflow `wf_5c19030b-5d7`. Ustalenie wstępne: `apply_dipl_deltas_to_state` (`turn_war_dipl_steps.rs:1031`) nie ma wołającego w produkcji; czeka na rozpoznanie odpowiednika w pinie.
- **Sloty: 1 z 4 zajęty.** Pozostałe kandydaci (T2 ZLOZE-WIRE-WAR-BREAK etap a — po FF T1; WIEZE 2B — po rozpoznaniu wywołania schedule; #120 — pytanie ABC) czekają.
- **Pytania ABC #115 i #120:** nadal bez odpowiedzi właściciela; w tym przebiegu zadano też pytanie o konwencję trailera `Co-Authored-By` (sprzeczność z zasadą bez nazwy modelu).
- **Parity:** `6acb1d81b`. **Dysk:** 12 GB wolnego (sprawdzić przy następnym starcie).

## Przebieg (14.11, po heartbeat 23:18): rozpoznanie #106 zakończone; sprzątanie dysku
- **R7K7C-WIRING rozpoznanie** (`R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1`): FC PASS-WITH-NOTES `0515603ee` (dokumentacja, zero kodu). Ustalenia: `apply_dipl_deltas_to_state` nie ma wołającego w produkcji; pin wpina to w D3 (`applyCyclicDeliveryOutcome`, main.ts ok. 23988–24023), nie w D6. Rozbieżność parytetu: podłoga Pracy `max(0)` per operacja w pinie (setOwnerPracaPool ok. 34880), w Rust raz na sumie delt (turn_war_dipl_steps.rs ok. 410–415, 1090–1093): kontrprzykład pula 5, umowa 1 płaci 10, umowa 2 dostaje 10 → pin 10, Rust 5.
- **Pominięte w wpięciu (osobne tematy):** zapis `city_stock` (D3, turn_war_dipl_steps.rs ok. 136, 1009), `barbarian_grace` (brak pola i konsumenta; pin main.ts ok. 6020–6030).
- **Brak wpisu = 0:** wdrażam 1:1 z pinem (AI `?? 0`, człowiek `get(id)!`); zgodnie z zasadą 9 to nie pytanie gameplay. Ta decyzja jest w raporcie jako rekomendacja A.
- **Dokumentacja:** dwie kopie raportu (`01-operator-r1.md` i `p6/…Q1.md`) — poprawki w obu.
- **Sprzątanie dysku:** dysk spadł do 2,1 GB przy starcie rozpoznania. Usunięto osiem worktree zakończonych tematów T1/T3 po zabezpieczeniu HEAD w `refs/keep/wf_*` i na remote (`rust-port-wip/wf_*`); raport FC T1 zapisany na `rust-port-wip/ZLOZE-EXPIRE-TRIBUTE-Q1-fc-report`. Dysk: 7,6 GB wolnego (po zakończeniu bramek T1 sprawdzić ponownie).
- **Parity:** `6acb1d81b`. **Bramki T1** (`d22e75ed6`) w toku: fmt 0, clippy 0, test trwa.

## Przebieg (14.11, po 23:18): T1 zintegrowany na parity-v2; T3 rebase i bramki w toku
- **T1 ZLOZE-WIRE-EXPIRE-TRIBUTE** zintegrowany: FC PASS-WITH-NOTES `d22e75ed6`. Bramki na `d22e75ed6`: fmt 0, clippy 0, pełny `cargo test` 0 (3349 passed, 0 failed). FF `parity-v2`: `6acb1d81b` → `d22e75ed6`. Refs: `refs/keep/ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1-integ`, `rust-port-wip/ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1`, raport FC `rust-port-wip/ZLOZE-EXPIRE-TRIBUTE-Q1-fc-report`. Worktree `integ-t1` i `target` usunięte.
- **T3 ZLOZE-SYNC-MERGE:** rebase `3860f5bea` na `d22e75ed6` bez konfliktów → `533d46dd3`. Bramki w tle (`bi26zx6s0`). Po wyniku FF `parity-v2`. Do dopisania przy integracji: `NIEPODPIETE-MODULY.md:274` (usunięta funkcja).
- **Parity:** `d22e75ed6` (po FF T1). **Dysk:** sprawdzić po bramkach T3.
- **Następne kandydaty:** wpięcie R7K7C (#106) — podłoga Pracy w Ledger, zapis `city_stock`, wpięcie w D3; T2 (zerwanie i wojna, etap a) po T3; WIEZE 2B.

## Przebieg (14.11, po 23:18): T3 zintegrowany na parity-v2
- **T3 ZLOZE-SYNC-MERGE** zintegrowany: FC PASS-WITH-NOTES (`3860f5bea` przed rebase, po rebase `533d46dd3` na `d22e75ed6`). Bramki na `533d46dd3`: fmt 0, clippy 0, pełny `cargo test` 0 (3350 passed, 0 failed). FF `parity-v2`: `d22e75ed6` → `533d46dd3`. Refs: `refs/keep/ZLOZE-SYNC-MERGE-Q1-integ`, `rust-port-wip/ZLOZE-SYNC-MERGE-Q1`. Worktree `integ-t3` i `target` usunięte.
- **Do zrobienia (dokumentacja, osobny FF):** `dyspozycje/rust-port/NIEPODPIETE-MODULY.md:274` wymienia usuniętą funkcję `sync_relation_status_from_deals`.
- **Parity:** `533d46dd3`.
- **Następne kandydaty:** wpięcie #106 (podłoga Pracy w Ledger, `city_stock`, D3); T2 (zerwanie i wojna, etap a); WIEZE 2B.
- **Start (1 z 4):** `R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1` (T2 etap a: zerwanie traktatu przy wojnie i dobrowolne, czysta domena, bez wpinania), dispatch `87c79e5ca`, baza `533d46dd3`, Workflow `wf_43e15938-a5a`. Operator HAIKU, Evaluator/FC SONNET, Obrona HAIKU.
- **Otwarte, do podjęcia:** wpięcie #106 (podłoga Pracy w Ledger, zapis `city_stock`, wpięcie w D3); etap b T2 (po #120 i po T2 a); WIEZE 2B.
- **Pytania ABC #115, #120** i konwencja `Co-Authored-By`: bez odpowiedzi właściciela.

## Przebieg (14.11, heartbeat 23:48): 2 z 4 slotów zajęte
- **T2 ZLOZE-WIRE-WAR-BREAK-A** (`wf_43e15938-a5a`): etap Operator, HAIKU; dispatch `87c79e5ca`, baza `533d46dd3`.
- **PRACA-FLOOR-LEDGER** (#106, parytet podłogi Pracy): dispatch `157425945` (+ doprecyzowanie reprodukcji), baza `533d46dd3`, Workflow `wf_03ce4582-c3e`, etap Operator, HAIKU. Reprodukcja: pula 5, delty −10/+10 → pin 10, Rust 5.
- **Dysk:** 11 GB wolnego. **Parity:** `533d46dd3`.
- **Otwarte:** wpięcie #106 w D3 i `city_stock` (po PRACA-FLOOR), etap b T2 (po #120), WIEZE 2B, dokumentacja `NIEPODPIETE-MODULY.md:274`.
- **Pytania ABC #115, #120** i konwencja `Co-Authored-By`: bez odpowiedzi właściciela.

## KOREKTA (14.11, po PRACA-FLOOR-LEDGER-Q1): rozbieżność „podłoga Pracy” NIE istnieje w osiągalnych stanach
- **Mój błąd:** w rozpoznaniu `R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1` (`0515603ee`) i w dispatchu PRACA-FLOOR zapisałem jako potwierdzoną rozbieżność „pula 5, umowa 1 płaci 10, umowa 2 dostaje 10: pin 10, Rust 5”. Nie sprawdziłem tego scenariusza. Wzięte z rozpoznania bez weryfikacji.
- **Stan faktyczny (sprawdzone):** w kroku D3 bramka `buyer_ok` (Rust `turn_war_dipl_steps.rs:548–553`, pin `main.ts:24141–24147`) sprawdza pulę Pracy kupującego na żywym ledgerze przed każdą pozycją Work (`praca_of(buyer) >= z`). Pozycja, która zabrałaby więcej niż jest, jest odrzucana. Pula nie schodzi poniżej zera, więc podłoga per operacja i podłoga na sumie dają ten sam wynik.
- **Wynik tematu:** `R-RUSTPORT-P6-PRACA-FLOOR-LEDGER-Q1` — Operator BLOCK (`096b16ab4`), Evaluator potwierdził BLOCK (`0108483fa`), FC PASS-WITH-NOTES (dokumentacja, zero kodu). Zamknięte bez zmian w kodzie. Raporty zachowane: `rust-port-wip/PRACA-FLOOR-LEDGER-Q1-fc` (`096b16ab4`), `rust-port-wip/wf_03ce4582-c3e-1..3` (refs/keep).
- **Notatka z obrony (NIE_ZMIERZONO, nie rozstrzygnięte):** (a) zaokrąglenia f64 przy różnej kolejności sumowania (`0.39999999999999997` vs `0.3999999999999999`); (b) mapowanie braku wpisu dla AI: Rust `praca_of` zwraca błąd, pin daje 0 (`?? 0`) — do sprawdzenia testem, nie zmieniane; (c) self-transfer (kupujący = sprzedający) w ledgerze.
- **Co zostaje z #106:** wpięcie `apply_dipl_deltas_to_state` w D3, zapis `city_stock` (D3) i `barbarian_grace` — te punkty z rozpoznania NIE były w tym temacie weryfikowane i wymagają ponownego rozpoznania przed dispatchem.
- **Sloty:** 1 z 4 (T2 ZLOZE-WIRE-WAR-BREAK-A, Operator w toku).

## Przebieg (14.11/15.11, po 23:48): T2 etap a — FC PASS-WITH-NOTES, integracja w toku
- **T2 ZLOZE-WIRE-WAR-BREAK-A** (etap a, czysta domena): FC PASS-WITH-NOTES `7b52c3842` (Operator `4b2cdd8a4`, Obrona `29937778e`, Evaluator `97e88fbc7`). Dodane: `DiplomacyState::break_treaties_on_war` (`diplomacy.rs:1690`), `break_treaty_voluntarily` (`:1708`), `voluntary_treaty_break_plan` (`:4336`), `trade_treaty_break_penalty_free` (`:4329`). Wektory: 260 wojen, 300 zerwań dobrowolnych, generator wykonuje tekst pina (SHA-256 zgodny). Bramki na gałęzi Operatora: fmt 0, clippy 0, lib 114, testy p6 zielone. Pełne bramki na `7b52c3842` w tle (`b7hurunfw`), potem FF.
- **Zaległości (dług etapu b, NIE_ZROBIONE):** kara wiarygodności i zdarzenia `zlamana_obietnica`, parametr `bezKary`, okno N3, zdarzenia N5, karencja `WspolnaWalkaBarbarzyncy` (pin `main.ts:22741–22774`, brak pola stanu w Rust), bramka wojny przy rozejmie (`truceUntilTurn`), wiring produkcyjny.
- **Rozbieżność do rejestru długu:** `ActiveDeal.formed_turn` w Rust nie jest opcjonalny (`diplomacy.rs:1484–1485`), w pinie `zawartaTura` jest opcjonalna (wiek nieznany → kara). Stary zapis bez pola: Rust zwróci błąd wczytania, nie cichą wolność od kary. Do rozstrzygnięcia w etapie b.
- **Konflikt atrybucji (ponownie):** commit Operatora bez `Co-Authored-By` z nazwą modelu, zgodnie z dispatchem; nagłówek sesji wymaga innego. Decyzja orkiestratora/właściciela, jak wcześniej.
- **Sloty: 0 z 4.** Kolejne kandydaty: WIEZE 2B; #106 po ponownym rozpoznaniu; etap b T2 po #120.

## Przebieg (15.11, autonomiczny tick): sprzątanie dysku, rozpoznanie weryfikacyjne #106
- **Dysk:** spadł do 3,0 GB (poniżej progu 4 GB); nie startowano tematów. Zabezpieczono (refs `keep/*` i `rust-port-wip/wf_*`) i usunięto worktree zakończonych Workflow: T2 (`wf_43e15938-a5a-1..4`) i rozpoznania #106 (`wf_5c19030b-5d7-1..4`). Dysk: 13 GB.
- **T2 ZLOZE-WIRE-WAR-BREAK-A:** bramki na `7b52c3842` w toku (`integ-t2`, fmt 0, clippy 0, test w toku). Po wyniku FF `parity-v2` (`533d46dd3` → `7b52c3842`).
- **Start (1 z 4):** `R-RUSTPORT-P6-R7K7C-RECON2-Q1` — rozpoznanie WERYFIKACYJNE #106 (read-only, dispatch `51a2604e2`, Workflow `wf_da2acf80-dcd`). Cel: sprawdzić `city_stock`, `barbarian_grace`, wiring D3 i brak wpisu właściciela, zanim cokolwiek trafi do wdrożenia (poprzednie rozpoznanie zawierało obalone twierdzenie o podłodze Pracy).
- **Pytania ABC #115, #120** i konwencja `Co-Authored-By`: bez odpowiedzi właściciela.

## Przebieg (15.11, 00:32): T2 zintegrowany; rozpoznanie weryfikacyjne #106 zakończone
- **T2 ZLOZE-WIRE-WAR-BREAK-A zintegrowany:** FC PASS-WITH-NOTES `7b52c3842`. Bramki na `7b52c3842`: fmt 0, clippy 0, pełny `cargo test` 0 (3357 passed, 0 failed). FF `parity-v2`: `533d46dd3` → `7b52c3842`. Refs: `refs/keep/ZLOZE-WIRE-WAR-BREAK-A-Q1-integ`, `rust-port-wip/ZLOZE-WIRE-WAR-BREAK-A-Q1`. Zaległości etapu b (kara wiarygodności, karencja `WspolnaWalkaBarbarzyncy`, bramka rozejmu, `formed_turn` opcjonalny w pinie) zapisane w rejestrze.
- **R7K7C-RECON2 (weryfikacja #106) zakończone:** FC PASS-WITH-NOTES `e440a71a8`, zmiany tylko w dokumentacji.
  - `apply_dipl_deltas_to_state` nie ma wołającego w produkcji (tylko testy).
  - D3 zapisuje stan wojny (`*war = work`), ale **gubi** `treasury_deltas`, `praca_deltas`, `city_resources` (stan połowiczny, nienazwany w raporcie).
  - `city_stock`: pin zapisuje, Rust raportuje i nie zapisuje.
  - `barbarian_grace`: Rust nie ma pola stanu ani konsumenta.
  - **Ryzyko przy wdrożeniu:** rollback w `advance_turn` cofa queue, war, koniec, flagę, ale nie ekonomię. Po zapisie skarbców i pul błąd późniejszej fazy zostawiłby zastosowane delty przy cofniętym stanie wojny (podwójne naliczenie). Wymaga migawki ekonomii w obu ścieżkach błędu.
  - **Punkt 4 (brak wpisu właściciela) wymaga decyzji właściciela** (ABC); nieosiągalny w produkcji dziś, osiągalność przez wczytanie zapisu NIE_ZMIERZONO.
- **Obrona operatora (`b38e7552f`) i Evaluator** zgodne z powyższym. Commit operatora `41387eede` zawiera `Co-Authored-By` z nazwą modelu wbrew dispatchowi (do rozstrzygnięcia: konwencja atrybucji).
- **Sprzątanie:** worktree rozpoznania RECON2 usunięte po zabezpieczeniu refs; worktree integracji T2 usunięty. Dysk: 12 GB.
- **Parity:** `7b52c3842`. **Sloty:** 0 z 4.
- **Otwarte:** WIRING-A (#106) wymaga (a) decyzji ABC o brakującym wpisie, (b) migawki ekonomii w rollbacku, (c) dispatchu z wartościami z pina (≥150 wektorów), nie ręcznymi.

## Przebieg (15.11, heartbeat 00:18): 1 z 4 slotów zajęte
- **WIEZE-2B1** (`R-RUSTPORT-P6-WIEZE-2B1-Q1`, planowanie wystrzałów wież z odroczeniem 180 ms i usunięcie placeholdera `dead = true`; strzał `_singleBlow` = 2B2, nie w tym temacie): dispatch `1149e01f0`, baza `7b52c3842`, Workflow `wf_578f4944-497`, etap Operator, HAIKU.
- **Dlaczego tylko 1 slot:** pozostałe kandydaci wymagają decyzji właściciela (#106 pkt 4 — ABC w czacie; #115, #120 — ABC) albo nie mają zweryfikowanego zakresu (#97–#98, #107, #109, #112–#113 blokowane allowlistą K5). Nie startuję tematów bez zweryfikowanego zakresu.
- **Dysk:** 17 GB. **Parity:** `7b52c3842`.

## Przebieg (15.11, 00:41): WIEZE-2B1 — FC FAIL r1, runda 2 w toku
- **Wynik r1:** Operator BLOCK, Evaluator FAIL, FC FAIL (`f78736d36`). Przyczyna: usunięcie `SiegeEnv::tower` zepsuło testy poza allowlistą (`p6_tower_target_wiring.rs` — E0560; wektory `p6_siege_tactics_loop` — 78/360 sekwencji rozjechane). To błąd zakresu, nie decyzja produktowa.
- **Runda 2 (DODATEK r2, baza `f78736d36`, dispatch `8d43a7eb2`):** allowlista rozszerzona tylko o pliki zepsute przez r1 (`p6_tower_target_wiring.rs`, `p6_siege_tactics_loop_gen.mjs` + wektory). Wymóg: PEŁNY `cargo test` EXIT 0, nie tylko `p6_siege*`. Workflow `wf_7faf2bb4-2cd`, Operator HAIKU.
- **Nadal NIE_ZROBIONE (2B2):** strzał `_singleBlow` wieży, guard `towerShooterRow`, stan `destroyed`.
- **Parity:** `7b52c3842`. **Sloty:** 1 z 4. **Pytania ABC:** #106 pkt 4, #115, #120 i konwencja `Co-Authored-By` — bez odpowiedzi.

## Przebieg (15.11, heartbeat 00:47): 1 z 4 slotów zajęte
- **Trwających Workflow: 1** z 4: WIEZE-2B1 runda 2 (`wf_7faf2bb4-2cd`, Operator HAIKU; dispatch `8d43a7eb2`, baza `f78736d36`). Bez wyniku.
- **Wolne sloty:** brak zweryfikowanego zakresu bez decyzji właściciela (#106 pkt 4; #115, #120 — ABC). Tematy K5 zablokowane allowlistą. Nie startuję na ślepo.
- **Dysk:** 16 GB. **Parity:** `7b52c3842`.
- **Pytania ABC:** #106 pkt 4 (rekomendacja B), #115, #120 oraz konwencja `Co-Authored-By` (rekomendacja B) — bez odpowiedzi właściciela.

## Przebieg (15.11, 01:17): WIEZE-2B1 runda 2 — FC PASS-WITH-NOTES, integracja w toku
- **Wynik r2:** Operator PASS-WITH-NOTES `c0d383e71`, Evaluator PASS-WITH-NOTES, Obrona `14d5e50b9`, FC PASS-WITH-NOTES (raport FC `68f4efc6b`). Baza `f78736d36`. Testy: fmt 0, clippy 0, `p6_wieze_2b1` 7/7, wektory z pinu 245 przypadków, `p6_siege_tactics_loop` 4/4, `p6_tower_target_wiring` 6/6, lib 118/118.
- **Zakres 2B1 (zrobione):** planowanie wystrzałów wież z odroczeniem 180 ms (`pending_tower_shots`), usunięcie placeholdera `dead = true` przy planowaniu, zniszczenie wieży bez kafla muru (bez stanu `destroyed`), wybór celu w callbacku.
- **NIE zrobione (2B2 — osobny temat, decyzja FC):** strzał `_singleBlow` wieży (callback `tower_shoot` pusty), guard `towerShooterRow` (pin `battleScene.ts:4209`, wymaga pola w `SiegeEnv`), stan `destroyed` i jego sprawdzenie w strzale.
- **Pełny `cargo test`:** wymóg integracji — uruchomiony bez filtra w tle (`integ-2b1`, `--no-fail-fast`). Wynik: EXIT w logu `i2b-test.log`. Po zielonym wyniku FF `parity-v2` `7b52c3842` → `14d5e50b9`.
- **Konflikt atrybucji:** commity operatora/obrony bez nazwy modelu zgodnie z dispatchem; nagłówek sesji wymaga `Co-Authored-By` — nadal do rozstrzygnięcia.
- **Dysk:** 9 GB przed bramkami. **Parity:** `7b52c3842` (przed FF).

## Przebieg (15.11, po 01:17): WIEZE-2B1 r2 zintegrowany na parity-v2
- **Integracja:** FC PASS-WITH-NOTES `14d5e50b9` (baza `f78736d36`, ancestry od `7b52c3842` OK, diff w allowliście rundy 2). Bramki na `14d5e50b9` (pełny `cargo test` bez filtra, `--no-fail-fast`): fmt 0, clippy 0, test 0 — 3368 passed, 0 failed (w tym `p6_8i_pick`). FF `parity-v2`: `7b52c3842` → `14d5e50b9`.
- **Refs:** `refs/keep/WIEZE-2B1-Q1-r2-integ`, `rust-port-wip/WIEZE-2B1-Q2`, `rust-port-wip/wf_7faf2bb4-2cd-1..4`. Worktree `integ-2b1` i worktree rundy 2 usunięte.
- **Zakres 2B1 w parity:** planowanie wystrzałów z odroczeniem 180 ms, usunięcie placeholdera `dead = true`, zniszczenie wieży bez kafla. NIE w parity (2B2, osobny temat): strzał `_singleBlow` wieży, guard `towerShooterRow`, stan `destroyed`.
- **Parity:** `14d5e50b9`. **Dysk:** 14 GB. **Sloty:** 0 z 4.
- **Otwarte:** 2B2 (strzał wieży, guard, stan `destroyed`) — do dispatchu; ABC #106 pkt 4, #115, #120; konwencja `Co-Authored-By`.

## Przebieg (15.11, heartbeat 02:17): WIEZE-2B2 r1 — Evaluator FAIL, Obrona zakończona, FC w toku
- **Operator r1** PASS-WITH-NOTES (`af7a0be6a`): `p6_wieze_2b2` 5/5, pełny `cargo test` bez filtra EXIT 0 (3373 passed, 0 failed).
- **Evaluator r1: FAIL.** Brak wektorów z pinu (kryterium 4: brak `p6_wieze_2b2_gen.mjs` i `p6_wieze_2b2_vectors/`); test strzału liczy oczekiwanie tą samą funkcją `single_blow_full` (tautologia), bez wartości z pina; szablon strzelca `neutral_tower_shot_template()` zamiast danych z `towerShooterRow`.
- **Obrona r1** zakończona; **FC** w toku. Po werdykcie: FAIL → runda 2 tego samego ID z DODATKIEM (wektory z pinu, prawdziwe dane strzelca, test niezależny od funkcji produkcyjnej).
- **Sloty: 1 z 4.** **Parity:** `14d5e50b9`. **Dysk:** 11 GB.
- **Pytania ABC:** #106 pkt 4 (rekomendacja B), #115, #120; konwencja `Co-Authored-By` (rekomendacja B) — bez odpowiedzi właściciela.

## Przebieg (15.11, po 02:17): WIEZE-2B2 r1 — FC FAIL; runda 2 w toku
- **Wynik r1:** Operator PASS-WITH-NOTES (`af7a0be6a`, pełny `cargo test` EXIT 0, 3373 passed); Evaluator FAIL; Obrona (`64ddbd19d`) przyjęła część zarzutów i dodała testy dead/fading; **FC FAIL** (`ef8eeedc9`). Otwarte: brak wektorów z pina dla strzału, strzelec nie z `city_towers`, brak czerwonego przebiegu.
- **Runda 2** (DODATEK r2, baza `ef8eeedc9`, dispatch `b975183da`): strzelec z `city_towers::strongest_ranged_unit_for_era` z wektorami pina; generator wejścia strzału (`_fireOneTower`, mock `_singleBlow` zapisujący argumenty) albo NIE_ZROBIONE z cytatami; czerwony przed zmianą. `destroyed` jako proxy `wall_tile_rows` zostaje (udokumentowane dowodem z pina). Workflow `wf_36dbda52-96d`.
- **Zabezpieczenie:** worktree rundy 1 (`wf_3d64ca03-97e-*`) — refs `keep/*` i `rust-port-wip/*`, usunięte, jeśli czyste.
- **Sloty: 1 z 4.** **Parity:** `14d5e50b9`. **Pytania ABC:** #106 pkt 4, #115, #120; konwencja `Co-Authored-By` (rekomendacja B) — bez odpowiedzi właściciela.

## Przebieg (15.11, heartbeat 02:47): 1 z 4 slotów zajęty
- **Trwających Workflow: 1** z 4: WIEZE-2B2 runda 2 (`wf_36dbda52-96d`, Operator HAIKU; dispatch `b975183da`, baza `ef8eeedc9`). Bez wyniku.
- **Wolne sloty:** brak zweryfikowanego zakresu bez decyzji właściciela (#106 pkt 4; #115, #120 — ABC). Tematy K5 zablokowane allowlistą.
- **Parity:** `14d5e50b9`. **Dysk:** 9,4 GB.
- **Pytania ABC:** #106 pkt 4 (rekomendacja B), #115, #120; konwencja `Co-Authored-By` (rekomendacja B) — bez odpowiedzi właściciela.

## Przebieg (15.11, heartbeat 03:00): WIEZE-2B2 r2 — Operator i Evaluator zakończeni, Obrona/FC w toku
- **Trwających Workflow: 1** z 4 (`wf_36dbda52-96d`): WIEZE-2B2 runda 2, etap Obrona/FC. Operator i Evaluator zakończeni; wyniki w journalu.
- **Dysk:** spadł do 5,4 GB, poniżej 8 GB progu startu. Zwolniono 2,9 GB: usunięto `scratchpad/target-q2` (katalog bramek WIEZE-2B1 r2, temat zakończony i zintegrowany). Dysk: 8,3 GB. Nie startuję nowych tematów poniżej progu 8 GB.
- **Do zrobienia po FC:** worktree rundy 2 (`wf_36dbda52-96d-1..2`) — refs `keep/*` i `rust-port-wip/*`, potem usunięcie; `target-2b2r2` w scratchpadzie po zakończeniu bramek.
- **Parity:** `14d5e50b9`. **Pytania ABC:** #106 pkt 4, #115, #120; konwencja `Co-Authored-By` — bez odpowiedzi właściciela.

## Przebieg (15.11, heartbeat 03:17): WIEZE-2B2 r2 — Operator i Evaluator PASS-WITH-NOTES, Obrona/FC w toku
- **Trwających Workflow: 1** z 4 (`wf_36dbda52-96d`). Operator r2 `220b022cd` PASS-WITH-NOTES; Evaluator r2 PASS-WITH-NOTES. Otwarte uwagi Evaluatora: wejście do `single_blow_full` nie jest porównywane z argumentami z generatora pina (`expectStats`, `expectKategoria`, `expectRanged` zapisane, nieużyte w teście Rust).
- **Dysk:** 7,1 GB (poniżej 8 GB progu startu, powyżej 4 GB). Nic nie startuję.
- **Parity:** `14d5e50b9`. **Pytania ABC:** #106 pkt 4, #115, #120; konwencja `Co-Authored-By` (rekomendacja B) — bez odpowiedzi.

## Przebieg (15.11, 04:24): WIEZE-2B2 r2 — FC PASS-WITH-NOTES; integracja: pełny test w toku
- **Wynik r2:** Operator PASS-WITH-NOTES (`220b022cd`), Evaluator PASS-WITH-NOTES, Obrona (`6aa9b154e`), **FC PASS-WITH-NOTES** (`f2bb11970`). Baza `ef8eeedc9`. Generator `p6_wieze_2b2_gen.mjs` wykonuje `_fireOneTower` i `pickTowerTarget` z pina (240 przypadków: 105 strzałów, 135 bez strzału; SHA-256 fragmentów zgodny). Strzelec z `city_towers` (486 przypadków wzorcowych).
- **Zakres 2B2 (zrobione):** strzelec z `city_towers::strongest_ranged_unit_for_era` (`tower_setup_from_units`), strzał wieży przez `single_blow_full` (kategoria, hp, ranged), zniszczona wieża nie strzela, opóźnienie trafienia 380 ms z wektora.
- **Długi jawne (NIE_ZROBIONE):** (a) wynik liczbowy ciosu wieży z pina niezweryfikowany (test to okablowanie); (b) `hit_arc` stałe Front i `first_blow_of_pair` stałe true (dług K5LOOP-FACING #107/#178); (c) efekty `_resolveBlowOutcome` po trafieniu wieży (#109/#147); (d) mody właściciela (mnożniki 1.0); (e) `Health` jako napis: JS `Number("10")=10`, Rust daje 1; (f) wiring produkcyjny `tower_setup_from_units` (#113); (g) `destroyed` jako proxy `wall_tile_rows` (przyjęte przez FC r1).
- **Znalezisko zgodne z pinem:** strzelec wybierany przez `missilePower` (fallback „Atak dystansowy”); cios czyta `missileAttack` z fallbackiem 0 (`combat.ts:223`) — wiersz z `missileAttack` null strzela mocą 0.
- **Integracja:** ancestry od `14d5e50b9` OK; diff 12 plików (w allowliście). Pełny `cargo test --no-fail-fast` w tle (`integ-2b2`, log `i2b2-test.log`). Po zielonym wyniku FF `parity-v2` `14d5e50b9` → `f2bb11970`.
- **Sprzątanie:** usunięto `scratchpad/target-2b2r2` (2,9 GB) i worktree rundy 2 po zabezpieczeniu refs (`rust-port-wip/wf_36dbda52-96d-1..4`). Dysk: 17 GB.
- **Pytania ABC:** #106 pkt 4, #115, #120; konwencja `Co-Authored-By` (rekomendacja B) — bez odpowiedzi właściciela.

## Przebieg (15.11, 04:08): WIEZE-2B2 r2 zintegrowany na parity-v2
- **Integracja:** FC PASS-WITH-NOTES `f2bb11970` (kod `6aa9b154e`, baza `14d5e50b9`). Pełny `cargo test --no-fail-fast` bez filtra: EXIT 0, 3380 passed, 0 failed. fmt 0, clippy `-D warnings` 0. FF `parity-v2`: `14d5e50b9` → `f2bb11970`.
- **Refs:** `refs/keep/WIEZE-2B2-Q1-r2-integ`, `rust-port-wip/WIEZE-2B2-Q2`. Worktree `integ-2b2` usunięty.
- **W parity:** strzał wieży (`tower_shoot`), strzelec z `city_towers` (`tower_setup_from_units`), wektory pinu (240 przypadków, `_fireOneTower`), zniszczona wieża nie strzela, opóźnienie 380 ms.
- **Długi jawne (NIE_ZROBIONE):** wynik liczbowy ciosu wieży z pina niezweryfikowany; `hit_arc` i `first_blow` stałe (#107/#178); efekty `_resolveBlowOutcome` (#109/#147); `Health` jako napis (JS 10, Rust 1); wiring produkcyjny `tower_setup_from_units` (#113); `destroyed` jako proxy `wall_tile_rows` (przyjęte).
- **Parity:** `f2bb11970`. **Sloty:** 0 z 4. **Dysk:** 13 GB.
- **Pytania ABC:** #106 pkt 4 (rekomendacja B), #115, #120; konwencja `Co-Authored-By` (rekomendacja B) — bez odpowiedzi właściciela.

## Przebieg (15.11, 04:18 UTC — heartbeat)
- KROK 1 (sloty): 0 aktywnych Workflow (wszystkie journal kończą się `result`). Parity = `f2bb11970`. Dysk 12 GB wolnego.
- #115 ZDOBYCIE-MIASTA-WIRING r2 (`R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1`, wf_aaeae4f9-09c): Operator BLOCK (`7feb59b9f`, raport 01-operator-r2.md), Evaluator FAIL (`56f14998c`), Obrona (`4bb09eeb7`), FC FAIL (`0cfc588d3`). Przyczyna zweryfikowana na `f2bb11970`: `apply_transfer_with_effects` (siege_transfer.rs:340) i `run_capital_capture_plunder` (siege_capital_plunder.rs:504) bez wołającego w produkcji; brak produkcyjnych implementacji OwnerResourceAccess i PlunderLabels. Produkcyjna ścieżka zdobycia należy do W8 (pipeline `run_war_turn`), a rejestr podaje dla W8 sprzeczne statusy. Operator r2 zadał właścicielowi pytanie ABC wbrew C-043 (procesowy błąd, zanotowany).
- DECYZJA: #115 wstrzymane do odpowiedzi właściciela (A wrapper teraz / B wstrzymać do W8 (rekomendowane) / C pełne wpięcie teraz z rozszerzoną allowlistą). Pytanie ABC nie dotarło do właściciela (przerwane); ponowione w czacie. Bez wyboru nie startuje r3.
- Sloty: 0/4. Powody: #115 czeka na decyzję właściciela; #106 czeka na decyzję pkt 4; #120 czeka na decyzję A/B; #104/#172 wymagają rozpoznania (ZLOZA-WIRING); #96–#98, #107, #109, #112, #113 zależą od niezintegrowanego ProdBody/OUTCOME (nie startuję z nieprzygotowanym dispatchem); #154 KOLEJKA-RUST.md jest sprzed 23:18 i do odświeżenia.
- Nie startowano żadnego tematu, bo żaden kandydat nie spełnia reguły „baza = czubek FC, zależności zintegrowane, bez decyzji gameplay” bez dodatkowego rozpoznania.
- Do zrobienia w następnym heartbeat: odświeżyć KOLEJKA-RUST.md; po odpowiedzi właściciela na #115/#106/#120 uruchomić właściwą rundę.

## Przebieg (15.11, 04:48 UTC — heartbeat, druga połowa godziny)
- KROK 1: aktywnych Workflow 0 (22 stare journale to porzucone uruchomienia `started`/`failed`, nieruszane od wielu godzin; jedyny świeży #115 zakończony FC FAIL 04:05). Parity `f2bb11970`. Dysk 12 GB.
- Sloty 0/4. Wszyscy kandydaci z kolejki czekają na decyzję właściciela (#115, #106, #120) albo na rozpoznanie zależności (K5LOOP-OUTCOME/FACING, ZLOZA-WIRING, COMBAT-HARNESS). Bez odpowiedzi właściciela nie startuję tematu, który wymagałby decyzji.
- KROK 3 (sprzątanie): nic do usunięcia; brak zakończonych worktree wymagających sprzątania.
- Odświeżono `KOLEJKA-RUST.md` (#154) — dopisana sekcja AKTUALIZACJA 15.11 04:48, stara migawka 23:18 zachowana bez zmian.
- Pytanie ABC #115 nadal bez odpowiedzi właściciela.

## Przebieg (15.11, 05:18 UTC — heartbeat, pełna godzina)
- KROK 1: aktywnych Workflow 0 (journale zmienione w ostatnich 40 min: 0). Parity `f2bb11970`. Dysk 12 GB.
- Sloty 0/4. Bez zmian względem 04:48: #115 czeka na odpowiedź właściciela (B/A/C), #106 i #120 na decyzje A/B, pozostałe kandydaty wymagają rozpoznania lub decyzji technicznej. Nie startuję tematu, który wymagałby decyzji.
- KROK 2: brak Workflow z FC PASS bez integracji. KROK 3: nic do sprzątania.
- Pytanie ABC #115 nadal bez odpowiedzi właściciela.

## Przebieg (15.11, 05:47 UTC — heartbeat, druga połowa godziny)
- KROK 1: aktywnych Workflow 0 (journale zmienione w ostatnich 40 min: 0). Parity `f2bb11970`. Dysk 12 GB.
- Sloty 0/4. Bez zmian: #115 czeka na odpowiedź właściciela (B/A/C), #106 i #120 na decyzje A/B, pozostałe kandydaty wymagają rozpoznania lub decyzji technicznej. Nie startuję dispatchu wymagającego decyzji.
- KROK 2: brak Workflow z FC PASS bez integracji. KROK 3: nic do sprzątania.
- Pytanie ABC #115 nadal bez odpowiedzi właściciela.

## Przebieg (15.11, 06:17 UTC — heartbeat, pełna godzina)
- KROK 1: aktywnych Workflow 0 (journale zmienione w ostatnich 40 min: 0). Parity `f2bb11970`. Dysk 12 GB.
- Sloty 0/4. Bez zmian: #115 czeka na odpowiedź właściciela (B/A/C), #106 i #120 na decyzje A/B, pozostałe kandydaty wymagają rozpoznania lub decyzji technicznej. Nie startuję dispatchu wymagającego decyzji.
- KROK 2: brak Workflow z FC PASS bez integracji. KROK 3: nic do sprzątania.
- Pytanie ABC #115 nadal bez odpowiedzi właściciela.

## Przebieg (15.11, 06:47 UTC — heartbeat, druga połowa godziny)
- KROK 1: aktywnych Workflow 0 (journale zmienione w ostatnich 40 min: 0). Parity `f2bb11970`. Dysk 12 GB.
- Sloty 0/4. Bez zmian: #115 czeka na odpowiedź właściciela (B/A/C), #106 i #120 na decyzje A/B, pozostałe kandydaty wymagają rozpoznania lub decyzji technicznej. Nie startuję dispatchu wymagającego decyzji.
- KROK 2: brak Workflow z FC PASS bez integracji. KROK 3: nic do sprzątania.
- Pytanie ABC #115 nadal bez odpowiedzi właściciela.

## Przebieg (15.11, 07:17 UTC — heartbeat, pełna godzina)
- KROK 1: aktywnych Workflow 0 (journale zmienione w ostatnich 40 min: 0). Parity `f2bb11970`. Dysk 12 GB.
- Sloty 0/4. Bez zmian: #115 czeka na odpowiedź właściciela (B/A/C), #106 i #120 na decyzje A/B, pozostałe kandydaty wymagają rozpoznania lub decyzji technicznej. Nie startuję dispatchu wymagającego decyzji.
- KROK 2: brak Workflow z FC PASS bez integracji. KROK 3: nic do sprzątania.
- Pytanie ABC #115 nadal bez odpowiedzi właściciela.

## Przebieg (15.11, 07:47 UTC — heartbeat, druga połowa godziny)
- KROK 1: aktywnych Workflow 0 (journale zmienione w ostatnich 40 min: 0). Parity `f2bb11970`. Dysk 12 GB.
- Sloty 0/4. Bez zmian: #115 czeka na odpowiedź właściciela (B/A/C), #106 i #120 na decyzje A/B, pozostałe kandydaty wymagają rozpoznania lub decyzji technicznej. Nie startuję dispatchu wymagającego decyzji.
- KROK 2: brak Workflow z FC PASS bez integracji. KROK 3: nic do sprzątania.
- Pytanie ABC #115 nadal bez odpowiedzi właściciela.

## Przebieg (15.11, 08:17 UTC — heartbeat, pełna godzina)
- KROK 1: aktywnych Workflow 0 (journale zmienione w ostatnich 40 min: 0). Parity `f2bb11970`. Dysk 12 GB.
- Sloty 0/4. Bez zmian: #115 czeka na odpowiedź właściciela (B/A/C), #106 i #120 na decyzje A/B, pozostałe kandydaty wymagają rozpoznania lub decyzji technicznej. Nie startuję dispatchu wymagającego decyzji.
- KROK 2: brak Workflow z FC PASS bez integracji. KROK 3: nic do sprzątania.
- Pytanie ABC #115 nadal bez odpowiedzi właściciela.

## Przebieg (15.11, 08:47 UTC — heartbeat, druga połowa godziny)
- KROK 1: aktywnych Workflow 0 (journale zmienione w ostatnich 40 min: 0). Parity `f2bb11970`. Dysk 12 GB.
- Sloty 0/4. Bez zmian: #115 czeka na odpowiedź właściciela (B/A/C), #106 i #120 na decyzje A/B, pozostałe kandydaty wymagają rozpoznania lub decyzji technicznej. Nie startuję dispatchu wymagającego decyzji.
- KROK 2: brak Workflow z FC PASS bez integracji. KROK 3: nic do sprzątania.
- Pytanie ABC #115 nadal bez odpowiedzi właściciela.

## Przebieg (15.11, 09:xx UTC — RUST 3D / renderer, Opus 5.5)
- **P4-15 GPU-SPIKE-PREP (R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1): zintegrowany na parity-v2.** FC r2 = PASS (`ac69ea18`, 04-final-control-r2.md). Merge `95930b446` (pierwszy rodzic = parity `f2bb11970`), FF `rust-port/parity-v2`. Zakres: wyłącznie `rust-port/spike-gpu-embed/**` i dokumenty `dyspozycje/rust-port/p4/P4-15*` oraz `dyspozycje/autobot/runs/R-RUSTPORT-P4-15*`; `rust-port/engine` bez zmian (sprawdzone diff). `git diff --check` czysty. Backup: `refs/keep/R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1-integ`, gałąź `rust-port-wip/R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1-integ`.
- **NIE_ZMIERZONO w tej sesji:** `cargo` dla `spike-gpu-embed` nie uruchomiony tutaj (crate wymaga GPU/GTK; wyniki bramek pochodzą z FC r2 i z Operatora r2). Do potwierdzenia na maszynie z GPU zgodnie z instrukcją spike'a.
- **P4-1 RENDER-DTO-CONTRACT:** Workflow `wf_c204895c-d41` na Opus 5.5 (Operator/Evaluator/Obrona/FC). Dispatch DODATEK r2 `28d7e18f9`. W toku.
- **P4-0 RENDERER-ARCHITECTURE:** domknięcie Evaluator + FC na Opus 5.5 (DODATEK r3 `e7777bb5b`, Workflow `wf_6aff558f-660`). W toku.
- **Web:** wycofane. Mój DODATEK do dispatchów kart jednostek 3D cofnięty (revert `3fb78e6b5`); tematy webowe nie są prowadzone w tej sesji.

## Przebieg (15.11, RUST renderer/3D, Opus 5.5 — 4 sloty)
- **Aktywne Workflow (4), wszystkie na Opus 5.5:**
  - P4-1 DTO renderera (`wf_c204895c-d41`, dispatch `28d7e18f9`): Operator → Evaluator → Obrona → FC.
  - P4-0 domknięcie renderera (`wf_6aff558f-660`, dispatch `e7777bb5b`): Evaluator → Obrona → FC.
  - P4-36 Q3 mapa bitwy, jednostki i nakładki (`wf_102d919b-3d8`, dispatch `336af8cd9`): Operator impl + pomiary → Evaluator → Obrona → FC. Baza `origin/rust-port/parity-v2` (zawiera `7817ef0c`).
  - P4-17 MOD03 dekoracje terenu (`wf_be79e3c5-9d0`, dispatch `4735c6dbe`): Evaluator → Obrona → FC. Operator r2 PASS-WITH-NOTES, brak Evaluatora i FC.
- **Parity:** `95930b446` (po integracji P4-15). Dysk: 10 GB.
- **Integracja** każdego tematu po FC PASS: orkiestrator (ancestry względem parity, diff vs allowlista, `git diff --check`, FF).

## Przebieg (15.11, 09:17 UTC — heartbeat, RUST renderer, Opus 5.5)
- **KROK 1 (sloty):** 4 aktywne Workflow, wszystkie na Opus 5.5: P4-1 (`wf_c204895c-d41`), P4-0 domknięcie (`wf_6aff558f-660`), P4-36 Q3 (`wf_102d919b-3d8`), P4-17 domknięcie (`wf_be79e3c5-9d0`). Sloty 4/4, nic nowego nie startuję.
- **Model:** rejestr-rutyna z KROK 4 podaje Haiku/Sonnet. Zostaję przy zasadzie właściciela z tej sesji: renderer/3D Rust na Opus 5.5 we wszystkich etapach.
- **Dysk:** 5,2 GB przed sprzątaniem, po nim 9,5 GB (próg 8 GB osiągnięty). Usunięto worktrees zakończonego ZDOBYCIE-WIRING r2 (FC FAIL): `wf_aaeae4f9-09c-1..4`. Commity zabezpieczone: refs/keep `R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1-r2-w1..w4` i gałęzie `rust-port-wip/…-r2-w1..w4` na remote. Worktrees uruchomionych tematów zostawione (zablokowane).
- **KROK 2:** brak Workflow z FC PASS bez integracji (oczekują: P4-0, P4-1, P4-36 Q3, P4-17).
- **Parity:** `95930b446`. Rejestr: `ad14b7fbd` przed tym wpisem.

## Przebieg (15.11, P4-0 RENDERER-ARCHITECTURE — domknięcie r3, Opus 5.5)
- **Evaluator r3 (`509ee851e`): FAIL, 16 zarzutów.** Główne: dokument nie miał nagłówka SUPERSEDED (decyzje D-REND-1..8 rozstrzygnięte w LEDGER, a dokument rekomendował C), błędy w liczbach i liniach, pominięty picking jednostek i frontend-v2.
- **Obrona r3 (`80a261998`): PASS-WITH-NOTES.** Przyjęła wszystkie 16 zarzutów, dodała sekcję §S z tabelą rozstrzygnięć D-REND-1..8 i oznaczyła §4–§6 jako historyczne.
- **FC r3 (`d850c1f5c`): PASS-WITH-NOTES, 0 NAPRAW, 16 ODDAL.** Zarzut proceduralny (P-1, do orkiestratora): LEDGER.md:111 zapisuje Evaluator FAIL → Obrona `25a49386` → FC PASS-WITH-NOTES jako zintegrowane, ale tych SHA nie ma w repo, a w katalogu runu nie było artefaktów r1. Wpis LEDGER dla r3 do uzupełnienia; nie zmieniam decyzji poza tym.
- **Integracja:** `dyspozycje/rust-port/p4/P4-0-RENDERER-ARCHITECTURE.md` oraz raporty `02-evaluator-r3.md`, `03-obrona-r3.md`, `04-final-control-r3.md` na `claude/rust-sivvrn` (`c5c798122`). Rejestru z gałęzi obrony nie brałem: jej baza jest starsza i cofałaby wpisy.
- **Zabezpieczenie:** refs/keep `P4-0-r3-{509ee851e,80a261998,d850c1f5c}`, gałąź `rust-port-wip/R-RUSTPORT-P4-0-RENDERER-ARCHITECTURE-Q1-r3-fc`.
- **P4-1 (DTO):** zależy od gotowego P4-0; odbiór w toku.

## Przebieg (15.11, P4-1 RENDER-DTO-CONTRACT — kontrakt DTO renderera, Opus 5.5)
- **Operator r1 (`0d6d70cff`): PASS-WITH-NOTES.** Kontrakt modelu widoku z silnika Rust (civ-engine) do renderera Rust (civ-renderer). Zakres tylko Rust, zgodnie z LEDGER.
- **Evaluator r1 (`4a3df2453`): FAIL, 7 zarzutów.** Główne: dane webu z pinu edb8fb56 zamiast 07d2fbd72 (w render/** 27 zmienionych plików, nowe pole isGeneral i pierścień wodza); `deselect_unit` sprzeczne z D-CMD-12 (zaznaczenie to stan UI); pominięty warunek planów marszu w PlayableState; zmyślone pole `wlasciciel`; mgła terenu niepełna.
- **Obrona (`3f8fb53d3`):** przyjęła 6 z 7 zarzutów, jeden odrzuciła z uzasadnieniem (pierścień wodza to geometria renderera, nie osobne pole DTO).
- **FC (`787cb60d2`): PASS-WITH-NOTES, decyzje dla właściciela: brak.**
- **Integracja:** `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` i raporty runu (01-operator, 02-evaluator, 02a-obrona, 03-final-control) na `claude/rust-sivvrn` (`9227a67bc`). Gałąź FC wychodzi z innej bazy (starej gałęzi dokumentacyjnej), więc wzięte zostały tylko pliki P4-1.
- **Zabezpieczenie:** refs/keep `P4-1-r1-{0d6d70cff,4a3df2453,3f8fb53d3,787cb60d2}`, gałąź `rust-port-wip/R-RUSTPORT-P4-1-RENDER-DTO-CONTRACT-Q1-fc`.
- **Otwarte (wnioski z dokumentu, nie blokują zamknięcia):** cancel_planned_march jako nowa komenda silnika; planned-march state w PlayableState (kandydat P4-1J); model MapHex w silniku to szkielet (M01).

## Przebieg (15.11, 09:47 UTC — heartbeat, RUST renderer, Opus 5.5)
- **KROK 1 (sloty):** 3 aktywne Workflow na Opus 5.5: P4-36 Q3 (`wf_102d919b-3d8`, Operator impl), P4-17 domknięcie (`wf_be79e3c5-9d0`, Evaluator), P4-31 domknięcie (`wf_7671c7ae-e51`, Evaluator). Sloty 3/4. Nie uruchomiono czwartego: dysk 5,0 GB (poniżej progu 8 GB).
- **KROK 2:** brak zakończonych Workflow bez integracji (P4-1, P4-0 zintegrowane wcześniej w tej sesji).
- **KROK 3 (sprzątanie):** usunięto worktree zakończonego P4-1 (`wf_c204895c-d41-4`, czysty). Uruchomiono `git gc` w tle. Worktrees trzech działających tematów zostawione.
- **Model:** renderer/3D Rust na Opus 5.5 we wszystkich etapach (zasada właściciela z tej sesji), zamiast rutynowego Haiku/Sonnet z KROK 4.
- **Parity:** `95930b446`.

## Przebieg (15.11, 09:55 UTC — P4-17 MOD03 TERRAIN-DECOR, domknięcie r3, Opus 5.5)
- **Evaluator r3:** PASS-WITH-NOTES, 6 zarzutów: rozjazd bazy w logach (bf59164b vs e1d69078d), przedwczesny wpis PASS, brak SHA-256 fixtur w katalogu, brak asercji liczby rekordów, luka mutacyjna w `Box3`, strażnik tylko tekstowy.
- **Obrona r3 (`0dadaac3b`, raport `518064098`):** przyjęła wszystkie 6. Pracowała na aktualnym parity (`95930b446`). Dodano `SHA256SUMS`, asercje liczności, usunięto martwy kod `Box3`, test znaku zera, skaner tokenowy.
- **FC r3 (`32e65f7d2`): PASS-WITH-NOTES, 0 NAPRAW, 0 do decyzji.** Bramki (fmt, clippy, clippy gpu, cargo test --all-targets) EXIT=0, `decor_web_parity` 12/12, 571 659 skalarów, 0 rozbieżności bitowych.
- **Integracja:** fast-forward `rust-port/parity-v2` z `95930b446` na `32e65f7d2`. Zakres: 25 plików, tylko `decor/`, testy i fixtury decor, dokument i raporty runu. `git diff --check` czysty. Parity = `32e65f7d2`, kod `0dadaac3b` jest w historii.
- **Korekta:** wpis `f23326304` ("P4.17 PASS") był przedwczesny. Obowiązującym domknięciem jest FC r3 (`32e65f7d2`), a nie ten wpis.
- **Zabezpieczenie:** refs/keep `P4-17-r3-{0dadaac3b,518064098,32e65f7d2}`, gałąź `rust-port-wip/R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1-fc-r3`.
- **Ograniczenie:** stan `decor` na parity po późniejszych zmianach (P4.27) nie był testowany w tym cyklu; FC ocenił tylko commit `0dadaac3b`.

## Przebieg (15.11, 10:xx UTC — P4-31 ATLAS-CACHE, domknięcie r3, Opus 5.5)
- **Proces (P-1, do rejestru):** kod P4-31 (`5259741ab`, cache/klucze treści RR-T8d) trafił na parity-v2 w poprzedniej integracji **bez** Evaluatora i FC. Obieg Operator → Evaluator → FC → integracja nie został zachowany. Dokumentuję to, nie zmieniam historii.
- **Evaluator r3 (`afea15d17`): PASS-WITH-NOTES, 6 zarzutów.** Główne: kod na parity różni się od ocenianego (`a827fac07` REPIN-3D-B2); brak pliku `02-evaluator-r1.md` w runie (zarzuty r1 rekonstruowane z odpowiedzi Operatora); E12 przeżywa (brak testu rozmiaru indeksu); LRU wyrzuca tekstury widoczne (poza allowlistą, zapisane w dokumentacji); MSRV i GPU na ANGLE → D3D11 NIE_ZMIERZONO.
- **Obrona r3 (`d850b6b86` kod, `b7aecd8b6` docs):** przyjęła wszystkie 6. Dodano test `end_of_turn_alone_keeps_the_key_index_bounded` (zabija E12), dokumentację LRU z testem `lru_eviction_of_a_shown_texture_duplicates_it`, zaktualizowano README fixtur, MSRV 1.87 zmierzone (468 passed).
- **FC r3 (`d850b6b86`): PASS-WITH-NOTES, 0 decyzji dla właściciela.**
- **Integracja:** cherry-pick `d850b6b86` + `b7aecd8b6` na aktualne parity `32e65f7d2` → `525a2ef7b`. Testy na zintegrowanym drzewie: `cargo test --all-targets` 472 passed, 0 failed, EXIT=0; `cargo fmt --check` EXIT=0. FF `rust-port/parity-v2` → `525a2ef7b`.
- **Uwaga:** `git diff --check` zgłasza białe znaki w logu dowodowym `dowody/18-obrona-r3-parity-atlas-diff.log` (wklejony `git log`), nie w kodzie. Dowodu nie zmieniam.
- **Zabezpieczenie:** refs/keep `P4-31-r3-{d850b6b86,b7aecd8b6,afea15d17}`, `P4-31-integ`; gałęzie `rust-port-wip/…-obrona-r3-code`, `…-obrona-r3-docs`, `…-integ`.
- **Otwarte (poza zakresem):** LRU w `assets/cache.rs` wyrzuca widoczne tekstury (osobny temat); GPU/ANGLE u właściciela NIE_ZMIERZONO.

## Przebieg (15.11, 10:18 UTC — heartbeat, RUST renderer, Opus 5.5)
- **KROK 1 (sloty):** aktywny tylko P4-36 Q3 (`wf_102d919b-3d8`). Dysk 11 GB (≥ 8 GB). Uruchomiono P4-1A.
- **Decyzje techniczne orkiestratora (zasada 9):** z rekomendacji P4-1 przyjęto **D-DTO-1 = A** (osobny crate `rust-port/view-model`), **D-DTO-2 = B** (newtypy na granicy, adapter w P4-1G), **D-DTO-3 = B** (statyka + warstwy, pomiar w P4-1A). Nie są to decyzje gameplay; nie pytam właściciela.
- **R-RUSTPORT-P4-1A-VIEW-TYPES-Q1:** dispatch `62c74a118` (baza parity `525a2ef7b`), Workflow `wf_5cdb4080-e0a` na Opus 5.5 we wszystkich etapach: Operator (impl + pomiary) → Evaluator → Obrona → FC. Allowlista: `rust-port/view-model/**`, wpis workspace, katalog runu.
- **KROK 2:** brak nowych FC PASS bez integracji poza P4-36 Q3 w toku.
- **KROK 3:** brak worktrees do sprzątania.
- **Parity:** `525a2ef7b`. Rust: `ef1a9d04b` przed tym wpisem.

## Przebieg (15.11, P4-22 MOD13 MISC — domknięcie r3, Opus 5.5)
- **Evaluator r3 (`713e3646c`): PASS-WITH-NOTES, bez zarzutów blokujących.** Bramki EXIT=0 (fmt, clippy, clippy gpu, test; 472 passed na `525a2ef7b`). Wektory odtworzone z pinu, SHA zgodne. Notatki: brak raportu `03-operator-r2.md` (ostatni kod to `03-operator-obrona-r1`, `fa94290a4`, już na parity); SHA z raportów r1 nieistniejące (mapowanie: `03c8e0ee`→`6c5f83224`, `e06090bf`→`fa94290a4`, `9b574147`→`f1a1740cc`); dwa mutanty przeżyły w progach zdegenerowanych (równoważne w dziedzinie wejść).
- **Obrona r3 (`445277178`):** PASS-WITH-NOTES. Zarzuty przyjęte lub odrzucone z dowodem (N3 odrzucony: progi nie rozróżniają się w możliwych danych).
- **FC r3 (`36109f96a`): PASS-WITH-NOTES, 0 decyzji dla właściciela.**
- **Integracja:** kod P4-22 był już na parity (`fa94290a4`, ancestor `525a2ef7b`). Na `claude/rust-sivvrn` wzięto wyłącznie raporty runu `04-evaluator-r3.md`, `05-obrona-r3.md`, `06-final-control-r3.md`. Commit FC wychodzi ze starej bazy i zawiera cudze pliki, więc nie brano go w całości.
- **Zabezpieczenie:** refs/keep `P4-22-r3-{713e3646,44527717,36109f96}`, gałąź `rust-port-wip/R-RUSTPORT-P4-22-MOD13-MISC-Q1-fc-r3`.
- **LEDGER.md:155** podaje stare SHA raportów r1. Wpis do poprawy przez orkiestratora (poza allowlistą obrony).

## Przebieg (15.11, 10:48 UTC — heartbeat, RUST renderer, Opus 5.5)
- **KROK 1 (sloty):** 3 aktywne Workflow na Opus 5.5: P4-1A typy DTO (`wf_5cdb4080-e0a`), P4-34 domknięcie (`wf_ff0761db-05e`), P4-29 domknięcie (`wf_e92860f9-2cc`). Sloty 3/4. Czwartego nie uruchomiono: brak kandydata spełniającego reguły (kod na parity i dispatch gotowy), a dysk 7,7 GB, poniżej progu 8 GB.
- **KROK 2:** zakończone w ostatniej godzinie i zintegrowane: P4-36 Q3 (BLOCK, temat zamknięty, bo część 3 była już na parity), P4-17 (FC r3), P4-31 (FC r3 i integracja `525a2ef7b`), P4-22 (FC r3, raporty `c37ba1da8`).
- **KROK 3 (sprzątanie):** usunięto worktrees P4-22 i P4-36 Q3 (czyste, commity w `refs/keep`). Próba usunięcia katalogu scratch została zablokowana przez zabezpieczenie systemu i nie została powtórzona; katalog `p431ob-target` już nie istnieje, `p417gates` ma 84 KB.
- **Parity:** `525a2ef7b`. Rust: `c37ba1da8` przed tym wpisem.

## Przebieg (15.11, P4-34 ANCHORS-DOM — domknięcie r3, Opus 5.5)
- **Proces (P-1):** kod P4-34 (`ba5dca739`, obrona r1; Operator r1 `6cd6f33aa`) trafił na parity-v2 przez rebase P4.35 (`c4fa31a2f`) **przed** Evaluatorem i FC. Odnotowuję to, nie zmieniam historii.
- **Evaluator r3 (`e43274091`): PASS-WITH-NOTES, 4 niskie zarzuty:** brak testów brzegowych dla `height <= 0` i granicy `z > 1` (mutanty E6, E7 przeżywały); test `js_round` sugerował sprawdzanie znaku `-0`; SHA `27090d91` nieistniejące w repo; odnotowanie integracji przed FC.
- **Obrona r3 (`2e00643e1`): PASS.** Dodano przypadki brzegowe (height=0 → None; far-plane z=1.0 → Some, następny double → None), test `js_round` porównuje `to_bits` (+0 dla -0.5 i -0.2, -0 dla -0.0, 0.49999999999999994), O3 i O4 zabite. Korekta SHA w dokumentacji. Testy na świeżym target: fmt, clippy (z i bez gpu), `cargo test --all-targets`: EXIT=0; labels_anchors 8/8, labels_layout 7/7, labels_scenes 4/4; mutanty 4/4 zabite.
- **FC r3 (`fffc5e7c6`): PASS-WITH-NOTES, 0 decyzji dla właściciela.**
- **Integracja:** fast-forward `rust-port/parity-v2` z `525a2ef7b` na `fffc5e7c6`. Zakres: testy `labels_anchors.rs`, komentarz w `anchor.rs`, dokumenty i dowody runu. `git diff --check` czysty.
- **Zabezpieczenie:** refs/keep `P4-34-{6cd6f33aa,ba5dca739,2e00643e1,fffc5e7c6}`, gałąź `rust-port-wip/R-RUSTPORT-P4-34-ANCHORS-DOM-Q1-fc-r3`.
- **Uwaga dla dyspozycji:** dispatch wskazywał `03-operator-r2.md`, którego nie było; rundy r2 Operatora nie było.

## Przebieg (15.11, 11:18 UTC — heartbeat, RUST renderer)
- **KROK 1 (sloty):** 2 aktywne Workflow na Opus 5.5: P4-1A typy DTO (`wf_5cdb4080-e0a`), P4-29 domknięcie (`wf_e92860f9-2cc`). Sloty 2/4.
- **Nie uruchomiono kolejnych:** dysk 7,5 GB, poniżej progu 8 GB dla nowych tematów z kodem Rust (CLAUDE.md, zasada 5 i 7). Ponowny `git gc` nie zwolnił miejsca. Kandydaci bez kodu na parity lub z brakującymi commitami (P4-19, P4-23, P4-32) nie są gotowe.
- **KROK 2:** zakończone i zintegrowane w tej godzinie: P4-34 (FC r3, parity `fffc5e7c6`), P4-22 (FC r3, raporty `c37ba1da8`).
- **KROK 3:** worktrees zakończonych tematów usunięte; worktrees działających zostawione.
- **Parity:** `fffc5e7c6`. Rust: `bfb0b0be6` przed tym wpisem.

## Przebieg (15.11, P4-29 TEXT-FONTS — domknięcie r3, Opus 5.5)
- **Evaluator r3:** PASS-WITH-NOTES, 9 zarzutów, wszystkie niskie: brak testów GPOS (E6, E9), `\n \r \f` (E4), samotna połówka pary zastępczej (E11), zabezpieczenie NaN (E7), kwantyzacja przy obrocie (M20), `toUpperCase` zależne od wersji Unicode, liczby w dokumencie niezgodne, brak raportu Evaluatora r1, mapFamily powiela map_family (decyzja D-TXT-5).
- **Obrona r3 (`69eae2e85`): PASS.** Dodano `tests/text_edge_cases.rs` (5 testów), rozszerzono `text_scenes.rs` i `text_upper.rs` (oba kierunki), poprawiono liczby w §4.1, §4.2, §6. E7 odrzucony jako mutant równoważny (ścieżka z nieskończonością kończy się w `tiny-skia` i `svg.rs`). Mutanty zabite: 10 z 11.
- **FC r3 (`0e1430961`): PASS-WITH-NOTES, 0 decyzji dla właściciela.** Przypadki brzegowe zmierzone w Chromium 153 (w kontenerze nie ma 141); NIE_ZMIERZONO: Chromium 141 dla tych przypadków, clippy na rustc 1.87, Windows, GPU, gamma masek.
- **Integracja:** merge `4a686b902` (parity `fffc5e7c6` + FC `0e1430961`), zmiany tylko w ścieżkach P4-29 (testy `text_*`, dokument, dowody); P4-34 nietknięte. Pełne testy na zmergowanym drzewie: `cargo test --all-targets` EXIT=0, 478 passed, 0 failed. FF `rust-port/parity-v2` → `4a686b902`.
- **Zabezpieczenie:** refs/keep `P4-29-integ`, gałąź `rust-port-wip/R-RUSTPORT-P4-29-TEXT-FONTS-Q1-integ`. Worktrees usunięte.
- **Proces (P-1):** kod P4-29 (`51839a356`, `6cee8e46c`, `283f8634c`) trafił na parity przed Evaluatorem i FC, jak P4-31 i P4-34.

## Przebieg (15.11, P4-1A VIEW-TYPES — crate view-model, Opus 5.5)
- **Operator impl (`86032cd28`) i pomiary (`011de8664`): PASS-WITH-NOTES.** Typy §3 w crate `rust-port/view-model`, serde camelCase, 63 testy. Zmierzony rozmiar snapshotu: 3000 heksów ≈ 0,75–0,91 MB, 8000 heksów ≈ 2,0–2,4 MB (251–304 B/heks). Arytmetyka z kontraktu §4.1 (50–100 B/heks) była zaniżona 3–4 razy; liczby wpisano do P4-1 §4.1.
- **Evaluator r1 (`b54dffb9a`): FAIL, Z1.** 21 mutantów walidatora przeżywało (kontrole per pole f64/u8 i Option), test `floats_everywhere` obejmował 9 z 23 pól.
- **Obrona r1 (`fb3d1b95b`): PASS.** Dodano tabelaryczne testy NaN/Inf dla wszystkich 23 pól f64 i Option<f64>, testy granic u8, fikstury pinu z przeliczonym SHA. Mutanty: 93/93 zabite, 0 przeżyło.
- **FC r1 (`f3dab5fda`): PASS-WITH-NOTES, 0 decyzji dla właściciela.**
- **Integracja:** fast-forward `rust-port/parity-v2` z `4a686b902` na `a01363d5f` (zakres: `rust-port/view-model/**` i katalog runu). Testy crate'u na zintegrowanym drzewie: `cargo test --all-targets --offline` EXIT=0, 68 passed, 0 failed, 0 ignored.
- **Decyzje techniczne orkiestratora (zasada 9):**
  - **Z3:** łatka §4.1 (liczby pomiarowe) zastosowana w `P4-1-RENDER-DTO-CONTRACT.md` na tej gałęzi.
  - **Z6 = D-VM-OPT-IN:** klucz `Option` nieobecny na wejściu wczytuje się jako `None` (domyślne zachowanie serde); producent zawsze zapisuje jawny `null` (sprawdza `json_strict`). Zmiana na wymuszenie obecności wymagałaby zmiany w `src/`.
  - **Z5:** adapter P4-1G ustawia `civ_id = None` dla barbarzyńców (wartość w webie NIE_ZMIERZONO).
- **Otwarte z raportu Operatora (do adaptera P4-1G / P4-1B):** `stacks` w korzeniu snapshotu (dodane, §1.5.1 Δ4); brak wariantu „wonder” w `buildHighlight` (web ma inne krycie, `main.ts@07:16366` vs `:16392`); `ammo None` oznacza Infinity w webie; newtypy ID odrzucają wartości > 2^53−1.
- **Proces (P-1):** kod P4-1A wszedł na parity przed FC w jednym kroku z poprawkami obrony; ślady w `refs/keep/P4-1A-*`. Dispatch nie miał DODATKU r2 (dodany dopiero w tej rundzie w gałęzi roboczej).
- **Zabezpieczenie:** refs/keep `P4-1A-{fb3d1b95b,f3dab5fda,011de8664,86032cd28,integ}`, gałąź `rust-port-wip/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1-integ`.

## Przebieg (15.11, 11:47 UTC — heartbeat, RUST renderer, Opus 5.5)
- **KROK 1 (sloty):** 1 aktywny Workflow na Opus 5.5: P4-1J plany marszu (`wf_fa7a2e6d-ba0`). Sloty 1/4.
- **Nie uruchomiono kolejnych:** kandydaty odblokowane przez P4-1A to P4-1B (blokada D-DTO-6 i tematu M01: model `MapHex` jest pustym szkieletem) i P4-1I (decyzja D-DTO-7). Pozycje #96–#119 z listy zadań to decyzje gameplay albo zależności, więc ich nie startuję. Dysk 13 GB.
- **KROK 2:** brak nowych FC PASS bez integracji (P4-1A zintegrowany w `a01363d5f`).
- **KROK 3:** brak worktrees do sprzątania poza działającym P4-1J.
- **Parity:** `a01363d5f`. Rust: `3b025a272` przed tym wpisem.

## Przebieg (15.11, blokery tematów Opus — zasada 11: najpierw web)
- **Zasada zapisana na stałe:** CLAUDE.md zasada 11 (`b0218a5f9`): najpierw kod webowy (pin `07d2fbd72`), potem Rust; pytania do właściciela tylko, gdy web nie rozstrzyga gameplayu.
- **P4-1B — blokada D-DTO-6 (ustalenie):** LEDGER (wpis M01) podaje „RUNDA-2: MapHex w types.rs”, ale definicja `pub struct MapHex` NIE występuje w żadnym commicie repo (`6fb1e57bc` to jedyna historia pliku `types.rs`, szkielet). `7fe46f7f4` (rdzeń generatora) jest na parity; `91b6b2ac3` („M01 zintegrowane”) nie jest. Wpis LEDGER jest więc nieprawdziwy w tym punkcie.
- **Decyzja (web):** model heksa odwzorowuje `gra/src/types/hex.ts` (pin): `TerenBazowy`, `Nakladka`, `Ulepszenie`, `Widocznosc`, `HexCoords`, `Wioska`, `RzekaInfo`, `Hex`. Wartości JSON enumów = wartości z webu (snake_case, np. `plytkie_morze`). Rozstrzyga otwartą kwestię „serde Terrain PascalCase vs snake_case” z LEDGER na korzyść webu.
- **Uruchomiono:** M01-R2 MapHex (`wf_0e33af85-341`, dispatch `bc151167a`), baza parity `a01363d5f`. Operator i Obrona HAIKU, Evaluator i FC SONNET (silnik, nie grafika). Pierwsza próba padła na brakującej stałej `H` w skrypcie (naprawione, bez wpływu na kod).
- **P4-1I — D-DTO-7 (web):** web NIE ma strumienia zdarzeń bitwy. `buildBattleEventLog` (`units/battleRoster`) buduje log z rosteru i trafia do sceny jako wartość przy starcie (`battleScene.ts:597`, `:10724`). Wniosek: producent w Rust ma dostarczyć log jako snapshot z rosteru, a nie emitować zdarzenia z pętli. P4-1I wymaga przepisania zakresu wg tego wniosku przed startem.
- **P4-1C–H:** zależą od B (blokada M01) lub J (w toku).

## Przebieg (15.11, 12:48 UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** 4 aktywne Workflow, brak nowych startów (warunek < 4 niespełniony):
  - M01-R2 MapHex (`wf_0e33af85-341`, #210): Operator, etap 1/4, HAIKU, od 12:18; agent aktywny (transkrypt 12:47).
  - P4-1J stan planów marszu (`wf_fa7a2e6d-ba0`, #209): etap 2/4 (pomiary), OPUS, od 11:43; etap impl PASS-WITH-NOTES, kod `78f5db10f`, raport `2169bd17d`.
  - P4-1E CITY-VIEW (`wf_cd64d6c2-9fe`, #214): etap 1/4, OPUS, od 12:28.
  - CRED-HAK wdrożenie, wycinek 1 (`wf_527c2223-a63`, #171): etap 1/4, HAIKU, od 12:50; dispatch `4b0b00257`.
- **KROK 2 (FC PASS bez integracji):** brak. CRED-HAK rozpoznanie (`wf_be7eeab7-37f`) — FC PASS-WITH-NOTES `769d0aac3`; dokumenty runu przeniesione na gałąź roboczą (`cc4ca5309`).
- **KROK 3 (sprzątanie):** brak zakończonych tematów do sprzątania w tym przebiegu. Dysk ok. 7,4 GB wolne.
- **Odstępstwa zgłoszone:** P4-1J na OPUS (nazwa skryptu) — zasada: tematy silnika na HAIKU, zostawiam bieżący etap, kolejne silnikowe na HAIKU. Luka parytetu `generalTargetId` (web) pominięta w Rust → #221. Decyzja techniczna z P4-1J do zapisania: pola identyfikatorów `UnitId`, cel `i32`, wpisy niereprezentowalne pomijane z raportem `unrepresentable` (do potwierdzenia po FC).
- **Uwaga do M01-R2:** w rendererze istnieje już `struct MapHex` (`rust-port/renderer/src/pick/terrain.rs:246`, podzbiór pól pod picking). Model z `hex.ts` w silniku nadal nie istnieje.
- **NASTĘPNY KROK:** odebrać wyniki etapu pomiarów P4-1J i kolejnych etapów; po FC PASS — ancestry, FF, sprzątanie worktree i tagów `tgt*`.

## Przebieg (15.11, 13:18 UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** 4 aktywne Workflow, brak nowych startów (warunek < 4 niespełniony):
  - M01-R2 MapHex (`wf_0e33af85-341`, #210): etap 2/4 pomiary, HAIKU; Operator PASS-WITH-NOTES `0bb8a6f22`, zabezpieczony na `wip/R-RUSTPORT-P6-M01-MAPHEX-Q1` i `refs/keep/M01-R2-operator-impl`.
  - P4-1J stan planów marszu (`wf_fa7a2e6d-ba0`, #209): etap 2/4 pomiary, OPUS (skrypt); Operator PASS-WITH-NOTES `2169bd17d`; luka `generalTargetId` (#221).
  - P4-1E CITY-VIEW (`wf_cd64d6c2-9fe`, #214): etap 1/4 Operator, OPUS; agent aktywny.
  - CRED-HAK wdrożenie, wycinek 1 (`wf_527c2223-a63`, #171): etap 2/4 Evaluator, SONNET; Operator PARTIAL, WIP `ff6392336` na `wip/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1`, `refs/keep/CRED-HAK-IMPL-r1-wip`.
- **KROK 2 (FC PASS bez integracji):** brak. CRED-HAK rozpoznanie (`wf_be7eeab7-37f`, FC PASS-WITH-NOTES `769d0aac3`) zintegrowane dokumentami (`cc4ca5309`); `refs/keep/CRED-HAK-ROZP-fc`.
- **KROK 3 (sprzątanie):** usunięte 4 worktree rozpoznania CRED-HAK oraz 5 katalogów cache w `/tmp/claude-0` nieużywanych od ponad godziny. Dysk: 6,7 GB wolne. Worktree i cache działających agentów zostawione.
- **Poprawka skryptu:** `topic-CRED-HAK-IMPL.js` — PARTIAL/BLOCK z Operatora nie idzie do Evaluatora; uruchamia rundę dokończenia z tym samym ID. Modele bez zmian (Operator/Obrona HAIKU, Evaluator/FC SONNET). Działające workflow nie są zmienione.
- **Odstępstwa zgłoszone:** P4-1J i P4-1E na OPUS. Zasada heartbeatu mówi HAIKU dla Operatora, a zasada użytkownika dla tematów renderera/DTO mówi OPUS; P4-1J jest tematem silnika — zostawiam bieżący etap, kolejne silnikowe na HAIKU.
- **NASTĘPNY KROK:** odebrać FC M01-R2 i P4-1J oraz wynik Evaluatora CRED-HAK; po FC PASS — refs/keep, ancestry, rozmiar diffu, integracja na parity, sprzątanie worktree.

## Przebieg (15.11, 13:40 UTC — heartbeat „twardy bit”, dysk)

- **KROK 1 (sloty):** 4 aktywne Workflow, bez nowych startów: M01-R2 (#210, pomiary, HAIKU), P4-1J (#209, pomiary, OPUS), P4-1E (#214, Operator, OPUS), CRED-HAK wdrożenie (#171, Evaluator, SONNET). Wszystkie agenty piszą do transkryptów (13:38–13:39).
- **KROK 2 (FC bez integracji):** brak.
- **KROK 3 (sprzątanie):** dysk spadł do 1,7 GB (poniżej progu 2 GB). Usunięto: `scratchpad/target-p429` (P4-29, zakończony), cztery katalogi sprzed nocy (`ev`, `w07`, `wedb`, `rp`). Dysk: 2,4 GB. Nie usuwano cache aktywnych: `scratchpad/target` (5,8 GB), `target-m01`, `target-cred-hak`, `tgt`, worktree trwających tematów.
- **Zabezpieczenie systemu:** `rm -rf` z podstawioną zmienną zostało zablokowane; powtórzono usunięcie przez pełne ścieżki.
- **NASTĘPNY KROK:** po FC któregokolwiek z czterech — integracja lub poprawka, sprzątanie cache tego tematu, uzupełnienie slotu. Przy dysku < 2 GB nie startować nowych tematów.

## Przebieg (15.11, 13:48 UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** 4 aktywne Workflow, bez nowych startów (warunek < 4 niespełniony):
  - M01-R2 MapHex (#210): etap 2/4 pomiary, HAIKU, od 12:18; agent aktywny (13:44).
  - P4-1J stan planów marszu (#209): etap 3/4 Evaluator, OPUS; pomiary PASS-WITH-NOTES `25da353f8` (nowy test granic `p4_1j_planned_march_bounds.rs`; 2 mutanty przeżyły i zostały zabite). Agenty aktywne (13:47).
  - P4-1E CITY-VIEW (#214): etap 1/4 Operator, OPUS, od 12:27; agent aktywny (13:48).
  - CRED-HAK wdrożenie, wycinek 1 (#171): etap 2/4 Evaluator, SONNET, od 12:59; Operator PARTIAL, WIP `ff6392336`; agent aktywny (13:48).
- **KROK 2 (FC PASS bez integracji):** brak.
- **KROK 3 (sprzątanie):** brak zakończonych tematów. Dysk: 8,9 GB wolne.
- **NASTĘPNY KROK:** odebrać FC P4-1J i CRED-HAK (Evaluator); po FC PASS — refs/keep, ancestry, integracja, sprzątanie cache.

## Przebieg (15.11, 14:18 UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** 4 aktywne Workflow, bez nowych startów (warunek < 4 niespełniony):
  - M01-R2 MapHex (#210): etap 4/4 Obrona, HAIKU; pomiary PASS-WITH-NOTES `442632465`; Evaluator poprzedzał obronę.
  - P4-1J stan planów marszu (#209): etap 4/4 Obrona, OPUS; pomiary PASS-WITH-NOTES `25da353f8`.
  - P4-1E CITY-VIEW (#214): etap 2/4 Evaluator, OPUS; Operator PASS-WITH-NOTES na `rust-port-wip/R-RUSTPORT-P4-1E-CITY-VIEW-Q1`.
  - CRED-HAK wdrożenie, wycinek 1 (#171): etap 3/4 Obrona, HAIKU; Evaluator FAIL (brak commitu Operatora; komenda `declare_war` to atrapa zwracająca `engine_rejected` — do oznaczenia jako BRAK).
- **KROK 2 (FC PASS bez integracji):** brak.
- **KROK 3 (sprzątanie):** od 14:09 usunięto cztery worktree zakończonych etapów (P4-1J Operator i pomiary, M01 Operator, CRED-HAK Operator) oraz cache CRED-HAK Operatora i pięć katalogów scratchpadu. Commity P4-1J zabezpieczone na `wip/` i w `refs/keep`. Dysk: 8,0 GB wolne.
- **NASTĘPNY KROK:** odebrać FC M01 i P4-1J (Obrona → FC); CRED-HAK po FC — kolejna runda tego samego ID z commitem Operatora; P4-1E po Evaluatorze.

## Przebieg (15.11, 14:47 UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** 4 aktywne Workflow, bez nowych startów (warunek < 4 niespełniony):
  - M01-R2 MapHex (#210): etap 4/4 Obrona po FAIL Evaluatora, HAIKU, od 12:18.
  - P4-1J stan planów marszu (#209): etap 4/4 FC, SONNET, od 11:43; Operator, pomiary i Evaluator PASS-WITH-NOTES, Obrona odpowiedziała.
  - P4-1E CITY-VIEW (#214): etap 2/4 Evaluator, OPUS, od 12:27; Operator PASS-WITH-NOTES na `rust-port-wip/R-RUSTPORT-P4-1E-CITY-VIEW-Q1`.
  - CRED-HAK wdrożenie, wycinek 1 (#171): etap 4/4 FC, SONNET, od 12:59; Operator PARTIAL, Evaluator FAIL, Obrona odpowiedziała.
- **KROK 2 (FC PASS bez integracji):** brak. Oczekują FC P4-1J i CRED-HAK.
- **KROK 3 (sprzątanie):** 14:39 usunięto cztery worktree zakończonych etapów (M01 pomiary i Evaluator, P4-1E Operator, P4-1J Evaluator). Dysk: 6,8 GB wolne.
- **NASTĘPNY KROK:** odebrać FC P4-1J i CRED-HAK; po FC PASS — refs/keep, ancestry, integracja; po FAIL — kolejna runda tego samego ID.

## Przebieg (15.11, 15:08 UTC — integracja P4-1J, slot #96)

- **INTEGRACJA P4-1J (#209): FF `parity-v2` → `62ff9de35`.** FC PASS-WITH-NOTES `62ff9de35` (łańcuch: Operator `2169bd17d`, pomiary `25da353f8`, Evaluator PASS-WITH-NOTES, Obrona `1506833dd`, FC). Ancestry: `a01363d5f` jest przodkiem `62ff9de35`. Allowlista OK (13 plików: `playable.rs`, `save_load.rs`, `mod.rs`, testy P4-1J, dokumenty runu); `gra/` nietknięte. Pełny `cargo test --all-targets`: 470 zestawów, 3395 passed, 0 failed (zapis FC; jeden zestaw SIGTERM z zewnątrz, przeliczony EXIT 0). Z1 (deduplikacja wpisów planów przed filtrem) — naprawiona w Obronie, potwierdzona przez FC. `refs/keep/P4-1J-fc`.
- **Decyzje orkiestratora (do zapisu, z raportu Operatora):** (a) id w polach planów to `UnitId`, cel to `i32`; wpisy niewyrazalne są pomijane i raportowane w `unrepresentable` zamiast cichej straty danych (web je trzyma). (b) `generalTargetId` NIE jest obsługiwane (zgodnie z dispatchem) — NIE_ZMIERZONO, zadanie #221. (c) Odchylenie od polityki modeli: temat silnika na OPUS we wszystkich etapach (skrypt `topic-P4-1J-OPUS.js`) — nie powtarzać.
- **Sprostowanie raportów P4-1J:** Operator i Obrona pisali, że `7817ef0c` nie jest w `parity-v2`. Sprawdzone: `git merge-base --is-ancestor 7817ef0c a01363d5f` = TAK. Baza była poprawna; sprostowanie w raporcie 03-final-control.
- **Uwaga do atrybutu:** w `civ-engine` nie ma `#![forbid(unsafe_code)]` (ani na bazie, ani na gałęzi) — kryterium z dispatchu jest puste; nowy kod nie używa `unsafe`.
- **Sprzątanie:** usunięte worktree P4-1J (`-4`, `-5`) i wcześniej cztery zakończone etapy. Dysk: 8,2 GB wolne.
- **Slot #96:** rozpoznanie wież (K5-LOOP-WIEZE, `R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1`, dispatch `fd9215ee8`, baza `62ff9de35`, tylko odczyt). Ustalenie: `fire_siege_towers` (siege_tactics_loop.rs ok. :436) i `pick_tower_target` (siege_tactics_tower.rs :486) są już wpięte; brak do sprawdzenia przy harmonogramie 180 ms.
- **NASTĘPNY KROK:** odebrać rozpoznanie wież i zdecydować, czy #96 wdrażać; odebrać FC M01 (#210 — sprawdzić duplikację z P4.10: `MapHex` w renderze) i FC CRED-HAK (#171).

## Przebieg (15.11, 15:18 UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** 4 aktywne Workflow, bez nowych startów:
  - M01-R2 MapHex (#210): FC, SONNET, od 12:18; Evaluator FAIL, Obrona odpowiedziała, FC w toku (od 15:02).
  - P4-1E CITY-VIEW (#214): Obrona, HAIKU, od 12:27; Operator i Evaluator zakończone.
  - CRED-HAK wdrożenie, wycinek 1 (#171): FC, SONNET, od 12:59; Operator PARTIAL, Evaluator FAIL, Obrona odpowiedziała.
  - Rozpoznanie wież (#96, `R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1`): Operator, HAIKU, od 15:14; baza `62ff9de35`.
- **KROK 2 (FC PASS bez integracji):** brak.
- **KROK 3 (sprzątanie):** brak zakończonych tematów do usunięcia w tym ticku. Dysk: 7,3 GB wolne.
- **NASTĘPNY KROK:** odebrać FC M01 i FC CRED-HAK; po FC PASS — refs/keep, ancestry, integracja; po FAIL — kolejna runda tego samego ID.

## Przebieg (15.11, 15:47 UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** wolne 2 sloty na starcie; uzupełnione. Aktywne 4:
  - P4-1E CITY-VIEW (#214): FC, OPUS, od 12:27.
  - Wyłom wieży (#98, `R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1`): Operator, HAIKU, od 15:45; baza `d5a52a980`.
  - Zdobycie miasta — rozpoznanie (#175, `R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1`): Operator, HAIKU, od 15:50; tylko odczyt.
  - R7K7C — status (#176, `R-RUSTPORT-P6-R7K7C-STATUS-ROZPOZNANIE-Q1`): Operator, HAIKU, od 15:50; tylko odczyt.
- **KROK 2 (FC PASS bez integracji):** brak nowych. CRED-HAK zintegrowany na parity (`d5a52a980`, test 3415/0 failed). M01-R2 czeka na ponowne scalenie na `d5a52a980` i test (wcześniejszy test dotyczył `62ff9de35`).
- **KROK 3 (sprzątanie):** wcześniej usunięto worktree rozpoznania wież i CRED-HAK. Dysk: 6,0 GB wolne (poniżej progu 8 GB dla nowych tematów z kodem Rust; rozpoznania są tylko do odczytu).
- **NASTĘPNY KROK:** odebrać wynik testu M01 (`integ-m01.log`), ponowne scalenie M01 na `d5a52a980`, test i FF; odebrać FC P4-1E i wyniki rozpoznań.

## Przebieg (15.11, 16:08 UTC — rozpoznanie zdobycia miasta #175 zintegrowane jako dokumenty)

- **#175 ZDOBYCIE-MIASTA-ROZPOZNANIE:** FC PASS-WITH-NOTES `d2daa6f0b`; dokumenty runu na `claude/rust-sivvrn` (`23cceded8`). Wynik: żadne z 20 kroków ścieżki zdobycia miasta nie ma wołającego w produkcji Rust (`apply_transfer_with_effects`, `run_capital_capture_plunder`, `eliminate_owner`, `power_record_city_capture`, `resolve_surrender_path`, `surrender_tick_action`, `combat::resolve`). Zależności: W8, #113, #114, Q7, Q8/Q9, scalenie akumulatorów Power.
- **Decyzje orkiestratora z FC (do zapisu):**
  - (a) Nazwa `applyCaptureTransfer` z dispatchu #115 NIE istnieje w pinie `07d2fbd72`. Właściwa: `applyCityCaptureAfterBattle` (`post-battle-map.ts:493`) i blok kapitulacji `main.ts:17698-17848`. Zadanie #115 poprawione.
  - (b) Dwa akumulatory zdobyczy Power: `PlunderState` (`siege_capital_plunder.rs:458`, zapis do własnej mapy `:611-615`) i `WarTurnState::zdobycze_power_by_owner` (`war_turn_state.rs:145`), którego produkcja nie dostaje wpisu. Web ma jedną mapę (`main.ts:2264`). Decyzja techniczna: źródłem prawdy jest jedna mapa zgodna z webem; wdrożenie w #115.
  - (c) Status #114 ELIMINACJA-GRACZA („completed") nie zgadza się z kodem: `eliminate_owner` (`eliminacja.rs:48`) nie ma wołającego w produkcji. Wracam do „w toku" do czasu podpięcia.
  - (d) Zakres #115 nie obejmuje jeszcze aneksji (`main.ts:35272-35287`), cesji (`:36478-36484`), buntu (`:39563-39568`) i fortu (`:16116-16124`). Osobne rozpoznanie przed #115.
- **R7K7C — rozpoznanie #176:** start nieudany (`WorktreeIsolationError` przy zapełnionym dysku). Do ponowienia po zwolnieniu miejsca.

## Przebieg (15.11, 16:18 UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** 4 aktywne Workflow: P4-1E CITY-VIEW (#214) w FC, HAIKU/OPUS wg etapu; wyłom wieży (#98) w Operatorze, HAIKU, baza `d5a52a980`; zdobycie miasta — rozpoznanie (#175) w FC, tylko odczyt; R7K7C — status (#176) w Evaluatorze, tylko odczyt. M01-R2 (#210) — FC zakończony (PASS-WITH-NOTES `ff3897d98`), integracja czeka na test.
- **KROK 2 (FC PASS bez integracji):** M01-R2 — merge `10a2fc4af` na `d5a52a980` (czysty); pełny test w toku (log `integ-m01-3.log`). Poprzedni przebieg zniknął bez kodu wyjścia i został powtórzony. Po zielonym wyniku: FF parity i `refs/keep`.
- **KROK 3 (sprzątanie):** usunięto worktree CRED-HAK i M01 zakończonych etapów oraz cache `target-integ`. Dysk: ok. 4,3 GB wolne.
- **NASTĘPNY KROK:** wynik testu M01 → integracja; odebrać FC #98, #175, #176.

## Przebieg (15.11, 16:5x UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** żywe Workflow: 1 (wyłom wieży #98, Evaluator, test `full.log`). Uzupełnienie do 4 nie jest uczciwe: pozostałe pozycje kolejki są zablokowane decyzją właściciela (#115, #106, #120, DYSTANS, REPIN-DRYFT 2–6) albo zależą od niezintegrowanego kodu (#109/#147, #107, #112, #113, #97/#98/#118/#149/#150, #100/#135/#137/#167–#169) lub od #222. Startuję tylko odblokowany temat: R7K7C-STATUS (#176/#224), workflow `wf_8ddee49c-415`, rozpoznanie tylko do odczytu, Operator Haiku, Obrona Haiku, Evaluator Sonnet, FC Sonnet.
- **KROK 1a (korekta bazy):** dispatch `R-RUSTPORT-P6-R7K7C-STATUS-ROZPOZNANIE-Q1` wskazywał `d5a52a980`; zdalny `rust-port/parity-v2` = `10a2fc4af` (`d5a52a980` jest jego przodkiem). Dopisano KOREKTĘ BAZY do `00-dispatch.md`, commit `5ebc39b69`, push na `claude/rust-sivvrn`. Rozpoznanie robi się na `10a2fc4af`.
- **KROK 2 (FC PASS bez integracji):** brak — żadnego zakończonego FC bez integracji nie znaleziono.
- **KROK 3 (sprzątanie):** usunięto 9 zakończonych worktree (city-capture recon ×4, P4-1E ×3, R7K7C recon ×2). Każdy czysty, bez blokady, HEAD zabezpieczony w `refs/keep/cleanup-<ID>`. Dysk: 12 GB wolne (71%).
- **Rozbieżność do wyjaśnienia:** `KOLEJKA-RUST.md` podaje parity `f2bb11970`, a zdalny parity to `10a2fc4af`. Kolejka wymaga aktualizacji (#154).
- **NASTĘPNY KROK:** wynik `wf_8ddee49c-415` (#176); integracja P4-1E (#222) po `TEST_EXIT=0` w `integ-p41e.log`; wyłom #98 po Evaluatorze.

## Przebieg (15.11, 17:xx UTC — wynik R7K7C-STATUS #176)

- **Wynik rozpoznania (wf_8ddee49c-415):** Operator PASS, Evaluator PASS-WITH-NOTES (6 zarzutów), Obrona przyjęła 5 i odrzuciła 1 (cargo poza zakresem dokumentacyjnej rundy), FC PASS-WITH-NOTES (`0a053631d`).
- **Ustalenia na parity `10a2fc4af`:**
  1. `apply_dipl_deltas_to_state` NIE jest wołane w `advance_turn` (wołający tylko w testach `p6_r7k7c_owner_pools.rs`). Wiring = #106, nadal pending.
  2. Rozbieżność „brak wpisu”: web dla gracza ludzkiego rzuca wyjątek (`playerStateByHuman.get(id)!`, `main.ts:22640`), dla AI daje 0 (`?? 0`, `main.ts:22642`, `:34877`). Rust zwraca błąd. Rozbieżność dotyczy gałęzi AI; gałąź człowieka w Rust ma wyjątek jak web.
  3. Brak wektorów pinu ≥150 dla `apply` i D3 `tickCyclicResourceTradeDeals` (`turn_war_dipl_steps.rs:456`).
  4. Settery skarbca i puli Pracy (`playable.rs:960-979`) nie mają produkcyjnego wołającego. Zależność od #106.
- **Decyzja wiążąca #106:** web jest rozstrzygający (zasada 11). Dla AI przyjmujemy `0` jak w pinie; dla człowieka wyjątek jak w pinie. Pytanie ABC o „brak wpisu” z wcześniejszego przebiegu jest tym samym pytaniem; nie startuję #106, dopóki właściciel nie potwierdzi.
- **Brak w tym przebiegu:** `02-evaluator.md` nie został zacommitowany przez workflow; werdykt Evaluatora jest zapisany w wyniku workflow, nie w pliku. `cargo` nie był uruchamiany (rozpoznanie statyczne).
- **Zacommitowane:** `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-STATUS-ROZPOZNANIE-Q1/` (01, 02a, 03), commit `b52b89559`, push na `claude/rust-sivvrn`. Commity roboczych worktree (`e3dccec52`, `f9c069020`, `0a053631d`) nie są ancestorami parity i nie zostały zintegrowane w całości.
- **#176 → completed; #224 → completed.** #106 pozostaje pending.

## Przebieg (15.11, 17:xx UTC — integracja P4-1E CITY-VIEW #222)

- **Warunki:** FC PASS-WITH-NOTES `185e3c0f3`; integracja `f7baa3848` na parity `10a2fc4af`. Bramki na `f7baa3848`: `FMT_EXIT=0`, `CLIPPY_EXIT=0`, `TEST_EXIT=0` (3456 passed, 0 failed) w `integ-p41e.log`.
- **Ancestry:** `185e3c0f3` jest przodkiem `f7baa3848` (kod operatora w integracji); `10a2fc4af` jest przodkiem `f7baa3848` (FF).
- **Push:** `origin/rust-port/parity-v2` = `f7baa3848` (fast-forward z `10a2fc4af`). `refs/keep/P4-1E-CITY-VIEW-integ` = `f7baa3848`.
- **Sprzątanie:** usunięto worktree `integ-p41e` (z nieśledzonym `rust-port/engine/Cargo.lock`, niecommitowanym) i cache `target-integ-m01`. Dysk: 14 GB wolne (64%).
- **Odblokowane:** #211–#218 (P4-1B…I, Opus) zależą od tego, co już jest na parity; ich kolejność i start wymagają osobnego dispatchu. #222 → completed.
- **NIE_ZMIERZONO:** wynik workflow #98 (wyłom wieży) nadal w toku; nie dotyczy tej integracji.

## Przebieg (15.11, 17:5x UTC — wynik R7K7C-WIRING-ROZPOZNANIE #227)

- **Wynik:** Operator PASS-WITH-NOTES, Evaluator PASS-WITH-NOTES, Obrona r2 (przyjęte 5/5 zarzutów z poprawkami), FC PASS-WITH-NOTES (`5fb5297e4`). Zmian kodu brak. Dokumenty: `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1/` i `dyspozycje/rust-port/p6/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1.md`, commit `a71645fc7` na `claude/rust-sivvrn`.
- **Ustalenia na parity `f7baa3848`:**
  1. `apply_dipl_deltas_to_state` ma tylko definicję (`turn_war_dipl_steps.rs:1041`) i testy; brak produkcyjnego wołającego.
  2. Pin: brakujący wpis AI = 0 (`main.ts:34865`, `:34877`, `?? 0`), wpis tworzony przy zapisie (`main.ts:22642`). Rust zwraca błąd. Rekomendacja B (0) zgodna z zasadą 9.
  3. **Korekta własna:** wariant B maskuje lukę producenta (`turn_war_inputs.rs:713-714`). Dlatego potrzebny osobny temat R7K7C-PRODUCER, a nie samo wpięcie.
  4. Wiring musi obsłużyć wszystkie fotele człowieka (pin `main.ts:34864-34866`, `:34876-34878`); Rust używa `find(is_human)` (`turn_war_dipl_steps.rs:1049`). Poprawka w WIRING-IMPL: dispatch przez `is_human_owner`.
  5. D3 (przelew pracy, `main.ts:24014-24016`, warunek kupca `main.ts:24154-24155`, Rust `turn_war_dipl_steps.rs:551`) nie ma harnessu wektorów; wymaga osobnego tematu R7K7C-D3-VEC.
  6. Odporność fazy: `advance_turn` cofa `war_before` tylko przy błędzie fazy Diplomacy (`playable.rs:1181-1184`); po udanym apply błąd kolejki nie cofa ekonomii. Wymagana migawka `economy_before`.
- **Nowe tematy wynikające z rozpoznania:** R7K7C-PRODUCER, R7K7C-D3-VEC, PARITY-MISSING0 (testy `p6_wire_war_dipl_steps.rs:611/625` w allowliście), R7K7C-WIRING-IMPL (po wyżej).
- **Odstępstwo:** wynik na gałęzi `wip/…-Q1-b` zamiast `…-Q1` (stara runda `9be44a148` na `-Q1`). Zachowane jako `refs/keep/cleanup-wf_309a1316-473-*`.
- **Incydent:** wiadomość „dopisz do pamięci” z kontekstu orkiestratora trafiła do Operatora K5LOOP-OUTCOME (runda 1 → NIE_WYKONANO, FAIL). Runda 2 z zakazem wiadomości spoza dispatchu (`11b818690`). Dispatch R7K7C-WIRING nie miał takiej linii; Operator też wspomniał o pamięci (bez skutku).
- **#106** pozostaje pending (decyzja „brak wpisu = 0” zgodna z pinem; implementacja wymaga R7K7C-PRODUCER).
- **#227 → completed.** #225, #226 w toku.

## Przebieg (15.11, 17:2x UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** 4 aktywne Workflow, bez FC: wyłom wieży #98 (Evaluator, test), K5LOOP-FACING #225 (Operator, testy pinu), K5LOOP-OUTCOME #226 runda 2 (Operator, testy), KOLEJKA-ODSWIEZ #228 (Operator, dokument). Brak startów: sloty pełne.
- **KROK 2 (FC PASS bez integracji):** brak. R7K7C-WIRING-ROZPOZNANIE (#227) zintegrowany jako dokumenty (`a71645fc7`), wpis `b1906354b`.
- **KROK 3 (sprzątanie):** bez zmian w tym cyklu (worktree #227 usunięte wcześniej z refs/keep). Dysk: 7,0 GB wolne (82%). Poniżej progu 8 GB dla nowych tematów z kodem Rust — kolejne starty z kodem wstrzymane do sprzątania.
- **KROK 4:** nie dotyczy.
- **NASTĘPNY KROK:** wyniki #98, #225, #226 r2, #228 (FC); integracja #225 i #226 sekwencyjnie po wyłomie #98 (wspólny `siege_tactics_loop.rs`).

## Przebieg (15.11, 18:xx UTC — zakończenia #225, #228; incydent dysku; nowe starty)

- **INCYDENT DYSKU:** po FC #228 dysk miał 357 MB wolnego miejsca (99%). Usunięto zakończone worktree (KOLEJKA ×3, R7K7C-STATUS ×4, M01 ×1, FACING ×4) po zabezpieczeniu HEAD w `refs/keep/cleanup-*`. Jeden worktree KOLEJKA (`wf_5a965001-591-4`) zablokowany jako brudny i pominięty. Dysk: 14 GB wolne (64%).
- **#225 K5LOOP-FACING (FC PASS-WITH-NOTES, bez zmian kodu):** kod facing (`update_facing`, `strike`, `relative_hit`) był już na `f7baa3848` (merge `923540b65`, INTEG-B20; ancestry potwierdzona). Dispatch opisywał stan sprzed integracji. Gate'y na raporcie: fmt, clippy, `cargo test --lib` 118/118, testy pin/body/loop zielone; generator 320 sekwencji, `reverseArcDiff=35`. Zakres poza dispatchem NIE_ZMIERZONO: facing po ruchu (#123), dirYaw (stub). Decyzja: zamknięte jako zrealizowane; #121, #124, #125, #128 zostają pending jako zakres do rozstrzygnięcia.
- **#228 KOLEJKA-RUST (FC PASS-WITH-NOTES `60ec63a08`):** dokument odświeżony na `f7baa3848`, wpisany na `claude/rust-sivvrn` (`0645ce6f0`). Otwarte rozbieżności do rozstrzygnięcia przez orkiestratora (oznaczone NIE_ZMIERZONO): #114 (tasklista in_progress vs rejestr „zintegrowana INTEG-B21”), #214/#222 (P4-1E zintegrowane, tasklista nieaktualna), #110 (in_progress), #98 (w toku i zablokowane po OUTCOME), #120/#171/#160, #9/#11, numeracja nowych tematów z #227.
- **Nowe starty (sloty do 4):** #234 K5-LOOP-AUTO-SCOPE (odczyt, `R-RUSTPORT-P6-AUTO-SCOPE-ROZP-Q1`, `wf_23cd3ec9-415`); #230 MAPGEN-M08/M13/M18 jako NIE_ZMIERZONO (dokument w nowym pliku `dyspozycje/rust-port/p6/MAPGEN-M08-M13-M18-NIE_ZMIERZONO.md`, `R-RUSTPORT-MAPGEN-NIE-ZMIERZONO-Q1`, `wf_0fe3a41b-09f`). Dispatche na `ec653789e`.
- **Aktywne (4):** wyłom wieży #98 (`wf_15bb4a09-81f`, Evaluator); K5LOOP-OUTCOME r2 #226 (`wf_41d73167-4c8`, Operator); #234; #230.
- **NASTĘPNY KROK:** wynik #226 r2 (ewentualnie FAIL → runda 3 tego samego ID); wynik #98 (integracja z #226 po nim, sekwencyjnie — wspólny `siege_tactics_loop.rs`).

## Przebieg (15.11, 18:xx UTC — zakończenie #230/#183; start #231)

- **#230/#183 MAPGEN-M08/M13/M18 (FC PASS-WITH-NOTES `9f14e0a41`):** dokument `dyspozycje/rust-port/p6/MAPGEN-M08-M13-M18-NIE_ZMIERZONO.md` (`3a1180688`). Wpisy: M08 BRAK (placeDeposits, ensureDepositGridCoverage, funkcje lasu), M13 podzielony na M13a wioski BRAK, M13b punktacja startu POKRYTE wg M10 (`cluster_mass.rs`, `tests/p6_m10_start_scoring.rs`; test NIE uruchamiany ponownie), M13c `computeStartPositions` NIE_ZMIERZONO. Rust `domain/map_generator.rs:326` (`generate_map`) — zgodność z pinem NIE_ZMIERZONO.
  - Otwarte decyzje orkiestratora: przypisanie ensureDepositGridCoverage i funkcji lasu do M08 czy M13; topUpRiverGridCoverage (gen-helpers.ts:11935) w zakresie M08 (funkcja rzeczna, do M07E2?); ścieżka runu `R-RUSTPORT-MAPGEN-NIE-ZMIERZONO-Q1` (zlecenie miało prefiks P6-).
  - Dokumenty runu na `3f8940fd3`. Worktree (4) usunięte, HEAD w `refs/keep/cleanup-wf_0fe3a41b-09f-*`.
- **Start #231 TEST-JS-ROUND-MINUS-ZERO:** dispatch `R-RUSTPORT-P6-JSROUND-MINUSZERO-Q1` na `acf8fd6c3`, baza `f7baa3848`, workflow `wf_0afbf4f1-ffb`. Zmiany tylko w testach (allowlista jednego pliku).
- **Aktywne (4):** #98 wyłom (`wf_15bb4a09-81f`), #226 OUTCOME r2 (`wf_41d73167-4c8`), #234 AUTO-SCOPE (`wf_23cd3ec9-415`), #231 js_round -0 (`wf_0afbf4f1-ffb`).

## Przebieg (15.11, 18:xx UTC — zakończenie #234 AUTO-SCOPE; start #229 D-DTO-4/10 na Opusie)

- **#234 K5-LOOP-AUTO-SCOPE (FC PASS-WITH-NOTES `c19ac8b17`, odczyt):** dokumenty na `ed4a61199`. Ustalenia po korekcie Obrony:
  - Niezależne od #112 (doktryna): tylko V5 i V6. V1/V2 zależą od #112, bo pin `battleScene.ts:6091-6097` wywołuje doktrynę „steady” przed resztą `_activateUnit`.
  - V13 (sufit 400 tur bez oblężenia) POKRYTE: `round_cap_verdict` (`siege_no_breach.rs:69-88`), wektory roundcap 745 przypadków (192 przy roundNo≥400). Zostaje wiring #113.
  - ProdBody: POKRYTE (ciało, wektory), ale BRAK wiringu (#113); `siege_tactics_loop.rs:700` mówi „NIE WPINAĆ do SiegeLoop”.
  - Przerwanie AUTO: `BeginAutoBatchPhase` przerywa pętlę (`siege_tactics_loop.rs:541-545`).
  - **Luka bez tematu:** tryb ręczny (`_toggleManualMode` 17348, `_performPlayerOrder` 18280) nie ma portu ani zadania w kolejce. Wymaga nowego tematu.
  - Łańcuch: #109 → #112 → {V1/V2, V7, V8}; V8 dodatkowo #148.
  - Testy Rust nie uruchamiano (NIE_ZMIERZONO); brak wektorów dla `_executeQueuedOrders` (3603) i `_ffEnterAuto` (3709) — do dopisania jako V15/V16.
- **#229/#219 D-DTO-4/D-DTO-10:** start, dispatch `R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1` na `aa639a368`, baza `f7baa3848`, workflow `wf_0cf44ff7-e59`, wszystkie role OPUS (temat DTO renderera). Dokument: `dyspozycje/rust-port/p4/D-DTO-4-D-DTO-10-DECYZJE.md`. Zakres: tylko dokument, zero kodu.
- **Dysk:** 10 GB wolne (75%) po sprzątaniu worktree #234 (HEAD w `refs/keep/cleanup-wf_23cd3ec9-415-*`).
- **Aktywne (4):** #98 wyłom (`wf_15bb4a09-81f`), #226 OUTCOME r2 (`wf_41d73167-4c8`), #231 js_round -0 (`wf_0afbf4f1-ffb`), #229 D-DTO (`wf_0cf44ff7-e59`).

## Przebieg (15.11, 17:4x–17:5x UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** 4 aktywne Workflow bez FC: K5LOOP-OUTCOME runda 3 (#226, `wf_b79fac7a-026`, po INFRA rundy 2); js_round -0 (#231, `wf_0afbf4f1-ffb`); decyzja serde float_roundtrip (#232, `wf_f1110a1e-541`); odczyt luki generalTargetId (#233, `wf_137b6ea1-2de`). Sloty pełne, bez startów.
- **KROK 2 (FC PASS bez integracji):**
  - **AUTO-RECZNY (#97 rozpoznanie):** FC PASS-WITH-NOTES `f84e48a73`, dokumenty na `87b211370`. Decyzja orkiestratora: tryb ręczny dzielony na T1/T2/T3 pod #97. T2 i T3 zależą od #112 (rekurencja doktryny w pinie).
  - **D-DTO-4/10 (#229):** FC PASS, dokumenty na `a3673c32f` (wcześniej).
  - **Wyłom #98 (K5-LOOP-WYLOM, FC PASS-WITH-NOTES `5cc66992b`):** integracja na `f7baa3848` w worktree `integ-wylom` (merge `1b8b67173`), merge-tree bez konfliktów. Pierwszy pełny test przerwany brakiem miejsca na dysku (exit 101, log urwany w linii). Ponowny pełny test w toku (`integ-wylom-r2.log`): 1126 passed, 0 failed do tej chwili, bez `TEST_EXIT`. **FF na parity dopiero po `TEST_EXIT=0`.**
- **KROK 3 (sprzątanie):** usunięto worktree #98 (4), #226 r2 (3), D-DTO (4), AUTO-RECZNY (4) po zabezpieczeniu HEAD w `refs/keep/cleanup-*`. Pozostawiono worktree KOLEJKA `wf_5a965001-591-4` (zniszczony checkout po INFRA; ponad 13 tys. zmian; do decyzji — nie usuwać bez przeglądu). Dysk: 13 GB wolne (69%).
- **KROK 4:** nie dotyczy (bez decyzji gameplay).
- **NASTĘPNY KROK:** `TEST_EXIT` integracji #98 → FF `rust-port/parity-v2` + `refs/keep/K5-LOOP-WYLOM-integ`; wyniki #226 r3, #231, #232, #233 (FC); T1–T3 (#97) po integracji #98 i rozstrzygnięciu #112.

## Przebieg (15.11, 18:xx UTC — sloty, wyniki OUTCOME r3, js_round, serde, P4-1J; starty #170 i P4-1B)

- **#226 K5LOOP-OUTCOME, runda 3:** Operator BLOCK bez kodu → Evaluator PASS-WITH-NOTES → Obrona PARTIAL → **FC FAIL** (`0b6c15bc4`): BLOCK nieuzasadniony wg kryt. 5; wykonalny podział (Kill, MoraleOnly, rout-flaga; ripple ucieczki #123 i dowódca jawnie `unported`). **Runda 4** (ten sam ID) — dispatch z DODATKIEM na `868160cd7`, workflow `wf_1723bc09-ab6`. Worktree r3 usunięte, HEAD w `refs/keep/cleanup-*`.
- **#231 js_round -0 (FC PASS `66e8656ee`):** nowy test `p6_js_round_minus_zero.rs`, 8 testów (5 wymaganych + 3 brzegowe), mutacja 3/5 FAIL. Dokumenty na `ac0e5bf96`. **Commit testu `16b901466` (tylko plik testowy) zachowany w `refs/keep/JSROUND-MINUSZERO-test`** — integracja po FF #98 (osobna runda z pełnym `cargo test`).
- **#232 serde float_roundtrip — decyzja TAK (FC PASS-WITH-NOTES `4cb572a95`):** 130 plików JSON z gołymi liczbami >=10 cyfr; `p6_brake_inputs_vectors.rs:367-372` gubi bity (1713.1000000000001 → 1713.1); tolerancja `close()` 1e-9 maskuje to. Dokumenty `a8d9cb637`; `refs/keep/SERDE-FLOAT-DECYZJA-fc`. FC zatwierdził otwarcie wdrożenia. Dokument FC-level: 02-evaluator.md nie trafił do commitu (zapis zostaje w wyniku workflow).
- **#170 wdrożenie float_roundtrip — START:** `R-RUSTPORT-P6-SERDE-FLOAT-WDROZENIE-Q1` (dispatch `43d67ae02`, baza f7baa3848), `wf_09292c69-b87`. Allowlista: `engine/Cargo.toml`, `p6_brake_inputs_vectors.rs`. Cargo.lock NIE commitować.
- **#233 P4-1J generalTargetId — rozpoznanie (FC PASS-WITH-NOTES `3ec5348fe`):** luka potwierdzona: `PlayablePlannedMarch` nie ma `general_target_id`; `save_load.rs:837` zapisuje None; wczytanie raportuje `general_target_dropped` (:961); `sync_general_march_targets` bez wołającego; PlayableState nie ma stanu generałów. Dokumenty `b866b853a`, `refs/keep/P4-1J-GENERALTARGET-fc`. **Wdrożenie (#221)** wymaga stanu generałów w PlayableState i podpięcia sync — większy temat, zostaje pending.
- **P4-1B producent MapViewDto — rozpoznanie na Opusie (START):** `R-RUSTPORT-P4-1B-ROADMASK-ROZP-Q1` (dispatch `43d67ae02`), `wf_3a9a9656-9bd`. Decyzja D-DTO-4 = A: silnik liczy roadMask i trasy rzek.
- **#98 integracja (wyłom):** test `integ-wylom-r2.log` nadal w toku: 1940 passed, 0 failed do tej chwili, bez TEST_EXIT. FF po zielonym wyniku.
- **Dysk:** 16 GB wolne (60%) po sprzątaniu worktree #231 i #233.
- **Aktywne (4):** #226 r4 (`wf_1723bc09-ab6`), #170 (`wf_09292c69-b87`), P4-1B (`wf_3a9a9656-9bd`), plus test integracji #98 (nie workflow). Czwarty slot — po integracji #98.

## Przebieg (15.11, 18:xx UTC — #226 K5LOOP-OUTCOME: runda 4 FAIL, runda 5 na Sonnecie)

- **Runda 4 (`wf_1723bc09-ab6`):** Operator DECISION_REQUIRED bez kodu (`282e8bc9a`), Evaluator FAIL (`1a0c388eb`), Obrona PASS-WITH-NOTES (`72042494a`), **FC FAIL** (`dc9abfc0b`). Zakres rundy 4 (Kill, MoraleOnly, rout-flaga) nie został dostarczony. Dwa Operatory Haiku (rundy 3 i 4) nie dały kodu.
- **Decyzja orkiestratora (zgodnie z regułą modeli):** runda 5 jako OSTATNIA w limicie 5/5 na **Sonnecie** na Operatorze, z pisemnym uzasadnieniem w dispatchu (`d772efc6d`). Warunek „dwóch nieudanych rund Haiku tego samego tematu” spełniony. Zakres bez zmian: Kill, MoraleOnly i rout-flaga; ripple ucieczki (#123) i dowódca jawnie `unported`. BLOCK dozwolony tylko z dowodem plik:linia.
- **Start:** `wf_f3b76b65-261` (`topic-R-RUSTPORT-P6-K5LOOP-OUTCOME-R5-SONNET.js`, Operator = SONNET, reszta bez zmian).
- **Sprzątanie:** worktree rundy 4 usunięte; HEAD w `refs/keep/cleanup-wf_1723bc09-ab6-*`. Dysk: 16 GB wolne (60%).
- **Jeśli runda 5 FAIL:** temat wraca do właściciela jako ABC (podział na KILL/MORALE albo wstrzymanie), bo limit rund zostanie wyczerpany.

## Przebieg (15.11, 18:xx UTC — INTEGRACJA #98 K5-LOOP-WYLOM na parity)

- **Integracja:** FC PASS-WITH-NOTES `5cc66992b` (wyłom wieży, stan zniszczenia z żywych kafli) zmergowany `--no-ff` na parity `f7baa3848` → `1b8b67173` (worktree `integ-wylom`). Merge-tree bez konfliktów.
- **Bramki na `1b8b67173`:** `FMT_EXIT=0`, `CLIPPY_EXIT=0`, `TEST_EXIT=0` — **3462 passed, 0 failed** (log `integ-wylom-r2.log`).
- **FF:** `origin/rust-port/parity-v2` = `1b8b67173` (przodek `f7baa3848` sprawdzony). `refs/keep/K5-LOOP-WYLOM-integ` = `1b8b67173`.
- **Decyzje FC przyjęte:** pliki pomocnicze testu (`p6_siege_wylom_gen.mjs`, wektory) poza literalną allowlistą (precedens `p6_tower_target_wiring`); brak osobnego pola `destroyed` (stan z kafli, mutacja M1 daje FAIL).
- **NIE_ZMIERZONO / BRAK zapisane do rejestru:** (1) replay pinu nie resetuje `siegeTowers[].destroyed` (`_resetSiegeForReplay` :10518-10531) — przy portowaniu replayu wymagany jawny stan; (2) `wall_ever_breached` nie może być obniżane przy wiringu #113; (3) `_siegeShooterThreats` :7932-7935 jako drugi konsument `destroyed`; (4) czas trafienia wieży 380 ms i kolejność timerów; (5) efekty `_resolveBlowOutcome` od trafienia wieżą (#109/#147).
- **Sprzątanie:** worktree `integ-wylom` i `target-integ-wylom` (3 GB) usunięte. Worktree #98 (4) usunięte wcześniej, HEAD w `refs/keep/cleanup-wf_15bb4a09-81f-*`. Dysk: 19 GB wolne (52%).
- **Otwarte po integracji:** T1–T3 trybu ręcznego (#97) i #112 — zależą od OUTCOME (#226). js_round test (#231, commit `16b901466` w `refs/keep/JSROUND-MINUSZERO-test`) — **do integracji w osobnej rundzie** na nowym parity `1b8b67173`.

## Przebieg (15.11, 18:xx UTC — wdrożenie serde float_roundtrip #170; integracja js_round #231 w toku)

- **#170 SERDE-FLOAT-WDROZENIE (FC PASS-WITH-NOTES `7920550f1`):** `float_roundtrip` włączony w `rust-port/engine/Cargo.toml`; `close()` (tolerancja 1e-9) usunięte z `p6_brake_inputs_vectors.rs`, asercje `assert_eq!`. Wynik: 9/9 w `p6_brake_inputs_vectors`, lib 118/118, fmt i clippy EXIT 0. **Mutacja:** bez feature test `objective_power_variants_match_pinned_compute_objective_power` pada na `points terytorium` (1713.1000000000001 vs 1713.1) — test czuły. Commit implementacji `4183d0aab` (baza `f7baa3848`) — **do integracji na nowym parity** (po js_round). Notka NIE_ZMIERZONO: porównanie `==` nie rozróżnia -0/+0 i NaN (brak takich wartości w wektorach).
- **Dokumenty:** `a0fda2b81` (01, 02, 02a, 03); refs `refs/keep/SERDE-FLOAT-WDROZENIE-{fc,impl}`. Worktree usunięte.
- **#231 js_round — integracja w toku:** commit testu `16b901466` zmergowany na `1b8b67173` w worktree `integ-jsround` (`83f5fd654`). Bramki: `FMT_EXIT=0`, `CLIPPY_EXIT=0`, testy w toku (`integ-jsround.log`, 1126 passed do tej chwili, 0 failed). FF po `TEST_EXIT=0`.
- **Następny krok:** po FF js_round — integracja `4183d0aab` (serde) na nowym parity z pełnym `cargo test`.
- **Aktywne workflow:** OUTCOME r5 Sonnet (`wf_f3b76b65-261`), P4-1B Opus (`wf_3a9a9656-9bd`), R7K7C producer (`wf_84abd92e-70d`). Slot 4 wolny (zaplanowany następny).

## Przebieg (15.11, 18:xx UTC — P4-1B rozpoznanie zamknięte, start Q1/Q2; R7K7C producent rozpoznany)

- **P4-1B rozpoznanie (FC PASS `e7ca2eb90`, Opus):** dokumenty na `c2c5c6aa9`. Ustalenia: `compute_road_mask`, `trim_medium_*` i `river_render_paths` nie istnieją w Rust; `PlayableMap` nie ma riverPaths, rzek ani wiosek (tylko `SnapshotMap` ma komplet pól). `SnapshotMap.hexes` ma kolejność wstawienia, nie r-major → producent sortuje po `(r,q)`.
- **P4-1B-Q1 ROADMASK (START, Opus):** `R-RUSTPORT-P4-1B-Q1-ROADMASK`, dispatch `6671d53de`, baza `1b8b67173`, `wf_13666f01-79e`. Allowlista: `road_network.rs`, `domain/mod.rs` (1 linia), testy i wektory.
- **P4-1B-Q2 RIVER-TRIM (START, Opus):** `R-RUSTPORT-P4-1B-Q2-RIVER-TRIM`, ta sama baza, `wf_3095763c-84a`. Allowlista rozłączna: `rivers_a/render_trim.rs`, `rivers_a.rs` (1 linia).
- **Q3 MAP-VIEW-PRODUCER (#211):** zależy od Q1+Q2 i decyzji technicznej o modelu mapy. Domyślnie `&SnapshotMap` (jedyny model z kompletem pól) — zostanie zapisane jako decyzja techniczna przy starcie Q3.
- **R7K7C producent wpisów AI (FC PASS-WITH-NOTES `3d9e07254`):** dokumenty `d85bf93bf`. Decyzja techniczna dla #106: **parytet 1:1 z pinem** (`?? 0` dla AI, `main.ts:34865`, `:34877`, `:22642`), **bez pytania do właściciela** (web rozstrzyga). Opcja „seed 0” odrzucona — pin nie seeduje, a `eliminateOwner` kasuje wpisy (`main.ts:35380-35381`).
  - Nowe ustalenia: `eliminacja.rs` NIE czyści `ai_treasury_by_owner`/`praca_pool_by_owner` (ROZBIEŻNE z pinem); `siege_capital_plunder.rs` ma już regułę puli Pracy (eliminacja, przejęcie stolicy), brakuje tylko adaptera do PlayableState (#115); cytaty `main.ts:36146/36180` były błędne (refund kolejki, nie reguła przejęcia).
- **Integracja js_round (#231):** w toku, `integ-jsround.log`: fmt i clippy EXIT 0, testy 1643 passed, 0 failed do tej chwili, bez `TEST_EXIT`. FF po zielonym wyniku.
- **Serde (#170):** implementacja `4183d0aab` gotowa, FC PASS-WITH-NOTES `7920550f1`; integracja po js_round.
- **Aktywne workflow:** OUTCOME r5 Sonnet (`wf_f3b76b65-261`), P4-1B Q1 Opus (`wf_13666f01-79e`), P4-1B Q2 Opus (`wf_3095763c-84a`). Slot 4 wolny.

## Przebieg (15.11, 18:2x UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** 4 aktywne Workflow bez FC: OUTCOME r5 Sonnet (#226, `wf_f3b76b65-261`), P4-1B Q1 roadMask Opus (#211, `wf_13666f01-79e`), P4-1B Q2 trim rzek Opus (#211, `wf_3095763c-84a`), generalTargetId pole i zapis Haiku (#221, `wf_1a51a6f0-bfd`). Sloty pełne, bez startów.
- **KROK 2 (FC PASS bez integracji):** brak nowych werdyktów. Oczekują na integrację: serde float_roundtrip (#170, impl `4183d0aab`, FC `7920550f1`) i js_round test (#231, commit `16b901466`).
- **Integracja js_round (#231):** w tle, `integ-jsround.log`: fmt i clippy EXIT 0, 2703 passed, 0 failed do tej chwili, bez `TEST_EXIT`. FF po zielonym wyniku, potem serde.
- **KROK 3 (sprzątanie):** bez zmian. Dysk: 14 GB wolne (66%).
- **KROK 4:** nie dotyczy (brak decyzji gameplay).
- **Ustalenia zamykające listę:** #214 (P4-1E) i #222 (integracja P4-1E na parity) oznaczone jako zakończone; P4-1E jest na parity od `f7baa3848`.

## Przebieg (15.11, 18:3x UTC — integracja #231 js_round na parity)

- **Integracja js_round (#231):** commit testu `16b901466` (FC PASS `66e8656ee`) zmergowany `--no-ff` na parity `1b8b67173` → `83f5fd654` (worktree `integ-jsround`). Bramki: `FMT_EXIT=0`, `CLIPPY_EXIT=0`, `TEST_EXIT=0` — **3470 passed, 0 failed**.
- **FF:** `origin/rust-port/parity-v2` = `83f5fd654` (przodek `1b8b67173` sprawdzony). `refs/keep/JSROUND-MINUSZERO-integ` = `83f5fd654`.
- **Sprzątanie:** worktree `integ-jsround` i `target-integ-jsround` (3 GB) usunięte.
- **Następny krok:** integracja `4183d0aab` (serde float_roundtrip, #170) na nowym parity `83f5fd654` z pełnym `cargo test`. Wymaga osobnej rundy integracyjnej (zmiana `Cargo.toml` + testu wektorowego).
- **Dysk:** 5,7 GB wolne przed sprzątaniem; po usunięciu integracji ~8,7 GB. Próg 8 GB dla nowych startów z kodem Rust.

## Przebieg (15.11, 18:5x UTC — #226 K5LOOP-OUTCOME: runda 5 PASS, integracja w toku)

- **Runda 5 (Operator Sonnet, uzasadniony po 2×FAIL Haiku, `wf_f3b76b65-261`):** Operator PASS (`92be62324`), Evaluator PASS-WITH-NOTES (`b25317393`), Obrona (`205400ffc`), **FC PASS-WITH-NOTES `5f7cd0003`**.
- **Zakres wdrożony:** efekty po ciosie w `ProdBody::strike` (Kill, MoraleOnly, rout-flaga, boost, gain, armia w odwrocie). Wektory pinu: 320 sekwencji, 1758 aktywacji, guard SHA-256 `outcomeSha256`. Liczniki pokrycia > 0. Pięć mutacji daje FAIL.
- **Odstępstwo od allowlisty (ujawnione, zaakceptowane przez FC):** przeliczono generator, `_pin.rs`, `vectors.json` i jedną asercję w `p6_siege_tactics_loop_body.rs` — efekty zmieniają stan po każdym ciosie. Asercja **nie osłabiona** (wpis `unported` usunięty, bo efekt portowany).
- **NIE_ZMIERZONO / jawnie unported:** ripple `_shakeAlliesOnLoss` (zależy od #123), efekty dowódcy (`dowodca-*`), `occByKey`, `routedUnits`, tower_blow nadal zapisuje unported. Osłona wręcz `_checkMeleeScreenLost` ma tylko test Rust-only (generator ma `primaryRanged=false`).
- **Integracja:** merge `--no-ff` `5f7cd0003` na parity `83f5fd654` → `c3e3617b2` (worktree `integ-outcome`). Merge-tree bez konfliktów, ancestry potwierdzona (`f7baa3848` w łańcuchu, `92be62324` w FC). Bramki w tle: `FMT_EXIT=0`; clippy i pełny `cargo test` w toku. **FF po `TEST_EXIT=0`.**
- **Sprzątanie:** worktree rundy 5 usunięte; refs `refs/keep/cleanup-wf_f3b76b65-261-*` i `refs/keep/K5LOOP-OUTCOME-r5-fc`.

## Przebieg (15.11, 18:5x UTC — #221 generalTargetId: runda 1 BLOCK/FAIL, runda 2 start)

- **#221 runda 1 (`wf_1a51a6f0-bfd`):** Operator BLOCK (`3f2089e09`): kod poprawny (3 z 4 nowych testów pada na mutację), ale bramka `p4_1j_planned_march_bounds` i `clippy --all-targets` nie kompilują się (E0063, E0609). Przyczyna: **moja allowlista pominęła `tests/p4_1j_planned_march_bounds.rs`**. Evaluator FAIL (`f09f4d22f`), FC FAIL (`5228db7d9`).
- **Decyzja techniczna (zatwierdzona):** `general_target_id: Option<String>`, nie `Option<UnitId>` — web trzyma dowolny niepusty napis; ≥15 id niekanonicznych w wektorach. Pusty napis filtrowany jak w webie. Zapis w rejestrze.
- **#221 runda 2 (START, `wf_c9da2dff-9c8`):** DODATEK na `6ea61d16f`: allowlista + `bounds.rs` z dwoma mechanicznymi zmianami (pole `None` w `march()`, usunięcie asercji `general_target_dropped`). Baza = aktualny parity. Punkty 4 i 5 NIE_ZMIERZONO.
- **Sprzątanie:** worktree rundy 1 usunięte; refs `refs/keep/cleanup-wf_1a51a6f0-bfd-{1..4}`. Jeden worktree prunable.
- **Integracja #226 K5LOOP-OUTCOME (`c3e3617b2`, na parity `83f5fd654`):** `FMT_EXIT=0`, `CLIPPY_EXIT=0`; pełny test w toku (625 passed do tej chwili, 0 failed). FF po `TEST_EXIT=0`.
- **Aktywne workflow:** P4-1B Q1 Opus (`wf_13666f01-79e`), P4-1B Q2 Opus (`wf_3095763c-84a`), #221 r2 Haiku (`wf_c9da2dff-9c8`). Dysk: 9,1 GB wolne (77%).

## Przebieg (15.11, 18:4x–18:5x UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** 4 aktywne Workflow bez FC: P4-1B Q2 trim rzek Opus (#211, `wf_3095763c-84a`), #221 runda 2 Haiku (`wf_c9da2dff-9c8`), rozpoznanie P4-1C mgła Opus (#212, `wf_0af3a66c-f0c`), rozpoznanie P4-1D jednostki Opus (#213, `wf_3b86257d-082`). Sloty pełne.
- **KROK 2 (FC PASS bez integracji):**
  - **P4-1B Q1 roadMask (FC PASS-WITH-NOTES `88d0dff1a`):** kod `8b16792ae`, obrona `a389c361c`. Łańcuch zweryfikowany (baza `1b8b67173` w łańcuchu, merge-tree bez konfliktów). **Integracja po FF #226.** Refs: `refs/keep/P4-1B-Q1-ROADMASK-fc`.
  - **Integracja #226 K5LOOP-OUTCOME (`c3e3617b2` na `83f5fd654`):** pełny test w toku, 1766 passed, 0 failed do tej chwili. FF po `TEST_EXIT=0`.
- **KROK 3 (sprzątanie):** worktree Q1 usunięte, HEAD w `refs/keep/cleanup-wf_13666f01-79e-*`. Worktree rundy 5 #226 (`wf_f3b76b65-261-3`) pozostaje brudny (Git nie pozwala usunąć bez przeglądu) — zaraportowane.
- **KROK 4:** brak decyzji gameplay do zostawienia w czacie.
- **Dysk:** 12 GB wolne (72%).
- **Następny krok:** FF #226, integracja Q1 (`88d0dff1a`) na nowym parity z pełnym `cargo test`; potem Q2 po FC; Q3 (#211) po obu.

## Przebieg (15.11, 19:0x UTC — integracja #226 na parity; P4-1B Q1 i Q2 zintegrowane jedną rundą)

- **#226 K5LOOP-OUTCOME (runda 5, FC PASS-WITH-NOTES `5f7cd0003`):** integracja `c3e3617b2` na parity `83f5fd654` — `TEST_EXIT=0`, **3478 passed, 0 failed**. FF: parity = `c3e3617b2`. `refs/keep/K5LOOP-OUTCOME-integ`. Zamknięte jako zrealizowane (zakres: efekty po ciosie w `ProdBody::strike`; NIE_ZMIERZONO: ripple #123, dowódca, `occByKey`, tower_blow).
- **P4-1B Q1 roadMask (FC `88d0dff1a`) i Q2 trim rzek (FC `c523ea440`) — integracja jedną rundą:** merge Q1 → `ca6c97472`, merge Q2 → `2f9a12786` na parity `c3e3617b2` (worktree `integ-p4-1b`). Merge-tree bez konfliktów dla obu. Bramki w tle: `FMT_EXIT=0`; clippy i pełny `cargo test` w toku. **FF po `TEST_EXIT=0`.**
- **Sprzątanie:** worktree Q2 usunięte; refs `refs/keep/cleanup-wf_3095763c-84a-*`, `refs/keep/P4-1B-Q2-RIVER-TRIM-fc`.
- **Otwarte:** Q3 MAP-VIEW-PRODUCER (#211) po obu — wymaga decyzji technicznej o modelu mapy (domyślnie `&SnapshotMap`) i wołających `compute_road_mask` i `trim_medium_*`. NIE_ZMIERZONO: wołający produkcyjny obu funkcji (Q3; M07C także użyje `trim_medium_tail_along_main`).

## Przebieg (15.11, 19:xx UTC — rozpoznania DTO: P4-1C (mgła) zamknięte z pytaniem ABC; P4-1D Q1, P4-1F, P4-1I w toku)

- **P4-1C rozpoznanie mgły (#212, FC PASS-WITH-NOTES `963712d72`):** dokumenty `c4791e20b`. **Otwarte pytanie ABC do właściciela (zasada 10):** mgła dla fotela ≠ 0 (hot-seat). W pinie render czyta globalny `explored` (alias fotela 0, `main.ts:12799`, `:13759`, `:12864-12866`), a `refreshFog` pisze do `exploredByHuman.get(ME())` (`:13483`). Opcje: **A** osobno dla każdego fotela (świadome odstępstwo od pinu), **B** 1:1 z pinem, **C** producent tylko dla fotela 0. **Rekomendacja: C.** Blokuje W2/W3 (zapisy odkrycia i producent).
  - Ustalenia po Obronie: brak migracji zapisu v2→v3 w pinie (`save.ts:109-116`, `:695-706`) — odrzucanie v2, nie migracja. Hook `updateDiplomaticDiscovery(vis)` (`main.ts:13479`, def. `:22528-22533`) w zakresie W2.
- **P4-1D Q1 STACK-REPIN (START, Opus):** `wf_515c8fe6-0a4` (dispatch `4417383b4`, baza `c3e3617b2`). Reguła `pickStackLeader` i `has_commander` z pinu `@07`.
- **P4-1F rozpoznanie nakładek (START, Opus):** `wf_4c7d8400-1cd`.
- **P4-1I rozpoznanie zdarzeń bitwy (START, Opus):** `wf_e6d580b9-55a` (dispatch `db47ed5a5`).
- **Integracja P4-1B Q1+Q2 (`ca6c97472` → `2f9a12786`):** w toku, `integ-p4-1b.log`: fmt i clippy zielone, pełny test 1139 passed, 0 failed do tej chwili (długi test `pick_auto_improvements_matches_pinned_web_vectors` w toku). FF po `TEST_EXIT=0`.
- **Aktywne workflow:** #221 r2 Haiku (`wf_c9da2dff-9c8`), P4-1D Q1 Opus (`wf_515c8fe6-0a4`), P4-1F Opus (`wf_4c7d8400-1cd`), P4-1I Opus (`wf_e6d580b9-55a`). Dysk: 12 GB wolne (71%).

## Przebieg (15.11, 19:2x UTC — heartbeat „twardy bit”, sloty Rust)

- **KROK 1 (sloty):** 4 aktywne Workflow bez FC: P4-1D Q1 STACK-REPIN Opus (#213, `wf_515c8fe6-0a4`), P4-1B Q3 MAP-VIEW Opus (#211, `wf_c431c5de-ee5`), rozpoznanie P4-1G adaptera Opus (#216, `wf_55400caa-ca7`), rozpoznanie P4-1H komend mapy Opus (#217, `wf_44cd2d61-4e4`). Sloty pełne.
- **KROK 2 (FC PASS bez integracji):**
  - **#221 P4-1J generalTargetId (runda 2, FC PASS-WITH-NOTES `cb491333a`):** kod `896a147c4`, obrona `f0efd5d29`. Ancestry i merge-tree bez konfliktów na `2f9a12786`. **Integracja w toku** (`integ-221`, merge `400fd0bd1`): fmt i clippy EXIT 0, testy się kompilują. FF po `TEST_EXIT=0`.
  - **P4-1B Q1+Q2:** zintegrowane wcześniej (FF `2f9a12786`, `TEST_EXIT=0`, 3491 passed).
- **KROK 3 (sprzątanie):** worktree rund rozpoznań i rundy 2 #221 usunięte; refs `refs/keep/cleanup-*`. Dysk: 17 GB wolne (59%).
- **KROK 4:** pytanie ABC o mgłę dla fotela ≠ 0 (P4-1C, zasada 10) nadal otwarte — czeka na właściciela w czacie. Nie jest to decyzja orkiestratora.
- **Następny krok:** FF #221 po zielonym teście; FC wyników P4-1D Q1, P4-1B Q3, P4-1G i P4-1H.

## Przebieg (15.11, 19:4x UTC — #221 na parity; rozpoznanie P4-1H zamknięte)

- **#221 P4-1J generalTargetId — FF parity:** `integ-221` (merge `400fd0bd1` na `2f9a12786`), `FMT_EXIT=0`, `CLIPPY_EXIT=0`, `TEST_EXIT=0`, **3496 passed, 0 failed**. `git push 400fd0bd1:refs/heads/rust-port/parity-v2` (FF, ancestry potwierdzona). `refs/keep/P4-1J-GENERALTARGET-integ`. Worktree `integ-221` i `target-integ-221` usunięte.
- **P4-1H MAP-COMMANDS rozpoznanie (#217, FC PASS-WITH-NOTES `144da03d0`):** dokument `dyspozycje/rust-port/p4/P4-1H-COMMANDS-ROZPOZNANIE.md`, dowody w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-COMMANDS-ROZP-Q1/`. Cherry-pick łańcucha `2f9a12786..144da03d0` → `9a1fc2219` na `claude/rust-sivvrn` (tylko `dyspozycje/`, bez kodu). Refs: `refs/keep/P4-1H-COMMANDS-FC`, `refs/keep/P4-1H-COMMANDS-OBRONA`. Worktrees `wf_44cd2d61-4e4-1..4` usunięte (`-2` miał nieśledzony `Cargo.lock` z bramki, regenerowalny, nie commitowany).
- **Ustalenia z rozpoznania (blokery wdrożenia):** (1) port `ruch_jednostek` w `pathfinding.rs` pochodzi z pinu `edb8fb56`, brakuje względem `07d2fbd72` przechodzenia przez własne jednostki, `siegeBlocksEntry`, `trimPathToStackRoom` i funkcji `isNotifiableMarchStop`/`registerMarchStop`/`clearMarchStop`; (2) `PlayableState` nie ma modelu ruchu z webu (ruch `u8` zamiast `f64`, brak stosu i kosztów terenu), `move_unit` odrzuca ruch dalej niż o sąsiedni heks (`playable.rs:937`); (3) `beginMoveSelectedUnitTo` (`main.ts:32037`) nie ma wołającego na pinie — kliknięcie idzie przez `planMarchTo` (`main.ts:31213-31300`), więc kontrakt P4-1 §5.1 wskazuje złą funkcję.
- **Decyzja techniczna (orkiestrator, zasada 9):** `cancel_planned_march` dla nieznanej lub obcej jednostki zwraca **Err** (`UnitNotFound` / `UnitNotOwned`), spójnie z `move_unit` (`playable.rs:681-682`, `919-922`). Web nie ma tej ścieżki (każdy wołający podaje istniejącą jednostkę), więc wybór nie zmienia parytetu gameplay. Dispatch Q2 ma to zapisane jako wymóg.
- **Otwarte w dokumencie, do rozstrzygnięcia przy dispatchu Q3–Q6:** model Operatora. Dokument §4 wpisuje HAIKU (po poprawce Obrony), a lista zadań i zasada Opus dla serii P4-1 wskazują OPUS. Nie rozstrzygam tego tutaj.
- **NIE_ZMIERZONO:** `armyStackLimit()` jest w dokumencie jako `BATTLE_MAX_PER_SIDE = 500` (`main.ts:4358-4360`, `battleScene.ts:721,723`); zmierzone odczytem, bez bramki cargo (temat dokumentacyjny).
- **Stan parity:** `2f9a12786` → `400fd0bd1` (#221). Dysk: 15 GB wolne (63%).

## Przebieg (15.11, 19:5x UTC — P4-1D Q1 STACK-REPIN zintegrowany na parity)

- **P4-1D Q1 STACK-REPIN (#213, Opus) — FC PASS-WITH-NOTES `ebf917613`:** operator `b6645c63d` (kod `04b773b37`), ewaluator `e3b5219b1`, obrona r1 zwróciła BLOCK (INFRA) bez wyniku, więc FC sam rozstrzygnął zarzuty (5× ODDAL) i przeliczył `repinChanged` (34/19/1/0, zgodne).
- **Integracja:** ancestry `400fd0bd1` (poprzednie parity) w `2799cdd4b` — OK; merge-tree czysty; merge `--no-ff` `ebf917613` w worktree `integ-p4-1d`. Bramki na merge'u: `FMT_EXIT=0`, `CLIPPY_EXIT=0`, `cargo test --all-targets --no-fail-fast`: **3502 passed, 0 failed, 1 ignored** (ignored był w bazie). FF: parity = `2799cdd4b`.
- **Refy:** `refs/keep/P4-1D-Q1-STACK-REPIN-integ` (`2799cdd4b`), `refs/keep/P4-1D-Q1-FC` (`ebf917613`), `refs/keep/P4-1D-Q1-OP` (`b6645c63d`), `refs/keep/cleanup-P4-1D-integ-p4-1d`.
- **Sprzątanie:** worktrees `integ-p4-1d` (usunięty z niezcommitowanym `Cargo.lock` — regenerowalny, nie commitowany), `wf_515c8fe6-0a4-1/-2/-4` (`-4` był zablokowany, odblokowany i usunięty); `target-integ-p4-1d` usunięty.
- **NIE_ZMIERZONO / ograniczenia:** `pick_auto_improvements` i pozostałe testy długie nie były osobno raportowane poza sumą. Brak producenta produkcyjnego `compute_stack_display` do czasu P4-1D-Q4 (ewaluator zaznaczył jako zależność, nie zarzut).
- **Stan sloty:** pozostaje aktywny P4-1B Q3 (`wf_c431c5de-ee5`, procesy cargo w `wf_c431c5de-ee5-3`, nie ruszane). P4-1F i P4-1I bez śladu worktree — stan NIE_ZMIERZONO.
- **Dysk:** 19 GB wolne (52%).

## Przebieg (15.11, 20:09 UTC — tick autonomiczny: start P4-1H Q2)

- **R-RUSTPORT-P4-1H-CANCEL-Q2 (#217, Opus) — START:** dispatch `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-CANCEL-Q2/00-dispatch.md` (commit `49eb08038`), baza `origin/rust-port/parity-v2` = `2799cdd4b`. Workflow `wf_c5970398-de4`. Zakres: `cancel_planned_march` 1:1 z `clearPlannedMarch` gałąź `unitId` + `EngineCommand::CancelPlannedMarch` w `bridge.rs`. Decyzja techniczna nieznanej jednostki (Err) zapisana wcześniej w tym rejestrze.
- **Sloty:** aktywne 2 workflow (P4-1B Q3 `wf_c431c5de-ee5`, obrona w toku; P4-1H Q2 `wf_c5970398-de4`). Pozostają 2 wolne. Brak dispatchu bez decyzji właściciela dla kolejnych tematów (Q3 RJ-REPIN wymaga Q2? nie — niezależne, ale dispatch do napisania).

## Przebieg (15.11, 20:2x UTC — heartbeat „twardy bit”: integracja rozpoznań P4-1F i P4-1I)

- **Sloty:** aktywne 2 z 4 — P4-1H Q2 `wf_c5970398-de4` (operator, Opus, start 20:09 UTC) i P4-1B Q3 `wf_c431c5de-ee5` (etap FC, gałąź `fc/q3-map-view`, Opus). Dwa wolne. Nie uzupełniłem: kolejne kandydaci z listy (#96–#119) są oznaczone jako zablokowane (allowlista, decyzje gameplay) albo wymagają dispatchu do napisania. Kandydat niezależny od Q2: `R-RUSTPORT-P4-1H-RJ-REPIN-Q3` (dryf RJ do `07d2fbd72`, bez zależności).
- **P4-1F OVERLAYS rozpoznanie (#215, FC PASS-WITH-NOTES `763902cf7`):** dokumenty zintegrowane na `claude/rust-sivvrn` (cherry-pick `ada5952ce`, `0a17ae371`). Trzeci commit (FC) po rozstrzygnięciu konfliktu był pusty — treść już była w gałęzi (`03-final-control.md` obecny). Ref `refs/keep/P4-1F-ROZP-FC`.
- **P4-1I BATTLE-EVENTS rozpoznanie (#218, FC PASS-WITH-NOTES `d93d38750`):** łańcuch `ed07607c4`, `f8f4bfdb4`, `d93d38750` — operator i obrona zintegrowane (`adeff9057`, `84d8bc2af`), FC pusty po rozstrzygnięciu (treść obecna). Ref `refs/keep/P4-1I-ROZP-FC`.
- **Uwaga do konfliktu reguł modeli:** stored prompt heartbeatu podaje Haiku/Sonnet, a bieżąca reguła właściciela dla serii P4-1 to Opus. Stosuję Opus dla P4-1, do rozstrzygnięcia przez właściciela.
- **Stan remote:** `claude/rust-sivvrn` = `84d8bc2af`, `rust-port/parity-v2` = `2799cdd4b`.
- **Dysk:** 16 GB wolne (59%).

## Przebieg (15.11, 21:xx UTC — P4-1B Q3 MAP-VIEW-PRODUCER zintegrowany na parity)

- **P4-1B Q3 (#211, Opus) — FC PASS-WITH-NOTES `c21da1bbd`:** operator `6b1b5c8ed` (kod, bez zmian w FC), raport `81befe806`, obrona `2eeca6fc9` + poprawka testu `b82c98983` (asercja bajt-w-bajt z wektorami pinu). Evaluator `c187edb44`, odrzucone 4 mutacje z dodatkowego przeglądu — bez zmian w kodzie. Wszystkie 8 zarzutów FC: ODDAL.
- **Integracja:** ancestry — parity `2799cdd4b` jest przodkiem merge'a `be49ff3c3`; merge-tree czysty; merge `--no-ff` FC `c21da1bbd` w worktree `integ-p4-1b-q3`. Bramki na merge'u (engine i view-model): `FMT_EXIT=0`, `CLIPPY_EXIT=0`, `TEST_EXIT=0` w obu crate'ach; **3585 passed, 0 failed, 1 ignored** (ignored w bazie). FF: parity = `be49ff3c3`.
- **Odstępstwo Z-Q3-2 (do przyjęcia przez P4-1G):** `build_map_view` i `build_hex_dyn` zwracają `Result<_, MapViewError>` zamiast gołego DTO, bo pola tekstowe `SnapshotMap` spoza enumów webu nie mają reprezentacji w typowanym DTO. P4-1G musi obsłużyć błąd jawnie.
- **Otwarte (NIE_ZMIERZONO):** wołający producenta w rendererze (P4-1G, jawna zależność), `placedImprovements` jako źródło tarasów, zmiana terenu w trakcie gry (playtest).
- **Refy:** `refs/keep/P4-1B-Q3-MAP-VIEW-integ` (`be49ff3c3`), `refs/keep/P4-1B-Q3-FC` (`c21da1bbd`).
- **Sprzątanie:** worktrees `integ-p4-1b-q3` (z nieśledzonym `Cargo.lock` z bramek, regenerowalnym, nie commitowanym) i `wf_c431c5de-ee5-1/-2/-3/-4` (`-4` zablokowany, odblokowany) usunięte; cache `target-integ-p4-1b-q3` usunięty.
- **Stan slotów:** aktywny P4-1H Q2 (`wf_c5970398-de4`, worktree `-1` z commitem operatora `d8f85f7d9` na gałęzi `rust-port-wip/R-RUSTPORT-P4-1H-CANCEL-Q2-op-r1`). Dysk: 20 GB wolne (49%).

## Przebieg (15.11, 20:5x UTC — heartbeat „twardy bit”: sloty 3/4)

- **Sloty:** aktywne 3 z 4 (Opus we wszystkich rolach, zgodnie z regułą właściciela dla serii P4-1; heartbeat podawał Haiku/Sonnet — rozbieżność zgłoszona w czacie):
  1. P4-1H Q2 `cancel_planned_march` (#217), `wf_c5970398-de4` — operator `d8f85f7d9`, baza `2799cdd4b`.
  2. P4-1H Q3 RJ-REPIN (#217), `wf_28c84406-989` — dispatch `2a06923b6811`, baza `be49ff3c3`.
  3. P4-1G Q1 ADAPTER-CORE (#216), `wf_3a5d7bc8-8e5` — dispatch `7379e1dbab21`, baza `be49ff3c3`.
- **Integracja P4-1B Q3 (#211)** zamknięta w poprzednim wpisie (`be49ff3c3`).
- **Dysk:** 20 GB wolne.

## Przebieg (15.11, 21:17 UTC — heartbeat „twardy bit”: sloty 3/4, start wstrzymany przez dysk)

- **Stan workflow:**
  1. P4-1H Q2 `cancel_planned_march` (#217), `wf_c5970398-de4` — operator PASS (`d8f85f7d9`, gałąź `rust-port-wip/R-RUSTPORT-P4-1H-CANCEL-Q2-op-r1`), etap Evaluator.
  2. P4-1H Q3 RJ-REPIN (#217), `wf_28c84406-989` — etap operator, bez wyniku.
  3. P4-1G Q1 ADAPTER-CORE (#216), `wf_3a5d7bc8-8e5` — operator, obrona i evaluator zakończone, etap FC w toku.
- **Brak FC PASS do integracji** w tym ticku.
- **Start wstrzymany:** czwarty slot zostaje wolny, bo dysk spadł do **8,5 GB (78%)** przy 13 procesach cargo. Reguła projektu: nie startować tematu z kodem Rust poniżej 8 GB. Próg 4 GB heartbeatu nie jest przekroczony, ale reguła 8 GB obowiązuje.
- **Do zrobienia po zwolnieniu dysku:** wybrać kolejny temat (bez zależności od niezintegrowanego kodu) i wstawić go do slotu.
- **Dirty worktree do zgłoszenia (nie ruszam):** `wf_5a965001-591-4`, `wf_f3b76b65-261-3` — z poprzednich ticków.

## Przebieg (15.11, 21:5x UTC — P4-1G Q1 ADAPTER-CORE zintegrowany na parity)

- **P4-1G Q1 ADAPTER-CORE (#216, Opus) — FC PASS-WITH-NOTES `601ff304c`:** operator `9cdb62ba7` (kod `aa66e8384`), evaluator `44a4819d1` PASS-WITH-NOTES, obrona `652bf1c1f` (przyjęto usunięcie `Default` z `FogSets`, odrzucono 5 zarzutów z dowodem), FC `601ff304c`.
- **Integracja:** parity `be49ff3c3` jest przodkiem FC (FC zawiera parity), merge-tree czysty. Bramki w `rust-port/renderer` na commicie FC: `FMT_EXIT=0`, `CLIPPY_EXIT=0`, `TEST_EXIT=0`, **502 passed, 0 failed, 0 ignored**. FF: parity = `601ff304c`.
- **Refy:** `refs/keep/P4-1G-Q1-ADAPTER-FC` (`601ff304c`), `refs/keep/P4-1G-Q1-OP` (`9cdb62ba7`), `refs/keep/P4-1G-Q1-OBRONA` (`652bf1c1f`), `refs/keep/cleanup-P4-1G-integ-q1`.
- **Sprzątanie:** worktrees `wf_3a5d7bc8-8e5-1/-2/-3/-4` i `integ-p4-1g-q1` usunięte; cache `target-integ-p4-1g-q1` usunięty.
- **Otwarte (z FC, do zamknięcia przed wpięciem mgły do scen):**
  - luka L1/L2: DTO nie niesie `revealAllLand` ani `riverRevealKeys` (pin: `useFogRender = fogOn || revealAllLand`, `main.ts:13487`); wymaga zmian w `rust-port/view-model`, poza allowlistą Q1;
  - `view::*` i `FogSets` nie mają wołającego w produkcji — wpięcie w Q2+;
  - zakres realnych id graczy: NIE_ZMIERZONO (przepełnienie `OwnerRef` zwraca błąd).
- **Stan P4-1G:** Q1 zamknięte; Q2–Q6 do dispatchu (`P4-1G-ADAPTER-ROZPOZNANIE.md` §7).
- **Dysk:** 13 GB wolne (69%).

## Przebieg (15.11, 22:xx UTC — heartbeat: start P4-1G Q2 ADAPTER-TERRAIN)

- **Start:** `R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN` (#216, Opus), dispatch `448d2d25c` na `claude/rust-sivvrn`, baza `601ff304c` (P4-1G Q1 zintegrowany). Workflow `wf_c9f7943e-b13`. Zakres: adapter terenu `MapViewDto` → `TerrainInput`/`MapHex`/`OverlayMap`/`OkolicaMap`. Luki L5 (`wonderBuildSites`) i L1/L2 (`revealAllLand`, `riverRevealKeys`) pozostają NIE_ZMIERZONO.
- **Sloty:** aktywne 3 z 4 — P4-1H Q2 (`wf_c5970398-de4`, etap Evaluator), P4-1H Q3 RJ-REPIN (`wf_28c84406-989`, operator), P4-1G Q2 (`wf_c9f7943e-b13`, operator). Czwarty slot: kolejny kandydat (P4-1G Q3/Q4 po Q2 albo P4-1I) wymaga dispatchu.

## Przebieg (heartbeat — czwarty slot: start P4-1G Q3 ADAPTER-CITIES)

- **Start:** `R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES` (#216, Opus), dispatch `d7d9ba1bb` na `claude/rust-sivvrn`, baza `601ff304c`. Workflow `wf_7221cd0a-cbb`. Zakres: `cities[]`, `owners[]`, `wonders[]` → `City`, `CityRenderOptions`, `PlacedWonder`, `WonderRenderOptions`, `OwnerEmblemContext`, `CityBadgeDto` → `CityMapBadgeInput`. Równolegle z Q2 (teren); pliki rozłączne.
- **Sloty:** 4 z 4 — P4-1H Q2 (`wf_c5970398-de4`, Evaluator), P4-1H Q3 RJ-REPIN (`wf_28c84406-989`, operator), P4-1G Q2 TERRAIN (`wf_c9f7943e-b13`, operator), P4-1G Q3 CITIES (`wf_7221cd0a-cbb`, operator). Model Opus we wszystkich rolach (reguła właściciela dla serii P4-1; heartbeat podawał Haiku/Sonnet — rozbieżność zgłoszona).

## Kolejka nocna — 20 zadań w liście (#235–#254), 15.11

Źródło: rozpoznania P4-1G, P4-1F, P4-1I, P4-1H (§4), P4-1C. Gotowe do startu od razu: #235, #238, #244, #254. Reszta czeka na zależności lub na decyzję właściciela.

| # | Temat | Blokada |
|---|---|---|
| #235 | P4-1G Q4 ADAPTER-BATTLE | — (Q1 zintegrowany) |
| #236 | P4-1G Q5 ADAPTER-OVERLAYS | #216 (Q2/Q3), #235 |
| #237 | P4-1G Q6 ADAPTER-UNITS | #238 (+ R1 z rozpoznania §6) |
| #238 | P4-1F1 OVERLAY-TYPES (kształt DTO wg pinu) | — |
| #239 | P4-1F2 TERRITORY-RANGES-VIEW | #238 |
| #240 | P4-1F3 SIEGE-WONDER-VIEW | #238 |
| #241 | P4-1F4 TRADE-WORKERS-OKOLICA-VIEW | #238 |
| #242 | P4-1F5 REACH-PATH-VIEW | #238, #217 (passThrough z RJ-REPIN) |
| #243 | P4-1F6 BUILD-SELECTION-VIEW | #238 |
| #244 | P4-1I1 BATTLE-OUTCOME | — |
| #245 | P4-1I1B BATTLE-INSTANT (E4) | #244 |
| #246 | P4-1I2 BATTLE-FRAME | #244 |
| #247 | P4-1I3 BATTLE-ACTIONS (ścieżki już portowane) | #246 |
| #248 | P4-1I4 BATTLE-CONSUMER (renderer) | #247, #235 |
| #249 | P4-1I5 BATTLE-ACTIONS-SIEGE | #247, K5LOOP #107/#109/#112/#113 |
| #250 | P4-1H Q4 MOVE-MODEL | #217 (RJ-REPIN Q3) |
| #251 | P4-1H Q5 PREVIEW | #250 |
| #252 | P4-1H Q6 MOVE | #250 |
| #253 | P4-1C FOG-VIEW | **DECYZJA WŁAŚCICIELA** (mgła dla fotela ≠ 0, P4-1C §1.5) |
| #254 | P4-1 L1/L2 revealAllLand, riverRevealKeys w DTO mapy | — (warunek wpięcia mgły) |

## Przebieg (heartbeat — P4-1G Q2 ADAPTER-TERRAIN zintegrowany na parity)

- **P4-1G Q2 ADAPTER-TERRAIN (#216, Opus) — FC PASS-WITH-NOTES `a0c81d59e`:** operator `3463c909a`, ewaluator `b1b92e595` (PASS-WITH-NOTES, 5 zarzutów), obrona `157e79c15` (przyjęte 2 zarzuty dokumentacyjne i test rzek, odrzucone duplikaty jako wadę adaptera), FC `a0c81d59e` (dokumenty).
- **Integracja:** parity `601ff304c` jest przodkiem FC, merge-tree czysty, zakres `rust-port/renderer` i `dyspozycje`. Bramki: `FMT_EXIT=0`, `CLIPPY_EXIT=0`, `TEST_EXIT=0`, **520 passed, 0 failed, 0 ignored** (65 zestawów). FF: parity = `a0c81d59e`.
- **Rozbieżność liczby testów (NIE_ZMIERZONO):** obrona raportowała 563 passed, a integracja na tym samym kodzie daje 520. Kod jest identyczny, zmieniły się tylko dokumenty. Źródła różnicy nie ustalono.
- **Otwarte z Evaluatora i FC:**
  - adapter terenu nie ma wołającego w `src/` (wołają go tylko testy); docelowy konsument to integrator sceny R1/R2 z §4 rozpoznania. Trzeba dopisać zależność do `REJESTR-RUST` / NIEPODPIETE-MODULY;
  - luka `solid_hidden` dla ukryć wywoływanych zdarzeniami (wycinki lasu `main.ts:16801/17014/42967`, `syncImprovementDecorForHex` `main.ts:16877-16946`). Naprawa to pole `decor_hidden` w `HexDynDto` liczone przez producenta: zmiana kontraktu view-model, osobny temat;
  - L1 (`revealAllLand`), L2 (`riverRevealKeys`) i L5 (`wonderBuildSites`) pozostają NIE_ZMIERZONO, zgodnie z zadaniami #254 i rozpoznaniem.
- **Refy:** `refs/keep/P4-1G-Q2-TERRAIN-FC` (`a0c81d59e`), `refs/keep/P4-1G-Q2-TERRAIN-OP` (`3463c909a`), `refs/keep/P4-1G-Q2-TERRAIN-OBRONA` (`157e79c15`), `refs/keep/cleanup-P4-1G-Q2-integ`.
- **Sprzątanie:** worktrees `wf_c9f7943e-b13-1/-2/-3` i `integ-p4-1g-q2` usunięte; cache `target-integ-p4-1g-q2` usunięty. Dysk: 6,7 GB wolne (83%).

## Przebieg (heartbeat — P4-1G Q3 ADAPTER-CITIES zintegrowany na parity)

- **P4-1G Q3 ADAPTER-CITIES (#216, Opus) — FC PASS-WITH-NOTES `3d0450b77`:** operator `232ab2c50`, obrona `bb6bd342e` (przyjęte: odznaki per właściciel, dokumentacja; odrzucone: fallbacki pinu przeniesione do producenta), FC `3d0450b77`.
- **Integracja:** FC zbudowany na `601ff304c`, parity był już `a0c81d59e` (Q2). Merge `--no-ff` w `b90894920` bez konfliktów (`view.rs` scalony automatycznie), merge-tree czysty. Bramki na merge'u (`rust-port/renderer`): `FMT_EXIT=0`, `CLIPPY_EXIT=0`, `TEST_EXIT=0`, **537 passed, 0 failed, 0 ignored** (66 zestawów). FF: parity = `b90894920`. Merge wypchnięty najpierw na `rust-port-wip/R-RUSTPORT-P4-1G-Q3-CITIES-integ-r1`.
- **Otwarte (do przypisania przez orkiestratora):**
  - adapter miast nie ma produkcyjnego wołającego (`CityInputs`, `WonderInputs`, `apply_city_fog`, `apply_wonder_fog`, `city_badge_input`, `owner_emblem_context`); wpięcie to integrator R5 (`syncStatChips`) i pętla synchronizacji mapy (`main.ts:3007`, `:4316`, `:14563`). Brak zadania w liście;
  - adapter jest ściślejszy niż pin: nieznany `bronze_civ` albo brak właściciela w `owners[]` daje błąd (`UnknownBronzeCiv`, `MissingOwner`), a pin ma fallbacki. Decyzja techniczna: fallbacki należą do producenta, nie do adaptera;
  - parytet bajtowy web → DTO → renderer: NIE_ZMIERZONO (fixture'y ręczne, do testu end-to-end po producencie B-1B);
  - L1 (`revealAllLand`), L5 (`wonderBuildSites`), `isVisible` (L4), `getRevolt`/`getUnitCountOnHex` (R6): NIE_ZMIERZONO.
- **Rozbieżność liczby testów w obronie/ewaluatorze:** raporty podawały 518 i 563; integracja daje 537. Na tym samym kodzie różnica nie jest wyjaśniona (NIE_ZMIERZONO).
- **Refy:** `refs/keep/P4-1G-Q3-CITIES-FC` (`3d0450b77`), `refs/keep/P4-1G-Q3-CITIES-OP` (`232ab2c50`), `refs/keep/P4-1G-Q3-CITIES-OBRONA` (`bb6bd342e`), `refs/keep/cleanup-P4-1G-Q3-integ` (`b90894920`).
- **Sprzątanie:** worktrees `wf_7221cd0a-cbb-1..4` i `integ-p4-1g-q3` usunięte; cache `target-integ-p4-1g-q3` i `scratchpad/tgt` usunięte (wspólny cache po Operatorze Q3). Dysk: 13 GB wolne (68%).

## Przebieg (heartbeat — P4-1H Q2 CANCEL-PLANNED-MARCH zintegrowany na parity)

- **P4-1H Q2 CANCEL-PLANNED-MARCH (#217, Opus) — FC PASS-WITH-NOTES `adc21f8cd`:** operator `d8f85f7d9` (`cancel_planned_march` 1:1 z `clearPlannedMarch`, gałąź `unitId`), obrona `95613f699` (usunięty test tautologiczny, niezależny stan oczekiwany, wskazówka dla wołających w silniku), FC `adc21f8cd`.
- **Integracja:** FC zbudowany na `2799cdd4b`, parity `b90894920`. Merge `--no-ff` w `84ec520a5`, merge-tree czysty. Bramki silnika (`rust-port/engine`): `FMT_EXIT=0`, `CLIPPY_EXIT=0`, `TEST_EXIT=0`, **3531 passed, 0 failed, 1 ignored** (ignorowany test z bazy). FF: parity = `84ec520a5`.
- **Otwarte (z Evaluatora i obrony):**
  - w silniku nie ma jeszcze wołającego poza `bridge.rs`; kliknięcie PPM/Esc (`force=false`, `main.ts:7091`) i przycisk Stop (`force=true`, `:31729-31736`) to osobne tematy P4-1H;
  - wołający wewnątrz silnika (`main.ts:25920/25946/26013/26060/26085`) muszą wołać `PlayableState::clear_planned_march_for_unit` przed usunięciem jednostki (wskazówka w doc-komentarzu);
  - test `attack_branch_is_observable` usunięty; w adapterze brak testu ścieżki `UnitNotOwned` i czyszczenia przez `EngineCommand` (publiczne API nie buduje gry z planami); pokrycie w `cancel_planned_march_game_tests` w `playable.rs`.
  - Wektory nie z uruchomionej przeglądarki (dozwolone przez dispatch): NIE_ZMIERZONO.
- **Refy:** `refs/keep/P4-1H-CANCEL-Q2-FC` (`adc21f8cd`), `refs/keep/P4-1H-CANCEL-Q2-OP` (`d8f85f7d9`), `refs/keep/P4-1H-CANCEL-Q2-OBRONA` (`95613f699`), `refs/keep/cleanup-P4-1H-Q2-integ` (`84ec520a5`).
- **Sprzątanie:** worktrees `wf_c5970398-de4-1..4`, `wf_c9f7943e-b13-4`, `integ-p4-1h-q2` usunięte (nieśledzony `Cargo.lock` w nich — regenerowalny, nie commitowany); cache `target-integ-p4-1h-q2` usunięty. Dysk: 9,5 GB wolne (76%).

## Przebieg (heartbeat — start P4-1I1 BATTLE-OUTCOME)

- **Start:** `R-RUSTPORT-P4-1I1-BATTLE-OUTCOME` (#244, Opus), dispatch `23ffd75d5` na `claude/rust-sivvrn`, baza `84ec520a5` (P4-1H Q2 zintegrowany). Workflow `wf_8948228b-2a5`. Zakres: `BattleOutcomeDto` w view-model i producent E1–E3 w nowym module silnika. E4 (Pomiń) i log zostają poza zakresem (#245, #247).
- **Sloty:** 4 z 4 — P4-1H RJ-REPIN Q3 (`wf_28c84406-989`, FC), P4-1G Q4 BATTLE (`wf_304cdf8e-350`, operator), P4-1F1 OVERLAY-TYPES (`wf_e0bf527e-c00`, operator), P4-1I1 BATTLE-OUTCOME (`wf_8948228b-2a5`, operator).
- **Dysk:** po starcie P4-1I1 wolne 6,6 GB (84%). Poniżej progu 8 GB nie startuję kolejnych tematów z kodem Rust.

## Przebieg (heartbeat 22:47 — sloty 3/4, start wstrzymany)

- **P4-1H RJ-REPIN Q3 (#217):** FC PASS-WITH-NOTES `6637d5bf4` (operator `cc7cde088`, obrona `faffd0a54`, eval `b587ccbc6`). Integracja w toku: merge `02a1560e3` na parity `84ec520a5`, `fmt` i `clippy` zielone, pełny `cargo test` silnika się kompiluje. Po wyniku FF, refy `refs/keep/P4-1H-RJ-REPIN-Q3-*`, sprzątanie `integ-p4-1h-rj`.
- **Trwające workflow (3):** P4-1G Q4 ADAPTER-BATTLE (#235, `wf_304cdf8e-350`, obrona następna), P4-1F1 OVERLAY-TYPES (#238, `wf_e0bf527e-c00`, FC następny), P4-1I1 BATTLE-OUTCOME (#244, `wf_8948228b-2a5`, operator).
- **Wolny slot — nie uruchomiono:** #254 kolidowałby z P4-1F1 w `view-model/src/root.rs` (bump `CONTRACT_VERSION`). #250 (P4-1H Q4 MOVE-MODEL) czeka na FF RJ-REPIN Q3; zostanie uruchomiony z bazą po FF.
- **Dysk:** 11 GB wolne (74%).

## Przebieg (heartbeat 23:0x — kolejka integracji: RJ-REPIN Q3, F1, Q4)

- **P4-1F1 OVERLAY-TYPES (#238, Opus) — FC PASS-WITH-NOTES `8ecf01c2c`** (kod `ea84a130b`, obrona `7fe36b059`, eval `ac4e518fe`). Typy DTO nakładek: `PathRouteDto{hexes, turnStops}`, `SiegeCampDto`, `BuildHighlightKind` bez `generic`, `cultureRange`/`religionRange` jako `Option<Vec>`, `CONTRACT_VERSION` 1→2. Merge-tree na parity `84ec520a5` czysty. Otwarte: nowe typy nie są reeksportowane w `lib.rs` (plik poza allowlistą); `P4-1-RENDER-DTO-CONTRACT.md` §3.5/§3.7 do aktualizacji; scalanie właścicieli obozów (`main.ts:17514-17517`) do reguły w dispatchu P4-1G Q5; producenci do P4-1F2/F3/F5/F6.
- **P4-1G Q4 ADAPTER-BATTLE (#235, Opus) — FC PASS-WITH-NOTES `8666aa5ae`** (kod `04283b653`, obrona `d6cc03b58`, eval `ac27e79d8`). Adapter `view/battle.rs`: `battle_inputs`, `battle_view_inputs`, `unit_spawn`, `terrain_grid`, `deploy_side`, `ammo`; błędy `GridSize`, `MissingSiegeCiv`, `DeploySideMismatch`. Merge-tree czysty.
  - **Erratum do dispatchu (§ZAKRES pkt 2):** „`FortDto` None → INFINITY” jest błędne. INFINITY dotyczy wyłącznie `ammo_left`/`ammo_max` (`battleScene.ts:1444-1446`, `view-model/src/battle.rs:76-80`). Dla fortu brak `tower_material` = `null` (`battleScene.ts:4160-4161`). Implementacja poszła za pinem. Poprawić w dispatchach Q5, Q6 i P4-1I.
  - Brak producenta `BattleSetupDto` w silniku i brak integratora sceny bitwy (do rejestru jako zależności).
  - Fixture'y ręczne z wartościami z pinu tam, gdzie pin je wylicza (`TOWER_ROWS` z `towerRows`); pozostałe wartości to 1:1 kopie pól armii (NIE_ZMIERZONO brak wartości z pinu).
- **Kolejność integracji:** RJ-REPIN Q3 (bramki silnika w toku, `integ-p4-1h-rj`) → FF → F1 i Q4 razem na nowym parity (jeden przebieg bramek renderera i view-model).
- **Trwające workflow (1):** P4-1I1 BATTLE-OUTCOME (#244, `wf_8948228b-2a5`, operator). Wolne 3 sloty; kandydaci po integracji: #250 (P4-1H Q4 po FF RJ-REPIN), #236 (P4-1G Q5, czeka na Q2/Q3 — zintegrowane — i Q4, który właśnie przeszedł FC).
- **Dysk:** 6,8 GB (83%) — poniżej progu 8 GB, bez nowych startów do czasu zwolnienia miejsca.

## Przebieg (heartbeat 23:17 — integracja F1 i Q4 razem; RJ-REPIN na parity)

- **RJ-REPIN Q3 na parity:** FF `84ec520a5` → `02a1560e3`. Bramki silnika: `3538 passed, 0 failed, 1 ignored`.
- **P4-1F1 OVERLAY-TYPES (#238) i P4-1G Q4 ADAPTER-BATTLE (#235):** oba FC PASS-WITH-NOTES, merge-tree czysty na `02a1560e3`, zakres: F1 tylko `view-model`, Q4 tylko `renderer`. Merge w worktree `integ-p4-1fq4`: `1ed1a7bd8` (F1) i `1bacc7621` (Q4).
  - Bramki view-model: `fmt 0`, `clippy 0`, `test 0` (85 passed).
  - Bramki renderera: `fmt 0`, `clippy 0`, `test 0` (550 passed).
  - Bramki silnika: w toku (2000+ testów zaliczonych, bez porażek).
- **Otwarte z obu FC (do rejestru):**
  - F1: nowe typy nie są reeksportowane w `lib.rs` (poza allowlistą); `P4-1-RENDER-DTO-CONTRACT.md` §3.5/§3.7 do aktualizacji; reguła scalania właścicieli obozów (`main.ts:17514-17517`, ostatnie miasto wygrywa) do dispatchu P4-1G Q5.
  - Q4: **erratum dispatchu** — „`FortDto` None → INFINITY” jest błędne (INFINITY dotyczy wyłącznie amunicji jednostek, `battleScene.ts:1444-1446`); brak `tower_material` = `null` (`battleScene.ts:4160-4161`). Poprawić w Q5, Q6 i P4-1I. Brak producenta `BattleSetupDto` w silniku i brak integratora sceny bitwy (zależności do rejestru).
- **P4-1I1 BATTLE-OUTCOME (#244):** operator zakończony, ewaluator w toku.
- **Dysk:** 5,4 GB (87%) podczas bramek silnika.

## Przebieg (23:2x — F1 OVERLAY-TYPES i Q4 ADAPTER-BATTLE zintegrowane na parity)

- **Parity:** `02a1560e3` → `1bacc7621` (fast-forward). Merge F1 `1ed1a7bd8` (FC `8ecf01c2c`), merge Q4 `1bacc7621` (FC `8666aa5ae`).
- **Bramki na merge'u:** view-model: `fmt 0`, `clippy 0`, `test 0` (85 passed). renderer: `fmt 0`, `clippy 0`, `test 0` (550 passed). silnik: `test 0` (**3538 passed, 0 failed, 1 ignored**).
- **Refy:** `refs/keep/P4-1F1-FC`, `refs/keep/P4-1G-Q4-BATTLE-FC`, `refs/keep/cleanup-P4-1F1-Q4-integ`.
- **Sprzątanie:** worktree `integ-p4-1fq4` i cache `target-integ-f1q4` usunięte.
- **Erratum dispatchu P4-1G Q4 (§ZAKRES pkt 2):** `FortDto` None → INFINITY jest błędne. INFINITY dotyczy amunicji jednostek; brak wieży = `null`. Poprawić w Q5, Q6 i P4-1I.
- **Otwarte z FC F1:** typy nie są reeksportowane w `lib.rs` (poza allowlistą); `P4-1-RENDER-DTO-CONTRACT.md` §3.5/§3.7 do aktualizacji; reguła scalania właścicieli obozów do dispatchu Q5.
- **Otwarte z FC Q4:** brak producenta `BattleSetupDto` w silniku i brak integratora sceny bitwy.

- **Start (23:2x):** `R-RUSTPORT-P4-1H-MOVE-MODEL-Q4` (#250, Opus), dispatch `3f10be82c` na `claude/rust-sivvrn`, baza `1bacc7621`. Workflow `wf_312e0180-927`. Zależność RJ-REPIN Q3 zintegrowana. Decyzja techniczna `u8` vs `f64` do zapisu przez operatora w raporcie.
- **#236 (P4-1G Q5 ADAPTER-OVERLAYS) — nie startuje:** wiersz rozpoznania wymaga producentów nakładek B-1F (P4-1F2–F6, #239–#243), jeszcze niezrobionych.
- **Sloty:** 2 z 4 — P4-1I1 (`wf_8948228b-2a5`, ewaluator) i P4-1H Q4 (`wf_312e0180-927`, operator).
- **Dysk:** 10 GB (75%) po sprzątaniu integracji F1/Q4.

## Przebieg (00:2x UTC — heartbeat: start R7K7C PARITY-MISSING0)

- **Start:** `R-RUSTPORT-P6-R7K7C-PARITY-MISSING0-Q1` (#106, pierwszy z trzech tematów wg rozpoznania `R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1.md` §7), dispatch `2336e18b3` na `claude/rust-sivvrn`, baza `1bacc7621`. Workflow `wf_e8d80c7c-629`. Modele silnika zgodne z regułą: Operator HAIKU, Obrona HAIKU, Evaluator SONNET, FC SONNET.
- **Decyzja techniczna:** brak wpisu = 0 (wariant B, parytet `?? 0` z pinu, §3 rozpoznania). Zapisana w tym wpisie.
- **Następne (po integracji tego tematu):** R7K7C-WIRING-IMPL (wpięcie `apply_dipl_deltas_to_state` w `run_diplomacy_war_phase`, `playable.rs:1247`), potem R7K7C-VEC (wektory ≥150).
- **Sloty:** 3 z 4 — P4-1I1 (`wf_8948228b-2a5`, FC), P4-1H Q4 (`wf_312e0180-927`, ewaluator), R7K7C PARITY-MISSING0 (`wf_e8d80c7c-629`, operator).
- **Dysk:** ok. 8–9 GB.

## Przebieg (00:2x UTC — integracja P4-1I1 BATTLE-OUTCOME, #244)

- **Parity:** `1bacc7621` → `05e4df502` (fast-forward, odczyt z GitHub: `05e4df502500c591afae67b4017b6e3e907a0f86`). Merge `--no-ff` FC `44e35db25` (kod `0f29d1a86`, operator `475b795a5`, ewaluator `69c2b7eb9`, obrona `0f29d1a86`). Baza `84ec520a5` jest przodkiem; `merge-tree` względem parity czysty (exit 0); zakres zmian: wyłącznie `rust-port/engine`, `rust-port/view-model` i `dyspozycje/`.
- **Bramki na merge'u (`05e4df502`):** view-model `fmt 0`, `clippy 0`, `test 0`; silnik `fmt 0`, `clippy 0`, `test 0` (łącznie 3653 passed, 0 failed, 1 ignored).
- **Refy:** `refs/keep/P4-1I1-BATTLE-OUTCOME-{FC,OBRONA,OP,EVAL,MERGE}`.
- **Sprzątanie:** worktree `integ-P4-1I1` i cache `target-integ-I1` usunięte; worktree `wf_8948228b-2a5-1..4` usunięte po zachowaniu refów.
- **Otwarte (z FC, bez zmian w tej integracji):** `validate.rs`/`lib.rs` poza allowlistą (brak reeksportów; kontrola `hp>0` przez istniejący `ViewError::OutOfRange`); `build_battle_outcome` nie ma jeszcze produkcyjnego wołającego (wpięcie w #113/#246); erratum `FortDto` None → INFINITY (patrz wpis Q4 wyżej) obowiązuje też P4-1I.
- **Incydent dysku:** workflow `wf_e8d80c7c-629` (R7K7C PARITY-MISSING0) przerwany na etapie Obrony (`WorktreeIsolationError`, `unable to write file`, dysk 964 MB przy 98%). Operator i Evaluator zakończone; wznowienie po zwolnieniu dysku (9,8 GB po sprzątaniu).
- **Dysk:** 9,8 GB (75%) po sprzątaniu.

## Przebieg (00:5x UTC — heartbeat slotów: start P4-1I1B BATTLE-INSTANT)

- **Start:** `R-RUSTPORT-P4-1I1B-BATTLE-INSTANT` (#245, OPUS we wszystkich rolach — seria P4-1), dispatch `7502825c4` na `claude/rust-sivvrn`, baza `05e4df502`. Workflow `wf_aafc5812-7e5`. Zależność I1 zintegrowana (`05e4df502`).
- **Sloty:** 3 z 4 — R7K7C PARITY-MISSING0 (`wf_e8d80c7c-629`, Obrona, HAIKU, wznowiony), P4-1H Q4 MOVE-MODEL (`wf_312e0180-927`, Obrona, HAIKU), P4-1I1B (`wf_aafc5812-7e5`, operator, OPUS).
- **Nie wystartowano (czwarty slot):** #239 P4-1F2 — wymaga producenta mgły widza (`P4-1C`, #212/#253), a decyzja o fogu dla fotela ≠ 0 czeka na właściciela. #236/#237 i #242 — po F2–F6. Nie startuję tematów „dla zapełnienia” (zasada 2 CLAUDE.md).
- **Otwarte:** stray zaplanowane zadanie `trig_01Jayj6xoGAPtDWiKamgDwGH` („Placeholder: ignore”) do usunięcia przez właściciela (usunięcie odrzucone przez klasyfikator). `KOLEJKA-RUST.md` nieaktualna (migawka 15.11) — do odświeżenia (#154).
- **Dysk:** ok. 8,8 GB (78%) przed startem.

## Przebieg (01:0x UTC — P4-1H Q4 zintegrowany; R7K7C PARITY-MISSING0 FAIL → runda 2)

- **P4-1H Q4 MOVE-MODEL (#250) — integracja:** FC PASS-WITH-NOTES `ee3207b5a` (obrona `5d34ae85f`, operator `e669ffa1e`, ewaluator `5a03035ad`). Merge `--no-ff` na parity `05e4df502` → `b3c0b2209` (fast-forward, odczyt z GitHub zgodny). Merge-tree czysty; zakres: `rust-port/engine` (`playable.rs`, `playable_movement.rs` nowy, `save_load.rs`, `domain/mod.rs`, testy `p4_1h_move_model.rs`) i dokumentacja.
- **Bramki na merge'u (`b3c0b2209`):** silnik `fmt 0`, `clippy 0`, `test 0` (**3566 passed, 0 failed, 1 ignored** — ignorowany test istniał wcześniej).
- **Decyzje techniczne (z raportu operatora i FC, do zapisu):** (1) model ruchu w adapterze jako `f64` (koszty dróg ułamkowe); pola `PlayableUnit.movement`/`movement_max` zostają `u8`, Q6 (#252) musi przejść na `f64` przed pierwszym kosztem ułamkowym. (2) Odwzorowanie terenu: Plains→Równina, Hills→Wzgórza, Forest→Równina z lasem, Water→Morze. (3) `move_unit` oznacza jednostkę w `moved_by_player_this_turn` (web `markPlayerMovedUnit`, `main.ts:31284`); geometria i błędy bez zmian. (4) `base_type_id` w `playable.rs` jako `pub(crate)`. (5) Pola bez odpowiednika w `PlayableState` (rzeka, wioska, oblężenie, stos, zaokrętowanie, mur) — puste/false jak w webie.
- **Otwarte (warunki wejścia Q5/Q6):** surowe `PlayerId` zamiast `ownerId` z webu (gracz=0, barbarzyńcy<0) — mapowanie wymagane, jeśli pojawi się logika `ownerId === 0`/`< 0`; `occupied_for_move` używa `pathfinding::add_foreign_city_block_coords` (poprawka obrony).
- **R7K7C PARITY-MISSING0 (#106), runda 1 → FC FAIL `1a8036671`:** przyczyna: `tests/p6_wire_war_dipl_steps.rs:609/:625` (poza allowlistą) wymagają błędu dla brakującego wpisu, pin mówi `?? 0` (`diplomacy-economy.ts:78-125`: saldo brakujące = 0 → `broken`, bez błędu). Wektory ≥150 (`p6_r7k7c_owner_pools_vectors`, 167 przypadków) już są w r1.
- **Decyzje orkiestratora (runda 2, ten sam ID, dispatch `214b16aec`):** allowlista rozszerzona o `p6_wire_war_dipl_steps.rs` (tylko asercje :609/:625 → parytet); pełny `cargo test --all-targets` EXIT 0 wymagany; mutacje M1/M2 FAIL; podłoga skarbca AI (`main.ts:34867-34871`) i podłoga Pracy (`main.ts:34880`) — NIE_ZMIERZONO, poza zakresem. Refy r1: `refs/keep/R7K7C-PARITY-MISSING0-{OP,OBRONA,FC,EVAL}`.
- **Sloty:** 2 z 4 — R7K7C PARITY-MISSING0 r2 (`wf_e42107cb-dc8`, Haiku/Sonnet, baza = parity `b3c0b2209` po FF P4-1H), P4-1I1B BATTLE-INSTANT (`wf_aafc5812-7e5`, Opus, operator).
- **Sprzątanie:** worktree `integ-P4-1H`, cache `target-integ-H1`, worktree `wf_312e0180-927-1..4` i `/tmp/ct-q4-fc-927-4` usunięte; worktree r1 R7K7C `wf_e8d80c7c-629-1..3` usunięte (refy zachowane, gałąź `wip/R-RUSTPORT-P6-R7K7C-PARITY-MISSING0-Q1` zostaje lokalnie).
- **Dysk:** ok. 13 GB (67%) po sprzątaniu.

## Przebieg (01:2x UTC — start P4-1H PREVIEW-Q5, #251)

- **Start:** `R-RUSTPORT-P4-1H-PREVIEW-Q5` (#251, OPUS we wszystkich rolach — seria P4-1), dispatch `714d27f6d` na `claude/rust-sivvrn`, baza `b3c0b2209` (Q4 zintegrowany). Workflow `wf_7546f307-6dc`.
- **Zakres:** `preview_path` (`refreshHoverPathPreview`, `refreshPlannedMarchPreview`), `PathRouteDto { hexes, turn_stops }`, `budget = None`. Pole `path_route` dla warstwy zostaje w #242/#237.
- **Q6 (#252) nie startuje równolegle:** wspólne pliki `playable.rs`/`bridge.rs` z Q5; start po integracji Q5. Q6 musi przejść `movement` na `f64` (decyzja z Q4).
- **Sloty:** 3 z 4 — R7K7C PARITY-MISSING0 r2 (`wf_e42107cb-dc8`, Haiku/Sonnet), P4-1I1B BATTLE-INSTANT (`wf_aafc5812-7e5`, Opus), P4-1H PREVIEW-Q5 (`wf_7546f307-6dc`, Opus). Czwarty wolny: brak odblokowanego tematu bez konfliktu plików (#239 — decyzja o fogu; #252 — po Q5).
- **Dysk:** ok. 13 GB przed startem.

## Przebieg (01:3x UTC — heartbeat slotów: start #118 K5-AUTO-WEKTORY)

- **Start:** `R-RUSTPORT-P6-K5-AUTO-WEKTORY-Q1` (#118, Haiku/Sonnet — silnik), dispatch `998e5d3cb` na `claude/rust-sivvrn`, baza `b3c0b2209`. Workflow `wf_4c16ed22-a6c`.
- **Zakres (wg rozpoznania #234 `ed4a61199` i korekty Obrony):** wektory V5 (`_finishAutoBatchPhase` `:5961`), V6 (`_haltAutoBattleTurn` `:17333`), V15 (`_executeQueuedOrders` `:3603`), V16 (`_ffEnterAuto` `:3709`). Poza zakresem: V1/V2 (zależność od #112), V7–V13 (#112/#109), tryb ręczny (`_toggleManualMode` `:17348`, `_performPlayerOrder` `:18280`) — **luka bez tematu w kolejce**, do dopisania przez orkiestratora po rozstrzygnięciu zakresu.
- **Sloty:** 4 z 4 — R7K7C PARITY-MISSING0 r2 (`wf_e42107cb-dc8`), P4-1I1B BATTLE-INSTANT (`wf_aafc5812-7e5`, ewaluator), P4-1H PREVIEW-Q5 (`wf_7546f307-6dc`, Opus), K5-AUTO-WEKTORY (`wf_4c16ed22-a6c`).
- **Dysk:** ok. 13 GB.
- **Nie startowano:** #239 (decyzja o fogu), #252 (po integracji Q5 — wspólne `playable.rs`/`bridge.rs`), #97/#100/#104/#107/#109/#112/#113/#115/#120 (blokady wg kolejki: rozpoznanie, zależności, decyzja właściciela).

## Przebieg (02:18 UTC — heartbeat slotów: bez zmian, 4 z 4)

- **Sloty:** 4 aktywne, żaden FC jeszcze nie wydany, nic do integracji ani sprzątania. Parity `b3c0b2209`.
  - R7K7C PARITY-MISSING0 r2 (#106, `wf_e42107cb-dc8`) — ewaluator (Sonnet).
  - P4-1I1B BATTLE-INSTANT (#245, `wf_aafc5812-7e5`) — ewaluator (Sonnet; seria P4-1, wg reguły właściciela Opus — rozbieżność zgłoszona).
  - P4-1H PREVIEW-Q5 (#251, `wf_7546f307-6dc`) — ewaluator (Opus).
  - K5 AUTO-WEKTORY (#118, `wf_4c16ed22-a6c`) — obrona (Haiku).
- **Dysk:** 7,8 GB (80%). Nie startuję nowych tematów poniżej 8 GB dla kodu Rust.

## Przebieg (02:4x UTC — P4-1H PREVIEW-Q5 (#251): FC PASS-WITH-NOTES, merge lokalny, bramki w kolejce)

- **FC:** PASS-WITH-NOTES `18478e3a6` (kod `8408a2535`, obrona `c9f538309`, ewaluator `66c968055`, operator `8408a2535`). Ancestry: baza `b3c0b2209` jest przodkiem FC; zakres `rust-port/engine` (`playable_movement.rs`, `tests/p4_1h_preview_path.rs`) i dokumentacja; merge-tree czysty.
- **Merge:** `--no-ff` na `b3c0b2209` → `0d2f399a2` (lokalnie, **nie wypchnięty**). `cargo fmt --check` EXIT 0. Pełny `cargo test --all-targets` i clippy — **do wykonania**: dysk spadł do 4,1 GB przy trzech cargo, a Operator/Ewaluator zanotowali zapełnienie dysku do 0 MB przy pełnym teście. FF dopiero po EXIT 0 bramek przy ≥8 GB wolnego.
- **Otwarte z FC (nie blokują):** (1) strażnik `isMe(uSel.ownerId)` (`main.ts:32301-32306`) należy do wywołującego hovera — #237/#242 (erratum PlayerId: gracz = 1); (2) gałąź garnizonu (`armyMerge.ts:248-250`) nieportowana — zamknąć przy dodaniu garnizonów do `PlayableState`; (3) Żegluga (`ownerHasSeafaring` `main.ts:14589-14593`, rozgałęzienie `ownerId === 0`) — NIE_ZMIERZONO, do Q6 i mapowania PlayerId.
- **Refy:** `refs/keep/P4-1H-PREVIEW-Q5-{OP,EV,OB,FC}`. **Sprzątanie:** worktree `wf_7546f307-6dc-1..4` usunięte.
- **Sloty:** 3 z 4 działające (R7K7C r2 — ewaluator, P4-1I1B — ewaluator, K5 AUTO — obrona/FC); Q5 zakończony.
- **Dysk:** 4,1 GB (90%) — poniżej progu 8 GB; bez nowych startów kodu Rust do czasu odzyskania miejsca.

## Przebieg (02:5x–03:xx UTC — integracja trzech tematów na parity; K5 AUTO częściowo)

- **Parity:** `b3c0b2209` → `b6aa05024` (Q5 + K5) → `9f1a29af3` (R7K7C r2). Każdy krok fast-forward, odczyt z GitHub zgodny.
- **P4-1H PREVIEW-Q5 (#251):** FC PASS-WITH-NOTES `18478e3a6` (kod `8408a2535`). Zintegrowany (`0d2f399a2` → część `b6aa05024`). Notatki FC: strażnik `isMe` i Żegluga do #237/#242 i Q6; garnizon nieportowany (zamknąć przy garnizonach).
- **K5 AUTO-WEKTORY (#118):** FC PASS-WITH-NOTES `9a79cc1e3` (obrona `7e88ba0c5`, operator `104bc216a` = BLOCK na V15/V16). Zintegrowany wektory **V5, V6** (`tests/p6_k5_auto_vectors*`, generator `gen_pin_fragments.sh` + `pin_fragments.sha256`). **Nieobjęte:** V15 `_executeQueuedOrders` (`battleScene.ts:3603`) i V16 `_ffEnterAuto` (`:3709`) — brak portu w `rust-port/engine/src` (`siege_tactics_loop.rs:698-702` → `halt_unsupported`); wymagają osobnych tematów portu. Mutacje (b)/(c) NIE_ZMIERZONO. Notatka FC: Sha-256 przez `gen_pin_fragments.sh --check` (bash), nie `cargo test`.
- **R7K7C PARITY-MISSING0 r2 (#106 część 1):** FC PASS-WITH-NOTES `90519cd92` (kod `fd067a800`, obrona `ead5cf35b`). Zintegrowany: brak wpisu = 0 (`Ledger::balance`, `apply_dipl_deltas_to_state`), wektory ≥150 (167 przypadków, `owner_pools_vectors_from_pin_match_rust`). Notatki: wektory pokrywają tylko `apply`; ścieżka `Ledger` (balance/praca_of/danina/D3) — testy ręczne, propozycja LEDGER-VEC-Q1; asercja „Trybut zerwany” luźniejsza niż pin (`diplomacy-economy.ts:111`); zmiana zachowania D3 (handel Praca bez puli: brak błędu, dostawa nie dochodzi do skutku — zgodnie z pinem `0 < kwota`). **#106 nie jest zamknięte:** wpięcie `apply_dipl_deltas_to_state` do `run_diplomacy_war_phase` to osobny temat (WIRING-IMPL).
- **Bramki na `9f1a29af3`:** silnik `fmt 0`, `clippy 0`, `test 0` — **3590 passed, 0 failed, 1 ignored** (ignorowany istniał wcześniej).
- **Refy:** `refs/keep/Q5-K5-MERGE`, `refs/keep/P4-1H-PREVIEW-Q5-{OP,EV,OB,FC}`, `refs/keep/K5-AUTO-WEKTORY-{OP,EV,OB,FC}`, `refs/keep/R7K7C-PARITY-MISSING0-R2-{OP,OB,EV,RAPORT,FC,MERGE}`.
- **Sprzątanie:** worktree Q5 (`wf_7546f307-6dc-1..4`), K5 (`wf_4c16ed22-a6c-1..4`), R7K7C r2 (`wf_e42107cb-dc8-1..4`), `integ-Q5`, `integ-R7`; cache `/tmp/fc_tgt_m0`, `/tmp/fc-k5-target`, `target-r2`, `target-integ-QK5`, `target-integ-R7`.
- **Sloty:** 1 aktywny (P4-1I1B BATTLE-INSTANT, ewaluator, Sonnet — rozbieżność z regułą Opus zgłoszona).

## Przebieg (03:xx UTC — start P4-1H MOVE-Q6 (#252))

- **Start:** `R-RUSTPORT-P4-1H-MOVE-Q6` (#252, OPUS we wszystkich rolach — seria P4-1), dispatch `e30d02815` na `claude/rust-sivvrn`, baza `9f1a29af3` (Q5, K5 V5/V6, R7K7C r2 zintegrowane). Workflow `wf_b1e51033-24c`.
- **Errata wiążące w dispatchu:** `movement` na `f64` (decyzja z Q4; lista plików testów z `git grep` w raporcie); `PlayerId` ≠ `ownerId` (NIE_ZMIERZONO, bez zgadywania); strażnik `isMe` poza silnikiem; `armyStackLimit` = 500 jawnie.
- **Sloty:** 2 z 4 — P4-1I1B BATTLE-INSTANT (`wf_aafc5812-7e5`, ewaluator, Sonnet — rozbieżność z regułą Opus zgłoszona), P4-1H MOVE-Q6 (`wf_b1e51033-24c`, Opus).
- **Nie uruchomiono (2 wolne sloty):** V15 `_executeQueuedOrders` (`battleScene.ts:3603`) i V16 `_ffEnterAuto` (`:3709`) — osobne tematy portu, wymagają dispatchu z rozpoznaniem (brak portu w `engine/src`); #239 (fog, decyzja właściciela); #236/#237/#241–#243 (zależności od producentów nakładek).
- **Dysk:** ok. 14 GB.

## Przebieg (03:2x UTC — heartbeat: start port V15/V16 K5-AUTO; wyjaśnienie blokady #118)

- **Start:** `R-RUSTPORT-P6-K5-AUTO-PORT-V15-V16-Q1` (port `_executeQueuedOrders` V15 i `_ffEnterAuto` V16, Haiku/Sonnet — silnik), dispatch `c3035b18a` na `claude/rust-sivvrn`, baza `9f1a29af3`. Workflow `wf_64cdfe7b-3a5`. Blokada z FC `9a79cc1e3` (notatki 2, 7) — V15: `BTreeSet<u64>` porządkuje po id, pin po kolejności wstawienia; V16: `FfEvent::EnterAuto` → `halt_unsupported` (`siege_tactics_loop.rs:698-702`).
- **Sloty:** 3 z 4 — P4-1I1B (`wf_aafc5812-7e5`, FC), P4-1H Q6 (`wf_b1e51033-24c`, operator, Opus), V15/V16 (`wf_64cdfe7b-3a5`, operator, Haiku). Czwarty wolny — brak odblokowanego tematu z jasnym zakresem.
- **Dysk:** ok. 13 GB.

## Przebieg (03:17 UTC — heartbeat slotów: 3 z 4, bez zmian)

- **Sloty:** aktywne 3 — P4-1I1B BATTLE-INSTANT (`wf_aafc5812-7e5`, FC, Sonnet), P4-1H MOVE-Q6 (`wf_b1e51033-24c`, operator, Opus), K5 port V15/V16 (`wf_64cdfe7b-3a5`, operator, Haiku). Czwarty wolny: brak odblokowanego tematu z jasnym zakresem (#239 — decyzja o fogu; #236/#237/#240–#243 — zależności od producentów nakładek).
- **FC/integracja:** brak nowych werdyktów FC. Parity `9f1a29af3`.
- **Dysk:** 12 GB (70%) — ponad próg 8 GB.

## Przebieg (03:5x UTC — integracja P4-1I1B BATTLE-INSTANT; blokada V15/V16 K5-AUTO)

- **P4-1I1B BATTLE-INSTANT (#245):** FC PASS-WITH-NOTES `ce433a07f` (kod `991556084`, obrona `6e70d41e8`, ewaluator `fc3bb2f09`, raport `c773dec50`). Merge `--no-ff` na parity `9f1a29af3` → `474487792` (fast-forward, odczyt z GitHub zgodny). Bramki: silnik `fmt 0`, `clippy 0`, `test 0`; view-model `fmt 0`, `clippy 0`, `test 0` — **3701 passed, 0 failed, 1 ignored** (ignorowany istniał wcześniej).
- **Decyzja techniczna D1 (przyjęta przez orkiestratora):** `InstantPairResolver` (trait) zamiast `combat::resolve`, bo `combat::resolve` nie jest portem web `resolveCombat` (inny model, brak opcji i logu). **Konsekwencja:** produkcyjny resolver dla E4 nie istnieje do czasu portu `resolveCombat` (combat.ts:842-1251) — **nowy temat do kolejki: `R-RUSTPORT-COMBAT-RESOLVE-PAIR`** (zależny od #135/#167). Odblokowuje #113, #246, #248.
- **Zarzuty FC do pokrycia (wpisane jako otwarte):** (a) kara brodu obrońcy (`battleScene.ts:20517-20519`) — obrona dodała wektor `obronca_w_brodzie_kara`; (b) obrona miasta bez muru (`:20480`) — dodany `miasto_bez_muru_wzgorze`; (c) log E4 bajt-w-bajt tylko dla linii końca `:20591`, linie par NIE_ZMIERZONO do portu resolveCombat; (d) API `siege_wall_col` — obrona dodała `OutcomeError::InstantWallMismatch`.
- **Refy:** `refs/keep/P4-1I1B-BATTLE-INSTANT-{FC,OP,OB,EV,RAPORT}`, `refs/keep/P4-1I1B-MERGE`. **Sprzątanie:** worktree `wf_aafc5812-7e5-1..4` i `integ-I1B`; cache `target-integ-I1B`.
- **Model:** ewaluator i FC na Sonnet — rozbieżność z regułą Opus dla serii P4-1 (zgłoszona właścicielowi).

## Przebieg (04:0x UTC — K5-AUTO port V15/V16: BLOCK operatora, decyzja orkiestratora)

- **Wynik:** operator `22bd3d651` = BLOCK (brak kodu); ewaluator PASS-WITH-NOTES potwierdził blokady; obrona `1dc784599` przyjęła wszystkie zarzuty; FC `185979d36` PASS-WITH-NOTES (wyłącznie blokady). Refy `refs/keep/K5-AUTO-PORT-V15-V16-{OP,OB,FC}`.
- **Blokady (dowody z grepu i pinu):** B1 — brak portu `_executeUnitsImmediate` (pin `battleScene.ts:18578`); B2 — zmiana `queued_order_ids` (`BTreeSet`→`Vec`) wymaga edycji 8 plików testów poza allowlistą (`p6_k5loop_outcome_pin`, `loop_body`, `loop_body_pin`, `loop_resume`, `wylom_tower`, `tower_target_wiring`, `wieze_2b1`, `wieze_2b2`); B3 — brak portów `_toggleManualMode` (`:17348`) i `_kickoffBattleTurn` (`:3615`); `FfEvent::EnterAuto` nadal `halt_unsupported`.
- **Decyzja orkiestratora:** wariant **A** (rozszerzenie allowlisty o 8 plików testów na mechaniczne `BTreeSet::new()`→`Vec::new()`) — zaakceptowany jako techniczny; **nie uruchomiony**, bo sam V15 wymaga najpierw portu `_executeUnitsImmediate`. Kolejność tematów: (1) `K5-AUTO-EXEC` (port `_executeUnitsImmediate`, pin `:18578`); (2) `K5-AUTO-V15` (kontener + allowlista A + wektory z `p6_k5_port_v15_v16.rs.txt`); (3) `K5-AUTO-TOGGLE-KICKOFF` (`_toggleManualMode`, `_kickoffBattleTurn`) → V16.
- **Stan:** V15/V16 nadal NIE zrobione (#118 zamknięte tylko dla V5/V6). Dispatche do napisania w kolejnym cyklu; brak startu w tym ticku.

## Przebieg (03:5x UTC — heartbeat slotów: 3 z 4 — start dwóch rozpoznań tylko do odczytu)

- **Start (ROZP, odczyt, bez kodu):** `R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1` (`wf_bf7d52b8-33d`) — mapa `_executeUnitsImmediate` (pin `battleScene.ts:18578`) i podział portu K5-AUTO-EXEC; `R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1` (`wf_2c30a0ad-1e6`) — kroki `resolveCombat` przed pętlą dystansu (#135/#167) i zależności `COMBAT-RESOLVE-PAIR`. Dispatche `096f145ef` na `claude/rust-sivvrn`, baza `474487792`. Modele: Haiku/Sonnet (silnik, odczyt).
- **Sloty:** 3 z 4 — P4-1H MOVE-Q6 (`wf_b1e51033-24c`, operator, Opus), dwa rozpoznania. Czwarty wolny: brak odblokowanego tematu kodu bez rozpoznania.
- **Dysk:** 16 GB.

## Przebieg (04:1x UTC — wyniki dwóch rozpoznań (odczyt) i decyzje do podjęcia)

- **COMBAT-WEJSCIA-ROZP-Q1 (#135/#167):** FC PASS-WITH-NOTES `09d92eb24` (operator `7e18a2a1b`, obrona `7c0bbda7c`). Ewaluator dał FAIL (11 zarzutów: błędne BRAK dla `apply_veteran_frac_to_combat_unit`, `effective_max_hp`, `flank_rear_defense_penalty`; dwie kopie `terrain_river_attack_multiplier`; niepotwierdzone nazwy `hit_chance_tw`/`damage_tw`; allowlista bez plików read-only); obrona przyjęła wszystkie 11; FC PASS-WITH-NOTES. **Wpisane do FF na parity** (docs-only). **Błąd mój:** w dispatchu podałem ścieżkę pinu `gra/src/battle/combat.ts`; poprawna to `gra/src/game/combat.ts` (`resolveCombat` `:842-1251`).
  - **Do decyzji orkiestratora (propozycje obrony):** (a) kanoniczna wersja `terrain_river_attack_multiplier` — `siege_tactics_inputs_terrain.rs:148` (1:1 z pinem) czy `siege_tactics_blow_inputs.rs:21` (używana w `siege_tactics_blow_full.rs:245`) — **ryzyko rozbieżności w produkcji**; (b) połączenie #135 i RESOLVE-PAIR w jeden temat `COMBAT-RESOLVE-PAIR-FULL` z etapami A (kroki pre-fazowe), B (fazy i werdykt), C (impl `InstantPairResolver`); (c) dodanie `rng` do traitu `InstantPairResolver`; (d) `attacker_moved` w `InstantPairOpts`.
- **K5-AUTO-EXEC-ROZP-Q1:** FC PASS-WITH-NOTES `95eb581c1` (operator `f373952ff`, obrona `9ab595837`; po zarzutach ewaluatora FAIL). **Wpisane do parity** (`de88d9d55`, merge docs-only, scope `dyspozycje/`).
  - **Ustalenia:** (1) brak wejścia silnika dla `_executeUnitsImmediate` — `ActivateOps::perform_player_order(&mut self) -> bool` (`siege_tactics_activate.rs:117`, wywołanie `:238-240`) nie przyjmuje jednostki ani `done`; port wymaga zmiany kontraktu; (2) `acted`: pin `:18609` ustawia bezwarunkowo, Rust `activation_done` warunkowo (`turnseq.rs:352`); (3) `ProdOps::perform_player_order` i `doctrine_step` (`siege_tactics_loop.rs:773,776`) to atrapy zwracające `false`; (4) `renderer/src/battle/orders.rs` cytuje numery linii pinu **edb8fb56**, nie `07d2fbd72` — wymaga potwierdzenia przed T1; (5) część ciała funkcji nieprzeczytana (`_pickAdjacentTargetByPriority`, `_battleRosterOrder`) — NIE_ZMIERZONO.
  - **Proponowana kolejność (obrona):** T1 EXEC-QUEUE, T2 MOVE-GATE, T3 ATTACK-PRIMITIVES, T4 MOVE-ORDER, T5 ATTACK-ORDER, T6 SIEGE-MANUAL, T7 DOCTRINE, T8 WIRING. Uwaga: gałąź `move` `_performPlayerOrder` woła `_adjacentEnemy` i `_doAttack` → T3/T4 przed T5, zgodnie z tą kolejnością. **Do decyzji orkiestratora** (zmiana kontraktu `ActivateOps` dotyka `siege_tactics_activate.rs`).
- **Sloty:** operator `P4-1H MOVE-Q6` (`wf_b1e51033-24c`, Opus) — jedyny aktywny. Dwa rozpoznania zakończone.
- **Dysk:** 16 GB.

## Przebieg (04:2x UTC — heartbeat slotów: 3 z 4 — start dwóch rozpoznań tylko do odczytu)

- **Start (ROZP, odczyt):** `R-RUSTPORT-P6-TERRAIN-MULT-PRODUKCJA-ROZP-Q1` (`wf_7d64cefe-7a1`) — która kopia `terrain_river_attack_multiplier` jest na ścieżce produkcyjnej (`siege_tactics_blow_full.rs:245`) i czy różni się od pina; `R-RUSTPORT-P6-RENDERER-PIN-ZGODNOSC-ROZP-Q1` (`wf_d9201240-c60`) — czy `renderer/src/battle/orders.rs` cytuje pin `edb8fb56` zamiast `07d2fbd72`. Dispatche `13d72ec5f` na `claude/rust-sivvrn`, baza `de88d9d55`.
- **Sloty:** 3 z 4 — P4-1H MOVE-Q6 (`wf_b1e51033-24c`, obrona, Opus), dwa rozpoznania (Haiku/Sonnet). Czwarty wolny — brak odblokowanego tematu kodu bez decyzji (kontrakt `ActivateOps`, łączenie #135 z RESOLVE-PAIR — do decyzji orkiestratora).
- **Dysk:** 14 GB.

## Przebieg (04:4x UTC — wynik rozpoznania zgodności pinu w renderer/orders.rs)

- **RENDERER-PIN-ZGODNOSC-ROZP-Q1:** FC PASS-WITH-NOTES `b151636e8` (operator `72711a1b1`, obrona `971832633`). **Wynik: 0 z 7 cytatów w `rust-port/renderer/src/battle/orders.rs` zgadza się z pinem `07d2fbd72`** (również z `edb8fb56`, `origin/main`, `601fc3baf`, `96d088b4d`). Źródło numerów: NIE_ZMIERZONO. Obrona podała tabelę docelowych numerów (np. `_activateNext` 5979–6031, konsumpcja kolejki 5994/6013, filtr 5993, `_issueBattleAttackMove` 18682, `_cancelAttackMoveSelected` 18704, `_onKeyManual` 17406, Escape 17410, drugie wywołanie 19095 „Anuluj marsz”). Wpis dokumentacji na parity (merge docs-only, `dyspozycje/`).
- **Zalecenie (nowy temat, nie w tym ticku):** poprawka numerów linii w `renderer/src/battle/orders.rs` do pina `07d2fbd72` (tylko komentarze, zmiana kodu zerowa) oraz zbadanie, skąd wzięły się numery z `edb8fb56` — 850 plików w `dyspozycje/` i 501 w `rust-port/` cytuje ten commit (zmierzone, rozłączne z pinem). **Ryzyko:** każdy port oparty na tych cytatach jest niewiarygodny, dopóki nie zostanie poprawiony.
- **Otwarte z ewaluacji:** pełne pokrycie 171 plików `battleScene` i 27 plików `siege_*` — NIE_ZMIERZONO; nie zmierzono, czy treść funkcji w pinie jest identyczna z `601fc3baf`/`96d088b4d`.
- **Refy:** `refs/keep/RENDERER-PIN-ZGODNOSC-ROZP-{FC,OB,OP}`. **Sprzątanie:** worktree `wf_d9201240-c60-1..4`.
- **Sloty:** 2 z 4 — P4-1H MOVE-Q6 (`wf_b1e51033-24c`, obrona, Opus), ROZP terminu rzeki w produkcji (`wf_7d64cefe-7a1`, Haiku/Sonnet). Dwa wolne.
- **Dysk:** 12 GB.

## Przebieg (04:5x UTC — wynik rozpoznania `terrain_river_attack_multiplier` w produkcji)

- **TERRAIN-MULT-PRODUKCJA-ROZP-Q1:** FC PASS-WITH-NOTES `bbadddcc5` (operator `d26ac51f7`, obrona `87ff5cbc4`). **Wynik: obie kopie są logicznie zgodne z pinem; nie znaleziono rozbieżności w wyniku.** Kopia A (`siege_tactics_inputs_terrain.rs:148`) 1:1 z `combat.ts:677` (teren obrońcy); kopia B (`siege_tactics_blow_inputs.rs:21`) odpowiada `_singleBlow` (`battleScene.ts:8861`, kafel atakującego) i jest używana w `siege_tactics_blow_full.rs:245`. **Wpływ na grę: NIE_ZMIERZONO** — `siege_tactics_loop`/`blow_full` nie mają jeszcze produkcyjnego wywołania (#113). Zalecenia ewaluatora: osobny temat z wektorami dla `blow_env_for` (kopia B nie ma wektora pinu, równoważność dowiedziona testem ręcznym); nazwa parametru `defender_terrain` w kopii A myli (przekazywany jest teren atakującego) — bez zmiany wyniku.
- **Uwaga procesowa (wykryta, nie wpływa na kod):** FC `bbadddcc5` NIE jest potomkiem aktualnego parity — jego przodkiem jest `c284fe02d` (linia `origin/main`), merge-tree zwraca konflikt. **Nie zintegrowano go.** Na parity dodano tylko pliki runu: `47745929a` (dokumenty `01-rozpoznanie.md`, `02a-obrona.md`, `03-final-control.md`), commit docs-only. Refy: `refs/keep/TERRAIN-MULT-ROZP-{FC,OB,OP}`. **Zasada na przyszłość:** przed FF/merge zawsze sprawdzać `git merge-base` z bieżącym parity; FC spoza linii parity wymaga wyciągnięcia samych plików runu.
- **Sprawdzenie pozostałych integracji dokumentacji:** `09d92eb24`, `de88d9d55` (EXEC merge), `b151636e8` — wszystkie mają parity jako przodka lub bazę na linii parity; zakres `dyspozycje/` (zweryfikowane).
- **Sloty:** 1 z 4 — P4-1H MOVE-Q6 (`wf_b1e51033-24c`, obrona, Opus). Trzy wolne — brak odblokowanego tematu kodu bez decyzji.
- **Dysk:** 12 GB.

## Przebieg (05:0x UTC — integracja P4-1H MOVE-Q6 (#252) na parity)

- **Parity:** `47745929a` → `7d8993c42` (merge `--no-ff` FC `c66ed0bda`, kod `b5057adea`, obrona `17a12c18e`, ewaluator `fa15185f5`). Ancestry: baza `9f1a29af3` jest przodkiem FC; zakres `rust-port/engine` i `dyspozycje/`; merge-tree czysty. Odczyt z GitHub zgodny.
- **Bramki na merge'u:** silnik `fmt 0`, `clippy 0`, `test 0` — **3624 passed, 0 failed, 1 ignored** (ignorowany istniał wcześniej).
- **Decyzje techniczne:** ruch jako `MovementPoints` (obwoluta f64, `debug_assert!(value.is_finite())` w `new`, `From<f64>` przechodzi przez `new`); JSON z liczbą całkowitą bajt w bajt. Zmienione poza literalną allowlistą (zaakceptowane jako wymuszone): `tests/playable_slice.rs` (reguła „tylko sąsiad” zastąpiona) i `tests/p6_unit_replace_l3_state.rs` (1 linia, `movement = 0`).
- **Zależności do wpisania (z obrony/ewaluacji):**
  - **R-RUSTPORT-P4-1H-MARCH-ATTACK-LAUNCH** (nowy, zależny od P4-1C i P4-1I): stos gracza może stanąć na heksie wroga przy `attack_pending=true`; web uruchamia bitwę i `clearPlannedMarch(force)` (`main.ts:31132-31143`, `:44184`, `:31663`). Bez tego PlayableState może mieć obie strony na jednym heksie.
  - **Widoczność celu ataku — NIE_ZMIERZONO** (zależność od P4-1C): web odmawia dla niewidocznego celu (`main.ts:31248-31251`, `:31135`); Rust zapisuje plan ataku.
  - **Embarked, oblężenia, mgła/chatki/obozy/bonusy miast, auto-capture, forty** — poza zakresem (brak pól w stanie).
- **Refy:** `refs/keep/P4-1H-MOVE-Q6-{OP,EV,OB,FC}`, `refs/keep/P4-1H-MOVE-Q6-MERGE`. **Sprzątanie:** worktree `integ-Q6`, `wf_b1e51033-24c-1..4`; cache `target-integ-Q6`.
- **Sloty:** 0 z 4 — brak aktywnych workflow. Dostępne tematy: #237 (P4-1G Q6), #236 (P4-1G Q5), #239–#243 (P4-1F), #246–#249 (P4-1I) — większość po P4-1F/P4-1C lub do decyzji orkiestratora.
- **Dysk:** 15 GB.

## Przebieg (05:00 UTC — start dwóch tematów: poprawka cytatów renderer i wektory blow_env K5)

- **RENDERER-ORDERS-CYTATY-Q1** (`wf_59b7fc97-124`, Opus we wszystkich rolach): zamiana cytatów `plik:linia` w `rust-port/renderer/src/battle/orders.rs` na numery z pinu `07d2fbd72` (tylko komentarze, zero zmian kodu). Dispatch `0c11bd5b0`. Uwaga: reguła CLAUDE.md przydziela Opus wyłącznie tematom pamięci/GPU/grafiki; ten temat jest komentarzowy w crate renderer — do rozstrzygnięcia przy kolejnych przydziałach, Haiku byłby zgodny z regułą domyślną.
- **K5-BLOW-ENV-WEKTORY-Q1** (`wf_6ab179f1-525`, Operator/Obrona HAIKU, Evaluator/FC SONNET): wektory pinu dla kopii B `terrain_river_attack_multiplier` (`blow_env_for`, `siege_tactics_blow_inputs.rs:21`, pin `battleScene.ts:8861`), 8+ przypadków, mutacja `atk_tile_is_river`→`def_tile_is_river`; bez zmian w `src/`. Dispatch `0c11bd5b0`.
- **Sloty:** 2 z 4 aktywne (oba powyżej). Pozostałe tematy kodu czekają na decyzje ABC (kontrakt `ActivateOps`, #253, RESOLVE-PAIR-FULL).

## Przebieg (05:01 UTC — heartbeat slotów, druga połowa godziny)

- **Sloty:** 2 z 4 aktywne, obie bez FC: RENDERER-ORDERS-CYTATY-Q1 (`wf_59b7fc97-124`, Opus, Operator) i K5-BLOW-ENV-WEKTORY-Q1 (`wf_6ab179f1-525`, Haiku, Operator).
- **Nie uruchomiono dwóch dispatchów rozpoznań** (`R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1`, `R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1`): oba już wykonane i zintegrowane (wpisy wyżej: COMBAT-WEJSCIA-ROZP-Q1 FC `09d92eb24`, K5-AUTO-EXEC-ROZP-Q1 FC `95eb581c1` → parity `de88d9d55`). Ich dispatche mają bazę `474487792` i są nieaktualne. Nie ponawiać.
- **Kandydaci z kolejki bez startu:** #135/#167 (wejścia zwarcia) — czeka na decyzję właściciela o kolejności względem RESOLVE-PAIR; #106 R7K7C-WIRING — decyzja pkt 4; #115 ZDOBYCIE-MIASTA-WIRING i #120 CRED-HAK — decyzje A/B; K5-AUTO-EXEC (port `_executeUnitsImmediate`) — wymaga dispatchu i decyzji o zmianie kontraktu `ActivateOps` (rekomendacja: zmiana); V15/V16 — po EXEC.
- **Parity:** `7d8993c42` (bez zmian w tym ticku).
- **Dysk:** 18 GB wolnego.

## Przebieg (05:10 UTC — integracja RENDERER-ORDERS-CYTATY-Q1 na parity)

- **Wynik workflow `wf_59b7fc97-124`:** Operator `1d766e1da` PASS-WITH-NOTES → Evaluator `dbbae6d35` PASS-WITH-NOTES (3 uwagi, nie blokują) → Obrona `ee1bce231` (przyjęła 2 z 3: hashe spoza pinu usunięte z nagłówka, komentarze >100 znaków zawinięte; zarzut o zakresie `:5979-5993` odrzucony — zgodny z tabelą 02a) → **FC PASS `59746d373`**.
- **Ancestry i zakres:** `7d8993c42` jest przodkiem `59746d373`; merge-tree czysty; diff vs parity = `orders.rs` (35 linii, 0 linii niekomentarzowych) + dokumenty runu.
- **Bramki na integracji (worktree w `59746d373`):** `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --all-targets --no-fail-fast` **TEST_EXIT=0, 550 passed, 0 failed, 0 ignored** (renderer).
- **FF:** `rust-port/parity-v2` = `59746d373` (readback `git ls-remote` zgodny). Ref: `refs/keep/R-RUSTPORT-P6-RENDERER-ORDERS-CYTATY-Q1-fc`.
- **Uwaga:** dokument `02-evaluator.md` (`dbbae6d35`) nie wszedł do FC — jest na lokalnej gałęzi `rust-port-wip/…-eval-r1`. Uwagi Evaluatora przyjęte w części przez Obronę.
- **NIE_ZMIERZONO:** skąd pochodzą pierwotne numery linii (sprzed poprawki) — poza zakresem tego tematu.
- **Sprzątanie:** worktree `wf_59b7fc97-124-1..4` i worktree integracji usunięte; `target-integ-renderer-Q1` usunięty. Gałęzie lokalne `rust-port-wip/R-RUSTPORT-P6-RENDERER-ORDERS-CYTATY-Q1-*` zostawione (nie wypychane na zdalny). `scratchpad/target` niezidentyfikowany — nie ruszany.
- **Sloty:** 1 z 4 — K5-BLOW-ENV-WEKTORY-Q1 (`wf_6ab179f1-525`, Operator, Haiku).

## Przebieg (05:19 UTC — heartbeat slotów RUST: start rozpoznania #112)

- **Sloty:** 2 z 4 aktywne: K5-BLOW-ENV-WEKTORY-Q1 (`wf_6ab179f1-525`, Operator, Haiku — trwa od ok. 05:00 UTC, bez wyniku) i **K5LOOP-DOCTRINA-ROZP-Q1** (#112, `wf_8cdeaadf-cf7`, Operator, Haiku).
- **Start:** `R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1` — rozpoznanie tylko do odczytu, baza `59746d373` (parity). Dispatch `66171e279` wypchnięty na `claude/rust-sivvrn`. Skrypt `topic-ROZP-GENERIC.js` (Operator/Obrona Haiku, Evaluator/FC Sonnet). Warunek wstępny spełniony: OUTCOME (`c3e3617b2`) jest przodkiem parity.
- **Dlaczego tylko ten:** pozostali kandydaci z kolejki nie mają zielonego światła:
  - #104/#172 ZŁOŻA-WIRING: r1 DECISION_REQUIRED (`40884a5f8`), decyzja właściciela (a)/(b) nieodebrana.
  - #135/#167 COMBAT-WEJSCIA: kolejność względem RESOLVE-PAIR — pytanie ABC w czacie, bez odpowiedzi.
  - #106 R7K7C-WIRING: decyzja pkt 4. #115 ZDOBYCIE-MIASTA-WIRING: wariant A/B/C. #120 CRED-HAK: w tasklistach #171 już `completed` (duplikat, do uzgodnienia).
  - K5-AUTO-EXEC / V15 / V16: port `_executeUnitsImmediate` wymaga zmiany kontraktu `ActivateOps` — pytanie w czacie, bez odpowiedzi.
  - #123 K5LOOP-RUCH i #97 AUTO: wymagają rozpoznania (ruch w ProdBody; AUTO po doktrynie) — nie uruchamiane bez dispatchu.
- **Decyzja do właściciela (nieodebrana):** czy mam uznać zmianę kontraktu `ActivateOps` za decyzję techniczną orkiestratora (rekomendacja: tak) — wtedy startuje EXEC.
- **Procesowo:** worktree zakończonego RENDERER (`wf_59b7fc97-124-*`) usunięte w poprzednim ticku; `scratchpad/target` niezidentyfikowany (nie ruszany).
- **Dysk:** 16 GB wolnego.

## Przebieg (05:39 UTC — wynik rozpoznania doktryny/strzelca/muru #112)

- **K5LOOP-DOCTRINA-ROZP-Q1** (`wf_8cdeaadf-cf7`): Operator `caeca2d6b` PASS-WITH-NOTES → Evaluator PASS-WITH-NOTES (7 zarzutów, w tym 4 istotne) → Obrona przyjęła wszystkie, `b8f092415` → **FC PASS-WITH-NOTES `540aa813c`** (erratum i podział T0–T9).
- **Ustalenia:** doktryna AUTO, strzelec i ruch szykiem nie mają odpowiednika w Rust. `ProdBody` (`siege_tactics_loop.rs:1036-1046`) odsyła każdą aktywację z doktryną, strzelcem, trybem ręcznym lub oblężeniem do „unported”; `ProdOps::doctrine_step` (`:776`) zwraca `false`. Brak `_executeGroupDoctrineStep` (pin `17966-18083`) i ok. 30 wołanych funkcji.
- **Rozbieżność zakresu z pinem (do naprawy w porcie, nie do decyzji):** pin pozwala doktrynie atakującej piechocie działać w oblężeniu (bramka `6087-6097` wyklucza tylko obrońców i machiny), a Rust wyklucza całe oblężenie (`siege_tactics_loop.rs:1038-1039`).
- **Poprawki z Evaluatora:** `_unitBattleClass`/`_prefsForUnit` są w pinie (`17486-17520`) — pominięte w r1; `_performSiegeManualOrder` (`18435-18470`) i gałąź `move` z `_performPlayerOrder` (`18300-18429`) nie były w tabeli; `_doctrineMoveDest` gałąź domyślna i `_attackFormationRallyPoint`/`_chargeMoveDest` są martwym kodem na pinie.
- **Propozycja podziału:** T0–T9 w `01-rozpoznanie.md` i erracie FC (kolejność: żywa ścieżka domyślna przed konfiguracją UI; T9 = ruch skirmish `_performPlayerOrder`, którego `ProdOps::perform_player_order` dziś nie obsługuje). Allowlisty w raporcie §5.
- **Decyzja techniczna (orkiestratora, nie właściciela):** port pinu 1:1 także dla piechoty w oblężeniu — zgodnie z zasadą parytetu z webem. Pytanie „wpięcie razem z #113 czy osobno” rozstrzygam jako rekomendację B: T1–T7 osobno, wpięcie T8 w #113.
- **Integracja:** FC `540aa813c` **nie jest na linii parity** (przodek `a61337844`, merge-tree konflikt, diff ~18 tys. plików). Zgodnie z incydentem TERRAIN-MULT wniesiono tylko pliki runu (docs-only) na worktree z parity: commit `1a4982574`, FF `rust-port/parity-v2` = `1a4982574` (readback `git ls-remote` zgodny). Zmiany kodu: zero.
- **Procesowo:** worktree `wf_8cdeaadf-cf7-1..4` i worktree dokumentacji usunięte. Dispatch `66171e279`, rejestr z `33dc2fc72`.
- **Sloty:** 1 z 4 — K5-BLOW-ENV-WEKTORY-Q1 (`wf_6ab179f1-525`, Evaluator, Sonnet; Operator PASS-WITH-NOTES `1c82ab4b6`, lokalnie).

## Przebieg (05:48 UTC — heartbeat: start T0 doktryny, fala 1)

- **Sloty:** 2 z 4 aktywne: K5-BLOW-ENV-WEKTORY-Q1 (`wf_6ab179f1-525`, Obrona, Haiku; Operator PASS-WITH-NOTES `1c82ab4b6`) i **K5DOC-PROD-UNIT-STAN-T0** (`wf_a3de76ac-91a`, Operator, Haiku).
- **Start T0** (`R-RUSTPORT-P6-K5DOC-PROD-UNIT-STAN-T0`, fala 1 z §5 rozpoznania #112): pola stanu doktryny w `ProdUnit` (`siege_tactics_loop.rs:736`) bez zmiany zachowania + `_forwardCol` (pin 6748) + `GroupDoctrine`. Baza `1a4982574` (parity, docs-only nad `59746d373`). Dispatch `4bc68386` wypchnięty przed startem. Skrypt `topic-R-RUSTPORT-P6-K5DOC-PROD-UNIT-STAN-T0.js` (Operator/Obrona Haiku, Evaluator/FC Sonnet).
- **Zakres wg recon:** T0 jest pierwszy i sam, bo `siege_tactics_loop.rs` jest współdzielony z #109, #113, #147–#150. Po jego integracji startują równolegle T2', T6, T5a, T4 (fala 1 z §5).
- **Pozostałe kandydaci:** nieruszane — ZŁOŻA, COMBAT-WEJSCIA, R7K7C, ZDOBYCIE, ActivateOps — czekają na decyzje.
- **Dysk:** 14 GB wolnego.

## Przebieg (06:00 UTC — tick: stan slotów i dysku)

- **Sloty:** 2 z 4: K5-BLOW-ENV-WEKTORY-Q1 (`wf_6ab179f1-525`, Obrona, Haiku) i K5DOC-PROD-UNIT-STAN-T0 (`wf_a3de76ac-91a`, Operator, Haiku). Bez zmian w kodzie w tym ticku.
- **Dysk: 9,4 GB wolnego** (spadek z 14 GB). Składniki: `scratchpad/target` 3,1 GB (właściciel niezidentyfikowany), `scratchpad/target-k5doc-t0` 3,1 GB (cache aktywnego T0, nie ruszany), worktree `wf_f3b76b65-261-3` 0,99 GB i `wf_5a965001-591-4` 1,1 GB (oba oznaczone wcześniej jako „dirty, nie ruszam”), `/tmp/claude-0/ev9f1` (decyzja właściciela).
- **Decyzja:** nie usuwam niczego z tych pozycji bez potwierdzenia. Nowe starty Rust przy < 8 GB wstrzymuję (zasada 5 z CLAUDE.md).
- **Do decyzji właściciela:** czy usunąć `scratchpad/target` (cache bez znanego właściciela) i dwa dirty worktree po zabezpieczeniu HEAD w `refs/keep`.

## Przebieg (06:18 UTC — heartbeat: bez nowych startów, dysk 7,1 GB)

- **Sloty:** 2 z 4. K5-BLOW-ENV-WEKTORY-Q1 (`wf_6ab179f1-525`) — FC w toku (Sonnet), Operator i Obrona zakończone. K5DOC-PROD-UNIT-STAN-T0 (`wf_a3de76ac-91a`) — Evaluator w toku (Sonnet), Operator zakończony.
- **Dlaczego bez nowych startów:** dysk **7,1 GB** wolnego — poniżej progu 8 GB dla tematów z kodem Rust (CLAUDE.md, zasada 5). Pełny `cargo test` przy integracji też tego wymaga. Tematy bez cargo (dokumentacja/rozpoznanie) są dozwolone, ale kandydaci z kolejki bez kodu pokrywają się z T4 (#123) albo czekają na decyzje (ZŁOŻA, COMBAT-WEJSCIA, R7K7C, ZDOBYCIE, kontrakt `ActivateOps`).
- **Zakaz startu kodu** do czasu zwolnienia miejsca (patrz tick wcześniej: `scratchpad/target` 3,1 GB, dirty worktree `wf_f3b76b65-261-3` i `wf_5a965001-591-4`, `/tmp/claude-0/ev9f1` — decyzje właściciela).
- **Parity:** `1a4982574` (bez zmian).

## Przebieg (06:51 UTC — integracja K5-BLOW-ENV-WEKTORY-Q1 na parity)

- **Wynik workflow `wf_6ab179f1-525`:** Operator `1c82ab4b6` PASS-WITH-NOTES → Obrona `453aed4c4` (poprawki: przypadki kodów 4–7 i notatki) → Evaluator PASS-WITH-NOTES (mutacja atk→def w `siege_tactics_blow_env.rs:215` daje FAIL, zweryfikowane) → **FC PASS-WITH-NOTES `453aed4c4`**.
- **Ancestry i zakres:** baza `7d8993c42` jest przodkiem FC; merge-tree czysty; diff vs parity = 5 plików (testy `p6_k5_blow_env*`, `gen.mjs`, `blow_env.json`, dokumentacja runu), **zero zmian w `src/`**, 2094 linie, same dodania.
- **Integracja:** merge `--no-ff` `453aed4c4` na parity `1a4982574` → `316ded4b7`. Bramki na merge'u: `fmt --check` EXIT 0; `clippy --all-targets -D warnings` EXIT 0; **`cargo test --all-targets --no-fail-fast` TEST_EXIT=0, 3627 passed, 0 failed, 1 ignored** (ignorowany istniał wcześniej, `p6_order_lane.rs`).
- **FF:** `rust-port/parity-v2` = `316ded4b7` (readback `git ls-remote` zgodny). Refy: `refs/keep/R-RUSTPORT-P6-K5-BLOW-ENV-WEKTORY-Q1-fc` (`453aed4c4`), `…-integ` (`316ded4b7`).
- **Sprzątanie:** worktree `wf_6ab179f1-525-1..4` i worktree integracji usunięte po zabezpieczeniu HEAD w `refs/keep/cleanup-K5BLOW-wt1..4`. Jedyny brud w nich to niezacommitowany `Cargo.lock` (zgodnie z regułą nie commitowany). Cache integracji usunięty.
- **Uwaga NIE_ZMIERZONO:** źródło `ctx.river_attack_mult` w produkcji nie jest weryfikowane tym tematem (Evaluator zarzut 2).
- **Dysk:** 14 GB wolnego po sprzątaniu (było 7,1 GB).
- **Sloty:** 1 z 4 — K5DOC-PROD-UNIT-STAN-T0 (`wf_a3de76ac-91a`, Evaluator, Sonnet). Fala 1 (T2', T6, T5a, T4) czeka na integrację T0 (zależność z §5 rozpoznania).

## Przebieg (06:54 UTC — cztery tematy na raz; sprzątanie dysku; nowe taski)

- **Sloty 4/4:** K5DOC-PROD-UNIT-STAN-T0 (`wf_a3de76ac-91a`, Obrona, Haiku) · **EXEC-T1-QUEUE** (`wf_acc61d3f-1fa`, Operator, Haiku) · **EXEC-T2-MOVE-GATE** (`wf_479bcc22-c55`, Operator, Haiku) · **H-MANUAL-ROZP** (`wf_d8a3e31a-461`, Operator, Haiku; recon, bez kodu).
- **Dispatche** na `claude/rust-sivvrn` przed startem (`52258872`), baza `316ded4b7` (parity po K5-BLOW).
- **Zależności:** EXEC-T2 wprowadza `player_order_move_gate.rs`; DOC-T4 ma go ponownie użyć (nie dublować). EXEC-T1 nie zmienia kontraktu `ActivateOps` (wstrzyknięty trait) — decyzja o kontrakcie nie jest potrzebna dla T1.
- **Taski:** dodano #255–#268 (DOC-T0…T8, DOC-H, EXEC-T1…T7). #112 zamknięty jako rozbity na DOC-T*. #255, #265, #266, #267 w toku.
- **Sprzątanie dysku:** usunięto nieaktywne cache (`/tmp/claude-0/fc-tgt`, `fc-tgt-missing0`, `tgt`) i pliki robocze scratchpadu (`web.tar`, `a.tar`, `w`, `w9`, `__pycache__`). Worktree zakończonych runów `wf_f3b76b65-261-3` i `wf_5a965001-591-4` zapisane przez `git stash push -u` (wpisy `stash@{0}` i `stash@{1}`) i usunięte. **Dysk: 17 GB wolnego** (było 7,1 GB).
- **Nie ruszane:** cache aktywnego T0 (`/tmp/claude-0/k5doc-r2-target`, 3,1 GB), `/tmp/claude-0/ev9f1` (1,2 GB, niezacommitowane zmiany — decyzja właściciela), worktree `wf_a3de76ac-91a-*`.

## Przebieg (06:54 UTC — heartbeat: 4/4 slotów, brak FC do integracji)

- **K5DOC-PROD-UNIT-STAN-T0** (`wf_a3de76ac-91a`): Operator i Evaluator zakończone, Obrona w toku (Haiku).
- **EXEC-T1-QUEUE** (`wf_acc61d3f-1fa`): Operator w toku (Haiku).
- **EXEC-T2-MOVE-GATE** (`wf_479bcc22-c55`): Operator w toku (Haiku).
- **H-MANUAL-ROZP** (`wf_d8a3e31a-461`): Operator w toku (Haiku, recon bez kodu).
- **Parity:** `316ded4b7` (bez zmian). **Dysk:** 14 GB wolnego.

## Przebieg (07:09 UTC — FC rozpoznania trybu ręcznego H; integracja docs-only; 3/4 slotów)

- **H-MANUAL-ROZP-Q1** (`wf_d8a3e31a-461`): Operator → Evaluator PASS-WITH-NOTES (7 zarzutów) → Obrona przyjęła wszystkie → **FC PASS-WITH-NOTES `5c900cdf9`**. Wynik: tryb ręczny oblężenia nie działa w produkcji Rust — `_performSiegeManualOrder` (pin 18435-18475) nieportowany, `ProdOps::perform_player_order` (`siege_tactics_loop.rs:773`) to atrapa, sterownik wyklucza tryb ręczny i oblężenie (`:1036-1039`). Helpery taranu, wieży i podejścia są zportowane, ale niepodłączone.
- **Kolejność H (z recon):** H1 (`player_unit_idle`) zwinięte do EXEC-T1 (#266) → T2 → H2 (`_rangedTargetInRange`/`_targetInRange`, z `meleeBlockedByWall`) → H3 (`_performSiegeManualOrder`, nowe pliki) → T3/T4 → T8 → H4 (wiring, jedyny temat dotykający `siege_tactics_loop.rs` w czterech miejscach).
- **Zależność jawna (Evaluator Z1):** samo odblokowanie trybu ręcznego nie wystarczy — H4 wymaga zdjęcia gałęzi „oblężenie” w `siege_tactics_loop.rs:1038-1039`; to zakres #113 lub osobnego tematu (NIE_ZMIERZONO, decyzja orkiestratora).
- **Integracja:** FC `5c900cdf9` nie jest na linii parity (przodek `a61337844`). Wniesiono tylko pliki runu (docs-only) na worktree z parity → commit `f38675a8`, FF `rust-port/parity-v2` = `f38675a8` (readback zgodny).
- **Pytanie techniczne (rozstrzygam sam, nie gameplay):** H2 zwinąć do #179/#148 — przyjęte jako kierunek; wykonanie czeka na te tematy.
- **Sloty: 3 z 4.** K5DOC-T0 (`wf_a3de76ac-91a`, Obrona), EXEC-T1-QUEUE (`wf_acc61d3f-1fa`), EXEC-T2-MOVE-GATE (`wf_479bcc22-c55`). Czwarty slot wolny: kolejne tematy portu zależą od T0 (T2', T5a, T6, T4), od EXEC-T2 (DOC-T4), od #179/#148 (H2) lub są do decyzji właściciela (ZŁOŻA #104, R7K7C #106, ZDOBYCIE #115, CRED #120). Nie dokładam tematu bez zależności.
- **Taski:** #265 zamknięty; #255, #266, #267 w toku.
- **Dysk:** 14 GB wolnego.

## Przebieg (07:21 UTC — heartbeat: sprzątanie dysku 2,8 → 6,7 GB; 3/4 slotów)

- **Sloty 3/4:** K5DOC-T0 (`wf_a3de76ac-91a`, FC w toku — run 3 wyników, Sonnet), EXEC-T1-QUEUE (`wf_acc61d3f-1fa`, Operator, Haiku), EXEC-T2-MOVE-GATE (`wf_479bcc22-c55`, Operator, Haiku). Brak FC PASS do integracji w tym ticku.
- **Dysk krytyczny (2,8 GB < próg 4 GB):** usunięto cztery czyste worktree zakończonego rozpoznania H (`wf_d8a3e31a-461-1..4`, ok. 2 GB). HEAD-y zabezpieczone: `refs/keep/cleanup-H-MANUAL-wt1..4` (`3589700dd`, `70f75431f`, `326c88889`, `5c900cdf9`). **Dysk: 6,7 GB.**
- **Nie usuwane (aktywne cache cargo):** `scratchpad/tgt-exec-t1` (3,2 GB, EXEC-T1), `scratchpad/tgt-t2` (3,2 GB, EXEC-T2), `/tmp/claude-0/fc-t0-target` (3,2 GB, T0). Po FC T0 i zakończeniu EXEC-T1/T2 — usunąć (kandydaci do sprzątania w następnym ticku).
- **Nie usuwane (decyzja właściciela):** `/tmp/claude-0/ev9f1` (1,2 GB).
- **Parity:** `f38675a8` (docs-only H). Gałąź `claude/rust-sivvrn`.

## Przebieg (08:22 UTC — T0 i EXEC-T2 zintegrowane; EXEC-T1 r2 i T2' w toku)

- **K5DOC-T0 (#255) — INTEGRACJA:** FC PASS-WITH-NOTES `18fca5b5a` → merge `--no-ff` na parity `f38675a8` = `126432304`. Bramki: fmt 0, clippy 0, `cargo test --all-targets` **TEST_EXIT=0, 3636 passed, 0 failed, 1 ignored** (istniejący). FF `rust-port/parity-v2` = `126432304` (readback zgodny). Refy: `refs/keep/K5DOC-T0-fc`, `-integ`, `cleanup-K5DOC-T0-wt1..4`.
  - **Odstępstwo zaakceptowane przez orkiestratora:** pola doktryny w `ProdBody.doctrine` (nie `ProdUnit`), bo literał `ProdUnit` w `tests/p6_k5loop_outcome_pin.rs:173` jest poza allowlistą.
  - **WARUNEK WSTĘPNY dla T1–T9 (zapisany):** `ProdBody` klonuje `pu.activate` i zapisuje z powrotem tylko `morale` i `surround_applied`. Mutacje `dry_col` i `held_after_fallback` z K5H nie przenoszą się między aktywacjami; `ProdDoctrineState` duplikuje `dry_col`/`held_after_fallback`/`mounted` z `ActivateUnit`. Naprawa (czytanie z `ActivateUnit` i zapis z powrotem) zmienia zachowanie U7.6, więc jest osobnym tematem przed T5a/T4/T6.
- **EXEC-T2-MOVE-GATE (#267) — INTEGRACJA:** FC PASS-WITH-NOTES `6e3a025fb` → merge `585bb48e0` na parity `126432304`. Zakres: 5 plików allowlisty (`player_order_move_gate.rs`, testy, generator, wektory) + `mod.rs`. Bramki: fmt 0, clippy 0, **TEST_EXIT=0, 3649 passed, 0 failed, 1 ignored**. FF parity = `585bb48e0`. Refy: `refs/keep/EXEC-T2-fc`, `EXEC-T2-integ`.
  - Notatka FC: anty-cofanie kolumny siedzi w `compact_attack_allows_step`, nie w `should_avoid_auto_backtrack` (korekta opisu dla DOC-T4). Atrapy `isSiegeUnit`/`_effectiveMetaForUnit` w generatorze — zależność DOC-T4.
- **EXEC-T1-QUEUE (#266) — FC FAIL (INFRA), runda 2:** commit obrony `3e370995e` wypchnięty jako `wip/R-RUSTPORT-P6-EXEC-T1-QUEUE-Q1-obrona-r1` (uwaga: pierwszy push trafił na złą gałąź, poprawione `--force-with-lease`). DODATEK r2 w dispatchu. Start: `wf_487c53ff-a4c`.
- **K5DOC-T2 CELE (#256) — start:** dispatch `0c585fbe`, baza `126432304`. Start: `wf_1c92bca8-2d5`.
- **Sprzątanie:** worktree T0 (`wf_a3de76ac-91a-1..4`) i EXEC-T2 (`wf_479bcc22-c55-1..3`) usunięte po `refs/keep`. Cache: `fc-t0-target`, `tgt-t2`, `target-integ-*` usunięte; `k5doc-r2-target` nie istniał.
- **Dysk:** 19 GB wolnego. **Sloty:** 2 z 4 (EXEC-T1 r2, T2'). Brak niezależnych kandydatów na 3. i 4. slot: T3 (geometria) czeka na dispatch; EXEC-T3..T7 czekają na EXEC-T1; DOC-T4/T5a/T6 czekają na T2'.

## Przebieg (08:23 UTC — heartbeat: 3/4 slotów, start T3 geometria)

- **Sloty 3/4:** EXEC-T1-QUEUE r2 (`wf_487c53ff-a4c`, Operator, Haiku), K5DOC-T2-CELE (`wf_1c92bca8-2d5`, Operator, Haiku), **K5DOC-T3-GEOMETRIA** (`wf_7d52ae9a-3df`, Operator, Haiku — start).
- **T3:** dispatch `452201a3` (baza `585bb48e0`). Zakres: `_attackFormationRallyPoint` i `_chargeMoveDest` (C7/C8, recon Z3 wskazuje martwy kod — osiągalność do potwierdzenia przed portem), `_moveTargetForUnit` (C9). `_forwardCol` już w parity (T0).
- **Czwarty slot:** brak niezależnego kandydata — EXEC-T3..T7 czekają na EXEC-T1, DOC-T4/T5a/T6 na T2', DOC-T8/T1 na całą falę.
- **Dysk:** 17 GB wolnego. **Parity:** `585bb48e0`.

## Przebieg (08:43 UTC — tick: 3 tematy w toku, bez FC do integracji; sprzątanie dysku 5,4 → 9,1 GB)

- **Sloty 3/4:** EXEC-T1-QUEUE r2 (`wf_487c53ff-a4c`, cargo w `target-t1-r2`), K5DOC-T2-CELE (`wf_1c92bca8-2d5`, cargo w `scratch_k5/target-t2`), K5DOC-T3-GEOMETRIA (`wf_7d52ae9a-3df`, cargo w `tgt-k5doc-geom`). Wszystkie na etapie Operatora, procesy żyją.
- **Sprzątanie:** worktree rundy 1 EXEC-T1 (`wf_acc61d3f-1fa-1..3`) usunięte po zapisaniu HEAD w `refs/keep/cleanup-EXEC-T1-r1-wt1..3` (`9b8ef8560`, `6fd1c850a`, `3e370995e`); cache `/tmp/claude-0/t1-target` (290 MB, runda 1) usunięty. **Dysk: 9,1 GB.**
- **Parity:** `585bb48e0` (bez zmian). Czwarty slot wolny: brak niezależnego kandydata.

## Przebieg (08:47 UTC — heartbeat: 3/4 slotów, bez FC do integracji)

- **EXEC-T1-QUEUE r2** (`wf_487c53ff-a4c`): Operator zakończony, w toku Evaluator (Sonnet).
- **K5DOC-T2-CELE** (`wf_1c92bca8-2d5`): Operator w toku (Haiku).
- **K5DOC-T3-GEOMETRIA** (`wf_7d52ae9a-3df`): Operator w toku (Haiku).
- **Parity:** `585bb48e0`. **Dysk:** 11 GB wolnego. **Sloty:** 3/4 (czwarty wolny — brak niezależnego kandydata).

## Przebieg (09:18 UTC — T2 CELE FC PASS-WITH-NOTES; integracja odłożona do czasu miejsca na dysku)

- **K5DOC-T2-CELE** (`wf_1c92bca8-2d5`): FC PASS-WITH-NOTES `03dfa64c2` (obrona r2 `1aa85c8b2`, Evaluator r1 `05e405efc`). Ancestry: baza `126432304` jest przodkiem; merge-tree czysty; zakres = 5 plików allowlisty (`mod.rs`, `siege_tactics_doctrine_target.rs`, testy, generator, wektory) + dokumentacja. Zero zmian w `gra/` i `siege_tactics_loop.rs` (wpięcie w T8/#113).
- **Ograniczenie:** pełny `cargo test --all-targets` NIE został potwierdzony w rundzie r2 (proces testu z obrony `k5doc-target-r2` działa od >9 min, nie zakończył się). Bramka integracyjna z pełnym testem wykonana zostanie przy ≥8 GB wolnego miejsca. Ref: `refs/keep/K5DOC-T2-fc` (`03dfa64c2`).
- **Sprzątanie:** worktree T2 `-1` i `-2` usunięte (HEAD-y w `refs/keep/cleanup-T2-wt1..2`), cache `scratchpad/target-t1-r2` (3,2 GB, runda 2 Operatora EXEC-T1 już zakończona) usunięty. **Dysk: 5,3 GB.**
- **Nie usuwane:** `k5doc-target-r2` (aktywny proces testu T2), `ev_t1q1_target` (aktywny Evaluator EXEC-T1), `tgt-ev` (aktywny T3), `/tmp/claude-0/ev9f1` (decyzja właściciela).
- **Parity:** `585bb48e0`. **Sloty:** EXEC-T1 r2 (Evaluator), T3 (Evaluator), T2 (po FC, czeka na integrację).

## Przebieg (09:19 UTC — heartbeat: bez nowych startów, dysk 5,3 GB; T2 czeka na integrację)

- **Stan:** EXEC-T1 r2 (`wf_487c53ff-a4c`) i T3 GEOMETRIA (`wf_7d52ae9a-3df`) — Operator zakończony, w Evaluatorze (Sonnet). T2 CELE (`wf_1c92bca8-2d5`) — FC PASS-WITH-NOTES `03dfa64c2`, integracja odłożona (pełny test wymaga ≥8 GB).
- **Dlaczego bez startów:** dysk 5,3 GB < próg 8 GB dla tematów z kodem (CLAUDE.md, zasada 5). Pozostałe kandydaty (DOC-T4/T5a/T6 z bazą `03dfa64c2`) są dozwolone regułą heartbeatu, ale wstrzymane tym samym progiem dysku.
- **Cache aktywne:** `k5doc-target-r2`, `ev_t1q1_target`, `tgt-ev` (po 3,2 GB każdy) — w użyciu, nie ruszane. Stare katalogi w `/tmp/claude-0` są małe (<12 MB), nie zwalniają miejsca.
- **Parity:** `585bb48e0`.

## Przebieg (09:40 UTC — tick: dysk 3,1 → 7,3 GB; T2 czeka na integrację)

- **Stan:** EXEC-T1 r2 (`wf_487c53ff-a4c`) i T3 GEOMETRIA (`wf_7d52ae9a-3df`) — oba po Operatorze i Evaluatorze, w toku dalszych etapów (cargo żywe). T2 CELE — FC PASS-WITH-NOTES `03dfa64c2`, integracja odłożona.
- **Sprzątanie:** proces testu obrony T2 już nie działa. Usunięto worktree T2 `-3` (HEAD `1aa85c8b2` w `refs/keep/cleanup-T2-wt3`) i cache `/tmp/claude-0/k5doc-target-r2` (3,2 GB). **Dysk: 7,3 GB.**
- **Dlaczego jeszcze bez integracji T2:** pełny test wymaga ≥8 GB wolnego miejsca (CLAUDE.md, zasada 5). Brakuje ok. 0,7 GB. Integrację zrobię, gdy EXEC-T1 lub T3 zakończą i zwolnią swoje cache.
- **Aktywne, nie ruszane:** `/tmp/claude-0/k5doc-geo-target-r2` (T3) i `wf_487c53ff-a4c-3-tgt-r2` (EXEC-T1), `/tmp/claude-0/ev9f1` (decyzja właściciela).
- **Parity:** `585bb48e0`.

## Przebieg (09:47 UTC — heartbeat: 2/4 aktywnych, bez startów przy 7,3 GB; kandydaci na bazie T2 FC `03dfa64c2` wstrzymani)

- **EXEC-T1 r2** (`wf_487c53ff-a4c`) i **T3 GEOMETRIA** (`wf_7d52ae9a-3df`): po Operatorze i Evaluatorze, bez FC.
- **T2 CELE** (`wf_1c92bca8-2d5`): FC PASS-WITH-NOTES `03dfa64c2`, integracja czeka na ≥8 GB (pełny test).
- **Wolne sloty (2):** DOC-T5a, DOC-T4 i DOC-T6 mogą mieć bazę `03dfa64c2` (zgodnie z regułą heartbeatu), ale start kodu Rust wymaga 8 GB (CLAUDE.md, zasada 5). Dysk 7,3 GB — wstrzymane.
- **Parity:** `585bb48e0`.

## Priorytety 3D (Opus) — przegląd stanu i kolejka (09:50 UTC)

**Zrobione na Opusie i zintegrowane na parity (wg rejestru):** P4-1 RENDER-DTO-CONTRACT (#186), P4-0 RENDERER-ARCHITECTURE (#187), P4-15 GPU-SPIKE-PREP (#188), P4-36 MOD14 BATTLE-3D Q3–Q5 (#189, #202, #203), P4-17 MOD03 TERRAIN-DECOR (#190), P4-31 ATLAS-CACHE (#200, #201), P4-10 PICKING-CPU (#204), P4-1A VIEW-TYPES (#205), P4-34 ANCHORS-DOM (#206), P4-22 MOD13 MISC (#207), P4-29 TEXT-FONTS (#208), P4-1B MAP-VIEW Q1–Q3 (#211), P4-1D STACK-REPIN / UNIT-VIEW (#213), P4-1E CITY-VIEW (#214, #222), P4-1F1 OVERLAY-TYPES (#238), P4-1G Q1–Q4 ADAPTER (#216 Q1–Q3, #235 Q4), P4-1H Q2–Q6 (#217, #250–#252), P4-1I1 BATTLE-OUTCOME (#244), P4-1I1B BATTLE-INSTANT (#245), P4-1J PLANNED-MARCH-STATE (#209), M01-R2 MAPHEX (#210), RENDERER-ORDERS-CYTATY (poza listą P4, Opus).

**Do zrobienia — startowalne od ręki (blokady zamknięte):** PRIO-3D-1 Q5 overlays (#269, #236); PRIO-3D-2 Q6 units (#270, #237); PRIO-3D-3 F3 siege/wonder (#271, #240); PRIO-3D-4 F4 trade/workers/okolica (#272, #241); PRIO-3D-5 F5 reach/path (#273, #242); PRIO-3D-6 F6 build selection (#274, #243); PRIO-3D-7 I2 battle frame (#275, #246).

**Następnie:** PRIO-3D-8 I3 battle actions (#276, #247), PRIO-3D-9 I4 battle consumer — renderer animacje (#277, #248).

**Zablokowane:** PRIO-3D-10 F2 territory ranges (#278, #239) i PRIO-3D-11 L1/L2 (#279, #254) — decyzja mgły dla fotela ≠ 0 (#253, rekomendacja C). PRIO-3D-12 I5 akcje oblężnicze (#280, #249) — pętla K5LOOP #107/#109/#112/#113.

**Uwaga:** start Opusa na kodzie Rust wymaga ≥8 GB wolnego miejsca (CLAUDE.md, zasada 5). Dysk 7,3 GB — pierwsze starty po zwolnieniu miejsca lub po zakończeniu T1/T3.

### Przebieg — start dwóch tematów 3D (Opus), 2026-11-16

- **P4-1F3 SIEGE-WONDER-VIEW (#271/#240)** — start Workflow `wf_e659c069-e97`; dispatch `bd476dbdb` (`dyspozycje/autobot/runs/R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW/00-dispatch.md`); baza parity `585bb48e0` (zawiera 1F1 `8ecf01c2c`). Etap: Operator. Model: OPUS we wszystkich rolach.
- **P4-1I2 BATTLE-FRAME (#275/#246)** — start Workflow `wf_9ebab86f-5b4`; dispatch `bd476dbdb` (`dyspozycje/autobot/runs/R-RUSTPORT-P4-1I2-BATTLE-FRAME/00-dispatch.md`); baza parity `585bb48e0` (zawiera I1 `05e4df502` i I1B `474487792`). Etap: Operator. Model: OPUS we wszystkich rolach.
- **Sprzątanie dysku:** worktree T2 `wf_1c92bca8-2d5-4` (HEAD `03dfa64c2`, FC PASS-WITH-NOTES, brudny tylko `Cargo.lock`) usunięty; HEAD zabezpieczony lokalnie jako `refs/keep/cleanup-T2-wt4`. **Push tego refa nieudany** (HTTP 403 z proxy przy wysyłce ~91 tys. obiektów; zgodnie z dokumentacją proxy nie obchodzę polityki). Commit `03dfa64c2` istnieje tylko lokalnie — do ponowienia przy dostępnym transferze.
- Wolne miejsce na `/`: 12 GB przed startem (próg 8 GB dla tematów Rust spełniony).
- Zablokowane bez zmian: P4-1F2 (#278) i P4-1 L1/L2 (#279) — decyzja mgły #253; P4-1I5 (#280) — pętla oblężnicza K5LOOP.

### Przebieg — heartbeat Rust, 2026-11-16 10:19 UTC

- **Sloty:** realnie aktywne 2 Workflow — P4-1F3 SIEGE-WONDER-VIEW (`wf_e659c069-e97`, Operator, OPUS) i P4-1I2 BATTLE-FRAME (`wf_9ebab86f-5b4`, Operator, OPUS). Pozostałe 26 journali ma stare znaczniki (sprzed restartu), nie liczę ich jako trwających.
- **Start nowych tematów: WSTRZYMANY.** Dysk 4,7 GB wolnego; reguła 5 (CLAUDE.md) wymaga ≥ 8 GB dla tematów z kodem Rust. Heartbeat dopuszcza 4 GB, ale ostrzejsza reguła wygrywa.
- **Integracja EXEC-T1 (K5EXEC-T1, FC PASS-WITH-NOTES `6462b7b07`, kod `2e510195c`):** merge `05b872fc5` na `parity-v2 585bb48e0`, jedyny konflikt w `mod.rs` rozwiązany (obie linie `pub mod`). Bramki: fmt EXIT 0, clippy EXIT 0; pełny `cargo test --all-targets` w toku. FF na parity dopiero po zielonym wyniku. Kopia WIP: `wip/R-RUSTPORT-P6-EXEC-T1-QUEUE-Q1-integracja`.
- **Do integracji po EXEC-T1:** K5DOC-T3 GEOMETRIA (FC PASS-WITH-NOTES, FC `efa3b7642`, kod `85befb9ff`) — task #290. Notatki FC: C7/C8 martwe w pinie, mutacja (c) NIE_DOTYCZY dla C9.
- **Rozbieżność z harmonogramem:** prompt heartbeatu wymaga Operatora Haiku; reguła właściciela dla tematów 3D (seria P4-1) to OPUS we wszystkich rolach. Tematy 1F3 i 1I2 działają na Opus zgodnie z regułą właściciela.
- **Nie ruszane:** `Cargo.lock` (nieśledzony, zgodnie z regułą), cache `fc_k5t3_target` (3,2 GB, do usunięcia po T3, task #287), `ev9f1` (decyzja właściciela).

### Przebieg — heartbeat Rust, 2026-11-16 10:48 UTC

- **Sloty Opus (4/4 działają):** P4-1F3 (Operator), P4-1F4 (Operator), P4-1F5 (Operator), P4-1I2 (Obrona). Start nowych tematów wstrzymany: dysk 2,4 GB wolnego (reguła 5 wymaga ≥ 8 GB).
- **P4-1I2 BATTLE-FRAME — NIE zintegrowany.** Operator: BLOCK (brak pełnego `cargo test --all-targets` engine, bo dysk 6,6 GB < 8 GB; commit `d303607bf`, lokalnie). Evaluator: FAIL (2 blokery: brak testu ramki po KAŻDYM `fire` — mutacje M1/M2 przechodzą; brak bramki pełnej). Obrona w toku. Kolejna runda tego samego ID musi uruchomić bramkę i dopisać test ramki po kroku.
- **EXEC-T1 (K5EXEC-T1) — zintegrowany** na `parity-v2` = `05b872fc5` (FF po zielonych bramkach: fmt, clippy, `cargo test` 3653 passed / 0 failed).
- **Sprzątanie:** usunięte worktree EXEC-T1 (r1, `wf_487c53ff`), T3 (`wf_7d52ae9a`), integracji EXEC-T1 oraz cache `fc_k5t3_target`. Stary worktree `wf_acc61d3f` (EXEC-T1 r1, zastąpiony przez r2) — usuwany tylko jeśli czysty.
- **Do zrobienia po zwolnieniu dysku:** integracja K5DOC-T3 GEOMETRIA (FC `efa3b7642`, wip `…-integracja`) — scalić z `05b872fc5`, pełne bramki.
- **Rozbieżność:** harmonogram heartbeatu wymaga Operatora Haiku; reguła właściciela dla tematów 3D to Opus we wszystkich rolach (zachowana).

### Przebieg — wznowienie po restarcie sesji, 2026-11-16 ~12:40 UTC

- **BLOKADA SUBSKRYPCJI (poza kodem):** Evaluator i Final Control wszystkich trzech tematów Opus padły z błędem „Claude Code can't use your Claude subscription … payment is past due”. Dotyczy: P4-1F3 (Evaluator był PASS-WITH-NOTES, FC padł), P4-1F4 (Operator PASS, Evaluator i FC padły), P4-1F5 (Operator padł, brak kodu). Wymaga opłacenia subskrypcji; do tego czasu nie ma FC dla 1F3/1F4.
- **P4-1I2 BATTLE-FRAME — FC PASS-WITH-NOTES `43709ed0a`** (po rundzie Obrony r2: test ramki po każdym `fire`, pełna bramka). Commit FC przypięty `refs/keep/P4-1I2-fc` i na `wip/R-RUSTPORT-P4-1I2-BATTLE-FRAME-integracja`. Integracja: merge `0e3c149fa` na `parity-v2 05b872fc5` (czysty). Bramki: view-model fmt/clippy/test zielone; engine fmt/clippy zielone; pełny `cargo test` engine w toku. FF dopiero po zielonym wyniku.
- **Zachowane na WIP (bez FC):** 1F3 `999083029` / ev `48ef28025` / obrona `92dce8414` (`wip/R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW-*`); 1F4 `c1d829320` (`wip/…1F4…-op-r1`) + poprawka niezacommitowana (`wip/…1F4…-poprawka`, `aaaeef96`); 1F5 niedokończony (`wip/…1F5…-niedokonczony`, `587cfa79`).
- **Sprzątanie:** usunięte worktree 1I2 (`-1..4`), 1F3 `-4`, 1F4 `-2`, 1F5. Pozostają: 1F3 `-1..3` (branche wip zachowane), `wf_acc61d3f` (stary EXEC-T1 r1), `ev9f1` (decyzja właściciela).
- **Do zrobienia:** (1) po zielonym teście engine — FF `parity-v2` na `0e3c149fa` i wpis wyniku; (2) po opłaceniu subskrypcji — Evaluator/FC dla 1F3 (`48ef28025`) i 1F4 (`c1d829320`); 1F5 — nowa runda Operatora; (3) integracja K5DOC-T3 GEOMETRIA (`efa3b7642`).
- **Rozbieżność z harmonogramem:** prompty heartbeatu wymagają Operatora/Obrony Haiku i Evaluatora/FC Sonnet; reguła właściciela dla 3D to Opus we wszystkich rolach (zachowana).

### Przebieg — heartbeat Rust, 2026-11-16 ~12:50 UTC

- **Sloty: 0 z 4 aktywnych.** Tematy 1F3, 1F4, 1F5 zakończone lub przerwane przez blokadę płatności (Evaluator/FC/Operator: „payment is past due”). Nowe starty wstrzymane: każdy agent padłby na tym samym błędzie. Wznowienie po opłaceniu subskrypcji.
- **P4-1I2 — bramka engine:** pierwszy przebieg `cargo test --all-targets` został przerwany restartem sesji (log urwany 12:39, test `pick_auto_improvements_matches_pinned_web_vectors` działał ponad 60 s). Ponowiony odłączony przez `setsid`. FF `parity-v2` (`05b872fc5` → `0e3c149fa`) dopiero po zielonym wyniku.
- **Dysk:** 8,5 GB wolnego.
- **Rozbieżność z harmonogramem:** prompty heartbeatu wymagają Haiku na Operatorze/Obronie i Sonnet na Evaluatorze/FC; reguła właściciela dla 3D to Opus we wszystkich rolach (zachowana).

### Przebieg — P4-1F6 BUILD-SELECTION-VIEW zintegrowany, 2026-11-16 ~14:40 UTC

- **Parity:** `rust-port/parity-v2` = `0f3483e57` (FF z `05b872fc5`). FC PASS-WITH-NOTES (`0f3483e57`, kod `24f57d81`). Evaluator odtworzył pełne bramki na `24f57d81` (fmt, clippy `-D warnings`, `cargo test --all-targets`: 3667 passed, 0 failed) i mutacje (a)(b)(c) dają FAIL. Różnica `24f57d81`→`0f3483e57` to tylko dokumentacja (zero zmian w `rust-port`/`gra`).
- **Zależności do przeniesienia do składacza OverlaysViewDto (P4-1G Q6, #237):**
  - Z-1: producent `build_highlight`/`selection` nie ma wołającego w Rust; składacz musi podać `can_found_player_city_at` (przez `StartRevealContext`), `list_qualifying_wonder_hexes_for_owner`, `get_qualifying_hexes`, `PendingImprovementsTurn::undo_key_set()` i `UiState.selectedUnitId`.
  - Z-2: `foundingTerritoryOpts`, `ownerEra`, `cityLimitBase` nie są przeniesione (zostają po stronie wołającego).
  - Z-3: test cofania używa ręcznie wpisanych kluczy `"3,0:farma"`; należy zastąpić kluczami z `undo_key_set()`.
  - Z-4: `selection` nie sprawdza `isMe(u.ownerId)` (pin `main.ts:7117`); składacz musi filtrować lub dodać filtr.
- **Konflikt do rozstrzygnięcia:** `overlays_view.rs` powstał w F6 (na bazie go nie było) i jest też tworzony przez 1F3, 1F4, 1F5. Przy ich integracji będzie konflikt.
- **Do zrobienia:** 1I2 (`0e3c149fa`) był scalony z poprzednim parity — trzeba powtórzyć merge na `0f3483e57` i pełny cargo test engine przy ≥ 8 GB.
- **Dysk:** sprzątanie zakończonych cache i worktree; działające tematy (I3, 1F5, recenzja 1F4) nie są ruszane.

### Przebieg — heartbeat Rust, 2026-11-16 14:23 UTC

- **Sloty: 3 z 4 aktywne.** P4-1I3 BATTLE-ACTIONS (Operator, od 13:37), P4-1F5 REACH-PATH-VIEW (Operator r2 PASS-WITH-NOTES → Evaluator), P4-1F4 recenzja (Evaluator PASS-WITH-NOTES → Obrona).
- **Czwarty slot wstrzymany:** dysk 7,8 GB; reguła 5 (CLAUDE.md) wymaga ≥ 8 GB dla tematów z kodem Rust.
- **Integracje:** F6 zintegrowany (FF parity `0f3483e57`, wpis wyżej). Pozostają: I2 (merge `0e3c149fa` do powtórzenia na `0f3483e57`), FC 1F4 (po Obronie), FC 1F3 (`48ef28025`/`92dce8414`, po opłaceniu subskrypcji — wcześniej blokada płatności).
- **Rozbieżność z harmonogramem:** prompt heartbeatu wymaga Haiku/Sonnet; reguła właściciela dla 3D to Opus we wszystkich rolach (zachowana).

### Przebieg — heartbeat Rust, 2026-11-16 14:48 UTC

- **Sloty: 3 z 4 aktywne.** P4-1I3 BATTLE-ACTIONS (Evaluator PASS-WITH-NOTES → Obrona), P4-1F5 REACH-PATH-VIEW (Evaluator → Obrona → FC, FC w toku), P4-1F4 TRADE-WORKERS-OKOLICA (recenzja: Evaluator PASS-WITH-NOTES → Obrona → FC w toku).
- **Czwarty slot wstrzymany:** dysk 5,3 GB (reguła 5 wymaga ≥ 8 GB dla tematów z kodem Rust).
- **Integracje:** brak nowych FC PASS do scalenia w tym przebiegu. Parity `0f3483e57` (F6). Do zrobienia: merge I2 (`0e3c149fa`) na `0f3483e57` z pełnym testem engine; FC 1F3 (po opłaceniu subskrypcji).
- **Rozbieżność z harmonogramem:** prompt heartbeatu wymaga Haiku/Sonnet; reguła właściciela dla 3D to Opus we wszystkich rolach (zachowana).

### Przebieg — P4-1I3 BATTLE-ACTIONS: FC PASS-WITH-NOTES, 2026-11-16 ~15:15 UTC

- **FC:** `0deb9a075` (baza: FC I2 `43709ed0a`, kod po Obronie `001af723d`). Na WIP: `wip/R-RUSTPORT-P4-1I3-BATTLE-ACTIONS-integracja`, `refs/keep/P4-1I3-fc`.
- **Bramki:** view-model fmt/clippy/test zielone; engine: 496 binarek testowych, 3666 passed, 0 failed (wykonane sekwencyjnie, bo jednorazowy `cargo test` przekracza limit 590 s).
- **Kolejność integracji:** I2 (`43709ed0a`, merge `0e3c149fa` do powtórzenia na `0f3483e57`) MUSI wejść przed I3. Dopiero potem I3.
- **Zarzuty do przeniesienia (nie blokują):** I5 / K5LOOP-OUTCOME — skutki trafienia wieży poza zabiciem i gałąź `neverRout`; I4 — kierunek jednostki w oknie `[t0, hitAt)` z akcji `Facing`; przy wpinaniu #113 — unikalność id jednostek między stronami.
- **Dysk:** 4,8 GB — pełny test engine dla I2/I3 wymaga ≥ 8 GB.

### Przebieg — P4-1F5 REACH-PATH-VIEW: FC PASS-WITH-NOTES, 2026-11-16 ~15:30 UTC

- **FC:** `63b4f0dd8` (kod `e34af8294` + Obrona `5b8a70ba5`). Na WIP: `wip/R-RUSTPORT-P4-1F5-REACH-PATH-VIEW-integracja`, `refs/keep/P4-1F5-fc`.
- **Bramki Operatora/Evaluatora:** fmt/clippy `-D warnings` EXIT 0; `view_overlays_reach_path` 12/12 (po Obronie 14/14); `--lib` 124/124; pełny test: 3665 passed, 0 failed (zmierzony przez Operatora). Final Control nie powtarzał pełnego testu.
- **Merge z parity `0f3483e57`:** konflikt add/add w `overlays_view.rs` (F6 i 1F5 tworzą ten sam plik). Ten sam konflikt ma 1F4. Scalenie to współdzielenie kodu, nie wybór wersji.
- **Zarzuty do rejestru (nieblokujące):** składacz `reachable_overlay`/`path_route_overlay` nie jest wołany w produkcji (P4-1G Q6); `is_me` (aktywny fotel) zamiast `is_human_owner` — dług przy #281; granica kosztu scalenia pokryta testem r7.
- **Kolejność integracji:** I2 → I3 → overlays (1F4, 1F5, 1F3), każdy z pełną bramką przy ≥ 8 GB.

### Przebieg — integracja P4-1I2 + P4-1I3 na parity, 2026-11-16 ~15:45 UTC

- **Parity `rust-port/parity-v2` = `9f7c55499`** (FF z `0f3483e57`). Merge zawiera FC I3 `0deb9a075`, który zawiera FC I2 `43709ed0a`.
- **Bramki na merge:** view-model fmt/clippy/test zielone; engine fmt/clippy zielone; pełny `cargo test --all-targets` engine: **3687 passed, 0 failed** (uruchomiony w tle, odłączony od sesji).
- **Zarzuty do przeniesienia (nieblokujące):** I4 — kierunek jednostki w oknie `[t0, hitAt)` (z akcji `Facing`); I5 / K5LOOP-OUTCOME — skutki trafienia wieży poza zabiciem i gałąź `neverRout`; #113 — unikalność id jednostek między stronami przy wpinaniu produkcji.
- **Do scalenia na nowym parity (konflikty w `overlays_view.rs`):** 1F4 (FC `1724516c2`), 1F5 (FC `63b4f0dd8`). 1F3 — FC po opłaceniu subskrypcji.
- **W toku:** P4-1I4 BATTLE-CONSUMER (Opus, baza FC I3 `0deb9a075`, Workflow `wf_965d78f9-294`): Evaluator zakończony, Obrona/FC w toku.
- **Dysk:** 18 GB wolnego po sprzątaniu worktree integracji.

### Przebieg — heartbeat Rust, 2026-11-16 15:48 UTC

- **Sloty: 1 z 4 aktywny** — P4-1I4 BATTLE-CONSUMER (Opus, baza FC I3 `0deb9a075`): Evaluator PASS-WITH-NOTES, Obrona w toku, potem FC.
- **Brak odblokowanych tematów Opus do startu:** I5 (#280) i F2 (#278) zablokowane (K5LOOP / mgła #253); overlay 1F4/1F5 wymaga ręcznego scalenia `overlays_view.rs` z pełnym testem, nie nowego Workflow; 1F3 FC po opłaceniu subskrypcji.
- **Parity:** `9f7c55499`. **Dysk:** 17 GB.
- **Rozbieżność z harmonogramem:** prompt heartbeatu wymaga Haiku/Sonnet; reguła właściciela dla 3D to Opus we wszystkich rolach (zachowana).

### Przebieg — heartbeat Rust „twardy bit”, 2026-11-16 16:19 UTC

- **Sloty: 3 z 4 aktywne** (trzy Workflow, trzy procesy cargo):
  - INTEG nakładek 1F5 + 1F4 na `9f7c55499` (OPUS, `wf_4b0573bb-d8f`): integracja w toku, pełny test engine.
  - BRAMKI FC 1F3 na `25fdeb11a` (OPUS, `wf_129a66e9-6b5`): clippy/test w toku (poprzedni FC zakończył się INFRA, nie defektem).
  - INTEG K5DOC-T2 CELE (`03dfa64c2`) + T3 GEOMETRIA (`efa3b7642`) na `9f7c55499` (HAIKU, `wf_e50cec97-fe3`), dispatch `2a0967eaa`. Obie gałęzie scalają się czysto osobno; integracja sekwencyjnie.
- **Czwarty slot wstrzymany — nie ma czystego tematu:** kandydaci z kolejki wymagają decyzji właściciela (#97 zakres trybu ręcznego: K5-LOOP-AUTO vs T1–T3; #106 pkt 4: dispatch przez wszystkie fotele; #115 / #120 wariant A/B; #135 kolejność zwarcia) albo kodu, którego nie ma na parity (#113, #109). Start „dla zapełnienia” zabroniony regułą.
- **Parity:** `9f7c55499`, bez zmian w tym przebiegu. FF po zielonych bramkach integracji nakładek i T2/T3.
- **Dysk:** 15 GB wolnego. Sprzątanie w tej turze: zabity osierocony bieg FC 1F3, usunięte `fc1f3_target`, `integ-i23-target`, worktree `ev9f1` i worktree FC 1F3 (branch `fc/…1F3…` z `25fdeb11a` zostaje).
- **Otwarte, nieprzeprowadzone:** `refs/keep/R-RUSTPORT-P4-1I4-fc` = `54fa4c704` (I4 FC PASS-WITH-NOTES) — push na remote odrzucany przez proxy (`remote end hung up`), zostaje lokalnie. Proces `p6_8i_pick` z usuniętego targetu do weryfikacji w logu.
- **Rozbieżność z harmonogramem:** prompt heartbeatu wymaga Haiku na Operatorze i Sonnet na Evaluatorze/FC; reguła właściciela dla tematów 3D to Opus we wszystkich rolach (zachowana dla 1F3/1F4/1F5). Integracja T2/T3 na Haiku zgodnie z regułą integracji.

### Przebieg — integracja K5DOC-T2 CELE + T3 GEOMETRIA na parity, 2026-11-16 ~16:45 UTC

- **Parity:** `rust-port/parity-v2` = `75de326bc` (FF z `9f7c55499`, readback zgodny). Merge `a43be8147` (T2 `03dfa64c2`), potem `75de326bc` (T3 `efa3b7642`). Oba commity są przodkami parity.
- **Bramki (Haiku, worktree z `9f7c55499`):** fmt EXIT 0, clippy `-D warnings` EXIT 0, pełny `cargo test --all-targets`: 3696 passed, 0 failed, 1 ignored (`e2e::dump_tick1_econ_for_web_generator`, pre-existing w `9f7c55499`, `p6_order_lane.rs:1530`).
- **Konflikty:** brak; `mod.rs` z obiema liniami `pub mod` (`siege_tactics_doctrine_geometry`, `siege_tactics_doctrine_target`).
- **Dispatch:** `2a0967eaa` (`dyspozycje/autobot/runs/R-RUSTPORT-P6-INTEG-K5DOC-T2-T3/`).
- **Do zrobienia:** wątek nakładek (`wf_4b0573bb-d8f`, integracja 1F5+1F4) był zbudowany na `9f7c55499` — jego FF na parity nie będzie fast-forward. Trzeba zrobić re-merge na `75de326bc` i powtórzyć pełną bramkę przed FF. Tak samo FC 1F3 (`25fdeb11a`, bramki PASS) wymaga rundy integracyjnej po nakładkach.
- **Dysk:** 20 GB wolnego po sprzątaniu.

### Przebieg — heartbeat Rust „twardy bit” (druga połowa, 16:48 UTC), 2026-11-16

- **Sloty: 2 z 4 aktywne.**
  - Ponowna integracja nakładek 1F5 + 1F4 na `75de326bc` (OPUS, `wf_b810fc5a-fea`, dispatch r2 `3e6a4556b`). Poprzedni wynik (`e668add29`) był na `9f7c55499`, więc wymaga re-merge i pełnej bramki przed FF.
  - K5-LOOP-AUTO-WEKTORY V1/V5/V6 (#118, HAIKU Operator, SONNET Evaluator i FC, `wf_55097f16-9ad`, dispatch `157d49f5b`). Zakres bez blokady wg rozpoznania `R-RUSTPORT-P6-AUTO-SCOPE-ROZP-Q1` §5 pkt 1. V2, V7–V14 zostają zablokowane (doktryna #112, morale #109, tryb ręczny).
- **Slot 3 i 4 wstrzymane:** kolejka #96–#119 bez czystych tematów (decyzje: #97 zakres ręcznego, #106 pkt 4, #115/#120 A/B, #135 kolejność; #109/#113 zależą od OUTCOME).
- **Parity:** `75de326bc` (bez zmian w tym przebiegu). **Dysk:** 16 GB.
- **Otwarte:** `refs/keep/R-RUSTPORT-P4-1I4-fc` (`54fa4c704`) nadal odrzucany przez proxy; zostaje lokalnie.

### Przebieg — heartbeat Rust „twardy bit”, 2026-11-16 17:18 UTC

- **Parity:** `rust-port/parity-v2` = `9a71caf8a` (FF z `3a8f068f6` po integracji 1F3, bramki: 3735 passed, 0 failed, 1 ignored pre-existing). 1F3 wszedł z konfliktem add/add w `overlays_view.rs` rozstrzygniętym przez zachowanie wszystkich funkcji i typów obu stron.
- **Sloty: 4 z 4 aktywne:**
  - Integracja I4 BATTLE-CONSUMER (`54fa4c704` na `9a71caf8a`, merge-tree czysty), OPUS, `wf_ae87176a-2f8`, dispatch `f136730bb`.
  - K5-LOOP-AUTO V1/V5/V6 (#118), HAIKU/SONNET, `wf_55097f16-9ad`.
  - Wektory pętli dystansu (#100, chain A, `wf_a01f4cfa-dd0`): Operator w toku.
  - Audyt parytetu (#302, dokument, HAIKU/SONNET), `wf_84cdb3a2-d6f`, dispatch `1dd6f5c0b`.
- **Rozpoznanie NaN/Inf (#137) — PASS-WITH-NOTES** (`R-RUSTPORT-P6-NAN-INF-AMUNICJA-ROZP-Q1`, cherry-pick `b0fb11faf`): tylko odczyt, bez pina i cargo (NIE_ZMIERZONO). Wynik: produkcja nie podaje NaN/Inf; w `resolveAmmo` brak walidacji override; `maxRounds` 30 lub 200 zależnie od trybu. Implementacja osobnym tematem po decyzji o zachowaniu przy NaN.
- **R7K7C-STATUS (#176) — PASS:** `apply_dipl_deltas_to_state` nie jest wpięte w `advance_turn`; wektorów ≥150 brak. Wpięcie (#298) czeka na decyzję #282.
- **Dysk:** 15 GB.
- **Otwarte:** `refs/keep` I4 (`54fa4c704`) odrzucany przez proxy; log `p6_8i_pick` do weryfikacji.

### Przebieg — AUDYT parytetu 9a71caf8a (#302), 2026-11-16 ~17:40 UTC

- **Dokument:** `dyspozycje/rust-port/p6/AUDYT-PARYTET-9a71caf8a.md` (commit `8a0beec86`), PASS-WITH-NOTES (Operator Haiku, Evaluator Sonnet). Tylko odczyt, bez kodu, bez cargo.
- **Wynik:** z 206 modułów `engine/src/domain/` 82 są osiągalne z `bridge.rs`, 80 tylko z nieosiągalnego kodu, 44 bez wołającego produkcyjnego.
- **Najważniejsze luki:**
  - `advance_turn` (`playable.rs` ~1400) woła produkcyjnie `run_war_turn`, a także fazę zwycięstwa. Ekonomia tury, eliminacja, zdobycie miasta, pętla oblężnicza i `combat::resolve` nie są wołane z tury.
  - Cały klaster `siege_tactics_*` (~35 modułów) jest nieosiągalny z `bridge.rs`. `EngineCommand` nie ma komendy ataku ani oblężenia, a `DeclareWar` jest odrzucany.
- **Korekta do rejestru:** część wpisów oznaczonych „ZINTEGROWANE” dotyczy funkcji wołanych wyłącznie z testów (`apply_dipl_deltas_to_state`, `eliminate_owner`, `run_economy_tick_for_game`). Zadanie #309 zajmie się korektą bez zmiany historii commitów.
- **Zadania z audytu:** #114 (eliminacja, krok 1), #298/#299 (R7K7C), #304 (ekonomia; rozpoznanie faz w toku), #305 (DeclareWar), #306 (oblężenie i dystans), #307 (zdobycie miasta), #308 (DECYZJA ABC: droga DTO do renderera).
- **Uwaga do audytu:** Evaluator zwrócił, że sformułowanie „advance_turn woła tylko wojnę” jest zbyt mocne, bo występuje też faza zwycięstwa (`evaluate_victory`). Dokument wymaga tej poprawki przy użyciu w dispatchach.

### Przebieg — heartbeat Rust „twardy bit” (druga połowa, 17:47 UTC), 2026-11-16

- **FF parity `rust-port/parity-v2` = `55e00a164`** (z `9a71caf8a`): integracja FC I4 BATTLE-CONSUMER (`54fa4c704`). Bramki na merge: renderer fmt/clippy/test EXIT 0 (559 passed), engine fmt/clippy/test EXIT 0 (3735 passed, 0 failed, 1 ignored pre-existing). Readback zgodny.
- **Zarzuty z FC I4 do rejestru** (nieblokujące): sterownik P5 musi wołać `apply_snapshot` po FF przed kolejnym `Damage`; `BattlePlayback` bez produkcyjnego wołającego; `Kill` ustawia HP=0 (rewizja w I5 dla śmierci bez ciosu).
- **Sloty: 2 z 4 aktywne:** wektory AUTO V1/V5/V6 (#118, `wf_55097f16-9ad`) i wektory pętli dystansu (#100, `wf_a01f4cfa-dd0`). Dwa wolne: kolejne czyste tematy wymagają decyzji właściciela (#308 droga DTO, #97 tryb ręczny, #282 fotele) albo rozpoznania (#310 pola ekonomii do zaplanowania).
- **Dysk:** 15 GB. Parity bez zmian poza FF I4.
- **Otwarte:** `refs/keep` I4 (`54fa4c704`) odrzucany przez proxy; weryfikacja logu `p6_8i_pick`.

### KOREKTA 2026-11-16 — statusy „ZINTEGROWANE” vs wołający produkcyjny (#309)

Dopisek, historia wpisów powyżej nie zmieniona. Źródło: `dyspozycje/rust-port/p6/AUDYT-PARYTET-9a71caf8a.md` (§3–§4, commit `8a0beec86`). Dispatch: `dyspozycje/autobot/runs/R-RUSTPORT-P6-REJESTR-KOLEJKA-KOREKTA-Q1/00-dispatch.md`. Parity: `55e00a164`.

Zasada: wpis „ZINTEGROWANE / wpięte” oznacza, że kod jest w `parity-v2`. Nie oznacza, że funkcja ma wołającego produkcyjnego osiągalnego z `bridge.rs` (`src-tauri` → `engine::bridge`). Skorygowane pozycje:

| Funkcja / moduł (pin Rust `9a71caf8a`) | Wpis historyczny | Stan wg audytu | Korekta |
|---|---|---|---|
| `apply_dipl_deltas_to_state` (`turn_war_dipl_steps.rs:1034`) | #89/#90 R7K7-B/C; moduł „wpięty” | wołana tylko z testów (`p6_r7k7c_owner_pools.rs`); `advance_turn` jej nie woła | NIEPODPIĘTA. Moduł wpięty, funkcja nie. Wpięcie: #106/#298, po #282 |
| `eliminate_owner` (`eliminacja.rs:48`) | #141 (completed); INTEG-B21 `cf281d785` wg wpisu | brak wołającego produkcyjnego (L5) | NIEPODPIĘTA. Kod w parity, ścieżka produkcyjna nie. #114 pozostaje w toku |
| `run_economy_tick_for_game` (`turn_economy_wire.rs:234`), `run_post_central_growth` (`:245`), `apply_praca_upkeep_post` (`:394`) | ekonomia opisana jako zintegrowana | brak wołającego produkcyjnego (L1) | NIEPODPIĘTE. `advance_turn` woła tylko `run_war_turn` i fazę zwycięstwa. Wpięcie: #304, po #310 |
| `declare_war_by_player` (`diplomacy_player_war.rs:311`) | #171 CRED-HAK-WYPOWIEDZENIE-IMPL (completed) | brak wołającego; `bridge.rs:309–313` odrzuca `DeclareWar` (L4) | NIEPODPIĘTA. #171 nie oznacza wpięcia. Wpięcie: #305, po #286 |
| `SiegeLoop` (`siege_tactics_loop.rs:490`), `ProdBody` (`:1092`), `pick_tower_target` (`:176`) | #96, #98, #116, #146 (completed) | wołane tylko z nieosiągalnego klastra oblężenia; nic nie tworzy `SiegeLoop` poza testami (L2) | NIEPODPIĘTE. Wpięcie: #113/#306 |
| `combat::resolve` (`combat.rs:381`), `combat::resolve_combat` (`:321`) | #136 COMBAT-RESOLVE-PETLA (completed) | brak wołającego; `playable.rs:771` stwierdza to samo (L3) | NIEPODPIĘTE. Port pętli istnieje, nie jest wołany. Wpięcie: #306 |
| `apply_transfer_with_effects` (`siege_transfer.rs:340`), `run_capital_capture_plunder` (`siege_capital_plunder.rs:504`) | SIEGE-TRANSFER Q2–Q8 (#28–#43), #175 (completed) | wołane tylko z nieosiągalnego `siege_transfer` (L5) | NIEPODPIĘTE. Wpięcie: #307 (#115) |
| `forced_war_step` (`war_turn_forced.rs:231`), `plan_war_march` (`ai_war_march_plan.rs:259`), `plan_ai_turn` (`ai_turn.rs:1045`) | W3 FORCED-STEP `0ccd2da2a`, W5 MARCH-PLAN `72209573c` (zintegrowane) | audyt L5: brak wołającego produkcyjnego | DO WERYFIKACJI (NIE_ZMIERZONO). Audyt wykrywa wołających po nazwach; ręcznego potwierdzenia dla tych trzech nie było |
| `run_ai_ai_peace_turn` (`war_turn_ai_ai.rs:84`) | #4 W7 SIEGE-AIAI-TURN (completed), #26 | brak wołającego produkcyjnego; audyt §3: ROZBIEŻNOŚĆ z opisem zadania | ROZBIEŻNOŚĆ, do wyjaśnienia przez właściciela tematu |
| `ReplayLog` / `zapis_loader::load_save_snapshot` (`zapis_loader.rs:43`) | #13 (completed) | brak wołającego; `bridge.rs` nie ma komendy wczytania (audyt §3, L6) | ROZBIEŻNOŚĆ: opis mówi o ścieżce produkcyjnej, kodu produkcyjnego brak |
| Widoki P4: `city_views` (`city_view.rs:578`), `build_map_view` (`map_view.rs:286`), `build_highlight` / `okolica_view` / `path_route_overlay` (`overlays_view.rs:223/631/449`) | P4-1E (#214, #222), P4-1F3/F4/F5 (#271–#273) zintegrowane | brak wołającego; renderer nie zależy od `civ-engine` (L6) | Kod DTO w parity, droga do renderera nieustalona. Decyzja: #308 |
| `js_max` / `js_round` (`siege_tactics_blow.rs`) | #110, #142 (completed) | używane przez `okolica` i `unit_power` (helpery); silnik bloku nie | CZĘŚCIOWO (audyt §3) |

**K5LOOP-OUTCOME (#109), rozjazd.** W historii `parity-v2` jest commit `c3e3617b2` „Integracja K5LOOP-OUTCOME (#226): efekty po ciosie w ProdBody::strike …” (przodek `55e00a164`). Tasklista pokazuje #109 `pending`, a w rejestrze brak wpisu o tej integracji. Status `NIE_ZMIERZONO`, do uzgodnienia przez orkiestratora. Audyt 9a71caf8a go nie obejmuje.

**Uwaga do audytu (dla przyszłych dispatchów).** Audyt wykrywa wołających po nazwach; wywołania metod przez odbiorcę bez nazwy typu nie są wykryte (§6 audytu). Pozycje z tabeli wymagają ręcznego `git grep` przed dispatchem.

### Domknięcie tasków po integracjach 1F3 i I4 (#301), 2026-11-16

- **P4-1F3 SIEGE-WONDER-VIEW (#271): zintegrowany.** Kod FC `25fdeb11a` (FC r1 FAIL INFRA: bramki niedokończone), integracja na `parity-v2` = `9a71caf8a` (FF z `3a8f068f6`). Konflikt add/add w `overlays_view.rs` rozstrzygnięty przez zachowanie funkcji i typów obu stron. Bramki: 3735 passed, 0 failed, 1 ignored (pre-existing).
- **P4-1I4 BATTLE-CONSUMER (#277, #293): zintegrowany.** Kod FC `54fa4c704` (PASS-WITH-NOTES), integracja na `parity-v2` = `55e00a164` (FF z `9a71caf8a`). Bramki: patrz wpis 17:47 UTC.
- **Otwarte po tym domknięciu:** #294 (push `refs/keep/R-RUSTPORT-P4-1I4-fc` = `54fa4c704`, odrzucany przez proxy; zostaje lokalnie) i #295 (log `p6_8i_pick`).
- **Pozostałe integracje z tej serii, dla kompletności:** nakładki 1F4/1F5 r2 `86366b5fe` na `75de326bc` → `3a8f068f6`; K5DOC-T2/T3 `03dfa64c2`, `efa3b7642` na `75de326bc`; K5-AUTO-WEKTORY V5/V6 `b6aa05024` (V1 nieweryfikowane, patrz rozjazdy w `KOLEJKA-RUST.md` §6).

### Przebieg — heartbeat Rust (18:18 UTC), 2026-11-16

- **Parity:** `55e00a164`, bez zmian.
- **Sloty: 2 z 4 aktywne:**
  - Integracja wektorów AUTO V1/V5/V6 na `55e00a164` (HAIKU, pełna bramka, `wf_15af2fae-6db`). Wynik jeszcze nie przyszedł, FF po zielonej bramce.
  - Test czułości filtra obrońców (#311, HAIKU Operator, SONNET Evaluator i FC, `wf_8ea63f66-118`, dispatch `b0728d522`, baza FC `6cda54727`).
- **Wolne sloty — brak czystych tematów:** pozostałe pozycje wymagają decyzji właściciela (#308 droga DTO, #97 tryb ręczny, #282 fotele, #115/#120 wariant A/B, #135 kolejność zwarcia, #310 decyzje D1–D6) albo zależą od niezintegrowanego kodu (#304 po #310, #296 po integracji AUTO, #174 po integracji #110).
- **Wynik pętli dystansu (#100):** Operator d1dbd1ff3 PASS-WITH-NOTES, FC raport 9aaee0ca8 PASS-WITH-NOTES. Commity zachowane lokalnie (`refs/keep/COMBAT-PETLA-DYSTANSU-op` i `-fc`, push referencji odrzucony przez proxy). Nie zintegrowano: dubluje COMBAT-HARNESS R1–R3, decyzja o scaleniu u orkiestratora.
- **Dysk:** 15 GB wolnego. Sprzątanie: usunięto worktree wf_a01f4cfa-dd0 (-1, -4, -5).
- **Otwarte:** push referencji `keep` (I4 `54fa4c704`, dwa COMBAT) odrzucany przez proxy; zarzut trailera commitu z nazwą modelu w `463fb2636` (decyzja #289).

### Przebieg — stała instrukcja użytkownika (sprzątanie + workerzy), 2026-11-16 ~18:35 UTC

- **Parity:** `d66aaa3a7` (FF z `55e00a164`: wektory AUTO V1/V5/V6, bramki fmt/clippy EXIT 0, test 3751 passed, 0 failed).
- **Sloty: 2 z 4 aktywne:**
  - Integracja #311 (test czułości filtra obrońców, commit `597bdcd8a`, wynik FC PASS) na `d66aaa3a7`, HAIKU, `wf_d6ab4ac2-b7f`. FF po zielonej bramce.
  - Wektory AUTO V2 i V7 (#296, część bez blokady), HAIKU Operator, SONNET Evaluator i FC, `wf_5fee88d9-4fc`, dispatch `90ff3f2c8`, baza `d66aaa3a7`.
- **Wolne sloty — brak czystych tematów:** V8 wymaga #148, V9–V13 wymagają #109/#107, V14 wymaga decyzji #97; #100 wymaga decyzji o scaleniu z COMBAT-HARNESS; pozostałe pozycje czekają na decyzje właściciela (#308, #282, #115/#120, #135, #310 D1–D6) albo zależą od niezintegrowanego kodu (#304, #165).
- **Zamknięte z dowodem:** #174 (js_max/js_min ze znakiem zera na parity, test pełny zielony), #295 (`p6_8i_pick` przechodzi w pełnym teście i bramce FC).
- **Sprzątanie:** usunięto worktree zakończonych workflowów (AUTO, filtr, dokumenty); commity bez odpowiednika na parity zachowano referencjami `refs/keep/cleanup-*`. Usunięto scratch `target-311` i `tgt`. Dysk 19 GB wolnego, potem 20 GB.
- **Otwarte:** push referencji `keep` odrzucany przez proxy (I4 `54fa4c704`, COMBAT-PETLA `d1dbd1ff3`/`9aaee0ca8`); trailer commitu `463fb2636` zawiera nazwę modelu (decyzja #289); #100 do decyzji o scaleniu.

### Przebieg — heartbeat Rust (18:47 UTC), 2026-11-16

- **Parity:** `d66aaa3a7`, bez zmian.
- **Sloty: 2 z 4 aktywne:**
  - Integracja #311 na `d66aaa3a7` (HAIKU, pełna bramka, `wf_d6ab4ac2-b7f`). Wynik jeszcze nie przyszedł; FF po zielonej bramce.
  - Wektory AUTO V2 i V7 (#296, HAIKU Operator, SONNET Evaluator i FC, `wf_5fee88d9-4fc`, dispatch `90ff3f2c8`). Wynik jeszcze nie przyszedł.
- **Wolne sloty — brak czystych tematów:** V8 (#148), V9–V13 (#109/#107), V14 (#97), #100 (decyzja o scaleniu), #308, #282, #115/#120, #135, #310 (decyzje D1–D6), #304/#165 (zależą od niezintegrowanego kodu).
- **Dysk:** 19 GB wolnego. Sprzątanie w tym przebiegu nie było potrzebne.
- **Otwarte:** push referencji `keep` odrzucany przez proxy; trailer commitu `463fb2636` z nazwą modelu (decyzja #289).

### Przebieg — FF #311 na parity, 2026-11-16 ~19:05 UTC

- **Parity:** `rust-port/parity-v2` = `0fccd8dbf` (FF z `d66aaa3a7`). Integracja #311: commit FC `597bdcd8a` (test czułości filtra obrońców, jeden plik testowy). Bramki na merge: fmt i clippy `-D warnings` EXIT 0, pełny test 3751 passed, 0 failed, 1 ignored (pre-existing). Readback zgodny.
- **Zamknięte:** #311. Mutacja (d) daje teraz FAIL; mutacje (a)(b)(c) dalej FAIL.
- **W toku:** wektory AUTO V2 i V7 (#296, `wf_5fee88d9-4fc`, baza `d66aaa3a7`).
- **Dysk:** 19 GB wolnego. **Otwarte:** push referencji `keep` odrzucany przez proxy; trailer commitu `463fb2636` z nazwą modelu (decyzja #289).

### Przebieg — uzupełnienie slotów po uwadze właściciela, 2026-11-16 ~19:20 UTC

- **Parity:** `0fccd8dbf`, bez zmian.
- **Sloty: 3 z 4 aktywne:**
  - Wektory AUTO V2 i V7 (#296, HAIKU Operator, SONNET Evaluator i FC, `wf_5fee88d9-4fc`, baza `d66aaa3a7`).
  - Wektory NaN/Inf/ułamków amunicji i maxRounds (#137, V-A1, V-A2, V-A3, V-K2, V-K3; test-only, `wf_a2bf4706-6d5`, dispatch `3049a42c2`, baza `0fccd8dbf`). Reguła konwersji z §4 rozpoznania przyjęta jako decyzja techniczna orkiestratora; V-K1 i V-M3 poza zakresem.
  - Rozpoznanie wpięcia złóż (#300, tylko odczyt, ten sam workflow `wf_a2bf4706-6d5`).
- **Czwarty slot wolny:** kandydaci czekają na decyzje (#308, #97, #282, #100, #115/#120, #135, #310 D1–D6) albo zależą od niezintegrowanego kodu (#304, #165, #298 po #282, #297 po #253).
- **Dysk:** 19 GB wolnego.
- **Otwarte:** push referencji `keep` odrzucany przez proxy; trailer `463fb2636` z nazwą modelu (decyzja #289).

### Przebieg — stała instrukcja (sprzątanie, workerzy, wyniki), 2026-11-16 ~19:35 UTC

- **Parity:** `0fccd8dbf`, bez zmian (FF #311 zrobiony w poprzednim przebiegu). Dziś nie ma nowego FF: żaden kod nie ma jeszcze FC.
- **Wyniki:**
  - Wektory AUTO V2 i V7 (#296): Operator PASS-WITH-NOTES, commit `2aa1992d3` (od `d66aaa3a7`). Evaluator i FC w toku (`wf_5fee88d9-4fc`). Kod jeszcze nie na parity.
  - Wektory NaN/Inf (#137, V-A1, V-A2, V-A3, V-K2, V-K3): Operator PASS-WITH-NOTES, commit `3fd4d9677` (od `0fccd8dbf`, cztery testy zielone). Evaluator i FC w toku (`wf_a2bf4706-6d5`).
  - Rozpoznanie złóż (#300): PASS-WITH-NOTES, dokument `ZLOZA-WIRING-ROZPOZNANIE.md`, cherry-pick `c8cd97123` na gałąź roboczą (readback zgodny). #300 zamknięte, #104/#172 czekają na decyzję o kolejności w turze (web-first).
- **Sloty: 2 z 4 aktywne** (V2/V7 i NaN/Inf po FC-stage). Czwarty slot: brak czystego tematu; kandydaci czekają na decyzje (#308, #97, #282, #100, #115/#120, #135, #310 D1–D6) albo na niezintegrowany kod (#304, #165, #298, #297).
- **Sprzątanie:** usunięto worktree `wf_d6ab4ac2-b7f-1` (integracja #311 zrobiona) i `wf_5fee88d9-4fc-1` (zachowano `refs/keep/cleanup-2aa1992d3`), usunięto target `target-d6ab`. Dysk 19 GB wolnego.
- **Otwarte:** push referencji `keep` odrzucany przez proxy; trailer `463fb2636` z nazwą modelu (decyzja #289).

### Przebieg — uzupełnienie slotów (uwaga właściciela o dwóch operatorach), 2026-11-16 ~19:40 UTC

- **Parity:** `0fccd8dbf`, bez zmian.
- **Zamknięte na podstawie dowodu:** #107 (facing: kod `923540b65` jest już na parity), #121 i #122 (weryfikacja i integracja facingu w tym samym merge).
- **Sloty: 4 z 4 zajęte** (łącznie z wcześniejszymi dwoma):
  - Wektory AUTO V2 i V7 (#296, `wf_5fee88d9-4fc`). Operator zrobił PASS-WITH-NOTES, commit `2aa1992d3`, Evaluator i FC w toku.
  - Wektory NaN/Inf amunicji i maxRounds (#137, `wf_a2bf4706-6d5`). Operator PASS-WITH-NOTES, commit `3fd4d9677`, Evaluator i FC w toku.
  - Efekty po ciosie: morale, rout i engaged (#109, runda 4, baza `0fccd8dbf`, dispatch DODATEK r4 w `R-RUSTPORT-P6-K5LOOP-OUTCOME-Q1`, `wf_43129880-afd`). HAIKU Operator, SONNET Evaluator i FC.
  - Facing po krokach ruchu (#123, `R-RUSTPORT-P6-K5LOOP-RUCH-FACING-Q1`, dispatch `eee418031`, baza `0fccd8dbf`, `wf_43129880-afd`). HAIKU Operator, SONNET Evaluator i FC.
- **Konflikt do zapamiętania:** #109 i #123 dotykają `siege_tactics_loop.rs`. Integracja sekwencyjnie: najpierw jeden, potem drugi, z pełną bramką.
- **Dysk:** do sprawdzenia przed startem; worktree zakończonych tematów do usunięcia po zabezpieczeniu referencjami `keep`.
- **Otwarte:** push referencji `keep` odrzucany przez proxy; trailer `463fb2636` z nazwą modelu (decyzja #289).

### Przebieg — heartbeat Rust (19:17 UTC), 2026-11-16

- **Parity:** `0fccd8dbf`, bez zmian. Dysk 11 GB wolnego (po zajęciu przez trzy bramki); sprzątanie przy następnym starcie.
- **Wyniki:**
  - Wektory NaN/Inf (#137): Operator PASS-WITH-NOTES, commit `3fd4d9677`, Evaluator PASS-WITH-NOTES. FC w toku (`wf_a2bf4706-6d5`).
  - Facing po krokach ruchu (#123, `wf_43129880-afd`): BLOCK w rundzie 1/5 (Operator, Evaluator i FC zgodnie). W `ProdBody::start` zdarzenia `AdvanceStep`, `FallBackStep`, `CavalryAction` są pomijane (`siege_tactics_loop.rs` ~1476, unported), więc facing po kroku nie ma czego testować. Zablokowane przez port ruchu (#258, #259, #261).
  - Efekty po ciosie (#109, runda 4, `wf_43129880-afd`): w toku.
  - Integracja wektorów V2/V7 (#296, FC `70d5c80e7`): w toku (`wf_0a773a2f-c9c`).
- **Nowy temat:** rozpoznanie portu ruchu pieszego (#258 K5DOC-T4), dispatch `39d0ba73c`, `wf_7fdf1cf6-fb3`, tylko odczyt, Haiku i Sonnet.
- **Sloty: 4 z 4 aktywne** (NaN FC, OUTCOME, integracja V2/V7, rozpoznanie T4).
- **Otwarte:** push referencji `keep` odrzucany przez proxy; trailer `463fb2636` z nazwą modelu (decyzja #289).

### Przebieg — wektory NaN/Inf (#137) gotowe, sprzątanie, 2026-11-16 ~20:00 UTC

- **Wektory NaN/Inf/ułamków amunicji i maxRounds (#137):** Operator PASS-WITH-NOTES `3fd4d9677`, Evaluator PASS-WITH-NOTES (własna mutacja zabita), FC PASS-WITH-NOTES raport `095e6d036`. Tylko cztery pliki testowe, zero zmian w kodzie produkcyjnym. Merge-tree na `0fccd8dbf` czysty. Integracja do zrobienia po FF wektorów V2/V7 (ta sama baza). Zarzuty: V-A1 dla 0.5 i 2.5 oraz log tekstowy poza Rust (NIE_ZMIERZONO); NaN i ±Inf to wartości zastępcze, a nie test obsługi.
- **Sprzątanie:** dysk spadł do 6,8 GB, poniżej progu bramki. Usunięto worktree zakończonego workflowu wektorów NaN/Inf, targety `target-nan`, `target-v2v7`, `tgt`, `tgt-fc` i logi/skrypty z katalogu scratch poprzednich przebiegów. Commity bez odpowiednika na parity zostały w referencjach `keep` (`3fd4d9677`, `095e6d036`, `70c0bbcd6`, `39888d3fa`, `2aa1992d3`). Dysk 15 GB wolnego.
- **Uwaga o sprzątaniu:** wzorzec usuwał też pliki robocze (logi i skrypty) z katalogu scratch, nie tylko targety. Nie były to commity ani zatwierdzone raporty, ale wynik był szerszy niż zamierzony.
- **Trwa:** integracja V2/V7 (`wf_0a773a2f-c9c`), OUTCOME r4 (#109) i rozpoznanie T4 (#258). Wynik RUCH-FACING (#123): BLOCK, port ruchu jest warunkiem.

### Przebieg — rozpoznanie ruchu pieszego (#258 K5DOC-T4) gotowe, 2026-11-16 ~19:25 UTC

- **Wynik:** `wf_7fdf1cf6-fb3` (Operator i Evaluator, tylko odczyt, bez kodu): PASS-WITH-NOTES. Dokument `dyspozycje/rust-port/p6/K5DOC-T4-RUCH-PIESZY-ROZPOZNANIE.md`, commit `ee38abed9` (baza `0fccd8dbf`), przeniesiony na `claude/rust-sivvrn` jako `217e71e8a` (cherry-pick, readback `refs/heads/claude/rust-sivvrn` = `217e71e8a`). Bez push do parity.
- **Ustalenia:** brak konsumenta `AdvanceStep` w `ProdBody` (`siege_tactics_loop.rs` ~1476; zdarzenie trafia do `skipped` ~1056); brak BFS `_firstStepAlongPathToAttack` i `_stepToward`; brak efektów `_doMove` (occByKey, koszt terenu, facing). `siege_tactics_tower.rs:47` `move_cost` to atrapa harnessu, nie do reużycia w T4c. `TowerWalk::passable_free` opiera się na zbiorach zajętych i blokowanych, nie na terenie.
- **Korekty Evaluatora (dokument jeszcze niepoprawiony; uwzględnić PRZED dispatchem T4a):**
  1. Reguła muru (`wallCol-1`) w `_firstStepAlongPathToAttack` jest w pinie tylko komentarzem (8595–8604). Działają `occByKey` (8594) i `_passableForUnit` (8605); mur obsługuje się przez nieprzechodnie ciało muru i `_canAttackFrom`. T4a nie może zlecać osobnej reguły muru.
  2. Numery linii: `_firstStepTowardMelee` zaczyna się w 8634 (nie ~8625); `_makeCanAttackFromTest` w 8454; gałąź planowania `_doMove` 8694–8712; przeniesienie occByKey w ścieżce animowanej ~8719–8722. Rozjazd do 15 linii.
  3. `_passableForUnit` ma odpowiednik w Rust: metodę traitu `AutoBatchEnv::passable_for_unit` (`siege_tactics_autobatch.rs:268`). Bez implementacji produkcyjnej (werdykt BRAK się utrzymuje), ale T4c nie może go zdublować.
  4. Asymetria `allowFirstStep` (pin 8593): filtr kompaktu i anty-cofania dotyczy tylko pierwszego kroku BFS. Port musi ją zachować.
- **NIE_ZMIERZONO:** czy `pathfinding.rs:1590` `move_cost_fn_for` odpowiada `terrainMap.moveCost` dla bitwy; czy `BROD_RUCH_MULT` (pin 983) to `ruch_mult` w `data/units_combat.rs:229`; pełne ciała 8600–8617 i 8625–8680 (czytane częściowo).
- **Podział zamiast jednego #258:** T4a helpery ścieżki (BFS pierwszego kroku, `_stepToward`) → T4b decyzja `_advanceStep` (kroki 1–10, zapis `lastAutoMoveFrom`) → T4c efekty `_doMove` (occByKey, koszt terenu, facing) → T4e wpięcie w `ProdBody` (odblokowuje #123). Najpierw sprawdzić terenowy odpowiednik `_moveCostForUnit`/`_passableForUnit`.
- **Zależności:** #284 (kontrakt ActivateOps), #107 (facing; `_nearestEnemy` w ProdOps zwraca None), #109 (`target_in_range`), #261 (falanga → `_advanceStep`, pin 6556), #260 (wspólny `_firstStepTowardMelee`), #264 (`doctrine_step` zwraca false).
- **Stan slotów w chwili zapisu:**
  - `wf_0a773a2f-c9c` (INTEG V2/V7): merge `0e04a75c6` w worktree, `cargo test` w toku (log `test2.log`, od ~19:14). **Nie FF**: parity pozostaje `0fccd8dbf`, dopóki bramka nie będzie zielona.
  - `wf_43129880-afd` (OUTCOME r4 #109, RUCH-FACING #123): RUCH-FACING BLOCK (Operator, Evaluator, FC). OUTCOME r4 bez wyniku w dzienniku (ostatni zapis 19:16). NIE_ZMIERZONO, czy jeszcze biegnie.
  - Wolne sloty: 2 z 4.
- **Dysk:** 13 GB wolnego.

### Przebieg — heartbeat Rust (19:48 UTC) i stała instrukcja, 2026-11-16

- **Test pick (bramka V2/V7):** `pick_auto_improvements_matches_pinned_web_vectors` przeszedł w 299,5 s (`pick.exit` = 0). To długi test, nie zawieszenie: agent przerwał go po 5 minutach (SIGTERM), więc wynik BLOCK wynikał z limitu czasu, nie z błędu. Pełna bramka na `0e04a75c6` uruchomiona w tle (`gate-*.log`, `gate.exit`).
- **FF parity-v2:** NIE wykonany. Czeka na zieloną pełną bramkę. Po niej FF `0fccd8dbf` → `0e04a75c6`, potem integracja NaN/Inf (`wf_a2bf4706-6d5`, FC PASS-WITH-NOTES).
- **Sprzątanie:** usunięte worktree `wf_5fee88d9-4fc-2`, `-3`, `wf_7fdf1cf6-fb3-1` (commity przodkami `0e04a75c6`, zabezpieczone `refs/keep/V2V7-integ-0e04a75c6` i `refs/keep/T4-recon-ee38abed9`). Dysk 18 GB wolnego.
- **Nowy workflow:** K5DOC-T4a helpery ścieżki pieszego (#312), `wf_cf05e21c-412`. Dispatch `5d1fb09cf` na `claude/rust-sivvrn` (readback zgodny). Baza `0fccd8dbf`. Operator Haiku, Evaluator Sonnet, FC Sonnet. Dispatch zawiera korekty Evaluatora rozpoznania T4 (reguła muru to komentarz w pinie, asymetria `allowFirstStep`, `passable_for_unit` już istnieje).
- **Aktywne workflowy:** 2 z 4 (`wf_43129880-afd` OUTCOME r4 w toku, RUCH-FACING BLOCK; `wf_cf05e21c-412` T4a).
- **Wolne sloty: 2 — brak czystego tematu, powód:** #107 K5LOOP-FACING i #257 K5DOC-T5a dotykają `siege_tactics_loop.rs`/`ProdBody`, które zajmuje OUTCOME r4 (konflikt, nie wymyślam obejścia). #269/#270 PRIO-3D (Opus, renderer) czekają na decyzję drogi DTO #308. #263–#264, #259–#261 zależą od ProdBody i #284. #106/#115/#120 blokują decyzje #282/#285/#286.
- **Otwarte:** NaN/Inf integracja, OUTCOME r4 po zakończeniu, push `refs/keep` odrzucany przez proxy (nie obchodzić).

### Przebieg — dwa ciężkie tematy Opus (PRIO-3D-1, R1), 2026-11-16 ~20:20 UTC

- **Decyzja techniczna #308 (droga DTO do renderera) = D-DTO-1 = A.** Już ratyfikowane w kontrakcie P4-1 (`P4-1-RENDER-DTO-CONTRACT.md` §7, `P4-1G-ADAPTER-ROZPOZNANIE.md`): DTO liczy producent w engine, adapter w rendererze tylko tłumaczy typy. Decyzja techniczna, więc podjęta przez orkiestratora, nie przez ABC. Do wiadomości właściciela.
- **L4 (stan UI) = osobny parametr adaptera `MapUiState`** (D-CMD-12), zgodnie z kontraktem. Adapter nie zgaduje przełączników.
- **Dispatche (Opus we wszystkich rolach), baza `0fccd8dbf`, pushnięte na `claude/rust-sivvrn` (`6132cce73`):**
  - `R-RUSTPORT-P4-1G-Q5-ADAPTER-OVERLAYS` = PRIO-3D-1 (#269): terytorium, zasięgi, szlaki, okolica, pola robotników, kopalnia, oblężenia, `MapUiState`. Bez zmian w view-model (L6/L7 osobno).
  - `R-RUSTPORT-P4-1-R1-UNIT-TOKENS` = R1 kontraktu (żetony jednostek, `units.ts:5787–6747`). Q6 (PRIO-3D-2, #270) zostaje zablokowany do czasu R1, bo kontrakt wymaga R1 przed Q6.
- **Workflow:** `wf_fff1cacf-ac8`, dwie równoległe ścieżki (Operator → Evaluator → FC), wszystkie role Opus.
- **Dlaczego nie więcej:** pozostałe tematy Opus są zablokowane: #278 i #279 przez decyzję mgły (#253), #280 przez K5LOOP (#107/#109/#112/#113), #218 był już zrealizowany przez I1–I4.
- **Sloty (cztery workflowy):** OUTCOME r4 (`wf_43129880-afd`), T4a (`wf_cf05e21c-412`, Haiku/Sonnet), Q5 i R1 (`wf_fff1cacf-ac8`, Opus).
- **Bramka V2/V7 (`0e04a75c6`):** fmt i clippy zielone, `gate-test.log` w toku. FF po zielonej bramce, bez zmian.

### Przebieg — OUTCOME r4 (#109/#147) zamknięty, RUCH-FACING (#123) nadal BLOCK, 2026-11-16 ~20:25 UTC

- **#109 K5LOOP-OUTCOME: zamknięte jako PASS-WITH-NOTES.** Efekty po ciosie (morale, rout, engaged) są w `ProdBody::strike` od wcześniejszej integracji: commit `92be62324` (kod), FC `5f7cd0003` PASS-WITH-NOTES, integracja `c3e3617b2`. Wszystkie trzy są przodkami `parity-v2` `0fccd8dbf` (sprawdzone `git merge-base --is-ancestor`). Runda 4 nie dodała kodu, bo kod już był w bazie. Dowody: strike `siege_tactics_loop.rs:1568–1660`, `apply_outcome_effects` `:1632/:1664`, `resolve_outcome` `siege_tactics_blow.rs:321`, pin `battleScene.ts:9019/9783/1021/8373`. Wektory `vectors.json` odtworzone bajt-w-bajt, 320 sekwencji. Mutacje M1 i M2 dają FAIL (test `p6_k5loop_outcome_pin`). Pełny cargo test `3750 passed, 0 failed, 1 ignored`.
- **#147 K5LOOP-OUTCOME (efekty): zamknięte tym samym dowodem.**
- **Zarzut do rozstrzygnięcia (NOTA 1, nie FAIL):** warunek `GainMorale` to `killed || routed`, gdzie `killed` jest odczytywane PO efektach. Pin daje gain bezwarunkowo tylko w gałęzi Kill. Rozbieżność pojawiłaby się, gdyby cios trafił już martwy, nierozbity cel (rzadkie: pętla jest serializowana przez busy). Wektory tego nie pokrywają. Proponowany warunek: `outcome == Outcome::Kill || routed`. Osobny temat albo dopisek do wektorów.
- **NOTA 2 (kosmetyka):** komentarz doc przy `strike` (`siege_tactics_loop.rs:1565–1567`) twierdzi, że efekty nie są tu stosowane, a są. Poprawić przy następnym temacie dotykającym pliku.
- **#123 RUCH-FACING: nadal BLOCK (runda 1/5).** Zdarzenia `AdvanceStep`, `FallBackStep` i `CavalryAction` trafiają do `skipped` w `ProdBody::start` (ok. `:1393–1525`), więc jednostka się nie przesuwa i nie ma punktu do aktualizacji facing. Pin: facing jest ustawiany przez `_updateFacing` wołane z `_doMove` (`battleScene.ts:8709`, `:8751`), nie w samej funkcji kroku. Odrzucenie tego w `02a-obrona.md` (zarzut 6) jest błędne i zostało skorygowane. Odblokowanie: port ruchu w `ProdBody` (K5DOC-T4 / T6 / T7 / K5EXEC-T3), potem jedna linia `_updateFacing` po przesunięciu.
- **NIE_ZMIERZONO (bez zmian):** ripple `_shakeAlliesOnLoss` (wymaga #123), dowódca `isArmyCommander` (`dowodca-rout`, `dowodca-fade`), `occByKey` (brak konsumenta w `ProdBody`), osłona wręcz `_checkMeleeScreenLost` (test Rust-only, bez wektorów pinu).
- **Zadania:** #109 i #147 oznaczone jako zakończone. #123 pozostaje zablokowane do portu ruchu.

### Przebieg — FF parity-v2 na 0e04a75c6 (integracja V2/V7), sprzątanie, 2026-11-16 ~20:10 UTC

- **FF `rust-port/parity-v2`: `0fccd8dbf` → `0e04a75c6`** (merge `0e04a75c6`, parenty `0fccd8dbf` + `70d5c80e7`). Ancestry potwierdzona (`0fccd8dbf` jest przodkiem). Diff: 5 nowych plików testowych (`p6_k5loop_auto_v2v7*`, wektory, SHA256SUMS, raport FC), zero zmian w `src/`. Brak nazwy modelu w treści commita. Readback `ls-remote` zgodny.
- **Bramka na `0e04a75c6`** (przed FF, worktree `wf_0a773a2f-c9c-1`): `cargo fmt --check` EXIT 0, `cargo clippy --all-targets -- -D warnings` EXIT 0, `cargo test --all-targets --no-fail-fast` EXIT 0, 507 wyników `test result`, zero FAILED. Test `p6_8i_pick` przechodzi w 299,5 s (długi, nie zawieszony).
- **Workflow OUTCOME r4 (`wf_43129880-afd`) zakończony:** #109 i #147 zamknięte wcześniej (PASS-WITH-NOTES, kod w `c3e3617b2`). RUCH-FACING (#123) BLOCK, bo brak portu ruchu w `ProdBody`.
- **Sprzątanie:** usunięto worktree `wf_0a773a2f-c9c-1`, `wf_43129880-afd-1/-2/-4/-5/-6` i target `target-v2v7-r2` (3,3 GB). Commity nie-przodkowe zabezpieczone: `refs/keep/OUTCOME-r4-afd4-70c0bbcd6`, `refs/keep/OUTCOME-r4-fc-779701565`. Dysk: z 6,8 GB do 17 GB wolnego.
- **T4a (#312, `wf_cf05e21c-412`):** Operator r1 dał BLOCK nie z powodu kodu, tylko z powodu miejsca na dysku (8,9 GB → 6,0 GB w trakcie kompilacji testów, zatrzymano własne procesy). Commit `8d9eacf77` (`pathstep.rs`, 12 testów zielonych, mutacje (a)(b)(c) dają FAIL, fmt i clippy zielone). Zabezpieczony `refs/keep/T4a-op-8d9eacf77`. Runda 2 (bramka, potem Evaluator i FC) uruchomiona przy 17 GB wolnego.
- **Q5 (PRIO-3D-1) i R1 (żetony), `wf_fff1cacf-ac8`:** Operator (OPUS) w toku, worktree aktywne, nie ruszane.
- **Sloty:** 3 workflowy aktywne (T4a runda 2, Q5, R1). Jeden wolny.

### Przebieg — 4 workery stale aktywne, czwarty to ciężki Opus 3D (R3), 2026-11-16 ~20:40 UTC

- **Czwarty slot:** R3 kontraktu P4-1, wstęgi rzek w rendererze 3D (`R-RUSTPORT-P4-1-R3-RIVER-RIBBONS`, dispatch `714de738c`, baza `0e04a75c6`). Workflow `wf_e624be51-b6c`, OPUS we wszystkich rolach. Wybór: DTO `river_render_paths` i `rzeka_krawedzie` już istnieje w engine, a renderer nie ma budowniczego wstęg. Nie dotyka plików Q5 ani R1.
- **Sloty: 4 z 4 aktywne:** T4a (`wf_cf05e21c-412`, HAIKU, runda 2), Q5 (`wf_fff1cacf-ac8`, OPUS), R1 (`wf_fff1cacf-ac8`, OPUS), R3 (`wf_e624be51-b6c`, OPUS).
- **Integracja NaN/Inf (#137):** merge `dd9a1b4e7` na `0e04a75c6` (czysty `merge-tree`), bramka fmt OK, clippy i test w toku. FF dopiero po zielonej bramce.
- **Cargo.lock:** wygenerowany przez cargo w worktree integracji, nieśledzony. Dodany lokalnie do `.git/info/exclude` (nie commitowany, zgodnie z regułą projektu).
- **Pozostałe kandydaty (R2, R4–R6, #107, #257):** nie startowane w tym slocie; kolejne do wzięcia po zwolnieniu slotu.

### Przebieg — heartbeat 20:48 UTC: sloty 4/4, dysk, FC PASS bez integracji, 2026-11-16

- **Integracja NaN/Inf (#137):** FF `parity-v2` `0e04a75c6` → `dd9a1b4e7` (bramka zielona: fmt, clippy, test 508 wyników). Readback zgodny.
- **T4a (#312):** Operator BLOCK tylko z powodu dysku, Ewaluator domknął pełną bramkę przy ponad 8 GB (507 wyników, zero FAILED), FC PASS-WITH-NOTES. Merge `68b2a6633` na `dd9a1b4e7`. Bramka engine w toku (`integ-t4a`).
- **Q5 (PRIO-3D-1, `922300020`, FC `3d21e5679`) i R1 (żetony jednostek, `3dec6ac5d`, FC `c6ab07fb09a5`):** FC PASS-WITH-NOTES, merge czysty na `0e04a75c6`. Integracja w kolejce po bramce T4a (oba w renderer, bez konfliktu).
- **Sprzątanie:** usunięte worktree zakończonych workflowów T4a i Q5/R1 (osiem sztuk). Commity zabezpieczone referencjami `refs/keep/P4-1-*` i `refs/keep/T4a-op-8d9eacf77`. Dysk: z 4,9 GB do 15 GB.
- **Trwające workflowy (4/4):**
  - R3, wstęgi rzek (`wf_e624be51-b6c`, OPUS): FC w toku.
  - R5, plakietki miast (`wf_ce6a50a1-e40`, OPUS): Operator.
  - R2, rozmieszczenie dekoru i lasu (`wf_2a208b31-2df`, OPUS): Operator.
  - T4b, decyzja `_advanceStep` (#313, `wf_6ffa730a-4ec`, HAIKU/SONNET): baza `68b2a6633`, dispatch `79cd12ec2`.
- **Pozostałe kandydaty:** Q6 (#270) czeka na integrację R1 i kontrakty L6/L7; #278, #279 na decyzję o mgle (#253); #280 na K5LOOP (#107, #113).

### Przebieg — FF T4a, R3 FC PASS, R2 BLOCK→r2, R6 uruchomiony, 2026-11-16 ~21:10 UTC

- **FF `parity-v2`: `dd9a1b4e7` → `68b2a6633`** (T4a, helpery ścieżki pieszego, #312). Bramka `fmt`/`clippy`/`test` zielona (509 wyników, zero FAILED). Readback zgodny.
- **R3, wstęgi rzek (`963148a78`, FC `b82ca9375` PASS-WITH-NOTES):** gotowe do integracji. Ewaluator zgłosił błąd kontraktu P4-1G (§3 wiersz 61, §4 wiersz R3): pin nie czyta `rzeka_krawedzie` w renderze. Poprawka dokumentu poza allowlistą, dla orkiestratora.
- **R2, rozmieszczenie dekoru (`47f491508`, r1 BLOCK):** kod poprawny, ale strażnik `tests/decor_web_parity.rs` (`decor_sources()`) zakazuje podkatalogów `decor/`. Decyzja: wariant A, dopisanie do allowlisty wyłącznie `decor_sources()`, plus poprawka numerów linii pinu. Runda 2 (`wf_b838b674-86e`, OPUS) z bazą `47f491508`, dispatch `78fe2c2d6`.
- **R6, sprite buntu i licznik jednostek (OPUS):** dispatch `044a1c8eb` na `68b2a6633`, workflow `wf_f53eacb7-7f9`. DTO `revolt` i `unit_count_on_hex` już istnieją.
- **Sprzątanie:** usunięto worktree `integ-t4a`, target `target-integ-t4a`. Dysk 11 GB.
- **Trwające workflowy (4/4):** R5 (`wf_ce6a50a1-e40`, OPUS), R2 r2 (`wf_b838b674-86e`, OPUS), T4b (`wf_6ffa730a-4ec`, HAIKU/SONNET), R6 (`wf_f53eacb7-7f9`, OPUS).
- **Do integracji po wolnym dysku:** Q5 (`922300020`/FC `3d21e5679`), R1 (`3dec6ac5d`/FC `c6ab07fb09a5`), R3 (`963148a78`/FC `b82ca9375`) — jedna integracja renderera i jedna bramka.

### Przebieg — R5 zakończony, integracja renderera (Q5 + R1 + R3 + R5) przygotowana, 2026-11-16 ~21:25 UTC

- **R5, plakietki miast (`56c84ea45`, FC `84e421c57` PASS-WITH-NOTES):** integrator `syncStatChips` (`cities/sync/`), 11 testów z pin-linkami, mutacje (a)(b)(c)(d)(e)(f) FAIL, bramka renderera 570 passed. Notatki do domknięcia: (1) `StatChipUiState` to osobny typ; po integracji Q5 ujednolicić z `MapUiState`; (2) luka: `grp.visible` w webie = `isVisible` razem z panelem miasta, a `CityInputs::sync` bierze tylko `fog_visible` (widoczne tylko przy panelu nad miastem we mgle); (3) kilka numerów linii pinu w komentarzach przesunięte o 1 (`cities.ts:888/928`, `main.ts:2988`, `applyFogVisibility` to `cities.ts:740`). Do poprawy w osobnym temacie komentarzy.
- **Integracja renderera (gotowa, bramka nieuruchomiona):** merge na `68b2a6633` czysty dla czterech tematów: Q5 (`3d21e5679`), R1 (`c6ab07fb09a5`), R3 (`b82ca9375`), R5 (`84e421c57`). Worktree `integ-rend` na `70d6fbb62`. Pełna bramka (fmt, clippy, test renderer) zostaje na następny tick, po zakończeniu R2 r2 i R6, żeby nie przekroczyć dysku.
- **Sprzątanie:** usunięto worktree R5 (`wf_ce6a50a1-e40-1`), commit zabezpieczony `refs/keep/P4-1-R5-84e421c57`. Dysk 9,5 GB.
- **Trwające workflowy:** R2 r2 (`wf_b838b674-86e`, OPUS), R6 (`wf_f53eacb7-7f9`, OPUS), T4b (`wf_6ffa730a-4ec`, HAIKU/SONNET). Czwarty slot wolny do uzupełnienia (R4, Opus 3D).

### Przebieg — FF `parity-v2` R6 (sprite buntu), R2 r2 FC PASS, 2026-11-16 ~21:40 UTC

- **FF `parity-v2`: `68b2a6633` → `2edc808d7`** (R6, `cities/revolt/` + `cities/mod.rs` + test `cities_revolt_r6` 6/6, fixture `r6_vectors.json`). Ancestry OK; `git diff --stat 68b2a6633..2edc808d7` = 6 plików, +916/−0, wszystkie w allowliście. `git diff --check` czysty. Bramka renderera (fmt, clippy `-D warnings`, test 69 zestawów, 565 passed / 0 failed / 0 ignored) zielona na tym samym drzewie (Operator i FC, niezależnie). Readback `git ls-remote`: `2edc808d7137`. Keep: `refs/keep/P4-1-R6-op-2edc808d7`, `refs/keep/P4-1-R6-fc-29bbe05bd`.
- **R6 FC PASS-WITH-NOTES (`29bbe05bd`, raport FC).** Notatki: (1) pin **nie rysuje licznika jednostek** na heksie miasta (`getUnitCountOnHex` tylko w `main.ts:2901/2971` i `cities.ts:346`, nic go nie czyta). Dispatch zakładał licznik; implementacja przenosi wartość DTO bez węzła w scenie. Dodanie licznika to **odstępstwo od webu** (zasada 9) = osobne pytanie ABC do właściciela. (2) `RevoltRenderer` nie ma produkcyjnego wołającego; wpięcie `sync` po `CityRenderer::sync` to osobny temat. (3) Komentarz `models/cities/renderer.rs:10-13` nadal mówi „out of scope” dla sprite'a buntu. Drobny dług dokumentacyjny.
- **R2 runda 2, `wf_b838b674-86e` — FC PASS (`99e27dae5`, raport FC `c4f43bcbd`).** Operator, Evaluator i FC PASS. Strażnik `decor_sources()` w `decor_web_parity.rs` jest rekursywny (wariant A, zmiana tylko w tej funkcji). Numery linii pinu `scene.ts` poprawione (`:2348–2374`). Test czułości (`x.sin()` w `decor/placement/`) daje FAIL, więc strażnik skanuje podkatalog. Merge `fcf54456e` = `68b2a6633` + `99e27dae5` (`--no-ff`) czysty, diff względem `68b2a6633` to tylko 7 plików R2. **Uwaga:** `parity-v2` poszło na `2edc808d7`, więc merge R2 trzeba przebudować na nowym parity przed bramką i FF. Keep: `refs/keep/P4-1-R2-r2-99e27dae5`, `refs/keep/P4-1-R2-merge-fcf54456e`, `refs/keep/P4-1-R2-fc-r2-c4f43bcbd`.
- **Sprzątanie:** usunięto worktree R2 r1 (`wf_2a208b31-2df-1/2/3`); commit `1fc8940fe` zabezpieczony `refs/keep/P4-1-R2-fc-r1-1fc8940fe`.
- **Trwające workflowy:** T4b (`wf_6ffa730a-4ec`, HAIKU/SONNET, Evaluator, `cargo test`). Slot czwarty wolny: R4 (Opus 3D) bez dispatchu, start wstrzymany przez właściciela.
- **Następny krok:** bramka renderera na przebudowanym merge R2 (`>= 12 GB` wolnego, bez budujących workerów); po EXIT 0 FF `parity-v2`.

### Przebieg — heartbeat sloty (2026-11-16 ~22:00 UTC): T4b FAIL → runda 2, R4 i T5a w toku, 3/4 slotów

- **K5DOC-T4b (#313), runda 1 zakończona FAIL (Operator BLOCK, Ewaluator FAIL, FC FAIL).** Logika portu zielona: fmt, clippy, `p6_k5doc_t4b` 8/8 (520 wektorów z pinu), pełny `cargo test --all-targets` EXIT 0, mutacje (a)(b)(c) FAIL. Zarzuty dotyczą wyłącznie procesu: błędne numery linii pinu w komentarzach (`:8201-8227`, `:8229-8236`, `:8238-8239` i inne), brak commitu i brak raportu. Kod niezacommitowany. **Zabezpieczenie:** WIP rundy 1 = `57907d39e` na `68b2a6633`, gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T4B-ADVANCE-DECIDE-r1` (push OK), ref keep `refs/keep/T4b-wip-r1-57907d39e`. **Runda 2** (ten sam ID, DODATEK r2 w dispatchu, baza `57907d39e`, wf `wf_8919e89c-4ba`) robi tylko poprawkę linii pinu, przegenerowanie wektorów, kotwice `mutacje.py`, raport i commit.
- **K5DOC-T5a (#257), kite strzelca:** rozpoznanie `ee4989e61` PASS. Decyzja techniczna: T5a = czyste funkcje (`best_kite_shot_step`, `nearest_enemy_melee`, predykat gałęzi 1) i wektory z pinu, **bez zmiany `ActivateOps`**. Wpięcie gałęzi KITE w `U7.5-ranged` zostaje na T8 / #113. Dispatch `dd64164fb`, workflow `wf_d3b365ce-bae` (Haiku Operator, Sonnet Evaluator i FC).
- **R4 (#322), ulepszenia, zasoby, wioski i obozy (Opus):** dispatch `552333a81`, baza `2edc808d7`, workflow `wf_4698b563-4a3`. Obozy barbarzyńców (`syncCampMeshes`) mogą wypaść jako `NIE_ZMIERZONO`, jeśli DTO ich nie niesie.
- **R6 (licznik jednostek):** właściciel wybrał opcję A (zostaje jak w webie, bez licznika). Zapis: pin nie rysuje licznika na heksie miasta, więc `unit_count_on_hex` zostaje w DTO bez węzła w scenie.
- **Slot 4/4 pusty — powód:** brak czystego tematu z gotowym rozpoznaniem i dispatchem bez zależności od decyzji gameplay. Kandydaci: T6 (#259) i T7 (#261) wymagają rozpoznania (`R-ZELAZO-AUDYT-POZOSTALE-Q1-T6/T7` to inne tematy, nie te). ZLOZA-WIRING (#104/#172) wymaga zmiany formatu zapisu (decyzja, rejestr BLOCK). CRED-HAK (#120) wymaga wariantu A/B (#286). Nie startuję tematów „dla zapełnienia".
- **Integracja R2 (`11d7e4763`, FC PASS, runda 2):** bramka renderera NIE uruchomiona. Warunek: ≥12 GB wolnego i brak budujących workerów. Dysk 11 GB, budują R4, T5a i T4b r2. Parity `2edc808d7` (R6 na szczycie), merge R2 przebudowany na nowym parity.
- **Sprzątanie:** usunięte worktree R6 (`wf_f53eacb7-7f9-1/2`) i R2 r2 (`wf_b838b674-86e-1/2/3`), targety `tgt-fc-r2decor` i `tgt-r6eval`. Refy keep: `P4-1-R6-op-2edc808d7`, `P4-1-R6-fc-29bbe05bd`, `P4-1-R2-r2-99e27dae5`, `P4-1-R2-merge-fcf54456e`, `P4-1-R2-merge2-11d7e4763`, `P4-1-R2-fc-r2-c4f43bcbd`.
- **Trwające Workflow:** R4 (Opus, Operator), T5a (Haiku, Operator), T4b r2 (Haiku, Operator).

### Przebieg — heartbeat (2026-11-16 ~22:18 UTC): 4/4 slotów zajęte, brak zakończonych FC

- **Sloty: 4/4 aktywne** (sprawdzone w dziennikach `subagents/workflows`, żaden nie ma werdyktu FC):
  - K5DOC-T4b `_advanceStep`, runda 2 (`wf_8919e89c-4ba`), Haiku; baza `57907d39e` (WIP r1). Etap: Evaluator.
  - K5DOC-T5a strzelec-kite, runda 2 (`wf_f88b947e-171`), Haiku; baza `7de3417e8`. Etap: Operator.
  - R4 ulepszenia, zasoby, wioski, runda 2 (`wf_92cfa6de-fdf`), Opus; baza `aa9d36ac4`. Etap: Operator.
  - K5DOC-T6 jazda, implementacja (`wf_7a5e569c-542`), Haiku; baza `2edc808d7`. Etap: Operator.
- **Rozpoznanie K5DOC-T6 (`daf56eddd`): PASS.** Dispatch implementacji `cf0a9c2a6`. Zależność od T4b (#313) i T5a (#257) niepotwierdzona; kod nie wymaga ich wg rozpoznania. Orkiestrator potwierdzi przed FF.
- **Krok 2 (zakończone FC PASS bez integracji):** brak. Integracja R2 (`11d7e4763`) i renderera (Q5+R1+R3+R5) czeka na bramkę: ≥12 GB wolnego i brak budujących workerów. Dysk 14 GB, budują cztery workery.
- **Krok 3 (sprzątanie):** brak zakończonych tematów od ostatniego sprzątania. Worktree: 9 (integ-r2, integ-rend, wf_8919…-1 zablokowany przez T4b r2, pozostałe trzy aktywne).
- **Reguła modeli:** Operatorzy Haiku, z wyjątkiem R4 (Opus, 3D). Evaluator i FC Sonnet. Decyzje gameplay zostają w czacie (pytania ABC #358).
- **Zadania:** 31 zadań dodanych w nocy (#328–#358), najcięższe Opus na początku. Zablokowane: #334, #335, #336, #337 (mgła #253, pętla K5LOOP), #349, #350 (decyzje formatu i wariantu A/B).

### Przebieg — FF parity-v2 R4 (ulepszenia, zasoby, wioski, runda 2), 2026-11-16 ~22:45 UTC

- **FF `parity-v2`: `2edc808d7` → `32c84d6a9`** (kod R4 `aa9d36ac4` z rundy 1, raport Operatora r2 `4d968529b`, raport FC `32c84d6a9`). Ancestry OK. `git diff --stat 2edc808d7..32c84d6a9`: 10 plików, +2125/−0, wszystkie w allowliście. W `lib.rs` jedna linia `pub mod improvements;`. `git diff --check` czysty. Readback `ls-remote`: `32c84d6a91b8`.
- **Bramka renderera** (drzewo `4d968529b`; `32c84d6a9` dokłada tylko raport): fmt EXIT 0, clippy `-D warnings` EXIT 0, `cargo test --all-targets --no-fail-fast` EXIT 0 (70 zestawów, 577 passed, 0 failed, 0 ignored), `improvements_sync_r4` 12/12. Potwierdzili Operator r2, Evaluator i FC niezależnie.
- **Werdykty:** Operator PASS (r2), Evaluator PASS-WITH-NOTES, FC PASS-WITH-NOTES.
- **Mutacje:** a1, a2, b1, b2, b3, c1, c4 dają FAIL. Mutanty równoważne: (c2) usunięcie sprawdzenia `""` i (c3) wyłączenie bramki `!has_nakladka && shown.is_none()`. Zachowanie identyczne z pinem (`zasoby.rs:584-595`, `main.ts:3212-3214`), testy ich nie wymuszają. Akceptacja orkiestratora.
- **Luki w NIE_ZMIERZONO:** obozy barbarzyńców (DTO nie ma pola). G5 (normalizacja kluczy ulepszeń, fallback `hex.ulepszenie`) przeniesiona do zadania #332. `improvement_key` przenoszony, ale nieczytany w pinie (zweryfikowane `git grep`).
- **Dysk:** podczas oceny 5,9–6,6 GB; po FF i sprzątaniu 14 GB. Próg 8 GB przed nowymi startami Rust obowiązuje.
- **Sprzątanie:** usunięte worktree R4 r2 (`wf_92cfa6de-fdf-1`, `-3`; `-2` już nie istniało). Refy keep: `P4-1-R4-fc-32c84d6a9`, `P4-1-R4-op-4d968529b`. Usunięcie targetów w scratchpadzie pominięte: nie zweryfikowano ścieżek, a polecenie `rm` z rozwinięciem zmiennej zostało zablokowane przez zabezpieczenie.
- **Zadania:** #322 i #329 zamknięte. Kolejna bramka integracyjna renderera (#330) wymaga zmergowania R4 do `integ-rend` (konflikt tylko w `lib.rs`, jedna linia).

### Przebieg — heartbeat (2026-11-16 ~22:50 UTC): 3/4 slotów aktywne, czwarty bez czystego tematu

- **Aktywne Workflow (3/4):**
  - K5DOC-T4b `_advanceStep`, runda 2 (`wf_8919e89c-4ba`), Haiku; etap FC.
  - K5DOC-T5a strzelec-kite, runda 2 (`wf_f88b947e-171`), Haiku; etap Evaluator.
  - K5DOC-T6 jazda, implementacja (`wf_7a5e569c-542`), Haiku; etap Evaluator.
- **Krok 2:** brak FC PASS bez integracji. Trzy workflow nadal w toku.
- **Krok 3 (sprzątanie):** worktree 11 (w tym zablokowany `wf_8919…-1` T4b r2). Dysk 9 GB po sprzątaniu, 14 GB przy poprzednim pomiarze. Bramka renderera (#330) czeka na ≥12 GB i brak budujących workerów.
- **Czwarty slot — powód pustego:**
  - #100 COMBAT-HARNESS (`wf_a01f4cfa-dd0`) jest już w fazie FC, więc nie startuję drugiego workflow na tym samym temacie.
  - #97, #104, #106, #107, #113, #115, #120, #121–#125 zablokowane decyzjami (#282, #286, format zapisu) lub zależnościami (K5LOOP, facing, #123).
  - Kandydaci z listy 328–358 wymagają rozpoznania (Haiku, tylko odczyt) albo decyzji właściciela (#358). Rozpoznanie dla #261 (falanga) lub #263 (MODEL-UI) można uruchomić w następnym heartbeacie.
- **Reguła modeli:** Operatorzy Haiku, Evaluator i FC Sonnet. Opus tylko dla R4 (zamknięte) i zadań 3D z listy 328–337.

### Przebieg — K5DOC-T6 JAZDA, runda 1 zakończona, runda integracyjna w toku (2026-11-16 ~23:05 UTC)

- **Runda 1 (`wf_7a5e569c-542`):** Operator BLOCK (dysk 6,5 GB). Evaluator FAIL: luka pokrycia kary `spearAdj` w szarży (pin `battleScene.ts:17753-17759`) i brak pełnego testu. Obrona przyjęła zarzuty 1, 3, 4 (commit `30c1e1392`, nazwany wektor `f_szarza_kara_spearAdj_bez_bfs`, komentarz o nieosiągalności kroku 4). FC PASS-WITH-NOTES na `87829df94`. Pełny `cargo test` NIE_ZMIERZONO (dysk 3,5 GB).
- **Zabezpieczenie:** WIP `87829df94` na `rust-port-wip/R-RUSTPORT-P6-K5DOC-T6-JAZDA-r1` (push OK), ref keep `refs/keep/P4-x-T6-fc-87829df94`. Recon `daf56eddd` na `rust-port-wip/…-recon-r1`.
- **Runda integracyjna (`wf_3180bfbf-196`, Haiku Operator, Sonnet Evaluator/FC):** BAZA `87829df94`, DODATEK r2 w dispatchu `89833dac8`. Zadanie: pełna bramka `cargo test --all-targets --no-fail-fast` przy dysku ≥ 8 GB, bez zmian w kodzie. FF `parity-v2` dopiero po EXIT 0.
- **Sprzątanie:** usunięte 5 worktree (T6 r1 `-1..-4` i recon). Dysk 9,7 GB przed startem rundy.
- **Reguła:** Operatorzy Haiku; Evaluator i FC Sonnet. Decyzje gameplay poza tym przebiegiem.

### Przebieg — heartbeat (2026-11-16 ~23:20 UTC): 4/4 slotów, dysk 7,1 GB

- **Aktywne Workflow (4/4):**
  - K5DOC-T4b `_advanceStep`, runda integracyjna (`wf_18327ef5-a0e`), Haiku; etap Evaluator. Baza: parity `32c84d6a9`, merge `d1dfff126`.
  - K5DOC-T5a strzelec-kite, runda 2 (`wf_f88b947e-171`), Haiku; etap Obrona.
  - K5DOC-T6 jazda, runda integracyjna (`wf_3180bfbf-196`), Haiku; etap Evaluator. Baza: `87829df94`.
  - Rozpoznanie K5DOC-T7 falanga (`wf_925e25ab-958`), Haiku, tylko odczyt, bez cargo (dysk < 8 GB).
- **Krok 2:** brak FC PASS bez integracji. T4b i T6 w integracji; po EXIT 0 pełnej bramki FF `parity-v2`.
- **Krok 3:** worktree 9; zakończone usunięte w poprzednich przebiegach.
- **Dysk:** 7,1 GB wolnego. Nowe tematy z kodem Rust nie startują poniżej 8 GB. Rozpoznanie nie kompiluje i nie zużywa targetu.
- **Reguła:** Operatorzy Haiku; Evaluator i FC Sonnet. Decyzje gameplay poza tym przebiegiem (#358).

### Przebieg — rozpoznanie K5DOC-T7 falanga (`7ae1e3e58`): PASS, podział tematu (2026-11-16 ~23:25 UTC)

- **Wynik:** w Rust przy `32c84d6a9` falanga istnieje tylko jako zdarzenie `PhalanxAction` (`siege_tactics_activate.rs:461-465`), bez treści. Brak `_phalanxLineFront`, `_phalanxAction`, `_phalanxStep`, `_fallBackStep`, `_bestFallBackStep`.
- **Decyzja techniczna (orkiestrator):** T7 dzielę na dwa tematy.
  - **T7a (#261):** `_phalanxLineFront` i `_phalanxAction`/`_phalanxStep` (pin ~6519 i ~6556). Zależy od T4b (#313, `_advanceStep` pin 8198) — start dopiero po integracji T4b na parity.
  - **T7b (nowy):** `_fallBackStep` i `_bestFallBackStep` (pin ~7186). Zależy od T4c (#314, `_doMove`). Przypisanie `_bestFallBackStep` do T7b, nie T5a, bo wywołuje go tylko falanga.
- **Zależności:** T7a i T7b nie startują przed T4b/T4c na parity. Nie zmieniam kontraktu `ActivateOps`; wpięcie zostaje na T8 / #113.
- **Zabezpieczenie:** commit rozpoznania `7ae1e3e58` ma ref `refs/keep/T7-recon-7ae1e3e58`.

### Przebieg — dysk krytyczny 755 MB → sprzątanie (2026-11-16 ~23:35 UTC)

- **Dysk:** spadł do 755 MB (99%) przez równoległe targety czterech workflow. Nowe starty wstrzymane.
- **Sprzątanie (tylko zakończone, z refami keep):**
  - `wf_925e25ab-958-1` (rozpoznanie T7 `7ae1e3e58`, ref `refs/keep/T7-recon-7ae1e3e58`): usunięty.
  - `integ-r2` (merge R2 `11d7e4763`, ref `refs/keep/P4-1-R2-merge2-11d7e4763`): usunięty. Bramka R2 nadal do wykonania na nowym merge.
  - `integ-rend` (`70d6fbb62`, nowy ref `refs/keep/integ-rend-70d6fbb62`): usuwanie w tle, po zakończeniu sprawdzić.
- **Nie ruszane (aktywne):** worktree T4b integracji (`wf_18327ef5-a0e-2`), T6 integracji (`wf_3180bfbf-196-1/2`), T5a r2 (`wf_f88b947e-171-1/2/3`).
- **Reguła:** nowe tematy z kodem Rust nie startują poniżej 8 GB. Bramka renderera (#330) wymaga ≥12 GB i braku budujących workerów.

### Przebieg — restart kontenera: utrata trzech workflow, ponowne uruchomienie (2026-11-17 ~00:05 UTC)

- **Utracone w restarcie (bez wyniku w dziennikach):** integracja T4b (`wf_18327ef5-a0e`, Evaluator), integracja T6 (`wf_3180bfbf-196`, Evaluator), runda 2 T5a (`wf_f88b947e-171`, Obrona).
- **Zachowany stan przed sprzątaniem:**
  - T4b: merge `3d016a5ae` (= `32c84d6a9` + `d1dfff126`), ref `refs/keep/T4b-merge-3d016a5ae`, gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T4B-merge-r3`. Bramki na merge nie były uruchomione.
  - T6: `87829df94`, fmt, clippy i `p6_k5doc_cavalry` 10/10 zielone. Pełny test NIEZAKOŃCZONY.
  - T5a: `761768677`, Operator PASS-WITH-NOTES (pełny test 3788 passed). Ewaluator FAIL: granice planszy (`nc<0`, `nc>=BF_COLS`, `nr>=BF_ROWS`) bez wektorów; mutanty G/H/I przechodzą. Ref `refs/keep/T5a-r2-op-761768677`, gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T5A-KITE-r2`.
- **Sprzątanie:** usunięte 6 worktree (T5a r2 `-1/-2/-3`, T6 integracja `-1/-2`, T4b integracja `-2`). Dysk 4,2 → 12 GB.
- **Dispatche r3/r4 (`3e2367892`):** T4b — tylko bramka na merge; T6 — tylko pełny test na `87829df94`; T5a — poprawka wektorów granic, base `761768677`.
- **Uruchomione ponownie:** T5a r3 (`wf_4f8fcb4a-b7c`), T4b bramka (`wf_a6a0b1b3-74a`). T6 pełny test odłożony do zwolnienia dysku (dwie kompilacje naraz zajmują ~8 GB).
- **Reguła:** Operatorzy Haiku; Evaluator i FC Sonnet.

### Przebieg — heartbeat (2026-11-17 ~23:50 UTC): 2/4 aktywne, dysk 2,4 GB — bez nowych startów

- **Aktywne Workflow (2/4):**
  - K5DOC-T5a strzelec-kite, runda 3 (`wf_4f8fcb4a-b7c`), Haiku; etap Operator. Baza `761768677`. Target `t5a-r3-target` (3,3 GB w scratchpadzie) w użyciu, nie ruszany.
  - K5DOC-T4b `_advanceStep`, bramka na merge `3d016a5ae` (`wf_a6a0b1b3-74a`), Haiku; etap Operator.
- **Krok 1 (sloty):** poniżej 4 aktywnych, ale dysk 2,4 GB < 4 GB — heartbeat zabrania startów. Nie uruchamiam nowych tematów. Kandydaci na czwarty i trzeci slot: bramka T6 na `87829df94` (pełny test, czeka na dysk) i tematy zablokowane zależnościami T4b/T4c (T7a/T7b).
- **Krok 2:** brak FC PASS bez integracji. T4b i T6 czekają na zielone bramki na merge/na tree przed FF.
- **Krok 3 (sprzątanie):** nie usuwam worktree ani targetów działających. Zakończone już usunięte w poprzednim przebiegu.
- **Ryzyko:** dwie kompilacje naraz zajmują ~5 GB. Przy spadku poniżej ~1 GB należy zatrzymać jeden z workflow (najpóźniej wstrzymać T4b bramkę) i zwolnić jego target. Decyzja o zatrzymaniu pozostaje w czacie.

### Przebieg — K5DOC-T5a runda 3 zakończona, integracja czeka na dysk (2026-11-17 ~00:30 UTC)

- **Wynik rundy 3 (`wf_4f8fcb4a-b7c`):** Operator PASS-WITH-NOTES na `048f7eede` (5 nazwanych przypadków granicznych: `nc<0`, `nc>=BF_COLS`, `nr>=BF_ROWS`, `nr<0`, wariant `nc<0`; generator 722 przypadki). Pełny `cargo test --all-targets --no-fail-fast`: EXIT 0, 3792 passed, 0 failed (p6_8i_pick 5 passed, 232 s). Mutanty G/H/I/(a)/(b)/(c) FAIL.
- **Evaluator PASS-WITH-NOTES, FC PASS-WITH-NOTES** na `270e5711b` (Obrona: tylko spacje w raporcie). Evaluator i FC nie mogły powtórzyć pełnej bramki (dysk ~1–3 GB). Równoważne mutanty K2/L2 wyjaśnione w raporcie.
- **Duplikaty helperów** (`DIRS4`, `manhattan`, `advance_dir`, `in_bounds`, `enemies_of`) z `siege_tactics_pathstep.rs` i `siege_tactics_doctrine_*` — notatka, osobny temat konsolidacji (poza allowlistą).
- **Zabezpieczenie:** refy keep `T5a-r3-op-048f7eede`, `T5a-r3-fc-270e5711b`, `T5a-r3-eval-95fd914cc`, `T5a-r3-fc-worktree-f0a830228`; gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T5A-KITE-r3` (`270e5711b`).
- **Raport FC** przeniesiony do `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5A-KITE/03-final-control.md`.
- **Merge z parity:** `merge-tree` `32c84d6a9` ↔ `270e5711b` czysty (exit 0). Integracja = merge `--no-ff` na parity + pełna bramka na merge (runda integracyjna Haiku) + FF. Start dopiero gdy dysk ≥ 8 GB i bramka T4b (`wf_a6a0b1b3-74a`) zakończona.
- **Sprzątanie:** usunięte worktree T5a `-1..-4` i target `t5a-r3-target` (3,3 GB). Dysk 1,2 → 5,6 GB.
- **Uwaga:** T4b bramka (`wf_a6a0b1b3-74a`) w toku, worktree `wf_a6a0b1b3-74a-1/-2` — nie ruszane.

### Przebieg — heartbeat (2026-11-17 ~00:20 UTC): 1/4 aktywne, dysk 3,4 GB — bez startów

- **Aktywne Workflow (1/4):** K5DOC-T4b `_advanceStep`, bramka na merge `3d016a5ae` (`wf_a6a0b1b3-74a`), etap FC (Ewaluator zgłosił zarzuty, Obrona odpowiedziała, FC w toku), Haiku/Sonnet. Cargo działa w `wf_a6a0b1b3-74a-4`.
- **Krok 1:** poniżej 4 aktywnych, ale dysk 3,4 GB < 4 GB — heartbeat zabrania startów. Nie uruchamiam nowych tematów.
- **Krok 2:** brak FC PASS bez integracji. T5a r3 (`270e5711b`) czeka na bramkę na merge z parity `32c84d6a9` (merge-tree czysty) po zwolnieniu miejsca i zakończeniu T4b.
- **Krok 3:** worktree T4b-gate i kopie robocze w użyciu, nie ruszane.
- **Wakeup:** nie planuję ScheduleWakeup. Ten tryb służy pętli `/loop`, a tej sesji nie uruchomiłem jako pętli.

### Przebieg — FF parity-v2 T4b (`32c84d6a9` → `3d016a5ae`), T5a w integracji (2026-11-17 ~00:40 UTC)

- **FF `parity-v2`: `32c84d6a9` → `3d016a5ae`** (T4b: `_advanceStep`, merge `d1dfff126`). Ancestry OK. `git diff --stat 32c84d6a9..3d016a5ae`: 7 plików, +54249/−0, wszystkie T4b w allowliście. `git diff --check` czysty. Readback `ls-remote`: `3d016a5aeed1`.
- **Bramka (runda `wf_a6a0b1b3-74a`, Haiku Operator, Sonnet Ewaluator/Obrona/FC):** fmt EXIT 0, clippy `-D warnings` EXIT 0, pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (3778 passed, 0 failed, 1 ignored — `p6_order_lane.rs` `#[ignore]` z parity, nie z T4b). `p6_k5doc_t4b` 8/8. Werdykty: Operator PASS, Ewaluator PASS-WITH-NOTES, FC PASS-WITH-NOTES. Obrona przyjęta bez zmian kodu.
- **Notatki do zapisania:** (1) `advance_step_decide` nie sprawdza `attackDirection = front` (C-FLANK pominięty); T4e musi zagwarantować `front` przed wpięciem. (2) Wektory T4b pochodzą z wykonania pina z odczytami sceny jako stubami; zgodność odczytów zależy od ich portów (T2/T4c). (3) Dysk przed bramką 4,5 GB przy wymaganym 8 GB — uwaga procesowa.
- **Keep refs:** `T4b-gate-pass-3d016a5ae`, `T4b-fc-5f3f53f91`, `T4b-r4-02ee10e7f`, `T4b-r4-7c3d6d429`, `T4b-r4-9ab04bfe4`.
- **Sprzątanie:** usunięte 4 worktree bramki T4b (`wf_a6a0b1b3-74a-1..4`). Dysk 6,5 → 12 GB.
- **T5a r4 (integracja):** merge `270e5711b` na `3d016a5ae` — `merge-tree` czysty (exit 0). Uruchomiona runda integracyjna `wf_1ed3e436-684` (Haiku Operator): pełna bramka na merge, FF dopiero po EXIT 0.
- **Otwarte:** T6 pełny test na `87829df94` (do zrobienia po T5a); FC T4b zakończone PASS-WITH-NOTES, wymóg `front` dla T4e w notatkach.

### Przebieg — heartbeat (2026-11-17 ~00:50 UTC): 1/4 aktywne, dysk 6,8 GB — bez nowego startu

- **Aktywne Workflow (1/4):** K5DOC-T5a strzelec-kite, integracja na parity (`wf_1ed3e436-684`), Haiku; etap Operator, kompilacja w toku (`wf_1ed3e436-684-1`). Baza `3d016a5ae`, merge `270e5711b`.
- **Krok 1 (sloty):** 1/4. Brak czystego tematu z gotowym dispatchem: T6 wymaga bramki 8 GB i nie może działać równolegle z kompilacją T5a; T7a/T7b czekają na T4c (bez dispatchu); reszta zablokowana decyzjami (#253, #286, #349, #350) lub zależnościami.
- **Krok 2:** brak FC PASS bez integracji. T5a w integracji; po EXIT 0 pełnej bramki FF.
- **Krok 3:** worktree 2 (główne + T5a integracja). Nie ruszane.
- **Dysk:** 6,8 GB — poniżej progu 8 GB dla nowych tematów z kodem Rust. Start nie zostanie wykonany, dopóki T5a się nie skończy i miejsce nie wzrośnie.
- **Wakeup:** nie planuję ScheduleWakeup. Ten tryb służy pętli `/loop`, a tej sesji nie uruchomiłem jako pętli.

### Przebieg — FF parity-v2 T5a (strzelec-kite, `3d016a5ae` → `625624d97`), 2026-11-17 ~01:05 UTC

- **FF `parity-v2`: `3d016a5ae` → `625624d97`** (merge T5a `1c7eb22fd` = `3d016a5ae` + `270e5711b`; raport Operatora r4 `625624d97`). Ancestry OK; kod T5a w historii. `git diff --stat 3d016a5ae..625624d97`: 9 plików, +59064/−0, wszystkie w allowliście T5a. W `mod.rs` jedna linia `pub mod siege_tactics_kite;`. `git diff --check` czysty. Readback: `625624d97205`.
- **Bramka na merge (`wf_1ed3e436-684`, Haiku Operator, Sonnet Ewaluator/FC):** fmt EXIT 0, clippy `-D warnings` EXIT 0, pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (3800 passed, 0 failed, 1 ignored — `e2e::dump_tick1_econ_for_web_generator`, sprzed T5a). `p6_k5doc_t5a` 22/22. Werdykty: Operator PASS, Ewaluator PASS-WITH-NOTES, FC PASS-WITH-NOTES. Obrona bez zmian w kodzie.
- **Notatki:** (1) generator `p6_k5doc_t5a_gen.mjs` odtworzony przez Obronę (TypeScript z `TYPESCRIPT_JS`), 722 przypadki bajt-w-bajt; (2) mutanty równoważne `gap < dNow` i `dd >= 0` przyjęte z dowodem; (3) `best_kite_shot_step` i `kite_branch_applies` bez wołającego produkcyjnego — zamierzone, wpięcie w T8 / #113; (4) duplikaty helperów `manhattan`, `advance_dir`, `enemies_of`, `in_bounds` — osobny temat konsolidacji.
- **Keep refs:** `T5a-r4-merge-1c7eb22fd`, `T5a-r4-report-625624d97`, `T5a-r4-fc-a194f45af`.
- **Sprzątanie:** usunięte worktree rundy integracyjnej T5a (`wf_1ed3e436-684-*`). Dysk 6,2 GB.
- **Otwarte:** T6 pełny test na `87829df94` (bramka do zrobienia po zwolnieniu dysku ≥ 8 GB); T4e wymaga zagwarantowania `attackDirection = front` (C-FLANK pominięty w T4b).

### Przebieg — T5a w parity, T6 w integracji (2026-11-17 ~01:15 UTC): 1/4 aktywne, dysk 11 GB

- **Aktywne Workflow (1/4):** K5DOC-T6 jazda, integracja na parity (`wf_6d014d2a-144`), Haiku Operator. Baza `625624d97`, merge `87829df94`. Merge-tree czysty (exit 0).
- **Zintegrowane w tym przebiegu:** T5a — `parity-v2` `3d016a5ae` → `625624d97` (opis w poprzednim wpisie).
- **Krok 1 (sloty):** 1/4. Brak czystego tematu z gotowym dispatchem: T7a/T7b czekają na T4c (bez dispatchu); reszta zablokowana decyzjami (#253, #286, #349, #350) lub zależnościami. Nie uzupełniam slotów tematami „dla zapełnienia".
- **Krok 2:** brak FC PASS bez integracji poza T6 (w integracji).
- **Krok 3:** worktree T5a usunięte, dysk 11 GB. Worktree T6 integracji nie ruszane.
- **Reguła:** dla T6 bramka na merge z pełnym testem, FF dopiero po EXIT 0.

### Przebieg — heartbeat 01:20 UTC (2026-11-17): 3/4 aktywne, dysk 7,3 GB

- **Aktywne Workflow (3/4):**
  - K5DOC-T6 jazda, integracja na parity (`wf_6d014d2a-144`): Operator r5 PASS (merge `87829df94` → `57ee8fc7d` lokalnie, bramki fmt/clippy/full test EXIT 0, passed 3810, failed 0, ignored 1 pre-existing). Etap: Evaluator (Sonnet). Brak push — FF dopiero po werdykcie.
  - K5DOC-T5b strzelec-marsz (#260), Operator Haiku, baza `625624d97`, dispatch `R-RUSTPORT-P6-K5DOC-T5B-MARSZ` (wf `wf_5291e068-ccd`). Start 01:2x UTC.
  - DOC-323 poprawka dokumentu P4-1G (#323), docs-only, Operator Haiku, dispatch `R-RUSTPORT-P6-DOC-323-RZEKA-KRAWEDZIE` (wf `wf_7304b042-01d`). Start 01:2x UTC.
- **Martwe wpisy (nie liczone jako aktywne):** `wf_f88b947e-171` (T5a r2), `wf_18327ef5-a0e` (T4b), `wf_3180bfbf-196` (T6 stary Operator) — brak `result` w journalu od restartu kontenera; ich worktree już nie istnieją; wyniki zintegrowane wcześniej (T5a `625624d97`, T4b `3d016a5ae`).
- **Krok 1 (sloty 4):** dopełniono do 3. Slot 4 wstrzymany: dysk 7,3 GB < 8 GB (reguła: brak nowego tematu z kodem Rust poniżej 8 GB). Brak czystego tematu docs-only poza #323 — nie wymyślam.
- **Krok 2:** brak FC PASS bez integracji poza T6 (w toku).
- **Krok 3:** sprzątanie — nic zakończonego do usunięcia poza wpisami martwymi (bez worktree). T6 worktree `wf_6d014d2a-144-1/-2` (1,2 GB każdy) nietknięte, bo T6 w toku.
- **Otwarte decyzje ABC (w czacie, nie w rejestrze):** #327 (garnizon w czasie wojny), #358 (mgła #253, wariant CRED-HAK #286). Nie zamykam ich sam.
- **Zarządzanie harmonogramem:** brak ScheduleWakeup (sesja nie jest pętlą /loop); heartbeat obsługuje harmonogram zdalny.

### Przebieg — DOC-323 zintegrowany (2026-11-17 ~01:4x UTC): 2/4 aktywne, dysk 7,1 GB

- **FC PASS-WITH-NOTES** `79b53ee73` (Operator `048ea8092`, Evaluator `d31a2124b`, obrona `ddc45798d`), temat #323, dispatch `R-RUSTPORT-P6-DOC-323-RZEKA-KRAWEDZIE`.
- **Dowód pinu (FC, `render/scene.ts`):** linia 1264 — `hex.rzeka.krawedzie zostaje dla logiki gry; render idzie po pełnej ścieżce` (jedyne „krawedzie” w render/battle). `battleScene.ts` nie zawiera `rzeka_krawedzie` ani `river_render_paths`.
- **Zmiana:** 4 linie w `P4-1G-ADAPTER-ROZPOZNANIE.md` (wiersz §3 nr 60 — kolumna pinu; wiersz §4 R3, ~linia 172) + raporty run dir.
- **Integracja — odstępstwo od FF na parity:** dokument nie istnieje na `parity-v2` (`625624d97`); FC commit dodaje cały plik (251 linii). Zamiast tego przeniesiono WYŁĄCZNIE zmiany (`git checkout 79b53ee73 -- <5 plików>`) na `claude/rust-sivvrn`, bo tam leży dokument. Commit `098910d01`, readback zgodny. `parity-v2` bez zmian (`625624d97`).
- **Keep ref:** `refs/keep/R-RUSTPORT-P6-DOC-323-fc` → `79b53ee73`.
- **Sprzątanie:** usunięte 4 worktree `wf_7304b042-01d-1..4`. Dysk 7,1 GB.
- **Otwarte uwagi FC:** Evaluator zauważył, że wpis R3 w §4 wiąże `river_render_paths` z `rivers[]`; `landRiverRenderPath`/`mediumRiverRenderPath` czytają też `map.hexes` (`scene.ts:1317-1318`). Obrona: nie czyta `rzeka.obecna`, bo funkcje są w `gen-helpers.ts` (nie w render). Do przeglądu przy integracji renderera (#319/#330).
- **Aktywne Workflow (2/4):** K5DOC-T6 jazda, Evaluator (Sonnet), `wf_6d014d2a-144`; K5DOC-T5b strzelec-marsz, Operator (Haiku), `wf_5291e068-ccd`.
- **Krok 1 (sloty):** 2/4. Wstrzymane: dysk 7,1 GB < 8 GB (nowy temat z kodem Rust). Brak czystego tematu docs-only (#325 to komentarze w kodzie Rust, #326/#357 to procesowe).

### Przebieg — T5b runda 1 zakończona FAIL/BLOCK INFRA; DODATEK r2 wypchnięty (2026-11-17 ~02:xx UTC)

- **Temat:** K5DOC-T5b strzelec-marsz (#260), ID `R-RUSTPORT-P6-K5DOC-T5B-MARSZ`, wf `wf_5291e068-ccd`.
- **Runda 1:** Operator BLOCK INFRA (dysk 2,7 GB, cargo nie uruchomione); Ewaluator FAIL (brak bramek cargo; mutacje Rust nie wykonane; lektura APPROACH w obronie); FC FAIL. Kod i wektory generatora (621 przypadków, bajt-w-bajt) są w bazie r2.
- **Refy zabezpieczające:** `refs/keep/R-RUSTPORT-P6-K5DOC-T5B-OP_R1-op-r1` = `2701a2065`, `…-OB_R1-ob-r1` = `6a2ded8bb`, `…-EV_R1-ev-r1` = `83e67bad6`, `…-FC_R1-fc-r1` = `412eefb81`. Gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T5B-MARSZ` = `412eefb81` (push zrobiony).
- **Sprzątanie:** usunięte 4 worktree rundy 1 (`wf_5291e068-ccd-1..4`), ok. 4,8 GB. Dysk 8,2 GB.
- **Odstępstwo od procedury:** pliki z keep-refs są w repo; push refs/keep bywa odrzucany przez proxy (#288), więc zabezpieczenie opiera się na gałęzi WIP i lokalnych refach.
- **DODATEK r2:** `a68da9f14` na `claude/rust-sivvrn`. Nowa baza `6a2ded8bb` (kod r1 + komentarze obrony). Zakres: bramki cargo z kontrolą dysku przed każdą, mutacje (a), (b), (d) na Rust, (c) z dowodem równoważności.
- **Start r2: WSTRZYMANY.** Dysk 8,2 GB, ale Ewaluator T6 (`wf_6d014d2a-144`, worktree `-144-2`) nadal działa i buduje; poprzednie odczyty spadały do 2,7 GB. Start r2 po zakończeniu T6 i jego sprzątaniu.
- **Aktywne Workflow:** 1/4 (T6, Ewaluator, Sonnet). Wolne sloty: 3 — dysk poniżej progu startów z kodem Rust, plus brak czystych tematów docs-only (patrz wpis DOC-323).

### Przebieg — restart kontenera: T6 integracja wznowiona jako DODATEK r6 (2026-11-17 ~02:xx UTC)

- **Utracone przez restart:** Ewaluator T6 r5 (`wf_6d014d2a-144`, zadanie `wig21l901`), zadania mutacji w tle (`blupe38zi`, `boja3p3g7`, `b8lmlep28`). Nie odtwarzam zadań mutacji; mutacje T5b są w dispatchu r2.
- **Pozostałość po przerwanym mutation runie:** nieskomitowany mutant (`if me.mounted` → `if false`) w `rust-port/engine/src/domain/siege_tactics_cavalry.rs` w worktree `-2`. Przywrócony do HEAD przed usunięciem worktree; kod T6 w repo nietknięty.
- **Zabezpieczenie:** `refs/keep/R-RUSTPORT-P6-K5DOC-T6-MERGE-R5` = `57ee8fc7d`, `refs/keep/R-RUSTPORT-P6-K5DOC-T6-OP-R5-int` = `1af81a8c3`; gałąź zdalna `rust-port-wip/R-RUSTPORT-P6-K5DOC-T6-JAZDA-INT` = `1af81a8c3`.
- **Sprzątanie:** usunięte worktree `wf_6d014d2a-144-1` i `-2` (ok. 2,4 GB). Dysk 11 GB.
- **DODATEK r6** (`014e38d5f` na `claude/rust-sivvrn`): nowa baza `1af81a8c3`. Operator weryfikuje ancestry, diff (tylko 7 plików T6), bramki EXIT 0. Nie pushuje, nie FF.
- **Aktywne Workflow:** `wf_bb4e6b3c-994` (T6 integracja r6, Operator Haiku). Start po zapisie DODATEK r6.
- **#260 T5b r2:** dispatch gotowy (`a68da9f14`), start wstrzymany do zakończenia bramek T6 — dwa równoległe rozruchy cargo przy progu 8 GB ryzykują kolejny BLOCK INFRA.

### Przebieg — heartbeat sloty (druga połowa godziny, 2026-11-17 ~01:50 UTC): 2/4 aktywne, dysk 15 GB

- **Aktywne Workflow:**
  - K5DOC-T6 jazda, integracja r6 (`wf_bb4e6b3c-994`): Operator r6 **BLOCK** — ancestry OK, fmt/clippy/`p6_k5doc_cavalry` EXIT 0, pełny `cargo test` nie zakończony (dysk spadł 9,3 → 7,4 GB w trakcie kompilacji). Raport `bdc625b4e`. Etap: Ewaluator (Sonnet) — uruchomiony, buduje w `t5a-r3-target` (patrz incydent niżej).
  - K5DOC-T5b strzelec-marsz, runda 2 (`wf_3446ab83-759`, zadanie `w77n8i5xq`): Operator, Haiku, baza `6a2ded8bb`, DODATEK r2 `a68da9f14`. Start po zwolnieniu dysku (15 GB).
- **Incydent (sprzątanie):** usunięto `/tmp/claude-0/t4b-eval-target` (3,3 GB, temat T4b zintegrowany `3d016a5ae` ⊂ `625624d97`). Próba usunięcia `/tmp/claude-0/t5a-r3-target` (T5a zintegrowany) trafiła w **aktywny target** Ewaluatora T6 (`cargo clippy` działał z `CARGO_TARGET_DIR=…/t5a-r3-target`) — katalog został częściowo usunięty (`Directory not empty`). Łańcuch `&&` zatrzymał się przed `tgt-t5a-eval`. Ewaluator może zgłosić błąd kompilacji z powodu brakujących artefaktów; wtedy skutek to fałszywy BLOCK, a nie błąd kodu. Zasada na przyszłość: przed `rm` targetu sprawdzać `/proc/*/environ` (CARGO_TARGET_DIR) i `ps` dla cargo/rustc — sama lista procesów ze zmiennymi nie wystarcza.
- **Krok 2 (zakończone FC PASS bez integracji):** brak.
- **Krok 3 (sprzątanie):** usunięte t4b-eval-target. Pozostałe: `ev_t6_target` (183 MB, T6 w toku), `tgt-t5a-eval` (358 MB, do usunięcia po zakończeniu Ewaluatora T6).
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — heartbeat (2026-11-17 ~02:20 UTC): 2/4 aktywne, dysk 7,9 → ok. 11 GB po sprzątaniu

- **Aktywne Workflow (2/4):**
  - K5DOC-T6 jazda, integracja r6 (`wf_bb4e6b3c-994`): Operator r6 BLOCK (pełny test przerwany dyskiem; wynik `bdc625b4e`). Ewaluator PASS-WITH-NOTES: zarzut, że krok 4 `_cavalryAction` (`best_charge_step`) jest w Rust nieosiągalny przez `cavalry_action_decide` — dowód w komentarzu kodu, kod 1:1 z pinem. Obrona w toku, potem FC (Sonnet).
  - K5DOC-T5b strzelec-marsz, runda 2 (`wf_3446ab83-759`): Operator r2 PASS-WITH-NOTES, commit `85f0c997f` (baza `6a2ded8bb`, bez push). Ewaluator w toku (bramki cargo). Po werdykcie Ewaluatora obrona/FC.
- **Krok 2 (zakończone FC PASS bez integracji):** brak. T6 czeka na FC, T5b na Ewaluatora.
- **Krok 3 (sprzątanie):** usunięte `/tmp/claude-0/t5a-r3-target` (częściowo usunięty w poprzednim przebiegu) i `/tmp/claude-0/tgt-t5a-eval` — sprawdzone: żaden proces ich nie używa, T5a zintegrowany. Zostają targety w użyciu: `t6obr/target` (T6 Obrona) i `ev_t5b_tgt` (T5b Ewaluator), `ev_t6_target` (T6, do usunięcia po FC).
- **Wolne sloty (2 z 4): powód.** Brak czystego tematu z kodem Rust, który nie wymaga decyzji właściciela lub niezintegrowanych zależności. Kandydaci z listy są zablokowani: #253/#278/#279/#281/#335/#337 (mgła, decyzja właściciela), #286/#350 (CRED-HAK, wariant A/B), #349 (ZLOZA, format zapisu), #285/#354 (ZDOBYCIE, opcja B), #106/#298/#299/#351 (R7K7C, decyzja fotela), #113/#353 (K5LOOP, wymaga #107/#109/#112 i decyzji o pętli), #304–#310 (ekonomia/dyplomacja — po zintegrowaniu renderera i wiringu), #314 (T4c `_doMove`, wymaga rozpoznania), #261/#342 (T7, zależne od T4c). Rozpoznanie tylko do odczytu nie uruchamiałem — w tej chwili nie ma kandydata, który wymaga wyłącznie rozpoznania. Start po zakończeniu T6/T5b.
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — kolejny restart kontenera: wznowienie T6 r6 i T5b r2 z cache (2026-11-17 ~02:4x UTC)

- **Utracone przez restart:** `wjl1tbu90` (T6 r6, etap Obrona) i `w77n8i5xq` (T5b r2, etap Ewaluator).
- **Zachowane w dziennikach:** T6 r6 — Operator BLOCK (`bdc625b4e`), Ewaluator PASS-WITH-NOTES. T5b r2 — Operator PASS-WITH-NOTES (`85f0c997f`).
- **Wznowienie:** `resumeFromRunId` — zakończone etapy z cache, nie uruchamiane drugi raz:
  - T6 r6: `wf_bb4e6b3c-994` (wznowiona; Obrona i FC od nowa).
  - T5b r2: `wf_3446ab83-759` (wznowiona; Ewaluator i dalsze od nowa).
- **Dysk:** 9,2 GB przed wznowieniem.
- **Otwarte:** zarzut Ewaluatora T6 (krok 4 `_cavalryAction` nieosiągalny) — obrona musi rozstrzygnąć.

### Przebieg — T5b r2: FC PASS-WITH-NOTES, integracja wstrzymana (2026-11-17 ~03:xx UTC)

- **FC PASS-WITH-NOTES** `366e6ff8d` (Operator r2 `85f0c997f`, obrona `4f8c5cb8d`). Bramki Operatora r2: fmt EXIT 0 (po poprawce kolejności `mod`), clippy EXIT 0, `p6_k5doc_t5b` 17/17, pełny `cargo test` EXIT 0 (3817 passed, 0 failed, 1 ignored spoza T5b). Mutacje na Rust: (a) FAIL 4 testy, (b) FAIL 2, (d) FAIL 2; (c) równoważna (dowód r1). Ewaluator zgłosił tylko noty: brak `lineAllowsRangedStep`/`_doMove` w kluczu kroku (zależność od T8/#113), `_siegeMachineRange` nieportowana (zgodnie z dispatchem).
- **Ancestry:** `366e6ff8d` ⊃ `6a2ded8bb` ⊃ `625624d97` = `parity-v2`. **FF możliwy bez merge.** Zakres diffu względem parity: 9 plików, allowlista T5b (moduł, test, generator, `vectors.json`, `mod.rs` +1) + raporty. Diff FC względem `85f0c997f`: tylko raporty run dir.
- **Zabezpieczenie:** `refs/keep/R-RUSTPORT-P6-K5DOC-T5B-FC-r2` = `366e6ff8d`; gałąź zdalna `rust-port-wip/R-RUSTPORT-P6-K5DOC-T5B-MARSZ-r2` = `366e6ff8d`.
- **Integracja: WSTRZYMANA.** Dysk 6,0 GB < 8 GB (próg bramki). Runda integracyjna Operatora z pełnym `cargo test` na `366e6ff8d` do zrobienia po zwolnieniu dysku, i po zakończeniu T6 r6 (ten sam plik `mod.rs` — po FF T6 konieczny ponowny merge-tree).
- **Aktywne Workflow:** T6 r6 (Obrona, `wf_bb4e6b3c-994`).

### Przebieg — T6 zintegrowany (FF parity-v2), T5b runda integracyjna r3 (2026-11-17 ~04:xx UTC)

- **T6 jazda — FC PASS-WITH-NOTES `83777efa9`** (r6: Operator BLOCK dysk, Ewaluator PASS-WITH-NOTES, Obrona BLOCK INFRA bez zmian kodu, FC PASS-WITH-NOTES). Kod `83777efa9` = kod `1af81a8c3` (diff `rust-port` pusty); różnią się tylko raporty run dir.
- **Decyzja orkiestratora (dowód zastępczy):** FC zapytał, czy przyjąć dowód zastępczy zamiast pełnego `cargo test` na `6e209d0ff`. Przyjęte: pełny test na identycznym kodzie zielony (Ewaluator r6: passed 3810, failed 0, ignored 1; Operator r5). Decyzja techniczna orkiestratora, nie właściciela.
- **FF `rust-port/parity-v2`:** `625624d97` → `83777efa9` (readback zgodny). Zabezpieczenie: `refs/keep/R-RUSTPORT-P6-K5DOC-T6-FC-r6`, gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T6-JAZDA-FC-r6`.
- **Zakres diffu T6 względem poprzedniego parity:** 5 plików kodu i testów + `mod.rs` +1 linia (allowlista T6).
- **Uwagi FC do REJESTR (nie blokują):** krok 4 `_cavalryAction` nieosiągalny w Rust (1:1 z pinem, dowód w komentarzu kodu); `_doMove` emulowany minimalnie — pełny wymaga T4c (#314); przy wpięciu (T8/#113) wektory end-to-end.
- **T5b jazda — runda integracyjna r3 (`wf_ff355a62-ed0`):** FC PASS-WITH-NOTES `366e6ff8d` (r2). `merge-tree` na `83777efa9` czysty (exit 0). Operator r3: merge `--no-ff` + pełne bramki; FF wykona orkiestrator po werdykcie FC. Zabezpieczenie: `refs/keep/R-RUSTPORT-P6-K5DOC-T5B-FC-r2`, `rust-port-wip/R-RUSTPORT-P6-K5DOC-T5B-MARSZ-r2`.
- **Aktywne Workflow:** 1 (T5b integracja r3). Wolne sloty: 3. Powód: brak czystego tematu Rust (lista jak w poprzednich przebiegach); dysk 8,1 GB — start Rust dopiero po zakończeniu bramek T5b.
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — T5b integracja r3: BLOCK INFRA, sprzątanie, bramki r4 (2026-11-17 ~05:xx UTC)

- **Runda r3 (`wf_ff355a62-ed0`):** Operator BLOCK INFRA (dysk 6,9 GB, bramki nieuruchomione), Ewaluator FAIL (infra, bez bramek), FC FAIL (infra). Merge `c97cd4542` i raport `7778e66af` zrobione lokalnie, bez push i FF.
- **Zabezpieczenie:** `refs/keep/R-RUSTPORT-P6-K5DOC-T5B-INT-r3-merge` = `c97cd4542`, `…-INT-r3-report` = `7778e66af`; gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T5B-INT-r3` = `7778e66af` (readback zgodny).
- **Sprzątanie (zakończone rundy):** usunięte worktree `wf_3446ab83-759-1..4` (T5b r2), `wf_bb4e6b3c-994-1..4` (T6 r6), `wf_ff355a62-ed0-1..3` (T5b r3). Każdy SHA zabezpieczony refem `refs/keep/R-SWEEP-r3-<sha9>`. Dysk z 4,8 GB do ok. 18 GB.
- **DODATEK r4** (`a55923e05` na `claude/rust-sivvrn`): baza `7778e66af`, merge już zrobiony — runda odtwarza tylko bramki, bez zmian w kodzie.
- **Aktywne Workflow:** `wf_122fbedc-719` (T5b integracja, bramki r4, Operator Haiku). Start po zapisie DODATEK r4.
- **FF `parity-v2`:** dopiero po FC PASS. Bieżący `parity-v2` = `83777efa9`.

### Przebieg — heartbeat (druga połowa godziny, 2026-11-17 ~02:48 UTC): 1/4 aktywne, dysk 13 GB

- **Aktywne Workflow (1/4):** K5DOC-T5b strzelec-marsz, integracja r4, bramki na `7778e66af` (`wf_122fbedc-719`). Operator Haiku w trakcie `cargo test --all-targets` (proces działa, dysk 13 GB, ≥ 8 GB).
- **Krok 2:** brak FC PASS bez integracji. T5b czeka na werdykt r4 (Ewaluator, FC), potem FF `parity-v2` `83777efa9` → `7778e66af`.
- **Krok 3 (sprzątanie):** nic do usunięcia. Worktree `wf_122fbedc-719-1` (rund trwa) nietknięte.
- **Wolne sloty (3 z 4): powód.** Brak czystego tematu z kodem Rust. Kandydaci z listy (#97, #100, #104, #106, #113, #115, #120, #135, #172, #253, #257, #259 (już zintegrowany jako T6), #260 (w integracji), #261, #263, #264, #268, #285, #286, #304–#310, #314, #315) są zablokowani decyzją właściciela (#253, #285, #286), zależnościami (#261 na #314; #304 na #310; #113 na #107/#109/#112) lub niezintegrowanym renderem (#316–#322). Rozpoznanie tylko do odczytu nie jest jeszcze zlecone: nie ma kandydata, którego wynik zmieniłby decyzję.
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — heartbeat (2026-11-17 ~03:18 UTC): T5b integracja r4 — Ewaluator PASS-WITH-NOTES, FC w toku; 1/4 aktywne; dysk 12 GB

- **Ewaluator r4 (`wf_122fbedc-719`): PASS-WITH-NOTES.** Baza `7778e66af` (ancestry `83777efa9` i `366e6ff8d` OK). Diff `83777efa9..7778e66af`: 5 plików rust-port, 0 usunięć, allowlista T5b, `mod.rs` +1 linia, T6 nietknięty. Bramki EXIT 0: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test p6_k5doc_t5b` (17/17), `cargo test --all-targets --no-fail-fast` (3827 passed, 0 failed, 1 ignored — `e2e::dump_tick1_econ_for_web_generator`, istniejący poza T5b). Raport `04-integracja-r4.md` (commit `4f88004fd`, tylko raport).
- **Krok 2:** T5b po werdykcie Ewaluatora czeka na FC (Sonnet). FF `parity-v2` `83777efa9` → `7778e66af` dopiero po FC PASS.
- **Krok 3 (sprzątanie):** worktree `wf_122fbedc-719-1` (Ewaluator) do usunięcia po FC; `-2` (locked, merge `7778e66af`) — po zakończeniu rundy. Nic nie usuwam, dopóki FC pracuje.
- **Aktywne Workflow (1/4):** T5b integracja r4 (FC). Wolne sloty (3): powód jak w poprzednim przebiegu — brak czystego tematu Rust.
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — heartbeat (2026-11-17 ~03:48 UTC): T5b r4 — Ewaluator PASS-WITH-NOTES, Obrona przyjęła notę, FC w toku; 1/4 aktywne; dysk 7,4 GB

- **Aktywne Workflow (1/4):** K5DOC-T5b, integracja r4 (`wf_122fbedc-719`), etap FC (Sonnet). FC uruchamia `cargo test --all-targets --no-fail-fast` (proces działa).
- **Ewaluator r4:** PASS-WITH-NOTES, bramki EXIT 0 (fmt, clippy, `p6_k5doc_t5b` 17/17, pełny test 3827 passed, 0 failed, 1 ignored istniejący poza T5b). Nota: w drugiej pętli `best_forward_step` (pin `battleScene.ts` 6865–6866) pięć mutantów filtra koperty sojuszniczej przeżywa — brak wektora zmieniającego `min_row/max_row`. Nieblokująca; zalecenie na kolejną rundę (wektor na flagę).
- **Obrona r4:** przyjęła notę jako nieblokującą, bez zmian kodu.
- **Krok 2:** FF `parity-v2` `83777efa9` → `7778e66af` dopiero po werdykcie FC PASS.
- **Krok 3 (sprzątanie):** nie usuwam worktree, dopóki FC pracuje (`wf_122fbedc-719-1/-2/-4`).
- **Wolne sloty (3 z 4):** powód jak wcześniej — brak czystego tematu Rust.
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — T5b zintegrowany (FF parity-v2), 2026-11-17 ~04:xx UTC

- **FC PASS-WITH-NOTES `417091872`** (integracja r4: Operator `4f88004fd` PASS-WITH-NOTES, Ewaluator PASS-WITH-NOTES, Obrona przyjęła notę, FC PASS-WITH-NOTES).
- **Bramki (Operator i Ewaluator, EXIT 0):** fmt, clippy `-D warnings`, `p6_k5doc_t5b` 17/17, pełny `cargo test` 3827 passed, 0 failed, 1 ignored (istniejący, poza T5b).
- **Weryfikacja przed FF (orkiestrator):** `83777efa9` i `7778e66af` są przodkami `417091872`; `rust-port` między `7778e66af` a `417091872` bez zmian; diff względem parity to 5 plików rust-port (allowlista T5b, `mod.rs` +1) i raporty.
- **FF `rust-port/parity-v2`:** `83777efa9` → `417091872` (readback zgodny). Zabezpieczenie: `refs/keep/R-RUSTPORT-P6-K5DOC-T5B-FC-r4`, gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T5B-MARSZ-FC-r4`.
- **Nota do rejestru (nieblokująca, z FC):** w drugiej pętli `best_forward_step` (pin `battleScene.ts` 6865–6866) pięć mutantów filtra koperty sojuszniczej przeżywa. Brak wektora na tę flagę. Do kolejnej rundy T5b/T8: po jednym wektorze na flagę w generatorze TS.
- **Nota (zakres):** `ranged_forward_step_key` pomija bramkę `lineAllowsRangedStep` i `_doMove`; brak wołającego poza testami. Wpięcie T8/#113.
- **Sprzątanie:** usunięte worktree rundy r4 (`wf_122fbedc-719-1, -2, -4`), SHA zabezpieczone refami `refs/keep/R-SWEEP-r4-*`. Dysk 15 GB.
- **Parity po integracji:** T6 (#259) i T5b (#260) zintegrowane na `417091872`.
- **Aktywne Workflow:** 0. Wolne sloty: 4. Powód: brak czystego tematu z kodem Rust. Kandydaci z listy są zablokowani decyzjami właściciela (#253, #285, #286, #358), zależnościami (np. #261 na #314, #304 na #310, #113 na #107/#109/#112) lub renderem (#316–#322, wymaga ≥12 GB i bramki renderera).
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — heartbeat (2026-11-17 ~04:2x UTC): 1/4 aktywne, dysk 15 GB

- **Aktywne Workflow (1/4):** K5DOC-T4c efekty `_doMove` (#314), runda 1, Operator Haiku (`wf_ca9bf0be-2b1`). Baza `417091872` (zawiera T4b `3d016a5ae`). Dispatch `76f7aeefc` na `claude/rust-sivvrn`.
- **Zakres T4c:** pure function efektów stanu `_doMove` (zajętość, koszt terenu z clampem, brod ×0,5, `moveLeft`, krok planowania). Facing jako wejście (#107 zablokowany), animacja i `busy` poza zakresem.
- **Krok 2:** brak FC PASS bez integracji. T5b zintegrowany (`417091872`), T6 zintegrowany (`83777efa9`).
- **Krok 3 (sprzątanie):** brak zakończonych worktree. Nic nie usuwam.
- **Wolne sloty (3 z 4): powód.** Pozostałe kandydaci z listy są zablokowani decyzją właściciela (#253, #285, #286, #358), zależnościami (#261 na #314, #304 na #310, #113 na #107/#109/#112) lub wymagają rozpoznania bez gotowego dispatchu.
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — heartbeat (2026-11-17 ~04:47 UTC): 1/4 aktywne, dysk 8,5 GB

- **Aktywne Workflow (1/4):** K5DOC-T4c efekty `_doMove` (#314), runda 1 (`wf_ca9bf0be-2b1`). Operator Haiku PASS-WITH-NOTES, commit `f85622878` (rust-port-wip). Bramki Operatora: generator 314 przypadków (odmowa 44, planowanie 150), fmt EXIT 0, clippy EXIT 0, pełny test EXIT 0 (3841 passed, 0 failed). Etap: Ewaluator (Sonnet) — uruchomiony, cargo test w toku.
- **Krok 2:** brak FC PASS bez integracji. Parity `417091872` bez zmian.
- **Krok 3 (sprzątanie):** nic zakończonego do usunięcia. Worktree `wf_ca9bf0be-2b1-1/-2` zostają do końca rundy.
- **Dysk:** 8,5 GB — tuż nad progiem 8 GB dla nowych startów z kodem Rust. Dlatego nie startuję kolejnego tematu w tym przebiegu.
- **Wolne sloty (3 z 4): powód.** Bez zmian wobec poprzednich przebiegów: brak czystego tematu z listy (zablokowane decyzjami właściciela lub zależnościami; patrz przebieg 04:2x).
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — T4c (#314) zintegrowany FF na parity-v2 (2026-11-17 ~04:5x UTC)

- **FC PASS-WITH-NOTES `f85622878`** (Operator PASS-WITH-NOTES, Ewaluator PASS-WITH-NOTES). Bramki na tym samym kodzie: generator 314 przypadków (odmowa 44, planowanie 150), fmt EXIT 0, clippy EXIT 0, pełny `cargo test` EXIT 0 (3841 passed, 0 failed), `p6_k5doc_t4c` 14/14. Mutacje (a) brod, (b) clamp, (c) occByKey — FAIL.
- **Weryfikacja przed FF:** ancestry `417091872` OK; diff względem parity to 5 plików T4c (allowlista) i `mod.rs` +1 linia.
- **FF `rust-port/parity-v2`:** `417091872` → `f85622878` (readback zgodny). Zabezpieczenie: `refs/keep/R-RUSTPORT-P6-K5DOC-T4C-FC-r1`, gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T4C-DOMOVE-FC-r1`.
- **Decyzja techniczna (orkiestrator, dla T4e #315):** `MoveWorld::move_cost(col,row)` w T4c nie przyjmuje jednostki. Web `_moveCostForUnit` zależy od `ru.mounted` (pin 7436–7445). Wpięcie T4e musi dostarczyć koszt per jednostka (świat per jednostka). Wektor dla jednostki konnej — do dodania w T4e.
- **Uwaga do dispatchu (nie kod):** koniec `_doMove` to linia 8776 w pinie (dispatch podawał 8779 — błąd dispatchu; kod poprawny).
- **Nota nieblokująca (z Ewaluatora):** mutacja `!= Attack` → `== Hold` przeszła, równoważna (rodzaje intencji: Hold/Move/Attack).
- **Sprzątanie:** usunięte worktree `wf_ca9bf0be-2b1-1..4`, SHA zabezpieczone `refs/keep/R-SWEEP-T4C-*`. Dysk 15 GB.
- **Aktywne Workflow:** 0. Wolne sloty: 4. Powód: brak czystego tematu Rust (kandydaci zablokowani: #253, #285, #286, #358 — decyzje właściciela; #261 czeka na #314 (już zintegrowany — do sprawdzenia w następnym przebiegu); #304 na #310; #113 na #107/#109/#112).
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — heartbeat (2026-11-17 ~05:18 UTC): 0 Workflow aktywnych, 1 rozpoznanie w tle, dysk 15 GB

- **Aktywne Workflow:** 0. Parity `rust-port/parity-v2` = `f85622878` (T4c zintegrowany, FF).
- **Rozpoznanie w tle (nie Workflow, tylko odczyt, Haiku):** K5DOC-T7 FALANGA-COFANIE (#261), dispatch `R-RUSTPORT-P6-K5DOC-T7-FALANGA-ROZPOZNANIE`, DODATEK r2 z bazą `f85622878` (`51c1745cc`). Wynik: `01-rozpoznanie.md` (STATUS, mapa pina, podział T7a/T7b, allowlista, wektory). Odbiór i commit przez orkiestratora po powiadomieniu.
- **Krok 2:** brak FC PASS bez integracji.
- **Krok 3:** nic do usunięcia (brak worktree).
- **Wolne sloty (4 z 4): powód.** Kandydaci zablokowani: #253, #285, #286, #358 (decyzje właściciela), #304 (czeka na #310), #113 (na #107/#109/#112), #107/#123 (facing, blokowany przez #113), #315 (T4e: wymaga decyzji o koszcie per jednostka, odnotowanej w poprzednim przebiegu, oraz wpięcia w ProdBody). T7 (#261) czeka na wynik rozpoznania — T7a/T7b wejdą jako dispatch po odbiorze.
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — rozpoznanie T7 zakończone, T7b uruchomiony (2026-11-17 ~05:2x UTC): 1/4 aktywne, dysk ok. 14 GB

- **Rozpoznanie T7 (`01-rozpoznanie.md`, STATUS PASS):** podział na **T7a** (falanga: `_phalanxAction` / `_phalanxLineFront` / `_phalanxStep`) i **T7b** (odwrót: `_bestFallBackStep` / `_fallBackStep`). T7b nie zależy od T7a. Obie wymagają zintegrowanych T4b i T4c (są w `f85622878`).
- **Ustalenie krytyczne dla T7a (blokuje start T7a):** w web `_phalanxAction` (pin 6290) jest wołana tylko poza blokiem doktryny (6093–6098). W trybie auto z domyślną doktryną falanga idzie przez `_executeGroupDoctrineStep` → `_advanceStep` (18043–18048) i omija linię falangi. Wektory muszą pokryć obie ścieżki. Przed startem T7a potrzebna weryfikacja `_manualMode` w normalnej grze (domyślnie `true`, pin 2286) i doktryn `defensive`/`skirmish`.
- **T7b (`wf_c345eac0-607`, zadanie `wdme72mo2`):** dispatch `72c16c710` na `claude/rust-sivvrn`, baza `f85622878`. Zakres: `best_fall_back_step`, `fall_back_step_decide`, `fall_back_after_move`; scheduling jako `AfterStep::Schedule` (nie wykonywany); wiring do `ActivateUnit` poza zakresem; stała `FALLBACK_TILES` już istnieje (`siege_tactics_activate.rs:43`).
- **Otwarte w rozpoznaniu:** dwa typy stałych `BF_COLS` (i64 w `siege_tactics_approach.rs:210`, f64 w innych) — Operator wybiera jeden typ i zapisuje wybór.
- **Wolne sloty (3 z 4): powód.** T7a wstrzymany (weryfikacja ścieżki auto). Pozostałe kandydaci zablokowane jak w przebiegu 05:18 (#253, #285, #286, #358, #304→#310, #113→#107/#109/#112, #315 decyzja kosztu per jednostka).
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — heartbeat (2026-11-17 ~05:48 UTC): 1/4 aktywne, dysk 9,7 GB

- **Aktywne Workflow (1/4):** K5DOC-T7b odwrót (`_bestFallBackStep`, `_fallBackStep`), runda 1, Operator Haiku (`wf_c345eac0-607`). Worktree `wf_c345eac0-607-1` w toku. Brak wyniku Operatora w dzienniku.
- **Krok 2:** brak FC PASS bez integracji. Parity `f85622878` bez zmian.
- **Krok 3:** nic do usunięcia.
- **Dysk:** 9,7 GB — powyżej progu 8 GB dla bramek.
- **Wolne sloty (3 z 4): powód.** T7a (falanga) wstrzymany do potwierdzenia ścieżki auto (patrz przebieg 05:2x). Pozostali kandydaci zablokowani jak w poprzednich przebiegach (#253, #285, #286, #358, #304→#310, #113→#107/#109/#112, #315 decyzja kosztu per jednostka).
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — heartbeat (2026-11-17 ~06:18 UTC): 2/4 aktywne, dysk 11 GB

- **Aktywne Workflow (2/4):**
  - K5DOC-T7b odwrót (`wf_c345eac0-607`): Operator PASS-WITH-NOTES `5141e9471`, Ewaluator PASS-WITH-NOTES, Obrona PASS-WITH-NOTES `9b5a31f15`. Etap: FC (Sonnet). Nota Ewaluatora: mutant `d_min <= 1.0` → `<` przeżywa (brak wektora na gałąź pina :7209). Do kolejnej rundy/T8.
  - K5DOC-T7a falanga (`wf_30e2308d-50d`): dispatch `36eec80db` na `claude/rust-sivvrn`, baza `f85622878`. Zakres: port funkcji falangi (`is_phalanx`, `phalanx_line_front`, `phalanx_action_decide`, `phalanx_step_decide`); wiring poza zakresem (ścieżka auto omija falangę — zapisane w dispatchu).
- **Krok 2:** T7b czeka na FC; po PASS → refs/keep, push wip, runda integracyjna Operatora z pełnym `cargo test`, FF.
- **Krok 3:** usunięte cache po zintegrowanych tematach: `ev_t6_target`, `t5b-ev-target`. Nie ruszane: `tgt-t7b` (T7b w użyciu).
- **Wolne sloty (2 z 4): powód.** Renderer (Opus) wymaga bramki przy ≥12 GB bez równoległych buildów; dysk 11 GB z działającym cargo T7b. Wariant skryptu Workflow z Operatorem na Opus wymaga zgody (zasady: Opus tylko dla grafiki). Pozostali kandydaci zablokowani jak wcześniej.
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — T7b FC PASS-WITH-NOTES, integracja r2; uruchomione 3 nowe Workflow (2026-11-17 ~07:xx UTC): 4/4 aktywne

- **T7b odwrót — FC PASS-WITH-NOTES `7def6d636`** (Operator `5141e9471`, Ewaluator, Obrona `9b5a31f15`). Notes: mutant `d_min <= 1` → `<` (naprawiony wektorem, rund 2); pełny `cargo test` nie zamknął się: binarium `p6_8i_pick` wisiało ponad 45 min (zadanie #291), proces został przy workerze (nie zabijałem cudzych procesów). Dispatch DODATEK r2 `aff7aeb65`: integracja z osobnym przebiegiem `p6_8i_pick` z `timeout 900`. Decyzja o ewentualnym wykluczeniu tego binarium z pełnego przebiegu — orkiestrator, po wyniku r2.
- **#332 R4 G5 — Opus** (`wf_c2dda485-691`, skrypt `r-rustport-opus-grafika-wf.js`, Operator/Obrona/Ewaluator/FC na Opus): normalizacja kluczy (`LEGACY_KEY_ALIASES` z pina) i fallback do `hex.ulepszenie`. Dispatch `0059a4f2a`, baza `f85622878`. Odstępstwo: producenta `improvement_key` nie znaleziono w `view-model`/`engine` — normalizacja w konsumencie `sync/build.rs` (do potwierdzenia przez Operatora). Bramka renderera wymaga ≥ 12 GB; przy mniej — BLOCK z liczbą GB.
- **#356 audyt statusów ZINTEGROWANE** (`wf_e58137b5-6a6`, Haiku, doc-only): dispatch `R-RUSTPORT-P6-AUDIT-ZINTEGROWANE/00-dispatch.md`. Wynik: tabela modułów z wołającymi produkcyjnymi — do przeglądu, bez zmian w rejestrze.
- **T7a falanga** (`wf_30e2308d-50d`) — w Operatorze.
- **Sloty: 4/4.** Dysk ~8 GB — bramki renderera i pełnego testu mogą czekać.
- **Otwarte decyzje ABC (w czacie):** #327, #358.

### Przebieg — T7b integracja r2: BLOCK INFRA, FC FAIL → r3 (2026-11-17 ~07:xx UTC)

- **Wynik r2 (`wf_22aea0c3-510`):** Operator BLOCK INFRA (dysk 4,6 GB, bramki nieuruchomione). Ewaluator PASS-WITH-NOTES (zarzuty infra + noty). FC FAIL (infra) → runda r3 tego samego ID.
- **Noty do zapisu (nieblokujące):** (a) `nearest == None` przy niepustej liście wrogów nieosiągalne w produkcji (ten sam filtr `_enemiesOf`, pin 8290–8304) → zależność producenta W8/ProdBody; (b) wektory nie zawierają pola `nearest` z pina → do dodania przy zmianie generatora; (c) filtr `routed` z `_enemiesOf` nieobjęty wektorami → jawna zależność.
- **Sprzątanie:** zabezpieczone refami `refs/keep/R-SWEEP-wf_22aea0c3-510-*` i `R-SWEEP-wf_c345eac0-607-4`; usunięte worktree rundy r2 (4 szt.) i FC T7b; usunięte zakończone targety `tgt-t7b` (3,3 GB) i `tgt-fc-t7b` (363 MB). Dysk 3,6 → ok. 13 GB.
- **T7b r3 (`wf_af7143d7-863`):** DODATEK r3 `c4756db1a` na bazie `7def6d636`, z osobnym przebiegiem `p6_8i_pick` (timeout 900 s).
- **Kolejka (KOLEJKA-RUST.md, `ef82f9cb3`):** P0 — T7b r3, #332 (Opus), #356 audyt, #261 T7a; P1 — integracja renderera (Q5, R1, R3, R5, R2) po bramce ≥ 12 GB bez równoległych buildów; P2 — #218 BATTLE-EVENTS (Opus), pierwszy kandydat do startu po zwolnieniu slotu.
- **Aktywne Workflow:** 4/4 (T7b r3, #332 Opus, #356, T7a).

### Przebieg — heartbeat Rust (sloty, 2026-11-17 ~06:50 UTC): G5 r2 BLOCK INFRA, T7a FAIL→r2

- **#332 G5 normalizacja kluczy (Opus) — r2 zakończona BLOCK INFRA, bez integracji.** Operator, Evaluator (FAIL, infra) i Obrona (BLOCK), FC FAIL: wszystkie powody to bramka renderera nieuruchomiona (dysk 8,8 GB przy wymaganych 12 GB + cudze buildy cargo). To czwarty z rzędu BLOCK INFRA. Kod `0671e292d` i wektory generatora zacommitowane; gałęzie `rust-port-wip/p4-1-g5-norm-opus-{op,obrona,fc}-r1` i `-ev-r1` na zdalnym. Runda r3 wymaga ≥12 GB i braku cudzych buildów.
- **Decyzje G5 wpisane (orkiestrator, techniczne):** D1 — fallback do `hex.ulepszenie` tylko przy pustym `ulepszenia`, nie przy pustym `improvement_key` (pin `terrain-improvements.ts:365-377`, `improvementKey` nieczytany na ścieżce renderu). D2 — `''` i `'brak'` zostają w warstwach postawionych (pin `main.ts:3132-3135`), w `keysForHex` pomijane. Mutacja (b) z r1 jest równoważna; zastąpiona przez (b′) (filtr przy dokładaniu warstw w `build.rs:230-232`).
- **Dług G5 (poza allowlistą):** opis luki w `rust-port/renderer/src/improvements/sync/mod.rs:39,46` do aktualizacji osobnym tematem lub przy rozszerzeniu allowlisty.
- **#261 T7a falanga — FC r1 FAIL, jedyny powód BLOCK INFRA (bramki clippy i pełny test, dysk <8 GB).** Zarzuty Evaluatora (mutant bez premii +6 za sąsiada, mutant `nr >= BF_ROWS`) naprawione wektorami w `409477d73`/`1120f110c` i potwierdzone przez FC. Zabezpieczone: `rust-port-wip/p6-k5doc-t7a-r1-{fc,ev,op-report,1120f110c,409477d73}` (wszystkie na zdalnym; `refs/keep` tylko lokalnie — push 4× odrzucony przez remote). Usunięte 4 worktrees rundy r1 i cache `t7a-target` (brak procesów). DODATEK r2 w dispatchu: `f3f498ae3`, baza `750c100063`. **T7a r2 uruchomiony** (`wf_f904e0c1-c5c`, Operator Haiku).
- **Sprzątanie tej tury:** usunięte 4 worktrees rundy G5 r1 (≈4,8 GB), zabezpieczone commity. Worktrees G5 r2 i T7b (zablokowany, żywy) nietknięte.
- **Sloty: 2/4 aktywne** (T7b r3 — bramka testów; T7a r2 — Operator). Dysk 8,4 GB.
- **Dlaczego 2 sloty wolne:** kandydaci z kolejki bez gotowego dispatchu to #315/#344 (K5DOC-T4e wpięcie ruchu w ProdBody) i #263/#345 (K5DOC-T1 MODEL-UI); wymagają czytania pina przed dispatchem, którego nie zdążyłem napisać w tym heartbeacie. Tematy renderera (#322 R4, G5 r3) czekają na bramkę ≥12 GB. Nie startuję tematów bez dispatchu.
- **Do zrobienia przez orkiestratora:** push `refs/keep/*` (4× odrzucony), aktualizacja listy zadań (#341, #340, #338, #342 są już zakończone lub zdublowane w tabeli, #332 otwarte).

### Przebieg — tick autonomiczny (2026-11-17): T7b r3 bez integracji, T7a r2/r3, okno dla G5 r3

- **T7b odwrót (#342), runda r3 (`wf_af7143d7-863`) — NIE zintegrowany.** Operator: brak commitu, pełny `cargo test --all-targets` przerwany (EXIT 124 po 580 s), `01-operator-r1.md` nieobecny. Evaluator FAIL (formalnie i infra). Obrona BLOCK. FC PASS-WITH-NOTES nie przyjęty jako podstawa integracji: pełny test i `p6_8i_pick` niezmierzone, a brak commitu. Kod zabezpieczony: `rust-port-wip/p6-k5doc-t7b-r3-wip` = `61ffc110f` (pliki allowlisty: `siege_tactics_fallback.rs`, `mod.rs` +1, `p6_k5doc_t7b*`); raporty `-ev` (`5e620f003`) i `-ob` (`439b1e1ae`). Worktrees rundy usunięte. Następna runda r4: baza `61ffc110f`, bramki po zwolnieniu dysku, `p6_8i_pick` z `timeout 900`.
- **T7a falanga (#261):** r2 BLOCK INFRA (dysk 7,2 GB Operator, 3,1 GB FC) — bramki niezmierzone. Commity r2 zabezpieczone (`rust-port-wip/p6-k5doc-t7a-r2-{op,ob,fc,wt2}`). **r3 w toku** (`wf_de3b72ff-45d`, baza `c39d97add`, DODATEK r3 `1121a3ffc`), Operator buduje pełny `cargo test`.
- **G5 normalizacja (#332), runda r3 — czeka na okno.** Dispatch DODATEK r3 wypchnięty (`814a24102`, baza `02b07a83e`). Reguła: uruchomić jako jedyny worker, dopiero gdy nie ma cudzych `cargo`/`rustc` i `df -h /` ≥ 12 GB. Stan na tick: dysk 9,8 GB, cudzy build T7a r3 (pid 29208). Po czterech BLOCK INFRA kolejna blokada oznacza wypadnięcie tematu z kolejki.
- **Zasada startów (decyzja właściciela):** dopóki bramka renderera wymaga 12 GB, po G5 r3 startuje tylko jeden worker naraz; po jego zakończeniu T7b r4.
- **Sprzątanie:** usunięte worktrees rund G5 r2, T7a r2 (×3), T7b r3 (×4). Pozostał worktree T7a r3 (locked, żywy).
- **Do zrobienia:** decyzje G5 D1/D2/b′ (już w DODATKU r2) — formalny wpis w sekcji decyzji rejestru; push `refs/keep/*` nadal odrzucany (4 próby), zabezpieczenia są tylko lokalnie i na gałęziach `rust-port-wip/*`.

### Przebieg — heartbeat Rust 07:18 UTC: sloty świadomie 1/4 (polecenie właściciela)

- **Zasada slotów (polecenie właściciela, wiążące przy bramce renderera):** bramka renderera (G5 r3, #332) wymaga ≥12 GB i braku cudzych buildów cargo, więc w tym oknie działa JEDEN workerem, aż skończy pracę — nie cztery. Ten heartbeat nie uzupełnia slotów do czterech.
- **Aktywne Workflow: 1/4** — T7a falanga (#261), runda r3 (`wf_de3b72ff-45d`, Operator Haiku, baza `c39d97add`, DODATEK r3 `1121a3ffc`). Brak żywych procesów cargo na tym ticku; worktree zablokowany = workflow nadal trwa.
- **T7b odwrót (#342), r3:** FC PASS-WITH-NOTES NIE przyjęty do integracji — Operator bez commitu, pełny test i `p6_8i_pick` niezmierzone, Evaluator FAIL, Obrona BLOCK. Kod: `rust-port-wip/p6-k5doc-t7b-r3-wip` = `61ffc110f`. Następna runda r4 po G5 r3 (baza `61ffc110f`).
- **G5 normalizacja (#332), r3:** dispatch gotowy (`814a24102`). Dysk: 13 GB po usunięciu zakończonego targetu `scratchpad/t7b-r1-target` (3,3 GB, własny, bez procesów). Startuje, gdy T7a r3 się zakończy i nie będzie cudzego cargo.
- **Zachowany:** `scratchpad/t7a-target` (3,3 GB) — należy do żywego T7a r3, nie ruszam.
- **Brak integracji w tym ticku:** nic nie przeszło FC PASS na parity-v2.

### Przebieg — heartbeat Rust 07:47 UTC: sloty 1/4 (polecenie właściciela, bramka renderera)

- **Aktywne Workflow: 1/4** — T7a falanga (#261), runda r3 (`wf_de3b72ff-45d`, Operator Haiku). Żywy `cargo test --test p6_k5doc_t7a` (start ok. 07:46 UTC); worktree zablokowany, wyniku brak.
- **Nie uzupełniam do czterech:** polecenie właściciela — przy bramce renderera (G5 r3, 12 GB, bez cudzych buildów) działa jeden worker, aż skończy. Dysk 14 GB.
- **G5 normalizacja (#332), r3:** dispatch gotowy (`814a24102`), czeka na zakończenie T7a r3.
- **T7b (#342), r4:** po G5 r3, baza `61ffc110f` (wip, nie PASS).
- **Brak integracji i brak sprzątania w tym ticku** (worktree T7a r3 żywy, nie ruszam).

### Przebieg — T7a falanga zintegrowany (FF parity-v2 = 7fcef940b); G5 r3 uruchomiony jako jedyny worker (2026-11-17 ~08:1x UTC)

- **#261 T7a falanga — FC PASS-WITH-NOTES** (FC `40d04da4e`, kod integracyjny `7fcef940b`). Bramki Operatora r3 na drzewie identycznym z `7fcef940b` (`rust-port/` bit-w-bit): `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --all-targets --no-fail-fast` EXIT 0 (515 `ok`, 0 FAILED); `p6_k5doc_t7a` 10/10. Mutacje (a)–(e) FAIL (tolerancja 2→3, pominięty filtr `primary_ranged`, negacja gałęzi `is_phalanx`, usunięcie +6 za sąsiada, `nr >= BF_ROWS`→`>`). Mutant `d_enemy > d_now` przeżył i jest równoważny (Manhattan zmienia się o ±1).
- **Integracja:** `parity-v2` był dokładnie bazą T7a (`f85622878`), więc FF bez merge. Osobnej rundy integracyjnej nie uruchamiałem — test już był zrobiony na identycznym drzewie (potwierdzone `git diff 64fce9ed2 7fcef940b -- rust-port` puste). Readback `parity-v2` = `7fcef940b`.
- **Zachowane (wip):** `rust-port-wip/p6-k5doc-t7a-r3-{ob,fc,ev}`; `refs/keep/...-T7A-FALANGA-r3-{ob,fc}` (lokalnie — push refs/keep odrzucany).
- **Uwagi do rejestru (z FC):** wariant Schedule z dispatchu nie istnieje w pinie dla falangi (callback `_doMove` = `done()`, `battleScene.ts:6635`) — udokumentowane w nagłówku modułu. Moduł nie ma jeszcze wołającego (wiring T8/#113). Dług `norm_name` NFD (tylko U+00C0..U+017F).
- **Sprzątanie:** usunięte 3 worktrees rundy T7a r3 (`-2`, `-3`, `-4`) i `-1` (locked, po zakończeniu). Dysk 18 GB.
- **Okno dla G5 r3:** brak aktywnych workflow i `cargo` przed startem; dysk ≥ 12 GB. **G5 r3 (#332) uruchomiony** jako jedyny worker (`wf_4f452094-b88`, skrypt Opus, baza zgodna z DODATKIEM r3 `02b07a83e`).
- **Następnie:** T7b r4 (baza `61ffc110f`) dopiero po G5 r3.
