# Cel AutoBot: doprowadzić każdy otwarty błąd do etapu 11

**Cel:** Każdy zarejestrowany, nadal otwarty błąd ma dojść do etapu 11: niezależny cykl
Operatora → Evaluatora → Obrony, jeśli są konkretne zarzuty → Final Control → integracja
do `main` → deploy do Roboczej → `git push` i odczyt potwierdzający. Nie przedstawiam
etapu jako aktywnego bez żywego operatora lub konkretnego, wykonywanego zadania.

## Skala postępu

1. Zarejestrowany temat, zakres i kryteria końca zapisane w runie.
2. Operator uruchomiony, baza i zakres sprawdzone.
3. Przyczyna błędu odtworzona albo ograniczenie diagnostyczne zapisane.
4. Poprawka przygotowana i testy Operatora wykonane.
5. Niezależny Evaluator zakończył sprawdzenie.
6. Operator odpowiedział na konkretne uwagi Evaluatora (jeśli wystąpiły).
7. Obrona zamknięta; niezależna kontrola może przejść dalej.
8. Final Control zakończony wynikiem PASS lub jawnie określoną blokadą.
9. Zmiana zintegrowana do `main` i wymagane testy integracyjne zaliczone.
10. Deploy do Roboczej wykonany i sprawdzony.
11. `git push` potwierdzony przez zdalny odczyt oraz run/rejestr zaktualizowane.

Etap jest ostatnim potwierdzonym przejściem, nie oceną procentową. Gdy brak wymaganego
artefaktu lub działającego procesu, temat otrzymuje status **WSTRZYMANY/BLOCKED** oraz
przyczynę; numer etapu nie rośnie na podstawie samego planu. Po każdym raporcie
orkiestrator odczytuje runy, status operatorów, commity i testy, a następnie uruchamia
kwalifikowany następny etap bez czekania na kolejne ponaglenie.

## Bieżące otwarte tematy

| ID | Temat | Etap | Operator / stan | Następny krok |
|---|---|---:|---|---|
| `R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1` | Ranged/atak: łucznicy nie podchodzą do zasięgu lub błądzą za blokującą linią | 5/11 FAIL→korekta | Evaluator potwierdził poprawę Ataku 42v42, ale wykrył regresję: Skirmish może zamrażać łuczników za żywą piechotą | Operator ogranicza zmianę doktryną i dodaje regresję Skirmish; następnie ponowny evaluator |
| `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1` | Ręczne rozkazy dla dużej armii, w tym kolejne cykle rozkazów | 8/11 PASS-WITH-NOTES, BLOKADA na regresji | Niezależny test 28/28 rozkazów/aktywacji przeszedł, ale ujawnił stale queued-order membership | Domknąć osobną poprawkę kolejki, potem ponownie FC/integracja |
| `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1` | Usunąć stare ID z kolejki po aktywacji, by kolejne rozkazy podzbioru działały | 4/11 | Operator aktywny; naprawa/test dwóch cykli w Chromium | Zakończyć test; niezależny Evaluator, obrona tylko gdy zarzuty |
| `R-AI-KAMPANIA-MARSZ-REKRUTACJA-Q1` | AI ma po pięciu turach zbiórki ruszyć na cel; priorytet ataku morskiego po technologii | 6/11 PASS-WITH-NOTES, BLOCKED reprodukcją | Niezależny Evaluator potwierdził testy 49/49 i Chromium 68/68 (145 s); exact symptom nieodtworzony, brakuje zapisu/współrzędnych | Wznowić dokładną reprodukcję z danymi mapy; nie wdrażać niepotwierdzonej zmiany |
| `R-BITWA-LARGE-MIXED-ARMY-SCENARIOS-Q1` | Macierz dużych, mieszanych bitew dla doktryn i ustawień | 8/11 | Niezależny Final Control PASS-WITH-NOTES; ograniczenia zakresu zapisane | Dołączyć kolejną rundę live po poprawkach łuczników i ręcznego sterowania; potem integracja raportów/testów |
| `R-PROC-AUTOBOT-KANBAN-RETIRED-Q1` | Usunąć obowiązek Kanbanu z aktywnych zasad AutoBot zgodnie z decyzją właściciela | 11/11 PASS | Commit `dac5bcc4` jest na main, etap 10=N/A z uzasadnieniem, `git ls-remote` potwierdził push | Zamknięte; późniejsze poprawki reguły tworzą nowy temat, jeśli wymagane |
| `R-LARGE-EMPIRE-PERF-Q1` | Narastający koszt CPU/pamięci w dużej cywilizacji | 1/11 | WSTRZYMANY z priorytetu na życzenie właściciela; uruchomić po zamknięciu pozostałych tematów | Ostatni: posprzątanie środowiska, baseline pamięci/tury/UI i profilowanie narastania |

## Wydania już potwierdzone na etapie 11

Ostatni odczyt `main`/Roboczej/pusha znajduje się w runie
[`R-INTEGRATION-SETTINGS-BATTLE-FOOD-20261029`](R-INTEGRATION-SETTINGS-BATTLE-FOOD-20261029/).
Pozostałe wcześniej potwierdzone wydania pozostają w swoich runach. Nie obniżam ich
etapu i nie otwieram ponownie bez nowego, konkretnego objawu.

## Reguła aktywacji

Każdy wiersz powyżej ma odpowiadający mu run z pełnym ID. Po zakończeniu fazy
orkiestrator sprawdza artefakt i bezzwłocznie dispatchuje następnego uprawnionego
operatora/ewaluatora/kontrolera. Przekazanie musi zawierać numer etapu, commit lub wynik,
blokady i dokładny następny krok. Brak operatora oznacza **WSTRZYMANY**, nigdy „w trakcie”.
