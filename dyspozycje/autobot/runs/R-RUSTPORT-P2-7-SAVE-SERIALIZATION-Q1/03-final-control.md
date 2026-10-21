STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P2-7-SAVE-SERIALIZATION-Q1
GOAL: Katalog kształtu zapisu stanu gry web (edb8fb56) vs serializacja `rust-port/engine`
(`parity-v2` 9e33fc77), potwierdzenie gapu `meta.forcedWarWavesByPairKey`.

RUNDY: 1/5 (Operator → Evaluator 6 zarzutów — błędna liczba kluczy `meta` [94 nie ~88], błędny status
BRAK dla `seed`/`humanOwnerIds` [istnieją częściowo w `playable.rs`], pominięty `playable.rs` w
inwentarzu serializacji Rust, niespójne uzasadnienie dla `diplomacyPairMeta`, brakujący dowód dla
kilku wierszy BRAK → Obrona 6×PRZYJMUJE → Final Control 6×ODDAL, zweryfikowane niezależnie przez
`git show`/`git grep` na obu pinach).

ZMIANY/COMMIT: nowy plik `dyspozycje/rust-port/p2/P2-7-SAVE-SERIALIZATION.md`.

WYNIK: 22 top-level klucze zapisu web skatalogowane (`main.ts:30478-30682`). **Gap
`meta.forcedWarWavesByPairKey` POTWIERDZONY WPROST**: deklaracja `main.ts:2013`, zapis `:30634`,
odczyt `:38744`, serializer `forced-war-waves.ts:237`; kształt `Array<[pairKey, {nextWaveId, waves[],
history[]}]>`; w Rust ZERO odpowiednika (grep daje tylko false-positive „enforced"). `meta` ma 94
klucze (nie ~88 jak błędnie w rundzie 1), większość BRAK w Rust, kilka CZĘŚCIOWO
(`diplomacyPairMeta`→`DiploPairMeta`, barbCamps→`BarbCamp`). `seed` i `humanOwnerIds` mają CZĘŚCIOWO
(istnieją w `playable.rs` `StartGameParams`/`PlayablePlayer.is_human`, ale to DTO UI/Tauri —
`PlayableState` — nie `SaveSnapshot`/zapis gry). Serializacja Rust obecnie obejmuje tylko
map/civilizations/cities/units/turn/event_queue/rng (`GameStateDto`, `SaveSnapshot`, wersja v2 vs
web v3). `save_load.rs`/`replay.rs` nie są nawet zadeklarowane w `lib.rs` poza testami.

BLOKADY: brak. 92 z 94 kluczy `meta` celowo odłożone do per-pola klasyfikacji w P2.2 (zbyt duże na
jeden temat katalogowy, podobny wzorzec jak P1.16b→c→d→e→f).

NASTĘPNY KROK: integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
