STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1
GOAL: M06B1 (6 symboli finalizacji wybrzeza, web gen-helpers.ts 4649-4939, pin edb8fb56) w landsea.rs
OCENIANY: bf5e7ad1 (baza deb8055e; landsea.rs bez zmian od deb8055e: `git diff deb8055e bf5e7ad1 -- rust-port/engine/src` puste)

## Zweryfikowane samodzielnie
- Allowlista: `git diff --name-status db102531 bf5e7ad1` - tylko dozwolone sciezki; `git diff --check` czysty.
- Logi bramek: gate-fmt/clippy/test-r1.log niepuste, kazdy z `EXIT=0`; suma "test result" = 1436 passed / 0 failed.
- Moje uruchomienie: cargo test --offline (p6_m06b1_boundary/coast/ocean/tables) EXIT=0, 3+7+2+2 ok.
- web-vectors.json bez zmian wzgledem deb8055e (stare wektory nietkniete).
- mut-results-m06b1-r1.json: 28 mutacji, 23 zabite, 5 przezylo (M12, M19, M20 rownowazne z dowodem plik:linia - AKCEPTUJE; M16, M17 otwarte).

## Zarzuty - rozstrzygniecie
1. Brak fazy pomiarow / mutacji / logow z EXIT - ODDAL (naprawione w bf5e7ad1).
2. Przezyly M12, M19, M20 - ODDAL (dowod rownowaznosci z kodu w dok. 9.1: kazdy helper zwraca liczbe realnych zmian, brak RNG, pusty zbior = no-op).
3. Luka maxPasses N-1/N/N+1 - ODDAL (M09-M11, M27, M28 zabite; fin-7-pool2 i fin-32-pool2 daja roznice na granicach 2/3/4).
4. Cap 12 (przebiegi_wygladzania) nieobserwowalny - **NAPRAW**. Teza dokumentu 9.2 ("cap nieobserwowalny", "0 map z rozbieznoscia") jest FALSZYWA; wynika ze zbyt slabego wyszukiwania (hill-climb na mapach 9..24). Dowod FC: web pin edb8fb56 w trzech kopiach (cap 11 / 12 / 13, jedyna zmiana `pass < N` w gen-helpers.ts, thickenCoastAndSmoothInlets czesc (a)); 1500 losowych map W,H 20..49, P(morze) 0.25..0.55, ziarno LCG 12345 (skrypt: scratchpad div3.mjs): cap11 != cap12 na 371 mapach, cap13 != cap12 na 304 mapach; przyklad: W=H=29, p=0.5403, iteracja 3, cap13 vs cap12 roznia sie o 2 hekse (cap uncapped vs 12: 304 map, do 38 hekses roznicy). Wniosek: M16/M17 sa ZABIJALNE; wymagany wektor(y) z webu (mapa >=20x20, cap 11/12/13 daja rozne wyniki) w web-boundary.json + test Rust; po poprawce M16/M17 musza byc zabite, a dokument 9.2 poprawiony (usunac hipoteze o nieobserwowalnosci). Zakres lacznie z N-1/N/N+1 dla capu.
5. Logi bez EXIT - ODDAL (nowe logi maja EXIT=0, niepuste).
6. Brak niezaleznego weryfikatora Python (wymog dispatchu, wzorzec M05B/M06A) - **NAPRAW**. Oracle = web jest dobry do wektorow, ale dispatch wymaga osobnego weryfikatora; Obrona sama przyznaje "NIE ZROBIONE". Dostarczyc weryfikator (Python) odtwarzajacy 6 symboli i porownujacy z wektorami webu, wynik w runie.
7. Prefiks cmp-vectors - ODDAL: cel (stabilnosc starych wektorow) spelniony - web-vectors.json bajt w bajt bez zmian, nowe wektory w osobnym pliku web-boundary.json.
8. Zgodnosc kodu 1:1 z webem - ODDAL (potwierdzona, poza capem ktorego brak wektora nie falsyfikuje kodu: kod uzywa wartosci tabeli 12 = literal webu).

## Werdykt
Dwa NAPRAW (4, 6) -> FAIL. Kod landsea.rs bez wad zlokalizowanych; blokuja braki pomiarowe.

ZMIANY/COMMIT: ten plik 03-final-control.md; brak zmian w kodzie
TESTY: jak wyzej (m06b1: 14/14 ok; logi r1: 1436/0, EXIT=0)
BLOKADY: M16/M17 przezywaja; brak weryfikatora Python
RUNDY: Final Control po rundzie 1/5; kolejna runda 2/5
NASTEPNY KROK: Operator (to samo ID): (a) wygenerowac z webu wektory cap 11/12/13 (mapa losowa jak wyzej, np. seed LCG 12345 it=3 i mapa z roznica 11 vs 12) do web-boundary.json + test; zabic M16/M17; poprawic 9.2; (b) niezalezny weryfikator Python + wynik w runie; potem Evaluator i Final Control.
KOLEJNOSC wzgledem origin/rust-port/parity-v2 (=db102531): bf5e7ad1 jest 2 commity ponad db102531 (deb8055e, bf5e7ad1); integracja DOPIERO po PASS, rebase/merge na aktualny parity-v2.
DEPLOY/PUSH: NIE WYKONANO


---

# Final Control r3 (baza 5f651052)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1
GOAL: Port 6 symboli M06B1 (gen-helpers.ts 4649-4939, pin edb8fb56) do landsea.rs.
ZMIANY/COMMIT: ocena 5f651052 (nie pushowany). Diff do db102531: tylko dokument M06B1, katalog runu, landsea.rs, derived.rs (dopisek), mapgen-coast.json (nowy, bez zmian w r3), tests/p6_m06b1_*. Zero zmian istniejacych testow, Cargo.lock niecommitowany, `git diff --check` czysty.
TESTY (odtworzone samodzielnie): fmt EXIT=0; clippy --all-targets -D warnings EXIT=0; cargo test --offline --no-fail-fast EXIT=0, 1441 passed / 0 failed. Weryfikator Python verify-m06b1-r3.py: 0 ROZBIEZNOSCI, EXIT=0. check-prefix: wszystkie kategorie prefiksem (ocean 330, purge 228->278, trim 80->130, finalize 420->520, thicken 296->396, flatten 88->138, maps 530->580), stats identyczne.
Wlasne mutanty nakladki na kodzie 5f651052 (usuniecie resetu nakladki): landsea.rs:2013 (clear_hex_to_laka_with_river, Q) ZABITY przez purge_relief_valley_water_matches_web; :2218 (pierscien thicken, N) ZABITY przez thicken_coast_and_smooth_inlets_matches_web; :2273 (flatten, L) ZABITY przez flatten_false_coastal_river_notches_matches_web. Plik przywrocony (cmp). mut-results-m06b1-r3.json: 31 mutacji, 28 zabitych, 3 przezyte (M12/M19/M20) rownowazne (dowody z r2 zweryfikowane).

ROZSTRZYGNIECIE ZARZUTOW:
1. Nakladka na wodzie: ODDAL (naprawione r3; 50 map, M29-M31 oraz moje Q/L/N zabite, test p6_m06b1_overlay).
2. Sprzecznosci dossier: ODDAL (§6 ma pomiar, §9.2 zamkniete, brak fraz "NIE zmienia wyniku"/"Przezyly (5)").
3. Prefiks wektorow: ODDAL (potwierdzony niezaleznie na c92ba394 vs 5f651052).
4. Cienkie pokrycie capu: ODDAL (10 map rozroznialnych, test Rust na jawnym limicie 11/12/13 przez thicken_coast_and_smooth_inlets_with_passes; M15/M16/M17 zabite).
5. Niezaleznosc weryfikatora/oracle = wektory weba: ODDAL (zalozenie: referencja to wektory z pinu weba wg dispatchu; luka nakladki zamknieta, sabotaz weryfikatora wykrywa brak resetu 30/8/100).
NAPRAW: brak. DO DECYZJI CZLOWIEKA: brak.

BLOKADY: brak. Uwaga: dryf po pinie (§4) bez zmian, osobny temat REPIN-DELTA.
RUNDY: 3/5
KOLEJNOSC INTEGRACJI: SHA koncowy do integracji = commit z tym plikiem (nad 5f651052; kod = 5f651052). Baza db102531; origin/rust-port/parity-v2 = cb57e479 jest 15 commitow dalej; orkiestrator rebase/cherry-pick na aktualny parity-v2 i powtorzenie bramek.
NASTEPNY KROK: integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
