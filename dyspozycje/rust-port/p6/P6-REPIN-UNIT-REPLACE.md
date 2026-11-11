# P6-REPIN-UNIT-REPLACE — „Zastąp” (gracz i AI): port do Rust

TEMAT: R-RUSTPORT-REPIN-UNIT-REPLACE-Q1 · RUNDA 2/5 (po FAIL rundy 1) · DOMAIN: GAME (RUST)
BAZA RUST: `origin/rust-port/parity-v2` = `a006068f1` · BAZA WEB: `origin/main` = `cffe39cb9`
Zakres decyzji właściciela: „Zastąp” = PEŁNY koszt rekrutacji nowej jednostki (Pieniądz + surowiec z puli państwa), zachowanie wyszkolenia/HP/wodza, bez Manpower, ta sama funkcja dla gracza i AI.

Legenda: ZMIERZONO = wynik `grep`/`git show`/`cargo test` podany w wierszu; NIE_ZMIERZONO = nie sprawdzono w tej rundzie; ZAŁOŻENIE = decyzja w kodzie/dokumencie bez dowodu z weba.

## 1. Mapowanie web → Rust (stan po rundzie 2)

| Web (origin/main) | Rust (`domain/unit_replace.rs` jeśli nie zaznaczono) | Status | Dowód |
|---|---|---|---|
| `unit-replace-cost.ts` `unitReplaceFullCost` | `unit_replace_full_cost` (NOWY) → `building_costs::p6_7b::unit_stock_cost` (ISTNIEJE, ZMIERZONO `building_costs.rs:884`) | ZGODNE | 80 wektorów kosztu (75 jednostek z `units.json` + 5 brzegowych) |
| `unitReplaceStockMissing` / `canAffordUnitReplace` | `unit_replace_stock_missing` (→ `p6_7b::missing_stock_for`, ZMIERZONO `building_costs.rs:563`) / `can_afford_unit_replace` (NOWY) | ZGODNE | 84 wektory (koszt × pula × skarbiec) |
| `mergeStockPaid` | `merge_stock_paid` (NOWY) | ZGODNE | 4 wektory |
| `unitReplaceStockMissingLabel`, `unitReplaceStockText`, `stockResourceLabel` | NIE PORTOWANE (tekst UI) | ZAŁOŻENIE: prezentacja poza zakresem logiki. Etykiety surowców istnieją: `building_costs::p6_7b::stock_resource_label` (ZMIERZONO `:631`). Uwaga: web sortuje klucze kosztu wg kolejności wstawiania (surowiec, potem `kon`), `StockRecord` jest `BTreeMap` — kolejność tekstu UI wymaga osobnego wiązania |
| `unit-replace-execute.ts` `executeUnitReplace` | `execute_unit_replace` + trait `UnitReplaceDeps` (NOWY) | ZGODNE | 21 wektorów: sukces, `used`, `gate`, `stock`, `money`, zaokrąglenia, `hp ?? oldMaxHp`, min HP 1, `syncHpMax` (AI), zużycie ruchu i flagi |
| `unit-replace-context.ts` `buildReplaceAvailabilityCtx` | JUŻ W RUST: `recruitment.rs:1393` `build_replace_availability_ctx` (ZMIERZONO) | ZGODNE (tożsamość) | web `{...params}` z wymaganym `empireResourceStock` ↔ Rust `reszta` + `empire_resource_stock: Some(..)`. Bez zmian w tym temacie |
| `ai-unit-replace-plan.ts` `AI_UNIT_REPLACE_MAX_FRACTION` = 0,1 | stała `AI_UNIT_REPLACE_MAX_FRACTION` (NOWY) | ZGODNE | — |
| `loadAiUnitReplaceMaxFraction` | `load_ai_unit_replace_max_fraction(Option<f64>)` (NOWY) | ZGODNE logika; **LUKA DANYCH** (patrz §3, L-2) | 8 wektorów |
| `aiUnitReplaceCap` | `ai_unit_replace_cap` (NOWY) | ZGODNE | 10 wektorów |
| `planAiUnitReplaceOrder` | `plan_ai_unit_replace_order` (NOWY; zwraca indeksy) | ZGODNE | 5 przypadków (remisy, zablokowane, pusta) |
| `aiReplaceKeepsArmyClass` + `armyClassOfTyp` (`ai-army-composition.ts:42–61`) | `ai_replace_keeps_army_class`, `army_class_of_typ` (NOWY; ZMIERZONO brak `army_class` w `a006068f1` przed zmianą) | ZGODNE | 144 pary Typ (12×12, w tym null i spacje) |
| `aiReplaceReserveOk` → `shouldAIPurchaseUnit` | `ai_replace_reserve_ok` → `ai_zakup_jednostki::should_ai_purchase_unit` (ISTNIEJE, ZMIERZONO `ai_zakup_jednostki.rs:41`) | ZGODNE | 27 wektorów × 3 poziomy; parametry 10/3/0 i 0/0/−2 zgodne z `ai-params.json` (ZMIERZONO w wektorach) |

Helper `UnitReplaceDeps` zastępuje closures z webu (`deps.*`) — ten sam kontrakt kolejności wywołań: bramka → koszt → sprawdzenie puli → skarbiec → HP → `setTreasury` → `payStock` → mutacja jednostki.

## 2. Tabela awansów INFANTRY (`UNIT-REPLACE-PROMOTION-TABLE-INFANTRY`, d6341c5e1)

ZMIERZONO (rozstrzygnięcie zarzutu 4 rundy 1):
- Źródło tabeli w webie to pole `Zastąp specjalnie` w `gra/data/units.json` (nie w `gra/src`). Przypięcie pełnej zawartości: `gra/tools/unit-replace-promotion-table-test.cjs` (`EXPECTED_TABLE`).
- W Rust pole istnieje: `rust-port/engine/data/units.json` oraz `zastap_specjalnie` w `src/data/units_combat.rs:141`.
- Porównanie wartości (75 jednostek, `python3` na obu plikach): **21 różnic**, we wszystkich web ma cel a Rust `—`. W Rust niepusty wpis są tylko 2 (zgodne z „dwa istniejące wpisy sprzed tematu”: Wojownik mykeński, Wojownik tyrreński), web ma 23. Przykłady: `Wojownik` (web `Włócznik`, Rust `—`), `Hastati` (web `Evocati`, Rust `—`), `Falanga` (web `Hieros Lochos (Święty Zastęp)`, Rust `—`).
- Wniosek: tabela awansów piechoty **nie została przeniesiona do danych Rust**. Nie jest to „niezweryfikowane” — jest to zmierzona luka danych (L-1). Nie ma w Rust stałej tabeli awansów w `ai_era_unit_promotion.rs` (moduł ma tylko trait `AiEraPromotionDeps`), więc wybór celu zamiany dla piechoty w Rust zależy od danych, które są niepełne.
- Naprawa (poza allowlistą tego tematu, bo dotyczy `units.json`): osobny temat danych `R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1`, z pinem EXPECTED_TABLE i pełnym `cargo test`.

## 3. Luki (jawna lista)

- **L-1 (dane, zmierzone):** tabela awansów INFANTRY w `rust-port/engine/data/units.json` niepełna: 21/23 wpisów brakuje. Patrz §2.
- **L-2 (dane, zmierzone):** klucz `ai_zamiana_jednostek_limit_udzial` (web `gra/data/ai-params.json`, wartość 0,1, sekcja §9) **nieobecny** w `rust-port/engine/data/ai-params.json` (ZMIERZONO `git grep`). Logika Rust przyjmuje `Option<f64>` i zwraca domyślne 0,1 zgodnie z webem; podpięcie wartości z danych do wywołania = wiązanie wiring (poza tym tematem).
- **L-3 (wiring, nie zrobione):** `execute_unit_replace` i `ai_replace_*` NIE są wpięte w turę ani w komendy gracza/AI. Dispatch zaznacza to jako dług do serii W („NIE BLOCK”). Wiązanie wymaga mapowania `UnitDef`/`City`/`Unit` na `UnitReplaceTarget` i `UnitReplaceDeps` — osobny temat.
- **L-4 (UI):** etykiety i tekst kosztu (`unitReplaceStockText`, `unitReplaceStockMissingLabel`) nie są portowane (ZAŁOŻENIE: prezentacja). Kolejność kluczy w tekście wymaga wiązania z kolejnością wstawiania.
- **L-5 (zakres pomiaru):** shim `shouldAIPurchaseUnit` w wektorach (`ai-purchase-web.ts`) — ZMIERZONO w tej rundzie, że logika jest identyczna z `origin/main` `gra/src/game/ai.ts:7332` (ta sama kolejność warunków i wzory). Nie sprawdzono w tej rundzie zgodności kopii w `ai-army-composition.ts` poza `armyClassOfTyp` (skopiowany 1:1, `:42–61`).

## 4. Wektory i odtworzenie

- Generator: `rust-port/engine/tests/p6_repin_unit_replace_vectors/gen-unit-replace-vectors.cjs`; wejście: bundle esbuild `ur-entry.ts` z `origin/main` (`gra/src/game/unit-replace-{cost,execute,context}.ts` + `ur-plan-shim.ts` (= `ai-unit-replace-plan.ts` z przepiętymi importami) + `ur-army-shim.ts` (= `armyClassOfTyp`) + `ai-purchase-web.ts`); dane: `gra/data` z `origin/main`.
- Kroki: `git archive origin/main gra/src gra/data | tar -x -C <katalog poza repo>`; `npm i esbuild@0.24.2`; `esbuild ur-entry.ts --bundle --format=cjs --platform=node --outfile=ur-bundle.cjs`; `node gen-unit-replace-vectors.cjs ur-bundle.cjs <gra/data> unit-replace-vectors.json`.
- Wynik generatora: `cost=80 afford=84 execute=21 plan=5 reserve=27` (+ `cap`, `armyKeep=144`, `merge=4`, `maxFraction=9`).
- Testy: `tests/p6_repin_unit_replace_pure.rs` (7 testów), `tests/p6_repin_unit_replace_execute.rs` (1 test).

## 5. Bramki (ZMIERZONO w worktree `wf/R-RUSTPORT-REPIN-UNIT-REPLACE-Q1`)

- `rustfmt --edition 2021 --check` na 3 nowych plikach: exit 0.
- `cargo clippy --all-targets -- -D warnings`: czysto (exit 0).
- `cargo test --lib`: 28 passed, 0 failed.
- `cargo test --test p6_repin_unit_replace_pure`: 7 passed, 0 failed.
- `cargo test --test p6_repin_unit_replace_execute`: 1 passed, 0 failed.
- Nie zmieniano danych ani pinów istniejących testów (`units.json`, `ai-params.json` nietknięte), więc pełny `cargo test` po partiach nie był wymagany przez dispatch; NIE_ZMIERZONO pełny przebieg wszystkich binarek.
- Ustawienia: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w worktree (`target-ur`, usuwany po bramce).

## 6. Założenia (rozstrzygnięte bez pytania ABC)

- Z-1: stan jednostki w Rust to konkretna struktura `UnitReplaceTarget` (pola web: typeId, category, hp, hpMax, ruchLeft, replaceUsedThisTurn), a nie generyk `U`. Wiring zmapuje pola istniejącej jednostki.
- Z-2: `ai_zakup_jednostki::should_ai_purchase_unit` jest uznane za właściwą implementację `shouldAIPurchaseUnit` (ten sam wzór, zob. §1).
- Z-3: `hasManpower = true` dla zamiany (zamiana nie zwiększa liczby jednostek), zgodnie z komentarzem webu.
- Z-4: wynik `Fail` z powodu `used`/`gate` zwraca koszt 0 i pusty ślad surowców, jak web.
