STATUS: PASS

DOMAIN: GAME

TEMAT: R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1

GOAL: `techTreeView.ts` (hover-karta węzła drzewka technologii) i `sciencePicker.ts`
(tooltip badań) mają pokazywać KOMPLETNĄ i POPRAWNIE OZNACZONĄ listę jednostek
odblokowywanych przez daną technologię, czytaną z `units.json`'s pola `Tech`
(jak `entityCards/technologyAdapter.ts`), nie z osadzonego, niekompletnego tekstu
`tech.json`'s pola „Odblokowuje budynek".

ZMIANY/COMMIT: Worktree `/home/user/The-Game/.claude/worktrees/wf_25ac16e0-dc7-1`,
branch `autobot/R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1`, HEAD =
`e4af9bffcba2576f50c6a983361e9c339bcd905d` (Operator `22dac60a` + Evaluator
`e4af9bff` na wierzchu dispatchu `72ba63b7`).

`git diff main..HEAD -- gra/` w całości (nie tylko stat) — dokładnie 4 pliki:
- NOWY `gra/src/ui/techUnlockParse.ts` (52 linie) — wspólny parser: `splitList`,
  `parseUnlockBuildings` (budynki + osadzony-do-odrzucenia tekst jednostek),
  `unitsUnlockedByTech(techName)` = `unitsData.filter(u => u.Tech === techName)`
  — dokładnie wzorzec `entityCards/technologyAdapter.ts:100`, potwierdzone
  bezpośrednim odczytem obu plików.
- `gra/src/ui/techTreeView.ts` — `parseUnlockBuildings` przeniesiony do
  `techUnlockParse.ts` (usunięty duplikat), `buildTreeNodes()` teraz woła
  `unitsUnlockedByTech(r['Technologia'])` zamiast osadzonego tekstu.
- `gra/src/ui/sciencePicker.ts` — `TechNode.odblokujeBudynek` teraz budowane
  przez `parseUnlockBuildings(...).budynki.join(', ')` (czyste, bez segmentu
  „Jednostki:"), nowe pole `odblokujeJednostki: unitsUnlockedByTech(...)`,
  `buildTooltipHTML` dostał nową sekcję "Odblokowuje jednostki:".
- NOWY `gra/tools/tech-unlock-units-test.cjs` (154 linie) — test na 8
  technologiach z osadzonym segmentem „Jednostki:", regexowe przypięcie w
  źródle (`unitsUnlockedByTech` faktycznie wołane, nie z powrotem stary tekst).

Zero zmian w `gra/data/tech.json` i `gra/src/ui/entityCards/technologyAdapter.ts`
— potwierdzone: `git diff --stat main..HEAD -- gra/data/tech.json
gra/src/ui/entityCards/technologyAdapter.ts` = puste. Zakres 1:1 z dispatchem
(`00-dispatch.md` §"Zakres naprawy" pkt 1-2, §"Ograniczenia").

Poza `gra/`: `git diff --stat 72ba63b7..HEAD -- . ':!gra' ':!dyspozycje/autobot/runs'`
= puste — Operator i Evaluator nie dotknęli niczego poza allowlistą. Szerszy
`git diff main..HEAD` (bez filtra `gra/`) pokazuje dodatkowo zmiany w
`gra-robocza/*.html`, `ROBOCZA-MANIFEST.json` i `WERSJE.md`/`REJESTR` — ale to
NIE jest praca tego tematu: branch odgałęziony od `71c350f5`, PRZED awaryjnym
rollbackiem `186bb6da` ("ROLLBACK PILNY: ROBOCZA FALA 307 -> 306") który main
otrzymał później. To staleness gałęzi względem `main`, nie regresja
wprowadzona przez ten diff — potwierdzone `git show --stat` na obu commitach
Operatora/Evaluatora (dotykają wyłącznie plików tego tematu) oraz
`git merge-base --is-ancestor 54bc9ff7 main` (prawda). Flaguję to jako uwagę
dla integracji orkiestratora (rebase przed mergem), nie jako blokadę tego
tematu — zgodnie z dyspozycją nie mergeuję do main.

TESTY (wszystkie uruchomione niezależnie w tym worktree, nie tylko odczytane
z raportów Operatora/Evaluatora):
- `cd gra && npx tsc --noEmit` → czyste, exit 0.
- `node tools/tech-unlock-units-test.cjs` → 41 pass, 0 fail.
- `node tools/tech-tree-test.cjs` → 19 pass, 0 fail.
- `node tools/technology-discovery-card-visual-test.cjs` → 48 pass, 0 fail.
- `node tools/building-tech-gate-test.cjs` → 89 pass, 0 fail.
- `node tools/tech-tempo-test.cjs` → 15 pass, 0 fail (ZIELONY).
- `node tools/science-hub-test.cjs` → 5 pass, 2 fail (`engine available=4
  (>=5)`, `hub unlocked=4 (>=5)`). NIEZALEŻNIE zweryfikowano baseline: `git
  archive 72ba63b7 -- gra` do katalogu tymczasowego w scratchpadzie (bez
  worktree), symlink `node_modules`, ten sam test uruchomiony na kodzie SPRZED
  zmian Operatora → identyczne 2 FAIL, identyczna treść. Potwierdza
  niezależnie ustalenie Evaluatora: pre-istniejąca usterka baseline (dot.
  prawdopodobnie licznika technologii w teście vs. aktualny stan
  `tech.json`/`units.json`), niezwiązana z `techTreeView.ts`/`sciencePicker.ts`
  (test bunduje tylko `playerState.ts` + `scienceHubSnapshotLogic.ts`) — NIE
  jest regresją tego tematu.

- SAMODZIELNA weryfikacja runtime (druga, niezależna od Evaluatora — osobny
  harness w scratchpadzie, nie w repo): kopie `sciencePicker.ts`/
  `techTreeView.ts` z eksportowanymi funkcjami wewnętrznymi (`buildNodes`,
  `buildTooltipHTML`, `buildTreeNodes`, `unlockChips`) zbudowane esbuildem do
  CJS (stub generowany programowo ze WSZYSTKICH `export function`/`export
  const` faktycznie zdefiniowanych w `icons/brandAssets.ts`, żeby uniknąć
  ręcznego niedopasowania nazw), uruchomione dla DWÓCH technologii —
  Brązownictwo i Hutnictwo żelaza (nie tylko karta z raportu Evaluatora):
  * Brązownictwo: `sciencePicker.buildNodes()` → `odblokujeJednostki.length
    === 20`, `odblokujeBudynek === "Odlewnia brązu, Kuźnia brązu"` (czyste,
    2 pozycje). Pełny wyrenderowany `buildTooltipHTML` odczytany wprost:
    sekcja "Odblokowuje budynki:" zawiera dokładnie `<li>Odlewnia brązu</li>
    <li>Kuźnia brązu</li>` (zero segmentu "Jednostki:" wewnątrz), sekcja
    "Odblokowuje jednostki:" zawiera dokładnie 20 `<li>` (Włócznik ...
    Gwardzista z champi, w tym "Strażnik bram Harappy" i "Taran okuty" —
    brakujące w starym 12-elementowym tekście). `techTreeView.buildTreeNodes()`
    → `odblokujeJednostki.length === 20`; `unlockChips()` renderuje dokładnie
    20 `<span class="ch u">`, zero literalnego "Jednostki:" w HTML.
  * Hutnictwo żelaza (druga technologia, jak wymagane w dyspozycji Final
    Control): `sciencePicker` → `odblokujeJednostki.length === 19`,
    `odblokujeBudynek === "Odlewnia żelaza, Kuźnia żelaza"` (czyste, 2
    pozycje), tooltip: sekcja "Odblokowuje jednostki:" ma dokładnie 19 `<li>`
    (policzone z prawidłowym ograniczeniem do własnego `<ul>...</ul>`, nie do
    końca dokumentu). `techTreeView` → `odblokujeJednostki.length === 19`,
    `unlockChips()` renderuje dokładnie 19 chipów jednostek.
  * Obie karty (drzewko i tooltip badań) dla obu technologii pokazują
    poprawną, KOMPLETNĄ listę jednostek zgodną 1:1 z `units.json`'s `Tech`,
    z czystym rozdzieleniem budynki/jednostki i zero przecieku osadzonego
    tekstu "Jednostki:" do sekcji budynków.
  * Scratch pliki (`src/ui/_fc_sciencePicker.ts`, `src/ui/_fc_techTreeView.ts`,
    `tools/.fc-runtime-check-*`) usunięte po weryfikacji; `git status` w
    worktree czysty przed i po (potwierdzone).

BLOKADY: brak dla tego tematu. Dwie osobne sprawy do zarejestrowania przez
orkiestratora POZA tym tematem (nie blokują PASS/READY_FOR_DEPLOY tutaj):
1. `science-hub-test.cjs` 2 pre-istniejące FAIL na baseline (potwierdzone
   niezależnie dwukrotnie — przez Evaluatora i przez Final Control).
2. Branch jest stale względem `main` o jeden awaryjny rollback
   (`186bb6da`, FALA 307→306) — przy integracji do main wymaga rebase/
   ostrożnego mergowania samych 4 plików `gra/` tego tematu, NIE prostego
   `git merge`, żeby nie cofnąć rollbacku ani nie wciągnąć z powrotem
   `gra-robocza/*`/`WERSJE.md` w nieaktualnym stanie.

NASTĘPNY KROK: integracja orkiestratora (allowlist-only: `gra/src/ui/
sciencePicker.ts`, `gra/src/ui/techTreeView.ts`, `gra/src/ui/techUnlockParse.ts`
[nowy], `gra/tools/tech-unlock-units-test.cjs` [nowy]) z uwzględnieniem
staleness branchu względem `main` (patrz BLOKADY pkt 2) → READY_FOR_DEPLOY po
faktycznej integracji.

DEPLOY/PUSH: NIE WYKONANO.
