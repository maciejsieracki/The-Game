# 01 — OPERATOR (runda 3/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1
MODEL+EFFORT: Opus 5, effort high
GOAL: wdrożyć wariant W-B („domykaj tylko to, co daje plon") i doprowadzić do tego, żeby
`wyrab` faktycznie się działał na heksach rzeka+las — GOAL tematu, po rundzie 2 strukturalnie
nieosiągalny.
GAŁĄŹ: `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`, worktree `/home/user/wt-op-ai3`.
RUNDY: 3/5 · DEPLOY/PUSH: NIE WYKONANO

Pomiar: `gra/tools/ai2-sciezki-rozdzielone-measure.cjs`, 5 ziaren (7, 99, 512, 4242, 1337)
× 40 tur, mapa 36×28 „kontynenty", 3 miasta, promień 4, pop 6 — harness 1:1 z rundą 2.
Logi: `op3-pomiar-po.txt`, `op3-warianty.txt`.

---

## A. W-B — AI CYWILIZACJI, prawdziwe wejście `decideAITurn`

| metryka | W-A (runda 2) | **W-B (ta runda)** |
|---|---|---|
| plon żywności/turę | 2929 | **3179** |
| E1 max / średnia | 3 / 2,3 | **5 / 2,4** |
| E2 rozpiętość / obcych heksów | 3,5 tur / 2,1 | **2,4 tur / 2,0** |
| `posterunek` / `fort` | 98 / 95 | **10 / 10** (2 + 2 na ziarno) |
| `wyrab` / farmy po wyrębie | 0 / 0 | **72 / 71** |
| `tartak` / `oboz_lowiecki` | 69 / 71 | 22 / 23 |
| farmy / przy rzece | 99 / 83,8 % | 131 / 75,6 % |
| kategorie żywność/surowce/infra | 230/139/231 | **328/131/69** |

Per ziarno (7 · 99 · 512 · 4242 · 1337): `wyrab` **17 · 13 · 9 · 15 · 18**, farmy po wyrębie
**17 · 13 · 9 · 15 · 17**, `posterunek` **2 · 2 · 2 · 2 · 2**, `fort` **2 · 2 · 2 · 2 · 2**,
plon żywności **625 · 665 · 583 · 652 · 654**. Zero na żadnym ziarnie.

**ODZYSK ŻYWNOŚCI: 250 z 593, czyli 42,2 % — MNIEJ NIŻ POŁOWA. Mówię to wprost, kryterium 1
NIE jest spełnione.** E1 ≤ 5 i E2 ≤ 6 tur — spełnione. Rozkład (`op3-warianty.txt`, każdy
wariant mierzony mutacją jednej linii na tym samym źródle): samo W-B daje 3083 (+154, 26,0 %),
wyrąb dokłada +96 (bo wycięty heks dostaje farmę zamiast obozu). Reszty deficytu **nie da się
odzyskać w tym wariancie**: 200 z 600 rozkazów idzie na ulepszenia o niezerowej delcie plonu,
ale zerowej albo znikomej delcie ŻYWNOŚCI (`warzelnia_soli` 69, `droga`+`droga_brukowana` 49,
`glinianka` 27, `lodzie_rybackie` 65…). To jest cena wymogu „równomiernie" z rundy 2 —
baza 3522 pochodzi z rozkładu 600/0/0, który właściciel wtedy odrzucił. Zwrot do >50 %
wymaga decyzji, których ulepszeń NIEżywnościowych ma być mniej.

## B. `wyrab` — GOAL tematu

`wyrab` dostał własny KROK 0 sekwencji heksa: heks z rzeką I lasem jest najpierw wycinany,
potem (w kolejnych turach, już bez lasu) dostaje farmę. Wcześniej żył tylko w FAZIE 2,
która przy `maxItemsPerCity: 1` nie ruszała nigdy (600 na 600 rozkazów). Bilans jest
świadomie ujemny — decyzja Q1 właściciela, nie podważam.

Dwa warunki dołożone po pomiarze, oba z własnego ECHO właściciela:
1. **Minimum leśne miasta** — dopóki miasto nie ma `ceil(pop/10)` tartaków i tyluż obozów,
   topór stoi; heks z tartakiem/obozem nigdy nie idzie pod topór. Bez tego zmierzono
   `tartak` 69 → **0**, czyli skasowanie wyniku rundy 2. Z tym: 22.
2. **Po zagospodarowaniu wszystkich rzek** wyrąb schodzi na pozostałe lasy — bez tego
   ziarno 512 (miasta bez ani jednego heksa z rzeką) miało `wyrab` = 0.

**AI GRACZA: `wyrab` = 0 na wszystkich czterech profilach — i to nie jest defekt.**
`main.ts:~27086` przekazuje `skipWyrab: true` (gracz nie karczuje automatem). Ten sam picker
przy `skipWyrab: false` wycina — asercja L bramki. `main.ts` jest POZA allowlistą rundy 3,
więc nie ruszam: zmiana tej flagi to decyzja właściciela, nie Operatora.

## C. Kontrola odwrotna i skutki uboczne

- `posterunek`/`fort` **nadal powstają** (10 + 10, po 2 na ziarno), poza sekwencją domykania:
  osobna FAZA 0, każde na **innym** heksie granicznym, pułap `ceil(pop/10)` na miasto,
  start dopiero po `pop` ulepszeniach plonowych miasta (bez tej zwłoki obrona zabierała
  turę 0 heksowi z rzeką — priorytet rzeki z rundy 2 zostaje nietknięty).
- Rozkład kategorii AI CYWILIZACJI **niezdegenerowany**: 328/131/69, infra ≠ 0.
- AI GRACZA, profil `Infrastruktura`: **236 → 98 ulepszeń** (posterunek 95→10, fort 93→10,
  drogi 48→78), plon bez zmian 2495. Profil `Zrównoważona`: 276 → 302, plon 2679 → **2772**,
  tartak 35 → 45. Profile `Żywność`/`Surowce` bez zmian. Podobieństwo `Zrównoważona` ↔
  AI CYWILIZACJI (kosinus): 0,9941 → 0,9618.
- `maxItemsPerCity: 1` AI CYWILIZACJI i `ai.ts` — **nietknięte** (asercja D, dwa sposoby).

## TESTY (własną ręką, worktree `/home/user/wt-op-ai3/gra`, każde wywołanie w `timeout`)

`tsc --noEmit` **0** · logic **213/213** · tech-tree **19/0** · research **33/33** ·
unit-replace **13/13** · combat **6/6** · auto-improvements **45/0** ·
map-improvement-qualify **112/0** · oboz-lowiecki-las **91/0** · oboz-lowiecki-evaluator-probe
**88/0** · oboz-lowiecki-fc-balans **5/0** · oboz-lowiecki-fc-r2-nowa-sciezka **22/0** ·
ai-improvements **52/0** · ai-jednostki-tylko-zakup **44/0**.
Bramka tematu `ai2-heks-po-heksie-test` **34/0** (było 16/0).
`ai-praca-split-parity-test`: **21/1 na bazie `main` `470c5bb5`** (moja ręka) i **21/1 na tej
gałęzi** — regres zastany, NIE pogorszony, NIE zielony (§13a).
Build C-001: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-airzeki-r3-operator
--emptyOutDir` → exit 0, `index.html` 37 417,94 kB, 22,81 s.

**Dowód nietautologiczności — sześć mutacji, każda uruchomiona:**

| mutacja | wynik |
|---|---|
| M0: całe źródło rundy 2 (`AI2_SRC_DIR=3e84fbc8`) | **22/10** — czerwienieją G, H, I, J, L |
| M5: `posterunek`/`fort` z powrotem w sekwencji domykania | **26/6** — czerwienieje całe H |
| M6: `droga` dopisana do `ZERO_YIELD_IMPROVEMENTS` | **30/3** — czerwienieje G (dane ≠ stała) |
| M7: `wyrabWlaczony = false` | **28/4** — czerwienieją I, J, L |
| M8: FAZA 0 (obrona) wyłączona | **29/3** — czerwienieją H i K |
| M9: zdjęte minimum leśne miasta | **30/2** — czerwienieją E (runda 2) i minimum leśne |

Po przywróceniu źródła: **34/0**.

## ZMIANY/COMMIT

`gra/src/game/auto-improvements.ts` (jedyny dotknięty plik gry) ·
`gra/tools/{ai2-heks-po-heksie-test,ai2-sciezki-rozdzielone-measure}.cjs` · raporty i logi runu.
Commity: `80d45068` (W-B + wyrąb) · `eca8d316` (FAZA 0 doszlifowana + bramka 32/0) ·
kolejny (utwardzenie bramki + log wariantów) · ten raport.
Zero zmian w `gra/src/game/ai.ts`, `gra/src/main.ts`, `gra/data/**`,
`gra/src/map/improvement-build.ts`, `gra/src/ui/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`.
`git diff --check` czysty. Allowlista rundy 3 dotrzymana.

## BLOKADY

1. **Kryterium 1 NIESPEŁNIONE** — odzysk 42,2 % zamiast większości. Nie naciągam.
   Decyzja właściciela: czy przyciąć ulepszenia nieżywnościowe (`warzelnia_soli` 69,
   drogi 49, `glinianka` 27) kosztem wymogu „równomiernie" z rundy 2.
2. **Liczba dobrana przeze mnie**: `JEDEN_NA_ILU_OBYWATELI = 10` (pułap obrony i minimum
   leśne). Wzięta z własnego ECHO właściciela („jeden tartak i obóz na dziesięć obywateli"),
   ale rozszerzona na `posterunek`/`fort` — punkt do potwierdzenia.
3. **Cena decyzji „wycinać mimo to"**, zmierzona: `tartak` 69 → 22, `oboz_lowiecki` 71 → 23,
   drewno terytorium 2785 → 2065. Świadoma, nie podważam — odnotowuję.
4. **AI GRACZA, profil `Infrastruktura`**: 236 → 98 ulepszeń. Automat robi wyraźnie mniej
   przy jawnym wyborze gracza — do świadomej decyzji.
5. **BRAK DOWODU** — ścieżka AI GRACZA nadal mierzona odtworzoną konfiguracją, nie
   wykonaniem `main.ts` (closure `boot()`). Dług dowodowy z rundy 2, nietknięty.
6. Zastany regres `ai-praca-split-parity-test` 21/1 na `main` — nie mój, nie pogorszony.
7. Do rejestru (§14, NIE naprawiam): `kopalnia_zlota` poza `AI_IMPROVEMENT_PRIORITY`;
   `ULEPSZENIA_FOCUS_ZROWNOWAZONE` to ta sama stała co `AI_IMPROVEMENT_PRIORITY`.

## NASTĘPNY KROK

Evaluator rundy 3 (worktree `/home/user/wt-op-ai3` zostawiony, gałąź wypchnięta).
