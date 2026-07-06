# HANDOFF: Maciej → UI — zadowolenie / bunt per miasto (Q3 HUD mapa)

**Data:** 2026-06-26 · **Decyzja:** Q3=C + scope per miasto · **Status:** DO IMPLEMENTACJI (mockup + cityPanel)

---

## Co ustalił Maciej

1. **Nie** globalne zadowolenie/porządek/bunt dla całej cywilizacji na mapie.
2. **Tak** pełna informacja w **menu/panelu danego miasta**.
3. Wzorzec **C:** krótki skrót (liczba lub tier) + **klik → panel szczegółów** (szczęście, porządek, T1/T2, bunt).

---

## Mapa świata (HUD D1B)

- **Usunąć** wiersz „Zadowolenie” z górnego paska zasobów (mockup + docelowy `hud.ts`).
- **Nie** budować panelu `#ord` po prawej jak w starym `Gra-podglad-HUD.html` (to był widok imperium).
- **Opcjonalnie v1.0:** chip w panelu wydarzeń prawym — „Bunt w [Miasto]” — klik otwiera panel miasta.

---

## Panel miasta

- Sekcja **Porządek / Zadowolenie** (reuse `orderPanel.ts` + `game/order.ts`).
- Skrót w nagłówku lub zwinięty blok: np. tier OK / T1 / T2 lub suma szczęście+porządek.
- Rozwinięcie: paski szczęścia i prawa, progi, opis kar/buntu.
- Dane **per `cityId`** — `evaluateOrder({ szczescie, prawo }, params)` już w silniku per miasto (`main.ts` tick).

---

## DoD

- [ ] Mockup D1B: brak Zadowolenia na pasku mapy.
- [ ] `cityPanel`: podpięty `orderPanel` (lub inline sekcja) z expand/collapse.
- [ ] Brak globalnego API `getEmpireOrder()` na HUD mapy.

---

## Cross-lane

- **EKONOMIA:** bez zmian modelu — zadowolenie z yield budynków per miasto już istnieje.
- **UI lane only** (+ MASTER wpiecie cityPanel callbacks jeśli potrzebne).
