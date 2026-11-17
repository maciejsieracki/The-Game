STATUS: PASS
REKOMENDACJA: Rozdzielić T7 na T7a (falanga: `_phalanxAction` / `_phalanxLineFront` / `_phalanxStep`) i T7b (odwrót: `_bestFallBackStep` / `_fallBackStep`). T7b NIE zależy od T7a. Obie wymagają już zintegrowanych T4b/T4c (`f85622878`). Przed startem T7a potwierdzić ścieżkę wywołania falangi w trybie auto (sekcja „Ustalenie krytyczne”).

Baza: `f85622878` (parity-v2 z T4a/T4b/T4c/T5a/T5b/T6). Pin: `07d2fbd72`, plik `gra/src/battle/battleScene.ts` (20771 linii). Numery linii z `git show 07d2fbd72:... | grep -n` / `sed -n`. Rozpoznanie tylko do odczytu, bez cargo, bez zmian w `rust-port/**`, bez push. Commit nie wykonany (orkiestrator, po odbiorze).

---

## Ustalenie krytyczne (ścieżka wywołania falangi)

Web: `_phalanxAction` jest wołana tylko z `_activateUnit` (6290), i to po bloku doktryny (6093-6098), który jest pomijany tylko gdy `_manualMode` albo doktryna jednostki to `manual`.

- `_manualMode` domyślnie `true` (2286), ustawiane przez bramkę dowódcy (3572), przełączane (17353).
- Gdy `!_manualMode` i `_isUnitDoctrineAuto(ru)` (17621): wywołanie `_executeGroupDoctrineStep` (6097). Domyślna doktryna to `steady` (`_getEffectiveDoctrine`, 17612). Dla `steady` w `_executeGroupDoctrineStep` falanga idzie wprost do `this._advanceStep(ru, done)` (18043-18048), a NIE do `_phalanxAction`.
- Konsekwencja: linia falangi (`_phalanxLineFront`, histereza `PHALANX_LEAD_TOLERANCE`) działa w web tylko w gałęzi bez doktryny auto (tryb ręczny albo doktryna `manual`). W trybie auto ze standardową doktryną `steady` falanga nie korzysta z `_phalanxAction`.
- Wniosek dla planu: T7a trzeba portować 1:1 (wg pina), ale jego realna osiągalność zależy od portu doktryny (ProdBody: `ActivateEvent::DoctrineStep` nieportowany, `siege_tactics_loop.rs` ~1046-1060). Wektory muszą pokrywać OBIE ścieżki (tryb ręczny i auto/`steady`), żeby nie zaliczyć pozornie „zielonego” testu.
- NIE_ZMIERZONO: nie sprawdziłem `_executeGroupDoctrineStep` dla doktryn `defensive` i `skirmish` z falangą, ani tego, czy `_manualMode` jest `false` w normalnej grze po bramce dowódcy (3572). To wymaga osobnego odczytu przed T7a.

---

## Pin: mapa funkcji (`gra/src/battle/battleScene.ts` @ `07d2fbd72`)

| Element | Linia(e) | Rola |
|---|---|---|
| `FALLBACK_TILES = 3` | 1161 | stała odwrotu |
| `PHALANX_LEAD_TOLERANCE = 2` | 1168 | tolerancja linii falangi |
| `STEP_GAP_MS = 70` | 1011 | przerwa między krokami |
| `BF_COLS = 68`, `BF_ROWS = 156` | 661-662 | wymiary pola |
| `DIR_DELTA` (N,E,S,W) | 326 | kierunki |
| `isPrimaryRanged` | 1474 | klasyfikator (`e.primaryRanged` w `_phalanxStep`) |
| `isPhalanx` | 1538-1544 | kategoria `falanga` albo nazwa zawiera `falang`/`phalan`/`hoplit`/`sarissa` |
| `_activateUnit`: blok doktryny | 6093-6098 | `_executeGroupDoctrineStep` (pominięty w trybie ręcznym) |
| `_activateUnit`: U7.6 `primaryRanged` bez amunicji | 6249-6276 | `dryCol`, `movedBack >= FALLBACK_TILES`, `heldAfterFallback`, wywołanie `_fallBackStep` w 6275 |
| `_activateUnit`: U7.7 kawaleria | 6284 | `_cavalryAction` (poza zakresem T7) |
| `_activateUnit`: U7.8 falanga | 6290 | `if (ru.phalanx) this._phalanxAction(ru, done)` |
| `_activateUnit`: U7.9 melee | 6298 | `_advanceStep` |
| `_phalanxLineFront` | 6519-6533 | min. `_advanceCoord` po żywych falangach własnej strony (wliczając siebie); `null` gdy grupa <= 1 |
| `_advanceCoord` | 6537-6539 | `atk ? q : -q` |
| `_phalanxAdvanceOf` | 6542-6544 | wrapper na `_advanceCoord` |
| `_phalanxAction` | 6546-6586 | guard 6547-6548; zwarcie `_doAttack` (6552-6553); lone -> `_advanceStep` (6556); hold gdy `myAdv > lineFront + PHALANX_LEAD_TOLERANCE` (6569); w przeciwnym razie `_phalanxStep` (6576) |
| `_phalanxStep` | 6588-6652 (koniec ±1) | `moveLeft<=0` -> done; wróg = najbliższy NIE-`primaryRanged` (6597-6599); krok DIRS4 z warunkiem `dEnemy < dNow`; blokada `stepAdv > lineFront + PHALANX_LEAD_TOLERANCE` (~6620); bonus za styk boczny z falangą (`touchesPhalanx`, +6); `_doMove` z callbackiem `done()` (bez `_schedule`, jeden krok na turę) |
| `_rangedAction` | 6656 | poza zakresem T7 |
| `_bestFallBackStep` | 7186-7225 | DIRS4; odrzuca zajęte (`occByKey`), nieprzejezdne (`_passableForUnit`), `dMin <= 1`, `dMin < dNow`; wynik `homeBias*100 + dMin` (`homeBias` = `atk ? -nc : nc`); `>` = pierwszy wygrywa remis; `null` = zaklinowany |
| `_fallBackStep` | 7228-7243 | guard finished/dead/fading/`moveLeft<=0`; `_bestFallBackStep` (7233); `_doMove`; callback: `moveLeft>0` -> `_schedule(STEP_GAP_MS, _fallBackStep)` (7241), inaczej `done()` |
| `_advanceStep` (wywołanie z falangi) | 6556 (lone), 18048 (doktryna steady) | już zportowane w T4b |
| `_enemiesOf` / `_nearestEnemy` | 8291 / 8296 | wrogowie bez `dead/fadingOut/routed` |
| `_targetInRange` | 8373 | sąsiad do zwarcia |
| `_passableForUnit` | 7446 | przejezdność (rzeka) |
| `_doMove` | 8685 | efekty ruchu (T4c) |
| `_siegeMoveRefused` | 7963 | odmowa muru (K1, poza T7) |

---

## Rust: co już istnieje (`f85622878`)

Istnieje:
- `domain/siege_tactics_advance.rs` (159 linii, T4b): `advance_step_decide` (`:79`), trait `AdvanceWorld` (`can_attack_from`, `pick_adjacent_target`, `nearest_enemy`, `avoid_auto_backtrack`, `compact_attack_allows_step`), `AdvanceDecision` (Done/Attack/Move), `advance_after_move` -> `AfterStep` (Done/Schedule `STEP_GAP_MS`). To pokrywa lone-falangę (6556) i zwykły marsz.
- `domain/siege_tactics_move_effects.rs` (114 linii, T4c): `do_move_effects` (`:65`), trait `MoveWorld` (`occ_mut`, `move_cost`, `is_ford`, `update_facing`). Brak animacji (`done` jako flaga `MoveOutcome.done`).
- `domain/siege_tactics_pathstep.rs` (141 linii, T4a): `first_step_along_path_to_attack` (`:51`), `step_toward` (`:114`).
- `domain/siege_tactics_autobatch.rs`: `AutoBatchEnv::passable_for_unit` (`:268`), `BF_COLS: f64 = 68.0` (`:46`).
- `domain/siege_tactics_approach.rs`: `BF_COLS: i64 = 68`, `BF_ROWS: i64 = 156` (`:210`, `:212`). Uwaga: dwa różne typy stałych (i64 vs f64); T7b musi wybrać jeden.
- `domain/siege_tactics_walk.rs:35`: `STEP_GAP_MS: u32 = 70`.
- `domain/siege_tactics_activate.rs`: `FALLBACK_TILES: f64 = 3.0` (`:43`); `ActivateUnit` z polami `phalanx` (`:64`), `dry_col` (`:67`), `held_after_fallback` (`:68`), `primary_ranged`, `mounted`; gałęzie U7.6 (`:427-451`, emituje `FallBackStep`) i U7.8 (`:461-465`, emituje `PhalanxAction`); `ActivateEvent::FallBackStep` (`:167`), `PhalanxAction` (`:169`).
- `domain/siege_tactics_loop.rs`: `ProdUnit` (`:976`) z polem `activate: ActivateUnit`; `ProdBody` ciało ograniczone do ciosu w zwarciu; `prod_tag` mapuje `FallBackStep` na `"odwrot"` (`:1053`) i `PhalanxAction` na `"falanga"` (`:1055`); zdarzenia spoza zakresu trafiają do `unported` (`:1479-1490`).
- `domain/siege_tactics_doctrine_geometry.rs`, `..._doctrine_state.rs`, `..._doctrine_target.rs` (doktryny, nie dotyczą falangi bezpośrednio; `doctrine_state.rs:47-48` wskazuje `ProdUnit::activate` jako jedyne źródło `dry_col`/`held_after_fallback`).
- `domain/siege_tactics_classify.rs:123`: `norm_name` (port `normName`). Brak `is_phalanx`.

Czego brakuje:
1. `isPhalanx` (1538-1544): NIE ma portu w Rust. Istniejące reguły nazwowe (`domain/diplomacy.rs:4105`, `domain/unit_replace_defs.rs:92`) mają INNE reguły (brak kategorii, brak `sarissa`, inne dopasowanie). NIE używać ich zamiennie.
2. `PHALANX_LEAD_TOLERANCE = 2` (1168): brak stałej.
3. `_phalanxLineFront` (6519) i `_advanceCoord` wobec GRUPY: `ActivateOps` ma `advance_coord()` tylko dla siebie (`activate.rs:129`). Brak zapytania o minimum po żywych falangach własnej strony (wymaga listy jednostek strony z `phalanx`, `q`, `dead`, `fading_out`, `routed`).
4. `EnemyRef` (`activate.rs:104-111`): brak pola `primary_ranged`. `_phalanxStep` (6597-6599) filtruje `e.primaryRanged`. Trzeba dodać pole albo parametr.
5. Odmowa muru (`_siegeMoveRefused` 7963) w `_doMove` i `_phalanxStep`: poza zakresem T4c, zależność od K1 (nieportowane).
6. Wiring w `ProdBody` (`siege_tactics_loop.rs:1053-1055`, `1479-1490`): `PhalanxAction`/`FallBackStep` nadal `unported`. Brak konsumenta `_phalanxAction` i `_fallBackStep`.
7. Pole `ProdUnit.activate.phalanx`: ustawiane przez wołającego (w testach `false`). Brak portu `isPhalanx` = brak źródła wartości w produkcji.
8. Doktryna (`ActivateEvent::DoctrineStep`, `siege_tactics_loop.rs` `prod_tag` ~1046): nieportowana. Bez niej w trybie auto falanga nie trafia do `_phalanxAction` (patrz „Ustalenie krytyczne”).

---

## Zależności

- **T4b** (`advance_step_decide`, `advance_after_move`): zintegrowane. Wymagane przez lone-falangę (6556).
- **T4c** (`do_move_effects`): zintegrowane. Wymagane przez `_phalanxStep` (6576 -> `_doMove`) i `_fallBackStep` (7233 -> `_doMove`).
- **T4a** (`first_step_along_path_to_attack`, `step_toward`): nie wymagane przez T7a/T7b bezpośrednio (falanga i odwrót nie szukają ścieżki BFS).
- **K5H** (`activate_unit`): zintegrowane. Gałęzie U7.6 i U7.8 już emitują zdarzenia, brakuje ich treści.
- **Doktryna** (K5 doktryny, `DoctrineStep`): nieportowana. Dotyczy osiągalności T7a w trybie auto (patrz wyżej).
- **K1 (`_siegeMoveRefused`)**: nieportowana. Wpływa na odmowę ruchu przy murze. T7a/T7b mogą zostać zaimplementowane z wejściem `refused` tak jak T4c.
- Wejście stanu sceny: lista jednostek obu stron z `phalanx`, `primaryRanged`, `q`, `r`, `dead`, `fadingOut`, `routed`, `side` oraz `occByKey` i `moveLeft`. Brak jednego wspólnego trait w Rust na to wszystko.

### Czy T7b zależy od T7a?
NIE. `_fallBackStep` i `_bestFallBackStep` wołają tylko `_nearestEnemy`, `_enemiesOf`, `occByKey`, `_passableForUnit`, `_doMove`, `_schedule`. Nie wołają `_phalanxLineFront`, `_phalanxStep` ani `isPhalanx`. Obie gałęzie dzielą wyłącznie `ActivateUnit` i `FALLBACK_TILES`.

### Czy da się wykonać T7 jako jeden temat?
Technicznie tak (kod mały: ~60 linii pinu dla falangi i ~60 dla odwrotu), ale są dwa niezależne zakresy i jeden wspólny wiring w `siege_tactics_loop.rs`. Podział T7a/T7b zmniejsza rozmiar Operatora i ryzyko regresji w loop.rs.

---

## Podział T7a / T7b

**T7a: falanga (`_phalanxAction`)**
- Wejście: `_phalanxLineFront` (lista falang własnej strony), `_advanceCoord`, `PHALANX_LEAD_TOLERANCE`, `isPhalanx`, `EnemyRef.primary_ranged`, `occByKey`, `_passableForUnit`, `moveLeft`.
- Wyjście: `Done` / `Attack{target}` / `Move{col,row}` (+ `AdvanceStep` dla lone), z callbackiem `_doMove` -> `done()` bez `_schedule` (jeden krok na turę).
- Zależy od: T4b (lone), T4c (ruch), port `isPhalanx`, rozszerzenie `EnemyRef`, zapytanie o grupę.

**T7b: odwrót (`_fallBackStep` + `_bestFallBackStep`)**
- Wejście: `_enemiesOf`, `_nearestEnemy`, `occByKey`, `_passableForUnit`, `ru.side`, `BF_COLS/BF_ROWS`, `STEP_GAP_MS`.
- Wyjście: kolejne kroki z `_schedule(STEP_GAP_MS)` dopóki `moveLeft > 0` i istnieje krok (ponowny wybór przy każdym kroku, jak w web).
- Zależy od: T4c (ruch), T4b (wzorzec `AfterStep::Schedule`), `ActivateUnit` (`dry_col`, `held_after_fallback`).
- Uwaga: `_fallBackStep` jest wołany tylko z U7.6 (6275) dla `primaryRanged` bez amunicji, więc osiągalność nie zależy od doktryny w tym samym stopniu co falanga (U7.6 jest przed doktryną tylko w trybie ręcznym; w auto `steady` idzie przez `_executeGroupDoctrineStep` także dla strzelców, 18029-18048). Ta sama pułapka dotyczy T7b: potwierdzić ścieżkę przed Operatorem.

---

## Allowlista (propozycja)

Nowe pliki:
- `rust-port/engine/src/domain/siege_tactics_phalanx.rs` (T7a): `PHALANX_LEAD_TOLERANCE`, `phalanx_line_front`, `phalanx_step_decide`, `phalanx_after_move`, `phalanx_action_decide`.
- `rust-port/engine/src/domain/siege_tactics_fallback.rs` (T7b): `best_fall_back_step`, `fall_back_step_decide`, `fall_back_after_move`.
- `rust-port/engine/tests/p6_k5doc_t7_phalanx.rs`, `rust-port/engine/tests/p6_k5doc_t7_fallback.rs` (testy).
- `rust-port/engine/tests/p6_k5doc_t7_vectors/vectors.json` (wektory), `rust-port/engine/tests/p6_k5doc_t7_gen.mjs` (generator, wzór: `p6_k5doc_t4a_gen.mjs`, wykonanie tekstu pinu przez TypeScript).

Modyfikowane (wspólne, niewielkie):
- `rust-port/engine/src/domain/mod.rs` (rejestracja dwóch modułów).
- `rust-port/engine/src/domain/siege_tactics_classify.rs` (dodanie `is_phalanx` obok `is_siege_unit`) — albo wewnątrz `siege_tactics_phalanx.rs`; wybór orkiestratora (proponuję classify.rs, bo klasyfikatory są tam).
- `rust-port/engine/src/domain/siege_tactics_activate.rs` (dodanie `primary_ranged` do `EnemyRef`, `:104-111`) — tylko jeśli T7a tego potrzebuje.

Poza allowlistą Operatora (wiring, integracja orkiestratora): `rust-port/engine/src/domain/siege_tactics_loop.rs` (zdarzenia `PhalanxAction` i `FallBackStep` z `unported` do wykonania, `:1053-1055`, `:1479-1490`). To plik wspólny, tykany przez T5/T6 i doktryny; rekomenduję integrację w osobnym temacie po T7a/T7b.

---

## Wektory (pin: plik:linia)

T7a:
1. `gra/src/battle/battleScene.ts:6546-6586` `_phalanxAction`: guard `finished/dead/fadingOut` (6547-6548); zwarcie (6552-6553); lone -> `_advanceStep` (6556); hold przy `myAdv > lineFront + 2` (6569); `_phalanxStep` (6576).
2. `:6519-6533` `_phalanxLineFront`: filtr `phalanx && !dead && !fadingOut && !routed`; `group.length <= 1` -> `null`; minimum po `_advanceCoord` (wliczając siebie).
3. `:6537-6539` `_advanceCoord`: `atk ? q : -q`.
4. `:6588-6652` `_phalanxStep`: `moveLeft <= 0` (6589); wybór wroga pomija `primaryRanged` (6597-6599); `dEnemy >= dNow` odrzuca (~6615); `stepAdv > lineFront + 2` odrzuca (~6620); `touchesPhalanx` bonus +6; `_doMove` bez `_schedule`.
5. `:1168` `PHALANX_LEAD_TOLERANCE = 2`.
6. `:1538-1544` `isPhalanx` (kategoria i nazwa).
7. Ścieżka auto: `:6093-6098` (doktryna pomija falangę w auto) i `:18043-18048` (`steady` -> `_advanceStep`), do wektorów „tryb auto” (oczekiwanie: `_advanceStep`, nie `_phalanxAction`).

T7b:
8. `:7186-7225` `_bestFallBackStep`: DIRS4; `occByKey`; `_passableForUnit`; `dMin <= 1` odrzuca; `dMin < dNow` odrzuca; `score = homeBias*100 + dMin`; remis = pierwszy w kolejności DIRS4.
9. `:7228-7243` `_fallBackStep`: guard; `null` -> `done()`; `_doMove`; `moveLeft > 0` -> `_schedule(70, _fallBackStep)`.
10. `:6249-6276` U7.6 (kontekst): `dryCol` (6251); adjacency -> atak (6253-6257); `movedBack >= 3 || distThreat >= 3` latch (6263-6267); `_fallBackStep` (6275).
11. `:1161` `FALLBACK_TILES = 3`.

---

## NIE_ZMIERZONO

- Nie uruchamiałem cargo, testów ani gry (zgodnie z dispatchem). Wszystkie „osiągalności” to wnioski z odczytu kodu, nie z runtime.
- Nie sprawdziłem `_executeGroupDoctrineStep` dla doktryn `defensive` i `skirmish` z falangą (6097, 17960-18048).
- Nie ustaliłem wartości domyślnej `_manualMode` w normalnej grze (2286 vs 3572, bramka dowódcy).
- Nie sprawdziłem `_pickAdjacentTargetByPriority` (17545) i `_pickTargetByPriority` (17523) wobec falangi (używane przez doktrynę, nie przez `_phalanxAction`).
- Nie sprawdziłem `_doAttack` (8787) i `_targetInRange` (8373) pod kątem zachowania falangi w zwarciu (poza wskazaniem linii).
- Nie zweryfikowałem `DIR_DELTA` poza pierwszymi dwoma wpisami (N, E). Kolejność S, W przyjęta z komentarza w Rust (`siege_tactics_inputs_pos.rs:16`: N=0, E=1, S=2, W=3); do potwierdzenia przy wektorach.
- Nie zweryfikowałem dokładnego końca `_phalanxStep` (6588-6652, ±1) ani dokładnych linii warunków w jego środku (~6615, ~6620). Numery środka są przybliżone, nagłówki i gałęzie potwierdzone.
- Nie znalazłem pliku planu `K5DOC-T4-RUCH-PIESZY-ROZPOZNANIE.md` w `dyspozycje/rust-port/p6/` na `f85622878` (dispatch wskazuje go jako źródło §3.1). Podział opisany tutaj wynika z kodu, nie z tego pliku.
- Numery #261, #313, #259 (issue/PR) nie były weryfikowane w GitHub.
