# 07 — OPERATOR (runda 3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`
GOAL: Lista „ULEPSZENIA TERENU" ma być **w całości osiągalna i klikalna** przy każdym
realistycznym powiększeniu przeglądarki i rozmiarze okna (bez przesunięcia wobec `00-dispatch.md`).

Worktree: `/home/user/wt-P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`, gałąź
`autobot/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1` (kontynuacja, bez resetu licznika rund).
Worktree odniesienia dla stanu zastanego: `/home/user/wt-OP-R3-BASE` (detached @ `416733e1`).

## 1. Najpierw bramka — i dowód, że czerwieni się na kodzie rundy 2

Zgodnie z zadaniem rundy: **najpierw** rozszerzenie bramki tematu, **potem** naprawa.

Commit `e8c6bfeb` — `gra/tools/build-panel-ulepszenia-scroll-real-render-test.cjs` montuje
teraz cały prawy klaster HUD:

- CSS górnego HUD-u **wycięty programowo** z szablonu `const css = \`` w `hud.ts` (ten sam
  skaner nawiasów co `cssRule`), wstawki `${…}` podstawione z `hudLayout.ts`. Asercja **G2b**
  czerwieni się, gdy w `hud.ts` pojawi się wstawka, której test nie zna — replikacja nie może
  po cichu rozjechać się z produkcją.
- `<div class="civ-hud">` jako **realny rodzic** klastra, więc scena odtwarza także **kontekst
  układania** (`.civ-hud{position:fixed;inset:0;z-index:310}`). To okazało się rozstrzygające —
  patrz §2.
- chipy renderuje **prawdziwa** `chip6cHtml`/`chip6cSep` z `hudChip6c.ts` (ikony stubowane,
  geometria chipa zależy od CSS, nie od kształtu ikony).
- `body{font-family:monospace}` jak w `gra/index.html` — etykiety chipów dziedziczą font z body,
  a od ich szerokości zależy, czy wiersz chipów się zawija, czyli **jak wysoki realnie jest
  klaster**. Domyślny font przeglądarki dałby pomiar łagodniejszy niż rzeczywistość.
- nowe asercje: **G1** (`hud.ts` emituje klaster bezwarunkowo i w tej samej strukturze),
  **G2a–G2f** (wycięcie CSS, pełne podstawienie wstawek, z-index klastra > panelu, własny
  kontekst układania rodzica, pas z `hudRightRailBottomPx()`), **G3** (środek ostatniej pozycji
  nie trafia w klaster), **G4** (górna krawędź panelu nie wchodzi w pas 68px CSS), **G5**
  (Civpedia/Menu klikalne), **G6** (skan całego `src/ui/*.ts` — żaden **nieprzejrzany** element
  `position:fixed` o z-index wyższym niż panel nie stoi w prawym pasie), **G7** (`.civ-hud`
  i `.civ-build-panel` są rodzeństwem doklejanym wprost do `<body>`).
- `--json <plik>` — surowa siatka do porównań stan-do-stanu.

**Dowód, że rozszerzona bramka łapie bug (kod rundy 2 bez zmian, sam test rozszerzony):**

| stan bramki | kod rundy 2 `9c2386fe` |
|---|---|
| bramka sprzed rundy 3 (bez klastra) | **30 pass, 0 fail** — ślepa |
| bramka rundy 3 (z klastrem) | **41 pass, 1 fail — G4** |

G4 wskazuje dokładnie: `panelTopCss` 18–66px przy progu pasa 68px, m.in. `BR175×UI150×640`,
`BR200×UI125×640`, `BR200×UI150×768`, `BR150×UI150×640`. Dodatkowo pomiar pokazał, że w 13/60
komórek panel rundy 2 zasłaniał sobą Civpedię i Menu (`hit: civ-build-item`).

## 2. SPROSTOWANIE — kierunek błędu jest ODWROTNY niż w raportach 05 i 06

To jest najważniejsze ustalenie tej rundy i nie da się go pominąć, bo zmienia opis defektu
(nie zmienia natomiast rekomendowanej naprawy — ta jest ta sama).

Raporty Evaluatora (05) i Final Control (06) opisują: „panel wjeżdża **pod** prawy klaster HUD
i znika", 4/60 nieklikalnych, `hitTag` = `b-wiki`, zrzut „panelu nie widać wcale". W scenie
odtwarzającej **rzeczywistą strukturę drzewa gry** to się nie potwierdza:

- `.civ-hud` (cały górny HUD, `z-index:310`) jest doklejany **wprost do `<body>`**
  (`hud.ts:1646-1648`: `barEl.className = 'civ-hud'; document.body.appendChild(barEl);`).
- `.civ-build-panel` (`z-index:311`) też jest doklejany **wprost do `<body>`**
  (`buildModeHud.ts:842-843`).
- `.civ-hud` ma `position:fixed` **i własny z-index**, więc jest **kontekstem układania**.
  `z-index:320` klastra jest w nim domknięty i nigdy nie porównuje się z 311 — realnie
  porównuje się **310 vs 311**. Panel budowy maluje się **NAD** górnym HUD-em.

Pomiar w scenie z tym rodzicem, także na kodzie rundy 2: **0/60 pozycji pod klastrem,
0/60 nieklikalnych** (`hitInCluster` = false wszędzie).

**Eksperyment kontrolny** (harness, nie kod gry): ten sam pomiar z klastrem doklejonym wprost
do `<body>` i skróconymi selektorami (`.civ-hud .x` → `.x`), czyli **bez rodzica tworzącego
kontekst układania** — wynik odwraca się: `hit: hud-right-cluster`, czerwienieją `C(c)`, `C(d)`
i `G3b`. To odtwarza dokładnie objaw i liczby z raportów 05/06. Wniosek: tamten pomiar
mierzył scenę, w której klaster nie miał swojego rodzica, więc `320` biło się bezpośrednio
z `311`. **Ta sama klasa błędu co poprzednio — niepełna scena — tylko o jeden poziom głębiej:
brakowało nie elementu, lecz kontekstu układania.**

**Dowód wizualny z żywego Chromium**, kod rundy 2, `BR200×UI150×640`
(`scratchpad/shot-R2-BR200-UI150-640b.png`): panel budowy z wierszem „Fort · E3 · 30 P" stoi
**NAD** banerem trybu budowy i chipem „Armia" — jest doskonale widoczny, tyle że zakrywa górny
HUD. Nie „nie widać go wcale".

Zabezpieczenie na przyszłość: asercja **G7** pilnuje, że oba elementy nadal są rodzeństwem
doklejanym do `<body>`. Gdyby któryś przeniósł się w drzewie, kolejność malowania odwróciłaby
się i bramka powie o tym natychmiast.

**Co to zmienia w ocenie rundy 2:** runda 2 nie powodowała regresji klikalności listy (mierzone
0/60 nieklikalnych, zero regresji wobec PRZED). Powodowała za to realny defekt w drugą stronę —
łamała kontrakt pasa górnego HUD-u i **zasłaniała sobą Civpedię i Menu w 13/60 komórek**.
Werdykt FAIL obu ról był więc trafny co do meritum („usunąć/ograniczyć ruchomy `top`"), a
nietrafny co do opisu mechanizmu.

## 3. Naprawa

Commit `f3e4b218` — `gra/src/ui/buildModeHud.ts`, jedna zmiana rzeczowa:

```diff
-  top:min(${BUILD_PANEL_TOP_PX}px,max(0px,calc(100% - ${BUILD_PANEL_BOTTOM_PX + BUILD_PANEL_MIN_H_PX}px)));
+  top:${BUILD_PANEL_TOP_PX}px;
```
(analogicznie w regule `html.civ-ui-zoom-active` — tam zbędna, bo `top` nie różni się już
między wariantami, więc deklaracja została z niej usunięta).

**Podłoga `max-height: max(52px, calc(…))` zostaje nietknięta** — to ona naprawia klikalność
listy i obie role kontrolne potwierdziły ją niezależnym pomiarem. Nie cofnięta.

`top` wraca do wartości ze stanu zastanego (90px), więc oś pionowa panelu jest **identyczna
jak PRZED** — zero nowej interakcji z banerem trybu budowy (`z-index:312`).

## 4. Pomiar — siatka 60 punktów, realny `page.mouse.click`, scena Z klastrem HUD

Kryterium: zjazd na dół listy + `elementFromPoint` w środku ostatniej pozycji + realne
`page.mouse.click` potwierdzone wywołaniem `onSelectType`.

| stan | ostatnia NIEklikalna | pod klastrem | nachodzi na stos tury | WYKONAJ/ZAKOŃCZ zasłonięte **przez panel** |
|---|---|---|---|---|
| PRZED `416733e1` | **29/60** | 0/60 | 60/60 | 60/60 |
| RUNDA 2 `9c2386fe` | 0/60 | 0/60 | 0/60 | 0/60 |
| **RUNDA 3 `f3e4b218`** | **0/60** | **0/60** | 7/60 | 3/60 |

**Porównanie komórka po komórce (`--json`, PRZED vs RUNDA 3): ZERO regresji na każdej osi** —
klikalność, pozycja pod klastrem, nachodzenie na stos tury, zasłonięcie WYKONAJ/ZAKOŃCZ TURĘ,
klikalność Civpedii i Menu. Wszystkie **29/29** komórek nieklikalnych w stanie zastanym
naprawione. Twarde kryterium odbioru rundy 3 spełnione.

Bramka tematu: **43 pass, 0 fail**.

## 5. Świadomy kompromis — nazwany, z liczbami

7 komórek nachodzenia i 3 z zasłoniętym WYKONAJ to **te same komórki**, w których blok
zawierający jest niższy niż `top panelu + jeden pełny wiersz listy + rezerwa stosu tury`:

- nachodzenie: `BR150×UI150×640`, `BR175×UI125×640`, `BR175×UI150×768`, `BR175×UI150×640`,
  `BR200×UI125×640`, `BR200×UI150×768`, `BR200×UI150×640`;
- z tego WYKONAJ/ZAKOŃCZ zasłonięte przez panel: `BR175×UI150×640`, `BR200×UI125×640`,
  `BR200×UI150×768`.

Przykład rachunku (`BR200×UI150×640`): blok zawierający **213px CSS**, potrzebne
`90 (top) + 52 (wiersz + chrom) + 174 (rezerwa stosu tury przy powiększeniu UI)` = **264px CSS**.
Brakuje 51px — **fizycznie nie ma miejsca** na pas HUD-u, pełny wiersz listy i stos tury naraz.

Wybór: **panel nachodzi na stos WYKONAJ/ZAKOŃCZ TURĘ** (tak jak w stanie zastanym, gdzie było
to 60/60), a **nie** chowa się pod HUD ani nie zakrywa górnego HUD-u. Uzasadnienie: przycisk
pod panelem odsłania się zamknięciem trybu budowy (ESC), a listy schowanej pod HUD-em nie
odzyskuje się niczym. Wobec stanu zastanego to i tak poprawa z 60/60 na 7/60 i z 60/60 na 3/60.

Asercje nachodzenia i klikalności WYKONAJ są **warunkowe względem `forcedOverlap` liczonego
z realnych stałych** (`hudLayout.ts` + `BUILD_PANEL_TOP_PX` + zmierzona wysokość wiersza), a nie
z wpisanej ręcznie listy wyjątków — gdy geometria się poprawi, asercje same zaczną wymagać zera.

## 6. Nietautologiczność — mutacje po jednej wartości

| mutacja | co czerwienieje | zbiór |
|---|---|---|
| usunięcie podłogi `max(52px, …)` z `max-height` | `C(c)`, `C(d)`, `G3b`, `F` (4 asercje) | podłoga |
| `top:60px` (wewnątrz pasa HUD, zamiast 90px) | **wyłącznie `G4`**, 60/60 komórek | pas HUD |
| przywrócenie ruchomego `top` rundy 2 | **wyłącznie `G4`**, 8 komórek | pas HUD |
| (harness) klaster bez rodzica `.civ-hud` | `C(c)`, `C(d)`, `G3b` | kontekst układania |

Zbiory rozłączne. Warto odnotować: mutacja podłogi czerwieni `G3b` z `hit: b-wiki` — gdy panel
zapada się do zera, wiersz listy faktycznie ląduje w obszarze klastra. To jedyny mechanizm,
w którym „pod klastrem" w ogóle występuje, i podłoga go zamyka.

## 7. Bramki

`tsc --noEmit` (binarką projektu) **0 błędów**; `logic-test` **213/213**; `tech-tree-test`
**19/19**; `research-test` **ALL GREEN (33/33)**; `unit-replace-test` **13/13**; `combat-test`
**All sanity checks passed (6/6)**; `vite` binarką z `node_modules` do `/tmp/civ-dist-op-r3`
(C-001) **OK**, `git status` po buildzie czysty. Defensywnie na tym samym pliku:
`build-mode-lock-tip-position-real-render-test` **21/21**, `praca-budmode-slider-max-real-render-test`
**13/13**. `map-gen-regression-test` **NIE uruchamiany** — temat nie dotyka generatora mapy
(polecenie dispatchu rundy 3).

Higiena uruchomień: każde wywołanie w `timeout`. Bramka tematu z pełną siatką 60 punktów
biegnie ~13 s, więc nie było potrzeby zwężania siatki; nic nie zostało niedomierzone.
Postęp commitowany na gałąź w trakcie pracy (dwa commity: bramka, potem naprawa).

## 8. Znaleziska poza zakresem (do rejestru, nie blokują)

1. **`hudRightRailBottomPx()` = 68px CSS zaniża realną wysokość prawego klastra.** Przy
   powiększeniu UI wiersz chipów się zawija i klaster ma realnie 94px (UI 125/150 przy BR≤125),
   126px (BR150), **190px (BR175)** i **230px CSS (BR200)**. Ta sama stała jest źródłem prawdy
   dla `eventsPanelTopPx()`, więc panel wydarzeń ma najpewniej ten sam problem.
2. **Przyczyna zawijania:** `.civ-hud .civ-hud-banner-right{max-width:min(calc(50vw - 340px),780px)}`
   — przy przeglądarce 200% `50vw` = 480px, więc `max-width` schodzi do **140px** i pięć chipów
   układa się w kolumnę. Skutek: sam klaster zasłania Civpedię i Menu w 16/60 komórek
   **także w stanie zastanym** (zmierzone, PRZED = 16/60, RUNDA 3 = 16/60, bez regresji).
   Osobny temat warstwy HUD.
3. **Baner trybu budowy** (`.civ-build-banner`, `z-index:312`, `top:48px`) nachodzi na panel —
   pre-istniejące, zgłoszone już przez Evaluatora w rundzie 2.
4. **Proces:** pomiar kolejności malowania wymaga odtworzenia **rodzica** mierzonych elementów,
   nie tylko ich samych. Runda 3 zabezpiecza to asercją G7 w bramce tematu; warto to zapisać
   jako regułę ogólną dla testów real-render z `z-index`.
5. `.et-hint` (runda 1) i **brak wpisu tematu w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`** —
   bez zmian, nadal nieuzupełnione (poza allowlistą Operatora).

---

ZMIANY/COMMIT:
- `e8c6bfeb` — `gra/tools/build-panel-ulepszenia-scroll-real-render-test.cjs`,
  `gra/tools/.stubs/build-panel-scroll-scienceOwlIcon-stub.ts` (bramka montuje prawy klaster HUD).
- `f3e4b218` — `gra/src/ui/buildModeHud.ts`, `gra/tools/build-panel-ulepszenia-scroll-real-render-test.cjs`
  (stałe `top`, asercja G7).
- Ten raport: `dyspozycje/autobot/runs/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1/07-operator-r3.md`.
- Allowlista dotrzymana: wyłącznie `gra/src/ui/buildModeHud.ts` (CSS/layout panelu), `gra/tools/*`
  i artefakt runu. Warstwa suwaków budżetu automatu **nietknięta** (zero trafień w diffie).
  `git diff --check` czysto, brak `git add -A`, brak `npm run build`/`dev`, `WERSJE.md` nietknięty.

TESTY: bramka tematu 43 pass / 0 fail (na kodzie rundy 2 przed naprawą: 41 pass / 1 fail — G4;
tą samą bramką sprzed rundy 3: 30 pass / 0 fail — ślepa). Siatka 60 punktów × 3 stany kodu
(PRZED / runda 2 / runda 3) z zamontowanym `.hud-right-cluster`, porównanie komórka po komórce
przez `--json`: zero regresji wobec PRZED. Cztery mutacje o rozłącznych zbiorach czerwieni.
Bramki referencyjne, `tsc`, `vite build` — §7 wyżej. Dowody wizualne z żywego Chromium
(`scratchpad/shot-PRZED-…`, `shot-R2-…`, `shot-PO_R3-…`, poza repo).

BLOKADY: brak. Kompromis geometryczny w 7/60 komórkach opisany jawnie w §5 jako świadomy wybór.

RUNDY: 3/5

NASTĘPNY KROK: Evaluator (Opus 5 High — temat wizualny, §5a). Proszę zweryfikować przede
wszystkim §2 — sprostowanie kierunku błędu — własnym harnessem **z rodzicem `.civ-hud`**
i porównać z eksperymentem kontrolnym bez tego rodzica.

DEPLOY/PUSH: NIE WYKONANO (push wyłącznie gałęzi tematu, bez `main`, bez deployu).
