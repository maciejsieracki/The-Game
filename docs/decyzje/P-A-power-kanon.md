# P-A — MOC (Power) — jedyny aktywny kanon

| Pole | Wartość |
|------|---------|
| **ID** | P-A |
| **Decyzja Macieja** | **PRZYJĘTE** (2026-06-26) · ludki **5 pkt** |
| **Status** | **ZAMKNIĘTE w kanonie v1** · **zmiana planowana:** P-C2=B* + P-ARMIA=B (2026-06-26, po testach) |
| **Nazwa UI** | **Moc** (P-C3) |
| **Legacy** | [`docs/archiwum/decyzje-legacy-moc/README.md`](../archiwum/decyzje-legacy-moc/README.md) |

---

## 9 składników (pkt absolutne)

| # | Składnik | Miara | pkt |
|---|----------|-------|-----|
| 1 | Armia | jednostki na mapie | **25** |
| 2 | Wygrane bitwy | kumulacja | **25** |
| 3 | Ludki | suma slotów populacji | **5** |
| 4 | Rekruci | ekw. jednostek (pula ÷ koszt werbu) | **5** |
| 5 | Miasta | liczba | **50** |
| 6 | Terytorium | heksy | **0,5** |
| 7 | Budynki | wybudowane | **5** |
| 8 | Tech | zbadane | **20** |
| 9 | Ulepszenia terenu | w terytorium | **5** |

**Moc** = suma (surowa × współczynnik). Kalibracja ep.1 ≈ **3020** (~10 miast, ~100 ludków).

**Respekt:** `100 × Moc_ja / (Moc_ja + Moc_oni)` · progi dyplomacji **60 / 70 / 90** — bez zmian.

---

## HUD (A1-Q15=A — zamknięte)

- Środek paska: **⚜ liczba · Moc**
- Klik → overlay: 9 składników + ranking + Respekt per nacja
- Respekt **nie** na środku HUD — tylko dyplomacja / overlay

---

## Kod i dane

| Co | Gdzie |
|----|-------|
| Liczenie | `gra/src/game/power-objective.ts` → `buildObjectivePowerForOwner()` |
| Cache co turę | `refreshObjectivePowerCache()` w `main.ts` |
| HUD | `buildHudState()` · `buildPowerOverlayData()` |
| Respekt | `computeRespekt()` w `diplomacy.ts` |
| Parametry | `gra/data/power-params.json` ← Panel-B `Potega-P-A` |
| Testy | `power-objective-test.cjs` 9/9 · `diplomacy-test.cjs` 135/135 |

**Martwy kod (nie używać):** `computePotegaComponents()` / stary model 0–100 w `main.ts` — do usunięcia w batch cleanup, nie liczy Mocy.

---

## Panel sterowania

| Panel | Eksport |
|-------|---------|
| Panel-B `Potega-P-A` | `export-b.py` → `power-params.json` |
| Panel-B `Potega-opcje` | nazwa HUD (Moc) |
| Panel-B `Manpower-epoki` | `epoka-ludnosc-manpower.json` |

---

## Powiązane (aktywne)

- Tuning progów: `docs/decyzje/D3-moc-respekt-tuning-scenariusze.md`
- UX dyplomacji: `docs/decyzje/D3-UX-relacja-parametry-ABC.md` (BBBB)

---

*Źródło: Maciej, 2026-06-26 · archiwizacja legacy: 2026-06-26*
