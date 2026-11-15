STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1J-GENERALTARGET-WDROZENIE-Q1
GOAL: obrona zarzutow Evaluatora r2 (02-evaluator.md, werdykt PASS-WITH-NOTES) dla commitu 896a147c4
BAZA: 83f5fd654 (origin/rust-port/parity-v2). Commit operatora 896a147c4 jako rodzic. Obrona na detached HEAD, bez push.

## Odpowiedzi na zarzuty

1. Prog pokrycia raw ustawiony na >=15 (zmierzone 18, szkic 20) - PRZYJMUJE.
   Poprawka: `assert_eq!(general_kept, 18, ...)` w `raw_save_text_loads_general_target_like_web`
   (tests/p4_1j_general_target_vectors.rs:332). Prog jest teraz dokladnie zmierzona wartoscia, bez marginesu;
   zmiana wektorow wymaga swiadomej zmiany tej liczby. Wartosc 20 ze szkicu nie byla wartoscia pinu, wiec nie
   byla asercja utrwalajaca lube pinu. Dowod: test 5 passed (w tym raw, EXIT 0).

2. Roundtrip porownuje zapis Rusta z zapisem weba odczytanym loaderem Rusta, nie bajt po bajcie - CZESCIOWO PRZYJMUJE.
   - Bajt po bajcie nie wprowadzam: kryterium dispatchu to "zapis i odczyt przechodza w obie strony", a kolejnosc
     kluczy i biale znaki zapisu weba nie sa kryterium. Zostaje jawnie NIE_ZMIERZONE na poziomie bajtow.
   - Odczyt: wyrocznia jest juz uzyta. `roundtrip_save_matches_web_and_loads_back_like_web`, asercja
     `loaded.planned_marches == expected_planned(case["loaded"])` (linia 273), gdzie `loaded` pochodzi
     z uruchomionego kodu pinu przez gen.mjs. Odczyt wlasnego zapisu ma wiec wlasciwa wyrocznie.
   - Zapis: porownanie pola z zapisem weba (linia 264). Mutacja zapisu i odczytu dawala FAIL (Evaluator r2, potwierdzam).

3. Punkty 4 i 5 NIE_ZMIERZONE - ODRZUCAM jako zarzut (bez zmiany kodu).
   Zakres wykluczony dispatchem. Twierdzenia "brak zaleznosci od W8" nie weryfikowalem w tej rundzie
   (NIE_ZMIERZONE).

4. Odtworzone bramki (fmt, clippy, lib 118, state 9, pin_vectors 4, general_target_vectors, bounds 1) - PRZYJMUJE
   jako potwierdzenie. Po mojej poprawce bramki odtworzone ponownie (patrz TESTY).

5. gen.mjs --check OK, strazniki SHA-256, filtr pustego napisu - PRZYJMUJE z DOPRECYZOWANIEM.
   - Filtr przy odczycie: save_load.rs:526 (`json_nonempty_string`), web planned-march.ts:466 (`length > 0`).
   - Filtr przy zapisie: pathfinding.rs:2263 (`planned_marches_to_save`, `.filter(|id| !id.is_empty())`),
     web planned-march.ts:496 (`...(dest.generalTargetId ? ...)`). Evaluator mial racje co do zapisu.
   - Rozwazano filtr w save_load.rs:835 (playable_planned_marches_to_save). Odrzucono: filtr juz jest nizej,
     w pathfinding.rs:2263. Plik save_load.rs wraca do stanu 896a147c4 (zero zmian).
   - Brakowalo jednak testu tej galezi. Dodano `empty_general_target_is_not_written_like_web`
     (tests/p4_1j_general_target_vectors.rs). Mutacja pathfinding.rs:2263 (usuniecie filtra) daje FAIL tego testu;
     plik przywrocony. Test przechodzi na kodzie poprawnym.
   - Komentarz playable.rs:566 ("filtrowany przy odczycie") jest prawdziwy dla odczytu; zapis filtruje pathfinding.rs:2263.
     Komentarza nie zmieniam.

6. Raport w 02-evaluator.md i lokalny commit 5305088be bez push - PRZYJMUJE jako fakt. Nic do zmiany.
   Ten commit lezy na galezi Evaluatora (worktree wf_c9da2dff-9c8-2), nie w tej galezi obrony.

## ZMIANY (commit obrony)
- rust-port/engine/tests/p4_1j_general_target_vectors.rs: prog 15 -> 18 (`assert_eq!`), nowy test
  `empty_general_target_is_not_written_like_web`.
- dyspozycje/autobot/runs/R-RUSTPORT-P4-1J-GENERALTARGET-WDROZENIE-Q1/02a-obrona.md (ten plik).
- Cargo.lock nie commitowany. CARGO_TARGET_DIR poza repo (scratchpad), bez #[ignore], bez oslabionych asercji.

## TESTY (EXIT 0, po poprawce)
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 118 passed, 0 ignored
- p4_1j_planned_march_state: 9 passed
- p4_1j_planned_march_pin_vectors: 4 passed
- p4_1j_general_target_vectors: 5 passed (w tym nowy empty_general_target_is_not_written_like_web)
- p4_1j_planned_march_bounds: 1 passed
- Mutacja pathfinding.rs:2263 (usuniecie filtra pustego napisu): FAIL nowego testu, przywrocono.
- NIE_ZMIERZONE: gen.mjs --check i SHA-256 nie ponowione (vectors.json i gen.mjs nie zmienione).

## BLOKADY
Brak nowych. Punkty 4 i 5 NIE_ZMIERZONE (zgodnie z dispatchem). Roundtrip bajt po bajcie NIE_ZMIERZONE.

## RUNDY
Obrona: runda 2 w tym temacie (zarzuty Evaluatora r2).

## NASTEPNY KROK
Final Control na nowym SHA obrony (orkiestrator).

DEPLOY/PUSH: NIE WYKONANO
