# R-RUSTPORT-P6-K5LOOP-TAGS-REST-Q1 — Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-TAGS-REST-Q1
GOAL: usunąć z `ProdBody` pozostałe tagi `unported` (dowodca-rout, dowodca-fade, kontratak-strzelec, krok-naprzod-atak, ucieczka-oblezenie z długiem M19); doktryna-rozkaz-ruchu zostaje jawnie z uzasadnieniem; tagi błędów wejścia zostają.
ZMIANY/COMMIT: baza `1e20c2da9` (origin/rust-port/parity-v2); gałąź `rust-port-wip/tags-rest-q1`; kod `cd94d7665` (WIP 1/2), `24c6e5359` (WIP 2/2), `faa8841f2` (test T12, bitwa AUTO, clippy); raport = commit z tym plikiem (SHA w StructuredOutput).
TESTY: fmt EXIT 0; clippy `--all-targets -D warnings` EXIT 0; lista z dispatchu + nowy test + close/close_r2/close_r3 EXIT 0 (§4); pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (4084 passed, 0 failed, 1 ignored sprzed tematu); mutanty 21/21 zabite.
BLOKADY: brak technicznych; odstępstwo od allowlisty do decyzji orkiestratora (§3.6–3.7: `p6_k5loop_close.rs`, `p6_k5loop_close_r4.rs`, tylko asercje, wektory JSON r1–r4 nietknięte).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO

## 1. Pin (07d2fbd72, `gra/src/battle/battleScene.ts`) — co jest portowane

| Tag usunięty | Pin | Port w `siege_tactics_loop.rs` |
|---|---|---|
| `dowodca-rout` | `_startRout` :9799, gałąź dowódcy :9803-9806 → `_removeCommanderMoraleBonus` + `_disableManualIfCommanderLost` | `start_rout` → `commander_lost` |
| `dowodca-fade` | `_startFade` :9927, gałąź dowódcy :9929-9932 (przed flagami removed/dead) | `start_fade` → `commander_lost` przed `removed`/`dead`/`release_tile` |
| (wspólne) | `_removeCommanderMoraleBonus` :9993-10005: `frac = armyLeaderMoraleBonusFrac ?? 0`; `if (frac <= 0) continue` (NaN przechodzi dalej); `ratio = moraleMax>0 ? max(0,min(1,morale/moraleMax)) : 0`; `frac = 0`; `base = moraleBaseFor(bu)*(def?1.5:1)`; `moraleMax = base`; `morale = min(base, ceil(base*ratio))` | `fn commander_lost` 1:1 (js_max/js_min ze znakiem zera, mnożnik 1.5 dla obrońcy); `_disableManualIfCommanderLost` :10007-10015 to no-op w AUTO (komentarz) |
| `kontratak-strzelec` | `_defenderCounters` :9079-9091: kontratak głównego strzelca tylko gdy `!canShoot` (:1457-1459) | `counter_strike`: `if da.primary_ranged && da.can_shoot { return; }` |
| `krok-naprzod-atak` | `_advanceStep` :8198-8285, gałąź ataku :8241-8245 (`_pickAdjacentTargetByPriority` → `_doAttack`) | `advance_step` bez parametru `from_doctrine`; `Attack` zawsze wybiera `pick_adjacent_target_by_priority`; czas `attack_pre` (czas kroku przed ciosem) dodany do strzału/zwarcia |
| `ucieczka-oblezenie` + M19 | `_fleeStep` :9845-9897 → `_doMove` :8689 (`_siegeMoveRefused` :7963); `_siegeApproachRestricted` :7951-7960 zwraca false dla `routed` | gałąź `routed` i ucieczka z okrążenia wykonywane z terenem; po `_startRout` w ścieżce okrążenia `self.mover_routed = st2.unit(unit).c.routed` (M19: odmowa podejścia nie dotyczy rozbitych) |

`doktryna-rozkaz-ruchu` ZOSTAJE (komentarz w kodzie): doktryna `skirmish`/rozkaz ruchu ustawia wyłącznie UI gracza (`_setGroupDoctrine` :17864, `_setUnitsDoctrine` :17666; domyślnie `steady` :17612-17619), `_executeSkirmishDoctrineStep` :18087-18122 wymaga trybu ręcznego → temat K5EXEC-T3 (#268). W AUTO nieosiągalne.

Tagi błędów wejścia zostają: `*-brak-terenu`, `*-bez-szablonu`, `ucieczka-routed`. Nowe tagi wejścia/kontraktu: `dowodca-bez-bazy-morale` (adapter nie podał `morale_base_plain` dowódcy strony), `ucieczka-konflikt-zegara` (§2).

## 2. Nowe pola i kontrakt

- `ProdBody::army_leader_bonus_frac: [Vec<f64>;2]` (domyślnie 0.0) i `ProdBody::morale_base_plain: [Vec<Option<f64>>;2]` (domyślnie None) — wejścia z adaptera (T6). Brak bazy przy dodatnim/NaN frac → tag `dowodca-bez-bazy-morale`, bez zmiany morale.
- Ucieczka przy murze: dotąd twarda asercja „kontrakt flee_after” (stan między `start` a `complete` niezmieniony). Przy murze wieże (`TowerHit`) i `BodyTimer` mogą zmienić stan w tym oknie, więc `complete` łączy trójstronnie (`merge_flee_unit`: przed / po zegarze / po ucieczce, pole po polu): pole zmienione tylko przez zegar zostaje, tylko przez ucieczkę bierze wynik ucieczki, przez oba na różne wartości → wartość zegara + tag `ucieczka-konflikt-zegara`. Asercja „kontrakt flee_after” dla niezgodnej jednostki zostaje (test `should_panic`).

## 3. Zmiany istniejących asercji (D-INT-2), każda z dowodem

### 3.1 `p6_k5loop_outcome_pin.rs` — `dowodca_jest_nieportowany_i_oznaczony`
Stare: oczekiwany tag `dowodca-fade` po zabiciu dowódcy. Nowe: `dowodca_zabity_zdejmuje_bonus_morale_strony` (obrońca 1: frac 0.25, moraleMax 125, morale 100, baza 100 → morale 120, moraleMax 150, frac 0; obrońca 2 bez zmian). Dowód: :9929-9932, :9993-10005 (100·1.5 = 150; ratio 100/125 = 0.8; ceil(120) = 120). Dodane: `dowodca_bonus_bez_bazy_morale_jest_bledem_wejscia` i `dowodca_bonus_przy_zerowym_morale_max_daje_ratio_zero` (moraleMax 0, morale 30, baza 80 → morale 0, moraleMax 120; gałąź `moraleMax > 0 ? … : 0`).

### 3.2 `p6_k5loop_siege_def.rs` — `check_def_with` i `ucieczka_okrazenia_przy_murze_z_terenem_jawny_tag`
Stare: `want_unported` dla ucieczki z terenem = `ucieczka-oblezenie`; test oczekiwał tagu. Nowe: z terenem brak tagu; bez terenu `ucieczka-routed` (bez zmian). Generator tego pliku zatrzymuje `_fleeStep` przy murze atrapą, więc dla przypadku „ucieczka z terenem przy murze” `check_def_with` nie porównuje już liczb (asercja z komunikatem kieruje do `p6_k5loop_tags_rest`), a porównanie z WYKONANYM `_fleeStep` pinu przeniesione do `p6_k5loop_tags_rest::siege` (rodziny flee-def, surround). Test przemianowany na `ucieczka_okrazenia_przy_murze_z_terenem_wykonana`: 800 przypadków bez ucieczki — pełne porównanie z terenem; 80 ucieczek z okrążenia — brak tagów, ślad `Flee`, `routed`, wykonany krok albo zniknięcie z pola; start rozbitego: bez terenu `ucieczka-routed`, z terenem brak tagu. Wektory JSON tego pliku nietknięte. Uwaga dla Evaluatora: to przeniesienie porównania, nie osłabienie — liczby ucieczki przy murze porównuje nowy test z pinem (400+220+220+140+40+40 przypadków, §5).

### 3.3 `p6_k5loop_siege_atk_a*`, `p6_k5loop_siege_atk_b*`, `p6_siege_tactics_loop_body*`, `p6_k5doc_t8.rs`, `p4_1i3_actions.rs`
Bez zmian — przechodzą bez modyfikacji.

### 3.6 ODSTĘPSTWO OD ALLOWLISTY: `p6_k5loop_close.rs` — `atak_z_advance_step_jest_oznaczony`
Plik nie jest wymieniony w sekcji „Dozwolone zmiany”, ale jego asercja oczekiwała usuwanego tagu `krok-naprzod-atak`, więc bez zmiany cel dispatchu jest niewykonalny. Stare: `vec![(acting, "krok-naprzod-atak")]`. Nowe: `vec![(acting, "cios-bez-szablonu")]` — ciało wykonuje gałąź ataku pinu (:8241-8245), a adapter w tym przypadku podał `melee_target = None` (niespójne wejście), więc błąd wejścia „brak szablonu ciosu”. Pozostałe asercje (brak ruchu, brak ciosu) bez zmian. Wektory r1 nietknięte.

### 3.7 ODSTĘPSTWO OD ALLOWLISTY: `p6_k5loop_close_r4.rs`
- `ucieczka_przy_murze_jawny_tag` (stare: 20 przypadków flee przy murze → tag `ucieczka-oblezenie`, brak ruchu) → `ucieczka_przy_murze_zgodna_z_pinem`: te same wektory r4 (400 przypadków `flee` z `st.siege_wall_col = 40`) porównane z oczekiwaniem pinu, `unported` puste, ≥150 wykonanych kroków (zmierzone ≥150). Dowód: `_siegeApproachRestricted` :7951-7960 (`routed` → false), więc mur nie zmienia ucieczki w tych wektorach.
- `ucieczka_kontrakt_stanu_miedzy_start_a_complete` (`should_panic "kontrakt flee_after"`) — wyzwalany teraz drugim `start` ucieczki przed `complete` (zmiana stanu przez zegar jest legalna po §2).
- nowy `ucieczka_laczenie_ze_zmiana_zegara` (łączenie trójstronne).
Wektory JSON r1–r4 nietknięte (`git diff --stat 1e20c2da9` nie zawiera żadnego pliku `p6_k5loop_close_*vectors*`).

Decyzja orkiestratora: przyjąć §3.6–3.7 jako konieczne skutki GOAL albo odesłać z poleceniem innego rozwiązania.

## 4. Testy (EXIT)

### 4.1 Bramki statyczne
`cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0.

### 4.2 Lista dispatchu + nowy test (jedno wywołanie, EXIT 0)
bridge_contract 9; p4_1i3_actions 9; p6_k5doc_t8 6; p6_k5loop_close 5; p6_k5loop_close_r2 6; p6_k5loop_close_r3 6; p6_k5loop_close_r4 8; p6_k5loop_outcome_pin 10; p6_k5loop_siege_atk_a 7; p6_k5loop_siege_atk_b 9; p6_k5loop_siege_def 10; p6_k5loop_tags_rest 5; p6_siege_tactics_loop_body 8; p6_siege_tactics_loop_body_pin 2 — wszystkie `ok`, 0 failed, 0 ignored.

### 4.3 Pełny `cargo test --all-targets --no-fail-fast` (tło, setsid nohup)
EXIT=0 na HEAD `faa8841f2`: 541 bloków `test result`, łącznie 4084 passed, 0 failed, 1 ignored (istniejący `#[ignore]` w `p6_order_lane.rs`, sprzed tematu; diff tematu nie dodaje żadnego `#[ignore]`).

## 5. Nowy test `p6_k5loop_tags_rest.rs` i generatory

- `p6_k5loop_tags_rest_gen.mjs` (SEED 6301, 500 sekwencji; wykonuje tekst pinu: `canShoot`, `_startRout`, `_startFade`, `_removeCommanderMoraleBonus`, `_defenderCounters`; strażnik SHA-256 tekstów `e30f68e6…a2e3`; `moraleBaseFor` = `__plainBase` adaptera) → `vectors_fx.json`. Test `dowodca_i_kontratak_strzelca_zgodne_z_pinem`: liczniki z progami — commanderLost 65, bonusRemoved 105 (w teście), NaN frac 27, kontratak strzelca bez amunicji 44, strzelec z amunicją bez kontrataku 151; strażnik 90 s.
- `p6_k5loop_tags_rest_siege_gen.mjs` (SEED 6411, PIN_SHA256 `489ddf8e…`; wykonuje `_fleeStep`/`_doMove`/`_siegeMoveRefused`/`_siegeApproachRestricted` z pinu): rodziny flee-atk 220, flee-def 220, surround 140, m19 40, m19-surround 40; NaN/Inf 160 (`vectors_siege_nan.json`); krawędzie planszy 200 (`vectors_siege_edge.json`). Moduł `siege` — 3 testy, strażnik 90 s.
- Moduł `battle`: `pelna_bitwa_auto_z_murem_bez_tagow_poza_wejsciowymi` — 12 bitew SiegeLoop+ProdBody (mur, brama, wieże, dowódcy), 12/12 zakończonych, 60 ucieczek, brak tagów poza wejściowymi. To test tylko Rust (nie porównuje z pinem) — parytet całej bitwy NIE_ZMIERZONO.
- Generatory deterministyczne: dwa przebiegi → identyczne MD5 plików wektorów.

## 6. Mutanty (21; skrypt w scratchpadzie tematu, każdy = jedna podmiana w `siege_tactics_loop.rs`)

| # | Mutant | Wynik |
|---|---|---|
| T01 | strzelec nigdy nie kontratakuje | ZABITY |
| T02 | warunek canShoot zanegowany | ZABITY |
| T03 | strzelec z amunicją kontratakuje | ZABITY |
| T04 | `frac <= 0` → `frac < 0` | ZABITY |
| T05 | NaN frac pomijany | ZABITY |
| T06 | mnożnik obrońcy 1.0 | ZABITY |
| T07 | ceil → floor | ZABITY |
| T08 | bonus nie zerowany | ZABITY |
| T09 | moraleMax bez zmiany | ZABITY |
| T10 | rout bez efektów dowódcy | ZABITY |
| T11 | zabicie bez efektów dowódcy | ZABITY |
| T12 | ratio bez warunku moraleMax > 0 | ZABITY (po dodaniu testu §3.1; pierwszy przebieg PRZEŻYŁ) |
| T13 | brak bazy bez tagu | ZABITY |
| T14 | tag przy murze (routed) | ZABITY |
| T15 | tag przy murze (okrążenie) | ZABITY |
| T16 | `mover_routed` po `_startRout` nieaktualizowany | ZABITY |
| M19 | `_siegeApproachRestricted` bez `ru.routed` | ZABITY (siege: główny, NaN, krawędzie) |
| T17 | konflikt łączenia bez tagu | ZABITY |
| T18 | pole zmienione tylko przez zegar nadpisane ucieczką | ZABITY |
| T19 | krok-naprzód-atak bez ciosu | ZABITY |
| T20 | cios w dowolnego sąsiada zamiast wg priorytetu | ZABITY |

21/21 zabitych, brak równoważnych.

## 7. Długi (dla T7 #369 i innych)

1. **D-B2 (BodyTimer przed BodyDone)** — bez zmian w tym temacie; kolejność zdarzeń w `SiegeLoop` nietknięta. Nowe łączenie ucieczki (§2) zakłada, że zegary wpadające między `start` a `complete` stosują się do stanu przed `complete`; pin liczy `_fleeStep` w jednej chwili, więc konflikt tego samego pola jest jawnie tagowany (`ucieczka-konflikt-zegara`), nie zgadywany. Czy konflikt jest osiągalny w produkcyjnej pętli — NIE_ZMIERZONO (T7).
2. **gate_hp** — bez zmian.
3. **I5b** — brak nowych `BattleAction` (efekty dowódcy to zmiana morale bez akcji DTO; pin nie emituje osobnej akcji). Do I5b nic nowego.
4. **T6 (adapter)** — musi wypełnić `army_leader_bonus_frac` i `morale_base_plain` (= `moraleBaseFor` bez mnożnika strony) oraz `is_army_commander`; dziś `SiegeEnv::ratio` to atrapa (dowódca = false, własne `morale_max` niesynchronizowane z ciałem).
5. **K5EXEC-T3** — `doktryna-rozkaz-ruchu` (tryb ręczny).
6. `attack_pre` (krok przed ciosem w `_advanceStep`): gałąź z ruchem i ciosem w tym samym kroku jest w pinie praktycznie nieosiągalna; czas zgodny z pinem dla przypadków osiągalnych, wariant z ruchem NIE_ZMIERZONO.
7. Parytet pełnej bitwy oblężniczej z pinem — NIE_ZMIERZONO (test bitwy tylko Rust).
