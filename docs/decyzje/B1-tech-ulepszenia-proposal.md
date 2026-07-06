# Propozycja — nowe technologie dla ulepszeń terenu

> **Lane:** **EKONOMIA / Grupa B** (`tech.json`, `Technologie-drzewko.xlsx`) · Transfer z D: 2026-06-28

---

## Do dodania w `gra/data/tech.json`

### Rolnictwo (Kamień, poziom 1)

| Pole | Wartość |
|------|---------|
| Technologia | Rolnictwo |
| Epoka | Kamień |
| Koszt nauki | 10 |
| Wymaga | — |
| Odblokowuje budynek | — |
| Odblokowuje ulepszenie | **Farma** |

### Łowiectwo (Kamień, poziom 1)

| Pole | Wartość |
|------|---------|
| Technologia | Łowiectwo |
| Epoka | Kamień |
| Koszt nauki | 12 |
| Wymaga | — |
| Odblokowuje ulepszenie | **Obóz łowiecki** |

### Irygacja (Brąz, poziom 2) — opcjonalnie

Alternatywa: zostawić gate na **Gospodarka wodna** (już w drzewku).

---

## Po dodaniu

1. Usunąć aliasy w `improvement-tech.ts` (`TECH_CANONICAL` dla Rolnictwo/Łowiectwo).
2. Ustawić w JSON `tech` na dokładne nazwy z tech.json.
