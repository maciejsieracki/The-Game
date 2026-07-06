# Routing lane — drzewko tech i nauka → Grupa B (Miasto + Ekonomia)

| Pole | Wartość |
|------|---------|
| **Decydent** | Maciej |
| **Data** | 2026-06-28 |
| **Status** | **ZATWIERDZONE** (routing operacyjny) |
| **Powód** | Tech, ulepszenia mapy, budynki miasta i parametry nauki tworzą jeden spójny system — jeden właściciel lane |

---

## Nowy podział

### Grupa B (EKONOMIA + ex-MIASTO) — **WŁAŚCICIEL**

| Obszar | Pliki / narzędzia |
|--------|-------------------|
| Drzewko technologii | `Technologie-drzewko.xlsx` → `gra/data/tech.json` |
| Export tech | `gra/tools/export-tech.py` |
| Tempo kosztów badań | `gra/src/game/tech-tempo.ts` |
| Bramki ulepszeń ↔ tech | `terrain-improvements.json`, `improvement-tech.ts` |
| Budynki ↔ tech | `buildings.json` (`techUnlock`) |
| Mechanika puli / cel badania | `research.ts` (lub successor), strumień %Badania z miast |
| Paczka **B1-tech** Q1–Q5 | wyłącznie Grupa B (bez split CYW) |

**Jedno miejsce koordynacji:** `docs/decyzje/B1-tech-ABC-OTWARTE.md` + propozycje w `B1-tech-ulepszenia-proposal.md`.

### Grupa D (CYWILIZACJE) — **WŁAŚCICIEL** (bez zmian zakresu produktowego)

| Obszar | Pliki |
|--------|-------|
| 9 typów cywilizacji + bonusy | `civs.json`, `civ-bonuses.ts`, Excel bonusów |
| Dyplomacja | `diplomacy.ts`, `diplomacy.json`, audiencja |
| AI rywali (zachowanie, nie drzewko) | `ai.ts`, `civ-ai.json`, `barbarians.ts` |
| Zwycięstwo | `victory.ts` — **czyta** `tech.json`, **nie edytuje** |

### UI (bez zmiany właściciela ekranu)

| Obszar | Plik |
|--------|------|
| Overlay Nauka (D1) | `sciencePicker.ts` — **konsument** `tech.json` |

### Integrator (Grupa F)

Wpięcie po handoffach od B; nie ustala treści drzewka.

---

## Wyjątki cross-read (OK, bez edycji)

- **CYW / `ai.ts`:** `chooseAIResearch` — wybór techu przez AI; **dane** z `tech.json` (owner B).
- **CYW / `victory.ts`:** warunek nauki — **scope tech** z `tech.json` (owner B).
- **UI:** render drzewka z `tech.json` (owner B).

---

## Migracja operacyjna

1. **CYW** → handoff `CYWILIZACJE-do-EKONOMIA_transfer-tech-nauka.md` (lista plików + otwarte wątki).
2. **Master** → aktualizacja map lane (`docs/obieg/`, `ROADMAP-SPIS-TRESCI.md`, `B1-tech-ABC-OTWARTE.md`).
3. **Grupa B** → przejmuje B1-tech, `Technologie-drzewko.xlsx`, kolejne zmiany drzewka (w tym parametry dopisane przez miasto).
4. **CYW** — **nie** edytuje `tech.json` od tej daty (tylko zgłoszenie buga → B).

---

## Co się nie przenosi

- Decyzje **D1** (UX drzewka) — nadal UI; **dane** drzewka = B.
- **D3** audiencja dyplomatyczna — zostaje D.
- Excel **Cywilizacje**, **Dyplomacja**, **AI** — zostaje D.
