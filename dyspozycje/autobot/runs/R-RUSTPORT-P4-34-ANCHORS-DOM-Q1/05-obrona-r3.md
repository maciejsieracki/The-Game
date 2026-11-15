STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-34-ANCHORS-DOM-Q1
GOAL: RR-T8e (P4-25 §2.3/§6): etykiety DOM R4/R5/R15a/R15b rysowane w Rust na `Canvas2dLite` ze wspólną etykietą unoszącą się, zweryfikowane z Chromium 141. Ta runda: obrona Operatora wobec 4 zarzutów Evaluatora r3 (`04-evaluator-r3.md`, commit `e43274091`, PASS-WITH-NOTES).
ZMIANY/COMMIT: jeden commit na `525a2ef7b` (głowa `origin/rust-port/parity-v2`; zawiera już `ba5dca739`, a `git diff ba5dca739 525a2ef7b -- src/labels tests/labels_*.rs` jest pusty). SHA podaję w odpowiedzi dla orkiestratora i w `git log`. Bez push. Pliki (allowlista): `rust-port/renderer/src/labels/anchor.rs` (tylko komentarz dokumentacyjny `js_round`, bez zmiany kodu), `rust-port/renderer/tests/labels_anchors.rs`, `dyspozycje/rust-port/p4/P4-34-ANCHORS-DOM.md` (§11), `02-operator-obrona-r1.md` (korekta SHA), ten raport, `dowody/13-obrona-r3-*`. Bez zmian w `Cargo.toml`/`Cargo.lock`, `lib.rs`, fixturach, `gra/**`, `rust-port/engine/**`.
TESTY: `dowody/13-obrona-r3-gates.log`, świeży `CARGO_TARGET_DIR` w scratch (usunięty po bramkach): `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0; to samo z `--features gpu` EXIT=0; `cargo test --locked --all-targets` EXIT=0 (0 FAILED); `cargo +1.87.0 test --locked --test labels_layout --test labels_scenes --test labels_anchors` EXIT=0 (8/8, 7/7, 4/4). Mutacje: `dowody/13-obrona-r3-mutacje.log`, 4/4 zabite (E6, E7, O3, O4).
BLOKADY: brak.
RUNDY: 3/5 (obrona r3; kod z rundy 1, obrona r1 i poprawki testów z tej rundy)
NASTĘPNY KROK: Final Control R-RUSTPORT-P4-34-ANCHORS-DOM-Q1 na commicie obrony r3.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

1. **[NISKI] Gałęzie `rect.height <= 0` i `z > 1` bez testu rozróżniającego: PRZYJMUJĘ.**
   - Web (pin `edb8fb56`): `input/picker.ts:110` `if (v.z > 1) return null;`, `:112` `if (rect.width <= 0 || rect.height <= 0) return null;`; `main.ts:14593` `if (wp.z > 1) {`.
   - `tests/labels_anchors.rs`, `projections_match_the_web_bit_for_bit`: dopisany przypadek `ScreenRect { width: 10, height: 0 }` daje `None`. Dopisana też granica far-plane: kamera tożsamościowa (`Mat4::IDENTITY` dla `world` i `projection`) daje `project(p) == p`, co asercja sprawdza bitowo dla z = 1.0. Dla NDC z = 1.0 obie funkcje, `siege_label_position` i `world_to_client_px`, zwracają `Some((50, 25))`. Dla następnej liczby double po 1.0 zwracają `None`.
   - Dowód: `E6` (bez `rect.height <= 0`), `E7` (`wp.z >= 1` w `siege_label_position`) i dodatkowa `O3` (`v.z >= 1` w `world_to_client_px`) są teraz zabite przez `projections_match_the_web_bit_for_bit`.

2. **[NISKI] `js_round_is_math_round` sugeruje sprawdzanie znaku zera, którego nie sprawdza: PRZYJMUJĘ (wariant: `to_bits` + jawnie opisane odchylenie, kod bez zmian).**
   - Dlaczego kod zostaje: wynik trafia do DOM wyłącznie jako `Math.round(…) + 'px'` (`main.ts:12967-12968`, `14600-14601`), a `String(-0)` daje "0". Wartość CSS, którą zwraca Chromium (`anchors.tsv`, kolumny `left/top`), to więc +0px. Zmiana `js_round` na −0 (wierne `Math.round`) dałaby różnicę w bitach względem tego, co web faktycznie pokazuje.
   - Test porównuje teraz `to_bits`, oczekuje +0 dla −0.5 i −0.2, a −0 dla −0.0. Dodane przypadki: 0.0 i 0.49999999999999994. Komentarz w teście i w dokumentacji `js_round` (`anchor.rs`) opisuje odchylenie od `Math.round` i jego nieobserwowalność.
   - Dowód: mutacja `O4` (`(f + 1.0).copysign(x)`, czyli −0 jak w `Math.round`) jest zabita przez `js_round_is_math_round`. Poprzedni test z `assert_eq!` przepuściłby obie wersje.

3. **[NISKI] Ślad dokumentacyjny: nieistniejący `27090d91`, brak SHA r1, brak `03-operator-r2.md`: PRZYJMUJĘ.**
   - `git cat-file -t 27090d91` zwraca `fatal: Not a valid object name`. `git log -1 --format='%H %P'` daje: `ba5dca7391627fe6039337d63e384b07f9f74c4e` z rodzicem `6cd6f33aafea464814e03e0fe68db93e31d7d9dd`, a `6cd6f33aa` ma rodzica `51a62a89b189893d0641b9a957df925607b7f0dd`.
   - Poprawione miejsca: `02-operator-obrona-r1.md` (pole ZMIANY/COMMIT, z adnotacją korekty) oraz `P4-34-ANCHORS-DOM.md` §11 (Operator r1 = `6cd6f33aa` na `51a62a89b`, który jest potomkiem `df3027b7`; obrona r1 = `ba5dca739`). Dopisany akapit o obronie r3.
   - `03-operator-r2.md` nie istnieje, bo nie było rundy Operatora r2: po r1 była obrona r1 (`02-…`), potem Evaluator r3 (`04-…`). Wskazanie tego pliku w zleceniu jest błędem dispatchu, nie brakiem artefaktu. Kod r1 + obrona r1 = `ba5dca739`.

4. **[PROCES, informacyjny] `ba5dca739` trafił do `rust-port/parity-v2` przed Evaluatorem i FC: PRZYJMUJĘ DO WIADOMOŚCI (bez zmiany kodu, to decyzja orkiestratora).**
   - Potwierdzam: `git merge-base --is-ancestor ba5dca739 origin/rust-port/parity-v2` zwraca sukces (wszedł przez rebase P4.35, `c4fa31a2f`). Dlatego commit obrony r3 jest oparty na głowie parity `525a2ef7b`, a nie na `ba5dca739`, żeby integracja była zwykłym fast-forwardem.
   - Uwagę o współdzielonym `CARGO_TARGET_DIR` stosuję: bramki tej rundy działały na świeżym, osobnym katalogu target (`tgt`, a dla 1.87 osobny `tgt-187`), usuniętym po pracy.

## Co dalej
Final Control: ocenić commit obrony r3 (zawiera wyłącznie testy, komentarze i dokumentację). Orkiestrator: odnotować w rejestrze faktyczne SHA `6cd6f33aa` i `ba5dca739` oraz to, że kod wszedł do parity przed FC (zarzut 4).
