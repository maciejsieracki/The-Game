STATUS: WYNIK-OPERATORA (oczekuje Evaluatora)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-2-GAMESTATE-CONTRACT-Q1
GOAL: Propozycja kanonicznego kontraktu `GameState` pokrywająca 15 modułów P2.1 i pola zapisu P2.7, z jawną listą punktów do decyzji (nie wybranych po cichu).
ZMIANY-COMMIT: Nowy plik `/home/user/The-Game/dyspozycje/rust-port/p2/P2-2-GAMESTATE-CONTRACT.md`. Zero zmian w `gra/**`, zero kodu Rust, brak commita (Operator nie integruje).
TESTY: Brak uruchomionych testów. Weryfikacja przez odczyt `git show` na pinach `edb8fb56` i `rust-port/parity-v2`. Potwierdzone wprost: `save.ts:116` (SAVE_VERSION=3), `manpower.ts:8,326,363,475`, `forced-war-waves.ts:247-262`, `combat.rs:438,443` (clamp 0.10–0.25, tylko Rust), `save_load.rs:34,138` (wersja 2).
BLOKADY: Brak techniczne. Ograniczenia: klasyfikacja 94 kluczy `meta` jest grupowaniem architektonicznym, nie weryfikacją per klucz; klucze oznaczone `?` (m.in. `budowaListaBiblioteka`, `clusterPlacement`, `exploredByHuman`) wymagają potwierdzenia w P2.3/P2.12. P2.9 przeczytany do linii 667 z 1807 (pozostała część to appendix per klucz; użyte sekcje §0–§6 były w zakresie odczytu).
RUNDY: 1/5
NASTEPNY KROK: Evaluator weryfikuje pokrycie 15 modułów (§3), 94 klucze meta (§4), zasadność INV-1…INV-6 oraz listę D1–D11 (§5) pod kątem ukrytych decyzji.

Najważniejsze ustalenia dla Evaluatora:
- Punkty decyzyjne: D1 (`forcedWarWavesByPairKey` w AI czy w dyplomacji), D2 (`activeHumanOwnerId`), D3 (`GameStateDto` vs `PlayableState` jako kanon), D4 (trzy typy właściciela, duplikat `babilon`/`babilonia`), D7 (web v3 vs Rust v2 bez migracji).
- Przykład z dispatchu „suma populacji miast == manpower pool” NIE istnieje w kodzie. Odrzucony; sprawdzona relacja to wzór per miasto `manpowerMax = ludki × manpowerNaLudka[epoka]`.
- Niezmiennik INV-4 (clamp strat) dotyczy modelu Rust, nie web, i jest oznaczony jako wymagający weryfikacji.

DEPLOY/PUSH: NIE WYKONANO