STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZLOZE-SYNC-MERGE-Q1
GOAL: ujednolicenie sync_relation_from_deals / sync_relation_status_from_deals
ZMIANY/COMMIT: oceniono 77a56332a (baza 6acb1d81b jest przodkiem). Diff: diplomacy.rs, turn_war_dipl_steps.rs, tests/p6_r7k7b_zloze_sync.rs, 01-operator-r1.md. Tylko allowlista, gra/ nietknięte, brak #[ignore]/#[allow] w diffie.
TESTY (odtworzone przeze mnie, rust-port/engine): fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; test --lib 114 passed; p6_r7k7b_zloze_sync 3 passed; p6_wire_war_dipl_steps 8 passed.
ZARZUTY:
1. (niski) Test przepięty tworzy Relation::new(0.0, 0.0, current); pin robi {...rel, status} i zachowuje trust/respect, a test tego nie sprawdza (brak asercji, że trust/respect zostają po sync). Zachowanie mutatora jest poprawne w kodzie (rel.status = target), ale nie jest pokryte.
2. (niski) Raport operatora twierdzi "asercje >=150 bez osłabienia" dla tego testu; asercje >=150 są w innym teście (linie 56-57), ten ma tylko changed>0. Nie jest to osłabienie (changed>0 było wcześniej), tylko nieścisły opis.
3. (niski) Test na wektorach pinu przestał pokrywać ścieżkę "brak relacji w stanie" (unwrap_or_default w mutatorze); wektory zawsze ustawiają relację. Na pinie getDiploRelation też zwraca domyślną; NIE_ZMIERZONO równoważności domyślnych wartości.
4. (informacyjny) dyspozycje/rust-port/NIEPODPIETE-MODULY.md:274 nadal wymienia usuniętą funkcję (poza allowlistą, do aktualizacji przez orkiestratora).
5. (informacyjny) Mapowanie 10 wołań pinu poza 24319 uczciwie oznaczone NIE_ZMIERZONO; nie wpięte, zgodnie z dispatchem. Brak jawnej zależności od W8.
Równoważność: predykaty (parties==pair, is_alliance, kind==Nap, wojna no-op, sojusz > NAP) zgodne z pinem main.ts:22832; testy behawioralne na wektorach wykonanych z pinu (generator + SHA), nie ręczne.
RUNDY: 1/5
NASTĘPNY KROK: Obrona operatora (zarzuty 1-3), potem Final Control
DEPLOY/PUSH: NIE WYKONANO
