# Grupa F — indeks plików w zakresie

**Data:** 2026-06-27

---

## A. Katalog roboczy F (NOWY — tu zaczynaj)

| Plik | Opis |
|------|------|
| `docs/czaty/grupa-f/README.md` | Hub |
| `docs/czaty/grupa-f/STAN-WDROZENIA.md` | DONE/TODO 1 strona |
| `docs/czaty/grupa-f/AUDYT-PELNY-2026-06-27.md` | Raport dla Macieja |
| `docs/czaty/grupa-f/INDEX-PLIKOW.md` | Ten plik |
| `docs/czaty/grupa-f/PROPOZYCJA-ARCHIWUM.md` | Cleanup |

---

## B. Charter i flow (`docs/czaty/`)

| Plik | Aktywny? |
|------|----------|
| `GRUPA-F-SILNIK.md` | ✅ TAK |
| `DYSPOZYCJA-GRUPA-F.md` | ✅ TAK |
| `GRUPA-F-BACKLOG-WPIECIA.md` | ✅ TAK (Master sync) |
| `SILNIK-MASTER-FLOW.md` | ✅ TAK |
| `SCHEMAT-DWIE-WERSJE.md` | ✅ TAK |
| `DO-MASTERA.md` § F | ✅ TAK (append) |
| `OD-MASTERA.md` § F | ✅ TAK |
| `MASTER-ROUTING-2026-06-27.md` | 🟡 odniesienie; część TEST→ROBOCZA |
| `MASTER-SILNIK-CZAT.md` | ✅ TAK |
| `DYSPOZYCJA-MASTER-SILNIK.md` | ✅ TAK |
| `PLAYTEST-DLA-MACIEJA.md` | 🟡 czeka ROBOCZA |

---

## C. Operacyjne (`dyspozycje/`)

| Plik | Aktywny? |
|------|----------|
| `SILNIK-DO-MASTERA.md` | ✅ append-only raport F |
| `DZIENNIK-MASTERA.md` | ✅ wpisy F |
| `SILNIK.md` | ❌ LEGACY — propozycja archiwum |

---

## D. Handoffy SILNIK — aktywne

| Plik | Status kodu |
|------|-------------|
| `C1-do-SILNIK_batch-test.md` | ✅ wpięte |
| `EKONOMIA+UI-do-SILNIK_B2-porzadek-komplet.md` | ✅ wpięte |
| `MAPA-do-SILNIK_B2-Q5-bunt-hex.md` | ⏳ CZEKA MAPA |
| `UI-MAPA-do-SILNIK_D1B-A4-batch.md` | ❌ F-HUD-2 TODO |

---

## E. Handoffy — archiwum (`_handoff/_archiwum/silnik/`)

| Plik | Powód |
|------|--------|
| `C1-do-SILNIK_preBattle-wpiecie.md` | superseded przez batch-test |
| `SILNIK-handover-do-MASTER_2026-06-24.md` | handover historyczny |
| `MIASTO-do-SILNIK_integracja.md` | 2026-06-23 |
| `EKONOMIA-do-SILNIK-upkeep.md` | 2026-06-23 |
| `EKONOMIA-do-SILNIK-economy-edits.md` | 2026-06-22 |

---

## F. Decyzje i dashboard (`docs/decyzje/`)

| Plik | F aktualizuje? |
|------|----------------|
| `STATUS.md` | ✅ TAK |
| `MAPA-PYTAN-OPEN.md` | 🟡 sync z Master |
| `OPUS-REVIEW-QUEUE.md` | 🟡 Master po ROBOCZA |
| `DYSPOZYCJA-STALA-SILNIK.md` | ✅ wskazuje `grupa-f/` |
| `C1-wejscie-walke.md` | read-only |
| `E1-PYTANIA-DO-SILNIKA.md` | read-only (otwarte Q9–Q12) |

---

## G. Legacy (poza `grupa-f/` — nie używać operacyjnie)

| Plik / folder | Uwaga |
|---------------|--------|
| `SILNIK/` (root) | stary folder lane; `README-SILNIK.md` |
| `docs/MASTER-SILNIK.md` | duplikat? sprawdzić vs `docs/czaty/` |
| `docs/analiza/01-SILNIK-main.md` | analiza historyczna |
| `docs/archiwum-claude-code/raw/01-SILNIK.md` | archiwum Claude |

---

## H. Kod (F edytuje tylko)

| Plik | Rola |
|------|------|
| `gra/src/main.ts` | jedyny editor integracji |
| `gra/tools/bramka-test-publish.ps1` | bramka ROBOCZA |
| `Gra-podglad-ROBOCZA.html` | output bramki (brak) |
| `Gra-podglad.html` | finalna — **Master only** |

UI lane (F wpięcie, nie własność): `gra/src/ui/hud.ts`, `*Hud.ts`, `preBattle.ts`

---

## I. Excel (Maciej / Master)

| Plik | Temat |
|------|--------|
| `Status-projektu-The-Game.xlsx` | postęp projektu |
| `MIASTO/Ulepszenia-terenu.xlsx` | D4 ulepszenia |
| `Civ-CYWILIZACJE/Bonusy-cywilizacji-9x3.xlsx` | D4 bonusy (draft) |
