# R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A — zgłoszenie konfliktu (C-054)

Zapis wymagany przez C-054. Opis konfliktu, bez proponowania rozwiązania.
Warstwa rejestru (`ABC-OCZEKUJE`) i ledger (`DECISION_REQUIRED`) — po stronie orkiestratora;
Operator nie ma tych plików w allowliście tematu.

Oba konflikty są **wewnątrz jednego dispatchu** (`00-dispatch.md`), nie między dispatchem
a samowolą wykonawcy. Oba są klasy (a) C-054 — inżynierskie, o zakres pliku/węzła; żaden
nie zmienia zachowania gry, więc turniej C-018 nie jest z tego tytułu wymagany.

## Konflikt 1 — który zapis dispatchu wiąże: allowlista czy kryterium końca 6

- **Co mówi dispatch (allowlista):** wolno ruszać „istniejące bramki `empire-food*`".
  `gra/tools/auto-wyzywienie-kosztarmii-kryterium-test.cjs` do tego wzorca nie pasuje.
- **Co mówi dispatch (kryterium końca 6):** „Zielone: `empire-food-test` i pozostałe bramki
  dotykające `empire-food.ts` […] Jeśli któraś miała zaszyte wartości sprzed zmiany,
  **zaktualizuj i wypisz dokładnie które i dlaczego**." Ta bramka dotyka `empire-food.ts`
  i miała zaszyte wartości sprzed zmiany.
- **Co mówi kod/testy (pomiar, runda 1 obrona):** bazowa wersja tego pliku uruchomiona na
  kodzie po naprawie daje **exit 1**, trzy FAIL-e: „Ateny obniżone z 5,0 do 4,0 (got 1)",
  „Milet obniżone z 0,5 do 0,0 (got 1)", „Nadwyżka finalna = 23 (got 31)". Bez aktualizacji
  kryterium 6 jest niespełnialne przy spełnionym GOAL.

## Konflikt 2 — do którego ID należy podpięcie `popCapByCityId` (własność B)

- **Co mówi dispatch (GOAL):** „Trzy własności, wszystkie wymagane", w tym (B) miasto na
  limicie ludności.
- **Co mówi dispatch (allowlista):** „Zakazane bezwzględnie: `gra/src/main.ts`, `gra/src/ui/**`
  (to jest węzeł B, osobny temat dispatchowany równolegle — wejście tam = naruszenie allowlisty)".
- **Co mówi węzeł B (`runs/R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B/00-dispatch.md`):** jego GOAL
  to czytelność stanu przełącznika wyżywienia, a allowlista obejmuje pliki UI + arkusz stylów
  + własną bramkę. Nie ma tam `main.ts` ani niczego o limicie ludności.
- **Co mówi kod:** `grep -rn 'popCapByCityId' gra/src --include=*.ts` trafia wyłącznie
  w `gra/src/game/empire-food.ts`. Mapa limitów (`cityPopulationCap(maAkwedukt, maSpichlerz,
  econParams)`) jest liczalna tylko po stronie wołającego, czyli w `main.ts`.
  Do czasu podpięcia `atPopCap` jest w grze zawsze puste.
