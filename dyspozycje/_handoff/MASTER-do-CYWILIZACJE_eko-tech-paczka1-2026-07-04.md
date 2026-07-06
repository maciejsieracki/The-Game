# MASTER → CYWILIZACJE: EKO-TECH Paczka 1 — dane JSON

**Data:** 2026-07-04 · **Status:** GOTOWE do lane · **Decyzje:** `docs/decyzje/D-EKO-TECH-PACZKA1-2026-07-04.md`

## Co przesyłam

Decyzje Macieja (paczka 1/3) wymagają sync danych.

## Co Odbiorca ma zrobić

### T-TECH-4 (wariant)
- **Rolnictwo** odblokowuje ulepszenie **Tarasy** w `terrain-improvements.json` + opis w `tech.json` (dla Inków / reguła cywilizacji).

### T-TECH-5 (wariant)
- **Irygacja:** tylko prereq **Gospodarka wodna** — **usuń** alias Matematyka.

### T-TECH-6 (A)
- Dodać/uzupełnić w `buildings.json`: **Mennica** (`techUnlock`: Waluta), **Akwedukt** (`techUnlock`: Budownictwo) — parametry do strojenia z Excel/Panel-B.

### T-TECH-8 (wariant upgrade)
- **Kamienne kręgi** (`kamienne_kregi`, Mistycyzm) + **Świątynia** (`swiatynia`, Religia) z `"upgradeFrom": "kamienne_kregi"` i **zsumowanymi** statystykami w JSON Świątyni.
- Przenieść `techUnlock` Świątyni z Mistycyzmu → **Religia**.

### T-TECH-9 (A)
- Rename tech **Drogi brukowane** (nie „żelazne"); wpis `droga_brukowana` w `terrain-improvements.json` (`upgradeFrom`: `droga`, bonus ruch +2).

### ABC-6 (A)
- Nazwa wyświetlana: **Garncarnia** (bez zmian id).

### ABC-7 (wariant)
- Budynek **Odlewnia brązu** (Brązownictwo); późniejszy wpis **Odlewnia żelaza** z `upgradeFrom`: odlewnia_brazu (stats suma — placeholder do Hutnictwa żelaza).
- **Popalnia brązu** na mapie (Brązownictwo) — jeśli brak w JSON.

### ABC-8 (A)
- Pismo: `wymagany budynek`: **Cegielnia** (twardo w danych).

### ABC-9 (A)
- Mielerz: `techUnlock` = **Obróbka drewna** (razem ze Stolarnią).

## DoD

- [ ] `tech.json` sync z powyższym
- [ ] `buildings.json` + `terrain-improvements.json` wpisy kompletne
- [ ] Export targeted jeśli potrzeba (NIE pełny export-data.py)
- [ ] Meldunek `CYWILIZACJE-DO-MASTERA.md`

## Flaga

**GOTOWE** (dane JSON wdrożone 2026-07-04)
