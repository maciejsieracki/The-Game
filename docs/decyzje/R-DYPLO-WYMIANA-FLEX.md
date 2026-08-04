# R-DYPLO-WYMIANA-FLEX — umowa wymiany: jednostronna + edycja ilości

**Status:** CZEKA-NA-DECYZJĘ  
**Data:** 2026-08-04  
**Ekran:** Dyplomacja → Umowa wymiany surowców / koszyk / stół propozycji

## Cytat Macieja

> Jeżeli daję umowę wymiany surowców to system nie powinien oczekiwać to z wymianą coś za coś, bo przecież mogę coś dać, żeby podbić swoją punktację chcąc coś innego albo na przykład jakąś umowę lub po prostu chcę dać prezent. A tutaj jest informacja dodaj co najmniej jedną pozycję co dostaje. Nadal nie można edytować propozycji surowcowych, które się zaproponowało, zmniejszając, zwiększając na przykład ilość surowców. Nadal jest to nieedytowalne.

## Sytuacja (dziś)

1. **Tryb `trade` (Umowa wymiany)** w `validateBasket` wymaga **obu** stron: „Co oddaję” **i** „Co dostaję” (`Dodaj co najmniej jedną pozycję w „Co dostaję"`). Dar (`mode === 'gift'`) pozwala tylko oddawać — ale osobna ścieżka UI.
2. Po dodaniu pozycji surowcowej w koszyku / na stole: widać kartę z ilością, ale **brak** stepperów −/+ / pola ilości na już dodanej pozycji (tylko usuń ×). Zmiana ilości = usuń i dodaj od nowa.

## Cel

- Móc **tylko oddać** (prezent / słodzik / budowanie PW) w ramach umowy wymiany, bez wymuszania „coś za coś”.
- Móc **zmieniać ilość** już zaproponowanych pozycji surowcowych (↑↓), bez kasowania wiersza.

---

## R-DYPLO-WYMIANA-ONEWAY-Q1 — czy Umowa wymiany może być jednostronna?

### A — Tak: wystarczy „Co oddaję” LUB „Co dostaję” (rekomendacja)

Walidacja jak przy słodzikach do traktatu: co najmniej jedna niepusta strona. Pusta „Co dostaję” = jednostronny dar w tej umowie (PW / prezent / budowanie pozycji). Obie strony nadal dozwolone.

- **Za:** dokładnie Twój opis (prezent, słodzik, podbicie punktacji).
- **Za:** nie trzeba przełączać na osobny „Dar”, gdy już jesteś w Umowie wymiany.
- **Przeciw:** AI może dostać „goły dar” oznaczony jako wymiana — trzeba jasnej etykiety (Dar / Wymiana).
- **Przeciw:** bilans PW przy pustym „dostaję” = sam oddajesz (fair-min 0) — OK, ale UI musi to pokazać.

### B — Zostaw wymóg obu stron w Umowie wymiany; prezent tylko przez akcję Dar

- **Za:** czytelny podział: wymiana = 2 strony, dar = 1.
- **Za:** zero zmian logiki AI fair-min.
- **Przeciw:** przeczy Twojej uwadze — musisz wychodzić do „Dar”.
- **Przeciw:** nadal komunikat „dodaj co dostaję”, którego nie chcesz przy samym dawaniu.

### C — Jednostronne tylko „Co oddaję” (dar); „tylko dostaję” zabronione

- **Za:** możesz dać prezent w tej umowie; nie możesz żądać za darmo.
- **Za:** bezpieczniejsze vs exploit „żądaj bez oferty”.
- **Przeciw:** nie pokrywa przypadku „chcę tylko dostać za inną umowę na stole” (multi-deal).
- **Przeciw:** nadal sztywne vs pełna elastyczność A.

**Rekomendacja: A**

---

## R-DYPLO-WYMIANA-QTY-EDIT-Q1 — edycja ilości na już dodanej pozycji

### A — Stepper −/+ (i pole liczby) na każdym wierszu surowca w koszyku i przy edycji propozycji na stole (rekomendacja)

- **Za:** szybka zmiana 10→15 bez usuń/dodaj.
- **Za:** domyka „nadal nieedytowalne” z playtestu.
- **Przeciw:** więcej UI na małej karcie.
- **Przeciw:** trzeba pilnować max magazynu przy ↑.

### B — Tylko w koszyku przed wysłaniem; na stole (TWOJA PROPOZYCJA) — „Edytuj” otwiera koszyk

- **Za:** mniej kontrolek na stole.
- **Za:** jeden edytor (koszyk).
- **Przeciw:** dodatkowy klik vs edycja in-place.
- **Przeciw:** jeśli koszyk nie pokazuje stepperów na wierszu — problem zostaje w połowie.

### C — Bez stepperów: ilość tylko przy dodawaniu; zmiana = usuń + dodaj (status quo)

- **Za:** zero pracy.
- **Przeciw:** wprost to, na co narzekasz.
- **Przeciw:** łatwo o błąd przy ponownym dodawaniu.

**Rekomendacja: A** (ew. A+B: steppers w koszyku + „Edytuj” z karty na stole otwiera ten koszyk)

---

## Po decyzji

`R-DYPLO-WYMIANA-ONEWAY-Q1 A|B|C`  
`R-DYPLO-WYMIANA-QTY-EDIT-Q1 A|B|C`  
→ commit → **`deploy`** osobno.
