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
| `R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1` | Atak: łucznicy omijają szyk zamiast podejść do zasięgu i strzelać | 5/11 PASS-WITH-NOTES | Operator `/root/archer_approach_operator`; Evaluator r2 PASS-WITH-NOTES (`f42317c9`), niezależny Final Control `/root/battle_mixed_browser` aktywny | Zakończyć Final Control, potem integracja/deploy/push |
| `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1` | Ręczne rozkazy dla dużej armii i kolejne cykle rozkazów | 5/11 PASS-WITH-NOTES, BLOCKED regresją | Operator `/root/manual_large_browser`; Evaluator `/root/manual_large_eval` potwierdził pierwsze 28/28, ale drugi cykl ujawnił stale queued-order membership | Operator domyka poprawkę i przeprowadza drugi cykl; niezależny Evaluator/FC po poprawce |
| `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1` | Usunąć stare ID z kolejki po aktywacji, by kolejne rozkazy podzbioru działały | 3/11 | Operator `/root/manual_large_browser` aktywny na izolowanej gałęzi; poprawka lokalna, Chromium test trwa, wynik jeszcze niepotwierdzony | Odebrać wynik pełnego Chromium; dopiero po przejściu raportować etap 4 |
| `R-AI-KAMPANIA-MARSZ-REKRUTACJA-Q1` | AI ma po pięciu turach zbiórki ruszyć na cel; priorytet ataku morskiego | 5/11 PASS-WITH-NOTES, BLOCKED reprodukcją | Operator `/root/ai_campaign_assault_operator` i niezależny Evaluator `/root/battle_mixed_browser` zakończyli testy: logika 49/49, Chromium 68/68; objaw na konkretnej mapie nieodtworzony, brak zapisu/współrzędnych | Wznowić reprodukcję z dokładnymi danymi mapy; nie wdrażać niepotwierdzonego fixu |
| `R-BITWA-LARGE-MIXED-ARMY-SCENARIOS-Q1` | Macierz dużych, mieszanych bitew dla doktryn i ustawień | 8/11 PASS-WITH-NOTES | Niezależny Final Control `/root/highlight_final` zakończony; ograniczenia zakresu zapisane; oczekuje na zależne poprawki łuczników i ręcznego sterowania | Po poprawkach ponowić macierz live i zintegrować dowody |
| `R-PERF-LARGE-EMPIRE-STRESS-Q1` | Narastający koszt CPU/pamięci w dużej cywilizacji | 3/11 WSTRZYMANY | Istniejący test zakończył się niekompletnie na 38/100 tur; tura 39 zajęła 70,205 ms, RSS około 1.99 GiB. Właściciel ustalił, że testy dużej cywilizacji idą na sam koniec; nie ma aktualnie aktywnego Operatora | Po zamknięciu pozostałych tematów wznowić po sprzątaniu środowiska i uruchomić diagnostykę seryjnie |

## Tematy zamknięte na etapie 11

| ID | Wynik |
|---|---|
| `R-PROC-AUTOBOT-KANBAN-RETIRED-Q1` | PASS 11/11. Commit `dac5bcc4` na `main`; deploy gry jawnie N/A dla dokumentacji; `git ls-remote` potwierdził push. |

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
