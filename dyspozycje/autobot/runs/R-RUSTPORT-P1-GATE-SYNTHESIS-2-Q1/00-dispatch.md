STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-GATE-SYNTHESIS-2-Q1
GOAL: Druga, aktualna synteza bramki fazy P1 — formalnie potwierdzić (albo obalić z dowodem), czy
WSZYSTKIE tematy P1.1–P1.18 (łącznie z wariantami b/c/d/e/f) mają status PASS w `LEDGER.md`, i jeśli
tak, zarekomendować otwarcie P2.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Poprzednia synteza (`R-RUSTPORT-P1-GATE-SYNTHESIS-Q1`, plik `P1-GATE-SYNTHESIS.md`) jest STARA —
wykonana zanim P1.8, P1.9, P1.13b, P1.14b, P1.16b (i cały jego łańcuch następców P1.16c/d/e/f) się
zamknęły. NIE przepisuj z niej wniosków — przeprowadź pełną weryfikację OD NOWA przeciwko
aktualnemu `LEDGER.md`. Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md`
§4 (pełna lista P1.1–P1.18), `dyspozycje/rust-port/LEDGER.md` (CAŁY plik, w tej rundzie, nie z
pamięci), `dyspozycje/rust-port/GOAL-RUST-PORT-20261020.md`.

ZADANIE
1. Wypisz pełną listę tematów P1.1–P1.18 z planu (łącznie z podwariantami, np. P1.1b, P1.17b/c,
   P1.16b/c/d/e/f).
2. Dla KAŻDEGO z nich: znajdź jego ostatni wpis w `LEDGER.md` i jego status (PASS / PASS-WITH-NOTES
   / inny). Jeśli temat ma następcę (np. P1.16b→P1.16c→...), status gałęzi = status NAJNOWSZEGO
   ogniwa, nie pierwszego.
3. Policz: ile tematów ma PASS, ile nie, które konkretnie.
4. Jeśli WSZYSTKIE mają PASS: zarekomenduj formalne otwarcie bramki P1 i start P2, z jedną tabelą
   zbiorczą (temat → status → plik wyniku).
5. Jeśli COKOLWIEK nie ma PASS: wypisz dokładnie co i czemu, bramka NIE jest otwarta.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz przyjmowania statusu z nazwy tematu lub z pamięci — każdy wiersz tabeli musi cytować
konkretny wpis `LEDGER.md` (data + status). Zakaz kopiowania wniosku poprzedniej syntezy bez
własnej weryfikacji każdego punktu.

BINARNE KRYTERIUM SUKCESU
Tabela ma wiersz dla KAŻDEGO tematu z listy planu §4, z cytatem z LEDGER. Wniosek (bramka otwarta /
zamknięta) wynika wprost z tabeli, nie z deklaracji.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-GATE-SYNTHESIS-2.md` (NOWY plik — NIE nadpisuj starego
`P1-GATE-SYNTHESIS.md`, on zostaje jako historyczny snapshot),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-GATE-SYNTHESIS-2-Q1/**`. Odczyt: `dyspozycje/**` read-only.

IZOLACJA
Czysta praca odczytowa.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje konkretny temat pominięty/błędnie zaklasyfikowany, Operator poprawia tą samą
rundą albo kolejną. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy — pełna tabela, może być dłuższy).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
