# R-DYPLO-WYMIANA-FLEX — stół / umowa wymiany: elastyczność UI

**Status:** 🟢 WDROŻONE w kodzie (nie deploy)  
**Data:** 2026-08-04  
**Ekran:** Dyplomacja → Stół negocjacji · Umowa wymiany · panel PW

## ECHO decyzji Macieja (2026-08-04)

| ID | Litera | Znaczenie |
|----|--------|-----------|
| `R-DYPLO-WYMIANA-ONEWAY-Q1` | **A** | Wystarczy „Co oddaję” **lub** „Co dostaję” (≥1 niepusta strona) |
| `R-DYPLO-WYMIANA-QTY-EDIT-Q1` | **A+B** | Steppery −/+ w koszyku **oraz** na stole przycisk **Edytuj** → otwiera koszyk (bez stepperów bezpośrednio na karcie) |
| `R-DYPLO-STOL-ACCEPT-Q1` | **A** | Jeden bilans PW → jeden pasek Przyjmij / Odrzuć dla całego stołu |
| `R-DYPLO-STOL-USUN-Q1` | **A** | Przy każdej karcie (My / Oni): **Usuń** = wycofaj ze stołu |

## Cytaty Macieja

> Jeżeli daję umowę wymiany surowców to system nie powinien oczekiwać to z wymianą coś za coś… Dodaj co najmniej jedną pozycję co dostaje. Nadal nie można edytować propozycji surowcowych… zwiększając/zmniejszając ilość.

> Dla dwóch różnych propozycji powinno być jedno przyjmij lub odrzuć, a nie dla każdego traktatu czy umowy, bo jest jeden balans dla wszystkiego. Poza tym nie można usunąć propozycji wcześniej zaproponowanej, ani z oni oferują, ani my oferujemy… Powinna być możliwość okienku usunięcia nie tylko odrzucenia.

## Sytuacja (przed wdrożeniem)

1. Tryb `trade` wymaga obu stron koszyka („Co dostaję”).
2. Brak stepperów ilości na już dodanej pozycji.
3. Przy multi-deal panel PW pokazuje **jeden bilans**, ale **Przyjmij/Odrzuć per umowa**.
4. Karty na stole — brak **Usuń** (tylko Odrzuć).

---

## R-DYPLO-WYMIANA-ONEWAY-Q1 = A

Walidacja: co najmniej jedna niepusta strona. Pusta „Co dostaję” = jednostronny dar / słodzik. Obie strony nadal dozwolone.

## R-DYPLO-WYMIANA-QTY-EDIT-Q1 = A+B

- W koszyku: stepper −/+ (+ pole liczby) na wierszu pozycji (pilnować max magazynu).
- Na stole: przycisk **Edytuj** → otwiera koszyk tej umowy (steppery tylko w koszyku, nie na karcie).

## R-DYPLO-STOL-ACCEPT-Q1 = A

Karty traktatów/umów = pozycje pakietu; decyzja akceptacji **jedna** (Przyjmij / Odrzuć na dole przy bilansie PW).

## R-DYPLO-STOL-USUN-Q1 = A

- My → wycofujesz swoją propozycję ze stołu.
- Oni → zdejmujesz tę pozycję z pakietu (reszta zostaje).
- Nie zamyka całego dealu (≠ Odrzuć).

---

## AC wdrożenia

1. `trade` / Umowa wymiany: submit OK gdy `give` XOR `get` niepuste (albo obie).
2. Steppery qty w `diplomacyTradeBasket` na istniejących wierszach.
3. Karta na stole: **Edytuj** → re-open koszyka; **Usuń** → drop z pending bez reject całego pakietu.
4. UI stołu: jeden pasek Przyjmij/Odrzuć; brak Przyjmij per karta.
5. Testy: one-way trade walidacja; package accept; remove from table.

**Uwaga:** float PW `−9.400000000000006%` = **R-DYPLO-PW-PRZECINEK** (PR #87) — osobny fix, czeka deploy.
