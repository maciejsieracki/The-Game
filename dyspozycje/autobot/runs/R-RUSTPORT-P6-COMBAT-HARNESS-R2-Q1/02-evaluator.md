STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-COMBAT-HARNESS-R2-Q1
GOAL: wektory graniczne roll==hitPct, zera w zdarzeniach strzalow, recount w Rust
ZMIANY/COMMIT: oceniono d44296c02 (baza 3efeecfa6); allowlista OK (combat.rs bez zmian, tests/p6_combat_harness*, 01-operator-r1.md); Cargo.lock niecommitowany
TESTY (odtworzone przez Evaluatora): fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --lib EXIT 0; p6_combat_harness 2 ok; combat 7 ok; p6_ranged_damage_nan 7 ok; p6_repin_dystans_petla 3 ok; p6_repin_dystans_formulas 8 ok (wszystkie EXIT 0). Generator uruchomiony ponownie: vectors.json bajt-w-bajt identyczny (git status czysty) -> wektory z tekstu pinu, reprodukowalne.
MUTACJE: roll<hit_pct -> roll<=hit_pct w combat.rs:1184 (atakujacy) FAIL; to samo w :1217 (obronca) FAIL; roll < hit_pct-1e-12 w :1184 FAIL. combat.rs przywrocony (diff czysty).
Brak #[ignore], brak oslabionych asercji (usunieto tylko porownanie counts-z-pliku, zastapione recountem z progami >=20/>=20/>=10); porownanie pol bit-w-bit (to_bits, rozroznia +0/-0); brak zaleznosci od W8.
BLOKADY: brak
RUNDY: 1/5
ZARZUTY (nieblokujace):
1. GOAL (2) wymagal wektorow z -0 w zdarzeniach strzalow; w wektorach jest 0 takich zdarzen (shotsNegZeroAnyField=0). Operator uzasadnia nieosiagalnosc (hitPct w [15,75] lub NaN, damage>=1 lub +0 przy pudle, hp>0 wymagane do strzalu). Uzasadnienie przyjete po lekturze combat.rs:1175-1215, ale to argument, nie pomiar: pokrycie -0 w zdarzeniach = brak; +0 w targetHp pokryte (26 zdarzen). Asercja ==0 jest tylko sygnalizatorem zalozenia.
2. Liczniki just_below/just_above uzywaja tolerancji 1e-9 (nie scislego sasiedztwa ULP) - zawyzaja liczby "tuz"; nie wplywa na wykrywalnosc mutacji (potwierdzone mutacjami).
NASTEPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
