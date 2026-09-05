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
