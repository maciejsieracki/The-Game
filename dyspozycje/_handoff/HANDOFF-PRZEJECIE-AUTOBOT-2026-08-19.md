# HANDOFF — przejęcie kolejki AutoBot

**Data:** 2026-08-19  
**Stan:** brak paczki gotowej do deployu; nie wykonywać publikacji ROBOCZA.

## Zasada wejścia

Każdy temat musi przejść:

`Operator → Evaluator → finalna kontrola → integracja → deploy`

Brak dostępnego diffu/commita Operatora oznacza `BLOCK`, nie PASS. Nie
rekonstruować z samego opisu raportu.

## Tematy z ostatniej kolejki

| ID | Stan | Następny gate |
|---|---|---|
| `R-REKRUT-SUROWIEC-BEZ-UPKEEP-REZERWY-Q1` | **ZAMKNIĘTE — BRAK REGRESJI** | nic; test 58/58, Evaluator PASS |
| `R-GRANICE-NARUSZENIE-ZAUFANIE-KIERUNEK-Q1` | **BLOCK** — artefakt Operatora niedostępny | ponowić Operator z trwałym diffem, potem Evaluator |
| `R-GARNCARNIA-CERAMIKA-SZCZESCIE-111-Q1` | **BLOCK** — artefakt Operatora niedostępny; brak decyzji stawki | ABC limitu, potem Operator/Evaluator |
| `R-BARB-ZDOBYCIE-MIAST-Q1` | **PASS ABC, bez kodu** | punkt 9: decyzja ownera o ownerId/okupacji |
| `R-MANPOWER-UZUPELNIENIE-HP-NIEZAPISUJE-Q1` | ręczny PR #130, Evaluator Composer PASS, ale brak pełnej pętli Operatora | oczyścić PR i finalna kontrola; nie deployować automatycznie |
| `R-ARMIA-IKONA-GLOD-FALSZYWA-Q1` | Operator nie dostarczył wiarygodnego artefaktu | ponowić Operator |
| `R-AI-MP-REKRUTACJA-SKARBIEC-ZAMIAST-BUDOWY-Q1` | **BLOCK** — brak commita i brak decyzji A/B/C | punkt 9 ABC |
| `R-BARB-CHATKA-LIMIT-POZIOMY-Q1` | **BLOCK** — commit Operatora niedostępny | ponowić Operator z trwałym diffem |
| `R-ARMIA-KONCENTRACJA-AI-BARB-Q1` | **BLOCK** — commit niedostępny i ABC niepełne | punkt 9 ABC, potem Operator |
| `R-DYPLO-SUROWCE-WARTOSC-5X-Q1` | ręczny PR #131, test acceptance 225/225, ale brak pełnej pętli | oczyścić PR i finalna kontrola |
| `R-DYPLO-INFOGRAFIKI-TOOLTIPY-Q1` | Operator nie dostarczył wiarygodnego artefaktu | ponowić Operator |
| `R-NAUKA-KOMUNIKAT-KARTA-UKONCZENIA-Q1` | Operator/Evaluator nie ukończyli | ponowić Operator |
| `R-TRIUMF-CS-KOMUNIKAT-KARTA-W-GRZE-Q1` | Operator/Evaluator nie ukończyli | ponowić Operator |
| `R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1` | otwarte ABC | punkt 9: czas, zakres i odwołanie |
| `R-WZROST-SZCZESCIE-DUBEL-WEALTH-I-CERAMIKA-Q1` | ręczny PR #129, brak poprawnej pętli | Evaluator na dostępnej gałęzi; nie integrować |
| `R-EVENTY-WAZNE-KARTY-Q1` | brak formalnego artefaktu Operatora | zarejestrować ID i ponowić Operator |

## Twarda bramka deployu

**Gotowe do deployu: — (brak).**

PR #130 i #131 nie mają kompletnego, weryfikowalnego łańcucha AutoBot.
Tematy z `BLOCK` nie mogą być oznaczane jako gotowe. Nie zmieniać
`gra-robocza/`, `WERSJE.md` ani `KANAL-PRACA.md` bez faktycznego PASS
Evaluatora i finalnej kontroli.

## Główna przyczyna blokad

Worktree/commity Operatorów znikały albo nie były dostępne dla Evaluatora.
Kolejne paczki należy uruchamiać małymi seriami; raport Operatora musi zawierać
pełny dosłowny diff, a orkiestrator musi zabezpieczyć artefakt przed końcem
workera.
