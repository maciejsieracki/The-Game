# R-RUSTPORT-P6-K5LOOP-TAGS-REST-Q1 — Obrona Operatora r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-TAGS-REST-Q1
GOAL: zdjąć z `ProdBody::unported` ostatnie tagi „nieportowane” (dowodca-rout/fade, kontratak-strzelec, krok-naprzod-atak, ucieczka-oblezenie + M19); odpowiedź na zarzuty Evaluatora r1 (`02-evaluator.md`, commit `2f3251db0`).
ZMIANY/COMMIT: baza obrony = `2f3251db0` (HEAD Evaluatora, kod Operatora `4d649d2d2`, baza tematu `1e20c2da9` = `origin/rust-port/parity-v2`). Commit obrony: SHA w wiadomości końcowej / `git log` gałęzi `obrona/tags-rest-q1`. Kod produkcyjny (`siege_tactics_loop.rs`) BEZ ZMIAN. Zmienione wyłącznie testy/generator/wektory: `tests/p6_k5loop_tags_rest_gen.mjs`, `tests/p6_k5loop_tags_rest_vectors/vectors_fx.json`, `tests/p6_k5loop_tags_rest.rs`, `tests/p6_k5loop_close_r4.rs` (nowy test, już w U1), `tests/p6_k5loop_siege_def.rs` (asercja U3, plik z listy „DOZWOLONE ZMIANY”).
TESTY: patrz §2 (mutanty E4, E14, E5, E6 zabite; bramki).
BLOKADY: brak technicznych. Dysk: 2,2 GB wolnego w trakcie obrony (inne tematy), pełny `cargo test --all-targets` NIE uruchomiony w obronie (zmiany wyłącznie w 3 plikach testów + generator; pełny test zostaje dla Final Control, partiami wg R-DYSK-2).
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control (lub Evaluator r2) na commicie obrony; decyzje orkiestratora U1/U2 do REJESTR-RUST.
DEPLOY/PUSH: NIE WYKONANO

## 1. Odpowiedzi na zarzuty

### Z1 (FAIL, mutant E4) — PRZYJMUJĘ
Pin `_defenderCounters` (`battleScene.ts:9090-9091`): `if (!defender.primaryRanged) return true; return !canShoot(defender);`, `canShoot = rangedBase && ammoLeft > 0` (`:1457-1459`). Generator r1 ustawiał `primaryRanged = rangedBase = shooter`, więc kombinacji niezależnych flag nie było.

Poprawka (`p6_k5loop_tags_rest_gen.mjs`): rodzina wymuszona `shooter2` (80 sekwencji, id 500–579) DOPISANA po 500 sekwencjach losowych (ten sam strumień PRNG; sekwencje 0–499 są bajt w bajt jak w r1 — sprawdzone `JSON.stringify(old.sequences) === JSON.stringify(new.sequences.slice(0,500))` = `true`). Obrońcy losują z `SHOOTER2_COMBOS`: `rangedBase && !primaryRanged` z amunicją 2/5/Infinity i 0, `primaryRanged && !rangedBase` (amunicja 5), `primaryRanged && rangedBase` (amunicja 5); działają tylko atakujący wręcz (strzelcy nie wchodzą w `_rangedAction` poza harnessem). Wynik nadal z WYKONANEGO tekstu pinu (`_defenderCounters` + `DefenderCounterBudget`).

Liczniki pokrycia (generator rzuca błąd poniżej progu; test Rust liczy z porównanych danych i ma te same progi):
- `secShooterCounter` (kontratak `rangedBase && !primaryRanged && ammoLeft > 0`) = 42, próg 40 (Rust `kontratak_strzelca_niepodstawowego` = 42);
- `primaryNoBaseCounter` (kontratak `primaryRanged && !rangedBase`) = 18, próg 10 (Rust 18).

Dowód: mutant E4 (`if da.primary_ranged && da.can_shoot` → `if da.can_shoot`) ZABITY: `dowodca_i_kontratak_strzelca_zgodne_z_pinem` FAILED (`pin kontratak, rust counters=0`). Przy pierwszym przebiegu test padał paniką `liczba jako tekst` (kaskada po rozbieżności: `num(extraMorale)` przy `missed` pinu); poprawiłem diagnostykę (`extraMorale` porównywane tylko, gdy oba źródła trafiły; rozbieżność `missed` jest zgłaszana wcześniej) — log `tagsrest/ob/mut_E4b.log`.

### Z2 (FAIL, mutant E14) — PRZYJMUJĘ
Pin `_removeCommanderMoraleBonus` `:10002`: `u.morale = Math.min(base, Math.ceil(base * ratio))`, `base = moraleBaseFor(u.bu) * 1.5` dla `def`.

Poprawka: rodzina wymuszona `cmdHalf` (60 sekwencji, id 580–639): `def0` = dowódca (`hp` 1–3, `leaderFrac` 0,25), pozostali obrońcy `plainBase` 37 (→ `base` 55,5), `leaderFrac` > 0, `moraleMaxExtra` 0 (`morale == moraleMax`, `ratio` = 1); wszyscy atakujący celują w `def0`, rzut 0 (trafienie). Licznik `cmdHalfCapped` (zdjęcie bonusu, po którym `morale == moraleMax` i wartość niecałkowita) = 50 aktywacji, próg 40; w Rust `morale_bazy_55_5` = 64 (liczone per jednostka), próg 40.

Dowód: mutant E14 (`js_min(base, (base*ratio).ceil())` → `(base*ratio).ceil()`) ZABITY: `#580 act0 atk0: def0.morale rust=56 js=55.5` (log `tagsrest/ob/mut_E14.log`).

### Z3 (mutanty E5/E6, `merge_flee_unit`) — PRZYJMUJĘ
Nowy test `p6_k5loop_close_r4::ucieczka_laczenie_ta_sama_wartosc_bez_konfliktu`: dla KAŻDEGO przypadku `flee` wektorów r4 (bez tagów we wzorcu) zegar w oknie start..complete ustawia każde pole zmienione przez ucieczkę (`hp`, `morale`, `fleeMorale`, `moveLeft`, `neverRout`, `dead`, `fadingOut`, `routed`, `removed`, `acted`; obie strony) na tę samą wartość co ucieczka. Oczekiwane: brak tagu `ucieczka-konflikt-zegara`, stan identyczny ze wzorcem. Pokrycie: pól liczbowych 478 (próg 400), flag 536 (próg 500). Wektory r1–r4 nietknięte (test czyta istniejące).

Dowód: E5 (`flag`: bez `*cur == fled`) ZABITY, E6 (`num`: bez `same(*cur, fled)`) ZABITY — oba w nowym teście (logi `mut_E5.log`, `mut_E6.log`).

### Z4 (mutanty E8/E22/E30, `attack_pre`) — ODRZUCAM test, PRZYJMUJĘ jawną deklarację
Pin `_advanceStep` (`:8198-8285`): po każdym kroku callback `_doMove` kończy aktywację, gdy `_canAttackFrom(ru, ru.q, ru.r)` (`:8223` gałąź kierunkowa, `:8277` marsz czołowy); kolejny krok jest planowany `_schedule(STEP_GAP_MS, …)` tylko, gdy ataku z nowej pozycji NIE ma. Atak w tej samej aktywacji po kroku (gałąź `:8241-8245` przy ponownym wejściu) wymaga więc, by między callbackiem a ponownym wejściem (okno `STEP_GAP_MS`) INNY zegar zmienił warunek `_canAttackFrom` (np. zdarzenie wieży/wyłomu). W AUTO aktywacje jednostek są sekwencyjne (busy-gate `_executeUnitsImmediate`), więc jedynym kandydatem są zegary oblężnicze. Nie ma w wektorach (fx, siege, edge, NaN) ani w sondzie Evaluatora żadnego takiego przypadku. Zbudowanie testu wymagałoby wymyślenia sekwencji, której pin nie generuje w żadnym zmierzonym przebiegu — odrzucam to jako test „pod mutanta”.

Deklaracja: E8/E22/E30 równoważne na wszystkich ścieżkach, gdzie warunek `_canAttackFrom` nie zmienia się w oknie `STEP_GAP_MS` po kroku; osiągalność przypadku przeciwnego NIE_ZMIERZONO (dług dla T7 #369 — sterownik pełnej bitwy z zegarami może go zmierzyć). Kod `attack_pre` zostaje (odpowiada `_schedule(STEP_GAP_MS)` + `_doAttack` pinu), nie jest usuwany.

### U1 (allowlista: `p6_k5loop_close.rs`, `p6_k5loop_close_r4.rs`) — decyzja orkiestratora
Potwierdzam opis Evaluatora: wektory `p6_k5loop_close_*vectors*` nietknięte, asercje wzmocnione. Obrona dodała w `p6_k5loop_close_r4.rs` jeden NOWY test (Z3); żadna istniejąca asercja nie została zmieniona. Wymaga wpisu decyzji (D-…) w REJESTR-RUST przez orkiestratora.

### U2 (kontrakt `flee_after`, tag `ucieczka-konflikt-zegara`) — decyzja orkiestratora
Bez zmian w kodzie. Łączenie trójstronne ma teraz pokrycie trzech przypadków: zmiana tylko przez zegar, konflikt różnych wartości (r1) i zgodne wartości (Z3, bez tagu). Do wpisu D-… przez orkiestratora.

### U3 (`ucieczka_okrazenia_przy_murze_z_terenem_wykonana`) — PRZYJMUJĘ
Asercja rozdzielona: `executed` (krok `Move` albo `removed`) i `stuck` (bez kroku, ta sama komórka); zmiana pozycji bez kroku = błąd jak dotąd. Nowe asercje: `executed + stuck == 80` oraz `executed >= 1`; zmierzone `wykonana=61 zablokowana=19`. Przypadki `stuck` = `_fleeStep` bez wolnego pola (okrążenie 3–4 wrogów + mur); zgodność liczbowa (w tym zablokowanych) jest w `p6_k5loop_tags_rest::siege` (rodzina `surround`, licznik `flee-def:flee-stuck`). Próg ustawiony na 1, bo generator `p6_k5loop_siege_def` ma atrapę `_fleeStep` przy murze — liczba wykonanych zależy od Rust, nie od wektora; liczby z tego testu nie są porównaniem z pinem.

### U4 (`_disableManualIfCommanderLost` planuje pusty `_schedule(0)`) — PRZYJMUJĘ jako dług
Bez zmian kodu (w AUTO callback nic nie zmienia, `_manualMode = false`). Dług T7 (#369): wpływ pustego zegara na kolejność/limit zdarzeń NIE_ZMIERZONO.

### U5 (`cios-bez-szablonu` 325 w sondzie) — PRZYJMUJĘ jako dług T6/#369
Nie skutek tematu (identycznie na bazie `1e20c2da9`). Adapter T6 musi dostarczyć szablon ciosu dla każdego celu `_pickAdjacentTargetByPriority` (`ProdUnit` ma jeden `blow`/`melee_target`). Poza allowlistą (T6 = `siege_battle_adapter*.rs`).

### U6 (furtka `P6_TAGS_SHA_PROBE`) — PRZYJMUJĘ
Usunięta: `EXPECTED_TAGS_SHA256` jest stałą, strażnik rzuca zawsze. SHA bez zmian (`e30f68e6…`).

### U7 (`ammoLeft` przy wystrzale vs trafieniu) — bez zmian, odnotowane (poza tematem, jak w raporcie Evaluatora).

## 2. Dowody (bramki i mutanty)

Środowisko: worktree `wf_332bf894-0ad-3`, gałąź `obrona/tags-rest-q1` od `2f3251db0`; `CARGO_TARGET_DIR` w scratchpadzie `tagsrest/ob/t`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`.

| Krok | Wynik |
|---|---|
| `node tests/p6_k5loop_tags_rest_gen.mjs` (2×) | EXIT 0, MD5 `vectors_fx.json` = `07b12e6f4657d2378bd965713d02d7df` w obu przebiegach (deterministyczny); 640 sekwencji, prefiks 0–499 identyczny z r1 |
| `cargo test --test p6_k5loop_tags_rest --test p6_k5loop_close_r4 --test p6_k5loop_siege_def` | EXIT 0 (5 + 9 + 10 passed) |
| mutant E4 | ZABITY |
| mutant E14 | ZABITY (`def0.morale rust=56 js=55.5`) |
| mutant E5 | ZABITY (nowy test Z3) |
| mutant E6 | ZABITY (nowy test Z3) |
| mutant E4 po poprawce diagnostyki | ZABITY czysto: `#500 act0 atk0: pin kontratak, rust counters=0` (bez paniki parsowania) |
| `cargo fmt --check` | EXIT 0 |
| lista dispatchu: `p6_k5loop_tags_rest`, `siege_atk_b`, `siege_atk_a`, `siege_def`, `loop_body`, `loop_body_pin`, `outcome_pin`, `close`, `close_r4`, `k5doc_t8`, `p4_1i3_actions`, `bridge_contract` | EXIT 0, 12 bloków `test result: ok`, 0 failed, 0 ignored |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| pełny `cargo test --all-targets --no-fail-fast` | NIE WYKONANO w obronie (dysk 1,7–2,2 GB wolnego przez inne tematy; < 2 GB = wstrzymanie nowych dużych buildów). Zmiany obrony dotyczą tylko 3 plików testów + generatora, każdy z nich przeszedł; pełny test partiami dla FC. |

Target `tagsrest/ob/t` usunięty po bramkach.

Pozostałe generatory (`p6_k5loop_tags_rest_siege_gen.mjs`) i ich wektory: nietknięte.

## 3. Długi (dla T7 #369 i T6)

- `BodyTimer` przed `BodyDone` (D-B2), `gate_hp`, I5b (DTO nowych `BattleAction`) — bez zmian względem raportu Operatora r1.
- Z4: osiągalność ataku po kroku `_advanceStep` (zmiana `_canAttackFrom` w oknie `STEP_GAP_MS` przez zegar oblężniczy) — NIE_ZMIERZONO; mutanty E8/E22/E30 równoważne poza tym przypadkiem.
- U4: pusty `_schedule(0)` z `_disableManualIfCommanderLost` (bramka ręczna, strona gracza) — Rust nie planuje; wpływ na kolejność zdarzeń NIE_ZMIERZONO.
- U5: szablon ciosu na każdy cel `_pickAdjacentTargetByPriority` (adapter T6).
