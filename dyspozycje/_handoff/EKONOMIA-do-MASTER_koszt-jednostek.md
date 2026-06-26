# HANDOFF: Koszt jednostek — zawsze za Pieniadz (skarbiec)

**Lane:** EKONOMIA  
**Data:** 2026-06-25  
**Pliki zmienione:** `gra/src/game/production.ts`, `gra/src/game/auto-manage.ts`  
**Backup:** `gra/src/game/production.ts.bak-EKONOMIA`

---

## Model (decyzja Maciej 2026-06-25)

**Jednostki ZAWSZE kupowane za skarbiec (Pieniadz) we wszystkich epokach.**

Wyjątek epoki Kamien = za Prace zostal usuniety. Uzasadnienie: jeden surowiec przez cala gre; pieniądz (skarb/handel) ma zastosowanie od startu. Waluta to TYLKO etykieta i mnoznik dochodu (x10 po zbadaniu), nie zmienia logiki kosztu jednostek.

---

## Co zmienione

### `gra/src/game/production.ts`

1. **`unitCostMode()`** — zawsze zwraca `'pieniadz'`. Sygnatura publiczna zachowana (parametr `_def: UnitDef` zachowany dla kompatybilnosci).

2. **`buildableProduction()`** — zwraca TYLKO budynki (filtr `it.kind === 'budynek'`). Wczesniej zwracala budynki + jednostki epoki Kamien za Prace. Sygnatura bez zmian.

3. **`purchasableUnits()`** — zwraca WSZYSTKIE jednostki dostepne w danej epoce (filtr `it.kind === 'jednostka'`). Wczesniej zwracala tylko jednostki Braz+. Sygnatura bez zmian.

4. **`unitModeById()` (private)** — usunieta (stala sie martwa po zmianie).

5. **`unitPurchaseCost()`** — bez zmian w logice. Komentarz zaktualizowany: "Obejmuje wszystkie epoki lacznie z Kamieniem".

6. **Fallback kosztu jednostek Kamienia**: `unitCostFromDef()` czyta pole `"Pieniądz (koszt)"` z units.json. Wszystkie jednostki epoki Kamien (Robotnik=12, Wojownik=10) JUZ mialy ten koszt wypelniony. Fallback per-rola (`DEFAULT_COST_BY_ROLE`) plus `DEFAULT_UNIT_COST` (=10) dzialaja jako siatka bezpieczenstwa. Zadna jednostka nie jest darmowa.

### `gra/src/game/auto-manage.ts`

- Zaktualizowane komentarze (punkt 10 heurystyki, komentarz przy wywolaniu `buildableProduction`). Logika bez zmian — `buildableProduction` zwraca teraz tylko budynki, wiec auto-zarzadca kolejkuje tylko budynki (oczekiwane).

---

## Testy

- `node tools/logic-test.cjs` — **LOGIC OK (180/180)**
- `node tools/auto-manage-test.cjs` — **AUTO-MANAGE OK (26/26)**
- `node tools/split-output-test.cjs` — **SPLIT-OUTPUT OK (46/46)**
- `node tools/wire-ekonomia-test.cjs` — **23/23 passed**

Zadne asercje nie testowaly starych zalozzen "Kamien=praca/kolejka" — logic-test.cjs nie importuje `unitCostMode`/`buildableProduction`/`purchasableUnits`. auto-manage-test uzywa `buildableProduction` z fixture bez jednostek, wiec przeszedl bez zmian.

---

## Czy main.ts / UI wymaga zmian

**UI (lista jednostek do kupienia):**  
Jesli UI uzywa `purchasableUnits()`, to po zmianie zobaczy wszystkie jednostki (lacznie z Kamieniem) w liscie "do kupienia za Pieniadz". To poprawne. Jesli UI wczesniej pokazywalo jednostki Kamienia w kolejce produkcji (przez `buildableProduction`), to teraz ich tam nie bedzie — nalezy przenessc je do panelu zakupu.

**main.ts / SILNIK:**  
- `buildableProduction` → lista dla kolejki Pracy (tylko budynki). Bez zmian w sposobie wywolania.
- `purchasableUnits` → lista zakupu (wszystkie jednostki). Bez zmian w sposobie wywolania.
- Mechanizm zakupu (odliczenie Pieniadza ze skarbca, -1 ludnosc) jest po stronie SILNIK/master — brak zmian w production.ts.

**Wnioski dla mastera:**
- Jesli jednostki Kamienia byly pokazywane w UI w kolejce produkcji — wymaga poprawki UI: przeniesc je do panelu zakupu.
- Jesli SILNIK sprawdzal `unitCostMode === 'praca'` do rozroznienia — wymagana aktualizacja (teraz zawsze `'pieniadz'`).

---

## DoD (Definition of Done)

- [x] `unitCostMode` zawsze zwraca `'pieniadz'`
- [x] `buildableProduction` zwraca tylko budynki
- [x] `purchasableUnits` zwraca wszystkie jednostki (wszystkich epok)
- [x] Jednostki Kamienia maja koszt pieniezny (z units.json lub fallback)
- [x] Backup `production.ts.bak-EKONOMIA` stworzony
- [x] Testy zielone (logic-test + auto-manage-test + split-output + wire-ekonomia)
- [x] Sygnatura publiczna `unitCostMode(def: UnitDef)` zachowana
