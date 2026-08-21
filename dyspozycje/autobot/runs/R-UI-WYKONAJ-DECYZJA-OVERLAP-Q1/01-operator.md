# 01-operator — R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1

STATUS: PASS

TEMAT: R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1

GOAL: gdy blokujący pasek „N karta(-y) wymaga(ją) decyzji" nad przyciskiem „Zakończ turę"
znika po wykonaniu decyzji, elementy w tym obszarze (przycisk „Wykonaj", pasek ostrzeżenia,
przycisk „Zakończ turę") NIE mają na siebie nachodzić/kolidować wizualnie.

## Prawdziwa przyczyna (recon, potwierdzona na kodzie i strukturze DOM)

`gra/src/ui/bottomBarHud.ts` renderował `.et-hint` (pasek „N karta wymaga decyzji...") oraz
`.et-tooltip` jako DZIECI `.et-wrap` — kontenera, który w tym samym markupie owijał WYŁĄCZNIE
przycisk „Zakończ turę". CSS tych elementów: `position:absolute; bottom:calc(100% +
HUD_GAP_PX)` (HUD_GAP_PX = 10px) — czyli pozycjonowane względem NAJBLIŻSZEGO pozycjonowanego
przodka, którym był `.et-wrap`, a nie względem całego stosu `.civ-bottom-bar` (kolejność w
flex-column: `.wykonaj` → `.et-wrap` → `.et-turn-lbl`).

Ponieważ wysokość paska ostrzeżenia (padding 9×10px + ikona + tekst, realnie kilkadziesiąt
px) jest dużo większa niż sam gap (10px) dzielący `.wykonaj` i `.et-wrap`, pasek — mimo
intencji z komentarza w kodzie („siedzi nad CAŁYM stosem WYKONAJ/Zakończ turę") — faktycznie
nachodził na przycisk „Wykonaj" leżący bezpośrednio nad `.et-wrap` w tym samym stosie
(przycisk „Wykonaj" jest renderowany ZAWSZE, także disabled, gdy `blocking=0` — miejsce
zarezerwowane w layoucie, zamierzone, potwierdzone w 00-dispatch.md). Ponieważ `.et-hint`
jest głębszym potomkiem w DOM (wewnątrz `.et-wrap`, po `.wykonaj` w kolejności drzewa),
w domyślnym kontekście stackowania renderuje się NAD `.wykonaj` i go zasłania.

Po wykonaniu blokującej decyzji `blocking` spada do 0, `showBlockSignal` staje się `false`,
`hintHtml=''` — `.et-hint` znika z DOM. To, co widział właściciel jako „pusty wyszarzony
prostokąt WYKONAJ w miejscu paska", to w rzeczywistości zawsze obecny, disabled przycisk
„Wykonaj", który wcześniej był (częściowo) zasłonięty przez nachodzący pasek ostrzeżenia —
po zniknięciu paska po prostu stał się w pełni widoczny w tym samym miejscu.

Nie jest to problem animacji/transition (jedyny `transition` na `.et-hint` to `opacity .12s`
na hover całego widżetu, niezwiązany z tym przejściem stanu) ani problem częstotliwości
`render()` — problem jest czysto strukturalny (zły kontener odniesienia dla
`position:absolute`).

## Naprawa (wyłącznie warstwa wizualna/layout)

`.et-hint` i `.et-tooltip` są teraz renderowane jako BEZPOŚREDNIE dzieci `.civ-bottom-bar`
(który ma `position:fixed`, więc już jest kontekstem pozycjonowania) — PRZED `.wykonaj` w
markupie. `.et-wrap` w markupie owija już WYŁĄCZNIE przycisk „Zakończ turę". Formuła CSS
`bottom:calc(100% + HUD_GAP_PX)` jest niezmieniona — zmienił się wyłącznie DOM-owy rodzic,
więc teraz liczy się od górnej krawędzi CAŁEGO stosu (WYKONAJ + Zakończ turę + etykieta
tury), nie tylko od `.et-wrap` — pasek nigdy nie nachodzi na żaden przycisk w stosie,
niezależnie od własnej wysokości.

Logika wykrywania blokady (`getBlockingCount`, `wykOn`, `showBlockSignal`,
`canPlayerInitiateEndTurn`/klikalność „Zakończ turę") — NIETKNIĘTA, zweryfikowane pinami
tekstowymi w teście (formuły identyczne bajt-w-bajt).

## ZMIANY/COMMIT

Allowlista: `gra/src/ui/bottomBarHud.ts`, `gra/tools/bottom-bar-hud-wykonaj-overlap-test.cjs`
(nowy test), `.gitignore` (2 nowe wpisy dla stubów tego testu, wzorem istniejących bramek).
Brak zmian w `gra/`-niezależnych artefaktach dokumentacyjnych poza tym raportem.
Commit lokalny na branchu `autobot/R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1` (SHA — patrz `git log`
po commicie tego raportu).

## TESTY

- `cd gra && npx tsc --noEmit` — czyste (jedyny output to preexistująca deprecacja
  `baseUrl` w `tsconfig.json`, potwierdzona identyczna PRZED zmianą przez `git stash`/
  `tsc --noEmit`/`git stash pop` — niezwiązana z tym tematem).
- Build weryfikacyjny: `node ./node_modules/vite/bin/vite.js build --outDir <tmp> --emptyOutDir`
  (z `gra/`, node_modules podpięte symlinkiem z głównego repo tylko na czas weryfikacji,
  usunięty po — worktree nie miał własnego `npm install`) — `✓ built in 32.98s`, bez błędów.
- Nowy test `node gra/tools/bottom-bar-hud-wykonaj-overlap-test.cjs`: **33 pass, 0 fail**.
  Bundluje NAPRAWDĘ `src/ui/bottomBarHud.ts` (esbuild + jsdom, stub tylko dla
  `icons/brandAssets`/`brandTokenVars` — Vite `?raw`, esbuild/node tego nie obsłuży).
  Pokrywa: stan blocking>0 (`.et-hint`/`.et-tooltip` bezpośrednimi dziećmi `.civ-bottom-bar`,
  `.et-wrap` zawiera wyłącznie przycisk end-turn), przejście blocking 1→0 na TYM SAMYM
  elemencie (`api.update()` drugi raz — symulacja wykonania decyzji: hint znika, „Wykonaj"
  disabled zostaje pierwszym dzieckiem bez „duchów" po pasku), kontrolę przejścia 0→2
  (pasek wraca poprawnie), pin tekstowy na markup/CSS w kodzie źródłowym, oraz pin na
  niezmienioną logikę wykrywania blokady/klikalności końca tury.
- Skill `run` (uruchomienie gry w przeglądarce) — NIEDOSTĘPNY w tym środowisku (brak takiego
  narzędzia na liście dostępnych skilli/toolboxa tej sesji) — jawnie odnotowane, jak wymaga
  dyspozycja. Wniosek oparty o dokładną analizę DOM/CSS (jsdom nie liczy realnej geometrii
  CSS, więc dowód jest strukturalny na drzewie DOM — przynależność rodzic/dziecko decyduje
  jednoznacznie o kontekście pozycjonowania `position:absolute`, patrz sekcja wyżej) oraz o
  faktyczne zbudowanie strony (`vite build`) potwierdzające brak błędów kompilacji/bundlingu
  dla zmienionego pliku.

## BLOKADY

Brak.

## NASTĘPNY KROK

Evaluator (obieg AutoBot: Operator → Evaluator → Final Control → integracja orkiestratora →
READY_FOR_DEPLOY).

## DEPLOY/PUSH: NIE WYKONANO
