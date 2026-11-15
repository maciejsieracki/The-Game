# 03-final-control: R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1 (#98 K5-LOOP-WYLOM, zakres 1-3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1
GOAL: stan zniszczenia wieży przy wyłomie (wieża bez kafla muru nie jest planowana i nie strzela; wyłom usuwa kafel i zburza wieżę w tym samym wywołaniu), z wektorami pinu `07d2fbd72` i mutacją dającą FAIL. Wiring produkcyjny (#113) i efekty trafienia (#109/#147) poza tematem.
BAZA: `d5a52a980`. Oceniany kandydat: `25eb371fb` (Obrona r1; łańcuch `1849d5eea` Operator r1 -> `1fd555853` Evaluator r1 -> `426a95e40` kod Obrony -> `25eb371fb` raport Obrony). `git merge-base --is-ancestor d5a52a980 25eb371fb` = TAK (sprawdzone w worktree FC).
ZMIANY/COMMIT: SHA końcowy kandydata = `25eb371fb`; commit tego raportu FC podany w odpowiedzi (jedyny dodatek: ten plik). Brak push, brak integracji.
DEPLOY/PUSH: NIE WYKONANO.

## BRAMKI (odtworzone samodzielnie przez FC; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, usunięty po bramkach)

- `cargo fmt --check` (rust-port/engine): EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --all-targets` (pełny): EXIT 0, suma `passed 3421, failed 0, ignored 1` (ignorowany test jest pre-istniejący, `e2e::dump_tick1_econ_for_web_generator`, nie z tego tematu).
- `git diff --check d5a52a980 25eb371fb`: czysto.
- Wektory: `p6_siege_wylom_gen.mjs` uruchomiony przez FC na `git archive 07d2fbd72 gra/src` (Node v22.23.4) daje plik bajt-w-bajt identyczny z `tests/p6_siege_wylom_vectors/vectors.json` (`cmp`).
- Mutacja M1 (FC, niezależnie od Obrony): zakomentowanie `n.wall_tile_hp.remove(&wall_row);` w `breach_wall_tile` (`siege_tactics_breach.rs:97`) -> `cargo test --test p6_siege_wylom_tower`: 3 FAILED / 3 ok (`breach_wall_tile_usuwa_kafel_i_zburza_wieze_w_tym_samym_wywolaniu`, `wylom_po_zaplanowaniu_salwy_wieza_nie_strzela_przed_strzalem`, `wylom_przed_kolejna_salwa_pomija_zniszczona_wieze`). Plik przywrócony (`git status` czysty poza nieśledzonym `Cargo.lock`, którego nie commituję).
- `#[ignore]` w nowych plikach: 0. Asercje nie osłabione (przeczytany cały `tests/p6_siege_wylom_tower.rs`).

## ALLOWLISTA (diff `d5a52a980..25eb371fb`)

Zmienione pliki: `siege_tactics_breach.rs` (tylko komentarz doc `breach_wall_tile`), `siege_tactics_loop.rs` (tylko komentarze `plan_tower_shots` i `tower_shoot`, po usunięciu mostu przez Obronę brak zmian kodu), `tests/p6_siege_wylom_tower.rs` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1/**`, oraz dwa pliki poza literalnym wzorcem `p6_siege_wylom_*.rs`: `tests/p6_siege_wylom_gen.mjs`, `tests/p6_siege_wylom_vectors/vectors.json` (zob. zarzut 4). Nietknięte: `gra/**`, renderer, view-model, `bridge.rs`, `domain/mod.rs`. `Cargo.lock` niecommitowany.

## ORZECZENIA O ZARZUTACH (NAPRAW / ODDAL / DO DECYZJI CZŁOWIEKA)

Weryfikacja pinu `07d2fbd72` wykonana przez FC na świeżo (`git show`): `_destroyTowerAtRow` `:4194-4200`, pętla `_fireSiegeTowers` `:4214-4220` (`if (t.destroyed) continue` `:4215`, brak klucza w `wallTileHp` -> `_destroyTowerAtRow` `:4216`), guard `_fireOneTower` `:4227` (dispatch podawał `:4226`, przesunięcie o 1), `_breachWallTile` `:7638-7649` (`wallTileHp.delete` `:7646`, `_destroyTowerAtRow` `:7648`), `_attackWallTile` `:7555-7565`, `_resetSiegeForReplay` `:10518-10531`, jedyne zapisy `wallTileHp.set` `:4053`, `:7558`, `:10529`, jedyne zapisy `destroyed` `:4189`, `:4197`.

1. [ŚREDNI] predykat vs replay: ODDAL (zarzut był trafny; Obrona go przyjęła i naprawiła w całości). Dowód: komentarz `breach_wall_tile` przepisany (zakres "w jednej bitwie, bez replayu", wyjątek replay z numerami linii zgodnymi z pinem), wpis BRAK-1 w `02a-obrona.md`. Replay jest nieportowany (`siege_tactics_breach.rs:25`), więc brak regresji dziś. Nie wymaga zmian kodu.
2. [NISKI-ŚREDNI] odstępstwo od dispatchu (brak pola `destroyed` w `SiegeEnv`): ODDAL (akceptuję jako jawne odstępstwo). Uzasadnienie: baza już zawierała i planowanie (`:368`), i guard strzału (`:619`) oparte o `wall_tile_rows`; literały `SiegeEnv {..}` i `WallState {..}` w plikach poza allowlistą (`tests/p6_siege_tactics_loop.rs:148`, `p6_siege_tactics_loop_resume.rs:149`, `p6_tower_target_wiring.rs:228`, `p6_wieze_2b1.rs:77`, `p6_wieze_2b2.rs:106`, `p6_siege_tactics_breach.rs`) złamałyby kompilację przy dodaniu pola, a zmiana tych plików to FAIL wg dispatchu. Kryterium 3 (mutacja) spełnione równoważnie: usunięcie `wall_tile_hp.remove` w `breach_wall_tile` daje FAIL (zweryfikowane przez FC). Równoważność predykatu z flagą pinu poza replayem jest sprawdzana w teście dwiema drogami (czysta funkcja i obecność w pętli) wobec `destroyed` z pinu w wektorach. Luka w replayu zapisana jako BRAK-1.
3. [NISKI] `sync_wall_state` jako publiczne API: ODDAL (naprawione: funkcja i import usunięte z kodu produkcyjnego, most przeniesiony do funkcji testowej `sync_loop_from_wall`). Diff produkcyjny jest wyłącznie komentarzami.
4. [NISKI] generator `.mjs` i `vectors.json` poza literalną allowlistą: ODDAL z adnotacją, zatwierdzone przez FC jako pliki pomocnicze testu. Powód: dispatch każe w kryterium 2 użyć "wektorów pinu, nie ręcznych liczb", a wzorzec `p6_siege_wylom_*.rs` z natury nie obejmuje generatora ani danych; bez nich kryterium 2 jest niewykonalne. Precedens w bazie: `tests/p6_tower_target_wiring_gen.mjs` i `tests/p6_tower_target_wiring_vectors/vectors.json`. Generator ma strażnik SHA-256 pliku pinu i fragmentów, wektory zregenerowane bajt-w-bajt. Skoro dispatch literalnie mówi "wszystko poza tym = FAIL", sprawa trafia do wiadomości człowieka (patrz DO DECYZJI), ale nie blokuje werdyktu.
5. [NISKI] `wall_ever_breached` przypisywane 1:1: ODDAL (znika razem z mostem produkcyjnym). Uwaga dla #113 zapisana jako BRAK-2 i w dokumentacji `sync_loop_from_wall`: flaga w pinie jest monotoniczna poza replayem (`:10522`).
6. [NISKI, pokrycie] brakujące wektory (wyłom na wierszu bez wieży, wszystkie wieże zburzone, dwa wyłomy, `terrain_tiles_present=false` w pętli, `_attackWallTile`, trafienie w locie): ODDAL (poza zakresem 1-3; zapisane jako BRAK-3 w `02a-obrona.md`). Kryteria 1-5 spełnione bez nich.
7. [INFORMACYJNY] sufit tur wyłączony w teście (`no_breach_cap: 1_000_000`): ODDAL (jawnie zgłoszone w NIE_ZMIERZONO z `01-operator-impl.md`, bez zastrzeżeń).

Liczba NAPRAW: 0. Werdykt: PASS-WITH-NOTES.

## KRYTERIA KOŃCA

1. Luki 4, 7, 21 z rozpoznania zamknięte z dowodem plik:linia: TAK (pin i Rust wskazane wyżej; w zakresie jednej bitwy bez replayu).
2. Wektory z pinu, nie ręczne liczby: TAK (generator wykonuje metody pinu; odtworzone bajt-w-bajt).
3. Mutacja dająca FAIL: TAK (M1, 3 testy).
4. Brak `#[ignore]` i osłabionych asercji: TAK.
5. NIE_ZMIERZONO jawne w raporcie: TAK (BRAK-1..3 w `02a-obrona.md`, uzupełnione niżej).

## NIE_ZMIERZONO / UWAGI DLA ORKIESTRATORA (uzupełnienie rejestru)

- BRAK-1 (replay): `_resetSiegeForReplay` przywraca kafle, nie resetuje `siegeTowers[].destroyed`; przy portowaniu replayu wymagany jawny stan `destroyed`.
- BRAK-2 (wiring #113): most `WallState` -> `SiegeEnv` nie istnieje w produkcji; `wall_ever_breached` nie może być obniżane starszym stanem.
- BRAK-3 (pokrycie): wektory (a)(b)(c)(e)(f) z Zarzutu 6 do osobnego tematu (tanie dopiski generatora: a, b, c).
- BRAK-4 (nowe, FC): pin ma drugiego konsumenta flagi `destroyed`: `_siegeShooterThreats` (`battleScene.ts:7932-7935`) pomija zburzone wieże przy liczeniu zagrożeń dla bezpiecznego podejścia (K1). Ten temat go nie dotyka; przy wiringu #113 trzeba sprawdzić, czy wejście zagrożeń w Rust (`siege_tactics_move`/`siege_tactics_loop`) używa tego samego źródła stanu zburzenia (brak klucza w `wall_tile_hp`) co planowanie i strzał wieży.
- Uwaga porządkowa (poza allowlistą, wcześniejszy kod): komentarz w `rust-port/engine/tests/p6_siege_tactics_loop_gen.mjs:18` ("kafel nie wraca") ma ten sam błędny punkt co uzasadnienie z `01-operator-impl.md`; do poprawienia osobnym drobnym tematem.
- `01-operator-impl.md` zachowuje błędne zdanie "kafel nie wraca" (decyzja 1); autorytatywna korekta jest w `02a-obrona.md` (KOREKTA REJESTRU) i w tym pliku.

## DO DECYZJI CZŁOWIEKA

- Zatwierdzenie `p6_siege_wylom_gen.mjs` i `vectors.json` jako plików poza literalną allowlistą dispatchu (precedens w bazie; rekomendacja: zatwierdzić).
- Zatwierdzenie odstępstwa: brak osobnego pola `destroyed` w `SiegeEnv`/`WallState` (predykat z `wall_tile_rows`), z konsekwencją BRAK-1 przy portowaniu replayu (rekomendacja: zatwierdzić; pole wymagałoby zmian w sześciu plikach testów spoza allowlisty).

## RUNDY

Operator r1, Evaluator r1, Obrona r1, Final Control r1: 4 etapy, 1 runda tematu z 5 dopuszczalnych (FAIL nie wystąpił).

## NASTĘPNY KROK

Integracja orkiestratora: `git merge-base --is-ancestor` oraz `git diff --stat` względem `d5a52a980` przed FF, pełny `cargo test` po integracji, rejestry (`REJESTR-RUST.md`: #98 zakres 1-3 zamknięty, BRAK-1..4 jako otwarte), zadania następne: wiring #113, efekty trafienia #109/#147, wektory pokrycia BRAK-3.
