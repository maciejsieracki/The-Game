# HANDOFF: MAPA → MASTER (dla UNITS/SILNIK) — kontrakt OBLĘŻENIA (styk mapa↔bitwa)

**Data:** 25.06.2026 · **Od:** Grupa A · Test w `Civ-MAPA/Gra-podglad-RUCH.html` (atak gracza na wrogie miasto z murem).

## Co robi MAPA (do startu bitwy)
Wykrycie ataku (jednostka gracza OBOK miasta klika heks miasta) → MAPA składa i przekazuje KONTEKST:
- `tryb`: oblezenie (mur+obronca) / zdobycie_z_marszu (brak muru) / bitwa_polowa
- `atakujacy`, `obronca` (garnizon): {nazwa, owner, q, r, kategoria}
- `miasto`: {civ, poziom, q, r}; `teren`
- `struktury_obronne`: {mur, fort, posterunek} = TYLKO FLAGI OBECNOŚCI (wartości bonusów = UNITS/EKONOMIA)
- `posilki`: {atakujacy:[jedn. gracza w 1 heksie], obronca:[jedn. wroga w 1 heksie]} (decyzja Macieja „posiłki 1 heks")
- `pozycje`: jednostki wokół celu
Overlay „TRYB OBLĘŻENIA" pokazuje ten kontekst = punkt przekazania do UNITS.

## Czego brakuje na styku (dla UNITS/SILNIK)
1. **UNITS — scena bitwy oblężniczej**: konsumuje kontekst; HP muru/bramy (siegeWall.ts), machiny (Taran/Wieża/Katapulta) łamią bramę, szturm/rundy, morale, rozstawienie.
2. **Wartości bonusów obrony**: mur +200% / fort +100% / posterunek +50% — UNITS stosuje w walce (MAPA daje tylko obecność/stan).
3. **Wynik zwrotny do MAPY (SILNIK)**: kto przejmuje miasto / stan muru po walce → MAPA aktualizuje `city.owner`, usuwa pokonanych, ew. przejmuje pole.
4. **SILNIK**: wpięcie wywołania sceny bitwy w pętli tury (gdy MAPA zgłosi atak) + powrót wyniku.

## Gotowe u MAPY
Detekcja ataku, klasyfikacja (oblężenie/marsz/polowa), złożenie kontekstu + posiłki 1-heks, overlay przejścia. Po stronie MAPY scena bitwy NIE jest renderowana (granica: to UNITS).
