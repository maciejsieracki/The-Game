# BUG-PALISADA-BRAK — korekta epoki Palisady drewnianej

**Status:** ZAMKNIĘTE (korekta danych) · 2026-07-29  
**Powiązane:** `BUG-PALISADA-BRAK` w `dyspozycje/PYTANIA-OTWARTE.md`

## Cytat Macieja

> Palisada miała być w epoce KAMIENIA. Korekta nieporozumienia: **nie Brąz** — **epoka Kamienia**.

## Stan po korekcie

| Pole | Wartość |
|------|---------|
| `buildings.json` → `palisada.epokaWejscia` | **1** (Kamień) |
| `buildings.json` → `palisada.techUnlock` | **Obróbka drewna** (bez zmiany) |
| Tech „Obróbka drewna" (`tech.json`) | Epoka **Kamień**, Poziom 1 — już była w Kamieniu; **nie wymagała przeniesienia** |
| Bonus Obrony | **+100%** (`bonus_obrona_palisada_proc`) — bez zmiany |
| Mury kamienne | +200%, **zastępują** palisadę (bez stacku) — bez zmiany |

## Pliki zmienione

- `gra/data/buildings.json` — `epokaWejscia: 1`, uwagi
- `gra/data/miasto-params.json` — opis epoki w `bonus_obrona_palisada_proc`
- `gra/tools/koszty-surowcowe-test.cjs` — §B (usunięty wyjątek Brąz), §J (dostępność w Kamieniu)

## Uwaga historyczna

Wcześniejsza implementacja (2026-07-28) błędnie ustawiła `epokaWejscia: 2` (Brąz), mimo że tech odblokowująca jest kamienna. To powodowało, że po zbadaniu Obróbki drewna w Kamieniu gracz widział Stolarnię, ale nie Palisadę.
