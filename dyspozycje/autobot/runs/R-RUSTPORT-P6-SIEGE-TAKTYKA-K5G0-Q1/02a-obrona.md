STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5G0-Q1 (K5g0: resolveAutoBatchPhase), obrona Operatora po ocenie Evaluatora r1
GOAL: Odpowiedzieć na każdy zarzut Evaluatora (0b531e224, 02-evaluator.md): PRZYJMUJĘ z dowodem albo ODRZUCAM z dowodem.
ZMIANY/COMMIT: brak zmian kodu w obronie. Kod: 6469c7d12 (port + test + wektory). Raport Operatora: df1520d33. Commit obrony: patrz sekcja DEPLOY/PUSH (zapisany lokalnie, bez push). Allowlista: tylko dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-K5G0-Q1/02a-obrona.md. Baza 46c42deab jest przodkiem kodu (sprawdzone: git merge-base --is-ancestor).
TESTY: w obronie NIE uruchamiano cargo (brak zmian kodu; wolne miejsce na / = 5.6 GB, poniżej progu 8 GB dla bramek Rust). Dowody zarzutów wykonano przez git show i node (patrz niżej). Bramki z Operatora i Evaluatora (fmt, clippy, cargo test --lib 49, end 8, endcheck 9, breach 15, walk 7, autophase 2) pozostają wynikiem ich raportów, nieodtworzonym w tej rundzie.

ODPOWIEDZI NA ZARZUTY

1. Nota: brak pomiaru pokrycia linii/gałęzi narzędziem (NIE_ZMIERZONO).
   Decyzja: PRZYJMUJĘ jako notę. Potwierdzam, że llvm-cov/V8 coverage nie zostało uruchomione; liczniki kategorii (attack:ok 497, blocked:hold 236, blocked:move-prefix 317, move:ok 622, hold:copy 1816, NaN/Inf hp 367, NaN/Inf współrzędne 429, occupies:false 970, duplikaty zamiarów 1381, pusty targetId 811, filtr roster 2571) są wyprowadzone z wejść i wyjść, nie z instrumentacji. Nie zmieniam kodu: kryterium (1) brzmi „pokrycie gałęzi (liczniki w raporcie)”, a liczniki są w raporcie. Dowód skuteczności testów: mutacje z raportu Evaluatora (wyłączenie bariery occupies, zmiana warunku ortogonalności, filtr pustego targetId, prefiks move->hold) wywołują niepowodzenie testów.

2. Nota: mutacja usuwająca `!t.routed` w target_available przeżyła; zarzut: to nie jest luka testu.
   Decyzja: ODRZUCAM (dowód równoważności). Kod src/domain/siege_tactics_autophase.rs, w 6469c7d12:
   - `live` jest budowane wyłącznie z jednostek, dla których `outside_live_roster(unit)` jest fałszywe (`live.insert` po filtrze), a `outside_live_roster` zawiera `unit.routed`.
   - `target = live.get(id)` zwraca więc wyłącznie jednostki z `routed == false`.
   - Zatem warunek `!t.routed` w `target_available` jest zawsze prawdziwy dla każdej wartości `Some(t)`, a usunięcie go nie zmienia żadnego wyjścia. Mutant jest równoważny; żadna sekwencja wejść nie rozróżnia obu wersji.
   Warunek zostawiam celowo: odzwierciedla web (sprawdzenie routed przy celu) i jest tanią asekuracją przy przyszłej zmianie filtra `live`.

3. Nota: test porównuje -0 i 0 przez `==`, znak zera nie jest weryfikowany; web też go nie rozróżnia (JSON).
   Decyzja: PRZYJMUJĘ fakt, ODRZUCAM jako blokadę. Zmiana kodu nie jest potrzebna, bo znak zera jest nieobserwowalny po stronie webu i w wektorach:
   - node -e: String(-0) = "0", JSON.stringify([-0]) = "[0]", `${-0},${0}` = "0,0", JSON.stringify({c:-0}) = {"c":0}. Klucz kafelka `col + ',' + row` jest więc identyczny dla -0 i 0.
   - Wektory (2914 przypadków, pobrane przez git show 6469c7d12:.../vectors.json) nie zawierają literału -0 (sprawdzone regexem na surowym pliku: false). JSON nie może przenieść znaku zera, więc test nie ma czego weryfikować w tym formacie.
   - Port normalizuje -0 do 0 w kluczu (`js_bits`), zgodnie z web. Parytet bez wpływu.

4. Nota: moduł nie jest wołany z niczego i nie ma zależności do W8; brak #[ignore] i oslabionych asercji.
   Decyzja: ODRZUCAM jako zarzut blokujący; to zgodne z dispatchem (NIE wiąż z pętlą tur, K5g/K5 poza zakresem).
   Dowody (git grep w 6469c7d12):
   - `resolve_auto_batch_phase` występuje poza modułem i testem: 0 trafień (exit 1). Wiązanie celowo nie wykonano.
   - `ignore` w p6_siege_tactics_autophase.rs oraz siege_tactics_autophase.rs: 0 trafień.
   - Asercje: test wektorowy używa assert_eq/assert/assert! z pełnym porównaniem liczby i pozycji rozstrzygnięć (same_resolution); test bariery sprawdza blocked i długość ścieżki. Nie ma osłabienia (brak `assert!(true)`, brak pomijania przypadków; gałęzie kategorii wymuszone przez assert na cat > 0).
   - Testy end/endcheck/breach/walk nie zmieniły się: diff 46c42deab..6469c7d12 dotyka wyłącznie plików K5g0 (siege_tactics_autophase.rs, p6_siege_tactics_autophase*.rs, vectors.json, mod.rs +1 linia rejestracji, 1 wiersz P6-SIEGE-TAKTYKA.md). Testy siege_tactics_* bez zmian.

WERYFIKACJA DODATKOWA (ta runda)
- Liczba przypadków w vectors.json z 6469c7d12: 2914 (>= 300).
- git diff --stat 46c42deab 6469c7d12: 6 plików, wszystkie w allowliście dispatchu.
- Brak gra/, origin/main, WERSJE.md, Cargo.toml, Cargo.lock w diffie.

BLOKADY: brak blokad kodu. Otwarte tylko: NIE_ZMIERZONO (pokrycie linii/gałęzi narzędziem, nota 1); bramki Rust nieodtworzone w tej rundzie z powodu miejsca na dysku (5.6 GB < 8 GB); wiązanie z pętlą tur poza zakresem K5g0.
RUNDY: 1/5 (Operator, obrona po Evaluatorze r1); ostatni werdykt Evaluatora: PASS-WITH-NOTES.
NASTĘPNY KROK: Final Control (Sonnet) na 6469c7d12 + df1520d33 + commit obrony; orkiestrator decyduje o integracji po FC. Brak integracji w tym kroku.
DEPLOY/PUSH: NIE WYKONANO (brak push; commit obrony tylko lokalnie w worktree wf_93861edb-ec5-3).
