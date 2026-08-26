# 08 — EVALUATOR (runda 3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`
GOAL: Lista „ULEPSZENIA TERENU" ma być **w całości osiągalna i klikalna** przy każdym
realistycznym powiększeniu przeglądarki i rozmiarze okna.
(§16a pkt 9 — GOAL w raporcie Operatora zgodny z `00-dispatch.md`, bez przesunięcia w żadnej
z trzech rund.)

Worktree Evaluatora: `/home/user/wt-EVAL-P-BUDOWA-MENU-r3` (detached @ `7126340b`); worktree
odniesienia `/home/user/wt-EVAL-BASE` (@ `416733e1`) i `/home/user/wt-EVAL-R2CODE` (@ `9c2386fe`).
**Własny harness** (`scratchpad/ev3/ev3-grid.cjs`, własne stuby ikon, własny ekstraktor CSS),
własne uruchomienia. Żadna liczba poniżej nie pochodzi z raportu Operatora.

---

## 1. NAJPIERW SPROSTOWANIE WŁASNEGO BŁĘDU Z RUNDY 2 (§13b)

**Miałem rację co do poprawki, myliłem się co do mechanizmu. Raport 05 (mój) i raport 06
(Final Control) opisały kierunek błędu ODWROTNIE. Operator ma rację w §2 swojego raportu.**

Fakt ze źródła (rząd 1/2 wg §13a): `.civ-hud` (`hud.ts:562`) ma
`position:fixed;inset:0;z-index:310` — czyli jest **kontekstem układania**. `.hud-right-cluster`
(`hud.ts:578`, `z-index:320`) jest jego **potomkiem** (selektor `.civ-hud .hud-right-cluster`),
więc 320 jest domknięte wewnątrz 310 i nigdy nie porównuje się z panelem. `.civ-hud`
(`hud.ts:1646-1648`) i `.civ-build-panel` (`buildModeHud.ts:842-843`, `z-index:311`) są
**rodzeństwem doklejanym wprost do `<body>`**. Realne porównanie to **310 vs 311** — panel
budowy maluje się **NAD** górnym HUD-em, nigdy pod nim.

Mój harness rundy 2 montował klaster **bez tego rodzica** (skrócone selektory `.civ-hud .x` →
`.x`), więc `320` biło się bezpośrednio z `311`. Final Control r2 popełnił dokładnie ten sam
skrót niezależnie. Dwa niezależne pomiary tej samej wady nie są dowodem — są dwoma egzemplarzami
tego samego błędu.

**Eksperyment kontrolny, mój, na kodzie rundy 2 (`--no-parent` w moim harnessie):**

| scena | ostatnia pozycja nieklikalna | trafienie w klaster |
|---|---|---|
| klaster **bez** rodzica `.civ-hud` (błąd rundy 2) | **13/60** (`b-wiki`, `hud-right-cluster`) | 13/60 |
| klaster **w** rodzicu `.civ-hud` (jak w grze) | **0/60** | **0/60** |

Objaw i `hitTag: b-wiki` z raportów 05/06 odtworzone co do znaku — i znikają, gdy scena ma
rodzica. **Zrzut z żywego Chromium, kod rundy 2, `BR200×UI150×640`**
(`scratchpad/ev3/shots/R2-BR200xUI150x640.png`): panel budowy z wierszami „Tarasy" i „Fort"
jest **doskonale widoczny**, nad chipem „Armia" i nad przyciskami CIVPEDIA/MENU. Zdanie
z mojego raportu 05 („panelu nie widać wcale") i identyczne zdanie z raportu 06 są **nieprawdziwe**.

**Skutek dla decyzji:** rekomendowana w rundzie 2 poprawka (usunąć ruchomy `top`) była trafna
i pozostaje trafna — ale z innego powodu: nie dlatego, że panel chował się pod HUD-em, tylko
dlatego, że **zakrywał sobą górny HUD** i łamał kontrakt pasa `eventsPanelTopPx()`. Werdykt
FAIL rundy 2 broni się mimo błędnego opisu: runda 2 miała **2 realne regresje wobec PRZED**
(Civpedia i Menu w `BR150×UI150×640`) — inne komórki niż podane w raporcie 05, ale realne.
Wszystkie liczby z raportu 05 z kolumn „pod klastrem" i „ostatnia pozycja nieklikalna" należy
uznać za **wycofane**.

---

## 2. Harness Evaluatora rundy 3 — co się zmieniło i dlaczego jest ostrzejszy

- CSS górnego HUD-u **wycięty w całości** z szablonu `const css = \`` w `hud.ts` moim własnym
  skanerem, **z zachowanymi prefiksami `.civ-hud …`**, i interpolowany w stronie prawdziwymi
  wartościami modułów (`hudLayout`, `brandTokenVars`, `minimapLayout`) przez `new Function`.
  Każdy identyfikator z `${…}` musi istnieć w zakresie — brak choćby jednego przerywa test
  (mój odpowiednik G2b, własna implementacja).
- Klaster montowany w **prawdziwym rodzicu** `.civ-hud`.
- Chipy z prawdziwej `chip6cHtml`/`chip6cSep`; **przyciski Civpedia i Menu Z IKONAMI**
  (`wikiBookIcon(16)`, `brandIconSvg('ui-menu',24)` — CSS wymusza 16px), czego bramka tematu
  nie robi. Klaster jest przez to **szerszy niż w bramce Operatora**, więc mój pomiar jest
  ostrzejszy, nie łagodniejszy.
- Lista ulepszeń **prawdziwa**, wycięta z `render/improvements.ts` (ostatnia pozycja: „Fort").
- Kryterium (d) nie jest przywiązane do geometrycznego środka wiersza: sprawdzam **7 punktów
  w obrębie wiersza**, pomijając ikonkę `ⓘ` (ma własny `stopPropagation`), i klikam realną
  myszą. „Nieklikalna" znaczy: **nie da się kliknąć w żadnym miejscu wiersza**.
- Realne `page.mouse.click` (nie sam `elementFromPoint`) także dla WYKONAJ, ZAKOŃCZ TURĘ,
  Civpedia i Menu — z potwierdzeniem w callbacku.
- Higiena pomiaru: przed każdą komórką kursor wraca do (0,0) i gaszony jest dymek
  `.civ-build-lock-tip` (z-index 320), żeby nie zanieczyszczał następnego pomiaru. Wynik
  przed i po tej poprawce identyczny — pomiar stabilny.

Siatka 60 punktów: przeglądarka 100/125/150/175/200% × UI gry 100/125/150% × okno
1080/900/768/640 (szerokość 1920), `viewport = {1920/BR, H/BR}` + `deviceScaleFactor = BR`.

---

## 3. Pomiar — trzy stany kodu, ta sama scena, ten sam harness

| oś (60 komórek) | PRZED `416733e1` | RUNDA 2 `9c2386fe` | **RUNDA 3 `f3e4b218`** |
|---|---|---|---|
| ostatnia pozycja **nie do kliknięcia nigdzie** | **34/60** | 0/60 | **0/60** |
| trafienie w górny HUD zamiast wiersza | 0/60 | 0/60 | **0/60** |
| panel niższy niż jeden pełny wiersz (podłoga) | 0/60 | 0/60 | **0/60** |
| widoczne wiersze listy zasłonięte | 3/60 (baner budowy) | 0/60 | **0/60** |
| górna krawędź panelu w pasie HUD (<68px CSS) | 0/60 | **7/60** | **0/60** |
| prostokąt panelu nachodzi na stos tury | 60/60 | 1/60 | 10/60 |
| WYKONAJ **realnie** klikalny | 0/60 | 52/60 | 51/60 |
| ZAKOŃCZ TURĘ **realnie** klikalny | 0/60 | 56/60 | 56/60 |
| Civpedia / Menu **realnie** klikalne | 44/60 | 47/60 | 44/60 |

**Porównanie komórka po komórce, PRZED → RUNDA 3, pięć osi (lista, WYKONAJ, ZAKOŃCZ TURĘ,
Civpedia, Menu): ZERO regresji.** Naprawione: 34 komórki listy, 51 komórek WYKONAJ,
56 komórek ZAKOŃCZ TURĘ. Twarde kryterium odbioru rundy 3 — spełnione.

Dla porządku: RUNDA 2 → PRZED miała **2 regresje** (`BR150×UI150×640`, Civpedia i Menu).
RUNDA 3 wraca dokładnie do bazy PRZED na tej osi (44/60 w obu, **te same komórki**).

**Cztery komórki z raportów 05/06 („całkowicie nieosiągalne"):** `BR175×UI150×640`,
`BR200×UI125×640`, `BR200×UI150×768`, `BR200×UI150×640` — w scenie z prawdziwym rodzicem
**nigdy nie były nieosiągalne, także w rundzie 2**, a w rundzie 3 ostatnia pozycja jest w nich
realnie klikalna. Zrzut `scratchpad/ev3/shots/R3-BR200xUI150x640.png`: wiersz „Fort" w pełni
widoczny, panel pod pasem HUD, nachodzi na stos tury — czyli dokładnie zadeklarowany kompromis.

---

## 4. Kompromis geometryczny — potwierdzam, ale z WIĘKSZYMI liczbami niż w raporcie 07

Operator podaje 7/60 nachodzenia i 3/60 zasłoniętych przycisków. Moim (szerszym) klastrem
wychodzi **10/60 nachodzenia**, **9/60 WYKONAJ** i **4/60 ZAKOŃCZ TURĘ** nieklikalnych.
Rozbicie po winowajcy (realny `elementFromPoint` + realny klik):

- **przez PANEL BUDOWY** (świadomy kompromis): `BR150×UI150×640`, `BR175×UI150×640`,
  `BR200×UI125×640`, `BR200×UI150×768`, `BR200×UI150×640` — 5 komórek;
- **przez KLASTER HUD** (pre-istniejące, nie ta poprawka): `BR175×UI125x640`,
  `BR175×UI150×768`, `BR200×UI125×768`, `BR200×UI150×900` i częściowo powyższe — 8 komórek;
  klaster przy powiększeniu zawija wiersz chipów i rozlewa się w dół aż do 345px CSS,
  a jego kontener ma `pointer-events:auto`, więc **połyka kliknięcia w przezroczystym obszarze**.

**W PRZED wszystkie te komórki były zasłonięte tak samo albo gorzej (60/60 dla obu
przycisków), więc żadna z nich nie jest regresją.** Wybór „panel nachodzi na stos tury,
zamiast zakrywać górny HUD albo znikać" akceptuję: dispatch rundy 3 jawnie na niego zezwolił,
a przycisk pod panelem odsłania się ESC-em, listy schowanej pod HUD-em nie odzyskuje nic.

Różnica 7 vs 10 i 3 vs 4 nie jest sprzecznością — wynika z tego, że moja replikacja klastra
ma ikony w przyciskach, więc klaster jest szerszy. Kierunek i werdykt identyczne.

---

## 5. Czy rozszerzona bramka NAPRAWDĘ się czerwieni — odtworzone samodzielnie

Skopiowałem plik bramki z rundy 3 do worktree z kodem rundy 2 i uruchomiłem:

| kod pod bramką rundy 3 | wynik | exit |
|---|---|---|
| PRZED `416733e1` | **33 pass, 10 fail** (A2, A3, A7, G2f, C(b), C(c), C(d), B/C, F, E) | 1 |
| RUNDA 2 `9c2386fe` | **42 pass, 1 fail — G4** (`panelTopCss` 18–66,8 przy progu 68) | 1 |
| RUNDA 3 `f3e4b218` | **43 pass, 0 fail** | 0 |

Bramka **nie jest ślepa** — czerwieni się i na stanie zastanym, i na kodzie rundy 2, dokładnie
na tej asercji, która opisuje wadę rundy 2. (Operator raportuje 41 pass/1 fail dla kodu
rundy 2, u mnie 42 pass/1 fail — różnica w liczbie zielonych asercji kontraktu źródła, nie
w zbiorze czerwonych.)

**Mutacje pojedynczej wartości, moje własne, na kodzie rundy 3:**

| mutacja | co czerwienieje | zbiór |
|---|---|---|
| usunięcie podłogi `max(52px, …)` z obu reguł `max-height` | `C(c)`, `C(d)`, `G3b`, `F` (4 asercje) | podłoga |
| przywrócenie ruchomego `top` rundy 2 | **wyłącznie `G4`** | pas HUD |
| (harness) klaster bez rodzica `.civ-hud` | 13/60 trafień w klaster | kontekst układania |

Zbiory rozłączne, wynik zgodny z §6 raportu Operatora. Podłoga `max-height` **działa i nie
została cofnięta** — 0/60 komórek poniżej jednego wiersza, a jej usunięcie natychmiast czerwieni
cztery asercje.

---

## 6. Zakres, granice, bramki (§16a)

1. **Allowlista** — zmienione wyłącznie `gra/src/ui/buildModeHud.ts` (CSS/layout panelu),
   `gra/tools/*` i artefakty runu. Warstwa suwaków budżetu automatu **nietknięta** (zero trafień
   w diffie na `praca-empire-split`/`pracaAutoPercent`/`onEmpirePracaSplitChange`). ✔
2. **§9** — brak `npm run build`/`dev` (budowałem binarką `vite` do `/tmp/civ-dist-eval-r3`),
   brak `git add -A`, brak sekretów w diffie, `WERSJE.md` i `playbook.json` nietknięte,
   zmiana procesu nie jedzie w allowliście tematu produktowego, deploy/push niewykonany. ✔
3. **Bramki — moje uruchomienia:** `tsc --noEmit` (binarką projektu) **0 błędów**;
   `logic-test` **213/213**; `tech-tree-test` **19/19**; `research-test` **ALL GREEN**;
   `unit-replace-test` **13/13**; `combat-test` **6/6**; `vite build --outDir /tmp/civ-dist-eval-r3`
   **OK**, `git status` po buildzie czysty. Defensywnie na tym samym pliku:
   `build-mode-lock-tip-position` **21/21**, `praca-budmode-slider-max` **13/13**.
   `map-gen-regression-test` **nieuruchamiany** (polecenie dispatchu, temat nie dotyka generatora).
4. **Trwały stan / parytet gracz-AI-MP / save-load** — zmiana jest wyłącznie CSS-owa, zero
   wpływu na stan zapisu i na symetrię stron. ✔
5. **Sekrety** — brak. ✔
6. **Usunięcia** — 3 linie usunięte w `buildModeHud.ts`, wszystkie zastąpione
   (import, `STYLE_ID`, stara reguła `.civ-build-panel`); `git diff --check` czysto. ✔
7. **Kolizja tematów** — `git merge-base origin/main HEAD` = `416733e1`; `main` nie ruszył
   `buildModeHud.ts`; próbny `git merge --no-ff --no-commit origin/main` **bez konfliktów**
   (merge wycofany, nic nie scalone). `R-PRACA-JEDEN-PODZIAL-Q1` dotyka tego samego pliku
   w innej warstwie i **nie jest jeszcze w `main`** — integrować sekwencyjnie, per hunk (§9 pkt 9).
8. **Temat wizualny** — zrzuty z żywego Chromium (PRZED / R2 / R3, po 3 komórki) plus dowód
   nietautologiczności (3 mutacje + 2 stany kodu pod bramką). ✔
9. **GOAL** zgodny z dispatchem we wszystkich rundach. ✔
10. Temat niedzielony na węzły. ✔

---

## 7. Uwagi (żadna nie dotyczy GOAL, dowodu, zakresu, granic §9 ani gotowości do integracji)

1. **Sprostowanie do §8 pkt 2 raportu Operatora — zła atrybucja, dobra liczba.** Operator pisze,
   że „sam klaster zasłania Civpedia i Menu w 16/60 komórek także w stanie zastanym". Liczba
   i komórki są prawdziwe (PRZED 16/60 = RUNDA 3 16/60, ten sam zbiór), ale **elementem
   zasłaniającym jest PANEL BUDOWY** (`hit`: `civ-build-item` / `meta` / `civ-build-panel`),
   nie klaster. Przyczyną pierwotną jest rozlanie się klastra poniżej własnego pasa 68px, przez
   co jego przyciski trafiają pod panel stojący na `top:90px`. Ta sama pomyłka jest w tekście
   `[info]` bramki („defekt warstwy HUD"). Do poprawienia przy zakładaniu tematu następczego,
   żeby nie celował w złą warstwę. **Nie jest regresją tej rundy** — zbiór komórek identyczny
   jak w stanie zastanym.
2. **`hudRightRailBottomPx()` = 68px CSS zaniża realną wysokość klastra** (do 345px CSS przy
   `BR200×UI150`) — potwierdzam pomiarem niezależnie od Operatora; ta sama stała karmi
   `eventsPanelTopPx()`, więc panel wydarzeń ma najpewniej tę samą wadę. Osobny temat.
3. **Kontener `.hud-right-cluster` ma `pointer-events:auto` na całym prostokącie**, także tam,
   gdzie nic nie maluje — połyka kliknięcia w WYKONAJ/ZAKOŃCZ TURĘ w 8/60 komórek. Pre-istniejące,
   osobny temat (naturalnie razem z pkt 2).
4. **G6 pomija reguły z `inset:0`** — wąska ślepa plamka: pełnoekranowa nakładka z `z-index>311`
   i `pointer-events:auto` przeszłaby przez skan. Dziś jedyna taka (`sciencePicker`, z-index 312)
   jest `display:none` domyślnie, więc realnego ryzyka nie ma. Do rozważenia przy kolejnej edycji bramki.
5. `.civ-order` (`orderPanel.ts`, `position:fixed;top:60px;right:12px;z-index:320`, root) jest
   na liście „przejrzanych" w G6 jako „otwierany na żądanie" — w istocie **nie jest montowany
   nigdzie w kodzie** (`showOrderPanel` bez wywołań). Nieszkodliwe, ale opis w bramce jest łagodniejszy niż stan faktyczny.
6. **Temat nadal nie ma wpisu w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`** (trzecia runda z rzędu),
   a `.et-hint` z rundy 1 i punkty 1–5 wyżej nie są zarejestrowane jako osobne tematy.
   Wg §3b to warunek domknięcia `PASS-WITH-NOTES` — do wykonania przez orkiestratora
   przed integracją; nie wymaga rundy 4 Operatora.

---

ZMIANY/COMMIT: Evaluator nie zmienia kodu gry. Oceniany `f3e4b218` (bramka `e8c6bfeb`,
raport Operatora `7126340b`). Ten raport:
`dyspozycje/autobot/runs/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1/08-evaluator-r3.md`.
TESTY: własna siatka 60 punktów × 3 stany kodu + 1 eksperyment kontrolny (`--no-parent`),
porównanie komórka po komórce PRZED↔R3 na 5 osiach = **zero regresji**; bramka tematu
uruchomiona na 3 stanach kodu (33/10 fail, 42/1 fail — G4, 43/0 fail); 2 własne mutacje
o rozłącznych zbiorach czerwieni; 5 bramek referencyjnych + `tsc` + `vite build` + 2 bramki
defensywne — wszystkie zielone; 9 zrzutów z żywego Chromium.
BLOKADY: brak.
RUNDY: 3/5.
NASTĘPNY KROK: Final Control (runda 3) — proszę o niezależne odtworzenie §1 (eksperyment
kontrolny z rodzicem `.civ-hud` i bez niego), bo runda 2 zawiera **dwa** błędne raporty ról
kontrolnych i ten sam skrót nie może przejść trzeci raz.
DEPLOY/PUSH: NIE WYKONANO.
