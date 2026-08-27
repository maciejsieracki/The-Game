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
Powód nie jest jeden, są **dwa niezależne, zmierzone**:
**(Z1)** mechanizm wymuszonej wojny Kamienia **nigdy się nie uruchamia** — bramka
`!isOwnerClusterCityState(ownerId, …)` w wyzwalaczu (`main.ts:28025`) staje się `false`
dla **wszystkich** głównych cywilizacji AI już w **turze 6–8**, czyli 12–14 tur **przed**
turą 20, w której mechanizm miałby wystartować; zbiór `stoneForceWarPendingOwners`
pozostaje **pusty przez 180 tur**;
**(Z2)** zwykła ścieżka `wypowiedz_wojne` jest wobec gracza **sprzecznie skonfigurowana**:
`respekt` w relacji z graczem jest nadpisywany jako `computeRespekt = round(100·rw)`
(`main.ts:27615`), więc `score = zaufanie + respekt >= 100·rw`; brama wymaga jednocześnie
`rw >= progSila` (0,38–0,60) **i** `score < 30`. W **591 ocenach AI→gracz** warunek siły był
spełniony **591 razy (100%)**, a warunek relacji **0 razy (0%)**; `score − 100·rw` nigdy nie
spadło poniżej **+18,0**. Hipoteza właściciela („dłużej im zajmuje przejęcie własnych
miast-państw") jest **potwierdzona co do faktu, ale odwrócona co do skutku**: to właśnie
przejęcie miasta-państwa **trwale wyłącza** cywilizację z mechanizmu.

**Bramki 32/0 i 18/0 nie są tu dowodem niczego** — pinują kontrakt jednostkowy modułu
`forced-war-stone.ts` i tekstowe wiązanie z `main.ts`; żadna z nich nie sprawdza, czy
wyzwalacz w ogóle jest osiągalny w rozgrywce (§13a).

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
| surowe dane | `dowody/pomiar-seed-{111,222,333}.json`, `dowody/konsola-seed-*.txt`, pełne tabele: `dowody/analiza-pelna.md` |

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

**Nie da się tego potwierdzić pomiarem, bo kod do tego filtra NIGDY NIE DOCHODZI.**

| ziarno | wywołań budowy `stoneCandidates` | z owner 0 w `aiOwnerList` | z owner 0 w `stoneCandidates` |
|---|---|---|---|
| 111 | **0** | 0 | 0 |
| 222 | **0** | 0 | 0 |
| 333 | **0** | 0 | 0 |

Ustalenie reconu, że `oid > 0` (`main.ts:28063-28069`) wyklucza gracza, jest **prawdziwe
przy odczycie kodu, ale nie jest przyczyną** braku wojen — blokada leży o dwa kroki
wcześniej (Z1). Zgłaszam to **jako BRAK DOWODU pomiarowego**, nie jako potwierdzenie.
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

## 6. Punkt 5 — czy gracz w ogóle widzi wojny AI↔AI

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

## 7. Znaleziska (OPISANE, NIE NAPRAWIONE — allowlista zabrania)

| id | opis | miejsce | waga |
|---|---|---|---|
| **Z1** | Przejęcie miasta z `startCityState` trwale klasyfikuje główną cywilizację AI jako miasto-państwo → wyzwalacz wojny wymuszonej **Kamienia i Brązu** nigdy nie odpala; `pending` pusty przez 180 tur | `main.ts:28025`, `:27962`, `display-names.ts:50-59`, `main.ts:23625` | **blokująca** |
| **Z2** | `respekt` relacji z graczem = `round(100·rw)` czyni warunki `rw >= progSila` i `score < progRel` wzajemnie wykluczającymi → AI nigdy nie wypowie graczowi wojny tą ścieżką | `main.ts:27615`, `ai.ts:4377-4383`, `diplomacy.ts:791` | **blokująca** |
| **Z3** | W 111 594 ocenach AI↔AI relacja nie spadła ani razu poniżej 30 w 60 turach — zwykła ścieżka wojny jest w Kamieniu martwa także między AI | pomiar, `diplomacy.ts:172,179-180` | wysoka |
| **Z4** | Wojna AI↔AI nie generuje żadnej karty w panelu Wydarzeń; jedyny kanał to pasywny podgląd w panelu dyplomacji | `main.ts:7753`, `:16067` | średnia |

**Naprawa któregokolwiek = osobny temat po decyzji właściciela.**

---

## 8. Bramki i dowód czystości

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

`git status --porcelain gra/src gra/data` → **pusto**. Cały diff wobec `origin/main` to
3 pliki w `gra/tools/` + raporty i dowody runu. C-001 respektowane: build wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-wojny-audyt --emptyOutDir`,
zero `npm run build`/`dev`, zero `npx`, zero `git add -A`.

---

## 9. Raport terminalny

ZMIANY/COMMIT: `gra/tools/wojny-kamien-audyt.vite.config.ts`, `gra/tools/wojny-kamien-audyt.cjs`,
`gra/tools/wojny-kamien-audyt-analiza.cjs`, `dyspozycje/autobot/runs/P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1/**`.
**`gra/src/**` i `gra/data/**`: ZERO ZMIAN.**
TESTY: 11 bramek zielonych (tabela §8) + pomiar 3 ziarna × 60 tur w żywym Chromium.
BLOKADY: brak. Punkt 4 dispatchu zamknięty **jako BRAK DOWODU pomiarowego** (kod nie dochodzi
do filtra `oid > 0`) — nie jako potwierdzenie.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Opus 5 High) — weryfikacja metody pomiaru i nietautologiczności
instrumentacji, następnie Final Control. **Temat nie kończy się integracją kodu** — kończy
się liczbami i decyzją właściciela w sprawie Z1/Z2/Z3/Z4.
DEPLOY/PUSH: **NIE WYKONANO** (push wyłącznie gałęzi tematu, zgodnie ze zleceniem).
