# 04 — OPERATOR (runda 4/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1
MODEL+EFFORT: Opus 5, effort high
GOAL: AI CYWILIZACJI i AI GRACZA („zrównoważone") budują domyślnie samą żywność; niedobór
surowca otwiera resztę listy; budowa (poza złożami) tylko na heksach z obywatelami; nadwyżka
budżetu → AI CYWILIZACJI na budynki, AI GRACZA tylko sygnalizuje; R4-Q2 = przełącznik
„wolno wycinać las" dla automatu GRACZA (państwo + miasto, domyślnie wyłączony).
GAŁĄŹ: `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R4`, worktree `/home/user/wt-op-ai-r4`.

## BAZA GAŁĘZI — czytaj to najpierw

Dispatch kazał odbić się od `origin/main` (27be5705), a kryterium 9 wymaga zielonej bramki
tematu **rundy 3**. Te dwie rzeczy są sprzeczne: **praca rundy 3 NIE JEST w `main`** —
gałąź `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` (640c6b3e) nigdy nie została zintegrowana
(Final Control rundy 2 wystawił „GOTOWOŚĆ DO INTEGRACJI: NIE"). Bez rundy 3 nie ma ani
mechanizmu wyrębu przy rzece, ani bramki `ai2-heks-po-heksie-test.cjs`.

Dlatego gałąź rundy 4 = `origin/main` **+ merge gałęzi rundy 3** (commit `83f3e766`,
merge czysty, zero konfliktów). Rzeczywisty wkład rundy 3 poza dokumentacją to WYŁĄCZNIE
`gra/src/game/auto-improvements.ts` + cztery narzędzia w `gra/tools/` — wszystko wewnątrz
allowlisty rundy 4. **Integrator musi wiedzieć, że merge tej gałęzi wnosi do `main` także
całą rundę 3.**

---

## ZNALEZISKO METODOLOGICZNE — kształt węzłów terytorium w harnessach rund 2 i 3

`ai2-sciezki-rozdzielone-measure.cjs` i `ai2-heks-po-heksie-test.cjs` budowały
`territoryNodes` jako **węzeł na każdy heks** promienia. Silnik nigdy takiej listy nie
produkuje: `main.ts::buildAllTerritoryNodes` → `buildTerritoryNodesFromCities`
(`map/territory-work.ts`) zwraca **dokładnie jeden węzeł na miasto**.

Do rundy 3 różnica była nieszkodliwa (jedynym konsumentem był `territoryOwnerAt`). Od rundy 4
węzły czyta też `workedHexCoordsForCity`, a `okolica.ts::cityCenterKeysFromTerritoryNodes`
traktuje **każdy węzeł jako CENTRUM MIASTA** i bezwarunkowo wyklucza go z pól obrabianych —
przy węźle-na-heks **cały promień miasta wypadał z pól obrabianych**, więc Zasada 2 byłaby
mierzona na sztucznie pustym zbiorze (zmierzone: `resolveWorkedTiles` zwracało pola oddalone
o 4–6 heksów, spoza terytorium).

Poprawiłem kształt węzłów w bramce rundy 3 i w swoim narzędziu pomiarowym. **Wszystkie liczby
PRZED i PO w tym raporcie są zmierzone tym samym, poprawionym harnessem** — są porównywalne
ze sobą, ale **NIE** są porównywalne wprost z liczbami rund 2 i 3.

---

## KRYTERIUM 1 — POMIAR PRZED (5 ziaren × 40 tur, `decideAITurn`, AI CYWILIZACJI)

Narzędzie: `gra/tools/ai4-popyt-obywatele-measure.cjs` (`AI4_SRC_DIR` przełącza drzewo
źródłowe PRZED/PO). Surowe logi: `op4-pomiar-przed.txt`, `op4-pomiar-po.txt`.
Ziarna 7, 99, 512, 4242, 1337; mapa 36×28 „kontynenty", 3 miasta, pop 6.

| scenariusz | rozkazów | żywność | surowce | infrastruktura | wyrąb |
|---|---|---|---|---|---|
| A — BEZ niedoboru | 600 | 311 (51,8 %) | 137 (22,8 %) | 82 (13,7 %) | 70 (11,7 %) |
| B — niedobór drewna cały czas | 600 | 308 (51,3 %) | 140 (23,3 %) | 82 (13,7 %) | 70 (11,7 %) |
| C — niedobór w turach 10–19 | 600 | 310 (51,7 %) | 138 (23,0 %) | 82 (13,7 %) | 70 (11,7 %) |

**To jest pomiarowy dowód tezy dispatchu:** różnica A vs B to 3 rozkazy na 600 (0,5 %).
Niedobór PRZED zmieniał wyłącznie KOLEJNOŚĆ (`improvementPriorityForDeficits`), nie ZAKRES.

Ślad czasowy scenariusza C PRZED (żywność/nie-żywność na turę) nie odróżnia okna niedoboru
od reszty gry: t0–t9 `14/1 3/12 4/11 8/7 …`, t10–t19 (niedobór) `12/3 9/6 5/10 …`,
t20+ `9/6 13/2 4/11 …`.

## KRYTERIUM 2 — POMIAR PO

| scenariusz | rozkazów | żywność | surowce | infrastruktura | wyrąb |
|---|---|---|---|---|---|
| A — BEZ niedoboru | 193 | 181 (93,8 %) | **0** | **0** | 12 (6,2 %) |
| B — niedobór drewna cały czas | 356 | 181 (50,8 %) | 124 (34,8 %) | 39 (11,0 %) | 12 (3,4 %) |
| C — niedobór w turach 10–19 | 315 | 181 | 84 | 38 | 12 |

Ślad czasowy scenariusza C PO — rozkazy niezywnościowe pojawiają się **w tej samej turze**,
w której zaczyna się niedobór, i znikają razem z nim:

```
t0 :15/0  t1 :10/5  …  t9 :14/1        (bez niedoboru: żywność + wyrąb)
t10*:0/15 t11*:0/15 t12*:0/15 t13*:0/15 …  t19*:5/6   (* = niedobór drewna)
t20 :9/0  t21 :7/0  t22 :4/0  …  t26+ : 0/0            (powrót do żywności, potem nadwyżka)
```

W scenariuszu C rozbicie „bez niedoboru" (174 rozkazy) to **162 żywność + 12 wyrąb, 0 surowce,
0 infrastruktura**; „przy niedoborze" (141 rozkazów) to 19 żywność + 84 surowce + 38 infra.

**MÓWIĘ TO WPROST — kryterium 2 brzmi „0 rozkazów poza żywnością, nie »mniej«, ZERO":
surowce i infrastruktura to faktycznie ZERO, ale `wyrąb` zostaje (12 rozkazów, 6,2 %).**
To jest moje świadome rozstrzygnięcie, nie przeoczenie. Powód: po zamknięciu
`R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1` farma na zalesionym heksie wymaga wyrębu **zawsze**, więc
`wyrąb` w KROKU 0 (heks rzeka+las) jest **pierwszym krokiem sekwencji żywnościowej**
wyrąb → farma, a nie budową „na zapas"; dispatch wprost zabrania usuwania mechanizmu wyrębu
przy rzece z rundy 3. Wyrąb z FAZY 2 (zbieranie Drewna „bo nic pilniejszego") jest przy braku
niedoboru **wyłączony**. Jeśli właściciel chce ZERA także tu — to jedna linia
(`wyrabWlaczony` pod `!foodOnly`) i osobna decyzja, bo kasuje GOAL rundy 3.

## KRYTERIUM 3 — ZASADA 2 ZMIERZONA OSOBNO

Odsetek rozkazów na heksach BEZ obywateli (AI CYWILIZACJI, scenariusz A):

| | rozkazów razem | poza obywatelami | w tym ZŁOŻOWE (wyjątek) | **NIE-złożowe** |
|---|---|---|---|---|
| PRZED | 600 | 379 (63,2 %) | 15 | **364 (60,7 %)** |
| PO | 193 | 40 (20,7 %) | 40 | **0 (0,0 %)** |

Scenariusze B i C PO: 115/115 i 87/87 — **wszystkie** rozkazy poza obywatelami są złożowe.
AI GRACZA (profil „zrównoważone", ten sam picker): `onlyWorked=false` → 264 nie-złożowe
poza obywatelami (84,9 %); `onlyWorked=true` → **0 (0,0 %)**, złożowych 39.

Wyjątek złożowy to dokładnie `hexHasDepositReserve(hex) && depositAllowsPlayerImprovement(key, hex)`
— czyli heks ze złożem **i tylko dla ulepszenia, które to złoże konsumuje**. `oboz_lowiecki`
na lesie **nie** dostaje zwolnienia (Las nie jest złożem) — sprawdzone, celowe.

## KRYTERIUM 4 — ZASADA 3

**AI CYWILIZACJI.** Picker wypełnia `AutoImprovementSurplusReport`
(`demandActive / deficitActive / anyCandidate / surplus`); silnik (`main.ts`, zaraz po
`decideAITurn`) na `surplus === true` przesuwa podział Pracy tego AI na budynki
(`ownerDefaultPodzialPracy` + `city.podzialPracy` → `MAX_PODZIAL_PRACY_BUDYNKI_PERCENT`),
a po ustaniu nadwyżki wraca do wartości wybranej przez samo AI (`decideAIEconomySliders`).
Zmierzone (scenariusz A, 5 ziaren): nadwyżka w **21–28 turach na 40**, pierwsza w turze
t12–t19 — czyli dokładnie wtedy, gdy pola z obywatelami są domknięte.

Dowody w bramce: Z3a (są kandydaci → nadwyżki nie ma), Z3b (po domknięciu → `surplus:true`,
`anyCandidate:false`), Z3c (niedobór kasuje nadwyżkę), Z3d — **przesunięcie nie jest no-opem**:
realna funkcja silnika `splitPraca(100, …)` daje `doBudynkow` 70 → 100.

**BRAK DOWODU (§13a).** Dispatch chce „dowodu z kolejki produkcji miasta". Nie mam go.
`main.ts` to closure `boot()`, niebundlowalna w Node (ta sama bariera, którą rundy 2 i 3
zgłaszały dla ścieżki AI GRACZA), a mój harness nie prowadzi kolejki produkcji (`data.buildings`
puste). Mam: (a) behawioralny dowód, że raport nadwyżki zapala się i gaśnie we właściwych
warunkach; (b) behawioralny dowód, że podniesiony podział Pracy realnie zwiększa Pracę
kolejki; (c) strażniki tekstowe pinujące wpięcie w silniku. **Efektu „więcej ukończonych
budynków w prawdziwej rozgrywce" NIE ZMIERZYŁEM.**

**AI GRACZA — nie przesuwa nic.** Automat gracza wyłącznie pokazuje komunikat
(„nadwyżka budżetu Pracy — rozważ przesunięcie suwaka na rzecz budynków"). Dowód niezmienności
`pracaAutoPercent`: Z3j (w bloku sygnału nie ma ŻADNEGO zapisu do `pracaAutoPercent`) i Z3k
(w całym `main.ts` jest **dokładnie jedno** miejsce zapisujące `pol.pracaAutoPercent` — handler
suwaka gracza). Mutacja M10 (dopisanie zapisu do tego bloku) czerwieni Z3j.

## KRYTERIUM 5 — TRZY POZOSTAŁE PROFILE AUTOMATU GRACZA

Identyczny wynik `pickAutoImprovements` PRZED i PO, na tych samych danych wejściowych
(`onlyWorked=false` po obu stronach — to niezależne ustawienie, patrz nota niżej):

| profil | PRZED | PO | odcisk (klucz=liczba) |
|---|---|---|---|
| żywność | 311 | 311 | `bydlo=14,farma=14,lodzie_rybackie=205,oboz_lowiecki=78` — identyczny |
| surowce | 283 | 283 | `glinianka=11,kamieniolom=2,kopalnia_cyny=1,tartak=77,warzelnia_soli=192` — identyczny |
| infrastruktura | 98 | 98 | `droga=41,droga_brukowana=41,fort=8,posterunek=8` — identyczny |
| zrównoważone | 301 | 301 (bez `demandDriven`) / 311 vs 301 z nim | — |

Dodatkowo bramka (Z1h) porównuje wynik pickera **z** `demandDriven` i **bez** na tych trzech
profilach: string picków jest identyczny co do heksa. Z1i pilnuje drugiej strony — profil
„zrównoważone" MUSI się różnić, inaczej Zasada 1 byłaby atrapą.

**NOTA, mówię wprost:** Zasada 2 (`onlyWorked` domyślnie włączone) **dotyczy wszystkich
czterech profili**, bo ECHO właściciela nie robi tam wyjątku („AI, zarówno w cywilizacji, jak
i w ludzkich domach, powinno domyślnie budować ulepszenia tam, gdzie są obywatele"). Kryterium 5
czytam więc jako „Zasada 1 nie wycieka na trzy pozostałe profile" — i to jest udowodnione.
Efekt samej zmiany domyślnej `onlyWorked` na tych profilach jest mierzalny osobno i podany
wyżej w kryterium 3. To gracz jednym kliknięciem wraca do starego zachowania.

## KRYTERIUM 6 — R4-Q2 (wariant C)

- Nowe pola: `UlepszeniaEmpirePolicy.wolnoWycinacLas` (państwo) i
  `City.ulepszeniaWolnoWycinacLas` (miasto), stała `DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS = false`.
- Panel trybu budowy: przycisk „Wolno wycinać las" w obu zakresach, wzorem istniejącego
  „Tylko pola z obywatelami" (`buildModeHud.ts` + handlery w `main.ts`).
- Picker dostał `getSkipWyrab` (per miasto) — `skipWyrab` był jeden na całe wywołanie, a
  przełącznik ma dwa zakresy.
- Save/load: pole państwa jedzie w `meta.ulepszeniaEmpireByOwner` (cały obiekt polityki),
  odtwarzane jawnie przy wczytaniu; pole miasta domykane w `ensureCitySaveDefaults`.
  Stary zapis bez pola → przełącznik WYŁĄCZONY (Q2g, Q2i, Q2j; mutacje M14, M15).
- Zachowanie zmierzone (AI GRACZA, profil zrównoważone, 5 ziaren × 40 tur):
  **wyłączony → 169 rozkazów, wyrąb 0, farmy 44; włączony → 187 rozkazów, wyrąb 9, farmy 53.**
- Ścieżka DECYZJI jest identyczna z AI CYWILIZACJI (ten sam `skipWyrab: false` w tym samym
  pickerze — Q2k/Q2l/Q2m, mutacja M12). Ścieżka EGZEKUCJI jest ścieżką GRACZA: `wyrab` to typ
  `wycinka`, więc `main.ts` wpina automat w istniejącą, wieloturową wycinkę gracza
  (`hexClearingStates` + `tickHexClearing`), a nie w natychmiastowy commit AI. **Zgłaszam to
  jawnie jako interpretację**: dispatch mówi „identycznie jak dziś AI CYWILIZACJI (ta sama
  ścieżka `skipWyrab: false`)", a gracz ma wieloturową wycinkę, której AI nie ma.

## KRYTERIUM 7 — DOWÓD NIE-TAUTOLOGICZNY

`gra/tools/ai4-mutacje.cjs`: 15 celowanych mutacji, każda kopiuje `src`, podmienia
**jeden** fragment i uruchamia bramkę przez `AI4_SRC_DIR`. Wynik: **15 dowodów, 0 podejrzanych**
(`op4-mutacje.txt`). Baza zielona 48/0.

| mutacja | co psuje | czerwone asercje |
|---|---|---|
| M1 | zdejmuje zawężenie listy do żywności | Z1a, Z1d, Z1f, Z1g, Z1i |
| M2 | wpuszcza FAZĘ 0 (posterunek/fort) mimo braku niedoboru | Z1a, Z1d, Z1g |
| M3 | niedobór ŻYWNOŚCI otwiera surowce | Z1d, Z1e |
| M4 | zdejmuje filtr „przy obywatelach" z FAZY 1 | Z2c |
| M5 | kasuje wyjątek złożowy | Z2d |
| M6 | cofa domyślne `onlyWorked` na `false` | Z2e, Z2f, Z2g |
| M7 | odpina filtr obywateli od AI CYWILIZACJI (`ai.ts`) | Z2j, Z3b |
| M8 | raport nigdy nie melduje nadwyżki | Z3b |
| M9 | rozbramkowuje przekierowanie w silniku | Z3f |
| M10 | automat GRACZA sam rusza suwakiem | Z3j |
| M11 | domyślny przełącznik wyrębu na WŁĄCZONY | Q2a, Q2b, Q2c, Q2f, Q2g |
| M12 | ignoruje `getSkipWyrab` (przełącznik per miasto) | Q2k, Q2m |
| M13 | odpina przełącznik od wywołania pickera w `main.ts` | Q2n |
| M14 | przestaje odtwarzać przełącznik z zapisu | Q2i |
| M15 | zdejmuje domyślkę pola miasta w `ensureCitySaveDefaults` | Q2g |

M4 celowo NIE czerwieni Z2j: w tamtej fiksturze nie ma złóż, więc heksy bez obywateli
są odsiane wcześniej, przy budowie `candidateHexes`; Z2j pilnuje mutacja M7. **Każda asercja
ma swoją celowaną mutację; nie każda mutacja czerwieni każdą asercję.**

## KRYTERIA 8 i 9 — BRAMKI

Pięć referencyjnych (własną ręką, w `timeout`, z `gra/`):
`logic-test` **213/213** · `tech-tree-test` **19/0** · `research-test` **33/33** ·
`unit-replace-test` **13/13** · `combat-test` **6/6**. `tsc --noEmit` — **0 błędów**.
Build: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ai-r4-op --emptyOutDir`
— **OK, 848 modułów, 33,3 s**.

Bramka tematu rundy 3 `ai2-heks-po-heksie-test.cjs`: **35 passed, 0 failed** (rundа 3: 34/0 —
jedna asercja DOSZŁA, żadna nie zniknęła). Nowa bramka rundy 4
`ai4-popyt-obywatele-test.cjs`: **48 passed, 0 failed**.

Bez pogorszenia: `auto-improvements-test` 45/0 · `ai-improvements-test` 52/0 ·
`map-improvement-qualify-test` 117/0 · `farma-nie-w-lesie-test` 136/0 ·
`oboz-lowiecki-las-test` 91/0 · `ai-jednostki-tylko-zakup-test` 44/0 ·
`ulepszenia-praca-percent-test` 28/0.

**CZERWONA, ALE ZASTANA:** `ai-praca-split-parity-test` **21/1**
(`gracz i AI czytają udział ulepszeń jako dopełnienie jedynego podziału`). Sprawdzone w tej
rundzie: **identyczny wynik 21/1 na czystym drzewie `origin/main`** — regres istniał przed tą
gałęzią. Zgłaszam jako zastany, nie zielony (to samo znalezisko co runda 1).

### Zmiany w bramce rundy 3 — wszystkie, wprost

1. **Kształt węzłów terytorium** — helper `territory()` zwraca jeden węzeł na miasto zamiast
   węzła na heks (znalezisko wyżej). To naprawa harnessu, nie asercji.
2. **Okno strażnika tekstowego D** — 4000 → 8000 znaków. Runda 4 dopisała w
   `planCityImprovements` blok Zasady 2, przez co `maxItemsPerCity: 1` wypadło poza stare okno;
   strażnik czerwienił się mimo że pilnowany kod stoi na miejscu.
3. **Test E (tartak)** — scenariusz dostaje `resourceDeficitKeys: ['drewno']`, bo `tartak` jest
   ulepszeniem surowcowym i od tej rundy powstaje tylko przy niedoborze. **Dołożyłem drugą
   asercję:** BEZ niedoboru tartaku ma nie być ani razu. Asercja rundy 3 nie została osłabiona
   — została uzupełniona o drugą połowę reguły właściciela.
4. **Test I (wyrąb przy rzece)** — scenariusz dostaje `resourceDeficitKeys: ['drewno']` (jak
   wyżej, bo asercje o tartaku/posterunku/forcie są o ulepszeniach niezywnościowych) oraz
   ręcznie ustawioną okolicę (`okolicaTryb: 'reczny'`), żeby obywatele faktycznie obrabiali
   heksy z rzeką — inaczej Zasada 2 wycina je z puli kandydatów i scenariusz przestaje mierzyć
   priorytet rzeki.

## KOREKTY ŹRÓDŁA WYMUSZONE PRZEZ POMIAR (zgłaszam, bo nie było ich w dispatchu)

1. **`lesneWymagane` (minimum leśne rundy 3)** liczy się teraz z listy, którą automat
   W TEJ konfiguracji może zbudować (`hexPhasePriority` + odblokowane technologie), nie z pełnej
   `AI_IMPROVEMENT_PRIORITY`. Bez tego przy `foodOnly` `tartak` był wymagany i nigdy nie mógł
   powstać → **wyrąb rundy 3 znikał całkowicie** (zmierzone: 12 → 0 na wszystkich pięciu
   ziarnach, także przy jawnie włączonym przełączniku R4-Q2). To był cichy regres mechanizmu,
   którego dispatch zabrania.
2. **Liczniki stanu miasta** (zapas lasu przed wyrębem, minimum leśne, pułap obrony, licznik
   ulepszeń plonowych) liczą po PEŁNYM promieniu miasta (`radiusHexes`), nie po zawężonej
   liście kandydatów. Zasada 2 ogranicza GDZIE budować, nie to, czym miasto dysponuje. Bez tego
   miasto o pop 2 „miało" 2 heksy lasu i próg `WYRAB_MIN_FOREST_IN_RADIUS = 3` zamykał wyrąb na
   mapie zbudowanej z samego lasu (regres złapany przez `ai-improvements-test`, test 7).
3. **FAZA 2 wyrębu** dostała strażnik „heks z tartakiem/obozem nie idzie pod topór", którego
   miał tylko KROK 0. Runda 3 tej luki nie widziała, bo przy `maxItemsPerCity: 1` FAZA 2 prawie
   nigdy nie ruszała; bramka rundy 3 (test I) łapie ją teraz wprost.

## BRAK DOWODU (§13a) — pełna lista

1. Efekt Zasady 3 dla AI CYWILIZACJI **w kolejce produkcji prawdziwej rozgrywki** — nie
   zmierzony (uzasadnienie w kryterium 4).
2. Ścieżka AI GRACZA jest mierzona **odtworzoną konfiguracją** wywołania pickera, nie
   prawdziwym wejściem — `main.ts` to closure `boot()`. Konfiguracja jest pinowana strażnikami
   tekstowymi (Q2n, Q2o, Q2p oraz test F bramki rundy 3).
3. **Weryfikacji w przeglądarce nie wykonałem.** Nowe przyciski „Wolno wycinać las" (państwo
   i miasto) w panelu trybu budowy są sprawdzone kodowo i testem stanu, **nie wizualnie**.
   Temat ma warstwę UI, więc zgodnie z §9 to jest brakujący dowód, nie drobiazg.
4. Nie zmierzyłem, jak Zasada 2 wpływa na tempo rozwoju AI w dłuższej grze (plon/turę,
   liczba miast) — mierzyłem rozkłady rozkazów i miejsca budowy, nie wynik strategiczny.
   Spadek liczby rozkazów 600 → 193 przy braku niedoboru jest ZAMIERZONY („przestań budować
   dla sztuki"), ale jego wpływ na siłę AI jest niezmierzony.

---

ZMIANY/COMMIT:
`gra/src/game/auto-improvements.ts` (Zasady 1/2/3 w pickerze, `getSkipWyrab`, raport nadwyżki),
`gra/src/game/ai.ts` (wpięcie Zasad 1/2/3 w `planCityImprovements`, `improvementSurplusReport`
w `AITurnOpts`), `gra/src/game/cities.ts` (nowe stałe domyślne, pole `wolnoWycinacLas`
w polityce państwa i mieście, migracja zapisu), `gra/src/main.ts` (ścieżka AI GRACZA:
`demandDriven` + realne niedobory + `getSkipWyrab` + wycinka + sygnał nadwyżki; ścieżka AI
CYWILIZACJI: raport nadwyżki i przekierowanie na budynki; handlery panelu; save/load),
`gra/src/ui/buildModeHud.ts` (przycisk „Wolno wycinać las" — państwo i miasto),
`gra/tools/ai2-heks-po-heksie-test.cjs` (korekty opisane wyżej),
`gra/tools/ai4-popyt-obywatele-test.cjs` (nowa bramka tematu, 48 asercji),
`gra/tools/ai4-popyt-obywatele-measure.cjs` (pomiar PRZED/PO),
`gra/tools/ai4-mutacje.cjs` (15 mutacji),
`dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/{04-operator-r4.md, op4-pomiar-przed.txt, op4-pomiar-po.txt, op4-mutacje.txt, op4-bramka.txt}`.
**Zero zmian w `gra/data/**`, `gra/src/map/improvement-build.ts` i `dyspozycje/WERSJE.md`.**

TESTY: pięć bramek referencyjnych 213/213 · 19/0 · 33/33 · 13/13 · 6/6; `tsc --noEmit` 0 błędów;
build vite do `/tmp/civ-dist-ai-r4-op` OK; bramka rundy 3 **35/0** (było 34/0); bramka rundy 4
**48/0**; mutacje **15 dowodów / 0 podejrzanych**; bez pogorszenia: auto-improvements 45/0,
ai-improvements 52/0, map-improvement-qualify 117/0, farma-nie-w-lesie 136/0, oboz-lowiecki-las
91/0, ai-jednostki-tylko-zakup 44/0, ulepszenia-praca-percent 28/0; zastany czerwony
`ai-praca-split-parity-test` 21/1 (identycznie na `origin/main`).

BLOKADY:
1. Gałąź rundy 4 wnosi do `main` także **całą, nigdy nie zintegrowaną rundę 3** — integrator
   musi to świadomie przyjąć.
2. `wyrab` (12 rozkazów, 6,2 %) zostaje przy braku niedoboru — kryterium 2 mówi „ZERO poza
   żywnością". Uzasadnienie wyżej; jeśli właściciel chce dosłownego zera, to osobna decyzja,
   bo kasuje GOAL rundy 3.
3. Brak weryfikacji w przeglądarce dla dwóch nowych przycisków panelu (§9).
4. Brak dowodu z kolejki produkcji miasta dla Zasady 3 po stronie AI CYWILIZACJI.
5. Znalezisko zastane: `ai-praca-split-parity-test` czerwony na `main`.

RUNDY: 4/5
NASTĘPNY KROK: Evaluator — niezależny pomiar inną metodą (proponuję snapshot stanu mapy zamiast
strumienia rozkazów, jak w rundzie 2), własne mutacje, weryfikacja czterech blokad wyżej.
DEPLOY/PUSH: NIE WYKONANO (push wyłącznie gałęzi tematu; zero pushu do `main`)
