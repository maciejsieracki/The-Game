# R-RUSTPORT-P4-409-CLIENT-API-GAPS-Q1: Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-409-CLIENT-API-GAPS-Q1
GOAL: publiczne `abort_siege_battle` (przez `AbortSiegeBattle`) i `load_game` w kliencie (po zaakceptowanym `LoadGame`: jedno `GetRenderMap`, potem jedno `GetRenderFrame`), testy E2E silnik → most → klient, mutanty.
ZMIANY/COMMIT: oceniany stan `1a1d20581` (gałąź `obrona/409`): kod Operatora `899753337`, raport `79936e7f6`, Evaluator `b3eeb472d`, Obrona `1a1d20581`. Baza `de4eabfe6e1cf7764b21d5ba9e4e2759ddea8ff2` = `origin/rust-port/parity-v2` w chwili FC (sprawdzone `rev-parse`; `merge-base --is-ancestor` OK). Kod do integracji: `1a1d20581` (zawiera `899753337`). FC dodaje tylko ten raport (commit nad `1a1d20581`, gałąź `fc/409`, bez push).
TESTY: §2 (odtworzone samodzielnie).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF `parity-v2` do commitu FC) + wpis D-409-OP-1..4 w `REJESTR-RUST.md` (U4).
DEPLOY/PUSH: NIE WYKONANO

## 1. Allowlista i zakazy (sprawdzone samodzielnie)

`git diff --stat de4eabfe6 1a1d20581`: `rust-port/client/src/lib.rs` (+173/−3), `rust-port/client/tests/save_load_client.rs` (nowy), `rust-port/client/tests/siege_battle_client.rs`, raporty `01/02/02a` w katalogu runu. Wszystko w allowliście. `engine`, `renderer`, `view-model`, `gra/`: 0 zmian ⇒ D-409-1, D-409-3 (`CONTRACT_VERSION` nietknięty). `Cargo.lock`: nietknięty, `git status` czysty po bramkach i mutantach. `#[ignore]` w kodzie: 0 (3 trafienia grep to wyłącznie tekst raportów). Usunięte asercje: 0. Komunikaty commitów: brak nazw modeli.

## 2. Bramki (crate `client`, stan `1a1d20581`; `CARGO_TARGET_DIR` w scratchpadzie, usunięty; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`)

| bramka | wynik |
|---|---|
| `cargo fmt --check` | FMT_EXIT=0 |
| `cargo clippy --all-targets -- -D warnings` | CLIPPY_EXIT=0 |
| `cargo test --all-targets --no-fail-fast` | TEST_EXIT=0: lib 0, `engine_bridge_renderer` 24, `save_load_client` 8, `siege_battle_client` 34 = **66 passed / 0 failed / 0 ignored** (baza 51) |
| engine pełny | nie powtarzany: silnik bez zmian względem bazy (`diff --stat` pusty); Evaluator na tym samym kodzie produkcyjnym: EXIT 0, 4352/0/1 = stan bazy #407. Klient kompiluje most silnika przez `#[path]` — zielony. |
| renderer | nie dotyczy (nietknięty). |

Dysk: 13 GB przed, 12 GB po usunięciu targetu. Procesy cargo po rundzie: brak.

## 3. Mutanty FC (własne, `client/src/lib.rs`, przywrócone; `cmp` z oryginałem = identyczny)

| # | mutant | wynik |
|---|---|---|
| FC-M1 | `load_game` bez `on_session_created` (brak `GetRenderMap`) | ZABITY (5 testów `save_load_client`) |
| FC-M2 | zerowanie zaznaczenia PRZED `LoadGame` (odrzucone wczytanie zmienia sesję) | ZABITY (`odrzucony_zapis_nie_zmienia_sesji`) |
| FC-M3 | `abort_siege_battle` bez `self.battle = None` (abort bez zamknięcia UI bitwy) | ZABITY (3 testy `wycofanie_*`) |
| FC-M4 | ramka przed mapą (zła kolejność) | ZABITY (6 testów) |

Razem z mutantami Operatora (16/16), Evaluatora (16 zabitych + 1 równoważny E12 po Obronie) i Obrony (6/6) kryterium 3 (≥ 6) spełnione z dużym zapasem.

## 4. Kontrola merytoryczna

- Pin `07d2fbd72` sprawdzony: `main.ts:47328-47332` (`selectedId = null` … `hoverKey = null`) — numeracja Operatora/Obrony poprawna; `main.ts:37023` `onCancel` → `setMood('mapa')`, komentarz `#50` o niezużyciu machin przy anulowaniu — zgodny z testem.
- `abort_siege_battle`: `NoBattle` bez wołania silnika; błąd silnika (`?`) zostawia bitwę; po akceptacji zamyka bitwę, `Aborted { city_id, SIEGE_WITHDRAW_REASON }`, ramka tylko przy `state_changed` (gałąź pokryta testem Obrony U2).
- `load_game`: najpierw `LoadGame` (błąd ⇒ `Rejected`, nic nie zmienione), potem reset UI z `restoreGameFromSave`, `on_session_created` (zeruje map/frame/scene/bitwę i pobiera mapę), `on_state_changed` (ramka z wyzerowanym UI). Kolejność `[Load, Map, Frame]` i liczniki +1/+1 testowane; ramka = referencja ze stanu zapisu (porównanie JSON), ≠ ramka sprzed wczytania.

## 5. Orzeczenia zarzutów

| zarzut | orzeczenie | uzasadnienie |
|---|---|---|
| U1 (E8, panel oblężenia po wczytaniu niesprawdzany) | ODDAL | Domknięty przez Obronę testem całego `ClientUiState`; E8/E8b zabite (powtórzone pośrednio: test zielony, porównanie pełnego UI). |
| U2 (E13, martwa gałąź `state_changed` w abort) | ODDAL | Pokryta testem skryptowanym `wycofanie_ze_state_changed_odswieza_ramke` (FC-M3 też go zabija). |
| U3 (E17/E18, odrzucone wczytanie zeruje hover/`battle_end`) | ODDAL | Test `odrzucony_odczyt_po_bitwie_nie_zmienia_sesji`; FC-M2 dodatkowo zabity przez test w `save_load_client`. |
| U4 (decyzje D-409-OP-1..4 do `REJESTR-RUST.md`) | ODDAL (jako zarzut wobec kodu) — czynność orkiestratora przy integracji | Plik poza allowlistą tematu; treść gotowa w `02a-obrona.md` §U4. Decyzja techniczna (orkiestrator, CLAUDE.md §9), nie gameplay. |
| D-409-OP-4 vs D-409-2 („najpierw zamyka bitwę”) | ODDAL | Zamknięcie lokalne przed wczytaniem dałoby rozjazd klient/silnik przy odrzuconym zapisie i łamałoby wymóg dispatchu „odrzucone wczytanie nie zmienia sesji”; zamknięcie po akceptacji jest technicznie poprawnym doprecyzowaniem (test `odczyt_w_trakcie_bitwy`). Do wpisu w rejestrze razem z U4. |
| Drobne (numer linii `:47327-47331`) | ODDAL | Sprawdzone w pinie: ciąg zajmuje `:47328-47332`; komentarze poprawne. |

NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0.

## 6. Werdykt

PASS-WITH-NOTES. Notatka dla integracji: wpisać D-409-OP-1..4 do `dyspozycje/rust-port/REJESTR-RUST.md` (treść w `02a-obrona.md`), z jawnym doprecyzowaniem D-409-2 przez D-409-OP-4.
