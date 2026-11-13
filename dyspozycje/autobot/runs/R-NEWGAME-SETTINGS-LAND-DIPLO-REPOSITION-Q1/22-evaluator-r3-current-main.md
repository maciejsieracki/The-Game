# Niezależny Evaluator R3 — układ ustawień na bieżącym `main`

**Werdykt: PASS-WITH-NOTES. Etap 6/11 zaliczony; Final Control może pozostać
PASS-WITH-NOTES.** Ewaluowałem selektywną poprawkę w aktualnym worktree integracyjnym,
bez zmian produktu i bez commitowania.

## Baza i stan integracji

- Bieżący HEAD integracyjny: `e84d4328` (`fix(ai): advance gathered campaign armies on turn six`).
- Baza testu negatywnego przed zmianą ustawień: `6abc4ed3`.
- Candidate Operatora: HEAD `96ea946c`; jego merge-base z `6abc4ed3` to `2a2180bb`.
- Na bieżącym `main` selektywna poprawka jest jeszcze w working tree. Zmiany dotyczą
  `gra/src/ui/newGameFlow.ts`, `gra/tools/newgame-settings-layout-reposition-test.cjs`
  i `gra/tools/newgame-adv-tooltip-test.cjs`; tracker jest osobno zmieniony przez
  orkiestrację.

## Testy niezależne

- Negative control: uruchomiłem focused Chromium test z
  `GAME_ROOT=/workspace/ai-campaign-assault-operator/gra` (czysty HEAD `6abc4ed3`).
  Oczekiwany exit 1 nastąpił na braku bramki ofert w dawnym slocie trudności
  miast-państw.
- Candidate layout: `node tools/newgame-settings-layout-reposition-test.cjs` na
  gałęzi Operatora — Chromium PASS. Potwierdza dokładne sloty 5 i 7, ustawienia w
  Advanced, zmianę wartości, zamknięcie/ponowne otwarcie oraz parametry startowe.
- Current-main layout: ten sam test w bieżącym worktree `main-integration-20261029`
  — Chromium PASS.
- Candidate tooltip przez loopback HTTP: `node tools/newgame-adv-tooltip-test.cjs`
  — **31/31 PASS**, w tym tooltip trudności miast-państw w Advanced, brak duplikatu
  bramki ofert w Advanced, brak błędów konsoli oraz mutacyjna kontrola zakresu.
- Current-main tooltip przez loopback HTTP — **31/31 PASS**.
- `npm run typecheck -- --pretty false`, `node --check` obu testów i
  `git diff --check` — PASS.

## Zakres i uwagi integracyjne

Potwierdzony układ: `deals_end_turn_gate` zajmuje szósty slot dawnej trudności
miast-państw; `landFraction` zajmuje ostatni slot dawnej wojny epoki; trudność
miast-państw i przełącznik wojny epoki są dostępne w Advanced. Focused test
potwierdza, że zmiany przechodzą do parametrów gry i utrzymują się po ponownym
otwarciu kreatora.

Nie wolno scalać całej gałęzi Operatora. Ma ona merge-base `2a2180bb`, a nie bieżący
`main`; jej pełny diff zawiera liczne historyczne różnice niezwiązane z tą poprawką.
Porównanie dotkniętego `newGameFlow.ts` z aktualnym main pokazało też, że candidate
cofa już zatwierdzone etykiety bitwy do „Ręczna / Automatyczne”. W main zachowano
zatwierdzone etykiety „Bitwa ręczna i automatyczna / Bitwa automatyczna”; przy
integracji należy przenieść wyłącznie hunki ustawień i testów, bez nadpisywania
tych etykiet.

Niezależna kontrola potwierdza zachowanie na bieżącym main po selektywnym przeniesieniu.
Final Control raportuje PASS-WITH-NOTES; następny etap to commit wyłącznie poprawki i
raportów, a potem standardowa kontrola Roboczej oraz push/readback. W tej ewaluacji
nie wykonałem commitu, deployu ani pushu.
