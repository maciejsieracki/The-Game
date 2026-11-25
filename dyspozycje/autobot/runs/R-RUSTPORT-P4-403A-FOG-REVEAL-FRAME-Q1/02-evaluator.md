# R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1 — Evaluator (adwersarialny), r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (port Rust, ramka silnika → renderer)
TEMAT: R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1 (#408, część A tematu #403)
GOAL: `FogRevealDto` aktywnego fotela jedzie z `GetRenderFrame` do `FrameInputs`. `land_reveal` i `river_reveal_keys` pochodzą z DTO, a `FogReveal::from_dto` ma produkcyjnego wołającego.
ZMIANY/COMMIT: oceniany kod Operatora `15a27fb7a` (gałąź `rust-port-wip/R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1`, WIP `20310bee2`). Baza `d831a69a820f0ea4dd094178ae51d09aebc39686` = `origin/rust-port/parity-v2` (`merge-base --is-ancestor`: TAK). Evaluator nie zmienia kodu; ten raport to jedyny plik commitu Evaluatora.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## 1. Allowlista i dyscyplina

| Plik | W allowliście | Uwagi |
|---|---|---|
| `view-model/src/root.rs` | tak | pole `reveal: Option<FogRevealDto>`, `#[serde(default, skip_serializing_if = "Option::is_none")]` |
| `engine/src/domain/render_frame.rs` | tak | `reveal = layers.fog.fog_active.then(\|\| layers.fog.reveal.clone())` |
| `renderer/src/view/frame.rs` | tak | `FogReveal::from_dto` w `from_dto_with_priority`, nowe pola, `FrameError::Reveal` |
| `engine/tests/p4_364_render_frame.rs` | tak | +5 `r403a_*` |
| `client/tests/engine_bridge_renderer.rs` | tak | +4 (`fog_reveal_frame`) |
| `renderer/tests/view_frame.rs` | tak („testy renderera dla `frame.rs`”) | +4 testy, fikstura `reveal: None`, 2 nowe asercje |
| `01-operator-r1.md` | tak | |

- Plików spoza allowlisty brak. `dto_bridge.rs` i `fog.rs` bez zmian. `renderer/Cargo.lock` nie jest w commicie (DŁUG-T1-LOCK cofnięty).
- `#[ignore]` w diffie: 0. Usunięte lub osłabione asercje: 0 (`grep '^-.*assert'` puste). `git diff --check`: czysto.
- Commity bez nazwy modelu, tylko `Claude-Session:`. Brak zmian w `gra/`, brak pushu i integracji.

## 2. Web najpierw: tekst pinu `07d2fbd72` (`git show`)

- `main.ts:13073-13080` `startRevealKeysForRiverFog`: `if (!isAwaitingFirstPlayerCity() || meStartHex === null) return undefined; return computeVisibleAt(meStartHex.q, meStartHex.r, map, startRevealRadius)`. To jest zgodne z `dto_bridge.rs:145-161`: brak heksu startu → `?`, brak oczekiwania → `None`. Kolejność obu sprawdzeń nie zmienia wyniku (EV9 niżej jest równoważny).
- `:13485` `useFogRender = fogOn || revealAllLand`. `:13489-13494` gałąź mgły woła `setFog(vis, exploredForRender, { landReveal: revealAllLand, riverRevealKeys: … })`, a `:13505-13506` gałąź bez mgły woła `setFog(ALL_KEYS, ALL_KEYS)` BEZ opcji. W Rust bramką jest `layers.fog.fog_active` (= `useFogRender`, `state.rs:1456`), nie `session.fog_on`, więc zgodnie z pinem. Wartości `Some` i `None` odpowiadają gałęziom pinu.
- `scene.ts:3527-3532` `setFog`: `lastRiverRevealKeys = opts?.riverRevealKeys ?? null`, `landReveal = opts?.landReveal ?? false`. To jest stała `NO_SET_FOG_OPTIONS` dla `reveal = None` w `frame.rs`.
- `computeVisibleAt` w testach: oczekiwane klucze liczy funkcja silnika `compute_visible_at`, ta sama, której używa producent. Sama funkcja jest pokryta wektorami pinu (`engine/tests/p6_4_core.rs:185`, przypadki `"computeVisibleAt"`), więc test kompozycji jest wiarygodny. Komentarz „Niezalezny od producenta” (`p4_364_render_frame.rs:1666`) jest jednak nieścisły (nit).

## 3. Bramki odtworzone przez Evaluatora

Własny `CARGO_TARGET_DIR` (`scratchpad/ev403a/target`, usunięty po bramkach), env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, renderer gpu OFF (bez `--features gpu`), builds renderera sekwencyjnie.

| Bramka | EXIT | Wynik |
|---|---|---|
| fmt `--check`: view-model, engine, renderer, client | 0/0/0/0 | |
| view-model clippy `--all-targets -D warnings` | 0 | |
| view-model test `--all-targets` | 0 | 119 passed, 0 failed |
| engine clippy `--all-targets -D warnings` | 0 | |
| renderer clippy `--all-targets -D warnings` | 0 | |
| renderer test `--all-targets --no-fail-fast` | 0 | 757 passed, 0 failed (baza 753 + 4) |
| client clippy `--all-targets -D warnings` | 0 | |
| client test `--all-targets --no-fail-fast` | 0 | 45 passed, 0 failed (baza 41 + 4) |
| engine PEŁNY `cargo test --all-targets --no-fail-fast` (w tle, 20:37:51 → 21:02:28) | 0 | 4343 passed, 0 failed, 1 ignored (istniejący, nie z tego diffu) |

Operator w raporcie miał część bramek jako NIE_ZMIERZONO. Tutaj są potwierdzone niezależnie. Raport Operatora nie został zaktualizowany: drobna uwaga do Obrony i FC.

Dysk: start bramki renderera przy 10,7 GB wolnego, poniżej progu 12 GB z dispatchu. Równolegle szedł tylko pełny test silnika Operatora (bez renderera). Najniższy stan to 5,2 GB, bez awarii. Po sprzątaniu jest 13,4 GB. To jawne odstępstwo procesowe Evaluatora, nie zarzut wobec kodu.

## 4. Mutanty adwersarialne Evaluatora (skrypt `scratchpad/ev403a/mut.py`, każdy z kompilacją i testami celowanymi, plik przywracany)

Oprócz istniejących testów dołożono tymczasową sondę `ev403a_probe` w `client/tests/engine_bridge_renderer.rs` (NIE w commicie, cofnięta). Sonda sprawdza `revealAllLand = true` E2E przy `fog_on = true` i przy `fog_on = false`. Obie próby sondy przechodzą na kodzie Operatora: ramka niesie `{revealAllLand: true, …}`, `FogReveal::from_dto` nie zwraca `RevealNotApplied`, `land_reveal = true`, `river_fog_active = false`. Ścieżka dev-M jest więc spójna silnik↔renderer.

| ID | Mutacja | Wynik | Kto zabił |
|---|---|---|---|
| EV1 | ramka bramkowana `session.fog_on` zamiast `fog_active` (pominięcie `revealAllLand` w `useFogRender`) | ZABITY | tylko sonda Evaluatora (engine suite PASS) |
| EV2 | `reveal_all_land: false` na sztywno w gałęzi mgły (`dto_bridge`) | ZABITY | tylko sonda Evaluatora (engine suite PASS) |
| EV3 | promień `+1` | ZABITY | engine 1, client 2 |
| EV4 | renderer gubi `land_reveal`, gdy brak kluczy rzek | ZABITY | renderer 2 |
| EV5 | brak `skip_serializing_if` | ZABITY | engine (`r403a_json_ramki_addytywny`) |
| EV6 | brak `serde(default)` | PRZEŻYŁ, RÓWNOWAŻNY | serde derive traktuje brakujące pole `Option<T>` jako `None` także bez `default`. Zachowanie identyczne. |
| EV7 | `river_fog_active` liczone z pominięciem `!landReveal` | ZABITY | renderer 1, client 2 |
| EV8 | ramka zeruje klucze rzek przy zachowanych opcjach | ZABITY | engine 2, client 3 |
| EV9 | zamiana kolejności sprawdzeń start/oczekiwanie | PRZEŻYŁ, RÓWNOWAŻNY | obie gałęzie dają `undefined`/`None`, jak OR w pinie `:13078` |
| EV10 | zanegowane `is_awaiting_first_city` | ZABITY | engine 5, client 4 |

Razem z 9 mutantami Operatora (M1–M9, wszystkie zabite według raportu `01`) kryterium 3 jest spełnione: ≥ 6 mutantów, a każdy przeżywający jest jawnie równoważny.

## 5. Zarzuty i uwagi (żaden nie jest blokujący)

1. **U1 (luka pokrycia, średnia):** gałąź `revealAllLand = true` (ramka silnika → `FrameInputs`) nie ma testu w suicie Operatora. EV1 (gubienie `revealAllLand` w `useFogRender`) i EV2 (stałe `revealAllLand = false` w producencie) przeżywają całą suitę Operatora i giną dopiero na sondzie Evaluatora. Produkcyjnie sesja ma `reveal_all_land = false` na stałe (D-403A-4, `playable.rs:1170, :1185`), więc dziś nie zmienia to gry. Jest to jednak dokładnie mutant „pominięcie `fog_on`” z kryterium 3 w wariancie zgodnym z pinem `fogOn || revealAllLand`. Rekomendacja dla Obrony: dodać do `fog_reveal_frame` (client) albo `p4_364_render_frame` (engine) dwa testy z `reveal_all_land = true` przy `fog_on` true i false. Wzór: sonda w `scratchpad/ev403a/probe.rs`.
2. **U2 (kontrakt, info):** `RenderLayersDto` ma `deny_unknown_fields`. Każda ramka z aktywną mgłą, czyli domyślna produkcja, niesie teraz klucz `reveal` (`{"revealAllLand":false,"riverRevealKeys":null}`), więc odbiorca ze starszą strukturą ramkę odrzuci. JSON bajt w bajt jest zachowany tylko dla `reveal = None`, czyli bez mgły, a tego dotyczy kryterium 4. Jest to zgodne z D-403A-1 i precedensem D-WIRB-5. Przy #411 (TS-TYPES) typ ramki w frontend-v2 musi mieć `reveal?`.
3. **U3 (osiągalność, info, Operator zapisał):** w produkcji start ma zawsze stolicę, a `player_start_hex_by_owner` pochodzi ze stolicy, więc `river_reveal_keys` jest produkcyjnie zawsze `None`. Gałąź „przed pierwszym miastem” jest dziś osiągalna tylko ze złożonego stanu. Do rejestru jako dług parytetu startu (osadnik bez miasta), poza 403A.
4. **U4 (nit):** test `the_reveal_follows_every_refresh` odświeża bez zmiany stanu, więc nie dowodzi, że klucze podążają za stanem, tylko że ramka z cache jest odtwarzana. Komentarz „Niezalezny od producenta” w `p4_364_render_frame.rs:1666` jest nieścisły (patrz §2).
5. **U5 (decyzja Operatora `RenderViewDto`):** `split` daje `reveal: None`, a `join` odrzuca pole. Jest to akceptowalne, bo jedyny produkcyjny wołający `FrameInputs::from_dto_with_priority` to `client/src/lib.rs:674` na `RenderFramePayload` z `GetRenderFrame`, a `RenderViewDto` nie zasila `FrameInputs` w kodzie produkcyjnym. `FrameError::Reveal` jako błąd typowany, a nie ciche pominięcie, też jest akceptowalny.
6. Długi z dispatchu (D-403A-3/4) Operator zapisał poprawnie: RIVER-SCENE (`MapScene` nie rysuje wstęg, odbiorca to tylko dane `river_reveal_keys` i `river_fog_active`) oraz „wpięte ≠ widoczne” (GPU-EMBED i Tauri #410 poza zakresem).

## 6. Kryteria końca

1. `FogReveal::from_dto` ma produkcyjnego wołającego (`frame.rs` `from_dto_with_priority` → `client/src/lib.rs:674`): **TAK**.
2. E2E: przed miastem klucze = `computeVisibleAt` (promienie 2/3/8). Po mieście, przy samym wpisie ever-owned, bez startu i w scenariuszu startowym wynik to `None`. Przy `fog_on=false` jest `None`/`false`. **TAK** (engine i client).
3. Mutanty: ≥ 6 zabitych albo równoważnych. **TAK**, z U1.
4. JSON przy `reveal=None` ma te same 14 kluczy co przed zmianą, fikstury są bez zmian, `CONTRACT_VERSION` mostu = 1: **TAK**.
5. Bramki zielone (sekcja 3), długi RIVER-SCENE i „wpięte ≠ widoczne” są w raporcie Operatora: **TAK**.

TESTY: tabela w sekcji 3 i mutanty w sekcji 4.
BLOKADY: brak.
NASTĘPNY KROK: Obrona Operatora: odnieść się do U1 (rekomendowane 2 testy `revealAllLand`), uzupełnić w `01` wyniki pełnych bramek, opcjonalnie U4. Potem Final Control.
