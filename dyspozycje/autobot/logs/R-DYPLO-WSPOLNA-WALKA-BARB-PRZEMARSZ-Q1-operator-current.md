# Raport Operatora — `R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1`

STATUS: READY_FOR_EVALUATOR
TEMAT: R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1
OPERATOR: Luna High
BAZA: `9e576da2048eb2f2083e0c5684ae01c66ff8d6eb`
WORKTREE: `_worktrees/R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1-operator-current`
COMMIT: `936eaf2ee6dd9e64c3795c1b810deb8092ba105b`

## GOAL

Gotowy do niezależnej oceny kontrakt wspólnej walki z barbarzyńcami i wojskowego
przemarszu: pełna obustronność, 3 tury, promień 2 heksów, kwalifikowane aktywne
jednostki lądowe oraz blokada ponownego użycia jednostki podczas bieżącej walki.

## ZAKRES I ZMIANY

- `gra/src/types/diplomacy.ts` — nowy rodzaj dealu `wspolna_walka_barbarzyncy`.
- `gra/src/game/diplomacy-treaties.ts` — pole kontraktu, wykrywanie obustronne,
  wygasanie i zerwanie przez wojnę.
- `gra/src/game/diplomacy-border-march.ts` — wojskowy przemarsz autoryzowany
  w obu kierunkach przez ten kontrakt.
- `gra/src/game/diplomacy-proposals.ts` — zawarcie z terminem 3 tur oraz obsługa
  akceptacji ścieżki gracz/AI; wariant wymaga wojskowego przemarszu.
- `gra/src/ui/diplomacyTradeBasket.ts` i `gra/src/ui/diplomacyNegotiationModal.ts` —
  checkbox wspólnej walki przy traktacie przemarszu i przeniesienie payloadu.
- `gra/src/game/diplomacy-barbarian-cooperation.ts` — czyste reguły promienia,
  kwalifikacji i merge rosteru.
- `gra/src/main.ts` — dołączanie partnerów do walk z barbarzyńcami oraz blokada
  jednostek w trwającej bitwie; zwykłe walki cywilizacja–cywilizacja bez zmiany.
- `gra/src/game/diplomacy-display.ts` — etykieta dealu.
- `gra/tools/diplomacy-barbarian-cooperation-test.cjs` — regresja kontraktu.
- `docs/decyzje/R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1.md` — aktualne ECHO
  właściciela; wcześniejsze 1A/2A/3A oznaczone jako historyczne.

## ZASADY ZAIMPLEMENTOWANE

- 1B/2A/3B: długość tego wdrożenia 3 tury, pełna obustronność, natychmiastowe
  wygaśnięcie autoryzacji po terminie bez teleportowania jednostek.
- 8B/9A/10B: promień 2 heksów; tylko aktywne lądowe jednostki bojowe; bez
  zwiadowców, cywilów, garnizonów, zaokrętowanych i oblężonych;
  jednostka w aktywnej bitwie jest pomijana do jej zakończenia.

## TESTY

- `node tools/diplomacy-barbarian-cooperation-test.cjs`: **9 passed, 0 failed**.
- `node tools/diplomacy-treaties-test.cjs`: **17/17 PASS**.
- `node tools/diplomacy-border-march-test.cjs`: **43/43 PASS**.
- `node node_modules/typescript/bin/tsc --noEmit`: **BLOCKED przez istniejące
  błędy bazy** (brak `three`, błędy `filePlayer.ts`/rendererów); brak błędów w
  zmienionych plikach mechaniki po odfiltrowaniu błędów bazowych.

## BLOKADY

- Niezależna ocena Evaluatora i Final Control jeszcze nie wykonana.
- Nie wykonano deployu ani pushu.
- Worktree zawierał wcześniejsze, niezwiązane modyfikacje w
  `gra/tools/.stubs/*`; nie zostały dotknięte ani nie należą do allowlisty tego tematu.

## NASTĘPNY KROK

Evaluator Luna High ma sprawdzić SCOPE, obustronność, termin, save/load, obie
strony walki z barbarzyńcami, przypadki negatywne i faktyczny diff. Po PASS
uruchomić Final Control Luna High. Integracja i `READY_FOR_DEPLOY` pozostają po
stronie orkiestratora; deploy/push nie wykonano.

DEPLOY/PUSH: nie wykonano.
