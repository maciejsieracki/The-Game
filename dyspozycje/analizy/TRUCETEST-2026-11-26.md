# TRUCETEST (#166) — mapa węzłów okablowania: koniec rozejmu → oferta pokoju z ceną

Baza: origin/main 1bb77a7a0. Zero zmian w gra/src i gra/data. Test: `gra/tools/truce-end-main-wiring-test.cjs`.

| Węzeł | Linia main.ts | Co woła | Co ustawia / skutek | Pokryty przez |
|---|---|---|---|---|
| truceEndPorts → declareWarAfterTruce | 13181 | applyDiploEventTracked('wojna_wypowiedziana'), wpis „Rozejm wygasł” dla gracza | status → wojna | S2, S5, m8 |
| truceEndPorts → enqueueOffer | 13199 | enqueueTruceEndOffer | wpis w pendingDiplomacyInbox (cmdType zaproponuj_pokoj) | S1, S5, m6, k1, k8 |
| truceEndPorts → removeOffer | 13200 | splice po id | usuwa wpis skrzynki | S2, S5 |
| truceEndPorts → settlePeacePrice | 13204 | settleTruceEndPrice | przelew payer→payee, true gdy pełne pokrycie | S4*, S6, S7, S8 |
| truceEndPorts → finalizePeace | 13206 | finalizePeaceTreatyBetween | pokój stały, wpis „przeszedł w pokój” | S5, S6, S8, m5 |
| enqueueTruceEndOffer | 13230 | push do skrzynki, showHint, refreshD1bHud | oferta bez deduplikacji | S1, S5, m6 |
| truceEndWindowFor | 13302 | truceEndWindowOpen, truceEndPriceFor, truceEndDuePn, aiPeacePaymentAssets | open / requiredPn / currency / cityAvailable | S3 (W1–W5), m3, m9, m10, k4 |
| settleTruceEndPrice | 40900 | aiAiPeacePriceFor, truceEndDuePn, executeTruceEndSettlement, transferBasketItems, isAiAiPeaceBalanceAllowed | cena 0 → 1 Pn; przelew raz; bramka bilansu AI↔AI | S4, S4b–S4f, m1, m2, m4, m7, m11, k3, k7 |
| transferBasketItems (port) | 13784 | — (atrapa rejestruje payer, payee, koszyk) | przelew surowców / miasta | S4, S4c, m1, m2, m7 |
| tickTruceExpiries | 13323 | truceEndTickPair dla par | wygaśnięcie oferty = wojna trwa | S1, S2, S6, S7, k5, k6, k8 |
| clearTruceEndOffer / truceEndToWar | 13333 / 13338 | clearTruceEndOfferCore / truceEndToWarCore | czyści ofertę; wojna | S2, S8 |
| allWiarygodnoscOwnerIds | 13343 | — | lista ownerów do tyku | S1–S7 |

Moduły (żywe źródło, bundle esbuild): diplomacy-peace-lock.ts (truceEndTickPair, truceEndAcceptCore, truceEndWindowOpen), diplomacy-truce-end-price.ts (truceEndPriceRule, truceEndDuePn, executeTruceEndSettlement). Mutacje modułów: k1–k8.

Wynik: baza 14/14 zielonych; mutacje czerwone 19/19 (m1–m11 w main.ts, k1–k8 w modułach).

Nie pokryte w tym teście: pełny finalizePeaceTreatyBetween (atrapa spy), transferBasketItems jako całość (atrapa rejestruje wywołanie, bez zmiany zapasów), aiPeacePaymentAssets i peacePlanWithTail (atrapy kształtu), wiring obsługi odpowiedzi gracza (main.ts ok. 22953) oraz tyk AI↔człowiek przez UI.
