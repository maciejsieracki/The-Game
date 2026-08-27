# 01 — OPERATOR (runda 2/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1
MODEL+EFFORT: Opus 5, effort high
GOAL: rozdzielony pomiar obu ścieżek AI (gracza i cywilizacji), projekt strategii do
akceptacji właściciela oraz bezsporna część implementacji: pętla po heksach, tartaki
dla AI CYWILIZACJI, priorytet heksów z rzeką.
GAŁĄŹ: `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`, worktree `/home/user/wt-op-ai2`.
RUNDY: 2/5 · DEPLOY/PUSH: NIE WYKONANO

Narzędzia: `gra/tools/ai2-sciezki-rozdzielone-measure.cjs`, `ai2-strategia-plony-measure.cjs`,
bramka `ai2-heks-po-heksie-test.cjs`. Logi: `op2-pomiar-przed.txt`, `op2-pomiar-po.txt`,
`op2-strategia-plony.txt`. Wszędzie: 5 ziaren (7, 99, 512, 4242, 1337) × 40 tur, mapa
36×28 „kontynenty", 3 miasta, promień 4, pop 6 — harness 1:1 z rundą 1.

---

## A. POMIAR ROZDZIELONY — PRZED i PO

**AI CYWILIZACJI** mierzone PRAWDZIWYM wejściem `decideAITurn` (ai.ts:~1984), bez
bezpośredniego wołania pickera. **AI GRACZA**: `main.ts` to closure `boot()`,
niebundlowalna w Node — konfiguracja wywołania (`main.ts:~27066-27094`) jest w harnessie
**odtworzona 1:1**, nie wykonana. Zgłaszam to jako **BRAK DOWODU (§13a)** na „prawdziwe
wejście" tej ścieżki; drift konfiguracji pinuje strażnik tekstowy (test F bramki tematu).

### AI CYWILIZACJI (`decideAITurn`, `maxItemsPerCity: 1`, `pracaBudgetPercent: 100`)

| metryka | PRZED | PO |
|---|---|---|
| E1 max heksów w toku | **31** | **3** (= liczba miast, dolna granica metryki) |
| E1 średnia | 17,2 | **2,3** |
| E2 rozpiętość heksa | 23,3 tur | **3,5 tur** |
| E2 obcych heksów w przerwie | 62,1 | **2,1** |
| ulepszeń razem | 600 | 600 (tempo NIEZMIENIONE) |
| tartak | **0** | **69** (per ziarno 17 · 14 · 7 · 15 · 16) |
| kategorie żywność/surowce/infra | 600 / 0 / 0 | 230 / 139 / 231 |
| farmy | 448 | 99 |
| udział farm przy rzece | 35,0 % | **83,8 %** |
| plon terytorium/turę: żywność · praca · handel | 3522 · 3258 · 3490 | 2929 · 2825 · 3288 |

Ślad czasowy PO (ziarno 7, `op2-pomiar-po.txt`): `6,19 [RZEKA] farma@t0 → oboz_lowiecki@t1
→ tartak@t2 → posterunek@t3 → fort@t4` — heks domknięty w 4 tury przy 2 obcych heksach.
PRZED: `5,7 farma@t0 → oboz_lowiecki@t30`, 80 obcych heksów.

### AI GRACZA — cztery profile (PRZED → PO)

| profil | ulepszeń | E1 max | E1 śr. | E2 rozp. | E2 obcych | żywn./sur./infra | farmy | plon żywności |
|---|---|---|---|---|---|---|---|---|
| Żywność | 315→310 | 29→**3** | 12,3→**0,9** | 17,2→**2,3** | 22,2→**2,2** | 315/0/0 → 310/0/0 | 143→76 | 2935→**3030** |
| Surowce | 274→282 | 3→1 | 1,1→0,1 | 16,9→**1,6** | 20,6→**0,6** | 0/274/0 → 0/282/0 | 0→0 | 2608→2673 |
| Infra | 148→236 | 1→3 | 0,7→1,0 | 27,6→**2,1** | 26,6→**0,6** | 0/0/148 → 0/0/236 | 0→0 | 2495→2495 |
| Zrównoważona | 315→276 | 25→**3** | 10,3→**1,1** | 14,4→**4,0** | 18,4→**1,1** | 310/0/5 → **98/57/121** | 143→41 | 2929→2679 |

**Czy profile gracza się różnią — TAK, ale jeden był pozorny.** Listy `Żywność`/`Surowce`/
`Infra` są rozłączne, więc różnią się z definicji. Natomiast `Zrównoważona` PRZED dawała
**310/0/5** (98,4 % żywności) i **identyczne** 315 ulepszeń oraz 143 farmy co profil
`Żywność` — nie była zrównoważona, była kopią profilu żywnościowego. PO jest 98/57/121.
Podobieństwo rozkładów `Zrównoważona` gracza ↔ AI CYWILIZACJI (kosinus): PRZED **0,9999**
(ale obie zdegenerowane, po 100 % żywności), PO **0,9941** na realnie trzykategoriowym
rozkładzie. Wymóg właściciela „Zrównoważona ≈ AI cywilizacji" jest spełniony i PO ma treść.

---

## B. PROJEKT STRATEGII — `DECISION_REQUIRED`, NIE wdrażam

Podstawa liczbowa: `op2-strategia-plony.txt` (delta `tileYield` per ulepszenie).

**Znalezisko 1, wywraca intuicję: przyrost plonu z ulepszenia jest PŁASKI — identyczny na
każdym terenie i niezależny od rzeki i lasu.** Farma daje `+3 żywność / +3 praca / +3 handel`
tak samo na Łące bez rzeki, na Łące z rzeką i na Wzgórzach. Rzeka podnosi **bazę heksa**
(Łąka: żywność 3 → 6), nie premię z ulepszenia. Wniosek: „priorytet rzek" **nie zwiększa
sumy plonu**, jeśli w końcu wszystkie heksy dostaną farmy — zwiększa go tylko przy budżecie
napiętym (lepsze heksy pracują wcześniej). To jest argument ZA priorytetem rzek, ale inny
niż podany w ECHO.

**Znalezisko 2: `posterunek` i `fort` mają zerową deltę `tileYield`** — kosztują 30 i 25 Pracy
i nie dają ani żywności, ani pracy, ani handlu. PO zmianie AI CYWILIZACJI wydaje na nie
**193 z 600** ulepszeń. To jest bezpośrednia przyczyna spadku plonu żywności o 16,8 %.

**Znalezisko 3: `kopalnia_zlota` (suma delty 12 — najwyższa ze wszystkich, koszt 40 Pracy)
NIE ISTNIEJE w `AI_IMPROVEMENT_PRIORITY`.** Ani AI gracza, ani AI cywilizacji nie zbuduje jej
nigdy. Zgłaszam do rejestru jako osobny temat (§14), nie naprawiam tutaj.

Ranking delty (suma żywność+praca+handel / koszt Pracy), wspólny dla wszystkich terenów:
`kopalnia_zlota 12/44` · `farma 9/40` · `irygacja 9/60` · `bydlo 9/40` · `lodzie_rybackie 8/40` ·
`lama 7/40` · `tarasy 7/50` · `kopalnie 7/44` · `tartak 6/50` · `warzelnia_soli 6/40` ·
`owce 5/40` · `oboz_lowiecki 5/36` · `stadnina 4/56` · `glinianka 3/40` · `kamieniolom 3/44` ·
`droga_brukowana 3/50` · `droga 2/30` · `wyrab 1/5` · **`posterunek` i `fort` 0**.

**PYTANIE DO WŁAŚCICIELA (dotyczy OBU AI, bo silnik jest wspólny).** Ile z budżetu ma iść na
ulepszenia o zerowym plonie (`posterunek`, `fort`) w ramach „domykania heksa"?
- **W-A** — tak jak zaimplementowano: heks domknięty = wszystko, co się kwalifikuje.
  „Równomiernie" spełnione w pełni (infra 0 → 231), cena: żywność AI cywilizacji −16,8 %.
- **W-B** — domknięcie heksa obejmuje tylko ulepszenia z niezerową deltą `tileYield`;
  `posterunek`/`fort` dopiero po wyczerpaniu heksów plonowych. Zmierzone: infra wraca
  praktycznie do zera w 40 turach, czyli kryterium 4 rundy 2 przestaje być spełnione.
- **W-C** — limit sztuk na miasto dla ulepszeń zerowoplonowych (np. 1 posterunek + 1 fort
  na 10 obywateli, spójnie z ECHO o tartaku i obozie). Wymaga rundy 3, nie mieści się
  w allowliście rundy 2.

Kolejność priorytetów per profil oraz wybór W-A/W-B/W-C **zostawiam właścicielowi**
(zakaz cichego ustalenia strategii). Wpis ABC w `dyspozycje/PYTANIA-OTWARTE.md` nadal
**nie istnieje** (`grep 'WYRAB-PRZY-RZECE'` → 0 trafień) — blokada 3 Final Control rundy 1
jest otwarta; to zadanie orkiestratora, nie moje (poza allowlistą).

---

## C. IMPLEMENTACJA — `gra/src/game/auto-improvements.ts` (jedyny dotknięty plik gry)

1. **Odwrócenie pętli** `pickAutoImprovements`: pętla zewnętrzna idzie po HEKSACH, wewnętrzna
   po typach. Wspólne dla obu ścieżek AI.
2. **Kolejność heksów**: najpierw heksy z rzeką NA heksie (zbiór liczony jak `buildRiverHexSet`),
   tie-break — odległość heksowa od centrum miasta, potem `(q,r)`. Zero `Math.random()`.
3. **`wyrab` NIE wchodzi** do sekwencji domykania heksa (wycinka usuwa Las i skasowałaby
   tartak/obóz postawione krok wcześniej) — zostaje na starej ścieżce „po typie", z tym samym
   progiem `WYRAB_MIN_FOREST_IN_RADIUS`. `wyrab` = 0 PRZED i 0 PO, bez zmiany.
4. **Strażnik duplikatu warstwy na heksie.** Bez niego `droga` kwalifikowała się na tym samym
   heksie w kółko (`buildImprovementQualifier` czyta drogi z danych heksa, nie z
   `placedImprovements`) — zmierzone **37 dróg na jednym heksie w 40 turach**. Stara pętla „po
   typach" tego nie ujawniała, bo nigdy nie dochodziła do pozycji `droga`. To defekt zastany,
   odsłonięty przez odwrócenie pętli, naprawiony w tym samym pliku.

`ai.ts` i `main.ts` **nietknięte** — `maxItemsPerCity: 1` dla AI CYWILIZACJI zostaje (ECHO:
„Zostaw limit, zmień kolejność"), asercja w bramce (test D, dwoma niezależnymi sposobami).

---

## TESTY (własną ręką, worktree `/home/user/wt-op-ai2/gra`, każde wywołanie w `timeout`)

`tsc --noEmit` **0** · logic **213/213** · tech-tree **19/0** · research **33/33** ·
unit-replace **13/13** · combat **6/6** · auto-improvements **45/0** ·
map-improvement-qualify **112/0** · oboz-lowiecki-las **91/0** · oboz-lowiecki-evaluator-probe
**88/0** · oboz-lowiecki-fc-balans **5/0** · oboz-lowiecki-fc-r2-nowa-sciezka **22/0** ·
ai-jednostki-tylko-zakup **44/0** · ai-improvements **52/0**.
`ai-praca-split-parity-test`: **21/1 na bazie `main` e74cb933** i **21/1 na tej gałęzi** —
regres zastany, NIE pogorszony, NIE zielony (§13a).
Bramka `wydarzenia-zbadano-karta-tech-real-render` — **BRAK PLIKU na tej gałęzi** (należy do
równoległego, jeszcze niescalonego tematu). Zgłaszam jako BRAK DOWODU, nie jako zielone.
Build kanon C-001: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-airzeki-op2
--emptyOutDir` → **PRZESZEDŁ**, `index.html` 37 415,94 kB, 25,88 s, exit 0.

**Nowa bramka tematu: `ai2-heks-po-heksie-test.cjs` — 16/0.** Dowód nietautologiczności,
cztery mutacje, każda uruchomiona:
| mutacja | wynik |
|---|---|
| M1: całe źródło sprzed zmiany (`AI2_SRC_DIR=origin/main`) | **12/4** — czerwienieją A (2 asercje), B, E |
| M2: usunięty człon priorytetu rzeki w sortowaniu heksów | **15/1** — czerwienieje B |
| M3: usunięty strażnik duplikatu warstwy | **15/1** — czerwienieje C (`droga@4,5`) |
| M4: `maxItemsPerCity: 1` → `2` w `ai.ts` | **14/2** — czerwienieją obie asercje D |
Po przywróceniu źródła: **16/0**.

## ZMIANY/COMMIT

`gra/src/game/auto-improvements.ts` · `gra/tools/{ai2-sciezki-rozdzielone-measure,
ai2-strategia-plony-measure,ai2-heks-po-heksie-test}.cjs` · raporty i logi runu.
Commity: `50815810` (pomiar PRZED) · `9ee67089` (implementacja C) · `275163e2` (bramka).
Zero zmian w `gra/data/**`, `gra/src/map/**`, `gra/src/ui/**`, `gra/src/main.ts`,
`gra/src/game/ai.ts`, `dyspozycje/WERSJE.md`, `gra-robocza/**`. Allowlista dotrzymana.

## BLOKADY

1. **`DECISION_REQUIRED` (część B)** — wybór W-A/W-B/W-C oraz zatwierdzenie kolejności
   priorytetów per profil. Nie rozstrzygam.
2. **BRAK DOWODU** — ścieżka AI GRACZA mierzona przez odtworzoną konfigurację, nie przez
   wykonanie kodu `main.ts` (closure `boot()`).
3. **BRAK DOWODU** — bramka `wydarzenia-zbadano-karta-tech-real-render` nie istnieje na tej gałęzi.
4. Zastany regres `ai-praca-split-parity-test` 21/1 na `main` — nie mój, nie pogorszony.
5. Brak wpisu ABC w `dyspozycje/PYTANIA-OTWARTE.md` (blokada 3 Final Control rundy 1) — otwarta.
6. Do rejestru (§14, NIE naprawiam): `kopalnia_zlota` nieobecna w `AI_IMPROVEMENT_PRIORITY`.

## NASTĘPNY KROK

Evaluator rundy 2 (worktree `/home/user/wt-op-ai2` zostawiony); równolegle ABC do właściciela
z częścią B.
