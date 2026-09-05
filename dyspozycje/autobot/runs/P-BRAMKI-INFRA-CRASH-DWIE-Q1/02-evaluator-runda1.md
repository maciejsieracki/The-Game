# Evaluator — runda 1 — P-BRAMKI-INFRA-CRASH-DWIE-Q1

MODEL+EFFORT: Sonnet 5, effort high.
Baza worktree potwierdzona: `git -C /home/user/wt-bramki-infra-crash log -1` →
commit `0da4a5ef` (Operator, runda 1), rodzic-baza `6b81abf4` — zgodnie z dispatchem.

## Metoda

Zero zaufania do raportu Operatora — każde poniższe stwierdzenie ma dowód z własnego
uruchomienia (komenda + wynik), nie z opisu.

## 1. Uruchomienie obu bramek (własne)

`node gra/tools/map-field-battle-test.cjs` → **19 ok, 1 fail**, exit 1. Zgodne z
raportem. Policzone `assert(` w pliku: 21 wystąpień = 1 definicja funkcji (linia 66)
+ 20 wywołań = 19+1 potwierdzone 1:1, brak "cichych" asercji pominiętych.

`node gra/tools/entity-card-contract-test.cjs` → **75 pass, 0 fail**, exit 0. Zgodne
z raportem.

`node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`, bo stąd wskazuje
`node_modules`) → exit 0.

5 bramek referencyjnych, własne uruchomienie: `logic-test` 213/213, `tech-tree-test`
19/19, `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — brak
regresu, zgodne z raportem.

## 2. Dowód anty-maskowania — reprodukcja WŁASNA (nie z opisu Operatora)

**Bramka 2:** podmieniłem `gra/src/ui/entityCards/slug.ts:46` regex diakrytyków
`[ąćęłńóśźż]` → `[żąę]` (celowe okrojenie). Wynik: `71 pass, 4 fail` (FAIL na
`slugify("Łucznik")`, `slugify("Koło")`, `slugify("Rydwan (woły)")`,
`unitToSlug === slugify`). Cofnięte `git checkout --`, `git status --porcelain`
czysty. Bramka realnie mierzy, nie jest zaślepiona.

**Bramka 1:** podmieniłem `gra/src/game/siegeDefenders.ts:29`
`return defenderUnitsNearCity(...).length > 0;` → `return false;`. Wynik: fail z 1→3
(`garrison unit = defenders`, `planOpenCityFieldBattle: miejsce = city name`) +
`TypeError: Cannot read properties of null (reading 'preBattle')` (downstream, plan
wyszedł `null`). Cofnięte, `git status --porcelain` czysty. Zgodne 1:1 z opisem
Operatora — nie tylko liczbowo, ale dokładnie te same nazwy asercji.

## 3. Granice / allowlista

`git diff 6b81abf4 --stat`: tylko 4 pliki — raport Operatora,
`gra/tools/.stubs/map-field-battle-muzyka-stub.ts` (NOWY, zgłoszony), oraz oba pliki
testowe z allowlisty. `git diff 6b81abf4 --stat -- gra/src gra/data` → **pusty**,
zero zmian w drzewie gry. `git diff --check` → czysty (brak whitespace-conflict).
Stub sprawdzony grepem: referowany WYŁĄCZNIE z `map-field-battle-test.cjs` (nie z
`vite.config.ts` ani z `gra/src`) — nie wycieka do kodu produkcyjnego/przeglądarki.
Wzorzec (stub całego modułu na granicy `onResolve`) potwierdzony jako już istniejący
w repo (`audio-stub.ts`, `recruit-strip-muzyka-stub.ts` i 60+ analogicznych w
`gra/tools/.stubs/`), nie ad-hoc wynalazek.

## 4. Czy realny fail (bramka 1) został zgłoszony czy po cichu przykrojony

Assercja `collectBattleRoster atk: adjacent scout excluded` (linia ~156) —
porównanie z bazą `6b81abf4` (`git show 6b81abf4:gra/tools/map-field-battle-test.cjs`)
potwierdza IDENTYCZNĄ treść i fixture wokół niej, nieedytowane. Diff Operatora w tym
pliku dodaje wyłącznie: stub-plugin, `buildSync`→`build` async, i pole
`fortifyScaledDefFor` w obiekcie `deps` przekazywanym do `planOpenCityFieldBattle`
(linia ~230) — nigdzie w pobliżu zakwestionowanej asercji. Pole
`fortifyScaledDefFor` sprawdzone jako realnie wymagane przez interfejs
`MapFieldBattleLaunchDeps` (`gra/src/battle/mapFieldBattle.ts:52-77`) — uzupełnienie
fixture, nie osłabienie kontraktu. Fail zgłoszony jawnie w raporcie, nie ukryty.

## Wynik kontroli

Wszystkie 5 kryteriów końca z `00-dispatch.md` zweryfikowane własnym uruchomieniem
i potwierdzone. Shim naprawia URUCHAMIANIE (dowód anty-maskowania reprodukowany
niezależnie na obu bramkach), nie wycisza pomiaru. Brak naruszeń allowlisty, brak
zmian w `gra/src/**`/`gra/data/**`, `git diff --check` czysty.

ZARZUTY: brak.

STATUS: PASS
DOMAIN: INFRA
TEMAT: P-BRAMKI-INFRA-CRASH-DWIE-Q1
GOAL: obie bramki dobiegają do końca i wykonują swoje asercje
ZMIANY/COMMIT: brak nowych zmian (weryfikacja); commit sprawdzany `0da4a5ef`
TESTY: bramka1 19/20 (własne uruchomienie, zgodne); bramka2 75/75 (własne
uruchomienie, zgodne); tsc --noEmit OK (z gra/); 5 bramek ref bez regresu
(213/19/33/13/6, wszystkie własnym uruchomieniem); anty-maskowanie zreprodukowane
niezależnie na obu bramkach
BLOKADY: brak proceduralnych; 1 realny fail merytoryczny w bramce 1
(`collectBattleRoster` vs `collectAtkRosterNearCity`, drift w wykluczaniu
zwiadowcy) — zgłoszony przez Operatora, potwierdzony przeze mnie jako realny i
niezasłonięty, do decyzji właściciela/kolejnego tematu, nie do naprawy tu
RUNDY: 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
