STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1
GOAL: obrona operatora (runda 5/5) na pięć zarzutów Evaluatora po r5 (commit d525c67a9, FAIL na 795512449 wg FC r4). Zmiany wyłącznie dokumentacyjne plus skrypt porównania i raport; zero zmian w kodzie Rust, testach, gra/, Cargo.*, WERSJE.md, origin/main.
ZMIANY/COMMIT: baza d525c67a9 (operator r5). Commit obrony: patrz pole `sha` w odpowiedzi orkiestratorowi (lokalny, bez push, bez integracji). Zmienione: `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1/02a-obrona.md` (ten plik), `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1/enum-decl.py` (nowy, skrypt porównania), `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1/01-operator-r5.md` (dopisek z wynikiem porównania). `Cargo.lock` lokalny, nie commitowany.
TESTY: patrz sekcja „Bramki obrony" niżej.
BLOKADY: NIE_ZMIERZONO pozostaje dla wierszy 33.10, 33.13, 33.14, 33.35 oraz 35.x (klasyfikacja wg nazwy, D-ST-4). Nie są to zmiany r5 i nie są przedmiotem zarzutów obrony 5 w zakresie 36.x/37.x.
RUNDY: 5/5 (ostatnia; obrona w ramach rundy 5, bez nowej rundy). Ostatni werdykt: FAIL FC r4 (zarzut 1, 140 vs 138).
NASTĘPNY KROK: Evaluator i Final Control na SHA z pola `sha`. Operator nie integruje i nie pushuje.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 (static i pola-funkcje strzałkowe poza enumeracją): PRZYJMUJĘ

Dowód na pinie `07d2fbd72` (`git show`, linie zweryfikowane):
- `:7939` `  private static _threatSlack(threats: ..., col, row): number {` (metoda `static`, poza wzorcem `(async )?[A-Za-z_]\w*\(` bo po `private ` następuje `static `),
- `:12386` `  private readonly _onResize = (): void => { this._syncRendererSize(); };`,
- `:17406` `  private readonly _onKeyManual = (e: KeyboardEvent): void => {` (słowo „manual” w nazwie, więc przechodzi filtr słów kluczowych).

Poprzedni wzorzec nie łapał tych trzech deklaracji. Potwierdzenie: skrypt w trybie `old` (wzorzec z r5 bez zmian) daje 140 linii / 2 × `tri` / 138 deklaracji (zgodnie z r5). Tryb `new` (rozszerzony o `static` i `= (...) =>`) daje 143 linie / 2 × `tri` / 141 deklaracji.

Poprawka:
- §1d (nowa) z wierszami 38.1 `_threatSlack` (BRAK, O), 38.2 `_onResize` (BRAK, G/UI), 38.3 `_onKeyManual` (BRAK, M/L5),
- §0 (akapit zakresu): wzorzec rozszerzony z uzasadnieniem, liczby 143/2/141 (wynik grepu, nie ręcznie),
- §4: klocek K0b (`threat_slack`) jako kandydat na najmniejszy czysty klocek; port NIE wykonany w tej rundzie (zakres docs),
- §5 D-ST-3: doprecyzowany zakres (konstanty `static readonly` i pola nie-funkcyjne poza enumeracją).

Klasyfikacja 38.1 (czysta funkcja): `min_t(|col − t.q| + |row − t.r| − t.range)` po liście zagrożeń, bez `this`, bez stanu; pusta lista daje `Infinity`. Wołana z `_siegeMoveRefused` (`:7963`, wywołania `:7967`, `:7969`) i z `_siegeSafeApproach` (`:8107`, wywołanie `:8109`). Rust: `grep -rn 'threat_slack\|ThreatSlack\|on_resize\|on_key_manual' rust-port/engine/src` → 0 trafień.

Uwaga do decyzji „dopisać poza limitem czy odnotować w D-ST-3”: wybrano dopisanie w obrębie tej samej rundy 5 (wiersze i akapit, bez zmian kodu), bo D-ST-3 nie wystarczał przy wzorcu, który sam zawyżał pokrycie.

### Zarzut 2 (wynik porównania nazwa-po-nazwie nie wklejony): PRZYJMUJĘ

- Skrypt przeniesiono do repo: `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1/enum-decl.py` (argumenty: plik pinu z `git show`, dokument, tryb `old|new`). Odtwarzalny bez ścieżek poza repo.
- Porównanie w kierunku pin → tabela zrobiono ściśle: wszystkie nazwy w kolumnie „Funkcja” (każdy backtick w tej kolumnie, nie tylko pierwszy, bo wiersze 33.5, 33.13, 33.28 itd. mają kilka nazw). Wynik poniżej, wklejony dosłownie:

```
tryb=new
linii wzorca: 143
trafienia tri(: [1303, 1304]
deklaracje unikalne (bez tri): 141
pin -> brak wiersza w tabeli: 0 []
tabela -> nazwa spoza deklaracji wzorca: 44
   SIEGE_NO_BREACH_MAX_ROUNDS, _advanceStep, _battleUnitsForMapExport, _canAttackFrom, _canStrikeTargetFrom, _compactAttackAllowsStep, _enemiesOf, _firstStepAlongPathToAttack, _firstStepTowardDirectedAttack, _firstStepTowardMelee, _makeCanAttackFromTest, _nearestEnemy, _nearestEnemyMelee, _stepToward, _updateFacing, aliveA, armyMoraleRatioWithoutCommander, atakujacy, attachRowBreachPanels, attackerWallEntryIsBreach, autoStormBreach, brokenA, buildSiegeWall, buildWallTower, canShoot, city, cityFortificationKind, combat, commandersToWithdrawAfterArmyBreak, game, hpA, if, isSiege, isSiegeUnit, mapSiegeDetect, meleeBlockedByWall, obronca, private, return, siegeAi, siegeMode, siegeNoBreachMaxRounds, siegeWall, wallEverBreached
```

Interpretacja wyniku w kierunku odwrotnym (tabela → pin). Dispatch pisał „diff zbiorów = 0 po obu stronach”. W tym kierunku wynik NIE wynosi 0 i jest to jawne ustalenie:
- metody klasy `battleScene.ts` spoza filtra słów kluczowych, dopisane do tabeli dobrowolnie (sprawdzone na pinie: 14 nazw, każda ma deklarację `^  (private …)?NAZWA(` lub `NAZWA =`): `_advanceStep`, `_battleUnitsForMapExport`, `_canAttackFrom`, `_canStrikeTargetFrom`, `_compactAttackAllowsStep`, `_enemiesOf`, `_firstStepAlongPathToAttack`, `_firstStepTowardDirectedAttack`, `_firstStepTowardMelee`, `_makeCanAttackFromTest`, `_nearestEnemy`, `_nearestEnemyMelee`, `_stepToward`, `_updateFacing`;
- stałe i pola (nie deklaracje metod): `SIEGE_NO_BREACH_MAX_ROUNDS`, `siegeNoBreachMaxRounds`, `wallEverBreached` (stan);
- funkcje modułowe z importów (`siegeWall.ts`, `siegeAi.ts`, `mapSiegeDetect.ts`, `city-fortification.ts`, `army-leadership.ts`): `buildSiegeWall`, `buildWallTower`, `attachRowBreachPanels`, `siegeWall`, `siegeAi`, `mapSiegeDetect`, `cityFortificationKind`, `attackerWallEntryIsBreach`, `autoStormBreach`, `meleeBlockedByWall`, `armyMoraleRatioWithoutCommander`, `commandersToWithdrawAfterArmyBreak`, `isSiegeUnit`, `canShoot`;
- zmienne lokalne i fragmenty kodu z kolumny uwag (`aliveA`, `brokenA`, `atakujacy`, `obronca`, `hpA`, `city`, `combat`, `game`, `isSiege`, `siegeMode`, `if`, `private`, `return`) — tekst wiersza 13/`_checkEnd`, nie nazwy deklaracji.

Wniosek: kierunek pin → tabela (ten, który decyduje o pokryciu 100% wzorca) daje 0 braków (141/141). Kierunek odwrotny nie jest zerowy z przyczyn opisanych wyżej; nie zawyża pokrycia wzorca.

Uwaga dotycząca wyniku r5: poprzedni dowód r5 („138/138”) był liczony lekko (każdy backtick w całym dokumencie). Powyższy wynik liczy kolumnę „Funkcja” i nadal daje 0 braków, więc twierdzenie pokrycia nie jest zawyżone przez tę lekkość.

### Zarzut 3 (gate `cargo test --test p6_siege_tactics` nie istnieje): PRZYJMUJĘ

- Błąd dispatchu/bramki: w `rust-port/engine/tests` nie ma `p6_siege_tactics.rs`. Są: `p6_siege_tactics_end.rs`, `p6_siege_tactics_gen.mjs`, `p6_siege_tactics_vectors/`. Rzeczywisty target bramki to `p6_siege_tactics_end`.
- Operator r5 nie uruchamiał cargo (zmiany docs), więc błędu nie zauważył; to zgodne z dispatchem r3/r5 („cargo nie jest wymagany”).
- Dla dowodu uruchomiono rzeczywisty target (wynik poniżej w „Bramki obrony”).

### Zarzut 4 (kosmetyka: podsumowanie 1b i `git diff --stat`): PRZYJMUJĘ

- §1b podsumowanie poprawione: `BRAK 3 (2 × G, 1 × M, PORTED 0)`. Wiersze: 36.1 G, 36.2 G, 36.3 M (wcześniej błędnie „2 × G/M”).
- `git diff --stat` z r5: 2 pliki (`P6-SIEGE-TAKTYKA.md` +29/−2 oraz `01-operator-r5.md` +27), nie „1 plik .md”. Stwierdzenie w raporcie r5 było błędne; poprawka w tym pliku i w dopisku do `01-operator-r5.md`.

### Zarzut 5 (klasyfikacje 36.x/37.x na częściowym odczycie): PRZYJMUJĘ dla 36.x/37.x; ODRZUCAM dla reszty jako zarzut do r5

Dla 36.x/37.x przeczytano pełne ciała na pinie (`git show`, `sed`) w tej obronie:
- 36.1 `_isUnitDoctrineAuto` `:17621-17630` — bez gałęzi muru; `_getEffectiveDoctrine`, `ru.unitDoctrine`, `_groupMeta.autoPlay`. Klasa G potwierdzona.
- 36.2 `_doctrineLabel` `:17698-17704` — czysta funkcja nad `GroupDoctrine`, zwraca etykietę UI. G potwierdzona.
- 36.3 `_doctrineMoveDest` `:17931-17963` — gałęzie `skirmish`, `defensive`, `steady` (`_attackFormationRallyPoint`, `_moveTargetForUnit`), `aggressive` (`_chargeMoveDest`), `rally`, fallback `_pickTargetByPriority`; każda z `_destAllowedByBlockade` (`:17809-17815`: `blockadeCol`, bez muru). Klasa M potwierdzona.
- 37.1 `_tickZoom` `:10782-10790` (G, kamera), 37.2 `_tickCameraPanKeys` `:10847-10863` (G, kamera), 37.3 `_sfxRout` `:11134-11150` (G, audio), 37.4 `_isManualInputActive` `:11304-11309` (M, predykat trybu RECZNY/L5), 37.5 `_pickGroundTile` `:11331-11348` (G, raycast UI), 37.6 `_drawMinimap` `:11961-11966` (G, UI). Wszystkie klasyfikacje potwierdzone; zmieniono tylko opis „treść przeczytana w całości”.

Wiersze 33.10, 33.13, 33.14, 33.35 i wszystkie 35.x nadal są klasyfikowane wg nazwy lub częściowego odczytu. Zostają jako NIE_ZMIERZONO w D-ST-4 (bez zmiany w r5 i bez wpływu na pokrycie nazw, które jest 141/141). To ograniczenie, nie błąd r5, dlatego odrzucam to jako zarzut do r5, a odnotowuję jako otwarte.

## Bramki obrony

- `git diff --check` (przed commitem obrony): bez wyjścia (OK).
- `git diff --stat` (commit obrony w stosunku do d525c67a9): tylko pliki `.md` i `enum-decl.py`, brak `.rs`, brak `Cargo.*`.- Skrypt: `python3 -I enum-decl.py <pin> dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md new` → wynik jak wyżej (143 / 2 × tri / 141 / 0 braków).
- cargo (real target, dla dowodu, nie wymagany w docs-only): `cd rust-port/engine && CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=<scratchpad>/target-r5defense cargo test --test p6_siege_tactics_end` → EXIT=0, `test result: ok. 8 passed; 0 failed; 0 ignored`. Target CARGO_TARGET_DIR usunięty po bramce (poza repo).
