# MASTER → UI · P1 Dyplomacja reskin 1E

**Data:** 2026-07-04  
**Status:** **KANON opublikowany** 2026-07-04 ~14:11  
**Kanon md5:** `55bdb2af4f724f8a4f3da12e23156dc8`

---

## Cel

Port wizualny ekranu dyplomacji do stylu **1E Painted Imperial** — **bez zmian logiki** `diplomacy.ts` / testów `diplomacy-test`.

---

## Źródło Design (gotowe)

| Asset | Ścieżka |
|-------|---------|
| Mockup główny | `docs/ux/claude-design/01-propozycje-z-design/brand-book/The Game - Ekran Dyplomacja (1E).dc.html` |
| Handoff ikon | `docs/ux/claude-design/01-propozycje-z-design/brand-book/eksport/HANDOFF.md` |
| Grupa D (D-02…D-06) | `docs/ux/figma/grupa-D/` · baseline w `REVIEW-PRZED-PO.html` |

**Reguły:** zero emoji · dyplomacja = **uścisk dłoni** (`tb-diplomacy`) · kolory `--tg-*` / tokeny brand.

---

## Pliki lane UI (wyłącznie)

- `gra/src/ui/diplomacyPanel.ts` — panel główny / audiencja
- `gra/src/ui/diploListHud.ts` — lista cywilizacji z HUD
- `gra/src/ui/diplomacyAudience.ts` — jeśli dotyczy skinu
- CSS inline w modułach lub wspólne klasy 1E (jak `cityPanel.ts`)
- **NIE** `main.ts` · **NIE** `diplomacy.ts`

---

## AC (DoD)

- [x] Layout zgodny z mockupem 1E (nagłówek, lista cyw, relacje, akcje)
- [x] Ikony Tier 5 `dip-*` / `ui-*` przez `brandIconSvg` — brak emoji i monospace hacków
- [x] Banery cywilizacji: `civIconSvg` / medaliony (reuse W1c wzorca)
- [x] `node tools/diplomacy-test.cjs` — **143/143** bez regresji
- [x] Build robocza → meldunek `UI-DO-MASTERA.md` · md5 `7e6566eb1257d2eb0306d918123af759`
- [x] Build kanon → `publish-kanon-snapshot.ps1` · md5 `55bdb2af4f724f8a4f3da12e23156dc8`

---

## Po dyplomacji (nie teraz)

- **#2 Nauka** — HOLD do przeglądu Macieja (hub + drzewko)
- **#3 E-15** koniec gry
