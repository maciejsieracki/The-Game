STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-PRODUCER-ROZP-Q1
GOAL: Rozpoznanie producentow wpisow skarbca AI i puli Pracy (pin 07d2fbd72 vs Rust 1b8b67173), tylko odczyt.
ZMIANY/COMMIT: oceniono 482c64d3e (diff vs 1b8b67173: tylko 2 pliki z allowlisty, zero kodu). Ten plik: commit bez push.
TESTY: fmt/clippy/cargo test NIE URUCHOMIONO: diff vs baza nie zawiera zadnego pliku poza dyspozycje/, wiec bramki Rust sa niezmienione (NIE_ZMIERZONO). Zweryfikowano recznie ~35 cytatow pin/Rust (git show + sed).
BLOKADY: zarzuty merytoryczne (nizej).
RUNDY: 1/5
NASTEPNY KROK: Operator r2 poprawia zarzuty 1-4, Evaluator r2.
DEPLOY/PUSH: NIE WYKONANO

ZARZUTY
1. [BLOKUJACY, falsz faktyczny] Wiersz P-C i PR-7 twierdza, ze `siege_capital_plunder.rs:216-221, :366-371` obsluguje WYLACZNIE skarbiec, a puli Pracy "BRAK". Nieprawda: ten sam plik ma trait `get_praca_pool/set_praca_pool` (l. 59-60), transfer puli do zwyciezcy w galezi eliminacji (l. 224-228) i `set_praca_pool(old_owner, 0.0)` w galezi przejecia stolicy (l. 371, komentarz "pula pracy przepada"). Rust JUZ ma regule; brakuje tylko wpiecia adaptera `access` do PlayableState (#115). T4/W9 buduje zadanie na falszywej luce.
2. [BLOKUJACY, bledne cytaty pinu] P-C powoluje `main.ts:36146`, `:36180` jako "przejecie stolicy: pula przepada, setPracaPool(oldOwner,0)". To sa zwroty `refundedPraca` z sanitizeBuildQueue (36146) i `totalForfeitedCapture` doliczane do ZWYCIEZCY (36180) - inna regula. Wlasciwe zrodlo to komentarz 34874-34877 / 35626 i `applyCapitalCapturePlunder`; nie zostalo zacytowane.
3. [ISTOTNY, sprzecznosc z regulami projektu] Sekcja 4 pyta wlasciciela ABC o "brak wpisu = 0 czy blad". Pin rozstrzyga to jednoznacznie (`?? 0`, 34865/34877/22642), a CLAUDE.md zasady 9 i 11 zakazuja pytania, gdy web rozstrzyga; decyzje techniczne ida do REJESTR-RUST. Rekomendowana opcja B ("seed 0 przy starcie/wczytaniu, brak wpisu nadal blad") NIE odtwarza pinu: pin nie seeduje nigdy (tylko `clear()` + leniwy `set`), a `eliminateOwner` kasuje wpisy (35380-35381) - po eliminacji lub dla wlasciciela spoza seedu Rust dalej zwroci blad tam, gdzie pin da 0. Dokument ma to w PR-8/T-E, ale nie wiaze z B. Uzasadnienie "wynik zgodny z pinem" jest niepelne.
4. [ISTOTNY, NIE_ZMIERZONO tam, gdzie dalo sie zmierzyc] `eliminacja.rs` (krotka funkcja) jednoznacznie NIE czysci `ai_treasury_by_owner` ani `praca_pool_by_owner` (czysci units, power, deals, war, relations) - to ROZBIEZNE z pinem 35380-35381, nie "NIE_ZMIERZONO". `turn_economy.rs` ma tylko skarbce struktury `u64` (30/79/125/138); skarbiec AI f64 dopiero od l. 486 - rozstrzygalne. Pin: clear/restore `aiPracaPoolByOwner` (10961, 45039, 46528-46531) pominiete w T-I (tabela ma tylko skarbiec).
5. [DROBNY] T1/W3 "wartosc ujemna dla fotela czlowieka" przy `set_owner_treasury`: setter ODRZUCA czlowieka (EconomyOwnerIsHuman, playable.rs:961) - wektor niewykonalny; brak w dokumencie luki "brak settera skarbca czlowieka z podloga" (pin 34868). Wektory W1-W11 bez wartosci wejsciowych/oczekiwanych z pinu (tylko opisy) - do dopelnienia przed implementacja.
6. [DROBNY] Pin: pominiete `setOwnerPracaPool(hOid, playerPracaPool)` 40271; handel 12588-12589 i koszyk 24015-24016 nie rozroznione jako osobne producenty.

SPRAWDZONE I ZGODNE: 22642, 34864-34893 (floor max0), 38950-38978 (bank AI bez podlogi), 10238-10246, 35380, 39984, 40009, 42572/42941/42992, 10897/13904/29722/47005; Rust playable.rs:960-979 (brak podlogi), turn_war_dipl_steps.rs:1041-1108, diplomacy_basket.rs:139-158 (unwrap_or + insert), turn_economy_post.rs:383-412 (osobna mapa i64), ai_zakup_jednostki.rs:197 (state.treasury), brak produkcyjnego wolajacego setterow i apply_dipl_deltas_to_state (git grep), advance_turn bez wywolania. Allowlista: OK. Brak #[ignore]/zmian testow: OK (zero kodu).
