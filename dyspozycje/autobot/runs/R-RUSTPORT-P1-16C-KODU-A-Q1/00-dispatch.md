STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16C-KODU-A-Q1
GOAL: Domknąć 10 pozycji AUDYT-KODU nierozstrzygniętych przez P1.16b (#2, #4, #20, #31, #48, #49,
#53, #59, #60, #62), plus WERYFIKACJA-53 (6 pozycji, pokrywają się z AUDYT-KODU) — każda ze statusem
NADAL ISTNIEJE / NAPRAWIONY / NIEROZSTRZYGNIĘTY z dowodem (plik+linia na pinie edb8fb56, nie z
pamięci audytu).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Poprzedni temat `R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1` wyczerpał 5 rund (LIMIT-5-EXCEEDED) próbując
domknąć WSZYSTKIE stare pliki AUDYT-*/WERYFIKACJA-* naraz — za szeroki zakres na jeden temat. Ten
temat to PIERWSZY z 4 następców, węższy zakres. Wyniki tamtego tematu (w tym które dokładnie pozycje
zostały już ODDALONE/potwierdzone) są w:
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1/04-final-control.md` i
`05-orchestrator-disposition.md` — przeczytaj OBOWIĄZKOWO przed startem.
Plik docelowy `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` ma już §8-§10 z poprzedniego tematu —
NIE nadpisuj, dopisz nową sekcję §11 na końcu pliku.

ZADANIE
Dla KAŻDEJ z 10 pozycji AUDYT-KODU (#2, #4, #20, #31, #48, #49, #53, #59, #60, #62) i 6 pozycji
WERYFIKACJA-53 (sprawdź w pliku źródłowym `dyspozycje/WERYFIKACJA-53-...md`, jeśli pokrywają się z
AUDYT-KODU, oznacz to wprost zamiast liczyć podwójnie): sprawdź stan na pinie `edb8fb56` (nie z
pamięci audytu, nie z deklaracji w starym dokumencie) i nadaj status NADAL ISTNIEJE / NAPRAWIONY /
NIEROZSTRZYGNIĘTY z konkretnym dowodem (plik:linia, `git show`/`git grep` na edb8fb56).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz przepisywania starego werdyktu audytu bez własnej weryfikacji na pinie. Jeśli dowód jest słaby
(np. jedna wartość konfiguracyjna zamiast przeczytania całej funkcji konsumującej), status to
NIEROZSTRZYGNIĘTY z jawnym opisem czego brakuje — nie zgadywanie w żadną stronę.

BINARNE KRYTERIUM SUKCESU
Wszystkie 10 pozycji AUDYT-KODU + 6 WERYFIKACJA-53 (z jawnym naznaczeniem pokrywających się) mają
status z dowodem w nowej sekcji §11 pliku `P1-16-EDGE-CASES.md`. Zero pozycji bez statusu.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` (tylko dopisanie §11 na końcu, zero
zmian w §1-§10), `dyspozycje/autobot/runs/R-RUSTPORT-P1-16C-KODU-A-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56 (git show/git grep, bez checkout/build/dev).

IZOLACJA
Czysta praca odczytowa + dopisanie do jednego pliku .md. Brak izolacji worktree potrzebnej.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje konkretny defekt (brakujący dowód / błędny status / pominięta pozycja), Operator
poprawia w tej samej rundzie (Obrona) albo w rundzie N+1. Po 5 rundach: LIMIT-5-EXCEEDED → podział
dalej albo eskalacja do właściciela.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (R-PROC-AUTOBOT.md §11). Destylat: ścieżki+linie zamiast surowego diffu.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
