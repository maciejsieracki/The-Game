# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — dispatch

TEMAT: `R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1`
RUNDA: 1/5
DATA: 2026-09-05
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (SS5a regula bazowa — nie jest to temat wizualny,
poprawione 2026-09-06, poprzednia wersja bledna).

## WYZWALACZ (właściciel, dosłownie)

> „Jeżeli tak wygląda budowanie budynków przez AI, że jest to budowa z dostępnej listy,
> trzeba sprawdzić, czy na pewno wszystkie budynki na tej liście występują, bo może to być
> błąd, na przykład gdy pojawiają się nowe epoki. Wydaje mi się, że na każdą epokę powinna
> być inna lista; gdy będziemy dodawać nowe epoki, trzeba będzie do tej listy wprowadzać
> nowe budynki."

**Intuicja właściciela potwierdzona pomiarem — i sytuacja jest gorsza, niż zakładał.**

## RECON (policzony przez orkiestratora; POTWIERDŹ własnym rachunkiem)

`chooseCityProduction` (`gra/src/game/ai.ts:1261`) buduje tablicę `candidates`
z **zaszytych literałów string** rozsianych po kilkunastu gałęziach (`infraOrder:1472`,
gałęzie `underThreat`, `earlyPhase`, archetypy, `defensiveCopy`). **Nie czyta
`availableProduction()`.**

**Pomiar: AI nie zbuduje 19 z 41 budynków, a pokrycie SPADA z epoką.**

| Epoka | AI zna | Pokrycie |
|---|---|---|
| 1 | 9 / 11 | 82% |
| 2 | 9 / 15 | 60% |
| **3** | **3 / 13** | **23%** |
| 4 | 1 / 2 | 50% |

Metoda pomiaru: id budynku szukane jako literał w `ai.ts`. **Przybliżona** — budynek mógłby
być podany zmienną. Sześć pozycji zweryfikowanych wyrywkowo (`swiatynia`, `trybunal`,
`pretorium`, `sad`, `teatr`, `mennica`): **zero trafień w `ai.ts`**, normalne występowanie
w `main.ts`. **Powtórz ten pomiar samodzielnie i podaj własną liczbę** — jeśli wyjdzie inna
niż 19/41, zgłoś rozbieżność zamiast dopasowywać się do tej tabeli.

**Brakujące (stan na dziś):** `kamienne_kregi`, `stela`, `dwor_zarzadcy`, `mennica`,
`palac_ii`, `spichlerz_ii`, `swiatynia`, `trybunal`, `akademia_wojskowa`, `baszta`,
`kuznia_zelaza`, `laznia_publiczna`, `palac_iii`, `port_wielki`, `pretorium`, `sad`,
`teatr`, `warsztat_oblezniczy`, `wielka_kuznia`.

**Dlaczego to pilne akurat teraz:** cała grupa „Prawo i administracja" jest dla AI
niewidzialna (`dwor_zarzadcy`, `trybunal`, `palac_ii`, `palac_iii`, `pretorium`, `sad`) —
a to jest dokładnie grupa, na której opiera się przebudowa Prawa
(`R-PRAWO-PRZEBUDOWA-SKALI-Q1`). Bez tej naprawy miasta AI wylądowałyby w epokach 2-3
na Prawie rzędu 30-40%, czyli w Niepokoju blisko Buntu — **nie z powodu balansu, tylko
z powodu tej luki.** To samo dotyczy Szczęścia (`swiatynia`, `teatr`, `laznia_publiczna`).

## ECHO WŁAŚCICIELA (2026-09-05) — WIĄŻĄCE

**Pytanie 1: jak naprawiamy?**
> **„Przepiąć AI na `availableProduction()` — koniec listy na sztywno."**

Właściciel jawnie odrzucił wariant „listy per epoka" (własną pierwotną propozycję)
oraz hybrydę. Powód wyboru: każdy przyszły budynek i każda przyszła epoka mają działać
**automatycznie**, bez dopisywania czegokolwiek.

**Pytanie 2: kolejność wobec Prawa?**
> **„Naprawić listę AI PRZED wejściem Prawa."**

Ten temat **blokuje** `R-PRAWO-PRZEBUDOWA-SKALI-Q1`.

## GOAL

AI wybiera budynki z **tego samego źródła co gracz** — `availableProduction()`
(`gra/src/game/production.ts:778`) — i punktuje kandydatów według **grupy budynku**
(`BuildingDef.grupa`), nie według zaszytej listy id.

Po tej zmianie **dodanie nowego budynku albo nowej epoki nie wymaga ani jednej linii
w `ai.ts`.** To jest binarny sprawdzian sukcesu tego tematu.

## KRYTERIA KOŃCA (binarne)

1. **`chooseCityProduction` nie zawiera ani jednego zaszytego id budynku** jako źródła
   kandydatów. Udowodnij grepem: żaden z 41 id z `buildings.json` nie występuje w `ai.ts`
   jako literał w roli „kandydat do budowy".
   **Wyjątek dopuszczalny i jedyny:** punktowanie po `grupa` może wymagać nazw GRUP
   (`'Prawo i administracja'`, `'Żywność'`…) — to są nazwy grup, nie budynków, i mogą
   zostać. Wypisz je w raporcie.
2. **Pokrycie 41 / 41.** Bramka wylicza z `buildings.json`, ile budynków AI może w ogóle
   wybrać przy spełnionych warunkach tech/epoki/lokalizacji, i wymaga kompletu.
   Bramka ma czytać liczbę budynków **z danych**, nigdy z zaszytego licznika —
   `grupy-budynkow-test.cjs` jest w tym repo żywym przykładem, jak taki licznik gnije
   (zaszyte 40 przy 41 budynkach, czerwone od lipca).
3. **Priorytety zachowane tam, gdzie były zamierzone.** Dzisiejsza kolejność wczesnej
   gry (studnia → garncarnia → stolarnia → spichlerz → targowisko → administracja) jest
   wynikiem wcześniejszych tematów i **nie jest przypadkowa**. Po przepięciu na grupy
   ta kolejność ma się odtworzyć w scenariuszu wczesnej gry — pokaż ślad z symulacji.
   Jeśli którejś pozycji nie da się odtworzyć punktacją grupową, **zgłoś to jako
   `DECISION_REQUIRED`**, nie porzucaj priorytetu po cichu.
4. **Symulacja 150 tur, PRZED i PO.** Podaj dla epok 1, 2 i 3: ile budynków stoi średnio
   w mieście AI, ile z nich to administracja, i jaki jest średni `prawPct` i `szPct`
   miast AI. To jest jedyny dowód, że naprawa działa w grze, a nie tylko w teście.
5. **Miasta-państwa (`defensiveCopy`) nadal działają** — mają własną, węższą gałąź
   i własne ograniczenia. Zmiana nie może ich zepsuć ani otworzyć im budynków, których
   nie powinny mieć. Osobna asercja.
6. **Łatka Garnizonu z `R-BUDYNEK-GARNIZON-NOWY-Q1` staje się zbędna** — po przepięciu
   `garnizon` jest widoczny automatycznie. **Usuń tę jedną linię z `infraOrder`**
   (jeśli lista w ogóle zostaje) i pokaż asercją, że Garnizon nadal jest dla AI dostępny.
7. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
8. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.
9. **Cała rodzina AI zielona** — wyznacz grepem po `gra/tools/` (`ai-`, `ai_`), wypisz
   listę i wynik każdej. Szczególnie `ai-buduje-budynki-test.cjs` (42/0),
   `ai-prod-fallback-test.cjs`, `ai-production-priority-test.cjs`,
   `ai-cs-offensive-normal-easy-test.cjs`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — BRAMKA, KTÓREJ TEN DEFEKT NIE WIDZI.** `ai-buduje-budynki-test.cjs`
jest przy dzisiejszym defekcie **ZIELONA (42/0)** i to nie jest jej wada: sprawdza, czy
miasta AI mają *jakikolwiek* budynek, nie czy AI potrafi postawić *każdy*. Twoja nowa
bramka musi mierzyć **pokrycie katalogu**, czyli inną wielkość. Jeśli napiszesz asercję,
która przechodzi także przed naprawą — jest bezwartościowa. Pokaż jej wynik PRZED
(ma być czerwona, z liczbą) i PO.

**Tryb drugi — ZASZYTY LICZNIK ZAMIAST ODCZYTU Z DANYCH.** Kryterium 2 wprost tego
zabrania. W tym repo leży `grupy-budynkow-test.cjs` z zaszytym `buildings.length === 40`,
czerwony od lipca, bo ktoś dodał 41. budynek. Nie powtórz tego.

**Tryb trzeci — CICHA UTRATA PRIORYTETÓW.** Przepięcie na `availableProduction` jest
kuszące do zrobienia „płasko": wszystkie budynki z równym wynikiem. Wtedy AI zacznie
stawiać Teatr przed Spichlerzem i wczesna gra się rozsypie. Kryterium 3 i 4 istnieją
po to, żeby to wyszło w pomiarze, a nie w playteście właściciela.

**Tryb czwarty — RACHUNEK „NA OKO".** Tabela pokrycia w RECON jest moja i przybliżona.
Przelicz ją sam i **zgłoś rozbieżność, jeśli ją znajdziesz**, zamiast dopasowywać wynik.

## ALLOWLISTA

- `gra/src/game/ai.ts`
- `gra/src/game/production.ts` — **wyłącznie** jeśli `availableProduction` wymaga wariantu
  dla AI (np. bez efektów ubocznych UI). Zmiana zachowania dla gracza = `DECISION_REQUIRED`.
- `gra/tools/ai-produkcja-pokrycie-katalogu-test.cjs` (NOWY)
- `gra/tools/ai-*.cjs` — istniejące bramki AI, **wyłącznie przepisanie asercji na nowy
  kontrakt**; zakaz usuwania i osłabiania, liczba asercji nie może spaść
- `dyspozycje/autobot/runs/R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1/` (raporty etapów)

Zakazane bezwzględnie: `gra/src/main.ts`, `gra/data/**` (to nie jest temat balansowy —
żadnych zmian w wartościach budynków), pliki z sekretami, `docs/decyzje/**`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.
Zakaz `git add -A` i `git add .` — dodawaj po jawnych ścieżkach.

## IZOLACJA

Worktree `/home/user/wt-ai-produkcja`, gałąź `autobot/R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1`,
baza wskazana jawnie przy zakładaniu — **musi zawierać zintegrowane
`R-BUDYNEK-GARNIZON-NOWY-Q1` i `P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1`**,
bo oba dotykają `ai.ts` (§2b, sekwencyjnie).

PRZED pracą: `git -C /home/user/wt-ai-produkcja log -1 --oneline` i `git status --short`.
Oczekiwana baza i czyste drzewo. Rozbieżność → `BLOCK`, bez zapisu.
Mutacje weryfikacyjne cofaj przez KOPIĘ pliku, nigdy przez `git checkout`.

C-001 (bariera CHRONIONA), brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/`
(export-data nadpisuje JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js
build --outDir dist --emptyOutDir". Jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`. `--outDir` poza drzewem repo,
z UNIKALNYM sufiksem (PID albo losowy).

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Przy decyzji produktowej zatrzymujesz się
ze statusem `DECISION_REQUIRED`. Raport ok. 400 słów PLUS tabela pokrycia i tabela symulacji
(obie są wytworem, nie narracją, i nie liczą się do limitu).

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.

## RATYFIKACJA ORKIESTRATORA (2026-09-06, odpowiedź na DECISION_REQUIRED #1-#4 rundy 1)

Final Control rundy 1 zamknął się na `DECISION_REQUIRED`: pokrycie 39/42 działa
(`chooseCityProduction` czyta z `availableProduction()`/katalogu, nie z zaszytej listy),
ale zostawił cztery decyzje produktowe i jedno poważne, niepotwierdzone ryzyko
(trwały „plateau" AI na jednostkach po 8 budynkach w symulacji proxy bez `canAfford`).
Odpowiedzi właściciela:

**#1 i #4 (13 zaszytych literałów id budynków w `chooseCityProduction` — 5 udokumentowanych
dla fortyfikacji/priorytetu + 8 w logice konwerterów/deficytów surowców) — PRZYJĘTE JAKO
UDOKUMENTOWANY WYJĄTEK.** Cel „nowy budynek nie wymaga linii w `ai.ts`" jest spełniony dla
zwykłych budynków produkcyjnych; tych 13 to specjalne haki (fortyfikacja, konwertery), nie
zwykła lista kandydatów do budowy. **Bez zmian kodu w rundzie 2** — zamknij jako rozstrzygnięte,
wypisz w raporcie pełną listę 13 z uzasadnieniem per pozycja (dziedzictwo z rund 1, Obrony,
Final Control). Pole w `buildings.json` (dla pełnej eliminacji ostatnich 8) **NIE jest
zamawiane** — poza zakresem, nie rejestruj nawet jako osobny temat, chyba że sam znajdziesz
w tym mocny powód.

**#2 (P-AI-008 „major AI nigdy nie buduje Murów") — USUŃ REGUŁĘ CAŁKOWICIE, nie tylko
zawężaj.** Dosłowna decyzja właściciela: „Usuńmy regułę „AI nigdy nie buduje murów"; to jest
bez sensu. AI powinno budować mury, zwłaszcza w sytuacji, kiedy jest zagrożone. I zwłaszcza
w miastach przygranicznych." Zakres pracy w tej rundzie:
1. Usuń filtr `!opts.defensiveCopy` blokujący `'mury'` z kandydatów major AI (`ai.ts` ok.
   l.1576-1578 wg Final Control) — Mury (i pochodne Fort/Baszta, które ich wymagają jako
   prereq) wchodzą do normalnego punktowania po grupie „Wojsko i obrona", na równi z resztą.
2. **Podnieś priorytet Murów, gdy miasto jest ZAGROŻONE** (użyj istniejącego sygnału
   zagrożenia, tego samego co steruje inną logiką `underThreat` w `ai.ts` — znajdź go i
   opisz, który to jest) — bonus do wyniku kandydata `'mury'`/`'fort'`/`'baszta'` w tym stanie,
   nie sztywne odblokowanie tylko wtedy.
3. **Podnieś priorytet Murów w miastach PRZYGRANICZNYCH** (sąsiadujących z terytorium innej
   cywilizacji lub blisko krawędzi kontrolowanego obszaru — znajdź i użyj istniejącego
   sposobu, w jaki gra już rozpoznaje „miasto przygraniczne", jeśli taki istnieje; jeśli nie
   istnieje, zgłoś to jako `DECISION_REQUIRED`, nie wymyślaj nowej metryki samodzielnie).
4. Miasta-państwa (`defensiveCopy`) już budują Mury bez zmian — nie dotykaj tej gałęzi.
5. Dodaj/rozszerz asercje w bramce tematu i w rodzinie `ai-*` pilnujące: (a) major AI
   buduje Mury pod zagrożeniem, (b) major AI NIE buduje Murów masowo bez powodu (nie chodzi
   o to, żeby każde miasto zawsze stawiało Mury pierwsze), (c) miasto-państwo nietknięte.

**#3 (priorytet Spichlerza) — PRZYWRÓĆ JAKO WYJĄTEK.** Właściciel: „Zadaj przywrócenia
priorytetu Spichlerza jako wyjątku." Dodaj Spichlerz do listy udokumentowanych wyjątków
(razem z Murami/Palisadą/Koszarami/Biblioteką/Akademią) z podniesionym priorytetem
odtwarzającym jego dawną wczesną pozycję w kolejce budowy — pokaż to śladem z symulacji
(ta sama metoda proxy co w rundach 1, esbuild bez Vite/Chromium, jawnie nazwana jako proxy,
nie pełny silnik).

**Kryterium 4 (pełna symulacja 150 tur w PRAWDZIWYM silniku, z realną ekonomią) —
ODROCZONE, NIE BLOKUJE tej rundy.** Właściciel: „Możemy zrobić, ale nie w tej rundzie.
Puścimy to dopiero na noc. Najpierw trzeba zamknąć inne tematy. Poza tym ja też to sprawdzę
w PlayTeście." Runda 2 NIE musi dostarczyć tego dowodu, żeby dostać `PASS` — zamiast tego
zarejestruj to jawnie w raporcie jako **otwarte ryzyko do zweryfikowania nocnym przebiegiem
i osobiście przez właściciela w playteście**, nie jako zamknięte kryterium. Final Control
rundy 2 ocenia to jako świadomie odroczone, nie jako brak.

**NOWE (życzenie właściciela, poza formalnymi DECISION_REQUIRED, ale do wykonania w tej
samej rundzie skoro i tak przeglądasz priorytety):** przygotuj w raporcie **pełną tabelę
priorytetów wszystkich 42 budynków, per epoka**, pokazującą wynik/wagę grupy, jaką
`chooseCityProduction` faktycznie im dziś przypisuje (po zmianach z tej rundy) — żeby
właściciel mógł sam przejrzeć i ręcznie ustalić kolejność, zamiast zgadywać po pojedynczych
zgłoszeniach jak Spichlerz. To jest DODATKOWY wytwór (jak tabela pokrycia/symulacji) —
nie liczy się do limitu słów raportu.

**NASTĘPNY KROK po tej ratyfikacji:** runda 2, ten sam Operator, ta sama gałąź. Po Final
Control rundy 2 (jeśli PASS albo PASS z jawnie odroczonym kryterium 4) — integracja
orkiestratora, natychmiast odblokowuje `R-PRAWO-PRZEBUDOWA-SKALI-Q1`.

## RATYFIKACJA ORKIESTRATORA #2 (2026-09-06, po Final Control rundy 2 — Spichlerz PODNIESIONY DO RANGI KRYTERIUM KOŃCA, nie kosmetyki)

Final Control rundy 2 zamknął się na jeden `DECISION_REQUIRED`: bonus Spichlerza ograniczony
do bezpiecznej wartości 8 (wyżej łamie chroniony `ai-jednostki-tylko-zakup-test`), co w
proxy-symulacji **nie zmienia wcale**, czy Spichlerz w ogóle wchodzi do kolejki budowy w
oknie 400 tur (plateau na jednostkach po 8 budynkach, identyczne przed i po bonusie).

**Właściciel wyjaśnił, dlaczego to nie jest kosmetyka priorytetu, tylko realny defekt
rozgrywki:** Spichlerz podnosi limit populacji miasta z 5 do 8, Akwedukt z 8 do 12. **Jeśli
AI nigdy nie zbuduje Spichlerza, jego miasta są trwale zablokowane na populacji 5 — na
zawsze.** To nie jest pytanie o kolejność, to pytanie o to, czy miasta AI w ogóle rosną.

**Rozstrzygnięcie właściciela — dosłowne, wiążące:** „Sprawdź, aby spichlerz był jednym z
pierwszych budynków, które buduje się w epoce kamienia [Epoka 1] przez AI, a kiedy jednym
z pierwszych z epoki brązu [Epoka 2, `spichlerz_ii`], o ile nie pierwszym. Oczywiście tak
szybko, jak jest dostępna technologia dla AI, która to umożliwia. I to jest rozwiązanie
problemu."

### Zadanie rundy 3

1. **`spichlerz` (Epoka 1) ma być jednym z PIERWSZYCH budynków budowanych przez major AI**
   — nie „bezpieczna wartość +8", tylko realny, wysoki priorytet analogiczny do `koszary`
   (+110) / `biblioteka` (+90). Znajdź i napraw PRAWDZIWĄ przyczynę, dla której podniesienie
   bonusu ponad 8 łamie `ai-jednostki-tylko-zakup-test` (44/0 → 41/3 przy 9) — nie omijaj
   tego przez sztuczne ograniczenie liczby. Możliwe kierunki do zbadania (wybierz ten, który
   pasuje do realnego mechanizmu, nie zgaduj): (a) test ma nieaktualne założenie o tym, co
   AI powinno wybrać w swoim scenariuszu, i wymaga aktualizacji zgodnie z nowym kontraktem
   (analogicznie do napraw bramek w innych tematach tej sesji) — ale TYLKO jeśli faktycznie
   jest przestarzały, nie na siłę; (b) bonus Spichlerza powinien być WARUNKOWY — silny, gdy
   miasto zbliża się do sufitu populacji 5 (a więc realnie potrzebuje Spichlerza, żeby
   rosnąć), słaby/zerowy gdy populacja jest daleko od sufitu (scenariusz testu chroni
   dokładnie ten drugi przypadek — sprawdź, czy fixture testu faktycznie odpowiada miastu
   niezagrożonemu sufitem populacji); (c) inny mechanizm, jeśli znajdziesz lepszy.
2. **`spichlerz_ii` (Epoka 2) — jeden z pierwszych, jeśli nie pierwszy** budynek Epoki 2
   budowany przez major AI, natychmiast gdy tech na niego jest dostępne. Zastosuj tę samą
   logikę/mechanizm co w punkcie 1.
3. **Akwedukt — zweryfikuj, nie zakładaj.** Wg symulacji Final Control rundy 1 Akwedukt już
   wchodzi wcześnie (3. budynek w kolejności 8-budynkowego plateau) — potwierdź to WŁASNYM
   pomiarem w tej rundzie i wypisz w raporcie. Jeśli potwierdzone — zero zmian dla Akweduktu.
   Jeśli NIE — potraktuj identycznie jak Spichlerz.
4. **Dowód wymagany: pokaż, że plateau po tej rundzie NAPRAWDĘ zawiera Spichlerz** (i
   Akwedukt/spichlerz_ii, jeśli dotyczy) — powtórz tę samą 400-turową proxy-symulację (bez
   `canAfford`) co Final Control rundy 1/2 i pokaż nowy skład pierwszych ~10 budynków. Samo
   „podniosłem liczbę" bez dowodu z symulacji nie wystarczy — to dokładnie luka, którą
   właściciel właśnie zidentyfikował w rundzie 2.
5. Chroniony gate `ai-jednostki-tylko-zakup-test` — **zero osłabienia bez dowodu, że jego
   scenariusz nie jest tym, w którym Spichlerz naprawdę jest potrzebny.** Jeśli po zbadaniu
   okaże się, że test faktycznie trzeba zaktualizować (bo jego założenie koliduje z tym, co
   właściciel właśnie kazał zrobić) — zrób to jawnie, z uzasadnieniem per pozycja, nie po
   cichu.
6. Kryterium 4 (150 tur w prawdziwym silniku) — nadal odroczone do nocnego przebiegu,
   bez zmian.

**NASTĘPNY KROK:** runda 3, ten sam Operator, ta sama gałąź. Dopiero po PASS rundy 3 —
integracja orkiestratora i odblokowanie `R-PRAWO-PRZEBUDOWA-SKALI-Q1`.
