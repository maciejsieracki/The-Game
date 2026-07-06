# Paczka 5/5 — EKO-TECH (ABC-19)

> **Data:** 2026-07-05 · **Status:** 🟢 **WDROŻONA** (ROBOCZA md5 `395f12c3…`)

## Wpięcie lane ✅

- `resource-access.ts`: `getCityResourceAccessForCity` → `{ potential, active }`; `getResourceAccessForCity` → tylko active
- `cityPanel.ts`: sekcje „Dostęp aktywny” + „Potencjał (złoże)”, szare ikony potencjału
- `main.ts`: hook z `builtIds` + `ownerId` dla brązu
- Test: `eko-tech-paczka5-test.cjs` **11/11**; `food-hodowla-test.cjs` **26/26**

## Odpowiedź Macieja

| ID | Decyzja | Skutek w grze |
|----|---------|---------------|
| **ABC-19** | **A** | Panel surowców miasta: **dwa stany** — potencjał (złoże widoczne) vs **dostęp aktywny** (po ulepszeniu / bramce hodowli / brązie) |

## Kanon ABC-19 A — co wdrożyć

### Potencjał (złoże widoczne)
- Heks w zasięgu miasta ma złoże (nakładka / `zloze`) widoczne na mapie.
- W panelu: wpis **szary / przygaszony**, etykieta typu „Bydło — złoże” lub ikona z obrysem.
- **Nie** odblokowuje budynków, produkcji jednostek ani handlu surowcem.

### Dostęp aktywny
- Po spełnieniu bramki danego surowca:
  - **Minerały / drewno:** ulepszenie terenu (tartak, kopalnia, glinianka…).
  - **Hodowla:** pastwisko/stadnina na złożu (ABC-18).
  - **Brąz:** Popalnia na mapie **AND** Piec hutniczy w mieście (ABC-13).
- W panelu: wpis **pełny kolor**, liczy się do bramek budynków / produkcji / dyplomacji.

### UI (Panel miasta — sekcja „Surowce w zasięgu”)
- Dwie grupy lub wizualne rozróżnienie w jednej liście (potencjał vs aktywny).
- Tooltip: wyjaśnienie bramki (np. „Zbuduj pastwisko na złożu bydła”).

## Pliki lane (szacunek)

| Lane | Plik |
|------|------|
| EKONOMIA | `gra/src/game/resource-access.ts` — rozdzielić `getDepositPotential` vs `getActiveResourceAccess` |
| UI | `gra/src/ui/cityPanel.ts` — render dwóch stanów |
| UI | `gra/src/ui/hexContextTooltip.ts` — spójność etykiet |
| Test | nowy `gra/tools/eko-tech-paczka5-test.cjs` lub rozszerzenie istniejących |

## Powiązane

- Paczka 4: `PACZKA-4-EKO-TECH-ABC-2026-07-05.md` (ABC-18 — bramka hodowli)
- Paczka 3: `PACZKA-3-EKO-TECH-ABC-2026-07-04.md` (ABC-13 — brąz AND-gate)
- Upgrade budynków ABC-20…24 — **odłożone** (hasło `upgrade`)
