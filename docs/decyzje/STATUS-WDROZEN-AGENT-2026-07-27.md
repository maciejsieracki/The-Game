# Status wdrożenia — dla innych agentów (2026-07-27)

> **Aktualna ROBOCZA:** FALA 38 · md5 `08c676a5` · commit *(po push F38)* · wejście `gra-robocza/START.html`  
> **Źródło deploy:** `dyspozycje/WERSJE.md` · potwierdzenie: `dyspozycje/_handoff/KANAL-PRACA.md` [17:25]

## Legenda

| Symbol | Znaczenie |
|--------|-----------|
| ✅ GOTOWY | Kod w `gra/src/`, testy lane zielone |
| ✅ DEPLOY | W `gra-robocza/` w wskazanej FALI |
| ⏸ CZEKA DEPLOY | Kod gotowy lokalnie, **nie** w ostatnim publishu |
| ❌ BRAK KODU | Tylko decyzja — czeka implementacja |
| 🔴 BLOK | Subagent przerwany (API limit itp.) |

---

## Subagenty — stan po FALI 37

| ID | Subagent | Kod | Deploy F37 | Uwagi |
|----|----------|-----|------------|-------|
| **ZNALEZISKO-86** | [ZNALEZISKO-86 HP pasek](77a6cd0b-1d17-4dbd-8fa7-a8d503b4c305) | ✅ | ✅ | `endDetails1E.ts` |
| **R-PIERWSZE-MIASTO** | [R-PIERWSZE-MIASTO B](c38d2451-fdfd-46d0-8f2b-79ca27834f40) | ✅ | ✅ | `main.ts` + `buildModeHud.ts` |
| **C-OBCE-JEDN-Q1** | [C-OBCE-JEDN-Q1 panel](3aee9402-7bcf-4d3c-a4fe-184dfc25569c) | ✅ | ✅ | panel obcej jednostki |
| **C-OBCE-JEDN-Q3** | [C-OBCE-JEDN-Q3 edukacja](d729bf2e-1b09-4bb4-9869-cd33a5296c01) | ✅ | ✅ | hint + tooltip ★ |
| **R-DYP-STOL-A** | [R-DYP-STOL-A B+C](6fd4620f-691e-4e34-a091-f00b255b3ca6) | ✅ | ✅ | koszyk traktatów · dyplomacja 113/113 |
| **PYTANIE-84** | [PYTANIE-84 runtime](6f1e249a-10a3-45e7-8505-15170b77c454) | ✅ | ✅ | `building-resource-gate.ts` · 49/49 |
| **PYTANIE-77-DOP** | [PYTANIE-77-DOP 1 tura](5bd402cb-7274-4b6e-b87c-7304bd3ad0b8) | ✅ | ✅ | `mennica-zloto-grace.ts` · 49/49 |
| **C-OBCE-JEDN-Q2** | [C-OBCE-JEDN-Q2 render TW](73d59d9d-b7b5-4aad-993a-c5f8f6b49f09) | 🔴 BLOK | — | API limit — **ponowić Opus** (`gra/src/render/`) |
| **DYSPOZYCJA-85-SUWAK** | [DYSPOZYCJA-85 suwak C](efcb9c89-61c0-408b-a2da-b20b49699ce9) | ✅ | ✅ **FALA 38** | `08c676a5` |

---

## Własność sesji (nie duplikować)

| Temat | Status |
|-------|--------|
| Paczka ABC + subagenty powyżej (poza Q2) | ✅ w F37 — **IDLE** |
| **C-OBCE-JEDN-Q2** (portret/sygnet lewo) | 🔴 czeka ponowienia subagenta Opus |
| **DYSPOZYCJA-85** globalny suwak | ✅ FALA 38 |
| R-MUZYKA · R-FULLSCREEN | ❌ bez kodu |

---

## Kolejny deploy (FALA 38)

Gdy Maciej powie **deploy** / **push**:

1. `git pull --ff-only origin main`
2. Sprawdź `ROBOCZA-MANIFEST.json` = `6691eb3e`
3. Domknij commit: DYSPOZYCJA-85 wire (`main.ts` + fix `empireDetailPanel.ts`)
4. Opcjonalnie: C-OBCE-JEDN-Q2 po udanym subagencie
5. `tsc` + testy lane → build → `publish-robocza-snapshot.ps1` → `WERSJE.md` + `KANAL-PRACA.md`

---

## Powiązane pliki

- `docs/decyzje/ABC-KOLEJKA-OTWARTE-2026-07-27.md`
- `dyspozycje/WERSJE.md`
- `docs/MACIEJ-GOTOWE.md`
