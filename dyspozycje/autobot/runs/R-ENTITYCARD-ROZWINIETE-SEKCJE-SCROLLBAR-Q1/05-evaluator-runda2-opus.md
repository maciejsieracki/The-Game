STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1
ROLA: Evaluator, runda 2/5 — Opus 5, effort High (wyjątek graficzny/wizualny §5a, klasyfikacja
potwierdzona w `00b-dispatch-runda2-model-opus.md`)
GOAL (przepisany z `00-dispatch.md`, nie z raportu Operatora): (A) karta technologii ma mieć
WSZYSTKIE sekcje domyślnie ROZWINIĘTE (dziś „Ulepszenia terenu" i „Zmiany ekonomiczne" startują
zwinięte); (B) `.entity-card-dialog` ma mieć TRWALE WIDOCZNY pasek przewijania.
BINARNE KRYTERIUM SUKCESU z dispatchu: żywy zrzut pokazuje obie sekcje rozwinięte od razu po
otwarciu (bez kliknięcia) oraz widoczny pasek przewijania gdy treść przekracza wysokość okna.

ZMIANY-COMMIT:
- Evaluator nie zmienia `gra/`. Oceniany wytwór: `a391307f` (Operator runda 1), potwierdzony bez
  zmian przez `5e435750` (raport Operatora rundy 2).
- Ten commit: wyłącznie ten raport w `dyspozycje/autobot/runs/R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1/`.
  Bez `git add -A`, drzewo czyste przed i po (`git status --porcelain` puste).

ZAKRES DIFFU (sprawdzony osobiście, `git diff --stat e29a772f..HEAD`):
```
 .../00-dispatch.md                                 |  85 +++++
 .../00b-dispatch-runda2-model-opus.md              |  38 +++
 .../01-operator-runda1.md                          |  56 ++++
 .../02-evaluator-runda1.md                         |  93 ++++++
 .../03-obrona-runda1.md                            |  16 +
 .../04-operator-runda2-opus.md                     | 183 +++++++++++
 gra/src/ui/entityCards/renderer.ts                 |  13 +-
 gra/src/ui/entityCards/technologyAdapter.ts        |   4 +-
 ...ycard-rozwiniete-scrollbar-real-render-test.cjs | 351 +++++++++++++++++++++
 9 files changed, 836 insertions(+), 3 deletions(-)
```
Wszystkie 9 pozycji mieszczą się w allowliście `00-dispatch.md` co do pliku. `git diff --check`
czysty. `technologyAdapter.ts` = wyłącznie dwie linie `openDefault` (l. 221, 301), `collapsible:
true` nietknięte. `renderer.ts` = wyłącznie blok CSS `.entity-card-dialog` (l. 702-714);
`buildSectionEl` (l. 219-285) bez zmian — sprawdzone w diffie, nie z raportu.

TESTY (KAŻDY uruchomiony przeze mnie w `/home/user/wt-entitycard-rozwiniete-scrollbar/gra`,
wyniki wklejone, nie streszczone z cudzego raportu):
- `node ./node_modules/typescript/bin/tsc --noEmit` (wersja 5.9.3) → `TSC EXIT=0`, 0 błędów.
  Zero `npm run build`/`npm run dev` (C-001 / §9 poz. 1).
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)` — zgodne z §6.
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 19 pass, 0 fail`.
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33 · ALL GREEN`.
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (13/13)`.
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`.
- `node tools/entity-card-contract-test.cjs` → `75 pass, 0 fail` (bramka rodziny kart, §6).
- `node tools/bramki-tmpdir-unikalnosc-test.cjs` → `PASS=3 FAIL=0` (zielona, ale patrz zarzut #5 —
  ta meta-bramka skanuje tylko pliki używające `os.tmpdir()`, a nowa bramka tematu go nie używa).
- Bramka tematu, uruchomiona od nowa:
  `xvfb-run -a node tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs` → **21 pass, 0 fail**.

WŁASNY, NIEZALEŻNY ŻYWY ZRZUT CHROMIUM (obowiązek §5a dla Evaluatora na Opus 5 — nie polegam na
zrzutach Operatora ani rundy 1):
Skrypt: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/eval-r2/evaluator-r2-opus-proof.cjs`
Zrzuty: `…/scratchpad/eval-r2/shots/`. Wynik: **30 pass, 0 fail**.
Celowo inny od bramki tematu i od skryptu Operatora rundy 2 w pięciu wymiarach:
1. **Kontrola negatywna z REALNEGO Gita, nie z mutacji regexem w pamięci.** `git show a391307f^:…`
   dał prawdziwe `renderer.PRE.ts` / `technologyAdapter.PRE.ts` sprzed tematu. Mutacja regexem
   (technika bramki i Operatora) może cicho nie trafić i dać fałszywy kontrast; źródło z Gita nie może.
2. **Viewport 1280×720** (bramka 900×560, Operator 960×600).
3. **Pętla po WSZYSTKICH 32 technologiach**, nie po jednej „Gospodarka wodna".
4. **Dowód, że uchwyt paska SIĘ PRZESUWA** — sam namalowany prostokąt mógłby być ozdobą.
5. **Klik prawdziwą myszą** `page.mouse.click()` na współrzędnych z `boundingBox()` (realny
   hit-test), nie `element.click()` w JS, który omija trafialność.

Wyniki, które uważam za rozstrzygające:
- (A1) 12/32 kart ma sekcję „Ulepszenia terenu" — **we wszystkich 12** `data-open="1"` i body bez
  `hidden` zaraz po otwarciu, bez kliknięcia. (A2) 25/32 kart ma „Zmiany ekonomiczne" — **we
  wszystkich 25** to samo. Zero wyjątków.
- (A3) `aria-expanded="true"` na nagłówkach obu sekcji we wszystkich kartach; (A4) chevron `▾`,
  nie `▸`; (A5)/(A6) treść obu sekcji ma niezerową wysokość i niepusty tekst — „rozwinięte" znaczy
  realnie widoczne wiersze, nie sam atrybut.
- (A7) gutter paska `offsetWidth − clientWidth ≥ 8px` na **wszystkich 32** kartach, także tych bez
  przepełnienia. 31/32 kart przekracza wysokość dialogu przy 1280×720.
- **(A10, PIKSELE)** karta „Garncarstwo" (`scrollHeight=1134`, `clientHeight=576`), `scrollTop===0`,
  zero interakcji: w pasie prawej krawędzi dialogu **1692 złote piksele** w 6 kolumnach (x=967…972,
  po 278-286 px), kolor próbki `rgb(135,129,90)` — dokładnie `rgba(232,216,138,.55)` skomponowane na
  torze `rgba(20,26,34,.9)`. Uchwyt jest FAKTYCZNIE NAMALOWANY, nie tylko zarezerwowany w layoucie.
- **(A11/A14, PIKSELE)** segmenty gęstych wierszy w pasie: `[[77,78],[85,362],[641,642]]` przy
  `scrollTop=0` → `[[77,78],[357,634],[641,642]]` po przewinięciu na dół. Uchwyt to spójny blok
  **278 px** (krótszy niż dialog 576 px), który **przesunął się o 272 px w dół**. To działający
  pasek przewijania, nie ornament. (Segmenty `[77,78]` i `[641,642]` to górna i dolna krawędź złotej
  ramki karty — odcięte przez segmentację; bez niej pomiar mierzyłby ramkę zamiast uchwytu.)
- (A20) karta bez przepełnienia („Astronomia", `overflows=false`, gutter 10 px): **0 złotych pikseli** —
  `scrollbar-gutter:stable` rezerwuje miejsce, ale nie maluje martwego uchwytu.
- (A17/A18/A19) klik prawdziwą myszą w nagłówek zwija sekcję (`data-open="0"`, body `hidden`,
  `aria-expanded="false"`, wysokość treści 0, chevron `▸`), drugi klik przywraca (`"1"`, widoczna,
  `"true"`, `▾`). **Mechanizm ręcznego zwijania działa w obie strony.**
- (A21, REGRESJA) stos dwóch kart (`data-ec-stack-depth`) nadal działa, obie mają zarezerwowany pasek.
- (A22) zero błędów konsoli/`pageerror`.
- (N1)/(N2)/(N3) na realnym kodzie sprzed tematu: obie sekcje ZWINIĘTE i **0 złotych pikseli** w tym
  samym pasie. Pomiar (A10) mierzy nasz pasek, nie cokolwiek żółtego na karcie.

**Obejrzałem zrzuty własnymi oczami** (nie tylko liczby):
- `ev-01-PO-bez-interakcji.png` — złoty pasek widoczny natychmiast przy prawej krawędzi, uchwyt przy górze.
- `ev-04-PO-cala-karta-1280x1600.png` — cała karta „Garncarstwo" w jednej klatce, zero kliknięć:
  „Ulepszenia terenu" (Glinianka, Warzelnia soli) i „Zmiany ekonomiczne" (Spichlerz +1 żywność,
  Spichlerz — utrzymanie 1 złota/turę, Garncarnia praca +2, Cegielnia praca +2, Dostęp do surowca)
  ROZWINIĘTE, wszystkie nagłówki z `▾`.
- `ev-07-PRZED-ta-sama-karta.png` — ta sama karta sprzed tematu: sekcje zwinięte, szary natywny pasek
  15 px oraz **poziomy pasek przewijania u dołu**, którego `scrollbar-gutter:stable` się pozbywa.

WERDYKT CO DO GOAL: **binarne kryterium sukcesu z `00-dispatch.md` = PRAWDA.** Commit `a391307f`
realizuje (A) dla obu nazwanych sekcji i (B) w Chromium — potwierdzone moim własnym, niezależnym
żywym zrzutem i analizą pikseli, nie cudzym raportem.

BLOKADY: brak.

RUNDY: 2/5 (obrona rundy 1 nie była osobną rundą, §3a — licznik nie został zresetowany)

ZARZUTY (numeracja ciągła przez wszystkie rundy tematu, §3c pkt 4; #1 padł w rundzie 1):

**#2 — Bramka tematu nie ma ANI JEDNEJ asercji z żywego renderu, która odróżnia pasek sprzed
tematu od paska po zmianie. Kryterium (K3) jest w środowisku, w którym bramka faktycznie biegnie,
TAUTOLOGICZNE.**
Miejsce: `gra/tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs`, l. 290-291 (K3:
`post.scrollbarWidth >= 8`) — oraz brak jakiegokolwiek odpowiednika K3 w części PRZED (l. 327-335).
Narusza: §16a pkt 8 („dowód nietautologiczności testu — mutacja źródła czerwieni test"),
§9 poz. 6a („plus dowód nietautologiczności — zmutuj źródło i pokaż, że test faktycznie czerwienieje")
oraz REGUŁĘ PRZECIW SAMOOSZUKIWANIU z `00-dispatch.md` („sam kod źródłowy CSS nie jest dowodem").
Dowód z pomiaru, nie z rozumowania — mój przebieg na tej samej maszynie, tym samym Chromium:
`PRZED: gutter=15px, ::-webkit-scrollbar width="auto" vs PO: gutter=10px, ::-webkit-scrollbar width="12px"`.
Kryterium K3 brzmi `>= 8`, więc na kodzie **sprzed tematu wypada 15 ≥ 8 = ZIELONE**. Bramka nigdy nie
uruchamia K3 na wersji PRZED, więc tego nie zauważa. Pozostałe asercje dotyczące paska to:
(0) trzy regexy na tekście `renderer.ts` — czyli dokładnie „sam kod źródłowy CSS", który dispatch
wprost dyskwalifikuje jako dowód; oraz (PRE) porównanie `getComputedStyle(dialog,'::-webkit-scrollbar').width`
— które odczytuje DEKLARACJĘ reguły, nie to, czym silnik maluje. Że to dwie różne rzeczy, widać
w moich liczbach: deklaracja mówi `12px`, a realnie zarezerwowane i namalowane jest `10px`, bo
Chromium mając na tym samym elemencie `scrollbar-width:thin` + `scrollbar-color` **ignoruje blok
`::-webkit-scrollbar`**. Znaczenie dla GOAL: część (B) GOAL jest dziś w `main` chroniona wyłącznie
przez asercje, które przeszłyby także bez zmiany. Regresja CSS paska (np. czyjeś późniejsze usunięcie
`scrollbar-color`) zostawi bramkę zieloną. Konkretna, tania poprawka: przenieść do bramki pomiar,
który u mnie odróżnia obie wersje 1692 vs 0 — liczbę złotych pikseli w pasie prawej krawędzi
dialogu, uruchomioną na obu wersjach; albo minimalnie: powtórzyć K3 w części PRZED i zażądać, żeby
wynik był INNY niż w części PO. Uwaga: to zarzut wobec BRAMKI, nie wobec zmiany w `gra/src/` —
sama zmiana jest poprawna i udowodniona (moje A10/A14/N3).

**#3 — Uwaga Operatora nr 2 („Pokaż pozostałe N") dotyczy GOAL i NIE została zapisana w rejestrze,
więc `PASS-WITH-NOTES` nie może domknąć tematu.**
Miejsce: `04-operator-runda2-opus.md`, NOTY pkt 2 („sam niczego nie rejestrowałem w
`dyspozycje/PYTANIA-OTWARTE.md`"); wytwór: `gra/src/ui/entityCards/technologyAdapter.ts:195-198`
(`previewLimit: unitsRows.length > UNIT_PREVIEW ? UNIT_PREVIEW : undefined`) i
`gra/src/ui/entityCards/renderer.ts:242-254` (`moreBtn.textContent = 'Pokaż pozostałe ' + hiddenRows.length`).
Narusza: §3b („kończy proces wyłącznie wtedy, gdy uwagi są kosmetyczne **i zostały zapisane jako
osobny temat w rejestrze** — nie zostawione w raporcie jako wolna uwaga"), §14 („gdy w trakcie pracy
pojawi się pomysł spoza GOAL — **zapisz go jako nowy temat w `REJESTR-PROSB-I-ZADAN.md`** i wróć do
swojego" — to obowiązek Operatora, nie orkiestratora), §16a pkt 9 (rozbieżność GOAL raportu vs GOAL
dispatchu wymaga zgłoszenia niezależnie od wyniku).
Sprawdziłem osobiście: `grep -niE "ENTITYCARD-ROZWINIETE|POKAZ-POZOSTALE|previewLimit|UNIT_PREVIEW"`
po `dyspozycje/REJESTR-PROSB-I-ZADAN.md` i `dyspozycje/PYTANIA-OTWARTE.md` — **zero trafień** dla tej
luki (jedyne trafienie to niezwiązany, zamknięty `P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1`).
Znaczenie dla GOAL: GOAL dispatchu brzmi „WSZYSTKIE sekcje domyślnie ROZWINIĘTE", a dosłowne
zgłoszenie właściciela brzmi „za każdym razem muszę klikać i rozwijać". Sekcja „Jednostki" ma
`openDefault: true`, ale nadal chowa nadmiar za przyciskiem wymagającym kliknięcia — czyli dokładnie
czynność, na którą właściciel się skarżył, zostaje w produkcie. Operator **słusznie** tego nie
naprawiał (allowlista dopuszcza w `technologyAdapter.ts` wyłącznie linie `openDefault`, §14 zakazuje
poszerzania w biegu) — ale zamiast rejestracji zostawił to jako wolną uwagę w raporcie, czyli
dokładnie w formie, którą §3b nazywa „uwagą, której nikt później nie znajdzie". Poprawka: wpis do
`dyspozycje/REJESTR-PROSB-I-ZADAN.md` (ścieżka jest w allowliście tego tematu? — **nie jest**, więc
wpis wykonuje orkiestrator przy integracji albo osobny mikro-temat; do rozstrzygnięcia przez Final
Control, czy to `NAPRAW` dla Operatora czy pozycja integracyjna).

**#4 — Nowa bramka nie została wpisana do tabeli §6 `R-PROC-AUTOBOT.md`, a §6 nazywa ten wpis
częścią integracji tematu, który bramkę stworzył.**
Miejsce: `gra/tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs` istnieje i jest zielona,
ale `grep -n "entitycard-rozwiniete-scrollbar" docs/decyzje/R-PROC-AUTOBOT.md` → **BRAK**.
Narusza: §6 („**Nowa bramka istnieje dopiero wtedy, gdy jest w tej tabeli.** Bramka niewpisana do §6
nie trafia do żadnej listy uruchamianej przez kolejne tematy, więc po kilku falach nikt jej nie odpala
i weryfikator zamówiony jako trwały cicho umiera. Wpis do tabeli jest częścią integracji tematu, który
bramkę stworzył — nie osobnym zadaniem na później"), z jawnym precedensem
`P-BRAMKA-AI-BUDYNKI-NIEZAREJESTROWANA-W-PROC-Q1`.
Znaczenie: bramka wymagana przez REGUŁĘ PRZECIW SAMOOSZUKIWANIU tego dispatchu przestanie być
uruchamiana, więc ochrona GOAL wygasa po cichu. Uwaga proceduralna dla Final Control: `R-PROC-AUTOBOT.md`
**nie jest w allowliście** tego tematu, a §9 poz. 4 zabrania wożenia zmian procesu w allowliście tematu
produktowego — więc to zadanie orkiestratora przy integracji, nie `NAPRAW` dla Operatora. Zgłaszam,
bo żaden raport obu rund tego nie odnotował, a §6 wprost zabrania odkładania tego „na później".

**#5 — Bramka pisze pliki tymczasowe pod STAŁYMI nazwami do `gra/tools/`, a dwa z trzech nie są
w `.gitignore`.**
Miejsce: `gra/tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs`, l. 53-55
(`ENTRY = …/.entitycard-rozwiniete-scrollbar-entry.ts`,
`OUTFILE_FIXED = …/.entitycard-rozwiniete-scrollbar-bundle-fixed.cjs`,
`OUTFILE_PRE = …/.entitycard-rozwiniete-scrollbar-bundle-pre.cjs`).
Sprawdziłem osobiście: `git check-ignore -v` obejmuje **tylko** `.entry.ts` (przez `.gitignore:64
gra/tools/.*-entry.ts`); dla obu plików `*-bundle-*.cjs` `git check-ignore` zwraca `exit=1` — **nie są
ignorowane**.
Narusza ducha §6 („**Katalog tymczasowy bramki musi być unikalny per przebieg.** Stała nazwa […] dała
w tym repo już dwa potwierdzone fałszywe wyniki: fałszywy ZIELONY […] i fałszywy CZERWONY […]. Wzorzec
bezpieczny: `fs.mkdtempSync(...)`" — `P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1`) oraz stwarza ryzyko przy
§9 poz. 2: przerwany przebieg (timeout/kill przed `finally`) zostawia w drzewie roboczym dwa
nieignorowane pliki, które `git status` pokaże jako nowe artefakty w `gra/`.
Uwaga: meta-bramka `tools/bramki-tmpdir-unikalnosc-test.cjs` jest ZIELONA (`PASS=3 FAIL=0`) i tego nie
łapie — skanuje wyłącznie pliki używające `os.tmpdir()`, a ta bramka `os.tmpdir()` w ogóle nie używa,
tylko pisze do repo. To ta sama klasa defektu w miejscu poza zasięgiem istniejącego strażnika.
Poprawka mieści się w allowliście tematu (`gra/tools/*.cjs`): `fs.mkdtempSync(path.join(os.tmpdir(),
'entitycard-rozwiniete-scrollbar-'))` i wszystkie trzy pliki w tym katalogu.

CZEGO NIE ZARZUCAM (sprawdzone i czyste, żeby Final Control nie musiał zgadywać, czy sprawdziłem):
- §16a pkt 1 — diff mieści się w allowliście co do pliku (tabela wyżej).
- §16a pkt 2 / §9 — poz. 1 (zero `npm run build`/`dev`, jedyna kompilacja `tsc --noEmit`), poz. 2
  (zakres diffu dowodzi braku `git add -A`), poz. 3 (`git diff e29a772f..HEAD | grep -inE
  'api[_-]?key|secret|token|password|BEGIN … PRIVATE KEY'` → zero trafień), poz. 4 (żaden plik procesu
  w diffie), poz. 5 (`WERSJE.md` i `ROBOCZA-MANIFEST.json` nietknięte), poz. 8 (DEPLOY/PUSH NIE
  WYKONANO), poz. 11 (parytet gracz↔AI — temat czysto prezentacyjny, zero logiki/danych/ekonomii).
- §16a pkt 3 — bramki uruchomione niezależnie, wyniki wklejone wyżej.
- §16a pkt 4 — brak dotknięcia trwałego stanu (save/load), parytetu i ścieżek brzegowych; zmiana to
  dwa literały `openDefault` i blok CSS.
- §16a pkt 6 — zero usunięć poza `openDefault: false` → `true` i jedną linią CSS zastąpioną blokiem;
  mechanizm akordeonu żyje (moje A17/A19 klikiem prawdziwej myszy).
- §16a pkt 7 — brak nakładania z drugim aktywnym tematem: `wt-hotseat-etap4-noop-harness` dotyka
  `gra/tools/hotseat-etap4-noop-test.cjs`, `wt-ulepszenia-farma-irygacja-bydlo-stack` dotyka
  `gra/src/map/improvement-build.ts` i `gra/tools/map-improvement-qualify-test.cjs` — zero wspólnych
  plików z tym tematem (sprawdzone `git diff --name-only` od `merge-base` dla obu gałęzi).
- §16a pkt 8 — żywy zrzut Chromium istnieje (mój własny, wyżej). Dowód nietautologiczności dla części
  (A) GOAL jest realny i mocny (K4 bramki + moje N1/N2: identyczny pomiar daje przeciwny wynik na kodzie
  sprzed tematu). Dla części (B) — patrz zarzut #2, tam go w bramce nie ma.
- §16a pkt 9 — GOAL w raporcie Operatora jest ZAWĘŻONY względem GOAL dispatchu („obie nazwane sekcje"
  vs „WSZYSTKIE sekcje"), ale to zawężenie jest w samym dispatchu (binarne kryterium sukcesu wymienia
  dwie sekcje), a Operator jawnie zgłosił resztę luki w nocie 2 — więc to nie utrata kontekstu, tylko
  materiał zarzutu #3.
- §16a pkt 10 — temat nie jest dzielony na węzły.
- §0c (CLAUDE.md) — `grep -nE 'STATUS:[[:space:]]*\*{0,2}OTWARTE' dyspozycje/PYTANIA-OTWARTE.md` → 72
  trafienia; niczego w tej rundzie nie rejestrowałem, więc kontrola nie miała nowych pozycji do objęcia.

NOTY (nie zarzuty — obserwacje dla Final Control i orkiestratora):
1. **`::-webkit-scrollbar` jest w Chromium 1194 nieaktywny na tym elemencie.** Zmierzone: deklaracja
   `12px`, realny gutter `10px`, uchwyt 6 kolumn — czyli maluje `scrollbar-width:thin` +
   `scrollbar-color`, bo Chromium mając niedomyślne `scrollbar-width`/`scrollbar-color` ignoruje blok
   `::-webkit-scrollbar`. Nie jest to defekt: blok pozostaje sensownym fallbackiem dla starszego
   WebKit/Safari, a widoczny efekt jest dokładnie ten zamówiony. Ma jednak znaczenie dla zarzutu #2 i
   dla każdego, kto później będzie ten CSS czytał — komentarz w `renderer.ts:705-709` sugeruje podział
   „Firefox u góry, WebKit/Chromium niżej", który w praktyce nie odpowiada temu, co robi Chromium.
2. Dowód wizualny mam wyłącznie z Linux/Chromium. Potwierdzam obserwację Operatora (nota 1): dla macOS
   i Firefoksa argument jest z zachowania silnika, nie z mojego zrzutu. Dispatch to wprost dopuszcza
   („jeśli napotkasz twardy limit platformy, opisz to w raporcie zamiast obiecywać coś, czego CSS nie
   potrafi wymusić"), więc nie robię z tego zarzutu.
3. Potwierdzam obserwację Operatora (nota 4) własnym zrzutem: `ev-07-PRZED-ta-sama-karta.png` pokazuje
   poziomy pasek przewijania u dołu dialogu, którego `ev-01-PO-bez-interakcji.png` już nie ma —
   `scrollbar-gutter:stable` usuwa go przy okazji. Plus, nie regresja.
4. Uczciwie o własnym pomiarze: pierwsze dwa przebiegi mojego skryptu dały FAIL na (A11)/(A14)/(A20).
   Zbadałem to i **przyczyną był mój własny pomiar, nie produkt**: pas prawej krawędzi łapał złotą
   ramkę karty (kolumna pionowa 564 px oraz dwa 2-wierszowe segmenty poziome), przez co „uchwyt"
   wychodził na całą wysokość dialogu i pozornie się nie ruszał. Po dodaniu progu gęstości wiersza i
   segmentacji (najdłuższy spójny segment = uchwyt) wynik to 30/0, a surowe dane
   (`[[85,362]]` → `[[357,634]]`) są jednoznaczne. Zapisuję to, bo gdybym poprzestał na pierwszym
   przebiegu, wystawiłbym trzy fałszywe zarzuty.

NASTĘPNY KROK: Obrona Operatora do zarzutów #2-#5 (§3c pkt 2, odpowiedź PRZYJMUJĘ/ODRZUCAM z dowodem
z wytworu dla KAŻDEGO z osobna) → Final Control (Sonnet 5, effort High) orzeka per zarzut. Moja
rekomendacja co do charakteru pozycji, nie przesądzająca werdyktu: #2 i #5 są w allowliście tematu
(`gra/tools/*.cjs`) i wykonalne przez Operatora; #3 i #4 wymagają plików spoza allowlisty
(`REJESTR-PROSB-I-ZADAN.md`, `R-PROC-AUTOBOT.md`), więc są pozycjami integracji orkiestratora — §9 poz. 4
zabrania wożenia ich w allowliście tematu produktowego. Sama zmiana w `gra/src/` jest gotowa do
integracji i GOAL realizuje; żaden z zarzutów nie kwestionuje `a391307f` w części `gra/src/`.
DEPLOY/PUSH: NIE WYKONANO
