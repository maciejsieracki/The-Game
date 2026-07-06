# MASTER → Maciej (designer): Technologie-drzewko.xlsx — cuda + tech

> **Status:** GOTOWE · plik w root projektu

## Co przesłano

| Plik | Opis |
|------|------|
| `Technologie-drzewko.xlsx` | Lustracja drzewka badań + cuda Antyku |
| `gra/tools/audit-tech-crossref.cjs` | Audyt spójności przed edycją/exportem |
| `gra/tools/build-tech-excel-mirror.py` | Regeneracja: `python gra/tools/build-tech-excel-mirror.py` |

## Arkusze

- **Technologie** — 31 tech + kolumna „Odblokowuje cud (lustracja)”
- **Cuda_Antyk** — 19 aktywnych + parkowane (techUnlock, E/R, epoka państwa)
- Lookup budynki / jednostki / ulepszenia — bez zmian funkcji

## Zasady edycji

1. **Technologie** → edycja w Excel → `export-tech.py` (tylko kolumny EXPORT_FIELDS)
2. **Cuda** → edycja w `gra/data/wonders.json` lub Panel — **NIE** przez export-tech
3. Kolumny lustracyjne (w tym cuda) **nie** trafiają do tech.json automatycznie

## Otwarte dla designera (info)

- **Pałac** — jedyny budynek z pustym `techUnlock` (decyzja ABC osobno)
- Alias **Irygacja** → **Gospodarka wodna** tylko w kodzie ulepszeń
- D-CUD4 vs `absolut: 6` w JSON — synchronizacja przy epoce Klasycznej

## Następny krok gameplay (Maciej ABC)

Luki **G1A–G1D** przed CUDA-G2 (bonusy, upkeep, hex mapy).
