# P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1 — Obrona Operatora (po rundzie 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1
MODEL+EFFORT: Sonnet 5, effort medium
GOAL: `gra/tools/auto-battle-power.py` liczy to samo, co runtime TS
`gra/src/game/auto-battle-power.ts` na tym samym zestawie parametrów, a rozjazd
nie może się powtórzyć po cichu.

## OBRONA

**Zarzut 1 (`auto-battle-py-vs-ts-parytet-test.cjs:110-117`, tolerancja `:96`) → PRZYJMUJĘ.**

Zarzut odtworzony u mnie co do liczby, nie przyjęty na słowo. Baza `019fb0a2`,
mutacja `.py:153` → `floor_pct = (L_MIN * 1.2) / max(1.0, ratio)`: bramka
**126 pass, 0 fail** — dokładnie jak twierdzi Evaluator. Mechanizm zgodny z opisem:
od r ≳ 1866 wygrywa podłoga, procent NA JEDNOSTKĘ spada do 1,2e-6, a tolerancja
bezwzględna ±0,0005 przepuszcza tam dowolną liczbę z `[0; 0,0005]`. Asercje
parytetu były więc bezwarunkowo prawdziwe w tym samym zakresie, którego dotyczy
naprawa — obowiązkowe punkty skrajne z kryterium 2 nic nie mierzyły.

### Poprawka (`auto-battle-py-vs-ts-parytet-test.cjs`, 21 linii dodanych, 2 zmienione)

1. Wskazana przez Evaluatora, `:119-131`: parytet mierzony także na **SUMIE**
   składu zwycięzcy — `tsSum` vs `pySum` (suma jest rzędu `L_MIN`, więc ±0,0005
   coś tam faktycznie ogranicza). Dotąd suma `.py` była tylko jednostronnie
   sprawdzana wobec `L_MIN`.
2. Domknięcie luki także na jednostce: `zgodne(a, b)` = tolerancja bezwzględna
   **i** względna `REL_TOL = 1e-9`. Obie strony liczą tę samą arytmetykę, więc
   nierówność ma być co do bitu, niezależnie od rzędu wielkości.

### Dowód, że poprawka domyka lukę

Ta sama mutacja Evaluatora `(L_MIN*1.2)/ratio` po poprawce: **134 pass, 16 fail** —
m.in. `suma strat zwyciezcy TS vs py r=41821: TS=0.05 py=0.06` oraz
`lossDefPct r=41821: TS=0.0000011955716027832907 py=0.0000014346859233399487`.
Mutacje z rundy 1 nadal czerwone i mocniej: podłoga na jednostce → **108/42**
(było 100/26), podłoga przed zaokrągleniem → **126/24** (było 118/8).
Po przywróceniu `.py`: **150 pass, 0 fail**, `git diff` na `.py` pusty.

Ryzyko fałszywego czerwonego z `REL_TOL` sprawdzone osobno: sonda 486 pomiarów
(podstawy 1 / 1,3 / 2 / 7,5 / 13 / 100 × r od 1,001 do 1e6, oba warianty
zwycięzcy, remisy i zera) → **maxAbs = 0, maxRel = 0, 0 rozjazdów werdyktu**.

## ZMIANY/COMMIT

Jeden plik z allowlisty: `gra/tools/auto-battle-py-vs-ts-parytet-test.cjs`
(+ ten raport). `gra/src/game/auto-battle-power.ts` i `gra/data/auto-battle-params.json`
**nietknięte** — md5 `29848f09…` i `d37d3113…` identyczne z bazą. `.py` bez zmian
w tej obronie. Żaden `gra/data/*` nie ruszony → brak śladu `npm run build` (C-001).

## TESTY

parytet **150/0** · `tsc --noEmit` exit 0 · auto-battle-power 14/0 ·
monotoniczność 43/0 · logic 213/213 · tech-tree 19/19 · research ALL GREEN (33/33) ·
unit-replace 13/13 · combat ALL GREEN (6/6).
Kryterium 1 z `.py` bez zmian: `0.3873 / 0.3656 / 0.3372 / 0.3045 / 0.2650 / 0.2300`.

## BLOKADY

Brak.

RUNDY: 1/5 (obrona nie zwiększa licznika)
NASTĘPNY KROK: Final Control (osobne wywołanie)
DEPLOY/PUSH: NIE WYKONANO
