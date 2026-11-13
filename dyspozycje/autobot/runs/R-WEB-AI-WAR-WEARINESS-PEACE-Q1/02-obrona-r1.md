STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-WAR-WEARINESS-PEACE-Q1
RUNDA: 1/5 (obrona)

Zarzut 1 (brak pomiarow z pelnych przebiegow): ODRZUCAM jako zarzut do kodu. NIE_ZMIERZONO pozostaje: brak Chromium, gra dziala tylko w przegladarce. Do zmierzenia po integracji.
Zarzut 2 (brak wyjscia awaryjnego): PRZYJMUJE. war-weariness.ts: gdy szczyt zmeczenia >= progWzajemnyPokoj i odrzucono >= odrzuceniaDoKapitulacji (3, JSON) ofert, wyczerpany wygrywajacy przyjmuje to, co przegrywajacy realnie moze dac. Testy 4f (kapitulacja po 3 odrzuceniach) i 4g (przy niskim zmeczeniu brak kapitulacji).
Zarzut 3 (tor AI-gracz): PRZYJMUJE CZESCIOWO. AI juz wczesniej samo proponuje pokoj graczowi (sygnal 'e' w aiPeaceSignals, zaproponuj_pokoj) i przyjmuje po 20 turach (evaluatePeaceAiGate), wiec propozycja przy rownej sile istnieje. Luka realna: cena pokoju zadana od gracza nie malala z zmeczeniem. Poprawka: diplomacy-proposals.ts mnozy basePn przez wearinessPeacePriceFactor (do -60% przy pelnym zmeczeniu, param rabatCenyPokojuMax). Test 4j + straznik zrodla.
Zarzut 4 (skala rw vs share): ODRZUCAM z dowodem. rw = potAI/(potAI+potPlr) (main.ts:38422), requesterShare = own/(own+other) (diplomacy-ai-forced-peace.ts:189), ta sama skala 0..1. Test 4i.
Zarzut 5 (atrapy zamiast realnej wyceny): PRZYJMUJE. Test 4h uzywa realnych peaceOfferAiRequestPn, peaceOfferAiOwnBilans, aiOfferPwSurplusTolerance, treatyBasePnFromConfig, treatyEvalRelationTotal. Okablowanie main.ts nadal sprawdzane straznikiem zrodla; pelny test runtime wymaga przegladarki (NIE_ZMIERZONO).
Zarzut 6 (wojny wymuszone epoki): PRZYJMUJE (test zrodlowy 6b). Tick konczy wojne wylacznie przez finalizePeaceTreatyBetween, ktory ustawia forcedEraPeaceUntilNextEraByPairKey przed zmiana relacji; ta sama sciezka co istniejacy pokoj AI-AI 2T.

TESTY: ai-war-weariness-peace-test PASS=66 FAIL=0 (exit 0); tsc --noEmit exit 0; regresje: ai-war-nearest-city-peace-2t PASS (16/16 mutacji), diplomacy-city-cession-r3 73/0, diplo-war-peace-d7 8/0, -gate 11/0, -main-guard 28/0, -profile-unit 198/0, -sim 22/0. Pelnego PRZED/PO 102 testow nie powtarzano (zmiana w diplomacy-proposals dotyczy tylko bramki R5 gracz->AI).
DEPLOY/PUSH: NIE WYKONANO
