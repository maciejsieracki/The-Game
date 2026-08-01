# Archiwum toru rzek (render) — FALA 149 · 2026-08-01

## Po co
Eksperyment kill-switch `riverRenderStage` (diagnoza długiego „Budowanie sceny”).
**Kod rzek nie jest kasowany** — stage 0 tylko pomija wywołania w `buildScene`; funkcje (`renderLandRiversFromPaths`, `renderCoastalRiverExtension` itd.) zostają w `gra/src/render/scene.ts`.

## Snapshot pełnego pliku (sprzed kill-switch)
- **`scene-rivers-FULL-2026-08-01.ts`** — `gra/src/render/scene.ts` z git `HEAD` (commit sprzed FALA 149), bez `getRiverRenderStage` / bramki stage.
- `scene-FULL-przed-killswitch-2026-08-01.ts` — wcześniejsza kopia robocza (może zawierać kill-switch); **używaj pliku z prefiksem `scene-rivers-FULL-`**.

## Jak wrócić do pełnego renderu rzek

### Szybko (bez zmiany kodu)
1. URL: `?riverStage=5` (np. `START.html?riverStage=5`)
2. albo w konsoli przeglądarki: `localStorage.setItem('civ-river-render-stage','5')` → Ctrl+F5

### Po diagnozie (domyślny tor produkcyjny)
W `getRiverRenderStage()` zmień ostatni `return 0` na `return 5` (komentarz FALA 149 DIAG).

### Awaryjnie (cały plik sceny)
```powershell
Copy-Item -Force dyspozycje\_archiwum-rzeki\scene-rivers-FULL-2026-08-01.ts gra\src\render\scene.ts
```
Potem ewentualnie ręcznie dopnij inne zmiany spoza sekcji rzek.

## Stage (kill-switch)
| Stage | Render w `buildScene` |
|-------|------------------------|
| 0 | **zero** meshów rzek (domyślnie na eksperyment) |
| 1 | tylko `main` |
| 2 | main + medium |
| 3 | + short/tributary (ląd), bez ujść |
| 4 | jak 3 + coastal mouths |
| 5 | pełny tor (jak przed FALA 149) |

Kolejność odczytu: `?riverStage=` → `localStorage civ-river-render-stage` → default (0).
