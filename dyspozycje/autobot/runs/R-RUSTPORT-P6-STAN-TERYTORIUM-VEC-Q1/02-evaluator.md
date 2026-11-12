STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-STAN-TERYTORIUM-VEC-Q1
GOAL: wektory pinu 07d2fbd72 dla skladnika heksy_terytorium z fortami/posterunkami (+ remis builtAtTurn/seq) na PlayableState.
ZMIANY/COMMIT: oceniony 88dd74796 (baza 4d348e9ac). Diff = 4 pliki, wszystkie w allowliscie (test .rs, _gen.mjs, vectors.json, 01-operator-r1.md); src/ nietkniete; brak #[ignore]; Cargo.lock untracked (niezacommitowany).
TESTY (odtworzone przez Evaluatora, exit codes):
  - generator na swiezo wypakowanym pinie (git archive gra/src gra/data): exit 0, 240 przyp./720 sprawdzen, vectors.json IDENTYCZNY (diff) z zacommitowanym; extracted_sha256 zgodny. Kod weba wykonywany z tekstu pinu (extractFn); wrapper hexKeysWithinRadius odtworzony recznie, zweryfikowany z okolica.ts:66-80 (cache nie zmienia wartosci).
  - cargo fmt --check: 0. cargo clippy --lib --test p6_stan_ulepszenia_territory -D warnings: 0. cargo test --lib: 88 passed, exit 0. cargo test --test p6_stan_ulepszenia_territory: 2 passed, exit 0.
  - Mutacja (turn_war_inputs.rs:604 contested_useless -> None): oba testy FAIL; po przywroceniu src czysty. Test jest czuly na forty bezuzyteczne.
  - NIE_ZMIERZONO: cargo clippy --all-targets, pelny cargo test, testy sasiednie (border/ulepszenia) - dysk 2,9-3,5 GB wolnego (< 8 GB z dispatchu). Do rundy integracyjnej.
ZARZUTY (nieblokujace):
  1. Dispatch wymagal "remisu builtAtTurn rozstrzyganego po seq" dla heksy_terytorium. Operator zmierzyl na pinie, ze skladnik jest od kolejnosci niezalezny (statsTerritoryNodesForOwner = unia dyskow; kolejnosc tylko w territoryOwnerAt). Potwierdzone czytaniem main.ts:5657 / fort-territory.ts:199 (foundingNodesForOwner filtruje tylko owner i contestedUseless). Zarzut: 80 "przypadkow z remisem" to tylko test niezaleznosci od seq, nie regula remisu; ta regula (territoryOwnerAt/granica) pozostaje poza zakresem tego wektora - orkiestrator powinien potwierdzic, ze pokrywa ja p6_stan_ulepszenia_border (nie zweryfikowane tu).
  2. Wlasciciele wektorow to 1..3; wlasciciel 0 (gracz ludzki w webie, ownerIds zawiera 0) nie jest testowany. Logika identyczna, ryzyko niskie.
  3. Wejscie generatora jest syntetyczne (prostokat WxH, teren morze/las/rownina); brak map z dziurami w map.hexes (poza prostokatem sprawdzane tylko przez forty poza mapa, 47 przyp.). Akceptowalne.
  4. Asercja "reversed seq" to inwariant Rusta (bez lustra w webie); "no_order" ma lustro (expected_no_order). Dopuszczalne.
BLOKADY: brak.
RUNDY: Evaluator 1/5
NASTEPNY KROK: Final Control; pelny clippy --all-targets + cargo test na integracji.
DEPLOY/PUSH: NIE WYKONANO
