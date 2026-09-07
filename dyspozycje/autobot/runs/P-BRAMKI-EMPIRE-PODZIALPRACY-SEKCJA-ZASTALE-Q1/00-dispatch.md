# P-BRAMKI-EMPIRE-PODZIALPRACY-SEKCJA-ZASTALE-Q1 — dispatch

TEMAT: `P-BRAMKI-EMPIRE-PODZIALPRACY-SEKCJA-ZASTALE-Q1`
RUNDA: 1/5
DOMAIN: PROCESS (podejrzenie: testy niedopasowane do zmiany nazwy funkcji, zero zmiany
balansu/mechaniki — POTWIERDŹ, nie zakładaj)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Dwie z pięciu bramek zarejestrowanych jako pre-istniejąco czerwone przy okazji tematu
`P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1` (`dyspozycje/autobot/runs/P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1/dowody/rodzina-panelu.md`),
zarejestrowane razem jako `P-BRAMKI-EMPIRE-PANEL-PIEC-CZERWONYCH-ZASTALE-Q1`, rozdzielone na
osobne tematy — to jest ta para, która dzieli WSPÓLNĄ przyczynę.

- `gra/tools/empire-panel-econ-slider-visibility-test.cjs`: 57 pass / 3 fail.
- `gra/tools/empire-panel-sliders-always-visible-test.cjs`: 6 pass / 2 fail — plik SAM
  opisuje się w nagłówku jako „SUPERSEDED" (zweryfikuj dosłowne brzmienie w pliku).

**Wspólna przyczyna (recon orkiestratora, POTWIERDŹ własnym odczytem):** obie bramki
odwołują się tekstowo do funkcji `renderDefaultPodzialPracySection()`, która **nie istnieje
nigdzie w `gra/src`** — potwierdzone grepem, jedyny ślad to nazwa w KOMENTARZU
`gra/src/ui/empirePanelSectionMap.ts:102` (`/** Suwak "Domyślny podział pracy"
(Budynki/Do puli imperium, renderDefaultPodzialPracySection). */`), obok realnego pola
`showLaborSplit: boolean` (`:103`, obliczane `:124`). To był już wcześniej potwierdzony
fakt w Final Control tematu `P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1` (zarzut 2, ODDAL — inny
kontekst, ten sam fakt: „`renderDefaultPodzialPracySection()` nie istnieje w `gra/src`").

Sam mechanizm (suwak „Domyślny podział pracy" w panelu imperium) prawdopodobnie DZIAŁA
poprawnie pod inną nazwą funkcji/innym kształtem kodu — **ustal to czytając kod, nie
zgadując**. Konkretne błędy failujących asercji dziś:
```
FAIL renderDefaultPodzialPracySection() występuje w sekcji dokładnie raz
FAIL ...i WYŁĄCZNIE pod warunkiem if(sliderVis.showLaborSplit) (nie bezwarunkowo)
FAIL mutacja MUT3 faktycznie zmieniła źródło (kotwica zamiany istnieje)
```
(z `empire-panel-econ-slider-visibility-test.cjs`) oraz
```
FAIL: renderDefaultPodzialPracySection() (suwak Praca) obecne w sekcji ZASOBY IMPERIUM
FAIL: renderDefaultPodzialPracySection() bramkowane przez sliderVis.showLaborSplit (dzisiejszy kontrakt, nie stała false/usunięte)
```
(z `empire-panel-sliders-always-visible-test.cjs`) — obie bramki szukają STAREJ nazwy
funkcji tekstowo (regex/`indexOf`) w źródle `gra/src/ui/empireDetailPanel.ts` (lub innym
pliku renderującym panel — ZWERYFIKUJ, w którym pliku faktycznie żyje dziś ten suwak).

## GOAL

1. **Ustal aktualną nazwę/kształt** funkcji lub bloku renderującego suwak „Domyślny podział
   pracy" w panelu imperium — grep po `showLaborSplit`, `Domyślny podział pracy`,
   `podzial.*pracy`, `PodzialPracy` w `gra/src/ui/*.ts`. Potwierdź, że mechanizm (widoczność
   sterowana `sliderVis.showLaborSplit`, jeden render w sekcji) rzeczywiście istnieje i
   działa — jeśli owszem, to obie bramki są stare (kategoria „test podążający za już
   wdrożoną zmianą nazwy/refaktorem", `PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md` §3b, może iść
   bez ABC-first).
2. Przekotwicz obie bramki na AKTUALNĄ nazwę/kształt kodu, zachowując SEMANTYKĘ każdej
   asercji (co dokładnie sprawdzała: „występuje dokładnie raz", „warunkowe pod
   `showLaborSplit`", dowód mutacyjny nietautologiczności) — nie usuwaj sprawdzeń, tylko
   napraw kotwiczenie tekstowe.
3. **`empire-panel-sliders-always-visible-test.cjs` jest oznaczony jako SUPERSEDED przez
   sam siebie** — przeczytaj CAŁY nagłówek pliku i ustal: czy ta bramka nadal ma sens
   (dubluje inną, aktywną bramkę?) czy powinna zostać USUNIĘTA jako martwa, zastąpiona
   przez coś innego. Jeśli uznasz, że należy ją usunąć — **STOP, DECISION_REQUIRED**
   (usuwanie bramki to decyzja, nie naprawa) zamiast usuwać samodzielnie; w międzyczasie
   napraw kotwiczenie tak, żeby była zielona, niezależnie od finalnej decyzji o jej losie.
4. Jeśli okaże się, że mechanizm suwaka NAPRAWDĘ zniknął/zmienił zachowanie (nie tylko
   nazwę) — to nie jest już „stary test", to jest **DECISION_REQUIRED** (możliwa realna
   regresja UX), nie naprawiaj kodu produkcyjnego samodzielnie.

## BINARNE KRYTERIUM SUKCESU

- `node tools/empire-panel-econ-slider-visibility-test.cjs` → 60/60 (dziś 57/3), zero
  osłabienia liczby asercji.
- `node tools/empire-panel-sliders-always-visible-test.cjs` → 8/8 (dziś 6/2) LUB jawny
  `DECISION_REQUIRED` z uzasadnieniem, jeśli uznasz że bramka powinna zniknąć.
- Dowód mutacyjny zachowany/odtworzony: MUT3 (albo odpowiednik) w
  `empire-panel-econ-slider-visibility-test.cjs` musi nadal realnie czerwienić bramkę po
  przekotwiczeniu — pokaż to explicite w raporcie.
- Zero zmian w `gra/src/**` — to są WYŁĄCZNIE naprawy testów. Jeśli dojdziesz do wniosku,
  że kod produkcyjny wymaga zmiany — DECISION_REQUIRED.
- `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
  unit-replace-test, combat-test) zielone.

## ALLOWLISTA

- `gra/tools/empire-panel-econ-slider-visibility-test.cjs`
- `gra/tools/empire-panel-sliders-always-visible-test.cjs`
- `dyspozycje/autobot/runs/P-BRAMKI-EMPIRE-PODZIALPRACY-SEKCJA-ZASTALE-Q1/**`

Zakazane bezwzględnie: `gra/src/**`, `gra/data/**`, pliki z sekretami, `docs/decyzje/**`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`,
`playbook.json`. Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-empire-podzialpracy-sekcja-zastale`, gałąź
`autobot/P-BRAMKI-EMPIRE-PODZIALPRACY-SEKCJA-ZASTALE-Q1`, baza jawnie `origin/main`
(commit `8429ad3e`) — potwierdź `git log -1` PRZED pracą (SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian mechaniki/UI — WYŁĄCZNIE naprawa dwóch testów.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Usunięcie bramki albo zmiana kodu produkcyjnego — zawsze DECISION_REQUIRED.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
