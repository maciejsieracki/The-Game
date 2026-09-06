# R-BUDYNEK-GARNIZON-NOWY-Q1 — dispatch (nowy budynek Prawa)

TEMAT: `R-BUDYNEK-GARNIZON-NOWY-Q1`
RUNDA: 1/5 · DATA: 2026-09-05 · DOMAIN: GAME · ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5 high; Evaluator — Opus 5 high; Final Control — Sonnet 5 high.

## WYZWALACZ (właściciel, dosłownie)

> „Przyjmijmy więc, że dokładamy budynek związany nie z wojskiem, ale z prawem, o nazwie
> Garnizon, i on daje 25 do prawa."

> „Wojsko stacjonujące w mieście jest tymczasowe i przeznaczone do prowadzenia wojen,
> a nie do pilnowania porządku. Rozwiązaniem byłoby wprowadzenie garnizonu, czyli
> quasi-policji."

> „Musisz też dorobić nowy budynek; dla nowego budynku trzeba zrobić jeszcze symbol tego
> budynku, kartę budynku i kilka innych elementów, które są z nim związane. Jak na przykład
> ustalenie kosztu rekrutacji, zbudowania oraz utrzymania."

Kontekst i pełne uzasadnienie: **`dyspozycje/BALANS-PRAWO-PRZEBUDOWA.md`** — przeczytaj
w całości przed pracą.

## GOAL

Nowy budynek **Garnizon** — kompletny, na równi z każdym innym budynkiem w grze.
**Ten temat NIE wpina go do Prawa** (to robi `R-PRAWO-PRZEBUDOWA-SKALI-Q1`) ani nie rusza
obrony cywilnej (osobny temat). Ten temat tworzy **sam budynek ze wszystkim, co budynek
w tym repo musi mieć.**

### G1. RECON — ustal SAM, czego wymaga kompletny budynek

**Nie zgaduj z listy poniżej — ona jest punktem wyjścia, nie wyczerpującą specyfikacją.**
Weź trzy budynki administracyjne, które już istnieją (`dom_starszyzny`, `dwor_zarzadcy`,
`trybunal`), prześledź **każde** miejsce w repo, gdzie występują, i odtwórz komplet.
W raporcie wypisz listę miejsc, które znalazłeś, i zaznacz te, których nie było w tym
dispatchu — to jest cenna informacja dla przyszłych tematów.

Punkt wyjścia (uzupełnij go):
- `gra/data/buildings.json` — rekord z pełnym zestawem pól
- ikona / symbol budynku
- karta encji (CivPedia + karta w panelu miasta)
- wpis historyczny (`historia`)
- kolejka budowy i podgląd kosztu
- lista budynków w panelu miasta

### G2. Rekord w `buildings.json`

Wzoruj się na `dwor_zarzadcy` i `trybunal`. Wypełnij **wszystkie** pola, które mają
sąsiednie budynki administracyjne, w tym `dajeSzczescie` (wprowadzone przez temat
szczęścia — Garnizon ma **NIE dawać szczęścia**, kategoria wojskowo-porządkowa).

- `id`: `garnizon`
- `nazwa`: `Garnizon`
- `epokaWejscia`: **1**
- `kategoria` / `grupa`: administracyjno-porządkowa, spójnie z sąsiadami
- `lokalizacja`: `region` (jak urzędy — **nie** `stolica`)
- `dajeSzczescie`: `false`

### G3. Koszt budowy, surowce, utrzymanie — ZAPROPONUJ i UZASADNIJ

Właściciel **nie podał tych liczb** i oczekuje propozycji. Wyprowadź je z sąsiadów, nie
z powietrza. Zmierz i podaj w raporcie:
- `kosztBudowy` sąsiadów epoki 1 i 2, `koszt_surowce`, `utrzymanie`, `przyrostUtrzymania`,
  `maksPoziom`, `przyrost`, `przyrostKosztu`
- Twoja propozycja dla Garnizonu wraz z **jednym zdaniem uzasadnienia na każdą liczbę**

Punkt odniesienia: Dom Starszyzny ma `utrzymanie 1`, Dwór Zarządcy `2`, Pretorium `3`.
Garnizon jest budynkiem o podobnej wadze co Dwór Zarządcy.

**Te liczby idą do właściciela do zatwierdzenia — oznacz je w raporcie jako PROPOZYCJA,
nie jako fakt.**

### G4. Bramka technologiczna

Ustal `techUnlock` / `poziomTechGate` spójnie z tym, że budynek ma być dostępny **od epoki 1**
i realnie osiągalny wcześnie — Prawo jest potrzebne od startu gry. Uzasadnij wybór technologii.

### G5. Symbol / ikona

Znajdź, jak ikony budynków są realizowane w tym repo (**ustal to reconem**, nie zakładaj),
i dorób symbol dla Garnizonu spójny stylistycznie z resztą kategorii administracyjnej.

### G6. Karta budynku

Karta encji ma się renderować kompletnie: nazwa, kategoria, koszt, utrzymanie, efekty,
historia. Sprawdź w ŻYWYM Chromium i **zapisz zrzut** w `dowody/`.

### G7. Wpis historyczny

Krótki, rzeczowy `historia` w stylu pozostałych budynków — funkcja porządkowa,
straż miejska, wczesne formacje pilnujące prawa. Bez anachronizmów.

## KRYTERIA KOŃCA (binarne)

1. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
2. Nowa bramka `gra/tools/budynek-garnizon-test.cjs`:
   - a) rekord `garnizon` istnieje i ma **komplet pól**, które mają `dwor_zarzadcy`
     i `trybunal` — asercja porównawcza po nazwach pól, nie po sztywnej liście;
   - b) `dajeSzczescie === false`;
   - c) `lokalizacja === 'region'`, `epokaWejscia === 1`;
   - d) budynek pojawia się w kolejce budowy miasta epoki 1 (realny render);
   - e) karta encji renderuje się bez błędu i zawiera nazwę, koszt, utrzymanie i historię.
3. Zrzut z żywego Chromium: karta budynku + budynek w kolejce budowy — **obejrzane
   i opisane** w `dowody/`. Temat wizualny bez obejrzanego zrzutu jest niezamknięty
   (`R-PROC-AUTOBOT.md` §9 poz. 6).
4. Pięć bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.
5. Bramki rodziny budynków — **ZNAJDŹ SAM**
   (`ls gra/tools/ | grep -Ei "budynk|building|civpedia|entity-card|kolejka|queue"`),
   uruchom WSZYSTKIE, podaj wyniki.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — budynek-widmo.** Dodanie rekordu do `buildings.json` i uznanie tematu za
zamknięty. Budynek w tym repo żyje w kilkunastu miejscach: dane, ikona, karta, CivPedia,
kolejka, panel miasta, podgląd kosztu, historia. **Pokaż zrzutem, że gracz go widzi
i może go zbudować** — nie samą obecnością w JSON.

**Tryb drugi — kopiuj-wklej bez zrozumienia.** Skopiowanie rekordu `dwor_zarzadcy` i podmiana
nazwy da budynek z `upgradeFrom: dom_starszyzny`, czyli Garnizon **zastąpi** Dom Starszyzny
i zniknie z miasta po awansie. Garnizon **NIE JEST w żadnym łańcuchu ulepszeń** —
`upgradeFrom` musi być puste. Asercja na to.

**Tryb trzeci — ciche wymyślanie liczb balansu.** Koszt i utrzymanie masz ZAPROPONOWAĆ
z pomiarem sąsiadów i jawnie oznaczyć jako propozycję do zatwierdzenia. Podanie ich jako
faktu jest naruszeniem granicy — balans należy do właściciela.

**Tryb czwarty — test tautologiczny.** Pokaż, że bramka czerwienieje po mutacji: usuń jedno
pole z rekordu `garnizon`, uruchom, wklej liczbę faili, cofnij.

## ALLOWLISTA

- `gra/data/buildings.json` (**wyłącznie** dodanie rekordu `garnizon`; zero zmian
  w istniejących rekordach)
- pliki ikon/symboli budynków — **ustal ścieżki reconem** i wypisz je w raporcie
- `gra/src/ui/entityCards/buildingAdapter.ts` (tylko jeśli konieczne; uzasadnij)
- `gra/tools/budynek-garnizon-test.cjs` (NOWY)
- `dyspozycje/autobot/runs/R-BUDYNEK-GARNIZON-NOWY-Q1/**`

Zakazane bezwzględnie: `gra/src/main.ts`, `gra/data/society-params.json`,
`gra/src/game/society-breakdown.ts`, `gra/src/ui/cityPanel.ts`, `gra/src/game/culture-religion.ts`,
`gra/src/game/wealth.ts`, `gra/src/game/economy.ts`, `gra/data/wonders.json`
(wszystkie trzyma `R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`, §2b), `gra/src/game/siegeDefenders.ts`,
`gra/src/game/siege.ts` (trzyma je temat obrony cywilnej), pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz `git add -A` i `git add .`.

**Jeśli recon (G1) wykaże, że kompletny budynek wymaga pliku spoza allowlisty — NIE wchodź
w niego. Zgłoś to jako `DECISION_REQUIRED` z listą plików i uzasadnieniem.** Orkiestrator
rozszerzy allowlistę, tak jak zrobił to już dwa razy w tej sesji.

## IZOLACJA

Worktree `/home/user/wt-garnizon`, gałąź `autobot/R-BUDYNEK-GARNIZON-NOWY-Q1`,
baza jawnie `origin/main` na SHA z założenia — potwierdź `git log -1` PRZED pracą.

C-001: zakaz `npm run build`/`dev` w `gra/`. Jedyna dozwolona kompilacja:
`node ./node_modules/typescript/bin/tsc --noEmit`. `--outDir` poza drzewem repo,
z **unikalnym sufiksem** (PID albo losowy).

**SZCZEGÓLNA OSTROŻNOŚĆ:** `export-data` nadpisuje pliki JSON danych gry. Po każdej zmianie
w `buildings.json` sprawdź `git diff --stat gra/data/` i upewnij się, że zmienił się
**wyłącznie** nowy rekord.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i poprawkę. Runda N+1 na TYM SAMYM ID i TEJ SAMEJ
gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- **Nie wpinasz Garnizonu do Prawa** — wartość 25/35/47 wprowadza osobny temat.
- **Nie ruszasz obrony cywilnej ani `hasCityDefenders`** — osobny temat.
- Nie integrujesz, nie deployujesz, nie pushujesz do origin.
- Przy decyzji produktowej: `DECISION_REQUIRED`.

## OBIEG

Operator → Evaluator → (Obrona, jeśli zarzuty) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.

---

## RATYFIKACJA ORKIESTRATORA — runda 2 (2026-09-05, po `DECISION_REQUIRED` rundy 1)

Raport rundy 1 przyjęty. Recon G1 (dziesięć miejsc, których dispatch nie znał), zrzuty
z żywego Chromium, mutacja M2 odtwarzająca dokładnie pułapkę `upgradeFrom` — wzorowo.
Trzy blokady rozstrzygam niżej, plus decyzja właściciela o liczbach.

### R2-A. LICZBY — ECHO WŁAŚCICIELA, wariant Operatora ZATWIERDZONY BEZ ZMIAN

| pole | wartość |
|---|---|
| `kosztBudowy` | **30** (60 punktów Pracy na ekranie) |
| `przyrostKosztu` | **6** |
| `utrzymanie` | **2** (4 Pieniądza, 5 drewna/turę) |
| `przyrostUtrzymania` | **1** |
| `koszt_surowce` | **drewno 30** (60 z magazynu) |
| `maksPoziom` | **1** |
| `epokaWejscia` | **1** · `lokalizacja: region` · `techUnlock: "-"` · `dajeSzczescie: false` |

Właściciel wybrał tę wersję wprost, z uzasadnieniem Operatora: droższy od Domu Starszyzny
(kwatery i posterunek, nie izba obrad), tańszy od każdego urzędu epoki 2 (ma być realnie
osiągalny w pierwszych turach), utrzymanie jak Dwór Zarządcy (strażnicy biorą żołd).

**Teraz to są liczby właściciela.** Od tej chwili obowiązuje zakaz ich strojenia —
i **bramka ma je zamrozić**: dołóż asercje na dokładne wartości `30 / 6 / 2 / 1 / drewno 30`.
W rundzie 1 słusznie ich nie zamrażałeś (były propozycją); teraz jest odwrotnie — bez
asercji ktoś je zmieni przy następnej fali i nikt nie zauważy.

### R2-B. ALLOWLISTA ROZSZERZONA o `gra/tools/grupy-budynkow-test.cjs`

Bramka ma zaszyte liczniki z lipca: `buildings.length === 40` i `'Prawo i administracja': 8`.
Była **czerwona już przed Twoją pracą** (41 budynków vs 40) — Twój rekord dokłada czwarty
fail tej samej klasy.

**Popraw OBA liczniki na stan faktyczny (42 i 9) i napraw też pre-istniejący fail.**
Nie zostawiaj bramki „czerwonej jak była" — to jest dokładnie ten rodzaj długu, który
narósł tu przez półtora miesiąca. **Dołóż komentarz**, że liczniki wymagają bumpu przy
każdym nowym budynku, żeby następny Operator wiedział to od razu.

Jeśli po poprawce zostaną w tym pliku inne faile, których przyczyną nie jest liczba
budynków — **wypisz je i zostaw**, to osobna sprawa.

### R2-C. ALLOWLISTA ROZSZERZONA o hasło CivPedii

`docs/encyklopedia/budynki/garnizon.md` + regeneracja `gra/src/data/wikiBundle.json`.

Przycisk „Więcej informacji (Civpedia)" jest na karcie **zawsze**; bez hasła klik jest
no-opem. Fakt, że 17 z 42 budynków ma tę samą lukę, jest argumentem za jej niepowiększaniem,
nie za dołączeniem do niej.

**Uwaga praktyczna z Twojego własnego reconu:** `civpedia-gra-id-mostek-test.cjs` przy
uruchomieniu **nadpisuje** śledzony `wikiBundle.json` (zmienia stempel `generated`).
Po regeneracji sprawdź `git diff` tego pliku i upewnij się, że commitujesz treść, a nie
sam przestawiony stempel.

### R2-D. ALLOWLISTA ROZSZERZONA o `gra/src/game/ai.ts` — JEDNA LINIA

**ECHO właściciela: „Dopisać Garnizon do listy AI od razu."**

Zakres: **wyłącznie dopisanie `garnizon` do zaszytej listy `infraOrder`** (~linia 1471).
Ani jednej innej zmiany w tym pliku.

**§2b — ostrzeżenie o kolizji, przeczytaj zanim dotkniesz pliku.** Równolegle pracuje temat
`P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1` w rejonie `ai.ts:2517`. Twoja zmiana
jest o tysiąc linii wyżej, więc integracja powinna przejść — ale **zmień dokładnie jedną
linię**, żeby scalenie było trywialne. Jeśli zobaczysz potrzebę większej zmiany —
`DECISION_REQUIRED`, nie improwizuj.

**Właściciel wie, że to jest łatka, a nie naprawa przyczyny** — decyzję podjął po opisaniu,
że następny nowy budynek znowu będzie dla AI niewidoczny. Rejestruję osobny temat
`P-AI-LISTA-BUDYNKOW-ZASZYTA-NIE-Z-PRODUKCJI-Q1` na naprawę źródła; **Ty go nie robisz.**

Dołóż asercję do swojej bramki: `garnizon` występuje na liście AI. Bez niej łatka wypadnie
przy pierwszym refaktorze `ai.ts`.

### R2-E. Trzy niespójności zastane — ZOSTAJĄ, zarejestrowane

`trybunal` bez wpisu w `building-icon-map.json` (leci na heurystykę), `bld-pretorium.svg`
istnieje ale mapa kieruje `pretorium` na `bld-palac`, `civpedia-gra-id-mostek-test` brudzi
śledzony plik. **Nie naprawiasz ich** — rejestruje orkiestrator. Wypisz je w OBSERWACJACH.

### KRYTERIA KOŃCA rundy 2

1. Liczby R2-A w `buildings.json` co do cyfry, **zamrożone asercjami** w bramce tematu.
2. `node gra/tools/grupy-budynkow-test.cjs` — **zielona** (albo z jawną listą faili
   niezwiązanych z liczbą budynków).
3. `docs/encyklopedia/budynki/garnizon.md` istnieje, `wikiBundle.json` zawiera hasło,
   a klik „Więcej informacji" na karcie Garnizonu **otwiera je w żywym Chromium** — zrzut
   w `dowody/`. Bez zrzutu to jest deklaracja, nie dowód (§9 poz. 6b).
4. `garnizon` na liście AI + asercja w bramce.
5. Bramka tematu zielona z liczbą asercji **wyższą niż 55** (dochodzą zamrożone liczby,
   CivPedia i lista AI).
6. `tsc --noEmit` zielony; pięć bramek referencyjnych zielonych.
7. Mutacja per nowa grupa asercji: zmień `kosztBudowy` na 31 → bramka czerwona; usuń
   `garnizon` z listy AI → bramka czerwona; usuń hasło CivPedii → bramka czerwona.
   Każdą cofnij przez KOPIĘ pliku, `git diff --quiet`.

### Czego runda 2 NIE robi

Nie wpina Garnizonu w Prawo (osobny temat `R-PRAWO-PRZEBUDOWA-SKALI-Q1`, wartości 25/35/47).
Nie rusza obrony cywilnej ani Milicji (`P-MILICJA-OBRONA-CYWILNA-Q1`). Nie naprawia
przyczyny problemu z listą AI. Nie rusza trzech zastanych niespójności z R2-E.

---

## RATYFIKACJA ORKIESTRATORA — runda 3 (2026-09-06, po Final Control `FAIL`)

Final Control rundy 2 wykonał kawał roboty i **wszystkie trzy `NAPRAW` są trafne**. Runda 3
robi dokładnie je, plus dwie pozycje procesowe. Trzy werdykty „DO DECYZJI CZŁOWIEKA"
rozstrzygam niżej — dwa z nich właściciel już rozstrzygnął w ABC tej nocy.

### R3-A. `NAPRAW` #2 — REGRES `civpedia-budynki-historia-test` 136/0 → 138/3

Trzy zaszyte liczniki `25` (`:75`, `:123`, `:126`). To ta sama klasa co `grupy-budynkow-test`
i ten sam błąd, który R2-B kazał naprawić w tamtym pliku — a tutaj przeoczyliśmy.

**Popraw liczniki na stan faktyczny i dołóż komentarz**, że wymagają bumpu przy każdym nowym
haśle CivPedii. **Jeśli da się je policzyć z danych zamiast zaszyć — zrób to** i napisz w raporcie,
dlaczego było to możliwe tutaj, a (jeśli tak wyjdzie) niemożliwe w `grupy-budynkow-test`.
Bramka ma wrócić do zera faili z liczbą asercji **nie mniejszą** niż 138.

### R3-B. `NAPRAW` #3 — pole BLOKADY zgubiło dwie otwarte blokady rundy 1

Raport rundy 2 przyjął dwie blokady rundy 1, ale nie przeniósł ich do swojego pola BLOKADY.
**Odtwórz je w raporcie rundy 3** — blokada przyjęta, ale niedomknięta, musi być widoczna
w każdym kolejnym raporcie, aż zniknie. Inaczej znika z pola widzenia dokładnie tak, jak
zniknęła tutaj.

### R3-C. `NAPRAW` #5 — brak `decision-abc.md` i brak wpisu w rejestrze

C-054 wymaga `decision-abc.md` przy każdym `DECISION_REQUIRED`. Runda 1 go nie zapisała.
**Utwórz go retroaktywnie** z trzema pytaniami rundy 1 i odpowiedziami właściciela
(liczby 30/6/2/1/drewno 30 — zatwierdzone; lista AI — „dopisać od razu"; CivPedia — rozszerzona
allowlista). Wpis do rejestru robi orkiestrator, nie Ty.

### R3-D. `NAPRAW` W2 — etykieta asercji `[AI3]` kłamie

Etykieta twierdzi „bez tego AI nigdy go nie zbuduje". **To jest nieprawda** i Final Control
to udowodnił: `infraOrder` siedzi w gałęzi `if (opts.defensiveCopy)` (`ai.ts:1455`), czyli
dotyczy **państw-miast**, a nie cywilizacji AI. Duże AI Garnizonu **nadal nie widzi**.

**Przepisz etykietę na prawdę:** asercja pilnuje, że `garnizon` jest na liście budowy
**państw-miast**. Nic więcej. Jeśli asercja przy okazji sugeruje pokrycie dużego AI —
usuń tę sugestię, ale **nie usuwaj samej asercji**.

### R3-E. `NAPRAW` W3 — brak Obrony rundy 2

§16b pkt 3 wymaga odpowiedzi Obrony do **każdego** zarzutu. Runda 2 jej nie miała.
Runda 3 ma pełny obieg: Operator → Evaluator → Obrona.

### Trzy werdykty „DO DECYZJI CZŁOWIEKA" — rozstrzygnięcia

**#1 — martwy klik „Więcej informacji" dla wszystkich 42 budynków.** Final Control ma rację,
że kryterium 3 w brzmieniu dosłownym było **niewykonalne w allowliście**, bo defekt leży
w `renderer.ts` i dotyczy całej rodziny kart (budynki, jednostki, technologie, ulepszenia),
nie Garnizonu. **Właściciel rozstrzygnął w ABC: osobny temat na całą rodzinę kart.**
Zdejmuję to z Garnizonu. Kryterium 3 uznaję za **spełnione w części wykonalnej**: hasło
CivPedii istnieje i jest w bundlu; działający klik należy do tamtego tematu.
**Zamiast zrzutu działającego kliku** dołóż asercję, że hasło `garnizon` jest obecne
w `wikiBundle.json` i ma niepustą treść.

**#4 i W1 — łatka AI bezczynna dla dużych cywilizacji.** Operator wykonał dokładnie to,
co zlecała ratyfikacja („ani jednej innej zmiany w tym pliku"), i **zgłosił rozbieżność
zamiast improwizować — to było prawidłowe**. Błąd był mój: zatwierdziłem łatkę, nie sprawdziwszy,
w której gałęzi siedzi lista.
**Łatka ZOSTAJE** — daje efekt dla państw-miast i nic nie psuje. Duże AI naprawia osobny,
już zapisany temat `R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1` (ECHO właściciela: przepiąć AI
na `availableProduction()`, koniec listy na sztywno). **Nie próbuj naprawiać dużego AI w tej
rundzie** — to jest zakres tamtego tematu i wejście tam złamie §2b.

**W4 — rozjazd modelu (dispatch mówi Sonnet 5, prompt zlecił Opus 5).** Rozstrzygam:
**Opus 5 był świadomym wyborem orkiestratora**, bo temat ma składnik wizualny (§9 poz. 6b:
karta, ikona, zrzuty z Chromium) i wysoką cenę pomyłki w danych balansu. Rozbieżność
zapisana; dispatch nie był zaktualizowany i to moja niedokładność, nie naruszenie.

### KRYTERIA KOŃCA rundy 3

1. `node gra/tools/civpedia-budynki-historia-test.cjs` — zielona, **≥138 asercji**.
2. `node gra/tools/grupy-budynkow-test.cjs` — zielona (z rundy 2, ma pozostać).
3. `node gra/tools/budynek-garnizon-test.cjs` — zielona; etykieta `[AI3]` zgodna z prawdą;
   nowa asercja na obecność i niepustość hasła CivPedii w `wikiBundle.json`.
4. `decision-abc.md` istnieje i zawiera trzy pytania rundy 1 z odpowiedziami.
5. Pole BLOKADY raportu wymienia obie otwarte blokady rundy 1.
6. `tsc --noEmit` zielony; pięć bramek referencyjnych zielonych.
7. **Mutacja per naprawa:** zmień jeden licznik CivPedii → bramka czerwona; usuń hasło
   `garnizon` z bundla → bramka tematu czerwona. Każdą cofnij przez KOPIĘ pliku,
   `git diff --quiet`.
8. `git diff` wobec rundy 2 **nie dotyka `gra/data/buildings.json`** — liczby właściciela
   są zamrożone i runda 3 ich nie rusza.

### Czego runda 3 NIE robi

Nie naprawia kliku CivPedii (osobny temat na całą rodzinę kart). Nie rusza dużego AI
(osobny temat). Nie zmienia ani jednej liczby balansu. Nie wpina Garnizonu w Prawo.
