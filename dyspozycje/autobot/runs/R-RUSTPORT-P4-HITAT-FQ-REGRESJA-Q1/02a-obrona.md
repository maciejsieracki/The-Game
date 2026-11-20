# R-RUSTPORT-P4-HITAT-FQ-REGRESJA-Q1 — Obrona Operatora r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-HITAT-FQ-REGRESJA-Q1
GOAL: przywrócić zgodność kontraktu silnik ↔ renderer po FRAME-QUANT (`PlaybackError::HitAt`) przy niezmienionych 42 wektorach pinu.
BAZA OBRONY: `a7fc6f17b` (= kod Operatora `6d3b88858` + raport Evaluatora), gałąź `rust-port-wip/hitat-fq-q1-obrona`.
ZMIANY/COMMIT: `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` (tylko dopisek, nowy test), ten raport. Kod testu: `1b014bd7c`; finalny SHA raportu w odpowiedzi Workflow (commit następny po `1b014bd7c`).
RUNDY: 1/5
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

| # | Zarzut | Odpowiedź |
|---|---|---|
| 0 | Bramki odtworzone, regresja odtworzona, mutanty V1/V6/V10/V11 zabite | Bez sporu (potwierdzenie, nie zarzut). |
| N1 | E3 przeżył; test kontraktu nie obejmuje ciosu po `_advanceStep` (`attack_pre > 0`) | **PRZYJMUJĘ częściowo** — nowy test + dowód, że E3 jest dziś mutantem równoważnym |
| N2 | Niespójna semantyka `land_at` (TowerShot/Boulder nominalne, Shot na siatce); V4 przeżył | **ODRZUCAM zmianę kodu** w tym temacie; dług opisany niżej do rejestru |
| N3 | `PIN_FRAME_MS = 16` stałe w rendererze | **ODRZUCAM** jako zarzut do tego tematu (poza allowlistą, produkcja = 16) |
| N4 | Reguła bramek tylko jako propozycja | **ODRZUCAM** jako zarzut do Operatora (`REJESTR-RUST.md` poza allowlistą; należy do orkiestratora) |
| N5 | Bramka renderera przy 10,5 GB | **Nie dotyczy Operatora** (bramka Evaluatora); uwaga dla FC/orkiestratora |

### N1 — PRZYJMUJĘ (test) + dowód równoważności E3

Dopisany test `kontrakt_czasu_ciosu_po_krokach_advance_step` (`engine/tests/p6_k5loop_wiring_a_pin.rs`, sam dopisek,
0 usuniętych linii, wektory nietknięte):
- sprawdza `hit_at - t0 == frame_raf(klatka, 150)` dla KAŻDEGO `Melee` we WSZYSTKICH wektorach, także w bliźniakach
  `frameMs` (`_klatka1`/`_klatka4`) przy ich własnej klatce (`diag_set_speed_mul`). Dotychczasowy test kontraktu
  pomijał bliźniaki;
- liczy ciosy „po kroku” (wcześniejszy `Move` tego samego atakującego w tym samym kroku sesji, `t0` mniejsze niż cios).

Pomiar (log `scratchpad/hitat-ob-e3.log`): **0 ciosów po kroku na 537 ciosów** we wszystkich wektorach.
Przyczyna jest strukturalna, nie dotyczy braku scenariusza:
- `advance_step` (`siege_tactics_loop.rs:2851+`) liczy marsz ATOMOWO (D-WIRA-18). Po każdym kroku callback
  `advance_after_move` (`siege_tactics_advance.rs:144-159`, pin `:8273-8284`) zwraca `Done`, gdy `can_attack_from`.
- Decyzja `AdvanceDecision::Attack` (`siege_tactics_advance.rs:93-96`, pin `:8241-8246`) wymaga TEGO SAMEGO
  `can_attack_from` na początku iteracji. Między callbackiem a kolejną iteracją stan się nie zmienia (`gap_after`
  liczy tylko czas, `occ_by_key` i pozycja bez zmian). Dlatego `attack = Some(..)` przy `elapsed > 0` jest dziś
  nieosiągalne, a `attack_pre > 0` z `Melee` nie występuje. **E3 (`saved + hit` zamiast `saved + dur`) jest mutantem
  równoważnym**: po wstawieniu E3 oba testy kontraktu przechodzą (2/2, log `hitat-ob-e3.log`), zgodnie z analizą.
- W pinie między krokami `_schedule(STEP_GAP)` działają inne jednostki, więc gałąź stanie się osiągalna po marszu
  przyrostowym (MARCH-INCREMENTAL, w toku równolegle). Nowy test sprawdza wtedy odstęp od razu, bez zmian. Licznik
  „po kroku” jest diagnostyczny. Celowo nie ma asercji pokrycia `> 0`, bo blokowałaby integrację do czasu
  MARCH-INCREMENTAL. Asercja pokrycia zostaje: `razem > 0`.

Czułość nowego testu (mutant M-OB1, log `hitat-ob-m2.log`): `hit_at = saved + attack_pre + frame_raf(16.0, body)`
(klatka zaszyta zamiast `self.frame_ms`) daje **ZABITY**: `mur_jazda_rzeka_klatka1: cios w t0 119620`. Stary test
kontraktu przy tym samym mutancie przechodzi (`ok`), więc nowy test realnie poszerza pokrycie (bliźniaki klatek).

Do rejestru (orkiestrator): po integracji MARCH-INCREMENTAL powtórzyć E3. Jeśli licznik „po kroku” > 0, E3 musi
zostać zabity.

### N2 — ODRZUCAM zmianę kodu w tym temacie

Dispatch: „napraw tylko to, co faktycznie łamie renderer/klienta”. TowerShot/Boulder z nominalnym `land_at`
(380/700) nie łamią renderera ani klienta (bramki: client 36/36, renderer 745/745). Przeżycie V4 (renderer akceptuje
też TowerShot w `t0+384`) oznacza luźniejszą akceptację wartości, której silnik dziś nie emituje. Nie ma to skutku
w odtwarzaniu. Gdyby test renderera zamroził odrzucanie 384, utrudniłby przyszłe ujednolicenie do siatki pinu
(`_fireOneTower` `:4261-4262`, kamień `:7555` przez `_schedule`, czyli w pinie 384/704). Właściwy ruch to osobny temat:
silnik emituje `frame_sched` dla TowerShot/Boulder, a w tym samym commicie zmienia się `playback.rs`
(`is_pin_event_time`) i test kontraktu silnika (380→384, 700→704). Wpis do rejestru jako dług
**SHOT-LAND-AT-RENDER/TOWER-BOULDER** należy do orkiestratora, bo `REJESTR-RUST.md` jest poza allowlistą.

### N3 — ODRZUCAM

Klatka produkcyjna jest stała, 16 ms (`siege_battle_session.rs:1049`). `speedMul ≠ 1` ustawia wyłącznie
`#[doc(hidden)] diag_set_speed_mul` (testy silnika), a klient go nie woła. Przekazanie klatki przez `PlaybackOpts`
wymaga `client/src/lib.rs`, który jest poza allowlistą. Opisane w `01-operator-r1.md` §7 jako dług do przyszłego
tematu przyspieszenia bitwy.

### N4 — ODRZUCAM (kompetencja orkiestratora)

Reguła „zmiana strumienia akcji silnika ⇒ bramki `client` + `renderer`” jest zapisana w `01-operator-r1.md` §7.
Wpis do `REJESTR-RUST.md` jest poza allowlistą i należy do orkiestratora (dispatch: „dodaj do bramek integracji”,
czyli do procesu integracji).

### N5 — nie dotyczy Operatora

Zarzut dotyczy bramki Evaluatora. W mojej obronie nie budowałem renderera, bo zmieniłem tylko test silnika.
Wolny dysk w trakcie: około 11 GB.

## Bramki obrony (CARGO_INCREMENTAL=0, debug off, target `scratchpad/hitat-ob-target`, usunięty po bramkach)

| Bramka | EXIT | Wynik |
|---|---|---|
| engine `cargo fmt --check` | 0 | — |
| engine `cargo clippy --all-targets -- -D warnings` | 0 | — |
| engine `cargo test --test p6_k5loop_wiring_a_pin` | 0 | 10 passed (w tym 42 wektory bajt w bajt, oba testy kontraktu) |
| engine `cargo test --all-targets --no-fail-fast` (tło) | 0 | 4226 passed, 0 failed, 1 ignored (istniejący); = 4225 Evaluatora + 1 nowy test (log `scratchpad/hitat-ob-full.log`) |
| client / renderer | nie uruchamiano | kod `src/**` i renderer bez zmian względem `6d3b88858` (Evaluator: 36/36, 745/745) |

Kod źródłowy silnika po mutantach przywrócony (`git status`: zmieniony tylko plik testu).

## BLOKADY

Brak. Do orkiestratora: dług N2 (TowerShot/Boulder `land_at`), N1-follow-up (E3 po MARCH-INCREMENTAL), N4 (wpis reguły bramek).
