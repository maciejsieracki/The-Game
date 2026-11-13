# Obrona (Operator) — R-WEB-EMPIRE-RECRUIT-AFFORDABILITY-SUMMARY-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-EMPIRE-RECRUIT-AFFORDABILITY-SUMMARY-Q1
GOAL: Domknąć kandydata fb6f1885d (origin/codex/recruit-affordability) po zarzutach Evaluatora: live affordability koszyka, zero-capable wiersze poza kosztem/niedoborem, bramki zielone.
KANDYDAT: fb6f1885d (baza 1e48b8282)
ZMIANY-COMMIT: 3e03e2cf6 — tylko `gra/tools/empire-recruit-affordability-test.cjs` (cztery nowe asercje na czystej funkcji `summarizeEmpireRecruitBasket`). Kod produkcyjny nie zmieniony względem fb6f1885d. Raport: ten commit.

## Odpowiedź na zarzuty Evaluatora

1. Luka w pokryciu (brak asercji równości, brak zera zasobu) — PRZYJMUJĘ. Dodano w teście:
   - koszyk dokładnie równy saldu złota i rekrutów jest `affordable` z zerowymi niedoborami (2 × 10 ¤, 2 × 3 rekrutów, 2 × 2 drewna przy puli 20 ¤ / 6 / 4 drewna);
   - koszyk o 1 ¤ za drogi daje `goldShortfall === 1` i brak niedoboru zasobu;
   - linia z zerowym kosztem (3 szt., 0 ¤, 0 rekrutów, bez zasobu) nie dodaje potrzeb i jest affordable przy pustych pulach;
   - linia z `unitStock {zelazo: 0}` przy puli `zelazo: 0` nie tworzy fantomowego niedoboru.
   Dowód: wszystkie 4 asercje PASS w wyjściu testu (poniżej).

2. Szkic ilości wiersza zerowany przy capableCities=0 i nieprzywracany — ZAŁOŻENIE (zostaje). Wiersz bez zdolnego miasta nie jest zamawialny, więc jego szkic jest zerowany w `render`/`syncControls`/`syncAffordability` (`gra/src/ui/empireRecruitPanel.ts`). Odtworzenie szkicu po odzyskaniu zdolności przywróciłoby ukryty wybór, którego gracz nie widział jako aktywnego. Nie dodaję testu przejścia capable→0→capable; brak wpływu na koszt ani wykonanie.

3. Raporty procesu na gałęzi kandydata nieaktualne (01-operator.md „WIP / pending”, 20-evaluator i 50-final-control dotyczą 0b6107782) — ODRZUCAM w tym temacie. Operator ma zapisać wyłącznie `30-obrona-claude.md` (allowlista dispatchu). Raporty 01/20/50 na gałęzi kandydata należą do integracji orkiestratora; nie edytuję ich tutaj.

## Testy (surowe wyniki, uruchomione w tym worktree)

- `node ./node_modules/typescript/bin/tsc --noEmit` — exit 0 (bez wyjścia).
- `node tools/empire-recruit-affordability-test.cjs` (`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`) — **17 passed, 0 failed**, exit 0. Przypadki dodane: exact-equal, over-by-1, zero-cost, zero-stock pool.
- Mutant `EMPIRE_RECRUIT_AFFORDABILITY_MUTANT=allow-queued-only` — **16 passed, 1 failed**, exit 1; wyłapany FAIL: „queued-only row stays visible but quantity, plus, minus and Recruit are disabled” (oczekiwany).
- `node tools/empire-recruit-plan-test.cjs` — **17 passed, 0 failed**.
- `node tools/unit-epoch-cost-test.cjs` — **57 passed, 0 failed**.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium node tools/empire-recruit-all-test.cjs` — **31 passed, 0 failed**.
- `git diff --check` — czysto przed commitem.
- Nie uruchamiano `empire-recruit-live-test.cjs` ponownie: wynik 20/23 (L16–L18) jest zgodny z bazą 1e48b8282 według raportu Evaluatora i nie zmienił się w kodzie produkcyjnym tej rundy (diff 3e03e2cf6 vs fb6f1885d: wyłącznie plik testu).
- Bramki logic/tech-tree/research/unit-replace/combat z listy referencyjnej nie były powtarzane w tej rundzie (kod produkcyjny bez zmian w tej rundzie) — NIE_ZMIERZONO w tej rundzie.

## Zgodność z allowlistą i zasadami

- Commit 3e03e2cf6 zawiera wyłącznie `gra/tools/empire-recruit-affordability-test.cjs`.
- Brak `git add -A`, brak zmian w `WERSJE.md`, `gra-robocza/**`, `KANON/FINALNA`.
- Brak `npm run build`/`dev`; `npm ci --ignore-scripts` w `gra/`, build nie wykonywany.
- Brak integracji, deployu i push na main.

## BLOKADY

Brak blokad technicznych. Poza zakresem tego tematu: dług bazowy live 20/23 (L16–L18) — istniał przed kandydatem.

## RUNDY

1/5 (obrona po zarzutach Evaluatora).

## NASTĘPNY KROK

Evaluator/Final Control na 3e03e2cf6 (kod produkcyjny = fb6f1885d). Orkiestrator przy integracji uzupełnia raporty 01/20/50 na gałęzi kandydata (zarzut 3).

DEPLOY/PUSH: NIE WYKONANO
