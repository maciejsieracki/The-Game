# R-CITY-PILL-PROD-ICON — ikony kolejki + poziom wzrostu na pigułce miasta

**Status:** 🔵 W TOKU · AutoBot · Maciej 2026-08-05 (~14:45)  
**Ekran:** pigułka miasta na mapie świata (miasta **gracza**)

## ECHO (cytat)
> Na mieście gracza zamiast symbolu czy się buduje jednostka czy budynek powinny być symbole danego budynku, który jest budowany w danym momencie i dane jednostki, która w danym momencie je budowała. A jeżeli nie ma nic, to żadnego nie powinno być widoku na te rzeczy. Dodatkowo dobrze, żeby gracz mógł zobaczyć poziom wzrostu trudności.

## Interpretacja wdrożeniowa
1. **Zamiast generycznego glifu** (trójkąt=jednostka / prostokąt=budynek) → **ikona konkretnego** `frontItem.id` (budynek: `buildingIconSvg`, jednostka: `unitIconSvg` — ten sam zestaw co panel miasta).
2. **Pusta kolejka / wstrzymana** → **żadnej** ikony produkcji na pigułce (layout bez rezerwacji „pustego” slotu).
3. **„Poziom wzrostu trudności”** (w kontekście miasta) → **poziom Wyżywienia / wzrostu** (`poziomRacji`) widoczny na pigułce miasta gracza (kompaktowa etykieta, np. W1… / wartość z kanonu UI). *Jeśli Maciej miał na myśli globalną trudność gry — osobny follow-up HUD; tu scope = pigułka miasta.*
4. Scope UI: **miasta gracza** (ownerId gracza); AI/MP mogą zostać bez ikon szczegółowych / bez poziomu wzrostu albo dziedziczyć to samo jeśli tanie — preferuj **tylko gracz**.

## Pliki (oczekiwane)
- `gra/src/render/cityMapStatChip.ts` — rysunek + cache key
- `gra/src/render/cities.ts` — badge input (prodId + growth)
- `gra/src/main.ts` — injection SVG ikon produkcji (wzorzec `setCityMapBadgeCivSigil`); **nie** duża logika w main poza wiringiem
- `gra/tools/city-map-badge-test.cjs` — rozszerzyć asercje klucza / helperów

## AC
- [ ] Front budynku → ikona tego budynku (nie generyczny prostokąt)
- [ ] Front jednostki → ikona tej jednostki (nie generyczny trójkąt)
- [ ] Brak frontu / pause → brak ikony produkcji
- [ ] Pigułka miasta gracza pokazuje poziom wzrostu (Wyżywienie / `poziomRacji`)
- [ ] `tsc --noEmit` 0 · `city-map-badge-test.cjs` PASS
- [ ] Bez deploy / bez merge main (Grok + hasło Macieja)

## AutoBot
Operator → Evaluator → Grok final. Deploy tylko na hasło.
