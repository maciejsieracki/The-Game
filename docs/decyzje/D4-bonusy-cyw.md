# Gr-D4 — Cywilizacje i bonusy

**Ekran:** dane (efekt w grze)  
**Status:** **ZAMKNIĘTE** (decyzje) · implementacja **W TOKU** (RDY-01 + pełne v1.0 per D4-Q3=A)  
**Mapowanie:** 27 bonusów `civs.json`, T3=A

## Decyzje Macieja

| # | Pytanie | Decyzja | Data |
|---|---------|---------|------|
| 5 | Bonusy + jednostki specjalne | **A + B** — wdrażaj stopniowo **oraz** Excel/tabela do review | 2026-06-26 |
| **D4-Q1** | Kolejność: Excel vs kod | **A** (2026-06-26) → **korekta:** wdrażaj efekty teraz; Excel poprawi później | 2026-06-26 |
| **D4-Q2** | Excel bonusów — co teraz? | **A** — zostawiam JSON jak jest; Excel poprawię kiedy indziej („Excel OK") | 2026-06-27 |
| **D4-Q3** | Priorytet reszty bonusów | **A** — pełne wdrożenie v1.0: bitwa 3D + jednostki spec. + UI wyświetlanie | 2026-06-27 |

### D4-Q2 — Excel (Maciej, 2026-06-27)

JSON `civs.json["bonusy"]` zostaje bez zmian. Excel (`Panel-efekty-cyw-dyplomacja.xlsx`) = późna korekta — Maciej napisze **„Excel OK"** gdy skończy edycję → `export-bonusy-cyw.py`.

### D4-Q3 — priorytet (Maciej, 2026-06-27)

Master rozda batchy **UNITS** (bitwa 3D + jednostki spec.) + **UI** (newGameFlow + preBattle) **przed finalnym playtestem v1.0**.

## Po decyzji (Work)

### Excel do review (kanon — istniejący panel)

**Użyj:** `Civ-CYWILIZACJE/Panel-efekty-cyw-dyplomacja.xlsx` → arkusz **„Bonusy cywilizacji”** (27 wierszy, 3×9 nacji).

- Żółte komórki = wartości do strojenia (`Wartosc`, opisy).
- Kolory wierszy = dział realizacji: czerwony=walka, zielony=miasto, żółty=ekonomia, niebieski=mapa.
- Mnożnik handlu: osobny arkusz **„Mnoznik Handel”** (albo `Cywilizacje.xlsx` → `export-civs.py`).

**Przegląd całego lane’u:** `Civ-CYWILIZACJE/Panel-CYWILIZACJE.xlsx` (SPIS + bonusy, dyplomacja, AI, tech) — panel poglądowy; eksport idzie przez targeted skrypty, nie bezpośrednio z tego pliku.

**Pomocniczy widok 9 wierszy (wide):** `Civ-CYWILIZACJE/Bonusy-cywilizacji-9x3.xlsx` — generator `gra/tools/gen-bonusy-cyw-xlsx.py` (opcjonalny; ten sam JSON, inny układ).

### Po akceptacji Excelu

- CYWILIZACJE: `gra/tools/export-bonusy-cyw.py` (**GOTOWE 2026-06-26**) → `civs.json["bonusy"]`.
- Sync panel ← JSON: `gra/tools/sync-panel-efekty-from-json.py`.
- Hub plików: `Civ-CYWILIZACJE/README.md` · audyt: `AUDYT-GRUPA-D-2026-06-26.md`.
- Mnożnik: `python gra/tools/export-civs.py` (już jest).
- Dopiero wtedy RDY-01 w lane’ach (ekonomia → walka → miasto).

## → SILNIK

**GOTOWE DO WPIĘCIA:** **TAK (RDY-01 2026-06-26)** — mechanika bonusów w kodzie; Excel = późna korekta wartości (Maciej pisze gdy zmieni).

- `gra/src/game/civ-bonuses.ts` — walka + koszt budynków
- `economy.ts` / `turn-economy.ts` — handel, nauka
- `production.ts` — rekrutacja, budynki
- `combat.ts` + `main.ts` — auto-resolve z bonusami cyw
