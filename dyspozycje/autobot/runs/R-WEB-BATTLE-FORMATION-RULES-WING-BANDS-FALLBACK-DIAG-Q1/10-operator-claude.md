# R-WEB-BATTLE-FORMATION-RULES-WING-BANDS-FALLBACK-DIAG-Q1 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (rozstawienie w bitwie) — zmiana wyłącznie w teście harnessu; kod gry bez zmian
TEMAT: R-WEB-BATTLE-FORMATION-RULES-WING-BANDS-FALLBACK-DIAG-Q1
GOAL: (1) ustalić najnowszy zielony commit i sprawcę czerwieni; (2) rozstrzygnąć: błąd kodu czy przestarzała asercja; (3) naprawić właściwą stronę.

## Wynik diagnozy

BAZA: `604a4f873b878a37d45010ba6d39dc5110e6b697` (= origin/main, HEAD worktree przed zmianą).

Czerwona asercja: `gra/tools/battle-formation-rules-test.cjs`, linia 151 (przed zmianą):
`const mountedWing = initialBattleRoleOf(bu) === 'mounted';` — liczba trafień 0, oczekiwano 2.

Sprawca: commit **`e57f1466e`** (R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1 r2, „zaskoczeni w linii <=3 (konnica w linii)”).
Dodał on strażnik `&& !lineSide` w obu miejscach `mountedWing` w `gra/src/battle/battleScene.ts`:
- setup: `_placeUnitsOneSide` (ok. linii 5430 w `battleScene.ts`, funkcja rozstawienia),
- reset: `_placeUnitsOneSide`/fallback resetu (ok. linii 18014).

Historia (zmierzona na commitach, nie z pamięci):
- `76f52ba9f` (ambush r1, obrona) — test PASS, exit 0, komunikat „PASS: front ranks, mounted wings, Attack line pacing, and same-activation ranged fire”, asercja strict-string zgodna (2 trafienia).
- `e57f1466e` (ambush r2) — test FAIL na tej samej asercji (`AssertionError … 0 !== 2`).
- `604a4f873` (baza) — ten sam FAIL.
- Plik testu `gra/tools/battle-formation-rules-test.cjs` nie był zmieniany od `682a6b9a0`, więc asercja nie została zaktualizowana przy zmianie kodu.

Rozstrzygnięcie: **PRZESTARZAŁA ASERCJA** (strict-string), nie błąd kodu.
- Zmiana `&& !lineSide` jest świadoma i udokumentowana w komentarzach kodu oraz w commicie e57f1466e (zaskoczeni na linii zasadzki: konnica w linii, nie na skrzydłach; temat R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1).
- `lineSide` jest prawdziwy wyłącznie dla strony zasadzki w linii, więc dla zwykłej bitwy `mountedWing` pozostaje `true` i fallback pasm skrzydeł działa tak samo jak wcześniej.
- Właściwość testowana przez asercję (konnica zostaje w paśmie skrzydeł w fallbacku setup i reset przy zablokowanych polach) jest zachowana dla każdej strony poza zasadzką.

## Zmiana (ZMIENIONE pliki)

1. `gra/tools/battle-formation-rules-test.cjs`:
   - asercja liczy `const mountedWing = initialBattleRoleOf(bu) === 'mounted' && !lineSide;` (2 trafienia) z komentarzem o wyjątku zasadzki;
   - w `loadBattleScene()` dodano `require(path.join(__dirname, 'lib', 'esbuild-raw-plugin.cjs'))` do `plugins`. Bez tego test pada na buildzie: `src/ui/brandTokenVars.ts:7 … tokens.css?raw` (drugi, niezależny od asercji powód czerwieni tego harnessu; ten sam helper, który CSSRAW zastosował w 25 innych harnessach).
- `src/` NIE zmieniony (potwierdzone `git diff --stat`: tylko 1 plik, 5 insercji, 3 usunięcia).

## TESTY (surowe wyniki, ten commit)

- `node tools/battle-formation-rules-test.cjs` (po zmianie): `PASS: front ranks, mounted wings, Attack line pacing, and same-activation ranged fire`, exit 0.
- Mutacja (zgodnie z kryterium b): w `battleScene.ts` tymczasowo `const mountedWing = false;` (2 miejsca) → test: `AssertionError … terrain/collision fallback keeps mounted units inside wing bands in setup and deploy reset (ambush line sides excluded)` / `0 !== 2`. Źródło przywrócone `git checkout -- gra/src/battle/battleScene.ts` (potwierdzone: `git status` pokazuje tylko plik testu).
- Przed zmianą (baza 604a4f873): exit 1, ten sam `0 !== 2` (zmierzone).
- `tsc --noEmit -p tsconfig.json` (w `gra/`): exit 0.
- `battle-cavalry-flank-default-test.cjs`: PASS, 960 checks, exit 0.
- `battle-deploy-cavalry-flanks-test.cjs`: PASS, 536 checks, exit 0.
- `battle-commander-star-reset-test.cjs`: 10 PASS / 0 FAIL, exit 0.
- `battle-initial-placement-runtime-test.cjs`: PASS, mutacja 4/4 złapana, exit 0.
- `ambush-deploy-geometry-test.cjs`: 20 OK / 0 FAIL (wymóg z dispatchu: 20/0), exit 0.
- `ambush-deploy-scene-test.cjs`: 26 OK / 0 FAIL (wymóg: 26/0), exit 0.
- `ambush-deploy-wiring-test.cjs`: 15 OK / 0 FAIL (wymóg: 15/0), exit 0.

NIE ZMIERZONO w tym temacie:
- `ambush-deploy-identity-test.cjs` (1776 pozycji, wymaga `AMBUSH_BASE_GRA` wskazującego wyciąg 1c452ec35) — nie uruchomiono; kod gry nie został zmieniony, więc zmiana nie może wpłynąć na rozstawienie zwykłej bitwy, ale wynik nie jest zmierzony.
- `ambush-deploy-line-width` (240), `ambush-deploy-zone-visual` (11/0) — nie uruchomiono.
- `mgla-sciezka-inwariant` (42/0), `ambush` poza wymienionymi — nie uruchomiono.
- Chromium / żywa gra — nie dotyczy (tylko harness node).
- `npm run build/dev` — nie wykonywano (zakaz); `npm ci --ignore-scripts` wykonano tylko w worktree (instalacja zależności do uruchomienia harnessów, bez skryptów).

## BLOKADY

Brak blokad technicznych dla zmienionego testu. Decyzja produktowa nie była potrzebna: asercja odzwierciedla regułę zasadzki zatwierdzoną wcześniej (R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1).

## RUNDY

1/5 (Operator, Haiku 5.5). Brak FAIL/BLOCK od Evaluatora w tej rundzie (Evaluator i FC jeszcze nie uruchomione).

## UWAGI-DLA-ORKIESTRATORA

- Dispatch (`00-dispatch.md`) znajduje się na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, a NIE w `origin/main` (zgodnie z treścią zadania odczytano go z gałęzi).
- Test był czerwony z dwóch niezależnych powodów: asercja strict-string (sprawca e57f1466e) oraz brak loadera `?raw` w `loadBattleScene()` (naprawione tym commitem przez helper esbuild-raw-plugin, jak w 25 innych harnessach).
- Znalezisko poza zakresem, do decyzji orkiestratora (NIE tworzono nic): w `battleScene.ts` nadal jest dług `_placeUnitsOneSide` vs `_resetDeploySide` (dwa niemal identyczne bloki fallbacku), zgłoszone już jako dług REPIN; nie ruszano.
- Pozostaje do oceny Evaluatora: czy `!lineSide` powinno mieć własną asercję (obecnie tylko liczba trafień wzorca).

## ZMIANY/COMMIT

Pliki: `gra/tools/battle-formation-rules-test.cjs`, `dyspozycje/autobot/runs/R-WEB-BATTLE-FORMATION-RULES-WING-BANDS-FALLBACK-DIAG-Q1/10-operator-claude.md`.
Commit: patrz pole `sha` w odpowiedzi (SHA czubka).

NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja diagnozy (sprawca e57f1466e, asercja przestarzała) i wyników bramek powyżej; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
