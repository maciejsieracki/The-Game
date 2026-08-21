# 03-final-control — R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1

STATUS: PASS

DOMAIN: GAME

TEMAT: R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1

GOAL: gdy blokujący pasek „N karta(-y) wymaga(ją) decyzji" nad przyciskiem „Zakończ turę"
znika po wykonaniu decyzji, elementy w tym obszarze (przycisk „Wykonaj", pasek ostrzeżenia,
przycisk „Zakończ turę") NIE mają na siebie nachodzić/kolidować wizualnie.

## Weryfikacja zakresu (main..HEAD vs merge-base..HEAD)

`git diff main..HEAD -- gra/` na tym worktree pokazuje pozornie szeroki diff (dodatkowo
`sciencePicker.ts`, `techTreeView.ts`, `techUnlockParse.ts`, `tech-unlock-units-test.cjs`).
Zweryfikowane jako artefakt rozjazdu gałęzi, NIE praca tego tematu: `main` zintegrował od
czasu forka tej gałęzi osobny, niepowiązany temat
`R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1` (merge `78ab3c4d`, potwierdzone w
`git log main`). Punkt odniesienia dla tego tematu to `git merge-base main HEAD`
(`71c350f5`), nie bieżący czubek `main`. `git diff 71c350f5..HEAD -- gra/` pokazuje
WYŁĄCZNIE:

```
gra/src/ui/bottomBarHud.ts                        |  24 +-
gra/tools/bottom-bar-hud-wykonaj-overlap-test.cjs | 287 ++++++++++++++++++++++
```

plus `.gitignore` (+5, dwa nowe wpisy stubów bramki, ten sam wzorzec co istniejące) i dwa
pliki runu (`00-dispatch.md`, `01-operator.md`). Zakres 1:1 z dispatchem i allowlistą —
zero dotknięcia `sciencePicker.ts`/`techTreeView.ts`/`techUnlockParse.ts` przez TĘ gałąź.
`main.ts` bajt-w-bajt identyczny między merge-base a HEAD (zweryfikowane `diff`).

## Weryfikacja przyczyny i naprawy

Przyczyna potwierdzona na kodzie: `.et-hint`/`.et-tooltip` były (przed fixem) potomkami
`.et-wrap` (owijającego wyłącznie przycisk „Zakończ turę"), z `position:absolute;
bottom:calc(100% + HUD_GAP_PX)` liczonym względem `.et-wrap`, nie całego stosu — stąd
nachodzenie na zawsze-obecny (disabled gdy `blocking=0`) przycisk „Wykonaj" leżący wyżej w
tym samym stosie flex. Fix przenosi `.et-hint`/`.et-tooltip` na bezpośrednie dzieci
`.civ-bottom-bar` (position:fixed — już kontekst pozycjonowania), PRZED `.wykonaj` w
markupie; `.et-wrap` zostaje z dokładnie jednym dzieckiem (przycisk end-turn). Formuła CSS
`bottom:calc(100% + HUD_GAP_PX)` niezmieniona — zmienił się wyłącznie rodzic DOM, więc teraz
liczy się od górnej krawędzi całego stosu. To jest faktyczna naprawa strukturalna, nie
kosmetyczne maskowanie (np. nie z-index/nie zwiększenie HUD_GAP_PX na sztywno). Logika
wykrywania blokady (`getBlockingCount`, `wykOn`, `showBlockSignal`, klikalność „Zakończ
turę") nietknięta — potwierdzone pinami tekstowymi w teście i przeglądem diffu.

## Testy (uruchomione niezależnie w tym worktree, z tymczasowym symlinkiem `node_modules` z
głównego repo na czas testów, usuniętym po — worktree bez własnego `npm install`)

- `npx tsc --noEmit` — 0 błędów (jedyny output: pre-istniejąca deprecacja `baseUrl` w
  `tsconfig.json`, niezwiązana z tym tematem).
- `node tools/bottom-bar-hud-wykonaj-overlap-test.cjs` — **33 pass, 0 fail**.
- `node tools/end-turn-modal-sequencing-test.cjs` — **39 pass, 1 fail**
  (`[A6] configurePreBattle wpięte DOKŁADNIE w 2 miejscach ... (got 0)`). Zweryfikowane
  NIEZALEŻNIE (nie tylko powtórzone za Evaluatorem): test A6 sprawdza treść `main.ts`, a
  `main.ts` jest bajt-w-bajt identyczny między `merge-base` (`71c350f5`) a `HEAD`
  (`e6808e5f`) — potwierdzone `diff` na `git show`. Awaria jest więc dowodnie
  pre-istniejąca i całkowicie niezwiązana z tym tematem (nie dotyczy `bottomBarHud.ts`),
  nie blokuje tego tematu. Zgadzam się z notatką Evaluatora, że Operator powinien był to
  ująć w TESTY zamiast pominąć — proces, nie blokada tego wdrożenia.
- Bramki referencyjne z `docs/decyzje/R-PROC-AUTOBOT.md` §6, uruchomione dla baseline'u:
  `tools/logic-test.cjs` 213/213, `tools/tech-tree-test.cjs` 19/19,
  `tools/research-test.cjs` 33/33, `tools/unit-replace-test.cjs` 13/13,
  `tools/combat-test.cjs` 6/6 — wszystkie zgodne z wynikiem referencyjnym, zero regresji.
  (`unit-power-test.cjs` pre-istniejąco czerwony i `map-gen-regression-test.cjs`
  pominięte celowo — nie dotyczą tego tematu, zgodnie z §6.)
- `git diff main..HEAD --check -- gra/` — czyste (brak whitespace errors).
- `git status` po testach — czysty working tree (symlink `node_modules` usunięty, nie
  był trackowany).

## Ocena Evaluatora

Zgadzam się z werdyktem `PASS-WITH-NOTES`: notatka o pominięciu
`end-turn-modal-sequencing-test.cjs` w sekcji TESTY Operatora to realna, ale nieblokująca
luka procesowa (nie luka w naprawie). Sugestia dla orkiestratora (osobny temat dla [A6])
zasadna — [A6] to realny, przedtem nieuchwycony problem w `main.ts`/`configurePreBattle`,
poza zakresem tego tematu i tego pliku.

## ZMIANY/COMMIT

Brak nowych zmian kodu od Final Control — wyłącznie ten raport, allowlista
`dyspozycje/autobot/runs/R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1/03-final-control.md`, dopisany na
branchu `autobot/R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1`. Weryfikowany commit: `e6808e5f`.

## TESTY

Patrz sekcja „Testy" wyżej — wszystkie uruchomione niezależnie w tym worktree, wyniki
zgodne z raportem Operatora i notatką Evaluatora.

## BLOKADY

Brak blokad dla tego tematu. Osobno (nie blokuje READY_FOR_DEPLOY tego tematu): [A6] w
`end-turn-modal-sequencing-test.cjs` — pre-istniejący, niezwiązany, warty osobnego
zgłoszenia/tematu R-* przez orkiestratora (zgodnie z sugestią Evaluatora).

## NASTĘPNY KROK

Integracja orkiestratora (merge do `main`, bez merge/push wykonanego przez Final Control) →
`READY_FOR_DEPLOY` po faktycznej integracji.

readyForDeploy: true

## DEPLOY/PUSH: NIE WYKONANO
