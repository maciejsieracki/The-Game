# Gr-D1 — Nauka i technologie

**Ekran:** overlay / menu Nauka  
**Status:** **ZAMKNIĘTE** (decyzje D1-Q1, D1-Q2 + paczka 1) · implementacja OTWARTA  
**Mapowanie:** global D11, było T9

## Decyzje Macieja

| # | Pytanie | Decyzja | Data |
|---|---------|---------|------|
| 1 | Drzewko vs picker | **B** — pełne drzewko w grze (port makiety bez przecięć) | 2026-06-26 |
| 2 | Koszty tech + tempo | **A** — akceptuj propozycję CYWILIZACJI (finalne koszty + tempo szybka/standard/długa) | 2026-06-26 |
| **D1-Q1** | Co widać na drzewku | **Maciej (wariant)** — patrz poniżej | 2026-06-26 |
| **D1-Q2** | Jak ustawić cel badania | **A** — jedno kliknięcie w tech = od razu cel badania | 2026-06-26 |

### D1-Q1 — widoczność węzłów (Maciej, 2026-06-26)

Gracz na drzewku tech widzi **tylko bieżącą epokę** — **bez** tech z przyszłych epok.

| Warstwa widoczności | Co widać |
|---------------------|----------|
| **Odkryte** | Tech już zbadane (pełny kolor / stan „mam") |
| **Najbliższe możliwe** | Tech odblokowane do wyboru **teraz** (następne realne cele) |
| **Wyszarzone (ta epoka)** | Kolejne warstwy w **tej samej epoce**, jeszcze niedostępne — widać, ale wyszarzone |
| **Ukryte** | Tech z **kolejnych epok** — gracz **nie widzi** nowych możliwości / epok z drzewka |

**Implikacja UI (`sciencePicker.ts`):** filtr `Epoka === player.era`; w obrębie epoki — stany: `researched` | `available` | `future-in-epoch-gray` | `hidden-future-epoch`.

### D1-Q2 — ustawienie celu badania (Maciej, 2026-06-26)

**A — jedno kliknięcie:** klik w węzeł tech (dostępny do wyboru) → **natychmiast** ustawia cel badania (wspólna pula). Bez osobnego przycisku „Ustaw jako cel". Podgląd kosztu/epoki może być na hover lub w nagłówku overlay — bez blokady potwierdzenia.

## Po decyzji (Work)

- UI: port makiety → `sciencePicker.ts` + **D1-Q1** (widoczność epoki) + **D1-Q2** (click → set cel).
- CYWILIZACJE/SILNIK: koszty `tech.json` bez zmian; `applyTempoKoszt` z menu nowej gry.
- Referencja: `_handoff/CYWILIZACJE-do-MASTER_tempo-gry.md`.

## → SILNIK

**GOTOWE DO WPIĘCIA (lane UI):** **CZEKA** — po implementacji `sciencePicker.ts` + testy lane.
