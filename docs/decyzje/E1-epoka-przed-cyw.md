# E1 — Epoka przed cywilizacją (kreator)

| Pole | Wartość |
|------|---------|
| **ID** | E1-EPOKA-PRZED-CYW |
| **Data** | 2026-06-29 |
| **Status** | ✅ ZWERYFIKOWANA (playtest Maciej OK) · kanon md5 `95bbcd3f…` *(stary — aktualny kanon: `4602e752d7e4b21f3c2460e494e82a8f`)*
| **Lane** | UI · CYWILIZACJE (`civs.json`) · SILNIK bez zmian |

---

## Flow kreatora

1. **Intro**
2. **Epoka startowa** (najpierw)
3. **Cywilizacja** (tylko nacje dostępne w wybranej epoce)
4. **Ustawienia mapy**
5. **Start**

---

## Reguły startu (v1)

| Cywilizacja | Dozwolone epoki |
|-------------|-----------------|
| Grecy, Rzymianie, Chińczycy, Zulusi, Egipt, Babilon | Kamień, Brąz, Żelazo |
| **Inkowie** | **Kamień, Żelazo** (**bez Brązu** — **INK-Q1=B**, Maciej 2026-06-26) |
| Celtowie, Germanie | Brąz, Żelazo (**bez Kamienia**) |

Na kroku epoki widać liczbę dostępnych cywilizacji (np. **„7 cyw.”** przy Kamieniu). Po wyborze Brązu pojawiają się też Celtowie i Germanie.

---

## Gdzie to siedzi

| Warstwa | Plik |
|---------|------|
| UI (kolejność + filtrowanie) | `gra/src/ui/newGameFlow.ts` |
| Dane (`epokiStartowe`) | `gra/data/civs.json` |
| Silnik | bez zmian — `epochId` + `civId`; tech wcześniejszych epok jak E1-Q2 |

---

## Na później (nie blokuje v1)

- **Inkowie / brak brązu historycznie** — odłożone (mają pełny zestaw epok)
- **Inne nacje tylko od Żelaza** — zmiana `epokiStartowe` w JSON (docelowo Panel-D)
- **AI rywale w tej samej epoce co gracz** — osobny krok, jeśli potrzebne

---

## Playtest (Maciej)

`Gra-podglad-ROBOCZA.html` → **Nowa gra** → **Ctrl+F5**

1. Epoka **Kamień** → brak Celtów/Germanów (7 cyw.)
2. Wstecz → Epoka **Brąz** → Celtowie i Germanie na liście (9 cyw.)
3. Start gry → epoka i tech zgodne z wyborem

**Uwaga:** ROBOCZA musi być z rebuildu po `newGameFlow.ts` (stary bundle miał odwróconą kolejność kroków).
