STATUS: PASS-WITH-NOTES (obrona zarzutów FC/Evaluatora r5; wynik do ponownego Evaluator + Final Control)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1
GOAL: Odpowiedź na zarzuty 1–6 (Evaluator r5, werdykt PASS-WITH-NOTES) z dowodem; zakres r5 bez zmian.
ZMIANY/COMMIT:
- Baza: 3561864f2 (r5), przeniesiona (rebase) na origin/rust-port/parity-v2 = f97001337. Rebase czysty, 10 commitów.
- Commit poprawek obrony przed rebase: 99f73ad23. Po rebase (stan końcowy): d9c45f159.
- Pliki w allowliście (sprawdzone `git diff --name-only f97001337 HEAD`): diplomacy_multiwar*.rs, diplomacy_nap_trust.rs, mod.rs (bez zmian w tej obronie), tests/p6_dyplo_multiwar_*, runs/**, P6-DYPLOMACJA-MULTIWAR.md. Brak zmian w gra/, WERSJE.md, save_load.rs, Cargo.toml.
- Zmiany w tej obronie: (a) by_id porównuje jednostki UTF-16 (`encode_utf16().cmp`), jak JS; (b) peace.json: nowy zestaw `resTiny` (surowce pn 1, 1, 1e-17) i requiredPn=2, wygenerowane generatorem z web a61337844 (inne 4 pliki JSON: cmp identyczne); (c) intercivgate: assert `cases.len() == 23`; (d) P6-DYPLOMACJA-MULTIWAR.md: PC07 zabity, wynik mutacji 102/105.

ODPOWIEDZI NA ZARZUTY:
1. (niski, zakres) PRZYJMUJĘ bez zmiany kodu. Przeniesienie runWarWearinessTick, forced-peace AI↔AI, siege-war-gate, case'ów locks, REPIN 5 modułów i zapisu liczników epok (dług #8) do MULTIWAR-2 jest decyzją orkiestratora. Operator nie założył tematu MULTIWAR-2 ani wpisu w rejestrze.
2. (niski, notatka 27 vs 23) PRZYJMUJĘ. Notatka r4 (04-operator-r4.md, 03-final-control.md) podała 27 błędnie; plik ma 23 (`python3 json.load` = 23, cmp z regeneracją = identyczny). Test: `assert_eq!(cases.len(), 23)` zamiast `>= 20` (tests/p6_dyplo_multiwar_interciv.rs). Korekta liczby w tej odpowiedzi nadpisuje 27 z r4.
3. (niski, baseline NIE_ZMIERZONO) PRZYJMUJĘ i ZMIERZONO. Baseline = f97001337 (parity-v2 head), 295 binarek, każda osobno `cargo test --test <nazwa>`: passed 2213, failed 0, ignored 1; `--lib` 22/0; `--doc` 0/0. Razem 2235 passed / 0 failed / 1 ignored. Stan HEAD d9c45f159: 295+3 binarek, passed 2228, failed 0, ignored 1; lib 22/0; doc 0/0. Razem 2250 passed / 0 failed / 1 ignored. Różnica +15 = nowe testy tematu (gates 10, interciv 2, peace 3). Liczba 2185 z r1 była estymacją i jest nieaktualna. Uwaga: `p6_8i_pick` (istniejący test, nie ruszany) trwa ok. 400 s; przechodzi (5/0) w obu stanach.
4. (niski, rebase) PRZYJMUJĘ. Rebase wykonany na f97001337 (nie na 3a40d458e). Konfliktu nie było. Bramki po rebase na d9c45f159: `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0 (Finished, bez ostrzeżeń); testy jak w pkt 3.
5. (informacyjny, PC07) ODRZUCAM tezę „ekwiwalent dla wszystkich f64”, PRZYJMUJĘ wykrycie błędu w dowodzie r5. Kontrprzykład: pn = [1, 1, 1e-17], rem = 2. Suma `resTotal` = 2 (1e-17 ginie poniżej ulp), więc `>=` idzie w pętlę z `if rem <= 0 break` i daje [a, b] (web plan `diplomacy-ai-forced-peace.ts:150–154` przy pinie a61337844 robi to samo). Mutant `>` wchodzi w gałąź else i dodaje `c`. Dowód: wektor `resTiny` w peace.json, mutant PC07 na `src/domain/diplomacy_multiwar_peace.rs` daje FAILED w `plan_peace_payment_matches_web` i `plan_escalated_peace_payment_matches_web`; oryginał PASS; plik przywrócony (grep: 1 trafienie `res_total >= rem`). Dodatkowe mutanty EB–EK z Evaluatora nie były uruchamiane w tym przebiegu (NIE_ZMIERZONO); EI (`level + 0.0`) jako no-op przyjmuję bez zmiany.
6. (informacyjny, byId) PRZYJMUJĘ i NAPRAWIAM: `by_id` = `a.id.encode_utf16().cmp(b.id.encode_utf16())` (src/domain/diplomacy_multiwar_peace.rs). Brak wektora dla znaków poza BMP (NIE_ZMIERZONO). `fmt_prog` dla |n| >= 2^63 pozostaje poza domeną (udokumentowane w P6-DYPLOMACJA-MULTIWAR.md), bez zmiany.

MUTACJE: 105 mutantów (mutacje/mut.py). Wynik r5 = 101 zabitych; w r6 ponownie zmierzono tylko PC07 (zabity). Wynik 102/105 wynika z sumy tych dwóch pomiarów, NIE z pełnego ponownego przebiegu mut.py (NIE_ZMIERZONO w całości). Ekwiwalenty: MW01, PC12, PC17 (uzasadnienia bez zmian).
TESTY (HEAD d9c45f159): fmt EXIT=0; clippy EXIT=0; P6: gates 10/0, interciv 2/0, peace 3/0; razem 2250 passed / 0 failed / 1 ignored (patrz pkt 3).
BLOKADY: dług #8 (liczniki epok w save_load.rs) i przeniesiony zakres → MULTIWAR-2 (orkiestrator). Poza domeną: fmt_prog |n| >= 2^63.
RUNDY: 5/5 (ta odpowiedź nie zmienia rundy — obrona wewnątrz r5; wynik FC wymaga osobnej decyzji orkiestratora).
NASTĘPNY KROK: Evaluator + Final Control (Sonnet) na d9c45f159 + commit tego raportu; potem orkiestrator: merge na parity-v2, rejestr długu #8, założenie MULTIWAR-2.
DEPLOY/PUSH: NIE WYKONANO
