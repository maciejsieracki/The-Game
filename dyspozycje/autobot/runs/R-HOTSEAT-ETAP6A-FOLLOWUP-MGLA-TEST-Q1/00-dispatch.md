STATUS: DISPATCH
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP6A-FOLLOWUP-MGLA-TEST-Q1
GOAL: Naprawić 2 nowe FAIL w `gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs`
wprowadzone przez integrację `R-HOTSEAT-ETAP6A-INPUT-Q1` (commit `4e7a5491`, zintegrowany
do main) — bramka hardkoduje literał `ownerId === 0` we WŁASNYM regexie/parserze,
podczas gdy `main.ts` po Etapie 6a używa w tych miejscach `isMe(ownerId)`. To NIE jest
regres logiki gry — main.ts działa poprawnie (potwierdzone przez Operator+Evaluator+Final
Control Etapu 6a niezależnie), tylko test sam sprawdza literalny tekst źródła zamiast
zachowania.

KONTEKST — PRZECZYTAJ PRZED ZMIANĄ:
- Final Control Etapu 6a (`dyspozycje/autobot/runs/R-HOTSEAT-ETAP6A-INPUT-Q1/03-final-control-runda1.md`,
  punkt BLOKADY (1)) już zdiagnozował dokładną przyczynę: hardkodowany literał w
  regexie testu na liniach ok. `188`/`202` PLIKU TESTOWEGO (nie main.ts) — zweryfikuj
  świeżo dokładne linie i treść, main.ts mógł się przesunąć od tego czasu.
- Uruchom `node gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs` na czystym `origin/main`
  PRZED zmianą — potwierdź dokładnie 2 FAIL i ich treść (nie zgaduj z raportu Final
  Control, zweryfikuj świeżo).

ZADANIE:
1. Zlokalizuj dokładny fragment testu odpowiedzialny za FAIL (parsowanie/regex
   szukający `ownerId === 0` albo podobnego literalnego wzorca w źródle `main.ts`).
2. Zaktualizuj test tak, żeby rozpoznawał ZARÓWNO stary wzorzec (`ownerId === 0`) JAK I
   nowy (`isMe(ownerId)`/`isMe(...)`) — albo, jeśli test sprawdza faktyczne ZACHOWANIE
   gry (nie tekst źródła), zamień sprawdzanie tekstu na sprawdzanie zachowania (wolisz
   podejście behawioralne, jeśli to możliwe bez większej przebudowy testu — jeśli
   wymagałoby to dużej przebudowy, prostsza łatka regexu jest akceptowalna).
3. Potwierdź: `node gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs` daje 15/15 (albo
   pełną liczbę testów tego pliku) PASS po poprawce.
4. Uruchom też 5 bramek referencyjnych (`logic-test`, `tech-tree-test`, `research-test`,
   `unit-replace-test`, `combat-test`) — muszą pozostać zielone (nie powinny być
   dotknięte tą zmianą, ale potwierdź).
5. `tsc --noEmit` czysty (test jest plikiem `.cjs`, ale sprawdź czy coś importuje typy).

BINARNE KRYTERIUM SUKCESU: `mgla-odkrycie-wzdluz-sciezki-test.cjs` przechodzi w całości
(0 FAIL) na dzisiejszym `main.ts` (po Etapie 6a), 5 bramek referencyjnych zielone, zero
zmian w `gra/src/**` (to jest naprawa TESTU, nie kodu gry).

ALLOWLISTA:
- `gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs` (WYŁĄCZNIE ten plik)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6A-FOLLOWUP-MGLA-TEST-Q1/*`
Zakaz `git add -A`. Zakaz jakichkolwiek zmian w `gra/src/**` — to jest naprawa bramki
testowej, nie kodu gry (main.ts po Etapie 6a jest poprawny, zweryfikowany trzykrotnie).

IZOLACJA: worktree `/home/user/wt-hotseat-etap6a-followup-mgla`, gałąź
`autobot/R-HOTSEAT-ETAP6A-FOLLOWUP-MGLA-TEST-Q1`, baza `origin/main` @ `550014be`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli Evaluator zwraca
NIEPUSTĄ listę zarzutów — zawsze wymagana runda Obrony przed kolejnym Evaluatorem
(R-PROC-AUTOBOT.md §3c).

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — DOMAIN: INFRA (naprawa narzędzia testowego, nie gry), ale wciąż kod, więc
Final Control wymagany.
DEPLOY/PUSH: NIE WYKONANO
