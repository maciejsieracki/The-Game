# P-SCIENCEHUB-TOOLTIP-EMOJI-ZAMIAST-IKON-Q1 — dispatch

TEMAT: `P-SCIENCEHUB-TOOLTIP-EMOJI-ZAMIAST-IKON-Q1`
RUNDA: 1/5
DOMAIN: GAME/wizualny (spójność wizualna ikon marki — wymaga żywego dowodu z Chromium)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort medium; Evaluator — Opus 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a — temat wizualny: Operator+
Evaluator Opus 5, Final Control Sonnet 5).

## GENEZA

Druga, niezależna instancja tej samej klasy buga naprawionej już tematem
`P-SCIENCEHUB-EMOJI-ZAMIAST-IKON-ODBLOKOWAN-Q1` (ZINTEGROWANE, commit `a2c887e8`): wiersz
„Odblok.:" karty technologii w hubie badań pokazywał generyczny emoji (🏛/💎/🌾) na kategorię
zamiast właściwej ikony marki per konkretna encja. Ten temat naprawiał WYŁĄCZNIE listę huba
badań (`scienceHubHud.ts`).

**Druga instancja (ten temat):** `sciencePicker.ts` ok. linii 905-925 — funkcja tooltipa hover
(inna powierzchnia UI, INNY call site niż lista) również emituje surowe emoji 🏛/🌾 zamiast
ikon marki. Zarejestrowana świadomie osobno przy tamtym reconie, bo właściciel zgłosił
konkretnie listę (zrzut ekranu), a tooltip to inny fragment kodu.

## GOAL

1. Znajdź dokładną funkcję tooltipa w `sciencePicker.ts` (linie w GENEZIE to punkt startowy z
   reconu — mogły się przesunąć, przeczytaj kod, nie zgaduj). Ustal JEDYNEGO
   producenta stringu z emoji i JEDYNEGO konsumenta (analogicznie do wzorca z tematu-referencji:
   tam `techUnlockSummary()` był jedynym producentem, `scienceHubHud.ts:601-606` jedynym
   konsumentem).
2. Powtórz DOKŁADNIE wzorzec naprawy z `P-SCIENCEHUB-EMOJI-ZAMIAST-IKON-ODBLOKOWAN-Q1`
   (commit `a2c887e8`, przeczytaj go: `git show a2c887e8`): zastąp płaski string emoji
   strukturalnymi danymi (analogicznie do `techUnlockItems()`), renderowanymi przez właściwy
   resolver marki z `brandAssets.ts` (`buildingIconSvg`/`mapResourceIconSvg`/
   `improvementIconSvg`) per pozycja — te same funkcje, ten sam resolver, już gotowe i
   sprawdzone w poprzednim temacie.
3. Zwróć uwagę na DWA błędy znalezione i naprawione przez Obronę w poprzednim temacie, które
   mogą się powtórzyć tutaj: (a) przekazywanie PEŁNEGO obiektu definicji do resolvera (nie tylko
   ID) — inaczej ikona może się różnić od tej samej encji gdzie indziej w grze; (b) odsiewanie
   placeholderów (`isPlaceholderLabel()` już istnieje w kodzie z poprzedniego tematu — reużyj,
   nie pisz od nowa).
4. Obowiązkowy dowód wizualny (temat wizualny, R-PROC-AUTOBOT.md §5a): żywe zrzuty
   Playwright/Chromium pokazujące tooltip PRZED (surowe emoji) i PO (właściwe ikony marki),
   oraz porównanie z tą samą ikoną użytą gdzie indziej w grze (np. w liście huba badań po
   poprzednim temacie, lub w panelu miasta) — identyczna encja musi mieć identyczną ikonę.

## BINARNE KRYTERIUM SUKCESU

- Tooltip hover w `sciencePicker.ts` pokazuje właściwe ikony marki per encja, nie generyczne
  emoji kategorii — potwierdzone żywym zrzutem Chromium.
- Ta sama encja (np. konkretny budynek) ma IDENTYCZNĄ ikonę w tooltipie co w liście huba badań
  (po poprzednim temacie) i w panelu miasta — potwierdzone porównaniem zrzutów.
- Placeholdery (jeśli występują w tooltipie) poprawnie odsiane, nie pokazują fałszywej ikony
  obok myślnika.
- `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
  unit-replace-test, combat-test) zielone.

## ALLOWLISTA

- `gra/src/ui/sciencePicker.ts`
- `gra/src/ui/scienceHubHud.ts` (tylko jeśli tooltip dzieli kod z listą — nie zmieniaj listy
  samej w sobie, ta jest już naprawiona)
- Nowa/rozszerzona bramka `gra/tools/*-test.cjs` dla tego tooltipa (real-render, żywy Chromium)
- `dyspozycje/autobot/runs/P-SCIENCEHUB-TOOLTIP-EMOJI-ZAMIAST-IKON-Q1/**`

Zakazane bezwzględnie: `gra/src/ui/brandAssets.ts` (resolvery marki — reużyj, nie zmieniaj),
`gra/data/**`, pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-sciencehub-tooltip-emoji`, gałąź
`autobot/P-SCIENCEHUB-TOOLTIP-EMOJI-ZAMIAST-IKON-Q1`, baza jawnie `origin/main` (commit
`42b62bd6` w chwili założenia, może być nowszy przy starcie pracy — potwierdź `git log -1`
PRZED pracą, SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem. Dla żywego renderu Playwright/Chromium
buduj bundle testowy przez `node ./node_modules/vite/bin/vite.js build --outDir` do katalogu
POZA repo (np. `os.tmpdir()` z unikalnym sufiksem per proces, C-046/tmpdir-unikalność).

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian mechaniki — wyłącznie naprawa wizualna tooltipa.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Reguła przeciw samooszukiwaniu: zakaz uznania tematu wizualnego za zamknięty bez zrzutu z
  żywego Chromium i bez pokazania, że bramka realnie czerwienieje po cofnięciu naprawy (dowód
  mutacyjny).

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
