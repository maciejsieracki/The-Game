# R-BASZTA + R-STOLICA-REGION — domknięcie wdrożenia

**Data audytu:** 2026-08-05  
**Operator:** AutoBot Tor 2  
**Źródła decyzji:** `dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §3, §5

## Checklist AC

| # | Kryterium | Status | Dowód |
|---|-----------|--------|-------|
| 1 | Baszta w `buildings.json` (epoka Żelaza, grupa Wojsko i obrona, brak `upgradeFrom`) | ✅ PASS | `gra/data/buildings.json` id `baszta` |
| 2 | Bonus +100% Obrony (`bonus_obrona_baszta_proc`) | ✅ PASS | `gra/data/miasto-params.json` wartość 100 |
| 3 | Suma Mury+Cytadela+Baszta = +400% | ✅ PASS | `gra/src/game/city-defense.ts` `cityWallDefenseBonusPercent` |
| 4 | Prereq Mury przed Basztą (DECYZJA 54a) | ✅ PASS | `gra/src/game/building-resource-gate.ts` `baszta: 'mury'` |
| 5 | Pałac I/II/III tylko stolica | ✅ PASS | `lokalizacja: stolica` + `production.ts` `buildingLocationAllowed` |
| 6 | Dom Starszyzny / Dwór / Pretorium tylko region | ✅ PASS | `lokalizacja: region` |
| 7 | Trybunał i Sąd wszędzie (brak `lokalizacja`) | ✅ PASS | brak pola w `buildings.json` |
| 8 | Ikona UI | ✅ PASS | `gra/src/ui/icons/brand/building-icon-map.json` `baszta` → `bld-fort` |
| 9 | Civpedia / encyklopedia | ✅ PASS | `docs/encyklopedia/budynki/baszta.md` (+ wzmianki w `mury.md`, `fort.md`) |
| 10 | Panel Excel | ⏸ poza scope | Budynki źródłem prawdy w JSON; brak dedykowanego Panel-B budynków |

## Wyniki testów (2026-08-05)

| Suite | Wynik |
|-------|-------|
| `npx tsc --noEmit` | PASS (0 błędów) |
| `administracja-stolica-test.cjs` | PASS 48/48 |
| `koszty-surowcowe-test.cjs` | PASS 128/128 |
| `city-defense-terrain-gate-test.cjs` | PASS 31/31 |
| `prereq-budynkow-test.cjs` (dodatkowo) | istnieje — asercje `baszta → mury` |

## Zmiany w tej sesji (gap-fill)

- Dokumentacja: rejestr + decyzje zaktualizowane (status WDROŻONE)
- `docs/encyklopedia/budynki/baszta.md` — karta Civpedia
- `gra/tools/administracja-stolica-test.cjs` — kontekst `empireResourceStock` w asercji Sądu (fix fałszywego FAIL)

**Kod gameplay:** bez zmian funkcjonalnych — implementacja była już na `main` (FALA 245).
