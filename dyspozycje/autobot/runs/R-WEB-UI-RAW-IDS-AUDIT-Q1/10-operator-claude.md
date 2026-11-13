STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RAW-IDS-AUDIT-Q1
GOAL: Wprowadzić do origin/main pracę osobnej sesji (audyt i naprawa przecieków surowych id do tekstu gracza, kandydat 2ca45a090 z gałęzi origin/claude/sweet-goodall-3vh4i9) przez merge na aktualny origin/main, z regeneracją wikiBundle.json zamiast ręcznej edycji JSON, i potwierdzić bramki na wyniku merge.

ZMIANY/COMMIT:
- Operator HEAD (merge, do integracji przez orkiestratora): 2b15ae891be05f437dd24eb67aa08a203b52d489 (krótki: 2b15ae891)
- Baza: origin/main = 6f2f1c50e (krótki SHA z `git rev-parse --short origin/main`).
- Kandydat: 2ca45a090 (origin/claude/sweet-goodall-3vh4i9, commity 46eb8a157 + 2ca45a090). Jest ancestorem merge: `git merge-base --is-ancestor 2ca45a090 2b15ae891` = TAK; origin/main też ancestor = TAK.
- Konflikt: tylko gra/src/data/wikiBundle.json (UU). Pozostałe pliki zmergowały się automatycznie.
- Rozwiązanie konfliktu: regeneracja generatorem `node gra/tools/bundle-wiki-for-game.cjs` (z korzenia worktree). Wynik w logu: "wikiBundle.json: 22 rozdz. + 172 haseł (~1183 KB)". Plik nie zawiera znaczników konfliktu, JSON parsuje się.
- Diff merge względem origin/main: 30 plików, +291 / -58 (`git diff --stat origin/main HEAD`).
- Allowlista sprawdzona na diffie względem origin/main: gra/ (kod, tech.json, wikiBundle.json), docs/ (PORADNIK, encyklopedia), dyspozycje/autobot/runs/R-WEB-UI-RAW-IDS-AUDIT-Q1/01-audit.md. Brak zmian w WERSJE.md, gra-robocza/**, brak git add -A.
- Raport: dyspozycje/autobot/runs/R-WEB-UI-RAW-IDS-AUDIT-Q1/10-operator-claude.md (ten plik, commit osobny po merge).

Tabela konfliktu:
| Plik | Konflikt | Rozwiązanie |
|---|---|---|
| gra/src/data/wikiBundle.json | content (UU) | regeneracja generatorem bundle-wiki-for-game.cjs z docs/ na wyniku merge |
Względem kandydata 2ca45a090 bundle różni się treścią: poradnik (inne treści z aktualnego docs/ na main) i encyklopedia 172 hasła vs 170 na kandydacie (dwa nowe hasła z main). To efekt aktualnego docs/, nie błąd regeneracji.

Potwierdzenie poprawek audytu w wyniku merge: pliki docs/encyklopedia/technologie/religia.md, docs/encyklopedia/pojecia/zalozanie-miasta.md, docs/encyklopedia/pojecia/manpower-rekruci.md, docs/PORADNIK-GRACZA/* są zmergowane (status M w merge). Test ids-leak-audit (sekcja 3 "Encyklopedia / poradnik (wikiBundle.json)") przechodzi, co dowodzi, że bundle zgadza się z docs/ dla sprawdzanych tekstów. Nie wykonano osobnego grep po treściach haseł religia/zalozanie/manpower; decyzja: pokryte przez test sekcji 3 i test-sync budynków (poniżej).

TESTY (liczby z surowego wyjścia, na wyniku merge 2b15ae891, w gra/ po `npm ci --ignore-scripts`):
- TypeScript: `node ./node_modules/typescript/bin/tsc --noEmit` -> exit 0, brak błędów.
- ids-leak-audit-test.cjs -> "WYNIK: 1627 ok, 0 FAIL" (kandydat zgłaszał 1609; różnica = nowe przypadki z aktualnego main, nie regresja).
- wonder-text-no-raw-ids-test.cjs -> "WYNIK: 132 ok, 0 FAIL".
- Bramki referencyjne z §6 R-PROC-AUTOBOT:
  - logic-test.cjs -> "LOGIC OK (213/213)"
  - tech-tree-test.cjs -> "20 pass, 0 fail" (wzorzec z §6 mówi 19/19; wynik 20/0 zielony)
  - research-test.cjs -> "ALL GREEN"
  - unit-replace-test.cjs -> "WSZYSTKIE TESTY ZIELONE (21/21)" (wzorzec 13/13; wynik zielony)
  - combat-test.cjs -> "All sanity checks passed." (exit 0)
  - NIE_ZMIERZONO: unit-power-test.cjs (wiadomo z §6: czerwony pre-istniejąco 4/2, nie uruchomiony w tej rundzie); map-gen-regression (wolny, poza zakresem tematu); ai-buduje-budynki i map-field-battle (poza zakresem zmian).
- Testy dotkniętych obszarów (exit 0 chyba że zaznaczono):
  - entity-card-contract-test.cjs -> exit 0
  - mgla-sciezka-inwariant-test.cjs -> exit 0
  - civpedia-cuda-historia-test.cjs -> exit 0
  - civpedia-technologie-rys-historyczny-test.cjs -> exit 0
  - civpedia-gra-id-mostek-test.cjs -> exit 0
  - building-stock-visibility-test.cjs -> "7 passed, 0 failed"
  - danina-podatek-tooltip-ui-test.cjs -> "12 pass, 0 fail"
  - diplomacy-display-test.cjs -> "44 OK, 0 FAIL"
  - diplomacy-infografiki-tooltipy-test.cjs -> "12 OK, 0 FAIL"
  - era-gate-ui-test.cjs -> "51 passed, 0 failed"
  - granary2-tech-data-guard-test.cjs -> "PASS 14 / FAIL 0"
  - hex-tooltip-improvement-production-text-test.cjs -> "19 passed, 0 failed"
  - hex-tooltip-unlock-label-dedup-test.cjs -> "28 passed, 0 failed"
  - science-hub-test.cjs -> "7 pass, 0 fail"
- Dwa niezielone testy, PRE-EXISTING (zweryfikowane na świeżym origin/main w osobnym worktree, identyczny wynik, czyli nie regresja z merge):
  - card-resource-purpose-test.cjs -> "101 pass, 1 fail", FAIL: "[B] adaptery: utrzymanie budynku wciąż liczone w Pieniądzu (opłacane z kasy)"
  - civpedia-budynki-historia-test.cjs -> "150 pass, 1 fail", FAIL: "mury.md: treść "## Rys historyczny" === buildings.json["mury"].historia (dokładnie)" rysLen 1013, expectedLen 1026
- Wiki-sync: w gra/tools nie ma osobnego skryptu "wiki-sync" poza bundle-wiki-for-game.cjs i testami civpedia-*; test budynków "realny wikiBundle.json: liczba wpisów folder=budynki === liczba plików .md" -> PASS; "WSZYSTKIE wpisy budynki mają niepuste pole historia" -> PASS.
- NIE_ZMIERZONO: vite build (nie wymagany przez dispatch Operatora), Chromium zrzuty (wymagane dopiero od Evaluator/FC).

BLOKADY:
- Rozbieżność z dispatchem: nagłówek dispatchu (workflow) podaje BAZĘ origin/main = 2ca45a090, ale 2ca45a090 nie jest na origin/main (origin/main = 6f2f1c50e). Plik 00-dispatch.md nie istnieje na origin/main (`git show origin/main:dyspozycje/.../00-dispatch.md` -> brak ścieżki); plik DODATEK (00-dispatch-DODATEK-claude.md) istnieje na origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 i wskazuje merge na origin/main. ZAŁOŻENIE: wykonano wariant z DODATKU (checkout origin/main + merge kandydata), bo tylko on daje wynik integrowalny na main.
- 2 testy czerwone pre-existing (powyżej), nie wynikają z tego tematu i nie były naprawiane.
- Brak niezależnej weryfikacji w Chromium dla zmian UI (zakres Evaluator/FC).

RUNDY: 1/5 (Operator, HAIKU).

NASTĘPNY KROK: Evaluator i Final Control na SHA 2b15ae891 (odtworzyć bramki na wyniku merge, nie na gałęzi autora; mutacja strażnika ids-leak; Chromium: karta ulepszenia, odkrycia, panel odkryć bez surowych id). Integracja i push na main wykonuje orkiestrator po READY_FOR_DEPLOY.

DEPLOY/PUSH: NIE WYKONANO

---

## RUNDA 2/5 (Operator, Haiku) — merge na aktualny origin/main

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RAW-IDS-AUDIT-Q1
GOAL: Wprowadzić pracę audytu (kandydat 87604b5ce) na bazę origin/main 494480569 (FALA 627, administrator miasta) bez utraty żadnej ze stron konfliktu.
ZMIANY/COMMIT:
- Kandydat: 87604b5ce (detached). Merge: 5c8d8b7c0 (`git merge origin/main` z 87604b5ce). Ancestry: `git merge-base --is-ancestor 87604b5ce 5c8d8b7c0` = TAK; `origin/main` (494480569) = TAK.
- Diff względem origin/main: 34 pliki, +431 / -68.
- Tabela konfliktów (2 pliki, oba UU):
  | Plik | Konflikt | Rozwiązanie |
  |---|---|---|
  | gra/src/data/wikiBundle.json | jeden plik generowany | REGENERACJA: `node gra/tools/bundle-wiki-for-game.cjs` (log: "22 rozdz. + 173 haseł (~1187 KB)"). Bez ręcznej edycji. Wynik zawiera poprawki audytu (grep: religia / zalozanie-miasta / manpower-rekruci obecne). |
  | gra/src/ui/cityPanel.ts | blok importów (linie 292–300) | ZACHOWANO OBIE STRONY: z audytu `nazwyZListyId` (text-names) + `AUTO_BUILD_DISABLED_HINT`; z FALI 627 `AUTO_BUILD_NEEDS_ADMINISTRATOR_HINT`, `administratorIconHtml`/`ADMINISTRATOR_ICON_CSS`, `administratorBaseEffectsPct`/`administratorTierScale`/`administratorEffectsFor`/`AdminTier`. Ciała funkcji: auto-merge bez konfliktu; wiersze „Surowiec (tech)” / „Odblokowuje surowiec” zostają na `nazwyZListyId` (poprawka audytu). |
- Dodatkowa korekta (nie konflikt git): gra/tools/civpedia-wikihubhud-rys-historyczny-duplikacja-test.cjs — kotwica testu mutacyjnego wskazywała `entry.full.includes(...)`, a commit audytu 46eb8a157 zmienił źródło na `pelna = ... stripEncyMetadata(entry.full)`. Test zgłaszał „kotwica fixu nie znaleziona” (exit 1 na kandydacie). Zaktualizowano kotwicę do nowej formy; zachowanie mutacji bez zmian. Dowód: przed zmianą FAIL (build error), po zmianie `7 pass, 0 fail`.
- Commit raportu: SHA w polu sha wyniku orkiestratora (czubek).
TESTY (surowe wyniki, uruchomione na wyniku merge 5c8d8b7c0):
- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0, bez błędów.
- ids-leak-audit-test.cjs → `WYNIK: 1634 ok, 0 FAIL`, exit 0.
- wonder-text-no-raw-ids-test.cjs → `WYNIK: 132 ok, 0 FAIL`, exit 0.
- improvement-adapter-resource-note-test.cjs → `77 pass, 0 fail`, exit 0.
- city-administrator-test.cjs → `117 passed, 0 failed`, exit 0.
- city-administrator-economy-test.cjs → `72 passed, 0 failed`, exit 0.
- Pięć bramek referencyjnych: logic-test → `LOGIC OK (213/213)`; tech-tree-test → `20 pass, 0 fail` (dokument podaje 19/19, wynik 20 pass — zgodny z zerem FAIL); research-test → `33 / 33`; unit-replace-test → `21/21`; combat-test → `6/6`. Wszystkie exit 0.
- Testy panelu miasta / encyklopedii: 13 skryptów (citypanel-*, city-panel-growth-percent-separator-test, civpedia-*) — 13 PASS, a poniższe 6 FAIL. Te same 6 kończy z exit 1 także na origin/main 494480569 (baseline sprawdzony w tymczasowym worktree, usunięty): citypanel-tech-tile-dead-effects-test (Katapulta w „Odblokowuje budynek”, 16/1), civpedia-budynki-historia-test (mury.md, 150/1), civpedia-jednostki-j1-test, civpedia-jednostki-j2-test (Rys historyczny w jezdziec-chinski/katapulta), card-resource-purpose-test (101/1, „utrzymanie w Pieniądzu”). Są to długi sprzed tego tematu — NIE naprawiano (poza zakresem).
- civpedia-wikihubhud-rys-historyczny-duplikacja-test.cjs → po korekcie kotwicy `7 pass, 0 fail`. (Na origin/main też exit 0.)
- wiki-sync: w tools/ nie ma osobnego testu zgodności wikiBundle z docs/; zgodność wynika z regeneracji generatorem z docs/ (NIE_ZMIERZONO osobnym testem).
- Chromium / zrzut nagłówka miasta z przyciskiem „Administrator”: NIE_ZMIERZONO w tej rundzie (wymóg Evaluatora/FC wg dispatchu).
BLOKADY: brak blokad merge. Długi testowe (6 skryptów wyżej) pre-existing na main — do osobnych tematów.
RUNDY: 2/5 (po nieudanej r2 → Sonnet nie było potrzebne).
NASTĘPNY KROK: Evaluator i Final Control odtwarzają bramki na 5c8d8b7c0 (nie na gałęzi autora), sprawdzają tabelę konfliktu cityPanel.ts, mutację strażnika ids-leak (surowe id w tekście → test czerwony) oraz zrzut Chromium nagłówka miasta z przyciskiem Administrator.
DEPLOY/PUSH: NIE WYKONANO
