# F → MASTER: batch CUDA-G1 (wonder-availability build + ROBOCZA)

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-03 |
| **Batch** | `CUDA-G1` (CYWILIZACJE · wonder-availability) |
| **Dyspozycja** | `MASTER-do-INTEGRATOR_CUDA-G1-2026-07-03.md` |
| **Handoff lane** | `CYWILIZACJE-do-MASTER_cuda-g1-wonder-availability.md` |
| **Poprzedni ROBOCZA** | `9b609961317734673d881e1604e04a7d` (W-WIKI) |
| **Poprzedni kanon** | `2a786b9f4f0ce934cd24eac5c434324a` (bez zmian) |

---

## Scope (F — build + publish only)

**`main.ts` pre-wired** (MASTER batch): `completedWorldWonders`, `#civ-wonders-picker`, save/load, produkcja cudu, ukończenie.

| # | Element | Pliki |
|---|---------|--------|
| 1 | Moduł bramki cudu | `gra/src/game/wonder-availability.ts` (lane CYWILIZACJE) |
| 2 | Wiring silnik | `gra/src/main.ts` — **już gotowe przed F** |
| 3 | Backup F | `gra/src/main.ts.bak-CUDA-G1-2026-07-03` |

**F NIE edytował `main.ts`** — tylko backup, bramka, publish ROBOCZA.

---

## Testy lane (pre-bramka)

| Test | Wynik |
|------|-------|
| `wonder-availability-test.cjs` | **7/7** |
| `civ-entry-epoch-test.cjs` | **11/11** |
| `wonder-civ-tech-test.cjs` | **5/5** |

---

## Bramka (`.\tools\bramka-test-publish.ps1`)

| Test | Wynik |
|------|-------|
| typecheck | pre-existing errors (battleScene, loader — nie regresja CUDA-G1) |
| wire-ekonomia | **34/34** |
| logic-test | **203/203** |
| combat-test | **6/6** |
| post-battle-map | **10/10** |
| army-merge-bounce | **2/2** |
| civ-bonusy | **33/33** |
| diplomacy | **143/143** |
| ai | **193/198** (5× T2S baseline — oczekiwane) |
| smoke | **OK** |
| battle-smoke | **OK** |
| vite build → `$env:TEMP\civ-dist` | **OK** · 472 modułów · ~8.39 MB |

---

## Publish (tylko ROBOCZA — bez kanonu)

| Target | md5 | Status |
|--------|-----|--------|
| **`gra-robocza/`** | **`e8f0ac22dcf022ed3c814f2f8e9a6077`** | ✅ |
| **`Gra-podglad-ROBOCZA.html`** (legacy root) | ten sam | ✅ |
| **`Gra-podglad.html`** (kanon root) | `2a786b9f4f0ce934cd24eac5c434324a` | ✅ NIE dotykane |
| **`gra-kanon/`** | bez zmian | ✅ NIE dotykane |

**Start testowy:** `gra-robocza/START.html` · **Ctrl+F5**

**Dowód bundle (grep `gra-robocza/Gra-podglad.html`):**
- `civ-wonders-picker` ✅
- `__wonder__` ✅
- `completedWorldWonders` ✅

**`ROBOCZA-MANIFEST.json`:** zaktualizowany · `publishedAt: 2026-07-03T14:10:49`

---

## Co sprawdzić (Master review)

1. Toolbar mapy: przycisk **Cuda** → picker `#civ-wonders-picker`
2. Grecy ep.3 + Inżynieria → Kolos na liście; ep.1 → brak
3. Wyrocznia R: widoczna po Mistycyzm; po zbudowaniu — znika z listy
4. Save/load: `completedWorldWonders` w meta

**NIE w scope:** bonusy cudu, utrzymanie (CUDA-G2).

---

## Następny krok Master

- Review scope → Opus przed kanonem (handoff lane)
- Promocja kanon — **osobna dyspozycja** po APPROVE
