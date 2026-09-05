# P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1 — dispatch

TEMAT: `P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1`
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — **Opus 5**, effort high; Evaluator — **Opus 5**, effort high
(temat wizualny/UX, `R-PROC-AUTOBOT.md` §9 poz. 6b); Final Control — Sonnet 5, effort high.

## WYZWALACZ (dosłownie, wiadomość właściciela ze zrzutem)

> „Prosiłem cię poprzednio, żeby poprawić przyciski w kartach innego typu. Na przykład
> na tym zdjęciu zamiast dać brązowienie w ramkę i możliwość podświetlania, dodałeś
> w ramkę szczegóły, które pojawiają się po najechaniu. To nie tak miało być.
> Brązowienie miało być ramką bez linii podkreślania, tak jak w technologiach, a nie
> w kartach budynków. Powinno być wykonane tak samo, spójnie: tak jak wygląda karta
> technologii, tak samo powinny wyglądać inne karty. Czyli **brązowienie powinno być
> przyciskiem bez szczegółów, otoczone ramką, i po najechaniu ma się podświetlać**."

Zrzut: karta technologii „Obróbka drewna". Widać wiersze `Stolarnia`, `Palisada
drewniana`, `Taran`, `Brązownictwo` — każdy jako zwykły tekst po lewej **plus osobny
przycisk „Szczegóły →" po prawej**. Niżej, w sekcji Wymagania, widać wzorzec, który
właściciel wskazuje jako POPRAWNY: pigułka `Żegluga` — sama nazwa w ramce, bez
podkreślenia, bez żadnego dodatkowego tekstu.

## BŁĄD, KTÓRY TO POPRAWIA (przyznany przez orkiestratora)

Poprzednie zgłoszenie („one nie mają przycisku, który się podświetla") zostało
zrealizowane w `R-CIVPEDIA-KARTY-SPOJNOSC-Q1-A` jako **osobny przycisk akcji
„Szczegóły →" po prawej stronie wiersza** (`technologyAdapter.ts:241` i analogiczne:
`value: 'Szczegóły →'` dla `buildingsRows`, `unitsRows`, `nextTechsRows`).
Właściciel prosił o coś innego: **żeby przyciskiem stała się SAMA NAZWA**.

Ironia do odnotowania: tamten temat zapisał jako „udokumentowany wyjątek" fakt,
że pigułki Wymagań pokazują nazwę technologii zamiast „Szczegóły →". **To nie był
wyjątek — to był jedyny wiersz zrobiony dobrze.** Reszta ma się do niego upodobnić.

## RECON (zweryfikowany odczytem kodu, do POTWIERDZENIA przez Operatora)

**A. Dwa warianty wiersza, dwa różne kształty DOM** — `gra/src/ui/entityCards/renderer.ts`:
- `buildGridRowEl` (l. 124-157, `layout:'grid'`, domyślny): `span.entity-card-row-key`
  (etykieta = NAZWA encji) + `button|span.entity-card-row-value` (l. 135 — to `linkTo`
  robi z tego `<button>`) + opcjonalny `span.entity-card-row-trailing`.
  **Dziś klikalny jest `value`, nie nazwa.**
- `buildPillRowEl` (l. 164-176, `layout:'pills'`, dziś tylko sekcja Wymagania):
  `span.entity-card-pill` > `button.entity-card-pill-text` z **`row.label` jako treścią**
  + `b.entity-card-pill-check`. **To jest wzorzec, który właściciel wskazał jako poprawny.**

**B. Pudełko przycisku (ramka + hover) JUŻ ISTNIEJE i jest wspólne** — `renderer.ts`
l. 639-663: `button.entity-card-row-value`, `button.entity-card-row-action-text`,
`button.entity-card-pill-text`, `button.entity-card-civpedia-link` dzielą jedną regułę
`display:inline-block;padding:2px 10px;border:1px solid rgba(232,216,138,.42);
border-radius:8px;background:linear-gradient(...)` oraz wspólny `:hover`
(`border-color:#e8d88a;color:#f4e6a8`). `text-decoration:none` też już jest (l. 644) —
**„bez linii podkreślania" jest spełnione, nie trzeba nic usuwać.**
Jest też komentarz z RUNDY 1 OBRONY (l. 645-651): pudełko MUSI rysować ten sam element,
który łapie kliknięcie — inaczej „przycisk" jest tylko obrazkiem przycisku.
**Ta zasada wiąże też ciebie.**

**C. Delegacja kliknięć** — `renderEntityCard` łapie `target.closest('button[data-entity-kind]')`,
więc przeniesienie atrybutów `data-entity-kind`/`data-entity-id` z `value` na przycisk
nazwy **nie wymaga nowego listenera** — wystarczy, żeby nowy element był `<button>`
z tymi atrybutami.

**D. Fallback „cały wiersz klikalny"** — `renderer.ts` l. 145-150 dodaje
`entity-card-row--linked` + `data-row-entity-*` na CAŁYM wierszu
(`P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1`). Zostaje bez zmian — to hit-area
zapasowa, nie warstwa wizualna.

**E. Wyjątek na pusty przycisk** — l. 673:
`button.entity-card-row-value:empty{border:0;background:none;box-shadow:none;padding:0;}`
Ten wyjątek stanie się PODSTAWOWĄ ścieżką dla wierszy Budynki/Jednostki/Kolejne
technologie, gdy `value` opustoszeje. Sprawdź, czy nadal działa — a jeśli po zmianie
`value` będzie ZAWSZE puste w tych sekcjach, rozważ usunięcie pola zamiast zostawiania
pustego `<button>` w DOM (decyzja Operatora, uzasadnij w raporcie).

**F. Adaptery ustawiające dziś `'Szczegóły →'`** — `gra/src/ui/entityCards/technologyAdapter.ts`
(m.in. l. 241 dla `nextTechsRows` z gałęzią `otherPrereqs`, oraz analogiczne miejsca dla
`buildingsRows` i `unitsRows`). **Zinwentaryzuj WSZYSTKIE wystąpienia we WSZYSTKICH
adapterach** (`technologyAdapter`, `buildingAdapter`, `unitAdapter`, `improvementAdapter`)
— zgłoszenie mówi „tak samo powinny wyglądać inne karty", więc zakres to każda karta,
nie tylko technologii.

**G. `trailing` zostaje.** Na zrzucie wiersz `Brązownictwo` ma po prawej „Wymaga też:
Garncarstwo, Murarstwo" — to informacja o INNYCH technologiach niż cel wiersza
(`technologyAdapter.ts:231-241`), nie przycisk. **Nie usuwaj jej** — właściciel
kwestionuje „Szczegóły →", nie tę adnotację.

## GOAL

### GOAL 1 — nazwa encji JEST przyciskiem

W wierszu z `linkTo` klikalnym, oramkowanym przyciskiem staje się **nazwa encji**
(dzisiejszy `entity-card-row-key`), wizualnie identycznym z `button.entity-card-pill-text`
z sekcji Wymagania: ramka, brak podkreślenia, podświetlenie border+color po najechaniu,
`focus-visible` jak pozostałe przyciski. Tekst „Szczegóły →" **znika całkowicie** —
z każdego adaptera i z każdej karty.

Wiąże zasada z RUNDY 1 OBRONY (recon B): **pudełko rysuje dokładnie ten element,
który łapie kliknięcie.** Ikona wiersza (`entity-card-row-icon`) zostaje SIOSTRĄ
przycisku, poza jego ramką — tak jak `entity-card-pill-check` stoi obok
`entity-card-pill-text`, a nie w środku.

### GOAL 2 — spójność między wszystkimi czterema typami kart

Ten sam wygląd i to samo zachowanie na karcie technologii, budynku, jednostki
i ulepszenia terenu. Zinwentaryzuj i wypisz w raporcie **tabelę: karta → sekcja →
czy wiersze mają `linkTo` → jak wyglądają przed i po zmianie.**

### GOAL 3 — naprawa regresu klikalności (ten sam plik, ta sama warstwa)

`gra/tools/improvement-card-callsites-test.cjs` jest **czerwony 34/2** na `origin/main`
i był **zielony 36/0** przed integracją `R-CIVPEDIA-KARTY-SPOJNOSC-Q1`
(orkiestrator zmierzył parytet wobec `40bc1e27^` = `d2a5b6f3`; to regres, nie stara
resztka). Objaw, scenariusz [1], żywy Chromium 1280×900:

```
FAIL: elementFromPoint na środku wiersza ulepszenia trafia w SAM PRZYCISK
      (nie w tło/kartę pod spodem) — {"tag":"DIV","className":"tdn-back"}
FAIL: realny klik otwiera ZAGNIEŻDŻONĄ kartę encji improvement — null
```

Hipoteza orkiestratora (do potwierdzenia LUB obalenia, nie do przyjęcia na wiarę):
`ensureEntityCardOverrideStyles()` w `techDiscoveryNotice.ts` (ok. l. 744-790) nadało
karcie STAŁĄ wysokość `min(80vh,calc(100vh - 36px))` z `overflow:auto` zamiast dawnego
`max-height`. Przedtem karta rosła z treścią, więc po rozwinięciu sekcji „Ulepszenia
terenu" wszystkie wiersze były w układzie i hit-testowalne; teraz wiersz może wypaść
poza przycięty box, a w tym punkcie na wierzchu jest `.tdn-back` (którego listener
ZAMYKA kartę).

**Rozstrzygnij dwie wykluczające się hipotezy ŻYWYM DOWODEM:**
- **(H1) defekt produktu** — gracz realnie nie dosięga wiersza → napraw KOD;
- **(H2) przestarzały test** — wiersz jest osiągalny przez scroll wewnątrz karty,
  a test po prostu nie przewija przed klikiem → napraw TEST (`scrollIntoViewIfNeeded()`)
  i powiedz to wprost.

Zrób zrzut po rozwinięciu sekcji, **obejrzyj go**, zmierz `scrollHeight` vs
`clientHeight` karty i pozycję wiersza względem przyciętego boxa, sprawdź czy po
przewinięciu `elementFromPoint` trafia w przycisk. Zrzut do `dowody/`.

Uwaga: GOAL 1 zmienia dokładnie ten element, w który ten test celuje — zrób GOAL 3
**po** GOAL 1 i zmierz stan ponownie, bo objaw może się zmienić albo zniknąć.

### GOAL 4 — bramka testowa

Rozszerz `gra/tools/civpedia-*` albo dodaj nową bramkę (decyzja Operatora, uzasadnij),
minimum:
1. w karcie technologii wiersz Budynku ma `<button data-entity-kind="building">`,
   którego treścią jest NAZWA budynku (nie „Szczegóły →");
2. `getComputedStyle` tego przycisku: `border-width` ≠ 0, `text-decoration-line: none`;
3. prostokąt narysowanego pudełka pokrywa się z prostokątem elementu klikalnego
   (tolerancja ≤2px — to jest asercja przeciw powtórce „obrazka przycisku" z RUNDY 1);
4. hover zmienia `border-color` na złoty (pomiar `getComputedStyle` przed i po);
5. `'Szczegóły →'` NIE występuje w DOM żadnej z czterech kart — skan negatywny;
6. realny klik w nazwę otwiera właściwą kartę encji (`elementFromPoint` = BUTTON).

## KRYTERIA KOŃCA (binarne)

- [ ] `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
- [ ] `node tools/improvement-card-callsites-test.cjs` — **36/0**, zero faili.
- [ ] Nowa/rozszerzona bramka GOAL 4 — 100% pass, minimum 6 asercji z listy.
- [ ] Zrzuty żywego Chromium wszystkich czterech typów kart w `dowody/`, obejrzane,
      z opisem — **temat wizualny bez obejrzanego zrzutu jest niezamknięty (§9 poz. 6)**.
- [ ] Raport jawnie rozstrzyga H1/H2 z GOAL 3 z dowodem.
- [ ] Bez regresu: `unit-info-card-viewport-height-real-render-test.cjs` (35/35),
      `civpedia-*` (116/116, 18/18), `tech-discovery-card-real-click-test.cjs`,
      `entity-card-contract-test.cjs` (uwaga: TA bramka jest czerwona PRE-ISTNIEJĄCO,
      `ReferenceError: requestAnimationFrame is not defined` — parytet wobec `d2a5b6f3`
      potwierdzony przez orkiestratora; nie naprawiasz jej, ale **nie pogarszasz**).
- [ ] Pięć bramek referencyjnych bez regresu: logic 213/213, tech-tree 19/19,
      research 33/33, unit-replace 13/13, combat 6/6.

## REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

**Tryb pierwszy, historycznie potwierdzony w TYM module (RUNDA 1 OBRONA, `renderer.ts`
l. 645-651): pomalowanie pudełka na kontenerze, a nie na elemencie klikalnym.** Zmierzono
wtedy na żywo 88,1×22,2 px „przycisku" wobec 52,0×16,2 px realnie klikalnego tekstu —
41% szerokości było martwą strefą z mylącym `cursor:pointer`. Zakaz uznania GOAL 1 za
zrobiony bez asercji porównującej `getBoundingClientRect()` pudełka i elementu łapiącego
klik.

**Tryb drugi: uznanie tematu wizualnego za zamknięty bez zrzutu z żywego Chromium.**
Wymagany zrzut KAŻDEGO z czterech typów kart, obejrzany, opisany. Zrzut, którego nie
obejrzałeś, nie jest dowodem.

**Tryb trzeci: naprawa testu zamiast produktu w GOAL 3, bez postawienia pytania.**
Test przestaje czerwienić po dodaniu jednej linii `scrollIntoViewIfNeeded()` — i to
jest poprawne WYŁĄCZNIE gdy H2 jest prawdziwe. Zakaz dodania tej linii, zanim nie
pokażesz pomiarem i zrzutem, że gracz realnie dosięga wiersza.

**Tryb czwarty: test tautologiczny.** Pokaż, że nowa bramka czerwienieje po mutacji
źródła — przywróć `value:'Szczegóły →'` w jednym adapterze, uruchom, wklej liczbę
faili, cofnij.

## ALLOWLISTA

- `gra/src/ui/entityCards/renderer.ts`
- `gra/src/ui/entityCards/technologyAdapter.ts`
- `gra/src/ui/entityCards/buildingAdapter.ts`
- `gra/src/ui/entityCards/unitAdapter.ts`
- `gra/src/ui/entityCards/improvementAdapter.ts`
- `gra/src/ui/entityCards/types.ts` (tylko jeśli zmiana kontraktu jest konieczna —
  uzasadnij w raporcie)
- `gra/src/ui/techDiscoveryNotice.ts`
- `gra/tools/improvement-card-callsites-test.cjs`
- `gra/tools/civpedia-*-test.cjs` oraz ewentualna NOWA bramka `gra/tools/*-test.cjs`
- `dyspozycje/autobot/runs/P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`,
**`gra/src/main.ts`** (świadomie poza allowlistą — równolegle biegnie
`R-HANDEL-WYMIANA-TECH-GATE-Q1`, który ten plik zmienia; `R-PROC-AUTOBOT.md` §2b).
Jeżeli zmiana wymaga `main.ts` — `DECISION_REQUIRED`, z nazwaniem co dokładnie tam
trzeba zmienić.

## IZOLACJA

Worktree `/home/user/wt-civpedia-nazwa-przyciskiem`, gałąź
`autobot/P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1`, baza jawnie `origin/main` —
potwierdź `git log -1` PRZED pracą.

C-001, brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje
JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist
--emptyOutDir". Jedyna dozwolona kompilacja: `node ./node_modules/typescript/bin/tsc
--noEmit`; bramki `node tools/*-test.cjs` nie są zakazem objęte. `--outDir` poza drzewem
repo (np. `/tmp/civ-dist-nazwa-przyciskiem`).

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Nie cofasz stałej wysokości kart (80vh) ani szerokości referencyjnej 660px — to jawne
  żądania właściciela z `R-CIVPEDIA-KARTY-SPOJNOSC-Q1`.
- Nie usuwasz `trailing` („Wymaga też: …") — właściciel kwestionuje „Szczegóły →",
  nie tę adnotację.
- Nie usuwasz fallbacku „cały wiersz klikalny" (`entity-card-row--linked`) — to hit-area
  zapasowa z osobnego, zatwierdzonego tematu.
- Nie naprawiasz trzech pozostałych czerwonych bramek (`oboz-lowiecki-las-test` 72/19,
  `map-improvement-qualify-test` 130/1, `entity-card-contract-test` wyjątek) — mają
  własny, osobny temat.
- Nie dotykasz `main.ts`.
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno, integracja allowlist-only ręką orkiestratora.

---

# RUNDA 2 — RATYFIKACJA ROZSZERZENIA ALLOWLISTY (orkiestrator)

DATA: 2026-09-04
STATUS RUNDY 1: `DECISION_REQUIRED` — Operator i Evaluator niezależnie ustalili to samo.

## Co ratyfikuję i dlaczego

Regres 3 asercji `(B6)` siedzi w bramce **spoza allowlisty rundy 1**:
`gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs` (baza `144/1` → HEAD `137/4`).

Przyczyna jest jedna i udokumentowana: strażnik `clickRowLabel()` (ok. l. 273-297)
**przerywa scenariusz BEZ kliknięcia**, gdy punkt etykiety należy do
`button[data-entity-kind]`. Ten warunek napisano wtedy, gdy etykieta **nie była
przyciskiem** — po GOAL 1 jest, więc strażnik blokuje własny scenariusz.

**Dowód, że produkt jest sprawny, a wadą jest test:** kopia scratch ze zdjętym tym
JEDNYM warunkiem daje `144/1`, czyli **dokładnie wynik bazy**, z pre-istniejącym `(B7)`
identycznym co do wartości (`cardClientH:470, cardScrollH:690`). Zweryfikowane osobno
przez Operatora i przez Evaluatora, na dwóch niezależnych przebiegach.

**ALLOWLISTA ROZSZERZONA o:** `gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs`

## R2-1 — jedyne zadanie tej rundy

Zdejmij w tej bramce **wyłącznie** warunek przerywający scenariusz, gdy punkt etykiety
należy do przycisku encji. Nic więcej w tym pliku.

Kryterium: bramka wraca do `144/1`, a jedyny fail to pre-istniejące `(B7)` — **potwierdź
parytet `(B7)` z bazą co do wartości**, nie tylko co do liczby.

## GRANICE TEJ RUNDY

- **NIE zmieniasz produktu.** GOAL 1-4 rundy 1 są zamknięte i zweryfikowane; ta runda
  dotyka wyłącznie przestarzałego strażnika w jednej bramce.
- Nie „naprawiasz przy okazji" pre-istniejącego `(B7)` — ma zostać, jest poza tematem.
- Nie ruszasz pozostałych bramek pre-istniejąco czerwonych (niżej).

## R2-2 — zapis do rejestru, bez naprawy

Operator zgłosił rzecz, której **nie było w moim dispatchu wśród trzech znanych czerwonych
bramek**, a która jest pre-istniejąca na bazie:
- `civpedia-caly-wiersz-przyciskiem-test.cjs` — 19 faili,
- `entity-card-cross-links-nested-overlay-test.cjs` — 10 faili.

Wzorzec `depthBefore:1, depthAfter:1` przy poprawnym `cardTop` sugeruje **wspólną
przyczynę: karta zagnieżdżona ZASTĘPUJE kartę źródłową zamiast kłaść się na niej**.
**Nie naprawiaj tego w tej rundzie** — opisz w raporcie w 3-5 zdaniach, na tyle
konkretnie, żeby orkiestrator mógł z tego założyć osobny temat bez powtarzania reconu.

## PRZYZNANIE BŁĘDU AUTORA DISPATCHU (do wiadomości, nie do naprawy)

Recon rundy 1 był w dwóch punktach nieprawdziwy i Operator słusznie go zakwestionował
zamiast wykonać bezmyślnie:
- **(F) było fałszywe:** `'Szczegóły →'` nie występowało „we wszystkich adapterach" —
  tylko 3× w `technologyAdapter.ts` + 1× w `techDiscoveryNotice.ts`;
  **`buildingAdapter.ts` nie ustawia `linkTo` NIGDZIE** (karta budynku nie ma linków
  krzyżowych, więc nie było tam czego zamieniać).
- **Polecenie „przenieś rolę przycisku z `value` na `label`" było niebezpieczne:**
  wiersze z `linkTo` mają DWA kształty. W „Technologia: Brązownictwo" / „Zastępuje:
  Wojownik" nazwą encji jest `value` i **już był przyciskiem** — ślepe przeniesienie
  zrobiłoby przycisk ze słowa „Technologia". Rozwiązanie Operatora (`linkAnchor?:
  'label'|'value'`, domyślnie `'value'` = dzisiejsze zachowanie) jest poprawne
  i zaakceptowane.

To jest wina autora dispatchu, nie wykonawcy. Zapisane, żeby przy kolejnych tematach
tej rodziny nie powtórzyć założenia „skoro w jednym adapterze, to we wszystkich".
