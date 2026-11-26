STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ALLIANCE-LABEL-AFTER-DEAL-Q1 (tag ALLYCLEAN, odp. 7A)
GOAL: gdy umowa sojuszu pary znika (activeDeals), relacja pary wraca do pokoju (status przestaje być „sojusz”); etykieta zawsze zgodna z umową.
BAZA: b1e4e04ab3af27a1241282d5cea1e9a97c2d4617 (origin/main, ROBOCZA 9f9f3a0d FALA 912)

## ZMIANY/COMMIT
Allowlista zachowana. Pliki:
- gra/src/game/diplomacy-treaties.ts: nowa czysta funkcja `isStaleAllianceStatus(state, a, b, status)` (true tylko dla statusu „sojusz” bez żadnej umowy sojuszu pary); `isAllianceKind` wyeksportowany (było lokalne).
- gra/src/main.ts: import `isStaleAllianceStatus`; nowa funkcja `reconcileAllianceStatusAfterDeals()` (wspólny punkt: przelicza wszystkie pary owners, para nieaktualna → `setDiploRelation(a,b,{...rel,status:'pokoj'})`; zaufanie/respekt zostają). Wołana po usunięciu/wygaśnięciu umowy w: (1) odmowie wezwania do wojny sojusznika (obok `syncRelationFromDeals(recipientOwnerId, p.ownerId)`), (2) `runDiplomacyTurnTick` po `expireTreaties` (wygaśnięcie naturalne), (3) odmowie obrony sojusznika przez gracza (`playerRefusalAllies`), (4) zerwaniu trybutu (pętla `broken`), (5) wasalizacji (`wasalDeal`).
- gra/tools/alliance-label-clean-test.cjs (NOWY): 18 asercji + mutacja.
- dyspozycje/autobot/runs/R-WEB-DIPLO-ALLIANCE-LABEL-AFTER-DEAL-Q1/10-operator-claude.md (ten raport).

Świadomie NIE wołane:
- `breakTreatiesOnWar` (wojna): po wojnie status ustawia `applyDiploEventTracked` → `wojna`; wołanie przed odczytem `cur` zmieniłoby wejście zdarzenia (kara zależy od statusu). Brak luki: wojna nadpisuje etykietę.
- `zerwanie dobrowolne` (`breakTreatyVoluntarily`, ~24736): już ma własną korektę (`wasAlliance && !stillAllied → pokoj`), zachowana bez zmian.
- `eliminacja właściciela` (`activeDeals.filter` ~40382): relacje kasowane wraz z właścicielem.

Zmian wartości balansu, limitu 2 sojuszy, asercji (poza dodaniem nowego testu) — brak. Żaden istniejący test nie kodował starego kontraktu (status „sojusz” po zniknięciu umowy): wszystkie testy alliance/ai-ai poniżej zielone bez zmian asercji, więc „wypisz zmienione asercje” = brak.

## TESTY
- Nowy test: `node tools/alliance-label-clean-test.cjs` → PASS=18 FAIL=0 (A: aktywny sojusz zostaje; B: pusta lista/inna para → nieaktualny; C: sam NAP → nieaktualny; D: sojusz innej pary nie podtrzymuje; E: wojna/pokój/neutralni nigdy nieaktualne; F: sojusz wojskowy/obronny/pełny rozpoznane; G: 5 wywołań `reconcileAllianceStatusAfterDeals` w main.ts + definicja).
- Mutacja (wyłączenie sprawdzenia: `isStaleAllianceStatus` → `return false`): test CZERWONY, FAIL=4 (B×2, C, D). Po przywróceniu: PASS=18 FAIL=0.
- `tsc --noEmit -p gra/tsconfig.json`: 177 błędów, wszystkie w kategoriach środowiskowych (brak modułu `three`, brak typów vite, `brandAssets`/`leaderPortraits` sprzed zmiany, implicit any w wonderpreview); żaden nie wskazuje na nowe linie w main.ts ani diplomacy-treaties.ts. Pierwsza wersja dała 2 błędy `number | undefined` w nowej funkcji (main.ts ~24812) — poprawione (`owners[i]` z guardem, `owners.slice(i+1)`).
  Uwaga: tsc uruchomiony z tsc z pomocniczego node_modules (brak `three` w worktree), więc porównanie to „brak nowych błędów w dotkniętych plikach”, nie czysty zielony tsc.
- logic-test: LOGIC OK 213/213
- ai-test: 297 passed, 0 failed
- tech-tree-test: 20/0
- research-test: 33/33
- combat-test: 6/6
- war-rules-multiwar-main-guard-test: 21/0
- ai-ai-alliance-tick-test: 19/19, mutanty 8/8
- ai-ai-alliance-limit-test: OK, mutanty 4/4 + wiring 4/4
- alliance-war-obligation-test: 14/0
- city-state-alliance-test: 74/0
- alliance-limit-ai-t66-test: 6/6
- diplo-alliance-gate-test: 21/0
- `git diff --check`: czysto.
Tymczasowy symlink gra/node_modules usunięty po bramkach.

## POMIAR (liczba sojuszy AI przed/po)
NIE ZMIERZONO — runner pomiaru 150 tur (limits-measure / diplomacy-harder-measure-run) nie został uruchomiony w tej rundzie: wymaga Chromium (znany problem #90) i nie był wykonany tą rundą. Test źródłowy i jednostkowy zastępuje go tylko w zakresie kontraktu (etykieta), nie w zakresie wpływu na liczbę sojuszy AI. Ryzyko z dispatchu (podmiana sojuszu AI↔AI przez okno 1 tury) NIE ZWERYFIKOWANE na żywo; w kodzie: podpisywanie sojuszu sprawdza `activeDeals` (nie status), więc po czyszczeniu etykiety AI może ponownie zawrzeć sojusz — potwierdza to tylko pomiar.
DECISION_REQUIRED: nie wystąpiło (brak pomiaru, więc nie można stwierdzić spadku >30%).

## BLOKADY
- Brak pomiaru runtime (patrz wyżej) — NIE ZMIERZONO.
- Brak dowodu w przeglądarce (temat nie jest wizualny; etykieta w panelu dyplomacji pochodzi z `toRelation`/statusu — po zmianie wraca do „pokój”, nie testowano wyglądu).

## RUNDY
1/5. Wynik: PASS-WITH-NOTES (kod + test + bramki zielone; pomiar NIE ZMIERZONO).

## UWAGI-DLA-ORKIESTRATORA
- Znalezisko poza zakresem: w `breakTreatiesOnWar` (~25754) przy wojnie AI↔AI nie ma żadnej korekty statusu przed `applyDiploEventTracked`; status wraca przez zdarzenie wojny, więc to nie błąd ALLYCLEAN, ale warto zweryfikować przy okazji pomiaru wojen.
- Dziennik `runDiplomacyTurnTick` i `expireTreaties` wołają porządkowanie po każdym wygaśnięciu; koszt: 105 par × `getDiploRelation` raz na turę przy zmianie traktatów (trywialny).

## NASTĘPNY KROK
Bramka: pomiar przed/po (seed 4242 i 7, do t67 jak w ALLY66) na działającym Chromium, lub po decyzji orkiestratora uruchomienie runnera bez Chromium. Następnie Evaluator + Final Control.

## DEPLOY/PUSH: NIE WYKONANO
