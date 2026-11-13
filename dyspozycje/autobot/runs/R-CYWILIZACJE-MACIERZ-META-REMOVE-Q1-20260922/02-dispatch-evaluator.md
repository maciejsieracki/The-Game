# 00-dispatch — Meta parameter removal Evaluator

STATUS: DISPATCH READY
ROLE: Evaluator (independent — no access to Operator's reasoning/chat, only artifacts)
TOPIC: R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922
ROUND: 1/5
WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-meta-remove-20260922
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922
MODEL: claude-sonnet-5
PROVIDER: anthropic

## CONTEXT

Operator (round 1) zgłosił STATUS: PASS. Artefakty do niezależnej weryfikacji:
- `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922/01-operator.md`
- `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922/01-evidence.json`
- `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922/OWNER-DECISION-20260922.md`
  (pełne uzasadnienie i zakres zlecenia)
- Uncommitted diff w tym worktree: `gra/data/civ-matrix.json`,
  `gra/src/game/civ-matrix-semantic.ts`,
  `gra/tools/civ-matrix-meta-roster-wiring-test.cjs`,
  `gra/tools/civ-matrix-semantic-labels-test.cjs` (NIE commituj nic sam).

## ZADANIE

Nie ufaj liczbom z `01-operator.md`/`01-evidence.json` — zweryfikuj każdą
niezależnie, programowo, od zera:

1. Policz sam `paramDefs`, `defaults`, `_meta.kolumny` w
   `gra/data/civ-matrix.json` PRZED (via `git show HEAD:gra/data/civ-matrix.json`)
   i PO (working tree) — potwierdź 113→109, 0 wystąpień 4 usuniętych ID,
   60 usuniętych komórek, brak osieroconych kluczy w żadnym z 15 wierszy.
2. `git diff HEAD -- gra/data/civ-matrix.json` — sprawdź RĘCZNIE, że jedyna
   zmieniona (nie usunięta) linia to `"kolumny"`; jeśli znajdziesz jakąkolwiek
   inną zmodyfikowaną wartość (nie samo usunięcie klucza) — to FAIL.
3. `cd gra && npx tsc --noEmit` — uruchom sam, potwierdź PASS.
4. Uruchom oba pliki testowe sam (`node gra/tools/civ-matrix-semantic-labels-test.cjs`,
   `node gra/tools/civ-matrix-meta-roster-wiring-test.cjs` lub odpowiedni sposób
   ich odpalenia — sprawdź nagłówek pliku) — potwierdź dokładne liczby PASS/FAIL,
   porównaj z zadeklarowanymi 309/309 i 63/63.
5. `git diff --check` — czyste?
6. Sprawdź czy diff obejmuje WYŁĄCZNIE 4 pliki z allowlisty — żadnych innych
   zmian w working tree spoza `dyspozycje/autobot/runs/...` (nowe pliki
   raportowe są oczekiwane, nieśledzone).
7. Zweryfikuj listę plików "poza allowlistą, tylko zgłoszone" (grep sam,
   nie ufaj liście Operatora) — potwierdź że żaden z nich nie jest
   importowany przez `gra/src/**` ani `gra/tools/**` (czyli faktycznie nie
   wpływa na runtime/testy).
8. Sprawdź `git log` na tym branchu — potwierdź że NIE ma nowego commitu
   poza `b00cfaef` (Operator nie scommitował swojej pracy, zgodnie z
   ACCEPTANCE punkt 5 z 00-dispatch.md Operatora) i że nie było
   push/merge/deploy.

## WERDYKT

STATUS: PASS | PASS-WITH-NOTES | FAIL — z numerowanymi zarzutami jeśli FAIL
lub PASS-WITH-NOTES. Zapisz `02-evaluator.md` + `02-evidence.json` w tym samym
katalogu runs. Nie edytuj żadnego pliku produkcyjnego — jesteś recenzentem,
nie naprawiaczem. Jeśli znajdziesz błąd, opisz go precyzyjnie (plik, linia,
dokładna rozbieżność) zamiast go naprawiać.

## NEXT PHASE

Jeśli PASS/PASS-WITH-NOTES bez zarzutu blokującego → pomiń Obronę, przejdź
prosto do Final Control. Jeśli FAIL lub zarzut blokujący → Obrona (Operator
odpowiada na numerowane zarzuty), potem ponowna ocena.
