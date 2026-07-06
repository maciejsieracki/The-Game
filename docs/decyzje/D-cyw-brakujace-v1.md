# D — brakujące cywilizacje v1 (Maciej · 2026-07-01)

**Status:** **OTWARTE** — decyzja produktowa zapisana · implementacja **po** domknięciu spec bonusów/archetypów  
**Lane:** CYWILIZACJE (`civs.json`, `civ-ai.json`, `diplomacy.json` perNacja, `TypCywilizacji`)  
**Zakres v1:** **3 nacje startowe** (Tier 1) · **3 w rezerwie** (Tier 2) — pełna paczka: [`D-cyw-roster-6-REZERWA.md`](D-cyw-roster-6-REZERWA.md)

---

## Tier 2 — rezerwa (bez wdrożenia)

| Cywilizacja | Epoka startu |
|-------------|--------------|
| **Babilonia** | brąz |
| **Asyria** | brąz |
| **Fenicjanie** | żelazo |

Szczegóły · bonusy · jednostki · plan wdrożenia → **`D-cyw-roster-6-REZERWA.md`**

---

## Decyzja Macieja (dosłownie)

> Przygotować **trzy** cywilizacje, których na początkowym etapie brakuje; resztę dołożymy w przyszłości.

| # | Nazwa (PL) | Nazwa (EN / id robocze) | Epoka startowa w grze |
|---|------------|-------------------------|------------------------|
| 1 | **Harappa** (Indusowie) | Harappa · `harappa` | **kamień** |
| 2 | **Hetyci** | Hatti · `hetyci` | **brąz** |
| 3 | **Słowianie** | Slavs · `slowianie` | **żelazo** |

**Uzupełnienie Macieja (2026-07-01):** cywilizacja doliny Indusu — w grze **Harappa** (synonim / nazwa kanoniczna zamiast „Hindusi”).

---

## Stan rosteru dziś (9 typów w `civs.json`)

Grecy · Rzymianie · Chińczycy · Inkowie · Zulusi · Egipt · Sumerowie · Celtowie · Germanie

**Brakuje:** Harappa (Indusowie) · Hetyci · Słowianie → docelowo **12** typów głównych na v1 rozszerzone.

---

## Do zrobienia (lane CYW — backlog)

| Element | Pliki | Uwagi |
|---------|-------|--------|
| Wpis JSON + bonusy | `gra/data/civs.json` | `nazwyKlastra`, `epokiStartowe`, `bonusy`, `ikonaId` |
| AI / agresja | `gra/data/civ-ai.json` | Excel 5A lub seed ręczny |
| Dyplomacja per nacja | `gra/data/diplomacy.json` → `perNacja` | sklonnoscSojusze, progWojny, … |
| Enum typu | `gra/src/types/player.ts` → `TypCywilizacji` | `harappa`, `hetyci`, `slowianie` |
| Archetyp AI | `diplomacy.ts` `ARCHETYPE_*` | mapowanie lub reuse archetypu bazowego |
| Ikony / UI | lane UI + FIGMA | po decyzji stylu |

**Nie teraz:** pełny Panel-D export · pełna rozpiska miast-państw per typ (osobna decyzja).

---

## Zależności

- **E1 roster** (`civ-roster.ts`) — pula typów rośnie do **15**; **ile typów na mapie** = nadal cap z rozmiaru mapy (E1-D-Q1, bez zmian)
- **Integrator** — nowe `TypCywilizacji` wymagają wpisu w `main.ts` / spawn (handoff po JSON).
- **Power / Respekt** — bez zmian w definicji cyw; wpływ przez bonusy i epokę startową.

---

## Następny krok (Maciej)

1. Opcjonalnie: krótki charakter każdej nacji (1 zdanie) + jednostka specjalna (jak Grecy/Falanga).
2. Po domknięciu **Power** — kalibracja progów dyplomacji (osobny wątek).
3. Sygnał **„eksportuj panel D”** lub **„implementuj 3 cyw”** → lane CYW startuje paczkę JSON.
