# 02 — EVALUATOR (runda 3/5)

STATUS: DECISION_REQUIRED (praca Operatora się broni — ale kryterium 1 jest NIESPEŁNIONE i naprawa wymaga decyzji właściciela)
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1
MODEL+EFFORT: Opus 5, effort high
GOAL: niezależnie zweryfikować, czy W-B faktycznie odzyskuje plon żywności AI CYWILIZACJI,
czy `wyrab` naprawdę się dzieje, i czy `posterunek`/`fort` nie zostały po cichu usunięte z gry.
GAŁĄŹ: `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` @ `640c6b3e` · worktree `/home/user/wt-ev-ai3`
(detached) + baza `main` `470c5bb5` w `/home/user/wt-ev-ai3-base`.
Narzędzie moje: `gra/tools/ev3-stan-mapy-measure.cjs`. Logi: `ev3-pomiar-harness.txt`,
`ev3-pomiar-wierny.txt`, `ev3-mutacje.txt`. Ziarna moje: **11, 77, 314, 2718** + **1337**
(kontrola krzyżowa z Operatorem). 40 tur, mapa 36×28 „kontynenty", 3 miasta, pop 6.

**INNA METODA.** Operator liczy wszystko ze STRUMIENIA ROZKAZÓW. Ja liczę ze STANU MAPY:
snapshot warstw **i nakładki** każdego heksa po każdej turze. `wyrab` jest akcją, nie warstwą,
więc jego jedynym śladem w stanie jest ZNIKNIĘCIE nakładki `Las` — i tak go liczę. Modeluję też
`stripImprovementsWhenForestRemoved` (silnik, `main.ts:28903`), czego nie robi ani harness
Operatora, ani mój z rundy 2; skutek zmierzony: **0 obozów skasowanych** (strażnik
„heks z tartakiem/obozem nie idzie pod topór" działa).

---

## 1. Odzysk żywności AI CYWILIZACJI — REALNY, ale MNIEJSZY NIŻ POŁOWA. Potwierdzam Operatora.

Moje liczby, moje ziarna, AI CYWILIZACJI, `decideAITurn`, 40 tur:

| metryka | BAZA (przed r2) | W-A (runda 2) | **W-B (runda 3)** |
|---|---|---|---|
| plon żywności/turę | 3391 | 2823 | **3066** |
| plon pracy / handlu | 3283 / 3443 | 2873 / 3382 | **2957 / 3506** |
| **drewno** | 3285 | 3285 | **2565 (−21,9 %)** |
| E1 max / średnia | 27 / 14,9 | 3 / 2,2 | **5 / 2,1** |
| E2 rozpiętość / obcych | 22,7 tur / 60,9 | 3,0 / 1,7 | **2,1 / 1,4** |
| `posterunek` / `fort` | 0 / 0 | 84 / 82 | **11 / 11** |
| `wyrab` / farmy po wyrębie | 0 / 0 | 0 / 0 | **62 / 57** |
| `tartak` / `oboz_lowiecki` | 0 / 58 | 63 / 67 | 23 / 24 |
| kategorie żyw/sur/infra | 600/0/0 | 243/145/212 | **319/142/77** |
| farmy / przy rzece (riverPaths) | 458 / 13,3 % | 90 / 61,1 % | 111 / 55,0 % |

**ODZYSK: (3066 − 2823) / (3391 − 2823) = 243/568 = 42,8 %.** Operator podał 42,2 % na swoich
ziarnach — odtwarzam co do przecinka na innych ziarnach i inną metodą. **Kryterium 1
NIESPEŁNIONE, mówię to tak samo wprost jak on.**

**Czy odzysk jest REALNY, czy tylko przesunięty — REALNY, opłacony DREWNEM.** Rosną trzy plony
naraz (żywność +243, praca +84, handel +124), spada wyłącznie drewno (−720). To nie jest
przesunięcie wewnątrz żywności: to dokładnie cena, którą właściciel świadomie przyjął w Q1
(„wycinać mimo to", drewno −15/turę z heksa). Rozkład odzysku moją ręką (mutacja
`wyrabWlaczony = false` na tym samym źródle): samo W-B **+201**, wyrąb dokłada **+107** —
kształt ten sam co u Operatora (+154 / +96).

## 2. Model terytorium — mój dodatek; wniosek się nie zmienia, ale liczby tak

Oba harnessy (rundy 1–3, obie role) podają pickerowi `territoryNodes` jako **węzeł NA KAŻDY
HEKS**, każdy z `pop: 6`. `cityTerritoryRadius` = `max(5, pop)` = 6 (`territory.ts:74`), więc
picker widzi terytorium o promieniu ~10 zamiast 6. Gra podaje `buildAllTerritoryNodes()`
(`main.ts:4141`) — **jeden węzeł na MIASTO**. Zmierzyłem oba modele:

| | BAZA | W-A | **W-B** | odzysk |
|---|---|---|---|---|
| model harnessowy (jak Operator) | 3391 | 2823 | **3066** | **42,8 %** |
| model wierny (węzeł na miasto + bramka silnika) | 4998 | 4038 | **4346** | **32,1 %** |

W modelu wiernym: `wyrab` **60**, farmy po wyrębie **55**, `posterunek`/`fort` **10/10**,
E1 max **5**, E2 **2,3**, infra **81**, drewno 4350 → 3450. **Rozkazów poza terytorium: 0 z 600** —
sprawdziłem osobno hipotezę, że FAZA 0 (obrona „na najdalszym heksie granicznym") celuje w
pierścień `promień+1` leżący poza terytorium i że silnik by je odrzucał: **przy wiernych
`territoryNodes` `qualifies` sam odcina te heksy, pętli marnowanych rozkazów NIE MA.**
To NIE jest defekt — to artefakt harnessu. Ale odzysk w wierniejszym modelu jest **niższy**
(32,1 %, nie 42,8 %), więc kryterium 1 jest niespełnione **wyraźniej**, nie mniej.

## 3. `posterunek` i `fort` NIE zniknęły z gry (b) — ale są blisko dna

11 + 11 na 5 ziaren (2 + 2 na ziarno, model wierny 10 + 10), **zero na żadnym ziarnie nie
występuje**. Pułap `ceil(pop/10)` = 1 na miasto i klucz: przy atrybucji do najbliższego miasta
3 przekroczenia na 30 par miasto×klucz (nakładające się promienie `candidateHexes`), przy
liczeniu po promieniu miasta — 1 na 30. Pułap w praktyce trzyma. Dodatkowo istnieje **druga,
niezależna ścieżka** `planExpansionFortBuilding` (`ai.ts:2051`), której mój harness nie
uruchamia (`units: []`) — więc 10–11 to **dolna granica**, w realnej grze będzie ich więcej.

## 4. `wyrab` > 0 na KAŻDYM ziarnie (c) — GOAL spełniony dla AI CYWILIZACJI, nie dla AI GRACZA

AI CYWILIZACJI, ze stanu mapy, per ziarno (11 · 77 · 314 · 2718 · 1337):
`wyrab` **9 · 11 · 7 · 17 · 18**, farmy po wyrębie **7 · 10 · 7 · 17 · 16**. Zero nigdzie.
Kontrola krzyżowa na ziarnie Operatora 1337: on 18 wyrębów / 17 farm, ja **18 / 16** —
zgodne. Licznik ze STANU = licznik z ROZKAZÓW (62 = 62), więc żaden wyrąb nie jest „zaplanowany
i nieodbyty".

**AI GRACZA: `wyrab` = 0 na wszystkich czterech profilach.** Potwierdzam przyczynę podaną przez
Operatora: `main.ts:~27075` przekazuje `skipWyrab: true` (sprawdziłem własną ręką), a `main.ts`
jest poza allowlistą rundy 3. **GOAL tematu jest więc spełniony dla jednej z dwóch ścieżek AI** —
druga wymaga decyzji właściciela, nie pracy Operatora.

## 5. Kompleksowość (d) i rozkład kategorii (e)

E1 max **5** (ziarna 11 i 314; w W-A było 3) — **na styk limitu, zero zapasu**.
E1 średnia 2,1, E2 rozpiętość **2,1 tury**, obcych heksów 1,4 — obie metryki **lepsze** niż w
W-A (3,0 / 1,7). Kryterium „E1 ≤ 5 i E2 ≤ 6" **spełnione**. Rozkład **319/142/77**,
infra ≠ 0 — **niezdegenerowany**, ale infra spadła 212 → 77 (−64 %).

## 6. AI GRACZA — skutki uboczne, które trzeba zapisać

| profil AI GRACZA | warstw W-A → W-B | posterunek/fort W-A → W-B | plon żywności |
|---|---|---|---|
| Żywność | 309 → 309 | 0/0 → 0/0 | 2852 → 2852 |
| Surowce | 284 → 284 | 0/0 → 0/0 | 2490 → 2490 |
| **Infrastruktura** | **240 → 103 (−57 %)** | 95/93 → **8/9** | 2312 → 2312 |
| Zrównoważona | 279 → 304 | 35/35 → 5/5 | 2540 → **2622** |

Potwierdzam blokadę 4 Operatora (on: 236 → 98; ja: 240 → 103). Gracz, który **jawnie wybrał
Infrastrukturę**, dostaje o 57 % mniej ulepszeń i ani punktu plonu więcej.
**Mój dodatek:** odległość TV `Zrównoważona` ↔ AI CYWILIZACJI **0,0338 → 0,1028** — profile
się ROZJECHAŁY trzykrotnie (wyrąb to 10 % rozkazów AI CYWILIZACJI, a gracz nie karczuje wcale).
`Zrównoważona` nadal jest najbliższa (następna 0,4071), więc ECHO właściciela nie jest złamane,
ale odległość rośnie i w rundzie 4 urośnie dalej.

## 7. Mutacje (f) — powtórzone własną ręką, liczba FAIL-i zgadza się co do sztuki

| mutacja | Operator | **ja** | co czerwienieje |
|---|---|---|---|
| czysto | 34/0 | **34/0** | — |
| M0 całe źródło rundy 2 | 22/10 | **22/10** | brak eksportów W-B, obrona, cały `wyrab` |
| M5 `posterunek`/`fort` z powrotem w domykaniu | 26/6 | **28/6** | pułap, granica, heks plonowy |
| M6 `droga` w `ZERO_YIELD_IMPROVEMENTS` | 30/3 | **32/3** | stała ≠ zbiór policzony z `tileYield` |
| M7 `wyrabWlaczony = false` | 28/4 | **30/4** | `wyrab`, farma po wyrębie, `skipWyrab:false` |
| M8 FAZA 0 wyłączona | 29/3 | **31/3** | obrona poza domykaniem |
| M9 zdjęte minimum leśne | 30/2 | **32/2** | `tartak` 0 na mapie leśnej |

Liczba FAIL-i identyczna w każdej mutacji; liczba PASS różni się o 2, bo część asercji jest
warunkowa i przy mojej wersji mutacji wykonuje się dodatkowo. **Bramka jest nietautologiczna —
potwierdzam własnym uruchomieniem, nie przepisaniem.**

## TESTY (moja ręka, `/home/user/wt-ev-ai3/gra`, każde wywołanie w `timeout`)

`tsc --noEmit` **0 (exit 0)** · logic **213/213** · tech-tree **19/0** · research **33/33** ·
unit-replace **13/13** · combat **6/6** · auto-improvements **45/0** ·
map-improvement-qualify **112/0** · oboz-lowiecki-las **91/0** · oboz-lowiecki-evaluator-probe
**88/0** · oboz-lowiecki-fc-balans **5/0** · oboz-lowiecki-fc-r2-nowa-sciezka **22/0** ·
ai-improvements **52/0** · ai-jednostki-tylko-zakup **44/0** ·
bramka tematu `ai2-heks-po-heksie-test` **34/0**.
`ai-praca-split-parity-test`: **21/1 na bazie `main` `470c5bb5`** (moja ręka, osobny worktree)
i **21/1 na gałęzi** — regres zastany, NIE pogorszony, NIE naprawiony.
Build kanon C-001: `node ./node_modules/vite/bin/vite.js build --outDir
/tmp/civ-dist-airzeki-r3-ev --emptyOutDir` → **PRZESZEDŁ**, `index.html` 37 417,94 kB, 24,41 s.

## ZAKRES I GRANICE (§16a)

`git diff --name-only 3e84fbc8..640c6b3e` = **6 plików**: `gra/src/game/auto-improvements.ts`,
`gra/tools/ai2-heks-po-heksie-test.cjs`, `gra/tools/ai2-sciezki-rozdzielone-measure.cjs`
+ 3 artefakty runu. **W allowliście rundy 3 co do pliku.** `gra/src/game/ai.ts`,
`gra/src/main.ts`, `gra/data/**`, `gra/src/map/improvement-build.ts`, `gra/src/ui/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**` — **nietknięte** (0 trafień). `git diff --check` czysty.
Zero `Math.random()` w nowej ścieżce. Brak kolizji z równoległym turniejem ABC
(`dyspozycje/abc-turniej/**` nietknięte). Drzewo główne `/home/user/The-Game` czyste (C-019).
Asercja `maxItemsPerCity: 1` dla AI CYWILIZACJI — behawioralnie **1** na wszystkich 20 przebiegach.

## BLOKADY

1. **KRYTERIUM 1 NIESPEŁNIONE — potwierdzam dwukrotnie, dwoma modelami: odzysk 42,8 %
   (model harnessowy) i 32,1 % (model wierny), przy wymaganej „większości" z −16,8 %.**
   Decyzja właściciela: czy przyciąć ulepszenia nieżywnościowe (`warzelnia_soli`, drogi,
   `glinianka`, `lodzie_rybackie`) kosztem wymogu „równomiernie" z rundy 2. `DECISION_REQUIRED`.
2. **AI GRACZA ma `wyrab` = 0** — `skipWyrab: true` w `main.ts` poza allowlistą rundy 3.
   GOAL tematu spełniony dla AI CYWILIZACJI, dla AI GRACZA nie. Decyzja właściciela.
3. **AI GRACZA, profil `Infrastruktura`: 240 → 103 ulepszeń bez zysku plonu** — potwierdzam
   blokadę 4 Operatora własnym pomiarem.
4. **`JEDEN_NA_ILU_OBYWATELI = 10` rozszerzone na `posterunek`/`fort`** — liczba dobrana przez
   Operatora, zgłoszona przez niego uczciwie, do potwierdzenia przez właściciela. Skutek
   zmierzony: 84/82 → 11/11.
5. **E1 max = 5 przy limicie 5** — zero zapasu; W-A miało 3. Do świadomej akceptacji.
6. **Nowe znalezisko procesowe (moje):** harnessy obu ról od rundy 1 podają pickerowi
   `territoryNodes` jako węzeł NA HEKS (promień ~10 zamiast 6). Sprawdziłem — **nie unieważnia
   wniosków** (kierunek i znak wszystkich metryk ten sam), ale przesuwa liczby bezwzględne
   (plon 3391/2823/3066 → 4998/4038/4346). Do naprawy w narzędziach przy rundzie 4.
7. **BRAK DOWODU** — ścieżka AI GRACZA nadal mierzona konfiguracją odtworzoną, nie wykonaniem
   `main.ts` (closure `boot()`). Dług dowodowy z rundy 2, nietknięty (§13a).
8. Zastany regres `ai-praca-split-parity-test` 21/1 — zmierzony na bazie i na gałęzi, nie mój.
9. Do rejestru (§14, NIE naprawiam): `kopalnia_zlota` poza `AI_IMPROVEMENT_PRIORITY`;
   `ULEPSZENIA_FOCUS_ZROWNOWAZONE` to ta sama stała co `AI_IMPROVEMENT_PRIORITY`.

## ZMIANY-COMMIT

`gra/tools/ev3-stan-mapy-measure.cjs` (nowe, moje) + ten raport + `ev3-pomiar-harness.txt`,
`ev3-pomiar-wierny.txt`, `ev3-mutacje.txt`. **Zero zmian w `gra/src/**` i `gra/data/**`.**

RUNDY: 3/5
NASTĘPNY KROK: Final Control rundy 3 (worktree `/home/user/wt-ev-ai3` i `/home/user/wt-ev-ai3-base`
zostawione); równolegle ABC do właściciela z blokadami 1–3 — pytanie dotyczy OBU AI
(AI GRACZA i AI CYWILIZACJI), bo silnik `pickAutoImprovements` jest wspólny.
DEPLOY-PUSH: NIE WYKONANO
