# Panel C — inwentaryzacja parametrów (Grupa C / Walka)

**Data:** 2026-06-29 · **Spec:** `docs/obieg/PANEL-STEROWANIA-SPEC.md` · **Sync F250:** 2026-08-06 — `gen-panel-c.py` regen z `units.json` (Surowiec ×5 + Utrzymanie surowiec); tip FALA 250 `796fc7a7`.

## Źródła zebrane

| Kategoria | Plik w grze | Arkusz w Panel-C.xlsx |
|-----------|-------------|------------------------|
| Macierz jednostek v2.0 (9 jedn. Brąz/Żelazo) | `gra/data/units.json` | `Macierz-jednostek` |
| Koszty rekrutacji + utrzymanie surowcowe (F250 ×5) | `gra/data/units.json` | `Koszty-jednostek` (`Surowiec`, `Surowiec (ilość)`, `Utrzymanie surowiec`, `Utrzymanie surowiec (ilość)`) |
| Stałe walki (SS5l + macierz v2) | `gra/data/combat-params.json` | `Stale-walki` |
| Oblężenie (mury, milicja, rundy) | `gra/data/combat-params.json` § oblężenie | `Oblezenie` |
| Countery typów | `gra/data/counters.json` | `Countery` |
| Teren w walce | `gra/data/terrain-combat.json` | `Teren-walka` (readonly ref) |

## Jednostki w macierzy (C4-Q1=A)

Wojownik · Zwiadowca · Łucznik · Wojownik z mieczem i tarczą · Włócznik · Rydwan (woły) · Konnica · Falanga · Hastati (= Legionista w analizie)

## Stałe w kodzie (wyprowadzone do JSON)

| ID | Wartość | Było w |
|----|---------|--------|
| C-MAT-HIT-BASE | 35 | `combat.ts` hitChanceMatrix |
| C-MAT-HIT-MIN/MAX | 8 / 90 | j.w. |
| C-MAT-DMG-SCALE | 10 | macierz v2 dmg/10 |
| C-MAT-PANC-DIV | 200 | macierz v2 |
| C-MAT-MAX-ROUNDS | 200 | resolveCombat matrixMode |
| C-LEG-HIT-BASE | 50 | SS5l hitChance |
| C-LEG-MAX-ROUNDS | 30 | SS5l melee |
| C-COUNTER-MULT | 1.5 | counterMultiplier |
| C-SIEGE-* | patrz JSON | `siege.ts` fallbacki |

## Otwarte zadania przeniesione (nic nie ginie)

- Korekty balansu po v1.0 (Legionista OP, Falanga vs Włócznik) → `docs/ROADMAP.md` Rozdz. 4 · backlog C4 post-v1
- Mechanika zasięgu Łucznika → backlog C (post-v1.0)
- `Macierz-walki.xlsx` (Excel źródłowy poza repo) → zastąpiony przez `Panel-C.xlsx`

## Archiwum

Analiza tekstowa pozostaje: `Civ-UNITS/Macierz-walki-analiza.md` (referencja, nie źródło prawdy).
