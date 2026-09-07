STATUS: DISPATCH (korekta proceduralna)
TEMAT: R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1
RUNDA: 2/5

Evaluator rundy 1 (Sonnet 5) trafnie zgłosił zarzut proceduralny: ten temat jest
jednoznacznie "wyjątkiem graficznym/wizualnym" (CSS + domyślny stan rozwinięcia
sekcji karty) w rozumieniu `docs/decyzje/R-PROC-AUTOBOT.md` §5a — dla sesji
Claude Code wymaga to Operatora I Evaluatora na modelu Opus 5, nie Sonnet 5.
Runda 1 (ten dispatch pierwotnie tego nie zaklasyfikował) faktycznie poszła na
Sonnet 5 dla obu ról — naruszenie §5a/§9 poz. 6b.

Orkiestrator POTWIERDZA: ten temat jest klasyfikowany jako GRAFICZNY/WIZUALNY.

WAŻNE — samo dzieło (kod, testy, żywe zrzuty) NIE jest kwestionowane co do
jakości; oba niezależne agenty rundy 1 (Evaluator, Obrona) potwierdziły zgodnie,
że to WYŁĄCZNIE zarzut proceduralny (zły model), nie defekt w diffie. Runda 2
NIE zaczyna pracy od zera — WERYFIKUJE istniejący commit `a391307f` (Operator
runda 1) na WŁAŚCIWYM modelu (Opus 5), z pełnym, niezależnym powtórzeniem dowodu
wizualnego (żywy zrzut Chromium), zgodnie z wymogiem §5a: "Evaluator na Opus 5
ma DODATKOWO obowiązek zweryfikować poprawkę realnym zrzutem ekranu".

ZADANIE RUNDY 2:
- Operator (Opus 5, effort Medium): przeczytaj `00-dispatch.md` i
  `01-operator-runda1.md` w całości. Zweryfikuj SAMODZIELNIE (nie zakładaj) że
  commit `a391307f` faktycznie realizuje GOAL z `00-dispatch.md` — kod, testy,
  zakres allowlisty. Jeśli znajdziesz cokolwiek do poprawy, popraw w TEJ samej
  gałęzi. Jeśli nie — potwierdź to jawnie z własnym dowodem (nie kopiuj cudzego
  raportu), włącznie z WŁASNYM uruchomieniem bramek i WŁASNYM żywym zrzutem
  Chromium (nie polegaj na zrzutach z rundy 1).
- Evaluator (Opus 5, effort High): zweryfikuj niezależnie od Operatora rundy 2,
  z WŁASNYM żywym zrzutem Chromium (wymóg §5a wprost). Standardowa checklista
  Evaluatora (R-PROC-AUTOBOT.md §16a).

Reszta dyspozycji (ALLOWLISTA, BINARNE KRYTERIUM SUKCESU, IZOLACJA, REGUŁA
PRZECIW SAMOOSZUKIWANIU) — bez zmian, patrz `00-dispatch.md`.

NASTĘPNY KROK: po PASS obu ról na Opus 5 → Final Control (Sonnet 5, effort High,
zgodnie z regułą bazową — Final Control NIE wymaga Opus 5, §5a wprost).
