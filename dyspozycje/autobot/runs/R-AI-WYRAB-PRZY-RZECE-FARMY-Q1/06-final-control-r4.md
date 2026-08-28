# 06 — FINAL CONTROL, runda 4: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1

MODEL+EFFORT: Opus 5, effort high
WORKTREE: `/home/user/wt-fc-ai-r4` (detached na `f8602ab3`), pomocniczy `/tmp/fc4-main` (`origin/main` 35aa8add).
OCENIANE: gałąź `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R4`.

---

## 1. OBOWIĄZKOWA KONTROLA PROCEDURALNA — ZIELONA

`git fetch origin autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R4` + `git log --oneline`:

| SHA | rola | opis |
|---|---|---|
| `f8602ab37705e29358f8d87d12c5c54d00b91e65` | Evaluator r4 | FAIL — luka save/load Zasady 3 + kryterium 5 |
| `6bbefe847d6e2bb5973593c83e5683ddd203cdbc` | Operator r4 | Zasady 1/2/3 + R4-Q2 |
| `83f3e766` | merge | wciąga CAŁĄ, nigdy nie zintegrowaną rundę 3 |
| `27be570566b2974ba399ec1e7115840469c67ccf` | dispatch r4 | merge-base z `origin/main` |

- `origin/autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R4` = `f8602ab3` — **zdalne i lokalne zgodne**.
- `git status --porcelain` w moim worktree, w `/home/user/wt-op-ai-r4` (Operator) i w
  `/home/user/wt-ev-ai-r4` (Evaluator): **puste we wszystkich trzech**. Praca niezacommitowana
  = **BRAK**. Bloker proceduralny nie występuje.
- `git diff --check` od merge-base do HEAD: **czysto** (zero błędów białych znaków).

## 2. GRANICE §9 — SPRAWDZONE NIEZALEŻNIE, ZIELONE

Filtr **odwrotny** allowlisty (wszystko, co NIE pasuje do siedmiu wzorców dispatchu),
43 pliki od merge-base `27be5705`:

```
git diff --name-only 27be5705 HEAD | grep -vE '^(gra/src/game/(ai|auto-improvements|cities)\.ts|gra/src/main\.ts|gra/src/ui/buildModeHud\.ts|gra/tools/|dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/)'
→ PUSTO
```

Zakazane ścieżki (`gra/data/**`, `dyspozycje/WERSJE.md`, `gra/src/map/improvement-build.ts`):
**zero trafień**. Rozbicie: 31 plików do commitu Operatora, +12 dołożonych przez Evaluatora
(liczba 31 z raportu Evaluatora jest liczbą do commitu Operatora, nie do HEAD — obie są prawdziwe,
podaję rozbicie, żeby integrator nie widział rozbieżności).

Build wyłącznie dozwoloną komendą, `--outDir /tmp/civ-dist-ai-r4-fc`. Zero `npm run *`, zero `npx`,
zero `git add -A`, zero pushu do `main`.

## 3. BRAMKI — WŁASNĄ RĘKĄ, Z `gra/`, W `timeout`

Pięć referencyjnych: logic **213/213** · tech-tree **19/0** · research **33/33** ·
unit-replace **13/13** · combat **6/6**. `tsc --noEmit` — **0 błędów**.
Build vite → `/tmp/civ-dist-ai-r4-fc` — **OK, 19,87 s**.

Bramka rundy 3 `ai2-heks-po-heksie-test` **35/0** · bramka rundy 4 `ai4-popyt-obywatele-test` **48/0**.
Bez pogorszenia: auto-improvements **45/0** · ai-improvements **52/0** · map-improvement-qualify
**117/0** · farma-nie-w-lesie **136/0** · oboz-lowiecki-las **91/0** · ulepszenia-praca-percent **28/0**.

`ai-praca-split-parity-test` **21/1** — **potwierdzam jako ZASTANE, i to mocniej niż poprzednicy**:
uruchomiłem tę bramkę na **bieżącym `origin/main` (35aa8add)**, nie na merge-base `27be5705`, i dostałem
identyczne 21/1 z tym samym testem 6/„Kontrakt 10% ulepszeń → 90% budynków". Regres nie pochodzi
z tej gałęzi i nie jest artefaktem starej bazy.

## 4. WERYFIKACJA DWÓCH BLOKAD EVALUATORA — OBIE POTWIERDZAM, JEDNĄ KORYGUJĘ CO DO ATRYBUCJI

**Z-3 (luka save/load Zasady 3) — POTWIERDZONA, PRZEŚLEDZONA DO KOŃCA ŁAŃCUCHA.**
`aiSurplusRedirectedOwners` (`main.ts:7495`) występuje w pliku cztery razy: deklaracja + trzy
w bloku Zasady 3 (28504/28506/28515). Zero wystąpień w snapshocie i w bloku `load`.
Stan, który blok **zapisuje**, jest trwały: `ownerDefaultPodzialPracy` idzie do save'a
(`main.ts:24920`) i wraca (`32274`). Domknąłem łańcuch skutku, którego nie było w żadnym raporcie:
`MAX_PODZIAL_PRACY_BUDYNKI_PERCENT = 100` (`cities.ts:419`) → `procentPuliImperiumZBudynkow(100) = 0`
(`cities.ts:470`) → `doPuli = 0` → **pula imperium AI CYWILIZACJI przestaje rosnąć w każdym mieście
z NIEPUSTĄ kolejką**. Ścieżka powrotu (`else if (redirected)`) jest bramkowana wyłącznie
niepersistowanym `Set`em, a `decideAIEconomySliders` porównuje się do równie niepersistowanego
`aiSliderStateByOwner` i pisze tylko przy `sliderDecision.changed` — **nie jest gwarantowaną naprawą**.
Zapis gry w turze z nadwyżką → po `load` AI CYWILIZACJI może zostać z `procentBudynki = 100`
na stałe. To jest realna, trwała regresja stanu gry. **Blokada zasadna.**

**Z-1 (kryterium 5 przy `onlyWorked = true`) — POTWIERDZONA CO DO ISTOTY, KOREKTA CO DO ATRYBUCJI.**
Potwierdzam mechanizm w kodzie: `hexAllowsKey` (`auto-improvements.ts`, pętla po miastach) jest
bramkowany **wyłącznie** przez `workedKeys`, czyli przez `getOnlyWorked(city)` — nie patrzy na
`focus`. Skoro ta runda zmienia `DEFAULT_ULEPSZENIA_ONLY_WORKED` na `true` (`cities.ts`), to
w KAŻDEJ nowej grze wszystkie cztery profile automatu GRACZA, nie tylko „zrównoważone", dostają
inny zbiór heksów niż przed rundą 4. Potwierdzam też drugą, subtelniejszą przyczynę wskazaną przez
Evaluatora dla profilu „infrastruktura": `plonoweWPromieniu` i licznik `have` FAZY 0 liczą się teraz
po `radiusHexes` (pełny promień) zamiast po zawężonym `candidateHexes` — bramka
`plonoweWPromieniu >= city.population` otwiera FAZĘ 0 **wcześniej** niż przed rundą 4 przy tym samym
ustawieniu.

**Korekta:** Evaluator napisał, że to są rzeczy, „których w raporcie Operatora nie ma". To jest
prawdziwe dla części „infrastruktura / `radiusHexes`", ale **nieprawdziwe dla części `onlyWorked`** —
Operator zgłosił ją wprost, w NOCIE pod kryterium 5 („Zasada 2 (`onlyWorked` domyślnie włączone)
**dotyczy wszystkich czterech profili**"). Znalezisko zostaje blokujące (bo właściciel tej zmiany
nie zatwierdził), ale nie jest przemilczeniem Operatora i tak trzeba je zapisać w rejestrze.

## 5. ZNALEZISKA WŁASNE — SPOZA OBU POPRZEDNICH RAPORTÓW

Dispatch punkt 4 wymaga co najmniej jednego. Mam trzy; dwa pierwsze uważam za blokujące
niezależnie od blokad Evaluatora.

### FC-1 (BLOKUJĄCE) — Zasada 2 NIE dotknęła ręcznego przycisku „buduj" gracza, a ECHO i dispatch tego wymagają wprost

ECHO właściciela 2026-08-27, dosłownie: „**Gracz musi nacisnąć przycisk «buduj» tylko w miejscach,
gdzie są obywatele.**" Dispatch powtarza to w treści Zasady 2: „Dla gracza — przycisk «buduj» ma
działać tylko w takich miejscach."

Zmiana dotyka **wyłącznie** `pickAutoImprovements`, czyli AUTOMATU. Ścieżka ręcznego kliku gracza
to `applyBuildRequest` (`main.ts:11650`) za bramką `assertPlayerTerritoryForBuild`
(`main.ts:11627`). Przeczytałem obie w całości na tej gałęzi: **nie ma tam ani jednego odwołania
do heksów obrabianych przez obywateli** — jedyne warunki to terytorium gracza (+ wyjątek
fort/posterunek przy własnej jednostce) i bramki `buildImprovementQualifier`. `workedHexCoordsForCity`
w `main.ts` pojawia się w trzech miejscach (499 import, 6617, 27274) i żadne z nich nie jest ścieżką
ręcznej budowy. Po tej rundzie gracz nadal klika „buduj" na dowolnym własnym heksie bez obywateli.

**Ani raport Operatora, ani raport Evaluatora nie wspomina ręcznego przycisku ani jednym słowem**
(grep po obu plikach: zero trafień na „ręczn", „przycisk buduj", „manualn" poza `okolicaTryb:'reczny'`
w opisie fikstury). To nie jest znalezisko „zgłoszona interpretacja" — to część reguły właściciela,
która wypadła z zakresu bez śladu w rekordzie. Kryteria końca dispatchu jej nie mierzą (kryterium 3
mówi o „budowanych ulepszeniach" AI), więc formalnie da się bronić wąskiego czytania — ale §14
wymaga, żeby zawężenie zakresu było **zgłoszone**, a nie milczące. **Wymaga pytania ABC**: czy
ręczny klik gracza ma zostać zabramkowany do heksów z obywatelami (ze złożami jako wyjątkiem), czy
reguła dotyczy tylko automatu.

### FC-2 (BLOKUJĄCE) — Zasada 3 przesuwa Pracę także MIASTOM-PAŃSTWOM, bez wyłączenia `defensiveCopy`

Blok Zasady 3 (`main.ts:28482–28530`) stoi w pętli po **wszystkich** ownerach AI i nie sprawdza
`defensiveCopy`. Prześledziłem, że kopie obronne faktycznie przez niego przechodzą:

1. `main.ts:27623` ustawia `defensiveCopy: typCityCopyOwners.has(ownerId)` **w tym samym obiekcie
   `opts`**, który niesie `improvementSurplusReport` (`main.ts:27664`).
2. `ai.ts:2444` — `if (opts.defensiveCopy) return decideDefensiveCopyTurn(...)`.
3. `ai.ts:3066` — `decideDefensiveCopyTurn` woła `planCityImprovements`, czyli ten sam picker,
   który wypełnia raport nadwyżki (sam Operator odnotował dwie ścieżki wołania w komentarzu
   `ai.ts:2000`).
4. Powrót do `main.ts:28504` — `surplusRep?.surplus` jest wypełnione **także dla miasta-państwa**,
   więc `ownerDefaultPodzialPracy` i `podzialPracy` wszystkich jego miast lecą na 100 % budynków.

Kontrast jest w **tym samym pliku, kilkanaście linii niżej**: blok CUDA-AI zaraz za Zasadą 3 ma
jawny komentarz „miasta-państwa/kopie (opts.defensiveCopy) WYKLUCZONE". Wzorzec wyłączania kopii
obronnych jest w tym kodzie standardem (`ai.ts:976, 991, 1151, 1289, 1351, 2115, 2205`) — Zasada 3
go nie użyła. GOAL punkt 3 mówi o **AI CYWILIZACJI**; miasto-państwo nie jest cywilizacją i ma
własną, obronną ekonomię. To jest poszerzenie zakresu wobec §14 — niezgłoszone w żadnym raporcie.

### FC-3 (obserwacja, NIE blokuje) — wyjątek złożowy obejmuje też złoża ŻYWNOŚCIOWE, nie tylko surowce

ECHO właściciela definiuje wyjątek jako „**surowce**, które mogą znajdować się w różnych miejscach
według potrzeby". Zaimplementowany wyjątek to `hexHasDepositReserve(hex) && depositAllowsPlayerImprovement(key, hex)`
(`improvement-build.ts:525, 532`), a `depositAllowsPlayerImprovement` zwraca `true` również dla
`bydlo` (`ZlozeBydla`), `owce` (`ZlozeOwiec`), `lama` (`ZlozeLamy`) i `oboz_lowiecki` (las) — czyli
dla ulepszeń **żywnościowych**. Skutek jest widoczny w liczbach obu poprzedników: złoża poza
obywatelami rosną z 46 (PRZED) do 105 (PO) u Evaluatora i wynoszą 40/40 u Operatora. Uważam tę
interpretację za rozsądną (złoże to złoże), ale jest to interpretacja szersza niż litera ECHO
i nie została w rekordzie nazwana. Do rejestru, nie do blokady.

**Retrakcja własnej hipotezy — zapisuję, bo sprawdziłem i się myliłem.** Podejrzewałem oscylację
o okresie 2 tur: przekierowanie zeruje pulę → picker odpada na `pracaAvailable <= pracaSurplusGate`
(`ai.ts:1985`) → raport zostaje świeży (`surplus:false`) → blok przywraca podział → i tak w kółko.
**Nie występuje**: `aiPracaPoolByOwner` jest **skumulowana** (`main.ts:26969, 26991` dodają do
poprzedniej wartości), więc po przekierowaniu pula nie spada do zera, tylko przestaje rosnąć.
Podaję to jawnie, żeby runda 5 nie ścigała nieistniejącego błędu.

**Potwierdzam natomiast Z-6 Evaluatora niezależnie:** `pracaImperialPoolGain` (`production.ts:1935`)
zwraca `queueEmpty ? doPuli + doBudynkow : doPuli`. Przy **pustej kolejce produkcji** całość Pracy
idzie do puli imperium **niezależnie od `procentBudynki`** — czyli dla AI z pustą kolejką Zasada 3
jest bezskuteczna, a jej jedynym efektem zostaje ryzyko z Z-3. To wzmacnia Z-3, nie osłabia.

## 6. CO POTWIERDZAM PO STRONIE PRACY OPERATORA

Praca jest merytorycznie mocna i w większości ma dowód. Potwierdzam własną ręką: pięć bramek
referencyjnych, `tsc`, build, bramkę rundy 3 (35/0, bez utraty ani jednej asercji rundy 3),
bramkę rundy 4 (48/0), siedem bramek bez pogorszenia, czysty filtr odwrotny allowlisty, zerowe
zmiany w `gra/data/**`, `improvement-build.ts` i `WERSJE.md`, jawnie zgłoszone przez Operatora
cztery BRAKI DOWODU (§13a) oraz jawnie zgłoszone rozstrzygnięcie o `wyrab` w KROKU 0. Evaluator
domknął za Operatora blokadę 3 (weryfikacja przycisków w prawdziwym Chromium, 15/0) — to
akceptuję jako spełnienie kryterium 6 w części UI.

Potwierdzam też ostrzeżenie obu poprzedników: **merge tej gałęzi wnosi do `main` całą, nigdy nie
zintegrowaną rundę 3 (`83f3e766`)**. To musi być świadoma decyzja integratora, nie skutek uboczny.

## 7. WERDYKT

Runda 4 **nie przechodzi**. Cztery niezależne powody, każdy wystarczający:
Z-3 (trwała regresja stanu po save/load), Z-1 (zmiana zachowania trzech profili, których dispatch
kazał nie ruszać), FC-1 (część reguły właściciela wypadła z zakresu bez śladu), FC-2 (poszerzenie
zakresu na miasta-państwa wbrew §14).

**To jest runda 4 z 5. Temat wraca do Operatora na rundę 5 — OSTATNIĄ możliwą.** Po rundzie 5
nie ma kolejnej: albo temat wychodzi zielony, albo idzie do właściciela jako
`LIMIT-5-EXCEEDED` / `DECISION_REQUIRED`.

**Dla rundy 5 — kolejność, w jakiej to widzę:**
1. Z-3: persist `aiSurplusRedirectedOwners` albo (prościej i odporniej) wyprowadzić „czy jestem
   przekierowany" z porównania faktycznego `ownerDefaultPodzialPracy` z `aiSliderStateByOwner`
   zamiast z osobnego, ulotnego `Set`u. Do tego test save→load w turze z nadwyżką.
2. FC-2: dopisać `if (typCityCopyOwners.has(ownerId)) { … }` / wyłączenie `defensiveCopy` w bloku
   Zasady 3, wzorem sąsiedniego bloku CUDA-AI, + asercja w bramce tematu.
3. Z-1 i FC-1 to **pytania ABC do właściciela**, nie kod — Operator rundy 5 nie powinien ich
   rozstrzygać sam:
   - **ABC-A:** `onlyWorked` domyślnie `true` zmienia zachowanie także trzech profili
     („żywność", „surowce", „infrastruktura"), których dispatch kazał nie ruszać. Zostawić
     (jedna reguła dla wszystkich), czy domyślkę `true` zawęzić do „zrównoważone" + AI CYWILIZACJI?
   - **ABC-B:** czy ręczny przycisk „buduj" gracza ma być zabramkowany do heksów z obywatelami
     (ze złożami jako wyjątkiem), zgodnie z literą ECHO, czy reguła dotyczy tylko automatu?

---

```
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (Final Control, runda 4/5)
GOAL: AI CYWILIZACJI i AI GRACZA (profil „zrównoważone") budują domyślnie samą żywność; niedobór
      surowca otwiera resztę listy na czas jego trwania; budowa poza złożami tylko na heksach
      obrabianych przez obywateli; nadwyżka → AI CYWILIZACJI przesuwa środki na budynki, AI GRACZA
      wyłącznie sygnalizuje; R4-Q2=C — przełącznik „wolno wycinać las" dla automatu GRACZA
      (państwo + miasto, domyślnie wyłączony).
ZMIANY/COMMIT: oceniana gałąź `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R4` @ `f8602ab3`
      (Operator `6bbefe84`, Evaluator `f8602ab3`, merge rundy 3 `83f3e766`, merge-base `27be5705`).
      43 pliki od merge-base (31 Operator, 12 Evaluator); filtr ODWROTNY allowlisty PUSTY;
      zero zmian w `gra/data/**`, `gra/src/map/improvement-build.ts` i `dyspozycje/WERSJE.md`;
      `git diff --check` czysto; wszystkie trzy worktree (`wt-op-ai-r4`, `wt-ev-ai-r4`,
      `wt-fc-ai-r4`) czyste — praca JEST w commitach.
      Final Control dokłada wyłącznie ten raport
      (`dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/06-final-control-r4.md`);
      zero zmian w kodzie produkcyjnym i w narzędziach.
TESTY: pięć bramek referencyjnych własną ręką z `gra/`, w `timeout`: logic 213/213, tech-tree 19/0,
      research 33/33, unit-replace 13/13, combat 6/6. `tsc --noEmit` 0 błędów. Build
      `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ai-r4-fc --emptyOutDir`
      OK (19,87 s). Bramka rundy 3 `ai2-heks-po-heksie-test` 35/0; bramka rundy 4
      `ai4-popyt-obywatele-test` 48/0. Bez pogorszenia: auto-improvements 45/0, ai-improvements 52/0,
      map-improvement-qualify 117/0, farma-nie-w-lesie 136/0, oboz-lowiecki-las 91/0,
      ulepszenia-praca-percent 28/0. ZASTANY CZERWONY: `ai-praca-split-parity-test` 21/1 —
      zweryfikowany przeze mnie na BIEŻĄCYM `origin/main` (35aa8add) w osobnym worktree
      `/tmp/fc4-main`: identyczne 21/1, ten sam test. Nie regres tej gałęzi.
BLOKADY:
      1. Z-3 (Evaluator, potwierdzona i doprowadzona do końca łańcucha): `aiSurplusRedirectedOwners`
         (`main.ts:7495`) nie jest persistowany, a stan, który blok Zasady 3 zapisuje
         (`ownerDefaultPodzialPracy`, `main.ts:24920/32274`), JEST. Po save/load w turze z nadwyżką
         AI CYWILIZACJI może zostać na `procentBudynki=100` na stałe →
         `procentPuliImperiumZBudynkow(100)=0` → zero Pracy do puli imperium → zero ulepszeń terenu.
      2. Z-1 (Evaluator, potwierdzona co do istoty; KOREKTA atrybucji): `DEFAULT_ULEPSZENIA_ONLY_WORKED
         = true` + `hexAllowsKey` niepatrzące na `focus` zmieniają zachowanie WSZYSTKICH czterech
         profili automatu GRACZA, nie tylko „zrównoważone"; profil „infrastruktura" zmienia się
         dodatkowo przez przeniesienie liczników FAZY 0 na `radiusHexes`. Część `onlyWorked` była
         zgłoszona przez Operatora (NOTA pod kryterium 5) — Evaluator napisał, że jej w raporcie nie
         ma; część `radiusHexes` faktycznie zgłoszona nie była.
      3. FC-1 (WŁASNE, spoza obu raportów): ręczny przycisk „buduj" gracza NIE jest zabramkowany do
         heksów z obywatelami. `applyBuildRequest` (`main.ts:11650`) i `assertPlayerTerritoryForBuild`
         (`main.ts:11627`) nie mają żadnego odwołania do pól obrabianych. ECHO właściciela i treść
         Zasady 2 w dispatchu wymagają tego wprost; żaden z dwóch raportów nie wspomina o tym
         ani słowem.
      4. FC-2 (WŁASNE, spoza obu raportów): blok Zasady 3 (`main.ts:28482`) nie wyłącza
         `defensiveCopy`, więc przesuwa Pracę na budynki także MIASTOM-PAŃSTWOM. Ścieżka:
         `main.ts:27623` (`defensiveCopy` w tym samym `opts` co `improvementSurplusReport`) →
         `ai.ts:2444` → `ai.ts:3066` (`planCityImprovements`) → raport wypełniony → `main.ts:28504`.
         Sąsiedni blok CUDA-AI wyklucza kopie obronne jawnie. Poszerzenie zakresu wobec §14.
      5. FC-3 (obserwacja, nie blokuje): wyjątek złożowy obejmuje też złoża ŻYWNOŚCIOWE
         (`bydlo`/`owce`/`lama`/`oboz_lowiecki` w `depositAllowsPlayerImprovement`), a ECHO mówi
         o „surowcach". Interpretacja rozsądna, ale nienazwana w rekordzie.
      6. Zastane, potwierdzone: merge tej gałęzi wnosi do `main` całą, nigdy nie zintegrowaną
         rundę 3 (`83f3e766`) — decyzja integratora, nie skutek uboczny.
      7. BRAK DOWODU (§13a), przenoszę bez zmian: efekt Zasady 3 w kolejce produkcji prawdziwej
         rozgrywki nie zmierzony; wpływ Zasady 2 na siłę AI CYWILIZACJI w dłuższej grze nie
         zmierzony (spadek rozkazów 600→193 / 800→347 jest zamierzony, ale jego skutek strategiczny
         nikt nie zmierzył); Z-6 (pusta kolejka → `pracaImperialPoolGain` oddaje całość do puli mimo
         `procentBudynki=100`, więc Zasada 3 jest tam bezskuteczna) potwierdzam, ale w rozgrywce
         nie zmierzyłem, jak często AI ma pustą kolejkę.
RUNDY: 4/5 — po tej rundzie została JEDNA, OSTATNIA (runda 5). Temat wraca do Operatora.
NASTĘPNY KROK: Operator, runda 5 (ostatnia) — napraw Z-3 i FC-2 w kodzie; Z-1 i FC-1 NIE
      rozstrzygaj sam, to dwa pytania ABC do właściciela (ABC-A: czy domyślne `onlyWorked=true`
      ma obejmować trzy pozostałe profile automatu gracza; ABC-B: czy ręczny przycisk „buduj" ma
      być zabramkowany do heksów z obywatelami). Orkiestrator zadaje oba w głównym czacie (C-043)
      RÓWNOLEGLE z pracą Operatora nad Z-3/FC-2, żeby nie spalić ostatniej rundy na czekanie.
DEPLOY/PUSH: NIE WYKONANO. Push wyłącznie gałęzi tematu
      (`git push origin HEAD:autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R4`); zero pushu do `main`,
      zero integracji, zero deployu.

GOTOWOSC DO INTEGRACJI: NIE — cztery blokady (Z-3 trwała regresja stanu po save/load; Z-1 zmiana
zachowania trzech profili, których dispatch kazał nie ruszać; FC-1 ręczny przycisk „buduj" poza
Zasadą 2 wbrew literze ECHO; FC-2 Zasada 3 obejmuje miasta-państwa bez wyłączenia `defensiveCopy`).
```
