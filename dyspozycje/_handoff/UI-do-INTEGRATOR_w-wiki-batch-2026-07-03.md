# UI → INTEGRATOR: Wikipedia batch (W-WIKI-1 + W-WIKI-2)

> **Status:** ✅ ZINTEGROWANE · **Data:** 2026-07-03 · **main.ts:** bez zmian

## Co lane dostarczył

| Obszar | Pliki |
|--------|--------|
| Wikipedia HUD | `hud.ts`, `wikiHubHud.ts`, `markdownLite.ts`, `brandTokenVars.ts` |
| Ikona Design | `icons/brand/tier5/ui-wiki-24.svg`, `ui-wiki-40.svg`, `icons-manifest.json` |
| Ikona wrapper | `icons/wikiBookIcon.ts` → `brandIconSvg('ui-wiki')` |
| Treść | `data/wikiBundle.json` (~708 KB, 22+130) |
| Fix kreatora | `newGameFlow.ts` — `civMinStartEpochIndex` / `startEpochIndex` |

## DoD Integratora

- [x] Bramka PASS (logic, combat, diplomacy, ai, smoke, battle-smoke)
- [x] Build → `gra-robocza/` snapshot
- [x] **NIE** dotykać root `Gra-podglad.html` (kanon)

Meldunek: `F-do-MASTER_W-WIKI-2026-07-03.md`
