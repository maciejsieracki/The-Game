# HANDOFF: UNITS → MASTER — Robotnik do wycofania (ulepszenia terenu z MAPY)

**Data:** 2026-06-25 · **Od:** Grupa C · **Do:** MASTER (silnik/integracja)

## DECYZJA NASTER
Budowa ULEPSZEŃ TERENU (farma, kopalnia, pastwisko, droga, posterunek/fort, itd.) będzie z poziomu MAPY (akcja na kaflu), nie jednostką. W związku z tym jednostka **Robotnik** (Worker) przestaje być potrzebna — analogicznie do wcześniej wycofanego Osadnika (miasta z mapy).

## CO ZROBIŁ UNITS (dane)
- USUNIĘTY **Robotnik** z `gra/data/units.json` (51 → 50) i z `Jednostki.xlsx` (zakładka „Jednostki niebojowe" → zostaje tylko Zwiadowca/Scout). Backup units.json + xlsx.
- (model 'robotnik' w units.ts mogę zostawić jako nieużywany — nieszkodliwy; usunę na życzenie.)

## PILNE DLA MASTERA (bo teraz „dziura")
- Bez Robotnika **NIE DA SIĘ budować ulepszeń terenu** dotychczasowym sposobem. Trzeba wpiąć **budowę ulepszeń z poziomu MAPY** (akcja na kaflu w terytorium, koszt Pracy z puli skarbca; lista ulepszeń = `data/terrain-improvements.json` — domena MAPA/EKONOMIA/silnik), zamiast budowy+ruchu Robotnika.
- `data/units.json` ZMIENIONE (−Robotnik) → **przebuduj KANON** `Gra-podglad.html`.
- Usuń/zmień wszystkie odwołania do „Robotnik"/Worker poza moim lane: `main.ts` (jednostka startowa? akcja budowy ulepszeń), `units/setup.ts`, menu budowy, tutorial, AI (budowa ulepszeń przez AI). Inaczej runtime/AI poleci na braku jednostki.
- Zgrać z wcześniejszym wycofaniem Osadnika (ten sam wzorzec „akcja z mapy zamiast jednostki cywilnej").

## STATUS
Niebojowe po zmianie = tylko **Zwiadowca (Scout)**. Czy Scout zostaje? (Naster nie wspomniał o jego usunięciu — zakładam ZOSTAJE.)

— Grupa C
