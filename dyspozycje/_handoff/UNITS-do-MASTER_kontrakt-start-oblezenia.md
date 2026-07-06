# KONTRAKT: UNITS → MASTER — START OBLĘŻENIA

**Data:** 2026-06-26 · Od: Grupa C · Do: MASTER · Decyzje Naster (2, 3A). Konsumuje kontrakt EKONOMII (`EKONOMIA-do-UNITS_zapasy-oblezenie-kontrakt.md`: `city.oblegane`, `getCityFood()`, `city.garnizon`, `tick.obleganyGlod`).

## 1. JAK ZACZYNA SIĘ OBLĘŻENIE (decyzja 2)
- **GRACZ atakuje miasto z murem:** ZAWSZE **jawna akcja „Oblężaj"** (gracz ją wybiera) → wejście w tryb oblężenia (plansza/szturm UNITS).
- **AI atakuje (w swojej turze):**
  - jeśli AI tylko blokuje (nie szturmuje, nie dochodzi do bitwy) → **automatycznie** `city.oblegane=true` (głód leci, bez bitwy);
  - jeśli AI przystępuje do **SZTURMU** → **jawna akcja** (uruchamia bitwę/planszę).
  - Czyli jawna akcja = tylko gdy ktoś realnie szturmuje; sama blokada = automat.
- **GŁÓD/kapitulacja:** gdy zapasy żywności = 0 → miasto **zdobywane AUTOMATYCZNIE** (transfer właściciela na atakującego), BEZ jawnej akcji/bitwy. Po prostu przechodzi na drugą stronę.

## 2. GARNIZON (decyzja 3A)
Garnizon = **realne jednostki wojskowe w mieście + MILICJA z populacji**.
- HP per jednostka (realne jednostki) — do atrycji 8%/turę (zegar oblężenia) i progu upadku (~30–40% śr. HP).
- Milicja = pula z populacji (np. % ludności → słabe jednostki obronne), dołącza do obrony przy szturmie.
- Te jednostki + milicja stają na murach/za murami w taktycznej bitwie oblężniczej (UNITS).

## 3. PRZEBIEG TURY OBLĘŻENIA (silnik ma już głód+atrycję+kapitulację)
Brakujące elementy startu/akcji do wpięcia:
- Wejście w stan oblężenia (warunki sekcja 1) → `city.oblegane=true`.
- **Kolejka machin 1/turę** podczas oblężenia: Taran/Wieża (in-siege; Katapulta=Żelazo). Po zbudowaniu → możliwy szturm/wyłom.
- **Szturm** → taktyczna bitwa oblężnicza UNITS (mur/brama/machiny, +200% obrony, obrońcy hold). Wynik → kontrakt walki (`_kontrakt-walka-multi.md`).
- Po zdobyciu/kapitulacji → `captureCity(atakujący)`.

## 4. STYK
- MAPA/SILNIK: ruch armii pod miasto, akcja „Oblężaj", blokada, tura głodu.
- EKONOMIA: zapasy/populacja/garnizon (kontrakt).
- UNITS: taktyczna bitwa oblężnicza + skład/rozstrzyganie (kontrakt walki).

— Grupa C
