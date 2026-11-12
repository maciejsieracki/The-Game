STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-STAN-ULEPSZENIA-Q1
GOAL: Warstwy ulepszen terenu i forty/posterunki w PlayableState; producent ulepszen jako Provided w power_raw_for_owner; forty w terytorium i wspolnej granicy; wektory z pinu (>=150) na PlayableState.
ZMIANY/COMMIT: oceniany SHA adcb0694a (obrona Operatora r2) na 80e365169 (Operator r1) na bazie da50d1753. Ancestry: da50d1753 -> 80e365169 -> adcb0694a (merge-base --is-ancestor: TAK, TAK). Allowlista: playable.rs, turn_war_inputs.rs, testy p6_wire_war_{epoch,inputs,pop}.rs (tylko literaly + 1 asercja wymagana dispatchem), nowe p6_stan_ulepszenia{.rs,_gen.mjs,_vectors/}, runs/**. Brak zmian w gra/, data/, Cargo.toml/lock, brak #[ignore], pola serde(default)+skip_serializing_if. Brak push.
TESTY: NIE ZMIERZONO przeze mnie: df / = 479 MB wolnego (inne przebiegi zajmuja dysk); cargo build niemozliwy bez zagrozenia pozostalym przebiegom. Bramki (fmt, clippy -D warnings, --lib 88/88, p6_stan_ulepszenia 10/10, p6_power_*, p6_wire_war_*) opieraja sie WYLACZNIE na raportach Operatora/Obrony, niezweryfikowane przez FC. Zmierzone samodzielnie: generator p6_stan_ulepszenia_gen.mjs uruchomiony w node na pinie 07d2fbd72 (git archive gra/src gra/data) daje wektory BAJT W BAJT identyczne z zacommitowanymi vectors.json; extracted_sha256 = 3cb3f155...; 164 przypadki, 143 niezerowe, 112 z fortami. Przegladem kodu: wiring (turn_war_inputs.rs) zgodny z opisem, test state_vectors_from_pin_match_wiring porownuje z wartoscia weba, nie z producentem.
BLOKADY: patrz werdykt zarzutow (NAPRAW #3).
RUNDY: 1/5 Operator + obrona; FC FAIL -> runda 2 dla Operatora (ten sam ID).
NASTEPNY KROK: Operator r2 (HAIKU) domyka zarzut 3, potem Evaluator/FC.
DEPLOY/PUSH: NIE WYKONANO

## Werdykt zarzutow Evaluatora

1. Brak wektorow pinu na PlayableState (>=150): ODDAL. Obrona dostarczyla generator wykonujacy kod weba z pinu (strażnik SHA-256) i 164 przypadki na PlayableState; odtworzone przeze mnie bajt w bajt.
2. Testy tautologiczne: ODDAL. state_vectors_from_pin_match_wiring porownuje z oczekiwaniem z node (pin), stare testy zostaly jako spojnosc. Reszta (ulepszenia_layers_match_producer_on_same_inputs, fort_adds_territory_nodes_for_its_owner) pozostaje tautologiczna, ale nie jest juz jedynym dowodem.
3. Fort a wspolna granica bez dowodu z pinu: NAPRAW. Dispatch wymaga jawnie "nowe przypadki z fortami" na wektorach shared_border (istnieje generator tests/p6_wire_war_pop_vectors/p6_wire_war_pop_gen.mjs + shared_border.json, wiec przypadki z pinu sa wykonalne). Obrona sama przyznaje brak i oczekiwanie "z reguly weba", nie z wykonania pinu. territory_nodes_from_state ma wlasna, osobna konwersje fortow (filtr contested_useless, promien fort_node_as_city_node) nieobjeta wektorami pinu (wektory ulepszen idą sciezka fort_nodes_from_state). Test fort_changes_shared_border_pairs to jedna recznie zbudowana sytuacja z oczekiwaniem wyprowadzonym z reguly. Operator nie wykonal STOP/ABC, wiec nie jest to odlozone zgodnie z dispatchem. Wymagane od Operatora: rozszerzyc generator shared_border o przypadki z fortami (fort/posterunek, owner wlasny/obcy, contested_useless, para zmieniajaca sie przez fort) wykonane z pinu i dodac test wektorowy na PlayableState (>= kilkadziesiat przypadkow, w tym pary z/bez wplywu fortu), oczekiwanie z node.
4. Odstepstwa: heks poza mapa: ODDAL (145 heksow offMap w wektorach + off_map_layer_contributes_nothing). Duplikaty wpisow improvements ("ostatni wygrywa"): ODDAL (stan z weba to slownik po (q,r), duplikat nie wystepuje; zachowanie opisane w kodzie).
5. Provided(0.0) bez wektora pinu: ODDAL (21 wektorow z wynikiem 0 wg pinu przechodzi jako Provided(0.0); zmiana asercji ExplicitZero->Provided(0.0) wynika wprost z dispatchu: usunac ulepszenia z ExplicitZero).
6. Bramki odtworzone: bez zarzutu, ale NIE_ZMIERZONO przez FC (patrz TESTY).

## DO DECYZJI CZLOWIEKA
- Rzadka siatka weba (316 z 361 heksow) vs prostokatna PlayableMap: czy PlayableMap ma niesc dziury/rzadkosc? Wektory stanu uzywaja mapy 16x16 bez dziur, wiec ten rozjazd nie jest pokryty; wymaga decyzji o reprezentacji (nie blokuje rundy 2).
- Pelny cargo test (3140) - runda integracyjna, po PASS.
