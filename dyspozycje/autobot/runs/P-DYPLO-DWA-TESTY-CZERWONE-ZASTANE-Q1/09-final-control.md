# P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1 — Final Control

MODEL+EFFORT: Opus 5, effort high · DATA: 2026-09-06 · ŚCIEŻKA: A (Workflow, osobne wywołanie)
GUARD IZOLACJI (§2b): worktree `/home/user/wt-dyplo-testy`, gałąź
`autobot/P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1`, HEAD `4e670ee6`, drzewo czyste przed i po.
`git merge-base --is-ancestor ee1f6756 HEAD` → TAK; `git merge-base origin/main HEAD` = `ee1f6756`
(= baza z dispatchu). HEAD dalej niż baza o dwa commity rund — poprawnie, nie `BLOCK`.
`origin/main` = `094be1db` (FALA 350), `ee1f6756` jest jego przodkiem.

Wszystkie liczby niżej pochodzą z **moich własnych uruchomień w tym worktree**, nie z raportów.
Mutacje weryfikacyjne cofane KOPIĄ pliku (`cp` z kopii sprzed mutacji w scratchpadzie),
nigdy `git checkout`; po każdej `git diff --quiet` czyste. Nadpisane przez bramki
`*-real-render-*` zrzuty w cudzych `runs/*/dowody/` przywrócone kopią blobu z `HEAD`.

## 0. Brak Obrony — czy to brak procesowy?

**NIE.** §3c pkt 1: „Lista **pusta** … idzie od razu do Final Control jak w §3". Evaluator
(`02-evaluator-runda1.md`) zwrócił `ZARZUTY: brak`, więc Obrona nie była wymagana i jej brak
nie jest luką procesową. Katalog runu zawiera komplet dla tej ścieżki: `00-dispatch.md`,
`01-operator-runda1.md`, `02-evaluator-runda1.md`.

Uwaga do §16b pkt 3 (przy pustej liście sprawdzam, czy Evaluator faktycznie przeszedł 10 punktów
§16a): udokumentowane ma punkty 1, 2, 3, 5, 6, 8, 9. **Punkty 4, 7 i 10 nie mają w jego raporcie
żadnego śladu**, mimo zdania „po realnym sprawdzeniu wszystkich 10 punktów". Sprawdziłem je sam
(wynik w U3) — nic nie znalazłem, więc to nota, nie zarzut.

W dispatchu **nie ma ratyfikacji na końcu pliku** — `00-dispatch.md` kończy się sekcją
„GUARD IZOLACJI" i jest bajt w bajt identyczny z wersją na `origin/main`. Nie ma czego czytać.

## 1. Bramki tematu — moje uruchomienia

| Bramka | Wynik (mój przebieg) |
|---|---|
| `node gra/tools/diplomacy-audience-close-flush-test.cjs` | **45 pass, 0 fail** |
| `node gra/tools/dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs` | **23 PASS, 0 FAIL**, zero `PRZERWANE` |

Obie zielone. Kryterium 1 i 2 dispatchu spełnione.

## 2. Odpowiedzi na pytania wspólne

### A. Czy jakakolwiek asercja została osłabiona, usunięta albo przepisana tak, że nie może już zaczerwienić?

**Nie usunięta i nie osłabiona — z jednym wyjaśnionym wyjątkiem i jedną nienaprawioną dziurą
(U1), która nie jest jednak osłabieniem, bo istniała tak samo przed diffem.**

**Bramka 1, licznik po obu stronach diffu — mój własny pomiar, nie statyczny.** Wersję bazową
pliku wyciągnąłem `git show ee1f6756:…` do `gra/tools/ZZ-base-gate1-tmp.cjs`, uruchomiłem na
NIEZMIENIONYM `main.ts` i skasowałem (`git status` czysty po):

- baza `ee1f6756`: **36 pass, 1 fail = 37 asercji**
- HEAD `4e670ee6`: **45 pass, 0 fail = 45 asercji** → **+8, zero spadku**

Jedyna linia `-` z asercją: `ok(allBareCalls === 2, …)`, zastąpiona przez `ok(bareOffsets.length === 3, …)`
plus osiem nowych `[A4a]`–`[A4f]`. Żadna z nich nie jest tautologią — moje mutacje F1, F2, F3c, F7
czerwienią po kolei `[A4a]`, `[A4c]`, `[A2]`, `[A3]`, `[A4f]`.

**Bramka 2, inwentarz asercji.** Statycznie `check(`: baza **22** → HEAD **23**. Porównałem
etykiety jedna do jednej: **wszystkie 22 etykiety bazowe są obecne w HEAD**, doszła `(0c)`.
Dwie asercje zostały **wzmocnione**, nie osłabione: `(0)` i `(0b)` z `=== 1` na `=== 2`.

Jedyne realne rozluźnienie: `(PRZED-3)`/`(PO-3)`, regex `Wspólna walka z barbarzyńcami \(3 tury\)`
→ bez `\(3 tury\)`. Sprawdziłem sam w trzech punktach historii —
`gra/src/ui/diplomacyTradeBasket.ts:680` w `ee1f6756`, w `HEAD` **i w `origin/main`** brzmi
`…'">Wspólna walka z barbarzyńcami</button>'`. Sufiks zdjął sąsiedni temat
`R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1`. Utrzymanie starego regexu byłoby asercją, która
nie może już być zielona. Rdzeń etykiety nadal czerwienieje — mutacja E3 Evaluatora i moja F5
to potwierdzają. **ODDAL.**

### B. Czy zakres nie wyciekł poza allowlistę?

**Nie.** `git diff $(git merge-base origin/main HEAD)..HEAD --name-only` (§9 pkt 9 — liczony
od merge-base, nie naiwnie od `origin/main`) → dokładnie **4 pliki**:

| Plik | Pozycja allowlisty |
|---|---|
| `gra/tools/diplomacy-audience-close-flush-test.cjs` | 1 ✔ |
| `gra/tools/dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs` | 2 ✔ |
| `dyspozycje/autobot/runs/P-DYPLO-…-Q1/01-operator-runda1.md` | 5 ✔ |
| `dyspozycje/autobot/runs/P-DYPLO-…-Q1/02-evaluator-runda1.md` | 5 ✔ |

`gra/src/main.ts` (poz. 3) i `gra/src/ui/diplomacyAudience.ts` (poz. 4) — **zero zmian**, więc
klauzula „jedna linia albo `DECISION_REQUIRED`" nie ma zastosowania. Zero plików zakazanych,
zero sekretów w diffie (`git diff` przejrzany w całości). §9: brak `npm run build`/`dev`
(jedyna kompilacja to `node ./node_modules/typescript/bin/tsc --noEmit`), brak `git add -A`,
`WERSJE.md`/`ROBOCZA-MANIFEST.json` nietknięte, brak zmiany procesu w allowliście produktowej.
GOAL w obu raportach = GOAL z dispatchu (§16a pkt 9). ID identyczne we wszystkich rundach.

### C. Czy `tsc --noEmit` jest zielony i czy pięć bramek referencyjnych jest zielonych?

Wszystko uruchomione przeze mnie:

- `node ./node_modules/typescript/bin/tsc --noEmit` → **exit 0**, zero błędów (17,7 s)
- `logic-test` → **LOGIC OK (213/213)**
- `tech-tree-test` → **19 pass, 0 fail**
- `research-test` → **PASSED: 33 / FAILED: 0 / TOTAL: 33 · ALL GREEN**
- `unit-replace-test` → **13/13, wszystkie zielone**
- `combat-test` → **COMBAT TEST: 6/6 pass**

### D. Czy została czerwona bramka w rodzinie tematu, której raport nie usprawiedliwia pomiarem na czystym `origin/main`?

Zrobiłem **własny przemiat wszystkich 72 plików** `gra/tools/*.cjs` pasujących do `diplo|dyplo`,
z kodem wyjścia per plik. Wynik: **69 zielonych, 3 czerwone**, identycznie jak w obu raportach
(zero rozbieżności, zero fałszywych alarmów z timeoutu — limit 900 s na plik):

1. `diplomacy-negotiation-table-test.cjs` — **57/58 PASS**
2. `dyplo-mapa-odkrycie-live-test.cjs` — **9 pass, 1 fail**
3. `dyplo-warunek-niespelniony-czerwony-tooltip-test.cjs` — **22/26 PASS**

**Dowód zastałości — mocniejszy niż pomiar na `origin/main`: dowód niesprawczości.** Diff od
merge-base to cztery pliki: dwie bramki, których te trzy testy nie czytają, i dwa raporty `.md`.
`gra/src/**` i `gra/data/**` — **zero zmian**. Wynik tych trzech bramek na HEAD jest więc
z definicji tożsamy z ich wynikiem na bazie `ee1f6756`, a `ee1f6756` jest przodkiem `origin/main`.
Ten temat nie może być ich przyczyną.

**Czego brakuje i mówię to wprost:** ani Operator, ani Evaluator, ani ja **nie zmierzyliśmy tych
trzech bramek na AKTUALNYM `origin/main` (`094be1db`, po FALI 350)** — wszystkie trzy pomiary
poszły na drzewie bazy. Próbowałem odtworzyć stan `origin/main` kopiując 12 różniących się plików
`gra/src`/`gra/data`; operację zablokował klasyfikator uprawnień sesji i **nie obchodziłem tej
blokady**. Dla werdyktu tego tematu to bez znaczenia (dowód niesprawczości wyżej jest zupełny),
ale trzy osobne tematy naprawcze muszą zacząć od pomiaru na aktualnym `origin/main`. Ujęte w U4.

## 3. Pytania specyficzne dla tematu

**Czy obie bramki są zielone i czy liczba asercji nie spadła?** Tak: 45/0 i 23/0; 37→45 i 22→23.

**Czy self-check bramki 2 jest zakotwiczony semantycznie?** **Tak.** W pliku nie ma ani jednego
odwołania do numeru linii ani do wielolinijkowego dosłownego bloku. Kotwice to: identyfikatory
`cdb-treaty-mil`/`cdb-treaty-barb`, nazwy pól `state.borderMilitary`/`state.barbarianCooperation`,
selektor listenera `'.cdb-treaty-mil, .cdb-treaty-barb'`, a koniec bloku listenera wyznacza
**dopasowanie nawiasów** (`cutBalancedCall`), nie wcięcie. Etykieta jest przechwytywana ze źródła
(grupa 1 regexu) i wstrzykiwana do wariantu PRZED, więc kolejna zmiana etykiety nie rozspoi mutacji.

**Zmutuj kod, który pilnuje — czy bramka CZERWIENIEJE, a nie przerywa?** Tak, mój dowód to F5:
`payload.borderMilitary = state.borderMilitary` → `= false` w `diplomacyTradeBasket.ts:1153`
daje **19 PASS / 4 FAIL** (`(PRZED-6)`, `(PRZED-7)`, `(PO-6)`, `(PO-7)`) przy `(0)`/`(0b)`/`(0c)`
**PASS** i **zero `PRZERWANE`**. Do tego F6 — mój test „niewinnego przesunięcia", czyli dokładnie
tryb, który zabił poprzednią wersję: dołożona linia `+ '<span class="cdb-f6-note">F6</span>'`
w konkatenacji `body` case'a '4' **plus** cały blok listenera przesunięty o 6 spacji **plus**
`btn => {` → `(btn) => {` — bramka **23 PASS / 0 FAIL**, kotwiczenie się nie rozsypało.
Kryterium 3 dispatchu spełnione.

Do Obserwacji 1 Evaluatora (mutacja kasująca sam kod-kotwicę kończy się `PRZERWANE`, nie czystą
czerwienią): potwierdzam mechanizm i **oddalam jako defekt**. Ścieżka `PRZERWANE` poprzedzona jest
teraz nazwanym `FAIL: (0c) … kotwica …` i kończy się `exit 1` — nie ma drogi do cichej zieleni,
a przyczyna jest wskazana palcem. To zachowanie bezpieczne kierunkowo.

## 4. Moje własne mutacje — osiem, wszystkie inne niż w raportach

Każda cofnięta kopią pliku, po każdej `git diff --quiet` czyste. Cel: nie przyklepać raportu.

| # | Mutacja (plik, na czym polega) | Wynik bramki | Co to znaczy |
|---|---|---|---|
| F1 | `main.ts:25789`: skasowana jedna witryna wywołania `closeDiplomacyAudienceAndFlush();` | bramka 1 **43 pass / 2 fail** — `[A2]` (handleDiploFocusCapital), `[A4a]` „osiągalność #1 … got 6" | asercja osiągalności `>= 7` jest napięta na styk i realnie czerwieni |
| F2 | `main.ts:21571`: **czysto kosmetyczne** rozbicie haka `closeAudience:` na 5 linii, semantyka bit w bit ta sama | bramka 1 **43/2** — `[A4c]` „got 0", `[A4f]` „rozpoznano 2 z 3" | **fałszywa czerwień**: klasyfikacja haka kotwiczy na „ten sam wiersz fizyczny co `closeAudience:`" → U2 |
| F3 | `main.ts`: nowa ścieżka zamknięcia w `openCityPanelForPlayer`, `if (isDiplomacyAudienceOpen()) hideDiplomacyAudience()` **bez średnika** (ASI, poprawny TS) | bramka 1 **45 pass, 0 fail** | **CICHA ZIELEŃ** na dokładnie tej regresji, przed którą `[A4]` broni → U1 |
| F3c | `main.ts`: `onCloseAudience: () => hideDiplomacyAudience(),` w `openCityPanelForPlayer` | bramka 1 **44/1** — zapaliło się **wyłącznie** `[A2]` (heurystyka odległości od kotwicy); `[A4]`, `[A4a]`–`[A4f]` **zielone przy 4 gołych wywołaniach w pliku** | licznik i klasyfikacja są ślepe razem, nie osobno → U1 |
| F4 | `main.ts:23099`: **nowa funkcja** `f4ClosePanelAndAudience()` z `closeAudienceNow: () => hideDiplomacyAudience(),`, z dala od wszystkich 7 kotwic `[A2]` | bramka 1 **45 pass, 0 fail** | **CICHA ZIELEŃ, dowód rozstrzygający** dla U1 — czwarte wywołanie omijające wrapper przechodzi bez śladu |
| F5 | `diplomacyTradeBasket.ts:1153`: `payload.borderMilitary = false` | bramka 2 **19 PASS / 4 FAIL**, `(0)`/`(0b)`/`(0c)` PASS, zero `PRZERWANE` | bramka 2 czerwieni realną regresję produkcyjną, nie przerywa |
| F6 | `diplomacyTradeBasket.ts`: dołożona linia w `body` + reindentacja bloku listenera + `btn =>` → `(btn) =>` | bramka 2 **23 PASS / 0 FAIL** | kotwiczenie bramki 2 przeżywa niewinne przesunięcie — realna naprawa, nie „działa dziś" |
| F7 | `main.ts`: usunięty `flushDeferredAutoPreBattle();` z `onBack` | bramka 1 **44/1** — `[A3]` | własny flush `onBack` jest pilnowany |

Dodatkowo: `chipButtonRe` i `selectedReadRe` bramki 2 wymagają obecności identyfikatorów i pól
stanu — F6 pokazuje, że nie wymagają już kształtu fizycznego.

## 5. Znaleziska i werdykty

Zarzutów Evaluatora nie ma (lista pusta), więc poniżej wyłącznie moje znaleziska. Werdykt
per pozycja, zgodnie z §3c pkt 3.

### U1 — `[A4]`/`[A4f]` są ślepe na najczęstszą składnię wywołania · **NAPRAW**

**Co.** Cały blok `[A4]` liczy i klasyfikuje wywołania regexem `/hideDiplomacyAudience\(\);/g` —
**wymaga średnika bezpośrednio po nawiasie**. Gołe wywołanie zapisane jako `() => hideDiplomacyAudience(),`
(zwięzłe ciało strzałki w literale obiektu) albo bez średnika w ogóle **nie jest liczone**.

**Dowód z wytworu (mój, nie z raportu).** F4: dokładam nową funkcję zamykającą audiencję z
pominięciem wrappera, w formie `closeAudienceNow: () => hideDiplomacyAudience(),`, z dala od
kotwic `[A2]` → bramka 1 **45 pass, 0 fail**. Zero sygnału. F3 (wariant bez średnika) — tak samo
45/0. F3c pokazuje, że przy 4 gołych wywołaniach w pliku `[A4] === 3` i `[A4f] „rozpoznano 3 z 3"`
są **zielone**; złapała to wyłącznie heurystyka odległości `[A2]`, która obejmuje 7 nazwanych
miejsc i nie obejmie funkcji, której jeszcze nie ma.

**Dlaczego to ma znaczenie dla GOAL.** Ta forma nie jest konstrukcją teoretyczną: w samym
`gra/src/main.ts` jest **72 wystąpienia** wzorca `nazwa: () => funkcja(...),`, a konfiguracja
audiencji korzysta z niego bezpośrednio (`hasNextOpenProposal: () => hasNextOpenDiploProposal(...)`,
`onNextOpenProposal: () => openNextOpenDiploProposal(ownerId)`). Repo nie ma ESLinta ani żadnej
reguły `semi` (`gra/package.json`, brak `.eslintrc*`/`eslint.config.*`), więc nic tej formy nie
blokuje. GOAL brzmi „obie bramki zielone **i mierzące to, co miały mierzyć**", a nagłówek pliku
deklaruje wprost, że `[A4]` „łapie przyszłe wywołanie, które ominie wrapper". Nowy komentarz dodany
w tej rundzie idzie dalej i twierdzi, że łapie je „także wtedy, gdy ktoś podniósłby sam licznik",
a `[A4f]` obiecuje, że „każde gołe wywołanie … jest w jednym z trzech NAZWANYCH miejsc". F4 pokazuje,
że **obie obietnice są dziś nieprawdziwe**. To jest dosłownie scenariusz z REGUŁY dispatchu, tryb
drugi: „za miesiąc będzie czwarta i nikt nie zauważy" — z tą różnicą, że czwarta nie jest zauważana
już teraz.

**Uczciwie: to nie jest regres tego diffu.** Wersja bazowa używała tego samego regexu, więc dziura
jest zastana. Nie zmienia to werdyktu, bo (1) ta runda **przepisała tę asercję w całości** i opatrzyła
ją mocniejszą deklaracją, niż wytwór realizuje, (2) naprawa mieści się w pozycji 1 allowlisty i nie
dotyka `gra/src/**`, (3) `[A4]` jest głównym wytworem tego tematu — jeśli ma zostać próg 3 zamiast 2,
klasyfikacja musi być realnie mocniejsza od licznika, bo tym została uzasadniona droga (b).

**Co i gdzie poprawić** (`gra/tools/diplomacy-audience-close-flush-test.cjs`, blok `[A4]`):

- `const bareRe = /hideDiplomacyAudience\(\);/g;` ma przestać wymagać średnika — łapać `();`,
  `(),`, `()` + koniec linii i `()` w zwięzłym ciele strzałki;
- **pułapka do ominięcia:** samo skreślenie `;` z regexu podniesie licznik z 3 na 5, bo
  `gra/src/main.ts:27750` i `:27765` zawierają `hideDiplomacyAudience()` **w komentarzach**.
  Licz na kopii źródła z wyciętymi komentarzami (albo wyklucz trafienia w komentarzu) — nie
  „napraw" tego przez podniesienie progu do 5;
- `[A2]` ma tę samą zależność: `mainSrc.indexOf('hideDiplomacyAudience();', anchorIdx)` — popraw
  spójnie, inaczej `[A2]` nadal przepuści gołe wywołanie zapisane bez średnika przed wrapperem;
- dowód wymagany do zamknięcia: na czystym `main.ts` nadal **45/0** (albo więcej asercji, nigdy
  mniej), a pod mutacją typu F4 — bramka **czerwona**.

### U2 — klasyfikacja haka kotwiczy na wierszu fizycznym, nie na własności · **NAPRAW**

**Co.** `[A4c]` uznaje wywołanie za „w haku" tylko wtedy, gdy `closeAudience:` stoi w **tym samym
wierszu** co wywołanie:

```js
const lineStart = mainSrc.lastIndexOf('\n', o) + 1;
return mainSrc.slice(lineStart, o).includes('closeAudience:');
```

**Dowód.** F2 — rozbijam `closeAudience: (): void => { if (…) hideDiplomacyAudience(); },` na pięć
linii, semantyka identyczna co do bitu → bramka 1 **43/2**: `[A4c] got 0`, `[A4f] rozpoznano 2 z 3`.
Zwykłe sformatowanie pliku (albo pierwszy `prettier`) zapala tę bramkę na czerwono bez żadnej regresji.

**Dlaczego NAPRAW, mimo że kierunek awarii jest bezpieczny.** REGUŁA dispatchu, tryb trzeci:
„Naprawa, która działa dziś i pęknie przy następnym przesunięciu kodu, nie jest naprawą. Zakotwicz
semantycznie." `[A4c]` to kod **dopisany w tej rundzie**, nie stan zastany, i pęknie przy najbliższym
przeformatowaniu tej linii. Bramka 2 dostała w tej samej rundzie kotwiczenie odporne na przesunięcie
(F6 to potwierdza) — bramka 1 ma dostać taki sam standard.

**Co i gdzie poprawić:** w `[A4c]` zastąpić „ten sam wiersz" zakresem samej własności
`closeAudience` — najprościej tą samą techniką dopasowania nawiasów, która działa już w bramce 2
(`cutBalancedCall`), albo `region('closeAudience:', …)` domkniętym na końcu wartości własności.
Dowód zamknięcia: mutacja typu F2 (kosmetyczne rozbicie na wiele linii) **nie** czerwieni bramki,
a mutacja typu E1 Evaluatora (zmiana nazwy klucza `closeAudience:` → `closeAudienceHook:`) nadal czerwieni.

### U3 — Evaluator zadeklarował 10 punktów §16a, udokumentował 7 · **ODDAL** (nota procesowa)

Brak śladu punktów 4 (trwały stan / parytet / ścieżki brzegowe), 7 (nakładanie się z drugim aktywnym
tematem) i 10 (N/D — temat nie jest dzielony na węzły). Sprawdziłem oba realne punkty sam:

- **pkt 4:** diff to dwie bramki `.cjs` i dwa raporty `.md`; zero `gra/src/**`, `gra/data/**`,
  zero kodu save/load, parytetu gracz–AI ani ścieżek brzegowych. Nie dotyczy.
- **pkt 7:** porównałem listę plików tego tematu z listami sześciu równoległych gałęzi
  (`git worktree list` → 11 aktywnych worktree). **Zero przecięcia na poziomie pliku.** Istotny był
  `autobot/P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1`, który rusza **70 plików `gra/tools/`** — ale
  **żadnego z naszych dwóch** (sprawdzone `git diff <merge-base>..<gałąź> --name-only | grep`).

Nic nie znalazłem, więc zarzutu nie ma. Zostaje nota: przy pustej liście zarzutów §16b pkt 3 każe
mi sprawdzić kompletność, a deklaracja „wszystkich 10 punktów" bez śladu trzech z nich zmusza
Final Control do powtórzenia pracy Evaluatora.

### U4 — trzy zastane czerwone bramki bez pomiaru na aktualnym `origin/main` · **ODDAL** (blokada do osobnych tematów)

Potwierdzone przeze mnie liczby: 57/58, 9/1, 22/26. Niesprawczość tego tematu udowodniona zakresem
(sekcja D) — to wystarcza, żeby nie blokować tej rundy. Pomiar na `094be1db` nie został wykonany
przez nikogo; ma być pierwszym krokiem trzech osobnych tematów, nie przypisem w tym raporcie.

### U5 — bramki `*-real-render-*` piszą do `runs/*/dowody/` cudzych tematów · **ODDAL** (osobny temat, §16b pkt 4)

Zreprodukowałem: mój przemiat rodziny zmodyfikował **15 śledzonych PNG** w pięciu cudzych katalogach
`runs/*/dowody/` i utworzył jeden nieśledzony
(`P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1/dowody/render.png`, z
`diplomacy-przemarsz-duplikat-real-render-test.cjs`). Wszystko przywrócone kopią blobu z `HEAD`,
plik nieśledzony usunięty, drzewo czyste. To właściwość zastana repo, nie tego diffu — ale §16b pkt 4
zabrania zostawiać takiej uwagi w raporcie: **musi zostać zarejestrowana jako osobny temat**
(pokrewny `P-IZOLACJA-DWOCH-PISARZY-JEDEN-WORKTREE`), bo dziś każde uruchomienie bramki rodziny
brudzi drzewo cudzego tematu i psuje jego GUARD IZOLACJI.

### U6 — numeracja etykiet `[A4a]`–`[A4f]` · **ODDAL** (kosmetyka, do wzięcia przy okazji U1/U2)

Brak `[A4d]`; `[A4a]`, `[A4b]` i `[A4c]` mają po dwie różne asercje. Zero wpływu na czerwienienie;
skoro plik i tak wraca do Operatora, etykiety wypada przy okazji rozdzielić.

## 6. Agregat

`NAPRAW`: **U1, U2** → §3c pkt 3 i §16b pkt 8: **choć jeden `NAPRAW` → `FAIL`**. Temat wraca do
Operatora na tym samym ID i tej samej gałęzi, runda 2/5. Obie poprawki mieszczą się w pozycji 1
allowlisty (`gra/tools/diplomacy-audience-close-flush-test.cjs`) i **nie wymagają dotknięcia
`gra/src/**`** — jeśli Operator uzna inaczej, to jest `DECISION_REQUIRED`, nie cichy wyjątek.

Bramka 2 (`dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs`) jest **zamknięta i nie wraca**:
zielona, kotwiczenie semantyczne, przeżywa niewinne przesunięcie (F6), czerwieni realną regresję (F5).
Runda 2 ma nie ruszać tego pliku.

## KONTRAKT

STATUS: FAIL
DOMAIN: INFRA
TEMAT: P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1
GOAL: Obie bramki zielone i mierzące to, co miały mierzyć — nie zielone przez rozluźnienie.
ZMIANY/COMMIT: bez zmian w kodzie i bramkach; wyłącznie ten raport. Oceniany stan: HEAD `4e670ee6`, baza/merge-base `ee1f6756`, diff = 4 pliki, wszystkie w allowliście.
TESTY: bramka 1 45/0 · bramka 2 23/0 (zero PRZERWANE) · tsc exit 0 · logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 · combat 6/6 · rodzina dyplomacji: własny przemiat 72 plików, 69 zielonych / 3 czerwone (57/58, 9/1, 22/26) · 8 własnych mutacji, każda cofnięta kopią pliku, po każdej `git diff --quiet` czyste
WERDYKTY: zarzutów Evaluatora brak (lista pusta, Obrona niewymagana — §3c pkt 1). Własne znaleziska: U1 NAPRAW · U2 NAPRAW · U3 ODDAL · U4 ODDAL · U5 ODDAL · U6 ODDAL
BLOKADY: 3 zastane czerwone bramki rodziny dyplomacji (niesprawcze dla tego tematu, do trzech osobnych tematów, każdy zaczyna od pomiaru na aktualnym `origin/main` `094be1db`) · bramki `*-real-render-*` nadpisują dowody cudzych tematów — osobny temat (U5)
RUNDY: 1/5 zamknięta werdyktem FAIL; następna to 2/5
NASTĘPNY KROK: Operator runda 2 — wyłącznie U1 i U2 w `gra/tools/diplomacy-audience-close-flush-test.cjs`; bramki 2 nie ruszać
DEPLOY/PUSH: NIE WYKONANO
