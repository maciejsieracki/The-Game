# R-WIARYGODNOSC-S9-Q1 — strojenie liczb wiarygodności (§9)

**Status:** 🟡 **ZAPISANA** · **A** (2026-08-06)  
**Cytat Macieja:** „Pełna paczka strojenia liczb §9 teraz (JSON + testy)"  
**Źródło:** [`ABC-PACZKA-2026-08-06-KOLEJKA.md`](ABC-PACZKA-2026-08-06-KOLEJKA.md) · spec `WIARYGODNOSC-SPECYFIKACJA.md` §9

## ECHO

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-WIARYGODNOSC-S9-Q1** | **A** | Przegląd i dostrojenie **wszystkich** parametrów strojeniowych wiarygodności w JSON (wagi N1–N7, strumień S1–S4, czasy zapominania, progi UI) + testy regresji `wiarygodnosc-test.cjs`. |

## Skutek (1–3 zdania)

Placeholderowe wartości z fali wdrożeniowej (233–237) zostają zastąpione przemyślanym strojeniem — kary, strumień i dryf Z mają spójne „feel" dyplomacji. Zmiany w `diplomacy.json` / `DIPLOMACY_PARAMS` (🟢 warstwa danych), bez przebudowy mechanizmu. Pełna paczka naraz, nie minimalna C.

## Wdrożenie

Czeka na hasło **`działaj`** → AutoBot Operator (🟢 izolowana warstwa danych + testy).
