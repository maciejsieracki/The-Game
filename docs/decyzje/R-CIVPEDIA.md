# R-CIVPEDIA — rename Wiki→Civpedia + treść encyklopedii

**Data:** 2026-08-05  
**Status:** WDROŻONE (kod + docs, bez deploy)  
**Branch:** `cursor/civpedia-63a1`

## Zakres

| # | Kryterium | Status | Dowód |
|---|-----------|--------|-------|
| a | Etykiety UI „wiki"/„Wikipedia" → **Civpedia** (przycisk HUD, panel, aria) | ✅ | `gra/src/ui/hud.ts`, `wikiHubHud.ts` |
| b | Spot-check treści vs sesja (magazyn 500, Baszta, …) | ✅ | `baszta.md` w bundle; `45-katalog-budynkow.md` + `indeks.md` |
| c | Regen `wikiBundle.json` | ✅ | `node gra/tools/bundle-wiki-for-game.cjs` → 136 haseł |
| d | `tsc --noEmit` 0 | ✅ | bramka sesji |

## Zmiany UI (gracz widzi)

- Przycisk HUD: **Civpedia** + `aria-label` / `title`
- Panel boczny: tytuł **Civpedia**, `role="dialog"`, aria na zakładkach i wyszukiwarce
- Klasy techniczne `.b-wiki`, `data-act="wiki"` — bez zmian (zgodnie z AC)

## Zmiany treści

- `docs/encyklopedia/indeks.md` — Baszta, nagłówek Civpedia, 27 budynków
- `docs/PORADNIK-GRACZA/00-jak-czytac.md` §0.5 — Poradnik vs Civpedia (Skrót/Hasło)
- `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` — wiersz Baszta, kolumna Civpedia
- `gra/src/data/wikiBundle.json` — `rev-civpedia-2026-08-05` (22 rozdz. + 136 haseł)

## Uwagi

- Wcześniejszy deploy FALA 8 (`5cf79a3`) wdrożył część rename; ta sesja domyka resztę etykiet + lukę Baszty w bundle.
- Deploy ROBOCZA — osobno na hasło właściciela.
