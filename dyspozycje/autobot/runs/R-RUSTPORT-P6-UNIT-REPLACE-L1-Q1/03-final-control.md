STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L1-Q1
GOAL: uzupelnic awanse INFANTRY (21/23) w rust-port/engine/data/units.json wg pinu 07d2fbd72, z testem behawioralnym
ZMIANY/COMMIT: kod operatora adf30a705 + obrona a6b6a4cce (SHA koncowy do integracji: a6b6a4cce). Ancestry: 83ac67875 (baza z dispatchu) jest przodkiem a6b6a4cce (merge-base = 83ac67875). origin/rust-port/parity-v2 poszedl dalej (33cd715cf, zawiera f207ea6b1) - rebase/merge wymagany przy integracji. Diff 83ac67875..a6b6a4cce: units.json, p6_unit_replace_l1.rs, p6_unit_replace_l1_gen.mjs, wektor infantry-promotion.json, 01/02a runs - wszystko w allowliscie; gra/, Cargo.toml, WERSJE.md nietkniete. Cargo.lock nie commitowany.
TESTY (samodzielnie): cargo test --test p6_1d_civ_bonuses na a6b6a4cce: 12 passed, 2 failed (embedded_data_is_byte_identical_to_data_used_for_vectors, strip_diacritics_matches_web_function_cut_verbatim, linia 219 potwierdzona: 9b7ebd39... != b0dbfb9d...). Bramka testow danych jednostek CZERWONA. fmt/clippy/lib/p6_unit_replace_l1: wg Operatora/Evaluatora exit 0 (nie powtarzane przeze mnie).
BLOKADY: p6_1d czerwone; naprawa wymaga zmiany tests/p6_1d_vectors/web-vectors.json (poza allowlista) i wyboru pinu danych (wektory p6_1d z edb8fb56, awanse z 07d2fbd72).
ROZSTRZYGNIECIE ZARZUTOW:
1. BLOKUJACY p6_1d - DO DECYZJI CZLOWIEKA (allowlista + pin); do czasu decyzji bramka czerwona, wiec FAIL.
2. ISTOTNY 50 pol poza awansami - ODDAL (sprzed zmiany, poza GOAL; zalecany osobny temat danych).
3. UWAGA brak wolajacego available_replacements_for - ODDAL (poza GOAL; efekt w grze niepokryty, nie zaliczany).
4. DROBNE any vs zbior - ODDAL (Obrona dodala asercje podzbioru).
5. DROBNE negatywna kontrola - ODDAL (Obrona odtworzyla: pada na starym units.json).
6. PROCES - ODDAL.
RUNDY: 1/5 (FC po r1)
NASTEPNY KROK: decyzja wlasciciela (a: rozszerzyc allowliste o web-vectors.json + hash, z wyborem pinu; b: awanse do osobnego pliku danych; c: wstrzymac), potem Operator r2 z tym samym ID.
DEPLOY/PUSH: NIE WYKONANO
