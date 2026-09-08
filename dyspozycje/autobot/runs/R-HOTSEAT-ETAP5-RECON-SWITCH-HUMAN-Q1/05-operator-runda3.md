# R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1 — Operator runda 3 (poprawka po zarzucie Evaluatora rundy 2)

**Zakres tej rundy:** wyłącznie zarzut #2 NOWY z `04-evaluator-runda2.md` (KROK 1c
częściowy — pomijał `clearBuildModeVisuals()`/`popOverlay('build-mode')` w gałęzi
`isAwaitingFirstPlayerCity()===true`). Zarzut #1 (toast) zamknięty w rundzie 2, nie
ruszany. Metoda: świeży `grep -n`/`sed`/`Read` w worktree
`/home/user/wt-hotseat-etap5-recon`, HEAD `dacb8ced` (czysty `git status --porcelain`
przed startem), KAŻDY cytat linii zweryfikowany od zera tej rundy, zero zaufania cytatom
Evaluatora/Operatora poprzednich rund.

## Weryfikacja świeżym grepem — wszystkie linie z zarzutu Evaluatora rundy 2

```
grep -n "let foundCityMode\|let buildModeOpen\|let activeImprovementKey\|let activeWonderId\|function exitBuildMode\|function isAwaitingFirstPlayerCity\|function clearBuildModeVisuals\|function removeBuildGhosts\|function clearMineEligibleOverlay\|function enterBuildModeEscapeOverlay\|civ-build-ghost-chip" gra/src/main.ts
```
Wynik (identyczny z cytatami Evaluatora rundy 2 — zero przesunięcia linii):
- `foundCityMode` @ **2513**
- `isAwaitingFirstPlayerCity()` @ **9655**
- `buildModeOpen`/`activeImprovementKey`/`activeWonderId` @ **11457/11458/11459**
- `clearMineEligibleOverlay()` @ **11646**
- `ghostChip.id = 'civ-build-ghost-chip'` @ **11769** (element utworzony @ 11768,
  `appendChild(document.documentElement)` @ 11778 — odczytane 11765-11780 w całości)
- `removeBuildGhosts()` @ **11821**, ciało odczytane 11821-11836 w całości: usuwa
  `ghostGroup`/`ghostCityGroup` ze `scene` (THREE.js), ustawia `ghostChip.style.display =
  'none'` @ 11835.
- `clearBuildModeVisuals()` @ **12350**, ciało 12350-12354: `removeBuildGhosts();
  unitRenderer.clearHighlight(); clearMineEligibleOverlay();`
- `exitBuildMode()` @ **12456**, ciało odczytane w całości 12456-12472:
  ```ts
  function exitBuildMode(): void {
    if (isAwaitingFirstPlayerCity()) return;         // 12462
    buildModeOpen = false;                            // 12463
    foundCityMode = false;                             // 12464
    activeImprovementKey = null;                       // 12465
    activeWonderId = null;                              // 12466
    clearBuildModeVisuals();                             // 12467
    refreshBuildApi();                                    // 12468
    refreshBuildHighlight();                               // 12469
    refreshD1bHud();                                        // 12470
    popOverlay('build-mode');                                // 12471
  }
  ```
  Guard @ 12462 potwierdzony: `return` wykonuje się PRZED liniami 12463-12471 — w gałęzi
  `isAwaitingFirstPlayerCity()===true` (dokładnie ta, dla której KROK 1c istnieje) ŻADNA z
  tych 8 linii się nie wykonuje. Zarzut Evaluatora rundy 2 potwierdzony jako trafny.
- `enterBuildModeEscapeOverlay()` @ **12474**: `pushOverlay('build-mode', () =>
  exitBuildMode())` — potwierdza, że wpis na stosie faktycznie istnieje i że jego
  `onClose` to ten sam `exitBuildMode()`.
- Precedens twardego resetu (reset stanu przy nowej grze) — świeży `grep -n
  "buildModeOpen = false;\|popOverlay('build-mode');\|activeImprovementKey = null;\|
  resetMapOverlayToggleDefaults();\|clearBuildModeVisuals();"` lokalizuje go dokładnie na
  **34305-34309** (nie 34303-34309 jak cytował Evaluator rundy 2 — drobna korekta o 2
  linie, treść identyczna):
  ```ts
  buildModeOpen = false;
  popOverlay('build-mode');
  activeImprovementKey = null;
  resetMapOverlayToggleDefaults();
  clearBuildModeVisuals();
  ```
  Potwierdza wzorzec: reset build-mode BEZ przechodzenia przez `exitBuildMode()` wymaga
  `popOverlay('build-mode')` i `clearBuildModeVisuals()` obok samych zmiennych.
- `gra/src/ui/escapeOverlayStack.ts` przeczytany w całości (109 linii) tej rundy:
  `pushOverlay(id, onClose)` @ 85-91 dedupluje po `id` (`findIndex` + `splice` przed
  `push`), `popOverlay(id?)` @ 94-103 zdejmuje po `id` lub wierzchni, `top()` @ 106-108
  zwraca wierzchni wpis lub `null`. `lockEscapeWhileStacked()` @ 47-50 utrzymuje
  `Keyboard Lock API` na Escape gdy `stack.length>0` — potwierdza mechanizm opisany przez
  Evaluatora: martwy wpis `'build-mode'` fotela A pozostaje na wspólnym stosie, dopóki
  nic go nie zastąpi/zdejmie.
- `refreshD1bHud` — potwierdzone jako alias importu: `import { showHud, updateHud as
  refreshD1bHud, hideHud, markMinimapDirty } from './ui/hud';` @ **main.ts:646**. KROK 7
  `switchActiveHuman()` (§2 dokumentu recon) już woła `updateHud()` — wołanie
  `refreshD1bHud()` osobno w KROK 1c byłoby duplikatem tego samego wywołania, nie brakiem.
- `refreshBuildHighlight()` @ **12309**, ciało 12309-~12330 odczytane: w każdej gałęzi
  woła `clearMineEligibleOverlay()`/`unitRenderer.clearHighlight()` lub
  `unitRenderer.setHighlight(...)` — funkcjonalnie pokrywa się z tym, co
  `clearBuildModeVisuals()` już robi wprost (`unitRenderer.clearHighlight()` +
  `clearMineEligibleOverlay()`, main.ts:12350-12354) w kontekście "wygaś wszystko" (nie ma
  tu nic do podświetlenia, bo `buildModeOpen`/`activeWonderId`/`foundCityMode` są już
  `false`/`null`) — wołanie osobne nie dodaje nic ponad `clearBuildModeVisuals()`.
- `refreshBuildApi()` @ **12254**, ciało 12254-~12261 odczytane: przelicza dostępność
  budowy dla **`playerOwnerId: '0'`, `playerOwnerIdNum: 0`, zahardkodowane wprost w ciele**
  — przelicza stan DLA FOTELA ODCHODZĄCEGO, nie dla nowego aktywnego, i wołane PRZED KROK 4
  (przełączenie `humanSeats.activeHumanOwnerId`) w tej gałęzi nie miałoby sensu.
  Zahardkodowanie `'0'` to osobny, nienowy dług (ten sam wzorzec co
  `refreshLiveEmpireRatesUnsafe()` z §1a tego dokumentu) — nie naprawiam go tutaj, poza
  zakresem tej poprawki (zarzut Evaluatora dotyczył tylko `clearBuildModeVisuals()`/
  `popOverlay('build-mode')`).

**Wniosek weryfikacji:** zarzut Evaluatora rundy 2 w 100% potwierdzony świeżym odczytem.
Rekomendowana poprawka (dopisać `clearBuildModeVisuals()` + `popOverlay('build-mode')`,
przywołując precedens main.ts:34305-34309) jest właściwa i wystarczająca;
`refreshBuildApi()`/`refreshBuildHighlight()`/`refreshD1bHud()` (pozostałe 3 z 8 pominiętych
linii) świadomie NIE dopisane — uzasadnienie wyżej (duplikat KROK 7, funkcjonalny podzbiór
`clearBuildModeVisuals()`, przeliczenie dla złego fotela).

## Zmiany wprowadzone w `01-operator-runda1-analiza.md`

1. **KROK 1c (§2)** — dopisane w gałęzi `if (isAwaitingFirstPlayerCity())`:
   `clearBuildModeVisuals();` i `popOverlay('build-mode');`, każde z komentarzem
   wskazującym dokładnie co czyści i dlaczego brak wywołania byłby luką (duszek na
   ekranie / martwy wpis na wspólnym stosie Escape).
2. **Komentarz przy `exitBuildMode();`** poprawiony — poprzednia wersja
   (`// "grzeczna" ścieżka: czyści wizualia + popOverlay('build-mode')`) była myląca w
   kontekście bloku `if` bezpośrednio pod nim (sugerowała, że to wywołanie "i tak" coś
   robi w opisywanym dalej przypadku guard-true, podczas gdy w TEJ gałęzi to no-op) —
   nowy komentarz rozróżnia wprost obie gałęzie i wyjaśnia, że blok `if` niżej jest
   JEDYNYM miejscem czyszczącym w gałęzi guard-true, nie dodatkowym zabezpieczeniem.
3. **`snapshotVisibleState()` (§4.2)** — dodane dwa pola: `ghostChipVisible:
   ghostChip.style.display !== 'none'` i `escapeOverlayTopId: top()?.id ?? null`
   (wymaga nowego importu `top` z `./ui/escapeOverlayStack` obok już istniejącego
   `pushOverlay, popOverlay` @ main.ts:1065 — odnotowane jako krok implementacji).
4. **Nowy SCENARIUSZ B (§4.2)** — Scenariusz A (istniejący od rundy 2) NIE ćwiczy gałęzi
   `isAwaitingFirstPlayerCity()===true`, bo `startNewGame` zostawia owner 0 z miastem —
   build-mode wszedłby tam przez gałąź guard-false (`exitBuildMode()` bez guarda,
   poprawnie obsłużoną już od rundy 1/2). Scenariusz B: świeży bootstrap, wejście w
   build-mode PRZED założeniem pierwszego miasta, jawna asercja
   `isAwaitingFirstPlayerCity()===true` (wymaga wystawienia tej funkcji na
   `__hotSeatTestDebug`, dopisane jako TODO implementacji) przed przełączeniem fotela,
   ustawienie `ghostChip` na widoczny przez hover nad mapą, `switchActiveHuman(1)`, potem
   asercje `ghostChipVisible === false` i `escapeOverlayTopId !== 'build-mode'`.
5. **§6 pkt 7 (nowy)** — zamyka zarzut jawnie, z odniesieniem do tego raportu.
6. **§7 checklist** — nowy punkt "RUNDA 3" potwierdzający zamknięcie.

## Rzeczy świadomie NIE zmienione w tej rundzie

- Zarzut #1 (toast) — zamknięty od rundy 2, Evaluator runda 2 potwierdził jako
  wystarczający, zero ingerencji.
- `refreshBuildApi()`'s hardkod na ownerId `'0'` — istniejący, nienowy dług, poza
  zakresem tej poprawki (dotyczy KROK 1c tylko pośrednio, przez to że NIE jest wołany
  tutaj — patrz uzasadnienie wyżej).
- Otwarte pytanie z §6 pkt 6 (czy `isAwaitingFirstPlayerCity()` jest per-owner) —
  nierozstrzygnięte, jak było; ta poprawka nie zależy od jego odpowiedzi.

## STATUS: PASS-WITH-NOTES
## DOMAIN: INFORMATIONAL
## TEMAT: R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1
## GOAL: Recon-only (zero zmian kodu) dla Etapu 5 planu hot-seat: `switchActiveHuman()` + `ui/hotSeatHandoff.ts`.
## ZMIANY-COMMIT: `dyspozycje/autobot/runs/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1/01-operator-runda1-analiza.md` (KROK 1c §2 rozszerzone o `clearBuildModeVisuals()`/`popOverlay('build-mode')` + poprawiony komentarz; §4.2 `snapshotVisibleState()` + nowy SCENARIUSZ B; §6 pkt 7; §7 checklist) i nowy plik `05-operator-runda3.md` (ten raport), do zacommitowania w tej rundzie w worktree `/home/user/wt-hotseat-etap5-recon`, gałąź `autobot/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1`. `git status --porcelain` czysty poza tymi dwoma plikami przed startem tej rundy; zero zmian w `gra/src`/`gra/tools`.
## TESTY: Nie dotyczy (dokument, zero kodu produkcyjnego). Każda cytowana linia main.ts/escapeOverlayStack.ts zweryfikowana świeżym `grep`/`sed`/`Read` tej rundy (sekcja wyżej) — zero przesunięcia względem cytatów Evaluatora rundy 2 poza jedną korektą o 2 linie (precedens 34305-34309, nie 34303-34309 — treść identyczna, tylko dokładniejsza kotwica).
## BLOKADY: Brak. Zarzut Evaluatora rundy 2 (jedyny otwarty) zaadresowany w tej rundzie z uzasadnieniem każdej dodanej i każdej świadomie pominiętej linii.
## RUNDY: 3/5.
## NASTĘPNY KROK: Evaluator runda 3 — weryfikuje WYŁĄCZNIE tę jedną poprawkę (KROK 1c: `clearBuildModeVisuals()`/`popOverlay('build-mode')` + komentarz + `snapshotVisibleState()` + SCENARIUSZ B), analogicznie do zawężenia trybu naprawczego z `02-evaluator-runda1.md`/`04-evaluator-runda2.md`. Po PASS: dokument recon zamknięty, gotowy do dispatchu `R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1` (implementacja, osobny temat).
## DEPLOY/PUSH: NIE WYKONANO
