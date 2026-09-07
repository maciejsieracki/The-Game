# P-BRAMKI-ZASTANE-CZERWONE-Q1 — dispatch

TEMAT: `P-BRAMKI-ZASTANE-CZERWONE-Q1`
RUNDA: 1/5
DOMAIN: PROCESS (wyłącznie pliki testowe, zero zmiany zachowania silnika/balansu)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Dwie zastane, nienaprawione czerwone bramki, zarejestrowane wcześniej (Final Control
tematu `P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1`, `dyspozycje/REJESTR-PROSB-I-ZADAN.md`)
jako niezwiązane z żadnym tematem tamtej sesji. Orkiestrator wykonał recon PRZED tym
dispatchem (grep + czytanie kodu, nie zgadywanie) i ustalił dla OBU dokładną przyczynę —
zapisane niżej, do zweryfikowania samodzielnie, nie do przyjęcia na wiarę.

### A) `gra/tools/building-queue-refund-test.cjs` (2 pass / 3 fail)

**Przyczyna (zweryfikowana czytaniem kodu):** test ma zahardkodowane literały z ERY SPRZED
zmiany danych. `gra/data/buildings.json` → `stolarnia.koszt_surowce.drewno` = **25** (dziś),
a `gra/src/game/building-stock-cost.ts:28` (`buildingStockCost`) przepuszcza tę wartość przez
`scaleStockCostRecord` (`gra/src/game/r-stawki-strojenie.ts:36-47`), która mnoży przez
`R_STAWKI_FALA2_MULT = 2` (`r-stawki-strojenie.ts:9`) i zaokrągla — `round(25×2) = 50`.
Test (`building-queue-refund-test.cjs:71`) oczekuje **10**, co odpowiadałoby starej wartości
`koszt_surowce.drewno = 5` (5×2=10) — dane zostały zmienione w jakimś wcześniejszym temacie
balansowym BEZ aktualizacji tego testu. To jest kategoria „test podążający za już wdrożoną i
zatwierdzoną zmianą silnika/danych" (`PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md` §3b) — może iść
przez AutoBot Operator→Evaluator BEZ ABC-first, bo nie zmienia balansu, tylko naprawia test
żeby śledził już obowiązujące dane.

**Dodatkowy, realny problem odsłonięty przez samą literę scenariusza testu (do naprawienia
w samym teście, NIE w kodzie produkcyjnym):** test buduje sztuczny stan NIEOSIĄGALNY w
prawdziwej rozgrywce — pula państwa (`c1:3 + c2:12 = 15`) jest MNIEJSZA niż koszt (50), mimo
że w prawdziwym przepływie (`ui/cityPanel.ts` gracz, `main.ts` AI) `deductBuildingStockCostAcrossCities`
jest wołane DOPIERO po pozytywnym `canAffordBuildingStock` na tej samej sumie — czyli w grze
deduct nigdy nie jest wołane z kosztem przekraczającym pulę. Test z niedoborem funduszy
odsłania, że `deductBuildingStockCostAcrossCities` CLAMPuje pobór do faktycznie dostępnej
ilości (nie schodzi poniżej zera — poprawnie), ale `refundBuildingStockCostAcrossCities`
zawsze zwraca PEŁNY nominalny koszt, niezależnie od tego ile faktycznie pobrano — przy
niedoborze funduszy dałoby to zwrot WIĘKSZY niż realnie pobrana kwota. To ROZBIEŻNOŚĆ, ale
w scenariuszu, który **nie występuje w prawdziwej grze** (afordancja zawsze sprawdzona
przed poborem) — napraw test tak, żeby zachował sensowny, OSIĄGALNY w grze scenariusz
(pula ≥ koszt PRZED enqueue, tak jak zakłada afordancja), zamiast próbować naprawiać kod
produkcyjny pod scenariusz, który nigdy nie zachodzi. Jeśli Operator uzna, że rozbieżność
clamp/refund JEST realnym ryzykiem produkcyjnym (np. przez ścieżkę nieobjętą dziś
`canAffordBuildingStock`) — STOP, zgłoś DECISION_REQUIRED zamiast rozszerzać zakres na
`building-stock-cost.ts` samodzielnie (poza allowlistą).

### B) `gra/tools/barb-city-capture-cluster-test.cjs` (92 pass / 1 fail)

**Przyczyna (zweryfikowana czytaniem main.ts i liczeniem offsetów):** blok testu „2h-static"
(komentarz w samym pliku testu jawnie mówi: „SNAPSHOT-LOCK na TEKŚCIE ŹRÓDŁOWYM main.ts, NIE
dowód mutacyjny/behawioralny") wycina okno **4000 znaków** od `idxApplyCapture` (początek
`function applyCityCaptureToMap(`, main.ts) i szuka w nim regexem bloku
`if (isBarbarian(atkOwner)) { ... cityProd.set(city.id, { kolejka: [], postep: 0 }); }`.

Sam kod produkcyjny jest DZIŚ NIETKNIĘTY i poprawny — potwierdzone bezpośrednim czytaniem
main.ts: linia `if (isBarbarian(atkOwner)) {` i bezpośrednio pod nią
`cityProd.set(city.id, { kolejka: [], postep: 0 });` istnieją dokładnie tak, jak wymaga
regex, zero zmiany zachowania. Problem jest WYŁĄCZNIE w oknie testu: między początkiem
funkcji a tym blokiem `if` jest dziś (po integracji kilku tematów tej sesji, m.in.
`P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1`, które dopisały nowe, uprawnione bloki kodu i
obszerne dwujęzyczne komentarze wcześniej w TEJ SAMEJ funkcji) dystans **6412 znaków**
(zmierzone: `mainTs.indexOf('if (isBarbarian(atkOwner)) {', idx) - idx = 6412`) — czyli
POZA oknem 4000 znaków ustalonym, gdy funkcja była krótsza. Test fałszywie czerwienieje na
w pełni poprawnym kodzie — to jest dokładnie klasa „test niedopasowany do rozmiaru kodu",
NIE regresja.

## GOAL

### Punkt A — `building-queue-refund-test.cjs`
1. Zaktualizuj literały testu do faktycznej wartości `stolarnia.koszt_surowce.drewno=25`
   po przeliczeniu przez `buildingStockCost()` (realna funkcja, NIE duplikat wzoru w teście
   — analogicznie do wzorca `eliminacja-lup-kwoty-test.cjs`/innych bramek tej sesji).
2. Zmień dane wejściowe scenariusza (`makeCities`) tak, żeby pula PRZED enqueue była
   **większa lub równa** kosztowi (osiągalny w grze stan) — np. podnieś zapasy miast
   proporcjonalnie, zachowując strukturę testu (co najmniej 2 miasta, rozproszony pobór).
3. Zero osłabienia liczby asercji (3 asercje dzisiejsze zostają co najmniej 3, mogą przybyć).
4. Jeśli uznasz clamp/refund za realne ryzyko produkcyjne — DECISION_REQUIRED zamiast
   samodzielnej zmiany `building-stock-cost.ts`.

### Punkt B — `barb-city-capture-cluster-test.cjs`
1. Rozszerz okno wycinane wokół `idxApplyCapture` tak, żeby z zapasem obejmowało blok
   `if (isBarbarian(atkOwner))` niezależnie od dalszego, przyszłego wzrostu komentarzy w
   tej funkcji — albo zwiększ stałą liczbę znaków z zapasem (np. do najbliższego
   `\n    }\n` kończącego funkcję, jeśli to policzalne bez pełnego parsera JS), albo
   przytnij okno do końca funkcji przez wyszukanie odpowiadającej klamry zamykającej
   zamiast stałej liczby znaków — wybierz podejście i uzasadnij w raporcie dlaczego jest
   odporne na PRZYSZŁY wzrost kodu w tej funkcji, nie tylko naprawia dzisiejszy offset.
2. Zero zmiany semantyki testu — nadal snapshot-lock + anty-komentarz + regresja-guard,
   te same trzy sprawdzenia, tylko poprawny zasięg okna.
3. Zero zmiany w `main.ts` (kod produkcyjny potwierdzony poprawny, nietknięty).

## BINARNE KRYTERIUM SUKCESU

- `node tools/building-queue-refund-test.cjs` → wszystkie asercje PASS (dziś 2/5, docelowo
  pełne 5/5 lub więcej, zero regresji liczby).
- `node tools/barb-city-capture-cluster-test.cjs` → 93/93 (dziś 92/93).
- Dowód mutacyjny dla punktu B: cofnięcie realnego resetu (`if (isBarbarian(atkOwner))`
  usunięty/zakomentowany na chwilę w main.ts, POZA allowlistą — wykonaj TYLKO jako tymczasowy
  test w pamięci roboczej, przywróć natychmiast, `git diff` musi być czyste po teście)
  poprawnie czerwieni blok 2h-static z NOWYM oknem — dowód, że naprawa nie jest tylko
  „rozszerz okno aż przejdzie", tylko realnie wykrywa usunięcie mechanizmu.
- `tsc --noEmit` 0 błędów, 5 bramek referencyjnych zielone (logic-test, tech-tree-test,
  research-test, unit-replace-test, combat-test).
- Zero zmian poza allowlistą — w szczególności ZERO zmian w `gra/data/buildings.json`,
  `gra/src/game/building-stock-cost.ts`, `gra/src/game/r-stawki-strojenie.ts`, `gra/src/main.ts`.

## ALLOWLISTA

- `gra/tools/building-queue-refund-test.cjs` (WYŁĄCZNIE literały oczekiwane + dane scenariusza)
- `gra/tools/barb-city-capture-cluster-test.cjs` (WYŁĄCZNIE logika wyznaczania okna 2h-static)
- `dyspozycje/autobot/runs/P-BRAMKI-ZASTANE-CZERWONE-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`, `gra/src/main.ts`,
`gra/src/game/building-stock-cost.ts`, `gra/src/game/r-stawki-strojenie.ts`,
`gra/data/buildings.json`, wszystkie inne pliki `gra/src/**`/`gra/data/**`.
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-bramki-zastane`, gałąź `autobot/P-BRAMKI-ZASTANE-CZERWONE-Q1`,
baza jawnie `origin/main` (commit `f0174f2a`, po deployu FALA 354) — potwierdź `git log -1`
PRZED pracą (SS2b: jeden pisarz na worktree).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

Nie dotyka `main.ts` (poza jednorazowym, natychmiast cofniętym testem mutacyjnym w pamięci
roboczej dla dowodu punktu B) — może być dispatchowany niezależnie od innych aktywnych
tematów.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian mechaniki/balansu — WYŁĄCZNIE naprawa dwóch testów, żeby śledziły już
  obowiązujące dane/kod.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Jeśli podczas pracy okaże się, że którakolwiek czerwona bramka wskazuje REALNY bug w
  kodzie produkcyjnym (nie tylko stary literał/za małe okno) — STOP, DECISION_REQUIRED.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
