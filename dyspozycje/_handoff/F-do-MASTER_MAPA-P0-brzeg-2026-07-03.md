# F → MASTER: batch MAPA-P0 brzeg hybryda C + delta A

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-03 |
| **Batch** | MAPA-P0 (brzeg C + delta A) |
| **Handoff lane** | `MAPA-do-MASTER_brzeg-hybrid-C-2026-07-03.md` |
| **Poprzedni ROBOCZA** | `ce71d449e004d8068acfa8b7a5d3c9b1` |
| **Kanon (bez zmian)** | `ce71d449e004d8068acfa8b7a5d3c9b1` |

---

## Scope

| Plik | Zmiana |
|------|--------|
| `gra/src/render/mapRenderStyle.ts` | land beach cap, coast sand top, delta fan |
| `gra/src/render/scene.ts` | montaż + szersze ujście rzeki |
| `gra/tools/map-coast-buffer-test.cjs` | 81/81 |

**F NIE edytował kodu lane** — build + publish ROBOCZA.

---

## Bramka

| Test | Wynik |
|------|-------|
| map-coast-buffer | **81/81** |
| logic-test | **203/203** |
| smoke | OK |
| battle-smoke | OK |
| typecheck | pre-existing FAIL (battleScene, loader — baseline) |
| vite build | OK · 472 modułów |

---

## Publish ROBOCZA

| Target | md5 |
|--------|-----|
| **`gra-robocza/`** | **`3ea10008dcc48efc869d5dd57e264a2f`** |
| **`Gra-podglad-ROBOCZA.html`** | ten sam |
| **`gra-kanon/`** | **NIE dotykane** (`ce71d449…`) |

**Start testowy:** `gra-robocza/START.html` · **Ctrl+F5 · nowa gra**

---

## Następny krok Master

Review scope → Maciej playtest brzeg (piasek ląd+Wybrzeże, delta u ujścia) → **`start3`** promocja kanon
