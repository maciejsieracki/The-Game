STATUS: PASS-WITH-NOTES (obrona r2, czeka na Evaluator i Final Control)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-AI-PEACE-CITY-OFFER-Q1
GOAL: Odpowiedz na zarzuty Evaluatora (PASS-WITH-NOTES, notatki 1-3, nieblokujące). Kod portu (src/) bez zmian.
ZMIANY/COMMIT: baza kodu operatora 421e0585c (raport r1; kod af95fc42d). Allowlista zachowana:
- rust-port/engine/tests/p6_ai_peace_city_offer.rs (nowe testy + pola wejścia z wektorów)
- rust-port/engine/tests/p6_ai_peace_city_offer_data/vectors.json (regeneracja z webu)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-AI-PEACE-CITY-OFFER-Q1/gen-city-offer.ts, gen-city-offer.sh (nowy), 02-obrona-r2.md
- dyspozycje/rust-port/p6/P6-AI-PEACE-CITY-OFFER.md
Zero zmian w src/, gra/**, WERSJE.md, Cargo.toml, renderer, src-tauri. Commit: patrz sekcja DEPLOY/PUSH.

ODPOWIEDZI NA ZARZUTY:
- NOTATKA 1 (myTypCywilizacji nie ustawione w wektorach): PRZYJMUJĘ. Dodano pole civ (myTypCywilizacji) do przypadków decideAIDiplomacy (10 wartości: brak, 8 wierszy macierzy, nieznana). Dodano nowy zbiór pure.profil: resolveWarPeaceProfile dla braku klucza, nieznanego klucza i 15 cywilizacji, pełne pola liczbowe. Test profil_wojny_per_cywilizacja_zgodny_z_webem porównuje 15 pól wprost z webem i wymaga >=4 różnych minTurWojny (wartości 2,3,4,7,8 i baza 5). Mutant (profil zawsze None) przechodził na pierwszej wersji wektorów; po zagęszczeniu siatki tur wojny (0..9) test blok_oferuj... wykrywa go (FAIL).
- NOTATKA 2 (wektory: stanWojny=true, partnerId='0' zawsze): PRZYJMUJĘ. stanWojny = false w 15% przypadków (378 w wektorach), partnerId != '0' w 20% (494). W tych przypadkach web nie wystawia komendy miasta i Rust zwraca None (zweryfikowane testem). Mutanty: usunięcie bramki partner_id == "0" -> FAIL bloku. Usunięcie bramki stan_wojny z common_gate -> PASS, to mutant równoważny: peace_time_ok wymaga turns_at_war_rel >= min_tur_wojny, a turns_at_war_rel = 0 bez wojny, przy min_tur_wojny >= 2. Bramka jest zbędna, nie jest luką testu.
- NOTATKA 3 (gen-city-offer.ts importuje web z twardej ścieżki scratchpadu): PRZYJMUJĘ. Generator przepisany: import '@web/game/ai' z tsconfig paths, ścieżka WEB_ROOT podawana przez env (katalog z gra/src i gra/data), uruchamiany przez gen-city-offer.sh (wymaga WEB_ROOT, ESBUILD, BUILD_DIR). `three` zastąpione stubem z nazw THREE.<Nazwa> znalezionych w WEB_ROOT. Reprodukcja: wektory z origin/main (git archive gra/src gra/data) dają bajt-w-bajt te same zbiory pure.rwProg/waga/pickOddania/pickZadania co poprzednio (porównanie JSON: identyczne).

TESTY (Operator r2, wykonane lokalnie):
- cargo test --test p6_ai_peace_city_offer: 6 passed, 0 failed (wcześniej 5).
- rustfmt --check tests/p6_ai_peace_city_offer.rs: OK.
- cargo clippy --lib --test p6_ai_peace_city_offer -- -D warnings: OK.
- Liczby z wektorów r2: decide 2600; oferuj 140, zada 169, brak 2291; błędy 0; bez wojny 378; partner != '0' 494; z myTypCywilizacji 2376. Profil: 17 wpisów.
- Mutanty (src przywracane git checkout): profil None -> FAIL bloku; partner gate usunięta -> FAIL bloku; stan_wojny gate usunięta -> PASS (równoważny, patrz wyżej).
- NIE_ZMIERZONO w r2: pełny cargo test wszystkich binarek i clippy --all-targets (src nie zmieniono; r1 też tego nie wykonał).
- vectors.json r2 pochodzi z uruchomienia generatora r2 na WEB_ROOT = origin/main (ten sam generator, który jest w runs/<ID>/).

ZAŁOŻENIA (bez zmian względem r1, dopisane w dokumencie P6):
- Liczby profilu w wektorach są napisami String(x), bo serde_json bez feature float_roundtrip daje 1-ULP rozbieżność (stwierdzone na 0.48000000000000004). Parsowanie str::parse jest dokładne. Wektory decide i pure nadal używają liczb JSON (przeszły bez zmian).
- Parametry czlowiek i reszta założeń r1 bez zmian.

BLOKADY: brak.
RUNDY: 2/5 (obrona r2 po PASS-WITH-NOTES; notatki zamknięte jako PRZYJMUJĘ).
NASTĘPNY KROK: Evaluator (Sonnet 5.5) na nowym SHA, potem Final Control. Notatka 1 zamknięta testem profilu, notatka 2 testem bramek i mutantem, notatka 3 generatorem parametrycznym.
DEPLOY/PUSH: NIE WYKONANO
