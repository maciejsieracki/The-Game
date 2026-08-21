STATUS: PASS
TEMAT: R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1
GOAL: `techTreeView.ts` (hover-karta węzła drzewka technologii) i `sciencePicker.ts`
(tooltip badań) mają pokazywać KOMPLETNĄ i POPRAWNIE OZNACZONĄ listę jednostek
odblokowywanych przez daną technologię, czytaną z `units.json`'s pola `Tech`
(jak `entityCards/technologyAdapter.ts`), nie z osadzonego, niekompletnego
tekstu `tech.json`'s pola „Odblokowuje budynek".

ZMIANY/COMMIT:
- NOWY: `gra/src/ui/techUnlockParse.ts` — wspólny moduł: `parseUnlockBuildings()`
  (rozdziela segment „Jednostki: ..." od budynków — ta sama logika co dawniej w
  `techTreeView.ts`, teraz jedno źródło) + `unitsUnlockedByTech()` (kompletna
  lista jednostek z `units.json`'s pola `Tech`, wzorem `technologyAdapter.ts:100`).
  Wydzielone do osobnego modułu zamiast reużycia bezpośrednio z `techTreeView.ts`
  w `sciencePicker.ts`, bo `techTreeView.ts` importuje z `sciencePicker.ts`
  (`techToSlug`) — import w drugą stronę utworzyłby cykl (pkt 2a dyspozycji,
  wariant "reużyj bez cyklicznych importów").
- ZMIENIONY: `gra/src/ui/techTreeView.ts` — `buildTreeNodes()`: `jednostki`
  teraz z `unitsUnlockedByTech(r['Technologia'])` zamiast z segmentu „Jednostki:"
  w osadzonym tekście. Lokalne `splitList`/`parseUnlockBuildings` usunięte,
  zaimportowane z nowego modułu (identyczna logika, zero zmiany zachowania
  budynki/teren/surowce).
- ZMIENIONY: `gra/src/ui/sciencePicker.ts` — `TechNode` ma nowe pole
  `odblokujeJednostki: string[]` (z `unitsUnlockedByTech`); `odblokujeBudynek`
  teraz = `parseUnlockBuildings(...).budynki.join(', ')` (segment „Jednostki:"
  odrzucony PRZED renderem, nie mieszany z budynkami jak dotąd — naprawia
  literalnie zgłoszony bug: „Odlewnia brązu; Kuźnia brązu; Jednostki: Włócznik"
  jako jedna pozycja pod „Odblokowuje budynki:"). Tooltip (`buildTooltipHTML`,
  było ~903-905) ma nową sekcję „Odblokowuje jednostki:" analogiczną stylem do
  istniejących sekcji (budynki/surowce/ulepszenia) — dodanie jednego bloku
  `if`, bez zmiany layoutu overlaya/panelu (pkt 2c dyspozycji: to był prosty
  dodatek sekcji, NIE większy layout — brak podstawy do BLOCK).
  Efekt uboczny (poprawa, nie regresja): `techUnlockSummary()` (linia ~218,
  używana w hubie badań) też czyta teraz czysty `odblokujeBudynek` bez
  osadzonego tekstu jednostek.
- NOWY TEST: `gra/tools/tech-unlock-units-test.cjs` (41 asercji, wszystkie PASS)
  — bunduje esbuildem WYŁĄCZNIE `techUnlockParse.ts` (bez DOM-zależnych
  importów `icons/brandAssets.ts`, które wołają `import.meta.glob` — udokumentowany
  defekt harnessu, ten sam co w `building-tech-gate-test.cjs`); testuje
  `unitsUnlockedByTech()`/`parseUnlockBuildings()` na 8 różnych technologiach
  z osadzonym „Jednostki:" (Łucznictwo, Koło, Brązownictwo, Żegluga, Jeździectwo,
  Hutnictwo żelaza, Oblężnictwo, Obróbka żelaza) — w tym 4 z faktyczną
  rozbieżnością embedded<real (Łucznictwo 4→6, Brązownictwo 12→20, Jeździectwo
  7→8, Hutnictwo żelaza 17→19) i 4 bez rozbieżności (Koło, Żegluga, Oblężnictwo,
  Obróbka żelaza — dane w tych 4 się zgadzają, sprawdzone jawnie, nie zakładane).
  Plus regexowe przypięcie w źródle (obie strony wołają `unitsUnlockedByTech`,
  nie z powrotem osadzony tekst) i sprawdzenie `git diff --stat` = brak zmian w
  `data/tech.json` i `entityCards/technologyAdapter.ts`.
- Brak zmian w `gra/data/tech.json` i `gra/src/ui/entityCards/technologyAdapter.ts`
  (potwierdzone `git diff --stat` w teście, patrz wyżej).
- Commit lokalny na branchu `autobot/R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1`
  (SHA w git log po commicie tego raportu — patrz `git log --oneline -1`).

TESTY:
- `cd gra && node tools/tech-unlock-units-test.cjs` → 41 pass, 0 fail.
- `cd gra && node tools/tech-tree-test.cjs` (regresja, niezmieniony obszar) → 19 pass, 0 fail.
- `cd gra && node tools/technology-discovery-card-visual-test.cjs` (regresja) → 48 pass, 0 fail.
- `cd gra && node tools/building-tech-gate-test.cjs` (regresja) → 89 pass, 0 fail.
- `cd gra && npx tsc --noEmit` → czyste (jedyny output: pre-istniejące
  ostrzeżenie TS5101 o `baseUrl` w `tsconfig.json`, potwierdzone identyczne na
  `git stash` przed zmianami — niezwiązane z tym tematem).
- Build weryfikacyjny: `cd gra && node ./node_modules/vite/bin/vite.js build
  --outDir <scratchpad>/dist-test --emptyOutDir` → `✓ built`, 845 modułów, bez
  błędów (uruchomiony dwa razy, w tym po finalnym stanie diffu).
- `npm ci` uruchomiony w tym worktree na starcie (git worktree nie dzielił
  `node_modules` z głównym repo — katalog nie istniał).

BLOKADY: brak.

NASTĘPNY KROK: Evaluator.

DEPLOY/PUSH: NIE WYKONANO.
