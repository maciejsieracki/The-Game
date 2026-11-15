# 02a — Obrona Operatora — R-RUSTPORT-P4-1D-UNIT-ROZP-Q1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1D-UNIT-ROZP-Q1
GOAL: rozpoznanie producentów `UnitViewDto` i `StackViewDto` (#213), bez zmian kodu.
ZMIANY/COMMIT: `dyspozycje/rust-port/p4/P4-1D-UNIT-ROZPOZNANIE.md` (poprawki z zarzutów 1–3) i ten plik. Commit lokalny na gałęzi `obrona/R-RUSTPORT-P4-1D-UNIT-ROZP-Q1` od `2e04178ff` (Evaluator r1, rodzic `2c78fa153`, Operator r1). Baza parity bez zmian: `83f5fd654`. Bez push.
TESTY: `git diff --check` czysto. Cargo nie było uruchamiane, bo dispatch dopuszcza tylko odczyt, a zmiany są wyłącznie w `.md` z allowlisty. Każdy dowód odczytany z pinu `07d2fbd72` przez `git show` (`gra/src/main.ts`, `gra/src/render/units.ts`, `gra/src/game/visibility.ts`) i z bazy (`rust-port/view-model/src/units.rs`).
BLOKADY: brak.
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Zarzut 1 — `forceVisibleUnitId` (else-if, luka kontraktu): PRZYJMUJĘ

Dowód z pinu:
- `main.ts:14513-14517`: `if (anim?.movingStackIds?.length) { …add(sid) } else if (forceVisibleUnitId) { display.visibleIds.add(forceVisibleUnitId); }`. Dopis odbywa się rozłącznie.
- `main.ts:14550`: `unitRenderer.setForceVisibleUnitId(forceVisibleUnitId)` jest wołane bezwarunkowo.
- `render/units.ts:6275`: `show = visible.has(unit.id) || unit.id === this.forceVisibleUnitId`.

Wniosek r1, że drugie użycie jest „redundantne”, był błędny. Przy animacji stosu jest ono jedynym powodem, dla którego żeton jest widoczny. Dodatkowy skutek: id spoza `visibleIds` nie dostaje ikon głodu ani deficytu, bo pętla w `:14528` iteruje po `display.visibleIds`.

Poprawki w dokumencie:
- §0 pkt 5: dopisana rozłączność.
- §2.1: wniosek r1 przekreślony i zastąpiony opisem z dowodem. Dopisana luka kontraktu §3.5 (brak pola na `forceVisibleUnitId`) z rozstrzygnięciem technicznym w Q4/P4-1G.
- §2.2: wiersz `visibleIds` dostał „ALBO (`else if`)”.
- Q4: rozłączne wejście oraz przeniesienie `forceVisibleUnitId` w wyniku. Dodane wektory „animacja stosu + `forceVisibleUnitId` ≠ animowany” i „`forceVisibleUnitId` bez animacji”.
- §4: pozycja NIE_ZMIERZONO oznaczona jako ROZSTRZYGNIĘTE z kodu.

## Zarzut 2 — normalizacja `syncAllRuntimeUnitHpState()`: PRZYJMUJĘ

Dowód z pinu:
- `main.ts:14445`: wywołanie na starcie `syncUnitsRender`.
- `:33120-33122`: pętla po wszystkich `units`, nie tylko po `src`.
- `:33110-33118`: `u.hpMax = effectiveRuntimeUnitMaxHp(u)`. Gdy `hp === undefined`, wartość zostaje bez zmian (`:33113`). Gdy `hp` jest skończone, przycięcie do `[0, hpMax]`. W pozostałych przypadkach (Infinity, NaN) `hp = hpMax`.
- `:33101-33106`: `effectiveMaxHp(unitHealth(def), unitParametryBonusFrac(u), veteranCombatBonusFrac(u))`.

Poprawki w dokumencie:
- Nowy §0 pkt 6.
- Wiersz 15a w tabeli §1 (Rust: składnik `effective_max_hp`, `unit_health.rs:158`; funkcja synchronizacji BRAK).
- Wiersz `hp`/`hpMax` w §2.1: `hp_max` nie może być `None`, a `hp > hp_max` jest niedopuszczalne.
- Q4: normalizacja w zakresie (bez mutacji stanu albo jawnie w Q2, decyzja do `REJESTR-RUST.md`) oraz wektory: brak `hpMax`, `hp > hpMax`, `hp < 0`, Infinity/NaN, bonus parametrów i weteran.

Nowe pozycje NIE_ZMIERZONO w §4:
- `hp === undefined` przeżywa normalizację, a `UnitViewDto.hp: f64` jest nieopcjonalne (`VM:28-29`).
- Nie wiadomo, czy `unitCardCombatFor(...).hpMaxEffective` (`maxHpOf`, `main.ts:14484`) jest zawsze równe `effectiveRuntimeUnitMaxHp`.

## Zarzut 3 — trzy źródła listy jednostek: PRZYJMUJĘ (z uściśleniem)

Dowód z pinu: `main.ts:14452` `const rawSrc = list ?? (fogOn ? visibleUnitsList(sharedVis!) : units)`.

Uściślenie z pinu: jedyni wołający z argumentem to `main.ts:13502` `syncUnitsRender(visibleUnitsList(vis))` i `:13511` `syncUnitsRender(visibleUnitsList(ALL_KEYS))`. Pozostałe 63 wywołania są bez argumentu. Jawna lista w pinie też przechodzi więc przez `unitsVisibleOnMap` (`visibility.ts:327-336`), tylko z innym zbiorem heksów niż `currentVisible()`, na przykład `ALL_KEYS`: gracz zawsze, garnizon wroga ukryty. Z kolei ścieżka `!fogOn` bez listy daje wszystkie `units` bez filtra, także garnizony wroga.

Poprawki w dokumencie:
- Nowy §0 pkt 7.
- Tabela §1: #15 opisuje trzy źródła, #16 zastrzega, że filtr nie działa w wariancie (c).
- Q4: jawne wejście `ExplicitList` / `Fog(visible_hexes)` / `NoFog`, z wektorem dla każdego (garnizon wroga: podany przez wołającego / ukryty / widoczny).

## Podsumowanie

3/3 zarzuty PRZYJĘTE. Wszystkie poprawki dotyczą tylko dokumentu z allowlisty. Ustalenia kluczowe r1 nie zmieniają się: ROZBIEŻNE lider, BRAK `hasCommander`, brak wołającego `compute_stack_display`, brak deps, braki w `PlayableUnit`. Podział Q1–Q4 zostaje, a Q4 ma uzupełnione wejścia i wektory.
