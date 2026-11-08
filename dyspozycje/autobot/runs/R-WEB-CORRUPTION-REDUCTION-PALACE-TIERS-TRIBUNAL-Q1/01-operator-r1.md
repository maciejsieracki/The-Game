STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-CORRUPTION-REDUCTION-PALACE-TIERS-TRIBUNAL-Q1
GOAL: Palac II/III = -30% korupcji jak Palac I; Trybunal = -30% jak Pretorium (decyzje wlasciciela 2026-11-08).
ZMIANY/COMMIT: gra/src/game/economy.ts (lista KORUPCJA_REDUKCJA_BUDYNKI + komentarze), nowy gra/tools/corruption-reduction-palace-tribunal-test.cjs, ten raport. Dane JSON bez zmian (patrz nizej). SHA: patrz commit "R-WEB-CORRUPTION-REDUCTION ... R1" na galezi worktree (git log -1).

POMIAR (A), economy.ts (przed zmiana):
- Lista redukcji: economy.ts:1226 `['sad','pretorium','palac']`; stala 0.30/budynek: :1228; sufit sumy 0.60: :1235; funkcja corruptionBuildingReduction :1247-1253.
- Tabela przed: Sad 0.30, Pretorium 0.30, Palac I 0.30; Palac II 0, Palac III 0, Trybunal 0 (Trybunal ma tylko Prawo/pieniadz/zadowolenie, opis "ogranicza korupcje" byl nieprawdziwy).
- Sciezka: turn-economy.ts:2071-2073 (advanceCityEconomy) i :2667-2669 (previewCityEconomy): strata = corruptionRate(dystans, miasta) * (1 - corruptionBuildingReduction(builtIds)), builtIds = budynki TEGO miasta. Jedna funkcja, brak galezi po ownerze -> gracz, AI i panstwa-miasta (kazdy ownerId przechodzi ta sama petla) liczone identycznie (test T6).
- Korupcja dotyka tylko handelNetto (Danina/Podatek), nie Pracy (D1).
- Pretorium NIE ma parametru JSON — to stale w kodzie (0.30 / 0.60). Zgodnie z dispatchem ("JSON jesli Pretorium ma parametr") zachowano ten sam mechanizm: dopisano id do istniejacej listy; brak nowego parametru.

REGULA LACZENIA (istniejaca, bez zmian): redukcje ADDYTYWNE po 30pp, sufit 0.60, tylko budynki w danym miescie. Reguly "budynki o tym samym dzialaniu nie sumuja sie" w kodzie NIE MA. Palac I/II/III: ulepszenia (upgradeFrom palac -> palac_ii -> palac_iii; ulepszenie usuwa poprzednika z builtIds), wiec w miescie stoi zawsze jeden tier => Palac II/III daja dokladnie -30%, nie kumuluja sie z Palacem I. Konsekwencja do wiadomosci wlasciciela: sufit 0.60 jest teraz realnie osiagalny (Sad + Trybunal = 0.60; Sad + Trybunal + Pretorium = 0.90 -> 0.60 ucięte); Palac + Trybunal w stolicy = 0.60. Regula jednoznaczna, DECISION_REQUIRED nie jest potrzebne.

WPLYW NA PRZYCHODY: miasto 8 pol od stolicy, 5 miast, normal: strata bazowa 10.5%; Palac II/III lub Trybunal -> 7.35%; Trybunal+Pretorium -> 4.2%. cityYieldPerTurn (20 pol Rownina, handel 100% pieniadz): pieniadz 17 -> 18 z Trybunalem.

TESTY:
- corruption-reduction-palace-tribunal-test.cjs: 34/0 (Palac I/II/III, Trybunal, Sad, Pretorium = 0.30; kombinacje Trybunal+Pretorium, Palac II/III+Trybunal, Sad+Trybunal(+Pretorium) = 0.60 z sufitem; brak budynkow = 0; parytet 2 wywolan; stare zapisy).
- korupcja-test.cjs 18/0 (asercje bez zmian; T5b nadal zielony), logic-test 213/213, ai-test 289/0, tsc --noEmit 0 bledow (TS 5.9.3; 5.6.3 daje fałszywe bledy Float32Array niezwiazane ze zmiana), owner-economy-test 20/0, grupy-budynkow-test 84/0, building-happiness-test 14/0.
- Nie uruchamiano: npm run build/dev (zakaz). Weryfikacja w przegladarce: nie dotyczy (brak zmiany wizualnej).

OPISY NIEAKTUALNE W buildings.json (NIE ruszane, do wdrozenia kart):
- trybunal: `opis` "ograniczajaca korupcje, slabsza jednak niz Sad czy Pretorium" -- teraz falszywe (rowna -30%); `top3[1]` "Ogranicza korupcje jeszcze zanim..." staje sie prawdziwe, ale trzeba podac -30%; `uwagi` "slabszy niz Sad/Pretorium" nieaktualne.
- palac_ii, palac_iii: `opis` i `top3` nie wspominaja redukcji korupcji -30% (dodac); palac (I) tez nie wspomina.
- sad: opis ok.
- Uwaga: ANALIZA-KART-BUDYNKOW.md nie istnieje w tym worktree (baza main), nie czytano.

BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator
DEPLOY-PUSH: NIE WYKONANO
