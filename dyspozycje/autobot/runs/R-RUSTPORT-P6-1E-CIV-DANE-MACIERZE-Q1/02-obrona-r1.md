STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-1E-CIV-DANE-MACIERZE-Q1
ROLA: Operator (obrona), runda 1/5, baza = commit Operatora 99a83afe

ZARZUT 1 (civ_bonuses.rs poza allowlista Kod:) - ODRZUCAM jako naruszenie; zglaszam do decyzji orkiestratora opcje (a).
Dowody:
- 00-dispatch.md, ZAKRES: "P6.1D ma juz prywatny `matrix_param` - zastap go pelnym portem `civMatrixParam` z civ-matrix.ts (koordynacja addytywna)". Prywatny matrix_param istnieje wylacznie w rust-port/engine/src/domain/civ_bonuses.rs (grep matrix_param w src/). Nie da sie go zastapic bez edycji tego pliku; dispatch nakazuje zmiane, a lista `Kod:` jej nie wymienia (luka allowlisty, nie samowola).
- Zmiana to delegacja: matrix_param -> civ_matrix::civ_matrix_param (-28/+7, usuniety zdublowany num_to_f64). Zero zmian zachowania: testy p6_1d_* przechodza bez zmian, 525 passed / 0 failed.
- civ_matrix.rs i civ_names.rs nie zaleza od civ_bonuses (grep -c civ_bonuses = 0), wiec cofniecie tego jednego pliku jest bezpieczne (opcja b), kosztem niespelnienia kryterium "prywatny matrix_param zastapiony" i zostawienia zdublowanej logiki.
- Rekomendacja: (a) dopisac civ_bonuses.rs do allowlisty. Kod nie zmieniony w obronie, wiec reszta weryfikacji Evaluatora (wektory, Python, symbole) pozostaje wazna.

UWAGA 2 (wynik grep literalow) - PRZYJMUJE: wynik w 03-grep-literaly.log.
UWAGI 3, 4 - bez zarzutu, bez zmian.

TESTY (surowe, pelne logi, ten katalog): gate-fmt-obrona-r1.log EXIT=0; gate-clippy-obrona-r1.log EXIT=0; gate-test-obrona-r1.log 525 passed, 0 failed, EXIT=0.
