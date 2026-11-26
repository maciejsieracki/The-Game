STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MINT-CAPITAL-ONLY-Q1
GOAL: bonus Mennicy na całą cywilizację, raz, tylko z Mennicy w AKTUALNEJ stolicy.
ZMIANY/COMMIT: kandydat 0a391ee187ab901ed1574b421ebec6f09db45e35; baza b1e4e04ab jest przodkiem (merge-base --is-ancestor OK). Diff: turn-economy.ts, main.ts (+5), cityPanel.ts, mint-capital-only-test.cjs, waluta-mennica-test.cjs, raporty runs/**. Wszystko w allowliście; brak zmian w gra-robocza/kanon/WERSJE/rust-port/production.ts.
OCENA ZARZUTÓW:
1 (dwa źródła stolicy) - NAPRAWIONE: setOwnerCapitalCityResolver + main.ts instaluje capitalCityIdForOwner; ownersWithMennica i panel mają to samo źródło. Własna mutacja (wyłączenie resolvera w silniku) => mint-capital-only 6/2 czerwone.
2 (brak testu spójności) - ODDANE/uwaga: test z resolverem i zmianą stolicy dodany.
3 (tautologia mutanta) - uwaga, nieistotne (mutacja zewnętrzna czerwona).
4 (etykieta) - zrobiona w cityPanel.ts.
5 (komentarze) - poprawione.
6 (production.ts) - założenie opisane; NIE ZMIERZONO w przeglądarce; do potwierdzenia właściciela.
Zmieniona asercja waluta-mennica kodowała stary kontrakt (Mennica w regionalnym mieście mnoży imperium); zmiana uzasadniona (odp. 8A), asercja eq na brak mnożnika - nie osłabienie.
TESTY (własne, w worktree): tsc --noEmit exit 0; mint-capital-only 8/0; waluta-mennica 61/0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; trade-routes-income 135/0; ai-unit-replace-same-rules 45/0; ai-test 297/0; war-rules-multiwar-main-guard 21/0.
BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA: (a) właściciel do potwierdzenia: czy w nowej stolicy wolno zbudować Mennicę przy osieroconej (kod dopuszcza); (b) dług pre-existing: pozostałe efekty stolicy w advanceCityEconomy/pre-pass D2 używają heurystyki pierwszego miasta; (c) brak weryfikacji w przeglądarce.
RUNDY: 3/5 (Operator, obrona, FC)
NASTĘPNY KROK: integracja orkiestratora, potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
