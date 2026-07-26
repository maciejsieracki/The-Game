# C-AI-ROZWOJ-PAKIET — szybszy rozwój AI + naprawa niespójności (2026-07-26)

**Status:** 🟢 WDROŻONA (2026-07-26)  
**Grupa:** D + Integrator F

---

## Diagnoza (stan kodu)

| Problem | Skutek |
|---------|--------|
| `Osadnik` w produkcji AI | Martwy kod — jednostki nie ma w `units.json` |
| `foundCity` przez jednostkę | Niezgodne z grą (panel budowy → `foundCityAt`) |
| `canEngageOwner` → `true` dla AI↔AI | Walka bez wypowiedzenia wojny (łamie C-BARB-Q2) |
| Dyplomacja **po** `decideAITurn` | Atak możliwy w tej samej turze co wojna |
| `ekspansywnosc` / `sklonnoscDoPodboju` w `civ-ai.json` | Zapisane, **nigdzie nieczytane** |
| `AI_IMPROVEMENT_PRACA_SURPLUS = 30` | AI rzadko buduje ulepszenia terenu |
| Brak celu ranking Mocy | AI nie dąży do #1 |
| Patrol + cofanie łuczników | Wojsko bierne nawet w pokoju |

**Już działa:** suwaki AI (`decideAIEconomySliders`, C-AI-SUWAKI=A), pula Pracy, cuda, rush za złoto.

---

## Decyzje Macieja

### C-AI-PAKIET-Q1 = **C** (pełny pakiet)

Błędy krytyczne **+** ekonomia **+** warstwa „dąż do #1 w rankingu Mocy" (nowe miasta, budynki, presja na sąsiadów — nie zawsze wojna).

### C-AI-PAKIET-Q2 = **C** (per cywilizacja)

- Wysoka `sklonnoscDoPodboju` (z `civ-ai.json`) → więcej eksploracji, mniej patrolu „wróć do domu".
- Niska → zostaje defensywny patrol (jak dziś).

### C-AI-PAKIET-Q3 = **C** (tylko logika)

**Nie** zmieniać bonusów trudności w `ai-params.json` (0% / +10% / +25% Pracy zostaje).

### Wcześniejsze (ta sama paczka wdrożeniowa)

- **C-AI-WOJNA-Q1=A** — dyplomacja przed ruchem; atak od następnej tury.
- **C-AI-EKSP-Q1=A** — max 1 miasto/turę, koszt Pracy+ludność, panel budowy.
- **C-AI-EKSP-Q2=A** — najpierw konsolidacja klastra, potem founding.

---

## Zakres wdrożenia (checklist)

1. Usunąć osadnika / `foundCity(unit)` z `ai.ts`.
2. `planCityFounding` → `foundCityAt` + heurystyka hex.
3. Bramka wojny AI↔AI + dyplomacja AI↔AI przed ruchem.
4. Podpiąć `ekspansywnosc` + `sklonnoscDoPodboju` z `civ-ai.json`.
5. Cel #1 Mocy — co N tur priorytet: miasta + ekonomia + sąsiedzi.
6. Eksploracja wojska skalowana `sklonnoscDoPodboju`.
7. Próg ulepszeń terenu **zostaje 30** Pracy (C-AI-MOC-Q3=A).

### C-AI-MOC-Q1 = **B**

Co **3 tury**: jeśli AI nie jest #1 w Mocy → wyższy priorytet miast i budynków gospodarczych; przy `sklonnoscDoPodboju ≥ 4` → agresywniejsze cele wojenne.

### C-AI-MOC-Q2 = **A**

Cel wojskowy ekspansji Mocy: **sąsiad w promieniu 8 hex** od własnego terytorium, preferuj **słabszego** przeciwnika.

### C-AI-MOC-Q3 = **A**

`AI_IMPROVEMENT_PRACA_SURPLUS` **zostaje 30** — bez obniżania progu ulepszeń terenu.
