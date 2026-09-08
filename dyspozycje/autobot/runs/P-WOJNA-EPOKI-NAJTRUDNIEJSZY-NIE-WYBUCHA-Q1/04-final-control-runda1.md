# P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1 — Final Control, runda 1/5

MODEL+EFFORT: Sonnet 5, effort high · worktree `/home/user/wt-wojna-epoki-hard`, gałąź
`autobot/P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1`, HEAD `84d27f3f` (Obrona runda 1), baza
zarzutów Evaluatora `e02558d7`, baza dispatchu `9acc5037`. Wszystkie kroki weryfikacji uruchomione
SYNCHRONICZNIE (Bash, bez `run_in_background`/Monitor), z bezpośrednim wynikiem odczytanym przed
przejściem dalej.

STATUS: PASS
DOMAIN: GAME
TEMAT: P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1
GOAL: Zdiagnozuj i napraw przypadek, w którym mechanizm "wymuszonej wojny epoki" (forced war —
trzy niezależne moduły: `forced-war-stone.ts`, `forced-war-bronze.ts`, `forced-war-iron.ts`,
wspólny rdzeń parowania `forced-war-common.ts::assignForcedWarPairings`) nie wybucha, dopóki
strony nie nawiązały kontaktu dyplomatycznego ("nie poznały się") — wymuszona wojna epoki ma
wybuchać niezależnie od tego, czy strony formalnie "poznały" się dyplomatycznie, bez zepsucia
zwykłych (niewymuszonych) wypowiedzeń wojny ani ogólnej reguły D3-Q2.

## WERDYKTY (per zarzut, §3c)

| # | Zarzut | Werdykt |
|---|---|---|
| 1a | Brak `diplomaticallyDiscoveredOwners`/`diplomaticContactEstablished` przy skutecznym wypowiedzeniu wymuszonej wojny epoki na gracza (panel dyplomacji dalej pokazywałby `pre_contact` mimo realnej wojny) | **ODDAL** — zarzut był trafny, ale naprawiony w tej samej rundzie (aneks Obrony, main.ts ~32335-32338) i niezależnie potwierdzony: kod źródłowy zawiera dokładnie `diplomaticallyDiscoveredOwners.add(ownerId)` + `diplomaticContactEstablished.add(ownerId)` ograniczone do `isForcedEpochWarDeclareCmd(cmd) && targetId===0`; żywy test `forced-war-player-no-contact-live-test.cjs` (uruchomiony przeze mnie synchronicznie) zawiera nową asercję D2 `isDiplomaticallyDiscovered(attackerId)===true PO turze` i daje **14/14 pass**. Nic nie podważa, że fix faktycznie działa. |
| 1b | Degradacja karty `warEventLog` do `kind:'info'` (przycięta przez `getWarEventLogHead().slice(0,3)`) zamiast dedykowanej `kind:'enemy'` w scenariuszu bez kolokacji | **ODDAL** (poza zakresem) — potwierdzone niezależnie źródłowo: `getWarEventLogHead` (main.ts:21907, `warEventLog.slice(0,3)`) pochodzi z commita `546f6a51` (Cursor Agent, 2026-08-17), a komentarz dokumentujący dokładnie ten problem obcinania (main.ts:22525-22532, "obcina do 3, za mało gdy w tej samej turze obok buntu...") pochodzi z commita `16ad08413` (Claude, 2026-09-03) — oba **wyraźnie przed** bazą dispatchu tego tematu (`9acc5037`) i identyczne w bazie dispatchu (`git show 9acc5037:gra/src/main.ts` zawiera te same linie). To potwierdzony, pre-istniejący, współdzielony mechanizm EOT — nie coś wprowadzonego przez ten temat. Rekomendacja Operatora (osobny temat `P-WYDARZENIA-WOJNA-KARTA-PRZYCIETA-Q1`) zasadna. |
| 2 | Brak wiążącego żywego dowodu PRZED/PO (niedeterminizm `refreshFog` w `?playtest=mapa`) | **ODDAL** — połączony dowód (jednostkowy PRZED/PO + żywy PO) uznany za wystarczający DLA TEGO zarzutu, zgodnie z warunkiem orkiestratora. Zweryfikowałem samodzielnie: `forced-war-player-pre-contact-gate-test.cjs` uruchomiony synchronicznie daje **45/45**; przeczytałem cały plik — importuje (przez `esbuild.buildSync` + `require(bundle)`) REALNE, nietknięte `decideAIDiplomacy` z `src/game/ai.ts` oraz `partitionDiplomacyCommandsForPlayerFog`/`filterDiplomacyCommandsForLayer`/`diplomacyLayerForOwner` z `src/game/diplomacy-layers.ts` — jedyny kod zduplikowany lokalnie w teście to trywialna jedno-liniowa klasyfikacja `isForcedEpochWarDeclareCmd` (regex na `powod`), identyczna z main.ts, nie reimplementacja logiki silnika/warstwy dyplomacji. To NIE jest błąd z `P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1` rundy 2 (tam reimplementowano samą regułę biznesową równolegle) — tu reimplementowana jest wyłącznie trywialna, publicznie udokumentowana klasyfikacja komendy po stałym markerze, a cała logika warstw/routingu jest wołana z prawdziwego źródła. |

**AGREGAT:** brak `NAPRAW`, brak `DO DECYZJI CZŁOWIEKA` → same `ODDAL` → **PASS**.

## DOWÓD WŁASNEJ WERYFIKACJI (wszystkie kroki uruchomione synchronicznie w tej rundzie)

1. `cd gra && node ./node_modules/typescript/bin/tsc --noEmit` → **0 błędów** (exit 0).
2. `node tools/forced-war-player-pre-contact-gate-test.cjs` → **45/45 pass** (exit 0); plik
   przeczytany w całości — potwierdza realne funkcje silnika (`ai.ts`, `diplomacy-layers.ts`
   przez bundling esbuild), zero reimplementacji logiki biznesowej.
3. `node tools/forced-war-player-no-contact-live-test.cjs` (żywy Chromium/Playwright,
   realny `vite build`, realny `endTurn()`) → **14/14 pass** (exit 0), w tym nowa asercja D2:
   `isDiplomaticallyDiscovered(attackerId)===true PO turze` — potwierdza naprawę Zarzutu 1a.
4. `node tools/forced-war-player-target-live-test.cjs` (regresja "gracz już poznał") →
   **12/12 pass** (exit 0), w tym dedykowana karta `kind:'enemy'` w top-3 (kontrast do 1b:
   scenariusz kolokowany ma mniej zdarzeń EOT w turze).
5. 5 bramek referencyjnych (§6 R-PROC-AUTOBOT.md), katalog `gra/`:
   `logic-test.cjs` **213/213**, `tech-tree-test.cjs` **19/19**, `research-test.cjs` **33/33**,
   `unit-replace-test.cjs` **13/13**, `combat-test.cjs` **6/6** — wszystkie zielone, liczby
   identyczne z raportami Operatora/Evaluatora.
6. 18 bramek forced-war/dyplomacji, wszystkie uruchomione synchronicznie, wszystkie zielone,
   liczby identyczne z raportami Operatora/Evaluatora: `forced-war-bronze-test` 56/56,
   `forced-war-stone-test` 38/38, `forced-war-iron-test` 55/55, `forced-war-trojstronna-test`
   23/23, `forced-war-bronze-main-guard-test` 28/28, `forced-war-stone-main-guard-test` 19/19,
   `forced-war-iron-main-guard-test` 37/37, `forced-war-trojstronna-main-guard-test` 14/14,
   `forced-war-reguly-multi-turn-simulation-test` 39/39, `p-wojna-wymuszona-trzy-naprawy-test`
   13/13, `diplomacy-layers-test` 22/22, `ai-war-gate-test` 24/24, `diplomacy-war-gates-test`
   19/19, `wojna-wymuszona-parowanie-test` 47/47, `wojna-wymuszona-prog-tury-gracz-test` 9/9,
   `forced-war-bronze-new-game-reset-test` 34/34, `forced-war-iron-era-enter-turn-save-load-test`
   20/20, `forced-war-iron-mutant-probe` 37/37 asercji mutacyjnych zaczerwienionych (samokontrola
   OK, źródła przywrócone bajt w bajt) — **zero regresji**.
7. `git diff e02558d7 84d27f3f -- gra/src/main.ts` → ograniczony wyłącznie do bloku wykonania
   `wypowiedz_wojne` (aneks Obrony, +18 linii: klasyfikacja `isForcedEpochWarDeclareCmd(cmd)` +
   dwa `.add()`), zgodnie z zapowiedzią Obrony. `git diff 9acc5037 84d27f3f -- gra/src/main.ts`
   (pełny zakres tematu od dispatchu) → dokładnie trzy bloki: (i) nowy hak testowy
   `forceBronzeForcedWarOnPlayerNoContact`/`isDiplomaticallyDiscovered` (~21960-22023,
   `__eraTestDebug`), (ii) blok gatingu `ownerLoop` — klasyfikacja `isForcedEpochWarDeclareCmd`
   + rozdział `dipCmdsPlayerFacingForcedWar`/`...Normal`, routing przez
   `dipLayerIgnoringPlayerFog` (~32124-32160), (iii) blok wykonania `wypowiedz_wojne`
   z aneksu (~32335-32338). `git diff 9acc5037 84d27f3f -- gra/src/game/ai-difficulty-bonus.ts`
   → **0 linii, plik nietknięty** — brak kolizji z równoległym `P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1`.
   Pełny stat od dispatchu: `gra/src/main.ts` (+109/-1), dwa nowe pliki testowe, trzy raporty —
   dokładnie zgodne z allowlistą. `git diff --check` na `84d27f3f` → czysty. `git status --short`
   w worktree → puste (drzewo czyste).

## ZMIANY-COMMIT

`84d27f3f` (Obrona runda 1, na bazie `e02558d7` ← `dec075a9` ← `9acc5037`), NIE `main`, NIE push.
Pliki: `gra/src/main.ts` (+109/-1 od bazy dispatchu), `gra/tools/forced-war-player-pre-contact-gate-test.cjs`
(nowy, 196 linii), `gra/tools/forced-war-player-no-contact-live-test.cjs` (nowy/rozszerzony,
319 linii), raporty `01-operator-runda1.md`, `02-evaluator-runda1.md`, `03-obrona-runda1.md`.
Zero zmian poza allowlistą tego dispatchu.

## TESTY

Patrz DOWÓD WŁASNEJ WERYFIKACJI wyżej — wszystkie bramki i testy zielone, zero regresji,
`tsc --noEmit` czysty.

## BLOKADY

Brak blokujących GOAL. Poza zakresem tego tematu, odnotowane do osobnego zgłoszenia (nie
naprawiać przy okazji): (1) mechanizm `clusterForceWarTargetId` (`AI-CS-CLUSTER-DIFF`) ma
strukturalnie ten sam defekt braku odkrycia — poza allowlistą tego dispatchu; (2) degradacja
karty `warEventLog` do `kind:'info'` w scenariuszu bez kolokacji (Zarzut 1b, ODDAL powyżej) —
proponowany temat `P-WYDARZENIA-WOJNA-KARTA-PRZYCIETA-Q1`.

## RUNDY: 1/5

## NASTĘPNY KROK: integracja orkiestratora (weryfikacja allowlisty per plik/hunk, brak `git add -A`),
następnie `READY_FOR_DEPLOY` wyłącznie po faktycznej integracji do `main` z zielonymi bramkami na
tym stanie (§1b R-PROC-AUTOBOT.md) — nie na podstawie tego raportu samego w sobie.

## DEPLOY/PUSH: NIE WYKONANO
