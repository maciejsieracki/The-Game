# 09-operator-T1-wznowienie — R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, T1 KONTRAKT-KARTA-ENCJI

```text
STATUS: PASS
TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 / T1 KONTRAKT-KARTA-ENCJI (wznowienie po BLOCK, ECHO=C)
GOAL: Dokończyć CAŁY fundament T1 (types.ts, slug.ts, registry.ts, renderer.ts,
      adaptery-szkielety dla 4 kinds, test fixture) jako WYŁĄCZNIE nowe pliki w
      gra/src/ui/entityCards/** plus jeden nowy plik testu — zero edycji istniejących
      kart/drzewka/gatingu.
ZMIANY/COMMIT: Nowe pliki (zero edycji istniejących):
  - gra/src/ui/entityCards/types.ts — EntityKind, EntityCardData, EntityCardSection,
    EntityCardRow, EntityCardMedallion, EntityCardCtx, OpenEntityCardOptions,
    EntityCardAdapter/EntityCardResolver (generyki), zgodnie z planem §1.
  - gra/src/ui/entityCards/slug.ts — NOWY, niezależny slugify() z PEŁNĄ tabelą
    PL_DIACRITICS (wzorem research.ts:194-199). ECHO=C: NIE zastępuje ani nie jest
    zastępowany przez slugify() z sciencePicker.ts (NFD-strip) ani
    slugifyImprovementLabel() z research.ts — używany WYŁĄCZNIE przez entityCards/**.
  - gra/src/ui/entityCards/registry.ts — resolvery per-kind:
    * building: buildings.json[].id (bezpośrednio)
    * improvement: klucz obiektu terrain-improvements.json (bezpośrednio, pomija "_meta")
    * technology: REUŻYWA techToSlug()/techNameFromSlug() z sciencePicker.ts (WARIANT A,
      NIE nowy slug.ts) — dokładnie jak nakazuje 08-dispatch-T1-wznowienie.md
    * unit: NOWA Map<slug, UnitDef> budowana raz przy starcie, slug liczony przez
      skonsolidowany slugify() z ./slug.ts (WARIANT C, brak istniejącego poprzednika)
  - gra/src/ui/entityCards/renderer.ts — buildEntityCardData (deleguje do
    resolver+adapter, NADPISUJE zwrócone data.id id-em zapytania — gwarancja kontraktu,
    patrz komentarz w kodzie), renderEntityCard (jeden DOM-builder dla 4 kinds),
    openEntityCard (mode: 'dialog' w pełni; 'inline' minimalnie; 'hover' rzuca,
    T5 dopełnia), CSS.
  - gra/src/ui/entityCards/{unitAdapter,buildingAdapter,technologyAdapter,improvementAdapter}.ts
    — adaptery-szkielety (poprawny typ + sensowne dane podstawowe, bez pełnego parytetu
    ze starymi kartami — parytet to T3-T7b).
  - gra/tools/entity-card-contract-test.cjs — test fixture: esbuild+jsdom bundluje
    prawdziwy renderer.ts, weryfikuje slug.ts na dryfie z 07-operator-T1.md (Łucznik→lucznik,
    Koło→kolo, Rydwan (woły)→rydwan_woly), buildEntityCardData+renderEntityCard dla
    WSZYSTKICH 4 kinds na realnych id z gra/data/*.json (wojownik, stolarnia,
    techToSlug("Łowiectwo"), farma), openEntityCard(mode:'dialog') backdrop+dismiss,
    resolver null → no-op zamiast throw.
  - gra/tools/.stubs/entity-card-contract-{brandAssets,scienceOwlIcon}-stub.ts — stuby
    WŁASNE dla tego testu (wzorem P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY) — łańcuch importów
    registry.ts→sciencePicker.ts→scienceHubHud.ts→techDiscoveryNotice.ts ciągnie
    icons/brandAssets (import.meta.glob) i icons/scienceOwlIcon (.svg?raw), których
    esbuild/node nie rozumie bez stubowania; test kontraktu kart nie testuje ikon brandu.
  Zero edycji unitInfoCard.ts/cityPanel.ts/techDiscoveryNotice.ts/scienceHubHud.ts/
  techTreeView.ts/sciencePicker.ts/research.ts — potwierdzone `git diff --stat` na tych
  7 plikach = pusty diff, `git status --porcelain` pokazuje WYŁĄCZNIE nowe pliki wyżej.
  SHA: jeszcze niescommitowane w chwili pisania raportu — commit powstaje w tym samym
  kroku co ten plik (kod + raport razem, zgodnie z instrukcją dispatcha).
TESTY:
  - `cd gra && npx tsc --noEmit` — CZYSTE (0 błędów). Uwaga proceduralna: worktree nie
    miał `node_modules` na starcie sesji (świeży izolowany worktree) — wykonano
    `npm ci` (69 pakietów) PRZED pierwszym uruchomieniem tsc/testu; bez tego kroku tsc
    i esbuild nie mogły uruchomić się wcale (nie jest to zmiana kodu/danych gry).
  - `node gra/tools/entity-card-contract-test.cjs` — 47 pass, 0 fail. Pokrywa: slug.ts
    na realnym dryfie „ł" (3 asercje), unitToSlug delegację, buildEntityCardData dla
    4/4 kinds na realnych id (z asercją że zwrócone `id` == id zapytania — kontrakt),
    renderEntityCard DOM dla 4/4 kinds (data-entity-kind/id, h2, >=1 sekcja),
    openEntityCard(dialog) backdrop+dismiss+sprzątanie DOM, resolver-null → no-op
    zamiast throw.
  - Build weryfikacyjny: `node ./node_modules/vite/bin/vite.js build --outDir dist
    --emptyOutDir` (z gra/) — sukces, 837 modułów, `dist/index.html` wygenerowany,
    bez błędów. (NIE `npm run build`/`npm run dev`, zgodnie z zasadą krytyczną.)
BLOKADY: Brak. Dryf slugify() (sciencePicker.ts) vs slugifyImprovementLabel()
  (research.ts) opisany w 07-operator-T1.md pozostaje NIEROZWIĄZANY między tymi dwoma
  istniejącymi plikami — to świadome, zgodne z ECHO=C: T1 go NIE rozwiązuje (żaden z
  dwóch starych wariantów nie jest ruszony), tylko dodaje trzeci, poprawny, izolowany
  wariant dla nowego systemu kart. Ewentualna przyszła konsolidacja dwóch STARYCH
  wariantów (poza zakresem T1) zostaje jako temat dla właściciela, nie blokuje tego PASS.
NASTĘPNY KROK: Evaluator → Final Control dla T1. Po PASS: T2 (HUB-BADAN-INFO-IKONA,
  równolegle, brak zależności) i T3 (MIGRACJA-KARTA-TECHNOLOGII, zależny od T1) mogą
  ruszyć zgodnie z kolejnością w 05-architektura-plan.md §6.
DEPLOY/PUSH: NIE WYKONANO
```
