# 09 — FINAL CONTROL (runda 3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`
GOAL: Lista „ULEPSZENIA TERENU" ma być **w całości osiągalna i klikalna** przy każdym
realistycznym powiększeniu przeglądarki i rozmiarze okna. Zgodny z `00-dispatch.md` we
wszystkich trzech rundach (Operator, Evaluator) — brak przesunięcia (§16a pkt 9, §16b pkt 1).

Worktree Final Control: `/home/user/wt-FC-P-BUDOWA-MENU-r3` (detached @ `dcc08af5`, czwarty
niezależny worktree tego tematu); referencyjne `/home/user/wt-FC-check-r2code` (@ `9c2386fe`)
i `/home/user/wt-FC-check-przed` (@ `416733e1`). Własny bundling (kopia narzędzia Operatora,
uruchomiona z trzech różnych stanów kodu), własne mutacje, własne zrzuty z żywego Chromium.
Żadna liczba niżej nie pochodzi z raportu Operatora ani Evaluatora.

## 1. §2 raportu Operatora („sprostowanie kierunku błędu") — zweryfikowane niezależnie, POTWIERDZAM

Przeczytałem kod źródłowy wprost: `.civ-hud` (`hud.ts:562`) ma `position:fixed;inset:0;
z-index:310` — jest kontekstem układania. `.hud-right-cluster` (`hud.ts:578`) jest jego
potomkiem (`z-index:320`, ale domknięty wewnątrz kontekstu 310). `.civ-hud` (`hud.ts:1647-1648`)
i `.civ-build-panel` (`buildModeHud.ts:854-855`, `z-index:311`) są **rodzeństwem doklejanym
wprost do `<body>`**. Realne porównanie na poziomie ciała dokumentu to 310 vs 311 — panel
budowy maluje się NAD górnym HUD-em. To jest poprawny, niezależnie zweryfikowany fakt CSS
(kontekst układania ustanowiony przez `position:fixed` + własny `z-index` domyka dodatnie
`z-index` potomków), nie interpretacja.

Odtworzyłem bramkę tematu (kopia narzędzia Operatora, bez zmian) na trzech stanach kodu:

| stan kodu | wynik pod bramką rundy 3 | zgodność z raportami 07/08 |
|---|---|---|
| PRZED `416733e1` | **33 pass, 10 fail** | identyczne z raportem Operatora (33/10) |
| RUNDA 2 `9c2386fe` | **42 pass, 1 fail — wyłącznie G4** | identyczne z raportem Evaluatora (42/1); Operator podał 41/1 — różnica w liczbie zielonych asercji kontraktu źródła, nie w zbiorze czerwonych, nieszkodliwa |
| RUNDA 3 `f3e4b218`/`dcc08af5` | **43 pass, 0 fail** | identyczne z oboma raportami |

**Własne zrzuty z żywego Chromium** (nie z raportu Operatora/Evaluatora — wygenerowane tym
samym narzędziem z tymczasowo zmienionym warunkiem `--shot` na komórkę `BR200×UI150×640`,
zmiana cofnięta po zrzucie, `git diff` czysty):

- `PRZED` — panel widoczny na dole ekranu, wiersz „Fort” (ostatnia pozycja) częściowo ucięty
  krawędzią okna i nachodzi na półprzezroczysty stos WYKONAJ/ZAKOŃCZ TURĘ — zgodne z 60/60
  nachodzenia i realną nieklikalnością w tym stanie.
- `RUNDA 2` — panel zapadnięty do jednego wiersza („Fort”), widoczny WYRAŹNIE nad przyciskiem
  WYKONAJ, Civpedia i Menu w pełnym kolorze pod spodem. **To obala dosłownie zdanie „panelu nie
  widać wcale” z raportów 05 (Evaluator r2) i 06 (Final Control r2, mój własny raport z rundy
  2)** — na własnym zrzucie panel jest widoczny, tyle że zdegenerowany do jednego wiersza i
  malujący się nad HUD-em, nie pod nim. Przyznaję ten błąd własnego raportu z rundy 2 wprost
  (§13b) — patrz §2 niżej.
- `RUNDA 3` — panel z „Fort” w pełnej wysokości (jeden wiersz + chrom), WYKONAJ w pełni
  widoczny nad panelem, ZAKOŃCZ TURĘ i Civpedia/Menu widoczne przez panel na wpół
  przezroczyście — zgodne z jawnie nazwanym kompromisem geometrycznym tej komórki (nachodzi
  na stos tury, WYKONAJ pozostaje klikalny).

Wniosek: **§2 raportu Operatora jest poprawny i ja sam, przy tej samej metodzie co runda 2
(zrzut z żywego Chromium), dochodzę do tego samego wniosku z tej samej sceny.**

## 2. Sprostowanie własnego błędu z rundy 2 (§13b)

Mój raport `06-final-control-r2.md` twierdził „przy `BR200×UI125×640` panelu budowy nie widać
wcale” i podawał 4/60 „pod klastrem” z `hitTag: b-wiki/SPAN`. To był ten sam skrót co u
Evaluatora rundy 2: mój ówczesny harness montował klaster **bez** rodzica `.civ-hud`, więc
`z-index:320` klastra porównywał się wprost z `z-index:311` panelu zamiast z 310. Skutek dla
oceny: werdykt `FAIL` rundy 2 pozostaje słuszny co do meritum (ruchomy `top` naprawdę łamał
kontrakt pasa HUD-u — `G4` na kodzie rundy 2 czerwieni się identycznie w moim i w niezależnym
uruchomieniu), ale opis mechanizmu w moim raporcie był błędny. Koryguję to tutaj, nie
nadpisuję `06-final-control-r2.md` po fakcie (§13b pkt 2 — ślad korekty, nie ciche
nadpisanie).

## 3. Mutacje pojedynczej wartości — odtworzone samodzielnie, na kodzie rundy 3

| mutacja (moja własna, na `dcc08af5`) | wynik | zbiór czerwieni |
|---|---|---|
| przywrócenie ruchomego `top` rundy 2 (`min(90px,max(0px,calc(...)))`) | 42 pass, 1 fail | **wyłącznie G4** |
| usunięcie podłogi `max(MIN_H,...)` z obu reguł `max-height` | 39 pass, 4 fail | **C(c), C(d), G3b, F** |

Oba zbiory rozłączne, zgodne z tabelami z raportów 07 i 08. Po każdej mutacji plik przywrócony
z kopii zapasowej i zweryfikowany `git diff` = pusty przed kontynuacją.

## 4. G6 — czy rozszerzona bramka ma nową ślepą plamkę (montuje WSZYSTKO, co może zasłonić panel)

Przejrzałem `grep -rn "position:fixed" src/ui/*.ts` w całości (nie tylko listę `KNOWN_RIGHT_HIGH_Z`
z kodu G6) i sprawdziłem każdy trafiony element z `z-index` > 311:

- Elementy z `inset:0` (pełnoekranowe nakładki modalne — dyplomacja, empire overlay, tech tree,
  save/load itd.) są z zamysłu wyłączone z G6, bo nie są zakotwiczone do prawej krawędzi i w
  praktyce są **wzajemnie wykluczające się** z trybem budowy (gracz nie ma otwartego dialogu
  modalnego i panelu budowy jednocześnie). Jedyny wyjątek z `z-index` w tym zakresie i bez
  wzajemnego wykluczenia to `sciencePicker` (`z-index:312`, `inset:0`), **`display:none`
  domyślnie** — zgłoszone już przez Evaluatora (pkt 4) jako świadomie zaakceptowana wąska
  plamka, nie nowa.
- `.civ-build-banner` (`z-index:312`, ten sam moduł co panel) używa `left:50%+transform`, nie
  `right:`, więc nie trafia w skan G6 z tego samego powodu co brak `right:` w regule — ale ten
  element **jest częścią tej samej fabryki `createBuildModeHud`, więc już stoi w scenie testu**
  (montowany razem z panelem przez `window.__hud.update()`), nie jest pominięty w pomiarze —
  tylko nie jest zaliczony do listy „przejrzanych” G6. To nieszkodliwa nieścisłość nazewnictwa
  G6, nie luka pomiaru: rzeczywisty `elementFromPoint`/`page.mouse.click` na ostatniej pozycji
  i tak przechodzi przez realny DOM z banerem obecnym.
- `.civ-order` (whitelist) — potwierdzam ustalenie Evaluatora: `showOrderPanel` nie jest
  wywoływane nigdzie w kodzie, element nigdy nie trafia do DOM. Nieszkodliwe.
- `.civ-smp-overlay` (whitelist, `z-index:650`) ma `pointer-events:none` na całym prostokącie —
  nawet gdyby wizualnie nachodził, nie przechwyciłby kliknięcia.
- `.civ-diplo`, `.civ-emp-panel` (whitelist) — otwierane na żądanie, wzajemnie wykluczające się
  z trybem budowy w normalnym przepływie gry (nie zweryfikowane programowo w tej rundzie, ale
  zgodne z istniejącą praktyką repo dla tej klasy paneli).

**Wniosek: G6 nie ma nowej ślepej plamki wykrytej w tej rundzie.** Jej dwie znane luki
(pominięcie `inset:0`, brak wpisu banera budowy na liście „przejrzanych”) są nieszkodliwe z
przyczyn wskazanych wyżej i już opisane przez Evaluatora — nie odkrywam nic ponad to.

## 5. Próbny merge z `origin/main` — WAŻNA KOREKTA wobec obu raportów 07 i 08

`git merge-base origin/main origin/autobot/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1` = `416733e1`
(punkt dispatchu — gałąź tematu nie przesunęła się od `main` w trakcie pracy). **Ale `main`
przesunął się**: `origin/main` ma dziś HEAD `28a4dd58`, a między nim a `416733e1` leży m.in.
`3739a64f — Merge autobot/R-PRACA-JEDEN-PODZIAL-Q1` i `28a4dd58 — R-PRACA-JEDEN-PODZIAL-Q1
zamknięte: rejestr + 4 znaleziska poza zakresem`.

**`R-PRACA-JEDEN-PODZIAL-Q1` JEST JUŻ w `main` — wbrew §7 pkt 7 raportu Evaluatora
(„R-PRACA-JEDEN-PODZIAL-Q1 … nie jest jeszcze w main”) i wbrew analogicznemu zdaniu w
raporcie Operatora.** To dokładnie ostrzeżenie z `R-PROC-AUTOBOT.md` §9 pkt 9: nie ufać
naiwnemu stanowi `main` zapamiętanemu z wcześniejszego punktu w czasie — `main` porusza się
między dispatchem/rundami a integracją przy tematach równoległych. Sprawdziłem to komendą, nie
z pamięci ani z cudzego raportu (§13a rząd 1/2).

**Próbny merge** (`git merge --no-ff --no-commit origin/main` do gałęzi tematu):
`Auto-merging gra/src/ui/buildModeHud.ts` → **bez konfliktów**, `Automatic merge went well`.
Diff scalonego pliku pokazuje współistnienie obu zmian: stała `BUILD_PANEL_TOP_PX = 90` (ta
runda) i sekcja suwaków `pracaAutoPercent`/`getEmpirePracaSplit` (`R-PRACA-JEDEN-PODZIAL-Q1`) —
różne warstwy tego samego pliku, jak zapowiadał dispatch. Na scalonym drzewie (bez commitowania)
uruchomiłem: `tsc --noEmit` — 0 błędów; bramka tematu — **43 pass, 0 fail**; pięć bramek
referencyjnych — `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33,
`unit-replace-test` 13/13, `combat-test` 6/6; `vite build --outDir /tmp/civ-dist-fc-r3
--emptyOutDir` (C-001) — OK, `git status` po buildzie czysty. Merge próbny cofnięty
(`git merge --abort`), nic nie scalono do `main`.

**Rekomendacja kolejności integracji (skoro `R-PRACA-JEDEN-PODZIAL-Q1` jest już scalone, pytanie
o kolejność jest już zamknięte przez fakt): orkiestrator integruje ten temat teraz, wprost do
aktualnego `origin/main` (`28a4dd58`), zwykłym `git merge --no-ff` — bez potrzeby żadnej
specjalnej sekwencji ani ręcznego rozdzielania hunków. `git diff --check` na scalonym stanie
jest czysty; nie wykryłem nakładania się linii między oboma tematami.**

## 6. Integration micro-fix (drobiazg tekstowy, wykonany samodzielnie)

Evaluator (§7 pkt 1) trafnie wskazał, że komentarz i log `[info]` w bramce tematu
(`gra/tools/build-panel-ulepszenia-scroll-real-render-test.cjs`, okolice asercji G5) opisywał
zasłonięcie Civpedii/Menu jako „defekt warstwy HUD”, podczas gdy realnym elementem
przechwytującym klik (`hit`) w tych komórkach jest panel budowy, nie klaster. Naprawiłem
komentarz i tekst `[info]`, żeby odróżniał **mechanizm w danej klatce** (panel budowy stoi nad
`.civ-hud`, więc to on przechwytuje klik, gdy klaster się rozlewa) od **korzenia usterki
geometrycznej** (`hudRightRailBottomPx()` zaniża realną wysokość klastra — to wciąż warstwa
HUD-u i wciąż poza zakresem tego tematu). Zweryfikowałem bramką po zmianie: **43 pass, 0 fail**,
bez zmiany zbioru asercji ani liczb. Commit `gra/tools/build-panel-ulepszenia-scroll-real-render-test.cjs`
w allowliście tematu (`gra/tools/*`).

## 7. Checklist §16b

1. `00-dispatch.md` istnieje, `GOAL` niezmieniony przez wszystkie 3 rundy — potwierdzam. ✔
2. ID identyczne we wszystkich rundach (`P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`). ✔
3. Werdykt Evaluatora oparty na artefaktach (własny harness, własne uruchomienia, własne
   zrzuty) — zweryfikowałem niezależnie te same liczby własnym uruchomieniem. ✔
4. `PASS-WITH-NOTES` nie ukrywa uwagi dotyczącej GOAL/dowodu/zakresu/granic §9/gotowości do
   integracji — jedyna materialna uwaga (kolejność integracji z `R-PRACA-JEDEN-PODZIAL-Q1`)
   jest już rozstrzygnięta faktem (ten temat jest w `main`), reszta to znaleziska poza
   zakresem, już skierowane do rejestru. ✔
5. Licznik rund: 3/5, bez cichego resetu (sekwencja plików 00→09 ciągła). ✔
6. `REJESTR-PROSB-I-ZADAN.md` — **temat nadal nie ma wpisu**, trzecia runda z rzędu (Evaluator
   już to zgłosił). To jest zaległość dokumentacyjna, nie naruszenie §9 ani GOAL — do
   uzupełnienia przez orkiestratora **przed** integracją, razem ze znaleziskami poza zakresem
   (§8 poniżej), zgodnie z warunkiem domknięcia `PASS-WITH-NOTES` (§3b).
7. Temat nie jest podzielony na węzły — nie dotyczy.
8. **Werdykt gotowości do integracji: TAK.**

## 8. Znaleziska poza zakresem — do rejestru przed integracją (nie blokują)

Zebrane z operatora/evaluatora, zweryfikowane, bez nowych z mojej strony poza §4/§5/§6 wyżej:

1. `hudRightRailBottomPx()` zaniża realną wysokość prawego klastra HUD przy zawijaniu wiersza
   chipów (do ~345px CSS przy BR200×UI150) — ta sama stała karmi `eventsPanelTopPx()`. Realny
   winowajca zasłonięcia Civpedii/Menu w 16/60 komórek jest to spillover połączony z tym, że
   panel budowy (i najpewniej panel wydarzeń) stoi nad `.civ-hud` z zasady architektury.
2. `.hud-right-cluster` ma `pointer-events:auto` na całym prostokącie nawet tam, gdzie nic się
   nie maluje — połyka kliknięcia w WYKONAJ/ZAKOŃCZ TURĘ w części komórek.
3. `.civ-build-banner` nachodzi na panel budowy przy niektórych rozdzielczościach —
   pre-istniejące, zgłoszone już w rundzie 2.
4. `.civ-order` (`orderPanel.ts`) nigdy nie jest montowany (`showOrderPanel` bez wywołań) —
   nieszkodliwe martwe pole w bezpiecznej whiteliście G6, ale opis „otwierany na żądanie” w
   komentarzu bramki jest łagodniejszy niż stan faktyczny.
5. Brak wpisu tematu w `REJESTR-PROSB-I-ZADAN.md` (punkt 6 wyżej) oraz `.et-hint` z rundy 1 —
   do zarejestrowania.

---

ZMIANY/COMMIT:
- Final Control nie zmienia logiki produktowej. Integration micro-fix:
  `gra/tools/build-panel-ulepszenia-scroll-real-render-test.cjs` (precyzja komentarza/loga
  G5 — atrybucja mechanizmu vs korzeń usterki), commitowany razem z tym raportem.
- Ten raport: `dyspozycje/autobot/runs/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1/09-final-control-r3.md`.
- Wypchnięte na `origin/autobot/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`; `main` nietknięty.

TESTY: bramka tematu odtworzona niezależnie na 3 stanach kodu — PRZED 33/10 (identyczne z
Operatorem), RUNDA 2 42/1-G4 (identyczne z Evaluatorem), RUNDA 3 43/0. Dwie własne mutacje
pojedynczej wartości (przywrócenie ruchomego `top` → wyłącznie G4; usunięcie podłogi →
C(c)/C(d)/G3b/F) — zbiory rozłączne. 3 własne zrzuty z żywego Chromium (PRZED/R2/R3 przy
BR200×UI150×640), obejrzane wzrokiem — obalają dosłowne zdanie „panelu nie widać wcale” z
raportów 05/06 i potwierdzają §2 raportu Operatora. Przegląd całego `src/ui/*.ts` pod kątem
G6 — brak nowej ślepej plamki. Próbny merge z `origin/main` (`28a4dd58`, po scaleniu
`R-PRACA-JEDEN-PODZIAL-Q1`) — bez konfliktów, `tsc` 0 błędów, bramka tematu 43/0, 5 bramek
referencyjnych zielone, `vite build` (C-001) OK — merge cofnięty, nic nie scalone.

BLOKADY: brak. Kompromis geometryczny w ≤10/60 komórkach (nachodzenie na stos tury) pozostaje
jawnie opisanym, zaakceptowanym wyborem — zero regresji wobec stanu zastanego na żadnej z 5 osi.

RUNDY: 3/5.

NASTĘPNY KROK: integracja orkiestratora. Merge `git merge --no-ff` z aktualnym `origin/main`
(`28a4dd58`) — próbny merge bez konfliktów, kolejność względem `R-PRACA-JEDEN-PODZIAL-Q1` jest
już rozstrzygnięta faktem (ten temat jest scalony do `main` wcześniej). Przed lub tuż po
integracji: uzupełnić wpis w `REJESTR-PROSB-I-ZADAN.md` (brakuje od 3 rund) i przenieść
znaleziska §8 do rejestru jako osobne, nieblokujące tematy.

DEPLOY/PUSH: NIE WYKONANO (Final Control nie deployuje ani nie pushuje do `main` — wyłącznie
push gałęzi tematu z tym raportem i micro-fixem).
