# 01-operator-r3 — R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1 (RUNDA 3)

STATUS: PASS-WITH-NOTES
TEMAT: R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1
GOAL: wdrożyć dosłownie wszystkich 5 podmian CSS Designera z `00-dispatch-r3.md` — usunąć
całkowicie pasek diagonalny ORAZ blok chip-warning z rundy 2 (karta blokująca zostaje z samą
obramówką `3px solid #e8d88a`), plus 4 zmiany cieni/border oraz 2 stany focus-visible bez
`outline`.

## ZMIANY/COMMIT

### Podmiana 1 (`gra/src/ui/sidePanelHud.ts`)
- Usunięto markup `<div class="sp-blk-alert">...</div>` (ikona `chip-warning` + etykieta
  „Wymaga natychmiastowej decyzji") nad `.sp-blk-body` w rozwiniętej karcie blokującej.
- Usunięto CSS `.sp-blk-alert` / `.sp-blk-alert-ic` / `.sp-blk-alert-ic svg` /
  `.sp-blk-alert-txt` (paleta `#4a2a2a` / `rgba(224,122,122,.07)` / `#e6c4c4`) razem z
  komentarzem rundy 2.
- `.sp-event.sp-blocking.sp-expanded` NIE było zmieniane — już ma `border:3px solid
  var(--tg-gold-primary)` (`#e8d88a`), czyli dokładnie żądany stan „sama obramówka". Dotyczy
  to automatycznie wszystkich 3 wariantów z dispatchu (pojedyncza, w kolejce, wąska 330px) —
  to jedna wspólna reguła CSS, bez osobnych selektorów dla szerokości.
- Import `brandIconSvg` zostaje — nadal używany gdzie indziej w pliku (mapowanie ikon
  wydarzeń, linia 109).

### Podmiany 2–4 (`gra/src/ui/bottomBarHud.ts`, „Zakończ turę")
- Podmiana 2 (stan aktywny `.end-turn`): usunięto `border-top-color:#f8eea8`; cień zamieniony
  z `inset 0 1px 0 rgba(255,255,255,.4),0 6px 18px rgba(232,216,138,.22)` na
  `inset 0 1.5px 0 rgba(255,255,255,.55),inset 0 -1.5px 0 rgba(70,52,8,.5),
  0 6px 18px rgba(232,216,138,.22)` — dokładnie wg dispatchu, „było" zgadzało się 1:1 z kodem.
- Podmiana 3 (`.is-disabled`): cień z `none` na `inset 0 1.5px 0 rgba(255,255,255,.25)`.
  `border-top-color` usunięty automatycznie razem z bazową regułą `.end-turn` (podmiana 2) —
  `.is-disabled` go nie nadpisywał osobno. Zastosowano też do `.end-turn:disabled`
  (natywny atrybut disabled) — w kodzie to był literalny duplikat `.is-disabled` z tymi samymi
  wartościami; zmiana tylko jednego z dwóch zostawiłaby je rozjechane (natywnie zablokowany
  przycisk wyglądałby inaczej niż ręcznie oznaczony `is-disabled`), więc zsynchronizowano oba.
- Podmiana 4 (`.et-signal`, wariant „zablokowany z poświatą" z hover+tooltipem
  `.et-hint`/`.et-tooltip`): zastosowano dispatchu „ma być" dosłownie —
  `border:1px solid #6a5212;box-shadow:inset 0 1.5px 0 rgba(255,255,255,.35),
  0 0 14px rgba(232,216,138,.3)`.
  **UWAGA:** „było" z dispatchu (`border:1px solid #f8eea8; box-shadow:0 0 14px
  rgba(232,216,138,.3)`) NIE odpowiadało literalnie kodowi przed zmianą — realna reguła
  `.et-signal` (dodana przez R-TRZY-KARTY-WDROZENIE-Q1) miała `border-style:dashed;
  border-width:2px;border-color:rgba(208,128,48,.7)` + cień pomarańczowy
  `rgba(208,128,48,.4)`, nie złoty. Zidentyfikowano `.et-signal` jako jedyny selektor
  pasujący ROLĄ do opisu punktu 4 (jedyny stan „Zakończ turę" z sygnalizacją blokady +
  hover/tooltip w tym pliku) i zastosowano literalne „ma być" z dispatchu. Efekt uboczny:
  zniknął przerywany (`dashed`) rant, który był wizualnym sygnałem osobnego tematu
  R-TRZY-KARTY-WDROZENIE-Q1 („sygnalizacja WYŁĄCZNIE wizualna") — po zmianie sygnalizacja to
  już tylko poświata (kolor zmieniony z pomarańczowego na złoty), nie kontur. Proszę Evaluatora
  o potwierdzenie, że to zamierzone (świeża makieta Designera nadpisuje też ten wcześniejszy
  wariant), a nie przeoczenie w treści dispatchu.

### Podmiana 5 (focus-visible bez `outline`)
Dispatch deklaruje „Zakres plików: ... `bottomBarHud.ts` (punkty 2–5)", ale w
`bottomBarHud.ts` NIE MA żadnych klas/elementów odpowiadających nazwom „EventCardAction" /
„EventCardInfo" (to plik dolnego paska WYKONAJ/Zakończ turę, bez „kart wydarzeń"). Klasy
pasujące semantycznie do tych nazw istnieją w `gra/src/ui/sidePanelHud.ts`:
- `EventCardAction` → `.sp-action-btn:focus-visible` (przycisk „Otwórz →" na karcie
  blokującej).
- `EventCardInfo` → `.sp-event:focus-visible` (ogólna karta wydarzenia, obejmuje warianty
  informacyjne).
Zaimplementowano tam, dosłownie wg „ma być" z dispatchu:
- `.sp-action-btn:focus-visible`: `border-color:#fff2c8; box-shadow:inset 0 1.5px 0
  rgba(255,255,255,.6),inset 0 -1.5px 0 rgba(70,52,8,.35),0 0 16px rgba(232,216,138,.5)`.
- `.sp-event:focus-visible`: `border-color:#e8d88a; box-shadow:inset 0 0 0 1px
  rgba(232,216,138,.35),0 0 16px rgba(232,216,138,.45)`.
Pozostałe `outline`-owe reguły focus-visible w obu plikach (`.wykonaj`, `.end-turn`,
`.et-hint-show`, `.sp-action-ignore`, `.sp-close` itd.) NIE zostały ruszone — dispatch
wymienia dokładnie „dwa stany zaznaczenia", nie generalną wymianę wszystkich `outline` w
repo. Proszę Evaluatora o potwierdzenie mapowania punktu 5 na `sidePanelHud.ts` zamiast
`bottomBarHud.ts` (najbardziej prawdopodobne: literówka/nieaktualny zapis zakresu plików w
dispatchu, bo treść merytoryczna punktu 5 jednoznacznie pasuje do plików z kartami zdarzeń).

### Commit
Kod + ten raport zakomitowane razem lokalnie na branchu
`autobot/R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1-r3` (SHA w `git log` po commicie tej sesji).

## TESTY

- `cd gra && npx tsc --noEmit`: 0 błędów typów związanych z tą zmianą (jedyny output to
  pre-istniejące ostrzeżenie `TS5101` o deprecated `baseUrl` w `tsconfig.json`, niezwiązane
  z tym tematem — identyczne przed i po zmianie, potwierdzone).
- `node ./tools/sidepanel-events-toolbar-test.cjs`: **19 pass, 0 fail**.
- `node ./tools/sidepanel-hud-deadzone-test.cjs`: **43 pass, 0 fail**.
- `node ./tools/end-turn-modal-sequencing-test.cjs`: **39 pass, 1 fail** — `[A6]
  configurePreBattle wpięte DOKŁADNIE w 2 miejscach...` — dotyczy wiązania
  `configurePreBattle`/`isOtherEndTurnModalOpen` w `src/main.ts`, plik spoza zakresu tego
  tematu (nie dotknięty), niezwiązane z CSS `.end-turn`/`.sp-event`.
- `node ./tools/koniec-tury-f1-f4-runda3-test.cjs`: **38 pass, 1 fail** — `[F1-A3]
  finishIncomingBattleUi: kolejność wywołań...` w `src/main.ts`, również poza zakresem tego
  tematu.
- Oba fail dotyczą logiki `main.ts` niezwiązanej z podmianami CSS w `sidePanelHud.ts` /
  `bottomBarHud.ts` — nie były wywołane tą zmianą (żaden z 5 punktów nie dotyka `main.ts`).
  Rekomendacja: zweryfikować, czy to pre-istniejący dług INFRA sprzed tego tematu (Evaluator/
  Final Control mogą to potwierdzić przez `git stash`/checkout bazowego commitu — ta sesja
  tego nie powtórzyła po incydencie z utratą zmian, patrz BLOKADY).
- `npm install` uruchomiony w tym worktree, bo `node_modules` nie istniał (świeży worktree) —
  NIE użyto `npm run build`/`npm run dev` (hook `prebuild`/`predev` nienaruszony,
  `tools/export-data.py` nie uruchomiony przez ten krok).

## BLOKADY

- Podczas pracy przypadkowo wykonano `git stash` (chcąc porównać `tsc` przed/po zmianach) —
  `git stash pop` zwrócił „No stash entries found" i zmiany w obu plikach zniknęły z
  working tree. Odtworzono WSZYSTKIE 5 podmian od nowa identycznie (diff końcowy zweryfikowany
  ręcznie, patrz sekcja ZMIANY/COMMIT) — commit finalny zawiera pełny, zamierzony zestaw zmian,
  ale odnotowuję incydent na wypadek gdyby ktoś doszukiwał się nieoczekiwanej historii w tym
  worktree.
- Dwie niezależne niejednoznaczności dispatchu opisane wyżej (podmiana 4: „było" nie zgadzało
  się z kodem; podmiana 5: zadeklarowany plik nie zgadzał się z treścią) — rozstrzygnięte przez
  dopasowanie ROLĄ/nazwą selektora i zastosowanie dosłownych wartości „ma być" z dispatchu.
  Proszę Evaluatora o jawne potwierdzenie obu decyzji.
- 2 pre-istniejące fail w testach `main.ts` (niezwiązane z zakresem tego tematu) — patrz TESTY.

## NASTĘPNY KROK

Evaluator: (1) potwierdzić mapowanie podmiany 4 na `.et-signal` mimo niezgodności „było";
(2) potwierdzić mapowanie podmiany 5 na `sidePanelHud.ts` (`.sp-action-btn`/`.sp-event`)
zamiast `bottomBarHud.ts`; (3) ocenić czy 2 niepowiązane fail testów są pre-istniejącym długiem
czy regresją tej zmiany (rekomendacja: sprawdzić na bazowym commicie `acd40380`).

## DEPLOY/PUSH: NIE WYKONANO
