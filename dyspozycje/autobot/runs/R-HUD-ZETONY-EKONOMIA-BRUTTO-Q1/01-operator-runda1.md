STATUS: PASS
DOMAIN: GAME
TEMAT: R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1
GOAL: Trzy żetony HUD (Praca, Skarbiec, Nauka) na mapie świata + nagłówki
analogicznych sekcji w panelu szczegółów imperium (`empireDetailPanel.ts`) mają
pokazywać ŁĄCZNY PRZYROST (brutto), nie wartość netto. Redukcja do finalnego
netto widoczna WYŁĄCZNIE w rozpisce/tooltipie/szczegółach. Praca wymagała
dociągnięcia brakującego pola "Cuda na mapie".

ZMIANY/COMMIT:
- `gra/src/main.ts`:
  - nowe pole `_lastPracaCudaKoszt` (deklaracja + reset w 3 miejscach, gdzie
    dotąd resetowano `_lastPracaAutoUlepszeniaKoszt`), akumulowane RAZEM z
    istniejącym `_lastPracaRate -= usedPlayer` (blok "CUDA-MAPA",
    `advanceOwnerWonderMapBuilds`) — czwarty, dotąd niewystawiony osobno
    drenaż Pracy.
  - `buildHudState()`: nowe pole wyjściowe `pracaCudaKoszt`.
  - ŻADNA zmiana w kodzie REGRES2/3 (`_pracaRateFreshFromEndTurn` i okolice) —
    nietknięte, zgodnie z zakazem w dispatchu.
  - Sprawdzone analogicznie Skarbiec i Nauka (main.ts, `sumEconomyForPlayerCities`,
    `previewOwnerUpkeep`, `advanceOwnerWonderMapBuilds` — wołane WYŁĄCZNIE z
    pulą Pracy gracza): Skarbiec ma już KOMPLETNE pole brutto
    (`bogactwoWplywyBrutto` = `_lastPieniadzRate`, gross dochód przed
    utrzymaniem budynków/jednostek) — nic nie brakowało. Nauka NIE MA dziś
    żadnego drenażu civ-wide (`_lastNaukaRate = playerEcon.nauka` bez żadnego
    kolejnego odjęcia w całym main.ts) — brutto i netto są tam dziś tą samą
    liczbą, więc nic nie trzeba było dociągać.
- `gra/src/ui/hud.ts`:
  - `HudState`: nowe opcjonalne pole `pracaCudaKoszt?: number`.
  - `renderBarD1B()`: żeton Skarbiec pokazuje `bogactwoWplywyBrutto` (fallback
    `bogactwoRate`), żeton Praca pokazuje `pracaRate + pracaUpkeep +
    pracaAutoUlepszeniaKoszt + pracaCudaKoszt` (brutto, liczone inline —
    CELOWO bez wołania współdzielonej funkcji, patrz niżej). `rateWarn` Pracy
    zostaje kluczowany NETTEM (realny sygnał kurczenia się puli). Żeton Nauka
    bez zmiany wartości (już brutto=netto).
  - `pracaChipTitle()`: dodana czwarta pozycja rozpiski "Cuda na mapie".
  - `naukaChipTitle()`: doprecyzowany opis (brutto=netto, brak dziś drenaży
    Nauki) — bez zmiany wyświetlanej liczby.
  - Dodano `export` przed `renderBarD1B` (WYŁĄCZNIE żeby bramka
    `hud-zetony-ekonomia-brutto-live-test.cjs` mogła zaimportować i
    wyrenderować ten sam kod w prawdziwym Chromium — zero zmiany zachowania,
    funkcja nadal wołana tylko wewnętrznie w module) oraz osobna,
    samowystarczalna funkcja `pracaWplywBrutto()` (używana WYŁĄCZNIE w
    `renderBarD1B`, NIE w `pracaChipTitle` — `pracaChipTitle` musiała
    zostać samowystarczalna, bo `tools/praca-auto-ulepszenia-koszt-split-test.cjs`
    wycina jej ciało przez brace-matching i uruchamia w izolacji; wywołanie
    zewnętrznej funkcji z tego ciała rzucało wyjątkiem w tej bramce — patrz
    RUNDY/TESTY niżej, znalezione i naprawione w tej samej rundzie).
- `gra/src/ui/empireDetailPanel.ts`:
  - `renderSkarbiecSection()`: hero pokazuje "Wpływy brutto ${wplywy}" (istniejąca
    zmienna, dotąd liczona ale nieużyta w hero) zamiast "Netto ${netto}". Kolor
    (`nettoCls`) zostaje kluczowany NETTEM (ostrzeżenie o kurczącym się skarbcu).
    Tabela bilansu niżej ("Netto skarbiec") NIETKNIĘTA — nadal pokazuje netto.
  - `renderPracaSection()`: box "PULA IMPERIUM" pokazuje `wplywBrutto` (rate +
    upkeep + autoUlepszeniaKoszt + cudaKoszt) zamiast `rate` (netto). Dodany
    nowy box "CUDA NA MAPIE" (wzorem istniejącego "AUTO-ULEPSZENIA (AI)") i
    odpowiadająca stopka, renderowane tylko gdy `cudaKoszt > 0`.
  - `renderNaukaSection()`: BEZ zmiany (hero już pokazuje `naukaRate`, które
    jest już brutto=netto).

TESTY:
- `node ./node_modules/typescript/bin/tsc --noEmit` — czysto, 0 błędów (jedyna
  dozwolona kompilacja, C-001).
- Bramki istniejące (regresja), uruchomione PRZED i PO zmianie (baseline
  potwierdzony przez `git stash`/`git stash pop`, nie z pamięci):
  - `empire-skarbiec-panel-coverage-test.cjs` — OK (12/12).
  - `empire-praca-panel-coverage-test.cjs` — OK (15/15).
  - `empire-nauka-panel-coverage-test.cjs` — OK (15/15).
  - `empire-skarbiec-bilans-test.cjs` — 11 passed, 0 failed.
  - `praca-auto-ulepszenia-koszt-split-test.cjs` — PIERWSZE URUCHOMIENIE po
    dodaniu `pracaWplywBrutto()`: 18 pass / 1 fail (regres własny, wykryty w tej
    samej rundzie: `pracaChipTitle` wołał nową funkcję pomocniczą, a ta bramka
    wycina ciało `pracaChipTitle` do izolowanego `new Function` przez
    brace-matching — wywołanie nieistniejącej w tym zasięgu funkcji rzucało
    `ReferenceError`). NAPRAWIONE w tej rundzie: `pracaChipTitle` wraca do
    liczenia `wplywBrutto` inline (samowystarczalnie), `pracaWplywBrutto()`
    zostaje jako osobna funkcja używana WYŁĄCZNIE przez `renderBarD1B`. PO
    naprawie: 20 pass / 0 fail (identyczne z baseline sprzed zmiany).
  - `hud-skarbiec-test.cjs` — 33 passed / 1 failed, POTWIERDZONE identyczne z
    baseline (`git stash` + ten sam test przed zmianą = też 33/1) — awaria
    pre-istniejąca, niezwiązana z tym tematem, NIE naprawiana tu (poza
    zakresem/allowlistą).
  - `hud-tooltip-body-mounted-panels-test.cjs` — jedno uruchomienie w dużej
    równoległej partii 38 bramek dotykających hud.ts/empireDetailPanel.ts
    zwróciło błąd Playwright ("Target page ... has been closed"); powtórzone
    W IZOLACJI (bez współbieżności z resztą partii, dwukrotnie: raz na
    zaczepionym `git stash` — baseline — i raz na finalnym kodzie) — OBA razy
    16 pass / 0 fail. Ustalone: to kontencja zasobów (współbieżne Chromium z
    równoległej partii testów), nie regres tego diffu.
  - Pozostałe 34 z 38 bramek dotykających `hud.ts`/`empireDetailPanel.ts`
    (pełna lista: grep `hud\.ts|empireDetailPanel\.ts` po `gra/tools/*.cjs`) —
    wszystkie PASS, 0 FAIL (empire-miasta-table-test 96/96,
    empire-armia-produkcja-test 51/51, empire-panel-econ-slider-visibility-test
    65/65, empire-panel-miasto-obywatele-content-test 116/116,
    hud-armia-chip-jednostki-test 58/58, hud-moc-warstwa-test 28/28,
    hud-obywatele-chip-test 20/20, i pozostałe — pełne logi w
    `/tmp/out_*.log` tej sesji, niezachowane po zamknięciu, ale każdy log
    przejrzany osobiście w tej rundzie).
- NOWA bramka (allowlista `gra/tools/*.cjs`):
  `gra/tools/hud-zetony-ekonomia-brutto-live-test.cjs` — esbuilduje PRAWDZIWY,
  niezmodyfikowany `renderBarD1B()` (jedyna zmiana umożliwiająca import:
  dodane `export`) z realnym `HudState` odtwarzającym DOKŁADNIE scenariusz z
  dispatchu (Praca netto+22/utrzymanie−3/auto-ulepszenia−76/cuda-na-mapie−12 →
  brutto 113; Skarbiec wpływy brutto 40/netto 9; Nauka +15 brutto=netto),
  renderuje w PRAWDZIWYM headless Chromium (fallback
  `/opt/pw-browsers/chromium-1194`) i asercjami sprawdza, że WSZYSTKIE TRZY
  liczby brutto (113, 40, 15) są jednocześnie obecne w jednym renderze, nie
  netto (22, 9). WYNIK: 5 pass, 0 fail. Zrzut ekranu zapisany na dysk (dowód
  wizualny, patrz niżej) i wysłany do właściciela w tej samej turze.
  Uruchomienie: `node tools/hud-zetony-ekonomia-brutto-live-test.cjs` (z `gra/`).

DOWÓD WIZUALNY (REGUŁA PRZECIW SAMOOSZUKIWANIU): zrzut ekranu prawdziwego
Chromium, prawdziwy kod `renderBarD1B()`, pokazujący WSZYSTKIE TRZY żetony
JEDNOCZEŚNIE z liczbami brutto —
`dyspozycje/autobot/runs/R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1/zrzut-runda1-trzy-zetony-brutto.png`
— tekst widoczny na zrzucie: "Skarbiec500+40Praca88+113...Nauka310+15" (stan
puli "500"/"88"/"310" — liczby zapasu — bez zmian, tylko "+N" jest teraz
brutto: Skarbiec +40 zamiast netto +9, Praca +113 zamiast netto +22, Nauka +15
bez zmiany bo brak tam drenaży).

BLOKADY: brak. Kod REGRES2/3 (timing-bug) w main.ts NIETKNIĘTY, zgodnie z
zakazem dispatchu — jeśli Evaluator/Final Control zechce zweryfikować pełną
grą (nie syntetycznym stanem), musi liczyć się z tym samym znanym problemem
timing (patrz dispatch, UWAGA) niezwiązanym z tym tematem.

RUNDY: 1/5
NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator
dispatchuje Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
