STATUS: PASS-WITH-NOTES (zakres częściowy: rdzeń logiczny; wiring w silniku, AI, UI i zapis NIE wykonane)
DOMAIN: GAME (WEB)
TEMAT: R-WEB-WAR-AGGRESSOR-FLAG-Q1
GOAL: flaga agresora (20 tur, bez casus belli) + casus belli (odmowa trybutu/ultimatum, N tur) + wpływ na AI (sojusz/pakt, willingnessAlly) + znacznik UI + parametry w JSON.
BAZA: origin/web/integration-20261030 = ad2bc6e3c (worktree fast-forward).

ZMIANY/COMMIT:
- gra/data/diplomacy-aggressor-params.json (nowy): trwaTur 20; relacjaDeltaSojusz -15; willingnessAllyMnoznik 0.7; casusBelli.trwaTur 15 (ZAŁOŻENIA w polach _zalozenie).
- gra/src/game/diplomacy-aggressor.ts (nowy): czyDajeFlageAgresora (tylko 'bez_powodu'), ustawFlageAgresora, czyAgresor (aktywna dla tur < doTury), mnoznikWillingnessAlly, deltaRelacjiSojusz, ustawCasusBelli/maCasusBelli (klucz kierunkowy), serializujMape/wczytajMape (odporne na NaN/śmieci). Funkcje niemutowalne.
- gra/tools/diplo-aggressor-unit-test.cjs (nowy).
- dyspozycje/autobot/runs/R-WEB-WAR-AGGRESSOR-FLAG-Q1/01-operator-r1.md (ten raport).
- SHA commitu: patrz sekcja poniżej (uzupełniane po commicie).
Nie zmieniano: gra-robocza/**, dyspozycje/WERSJE.md, rust-port/**, src-tauri/**, Cargo.toml, main.ts, ai.ts, diplomacy.ts, UI.

TESTY:
- node tools/diplo-aggressor-unit-test.cjs: 38 PASS, 0 FAIL, exit 0 (granice N-1/N/N+1 flagi i casus belli; brak flagi dla casus_belli/wymuszona_epoka/hamulec; NaN guard; niemutowalność; roundtrip zapisu).
- npx tsc --noEmit: exit 0.
- git diff --check: czysty.
- NIE_ZMIERZONO: pozostałe bramki bazowe (city-cession, war-era-counter, diplo-war-peace, diplomacy 148, ring, peace-lock itd.) — nie uruchamiano, bo kod silnika nie został zmieniony; zostają do uruchomienia przy wiringu.
- NIE_ZMIERZONO: zrzut Chromium/live (brak zmiany widocznej w UI w tej rundzie).
- Mutacje gałęzi sterujących: NIE wykonano (brak podpięcia w silniku; testy są na czystych funkcjach).

BLOKADY:
- Brak wywołań w silniku: main.ts (ownerDeclareWarOn ~11640, deklaracja gracza ~11619, pętla wojny z progu ~10414) nie przekazują przyczyny i nie ustawiają flagi.
- Brak stanu w grze: flagi nie ma w stanie gry, nie zapisuje się w save/load (wymaga dopisania do zapisu w main.ts).
- Brak wpięcia do ai.ts / diplomacy-proposals.ts (willingnessAlly ~ai.ts:6163, diplomacy-proposals.ts:1171; próg Relacji diplomacy-proposals.ts:1147).
- Brak wywołania casus belli z trybutu (trybut_zadanie) i ultimatum.
- Brak znacznika „Agresor” w UI (diplomacyNegotiationModal.ts / diplomacyTradeBasket.ts) i tooltipu.
- Brak testów mutacyjnych silnika i brak zrzutu UI.

RUNDY: 1/5
NASTĘPNY KROK: runda 2 Operatora — (a) przekazać przyczynę przez ownerDeclareWarOn/deklarację gracza w main.ts; (b) pair/owner stan flagi w save/load; (c) wpięcie deltaRelacjiSojusz i mnoznikWillingnessAlly w ai.ts/diplomacy-proposals.ts dla innych AI; (d) casus belli z trybutu/ultimatum; (e) znacznik UI + zrzut Chromium; (f) testy N-1/N/N+1 na progu AI i pełne bramki bazowe. ZAŁOŻENIE do rozstrzygnięcia w rundzie 2 (bez pytań ABC): rozróżnienie „wojna z progu” (hamulec) od „wymuszona epoka” wykonywać przez parametr przyczyny w wywołaniu.
DEPLOY/PUSH: NIE WYKONANO
