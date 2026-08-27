# RAPORT — EVALUATOR, runda 1 — R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1

Model: Opus 5, effort high. Worktree: `/home/user/wt-ev-farma`
(detached `origin/autobot/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1` = `db25fa25`).
Worktree odniesienia „PRZED": `/home/user/wt-ev-farma-main` (`origin/main` = `2d30335e`).
Wszystkie liczby nizej pochodza z URUCHOMIEN WLASNA REKA (rzad 1 wg §13a), nie z raportu Operatora.

## 1. SCOPE — filtr odwrotny wzgledem allowlisty

`merge-base(origin/main, galaz)` = `a980ea60`.

```
git -c core.quotePath=false diff --name-status a980ea60 origin/autobot/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1
A  dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1/01-operator.md
M  gra/data/terrain-improvements.json
M  gra/src/map/improvement-build.ts
M  gra/src/ui/hexContextTooltip.ts
A  gra/tools/farma-nie-w-lesie-test.cjs
M  gra/tools/map-improvement-qualify-test.cjs
```

FILTR ODWROTNY (wszystko POZA allowlista dispatchu): **pusty**.
`git diff --check`: czysty. `git status` w worktree: czysty.
`gra/src/main.ts`, `gra/src/game/ai.ts`, `gra/src/game/auto-improvements.ts`,
`gra/src/game/display-names.ts`, `dyspozycje/WERSJE.md` — **NIE tkniete** (potwierdzone
lista `--name-status`, nie deklaracja Operatora). Brak sekretow w diffie. Brak zmian procesu.

Jedno zastrzezenie formalne — patrz **N-EV1**.

## 2. Kryteria konca z dispatchu — sprawdzenie jedno po drugim

| # | Kryterium | Werdykt | Dowod (moj, nie Operatora) |
|---|---|---|---|
| 1 | Inwentaryzacja punktow egzekwowania z wlasnego przeszukania | **SPELNIONE** | Wlasny grep po `src/`: regula terenu farmy zyje w DOKLADNIE trzech miejscach — `improvement-build.ts` (`isFarmBaseTerrain`, `FOREST_*_IMPROVEMENT_KEYS`, `galleryTerrainEligible`, `computeImprovementBuildImpact`), `hexContextTooltip.ts:474`, `main.ts:12031` (tryb pokazowy, poza granicami). `pickAutoImprovements` (AI GRACZA) i `ai.ts:1984 planCityImprovements` (AI CYWILIZACJI) nie maja wlasnej reguly — obie ida przez `buildImprovementQualifier`. Nie znalazlem ANI JEDNEGO punktu spoza listy Operatora. |
| 2 | Pomiar PRZED/PO na >=5 ziarnach, 5 kategorii | **SPELNIONE** | Sekcja 3 nizej — wlasna metoda, dwa fixture'y (jego + moj), wynik zgodny co do jednego heksa. |
| 3 | Pulapka „p-LAS-kie" osobna asercja | **SPELNIONE** | Sekcja (6) bramki tematu; wlasny grep potwierdza, ze zaden z plikow sciezki farmy (`improvement-build.ts`, `hexContextTooltip.ts`, `auto-improvements.ts`) nie kwalifikuje lasu przez `.includes('las')`. Jedyne `includes('las')` w `src/` sa w `cityPanel.ts`, `civ-bonuses.ts`, `combat.ts`, `battleTerrainTooltip.ts` — poza sciezka farmy, bez zmian w tym temacie. |
| 4 | Dowod nie-tautologiczny — celowana mutacja na kazda asercje | **SPELNIONE** | Sekcja 4 — trzy WLASNE mutacje, w tym jedna, ktorej Operator nie robil. |
| 5 | Kanon bez pogorszenia | **SPELNIONE** | `map-improvement-qualify-test.cjs` **117/0** (bylo 112/0: +5 asercji, 5 odwroconych swiadomie razem z uchylona regula, 0 skasowanych — brzmienie uchylone zachowane w komentarzu). `auto-improvements-test.cjs` **45/0**. `oboz-lowiecki-las-test.cjs` **91/0**. |
| 6 | Piec bramek referencyjnych + `tsc` | **SPELNIONE** | logic **213/213**, tech-tree **19 pass / 0 fail**, research **33/33**, unit-replace **13/13**, combat **6/6**. `node ./node_modules/typescript/bin/tsc --noEmit` — **0 bledow**. `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-farma-ev --emptyOutDir` — **OK** (848 modulow, 32.4 s). |
| 7 | `terrain-improvements.json` uzgodniony, historia zastapiona a nie wymazana | **SPELNIONE** | `farma.teren` = „Łąka, Równina (bez lasu)"; `farma.warunek` niesie zakaz lasu, date i autora nowej decyzji (Maciej 2026-08-27) ORAZ doslowny slad decyzji uchylonej z 2026-07-21. Sprawdzone na diffie, nie na asercji bramki. |

Zakres nierozstrzygniety („farmy JUZ STOJACE w lesie") — **nie ruszony w zadna strone**.
Sprawdzilem to niezaleznie od bramki: `migrateImprovementLayers` (`terrain-improvements.ts:49`)
przepuszcza warstwy przez `migrateLegacyKopalniaKey` i nie zna pojecia lasu; `save.ts`
i `fsa-autosave.ts` **nie wolaja** `qualifies` / `buildImprovementQualifier` /
`isImprovementBlockedOnForest` (grep pusty). Stojaca farma na lesie przezywa wczytanie zapisu.
Luka save/load: **BRAK**.

## 3. Pomiar niezalezny — INNA METODA niz Operatora

Operator liczyl **predykat** (`buildImprovementQualifier` + `computeImprovementBuildImpact`)
per heks, a picker i tooltip mierzyl tylko na JEDNYM reprezentancie kategorii.
Ja policzylem **faktyczne postawienia i faktyczny HTML**:

* **AI GRACZA** (automat ulepszen wspierajacy gracza) — `pickAutoImprovements`, `ownerId=0`,
  siatka miast co 4 heksy pokrywajaca caly lad, `priorityOverride=['farma']`, budzet 10^8,
  `maxItemsPerCity=Infinity`; licze UNIKALNE heksy, na ktorych picker faktycznie postawil farme.
* **AI CYWILIZACJI** (komputerowi przeciwnicy) — to samo wywolanie z `ownerId=3`,
  **osobny przebieg i osobny licznik**, nie wniosek ze sciezki gracza.
* **TOOLTIP** — `buildHexContextTooltipHtml` na **KAZDYM** heksie ladu (pelny skan, nie
  reprezentant): czy „Farma" jest w sekcji „Możliwe ulepszenia (teren)".

Dwa fixture'y: replikacja fixture'u Operatora (36x28, ziarna 42/1337/2026/7/99) **oraz**
wlasny, niezalezny (44x32, ziarna 5/55/555/2718/31337). Sumy po 5 ziarnach:

**fixture Operatora 36x28**

| kategoria | heksow | TOOLTIP PRZED -> PO | AI GRACZA PRZED -> PO | AI CYWILIZACJI PRZED -> PO |
|---|---|---|---|---|
| Laka + Las | 745 | 745 -> **0** | 745 -> **0** | 745 -> **0** |
| Rownina + Las | 8 | 8 -> **0** | 8 -> **0** | 8 -> **0** |
| Wzgorza + Las | 37 | 37 -> **0** | 37 -> **0** | 37 -> **0** |
| Laka bez lasu | 440 | 440 -> 440 | 440 -> 440 | 440 -> 440 |
| Rownina bez lasu | 58 | 58 -> 58 | 58 -> 58 | 58 -> 58 |

**wlasny fixture EV 44x32 (ziarna, ktorych Operator nie mierzyl)**

| kategoria | heksow | TOOLTIP PRZED -> PO | AI GRACZA PRZED -> PO | AI CYWILIZACJI PRZED -> PO |
|---|---|---|---|---|
| Laka + Las | 981 | 981 -> **0** | 981 -> **0** | 981 -> **0** |
| Rownina + Las | 45 | 45 -> **0** | 45 -> **0** | 45 -> **0** |
| Wzgorza + Las | 99 | 99 -> **0** | 99 -> **0** | 99 -> **0** |
| Laka bez lasu | 454 | 454 -> 454 | 454 -> 454 | 454 -> 454 |
| Rownina bez lasu | 151 | 151 -> 151 | 151 -> 151 | 151 -> 151 |

Liczby heksow i liczby PRZED/PO w fixture Operatora **zgadzaja sie z jego tabela co do jednego
heksa**, mimo innej metody liczenia. Rozjazdu **nie ma**. Parytet GRACZ / AI GRACZA /
AI CYWILIZACJI: identyczny na wszystkich 10 mapach, w obie strony (blokada na lesie,
brak regresu poza lasem).

Jednostkowo (PRZED -> PO): `isFarmBaseTerrain` Laka+Las `true->false`, Rownina+Las
`true->false`, Wzgorza+Las `true->false`, Wzgorza bez lasu `false->false`,
Laka/Rownina bez lasu `true->true`; `isImprovementBlockedOnForest('farma')` `false->true`,
dla `tartak` i `oboz_lowiecki` **bez zmiany** (`false`, czyli w lesie nadal wolno — zgodnie
z ECHO); `galleryTerrainEligible('farma', Wzgorza)` `true->false`, dla Laki `true->true`.

UX potwierdzone realnym wywolaniem: `getImprovementForestBlockHint('farma')` =
„Farma na lesie zabroniona — najpierw wyrąb las (Wyrąb w panelu ulepszeń)."
Sciezka `main.ts:11709` odpala ten hint automatycznie, bez zmiany `main.ts`.

## 4. Mutacje — WLASNE, nie powtorzenie Operatora

Kazda na osobnej kopii zrodla (`FARMA_SRC_DIR`), bramka tematu uruchomiona przeze mnie:

| # | Mutacja | Wynik | Co sie zaczerwienilo |
|---|---|---|---|
| EM1 | `isFarmBaseTerrain` cofniete do reguly 2026-07-21 (P-A) | **133/3** | wylacznie 3 asercje jednostkowe sekcji (1a) |
| EM2 | `farma` z `FOREST_BLOCKED` z powrotem do `FOREST_COEXIST` (P-B) | **113/23** | 4x commit na lesie, lista zabronionych, pulapka-commit, 3x COMMIT na mapie 42, 14x pomiar PO |
| EM3 | **ZAKAZANE poszerzenie zakresu**: `TerenBazowy.Wzgorza` dopisane do `FLAT_FARM` (mutacja, ktorej Operator NIE robil) | **130/6** | `isFarmBaseTerrain: Wzgorza bez lasu`, **gracz**, **AI GRACZA**, **AI CYWILIZACJI**, **tooltip**, **galeria 3D** |

EM3 jest istotna osobno: dispatch wprost zakazuje „naprawiania" farmy na Wzgorzach przez
dopisanie ich do terenow farmowych. Bramka tematu **lapie takie poszerzenie w szesciu
miejscach, w tym behawioralnie** — czyli chroni granice zakresu, nie tylko biezaca regule.

**Potwierdzam znalezisko Operatora o wzajemnym maskowaniu** i podpisuje sie pod jego
sformulowaniem: `qualifies()` konczy sie `computeImprovementBuildImpact(...) !== null`
(`improvement-build.ts:902`), a ta funkcja odcina farme na lesie juz w pierwszej linii
(`:392`). Skutkiem cofniecie samej `isFarmBaseTerrain` (EM1) nie zmienia **ani jednego**
wyniku gracza / AI GRACZA / AI CYWILIZACJI / tooltipa — 133/3, wszystkie trzy czerwienie
sa jednostkowe. Zachowanie w rozgrywce niesie dzis **P-B**; **P-A jest obrona w glab,
weryfikowana jednostkowo, nie behawioralnie**. Operator zglosil to sam, wprost i bez
proszenia — to jest zachowanie zgodne z §13a, nie wada raportu.

## 5. Noty Evaluatora

- **N-EV1 (SCOPE, formalne — do rozstrzygniecia przez Final Control).** Allowlista dopuszcza
  `gra/src/ui/**` „**wylacznie** teksty podpowiedzi/tooltipow mowiace o warunku terenu farmy".
  Faktyczna zmiana w `hexContextTooltip.ts` to **wylacznie komentarz** (3 linie, `+7/-2`),
  bez zmiany jednej instrukcji wykonywalnej — sprawdzone na diffie linia po linii.
  Komentarz nie jest „tekstem podpowiedzi", wiec formalnie jest to zmiana **innego rodzaju**
  niz nazwany w allowliscie, choc w pliku dozwolonym i o zerowym skutku wykonawczym
  (opisuje dokladnie regule tego tematu). Nie stawiam na tym FAIL — nie ma tu ani
  poszerzenia zakresu, ani ryzyka regresu — ale zglaszam jawnie, zamiast przemilczec.
- **N-EV2 (dyscyplina liczb, §13a).** Liczba `M2 105/23` w raporcie Operatora nie odpowiada
  zacommitowanemu artefaktowi: bramka ma dzis **136** asercji, a `105+23=128`, czyli pomiar
  M2 powstal PRZED dopisaniem osmiu asercji sekcji (1a). Powtorzylem te sama mutacje na
  zacommitowanej bramce: **113/23** — **zbior czerwieni identyczny**, rozna tylko liczba
  zielonych. Merytorycznie bez konsekwencji; formalnie liczba w raporcie nie jest liczba
  z uruchomienia stanu, ktory jedzie do integracji.
- **N-EV3 (potwierdzam N1 Operatora, wlasnym odczytem).** `main.ts:12031 demoKeysForHex`
  dla `Nakladka.Las` zwraca `['farma','tartak','oboz_lowiecki','droga']` — czyli tryb
  `?demo=ulepszenia` nadal zasiewa farme na kazdym zalesionym heksie. Potwierdzam tez
  czesc tonujaca: ta sama funkcja zasiewa farme na `TerenBazowy.Pustynia` (`:12045`), co
  **nigdy** nie bylo legalne — rozjazd jest zastany, nie wprowadzony tym tematem. Komentarz
  w zrodle mowi wprost „Osobny plik podglądu; zwykłej gry nie dotyczy". `main.ts` jest
  w GRANICACH dispatchu — niedotkniecie go bylo poprawne. Temat do rejestru:
  `P-DEMO-ULEPSZENIA-ROZJAZD-Z-REGULA-TERENU-Q1`.
- **N-EV4 (potwierdzam N2 Operatora, wlasnym uruchomieniem).** `hex-tooltip-mozliwe-
  ulepszenia-zloze-test.cjs` daje **73 passed / 1 failed** na CZYSTYM `origin/main`
  (`/home/user/wt-ev-farma-main`) i **identycznie 73/1** na galezi. Czerwona asercja to
  regex szukajacy starej linii o `oboz_lowiecki` — nie dotyczy farmy. **Nie jest to regres
  tej zmiany.** Osobny temat naprawczy uzasadniony.
- **N-EV5 (do wlasciciela, nie do wykonawcy).** Farma na Wzgorzach jest teraz niemozliwa
  CALKOWICIE. To konsekwencja wprost nazwana w dispatchu, a nie wybor Operatora, i bramka
  tego dzis pilnuje (EM3). Jesli intencja ECHO bylo tylko „nie w lesie", a nie „nigdy na
  wzgorzu" — potrzebne osobne pytanie ABC. Zgadzam sie z Operatorem, ze nie wolno tego
  „naprawic" w tym temacie.
- **N-EV6.** Nowa bramka `gra/tools/farma-nie-w-lesie-test.cjs` (136 asercji) jest bramka
  TEMATU, nie referencyjna. Jesli ma zostac stalym straznikiem tej reguly, decyzje o dopisaniu
  jej do zestawu bramek podejmuje orkiestrator przy integracji — nie Evaluator.

## 6. Trzy twarde FAIL-e domeny gry (§1 tabela roli Evaluatora)

- **Happy-path bez brzegow** — NIE wystepuje. Brzegi pokryte i przeze mnie zweryfikowane:
  las na pustyni, gole wzgorze, rownina + zloze konia (nakladka != Las), gory, wybrzeze,
  heks ze stojaca juz farma w lesie, pusta lista warstw.
- **Asymetria gracz / AI / MP** — NIE wystepuje. Zmierzone osobno dla gracza (panel + commit),
  AI GRACZA i AI CYWILIZACJI na 10 mapach; wyniki identyczne. Osobnej sciezki serwerowej/MP
  walidujacej ulepszenia w `src/` nie ma (grep pusty) — **brak dowodu na istnienie takiej
  sciezki, wiec brak dowodu na luke; zglaszam to jako BRAK DOWODU, nie jako „zielone"**.
- **Luka save/load** — NIE wystepuje, dowod w sekcji 2.

## KONTRAKT

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1
GOAL: Farma nie kwalifikuje sie do budowy na heksie z nakladka Las — na zadnym terenie
      bazowym, u gracza i u komputera, we wszystkich punktach egzekwowania.
ZMIANY/COMMIT: weryfikacja galezi autobot/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1 @ db25fa25
      (merge-base a980ea60). 6 plikow, filtr odwrotny wzgledem allowlisty PUSTY.
      Wlasny artefakt: dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1/02-evaluator.md
TESTY: logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 · combat 6/6 ·
      tsc --noEmit 0 bledow · vite build --outDir /tmp/civ-dist-farma-ev OK ·
      map-improvement-qualify 117/0 · auto-improvements 45/0 · oboz-lowiecki-las 91/0 ·
      farma-nie-w-lesie 136/0. Mutacje wlasne: EM1 133/3, EM2 113/23, EM3 130/6.
      Pomiar wlasna metoda (faktyczne postawienia pickera + pelny skan tooltipa),
      2 fixture'y x 5 ziaren: lesne 745/8/37 -> 0/0/0 i 981/45/99 -> 0/0/0,
      nielesne 440/58 i 454/151 bez zmiany. Zgodnosc z tabela Operatora co do heksa.
      hex-tooltip-mozliwe-ulepszenia-zloze 73/1 — czerwona TAK SAMO na czystym origin/main,
      nie regres tej zmiany.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Final Control (Opus 5, effort high) — do rozstrzygniecia N-EV1 (rodzaj zmiany
      w gra/src/ui/** wzgledem brzmienia allowlisty) i N-EV2 (liczba M2 w raporcie Operatora
      nie pochodzi z zacommitowanego stanu bramki). Do rejestru orkiestratora:
      P-DEMO-ULEPSZENIA-ROZJAZD-Z-REGULA-TERENU-Q1,
      P-BRAMKA-HEX-TOOLTIP-ZLOZE-NIEAKTUALNY-REGEX-OBOZU-Q1,
      P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1 (ABC, zakres nierozstrzygniety),
      P-ULEPSZENIA-FARMA-W-LESIE-WPLYW-NA-TEMAT-AI-Q1 (ponowny pomiar AI po tej regule),
      N-EV5 (czy farma na Wzgorzach ma byc niemozliwa calkowicie — ABC).
DEPLOY/PUSH: NIE WYKONANO — push wylacznie galezi tematu
      autobot/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1. Bez pushu do main, bez integracji, bez deployu.
```
