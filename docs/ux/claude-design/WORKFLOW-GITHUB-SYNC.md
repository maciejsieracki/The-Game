# Workflow dual-START + GitHub (sync chmura Design → dysk Macieja)

**Decyzja Macieja 2026-07-01:** GitHub jako most — Design **commit + push**, Maciej/Lane UI **git pull**.

Maciej nadal robi **tylko dwa START** na turę. Resztę spinają dyspozycje + git.

---

## Cykl jednej tury

```
[1] Maciej: START (Cursor)
      ↓
[2] Lane UI:
      · git pull origin main
      · poll brand-book/
      · czyta CZĘŚĆ E / log WYMIANA
      · pisze ▶ START — tura N w DYSPOZYCJA.md (+ WYMIANA)
      · git commit + push dyspozycji (tylko docs/ux/claude-design/)
      ↓
[3] Maciej: START (Claude Design)
      ↓
[4] Design:
      · git pull (albo czyta repo)
      · wykonuje ▶ START
      · commit + push brand-book/ + WYMIANA log
      ↓
(powrót do [1])
```

---

## Setup jednorazowy (Maciej + MASTER)

| # | Krok | Kto |
|---|------|-----|
| 0.1 | Utwórz **prywatne** repo GitHub (np. `Civ-The-Game`) | Maciej |
| 0.2 | Lokalnie: `git remote add origin https://github.com/<user>/<repo>.git` | Maciej |
| 0.3 | Pierwszy push gałęzi `main` (cały projekt lub minimalnie `docs/ux/claude-design/`) | Maciej / MASTER |
| 0.4 | W **Claude Design**: podłącz repo GitHub · autoryzacja | Maciej |
| 0.5 | Reguła Design: commit **tylko** pod `docs/ux/claude-design/` | Design |

**Stan lokalny 2026-07-01:** ✅ `origin` → `https://github.com/maciejsieracki/The-Game.git` · `main` pushed · tracking `origin/main`.  
**Pozostało:** 0.4 — podłączenie repo w Claude Design.

---

## Ścieżki commit (Design — TYLKO te)

```
docs/ux/claude-design/01-propozycje-z-design/brand-book/
docs/ux/claude-design/WYMIANA-UI-DESIGN.md
docs/ux/claude-design/01-propozycje-z-design/brand-book/DYSPOZYCJA.md
```

**NIE** commituj całego `gra/src/` naraz · **NIE** `Gra-podglad.html` w pierwszych turach Design.

---

## Koniec tury — Design (zamiast zip inbox)

```bash
git add docs/ux/claude-design/01-propozycje-z-design/brand-book/
git add docs/ux/claude-design/WYMIANA-UI-DESIGN.md
git commit -m "design(tura-N): opis krotki"
git push origin main
```

Log WYMIANA: `tura N done · pushed main`

---

## START Cursor — Lane UI

```powershell
.\tools\sync-design-github.ps1
cd gra; node tools/poll-claude-design.mjs
```

Potem aktualizacja `DYSPOZYCJA.md` + push dyspozycji (Lane UI lub Maciej).

---

## Skrypt

| Plik | Rola |
|------|------|
| `tools/sync-design-github.ps1` | `git pull` + log |
| `gra/tools/poll-claude-design.mjs` | liczba plików brand-book |

Log pull: `docs/obieg/_sync-design-github-last.md`

---

## Deprecated

| Model | Status |
|-------|--------|
| zip `_staging/inbox/` | **deprecated** — zastąpione GitHub |
| SKOPIUJ do C:\ | **deprecated** — chmura nie ma zapisu |
| Claude Code lokalnie | opcja alternatywna — nie aktywna |

---

*Lane UI · GitHub sync · 2026-07-01*
