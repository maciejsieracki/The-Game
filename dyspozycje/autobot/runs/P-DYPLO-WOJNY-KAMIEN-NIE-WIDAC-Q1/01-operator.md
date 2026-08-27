# 01 — OPERATOR (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`
GOAL: Odpowiedzieć **liczbami** na pytanie właściciela: czy w epoce Kamienia wojny
wybuchają, ile ich jest, kiedy — i dlaczego gracz ich nie odczuwa. **Audyt, nie naprawa.**
MODEL+EFFORT: **Opus 5, effort high** (Operator).
RUNDY: 1/5 · DEPLOY/PUSH: **NIE WYKONANO**

---

## 0. Odpowiedź w jednym akapicie

**W epoce Kamienia nie wybucha ŻADNA wojna — ani AI↔AI, ani AI→gracz.** 3 ziarna × 60 tur
= 180 tur rozgrywki w żywej przeglądarce: **0 par w stanie wojny przez cały przebieg**.
Przyczyny są **trzy, niezależne, każda wystarczająca sama w sobie**, wszystkie zmierzone:

- **Z1 — mechanizm nigdy nie startuje.** Bramka `!isOwnerClusterCityState(ownerId, …)`
  w wyzwalaczu (`main.ts:28025`) staje się `false` dla **wszystkich 6 głównych cywilizacji
  AI już w turze 6–8** — 12–14 tur **przed** turą 20, w której mechanizm miałby ruszyć.
  Zbiór `stoneForceWarPendingOwners` pozostaje **pusty przez 180 tur**. Powodem jest
  przejęcie miasta byłego miasta-państwa: znacznik `startCityState` **nie jest wtedy
  kasowany**, więc zdobywca na stałe liczy się jako miasto-państwo.
- **Z5 — nawet po usunięciu Z1 wojna nie dochodzi do skutku.** Przebieg z mutantem M1
  (§6) pokazuje, że po odblokowaniu Z1 mechanizm działa **poprawnie i deterministycznie**:
  w turze 20 wszystkie 6 cywilizacji trafia do `pending` i **wybiera cele** (1→15, 8→36,
  15→1, 22→29, 29→22, 36→8). Wojna i tak nie wybucha, bo `diplomacyLayerForOwner` zwraca
  `'pre_contact'` dla każdego AI, którego **GRACZ** jeszcze nie odkrył, a
  `filterDiplomacyCommandsForLayer` zwraca wtedy **pustą listę** — kasuje komendy AI
  **łącznie z wypowiedzeniem wojny innemu AI**. Zmierzone: 0 z 6 głównych AI miało kontakt
  z graczem przez cały przebieg. **Wojny między AI po drugiej stronie mapy są wyciszane
  mgłą wojny gracza.**
- **Z2 — wobec gracza brama wojny jest sprzecznie skonfigurowana.** `respekt` w relacji
  z graczem jest nadpisywany jako `computeRespekt = round(100·rw)` (`main.ts:27615`), więc
  `score = zaufanie + respekt >= 100·rw`; brama wymaga jednocześnie `rw >= progSila`
  (podłoga 0,3) **i** `score < 30`. W **591 ocenach AI→gracz** warunek siły był spełniony
  **591 razy (100%)**, warunek relacji **0 razy (0%)**, a `score − 100·rw` nigdy nie spadło
  poniżej **+18,0**.

Hipoteza właściciela („dłużej im zajmuje przejęcie własnych miast-państw") jest
**potwierdzona co do faktu, ale odwrócona co do skutku**: to właśnie przejęcie
miasta-państwa **trwale wyłącza** cywilizację z mechanizmu (Z1).

**Bramki 32/0 i 18/0 nie są tu dowodem niczego** — pinują kontrakt jednostkowy modułu
`forced-war-stone.ts` i tekstowe wiązanie z `main.ts`; żadna nie sprawdza, czy wyzwalacz
jest w rozgrywce osiągalny, ani czy wyprodukowana komenda przeżywa filtry `main.ts` (§13a).

---

## 1. Jak to zmierzono (metoda, nie deklaracja)

| element | wartość |
|---|---|
| ścieżka pomiaru | **prawdziwa pętla tury** — `doStartGame(params)` (ta sama funkcja, którą wywołuje kreator nowej gry, `main.ts:30373`) + `triggerPlayerEndTurn()` w żywym Chromium na artefakcie `vite build` |
| instrumentacja | wstrzykiwana **w pamięci** przy buildzie (`gra/tools/wojny-kamien-audyt.vite.config.ts`); **pliki `gra/src/**` i `gra/data/**` nietknięte** — 5 kotwic, brak kotwicy = twardy błąd buildu |
| co rejestrowano | dla KAŻDEJ pary (AI, partner) i KAŻDEJ tury: `rw`, `score`, `stanWojny`, `peaceLocked`, `hasNapTreaty`, `willingnessWar`, `effAgresja`, `progSila`, `progAgresja`, `progRel` — wprost z `decideAIDiplomacy` (`ai.ts`, priorytet 4), plus stan `stoneForceWarPendingOwners/CycleOwners/ActiveByPairKey`, lista kandydatów wymuszonej wojny i `aiOwnerList` |
| ziarna | **111, 222, 333** (3 powtórzenia) |
| tur na ziarno | **60** (wymóg dispatchu ~60; mechanizm startuje w 20) |
| parametry | domyślne kreatora: Normalny · Standardowy · Kontynenty · epoka Kamienia · 7 typów cywilizacji · 6 miast-państw · barbarzyńcy „normalny" · bitwy automatyczne |
| gracz | pasywny: zakłada pierwsze miasto i kończy tury. **Zwiadowcy gracza i tak eksplorują** — silnik robi to sam co turę (`runScoutsAutoExplore`, `main.ts:25459`), a to jest dokładnie ścieżka nawiązania kontaktu dyplomatycznego |
| czas | 1885 s / 1811 s / 2031 s na ziarno; mediana tury 18,5–21,3 s |
| przebieg kontrolny | **mutant M1** (§6): ten sam harness, jedna mutacja w pamięci, ziarno 111, 32 tury — dowód nietautologiczności i przyczynowości |
| surowe dane | `dowody/pomiar-seed-{111,222,333}.json` · `dowody/konsola-seed-*.txt` · `dowody/mutant-M1-seed-111.json` · `dowody/mutant-M1-konsola-seed-111.txt` · pełne tabele: `dowody/analiza-pelna.md` · agregat: `dowody/summary.json` |

---

## 2. Punkt 1 — czy wymuszona wojna Kamienia w ogóle wybucha

**NIE. Zero razy, w żadnym ziarnie.**

| ziarno | tur | wojen wymuszonych Kamienia | par w `stoneForceWarActiveByPairKey` | logów konsoli mechanizmu | par w stanie wojny (dowolny mechanizm) |
|---|---|---|---|---|---|
| 111 | 60 | **0** | 0 | 0 | **0** |
| 222 | 60 | **0** | 0 | 0 | **0** |
| 333 | 60 | **0** | 0 | 0 | **0** |

Rozbicie NA POWÓD — mechanizm zatrzymuje się na pierwszym kroku:

| ziarno | głównych cyw. AI | ile trafiło do `pending` | ile miało wybrany cel | ile weszło do `cycle` | wywołań budowy `stoneCandidates` |
|---|---|---|---|---|---|
| 111 | 6 (id 1, 8, 15, 22, 29, 36) | **0** | **0** | **0** | **0** |
| 222 | 6 (id 1, 8, 15, 22, 29, 36) | **0** | **0** | **0** | **0** |
| 333 | 6 (id 1, 8, 15, 22, 29, 36) | **0** | **0** | **0** | **0** |

**Blokujący warunek jest jeden i ten sam** — `!isOwnerClusterCityState(ownerId, ownerCityStateOpts())`
w wyzwalaczu (`main.ts:28025`):

| ziarno | AI | `isOwnerClusterCityState` w turze 1 | pierwsza tura `true` | miast w tej turze | wartość w turze 20 |
|---|---|---|---|---|---|
| 111 | 1 / 8 / 15 | false | **6 / 6 / 6** | 2 | **true → wykluczony** |
| 111 | 22 / 29 / 36 | false | **7 / 7 / 7** | 2 | **true → wykluczony** |
| 222 | 1 / 8 / 15 / 22 / 29 / 36 | false | **6 / 6 / 6 / 6 / 6 / 6** | 2 | **true → wykluczony** |
| 333 | 1 / 8 / 15 / 22 / 29 / 36 | false | **7 / 6 / 6 / 7 / 8 / 7** | 2 | **true → wykluczony** |

Flaga przeskakuje **dokładnie w turze, w której AI zdobywa drugie miasto** — 18/18 przypadków.
`isOwnerClusterCityState` (`game/display-names.ts:50`) ma trzy gałęzie; `typCopyOwners`
zmierzono jako `false` dla tych ownerów przez cały przebieg, a `simplifiedDiplomacyOwners`
jest zapisywane wyłącznie razem z `typCityCopyOwners` (`main.ts:8025-8026`) — zostaje więc
**tylko** `cities.some(c => c.ownerId === ownerId && c.startCityState)`. Znacznik
`startCityState` jest kasowany **jedynie przy wchłonięciu dyplomatycznym**
(`main.ts:23625`), nie przy przejęciu miasta. **Skutek: cywilizacja, która przejmie miasto
byłego miasta-państwa, na stałe liczy się jako miasto-państwo** i jest wykluczona zarówno
z wyzwalacza Kamienia, jak i z listy kandydatów-celów. Ten sam guard stoi w bloku wojny
wymuszonej **Brązu** (`main.ts:27963`) — problem nie jest lokalny dla Kamienia.

Długość i sposób zakończenia wojny: **BRAK DOWODU — nie było czego mierzyć** (0 wojen).

---

## 3. Punkt 2 + kluczowa liczba audytu — AI vs GRACZ

**Zero wypowiedzeń wojny graczowi.** Rozbicie na warunek — wszystkie oceny AI×tura:

| ziarno | ocen AI→gracz | `stanWojny` | `peaceLocked` | `nap` | `willWar<=0` | **`rw < progSila`** | **`effAgresja < progAgresja`** | **`score >= progRel`** | ocen z KOMPLETEM warunków |
|---|---|---|---|---|---|---|---|---|---|
| 111 | 174 | 0 | 0 | 0 | 0 | **0 (0,0%)** | 0 (0,0%) | **174 (100%)** | **0** |
| 222 | 211 | 0 | 0 | 0 | 0 | **0 (0,0%)** | 37 (17,5%) | **211 (100%)** | **0** |
| 333 | 206 | 0 | 0 | 0 | 0 | **0 (0,0%)** | 32 (15,5%) | **206 (100%)** | **0** |
| **razem** | **591** | 0 | 0 | 0 | 0 | **0** | 69 | **591 (100%)** | **0** |

### Rozkład `respektWzgledny` AI-vs-gracz (kluczowa liczba tego audytu)

| ziarno | n odczytów | min | **mediana** | max | ile >= progu siły |
|---|---|---|---|---|---|
| 111 | 174 | 0,486 | **0,730** | 0,799 | **174 / 174** |
| 222 | 211 | 0,500 | **0,793** | 0,976 | **211 / 211** |
| 333 | 206 | 0,500 | **0,625** | 0,935 | **206 / 206** |

**To obala hipotezę „przewaga 1,5:1 nad graczem jest w Kamieniu rzadka".** Jest wręcz
odwrotnie: AI ma przewagę **zawsze** (100% odczytów powyżej progu, mediana 0,63–0,79,
maksimum 0,976 = AI ~40× silniejsza). Blokuje **wyłącznie relacja**.

### Dlaczego relacja nie może spaść — test sprzeczności konstrukcyjnej

`main.ts:27615` nadpisuje `respekt` w relacji z graczem: `respekt = computeRespekt(potAI, potPlr)
= round(100 · rw)`. `relationScore = zaufanie + respekt` (`diplomacy.ts:791`), `zaufanie ∈ [0,100]`.
Zatem **`score >= 100 · rw` z definicji**. Brama wymaga `rw >= progSila` **oraz** `score < 30`,
a `progSila` ma podłogę `Math.max(0.3, …)` (`ai.ts:4219`) — te dwa warunki nie mogą być
prawdziwe naraz.

| ziarno | ocen | `rw >= progSila` | `score < progRel` | **oba naraz** | min(`score` − 100·`rw`) | min `progSila` | max `progRel` |
|---|---|---|---|---|---|---|---|
| 111 | 174 | 174 | 0 | **0** | **+48,21** | 0,380 | 30 |
| 222 | 211 | 211 | 0 | **0** | **+18,01** | 0,380 | 30 |
| 333 | 206 | 206 | 0 | **0** | **+18,07** | 0,380 | 30 |

Ta sama brama AI↔AI (dla kontrastu — tam `respekt` NIE jest nadpisywany mocą, więc
`score` i `rw` są niezależne):

| ziarno | ocen AI↔AI | `rw >= progSila` | `score >= progRel` | **ocen z kompletem warunków** |
|---|---|---|---|---|
| 111 | 36 562 | 13 002 | 36 562 (100%) | **0** |
| 222 | 38 410 | 12 839 | 38 410 (100%) | **0** |
| 333 | 36 622 | 13 307 | 36 622 (100%) | **0** |

W 111 594 ocenach AI↔AI relacja **ani razu** nie spadła poniżej 30 w 60 turach — start to
`zaufanie 20 + respekt 30 = 50` (`diplomacy.ts:179-180`), a w epoce Kamienia nic tego nie
zbija. Zwykła ścieżka `wypowiedz_wojne` jest więc w Kamieniu martwa **dla wszystkich par**,
nie tylko wobec gracza.

---

## 4. Punkt 3 — hipoteza właściciela o przejmowaniu miast-państw

Zmierzone: **korelacja JEST, ale jej znak jest odwrotny do oczekiwanego.**

| ziarno | miast-państw z miastami: start → koniec | tura, w której liczba się stabilizuje | tura wykluczenia AI z mechanizmu | tura startu mechanizmu | pierwsza wojna |
|---|---|---|---|---|---|
| 111 | 42 → 12 | 25 | **6–7** | 20 | **brak** |
| 222 | 42 → 12 | 24 | **6** | 20 | **brak** |
| 333 | 42 → 12 | 24 | **6–8** | 20 | **brak** |

Konsolidacja klastrów kończy się w turach 24–25, czyli **po** turze 20 — więc sama
intuicja właściciela („najpierw przejmują swoje, potem walczą") jest zgodna z rytmem gry.
Problem w tym, że **pierwsze** przejęcie (tura 6–8) już na stałe wyłącza cywilizację
z mechanizmu, więc czekanie do tury 24 niczego nie odblokuje. **To nie jest potwierdzenie
projektu — to defekt.**

---

## 5. Punkt 4 — czy gracz jest strukturalnie wykluczony przez filtr `oid > 0`

**TAK — potwierdzone POMIAREM** (przebieg bazowy nie dochodził do tego filtra; rozstrzyga
dopiero przebieg z mutantem M1, w którym lista kandydatów jest realnie budowana).

| przebieg | wywołań budowy `stoneCandidates` | z owner 0 w `aiOwnerList` | z owner 0 w `stoneCandidates` |
|---|---|---|---|
| bazowy, ziarno 111 | 0 | 0 | 0 |
| bazowy, ziarno 222 | 0 | 0 | 0 |
| bazowy, ziarno 333 | 0 | 0 | 0 |
| **mutant M1, ziarno 111** | **81** | **0** | **0** |

Owner 0 nie pojawia się nawet w `aiOwnerList` — jest wykluczony **wcześniej** niż na
filtrze `oid > 0` (`main.ts:28063-28069`). **Gracz nigdy nie może być celem wymuszonej
wojny Kamienia.** Jest to zgodne z literą decyzji `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1`
(Q2: „cel ma być najbliższą terytorialnie cywilizacją AI"), więc **nie jest to defekt
implementacji** — ale dokładnie tłumaczy zdanie „nie widzę efektu, żeby ktoś wypowiedział
mi wojnę": ten mechanizm z założenia gracza nie dotyczy.

Uzupełniająco, z odczytu kodu: przy ustawieniach domyślnych **żadna ścieżka nie może
wypowiedzieć wojny graczowi** —
`wypowiedz_wojne` (sprzeczność Z2) ·
`resolveClusterCityStateWarOnPlayer` (`main.ts:27193`) wymaga trudności miast-państw
`hard`, a domyślna to „jak główna" ·
`ownerDeclareWarOn(proposer, 0)` (`main.ts:14627`, `:14768`) wymaga `payload.warThreat`,
którego AI nigdy nie ustawia (`diplomacy-proposals.ts:1582-1588` — `zadaj_trybut` idzie
bez `warThreat`) ·
`joinAllyToWar` wymaga, żeby wojnę zaczął gracz.

---

## 6. Mutant M1 — dowód przyczynowy i dowód nietautologiczności pomiaru

Sam odczyt „bramka jest `false` w turze 20" to korelacja, nie przyczyna — i nie odróżnia
„gra nie robi wojen" od „mój harness nic nie mierzy". Dlatego zbudowany został **drugi
bundel z jedną mutacją** (`WOJNY_AUDYT_MUTANT=1`): usunięta zostaje **trzecia gałąź**
klasyfikatora `isOwnerClusterCityState` (`display-names.ts:57` — `cities.some(c => c.ownerId
=== ownerId && c.startCityState)`), czyli dokładnie ta, którą wskazuje Z1. Mutacja żyje
**wyłącznie w pamięci buildu**; `gra/src/game/display-names.ts` jest nietknięty.

Ziarno 111, 32 tury (mechanizm startuje w 20):

| miara | przebieg BAZOWY | przebieg MUTANT M1 |
|---|---|---|
| głównych AI w `stoneForceWarPendingOwners` | **0** | **6** (id 1, 8, 15, 22, 29, 36) — wszystkie w turze **20** |
| rekordów z wybranym celem wymuszonej wojny | **0** | **81** |
| wybrane cele (tura 20) | — | 1→15 · 8→36 · 15→1 · 22→29 · 29→22 · 36→8 |
| wywołań budowy `stoneCandidates` | **0** | **81** |
| owner 0 wśród kandydatów | — | **0 / 81** |
| par w `stoneForceWarActiveByPairKey` | 0 | **0** |
| par w stanie wojny | 0 | **0** |

**Wniosek 1 (pomiar nie jest tautologiczny):** ta sama instrumentacja, ten sam harness,
to samo ziarno — a wyniki się rozjeżdżają dokładnie tam, gdzie przewiduje Z1. Harness
mierzy grę, nie siebie.

**Wniosek 2 (Z1 potwierdzone przyczynowo):** bramka `isOwnerClusterCityState` jest
**faktyczną** przyczyną tego, że wyzwalacz wojny Kamienia nigdy nie odpala. Po jej
usunięciu mechanizm działa dokładnie jak w decyzji `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1`:
tura 20, jednorazowy wpis, najbliższy sąsiad AI jako cel.

**Wniosek 3 (nowe znalezisko Z5, ważniejsze niż Z1):** mimo poprawnie wybranych celów
wojna **nadal nie wybucha**. Blokada leży w `main.ts:27743-27748` →
`diplomacyLayerForOwner(ownerId, simplifiedDiplomacyOwners, foreignTypeOwners, contactedOwners)`,
gdzie `contactedOwners = getDiplomaticContacts()` to zbiór AI odkrytych **przez GRACZA**
(`diplomacy-layers.ts:252-253`: brak w zbiorze → warstwa `'pre_contact'`), a
`filterDiplomacyCommandsForLayer` dla `'pre_contact'` zwraca **pustą tablicę**
(`diplomacy-layers.ts:265`) — kasując **wszystkie** komendy tego AI, w tym wypowiedzenie
wojny **innemu AI**. Zmierzone w przebiegu mutanta:

| AI | rekordów w turach ≥ 20 | z relacją z graczem (`relPartners` zawiera `'0'`) | wybrany cel |
|---|---|---|---|
| 1 | 13 | **0** | 15 |
| 8 | 14 | **0** | 36 |
| 15 | 14 | **0** | 1 |
| 22 | 14 | **0** | 29 |
| 29 | 13 | **0** | 22 |
| 36 | 13 | **0** | 8 |

Jedyne AI z relacją z graczem w całym przebiegu to `43, 44, 45` — miasta-państwa
własnego klastra gracza. Żadna z 6 głównych cywilizacji nie została przez gracza odkryta
przez 32 tury, więc **cała ich dyplomacja jest wyłączona**. Zwraca uwagę, że intencja
projektu jest przeciwna: komentarz przy `filterDiplomacyCommandsForEstablishedContact`
(`diplomacy-layers.ts:296`) mówi wprost „**Wojna może nastąpić po samym odkryciu na
mapie**" — bramka `pre_contact` tę intencję unieważnia.

---

## 7. Punkt 5 — czy gracz w ogóle widzi wojny AI↔AI

| ziarno | wpisów w panelu Wydarzeń | z tego `war-*` (wypowiedzenie wojny) | par AI↔AI w stanie wojny |
|---|---|---|---|
| 111 | 8 | **0** | 0 |
| 222 | 8 | **0** | 0 |
| 333 | 8 | **0** | 0 |

Pomiar nie rozstrzyga (0 wojen = 0 sygnałów). Z odczytu kodu, **jako znalezisko do
rejestru, nie jako wynik pomiaru**: `recordWarDeclarationEvent` (`main.ts:7752-7753`)
zaczyna się od `if (declarerId !== 0 && targetId !== 0) return;` — **wojna AI↔AI nie
tworzy żadnej karty w panelu Wydarzeń**, a jedyny ślad to `console.log` (`main.ts:28204`).
Jedyny kanał dla gracza to `collectKnownWarsBetweenOthers` (`main.ts:16067`) → panel
dyplomacji, czyli **kanał pasywny: gracz musi sam otworzyć panel i tam spojrzeć.** Zero
powiadomienia. To osobne znalezisko o realnym znaczeniu.

---

## 8. Znaleziska (OPISANE, NIE NAPRAWIONE — allowlista zabrania)

| id | opis | miejsce | waga |
|---|---|---|---|
| **Z1** | Przejęcie miasta z `startCityState` trwale klasyfikuje główną cywilizację AI jako miasto-państwo → wyzwalacz wojny wymuszonej **Kamienia i Brązu** nigdy nie odpala; `pending` pusty przez 180 tur | `main.ts:28025`, `:27963`, `display-names.ts:57`, `main.ts:23625` | **blokująca** |
| **Z2** | `respekt` relacji z graczem = `round(100·rw)` czyni warunki `rw >= progSila` i `score < progRel` wzajemnie wykluczającymi → AI nigdy nie wypowie graczowi wojny tą ścieżką | `main.ts:27615`, `ai.ts:4377-4383`, `diplomacy.ts:791` | **blokująca** |
| **Z3** | W 111 594 ocenach AI↔AI relacja nie spadła ani razu poniżej 30 w 60 turach — zwykła ścieżka wojny jest w Kamieniu martwa także między AI | pomiar, `diplomacy.ts:172,179-180` | wysoka |
| **Z4** | Wojna AI↔AI nie generuje żadnej karty w panelu Wydarzeń; jedyny kanał to pasywny podgląd w panelu dyplomacji | `main.ts:7753`, `:16067` | średnia |
| **Z5** | Warstwa `'pre_contact'` kasuje **wszystkie** komendy dyplomatyczne AI, którego **gracz** nie odkrył — w tym wypowiedzenie wojny **innemu AI**. Wojny między AI poza zasięgiem wzroku gracza są niemożliwe; sprzeczne z własnym komentarzem projektu („Wojna może nastąpić po samym odkryciu na mapie"). Potwierdzone mutantem M1: 6/6 AI wybrało cel, 0/6 miało kontakt z graczem, 0 wojen | `main.ts:27743-27748`, `diplomacy-layers.ts:252-253`, `:265` | **blokująca** |

**Naprawa któregokolwiek = osobny temat po decyzji właściciela.**

---

## 9. Bramki i dowód czystości

| bramka | wynik referencyjny | wynik teraz |
|---|---|---|
| `node ./node_modules/typescript/bin/tsc --noEmit` | 0 błędów | **0 błędów** |
| `logic-test` | 213/213 | **213/213** |
| `tech-tree-test` | 19/0 | **19 pass, 0 fail** |
| `research-test` | 33/33 | **33/33** |
| `unit-replace-test` | 13/13 | **13/13** |
| `combat-test` | 6/6 | **6/6** |
| `forced-war-stone-test` | 32/0 | **32/0** |
| `forced-war-stone-main-guard-test` | 18/0 | **18/0** |
| `ai-war-gate-test` | 24/0 | **24/0** |
| `diplomacy-war-gates-test` | 19/0 | **19/0** |
| `alliance-war-obligation-test` | 14/0 | **14/0** |

`git status --porcelain gra/src gra/data` → **pusto**, także po przebiegu z mutantem
(mutacja żyje wyłącznie w pamięci buildu). Cały diff wobec `origin/main` to 3 pliki
w `gra/tools/` + raporty i dowody runu. C-001 respektowane: build wyłącznie
`node ./node_modules/vite/bin/vite.js build --config tools/wojny-kamien-audyt.vite.config.ts
--outDir /tmp/civ-wojny-audyt[-mutant] --emptyOutDir` (outDir **poza** drzewem repo),
zero `npm run build`/`dev`, zero `npx`, zero `git add -A`, zero `map-gen-regression-test`.

---

## 10. Raport terminalny

ZMIANY/COMMIT: `gra/tools/wojny-kamien-audyt.vite.config.ts`, `gra/tools/wojny-kamien-audyt.cjs`,
`gra/tools/wojny-kamien-audyt-analiza.cjs`, `dyspozycje/autobot/runs/P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1/**`.
**`gra/src/**` i `gra/data/**`: ZERO ZMIAN.**
TESTY: 11 bramek zielonych (tabela §9) + pomiar 3 ziarna × 60 tur w żywym Chromium
+ przebieg kontrolny z mutantem M1 (ziarno 111, 32 tury) jako dowód nietautologiczności.
BLOKADY: brak. Wszystkie 5 punktów dispatchu zamknięte; punkt 4 potwierdzony pomiarem
dopiero w przebiegu mutanta (w przebiegu bazowym kod nie dochodzi do filtra `oid > 0` —
to zgłoszone wprost jako brak dowodu w przebiegu bazowym, nie przemilczane).
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Opus 5 High) — weryfikacja metody pomiaru, kotwic instrumentacji
i wniosku Z5, następnie Final Control. **Temat nie kończy się integracją kodu** — kończy
się liczbami i decyzją właściciela w sprawie Z1/Z2/Z3/Z4/Z5.
DEPLOY/PUSH: **NIE WYKONANO** (push wyłącznie gałęzi tematu, zgodnie ze zleceniem).
