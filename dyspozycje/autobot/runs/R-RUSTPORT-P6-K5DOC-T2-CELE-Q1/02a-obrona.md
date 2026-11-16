STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T2-CELE-Q1
GOAL: Port wyboru celu wg priorytetow (pin 07d2fbd72) z wektorami, ktorych oczekiwane wyniki pochodza z wykonania pinu, nie z recznej transkrypcji.
RUNDA: obrona Operatora r2 (odpowiedz na zarzuty Evaluatora r1, 02-evaluator.md)
BAZA: 05e405efc (raport Evaluatora r1) na e7b9a2f0d (kod Operatora r1), przodek 126432304 (`git merge-base --is-ancestor 126432304 HEAD` = tak). Worktree przepiety z 459354a12 na 05e405efc (`git reset --hard`, bez zmian lokalnych).
SHA OBRONY: (commit obrony, patrz sekcja DEPLOY/PUSH w raporcie koncowym)

## Odpowiedzi na zarzuty

### Zarzut 1: generator nie wykonuje pinu (transkrypcja JS) — PRZYJMUJĘ
Zarzut trafny: SHA-256 chroni tekst fragmentow, nie zgodnosc transkrypcji JS, a dispatch wymagal wektorow „z wykonania pinu”.
Poprawka (warstwa 2 w `rust-port/engine/tests/p6_k5doc_target_gen.mjs`):
- Metody pina `manhattan` (1917-1919), `desiredHitForDirection` (1956-1960), `_enemiesOf` (8291-8294) oraz `_unitBattleClass`/`_prefsForUnit`/`_priorityScore`/`_pickTargetByPriority`/`_pickAdjacentTargetByPriority`/`_pickRangedTargetByPriority` (17486-17584) sa pobierane przez `git show 07d2fbd72:gra/src/battle/battleScene.ts`, transpilowane przez `ts.transpileModule` (TypeScript z `TYPESCRIPT_JS`, domyslnie jak w `p6_city_towers_gen.mjs`) i WYKONYWANE na obiektach testowych.
- `meleeBlockedByWall` z pina `gra/src/game/city-fortification.ts` (wyszukiwana po nazwie `export function meleeBlockedByWall(`) jest transpilowana i wykonywana tak samo.
- Funkcja `add` sprawdza KAZDY przypadek `pick_*` (wynik pina musi byc rowny `expect` z JS) i KAZDE sprawdzenie celu w zasiegu (`target_in_range`: predykat meleeBlockedByWall pina vs JS dla kazdego wroga). Rozjazd konczy generator bledem.
- Dowod dzialania: zwykly przebieg `node rust-port/engine/tests/p6_k5doc_target_gen.mjs` -> `pin-exec: 2119 sprawdzen zgodnych z wykonaniem pina`, `zapisano 2823 przypadkow`, EXIT 0. `vectors.json` bit-w-bit bez zmian (`git status`: brak zmiany pliku wektorow).
- Dowod czulosci (mutacja JS): w kopii generatora `score += 0.45;` -> `score += 0;` daje `Error: rozjazd wykonanie pina vs JS` (generator konczy sie bledem, zaden plik nie jest nadpisany). Kopia usunieta po tescie.
- Uwaga (zgodnie z duchem zarzutu): mutacja `0.45 -> 0.46` NIE zmienia wyniku (argmin pozostaje ten sam, roznica < 1), wiec nie jest to test czulosci; uzyto mutacji `+= 0` (usuniecie bonusu).
- Pozostaje NIE_ZMIERZONO (poza wykonaniem pina): `relativeHit`/`facingToward`/`oppositeDir` (battleScene.ts poza wycietymi zakresami), `targetInRange`, `rangedTargetInRange`, `takesRangedAction` — sprawdzane tylko reimplementacja JS i wektorami; `_targetInRange` z pina nie jest wykonywany, bo odwoluje sie do sceny (`this.atk/def`, wall state) poza zakresem tej rundy.
- Rust i JS nadal pisal ten sam autor: wykonanie pina wykrywa bledy transkrypcji JS, NIE bledy wspolnego zrozumienia semantyki (ta pozostaje pokryta tylko przez przypadki nazwane i przeglad).

### Zarzut 2: komentarz generatora o meleeBlockedByWall (nie w pinie) — PRZYJMUJĘ
Zarzut trafny: funkcja jest w `gra/src/game/city-fortification.ts` przy pinie 07d2fbd72 (`export function meleeBlockedByWall(ctx: MeleeWallContext)`, `if (ctx.wallBreached === true) return false; return ctx.attackerIsMelee && !ctx.attackerOnWall && ctx.defenderOnWall;`).
Poprawka: naglowek generatora przepisany (dwie warstwy kontroli, lista metod wykonywanych i tych pozostajacych JS). Tresc funkcji jest teraz wykonywana z pina (zarzut 1), nie tylko odtwarzana. Komentarz „nie w pinie / wg Rust” usuniety.
Uwaga: JS uzywa `if (ctx.wallBreached)` (prawdziwosc), pin `=== true`. Dla wejsc typu boolean (jedyne w generatorze: `wallEverBreached` jest boolean) wynik jest identyczny; sprawdzenie pina wykonuje to porownanie na wszystkich przypadkach.

### Zarzut 3: literowka „lukti” — PRZYJMUJĘ
Poprawka: `rust-port/engine/src/domain/siege_tactics_doctrine_target.rs` doc-komentarz pick_adjacent_target_by_priority: „o tym lukti (`relativeHit`)” -> „o tym łuku (`relativeHit`)”. Tylko komentarz.

### Zarzut 4: NIE_ZMIERZONO pelnego `cargo test --all-targets --no-fail-fast` — PRZYJMUJĘ czesciowo (fmt/clippy/generator zmierzone; pelny test NIE zamkniety w tej rundzie)
Zmierzone w tej rundzie w `rust-port/engine` (CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR=/tmp/claude-0/k5doc-target-r2):
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0 (`Finished dev profile`)
- `cargo test --all-targets --no-fail-fast`: NIE_ZMIERZONO w tej rundzie. Uruchomione w tle (log: /tmp/claude-0/k5doc-r2-test.log), ale kompilacja binarek testowych civ-engine nie zakonczyla sie w czasie sesji (ponad 90 min, bez linii `test result` ani `TEST_EXIT`). Proba przerwania procesu i ponownego, weższego uruchomienia zostala odrzucona przez mechanizm uprawnien, wiec pelny wynik NIE jest znany. Nie podaje tu liczby testow. Wynik r1 Operatora (493 ok, EXIT 0, wg raportu Operatora) NIE zostal ponownie potwierdzony w tej rundzie.
- Wykonany wycinek: `cargo test --test p6_k5doc_target` NIE uruchomiony w tej rundzie (brak czasu; cel lock na katalogu buildu zajety przez pelny test).
- generator: EXIT 0, 2119 sprawdzen pina, 2823 przypadkow

## Zakres zmian w rundzie r2
- `rust-port/engine/tests/p6_k5doc_target_gen.mjs` (wykonanie pina + naglowek)
- `rust-port/engine/src/domain/siege_tactics_doctrine_target.rs` (1 linia komentarza)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T2-CELE-Q1/02a-obrona.md` (ten plik)
- `vectors.json`, kod Rust funkcji wyboru celu, `siege_tactics_loop.rs`, `gra/`: BEZ ZMIAN.
- `Cargo.lock`: NIE commitowany.

## Ograniczenia (jawnie)
- Wykonanie pina zalezy od TypeScript dostepnego w srodowisku (zmienna `TYPESCRIPT_JS`); bez niego generator konczy sie bledem, nie przechodzi po cichu.
- Wiersze jednostek nadal syntetyczne (zgodnie z dispatchem), wiec oracle sprawdza logike wyboru, nie stan gry.
- Wiazanie w produkcji (ProdBody, siege_tactics_loop.rs) nie zrobione — T8/#113, zgodnie z dispatchem.
