# Dyplomacja — katalog działu (hub)

Wszystkie pliki działu **DYPLOMACJA**, które NIE są plikami gry (dokumentacja + panel sterowania),
w jednym miejscu — żeby nie szukać po liście kilkudziesięciu plików w katalogu projektu.
Pliki kodu/danych gry zostają w strukturze build (`gra/...`) — patrz niżej.

Przygotowane przez sesję Civ-DYPLOMACJA, 2026-06-23.

## Co tu jest

| Plik | Opis |
|---|---|
| `Dyplomacja-DOKUMENTACJA-DEV.md` | Pełna dokumentacja developerska (architektura, API, parametry, reguły, interakcje z działami). |
| `Dyplomacja-zasady.md` | Skrócone reguły — jedno miejsce prawdy. |
| `Dyplomacja-szablon.md` | Projekt/intencja systemu (wersja robocza). |
| `Dyplomacja.xlsx` | **Panel sterowania** — arkusz `params` (38 parametrów; kolumna *Wartość* żółta = edytowalna) + panele A–F. |
| `README.md` | Ten plik. |

## Pliki GRY (ZOSTAJĄ w strukturze build — NIE przenosić)

| Plik | Rola |
|---|---|
| `gra/src/game/diplomacy.ts` | Model wykonawczy (logika, czysty). |
| `gra/src/types/diplomacy.ts` | Typy (współdzielone). |
| `gra/data/diplomacy.json` | Dane + blok `params` (kontrakt dla kodu). |
| `gra/tools/diplomacy-test.cjs` | Test (90 asercji). |
| `gra/tools/export-diplomacy.py` | Eksport panelu: `Dyplomacja.xlsx[params]` → `diplomacy.json[params]`. |

Pliki kanału do mastera (`dyspozycje/DYPLOMACJA.md`, `dyspozycje/DYPLOMACJA-DO-MASTERA.md`)
zostają w `dyspozycje/` — wspólna konwencja wszystkich sesji.

## Przepływ strojenia parametrów (bez kodu)

```
Dyplomacja.xlsx[arkusz "params"]  →  python3 gra/tools/export-diplomacy.py  →  gra/data/diplomacy.json["params"]
                                                                              →  loadDiplomacyParams()  →  model
```
Skrypt eksportu wykrywa `Dyplomacja.xlsx` zarówno w tym hubie, jak i (fallback) w katalogu Civ.

## Historyczne / nieużywane

Sprawdzono całe drzewo Civ. **Brak osobnych historycznych plików dyplomacji do archiwum.**
Wpisy `_backup/gra_*/.../diplomacy.ts` to pełne snapshoty całego `gra/` (własność procesu backupu,
nie działu) — nie ruszane.
