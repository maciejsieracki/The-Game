# R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 — Evaluator r2 (adwersarialny)

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 część A), runda 2
GOAL r2: generator TS wykonujący tekst pinu 07d2fbd72 + wektory PEŁNEJ bitwy AUTO z murem (>= 6 scenariuszy) + test Rust bajt w bajt
OCENIANY KOD: rust-port-wip/k5loop-wiring-a-q1-r2 @ 3a9c129af (kod = 0afaf4e4f; baza 43ecdb162; merge parity-v2 24c8f3b75 w adadc1129)
ZMIANY/COMMIT: tylko ten raport (gałąź oceny rust-port-wip/k5loop-wiring-a-q1-r2-eval)
TESTY: §2 (wszystkie bramki odtworzone, EXIT 0)
BLOKADY: zarzut E2-1 podważa blokadę B-WIRA-PIN-1 zgłoszoną przez Operatora (pomiar §3)
RUNDY: 2/5
NASTĘPNY KROK: Obrona r2 (02a), potem Final Control
DEPLOY/PUSH: NIE WYKONANO
```

Uwaga: plik `02-evaluator.md` należy do rundy 1 i został bez zmian. Ten raport dotyczy rundy 2.

## 1. Allowlista i higiena

| Kontrola | Wynik |
|---|---|
| Pliki zmienione przez Operatora r2 (`43ecdb162..5682e46ab` + `adadc1129..3a9c129af`) | `siege_battle_session.rs`, nowe `p6_k5loop_wiring_a_gen.mjs`, `p6_k5loop_wiring_a_pin.rs`, `p6_k5loop_wiring_a_pin_vectors/{vectors,pin_data}.json`, raport i skrypt mutantów. Wszystkie w allowliście (DODATEK r2). |
| Merge `adadc1129` (`parity-v2` 24c8f3b75) | czysty. Wnosi cudzy temat P4-1I5A (`renderer/`, `view-model/`, `siege_tactics_actions.rs`, testy). To nie jest zmiana Operatora, ale integrator musi to wiedzieć. |
| `bridge.rs`, `bridge_contract.rs`, `gra/**`, `Cargo.*`, `REJESTR-RUST.md` | nie ruszane |
| `#[ignore]` w nowych plikach | brak |
| Asercje istniejących testów | bez zmian, bo istniejące testy nie są dotknięte |
| Atrapy w generatorze | wyłącznie `three`, `document`, `window`, zasoby, `import.meta.glob` i `localStorage`. Jedyna podmiana tekstu to rzut `_singleBlow` `:8960` ze strażnikiem linii. Logika bitwy (`_beginTurn`, `_drainTimers`, `_runFastForward`, `_singleBlow`, ruch, mur, wieże) nie jest atrapą. Zgodne z DODATKIEM r2 pkt (2). |

## 2. Bramki odtworzone (`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --release --test p6_k5loop_wiring_a_pin` | EXIT 0, 3 passed |
| `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | **FULL_EXIT=0**, 545 × `test result: ok`, 0 FAILED (`p6_k5loop_wiring_a_pin` 3/3, `p6_k5loop_wiring_a` 22/22, `bridge_contract` 9/9) |
| Generator odtworzony (`node tests/p6_k5loop_wiring_a_gen.mjs`, 3 min 40 s) | MD5 zgodne z raportem: `269b4da23249b441e1837a2b160cb258 vectors.json`, `432eed76e34a0e8cc96ec548e88eae64 pin_data.json`. Strażnik SHA-256 pinu przeszedł. |

Bramki techniczne przechodzą. Kryterium merytoryczne rundy 2 nie jest spełnione (§3–§5).

## 3. Zarzut E2-1 (KRYTYCZNY): diagnoza B-WIRA-PIN-1 nie wytrzymuje pomiaru

Operator twierdzi, że wszystkie 5 rozbieżności wynikają z kwantyzacji klatką 16 ms. Według niego pin daje 320 ms na krok (`_raf(step)` + `_schedule(70)`), a Rust 310 ms. Jako naprawę proponuje osobny temat „FRAME-QUANT”, czyli kwantyzację ciała do 16 ms.

**Eksperyment Evaluatora.** Ten sam generator (kopia w scratchpadzie, bez zmian w logice pinu). Zmieniłem tylko krok klatki sterownika `requestAnimationFrame` w trybie czasu rzeczywistego z 16 ms na **2 ms**. Przy 2 ms pin liczy krok dokładnie jak Rust: 240 + 70 = **310 ms**. Ślad: `T 320, 630, 940 …` dla a1, czyli identycznie jak `slad_diagnostyczny_na_zadanie` w Rust.

| Scenariusz | pin, klatka 16 ms (wektor) | pin, klatka 2 ms (krok 310 ms jak Rust) | Rust |
|---|---|---|---|
| `palisada_liczni_taran` | atakujący, tura 53, 61 rzutów | **atakujący, tura 53, 61 rzutów; cały `expect` identyczny z wektorem (HP bit w bit)** | tura 54, inne HP |
| `mur_wieza_obl_las` | obrońca, tura 26, 30 rzutów | **obrońca, tura 26, 30 rzutów** | tura 52 |

Wniosek: wynik pinu NIE zależy od kroku 320/310 ms. Przy osi czasu kroków równej osi Rust pin nadal daje swój wynik, a nie wynik Rusta. Proponowana naprawa (kwantyzacja ciała do 16 ms) nie jest więc udowodniona jako wystarczająca ani potrzebna. Przyczyna rozbieżności leży gdzie indziej.

**Pierwsza rozbieżność `mur_wieza_obl_las` nie dotyczy czasu.** Porównałem ślad pinu (`WIRING_A_TRACE`) ze śladem Rust (`slad_diagnostyczny_na_zadanie`). Sekwencja MOVE jest identyczna przez 11 tur. Do tego momentu nie ma ani jednego strzału wieży, ciosu ani rzutu. W turze 12 łucznik `a3` (Łucznik, doktryna AUTO):
- pin: `35,78→36,78→37,78→38,78` (3 kroki), po czym wieża rzędu 78 strzela do `a3`;
- Rust: `35,78→36,78→37,78` (2 kroki, stop).

Pin daje 3 kroki zarówno przy klatce 16 ms, jak i przy 2 ms. Do tej chwili stan obu stron jest identyczny, więc ta rozbieżność jest LOGICZNA. Dotyczy decyzji `_rangedForwardStep` (`battleScene.ts:6776-6809`): `moveLeft`, koszt terenu Las, `_nearestEnemy`/zasięg albo `lineAllowsRangedStep` (`_rangedFiringStepStaysBehindMelee` `:8175-8189`, `_compactAttackAllowsStep`). Nie ma związku z osią czasu. Kod jest w allowliście (`siege_tactics_loop.rs`, „minimalne poprawki wymagane przez sesję, uzasadnione pinem”).

**`palisada_liczni_taran`: opis Operatora pasuje do atomowej aktywacji, nie do 10 ms.** Ślad Operatora mówi, że w Rust `a2` „zdążył już odejść na 39,86”, a w pinie stoi jeszcze na 39,82. To przesunięcie o 4 wiersze w jednej aktywacji. `LoopBody::start` wykonuje całą aktywację synchronicznie (`siege_tactics_loop.rs:128-131`: „Zwraca czas trwania, po którym sterownik planuje zakończenie”), więc `unit_cell` dla `pickTowerTarget` może widzieć pozycję końcową. W pinie wieża widzi pozycję pośrednią (`_doMove` co krok, `_fireOneTower` `:4228-4233` na bieżących pozycjach). Tę hipotezę Operator powinien zweryfikować w Obronie. Pomiar z klatką 2 ms wyklucza jednak tezę, że winny jest dryf 320/310.

Dodatkowa obserwacja: odstęp między aktywacjami przy nominalnych 310 ms wynosi w pinie 560 ms (ślad 2 ms: `940 → 1500`), a w Rust 564 ms (`940 → 1504`). Sesja Rust jest więc hybrydą: ciało liczy nominalnie, a zegar `_schedule` jest kwantowany klatką 16 ms. Taki model nie odpowiada pinowi przy żadnej długości klatki. Do zapisania jako decyzja techniczna.

Skutek: „BLOCK (częściowy)” z jawną listą `ROZBIEZNE_B_WIRA_PIN_1` opiera się na nieudowodnionej przyczynie i przerzuca na osobny temat pracę, która według pomiaru jest naprawą logiki w zakresie tego tematu. DODATEK r2 pkt (3) wymaga naprawy Rust w allowliście albo blokady z numerami linii pinu dla PRAWDZIWEJ przyczyny. Wymóg nie jest spełniony.

## 4. Zarzut E2-2: kryterium końca r2 niespełnione

- Zgodność bajt w bajt: 3/8. Zgodne są wyłącznie scenariusze bez ciosów (sufit 150 bez kontaktu, 0 rzutów). Pełnej bitwy z wyłomem, ucieczką i zwycięstwem nie odtworzył żaden zgodny scenariusz.
- Mutanty sterownika pełnej bitwy: 3/14 zabitych według raportu Operatora. Dispatch r2 wymaga ≥ 10. Operator sam to przyznaje.
- Pokrycie (`pokrycie_scenariuszy`) sprawdza wyłącznie wektory pinu, nie wynik Rust. Wyłom, ucieczka, sufit 400 i zwycięstwo obu stron są pokryte tylko po stronie oczekiwań. Rust nie odtwarza żadnego z nich.

## 5. Zarzut E2-3 (test): lista blokady akceptuje także błąd sesji

`wektory_pinu_pelnej_bitwy_bajt_w_bajt` (`p6_k5loop_wiring_a_pin.rs:299-311`) zamienia `Err(e)` na `vec!["błąd sesji …"]`. Dla scenariuszy z listy `ROZBIEZNE_B_WIRA_PIN_1` taki wynik przechodzi jako „oczekiwana rozbieżność”. Mutant, który zwraca błąd albo panikuje dopiero w środku bitwy z ciosami, nie zostanie więc wykryty przez ten test. Lista musi wymagać `Ok(..)` z rozbieżnością danych, a nie dowolnego niepowodzenia.

## 6. Uwagi (nie blokują same w sobie)

- N1: tryb `WIRING_A_TRACE` generatora nadpisuje `tests/p6_k5loop_wiring_a_pin_vectors/vectors.json` wektorem z jednym scenariuszem (sprawdzone: MD5 zmienia się na `ca22fc4f…`, przywróciłem plik z git). Diagnostyka nie powinna pisać wektorów.
- N2: w trybie przewijania pin wchodzi w FF po `play()`, więc pierwszy krok zarejestrowany przez prawdziwy `requestAnimationFrame` czeka na kolejną klatkę sterownika. Tymczasem `_runFastForward` kręci zegar przez 40 ms czasu ściennego (`:9422-9423`): to skok `vNow` o ~6,4 mln ms, o którym pisze Operator. Dziś wynik od tego nie zależy: MD5 odtwarzalne, czas rzeczywisty równy przewijaniu. Jest to jednak zależność od zegara ściennego w ORAKULE i powinna mieć asercję, np. dwa przebiegi przy różnym obciążeniu albo porównanie z trybem realtime dla każdego scenariusza.
- N3: `zlote_wyniki_sesji` (FNV z Rusta) nadal nie jest dowodem parytetu (FC r1).

## 7. Długi i decyzje: weryfikacja

- D-WIRA-13 (`prepare_scene`): przyjmuję. `prepare(state)` deleguje do `prepare_scene`, a `p6_k5loop_wiring_a` 22/22 przechodzi.
- D-WIRA-14 (dane pinu w teście): przyjmuję.
- D-WIRA-15 (klatka 16 ms): przyjmuję dla sterownika. Wniosek „rozbieżność = kwantyzacja” odrzucam (§3).

## 8. Czego oczekuję w Obronie / r3

1. Znaleźć i naprawić w allowliście (`siege_tactics_loop.rs`) logiczną rozbieżność kroku strzelca w `mur_wieza_obl_las` w turze 12 (`a3` 37,78→38,78, `_rangedForwardStep` `:6776-6809`) i powtórzyć porównanie śladów.
2. Zweryfikować hipotezę atomowej aktywacji (pozycja widziana przez `_fireOneTower` w trakcie marszu wielokrokowego) na `palisada_liczni_taran`, tura 52.
3. Przy każdej przyczynie, którą zgłaszasz jako blokadę, przedstaw pomiar falsyfikujący. Wariant generatora z klatką 2 ms powstaje przez skopiowanie `p6_k5loop_wiring_a_gen.mjs` poza repo i trzy podmiany: `t += 16;` → `t += Number(process.env.FRAME ?? 16);`, w scenariuszach `mode: 'skip'` → `mode: process.env.MODE ?? 'skip'`, `outDir` na katalog tymczasowy (`repoRoot` na absolutną ścieżkę repo). Uruchomienie: `FRAME=2 MODE=realtime WIRING_A_TRACE=<scenariusz> WIRING_A_PRINT_SHA=1 node gen.mjs`. Odtworzenie zajmuje około 6 min (las) i 12 min (palisada).
4. Test pinu: dla scenariuszy z listy blokady wymagać `Ok` (§5).
5. Mutanty ≥ 10 zabitych na gałęziach sterownika pełnej bitwy.

## 9. Sprzątanie

`CARGO_TARGET_DIR` oceny i pliki tymczasowe generatora usunięte po bramkach.
