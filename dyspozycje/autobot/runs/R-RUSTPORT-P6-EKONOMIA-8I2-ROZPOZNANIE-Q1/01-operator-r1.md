STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1 (EKONOMIA-8I2, tracker #180)
GOAL: Ustalić, które reguły ekonomii miast z pinu (żelazo i dostęp do zasobów, P6.6–P6.8) nie mają odpowiednika w Rust; tabela plik:linia pin/Rust/status; propozycja podziału na tematy.
ZMIANY/COMMIT: tylko dokument. Nowy plik `dyspozycje/rust-port/p6/R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (allowlista) oraz ten raport. Zero zmian w `rust-port/**`, `gra/**`, testach, Cargo. SHA commitu: podany w odpowiedzi orkiestratorowi (raport nie zawiera własnego SHA).
TESTY: NIE DOTYCZY (rozpoznanie, bez kodu; cargo nie uruchamiany).
BLOKADY:
- Etykieta `8I2` nie występuje w kodzie pina (`git grep 8I2 07d2fbd72 -- gra/src` daje tylko fałszywe trafienia w binarnych mp3) ani w dokumentacji. Zakres przyjęto wg opisu z dispatchu (reguły żelaza i zasobów miast, P6-8F i P6-8H2). Znaczenie „zestawu 8I2” w trackerze: NIE_ZMIERZONO.
- Pozycje NIE_ZMIERZONO: reguły AI wyboru konwertera (`ai.ts:2320-2345`), upkeep obywateli żelazem (`economy-upkeep.ts:407`), wartości liczbowe (ruda, przepustowości, ceny).
- Linia pina `converters.ts:102` (`wielka_odlewnia__braz`) nie była czytana wprost; wpis Rust istnieje (`turn_economy_resources.rs:108`).
- Brak wykrytych brakujących odpowiedników w zbadanym zakresie (16 pozycji). Nie oznacza to pełnego parytetu.
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator: wybrać kolejność tematów T4 → (T1 ∥ T2) → T3 z dokumentu. Przed T1/T2 sprawdzić `ai.ts:2320-2345` i `economy-upkeep.ts` (wejścia NIE_ZMIERZONO). Decyzja właściciela wymagana tylko przy rozbieżnych wartościach liczbowych (T3).
DEPLOY/PUSH: NIE WYKONANO (brak pusha; push do rust-port/parity-v2 zakazany dispatchem; branch lokalny `wip/R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1`).
