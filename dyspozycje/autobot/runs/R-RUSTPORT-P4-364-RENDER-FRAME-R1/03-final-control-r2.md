# R-RUSTPORT-P4-364-RENDER-FRAME-R1: Final Control, runda 2

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-RENDER-FRAME-R1
GOAL: domknięcie luk ramki renderera z `RENDER_FRAME_GAPS` (DODATEK r2) wg kodu webu (pin `07d2fbd72`): `overlays.buildHighlight.hexes`, `stacks.vitalsByRepId`, `units[].hp`/`hpMax` (`hpMaxEffective`); `starvingRepIds`/`goldDeficitRepIds` i `workerFields` jako jawne luki (#310).
ZMIANY/COMMIT: oceniany commit `2facff586` (Obrona r2), łańcuch `ff037335d` (BAZA r2) → `d82635c1d` (Operator r2) → `a028c5039` (Evaluator r2, FAIL) → `2facff586`. `git merge-base --is-ancestor ff037335d 2facff586` = TAK. FC nie zmienia kodu. Dopisane tylko pliki w katalogu runs: ten raport, `gate-*-fc-r2.log`, `gate-full-test-fc-r2.summary.log`, `mutate-fc-r2.log`.
TESTY: odtworzone samodzielnie na `2facff586` (env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie `fc364r2/tgt`, usunięty po bramkach): fmt EXIT 0; clippy `--all-targets -D warnings` EXIT 0; `--test p4_364_render_frame` 37 passed EXIT 0; pełny engine `--all-targets --no-fail-fast` (w tle, `setsid nohup`) EXIT 0: 527 bloków, 3965 passed, 0 failed, 1 ignored (sprzed tematu). Mutanty (próba FC): EV1, EV2, EV6, EV10 ZABITE; Z1 PRZEŻYŁ (równoważny, potwierdzony w kodzie).
BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge na `origin/rust-port/parity-v2`).
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki (FC, samodzielnie)

| Bramka | Wynik | Log |
|---|---|---|
| `cargo fmt --check` | EXIT 0 | `gate-fmt-fc-r2.log` |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 | `gate-clippy-fc-r2.log` |
| `cargo test --test p4_364_render_frame` | 37 passed, EXIT 0 | `gate-test-fc-r2.log` |
| `cargo test --all-targets --no-fail-fast` (engine) | EXIT 0; 527 bloków; 3965 / 0 / 1 ignored | `gate-full-test-fc-r2.summary.log` |

Dysk: przed sekwencją bramek 8678 MiB (≥ 8 GB). Po zbudowaniu targetu dla fmt/clippy/testu tematu, w chwili startu pełnej bramki było 6337 MiB. Pełna bramka przeszła bez błędu dysku. Po usunięciu targetu jest 15006 MiB. Zapisuję to jako uwagę (U1) i nie traktuję jako BLOCK INFRA, bo próg sprawdzono przed startem bramek, tak jak robili to Operator i Evaluator.

## 2. Allowlista i higiena

- `git diff --name-only ff037335d 2facff586` poza katalogiem runs zawiera tylko `rust-port/engine/src/domain/render_frame.rs` i `rust-port/engine/tests/p4_364_render_frame.rs`, czyli pliki z allowlisty r2. Producenci (`overlays_view`, `recruitment`, `city_view`, `map_view`), `playable.rs`, `bridge.rs`, view-model i renderer są bez zmian. `Cargo.lock` nie jest zmieniony.
- Commity nie mają linii `Co-Authored-By` z nazwą modelu (#289).
- W pliku testów nie ma `#[ignore]`. Usunięte asercje to dwie: `hp_max None` i `Some(20.0)`, obie zastąpione przez `Some(22.0)` zgodnie z `syncRuntimeUnitHpState` (`main.ts:33109-33118`). Evaluator zaakceptował to w r2 i nie jest to osłabienie.
- `CONTRACT_VERSION`, `bridge.rs` i kontrakt Q6-2 (D-R3-3) są nietknięte w r2. Test Q6-2 jest zielony.
- Integracyjnie: `origin/rust-port/parity-v2` przesunęło się na `0941c8225`. `ff037335d` jest jego przodkiem, a `git merge-tree --write-tree origin/rust-port/parity-v2 2facff586` przechodzi bez konfliktu. Pliki tematu na parity są bez zmian od bazy.

## 3. Orzeczenia zarzutów Evaluatora r2

### Z1 (epoka limitu miast z fotela zapytania zamiast `player.era`): ODDAL (naprawione w Obronie)

Pin sprawdziłem samodzielnie. `canFoundPlayerCityAt` używa `const playerEra = player.era ?? 1` (`main.ts:12924`). `player` to `const player = createPlayerState()` (`main.ts:13713`), który jest wpisany w `playerStateByHuman` wyłącznie pod `HUMAN_OWNER_PRIMARY` (`:13771`). Komentarz pinu przy `:22230` wprost nazywa go „aliasem WYŁĄCZNIE fotela 0”. `switchActiveHuman` (`:13897` i dalej) nie przepisuje `player`. Zarzut Evaluatora był więc trafny, a poprawka `era: owner_era(state, HUMAN_OWNER_ID)?` jest zgodna z pinem.

Brak wektora asymetrii uzasadniono poprawnie. `owner_era_facts` (`turn_war_epoch.rs:118-135`) daje każdemu człowiekowi epokę startu, a AI dostaje pusty `ownerEraByOwner`, czyli fallback `game_start_era`. Dla każdego `PlayableState` zachodzi więc `owner_era(me) == owner_era(HUMAN_OWNER_ID)`. Potwierdza to mutant Z1, który przeżywa (`mutate-fc-r2.log`) i jest równoważny. Test `obrona_r2_z1_…` pilnuje tego niezmiennika i sprawdza limit na granicy (`cities.ts:1316-1327`: `base + (era-1)*5`, `?? 10`).

### Z2 (9/11 mutantów przeżywa): ODDAL (naprawione w Obronie)

Obrona dodała 10 testów z wyroczniami liczonymi ręcznie (`pin_axial_distance`, stałe 5/5/4 z odwołaniem do pinu, listy heksów zapisane wprost). Sprawdziłem w pinie:

- `BATTLE_EXCLUDED_TYPES = {Zwiadowca, Osadnik}` (`auto-battle-power.ts:37`);
- `veteranLevelFromBattles` z progami 3 i 1 oraz `veteranStarCount = min(3, …)` (`veteran.ts:105-120`);
- mapa `Łatwy → easy → poziom 1` (`main.ts:44371-44379`, `:9517-9520`);
- `Math.max(0, Math.min(maxHp, u.hp))` (`main.ts:33115`).

Mutanty EV1, EV2, EV6 i EV10 przepuściłem samodzielnie przez skrypt Obrony. Wszystkie są ZABITE, a źródło po przebiegu jest przywrócone (`git status` czysty). Log Obrony podaje 11/11. Odtworzone przeze mnie wyniki zgadzają się z nim co do testów, które padają.

### Z3 (wyrocznie z funkcji crate'u): ODDAL

Evaluator oznaczył to jako uwagę, nie blokadę. Nowe testy liczą bez funkcji crate'u. Jedyny wyjątek to literał 26.6 w EV5. Wynika on z `ai-params.json` (−0.05) i `Math.round(x*10)/10`, a test pilnuje też jego relacji do 27. Stare testy r2 mają reguły zapisane jawnie i sprawdzone z pinem, co Evaluator zaakceptował.

## 4. Luki 4 i 5 (dyspozycja r2)

`stacks.starvingRepIds`, `goldDeficitRepIds` i `overlays.workerFields` = `[]` są jawnie wpisane w `RENDER_FRAME_GAPS` z zależnością #310 (EKONOMIA-STAN) i #304, a test `h_jawne_luki_ramki` to odzwierciedla. Zgadza się to z decyzją techniczną orkiestratora w DODATKU r2: stan nie niesie wyniku tiku ekonomii (`_lastTicks.glodWojska` / `deficytZlota`) ani `City` ekonomii. To nie jest ciche zero.

## 5. Uwagi (nie blokują)

- **U1 (dysk):** w chwili startu pełnej bramki FC było 6337 MiB, bo zajmował je target zbudowany w tej samej sekwencji. Bramka przeszła. Dla orkiestratora: próg 8 GB warto mierzyć tuż przed `cargo test --all-targets`, nie przed całą sekwencją.
- **U2 (decyzja techniczna do rejestru):** nieznana etykieta trudności daje w Rust błąd `RenderFrameError::UnknownDifficulty`, a w webie fallback `?? 'normal'` (`main.ts:44379`). Stan Rust ma etykietę z menu, więc w grze ta ścieżka nie występuje. Orkiestrator powinien wpisać to do `REJESTR-RUST.md` jako decyzję techniczną (jawny błąd zamiast cichej wartości). Nie jest to decyzja gameplay.
- **U3 (D-OP-5/D-OP-7, hotseat):** budowa ulepszeń dla fotela głównego (literał `0`) i bonus trudności AI dla drugiego człowieka to litera pinu. Odwzorowano je 1:1 i przyjmuję je.
- **U4:** `mutate-eval-r2.py` na `a028c5039` zawiera tylko EV10 i EV11. Obrona odtworzyła EV1–EV9 z opisów, a zgodność wzorców z opisami w `02-evaluator-r2.md` sprawdziłem wyrywkowo (EV1, EV2, EV6).

## 6. Werdykt

PASS-WITH-NOTES. Wszystkie zarzuty (Z1, Z2, Z3) orzeczone jako ODDAL po naprawach w Obronie. Żadnego NAPRAW i żadnej sprawy DO DECYZJI CZŁOWIEKA. Bramki są zielone (odtworzone przez FC), allowlista jest czysta, luki 4 i 5 są jawne z numerem długu. Do integracji: `2facff586` (gałąź `rust-port-wip/364-render-frame-r2-obrona`). Merge na aktualne parity `0941c8225` przechodzi bez konfliktu.
