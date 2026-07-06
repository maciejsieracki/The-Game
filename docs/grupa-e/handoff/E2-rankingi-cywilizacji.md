# E2 — Rankingi cywilizacji (Power, nauka, …)

> **Status:** BACKLOG produktowy (Maciej 2026-06-27 przy ABC **10=A**) — **bez litery ABC** · v1.0 scope do potwierdzenia Master  
> **Lane:** UI (panel) + CYWILIZACJE (dane) + SILNIK (agregacja Power — czeka Grupa B)

---

## Intencja Macieja

Gracz widzi **rankingi** cywilizacji wg różnych metryk (min. **Power**, **nauka**, potem inne składniki). Pokazują **Twój stan** względem świata.

### Nieodkryte nacje

| Aspekt | Reguła |
|--------|--------|
| Liczenie | **Tak** — nieznane cywilizacje **wchodzą** do rankingu (wpływają na procenty, miejsca) |
| Tożsamość | **Nie** — brak kontaktu = **nie pokazujemy**, kto jest 1., 2., … (anonimowe sloty / „?" / „Nieznana cywilizacja") |
| Kontakt | Po odkryciu/dyplomacji — ujawnienie nazwy i szczegółów w rankingu |

---

## Powiązania

- **Power** — wyliczanie: Grupa B (`computePowerContributions…`); HUD: Grupa A (A1-Q15=A)
- **Dominacja (10=A*)** — zwycięstwo gdy Power gracza **> 50%** w ostatniej epoce
- **Dyplomacja** — Grupa D (Respekt, tier kontaktu)

---

## Propozycja UI (do mockupu)

- Panel rankingu (overlay lub zakładka dyplomacji / end-turn)
- Kolumny: miejsce · nazwa (lub „?") · Power · postęp nauki · …
- Wiersz gracza zawsze podświetlony

---

## DoD (gdy Master przydzieli)

- [ ] Spec metryk rankingu (min. Power %, tech count / epoka nauki)
- [ ] Logika „odkryty vs nieodkryty" per `ownerId`
- [ ] UI panel + meldunek DO-MASTERA

**Flaga:** BACKLOG — nie blokuje ABC 11–12
