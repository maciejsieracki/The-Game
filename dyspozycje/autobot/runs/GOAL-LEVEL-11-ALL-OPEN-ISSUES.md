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
| `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1` | Ręczne rozkazy dla dużej armii i kolejne cykle rozkazów | 6/11 PASS-WITH-NOTES; hipoteza overlapu niepotwierdzona w rerunie | R2-I na aktualnym main wykonał immediate ruch `atk27` raz; niezależna 60-sekundowa obserwacja nie wykazała drugiej aktywacji ani drugiego ruchu. Wcześniejszy ślad sugerował overlap czasowy, ale nie dowodził drugiego wykonania; wycofuję to jako potwierdzony błąd. To nie zamyka szerszych kryteriów ręcznego sterowania dużą armią. Dowody: run `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1/41–43`. | Ustalić kolejny konkretny brak w zakresie ręcznych rozkazów z pełnym przebiegiem; nie naprawiać hipotetycznego overlapu bez reprodukcji |
| `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1` | Usunąć stare ID z kolejki po aktywacji, by kolejne rozkazy podzbioru działały | 11/11 PASS-WITH-NOTES — zamknięte | Produkt commit `96d088b4`, release commit `87aa8678`, oba w `origin/main`. Robocza smoke `SMOKE OK`, `VERIFY OK`; pinned GitHub Raw bundle i pole bitwy zwróciły SHA-256 zgodne z lokalnym buildem, zdalny manifest potwierdził MD5 i rozmiary; `git ls-remote` potwierdził push `87aa8678`. 28v28/15 assertions; nie twierdzi to nic o limicie 120. Ograniczenie: brak wykazanego drugiego ruchu w 60 s nie dowodzi niemożliwości overlapu w każdej konfiguracji. Pełny receipt: `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1/80-deploy-and-push.md`. | Zamknięte w zakresie lifecycle kolejki; szerokie sterowanie armią pozostaje osobnym otwartym tematem |
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
