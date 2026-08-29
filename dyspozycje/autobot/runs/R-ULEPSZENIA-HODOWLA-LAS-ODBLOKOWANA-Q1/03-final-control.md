# 03 — FINAL CONTROL (runda 1) — R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1

Rola: Final Control, osobny subagent (Opus 5, effort high). Runda 1/5.
Worktree kontrolny: `/home/user/wt-fc-hodowla-las` (detached `e85978d6`).
Worktree bazowy do porównań, założony przeze mnie: `/home/user/wt-fc-hodowla-base` (detached `9015380b`).

Pracowałem na wytworze w worktree sprawdzonym bezpośrednio (§16b, zdanie końcowe), nie na
raportach Operatora i Evaluatora. Wszystkie liczby niżej pochodzą z uruchomień w tej sesji
(rząd 1 wg §13a); nic nie jest przepisane z raportów poprzedników.

---

## 1. Kontrola proceduralna (obowiązkowa)

`git fetch origin autobot/R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1` — wykonany.

```text
e85978d6  raport Evaluatora, runda 1 (PASS-WITH-NOTES)
9a0f5789  raport Operatora, runda 1
9c82378c  bramka tematu — usuniete tautologie w asercjach kontrolnych
e2760aca  cofniecie zakazu hodowli (owce/bydlo/lama) na nakladce Las
9015380b  Dispatch R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1  <-- merge-base z origin/main
```

| Kontrola | Wynik |
|---|---|
| `git status --porcelain` | **pusty** — zero pracy niezacommitowanej |
| `git rev-parse HEAD` | `e85978d6e6bc38193266cca24097ae4ef59c716c` |
| `git rev-parse origin/autobot/...` | `e85978d6e6bc38193266cca24097ae4ef59c716c` — **identyczne** |
| `git merge-base origin/main HEAD` | `9015380b` (diff czytany OD TEGO PUNKTU, nie `origin/main..`, §9 poz. 9) |
| ZMIANY SĄ W COMMITACH | **TAK** — bloker nie występuje |

Uwaga organizacyjna: gałąź tematu jest zajęta przez worktree Operatora, więc — tak samo jak
Evaluator — pracowałem na detached HEAD z `origin/`. Lokalny ref gałęzi stoi na `9a0f5789`,
`origin` na `e85978d6`; **źródłem prawdy dla orkiestratora jest `origin`.**

## 2. Granice §9 i allowlista — sprawdzone niezależnie

Diff `9015380b..e85978d6`, 7 plików, 1223 wstawień / 35 usunięć:

```text
A  dyspozycje/autobot/runs/R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1/01-operator.md
A  dyspozycje/autobot/runs/R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1/02-evaluator.md
M  gra/data/terrain-improvements.json
M  gra/src/map/improvement-build.ts
A  gra/tools/hodowla-las-measure.cjs
A  gra/tools/hodowla-las-test.cjs
M  gra/tools/map-improvement-qualify-test.cjs
```

**Filtr odwrotny allowlisty — PUSTY.** Komenda i wynik:

```bash
git diff --name-only 9015380b..e85978d6 | grep -v -E '^(gra/src/map/improvement-build\.ts|gra/data/terrain-improvements\.json|gra/src/ui/|gra/tools/|dyspozycje/autobot/runs/R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1/)'
# (brak wyjścia)
```

| Granica §9 | Wynik kontroli |
|---|---|
| 1 — zakaz `npm run build`/`npm run dev` | build wyłącznie `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-hodowla-las-fc --emptyOutDir` (moje uruchomienie), `--outDir` poza drzewem repo |
| 2 — zakaz `git add -A` | diff obejmuje 7 plików, wszystkie z allowlisty; brak plików ubocznych |
| 3 — sekrety | `git diff \| grep -inE "api[_-]?key\|secret\|password\|token\|BEGIN (RSA\|PRIVATE)"` — **brak trafień** |
| 4 — zmiana procesu w temacie produktowym | `docs/`, `.cursor/`, `.claude/`, `playbook.*` — **nietknięte** |
| 5 — `WERSJE.md` / `ROBOCZA-MANIFEST.json` | **nietknięte** |
| 8 — deploy/push | brak deployu; push wyłącznie gałęzi tematu |
| 9 — diff od `merge-base` | zastosowane (patrz wyżej) |

Dodatkowo: `git diff --check` — czysto. `gra/src/main.ts` i `gra/src/ui/**` **nietknięte**
(allowlista dopuszczała w `gra/src/ui/**` wyłącznie teksty — Operator nie skorzystał, słusznie,
bo naprawa tooltipa wymagałaby zmiany logiki, nie tekstu).

## 3. Bramki uruchomione moją własną ręką

**Pięć bramek referencyjnych** (z `gra/`, w timeout):

```text
logic          213/213   LOGIC OK
tech-tree      19 pass, 0 fail
research       33/33     ALL GREEN
unit-replace   13/13     WSZYSTKIE TESTY ZIELONE
combat         6/6       All sanity checks passed
```

`node ./node_modules/typescript/bin/tsc --noEmit` — **exit 0, zero błędów**.
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-hodowla-las-fc --emptyOutDir`
— **OK, 848 modułów, 19.16 s**.

**Bramki tematu i sąsiadów** (moje uruchomienia na gałęzi):

```text
hodowla-las-test              100 passed, 0 failed   (bramka tematu)
map-improvement-qualify-test  126 pass, 0 fail
oboz-lowiecki-las-test         91 passed, 0 failed   (kryterium 9 dispatchu — bez pogorszenia)
farma-nie-w-lesie-test        136 passed, 0 failed
ai-improvements-test           52 passed, 0 failed
auto-improvements-test         45 passed, 0 failed
```

Zgodność z kryteriami końca dispatchu: kryt. 7 (pięć bramek + `tsc`) ✔, kryt. 8
(`map-improvement-qualify` 117 → 126, bez pogorszenia) ✔, kryt. 9 (obóz łowiecki 91/0) ✔.

## 4. Rzecz, której nie było w raporcie Operatora ani Evaluatora

Dispatch wymaga ode mnie co najmniej jednego znaleziska spoza obu poprzednich raportów.
Mam dwa. Pierwsze jest pomiarem, drugie — luką w śladzie.

### 4a. Nikt nie zmierzył, co automat miasta i AI CYWILIZACJI faktycznie WYBIERAJĄ

Operator i Evaluator zmierzyli **kwalifikację** — ile pól *może* przyjąć hodowlę (Evaluator:
tabela prawdy 7040 komórek + 6 ziaren; Operator: 5 ziaren). To jest okazja, nie decyzja.
Sekcja (4) bramki tematu, która dotyka automatu i AI CYWILIZACJI, woła `pickAutoImprovements`
z `priorityOverride: [key]` — czyli **z rozbrojoną kolejnością priorytetów**. Żadna istniejąca
asercja nie widzi więc tego, co robi `AI_IMPROVEMENT_PRIORITY` w naturalnej kolejności. A ta
kolejność stawia `bydlo` i `owce` **przed** `oboz_lowiecki` i długo przed `tartak`:

```text
['farma','bydlo','owce','lama','tarasy','oboz_lowiecki','lodzie_rybackie', ... ,'tartak', ...]
```

Uruchomiłem `pickAutoImprovements` **bez `priorityOverride`**, na mapach z `generateMap`
(36×28, `kontynenty`), 6 ziaren (90210, 777, 31415, 11111, 60606, 2718281), 914 heksów z lasem,
gałąź vs baseline `9015380b`. Jedna funkcja obsługuje OBIE ścieżki — automat miasta gracza
(`main.ts`) i **AI CYWILIZACJI** (`ai.ts planCityImprovements`), więc pomiar dotyczy obu.

| pick na heksie z Lasem | baseline `9015380b` | gałąź | delta |
|---|---:|---:|---:|
| `oboz_lowiecki` | 342 | 342 | **0** |
| `tartak` | 342 | 342 | **0** |
| `bydlo` | 0 | 321 | **+321** |
| `owce` | 0 | 21 | **+21** |

| pick na CAŁEJ mapie | baseline | gałąź | delta |
|---|---:|---:|---:|
| `farma` | 233 | 233 | 0 |
| `bydlo` | 233 | **554** | +321 (+138 %) |
| `owce` | 35 | **56** | +21 (+60 %) |
| `oboz_lowiecki` / `tartak` | 342 / 342 | 342 / 342 | 0 / 0 |

Głębokość stosu na heksie z lasem, który automat/AI w ogóle ulepsza:

```text
baseline:  2 warstwy na 342 heksach  -> {oboz_lowiecki+tartak: 342}
gałąź:     3 warstwy na 342 heksach  -> {bydlo+oboz_lowiecki+tartak: 321,
                                         oboz_lowiecki+owce+tartak:   21}
```

**Co z tego wynika — trzy rzeczy, każda istotna dla właściciela:**

1. **Brak regresu drewna i łowiectwa.** Moja hipoteza wejściowa była taka, że hodowla wypchnie
   tartak i obóz łowiecki, bo stoi wyżej w priorytecie. **Hipoteza obalona pomiarem:** 342 → 342
   w obu kluczach, co do sztuki. Powód jest w kodzie: `SEKTOR_OF` daje `hodowla` / `lowiectwo` /
   `las` — trzy różne sektory wyłączające, więc współistnieją; a `oboz_lowiecki` nie należy do
   `FOOD_LAYER_KEYS`, więc nie koliduje też z bydłem po stronie żywności. To jest wynik
   negatywny, ale wart zapisania: **produkcja Drewna AI CYWILIZACJI nie ucierpi.**
2. **Za to każdy ulepszany heks leśny dostaje trzecią warstwę zamiast dwóch — 342/342, bez
   wyjątku.** Plony jednego takiego heksa rosną o pełny bonus hodowli
   (`bydlo`: żywność 2 / praca 4 / handel 3; `owce`: 1 / 2 / 2) i to **bez wyrębu, las zostaje**.
   Bydło na całej mapie więcej niż się podwaja. To jest realny skutek balansowy decyzji
   właściciela, nie usterka — ale nikt dotąd nie podał jego rzędu wielkości.
3. **Silnik potwierdza, że potrójny stos jest legalny na ścieżce commitu, nie tylko w plannerze.**
   Sekwencja `computeImprovementBuildImpact` na Łące+Las:
   `bydlo: OK, zdejmuje=[]` → `oboz_lowiecki: OK, zdejmuje=[]` → `tartak: OK, zdejmuje=[]`;
   na baseline pierwszy krok to `bydlo: ODRZUCONE`. Planner i gate commitu są zgodne — brak
   dziury klasy P7.

**Ograniczenie mojego pomiaru, nazwane wprost (§13a).** Sonda to syntetyczny górny pułap:
jedno miasto, terytorium = cała mapa, `pracaAvailable` 1e8, `maxItemsPerCity: Infinity`.
W realnej rozgrywce AI CYWILIZACJI ustawia `maxItemsPerCity: 1` na turę, a terytorium to
promień miasta. **Przenosi się PROPORCJA** (każdy ulepszany heks leśny: 2 → 3 warstwy, zero
wypchnięć tartaku/obozu); **nie przenoszą się liczby bezwzględne.** To nie jest dowód
z rozgrywki i tak go nie przedstawiam.

Sondy: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/fc-auto-choice-probe.cjs`
oraz `fc-stack-probe.cjs` (celowo poza repo — nie są artefaktem tematu).

### 4b. Komentarz w kodzie twierdzi, że pytanie o stadninę „jest zgłoszone" — nie jest

`gra/src/map/improvement-build.ts`, docstring `isStadninaBlockedOnForest`, zdanie końcowe:

> „Zostaje jak było; pytanie »czy stadnina też ma wejść do lasu« jest zgłoszone właścicielowi
> osobno."

Sprawdziłem oba rejestry na tym commicie:

```bash
grep -n "stadnin" dyspozycje/PYTANIA-OTWARTE.md dyspozycje/REJESTR-PROSB-I-ZADAN.md | grep -i "las\|2026-08-27"
# jedyne trafienia: P-HEX-TOOLTIP-... z 2026-08-14 — inny temat, zamknięty
```

**Wpisu nie ma ani w `PYTANIA-OTWARTE.md`, ani w `REJESTR-PROSB-I-ZADAN.md`.** Pytanie istnieje
wyłącznie w §4 raportu `01-operator.md`. Raport runu nie jest rejestrem — a komentarz w źródle
przeżyje ten run i wprowadzi następnego czytelnika w błąd, że sprawa jest śledzona.
To jest §16b pkt 4 (uwaga z `PASS-WITH-NOTES` ma być **zapisana jako osobny temat**, nie
zostawiona w raporcie) plus §13a (twierdzenie o stanie faktycznym bez artefaktu).

**Ważna okoliczność łagodząca, którą stwierdzam na korzyść Operatora:** `PYTANIA-OTWARTE.md`
i `REJESTR-PROSB-I-ZADAN.md` **nie są w allowliście tego tematu**. Operator nie mógł tam
dopisać ani linijki bez naruszenia granicy — więc nie jest to jego zaniedbanie, tylko luka
konstrukcyjna dispatchu. Wnioskiem nie jest `FAIL`, tylko **czynność orkiestratora przy
integracji** (pkt 7 niżej). Ta sama uwaga dotyczy pozostałych czterech not Evaluatora
(brak dowodu wizualnego, luka tooltip↔silnik, `demoKeysForHex`, krucha asercja JSON) —
żadna z nich nie mogła zostać zarejestrowana z wnętrza tego tematu.

## 5. Dowód nietautologiczny — dwie mutacje własne, inne niż w obu poprzednich rundach

Operator (M1–M7) i Evaluator (M1, M3, M4, M5, M6b) mutowali regułę terenu w `qualifies()`
i predykaty. Ja celowałem w **drugą, niezależną bramkę — ścieżkę commitu omijającą panel budowy**
(dokładnie tę klasę, w której temat obozu łowieckiego znalazł dziurę P7), oraz w **czułość
własnej sondy**.

| Mutacja FC | Co robi | Wynik |
|---|---|---|
| **FC-M1** | `bydlo` usunięte z `FOREST_COEXIST_IMPROVEMENT_KEYS` i dopisane do `FOREST_BLOCKED_IMPROVEMENT_KEYS` — cofnięcie zakazu WYŁĄCZNIE w gate commitu, `qualifies()` nietknięty | `hodowla-las-test` **92/8 FAIL** · `map-improvement-qualify-test` **123/3 FAIL** (m.in. „impact NIE-null: bydlo on las") |
| **FC-M2** | `isOwceBaseTerrain`: `Nakladka.Las` → `return false` | sonda wyboru automatu/AI CYWILIZACJI: `owce` na lesie **21 → 0**, `bydlo` bez zmian **321** |

FC-M1 dowodzi, że gate commitu jest realnie pilnowany, nie tylko ścieżka panelu.
FC-M2 dowodzi, że **mój własny pomiar z pkt 4a jest czuły**, a nie mierzy stałej.
Po obu mutacjach źródło przywrócone; `git status --porcelain` pusty, bramki ponownie
**100/0** i **126/0**.

## 6. Checklista §16b

| # | Pozycja | Wynik |
|---|---|---|
| 1 | Istnieje `00-dispatch.md`, `GOAL` nie zmienił się po drodze | **TAK** — `GOAL` w `01-operator.md`, `02-evaluator.md` i moim raporcie jest **dosłownie** tym z dispatchu, zdanie w zdanie |
| 2 | To samo ID we wszystkich rundach | **TAK** — `R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1` w dispatchu i obu raportach |
| 3 | Werdykt Evaluatora oparty na artefaktach, nie deklaracjach | **TAK** — Evaluator uruchomił bramki własną ręką, zbudował własny worktree bazowy, zrobił tabelę prawdy 7040 komórek na 6 WŁASNYCH ziarnach i 5 własnych mutacji. Zgłosił też **własny błąd metody** (za szeroka siatka przy jednym węźle terytorium) i podał wynik z wersji poprawionej — to jest zachowanie zgodne z §13b, punkt na plus |
| 4 | Czy `PASS-WITH-NOTES` nie ukrywa uwagi o GOAL / dowodzie / zakresie / §9 / gotowości | **NIE ukrywa.** Pięć not Evaluatora sprawdziłem po kolei: żadna nie dotyczy GOAL ani granic §9; nota (1) jest jawnie nazwana **BRAKIEM DOWODU**, nie oceną; noty (2)(3) dotyczą plików poza allowlistą; (4) to potwierdzenie decyzji zakresowej; (5) jest kosmetyczna. **Ale** żadna nie jest zapisana jako osobny temat — patrz pkt 4b i 7 |
| 5 | Licznik rund zgadza się i nie został po cichu zresetowany | **TAK** — `RUNDY: 1/5` w obu raportach, mój `1/5`; brak wcześniejszych rund tego ID |
| 6 | `REJESTR-PROSB-I-ZADAN.md` odzwierciedla stan faktyczny | **CZĘŚCIOWO.** Wiersz (linia 3253) mówi „ZAREJESTROWANE TERAZ — dispatch wypchniety" i to jest prawda na moment dispatchu, ale **nie odnotowuje, że Operator i Evaluator rundy 1 są zamknięte**. Aktualizacja rejestru należy do orkiestratora przy integracji (rejestr jest poza allowlistą tematu) |
| 7 | Temat dzielony na węzły — najsłabszy węzeł | nie dotyczy, temat jednowęzłowy |
| 8 | Werdykt | patrz niżej |

## 7. Czego orkiestrator NIE może pominąć przy integracji

Trzy czynności, wszystkie w plikach **poza allowlistą tego tematu**, więc żaden z wykonawców
nie mógł ich zrobić:

1. **Zarejestrować pytanie o stadninę** (`PYTANIA-OTWARTE.md`) — inaczej komentarz w
   `improvement-build.ts` pozostaje twierdzeniem nieprawdziwym (pkt 4b). Jeśli rejestracja nie
   nastąpi, **poprawić brzmienie komentarza** przy najbliższej okazji dotykającej tego pliku:
   „pytanie zgłoszone w raporcie `01-operator.md` §4, do rejestracji przez orkiestratora".
2. **Zarejestrować cztery noty Evaluatora** (brak dowodu wizualnego dla `foodOnForest`;
   luka tooltip↔silnik poszerzona o pola leśne; `demoKeysForHex` w `main.ts:12031` nieaktualny
   wobec DWÓCH tematów z 2026-08-27; krucha asercja JSON na frazie z nawiasem).
3. **Zaktualizować wiersz w `REJESTR-PROSB-I-ZADAN.md`** o zamknięcie rundy 1.

Do tego **kolizja równoległa**: `R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1` (worktree
`wt-op-farma-legacy`, `023ce2b2`) także dotyka `gra/src/map/improvement-build.ts`. Integracja
sekwencyjna, `git merge --no-ff` od `merge-base`, scalanie per hunk. Punkty realnego ryzyka
kolizji w tym pliku, wskazane precyzyjnie: `FOREST_COEXIST_IMPROVEMENT_KEYS` (linie ~264-267),
`FOREST_BLOCKED_IMPROVEMENT_KEYS` (~273-285), `stripImprovementsWhenForestRemoved` /
`FOREST_DEPENDENT_IMPROVEMENT_KEYS` (~186-192) oraz `isFarmBaseTerrain` (~219-223).

## 8. Co pozostaje BRAKIEM DOWODU (§13a)

Nazywam wprost, bez łagodzenia:

- **Brak weryfikacji w żywej przeglądarce.** Ja też jej nie zrobiłem. Zielone bramki i moja
  sonda dowodzą zachowania **funkcji kwalifikującej i planującej**, nie tego, jak zalesiony
  heks z owcami/bydłem/lamą wygląda na ekranie. Temat jest regułą terenu, nie tematem
  wizualnym w rozumieniu §9 poz. 6, więc nie jest to naruszenie granicy — ale rendering
  potrójnej warstwy (las + tartak + hodowla) na jednym heksie **nie został przez nikogo
  zobaczony**, a mój pomiar z pkt 4a pokazuje, że taki heks będzie występował masowo.
- **`foodOnForest` w `main.ts` obejmuje `farma` + `bydlo`**, więc bydło na lesie chowa kępę
  lasu, a owce i lama nie. Potwierdzam ustalenie Evaluatora ze źródła; `main.ts` jest poza
  allowlistą, w przeglądarce nikt tego nie sprawdził. **To brak dowodu, nie ocena wyglądu.**
- **Bramki zielone ≠ zachowanie w rozgrywce.** Moje liczby z pkt 4a pochodzą z funkcji
  planującej na syntetycznym pułapie zasobów, nie z rozegranej tury.

## 9. Weryfikacje, które wykonałem, a które niczego nie zmieniły (dla kompletności śladu)

Zapisuję je, żeby nie wyglądały na nieprzeprowadzone:

- **Martwe referencje po usuniętych symbolach:** `isLivestockImprovementBlockedOnForest`
  i alias `isAnimalFarmBlockedOnForest` — zero wywołań w `.ts`/`.cjs` w całym repo
  (jedyne trafienie to zakomentowana linia w `map-improvement-qualify-test.cjs:304`).
  Kompilacja to potwierdza (`tsc` 0 błędów).
- **`isLivestockImprovementKey` importowany w `main.ts:735` i nigdzie nie wołany** — sprawdziłem
  na baseline `9015380b`: **było tak już przed tym tematem**. Nie jest to skutek tej zmiany.
- **`FOREST_COEXIST_IMPROVEMENT_KEYS` używany wyłącznie w `isImprovementBlockedOnForest`** —
  potwierdzam ustalenie Evaluatora, że dopisanie tam trzech kluczy jest behawioralnie obojętne
  (mutacja M3 Evaluatora nie czerwieni bramki). Wpis ma wartość dokumentacyjną i taki jest
  jego zadeklarowany cel w komentarzu Operatora.
- **Pola `teren` i `warunek` z `terrain-improvements.json` nie są nigdzie parsowane** — jedyny
  konsument to `ui/entityCards/improvementAdapter.ts:121,128`, który renderuje je jako czysty
  tekst. Zmiana brzmienia (m.in. dopisanie „(także z nakładką Las)") **nie może zepsuć żadnej
  logiki**; sprawdzałem to, bo nawias w polu `teren` byłby groźny, gdyby ktoś ten string ciął.
- **Twierdzenie dopisane do `stadnina.warunek`** („albo po imperialnym odblokowaniu Konia —
  wtedy bez złoża") **jest PRAWDZIWE** — potwierdzone w źródle: `createQualifier`, `case
  'stadnina'`, warunek `hex.nakladka === Nakladka.ZlozeKonia || isLivestockUnlockedForPlacement(...)`.
- **Kopie danych:** `gra-robocza/data — kopia/terrain-improvements.json` i zbudowane pliki
  `Gra-*.html` nadal niosą stare brzmienie. To **nie jest zaniedbanie tego tematu** — te
  artefakty są poza allowlistą i aktualizują się przy deployu/synchronizacji roboczej, tak samo
  jak po zamkniętym temacie farmy z tego samego dnia.
- **Migracja / save-load:** `migrateImprovementLayers` migruje wyłącznie stary klucz `kopalnia`
  i nie strypuje warstw po nakładce; `stripImprovementsWhenForestRemoved` opiera się o
  `FOREST_DEPENDENT_IMPROVEMENT_KEYS = {oboz_lowiecki}`, więc hodowla przeżywa wyrąb i po
  wyrębie nadal jest legalna wg terenu bazowego. Zmiana wyłącznie **luzuje** regułę, więc żaden
  zapisany stan nie staje się nielegalny. Luki save/load brak.
- **Parytet gracz / automat gracza / AI CYWILIZACJI:** jeden wspólny kwalifikator
  (`ai.ts planCityImprovements` → `pickAutoImprovements` → `buildImprovementQualifier`);
  `ai.ts` nie ma własnej reguły terenu hodowli. Mój pomiar z pkt 4a szedł tą samą, wspólną
  funkcją, więc dotyczy obu ścieżek naraz. Asymetrii brak.

## 10. Werdykt

Kryteria końca dispatchu 1–9: **wszystkie spełnione**, sprawdzone przeze mnie niezależnie.
Zakaz zdjęty dokładnie dla trzech kluczy z ECHO właściciela i dla żadnego więcej; reszta
kwalifikacji terenu nietknięta (Evaluator: 0 zmian poza lasem na 7040 komórkach; ja: `farma`
233 → 233 picków, `oboz_lowiecki`/`tartak` 342 → 342). Decyzja o zostawieniu zakazu dla
`stadnina` jest poprawna — ECHO mówi „wszystkie trzy" i wymienia owce, bydło, lamę; stadnina
wpadła w zakaz z 2026-07-29 pochodną definicji (`surowiecOdblokowany === 'kon'`), a jej
odblokowanie byłoby czwartą, niezamówioną zmianą reguły terenu (§14).

Żadne z moich dwóch znalezisk nie blokuje: 4a jest **skutkiem** decyzji właściciela podanym
z liczbą, nie usterką; 4b jest luką w śladzie w plikach, do których wykonawcy nie mieli dostępu
z allowlisty, i domyka ją orkiestrator przy integracji (pkt 7).

**GOTOWOŚĆ DO INTEGRACJI: TAK**

---

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1
GOAL: Hodowla zwierzeca (owce, bydlo, lama) przestaje byc zakazana na heksach z nakladka Las;
      kazda kwalifikuje sie wg wlasnej reguly terenu bazowego, reszta kwalifikacji bez zmian.
ZMIANY/COMMIT: kontrolowalem galaz autobot/R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1 @ e85978d6
      (e2760aca silnik+dane+bramki, 9c82378c usuniecie tautologii, 9a0f5789 raport Operatora,
      e85978d6 raport Evaluatora). Diff 9015380b..e85978d6 = 7 plikow, KAZDY w allowliscie,
      FILTR ODWROTNY ALLOWLISTY PUSTY. main.ts, gra/src/ui/**, dyspozycje/WERSJE.md,
      docs/**, playbook.* nietkniete. git status pusty, HEAD == origin — praca w commitach.
      git diff --check czysto, brak sekretow. Wlasny wklad Final Control: 03-final-control.md.
TESTY: PIEC BRAMEK REFERENCYJNYCH wlasna reka: logic 213/213 · tech-tree 19/0 · research 33/33 ·
      unit-replace 13/13 · combat 6/6. tsc --noEmit exit 0, zero bledow.
      vite build --outDir /tmp/civ-dist-hodowla-las-fc OK (848 modulow, 19.16s).
      BRAMKI TEMATU I SASIADOW (moje uruchomienia): hodowla-las 100/0 · map-improvement-qualify
      126/0 (kryt.8: bylo 117, bez pogorszenia) · oboz-lowiecki-las 91/0 (kryt.9 spelnione) ·
      farma-nie-w-lesie 136/0 · ai-improvements 52/0 · auto-improvements 45/0.
      POMIAR WLASNY — CO AUTOMAT GRACZA I AI CYWILIZACJI FAKTYCZNIE WYBIERAJA (pickAutoImprovements
      BEZ priorityOverride, naturalna kolejnosc AI_IMPROVEMENT_PRIORITY; 6 ziaren, 914 heksow
      z lasem, galaz vs baseline 9015380b): na heksach z lasem oboz_lowiecki 342->342 i tartak
      342->342 (ZERO wypchniec, brak regresu Drewna i lowiectwa), bydlo 0->321, owce 0->21;
      na calej mapie bydlo 233->554 (+138%), owce 35->56 (+60%), farma 233->233.
      Glebokosc stosu na ulepszanym heksie lesnym 2->3 warstwy na 342/342 heksach
      (bydlo+oboz_lowiecki+tartak 321, oboz_lowiecki+owce+tartak 21). Gate commitu potwierdza
      legalnosc stosu: na Lace+Las bydlo OK/oboz OK/tartak OK, zdejmuje=[] na kazdym kroku;
      na baseline pierwszy krok = ODRZUCONE. Zadna istniejaca bramka tego nie widzi, bo sekcja
      (4) bramki tematu rozbraja kolejnosc przez priorityOverride:[key].
      MUTACJE WLASNE (inne niz Operatora i Evaluatora): FC-M1 (bydlo cofniete WYLACZNIE w gate
      commitu — FOREST_COEXIST/FOREST_BLOCKED, qualifies() nietkniety) -> hodowla-las 92/8 FAIL,
      map-improvement-qualify 123/3 FAIL; FC-M2 (isOwceBaseTerrain rewers dla Lasu) -> moja sonda
      owce 21->0 przy bydlo bez zmian 321, czyli pomiar jest czuly. Po mutacjach zrodlo
      przywrocone, git status pusty, bramki znowu 100/0 i 126/0.
      WERYFIKACJE NEGATYWNE: zero martwych referencji po usunietych symbolach; nieuzywany import
      isLivestockImprovementKey w main.ts:735 istnial JUZ na baseline; pola teren/warunek z JSON
      nigdzie nie sa parsowane (jedyny konsument improvementAdapter.ts renderuje tekst);
      twierdzenie dopisane do stadnina.warunek potwierdzone w zrodle jako prawdziwe;
      save/load bez luki (migracja tyka tylko klucz `kopalnia`, zmiana wylacznie luzuje regule);
      parytet gracz/automat/AI CYWILIZACJI — jeden wspolny kwalifikator, asymetrii brak.
BLOKADY: BRAK BLOKAD INTEGRACJI. Znaleziska Final Control spoza obu poprzednich raportow:
      (1) SKUTEK BALANSOWY ZMIERZONY PO RAZ PIERWSZY — automat gracza i AI CYWILIZACJI kladly na
          ulepszanym heksie lesnym 2 warstwy, teraz kada 3 (342/342 heksow), a bydlo na mapie
          wiecej niz sie podwaja; tartak i oboz lowiecki NIE sa wypychane (rozne sektory
          wylaczajace). To SKUTEK decyzji wlasciciela podany z liczba, nie usterka — do
          wiadomosci przy ocenie balansu. Ograniczenie pomiaru nazwane: sonda to syntetyczny
          pulap (1 miasto, terytorium=cala mapa, praca 1e8, maxItemsPerCity Infinity) —
          przenosi sie PROPORCJA, nie liczby bezwzgledne;
      (2) LUKA SLADU — docstring isStadninaBlockedOnForest twierdzi, ze pytanie o stadnine „jest
          zgloszone wlascicielowi osobno"; NIE MA go ani w PYTANIA-OTWARTE.md, ani w
          REJESTR-PROSB-I-ZADAN.md — zyje tylko w 01-operator.md §4. Oba rejestry sa POZA
          allowlista tematu, wiec Operator nie mogl tego zapisac: to luka konstrukcyjna
          dispatchu, nie zaniedbanie wykonawcy. Domkniecie = czynnosc orkiestratora (§16b.4).
      DO WYKONANIA PRZEZ ORKIESTRATORA PRZY INTEGRACJI: zarejestrowac pytanie o stadnine;
      zarejestrowac cztery noty Evaluatora (brak dowodu wizualnego foodOnForest, luka
      tooltip<->silnik, demoKeysForHex w main.ts:12031, krucha asercja JSON); zaktualizowac
      wiersz rejestru o zamkniecie rundy 1. Kolizja rownolegla: R-ULEPSZENIA-FARMA-LESIE-USUN-
      ISTNIEJACE-Q1 tez dotyka improvement-build.ts — merge --no-ff od merge-base, per hunk,
      punkty ryzyka: FOREST_COEXIST (~264), FOREST_BLOCKED (~273), FOREST_DEPENDENT (~186),
      isFarmBaseTerrain (~219).
      BRAK DOWODU (§13a, nie ocena): nikt — Operator, Evaluator ani ja — nie obejrzal w zywej
      przegladarce zalesionego heksa z hodowla; foodOnForest w main.ts obejmuje tylko
      farma+bydlo, wiec owce i lama nie chowaja kepy lasu (ustalone ze zrodla, main.ts poza
      allowlista); zielone bramki i moja sonda NIE sa dowodem zachowania w rozgrywce.
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (Luna Medium) — merge --no-ff od merge-base 9015380b,
      allowlist-only per plik i per hunk, sekwencyjnie wobec tematu farmy; po integracji trzy
      czynnosci rejestrowe z sekcji BLOKADY; dopiero potem READY_FOR_DEPLOY.
DEPLOY/PUSH: DEPLOY — NIE WYKONANO. PUSH — wylacznie galezi tematu (03-final-control.md),
      nigdy do main. Final Control nie integruje i nie wystawia READY_FOR_DEPLOY.
```

**GOTOWOŚĆ DO INTEGRACJI: TAK**
