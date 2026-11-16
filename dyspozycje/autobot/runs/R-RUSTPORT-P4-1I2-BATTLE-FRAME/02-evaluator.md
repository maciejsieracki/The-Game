STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I2-BATTLE-FRAME
GOAL: BattleFrameDto (§2b) + producent ramki po każdym `fire` w SiegeLoop; pozycje/on_wall_walkway jako wejście adaptera (L7); towers_destroyed z nowej flagi silnika (L4).
ZMIANY/COMMIT: oceniany kod Operatora r1 `d303607bf4bfb05d48976ca13ebbd21fb9b593bb` (baza `585bb48e0` = origin/rust-port/parity-v2; ancestry potwierdzona `merge-base --is-ancestor`). Ten raport: commit lokalny na `wip/R-RUSTPORT-P4-1I2-BATTLE-FRAME-eval-r1`, bez push. Kod niezmieniony przez Evaluatora (mutacje cofnięte, `cmp` = SAME, `git status` czysty poza nieśledzonym Cargo.lock).
TESTY: niżej (odtworzone samodzielnie).
BLOKADY: pełne `cargo test --all-targets --no-fail-fast` w engine NIE_ZMIERZONO (dysk 1,3–8,0 GB w trakcie oceny, < 8 GB wymagane przez dispatch; 797 plików testów).
RUNDY: 1/5 (Evaluator po Operatorze r1)
NASTĘPNY KROK: Operator r2 na tym samym ID, baza `d303607bf`: zarzuty 1–2 (obowiązkowe), 3–6 (do decyzji/uwag).
DEPLOY/PUSH: NIE WYKONANO

## Bramki odtworzone przez Evaluatora (CARGO_INCREMENTAL=0, DEBUG=0, CARGO_TARGET_DIR w scratchpad, usunięty po bramkach)

| Crate | Bramka | EXIT |
|---|---|---|
| view-model | `cargo fmt --check` | 0 |
| view-model | `cargo clippy --all-targets -- -D warnings` | 0 |
| view-model | `cargo test --all-targets --no-fail-fast` | 0 (battle_frame 6/6; cały pakiet zielony) |
| engine | `cargo fmt --check` | 0 |
| engine | `cargo clippy --all-targets -- -D warnings` | 0 |
| engine | `cargo test --lib --test p4_1i2_frame` | 0 (lib 124/124, p4_1i2_frame 7/7) |
| engine | 11 binarek używających SiegeLoop (p4_1i1_battle_outcome, p6_k5doc_state, p6_k5loop_outcome_pin, p6_siege_tactics_loop, _loop_body, _loop_body_pin, _loop_resume, p6_siege_wylom_tower, p6_tower_target_wiring, p6_wieze_2b1, p6_wieze_2b2) | 0 (wszystkie ok) |
| engine | `cargo test --all-targets --no-fail-fast` (pełne) | NIE_ZMIERZONO (dysk < 8 GB) |

## Sprawdzenia

- Allowlista: diff `585bb48e0..d303607bf` = 7 plików, wszystkie w allowliście; `mod.rs` +1 linia `pub mod siege_tactics_frame;`. Brak zmian w `gra/`. Cargo.lock nie commitowany.
- `#[ignore]`: 0 w nowych testach. Osłabionych asercji w istniejących testach brak (istniejące pliki testów niezmienione).
- Pin `07d2fbd72`: `:4216` = `if (!this.wallTileHp.has(t.row)) { this._destroyTowerAtRow(t.row); continue; }`, `:7646-7648` = `wallTileHp.delete` / `wallEverBreached = true` / `_destroyTowerAtRow`, `:4194-4200` `_destroyTowerAtRow` (find pierwszej niezburzonej), `:4209` strażnik, `:1443-1447` `ammoCount` → `Infinity`, `:5541-5550`/`:5573` kolejność `atk` potem `def` — zweryfikowane `git show`, cytaty w kodzie zgodne.
- Pola DTO = recon §2b (v_now, round_no, units{id,col,row,facing,hp,morale,ammo_left:Option,routed,dead,removed,on_wall_walkway}, wall{tile_hp,gate_hp,gate_open,ever_breached,towers_destroyed}, finished). `deny_unknown_fields`, camelCase.
- Logika walki: `tower_shoot` i planowanie `fire_siege_towers` bez zmian; `mark_towers_without_tile` ustawia tylko flagę; niezmiennik „destroyed ⇒ brak kafla” zachowany (oba miejsca ustawiające flagę dotyczą wiersza bez kafla), więc `tower_shoot` sprawdzający kafel daje ten sam wynik co web `t.destroyed`.
- Wołający w Rust: `record_frames`/`battle_frame`/`breach_wall_row` — wyłącznie testy; jawna zależność do wpięcia: #113 (K5LOOP-WIRING) i I4 (#277) zapisana w 01-operator-r1.md. Przyjęte jako jawna zależność.
- Mutacje Operatora (a)–(d): nie powtarzane w całości; własne mutacje Evaluatora niżej.

## Mutacje Evaluatora (po każdej `cp` z kopii + `cmp` = SAME)

| Mutacja | Wynik p4_1i2_frame |
|---|---|
| M1: obserwator wołany na POCZĄTKU `fire` (przed krokiem) zamiast po `apply` | 7/7 ok — PRZEŻYŁA |
| M2: obserwator wołany tylko dla `LoopTimer::BodyDone` (pomija Step/TowerShot/TowerHit) | 7/7 ok — PRZEŻYŁA |

## Zarzuty

1. **[BLOKUJĄCY] Rdzeń ZAKRESU 2 („ramka po KAŻDYM `fire`”, stan PO kroku) nie ma testu behawioralnego.** Mutacje M1 (ramka sprzed kroku) i M2 (ramka tylko po części odpaleń) przechodzą 7/7. `kolejnosc_jednostek_rowna_kolejnosci_spawnu` sprawdza tylko `frames.len() >= 3`, monotoniczność `v_now` i `round_no >= 1`; `NoopBody` nie zmienia stanu, więc ramka sprzed i po kroku są identyczne. Wymagane w r2: (a) liczba ramek == liczba odpaleń zegara (np. licznik w ciele/obserwatorze kontrolnym albo zliczenie odpaleń z `trace`/zegara), w tym odpalenia `TowerShot`/`TowerHit` i zagnieżdżone `RunNow`; (b) ramka odzwierciedla stan PO kroku — ciało testowe zmieniające stan w `complete` (np. `hp`/`acted`/`round_no` przy `BeginTurn`) i asercja, że ramka danego odpalenia zawiera zmianę; obie mutacje M1 i M2 muszą dać FAIL (wyniki w raporcie).
2. **[BLOKUJĄCY, bramka] Brak pełnego `cargo test --all-targets --no-fail-fast` w engine** (kryterium końca 2). Nie wykonał go ani Operator, ani Evaluator (dysk < 8 GB). Zmiana dotyka `SiegeLoop::fire`/`apply` używanych przez wiele binarek; 11 bezpośrednich binarek + lib zielone, reszta NIE_ZMIERZONO. R2 lub FC musi uruchomić pełną bramkę na commicie r2 przy ≥ 8 GB i podać EXIT.
3. **[UWAGA] Wektor `:7648` istnieje tylko przez bezpośrednie wywołanie `breach_wall_row` w teście** — w Rust nie ma ścieżki pętli, która go woła (atak muru w `ProdBody` nieportowany). Zależność do #113 zapisana jawnie; orkiestrator powinien dopisać do #113 wymóg, by wyłom w produkcji szedł przez `breach_wall_row` (inaczej flaga przy wyłomie powstanie dopiero na kolejnym `FireSiegeTowers` przez `:4216`, czyli z opóźnieniem względem pinu). Dodatkowo `breach_wall_row` nie odwzorowuje strażnika `if (!tiles) return;` (`:7640-7641`) — do odnotowania w #113.
4. **[UWAGA] Dwa źródła stanu muru w ramce:** zbiór żywych wierszy z `SiegeEnv.wall_tile_rows`, HP z `FrameInput.wall.wall_tile_hp`. Brak wiersza u adaptera → `TileHpMissing` (testowane), ale nadmiarowy wiersz u adaptera (kafel zburzony w pętli, a adapter nadal ma HP) jest cicho pomijany. Rozważyć błąd przy niezgodności zbiorów albo jawny komentarz, który stan jest nadrzędny.
5. **[UWAGA] Kolejność ramek przy zagnieżdżonym `RunNow`:** odpalenie zagnieżdżone (np. `TowerShot` z opóźnieniem 0 wewnątrz `apply` po `BeginTurn`) emituje ramkę PRZED ramką odpalenia zewnętrznego (obserwator wołany po `apply`). `v_now` równe, więc monotoniczność nie łapie. Udokumentować albo pokryć testem z zarzutu 1.
6. **[UWAGA, drobne] `BattleFrameDto::validate`** zgłasza duplikaty przez `ViewError::LengthMismatch` (semantycznie „niezgodna długość”, nie „duplikat”); `non_negative` zgłasza `OutOfRange` z `value = floor(v)` (dla `-0.5` → `-1`). Akceptowalne, ale warto rozważyć dedykowany wariant błędu.

## Werdykt

FAIL — kod zgodny z pinem i allowlistą, bramki fmt/clippy obu crate'ów oraz celowane testy zielone, ale (1) główne wymaganie „ramka po każdym `fire`” nie ma testu behawioralnego (dwie mutacje przeżywają) i (2) brakuje pełnej bramki `cargo test --all-targets` w engine.
