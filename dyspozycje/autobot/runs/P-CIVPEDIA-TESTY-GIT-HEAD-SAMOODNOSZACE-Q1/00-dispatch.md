TEMAT:  P-CIVPEDIA-TESTY-GIT-HEAD-SAMOODNOSZACE-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: PROCESS
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Final Control na batchu treści `R-CIVPEDIA-CUDA-Q1` zwrócił FAIL — WYŁĄCZNIE
w nowym teście `gra/tools/civpedia-cuda-historia-test.cjs`, NIE w treści (19
plików `.md` niezależnie potwierdzone jako w 100% poprawne). Po integracji
pozostałych 5 batchy okazało się, że to SYSTEMOWY problem: identyczny wzorzec
zepsuł też już zintegrowane testy `civpedia-jednostki-j1-test.cjs` (111/137,
26 fail) i `civpedia-jednostki-j2-test.cjs` (132/133, 1 fail).

## RECON (wykonany, nie powtarzać)
Wspólna przyczyna we wszystkich 3 plikach: kryterium "zero zmian w istniejącej
treści" zaimplementowano jako porównanie fragmentu pliku z `git show
HEAD:<plik>` (lub jako `git diff <base>..HEAD` ograniczony do zakładanego
wąskiego zbioru plików). To działa TYLKO w chwili, gdy test jest uruchamiany
PRZED scommitowaniem zmiany (HEAD wskazuje jeszcze na stan sprzed). Po
scommitowaniu i zintegrowaniu do `main`, `HEAD` już zawiera nową sekcję —
porównanie jest strukturalnie niespełnialne na zawsze, dla każdego kolejnego
uruchomienia. Dla J2 dodatkowo: test zakładał zamknięty zakres `git diff`
(tylko pliki J2), co przestało być prawdą, gdy J1 wylądował w INNYM,
niezależnym commicie na tej samej gałęzi `main` — oba commity razem tworzą
diff szerszy niż zakładał test J2, mimo że merytorycznie wszystko jest
poprawne (żaden plik J1 nie został faktycznie naruszony przez commit J2).

`civpedia-budynki-historia-test.cjs`, `civpedia-ulepszenia-historia-batch-test.cjs`
i `civpedia-technologie-rys-historyczny-test.cjs` NIE mają tego problemu
(136/116/324 PASS po integracji) — użyły odpornej metody bez zależności od
ruchomego `git HEAD`/zakresu diffu. Użyj ICH podejścia jako wzorca napraw.

Stan na `main` dziś: `civpedia-jednostki-j1-test.cjs` i
`civpedia-jednostki-j2-test.cjs` ISTNIEJĄ i są czerwone (commit `3a44c234` +
`17f1ae17`). `docs/encyklopedia/cuda/*.md` (19 plików) NIE mają jeszcze
sekcji `## Rys historyczny` — ten batch NIE został zintegrowany z powodu
FAIL. Treść do dopisania jest DOKŁADNIE ta sama, co wcześniej zweryfikowana
przez Operatora/Evaluatora/Final Control commitu `4a4369c5` na branchu
`worktree-wf_8349caeb-ee0-2` (wciąż istnieje jako osobny worktree/branch,
możesz go użyć jako źródła referencyjnego do skopiowania treści — ale
NAPISZ WŁASNY, poprawiony test, nie kopiuj starego pliku testowego 1:1).

## GOAL
1. `gra/tools/civpedia-jednostki-j1-test.cjs` i
   `gra/tools/civpedia-jednostki-j2-test.cjs` (oba już na `main`): napraw
   WYŁĄCZNIE mechanizm weryfikacji "zero zmian w istniejącej treści" (i, dla
   J2, zakresu plików) — zastąp zależność od `git show HEAD:<plik>`/zakresu
   `git diff` metodą NIEZALEŻNĄ od historii gita i pozycji HEAD: sprawdzaj
   STRUKTURALNIE na aktualnym stanie pliku na dysku — (a) dokładnie JEDEN
   nagłówek `## Rys historyczny` w pliku, (b) jeśli plik ma
   `## Historia / decyzje`, `## Rys historyczny` występuje PO nim (porównanie
   pozycji indeksów w treści pliku), (c) treść pod `## Rys historyczny` to
   dokładnie pole `Historia`/`historia` z odpowiedniego wpisu JSON (już
   sprawdzane, zostaw), (d) `## Rys historyczny` jest na samym końcu pliku.
   Wzoruj się dokładnie na metodzie z `civpedia-budynki-historia-test.cjs`/
   `civpedia-ulepszenia-historia-batch-test.cjs`/
   `civpedia-technologie-rys-historyczny-test.cjs` (sprawdź ich kod PRZED
   pisaniem własnej wersji — nie zgaduj metody). Dla J2 usuń też sztywne
   założenie zamkniętego zakresu `git diff` — zastąp weryfikacją że
   POZOSTAŁE 25 plików batcha J1 mają swoją WŁASNĄ, poprawną zawartość
   (struktura j.w.), a nie że "diff jest pusty" (bo J1 i J2 to teraz dwa
   osobne, legalne commity na tej samej gałęzi).
2. `docs/encyklopedia/cuda/*.md` (19 plików, WSZYSTKIE) — dopisz na końcu
   `## Rys historyczny` z treścią dokładnie zgodną z polem `historia`
   odpowiadającego wpisu w tablicy `cuda` w `gra/data/wonders.json`
   (dopasowanie po `id` z `## Metadane`), dokładnie jak w poprzedniej,
   niezintegrowanej rundzie (`4a4369c5`) — możesz skopiować gotową treść
   stamtąd (worktree z tym commitem powinien nadal istnieć:
   `git worktree list | grep 4a4369c5` albo `git show 4a4369c5:<plik>`).
3. `gra/tools/civpedia-cuda-historia-test.cjs` — NOWY plik (poprzedni,
   zepsuty, nie istnieje jeszcze na `main`), napisany od razu z metodą
   strukturalną z punktu 1 (bez `git show HEAD`).
4. Po wszystkich zmianach: `node gra/tools/bundle-wiki-for-game.cjs`
   (regeneracja `wikiBundle.json`, do własnego testu — orkiestrator i tak
   zregeneruje go osobno po integracji).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `node gra/tools/civpedia-jednostki-j1-test.cjs` → wszystkie testy PASS,
   URUCHOMIONE na aktualnym stanie `main` (HEAD = commit tej poprawki, NIE
   commit sprzed), bez żadnego workaround typu `git reset --soft` — test ma
   działać poprawnie na zwykłym, czystym `git clone`/checkout `main`.
2. `node gra/tools/civpedia-jednostki-j2-test.cjs` → analogicznie, wszystkie
   PASS na aktualnym `main`.
3. Nowy `node gra/tools/civpedia-cuda-historia-test.cjs` → wszystkie PASS na
   aktualnym stanie WŁASNEGO worktree tej rundy (zawierającego już dopisaną
   treść cuda) — również bez zależności od `git show HEAD`.
4. Treść wszystkich 19 plików `docs/encyklopedia/cuda/*.md` dokładnie zgodna
   z `wonders.json` (jak w poprzedniej, zweryfikowanej rundzie) — dowód:
   automatyczne porównanie.
5. Żywy dowód w headless Chromium: 3 z 19 haseł cuda pokazują sekcję "Rys
   historyczny" z realną treścią (widok 'm'/'full', nie 's').
6. Dowód nietautologiczności NOWYCH testów: symuluj scenariusz "test
   uruchomiony PO scommitowaniu, z dowolnym HEAD" (np. `git worktree add
   --detach` na finalny commit tej rundy, uruchom stamtąd) — testy nadal
   PASS, bo nie zależą już od relacji do poprzedniego stanu w historii gita.
7. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu.

## ALLOWLISTA — nic poza tym
`gra/tools/civpedia-jednostki-j1-test.cjs` (WYŁĄCZNIE mechanizm weryfikacji,
nie zmieniaj asercji treści która już działa), `gra/tools/civpedia-jednostki-j2-test.cjs`
(jw.), `docs/encyklopedia/cuda/*.md` (WYŁĄCZNIE dopisanie sekcji na końcu, jak
w poprzedniej rundzie), nowy `gra/tools/civpedia-cuda-historia-test.cjs`,
`gra/src/data/wikiBundle.json` (regeneracja, efekt uboczny). Zakazane
bezwzględnie: `docs/encyklopedia/budynki/**`, `docs/encyklopedia/ulepszenia/**`,
`docs/encyklopedia/technologie/**`, pozostałe pliki `docs/encyklopedia/jednostki/**`
(poza samą treścią, która już jest poprawna i ma zostać nietknięta — dotykasz
WYŁĄCZNIE mechanizmu testowego w tych 2 plikach `.cjs`), `gra/tools/bundle-wiki-for-game.cjs`,
`gra/src/ui/wikiHubHud.ts`, `gra/data/**` (tylko odczyt), `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-CIVPEDIA-TESTY-GIT-HEAD-SAMOODNOSZACE-Q1`,
baza JAWNIE `origin/main` (zawiera już 5 zintegrowanych batchy treści CivPedii).
Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 1/2/3 za spełnione przez uruchomienie testu w
nienaturalnym stanie (np. z HEAD cofniętym `git reset --soft` do commita
rodzica) — test MUSI przechodzić na zwykłym, "świeżym" checkout finalnego
stanu tej rundy, dokładnie tak jak zrobi to Final Control (detached checkout
na finalny SHA, bez żadnych sztuczek z historią gita). To jest ISTOTA tego
tematu — jeśli poprawka nadal zależy od punktu w historii gita, temat nie
jest naprawiony, niezależnie od tego czy test akurat przeszedł w Twoim
worktree.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow,
detached checkout na finalny SHA — dokładnie test wymagany kryterium 6) →
orkiestrator integruje allowlist-only (diff plików .md + testy .cjs, BEZ
wikiBundle.json — regenerowany osobno) i cutuje kolejną FALĘ ROBOCZA.
