# Archiwum — legacy Moc / Potęga / Respekt (0–100)

> **Nie czytaj na starcie sesji.** To stare specyfikacje — powodowały mylenie z kanonem P-A.

## Jedyny aktywny kanon Mocy

**`docs/decyzje/P-A-power-kanon.md`** — 9 składników, ~3020 pkt, Respekt = ratio, HUD „Moc”.

Kod: `gra/src/game/power-objective.ts` · `gra/data/power-params.json` · test `power-objective-test.cjs`.

## Co tu leży (tylko historia)

| Plik | Dlaczego archiwum |
|------|-------------------|
| `A1-Power-HUD-centrum.md` | Model **0–100**, 6 wag %, `computePotegaNacji()` — **superseded** przez P-A |
| `B-power-skladniki.md` | Wagi z `diplomacy.json` (18/14/12%) — **superseded** |
| `P-C2-P-ARMIA-ABC.md` | Tuning v1.1 — **zamrożone** flat ×25, nie ABC, nie blokuje v1 |
| `SPEC-Respekt-legacy-0-100.md` | Potęga 6 składników 28/20/18… — **superseded** |

## Nie mylić z

| System | Gdzie | To NIE jest wzór Mocy imperium |
|--------|-------|--------------------------------|
| Macierz Cyw (~12 tematów) | Excel Cyw-macierz | mnożniki cywilizacji |
| Szczęście w mieście (~12) | Grupa B | panel miasta |
| `diplomacy.json` → `respekt_-_czynniki` | JSON | dokumentacja legacy, silnik nie używa |

*Przeniesiono: 2026-06-26 (decyzja Macieja — porządek docs)*
