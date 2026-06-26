# Analiza 03 — MIASTO

*Audyt: 2026-06-26 | Źródła: `cities.ts`, `production.ts`, `order.ts`, `culture-religion.ts`, `auto-manage.ts`*

---

## 1. Zakres lane'a

Mechaniki miasta: zakładanie, produkcja budynków, kultura/religia, porządek (szczęście), auto-zarządzanie.

**Własność:** `cities.ts`, `production.ts`, `order.ts`, `culture-religion.ts`, `auto-manage.ts`, `Budynki.xlsx`.

---

## 2. Stan (% ~82%)

### DONE
- `cities.ts` — canFoundCity, foundCity, foundCityAt, cityName; dystans ≥5; bramka terytorialna
- `production.ts` — kolejka budynków, rush, koszty Praca/Pieniądz, poziomy per epoka
- `order.ts` — Porządek (szczęście + prawo), evaluateOrder
- `culture-religion.ts` — accumulateCulture, spreadReligion, cultureHappiness
- `auto-manage.ts` — autoManageCity toggle (wpięty w cityPanel + SILNIK)
- Panel miasta UI (`cityPanel.ts`) — produkcja, suwaki, auto-manage
- Zakładanie z mapy (tryb Budowa, klawisz B) — kontrakt MAPA→SILNIK DONE

### IN PROGRESS
- Dynamiczny zasięg UX (pop=radius wizualizacja)
- Budynek **Mury** — prereq bonusów obrony (+200 HP mur)

### Brak blokad Macieja
Lane relatywnie odblokowany; czeka na EKONOMIA (dane budynków) i SILNIK (wpiecia).

---

## 3. Model miasta (kanon)

- **Zasięg:** radius = populacja (cap 15); okolica = terytorium
- **Miasto-córka:** NIE dostaje bazowych plonów matki; tylko budynki
- **Wioska→miasto:** konwersja NIE w v0.1 (decyzja 4B)
- **Produkcja:** kolejka FIFO, rush za Pieniądz, koszt ludności per budynek
- **Kultura:** rozszerza granice; presja na sąsiadów
- **Religia:** świątynia → konwersja stopniowa podbitych

---

## 4. Testy

| Suite | Wynik |
|-------|-------|
| culture-religion-test | 43/43 |
| auto-manage-test | 26/26 |
| found-from-village-test | 24/24 |
| happiness-breakdown-test | 38/38 |

---

## 5. Zależności

- **EKONOMIA:** plony okolicy, splitPraca, koszty budynków
- **MAPA:** isInTerritory, render miast (stoneCity, cities.ts render)
- **UI:** cityPanel, sciencePicker hook
- **UNITS:** garnizon, oblężenie HP
- **SILNIK:** foundCityAt w input loop, spreadReligion w endTurn

---

## 6. Następne kroki

| # | Zadanie | Rola | AC |
|---|---------|------|-----|
| M1 | Budynek Mury w buildings.json + prereq | Composer | Bonus +200 w combat |
| M2 | UX zasięgu dynamicznego (overlay) | Composer+UI | Wizualizacja radius=pop |
| M3 | Schemat miasta v2 (duże miasto) | GLM | GDD update PROJEKT-GRY |
| M4 | Podgląd miast Brązu (MAPA) | Composer | Po decyzji 8B Macieja |

*Rola: Composer (implementacja)*
