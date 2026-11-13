STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-WOJNA-Q1
GOAL: przeniesienie testow wektorowych r2 (hak P4, kolejnosc D4/D8, S3) na baze parity 003d53f97
ZMIANY/COMMIT: c3a711cc1 (potomek 330c6a9ac, potomek 003d53f97; ancestry TAK, historia liniowa). Pliki: 3 testowe + 01-operator-r2/r3 + 02a-obrona-r3. src/, gra/, Cargo.* nietkniete.
TESTY: fmt --check EXIT 0; p6_cred_wojna_vectors 4 passed (FC samodzielnie). Pozostale bramki i pelny cargo test (3258/0/1) potwierdzone przez Obrone/Evaluatora, nie powtorzone przez FC.
BLOKADY: patrz decyzje.

Zarzuty:
- Z1 ISTOTNY (r3 nadpisal testy z 003d53f97, m.in. stary_zapis_bez_klucza_last_war...): POTWIERDZONE (grep: test jest w 003d53f97, brak w c3a711cc1). Wynika z dispatchu r3 (przenies na te same sciezki), nie z wady Operatora. DO DECYZJI CZLOWIEKA: A) przywrocic 4 pliki z 003d53f97 i dodac r2 pod nowymi nazwami (rozszerzenie allowlisty, runda r4) - REKOMENDOWANE; B) zaakceptowac utrate.
- Z2 SREDNI (kolejnosc D4/D8 przez prymitywy rejestru): ODDAL (jawny zakres; osobny temat harnessu pipeline).
- Z3 DROBNY (nieaktualna BLOKADA): ODDAL - poprawione w 01-operator-r3.md.
- Z4 DROBNY (N1/N2 niemodelowane): ODDAL (zakres zadeklarowany).
- Z5 DROBNY (alias umowa_handlowa): ODDAL (decyzja wlasciciela w dispatchu).
- Z6 (pelny test): ODDAL - Obrona zmierzyla 3258/0/1.
NAPRAW: brak.
RUNDY: 3/5
NASTEPNY KROK: decyzja Z1 (A -> Operator r4; B -> integracja)
DEPLOY/PUSH: NIE WYKONANO
