# GRUPA F → MASTER: E-P0-06 victory screen wiring

| Pole | Wartość |
|------|---------|
| **Status** | 🟠 **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-02 |
| **Batch** | `VICTORY-E-P0-06` |
| **Handoff źródłowy** | `CYWILIZACJE-do-INTEGRATOR_victory-screen-2026-07-02.md` |
| **Poprzedni ROBOCZA** | `01490681afbc7e67d5182992989597df` (SILNIK-D-V11) |

---

## Scope (main.ts only)

| # | AC | Zmiana |
|---|-----|--------|
| 1 | Import | `showVictoryScreen`, `buildVictoryScreenData`, `formatVictoryTitle` z `./ui/victoryScreen`; `powerShare` z `./game/victory` |
| 2 | Usunięcie legacy | Lokalna `showGameOverOverlay` (~2737–2777) — usunięta |
| 3 | VICTORY CHECK (~7672) | `buildVictoryScreenData` + `showVictoryScreen(reload)`; hint tylko przy wygranej (`formatVictoryTitle`) |

**Backup:** `gra/src/main.ts.bak-VICTORY-2026-07-02`

**Warstwa:** 🟡 cross (main.ts + UI shell E-P0-06)

---

## Bramka

| Test | Wynik |
|------|-------|
| victory-test | **12/12** |
| victory-screen-test | **11/11** |
| smoke | **OK** |
| vite build (`$env:TEMP\civ-dist`) | **OK** |
| `npx tsc --noEmit` | **pre-existing errors** (nie regresja batchu — jak poprzednie F) |

---

## Publish

| Target | md5 | Status |
|--------|-----|--------|
| **`Gra-podglad.html`** (root) | **`188437eb1b81b165aee6decafa216e0b`** | ✅ |
| **`gra-robocza/`** | **`188437eb1b81b165aee6decafa216e0b`** | ✅ |
| **`gra-kanon/`** | **`188437eb1b81b165aee6decafa216e0b`** | ✅ (sync ręczny — patrz blockery) |
| **`Gra-podglad-ROBOCZA.html`** | ten sam bundle | ✅ |

**Jeden md5** — root = robocza = kanon.

---

## Co sprawdzić po wpięciu (playtest)

1. Wygrana dominacją (Power >50%, epoka Żelazo) — stat Power % + opis progu 50%
2. Wygrana naukowa (`rakietaWystrzelona=true`) — opis rakiety
3. Przegrana (zero miast + zero osadników) — wariant czerwony + CTA „Nowa gra"
4. Przycisk „Nowa gra" → `location.reload()`

---

## Blockery

- **`publish-kanon-snapshot.ps1`** — błąd parsera PowerShell (UTF-8 w throw/Here-String). Kanon zsynchronizowany ręcznie (archiwum `gra-kanon_20260701-145845` → copy z `gra-robocza/`). **Rekomendacja Master:** naprawić encoding w skrypcie.
- Brak blokera gameplay / testów batchu.

---

## Pliki zmienione (F)

| Plik | Zmiana |
|------|--------|
| `gra/src/main.ts` | wpięcie E-P0-06 victory screen |
| `gra/src/main.ts.bak-VICTORY-2026-07-02` | backup przed edycją |
| `gra-robocza/` | full snapshot |
| `gra-kanon/` | sync z robocza |
| `Gra-podglad.html` | root bundle |
