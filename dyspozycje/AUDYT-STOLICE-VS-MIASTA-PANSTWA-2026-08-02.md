# Audyt: 4 bliskie etykiety miast ≠ bypass sep stolic

**Data:** 2026-08-02 · **Branch:** `cursor/audit-capital-sep-vs-city-states-63a1` · **Baza:** `6f96f08` (FALA 199–200)

## Werdykt: DESIGN_KLASTRA (nie bug bramki stolic)

Maciej widzi na mapie ~4 bliskie etykiety (np. krótkie nazwy z puli klastra, ~2–4 hex wizualnie).
Pamięta min. ~12 hex między **stolicami**.

**W kodzie (Standard 168×120):** stolice **różnych** cywilizacji mają twardy sep **14 hex**.  
Cztery bliskie nazwy to niemal na pewno **jeden klaster**: 1 stolica + miasta-państwa (ta sama kultura / ta sama pula nazw) — albo stolica gracza + deferred MP tego samego typu.

**Zmiana gameplayu: NIE** — bez decyzji Macieja (ABC UX poniżej, tylko jeśli chce czytelniejszego rozróżnienia).

---

## Dowody w kodzie

| Reguła | Wartość | Plik |
|--------|---------|------|
| Sep stolic Standard (`duza`) | **14 hex** | `gra/src/map/clusters.ts` → `capitalMinSeparation` |
| Sep Mała/Średnia / Duża / Super | 12 / 16 / 19 | j.w. |
| Bramka mapy (harness) | `short < 80` → sep=0; Standard nie | `capitalMinSeparationForMap` |
| MP w klastrze (min/max pierścień) | **5 / 5 hex** | `CLUSTER_CITY_STATE_MIN_HEX` / `MAX` |
| Obcy typ od stolicy gracza | min **12**, realnie ≥ sep stolic | `MIN_DIST_FOREIGN_FROM_PLAYER` + `minDystObcyOdGracza` |
| Menu Standard: MP per klaster | min **4** · default **5** · max 7 | `newGameMapDefaults.ts` `MIASTA_PANSTWA_MENU_BY_TIER` |

### Bramki stolic (twarde, bez luzowania na Standardzie)

1. `passesMinCapitalSeparationGate` — każda nowa stolica vs `priorCapitals` ≥ `minSep`.
2. `enforceHardCapitalSeparationOnKlastry` — końcowa naprawa: relokacja lub **drop typu** (nie zejście poniżej progu).
3. `cluster-spawn.ts` HARD apply — drop całego obcego typu, jeśli stolica &lt; `minCapitalSep`.

Jedyny fail-open: mapa testowa `short < 80` (`minSep=0`) albo pusta lista prior (pierwsza stolica).

### Pakowanie miast-państw

- `packCityStatesHubChain`: pierścień `ringDist=5`, `minSep=5` (przy half-plane gracza luzowanie do **3** hex — nadal nie 2).
- Pierwsze MP: dokładnie 5 hex od stolicy; kolejne: łańcuch hubów — skupisko ciasne (~5 hex).
- Chip mapy (`cityMapStatChip`): nazwa **WIELKIMI LITERAMI**; MP dostają dopisek „· miasto-państwo” (`formatCityMapLabel`), stolica obca — bez. Obie nazwy z tej samej puli `nazwyKlastra` / `miasta_panstwa` → wyglądają podobnie.

### Dlaczego „4 etykiety”

Przy **min = 4** miastach-państwach w menu: **1 stolica + 3 MP = 4 etykiety** w jednym klastrze.  
Default Standard = **5** MP → do 6 miast w obcym klastrze.  
Chipy na mapie nachodzą się wizualnie — 5 hex może wyglądać jak 2–4.

---

## Testy

- `node tools/capital-sep-unit-test.cjs` — tabela sep + hub-chain MP (≥5 od core, pierścień 5) → **36 PASS**.
- `capital-sep-pangea-test.cjs` — asercjonuje **tylko stolice** (nie MP); to zamierzone.

---

## Co NIE zmieniamy teraz

- Nie luzujemy / nie zaostrzamy sep stolic.
- Nie rozsuwamy MP w klastrze bez ABC Macieja.
- Nie deploy do `gra-robocza` z chmury.

---

## Opcjonalne ABC (tylko UX czytelności — nie bug)

Zapisane też w `PYTANIA-OTWARTE.md` jako `MAP-UX-CLUSTER-LABEL`.

**Sytuacja:** skupisko 1 stolicy + MP wygląda jak „kilka stolic obok siebie”.  
**Cel:** czy gracz ma od razu odróżniać stolicę klastra od miast-państw na mapie.  
**A)** Zostawić (dopisek „· miasto-państwo” w etykiecie).  
**B)** Stolica obca = nazwa cywilizacji; MP = nazwa miasta + dopisek.  
**C)** Marker wizualny stolicy (korona / grubsza obwódka), nazwy bez zmian.  
**Rekomendacja:** B (jeśli Maciej w ogóle chce zmianę).
