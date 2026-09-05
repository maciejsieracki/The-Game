# Operator — runda 1 — P-BRAMKI-INFRA-CRASH-DWIE-Q1

MODEL+EFFORT: Sonnet 5, effort medium.
Baza worktree: `6b81abf480f7e95163e88d2bb31072f09ccbed1e` (potwierdzone `git log -1` przed pracą).

## Diagnoza (żądana, nie zgadywana)

**Bramka 1 — `map-field-battle-test.cjs`.** `import.meta.glob` wchodzi transytywnie:
`mapFieldBattle.ts:33` `import { setMood } from '../audio/muzyka-antyczna'` →
`muzyka-antyczna.ts:100-104` importuje z `./filePlayer` → `filePlayer.ts:519` i dalej
(`brazModules`/`introModules`/`dyplomacjaModules`/`dyplomacjaCivModules`/`preBattleModules`/
`bitwaModules`/`zwyciestwoModules`/`porazkaModules`) — 8 wywołań `import.meta.glob` przy
ewaluacji modułu, zanim jakikolwiek kod bramki się wykona.

**Bramka 2 — `entity-card-contract-test.cjs`.** `renderer.ts:19,55` woła
`mountUnitMiniPreview` (`gra/src/ui/unitMiniPreview.ts:141,150`) → `drainQueue()`
(linia 118-122) → `requestAnimationFrame`. `jsdom` domyślnie NIE rejestruje rAF na
`window` (tylko z `pretendToBeVisual: true`), a test nie ustawiał tej opcji ani
`global.requestAnimationFrame`.

## Naprawa (warstwa bramki, zero zmian w `gra/src/**`)

1. `gra/tools/map-field-battle-test.cjs` — dodany `stubMuzykaPlugin` (esbuild
   `onResolve` na `audio/muzyka-antyczna$`) przekierowujący na nowy
   `gra/tools/.stubs/map-field-battle-muzyka-stub.ts` (`export function setMood(){}`).
   Ten sam wzorzec co istniejące `audio-stub.ts` / `recruit-strip-muzyka-stub.ts`
   (stub całego `muzyka-antyczna.ts` na granicy importu, nie `filePlayer.ts` — mniej
   powierzchni, nie trzeba imitować `FilePlaylist`). `mapFieldBattle.ts` używa z tego
   modułu WYŁĄCZNIE `setMood`, więc kontrakt stubu jest kompletny (potwierdzone grepem).
   Skutek uboczny: `esbuild.buildSync` nie przyjmuje pluginów ("Cannot use plugins in
   synchronous API calls") — zamieniony na `await esbuild.build(...)`, reszta pliku
   owinięta w `async function main()`.
2. `gra/tools/entity-card-contract-test.cjs` — `new JSDOM(html, { pretendToBeVisual: true })`
   + `global.requestAnimationFrame`/`global.cancelAnimationFrame` = prawdziwa (timer-based)
   implementacja jsdom, NIE stub w tym pliku. Renderer 3D (`THREE.WebGLRenderer`) i tak nie
   działa pod jsdom (brak WebGL) — `ensureGl()` w `unitMiniPreview.ts` łapie to istniejącym
   `try/catch` i zwraca `null` → fallback tekstowy; brak zmiany zachowania w przeglądarce.

Zero zmian w `gra/src/**` na stałe (patrz dowód anty-maskowania niżej — tymczasowe psucie
było zrobione i cofnięte `git checkout`, `git status` czysty).

## Wyniki bramek PO naprawie (jawnie, także faile)

**Bramka 1: 19 pass, 1 fail.** Realny fail (osobne znalezisko, NIE dotknięty):
`[FAIL] collectBattleRoster atk: adjacent scout excluded` — `collectBattleRoster(hastati,
[hastati, ally, scoutNeighbor, warrior2], 'attacker')` nie wyklucza sąsiadującego
zwiadowcy tak jak robi to `collectAtkRosterNearCity` (test tuż obok, PASS). Możliwy dryf
między dwoma funkcjami roster-atakującego w `battleRoster.ts`.

Po drodze wyszła DRUGA usterka, wyłącznie w samym pliku testu (fixture), niezwiązana z
`import.meta.glob`: obiekt `deps` przekazywany do `planOpenCityFieldBattle` nie miał pola
`fortifyScaledDefFor` (wymaganego przez `MapFieldBattleLaunchDeps`, patrz
`mapFieldBattle.ts:77,206`) — `TypeError: powerScaledDefFor is not a function` w
`preBattleSzanseAtkPct`. Uzupełniłem fixture o `fortifyScaledDefFor: stubDef` (ta sama
funkcja co `unitDefFor`, komentarz w pliku testu tłumaczy czemu). To NIE jest osłabienie
asercji — to brakujący argument testowy, blokujący dobiegnięcie reszty asercji.

**Bramka 2: 75 pass, 0 fail.** Wszystkie asercje kontraktu karty encji (T1 + T1b)
przechodzą realnie po włączeniu prawdziwego rAF.

`tsc --noEmit`: zielone (exit 0).

Pięć bramek referencyjnych, bez regresu:
`logic 213/213`, `tech-tree 19/19`, `research 33/33`, `unit-replace 13/13`, `combat 6/6`.

## Dowód anty-maskowania (zepsuj → zaczerwień → cofnij)

Bramka 1: `gra/src/game/siegeDefenders.ts` `hasCityDefenders` — tymczasowo
`return defenderUnitsNearCity(...).length > 0;` → `return false;`. Wynik: fail
podskoczył z 1 do 3 (`garrison unit = defenders`, `planOpenCityFieldBattle: miejsce =
city name`) + downstream `TypeError: Cannot read properties of null (reading
'preBattle')` w samym pliku testu (bo `plan` wyszedł `null`). Cofnięte `git checkout --
gra/src/game/siegeDefenders.ts`, `git status --porcelain` czysty.

Bramka 2: `gra/src/ui/entityCards/slug.ts` `slugify` — tymczasowo wyłączona podmiana
polskich diakrytyków (regex na nieistniejący wzorzec zamiast `[ąćęłńóśźż]`). Wynik: 4
faile (`slugify("Łucznik")`→`"ucznik"` zamiast `"lucznik"`, itd.), reszta (75-4=71
pozostałych) nadal PASS. Cofnięte, `git status --porcelain` czysty.

Oba dowody: bramka mierzy realnie, nie jest zaślepiona przez naprawę infra.

## Pliki zmienione (allowlista, ścieżki + rola, nie diff)

- `gra/tools/map-field-battle-test.cjs` — plugin stubujący `muzyka-antyczna`, `buildSync`→`build` async, uzupełnienie fixture `fortifyScaledDefFor`.
- `gra/tools/entity-card-contract-test.cjs` — `pretendToBeVisual: true` + globalny rAF/cAF.
- `gra/tools/.stubs/map-field-battle-muzyka-stub.ts` — NOWY, stub `setMood` (plik pomocniczy shimu, w allowliście).

Wszystkie trzy ścieżki w allowliście dispatchu. Brak dotknięcia `gra/src/**`,
`gra/data/**`, `.map-field-battle-bundle.cjs`/`.entity-card-contract-bundle.cjs`
(generowane, nieedytowane ręcznie). `git add` po jawnych ścieżkach (bez `-A`/`.`).

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: P-BRAMKI-INFRA-CRASH-DWIE-Q1
GOAL: obie bramki dobiegają do końca i wykonują swoje asercje (nie "zielono za wszelką cenę")
ZMIANY/COMMIT: patrz sekcja "Pliki zmienione" wyżej; SHA commitu w tym raporcie (patrz git log po commicie)
TESTY: bramka1 19/20 (1 real fail, osobne znalezisko); bramka2 75/75; tsc --noEmit OK; 5 bramek ref bez regresu (213/213, 19/19, 33/33, 13/13, 6/6); dowód anty-maskowania na obu (patrz wyżej)
BLOKADY: brak infra; 1 real fail w bramce1 (`collectBattleRoster` vs `collectAtkRosterNearCity` — drift w wykluczaniu zwiadowcy) do decyzji właściciela/kolejnego etapu, NIE naprawiane samowolnie w `gra/src/**`
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — weryfikacja diagnozy i dowodu anty-maskowania; decyzja właściciela ws. realnego fail w bramce1
DEPLOY/PUSH: NIE WYKONANO
