# RAPORT — FINAL CONTROL, runda 1 — R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1

Worktree FC: `/home/user/wt-fc-farma` (detached `b0c34ea2`). Build FC: `/tmp/civ-dist-farma-fc`.

---

## 1. KONTROLA PROCEDURALNA (obowiazkowa — praca w commitach)

`git fetch origin autobot/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1` → OK.

`git log --oneline origin/autobot/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1`:

| SHA | commit |
|---|---|
| `b0c34ea2` | Evaluator r1 — raport `02-evaluator.md` (205 linii, sam artefakt) |
| `db25fa25` | Operator r1 — zmiana kodu + bramka + raport `01-operator.md` |
| `a980ea60` | dispatch (merge-base z `origin/main`) |

**ZMIANY KODU SA W COMMITACH.** Dowod nie z deklaracji, tylko z `git diff --numstat a980ea60 b0c34ea2`:

```
204  0  dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1/01-operator.md
205  0  dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1/02-evaluator.md
  2  2  gra/data/terrain-improvements.json
 44  9  gra/src/map/improvement-build.ts
  5  2  gra/src/ui/hexContextTooltip.ts
476  0  gra/tools/farma-nie-w-lesie-test.cjs
 20  5  gra/tools/map-improvement-qualify-test.cjs
```

`git status --porcelain` w moim worktree: **pusty**. Worktree Operatora nie byl mi potrzebny —
mocniejszy dowod: **zalozylem CZYSTY worktree z samego commitu `b0c34ea2`** (jedyny dodatek:
symlink `node_modules`, ignorowany przez git) i **wszystkie bramki, wlacznie z nowa
`farma-nie-w-lesie-test.cjs` (136/0), przechodza w tym czystym checkoucie**. Nowa bramka nie
zalezy od zadnego niezacommitowanego pliku (m.in. stub `tools/.stubs/hex-tooltip-zloze-brandAssets-stub.ts`
jest w repo). Scenariusz „temat przeszedl role i nie dal sie zintegrowac, bo pracy nie bylo
w commitach" **nie wystepuje**.

**Stan wzgledem `main`:** `origin/main` = `2d30335e`, merge-base = `a980ea60`, czyli main jest
**1 commit do przodu** (`2d30335e` — Rejestr ECHO ABC AI-R4). `git diff --name-status a980ea60 origin/main`
= wylacznie `dyspozycje/REJESTR-PROSB-I-ZADAN.md`. **Zero czesci wspolnej z 6 plikami tematu** —
integracja bez konfliktu. `git branch -r --contains db25fa25` → tylko galaz tematu, **nie main**.

---

## 2. GRANICE §9 — sprawdzone niezaleznie

| granica | wynik | dowod |
|---|---|---|
| `dyspozycje/WERSJE.md` nietkniete | OK | `git diff --name-only a980ea60 b0c34ea2 \| grep -i WERSJE` → pusto |
| brak pushu do `main` | OK | `git branch -r --contains db25fa25` → tylko galaz tematu |
| brak artefaktow `npm run build` w commitach | OK | brak `dist/`, `node_modules`, `*.map` w liscie plikow |
| brak `git add -A` (skutek) | OK | 7 plikow, wszystkie w allowlisce; zaden plik przypadkowy |
| `main.ts`, `ai.ts`, `auto-improvements.ts`, `display-names.ts` | **NIETKNIETE** | z `--name-status`, nie z deklaracji |
| **filtr odwrotny allowlisty** | **PUSTY** | kazdy z 7 plikow mapuje sie na pozycje allowlisty |
| `git diff --check` | czysto | — |

**Delta WYKONYWALNA calej zmiany** (przefiltrowalem diff z linii komentarzowych) — **dokladnie
4 edycje, 7 linii**:

```
isFarmBaseTerrain:      -if (FLAT_FARM.has(teren)) return true;
                        -return nakladka === Nakladka.Las && teren === TerenBazowy.Wzgorza;
                        +if (nakladka === Nakladka.Las) return false;
                        +return FLAT_FARM.has(teren);
FOREST_COEXIST:         -'farma', 'tartak', 'oboz_lowiecki', 'glinianka',
                        +'tartak', 'oboz_lowiecki', 'glinianka',
FOREST_BLOCKED:         +'farma',
galleryTerrainEligible: -return FLAT_FARM.has(teren) || teren === TerenBazowy.Wzgorza;
                        +return FLAT_FARM.has(teren);
```

Cala reszta z `+44/-9` w `improvement-build.ts` to komentarze i historia decyzji. Zmiana jest
minimalna i celna; §14 (poszerzenie zakresu) nienaruszone — **Wzgorza NIE zostaly dopisane do
`FLAT_FARM`**, konsekwencja „farma na Wzgorzach niemozliwa calkowicie" zostawiona jako swiadoma,
zgodnie z dispatchem.

---

## 3. ROZSTRZYGNIECIE NOT EVALUATORA

### N-EV1 (zmiana w `gra/src/ui/hexContextTooltip.ts` to wylacznie komentarz) — **NIE JEST FAIL. Rozstrzygam, nie odsylam.**

Wlasna weryfikacja, nie przepisanie: przefiltrowalem diff tego pliku po liniach nie zaczynajacych
sie od `//` → **zbior pusty**. Zmiana ma **zerowa delte wykonywalna**. Uzasadnienie werdyktu:

1. Plik jest **wewnatrz** allowlisty (`gra/src/ui/**`); kwalifikator zawezal RODZAJ edycji, nie dopuszczenie pliku.
2. Usuniety komentarz brzmial *„tartak/wyrab/glinianka/oboz lowiecki/**farma** MOGA stac na Lesie"* —
   po zmianie **stal sie falszywy**. Zostawienie go byloby zrodlem klamiacym o kanonie, czego
   dyscyplina tego repo (historia decyzji w komentarzach) wprost zabrania.
3. Zerowy skutek wykonawczy i zerowy skutek dla gracza.

**Do rejestru jako lekcja dispatchowa (nie zarzut wobec wykonawcy):** brzmienie allowlisty
„`gra/src/ui/**` — wylacznie teksty podpowiedzi/tooltipow" nalezy w przyszlych dyspozycjach
rozszerzyc o „oraz komentarze opisujace ten warunek", bo inaczej poprawna higiena zrodla
laduje w szarej strefie.

### N-EV2 (liczba „M2 105/23" u Operatora) — **POTWIERDZONA trzecim, niezaleznym uruchomieniem.**

Odtworzylem mutacje M2 sam (`'farma'` z powrotem do `FOREST_COEXIST_IMPROVEMENT_KEYS`, przez
`FARMA_SRC_DIR` na kopii zrodla): **113 passed, 23 failed** — dokladnie tyle, ile podal Evaluator,
i inaczej niz `105/23` w raporcie Operatora. `105+23=128 ≠ 136` (liczba asercji w zacommitowanej
bramce), wiec liczba Operatora pochodzi ze stanu posrednim. **Zbior czerwieni sie zgadza, znaczenie
mutacji sie nie zmienia** — to usterka §13a w raportowaniu, bez konsekwencji merytorycznych.

**Korekta arytmetyczna do raportu Evaluatora:** `hexContextTooltip.ts` ma `+5/-2`, nie `+7/-2`
(`git diff --numstat`). Kosmetyka, ale liczba w raporcie musi byc liczba z narzedzia.

---

## 4. ZNALEZISKA WLASNE — czego NIE MA w zadnym z dwoch poprzednich raportow

### FC-1 (najwazniejsze) — **pierwsze mutacje na `hexContextTooltip.ts`; dwie straze w tooltipie WZAJEMNIE SIE MASKUJA**

Wszystkie szesc mutacji poprzednikow (Operator M1–M3, Evaluator EM1–EM3) celowalo w
`improvement-build.ts`. **Drugi zmieniony plik zrodlowy nie byl mutowany ani razu.** Zrobilem to:

| mutacja | co usunieta | wynik `farma-nie-w-lesie-test` |
|---|---|---|
| **FC-M1** | `hexContextTooltip.ts:474` — `if (key === 'farma' && !isFarmBaseTerrain(teren, nakladka)) continue;` | **136/0 — ZIELONA (mutacja NIEZLAPANA)** |
| **FC-M2** | `hexContextTooltip.ts:459` — `if (isImprovementBlockedOnForest(key, nakladka)) continue;` | **136/0 — ZIELONA (mutacja NIEZLAPANA)** |
| **FC-M3** | obie linie naraz | **132/4 — CZERWONA** |

Odczyt: sciezka tooltipa jest **zachowaniowo poprawna i realnie asercjonowana** (FC-M3 czerwieni
4 asercje, wiec asercje tooltipa nie sa puste), ale linie 459 i 474 **maskuja sie nawzajem**:
dla `Laka/Rownina + Las` kazda z nich osobno wystarcza, a `galleryTerrainEligible` (linia 453,
juz bez Wzgorz) odcina Wzgorza jeszcze wczesniej. **Linia 474 jest dzis behawioralnie martwa**
i **zadna bramka nie wykryje jej usuniecia**.

Konsekwencja praktyczna: przyszle „sprzatanie martwego kodu" moze skasowac linie 474 i przejdzie
przez komplet bramek na zielono, likwidujac obrone w glab bez sladu. To **nie jest wada tej
zmiany** — jest to **udokumentowany limit pokrycia nowej bramki**. Nota, nie FAIL.
Do rejestru: `P-BRAMKA-FARMA-TOOLTIP-STRAZE-WZAJEMNIE-MASKUJACE-Q1`.

### FC-2 — nieinwentaryzowany konsument reguly farmy: `foodPotentialForHex` (ranking auto-okolicy)

Kryterium konca 1 wymagalo inwentaryzacji punktow egzekwowania. Oba raporty wymieniaja
`improvement-build.ts`, `hexContextTooltip.ts:474` i `main.ts:12031`. **Zaden nie wymienia
`src/game/terrain-improvements.ts:397 foodPotentialForHex`**, wolanego z `src/game/okolica.ts:254`
(ranking heksow przy fokusie „zywnosc").

Odczytalem jego cialo:

```
if (nakladka === Nakladka.Las) return FOREST_FOOD_POTENTIAL_PENALTY;   // -3
if (teren === Laka || teren === Rownina) return FARMA_POTENTIAL_FOOD_BONUS;
return 0;
```

Ta funkcja **juz wczesniej zakladala „farmy w lesie nie ma"** — byla wiec **niespojna z regula
z 2026-07-21** (ktora farme w lesie dopuszczala) i **staje sie spojna dopiero po tej zmianie**.
Zero pracy do wykonania; odnotowuje jako dowod, ze zmiana **zwieksza wewnetrzna spojnosc**
kodu, a nie tylko przestawia jedna regule. Punkt pominiety w inwentaryzacji, ale pominiety
**bezpiecznie** — nie wymagal edycji, wiec kryterium 1 nie jest zlamane.

### FC-3 — zmiana zachowania W `main.ts` bez tkniecia `main.ts` (i luka dowodowa)

`main.ts:11709` (`applyBuildRequest`):

```
if (hex.nakladka === Nakladka.Las && isImprovementBlockedOnForest(req.key, hex.nakladka)) {
  showHintMessage(getImprovementForestBlockHint(req.key), 4000);
}
```

Wpisanie `'farma'` do `FOREST_BLOCKED_IMPROVEMENT_KEYS` **zmienia zachowanie tej galezi**:
przed zmiana klik „farma" na zalesionym heksie **budowal farme**; po zmianie `impact === null`
i gracz dostaje toast **„Farma na lesie zabroniona — najpierw wyrab las (Wyrab w panelu ulepszen)."**
To dokladnie to, czego wymagal §2b dispatchu — **punkt egzekwowania domkniety sterowaniem danymi,
bez edycji zakazanego pliku**. Potwierdzam to jako zgodne, nie jako naruszenie.

**Luka dowodowa (§13a):** sam TEKST hintu jest asercjonowany (`farma-nie-w-lesie-test.cjs:328`),
ale **OSIAGALNOSC tej galezi przez `main.ts:11709` nie jest pokryta zadna bramka** — `main.ts`
nie jest bundlowany przez zadna z nich. **To BRAK DOWODU, nie „zielone".**

### FC-4 — weryfikacja linia po linii deklaracji Operatora o bramce kanonu

Operator zadeklarowal „5 asercji odwroconych, 5 dopisanych, 0 skasowanych". Policzylem z diffu:
odwrocone — `qInka farma laka+las`, `qInka farma wzgorza+las`, `isFarmBaseTerrain laka+las`,
`isFarmBaseTerrain wzgorza+las`, `isImprovementBlockedOnForest('farma')` = **5**; dopisane —
`isFarmBaseTerrain rownina+las`, `laka bez lasu`, `rownina bez lasu`, `farma poza lasem nie
blokowana`, `impact null: farma on las` = **5**; **skasowanych 0** (stare brzmienia zachowane
w komentarzu). `112 + 5 = 117` — zgadza sie z uruchomieniem. **Deklaracja prawdziwa.**

### FC-5 — zakres nierozstrzygniety faktycznie nietkniety (wlasny lancuch odczytu)

- `stripImprovementsWhenForestRemoved` (`improvement-build.ts:192`) filtruje po
  `FOREST_DEPENDENT_IMPROVEMENT_KEYS` — **osobnym zbiorze**, nie po `FOREST_COEXIST`. Wyjecie
  farmy z COEXIST **nie zmienia** tego, co przezywa wyrab. Farmy juz stojace zostaja.
- `migrateImprovementLayers` (`terrain-improvements.ts:49`) migruje wylacznie legacy klucze
  kopaln; **nie zna terenu ani nakladki** — wczytanie zapisu nie rewaliduje farm.
- `computeImprovementBuildImpact` zwraca **`removesForest = false` bezwarunkowo** (linia 419),
  wiec dopisanie farmy do FOREST_BLOCKED **nie moze** uruchomic cichego kasowania lasu.

`P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1` pozostaje otwarte i nieprzesadzone w zadna strone —
zgodnie z dispatchem.

### FC-6 — AI CYWILIZACJI potwierdzone wlasnym odczytem lancucha

`ai.ts planCityImprovements` (ok. 1985) **nie ma wlasnej reguly terenu** — buduje `picks` przez
`pickAutoImprovements(...)`, ktory kwalifikuje przez `buildImprovementQualifier`
(`auto-improvements.ts:348, 433`). **AI GRACZA i AI CYWILIZACJI dziela dokladnie ten sam
kwalifikator**; nie ma sciezki obchodzacej regule. (Rozroznienie ma znaczenie: AI GRACZA =
automat ulepszen wspierajacy gracza; AI CYWILIZACJI = komputerowi przeciwnicy.)

### FC-7 — czerwien `hex-tooltip-mozliwe-ulepszenia-zloze` NIE jest regresem tej zmiany (inna metoda niz Evaluator)

Evaluator dowodzil przez uruchomienie na `origin/main`. Ja przez porownanie zrodla: bramka wymaga
literalu `if (key === 'oboz_lowiecki' && nakladka !== Nakladka.Las && !hasAnimalDeposit(nakladka)) continue;`,
a zrodlo ma `if (key === 'oboz_lowiecki' && nakladka !== Nakladka.Las) continue;` — **identycznie
na `origin/main` (linia 479) i na galezi (linia 482)**, a diff tematu dotyka slowa `oboz_lowiecki`
**0 razy**. Bramka niesie nieaktualny regex. Potwierdzam `P-BRAMKA-HEX-TOOLTIP-ZLOZE-NIEAKTUALNY-REGEX-OBOZU-Q1`.
Uwaga dodatkowa: ta sama lista `REQUIRED_LINES` zawiera literal linii 474 farmy — czyli **kasowanie
linii 474 zlapalaby ta bramka**, choc nie bramka tematu (FC-1). Dzis jednak ta bramka jest czerwona
z innego powodu, wiec jako straznik nie dziala jednoznacznie.

---

## 5. BRAK DOWODU (§13a) — jawnie

1. **Brak weryfikacji w dzialajacej przegladarce.** Zaden z trzech etapow nie uruchomil gry i nie
   sprawdzil wzrokowo: (a) ze „Farma" znika z listy „mozliwe ulepszenia" w tooltipie zalesionego
   heksa, (b) ze toast z §FC-3 faktycznie sie pokazuje. Sciezka logiczna jest zmierzona
   **prawdziwa funkcja** `buildHexContextTooltipHtml` na kazdym heksie ladu dwoch fixture'ow, wiec
   niepokryte zostaje **wylacznie okablowanie DOM**, ktorego ta zmiana nie dotyka. **Nie twierdze,
   ze zweryfikowano to w grze — nie zweryfikowano.**
2. **Brak sciezki serwerowej/MP walidujacej ulepszenia** — potwierdzam ustalenie Evaluatora:
   nie znalazlem takiej sciezki w `src/`. To **brak dowodu, ze jej nie ma**, nie dowod jej braku.
3. **Osiagalnosc `main.ts:11709`** — niepokryta bramka (FC-3).
4. **Wplyw na sile AI** (obu rodzajow) po odcieciu farmy w lesie: **niezmierzony**. Zmierzono, ze
   farma znika z lasu (0 postawien); **nie zmierzono, czy picker kompensuje** (wyrab/tartak) ani
   jak zmienia sie tempo zywnosciowe. To jest wprost `P-ULEPSZENIA-FARMA-W-LESIE-WPLYW-NA-TEMAT-AI-Q1`
   i **poza zakresem tego tematu** — ale nie wolno tego czytac jako „AI bez zmian".

---

## 6. BRAMKI — uruchomione wlasna reka, w czystym worktree FC

| bramka | wynik |
|---|---|
| `node tools/logic-test.cjs` | **213/213** |
| `node tools/tech-tree-test.cjs` | **19 pass, 0 fail** |
| `node tools/research-test.cjs` | **33/33** |
| `node tools/unit-replace-test.cjs` | **13/13** |
| `node tools/combat-test.cjs` | **6/6** |
| `node ./node_modules/typescript/bin/tsc --noEmit` | **0 bledow** |
| `vite build --outDir /tmp/civ-dist-farma-fc --emptyOutDir` | **OK** (37 418,91 kB, 44,57 s) |
| `tools/farma-nie-w-lesie-test.cjs` | **136/0** |
| `tools/map-improvement-qualify-test.cjs` | **117/0** (bylo 112/0) |
| `tools/auto-improvements-test.cjs` | **45/0** |
| `tools/oboz-lowiecki-las-test.cjs` | **91/0** |
| `tools/hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs` | 73/1 — **czerwien zastana, nie regres** (FC-7) |

Mutacje wlasne: **FC-M1 136/0 (niezlapana)**, **FC-M2 136/0 (niezlapana)**, **FC-M3 132/4**,
odtworzenie M2 Operatora: **113/23**.

---

## 7. WERDYKT

Zmiana realizuje GOAL w calosci, minimalna delta wykonywalna (4 edycje), bez naruszenia zadnej
granicy §9 ani §14, praca w commitach, galaz czysta i integrowalna bez konfliktu z `main`.
Znaleziska FC-1 i FC-3 to **limity pokrycia bramek i luki dowodowe**, nie defekty produktu;
zadne nie uzasadnia zawrocenia tematu do Operatora.

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1
GOAL: Farma nie kwalifikuje sie do budowy na heksie z nakladka Las — na zadnym terenie
      bazowym, u gracza i u komputera, we wszystkich punktach egzekwowania.
ZMIANY/COMMIT: kontrola galezi @ b0c34ea2 (kod: db25fa25; merge-base a980ea60; origin/main
      2d30335e, 1 commit do przodu, zero czesci wspolnej). 7 plikow, filtr odwrotny
      allowlisty PUSTY, delta wykonywalna 4 edycje / 7 linii. Wlasny artefakt:
      03-final-control.md.
TESTY: logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 · combat 6/6 ·
      tsc --noEmit 0 bledow · vite build --outDir /tmp/civ-dist-farma-fc OK ·
      farma-nie-w-lesie 136/0 · map-improvement-qualify 117/0 · auto-improvements 45/0 ·
      oboz-lowiecki-las 91/0 · hex-tooltip-zloze 73/1 (czerwien ZASTANA, dowod z porownania
      zrodla main vs galaz + 0 trafien 'oboz_lowiecki' w diffie). Mutacje FC: FC-M1 136/0
      NIEZLAPANA, FC-M2 136/0 NIEZLAPANA, FC-M3 132/4, odtworzenie M2 113/23.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (merge galezi do main), potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO (push wylacznie galezi tematu)
```

**GOTOWOSC DO INTEGRACJI: TAK**
