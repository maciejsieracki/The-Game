# CYWILIZACJE → UNITS (przez MASTER): Katapulta epoka Żelazo — D10=A

**Data:** 2026-06-26 · **Decyzja Macieja:** D10=A · **Lane nadawca:** CYWILIZACJE · **Odbiorca:** UNITS (+ SILNIK wpiecie oblężenia)

## Co przesyłam (dane — DONE w CYWILIZACJE)

| Element | Plik | Wartość | Status |
|---|---|---|---|
| Katapulta epoka | `gra/data/units.json` | `"Epoka": "Żelazo"`, `"Dostępna w epokach": "Żelazo"` | ✅ już było |
| Katapulta tech | `gra/data/units.json` | `"Tech": "Oblężnictwo"` | ✅ zaktualizowane (było `"-"`) |
| Warsztat oblężniczy epoka | `gra/data/buildings.json` | `epokaWejscia: 3` (= Żelazo) | ✅ już było (korekta EKONOMIA 2026-06-26) |
| Tech unlock | `gra/data/tech.json` | Oblężnictwo → Warsztat oblężniczy | ✅ istnieje |

Backup: `units.json.bak-CYWILIZACJE-2026-06-26`.

## Co Odbiorca (UNITS) ma z tym zrobić

1. **Weryfikacja gate produkcji oblężniczej:** Katapulta dostępna dopiero po tech **Oblężnictwo** + budynek **Warsztat oblężniczy** (epoka 3). Sprawdź `production.ts` / kontrakty oblężenia — czy respektują `Epoka` + `Tech` z units.json.
2. **Siege build flow:** Katapulta budowana podczas oblężenia (1 tura) — potwierdź że UI/bitwa nie odblokowuje jej przed Żelazem.
3. **Pozostałe machiny:** Taran / Wieża oblężnicza — czy epoka/Tech spójne z D10 (Katapulta=Żelazo; Wieża=Brąz per units.json — OK).

## Kiedy handoff jest gotowy

**GOTOWE** (dane CYWILIZACJE). Czeka UNITS na weryfikację kodu + testy combat/siege.

## DoD (MASTER/Opus sprawdza)

- [ ] Katapulta nie pojawia się w pickerze produkcji przed tech Oblężnictwo + Warsztat oblężniczy.
- [ ] `node tools/combat-test.cjs` + `node tools/battle-smoke.cjs` — bez regresji gate epoki.
- [ ] Dokumentacja UNITS odnotowuje D10=A (Żelazo v1.0).
