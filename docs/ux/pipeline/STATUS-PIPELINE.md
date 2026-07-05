# STATUS — pipeline UX (mockupy → Claude Design → kod)

**Checklist A→Z:** [`SCHEMAT-AZ-UX-PIPELINE.md`](../SCHEMAT-AZ-UX-PIPELINE.md) — odhaczaj fazy 0–8

**Data raportu:** 2026-07-01  
**Decyzje stylu:** 1B, 2C, 3C, 4C, 5C, 6C, 7A, 8A · [`DECYZJE-WARSTWA1-MACIEJ.md`](../DECYZJE-WARSTWA1-MACIEJ.md)  
**Figma:** odstawiona na ten etap · **Claude Design (Max):** aktywna ścieżka Macieja

---

## Podsumowanie

| Metryka | Wartość |
|---------|---------|
| Foldery pipeline | ✅ utworzone |
| Pliki w `01-wejscie/` | **0 / 34** |
| Pliki w `02-po-design/` | **0 / 34** |
| Kod wdrożony z pipeline | **0** |
| Grupa w toku | **E** (pierwsza) |

---

## Katalogi zapisu (per grupa)

| Grupa | WEJŚCIE (grupy zapisują tutaj) | PO Design (Maciej) | Min. plików |
|-------|--------------------------------|--------------------|-------------|
| **E** | `01-wejscie/grupa-E/` | `02-po-design/grupa-E/` | 6 (+1 opc.) |
| **A** | `01-wejscie/grupa-A/` | `02-po-design/grupa-A/` | 8 |
| **B** | `01-wejscie/grupa-B/` | `02-po-design/grupa-B/` | 8 |
| **C** | `01-wejscie/grupa-C/` | `02-po-design/grupa-C/` | 7 |
| **D** | `01-wejscie/grupa-D/` | `02-po-design/grupa-D/` | 5 |

Pełna ścieżka Windows (przykład E):

`C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\docs\ux\pipeline\01-wejscie\grupa-E\`

---

## Postęp per grupa

### Grupa E — menu · kreator · game over (PIERWSZA)

**Folder wejścia:** `01-wejscie/grupa-E/` · meldunek: `RAPORT-WEJSCIE.md`

| Plik | Wejście | PO Design | Kod |
|------|---------|-----------|-----|
| E-01_menu-glowne | ⏳ | ⏳ | ⏳ |
| E-03_ustawienia | ⏳ | ⏳ | ⏳ |
| E-09_kreator-krok2-epoka | ⏳ | ⏳ | ⏳ |
| E-10_kreator-krok3-cywilizacja | ⏳ | ⏳ | ⏳ |
| E-11_kreator-krok4-ustawienia | ⏳ | ⏳ | ⏳ |
| E-15_game-over | ⏳ | ⏳ | ⏳ |
| E-15b_game-over-porazka (opc.) | ⏳ | ⏳ | ⏳ |

**Komunikat do grupy:** wysłany (Maciej) · baseline referencja: `docs/ux/baseline/E/` ✅

---

### Grupa A — HUD mapa

**Folder:** `01-wejscie/grupa-A/` · **start:** po sygnale (E / Maciej)

| Plik | Wejście | PO | Kod |
|------|---------|-----|-----|
| A-01_hud-gora | ⏳ | ⏳ | ⏳ |
| A-02_toolbar | ⏳ | ⏳ | ⏳ |
| A-03_dolny-pasek | ⏳ | ⏳ | ⏳ |
| A-04_panel-wydarzen | ⏳ | ⏳ | ⏳ |
| A-06_panel-jednostki | ⏳ | ⏳ | ⏳ |
| A-08_tryb-budowy | ⏳ | ⏳ | ⏳ |
| A-11_lista-dyplomacji | ⏳ | ⏳ | ⏳ |
| A-16_pre-bitwa | ⏳ | ⏳ | ⏳ |

---

### Grupa B — miasto · nauka

**Folder:** `01-wejscie/grupa-B/` · **start:** po E (+ A)

8 plików: B-01, B-02, B-15, B-17, B-29, B-30, B-33, B-34 — wszystkie ⏳

---

### Grupa C — walka

**Folder:** `01-wejscie/grupa-C/` · **start:** po E, A, B, D

7 plików: C-01, C-06, C-07, C-08, C-09, C-19, C-21 — wszystkie ⏳

---

### Grupa D — dyplomacja

**Folder:** `01-wejscie/grupa-D/` · **start:** po E, A, B

5 plików: D-02, D-03, D-04, D-05, D-06 — wszystkie ⏳

---

## Wymagania „clean screen” (wejście)

- 1920×1080 px · PNG
- Tło jednolite **`#080a12`** (bez mapy / playtestu w tle)
- Układ = jak w grze (baseline jako referencja porównawcza)
- Brand book (outline 4C, Georgia, ikony line) = **Maciej w Claude Design**, nie grupa

---

## Następne kroki

| # | Kto | Akcja |
|---|-----|--------|
| 1 | **Grupa E** | 6× `*_przed.png` → `01-wejscie/grupa-E/` + `RAPORT-WEJSCIE.md` |
| 2 | **Maciej** | E-01 → Claude Design → `02-po-design/grupa-E/E-01_menu-glowne_po.png` |
| 3 | **MASTER** | Sygnał w czacie: „E-01 w 02-po-design” → review + dyspozycja lane UI |
| 4 | **Lane UI** | Wdrożenie menu wg PO |
| 5 | **Grupy A–D** | Czekają na kolejność 8A |

---

## Powiązane pliki

- Hub UX: [`docs/ux/README.md`](../README.md)
- Baseline PRZED (z gry): [`docs/ux/baseline/`](../baseline/)
- Spec E: [`docs/ux/figma/grupa-E/SPEC-FRAMES.md`](../figma/grupa-E/SPEC-FRAMES.md)
- Review checklist E: [`docs/ux/figma/grupa-E/CHECKLIST-REVIEW-MACIEJ.md`](../figma/grupa-E/CHECKLIST-REVIEW-MACIEJ.md)

---

*Aktualizuj po każdym nowym pliku w `01-wejscie/` lub `02-po-design/`.*
