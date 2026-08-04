# R-REKRUT-LUDNOSC-UI — czy rekrutacja odejmuje ludność miasta?

**Status:** AUDYT 2026-08-04 · rekrutacja **nie** zmniejsza `city.population` · UI do poprawy  
**Źródło:** Maciej — wrażenie spadku ludności po jednostkach wojskowych (głód/Spichlerz?)

## Werdykt

**Rekrutacja / ukończenie jednostki w kolejce nie odejmuje ludności miasta.**

- Parametr `jednostka_koszt_ludnosci` = **0** (`gra/data/miasto-params.json`, decyzja Maciej 2026-07-21).
- `populationCostOf` / `UNIT_POPULATION_COST` = 0 dla jednostek.
- `tryDeductUnitSpawnCostsEmpire` **ignoruje** koszt pop; schodzi tylko **Manpower** (pula imperium).
- Komentarz w `manpower.ts`: *„Ludność miasta NIE maleje przy rekrutacji”*.

## Skąd realny ubytek ludności (−1)

| Przyczyna | Kiedy |
|-----------|--------|
| **Głód** | Koniec tury: miasto **nie nakarmione** z centrali → `applyHungerPenaltyV85` → **−1** (min 1) |
| **Ujemny WZROST%** | Nakarmione, ale ułamkowy wzrost ujemny |
| **Założenie miasta** | `zaloz_miasto_koszt_ludnosci` = 1 ze źródła |
| **Bunt** | Migracja −1 do innego miasta |

**Spichlerz** nie zabiera obywateli. Brak Ceramiki/Soli → brak bonusów Spichlerza → wyższy koszt racji / łatwiej o głód → dopiero wtedy −1 pop.

## Bug UI (mylący tekst)

W `cityPanel.ts` nadal jest stary opis:
- ~4749: *„z tego miasta schodzi tylko −1 obywatel”*
- ~7316: *„Werb … i −1 obywatela w tym mieście”*

To **kłamie** względem kanonu od 2026-07-21. Kolumna `Ludność: 1` w `units.json` = legacy/display, nie koszt spawnu.

## Fix (propozycja, bez ABC — kanon już ustalony)

Usunąć / poprawić te 2 stringi: werb = Manpower (+ ¤ przy rekrutacji za złoto), **bez** −1 obywatela.
