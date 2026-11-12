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
