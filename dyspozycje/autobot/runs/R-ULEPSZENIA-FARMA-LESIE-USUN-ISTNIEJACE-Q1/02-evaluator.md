# 02 — EVALUATOR (runda 1)

TEMAT: R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1
ROLA: Evaluator, runda 1/5
DATA: 2026-08-27
WORKTREE: `/home/user/wt-ev-farma-legacy` (galaz `autobot/R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1`)
OCENIANY COMMIT: `cc98a78bbe200b39475b63fc7372ef5348911c86`
`origin/main` w chwili oceny: `9015380baeab2f950f83faee8749848624d0118a` (= merge-base; brak dryfu,
rebase niepotrzebny)

---

## 1. FILTR ODWROTNY ALLOWLISTY

`git -c core.quotePath=false diff --name-status 9015380b HEAD`:

```
A  dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1/01-operator.md
M  gra/src/game/save.ts
M  gra/src/main.ts
M  gra/src/map/improvement-build.ts
A  gra/tools/farma-lesie-usun-istniejace-test.cjs
M  gra/tools/farma-nie-w-lesie-test.cjs
```

Szesc plikow, **kazdy w allowliscie**, nic poza nia. W szczegolnosci NIETKNIETE:
`gra/data/terrain-improvements.json`, `isFarmBaseTerrain`, `dyspozycje/WERSJE.md`.
`git diff --check` czysty. Zmiana w `main.ts` to +63 linii w trzech punktach (import, definicja
funkcji + wywolanie w `restorePlacedImprovementsFromSave`, wywolanie po `turn++`) — punktowa,
zgodnie z wymogiem wspolbieznosci z dispatchu.

Zmiana w bramce sasiedniego tematu `farma-nie-w-lesie-test.cjs` sprawdzona linia po linii:
**wylacznie komentarze i dwa opisy asercji**; zero zmian w logice, zero asercji dodanych lub
usunietych, zero zmian w wywolywanych funkcjach. Wynik nadal 136/0.

---

## 2. METODA WLASNA (nie bramka Operatora)

Napisalem od zera wlasna sonde (`probe.cjs` + wlasny entry esbuild) bundlujaca ZE ZRODLA:
`generateMap`, `removeLegacyFarmsOnForest`, `planLegacyFarmOnForestRemoval`,
`serializeMapForSave`/`buildGameMapFromSnapshot`, `serializeGame`/`deserializeGame`/
`migrateLegacyFarmsOnForestInSave`, `hexToWorkedTile`/`tileYield`, `improvementKeysForHex`.

Roznice wzgledem bramki Operatora, celowe:
- **Inne ziarna**: 11, 123, 2024, 5150 (Operator uzyl 42, 4242, 777, 90210).
- **Wlasne liczenie** farm — funkcja `countFarms` czyta pola heksa i rejestr BEZPOSREDNIO, nie
  korzysta z zadnej funkcji tematu (nie jest tautologia wzgledem `planLegacyFarmOnForestRemoval`).
- **Adwersarialny zasiew**: farma na KAZDYM heksie z `Nakladka.Las` (superset starej reguly),
  co piaty heks dodatkowo z `tartak`, co drugi zapisany TAKZE w `placedImprovements`, reszta
  **wylacznie w polach heksa** — to celowo lamie zalozenie „rejestr = zrodlo prawdy".
- **Wlasna replika** `main.ts::syncHexUlepszenieFields` w callbacku, zeby zmierzyc stan koncowy
  heksa, a nie tylko raport funkcji.

Wynik sondy: **132 OK / 0 FAIL**.

---

## 3. SIEDEM KRYTERIOW — KAZDE NIEZALEZNIE

### Kryterium 1a — wczytanie zapisu (`save.ts`)

Pelny round-trip bez repliki: `generateMap` -> zasiew starej reguly -> `serializeMapForSave` ->
`serializeGame` -> `deserializeGame` -> `buildGameMapFromSnapshot` + `new Map(meta.placedImprovements)`.

| ziarno | farmy na lesie PRZED | PO wczytaniu | farmy na otwartym PRZED/PO | heksy z Las PRZED/PO |
|---|---|---|---|---|
| 11   | 150 | **0** | 93 / 93   | 150 / 150 |
| 123  | 156 | **0** | 75 / 75   | 156 / 156 |
| 2024 | 143 | **0** | 101 / 101 | 143 / 143 |
| 5150 | 142 | **0** | 95 / 95   | 142 / 142 |

Dodatkowo na kazdym ziarnie: `meta.placedImprovements` po wczytaniu bez farm na lesie (0),
`improvementKeysForHex` nie widzi farmy na ZADNYM heksie z lasem (0 — czyli plony tez czyste),
tartak na lesie przetrwal round-trip w komplecie (30/31/28/28). **ZALICZONE.**

### Kryterium 1b — trwajaca partia bez przeladowania (punkt wskazany przez dispatch)

Sprawdzone najostrzej, bo dispatch to oznaczyl. Ustalenia strukturalne z `main.ts`:

- `sweepLegacyFarmsOnForest` wystepuje **dokladnie 3 razy**: definicja (12051) + dwa wywolania
  (12027, 25650). Import `removeLegacyFarmsOnForest`: 716 (import), 12039 (typ/wywolanie), 12052.
- `turn++` jest w linii 25636, sprzatanie w 25650 — **po inkrementacji tury**.
- `doRotatingAutosave()` jest w 25668 — sprzatanie stoi **PRZED autozapisem**, wiec pierwszy
  zapis po wejsciu zmiany utrwala juz czysty stan. Potwierdzone odczytem sekwencji EOT.
- Blok „Per-turn economy tick / Ekonomia imperium" jest **nizej** w tej samej sekwencji EOT
  (ok. 25690+) — czyli ekonomia nowej tury liczy sie juz z posprzatanego heksa. To dokladnie
  realizuje kryterium 2 („miasto traci zywnosc od kolejnej tury").
- Deklaracja funkcji (12051) a uzycie (25650) — oba wewnatrz `boot()` (start 1310); hoisting
  deklaracji funkcji + zielony `tsc --noEmit` domykaja poprawnosc zakresu.

Zachowanie samego sprzatania zywego stanu zmierzone przez sonde (nie strukturalnie):

| ziarno | PRZED na lesie | PO | removed | scanned | farmy otwarty PRZED/PO | Las PRZED/PO |
|---|---|---|---|---|---|---|
| 11   | 150 | **0** | 150 | 1008/1008 | 93 / 93   | 150 / 150 |
| 123  | 156 | **0** | 156 | 1008/1008 | 75 / 75   | 156 / 156 |
| 2024 | 143 | **0** | 143 | 1008/1008 | 101 / 101 | 143 / 143 |
| 5150 | 142 | **0** | 142 | 1008/1008 | 95 / 95   | 142 / 142 |

`scanned` rowne pelnej liczbie heksow mapy na kazdym ziarnie — pomiar jest istotny, nie badal
podzbioru. Callback wolany dokladnie tyle razy, ile heksow zmieniono. Zero martwych
`hex.ulepszenie === Ulepszenie.Farma` na lesie po przebiegu (czyli legacy pole tez czyste — to
jest realna pulapka, bo `syncHexUlepszenieFields` samo by go nie wyczyscilo dla heksa, na ktorym
zostaje `tartak`; Operator ja zamknal jawnym czyszczeniem przed synchronizacja i to dziala).

**ZALICZONE.** Wybor punktu (granica tury) jest uzasadniony i jawny w kodzie, zgodnie z
dispatchem, ktory zostawial wybor Operatorowi.

**Osobno zmierzylem koszt** (Operator tego nie zmierzyl, §13a): mapa 168x120 = **20160 heksow**,
1037 realnych ulepszen w rejestrze, przebieg „nic do usuniecia" (stan ustabilizowany):
**mediana 4,58 ms** (min 4,19 / max 7,58, 12 powtorzen). Raz na ture, w sekwencji EOT, ktora i
tak ma `await yieldTurnTransitionUi()`. Koszt bez znaczenia. To pomiar w Node, nie FPS w
przegladarce — patrz §5.

### Kryterium 1c — nowa partia

Pomiar, nie zalozenie: tuz po `generateMap(36,28,seed,'kontynenty')`, przed jakimkolwiek
zasiewem — farmy na lesie **0 / 0 / 0 / 0** na czterech ziarnach, przy jednoczesnym potwierdzeniu,
ze mapa MA lasy (150 / 156 / 143 / 142) — bez tego pomiar bylby pusty.
Dodatkowo sprawdzilem, ze sciezki „nowa gra" i scenariusze-presety w `main.ts` (cztery miejsca
z `placedImprovements.clear()`: 30761, 31025, 31276, 31504) tylko czyszcza rejestr, a
`applyClusterStartPlan` / `cluster-start.ts` / `cluster-spawn.ts` / `clusters.ts` nie zawieraja
ANI JEDNEGO odwolania do `farma`/`ulepszen`/`improvement` — plan startowy nie stawia ulepszen.
**ZALICZONE.**

### Kryterium 2 — skutek usuniecia zdefiniowany jawnie

Realnymi funkcjami ekonomii (`hexToWorkedTile` -> `tileYield`), na heksie „las + sama farma":

| ziarno | heks | zywnosc PRZED | PO | goly las (odniesienie) |
|---|---|---|---|---|
| 11   | 8,4  | 5 | 2 | 2 |
| 123  | 17,3 | 3 | 0 | 0 |
| 2024 | 6,4  | 5 | 2 | 2 |
| 5150 | 6,4  | 5 | 2 | 2 |

Spadek = **3 = `FARMA_POTENTIAL_FOOD_BONUS`** na kazdym ziarnie, a plon PO jest **identyczny** z
plonem golego lasu tego samego heksa (heks wraca do stanu „las, bez ulepszenia", a nie do
jakiegos trzeciego stanu). Praca: raport `LegacyFarmOnForestReport` nie ma pola `praca`,
`workReturned` ani `zwrot` — sprawdzone asercja na ksztalcie obiektu; zwrotu pracy nie ma gdzie
zaczepic. Las zostaje: liczba heksow z `Nakladka.Las` identyczna przed i po na wszystkich
ziarnach i na obu sciezkach. **ZALICZONE.**

### Kryterium 3 — pomiar PRZED/PO na >= 3 ziarnach, naprawa nie za szeroka

Cztery ziarna, dwie niezalezne sciezki — tabele wyzej. „Nie za szeroko" zmierzone trzema
osobnymi licznikami:
- farmy na otwartym terenie (`Nakladka.Brak` + Laka/Rownina): **bez zmiany** na wszystkich
  ziarnach i obu sciezkach (93/75/101/95);
- tartak na lesie: przetrwal co do sztuki (30/31/28/28), takze przez round-trip zapisu;
- przypadki graniczne (tabela reczna): `plan` trafia **dokladnie** w `a` (las+farma),
  `d` (las+tartak+farma -> zostaje `["tartak"]`), `h` (las+farma+droga -> zostaje `["droga"]`);
  NIE rusza `b` (farma bez lasu), `c` (tartak), `e` (oboz lowiecki na lesie),
  `f` (**irygacja na lesie — §14, osobny nieotwarty temat**), `g` (goly las).
  `farmsOnOpenTerrain == 1` zgodnie z oczekiwaniem.

**ZALICZONE.**

### Kryterium 4 — idempotencja

Zywy stan: 2. przebieg `removed = 0`, **zero** wywolan callbacku, rejestr `placedImprovements`
bit-w-bit identyczny (porownanie zserializowanych, posortowanych wpisow). 3. przebieg **bez**
callbacku nie rzuca. Po trzech przebiegach farmy na otwartym terenie i liczba lasow nadal
nietkniete.
Ladunek zapisu: `migrateLegacyFarmsOnForestInSave` na juz zmigrowanym ladunku zwraca **0** na
kazdym z 4 ziaren.
Rejestr: wpis z sama farma jest **usuwany** (`placed.delete`), wpis mieszany przycinany do
`["tartak"]`, a sprzatanie **nie dopisuje** wpisow, ktorych nie bylo (`fromPlaced=false` -> rejestr
nietkniety). **ZALICZONE.**

### Kryterium 5 — dowod nie-tautologiczny (wlasne mutacje)

Nie przyjalem tabeli Operatora. Zrobilem **wlasny zestaw 12 celowanych mutacji** na kopii `src`,
kazda uruchomiona przeciwko OBU niezaleznym swiadkom: mojej sondzie i bramce Operatora
(przez jej `USUN_SRC_DIR`). Baseline bez mutacji: sonda 132/0, bramka 143/0.

| mutacja | plik | co psuje | sonda EV | bramka Op | werdykt |
|---|---|---|---|---|---|
| EV-M1  | improvement-build | predykat celuje w `'tartak'` zamiast `'farma'` | FAIL | FAIL | ZABITA |
| EV-M2  | improvement-build | zdjeta straznica `nakladka !== Las` w predykacie | FAIL | FAIL | ZABITA |
| EV-M3  | improvement-build | `strip` kasuje WSZYSTKIE warstwy na lesie | FAIL | FAIL | ZABITA |
| EV-M4  | improvement-build | zdjety `continue` dla heksa bez lasu | PASS | PASS | **rownowazna** (p. nizej) |
| EV-M5  | improvement-build | plan slepy na farme zyjaca tylko w polach heksa | FAIL | FAIL | ZABITA |
| EV-M6  | improvement-build | funkcja raportuje, ale nie sprzata | FAIL (105/27) | FAIL (119/24) | ZABITA |
| EV-M7  | save.ts | migracja ladunku wylaczona (`return 0`) | FAIL (120/12) | FAIL (131/12) | ZABITA |
| EV-M8  | save.ts | kolumna gesta `ulepszenieIdx` nie czyszczona | FAIL | FAIL | ZABITA |
| EV-M9  | save.ts | kolumna rzadka `ulepszenia` nie czyszczona | FAIL | FAIL | ZABITA |
| EV-M10 | save.ts | kolumna `improvementKey` nie czyszczona | PASS | PASS | **przezyla** (p. nizej) |
| EV-M11 | save.ts | rejestr w `meta` czysci `tartak` zamiast `farma` | FAIL | FAIL | ZABITA |
| EV-M12 | improvement-build | plan nigdy nie zglasza zmiany | FAIL | FAIL | ZABITA |

**10/12 zabitych przez oba swiadki niezaleznie.** Dwie ocalale przeanalizowalem do konca:

- **EV-M4 jest mutantem rownowaznym**, nie luka pokrycia. Po zdjeciu `continue` dla heksa bez
  lasu sterowanie wchodzi w `stripLegacyFarmOnForest(before, hex.nakladka)`, ktore ma **wlasna**
  straznice `if (nakladka !== Nakladka.Las) return [...layers]` — dlugosc sie nie zmienia, wiec
  `if (after.length === before.length) continue` i tak odrzuca heks. Zachowanie identyczne z
  konstrukcji. To pokazuje redundancje obrony, a nie dziure w asercjach.
- **EV-M10 to prawdziwie nieobserwowalna galaz.** Sprawdzilem `grep`em wszystkie odwolania do
  `hex.improvementKey` w `gra/src`: pole jest **zapisywane** (`main.ts::syncHexUlepszenieFields`,
  round-trip `mapSnapshot.ts`) i **kasowane** (`city-hex-clear.ts`), ale **nigdzie nie czytane**
  do plonow, kwalifikacji ani renderu — `improvementKeysForHex` czyta wylacznie
  `ulepszenia` / `ulepszenie`. Czyszczenie tej kolumny to poprawna higiena stanu, ale nie da sie
  jej przypiac asercja behawioralna, bo nie ma zadnego skutku w grze. Kod jest dobry; przesadzona
  jest tylko teza raportu Operatora o pelnym pokryciu mutacyjnym — patrz UWAGA U4.

**ZALICZONE** (z doprecyzowaniem w U4).

### Kryterium 6 — piec bramek referencyjnych + tsc

Uruchomione wlasna reka w moim worktree (`node_modules` dowiazane symlinkiem do
`/home/user/The-Game/gra/node_modules` — worktree ich nie ma; symlink jest w `.gitignore`,
`git status` pozostal czysty):

| bramka | wynik | wymog |
|---|---|---|
| `tools/logic-test.cjs` | **LOGIC OK (213/213)** | 213/213 |
| `tools/tech-tree-test.cjs` | **19 pass, 0 fail** | 19/0 |
| `tools/research-test.cjs` | **PASSED 33 / FAILED 0** | 33/33 |
| `tools/unit-replace-test.cjs` | **13/13 zielone** | 13/13 |
| `tools/combat-test.cjs` | **6/6 pass** | 6/6 |

`node ./node_modules/typescript/bin/tsc --noEmit` — **zero bledow, exit 0**.
Build: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-farma-legacy-ev
--emptyOutDir` — **OK, 848 modulow, 24,97 s**. **ZALICZONE.**

### Kryterium 7 — bramki sasiednie bez pogorszenia

- `tools/farma-nie-w-lesie-test.cjs`: **136 passed, 0 failed** (wymog 136/0).
- `tools/map-improvement-qualify-test.cjs`: **117 pass, 0 fail** (wymog 117/0).
- Nowa bramka tematu `tools/farma-lesie-usun-istniejace-test.cjs`: **143 OK / 0 FAIL**.

Potwierdzone osobno, ze temat NIE zmienia reguly kwalifikacji: `terrain-improvements.json` i
`isFarmBaseTerrain` nie sa w diffie, a zmiana w `farma-nie-w-lesie-test.cjs` nie dotyka logiki.
**ZALICZONE.**

---

## 4. UWAGI (nie blokery, do decyzji Final Control / wlasciciela)

**U1 — `demoKeysForHex` nadal zasiewa farme na lesie.** `main.ts::demoKeysForHex` dla
`Nakladka.Las` zwraca `['farma','tartak','oboz_lowiecki','droga']`. Tryb pokazowy
(`?demo=ulepszenia` / plik `*DEMO-ULEPSZENIA*`) tworzy wiec stan, ktory doslownym brzmieniem
GOAL-a („zaden stan gry (...) nie zawiera farmy stojacej na heksie z nakladka Las") jest
naruszeniem — do pierwszej granicy tury, na ktorej nowe sprzatanie **cicho wyczysci podglad**.
Operator tego nie odnotowal. Uwazam, ze **nie wolno bylo tego ruszac w tym temacie** (§14 —
zakres to farmy w rozgrywce, nie narzedzie podgladu), ale rozjazd trzeba nazwac i oddac
wlascicielowi jako osobne pytanie: czy tryb pokazowy ma dalej pokazywac farme na lesie.

**U2 — asymetria „rejestr kontra pola heksa" w `planLegacyFarmOnForestRemoval`.** Gdy heks MA
wpis w `placedImprovements`, plan czyta **wylacznie** rejestr
(`const before = fromPlacedLayers ? [...fromPlacedLayers] : improvementKeysForHex(hex)`), a
zrodlem plonow sa pola heksa. Zmierzylem to wprost: heks `{nakladka: Las, ulepszenia:['farma']}`
z wpisem rejestru `['tartak']` daje `removed = 0`, a `improvementKeysForHex` **nadal zwraca
`["farma"]`** — farma zyje i karmi. Ten sam heks bez wpisu w rejestrze: `removed = 1`.
Przesledzilem wszystkich pisarzy obu nosnikow (`syncHexUlepszenieFields` przy kazdym
`placedImprovements.set/delete`, `restorePlacedImprovementsFromSave`, sciezka zalozenia miasta
w 11236, wyrab AI w 29083, tryb demo) — **kazdy aktualizuje oba naraz**, wiec rozjazdu nie umiem
osiagnac zadna realna sciezka i nie stawiam z tego FAIL. Ale najtansza odpornosc na przyszlosc
to unia obu nosnikow zamiast preferencji rejestru; do rozwazenia w osobnym temacie.

**U3 — AI CYWILIZACJI (komputerowi przeciwnicy) kontra AI GRACZA (automat wspierajacy gracza):
brak dowodu behawioralnego.** Sprzatanie idzie po `map.hexes` + globalnym `placedImprovements`
(jedna mapa bez ownera), wiec z konstrukcji obejmuje farmy KAZDEGO wlasciciela — potwierdzam ten
argument Operatora odczytem kodu. Odnotowuje jednak, czego nikt nie zmierzyl: sciezka stawiania
ulepszen przez **AI CYWILIZACJI** (`main.ts` ok. 29098, log `[AI ${ownerId}]`) i przez
**AI GRACZA** (auto-ulepszenia, ok. 27296, ownerId 0) biegnie w sekwencji tury; gdyby bramka
kwalifikacji z zamknietego tematu `R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1` gdziekolwiek przeciekala,
farma postawiona na lesie zylaby do **nastepnej** granicy tury, nie znikalaby natychmiast.
To wlasciwosc wybranego punktu zaczepienia, nie blad — ale nie jest zmierzona na rozgrywce
z aktywnymi AI CYWILIZACJI.

**U4 — teza Operatora o pokryciu mutacyjnym jest o wlos za mocna.** „Pokrycie 80/80 rodzin
asercji — kazda nowa asercja czerwieni sie pod co najmniej jedna mutacja" to zdanie o
asercjach i jako takie moja kontrola je potwierdza. Nie wolno go jednak czytac jako „kazda
nowa galaz kodu ma swiadka": moja EV-M10 pokazuje galaz (`save.ts`, kolumna `improvementKey`),
ktorej **zadna asercja behawioralna przypiac nie moze**, bo pole nie jest w grze czytane.

**U5 — dwukrotne wyrazenie reguly (`improvement-build.ts` + `save.ts`) — akceptuje.**
Zweryfikowalem uzasadnienie Operatora, a nie tylko je przeczytalem: `improvement-build.ts`
importuje `render/improvements`, ktore ciagnie `three`; `game/save.ts` jest bundlowany
samodzielnie przez narzedzia w `gra/tools/`. Wzorzec jest tozsamy z istniejacym „drugim,
niezaleznym gate'em" `FOREST_BLOCKED_IMPROVEMENT_KEYS`, oba miejsca maja wzajemne odsylacze,
a obie kopie sa niezaleznie przykryte mutacjami (EV-M1/M2 kontra EV-M7/M11). To swiadoma
duplikacja z pokryciem, nie przypadkowy dryf.

**U6 — separacja od `stripImprovementsWhenForestRemoved` jest poprawna i to nie jest kosmetyka.**
Zlanie regul (dopisanie `'farma'` do `FOREST_DEPENDENT_IMPROVEMENT_KEYS`) kasowaloby farme przy
WYREBIE lasu — odwrotnie niz kanon („wyrab zostaje jedyna droga do farmy na zalesionym heksie").
Bramka sasiedniego tematu trzyma na to asercje i nadal jest zielona.

---

## 5. §13a — CZEGO NIE UDOWODNILEM

- **ZERO weryfikacji w przegladarce.** Nie uruchamialem gry. Nie mam dowodu, ze mesh farmy
  znika z ekranu, ze panel miasta pokazuje nizszy plon ani ze `diagInfo('migracja', ...)` sie
  pojawia. Zielone bramki i moja sonda NIE sa dowodem zachowania w rozgrywce. Deklaracje
  Operatora w tej sprawie potwierdzam co do zakresu — obaj mamy tu ta sama dziure.
- **Wpiecie w `main.ts` sprawdzilem strukturalnie, nie pomiarem.** `main.ts` (32 tys. linii,
  DOM + THREE) nie da sie zbundlowac samodzielnie w Node. Sprawdzilem: liczbe wystapien nazwy
  (dokladnie 3), pozycje obu wywolan wzgledem `restorePlacedImprovementsFromSave`, `turn++`,
  `doRotatingAutosave()` i bloku ekonomii, oraz zakres przez `tsc`. To slabszy rodzaj dowodu niz
  pomiar i tak go raportuje. Behawioralnie zmierzone jest to, co da sie wyjac do Node
  (`removeLegacyFarmsOnForest`, `save.ts`), plus moja replika `syncHexUlepszenieFields` — replika
  jest MOJA rekonstrukcja tej funkcji, nie jej oryginalem.
- **Koszt zmierzony w Node, nie jako FPS w przegladarce.** 4,58 ms mediany na 20160 heksach to
  pomiar czystej petli w V8 poza gra; nie mowi nic o klatkowaniu sekwencji EOT z renderem.
- **Nie zmierzylem rozgrywki z aktywnymi AI CYWILIZACJI** (patrz U3) ani sciezki pliku FSA
  (`fsa-autosave.ts`) — dla tej ostatniej mam tylko odczyt kodu, ze wchodzi przez
  `deserializeGame`, czyli przez to samo wejscie co localStorage/IndexedDB.
- **Nie sprawdzilem zapisow historycznych z dysku wlasciciela** — wszystkie moje zapisy sa
  syntetyczne, budowane w tescie. Zachowanie na realnym, starym pliku zapisu pozostaje
  nieudowodnione.

---

## 6. WERDYKT

Wszystkie siedem kryteriow konca zaliczonych, sprawdzonych **niezaleznie od bramki Operatora**
(inne ziarna, wlasne liczenie, wlasny zestaw mutacji). Allowlista czysta, granice nienaruszone,
piec bramek referencyjnych zielone, `tsc` zerowy, build przechodzi. Kryterium 1b — to, ktore
dispatch wskazal jako najlatwiejsze do pominiecia — jest zaimplementowane w calosci, w miejscu
uzasadnionym w kodzie i sprawdzalnym co do pozycji w sekwencji EOT.

`PASS-WITH-NOTES` zamiast `PASS` z powodu **U1** (tryb pokazowy nadal zasiewa farme na lesie —
realny rozjazd z brzmieniem GOAL-a, celowo nietkniety, wymaga decyzji wlasciciela) oraz **U4**
(teza o pokryciu mutacyjnym wymaga doprecyzowania). Zadna z uwag nie wskazuje bledu w
dostarczonym kodzie.

---

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1
GOAL: Zaden stan gry — nowa partia, trwajaca partia, wczytany zapis — nie zawiera farmy stojacej
na heksie z nakladka Las; las zostaje nietkniety, praca NIE wraca.
ZMIANY/COMMIT: ocena commita `cc98a78b` (bez zmian w `gra/`); ten raport —
`dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1/02-evaluator.md`.
TESTY: logic 213/213, tech-tree 19/0, research 33/33, unit-replace 13/13, combat 6/6,
farma-nie-w-lesie 136/0, map-improvement-qualify 117/0, farma-lesie-usun-istniejace 143/0,
`tsc --noEmit` 0 bledow, build vite OK (848 modulow, 24,97 s); wlasna sonda Evaluatora 132/0
na ziarnach 11/123/2024/5150; wlasny zestaw 12 mutacji — 10 zabitych, 1 rownowazna (EV-M4),
1 nieobserwowalna (EV-M10); koszt przebiegu 4,58 ms na 20160 heksach.
BLOKADY: brak.
RUNDY: 1/5
NASTEPNY KROK: Final Control (Opus 5, effort high) — `git fetch` + `git log` + potwierdzenie SHA
`cc98a78b` w commitach; do rozstrzygniecia U1 (tryb pokazowy `demoKeysForHex`) i U4.
DEPLOY/PUSH: NIE WYKONANO (push wylacznie galezi tematu z tym raportem; bez integracji, bez main)
