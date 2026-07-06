# Civ-CYWILIZACJE — hub plików roboczych lane CYWILIZACJE (Grupa D)

> **Ten katalog = Twoje pliki robocze** (Excel, audyty, specyfikacje).  
> Kod gry: `gra/src/game/`, dane JSON: `gra/data/`, dyspozycje: `dyspozycje/`.

---

## Szybki start (Maciej) — od 2026-06-30 (PANEL-MERGE)

| Chcę… | Otwórz |
|-------|--------|
| **Balans cywilizacji, bonusy, AI, dyplomacja** | `../panele-sterowania/Panel-D.xlsx` → w czacie D: **eksportuj panel** |
| **Poprawić bonusy 9×3** | Panel-D → arkusz `Bonusy-cywilizacji` |
| **Przegląd całego lane CYW (pogląd)** | `Panel-CYWILIZACJE.xlsx` (SPIS, bez eksportu) |
| **Stare Excele (tylko odczyt / historia)** | `../docs/archiwum/panele-legacy/` |

~~Panel-efekty-cyw-dyplomacja.xlsx~~, ~~Cywilizacje.xlsx~~, ~~Dyplomacja.xlsx~~, ~~AI-parametry.xlsx~~ → **zarchiwizowane** (manifest w archiwum).

| Chcę… (legacy / archiwum) | Lokalizacja |
|-------|--------|
| **Szybki widok 9 wierszy (wide)** | `../docs/archiwum/panele-legacy/Civ-CYWILIZACJE/Bonusy-cywilizacji-9x3.xlsx` (regeneruj: `python gra/tools/gen-bonusy-cyw-xlsx.py`) |
| **Audyt stanu Grupy D** | `AUDYT-GRUPA-D-2026-06-26.md` |
| **Decyzje D1–D4** | `../docs/decyzje/D1-nauka.md` … `D4-bonusy-cyw.md` |

---

## Struktura katalogu

```
Civ-CYWILIZACJE/
├── README.md                              ← ten plik
├── AUDYT-GRUPA-D-2026-06-26.md            ← raport audytowy (2026-06-26)
├── PLIKI-DO-USUNIECIA.md                   ← kandydaci do archiwum (decyzja Macieja)
├── DOKUMENTACJA-DEV-CYWILIZACJE.md        ← kanon techniczny lane
├── SPEC-Respekt.md                        ← model Respektu (D3, T1=A)
├── Panel-efekty-cyw-dyplomacja.xlsx       ← KANON review bonusów + mnożnik handlu
├── Panel-CYWILIZACJE.xlsx                 ← dashboard poglądowy (bez eksportu)
├── Bonusy-cywilizacji-9x3.xlsx            ← widok wide (generowany z JSON)
├── _generowane/                           ← kopie gdy Excel zablokowany (OneDrive lock)
└── _archiwum/                             ← dokumenty historyczne v0.1
```

---

## Pipeline Excel ↔ JSON (bonusy)

| Kierunek | Skrypt | Kiedy |
|----------|--------|-------|
| JSON → Excel wide | `gra/tools/gen-bonusy-cyw-xlsx.py` | Po zmianie `civs.json` — odśwież widok 9×3 |
| JSON → Panel efekty | `gra/tools/sync-panel-efekty-from-json.py` | Gdy panel nieaktualny względem JSON |
| **Excel → JSON (kanon)** | `gra/tools/export-bonusy-cyw.py` | **Po edycji panelu** — Maciej „Excel OK” |

**Ważne:** zamknij Excel przed skryptami (inaczej `Permission denied` na OneDrive).

Inne eksporty lane D (pozostają poza tym folderem):

| Skrypt | Excel | JSON |
|--------|-------|------|
| `export-civs.py` | `Cywilizacje.xlsx` | `civs.json` (klastry, mnożnik, ikonaId — **nie** bonusy) |
| `export-tech.py` | `Technologie-drzewko.xlsx` | `tech.json` | **→ przeniesione do Grupy B** — patrz `ROUTING-tech-nauka-Grupa-B.md` |
| `export-diplomacy.py` | `Dyplomacja/Dyplomacja.xlsx` | `diplomacy.json` |
| `export-ai-params.py` | `Civ-AI/AI-parametry.xlsx` | `ai-params.json` |

**NIGDY:** `export-data.py` (pełny rebuild — zabroniony).

---

## Powiązane pliki poza tym katalogiem

| Ścieżka | Rola |
|---------|------|
| `docs/czaty/GRUPA-D-NAUKA-DYPLOMACJA.md` | Charter czatu Grupy D |
| `docs/czaty/DO-MASTERA.md` § Grupa D | Raporty do Master Silnika |
| `docs/decyzje/D1–D4*.md` | Decyzje Macieja (ABC) |
| `dyspozycje/CYWILIZACJE.md` | Dyspozycje lane |
| `dyspozycje/CYWILIZACJE-DO-MASTERA.md` | Meldunki → Master |
| `dyspozycje/CYWILIZACJE-STAN.md` | STAN ≤12 linii |
| `dyspozycje/_handoff/CYWILIZACJE-*` | Kontrakty cross-lane |

---

## Kontakt z Masterem

Po zamknięciu batchu: dopisz wpis w `docs/czaty/DO-MASTERA.md` § Grupa D + `CYWILIZACJE-DO-MASTERA.md`.  
Master rozsyla dyspozycje do UNITS / EKONOMIA / UI / SILNIK.

*Ostatnia aktualizacja: 2026-06-26*
