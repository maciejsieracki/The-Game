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
| `R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1` | Atak: łucznicy omijają szyk zamiast podejść do zasięgu i strzelać | 11/11 | Robocza i `origin/main` commit `6b7f40b4`; pinned GitHub Raw readback zgodny; `80-deploy-and-push.md` | Zamknięte; ograniczenie pełnej macierzy pozostało udokumentowane przez FC |
| `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1` | Ręczne rozkazy dla dużej armii i kolejne cykle rozkazów | 6/11 PASS-WITH-NOTES; integracyjny rerun wykrył możliwe nakładanie immediate ruchu z aktywacją | Historyczny evaluator potwierdził pointer routing 28/28, bramkę wodza i pierwszą kolejkę; osobny queue fix jest na Final Control. Na zintegrowanym `main` pointerowy rozkaz `atk27` wykonał natychmiastowy ruch, ale zwykły `_activateUnit(atk27)` rozpoczął drugi `_performPlayerOrder` zanim skończyło się pierwsze przejście (20.150 → 22.833; immediate zakończył 22.925). Operator sprawdza teraz, czy nastąpiło podwójne wykonanie; nie nazywam tego zamkniętym ani potwierdzonym bez pełnego śladu. | Oddzielić cykl życia kolejki od nakładania akcji; potwierdzić/odrzucić duplikat na żywym teście, ewentualny osobny run, potem evaluator/FC i wydanie |
| `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1` | Usunąć stare ID z kolejki po aktywacji, by kolejne rozkazy podzbioru działały | 8/11 PASS-WITH-NOTES; Final Control zaliczony; integracja czeka na R2-I | Commity operator/evaluator/Final Control `2340e5dd`→`c580b1c0`→`a1f90fa7`. Kandydat przeszedł 15/15 Chromium. Na aktualnym `main` `94286b0c` przeniesiono tylko dwa queue hunki i świeży test; typecheck/syntax/diff-check PASS, pierwsza kolejka 28/28, queue=0, 8 ruchów. Integracyjny test końcowy ma 14/15, bo asercja błędnie wymagała braku późniejszej zwykłej aktywacji; trace jednocześnie ujawnia możliwy overlap, zapisany pod Manual Control Large Army. R2-I doprecyzowuje kolejność i kończy browser rerun. | Zamknąć R2-I 15/15 na aktualnym main, niezależny evaluator integracyjny, potem commit/main, build Roboczej i push/readback |
| `R-BITWA-DEAD-UNIT-DISAPPEARS-Q1` | Jednostka zabita w bitwie znika z pola, routowana nadal ucieka | 11/11 | Robocza i `origin/main` commit `6b7f40b4`; pinned readback hash/size zgodny; `80-deploy-and-push.md` | Zamknięte |
| `R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1` | Piechota w ręcznym Ataku ma wykonać atak po dojściu do zwarcia | 11/11 | Robocza i `origin/main` commit `6b7f40b4`; pinned readback hash/size zgodny; `80-deploy-and-push.md` | Zamknięte |
| `R-BITWA-ATAK-MARSZEM-HEX-Q1` | Rozkaz „atakuj-marszem” ma atakować napotkanych wrogów i kontynuować do wskazanego pustego heksu | 11/11 | Robocza i `origin/main` commit `6b7f40b4`; pinned readback hash/size zgodny; `80-deploy-and-push.md` | Zamknięte |
| `R-AI-KAMPANIA-MARSZ-REKRUTACJA-Q1` | AI ma po pięciu turach zbiórki ruszyć na cel; priorytet ataku morskiego | 6/11 PASS-WITH-NOTES; 8–11 BLOCKED | Operatorowa powtórka i niezależna ewaluacja: logika 49/49, Chromium produkcyjny 68/68; pięć EOT zbiórki, ruch w szóstym, zejście na ląd przed atakiem. Brak save’a/koordynatów; konkretna armia na mapie gracza nieodtworzona. Szczegóły w `R-AI-KAMPANIA-MARSZ-REKRUTACJA-Q1/02-audit-rerun-20261030.md`. | Właściciel musi dostarczyć save sprzed utknięcia albo seed/wymiary mapy, turę, AI i cel, pozycje jednostek i stan zaokrętowania; bez tego nie ma kandydata produktu do deployu |
| `R-BITWA-LARGE-MIXED-ARMY-SCENARIOS-Q1` | Macierz dużych, mieszanych bitew dla doktryn i ustawień | 11/11 PASS-WITH-NOTES; zamknięte w zakresie headless matrix | Final Control: PASS-WITH-NOTES; harness i run scalone w `0d0367f6`. Main po integracji: typecheck PASS, formacje PASS, doktryny dystansowe/konne 10/10, pełna macierz 36×42×5 i repro 2×42×8 — 0 czerwonych. Deploy gry do Roboczej N/A, bo kod produktu nie zmieniał się; etap 11 push/readback potwierdzony (`origin/main=0d0367f6`; hash Final Control `2437b989…`, macierzy `bc66c2c5…`). Ograniczenie pozostaje jawne: to test headless, nie pełna bitwa 42v42 w Chromium ani test otwierania linii po stratach. | Zamknięte w zweryfikowanym zakresie; ponownie otworzyć tylko przy konkretnym błędzie z żywej bitwy |
| `R-PERF-LARGE-EMPIRE-STRESS-Q1` | Narastający koszt CPU/pamięci w dużej cywilizacji | 3/11 WSTRZYMANY | Istniejący test zakończył się niekompletnie na 38/100 tur; tura 39 zajęła 70,205 ms, RSS około 1.99 GiB. Właściciel ustalił, że testy dużej cywilizacji idą na sam koniec; nie ma aktualnie aktywnego Operatora | Po zamknięciu pozostałych tematów wznowić po sprzątaniu środowiska i uruchomić diagnostykę seryjnie |

## Tematy zamknięte na etapie 11

| ID | Wynik |
|---|---|
| `R-PROC-AUTOBOT-KANBAN-RETIRED-Q1` | PASS 11/11. Commit `dac5bcc4` na `main`; deploy gry jawnie N/A dla dokumentacji; `git ls-remote` potwierdził push. |

## Wydania już potwierdzone na etapie 11

Cztery poprawki bitewne (znikanie zabitych jednostek, atak piechoty w Ataku,
atakuj-marszem, zbliżanie łuczników do zasięgu) wdrożono do Roboczej i wypchnięto
w `6b7f40b4`. Pinned GitHub Raw potwierdził bundel `b3d82220…`, SHA-256
`7632cbf4…`, 70,045,045 B, manifest i START. Szczegóły znajdują się w runach
każdego tematu, w `80-deploy-and-push.md`.

Ostatni odczyt `main`/Roboczej/pusha znajduje się w runie
[`R-INTEGRATION-SETTINGS-BATTLE-FOOD-20261029`](R-INTEGRATION-SETTINGS-BATTLE-FOOD-20261029/).
Pozostałe wcześniej potwierdzone wydania pozostają w swoich runach. Nie obniżam ich
etapu i nie otwieram ponownie bez nowego, konkretnego objawu.

## Reguła aktywacji

Każdy wiersz powyżej ma odpowiadający mu run z pełnym ID. Po zakończeniu fazy
orkiestrator sprawdza artefakt i bezzwłocznie dispatchuje następnego uprawnionego
operatora/ewaluatora/kontrolera. Przekazanie musi zawierać numer etapu, commit lub wynik,
blokady i dokładny następny krok. Brak operatora oznacza **WSTRZYMANY**, nigdy „w trakcie”.
