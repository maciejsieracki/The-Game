# R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 — Obrona (Operator), runda 1

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1
ROLA: Operator (obrona) — druga faza rundy 1 · MODEL+EFFORT: Opus 5, effort high
GOAL: G1–G15 skali Szczęścia; wszystkie liczby właściciela nietknięte.
IZOLACJA: `/home/user/wt-szczescie-skala`, gałąź `autobot/R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`,
baza `f570a91a` potwierdzona `git merge-base --is-ancestor` PRZED pracą.
**Zero zmian liczb właściciela.** `git diff HEAD --stat gra/data/` puste — nie tknąłem danych.

## OBRONA — sześć zarzutów

**1 → PRZYJMUJĘ.** Dowód: `git show HEAD:gra/tools/…-skali-test.cjs` — 2i(3) sprawdzało tylko
`w.split(',').length === 3`, a 2i(7) porównywało `computeHappinessBreakdown` z
`evaluateOrderFromBreakdown`, która ją woła (`society-breakdown.ts:983`). Mutacja Evaluatora
(`era` → `1`) dawała 430/430.
**Poprawione:** 2i(3) sprawdza teraz sam trzeci argument (musi być nośnikiem epoki `era`/`epoch`
z `cfg.getEpoch`, nie literałem); 2i(7) przemianowane na „spójność wewnętrzna silnika"; dodany
**2i(8) — parytet FUNKCJONALNY**: bramka buduje `cityPanel.ts` (esbuild + jsdom) i URUCHAMIA go
przez nowy szew `__cityPanelOrderStateLocalForTest`, porównując linia po linii z niezależnie
złożonym wejściem silnika (5 scenariuszy × epoki/cuda/wojna). Dowód nietautologiczności — trzy
mutacje w `cityPanel.ts`, każda cofnięta, `diff -q` czysty po każdej:
`era → 1` → **6 FAIL**; usunięcie `haCuda` → **19 FAIL**; `atWar → false` → **15 FAIL**.

**2 → PRZYJMUJĘ.** Dowód: `cityPanel.ts:3096` niosło `atWar: false` i nie podawało `haCuda`,
gdy silnik podaje oba (`main.ts:29154`, `:29167`).
**Poprawione:** `computeOrderStateLocal` odczytuje obie pozycje z linii rozpiski, które silnik
już wystawił przez `cfg.getOrderState` — ten sam hak, z którego brany jest `citizenUpkeep`
(`cityPanel.ts:3084`). Bez haka (sandbox/playtest) → `0`/`false`, czyli stare zachowanie.
`main.ts` NIE tknięty: `git diff f570a91a -- gra/src/main.ts` puste. Pomiar: w scenariuszu
epoka 3 / 6 cudów / wojna panel i silnik dają teraz identyczne `szLines`, `szPct` **i `porPct`**
(wcześniej rozjazd 41 pkt) — sprawdza to 2i(8).

**3 → PRZYJMUJĘ.** `gra/tools/citizen-resource-upkeep-test.cjs` był czerwony i nieujawniony.
Cytowane `:231`/`:236` są dziś **ZIELONE** (mnożnik usunięty, linia niesie deltę 1:1). Zostają
DWIE inne: `:208`/`:209` `eq(CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE, 1)` / `…_MISSING, -1` —
asercje na **uchyloną liczbę właściciela** (±1 z 2026-08-10, zastąpiona ±2 przez G8).
**Nie poprawiam: plik jest poza allowlistą** (ratyfikacja wymienia tylko `…-upkeep.json`).
Nie wolno mi też cofnąć ±2 — to liczba właściciela. → poz. 1 listy do decyzji.

**4 → PRZYJMUJĘ.** Było 32/10. Dziś `society-breakdown-test` **53 OK / 0 FAIL** (asercji
42 → 53, wzrost). Naprawione w commicie `5ba58273` po ratyfikacji allowlisty — **nie jestem
autorem tej poprawki**, zweryfikowałem ją własnym uruchomieniem.

**5 → PRZYJMUJĘ.** Było 212/213. Dziś `logic-test` **213/213**, asercja `:1370` przepisana na
skalę proporcjonalną (`5ba58273`) — jak wyżej, weryfikacja, nie autorstwo.

**6 → PRZYJMUJĘ co do skutku, ODRZUCAM co do sformułowania „panel ≠ silnik".** Dowód:
wiersz rozpiski niósł wartość silnika bajt w bajt — obie strony liczy
`proporcjonalneSzczescie` (`cityPanel.ts:2971` i `society-breakdown.ts:652`), więc parytet
panel↔silnik był zachowany. Rozjazd był **wewnątrz panelu**: karta Religii pokazywała −7,7,
a wiersz rozpiski renderował surowe `l.value` (`cityPanel.ts:3356`), czyli −7,666666666666666.
**Poprawione prezentacyjnie, nie w modelu:** jeden helper `szPktDisplay` + `szLinesDoWyswietlenia`
na obu ścieżkach renderu. `netto`/`szPct` zostają dokładne — zaokrąglenie w modelu byłoby
strojeniem liczby właściciela. Nowa sekcja 2i(6b), 6 asercji; mutacja (powrót do surowego
renderu) → **2 FAIL**.

## ZMIANY/COMMIT

Dwa pliki, oba z allowlisty: `gra/src/ui/cityPanel.ts`, `gra/tools/szczescie-przebudowa-skali-test.cjs`.
`git diff --check` czysty. `git add` po jawnych ścieżkach. SHA raportu w commicie tego pliku.

## TESTY (komplet po poprawkach)

`tsc --noEmit` **0 błędów**. Nowa bramka **517 OK / 0 FAIL** (było 430, potem 446).
logic **213/213**, tech-tree 19/19, research 33/33, unit-replace 13/13, combat OK.
society-breakdown **53/0**, building-happiness **14/0**, wealth **36/0**, szczescie-zamoznosc
**88/0**, szczescie-skala-normalizacja **141/0**, r-wzrost-…-ceramika **54/0**,
war-happiness-parity **21/0**, culture-religion 65/65, happiness-breakdown 38/38,
porzadek-panel-czytelnosc 81/81, empire-religia-panel 15/15.
**Czerwona jedna: `citizen-resource-upkeep-test` 107/2** — zarzut 3, plik poza allowlistą.

## BLOKADY — dlaczego DECISION_REQUIRED

1. **Allowlista vs `gra/tools/citizen-resource-upkeep-test.cjs`** (zarzut 3). Dwie asercje
   `:208`/`:209` pilnują uchylonego ±1. Proszę o rozszerzenie allowlisty **wyłącznie o te dwie
   asercje** (przepisanie na ±2, właściwość „kanon wartości specyfikacji" zachowana).
2. **Kolizja izolacji, do wiadomości orkiestratora.** Między 21:18 a 21:27 UTC w TYM worktree
   pisał równolegle drugi wątek (runda 2 po ratyfikacji, commit `5ba58273`) — obserwowane
   `git status`/mtime w trakcie mojej pracy. Nie doszło do nadpisania (rozłączne pliki:
   on bramki + dane, ja `cityPanel.ts`), ale §2b/C-059 zakłada jednego pisarza na worktree.
3. **Runda 3 (`szczescie_max_pop_wspolczynnik` = 0,04) NIE wykonana** — dane nadal
   0,038/0,048/0,058. To osobny, ratyfikowany zakres, poza obroną rundy 1.

RUNDY: 1/5 (obrona — druga faza tej samej rundy, nie nowa)
NASTĘPNY KROK: Final Control (to samo ID, ta sama gałąź); równolegle decyzja orkiestratora
o poz. 1 i 3 z BLOKAD.
DEPLOY/PUSH: NIE WYKONANO
