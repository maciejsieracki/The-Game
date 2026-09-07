# P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1 — Evaluator, runda 1

MODEL+EFFORT: **Opus 5, effort high**.
GUARD §2b: `git status --short` PUSTY; HEAD `d8784f46`, baza `094be1db` potwierdzona jako
przodek (`git merge-base --is-ancestor` → prawda). Trzy commity ponad bazą to praca Operatora —
brak rozbieżności. Panel `empireDetailPanel.ts` md5 `b122876f…` przed i po wszystkich moich
mutacjach; każda cofana KOPIĄ pliku, `git diff --quiet` czysty po każdej.

## Co uruchomiłem sam (nie przepisane z raportu)

- **PK1 — asercje przed/po.** Wersja bazowa `094be1db` odtworzona w `os.tmpdir()` (kopia bramki
  + kopia panelu) i uruchomiona: **38 pass / 9 fail = 47 asercji**. Wersja po: **57/57, exit 0**.
  Porównanie ETYKIET asercji (`comm` na posortowanych listach): **zero etykiet zniknęło**.
  Dziesięć doszło: 5 nowych (`E1`, `E2`, `E3`×3) + 5 pre-istniejących, które w bazie w ogóle
  się nie wykonywały, bo `runReal` zwracał `null` (S1×2, S2, S3, S4). **Żadna asercja nie
  osłabiona ani nie usunięta.**
- **Werdykt (b) potwierdzony materiałem, nie deklaracją.** Wszystkie 9 bazowych FAIL-i niesie
  `"wireMiastaColFilter is not defined"` (6×) albo jest ich kaskadą (S1, S4/rAF, MUTANT R2).
  Trzy auto-zaślepiane funkcje (`wireMiastaColFilter` :1611, `wireMiastoScopeButtons` :1837,
  `wireMiastoResFilter` :1851) sprawdziłem w ciałach — **żadna nie dotyka `scrollTop`**.
  `render()` (:3974-4014) faktycznie woła je między `innerHTML` a gałęzią scrolla.
- **PK2 — zrzuty.** Obejrzałem PRZED/PO dla handel, armia, kultura (+ md5 wszystkich ośmiu).
  `PRZED-handel/armia/kultura` — eyebrow bez ikony; `PO-*` — ikona 14×14 przed eyebrow.
  `PRZED-surowce` = `PO-surowce` bit-w-bit (ikona w obu), zgodnie z opisem. Zgodne z
  `N12-pomiar.json` i ze źródłem (`brandIconSvg` :3160 `chip-crate`, :3263 `cp-trade`,
  :3761 `tb-army`, :3864 `cp-culture`). Harness C-001-zgodny: `node …/vite/bin/vite.js build
  --outDir` w `mkdtemp` z PID, poza repo; oba warianty z LUSTRA, worktree niemutowany.
- **PK3 — zakres.** `git diff 094be1db..HEAD --stat`: 14 plików = `gra/tools/empire-panel-moc-
  scroll-preserve-test.cjs` + wyłącznie `dyspozycje/autobot/runs/P-DESIGN-11-…/`.
  **`gra/src/**` nietknięte.** Wszystko w allowliście, nic poza nią.
- **Bramki własnym uruchomieniem:** `tsc --noEmit` exit 0 · logic 213/213 · tech-tree 19/19 ·
  research 33/33 · unit-replace 13/13 · combat 6/6 · drobiazgi-runda2 33/33 · moc-scroll 57/57.
  Pięć czerwonych rodziny odtworzone co do liczby: food-b5 25/3, econ-slider-visibility 57/3,
  miasto-obywatele-content 113/2, sliders-always-visible 6/2, hint-toast-zindex (crash własnym
  warunkiem). Lista rodziny zgadza się: 46 trafień grepu, w tym 3 `.py` → 43 `.cjs`, minus
  `preview-unit-side-panel-screenshots.cjs` → 42 bramki.
- **PK4 — pięć WŁASNYCH mutacji, wszystkie inne niż w raporcie Operatora:**
  1. dodanie w `render()` wywołania `zewnetrznaFunkcjaZInnegoModulu()` → **`E1` CZERWONE**
     i nazywa winowajcę wprost (`["zewnetrznaFunkcjaZInnegoModulu"]`);
  2. w gałęzi `resetScrollOnNextRender`: `scrollTop = 0` → `= prevScrollTop` → **54/3**
     (asercja strukturalna + S2 `{"scrollTop":600}` + S3 `{"scrollTop":900}`);
  3. usunięcie `pendingScrollSection = null;` z `render()` → **57/57 ZIELONE, nie złapane**
     (patrz zarzut 4);
  4. dopisanie modułowej `function scrollTarget()` → **`E2` CZERWONE** (34/19);
  5. usunięcie ikony eyebrow z ARMII → `drobiazgi-runda2` **31/2** — kryterium 4 potwierdzone
     niezależnie.

## ZARZUTY

1. **Kryterium końca 7 („cała rodzina panelu imperium zielona") NIE JEST SPEŁNIONE.** Pięć
   bramek czerwonych — zreprodukowałem wszystkie pięć. Jawnie zgłoszone przez Operatora i
   bezspornie pre-istniejące (diff nie rusza `gra/src/**` ani żadnej innej bramki), ale
   kryterium jest binarne i pozostaje niespełnione. Do decyzji Final Control / orkiestratora.
2. **Uzasadnienie tej blokady jest nieścisłe dla dwóch z pięciu.** Raport pisze „nie da się
   spełnić w tej allowliście". `empire-panel-econ-slider-visibility` i
   `empire-panel-sliders-always-visible` czytają `gra/src/ui/empireDetailPanel.ts`, który
   **jest w allowliście**. Prawdziwy powód jest inny i mocniejszy: obie opisują
   `renderDefaultPodzialPracySection()`, funkcję **nieistniejącą już nigdzie w `gra/src`**
   (jedyny ślad to komentarz w `empirePanelSectionMap.ts:102`), a do tego **przeczą sobie
   nawzajem** (jedna chce jej bramkowanej `sliderVis.showLaborSplit`, druga w sekcji ZASOBY).
   Naprawa leży w plikach bramek — poza allowlistą. Uzasadnienie do poprawienia, nie praca.
3. **GOAL 2 i GOAL 3 nie zostały wykonane jako praca — zastano stan docelowy.** Potwierdzam
   fakt: `24456a72` (2026-08-21) jest przodkiem bazy, ikony w czterech zakładkach i komentarz
   przy `cityPoborMiniRekruci()` są w kodzie przed tą rundą. Ale dispatch stawia je jako
   zadania do wykonania, więc realna treść tematu skurczyła się do N1. Operator poszedł
   `PASS-WITH-NOTES`; rozjazd premisy dispatchu ze stanem repo to pozycja do rozstrzygnięcia
   przez orkiestratora, nie do zamknięcia przez wykonawcę.
4. **Nowa luka pokrycia, wykryta moją mutacją 3.** Usunięcie `pendingScrollSection = null;`
   z `render()` (realna regresja: `pendingScrollSection` zostaje ustawione i przy następnym
   renderze wymusiłoby niechciany skok do sekcji) **nie czerwieni bramki** — 57/57. Asercja
   „S1: pendingScrollSection po przebiegu == null" jest w scenariuszu S1 **tautologiczna**
   (parametr wchodzi już jako `null`), a S4, jedyny scenariusz z niepustym
   `pendingScrollSection`, nie ma jej odpowiednika. Luka jest PRE-ISTNIEJĄCA (asercja stała w
   pliku bazowym, tyle że nigdy się nie wykonywała) — Operator jej nie wprowadził. Ale to
   asercja, która **weszła do liczonych 57 i nie może zaczerwienieć**, czyli dokładnie klasa
   problemu, którą ten temat zwalcza. Poprawka: jedna asercja w S4 —
   `pendingScrollSectionAfter === null`.
5. **Przeszacowana teza o stałej liczbie asercji.** Raport i komentarz w bramce twierdzą, że
   po zmianie `safeRun()` „liczba asercji nie zależy już od wyniku bramki". Moja mutacja 4
   daje **53 asercje** (34/19), nie 57: asercje za `if (res)` nadal się nie wykonują, gdy
   runner jest `null`, a pętla `E3` skaluje się z liczbą auto-zaślepek. Kryterium 1 (≥47 w
   stanie zielonym) i tak spełnione z zapasem — do poprawienia jest sformułowanie.
6. **PRZED na zrzutach nie jest bazą tej rundy.** Kryterium 3 mówi „PRZED i PO"; `PRZED-*`
   to odtworzenie stanu sprzed `24456a72`, a nie stanu `094be1db` (na bazie ikony już są).
   Ujawnione wprost w `dowody/README.md` i w raporcie — inaczej się nie da, bo naprawa
   poprzedza bazę. Zapisuję jako pozycję formalną, nie jako zatajenie.

**Nota (nie zarzut):** `dowody/n12-zrzuty-zywy-chromium.cjs:25` ładuje playwright ze
**sztywnej ścieżki `/home/user/The-Game/gra/node_modules`**, a `REAL_GRA` ma sztywny fallback
na `/home/user/wt-design-zakladki/gra`. Odczyt jest nieszkodliwy (`gra/node_modules` w worktree
to i tak dowiązanie tam), ale harness nie jest przenośny. Dodatkowo flaga `--reuse <dir>`
pozwala recyklingować katalog builda — nieużyta w tym przebiegu, jednak to ten sam wzorzec
stałej nazwy, który dał już w tym repo dwa fałszywe wyniki bramek.

---

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1
GOAL: weryfikacja rundy 1 — bramka `empire-panel-moc-scroll-preserve-test.cjs` zielona przy
niezmniejszonej liczbie asercji, werdykt (a)/(b) poparty kodem, N12 udowodnione żywym Chromium,
zakres w allowliście.
ZMIANY-COMMIT: `dyspozycje/autobot/runs/P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1/02-evaluator-runda1.md`
— ten raport. Kodu ani dowodów nie zmieniałem; wszystkie mutacje cofnięte kopią pliku,
`git status --short` pusty.
TESTY (własne uruchomienia): baza 38/9 = 47 asercji · po zmianie 57/57 exit 0 · 0 etykiet
asercji utraconych · tsc 0 błędów · logic 213/213 · tech-tree 19/19 · research 33/33 ·
unit-replace 13/13 · combat 6/6 · drobiazgi-runda2 33/33 · rodzina 42 bramki, 37 zielonych /
5 czerwonych pre-istniejąco (wszystkie pięć zreprodukowane) · mutacje własne: E1 czerwone,
54/3, **57/57 NIEZŁAPANE**, E2 czerwone (34/19), N12-armia 31/2.
BLOKADY: kryterium 7 niespełnione (5 bramek rodziny czerwonych, naprawa poza allowlistą);
rozjazd dispatchu ze stanem repo dla N12/N11 (GOAL 2/3 zastane, nie wykonane).
RUNDY: 1/5
NASTĘPNY KROK: Final Control (werdykt) — sześć ponumerowanych zarzutów wyżej; naprawa
wykonawcza wymagana wyłącznie dla zarzutu 4 (jedna asercja w S4), zarzuty 2 i 5 to korekta
sformułowań w raporcie, zarzuty 1, 3 i 6 to decyzje orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
