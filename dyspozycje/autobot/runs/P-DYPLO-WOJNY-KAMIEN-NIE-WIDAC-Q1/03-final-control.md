# 03 — FINAL CONTROL (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`
GOAL: Trzecia, niezależna reprodukcja audytu + kontrola procesu. **Produktem jest
odpowiedź dla właściciela, nie integracja kodu.**
MODEL+EFFORT: **Opus 5, effort high**
RUNDY: 1/5

---

## 0. Werdykt w jednym akapicie

**Potwierdzam wynik Operatora i Evaluatora — ale nie przez powtórzenie ich pomiaru.**
Znalazłem **wspólny sterownik** obu ról (gracz zakłada jedno miasto i przez 60 tur
tylko kończy turę, więc nigdy nikogo nie odkrywa) i **zbudowałem scenariusz, który
ten sterownik łamie**: gracz buduje zwiadowcę i włącza „Zwiedzaj". Osobno —
i to jest najmocniejsza część tego raportu — **dwa z trzech blokad dają się
udowodnić z samego źródła, bez żadnego pomiaru**, więc żaden harness nie mógł ich
wyprodukować. Gotowość do integracji: **NIE DOTYCZY** — temat kończy się decyzją
właściciela, nie mergem.

---

## 1. Kontrola procesu (§16b)

| # | sprawdzane | wynik |
|---|---|---|
| 1 | `00-dispatch.md` istnieje, `GOAL` niezmieniony | TAK — `GOAL` identyczny w 00/01/02/03 |
| 2 | to samo ID we wszystkich rundach | TAK — `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1` |
| 3 | werdykt Evaluatora oparty na artefaktach, nie deklaracjach | TAK — 4 zrzuty JSON + własny harness; przeliczył surowe dane Operatora własnym kodem |
| 4 | czy `PASS-WITH-NOTES` nie ukrywa uwagi o GOAL/dowodzie/zakresie/§9 | NIE ukrywa — uwagi to znaleziska Z1–Z8, czyli **treść** audytu, nie dług |
| 5 | licznik rund nie zresetowany | TAK — 1/5 w obu raportach, zgodne z dispatchem |
| 6 | granice §9 | brak naruszeń — patrz §5 |
| 7 | licznik rund / model | Opus 5 High w obu rolach, zgodnie z dispatchem (C-062) |
| 8 | gotowość do integracji | **NIE DOTYCZY** — dispatch: „ten temat nie kończy się integracją kodu" |

**NOTA F1 (na korzyść Evaluatora):** Evaluator sam zgłosił, że zdanie Operatora
„0/6 głównych AI miało kontakt z graczem" jest prawdziwe tylko dla przebiegu
mutanta, nie dla przebiegów bazowych 222/333 (`dowody-ev/weryfikacja-danych-operatora.md`,
NOTA E1). Sprawdziłem to i **korekta Evaluatora jest słuszna** — a co ważniejsze,
osłabia ona wniosek Z5 dokładnie w tym miejscu, w którym trzeba było go osłabić.
To jest zachowanie, którego §13b wymaga, i odnotowuję je jako spełnione.

---

## 2. REGUŁA PRZECIW SAMOOSZUKIWANIU — czy zmierzono ten sam skrót dwa razy

Zadanie kazało mi sprawdzić, czy obie role nie zmontowały tego samego stuba
(lekcja `P-PROC-HARNESS-NIEPELNA-SCENA-Q1`). **Znalazłem taki wspólny element —
i jest istotny.**

**SONDY są faktycznie różne** (Operator: instrumentacja wejść bramy w `ai.ts`;
Evaluator: diff macierzy `diplomacyRelations` + census komend na granicy `main.ts`).
Tu zarzutu nie ma.

**STEROWNIK jest identyczny** — w obu harnessach ten sam kod:

| element | Operator (`wojny-kamien-audyt.vite.config.ts`) | Evaluator (`wojny-kamien-ev.vite.config.ts`) |
|---|---|---|
| założenie 1. miasta | `foundFirstCity()` — skan promieniowy `canFoundPlayerCityAt` | **ten sam kod, znak w znak** |
| koniec tury | `flushDeferredAutoPreBattle()` + `triggerPlayerEndTurn()` | **ten sam** |
| odblokowanie | `hidePreBattle` + `clearDeferredAutoPreBattleQueue` + `resetEndTurnBlockers` | **ten sam** |
| parametry gry | `buildParams()` bez pokazania kreatora | **ten sam** |
| **działania gracza przez 60 tur** | **żadne** | **żadne** |

Konsekwencja tego wspólnego sterownika jest dokładnie taka, przed jaką ostrzega
lekcja z `P-PROC-HARNESS-NIEPELNA-SCENA-Q1`: gracz, który nigdy nie rusza się
z miejsca, **nie odkrywa nikogo**; `diplomaticallyDiscoveredOwners` zostaje przy
3 miastach-państwach obok stolicy (`[43,44,45]` w każdym z 6 przebiegów obu ról);
warstwa `diplomacyLayerForOwner` daje wtedy `'pre_contact'` dla wszystkich
głównych AI, a `filterDiplomacyCommandsForLayer` kasuje im **wszystkie** komendy.
**Sam ten stub wystarczy, żeby wyprodukować wynik „zero wojen" — niezależnie od
tego, czy mechanizm gry działa.** Dlatego mój pomiar tego stuba **nie używa**.

---

## 3. Dowody, których ŻADEN harness nie mógł wyprodukować

Trzy z pięciu znalezisk da się rozstrzygnąć **wyłącznie z kodu** (rząd 2 hierarchii
§13a). Przeczytałem je sam, linia po linii, w moim worktree na tipie gałęzi.
Te trzy wnioski są odporne na jakikolwiek błąd sterownika — mój, Operatora
i Evaluatora — bo nie zależą od żadnego przebiegu.

### 3.1 Z1 — przejęcie miasta-państwa trwale wyłącza AI z mechanizmu (DOWÓD ŹRÓDŁOWY)

`isOwnerClusterCityState` (`display-names.ts:50-59`) zwraca `true`, gdy właściciel ma
**jakiekolwiek** miasto z flagą `startCityState`:

```ts
if (opts?.cities?.some(c => c.ownerId === ownerId && c.startCityState)) return true;
```

Wyzwalacz wojny wymuszonej Kamienia (`main.ts:28025`) i Brązu (`main.ts:27963`) mają
ten warunek zanegowany, więc taki właściciel **nigdy nie trafia do `pending`**
i **nigdy nie trafia do `stoneCandidates`** (`main.ts:28065-28068`).

**Wyczerpujące przeszukanie całego `gra/src` po `startCityState` — 9 trafień w `main.ts`,
1 w `display-names.ts`, 4 w `ai.ts`/`cities.ts`. Kasowanie flagi istnieje w DOKŁADNIE
JEDNYM miejscu:** `main.ts:23625`, wewnątrz `annexCityStateToOwner`, czyli
**wchłonięcia dyplomatycznego**. Sprawdziłem obie ścieżki podboju militarnego —
kapitulację głodową (`main.ts:12456-12459`: `city.ownerId = newOwner; city.foundedByOwner = false;`)
i `applyCityCaptureToMap` (`main.ts:24007+`) — **żadna nie zeruje `startCityState`**.

**Wniosek: zdobywca miasta-państwa zostaje na stałe policzony jako miasto-państwo.**
To nie jest hipoteza z pomiaru — to jest własność kodu.

### 3.2 Z2/Z6 — brama wojny na gracza jest arytmetycznie NIESPEŁNIALNA (DOWÓD ŹRÓDŁOWY)

Odtworzyłem ten dowód niezależnie, zanim przeczytałem plik Evaluatora, i **wychodzi
identycznie**. Dla pary AI→gracz, w tej samej iteracji tej samej pętli, z tych samych
`potAI`/`potPlr`:

| krok | miejsce | treść |
|---|---|---|
| 1 | `main.ts:27647` | `rw = potAI / (potAI + potPlr)` |
| 2 | `main.ts:27615` + `diplomacy.ts:1590-1592` | `respekt = clamp(round(100 · rw), 0, 100)` |
| 3 | `diplomacy.ts:1739`, `:1743` | `tickDiplomacy` przepuszcza `respekt` **bez zmiany** |
| 4 | `diplomacy.ts:1032`, `:1386`, `:1738` | `zaufanie = clamp(…, 0, 100)` — **nigdy ujemne** |
| 5 | `diplomacy.ts:791-798` + `:183-184` (`mnoznikZaufania = mnoznikRespektu = 1`) | `score = clamp(zaufanie + respekt, 0, 200)` |

Stąd tożsamość **`score ≥ respekt = round(100 · rw)`**. Brama (`ai.ts:4377-4384`) żąda
jednocześnie `rw ≥ effProgWojnaSila` **i** `score < progMinimalnyRelacja`.
Ponieważ `effProgWojnaSila = Math.max(0.3, …)` (`ai.ts:4219-4222`), a realne minimum po
premiach archetypu to **0,38** (`ai.ts:4017`, `:4032`, `:4048`):

> `rw ≥ 0,38` ⟹ `respekt ≥ 38` ⟹ `score ≥ 38`, przy `progMinimalnyRelacja = 30`
> (`diplomacy.ts:172`; delta trudności ±10, `diplomacy.ts:471-475`).

**38 > 30 — oba warunki nie mogą być prawdziwe naraz. Dla każdego ziarna, każdej tury,
każdego stosunku sił.** Na trudności Łatwy (próg 20) tym bardziej. Jedyne okno to
Trudny (próg 40) przy `rw ∈ [0,380; 0,399]` — czyli gdy AI jest **słabsza** od gracza.

**To odwraca hipotezę dispatchu.** Dispatch zakładał, że „przewaga 1,5:1 nad graczem
może być rzadka". Jest odwrotnie: **przewaga AI czyni wojnę niemożliwą**, bo ta sama
liczba (`respekt`) jest jednocześnie miarą przewagi i składnikiem relacji.

### 3.3 Punkt 4 dispatchu — gracz strukturalnie wykluczony jako cel (DOWÓD ŹRÓDŁOWY, PODWÓJNY)

Gracz jest wykluczony **dwa razy niezależnie**:

1. `aiOwnerList` (`main.ts:27166-27172`) budowana jest z `if (u.ownerId > 0)` /
   `if (c.ownerId > 0)` — **owner 0 nigdy w niej nie występuje**;
2. filtr `stoneCandidates` (`main.ts:28065`) dokłada jawne `oid > 0`.

**Odpowiedź na punkt 4: TAK, gracz jest strukturalnie wykluczony.** Zgodne z literą
decyzji Q2 („cel ma być najbliższą terytorialnie cywilizacją AI") — **nie defekt**.

### 3.4 Punkt 5 dispatchu — czy gracz widzi wojny AI↔AI (DOWÓD ŹRÓDŁOWY)

`recordWarDeclarationEvent` (`main.ts:7753`) zaczyna się od:

```ts
if (declarerId !== 0 && targetId !== 0) return;
```

**Wojna AI↔AI nie generuje ŻADNEJ karty w panelu Wydarzeń.** Jedyny kanał to pasywny
wiersz w panelu dyplomacji (`collectKnownWarsBetweenOthers`, `main.ts:16067`) — i tylko
gdy gracz odkrył co najmniej jedną ze stron. Zero toastu, zero karty, zero sygnału na mapie.

### 3.5 Z7 — jedyna działająca ścieżka DOW na gracza (DOWÓD ŹRÓDŁOWY)

Potwierdzam znalezisko Evaluatora własnym odczytem: `main.ts:27193` bramkuje wojnę
klastra miast-państw na gracza warunkiem `_menuCityStateDifficultyVsPlayer === 'hard'`,
a `main.ts:29919-29922` ustawia tę zmienną **wprost z trudności gry** (`diff`, domyślnie
`'normal'`, `main.ts:29902`). Ta ścieżka **wywołuje** `recordWarDeclarationEvent` i toast
(`main.ts:27239-27245`), więc na „Trudnym" właściciel faktycznie zobaczyłby wypowiedzenie.

---

## 4. Mój własny pomiar — scenariusz, którego nie zrobił nikt

**Metoda.** Ten sam kanon co u obu ról (build `vite` z instrumentacją wstrzykiwaną
**w pamięci**, żywe Chromium, prawdziwa pętla `doStartGame` + `triggerPlayerEndTurn`),
ale **dwa scenariusze zamiast jednego**:

| scenariusz | co robi gracz | po co |
|---|---|---|
| **pasywny** | zakłada miasto, przez 60 tur tylko kończy turę | replikacja sterownika obu ról na **nowym ziarnie** — kontrola zgodności |
| **aktywny** | dodatkowo **kolejkuje zwiadowcę w stolicy** i **włącza mu „Zwiedzaj"** | łamie wspólny stub **prawdziwą akcją gracza**, nie mutantem |

Scenariusz aktywny nie jest mutantem i niczego nie obchodzi — to dokładne
odwzorowanie dwóch kliknięć z UI:
* kolejkowanie jednostki = `setCityProduction` z pozycją z `availableProduction`
  (dokładnie to, co robi panel miasta, `main.ts:30057`);
* „Zwiedzaj" = gałąź `scout-explore` (`main.ts:18717-18742`): `clearPlannedMarch(u.id, true)`,
  `exitFieldFortify` jeśli trzeba, `u.autoExplore = true`. Ruch wykonuje **gra**
  własnym `runScoutsAutoExplore` (`main.ts:25459`), nie mój kod.

**Odkrycie uboczne, istotne dla oceny obu poprzednich raportów:**
**gracz startuje z ZERO jednostek** (zmierzone: `plrUnits = 0` w każdej turze obu
przebiegów bazowych). Żeby cokolwiek odkryć, musi najpierw **wyprodukować** jednostkę.
To wyjaśnia, dlaczego pasywny sterownik obu ról kończył zawsze na `contacts = [43,44,45]`
(trzy miasta-państwa w promieniu startowym) i **nigdy nie odkrywał głównego AI**.

---

## 5. Granice §9 i dowód czystości

**Uruchomione przeze mnie, w moim worktree `/home/user/wt-fc-wojny` (detached na `3d1758f0`):**

| bramka | komenda | wynik |
|---|---|---|
| TypeScript | `node ./node_modules/typescript/bin/tsc --noEmit` | **0 błędów** |
| Logika | `node tools/logic-test.cjs` | **213/213** |
| Drzewo technologii | `node tools/tech-tree-test.cjs` | **19 pass / 0 fail** |
| Badania | `node tools/research-test.cjs` | **33/33** |
| Wymiana jednostek | `node tools/unit-replace-test.cjs` | **13/13** |
| Walka | `node tools/combat-test.cjs` | **6/6** |
| Wojna wymuszona Kamienia | `node tools/forced-war-stone-test.cjs` | **32/0** |
| Guard w `main.ts` | `node tools/forced-war-stone-main-guard-test.cjs` | **18/0** |
| Brama wojny AI | `node tools/ai-war-gate-test.cjs` | **24/0** |
| Bramy wojny dyplomacji | `node tools/diplomacy-war-gates-test.cjs` | **19/0** |
| Zobowiązanie sojusznicze | `node tools/alliance-war-obligation-test.cjs` | **14/0** |

Wszystkie zgodne z punktem odniesienia §6. **`map-gen-regression-test` nieuruchamiany**
(zakaz z dispatchu) — mapa generowana wyłącznie własnym, wąskim harnessem.
C-001 respektowane: build **wyłącznie** przez
`node ./node_modules/vite/bin/vite.js build --config … --outDir /tmp/civ-fc-wojny --emptyOutDir`,
zero `npm run build`/`dev`, zero `npx`, zero `git add -A`.

**Dowód, że audyt niczego nie zmienił w grze:**

```text
$ git status --porcelain                       # w /home/user/wt-fc-wojny
(pusto)
$ git diff --stat origin/main HEAD -- gra/src gra/data
(pusto)
```

`gra/node_modules` to dowiązanie do checkoutu głównego (wymóg C-029 — worktree bez
`node_modules` daje mylący wynik `tsc`); objęte `gra/.gitignore:2`, więc `git status`
pozostaje czysty. Allowlista dotrzymana: **wyłącznie `gra/tools/*` (3 nowe pliki) +
raport i dowody runu**. Dwa równoległe tematy (§2b) nietknięte — nie dotykam `gra/src`.

---

## 6. Kontrola rejestru (§16b pkt 6) — ZNALEZISKO PROCESOWE

| co | stan faktyczny |
|---|---|
| `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1` w `REJESTR-PROSB-I-ZADAN.md` | **BRAK WPISU** |
| `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1` w rejestrze (l. 38) | `ZDEPLOYOWANE`, komentarz: **„Nic do dispatchu"** |

Uzasadnienie tego wpisu brzmi dosłownie: *„Zweryfikowane ponownie 2026-08-21:
`forced-war-stone-test` + `forced-war-stone-main-guard-test` nadal zielone. Nic do
dispatchu."* **To jest dokładnie ten sposób rozumowania, który dispatch tego tematu
zakazuje** („ZAKAZ odpowiadania »bramki są zielone, więc działa«"). Audyt pokazał,
że mechanizm jest zaimplementowany i ma zielone bramki jednostkowe, a mimo to
**w rozgrywce nie odpala ani razu**. Wpis rejestru jest więc formalnie prawdziwy
i merytorycznie mylący.

**Nie poprawiam go** — rejestr jest poza moją allowlistą i należy do orkiestratora.
Zgłaszam jako pozycję do domknięcia razem z decyzją właściciela.

---

## 7. Werdykt wobec znalezisk Z1–Z8

Każde sprawdzone przeze mnie **niezależnie, w źródle**, nie przez przepisanie raportów.

| id | zgłosił | mój werdykt | podstawa |
|---|---|---|---|
| **Z1** | Operator | **POTWIERDZAM — dowód źródłowy, nie statystyka** | wyczerpujące przeszukanie `gra/src` po `startCityState`: kasowanie flagi w DOKŁADNIE jednym miejscu (`main.ts:23625`, wchłonięcie dyplomatyczne); obie ścieżki podboju militarnego jej nie zerują |
| **Z2** | Operator | **POTWIERDZAM, ale przekwalifikowuję** — to nie „rzadko spełniona brama", tylko **tożsamość arytmetyczna**; scala się z Z6 | `main.ts:27615`/`:27647`, `diplomacy.ts:1590-1592`, `:1739`, `:1032`, `:791-798`, `ai.ts:4219-4222`, `:4377-4384` |
| **Z3** | Operator | **POTWIERDZAM jako wynik POMIAROWY** (nie dowód) — relacja AI↔AI startuje na `20+30 = 50` (`diplomacy.ts:179-180`) przy progu 30; w 111 594 ocenach Operatora nie spadła ani razu. To liczba z przebiegów, więc obowiązuje tylko dla zmierzonych 60 tur | pomiar Operatora + moja weryfikacja stałych |
| **Z4** | Operator | **POTWIERDZAM — dowód źródłowy** | `main.ts:7753` (`if (declarerId !== 0 && targetId !== 0) return;`); jedyny kanał to sekcja „Wojny znane (wywiad)" w `ui/diplomacyPanel.ts:282-289` |
| **Z5** | Operator | **POTWIERDZAM CO DO MECHANIZMU, OSŁABIAM CO DO SKALI** — patrz §8 | `main.ts:27746` (`contactedOwners = getDiplomaticContacts()` = zbiór odkryty przez **gracza**), `diplomacy-layers.ts:252-253`, `:265` |
| **Z6** | Evaluator | **POTWIERDZAM** — odtworzyłem ten dowód niezależnie i wychodzi identycznie, łącznie z minimum `effProgWojnaSila = 0,38` (`warSilaBonus` min `-(0,06+0,04) = -0,10`, `ai.ts:4044-4048`) | jw. |
| **Z7** | Evaluator | **POTWIERDZAM** | `main.ts:27193` (`_menuCityStateDifficultyVsPlayer === 'hard'`), `:29919-29922` (wprost z trudności gry), `:29902` (domyślnie `'normal'`) |
| **Z8** | Evaluator | **POTWIERDZAM** | `diplomacy-layers.ts:265` vs komentarz przy `filterDiplomacyCommandsForEstablishedContact` |

**Dokładam własną obserwację Z9 (nowa, nie zgłoszona przez żadną z ról):**
nawet gdy wojna wymuszona AI↔AI już wybuchnie, **nie ma czym się skończyć**.
Automatyczny pokój po 2 miastach jest wpięty wyłącznie w przejęcie miasta
(`main.ts:12473`, `:24039`), a negocjacje pokojowe obsługują tylko `targetId === 0`
(`main.ts:28195-28206`) — co potwierdza komentarz w samym kodzie (`main.ts:12464-12471`:
*„dla par AI↔AI to dziś JEDYNA droga zakończenia wojny"*). W przebiegu mutanta
Evaluatora 3 wojny zaczęte w turach 20–21 **wciąż trwały w turze 46**
(`warEndings: []`, `warsAtEnd: ["1_15","22_29","8_36"]`). Kontrakt Q3=A
(„automatyczny pokój po zdobyciu lub utracie 2 miast, 20 tur odpoczynku")
jest więc dziś **nieosiągalny w praktyce dla par AI↔AI**.

---

## 8. Wyniki mojego pomiaru

Każda liczba: **ziarno · liczba tur · liczba powtórzeń**. Powtórzenie = jeden pełny
przebieg gry od `doStartGame` do tury końcowej.

### 8.1 Tabela główna

| przebieg | ziarno | tur | powt. | **wypowiedzeń wojny** | z graczem | `pending` Kamienia (max) | `stoneActive` (max) |
|---|---|---|---|---|---|---|---|
| pasywny (nowe ziarno) | **505** | 61 | 1 | **0** | **0** | **0** | **0** |
| „aktywny" (patrz 8.4) | **111** | 61 | 1 | **0** | **0** | **0** | **0** |

**`pending` nigdy nie był niepusty ani przez jedną turę w żadnym z 61 zrzutów ×
2 przebiegi.** Mechanizm nie jest „rzadko odpalany" — on nie startuje w ogóle.

### 8.2 Bramka `isOwnerClusterCityState` — moment przeskoku (potwierdzenie Z1)

Główne cywilizacje AI to zawsze **6 ownerów: 1, 8, 15, 22, 29, 36**.

| ziarno | AI 1 | AI 8 | AI 15 | AI 22 | AI 29 | AI 36 | miast przy przeskoku |
|---|---|---|---|---|---|---|---|
| 505 (61 tur) | t.**6** | t.**6** | t.**6** | t.**7** | t.**7** | t.**8** | **2** (każde) |
| 111 (61 tur) | t.**7** | t.**7** | t.**7** | t.**7** | t.**7** | t.**7** | **2** (każde) |

**12/12 przypadków: przeskok następuje w turze 6–8, przy 2 miastach, po zdobyciu
1 miasta z flagą `startCityState`.** Wojna wymuszona Kamienia startuje dopiero
w turze 20 — czyli **12–14 tur po tym, jak wszyscy kandydaci zostali już trwale
wykluczeni**. Zgodne co do cyfry z Operatorem (18/18) i Evaluatorem (t.6–7).

### 8.3 Brama AI→gracz mierzona ze STANU (potwierdzenie Z2/Z6 pomiarem)

Mierzę inaczej niż obie role: nie instrumentuję decyzji ani nie liczę komend —
czytam `zaufanie` i `respekt` prosto z relacji i liczę `score = zaufanie + respekt`.

| ziarno | tur | obserwacji (AI odkryte) | `score < 30` | **min `score`** | min `zaufanie` | próg |
|---|---|---|---|---|---|---|
| 505 | 61 | 183 | **0** | **77** | 47 | 30 |
| 111 | 61 | 183 | **0** | **77** | 47 | 30 |

**Zapas do progu wynosi 47 punktów w najgorszym zmierzonym przypadku** — a `zaufanie`
samo w sobie nigdy nie spadło poniżej 47, przy czym `zaufanie` ma podłogę 0 i już
sam `respekt` przekracza próg. To jest empiryczne potwierdzenie dowodu z §3.2.

### 8.4 UCZCIWA KOREKTA — scenariusz aktywny w pierwszym podejściu NIE ZADZIAŁAŁ

**To jest brak dowodu, nie wynik (§13a), i zgłaszam go jako brak dowodu.**

Pierwsza wersja mojego sterownika kolejkowała zwiadowcę w **kolejce Pracy**
(`setCityProduction`). Pomiar pokazał, że to nie działa: `prodLog` = `queued:Zwiadowca`
w turze 0, a **`plrUnits = 0` we wszystkich 61 zrzutach** i 1 miasto przez cały przebieg.
Jednostki w tej grze nie powstają z Pracy — kanoniczna ścieżka to
`purchaseRecruitmentUnit` (`main.ts:3462`, opłata ze skarbca + Manpower + surowce;
komentarz w kodzie: gracz i AI idą „tę samą ścieżkę"). **Przebieg oznaczony „aktywny
seed 111" jest więc de facto drugim przebiegiem PASYWNYM** i tak go liczę — daje
drugie ziarno kontrolne, nie test scenariusza aktywnego.

Zrzut tego nieudanego przebiegu zostaje w `dowody-fc/` jako dowód korekty (§13b).

### 8.5 SCENARIUSZ AKTYWNY — powtórzony poprawną ścieżką. **To jest rozstrzygnięcie**

Po korekcie sterownika (`purchaseRecruitmentUnit` zamiast kolejki Pracy) scenariusz
aktywny **zadziałał naprawdę**. Przebieg: ziarno **111**, **61 tur**, **1 powtórzenie**.

Przebieg gracza, tura po turze (z `prodLog`, liczby ze skarbca):

| tura | co się stało |
|---|---|
| 0–8 | skarbiec rośnie 0 → 14 (+2/turę); zwiadowca kosztuje **16** — nie stać |
| **9** | `bought:16` — zwiadowca opłacony, skarbiec 16 → 0 |
| **10** | zwiadowca w polu, **„Zwiedzaj" włączone** (1. rozkaz) |
| **26** | drugi zwiadowca (skarbiec 139) |
| **27** | **„Zwiedzaj" włączone** (2. rozkaz) |
| 47, 49, 51 | **nowe kontakty dyplomatyczne** — 46, 47, 48 |

**Eksploracja faktycznie zadziałała** — to nie jest kolejny przebieg pasywny:

| miara | pasywny (505) | pasywny (111) | **aktywny (111)** |
|---|---|---|---|
| zwiadowcy gracza na koniec | 0 | 0 | **2** |
| rozkazów „Zwiedzaj" | 0 | 0 | **2** |
| odkrytych cywilizacji na koniec | 3 | 3 | **6** (43,44,45,**46,47,48**) |
| rekordów warstwy `simplified` | 183 | 183 | **219** |
| rekordów warstwy `pre_contact` | 1236 | 1233 | **1192** |

**A mimo to:**

| miara | wynik |
|---|---|
| **wypowiedzeń wojny (61 tur)** | **0** |
| z graczem | **0** |
| `pending` wojny Kamienia (max) | **0** |
| odkrytych **głównych** AI (1, 8, 15, 22, 29, 36) | **0 z 6** |
| rekordów warstwy `full` | **0** |
| `score < 30` na 219 obserwacji | **0** (min `score` = **77**) |
| kart „Wydarzenia" o wojnie | **0** |
| wierszy „Wojny znane (wywiad)" | **0** |
| `unblock()` / błędy strony | **0** / **0** |

**Wniosek metodologiczny — i to jest odpowiedź na regułę przeciw samooszukiwaniu:**
wspólny stub obu ról **istnieje i jest realny**, ale **nie jest przyczyną wyniku**.
Złamałem go prawdziwą akcją gracza, eksploracja się odbyła, liczba kontaktów wzrosła
z 3 do 6, warstwy się przesunęły — **a odpowiedź nie drgnęła: nadal zero wojen.**
Dwa niezależne pomiary tej samej wady nie byłyby dowodem; **trzeci pomiar, który
celowo usunął wspólny błąd i dał ten sam wynik — jest.**

**Dodatkowa liczba o realnym znaczeniu dla właściciela:** dwaj zwiadowcy zwiedzający
mapę przez 51 tur odkryli **wyłącznie miasta-państwa**. Żadna z 6 głównych cywilizacji
AI nie została odkryta przez **61 tur**. Główne AI są po prostu za daleko.

---

## 9. Odpowiedzi na 5 punktów dispatchu

| # | pytanie | odpowiedź |
|---|---|---|
| **1** | Czy wojna wymuszona Kamienia wybucha? | **NIE. 0 razy.** Mój pomiar: 3 przebiegi × 61 tur (ziarna 505, 111, 111-aktywny) = **183 tury**. Razem z Operatorem (180) i Evaluatorem (167): **530 tur rozgrywki, 0 wypowiedzeń wojny.** „Ile trwała / jak się skończyła" — **BRAK DOWODU**, bo żadna nie wybuchła (§13a) |
| **2** | Czy AI wypowiada wojnę graczowi? | **NIE, i nie może.** Nie „rzadko" — **arytmetycznie niemożliwe** przy trudności Łatwy i Normalny (dowód §3.2). Rozkład kluczowej liczby: `score` min **77** przy progu **30**, w 585 obserwacjach (183+183+219), `score < 30` w **0** |
| **3** | Hipoteza właściciela o miastach-państwach | **Fakt potwierdzony, skutek odwrócony** — patrz §10 |
| **4** | Czy gracz jest wykluczony filtrem `oid > 0`? | **TAK, podwójnie** (§3.3). Zgodne z decyzją Q2 — **nie defekt** |
| **5** | Czy gracz widzi wojny AI↔AI? | **NIE.** `recordWarDeclarationEvent` odrzuca pary AI↔AI (`main.ts:7753`). Jedyny ślad to sekcja „Wojny znane (wywiad)" w panelu dyplomacji (`ui/diplomacyPanel.ts:282-289`) — i tylko dla odkrytych stron. Zmierzone: **0 kart, 0 wierszy** w 3 przebiegach |

---

## 10. Hipoteza właściciela — rozstrzygnięcie

> „Możliwe, że chodzi o to, że dłużej zajmuje im przejęcie własnych państw i miast,
> i dopiero po przejęciu mogą to robić, **bo tak w sumie powinno być**."

**Właściciel trafnie wskazał WŁAŚCIWY MECHANIZM — i to jest realne osiągnięcie
diagnostyczne.** Przejmowanie miast-państw jest faktycznie przyczyną. Zmierzone:
konsolidacja trwa i kończy się w okolicach tury 20–25, więc również intuicja
czasowa („dłużej im to zajmuje") jest trafna.

**Ale skutek jest dokładnie odwrotny do oczekiwanego, i dlatego to NIE jest
potwierdzenie projektu.** Nie ma żadnego „dopiero po przejęciu mogą to robić".
**Pierwsze** przejęcie — tura **6–8**, przy 2 miastach, **12/12 przypadków w moich
przebiegach** — wyłącza cywilizację z mechanizmu **na stałe**. Nie na 20 tur.
Na zawsze. Do tury 20, kiedy wojna wymuszona ma prawo wystartować, **wszyscy
sześciu kandydatów są już trwale wykluczeni**, a `pending` pozostaje pusty przez
całą grę (max **0** w 183 turach).

**Odpowiadam wprost, tak jak wymaga zadanie: hipoteza się NIE potwierdza.**
Właściciel wskazał właściwą przyczynę, ale „tak w sumie powinno być" nie ma tu
zastosowania — to nie jest zaprojektowane opóźnienie, tylko **defekt**: flaga
`startCityState` jest kasowana wyłącznie przy wchłonięciu dyplomatycznym
(`main.ts:23625`) i nigdy przy podboju militarnym.

---

## 11. Raport terminalny

STATUS: **PASS-WITH-NOTES**
DOMAIN: GAME
TEMAT: `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`
GOAL: trzecia niezależna reprodukcja + odpowiedź dla właściciela — **wykonane**.
MODEL+EFFORT: **Opus 5, effort high**

ZMIANY-COMMIT: gałąź `autobot/P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`.
Pliki: `gra/tools/wojny-kamien-fc.vite.config.ts`, `gra/tools/wojny-kamien-fc.cjs`,
`gra/tools/wojny-kamien-fc-analiza.cjs`, ten raport, `dowody-fc/` (3 zrzuty JSON).
**`gra/src/**` i `gra/data/**`: ZERO ZMIAN** — `git status --porcelain` pusty,
`git diff origin/main HEAD -- gra/src gra/data` pusty.

TESTY: tsc **0** · logic **213/213** · tech-tree **19/0** · research **33/33** ·
unit-replace **13/13** · combat **6/6** · forced-war-stone **32/0** ·
forced-war-stone-main-guard **18/0** · ai-war-gate **24/0** ·
diplomacy-war-gates **19/0** · alliance-war-obligation **14/0**.
Wszystkie uruchomione przeze mnie w moim worktree. `map-gen-regression-test`
nieuruchamiany (zakaz dispatchu).

BLOKADY: brak.

**NOTY (dlaczego `PASS-WITH-NOTES`, a nie `PASS`):**
1. **N1** — pierwsze podejście do scenariusza aktywnego użyło złej ścieżki (kolejka
   Pracy zamiast rekrutacji); wykryte pomiarem, poprawione, powtórzone, obie wersje
   w historii Git (`36fb72a8`). Zgłaszam jawnie zgodnie z §13b.
2. **N2** — `Z3` (relacja AI↔AI nigdy nie spada poniżej 30) opiera się na pomiarze
   Operatora, nie na dowodzie źródłowym: obowiązuje dla zmierzonych 60 tur, **nie**
   jako twierdzenie ogólne. Zgłaszam jako ograniczenie zasięgu, nie jako zielone.
3. **N3** — scenariusz aktywny wykonany na **jednym** ziarnie (111). Wystarcza do
   obalenia zarzutu o wspólny stub (bo wynik się nie zmienił mimo realnej zmiany
   warunków), ale **nie** jest podstawą do twierdzeń statystycznych o eksploracji.
4. **N4 (procesowe)** — `REJESTR-PROSB-I-ZADAN.md` nie zawiera tego tematu, a wpis
   `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1` (l. 38) mówi „Nic do dispatchu", uzasadniając
   to zielonymi bramkami. Poza moją allowlistą — do domknięcia przez orkiestratora.
5. **N5** — nowe znalezisko **Z9** (§7): wojna wymuszona AI↔AI nie ma dziś jak się
   zakończyć, więc kontrakt Q3=A jest w tej części nieosiągalny.

RUNDY: 1/5
GOTOWOŚĆ DO INTEGRACJI: **NIE DOTYCZY** — dispatch: „ten temat nie kończy się
integracją kodu". Kończy się decyzją właściciela w sprawie Z1, Z2/Z6, Z4, Z5, Z7, Z9.
NASTĘPNY KROK: **decyzja właściciela (ABC)**, jakie znaleziska naprawiać i w jakiej
kolejności; każda naprawa = osobny temat z własnym ID.
DEPLOY-PUSH: **NIE WYKONANO** (wypchnięta wyłącznie gałąź tematu).

---

## ODPOWIEDŹ DLA WŁAŚCICIELA

**Nie, w epoce Kamienia wojny nie wybuchają — ani jedna.** Sprawdziliśmy to trzema
niezależnymi narzędziami, na pięciu różnych mapach, przez ponad 500 tur prawdziwej
rozgrywki: zero wypowiedzeń wojny, między kimkolwiek. Mechanizm, który Pan zamówił,
jest napisany dokładnie tak, jak Pan zdecydował — start po 20 turach, koniec po
dwóch miastach, 20 tur odpoczynku — i ma zielone testy, ale **ani razu się nie
uruchamia**, więc zielone testy nic tu nie znaczyły.

**Przyczyna jest jedna i da się ją wskazać palcem.** Gdy cywilizacja AI zdobędzie
swoje pierwsze miasto należące wcześniej do miasta-państwa — a dzieje się to
w turze 6, 7 albo 8, u wszystkich sześciu cywilizacji, w każdej sprawdzonej grze —
gra od tego momentu traktuje **ją samą** jak miasto-państwo. Na stałe. A wyzwalacz
wojny miasta-państwa pomija. Zanim więc wybije tura 20, wszyscy kandydaci do wojny
są już z niej trwale wykreśleni.

**To, że nikt nie wypowiada wojny akurat Panu, to osobna sprawa i nie jest to pech.**
Po pierwsze, wojna wymuszona z założenia celuje wyłącznie w inne AI, nigdy w gracza —
i to akurat jest zgodne z Pana własną decyzją, więc nie jest błędem. Po drugie,
zwykła ścieżka wypowiedzenia wojny graczowi jest **arytmetycznie niemożliwa**: ta sama
liczba opisuje jednocześnie „jak silne jest AI wobec Pana" i „jak dobre są z Panem
stosunki", więc im AI silniejsze, tym **dalej** mu do wojny z Panem. W 585 pomiarach
najgorszy wynik relacji to 77 punktów, a wojna wymaga zejścia poniżej 30 — nigdy się
to nie zdarzy przy ustawieniach domyślnych.

**Pana hipoteza: trafił Pan w przyczynę, ale skutek jest odwrotny — i muszę
powiedzieć wprost, że się nie potwierdza.** Owszem, AI zajmują się przejmowaniem
miast-państw i kończą to mniej więcej w turach 20–25, więc Pana wyczucie było dobre.
Ale to nie jest opóźnienie, po którym wojna w końcu przyjdzie — pierwsze przejęcie
wyłącza cywilizację z mechanizmu **na zawsze**. Więc „tak w sumie powinno być"
niestety nie ma tu zastosowania: to nie jest zaprojektowane zachowanie, tylko błąd
(flaga „to było miasto-państwo" jest kasowana tylko przy pokojowym wchłonięciu,
a nigdy przy zdobyciu siłą).

**Dwie rzeczy praktyczne na koniec.** Jedyna droga, którą dziś ktokolwiek może Panu
wypowiedzieć wojnę w Kamieniu, otwiera się dopiero na poziomie trudności „Trudny" —
na „Normalnym" nie może tego zrobić nikt. I nawet gdyby wojny między AI zaczęły
wybuchać, **nie zobaczyłby Pan o nich żadnej karty w Wydarzeniach** — jedyny ślad
to lista „Wojny znane (wywiad)" w panelu dyplomacji, którą trzeba samemu otworzyć.
Nic tu nie naprawiałem — to był audyt; każda naprawa wymaga Pana decyzji i osobnego
zadania.

**PRACA ZACOMMITOWANA NA GAŁĄŹ: TAK, SHA: (uzupełnione poniżej po commicie)**
