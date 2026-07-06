# Maciej — co jest gotowe (log agentów)

> **Jedna strona do przejrzenia.** Agenci dopisują **append-only** (najnowsze **na górze**).  
> **Czat:** krótko **`✅ Gotowe:`** / **`⏸️ Czeka:`** · **Ten plik:** pełniejszy zapis tego samego.  
> Szczegóły techniczne → handoff w `dyspozycje/_handoff/` · operacja → `dyspozycje/DZIENNIK-MASTERA.md`

**Ostatnia aktualizacja:** 2026-07-04

---

## [2026-07-04 ~23:31] ✅ Gotowe — KANON MAPA bufor rzek 2 hex

| | |
|---|---|
| **Kto** | MAPA lane · Integrator F · Master review + kanon |
| **Co** | Rzeki min. 2 hex ciała od morza · ujście ≤2 hex na wybrzeżu |
| **Kanon md5** | `11d23be65ee6eaf8c5dabe5013eef2d8` · `gra-kanon/START.html` |
| **Od Ciebie** | Ctrl+F5 · nowa gra · brzeg + ujścia rzek |
| **Handoff** | `F-do-MASTER_MAPA-river-sea-buffer-2026-07-04.md` |

---

## [2026-07-04 ~22:03] ✅ Gotowe — KANON roster-6 AI (CYW)

| | |
|---|---|
| **Kto** | CYWILIZACJE lane · MASTER review + promocja |
| **Co** | 6 własnych archetypów AI (Harappa, Hetyci, Słowianie, Babilonia, Asyria, Fenicjanie) · Hetyci nauka +2 |
| **Kanon md5** | `dafa21f48be84501ad74145e8d65f9f4` · start: `gra-kanon/START.html` |
| **Od Ciebie** | nic — playtest opcjonalny |
| **Handoff** | `CYWILIZACJE-do-MASTER_roster-6-archetypy-ai_2026-07-04.md` |

---

## [2026-06-26] ✅ Gotowe — E2 kreator (UI + MAPA + SILNIK)

| | |
|---|---|
| **Kto** | Grupa E (UI) · Grupa A (generator) · Integrator F (`main.ts`) |
| **Co** | Krok 4: **Miasta-państwa** + **Typy cywilizacji** · zaawansowane: 4 suwaki gęstości · `buildParams()` → generator |
| **Pliki** | `gra/src/ui/newGameFlow.ts` · `gra/data/ui-params.json` · `gra/src/map/generator.ts` · `gra/src/main.ts` |
| **Testy** | `world-density-test.cjs` (E2-PARAMS) |
| **Od Ciebie** | nic — efekt w **ROBOCZA** `351d8ad6…`; kanon po review Master |
| **Handoff** | `dyspozycje/_handoff/UI-do-INTEGRATOR_E2-kreator-gestosc.md` |

---

## [2026-06-26] ✅ Gotowe — protokół logu `MACIEJ-GOTOWE.md` (Master)

| | |
|---|---|
| **Kto** | Master |
| **Co** | Agenci **muszą** dopisywać tu co przygotowali (obok czatu **`✅ Gotowe:`**) |
| **Pliki** | `docs/MACIEJ-GOTOWE.md` · reguły w `OBOWIAZ-POWIADOM-MACIEJA.md` · `PLOT-CODE-WORKFLOW.md` |
| **Od Ciebie** | **`plot code`** gdy chcesz kolejną paczkę kodu |

---

## [2026-06-26] ✅ Gotowe — W1-PREP tokeny menu i kreator (UI)

| | |
|---|---|
| **Kto** | Lane UI (sesja autonomiczna) |
| **Co** | Tokeny brand Warstwa 1 (1B/2C/4C) w menu i kreatorze; rejestr ikon Tier 1–2 (placeholder) |
| **Pliki** | `gra/src/ui/brandTokenVars.ts` · `gra/src/ui/icons/iconRegistry.ts` · `gra/src/ui/mainMenu.ts` · `gra/src/ui/newGameFlow.ts` |
| **Testy** | smoke OK |
| **Od Ciebie** | nic (kolejny krok: folder Design `brand-book-1E/eksport/` albo **`plot code`**) |
| **Handoff** | `dyspozycje/_handoff/UI-do-MASTER_warstwa1-w1-prep-2026-06-26.md` |

---

## [2026-07-02] ✅ Gotowe — paczka PILNE A–E + F (ROBOCZA, bez kanonu)

| | |
|---|---|
| **Kto** | Grupy A–E + Integrator F |
| **Co** | VICTORY + F-P1-01 (atak miasta z mapy) + B1-Q3 Panel-B + mapFieldBattle + victoryScreen |
| **Build** | ROBOCZA md5 `351d8ad65ab9c0e560961438cdd56d39` — **promocja kanon pending** |
| **Testy** | map-attack 8/8 · field-battle 15/15 · victory 12+11 · tech-tree 19/19 · smoke OK |
| **Od Ciebie** | nic — Master: review + ewent. playtest po kanonie |
| **Handoffy** | `F-do-MASTER_F-P1-01-2026-07-02.md` · `F-do-MASTER_VICTORY-E-P0-06-2026-07-02.md` · `EKONOMIA-do-MASTER_B1-Q3-panel-B-2026-07-02.md` |

---

## Szablon wpisu (dla agentów)

**Sukces** — wklej **pod** linię `---` na górze listy:

```markdown
## [RRRR-MM-DD] ✅ Gotowe — [krótki tytuł] ([lane / grupa])

| | |
|---|---|
| **Kto** | Master / Grupa X / UI / F |
| **Co** | [1–2 zdania] |
| **Pliki** | [ścieżki] |
| **Testy** | [opcjonalnie] |
| **Od Ciebie** | [nic / akcja] |
| **Handoff** | [opcjonalnie] |
```

**Bloker:**

```markdown
## [RRRR-MM-DD] ⏸️ Czeka — [krótki tytuł]

| | |
|---|---|
| **Kto** | … |
| **Co brakuje** | … |
| **Co już jest** | … |
| **Od Ciebie** | [jedna akcja] |
```

Reguła: [`docs/obieg/OBOWIAZ-POWIADOM-MACIEJA.md`](obieg/OBOWIAZ-POWIADOM-MACIEJA.md)
