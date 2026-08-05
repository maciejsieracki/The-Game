# R-PANEL-GRUPY — grupowanie budynków w panelu miasta

**Data audytu:** 2026-08-05  
**Operator:** AutoBot VERIFY/CLOSE  
**Źródło decyzji:** `dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §2

## Zakres

Panel „Budynki w mieście" — 8 grup dziedzinowych zamiast płaskiej listy; klik rozwija budynki w grupie; awans „w górę" rozwija łańcuch zastąpionych (UI + `upgradeCompositionLines`).

## Audyt (2026-08-05)

| Obszar | Dowód | Status |
|--------|-------|--------|
| Dane `grupa` | `gra/data/buildings.json` — 41/41 budynków, 8 grup | PASS |
| Typ | `BuildingDef.grupa` w `gra/src/data/loader.ts` | PASS |
| Logika grup | `BUILDING_GROUP_ORDER` + `groupBuiltBuildingIds()` w `building-upgrades.ts` | PASS |
| UI | `cityPanel.ts` → `renderBuildingsOwned()` (`<details>` per grupa) | PASS |
| Regresja | `node tools/grupy-budynkow-test.cjs` | **83/83 PASS** |

### Rozkład grup (41 budynków)

| Grupa | Liczba |
|-------|--------|
| Prawo i administracja | 8 |
| Wojsko i obrona | 7 |
| Handel i pieniądz | 5 |
| Nauka i kultura | 4 |
| Wiara | 2 |
| Zdrowie | 3 |
| Produkcja surowców | 10 |
| Żywność | 2 |

Wojsko i obrona = 7 po dodaniu Palisady drewnianej (`palisada`, 2026-07-28) obok Baszty/Murów/Cytadeli.

## Uwaga operacyjna

Kod na `main` od commitu `2354fb7`. Osobny publish do `gra-robocza/` nie był wymagany w tym torze verify (bez deploy).
