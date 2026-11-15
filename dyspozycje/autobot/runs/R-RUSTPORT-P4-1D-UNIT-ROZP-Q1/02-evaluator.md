# 02 — Evaluator r1 — R-RUSTPORT-P4-1D-UNIT-ROZP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1D-UNIT-ROZP-Q1
GOAL: rozpoznanie producentów `UnitViewDto` i `StackViewDto` (#213), bez zmian kodu.
ZMIANY/COMMIT: oceniany commit Operatora `2c78fa153e663497cf8726e1d2fc1761628909c6` (rodzic `83f5fd654` = `origin/rust-port/parity-v2` w chwili oceny; `merge-base --is-ancestor` OK). Ten raport: commit lokalny na `wip/R-RUSTPORT-P4-1D-UNIT-ROZP-Q1-eval` (od `2c78fa153`), bez push.
TESTY: diff `83f5fd654..2c78fa153` = 2 pliki `.md` (152 wstawienia), oba na allowliście (`dyspozycje/rust-port/p4/P4-1D-UNIT-ROZPOZNANIE.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-1D-UNIT-ROZP-Q1/01-operator-r1.md`). `git diff --check 83f5fd654 2c78fa153` → kod 0, brak wyjścia. `cargo fmt/clippy/test` — NIE URUCHAMIANO: zero zmian w `rust-port/**`, drzewo kodu identyczne z bazą parity (dispatch: tylko odczyt). Brak `#[ignore]`/asercji do oceny (brak kodu). Brak zmian w `gra/`, `Cargo.lock`.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora / Final Control; zarzuty 1–3 do uwzględnienia w dokumencie albo w dispatchu Q4.
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja (wyrywkowa, na pinie `07d2fbd72` i bazie `83f5fd654`)

Potwierdzone (plik:linia zgodne co do ±2 linii):
- `pickStackRepresentative` → `pickStackLeader` (`armyMerge.ts:530-535`, `stack-leader.ts:28-41`, filtr `isNonCombatStackMember`); Rust `pick_stack_representative` (`recruitment.rs:691-713`) bez filtra cywilów — ROZBIEŻNE potwierdzone. `StosJednostka` (`:393-412`) bez `category`/`is_general` — potwierdzone.
- `StackVitals.hasCommander` (`armyMerge.ts:1124-1125`, `:1153`); Rust `StackVitals` (`:727-738`) 10 pól, bez `has_commander` — potwierdzone; `StackVitalsDto.has_commander` jest (`view-model/src/units.rs:74`).
- Diff `edb8fb56..07d2fbd72` dla `armyMerge.ts` w części wyświetlania (od `pickStackRepresentative` w dół): tylko hunki `323c526`, `328,333c534` (lider) i `922a1124`, `949a1153` (hasCommander) — „dokładnie dwie zmiany” potwierdzone. Nagłówek `p6_5a_display.rs:3` = pin `edb8fb56` — potwierdzone.
- `compute_stack_display` bez wołającego w `rust-port/engine/src` (tylko definicja i komentarze) — potwierdzone.
- Brak `fn veteran_level`, `sum_roster_field_m` (poza polem domknięcia), `combat_power_full*`, `combat_power_scaled*` w `engine/src` — potwierdzone. `veteran.ts:113` `veteranLevel` → `veteranLevelFromBattles` (0→1, 1–2→2, 3+→3); wektory Q3 „0/1/2/3 → 1/2/2/3” zgodne z pinem.
- `PlayableUnit` (`playable.rs:385-393`): `kind` tylko `Warrior`, `movement: u8` — potwierdzone. `PlayableReplaceUnit` (`:399-423`) z `type_id/category/hp/hp_max/battles_survived/parametry_bonus_proc` — potwierdzone.
- Lokalizacje Rust: `city_growth.rs:2104`, `turn_economy.rs:553`, `combat.rs:778/783`, `unit_health.rs:99/158/171`, `unit_replace_defs.rs:42`, `brake_power_army.rs:71`, `state.rs:1120`, `recruitment.rs:1886` — potwierdzone.
- `syncUnitsRender` (`main.ts:14441-14564`), `unitAttackScore` (`:14436-14438`), `deferredPlayerUnitRevealIds` (`:12781`), `visibleUnitsList` → `unitsVisibleOnMap` (`:13430-13432`), `combatPowerScaledDefFor` (`:9543`), `combatPowerFullDisplayDefFor` (`:33936`) — potwierdzone.

## Zarzuty

1. **`forceVisibleUnitId` — błędny wniosek o redundancji, pozycja NIE_ZMIERZONO jest mierzalna z kodu.** Web dopisuje do `visibleIds` w gałęzi `if (anim?.movingStackIds?.length) {…} else if (forceVisibleUnitId) {…}` (`main.ts:14513-14517`) — czyli `forceVisibleUnitId` NIE trafia do `visibleIds`, gdy trwa animacja stosu. Renderer mimo to pokazuje tę jednostkę (`render/units.ts:6275`: `visible.has(unit.id) || unit.id === this.forceVisibleUnitId`, ustawiane `main.ts:14550` bezwarunkowo). Dokument §2.1 twierdzi, że drugie użycie jest „redundantne przy tym samym id”, a §2.2/§3 Q4 mówi o „dopisach `movingStackIds`/`forceVisibleUnitId`” bez wyłączności `else if`. Skutek: producent wg dokumentu albo zgubi widoczność `forceVisibleUnitId` podczas animacji (jeśli DTO nie przeniesie tego id), albo doda je do `visibleIds` także przy animacji (niezgodne z webem). Kontrakt §3.5 nie ma pola na `forceVisibleUnitId` — to luka kontraktu do jawnego zapisania (P4-1D-Q4 / P4-1G), a wektory Q4 muszą obejmować przypadek „animacja + forceVisible ≠ animowany”. (Dodatkowo `unitForestHexKeys` używa `forceVisibleUnitId` osobno, `main.ts:14558-14561` — poza P4-1D, ale do wzmianki dla P4-1G.)
2. **Pominięty efekt uboczny `syncAllRuntimeUnitHpState()` na starcie `syncUnitsRender` (`main.ts:14445`, definicja `:33110-33122`).** Przy każdej synchronizacji web ustawia `u.hpMax = effectiveRuntimeUnitMaxHp(u)` (`effectiveMaxHp(unitHealth(def), parametry, weteran)`) i przycina `u.hp` do `[0, hpMax]` (nieskończone → `hpMax`; `undefined` zostaje). Dokument w §2.1 klasyfikuje `hp`/`hpMax` jako „CZĘŚCIOWO (tylko w `economy.units`; brak wpisu = brak pola)” — po tej normalizacji `hpMax` na wejściu renderera jest zawsze zdefiniowane, a `hp` przycięte. Producent Q4 (i/lub model Q2) musi odtworzyć tę normalizację (bez mutacji stanu albo jawnie), inaczej `UnitViewDto.hp_max = None`/`hp > hp_max` różnią się od webu. Brak w tabeli §1, w Q2/Q4 i w wektorach.
3. **Ścieżka z jawnym argumentem `list` pominięta.** `syncUnitsRender(list?)` — przy podanym `list` web NIE filtruje mgłą (`main.ts:14452`: `list ?? (fogOn ? visibleUnitsList(...) : units)`); przy `fogOn = false` źródłem są wszystkie `units`. Tabela §1 #15/#16 i Q4 opisują tylko filtr `units_visible_on_map`. Wejście producenta Q4 powinno rozróżniać trzy źródła (jawna lista / mgła / bez mgły), z wektorem dla każdego.

Uwagi drobne (bez wpływu na werdykt): odstępstwo od wzorca grepa z dispatchu (logika w `game/armyMerge.ts`, nie w `render/`) jest uzasadnione i jawnie opisane w `01-operator-r1.md`; kontrakt czytany z `origin/claude/rust-sivvrn` — ujawnione.

## Werdykt

PASS-WITH-NOTES: kryteria końca 1–4 dispatchu spełnione, ustalenia kluczowe (ROZBIEŻNE lider, BRAK `hasCommander`, brak wołającego, brak deps, braki `PlayableUnit`) potwierdzone niezależnie na pinie i bazie. Zarzuty 1–3 dotyczą kompletności wejść producenta Q4 i jednego błędnego wniosku (1); nie unieważniają podziału Q1–Q4, ale muszą trafić do dokumentu lub dispatchu Q4 przed wdrożeniem.
