STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16D-OPISY-PORADNIK-A-Q1
GOAL: Obrona operatora po zarzutach Evaluatora rundy 2 (7 zarzutów). Przeliczenie wierszy 01.17, 02.13a–c, 04.9c, 05.9a, 05.9d na pinie edb8fb56.
ZMIANY/COMMIT: dyspozycje/rust-port/p1/P1-16D-OPISY-PORADNIK-A.md (allowlista; 7 wierszy + 3 linie podsumowania zaktualizowane). Brak commitów, push, deploy.
TESTY: git show edb8fb56:<ścieżka> + grep w gra/src i gra/data na pinie. git diff --check czysty. Brak testów kodu (zmiana dokumentacyjna).
BLOKADY: brak. 04.9c pozostaje NIEROZSTRZYGNIĘTY z powodem (setup bitwy miejskiej nie zlokalizowany).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium) weryfikuje zmienione wiersze: 01.17, 02.13a–c, 04.9c, 05.9a, 05.9d.
DEPLOY/PUSH: NIE WYKONANO

OBRONA:
1 -> PRZYJMUJE. 02.13b: parametr religia_swiatynia_zadowolenie (society-params.json l.525–531) nie ma czytelnika w gra/src. Efektywna wartość: gra/data/buildings.json swiatynia.baza.zadowolenie = 2, zgodna z „+2”. Wiersz 02.13b -> NAPRAWIONY. Zastrzeżenie (bramka 50%) przeniesione do 02.13c.
2 -> PRZYJMUJE (powód poprawiony). Bramka 50% nie istnieje dla bonusu Świątyni (buildings.json baza bez warunku). religia_prog_dominacji = 50 (society-params.json l.490–495) jest czytany w dominantReligion (culture-religion.ts l.675–689, share > 0.5), ale nie steruje bonusem Świątyni. G4 (culture-religion.ts l.912–925) zastąpił skok linią proporcjonalną. Werdykt NADAL ISTNIEJE zostaje z poprawionym uzasadnieniem.
3 -> PRZYJMUJE. 02.13a: cytowane źródło to buildings.json swiatynia.baza.kultura = 2. society-params.json kultura_swiatynia nie ma czytelnika w gra/src i nie jest dowodem. Werdykt NAPRAWIONY zostaje.
4 -> PRZYJMUJE. 05.9a jest rozstrzygalne na pinie. farma w terrain-improvements.json nie ma warunku „bez złoża”. improvement-build.ts l.1004–1007: farma = isFarmBaseTerrain && !hasBlockingDepositForFarm(hex) && inPlayerTerritory. hasBlockingDepositForFarm (l.743–747) zwraca zawsze false („WOLNE WSPÓŁISTNIENIE”). Farma stoi na heksie ze złożem. Poradnik §30.1 („bez złoża”) rozjeżdża się z kodem -> wiersz 05.9a = NADAL ISTNIEJE. city-hex-clear.ts dotyczy zakładania miasta, nie budowy farmy, więc nie jest blokadą.
5 -> PRZYJMUJE. 05.9d jest rozstrzygalne na pinie. improvement-build.ts l.1129–1132, kopalnia_miedzi: terrainOk = inPlayerTerritory && (Wzgorza || Gory) && (zloze==='miedz' || nakladka===ZlozeRudy || zloze==='ruda'). Koniunkcja potwierdzona. Wiersz 05.9d -> NAPRAWIONY.
6 -> PRZYJMUJE (próba niepełna, teraz wykonana). Brak odniesień do garnizonu w game/combat.ts i game/battle*.ts (grep: 0 trafień). inGarnizon w gra/src tylko w ai.ts, army-concentration.ts, army-cycle.ts, armyMerge.ts, post-battle-map.ts l.500 (czyści flagę). Nie zlokalizowano setupu obrońców bitwy miejskiej ani źródła gCount (cityPanel.ts l.3205, l.3313). Wiersz 04.9c pozostaje NIEROZSTRZYGNIĘTY, z węższym powodem.
7 -> PRZYJMUJE evidence, werdykt bez zmian. Mechanizm: renderEpochStep (newGameFlow.ts l.1533–1545), lock tylko gdy !epochHasCivs (l.1537). epochHasCivs -> civsForEpoch -> civAvailableAtEpoch (civMinStartEpochIndex l.518–521 ≤ startEpochIndex l.512–515; START_EPOCH_ORDER l.510). zelazo ma cywilizacje (17 trafień w civs.json), karta nie jest zablokowana. avail (l.639) nie jest czytane; badge nie jest renderowany. Wiersz 01.17 = NADAL ISTNIEJE z poprawionym dowodem.
