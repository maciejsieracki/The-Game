# EKONOMIA → MASTER / UI — Manpower + Pobór we Wpływie

**Status:** GOTOWE (2026-06-26)

## Co dostarczono

1. **Kanon regen 10%** + mnożnik per cyw (`bonus_pobor_regen` w civs.json).
2. **Składnik Wpływu „Pobór”** — ludność absolutna + rekruci (pole `ludnosc` w PotegaKomponenty).
3. **HUD mapy** — pod ⚜ Wpływ: `X rekruci`.
4. **Dokumentacja:** `dyspozycje/_scalone/EKONOMIA/EKONOMIA-manpower-pobor.md`.

## Wpięcie w main.ts (zrobione w tym batchu)

- `buildPowerSnapshotsForTurn` → `ludnoscAbsolutna`, `rekruci` z `empirePoborTotals`.
- `buildHudState` → `rekruci`, `rekruciLabel`.
- Overlay Power → etykieta „Pobór (ludność + rekruci)”.

## DoD

- [x] Rzymianie regen szybszy niż Grecy (bonus w civs.json).
- [x] Wpływ uwzględnia ludność + rekrutów.
- [x] HUD pokazuje rekrutów obok Wpływu.
- [ ] Panel miasta: snapshot MP + regen/t (UI lane — osobny batch).
- [ ] Kanon HTML po review Opus.

## Test

```bash
cd gra && node tools/manpower-test.cjs
```
