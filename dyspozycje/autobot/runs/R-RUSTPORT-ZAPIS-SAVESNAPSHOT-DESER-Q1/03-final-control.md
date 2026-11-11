STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-SAVESNAPSHOT-DESER-Q1
GOAL: usunac publiczny Deserialize z SaveSnapshot; ladowanie tylko przez loader
ZMIANY/COMMIT: brak kodu. Operator 10868848f (tylko 01-operator-r1.md, potwierdzone diff --stat vs ca25d6fd2); ancestry: ca25d6fd2 jest przodkiem origin/rust-port/parity-v2 (= ca25d6fd2). Evaluator 09e0fd543, Obrona 70ebbdc1d (tylko raporty).
TESTY: NIE_ZMIERZONO (brak kodu do bramkowania; cargo nie uruchamiano przez FC). Weryfikacja statyczna git grep na ca25d6fd2.
BLOKADY: dispatch wymaga decyzji ABC o zakresie (allowlista).
RUNDY: 1/5 (BLOCK operatora, nie FAIL)
NASTEPNY KROK: decyzja wlasciciela ABC, potem Operator r2 na tym samym ID.
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja wlasna
- save_load.rs:759 `impl<'de> Deserialize<'de> for SaveSnapshot` (reczna), nie derive: premisa dispatchu falszywa. POTWIERDZONE.
- replay.rs:43 i :52 `Option<SaveSnapshot>` w typach deserializowanych; zapis_loader.rs:44 `from_str` do SaveSnapshot; tests/save_load.rs tez uzywa from_str::<SaveSnapshot>. Usuniecie impl psuje kompilacje poza allowlista. POTWIERDZONE.
- 11 plikow tests/ wspomina SaveSnapshot; lista z zarzutu 3 spojna (nie kompilowano).

## Rozstrzygniecie zarzutow
1. Premisa falszywa: ODDAL (fakt, wymaga korekty dispatchu).
2. replay.rs / zapis_loader.rs poza allowlista: ODDAL (BLOCK poprawny).
3. Testy poza allowlista: ODDAL.
4. tests/save_load.rs #[path]: ODDAL.
5. Zachowanie operatora poprawne: ODDAL.
6. Bramki NIE_ZMIERZONO / zakres: DO DECYZJI CZLOWIEKA.

Zero NAPRAW. Blokada jest po stronie dispatchu, nie operatora.

## Decyzja ABC dla wlasciciela
A (zalecana): poszerzyc allowliste o replay.rs, zapis_loader.rs (pelna zmiana), wymienione testy p6_*, tests/replay.rs i strukture tests/save_load.rs; kryterium 2 na "brak publicznego Deserialize; prywatny typ wire"; rozstrzygnac test raw-nie-migruje (p6_zapis_loader_migrate:102).
B: zawezic GOAL - kryterium usuniecia impl nie bedzie spelnione.
C: zamknac temat jako dlug udokumentowany.
Uwaga: wolne miejsce na / ok. 2,7 GB, ponizej progu 8 GB dla Rust; r2 po sprzataniu dysku.
