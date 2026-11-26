# R-RUSTPORT-P4-406-LANDAT-TB-TOWER-DUE-ORDER-Q1: Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-406-LANDAT-TB-TOWER-DUE-ORDER-Q1
GOAL: kolejność trafienia wieży (`due = t0 + 380`) wobec innych zegarów tej samej klatki (`due ∈ (t0 + 380, t0 + 384]`) zamrożona w wektorach z wykonania pinu `07d2fbd72` i pilnowana testem bajt w bajt. Czasy trafień `t0 + 384` i `t0 + 704` przy 16 ms stają się kontraktem. Mutant EV6 i mutanty kolejności są zmierzone.
ZMIANY/COMMIT: oceniany kod Operatora to `79c722678` (gałąź `rust-port-wip/406-tower-due-order-q1`), baza `81bf861d24f543b6718f043f34a8ce29a3294a80` = `origin/rust-port/parity-v2`, zgodnie z dispatchem. Evaluator dodaje wyłącznie ten raport. Kodu nie zmieniał.
TESTY: odtworzone samodzielnie, z kodami wyjścia w §1.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona r1, potem Final Control
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone przez Evaluatora

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (usunięty po bramkach i mutantach), jeden build naraz. Na końcu nie działa żaden proces cargo. Wolne miejsce: 12 GB na starcie, 13 GB na końcu.

| bramka (engine, HEAD `79c722678`) | wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (w tle, log z EXIT) | EXIT 0. Suma z 558 linii `test result`: **4372 passed / 0 failed / 1 ignored**, zgodnie z raportem Operatora. Przechodzą `kolejnosc_trafienia_wiezy_w_klatce_wektory_pinu_bajt_w_bajt` i `wieza_w_locie_nominalny_due_a_land_at_z_siatki_klatki`. |
| `git diff --check 81bf861d2..HEAD` | czysto |

Client i renderer nie są zmieniane (D-406-3), więc ich bramek nie uruchamiałem. Tak samo postąpił Operator.

## 2. Allowlista, zakazy, decyzje dispatchu

- Zmienione pliki (`git diff --stat 81bf861d2...79c722678`): `p6_k5loop_wiring_a_gen.mjs`, `p6_k5loop_wiring_a_pin.rs`, nowy `p6_k5loop_wiring_a_pin_vectors/tower_due_order_vectors.json`, `siege_tactics_loop.rs` oraz katalog runu (`00-dispatch.md`, `01-operator-r1.md`, `01-operator-r1-mutanty.py`). Plików spoza allowlisty nie ma.
- `siege_tactics_loop.rs`: diff obejmuje wyłącznie nowy `#[test]` w module `tower_target_tests` (linia ok. 7977 i dalej). Kod produkcyjny jest bez zmian, zgodnie z D-406-2.
- Pliki `vectors.json`, `speed_vectors.json`, `speed_change_vectors.json` i `pin_data.json` mają pusty diff (D-406-1). Nowy plik wektorów ma 801 607 B, czyli mieści się w limicie ok. 1 MB. MD5 `8fcae53473e7cd4d367df427cc96c483` jest zgodne z raportem.
- Diff nie dodaje `#[ignore]` ani `should_panic` i nie usuwa żadnej linii `assert`. Asercje nie zostały osłabione.
- Commity nie zawierają nazwy modelu, jest tylko linia `Claude-Session:`. Nie było push na `parity-v2`, deployu ani integracji.

## 3. Wektory wykonują TEKST pinu (D-406-1)

- Odczyt pinu (`git show 07d2fbd72:gra/src/battle/battleScene.ts`):
  - `_schedule` daje `due: this._now() + Math.max(0, ms)`; przy `_autoBatchPlanning` wywołuje callback synchronicznie.
  - `_drainTimers`: zegary z `due <= target` są odpalane rosnąco po `due`, a remis rozstrzyga mniejsze `id`; `vNow` nie przesuwa się do `due`.
  - Trafienie wieży to `_schedule(RANGED_FLY_MS, …)`, a kamień to `_schedule(700, …)`.
  - Opis Operatora w §1 jest zgodny z tekstem.
- Generator nie zmienia tekstu pinu. Obserwator jest zbudowany wyłącznie z opakowań metod instancji: `_schedule`, callbacka zegara, `_fireOneTower`, `_attackWallTile`, metod kontekstu `src` oraz `Proxy` na `hint`. Strażnik SHA-256 pinu jest sprawdzany przed zapisem (`shaT !== EXPECTED_SHA256` → throw). Wewnętrzna kontrola generatora rzuca wyjątek, gdyby zegar z większym `due` odpalił w klatce przed trafieniem wieży.
- **Determinizm, pomiar Evaluatora.** Wygenerowałem ponownie 3 z 74 przypadków (`WIRING_A_TOWER_ORDER_ONLY`): `to_fq_wzg_lucz2_d3l_mury_157` (16 ms), `to_mur_wieza_obl_las_klatka8` i `to_mi_las_mix_d3l_palisada_118_klatka8` (8 ms, w tym para z krokiem marszu `-:70`, `due = t0 + 382`). Wszystkie 3 są **bajt w bajt identyczne** z zamrożonym plikiem (porównanie `json.dumps` per wektor, ten sam `pinSha256`). Pozostałych 71 nie generowałem ponownie: pełny przebieg to ok. 2 h CPU.
- Liczby z nagłówka `totals` zgadzają się z raportem Operatora:
  - pary wieża/inny zegar: 41 przy 16 ms i 45 przy 8 ms; tyle samo klatek z parą;
  - trafienia: `tower@16:384` 1491, `boulder@16:704` 1880, `tower@8:384` 1406, `boulder@8:704` 1674.
  - Przy 16 ms każdy inny zegar w parze ma `ms ≡ 0 (mod 16)`, czyli `due = t0 + 384`. To zgadza się z arytmetyką Operatora.

## 4. Mutanty: odtworzone i nowe (skrypt Evaluatora, pliki przywracane, `git status` czysty po przebiegu)

LIB = `cargo test --lib wieza_`. WEKTOR = `--test p6_k5loop_wiring_a_pin kolejnosc_trafienia`, w nawiasie liczba rozbieżnych wektorów z 74.

| ID | mutant (kod produkcyjny) | LIB | WEKTOR | wynik |
|---|---|---|---|---|
| EV6 | `tower_in_flight.push((target, row, land_at))` | FAIL (2 testy: nowy i **istniejący przed tematem** `wieza_czyta_os_celu_z_nominalnym_due_wystrzalu_i_trafienia`) | ok (0) | ZABITY (lib), odtworzone |
| Q2 | zegar trafienia `schedule(frame_sched(F, 380))` | ok | FAIL (5) | ZABITY, odtworzone |
| Q3 | `_drainTimers`: remis po `id` malejąco | ok | FAIL (7) | ZABITY, odtworzone |
| Q6 = E4 | `_drainTimers` malejąco po `due` | ok | FAIL (12) | ZABITY, odtworzone |
| E1 (nowy) | `TowerShot.land_at = v_now + 380` (nominał zamiast siatki) | FAIL | FAIL (68) | ZABITY |
| E2 (nowy) | kamień `land_at = now + 700` (nominał) | ok | FAIL (18) | ZABITY wyłącznie nowymi wektorami |
| E3 (nowy) | trafienie wieży czyta oś z `due = v_now` (siatka, inna ścieżka niż EV6) | FAIL (2) | ok (0) | ZABITY (lib) |
| E5 (nowy) | `land_at` wieży + jedna klatka | FAIL | FAIL (68) | ZABITY |

Moje wyniki Q2, Q3 i Q6 (5, 7, 12) są identyczne z tabelą Operatora. Q1, Q4, Q5, Q7 i Q8 przyjmuję z raportu Operatora bez ponownego uruchomienia (NIE_ZMIERZONO przez Evaluatora). Kryterium 2 dispatchu jest spełnione: EV6 daje FAIL, a ponad 4 mutanty kolejności zostały zabite (Q2, Q3, Q6, a także Q4 i Q5 według Operatora).

## 5. Ustalenia

- **E-1 (uwaga, nie blokuje): przesłanka dispatchu „EV6 przeżywa lib" jest nieaktualna na bazie.** Na bazie `81bf861d2` istnieje test `wieza_czyta_os_celu_z_nominalnym_due_wystrzalu_i_trafienia` (`siege_tactics_loop.rs`, ok. linii 7954), którego asercja `tower_in_flight == [(0, 3, 1008 + 380)]` już zabija EV6 przy 16 ms, bo `land_at` wynosi 1392 ≠ 1388. Mój przebieg EV6 pokazuje FAIL w obu testach lib. Nowy test lib Operatora nie jest więc jedynym zabójcą EV6. Wnosi coś innego: krok 8/32/4/1 ms, warunek `nominał ≠ siatka ⇔ 380 mod F ≠ 0` oraz skutek dla `timeline_done`. Zapis E-2 z #400 w rejestrze warto skorygować (decyzja orkiestratora).
- **E-2 (uwaga, NIE_ZMIERZONO jawne): EV6 i E3 dają 0 rozbieżności w 74 wektorach.** Operator uczciwie to zgłasza (§4, §6 raportu) i podaje wyjaśnienie strukturalne. Wpis osi ciała z `ord ∈ [t0 + 380, t0 + 384)` powstaje tylko z zegara, który w `_drainTimers` odpala PO trafieniu wieży. Odczyt nominalny pilnują więc wyłącznie testy lib, a wektory pilnują kolejności zegarów (Q2, Q3, Q6) i czasu trafienia (E1, E2, E5). Wyjaśnienia nie obaliłem: nie zbudowałem wektora rozróżniającego EV6. Akceptuję je wobec brzmienia kryterium 2 („EV6 daje FAIL") i D-406-2.
- **E-3 (uwaga): bliźniak 8 ms jest równoważnością modelu, nie jej dowodem z konstrukcji.** Pin działa z klatką ściany 8 ms przy `speedMul = 1`, a Rust z klatką 16 ms przy `speedMul = 0.5` (`diag_set_speed_mul`). Wszystkie ścieżki zależne od `speedMul` poza krokiem `vNow` mogłyby się rozjechać. Empirycznie zgodność wynosi 37/37 bitew przy 8 ms, bajt w bajt. Wzorzec jest ten sam co D-PIN2-2 i #412.
- **E-4 (uwaga): obserwowalność kolejności w strumieniu zdarzeń.** Tylko 43 z 86 klatek z parą ma w strumieniu zarówno trafienie wieży, jak i inne zdarzenie. W pozostałych kolejność widać pośrednio, przez stan (wynik bitwy i dalszy strumień). Czułość pokazują Q2, Q3 i Q6 zabite wektorami. Test tylko wypisuje licznik `observable`, nie sprawdza go asercją, co jest dopuszczalne.
- **E-5 (uwaga): D-406-OP-1 (czas rzeczywisty zamiast `skip`).** Operator uzasadnia ją jawnie znanym długiem PRE-SKIP-RAF (#405) i stałym przesunięciem +384 od tury 2 w trybie skip. Decyzja jest techniczna i nie zmienia gameplay. Ma też korzyść: absolutne chwile zdarzeń są porównywane bez przesunięcia. Wpis do rejestru należy do orkiestratora.
- **E-6 (uwaga): pokrycie kamienia.** Mutant E2 (`landAt` kamienia z nominału) zabijają wyłącznie nowe wektory 406 (18). Testy lib `wieza_` go nie widzą. Nie mierzyłem, czy zabijają go inne testy pełnego pakietu. Dla tematu to wartość dodana, nie zarzut.

Zarzutów blokujących nie stwierdziłem. Kod realizuje GOAL i kryteria końca 1–4 dispatchu:
1. Wektor z pinu z parami, test bajt w bajt i zamrożone czasy 384/704.
2. EV6 daje FAIL, ponad 4 mutanty kolejności zabite.
3. Bez regresji: 4372/0/1.
4. Raport z liczbami i listą NIE_ZMIERZONO.

## 6. NIE_ZMIERZONO (Evaluator)

- Ponowne generowanie 71 z 74 wektorów (zmierzone 3/3 bajt w bajt).
- Mutanty Q1, Q4, Q5, Q7 i Q8 (przyjęte z raportu Operatora).
- Wektor, w którym EV6 lub E3 zmienia wynik (za Operatorem).
- Pary przy prędkościach > 1 i przy zmianie prędkości w trakcie bitwy (za Operatorem).
- Bramki client i renderer (nie są wymagane, bo nic tam nie zmieniono).

## 7. Werdykt

**PASS-WITH-NOTES.**
- Bramki engine odtworzone: EXIT 0 / 0 / 0, 4372 passed.
- Wektory pochodzą z wykonania tekstu pinu i są deterministyczne (3/3).
- Mutanty kolejności i `landAt` zabite. EV6 zabija lib, przy czym zabijał go już istniejący test (E-1).
- Uwagi E-1…E-6 dla Obrony i orkiestratora, żadna nie blokuje.
