# R-RUSTPORT-P4-MARCH-RESZTA-Q1 — Obrona Operatora (odpowiedź na Evaluatora r1)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-MARCH-RESZTA-Q1
GOAL: marsze bitwy oblężniczej krok po kroku zgodne z pinem `07d2fbd72`; Obrona zamyka zarzuty Z1–Z4 Evaluatora r1
ZMIANY/COMMIT: gałąź `rust-port-wip/march-reszta-q1-obrona` z kodu Operatora `d0371f66d` (baza `b41adf6a5`); commit kodu
  `c71da7571` (testy lib + dopisek długu), commit raportu: patrz §5. Pliki: `rust-port/engine/src/domain/siege_tactics_loop.rs`
  (TYLKO moduł testowy `march_incremental_tests`, zero zmian w kodzie produkcyjnym),
  `dyspozycje/autobot/runs/R-RUSTPORT-P4-MARCH-RESZTA-Q1/01-operator-r1.md` (sekcja „Długi”), ten plik.
TESTY: patrz §3
BLOKADY: brak
RUNDY: obrona po Evaluatorze r1 (runda 1/5)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## 1. Odpowiedzi na zarzuty

| Zarzut | Odpowiedź | Poprawka | Dowód |
|---|---|---|---|
| Z1 (E1, `dNow` z `_nearestEnemy`) | **PRZYJMUJĘ** | test `odwrot_dnow_z_najblizszego_wroga_nie_z_pierwszego` | E1 → ten test FAIL (§3) |
| Z2 (E8, C-FLANK bez kroku = `done()`) | **PRZYJMUJĘ** | test `jazda_c_flank_brak_kroku_skierowanego_konczy_bez_manewru` | E8 → ten test FAIL |
| Z3 (E6 szarża bez `moveLeft > 0`, E7 `NaN` w callbacku jazdy) | **PRZYJMUJĘ** (testy zamiast długu) | testy `jazda_szarza_bez_ruchu_konczy_bez_kroku`, `jazda_callback_nan_konczy` | E6/E7 → te testy FAIL |
| Z4 (dopisek do długów) | **PRZYJMUJĘ** | `01-operator-r1.md`, „Długi” pkt 1: duplikat krokowy kopii atomowej (MARCH-ATOMIC-TESTONLY), luka E1/E6/E7/E8 do r1, zamknięta testami Obrony | diff w `c71da7571` |

### Z1 — szczegóły (pin `_bestFallBackStep` `:7186-7219`)
Pin: `dNow = manhattan(ru, _nearestEnemy(ru))`, kafel odrzucany przy `dMin < dNow`. Test: atakujący w (4,0), wrogowie
D0 (12,0) — PIERWSZY w `live_enemy_cells` — i D1 (7,0) — najbliższy. Asercja kolejności listy `[12, 7]` w teście.
Poprawnie `dNow = 3`, kafel (3,0) ma `dMin = 4` i wygrywa (homeBias). Z `dNow` z pierwszego wroga (8) każdy kafel
odpada i `fall_back_enter` zwraca `Done` bez kroku — mutant E1 daje dokładnie to.

### Z2 — szczegóły (pin callback `_cavDirectedManeuverStep` `:6436-6444`)
Pin: w callbacku `if (this._cavDirectedManeuverStep(ru, done, t2, desired)) return; done();` — bez `_cavManeuverStep`.
Test: jazda z `attackDirection = Tyl`, pierwszy krok C-FLANK (asercja `CavDirected { tgt: 0 }`), potem wszystkie
pola obok celu (5,0), (7,0), (6,1) zajęte, więc BFS kierunkowy nie ma celu, a zwykły krok manewru istnieje. Oczekiwane:
`done()` w callbacku, brak kroku, brak zegarów.

### Z3 — szczegóły
- E6 (pin `:6404-6405` `if (stepKey && ru.moveLeft > 0)`): `cav_enter` z `moveLeft = 0`, cel w (4,0), brak sąsiada;
  manewry odpadają (`moveLeft <= 0`), krok szarży istnieje → pin `done()`. Kontrola w tym samym teście: z `moveLeft = 4`
  ta sama scena daje krok. Osiągalność w produkcji: niska (aktywacja jazdy ma zwykle `moveLeft > 0`), ale strażnik jest
  w pinie i teraz jest pilnowany.
- E7 (pin `:6439`/`:6496` `if (ru.moveLeft > 0)`): `cav_step_end` z `moveLeft = NaN` → `Done`, bez kroku; z
  `moveLeft = 1` ten sam callback robi kolejny krok (2,0).

## 2. Zakres zmian
Wyłącznie 4 nowe testy w `#[cfg(test)] mod march_incremental_tests` (`siege_tactics_loop.rs`) i dopisek w raporcie
Operatora. Kod produkcyjny bez zmian ⇒ strumień akcji, wektory i c1 bez zmian względem `d0371f66d`.
Brak `#[ignore]`, brak osłabionych asercji, brak `git add -A`, brak nazwy modelu w commitach.

## 3. Testy (CARGO_TARGET_DIR w scratchpadzie, `CARGO_INCREMENTAL=0`, debug off)
- `cargo test --lib march_incremental_tests`: **41 passed / 0 failed** (było 37 + 4 nowe).
- Mutanty Evaluatora (łatka `02-evaluator-mutanty.patch` nałożona tymczasowo na `c71da7571`, potem cofnięta
  `git checkout`, drzewo czyste), `MR_MUT=<id> cargo test --lib march_incremental_tests`:

| Mutant | Wynik | Test, który zabija |
|---|---|---|
| brak (NONE) | 41/0 | — |
| E1 | 40/1 **ZABITY** | `odwrot_dnow_z_najblizszego_wroga_nie_z_pierwszego` |
| E6 | 40/1 **ZABITY** | `jazda_szarza_bez_ruchu_konczy_bez_kroku` |
| E7 | 40/1 **ZABITY** | `jazda_callback_nan_konczy` |
| E8 | 40/1 **ZABITY** | `jazda_c_flank_brak_kroku_skierowanego_konczy_bez_manewru` |

Bilans mutantów Evaluatora po Obronie: 12 → zabite 10 (6 + E1, E6, E7, E8), równoważne 2 (E10, E12), ocalałe
nierównoważne **0**. Razem z mutantami Operatora (22 zabite, M18 równoważny): 32 zabite, 3 równoważne.

- Bramki engine na `c71da7571`: `cargo fmt --check` EXIT 0; clippy i pełny test — §4.

## 4. Bramki pełne
Na `c71da7571` (engine, jeden build naraz, target w scratchpadzie usunięty po bramce):
- `cargo fmt --check` EXIT 0
- `cargo clippy --all-targets -- -D warnings` EXIT 0
- `cargo test --all-targets --no-fail-fast` EXIT 0: 557 wyników `test result`, **4338 passed / 0 failed / 1 ignored**
  (Evaluator na `d0371f66d`: 4334/0/1; różnica = 4 nowe testy Obrony).
- client/renderer: nie uruchamiane (dispatch: wykonuje orkiestrator przy integracji; Obrona nie zmienia kodu
  produkcyjnego).

## 5. Commity
- `c71da7571` — testy lib E1/E6/E7/E8 + dopisek długu MARCH-ATOMIC-TESTONLY.
- commit tego raportu — na tej samej gałęzi `rust-port-wip/march-reszta-q1-obrona` (bez push).

## Długi
Bez zmian względem `01-operator-r1.md` (pkt 1 uzupełniony o Z4). Uwagi Evaluatora U1–U5 bez sprzeciwu: U2 (martwy
strażnik `same_seq_units`) zostaje jako zabezpieczenie kontraktu; U4 (`mr` @1 `SKIP_STEP_BUDGET`) = dług DIAG-BUDGET-1MS;
U5 — bramki client i renderer przy integracji (orkiestrator).
