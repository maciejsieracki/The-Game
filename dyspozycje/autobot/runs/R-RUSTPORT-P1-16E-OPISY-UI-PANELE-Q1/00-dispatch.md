STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16E-OPISY-UI-PANELE-Q1
GOAL: Domknąć z `dyspozycje/rust-port/p1/P1-16D-OPISY-CIVPEDIA-UI.md` §3 (tabela 17 paneli) dokładnie
10 pozycji nadal bez rozstrzygniętego statusu: panel #6 (obecnie FAIL) oraz panele #5, #7, #8, #9,
#11, #12, #15, #16, #17 (NIEROZSTRZYGNIĘTY) — status z dowodem na pinie edb8fb56.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Następca `R-RUSTPORT-P1-16D-OPISY-CIVPEDIA-UI-Q1`, który trafił w DECISION_REQUIRED po zbyt szerokim
zakresie (17 paneli + 169 haseł CivPedii naraz). Ten temat jest WĄSKI — tylko 10 paneli, reszta
(hasła CivPedii) czeka na osobną decyzję właściciela o zakresie (zadaną w czacie 2026-10-21) i NIE
jest częścią tego dispatchu. Przeczytaj OBOWIĄZKOWO:
`dyspozycje/rust-port/p1/P1-16D-OPISY-CIVPEDIA-UI.md` §3 (cała tabela — PASS/PASS-WITH-NOTES/
NIEAKTUALNY już zamknięte dla pozostałych 7 paneli, NIE dotykaj ich),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16D-OPISY-CIVPEDIA-UI-Q1/03-orchestrator-disposition.md`.

ZADANIE
Dla KAŻDEGO z 10 paneli:
- #6 (Praca — formuła `doBudynkow = round(praca×%Budynki)`): zlokalizuj w `cityPanel.ts` na pinie,
  porównaj formułę z kodem.
- #7 Pieniądz (`Skarbiec += Σ pieniadzNetto`), #8 Nauka (`nauka += plony + budynki + % handlu`),
  #9 Kultura (chip): zweryfikuj każdą formułę wprost w kodzie na pinie.
- #17 Zużycie: zweryfikuj mechanizm klamrowania wartości.
- #5, #11, #12, #15, #16: przeczytaj TREŚĆ panelu w kodzie (nie tylko potwierdź brak/obecność
  liczb) i porównaj z danymi/zachowaniem na pinie — każdy wniosek z konkretnym dowodem (plik:linia).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz statusu PASS/PASS-WITH-NOTES bez realnego porównania treści panelu z kodem/danymi — sam brak
trafienia `grep` na literał liczby NIE jest dowodem poprawności (to był błąd poprzedniego tematu,
zarzut 8 rundy 1).

BINARNE KRYTERIUM SUKCESU
Wszystkich 10 paneli ma status (NADAL ISTNIEJE / NAPRAWIONY / NIEROZSTRZYGNIĘTY) z konkretnym
dowodem — dopisane do `P1-16D-OPISY-CIVPEDIA-UI.md` §3 (aktualizacja istniejących wierszy, nie nowa
sekcja — numeracja paneli jest już tam ustalona).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16D-OPISY-CIVPEDIA-UI.md` (TYLKO wiersze paneli #5, #6,
#7, #8, #9, #11, #12, #15, #16, #17 w §3 — nie dotykaj §1, §2, §4, §5, innych wierszy §3),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16E-OPISY-UI-PANELE-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56.

IZOLACJA
Czysta praca odczytowa + edycja ograniczona do wskazanych wierszy jednego pliku.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich P1.16d. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
