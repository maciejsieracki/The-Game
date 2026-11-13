STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1
GOAL: Ustalić, jak pin wywołuje chargeWarDeclarationCredibility (gracz, sojusz, klaster) i czego brakuje w Rust.
ZMIANY/COMMIT: baza fc2ed160f; kod operatora c2824c9ab; poprawki obrony 202f5a45c; 02a obrona 184350c13 (SHA końcowy rozpoznania). 3 pliki .md, wszystkie w allowliście. fc2ed160f jest przodkiem 184350c13 (merge-base --is-ancestor: OK). git diff --check czysty. Commity z trailerem Claude-Session, bez Co-Authored-By (zgodnie z dispatchem).
TESTY: NIE DOTYCZY (brak zmian kodu; cargo nie uruchamiane). Zweryfikowano samodzielnie: diff --stat (3 pliki .md, +153), allowlista, ancestry, treść dokumentu po obronie.

## Zarzuty (orzeczenie)
1. Pominięta gałąź force / isPeaceLockedBetween: ODDAL. Dopisane w §1a (obrona O-1), obecne w 184350c13.
2. Hash fragSha256 to nie wektory zachowania: ODDAL. T1 w §4 wymaga regeneracji generatorem p6_cred_wojna_gen_r2.mjs i zakazuje ręcznej edycji vectors.json.
3. Niespójne guardy barbarzyńcy: ODDAL. Wiersz w §2 zmieniony na CZĘŚCIOWO, T1 ujednolica.
4. Tabela zależności bez ścieżki force/rebel-war: ODDAL. §4 (T2 jest zależnością T3 i T5) uzupełniony.
5. Szacunki rund T4/T5 bez podstawy: ODDAL. Oznaczone jako wstępne, z wymogiem przeliczenia przed startem (§4).
6. Bramki fmt/clippy/test nie uruchamiane: ODDAL. Dispatch: TESTY NIE DOTYCZY, zmiany wyłącznie dokumentacyjne.

Brak zarzutów NAPRAW. Notatka kosmetyczna (nieblokująca): w dokumencie rozpoznania zdublowany nagłówek "## 2." (§2 po §1a).

## Do decyzji człowieka
- Pytanie ABC: format komendy gracza DeclareWar (bridge/UI), blokuje T3.
- Pytanie ABC: czy wojna klastra państw-miast wobec gracza wchodzi w zakres Rust teraz, blokuje T5.

DEPLOY/PUSH: NIE WYKONANO
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora; start T1 (CRED-HAK-DECLARE-OPTS) po decyzjach ABC dla T3/T5.
