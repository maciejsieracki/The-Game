# R-SUROWCE-DOSTEP-ILOSC-Q1 — Panel Imperium: Ceramika/Sól/Koń/Złoto pokazują "masz/brak" zamiast ilości

**Data:** 2026-08-08 · **Decyzja:** Maciej, `A`

## Sytuacja
Commit `331aa180` (2026-08-05) ukrył realną ilość dla 4 surowców (Ceramika, Sól, Koń,
Złoto-surowiec) w panelu Imperium, mimo że silnik cały czas trzyma i zużywa ich zapas.
Regres wobec obu wcześniejszych decyzji na ten temat (`R-SUROWCE-DOSTEP` 26.07,
`DOSTEP-SUROWCE-Q1` 29.07 — ta ostatnia mówi wprost: „tylko magazyn państwa, bez dostępu").
Pełna diagnoza w `dyspozycje/PYTANIA-OTWARTE.md`, sekcja `BUG-SUROWCE-DOSTEP-ILOSC-ZNIKLA`.

## Decyzja
**A — pełny powrót do ilości dla wszystkich 13 surowców.** Cofnięcie `331aa180`: wszystkie 13
surowców w jednej siatce „Magazynowane" z paskiem zapas/pojemność. Podsekcja „Dostęp — nie
magazynowane" (wraz z jej nieprawdziwym opisem „nie gromadzą się w magazynie") znika.
Informacja o źródle („własna Kopalnia złota", „szlak handlowy z…") zostaje w tooltipie, który
już dziś ją obsługuje.

## Uzasadnienie (z turnieju ABC)
Dosłownie realizuje słowa Macieja z playtestu 08.08 („ilości surowców... to regres, zostało
cofnięte"). Zgodne z zamkniętym kanonem `DOSTEP-SUROWCE-Q1`. Najmniejsze ryzyko — techniczne
cofnięcie jednego commita + przepisanie jednej bramki testowej (`surowce-dostep-test.cjs`).

**Świadomie zaakceptowane ryzyko (Przeciw #1 wariantu A):** Złoto traci widoczny sygnał
dostępu — Mennica (`ownerZlotoAccessForMennica`, decyzja `83B`) zasypia bez dostępu do złota
nawet przy zapasie 0 ze szlaku handlowego, a pasek pokaże wtedy „0/200", co gracz może
odczytać jako „nie mam", choć Mennica pracuje. Jeśli to okaże się realnym problemem po
playteście, do rozważenia osobne zgłoszenie (wariant C z turnieju: plakietka dostępu tylko
dla Złota).

## Wdrożenie
`gra/src/main.ts` (`isEmpireAccessResource`, cofnięcie `cap = undefined` na `cap = empireCap`
dla Ceramiki/Soli/Konia/Złota), `gra/src/ui/empireDetailPanel.ts` (usunięcie sekcji „Dostęp —
nie magazynowane"), `gra/tools/surowce-dostep-test.cjs` (przepisanie na nowe zachowanie).

## Status
WDROŻONE w kodzie (patrz `dyspozycje/REJESTR-PROSB-I-ZADAN.md` za commit).
