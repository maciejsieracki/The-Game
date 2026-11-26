# R-RUSTPORT-P4-412-FQ-SPEED-MIDCHANGE-VEC-Q1 — Evaluator (adwersarialny) r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-412-FQ-SPEED-MIDCHANGE-VEC-Q1
GOAL: zamrozić w repo wektory pinu `07d2fbd72` dla zmiany prędkości bitwy W TRAKCIE walki i pilnować ich testem silnika bajt w bajt oraz kontrolą czułości.
ZMIANY/COMMIT: oceniany kod Operatora `bf6c3dbf1` (gałąź `rust-port-wip/412-fq-speed-midchange-vec-q1`; commity `2195249c6`, `0d57d83dd`, `bf6c3dbf1`), BAZA `3f98dd284229f975e373b9c3be7a0d28232089d3` jest przodkiem (`merge-base --is-ancestor` OK). Evaluator dodaje wyłącznie ten raport (bez zmian kodu).
TESTY: odtworzone przez Evaluatora, szczegóły w §2.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona (02a-obrona.md), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO.

## 1. Allowlista i zakazy

- `git diff --numstat 3f98dd284..bf6c3dbf1`: 4 pliki, wyłącznie dopisane linie (0 usuniętych):
  `01-operator-r1.md` (+94), `p6_k5loop_wiring_a_gen.mjs` (+206), `p6_k5loop_wiring_a_pin.rs` (+449), `speed_change_vectors.json` (nowy, 1 linia). Wszystkie w allowliście. Pliki spoza allowlisty: brak.
- `speed_vectors.json` MD5 `d764f078f08aa5df274e3f74d09df14b` (bez zmian), `vectors.json` `9ceefda1…`, `pin_data.json` `432eed76…` bez zmian w diffie.
- Brak `#[ignore]` w diffie, brak usuniętych/osłabionych asercji w istniejących testach, brak zmian w `gra/` i w kodzie produkcyjnym (D-412-2), brak nazwy modelu w opisach commitów.

## 2. Bramki odtworzone (engine; własny `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`; wolne 12 GB przed, 14 GB po)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (w tle, log) | EXIT 0; 558 binarek, **4354 passed / 0 failed / 1 ignored** (zgodne z raportem Operatora) |
| `wektory_pinu_pelnej_bitwy_bajt_w_bajt`, `predkosc_bitwy_wektory_pinu_bajt_w_bajt` | ok (w pełnym teście) |
| Nowe testy `zmiana_predkosci_*` (osobno, `--nocapture`) | 2 passed, 301 s debug |

Renderer/klient: nie dotyczy (D-412-3, brak zmian).

## 3. Wektory = wykonanie tekstu pinu (D-412-1)

- Generator wykonuje tekst pinu przez `git show 07d2fbd72:…` ze strażnikiem SHA-256 (`3eeeb760…`, ten sam w pliku wektorów i w teście `PIN_SHA256`). Zmiana prędkości = metoda pinu `bs._setSpeedIdx(idx)` między klatkami rAF; obserwatory to opakowania metod instancji, tekst pinu bez zmian. Sprawdzone w pinie: `_setSpeedIdx` `:9518-9527`, `_scaledWallDelta` `:9512-9515`, „Safe to call mid-battle” `:9535`, `stepAnim` wypadu z `localT >= BLOW_HIT_T` w każdej klatce (`:9114-9124`).
- **Powtórzenie generatora (determinizm):** przebiegłem generator od nowa (`WIRING_A_SPEED_CHANGE_VECTORS=1`, `WIRING_A_SPEED_CHANGE_ONLY=` 4 przypadki: `sc_mur_jazda_rzeka_x1to2_lunge` (z listy rozbieżności), `sc_fq_wzg_lucz2_d8l_mury_161_x2to128_lunge`, `sc_mr2_wzg_slabi_ds_palisada_534_x4to512_frame`, `scm_mi_gory_lucz2_d5_palisada_196_1_2_32`) → EXIT 0, **4/4 wektorów identycznych** z plikiem w repo (porównanie JSON po kluczach), ten sam `pinSha256`.
- Plik: 172 339 B (≤ 2 MB), MD5 `a374deaea878eca21ff4166817fb03a9` = raport.

## 4. Liczby raportu — sprawdzone

Z wydruku testu i z pliku: 40 przypadków (31 zgodnych, 9 jawnie rozbieżnych), 42 zmiany w pliku; w zgodnych w górę 35 / w dół 7, 6 bitew wielokrotnych, 18 par prędkości, 22 tury zmiany, chwile `inFlight` 15 / `preHit` 16 / `moving` 6 / `lunging` 1, 3301 zdarzeń. Mutanty (rozbieżne z 31): Skip 31, SkipLater 6, Late 31, Early 29, WrongSpeed 31, OldGrid 21, NewGridOldClock 31, Grid16 19 — wszystkie zgodne z raportem co do liczby. `speed_vectors.json` = 288 (32 × 9) — zgodne.

## 5. Rozbieżności (9/40) — weryfikacja adwersarialna

Tymczasowo (bez commita, cofnięte `git checkout`) wypisałem pierwszą różnicę każdej pozycji listy `ROZBIEZNE_FQ_SPEED_MIDCHANGE` i porównałem jej `vNow` z chwilą zmiany:

| Przypadek | zmiana(y) `vNow` | 1. różnica Rust / pin | po zmianie? |
|---|---|---|---|
| `sc_mur_jazda_rzeka_x1to2_lunge` | 120016 | 125008 / 124976 (cios +32 ms, klatek +1) | tak |
| `sc_p3_las_mix_d5_mury_123_x2to128_prehit` | 96416 | 96800 / 98464 | tak |
| `sc_p3_rown_mix_d8l_palisada_218_x1to4_lunge` | 257280 | 258688 / 258624 (rout) | tak |
| `sc_fq_las_mix_d8l_palisada_122_x64to1_round` | 119808 | 200816 / 200032 | tak |
| `sc_fq_gory_lucz2_d6l_mury_191_x64to1_prehit` | 441344 | 442368 / 441728 | tak |
| `sc_fq_rown_mix_d8l_mury_217_x1to2_lunge` | 259440 | 264656 / 264624 | tak |
| `scm_mr_wzg_jazda3_d3l_mury_333_2_1_64` | 8320, 118080 | 75168 / 75152 | tak (po 1. zmianie x2→x1 w chwili `moving`, przed 2.) |
| `scm_mi_las_mix_d3l_palisada_118_1_512_1_4` | 368, 762224, 776160 | 850912 / 841824; dodatkowo `roundNo` w chwili 3. zmiany 4 vs 6 | tak (po 2. zmianie x512→x1) |
| `scm_rt_mur_machiny_wylom_1_4_64_2` | 4320, 31584, 226144 | 293088 / 292320 | tak |

Wniosek: twierdzenie Operatora „pierwsza różnica po pierwszej zmianie” potwierdzone 9/9. Mechanizm klasy L potwierdzony w kodzie: `siege_tactics_loop.rs:3196` `frame_raf(self.frame_ms, pu.body_ms)` liczy chwilę ciosu w `start` siatką sprzed zmiany, pin sprawdza `localT` w każdej klatce nową siatką. To realne rozbieżności produkcyjne (nie artefakt sterownika testu: przed zmianą strumień zgodny, generator deterministyczny). Zgodnie z D-412-2 nie poprawiane — słusznie; temat następczy (np. `FQ-SPEED-MIDCHANGE-DIV`) potrzebny.

Uwaga do GOAL: założenie dispatchu „32/32 zgodności” (obrona #407) dotyczyło wyłącznie zmian `{round}` na kandydatach c1; nowe wektory pokazują, że zmiana w trakcie NIE jest w pełni zgodna z pinem (w tym jeden przypadek `round`: 122, start x64, i jeden `moving` w 333). Rejestr nie powinien zapisywać „zmiana prędkości w trakcie zgodna z pinem” bez zastrzeżenia.

## 6. Mutanty (adwersarialnie)

- 8 mutantów sterownika zabitych (≥ 6 wymaganych), żaden nie jest równoważny na całym zbiorze. `OldGrid` jest semantycznie tożsamy z mutantem produkcyjnym „`set_speed_idx` nie przelicza `frame_ms`”, `NewGridOldClock` z „nie aktualizuje `clock.speed_mul`”, `Grid16` z „`frame_ms` = 16”; więc istotne mutacje `set_speed_idx` (siedziba nowej gałęzi zachowania) są pokryte.
- Mutant „pomiń zmianę w trakcie” (Skip): 31/31 rozbieżnych — kryterium 2 spełnione.
- Gałęzie generatora (`at.frame`, `at.round`, `when ∈ {inflight, prehit, moving, lunge}`, pominięcie przypadku bez chwili, scalanie shardów) — wszystkie występują w pliku (frame/round/inflight/prehit/moving/lunge oraz wielokrotne); poprawność rozwiązania chwili weryfikuje asercja `chwila zmiany` (klatka, `vNow`, `roundNo`, prędkości) w teście. Ścieżka `WIRING_A_SPEED_CHANGE_MERGE` nie była przeze mnie uruchamiana (NIE_ZMIERZONO); jej wynik w repo jest jednak odtwarzalny pojedynczymi przebiegami (§3).

## 7. Zarzuty / uwagi (nie blokujące)

1. **Lista rozbieżności maskuje regresję przed zmianą.** Dla 9 pozycji listy test sprawdza tylko „`d` niepuste”; regresja silnika w części bitwy PRZED zmianą prędkości w tych 9 bitwach nie zostanie wykryta tym testem (częściowo łagodzi to `vectors.json`/`speed_vectors.json` dla tych samych scenariuszy przy stałej prędkości). Zalecenie: asercja, że pierwsza różnica ma `vNow ≥` chwili pierwszej zmiany (i że chwile zmian przed rozbieżnością są równe pinowi).
2. **Pokrycie `lunging` w zgodnych = 1 przypadek** (`sc_fq_wzg_lucz2_d8l_mury_161_x2to128_lunge`), i to taki, w którym cios wypada w tej samej klatce; faktyczna zmiana „tuż przed ciosem wręcz” jest wyłącznie w liście rozbieżności. Kryterium „tuż przed trafieniem” spełnione przez `preHit` (16) dla pocisków.
3. **c1 128/128 @1/@16** — NIE_ZMIERZONO (kandydaci tylko w scratchpadzie obrony #407); kod produkcyjny bez zmian, więc dopuszczalne.
4. **Czas testu**: 2 nowe testy ~300 s w debug (pełny `cargo test` się wydłuża); do rozważenia przy następnych tematach.
5. Pomiar obrony #407 (32 bitwy c1) nie został dosłownie zamrożony — zamrożono inny, szerszy zbiór (40 przypadków ze scenariuszy `vectors.json`). Spełnia kryteria dispatchu (≥ 24, różne pary i tury), ale orkiestrator powinien to odnotować w rejestrze.

## 8. Werdykt

PASS-WITH-NOTES: bramki odtworzone z EXIT 0 (fmt, clippy, pełny engine 4354/0/1), wektory odtwarzalne z tekstu pinu, liczby raportu zgodne, mutanty zabite, rozbieżności 9/40 realne i jawnie zgłoszone zgodnie z D-412-2. Do rejestru: `speed_vectors.json` = 288; nowy plik `speed_change_vectors.json` (40 przypadków, 31 zgodnych); dług FQ-SPEED-MIDCHANGE-DIV (9 pozycji, klasy L/R).
