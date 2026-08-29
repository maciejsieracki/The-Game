# 01 — OPERATOR (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1`
GOAL: Główna cywilizacja AI, która awansuje do epoki Żelaza (i nie jest już w żadnej wojnie),
force-wypowiada wojnę jednemu sąsiadowi terytorialnemu — dokładnie tym samym mechanizmem co
Brąz (`forced-war-bronze.ts` jako wzór 1:1), tylko dla epoki 3 zamiast 2. Miasta-państwa
i gracz wyłączone identycznie jak w Kamieniu/Brązie.
MODEL+EFFORT: **Opus 5, effort high** (Operator).
RUNDY: 1/5 · DEPLOY/PUSH: **NIE WYKONANO** (push wyłącznie gałęzi tematu)

---

## 0. Odpowiedź w jednym akapicie

Mechanizm wymuszonej wojny epoki **Żelaza** istnieje i **działa w prawdziwej pętli tury**:
w 3 ziarnach (111/222/333) po wejściu głównych cywilizacji AI do epoki 3 **wszystkie 6**
trafia do `ironForceWarPendingOwners`, a w NASTĘPNEJ turze **3–5 z nich faktycznie wypowiada
wojnę najbliższemu sąsiadowi terytorialnemu** (razem 12 wypowiedzeń w 3 przebiegach; reszta
to cywilizacje, które w tej samej turze stały się OBROŃCAMI, więc — zgodnie z regułą Brązu —
zachowują `pending` i ponawiają próbę: ziarno 333, AI36 wypowiada w turze 10, nie 9). Ten sam
harness, to samo ziarno, ten sam scenariusz na **`origin/main` (PRZED)** daje **0 wypowiedzeń
i pusty `ironPending`** — mechanizmu tam po prostu nie ma. **Gracz (ownerId 0) i miasta-państwa
ani razu nie pojawiły się w puli kandydatów (12 rekordów puli, unia = dokładnie 6 głównych AI),
ani jako cel, ani jako napastnik** — zero naruszeń kryterium 5. Bramka Żelaza to 46 asercji
kontraktu czystego + 29 asercji wiązania `main.ts`/`ai.ts`; sonda mutacyjna (62 celowane
mutacje źródła) czerwieni **46/46 i 29/29** — żadna asercja nie jest tautologiczna.
**NOTA (§13a, nie mój zakres):** w **niezmodyfikowanej** grze mechanizm Żelaza — tak samo jak
istniejące mechanizmy Kamienia i Brązu — **nie odpala w ogóle**, bo blokują go dwie
udokumentowane, niezależne od tego tematu wady (Z1 i Z5 z audytu
`P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`); zmierzyłem to osobnym przebiegiem i podaję liczby w §5.

---

## 1. Co zostało zrobione (kryteria 1–3)

| # | kryterium | realizacja |
|---|---|---|
| 1 | nowy `gra/src/game/forced-war-iron.ts` | 12 eksportów, wszystkie funkcje czyste (bez DOM/mutacji), rdzeń współdzielony z Kamieniem/Brązem przez `forced-war-common.ts` (zero duplikacji, zero zmiany zachowania tamtych) |
| 2 | wpięcie w `main.ts` | 8 punktów, 1:1 wzorem Brązu: 4 rejestry stanu, wyzwalacz w `syncOwnerEraFromResearch`, wybór celu w pętli dyplomacji, konsumpcja `pending` przy sukcesie DOW, licznik miast z OBU funnel-i przejęcia miasta, `cleanupIronForcedWarOnPeace` w `finalizePeaceTreatyBetween`, save/load, sprzątanie przy eliminacji i przy nowej grze |
| 3 | wpięcie w `ai.ts` | `ironForceWarTargetId` + kolejny **wczesny `return`** przed ogólnymi regułami wojny, z pełnym zestawem guardów (`stanWojny`/`peaceLocked`/`hasNapTreaty`/`hasAllianceTreaty`) — dokładnie jak Kamień i Brąz |

### Parametry (dispatch §PARAMETR — nie zgadywane)

```
EPOKA_ZELAZO_NUMER                                      = 3   (KOLEJNOSC_EPOK: Kamien/Braz/Zelazo)
WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE  = 2   (jak Brąz/Kamień)
WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR                   = 20  (jak Brąz/Kamień)
WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR = 20  (jak Brąz/Kamień)
```

Wyzwalacz = **awans epoki**, nie próg tury (uzasadnienie dispatchu: do Żelaza cywilizacje
docierają w bardzo różnych turach). Nie znalazłem żadnej przesłanki, żeby któraś z trzech
pozostałych wartości miała być dla Żelaza inna niż dla Brązu — nie wpisałem własnej liczby.

### Jedna świadoma różnica względem dosłownej kopii Brązu (do werdyktu Evaluatora)

Brąz wykrywa awans sztywnym `prev === 1 && next === 2`. Dla Żelaza użyłem funkcji
`isIronEraEntry(prev, next) === (prev < 3 && next >= 3)`, bo
`computeMainCivEraFromResearch` (`owner-epoch.ts:112`) awansuje **pętlą `while`** — jedna
synchronizacja może przenieść cywilizację o więcej niż jedną epokę i sztywna równość
zgubiłaby wtedy wyzwalacz. Warunek jest **ścisłym nadzbiorem** `2→3` i nie może odpalić
fałszywie (epoka nigdy nie maleje). Mechanizmu Brązu **nie ruszałem** (patrz §6, diff
0 usunięć).

Drugi drobiazg: dodałem czyszczenie rejestrów Żelaza przy starcie nowej gry (Kamień to ma,
Brąz **nie** — to prawdopodobnie luka Brązu, ale poza moim zakresem, więc jej nie tykałem;
zgłaszam jako obserwację).

---

## 2. Pomiar PRZED/PO w rozgrywce (kryterium 4)

### Metoda

| element | wartość |
|---|---|
| ścieżka pomiaru | **prawdziwa pętla tury** — `doStartGame(params)` (ta sama funkcja, którą woła kreator nowej gry) + `triggerPlayerEndTurn()` w żywym Chromium na artefakcie `vite build` |
| instrumentacja | wstrzykiwana **w pamięci** (`gra/tools/wojny-zelazo-audyt.vite.config.ts`, wzór z audytu Kamienia); **pliki `gra/src/**` nietknięte** — brak kotwicy = twardy błąd buildu |
| PRZED | osobny worktree na **`origin/main`** (brak mechanizmu Żelaza), ten sam harness, te same ziarna, ten sam scenariusz |
| ziarna | **111, 222, 333** |
| tur na ziarno | 12 (akcelerator w turze 8) |
| parametry menu | domyślne kreatora: Normalny · Standardowy · Kontynenty · epoka Kamienia · tempo Standardowe · 7 typów cywilizacji · 6 miast-państw · barbarzyńcy „normalny" |

**Akcelerator czasu (jawnie, bo to nie jest naturalny przebieg).** Naturalne dojście do epoki
Żelaza jest poza zasięgiem pomiaru: awans wymaga **wszystkich** technologii epoki + własnego
cudu E epoki (`computeMainCivEraFromResearch`), a w referencyjnym audycie Kamienia po **60
turach** wszystkie 6 głównych AI było **wciąż w epoce 1** (`P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`,
`pomiar-seed-111.json`); przy ~37 s/turę pomiar do epoki 3 to wiele godzin na ziarno.
Dlatego w turze 8 wołam hak `advanceMajorAiToIron()`, który podnosi **wyłącznie
`ownerStartEraByOwner`** głównych cywilizacji AI do 3 i wywołuje **prawdziwy**
`reconcileAllOwnerErasFromResearch()`. **Wszystko dalej — wykrycie wejścia do Żelaza
(`isIronEraEntry`), wpis do `ironForceWarPendingOwners`, budowa puli kandydatów, wybór celu,
komenda `wypowiedz_wojne`, filtry `main.ts` i zapis stanu — idzie NIEZMIENIONYM kodem gry.**
To akcelerator czasu, nie obejście mechanizmu. **BRAK DOWODU (§13a): nie zmierzyłem przebiegu,
w którym cywilizacja dochodzi do Żelaza własnym badaniem — to pomiar wielogodzinny.**

### Wyniki

| przebieg | ziarno | akcelerator | `ironPending` po awansie | wypowiedzenia wymuszonej wojny Żelaza | wojny na koniec |
|---|---|---|---|---|---|
| **PO** | 111 | T8, owners 1,8,15,22,29,36 | `[1,8,15,22,29,36]` | **3**: T9 AI1→AI15, T9 AI8→AI36, T9 AI22→AI29 | `1x15, 8x36, 22x29` |
| **PO** | 222 | T8, ci sami | `[1,8,15,22,29,36]` | **4**: T9 AI1→AI8, T9 AI15→AI36, T9 AI22→AI8, T9 AI29→AI15 | `1x8, 8x22, 15x29, 15x36` |
| **PO** | 333 | T8, ci sami | `[1,8,15,22,29,36]` | **5**: T9 AI1→AI8, T9 AI15→AI1, T9 AI22→AI8, T9 AI29→AI8, **T10 AI36→AI15** | `1x8, 1x15, 8x22, 8x29, 15x36` |
| **PRZED** (`origin/main`) | 111 | T8, ci sami | **`[]`** | **0** | **`[]`** |
| **PRZED** (`origin/main`) | 222 | T8, ci sami | **`[]`** | **0** | **`[]`** |
| **PRZED** (`origin/main`) | 333 | T8, ci sami | **`[]`** | **0** | **`[]`** |

Wszystkie 12 wypowiedzeń PO mają `epokaNapastnika = 3` i `epokaCelu = 3`. Konsola gry
(rejestrowana z żywej przeglądarki) niesie w PO 6/8/10 linii
`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA: AI<x> wypowiada wymuszoną wojnę sąsiadowi AI<y>` + odpowiadające
im `AI<x> wypowiada wojne AI<y>: R-EPOKA-ZELAZO-WYMUSZONA-WOJNA: … (tura N)`; w PRZED — **0 linii**.
W żadnym przebiegu (PRZED ani PO) nie padła ani jedna wymuszona wojna **Kamienia/Brązu** — bo
akcelerator przenosi epokę 1→3, a wyzwalacz Brązu wymaga dokładnie `1→2`; to zarazem dowód,
że liczby PO pochodzą z mechanizmu **Żelaza**, a nie z któregoś z dwóch istniejących.

**Zachowanie „pending zostaje i próba się ponawia"** (poprawka B4 przeniesiona z Brązu) jest
widoczne wprost: w każdym ziarnie część cywilizacji zostaje w tej samej turze OBROŃCAMI
(`alreadyAtWarAnyRole`), więc nie wypowiadają wojny — a w ziarnie 333 AI36 robi to turę
później. **BRAK DOWODU:** 12 tur nie wystarczyło, żeby którakolwiek para zdobyła 2 miasta,
więc **auto-pokoju po progu miast, odpoczynku 20 tur i cooldownu 20 tur NIE zmierzyłem
w rozgrywce** — mam na nie tylko dowód jednostkowy (kontrakt czysty + bramka tekstowa
wiązania), co zgodnie z §13a **nie jest dowodem zachowania w rozgrywce**.

---

## 3. Miasta-państwa i gracz nigdy nie są celem ani napastnikiem (kryterium 5)

Rejestrator zapisuje **całą pulę kandydatów** wraz z `aiOwnerList` w chwili wyboru celu oraz
klasyfikację `isOwnerClusterCityState` dla obu stron każdego faktycznego wypowiedzenia.

- 3 ziarna PO, **12 rekordów puli kandydatów**; `aiOwnerList` w każdym z nich ma **42 ownerów**
  (6 głównych AI + 6 kopii typu 43–48 + 30 miast-państw klastra).
- **Unia wszystkich kandydatów przez 3 ziarna: `[1, 8, 15, 22, 29, 36]`** — dokładnie 6 głównych
  cywilizacji AI. Ani razu `0` (gracz), ani razu żadne miasto-państwo, ani razu kopia typu.
- **Unia ownerów, dla których pula w ogóle była liczona (kandydaci na napastnika): `[1, 8, 15, 22, 29, 36]`.**
- **Unia napastników faktycznych wypowiedzeń: `[1, 8, 15, 22, 29, 36]`; unia celów: `[1, 8, 15, 29, 36]`.**
- Automatyczny audyt naruszeń (`wojny-zelazo-analiza.cjs`) sprawdza 6 osobnych warunków
  (gracz w puli, gracz jako napastnik, DOW na gracza, miasto-państwo jako cel, miasto-państwo
  jako napastnik, napastnik poza epoką Żelaza) — **`naruszeniaKryterium5: []` we wszystkich
  7 przebiegach** (3× PO, 3× PRZED, 1× STOCK).

Mechanicznie odpowiada za to ta sama para filtrów co w Kamieniu/Brązie: napastnik przechodzi
przez `ownerId > 0 && !typCityCopyOwners.has && !isBarbarian && !eliminatedOwners.has &&
!isOwnerClusterCityState(ownerId, …)`, a pula celów przez `oid > 0 && …
!isOwnerClusterCityState(oid, …)` (gracz to `ownerId 0`, więc w ogóle nie trafia do
`aiOwnerList`-owej puli).

---

## 4. Dowód nietautologiczny nowych asercji (kryterium 6)

`gra/tools/forced-war-iron-mutant-probe.cjs` — **62 celowane mutacje** źródła
(`forced-war-iron.ts`, `ai.ts`, `main.ts`), każda jednopunktowa, każda z kotwicą, która musi
być **znaleziona i jednoznaczna** (inaczej twardy błąd sondy). Dla każdej mutacji sonda
uruchamia bramki i zbiera etykiety asercji, które spadły na FAIL, po czym **przywraca plik**
i na końcu weryfikuje bajt w bajt, że źródła wróciły do stanu wyjściowego.

```
kontrakt czysty:  46/46 asercji zaczerwienionych
bramka main/ai:   29/29 asercji zaczerwienionych
mutacji bez ANI JEDNEJ zaczerwienionej asercji: 0 z 62
Źródła przywrócone bajt w bajt.   (exit 0)
```

Przykłady (pełna lista: `dowody/sonda-mutacyjna.txt`):

| mutacja | co robi | co się czerwieni |
|---|---|---|
| `M05` | wyzwalacz sztywno `prev===2 && next===3` | „skok Kamień(1) → Żelazo(3) też wyzwala" |
| `M06` | wyzwalacz ignoruje `prevEra` | „3→3 / 3→4 NIE wyzwala ponownie" |
| `M11` | `blockedOwnerIds` ignorowane przy wyborze celu | 3 asercje wykluczeń NAP/pokój/sojusz |
| `M26` | cały wczesny `return` Żelaza wyłączony w `ai.ts` | DOW nie powstaje + „guard stoi przed ogólnymi regułami" |
| `M34` | brak relacji z celem podmieniony na pierwszą relację | **„`ironForceWarTargetId=0` nie produkuje DOW wobec gracza"** |
| `M38` | wyzwalacz awansu podmieniony na próg tury | „wyzwalacz NIE jest progiem tury" (dokładnie to, czego zakazuje dispatch) |
| `M42` | `oid > 0` usunięte z puli kandydatów | „pula wyklucza gracza" |
| `M51` | hak licznika usunięty z kapitulacji głodowej | „siege surrender funnel rozlicza Żelazo" |
| `M35`/`M36`/`M57` | REGRESJA: wyłączony guard/import Brązu lub Kamienia | asercje „bez regresji dwóch istniejących epok" |

Świadomie **usunąłem** z bramki Żelaza meta-asercję typu „usunięcie haka jest wykrywalne",
którą niesie bramka Kamienia — jest tautologiczna (`replace(hook,'').includes(hook)` jest
fałszem z definicji) i nie da się jej zaczerwienić żadną mutacją źródła.

---

## 5. NOTA §13a — w niezmodyfikowanej grze mechanizm dziś NIE odpala (nie mój zakres)

Przebieg **STOCK** (mój kod, ziarno 111, ten sam akcelerator, ale **bez** obu odblokowań
środowiska) daje twarde liczby:

```
majorzy (1,8,15,22,29,36) po turze 8:  30 rekordów
  epoch >= 3 (Żelazo):                 24
  isOwnerClusterCityState === true:    30 / 30      <-- Z1
  dipLayer:                            pre_contact 30 / 30   <-- Z5
  ironForceWarPendingOwners:           []           (wyzwalacz nie odpalił)
  wypowiedzenia wymuszonej wojny:      0
```

Dla porównania ten sam moment w przebiegu PO: `isCityState 0/30`, `dipLayer full 30/30`.

Dwie blokady, obie **udokumentowane wcześniej** w audycie `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`,
obie **wspólne dla Kamienia, Brązu i Żelaza**, obie **poza allowlistą tego tematu**:

- **Z1** — `isOwnerClusterCityState` (`display-names.ts:57`) zwraca `true` dla każdej głównej
  cywilizacji, która przejęła miasto byłego miasta-państwa (znacznik `startCityState` nie jest
  kasowany przy przejęciu). W efekcie wyzwalacz i pula celów są puste. *(Równolegle biegnie
  temat „flaga miasta-państwa" — prawdopodobnie dokładnie o tym.)*
- **Z5** — `filterDiplomacyCommandsForLayer` (`diplomacy-layers.ts:265`) zwraca pustą listę dla
  `dipLayer === 'pre_contact'`, czyli kasuje **wszystkie** komendy AI, w tym `wypowiedz_wojne`
  wobec innego AI, dopóki **gracz** nie odkryje tej cywilizacji.

Żeby zmierzyć MÓJ mechanizm, wyłączyłem obie blokady **wyłącznie w pamięci buildu
pomiarowego** (`ZELAZO_SCEN_CS=1`, `ZELAZO_SCEN_LAYER=1`), jawnie i osobno raportując przebieg
bez nich. **Nie zmieniałem ani jednej linii kodu tych dwóch mechanizmów w repo.**

**Wniosek dla właściciela:** kod Żelaza jest gotowy i sprawdzony, ale samo dołożenie trzeciej
epoki **nie sprawi**, że w normalnej grze zobaczy Pan wojny między cywilizacjami — dopóki Z1
i Z5 żyją, milczą wszystkie trzy epoki. To osobne, otwarte wątki.

---

## 6. Zero regresji istniejących dwóch epok

```
git diff --numstat -- gra/src
  38   0   gra/src/game/ai.ts       (0 usunięć)
  244  0   gra/src/main.ts          (0 usunięć)
git diff --check                    -> czysto
```

Wszystkie zmiany w `main.ts`/`ai.ts` to **wyłącznie dopisy** obok istniejących bloków Kamienia
i Brązu — ani jedna linia tamtych mechanizmów nie została usunięta ani zmieniona. Rejestry
Żelaza są rozłączne (4 osobne struktury, osobny moduł, osobne stałe, osobne pola w `meta`).

---

## 7. TESTY (dokładne wyniki)

Wszystko uruchamiane własnoręcznie z `gra/`, w izolowanym worktree
`/home/user/wt-op-zelazo-wojna` (gałąź `autobot/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1`).

| bramka | wynik |
|---|---|
| `node tools/logic-test.cjs` | **LOGIC OK (213/213)** |
| `node tools/tech-tree-test.cjs` | **19 pass, 0 fail** |
| `node tools/research-test.cjs` | **33/33, ALL GREEN** |
| `node tools/unit-replace-test.cjs` | **13/13** |
| `node tools/combat-test.cjs` | **6/6** |
| `node tools/forced-war-stone-test.cjs` | **32/32** (bez pogorszenia) |
| `node tools/forced-war-stone-main-guard-test.cjs` | **18 PASS, 0 FAIL** (bez pogorszenia) |
| `node tools/forced-war-bronze-test.cjs` | **44/44, ALL GREEN** (bez pogorszenia) |
| `node tools/forced-war-bronze-main-guard-test.cjs` | **25 PASS, 0 FAIL** (bez pogorszenia) |
| `node tools/forced-war-iron-test.cjs` (**nowa**) | **46/46** |
| `node tools/forced-war-iron-main-guard-test.cjs` (**nowa**) | **29 PASS, 0 FAIL** |
| `node tools/forced-war-iron-mutant-probe.cjs` (**nowa**) | **46/46 + 29/29 pokrycia, 62 mutacje, exit 0** |
| `node ./node_modules/typescript/bin/tsc --noEmit` | **0 błędów** |
| `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-zelazo-wojna-op --emptyOutDir` | **✓ built in 23.96s**, 37 422 kB |

Build instrumentowany (pomiar): `--config tools/wojny-zelazo-audyt.vite.config.ts --outDir
/tmp/civ-dist-zelazo-wojna-op-audyt` — `instrumentacja OK` (wszystkie kotwice znalezione).

---

## 8. Dowody

`dyspozycje/autobot/runs/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1/dowody/`

- `PO-seed-{111,222,333}.json` — pełne zrzuty pomiaru PO (snapshoty per tura, rekordy per
  owner/tura, pule kandydatów, wypowiedzenia, konsola gry)
- `PRZED-seed-{111,222,333}.json` — to samo z `origin/main` (bez mechanizmu)
- `STOCK-seed-111.json` — przebieg bez odblokowań Z1/Z5 (nota §13a)
- `summary.json`, `analiza-pomiaru.txt` — redukcja do liczb
- `sonda-mutacyjna.txt` — pełne wyjście sondy mutacyjnej (62 mutacje + pokrycie)

---

## KONTRAKT RAPORTU

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1
GOAL: wymuszona wojna epoki Żelaza (3. epoka) wzorem Brązu — wyzwalacz = awans do Żelaza,
      2 miasta / 20 tur odpoczynku / 20 tur cooldownu, miasta-państwa i gracz wyłączeni
ZMIANY/COMMIT: gra/src/game/forced-war-iron.ts (nowy), gra/src/game/ai.ts, gra/src/main.ts,
      gra/tools/forced-war-iron-test.cjs, gra/tools/forced-war-iron-main-guard-test.cjs,
      gra/tools/forced-war-iron-mutant-probe.cjs, gra/tools/wojny-zelazo-audyt.vite.config.ts,
      gra/tools/wojny-zelazo-audyt.cjs, gra/tools/wojny-zelazo-analiza.cjs,
      dyspozycje/autobot/runs/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1/** (raport + dowody)
TESTY: logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 · combat 6/6 ·
      forced-war-stone 32/32 + main-guard 18/0 · forced-war-bronze 44/44 + main-guard 25/0 ·
      forced-war-iron 46/46 + main-guard 29/0 · sonda mutacyjna 46/46 i 29/29 (62 mutacje) ·
      tsc --noEmit 0 błędów · vite build OK ·
      pomiar w żywym Chromium 3 ziarna PRZED/PO: PRZED 0 wypowiedzeń, PO 12 wypowiedzeń
      (3+4+5), 0 naruszeń kryterium „gracz/miasto-państwo nigdy stroną"
BLOKADY: brak blokad tematu. NOTY: (a) auto-pokój po 2 miastach, odpoczynek i cooldown NIE
      zmierzone w rozgrywce (12 tur to za mało na 2 przejęcia miast) — BRAK DOWODU wg §13a,
      pokryte tylko jednostkowo; (b) naturalne dojście do epoki Żelaza badaniami jest poza
      zasięgiem pomiaru (60 tur = wciąż epoka 1) — użyłem akceleratora epoki w buildzie
      pomiarowym, jawnie opisanego w §2; (c) w NIEZMODYFIKOWANEJ grze mechanizm Żelaza (jak
      i Kamienia/Brązu) nie odpala w ogóle z powodu Z1 (`isOwnerClusterCityState` po przejęciu
      miasta-państwa) i Z5 (`pre_contact` kasuje komendy AI↔AI) — obie poza allowlistą, obie
      zmierzone w §5; (d) wyzwalacz użyto w formie `prev < 3 && next >= 3` zamiast sztywnego
      `2→3` (uzasadnienie w §1) — do werdyktu Evaluatora; (e) obserwacja poza zakresem: Brąz
      nie czyści swoich rejestrów przy starcie nowej gry (Kamień czyści; Żelazo czyści).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5, effort high)
DEPLOY/PUSH: NIE WYKONANO (wypchnięta wyłącznie gałąź tematu
      `autobot/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1`; brak pushu do main, brak integracji,
      brak deployu)
```
