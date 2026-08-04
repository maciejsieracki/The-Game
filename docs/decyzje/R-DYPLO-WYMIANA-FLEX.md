# R-DYPLO-WYMIANA-FLEX — stół / umowa wymiany: elastyczność UI

**Status:** CZEKA-NA-DECYZJĘ  
**Data:** 2026-08-04  
**Ekran:** Dyplomacja → Stół negocjacji · Umowa wymiany · panel PW

## Cytaty Macieja

> Jeżeli daję umowę wymiany surowców to system nie powinien oczekiwać to z wymianą coś za coś… Dodaj co najmniej jedną pozycję co dostaje. Nadal nie można edytować propozycji surowcowych… zwiększając/zmniejszając ilość.

> Dla dwóch różnych propozycji powinno być jedno przyjmij lub odrzuć, a nie dla każdego traktatu czy umowy, bo jest jeden balans dla wszystkiego. Poza tym nie można usunąć propozycji wcześniej zaproponowanej, ani z oni oferują, ani my oferujemy… Powinna być możliwość okienku usunięcia nie tylko odrzucenia.

## Sytuacja (dziś)

1. Tryb `trade` wymaga obu stron koszyka („Co dostaję”).
2. Brak stepperów ilości na już dodanej pozycji.
3. Przy multi-deal (np. Traktat handlowy + Umowa wymiany) panel PW pokazuje **jeden bilans**, ale pod spodem jest **Przyjmij/Odrzuć per umowa** (hint UI: „każda pozycja wymaga osobnego Przyjmij”).
4. Karty na stole (My oferujemy / Oni oferują) — brak **Usuń** (wycofanie ze stołu); tylko Odrzuć (odrzucenie dealu).

## Cel

Elastyczny stół: jednostronna wymiana, edycja ilości, **jedna decyzja Przyjmij/Odrzuć na cały pakiet**, oraz **Usuń** pozycję ze stołu.

---

## R-DYPLO-WYMIANA-ONEWAY-Q1 — czy Umowa wymiany może być jednostronna?

### A — Tak: wystarczy „Co oddaję” LUB „Co dostaję” (rekomendacja)

Walidacja: co najmniej jedna niepusta strona. Pusta „Co dostaję” = jednostronny dar / słodzik. Obie strony nadal dozwolone.

- **Za:** prezent / słodzik / punktacja bez wychodzenia do „Dar”.
- **Za:** zgodne z opisem Macieja.
- **Przeciw:** potrzebna jasna etykieta Dar vs Wymiana.
- **Przeciw:** bilans PW przy samym oddawaniu musi być czytelny.

### B — Wymóg obu stron; prezent tylko przez akcję Dar

- **Za:** czytelny podział.
- **Przeciw:** przeczy uwadze o „coś za coś”.

### C — Jednostronne tylko „oddaję”; „tylko dostaję” zabronione

- **Za:** prezent OK, bez darmowego żądania.
- **Przeciw:** mniej elastyczne przy multi-deal.

**Rekomendacja: A**

---

## R-DYPLO-WYMIANA-QTY-EDIT-Q1 — edycja ilości na już dodanej pozycji

### A — Stepper −/+ (i pole liczby) na wierszu w koszyku i przy edycji na stole (rekomendacja)

- **Za:** domyka „nieedytowalne”.
- **Przeciw:** więcej UI; pilnować max magazynu.

### B — Na stole „Edytuj” → koszyk (steppery tylko w koszyku)

- **Za:** mniej kontrolek na karcie.
- **Przeciw:** dodatkowy klik.

### C — Status quo (usuń + dodaj)

- **Przeciw:** to, na co narzekasz.

**Rekomendacja: A**

---

## R-DYPLO-STOL-ACCEPT-Q1 — jedno Przyjmij/Odrzuć na cały pakiet

### A — Jeden bilans PW → jeden pasek Przyjmij / Odrzuć dla całego stołu z tym partnerem (rekomendacja)

Karty traktatów/umów = pozycje pakietu; decyzja akceptacji **jedna**.

- **Za:** spójne z jednym bilansem PW.
- **Za:** koniec „Przyjmij przy każdej umowie”.
- **Przeciw:** nie przyjmiesz tylko części — najpierw Usuń niechcianą pozycję (Q4).
- **Przeciw:** większa zmiana UI/silnika negocjacji.

### B — Zostaw Przyjmij per umowa; bilans PW tylko informacyjny

- **Za:** można przyjąć część pakietu.
- **Przeciw:** przeczy „jeden balans = jedna decyzja”.

### C — Domyślnie pakiet (jak A) + opcjonalnie „Rozdziel”

- **Za:** moc + elastyczność.
- **Przeciw:** za dużo na teraz.

**Rekomendacja: A**

---

## R-DYPLO-STOL-USUN-Q1 — Usuń pozycję ze stołu (nie tylko Odrzuć)

### A — Przy każdej karcie (My / Oni): **Usuń** = wycofaj ze stołu bez zamykania całego dealu (rekomendacja)

- My → wycofujesz swoją propozycję.
- Oni → zdejmujesz tę pozycję z pakietu (reszta zostaje).

- **Za:** dokładnie „usunięcie nie tylko odrzucenie”.
- **Za:** spina z Q3=A (najpierw Usuń, potem jedno Przyjmij).
- **Przeciw:** skutek po stronie AI do zdefiniowania.
- **Przeciw:** więcej przycisków na karcie.

### B — Usuń tylko po stronie „My”; po stronie „Oni” tylko Odrzuć całość

- **Za:** prostsze.
- **Przeciw:** nie pokrywa w pełni opisu.

### C — Bez Usuń; tylko Odrzuć (status quo)

- **Przeciw:** to, na co narzekasz.

**Rekomendacja: A**

---

## Po decyzji

```
R-DYPLO-WYMIANA-ONEWAY-Q1 A|B|C
R-DYPLO-WYMIANA-QTY-EDIT-Q1 A|B|C
R-DYPLO-STOL-ACCEPT-Q1 A|B|C
R-DYPLO-STOL-USUN-Q1 A|B|C
```

→ commit → **`deploy`** osobno.

**Uwaga:** śmieci float `−9.400000000000006%` = **R-DYPLO-PW-PRZECINEK** (PR #87) — w kodzie, czeka **`deploy`**.
