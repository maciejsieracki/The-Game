STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T1-MODEL-UI
GOAL: model doktryny grupy (GroupDoctrine, ensure_group_meta, set_group_doctrine) bez UI
ZMIANY/COMMIT: oceniono 13fc99862 (baza 760be5187); allowlista OK (model.rs, mod.rs +1, p6_k5doc_t1.rs, _gen.mjs, vectors.json, 01-operator-r1.md); brak gra/, Cargo.lock, renderer/
TESTY (Evaluator, CARGO_TARGET_DIR poza repo): fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --test p6_k5doc_t1 EXIT 0 (13/13, 0 ignored); cargo test --lib EXIT 0 (126/126). Mutacja wlasna (auto_play = true zawsze) -> 3 testy FAIL; plik przywrocony (cmp OK). Pelne cargo test --all-targets NIE wykonane (dysk 3-6 GB < 8 GB).
BLOKADY: brak blokad kodu; pelny test --all-targets do wykonania w FC/integracji po zwolnieniu dysku
RUNDY: 1/5
NASTEPNY KROK: Obrona (Haiku), potem Final Control; FC uruchamia pelny cargo test --all-targets

Weryfikacja z pinem 07d2fbd72: GroupDoctrine :1938 (5 wariantow, zgodne), _ensureGroupMeta :17586-17593 (domyslnie steady/autoPlay true, nie nadpisuje), _setGroupDoctrine :17864 (manual -> autoPlay false, reszta true). Zgodne.

ZARZUTY (nieblokujace):
1. Pin nie ma walidacji (przyjmuje typ GroupDoctrine); UnknownDoctrine i napisowy set_group_doctrine to dodatek Rust wg dispatchu, bez odpowiednika w webie - zapisac jako decyzje techniczna w REJESTR-RUST.md.
2. Test wektorow sprawdza tylko dlugosc skrotow (64 znaki), nie przelicza ich; zgodnosc z pinem zalezy od ponownego uruchomienia p6_k5doc_t1_gen.mjs poza cargo. Brak testu wykrywajacego dryf wektorow wzgledem generatora.
3. GroupDoctrineMeta ma tylko doctrine/auto_play; formation, rallyCol/Row, kolejka i efekty uboczne _setGroupDoctrine (17870-17929) poza zakresem - #264/K5EXEC musi dopisac; set_group_doctrine nie jest rownowazne _setGroupDoctrine (modul to jawnie mowi).
4. Wiele kopii enumu GroupDoctrine w repo (dlug ujednolicenia, poza tematem).
5. Uchybienie proceduralne operatora: dysk niezmierzony przed bramkami/mutacjami (sam zglosil). Bramki odtworzone przeze mnie niezaleznie.
6. Modul bez wolajacego w produkcji (tylko testy) - oczekiwane do #264; wpisac jako NIEPODPIETE.
