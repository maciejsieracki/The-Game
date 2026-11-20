# R-RUSTPORT-P4-1I6-DLUGI-Q1 — Obrona Operatora (r1)

STATUS: PASS (Z1, Z2, Z3 przyjęte i poprawione/odtworzone; Z4 częściowo; wszystkie bramki EXIT 0)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I6-DLUGI-Q1
GOAL: zamknąć długi I6 (setup w odpowiedzi mostu, typowany błąd, porzucenie bitwy) zgodnie z pinem `07d2fbd72`
ZMIANY/COMMIT: gałąź `rust-port-wip/p4-1i6-dlugi-q1-obrona` (lokalna, bez push), baza = commit Evaluatora `088613964`
(kod Operatora `2acec6e16`); commity obrony `47b3416a5`, `6502b7410` + commit raportu (SHA w odpowiedzi Workflow).
Pliki: `engine/src/domain/siege_battle_apply.rs`, `engine/src/bridge.rs`, `engine/tests/p4_1i6_dlugi.rs`,
`client/src/lib.rs`, `client/tests/siege_battle_client.rs` (wszystkie w allowliście).
RUNDY: obrona r1 / 5
DEPLOY/PUSH: NIE WYKONANO

## Z1 (BLOKUJĄCY) — PRZYJMUJĘ

Weryfikacja w pinie (`git show 07d2fbd72:gra/src/battle/battleScene.ts`):
- `:3359` `btnTopExit = mkTopBtn('Wycofaj się', 'Wycofaj się z bitwy', () => { this.dispose(); if (this.onCancelCb) this.onCancelCb(); })`
  w `topRight` górnego paska; `topBar` (`:2959-2994`) nie jest chowany w trakcie bitwy, a `_setBattleChromeForEndScreen`
  (`:10641-10664`) chowa toolbar/banner/minimapę/roster/selPanel/HUD oblężenia, ale nie `_topBar`.
- `main.ts:37023` `onCancel: () => setMood('mapa')` — bez `consumeReadyMachines` i `finishSiegeStormBattle`
  (te są tylko w callbacku `bs.play`).
- Po końcu bitwy pin pokazuje ekran końca (`_showEndScreen`, warstwa nad paskiem), którego wyjście „Zakończ bitwę”
  najpierw woła `onFinishCb` z wynikiem (`:10720-10733`).

Twierdzenie D-1I6D-4 z r1 („web nie ma wyjścia z trwającej bitwy bez wyniku”) było fałszywe. Poprawka (wariant 1
Evaluatora, bez odstępstwa od webu, więc bez pytania ABC):
- `ActiveSiegeBattle::request_abort`: porzucenie dozwolone w każdej chwili przed końcem bitwy; odrzucane
  (`AbortNotAllowed`) tylko w fazie `Finished` (faza z sesji: pamięć podręczna albo odtworzenie; sesja nieodtwarzalna
  nie blokuje porzucenia).
- Przepisane doc-komentarze: `SiegeBattleError::AbortRequested` / `AbortNotAllowed` (z cytatami pinu),
  `SiegeBattleErrorDto::AbortNotAllowed`, `Display` („already finished: abort is refused, finish it”),
  `request_abort`, `EngineCommand::AbortSiegeBattle` (bridge.rs), nagłówek D-1I6D-3 klienta i
  `SiegeBattleCommand::Abort`.
- Testy: `abort_po_kroku_lub_koncu_odrzucony` zastąpiony przez `abort_w_trakcie_bitwy_zamyka_bez_wyniku`
  (3 × `Step`, bitwa `Running` → `Abort` = `aborted`, stan gry i machiny bez zmian, brak `StateChanged`, potem
  `NoActiveBattle`) i `abort_po_koncu_odrzucony` (po `Skip` → 2 × `AbortNotAllowed`, `Finish` daje ten sam wynik
  i stan co bitwa bez prób); nowy `request_abort_wg_fazy_takze_po_odtworzeniu` (biblioteka, z pamięcią podręczną
  i po `clear_live_session_cache`). Test klienta `bledy_silnika_typowane_w_kliencie` sprawdza teraz odmowę po końcu.
- Nowy dług **D-1I6D-5**: klient wysyła `Abort` tylko na ścieżce błędu sceny; przycisk „Wycofaj się” gracza
  (wywołanie klienta + UI wyjścia `setMood('mapa')`) należy do warstwy UI bitwy — komenda silnika jest gotowa.

## Z2 (luki testów) — PRZYJMUJĘ

| Mutant | Poprawka | Dowód |
|---|---|---|
| E01 `max_hp = fu.hp` | `setup_hp_maxhp_kategoria_niezaleznie`: jednostka 7002 ranna (`hp = 5`), `maxHp` liczone z surowego `units.json` (`health ?? Health`: Wojownik 22, Łucznik 16) | O1 ZABITY |
| E02 kategoria stała | ten sam test: kategoria = `unit_replace_defs::category_of(Jednostka, Rola (linia), Super-jednostka, Typ)` z surowego `units.json`, asercja ≥ 2 różnych kategorii | O2 ZABITY |
| E04 `model_name = nazwa` | wyrażenie wydzielone do `pub fn spawn_model_name` (używane przez `battle_setup`); `model_name_jednostka_przed_nazwa`: wódz z `roster_to_battle_units` (`nazwa` = tytuł ≠ `Jednostka`) i jednostka bez `Jednostka` | O3 ZABITY |
| E07 domyślne `siege_civ` | udokumentowana nieosiągalność + test `def_civ_none_nieosiagalne_przez_most`: właściciel miasta spoza `players` → `prepare_storm` = `NoDefenders*`, most zwraca typowany błąd, brak bitwy; gałąź `'rzym'` niedostępna przez most (test padnie, jeśli kiedyś stanie się osiągalna) | RÓWNOWAŻNY (nieosiągalny) |
| E13 `battle_closed` po porzuconym starcie | klient: `porzucony_start_czysci_ekran_poprzedniej_bitwy` (nagrane odpowiedzi: zastosowana bitwa → `view = Some`, potem start bez setupu → `view = None`, koniec `Aborted`, 1 × `Abort`; drugi start jest skryptowany, bo po pierwszej bitwie prawdziwy most ma miasto zdobyte → `NotEnemyCity`) | O9 ZABITY |

## Z3 (nieblokujący) — PRZYJMUJĘ (odtworzone w tej rundzie, poza bramką renderera/klienta)

Odtworzone w tej rundzie (własny `CARGO_TARGET_DIR`, `CARGO_INCREMENTAL=0`, debug 0, kod obrony): pełny
`cargo test --all-targets --no-fail-fast` silnika EXIT 0 oraz pełny `cargo test` klienta (renderer gpu OFF kompilowany
jako zależność — target klienta zajął 565 MB, dysk 5.5 GB wolnego w chwili startu) EXIT 0. Liczby w §Testy.

## Z4 (informacyjny)

- `abort_started_battle` przyjmuje dowolne `Ok(_)` — ODRZUCAM zmianę: jedyne `Ok` mostu dla `AbortSiegeBattle` to
  `SiegeBattlePayload::aborted` (bridge.rs `abort_siege_battle`, każda inna gałąź = `Err`), sprawdzane przez
  `abort_po_starcie_zamyka_bitwe_bez_zmiany_stanu` (`phase == aborted`); dodatkowa kontrola wymagałaby nowego
  wariantu błędu klienta bez osiągalnego przypadku.
- Martwe `let _ = BridgeErrorCode::EngineRejected;` w teście klienta — PRZYJMUJĘ, usunięte (wraz z importem).
- `deploy = Some(Atk)` nieosiągalne (wódz → `ManualModeNotPorted`) — przyjmuję do wiadomości, bez zmian.
- parity-v2 = `e1f61c503`: `git merge-tree --write-tree origin/rust-port/parity-v2 HEAD` czysto (drzewo `1862b0191`).

## Incydent procesu (wspólny scratchpad)

Przyjmuję do wiadomości (sprawa orkiestratora). Obrona używała wyłącznie unikalnych ścieżek
`scratchpad/obrona-1i6d/` i `scratchpad/obrona-1i6d-target`.

## Mutanty obrony

| ID | Mutacja | Wynik |
|---|---|---|
| O1 | E01 `max_hp: fu.hp` | ZABITY (`setup_hp_maxhp_kategoria_niezaleznie`) |
| O2 | E02 `category: "INFANTRY"` | ZABITY (j.w.) |
| O3 | E04 `spawn_model_name` = `nazwa` | ZABITY (`model_name_jednostka_przed_nazwa`) |
| O4 | stara reguła (`!ops.is_empty()`) | ZABITY (`abort_w_trakcie…`, `request_abort_wg_fazy…`) |
| O5 | nigdy nie odrzucaj | ZABITY (`abort_po_koncu_odrzucony`, `request_abort_wg_fazy…`) |
| O6 | odwrócona faza | ZABITY (6 testów) |
| O7 | `Err(_) => true` (sesja nieodtwarzalna) | RÓWNOWAŻNY w API: odtworzenie powtarza wyłącznie operacje zapisane po sukcesie, więc przez publiczne API nie zawodzi |
| O8 | brak `keep_session` po sprawdzeniu fazy | RÓWNOWAŻNY: pamięć podręczna to optymalizacja (D-WIRB-1), odtworzenie daje tę samą sesję |
| O9 | E13 klient bez `battle_closed = None` | ZABITY (`porzucony_start_czysci_ekran_poprzedniej_bitwy`) |

## Testy

Silnik (`rust-port/engine`, na kodzie obrony):
- `cargo fmt --all -- --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0;
- `cargo test --all-targets --no-fail-fast` EXIT 0: 552 binarów/sekcji, **4211 passed, 0 failed, 1 ignored**
  (ignored spoza tematu; w plikach tematu 0 `#[ignore]`); w tym `bridge_contract` 10, `p4_1i6_dlugi` 18,
  `p6_k5loop_wiring_b` 15, `p6_k5loop_wiring_b_pin` 2, `p6_zdobycie_miasta_a` 6, `p6_zdobycie_miasta_a_bridge` 7.
  (Operator r1: 4206; obrona: `p4_1i6_dlugi` 13 → 18 — 1 test zastąpiony 2, dodane 4 nowe.)

Klient (`rust-port/client`):
- `cargo fmt --all -- --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0;
- `cargo test` EXIT 0: lib 0, `engine_bridge_renderer` 18, `siege_battle_client` 22 (było 21 + nowy E13).
- Renderer kompilowany jako zależność klienta (gpu OFF) — EXIT 0. Osobnej pełnej bramki `renderer` nie uruchamiano
  (poza allowlistą tematu, renderer bez zmian; D-1I6-RENDERER-GATE zostaje).

Mutanty obrony: 9 (6 zabitych, 2 równoważne, E07 jako udokumentowana nieosiągalność). Skrypt:
`scratchpad/obrona-1i6d/mut_obrona.py`, logi `mut-a.log`, `mut-b.log` (unikalne nazwy).

Sprzątanie: oba `CARGO_TARGET_DIR` obrony usunięte (`obrona-1i6d-target`, `obrona-1i6d-ctarget`); dysk po: 6.6 GB.

## Długi (stan po obronie)

| Dług | Stan |
|---|---|
| D-1I6-SETUP | ZAMKNIĘTY (wartości setupu sprawdzane niezależnie) |
| D-1I6-ERR | ZAMKNIĘTY |
| D-1I6-ORPHAN | ZAMKNIĘTY |
| D-1I6-ABORT-E2E | ZAMKNIĘTY (reguła wg pinu: porzucenie do końca bitwy) |
| D-1I6-DOC | ZAMKNIĘTY (test E13) |
| D-1I6-FIXTURE | ZAMKNIĘTY |
| D-1I6-SPAWN-FACING | ZAMKNIĘTY |
| D-1I6D-5 (nowy) | ZOSTAJE: przycisk „Wycofaj się” gracza w kliencie/UI bitwy (komenda silnika gotowa) |
| D-1I6-RENDERER-GATE | ZOSTAJE |
| D-1I6D-NOWALL | ZOSTAJE (informacyjny) |

NASTĘPNY KROK: Final Control (Sonnet); przed integracją odtworzyć bramkę klienta, jeśli tu NIE ODTWORZONO.
