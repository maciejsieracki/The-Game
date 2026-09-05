# R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — dispatch

TEMAT: `R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1`
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — **Opus 5**, effort high; Evaluator — **Opus 5**, effort high
(temat wizualny, `R-PROC-AUTOBOT.md` §9 poz. 6b); Final Control — Sonnet 5, effort high.

## WYZWALACZ (dosłownie, właściciel, ze zrzutem mapy)

> „Zauważyłem, że czasem miasta danej cywilizacji, zamiast nazywać się z listy miast,
> nazywają się Chińczycy. To nie tak powinna się nazywać stolica danej cywilizacji, tylko
> zgodnie z nazwami miast tej cywilizacji, tak jak Ateny były dla Grecji czy Rzym dla
> Rzymian. Trzeba to sprawdzić i poprawić, bo w kilku cywilizacjach to widziałem. Być może
> nazwa miasta została pomylona z nazwą cywilizacji i, co ważne, trzeba sprawdzić
> historycznie, która stolica tej cywilizacji była pierwotna, i tak ją nazwać."

Zrzut: plakietka na mapie — korona, napis **CHIŃCZYCY**, liczba **4**.

**ECHO właściciela po przedstawieniu wyniku reconu (AskUserQuestion):**
**„Pokaż nazwę miasta i cywilizację"** — etykieta obcej stolicy ma nieść OBA człony,
wzorem państw-miast: `Xi'an · Chińczycy`, plus korona jak dotąd.

## RECON — HIPOTEZA WŁAŚCICIELA SIĘ NIE POTWIERDZIŁA, PRZYCZYNA JEST INNA

To jest najważniejsza część dispatchu. **Nie ma błędu w danych ani w nadawaniu nazw.**

**A. Dane są kompletne dla WSZYSTKICH cywilizacji.**
`gra/data/city-names-pools.json`, klucz = `ikonaId` cywilizacji, kształt wpisu
(`nazwa_pl`, `miasta_cywilizacji`, `miasta_panstwa`) w `city-names-pool.ts:39-43`.
Chińczycy mają **100** nazw miast (`Xi'an`, `Luoyang`, `Pekin`, `Nankin`, `Kaifeng`, …)
i **10** nazw państw-miast (`Qin, Qi, Chu, Jin, Yan, Zhao, Wei, Han, Lu, Song`).
**Wszystkie 15 cywilizacji mają dokładnie 100 + 10 pozycji**, a walidator tego pilnuje
(`city-names-pool.ts:243-248`). Nie ma cywilizacji z brakującą ani krótką listą.

**B. Fallback „nazwa cywilizacji jako nazwa miasta" istnieje, ale jest MARTWY.**
`city-names-pool.ts:126` (`stateCityNameAt(pools, ikonaId, 0, ikonaId)`) i
`civ-names.ts:90` — oba dają `ikonaId`, czyli `chinczycy` **małymi literami**, nie
„Chińczycy". Przy obecnych danych nigdy nie są osiągane. Pozostałe fallbacki dają
`Stolica` (`city-names-pool.ts:76`), `Rywal N` (`:91`), `Miasto` (`:187`).

**C. PRZYCZYNA: świadoma podmiana w warstwie WYŚWIETLANIA.**
`display-names.ts:174` — warunek
`isForeign && opts?.isCapital === true && !isCityState && !isCityStateOwner`
prowadzi do `display-names.ts:252`: `if (isClusterCapital && cleanCiv) return cleanCiv;`
→ zwraca nazwę cywilizacji zamiast nazwy miasta. Miasto **ma poprawną nazwę z puli**
(np. `Xi'an`) — jest tylko przykryta na etykiecie.
Wołający: `render/cities.ts:778-789` (`_cityMapLabel`), `:861-862`, korona `:839`;
wpięcie `main.ts:2284`.

**D. To była JAWNA decyzja projektowa, zdeployowana.**
`docs/decyzje/MAP-UX-CLUSTER-LABEL-Q1.md:11`: „Stolica obcego państwa: **etykieta
cywilizacji** (np. „Chińczycy") **oraz** marker wizualny (korona…)". Dokument używa
dosłownie tego samego przykładu, który zobaczył właściciel. Rejestr:
`REJESTR-PROSB-I-ZADAN.md:150`, `MAP-UX-CLUSTER-LABEL-Q1`, **ZDEPLOYOWANE FALA 296**
(`a37f7123`, commity `9d33e8f` + `d3470ed`). Powiązane: `:276` `R-AUDYT-STOLICE-VS-MP`.
**Ten temat ŚWIADOMIE zmienia tamtą decyzję na wyraźne żądanie właściciela** — to nie jest
naprawa błędu, to zmiana projektu.

**E. Dlaczego „w kilku cywilizacjach": objaw jest jednakowy dla KAŻDEJ.**
Nie zależy od kompletności danych — zależy wyłącznie od tego, czy miasto jest obcą stolicą.

**F. Wzorzec docelowy JUŻ ISTNIEJE w tym samym pliku, dwie linie niżej.**
`display-names.ts:253-255`: państwa-miasta dostają
`` `${cleanCity}${CITY_STATE_SEPARATOR}${cleanCiv}` `` → „Yan · Chińczycy".
Guard `isCityStateOwner` (`display-names.ts:172,174`) chroni je przed podmianą z (C).
**Zmiana sprowadza się do ujednolicenia gałęzi stolicy z gałęzią państwa-miasta** —
nie do budowy nowego formatu.

**G. Dane wejściowe są już dostępne** — `cleanCity` powstaje z `cityName` w tym samym
bloku (`display-names.ts:242-244`), a `formatCityMapLabel` dostaje `city` z nazwą
(`render/cities.ts:782-788`). **Nie trzeba przekazywać niczego nowego przez `main.ts`.**

**H. Druga część zgłoszenia właściciela — „sprawdzić historycznie, która stolica była
pierwotna" — jest BEZPRZEDMIOTOWA po ustaleniu (A) i (C)**, ale nie ignoruj jej milcząco:
sprawdź, czy pierwsza pozycja `miasta_cywilizacji` każdej cywilizacji jest sensowną
stolicą historyczną (dla Chińczyków `Xi'an` — Chang'an, stolica Zachodniej Han i Tangów,
jest historycznie zasadne), i **napisz w raporcie, czy któraś cywilizacja ma na pierwszej
pozycji nazwę oczywiście nie-stołeczną**. Jeśli tak — zgłoś jako `DECISION_REQUIRED`,
NIE zmieniaj danych samodzielnie (kolejność puli to decyzja właściciela).

## GOAL

### GOAL 1 — etykieta obcej stolicy niesie oba człony

`display-names.ts:252` przestaje zwracać samą nazwę cywilizacji. Obca stolica dostaje
`nazwa miasta` + separator + `nazwa cywilizacji`, **tym samym separatorem i w tej samej
kolejności co państwa-miasta** (`CITY_STATE_SEPARATOR`, gałąź `:253-255`) — chodzi
o ujednolicenie, nie o drugi wariant formatu. Korona i liczba populacji bez zmian.

Zachowaj degradację, którą ma gałąź państw-miast: gdy `cleanCity` brakuje albo jest równe
`cleanCiv`, wracamy do samej nazwy cywilizacji zamiast produkować „Chińczycy · Chińczycy".

### GOAL 2 — państwa-miasta i miasta gracza bez zmian

Gałąź `isCityState` (`:253-256`) i ścieżka miast własnych (`isForeign === false`) mają
zachowanie **identyczne jak dziś**. Udowodnij asercją, nie deklaracją.

### GOAL 3 — bramka testowa

Nowa `gra/tools/mapa-etykieta-stolicy-test.cjs`, minimum:
1. obca stolica → etykieta zawiera ORAZ nazwę miasta, ORAZ nazwę cywilizacji,
   w kolejności i z separatorem identycznym jak dla państwa-miasta;
2. obca stolica, gdy nazwa miasta = nazwa cywilizacji → brak duplikatu
   („Chińczycy · Chińczycy" NIE występuje);
3. obca stolica bez nazwy miasta → sama nazwa cywilizacji (degradacja, nie pusty string
   ani separator-sierota);
4. państwo-miasto → etykieta DOKŁADNIE jak dziś (regresja);
5. zwykłe obce miasto (nie stolica) → etykieta DOKŁADNIE jak dziś (regresja);
6. miasto gracza → etykieta DOKŁADNIE jak dziś (regresja);
7. nazwa techniczna (`isTechnicalOwnerLabel`) nadal jest odfiltrowywana w obu członach.

## KRYTERIA KOŃCA (binarne)

- [ ] `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
- [ ] `node tools/mapa-etykieta-stolicy-test.cjs` — 100% pass, minimum 7 asercji.
- [ ] Zrzut żywego Chromium mapy z widoczną obcą stolicą — **obejrzany i opisany**,
      w `dowody/`. Sprawdź na nim, czy dłuższa etykieta (dwa człony zamiast jednego)
      nie rozjeżdża plakietki ani nie zachodzi na sąsiednie heksy — **to jest realne
      ryzyko tej zmiany**, bo etykieta rośnie mniej więcej dwukrotnie.
- [ ] Raport odpowiada na pytanie (H): czy pierwsza pozycja `miasta_cywilizacji` każdej
      z 15 cywilizacji jest sensowną stolicą historyczną. Lista, nie ogólnik.
- [ ] Pięć bramek referencyjnych bez regresu: logic 213/213, tech-tree 19/19,
      research 33/33, unit-replace 13/13, combat 6/6.
- [ ] Bez regresu na bramkach nazw/etykiet — **znajdź je sam**
      (`ls gra/tools/ | grep -Ei "name|nazw|label|etykiet|city-names|display"`),
      uruchom WSZYSTKIE, podaj wyniki; czerwona → sprawdź parytet na czystej bazie
      PRZED zgłoszeniem jako regres.

## REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

**Tryb pierwszy, specyficzny dla tego tematu: „naprawa" nieistniejącego błędu w danych.**
Właściciel podejrzewał pomylenie nazwy miasta z nazwą cywilizacji w danych. Recon to
obalił: dane są kompletne dla wszystkich 15 cywilizacji, a podmiana dzieje się w warstwie
wyświetlania. **Zakaz dotykania `city-names-pools.json` i `civs.json`** — jeśli uznasz, że
dane jednak są wadliwe, pokaż to konkretnym wpisem i zgłoś `DECISION_REQUIRED`, zamiast
edytować.

**Tryb drugi: cofnięcie cudzej decyzji szerzej, niż o to poproszono.**
`MAP-UX-CLUSTER-LABEL-Q1` jest zdeployowaną decyzją (FALA 296). Właściciel zmienia
**jeden** jej element — etykietę obcej stolicy. Korona, marker, zachowanie państw-miast
i miast własnych zostają. Każda zmiana poza tym jednym elementem to wyjście poza zakres.

**Tryb trzeci: uznanie tematu wizualnego za zamknięty bez obejrzanego zrzutu.**
Etykieta rośnie dwukrotnie — zrzut jest tu nie formalnością, tylko jedynym sposobem
zobaczenia, czy plakietka się nie rozjeżdża.

**Tryb czwarty: test tautologiczny.** Pokaż, że bramka czerwienieje po mutacji — przywróć
`return cleanCiv;` w linii 252, uruchom, wklej liczbę faili, cofnij.

## ALLOWLISTA

- `gra/src/game/display-names.ts`
- `gra/src/render/cities.ts` (**tylko** jeśli konieczne — recon (G) mówi, że dane już tam
  są; jeśli edytujesz, uzasadnij w raporcie)
- `gra/tools/mapa-etykieta-stolicy-test.cjs` (nowy)
- `dyspozycje/autobot/runs/R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, **`docs/decyzje/**` (w tym
`MAP-UX-CLUSTER-LABEL-Q1.md` — aktualizację decyzji robi orkiestrator po integracji,
nie ty)**, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`,
`playbook.json`, **`gra/data/city-names-pools.json`, `gra/data/civs.json`** (recon A — dane
są poprawne), **`gra/src/main.ts`, `gra/src/game/visibility.ts`,
`gra/src/ui/entityCards/**`, `gra/src/ui/techDiscoveryNotice.ts`,
`gra/src/game/society-breakdown.ts`, `gra/src/game/order.ts`,
`gra/data/society-params.json`, `gra/src/ui/empireDetailPanel.ts`** — zajęte przez
równolegle biegnące tematy (`R-PROC-AUTOBOT.md` §2b).
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-mapa-etykieta-stolicy`, gałąź
`autobot/R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1`, baza jawnie `origin/main` —
potwierdź `git log -1` PRZED pracą.

C-001, brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje
JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist
--emptyOutDir". Jedyna dozwolona kompilacja: `node ./node_modules/typescript/bin/tsc
--noEmit`; bramki `node tools/*-test.cjs` nie są zakazem objęte. `--outDir` poza drzewem repo.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Nie zmieniasz danych nazw miast ani cywilizacji.
- Nie zmieniasz korony, markera stolicy ani liczby populacji na plakietce.
- Nie zmieniasz etykiet państw-miast, zwykłych obcych miast ani miast gracza.
- Nie aktualizujesz `docs/decyzje/MAP-UX-CLUSTER-LABEL-Q1.md` — to robi orkiestrator.
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno, integracja allowlist-only ręką orkiestratora.

---

# RUNDA 2 — ZMIANA KIERUNKU PO POMIARZE + RATYFIKACJA ALLOWLISTY

DATA: 2026-09-04
STATUS RUNDY 1: Evaluator `FAIL`. **Nie za jakość wykonania — za to, że zmierzył
i pokazał, że rozwiązanie z ECHO rundy 1 fizycznie nie mieści się na plakietce.**

## Dlaczego kierunek się zmienia

Evaluator policzył realne szerokości prawdziwym fontem (`700 22px Georgia`) wobec
budżetu `maxNameW = 200 − prodW − growthW − crownW` (`render/cityMapStatChip.ts:769`):

| stan | stolic przyciętych (budżet 181 px) | z produkcją (161 px) |
|---|---|---|
| przed tematem | **0 z 15** | 0 z 15 |
| po rundzie 1 | **14 z 15** | **15 z 15** |

Skrajny przypadek: `UMGUNGUNDLOVU · ZULUSI` → `UMGUNGUND…` — **człon cywilizacji znika
całkowicie**, czyli wynik GORSZY niż przed tematem, gdzie czytelne było „ZULUSI".

**ECHO WŁAŚCICIELA po przedstawieniu tych pomiarów: „Sama nazwa miasta, bez cywilizacji".**
Obca stolica ma być podpisana jak każde inne miasto — korona zostaje znakiem stolicy,
kolor terytorium znakiem przynależności.

## R2-1 — uprość etykietę do samej nazwy miasta

Gałąź `isClusterCapital` w `display-names.ts` ma zwracać **nazwę miasta**, nie nazwę
cywilizacji i nie oba człony. Mechanizm opt-in `clusterCapitalWithCityName` z rundy 1
prawdopodobnie przestaje być potrzebny — **usuń go, jeśli po uproszczeniu nie ma
drugiego konsumenta**; jeśli ma (np. `ownerDiploLabel`, `main.ts:7879`, wymaga innego
zachowania niż mapa), zostaw i uzasadnij.

Degradacja: gdy brak nazwy miasta — sama nazwa cywilizacji, jak dotąd. Nie pusty string.

**Państwa-miasta, zwykłe obce miasta i miasta gracza: BEZ ZMIAN.** To ma zostać
udowodnione asercją, nie deklaracją.

## R2-2 — NAPRAWA BŁĘDU NAZEWNICTWA STOLIC AI (ratyfikowana, nowa)

**To jest znalezisko Operatora rundy 1, którego mój recon błędnie uznał za bezprzedmiotowe.
Przyznaję błąd.**

`cluster-spawn.ts:354` → `foreignCapitalCityName` → `foreignCapitalFromPool` →
`stateCityNameAt(pools, id, 0)` czyta **`miasta_panstwa[0]`**, czyli pulę PAŃSTW-MIAST,
a nie listę miast cywilizacji. U 13 z 15 cywilizacji obie pule mają tam to samo, więc
różnicy nie widać. Wyjątki, oba widoczne w grze:
- **Chińczycy: `Qin` zamiast `Xi'an`** — a `Qin` to nazwa państwa i dynastii, nie miasta;
  to jest dosłownie napis, który właściciel zobaczył na zrzucie;
- **Słowianie: `Kiev` zamiast `Kijów`.**

**ECHO WŁAŚCICIELA: „Tak, w tym samym temacie".**

Stolica AI ma brać nazwę z **`miasta_cywilizacji[0]`**. Uzasadnienie pilności: dziś
dotyczy dwóch cywilizacji, ale po planowanym rozdzieleniu list nazw
(`R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1`, ECHO: rozdzielić wszystkie ~126 pozycji)
dotknęłoby **wszystkich piętnastu** — naprawa teraz jest tańsza niż potem.

Sprawdź, czy ta sama pomyłka nie występuje przy nazywaniu **kolejnych** miast AI
(nie tylko stolicy) — jeśli tak, napraw i wypisz w raporcie; jeśli nie, napisz to wprost.

## ALLOWLISTA — ROZSZERZONA (ratyfikacja orkiestratora)

Do dotychczasowej dochodzą:
- `gra/tools/display-names-test.cjs` — zawiera asercję kodującą wprost odwracaną decyzję
  („mapa: stolica obcego państwa → nazwa cywilizacji, Neapol → Rzym"); zmierzone przez
  Evaluatora: **27/0 na bazie, 26/1 na gałęzi**. Przepisz tę jedną asercję na nowe
  zachowanie. **Nie „napraw" jej przez usunięcie** — ma nadal mierzyć, tylko to, co teraz
  jest prawdą.
- `gra/src/map/cluster-spawn.ts`
- `gra/src/game/city-names-pool.ts`
- `gra/src/game/civ-names.ts`

**`gra/data/city-names-pools.json` i `gra/data/civs.json` POZOSTAJĄ ZAKAZANE** — dane są
poprawne (audyt orkiestratora: wszystkie 15 cywilizacji mają komplet 100+10, pierwsze
miasta historycznie zasadne). Naprawa dotyczy tego, KTÓRĄ pulę czyta kod, nie zawartości pul.

`render/cityMapStatChip.ts` **pozostaje poza allowlistą** — po ECHO nie jest już potrzebny,
bo sama nazwa miasta mieści się w dotychczasowym budżecie (przed tematem 0/15 przyciętych).
Jeśli okaże się, że jednak nie, to jest `DECISION_REQUIRED`, nie samodzielne poszerzanie.

## KRYTERIA KOŃCA RUNDY 2

- [ ] `tsc --noEmit` zielone.
- [ ] `mapa-etykieta-stolicy-test.cjs` — 100% pass, asercje przepisane na nowe zachowanie.
- [ ] `display-names-test.cjs` — **27/0**, czyli parytet z bazą, z przepisaną asercją.
- [ ] Nowa/rozszerzona asercja: stolica AI Chińczyków nazywa się `Xi'an`, Słowian `Kijów`
      — nie `Qin` i nie `Kiev`. To jest sedno R2-2, musi być mierzone.
- [ ] **Zrzut żywego Chromium** obcej stolicy, obejrzany: nazwa miasta, korona, populacja,
      brak przycięcia. Porównaj z zrzutem rundy 1 (`dowody/`), gdzie widniało „QIN · CHIŃCZ…".
- [ ] Pomiar szerokości: ile z 15 stolic jest przyciętych po tej zmianie. Oczekiwane 0.
- [ ] 5 bramek referencyjnych i bramki nazw bez regresu.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy: cofnięcie się za daleko.** ECHO mówi „sama nazwa miasta" — to NIE znaczy
„przywróć stan sprzed tematu". Przed tematem była nazwa CYWILIZACJI. Teraz ma być nazwa
MIASTA. To trzeci, nowy stan, nie powrót do żadnego z dwóch poprzednich.

**Tryb drugi: naprawa R2-2 bez sprawdzenia, czy nazwa w ogóle dojdzie na ekran.**
R2-1 i R2-2 są sprzężone: dopiero po naprawie puli stolica Chińczyków MA nazwę miasta,
którą etykieta może pokazać. Zweryfikuj oba razem, na jednym zrzucie.

**Tryb trzeci: test przestaje mierzyć.** `display-names-test.cjs` ma po przepisaniu nadal
czerwienieć, gdy zachowanie się zmieni — pokaż to mutacją.

---

# RUNDA 3 — RATYFIKACJA ORKIESTRATORA (2026-09-04, noc)

Runda 2 zakończyła się `DECISION_REQUIRED` z dwoma zarzutami. **Oba trafiły do właściciela
i oba zostały rozstrzygnięte.** Poniższe jest wiążące i NIE podlega ponownej ocenie
przez Evaluatora — to decyzje właściciela, nie propozycje orkiestratora.

Praca rundy 2 (`1e87ec1c`) jest **UTRZYMANA w całości**. Runda 3 ją rozszerza, nie zastępuje.
Nie cofaj `foreignCapitalMapName` ani zmiany puli na `miasta_cywilizacji[0]`.

## R3-1 — POSZERZENIE BUDŻETU ETYKIETY (zarzut 1, ECHO: „Poszerzyć budżet etykiety")

Właściciel odrzucił przyjęcie 1/15 i odrzucił skracanie nazwy w puli. **Budżet szerokości
nazwy w `gra/src/render/cityMapStatChip.ts:769` ma zostać poszerzony tak, żeby wszystkie
15 pierwszych miast cywilizacji mieściło się bez wielokropka**, łącznie z zuluskim
`uMgungundlovu` (zmierzone 214 px przy `700 22px Georgia`).

**Ostrzeżenie orkiestratora, przedstawione właścicielowi PRZED decyzją i przez niego
przyjęte:** ta zmiana dotyka **wszystkich** etykiet na mapie, nie tylko zuluskiej, i niesie
ryzyko zachodzenia plakietki na sąsiednie heksy. Właściciel wybrał ten wariant świadomie.
**Dlatego runda 3 ma to ryzyko ZMIERZYĆ, a nie założyć, że go nie ma:**

- **Twardy warunek:** przy nowym budżecie plakietka **nie zachodzi na sąsiednie heksy**
  — udowodnione zrzutem z żywego Chromium, w układzie gęstym (stolica z sąsiadującymi
  miastami-państwami), nie na odosobnionym mieście.
- Jeśli okaże się, że nie da się spełnić jednocześnie „0/15 przycięć" i „brak zachodzenia
  na sąsiednie heksy" — **zatrzymaj się ze statusem `DECISION_REQUIRED`** i podaj zmierzoną
  granicę: przy ilu pikselach zaczyna się zachodzenie i ilu cywilizacjom to wystarcza.
  Nie wybieraj sam kompromisu.
- Kryterium dotyczy **15 pierwszych miast cywilizacji**. Dłuższe nazwy z dalszej części pul
  (112 z 1500 nazw przekracza dzisiejszy budżet) mogą nadal się przycinać — to jest
  poza zakresem i nie jest defektem.

## R3-2 — STOLICA GRACZA CZYTA WŁAŚCIWĄ PULĘ (zarzut 2, ECHO: „Naprawić teraz, w rundzie 3")

`playerCapitalFromPool` (`gra/src/game/city-names-pool.ts:75-77`) czyta `miasta_panstwa[0]`,
przez co gracz-Chińczyk startuje w mieście „Qin" — **dokładnie ta sama klasa pomyłki, którą
zgłosił właściciel dla AI**, tylko po jego własnej stronie. Ma czytać `miasta_cywilizacji[0]`,
symetrycznie do naprawionego w rundzie 2 `foreignCapitalFromPool`.

**Allowlista jest tym samym rozszerzona o bramkę utrwalającą stary stan.** Evaluator wskazał
asercję **E7**, która zapisuje dzisiejsze (błędne) zachowanie. Wolno ją zaktualizować —
ale **w raporcie wypisz dokładnie, którą asercję zmieniłeś, jaką miała wartość przed i po,
i dlaczego stara utrwalała defekt.** Cicha zmiana oczekiwań istniejącej bramki jest
niedopuszczalna i zostanie potraktowana jak ukrycie regresu.

Sprawdź przy okazji, czy naprawa nie tworzy **duplikatu nazw**: stolica gracza i stolica AI
tej samej cywilizacji nie mogą wylądować na tej samej nazwie w jednej partii.

## ALLOWLISTA RUNDY 3 (rozszerzenie, reszta bez zmian)

Dochodzą:
- `gra/src/render/cityMapStatChip.ts` (wyłącznie budżet szerokości nazwy, R3-1)
- bramka z asercją E7 — wyłącznie aktualizacja utrwalonej wartości, jawnie uzasadniona
- `gra/src/game/city-names-pool.ts` (już był w allowliście — `playerCapitalFromPool`)

Nadal zakazane bezwzględnie: `gra/src/main.ts`, pliki z sekretami, `docs/decyzje/**`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.

## KRYTERIA KOŃCA RUNDY 3

1. Pomiar przycięć: **0/15** przy nowym budżecie — pomiar w żywym Chromium, tą samą metodą
   co w rundzie 2 (`700 22px Georgia`), z liczbami przed i po.
2. Zrzut z żywego Chromium w układzie GĘSTYM dowodzący braku zachodzenia na sąsiednie heksy.
3. `playerCapitalFromPool` czyta `miasta_cywilizacji[0]`; bramka to asertuje, a asercja
   **czerwienieje po cofnięciu zmiany** (pokaż wynik po mutacji).
4. Brak duplikatu nazw stolica-gracza / stolica-AI tej samej cywilizacji.
5. `tsc --noEmit` zielone; `mapa-etykieta-stolicy-test.cjs`, `display-names-test.cjs`,
   `city-names-pool-test.cjs`, `city-names-pools-test.cjs`, `rozmiar-label` zielone.
6. Pięć bramek referencyjnych zielonych (logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6).
7. Bramki czerwone z potwierdzonym parytetem bazy z rundy 2 (`flaga-mp`,
   `miasta-panstwa-wylaczone`) mają zostać na tym samym poziomie — pogorszenie = regres.

---

# RUNDA 4 — RATYFIKACJA ORKIESTRATORA (2026-09-05)

## Uznanie błędu w zleceniu — kryterium 2 rundy 3 było NIEWYKONALNE

Zgłoszenie `decision-abc.md` jest **trafne i zostaje przyjęte w całości**. Warunek twardy
R3-1 („plakietka nie zachodzi na sąsiednie heksy") był postawiony przez orkiestratora
błędnie: pomiar 30 plakietek pokazał, że **nie spełnia go żadna konfiguracja — także stan
sprzed całego tematu**. Granica wypada przy ok. 4–5 wielkich literach; z 15 pierwszych miast
cywilizacji mieści się pod nią jedno (`Tyr`, 46,4 px). Nie istnieje wartość budżetu
spełniająca jednocześnie kryteria 1 i 2. **Operator postąpił prawidłowo, zatrzymując się
zamiast wybierać odczyt warunku (§14, C-054).**

**Kryterium 2 zostaje ZASTĄPIONE miarą, którą sam zaproponowałeś jako rozłączną:**
plakietka nie może kolidować z **plakietką sąsiedniego miasta**. Minimalny odstęp miast
w klastrze to 5 heksów = 8,66 j. (`clusters.ts`, `CLUSTER_CITY_STATE_MIN_HEX`), najszersza
zmierzona plakietka ma 4,04 j. — **0/30 kolizji**. To jest realne ryzyko czytelności;
zachodzenie na pusty heks nim nie jest.

## R4-1 — BAZA 305 (ECHO właściciela: „Baza 305 — domknąć także stolicę gracza")

Sprawa poboczna zgłoszenia rozstrzygnięta: **domykamy również własną stolicę gracza**,
która ma trzeci slot (WZROST%) i przy bazie 260 nadal przycina `uMgungundlovu`.

- Baza szerokości nazwy: **≈305 px**, wartość dobrana pomiarem tak, by dać **0/15 przycięć
  we WSZYSTKICH trzech konfiguracjach**: stolica obca bez glifu produkcji, z glifem,
  oraz własna stolica gracza z WZROST%.
- Sufit techniczny (`BADGE_MAX_TOTAL_SCALE` wobec gwarantowanego w WebGL2
  `MAX_TEXTURE_SIZE = 2048`) przepuszcza bazę do ≈369 — **potwierdź to własnym rachunkiem
  i podaj margines**, jaki zostaje przy wybranej wartości.
- **Koszt zaakceptowany jawnie przez właściciela:** każda długa etykieta na mapie rośnie
  o kolejne ~45 px względem bazy 260. To jest cena domknięcia stolicy gracza.

## KRYTERIA KOŃCA RUNDY 4

1. **0/15 przycięć w trzech konfiguracjach** — pomiar w żywym Chromium, tą samą metodą
   co w rundach 2–3 (`700 22px Georgia`), z liczbami przed i po dla każdej konfiguracji.
2. **0 kolizji plakietka↔plakietka** przy minimalnym odstępie miast (5 heksów) — pomiar
   liczbowy, nie ogląd. Kryterium „brak zachodzenia na sąsiednie heksy" **NIE OBOWIĄZUJE**
   i jego niespełnienie nie jest defektem.
3. Zrzut z żywego Chromium w układzie gęstym, obejmujący stolicę gracza z trzema slotami.
4. Margines do sufitu tekstury podany liczbowo.
5. Praca rund 2–3 UTRZYMANA: `foreignCapitalMapName`, pula `miasta_cywilizacji[0]` dla
   stolic AI oraz `playerCapitalFromPool` z R3-2 — nie cofać.
6. `tsc --noEmit` zielone; bramki tematu, `city-names-pool`, `city-names-pools`,
   `rozmiar-label` zielone; pięć bramek referencyjnych zielonych (logic 213/213,
   tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6).
7. Bramki czerwone z potwierdzonym parytetem bazy (`flaga-mp`, `miasta-panstwa-wylaczone`)
   na tym samym poziomie co w rundzie 3 — pogorszenie = regres.

## ALLOWLISTA RUNDY 4

Bez zmian wobec rundy 3 (`cityMapStatChip.ts` już w niej jest — zmienia się tylko wartość).

## UWAGA PROCESOWA

Poprzedni przebieg rundy 3 został przerwany **restartem kontenera**, nie błędem. Praca rundy 3
jest zacommitowana (`bbe93e30` + `f2e85157`) i kompletna. **Raporty etapów commituj od razu
po zapisaniu**, nie zostawiaj ich w pamięci procesu — tak przepadł raport Evaluatora
w temacie równoległym.
