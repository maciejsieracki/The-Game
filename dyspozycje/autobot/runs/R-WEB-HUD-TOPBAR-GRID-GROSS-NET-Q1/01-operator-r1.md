STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — HUD górny baner: stały układ 3+3, brutto i netto
TEMAT: R-WEB-HUD-TOPBAR-GRID-GROSS-NET-Q1
GOAL: lewy baner HUD = stała siatka 3+3 (góra Skarbiec·Praca·Spichlerz; dół Handel·Nauka·Surowce), niezależna od wielkości liczb; każda komórka pokazuje BRUTTO i NETTO na turę.

ZMIANY/COMMIT: baza origin/main 01fdd771f; SHA commitu: patrz końcowa odpowiedź orkiestratora / `git log -1` brancha worktree (SHA nie może być wpisany w plik, który ten commit zawiera). PUSH nie wykonano.
- `gra/src/ui/hudChip6c.ts`: nowy wariant komórki (opcje `net`, `netTone`, `netLabel`): medalion + 3 linie (etykieta+zapas / „brutto" / „netto"). Chip klasyczny (prawy baner) bez zmian.
- `gra/src/ui/hud.ts`: lewy baner = `.hud-chip-grid` (CSS grid, 3 kolumny o stałej szerokości `--hud-cell-w`: 140 / 108 px ≤1200 / 74 px ≤900), brak `flex-wrap`, brak separatorów; kolejność wymuszona w DOM; netto: ujemne `#ee6c6c` (jak DEFICIT-RED), dodatnie `--tg-green`, zero stonowane; tooltipy z rozbiciem „BRUTTO → NETTO" (Skarbiec, Praca, Spichlerz, Handel, Nauka, Surowce z listą per surowiec i „najgorszym bilansem"). Nowe pola `HudState`: `surowceBrutto/Netto/Bilans`.
- `gra/src/main.ts` (tylko podanie danych): `surowceBilans` liczone z TYCH SAMYCH wierszy co panel Surowców (`buildEmpireResourceRows`: produkcja+umowy, minus `usage` obywatele/budynki/wojsko). Zero zmian logiki ekonomii.
- NOWY test `gra/tools/hud-topbar-grid-gross-net-test.cjs`; zaktualizowana 1 przestarzała asercja w `gra/tools/hud-number-abbrev-test.cjs` (wiring przez `cn()` → wspólne formattery; intencja ta sama).

DANE (źródła brutto/netto; bez drugiej kalkulacji): Skarbiec brutto=`bogactwoWplywyBrutto`, netto=`bogactwoRate`; Praca brutto=`pracaWplywBrutto()`, netto=`pracaRate`; Spichlerz brutto=`zywnoscWplywMiast`, netto=`zywnoscRate`; Nauka brutto=netto=`naukaRate` (brak drenaży); Handel brutto=netto=`handelIncome` (trasy bez kosztów; dochód już w brutto Skarbca); Surowce brutto=Σ produkcji+przychód z umów, netto=Σ netto — a przy dowolnym deficycie komórka pokazuje NAJGORSZY surowiec (etykieta „najgorszy", czerwona), nie sumę. Format wybrany: 3 linie (trzecia linia zamiast „+X brutto / −Y netto" w jednej, bo mieści się w stałej szerokości).

TESTY (gate-*.txt, każdy z jedną linią EXIT=):
- tsc `--noEmit`: EXIT=0 (`gate-tsc.txt`).
- Nowy test, część A (prawdziwy `renderBarD1B` + CSS w Chromium, 1280/1024/800 px × liczby 999 / 24,4k / 1,2M / bez deficytu): kolejność DOM i położenie (góra 3 w jednym rzędzie, dół 3), pozycje x/y/w/h komórek IDENTYCZNE dla małych/dużych/ogromnych liczb (brak przeskakiwania), brak nakładania, brak przycięcia tekstu, baner kończy się przed medalionem Mocy i nad paskiem narzędzi (dół ≤104 px), brak poziomego scrolla, brutto/netto z etykietami słownymi, kolory netto, kontrast ≥ 4,5:1 (tekst pomocniczy rozjaśniony do #968c7c, bo token muted dawał 4,48:1), tooltipy.
- Część M (mutacje, 5): zamiana rzędów, netto=brutto, brak czerwieni, 4 kolumny, brak „najgorszego" — wszystkie WYKRYTE.
- Część B (żywa gra, build vite POZA repo, `?playtest=mapa&civTest=1`, realne `endTurn`, hak `disableVictoryCheckForTest` bo sandbox kończy grę po 2 turach): Skarbiec netto == zmiana magazynu (−90, −90, −94) i Nauka (+8, +8, +8) w 3 kolejnych turach: ZGODNE. Wynik całości: 740 ok, 0 fail (`gate-hud-topbar-grid-gross-net.txt`). Zrzuty PRZED/PO (13 PNG, każdy ≤ 50 KB) w katalogu runu.
- Regresje PRZED vs PO (47 testów glob hud|top|chip|resource|abbrev|economy; `gate-regresje-*.txt`): jedyna nowa czerwień `hud-number-abbrev-test` (przestarzała asercja `...cn(`) — zaktualizowana, teraz zielona. Czerwone identycznie PRZED i PO (liczba FAIL równa, niezwiązane z tematem): ai-major-economy, citizen-resource-upkeep, hud-moc-warstwa, hud-obywatele-chip, hud-skarbiec (pos11 tradeIncomeByCity), pr141-matrix-only-economy, resource-usage-breakdown, trade-routes-hud-filter, transient-webgl-resource-smoke, unit-resource-upkeep. Timeout 150 s w obu stanach: horse-resource-terrain, saveload-hud-cache-hotseat-live, sidepanel-hud-deadzone (te ostatnie nie przeszły z powodu limitu czasu, NIE_ZMIERZONO). hud-tooltip-body-mounted-panels: PRZED timeout, PO zielony (flaga czasowa, nie efekt zmiany). hud-zetony-ekonomia-brutto-live-test zielony (jego regex `\+22\b` przechodzi tylko dlatego, że po „+22" w tekście stoi litera; intencja testu — brutto jako główna liczba — nadal spełniona).

BLOKADY / UWAGI (do decyzji orkiestratora):
1. ROZBIEŻNOŚĆ PRACA: netto Pracy z HUD (`pracaRate` = `ownerLastPracaRate`, saldo OSTATNIEGO ticka, nie prognoza) nie równa się zmianie puli po `endTurn` w 2 z 3 tur (+10 vs +28, +28 vs +35 — jednorazowe koszty auto-ulepszeń). Logika ekonomii poza allowlistą — nie zmieniano; w teście jako INFO. Wymaga osobnego tematu (prognoza Pracy), jeśli właściciel chce twardego „netto = realna zmiana".
2. Spichlerz: przy zapasie 0 i ujemnym netto zapas jest obcinany do 0 — porównanie delta NIE_ZMIERZONO (test pomija ten przypadek jawnie).
3. HUD na starcie sandboksa (przed 1. przeliczeniem) pokazuje placeholdery presetu (np. netto Skarbca +4, realnie −90) — przedtem tak samo (main.ts: `_lastBogactwoRate = 4`); poza zakresem.
4. Okno 800 px: baner (270 px) mieści się przed medalionem Mocy (280 px) dzięki zmniejszeniu czcionek/kolumn; wcześniej na 800 px zachodził o ~280 px. Brak medalionów ikon ≤900 px (tylko tekst). Skrajne liczby (>99,9k) przy 800 px mogą skracać etykietę wielokropkiem; NIE_ZMIERZONO dla okien <800 px.
5. Nie wykonano jeszcze: brutto/netto w panelu imperium dla Spichlerza i Nauki (Skarbiec i Praca mają już oba w panelu: hero brutto + tabela netto) oraz w karcie miasta — LISTA KOLEJNYCH: panel imperium (Spichlerz, Surowce, Handel, Nauka), karta miasta (chipy zasobów), tooltipy Kultura/Religia/Obywatele (prawy baner pokazuje nadal jedną liczbę „+N").
6. Po wdrożeniu: REPIN Rust (HUD baner) — notuje orkiestrator.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (kryteria: kolejność 3+3 w realnym oknie gry, brutto/netto, rozbieżność Pracy jako osobna decyzja, brak zmian w logice ekonomii), następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
