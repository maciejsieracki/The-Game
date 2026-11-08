# 00-dispatch — Meta parameter removal Operator

STATUS: DISPATCH READY
ROLE: Operator
TOPIC: R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922
PARENT_PROGRAM: t_69522e22
SUPERSEDES: t_637c6d6e Wariant C decision (REFERENCE_ONLY), see OWNER-DECISION-20260922.md
BOARD: the-game-real24
PROFILE: default
PROJECT: p_9ae9ac64
TENANT: the-game
ROUND: 1/5
ATTEMPT: r1-20260922
IDEMPOTENCY_KEY: R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922:operator:r1
WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-meta-remove-20260922
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922
BASE: origin/main=0caa4dfa31d37337cd74fdbab95ee77da4806d98
MODEL: claude-sonnet-5
PROVIDER: anthropic
REQUESTED_REASONING: max

## GOAL

Właściciel uchylił Wariant C (reference-only) dla 4 parametrów meta i polecił
ich CAŁKOWITE usunięcie z macierzy: `meta_epoka_kamien`, `meta_epoka_braz`,
`meta_epoka_zelazo`, `meta_tier_roster`. Przeczytaj pełne uzasadnienie w
`dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922/OWNER-DECISION-20260922.md`
przed rozpoczęciem pracy.

## SCOPE (dokładny allowlist)

1. `gra/data/civ-matrix.json`:
   - Usuń 4 wpisy z `paramDefs`.
   - Usuń te same 4 klucze z `params` w każdym z 15 wierszy `cywilizacje[]`
     (60 komórek łącznie).
   - Zaktualizuj `_meta.kolumny` z 113 na 109 (policz programowo, nie na sztywno
     — zweryfikuj że faktyczna liczba kluczy w `paramDefs` po usunięciu = 109).
   - Nie ruszaj żadnego innego klucza, w tym `meta_mnoznik_waluta`.
2. `gra/src/game/civ-matrix-semantic.ts`:
   - Usuń Set `REFERENCE_ONLY` i jego 4 identyfikatory.
   - Usuń gałąź `REFERENCE_ONLY` z `civMatrixConsumerStatus`.
   - Usuń gałęzie `case 'REFERENCE_ONLY'` z `statusLabel` i `statusReason`.
   - Usuń z typu `CivMatrixConsumerStatus` wartość `'REFERENCE_ONLY'`
     TYLKO jeśli po usunięciu Setu żaden inny param jej nie używa (zweryfikuj
     przez grep przed usunięciem typu).
   - Zaktualizuj komentarz nad dawnym Setem — zastąp odniesieniem do tej
     decyzji jako supersedującej Wariant C, nie kasuj historii bez śladu
     (krótka nota: "superseded by R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922,
     owner decided full removal instead of reference-only retention").
3. `gra/tools/civ-matrix-semantic-labels-test.cjs`,
   `gra/tools/civ-matrix-meta-roster-wiring-test.cjs`:
   - Usuń/zaktualizuj asercje odwołujące się do usuniętych 4 ID.
   - Zachowaj wszystkie asercje dot. innych parametrów (w tym
     `meta_mnoznik_waluta`) bez zmian.
4. Sprawdź (grep) czy istnieją inne pliki odwołujące się do tych 4 ID
   (`gra/src/**`, `gra/tools/**`, `panele-sterowania/**` jeśli śledzone w Git)
   i zgłoś je w raporcie nawet jeśli poza allowlistą tej karty — nie edytuj
   plików spoza `gra/data/civ-matrix.json`, `gra/src/game/civ-matrix-semantic.ts`,
   `gra/tools/civ-matrix-semantic-labels-test.cjs`,
   `gra/tools/civ-matrix-meta-roster-wiring-test.cjs` bez wyraźnej potrzeby
   (np. jeśli test w innym pliku referencuje literalnie usunięty klucz i bez
   poprawki nie przejdzie kompilacji/testu — wtedy dopisz go do allowlisty
   i uzasadnij w raporcie).

## ACCEPTANCE

1. `civ-matrix.json`: dokładnie 109 kluczy w `paramDefs` (policzone programowo);
   0 wystąpień żadnego z 4 usuniętych ID w całym pliku; `_meta.kolumny=109`;
   wszystkie pozostałe 109×15=1635 komórek nietknięte (identyczne wartości jak
   przed zmianą — zweryfikuj diffem, że jedyna zmiana to usunięcie kluczy, nie
   modyfikacja pozostałych).
2. `civ-matrix-semantic.ts`: 0 wystąpień usuniętych 4 ID; `tsc --noEmit` przechodzi
   bez błędów; żaden pozostały parametr nie zmienia klasyfikacji.
3. Oba pliki testowe: `node --check` OK, testy przechodzą (uruchom i zaraportuj
   dokładne liczby pass/fail przed i po zmianie).
4. `git diff --check` czyste, brak nieoczekiwanych plików w diff.
5. Brak commit/push/merge/deploy — tylko diff w worktree + raport.

## ANTI-SELF-DECEPTION

Nie wystarczy usunąć wpisy z `paramDefs` — jeśli którykolwiek klucz zostanie
osierocony w `params` (usunięty z paramDefs, ale wciąż obecny w danych wiersza),
to błąd, nie sukces. Policz programowo, nie licz "na oko" z edytora.

## REQUIRED ARTIFACTS

`01-operator.md`, `01-evidence.json` (przed/po liczby, diff summary, grep wyniki),
`01-transition-receipt.md`. Report dokładny HEAD, branch, worktree, testy,
`PUSH/DEPLOY: NIE WYKONANO`.

## NEXT PHASE

Terminal Operator → niezależny Evaluator. Defense tylko dla numerowanych
zarzutów. Potem Final Control → workerless integration gate (blocked,
assignee: none) czekająca na osobną zgodę właściciela.
