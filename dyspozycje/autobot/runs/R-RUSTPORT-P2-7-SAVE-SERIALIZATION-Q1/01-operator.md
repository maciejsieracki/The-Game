STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-7-SAVE-SERIALIZATION-Q1
GOAL: Skatalogować kształt zapisu web (edb8fb56) i porównać z serializacją rust-port/engine (parity-v2 9e33fc77); potwierdzić gap meta.forcedWarWavesByPairKey.
ZMIANY/COMMIT: nowy plik dyspozycje/rust-port/p2/P2-7-SAVE-SERIALIZATION.md; ten plik runu. Zero zmian w gra/**, zero kodu Rust, brak commita.
TESTY: nie uruchamiano cargo test (katalog oparty o odczyt plików na pinach; temat bez zmian kodu). Weryfikacja: git show na pinach, grep po drzewach, zliczenie kluczy builder (main.ts:30478-30674, 22 top-level, meta ok. 88 pozycji).
BLOKADY: brak. Notatka: save_load.rs/replay.rs nie są zadeklarowane w lib.rs ani domain/mod.rs (tylko #[path] w tests/); bridge.rs bez referencji.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium) adwersarzy katalog; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

---

## RUNDA 2/5 — OBRONA (Operator, Haiku 5.5 medium)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-7-SAVE-SERIALIZATION-Q1
GOAL: Skatalog kształtu zapisu web (edb8fb56) vs serializacja rust-port/engine (parity-v2 9e33fc77); potwierdzony gap meta.forcedWarWavesByPairKey.
ZMIANY/COMMIT: zaktualizowany `dyspozycje/rust-port/p2/P2-7-SAVE-SERIALIZATION.md` (§2 wiersze 3,7,8,9,16,17,18; §3; §5; §6; nowy §8). Zero zmian w `gra/**`, zero kodu Rust, brak commita.
TESTY: bez cargo test (temat odczytowy). Weryfikacja: `git show` na pinach, `git grep -ciE` po stemach, zliczenie kluczy: builder 22 top-level (8-spacjowe wcięcie, l.30478-30682), `meta` 94 pozycje (89 `klucz:` + 5 `klucz,`, l.30495-30671).
BLOKADY: brak. Pozostaje do P2.2: per-klucz status 92 kluczy meta, dla których trafienia grep (siege, wiarygod, relig, skarbiec, improvement itd.) nie zostały sklasyfikowane.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (adwersarz, runda 2), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

OBRONA:
- 1 -> PRZYJMUJE. Policzone: 94 pozycje w `meta` (89 z dwukropkiem + 5 skróconych: `savedAt`, `playerPracaPool`, `veteranEnemyEducationShown`, `negotiationSeq`, `clusterPlacement`). Poprawiono §3 i §6 oraz wiersz 18 (było "~88").
- 2 -> PRZYJMUJE. `rust-port/parity-v2:rust-port/engine/src/domain/playable.rs:103` `pub seed: u32` w `StartGameParams` (derive Serialize/Deserialize, playable.rs:90-91), zagnieżdżone w `PlayableState.params` (playable.rs:324). Status zmieniony na CZĘŚCIOWO; dodatkowo `ReplayLog.seed` (replay.rs:140). Usunięto z listy BRAK.
- 3 -> PRZYJMUJE. `PlayablePlayer.is_human: bool` (playable.rs:288, derive) -> `humanOwnerIds` = CZĘŚCIOWO. `activeHumanOwnerId` pozostaje BRAK z dowodem: `git grep -niE 'active_human'` i `'human_owner'` na `rust-port/parity-v2 -- rust-port` = 0 trafień.
- 4 -> PRZYJMUJE. Dodano do §5 `domain/playable.rs` (12 derive; `PlayableState` = DTO Tauri, eksport lib.rs:27-31) oraz typy-analogi z serde: `Relation`, `DiplomacyState`, `ActiveDeal`, `DiploPairMeta`, `TradeRoute`, `BarbCamp`.
- 5 -> PRZYJMUJE. `DiploPairMeta` (diplomacy.rs:1189-1190, derive Serialize/Deserialize) to typ wartości mapy web `diplomacyPairMeta` (main.ts:8308 `Map<string, DiploPairMeta>`) -> CZĘŚCIOWO. Analogicznie `BarbCamp` (barbarians.rs:153, derive) dla `barbCamps` -> CZĘŚCIOWO. Sformułowanie "brak typu meta" zastąpione: "brak kontenera meta".
- 6 -> PRZYJMUJE CZĘŚCIOWO. Dodano §8 z dowodami zerowymi (0 trafień `git grep -ciE` dla: explored, auto_march, planned_march, diplo_relation, force/forced war/wave, negotiat, fort_node, eliminated, veteran, looted_village, auto_manage, placed_improvement, active_human, human_owner, ai_research, city_built). Przy okazji skorygowano sam błąd: `tradeRoutes` (trade.rs:392 TradeRoute, derive) i `diploRelations` (diplomacy.rs:104 Relation, :1611 DiplomacyState, derive) -> CZĘŚCIOWO; `gracze` -> CZĘŚCIOWO (PlayablePlayer). ODRZUCAM w części: dla stemów niezerowych (siege 16, wiarygod 25, relig 16, skarbiec 40, barb_camp 32, improvement 147 itd.) NIE twierdzę BRAK z dowodem — oznaczono jako "do potwierdzenia per klucz w P2.2" (§3, §8). Dowód zerowy nie obejmuje tych kluczy.
