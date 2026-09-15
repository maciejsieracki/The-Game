# R-REKRUTACJA-KOSZT-50-DREWNO-Q1 — bezpośrednia korekta kosztów epoki Kamienia

**Data decyzji właściciela:** 2026-09-15
**Status:** `FINAL CONTROL PASS — INTEGRATION_REQUIRED`
**Domena:** `GAME`
**Deploy:** `NIE WYKONANO`
**Projekt/board:** `p_9ae9ac64` / `the-game-real24` / profil `default`

## Decyzja właściciela

Właściciel zlecił bezpośrednie przeliczenie wartości, bez wprowadzania pól typu `50%`, `reductionPercent`, mnożnika ani innego tunable reduction:

- pieniężny koszt rekrutacji — połowa dotychczasowego efektywnego kosztu;
- surowcowy koszt rekrutacji — połowa dotychczasowego kosztu;
- pieniężne utrzymanie — bez zmian;
- surowcowe utrzymanie — połowa dotychczasowego kosztu;
- Żywność i Manpower — poza zakresem.

Dla nieparzystych połówek surowca obowiązuje zaokrąglenie do całej sztuki: Taran `75/2 → 38` oraz `15/2 → 8`.

## Docelowe wartości — Niski / normalna trudność

| Jednostka | Rekrutacja: pieniądze | Rekrutacja: Drewno | Utrzymanie: pieniądze/turę | Utrzymanie: Drewno/turę |
|---|---:|---:|---:|---:|
| Wojownik | 10 | 25 | 4 | 5 |
| Oszczepnik | 6 | 25 | 4 | 5 |
| Łucznik | 6 | 25 | 4 | 5 |
| Zwiadowca | 8 | — | 0 | — |
| Oszczepnik Zulu (Izijula) | 20 | 25 | 4 | 5 |
| Wojownik z maczugą (Chaska) | 26 | 25 | 8 | 5 |
| Oszczepnik (Estólica) | 9 | 25 | 4 | 5 |
| Łucznik egipski | 14 | 25 | 4 | 5 |
| Łucznik sumeryjski | 9 | 25 | 4 | 5 |
| Taran | 14 | 38 | 4 | 8 |

Tempo i trudność zachowują istniejące reguły poza tą korektą. Wartości powyżej są wartościami efektywnymi dla ustawienia Niski / normalna, a nie nowym abstrakcyjnym mnożnikiem.

## Zakres zatwierdzonej zmiany

- `gra/data/units.json` — zatwierdzone wartości Drewna i utrzymania;
- `gra/src/game/production.ts` — usunięcie dodatkowego FALA2 z `unitMoneyCost`, aby rzeczywisty path `unitProductionItem → unitMoneyCost → purchaseRecruitmentUnit` dawał wartości pieniężne z tabeli;
- focused testy kosztów i raporty w worktree.

Nie zmieniano Żywności, Manpoweru, niezwiązanych parametrów AI ani UI.

## Kanban i dowody

```text
Operator:       t_81bcf260 / run 312
Evaluator:      t_0ca86eb7 / run 315 — FAIL, objection 1
Defense:        t_cee97646 / run 320 — PASS, PRZYJMUJĘ objection 1
Final Control:  t_78a7578b / run 322 — PASS
Integration:    t_dc64d2f3 — INTEGRATION_REQUIRED, blocked/capability, workerless
```

Evaluator wykazał, że przed Defense efektywny Pieniądz nadal wynosił `20/12/12/16/40/52/18/28/18/28`. Defense usunęła wyłącznie dodatkowe FALA2. Final Control potwierdził wszystkie cztery osie, tempo/trudność, ścieżkę gracz/AI i 18 zatwierdzonych zmian Drewna.

## Granica dostawy

Final Control nie integrował, nie commitował, nie pushował i nie deployował. `INTEGRATION_REQUIRED` pozostaje bramką Orchestratora. Przed deployem do `gra-robocza` trzeba wykonać na czystym zatwierdzonym celu: allowlist readback, testy, typecheck, build, manifest, hashe, commit, push, remote readback i porównanie artefaktów. Wspólny deploy pozostaje wstrzymany do zamknięcia pozostałych tematów i decyzji właścicielskiej names.
