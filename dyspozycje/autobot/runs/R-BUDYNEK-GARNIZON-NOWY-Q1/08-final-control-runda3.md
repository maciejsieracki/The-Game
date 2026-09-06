# R-BUDYNEK-GARNIZON-NOWY-Q1 — Final Control, werdykt końcowy (rundy 1+2+3)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-BUDYNEK-GARNIZON-NOWY-Q1
GOAL: Nowy budynek Garnizon — kompletny, na równi z każdym innym budynkiem w grze (bez wpinania do Prawa i bez obrony cywilnej).
MODEL+EFFORT: Opus 5, effort high.
ZMIANY-COMMIT: zero zmian w `gra/` i `docs/` — Final Control orzeka, nie modyfikuje. Artefakty: ten raport + dopisana sekcja FC w `decision-abc.md`. Drzewo czyste przed pracą i po niej; `ff81dce5` potwierdzone `git merge-base --is-ancestor` jako przodek HEAD (`bb9c4984`). Cały temat = 23 pliki (`c326f8ea^..HEAD`), wszystkie w allowliście rund 1–3; `gra/data/buildings.json` 42 wstawienia / 0 usunięć (sam nowy rekord).
TESTY: wyłącznie własne uruchomienia. `budynek-garnizon-test` **83/0** · `civpedia-budynki-historia-test` **141/0** · `grupy-budynkow-test` **84/0** · `tsc --noEmit` exit 0 · pięć referencyjnych: logic 213/213, tech-tree 19/0, research 33/0, unit-replace 13/0, combat 6/6 · rodzina budynków: `plony-budynkow` 68/0, `building-tech-gate` 89/0, `building-happiness` 8/0, `prereq-budynkow` **51/8**, `upgrade-budynki` **48/1** (oba czerwone niezależnie od tematu — dowód niżej, W-FC3) · **siedem własnych mutacji FC1–FC7**, każda cofnięta KOPIĄ pliku, `git diff --quiet` czysto po każdej, md5 `wikiBundle.json` == HEAD.
BLOKADY: (a) **[OTWARTA od rundy 1, DO DECYZJI]** kolejność deployu wobec `R-PRAWO-PRZEBUDOWA-SKALI-Q1`; (b) [OTWARTA od rundy 1] kolizja nazewnicza `prawo_garnizon*` / `society-breakdown.ts:638-647`; (c) [orkiestrator] temat **nieobecny** w `REJESTR-PROSB-I-ZADAN.md` (0 trafień) — §16b pkt 6 nie przechodzi, warunek przed `READY_FOR_DEPLOY`; (d) [procesowa] worktree dzielony przez role (§2b).
RUNDY: 3/5
NASTĘPNY KROK: odpowiedź właściciela na W-FC4 (kolejność wydania). Temat **nie wraca do Operatora** — praca stoi gotowa do integracji.
DEPLOY/PUSH: NIE WYKONANO

## WERDYKTY

| # | Pozycja | Werdykt |
|---|---|---|
| 1 | NAPRAW #2 — regres `civpedia-budynki-historia` 136/0 → 138/3 | **ODDAL** (domknięty) |
| 2 | NAPRAW #3 — zgubione blokady w polu BLOKADY | **ODDAL** (domknięty) |
| 3 | NAPRAW #5 — brak `decision-abc.md` | **ODDAL** (plik jest; część rejestrowa → blokada (c)) |
| 4 | NAPRAW W2 — kłamliwa etykieta `[AI3]` | **ODDAL** (domknięty) |
| 5 | NAPRAW W3 — brak Obrony | **ODDAL** (lista zarzutów rundy 3 pusta; §16b pkt 3 sprawdzony treścią, nie deklaracją) |
| 6 | Zamrożenie liczb właściciela | **ODDAL** |
| 7 | Kompletność Garnizonu wobec sąsiadów | **ODDAL** |
| W-FC1 | Etykieta `[CP3]` „REALNY klik… otworzył panel" — handler dopina MOST TESTOWY | **ODDAL** |
| W-FC2 | Temat nieobecny w rejestrze (§16b pkt 6) | **ODDAL wobec Operatora** — jawny warunek integracji po stronie orkiestratora, blokada (c), **nie ukryty w ODDAL** |
| W-FC3 | `prereq-budynkow` 51/8 i `upgrade-budynki` 48/1 — czerwone, niezgłoszone przez żadną rundę | **ODDAL** (pre-istniejące, dowód FC7) + rejestracja osobnym tematem (§16b pkt 4) |
| W-FC4 | Kolejność wydania: Garnizon przed tematem Prawa = dla gracza czysty koszt | **DO DECYZJI CZŁOWIEKA** |
| W-FC5 | Kolizja `prawo_garnizon*` — ostrzeżenie wejściowe dla tematu Prawa | **ODDAL** (zarejestrowana, poza allowlistą) |

**Agregat (§3c pkt 3, §16b pkt 8): zero `NAPRAW`, jeden `DO DECYZJI CZŁOWIEKA` → `DECISION_REQUIRED`.**

## Siedem własnych mutacji — liczby faili

| # | Mutacja | Bramka | Wynik |
|---|---|---|---|
| FC1 | `garnizon.kosztBudowy` 30 → 31 | budynek-garnizon | 83/0 → **82/1** (`[R2-A] kosztBudowy`) |
| FC2 | `garnizon.historia` podmieniona na inny tekst | civpedia-historia | 141/0 → **140/1** (md vs buildings.json) |
| FC3 | usunięta linia `'garnizon'` z `infraOrder` | budynek-garnizon | → **82/1** (`[AI3]`, parser realnego źródła) |
| FC4 | skasowany `docs/encyklopedia/budynki/akademia.md` (docs 25 vs bundle 26) | civpedia-historia | → **135/1** (kierunek „w dół", nietestowany wcześniej) |
| FC5 | `historia` wpisu `budynki/akademia` w bundlu wyzerowana | civpedia-historia | → **139/2** (+ żywy DOM) |
| FC6 | usunięte hasło `budynki/garnizon` z bundla | budynek-garnizon | → **71/7** (`[W4]`, `[R3-E1]`, `[CP3]`–`[CP6b]`) |
| FC7 | **usunięty cały rekord `garnizon`** z `buildings.json` | temat / grupy / prereq / upgrade | temat: twardy wyjątek · grupy 84/0 → **81/3** · prereq **51/8 bez zmian** · upgrade **48/1 bez zmian** |

FC4 domyka lukę po E1 Evaluatora (tamten testował tylko przyrost katalogu). FC7 jest jednocześnie dowodem, że dwa czerwone testy rodziny **nie mają związku z tematem**: identyczne liczby z rekordem i bez niego.

## Cztery pytania

**1. Trzy `NAPRAW` domknięte?** TAK, każde sprawdzone własnym uruchomieniem/odczytem.
(#2) `civpedia-budynki-historia` u mnie **141/0**; `git diff ff81dce5..HEAD` tej bramki nie zawiera **ani jednego** usuniętego `check(` — trzy zaszyte `25` zastąpione porównaniem dwóch **różnych** artefaktów (`budynkiEntries.length === files.length`) i predykatem treściowym; jedyna liczba na sztywno to dolna granica `BATCH_MIN = 25`, nie licznik. Nietautologiczność potwierdzona FC4 i FC5, w obie strony.
(#3) Pole BLOKADY raportu rundy 3 niesie **obie** blokady rundy 1 dosłownie, z nazwami plików i linii.
(#5) `decision-abc.md` istnieje, ma trzy pytania rundy 1 z odpowiedziami właściciela i jawną notę C-058 o retroaktywności. **Część rejestrowa NIEDOMKNIĘTA:** `grep -c R-BUDYNEK-GARNIZON-NOWY-Q1` w `REJESTR-PROSB-I-ZADAN.md` = **0** (i 0 w `PYTANIA-OTWARTE.md`). R3-C przypisało ten wpis orkiestratorowi, więc nie jest to `NAPRAW` dla Operatora — ale §16b pkt 6 nadal nie przechodzi i wpisuję to jako jawny warunek przed integracją, a nie jako uwagę schowaną w `ODDAL`.

**2. Czy `[AI3]` mówi prawdę?** TAK — odczyt własny. `if (opts.defensiveCopy) {` w `gra/src/game/ai.ts:1455`; kolejne wystąpienie tego warunku dopiero w :2539, a `const infraOrder = [` stoi w **:1472** — czyli bezspornie wewnątrz gałęzi z :1455. `defensiveCopy` ma w całym `gra/src` dokładnie dwa przypisania: `main.ts:30032` i `:30150`, oba `typCityCopyOwners.has(ownerId)`, a `typCityCopyOwners` to zbiór **państw-miast** (komentarz `main.ts:7232`, „miasta-państwa … kopie obronne"). Cywilizacje AI wybierają budynki z osobnych, ręcznych `candidates.push` (`ai.ts:1328–1425`) i Garnizonu tam nie ma — dokładnie tak, jak mówi dziś etykieta. Dawne „bez tego AI nigdy go nie zbuduje" wycięte.

**3. Liczby właściciela nietknięte i zamrożone?** TAK. `git diff dc355979..HEAD -- gra/data/buildings.json` **pusty**; w całym temacie ten plik ma 42 wstawienia / 0 usunięć. Zamrożenie sprawdzone mutacją, nie lekturą: **FC1** (`kosztBudowy` 30 → 31) czerwieni **`budynek-garnizon-test`, 83/0 → 82/1**, na asercji `[R2-A] garnizon.kosztBudowy === 30`. Komplet `30 / 6 / 2 / 1 / drewno 30 / maksPoziom 1` ma siedem osobnych asercji `[R2-A]`.

**4. Czy Garnizon jest KOMPLETNY na równi z sąsiadami?** TAK. Przeszedłem po każdym miejscu, w którym żyją `dom_starszyzny` / `dwor_zarzadcy` / `trybunal`, i porównałem plik po pliku:

| Miejsce | Garnizon | Sąsiedzi |
|---|---|---|
| `buildings.json` (komplet 18 wspólnych pól, `historia`, `grupa`, `upgradeFrom` puste) | jest (`[A2]`, `[K]`, `[U]`) | jest |
| Ikona `bld-garnizon.svg` + wpis w `building-icon-map.json` | **własny SVG + własny wpis** | `dom_starszyzny`/`dwor_zarzadcy` → `bld-palac`; `trybunal` **bez wpisu** |
| Karta encji (nazwa, koszt, utrzymanie, rys historyczny, medalion ikony) | jest (`[E1]`–`[E5]`, `[I4]`) | jest |
| Produkcja / katalog epoki / kolejka „Dostępne do budowy" (żywy DOM) | jest (`[D1]`–`[D4]`) | jest |
| Grupa panelu „Prawo i administracja" | jest (`[K]`, grupy 84/0) | jest |
| Hasło CivPedii w `wikiBundle.json`, niepuste, bez wypełniacza | **jest** (`[W1]`–`[W7]`, `[R3-E1..E3]`) | **żaden z trzech nie ma** |
| Lista budowy państw-miast (`infraOrder`) | jest | `dom_starszyzny` 1×; `dwor_zarzadcy` i `trybunal` **0×** (`ai.ts` ich nie zna) |

**Jedyne miejsca, których Garnizonowi brakuje, a sąsiedzi je mają, to `hasDomStarszyzny`/`hasDworZarzadcy`/`hasTrybunal` w `main.ts:29206-29209`, `cityPanel.ts:3092-3095` i linie `prawo_*` w `society-breakdown.ts:651-664` — czyli WPIĘCIE DO PRAWA, jawnie wyłączone z GOAL tego tematu i z allowlisty.** To nie jest brak kompletności, to granica zakresu. Tryb „budynek-widmo" wykluczony mutacją FC7 i FC6: bez rekordu bramka pada twardo, bez hasła CivPedii czerwienieje aż do żywego DOM.

## Dlaczego W-FC1 to `ODDAL`, a nie druga edycja `[CP3]`

Etykieta `[CP3]` mówi „REALNY klik w przycisk karty otworzył panel CivPedii" i jest **prawdziwa co do słowa** (Playwright klika realny przycisk, realny `wikiHubHud` otwiera realne hasło), ale handler dopina sam test — w grze przycisk jest martwy dla wszystkich 42 budynków. Różnica wobec `[AI3]`, które słusznie dostało `NAPRAW`: tamta etykieta twierdziła rzecz **fałszywą**, bez żadnego zastrzeżenia w pobliżu. Tutaj 18-linijkowy komentarz bezpośrednio nad kodem mówi wprost „NIE DOWODZONE: że robi to sam KLIK gracza", a sam zrzut dowodowy nosi wypaloną adnotację „MOST KLIK→PANEL DOKŁADA TEN TEST, NIE GRA". Ryzyko cytowania samej linii bez kontekstu istnieje — przekazuję je jako wejście do tematu rodziny kart, nie jako defekt tego wytworu.

## DO DECYZJI CZŁOWIEKA (W-FC4)

**Kolejność wydania.** Garnizon wypuszczony przed `R-PRAWO-PRZEBUDOWA-SKALI-Q1` jest dla gracza **czystym kosztem**: 60 pkt Pracy + 60 Drewna jednorazowo, 4 Pieniądza i −5 Drewna na turę, przy `baza`/`przyrost` w całości zerowych i pustej sekcji „Efekty" na karcie. Blokada zgłoszona w rundzie 1, przyjęta, przenoszona przez rundy 2 i 3 — i **nadal bez odpowiedzi**; ratyfikacja rundy 3 rozstrzygnęła trzy inne pozycje „DO DECYZJI", tej nie. Pytanie: Garnizon wchodzi do `main`/na ROBOCZĄ **przed** tematem Prawa (świadomie, jako pusty jeszcze budynek), czy czeka i wychodzi razem z nim?

Poza tym pytaniem cała praca stoi gotowa do integracji: bramki zielone z moich uruchomień, diff w allowliście, liczby właściciela zamrożone, `tsc` zielony.

## Obserwacje

- **W-FC3.** `prereq-budynkow-test` **51/8** (akademia/fort/swiatynia/baszta/akwedukt/laznia/akademia_wojskowa `status=locked` mimo spełnionego prereq; Mennica) i `upgrade-budynki-test` **48/1** („no handel bonus on bruk") są czerwone **także po usunięciu rekordu `garnizon`** (FC7 — te same liczby). Dług zastany, nie regres tematu; żaden raport trzech rund go nie wymienił, mimo że kryterium 5 rundy 1 kazało uruchomić całą rodzinę. Kandydat na osobny temat.
- Wpis do `REJESTR-PROSB-I-ZADAN.md` nadal nie istnieje — blokada (c).
- Trzy niespójności R2-E (brak wpisu `trybunal` w mapie ikon, `bld-pretorium.svg` vs mapa, `civpedia-gra-id-mostek-test` brudzący śledzony plik) potwierdzone i nietknięte.
- `civpedia-gra-id-mostek-test.cjs` **nie uruchamiany**. md5 `gra/src/data/wikiBundle.json` po całej mojej pracy = md5 wersji z `HEAD`.
- Mutacje cofane wyłącznie KOPIĄ pliku ze scratchu, nigdy `git checkout`; `git status --short` pusty po każdej i na koniec.

**Nota §11:** limit ~400 słów przekroczony świadomie. Prompt zamawia osobno werdykt per pozycja z dowodem z wytworu, cztery rozbudowane odpowiedzi i tabelę **minimum pięciu** własnych mutacji z liczbami faili. Kontrakt, blokady i agregat są skondensowane. Nie integruję, nie wystawiam `READY_FOR_DEPLOY`.
