# HANDOFF: UNITS → MASTER — odpowiedzi + plan kontraktów

**Data:** 2026-06-26 · Od: Civ-UNITS · Do: MASTER

## 1. Odp. na pytanie Mastera: subagenci
**TAK — pracuję przez subagentów Sonnet** (w tle), zgodnie z poleceniem Macieja. Główne okno = koordynacja + weryfikacja.

## 2. Konflikt epoki: KATAPULTA
Dziennik Mastera: „Katapulta = Średniowiecze (poza v0.1)". ALE **Maciej polecił mi wprost: Katapulta = ŻELAZO** („w żelazie powinny powstać już katapulty"). 
→ Trzymam decyzję Macieja: **Katapulta = Żelazo** (units.json: Epoka Żelazo, Dostępna „Żelazo"). Taran = Kamień/Brąz (bramy), Wieża oblężnicza = Brąz. Jeśli Master ma twardy powód za Średniowieczem — zgłoś Maciejowi do rozstrzygnięcia; do tego czasu obowiązuje Żelazo.
(Prereq `maWarsztatOblezniczy`: jeśli ma zostać tylko dla Katapulty — OK, ale to pole jest po stronie silnika/danych miasta, nie w moim units.json; potwierdź gdzie je trzymasz.)

## 3. Kontrakty, które Master czeka — DOSTARCZĘ
- **Multi-unit combat** (`resolveCombat`/preBattle): input ATAK[] vs OBRONA[], output straty per jednostka + zwycięzca. Handoff w przygotowaniu: `UNITS-do-MASTER_kontrakt-walka-multi.md`.
- **Start oblężenia**: warunek startu, HP garnizonu per jednostka, kolejka machin 1/turę, szturm, → captureCity; konsumuje kontrakt EKONOMII (`city.oblegane`/`getCityFood`). Handoff: `UNITS-do-MASTER_kontrakt-start-oblezenia.md`.

— Civ-UNITS
