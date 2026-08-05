# R-CITY-PILL-PROD-ICON — ikony kolejki + poziom wzrostu na pigułce miasta

**Status:** 🟢 Evaluator PASS-WITH-NOTES · gotowe do deploy (Maciej pre-auth) · 2026-08-05  
**Ekran:** pigułka miasta na mapie świata (miasta **gracza**)

## ECHO (cytat)
> Na mieście gracza zamiast symbolu czy się buduje jednostka czy budynek powinny być symbole danego budynku, który jest budowany w danym momencie i dane jednostki, która w danym momencie je budowała. A jeżeli nie ma nic, to żadnego nie powinno być widoku na te rzeczy. Dodatkowo dobrze, żeby gracz mógł zobaczyć poziom wzrostu trudności.

## Interpretacja wdrożeniowa
1. **Zamiast generycznego glifu** (trójkąt=jednostka / prostokąt=budynek) → **ikona konkretnego** `frontItem.id` (budynek: `buildingIconSvg`, jednostka: `unitIconSvg` — ten sam zestaw co panel miasta).
2. **Pusta kolejka / wstrzymana** → **żadnej** ikony produkcji na pigułce (layout bez rezerwacji „pustego” slotu).
3. **„Poziom wzrostu trudności”** (w kontekście miasta) → **poziom Wyżywienia / wzrostu** (`poziomRacji`) widoczny na pigułce miasta gracza (kompaktowa etykieta, np. W1… / wartość z kanonu UI). *Jeśli Maciej miał na myśli globalną trudność gry — osobny follow-up HUD; tu scope = pigułka miasta.*
4. Scope UI: **miasta gracza** (ownerId gracza); AI/MP mogą zostać bez ikon szczegółowych / bez poziomu wzrostu albo dziedziczyć to samo jeśli tanie — preferuj **tylko gracz**.


## ECHO 2 (2026-08-05 ~14:48) — medalion: władca vs kultura
> zamiast widoku kultury, powinien być symbol władcy danego państwa, jeżeli chodzi o gracza. To samo w wypadku innych głównych A.I, nie dotyczy to państw, miast, gdzie symbol powinien być na mieście tylko kultury. wtedy będziemy wiedzieć, które to są miasta główne danej cywilizacji, które to są nasze główne miasta. bo nawet ten moment to się skleja razem z państwami miastami.

### Interpretacja
5. **Gracz + major AI** (nie MP / nie typCityCopy / nie simplifiedDiplomacy): medalion pigułki = **portret/symbol władcy** (`leaderPortraitUrl` + era) — ten sam kanon co żeton jednostki / dyplomacja / R-MP-PORTRET.
6. **Miasta-państwa** (`portraitForceCultureIcon` / `isCityStateOwner`): medalion = **tylko sygnet kultury** (`civIconSvg`) — bez portretu władcy głównej cywu.
7. Cel: wizualne odróżnienie stolic/miast major od MP tej samej kultury (dziś wszystko „skleja się”).

### Wiring (wzorzec już w grze)
- `setUnitOwnerEmblemAssets` + `isCityState: portraitForceCultureIcon(ownerId)` w `main.ts`
- Pigułka: `setCityMapBadgeCivSigil` + **`setCityMapBadgeLeaderPortrait`** (`leaderPortraitUrl`) + `isCityState` / `era` w `CityMapBadgeInput` → `_buildBadgeInput` / `_cityRenderOpts`

### ECHO2 wdrożone (Operator)
- `cityMapStatChip.ts`: `setCityMapBadgeLeaderPortrait`, async cache portretu, `drawCivMedallion` — major = portret (fallback sygnet), MP = tylko sygnet
- `cities.ts`: `isCityStateOwner` + `era` w badge input
- `main.ts`: injection `leaderPortraitUrl` + `isCityStateOwner: portraitForceCultureIcon`
- `cityMapBadgeKey`: segmenty `cs0`/`cs1` + `e{N}`

## Pliki (oczekiwane)
- `gra/src/render/cityMapStatChip.ts` — rysunek + cache key
- `gra/src/render/cities.ts` — badge input (prodId + growth)
- `gra/src/main.ts` — injection SVG ikon produkcji (wzorzec `setCityMapBadgeCivSigil`); **nie** duża logika w main poza wiringiem
- `gra/tools/city-map-badge-test.cjs` — rozszerzyć asercje klucza / helperów

## AC
- [x] Front budynku → ikona tego budynku (nie generyczny prostokąt)
- [x] Front jednostki → ikona tej jednostki (nie generyczny trójkąt)
- [x] Brak frontu / pause → brak ikony produkcji
- [x] Pigułka miasta gracza pokazuje poziom wzrostu (Wyżywienie / `poziomRacji`)
- [x] Gracz + major AI: medalion = portret/symbol **władcy** (nie sam sygnet kultury) — ECHO2
- [x] Miasta-państwa: medalion = **tylko kultura** (bez władcy głównej cywu) — ECHO2
- [x] `tsc --noEmit` 0 · `city-map-badge-test.cjs` **27/27** PASS
- [x] AutoBot PASS · Maciej: deploy po skończeniu (hasło 14:52)

## AutoBot
Operator → Evaluator → Grok final. Deploy tylko na hasło.

## Note Evaluatora (zaakceptowane)
- Ikony produkcji na pigułce: dla wszystkich ownerów (tanie dziedziczenie); growth tylko gracz.
- Testy = klucze cache, nie pixel — playtest wizualny po deploy.
