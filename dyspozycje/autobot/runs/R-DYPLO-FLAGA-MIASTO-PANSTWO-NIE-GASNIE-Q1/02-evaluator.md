# RAPORT EVALUATORA — R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1 (runda 1)

**UWAGA NA POJĘCIA (reguła stała właściciela):** cały ten raport dotyczy **AI CYWILIZACJI**
— komputerowych przeciwników. **AI GRACZA** (automat wspierający gracza) nie jest w tym
temacie ani dotykana, ani mierzona. Gdziekolwiek niżej pada „AI", znaczy to AI CYWILIZACJI.

Worktree Evaluatora: `/home/user/wt-ev-flaga2` (detached na
`origin/autobot/R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1` = `ac4b9bfe`).
Worktree punktu odniesienia: `/home/user/wt-ev-flaga2-main` (detached na czystym
`origin/main` = `27be5705`).

---

## 0. Zakres, allowlista, granice — filtr odwrotny

```
merge-base(origin/main, galaz) = 27be570566b2974ba399ec1e7115840469c67ccf
origin/main                    = 27be570566b2974ba399ec1e7115840469c67ccf   (identyczne — brak rozjazdu)
galaz HEAD                     = ac4b9bfe7ac91299e23b52787558af522583387f
```

`git -c core.quotePath=false diff --stat <merge-base> <galaz>` — 8 plików, **każdy w allowlistie**:

| plik | +/- | w allowlistie |
|---|---|---|
| `gra/src/game/display-names.ts` | +35 | tak |
| `gra/src/main.ts` | +18/-1 | tak |
| `gra/tools/flaga-mp-nie-gasnie-test.cjs` | +265 | tak (`gra/tools/**`) |
| `gra/tools/flaga-mp-op.cjs` | +207 | tak |
| `gra/tools/flaga-mp-op.vite.config.ts` | +250 | tak |
| `gra/tools/flaga-mp-diag.cjs` | +85 | tak |
| `gra/tools/flaga-mp-diag.vite.config.ts` | +231 | tak |
| `dyspozycje/autobot/runs/.../01-operator.md` | +259 | tak |

**Poza allowlistą: NIC.** Sprawdzone osobno i potwierdzone:

- `gra/src/map/improvement-build.ts` — **nietknięty** (granica: równoległy temat farmy).
- `gra/data/terrain-improvements.json` — **nietknięty**.
- `dyspozycje/WERSJE.md` — **nietknięty**.
- `origin/main` stoi na `27be5705`, merge-base = `origin/main` → **nie było pushu do main**.
- `git diff --check` między merge-base a HEAD — **czysto**.
- `git status` w worktree Operatora (`/home/user/wt-op-flaga`) — **pusty**; obie zmiany
  (`6e7f8b10` kod, `ac4b9bfe` raport) **są w commitach** na gałęzi tematu, nie luzem.
- `--outDir` unikalny per rola: Operator `/tmp/civ-dist-flaga-op*`, ja `/tmp/civ-dist-flaga-ev*`.
  Kolizji nie ma.

---

## 1. Czytanie kodu — kompletność inwentaryzacji ścieżek przejęcia miasta

Nie przyjąłem listy Operatora. Odtworzyłem ją własnym przeszukaniem **wszystkich** przypisań
`ownerId` w `gra/src/`:

```
src/game/fort-territory.ts:165   f.ownerId = newCity.ownerId;     -> FORT, nie miasto
src/game/post-battle-map.ts:485  city.ownerId = atkOwner;         -> podboj zbrojny
src/main.ts:12460                city.ownerId = newOwner;         -> kapitulacja glodowa
src/main.ts:23707                city.ownerId = annexerId;        -> wchloniecie pokojowe
src/main.ts:26768                city.ownerId = REBEL_FACTION_OWNER_ID;  -> rebelia
```

To są **wszystkie** miejsca, w których miasto zmienia właściciela. Weryfikacja każdego:

1. **`post-battle-map.ts:485`** — `applyCityCaptureAfterBattle`. Hak `onOwnerChanged` woła się
   w linii 492, czyli **po** `city.ownerId = atkOwner` (485). `applyCityCaptureAfterBattle` ma
   w całym repo **jednego** wołającego: `main.ts:24104` wewnątrz `applyCityCaptureToMap` — i to
   właśnie tam Operator wpiął gaszenie. `applyCityCaptureToMap` ma dwóch wołających:
   `main.ts:23283` (bitwa polowa o miasto **i** szturm oblężniczy, gałąź
   `allowCityCapture || siegeContext`) oraz `main.ts:24271` (`captureCityWithoutBattle` —
   wejście do pustego miasta). **Wszystkie trzy wejścia zbrojne pokryte jednym hakiem.**
2. **`main.ts:12460`** — `resolveSiegeSurrender`, gaszenie tuż po przypisaniu. Pokryte.
3. **`main.ts:23707`** — `annexCityStateToOwner`, gaszenie w pętli po miastach. Pokryte.
   Sprawdziłem osobno zarzut „brak `markCityStateDirty()` na tej ścieżce": **nie jest to
   defekt** — funkcja woła `markCityStateDirty()` po pętli (linia 23721), więc unieważnienie
   cache i tak następuje.
4. **`main.ts:26768`** — rebelia. Pominięta **słusznie**, i to z **dwóch** niezależnych powodów,
   które sprawdziłem sam: (a) `isOwnerClusterCityState` zwraca `false` dla `ownerId <= 0`, więc
   frakcja rebeliantów (`-99`) nie może się zarazić; (b) gałąź w ogóle odpala się **wyłącznie**
   dla `city.ownerId === 0` (miasta **gracza**) — miasto AI nigdy tą drogą nie przechodzi.

**Wniosek: inwentaryzacja Operatora jest kompletna. Nie znalazłem czwartej ścieżki.**

### Konsumenci `startCityState`, na których zmiana ma wpływ — sprawdzone osobno

| miejsce | skutek zmiany | ocena |
|---|---|---|
| `main.ts:5121` `cityIsCityState` (tooltip heksu) | zdobyte miasto traci opis „miasto-państwo" | **zgodne z wariantem A** (ECHO), nie defekt |
| `display-names.ts:171` `formatCityMapLabel` | zdobyte miasto traci dopisek na mapie | **zgodne z wariantem A**, pilnowane przez T7b |
| `main.ts:27666` `clusterStateTargets` | już zdobyte miasto-państwo znika z listy celów wchłaniania stolicy klastra | **poprawne** — jest już zdobyte |
| `main.ts:27313` `vassalizedCsOwnerIds` | bez zmiany — MP traci flagę dopiero razem z miastem, a wszystkie jego miasta spawnują z flagą | bez wpływu |
| `main.ts:31889/31906` rekonstrukcja legacy sejwu | **poprawa**: przed naprawą legacy-load dopisywał zdobywcę do `simplifiedDiplomacyOwners`/`typCityCopyOwners` na stałe; teraz nie | efekt uboczny **na plus**, pilnowany przez T8c |

---

## 2. WŁASNY POMIAR BEHAWIORALNY — inna metoda niż Operatora

**Nie powtórzyłem harnessu Operatora.** Zbudowałem własny:
`gra/tools/flaga-mp-ev.vite.config.ts` + `gra/tools/flaga-mp-ev.cjs`. Dwie różnice projektowe
są istotne:

1. **Zdarzenia zamiast migawki agregatu.** Operator mierzył `isOwnerClusterCityState` per owner
   w turze 20. Ja zapisuję w **każdej turze** stan **każdego miasta** (`{id, owner, cs}`) i
   sterownik sam, z diffu kolejnych tur, wykrywa **zdarzenie** „miasto zmieniło właściciela",
   po czym sprawdza, czy flaga zgasła. Sterownik **nie wie nic** o `clearCityStateFlagOnCapture`
   ani o tym, którą ścieżką poszło przejęcie — metoda jest identyczna dla PRZED i PO i nie
   wymaga instrumentowania ścieżek przejęcia. To test **ścieżki**, nie migawki.
2. **Ledger komend dyplomatycznych.** Dla każdej tury i każdego AI zapisuję komendy
   `wypowiedz_wojne` **przed** filtrem warstwy (`dipCmdsRaw`) i **po** nim (`dipCmdsLayered`)
   wraz z `dipLayer`.

Sondy **tylko czytają**; instrumentacja wyłącznie w pamięci buildu (`transform`), `gra/src/**`
i `gra/data/**` bajt w bajt nietknięte (`git status` czysty poza dwoma moimi nowymi plikami
w `gra/tools/`, czyli w allowlistie).

**PRZED mierzone na PRAWDZIWYM `origin/main`** (osobny worktree `/home/user/wt-ev-flaga2-main`),
nie na mutancie obecnego źródła. **Ziarna inne niż Operatora: 202 / 303 / 404**, plus **606**
jako celowa zakładka na wspólne ziarno. Po **46 tur** (osiągnięta tura 47), Playwright/Chromium,
**0 błędów strony** i **0 wymuszonych odblokowań (`unblock=0`) we wszystkich ośmiu przebiegach** —
pomiar nie jest artefaktem sterownika.

Główne cywilizacje (klasyfikacja niezależna od naprawy: owner, który nigdy nie był w
`simplifiedDiplomacyOwners` ani `typCityCopyOwners`) — we wszystkich ośmiu przebiegach
identyczne: **[1, 8, 15, 22, 29, 36]**.

### 2a. Kryterium 1 i 2 — potwierdzam, wynik zgodny z Operatorem

| pomiar w turze 20 | PRZED (`origin/main`) | PO (gałąź) |
|---|---|---|
| główne cywilizacje oznaczone jako miasto-państwo | **[1,8,15,22,29,36]** — 6/6, **wszystkie 4 ziarna** | **[]** — 0/6, **wszystkie 4 ziarna** |
| prawdziwe miasta-państwa nadal oznaczone | 36/36, 36/36, 36/36, 36/36 | **36/36, 36/36, 36/36, 35/35** |
| główne cywilizacje na liście potęg | **[]** | **[1,8,15,22,29,36]** |
| główne cywilizacje z wymuszonym symbolem kultury zamiast portretu | **[1,8,15,22,29,36]** | **[]** |

Ten sam obraz na końcu przebiegu (tura 47). **Prawdziwe miasta-państwa są nadal oznaczone
w 100% żywego zbioru w każdym przebiegu PO** — mechanizm nie został wyłączony, tylko przestał
zarażać zdobywcę.

**KRYTERIUM 1 — SPEŁNIONE. KRYTERIUM 2 — SPEŁNIONE. KRYTERIUM 4 — SPEŁNIONE.**

### 2b. Dowód ZDARZENIOWY (mocniejszy niż migawka Operatora)

To jest wynik, którego harness Operatora nie pokazuje, a który rozstrzyga temat wprost:

| ziarno | zdarzeń „przejęcie miasta z flagą MP" | PRZED: flaga ZOSTAŁA | PRZED: ZGASŁA | PO: ZOSTAŁA | PO: ZGASŁA |
|---|---|---|---|---|---|
| 202 | 36 | **6** | 30 | **0** | 36 |
| 303 | 36 | **6** | 30 | **0** | 36 |
| 404 | 36 | **6** | 30 | **0** | 36 |
| 606 | 37 | **6** | 31 | **0** | 37 |

Rozbiór tych sześciu zdarzeń PRZED (ziarno 202, identycznie w pozostałych):

```
t6 city8  2->1     t6 city15  9->8     t6 city22 16->15
t6 city29 23->22   t6 city38 32->29    t6 city43 37->36
```

To są **przejęcia zbrojne w turze 6** — dokładnie te, które w `main` przenosiły flagę na
zdobywcę. Pozostałe 30–31 zdarzeń (tury 23+) to **wchłonięcia pokojowe**, które flagę gasiły
już przed tym tematem. Po naprawie **wszystkie** zdarzenia gaszą flagę.

Czyli: naprawa zmienia zachowanie **dokładnie na sześciu zdarzeniach zbrojnego przejęcia
i na niczym więcej**. To jest test ścieżki przejęcia, nie stanu końcowego.

### 2c. Kryterium 3 — realne wypowiedzenia wojny. SPEŁNIONE CO DO LITERY, NIE CO DO GOAL-a

| ziarno | wypowiedzenia AI↔AI PRZED | PO | tury i pary |
|---|---|---|---|
| 202 | 0 | **0** | — |
| 303 | 0 | **0** | — |
| 404 | 0 | **2** | t24 `15x22`, t29 `1x15` |
| 606 | 0 | **1** | t21 `36x1` |
| **razem** | **0** | **3** | |

Wszystkie trzy to **udowodnione wymuszone wojny epoki Kamienia**, nie przypadkowe wojny ogólne:
`stoneForceWarActiveByPairKey` dostaje klucze `"15_22"`, `"1_15"` (404) i `"1_36"` (606).

**Zero wypowiedzeń nie wystąpiło** — dispatch (§KRYTERIA 3: „Zero wypowiedzeń = FAIL")
jest więc spełniony co do litery. Ale 3 wypowiedzenia na 4 ziarna / 188 tur-ziaren i **2 ziarna
z zerem** to nie jest „wojna wymuszona epoki Kamienia **faktycznie wybucha w rozgrywce**"
z GOAL-a. Raportuję zgodnie z §13a: **cel osiągnięty częściowo**.

### 2d. Przyczyna — potwierdzam bloker `pre_contact` NIEZALEŻNIE, i mocniej

Ledger komend, sumy z czterech ziaren:

| | komendy `wypowiedz_wojne` wyprodukowane | przetrwały filtr warstwy |
|---|---|---|
| **PRZED** (`origin/main`) | **0** | 0 |
| **PO** (gałąź) | **532** | **3** |

Rozbicie PO na warstwy — **agregat z czterech ziaren**:

```
warstwa "full"        :  3 wyprodukowane,  3 przetrwaly   (100%)
warstwa "pre_contact" : 529 wyprodukowanych, 0 przetrwalo  (0%)
```

Na ziarnach 202 i 303 **wszystkie** komendy (162 + 162 = 324) padły w warstwie `pre_contact`
i **żadna** nie przeszła. Owner-po-ownerze: w warstwie `pre_contact` byli **wszyscy sześciu**
głównych; w warstwie `full` tylko ci nieliczni, których gracz zdążył odkryć.

**Rozstrzygająca korelacja.** Zestawiłem zbiór AI odkrytych przez **człowieka** we mgle wojny
na koniec przebiegu ze zbiorem AI, które faktycznie wypowiedziały wojnę:

| ziarno | główne AI odkryte przez gracza | AI, które wypowiedziały wojnę |
|---|---|---|
| 202 | `[]` | `[]` |
| 303 | `[]` | `[]` |
| 404 | `[1, 15]` | `[1, 15]` |
| 606 | `[1, 36]` | `[1]` (przeciw 36) |

**Zbiór wypowiadających = zbiór odkrytych, we wszystkich czterech ziarnach.** Wojna między
dwiema cywilizacjami komputerowymi wybucha **wtedy i tylko wtedy**, gdy człowiek zdążył
odkryć napastnika.

Potwierdzenie w kodzie, przeczytane przeze mnie od zera:
`main.ts:28250` → `filterDiplomacyCommandsForLayer(cmds, dipLayer)`;
`diplomacy-layers.ts:265` → `if (layer === 'pre_contact') return [];`;
`diplomacy-layers.ts:249-254` → `if (!contactedOwners.has(ownerId)) return 'pre_contact';`;
`main.ts:27514` → `const contactedOwners = getDiplomaticContacts();`;
`main.ts:16090-16099` → `getDiplomaticContacts()` zwraca `diplomaticallyDiscoveredOwners`,
budowane przez `computeDiplomaticContacts(visible, cities, units)` z domyślnym
`playerOwnerId = 0`, czyli **z pola widzenia GRACZA**.

**Teza Operatora potwierdzona niezależnie i na większej próbie (532 komendy vs 71).**

Potwierdzam też, że to **nie** jest warunek wojny ogólnej z `ai.ts:4377-4384` — ścieżka
wymuszona wychodzi z `decideAIDiplomacy` wcześniej (`ai.ts:4158-4172`) i tego warunku nigdy
nie dotyka. To osobny, trzeci bloker. **Operator słusznie go nie ruszył (§14).**

**Informacja dla orkiestratora:** gdyby właściciel wybrał wariant A, poprawka jest wykonalna
**w całości wewnątrz `gra/src/main.ts`** (miejsce wołania filtru, linia 28250) — czyli w pliku
**już będącym w allowlistie tego tematu**. Zmiana `diplomacy-layers.ts` nie jest konieczna.

Popieram pytanie ABC z §3 raportu Operatora bez zmian w treści.

### 2e. Zakładka na ziarno 606 — zgodność dwóch niezależnych harnessów

Operator na ziarnie 606 zmierzył 1 wypowiedzenie, para AI36↔AI1, klucz `stoneForceWarActiveByPairKey`
= `"1_36"`. Ja na tym samym ziarnie, **własnym harnessem**: 1 wypowiedzenie, para `36x1`,
klucz `"1_36"`. **Para i mechanizm zgodne.**

**Rozbieżność do odnotowania (§13a):** Operator podaje turę **28**, ja mierzę turę **21**
(komenda przeszła filtr w turze 20, para pojawia się w migawce tury 21). Sterowniki różnią się
liczbą wywołań `page.evaluate` na turę, a gra rozjeżdża się między przebiegami (widać to też
w liczbie włączeń „Zwiedzaj": 202 → PRZED 4 / PO 2). **Numery tur w playteście traktować jako
orientacyjne, nie jako wartości odtwarzalne co do tury.** Nie podważa to żadnego wniosku —
zgodne są para, mechanizm i kierunek zmiany.

---

## 3. Kryterium 5 — własna bateria mutacyjna (nie ufam liczbie 11/29 z raportu)

Uruchomiłem **własne, celowane mutacje** na `display-names.ts` i `main.ts`, każdą osobno, po
każdej przywracając źródło (`git status` po wszystkim: czysty poza moimi dwoma plikami w
`gra/tools/`):

| mutacja | wynik bramki `flaga-mp-nie-gasnie-test.cjs` | zaczerwienione |
|---|---|---|
| **EVM1** `clearCityStateFlagOnCapture` = no-op | 22 PASS / **9 FAIL** | T2a, T2b, T4b, T5b, T6b, T7b, T8a, T8c, T9b |
| **EVM2** podbój zbrojny: hak `onOwnerChanged` bez gaszenia | 30 PASS / **1 FAIL** | T11 |
| **EVM3** kapitulacja głodowa bez gaszenia | 30 PASS / **1 FAIL** | T12 |
| **EVM4** wchłonięcie pokojowe bez gaszenia | 30 PASS / **1 FAIL** | T13 |
| **EVM5** gaszenie bez guardu (przeregulowanie) | 29 PASS / **2 FAIL** | T9a, T9c |
| **EVM6b** zbiory spawnowe wyłączone (prawdziwe MP przestają być MP) | 29 PASS / **2 FAIL** | T3a, T5c |

**Każda z sześciu realnych mutacji zaczerwienia bramkę.** Bramka **nie jest tautologiczna** —
w szczególności EVM2/EVM3/EVM4 pokazują, że kanarek źródłowy pilnuje **każdej z trzech ścieżek
osobno**, a EVM6b, że warunek „nie wolno wyłączyć mechanizmu" jest realnie strzeżony.

**KRYTERIUM 5 — SPEŁNIONE.**

**Potwierdzam też uczciwość noty Operatora o T3c/T4c:** obie asercje pilnują promienia rażenia
(miasta *nietkniętego* miasta-państwa), a funkcja dostaje wyłącznie zdobywane miasto — żadna
mutacja jej ciała ich nie zaczerwieni. Moja EVM5 (najbliższa „przeregulowaniu") zaczerwienia
T9a/T9c, nie T3c/T4c. **To jest brak dowodu i tak został przez Operatora zaraportowany —
zgadzam się z tą klasyfikacją.**

### Znalezisko własne (nota, nie bloker): jedna anty-naprawa umyka bramce tematu

**EVM7:** usunięcie z `isOwnerClusterCityState` gałęzi
`if (opts?.cities?.some(c => c.ownerId === ownerId && c.startCityState)) return true;`
— czyli „naprawa" przez **wyłączenie mechanizmu**, wprost zakazana kryterium 2 dispatchu.

```
EVM7 -> flaga-mp-nie-gasnie-test : 31 PASS, 0 FAIL   <-- bramka tematu NIE lapie
EVM7 -> display-names-test       : 27 PASS, 0 FAIL   <-- nie lapie
EVM7 -> ai-war-gate-test         : 24 PASS, 0 FAIL   <-- nie lapie
EVM7 -> forced-war-stone-test    : 32 PASS, 0 FAIL   <-- nie lapie
EVM7 -> power-ranking-test       : FAIL (owner 2 = miasto-panstwo)   <-- LAPIE
```

Czyli **ochrona istnieje w zestawie** (`power-ranking-test`), ale **nie w bramce tego tematu**.
W scenie bramki oba miasta-państwa są jednocześnie w zbiorach spawnowych, więc usunięcie
gałęzi niczego tam nie zmienia. **Nota do rozważenia, nie warunek przejścia** — kryterium 2 jest
faktycznie strzeżone, tyle że przez sąsiednią bramkę.

---

## 4. Kryteria 6 i 7 — bramki, zmierzone własną ręką po OBU stronach

Uruchomiłem komplet **dwukrotnie**: na gałęzi tematu i na **czystym `origin/main`**
(`/home/user/wt-ev-flaga2-main`), żeby punkt odniesienia był mój, nie z raportu.

| bramka | `origin/main` (27be5705) | gałąź (ac4b9bfe) | pogorszenie |
|---|---|---|---|
| `logic-test` | 213/213 | **213/213** | nie |
| `tech-tree-test` | 19 pass / 0 fail | **19/0** | nie |
| `research-test` | 33/33 | **33/33** | nie |
| `unit-replace-test` | 13/13 | **13/13** | nie |
| `combat-test` | 6/6 | **6/6** | nie |
| `forced-war-stone-test` | 32/0 | **32/0** | nie |
| `forced-war-bronze-test` | **44/0** | **44/0** | nie |
| `forced-war-stone-main-guard-test` | 18/0 | **18/0** | nie |
| `forced-war-bronze-main-guard-test` | 25/0 | **25/0** | nie |
| `display-names-test` | 27/0 | **27/0** | nie |
| `power-ranking-test` | 10/0 | **10/0** | nie |
| `ai-war-gate-test` | 24/0 | **24/0** | nie |
| **bramka tematu** `flaga-mp-nie-gasnie-test` | (nie istnieje) | **31 PASS / 0 FAIL** | — |

- `node ./node_modules/typescript/bin/tsc --noEmit` — **0 błędów** na obu drzewach.
- Build: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-flaga-ev --emptyOutDir`
  — **OK, 848 modułów**.

**KRYTERIUM 6 — SPEŁNIONE. KRYTERIUM 7 — SPEŁNIONE.**

**Sprostowanie do dispatchu — potwierdzam własnym pomiarem na czystym `origin/main`:**
kryterium 7 podaje `forced-war-bronze` jako **18/0**; faktycznie `forced-war-bronze-test`
to **44/0**, a **18/0** daje `forced-war-stone-main-guard-test`. Błąd jest w dispatchu, nie
w pracy Operatora. Nota Operatora w tej sprawie jest trafna.

---

## 5. Bilans kryteriów końca

| # | kryterium | werdykt Evaluatora |
|---|---|---|
| 1 | dowód przyczyny PRZED (≥3 ziarna) | **SPEŁNIONE** — 6/6 głównych oznaczonych w T20, 4 ziarna, mierzone na prawdziwym `origin/main` |
| 2 | po zmianie: żadna główna nie oznaczona, prawdziwe MP nadal są | **SPEŁNIONE** — 0/6 głównych, 100% żywych MP nadal oznaczonych |
| 3 | realne wypowiedzenia wojny w rozgrywce | **CZĘŚCIOWO** — 3 wypowiedzenia / 4 ziarna (nie zero, więc nie literalny FAIL), ale 2 ziarna z zerem; GOAL nieosiągnięty przez bloker `pre_contact` poza allowlistą |
| 4 | lista potęg + portret władcy, PRZED/PO | **SPEŁNIONE** — `[]`→`[1,8,15,22,29,36]`, portrety `[1,8,15,22,29,36]`→`[]` |
| 5 | dowód nie-tautologiczny (mutacje) | **SPEŁNIONE** — 6/6 moich mutacji zaczerwienia; T3c/T4c bez dowodu, uczciwie zgłoszone przez Operatora |
| 6 | pięć bramek + `tsc` | **SPEŁNIONE** — brak pogorszenia wobec własnoręcznie zmierzonego `origin/main` |
| 7 | bramki wojny wymuszonej | **SPEŁNIONE** — `stone` 32/0, `bronze` 44/0, oba main-guardy bez zmian |

---

## 6. Werdykt

Zmiana jest **poprawna, kompletna w granicach swojej allowlisty, bez regresji i realnie
udowodniona behawioralnie** — potwierdziłem to własnym harnessem, własnymi ziarnami, na
prawdziwym `origin/main` jako punkcie odniesienia i własną baterią mutacyjną. Przyczyna
nazwana w dispatchu została usunięta i widać to **w rozgrywce**, na poziomie **zdarzeń
przejęcia miasta**, a nie tylko w bramce. **Nie ma czego zwracać Operatorowi.**

Nieosiągnięta pozostaje ostatnia klauzula GOAL-a („wojna wymuszona **faktycznie wybucha**
w rozgrywce"), i to **nie z winy tej pracy**, tylko przez drugi, niezależny bloker
(`pre_contact`) leżący **poza allowlistą** i wymagający **decyzji właściciela**. Operator
postąpił zgodnie z §14, nie ruszając go.

**Dlatego: PASS-WITH-NOTES, ale tematu NIE WOLNO zamknąć jako „GOAL osiągnięty" przed
odpowiedzią ABC.** Do Final Control przechodzi kod; równolegle orkiestrator musi zadać
właścicielowi pytanie ABC z §3 raportu Operatora.

---

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1
GOAL: Cywilizacja prowadzona przez komputer przestaje być traktowana jak miasto-państwo w chwili przejęcia miasta należącego wcześniej do miasta-państwa, niezależnie od tego czy przejęła je siłą czy pokojowo; po zmianie wojna wymuszona epoki Kamienia faktycznie wybucha w rozgrywce, a cywilizacja po podboju wraca na listę potęg i odzyskuje portret władcy.
ZMIANY/COMMIT: Weryfikowane: `6e7f8b10` + `ac4b9bfe` na `autobot/R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1`, baza = `origin/main` = `27be5705` (merge-base identyczny, brak rozjazdu). Filtr odwrotny allowlisty: 8 plików, wszystkie w allowlistie, nic poza nią; `improvement-build.ts`, `terrain-improvements.json` i `WERSJE.md` nietknięte; `git diff --check` czysto; worktree Operatora bez pracy niezacommitowanej. Własny wkład Evaluatora (w allowlistie `gra/tools/**`): `gra/tools/flaga-mp-ev.vite.config.ts`, `gra/tools/flaga-mp-ev.cjs` + raport `dyspozycje/autobot/runs/R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1/02-evaluator.md`.
TESTY: Bramki zmierzone WŁASNĄ RĘKĄ po obu stronach (gałąź vs czysty `origin/main` w osobnym worktree), bez pogorszenia: logic 213/213, tech-tree 19/0, research 33/33, unit-replace 13/13, combat 6/6, forced-war-stone 32/0, forced-war-bronze 44/0, forced-war-stone-main-guard 18/0, forced-war-bronze-main-guard 25/0, display-names 27/0, power-ranking 10/0, ai-war-gate 24/0. Bramka tematu 31/31. `tsc --noEmit` 0 błędów na obu drzewach. Build `--outDir /tmp/civ-dist-flaga-ev` OK (848 modułów). WŁASNY playtest (Playwright/Chromium, własny harness `flaga-mp-ev.*`, inna metoda niż Operatora — zdarzenia przejęcia z diffu migawek + ledger komend), ziarna 202/303/404/606 po 46 tur, PRZED na prawdziwym `origin/main`, 0 błędów strony, 0 wymuszonych odblokowań: główne cywilizacje oznaczone jako miasto-państwo w T20 PRZED 6/6 → PO 0/6 (4/4 ziarna); prawdziwe miasta-państwa PO 100% żywego zbioru nadal oznaczone; lista potęg [] → [1,8,15,22,29,36]; portret wymuszony symbol kultury [1,8,15,22,29,36] → []. DOWÓD ZDARZENIOWY: 36–37 zdarzeń przejęcia miasta z flagą MP na ziarno; PRZED flaga zostawała w dokładnie 6 z nich (wszystkie zbrojne, tura 6), PO w 0 z nich. Wypowiedzenia wojny AI CYWILIZACJI↔AI CYWILIZACJI: PRZED 0/0/0/0 → PO 0/0/2/1 (404: t24 `15x22`, t29 `1x15`; 606: t21 `36x1`), wszystkie potwierdzone jako wymuszone wojny Kamienia wpisami `stoneForceWarActiveByPairKey` `15_22`/`1_15`/`1_36`. Ledger komend: PRZED 0 komend `wypowiedz_wojne` w ogóle, PO 532 wyprodukowane i tylko 3 przetrwały filtr warstwy (`full` 3/3 = 100%, `pre_contact` 529/0 = 0%). Bateria mutacyjna Evaluatora: 6 własnych celowanych mutacji, każda zaczerwienia bramkę tematu.
BLOKADY: (1) **DECYZJA WŁAŚCICIELA (ABC) — bloker GOAL-a, nie bloker kodu.** Ostatnia klauzula GOAL-a nieosiągnięta: 3 wypowiedzenia na 4 ziarna, 2 ziarna z zerem. Przyczyna potwierdzona przeze mnie niezależnie i mocniej niż w raporcie Operatora: warstwa `pre_contact` kasuje komendę `wypowiedz_wojne` między dwiema AI CYWILIZACJI, gdy CZŁOWIEK nie odkrył napastnika we mgle wojny (`main.ts:28250` → `diplomacy-layers.ts:249-265`, `contactedOwners` = `diplomaticallyDiscoveredOwners` gracza, `main.ts:16090-16099`). Rozstrzygający dowód: zbiór AI wypowiadających wojnę = zbiór AI odkrytych przez gracza, we wszystkich 4 ziarnach (202 `[]`/`[]`, 303 `[]`/`[]`, 404 `[1,15]`/`[1,15]`, 606 `[1,36]`/`[1]`). To NIE jest warunek wojny ogólnej z `ai.ts:4377-4384` — ścieżka wymuszona wychodzi z `decideAIDiplomacy` wcześniej (`ai.ts:4158-4172`). Poza allowlistą, §14 — Operator słusznie nie ruszył. Informacja dla orkiestratora: gdyby ECHO = wariant A, poprawka mieści się W CAŁOŚCI w `gra/src/main.ts`, czyli w pliku już objętym allowlistą tego tematu. (2) **BRAK DOWODU MUTACYJNEGO dla T3c i T4c** — potwierdzam klasyfikację Operatora; obie asercje pilnują promienia rażenia, a funkcja dostaje tylko zdobywane miasto, więc żadna mutacja jej ciała ich nie zaczerwieni. Raportowane jako brak dowodu, nie jako spełnione. (3) **Nota Evaluatora (nie warunek przejścia):** anty-naprawa polegająca na usunięciu z `isOwnerClusterCityState` gałęzi `startCityState` (czyli wyłączeniu mechanizmu, zakazanym kryterium 2) NIE zaczerwienia bramki tematu ani `display-names-test`/`ai-war-gate-test`/`forced-war-stone-test` — łapie ją dopiero `power-ranking-test`. Ochrona istnieje w zestawie, ale nie w bramce tematu. (4) **Nota metodyczna (§13a):** numery tur w playteście nie są odtwarzalne co do tury między różnymi harnessami — na wspólnym ziarnie 606 Operator zmierzył turę 28, ja turę 21, przy zgodnej parze (`1_36`) i zgodnym mechanizmie. Para, mechanizm i kierunek zmiany są zgodne; same numery tur traktować jako orientacyjne. (5) Sprostowanie dispatchu potwierdzone własnym pomiarem na czystym `origin/main`: `forced-war-bronze` to 44/0, a 18/0 daje `forced-war-stone-main-guard`.
RUNDY: 1/5
NASTĘPNY KROK: Final Control (Opus 5, effort high) — `git fetch` + `git log` + wypisanie SHA + potwierdzenie, że zmiany SĄ W COMMITACH na gałęzi tematu; weryfikacja allowlisty i pięciu bramek referencyjnych własną ręką. RÓWNOLEGLE I OBOWIĄZKOWO: orkiestrator zadaje właścicielowi pytanie ABC z §3 raportu Operatora (czy wymuszona wojna między dwiema AI CYWILIZACJI ma zależeć od odkrycia napastnika przez gracza). Bez odpowiedzi ABC temat może zostać zintegrowany jako poprawna naprawa przyczyny, ale NIE WOLNO go zamknąć jako „GOAL osiągnięty".
DEPLOY/PUSH: NIE WYKONANO deploya ani integracji. Wypchnięta wyłącznie gałąź tematu `autobot/R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1` (raport Evaluatora + dwa narzędzia pomiarowe w `gra/tools/`).
