STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ELIMINACJA-DEALS-Q2 (Evaluator r1)
GOAL: eliminate_owner w Rust czysci umowy, wojny wymuszone, tury wejscia w epoke, regularWarCapturedByPairKey, forcedWarWavesByPairKey, diplomacyPairMeta, diplomacyFactorLog jak pin 07d2fbd72.
ZMIANY/COMMIT: oceniany kod d81d79704 (baza fd517ea9a, przodek potwierdzony); raport operatora e0fc38a99. Diff w calosci w allowliscie (7 plikow; brak gra/, data/, WERSJE.md, Cargo.toml, mod.rs). Cargo.lock powstal przy moim buildzie i zostal usuniety (nie w commicie).
TESTY (odtworzone samodzielnie; rustc 1.97.0, node 22; CARGO_TARGET_DIR poza repo):
  - cargo fmt --check: exit 0
  - cargo clippy --all-targets -- -D warnings: exit 0
  - cargo test --lib: 94 passed
  - p6_eliminacja: 3 passed; p6_power_battle_acc 11; p6_power_acc_wiring 3; p6_r7k7b_zloze_sync 3; p6_wire_war_diplo 13 (wszystkie ok)
  - Regeneracja wektorow z pinu (git archive 07d2fbd72 -> node p6_eliminacja_gen.mjs): SHA-256 identyczny 7015d306...406ca. Generator wykonuje tekst pinu (new Function) ze straznikiem SHA.
  - Brak #[ignore] w p6_eliminacja.rs; diff testu to dodatki (zadna asercja nie oslabiona); 180 przypadkow >= 150, 480 krokow.
  - Brak wolajacego w Rust i brak zaleznosci od W8: eliminate_owner nie jest wpiete do tur (zgodnie z dispatchem); nowe funkcje to czyste metody na istniejacych polach, zero nowych pol serde.
  - Porownanie z tekstem pinu main.ts:35418-35482: kolejnosc/zakres czyszczen zgodny (pending/cycle/rest/active x3 epoki, waves.delete(key) dla pasujacych aktywnych par, era-enter bronze/iron, regularWarCaptured po ownerA/ownerB, pair meta i factor log przez diploPairKeyHasOwner, activeDeals po stronach).
  - MUTACJE wlasne (kazda przywrocona, cmp OK), wszystkie daja FAIL testu wektorowego: M-a tylko napastnik, M-b tylko cel, M-c brak kasowania fal, M-d brak pending, M-e brak cycle, M-k brak rest, M-f brak iron-enter, M-g brak bronze-enter, M-h regularWar tylko ownerA, M-i klucz >=2 czesci (zamiast ==2), M-j umowy tylko pierwsza strona. Test jest wiec czuly na kazda galaz.
ZARZUTY (nieblokujace):
  1. Umowy w wektorach maja strony zawsze rosnaco i typ TreatyKind::Nap; nie sprawdzono, czy ActiveDeal w Rust normalizuje kolejnosc stron ani innych typow umow. Dla filtra po stronie nie ma to znaczenia (M-j wykryty), ale pokrycie jest wasniejsze niz pin (strony webowe moga byc w dowolnej kolejnosci).
  2. Stan ForcedWarPairState w tescie ma zerowe liczniki captured i start_turn None; czyszczenie ich nie dotyczy, ale test nie dowodzi, ze nie sa ruszane (nie ma obserwacji po stronie pozostalych par poza kluczem/napastnikiem/celem).
  3. Pola Rust bez odpowiednika w pinie eliminateOwner (ai_peace_requests, war_weariness, brake_phase) nie sa czyszczone: zgodne z pinem (grep eliminateOwner nie zawiera tych struktur), ale po wpieciu do tur wymaga to swiadomej decyzji; NIE_ZMIERZONO.
  4. Oblezenia (oblegajacyOwnerId, siegeBesiegerByCity, siegeTurnByCity, siegeAiStateByKey) i skarbce/pule AI/rejestry wiarygodnosci pozostaja NIE_ZMIERZONO (jawnie w naglowku eliminacja.rs i raporcie operatora).
  5. Operator dodal forcedWarWavesByPairKey ponad dispatch; uzasadnione tekstem pinu (waves.delete(key) w tych samych petlach), poprawne i pokryte mutacja M-c.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Obrona Operatora, potem Final Control
DEPLOY/PUSH: NIE WYKONANO
