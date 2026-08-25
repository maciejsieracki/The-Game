# 02 — EVALUATOR (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T9`
GOAL: Audyt Miecznika galijskiego i Rydwanu celtyckiego; rozstrzygnięcie kwestii
współdzielonej bryły rydwanu (świadomy wzorzec vs. luka). Zgodny z `00-dispatch.md` (§16a p. 9).
MODEL/EFFORT: Opus 5 (`claude-opus-5[1m]`), effort High — zgodnie z dispatchem.
ZMIANY/COMMIT: `b2d49a09`, gałąź `autobot/ZELAZO-AUDYT-T9-Q1`, baza `88e2181f`.
5 plików, wszystkie w allowliście: `gra/src/render/jednostki-z3-plemiona.ts`
(wyłącznie `buildMiecznikGalijski()` — helpery `trCore/trBuildLeg/trBuildArm` miały
parametry nazw z domyślną wartością pustą już od T8, więc nietknięte),
`gra/src/render/units.ts` (`decorateChariot()` + 2 linie dispatchu PL/EN),
`gra/tools/zelazo-celtowie-miecznik-rydwan-real-render-test.cjs` (nowy),
`gra/tools/zelazo-germanie-real-render-test.cjs`, `01-operator.md`.
Berserker/Wojownik germański/Drużynnik/iButho: 0 linii diffu. Zero sekretów,
`git diff --check` czysty, brak `git add -A` (5 plików, nie drzewo).

TESTY (uruchomione przeze mnie w WŁASNYM worktree `/home/user/wt-eval-T9`, nie odczytane z raportu):
- `tsc --noEmit` 0 błędów; `vite build` binarką z `node_modules` do `/tmp` — czysty (C-001).
- 5 bramek referencyjnych: 213/213, 19/19, 33/33, 13/13, 6/6. `unit-power-test` 4/2 — czerwony pre-istniejąco, bez zmiany.
- Test tematu: **82 pass / 0 fail**. Macierz ablacyjna M0–M21: każda z H1–H21 czerwienieje pod SWOJĄ pojedynczą mutacją, baza zielona → asercje nietautologiczne. Zrzut z żywego Chromium obejrzany (§9 poz. 6a) — poza cięcia, tarcza rydwanu zwrócona polem do kamery, kabłąki na burtach.
- Regresja serii, wszystkie zielone: germanie 77/0, soldurii-gaesatae 40/0, falanga 38/0, śródziemnomorze 81/0, super-rzym-grecja 89/0, mezopotamia 70/0, konnica-asyryjska 29/0, jeździec-oszczepami 55/0, `zelazo-gate-test` 24/24.
- **Próbny merge z dzisiejszym `origin/main` (ab3ece6e)**: `.ts` scalają się automatycznie; jedyny konflikt to `zelazo-germanie-real-render-test.cjs` — T9 i T10 rozwiązały ten sam problem różnym mechanizmem (`nazwane`/`pf` vs `own`). Rozstrzygnięcie: zachować mechanizm T10 (`own`) i ustawić wiersz galij na `own: 'mg-', mesh: 44, maxY: 0.7410`. Po takim scaleniu: tsc 0, germanie 77/0, T10 73/0, T11 19/0, T9 79/0 (`--skip-vite`).

ROZSTRZYGNIĘCIE KWESTII Z DISPATCHU — potwierdzam „LUKA, nie wzorzec”. Sprawdziłem obie przesłanki
kodowe u źródła (rząd 2, nie z raportu): `units.ts:85-92` i `units.ts:115-122` istnieją i mówią dosłownie
to, co cytuje Operator — w tym zdanie „warianty kulturowe — mykeński/Shang/celtycki — dostawały
przynajmniej `decorateChariot()`”, przy dwóch precedensach już naprawionych bespoke bryłą.
Naprawa cząstkowa (0.0102 → 0.390 przy progu rodziny 0.558) jest granicą allowlisty, nie
niedbalstwem; luka jest jawna w nagłówku testu i w asercji H19, nie schowana. Zgodne z §14.

ZERO REGRESJI RYDWANÓW — zweryfikowane niezależnie od testu: `buildCategoryModel('rydwan')` tworzy
`const mats: THREE.Material[] = []` per wywołanie, a `makeMatFactory` robi `new MeshStandardMaterial`,
więc `retint()` nie może wyciec poza własny token. Linie dispatchu mykeńskiego i Shang nie zmienione,
ścieżka celtycka za `celtic = false`. H20 pilnuje tego pomiarem, M20 dowodzi, że pilnuje naprawdę.

BLOKADY: brak.

UWAGI (żadna nie dotyczy GOAL, dowodu, zakresu ani granic §9 — nie są podstawą do kolejnej rundy):
1. `01-operator.md` nie ma pól `TESTY`, `BLOKADY`, `NASTĘPNY KROK`, a `ZMIANY/COMMIT` odsyła do
   `git log` zamiast wymienić allowlistę i SHA (§4). Substancja dowodu istnieje — odtworzyłem ją sam,
   wyniki wyżej. Do uzupełnienia przy integracji, nie przez re-dispatch Operatora (jego proces padł).
2. Pięć znalezisk odłożonych przez Operatora (bespoke bryła rydwanu celtyckiego; audyt rydwanu
   mykeńskiego i Shang; rozjazd `units.json` „wojownik z oszczepami” vs `Atak dystansowy 0`;
   myląca nazwa `getGeoOvalShield()`; kontrola barwy tuniki woźnicy przy graczu niebieskim)
   **musi trafić do `REJESTR-PROSB-I-ZADAN.md` przed zamknięciem tematu** (§3b, wzorzec T8/T10/T11).
3. Utajona kruchość, nie defekt: `retint()` dopasowuje po heksie, więc kolor gracza równy
   `COLOR_BRONZE`/`COLOR_LACQUER`/`COLOR_RED_VIV` zostałby przebarwiony razem z okuciami.
   Dziś kolizji nie ma (sprawdziłem `OWNER_COLORS`, `OWNER_COLORS_FALLBACK` i wszystkie
   `kolorHex` w `civs.json`). Tani zabezpieczacz: pominąć w pętli materiał o barwie `ownerColor_`.
4. Nagłówek helperów w `jednostki-z3-plemiona.ts` (ok. linii 343) nadal wymienia Miecznika galijskiego
   wśród wywołań „bez parametru nazwy”; po T9 przestało to być prawdą. Poza allowlistą T9 — do zdania
   przy najbliższym dotknięciu pliku.
5. Raport Operatora ma 935 słów wobec orientacyjnych ~400 (§11) — poniżej mediany tej serii,
   odnotowane bez konsekwencji.
6. Test tematu, jak wszystkie w tej serii, nie jest wpięty w żadną zbiorczą bramkę — uruchamia się
   go ręcznie. Stan zastany serii, nie regres T9.

RUNDY: 1/5.
NASTĘPNY KROK: Final Control (osobny subagent), następnie integracja orkiestratora z rozstrzygnięciem
konfliktu T10 opisanym wyżej i z uzupełnieniem uwag 1–2.
DEPLOY/PUSH: NIE WYKONANO (push gałęzi roboczej ≠ deploy).
