STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-WIRE-WAR-TURN-PLAN-Q1
GOAL: Errata r3 po FC r2 (FAIL, 2 drobne zarzuty) w planie P6-WIRE-WAR-TURN-PLAN.md — bez nowego pomiaru.
ZMIANY/COMMIT: baza `c2c8c0b89` (Operator r2, gałąź rust-port-wip/RPWIRE). Allowlista: `dyspozycje/rust-port/p6/P6-WIRE-WAR-TURN-PLAN.md` (3 miejsca) + `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-TURN-PLAN-Q1/01-operator-r3.md`. Bez zmian w `gra/**`, `rust-port/**`, bez `cargo`. Commit: SHA w wiadomości commita orkiestratora (`git log -1` na gałęzi tematu).
TESTY: Nie dotyczy (dokumentacja). `git diff --check` czysto. Sprawdzenie arytmetyki: 520+550+500+534+580+586+560+400 = 4 230; różnica do r1 (4 040) = +190 = W1 +70, W4 +84, W6 +36 (zgodnie z tabelą partii).

ODPOWIEDZI NA ZARZUTY FC r2:
(A) PRZYJMUJĘ. Sekcja 7, D7 opcja A (R): „w W6” zamieniono na „w W4” (wykonanie zakupu jako krok wykonania komend ownerLoop). Sprawdzono całą sekcję 7 (D1–D8) i sekcję 6 (W4/W6 już mówią o przeniesieniu zakupu do W4): w ABC nie ma innych odwołań do partii po przeniesieniu.
(B) PRZYJMUJĘ. Komentarz pod tabelą partii (§6) przepisany: r1 = 4 040, r2/r3 = 4 230, różnica +190 = W1 +70, W4 +84, W6 +36; suma z tabeli zweryfikowana. Nagłówek dokumentu przestawiony na „runda 3/5” z opisem errat.

NOTY (poza zakresem errat, nie zmieniano):
1. §3, wiersz „Dyplomacja AI (oferty miast, cooldown, blokady, zakup)” nadal wymienia `should_ai_purchase_unit` w `ai_diplomacy_turn.rs` (W6), podczas gdy §6 przenosi zakup do W4. Niespójność z r2, do usunięcia przy następnej rundzie (dispatch zakazywał zmian poza wskazanymi miejscami).
2. §5 pkt 4 i §8 nie zmieniane; W6 w §4 (ogólne odwołania do „W6” dla brame/blokad) jest zgodne z przypisaniem.
3. Pomiar i LOC bez zmian: `NIE_ZMIERZONO` tam, gdzie wskazano w dokumencie.

RUNDY: 3/5 (DODATEK 1 — errata; numeracja zgodna z dispatchem)
NASTĘPNY KROK: Evaluator r3 sprawdza tylko (A) i (B) oraz notę 1. Po PASS: FC r3 → integracja orkiestratora → ABC D1–D8 do właściciela → dispatche W1–W8.
DEPLOY/PUSH: NIE WYKONANO

## DOPISEK R3-OBRONA (odpowiedź na notę 1 Evaluatora r3 — PRZYJMUJĘ)
Baza: `b310e2ebc` (Operator r3). Nota 1 (§3, wiersz „Dyplomacja AI”, linia 88) poprawiona: usunięto `should_ai_purchase_unit` i odwołanie `41206` z wiersza W6 (`ai_diplomacy_turn.rs`), wiersz wskazuje teraz zakup jako przeniesiony do W4 (`ai_zakup_jednostki.rs`, §6, D7). Zakres: tylko linia 88 planu. Dowód: `grep -n 'should_ai_purchase_unit' dyspozycje/rust-port/p6/P6-WIRE-WAR-TURN-PLAN.md` — wystąpienia tylko w wierszu W4/§3 `ai_zakup_jednostki.rs` (tabela pierwsza, linia 36) i w §6 W4. Bez zmian w `gra/**`, `rust-port/**`, bez `cargo`. `git diff --check` czysto.
