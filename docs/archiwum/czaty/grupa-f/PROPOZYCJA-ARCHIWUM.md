# Propozycja porządkowania plików — decyzja Macieja + Master

**Data:** 2026-06-27 · **Status:** PROPOZYCJA (nic nie usunięto bez zgody)

---

## Już wykonane (przeniesienie do archiwum)

**Status:** **PROPONOWANE — czeka zgoda Macieja/Master** (przeniesienie nie wykonane w sesji 2026-06-27).

Plan: do `dyspozycje/_handoff/_archiwum/silnik/` przenieść:

1. `C1-do-SILNIK_preBattle-wpiecie.md`
2. `SILNIK-handover-do-MASTER_2026-06-24.md`
3. `MIASTO-do-SILNIK_integracja.md`
4. `EKONOMIA-do-SILNIK-upkeep.md`
5. `EKONOMIA-do-SILNIK-economy-edits.md`

W aktywnym `_handoff/` zostają tylko 4 handoffy SILNIK (batch-test, B2-porzadek, B2-Q5 hex, D1B-A4).

---

## Do usunięcia / archiwum (propozycja)

| Plik | Akcja | Uzasadnienie |
|------|--------|--------------|
| `dyspozycje/SILNIK.md` | **ARCHIWUM** → `dyspozycje/_archiwum/SILNIK-legacy.md` | Sprzeczny z SCHEMAT 2 wersje (F publikuje ROBOCZA, nie kanon) |
| `SILNIK/` (folder root) | **ARCHIWUM** całości do `docs/archiwum-silnik-lane/` | Zastąpione przez `docs/czaty/grupa-f/` + `gra/src/` |
| `docs/MASTER-SILNIK.md` | **MERGE** treści do `docs/czaty/MASTER-SILNIK-CZAT.md` lub archiwum | Duplikat ścieżek |
| Duplikaty ścieżek Windows (`docs\czaty\` vs `docs/czaty/`) | **OneDrive/git** — nie dotykać w F | Artefakt sync |

---

## Do aktualizacji (wykonane przez F 2026-06-27)

| Plik | Zmiana |
|------|--------|
| `docs/decyzje/STATUS.md` | Usunięto sprzeczności B2/HUD |
| `docs/decyzje/MAPA-PYTAN-OPEN.md` | C1/C2/B2 zamknięte |
| `docs/decyzje/DYSPOZYCJA-STALA-SILNIK.md` | Wskazanie `grupa-f/` |
| `docs/czaty/GRUPA-F-SILNIK.md` | Link do `grupa-f/` |

---

## Do aktualizacji ręcznie (Maciej / Master)

| Plik | Dlaczego agent F nie rusza |
|------|----------------------------|
| `Status-projektu-The-Game.xlsx` | Excel — **zaktualizowano** arkusz `Grupa-F` (skrypt 2026-06-27) |
| `Gra-podglad.html` | Tylko Master po Opus |
| `docs/MACIEJ-KARTA-DECYZJI.md` | D1–D15 już zamknięte — bez zmian |

---

## Jak zatwierdzić cleanup

W czacie Master lub tutaj: **„Archiwum OK: SILNIK.md + folder SILNIK/"** → Master wykona przeniesienie.

---

## Pliki NIE do usuwania

- `docs/czaty/grupa-f/*`
- `SILNIK-DO-MASTERA.md`
- Aktywne 4 handoffy SILNIK
- `GRUPA-F-BACKLOG-WPIECIA.md`
- Wszystkie `docs/decyzje/*.md` (tylko edycja, nie delete)
