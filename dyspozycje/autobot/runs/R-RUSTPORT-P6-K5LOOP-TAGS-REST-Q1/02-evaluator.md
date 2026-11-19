# R-RUSTPORT-P6-K5LOOP-TAGS-REST-Q1 — Evaluator r1 (adwersarialny)

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-TAGS-REST-Q1
GOAL: zdjąć z `ProdBody::unported` ostatnie tagi „nieportowane” (dowodca-rout/fade, kontratak-strzelec, krok-naprzod-atak, ucieczka-oblezenie + M19), doktryna-rozkaz-ruchu jawnie uzasadniona; tagi błędów wejścia zostają.
ZMIANY/COMMIT: oceniany HEAD Operatora `4d649d2d2` (kod `cd94d7665`, `24c6e5359`, `faa8841f2`), baza `1e20c2da9` = `origin/rust-port/parity-v2`. Evaluator nie zmienia kodu; jedyny plik: ten raport.
TESTY: fmt EXIT 0; clippy `--all-targets -D warnings` EXIT 0; lista dispatchu + nowy test EXIT 0; pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (partiami, 541 bloków, 4084 passed / 0 failed / 1 ignored sprzed tematu); generatory odtworzone bajt w bajt; mutanty Evaluatora 18: 9 zabitych, 9 przeżyło (2 realne luki pinu, 2 luki łączenia, 5 równoważnych/nieosiągalnych).
BLOKADY: mutanty E4 i E14 (gałęzie pinu osiągalne) przeżywają — kryterium końca „mutanty zabite albo równoważne” niespełnione. Odstępstwo od allowlisty (§3.6–3.7 Operatora) i zmiana kontraktu `flee_after` — do decyzji orkiestratora.
RUNDY: 1/5
NASTĘPNY KROK: Obrona r1, potem Operator r2 (ten sam ID) z poprawkami z §6.
DEPLOY/PUSH: NIE WYKONANO

## 1. Środowisko i uwagi wstępne

- Worktree `wf_332bf894-0ad-2`, HEAD `4d649d2d2`, `merge-base HEAD origin/rust-port/parity-v2` = `1e20c2da9` (zgodne z linią BAZA dispatchu).
- Na starcie worktree miał NIEZACOMMITOWANĄ zmianę w `siege_tactics_loop.rs` (zamiana kolejności `commander_lost` / `check_melee_screen_lost` w `start_rout`). To pozostałość przerwanego wcześniejszego przebiegu Evaluatora (mutant E1, log `mut_E1.log` 01:16), nie kod Operatora. Zapisana w scratchpadzie (`tagsrest/e…/leftover-mutant.diff`) i cofnięta (`git checkout --`) przed jakąkolwiek bramką. Wszystkie wyniki niżej dotyczą czystego `4d649d2d2`.
- Dysk: 7,0 GB na starcie (< 8 GB), więc pełny test partiami po 40 binarek z usuwaniem binarek po partii (R-DYSK-2). W trakcie inny temat zszedł do 2,4 GB wolnego; Evaluator nie startował nowych buildów poza kończonymi bramkami.

## 2. Bramki (odtworzone, kody wyjścia)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `--test p6_k5loop_tags_rest` + lista z dispatchu (`siege_atk_b`, `siege_atk_a`, `siege_def`, `loop_body`, `loop_body_pin`, `outcome_pin`, `close_r4`, `k5doc_t8`, `p4_1i3_actions`, `bridge_contract`) | EXIT 0 (wszystkie `ok`, 0 ignored) |
| pełny `cargo test --all-targets --no-fail-fast` (tło, `setsid nohup`, 15 partii: lib/bins/benches + 539 plików testów) | EXIT 0 we wszystkich partiach; 541 bloków `test result`, 4084 passed, 0 failed, 1 ignored (istniejący `p6_order_lane.rs`) |
| `node p6_k5loop_tags_rest_gen.mjs` + `node p6_k5loop_tags_rest_siege_gen.mjs` | strażniki SHA przechodzą (`tags e30f68e6…`, `489ddf8e…`); 4 pliki wektorów IDENTYCZNE MD5 przed/po (`5681063…`, `c27e116…`, `4371946…`, `461a097…`) |

Brak nowego `#[ignore]`; trailery commitów: tylko `Claude-Session:` (zgodnie z zakazem).

## 3. Zgodność z pinem `07d2fbd72` (tekst czytany `git show`)

- `_startRout` `:9799-9831`: `routed`, `isArmyCommander` → `_removeCommanderMoraleBonus` + `_disableManualIfCommanderLost` PRZED `acted` i `_checkMeleeScreenLost` — port zgodny (kolejność potwierdzona mutantem E1, zabity).
- `_startFade` `:9927-9937`: efekty dowódcy przed `_removeUnitFromScene` — zgodne.
- `_removeCommanderMoraleBonus` `:9993-10005`: `frac <= 0 → continue` (NaN przechodzi), `ratio` z warunkiem `moraleMax > 0` i klamrą `[0,1]`, `base = moraleBaseFor(bu) * 1.5` dla `def`, `morale = min(base, ceil(base*ratio))` — `commander_lost` przepisany 1:1. Iteracja po CAŁEJ stronie łącznie z dowódcą i martwymi (mutanty E3, E20 zabite).
- `_disableManualIfCommanderLost` `:10007-10015`: w AUTO wraca przy `!_manualCommanderGate`; przy bramce i stronie gracza (poza planowaniem) pin PLANUJE pusty `_schedule(0)` (callback nic nie zmienia, bo `_manualMode = false`). Rust go nie planuje — skutek stanu żaden; wpływ na kolejność/zliczanie zegarów NIE_ZMIERZONO (uwaga U4).
- `_defenderCounters` `:9079-9091`: budżet przed typem, `!primaryRanged → true`, inaczej `!canShoot` — kod zgodny (`if da.primary_ranged && da.can_shoot return`), ale POKRYCIE niepełne (E4, §5).
- `_advanceStep` `:8198-8285`: gałąź `_canAttackFrom → _pickAdjacentTargetByPriority → _doAttack` wykonywana przy każdym wejściu — zgodne. Po ruchu callback kończy przy `_canAttackFrom` (`:8223`, `:8277`), więc atak po kroku jest w pinie praktycznie nieosiągalny; `attack_pre` jest więc kodem bez pokrycia (E8/E22/E30, §5).
- `_siegeApproachRestricted` `:7951-7960`: `ru.routed → false`; `mover_routed` ustawiany po `_startRout` w ścieżce okrążenia — zgodne (M19 i T16 zabite).
- `doktryna-rozkaz-ruchu` zostaje: uzasadnienie z pinu (`skirmish` ustawia tylko UI, domyślna `steady` `:17612-17619`) sprawdzone — akceptuję.

## 4. Sonda adwersarialna (Rust-only, nie commitowana)

Kopia `battle` z `p6_k5loop_tags_rest.rs` sparametryzowana morale obu stron: 150 ziaren × 6 morale atakującego × 3 morale obrońcy = 2700 pełnych bitew SiegeLoop+ProdBody z murem, wieżami i dowódcami.

| | HEAD `4d649d2d2` | baza `1e20c2da9` |
|---|---|---|
| aktywacje `Flee` | 4431 | 20694 |
| bitwy z utratą bonusu dowódcy | 109 | 0 (zamiast tego tag `dowodca-rout` ×109) |
| `ucieczka-oblezenie` | 0 | 20694 |
| `ucieczka-konflikt-zegara` | **0** | — |
| `cios-bez-szablonu` | 325 | 325 (bez zmian: istniejący błąd wejścia — jeden szablon ciosu na jednostkę) |

Wniosek: tagi tematu znikają w pełnej bitwie; nowy tag łączenia nie wystąpił w 2700 bitwach (osiągalność nadal NIE_ZMIERZONO, ale nie jest częsta). `cios-bez-szablonu` nie jest skutkiem tematu (identyczna liczba na bazie), ale pokazuje, że kryterium „unported pusty, gdy adapter podał szablony” wymaga od adaptera T6 szablonu ciosu na KAŻDY cel `_pickAdjacentTargetByPriority`, czego `ProdUnit { melee_target, blow }` nie mieści — dług dla T6/#369 (U5).

## 5. Mutanty Evaluatora (18; każdy = jedna podmiana w `siege_tactics_loop.rs`, 10 plików testów z dispatchu + `tags_rest` + `close`)

| # | Mutant | Wynik | Ocena |
|---|---|---|---|
| E1 | `commander_lost` po kaskadzie osłony wręcz w `start_rout` | ZABITY | — |
| E3 | `commander_lost` pomija martwe/uciekające/usunięte | ZABITY | — |
| **E4** | warunek kontrataku `if da.can_shoot` (bez `primary_ranged`) | **PRZEŻYŁ** | REALNA LUKA: pin `:9090` — jednostka nie-główny strzelec (`rangedBase && !primaryRanged`, np. miotacz pilum) z amunicją ZAWSZE kontratakuje. Generator ustawia `primaryRanged = rangedBase = shooter` (`gen.mjs:603-604`), więc kombinacja nigdy nie występuje. |
| E5 | `flag`: oba źródła na tę samą wartość = konflikt | PRZEŻYŁ | luka testu łączenia (np. `dead=true` z wieży i z ucieczki); osiągalne co najmniej teoretycznie |
| E6 | `num`: jw. dla liczb | PRZEŻYŁ | jw. |
| E8 | `attack_pre = dur` → 0 | PRZEŻYŁ | równoważny tylko przy nieosiągalności ataku po kroku (§3); kod bez pokrycia |
| E9 | ratio bez klamry `min(1, …)` | PRZEŻYŁ | równoważny przy niezmienniku `morale <= moraleMax` (`_gainMorale` `:9697` przycina); akceptuję jako równoważny |
| **E14** | `morale = ceil(base*ratio)` bez `min(base, …)` | **PRZEŻYŁ** | REALNA LUKA: obrońca z nieparzystą bazą (`plainBase` 37 w generatorze → `base` 55,5) przy `ratio = 1` daje `ceil` 56 ≠ 55,5. Osiągalne (pełne morale + bonus + utrata dowódcy), wektory tej kombinacji nie trafiły. |
| E15 | tag braku bazy przed testem `frac <= 0` | ZABITY | — |
| E17 | przy zmianie w oknie kopiuj wynik ucieczki w całości | ZABITY | — |
| E18 | ratio liczone względem nowej bazy | ZABITY | — |
| E19 | fade: pomiń dowódcę, gdy `routed` | PRZEŻYŁ | RÓWNOWAŻNY: po pierwszym `commander_lost` wszystkie `frac = 0`, drugie wywołanie to no-op |
| E20 | `commander_lost` pomija samego dowódcę | ZABITY | — |
| E22 | czas zwarcia bez `attack_pre` | PRZEŻYŁ | jak E8 |
| E25 | fade: efekty dowódcy po flagach `removed/dead` | PRZEŻYŁ | RÓWNOWAŻNY: `commander_lost` nie czyta `removed/dead` |
| E30 | `Facing` emitowany przed krokami (`now` bez `attack_pre`) | PRZEŻYŁ | jak E8 |
| E31 | strzelec z amunicją zawsze kontratakuje | ZABITY | — |
| M19 | `routed: false` w `_siegeApproachRestricted` | ZABITY | (dług T2b zamknięty) |

Mutanty Operatora T01–T20 + M19: odtworzone w logu `tagsrest/mutants.log` (21/21 zabitych, T12 po teście dodatkowym) — nie podważam.

## 6. Zarzuty (do Obrony / Operatora r2)

1. **Z1 (FAIL) — E4:** brak wektorów pinu dla obrońcy `rangedBase && !primaryRanged` z amunicją (i bez) atakowanego wręcz. Wymagane: rodzina w `p6_k5loop_tags_rest_gen.mjs` (niezależne `primaryRanged` i `rangedBase`) z licznikiem pokrycia i progiem; E4 musi zginąć.
2. **Z2 (FAIL) — E14:** brak wektora `Math.min(base, Math.ceil(base*ratio))` z niecałkowitą bazą obrońcy przy `ratio = 1` (i `ratio` bliskim 1). Wymagane: wymuszona kombinacja w generatorze (np. `plainBase` nieparzysty, `moraleMaxExtra = 0`, obrońca z bonusem, utrata dowódcy) z licznikiem i progiem; E14 musi zginąć.
3. **Z3 — łączenie `merge_flee_unit` (E5/E6):** brak testu „oba źródła zmieniają pole na tę samą wartość” (oczekiwane: bez tagu). Dodać przypadek (np. `dead`/`removed` i liczba) w `ucieczka_laczenie_ze_zmiana_zegara`.
4. **Z4 — `attack_pre` (E8/E22/E30):** kod czasu ataku po krokach nie ma pokrycia. Albo test jednostkowy, który wymusza atak po kroku i ustala oczekiwane czasy (z uzasadnieniem z pinu, `_schedule(STEP_GAP_MS)` + `_doAttack` w chwili kroku), albo jawny wpis „nieosiągalne w pinie, NIE_ZMIERZONO” jako równoważność mutantów E8/E22/E30 w raporcie r2.
5. **U1 (decyzja orkiestratora) — allowlista:** zmiany w `p6_k5loop_close.rs` i `p6_k5loop_close_r4.rs` (poza listą „DOZWOLONE ZMIANY”). Sprawdziłem: wektory `p6_k5loop_close_*vectors*` nietknięte, nowe asercje nie są słabsze (r4: 400 przypadków `flee` przy murze porównanych pełnym `check_activation` zamiast 20 z tagiem). Merytorycznie konieczne; wymaga wpisu decyzji.
6. **U2 (decyzja orkiestratora) — kontrakt `flee_after`:** twarda asercja „stan bez zmian między start a complete” zastąpiona łączeniem trójstronnym z nowym tagiem `ucieczka-konflikt-zegara`. To decyzja techniczna wykraczająca poza dispatch (nowy tag w `unported`); sonda §4: 0 konfliktów na 2700 bitew. Do wpisu w REJESTR-RUST (D-…) przez orkiestratora.
7. **U3 — `p6_k5loop_siege_def::ucieczka_okrazenia_przy_murze_z_terenem_wykonana`:** warunek `!(moved || c.removed || unit_cell == start_cell)` przepuszcza jednostkę, która w ogóle się nie ruszyła; zgodność liczbowa jest w `tags_rest::siege` (rodzina `surround` 140), więc to nie osłabienie wyniku, ale asercja w tym pliku jest prawie pusta — zalecane `moved || c.removed` albo uzasadnienie przypadków `stuck`.
8. **U4 — `_disableManualIfCommanderLost`:** pin planuje pusty timer `_schedule(0)` przy `_manualCommanderGate` i stronie gracza także w AUTO (poza planowaniem klonów). Rust nie planuje. Brak skutku stanu; wpływ na kolejność/limit zdarzeń NIE_ZMIERZONO — wpisać do Długów T7 (#369).
9. **U5 — dla T6/#369:** `cios-bez-szablonu` (325 w sondzie, bez zmian względem bazy) — adapter musi dostarczać szablon ciosu dla celu `_pickAdjacentTargetByPriority`, a `ProdUnit` ma jeden `blow`/`melee_target`; bez tego kryterium „unported puste” w pełnej bitwie AUTO nie jest osiągalne.
10. **U6 — generator:** `EXPECTED_TAGS_SHA256 = process.env.P6_TAGS_SHA_PROBE ? tagsDigest : '…'` — zmienna środowiskowa wyłącza strażnika SHA. Zalecane usunięcie furtki (strażnik ma rzucać zawsze).
11. **U7 (stara rozbieżność, poza tematem):** pin zmniejsza `ammoLeft` przy wystrzale (`:9191`), Rust w `complete_shot` (trafienie). Dla nowej gałęzi kontrataku strzelca bez znaczenia przy bramce `busy` w AUTO, odnotowane.

## 7. Werdykt

FAIL: implementacja zgodna z tekstem pinu i bramki zielone (pełny test EXIT 0), ale dwie gałęzie pinu w nowym kodzie (`!primaryRanged` w `_defenderCounters` i `Math.min(base, …)` w `_removeCommanderMoraleBonus`) nie są pokryte wektorami — mutanty E4 i E14 przeżywają, a dispatch wymaga zabicia albo równoważności. Poprawki są lokalne (generator + progi pokrycia + 1–2 testy), bez zmiany kodu produkcyjnego.

## 8. Sprzątanie

Target `tagsrest/evs/tfull` usunięty po bramkach; skrypty i logi zostają w scratchpadzie (`tagsrest/evs/`, `tagsrest/e…/mut_*.log`, `tagsrest/e…scripts/mut.py`). Worktree czysty poza tym raportem.
