# Grupa F (Silnik) — katalog roboczy

> **Jeden punkt wejścia** dla czatu Grupa F. Kod gry: `gra/src/main.ts` (wyłącznie F).  
> Publikacja robocza: `Gra-podglad-ROBOCZA.html` · Finalna: `Gra-podglad.html` (Master + Opus).

**Ostatnia aktualizacja:** 2026-06-27 (audyt sesji autonomicznej)

---

## Start sesji (kolejność czytania)

| # | Plik | Po co |
|---|------|--------|
| 1 | [STAN-WDROZENIA.md](./STAN-WDROZENIA.md) | Co DONE / PARTIAL / TODO (1 strona) |
| 2 | [AUDYT-PELNY-2026-06-27.md](./AUDYT-PELNY-2026-06-27.md) | Raport F → **Master** (nie dla Macieja) |
| 3 | [INDEX-PLIKOW.md](./INDEX-PLIKOW.md) | Mapa wszystkich plików w zakresie F |
| 4 | [PROPOZYCJA-ARCHIWUM.md](./PROPOZYCJA-ARCHIWUM.md) | Co usunąć/przenieść (decyzja Macieja) |
| 5 | `../../decyzje/STATUS.md` | Dashboard decyzji (F aktualizuje) |
| 6 | `../../../dyspozycje/SILNIK-DO-MASTERA.md` | Raport operacyjny F → Master (append-only) |
| 7 | [SYNC-EXCEL-STATUS.md](./SYNC-EXCEL-STATUS.md) | Excel `Status-projektu` — arkusz Grupa-F |

---

## Charter i flow (pozostają w `docs/czaty/`)

| Plik | Rola |
|------|------|
| [../GRUPA-F-SILNIK.md](../GRUPA-F-SILNIK.md) | Charter — co F robi / nie robi |
| [../DYSPOZYCJA-GRUPA-F.md](../DYSPOZYCJA-GRUPA-F.md) | Blok wklejany na start czatu |
| [../GRUPA-F-BACKLOG-WPIECIA.md](../GRUPA-F-BACKLOG-WPIECIA.md) | Kolejka batchy (Master utrzymuje) |
| [../SILNIK-MASTER-FLOW.md](../SILNIK-MASTER-FLOW.md) | F ↔ Master ↔ Opus |
| [../SCHEMAT-DWIE-WERSJE.md](../SCHEMAT-DWIE-WERSJE.md) | ROBOCZA vs finalna |

---

## Komunikacja

| Kierunek | Plik |
|----------|------|
| Lane → F | `../DO-MASTERA.md` (§ A–E, flaga `→ SILNIK: GOTOWE`) |
| F → Master | `../DO-MASTERA.md` § F + `SILNIK-DO-MASTERA.md` |
| Master → F | `../OD-MASTERA.md` § Grupa F |
| Handoffy | `../../../dyspozycje/_handoff/*SILNIK*` (aktywne) |
| Archiwum handoff | `../../../dyspozycje/_handoff/_archiwum/silnik/` |

---

## Bramka

```powershell
cd gra
.\tools\bramka-test-publish.ps1
```

Wynik: `Gra-podglad-ROBOCZA.html` + md5 w konsoli → raport `→ MASTER: GOTOWE-ROBOCZA`.

---

## Backup main.ts (przed każdym batchem)

```powershell
Copy-Item gra\src\main.ts gra\src\main.ts.bak-SILNIK-YYYYMMDD-<id>
```

*(Pliki `*.bak-*` są w `.gitignore` — tylko lokalnie / OneDrive.)*
