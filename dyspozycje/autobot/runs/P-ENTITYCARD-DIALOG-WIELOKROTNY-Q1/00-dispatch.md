TEMAT: P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME (UI)
ŚCIEŻKA: gra/src/ui/entityCards/renderer.ts (+ ewentualnie gra/src/ui/entityCards/types.ts,
wyłącznie jeśli GOAL tego wymaga)
MODEL+EFFORT: claude-sonnet-5, effort high

WYZWALACZ (zgłoszenie właściciela, 2026-09-03, ze zrzutami ekranu)
"Dopiero jak wyłączę kartę technologii, to wtedy się włącza [poprzednia]. Chodzi o to, żeby
nie wszystkie włączały się naraz, tylko ta, którą się kliknie, aby pojawiła się obok, a gdy
kliknie się inną kartę lub inny przycisk, powinna zniknąć i pojawić się nowa."
Zrzuty pokazują: karta technologii "Garncarstwo" otwarta jako dialog; klik na link "Cegielnia"
wewnątrz tej karty otwiera NOWY dialog karty budynku NAD poprzednim — poprzedni (Garncarstwo)
nie znika, staje się widoczny dopiero po zamknięciu nowszego (Cegielnia).

RECON (wykonane przez orkiestratora — nie powtarzaj, zweryfikuj i buduj na tym)
`openDialog()` w `gra/src/ui/entityCards/renderer.ts:439-461` przy KAŻDYM wywołaniu tworzy
NOWY, niezależny `<div class="entity-card-backdrop">` i dołącza go do `document.body` —
nigdy nie zamyka wcześniej otwartego dialogu encji. `pushOverlay`/`popOverlay`
(`gra/src/ui/escapeOverlayStack.ts:85-103`) zarządzają WYŁĄCZNIE stosem klawisza Escape
(zamykanie od wierzchu klawiszem Escape) — nie wymuszają unikalności ani nie zamykają starszych
wpisów przy dodaniu nowego. Wszystkie realne call site'y w kodzie wołają
`openEntityCard(kind, id, { mode: 'dialog' })` (grep: `gra/src/ui/buildModeHud.ts`,
`gra/src/ui/cityPanel.ts`, `gra/src/ui/techDiscoveryNotice.ts`, oraz z WEWNĄTRZ innej karty —
`renderer.ts:433`, link do powiązanej encji) — każde z nich, wywołane gdy inny dialog jest już
otwarty, dokłada kolejny backdrop zamiast go zastąpić. Tryby `inline`/`hover` (funkcje
`openInline`/`openHover`, linie 463-504) NIE są dziś używane przez żaden realny call site
(wszystkie `mode: 'dialog'`) — GOAL tej rundy dotyczy WYŁĄCZNIE trybu `dialog`.

GOAL
Dokładnie JEDEN dialog karty encji (`entity-card-dialog`/`entity-card-backdrop`) może być
otwarty na raz w całej grze. Otwarcie nowego dialogu (`openEntityCard(..., {mode:'dialog'})`,
niezależnie skąd wywołane — z HUD-u, z panelu miasta, czy z linku WEWNĄTRZ innej już otwartej
karty) MA automatycznie zamknąć poprzednio otwarty dialog encji PRZED (lub w tej samej klatce
co) otwarciem nowego — bez migotania, bez widocznego nakładania się dwóch backdropów nawet na
ułamek sekundy. Zamknięcie dialogu przez X/Escape/klik-w-tło działa jak dziś (bez regresji).
Tryby `inline`/`hover` — bez zmian (poza zakresem, nieużywane produkcyjnie dziś).

KRYTERIA KOŃCA (binarne)
1. Otwarcie dialogu A, następnie (bez zamykania A) otwarcie dialogu B z linku WEWNĄTRZ A →
   po otwarciu B, dialog A nie istnieje już w DOM (`document.querySelectorAll
   ('.entity-card-backdrop').length === 1`), widoczny jest wyłącznie B.
2. To samo dla dwóch dialogów otwartych z DWÓCH RÓŻNYCH, niepowiązanych miejsc w UI (np.
   `buildModeHud.ts` i `cityPanel.ts`) — kolejność otwarcia nie ma znaczenia, zawsze ostatnio
   otwarty wygrywa i jest jedynym obecnym w DOM.
3. Zamknięcie jedynego otwartego dialogu (X, Escape, klik w tło) nadal poprawnie usuwa go z DOM
   i z `escapeOverlayStack` — zero regresji istniejącego zachowania zamykania.
4. Otwarcie tego samego dialogu dwa razy pod rząd (ten sam kind+id) nie tworzy duplikatu ani nie
   psuje stanu (idempotentne zachowanie, analogicznie do dzisiejszego `pushOverlay` z tym samym
   `id`).
5. `tsc --noEmit` czysty, żywy test Chromium (Playwright, wzorem istniejących
   `*-real-render-test.cjs`/`*-live-test.cjs` w `gra/tools/`) potwierdzający kryteria 1-4 na
   faktycznie wyrenderowanej stronie (zrzut DOM przed/po, nie tylko odczyt kodu źródłowego), plus
   5 bramek referencyjnych zielone (logic-test, tech-tree-test, research-test, unit-replace-test,
   combat-test).

ALLOWLISTA (nic poza tym)
- gra/src/ui/entityCards/renderer.ts (główna zmiana — `openDialog()`, ew. moduł-level stan
  śledzący aktywny dialog).
- gra/src/ui/entityCards/types.ts — WYŁĄCZNIE jeśli GOAL wymaga rozszerzenia typu
  `EntityCardDismiss`/`OpenEntityCardOptions` (mało prawdopodobne, zmiana lokalna w rendererze
  powinna wystarczyć — jeśli okaże się niepotrzebna, nie dotykaj tego pliku).
- Nowy test w gra/tools/*-test.cjs (żywy Playwright, analogiczny do istniejących
  `*-real-render-test.cjs`).
Zakazane bezwzględnie: `gra/src/ui/escapeOverlayStack.ts` (współdzielony mechanizm poza tym
tematem — zmiana tam ryzykuje regresję w INNYCH, niepowiązanych nakładkach mapy, np. panelach
budowy/dyplomacji; jeśli Operator uzna zmianę tam za konieczną, zatrzymaj się z DECISION_REQUIRED
zamiast modyfikować na własną rękę), `gra/src/ui/buildModeHud.ts`, `gra/src/ui/cityPanel.ts`,
`gra/src/ui/techDiscoveryNotice.ts` (call site'y — GOAL ma być spełniony WYŁĄCZNIE zmianą w
`renderer.ts`, bez dotykania miejsc wywołania), `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

IZOLACJA
worktree /home/user/wt-entitycard-dialog-wielokrotny, gałąź
autobot/P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1, baza jawnie: origin/main (najnowszy commit na
moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona kompilacja to
node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania tego tematu wizualnego/DOM za zamknięty bez zrzutu z ŻYWEGO Chromium (Playwright)
pokazującego DOM przed i po drugim otwarciu — sam odczyt kodu źródłowego (bez uruchomienia w
przeglądarce) NIE jest dowodem naprawy. Test musi też wykazać, że przed naprawą (na kodzie
sprzed zmiany, np. przez `git stash`) faktycznie odtwarza dwa jednoczesne backdropy w DOM — inaczej
test jest tautologiczny i nie dowodzi niczego.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora.
