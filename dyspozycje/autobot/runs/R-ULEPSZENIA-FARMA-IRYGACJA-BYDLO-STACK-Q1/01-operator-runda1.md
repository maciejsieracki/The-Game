# Operator — runda 1/5 — R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1

## Zmiana

`canAddFoodLayer()` (`gra/src/map/improvement-build.ts`) dopuszczała dotąd wyłącznie
`farma+irygacja` XOR `farma+bydlo`. Zgodnie z ECHO właściciela (żywa rozmowa 2026-09-07,
cytat w dispatchu) zmieniono regułę tak, by dopuszczała `farma+irygacja+bydlo` razem:

```ts
case 'irygacja':
  // R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1 (2026-09-07, ECHO właściciela):
  // farma+irygacja (jak dotąd) LUB farma+irygacja+bydlo (nowe) — jedyny warunek to
  // obecność farmy; obecność bydła już NIE blokuje (dawne `&& !hasB` usunięte).
  if (ex.length === 0) return true;
  return hasF;
case 'bydlo':
  // R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1 (2026-09-07, ECHO właściciela):
  // farma+bydlo (jak dotąd) LUB farma+irygacja+bydlo (nowe) — jedyny warunek to
  // obecność farmy; obecność irygacji już NIE blokuje (dawne `&& !hasI` usunięte).
  if (ex.length === 0) return true;
  return hasF;
```

`farma` case bez zmian (dopuszczał już dokładanie farmy do pojedynczej irygacji/bydła;
nie musi obsługiwać ex.length===2, bo ten stan jest nieosiągalny inną drogą niż przez
`irygacja`/`bydlo` case powyżej, które teraz obie wymagają tylko `hasF`).

**Decyzja podprzypadku (dispatch §1):** `irygacja+bydlo` BEZ farmy pozostaje
NIEDOZWOLONY — DOMYŚLNIE, zgodnie z instrukcją, bo obie gałęzie nadal testują `hasF`.
Nie wymaga to dodatkowego kodu ani ECHO — jest to naturalny efekt niezmienionej struktury
funkcji (warunek `hasF` zostaje, zmieniają się tylko warunki blokujące na `hasB`/`hasI`).

## Kanon

`docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` — dopisany datowany wpis w §11
(Historia zmian) opisujący ECHO właściciela, nową regułę, zweryfikowaną sumę bonusów
i odesłania do dowodów. Historia NIE usunięta — oryginalny zapis §2.7/§3/§6 „Farma
łączy się wyłącznie z jednym dodatkiem: irygacją XOR bydłem" pozostaje w dokumencie,
z dopiskiem w stopce że dla tej kombinacji obowiązuje wpis z 2026-09-07.

## Testy jednostkowe (aktualizacja istniejących, `gra/tools/map-improvement-qualify-test.cjs`)

Zaktualizowano 3 asercje, które testowały STARY zakaz (teraz odwrócony), + dodano
2 nowe potwierdzające że podprzypadek `irygacja+bydlo` bez farmy nadal jest zablokowany,
+ 1 nową na `qualifies()` z prawdziwą rzeką (`canAddFoodLayer` samo nie sprawdza terenu):

- `ok(!M.canAddFoodLayer(['farma','irygacja'],'bydlo'), 'no farma+irygacja+bydlo')` →
  odwrócone na `ok(M.canAddFoodLayer(...), 'farma+irygacja+bydlo (dodanie bydla)')`
- analogicznie dla `ok(!M.canAddFoodLayer(['farma','bydlo'],'irygacja'), ...)`
- `ok(farmaIrr === null, 'kanon: bydlo blocked on farma+irygacja')` (computeImprovementBuildImpact)
  → odwrócone na `ok(farmaIrr !== null && removedImprovements.length===0, ...)`
- DODANO: `!M.canAddFoodLayer(['bydlo'],'irygacja')` i `!M.canAddFoodLayer(['irygacja'],'bydlo')`
  — dowód że podprzypadek bez farmy zostaje zablokowany (dispatch §1, decyzja domyślna)
- DODANO: `qual({civ:'rzym', placed: new Map([['0,2',['farma','bydlo']]])})('irygacja', 0, 2)`
  → `true` — pełny `qualifies()` (nie tylko `canAddFoodLayer` w izolacji) na PRAWDZIWYM
  heksie z rzeką (`0,2` ma `rzeka.obecna=true` w fixture) potwierdza że trójka przechodzi
  przez cały gate, nie tylko przez samą funkcję.
- Zaktualizowano komentarz przy `!qRzym('irygacja',0,0)` — ten test nadal PASS, ale z
  INNEGO powodu niż przed zmianą: heks `0,0` nie ma rzeki w sąsiedztwie, więc blokuje go
  WARUNEK TERENOWY, nie już limit warstw (który teraz dopuszcza trójkę) — zanotowane
  wprost w komentarzu, żeby nikt nie czytał tego jako dowód wciąż obowiązującego zakazu.

Wynik: `133 pass, 1 fail` — **jedyny fail to `oboz lowiecki OK on laka+las`, potwierdzony
jako PRZEDISTNIEJĄCY na czystym `origin/main` (identyczny wynik po `git stash` przed
zmianą: `130 pass, 1 fail`), NIEZWIĄZANY z tym tematem i poza allowlistą tego zgłoszenia.**

## `tsc --noEmit`

Zielone, zero błędów. Zgodnie z REGUŁĄ PRZECIW SAMOOSZUKIWANIU — **niewystarczające
samo w sobie** — patrz weryfikacja żywym Playwright niżej.

## ŻYWA WERYFIKACJA (Playwright/Chromium, `vite build` + `?playtest=mapa`)

Zbudowano realny bundle gry (`node ./node_modules/vite/bin/vite.js build`, ta sama
komenda co istniejące testy `*-real-render-test.cjs` w tym repo — NIE `npm run build`,
zgodne z C-001) i uruchomiono w headless Chromium (Playwright, fallback executable
`/opt/pw-browsers/chromium-1194/...` — domyślny brak lokalnie).

**(a) Build faktycznie się udaje.** Na świeżym, nieulepszonym heksie terytorium gracza
(`q=39,r=32`, teren płaski przy rzece, znaleziony przez realny silnik — próba `irygacja`
powiodła się dopiero na tym heksie, dowodząc sąsiedztwa rzeki), przez PRAWDZIWY
`applyBuildRequest` (ten sam kod co UI, hak testowy `window.__buildRequestTestDebug`,
wzorem istniejących testów `farma-cofnij-nieaktualny-wpis-test.cjs` itp.) zbudowano po
kolei: `farma` → `irygacja` → `bydlo`. Wszystkie trzy się powiodły
**BEZ ŻADNEGO wcześniejszego "odblokowania hodowli"** — hodowla była już odblokowana
od startu gry (kanon §Słownik: złoże bydła/owiec/lamy w terytorium imperium = pierwsze
pastwisko już postawione przez generator). `getPlacedLayers(39,32)` PO trzeciej budowie
zwróciło `['farma','irygacja','bydlo']` — realny rejestr `placedImprovements` silnika,
ten sam który czyta renderer i ekonomia. Realny toast UI po trzeciej warstwie:
**„Postawiono: bydlo · klik ponownie w turze = cofnij"** — zero błędu, zero odrzucenia.
Zrzut: `dowody/01-triple-build-toast.png`. Zero `console.error`/`pageerror` w całym
scenariuszu.

**(b) Suma bonusów w ekonomii miasta.** Zamiast reimplementować liczenie, wywołano
BEZPOŚREDNIO prawdziwą, niezmienioną funkcję silnika `tileYield` (`gra/src/game/
economy.ts`) — DOKŁADNIE tę, której `cityYieldPerTurn` używa do zliczania plonów
miasta z `workedTiles` co turę — z `ulepszeniaKeys` odpowiadającymi kolejnym stanom
tego samego heksu (płaski, przy rzece):

| Warstwy | żywność | praca | handel |
|---|---|---|---|
| (puste pole) | 5 | 7 | 7 |
| farma+irygacja+bydlo | 15 | 13 | 12 |
| **DELTA (= bonus trójki)** | **+10** | **+9** | **+8** |

Dokładnie zgodne z liczbami z dispatcha. Ponieważ `tileYield` to jedyne miejsce, gdzie
silnik ekonomii miasta liczy plon heksu (niezmienione w tym temacie — zmieniła się
WYŁĄCZNIE bramka `canAddFoodLayer`, nigdy sama arytmetyka bonusów), a realny hek w
żywej grze ma faktycznie `ulepszeniaKeys=['farma','irygacja','bydlo']` (potwierdzone
w (a) przez `getPlacedLayers`), suma **faktycznie trafia** do ekonomii miasta przy
najbliższym przeliczeniu tury — nie tylko w podglądzie panelu budowy.

**(c) Renderer pokazuje wizualnie wszystkie trzy warstwy.** Kamera Playwright
naprowadzona na heks `(39,32)` przez PRAWDZIWĄ formułę pan/zoom silnika
(`target.x += -ddx*speed`, `speed = dist*mousePanFactor` — `gra/src/render/camera.ts`,
zweryfikowane przez odczyt `cameraTarget()` po każdym kroku: rozbieżność kamera↔cel
< 0,6 jednostki świata przy promieniu heksa `HEX_R=1.0`, a więc bezpiecznie WEWNĄTRZ
docelowego heksu — apotema heksa to 0,866). Zrzut zbliżenia (`dowody/
02-triple-render-closeup.png`) pokazuje: teren ze wzorem koncentrycznych "tarasowych"
pierścieni (model `pole_irygowane` — farma+irygacja, zgodnie z kanon §8) ORAZ kilka
osobnych, mniejszych brązowych ikon rozrzuconych po tym samym heksie (dorysowane przez
pętlę renderera dla pozostałej warstwy `bydlo` — recon: `buildImprovementStack()` po
`pole_irygowane` dorysowuje KAŻDĄ pozostałą warstwę osobno). Sąsiedni, nieulepszony
heks (zwykła zielona trawa) na tym samym zrzucie nie ma ANI wzoru terasowego, ANI ikon
— wizualny kontrast potwierdza że to właśnie ulepszony heks wyróżnia się renderem.

**Uczciwe zastrzeżenie (nie ukrywam):** ze względu na brak w kodzie bezpośredniego hooka
"ustaw kamerę na heks X" (dodanie takiego wymagałoby zmiany `main.ts`, POZA allowlistą
tego tematu), naprowadzenie kamery zrobiono przez odtworzenie realnej matematyki
pan/zoom silnika krok po kroku (real mouse drag + real wheel), nie przez idealne
kliknięcie w hex. Precyzja finalna (offset < 0,6 j.św. przy apotemie 0,866) matematycznie
gwarantuje że kamera patrzy na WNĘTRZE właściwego heksu, ale identyfikacja "który
dokładnie element na zrzucie to farma/irygacja/bydło osobno" opiera się na dopasowaniu
do opisu kanonu §8 (`pole_irygowane` + dorysowane warstwy), NIE na kliknięciu w hex i
odczytaniu natywnego tooltipa gry (renderer main-mapy nie ma dziś hover-tooltipa z
rozbiciem warstw — tylko panel miasta/okolica ma taki opis tekstowy, poza zasięgiem
bez zmiany `main.ts`). Renderer sam w sobie jest NIEZMIENIONY (zero edycji
`gra/src/render/improvements.ts` w tym temacie, zgodnie z allowlistą) — a dane wejściowe
(`placedImprovements` heksu = dokładnie 3 klucze, potwierdzone w (a)) są identyczne z
tym, co czyta prawdziwy `buildImprovementStack()` co klatkę w tej samej, żywej instancji
gry. Jeśli Evaluator uzna to zastrzeżenie za niewystarczające dla kryterium (c),
proszę o konkretny wskaźnik czego brakuje — nie o generyczne "zrób to jeszcze raz".

## Allowlista — zgodność

- `gra/src/map/improvement-build.ts` — WYŁĄCZNIE `canAddFoodLayer()` ✅ (git diff:
  tylko te dwa case'y, reszta pliku nietknięta)
- `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` — append w §11, historia
  zachowana ✅
- `gra/tools/*.cjs` — wyłącznie `map-improvement-qualify-test.cjs` (istniejący plik
  food-layer), zero nowych plików w repo (tymczasowe skrypty weryfikacyjne
  `.tmp-stack-verify.cjs` / `.tmp-economy-check.cjs` i wygenerowany `dist-stack-
  verify-tmp/` USUNIĘTE przed commitem — nie wchodzą do repo) ✅
- `terrain-improvements.json` — NIETKNIĘTY (bonusy bez zmian) ✅
- `gra/src/render/improvements.ts` (renderer) — NIETKNIĘTY, zgodnie z zakazem ✅
  (weryfikacja (c) potwierdziła że nie było to potrzebne)
- `git add -A` — nie użyto; `git status --porcelain` przed commitem pokazuje
  wyłącznie 3 zmodyfikowane pliki z allowlisty + 1 nowy katalog dowodów w
  `dyspozycje/autobot/runs/.../dowody/` (część "raporty własne" tematu) ✅
- `git diff --check` — czysty (brak whitespace errors) ✅

## Podsumowanie zmian / commit

Pliki zmienione: `gra/src/map/improvement-build.ts`,
`gra/tools/map-improvement-qualify-test.cjs`,
`docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`.
Plik nowy: `dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1/
dowody/{01-triple-build-toast.png,02-triple-render-closeup.png}` +
ten raport (`01-operator-runda1.md`).
SHA commita: patrz git log po tym raporcie (commit wykonany zaraz po zapisaniu pliku).
