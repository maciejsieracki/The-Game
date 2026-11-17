STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-WIRING (runda 1, obrona Operatora)
GOAL: odpowiedź na 8 zarzutów Final Control/Evaluatora do operatorskiej rundy 1 (commit 932536c37)
ZMIANY/COMMIT: rust-port/engine/src/domain/playable.rs (migawka economy w advance_turn, przywrócenie przy błędzie fazy Diplomacy i przy błędzie kompletności kolejki); commit: SHA podany w odpowiedzi orkiestratora (baza = 932536c37, bez push)
TESTY: NIE_ZMIERZONO w tej rundzie. Powód: df / = 4,3 GB (reguła bramek: >= 8 GB), więc cargo check/clippy/test nie uruchomiono. Zmiana nie została skompilowana. Użyte w niej typy (PlayableState, PlayableReplaceEconomy) już derivują Clone (playable.rs:524-526, 587). Test cargo fmt nie powtórzono.
BLOKADY: INFRA (disk), zarzuty 2, 3, 4, 7 nie zamknięte w tej rundzie (patrz tabela)
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: uruchomić bramki po zwolnieniu dysku do >= 8 GB; osobny temat na wektory D3 (#299), przepisanie wektorów wiringu i generatora na wykonanie tekstu pinu, decyzja orkiestratora dla zarzutów 5 i 7
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

| # | Zarzut | Odpowiedź | Dowód / stan |
|---|---|---|---|
| 1 | INFRA: brak clippy -D warnings, cargo test --test p6_r7k7c i --all-targets | PRZYJMUJĘ (zaległość zostaje otwarta) | Nie uruchomiono: df / 4,3 GB < 8 GB. Poprzednia deklaracja "zielone" nie była dowodem; wynik w tej rundzie to NIE_ZMIERZONO. |
| 2 | Brak wektorów D3 (#299), dispatch wymaga >= 150 dla apply i D3 | PRZYJMUJĘ (nie zrobione) | Brak pliku wektorów D3 w worktree. Zostaje do zrobienia w osobnym temacie #299. |
| 3 | Test wiringu: wartości policzone ręcznie, jeden scenariusz, brak Work/handlu cyklicznego | PRZYJMUJĘ (nie zrobione) | tests/p6_r7k7c.rs:258-285 nadal ma ręcznie wpisane (50/60, 90/20, 90/20). Brak przypadku Work/praca i handlu cyklicznego. |
| 4 | Wektory apply częściowo kołowe; pin woła add/setOwnerPracaPool wielokrotnie w kroku (main.ts:24015-24016) | PRZYJMUJĘ (nie zrobione) | Generator zakłada jedną agregowaną operację na właściciela. Wymaga przepisania generatora i wektorów. Nie zmieniano w tej rundzie. |
| 5 | Rozjazd parytetu Ledger D3 vs podłoga puli Pracy (pula 0: -5, potem +10; pin 10, Rust 5) | ODRZUCAM jako błąd w tej rundzie, PRZYJMUJĘ jako DECISION_REQUIRED | Plik turn_war_dipl_steps.rs jest poza allowlistą tego tematu. Nie zmieniano go. Zgłoszenie do orkiestratora jako DECISION_REQUIRED (lub osobny temat). Wpis do REJESTR-RUST po stronie orkiestratora. |
| 6 | Rollback: migawka nie obejmuje economy; ścieżka phases.len() != PHASE_COUNT zostawia zmienione skarbce | PRZYJMUJĘ, POPRAWIONE | playable.rs advance_turn: dodano `economy_before = self.state.economy.clone()` i przywracanie w obu ścieżkach błędu (błąd fazy Diplomacy oraz phases.len() != PHASE_COUNT). Typ ma Clone. Kompilacja nieuruchomiona (INFRA). |
| 7 | Mutant (c) uznany za równoważny na podstawie grepa; dispatch wymaga FAIL | PRZYJMUJĘ jako otwarte, nie rozstrzygnięte | Nie powtórzono dowodu mutacji (INFRA). Decyzja równoważności nie jest moją: orkiestrator musi ją wpisać do REJESTR-RUST po ponownym sprawdzeniu mutanta na wolnym dysku. |
| 8 | Uwaga poza zakresem: apply rozpoznaje tylko pierwszego is_human, pin ma wielu ludzi (#282) | ODRZUCAM jako zakres tego tematu | Poza allowlistą i poza kryteriami końca tego dispatchu. Zadanie #282 istnieje w liście; pozostaje tam. |

## Uwagi
- Zmiana w playable.rs to jedyna zmiana w tej rundzie. Nie tknięto gra/, renderer/, Cargo.lock ani origin/main.
- Nie zmieniano wektorów apply.json ani generatora apply_gen.mjs.
- Oświadczenie o wykonanych bramkach w poprzedniej rundzie (01-operator-r1.md) pozostaje bez dowodu.
