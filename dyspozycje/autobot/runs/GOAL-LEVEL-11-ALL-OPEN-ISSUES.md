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
| `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1` | Ręczne rozkazy dla dużej armii i kolejne cykle rozkazów | 6/11 PASS-WITH-NOTES; operator defense zakończona, niezależny re-eval aktywny | Commit operatora `2340e5dd`: pierwsza kolejka 28/28, queue=0, 8 ruchów; w drugiej aktywnej rundzie realna karta + klik mapy zmieniły q/r (30,72→31,70); martwy ID pominięty przez `_activateNext` wyczyszczony. 13/13 testów operatora. Evaluator niezależnie sprawdza rozjazd klikniętego heksa (31,72) względem order targetu (31,68). | Po re-eval: jeśli PASS→Final Control; jeśli objection→kolejna defense. Potem main/deploy/push |
| `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1` | Usunąć stare ID z kolejki po aktywacji, by kolejne rozkazy podzbioru działały | 5/11 PASS-WITH-NOTES; odpowiedź Operator Defense dla etapu 6 aktywna | Niezależny re-evaluator potwierdził poprawkę z commit `2340e5dd`, test 28v28, czyszczenie martwego ID i kontrole statyczne. Otworzył dwie kwestie dowodowe: dokładny moment wykonania drugiego ruchu oraz bezpośredni zapis `formationOffset`; operator dopisuje ślad rozkaz→aktywacja i offset. Raport: `38-independent-evaluator-r2h.md`; obrona ma powstać w `39-operator-defense-r2h.md`. | Zamknąć dwie uwagi dowodowe, uruchomić świeżą ewaluację, Final Control, potem selektywnie integrować i wydać |
| `R-BITWA-DEAD-UNIT-DISAPPEARS-Q1` | Jednostka zabita w bitwie znika z pola, routowana nadal ucieka | 11/11 | Robocza i `origin/main` commit `6b7f40b4`; pinned readback hash/size zgodny; `80-deploy-and-push.md` | Zamknięte |
| `R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1` | Piechota w ręcznym Ataku ma wykonać atak po dojściu do zwarcia | 11/11 | Robocza i `origin/main` commit `6b7f40b4`; pinned readback hash/size zgodny; `80-deploy-and-push.md` | Zamknięte |
| `R-BITWA-ATAK-MARSZEM-HEX-Q1` | Rozkaz „atakuj-marszem” ma atakować napotkanych wrogów i kontynuować do wskazanego pustego heksu | 11/11 | Robocza i `origin/main` commit `6b7f40b4`; pinned readback hash/size zgodny; `80-deploy-and-push.md` | Zamknięte |
| `R-AI-KAMPANIA-MARSZ-REKRUTACJA-Q1` | AI ma po pięciu turach zbiórki ruszyć na cel; priorytet ataku morskiego | 6/11 PASS-WITH-NOTES; 8–11 BLOCKED | Operatorowa powtórka i niezależna ewaluacja: logika 49/49, Chromium produkcyjny 68/68; pięć EOT zbiórki, ruch w szóstym, zejście na ląd przed atakiem. Brak save’a/koordynatów; konkretna armia na mapie gracza nieodtworzona. Szczegóły w `R-AI-KAMPANIA-MARSZ-REKRUTACJA-Q1/02-audit-rerun-20261030.md`. | Właściciel musi dostarczyć save sprzed utknięcia albo seed/wymiary mapy, turę, AI i cel, pozycje jednostek i stan zaokrętowania; bez tego nie ma kandydata produktu do deployu |
| `R-BITWA-LARGE-MIXED-ARMY-SCENARIOS-Q1` | Macierz dużych, mieszanych bitew dla doktryn i ustawień | 3/11; FAIL odtworzony na bieżącym `main`; operator naprawy aktywny | Rerun na `862568e`: 36 scenariuszy, 42/stronę; 3 czerwone przypadki `steady` + `rangedLines=2` + `engaged`. Tylni łucznicy atk-archer-25/26 pozostawali w dystansie 4 przy zasięgu 3 przez osiem aktywacji, bez ruchu/strzału. Nie ma nielegalnych ataków; typecheck PASS. Raport i hash dowodów: `R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1/02-operator-rerun-main-862568e.md`; Operator bada lane-planning w izolowanym worktree. | Odtworzyć i poprawić zakleszczenie tylnego rzędu; potem niezależna ewaluacja, Final Control, integracja, Robocza i readback |
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
