# R-STATUS-PRZYCZYNA-CIERPIENIA-Q1 — komunikacja przyczyny osłabienia jednostki

**Status:** 🟡 **ZAPISANA** · **C** (2026-08-06)
**Zgłoszenie:** Maciej — „musi być wyraźna komunikacja, jakiego powodu jednostka cierpi".
**Zależność:** wdrożenie CZEKA na scalenie R-DEFICYT-ZLOTA-KARA-Q1 (potrzebuje realnego kodu drugiej
przyczyny cierpienia, żeby było co odróżniać na ikonie/karcie).

## Ustalenia audytu (przed decyzją)

Dziś jedyny sygnał to czerwona czaszka nad żetonem na mapie — globalna dla WSZYSTKICH jednostek wojskowych
właściciela naraz (`isArmyHungry(ownerId)` jest binarne per cywilizacja, `empire-food.ts:322-325`, rysowanie
`units.ts:4950-4978`). Karta pojedynczej jednostki (`unitCardStatus.ts:169-185`,
`buildUnitExtraStatusLinesHtml`) pokazuje status garnizonu/czuwania/fortyfikacji/oblężenia, ale **nigdy**
głodu — gracz nie ma jak sprawdzić, dlaczego KONKRETNA jednostka jest słabsza, bez otwierania osobnych
paneli/domysłu.

## ECHO

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-STATUS-PRZYCZYNA-CIERPIENIA-Q1** | **C** | Oba naraz: (1) osobna ikona/kolor na żetonie per przyczyna (dziś: głód = czaszka; po wdrożeniu R-DEFICYT-ZLOTA-KARA-Q1 dochodzi druga ikona dla deficytu Złota) zamiast jednej uniwersalnej czaszki dla wszystkiego; (2) pełny opis na karcie jednostki (`unitCardStatus.ts`, ta sama lista co garnizon/czuwanie/fortyfikacja), np. "Status: głoduje (−25% staty walki)" / "Status: brak żołdu (−N% staty walki)", pokazujący WSZYSTKIE aktywne przyczyny naraz jeśli jednostka cierpi z więcej niż jednego powodu. |

## Skutek (1–3 zdania)

Gracz widzi na pierwszy rzut oka na mapie, ile różnych przyczyn osłabia jego (lub wroga) armię, a po otwarciu
karty jednostki dostaje pełny, nazwany opis każdej aktywnej kary. Zastępuje dzisiejszą jedną uniwersalną
czaszkę czytelniejszym, rozróżnialnym zestawem sygnałów.

## Wdrożenie

Czeka na (1) scalenie R-DEFICYT-ZLOTA-KARA-Q1 do drzewa głównego, DOPIERO POTEM (2) hasło **`działaj`** →
AutoBot Operator (🟡 UI mapa + karta jednostki — dotyka `gra/src/render/**`, więc Operator na **Opus 5**
zgodnie ze stałym wyjątkiem renderowym).
