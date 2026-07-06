# Archiwum eksportów Claude Code

> **Maciej:** Najpierw przeczytaj [MAPA-PLIKOW-KORESPONDENCJI.md](./MAPA-PLIKOW-KORESPONDENCJI.md) — możesz nie musieć wklejać nic do `raw/`.

Tu wklejasz pełne eksporty czatów z Claude Code, lane po lane. Po wklejeniu MASTER uruchamia tanie subagenty, które wyciągają decyzje gameplay i skróty do `ekstrakt/`.

## Kluczowa obserwacja

Pliki `dyspozycje/*-DO-MASTERA.md` oraz `dyspozycje/_handoff/` **już są archiwum** korespondencji operacyjnej (raporty lane→MASTER, kontrakty integracyjne). Folder `raw/` służy wyłącznie eksportom chatów, których **nie ma** w tych plikach (np. sesje sprzed 22.06, rozmowy bez wpisu w DO-MASTERA).

Szczegóły: [MAPA-PLIKOW-KORESPONDENCJI.md](./MAPA-PLIKOW-KORESPONDENCJI.md)

## Trzy kroki

1. **Wklej** — otwórz plik w `raw/` pasujący do tematu rozmowy i wklej cały eksport. Uzupełnij `Data wklejenia:` na górze pliku.
2. **Zgłoś MASTER** — w czacie z MASTER (GLM) napisz: **archiwum gotowe** (możesz dopisać, które pliki wypełniłeś).
3. **MASTER puszcza subagenty** — MASTER deleguje analizę; wyniki trafiają do `ekstrakt/` i ewentualnie do dyspozycji.

## Pliki `raw/` (po scaleniu lane'ów — 7 aktywnych plików)

| Plik | Temat | Status |
|------|--------|--------|
| `00-MASTER.md` | Ogólne, workflow, plan | WYPEŁNIONY 2026-06-26 |
| `01-SILNIK.md` | Silnik, technika core | Pusty OK — lane=MASTER |
| `02-EKONOMIA.md` | Ekonomia + MIASTO (scalone 2026-06-25) | WYPEŁNIONY 2026-06-26 |
| `03-UNITS.md` | Jednostki | **Kanon UNITS** — WYPEŁNIONY 2026-06-26 |
| `04-UI.md` | Interfejs | WYPEŁNIONY 2026-06-26 |
| `05-MAPA.md` | Mapa, teren | WYPEŁNIONY 2026-06-26 |
| `06-CYWILIZACJE.md` | Cywilizacje + DANE + AI + dyplomacja | WYPEŁNIONY 2026-06-26 |

## Legacy sloty → `_archiwum/legacy-raw/`

Stare sloty numeracji (SUPERSEDED, bez treści lub pointer-only):

| Plik legacy | Kanon w `raw/` |
|-------------|----------------|
| `03-MIASTO.md` | → `02-EKONOMIA.md` |
| `04-UNITS.md` | → `03-UNITS.md` |
| `05-UI.md` | → `04-UI.md` |
| `06-MAPA.md` | → `05-MAPA.md` |

Folder: [`_archiwum/legacy-raw/`](./_archiwum/legacy-raw/) — nie wklejaj tu nowych eksportów.

## Równoległe ścieżki w `dyspozycje/`

| Lane | MASTER → lane | lane → MASTER |
|------|---------------|---------------|
| SILNIK | `dyspozycje/SILNIK.md` | `dyspozycje/SILNIK-DO-MASTERA.md` |
| EKONOMIA | `dyspozycje/EKONOMIA.md` | `dyspozycje/EKONOMIA-DO-MASTERA.md` |
| UNITS | `dyspozycje/UNITS.md` | `dyspozycje/UNITS-DO-MASTERA.md` |
| UI | `dyspozycje/UI.md` | `dyspozycje/UI-DO-MASTERA.md` |
| MAPA | `dyspozycje/MAPA.md` | `dyspozycje/MAPA-DO-MASTERA.md` |
| CYWILIZACJE | `dyspozycje/CYWILIZACJE.md` | `dyspozycje/CYWILIZACJE-DO-MASTERA.md` |
| MASTER (hub) | — | `dyspozycje/DZIENNIK-MASTERA.md` |

Lane'y legacy (MIASTO, DANE, AI, DYPLOMACJA) nadal mają pliki w `dyspozycje/`, ale koordynacja idzie przez EKONOMIA lub CYWILIZACJE — patrz MAPA.

## Foldery

- `raw/` — surowe wklejki eksportów chatów (aktywne sloty po scaleniu)
- `_archiwum/legacy-raw/` — stare sloty numeracji (SUPERSEDED, pointer-only)
- `ekstrakt/` — skróty i wyciągi po analizie subagentów
- [MAPA-PLIKOW-KORESPONDENCJI.md](./MAPA-PLIKOW-KORESPONDENCJI.md) — pełny indeks korespondencji projektu
