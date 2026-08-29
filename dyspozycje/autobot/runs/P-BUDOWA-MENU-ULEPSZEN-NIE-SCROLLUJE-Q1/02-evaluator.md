# 02 — EVALUATOR (runda 1)

STATUS: FAIL
DOMAIN: GAME
TEMAT: `P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`
GOAL: Lista „ULEPSZENIA TERENU" w panelu budowy ma być **w całości osiągalna i klikalna**
przy każdym realistycznym powiększeniu przeglądarki i rozmiarze okna.
(zgodny z `00-dispatch.md` — §16a pkt 9 sprawdzone, GOAL nie przesunął się)

Worktree Evaluatora: `/home/user/wt-EVAL-P-BUDOWA-MENU` (detached @ `216ba8aa`), własny harness,
własne pomiary. Raport Operatora nie był podstawą żadnej z poniższych liczb.

## Powód FAIL — zmierzona regresja klikalności (2 punkty, PRZED działało, PO nie działa)

Operator zmierzył dwie osie powiększenia **osobno** (przeglądarka przy UI 100%, UI gry przy
przeglądarce 100%) i nigdy ich **iloczynu**. Iloczyn jest dokładnie tym miejscem, w którym
naprawa się łamie. Rezerwa `100% − (90 + 184/174)px` schodzi poniżej zera, gdy wysokość bloku
zawierającego spada poniżej 264 px; `max-height` zostaje wtedy przycięty do ~0 i panel zapada
się do 23–31 px, więc ostatnia pozycja przestaje być klikalna. Stara reguła `calc(100vh − 180px)`
w tych komórkach dawała wartość dodatnią i po transformie `scale()` mieściła się w kadrze.

Pomiar (realny `page.mouse.click` w środku ostatniej pozycji + callback `onSelectType`, nie samo
`elementFromPoint`; okno 1920×H, `viewport = W/z, H/z` + `deviceScaleFactor`, powiększenie UI gry
przez ten sam zapis stylów co `hud.ts::applyUiZoom`):

| Punkt | PRZED (`416733e1`) | PO (`d0fd2301`) |
|---|---|---|
| BR 200% × UI 125% × 640 | panel 175 px, klik **OK** | panel 23 px, klik **NIE** |
| BR 200% × UI 150% × 640 | panel 210 px, klik **OK** | panel 27 px, klik **NIE** |
| BR 150% × UI 150% × 640 | klik NIE | klik NIE (bez zmiany) |
| BR 175% × UI 150% × 640 | klik NIE | klik NIE (bez zmiany) |
| BR 200% × UI 150% × 768 | klik NIE | klik NIE (bez zmiany) |

Arytmetyka potwierdza, że to nie artefakt emulacji: BR 200% × 640 → viewport 320 px CSS;
UI 125% → `body.height = 256 px`; rezerwa `90 + 174 = 264 > 256` → `calc()` ujemny.

Bilans całej siatki łączonej (60 punktów): PRZED 29 punktów nieklikalnych, PO 5. Naprawa jest
dużym postępem netto — ale **dwa punkty pogorszyła**, a GOAL mówi „każdym realistycznym
powiększeniu". To nie jest uwaga kosmetyczna, więc §3b kieruje temat do Operatora.

## Co zweryfikowane i POTWIERDZONE (nie kwestionuję)

- **Siatka dispatchu (20 punktów, BR 100/125/150/175/200% × 1080/900/768/640, UI 100%):**
  ostatnia pozycja osiągalna i klikalna **realnym kliknięciem** w 20/20, nachodzenie na stos
  WYKONAJ/ZAKOŃCZ TURĘ = 0 px w 20/20. PRZED: nachodzenie 75 px w każdym z 20.
- **Diagnoza hipotez potwierdzona własnym pomiarem.** H1 zachodzi dla powiększenia UI gry
  (PRZED 0/8 osiągalnych, PO 8/8), nie dla przeglądarki (PRZED 20/20 osiągalnych). H2 zachodzi
  zawsze (75/181/218 px nachodzenia; `elementFromPoint` na środku WYKONAJ trafiał w
  `.civ-build-item`). H3 **nie zachodzi** — w całym `gra/src` nie ma ani jednego
  `window`/`document` listenera `wheel`; kółko nad listą przewija listę i nie dociera do kanwy
  także przy powiększeniu UI 150% (sprawdzone osobno, Operator sprawdzał tylko przy 100%).
- **Dowód wizualny odtworzony samodzielnie** (`scratchpad/shot-{przed,po}-*.png`): PRZED przy
  UI 150% × 900 suwak stoi na maksimum, a lista biegnie dalej poza dolną krawędź ekranu
  (ostatnia widoczna „Posterunek (Strażnica)", „Warzelnia soli/Tarasy/Fort" poniżej kadru) —
  to jest dokładnie zgłoszenie właściciela. PO: „Warzelnia soli / Tarasy / Fort" w całości nad
  odsłoniętymi przyciskami.
- **Nietautologiczność odtworzona samodzielnie.** M1 (`%`→`vh`, rezerwa bez zmian) → 19/6:
  czerwienieją A2, A7, C(b), C(c), nachodzenie i klikalność przycisków; **B(b)/B(c) zostają
  zielone**. M2 (rezerwa →90, jednostka bez zmian) → 22/3: czerwienieją A3, nachodzenie
  i klikalność przycisków; **wszystkie cztery asercje o osiągalności/klikalności ostatniej
  pozycji zostają zielone**. Rozłączność osi jest realna.
- **Bramki (własne uruchomienia):** `tsc --noEmit` 0 błędów; logic 213/213; tech-tree 19/19;
  research 33/33; unit-replace 13/13; combat 6/6; `vite` build (binarka z `node_modules`,
  `--outDir /tmp/civ-dist-eval-pbudowa`, C-001) OK i **nie nadpisał niczego w repo**
  (`git status` pusty). Defensywnie: `build-mode-lock-tip-position` 21/21,
  `praca-budmode-slider-max` 13/13. Test Operatora odtworzony: 25/25 PO, 18/7 PRZED
  (Operator podał 19/6 — różnica wynika z ujawnionej przez niego samego luki ekstraktora CSS,
  nie z niezgodności).
- **Allowlista, granice §9:** zmienione wyłącznie `gra/src/ui/buildModeHud.ts`, `gra/tools/*`
  (test + dwa stuby w istniejącej konwencji `.stubs/`) i artefakt runu. Brak sekretów, brak
  usunięć poza 3 zastąpionymi liniami, `gra/data/**` i `WERSJE.md` nietknięte, `git diff --check`
  czysty, brak `npm run build/dev`, brak pushu do `main`, brak deployu. Warstwa suwaków budżetu
  automatu nietknięta (`R-PRACA-JEDEN-PODZIAL-Q1` nie ruszył jeszcze tego pliku — dziś brak
  kolizji, ale ryzyko przy integracji zostaje).

## Precyzyjna poprawka na rundę 2 (jedna, wąska)

1. Dodać **podłogę** wysokości panelu, żeby `calc()` nigdy nie zapadał się do zera — np.
   `max-height: max(<wysokość jednego pełnego wiersza + padding panelu>, calc(100% − …px))`,
   wyliczoną ze stałych, nie magiczną liczbą. W komórkach zdegenerowanych panel wróci do
   nachodzenia na stos tury (jak PRZED), ale ostatnia pozycja zostanie klikalna — czyli
   **nigdy gorzej niż stan zastany**.
2. **Wiążące kryterium odbioru:** dla KAŻDEJ komórki siatki łączonej
   przeglądarka {100,125,150,175,200}% × UI gry {100,125,150}% × wysokość {1080,900,768,640}
   wynik PO ≥ wynik PRZED, osobno dla „osiągalna" i „klikalna realnym kliknięciem". Żadna
   komórka nie może przejść z OK na NIE. Komórki UI 100% muszą zachować nachodzenie 0 px.
3. Rozszerzyć `build-panel-ulepszenia-scroll-real-render-test.cjs` o tę siatkę łączoną
   i o asercję **realnego** `page.mouse.click` (dziś jest tylko `elementFromPoint`), żeby
   ta komórka nie mogła zregresować po cichu.
4. Nie poszerzać zakresu poza to. Trzy komórki złe już PRZED naprawą
   (BR150/UI150/640, BR175/UI150/640, BR200/UI150/768) **nie są** warunkiem zaliczenia —
   w efektywnej wysokości ~213 px sam stos tury (162 px) i offset panelu (90 px) nie mieszczą
   się w kadrze; to osobny temat do rejestru, nie ta runda.

## Uwagi drugorzędne (do rejestru, nie blokują)

- Trzy komórki z pkt 4 wyżej — architektoniczny limit sztywnych pikseli HUD przy powiększeniu
  łącznym ≥ 2,25×; osobny temat.
- Przy najostrzejszym punkcie siatki dispatchu (BR 200% × 640) panel kurczy się do 46 px, czyli
  **jednego** widocznego wiersza. Kryterium spełnione, ale użyteczność graniczna.
- `.et-hint` (podpowiedź blokad) — zgłoszone przez Operatora, ma trafić do rejestru jako osobny
  temat, nie zostać w raporcie (§3b).
- Raport Operatora ma 566 słów przy orientacyjnym limicie ~400 (§11).
- Słowo „WYŁĄCZNIE" w opisie mutacji M1/M2 zaniża liczbę czerwieniejących asercji (M1 czerwieni
  też nachodzenie i klikalność przycisków, M2 też A3). Istota dowodu jest prawdziwa.
- Zmiana `STYLE_ID` + usuwanie starego `#civ-build-mode-hud-css` to kod martwy przy świeżym
  ładowaniu strony; nagłówek stubów przepisany z testu lock-tipa mówi o „geometrii tooltipa
  blokady", co nie opisuje tego testu.

ZMIANY/COMMIT: Evaluator nie zmienia kodu. Oceniany `d0fd2301` (raport `216ba8aa`).
TESTY: wyniki własnych uruchomień wyżej (bramki, test tematu, dwie mutacje, siatka łączona
60 punktów, zrzuty przed/po).
BLOKADY: regresja klikalności w 2 punktach siatki łączonej (opis wyżej).
RUNDY: 1/5.
NASTĘPNY KROK: Operator, runda 2 — poprawka z sekcji „Precyzyjna poprawka", to samo ID,
ta sama gałąź.
DEPLOY/PUSH: NIE WYKONANO.
