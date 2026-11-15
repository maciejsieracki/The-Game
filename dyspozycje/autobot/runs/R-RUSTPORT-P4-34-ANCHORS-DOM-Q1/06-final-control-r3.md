STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-34-ANCHORS-DOM-Q1
GOAL: RR-T8e. Etykiety DOM R4, R5, R15a i R15b rysowane w Rust na `Canvas2dLite`, zweryfikowane z Chromium 141 (P4-25 §2.3, §6).
ZMIANY/COMMIT: oceniany kod `2e00643e1b77b82e015cbb22cedc1ce99918f297` (obrona r3), rodzic `525a2ef7b` = głowa `origin/rust-port/parity-v2` w chwili oceny. Ten raport to osobny commit dokumentacyjny na `2e00643e1` (SHA w `git log` i w odpowiedzi do orkiestratora). Bez push.
TESTY: bramki uruchomione samodzielnie (szczegóły niżej), wszystkie `EXIT=0`.
BLOKADY: brak.
RUNDY: 3/5 (Final Control po Evaluatorze r3 i Obronie r3).
NASTĘPNY KROK: integracja orkiestratora (fast-forward `parity-v2` → `2e00643e1` lub commit FC), wpis w rejestrze z łańcuchem SHA i adnotacją, że `ba5dca739` wszedł do parity przed FC.
DEPLOY/PUSH: NIE WYKONANO

## 1. Ancestry i zakres

| Sprawdzenie | Komenda | Wynik |
|---|---|---|
| głowa parity | `git rev-parse origin/rust-port/parity-v2` | `525a2ef7b5df3f12a91ebbf5e533c2475276004c` |
| rodzic obrony r3 | `git log -4 --oneline 2e00643e1` | `2e00643e1` → `525a2ef7b` |
| kod r1/obrony r1 w parity | `git merge-base --is-ancestor ba5dca739 525a2ef7b` | tak |
| łańcuch tematu | `git rev-parse 6cd6f33aa^ ba5dca739^` | `51a62a89b`, `6cd6f33aa` |
| `27090d91` | `git cat-file -t` (w obronie r3) | nie istnieje |
| `03-operator-r2.md` | `ls` katalogu runu | nie istnieje (rundy Operatora r2 nie było) |
| raport Evaluatora r3 | `git show --stat e43274091` | `04-evaluator-r3.md` na rodzicu `807ecebdd` (gałąź dokumentacji), nie jest przodkiem `2e00643e1` |

Integracja `2e00643e1` do `parity-v2` to fast-forward, o ile parity nie przesunie się przed integracją (sprawdzić ponownie przed FF).

Allowlista: `git diff --stat 525a2ef7b 2e00643e1` = 9 plików: `src/labels/anchor.rs` (tylko komentarz doc), `tests/labels_anchors.rs`, `P4-34-ANCHORS-DOM.md` §11, `02-operator-obrona-r1.md` (korekta SHA), `05-obrona-r3.md`, `dowody/13-obrona-r3-*`. Wszystkie w allowliście. Commity `6cd6f33aa` i `ba5dca739` (`git show --stat`) także dotykają tylko `src/labels/**`, jednej linii `lib.rs`, `tests/labels_*.rs`, `tests/fixtures/labels/**` (referencje RGBA łącznie ok. 2,5 MB, poniżej 8 MB) oraz dokumentów tematu. Zero zmian w `gra/**`, `rust-port/engine/**`, `src-tauri/**`, `Cargo.toml`, `Cargo.lock`, `geom|pick|assets|camera|terrain|models|decor|core|jsmath/**`. `git diff --check 525a2ef7b 2e00643e1`: czysto.

## 2. Bramki (Final Control, świeży `CARGO_TARGET_DIR` w scratch, usunięty po bramkach)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, HEAD = `2e00643e1`, katalog `rust-port/renderer`:

```
FMT EXIT=0                     cargo fmt --all -- --check
CLIPPY EXIT=0                  cargo clippy --locked --all-targets -- -D warnings
CLIPPY-GPU EXIT=0              cargo clippy --locked --all-targets --features gpu -- -D warnings
TEST EXIT=0                    cargo test --locked --all-targets: 65 × "test result: ok", 491 passed, 0 failed
MSRV labels_anchors EXIT=0     cargo +1.87.0 test --locked --test labels_anchors: 8 passed
MSRV labels_layout EXIT=0      cargo +1.87.0 test --locked --test labels_layout: 7 passed
MSRV labels_scenes EXIT=0      cargo +1.87.0 test --locked --test labels_scenes: 4 passed
git status --short: puste (Cargo.lock bez zmian)
```

Mutacje odtworzone przez FC (`cargo test --locked --test labels_anchors`, plik przywrócony i test zielony po serii):

| Mutant | Zmiana w `src/labels/anchor.rs` | Wynik |
|---|---|---|
| E6 | `rect.width <= 0.0 \|\| rect.height <= 0.0` → `rect.width <= 0.0` | zabity (rc=101) |
| E7 | `siege_label_position`: `wp.z > 1.0` → `wp.z >= 1.0` | zabity |
| O3 | `world_to_client_px`: `v.z > 1.0` → `v.z >= 1.0` | zabity |
| O4 | `js_round` zwraca −0 dla wyniku 0 po zaokrągleniu w górę | zabity |

Źródła weba sprawdzone na pinie `edb8fb56`: `gra/src/input/picker.ts:110` (`if (v.z > 1) return null`), `:112` (`rect.width <= 0 || rect.height <= 0`), `gra/src/main.ts:14593` (`if (wp.z > 1)`), `:14600-14601` i `:12967-12968` (`Math.round(...) + 'px'`). Port zgodny.

## 3. Orzeczenia

| # | Zarzut Evaluatora r3 | Orzeczenie | Uzasadnienie (dowód) |
|---|---|---|---|
| 1 | Brak testów rozróżniających `rect.height <= 0` i granicę `z > 1` | ODDAL (naprawione w obronie r3) | Dodane asercje w `projections_match_the_web_bit_for_bit`: rect z `height = 0` → `None`; kamera tożsamościowa, NDC z = 1.0 → `Some((50, 25))`, następny double po 1.0 → `None`, dla obu funkcji. Mutanty E6, E7, O3 zabite w niezależnym przebiegu FC. |
| 2 | `js_round_is_math_round` mylący (assert_eq nie odróżnia ±0) | ODDAL (naprawione w obronie r3) | Test porównuje teraz `to_bits` (`same()`), oczekuje +0 dla −0.5 i −0.2, −0 dla −0.0. Odchylenie od JS (−0 w `Math.round`) opisane w doc `js_round` i w teście; jest nieobserwowalne, bo web zapisuje wynik wyłącznie jako `Math.round(v) + 'px'`, a `String(-0)` = `"0"`. Mutant O4 zabity. |
| 3 | Ślad dokumentacyjny: `27090d91`, brak SHA r1, brak `03-operator-r2.md` | ODDAL (naprawione w obronie r3) | `02-operator-obrona-r1.md` i P4-34 §11 podają teraz `6cd6f33aa` (r1, baza `51a62a89b`) i `ba5dca739` (obrona r1), z adnotacją korekty. W repo nie ma już odwołania do `27090d91` poza opisem korekty. `03-operator-r2.md` nie istnieje, bo nie było rundy Operatora r2. Wskazanie go w zleceniu Workflow to błąd dispatchu, nie tematu. |
| 4 | Kod `ba5dca739` wszedł do parity (przez rebase P4.35, `c4fa31a2f`) przed Evaluatorem i FC | ODDAL jako zarzut wobec tematu; odnotowanie dla orkiestratora | Fakt potwierdzony (`merge-base --is-ancestor`). To naruszenie procesu po stronie integracji innego tematu, a nie wada kodu P4.34. Ocena FC tego kodu na głowie parity jest zielona, więc nie ma regresji do cofania. Orkiestrator powinien to zapisać w rejestrze. |

Żadnego orzeczenia NAPRAW.

## 4. Uwagi (nie blokują)

- N1. Raport Evaluatora r3 (`04-evaluator-r3.md`, commit `e43274091`) leży na gałęzi dokumentacji (rodzic `807ecebdd`), a nie w linii kodu `2e00643e1`. Orkiestrator powinien przy integracji dołączyć go do katalogu runu.
- N2. Commity tematu kończą się stopką atrybucji `Co-Authored-By` z nazwą modelu, wymaganą przez harness. Temat i treść commitu nie zawierają nazwy modelu; ostatnia linia to `Claude-Session: …` zgodnie z DODATKIEM r3. Uznaję za zgodne.
- N3. Wnioski z zarzutu 4: nie współdzielić `CARGO_TARGET_DIR` między drzewami rozpakowanymi z `git archive` (stary mtime daje nieaktualną binarkę). FC użył osobnego katalogu i `os.utime` przy mutacjach.
- N4. Ocena wizualna 1:1 na GPU pozostaje NIE_ZMIERZONO (lista w P4-34 §10), zgodnie z dispatchem.

## 5. Werdykt

PASS-WITH-NOTES. Kod końcowy `2e00643e1b77b82e015cbb22cedc1ce99918f297`, fast-forward względem `origin/rust-port/parity-v2` @ `525a2ef7b`. Decyzji właściciela nie trzeba.
