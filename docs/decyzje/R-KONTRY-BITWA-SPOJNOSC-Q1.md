# R-KONTRY-BITWA-SPOJNOSC-Q1 — ujednolicenie tabeli kontr w bitwie

**Status:** 🟡 **ZAPISANA** · **A** (2026-08-06)

## Sytuacja

Thorakites/Triari mają `Bonus vs Mount=0`, generyczny Włócznik ma 50 — druga, niezależna od
`counters.json` ścieżka w `gra/src/battle/battleScene.ts:1215-1228`. Nieprzejrzana rozbieżność,
znalezisko audytu 2026-08-06.

## ECHO

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-KONTRY-BITWA-SPOJNOSC-Q1** | **A** | Ujednolicić do wspólnej tabeli `counters.json` — usunąć drugą, niezależną ścieżkę w `battleScene.ts`. Jedno źródło prawdy dla bonusów kontr w całej grze. |

## Skutek (1–3 zdania)

Eliminuje ryzyko przyszłych rozjazdów tego samego typu — każda jednostka piechoty z bronią drzewcową
dostaje kontrę vs konnica z tego samego miejsca, bez osobnej, łatwej do przeoczenia ścieżki w kodzie bitwy.
Możliwa zmiana balansu dla Thorakites/Triari (0→50 lub inna wartość z `counters.json`) — do zweryfikowania
w playteście.

## Wdrożenie

Czeka na hasło **`działaj`** → AutoBot Operator (🟡 logika bitwy, wymaga testu regresji `combat-test.cjs`).

---

## DOPRECYZOWANIE — R-KONTRY-BITWA-MIGRACJA-Q1 (2026-08-06)

**Status:** 🟢 **ZAPISANA** · **A z zastrzeżeniem**

Pierwsza runda AutoBot wykonała literę A dosłownie (usunięcie drugiej ścieżki) i dostała PASS-WITH-NOTES
z zablokowanym deployem — Evaluator wykrył, że `counters.json` koduje tylko 6 z ~14 par typów, więc proste
usunięcie starej ścieżki **kasowało bonus dla 61 z 98 par** (53 jednostki), w tym dokładnie ten przypadek,
który miał zostać naprawiony (Falanga traciła kontrę na kawalerię całkowicie).

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-KONTRY-BITWA-MIGRACJA-Q1** | **A, warunek: żadne bonusy nie mogą zostać utracone** | Pełna migracja — dopisać do `counters.json` WSZYSTKIE brakujące pary (patrz inwentarz niżej) zanim usunie się starą ścieżkę. Wymaga też zmiany silnika: `counterMultiplier`/`COUNTER_MULT` dziś jest sztywną stałą ×1,5 (nie czyta wartości procentowej z danych) — trzeba ją rozszerzyć, żeby każdy wiersz `counters.json` mógł nieść własną wartość procentową (dziś w starej, usuwanej ścieżce występowały +15%, +25%, +50%). |

### Inwentarz par do zmigrowania (z audytu Evaluatora, do zweryfikowania samodzielnie)

| Parowanie (atakujący→cel) | Wartość | Jednostek | Dziś w `counters.json`? |
|---|---|---|---|
| Spearman→Mount | +50% | 11 | TAK (już jest) |
| Mount→Distance | +50% | 13 | TAK (już jest) |
| Mount→Slinger | +50% | 13 | TAK (już jest) |
| Swordsman→Spearman | +15% | 29 | **NIE — dopisać** |
| Mount→Offensive | +25% | 13 | **NIE — dopisać** |
| Spearman→Spearman | +15% | 4 | **NIE — dopisać** |
| Mount→Spearman | +15% | 4 | **NIE — dopisać** |
| Swordsman→Mount | +50% | 3 | **NIE — dopisać** |
| Offensive→Swordsman | +25% | 3 | **NIE — dopisać** |
| Falangite→Mount | +50% | 1 (Falanga) | **NIE — dopisać, priorytet (przykład z pierwotnego zgłoszenia)** |
| Naval/Distance/Offensive vs … | (do ustalenia) | 4 | **NIE — zbadać i dopisać** |

### Wdrożenie

Czeka na hasło **`działaj`** → AutoBot Operator (🟡 logika bitwy + dane `counters.json`, wymaga
`combat-test.cjs` + nowego testu potwierdzającego zero-loss względem starej ścieżki dla wszystkich par).
