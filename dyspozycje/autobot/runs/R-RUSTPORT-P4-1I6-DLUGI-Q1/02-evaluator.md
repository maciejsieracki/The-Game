# R-RUSTPORT-P4-1I6-DLUGI-Q1: Evaluator r1 (adwersarialny)

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I6-DLUGI-Q1 (#396, długi klienta bitwy oblężniczej I6)
GOAL: odpowiedź StartSiegeStorm niesie BattleSetupDto z silnika, błąd bitwy jako typ, porzucenie bitwy
      w silniku po błędzie sceny klienta (Aborted osiągalne przez most)
ZMIANY/COMMIT: oceniany kod: rust-port-wip/p4-1i6-dlugi-q1 = 2acec6e16 (kod 95be7d54d) nad 0522ad6df;
               ten raport: commit na gałęzi lokalnej rust-port-wip/p4-1i6-dlugi-q1-eval (bez push)
TESTY: §2 (wszystkie odtworzone bramki EXIT 0; mutanty Evaluatora 22: 11 zabitych, 1 nie kompiluje się,
       5 równoważnych, 5 przeżyło; pełny test silnika i bramka renderera: NIE ODTWORZONO, dysk 1.7–2.9 GB)
BLOKADY: Z1 (decyzja D-1I6D-4 oparta na błędnym odczytaniu pinu: odstępstwo gameplay od webu)
RUNDY: 1/5
NASTĘPNY KROK: Operator r2 (Z1 obowiązkowo, Z2 testy), potem Evaluator r2
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, zakres, allowlista

* Dispatch: `origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-DLUGI-Q1/00-dispatch.md`.
* Baza Operatora: `0522ad6df` (= `origin/rust-port/parity-v2` w chwili startu, zgodnie z dispatchem).
  `merge-base(origin/rust-port/parity-v2, 2acec6e16) = 0522ad6df`.
* Od startu `parity-v2` przesunęło się na `e1f61c503` (merge ZDOBYCIE-MIASTA-B). `git merge-tree --write-tree
  e1f61c503 2acec6e16` = drzewo `975801b93`, bez konfliktów (informacja dla integracji; ZDOBYCIE-MIASTA-B nie dotyka
  `siege_battle_apply.rs` w sposób kolidujący).
* Pliki tematu (`git diff --name-only 0522ad6df 2acec6e16`): `client/src/lib.rs`, `client/tests/siege_battle_client.rs`,
  `engine/src/bridge.rs`, `engine/src/domain/siege_battle_apply.rs`, `engine/tests/bridge_contract.rs`,
  `engine/tests/p4_1i6_dlugi.rs` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-DLUGI-Q1/{01-operator-r1.md,
  01-operator-mutanty.py}`. Wszystkie w allowliście; „Pliki spoza allowlisty”: brak. `renderer/`, `view-model/`,
  `src-tauri`, `gra/`, `playable.rs`, `siege_battle_session.rs`, `siege_tactics_loop.rs`, `city_capture_apply.rs`:
  0 zmian.
* Białe znaki na końcu dodanych linii: 0. Nowe `#[ignore]`: 0. Trailery: 5× `Claude-Session:`, 0× `Co-Authored-By`.
* Usunięte asercje (27 linii `-assert`): wszystkie należą do testów usuniętej funkcji `compose_siege_battle_setup`
  (`setup_sceny_z_odpowiedzi_startu`, `setup_spawn_komorka_i_mur_przed_akcjami_startu`, pomocnik `scene_static`)
  albo zostały zastąpione mocniejszymi (tekst `EngineRejected` → typowany `CityNotFound { city_id }`). Brak
  osłabienia asercji dla zachowanego kodu. Uwaga: `let _ = BridgeErrorCode::EngineRejected;` w
  `create_session_i_bledy_startu` jest martwym wyrażeniem (tylko po to, by import nie był nieużyty) — kosmetyka.

## 2. Bramki odtworzone przez Evaluatora

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` w scratchpadzie
(usunięty po bramkach), kod `2acec6e16` (checkout zawiera `dyspozycje/`).

| Bramka | Wynik |
|---|---|
| engine `cargo fmt --all -- --check` | EXIT 0 |
| engine `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| engine `bridge_contract` / `p4_1i6_dlugi` / `p6_k5loop_wiring_b` / `p6_k5loop_wiring_b_pin` / `p6_zdobycie_miasta_a` / `p6_zdobycie_miasta_a_bridge` | 10 / 13 / 15 / 2 / 6 / 7 passed, EXIT 0 |
| engine dodatkowo (wołający mostu/bitwy): `--lib` + `p4_1h_cancel_planned_march`, `p4_364_awaiting_seat`, `p4_364_bridge_layers`, `p4_364_dto_bridge`, `p4_364_fog_save`, `p4_364_render_frame`, `p4_371_reselect`, `p6_cred_hak_bridge`, `p6_k5loop_wiring_a`, `p6_k5loop_wiring_a_pin`, `p4_1i5b_siege_actions` | 149 + 12+5+6+13+5+6+37+8+4+22+6 passed, 0 failed, EXIT 0 |
| client `cargo fmt --all -- --check` | EXIT 0 |
| client `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| client `cargo test --all-targets` | lib 0, `engine_bridge_renderer` 18, `siege_battle_client` 21 passed, EXIT 0 |
| renderer (gpu OFF) | kompiluje się jako zależność klienta (clippy/test klienta EXIT 0); własne fmt/clippy/test renderera: **NIE ODTWORZONO** (dysk < 12 GB; renderer 0 zmian) |
| pełny `cargo test --all-targets --no-fail-fast` silnika | **NIE ODTWORZONO**: wolne 2.0 → 1.7 GB w chwili bramki (inne workflowy budują równolegle); reguła < 2 GB = brak nowych startów. Przyjmuję wyłącznie jako deklarację Operatora (§6.2: 4206 passed / 0 failed / 1 ignored sprzed tematu). Musi być odtworzone przed werdyktem FC / integracją. |

## 3. Web najpierw: weryfikacja tekstu pinu `07d2fbd72`

Potwierdzone (`git show 07d2fbd72:gra/src/...`):

* `main.ts:36980-37023`: `new BattleScene({ attacker: rosterToBattleUnits(atkRosterRef, 0xffd54a), defender:
  rosterToBattleUnits(defRosterRef, 0xc84040), deploy: atkRosterRef.some(u => u.isGeneral === true),
  deployPlayerSide: 'atk', siege: { defCiv: ikonaIdToBronzeCiv(defCivId), builtBuildingIds }, …, onCancel: () =>
  setMood('mapa') })`; `bs.play(res => { consumeReadyMachines(city); finishSiegeStormBattle(...) })`. Kolory,
  `deploy`, `player_side = Atk`, `siege_civ` producenta zgodne.
* `battleScene.ts:3480` `(opts.siege.defCiv ?? opts.siege.civ) ?? 'rzym'` — zgodne.
* `battleScene.ts:4158-4170` `_placeSiegeTowers`: `towerMaterialFor(this.fortKind)`, `null` → brak wież;
  `towerShooterRow = strongestRangedUnitForEra(unitList, this._defenderEra, this._siegeDefCiv)` — zgodne z `tower_shooter`.

**Niezgodne (Z1):** `battleScene.ts:3359`:

```ts
const btnTopExit = mkTopBtn('Wycofaj się', 'Wycofaj się z bitwy', () => { this.dispose(); if (this.onCancelCb) this.onCancelCb(); });
topRight.appendChild(btnTopExit);
```

Przycisk siedzi w górnym pasku (`topBar`, `:2959-2994`), który nie jest chowany ani w rozstawieniu, ani w trakcie
bitwy (`_setBattleChromeForEndScreen` `:10641-10664` chowa toolbar rozstawienia, baner, minimapę, rostery i HUD
oblężenia — nie `topBar`; dopiero ekran końca na `body` z `z-index 100500` go zasłania). Kliknięcie = `dispose()` +
`onCancel` = `setMood('mapa')` (`main.ts:37023`): **brak** `consumeReadyMachines`, **brak** `finishSiegeStormBattle`,
stan mapy bez zmian — w dowolnym momencie trwającej bitwy, nie tylko w rozstawieniu. (Drugi kanał, `siegeHud1E`
`onExit` `:4129`, jest w pinie zadeklarowany, ale `siegeHud1E.ts` nie wiąże go z żadnym przyciskiem — nieistotny.)

## 4. Zarzuty

### Z1 (BLOKUJĄCY): D-1I6D-4 = wymyślone ograniczenie gameplay sprzeczne z pinem

Operator (raport §2 ostatni wiersz, §3 D-1I6D-4; doc-komentarze `SiegeBattleError::AbortNotAllowed`,
`ActiveSiegeBattle::request_abort`, `EngineCommand::AbortSiegeBattle`, nagłówek D-1I6D-3 w `client/src/lib.rs`)
twierdzi: „web nie ma wyjścia ze sceny bez wyniku poza `onCancel` rozstawienia” / „the web has no way out of a running
battle without its result”, i na tej podstawie silnik odrzuca `AbortSiegeBattle` po pierwszym `Step`/`Skip`
(`AbortNotAllowed`). Tekst pinu (§3) temu przeczy: „Wycofaj się z bitwy” zamyka trwającą bitwę bez wyniku i bez
zużycia machin. Dispatch: „Sprawdź w pinie, czy gałąź istnieje (nie wymyślaj gameplayu…)”, „Gameplay poza webem → STOP
i zgłoś”; CLAUDE.md zasada 9/11 (parytet 1:1, zasad spoza webu się nie wymyśla).

Skutek dziś: klient nie wystawia porzucenia graczowi, więc zachowanie gry się nie zmienia; ale kontrakt mostu
(addytywny, `CONTRACT_VERSION` 1) utrwala regułę sprzeczną z webem, a przyszły port „Wycofaj się” trafi na
`AbortNotAllowed`. Rejestr dostałby fałszywą decyzję techniczną.

Wymagane w r2 (jedno z dwóch, decyzja orkiestratora):
* (zalecane, parytet) porzucenie dozwolone do końca bitwy (faza `Running`, także po `Step`/`Skip`, o ile bitwa nie jest
  `Finished` — ekran końca zasłania pasek, wynik idzie przez `onFinish`); `AbortNotAllowed` tylko dla bitwy zakończonej
  (albo usunięty); przepisać D-1I6D-4, doc-komentarze i testy (`abort_po_kroku_lub_koncu_odrzucony` → abort po kroku
  przyjęty: stan i machiny bez zmian, brak `StateChanged`; abort po `Finished` odrzucony); mutant „abort po kroku
  odrzucony” musi ginąć;
* albo zachować ograniczenie jako świadome odstępstwo → pytanie ABC do właściciela przez orkiestratora; do tego czasu
  poprawić tekst (usunąć fałszywe twierdzenie o webie, opisać `btnTopExit`).

### Z2 (wymagane uzupełnienie testów): pola setupu bez niezależnej kontroli

Mutanty Evaluatora, które przeżyły (pliki przywrócone, `git status` czysty):

| ID | Mutacja | Dlaczego przeżył |
|---|---|---|
| E01 | `max_hp: fu.hp` zamiast `bu.max_hp` | scenariusze mają pełne HP na starcie; test klienta `rewound_setup` bierze `max_hp` z samego setupu (kontrola cykliczna) |
| E02 | `category: "INFANTRY"` zamiast `bu.kategoria` | silnik sprawdza tylko `!category.is_empty()`; klient bierze `category` z setupu (cyklicznie) |
| E04 | `model_name: bu.nazwa` (bez `stats.Jednostka ??`) | w scenariuszu `Jednostka == nazwa`; brak przypadku, gdzie się różnią |
| E07 | domyślne `siege_civ` `"grecja"` zamiast `"rzym"` | brak testu `def_civ = None` (właściciel miasta spoza `players`, np. miasto barbarzyńców) albo jawnej notki o nieosiągalności |
| E13 | klient: po porzuconym starcie `battle_closed` nie czyszczone | E2E zaczyna bez wcześniejszej bitwy; D-1I6-DOC obiecuje `None` po porzuconym starcie, nikt tego nie sprawdza przy wcześniejszym `Some` |

Wymagane: wartości oczekiwane `kategoria` / `maxHp` / `Jednostka ?? nazwa` liczone niezależnie od producenta (np.
z `units.json` / `category_of_type` dla typów scenariusza, jednostka z HP < max na starcie albo wektor pinu), test
`def_civ = None` → `'rzym'` (albo udokumentowana nieosiągalność), test klienta: bitwa zakończona → nowy start z
zepsutym setupem → `last_siege_battle_view() == None`.

### Z3 (nieblokujący): bramki nieodtworzone

Pełny `cargo test` silnika i bramka renderera nieodtworzone przez Evaluatora (dysk). Do odtworzenia w r2 / przy FC
przy ≥ 12 GB (renderer) i bez równoległych buildów.

### Z4 (informacyjny)

* `abort_started_battle` przyjmuje dowolne `Ok(_)` jako udane porzucenie (nie sprawdza `phase == Aborted`); przy
  realnym moście bez znaczenia, przy źródle niezgodnym z kontraktem maskowałoby błąd. Do rozważenia.
* `deploy: Some(Atk)` przy generale jest dziś nieosiągalne (sesja odrzuca generała `ManualModeNotPorted` przed
  setupem) — zgodne z pinem, bez testu; równoważność E06 jawna.
* Koszt: rostery liczone dwa razy na starcie (NIE_ZMIERZONO, jak w raporcie Operatora).

## 5. Mutanty

Mutanty Operatora (25/25 zabitych wg raportu) nie były powtarzane; Evaluator uruchomił 22 własne, inne niż M01–M25
(skrypt: `scratchpad/eval-1i6d/m.py`, testy: `p4_1i6_dlugi` + `bridge_contract`, `siege_battle_client`).

| ID | Mutacja | Wynik |
|---|---|---|
| E01 | `max_hp = fu.hp` | PRZEŻYŁ (Z2) |
| E02 | `category = "INFANTRY"` | PRZEŻYŁ (Z2) |
| E03 | `morale_max = fu.morale` | ZABITY (`setup_to_rozstawienie_przed_play`) |
| E04 | `model_name = nazwa` | PRZEŻYŁ (Z2) |
| E05 | `facing = 0` | ZABITY |
| E06 | `deploy Some(Def)` przy generale | RÓWNOWAŻNY (generał → `ManualModeNotPorted` przed setupem) |
| E07 | domyślne `siege_civ` `grecja` | PRZEŻYŁ (Z2) |
| E08 | bez obcięcia `BATTLE_MAX_PER_SIDE` w `scene_battle_units` | RÓWNOWAŻNY (mapa po kluczu, nadmiarowe wpisy nieużywane) |
| E09 | bez `clamp_era` strzelca | nie kompiluje się (odrzucony) |
| E10 | `js_string(Number)` → `None` | RÓWNOWAŻNY na danych (`Typ`/`Jednostka` to napisy) |
| E11 | most: bez strażnika `siege_battle().is_none()` | RÓWNOWAŻNY (`PlayableGame` zawsze usuwa bitwę przy `Aborted`) |
| E12 | `from_siege_battle` kod `Internal` | ZABITY |
| E13 | klient: porzucony start nie czyści `battle_closed` | PRZEŻYŁ (Z2) |
| E14 | `is_not_finished` zawsze `false` | ZABITY |
| E15 | klient wysyła `Finish` zamiast `Abort` | ZABITY |
| E16 | `PartialEq` bez flagi porzucenia | ZABITY |
| E17 | `request_abort` zapisuje `false` | ZABITY |
| E18 | `finish`: `load` zamiast `swap` | RÓWNOWAŻNY (bitwa usuwana z gry; zgodne z notą Operatora) |
| E19 | inny prefiks `Display` dla `Adapter` | ZABITY |
| E20 | `ammo_left = None` | ZABITY |
| E21 | `on_wall_walkway = false` | ZABITY |
| E22 | setup czytany po `play` | ZABITY |

## 6. Tabela długów D-1I6-* (ocena Evaluatora)

| Dług | Operator | Evaluator |
|---|---|---|
| D-1I6-SETUP | ZAMKNIĘTY | zamknięty funkcjonalnie; testy pól `kategoria`/`maxHp`/`modelName` niewystarczające (Z2) |
| D-1I6-ERR | ZAMKNIĘTY | potwierdzam (E12, E14, E19 zabite; JSON błędu nie-bitwy bez zmian) |
| D-1I6-ORPHAN | ZAMKNIĘTY | potwierdzam (E15 zabity, E2E przez prawdziwy most) |
| D-1I6-ABORT-E2E | ZAMKNIĘTY | mechanizm OK; reguła dopuszczalności sprzeczna z pinem (Z1) |
| D-1I6-DOC | ZAMKNIĘTY | treść OK; gałąź „porzucony start → `None`” bez testu przy wcześniejszej bitwie (E13) |
| D-1I6-FIXTURE | ZAMKNIĘTY | fikstura usunięta; ale wartości nie są sprawdzane niezależnie (E01, E02) |
| D-1I6-SPAWN-FACING | ZAMKNIĘTY | potwierdzam (E05 zabity) |
| D-1I6-RENDERER-GATE | ZOSTAJE | zostaje |
| D-1I6D-NOWALL | ZOSTAJE (informacyjny) | zostaje |

## 7. Incydent procesu (jawnie)

Scratchpad sesji jest wspólny dla równoległych workflowów. Pierwszy przebieg mutantów Evaluatora zapisał
`scratchpad/mut.py` i przekierował wyjście do `scratchpad/mut.log`, który w tym samym czasie był plikiem wyjścia
skryptu mutantów innego tematu (wpisy `M03 getCityFood…`, `M04 gaszenie pól…` — kapitulacja). Skutek: jednorazowe
obcięcie tamtego logu (utrata linii sprzed 02:44) i nadpisanie tamtego `mut.py` (proces tamtego tematu działał dalej
z kodem w pamięci). Przebieg Evaluatora przerwano, pliki tematu przywrócono z Gita (`git checkout`), mutanty
powtórzono w `scratchpad/eval-1i6d/`. Orkiestrator: tamten log jest niepełny — warto poprosić o powtórzenie listy
mutantów kapitulacji z unikalną nazwą pliku.

## 8. Sprzątanie

`CARGO_TARGET_DIR` Evaluatora usunięty (dysk po: 2.9 GB). Brak push, integracji i deployu.
