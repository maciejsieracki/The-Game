# Przegrana gracza: kto i jak zdobywa jedyne miasto (tag DEFEAT, runda 2)

Temat: R-WEB-EARLY-DEFEAT-CAUSE-Q1 (tag DEFEAT). Baza kodu: `origin/main` = `fbd50d4e3` (ENDSTALL r1); kandydat obrony: `021bfef1e`.
Runda 2 (obrona Operatora) poprawia wcześniejszy wynik. Wcześniejsze liczby 31% (13/42) i 0% (0/10) były policzone przy poziomie barbarzyńców **Normalny**, który nie jest maksimum. Poniżej: pomiar przy maksimum (**Trudny**).

Zmiany gry: tylko odczyt, hak testowy `__defeatTestDebug.cityThreatProbe` w `gra/src/main.ts` (bez zmian logiki, progów i danych; `gra/data/**` nietknięte).
Runner: `gra/tools/defeat-cause-live.cjs` (poziom barbarzyńców z `DEFEAT_BARB_LEVEL`, domyślnie `trudny`).
Poprawka klasyfikacji `gameOver` w `gra/tools/endstall-fortring-live.cjs` i `gra/tools/vlive3-fortring-live.cjs`.
Dane: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFEAT-CAUSE-Q1/dane-podsumowanie-r2.jsonl` (77 przebiegów, jeden wiersz na przebieg). Surowe logi `*.txt` zostają poza repo (`scratchpad/defeatT/`, `scratchpad/defeat/`).

## Wynik w pięciu zdaniach

1. Maksimum (Trudny, Trudna dyplomacja, Wysoki x4 koszty, kultura Trudny, barbarzyńcy Trudny): jedyne miasto gracza przepada w 34 z 37 przebiegów (92%), w turach 8–15.
2. Zdobywcą jest zawsze strona barbarzyńców (właściciel -1). Żaden AI nie zdobył miasta gracza w żadnym przebiegu.
3. Gracz nie ma w mieście żadnej jednostki wojskowej, tylko startowego Zwiadowcę. W turze poprzedzającej utratę 1–4 „Wojownik szekelesz” (lub Sherden) stoi 1–2 heksy od miasta. W turze utraty otwarte jest podsumowanie bitwy (34/34).
4. Dwie jednostki wojskowe na mieście (klony wojownika barbarzyńców, patrz uwagi) zmniejszają utratę do 65% (13/20). Różnica względem maksimum jest istotna (Fisher, p = 0,024). Nie jest to zero.
5. Dolny poziom dyplomacji, kosztów i kultury (wariant `low`, barbarzyńcy nadal Trudny) daje 20/20 utrat (100%). Różnica względem maksimum nie jest istotna (p = 0,54), więc tych ustawień nie da się rozdzielić przy tej liczbie przebiegów.

## 1. Maksimum: kto i kiedy zdobywa miasto (pkt 1 celu) — barbarzyńcy Trudny

Przebiegi: seed 4242 — 19 (w tym `r1-s4242` z pierwszego testu), seed 7 — 18. Każdy z 20 tur, gracz bierny (bitwy w trybie auto, jak w ENDSTALL).

| Seed | Przebiegi | Utrata miasta | Tura utraty (zakres) | Zdobywca | Podsumowanie bitwy w turze utraty |
|---|---|---|---|---|---|
| 4242 | 19 | 17 (89%) | 8–15 | barbarzyńcy (-1): 17/17 | tak: 17/17 |
| 7 | 18 | 17 (94%) | 8–15 | barbarzyńcy (-1): 17/17 | tak: 17/17 |
| razem | 37 | 34 (92%) | 8–15 | barbarzyńcy 34/34 | 34/34 |

Uwaga do tabeli: przebiegi kończone bez utraty (3 w sumie) mają `dokonczone` w 20 turach. Wszystkie 34 przegrane mają w turze poprzedzającej utratę: jedynego gracza na mieście = Zwiadowca (poza garnizonem), a obcych wojowników w promieniu 3 heksów 1–4.

Co to znaczy: w tym ustawieniu jedyne miasto startowe bez wojska jest zdobywane przez barbarzyńców w ciągu kilku tur od pierwszego pojawienia się wojowników w pobliżu.

## 2. Porównanie ustawień (pkt 2 celu)

| Wariant | Ustawienia | Ziarno 4242 | Ziarno 7 | Razem przegranych / przebiegów | Tury utraty |
|---|---|---|---|---|---|
| (a) maksimum | Trudny; barbarzyńcy Trudny; Trudna dyplomacja; Wysoki x4; kultura Trudny | 17/19 | 17/18 | **34/37 (92%)** | 8–15 |
| (b) dolny poziom dyplomacji, kosztów i kultury | jak (a), ale Dyplomacja „łatwa”, Koszty „niski”, kultura „łatwy”; barbarzyńcy Trudny | 10/10 | 10/10 | **20/20 (100%)** | 8–17 |
| (c) maksimum + 2 jednostki wojskowe na mieście | jak (a) + 2 klony wojownika barbarzyńców na heksie miasta w turze 5/6 | 7/10 | 6/10 | **13/20 (65%)** | 10–18 |

Test istotności (dwustronny Fisher):
- (b) względem (a): p = 0,54 — brak różnicy.
- (c) względem (a): p = 0,024 — różnica istotna.

Uwagi do wariantów:
- Wariant (c) nie jest „budowanym przez gracza” wojskiem. Hak `__hotSeatTestDebug.spawnTestUnitForPlayer` klonuje istniejący szablon wojskowy świata. Na starcie świat nie ma jednostek wojskowych, więc klony to wojownicy barbarzyńców, stawiane w pierwszej turze, w której pojawia się taka jednostka (tura 5/6). Dispatch wymagał jednostek zbudowanych przez gracza. Tego NIE ZMIERZONO (brak haka budowy w runnerze, a koszt i czas budowy przy Wysoki x4 nie są znane).
- W (c) w 12 z 13 utrat na heksie miasta stoją oprócz Zwiadowcy 2 wojowniki gracza (w jednym przypadku 1). Klony mają ten sam typ i statystyki co wojownicy barbarzyńców.
- Wariant (b): poziom trudności pozostaje Trudny, zmienia się tylko dyplomacja, koszty jednostek i kultura. Poziomy inne niż maksymalne nie były wymagane przez właściciela, a wynik traktuję jako informacyjny.

## 3. Historyczne wyniki na poziomie barbarzyńców Normalny (runda 1, do porównania)

Te liczby są **nieaktualne jako wynik maksimum** i zostają tylko dla rozliczenia zarzutów. Runner w rundzie 1 ustawiał barbarzyńców na Normalny, co nie jest maksimum.

| Wariant | Razem przegranych / przebiegów | Komentarz |
|---|---|---|
| max, barbarzyńcy Normalny (seed 4242: 9/31; seed 7: 4/11) | 13/42 (31%) | surowe dane w `scratchpad/defeat/` (poza repo) |
| low, barbarzyńcy Normalny | 6/10 | |
| garrison, barbarzyńcy Normalny | 0/10 | wynik nieprawdziwy dla maksimum; patrz tabela 2 |

Różnica między ENDSTALL (15/24 = 62%, seed 4242) a rundą 1 (seed 4242: 9/31 = 29%) nie została wyjaśniona. ENDSTALL także używał barbarzyńców Normalny, więc poziom barbarzyńców jej nie tłumaczy. NIE ZMIERZONO przyczyny różnicy (możliwe różnice wersji runnera lub kolejności wywołań).

## 4. Round-trip po przegranej (pkt 3 celu)

Sprawdzono na przebiegu `r1-s4242` (barbarzyńcy Trudny, tura 9):
- Przed zapisem otwarte było podsumowanie bitwy (`summaryOpen = true`). Zapis jest wtedy blokowany przez bramkę `isSaveBlockedByBattle`. To zamierzone zachowanie, a runner zamyka bitwę przed round-trip.
- Po zamknięciu bitwy zapis się udaje (`saved: true`). Po wczytaniu miasto należy do barbarzyńców (owner -1), a jeden koniec tury przywraca przegraną (`gameOverAfter: true`).
- Ślad ENDSTALL `[Diag:load] OK tura=9 miasta=1` przy `owners=[]` jest zgodny z tym: `miasta=` liczy wszystkie miasta (`cities.length`), a snapshot pomija miasta barbarzyńców.

Werdykt: artefakt harnessu (bramka zapisu przy otwartym podsumowaniu + definicja snapshotu). Nie stwierdzono błędu zapisu lub odczytu po przegranej. Round-trip zweryfikowano na jednym przebiegu, nie na wszystkich 37.

Obserwacja do oceny (nie błąd potwierdzony): po wczytaniu zapisu z przegraną `gameOver` wynosi `false` do końca tury. Czy ekran porażki ma wracać od razu, to pytanie o zachowanie, nie o poprawność. Zostawiono orkiestratorowi.

## 5. Ograniczenia

- Czy w turze utraty była **bitwa**, czy **zajęcie miasta bez walki** (`captureCityWithoutBattle`), nie zostało rozstrzygnięte. Dowodem jest tylko flaga `summaryOpen` (34/34). Siły obu stron i straty nie były mierzone (log zawiera tylko flagę).
- Wariant (c) używa klonów wojownika barbarzyńców, nie jednostek zbudowanych przez gracza (patrz tabela 2).
- Formalny stan wojny nie był odczytywany (zdobywca to barbarzyńcy, nie dotyczy).
- Surowe logi `*.txt` nie są w repozytorium. W repozytorium jest plik `dane-podsumowanie-r2.jsonl` z jednym wierszem na przebieg. Pełne logi można odtworzyć runnerem (`node gra/tools/defeat-cause-live.cjs <katalog> <max|low|garrison> <seed> 20`, z `DEFEAT_BARB_LEVEL` domyślnie `trudny`).

## Pytanie do właściciela (jednozdaniowe, dla orkiestratora)

DECISION_REQUIRED: Przy maksymalnym ustawieniu gry, gdy gracz nie buduje obrony, jedyne miasto startowe ginie w 92% przebiegów (tury 8–15), zawsze w ataku barbarzyńców; z dwoma jednostkami wojskowymi na mieście spada to do 65% (klony barbarzyńców, nie budowa gracza), a na dolnym poziomie dyplomacji i kosztów nadal 100%: (A) zostawić obecny balans; (B) zwiększyć obronę startową gracza (mniej utrat we wszystkich ustawieniach); (C) zmienić zachowanie barbarzyńców w pobliżu miasta gracza w pierwszych turach (mniej utrat bez zmiany obrony gracza). Decyzja należy do właściciela; parametrów nie zmieniono.
