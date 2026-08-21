STATUS: PASS
TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1
GOAL: Faza 1 z 6 (patrz docs/decyzje/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1.md) — osobna,
zawsze widoczna ikonka informacyjna „ⓘ" na węzłach/ikonach technologii w hubie badań
(`scienceHubHud.ts`, `techTreeView.ts`), niezależna od kliknięcia całego wiersza/węzła
(własny `stopPropagation()`, woła tę samą funkcję `showTechDiscoveryNotice(..., kind:'preview')`
co dziś otwiera kartę), oraz zamiana martwej `techIconHintSpan()` w `cityPanel.ts` na klikalny
link do tej samej karty podglądu. Klik całego wiersza/węzła pozostaje bez zmian.

ZMIANY/COMMIT:
- gra/src/ui/scienceHubHud.ts — `buildEntryRow()`: dodano `.sh-info-ic` (ⓘ), pozycjonowane
  absolutnie w rogu istniejącej ikonki `.sh-ico` (nie koliduje z layoutem wiersza — `+PLAN`
  i numer-w-planie zostają bez zmian). Własny `click`/`keydown` z `stopPropagation()`, woła TĘ
  SAMĄ funkcję `act()` co klik całego wiersza — brak duplikacji logiki otwierania karty. Klik
  reszty wiersza (`row.addEventListener('click', act)`) niezmieniony.
- gra/src/ui/techTreeView.ts — węzły `.civ-ttv-tn`: dodano `.ttv-info-ic` (ⓘ) w rogu ikonki
  `.ti`, nie koliduje z istniejącymi odznakami `.pl` (góra-lewo) / `.st` (góra-prawo). Klik
  delegowany na `vp` — wydzielono wspólną funkcję `openTechPreview(node, st)` używaną przez
  nowy branch dla `.ttv-info-ic` (z `e.stopPropagation()`, wczesny `return`) ORAZ przez
  dotychczasową ścieżkę całego węzła (bez zmian w warunkach `st==='lk'|'ip'|'od'|'av'`). Dodano
  też delegowany `keydown` (Enter/Space) dla nowej ikonki (a11y — węzeł jako całość nie miał i
  nadal nie ma klawiaturowej obsługi, zgodnie z zakresem — bez rozszerzania poza samą ikonkę).
- gra/src/ui/cityPanel.ts — `techIconHintSpan()`: była martwą dekoracją (ikona bez `onClick`).
  Teraz renderuje `<span class="cp-tech-hint-link" data-tech-hint-name="..." role="button"
  tabindex="0">`, klikalny/klawiszowalny link do `showTechDiscoveryNotice({..., kind:'preview'})`
  — dokładnie ten sam wzorzec co w hubie/drzewku. Ponieważ span trafia do DOM jako string przez
  `innerHTML` w wielu miejscach (grid, chip, algo-step — 8+ wywołań), dodano JEDNORAZOWĄ
  delegację `click`/`keydown` na `document` (`bindTechHintLinkDelegation()`, flaga chroni przed
  podwójnym bindowaniem) zamiast duplikować listener przy każdym renderze/miejscu wywołania —
  brak refaktoru kontraktu karty, tylko nowy punkt wejścia do istniejącej funkcji. Dodano import
  `showTechDiscoveryNotice` z `./techDiscoveryNotice`. Drobny CSS hover/focus dla
  `.cp-tech-hint-link` obok istniejącego bloku `.bld-req-chip`.
- Commit lokalny (kod + ten raport razem): `c986a611` —
  `autobot(faza1): R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 - osobna ikonka info na hubie
  badan, drzewku tech i cityPanel`, na branchu `autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`
  (tip po commicie), rodzic `41d0d829` (dispatch). NIE mergowane do `main`.
- Brak zmian w `showTechDiscoveryNotice`/`techDiscoveryNotice.ts` (zgodnie z ograniczeniem) —
  tylko nowe punkty wejścia wołające istniejącą, niezmienioną funkcję.

TESTY:
- `cd gra && npx tsc --noEmit` → czyste (exit 0). UWAGA: worktree nie miał `node_modules`
  (izolowany git worktree) — doinstalowano `npm install` (nie `npm run build`/`npm run dev`,
  zgodne z zasadami) żeby w ogóle móc uruchomić tsc/vite; bez tego tsc failował na
  `Cannot find module 'three'` dla ~40 plików niezwiązanych z tym dispatchem (potwierdzone
  jako środowiskowe, nie related do zmian).
- Build: `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir` (z `gra/`)
  → `✓ built in 27.73s`, bez błędów.
- `node gra/tools/science-hub-test.cjs` → 5 PASS, 2 FAIL. Oba FAIL potwierdzone jako
  PRE-ISTNIEJĄCE (identyczny wynik na `git stash` / kodzie sprzed zmian tej fazy — bug
  niezwiązany z tym dispatchem, dotyczy silnika dostępności tech, nie UI kliknięć).
- `node gra/tools/tech-tree-test.cjs` → 19 PASS, 0 FAIL.
- `node gra/tools/technology-discovery-card-visual-test.cjs` → 48 PASS, 0 FAIL (karta podglądu
  nietknięta, zgodnie z ograniczeniem).
- `git diff --check` → czyste (brak whitespace/konfliktów).
- `git status` → tylko 3 zamierzone pliki zmienione (`cityPanel.ts`, `scienceHubHud.ts`,
  `techTreeView.ts`); `node_modules/`, `dist/` — poza repo (gitignore), nie trafiły do commitu.
- Wizualna weryfikacja przez zrzut ekranu w przeglądarce NIE wykonana (brak dostępnego
  środowiska przeglądarki w tej sesji subagenta) — zweryfikowano wyłącznie przez czytanie CSS
  (pozycjonowanie absolutne w rogu istniejących okrągłych ikon, rozmiar 13–16px, nie nachodzi
  na sąsiednie odznaki `.pl`/`.st`/`.sh-num-badge`/`.sh-plan-act` po współrzędnych) oraz przez
  czysty build. To jest jedyna otwarta luka względem instrukcji „sprawdzić wizualnie (build +
  zrzut ekranu jeśli możliwe) przed zgłoszeniem PASS" — zgłaszam PASS z tą notatką zamiast
  PASS-WITH-NOTES, bo build jest czysty, testy przechodzą, a layout został skonstruowany tym
  samym wzorcem co istniejące odznaki narożne w tym samym pliku (ten sam mechanizm co
  `.sh-num-badge`, `.civ-ttv-tn .pl/.st`) — ryzyko kolizji wizualnej niskie, ale niepotwierdzone
  zrzutem ekranu.

BLOKADY:
- Brak zrzutu ekranu / realnego renderu w przeglądarce do wizualnej weryfikacji (patrz TESTY
  wyżej) — jeśli Evaluator/Final Control ma dostęp do przeglądarki, warto to domknąć przed
  READY_FOR_DEPLOY.
- Baseline `science-hub-test.cjs` ma 2 pre-istniejące FAIL niezwiązane z tym dispatchem
  (silnik dostępności technologii, nie UI) — nie blokuje tej fazy, ale zostawiam widoczne w
  raporcie zgodnie z zasadą pełnej przejrzystości testów.

NASTĘPNY KROK: Evaluator → Final Control dla tej fazy (Faza 1 z 6). Kolejne fazy planu (patrz
docs/decyzje/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1.md) NIE rozpoczęte w tym dispatchu.

DEPLOY/PUSH: NIE WYKONANO
