# DISPATCH — `R-BITWA-KOLORY-GRACZ-PRZECIWNIK-Q1`

**Runda:** 1/5 · **Etap:** Operator
**MODEL:** `gpt-5.6-luna` · **REASONING:** `high`

**GOAL:** gracz jest zawsze niebieski i po lewej, przeciwnik zawsze czerwony i po
prawej; status atakujący/obrońca pozostaje wyłącznie informacją.

**Kryteria:** test ataku gracza, test obrony gracza, poprawne podpisy, kolory, wynik
bitwy i brak zmiany logiki walki. Operator ogranicza się do allowlisty i zapisuje diff
oraz testy w `01-operator.md`.

Bez integracji, deployu i pushu. Po PASS automatycznie kierować ten sam ID do
niezależnego Evaluatora Luna High.
