# 00-dispatch (runda 2) — R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1

**Data:** 2026-08-21
**Powód rundy 2:** Ten temat był już raz przerobiony (runda 1, inna gałąź tej samej sesji
orkiestratora) — Operator usunął `.sp-blk-stripe` CAŁKOWICIE, bez zamiennika, opierając się
na recon `empireDetailPanel.ts` (wzorzec tło+border, `.civ-emp-thr.now`). Ta implementacja
przeszła Operator→Evaluator→Final Control (READY_FOR_DEPLOY) na branchu
`autobot/R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1`.

Audyt equalizujący stan z drugą, równoległą sesją (ten sam właściciel, to samo zgłoszenie
głosowe, zarejestrowane NIEZALEŻNIE pod tym samym ID w `REJESTR-PROSB-I-ZADAN.md` na gałęzi
`origin/work/clean-main-2026-08-21`) wykazał, że tamta sesja zapisała BARDZIEJ SZCZEGÓŁOWE
ECHO właściciela: **zastąpić `.sp-blk-stripe` konkretnym assetem `chip-warning.svg`/
wzorcem `.civ-emp-alert` z paczki designu
`docs/ux/claude-design/_dist/11-ZAKLADEK-PANEL-IMPERIUM-2026-08-13/`, NIE usuwać paska
całkowicie.** To sprzeczne z rundą 1 tej sesji. Właściciel zdelegował decyzję o rozstrzygnięciu
do orkiestratora ("Zdecyduj sam, co będzie najlepszym rozwiązaniem, i je wprowadź").

**Decyzja orkiestratora:** bardziej szczegółowe ECHO (konkretny nazwany asset + wyraźny zakaz
całkowitego usunięcia) ma pierwszeństwo nad ogólniejszym wnioskiem z recon rundy 1. Runda 2
zastępuje implementację rundy 1 na tym samym temacie (ten sam ID, NIE nowy temat).

**Izolacja:** branch `autobot/R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1-r2`, oparty o
`origin/work/clean-main-2026-08-21`. Bez push.

## GOAL (zaktualizowany, zastępuje GOAL rundy 1)

Zastąpić diagonalny pasek `.sp-blk-stripe` w `gra/src/ui/sidePanelHud.ts` (CSS + markup nad
rozwiniętą kartą blokującą) wzorcem wizualnym `chip-warning.svg` / `.civ-emp-alert` z paczki
designu panelu imperium (`docs/ux/claude-design/_dist/11-ZAKLADEK-PANEL-IMPERIUM-2026-08-13/`
— sprawdzić `DESIGN-do-UI_11-ZAKLADEK-PANEL-IMPERIUM-2026-08-13.md` i plik `.dc.html` w tym
katalogu za dokładnym kształtem/użyciem `.civ-emp-alert`, jeśli klasa ta tam faktycznie
występuje — jeśli NIE występuje nigdzie w repo pod tą dokładną nazwą, potraktować to jako
nazwę roboczą z ECHO i zbudować odpowiadający, spójny z resztą paczki wzorzec: ikona
`chip-warning` + tło/border w konwencji tej paczki, NIE nowy, wymyślony styl).

**Twardy wymóg z ECHO: NIE usuwać paska całkowicie bez zamiennika** — w przeciwieństwie do
rundy 1. Jeśli po dokładnym recon paczki designu okaże się, że NIE ma tam żadnego wzorca
pasujące do „oznaczenia karty jako blokująca" (np. paczka dotyczy czegoś innego niż karty
zdarzeń), zgłoś to jako BLOCK z jasnym opisem rozbieżności zamiast decydować samodzielnie o
odejściu od ECHO — to jest twardy wymóg właściciela z drugiej sesji, nie rekomendacja.

## Allowlista

- `gra/src/ui/sidePanelHud.ts`
- `gra/src/ui/icons/brand/tokens.css` (jeśli potrzebny nowy token — uzasadnić)
- powiązany test (`gra/tools/sidepanel-events-toolbar-test.cjs`,
  `gra/tools/sidepanel-hud-deadzone-test.cjs` — jeśli asercje dotyczą `.sp-blk-stripe`,
  zaktualizować do nowej klasy/wzorca)
- `dyspozycje/autobot/runs/R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1/`

## Kryteria końca

1. `chip-warning.svg` (albo odpowiadający mu wzorzec z paczki designu) widoczny na
   rozwiniętej karcie blokującej zamiast diagonalnego paska.
2. Pasek/element NIE jest całkowicie usunięty — jest zamiennik.
3. `tsc` czysty, testy z allowlisty PASS (zaktualizowane jeśli odwoływały się do starej klasy).
4. Zero zmian w logice kolejki/dismiss/licznika.

## Model / effort

Operator → Sonnet 5, effort Medium. Evaluator → Sonnet 5, effort High. Final Control →
Sonnet 5, effort High, osobny subagent. Dispatch przez Workflow (Ścieżka A, zgoda właściciela
udzielona w tej sesji).
