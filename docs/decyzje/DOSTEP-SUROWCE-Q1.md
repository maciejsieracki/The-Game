# DOSTEP-SUROWCE-Q1 — tylko magazyn, bez „dostępu"

**Status:** ZAMKNIĘTE  
**Data:** 2026-07-29  
**Decydent:** Maciej

## Cytat / sens

> „Jeżeli mamy to ujednolicić, ujednolicimy w drugą stronę. […] w wypadku surowców: jeżeli budynek wymaga surowca, to niech go wymaga **tylko w magazynie**, a nie dostępu. Kwestię dostępu **usuwamy całkowicie** z gry — anachroniczna względem magazynu i polityki surowcowej. Dostęp nic nie powinien dawać — tylko fizyczne zasoby w magazynie. Tak samo w dyplomacji: handel samym dostępem nic nie daje — tylko fizyczne zasoby.”

## Decyzja

**A — tylko magazyn państwa** (odwrotnie do FALI 94 B1: Stolarnia↔Tartak aktywne źródło).

### Mechanika

1. **Bramka budowy** (`DEPOSIT_LINKED`): etykieta spełniona gdy `empireStock[klucz] > 0` (+ koszt `koszt_surowce` z magazynu).
2. **Runtime gate**: budynek aktywny gdy w magazynie jest surowiec na tick/drain (lub konwerter Ceramika/Cegła).
3. **Jednostki Brąz/Żelazo**: wymagają zapasu `braz` / `zelazo` w magazynie państwa (nie kopalni na mapie).
4. **Odlewnia brązu**: wymaga **Rudy w magazynie** (nie `empireHasKopalniaMiedzi`).
5. **Dyplomacja**: handel `zloze` / `surowiec_boolean` pozostaje wycofany (SUROW-TERYT); liczą się tylko transfery fizyczne (`surowiec_ilosc` once/per_turn).
6. **Zachowane**: prerekwizyty budynek→budynek, wybrzeże/rzeka, drain Spichlerza, konwertery, produkcja z ulepszeń terenu do magazynu.

### Cofnięte

- `ACTIVE_SOURCE_ONLY_LABELS_BY_BUILDING` (B1 Stolarnia→Tartak) — usunięte.
- Twardy id-lock Odlewni brązu na Kopalnię miedzi — zastąpiony bramką Rudy w magazynie.

### Pliki wdrożenia

- `gra/src/game/building-resource-gate.ts`
- `gra/src/game/production.ts`
- `gra/src/game/braz-access.ts`, `zelazo-access.ts`, `resource-access.ts`
- `gra/src/ui/cityPanel.ts`
- `gra/data/buildings.json`
- `gra/tools/deposit-building-gate-test.cjs`
