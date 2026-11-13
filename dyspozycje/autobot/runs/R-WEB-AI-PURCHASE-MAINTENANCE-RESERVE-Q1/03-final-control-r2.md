STATUS: PASS-WITH-NOTES (progi liczbowe do zatwierdzenia przez wlasciciela)
DOMAIN: GAME
TEMAT: R-WEB-AI-PURCHASE-MAINTENANCE-RESERVE-Q1
GOAL: AI nie kupuje jednostek, gdy dochod netto po zakupie < prog albo skarbiec < cena + N tur utrzymania; progi w ai-params.json per poziom.
ZMIANY/COMMIT: f43637d1a (Operator r2, baza 1cafcf632) + 8be4beb2d (obrona 02b). Allowlista OK: main.ts (import, aiGoldIncomeByOwner czyszczona w 3 miejscach, aiPurchaseReserveInputs, zapis przychodu, spread na call site), econ-params.json (usuniete 2 martwe klucze), nowy test sekcja G, pliki runu. Brak zmian w gra-robocza/, WERSJE.md, rust-port/, render/. git diff --check czysty.
TESTY (odtworzone przez FC na 8be4beb2d): ai-purchase-maintenance-reserve 43/0; tsc czysto; logic-test 213/213; ai-test 274/20 (jak baza); ai-jednostki-tylko-zakup 43/1 (D11, jak baza); ai-mp-rekrutacja-build-gate 21/0; ai-rekrutacja-parytet 7/0; ai-unit-rush 7/0; ai-prod-fallback 17/0.
ZARZUTY: 1 (dlugosc 666 > 600) ODDAL (02b = 486 slow). 2 (jeden seed/mapa/trudnosc) ODDAL jako ograniczenie jawnie opisane; progi zatwierdza wlasciciel. 3 (sekcja G glownie kontrakt zrodlowy) ODDAL: zgodne z dispatchem r2 pkt 4, test pada na bazie.
UWAGA: pomiar na zywo nie odtworzony (dysk ~2 GB); spojnosc raportu z surowymi danymi potwierdzona wczesniej przez Evaluatora (wojsko AI 210 -> 136, min skarbiec -472 -> -57).
BLOKADY: brak technicznych. Decyzja wlasciciela: progi N=3/3/2, min netto 0/0/-2; Easy/Hard niemierzone na zywo.
RUNDY: 3/5 (FC r2).
NASTEPNY KROK: integracja orkiestratora: SHA do integracji 8be4beb2d (zawiera f43637d1a), PRZED ARMY-STACK-LIMIT (oba dotykaja ai*.ts i main.ts); rebase/merge na origin/main (c7283468b); origin/rust-port/parity-v2 (8bc2efcf8) niezalezny (gra/ vs rust-port), bez kolejnosci wymuszonej.
DEPLOY/PUSH: NIE WYKONANO
