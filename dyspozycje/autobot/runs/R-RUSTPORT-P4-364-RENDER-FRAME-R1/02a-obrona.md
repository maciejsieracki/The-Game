# R-RUSTPORT-P4-364-RENDER-FRAME-R1 — Obrona Operatora, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-RENDER-FRAME-R1
GOAL: składacz pełnej ramki renderera (`RenderLayersDto`) i mapy (`MapViewDto`) wystawiony przez most (`GetRenderMap` / `GetRenderFrame`), D-R3-1..6.
ZMIANY/COMMIT: gałąź `rust-port-wip/R-RUSTPORT-P4-364-RENDER-FRAME-R1-obrona` od commitu Operatora `08ab91229`; SHA w sekcji „Commit”. Pliki: `rust-port/engine/src/domain/render_frame.rs`, `rust-port/engine/tests/p4_364_render_frame.rs`, katalog runs (ten raport, `mutate-obrona-r1.py`, `mutate-obrona-r1.log`).
TESTY: patrz sekcja „Bramki”.
BLOKADY: INFRA (nie kod) — pełna bramka `cargo test --all-targets --no-fail-fast` NIE uruchomiona: wolny dysk 8104 MiB (7,9 GiB) < 8 GiB przez 10 min oczekiwania (dispatch: mniej niż 8 GB -> BLOCK INFRA, nie obchodzić). Uwaga dla orkiestratora: decyzja z zarzutu 1 (czyszczenie przy `buildModeOpen` bez klucza) do wpisu w `REJESTR-RUST.md` (reguła 8).
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control r1
DEPLOY/PUSH: NIE WYKONANO

## Baza

Kod Operatora `08ab91229` (rodzic `0f77c9da3` = `origin/rust-port/parity-v2` z linii BAZA dispatchu). Gałąź obrony: `git checkout -B rust-port-wip/R-RUSTPORT-P4-364-RENDER-FRAME-R1-obrona 08ab91229` (gałąź Operatora jest zajęta przez worktree `wf_03037bf7-4d1-1`).

## Odpowiedzi na zarzuty

### Zarzut 1 — `buildModeOpen` bez klucza nie czyścił zaznaczenia (D-R3-3, Q6-2): PRZYJMUJĘ

Dowód z pinu `07d2fbd72`: `main.ts:26701-26703` — `onOpenBuild: () => { clearPlayerUnitSelection(); if (buildModeOpen) {...} ... buildModeOpen = true;` — czyszczenie zachodzi w chwili otwarcia panelu, przed `activeImprovementKey`. `clearPlayerUnitSelectionStateOnly` (`main.ts:7096-7105`) zeruje `selectedId`, `reachable`, `pathRoute`, `selectionHex`. Litera D-R3-3 („gdy `ui.buildMode` aktywny”) i kontrakt FC Q6-2 mówią to samo.

Poprawka (`render_frame.rs`, `overlays_view` składacza): warunek czyszczenia `ui.build_mode_open || build_highlight_mode_active(&build_ui)` (dotąd tylko `build_highlight_mode_active`). Warstwa `buildHighlight` dalej wg `refreshBuildHighlight` (`main.ts:16351-16373`): panel bez klucza = gałąź „brak trybu” (pusta), czyli zmienia się wyłącznie selekcja/zasięg/trasa. Komentarz modułu D-OP-3 przepisany.

Test: `c_tryb_budowy_czysci_zaznaczenie_zasieg_i_trase` — dodany przypadek `buildModeOpen: true` bez klucza (oczekiwane `selection = None`, `reachable = []`, `pathRoute = None`); usunięta kontrola utrwalająca starą regułę; zamiast niej kontrola, że zamknięty panel zostawia zaznaczenie. Mutant odwrotny E3 („`buildModeOpen` bez klucza nie czyści”) daje FAIL; mutant (c) („tryb budowy ignorowany”) daje FAIL.

Znana, jawna różnica (do decyzji orkiestratora, wpis w rejestrze): w webie gracz może po otwarciu panelu zaznaczyć jednostkę ponownie (`selectPlayerUnit`, `main.ts:7233-7260`, nie zamyka trybu budowy). Ramka jest bezstanowa i wg litery D-R3-3 czyści selekcję z UI przy każdym `buildModeOpen = true`. Klient, który chce odwzorować ponowne zaznaczenie, musi wysłać `buildModeOpen = false` albo D-R3-3 trzeba zawęzić w r2. Nie wymyślam reguły — stosuję literę decyzji orkiestratora.

### Zarzut 2 — brak testów pól produkowanych od zera (E2, E4, E5, E6 przeżywały): PRZYJMUJĘ

Nowe testy w `p4_364_render_frame.rs`:

| Test | Pole / gałąź | Odwołanie do pinu | Mutant |
|---|---|---|---|
| `h_terytorium_cudze_filtrowane_mgla` | `territory`: filtr `isMe(owner) \|\| !fogOn \|\| vis.has(key) \|\| explored.has(key)` — miasto AI w rogu mapy; bez mgły pełne terytorium AI; z mgłą tylko heksy `Visible` (część niepusta i część ukryta niepusta), własne terytorium bez zmian; dwa ukryte heksy dopisane do `exploredByHuman` pojawiają się jako `Explored` i w terytorium | `main.ts:15582-15601` | E2 (filtr wyłączony) FAIL |
| `h_oblezenie_besieged_i_sieges` | `cities[].besieged` = `state.oblegane`; `sieges[0]` = stolica gracza z obozem AI na sąsiednim heksie (1,2) przy wojnie; przy pokoju oblężenie bez obozu (`areEnemyOwners`); bez `oblegane` — brak wpisu i `besieged = false` | `main.ts:13129-13133`, `:17501-17508`; `cities.ts` `c.oblegane` | E4 (`besieged = false`), E5 (`sieges = []`), E5b (wrogość zawsze) FAIL |
| `h_hp_jednostki_z_ekonomii` | `units[].hp` = `economy.units[id].hp` (7.5), `hpMax` = `economy.units[id].hpMax` (20) | `units/setup.ts:60` (`unit.hp`) | E6 (hp ignoruje ekonomię) FAIL |

### Zarzut 3 — ciche zero przy braku definicji typu: PRZYJMUJĘ

Poprawka: `unit_view` zwraca `RenderFrameError::UnknownUnitType(typ)` dla jednostki bez typu albo bez definicji w `units.json` (nowy wariant błędu z `Display`); `hp` pełne = `def.health_lc` tylko z istniejącej definicji. Wybrałem jawny błąd zamiast domyślnego 30 z `unitHealth` (`main.ts:33093-33095`), bo web w tej sytuacji nie ma definicji w ogóle (`lookupUnitDef` zwraca brak) i reszta pól (`category`, atak stosu) też byłaby zgadywana; dispatch D-R3-4 zakazuje cichych zer. Ścieżka jest osiągalna przez zamianę typu w `economy.units[id].type_id` (adapter ruchu bierze typ stamtąd, `playable_movement.rs:140-142`).

Test: `h_typ_bez_definicji_to_blad` (`type_id = "NieistniejacyTyp"` → `Err(UnknownUnitType("NieistniejacyTyp"))`). Mutant Z3 (powrót do wartości zastępczej) FAIL.

Uwaga: `stack_view` dalej ma `unitAttackScore` = `meleeAttack` z domyślnym 0 — to jest wartość webu (`main.ts:14436-14438`: `normFieldVal(lookupUnitDef(u.typeId)['meleeAttack'], 0)`), nie ciche zero; po poprawce typ bez definicji i tak kończy się błędem w `unit_view` przed stosami.

### Zarzut 4 — liczba testów w raporcie: PRZYJMUJĘ

Korekta: binarka `p4_364_render_frame` zawiera testy pliku tematu oraz `bridge::add_player_atomicity_tests::*` (1 test), bo plik dołącza `src/bridge.rs` przez `#[path]`. Raport Operatora r1: 15 własnych + 1 z mostu = 16. Po obronie: **19 własnych + 1 z mostu = 20** (`grep -c '^#\[test\]' tests/p4_364_render_frame.rs` = 19).

### Zarzut 5 — wartości stałe spoza stanu nie były w kodzie: PRZYJMUJĘ

Poprawka: nowa stała `RENDER_FRAME_STATE_DEFAULTS` w `render_frame.rs` (ta sama struktura co `RENDER_FRAME_GAPS`), osobna od luk, bo to nie są rozbieżności z webem, tylko źródło = stała zamiast stanu. Pozycje:

| Pole | Wartość | Uzasadnienie |
|---|---|---|
| `cities[]` kolejka / bunt / wzrost na żywo | `CityViewCityFacts::default()` poza `besieged` | stan bez kolejki, buntu i wzrostu (#310); web bez nich daje te same plakietki |
| `owners[]` / `cities[]` miasta-państwa | `CityStateFacts::default()` | stan bez miast-państw |
| `units[].isGeneral` / `units[].dimmed` | `false` | stan bez generałów i `dimmedUnitIds` |
| `units[].embarked` / `units[].inGarnizon` | z adaptera ruchu (`false` dla stanu) | `PlayableUnit` nie niesie tych pól |
| `units[].armorBadgeLevel` / `softBadgeLevel` | `*_path_badge_level(None)` | stan bez `unitBuildingProgress` |
| `overlays.tradeRoutes` | `[]` | stan bez `tradeRoutes` (`main.ts:3454`) |
| `battle` | `None` | brak otwartej bitwy (D-R3-4) |

Test `h_jawne_luki_ramki` sprawdza teraz oba zbiory (luki i wartości stałe) co do nazw pól i niepustych `produced`/`reason`.

### INFRA z raportu Evaluatora

Nie zarzut kodu; mój przebieg pełnej bramki w osobnym katalogu targetu (sekcja „Bramki”).

## Bramki (env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo)

- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --test p4_364_render_frame`: 20 passed, 0 failed, EXIT 0.
- Mutacje (`mutate-obrona-r1.py`, log `mutate-obrona-r1.log`): 14/14 FAIL (oczekiwane) — dispatch (a1, a2, b, c, d, e) oraz E3-odwrotny, E2, E4, E5, E5b, E6, Z3. Pliki źródłowe przywracane po każdej mutacji (`git status` po przebiegu: tylko zamierzone zmiany).
- Ponowny przebieg (sesja obrony, po wznowieniu): fmt EXIT 0, clippy `--all-targets -D warnings` EXIT 0 (kompiluje wszystkie cele engine, w tym testy), `p4_364_render_frame` 20 passed / 0 failed EXIT 0.
- Dysk przed pełną bramką: po usunięciu własnego targetu 7,7 GiB, potem 10 min odpytywania co 10 s: maksimum 8104 MiB (7,9 GiB) < 8 GiB.
- Pełne `cargo test --all-targets --no-fail-fast` (engine): **NIE WYKONANO — BLOCK INFRA** (dysk 8104 MiB < 8192 MiB; zgodnie z dispatchem nie obchodzę). Zakres zmian obrony: wyłącznie `render_frame.rs` (nowy moduł r1, wołany tylko przez `bridge.rs`) i plik testu tematu; pozostałe cele skompilowały się w clippy `--all-targets`. Pełną bramkę ma powtórzyć Final Control (albo orkiestrator przy integracji) przy ≥ 8 GB. Ostatni pełny przebieg na kodzie r1 (Evaluator): EXIT 0, 3944 passed, 0 failed.
- Target cargo (scratchpad) usunięty po bramkach.

## Pliki spoza allowlisty

Brak nowych w obronie (zmieniane tylko `render_frame.rs` i `p4_364_render_frame.rs` z allowlisty oraz katalog runs). `p4_364_bridge_layers.rs` — bez zmian względem r1 (zmiana mechaniczna Operatora opisana w `01-operator-r1.md`).

## Commit

Commit obrony: patrz `git log -1 rust-port-wip/R-RUSTPORT-P4-364-RENDER-FRAME-R1-obrona` (SHA podany w wyniku Workflow; raport jest w tym samym commicie, więc nie może zawierać własnego SHA).
