STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16C-STOLICE-Q1
GOAL: Domknąć 5 pozycji NIEROZSTRZYGNIĘTYCH z `AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md`
(luzowanie 3 hex, menu 4/5/7, testy, chip „· miasto-państwo", oraz tzw. „decyzja ABC" — patrz
niżej) ze statusem z dowodem na pinie edb8fb56.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST — WAŻNA KOREKTA WZGLĘDEM STAREGO AUDYTU
Trzeci z 4 następców `R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1`. Przeczytaj OBOWIĄZKOWO:
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1/05-orchestrator-disposition.md`.
Stary audyt oznaczał jedną z 5 pozycji jako „decyzja ABC MAP-UX-CLUSTER-LABEL" — czyli rzekomo
wymagającą pytania do właściciela. **To jest NIEAKTUALNE.** Orkiestrator sprawdził
`dyspozycje/PYTANIA-OTWARTE.md`: pozycja `MAP-UX-CLUSTER-LABEL-Q1` ma status ZASTĄPIONE → paczka
`ABC-PACZKA-2026-08-06-KOLEJKA` [3/5], i ta paczka jest **ZDEPLOYOWANA FALA 296 `a37f7123`**
(odpowiedź B+C, display 27/27, badge 31/31) — linia 318 pliku. NIE zadawaj tego pytania ponownie.
Zamiast tego: zweryfikuj, czy zachowanie na pinie `edb8fb56` faktycznie zgadza się z wdrożoną
decyzją B+C (to jest fakt do sprawdzenia w kodzie, nie decyzja do podjęcia).
Plik docelowy `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` ma już §8-§12 — NIE nadpisuj, dopisz §13
na końcu.

ZADANIE
Dla KAŻDEJ z 5 pozycji z `AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md` §9.4 (luzowanie 3 hex,
menu 4/5/7, test 36 PASS, chip „· miasto-państwo", oraz zgodność z B+C FALA 296) sprawdź stan na
pinie edb8fb56 i nadaj status NADAL ISTNIEJE / NAPRAWIONY / NIEROZSTRZYGNIĘTY z dowodem (plik:linia,
`git show`/`git grep`).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz przepisywania starego werdyktu bez własnej weryfikacji na pinie. Zakaz traktowania
„B+C FALA 296" jako dowodu samego w sobie — sprawdź, czy KOD na pinie edb8fb56 faktycznie ma tę
separację/pakowanie, nie tylko czy decyzja istnieje w dokumencie.

BINARNE KRYTERIUM SUKCESU
Wszystkie 5 pozycji STOLICE mają status z dowodem w nowej sekcji §13. Zero pozycji bez statusu. Zero
nowych pytań ABC do właściciela.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` (tylko dopisanie §13 na końcu, zero
zmian w §1-§12), `dyspozycje/autobot/runs/R-RUSTPORT-P1-16C-STOLICE-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56 (git show/git grep, bez checkout/build/dev).

IZOLACJA
Czysta praca odczytowa + dopisanie do jednego pliku .md. Brak izolacji worktree potrzebnej.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich P1.16c. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
