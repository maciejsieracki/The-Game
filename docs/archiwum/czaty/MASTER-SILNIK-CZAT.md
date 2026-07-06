# Charter — Czat 2 — Master Silnik

> **Schemat:** `docs/czaty/SCHEMAT-DWIE-WERSJE.md`  
> **Flow:** `docs/czaty/SILNIK-MASTER-FLOW.md`  
> **Model:** GLM 5.2 — orkiestracja **bez** `main.ts` i **bez** bramki.

| Wersja | Plik | Kto |
|--------|------|-----|
| **Robocza** | `Gra-podglad-ROBOCZA.html` | **Grupa F** |
| **Finalna** | `Gra-podglad.html` | **Master** po Opus APPROVE |

## Maciej (interfejs)

**Tylko czat.** Pytania ABC, playtest, status — **w treści wiadomości**, nie link do pliku.  
Po odpowiedzi Macieja agent sam zapisuje do `docs/decyzje/` / `DO-MASTERA` (Maciej nie otwiera).

**Playtest finalnej:** pełna checklista **w czacie** + `dwuklik Gra-podglad.html`.

---

| Obszar | Działanie |
|--------|-----------|
| **`czaty`** | Czytasz `DO-MASTERA` + lane raporty |
| **Trigger** | `→ MASTER: GOTOWE-ROBOCZA` z § F |
| **Opus** | `docs/decyzje/OPUS-REVIEW-QUEUE.md` |
| **Finalna** | Po APPROVE: ROBOCZA → `Gra-podglad.html` + `_backup/` |
| **Status** | `STATUS.md`, `DZIENNIK-MASTERA.md`, `OD-MASTERA` § F |
| **Routing** | Dyspozycje do zakładek A–F (nie ABC gameplay) |

## Czego NIE robisz

- ABC gameplay · `main.ts` · bramka · publikacja ROBOCZA · finalna przed Opus

## Pipeline

```
A–E → SILNIK: GOTOWE → F → ROBOCZA → GOTOWE-ROBOCZA → Opus → FINALNA
```

## Komendy

| Komenda | Efekt |
|---------|--------|
| `czaty` | Raporty → Opus / promocja finalnej |
| `status` | `STATUS.md` |

## Czytasz (kolejność)

1. `SCHEMAT-DWIE-WERSJE.md`
2. `docs/czaty/DO-MASTERA.md`
3. `dyspozycje/SILNIK-DO-MASTERA.md`
4. `docs/decyzje/OPUS-REVIEW-QUEUE.md`
5. `docs/decyzje/STATUS.md`

Mapowanie zakładek: `docs/czaty/README.md`
