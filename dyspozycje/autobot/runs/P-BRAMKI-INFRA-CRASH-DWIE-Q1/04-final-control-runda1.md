# Final Control — runda 1 — P-BRAMKI-INFRA-CRASH-DWIE-Q1

MODEL+EFFORT: Sonnet 5, effort high.
Baza sprawdzona: `git log -1` → `1bcbf16f` (Obrona), zero zaufania do zgodności trzech
raportów — każdy werdykt niżej ma własny dowód z własnego uruchomienia.

## Własna weryfikacja (skrót; pełne komendy uruchomione w tej sesji)

1. **Uruchomienie/liczba asercji.** `map-field-battle-test.cjs`: 19 ok/1 fail, exit 1.
   `assert(` w pliku: 21 wystąpień − 1 definicja = 20 wywołań = 19+1. Zgadza się 1:1,
   brak cichego pominięcia. `entity-card-contract-test.cjs`: 75 pass/0 fail. `check(`
   w pliku: 61−1(def)=60 wywołań statycznych, ale jedna sekcja 5 asercji siedzi
   w pętli `for (const data of [4 kinds])` (linia 164) — 60−5+5×4=75. Liczby zgadzają
   się dokładnie, nie ma "garstki z kilkudziesięciu" — to realny, pełny przebieg.
2. **Dowód anty-maskujący, własny, INNY cel niż w raportach Operatora/Evaluatora**
   (żeby nie powielać tej samej ścieżki dowodowej): złamałem
   `validateOpenCityFieldBattle` (`mapFieldBattle.ts:265`, `if (city.maMur)`→`if (false)`)
   → wynik 18 ok/**2** fail (`validate: walled rejected` czerwone, plus istniejący fail).
   Złamałem `renderEntityCard` (`renderer.ts:330`, `h2.textContent = data.title`→
   `'BROKEN'`) → **71 pass/4 fail** (wszystkie 4 kinds na `h2 z tytułem`). Cofnięte
   `git checkout --`, `git status --porcelain` czysty, ponowny przebieg wrócił do
   19/1 i 75/0. Obie bramki realnie czerwienieją na świeżo złamanych celach — nie tylko
   na tych z raportów.
3. **Stub w produkcji.** `grep -rn map-field-battle-muzyka-stub` poza `node_modules`:
   jedyne trafienie to `map-field-battle-test.cjs:9`. Brak w `vite.config.ts`, brak
   w `gra/src/**`. Nie wycieka.
4. **Allowlista.** `git diff 6b81abf4 --stat`: 6 plików — 3 raporty rundy 1, stub `.ts`,
   oba pliki testowe. `git diff 6b81abf4 --stat -- gra/src gra/data` → puste. Zgodne
   z dispatchem.
5. **`fortifyScaledDefFor`.** `mapFieldBattle.ts:77` — pole WYMAGANE (bez `?`) w
   `MapFieldBattleLaunchDeps`. Diff pokazuje wyłącznie dodanie
   `fortifyScaledDefFor: stubDef` (ta sama funkcja co istniejący `unitDefFor: stubDef`)
   — uzupełnienie kontraktu fixture, nie dotyka żadnej linii asercji.
6. **Fail `collectBattleRoster atk: adjacent scout excluded`.** `git show
   6b81abf4:...` vs obecny plik: linie z tą asercją i jej fixture bajt-w-bajt
   identyczne z bazą — diff to potwierdza (hunk nigdzie w pobliżu). Fail zgłoszony
   jawnie, nie przykrojony.
7. **5 bramek referencyjnych + tsc**, uruchomione samodzielnie: `logic` 213/213,
   `tech-tree` 19/19, `research` 33/33, `unit-replace` 13/13, `combat` 6/6,
   `tsc --noEmit` exit 0 (z `gra/`).

## Werdykt

Shim naprawia URUCHAMIANIE, nie wycisza pomiar — potwierdzone własnym, niezależnym
dowodem anty-maskującym na obu bramkach z celami innymi niż w raportach niższego
szczebla. Brak naruszeń allowlisty, brak wycieku stubu, fixture uzupełniony zgodnie
z typem, fail merytoryczny zgłoszony uczciwie.

STATUS: PASS
DOMAIN: INFRA
TEMAT: P-BRAMKI-INFRA-CRASH-DWIE-Q1
GOAL: obie bramki dobiegają do końca i wykonują swoje asercje
ZMIANY/COMMIT: brak nowych zmian (Final Control = weryfikacja); commit sprawdzany
`0da4a5ef` (Operator); dowody anty-maskujące złamane/cofnięte w tej sesji, git status
czysty po każdym
TESTY: bramka1 19/20 (własne uruchomienie + liczenie asercji 20=20); bramka2 75/75
(60 statycznych + pętla ×4 = 75, zweryfikowane); tsc --noEmit OK; 5 bramek ref bez
regresu (213/19/33/13/6); anty-maskowanie własne na NOWYCH celach (validate walled,
h2 tytuł) — oba czerwienieją, cofnięte, czysto
BLOKADY: brak proceduralnych; 1 realny fail merytoryczny w bramce 1
(`collectBattleRoster` vs `collectAtkRosterNearCity`, drift w wykluczaniu zwiadowcy)
— zgłoszony uczciwie, do decyzji właściciela/kolejnego tematu, nie do naprawy tu
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora → READY_FOR_DEPLOY
DEPLOY/PUSH: NIE WYKONANO

WERDYKTY: 1→ODDAL (shim mierzy, liczby asercji zgadzają się dokładnie) 2→ODDAL
(dowód anty-maskujący zreprodukowany niezależnie, na nowych celach, oba gate'y
czerwienieją) 3→ODDAL (stub referowany wyłącznie z własnego testu) 4→ODDAL
(allowlista czysta, zero zmian w gra/src|gra/data) 5→ODDAL (pole wymagane typem,
uzupełnienie kontraktu, nie osłabienie) 6→ODDAL (fail zgłoszony uczciwie,
asercja i fixture wokół niej bajt-identyczne z bazą) 7→ODDAL (5/5 bramek
referencyjnych + tsc zielone, własne uruchomienie)
