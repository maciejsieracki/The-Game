STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-13B-PROPOSAL-COVERAGE-Q1
GOAL: Uzupełnienie P1.13 — Evaluator tamtego tematu zgłosił (zarzut 7, nie w pełni zamknięty): pokrycie
`ProposalActionId` (15 wariantów, `diplomacy-proposals.ts:69-90`) przez konsumentów (switch na
`main.ts:1038` i `:1994` wg starych numeracji — ZWERYFIKOWAĆ NA PINIE `edb8fb56` w tej rundzie, nie
ufać starym numerom linii) nie zostało formalnie potwierdzone. Ustalić to teraz.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
W świeżym checkoucie `main` (edb8fb56): znaleźć definicję `ProposalActionId` (prawdopodobnie
`gra/src/game/diplomacy-proposals.ts`, 15 wariantów) i WSZYSTKIE miejsca w `gra/src/**`, które
konsumują ten typ (switch/case, if-else na wartości, mapowanie na etykiety UI). Dla KAŻDEGO z 15
wariantów ustalić: czy ma obsługę w KAŻDYM miejscu konsumpcji (nie tylko jednym) — jeśli któreś miejsce
pomija wariant (brak case, fallback na default bez jawnej obsługi), to jest luka istotna dla P2.5
(kontrakt komend frontend→Rust musi uwzględnić WSZYSTKIE 15 wariantów we wszystkich miejscach, inaczej
port będzie miał mniej funkcji niż web). Zapisać wynik jako nową sekcję na końcu
`dyspozycje/rust-port/p1/P1-13-COMMANDS-EVENTS.md` (dopisanie, nie nadpisywanie istniejącej treści).

ANTY-HALUCYNACYJNA REGUŁA
Każdy wariant i każde miejsce konsumpcji musi mieć ścieżkę+linię z `git grep`/`git show` na
`edb8fb56` wykonane w TEJ rundzie — stare numery z P1.13 (main.ts:1038/:1994) mogą być nieaktualne,
zweryfikować od nowa.

BINARNE KRYTERIUM SUKCESU
Nowa sekcja istnieje, wszystkie 15 wariantów `ProposalActionId` mają jawny status (OBSŁUŻONY WSZĘDZIE /
LUKA W <miejsce> z dowodem) we WSZYSTKICH znalezionych miejscach konsumpcji.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-13-COMMANDS-EVENTS.md` (tylko dopisanie nowej sekcji na
końcu, bez modyfikacji istniejącej treści — sprawdzić diffem przed zapisem),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-13B-PROPOSAL-COVERAGE-Q1/**`. Odczyt: `gra/src/**` read-only
(main edb8fb56). Zero zapisu w `gra/**`.

IZOLACJA
Świeży checkout/clone `main` (edb8fb56), praca wyłącznie odczytowa. Ten temat dotyka tego samego
pliku co zamknięty już P1.13 (PASS, brak aktywnego pisarza) — brak kolizji współbieżnej, ale sprawdzić
diff przed zapisem (jak w P1.16b).

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 350 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
