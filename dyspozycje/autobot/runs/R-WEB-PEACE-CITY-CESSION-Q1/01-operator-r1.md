STATUS: FAIL
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PEACE-CITY-CESSION-Q1
GOAL: Miasto jako pozycja koszyka pokoju (wycena PW, zakazy stolica/ostatnie miasto, wykonanie cesji, AI oddaje i AI żąda miasta, UI wyboru miasta). Runda 1 domyka tylko warstwę wyceny i reguł.
ZMIANY/COMMIT: baza origin/web/integration-20261030 @ 0083aed43. Commit kodu 4b3b0e95a. Allowlista: gra/src/game/diplomacy-value-catalog.ts (typ 'miasto', diplomacyPnMiasto, diplomacyMiastoZakaz, diplomacyMiastoWagaBilansu, diplomacySumPn case 'miasto' przez cityPn); gra/src/ui/diplomacyTradeBasket.ts (tylko etykieta TYP_LABELS, wymagana przez Record<WartoscPozycjaTyp,...>); gra/tools/diplomacy-city-cession-test.cjs (nowy). Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, Cargo.toml. Brak zmian w main.ts, ai.ts, diplomacy-proposals.ts, diplomacyNegotiationModal.ts, diplomacy.json.
TESTY:
- npx tsc --noEmit (gra/): exit 0 (baza i po zmianie).
- node gra/tools/diplomacy-city-cession-test.cjs: 25 pass, 0 fail.
- node gra/tools/diplomacy-value-catalog-test.cjs: 82 pass, 0 fail (regresja).
- git diff --check: czysty.
- Bramki bazowe z dispatchu (war-era-counter, multiwar, diplo-war-peace, diplomacy, peace-lock, ring) NIE_ZMIERZONO w tej rundzie. Nie uruchamiano Chromium ani zrzutów (brak zmian widocznych w UI).
- Mutacje i testy N-1/N/N+1 dla progów AI NIE_ZMIERZONO (progi AI jeszcze nie napisane).
Założenia (ZAŁOŻENIE): wycena przykładu 4 obywateli + 3 budynki kosztu 30 = 1060 PW zweryfikowana formułą z buildings.json (kuznia/port/akwedukt = 30). Przykład 8+8 ≈ 1840 zależy od zestawu budynków, którego spec nie podaje, więc nie zweryfikowany (NIE_ZMIERZONO). Cud świata przyjmowany jako liczba przekazana przez wołającego (wonders.json nie ma pola budynku-cudu w buildings.json).
BLOKADY:
- Kryterium (3) wykonanie cesji przy zawarciu pokoju: NIE zrobione. applyCityCaptureToMap (main.ts:31551) wywołuje recordWarCityLossForPair, maybeResolveRegularWarOnCityCapture i triggerRebelProtectionWarConsequence — efekty wojenne, które przy cesji pokojowej są niepoprawne. Wymaga osobnej ścieżki bez skutków wojennych (ZAŁOŻENIE do r2: nowa funkcja transferu właściciela, budynki zostają, jednostki w mieście wracają do dotychczasowego właściciela, niepokój 5 tur).
- Kryterium (4) AI oddaje miasto (decideAIDiplomacy w ai.ts): NIE zrobione.
- Kryterium (5) AI żąda miasta (kontroferta, rw ≥ 0.7 i turnsAtWar ≥ 20 lub zdobycie miasta): NIE zrobione.
- Kryterium (6) UI wyboru miasta w koszyku i modalu pokoju: NIE zrobione (poza etykietą).
- Kryterium (7) save/load: NIE sprawdzone (brak nowego pola zapisu w tej rundzie, więc nieobciążone z definicji).
RUNDY: 1/5. Werdykt: FAIL (niepełny zakres, zgodnie z kryteriami 3–6). Zużyte: 1. Decyzja właściciela NIE wymagana.
NASTĘPNY KROK: runda 2 Operatora z tym samym ID: (a) transfer miasta przy pokoju bez skutków wojennych; (b) gałęzie AI oddaje/żąda w ai.ts z progami N-1/N/N+1; (c) wybór miasta w koszyku pokoju (diplomacyTradeBasket.ts / diplomacyNegotiationModal.ts) i zrzut Chromium; (d) mutacje gałęzi sterujących i testy progów.
DEPLOY/PUSH: NIE WYKONANO
