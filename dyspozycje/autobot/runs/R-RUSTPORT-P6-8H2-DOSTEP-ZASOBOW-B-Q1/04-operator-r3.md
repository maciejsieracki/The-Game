STATUS: PASS-WITH-NOTES (zakres domknięty dla 16 funkcji resource-access.ts; 3 pozycje zakresu z luką, patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8H2-DOSTEP-ZASOBOW-B-Q1
GOAL: P6.8H2 partia B, runda 3 (po FC r2 FAIL, `099296ace`): port `resource-access.ts` (16 funkcji) w `resource_access/active_access.rs`; wektory z pinu `91dc998a`; naprawa zarzutów FC 1–8.
ZMIANY/COMMIT:
- kod + testy + wektory + dokument tematu: `0b918c971` (SHA kodu).
- raport, logi `gate-*-r3.txt`, skrypty i surowe logi mutacji: commit tego raportu (SHA w `git log`, gałąź `p6-8h2-dostep-zasobow-b` wskazuje na niego lokalnie, bez push).
- allowlista zachowana; poza nią brak zmian. `Cargo.lock` (artefakt builda) usunięty, nie commitowany.
TESTY:
- `cargo fmt --check -p civ-engine` EXIT=0; `cargo clippy -p civ-engine --all-targets -- -D warnings` EXIT=0.
- `p6_8h2_active_access` 11/11; `p6_8h2_capital_labels` 11/11; `p6_8h_access` 13/13; `cargo test -p civ-engine` 1962 passed, 0 failed, EXIT=0 (r2: 1951).
- wektory: 8116 city, 1224 hex, 3960 unlock, 22 labelsUnlock, 900 par collation; `gen-vectors.sh 91dc998a` odtwarza pliki bajt-identycznie (md5 w dokumencie).
- mutacje `active_access.rs`: 29 mutantów, 26 KILLED, 3 SURVIVED = RÓWNOWAŻNE (M08, M21, M22; dowody w dokumencie).
- mutacje `capital_labels.rs` (tabele + `if let Some`): 7/7 KILLED. M13 na teście sprzed poprawki: SURVIVED (surowy log `mutacja-m13-bez-testu-wynik.txt`); z testem: KILLED.
- `git diff --cached --check`: czysto.
BLOKADY (jawne, nie domknięte):
- Z1 `computeEmpireLivestockUnlocks` nie portowane (brak w Rust); gałąź `compute` niezmierzona.
- Z6 `isForeignReligionDominant` nie portowane (brak `dominantReligion` w Rust); pozycja zakresu dispatchu.
- Z7 `placedImprovementsWithZlotoTradeGrant` port no-op bez wywołującego w Rust; web: 9 wywołań przez `placedImprovementsWithTradeGrants` (main.ts:5084).
- Z5 rozbieżność JS: klucz `constructor` (funkcja z `Object.prototype`) — web ukrywa złoże, Rust pokazuje etykietę; poza allowlistą (`mapgen/params.rs:1340`). Wyniki miast nieobjęte (test przechodzi).
- Duplikat `clear_city_culture_mix`: `resource_access.rs:319` bez wywołującego; produkcyjne `state.rs:546/581`.
ZAŁOŻENIA:
- Numer rundy: prompt wywołania podawał „Runda 1/5” i `01-operator-r1.md`, a dispatch (sekcja RUNDA 3/5, start z `099296ace`) — wykonano dispatch r3. Raport zapisany w `04-operator-r3.md`; `01-operator-r1.md` nietknięty.
- `sortLabels` (`localeCompare 'pl'`) przybliżone i zweryfikowane na uniwersum 30 etykiet (Z4).
- Pin wektorów `91dc998a` (`git archive gra`, bundle w katalogu tymczasowym, `gra/` nie budowane).
RUNDY: 3/5 (Operator r3). Dysk: target na `/dev/shm/p6-8h2-b`.
NASTĘPNY KROK: Evaluator (Sonnet) na `0b918c971`; FC decyzja o Z1, Z6, Z7 (zakres) i o duplikacie `clear_city_culture_mix`.
DEPLOY/PUSH: NIE WYKONANO
