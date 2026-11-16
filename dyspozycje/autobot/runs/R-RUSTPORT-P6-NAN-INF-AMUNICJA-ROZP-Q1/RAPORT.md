STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-NAN-INF-AMUNICJA-ROZP-Q1
GOAL: Rozpoznanie (tylko odczyt, bez kodu) zachowania pinu 07d2fbd72 i Rust (origin/rust-port/parity-v2 = 3a8f068f6) dla NaN / Inf / ułamków w amunicji (resolveAmmo) i w maxRounds; odpowiedź na 4 pytania z dispatchu tabelami wejście → wynik z plik:linia.
ZMIANY/COMMIT: allowlista: dyspozycje/rust-port/p6/NAN-INF-AMUNICJA-ROZPOZNANIE.md (NOWY) oraz dyspozycje/autobot/runs/R-RUSTPORT-P6-NAN-INF-AMUNICJA-ROZP-Q1/RAPORT.md (NOWY). Bez zmian kodu. Commit jawnym git add dwóch ścieżek, bez push do parity-v2.
TESTY: NIE_ZMIERZONO. Nie uruchomiono pina (node / harness) ani cargo test. Wszystkie wnioski wynikają z czytania kodu (git show, plik:linia) i z analizy danych units.json przy pinie (python3 -I, zliczenie 75 rekordów).
BLOKADY: brak blokady. Uwaga: HEAD worktree (8265bbec0) nie jest potomkiem parity-v2 (3a8f068f6). Kod Rust czytano z origin/rust-port/parity-v2, zgodnie z dispatchem.
WYNIKI (skrót):
- Pin: produkcja nie podaje NaN / Inf / ułamków. Amunicja: 18 jednostek 2…20, 57 jednostek `—` → 0 (combatStatField combat.ts:178-183, ?? null :225). maxRounds: 30 (battleScene.ts:20535, manualBattle.ts:1063) albo 200 (tw_v3).
- Rust: i64 (ammo) i u32 (maxRounds) nie reprezentują NaN / Inf / ułamków. Logika pętli zgodna 1:1 dla wartości całkowitych (p6_combat_harness, 700 przypadków).
- Rozjazdy przy konwersji `as`: ammo 0,5 (pin 1 strzał, Rust 0) i 2,5 (pin 3, Rust 2); maxRounds NaN (pin bez limitu, Rust 0 rund).
- Rust resolve / resolve_combat nie mają ani amunicji, ani maxRounds (inny model, siege_tactics_instant.rs:21-24).
- Ryzyko zawieszenia (statycznie): maxRounds NaN / Inf + hitPct NaN. Nieosiągalne w produkcji.
- Brak produkcyjnego wołającego resolve_ranged_phase / resolve_melee_phase: rozjazd nieobserwowalny w grze do czasu podpięcia.
- Obserwacje w pinie: resolveAmmo sprawdza '---', dane mają '—' (gałąź martwa, bez skutku); 4 jednostki (Drużynnik, Thorakites, Evocati, Gwardzista z champi) mają missileAttack > 0 i amunicję `—`, czyli flagę dystansową bez strzałów.
NASTĘPNY KROK: orkiestrator decyduje regułę konwersji JS → i64 / u32 (propozycja w §4 dokumentu, decyzja techniczna, zapis w REJESTR-RUST.md) przed podpięciem ranged_phase do produkcji. Potem nowy temat na wektory V-A*, V-M*, V-K* (§5 dokumentu) z generatorem zawierającym NaN / Inf / ułamki i twardym limitem kroków dla V-M3. Pytań ABC do właściciela brak.
DEPLOY/PUSH: NIE WYKONANO
