# P-AI-NIE-STAWIA-BUDYNKOW-Q1 — Evaluator, RUNDA 1

DOMAIN: GAME
TEMAT: `P-AI-NIE-STAWIA-BUDYNKOW-Q1`
GOAL: miasta AI (duże cywilizacje i państwa-miasta) faktycznie stawiają budynki,
gwarancja barbarzyńska nietknięta, bramka-weryfikator na wzrost `cityBuilt`.
MODEL+EFFORT: Opus 5, effort high · RUNDA: 1/5 · oceniane: `42411540` + `596de17a`
ZMIANY/COMMIT: bez zmian w kodzie; ten raport (allowlista `dyspozycje/autobot/runs/**`)
DEPLOY/PUSH: NIE WYKONANO

## TESTY (uruchomione samodzielnie, nie odczytane z raportu)

- `tsc --noEmit` (5.9.3, `node_modules` symlink) — **0 błędów**.
- `node tools/ai-buduje-budynki-test.cjs` — **PASS=22 FAIL=0**, mój własny bieg.
  Tabela (moja, trzeci niezależny pomiar): FIX 15/5/0/0, MUT-A 3/**0**/0/0,
  MUT-B 13/7/**1**/0. Mutacja realnie czerwieni: MUT-A odtwarza objaw właściciela
  (państwa-miasta = 0), MUT-B daje barbarzyńcom budynek → A3 pada. Bramka woła
  silnik (`vite build` + Chromium + `doStartGame`/`endTurn()`/`captureViaBattle`),
  nie reimplementację — hak `dumpBuildings()` to surowy odczyt.
- Referencyjne: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13,
  combat 6/6. Powiązane zielone: auto-manage 45/45, empire-city-defaults 53/0,
  ai-prod-fallback 17/0, ai-production-priority 9/0.
- Parytet czerwieni sprawdzony niezależnie: `ai-test` 287/8 (zgodne), `ai-praca-split-parity`
  21/1, `barb-city-capture-cluster` 92/1 — ta ostatnia to okno 4000 znaków od
  `applyCityCaptureToMap`, reset leży 5267 znaków dalej **identycznie na `05df297a`
  i na HEAD** → dług przed-istniejący, nie regresja tematu. Struktura reds
  `city-state-offensive-live-test` potwierdzona odczytem (`tools/...:197-203` wymaga
  RÓŻNICY wobec `git HEAD`) — czerwona z konstrukcji, niezależnie od tego tematu.
- Diff mieści się w allowliście (4 pliki), `git diff --check` czysty, zero sekretów,
  zero usunięć, `git status` po biegu czysty.

## ZARZUTY

**1. Domyślny tryb budowy gracza pozostał `'reczny'` — rozbieżność z ECHO właściciela.**
`gra/src/game/empire-city-defaults.ts:389` (`ownerId <= 0` → `freshOwnerDefaultBudowaProfil()`)
oraz asercje utrwalające ten stan: `gra/tools/ai-buduje-budynki-test.cjs:391` (A4) i `:394` (A4b).
ECHO (przekazane PO uruchomieniu Operatora, więc nie jest to zarzut o niedbalstwo):
profil domyślny ma być AUTOMATYCZNY dla WSZYSTKICH właścicieli, **łącznie z graczem**,
przy zachowaniu zera budynków u barbarzyńców. Znaczenie: ECHO jest wiążące i wyprzedza
zapis dispatchu („gracz: bez zmian"); dodatkowo NOTA 2.1 samego Operatora pokazuje, że
zamknięte `R-NOWE-MIASTO-AUTOBUDOWA-ZROWNOWAZONA-DOMYSLNIE` (`eb03cb94`) **dla gracza
pozostaje cicho cofnięte**. Poprawka: warunek zawęzić do barbarzyńców i ujemnych
sentineli (`ownerId < 0` / `isBarbarianOwner`), a A4/A4b przepisać na „gracz dostaje tryb
auto, ale `onBudowaEnterManual` nadal działa per miasto".

**2. Ścieżka wczytania zapisu omija naprawę — miasta AI w istniejących grach zostają
na `'reczny'` NA ZAWSZE.** `gra/src/main.ts:35105-35107` (load woła
`migrateBudowaProfilOnLoad`, **nie** `initOwnerDefaultCityFields`), a sama migracja
oddaje graczowski default: `gra/src/game/empire-city-defaults.ts:308-309` (gałąź
`savedDefaults` — stary zapis niesie `'reczny'` dla ownerów AI), `:311-317` (gałąź
bez zapisu — czyta `city.budowaTryb`, czyli `'reczny'`) i `:337-339` (fallback
`freshOwnerDefaultBudowaProfil()` dla każdego brakującego ownera); domyka to
`gra/src/game/cities.ts:702`. `seedCityOwnerDefaults` nie pomoże, bo jego gałąź jest
pod `if (!ownerDefaultBudowaProfil.has(...))`. Znaczenie: §16a pkt 4 (trwały stan
save/load) — właściciel zgłosił defekt z TRWAJĄCEJ rozgrywki, a po wczytaniu jego
zapisu nic się nie zmieni; §9 wymaga, by naprawa działała na KAŻDEJ ścieżce wczytania
(precedens tego samego pliku: `P-PRACA-CAP-MIGRACJA-LUKA-Q1`, komentarz `:155-168`).
Poprawka: w `migrateBudowaProfilOnLoad` (albo tuż po nim w `main.ts`) przepuścić
ownerów przez `freshOwnerDefaultBudowaProfilForOwner` zamiast `freshOwnerDefaultBudowaProfil`.

**3. Bramka buduje do katalogu WEWNĄTRZ drzewa repo — na maszynie właściciela nie
wystartuje.** `gra/tools/ai-buduje-budynki-test.cjs:335-337`
(`path.join(GRA_DIR, 'dist-ai-buduje-fix' | '-mut-a' | '-mut-b')`). §9 pkt 1 (C-001,
bariera CHRONIONA) mówi wprost: `--outDir` „musi wskazywać katalog **poza drzewem
repo** (scratch/tmp)", bo OneDrive blokuje `unlink` (`EPERM`) i `--emptyOutDir`
pada; wzorzec kanoniczny to `sidepanel-event-header-wydarzenie-real-render-test.cjs`
(`os.tmpdir()`). Efekt uboczny zmierzony u mnie: **201 MB** artefaktów zostaje
w `gra/` po każdym biegu, bez sprzątania (dysk 77% zajęty).

**4. Bramka mutuje ŻYWY, śledzony plik źródłowy w gałęzi roboczej.**
`gra/tools/ai-buduje-budynki-test.cjs:108-126` — `fs.writeFileSync(DEFAULTS_TS, mutated)`
i przywrócenie w `finally`. `finally` nie obejmuje `SIGKILL`/timeoutu runnera: bieg
ubity w oknie buildu mutanta (u mnie ok. 60 s na wariant) zostawia worktree
z **cofniętą naprawą** w pliku, który jest w allowliście commita, oraz zatruwa każdy
równolegle biegnący `tsc`/bramkę (§2b). Repo ma gotowy, bezpieczny wzorzec na tym
SAMYM pliku: `gra/tools/praca-cap-migracja-luka-test.cjs:64-85` kopiuje `src` do
`.<nazwa>-src` i mutuje kopię („mutowanie oryginału byłoby nieakceptowalne").

**5. Komentarz-nośnik gwarancji barbarzyńskiej jest po naprawie nieprawdziwy.**
`gra/src/main.ts:26456-26458` (PL) i `:26469-26471` (EN): „bo `seedCityOwnerDefaults`
resetuje `budowaTryb` do `'reczny'` przy KAŻDYM przejęciu". Po zmianie reset dotyczy
już tylko gracza i barbarzyńców. Znaczenie: dispatch (recon C) wskazuje ten komentarz
jako JEDYNE udokumentowane uzasadnienie zatwierdzonej gwarancji, a nowe komentarze
Operatora (`main.ts:4855-4861`, docstring `empire-city-defaults.ts:356-384`) odsyłają
do niego jako do autorytetu — zostawiony w tej postaci zaprasza następnego agenta do
„uproszczenia" gałęzi barbarzyńskiej. Poprawka: jedno zdanie („reset zachowany dla
ownerId ≤ 0, patrz `freshOwnerDefaultBudowaProfilForOwner`").

**6. Bramka mierzy sumę po imperium, nie objaw właściciela; progi M1/M2 są
stochastyczne.** `gra/tools/ai-buduje-budynki-test.cjs:365-375` (A1/A1b/A2/A2b — „suma
> 0" i „istnieje JEDNO miasto z ≥1") oraz `:417-421` (M1/M2 — nierówność między dwoma
niezależnymi przebiegami). Mój bieg pokazuje, dlaczego to za mało: w turze 46 FIX ma
**14 miast dużego AI i 15 budynków** oraz 4 miasta-państwa i 5 budynków — czyli ~1 budynek
na miasto, więc duża część miast AI nadal ma ZERO, a to jest DOKŁADNIE to, co właściciel
zobaczył po zdobyciu miasta trzymanego długo przez pełnoprawną cywilizację (doprecyzowanie
(a)). Bramka zieleni się niezależnie od tego rozkładu. Niedeterminizm potwierdzony
trzema pomiarami na tym samym seedzie 778899: FIX 11/8, 13/5 (Operator) i 15/5 (mój);
MUT-A 4/0, 3/1, 3/0. Poprawka: asercja pokrycia (np. „każde miasto dużego AI istniejące
≥N tur ma ≥1 wpis w `cityBuilt`") plus wydruk rozkładu per miasto; przy stochastyce —
próg z marginesem albo mediana z powtórzeń, nie goła nierówność.

**7. Raport Operatora łamie kontrakt raportu i §11.** `01-operator-runda1.md:1-13` —
brak pól `GOAL:` i `ZMIANY/COMMIT:` (allowlista + SHA `42411540`); nagłówek ma
`BAZA`/`MODEL+EFFORT`, ale nie te dwa wymagane. Objętość **915 słów** wobec limitu
ok. 400 (§11 — `PASS-WITH-NOTES`, wraca do skrócenia). Znaczenie: orkiestrator
integruje z pola `ZMIANY/COMMIT`, a §16a pkt 9 wymaga zgodności `GOAL` raportu
z dispatchem — bez pola nie ma czego porównać.

## POZA ZARZUTAMI (do świadomej decyzji właściciela, nie wada pracy)

NOTA 2.2 Operatora zweryfikowana: `pracaImperialPoolGain` (`production.ts:2072`)
przy pustej kolejce oddaje do puli `doPuli + doBudynkow`. Po naprawie kolejki miast AI
przestają być puste, więc budżet ulepszeń terenu AI realnie maleje — to zmienia
punkt odniesienia biegnącego równolegle `R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1`.
Nowa bramka nie jest zarejestrowana w §6 (`docs/decyzje/**` poza allowlistą) —
do zrobienia osobnym tematem PROCESS.

## BLOKADY

Brak. Zarzuty 1-2 wymagają zmian w kodzie (allowlista wystarcza), 3-6 w bramce,
7 w raporcie.

## NASTĘPNY KROK

Obrona Operatora (§3c pkt 2) do zarzutów 1-7, potem runda 2 na tym samym ID i tej
samej gałęzi.
