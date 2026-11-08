STATUS: FAIL (niedomkniete; runda 4 bez bramek runtime, patrz BLOKADY)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-AUTOIMPROVE-MUTANTY-Q1
GOAL: Runda 4/5 (baza 12d8cf5fd = Operator r3, odtworzona). Odpowiedz na zarzuty FC r3. Wynik: KILLED 107/119 (bez zmiany). Kryterium 119/119 lub dowod NIE spelnione.
ZMIANY/COMMIT: SHA commita tej rundy: patrz sekcja DEPLOY/PUSH. Allowlista: dyspozycje/autobot/runs/R-RUSTPORT-REPIN-AUTOIMPROVE-MUTANTY-Q1/01-operator-r4.md, dyspozycje/rust-port/p6/P6-REPIN-AUTOIMPROVE.md (sek. 11.6). Kod `rust-port/engine/src` NIE zmieniony. Testy i tools NIE zmienione. Brak nowych #[ignore].
TESTY: NIE_ZMIERZONO w tej rundzie. Powod: wolne miejsce na dysku 1 531 908 096 B (~1,43 GiB) w chwili startu, na progu 1,5 GB z dispatchu i ponizej 2 GB (CLAUDE.md zasada 5/7: start Rust wymaga >= 8 GB, przy < 2 GB wstrzymac nowe starty). Nie uruchomiono cargo fmt/clippy/test, nie uruchomiono mutantow, nie zmierzono baseline. Ostatnie zmierzone wyniki pozostaja z r3 (commit 12d8cf5fd, logs/mut-result-r2-*.txt).
BLOKADY:
- Zarzut 1 (status PASS-WITH-NOTES zawyzony): PRZYJMUJE. Raport r3 mial status PASS-WITH-NOTES mimo 12 pozycji niedomknietych. Poprawny status: FAIL/niedomkniete. Poprawka: ten raport i sek. 11.6 w P6-REPIN-AUTOIMPROVE.md.
- Zarzut 2 (zadanie 5, N07/N29/N42 bez wektora i dowodu): NIE DOMKNIETE. N29: analiza kodu (nie dowod) - patrz nizej. N07 i N42: bez zmian, bez wektora i bez dowodu.
- Zarzut 3 (zadanie 3, N90 bez mapy celowanej): NIE_ZMIERZONO. Mapa nie zbudowana (wymaga uruchomienia weba i testu pick/roadplan = cargo). Derywacja r3 (nd==cap wymaga >=10 wejsc do miast) pozostaje hipoteza.
- Zarzut 4 (N57 otwarty po ~8000 probach): NIE_ZMIERZONO w r4. Brak wektora kz7 i brak dowodu nieosiagalnosci warunku fort-pending. Pozostaje OPEN.
- Zarzut 5 (N40, N71 NIE_ZMIERZONO; N71 zliczony jako dowod statyczny bez uruchomienia): PRZYJMUJE w zakresie opisu. N71 w podsumowaniu r3 byl wliczony jako EQUIVALENT (sek. 9.2) bez uruchomienia mutanta. Od r4 N71 jest w statusie "dowod statyczny, runtime NIE_ZMIERZONO (TIMEOUT x2)". Nie zamykamy go w liczbie 119/119 bez akceptacji FC. N40: rownowaznosc statyczna z sek. 10.5 (r5) - nieuruchomiona, runtime NIE_ZMIERZONO.
- Zarzut 6 (bramki niepelne, brak baseline): PRZYJMUJE jako fakt. Bramki r3: tylko p6_repin_autoimpr_terrain i p6_8i_pick. Baseline pozostale binarki: NIE_ZMIERZONO. Nie uruchomiono w r4 z powodu dysku.
- Zarzut 7 (weryfikacja FC cargo clippy/test p6_8i_pick): NIE_DOTYCZY do Operatora (zadanie dla FC). Odnotowano: FC zweryfikuje na wolnym dysku lub na innym hoscie.
- N29 (analiza, NIE dowod): zarzut "dowod sek. 10.4 nie przyjety". Hipoteza sek. 10.4 (bramka wlasnosci heksu odrzuca heks obcego fortu) w kodzie wyglada tak: mutant (`city_phases.rs:320`, `n.owner_id != opts.owner_id` -> false) dodaje do `fort_horse_extra` zloza konia z kola OBCEGO fortu/posterunku, przypisane do najblizszego wlasnego miasta. Dalej `hex_allows_key` (`city_phases.rs:118-119`) zwraca wtedy tylko `stadnina`, a kwalifikator stadniny wymaga `in_player_territory` (`improvement_build.rs:1250-1251`, `territory.rs:317-327`). Wniosek: mutant zmienia wynik tylko dla heksu, ktory jest terytorium gracza. Luka do domkniecia (dlatego OTWARTE): (a) ring miasta `territory_radius_pin(CityNode::city(c.pop))+1` z opts.cities a promien wezla terytorium z node.pop - rowne tylko przy zgodnosci populacji snapshotu; (b) sciezka `pending_undo` (`improvement_build.rs:~1196`) zwraca `true` przed bramka terytorium; (c) `radius_hexes` (`city_phases.rs:356, 464`) - uzycie do `lesne_min_spelnione` liczy heksy z `hex_layers_contain`, nie `hex_allows_key`, wiec obce zloze nie wchodzi do licznika tylko gdy nie ma warstwy. Do sprawdzenia runtime: F10 `kz-fort-obcy-konie` przezywa, co zgadza sie z hipoteza; potrzebny wektor z `pending_undo` lub populacja != snapshot.
- Dysk: start 1 531 908 096 B wolne (~1,43 GiB). Tylko przeglad kodu i dokumentacja w tej rundzie.

TABELA STANU (bez zmian wzgledem r3, po korekcie statusu):
- KILLED 107: 103 z r1 + N85, N100, N56, N58.
- Dowody statyczne (do akceptacji FC, runtime czesciowo): N20, N47, N81, N89, N93 (runtime SURVIVED zgodny z dowodem); N71 (runtime NIE_ZMIERZONO, TIMEOUT x2).
- OTWARTE bez wektora i dowodu: N07, N29 (analiza sek. 10.4 - nie dowod), N40 (dowod statyczny sek. 10.5, nieuruchomiony), N42, N57, N90.
- Liczenie: 107 zabitych + 6 dowodow/statycznych (N20, N47, N71, N81, N89, N93) + 6 otwartych (N07, N29, N40, N42, N57, N90) = 119.

RUNDY: 4/5 (kolejna 5/5 = OSTATNIA; po niej FAIL -> eskalacja do wlasciciela z decyzja o akceptacji niedomknietych pozycji).
NASTEPNY KROK: (1) Evaluator i Final Control na commicie tej rundy; (2) decyzja orkiestratora: czy dysk >= 8 GB przed startem runda 5 (cargo); (3) runda 5: N90 (mapa celowana, >=10 miast na sciezce), N57 (celowany fort-pending), N07/N42/N29 (wektor z pending_undo lub populacja != snapshot, albo dowod), N40/N71 (runtime z dluzszym limitem), bramki z baseline. Jesli niemozliwe - eskalacja do wlasciciela z lista 6 otwartych pozycji (ABC: akceptacja ryzyka vs. dalsze prace).
DEPLOY/PUSH: NIE WYKONANO (commit lokalny, detached; push zakazany przez dispatch).
