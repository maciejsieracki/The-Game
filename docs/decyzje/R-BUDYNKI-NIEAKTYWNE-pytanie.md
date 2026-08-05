# R-BUDYNKI-NIEAKTYWNE — czerwona czcionka dla nieaktywnych budynków

**Status:** ZAMKNIĘTE · ABC · Q1=A · Q2=A+C · Q3=A · **ZDEPLOYOWANE** FALA 222 `132401ef`  
**Źródło:** Maciej — „wybudowane budynki które nie działają (brak surowców) → czerwona czcionka, np. Spichlerz bez Ceramiki/Soli”

## Stan dziś

- **Spichlerz I** wymaga **Ceramiki** do działania (drenaż z magazynu miasta / zapasów).
- **Spichlerz II** wymaga **Ceramiki + Soli**.
- Bez tego silnik **wyłącza bonusy** (`resolveSpichlerzCityBonusState` / `paySpichlerzDrainForCity`) — budynek stoi, ale **nie działa**.
- W panelu miasta lista **„Wybudowane”** pokazuje nazwę normalnym kolorem — gracz nie widzi, że czegoś brakuje.
- Kolejka budowy ma już szare / zablokowane pozycje (wymagania przed budową) — to **inny** przypadek (jeszcze nie wybudowane).

## Q1 — Gdzie i jak sygnalizować? `R-BUDYNKI-NIEAKTYWNE-Q1`

**Sytuacja:** Wybudowany Spichlerz bez Ceramiki (lub II bez Soli) nie daje bonusów, ale w liście wygląda jak sprawny.

**Cel:** Gracz od razu widzi, że budynek stoi, ale jest wyłączony z braku surowca.

**Dlaczego teraz:** Maciej wprost prosi o czerwony sygnał przy braku Ceramiki/Soli.

### A — Czerwona nazwa + tooltip z brakiem (Rekomendacja)
Nazwa w liście Wybudowane na czerwono; po najechaniu: „Brak: Ceramika” / „Brak: Sól”.
- **Za:** czytelne; zgodne z prośbą; mało UI
- **Za:** tooltip mówi dokładnie czego brakuje
- **Przeciw:** sama czerwień bez hover = mniej jasna przyczyna
- **Przeciw:** trzeba dopisać CSS / helper statusu

### B — Czerwona nazwa + stały dopisek w wierszu
Np. `Spichlerz I — brak Ceramiki` na czerwono w tym samym wierszu.
- **Za:** widać bez hover
- **Za:** zero zgadywania
- **Przeciw:** dłuższe wiersze, może pchać layout
- **Przeciw:** na mobile mniej miejsca

### C — Tylko ikona / badge „!” czerwony przy nazwie
Nazwa normalna; czerwony wykrzyknik + tooltip.
- **Za:** mniej „alarmu” na całej nazwie
- **Za:** łatwo dodać później do innych budynków
- **Przeciw:** słabszy sygnał niż pełna czerwona nazwa
- **Przeciw:** Maciej prosił wprost o czerwoną czcionkę nazwy

**Rekomendacja: A**

## Q2 — Zakres budynków? `R-BUDYNKI-NIEAKTYWNE-Q2`

**Sytuacja:** Dziś runtime „wyłączony bez surowca” dotyczy przede wszystkim **Spichlerza** (I/II). Inne budynki mają głównie bramki **przed** budową, nie po.

**Cel:** Nie budować martwego UI pod budynki, które jeszcze nie mają takiej logiki.

### A — Na start tylko Spichlerz I/II (Rekomendacja)
Czerwony status gdy drain/bonus nieaktywny; API gotowe na rozszerzenie.
- **Za:** trafia w przykład Macieja
- **Za:** mały, pewny zakres
- **Przeciw:** inne przyszłe budynki trzeba będzie dodać osobno
- **Przeciw:** na razie jeden wzorzec w UI

### B — Wszystkie budynki z `budujeWymaga` / surowcami w JSON „na zapas”
Skan JSON i czerwone wszystko, co „teoretycznie” wymaga surowca — nawet bez runtime gate.
- **Za:** jeden system na przyszłość
- **Za:** mniej ABC później
- **Przeciw:** ryzyko fałszywych czerwonych (budynek działa, a UI krzyczy)
- **Przeciw:** duży audyt danych vs kod

### C — Spichlerz + każdy budynek, który ma dziś runtime gate w kodzie
Jak A, ale automatycznie podpinamy wszystkie istniejące gate’y (dziś ≈ Spichlerz).
- **Za:** spójne z silnikiem
- **Za:** zero fałszywych alarmów
- **Przeciw:** prawie to samo co A dziś
- **Przeciw:** trzeba utrzymać mapę gate’ów

**Rekomendacja: A** (przy C wynik praktycznie ten sam dziś)

## Q3 — Spichlerz II: częściowy brak? `R-BUDYNKI-NIEAKTYWNE-Q3`

**Sytuacja:** Silnik dziś: bez pełnego zestawu (Ceramika+Sól dla II) **oba** bonusy są wyłączone. Czasem brakuje tylko Soli.

**Cel:** Komunikat ma mówić prawdę o tym, czego brakuje.

### A — Lista brakujących surowców (Rekomendacja)
np. „Brak: Sól” albo „Brak: Ceramika, Sól”.
- **Za:** gracz wie co kupić/zbudować
- **Za:** zgodne z silnikiem
- **Przeciw:** dłuższy tooltip
- **Przeciw:** trzeba złożyć listę z gate’a

### B — Jeden ogólny tekst „Budynek nieaktywny — brak surowców”
- **Za:** proste
- **Za:** zero szczegółów do utrzymania
- **Przeciw:** nie mówi czego szukać
- **Przeciw:** słabsze UX

### C — Osobny kolor na „częściowy” (pomarańcz) vs pełny brak (czerwony)
- **Za:** niuans
- **Za:** widać „prawie działa”
- **Przeciw:** dziś silnik i tak wyłącza wszystko — pomarańcz myli
- **Przeciw:** więcej CSS / zasad

**Rekomendacja: A**
