# R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 — Evaluator runda 2b

**Metoda:** worktree `/home/user/wt-hotseat-etap5-switch-human`, gałąź
`autobot/R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1`, HEAD `a1d779f7` (potwierdzone `git log
--oneline`, `git status` — working tree clean, wszystkie 5 commitów rundy 2b faktycznie na
gałęzi: `66b7c539`, `8f69608a`, `d405a56d`, `4ab85405`, `a1d779f7`). Świeży `git diff` całej
rundy (`9030e1f9..HEAD`, allowlist), świeży `git diff 22229750 2268cee7` (naprawa Zarzutu #2
rundy 1, sprzed restartu) i `git diff 2268cee7 HEAD` (co faktycznie zmieniła runda 2b) —
czytane osobno, żeby ROZDZIELIĆ co jest z rundy 2 (guard `currentVisible`) od tego, co jest z
2b (hak `grantTestPraca`, `hintToastText`, poprawki testu). Własne, niezależne uruchomienia:
`tsc --noEmit`, **2x pełne, niezależne, świeże uruchomienie**
`node tools/hotseat-etap5-no-leak-test.cjs` (od zera, osobny `vite build` + osobny proces
Chromium każde), oraz samodzielne uruchomienie wszystkich 5 bramek referencyjnych
(`logic-test.cjs`, `tech-tree-test.cjs`, `research-test.cjs`, `unit-replace-test.cjs`,
`combat-test.cjs`).

---

## Weryfikacja proceduralna

- `git log --oneline -15`: wszystkie 5 commitów rundy 2b obecne na gałęzi, w kolejności
  zgodnej z raportem Operatora (`66b7c539` → `8f69608a` → `d405a56d` → `4ab85405` →
  `a1d779f7`), poprzedzone checkpointem `2268cee7` (runda 2, przerwana restartem) i rundą 1
  (`22229750`, `2530806e` Evaluator FAIL).
- `git status`: working tree czysty, zero niezacommitowanych zmian, zero plików spoza
  śledzenia poza gitignorowanymi `_tmp-*`/`.tmp-*`/`.quick-*` (pre-istniejące, niezwiązane z
  tym tematem — potwierdzone `.gitignore`). Plik `gra/tools/_debug_units.cjs` (Zarzut #3
  rundy 1) **nieobecny** — sprzątnięty.
- `git diff --stat 9030e1f9 HEAD`: wyłącznie `gra/src/main.ts`, `gra/src/ui/hotSeatHandoff.ts`,
  `gra/tools/hotseat-etap5-no-leak-test.cjs` i 3 raporty w `runs/<ID>/` — dokładnie
  allowlista dispatchu, zero wykroczeń.

## Weryfikacja merytoryczna — co jest z rundy 2, co z 2b

`git diff 22229750 2268cee7 -- gra/src/main.ts` potwierdza: strażnik
`ME() === HUMAN_OWNER_PRIMARY` w fallbacku `currentVisible()` (Zarzut #2 Evaluatora rundy 1)
został wprowadzony w rundzie 2, **PRZED** restartem kontenera — jest już na checkpoincie
`2268cee7`. `git diff 2268cee7 HEAD -- gra/src/main.ts` potwierdza, że runda 2b dotknęła
WYŁĄCZNIE `__hotSeatTestDebug` (nowy hak `grantTestPraca`, nowe pole `hintToastText` w
`snapshotVisibleState()`) — **zero zmian w `switchActiveHuman()`, `ui/hotSeatHandoff.ts` ani w
samym fallbacku `currentVisible()`** w tej rundzie. Zgodne 1:1 z twierdzeniem raportu
Operatora ("Strażnik... nadal na miejscu, nie dotknięty").

**Analiza guarda `ME() === HUMAN_OWNER_PRIMARY && playerStartHex !== null`** (świeże
czytanie `main.ts:9752-9775`): to jest czysta koniunkcja DODANA do istniejącego warunku —
zbiór przypadków, w których fallback się wykonuje, może się tylko ZAWĘZIĆ względem
zachowania sprzed zmiany, nigdy rozszerzyć. `ME()` (main.ts:10376) zwraca
`humanSeats.activeHumanOwnerId`; w dzisiejszej grze jednoosobowej (bez jakiegokolwiek
wywołania `switchActiveHuman()`/haka testowego) `activeHumanOwnerId` nigdy nie zmienia
wartości początkowej `HUMAN_OWNER_PRIMARY` (`= 0`, `game/human-owners.ts:21`) — więc
`ME() === HUMAN_OWNER_PRIMARY` jest w tym kontekście TAUTOLOGICZNIE prawdziwe, a cały warunek
redukuje się dokładnie do `playerStartHex !== null` sprzed zmiany. To jest dowód logiczny, nie
tylko empiryczny, że fotel A/gra jednoosobowa ma identyczne zachowanie — potwierdzony
dodatkowo przez 5/5 bramek referencyjnych (patrz niżej) i 2/2 PASS Scenariusza A samej
bramki "no leak" (który ćwiczy dokładnie fotel A z realnym miastem, więc `visible.size > 0`
i fallback w ogóle się nie wykonuje po stronie fotela A — trafia w niego wyłącznie próba
wejścia fotela B bez miasta, gdzie teraz poprawnie zwraca pusty zbiór zamiast cudzej okolicy).

## Niezależne uruchomienia

- `node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`): **PASS, zero błędów.**
- `node tools/hotseat-etap5-no-leak-test.cjs` — **2/2 NIEZALEŻNE, PEŁNE uruchomienia od
  zera** (osobny `vite build` + osobny proces Chromium za każdym razem, PID-y `5048`/`5397`):
  - Przebieg 1: `=== SCENARIUSZ A === PASS: true`, `=== SCENARIUSZ B === PASS: true`,
    `hotseat-etap5-no-leak-test: PASS (A=PASS, B=PASS)`, exit 0.
  - Przebieg 2: identycznie — `PASS (A=PASS, B=PASS)`, exit 0.
- 5 bramek referencyjnych, uruchomione samodzielnie (z `gra/`), wynik zgodny z raportem
  Operatora co do liczby:
  - `logic-test.cjs`: **213/213** (`LOGIC OK`).
  - `tech-tree-test.cjs`: **19/19** (`tech-tree-test: 19 pass, 0 fail`).
  - `research-test.cjs`: **33/33** (`PASSED: 33 / FAILED: 0`, `ALL GREEN`).
  - `unit-replace-test.cjs`: **13/13** (`WSZYSTKIE TESTY ZIELONE`).
  - `combat-test.cjs`: **6/6** (`All sanity checks passed`).

## Weryfikacja strukturalna kodu (świeże czytanie, ta runda)

- `switchActiveHuman()` (main.ts:10426-10549): 7 kroków obecne, kolejność i treść identyczna
  z rundą 1/recon, zero regresji względem poprzedniej weryfikacji.
- `ui/hotSeatHandoff.ts`: bez zmian tej rundy, kontrakt §3.3 nadal spełniony (potwierdzone
  ponownym czytaniem — synchroniczność, z-index 9970/9980, Escape no-op).
- Naprawy testu rundy 2b (`git diff 2268cee7 HEAD -- gra/tools/...`) czytane w całości:
  - **Fix #2 (dwa miasta ownera 1):** `rivalCity = cities.find(c => c.ownerId === 1)` zamiast
    `!== 0` + `reassignCityId` — poprawnie eliminuje sztuczny artefakt (miasto obce
    doklejone do ownera 1 przez `reassignCityId` dawało FAŁSZYWY nadmiar
    `exploredKeysForActive`, myślony jako wyciek). Nowa asercja (zbiór nadmnogości +
    kontrola zerowego przecięcia z eksploracją fotela A zebraną PRZED switchem) jest
    **silniejsza** niż poprzednia ślepa równość zbiorów — łapie realny wyciek fotela A
    precyzyjniej, nie tylko po literalnej treści seeda.
  - **Fix #3 (diploAudience pierwszego kontaktu fotela B):** zweryfikowane, że to zdarzenie
    faktycznie może wystąpić przez `refreshFog()`→`checkNewDiplomaticContacts` (ta sama
    ścieżka co dla fotela A w kroku 2c) — traktowanie jako legalne, nie wyciek, jest spójne.
  - **Fix #4 (`onBack` audiencji → lista):** zweryfikowane grepem `main.ts:20176`
    (`// Powrót do listy tylko gdy gracz wszedł z listy (brak zaznaczonej jednostki).`) —
    komentarz cytowany w raporcie Operatora ISTNIEJE DOSŁOWNIE w kodzie na wskazanej linii,
    potwierdzając że diagnoza nie jest ad-hoc uzasadnieniem, tylko odczytem realnego
    zachowania silnika.
  - **Fix #5 (`hintToastText` zamiast `hintToastVisible`):** asercja sprawdza TREŚĆ
    (`!includes('Nie można założyć')`) zamiast samej widoczności — poprawnie odróżnia
    "nowy, legalny hint fotela B" od "stary hint fotela A przetrwał". `hintToastVisible`
    pozostawione bez zmian dla kompatybilności wstecznej (nieużywane już w asercji, ale
    nie usunięte — neutralne, brak ryzyka).
  - **`grantTestPraca`** — hak dodaje wyłącznie do `playerPracaPool` (main.ts), tej samej
    zmiennej, którą odejmuje realny `applyBuildRequest`; sam odczyt/koszt idzie realną
    ścieżką silnika. Diagnoza "gra faktycznie nie pozwala budować na turze 1 bez
    zgromadzonej Pracy" zgodna z przeczytanym kodem (`terrain-improvements.json`,
    `scaleImprovementWorkCost`) — nie kwestionuję.
- Zero call-site'u produkcyjnego: `switchActiveHuman`/`hotSeatHandoff` nadal wołane
  wyłącznie z `__hotSeatTestDebug` (bez eksportu, bez zmian tej rundy w tym zakresie).

## Uwaga niekrytyczna (nie zarzut)

`rivalCity` (miasto WŁASNE ownera 1 z generacji świata) leży w nieprzewidywalnym miejscu
mapy względem heksu startowego fotela A — asercja "zero przecięcia z eksploracją fotela A"
(fix #2) jest teoretycznie podatna na rzadki przypadek, gdyby oba miasta wylosowały się
blisko siebie (fałszywy FAIL, nie fałszywy PASS — nie maskowałby realnego wycieku, tylko
mógłby sprawić, że bramka niepotrzebnie migałaby czerwono przy pechowym seedzie). Nie
zaobserwowane w 2/2 przebiegach tej weryfikacji ani w 2/2 Operatora — nie podnoszę jako
zarzut, tylko odnotowuję do ewentualnego wzmocnienia bramki w przyszłości (np. przez
kontrolę odległości miast przy seedowaniu).

---

## STATUS: PASS
## DOMAIN: GAME
## TEMAT: R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1
## GOAL: `switchActiveHuman()` + `ui/hotSeatHandoff.ts` + dowód "no leak" (bramka
`hotseat-etap5-no-leak-test.cjs`, oba scenariusze A/B, wszystkie asercje zielone)
## ZMIANY/COMMIT: potwierdzone `git log`/`git diff` — `66b7c539`, `8f69608a`, `d405a56d`,
`4ab85405`, `a1d779f7` (worktree `/home/user/wt-hotseat-etap5-switch-human`, HEAD `a1d779f7`).
Diff cały temat (`9030e1f9..HEAD`): wyłącznie `gra/src/main.ts`, `gra/src/ui/hotSeatHandoff.ts`,
`gra/tools/hotseat-etap5-no-leak-test.cjs`, raporty `runs/<ID>/*.md` — allowlista
dispatchu spełniona co do pliku, zero wykroczeń.
## TESTY (wszystkie uruchomione NIEZALEŻNIE przeze mnie, nie tylko odczytane z raportu):
- `tsc --noEmit`: PASS, zero błędów.
- `hotseat-etap5-no-leak-test.cjs`: **2/2 niezależne, pełne uruchomienia od zera = PASS**
  (Scenariusz A PASS, Scenariusz B PASS, exit 0 w obu przebiegach).
- 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test`
  33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie zgodne z wynikiem
  referencyjnym podanym przez Operatora.
## BLOKADY: brak.
## RUNDY: 2b/5 (kontynuacja rundy 2 po restarcie kontenera, zgodnie z dyspozycją
orkiestratora — nie nowa runda w liczniku 5).
## NASTĘPNY KROK: Final Control (osobny subagent) → integracja orkiestratora
(allowlist-only) → `READY_FOR_DEPLOY` może wystawić wyłącznie orkiestrator po faktycznej
integracji. Do jawnego potwierdzenia ABC pozostaje wyłącznie kwestia proceduralna
zaznaczona już przez sam dispatch (nie kod): odstąpienie od invariantu `R-PIERWSZE-MIASTO`
w KROKU 1c `switchActiveHuman()` w kontekście handoff — decyzja orkiestratora, autonomiczna,
zaznaczona do potwierdzenia ABC rano; nie blokuje tej weryfikacji (implementacja zgodna z
tym, co dispatch nakazał wprost).
## DEPLOY/PUSH: NIE WYKONANO

## ZARZUTY: brak.
