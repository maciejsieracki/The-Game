# GRUPA-E → CYWILIZACJE + SILNIK: zwycięstwo v1.0 (ABC 10=A*)

> **Status:** **→ SILNIK: GOTOWE** (lane CYW 2026-06-28) · handoff `CYWILIZACJE-do-SILNIK_victory-10A.md`  
> **Decyzja Macieja:** 2026-06-27 · **10=A*** — dominacja + nauka (kanon poniżej)

---

## Aktywne cele v1.0

Oba — gracz wygrywa spełnieniem **któregokolwiek**:

### 1. Dominacja (Power)

- **Power gracza > 50%** sumy Power wszystkich cywilizacji w grze
- Tylko w **ostatniej epoce**
- **Bez** wymogu eliminacji wszystkich nacji / podboju mapy

**Delta vs kod:** `victory.ts` dziś = eliminacja rywali **tego samego typu** (`playersOfType` + zero miast) — **do wymiany**.

### 2. Nauka (kosmiczna)

- Wszystkie **technologie** zbadane
- **Rakieta z robotami** wystrzelona na **najbliższą planetę** (projekt kosmiczny — tech + produkcja miasta, do rozpisania z `tech.json`)

**Delta vs kod:** flagi `epokaKoncowa` + `naukaUkonczona` — często niepodpięte w `main.ts`; treść nauki do doprecyzowania z drzewkiem.

---

## Powiązane (backlog, nie blokuje 10)

**Rankingi cyw.** — `docs/grupa-e/handoff/E2-rankingi-cywilizacji.md`

---

## DoD

- [x] `checkVictory()` — gałąź dominacji: Power% > 50, gate ostatnia epoka
- [x] Gałąź nauki: all tech + state rakietowy
- [x] Ekran końca gry (UI) — `gra/src/ui/victoryScreen.ts` (wpięcie F: handoff 2026-07-02)
- [x] Test: `victory-test.cjs` 12/12 · `victory-screen-test.cjs` 11/11
- [x] Meldunek CYWILIZACJE-DO-MASTERA (2026-07-02)

**Flaga:** **→ INTEGRATOR: GOTOWE** (UI moduł) · czeka F `main.ts`
