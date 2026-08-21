STATUS: PASS
TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, podtemat T3 „MIGRACJA-KARTA-TECHNOLOGII" (T3, druga próba po T1b)
GOAL: `techDiscoveryNotice.ts` (`showTechDiscoveryNotice`) buduje treść przez
`technologyAdapter.ts` (`buildEntityCardData`) i renderuje przez wspólny `renderer.ts`
(`renderEntityCard`), zamiast własnego DOM-buildera — bez zmiany publicznej sygnatury/
zachowania widocznego dla gracza, z zachowaniem wszystkich 5 świadomych odstępstw z
nagłówka `techDiscoveryNotice.ts`.

## Rola i zakres tej weryfikacji

Final Control — osobny, niezależny subagent, ostatnia weryfikacja przed
`READY_FOR_DEPLOY`. Wejście: Operator status=PASS (headSha=8984b351), Evaluator
status=PASS (issues: 1 nieblokująca uwaga proceduralna o pokryciu testowym aktywnej
ścieżki, 1 kosmetyczna o CSS kompaktowego nagłówka, 1 informacyjna o nieaktualnym
komentarzu-pytaniu w nagłówku pliku — żadna nie blokuje PASS). Nie integruję, nie
mergeuję do `main`, nie pushuję.

## Worktree i baza diffu

- Worktree: `/home/user/The-Game/.claude/worktrees/wf_2fbf3c81-f10-1`, branch
  `autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`, `git status` czyste przed i po
  weryfikacji (wszystkie pliki tymczasowe użyte do testów ad-hoc usunięte).
- `HEAD` = `8984b3510f8f38b6a30e28cbc0be27b47d3e0946` (zgodne z headSha zgłoszonym przez
  Operatora).
- `main` = merge-base = `588d1389...` (T1+T1b już zintegrowane, brak rozjazdu — branch
  zaczyna się dokładnie od aktualnego `main`).

## Weryfikacja diffu (`git diff main..HEAD -- gra/` oraz pełny diff)

`gra/` obejmuje WYŁĄCZNIE:
- `gra/src/ui/entityCards/technologyAdapter.ts` (266 linii zmian — pełna treść zamiast
  szkieletu T1).
- `gra/src/ui/techDiscoveryNotice.ts` (139 linii zmian — nowa ścieżka
  `showTechDiscoveryNoticeViaEntityCard` + `try/catch` fallback do
  `_legacyShowTechDiscoveryNotice` (stara implementacja przeniesiona 1:1, prywatna) +
  `ensureEntityCardOverrideStyles()`).

Poza `gra/`: wyłącznie `dyspozycje/autobot/runs/.../16-*.md`, `17-*.md` (dokumentacja
runu). Potwierdzone `git diff main..HEAD --stat` w całości (2 pliki `gra/` + 2 pliki
dokumentacji, zero innych zmian).

Zero edycji (potwierdzone `git diff main..HEAD --stat` dla każdej ścieżki z osobna,
wynik pusty): `scienceHubHud.ts`, `techTreeView.ts`, `cityPanel.ts`,
`entityCards/{types,renderer,registry,slug}.ts`. Cztery miejsca wywołania
`showTechDiscoveryNotice(` (`scienceHubHud.ts` ×3, `techTreeView.ts` ×1) — potwierdzone
`grep` — bez zmian w kodzie wywołującym.

## Testy — wykonane niezależnie w tym przebiegu

1. `npx tsc --noEmit` bez `node_modules` w worktree → global `tsc 6.0.2` z PATH,
   TS5101 (`baseUrl` deprecated). **Powtórzone z prawdziwym, przypiętym `tsc` projektu**
   (symlink do `node_modules` głównego repo, `package.json`/`package-lock.json`
   zdiffowane jako identyczne przed użyciem, symlink usunięty po teście):
   `./node_modules/.bin/tsc --version` → `5.9.3` (zgodnie z bramką R-PROC-AUTOBOT §Bramki),
   `./node_modules/.bin/tsc --noEmit` → **ZERO output, zero błędów** — nawet ostrzeżenie
   TS5101 znika przy właściwej wersji. Ustalenie proceduralne (nie blokuje, ale koryguje
   zapis w `12-operator-T3.md`/`17-operator-T3-retry.md`): błąd "pre-istniejący,
   niezwiązany z zadaniem" zgłaszany w obu raportach Operatora jest w rzeczywistości
   artefaktem uruchamiania `npx tsc` BEZ `node_modules` (fallback na global tsc 6.x) —
   przy poprawnym środowisku (bramka wprost wymaga `node_modules`, patrz playbook C-029)
   wynik jest w 100% czysty, lepszy niż raportowany. Nie jest to regresja tego kroku —
   dotyczy identycznie stanu `main` sprzed T3.
2. `node gra/tools/technology-discovery-card-visual-test.cjs` → **48 PASS, 0 FAIL**
   (potwierdzone niezależnie). Zgadzam się z zastrzeżeniem Evaluatora: sekcja [2] tego
   testu robi `fs.readFileSync` + regex na SUROWYM tekście `techDiscoveryNotice.ts` —
   ponieważ `_legacyShowTechDiscoveryNotice` (stara implementacja) zostaje w tym samym
   pliku jako fallback 1:1, wzorce typu `const UNIT_PREVIEW = 3`, `tdn-card--compact`,
   `<b>✓</b>`+„spełnione", `data-act="tree"` faktycznie trafiają w martwy (poza wyjątkiem)
   kod fallbacku, nie w aktywną ścieżkę `technologyAdapter.ts`/`renderEntityCard`.
   Ten test przeszedłby identycznie nawet gdyby aktywna ścieżka była całkowicie zepsuta.
3. `node gra/tools/entity-card-contract-test.cjs` (z tym samym symlinkiem
   `node_modules`, bunduje PRAWDZIWY `renderer.ts`/`registry.ts` przez esbuild+jsdom) →
   **75 pass, 0 fail** (47 T1 + 28 T1b, w tym wywołanie `buildEntityCardData('technology',
   technologyIdFromName('Łowiectwo'), {})` na prawdziwym `technologyAdapter.ts` — 3
   asercje kind/id/title, jak trafnie zauważył Evaluator nie pokrywa treści
   sekcji/badge/paginacji/pigułek migrowanej karty).
4. **Niezależny harness ad-hoc (napisany i wykonany przeze mnie w tym przebiegu, usunięty
   po weryfikacji — nie zastępuje żadnej istniejącej bramki, adresuje wprost lukę
   dowodową opisaną przez Evaluatora w punkcie 2 powyżej):** bunduje PRAWDZIWY
   `techDiscoveryNotice.ts` (nie regex na tekście źródła) przez esbuild+jsdom, wywołuje
   PUBLICZNY, eksportowany `showTechDiscoveryNotice(opts)` — dokładnie tak jak wołają go
   `scienceHubHud.ts`/`techTreeView.ts` — i sprawdza wynik w prawdziwym DOM na AKTYWNEJ
   ścieżce (potwierdzone brakiem `.tdn-card` i obecnością `.entity-card` w wyniku, zero
   wywołań `console.error`/fallbacku). **23 pass, 0 fail**, w tym:
   - akordeon: sekcja „Co możesz teraz zrobić" ma `entity-card-section--hi`, klik
     nagłówka realnie przełącza `data-open` (rozwija/zwija),
   - ikony per wiersz: `<svg>` wstawione jako markup (nie tekst) w wierszach
     Budynki/Jednostki,
   - `trailing`: obecny w wierszach Jednostek,
   - `badge` per wiersz (ok/warn/muted): obecne w „Co możesz teraz zrobić",
   - paginacja: przycisk „Pokaż pozostałe N" dla technologii z >3 jednostkami
     (Brązownictwo, 20 jednostek), klik odkrywa resztę I dodaje `entity-card--compact`
     na karcie (sprzężenie `compactHeaderOnExpand` działa),
   - pigułki: `layout:'pills'` dla sekcji Wymagania, checkmark „✓" obecny,
   - przycisk zamknięcia (✕) dopisany post-hoc obecny i klikalny,
   - `hideTechDiscoveryNotice()` usuwa host z DOM,
   - tryb `preview` z `onStartResearch`+`onOpenTree`: oba przyciski akcji renderują się
     (`entity-card-actions`, 2 elementy), kliknięcie „Rozpocznij badanie" faktycznie
     woła callback I zamyka kartę.
   Wniosek: zachowania funkcjonalne (akordeon/ikony/trailing/badge/paginacja/pigułki/
   akcje/zamknięcie) SĄ dowiedzione na aktywnej ścieżce, nie tylko deklarowane w
   raporcie Operatora czy pokryte pośrednio przez testy operujące na fallbacku/płytkich
   asercjach. Rekomendacja Evaluatora (osobny temat na trwały test DOM aktywnej ścieżki)
   podtrzymuję jako zasadną — ten ad-hoc harness był tymczasowy i nieprzechowywany w
   repo; wart utrwalenia jako właściwa bramka w osobnym, drobnym temacie.
5. `node ./node_modules/vite/bin/vite.js build --outDir <tmp> --emptyOutDir` (symlink
   `node_modules` jak wyżej) → **✓ built in 19.71s, 844 modułów, 0 błędów** — potwierdzone
   niezależnie, katalog tymczasowy i symlink usunięte po teście.

## Weryfikacja 5 świadomych odstępstw (niezależna, nie tylko na podstawie raportu Operatora)

1. **Pasek „Efekt"/`Uwagi` pominięty.** Sprawdzone `git show main:...techDiscoveryNotice.ts
   | grep Uwagi` — pole `Uwagi` NIGDY nie było odczytywane w `buildBody` sprzed T3 (tylko
   deklaracja typu + komentarz nagłówkowy) — to znaczy odstępstwo #1 to w praktyce "nigdy
   nie renderuj Uwagi", nie filtr. `technologyAdapter.ts` też nie odwołuje się do `Uwagi`
   — zero regresji, zachowanie identyczne w obu wersjach. Uwaga proceduralna (nie
   blokuje): dispatch `11-...md` pkt 2 sugerował, że adapter MUSI reużywać
   `isDevOnlyPlayerText()`/`playerFacingNote()` z `techDiscoveryNotice.ts` — te funkcje w
   rzeczywistości żyją WYŁĄCZNIE w `cityPanel.ts` (osobny plik, osobny temat
   `P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1`), nie w `techDiscoveryNotice.ts` — przesłanka
   dispatchu była nietrafiona dla TEGO pliku, ale nie miała wpływu na wynik, bo Operator
   poprawnie nie dodał żadnego kodu filtrującego Uwagi (bo go tu nigdy nie było).
2. **„Co możesz teraz zrobić" z szablonów + realnymi nazwami.** Porównałem
   `buildActionItems`(legacy, diff `main..HEAD` sekcja usunięta) z nowym blokiem
   `actionRows` w `technologyAdapter.ts` linia po linii — te same 4 warunki
   (resourceUnlocked/buildingNames/improvementNames/nextTechRows), ta sama kolejność, te
   same teksty i te same 3 rodzaje badge (ok/warn/muted), plus identyczny wiersz
   zamykający „Odkrycie nie buduje automatycznie...". Zgodne.
3. **„Kolejne technologie": „Możesz badać" tylko gdy jedyny wymóg.** Logika
   `otherPrereqs.length === 0` → badge „Możesz badać", inaczej `value: "Wymaga też: ..."`
   — 1:1 z legacy `nextTechsBody`. Zgodne.
4. **Tryb podglądu steruje wyłącznie nagłówkiem.** `opts.kind` nadal jedynym wejściem
   różnicującym (`isPreview`/`isEraAdvance` w `showTechDiscoveryNoticeViaEntityCard`) —
   sekcje/treść niezmienne względem trybu. Potwierdzone testem ad-hoc (preview render
   identyczny w sekcjach, różni się tylko `kick`/`statusWord`/`subtitle`).
5. **Brak przycisku „Otwórz hub badań".** `grep -n "hub badań\|data-act=\"hub\"" ` w
   `technologyAdapter.ts` i w nowej funkcji `showTechDiscoveryNoticeViaEntityCard` → brak
   trafień. Zgodne — przycisk nadal nieobecny.

## Znane, udokumentowane delty (nieblokujące, potwierdzone jako kosmetyczne/językowe)

- Tekst przycisku „Pokaż pozostałe N" bez polskiej odmiany rzeczownika (`renderer.ts`
  poza allowlistą T3) — ta sama liczba, ten sam mechanizm, mniej precyzyjny język.
  Udokumentowane przez Operatora, potwierdzone przeze mnie w `renderer.ts:150`
  (`Pokaż pozostałe ${hiddenRows.length}` bez `pluralPl`).
- Układ nagłówka (kicker/status → `statusBadges`, epoka/poziom/kamień milowy/hint →
  `subtitle` jedną linią) różni się wizualnie od starego, ale niesie te same
  informacje — zgodne z kryterium „nie identyczny HTML, treść równoważna" z
  `11-dispatch-...md`.
- `.entity-card--compact` (nowa ścieżka) kompensuje mniej niż stare `tdn-card--compact`
  (tylko medalion 34→24px, bez `h2` 25→19px i bez medalionu 52→36px) — kosmetyczna
  różnica ilościowa tego samego mechanizmu, zgłoszona przez Evaluatora, potwierdzona
  przeze mnie w CSS obu wersji. Kandydat do drobnej korekty przy okazji, nie blokuje.
- Nagłówek pliku (linie 34-43) wciąż zawiera nieaktualne „PYTANIE DO EVALUATORA" z
  poprzedniej rundy mimo że decyzja o odłożeniu przycisku hub badań jest już
  udokumentowana gdzie indziej (`PYTANIA-OTWARTE.md`) — czysto kosmetyczny/redakcyjny
  dług, zgadzam się z oceną Evaluatora że to nie nowe otwarte pytanie wymagające decyzji
  w tym kroku.

## Decyzja

STATUS: PASS
readyForDeploy: true

Zero błędów kompilacji (potwierdzone z prawidłową wersją `tsc`, wynik czystszy niż
raportowany), zero regresji w trzech bramkach testowych (48/48, 75/75, build 844
modułów), diff ściśle ograniczony do allowlisty (`technologyAdapter.ts` +
`techDiscoveryNotice.ts` + dokumentacja runu), zero edycji plików zakazanych, 4
dotychczasowe wywołania bez zmian. Wszystkie 5 świadomych odstępstw produktowych
zweryfikowane niezależnie linia-po-linii, zachowane. Dodatkowo: napisałem i wykonałem
własny, tymczasowy harness DOM (bundlujący prawdziwy kod, wołający publiczne
`showTechDiscoveryNotice()`), który dowodzi — na AKTYWNEJ ścieżce, nie na fallbacku —
że akordeon, ikony per wiersz, trailing, badge, paginacja ze sprzężeniem kompaktowego
nagłówka, pigułki z checkmarkiem i akcje (Rozpocznij badanie/Otwórz drzewo) faktycznie
działają (23/23 pass). To zamyka lukę dowodową, którą Evaluator słusznie zgłosił jako
nieblokującą uwagę — rekomendacja Evaluatora (osobny temat na trwałą wersję takiego
testu w repo) pozostaje zasadna i warta realizacji, ale nie zmienia werdyktu tego kroku.

ZMIANY/COMMIT: brak zmian w plikach źródłowych gry wykonanych przez Final Control
(weryfikacja nieinwazyjna, wszystkie pliki tymczasowe testu ad-hoc oraz symlink
`node_modules` usunięte po weryfikacji, `git status` czyste) — dopisany wyłącznie ten
raport, `dyspozycje/autobot/runs/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1/
18-final-control-T3-retry.md`, zakomitowany na branchu
`autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`.

TESTY: `tsc --noEmit` (z prawidłowym `node_modules`, tsc 5.9.3) — 0 błędów;
`technology-discovery-card-visual-test.cjs` — 48/48; `entity-card-contract-test.cjs` —
75/75; `vite build` — 844 moduły, 0 błędów; harness ad-hoc Final Control (aktywna
ścieżka, DOM realny, usunięty po użyciu) — 23/23. Wszystkie wykonane bezpośrednio w
tym przebiegu weryfikacji.

BLOKADY: brak.

NASTĘPNY KROK: integracja przez orkiestratora (merge do `main` po jego własnej
weryfikacji). Po integracji, poza zakresem tego kroku — dwa drobne, nieblokujące
tematy do rozważenia przy najbliższej okazji: (a) osobny, trwały test DOM aktywnej
ścieżki karty odkrycia technologii (rekomendacja Evaluatora, zaadresowana tymczasowo
w tym raporcie); (b) odmiana rzeczownika w przycisku „Pokaż pozostałe N" +
oczyszczenie nieaktualnego komentarza-pytania w nagłówku `techDiscoveryNotice.ts`.

DEPLOY/PUSH: NIE WYKONANO
