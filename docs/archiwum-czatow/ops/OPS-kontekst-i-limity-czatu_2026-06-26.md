# OPS-kontekst-i-limity-czatu_2026-06-26

## Metadane

| Pole | Wartość |
|------|---------|
| **Rola** | OPS (meta-workflow) |
| **Model** | Parent + subagent (Composer) |
| **Temat czatu** | Kontekst czatu vs limity abonamentu, model 3+1, archiwum czatów |
| **Data sesji** | 2026-06-26 |
| **Data eksportu** | *(Maciej: wklej pełny eksport z Cursor UI)* |
| **Powiązane pliki** | `docs/archiwum-czatow/README.md`, `.cursor/rules/civ-workflow.mdc` §13, `docs/CURSOR-WORKFLOW-SCHEMAT.md` §10 |
| **Kontynuacja** | brak |

> **Maciej:** Pełny eksport tej rozmowy wklej w sekcji [Eksport pełny](#eksport-pełny-cursor-ui) — szczegóły z połowy wątku mogły zostać skompresowane przez Cursor.

---

## Podsumowanie sesji

### Dwa różne „procenty” (kluczowe rozróżnienie)

| Wskaźnik | Gdzie | Co oznacza |
|----------|-------|------------|
| **~93% → ~11%** | **Dół okna czatu** | **Kontekst bieżącej rozmowy** (np. 80K/200K tokenów historii w tym wątku) |
| **11%** | **Dashboard Cursor** (Usage) | **Miesięczne zużycie pakietu Pro** (~89% pozostało do resetu, np. 26 lipca) |

**Wniosek:** wysoki % u dołu czatu **nie oznacza** końca dziennego limitu abonamentu. Dashboard pokazuje **miesięczny** budżet (Pro ~20 USD included usage), bez typowych limitów dziennych/tygodniowych.

### Dashboard — co Maciej widział (2026-06-26)

- Plan **Pro**, reset ok. **26 lipca**
- Zużycie **~11%** pakietu „Included in Pro”
- Rozbicie: **Auto** (tryb agenta) + **API** (modele ręczne, np. GLM, Composer) — suma ważona
- **On-demand: Disabled** — po 100% pakietu agent przestaje działać do resetu (chyba że włączysz on-demand)

### Zachowanie summarization (93% → 11%)

Gdy kontekst czatu zbliża się do limitu, Cursor **kompresuje** starą historię do krótkiego podsumowania:

- **Plus:** czat znów ma zapas, można pisać dalej bez nowego wątku
- **Minus:** drobne szczegóły ze środka rozmowy mogą „wyblaknąć” — agent pamięta główne ustalenia, nie każdy cytat

**Dlatego** wprowadzamy `docs/archiwum-czatow/` — pliki nie znikają przy kompresji.

### Model 3+1 czatów (rekomendacja dla Civ)

| Czat | Rola | Zawartość |
|------|------|-----------|
| **1. MASTER** | GLM 5.2 | Plan sprintu, integracja `main.ts`, delegacja lane, kanon |
| **2. MACIEJ** | Człowiek | Decyzje ABC, playtest, pytania gameplay (bez kodu) |
| **3. Lane** | Composer 2.5 | **Jeden czat = jeden lane = jedno zadanie z AC** (np. UNITS-oblężenie) |
| **+1 Review** | Opus 4.8 Ask | Osobny krótki czat przed publikacją kanonu |

**Zasady:**

- Więcej **tematycznych czatów** ≠ więcej subagentów — osobny czat „EKONOMIA” jest **tańszy** niż jeden wątek na 90%+ kontekstu
- **Subagent (Multitask)** tylko gdy coś trwa długo w tle (backup, masowa analiza) — nie na co dzień
- **Pliki** (`dyspozycje/`, `docs/`, archiwum) = pamięć trwała; **czaty** = sesje robocze

### Strategia pamięci oparta na plikach

| Warstwa | Plik | Kiedy |
|---------|------|-------|
| STAN | `dyspozycje/<LANE>-STAN.md` | Start lane (≤12 linii) |
| Operacje | `dyspozycje/*-DO-MASTERA.md`, `_handoff/` | Raporty i kontrakty |
| Plan | `docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md`, BACKLOG | MASTER na starcie |
| **Archiwum czatu** | **`docs/archiwum-czatow/<rola>/*.md`** | **Koniec sesji / >60% kontekstu / zamknięcie czatu** |

### Ustalenia operacyjne z tej sesji

- Utworzono workflow archiwum czatów (ten plik = pierwszy wpis w `ops/`)
- Git: `main` = stabilny kanon, `develop` = praca agentów (`docs/GIT-WORKFLOW.md`)
- MASTER jedyny editor `main.ts`; lane Composer nigdy `main.ts`
- Decyzje gameplay tylko przez ABC → Maciej → dopiero dyspozycje

---

## Decyzje i ustalenia

| ID / temat | Ustalenie | Status |
|------------|-----------|--------|
| Kontekst vs abonament | 93% u dołu ≠ limit miesięczny; dashboard 11% = pakiet Pro | USTALONE |
| Summarization | Przy wysokim % historia się kompresuje — archiwum plikowe obowiązkowe | USTALONE |
| Model czatów | 3+1 (MASTER / MACIEJ / lane / review) | REKOMENDACJA |
| Archiwum | `docs/archiwum-czatow/` + wpis w DZIENNIK | WDROŻONE 2026-06-26 |

---

## Następne kroki

1. Maciej: po zakończeniu ważnych czatów — eksport z UI → wklej pod „Eksport pełny” w odpowiednim pliku
2. MASTER: przy zamknięciu sprintu — `MASTER-Civ-SprintN_YYYY-MM-DD.md` w `master/`
3. Lane Composer: jeden plik archiwum na zadanie z AC w `lane/`

---

## Eksport pełny (Cursor UI)

```
(Maciej: wklej tutaj pełny eksport rozmowy o kontekście, limitach i archiwum z Cursor UI)
```
