# R-RUSTPORT-P4-406-LANDAT-TB-TOWER-DUE-ORDER-Q1: Obrona Operatora r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-406-LANDAT-TB-TOWER-DUE-ORDER-Q1
GOAL: kolejność trafienia wieży (`due = t0 + 380`) wobec innych zegarów tej samej klatki (`due ∈ (t0 + 380, t0 + 384]`) zamrożona w wektorach z wykonania pinu `07d2fbd72` i pilnowana testem bajt w bajt; czasy `t0 + 384` / `t0 + 704` przy 16 ms jako kontrakt; EV6 i mutanty kolejności zmierzone.
ZMIANY/COMMIT: wyłącznie ten raport (gałąź `rust-port-wip/406-tower-due-order-q1-obrona` na `727604a1d` = raport Evaluatora nad kodem Operatora `79c722678`, baza `81bf861d2`). Kod, testy i wektory BEZ ZMIAN wobec `79c722678`.
TESTY: kod się nie zmienił, więc bramki engine z raportu Operatora i Evaluatora pozostają aktualne (fmt 0, clippy 0, pełny test 4372/0/1, odtworzone przez Evaluatora). Nowy pomiar Obrony: regeneracja kolejnych 8 wektorów z tekstu pinu, wszystkie 8 bajt w bajt identyczne z zamrożonym plikiem (§1).
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control r1
DEPLOY/PUSH: NIE WYKONANO

Evaluator nie zgłosił zarzutów blokujących (werdykt PASS-WITH-NOTES). Odpowiadam na każdy punkt.

## 1. Nowy pomiar: determinizm wektorów (rozszerzenie punktu 3 Evaluatora)

Polecenie (4 procesy równolegle, generator z `79c722678` bez zmian, strażnik SHA-256 pinu aktywny):
`WIRING_A_TOWER_ORDER_VECTORS=16,8 WIRING_A_TOWER_ORDER_ONLY=<2 przypadki> WIRING_A_OUT=<część> node rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs`; porównanie `json.dumps` wektora z plikiem `tower_due_order_vectors.json` (MD5 `8fcae53473e7cd4d367df427cc96c483`), ten sam `pinSha256`.

Dobór: przypadki z NAJWIĘKSZĄ liczbą par (wieża, inny zegar), oba kroki klatki, rozłączne z 3 przypadkami Evaluatora.

| wektor | klatka | par | wynik |
|---|---|---|---|
| `to_fq_las_mix_d6l_palisada_120` | 16 | 11 | IDENT |
| `to_fq_wzg_lucz2_d8l_mury_161` | 16 | 3 | IDENT |
| `to_mr_wzg_mixk_df_palisada_364` | 16 | 13 | IDENT |
| `to_p3_las_jazda_d6l_mury_111` | 16 | 3 | IDENT |
| `to_mur_machiny_wylom_klatka8` | 8 | 2 | IDENT |
| `to_b03_las_lucznicy_mury_baszta_klatka8` | 8 | 8 | IDENT |
| `to_fq_las_mix_d6l_palisada_120_klatka8` | 8 | 11 | IDENT |
| `to_fq_gory_lucz2_d3l_palisada_190_klatka8` | 8 | 2 | IDENT |

Wszystkie procesy EXIT 0 (454 / 765 / 601 / 614 s). Razem z pomiarem Evaluatora: **11 z 74 wektorów** zregenerowanych bajt w bajt, pokrywają **61 z 86 par** pinu (53 Obrona + 8 Evaluator). Pozostałe 63 wektory (25 par): NIE_ZMIERZONO ponownie.

## 2. Odpowiedzi na punkty Evaluatora

**Punkt 1 (kontekst: raport, commit `727604a1d`, kod `79c722678`, baza `81bf861d2`).** PRZYJMUJĘ. Ustalenia są zgodne ze stanem Git: Obrona pracuje na `727604a1d`, `git log` pokazuje `79c722678` → `20179cbd0` → `f5f6288c9` nad bazą. Zmiany nie są potrzebne.

**Punkt 2 (bramki 4372/0/1, allowlista, brak `#[ignore]`, pusty diff istniejących wektorów).** PRZYJMUJĘ. Wynik jest zgodny z §5 raportu Operatora. Obrona nie zmienia kodu, więc wynik pozostaje ważny.

**Punkt 3 (determinizm 3/74, reszta NIE_ZMIERZONO).** PRZYJMUJĘ jako uwagę i rozszerzam pomiar (§1): teraz 11/74 wektorów i 61/86 par, wszystkie bajt w bajt. Determinizm wynika też z konstrukcji generatora (`p6_k5loop_wiring_a_gen.mjs`):
- jedyny rzut gry (`battleScene.ts:8960`) zastępuje LCG z ziarnem `SessionRolls::derive(seed, nr)`;
- pozostałe `Math.random` (dźwięk) zwracają stałe 0.5;
- `performance.now` to deterministyczny zegar +1 ms na odczyt;
- sterownik klatek jest stały (`wallFrameMs` 16/8).

Nie ma więc źródła niedeterminizmu. Pełna regeneracja 74 wektorów (ok. 2 h CPU) pozostaje NIE_ZMIERZONO i jest jawnie wpisana.

**Punkt 4 (mutanty: EV6, Q2, Q3, Q6 odtworzone; E1, E2, E3, E5 nowe i zabite; Q1, Q4, Q5, Q7, Q8 przyjęte bez ponownego uruchomienia).** PRZYJMUJĘ. Nowe mutanty Evaluatora (E1/E2/E5 zabite wektorami 68/18/68, E3 zabity lib) wzmacniają kryterium 2. Q1, Q4, Q5, Q7 i Q8 można odtworzyć skryptem `01-operator-r1-mutanty.py` (ten sam skrypt odtworzył EV6/Q2/Q3/Q6 z identycznymi liczbami 5/7/12). Ich wyniki są w tabeli §4 raportu Operatora. Final Control może je uruchomić bez zmian (`MUT_FULL=1` dla Q4/Q5).

**E-1 (przesłanka „EV6 przeżywa lib" nieaktualna na bazie).** PRZYJMUJĘ. Weryfikacja: `git grep` na `81bf861d2` pokazuje test `wieza_czyta_os_celu_z_nominalnym_due_wystrzalu_i_trafienia` (`siege_tactics_loop.rs:7954`) z asercją `tower_in_flight == [(0, 3, 1008 + TOWER_FLY_MS)]`. Przy `v_now = 1008` i klatce 16 ms EV6 daje `land_at = 1392` ≠ 1388, więc test już zabijał EV6. Mój raport (§4, „FAIL wyłącznie w teście lib (`wieza_czyta_os_…` i nowy test)") podaje oba testy. Nowy test `wieza_w_locie_nominalny_due_a_land_at_z_siatki_klatki` (`:7985`) dodaje:
- kroki 8/32/4/1 ms;
- warunek `nominał ≠ siatka ⇔ 380 mod F ≠ 0`;
- skutek dla `timeline_done`.

Korekta wpisu E-2 z #400 w `REJESTR-RUST.md` należy do orkiestratora (poza allowlistą Operatora). Proponowane brzmienie: „EV6 zabijany przez test lib `wieza_czyta_os_celu_z_nominalnym_due_wystrzalu_i_trafienia` już na bazie #400; #406 dodaje pokrycie kroków 8/32/4/1 ms i skutku `timeline_done`; wektory pinu: 0 rozbieżności (wyjaśnienie strukturalne)". Kod się nie zmienia.

**E-2 (EV6 i E3 dają 0 rozbieżności w 74 wektorach, odczyt nominalny pilnują tylko testy lib).** ODRZUCAM jako brak w zakresie tematu, z dowodem. Uwagę jako taką przyjmuję i zostaje ona jawnym NIE_ZMIERZONO.
1. Kryterium 2 dispatchu brzmi „EV6 daje FAIL (liczba rozbieżnych przypadków zmierzona)". EV6 daje FAIL (2 testy lib), a liczba rozbieżnych wektorów jest zmierzona i wynosi 0. Potwierdzili to niezależnie Operator i Evaluator.
2. Wektor rozróżniający EV6 musiałby zawierać wpis osi ciała z `ord ∈ [t0 + 380, t0 + 384)`, wykonany PRZED zegarem trafienia wieży w tej samej klatce. W `_drainTimers` pinu (`:9616-9634`) zegar o najmniejszym `due` (380) odpala pierwszy, więc taki wpis w chwili odczytu jeszcze nie istnieje. W 86 parach pinu przypadek nie wystąpił. Evaluator też tego nie obalił.
3. Zbudowanie takiej ścieżki wymagałoby scenariusza spoza pinu albo zmiany kodu produkcyjnego. Oba warianty zabrania D-406-1 (wektory z wykonania tekstu pinu) i D-406-2 (bez zmian produkcji).

**E-3 (bliźniak 8 ms to równoważność modelu).** PRZYJMUJĘ jako uwagę, bez zmian. Ten sam wzorzec (pin: klatka ściany 8 ms przy `speedMul = 1`; Rust: `speedMul = 0.5` przy klatce 16 ms) jest przyjęty decyzją D-PIN2-2 i stosowany w #401/#412. Dowód empiryczny: 37/37 bitew 8 ms zgodnych bajt w bajt. Pomiar Obrony (§1) dokłada 4 regenerowane wektory 8 ms z 23 parami, w tym `to_b03_…_klatka8` (8 par) i `to_fq_las_…_120_klatka8` (11 par). Ścieżki zależne od `speedMul` poza krokiem `vNow` pilnują osobne wektory prędkości (`speed_vectors.json`, `speed_change_vectors.json`, bez zmian i zielone).

**E-4 (43 z 86 klatek z parą widoczne bezpośrednio w strumieniu).** ODRZUCAM potrzebę zmiany, z dowodem. Test porównuje CAŁY strumień zdarzeń i wynik bitwy bajt w bajt. Kolejność w pozostałych 43 klatkach zmienia stan (HP, oś ciała), a ten wpływa na dalszy strumień. Czułość jest zmierzona, nie założona: Q2 (5), Q3 (7) i Q6 (12) zabite wektorami, odtworzone przez Evaluatora z identycznymi liczbami. Liczba 43/86 jest jawnie w raporcie Operatora (§6). Evaluator uznał wypisywanie licznika `observable` bez asercji za dopuszczalne.

**E-5 (D-406-OP-1: czas rzeczywisty zamiast `skip`, wpis do rejestru).** PRZYJMUJĘ. Decyzja techniczna Operatora jest opisana w nagłówku trybu generatora (`p6_k5loop_wiring_a_gen.mjs`, komentarz przy `TOWER_ORDER_CASES`) i w raporcie Operatora (§6, PRE-SKIP-RAF #405). Wpis do `REJESTR-RUST.md` należy do orkiestratora (poza allowlistą). Proponowane brzmienie: „D-406-OP-1: wektory kolejności trafienia wieży (#406) w czasie rzeczywistym (`realtime`, klatka 16/8 ms) zamiast przewijania `skip`, bo `skip()` po `play()` ma znany dług czasu tury 1 (PRE-SKIP-RAF, #405); chwile zdarzeń porównywane bezwzględnie; wynik bitwy w trybie skip pilnuje nadal `vectors.json`".

**E-6 (pokrycie kamienia, mutant E2 zabity tylko nowymi wektorami).** PRZYJMUJĘ jako wartość dodaną tematu. Zmiany nie są potrzebne.

## 3. NIE_ZMIERZONO (po Obronie)

- Regeneracja 63 z 74 wektorów (zmierzone 11/74, 61/86 par, wszystkie bajt w bajt).
- Wektor, w którym EV6 lub E3 zmienia wynik (strukturalnie nieosiągalny w pinie, E-2).
- Pary przy prędkościach > 1 i przy zmianie prędkości w trakcie bitwy.
- Tryb `skip` z czasem bezwzględnym (dług #405).
- Q1, Q4, Q5, Q7 i Q8 nie były ponownie uruchamiane przez Evaluatora ani Obronę (wynik Operatora).

## 4. Dla orkiestratora (poza allowlistą Operatora)

1. Korekta wpisu E-2 (#400) w `REJESTR-RUST.md` (E-1).
2. Wpis decyzji D-406-OP-1 (E-5).

Sprzątanie: części regeneracji leżały w scratchpadzie Obrony (usunięte po pomiarze). Nie działa żaden proces `node` ani `cargo`, a cargo nie było uruchamiane.
