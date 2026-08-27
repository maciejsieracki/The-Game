# 01 — OPERATOR (runda 1) — R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1

ROLA: Operator (Opus 5, effort high) · DATA: 2026-08-27 · RUNDA: 1/5
WORKTREE: `/home/user/wt-op-hodowla-las` · GAŁĄŹ: `autobot/R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1`
BAZA: `origin/main` @ `9015380b`

---

## 1. Co zostało zrobione

Zakaz budowy hodowli zwierzęcej na nakładce Las (decyzja Maciej 2026-07-29) zostaje COFNIĘTY
dla `owce`, `bydlo` (Trzoda) i `lama` — ECHO właściciela 2026-08-27: „Tak, odwracamy —
wszystkie trzy". Każda z trzech kwalifikuje się na zalesionym heksie wg WŁASNEJ reguły terenu
bazowego (Wzgórza — owce, Łąka/Równina — bydło, Wzgórza/Góry — lama); reszta kwalifikacji
(teren, cywilizacja, epoka, sektory, terytorium) bez zmian.

---

## 2. WŁASNA inwentaryzacja punktów egzekwowania zakazu (kryterium 2)

Zrobiona od zera dla hodowli, NIE przepisana z tematu obozu łowieckiego. Kolumna „vs obóz"
mówi, gdzie hodowla różni się od tamtej inwentaryzacji — bo różni się w pięciu punktach.

| # | Punkt egzekwowania | Gdzie | Stan | vs obóz łowiecki |
|---|---|---|---|---|
| P1 | Ścieżka GRACZA — panel budowy | `improvement-build.ts` `createQualifier`/`qualifies()`, `case 'owce'/'bydlo'/'lama'` + `isOwceBaseTerrain` | **NAPRAWIONE** | RÓŻNICA: obóz miał JEDEN warunek (nakładka Las) w jednym miejscu; hodowla ma TRZY różne reguły terenu i zakaz był egzekwowany w **trzech** miejscach — dla owiec wewnątrz osobnej funkcji `isOwceBaseTerrain`, dla bydła i lamy przez wywołanie wspólnego predykatu w gałęzi `switch` |
| P2 | Gate commitu POZA panelem | `computeImprovementBuildImpact` → `isImprovementBlockedOnForest` | **NAPRAWIONE** (owce/bydlo/lama dopisane do `FOREST_COEXIST_IMPROVEMENT_KEYS`) | To samo miejsce, które u obozu było dziurą **P7** |
| P3 | `applyBuildRequest` (klik w mapę) | `main.ts:11709` — woła `computeImprovementBuildImpact` + `isImprovementBlockedOnForest` | **NAPRAWIONE POŚREDNIO** przez P2; `main.ts` NIE dotknięty (poza allowlistą) | jw. |
| P4 | Automat ulepszeń miasta | `game/auto-improvements.ts` `pickAutoImprovements` → `buildImprovementQualifier` | **NAPRAWIONE POŚREDNIO**, potwierdzone pomiarem behawioralnym | tak samo |
| P5 | **AI CYWILIZACJI** | `game/ai.ts:1984` `planCityImprovements` → ta sama `pickAutoImprovements` | **NAPRAWIONE POŚREDNIO**; sprawdzone grepem, że jedynymi konsumentami `buildImprovementQualifier` są `auto-improvements.ts` i `main.ts` — AI CYWILIZACJI **nie ma** własnej, osobnej ścieżki kwalifikacji | tak samo |
| P6 | Tooltip heksu | `ui/hexContextTooltip.ts` `listTerrainPossibleImprovements` | **BEZ ZMIAN — zweryfikowane pomiarem, nie założeniem** (patrz §6) | RÓŻNICA: obóz WYMAGAŁ tu poprawki (asymetria tooltip↔silnik); hodowla nie, bo tooltip ma własny, świadomie węższy filtr złoża (`nakladka !== ZlozeOwiec/ZlozeBydla/ZlozeLamy`), który działa tak samo dla lasu i dla gołego terenu |
| P7 | `galleryTerrainEligible` (galeria 3D + 1. filtr tooltipa) | `improvement-build.ts` | **BEZ ZMIAN**, objęte asercjami | RÓŻNICA: obóz wymagał tu poprawki (Łąka\|Równina gubiło las na wzgórzu); hodowla nie — jej reguła to teren bazowy, a las był DRUGĄ, niezależną bramką |
| P8 | Migracja save/load | `game/terrain-improvements.ts` `migrateImprovementLayers` | **NIEPOTRZEBNA — sprawdzone, nie założone** | RÓŻNICA ISTOTNA: obóz **zaostrzał** regułę, więc stare save'y mogły zawierać stan już nielegalny i wymagały migracji. Ten temat **luzuje** regułę — żaden istniejący zapis nie staje się nielegalny, bo zbiór stanów legalnych tylko rośnie |
| P9 | Wyrąb lasu spod ulepszenia | `stripImprovementsWhenForestRemoved` / `FOREST_DEPENDENT_IMPROVEMENT_KEYS` | **BEZ ZMIAN — świadomie**, objęte asercją: hodowla po wyrębie ZOSTAJE (las nie jest jej warunkiem, jest tylko dopuszczony) | RÓŻNICA: obóz znika po wyrębie (ECHO wariant A), hodowla nie |
| P10 | Dane / CivPedia | `gra/data/terrain-improvements.json` pola `warunek`+`teren`, renderowane przez `ui/entityCards/improvementAdapter.ts:128` | **NAPRAWIONE w danych** (kod UI nietknięty — czyta z JSON) | tak samo |
| P11 | Podpowiedź blokady lasu | `getImprovementForestBlockHint` | **NAPRAWIONE** — gałąź hodowlana („postaw Obóz łowiecki") stała się martwa i kłamiąca, USUNIĘTA | nowy punkt, u obozu nieobecny |
| P12 | Tryb pokazowy `?demo=ulepszenia` | `main.ts:12031` `demoKeysForHex` — lista dla Lasu to `['farma','tartak','oboz_lowiecki','droga']` | **NIE NAPRAWIONE — ZGŁOSZONE** (`main.ts` poza allowlistą; to tryb pokazowy, nie rozgrywka). Uwaga: ta lista jest niespójna też po tamtym temacie — nadal zawiera `farma`, mimo zakazu z 2026-08-27 | nowy punkt |
| P13 | Render kępy lasu / relief pod ulepszeniem | `main.ts:11797` `keepsReliefUnderImprovement` i `main.ts:11840` `syncImprovementDecorForHex` — `foodOnForest` obejmuje tylko `'farma'` i `'bydlo'` | **NIE NAPRAWIONE — ZGŁOSZONE, BRAK DOWODU wizualnego** (patrz §7) | nowy punkt |

**Punktów po mojej stronie: 13** (obóz miał 7). Trzy z nich (P8, P9, P12/P13) nie istniały
w tamtej inwentaryzacji albo mają odwrotny znak — dlatego dispatch słusznie kazał liczyć od zera.

---

## 3. Zmiany (allowlista)

| Plik | Co |
|---|---|
| `gra/src/map/improvement-build.ts` | `isLivestockImprovementBlockedOnForest` → **`isStadninaBlockedOnForest`** (zakaz zawężony); `owce`/`bydlo`/`lama` dopisane do `FOREST_COEXIST_IMPROVEMENT_KEYS`; `isOwceBaseTerrain` dopuszcza `Nakladka.Las`; usunięte gate'y lasu w `qualifies()` dla bydła i lamy; usunięta martwa gałąź hodowlana w `getImprovementForestBlockHint`; usunięty alias `isAnimalFarmBlockedOnForest`; usunięty nieużywany import `isLivestockImprovementKey` |
| `gra/data/terrain-improvements.json` | `owce`, `bydlo`, `lama` — `warunek` i `teren` bez zakazu lasu, ze ŚLADEM decyzji (data zakazu 2026-07-29 + data cofnięcia 2026-08-27 + cytat ECHO); `stadnina` — jawny zapis, że JEJ zakaz ZOSTAJE i dlaczego |
| `gra/tools/hodowla-las-test.cjs` | **NOWA bramka tematu** — 100 asercji |
| `gra/tools/hodowla-las-measure.cjs` | **NOWA sonda** pomiaru PRZED/PO (5 ziaren × wszystkie klucze × 2 profile cywilizacji) |
| `gra/tools/map-improvement-qualify-test.cjs` | asercje zakazu odwrócone (stare brzmienia zostawione w komentarzu — historia decyzji), dołożone kontrolne; 117 → **126**, 0 fail |

COMMITY (gałąź `autobot/R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1`):
- `e2760aca` — zmiana silnika, danych i bramek
- `9c82378c` — usunięcie tautologii w asercjach kontrolnych bramki tematu

`main.ts` NIE został dotknięty. `gra/src/ui/**` NIE zostało dotknięte (okazało się niepotrzebne —
patrz P6/P10). `dyspozycje/WERSJE.md` NIE dotknięty. Żadnego `git add -A`.

---

## 4. DECYZJA ZAKRESOWA, którą musi zobaczyć właściciel — `stadnina`

Predykat, który egzekwował zakaz, brzmiał `nakladka === Las && isLivestockImprovementKey(key)`.
`isLivestockImprovementKey` wywodzi się z JSON: klucz jest „hodowlany", gdy
`surowiecOdblokowany ∈ {bydlo, owce, lama, kon}` — a `stadnina` ma `surowiecOdblokowany: "kon"`.
**Stadnina wpadła w zakaz z 2026-07-29 pochodną definicji, nie decyzją.** ECHO właściciela
mówi „wszystkie trzy" i wymienia owce, bydło, lamę — stadniny tam nie ma.

Dlatego zakaz **zostawiłem dla stadniny**, zawężając funkcję zamiast ją kasować. Skutek jest
realnie obserwowalny, więc nie jest to kosmetyka: stadnina po imperialnym odblokowaniu Konia
(`isLivestockUnlockedForPlacement`) nie wymaga już złoża na heksie, więc bez zakazu wpuściłby ją
**każdy** zalesiony heks Łąki/Równiny — na 5 zmierzonych mapach to 725 nowych pól.

**PYTANIE DO WŁAŚCICIELA (nie blokuje tematu, nie rozstrzygałem sam):** czy stadnina też ma
wejść do lasu? Dziś: NIE (stan sprzed tego tematu, bez zmian).

---

## 5. Pomiar PRZED/PO (kryteria 4 i 5)

Sonda: `gra/tools/hodowla-las-measure.cjs`. Metoda behawioralna — pełny
`buildImprovementQualifier` (ta sama funkcja, którą wołają panel gracza, automat miasta i AI
CYWILIZACJI), nie grep i nie sam predykat blokady. Mapa 36×28 `kontynenty`, terytorium gracza =
cała mapa (izolacja reguły terenu od reguły zasięgu miasta), wszystkie techy, epoka 5.
**5 ziaren** (wymagane ≥3). Profil `rzym` dla owiec/bydła/stadniny, `inkowie` dla lamy.

### 5a. Kwalifikacje NA HEKSACH Z LASEM — per ziarno

| ziarno | heksów z lasem | owce PRZED→PO | bydło PRZED→PO | lama PRZED→PO | stadnina PRZED→PO |
|---|---|---|---|---|---|
| 90210 | 148 | 0 → **10** | 0 → **138** | 0 → **10** | 0 → 0 |
| 777 | 164 | 0 → **9** | 0 → **155** | 0 → **9** | 0 → 0 |
| 31415 | 145 | 0 → **14** | 0 → **131** | 0 → **14** | 0 → 0 |
| 20260827 | 160 | 0 → **13** | 0 → **147** | 0 → **13** | 0 → 0 |
| 4242 | 160 | 0 → **6** | 0 → **154** | 0 → **6** | 0 → 0 |
| **razem** | **777** | **0 → 52** | **0 → 725** | **0 → 52** | **0 → 0** |

Rozbicie terenu bazowego pod lasem (PO): owce `{Wzgorza: 52}`, bydło `{Laka: 716, Rownina: 9}`,
lama `{Wzgorza: 52}` — dokładnie własne reguły terenu każdej z trzech. Lamy w Górach z lasem
jest 0, bo generator nie zalesia Gór (nie jest to skutek zakazu — reguła lamy w Górach jest
zweryfikowana syntetycznie w bramce tematu).

### 5b. Dowód, że reszta kwalifikacji NIE drgnęła (kryterium 5)

Porównanie **wszystkich 22 kluczy ulepszeń × 2 profile cywilizacji = 44 pola**, każde w rozbiciu
LAS / BEZ-LASU:

```
ZMIENIONYCH:  5 | BEZ ZMIAN: 39
DELTA [rzym]    bydlo: LAS 0->725  BEZ-LASU 468->468
DELTA [rzym]    owce:  LAS 0->52   BEZ-LASU  79->79
DELTA [inkowie] bydlo: LAS 0->725  BEZ-LASU 468->468
DELTA [inkowie] owce:  LAS 0->52   BEZ-LASU  79->79
DELTA [inkowie] lama:  LAS 0->52   BEZ-LASU 196->196
```

Zmieniła się WYŁĄCZNIE kolumna „na lesie" i WYŁĄCZNIE dla trzech kluczy z ECHO. Kolumna
„bez lasu" jest identyczna dla wszystkich 22 kluczy, w tym dla tych trzech. To jest naprawa
jednego wyjątku, nie przeprojektowanie reguły terenu.

---

## 6. Tooltip heksu — pomiar, nie założenie (P6)

Osobna sonda na żywym `buildHexContextTooltipHtml` (jsdom-free, stub `brandAssets` jak w
istniejących bramkach), uruchomiona DWA RAZY: na `origin/main` i na tej gałęzi. Wynik
**bajtowo identyczny** w obu przebiegach:

```
Wzgorza+Las         Owce=nie  Trzoda=nie  Lama=nie  Stadnina=nie  Tartak=TAK Oboz=TAK
Wzgorza+Brak        Owce=nie  Trzoda=nie  Lama=nie  Stadnina=nie  Tartak=nie Oboz=nie
Laka+Las            Owce=nie  Trzoda=nie  Lama=nie  Stadnina=nie  Tartak=TAK Oboz=TAK
Laka+Brak           Owce=nie  Trzoda=nie  Lama=nie  Stadnina=nie  Tartak=nie Oboz=nie
Wzgorza+ZlozeOwiec  Owce=TAK  Trzoda=nie  Lama=nie  Stadnina=nie  Tartak=nie Oboz=nie
Gory+Las            Owce=nie  Trzoda=nie  Lama=nie  Stadnina=nie  Tartak=nie Oboz=TAK
```

Wniosek: tooltip pokazuje hodowlę wyłącznie na jej złożu, bo ma własny filtr
`nakladka !== Zloze*` — świadomie węższy od silnika (udokumentowane w docstringu tej funkcji:
stan imperium celowo pominięty). Ten temat **nie tworzy** nowej asymetrii tooltip↔silnik.

**ZGŁOSZENIE (nie ten temat):** istniejąca luka się jednak POSZERZA — po zmianie jest więcej
pól, na których silnik hodowlę dopuszcza, a tooltip jej nie pokazuje (777 zalesionych heksów na
5 mapach doszło do już istniejącej luki „goły teren po odblokowaniu"). To dług sprzed tego
tematu, ale wart osobnego ID.

---

## 7. BRAK DOWODU — warstwa wizualna (P13), §13a

`main.ts` (poza allowlistą) chowa kępę lasu pod ulepszeniem żywnościowym warunkiem
`foodOnForest = nakladka === Las && layers.some(k => k === 'farma' || k === 'bydlo')`.
Po tej zmianie:

- **bydło** na Łące/Równinie z lasem → kępa lasu ZOSTAJE SCHOWANA (stare zachowanie z reguły
  2026-07-21, teraz znów osiągalne),
- **owce/lama** na Wzgórzu z lasem → kępa lasu ZOSTAJE WIDOCZNA, bo `owce`/`lama` nie ma
  w tym warunku, a `preservesHillRelief(['owce'])` jest `true` (klucz jest na liście
  `PRESERVES_HILL_RELIEF_EXPLICIT_KEYS`), więc `syncImprovementDecorForHex` wychodzi wcześniej.

Czyli trzy hodowle będą renderowane na lesie **niejednolicie**. **NIE WERYFIKOWAŁEM tego
w przeglądarce i nie mam na to dowodu** — zgodnie z §13a raportuję to jako BRAK DOWODU, a nie
jako „działa". Zielone bramki tego nie pokrywają: żadna z nich nie rusza rendera.
Naprawa wymaga `main.ts`, czyli poszerzenia allowlisty → osobny temat/decyzja orkiestratora.

---

## 8. Dowód nie-tautologiczny (kryterium 6)

**33 celowane mutacje źródła**, każda nakładana pojedynczo i cofana (`git checkout --`), po
każdej uruchamiane obie bramki. Sterownik: `mutdrive.py` (scratch, poza repo).

| mutacja | hodowla-las-test | map-improvement-qualify-test | zaczerwienionych asercji |
|---|---|---|---|
| M1 `isOwceBaseTerrain`: Las → `return false` (przywrócenie zakazu) | 89/11 fail | 122/4 fail | 15 |
| M2 `qualifies/bydlo`: dodany gate `nakladka !== Las` | 94/6 fail | 125/1 fail | 7 |
| M3 `qualifies/lama`: dodany gate `nakladka !== Las` | 94/6 fail | 126/0 | 6 |
| M4 `computeImprovementBuildImpact`: twarda blokada hodowli na lesie | 76/24 fail | 121/5 fail | 29 |
| M5 `isImprovementBlockedOnForest`: hodowla znów blokowana | 73/27 fail | 118/8 fail | 32 |
| M6 `isStadninaBlockedOnForest` → `return false` | 92/8 fail | 124/2 fail | 10 |
| M7 `isStadninaBlockedOnForest` → `return true` | 93/7 fail | 122/4 fail | 11 |
| M8 `isImprovementBlockedOnForest`: brak wczesnego wyjścia poza lasem | 95/5 fail | 117/9 fail | 14 |
| M9 `stripImprovementsWhenForestRemoved`: zdejmuje też hodowlę | 99/1 fail | 126/0 | 1 |
| M10 `stripImprovementsWhenForestRemoved`: nic nie zdejmuje | 99/1 fail | 126/0 | 1 |
| M11 `stripImprovementsWhenForestRemoved`: zdejmuje też tartak | 99/1 fail | 125/1 fail | 2 |
| M12 `getImprovementForestBlockHint`: przywrócona gałąź hodowlana | 98/2 fail | 126/0 | 2 |
| M13 `isOwceBaseTerrain`: usunięty warunek terenu (Wzgórza) | 93/7 fail | 124/2 fail | 9 |
| M14 `isOwceBaseTerrain`: dowolna nakładka dozwolona | 99/1 fail | 125/1 fail | 2 |
| M15 `isOwceBaseTerrain`: gołe Wzgórze (Brak) już nie kwalifikuje | 97/3 fail | 124/2 fail | 5 |
| M16 `isOwceBaseTerrain`: usunięty warunek ZłożeOwiec | 99/1 fail | 124/2 fail | 3 |
| M17 `qualifies/bydlo`: teren bazowy bez znaczenia | 97/3 fail | 126/0 | 3 |
| M18 `qualifies/bydlo`: żaden teren nie kwalifikuje | 93/7 fail | 120/6 fail | 13 |
| M19 `qualifies/lama`: teren bazowy bez znaczenia | 99/1 fail | 125/1 fail | 2 |
| M20 `qualifies/lama`: żaden teren nie kwalifikuje | 93/7 fail | 125/1 fail | 8 |
| M21 `FOREST_BLOCKED`: irygacja/tarasy już nie blokowane | 98/2 fail | 122/4 fail | 6 |
| M22 `isFarmBaseTerrain`: las już nie blokuje farmy | 100/0 | 124/2 fail | 2 |
| M23 `galleryTerrainEligible`: hodowla wszędzie dozwolona | 97/3 fail | 126/0 | 3 |
| M24 `galleryTerrainEligible`: hodowla nigdzie niedozwolona | 97/3 fail | 126/0 | 3 |
| M25 `isLivestockAllowed`: lama dla każdej cywilizacji | 99/1 fail | 123/3 fail | 4 |
| M26 `isLivestockAllowed`: brak bramki epoki Nowego Świata | 98/2 fail | 126/0 | 2 |
| M27 generator: las nie nakładany (jedno miejsce) | 96/4 fail | 126/0 | 4 |
| M28 JSON: przywrócone brzmienie sprzed cofnięcia zakazu | 95/5 fail | 126/0 | 5 |
| M29 `FOREST_BLOCKED` bez farmy + `isFarmBaseTerrain` bez gate lasu | 93/7 fail | 121/5 fail | 12 |
| M30 `isImprovementBlockedOnForest`: blokuje owce także POZA lasem | 97/3 fail | 124/2 fail | 5 |
| M31 generator: żaden las nie powstaje (oba miejsca) | 88/12 fail | 126/0 | 12 |
| M32 JSON: skasowany ślad decyzji w `owce.warunek` | 98/2 fail | 126/0 | 2 |
| M33 `isFarmBaseTerrain` → `return false` | 95/5 fail | 121/5 fail | 10 |

**POKRYCIE:**
- `hodowla-las-test.cjs`: **100/100 asercji** czerwieni się pod co najmniej jedną mutacją.
  Niepokrytych: **0**.
- `map-improvement-qualify-test.cjs`: 14 nowych/zmienionych, żywych asercji — wszystkie pokryte.
  (Skaner wyłapał dodatkowo 6 stringów, które są ZAKOMENTOWANYMI starymi brzmieniami
  w liniach `//   ok(...)` — zachowaną historią decyzji, nie asercjami; zweryfikowane grepem.)

**Znalezione i naprawione TAUTOLOGIE we własnej bramce (commit `9c82378c`):** asercje
„stadnina/farma NIE na lesie" przechodziły z niewłaściwego powodu — bez odblokowania Konia
stadnina nie kwalifikuje się NIGDZIE poza złożem, więc jej brak na lesie niczego nie dowodził.
Dodane: `tradeRouteKonUnlocked` w stanie gracza, heks ze złożem konia z postawioną stadniną
w mapie automatu (realne `empireUnlocks`), oraz warunki istotności „stadnina/farma kwalifikują
się POZA lasem (>0)" na każdym ziarnie. Po naprawie te asercje czerwienią się pod M6/M7/M29/M33.

---

## 9. Bramki (kryteria 7, 8, 9)

Wszystkie uruchomione własnoręcznie z `gra/`, na tej gałęzi, w timeout:

| bramka | baseline na `origin/main` | po zmianie | werdykt |
|---|---|---|---|
| `logic-test` | 213/213 | **213/213** | bez pogorszenia |
| `tech-tree-test` | 19 pass / 0 fail | **19 / 0** | bez pogorszenia |
| `research-test` | 33/33 | **33/33** | bez pogorszenia |
| `unit-replace-test` | 13/13 | **13/13** | bez pogorszenia |
| `combat-test` | 6/6 | **6/6** | bez pogorszenia |
| `map-improvement-qualify-test` | **117 pass / 0 fail** (zmierzone na świeżym `main`, zgodnie z kryterium 8) | **126 pass / 0 fail** | bez pogorszenia (+9 asercji) |
| `oboz-lowiecki-las-test` (kryt. 9) | 91 passed / 0 failed | **91 / 0** | bez pogorszenia |
| `farma-nie-w-lesie-test` (kontrola sąsiedniego tematu) | 136 passed / 0 failed | **136 / 0** | bez pogorszenia |
| `hodowla-las-test` (NOWA bramka tematu) | — | **100 passed / 0 failed** | — |
| `tsc --noEmit` | 0 błędów | **0 błędów** | bez pogorszenia |
| build `vite` → `/tmp/civ-dist-hodowla-las-op` | — | **✓ built in 24.09s**, 848 modułów | OK |

**ZNALEZISKO — bramka czerwona JUŻ NA `main`, nie z mojej winy:**
`food-hodowla-test` = **20 OK / 4 FAIL** na `origin/main` @ `9015380b` ORAZ identycznie po mojej
zmianie — te same cztery asercje, ta sama treść (`bydlo +3 praca (4 === 3)`,
`farma+bydlo delta = +3 praca (7 === 3)`, `Model B: bydlo w zasięgu → active Trzoda`,
`bydlo w zasięgu → active Trzoda`). Nie jest w moich kryteriach końca, nie ruszałem jej,
ale zgłaszam — wygląda na rozjazd bramki z korektą balansu bonusów.

---

## 10. Granice (§9) — potwierdzenie

- ✅ Bez `npm run build` / `npm run dev`. Build wyłącznie
  `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-hodowla-las-op --emptyOutDir`.
- ✅ Bez `npx`. Bez `git add -A` / `git add .` — commit po konkretnych ścieżkach.
- ✅ Bez pushu do `main`, bez integracji, bez deployu. Push wyłącznie gałęzi tematu.
- ✅ `dyspozycje/WERSJE.md` nietknięty.
- ✅ `isFarmBaseTerrain` i `FOREST_BLOCKED_IMPROVEMENT_KEYS` NIETKNIĘTE w commicie
  (reguła farmy) — dotykałem ich wyłącznie w mutacjach M21/M22/M29/M33, każda cofnięta
  przez `git checkout --` i zweryfikowana czystym `git status`.
- ✅ `FOREST_DEPENDENT_IMPROVEMENT_KEYS` (reguła obozu łowieckiego) NIETKNIĘTE w commicie;
  jw. wyłącznie mutacje M9–M11, cofnięte.
- ✅ Bez sekretów w diffie. `git diff --check` czysty.
- ✅ Bez poszerzania zakresu (§14) — stadnina świadomie zostawiona, zgłoszona właścicielowi (§4).
- ⚠️ Warstwa wizualna: BRAK DOWODU (§7). Nie deklaruję, że wygląda poprawnie.

---

## 11. Współbieżność

Temat `R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1` może równolegle dotykać
`improvement-build.ts`. Moje zmiany w tym pliku są rozłączne z regułą farmy (nie tknąłem
`isFarmBaseTerrain` ani `FOREST_BLOCKED_IMPROVEMENT_KEYS`), ale **stykają się z nim
sąsiedztwem tekstu** w `FOREST_COEXIST_IMPROVEMENT_KEYS` i w komentarzach — przy integracji
oczekiwać konfliktu tekstowego, nie semantycznego. Sugerowana kolejność: dowolna, ale
`git merge --no-ff` od `git merge-base`, nigdy naiwny `git diff origin/main..gałąź` (§9 poz. 9).

---

## KONTRAKT RAPORTU

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1
GOAL: Hodowla zwierzeca (owce, bydlo, lama) przestaje byc zakazana na heksach z nakladka Las;
      kazda kwalifikuje sie wg wlasnej reguly terenu bazowego, reszta kwalifikacji bez zmian.
ZMIANY/COMMIT: galaz autobot/R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1;
      e2760aca (silnik+dane+bramki), 9c82378c (usuniecie tautologii w bramce tematu).
      Pliki: gra/src/map/improvement-build.ts, gra/data/terrain-improvements.json,
      gra/tools/hodowla-las-test.cjs (nowy), gra/tools/hodowla-las-measure.cjs (nowy),
      gra/tools/map-improvement-qualify-test.cjs. main.ts i gra/src/ui/** NIE dotkniete.
TESTY: logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 · combat 6/6 ·
      map-improvement-qualify 126/0 (baseline na main: 117/0) · oboz-lowiecki-las 91/0 ·
      farma-nie-w-lesie 136/0 · hodowla-las-test 100/0 (nowa) · tsc --noEmit 0 bledow ·
      vite build do /tmp/civ-dist-hodowla-las-op OK.
      Pomiar PRZED/PO na 5 ziarnach: owce 0->52, bydlo 0->725, lama 0->52 heksow z lasem;
      44 pola (22 klucze x 2 profile cyw.) porownane — zmienilo sie 5, wszystkie inne 0 delty.
      Dowod mutacyjny: 33 celowane mutacje, pokrycie 100/100 asercji bramki tematu.
      ZNALEZISKO: food-hodowla-test 20 OK / 4 FAIL JUZ NA origin/main @ 9015380b — identycznie
      przed i po moja zmiana; nie w kryteriach konca, zglaszam.
BLOKADY: brak blokad wykonania. Do decyzji wlasciciela (NIE blokuje):
      (1) czy stadnina tez ma wejsc do lasu — zostala zabroniona, wpadla w zakaz 2026-07-29
          pochodna definicji surowiecOdblokowany='kon', a ECHO objelo tylko trzy klucze;
      (2) BRAK DOWODU wizualnego: bydlo na lesie chowa kepe lasu, owce/lama jej nie chowaja
          (main.ts foodOnForest) — niejednolity render, main.ts poza allowlista, nie
          weryfikowane w przegladarce;
      (3) demoKeysForHex (?demo=ulepszenia, main.ts) nie zna hodowli na lesie i nadal wymienia
          farme — poza allowlista;
      (4) tooltip heksu nadal nie pokazuje hodowli bez zloza (dlug sprzed tematu, luka sie
          poszerza) — zmierzone, PRZED i PO identycznie.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Opus 5, effort high) — niezalezna weryfikacja SCOPE, regresji,
      dowodow, oraz rozstrzygniecie, czy zawezenie zakazu do stadniny jest wlasciwa
      interpretacja ECHO „wszystkie trzy".
DEPLOY/PUSH: DEPLOY — NIE WYKONANO. PUSH — wylacznie galaz tematu (nie main).
```
