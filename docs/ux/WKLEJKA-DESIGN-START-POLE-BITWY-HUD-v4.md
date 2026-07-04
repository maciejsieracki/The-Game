# START Design — POLE-BITWY HUD v4

**Skopiuj:** nagłówek z `WKLEJKA-DESIGN-NAGLOWEK-ZLECENIA.md`  
**ZLECENIE-ID:** `POLE-BITWY-HUD-v4-2026-07-04`  
**Trigger:** ✅ Maciej werdykt 2026-07-04 · odpowiedzi Grupa C ~20:58 · **START pracy**

**Pełna spec (obowiązuje):** `DESIGN-SPEC-POLE-BITWY-HUD-v4-2026-07-04.md`

---

## Cel

Mockupy **1E** sync z `Gra-podglad-POLE-BITWY.html` (build `manual-polish`).  
**v2/v3 = archiwum** — nie edytować.

---

## Deliverables (ZIP)

| # | Plik | Zakres |
|---|------|--------|
| 1 | `The Game - C06 Deployment v4 2026-07-04 (1E).dc.html` | **3 klatki:** Deploy · AUTO · R+roster |
| 2 | `The Game - C09 Roster lewy panel v4 2026-07-04 (1E).dc.html` | Lewy panel **w kontekście mapy** · scroll >30 kart |
| 3 | `DESIGN-do-UI_POLE-BITWY-HUD-v4.md` | **MUST** — region → `battleScene.ts` / `battleHudTheme.ts` |
| 4 | `MANIFEST.txt` | |
| 5 | PNG @1920 | **TAK** → `docs/ux/pipeline/02-po-design/grupa-C/` (3 stany + C09) |

**ZIP:** `POLE-BITWY-HUD-v4-2026-07-04.zip`

---

## Skrót MUST (szczegóły → DESIGN-SPEC)

- Lewy panel = **roster** (~368–370px) · **NIE** formacje F1/F2/F3  
- Formacje = **dolny toolbar** (deploy only)  
- Komendy = **prawy rail 56px** (P/V/R/M/MUZ/H/>>/WYCOF) — **nie** dolny C-09  
- Pasek mocy **poziomy** zielony/czerwony + „Ostatnie starcia”  
- Mapa placeholder **B** (heksy, sylwetki, ramki grup)  
- Minimapa lewy dół (deploy + R)  
- **Brak logu** w paczce 1  
- **Start walki:** czerwony CTA (default) · wariant złoty B w stopce mockupu  
- Popup **Taktyka otwarty** — 1 klatka  
- Zero emoji · tokeny 1E

---

## Stare briefy — NIE stosować

- `DESIGN-BRIEF-C06-v4-map-redesign.md` (pionowe morale, dolny dock)  
- `DESIGN-BRIEF-C09-roster-tw-v3.md` (dolny TW)  
- C-07 dolny pasek komend  

Obowiązuje: **`MASTER-DELTA-POLE-BITWY-vs-mockupy.md`** + **`DESIGN-SPEC-POLE-BITWY-HUD-v4-2026-07-04.md`**

---

## Poza scope paczki 1

C-01 · C-12 · C-19/C-20 oblężenie · log starć · balans walki

---

## Po ZIP

Lane UI port skin → MASTER review → Opus → kanon POLE-BITWY.

**Status:** Design **w trakcie** · port UI **STOP** do ZIP.
