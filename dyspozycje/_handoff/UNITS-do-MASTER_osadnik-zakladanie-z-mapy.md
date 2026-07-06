# HANDOFF: UNITS → MASTER — decyzja: zakładanie miast z MAPY, Osadnik do wycofania

Data: 2026-06-24. Od: Grupa C. Do: Master (silnik/integracja).

## DECYZJA MACIEJA
Miasta będą zakładane z poziomu MAPY (nie jednostką). W związku z tym jednostka **Osadnik** (Settler) przestaje być potrzebna i ma zostać wycofana z gry.

## ZALEŻNOŚĆ (dlaczego nie wycinam sam)
- Osadnik to jednostka „Civilian" w danych UNITS (`gra/data/units.json` + `Jednostki.xlsx`) — usunięcie z danych to MÓJ lane (drobne).
- ALE obecnie miasto zakłada się Osadnikiem (`main.ts`, akcja „B" / zakładanie). Wycięcie Osadnika ZANIM powstanie zakładanie-z-mapy zepsuje obecną funkcjonalność.
- Zakładanie miasta z mapy = zmiana w SILNIKU (`main.ts` / pętla tury / UI mapy) = domena Mastera.

## PROŚBA DO MASTERA
1. Zaprojektować/wpiąć zakładanie miasta z poziomu mapy (bez jednostki Osadnik): np. przycisk/akcja na kafelku mapy z warunkami (min. dystans, teren), zamiast budowy+ruchu Osadnika.
2. Po wdrożeniu — daj sygnał, wtedy USUNĘ Osadnika z `units.json` + `Jednostki.xlsx` (zakładka „Jednostki niebojowe") i zaktualizuję panel.
3. Sprawdzić wszystkie odwołania do „Osadnik"/Settler poza moim lane (main.ts, menu budowy, tutorial, civs) — usunąć/zmienić przy migracji.

## STATUS DANYCH UNITS — WARIANT A WYKONANY (2026-06-24)
Maciej wybrał A. **OSADNIK USUNIĘTY** z `gra/data/units.json` (47 -> 46) i z `Jednostki.xlsx` (niebojowe = Robotnik, Zwiadowca). Backup: `_backup/Jednostki.xlsx.bak-osadnik`.

### PILNE DLA MASTERA (bo teraz jest „dziura")
- Bez Osadnika **NIE DA SIĘ założyć miasta** dotychczasowym sposobem. Trzeba PILNIE wpiąć **zakładanie miasta z poziomu MAPY** (akcja na kafelku, warunki: min. dystans/teren) zamiast budowy+ruchu Osadnika.
- `data/units.json` ZMIENIONE (−Osadnik) → **przebuduj KANON** `Gra-podglad.html`.
- Usuń/zmień wszystkie odwołania do „Osadnik"/Settler poza moim lane: `main.ts` (tworzenie jednostki startowej + akcja „B"/zakładanie), menu budowy, tutorial, ewentualnie civs. Inaczej runtime poleci na braku jednostki.

— Grupa C
