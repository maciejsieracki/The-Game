# RAPORT OPERATORA — R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1 (runda 1)

ROLA: Operator (Opus 5, effort high)
DATA: 2026-08-27
BAZA: `origin/main` = `27be5705` (worktree `/home/user/wt-op-flaga`, gałąź
`autobot/R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1`, fast-forward merge, bez konfliktów;
w bazie są już zintegrowane `R-REPO-SCIEZKA-KANON-FINALNA-Q1` i `R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1`)

> **UWAGA NA POJĘCIA (reguła stała właściciela).** Wszystko poniżej dotyczy **AI CYWILIZACJI**
> (komputerowych przeciwników) — kto z kim wypowiada wojnę, kto jest na liście potęg, kto ma
> portret władcy. **AI GRACZA** (automat wspierający właściciela) nie jest w tym temacie
> w ogóle dotykana ani mierzona.

---

## 1. Co zostało zmienione

### `gra/src/game/display-names.ts` — nowa funkcja `clearCityStateFlagOnCapture(city)`

Gasi oznaczenie **na MIEŚCIE**, nie na właścicielu. Zwraca `true`, gdy flaga faktycznie
zgasła (wołający wie wtedy, że musi unieważnić cache). Zbiory spawnowe
`simplifiedOwners` / `typCopyOwners` **nie są ruszane** — dlatego prawdziwe miasta-państwa
pozostają miastami-państwami także po utracie części swoich miast. Mechanizm nie jest
wyłączany; przestaje tylko zarażać zdobywcę.

### `gra/src/main.ts` — wpięcie na WSZYSTKICH ścieżkach przejęcia miasta

Pełna inwentaryzacja miejsc, w których miasto zmienia właściciela (dowód, nie założenie):

| # | Ścieżka | Miejsce | Wpięte |
|---|---------|---------|--------|
| 1 | podbój bojowy / szturm oblężniczy / wejście do pustego miasta | `post-battle-map.ts:483` (`city.ownerId = atkOwner`) → hak `onOwnerChanged` (`post-battle-map.ts:492`, wołany **po** przypisaniu) → `main.ts:24118` w `applyCityCaptureToMap` | TAK |
| 2 | kapitulacja głodowa oblężenia | `main.ts:12460` (`resolveSiegeSurrender`) | TAK |
| 3 | pokojowe wchłonięcie miasta-państwa | `main.ts:23707` (`annexCityStateToOwner`) | TAK (było ręczne przypisanie → teraz ta sama funkcja) |
| 4 | rebelia (`city.ownerId = REBEL_FACTION_OWNER_ID = -99`) | `main.ts:26768` | **CELOWO NIE** — `isOwnerClusterCityState` zwraca `false` dla `ownerId <= 0`, więc frakcja rebeliantów nie może się zarazić; odbicie miasta wraca ścieżką 1, która flagę gasi |

To jest komplet: `grep` po `\.ownerId = ` w `main.ts` w kontekście miasta daje dokładnie
trzy trafienia (12460, 23707, 26768), czwarte przypisanie żyje w `post-battle-map.ts`.
Asercja **T14** bramki pilnuje, żeby w `main.ts` zostały dokładnie **2** ręczne przypisania
`startCityState` (oba to spawn) — pojawienie się trzeciego zaczerwieni bramkę.

**Uwaga nazewnicza dla Evaluatora:** `markCityStateDirty()` (`main.ts:2041`) **nie** dotyczy
miast-państw — to „stan miasta"; ustawia `empireEconDirty` i `powerDirty`. Wołamy je,
bo `powerDirty` unieważnia cache rankingu Mocy, czyli dokładnie to, czego wymaga kryterium 4.

---

## 2. Kryterium 1 + 2 — pomiar PRZED i PO (ten sam sterownik, te same ziarna)

Sterownik: `gra/tools/flaga-mp-op.cjs` + `flaga-mp-op.vite.config.ts` (Playwright/Chromium,
plik `file://`, instrumentacja wyłącznie w pamięci buildu — `gra/src/**` i `gra/data/**`
bajt w bajt nietknięte). Scenariusz „aktywny": gracz zakłada miasto, kupuje zwiadowcę
i włącza „Zwiedzaj" — bez tego kontakty dyplomatyczne zostają puste i pomiar kłamie.
Ziarna **111 / 505 / 606**, po **46 tur** każde, 0 błędów strony w każdym przebiegu.

Definicja „głównej cywilizacji" jest niezależna od naprawy: owner, który **nigdy** w całym
przebiegu nie był w `simplifiedDiplomacyOwners` ani `typCityCopyOwners` (zbiory nadawane
przy spawnie). W każdym ziarnie wychodzi ten sam komplet: **[1, 8, 15, 22, 29, 36]**.

| Pomiar (tura 20) | PRZED | PO |
|---|---|---|
| główne cywilizacje oznaczone jako miasto-państwo | **[1, 8, 15, 22, 29, 36]** (6/6, każde ziarno) | **[]** (0/6, każde ziarno) |
| miasta z flagą MP w rękach głównych cywilizacji | `1:1, 8:1, 15:1..2, 22:1, 29:1, 36:1` | **[]** |
| prawdziwe miasta-państwa nadal oznaczone | 35/35 (s111), 36/36 (s505), 36/36 (s606) | **36/36 w każdym ziarnie** |
| główne cywilizacje na liście potęg | **[]** | **[1, 8, 15, 22, 29, 36]** |
| główne cywilizacje z wymuszonym symbolem kultury zamiast portretu władcy | **[1, 8, 15, 22, 29, 36]** | **[]** |
| pierwsza tura zarażenia głównej cywilizacji | tura **6–9** dla każdej z sześciu, w każdym ziarnie | **nigdy** (`{}`) |

Ten sam obraz utrzymuje się na końcu przebiegu (tura 46): PRZED wszystkie sześć nadal
oznaczone i poza rankingiem, PO żadna nie jest oznaczona i wszystkie sześć jest w rankingu.
Prawdziwe MP na koniec: 6/6 żywych nadal oznaczonych (s111, s505), 5/5 (s606) — mechanizm
działa, nie został wyłączony.

**Kryterium 1 — SPEŁNIONE. Kryterium 2 — SPEŁNIONE.**
**Kryterium 4 (lista potęg + portret władcy, PRZED/PO) — SPEŁNIONE**, liczby w tabeli wyżej.

Dane surowe: `/tmp/flaga-przed-{111,505,606}/` (PRZED), `/tmp/flaga-po/` (PO).

### Dowód, że pomiar PRZED nie jest artefaktem starej wersji

Osobny przebieg z mutantem `FLG_MUT_KEEP=1` (wbudowanym w `flaga-mp-op.vite.config.ts`),
który **na obecnym źródle** wyłącza w pamięci gaszenie flagi, ziarno 111, 46 tur:
odtwarza stan PRZED co do liczby — główne oznaczone `[1,8,15,22,29,36]`, ranking `[]`,
portrety wymuszone `[1,8,15,22,29,36]`, `stoneForceWarPendingOwners` **puste we wszystkich
turach**. Dane: `/tmp/flaga-mut/flg-seed-111.json`.

---

## 3. Kryterium 3 — realne wypowiedzenia wojny w rozgrywce (CZĘŚCIOWO)

| ziarno | tury | wypowiedzenia PRZED | wypowiedzenia PO |
|---|---|---|---|
| 111 | 46 | 0 | **0** |
| 505 | 46 | 0 | **0** |
| 606 | 46 | 0 | **1 — tura 28, para AI36 ↔ AI1** |

Wypowiedzenie na ziarnie 606 jest **udowodnioną wymuszoną wojną epoki Kamienia**, nie
przypadkową wojną ogólną: w turze 28 `stoneForceWarActiveByPairKey` dostaje klucz
`"1_36"`, a `stoneForceWarPendingOwners` traci ownera 1 — a ten wpis powstaje **wyłącznie**
w gałęzi `targetId === stoneForceWarTargetId` przy faktycznym wypowiedzeniu (`main.ts:28317`).
PRZED: `stoneActive` puste we wszystkich turach wszystkich ziaren.

**Nie jest to zero, ale nie jest to też cel z GOAL-a.** 1 wypowiedzenie na 3 ziarna
(138 tur-ziaren) to nie „wojna wymuszona epoki Kamienia faktycznie wybucha w rozgrywce".
Zgodnie z §13a raportuję to jako **cel osiągnięty częściowo**, z podaną poniżej przyczyną.

### Co naprawa faktycznie odblokowała (mierzalna różnica behawioralna)

`stoneForceWarPendingOwners` — kolejka ownerów zakwalifikowanych do wymuszonej wojny:

* **PRZED (mutant, ziarno 111):** `[]` w **każdej** turze przebiegu. Mechanizm nigdy nie
  ruszał, bo guard `!isOwnerClusterCityState(ownerId, …)` (`main.ts:28170`) odrzucał
  wszystkie sześć głównych cywilizacji, a filtr kandydatów (`main.ts:28207`) odrzucał je
  także jako cele. Obie strony mechanizmu były puste.
* **PO (ziarno 111):** `[29, 36]` od tury 20, komplet `[29, 36, 1, 8, 15, 22]` od tury 21
  i dalej. To samo w 505 i 606.

Czyli przyczyna nazwana w dispatchu została usunięta i jest to widoczne **w rozgrywce**,
a nie tylko w bramce.

### DRUGI, NIEZALEŻNY BLOKER — ustalony pomiarowo, POZA zakresem tego tematu

Osobny build diagnostyczny (`gra/tools/flaga-mp-diag.*`, trzy sondy tylko czytające;
**nie ruszam sterownika pomiaru**, żeby nie zepsuć porównywalności PRZED/PO), ziarno 111,
31 tur, 213 zdarzeń. Dla **każdej** tury ≥ 20 i **każdej** z sześciu cywilizacji:

```
{"t":20,"o":29,"ev":"search","shouldSearch":true,"wasPending":true,"atWar":false,"epoch":1}
{"t":20,"o":29,"ev":"pick","picked":22,"cand":[1,8,15,22,36],"blocked":[]}
{"t":20,"o":29,"ev":"cmds","target":22,"layer":"pre_contact","contacted":false,
 "established":false,"raw":["wypowiedz_wojne->22"],"layered":[]}
```

Czytane wprost: owner **szuka** celu, **wybiera** go, `decideAIDiplomacy` **zwraca komendę
`wypowiedz_wojne`** — i komenda zostaje **wyrzucona** przez
`filterDiplomacyCommandsForLayer(cmds, dipLayer)`, bo `dipLayer === 'pre_contact'`
(`diplomacy-layers.ts:265` → `return []`). `dipLayer` jest `pre_contact`, gdy
`contactedOwners.has(ownerId) === false`, czyli **gdy CZŁOWIEK nie odkrył jeszcze tej AI
we mgle wojny** (decyzja D3-Q2, `diplomacy-layers.ts:249-254`).

Skutek: **wojna AI↔AI jest kasowana zależnie od tego, jak daleko zwiedził człowiek** —
71 komend `wypowiedz_wojne` wyprodukowanych i 71 wyrzuconych na jednym ziarnie. Na ziarnie
606 jedna z cywilizacji została odkryta na czas i dlatego padło tam jedno wypowiedzenie.

**Nie ruszam tego (§14, GRANICE dispatchu).** To nie jest ta sama rzecz co warunek wojny
ogólnej z `ai.ts:4377-4384` (ścieżka wymuszona wychodzi z `decideAIDiplomacy` wcześniej,
`ai.ts:4158-4172`, i nigdy tego warunku nie dotyka) — to trzeci, dotąd nienazwany bloker,
siedzący w warstwie dyplomacji. Zmiana wymaga decyzji produktowej właściciela.

### PYTANIE ABC DLA WŁAŚCICIELA (proponowane, do zadania przez orkiestratora)

> Czy wymuszona wojna **między dwiema cywilizacjami komputerowymi** ma zależeć od tego,
> czy gracz odkrył napastnika we mgle wojny?
> **A)** Nie — wymuszona wojna AI↔AI wybucha niezależnie od wiedzy gracza (gracz dowiaduje
> się o niej, gdy odkryje teren); bramka `pre_contact` przestaje dotyczyć komendy
> `wypowiedz_wojne` między AI.
> **B)** Tak, zostawiamy jak jest — świat poza zasięgiem wzroku gracza się nie rusza.
> **C)** Inaczej (proszę opisać).

---

## 4. Kryterium 5 — dowód nie-tautologiczny (mutacje celowane)

Bramka tematu: `gra/tools/flaga-mp-nie-gasnie-test.cjs`, **31 PASS / 0 FAIL**.
Harness mutacyjny uruchamiał 11 celowanych mutacji źródła (`display-names.ts`, `main.ts`),
po każdej przywracając pliki; po całości `git status` i bramka bez zmian (31/31).

| mutacja | co psuje | zaczerwienione asercje |
|---|---|---|
| M1 funkcja martwa | `clearCityStateFlagOnCapture` nigdy nie gasi (stare zachowanie) | T2a, T2b, T4b, T5b, T6b, T7b, T8a, T8c, T9b |
| M2 gaszenie bezwarunkowe | gasi i raportuje zmianę także dla miast bez flagi | T9a, T9c |
| M3 `isOwnerClusterCityState` → zawsze `false` | mechanizm MP wyłączony | T1b, T1c, T3a, T3b, T4a, T5a, T5c, T8b |
| M4 `isOwnerClusterCityState` → zawsze `true` | każdy owner > 0 jest MP | T1a, T2b, T2c, T4b, T5a, T5b, T6a, T6b, T8a |
| M5 etykieta bez dopisku | `formatCityMapLabel` nie dokleja „· miasto-państwo" | T7a |
| M6 brak wpięcia — podbój bojowy | usunięte wołanie w `applyCityCaptureToMap` | T11 |
| M7 brak wpięcia — kapitulacja głodowa | usunięte wołanie w `resolveSiegeSurrender` | T12 |
| M8 annex ręcznym przypisaniem | powrót do `city.startCityState = false` w `annexCityStateToOwner` | T13, T14 |
| M9 brak wpięcia nigdzie | trzy wołania + import usunięte | T10, T11, T12, T13 |
| M10 portret bez fallbacku | `shouldForceCultureIconForOwner` traci gałąź „to samo ikonaId co gracz" | **żadna** (zapisane jawnie — mutacja nieskuteczna, bo MP 4 wpada w gałąź `isOwnerClusterCityState` wcześniej) |
| M11 portret zawsze portret władcy | `shouldForceCultureIconForOwner` → zawsze `false` | T6c |

**Pokrycie: 29 z 31 asercji.** Niepokryte: **T3c** i **T4c**.

**BRAK DOWODU, raportowany jako brak dowodu (§13a):** dla T3c („miasta nietkniętego MP
zachowują oznaczenie") i T4c („MP 4 zostaje z dokładnie jednym oznaczonym miastem")
**nie umiem wskazać mutacji obecnego źródła, która je zaczerwieni**. Powód jest
strukturalny, nie wygodny: obie asercje pilnują *promienia rażenia* — że przejęcie jednego
miasta nie rusza miast osób trzecich — a testowana funkcja fizycznie dostaje **tylko
zdobywane miasto**, więc żadna zmiana jej ciała nie może dotknąć cudzych obiektów. Ich
wartość jest regresyjna: zaczerwienią się, jeśli ktoś kiedyś przepisze gaszenie na poziom
*właściciela* (wariant jawnie odrzucony w komentarzu przy funkcji).

---

## 5. Kryteria 6 i 7 — bramki

Wszystkie uruchomione własnoręcznie z `gra/`, w timeout. Punkt odniesienia zmierzony przeze
mnie w **osobnym worktree na czystym `origin/main` = `27be5705`** (`/tmp/wt-base-flaga`),
nie przepisany z dispatchu:

| bramka | `origin/main` (baza) | gałąź tematu | ocena |
|---|---|---|---|
| `logic-test.cjs` | 213/213 | **213/213** | bez pogorszenia |
| `tech-tree-test.cjs` | 19 pass, 0 fail | **19 pass, 0 fail** | bez pogorszenia |
| `research-test.cjs` | 33/33 | **33/33** | bez pogorszenia |
| `unit-replace-test.cjs` | 13/13 | **13/13** | bez pogorszenia |
| `combat-test.cjs` | 6/6 | **6/6** | bez pogorszenia |
| `forced-war-stone-test.cjs` | 32/0 | **32/0** | bez pogorszenia |
| `forced-war-bronze-test.cjs` | 44/0 | **44/0** | bez pogorszenia |
| `forced-war-stone-main-guard-test.cjs` | 18/0 | **18/0** | bez pogorszenia |
| `forced-war-bronze-main-guard-test.cjs` | 25/0 | **25/0** | bez pogorszenia |
| `flaga-mp-nie-gasnie-test.cjs` (nowa) | — | **31/31** | nowa bramka tematu |

`node ./node_modules/typescript/bin/tsc --noEmit` — **0 błędów**.
Build: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-flaga-op --emptyOutDir`
— **OK, 848 modułów** (`--outDir` unikalny per rola, zgodnie z GRANICAMI).

**SPROSTOWANIE DO DISPATCHU (kryterium 7):** dispatch mówi „`forced-war-bronze` (18/0)".
W repo `forced-war-bronze-test.cjs` daje **44/0**, a **18/0** daje
`forced-war-stone-main-guard-test.cjs`. Zmierzyłem wszystkie cztery bramki wymuszonej wojny
i wszystkie są bez pogorszenia — liczba z dispatchu wskazywała inną bramkę, niż sugeruje jej
nazwa.

---

## 6. Granice — przestrzegane

* Nie tknięto `gra/src/map/improvement-build.ts` ani `gra/data/terrain-improvements.json`
  (temat `R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1` — w międzyczasie zintegrowany w `main`, brak kolizji).
* Nie tknięto warunku wojny ogólnej (`ai.ts:4377-4384`) ani filtru `oid > 0`.
* Nie tknięto warstwy `pre_contact` mimo że to zidentyfikowany bloker celu — §14, wymaga ECHO.
* Bez `npm run build`/`dev`, bez `npx`, bez `git add -A` (staging po jawnych ścieżkach),
  bez zmian w `dyspozycje/WERSJE.md`, bez pushu do `main`.
* `git diff --check` — czysty.

---

## 7. Do sprawdzenia przez Evaluatora

1. Czy inwentaryzacja ścieżek zmiany właściciela miasta (tabela w §1) jest kompletna —
   szczególnie czy `post-battle-map.ts` nie ma drugiego wyjścia poza `onOwnerChanged`.
2. Czy uzasadnienie pominięcia ścieżki rebelii (`ownerId = -99`) się broni.
3. Czy własnym pomiarem potwierdza się drugi bloker (`pre_contact`) — i czy jego skutek
   nie da się osiągnąć w granicach allowlisty bez decyzji właściciela.
4. Czy 1 wypowiedzenie na 3 ziarna wystarcza do uznania kryterium 3 za spełnione,
   czy temat powinien wrócić po ECHO na pytanie ABC z §3.

---

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1
GOAL: Cywilizacja prowadzona przez komputer przestaje być traktowana jak miasto-państwo w chwili przejęcia miasta należącego wcześniej do miasta-państwa, niezależnie od tego czy przejęła je siłą czy pokojowo; po zmianie wojna wymuszona epoki Kamienia faktycznie wybucha w rozgrywce, a cywilizacja po podboju wraca na listę potęg i odzyskuje portret władcy.
ZMIANY/COMMIT: `6e7f8b10` na `autobot/R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1` — `gra/src/game/display-names.ts`, `gra/src/main.ts`, `gra/tools/flaga-mp-nie-gasnie-test.cjs`, `gra/tools/flaga-mp-op.cjs`, `gra/tools/flaga-mp-op.vite.config.ts`, `gra/tools/flaga-mp-diag.cjs`, `gra/tools/flaga-mp-diag.vite.config.ts`. Wszystko w allowlistie.
TESTY: bramka tematu 31/31; logic 213/213; tech-tree 19/0; research 33/33; unit-replace 13/13; combat 6/6; forced-war-stone 32/0; forced-war-bronze 44/0; forced-war-stone-main-guard 18/0; forced-war-bronze-main-guard 25/0 — wszystkie zmierzone także na czystym `origin/main` i bez pogorszenia. `tsc --noEmit` 0 błędów. Build vite OK (`/tmp/civ-dist-flaga-op`). Playtest w przeglądarce, ziarna 111/505/606 po 46 tur, PRZED i PO tym samym sterownikiem: główne cywilizacje oznaczone jako miasto-państwo w turze 20 — PRZED 6/6, PO 0/6; prawdziwe miasta-państwa PO 36/36 nadal oznaczone; lista potęg PRZED [] → PO [1,8,15,22,29,36]; portret władcy PRZED wymuszony symbol kultury dla 6/6 → PO 0/6. Wypowiedzenia wojny: PRZED 0/0/0, PO 0/0/**1** (ziarno 606, tura 28, para AI36↔AI1, potwierdzona wymuszona wojna Kamienia przez wpis `stoneForceWarActiveByPairKey["1_36"]`). Kolejka `stoneForceWarPendingOwners`: PRZED pusta we wszystkich turach, PO komplet 6 ownerów od tury 21. 11 mutacji celowanych zaczerwienia 29 z 31 asercji.
BLOKADY: (1) **Kryterium 3 spełnione tylko częściowo** — 1 wypowiedzenie na 3 ziarna, nie zero, ale też nie cel z GOAL-a. Przyczyna ustalona pomiarowo: DRUGI, NIEZALEŻNY BLOKER poza allowlistą — `filterDiplomacyCommandsForLayer` kasuje komendę `wypowiedz_wojne` AI↔AI, gdy `dipLayer === 'pre_contact'`, czyli gdy **człowiek nie odkrył jeszcze napastnika we mgle wojny** (`diplomacy-layers.ts:249-265`, decyzja D3-Q2). Na ziarnie 111 wyprodukowano i wyrzucono 71 takich komend. Nie ruszam — §14, wymaga ECHO właściciela; proponowane pytanie ABC w §3 raportu. (2) **BRAK DOWODU MUTACYJNEGO dla 2 z 31 asercji** (T3c, T4c) — obie pilnują promienia rażenia zmiany, a funkcja dostaje tylko zdobywane miasto, więc żadna mutacja jej ciała ich nie zaczerwieni; raportuję jako brak dowodu, nie jako spełnione. (3) Sprostowanie liczby z dispatchu: `forced-war-bronze` to 44/0, a nie 18/0 (18/0 to `forced-war-stone-main-guard`).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5, effort high) — własny pomiar behawioralny, weryfikacja kompletności inwentaryzacji ścieżek przejęcia miasta i niezależne potwierdzenie blokera `pre_contact`; równolegle orkiestrator zadaje właścicielowi pytanie ABC z §3.
DEPLOY/PUSH: NIE WYKONANO deploya ani integracji. Wypchnięta wyłącznie gałąź tematu `autobot/R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1`.
