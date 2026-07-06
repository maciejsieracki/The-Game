# Archiwum czatów Cursor (Civ / The Game)

> **Automatyczny eksport pełnej korespondencji** — Maciej **nie** eksportuje ręcznie.
> Zasady: `ARCHIWIZACJA-AUTO.md` · pliki: `eksport-pelny/` · reguła: `.cursor/rules/chat-export-auto.mdc`

---

## Po co to jest

Cursor **kompresuje** długą historię czatu. Dwa poziomy archiwum:

| Warstwa | Folder | Zawartość |
|---------|--------|-----------|
| **Pełna korespondencja** | `eksport-pelny/{SLOT}_KORESPONDENCJA.md` | Cała rozmowa 1:1 (wyszukiwanie historyczne) |
| **Podsumowania sesji** | `master/`, `lane/`, `maciej-decyzje/`, `ops/` | Skróty, decyzje, fazy |

Operacyjne meldunki: `dyspozycje/`, `docs/czaty/DO-MASTERA.md` — **bez** pełnej korespondencji.

---

## Struktura folderów (wg roli)

```
docs/archiwum-czatow/
├── README.md
├── ARCHIWIZACJA-AUTO.md       ← zasady automatycznego eksportu
├── eksport-pelny/             ← PEŁNA korespondencja (jeden plik / czat)
│   ├── REJESTR-CZATOW.md
│   └── {SLOT}_KORESPONDENCJA.md
├── _szablon-eksportu.md       ← podsumowania sesji (opcjonalnie)
├── master/
├── maciej-decyzje/
├── lane/
└── ops/
```

**Zasada:** jeden czat = jeden plik `.md` w odpowiednim podfolderze.

---

## Konwencja nazewnictwa

```
{ROLA}-{TEMAT}_{YYYY-MM-DD}.md
```

| Prefiks | Folder | Przykład |
|---------|--------|----------|
| `MASTER-` | `master/` | `MASTER-Civ-Sprint1_2026-06-26.md` |
| `LANE-{NAZWA}-` | `lane/` | `LANE-UNITS-oblężenie_2026-06-26.md` |
| `MACIEJ-` | `maciej-decyzje/` | `MACIEJ-decyzje-D1-D5_2026-06-26.md` |
| `OPS-` | `ops/` | `OPS-kontekst-i-limity-czatu_2026-06-26.md` |
| `REVIEW-` | `master/` lub `lane/` | `REVIEW-kanon-batch7_2026-06-26.md` |

**Kontynuacja następnego dnia:** dopisz `-cz2` albo zakres dat: `MASTER-Sprint1_2026-06-26_2026-06-27.md`.

**TEMAT:** krótki, bez spacji (myślnik lub podkreślenie), po polsku lub angielsku — spójnie w obrębie projektu.

---

## Kiedy zapisać archiwum

| Trigger | Kto | Co robi |
|---------|-----|---------|
| **Start sesji** | Agent | `sync-chat-export.py --mode auto` |
| Kontekst **≥60%** | Agent + hook `preCompact` | Delta + `HANDOFF-KONTEKST.md` |
| Koniec sesji | Agent | Delta + opcjonalne podsumowanie w `master/` / `lane/` |
| Hasło **`archiwizuj czat`** | Agent | Pełny sync natychmiast |

---

## Workflow agenta

1. **Start sesji:** sync do `eksport-pelny/` (patrz `ARCHIWIZACJA-AUTO.md`).
2. **W trakcie:** decyzje ABC → `MACIEJ-KARTA-DECYZJI.md` / `DO-MASTERA`.
3. **≥60% kontekstu:** delta eksport + handoff; przy >85% zaproponuj nowy czat.
4. **Koniec sesji:** delta + opcjonalne podsumowanie w `master/` lub `lane/`.
5. **DZIENNIK:** `SYNC-EKSPORT: <slot> → eksport-pelny/<plik>`

**Maciej nie eksportuje ręcznie** — skrypt czyta `agent-transcripts/*.jsonl` lokalnie.

---

## Wpis w DZIENNIK-MASTERA (jedna linia)

Format (append na końcu pliku lub w sekcji REJESTR ARCHIWUM CZATÓW):

```
## [YYYY-MM-DD] ARCHIWUM: <krótki opis> → docs/archiwum-czatow/<folder>/<NAZWA>.md
```

---

## Powiązane dokumenty

- `.cursor/rules/civ-workflow.mdc` §13 — reguła always-apply dla agentów
- `docs/CURSOR-WORKFLOW-SCHEMAT.md` §10 — cykl życia czatu
- `~/Projects/game-dev-playbook/docs/chat-archive-workflow.md` — wzorzec ogólny (inne projekty)
- `docs/archiwum-claude-code/` — starsze eksporty Claude Code (osobna ścieżka)

---

*Utworzono: 2026-06-26 | Workflow ops Civ*
