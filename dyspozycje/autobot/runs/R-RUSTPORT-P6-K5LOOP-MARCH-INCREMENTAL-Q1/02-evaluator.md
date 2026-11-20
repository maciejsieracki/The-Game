# R-RUSTPORT-P6-K5LOOP-MARCH-INCREMENTAL-Q1 — Evaluator r1 (adwersarialny)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-MARCH-INCREMENTAL-Q1
GOAL: klasa A (c1 118/196/221) bajt w bajt z pinem 07d2fbd72 @1 i @16 ms; marsz krok po kroku; ROZBIEZNE_B_WIRA_PIN_3 pusta
ZMIANY/COMMIT: oceniany kod Operatora 13a0d2f95 (gałąź rust-port-wip/march-incremental-q1, baza 3e5db0673); Evaluator dodaje tylko ten raport
TESTY: §2 (wszystkie bramki odtworzone, EXIT 0); §4 (10 mutantów Evaluatora, 5 przeżywa: luki testów, nie błędy kodu)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona (zarzuty Z1–Z5 z §6), potem Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, zakres, allowlista

- Baza: `merge-base(13a0d2f95, origin/rust-port/parity-v2) = 3e5db0673b26` = linia BAZA dispatchu (parity-v2 przesunęła się od tamtej pory
  na `35d6e8da2`; integracja to sprawa orkiestratora).
- `git diff --stat 3e5db0673 13a0d2f95`: 7 plików, wszystkie na allowliście (`siege_tactics_loop.rs`, `siege_battle_session.rs` +3 linie,
  generator `p6_k5loop_wiring_a_gen.mjs` +17 (same dopiski), `p6_k5loop_wiring_a_pin.rs`, `p6_k5loop_wiring_a_pin_vectors/vectors.json`
  (+3608/−0), `runs/.../01-operator-r1{.md,-mutanty.py}`). Sekcja „Pliki spoza allowlisty”: brak. Nie ruszono `bridge.rs`,
  `siege_battle_apply.rs`, `city_capture_apply.rs`, `playable.rs`, `siege_surrender.rs`, `siege_transfer*.rs`, `client`, `renderer`,
  `src-tauri`, `gra/`.
- `#[ignore]`: brak nowych (jedyny ignorowany test w pełnym przebiegu jest spoza diffu). Osłabione asercje: brak (diff nie usuwa żadnej
  `assert`; lista `ROZBIEZNE_B_WIRA_PIN_3` opróżniona, a `DAWNA_KLASA_A` pilnuje, że 3 dawne wektory zostają w pliku jako zwykłe zgodne).
- `git diff --check`: czysto. Trailery commitów: tylko `Claude-Session:`, bez `Co-Authored-By` z nazwą modelu.

## 2. Bramki odtworzone (worktree Evaluatora, checkout 13a0d2f95, `CARGO_INCREMENTAL=0 CARGO_PROFILE_*_DEBUG=0`, własny target)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --release --all-targets --no-fail-fast` (engine, w tle) | **FULL_EXIT=0**: 553 × `test result: ok`, **4232 passed / 0 failed / 1 ignored** (w tym `bridge_contract`, `p6_k5loop_wiring_a_pin`, `p6_k5loop_wiring_b`, `p6_k5loop_wiring_b_pin`, `p6_zdobycie_miasta_a*`/`_b*`, `march_incremental_tests`) |
| Generator pinu od zera (`node .../p6_k5loop_wiring_a_gen.mjs`, wykonuje tekst pinu `07d2fbd72` przez `git show`, strażnik SHA-256 `3eeeb760…` zgodny) | GEN_EXIT=0; `vectors.json` MD5 **`dae3e46efdffe94061347f93e7fc1038`**, `pin_data.json` **`432eed76e34a0e8cc96ec548e88eae64`** — identyczne z commitem (drzewo czyste po regeneracji) |
| Wektory: porównanie JSON baza ↔ head | 42 → 45; 42 dawne **bez zmian** (0 zmienionych), nowe tylko `mi_las_mix_d3l_palisada_118`, `mi_gory_lucz2_d5_palisada_196`, `mi_rown_lucz2_d3l_mury_221` (to samo `input` co bliźniaki `a3_*_klatka1`, `frameMs` domyślne 16) |
| 128 kandydatów c1 (pliki pinu `c128_{1,16}_pin.json`, nagłówek: pin `07d2fbd72…`, `pinSha256` jak generator) | **@1 ms 128/128, @16 ms 128/128** (przebieg BASE skryptu Evaluatora) |

Dysk przed bramkami: 7,1 GB wolne (temat bez renderera, więc bramka 12 GB nie dotyczy; brak równoległych buildów renderera).

## 3. Zgodność z pinem (web najpierw, `git show 07d2fbd72:gra/src/battle/battleScene.ts`)

Przeczytane: `_advanceStep` `:8198-8285`, `_rangedAction` `:6656-6741`, `_rangedForwardStep` `:6776-6809`, `_rangedTargetInRange`
`:7041-7052`, `_enemiesOf`/`_nearestEnemy` `:8291-8304`, `_doMove` `:8684-8775`, tura AUTO `:5770-6010`. Ustalenia:

- Preludia wejść (`finished`, `dead||fadingOut`, `moveLeft<=0` w `_rangedForwardStep`; w `_advanceStep` `moveLeft<=0` przed C-FLANK, NaN
  przechodzi) — odtworzone w `advance_enter`/`ranged_action_enter`/`ranged_forward_enter`.
- Callbacki kroku: `_advanceStep` (`lastAutoMoveFrom = previousPosition` → `finished` → `_canAttackFrom` → `moveLeft>0`), C-FLANK (bez
  `lastAutoMoveFrom`, `c.prev = None`), `_rangedForwardStep` (`finished` → `_nearestEnemy` → w zasięgu = `_rangedAction` od nowa →
  `moveLeft>0`, NaN kończy), KITE (`finished` → `_rangedTargetInRange ?? meleeThreat`) — zgodne co do kolejności i warunków.
- Kolejne wejście z przerwy idzie do `_rangedForwardStep` (nie `_rangedAction`) i do `_advanceStep` — zgodne (`march_fire`).
- Odmowa bramki muru (`:8689-8692`: `moveLeft = 0; done()` synchronicznie) = `MarchNext::Done` bez kroku — zgodne.
- Równoważności Operatora sprawdzone na tekście pinu: **A9** (decyzja liczy `moveLeft` tylko do `<=0`; przerwa planowana wyłącznie przy
  `moveLeft>0`, NaN kończy w callbacku) — przyjmuję; **A17** (`_enemiesOf` filtruje `dead/fadingOut/routed`, `_rangedTargetInRange` obejmuje
  każdego takiego wroga w `[1..range]`, więc gałąź `meleeThreat` jest martwa) — przyjmuję.
- Ustalenie Operatora, że klasa A to `_advanceStep`/`_rangedForwardStep`, a nie `_siegeWalkTo` (wskazany w dispatchu), jest poprawne
  i jawnie zapisane; reszta marszy atomowych (`_siegeWalkTo`, `_fallBackStep`, `_fleeStep`, `_kiteStep`, `_rangedBackStep`,
  `_rangedApproachStep`, jazda) uczciwie zostawiona jako dług MARCH-INCREMENTAL-RESZTA z NIE_ZMIERZONO.
- Ryzyko architektoniczne sprawdzone: `ProdBody::march` to jeden slot. Pin aktywuje jednostki sekwencyjnie (`_activateUnit(u, done)` czeka
  na `done`, `:6008`); planowanie AUTO-batch (`:5794`, `done = () => {}`) idzie przez `_autoBatchPlanning`, w którym `_doMove` jest
  synchroniczny, a ciało Rust i tak nie planuje AUTO-batch (`autobatch = None`, bez zmian w temacie). Nadpisanie slotu nie występuje
  w obecnym zakresie — uwaga do przyszłego wpięcia planowania (N1).

## 4. Mutanty Evaluatora (skrypt `scratchpad/march-inc-eval/march-inc-eval-mut.py`, podmiana tekstu, build, 45 wektorów + 256 kandydatów; ocalałe dodatkowo `--lib`)

| ID | Mutant (nowa gałąź) | Wektory / @1 / @16 | Testy lib | Wynik |
|---|---|---|---|---|
| A1 | marsz atomowy (powtórzenie) | FAIL / 125 / 125 | — | ZABITY (potwierdzam Operatora) |
| E1 | `raf_pending` LIFO zamiast FIFO | ok / 128 / 128 | ok | PRZEŻYŁ — praktycznie równoważny: przy sekwencyjnych aktywacjach w kolejce fazy kroków jest co najwyżej jeden klocek (koniec kroku albo `BodyDone` tej samej jednostki, nigdy oba). Do udokumentowania przez Obronę albo testu |
| E2 | `done()` z fazy kroków od razu także przy `ms > 0` | FAIL / 101 / 105 | — | ZABITY |
| E3 | C-FLANK nie zeruje `previousPosition` (`c.prev`) | ok / 128 / 128 | ok | **PRZEŻYŁ — luka** (Z1) |
| E4 | `_rangedForwardStep` bez bramki linii | FAIL / 0 / 0 | — | ZABITY |
| E5 | przerwa strzelca wraca do `_rangedAction` zamiast `_rangedForwardStep` | ok / 128 / 128 | ok | **PRZEŻYŁ — luka** (Z2) |
| E6 | `BodyDone` po `start` mimo marszu w toku | FAIL (panika) | — | ZABITY |
| E7 | `march_start_dur` zawsze 0 (strzał z pierwszego wejścia bez czasu) | ok / 128 / 128 | ok | **PRZEŻYŁ — luka** (Z3) |
| E8 | callback: wejście w zasięg = strzał bez `_rangedAction` (pominięty KITE) | ok / 128 / 128 | ok | **PRZEŻYŁ — luka** (Z4) |
| E9 | cios z pierwszego wejścia `_advanceStep` zgubiony | FAIL / 22 / 23 | — | ZABITY |
| E10 | `ranged_forward_enter` bez odświeżenia `mover_routed` | ok / 128 / 128 | ok | **PRZEŻYŁ — luka** (Z5) |

Sonda E7 (tymczasowy `eprintln!` w `march_start_dur`, cofnięty, drzewo czyste): **0** przypadków `start` z czasem > 0 w 45 wektorach
i w 128 kandydatach @16 — strzał/KITE-w-miejscu z PIERWSZEGO wejścia `_rangedAction` przez ścieżkę marszu nie jest wykonywany przez
żaden wektor (strzał w zasięgu idzie wcześniej ścieżką `attack_tail`). Gałąź jest więc w ogóle niepokryta.

Kod tych pięciu gałęzi przeczytany ręcznie: **zgodny z pinem** (C-FLANK bez `lastAutoMoveFrom` `:8222-8229`; przerwa → `_rangedForwardStep`
`:6806`; wejście w zasięg → `_rangedAction` `:6805`; `ru.routed` w bramce każdego kroku `:7953`/`:8689`). Zarzut dotyczy wyłącznie braku
testów, które by je zabiły — nie poprawności wyniku.

## 5. Decyzje dispatchu

| Kryterium | Stan |
|---|---|
| 128/128 c1 @1 i @16 | spełnione (odtworzone niezależnie) |
| `ROZBIEZNE_B_WIRA_PIN_3` pusta | spełnione |
| 42+ wektorów bajt w bajt, stare bez zmian | 45; 42 dawne identyczne (JSON), MD5 odtworzone z pinu |
| ≥ 20 mutantów, każdy zabity lub równoważny, „marsz atomowy” = FAIL | zbiór Operatora (24) spełnia; Evaluator dokłada 10, z czego 5 nierównoważnych przeżywa (§4) |
| Tabela zamknięte / dług | jest (§9 Operatora); rzetelna |
| Determinizm / niezależność od podziału kroków | `czas_rzeczywisty_niezalezny_od_podzialu_krokow` i złoty skrót sesji zielone w pełnym przebiegu |

## 6. Zarzuty dla Obrony (do zamknięcia testem lib albo jawną równoważnością z tekstem pinu)

- **Z1 (E3)**: brak testu C-FLANK w marszu krok po kroku — krok manewru na flankę po kroku czołowym musi NIE zapisać `lastAutoMoveFrom`
  (`:8222-8229`). Test: `attack_direction = bok/tyl`, krok czołowy, potem krok C-FLANK; asercja `last_auto_move_from` bez zmiany.
- **Z2 (E5)**: brak testu, że wejście z przerwy strzelca to `_rangedForwardStep`, nie `_rangedAction` (np. zasięg 1, zagrożenie wręcz w
  odległości 2 w chwili przerwy: pin robi krok naprzód / kończy, `_rangedAction` uciekałby KITE).
- **Z3 (E7)**: brak pokrycia strzału z pierwszego wejścia `_rangedAction` w marszu (KITE w narożniku, strzał w miejscu): czas do skutku
  `start` = `RANGED_FLY_MS` (klatka) i ogon `RANGED_GAP_MS`.
- **Z4 (E8)**: brak testu, że wejście w zasięg po kroku woła `_rangedAction` od nowa (zagrożenie wręcz ≤ 2 po kroku ⇒ KITE, nie strzał).
- **Z5 (E10)**: brak odpowiednika testu A8 dla strzelca — `ru.routed` odświeżane przy każdym wejściu `_rangedForwardStep`.
- E1: zapisać równoważność (jeden klocek w `raf_pending`) albo dodać asercję/test kolejności.

## 7. Uwagi (nie blokują)

- N1: jeden slot `ProdBody::march` zakłada sekwencyjne aktywacje; przy przyszłym wpięciu planowania AUTO-batch w ciele dodać
  `debug_assert!(self.march.is_none())` na starcie aktywacji.
- N2: pliki kandydatów `c128_*_pin.json` pochodzą z poprzednich tematów (nagłówek pinu i SHA zgodne); Evaluator nie generował 128 od zera
  (generator 45 wektorów — tak, MD5 zgodne).
- N3: duplikacja marszu atomowego i krokowego (Operator §9) — dług przyjęty.

## 8. Długi

| Pozycja | Stan |
|---|---|
| Klasa A (118/196/221 @1/@16) | ZAMKNIĘTE (zweryfikowane niezależnie) |
| Luki testów Z1–Z5 | do Obrony w tej rundzie |
| MARCH-INCREMENTAL-RESZTA (inne marsze atomowe) | dług, NIE_ZMIERZONO |
| FQ-SPEED (155 @32), D-PIN3-3-SHOT-ID | poza zakresem, bez zmian |

Sprzątanie: własny target Evaluatora usunięty po bramkach; logi i skrypt mutantów w `scratchpad/march-inc-eval/`.
