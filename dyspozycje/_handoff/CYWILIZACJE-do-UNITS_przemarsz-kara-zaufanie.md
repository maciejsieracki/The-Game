# Handoff: CYWILIZACJE → UNITS (+ MAPA) — kara przemarszu

| Pole | Wartość |
|------|---------|
| **Status** | GOTOWE (spec) / CZEKA (implementacja) |
| **Decyzja** | `docs/decyzje/D3-przemarsz-kara-ABC.md` |
| **Parametr** | `params.karaPrzemarszNieautoryzowany_zaufanie_perTura` = **5** |

## Co przesyłam

- Reguła: **−5 Zaufanie/turę** u właściciela terytorium, **koniec tury**, **raz na parę** intruz→owner.
- Wyjątki: wojna, `OtwartGranice`, `PrawoWojskowePrzemarszu`, sojusz, wasal z prawem przemarszu.
- Cywil vs wojsko: ten sam check; wojsko wymaga traktatu wojskowego / sojuszu; cywil — otwarte granice.

## Co odbiorca ma zrobić

### UNITS (+ MAPA)

1. Na **koniec tury** (lub callback z SILNIK): dla każdej jednostki gracza/AI — heks → `ownerId` terytorium (`map/territory.ts` / istniejące API miast).
2. Zbierz unikalne pary `(intruderCivId, territoryOwnerId)` gdzie intruder ≠ owner.
3. Przekaż listę do **CYWILIZACJE** (`applyUnauthorizedBorderPenalty(pairs)`).

### CYWILIZACJE

1. Dla każdej pary: jeśli **nie** wojna i **brak** ważnego traktatu dostępu → `delta Zaufanie = -karaPrzemarszNieautoryzowany_zaufanie_perTura`.
2. Użyć istniejącego API relacji (`diplomacy.ts` / `applyRelationChange`).
3. Test: para w neutralności, 3 jednostki → **−5** (nie −15); z `OtwartGranice` → **0**.

### Integrator F (jeśli hook tylko w main)

- Wpięcie wywołania w ścieżce `endTurn` — **1 batch**, po testach lane.

## DoD

- [ ] JSON param odczytywany z `diplomacy.json`
- [ ] Test jednostkowy: 1 para, brak traktatu → −5 Zauf.
- [ ] Test: sojusz / otwarte granice → brak kary
- [ ] Test: 3 jednostki tej samej pary → nadal −5
- [ ] Opis akcji 4 w JSON zgodny z kanonem

## Kiedy handoff gotowy

**GOTOWE** — spec i parametr w JSON. Implementacja: **CZEKA** na slot lane UNITS/CYWILIZACJE.
