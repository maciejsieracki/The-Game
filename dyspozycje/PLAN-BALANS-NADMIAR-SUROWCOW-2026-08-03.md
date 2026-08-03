**Aktualizacja 2026-08-03:** Maciej → **×2 koszty** (badania, upkeep jednostek, budowa budynków, żywność ludność+wojsko); **bez** cięcia produkcji. Playtest po wdrożeniu.

# Plan: nadmiar surowców / zasobów — sesja balansu (jutro)

**Data zapisu:** 2026-08-03  
**Branch:** `cursor/plan-balans-nadmiar-surowcow-63a1`  
**Źródło:** Maciej (playtest) — HUD mid-game: Skarbiec ~5190 (+188/t), Praca ~3781 (+259/t), Spichlerz ~1300 (+250/t), Nauka ~721 (+236/t). Ocena: **nadmiar bez wysiłku**.

> Maciej: *„Jutro musimy przemyśleć, co musimy zoptymalizować. Czy podrożyć koszty budynków i ulepszeń, czy zwiększyć koszty produkcji i ulepszeń oraz nauki.”*

## Co już wiemy z repo

- Wcześniejsza analiza: `dyspozycje/BILANS-SUROWCE-100T-2026-07-25.md` (NADMIAR przy pełnym K+Brąz).
- Rejestr: **R-STAWKI-STROJENIE** — czekało na playtest z licznikami HUD (ten playtest to właśnie sygnał).
- Mnożniki kreatora już są: tempo budynków / jednostek / badań (×1 / ×2 / ×4) — ale bazowe wartości w JSON mogą być za hojne nawet na „Normalnym”.

## Dwie osie z pytania Macieja (do ABC jutro)

| Oś | Co podnosimy | Pliki |
|----|--------------|--------|
| **1 — Koszty budowy** | budynki (`kosztBudowy`) + ulepszenia terenu (`koszt_praca`) | `buildings.json`, `terrain-improvements.json` (+ panele B/A) |
| **2 — Koszty produkcji + nauki** | jednostki w kolejce + ulepszenia + `Koszt nauki` tech | `units.json`, `terrain-improvements.json`, `tech.json` (+ C / tempo) |

Uwaga: „ulepszenia” pojawiają się w obu — jutro rozstrzygnąć, czy liczą się z budynkami (oś 1), z produkcją (oś 2), czy w obu.

## Trzecia oś (rekomendowana do rozważenia)

**Dochody w dół** zamiast (lub obok) kosztów w górę:
- plony terenu (`terrain-yields.json`)
- bonusy budynków (`baza` / `przyrost`)
- bonusy ulepszeń (`bonus.*`)
- Młyn / Mennica / suwaki (`econ-params.json`)

Często skuteczniejsze niż same droższe koszty: przy +259 Pracy/turę nawet ×2 koszt budynku znika szybko.

## Szkic decyzji (pełne ABC jutro)

1. **Gdzie ciąć:** tylko koszty (oś 1 / 2 / obie) **vs** tylko dochody **vs** mix (np. koszty ×1,5 + dochody −20%).
2. **Od której epoki:** globalnie od Kamienia **vs** dopiero Brąz+ (Kamień zostaje „hojny” na naukę gry).
3. **Surowce strategiczne (ikona ⚠ na HUD):** osobny sink (zużycie przy budowie/rekrutacji) **vs** tylko podnieść `koszt_surowce` budynków — nie mylić ze Skarbcem/Pracą/Nauką.

## Zakaz na dziś

Bez zmian liczb w JSON / panelach — tylko zapis tematu. Sesja jutro: pomiary + ABC + dopiero `działaj`.

## Playtest — punkt odniesienia (Maciej 2026-08-03)

| Zasób | Stan | Przyrost/t |
|-------|------|------------|
| Skarbiec | ~5190 | +188 |
| Praca | ~3781 | +259 |
| Spichlerz | ~1300 | +250 |
| Nauka | ~721 | +236 |
| Surowce | ⚠ (cap/overflow?) | — |
| Handel | 0 | — |
