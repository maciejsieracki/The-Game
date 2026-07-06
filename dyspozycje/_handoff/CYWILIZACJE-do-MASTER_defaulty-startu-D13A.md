# CYWILIZACJE → MASTER (dla SILNIK + UI): defaulty ekranu „Nowa gra" — D13=A

**Data:** 2026-06-26 · **Decyzja Macieja:** D13=A · **Lane:** CYWILIZACJE dostarcza propozycję; **MASTER** wpina w `main.ts` + `newGameFlow.ts`.

## Propozycja defaultów (gracz może od razu kliknąć START)

| Pole ekranu | Domyślna wartość | Klucz techniczny | Źródło danych |
|---|---|---|---|
| Cywilizacja gracza | **Rzymianie** | `ikonaId` / `typCywilizacji`: `rzymianie` | `civs.json` |
| Trudność AI | **Normalna** (poziom 2) | `poziomTrudnosci: 2` | `ai-params.json` |
| Tempo gry (nauka) | **Normalne / standardowa** | `tempoGry: 'standard'` (×1.0) | `tech.json` → `tempo_gry` + `tech-tempo.ts` |
| Epoka startu | **Kamień** | `epokaStartu: 1` | decyzja v0.1 (3 epoki: Kamień/Brąz/Żelazo) |
| Rozmiar mapy | **Mała** | `rozmiar: 'mala'` (~3 aktywne typy, min_dist adaptacyjny) | MAPA `generujSwiat` / `clusters.ts` |
| Liczba rywali (typów) | **3 rywali** (+ gracz = 4 typy na małej mapie) | wg MAPA: Mała → 3 typy aktywne | `clusters.ts` heurystyka area |
| Typ świata | **Kontynenty** | `typSwiata: 'kontynenty'` | MAPA handoff domyslne-decyzje |
| Seed | **Losowy** | nowy seed co start | MAPA |

## Zasada UX (D13=A, zgodna z MAPA)

- Wszystkie pola **wstępnie zaznaczone**; przycisk „Dalej/Start" **aktywny od razu**.
- Zmiana dowolnego pola nadpisuje tylko tę wartość; reszta zostaje domyślna.

## Co MASTER ma z tym zrobić

1. **UI (`newGameFlow.ts`):** ustawić powyższe wartości jako `selected*` / stan początkowy formularza.
2. **SILNIK (`main.ts`):** przy braku wyboru gracza przekazać `player.civType = 'rzymianie'`, `tempoGry = 'standard'`, `poziomTrudnosci = 2`, `epokaStartu = 1`, parametry mapy Mała/Kontynenty.
3. **AI start:** archetyp z `civs.json` (`archetyp: 'rzym'` dla Rzymian) zamiast fallbacku `'grecy'`.
4. **Ripple RDY-09:** po zmianie `ikonaId` Sumerów na `babilon` — UI mockup (`UI/Makieta-flow-nowa-gra.html`) i MAPA `clusters.ts` ROSTER nadal mają `sumerowie` → zsynchronizować (patrz meldunek Sprint 1).

## DoD

- [ ] Nowa gra: jeden klik START bez zmiany opcji → Rzym, Normal, Normal tempo, Kamień, Mała mapa, 3 typy rywali.
- [ ] AI rywale dostają archetypy z `civs.json`, nie fallback 0.5.
- [ ] Playtest 5 min bez wymuszania kliknięć w menu.

## Status

**GOTOWE** (propozycja danych). Wpięcie = lane MASTER/SILNIK + UI.
