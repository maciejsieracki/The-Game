# Baseline screenshotów UX — checklist

| Grupa | Folder | Status | Data | Plików |
|-------|--------|--------|------|--------|
| A | `baseline/A/` | ✅ Baseline GOTOWE | 2026-07-01 | 8 |
| B | `baseline/B/` | ✅ Baseline GOTOWE | 2026-07-01 | 8 |
| C | `baseline/C/` | ✅ Baseline GOTOWE | 2026-07-01 | 7 |
| D | `baseline/D/` | ✅ Baseline GOTOWE | 2026-07-01 | 5 |
| E | `baseline/E/` | ✅ Baseline GOTOWE | 2026-07-01 | 6 |

Po redesignie: ten sam układ w `docs/ux/after/`.

Instrukcja: [`SCREENSHOTS-BASELINE.md`](SCREENSHOTS-BASELINE.md)

### Grupa B — szczegóły (2026-06-26)

Pliki: `B-01`, `B-02`, `B-15`, `B-17`, `B-29`, `B-30`, `B-33`, `B-34` (8 PNG).  
Narzędzie: `gra/tools/baseline-screenshots-grupa-b.mjs` (Playwright).  
**B-01…B-30:** `Gra-podglad-PLAYTEST-MIASTO.html` (Testpolis, panel otwarty).  
**B-33…B-34:** `Gra-podglad-PLAYTEST-MAPA.html` (toolbar 🦉 + drzewko dock).

### Grupa A — szczegóły (2026-07-01 · re-weryfikacja)

Pliki: `A-01`, `A-02`, `A-03`, `A-04`, `A-06`, `A-08`, `A-11`, `A-16` (8 PNG).  
Narzędzie: `gra/tools/baseline-screenshots-a.cjs` (Playwright + `Gra-podglad-PLAYTEST-MAPA.html`).  
**A-16:** mockup `UI/Makieta-preBattle.html` (headless nie trigeruje ataku j↔j na canvas) — **nadal**; ręczny zrzut przed layoutem Figma.  
**A-06:** ✅ potwierdzone **live** — panel stosu `.civ-army-stack` (aktualny silnik, nie mockup A2-Q4).

### Grupa E — szczegóły (2026-06-29)

Pliki: `E-01`, `E-03`, `E-09`, `E-10`, `E-11`, `E-15` (6 PNG).  
Narzędzie: `gra/tools/baseline-screenshots-E.cjs` (Playwright).  
**E-15:** overlay wstrzyknięty programowo (identyczny markup jak `showGameOverOverlay` w `main.ts`) — brak szybkiej ścieżki do zwycięstwa w playteście bez długiej rozgrywki.

### Grupa D — szczegóły (2026-06-29)

Pliki: `D-02`, `D-03`, `D-04`, `D-05`, `D-06` (5 PNG).  
Narzędzie: `gra/tools/baseline-screenshots-grupa-d.cjs` (Playwright).  
**Źródło:** `Gra-podglad.html` → Nowa gra → toolbar 🤝 → audiencja.  
**D-05 / D-06:** jeśli karta wojny zablokowana w playteście — modal wstrzyknięty (ten sam markup co `showWarConfirmModal` / `diplomacyPendingHud.ts`).

### Grupa C — szczegóły (2026-06-29)

Pliki: `C-01`, `C-06`, `C-07`, `C-08`, `C-09`, `C-19`, `C-21` (7 PNG).  
Narzędzie: `gra/tools/baseline-screenshots-grupa-c.mjs` (Playwright).  
**C-01:** `Gra-podglad.html` → Nowa gra → klawisz **T** (pre-bitwa).  
**C-06:** ten sam flow co C-01 → **Bitwa ręczna** (build `Gra-podglad-BITWA.html` pomija fazę deploymentu).  
**C-07…C-09, C-21:** `Gra-podglad-BITWA.html` → **T** → **Na pole bitwy**.  
**C-19:** `Gra-podglad-OBLEZENIE-BITWA.html` (mur + pasek **Brama**).  
**C-21:** panel wstrzyknięty na tle pola bitwy (markup `_showEndScreen` — **POMIN** omija ten ekran w buildzie testowym).
