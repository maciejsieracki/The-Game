# HANDOFF — przejęcie kolejki AutoBot

**Data:** 2026-08-19  
**Stan:** brak paczki gotowej do deployu; nie wykonywać publikacji ROBOCZA.
Ostatnia kontrola: 2026-08-19 15:30 UTC.

## Zasada wejścia

Każdy temat musi przejść:

`Operator → Evaluator → finalna kontrola → integracja → deploy`

Brak dostępnego diffu/commita Operatora oznacza `BLOCK`, nie PASS. Nie
rekonstruować z samego opisu raportu.

## Tematy z ostatniej kolejki

| ID | Stan | Następny gate |
|---|---|---|
| `R-REKRUT-SUROWIEC-BEZ-UPKEEP-REZERWY-Q1` | **ZAMKNIĘTE — BRAK REGRESJI** | nic; test 58/58, Evaluator PASS |
| `R-GRANICE-NARUSZENIE-ZAUFANIE-KIERUNEK-Q1` | **BLOCK** — drugi Evaluator nie znalazł commita `a224b5ed` | ponowić Operator z artefaktem dostępnym dla Evaluatora |
| `R-GARNCARNIA-CERAMIKA-SZCZESCIE-111-Q1` | **BLOCK** — brak worktree/commita `311f6bdd`; brak decyzji stawki | ABC limitu, potem Operator/Evaluator |
| `R-BARB-ZDOBYCIE-MIAST-Q1` | **PASS ABC, bez kodu** | punkt 9: decyzja ownera o ownerId/okupacji |
| `R-MANPOWER-UZUPELNIENIE-HP-NIEZAPISUJE-Q1` | Evaluator Composer PASS; czysta gałąź/PR #132 przygotowana | finalna kontrola; dopiero potem deploy |
| `R-ARMIA-IKONA-GLOD-FALSZYWA-Q1` | Operator nie dostarczył wiarygodnego artefaktu | ponowić Operator |
| `R-AI-MP-REKRUTACJA-SKARBIEC-ZAMIAST-BUDOWY-Q1` | **BLOCK** — commit `cc9b1aa8` niedostępny i brak decyzji A/B/C | punkt 9 ABC |
| `R-BARB-CHATKA-LIMIT-POZIOMY-Q1` | **BLOCK** — commit `a5a47126` niedostępny | ponowić Operator z trwałym diffem |
| `R-ARMIA-KONCENTRACJA-AI-BARB-Q1` | **BLOCK** — commit `73b4c23f` niedostępny i ABC niepełne | punkt 9 ABC, potem Operator |
| `R-DYPLO-SUROWCE-WARTOSC-5X-Q1` | ręczny PR #131, acceptance 225/225, brak PASS Evaluatora | ponowić Evaluator na dostępnej gałęzi |
| `R-DYPLO-INFOGRAFIKI-TOOLTIPY-Q1` | Operator nie dostarczył wiarygodnego artefaktu | ponowić Operator |
| `R-NAUKA-KOMUNIKAT-KARTA-UKONCZENIA-Q1` | Operator/Evaluator nie ukończyli | ponowić Operator |
| `R-TRIUMF-CS-KOMUNIKAT-KARTA-W-GRZE-Q1` | Operator/Evaluator nie ukończyli | ponowić Operator |
| `R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1` | otwarte ABC | punkt 9: czas, zakres i odwołanie |
| `R-WZROST-SZCZESCIE-DUBEL-WEALTH-I-CERAMIKA-Q1` | ręczny PR #129, brak poprawnej pętli | Evaluator na dostępnej gałęzi; nie integrować |
| `R-EVENTY-WAZNE-KARTY-Q1` | brak formalnego artefaktu Operatora | zarejestrować ID i ponowić Operator |

## Twarda bramka deployu

**Gotowe do deployu: — (brak).**

PR #132 zawiera oczyszczoną paczkę Manpower i ma PASS Evaluatora Composer,
ale wymaga finalnej kontroli przed deployem. PR #131 nie ma jeszcze PASS
Evaluatora. PR #130 jest starszą, zanieczyszczoną wersją i nie używać go jako
źródła deployu.
Tematy z `BLOCK` nie mogą być oznaczane jako gotowe. Nie zmieniać
`gra-robocza/`, `WERSJE.md` ani `KANAL-PRACA.md` bez faktycznego PASS
Evaluatora i finalnej kontroli.

## Główna przyczyna blokad

Worktree/commity Operatorów znikały albo nie były dostępne dla Evaluatora.
Kolejne paczki należy uruchamiać małymi seriami; raport Operatora musi zawierać
pełny dosłowny diff, a orkiestrator musi zabezpieczyć artefakt przed końcem
workera.

## Ostatnie wyniki Evaluatorów

- Granice, Garncarnia, koncentracja armii, limit chatki i rekrutacja AI/MP:
  **BLOCK** — brak dostępnego commita/worktree albo brak pełnego ABC.
- Zdobywanie miast barbarzyńców: **PASS ABC**, bez kodu; czeka decyzja właściciela.
- Koszt rekrutacji: **PASS**, zamknięte jako brak regresji.
- Manpower: **PASS Composer 2.5** na oczyszczonym PR #132.
- Ceny surowców i wzrost Wealth: brak ważnego PASS Evaluatora.

## Instrukcja dla następnego agenta

1. Nie deployować niczego z tej listy poza ewentualnym PR #132 po finalnej
   kontroli.
2. Nie rekonstruować brakujących commitów z opisów Operatorów.
3. Najpierw zabezpieczyć każdy artefakt Operatora (pełny diff), potem uruchomić
   Evaluatora na tym samym materiale.
4. Tematy wymagające decyzji pozostawić w ABC, bez implementacji.
