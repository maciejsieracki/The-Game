# Archiwizacja automatyczna — pełna korespondencja (OBOWIĄZKOWA)

> **Decyzja Macieja (2026-06-27):** zero ręcznego eksportu. Agent synchronizuje **całą korespondencję** automatycznie.
> **Oddzielne pliki** — nie mieszać z `DO-MASTERA`, `OD-MASTERA`, `STATUS`, audytami operacyjnymi.

---

## Dwa światy plików

| Świat | Folder | Zawartość | Kto pisze |
|-------|--------|-----------|-----------|
| **Operacyjny** | `docs/czaty/`, `dyspozycje/`, `docs/decyzje/STATUS.md` | Meldunki, dyspozycje, kolejne kroki | Agent na bieżąco |
| **Historyczny** | `docs/archiwum-czatow/eksport-pelny/` | **Pełna korespondencja** 1:1 z czatu | **Skrypt + agent** |

Podsumowania sesji (fazy, skróty): `docs/archiwum-czatow/master/`, `lane/` — opcjonalnie obok, nie zamiast eksportu pełnego.

---

## Pliki eksportu (jeden slot = jeden plik)

| Slot | Plik |
|------|------|
| Master Silnik | `eksport-pelny/MASTER-Silnik_KORESPONDENCJA.md` |
| Grupa A–F | `eksport-pelny/GRUPA-{A..F}_KORESPONDENCJA.md` |

Meta sync (linia ostatnia): `*.md.sync-meta.json` obok — **nie edytuj ręcznie**.

---

## Kiedy synchronizować (OBOWIĄZKOWO)

| # | Trigger | Akcja agenta |
|---|---------|--------------|
| **1** | **Start sesji** — pierwsza odpowiedź po `master` / `czaty` / wklejce `DYSPOZYCJA` | `sync-chat-export.py --mode full` (pierwszy raz) lub `--mode auto` |
| **2** | **Kontekst ≥60%** (szacunek Cursor lub długa sesja) | `sync-chat-export.py --mode delta --context-pct N` + utwórz `{SLOT}_HANDOFF-KONTEKST.md` |
| **3** | **Koniec sesji** / zamknięcie zadania | `sync-chat-export.py --mode delta` |
| **4** | Hasło Macieja: **`archiwizuj czat`** | pełny sync natychmiast |

### Uwolnienie kontekstu (po sync ≥60%)

1. Uruchom sync (delta) — **cała nowa treść** w pliku korespondencji.
2. Zapisz `{SLOT}_HANDOFF-KONTEKST.md` (1 akapit: gdzie pełny log, jak kontynuować).
3. W czacie **jedna linia** do Macieja: *„Korespondencja zarchiwizowana w `eksport-pelny/…` — możesz kontynuować; historia jest na dysku."*
4. **Nie** proś Macieja o Export z UI — robi to skrypt.

Przy **>85%** kontekstu: dodatkowo zaproponuj **nowy czat** z tą samą `DYSPOZYCJA` (świeży kontekst; agent wczyta eksport pełny z pliku).

---

## Komenda (agent — z root Civ)

```powershell
python gra/tools/sync-chat-export.py --slot <SLOT> --chat-id <UUID> --mode auto
```

**Chat ID:** z `REJESTR-CZATOW.md` lub z metadanych (`transcript_location` w kontekście agenta).

**Przykład Master:**
```powershell
python gra/tools/sync-chat-export.py --slot MASTER-Silnik --chat-id 58b15435-b915-4a50-87ce-375f0e9ef1fe --mode auto
```

Przy ≥60%:
```powershell
python gra/tools/sync-chat-export.py --slot MASTER-Silnik --chat-id 58b15435-b915-4a50-87ce-375f0e9ef1fe --mode delta --context-pct 65
```

---

## Co agent robi na starcie każdej sesji (checklist)

1. Odczytaj `docs/archiwum-czatow/eksport-pelny/REJESTR-CZATOW.md` — swój `--slot`.
2. Ustal `--chat-id` (rejestr lub transcript).
3. Uruchom `sync-chat-export.py`.
4. Jeśli nowy chat ID — zaktualizuj kolumnę w `REJESTR-CZATOW.md`.
5. Dopisz linię do `dyspozycje/DZIENNIK-MASTERA.md`: `SYNC-EKSPORT: <slot> → eksport-pelny/<plik>`

---

## Czego NIE robić

- Nie prosić Macieja o ⋯ → Export.
- Nie wpisywać pełnej korespondencji do `DO-MASTERA` / `OD-MASTERA`.
- Nie zastępować eksportu pełnego samym „audytem” w `docs/grupa-*/`.

---

*Źródło transkryptu: Cursor `agent-transcripts/<uuid>/*.jsonl` (lokalnie, automatycznie).*
