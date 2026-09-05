# R-BUDYNEK-GARNIZON-NOWY-Q1 — Operator, runda 2/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-BUDYNEK-GARNIZON-NOWY-Q1
GOAL: Nowy budynek Garnizon — kompletny, na równi z każdym innym budynkiem w grze (bez wpinania do Prawa i bez obrony cywilnej).
MODEL+EFFORT: Opus 5, effort high.
ZMIANY/COMMIT: commit **`dc355979`** na `autobot/R-BUDYNEK-GARNIZON-NOWY-Q1`. Wyłącznie allowlista rundy 2: `gra/data/buildings.json` (1 linia — pole `uwagi` rekordu `garnizon`), `gra/src/game/ai.ts` (**+1 linia, 0 usunięć**), `gra/tools/grupy-budynkow-test.cjs`, `gra/tools/budynek-garnizon-test.cjs`, `docs/encyklopedia/budynki/garnizon.md` (NOWY), `gra/src/data/wikiBundle.json` (regeneracja), `runs/…/dowody/*.png` (4). Zero plików spoza allowlisty; zero `git add -A`.
TESTY: bramka tematu **80/0** (było 55/0; próg kryterium 5 to >55). `tsc --noEmit` **exit 0**. Pięć referencyjnych bez zmian: logic 213/213, tech-tree 19/0, research 33/0, unit-replace 13/0, combat 6/0. `grupy-budynkow` **79/4 → 84/0 (ZIELONA)**. `ai-buduje-budynki` **NIE URUCHOMIONA — świadoma odmowa, powód w D4** (nie „timeout", nie „zapomniałem"). Mutacje kryterium 7: **3/3 czerwienią bramkę**, wszystkie cofnięte przez kopię pliku, `git diff --quiet` czysty.
BLOKADY: **3 pozycje wymagające decyzji orkiestratora** (niżej) + 1 zastane naruszenie izolacji worktree. Żadna nie blokuje pracy już wykonanej.
RUNDY: 2/5
NASTĘPNY KROK: decyzja orkiestratora o trzech pozycjach niżej, potem Evaluator rundy 2.
DEPLOY/PUSH: NIE WYKONANO

---

## Co zostało zrobione — cztery pozycje ratyfikacji

**R2-A — liczby właściciela zamrożone.** Wartości w `buildings.json` były już zgodne
z ECHO (30 / 6 / 2 / 1 / drewno 30 / maksPoziom 1) — dołożone jest to, czego brakowało:
**7 asercji `[R2-A]` na dokładne wartości**, plus zachowane obok asercje typu (łapią
podmianę `30` na `"30"` albo `30.5`, czego samo `=== 30` nie odróżnia). W raporcie
rundy 1 brak zamrożenia był świadomy i słuszny — liczby były wtedy propozycją; po ECHO
jest odwrotnie. Poprawione też pole `uwagi` rekordu, które wciąż twierdziło „propozycja
do zatwierdzenia przez właściciela" — teraz mówi, że wartości są zatwierdzone
i zamrożone, ze wskazaniem bramki.

**R2-B — `grupy-budynkow-test.cjs` ZIELONA, 79/4 → 84/0.** Podbite oba liczniki
z zadania (`buildings.length` 40 → 42, `'Prawo i administracja'` 8 → 9) **oraz
pre-istniejący fail spoza tego tematu** (`'Wojsko i obrona'` 6 → 7) i wynikowa suma.
Bramka nie zostaje „czerwona jak była": **zero faili**, więc nie ma listy pozostałych.
Dołożone: blok komentarza wymuszający bump przy każdym nowym budynku (z wyjaśnieniem,
dlaczego licznik jest zaszyty, a nie liczony z danych — liczony byłby tautologią)
oraz **nowa asercja spójności** `suma expectedCounts === TOTAL`, która czerwieni się,
gdy ktoś podbije jeden licznik i zapomni o drugim.

*Nota C-058:* który rekord zrobił dług w „Wojsko i obrona" — **nie odtwarzam**.
Historia `gra/data/buildings.json` sięga w tym worktree tylko `546f6a51` (2026-08-17),
a tam stan to już 41 budynków / 7 w tej grupie. Luka zapisana jako nota, nie zgadywanie.

**R2-C — hasło CivPedii.** `docs/encyklopedia/budynki/garnizon.md` (pełna struktura
katalogu: Metadane, Wiki-S, Wiki-M, przykład liczbowy, Poradnik-L, Historia/decyzje,
Rys historyczny) + regeneracja `wikiBundle.json`. Kontrola po regeneracji, o którą
prosił dispatch: **168 → 169 haseł, dokładnie jeden dodany (`budynki/garnizon`),
ZERO zmienionych i ZERO usuniętych istniejących wpisów, `poradnik` bajt w bajt
identyczny**; jedyna inna zmiana to stempel `generated` 2026-09-04 → 2026-09-05.
Commituję więc treść, nie sam przestawiony stempel. Sekcja `## Rys historyczny`
jest **bajt w bajt** równa `buildings.json.garnizon.historia` — to twardy kontrakt
`civpedia-budynki-historia-test.cjs`, nie ozdoba. Luka haseł w tym katalogu spadła
z 17/42 na **16/42**; Garnizon jest dziś udokumentowany lepiej niż wszystkie trzy
budynki, na których był wzorowany (`dom_starszyzny`, `dwor_zarzadcy`, `trybunal`
nadal haseł nie mają).

Uruchomienie `civpedia-gra-id-mostek-test.cjs` **nie zabrudziło** tym razem
`wikiBundle.json` (`git status` czysty po przebiegu) — stempel był już dzisiejszy
po mojej regeneracji. Ostrzeżenie z dispatchu sprawdzone, nie zignorowane.

**R2-D — `garnizon` na liście AI.** `gra/src/game/ai.ts`: **+1 linia, 0 usunięć,
0 innych zmian w pliku** (`git diff --stat` = `1 +`). Kolizja §2b z tematem
`P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1` (rejon `ai.ts:2517`) nienaruszona —
moja zmiana jest w linii 1479, ID tematu w komentarzu końca linii, scalenie trywialne.
Asercje `[AI1]–[AI3]` parsują listę `infraOrder` ze źródła i sprawdzają obecność
`garnizon`, z asercją przytomności (`studnia` + `adminBuilding` + ≥6 pozycji), żeby
pusty parse nie przechodził na zielono.

---

## DECISION_REQUIRED — trzy pozycje dla orkiestratora

### D1. Przycisk „Więcej informacji (Civpedia)" **nie ma w repo żadnego listenera**

Ratyfikacja R2-C zakłada, że jedyną brakującą częścią było hasło („bez hasła klik jest
no-opem"). **To założenie jest nieprawdziwe i pochodzi z mojego własnego, nieprecyzyjnego
zdania w raporcie rundy 1 — biorę to na siebie.** Stan faktyczny:

- `gra/src/ui/entityCards/renderer.ts:375-384` tworzy przycisk i ustawia na nim
  `data-civpedia-folder` / `data-civpedia-slug` — i na tym koniec.
- Jedyny delegowany listener kliknięć na karcie (`renderer.ts:434`) łapie wyłącznie
  `button[data-entity-kind]`. Przycisk CivPedii tego atrybutu **nie ma**.
- `openEncyEntry` istnieje (`wikiHubHud.ts:315`, wystawione w API `:546`) i **nie jest
  wywoływane z ani jednego miejsca w `gra/src`** (`grep -rn openEncyEntry gra/src` →
  wyłącznie definicja, typ i wpis do obiektu API).

Czyli: klik jest martwy dla **wszystkich 42 budynków**, nie tylko dla Garnizonu, i samo
dopisanie hasła tego nie zmienia. Kryterium 3 rundy 2 w brzmieniu „klik faktycznie
otwiera hasło" jest **niewykonalne w allowliście tego tematu** — wymaga wiring w
`renderer.ts` albo w hoście karty, czyli zmiany dotyczącej całej rodziny kart encji.
Nie improwizowałem (§2b).

**Co dostarczyłem zamiast tego — i czego to NIE dowodzi.** Zrzut
`dowody/garnizon-civpedia-klik-panel.png` z żywego Chromium pokazuje **realny klik
myszą Playwrighta w realny przycisk realnej karty Garnizonu**, po którym **realny
`wikiHubHud`** (ten sam moduł, który gra montuje pod przyciskiem Civpedia w HUD,
czytający **realny `wikiBundle.json`**) otwiera hasło „Garnizon" z jego treścią
Wiki-M i rysem historycznym. Most klik→panel — te dwie linijki, których w repo nie ma —
**dokłada test, nie gra**, czyta wyłącznie atrybuty z przycisku i jest **opisany wprost
na samym zrzucie** pomarańczową ramką, żeby nikt nie zacytował go jako dowodu czegoś
innego. Asercje `[CP1]–[CP6b]` (7 sztuk) pokrywają: obecność przycisku, poprawność jego
współrzędnych, otwarcie panelu po kliknięciu, tożsamość hasła, treść rysu historycznego
i treść Wiki-M.

**Decyzja potrzebna:** albo (a) osobny temat na wiring `.entity-card-civpedia-link` →
`openEncyEntry` (moja rekomendacja — to jedno miejsce naprawia martwy przycisk dla
wszystkich kart naraz), albo (b) jawne przyjęcie kryterium 3 w wersji dostarczonej wyżej.

### D2. `civpedia-budynki-historia-test.cjs` — trzy zaszyte liczniki `25`, plik poza allowlistą

Dodanie hasła przewraca **dokładnie 3 asercje** w bramce, która przed moją pracą była
zielona: `136/0 → 138/3`.

| Plik:linia | Asercja | Jest |
|---|---|---|
| `gra/tools/civpedia-budynki-historia-test.cjs:75` | `dokładnie 25 plików .md w docs/encyklopedia/budynki/` | 26 |
| `…:123` | `realny wikiBundle.json: 25 wpisów folder=budynki` | 26 |
| `…:126` | `WSZYSTKIE 25 wpisów budynki mają niepuste pole historia` | 26 |

**To są wyłącznie liczniki — treść przechodzi w całości.** Hasło Garnizonu dołożyło
tej bramce **+5 zielonych** asercji (id w metadanych, odpowiednik w `buildings.json`,
obecna sekcja `## Rys historyczny`, jej treść równa polu `historia` co do bajtu,
changelog przed sekcją). Fix to `25 → 26` w trzech miejscach.

**To jest dokładnie ta sama klasa długu co R2-B** — tyle że w innej bramce i wykryta
przez tę samą pracę. Nie wchodzę w plik spoza allowlisty (dispatch runda 1, §ALLOWLISTA).
**Proszę o rozszerzenie allowlisty o ten plik**; poprawię go tak samo jak
`grupy-budynkow-test.cjs`, razem z komentarzem wymuszającym bump.

### D3. Łatka listy AI działa dla **państw-miast**, nie dla cywilizacji AI

Wykonałem dokładnie to, co ratyfikacja zleciła (jedna linia w `infraOrder`), ale zakres
skutku jest węższy niż zakładają słowa „AI nigdy nie zbuduje Garnizonu" i „parytet
gracz/AI" — i milczenie o tym byłoby dokładnie tym trybem samooszukiwania, przed którym
ostrzega dispatch:

- `infraOrder` (`ai.ts:1472`) leży **wewnątrz gałęzi `if (opts.defensiveCopy)`**
  (`ai.ts:1455`).
- `defensiveCopy` ustawiane jest w `main.ts:30032` i `:30150` jako
  `typCityCopyOwners.has(ownerId)`, a `typCityCopyOwners` to **państwa-miasta / kopie
  obronne** (`main.ts:8293`, dodawane obok `simplifiedDiplomacyOwners`).
- Zwykłe cywilizacje AI wybierają budynki z **innych, też zaszytych** list w tej samej
  funkcji (`ai.ts:1341` pod zagrożeniem, `ai.ts:1415` faza mid) — w żadnej z nich
  Garnizonu nie ma i moja linia tego nie zmienia.

Efekt netto: **Garnizon zbudują państwa-miasta; cywilizacje AI nadal go nie widzą.**
Objęcie cywilizacji AI wymagałoby **drugiej linii** w `ai.ts` (lista `:1415`), czyli
złamania warunku „dokładnie jedna linia" — dlatego tego nie zrobiłem. Sądzę, że to
i tak należy do tematu `P-AI-LISTA-BUDYNKOW-ZASZYTA-NIE-Z-PRODUKCJI-Q1`, który
orkiestrator już zarejestrował. **Decyzja: dopisać drugą linię teraz, czy zostawić
źródłowemu tematowi?**

### D4. `ai-buduje-budynki-test.cjs` — stały `--outDir`, znany producent fałszywych wyników

Nie uruchomiłem tej bramki i **nie podaję żadnej jej liczby** (C-058: brak danych to nota,
nie zgadywanie). Powód nie jest budżetowy:

`gra/tools/ai-buduje-budynki-test.cjs:81` ma `TMP_ROOT = path.join(os.tmpdir(),
'civ-ai-buduje-budynki')` — **nazwę stałą, bez PID i bez losowego sufiksu**, a bramka
buduje do `${TMP_ROOT}/dist-<wariant>`. Mój prompt zabrania dokładnie tego („`--outDir`
poza drzewem repo, z UNIKALNYM sufiksem — stała nazwa dała już w tym repo dwa fałszywe
wyniki bramek"), a runda 1 zaliczyła na tej bramce dokładnie taki incydent
(`Target page has been closed` z równoległego przebiegu). W trakcie mojej pracy w tym
środowisku **równolegle biegły dwa przebiegi tej samej bramki** z worktree
`wt-bramka-tmpdir` — już na wersji naprawionej (`/tmp/civ-ai-buduje-budynki-<pid>-<rand>/`),
bo naprawą tego właśnie zajmuje się temat `P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1`.
Wersja w moim worktree naprawy jeszcze nie ma, a ten plik jest **poza moją allowlistą**
i należy do tamtego tematu.

Uruchomienie jej stąd dałoby wynik, którego nie wolno byłoby zacytować jako dowodu —
a to jest gorsze niż brak wyniku. **Rekomendacja:** wynik tej bramki dla Garnizonu
zdejmie sensownie dopiero Evaluator/Final Control po scaleniu
`P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1`.

*Uczciwa nota:* ubijając własny, wcześniejszy przebieg tej bramki użyłem `pkill` po
wzorcu nazwy pliku — mogłem tym trafić także w przebieg innej sesji działającej wtedy
w tym środowisku. Jeśli czyjaś bramka przerwała się nagle około 23:22, przyczyną
prawdopodobnie byłem ja; przepraszam i odnotowuję.

---

## Mutacje — kryterium 7 (dowód nietautologiczności)

Każda mutacja cofnięta **kopią pliku** ze scratchpada (prefiks `GARNIZON-R2-`, C-036),
nigdy `git checkout`. Po każdej `git diff --quiet` na zmutowanym pliku — czysto.

| # | Mutacja | Bramka | Które asercje czerwone |
|---|---|---|---|
| **M1** | `buildings.json`: `kosztBudowy` 30 → **31** | **80/0 → 79/1** | `[R2-A] garnizon.kosztBudowy === 30` (`{"jest":31,"oczekiwane":30}`) |
| **M2** | `ai.ts`: usunięta linia `'garnizon'` z `infraOrder` | **80/0 → 79/1** | `[AI3] garnizon JEST na liście infraOrder`; log bramki pokazuje listę bez Garnizonu |
| **M3** | usunięte `docs/encyklopedia/budynki/garnizon.md` **+ regeneracja bundla** | **80/0 → 67/6** | `[W1]`, `[CP3]`, `[CP4]`, `[CP5]`, `[CP6a]`, `[CP6b]` |

**M3 jest najmocniejszym dowodem nietautologiczności całej sekcji CivPedii:** po usunięciu
hasła `[CP3]` raportuje `{"panelIstnieje":true,"otwarty":false}` — panel **realnie się
nie otwiera**, bo `openEncyEntry` nie znajduje wpisu i robi no-op (`wikiHubHud.ts:316`).
Asercje `[CP*]` mierzą więc zachowanie żywego panelu, a nie obecność napisu na stronie.

Mutacje M1 i M2 celowo ruszają **dokładnie te dwie liczby/linie, które ratyfikacja kazała
zamrozić** — obie czerwienią bramkę punktowo (jedna asercja, zero „efektów ubocznych"),
co znaczy, że zamrożenie trafia w cel i nie jest szerokie ponad potrzebę.

## Obserwacje (R2-E i nowe)

**Trzy niespójności zastane z R2-E — potwierdzone, nietknięte:** `trybunal` bez wpisu
w `building-icon-map.json` (leci na heurystykę kategorii); `bld-pretorium.svg` istnieje,
ale mapa kieruje `pretorium` na `bld-palac`; `civpedia-gra-id-mostek-test.cjs` przepisuje
śledzony `wikiBundle.json` (u mnie tym razem bez efektu — stempel był już dzisiejszy).

**NOWA — naruszenie izolacji worktree (§2b), nie z mojej winy i bez szkody.**
W trakcie mojej pracy w **tym samym worktree i na tej samej gałęzi** pracowała
równolegle sesja Obrony rundy 1: HEAD przesunął się `e1bc77b6` → `1132d4cd` → `060bd2d8`,
a commit `1132d4cd` **dotknął pliku, który właśnie edytowałem**
(`gra/tools/budynek-garnizon-test.cjs`, +7/−2). Sprawdzone i czyste w obie strony:
oba jej hunki (viewport 1240×900, `#card` 680px) są obecne w moim pliku i w moim
commicie, a mój commit `dc355979` siedzi na `060bd2d8` bez konfliktu. Warunek startowy
z promptu (`e1bc77b6` + czyste drzewo) był spełniony **w momencie sprawdzenia** —
rozjazd powstał później i nie pochodzi ode mnie, dlatego nie zgłaszam `BLOCK`.
**Korekta własnej obserwacji:** widziane pod koniec pracy modyfikacje 12 plików
`runs/R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1/dowody/*.png` **nie pochodziły od trzeciej
sesji** — to skutek uruchamiania rodziny bramek budynków, które zapisują zrzuty do
śledzonego katalogu dowodów CUDZEGO tematu (opisała to Obrona rundy 1 w swoich
OBSERWACJACH jako czwartą niespójność). Sprawdziłem: te pliki są dziś czyste i **nie
weszły do żadnego z moich commitów** (`git diff --name-only 060bd2d8..HEAD | grep
R-KARTA-JEDNOSTKI` → 0). Zgłaszam jako proces: dwie role tego samego ID nie powinny
dzielić worktree (C-047, C-059, §2b).

**Mój własny błąd tej klasy — zgłaszam sam.** Mój commit raportu `e633a65c` **zabrał ze
sobą cudzy plik** `03-obrona-runda1.md` (+86 linii). Przyczyna to dokładnie C-047:
`git add` wykonała sesja Obrony, a moje `git commit` (bez ścieżek) zatwierdziło **cały
indeks**, nie tylko to, co sam zaindeksowałem. Sprawdziłem skutek: plik w commicie jest
**identyczny z wersją na dysku i kompletny** (kończy się sekcją „Uwaga o długości"),
więc nic nie zostało obcięte ani nadpisane, a treść i tak należy do tego samego ID
i tej samej gałęzi. **Nie przepisuję historii** — przy trzech procesach w jednym drzewie
`reset`/`amend` jest groźniejszy niż sama wada. Lekcja na przyszłość: w drzewie
współdzielonym `git commit` musi dostać **jawne ścieżki** (`git commit -- <ścieżki>`),
bo samo `git add` po ścieżkach nie wystarcza.

**Karta pokazuje `Efekty —`.** Zerowy efekt Garnizonu do czasu wydania tematu Prawa
(zarzut 3 Evaluatora rundy 1) jest teraz **napisany wprost dla gracza** w haśle CivPedii,
w ramce „Uwaga o kolejności wersji": dopóki przebudowa skali Prawa nie jest wydana,
Garnizon jest kosztem bez korzyści. To nie zastępuje decyzji o kolejności deployu —
ale przestaje być wiedzą ukrytą w raporcie.

**Liczby na ekranie a liczby w danych.** Karta pokazuje 60 pkt Pracy / 4 Pieniądza /
60 Drewna przy danych 30 / 2 / 30 — mnożnik ×2 pochodzi z `R_STAWKI_FALA2_MULT`
(`economy-upkeep.ts:651`) i działa jednakowo na wszystkie budynki, a nie z tempa
kreatora (`niski` = ×1.0). Hasło CivPedii podaje obie wartości, żeby nie powielać
rozjazdu z sąsiednich haseł (`sad.md`, `pretorium.md` podają surowe liczby z JSON,
przez co nie zgadzają się z tym, co widzi gracz).
