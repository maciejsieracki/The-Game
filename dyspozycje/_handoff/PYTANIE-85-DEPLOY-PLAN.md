# PYTANIE-85 — plan wdrożenia (paczki deploy)

**Decyzja Macieja (2026-07-27):** powolny deploy — każda paczka osobno, **bez push** bez hasła `push`/`deploy`.

## Stan wyjściowy (sesja 2026-07-27 wieczór)

| Obszar | Pliki | Status |
|--------|-------|--------|
| Silnik centrali | `empire-food.ts`, `population-growth-v85.ts` | częściowo — `advanceEmpireFood` OK, `applyCentralFoodPopulationGrowth` **nie wpięte** w `main.ts` |
| Tick miasta | `turn-economy.ts` | **podwójna ścieżka** — stary `populationGrowth` + nowe pola `kosztRacji` |
| Dane | `econ-params.json` | brak `racje_*`, `magazyn_centralny_*` |
| UI miasto | `cityPanel.ts` | brak batonów racji 1/2/3 |
| UI centrala | `empireDetailPanel` / HUD | brak kanonu etykiet |
| Głód wojska 75% | combat | **nie wdrożone** |

## Paczki deploy (kolejność)

| Batch | PYTANIE | Zakres | Subagent |
|-------|---------|--------|----------|
| **P85-B1** | Q1,Q2,Q6,Q7 | Silnik: jedna ścieżka wzrostu, centrala, testy logiki | SA-silnik |
| **P85-B2** | Q4,Q5,Q8,Q9 | Wzrost %: Spichlerz, cywilizacja, Zdrowie/Łaźnia, testy | SA-wzrost |
| **P85-B3** | UI | Panel miasta: racje 1/2/3 + rozbicie WZROST% | SA-ui-miasto |
| **P85-B4** | UI | Spichlerz centralny (etykiety z PYTANIE-85.md) | SA-ui-centrala |
| **P85-B5** | — | Głód wojska: 75% statów (bez armor) w walce | SA-army-hunger |

Po każdym batchu: `tsc --noEmit` + testy batchu → wpis `KANAL-PRACA.md` → czekamy na Macieja `push`.

## Mapowanie Q → decyzja

- Q1+Q7 → B1 (brak wzrostu przy głodzie, −1 po 1 turze)
- Q2+Q3+Q6 → B1 (kolejność centrali, cap, bez boostu)
- Q4+Q5+Q8 → B2 (Spichlerz, civ addytywnie, brak capa)
- Q9 → B2 (Zdrowie przez floor/10)
