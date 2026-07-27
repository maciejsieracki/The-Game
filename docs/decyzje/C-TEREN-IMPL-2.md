# C-TEREN-IMPL-2 — Kanon liczbowy: obrona Gór i koszt ruchu piechoty

**Status:** ✅ WDROŻONA  
**Grupa:** C (walka / bitwa ręczna 3D)  
**Ekran:** [EKRAN: Bitwa ręczna 3D — Góry, koszt ruchu piechoty]

## Sytuacja

W kodzie obrona na Górach działała jako mnożnik **×1,75** (bonus +75% do obrony) — wartość była zahardkodowana w `combat.ts`. Plik `terrain-combat.json` deklarował **+50%** obrony i koszt ruchu piechoty **3–4** na Górach, podczas gdy na planszy bitwy piechota ma koszt **2** (jak na zwykłym lądzie).

## Cel pytania

Ustalić kanoniczne wartości: mnożnik obrony na Górach (%) i koszt ruchu piechoty (punkty ruchu) — oraz które źródło (kod, JSON, Poradnik) jest prawdą.

## Dlaczego teraz

Przed deployem terenu bitwy (C-TEREN-IMPL-1) trzeba zsynchronizować liczby, żeby playtest i dokumentacja nie myliły.

## Opcja A — Obrona ×1,75; piechota koszt 2; sync JSON

Opis: Kanon = to, co jest w kodzie dziś: obrona +75% (×1,75), koszt ruchu piechoty **2** na wszystkich terenach lądowych włącznie z Górami. Zaktualizować JSON i Poradnik do kodu.

## Opcja B — Obrona ×1,75; piechota koszt 3 na Górach (`isMountain`)

Opis: Obrona bez zmian (×1,75); koszt ruchu piechoty na heksach Gór = **3**.

## Opcja C — Obrona z JSON (+75% jako +75% w danych); piechota koszt 2

Opis: Przenieść mnożnik obrony do JSON jako jedyne źródło (+75%); kod czyta z danych. Koszt ruchu piechoty = 2 wszędzie.

**Za:** Jedno źródło danych (JSON) dla obrony — łatwiejsze strojenie w Panelu · spójność z filozofią „dane w JSON" · koszt 2 bez zmian w pathfindingu.

**Przeciw:** Refaktor mnożnika obrony w silniku bitwy · większy zakres niż sync dokumentacji (A) · wymaga migracji istniejących hardcoded ×1,75.

## Rekomendacja

**Litera:** A — kod i testy już stabilne; sync JSON/Poradnik do kodu to najmniejsze ryzyko przed deployem.

## Odpowiedź Macieja

> **C** — obrona z JSON (+75%); piechota koszt 2 wszędzie.

## Wdrożenie (2026-07-27)

**`gra/data/terrain-combat.json`:**
- Góry: **Bonus Obrona +75%**, koszt piechoty **2** (jak na lądzie)

**`gra/src/game/combat.ts`:**
- `terrainDefenseMultiplier` czyta % z kolumny „Bonus Obrona" JSON (bez hardcoded 1,75 / 1,5 dla Gór/Wzgórz)
- Wyjątek: Las (+50% tylko vs Dystans/Flanka) — logika warunkowa zostaje w kodzie

**`docs/PORADNIK-GRACZA/10-walka.md` §63.2:** sync (×1,75, koszt piechoty 2, konnica niedostępna)

**Testy:** `teren-walki-etapy-test.cjs` **26/26** · `city-defense-terrain-gate-test.cjs` · tsc **0**

**Uwaga:** `combat-params.json` → `mountain_defense_mult` (oblężenie/auto-walka mapy) pozostaje **1,75** — osobny kanał danych, spójna wartość.

**Warstwa:** 🟢 (combat.ts + JSON + Poradnik)
