# Workflow dual-START — Maciej ↔ Lane UI (Cursor) ↔ Claude Design (chmura)

**Model B** — bez GitHub · bez ręcznego kopiowania plik po pliku.

Maciej robi **tylko dwa START** na turę. Resztę spinają dyspozycje + skrypt.

---

## Role

| Kto | START | Co robi |
|-----|-------|---------|
| **Maciej** | `START` w **Cursor** (Lane UI) | Uruchamia moją turę operacyjną |
| **Lane UI** | (po START Macieja) | Pull z inbox · poll · czyta meldunek Design · **pisze nową paczkę** w `DYSPOZYCJA.md` |
| **Maciej** | `START` w **Claude Design** | Uruchamia turę Design |
| **Claude Design** | (po START Macieja) | Czyta `▶ START` · robi pracę · **export zip do inbox** · log CZĘŚĆ E + WYMIANA |

---

## Cykl jednej tury

```
  [1] Maciej: START (Cursor)
        ↓
  [2] Lane UI:
        · tools/pull-brand-book.ps1  (jeśli zip w inbox)
        · node gra/tools/poll-claude-design.mjs
        · czyta CZĘŚĆ E / log WYMIANA — czy poprzednia tura done
        · aktualizuje sekcję ▶ START — tura N w DYSPOZYCJA.md
        · dopisuje Designowi: co zrobić + export do inbox
        · meldunek: „Gotowe — START u Design"
        ↓
  [3] Maciej: START (Claude Design)
        ↓
  [4] Design:
        · czyta DYSPOZYCJA (Link local code — odczyt OneDrive) LUB WYMIANA §5
        · wykonuje kroki tury
        · na koniec: export zip → _staging/inbox/
        · CZĘŚĆ E + log WYMIANA „tura N done"
        ↓
  (powrót do [1] na następną turę)
```

---

## Folder inbox (most chmura → OneDrive)

Design **nie zapisuje na C:\** — na koniec tury robi **export zip** do:

```
C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\docs\ux\claude-design\_staging\inbox\brand-book.zip
```

(albo `brand-book-tura-N.zip` — skrypt bierze najnowszy `brand-book*.zip`)

Lane UI przy **START Cursor** uruchamia:

```powershell
.\tools\pull-brand-book.ps1
```

Skrypt rozpakowuje do kanonu `01-propozycje-z-design/brand-book/` i archiwizuje zip.

**Setup jednorazowy (Maciej):** w Design ustaw / przy exportcie wskaż folder `_staging\inbox\` albo zapisuj tam zip ręcznie **jednym** „Zapisz" (nie kopiuj plików po jednym).

---

## Co Lane UI wpisuje Designowi (szablon paczki)

W `brand-book/DYSPOZYCJA.md` sekcja **`# ▶ START — tura N`**:

1. Trigger: `START — tura N`
2. Tabela kroków A/B/C… z DoD
3. **NIE w tej turze** (defer)
4. **Koniec tury Design:**
   - CZĘŚĆ E — raport
   - log WYMIANA `tura N done`
   - **EXPORT:** spakuj `brand-book/` → `_staging/inbox/brand-book.zip`

Design **nie** robi `git commit`. **Nie** prosi Macieja o kopiowanie folderów.

---

## Co Design czyta (Link local code)

Jeśli masz **Link local code** → folder:

`...\Civ\docs\ux\claude-design\`

Design widzi **aktualne** `DYSPOZYCJA.md` i `WYMIANA-UI-DESIGN.md` po tym, jak Lane UI je zaktualizuje (krok [2]) — **bez** ręcznego wgrywania przez Macieja.

---

## Czy to możliwe?

| Element | Możliwe? |
|---------|----------|
| Maciej tylko dwa START | **TAK** |
| Lane UI pisze kolejne paczki w DYSPOZYCJA | **TAK** |
| Design czyta dyspozycję po update Lane UI | **TAK** (Link local code → odczyt OneDrive) |
| Pliki na dysku bez GitHub | **TAK** — export zip → inbox → skrypt |
| Design zapis wprost na C:\ | **NIE** (ograniczenie chmury) |
| Zero jakiejkolwiek akcji przy transferze | **NIE** — na końcu tury Design musi **export zip do inbox** (1 akcja w UI Design, nie przenoszenie plików) |

---

## Pliki operacyjne

| Plik | Kto edytuje |
|------|-------------|
| `brand-book/DYSPOZYCJA.md` — ▶ START | **Lane UI** (paczka) + Design (CZĘŚĆ E) |
| `WYMIANA-UI-DESIGN.md` | Lane UI + Design (log) |
| `_staging/inbox/brand-book*.zip` | Design (export) |
| `docs/obieg/_pull-brand-book-last.md` | skrypt (log) |

---

*Lane UI · protokół dual-START · 2026-07-01*
