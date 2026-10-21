STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16C-PARYTET-AI-Q1
GOAL: Domknąć 8 pozycji PARYTET-AI nierozstrzygniętych przez P1.16b (#1-#6, #8, L2), w tym #9
(obecność w źródle wg `AUDYT-PARYTET-AI-2026-07-24.md` l.24 — czy produkcja jednostek pobiera
surowiec z puli wspólnej, czy tylko lokalnie) — status z dowodem na pinie edb8fb56.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Drugi z 4 następców `R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1` (LIMIT-5-EXCEEDED, zbyt szeroki
zakres). Przeczytaj OBOWIĄZKOWO:
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1/04-final-control.md`,
`05-orchestrator-disposition.md` (sekcja o zarzucie 4/PARYTET-AI #9 — Final Control uznał dowód
Operatora `koszt_surowce=0` w `units.json` za za słaby; trzeba doczytać ciało `buildingStockCost()`,
nie tylko plik danych).
Plik docelowy `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` ma już §8-§11 — NIE nadpisuj, dopisz §12
na końcu. `P1.16c-KODU-A` (poprzednik w tej sekwencji) zamknięty PASS, patrz LEDGER.

ZADANIE
Dla KAŻDEJ z 8 pozycji PARYTET-AI (#1-#6, #8, L2 z `AUDYT-PARYTET-AI-2026-07-24.md`) sprawdź stan na
pinie edb8fb56 i nadaj status NADAL ISTNIEJE / NAPRAWIONY / NIEROZSTRZYGNIĘTY z dowodem. Dla #9:
przeczytaj PEŁNE ciało funkcji odpowiedzialnej za pobór surowca przy produkcji jednostek (szukaj
`buildingStockCost`, konsumentów kolejki produkcji jednostek, puli surowców miasta/imperium) zamiast
polegać wyłącznie na wartości `koszt_surowce` w pliku danych `units.json`.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz przepisywania starego werdyktu audytu bez własnej weryfikacji na pinie. Jedna wartość w pliku
konfiguracyjnym (np. `units.json`) NIE jest wystarczającym dowodem dla twierdzenia o zachowaniu w
runtime — trzeba przeczytać funkcję konsumującą.

BINARNE KRYTERIUM SUKCESU
Wszystkie 8 pozycji PARYTET-AI mają status z dowodem w nowej sekcji §12. #9 ma dowód z przeczytania
funkcji konsumującej (nie tylko z pliku danych). Zero pozycji bez statusu.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` (tylko dopisanie §12 na końcu, zero
zmian w §1-§11), `dyspozycje/autobot/runs/R-RUSTPORT-P1-16C-PARYTET-AI-Q1/**`. Odczyt:
`dyspozycje/**` read-only, `gra/**` read-only na pinie edb8fb56 (git show/git grep, bez
checkout/build/dev).

IZOLACJA
Czysta praca odczytowa + dopisanie do jednego pliku .md. Brak izolacji worktree potrzebnej.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w P1.16c-KODU-A. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
