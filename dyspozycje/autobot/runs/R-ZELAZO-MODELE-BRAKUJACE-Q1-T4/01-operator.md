# 01 — OPERATOR (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-ZELAZO-MODELE-BRAKUJACE-Q1-T4`
GOAL: Zbudować nowy, dedykowany model 3D dla **Jeździec z oszczepami** (epoka Żelazo,
kultura Słowianie) — dziś generyczny model kategorii `konnica` z kopią/lancą, mimo że
to lekka, dystansowa jednostka oszczepnicza.

MODEL WYKONAWCY: **Opus 5** (`claude-opus-5[1m]`, odczytane ze środowiska sesji, nie
z pamięci). Effort: **NIEPOTWIERDZALNY** — parametr wysiłku nie jest w tej sesji
widoczny jako odczytywalna wartość, więc zgodnie z §13a nie deklaruję go jako faktu.
Dispatch wymaga Opus 5 High; wymóg MODELU spełniony, wymóg EFFORT niesprawdzalny
po stronie Operatora.

ZMIANY/COMMIT: 3 pliki, dokładnie w allowliście (+ artefakt runu):
- `gra/src/render/zelazo-jezdziec-oszczepami-opus5.ts` (nowy, builder + sekcja K1-K13)
- `gra/src/render/units.ts` (WYŁĄCZNIE: import + 1 gałąź nazwana w `buildNamedUnit`;
  generyczny `case 'konnica'` nietknięty — asercja 0c to sprawdza)
- `gra/tools/zelazo-jezdziec-oszczepami-real-render-test.cjs` (nowy)
- `dyspozycje/autobot/runs/R-ZELAZO-MODELE-BRAKUJACE-Q1-T4/01-operator.md`
SHA: patrz `git log` gałęzi `autobot/ZELAZO-T4-Q1`.

TESTY (wszystkie uruchomione, wyniki wklejone z przebiegu, nie z pamięci):
- `zelazo-jezdziec-oszczepami-real-render-test.cjs` — **57/57**
- T1 `zelazo-konnica-asyryjska` 31/31 · T2 `zelazo-celtowie-soldurii-gaesatae` 42/42 ·
  T3 `zelazo-falanga` 40/40 · `zelazo-gate-test` 24/24
- `tsc --noEmit` 0 błędów · `vite build` (C-001: `node ./node_modules/vite/bin/vite.js`,
  `--outDir /tmp/civ-t4-dist`) OK, `gra/dist` NIE powstało
- Bramki referencyjne: logic 213/213 · tech-tree 19/19 · research 33/33 ·
  unit-replace 13/13 · combat 6/6 — zgodne z §6 co do liczby

BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Opus 5, adwersaryjnie).
DEPLOY/PUSH: NIE WYKONANO (push gałęzi roboczej to nie deploy; `main` nietknięty).

---

## Co było zepsute

`categoryOf()` łapie „Jeździec z oszczepami" słowem `jezdz` → kategoria `konnica` →
generyczny `case 'konnica'` (`units.ts:3494`) z **kopią trzymaną nadręcznie i
proporczykiem**, bez nóg jeźdźca i bez oporządzenia. Jednostka ma w `units.json`
`Atak dystansowy: 2`, `Zasięg: 2`, `Ilość pocisków: 5`. To ta sama klasa błędu, którą
T1 naprawił dla konnicy łuczniczej: jednostka dystansowa bez broni dystansowej.

## Co zrobiono

Oszczep w chwycie **górnym, gotowym do rzutu** (dłoń nad barkiem, łokieć zgięty
1.408 rad, grot w przód-w górę), **pęk 4 zapasowych w drugiej dłoni razem z wodzami** —
razem **5 drzewc = `Ilość pocisków`**. Lekki pancerz (`Pancerz: 3`): rubacha + kaftan,
czapka zamiast hełmu. **Strzemiona i siodło z terlicą** — świadome odwrócenie reguły
Brązu/Asyrii, uzasadnione inną ramą czasową. Tarcza okrągła (kanon Drużynnika,
pole = kolor gracza) **na plecach**, nie na przedramieniu.

## Badanie historyczne (K1-K13 w nagłówku pliku)

Realne źródła, nie zgadywanie: *Strategikon* Maurycjusza (ok. 592-602) XI.4 — „armed
with short javelins, two to each man", tarcze „nice-looking but unwieldy", teren
„nearly impenetrable forests… marshes", rada „lightly equipped and without many
horsemen"; *Strategikon* ks. I — pierwsza europejska wzmianka o strzemionach;
strzemiona awarskie 2. poł. VI w.; Mikulčice — 570+ ostróg (IX w.); zooarcheologia
koni z ziem polskich — konie małe/średnie, ok. 135 cm w kłębie.

**K3 nazywa wprost najtrudniejszy punkt:** *Strategikon* opisuje Słowian VI-VII w. jako
piechotę leśną, a ich teren jako niedobry dla jazdy — słowiańska jazda oszczepnicza
NIE jest dla tej warstwy poświadczona. Model odwzorowuje warstwę IX-X w. (konny orszak
książęcy, ta sama rama co istniejący `Drużynnik`) z uzbrojeniem opisanym w warstwie
VI-VII w. To decyzja zapisana, nie przeoczenie. Tak samo jawnie zapisana jest
rozbieżność „dwa oszczepy u Maurycjusza vs `Ilość pocisków: 5`" (wiążące są dane
jednostki) oraz to, że maści źródła NIE rozstrzygają (K10).

## Dowód nietautologiczności — DWUSTOPNIOWY

1. **(D) dispatch:** bundle z usuniętą 1 linią dispatchu (mutacja w locie, plików nie
   dotyka) → A1-A5 wszystkie czerwone, jednostka wraca do generyka (identyczna liczba
   mesh co fallback).
2. **(M) geometria:** bundle z odwróconymi 5 stałymi pozy przy NIETKNIĘTYM dispatchu →
   H1-H6 wszystkie czerwone. **Pierwsze podejście miało 3 mutacje i wtedy H2/H3/H4
   zostawały zielone — czyli ta część (H) była jeszcze tautologią.** Dopisano mutację
   odwracającą znak nachylenia drzewca (grot w tył) i mutację `sjArmIK` z pominiętym
   wektorem bieguna (ramię proste jak kij — dokładnie defekt rundy 1 w T1), oraz
   zaostrzono próg H3 z 0.045 na 0.025.

## Cztery defekty złapane WZROKIEM, nie asercją (lekcja T1/T3)

Test świecił 55/55, a render pokazał:
1. maść konia `0x4a3826` ≈ nogawice `SJ_WOOL_DK 0x4a3a2e` — **nogi jeźdźca znikały
   w koniu**; maść zmieniona na spłowiałą gniadą `0x7d6247` (K10 pkt iii);
2. wąsy w wymiarach Drużynnika (głowa 0.128) na głowie 0.098 zwisały poniżej brody —
   maska zamiast wąsów; przeskalowane do proporcji kanonu;
3. otok czapki szerszy od stożka → kapelusz z rondem, a po zwężeniu przecinał twarz na
   wysokości oczu → przepaska; podniesiony na linię włosów, dodano punkty oczu;
4. pęk zapasowy niesiony poziomo kładł się na tle torsu („patyki w klatce piersiowej");
   podniesiony i ustromiony (`SJ_SHEAF_TILT` osobne od `SJ_JAV_TILT`).

Każda z tych czterech rzeczy jest niewidoczna dla asercji mierzącej nazwy mesh, pudełko
zbiorcze ani nawet relacje geometryczne — i każda jest udokumentowana w miejscu zmiany.

## Odtworzenie dowodów

```bash
cd gra
node ./node_modules/typescript/bin/tsc --noEmit
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-t4-dist --emptyOutDir
node tools/zelazo-jezdziec-oszczepami-real-render-test.cjs \
     --dist /tmp/civ-t4-dist/index.html --shots /tmp/t4-shots
```

`--shots` zrzuca trzy PNG: model obok konnicy asyryjskiej i Konnicy Brązu, ten sam
zestaw przed naprawą (trzy identyczne generyki) oraz render z zepsutą geometrią.
