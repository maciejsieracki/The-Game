# Kandydaci do usunięcia / archiwum

> **Decyzja Macieja wymagana** — nic nie kasujemy bez Twojego OK.  
> Data propozycji: 2026-06-27

---

## A. Bezpieczne do przeniesienia do `_deprecated/` (już wycofane)

| Plik | Powód |
|------|-------|
| `docs/MASTER-KOORDYNACJA.md` | Stub — model wycofany 26.06 |
| `docs/MASTER-WORK-PROTOKOL.md` | Oznaczony NIEAKTUALNY |
| `docs/czaty/MASTER-ROUTING-2026-06-27.md` | Zastąpiony przez SCHEMAT + OD-MASTERA §F; treść sprzeczna z ABC1=A |

**Akcja:** przeniesiono do `docs/master/_deprecated/` (jeśli istniały).

---

## B. Archiwum historyczne (zostawić, nie używać operacyjnie)

| Plik / katalog | Powód |
|----------------|-------|
| `docs/archiwum-claude-code/` | Eksport Claude Code — legacy |
| `ANALIZA-ARCHITEKTURY-Civ.md` (root) | md5 `90695efc` — bardzo stary |
| `dyspozycje/_handoff/SILNIK-handover-do-MASTER_2026-06-24.md` | Handover sprzed modelu Grupa F |
| `dyspozycje/_scalone/` | Lane scalone (MIASTO, DANE, AI) |
| Wpisy `DO-MASTERA` z `Gra-podglad-TEST.html` | Historia — disclaimer w nagłówku |

---

## C. Duplikaty / konsolidacja (nie delete — merge lub stub)

| Problem | Propozycja |
|---------|------------|
| `docs/MACIEJ-*.md` vs `docs/master/maciej/` | Stuby redirect w `docs/` (zrobione dla KARTA-index) |
| `docs/MASTER-SILNIK.md` vs `docs/master/protokoly/` | Stub → `docs/master/README.md` |
| `decyzje/README.md` vs `STATUS.md` | Zsynchronizować statusy tematów |
| Brak `A3-ruch-armie.md`, `A4-budowanie.md`, `A5-wyglad-mapy.md` | Utworzyć stub lub usunąć referencje z README |

---

## D. Handoffy potencjalnie zrealizowane (weryfikacja przed kasacją)

> **Nie usuwać** bez potwierdzenia Grupy F że batch jest w main.

| Handoff | Status |
|---------|--------|
| `UI-do-MASTER_hud-D1B-mockupy.md` | Częściowo wpięte F-HUD |
| `UI-do-MASTER_B2-spoleczenstwo.md` | F-B2 wpięte |
| `C1-do-SILNIK_batch-test.md` | F-C1 wpięte |
| Stare `*-TEST*` w nazwach | Zamienić na ROBOCZA w opisach |

Pełna lista propozycji Grupy F: `docs/czaty/grupa-f/PROPOZYCJA-ARCHIWUM.md` (jeśli istnieje).

---

## E. Nie usuwać

- `docs/czaty/OD-MASTERA.md`, `DO-MASTERA.md`
- `dyspozycje/DZIENNIK-MASTERA.md`
- `dyspozycje/_handoff/` (aktywne kontrakty)
- `docs/decyzje/DYSPOZYCJA-STALA.md`
- `.cursor/rules/civ-workflow.mdc`

---

**Następny krok:** przejrzyj listę A–D i napisz np. „usuń A" / „zostaw B" / „scal C".
