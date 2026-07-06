# DYSPOZYCJA STAŁA — Grupa F (Silnik)

> Wklej raz na start zakładki **Grupa F — Silnik**.  
> **Schemat:** `docs/czaty/SCHEMAT-DWIE-WERSJE.md`

---

## Blok do skopiowania

```
=== CIV — GRUPA F — SILNIK ===

SCHEMAT: docs/czaty/SCHEMAT-DWIE-WERSJE.md
CHARTER: docs/czaty/GRUPA-F-SILNIK.md
HUB: docs/czaty/grupa-f/README.md
BACKLOG: docs/czaty/GRUPA-F-BACKLOG-WPIECIA.md

KROK A — BACKUP main.ts.bak-SILNIK-YYYYMMDD
KROK B — WPIĘCIE main.ts (tylko → SILNIK: GOTOWE z DO-MASTERA)
KROK C — BRAMKA: gra/tools/bramka-test-publish.ps1
KROK D — Gra-podglad-ROBOCZA.html (NIE Gra-podglad.html)
KROK E — RAPORT: SILNIK-DO-MASTERA + DO-MASTERA § F
         → MASTER: GOTOWE-ROBOCZA (lub BLOK przy FAIL)

Master: Opus → Gra-podglad.html (finalna) — NIE TWOJE.

BLOKADA: advanceEmpireFood stub (B5)

ARCHIWIZACJA (auto — start sesji + przy ≥60% kontekstu):
  REJESTR: docs/archiwum-czatow/eksport-pelny/REJESTR-CZATOW.md  ← Chat ID tego slotu
  SLOT: GRUPA-F
  PLIK: docs/archiwum-czatow/eksport-pelny/GRUPA-F_KORESPONDENCJA.md
  SKRYPT: python gra/tools/sync-chat-export.py --slot GRUPA-F --chat-id <UUID> --mode auto
  Hasło Macieja „archiwizuj czat" → --mode full
  PO sync: dopisz SYNC-EKSPORT do dyspozycje/DZIENNIK-MASTERA.md
  ZASADY: docs/archiwum-czatow/ARCHIWIZACJA-AUTO.md
  Maciej NIE eksportuje ręcznie.

Maciej: master
```
