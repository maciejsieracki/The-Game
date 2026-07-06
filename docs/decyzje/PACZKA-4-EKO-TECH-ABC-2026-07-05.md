# Paczka 4/5 — EKO-TECH (ABC-16, ABC-17, ABC-18)

> **Data:** 2026-07-05 · **Status:** 🟢 **WDROŻONA** (ROBOCZA md5 `395f12c3…`)

## Wpięcie lane ✅

- ABC-16/17: potwierdzone w danych (bez zmian)
- ABC-18: `livestock-unlock.ts`, `terrain-improvements.json` (stadnina), `improvement-build.ts`, brak implicit plonów ze złoża
- Test: `eko-tech-paczka4-test.cjs` **10/10**, `food-hodowla-test.cjs` **26/26**

## Odpowiedzi Macieja

| ID | Decyzja | Skutek wdrożenia |
|----|---------|------------------|
| **ABC-16** | **A** | **Kamienne kręgi** = budynek miasta (tech Mistycyzm) — bez kręgu na mapie |
| **ABC-17** | **A** | **Świątynia** = upgrade kręgów w **tym samym mieście** + tech Religia (`upgradeFrom`) |
| **ABC-18** | **A** | Hodowla: **pastwisko/stadnina = bramka dostępu**; koń tylko przez **Stadninę** + Jeździectwo |

## Stan vs kanon (audyt 2026-07-05)

| Element | Stan dziś | Po wdrożeniu ABC-18 A |
|---------|-----------|------------------------|
| ABC-16/17 | ✅ zgodne (`kamienne_kregi`, `swiatynia`, `upgradeFrom`) | potwierdzenie — bez zmian danych |
| Bydło/owce/lama | ⚠️ złoże w terytorium często = dostęp bez pastwiska | wymaga **ulepszenia na złożu** |
| Koń / Stadnina | ❌ brak `stadnina` w `terrain-improvements.json` | **dodać Stadninę** (Jeździectwo) |
| Panel surowców | pokazuje złoża wcześnie | częściowo ABC-19 (paczka 5/5) |

## Powiązane

- Paczka 3: `PACZKA-3-EKO-TECH-ABC-2026-07-04.md`
- Następna: **ABC-19** (paczka 5/5)
- Upgrade UI: `ODLOZONE-UPGRADE-BUDYNKOW-2026-07-04.md`
