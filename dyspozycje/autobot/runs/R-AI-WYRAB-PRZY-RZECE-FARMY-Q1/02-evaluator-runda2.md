# 02 — EVALUATOR (runda 2/5)

STATUS: DECISION_REQUIRED (podtrzymuję werdykt Operatora — praca się broni, temat czeka na właściciela)
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1
MODEL+EFFORT: Opus 5, effort high
GOAL: niezależna weryfikacja rundy 2 — czy pomiar rozdzielony faktycznie mierzy DWIE
ścieżki (AI GRACZA i AI CYWILIZACJI), czy implementacja niczego nie zagłodziła,
własną ręką i **inną metodą** niż Operator.
GAŁĄŹ: `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` @ `849bb951` · worktree `/home/user/wt-ev-ai2`
(detached) + baza `/home/user/wt-ev-ai2-base` @ `56af44de`.
Narzędzie moje: `gra/tools/ev2-stan-mapy-measure.cjs`. Logi: `ev2-pomiar-przed.txt`, `ev2-pomiar-po.txt`.
Ziarna moje: **11, 77, 314, 2718** + **1337** (kontrola krzyżowa z Operatorem).

**INNA METODA (a/b dispatchu).** Operator liczy E1/E2 ze STRUMIENIA ROZKAZÓW. Ja liczę je
ze STANU MAPY: snapshot warstw na każdym heksie po każdej turze, metryki wyłącznie z różnic
między snapshotami. Żaden mój licznik nie pochodzi z listy picków.

---

## 1. Czy to naprawdę DWIE ścieżki — TAK, z jednym zastrzeżeniem Operatora

**AI CYWILIZACJI** — `decideAITurn` → `planCityImprovements` (`ai.ts:1984`): `maxItemsPerCity: 1`,
`pracaBudgetPercent: 100`, `improvementBudgetCap`, `skipWyrab: false`, `priorityOverride` =
`AI_IMPROVEMENT_PRIORITY`. **Prawdziwe wejście, potwierdzam.**
**AI GRACZA** — `main.ts:27068` nie przekazuje `maxItemsPerCity` (→ `Infinity`), `skipWyrab: true`,
budżet 33 %, priorytet z `prioritiesForUlepszeniaFocus(focus)`. **Konfiguracje są rozłączne —
to nie jest ten sam pomiar z dwiema etykietami.** Ale ścieżka AI GRACZA jest **odtworzona**,
nie wykonana (`boot()`) — **BRAK DOWODU** (§13a), zgłoszone przez Operatora uczciwie.

**Mój dodatek — drift odtworzenia.** Harness Operatora podaje `playerEra: 3`; `main.ts` w tym
wywołaniu `playerEra` **nie przekazuje**, a strażnik tekstowy F tego pola nie pinuje. Zmierzyłem
oba warianty: różnica **zerowa** na 4 profilach × 5 ziaren (309/284/240/279 warstw identycznie).
Drift realny, skutku nie ma.

## 2. Kontrola krzyżowa — liczby Operatora odtwarzają się CO DO SZTUKI

Moim kodem, moją metodą, na JEGO ziarnach (7/99/512/4242/1337), AI CYWILIZACJI, 40 tur:

| metryka | jego PRZED / PO | **moja PRZED / PO** |
|---|---|---|
| E1 max · średnia | 31 · 17,2 → 3 · 2,3 | **31 · 17,2 → 3 · 2,3** |
| E2 rozpiętość · obcych | 23,3 · 62,1 → 3,5 · 2,1 | **23,3 · 62,1 → 3,5 · 2,1** |
| tartak | 0 → 69 (17·14·7·15·16) | **0 → 69 (17·14·7·15·16)** |
| żywność/surowce/infra | 600/0/0 → 230/139/231 | **600/0/0 → 230/139/231** |
| farmy | 448 → 99 | **448 → 99** |
| plon żywności/turę | 3522 → 2929 | **3522 → 2929** |

Na **moich** ziarnach (11/77/314/2718/1337), AI CYWILIZACJI: E1 max **27 → 3**, E1 śr. **15,3 → 2,2**,
E2 rozpiętość **22,7 → 3,0 tur**, obcych **60,9 → 1,7**, tartak **0 → 63**, kategorie
**600/0/0 → 243/145/212**, farmy 458 → 90, plon żywności **3391 → 2823 (−16,8 %)**.
Efekt jest odporny na dobór ziaren.

## 3. Kontrola ODWROTNA (c) — nic nie zostało zagłodzone; cel „równomiernie" osiągnięty

AI CYWILIZACJI, klucze zbudowane (moje ziarna, 600 warstw w obu przebiegach):

| | PRZED | PO |
|---|---|---|
| klucze użyte | **4** (farma 458, bydlo 73, oboz 58, owce 6) | **13** (farma 90, posterunek 84, fort 82, oboz 67, warzelnia 67, lodzie 65, tartak 63, droga 23, droga_brukowana 23, bydlo 21, glinianka 13, kopalnia_zelaza 1, kamieniolom 1) |
| infra | **0** | **212** |
| heksów tkniętych | 464 | 156 |
| warstw na heks | 1,29 | 3,85 |

**Kryterium 4 rundy 2 (infra ≠ 0) spełnione.** Żadna kategoria nie spadła do zera z niezerowej.
Ale **166/600 (moje) i 193/600 (jego) idą na `posterunek`+`fort`, których delta `tileYield`
wynosi 0** — sprawdziłem sam: `posterunek` i `fort` 0/0/0/0, `droga` +2 handlu,
`kopalnia_zlota` +2 pracy/+10 handlu i **nie ma jej w `AI_IMPROVEMENT_PRIORITY` (21 pozycji)**.
Znaleziska 2 i 3 Operatora — potwierdzone. To jest realny koszt: **−16,8 % żywności AI CYWILIZACJI**
i to jest treść jego `DECISION_REQUIRED` (W-A/W-B/W-C). **Podtrzymuję: bez decyzji właściciela
temat nie idzie do integracji.**

## 4. Profile AI GRACZA (d) i podobieństwo do AI CYWILIZACJI (e)

Rozkład [żywność, surowce, infra], moje ziarna, PO. Dodaję **odległość TV** — sam kosinus jest
zbyt tępy (PRZED dawał 0,9999 dla dwóch rozkładów zdegenerowanych do 100 % żywności):

| profil AI GRACZA | wektor PO | TV do AI CYWILIZACJI PO | TV PRZED |
|---|---|---|---|
| Żywność | [1,000 · 0 · 0] | 0,5950 | **0,0000** |
| Surowce | [0 · 1,000 · 0] | 0,7583 | 1,0000 |
| Infra | [0 · 0 · 1,000] | 0,6467 | 1,0000 |
| **Zrównoważona** | [0,380 · 0,233 · 0,387] | **0,0338** | 0,0159 |
| AI CYWILIZACJI | [0,405 · 0,242 · 0,353] | — | — |

**Profile są rozłączne — potwierdzam.** Potwierdzam też jego znalezisko o pozornej różnicy:
`Zrównoważona` PRZED = **310/0/5** i **149 farm**, `Żywność` PRZED = 315/0/0 i **149 farm** —
identyczne co do sztuki na MOICH ziarnach. **Wzmocnienie mojego pomiaru:** PRZED profilem
najbliższym AI CYWILIZACJI była `Żywność` (TV 0,0000), nie `Zrównoważona` (0,0159) — ECHO
właściciela było spełnione przypadkiem, przez wspólną degenerację. PO `Zrównoważona` jest
najbliższa (0,0338), a `Żywność` daleko (0,5950). **Kryterium 6 spełnione z treścią.**

## 5. Asercja `maxItemsPerCity: 1` (f) — NIETKNIĘTA

`git diff 56af44de..HEAD --name-only`: `ai.ts` i `main.ts` **nie występują**. Behawioralnie,
moim harnessem: max rozkazów `buildImprovement` na miasto na turę = **1** na wszystkich
10 przebiegach (5 ziaren × PRZED/PO).

## 6. Mutacje (g) — powtórzone własną ręką, wyniki co do sztuki jak u Operatora

| mutacja | Operator | **ja** |
|---|---|---|
| czysto | 16/0 | **16/0** |
| M1 całe stare źródło | 12/4 | **12/4** |
| M2 bez członu priorytetu rzeki | 15/1 | **15/1** (`pierwszy pick trafia na 5,5 zamiast 8,5`) |
| M3 bez strażnika duplikatu | 15/1 | **15/1** (`droga@4,5`) |
| M4 `maxItemsPerCity` 1→2 | 14/2 | **14/2** (`4 rozkazy przy 2 miastach`) |

Defekt zastany, który strażnik zasłania, jest realny i policzalny: przy M3, AI CYWILIZACJI,
ziarno 1337, 40 tur → **`droga` = 31 sztuk** (z strażnikiem: 19 na całych 5 ziarnach).

## 7. Moje NOTY (nie zmieniają werdyktu, ale muszą być zapisane)

1. **E1 osiągnęło strukturalną podłogę.** Dla AI CYWILIZACJI E1 max = 3 = liczba miast —
   metryka jest nasycona i dalszej poprawy już nie pokaże. To nie defekt, ale runda 3 potrzebuje
   ostrzejszej metryki (np. E2 rozpiętość, dziś 3,0–3,5 tury, wciąż > 0).
2. **Spadek E1 jest po części skutkiem koncentracji**, nie tylko kolejności: przy stałych 600
   warstwach AI CYWILIZACJI dotyka 3× mniej heksów (464 → 156). To jest dokładnie to, o co
   prosił właściciel, ale liczbę trzeba czytać razem z „heksów tkniętych", nie samą.
3. **`wyrab` jest po tej zmianie strukturalnie nieosiągalny dla AI CYWILIZACJI.** FAZA 2 rusza
   tylko gdy FAZA 1 nic nie postawiła, a przy `maxItemsPerCity: 1` FAZA 1 stawia coś w **każdej**
   z 40 tur (600/600 warstw). Zmierzone `wyrab` = 0 PRZED i 0 PO — **regresu nie ma**, bo PRZED
   też było 0. Ale wiążąca decyzja właściciela Q1 („wycinać mimo to") **nadal nie jest wdrożona**
   i po tej zmianie jest trudniejsza do wdrożenia. Do rundy 3, nie do rundy 2 — KOREKTA zakresu
   jej nie wymaga.
4. **Dwie definicje „heksu z rzeką".** Implementacja używa `map.riverPaths` (zgodnie z istniejącym
   `buildRiverHexSet`, `improvement-build.ts:616`) — poprawnie. Harness Operatora liczy „farmy przy
   rzece" szerzej, doliczając `hex.rzeka.obecna`. Na jego ziarnach: **35,0 % → 83,8 %** (definicja
   szeroka, jego liczba) vs **21,4 % → 82,8 %** (definicja implementacji). Wniosek bez zmian,
   ale liczba PRZED w jego raporcie jest liczona inną definicją niż priorytet, który wdrożył.
5. **BRAK DOWODU** — bramka `wydarzenia-zbadano-karta-tech-real-render` **nie istnieje na tej
   gałęzi** (`ls tools/` — potwierdzam własną ręką). Nie zielona, nie czerwona.

## TESTY (moja ręka, `/home/user/wt-ev-ai2/gra`, każde wywołanie w `timeout`)

`tsc --noEmit` **0** (exit 0) · logic **213/213** · tech-tree **19/0** · research **33/33** ·
unit-replace **13/13** · combat **6/6** · auto-improvements **45/0** · map-improvement-qualify **112/0** ·
oboz-lowiecki-las **91/0** · oboz-lowiecki-evaluator-probe **88/0** · oboz-lowiecki-fc-balans **5/0** ·
oboz-lowiecki-fc-r2-nowa-sciezka **22/0** · ai-jednostki-tylko-zakup **44/0** · ai-improvements **52/0** ·
bramka tematu `ai2-heks-po-heksie-test` **16/0**.
`ai-praca-split-parity-test`: **21/1 na bazie `56af44de`** i **21/1 na gałęzi** — regres zastany,
NIE pogorszony, NIE zielony.
`wydarzenia-zbadano-karta-tech-real-render` — **BRAK PLIKU na gałęzi**, BRAK DOWODU.
Build kanon C-001: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-airzeki-ev
--emptyOutDir` → **PRZESZEDŁ**, `index.html` 37 415,94 kB, 26,50 s, exit 0.

## ZAKRES I GRANICE (§16a)

Diff `56af44de..HEAD` = 8 plików: `gra/src/game/auto-improvements.ts`, 3× `gra/tools/ai2-*.cjs`,
4× artefakty runu. **W allowliście rundy 2 co do pliku.** `gra/data/**`, `improvement-build.ts`,
`gra/src/ui/**`, `main.ts`, `ai.ts`, `WERSJE.md`, `gra-robocza/**` — **nietknięte**.
Żadnej wartości sekretu w diffie. Żadnego usunięcia poza wymienioną pętlą „po typach".
Zero `Math.random()` w nowej ścieżce. `GOAL` raportu Operatora **zgadza się** z sekcją
„KOREKTA ZAKRESU RUNDY 2" dispatchu (§16a pkt 9). Brak kolizji z tematami równoległymi.
Drzewo główne `/home/user/The-Game` czyste (C-019).

## BLOKADY

1. **`DECISION_REQUIRED` (część B Operatora)** — potwierdzam liczbami: wdrożony W-A kosztuje
   AI CYWILIZACJI **16,8 % żywności** i oddaje **32 % budżetu** na `posterunek`+`fort` o zerowym
   plonie. Wybór W-A/W-B/W-C należy do właściciela.
2. **BRAK DOWODU** — ścieżka AI GRACZA mierzona przez odtworzoną konfigurację (potwierdzam;
   drift `playerEra` bez skutku, ale strażnik F go nie pinuje).
3. **BRAK DOWODU** — bramka wydarzeń nie istnieje na gałęzi.
4. Zastany regres `ai-praca-split-parity-test` 21/1 — zmierzony przeze mnie na bazie i na gałęzi,
   nie pogorszony.
5. **Korekta blokady 5 Operatora.** Wpis ABC **rundy 1** JUŻ ISTNIEJE w `main`
   (`dyspozycje/PYTANIA-OTWARTE.md:32035`, `STATUS: **OTWARTE`) — Operator go nie widział, bo na
   gałęzi tematu tego pliku nie ma (0 trafień na `849bb951`, 1 trafienie w `main`). Otwarte pozostaje
   co innego: **wpisu ABC dla części B rundy 2 (W-A/W-B/W-C) nie ma nigdzie** (0 trafień) —
   to zadanie orkiestratora.
6. Do rejestru (§14): `kopalnia_zlota` (najwyższa delta) nieobecna w `AI_IMPROVEMENT_PRIORITY`;
   `wyrab` strukturalnie nieosiągalny dla AI CYWILIZACJI (nota 3) — obie do rundy 3, nie tutaj.

ZMIANY-COMMIT: `gra/tools/ev2-stan-mapy-measure.cjs` (nowe, moje) + ten raport +
`ev2-pomiar-przed.txt`, `ev2-pomiar-po.txt`. **Zero zmian w `gra/src/**` i `gra/data/**`.**

RUNDY: 2/5
NASTĘPNY KROK: Final Control rundy 2 (worktree `/home/user/wt-ev-ai2` i `/home/user/wt-ev-ai2-base`
zostawione); równolegle ABC do właściciela z częścią B — pytanie dotyczy OBU AI, bo silnik wspólny.
DEPLOY-PUSH: NIE WYKONANO
