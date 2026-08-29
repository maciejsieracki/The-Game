# 01 — OPERATOR (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T9`
GOAL: Audyt Miecznika galijskiego i Rydwanu celtyckiego; rozstrzygnięcie kwestii
współdzielonej bryły rydwanu (świadomy wzorzec vs. luka).
MODEL/EFFORT (sprawdzone ze środowiska, nie z pamięci): **Opus 5** (`claude-opus-5[1m]`,
system prompt sesji) + **`CLAUDE_EFFORT=high`** (zmienna środowiskowa). Zgodne z dispatchem.
ZMIANY/COMMIT: patrz `git log` gałęzi `autobot/ZELAZO-AUDYT-T9-Q1`.
RUNDY: 1/5.
DEPLOY/PUSH: NIE WYKONANO (push gałęzi roboczej ≠ deploy).

## Rozstrzygnięcie kwestii z dispatchu: to LUKA, nie wzorzec

Cztery niezależne przesłanki, wszystkie sprawdzone, nie założone:

1. **Pomiar.** Rydwan celtycki, mykeński i Shang miały na `main` sprzed T9
   IDENTYCZNE: liczbę mesh (97), `minY` (0), `maxY` (0.6694), `maxR` (0.8163)
   i histogram barw z dokładnością do dwóch dodanych mesh. Odróżnialność
   pikselowa z kamery gry: **celtycki/mykeński 0.0102**, celtycki/Shang 0.0139,
   przy kontroli „ten sam model porównany sam ze sobą" = 0.0000 i progu rodziny
   0.558. To nie jest „wariant", to jest jedna figurka w trzech odcieniach.
2. **Własny komentarz kodu twierdził inaczej.** Doc-komentarz `decorateChariot()`
   mówił, że funkcja „re-tints its car front-panel / driver tunic so the three
   chariot variants read distinctly". Funkcja **nigdy tego nie robiła** — dodawała
   wyłącznie dwa mesh. To był opis zamiaru, którego nie wdrożono, czyli ślad
   niedokończonej pracy, a nie zapis świadomej decyzji.
3. **To repo już dwa razy zaklasyfikowało ten stan jako lukę i naprawiło go
   bespoke bryłą** — `units.ts:88-92` (Rydwan Kapadokijski) i `units.ts:118-122`
   (Rydwan konny). Drugi z tych komentarzy wprost nazywa warianty
   „mykeński/Shang/celtycki" jako te, które dostały „przynajmniej
   `decorateChariot()`" — czyli mniej niż potrzeba.
4. **Dane żądają trzech różnych pojazdów.** `units.json`: celtycki `Epoka`=Żelazo,
   `Pancerz` 1, Uwagi „lekki"; mykeński i Shang `Epoka`=Brąz, `Pancerz` 2,
   Uwagi Shang „ciężki … załoga 3".

**Zakres naprawy jest jednak ograniczony allowlistą** (`decorateChariot()`, nie
`buildCategoryModel()`; nowego pliku bespoke allowlista nie obejmuje). Dlatego:

- naprawione w T9: znacznik kultury (patrz niżej) + żelazne okucia + tunika
  woźnicy; odróżnialność celtycki/mykeński **0.0102 → 0.3904**;
- **NIEDOMKNIĘTE**: próg rodziny 0.558 osiągają wyłącznie rydwany z własną bryłą
  (Kapadokijski/mykeński = 0.810, mierzone w tym samym renderze). Wymaga
  bespoke bryły celtyckiej w osobnym pliku → osobny temat (niżej).

## Znalezione i naprawione defekty (7)

Każdy najpierw ZMIERZONY, potem naprawiony; każdy ma asercję i mutację ablacyjną.

| # | Jednostka | Defekt (stan zmierzony PRZED) | Po naprawie | Asercja |
|---|---|---|---|---|
| G1 | Miecznik | krata na braccae: **0 pikseli** obu barw przy 4 istniejących mesh (uda kryje dół tuniki i golenie); przesuwana o stały wektor w osi ŚWIATA Z, nie po normalnej własnej kończyny | ochra 40 px, urzet 97 px | H4 / M4 |
| G2 | Miecznik | torques: **4 piksele** (siedział w połowie szyi, pod brodą) | 48 px, na obojczyku | H5 / M5 |
| G3 | Miecznik | kita helmu **wisiała 0.018 × HEX_R nad miską** (SAT = 0); „guz" był w nagłówku funkcji, ale mesh guza NIE ISTNIAŁ | guz dodany, kita na nim siedzi | H6 / M6 |
| G4 | Miecznik | brak oczu; miska helmu miała promień dolny 0.093 > połowa boku głowy 0.064 i pochłaniała twarz | miska 0.78, oczy 60 px | H7 / M7 |
| G5 | Miecznik | poza „pchnięcie" = poza Drużynnika z dokładnością do 0.03–0.04 rad (nogi IDENTYCZNE) i sprzeczna z Polibiuszem II.33.3 (miecz galijski tylko do cięcia); **galij/Drużynnik 0.509, galij/Hastati 0.526 — poniżej progu 0.558** | cięcie z góry; 0.608 / 0.640 | H11, H12 / M11, M12 |
| R1 | Rydwan | „znacznik kultury" był OKRĄGŁYM krążkiem o normalnej wzdłuż osi X — **iloczyn skalarny z kierunkiem patrzenia kamery DOKŁADNIE 0.000**, czyli widać było wyłącznie jego kant: **198 px** wobec 1070 px części w barwie gracza u Gaesatów | owalna tarcza lateńska zwrócona do kamery, 649 px | H15 / M15 |
| R2 | Rydwan | ta sama tarcza **wisiała w powietrzu**: jej środek 0.065 × HEX_R przed najdalej wysuniętą ścianą skrzyni, styk z pojazdem wyłącznie rogiem listwy (SAT 0.0090) | luz tylnej ściany 0.0018 | H14 / M14 |

Dołożone (nie „defekt", ale nośnik rozstrzygnięcia i zgodności historycznej):
policzki helmu Montefortino; żelazne okucia rydwanu zamiast brązowych (epoka!);
tunika woźnicy poza czerwienią lakową; dwa wysokie kabłąki burtowe.

## Zero regresji — zmierzone, nie zadeklarowane

- Rydwan mykeński i Shang: 97 mesh, te same `minY/maxY/maxR`, 0 nazwanych mesh,
  dwa mesh dekoracji w tych samych punktach `(0.150, 0.20, 0.12)` /
  `(0.162, 0.20, 0.12)`, wzajemna odróżnialność nadal 0.0139 (H20 / M20).
  Ścieżka celtycka jest za domyślnym parametrem `celtic = false` — wzorzec T8.
- Test T8 zaktualizowany jawnie: wpis `galij` przechodzi z „ma być nietknięty
  (0 nazwanych mesh)" na „ma być w całości nazwany, 44 mesh, maxY 0.7410", a
  `(K0)` liczy „obie jednostki T8 mają sekcję" zamiast „w pliku są dokładnie dwie
  sekcje". Oba warunki nadal twarde; komentarz o parach `galij/*` poniżej progu
  poprawiony, bo po T9 przestał być prawdą.

## Do zarejestrowania jako OSOBNE tematy (§14 — nie poszerzałem allowlisty)

1. **Bespoke bryła Rydwanu celtyckiego** (własny plik, jak Kapadokijski/konny):
   wiklinowy kosz, koła, kształt skrzyni. Bez tego próg 0.558 jest nieosiągalny.
2. **Audyt Rydwanu mykeńskiego i Shang**: ich znaczniki kultury mają ten sam
   defekt „krawędź do kamery" (198 px), boss Shang ma barwę własnej tarczy
   (niewidoczny), boss mykeński — barwę okuć wozu; wzajemna odróżnialność 0.0139.
3. **Rozjazd w `units.json` — Rydwan celtycki**: Uwagi mówią „wojownik
   z oszczepami", a `Atak dystansowy` = 0 i `Ilość pocisków` = „—".
   `gra/data/**` poza allowlistą; model świadomie nie dostał oszczepów.
4. **`getGeoOvalShield()` w `units.ts` to mylna nazwa** — zwraca
   `CylinderGeometry` (krążek), nie owal. Używane też przez inne jednostki,
   więc porządkowanie nazwy jest osobnym tematem.
5. **Do sprawdzenia przy okazji balansu barw**: dla gracza NIEBIESKIEGO tunika
   woźnicy rydwanu celtyckiego (urzet 0x2f5aa0) leży blisko koloru gracza
   (0x3366ee). Zmierzone: piksele w barwie gracza 1334 (celtycki) vs 1669
   (mykeński) = 80%, więc identyfikacja gracza pozostaje czytelna (H21), ale
   warto to zobaczyć na żywym ekranie przy tej jednej palecie.

## Uzupełnienie pól raportu (§4 — dodane przy integracji, Evaluator/Final Control
znaleźli oryginalny raport niekompletny w tym miejscu; Operator's proces padł
przed uzupełnieniem, substancja dowodu odtworzona niezależnie przez obie role
kontrolne i orkiestratora)

ALLOWLISTA: `gra/src/render/jednostki-z3-plemiona.ts` (wyłącznie
`buildMiecznikGalijski()`), `gra/src/render/units.ts` (`decorateChariot()` + 2
linie dispatchu), `gra/tools/*` (nowy test + rozszerzenie testu T8) — wszystkie
w zakresie, zero linii poza allowlistą.
TESTY: `zelazo-celtowie-miecznik-rydwan-real-render-test.cjs` 82 pass/0 fail
(macierz ablacyjna H1-H21, nietautologiczna). `tsc --noEmit` 0 błędów, `vite
build` (C-001) czysty. Zero regresji: cała seria T1-T8 zielona, `unit-power-test`
4/2 pre-istniejący.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO (push gałęzi roboczej ≠ deploy).
