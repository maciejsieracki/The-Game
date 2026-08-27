
## Ziarno 111 — 60 tur, 1885 s, pierwsze miasto gracza: ok:80,55

Parametry menu (domyślne kreatora): {"difficulty":"Normalny","mapSize":"Standardowy","worldType":"Kontynenty","epochId":"kamien","speed":"Standardowa","civTypesCount":7,"cityStatesCount":6,"civId":"rzymianie","landFractionPercent":30,"barbariansLevel":"normalny","battleAlwaysManual":false,"seedRequested":111}

### P4 — czy gracz może być celem wymuszonej wojny Kamienia

| miara | wartość |
|---|---|
| wywołań budowy listy kandydatów (`stoneCandidates`) | 0 |
| z nich zawierających owner 0 w `aiOwnerList` | 0 |
| z nich zawierających owner 0 w `stoneCandidates` | 0 |

### P1 — wojny WYMUSZONE epoki Kamienia (mechanizm forced-war-stone)

**0 wojen wymuszonych.** (0 par w `stoneForceWarActiveByPairKey` przez cały przebieg; 0 logów konsoli mechanizmu.)

Ścieżka mechanizmu Kamienia per główna cywilizacja AI (pierwsza tura, w której…):

| AI | pierwszy raz `pending` | pierwszy raz wybrany cel (`stoneTarget`) | pierwszy raz `cycle` | tur z celem, bez wojny | pierwsza tura poza Kamieniem |
|---|---|---|---|---|---|
| 1 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 7 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 8 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 10 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 11 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 14 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 15 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 16 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 17 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 19 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 21 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 22 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 29 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 34 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 36 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 42 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |

Stan mechanizmu na końcu przebiegu (per AI owner):

| owner | miast | epoka | wojen | pending? | cycle? | miasto-państwo? |
|---|---|---|---|---|---|---|
| 7 | 0 | 1 | 0 | nie | nie | nie |
| 10 | 0 | 1 | 0 | nie | nie | nie |
| 11 | 0 | 1 | 0 | nie | nie | nie |
| 14 | 0 | 1 | 0 | nie | nie | nie |
| 16 | 0 | 1 | 0 | nie | nie | nie |
| 17 | 0 | 1 | 0 | nie | nie | nie |
| 19 | 0 | 1 | 0 | nie | nie | nie |
| 21 | 0 | 1 | 0 | nie | nie | nie |
| 34 | 0 | 1 | 0 | nie | nie | nie |
| 42 | 0 | 1 | 0 | nie | nie | nie |

### Wszystkie pary w stanie wojny (dowolny mechanizm, z `getDiploRelation`)

**Brak jakiejkolwiek pary w stanie wojny przez cały przebieg.**

### P2 — bramy `wypowiedz_wojne` AI → GRACZ (owner 0), per AI

Warunki priorytetu 4 w `ai.ts` (`decideAIDiplomacy`): `!stanWojny` · `!peaceLocked` · `!hasNapTreaty` · `willingnessWar > 0` · `rw >= progSila` · `effAgresja >= progAgresja` · `score < progRel`.

| AI | ocen (tur) | rw min | rw mediana | rw max | prog siły | ile tur rw>=prog | effAgresja | prog agresji | ile tur agresja OK | score mediana | prog relacji | ile tur score<prog | willWar>0 | ile tur WSZYSTKIE warunki OK |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 43 | 58 | 0.500 | 0.762 | 0.799 | 0.380 | 58 | 0.800 | 0.340 | 58 | 149.643 | 30 | 0 | 58 | **0** |
| 44 | 58 | 0.500 | 0.759 | 0.791 | 0.380 | 58 | 0.800 | 0.340 | 58 | 158.482 | 30 | 0 | 58 | **0** |
| 45 | 58 | 0.486 | 0.635 | 0.706 | 0.380 | 58 | 0.800 | 0.340 | 58 | 152.143 | 30 | 0 | 58 | **0** |

**Rozkład `respektWzgledny` AI-vs-gracz (wszystkie AI, wszystkie tury, ziarno 111):** n=174 · min=0.486 · mediana=0.730 · max=0.799 · liczba odczytów >= progu siły: 174

**Test sprzeczności konstrukcyjnej (AI → gracz):** `respekt` w relacji z graczem jest ustawiany jako `computeRespekt(potAI, potPlr) = round(100·rw)` (main.ts), a `score = zaufanie + respekt`, więc `score >= 100·rw`. Brama wymaga JEDNOCZEŚNIE `rw >= progSila` i `score < progRel`.

| miara | wartość |
|---|---|
| ocen AI→gracz | 174 |
| z tego `rw >= progSila` | 174 |
| z tego `score < progRel` | 0 |
| **oba warunki naraz** | **0** |
| min(`score` − 100·`rw`) | 48.210 |
| max(`score` − 100·`rw`) | 100.479 |
| min `progSila` | 0.380 · max `progRel` | 30 |

**Rozbicie na powód — ile z 174 ocen (AI × tura) miało dany warunek NIESPEŁNIONY:**

| warunek niespełniony | liczba ocen | % |
|---|---|---|
| stanWojny | 0 | 0.0% |
| peaceLocked | 0 | 0.0% |
| nap | 0 | 0.0% |
| willWar0 | 0 | 0.0% |
| rwPonizejProgu | 0 | 0.0% |
| agresjaPonizejProgu | 0 | 0.0% |
| scoreZaWysoki | 174 | 100.0% |

**Dla porównania — brama wojny AI-vs-AI (ten sam priorytet 4):** n=36562 ocen · rw min=0.069 · średnia=0.504 · max=0.931 · rw>=progu: 13002 · **ocen z WSZYSTKIMI warunkami spełnionymi: 0**

| warunek niespełniony (AI-vs-AI) | liczba ocen | % |
|---|---|---|
| stanWojny | 0 | 0.0% |
| peaceLocked | 0 | 0.0% |
| nap | 0 | 0.0% |
| willWar0 | 0 | 0.0% |
| rwPonizejProgu | 23560 | 64.4% |
| agresjaPonizejProgu | 24816 | 67.9% |
| scoreZaWysoki | 36562 | 100.0% |

### P3 — przejmowanie miast-państw klastra a moment pierwszej wojny

| tura | miast-państw żywych | miast AI (suma) | miast gracza | par w stanie wojny |
|---|---|---|---|---|
| 1 | 42 | 6 | 1 | 0 |
| 2 | 42 | 6 | 1 | 0 |
| 5 | 42 | 6 | 1 | 0 |
| 10 | 42 | 0 | 1 | 0 |
| 15 | 42 | 0 | 1 | 0 |
| 20 | 41 | 0 | 1 | 0 |
| 25 | 12 | 0 | 1 | 0 |
| 30 | 12 | 0 | 1 | 0 |
| 35 | 12 | 0 | 1 | 0 |
| 40 | 12 | 0 | 1 | 0 |
| 45 | 12 | 0 | 1 | 0 |
| 50 | 12 | 0 | 1 | 0 |
| 55 | 12 | 0 | 1 | 0 |
| 60 | 12 | 0 | 1 | 0 |

### Brama `!isOwnerClusterCityState(ownerId, ...)` w wyzwalaczu wojny Kamienia (main.ts:28025)

| główna cywilizacja AI | `isOwnerClusterCityState` w turze 1 | pierwsza tura, w której staje się `true` | miast w tej turze | wartość w turze 20 (start mechanizmu) |
|---|---|---|---|---|
| 1 | false | **6** | 2 | **true → wykluczony** |
| 8 | false | **6** | 2 | **true → wykluczony** |
| 15 | false | **6** | 2 | **true → wykluczony** |
| 22 | false | **7** | 2 | **true → wykluczony** |
| 29 | false | **7** | 2 | **true → wykluczony** |
| 36 | false | **7** | 2 | **true → wykluczony** |

### P5 — czy gracz w ogóle dostaje sygnał o wojnach

| miara | wartość |
|---|---|
| wpisów w panelu Wydarzeń (`warEventLog`) łącznie | 8 |
| z nich wpisów o wypowiedzeniu wojny (`war-*`) | 0 |
| par AI×AI w stanie wojny (z relacji) | 0 |

Czas jednej tury [ms]: min=6585 · mediana=19551.5 · max=88713


## Ziarno 222 — 60 tur, 1811 s, pierwsze miasto gracza: ok:80,61

Parametry menu (domyślne kreatora): {"difficulty":"Normalny","mapSize":"Standardowy","worldType":"Kontynenty","epochId":"kamien","speed":"Standardowa","civTypesCount":7,"cityStatesCount":6,"civId":"rzymianie","landFractionPercent":30,"barbariansLevel":"normalny","battleAlwaysManual":false,"seedRequested":222}

### P4 — czy gracz może być celem wymuszonej wojny Kamienia

| miara | wartość |
|---|---|
| wywołań budowy listy kandydatów (`stoneCandidates`) | 0 |
| z nich zawierających owner 0 w `aiOwnerList` | 0 |
| z nich zawierających owner 0 w `stoneCandidates` | 0 |

### P1 — wojny WYMUSZONE epoki Kamienia (mechanizm forced-war-stone)

**0 wojen wymuszonych.** (0 par w `stoneForceWarActiveByPairKey` przez cały przebieg; 0 logów konsoli mechanizmu.)

Ścieżka mechanizmu Kamienia per główna cywilizacja AI (pierwsza tura, w której…):

| AI | pierwszy raz `pending` | pierwszy raz wybrany cel (`stoneTarget`) | pierwszy raz `cycle` | tur z celem, bez wojny | pierwsza tura poza Kamieniem |
|---|---|---|---|---|---|
| 1 | **nigdy** | **nigdy** | **nigdy** | 0 | 60 |
| 4 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 8 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 14 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 15 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 21 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 22 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 28 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 29 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 31 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 36 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 38 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 41 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |

Stan mechanizmu na końcu przebiegu (per AI owner):

| owner | miast | epoka | wojen | pending? | cycle? | miasto-państwo? |
|---|---|---|---|---|---|---|
| 4 | 0 | 1 | 0 | nie | nie | nie |
| 14 | 0 | 1 | 0 | nie | nie | nie |
| 21 | 0 | 1 | 0 | nie | nie | nie |
| 28 | 0 | 1 | 0 | nie | nie | nie |
| 31 | 0 | 1 | 0 | nie | nie | nie |
| 38 | 0 | 1 | 0 | nie | nie | nie |
| 41 | 0 | 1 | 0 | nie | nie | nie |

### Wszystkie pary w stanie wojny (dowolny mechanizm, z `getDiploRelation`)

**Brak jakiejkolwiek pary w stanie wojny przez cały przebieg.**

### P2 — bramy `wypowiedz_wojne` AI → GRACZ (owner 0), per AI

Warunki priorytetu 4 w `ai.ts` (`decideAIDiplomacy`): `!stanWojny` · `!peaceLocked` · `!hasNapTreaty` · `willingnessWar > 0` · `rw >= progSila` · `effAgresja >= progAgresja` · `score < progRel`.

| AI | ocen (tur) | rw min | rw mediana | rw max | prog siły | ile tur rw>=prog | effAgresja | prog agresji | ile tur agresja OK | score mediana | prog relacji | ile tur score<prog | willWar>0 | ile tur WSZYSTKIE warunki OK |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 8 | 37 | 0.927 | 0.969 | 0.976 | 0.600 | 37 | 0.400 | 0.500 | 0 | 127.848 | 30 | 0 | 37 | **0** |
| 43 | 58 | 0.500 | 0.733 | 0.849 | 0.380 | 58 | 0.800 | 0.340 | 58 | 155.984 | 30 | 0 | 58 | **0** |
| 44 | 58 | 0.500 | 0.786 | 0.871 | 0.380 | 58 | 0.800 | 0.340 | 58 | 151.980 | 30 | 0 | 58 | **0** |
| 45 | 58 | 0.500 | 0.793 | 0.872 | 0.380 | 58 | 0.800 | 0.340 | 58 | 161.983 | 30 | 0 | 58 | **0** |

**Rozkład `respektWzgledny` AI-vs-gracz (wszystkie AI, wszystkie tury, ziarno 222):** n=211 · min=0.500 · mediana=0.793 · max=0.976 · liczba odczytów >= progu siły: 211

**Test sprzeczności konstrukcyjnej (AI → gracz):** `respekt` w relacji z graczem jest ustawiany jako `computeRespekt(potAI, potPlr) = round(100·rw)` (main.ts), a `score = zaufanie + respekt`, więc `score >= 100·rw`. Brama wymaga JEDNOCZEŚNIE `rw >= progSila` i `score < progRel`.

| miara | wartość |
|---|---|
| ocen AI→gracz | 211 |
| z tego `rw >= progSila` | 211 |
| z tego `score < progRel` | 0 |
| **oba warunki naraz** | **0** |
| min(`score` − 100·`rw`) | 18.006 |
| max(`score` − 100·`rw`) | 100.479 |
| min `progSila` | 0.380 · max `progRel` | 30 |

**Rozbicie na powód — ile z 211 ocen (AI × tura) miało dany warunek NIESPEŁNIONY:**

| warunek niespełniony | liczba ocen | % |
|---|---|---|
| stanWojny | 0 | 0.0% |
| peaceLocked | 0 | 0.0% |
| nap | 0 | 0.0% |
| willWar0 | 0 | 0.0% |
| rwPonizejProgu | 0 | 0.0% |
| agresjaPonizejProgu | 37 | 17.5% |
| scoreZaWysoki | 211 | 100.0% |

**Dla porównania — brama wojny AI-vs-AI (ten sam priorytet 4):** n=38410 ocen · rw min=0.096 · średnia=0.503 · max=0.905 · rw>=progu: 12839 · **ocen z WSZYSTKIMI warunkami spełnionymi: 0**

| warunek niespełniony (AI-vs-AI) | liczba ocen | % |
|---|---|---|
| stanWojny | 0 | 0.0% |
| peaceLocked | 0 | 0.0% |
| nap | 0 | 0.0% |
| willWar0 | 0 | 0.0% |
| rwPonizejProgu | 25571 | 66.6% |
| agresjaPonizejProgu | 26296 | 68.5% |
| scoreZaWysoki | 38410 | 100.0% |

### P3 — przejmowanie miast-państw klastra a moment pierwszej wojny

| tura | miast-państw żywych | miast AI (suma) | miast gracza | par w stanie wojny |
|---|---|---|---|---|
| 1 | 42 | 6 | 1 | 0 |
| 2 | 42 | 6 | 1 | 0 |
| 5 | 42 | 6 | 1 | 0 |
| 10 | 42 | 0 | 1 | 0 |
| 15 | 42 | 0 | 1 | 0 |
| 20 | 42 | 0 | 1 | 0 |
| 25 | 12 | 0 | 1 | 0 |
| 30 | 12 | 0 | 1 | 0 |
| 35 | 12 | 0 | 1 | 0 |
| 40 | 12 | 0 | 1 | 0 |
| 45 | 12 | 0 | 1 | 0 |
| 50 | 12 | 0 | 1 | 0 |
| 55 | 12 | 0 | 1 | 0 |
| 60 | 12 | 0 | 1 | 0 |

### Brama `!isOwnerClusterCityState(ownerId, ...)` w wyzwalaczu wojny Kamienia (main.ts:28025)

| główna cywilizacja AI | `isOwnerClusterCityState` w turze 1 | pierwsza tura, w której staje się `true` | miast w tej turze | wartość w turze 20 (start mechanizmu) |
|---|---|---|---|---|
| 1 | false | **6** | 2 | **true → wykluczony** |
| 8 | false | **6** | 2 | **true → wykluczony** |
| 15 | false | **6** | 2 | **true → wykluczony** |
| 22 | false | **6** | 2 | **true → wykluczony** |
| 29 | false | **6** | 2 | **true → wykluczony** |
| 36 | false | **6** | 2 | **true → wykluczony** |

### P5 — czy gracz w ogóle dostaje sygnał o wojnach

| miara | wartość |
|---|---|
| wpisów w panelu Wydarzeń (`warEventLog`) łącznie | 8 |
| z nich wpisów o wypowiedzeniu wojny (`war-*`) | 0 |
| par AI×AI w stanie wojny (z relacji) | 0 |

Czas jednej tury [ms]: min=8035 · mediana=18453 · max=79432


## Ziarno 333 — 60 tur, 2031 s, pierwsze miasto gracza: ok:36,91

Parametry menu (domyślne kreatora): {"difficulty":"Normalny","mapSize":"Standardowy","worldType":"Kontynenty","epochId":"kamien","speed":"Standardowa","civTypesCount":7,"cityStatesCount":6,"civId":"rzymianie","landFractionPercent":30,"barbariansLevel":"normalny","battleAlwaysManual":false,"seedRequested":333}

### P4 — czy gracz może być celem wymuszonej wojny Kamienia

| miara | wartość |
|---|---|
| wywołań budowy listy kandydatów (`stoneCandidates`) | 0 |
| z nich zawierających owner 0 w `aiOwnerList` | 0 |
| z nich zawierających owner 0 w `stoneCandidates` | 0 |

### P1 — wojny WYMUSZONE epoki Kamienia (mechanizm forced-war-stone)

**0 wojen wymuszonych.** (0 par w `stoneForceWarActiveByPairKey` przez cały przebieg; 0 logów konsoli mechanizmu.)

Ścieżka mechanizmu Kamienia per główna cywilizacja AI (pierwsza tura, w której…):

| AI | pierwszy raz `pending` | pierwszy raz wybrany cel (`stoneTarget`) | pierwszy raz `cycle` | tur z celem, bez wojny | pierwsza tura poza Kamieniem |
|---|---|---|---|---|---|
| 1 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 2 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 7 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 8 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 9 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 12 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 15 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 19 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 22 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 24 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 27 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 29 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 34 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 35 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 36 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 39 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |
| 41 | **nigdy** | **nigdy** | **nigdy** | 0 | zostaje w Kamieniu |

Stan mechanizmu na końcu przebiegu (per AI owner):

| owner | miast | epoka | wojen | pending? | cycle? | miasto-państwo? |
|---|---|---|---|---|---|---|
| 2 | 0 | 1 | 0 | nie | nie | nie |
| 7 | 0 | 1 | 0 | nie | nie | nie |
| 9 | 0 | 1 | 0 | nie | nie | nie |
| 12 | 0 | 1 | 0 | nie | nie | nie |
| 19 | 0 | 1 | 0 | nie | nie | nie |
| 24 | 0 | 1 | 0 | nie | nie | nie |
| 27 | 0 | 1 | 0 | nie | nie | nie |
| 34 | 0 | 1 | 0 | nie | nie | nie |
| 35 | 0 | 1 | 0 | nie | nie | nie |
| 39 | 0 | 1 | 0 | nie | nie | nie |
| 41 | 0 | 1 | 0 | nie | nie | nie |

### Wszystkie pary w stanie wojny (dowolny mechanizm, z `getDiploRelation`)

**Brak jakiejkolwiek pary w stanie wojny przez cały przebieg.**

### P2 — bramy `wypowiedz_wojne` AI → GRACZ (owner 0), per AI

Warunki priorytetu 4 w `ai.ts` (`decideAIDiplomacy`): `!stanWojny` · `!peaceLocked` · `!hasNapTreaty` · `willingnessWar > 0` · `rw >= progSila` · `effAgresja >= progAgresja` · `score < progRel`.

| AI | ocen (tur) | rw min | rw mediana | rw max | prog siły | ile tur rw>=prog | effAgresja | prog agresji | ile tur agresja OK | score mediana | prog relacji | ile tur score<prog | willWar>0 | ile tur WSZYSTKIE warunki OK |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 15 | 32 | 0.886 | 0.923 | 0.935 | 0.600 | 32 | 0.400 | 0.500 | 0 | 121.914 | 30 | 0 | 32 | **0** |
| 43 | 58 | 0.500 | 0.603 | 0.726 | 0.380 | 58 | 0.800 | 0.340 | 58 | 143.097 | 30 | 0 | 58 | **0** |
| 44 | 58 | 0.500 | 0.625 | 0.725 | 0.380 | 58 | 0.800 | 0.340 | 58 | 143.984 | 30 | 0 | 58 | **0** |
| 45 | 58 | 0.500 | 0.610 | 0.706 | 0.380 | 58 | 0.800 | 0.340 | 58 | 141.480 | 30 | 0 | 58 | **0** |

**Rozkład `respektWzgledny` AI-vs-gracz (wszystkie AI, wszystkie tury, ziarno 333):** n=206 · min=0.500 · mediana=0.625 · max=0.935 · liczba odczytów >= progu siły: 206

**Test sprzeczności konstrukcyjnej (AI → gracz):** `respekt` w relacji z graczem jest ustawiany jako `computeRespekt(potAI, potPlr) = round(100·rw)` (main.ts), a `score = zaufanie + respekt`, więc `score >= 100·rw`. Brama wymaga JEDNOCZEŚNIE `rw >= progSila` i `score < progRel`.

| miara | wartość |
|---|---|
| ocen AI→gracz | 206 |
| z tego `rw >= progSila` | 206 |
| z tego `score < progRel` | 0 |
| **oba warunki naraz** | **0** |
| min(`score` − 100·`rw`) | 18.072 |
| max(`score` − 100·`rw`) | 100.489 |
| min `progSila` | 0.380 · max `progRel` | 30 |

**Rozbicie na powód — ile z 206 ocen (AI × tura) miało dany warunek NIESPEŁNIONY:**

| warunek niespełniony | liczba ocen | % |
|---|---|---|
| stanWojny | 0 | 0.0% |
| peaceLocked | 0 | 0.0% |
| nap | 0 | 0.0% |
| willWar0 | 0 | 0.0% |
| rwPonizejProgu | 0 | 0.0% |
| agresjaPonizejProgu | 32 | 15.5% |
| scoreZaWysoki | 206 | 100.0% |

**Dla porównania — brama wojny AI-vs-AI (ten sam priorytet 4):** n=36622 ocen · rw min=0.116 · średnia=0.504 · max=0.884 · rw>=progu: 13307 · **ocen z WSZYSTKIMI warunkami spełnionymi: 0**

| warunek niespełniony (AI-vs-AI) | liczba ocen | % |
|---|---|---|
| stanWojny | 0 | 0.0% |
| peaceLocked | 0 | 0.0% |
| nap | 0 | 0.0% |
| willWar0 | 0 | 0.0% |
| rwPonizejProgu | 23315 | 63.7% |
| agresjaPonizejProgu | 24476 | 66.8% |
| scoreZaWysoki | 36622 | 100.0% |

### P3 — przejmowanie miast-państw klastra a moment pierwszej wojny

| tura | miast-państw żywych | miast AI (suma) | miast gracza | par w stanie wojny |
|---|---|---|---|---|
| 1 | 42 | 6 | 1 | 0 |
| 2 | 42 | 6 | 1 | 0 |
| 5 | 42 | 6 | 1 | 0 |
| 10 | 42 | 0 | 1 | 0 |
| 15 | 42 | 0 | 1 | 0 |
| 20 | 42 | 0 | 1 | 0 |
| 25 | 12 | 0 | 1 | 0 |
| 30 | 12 | 0 | 1 | 0 |
| 35 | 12 | 0 | 1 | 0 |
| 40 | 12 | 0 | 1 | 0 |
| 45 | 12 | 0 | 1 | 0 |
| 50 | 12 | 0 | 1 | 0 |
| 55 | 12 | 0 | 1 | 0 |
| 60 | 12 | 0 | 1 | 0 |

### Brama `!isOwnerClusterCityState(ownerId, ...)` w wyzwalaczu wojny Kamienia (main.ts:28025)

| główna cywilizacja AI | `isOwnerClusterCityState` w turze 1 | pierwsza tura, w której staje się `true` | miast w tej turze | wartość w turze 20 (start mechanizmu) |
|---|---|---|---|---|
| 1 | false | **7** | 2 | **true → wykluczony** |
| 8 | false | **6** | 2 | **true → wykluczony** |
| 15 | false | **6** | 2 | **true → wykluczony** |
| 22 | false | **7** | 2 | **true → wykluczony** |
| 29 | false | **8** | 2 | **true → wykluczony** |
| 36 | false | **7** | 2 | **true → wykluczony** |

### P5 — czy gracz w ogóle dostaje sygnał o wojnach

| miara | wartość |
|---|---|
| wpisów w panelu Wydarzeń (`warEventLog`) łącznie | 8 |
| z nich wpisów o wypowiedzeniu wojny (`war-*`) | 0 |
| par AI×AI w stanie wojny (z relacji) | 0 |

Czas jednej tury [ms]: min=7166 · mediana=21323 · max=93501
