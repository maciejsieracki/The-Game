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
