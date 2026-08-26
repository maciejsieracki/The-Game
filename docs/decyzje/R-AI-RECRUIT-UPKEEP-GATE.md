# R-AI-RECRUIT-UPKEEP-GATE — bramka rekrutacji: rezerwa utrzymania surowcowego

**Status:** ⛔ **WYCOFANA 2026-08-26 przez [`R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1`](../../dyspozycje/autobot/runs/R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1/)** — poprzednio 🟢 WDROŻONA (kod)  
**Data:** 2026-08-06 (wycofanie: 2026-08-26)  
**Grupa:** D (Cywilizacje / AI) + Integrator (parytet gracza)

---

## Decyzja Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **R-AI-RECRUIT-UPKEEP-GATE** | **działaj** (domyślny próg) | **Nie rekrutuj** jednostki, jeśli pula państwa nie pokrywa **1 tury** utrzymania surowcowego tej jednostki (`unitResourceUpkeep` z `economy-upkeep.ts` / pola `Utrzymanie surowiec` + ilość), **oprócz** zwykłego kosztu rekrutacji `unitStockCost`. Próg = **1× utrzymanie/turę** (nie 5 tur). |

**Parytet:** ta sama bramka dla **AI**, **miast-państw (MP)** i **gracza** — ownerId-agnostyczna, bez specjalnych ścieżek.

---

## ⛔ WYCOFANIE — 2026-08-26

**Ta decyzja NIE OBOWIĄZUJE.** Właściciel wycofał ją decyzją z 2026-08-20, powtórzoną
2026-08-26: do rekrutacji liczy się **wyłącznie jednorazowy koszt zakupu**
(`unitStockCost`), a utrzymanie jest rozliczane **dopiero w następnej turze** wraz
z istniejącymi konsekwencjami niedoboru — doliczanie 1 tury utrzymania do bramki zakupu
blokowało rekrutacje, na które gracza stać (Wojownik 50 Drewna przy puli 57 Drewna).

Obowiązujący kontrakt i dowody: [`R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1`](../../dyspozycje/autobot/runs/R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1/).
Treść historyczna poniżej zostaje nienaruszona jako zapis pierwotnego ustalenia —
**nie jest opisem dzisiejszego kodu**.

---

## Semantyka

| Element | Źródło | Kiedy sprawdzane |
|---------|--------|------------------|
| Koszt rekrutacji surowcowy | `unitStockCost(units.json Surowiec)` | Już istniejąca bramka (JEDNOSTKI-SUROWIEC-01) |
| Rezerwa utrzymania | `unitResourceUpkeep(units.json Utrzymanie surowiec)` × **1 turę** | **Nowa** bramka — pula państwa musi mieć zapas na 1 turę utrzymania nowej jednostki |
| **Łączna bramka** | `canAffordUnitRecruitFull` = merge(`unitStockCost`, `unitRecruitUpkeepReserve`) | Sprawdzana **przed** poborem surowca — nie osobno na pełnej puli |

Przykład: **Włócznik** — rekrutacja `unitStockCost` = 10 brązu, utrzymanie = 2 brązu/turę.  
Gracz/AI z **10 brązu** w puli: może zapłacić rekrutację, ale **nie może** werbować (10 − 10 rekrut < 2 rezerwy).  
Z **12+ brązu**: rekrutacja OK (10 koszt + 2 rezerwa).

Jednostki **bez** `Utrzymanie surowiec` (np. Osadnik): bramka przepuszcza — zero regresji.

---

## Wpięcie (kod)

| Ścieżka | Plik | Funkcja |
|---------|------|---------|
| AI `canAfford` / `chooseCityProduction` | `main.ts` | `canAfford` w `decideAITurn` opts |
| AI enqueue jednostki (Praca) | `main.ts` | handler `cmd.type === 'build'`, `item.kind === 'jednostka'` |
| AI rush za złoto | `main.ts` | `purchaseRecruitmentUnit` (ownerId-agnostyczne) |
| Gracz — rekrutacja za złoto | `main.ts` + `cityPanel.ts` | `purchaseRecruitmentUnit` / `recruitUnit` |
| Gracz — kolejka Pracy | `cityPanel.ts` | `addItem` (jednostka) |
| UI blokada przycisku | `cityPanel.ts` | `appendUnitRecruitCompactRow` |
| Boost ekonomii AI przy deficycie | `ai.ts` | `collectMilitaryRecruitStockDeficits` (+ klucze z rezerwy) |
| Helper | `economy-upkeep.ts` | `canAffordUnitRecruitFull`, `unitRecruitFullStockCost`, `canAffordUnitRecruitUpkeepReserve`, `unitRecruitUpkeepReserve`, `UNIT_RECRUIT_UPKEEP_RESERVE_TURNS = 1` |

---

## Hint UI (gracz)

Gdy `canAffordUnitRecruitFull` odmawia rekrutacji: **jeden** komunikat łączny `UNIT_RECRUIT_FULL_HINT` („rekrutacja + utrzymanie 1 tura”), jeśli pula pokrywa sam `unitStockCost` — np. Włócznik 10–11 brązu przy koszcie 12. Osobny `UNIT_RECRUIT_STOCK_ONLY_HINT` tylko gdy brakuje na sam koszt rekrutacji (`!canAffordBuildingStock(pool, stockCost)`). Panel miasta: tooltip `Brakuje w magazynie: …` z `unitRecruitFullStockCost` (łączny merge).

## Test

`gra/tools/ai-recruit-upkeep-gate-test.cjs` — min. 4 asercje: próg 1×, blokada/OK, parytet gracz=AI, jednostka bez upkeep; asercja stałych hintów UI.

---

## AC

- `npx tsc --noEmit` PASS  
- `node tools/ai-recruit-upkeep-gate-test.cjs` PASS  
- Parytet AI = gracz = MP (ta sama funkcja `canAffordUnitRecruitFull` na puli `ownerResourceStockAll`)
