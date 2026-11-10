STATUS: PASS-WITH-NOTES (etap Operatora; wymaga Evaluatora)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16F-CIVPEDIA-CYWILIZACJE-Q1
GOAL: Pełny audyt 9 haseł CivPedii „Cywilizacje" wobec `gra/data/civ-matrix.json` na pinie edb8fb56 (bez „Strategii dla gracza", zamkniętej w P1.16d).
ZMIANY-COMMIT: Nowy plik `/home/user/The-Game/dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-CYWILIZACJE.md`. Brak commitu. `gra/**` nietknięte (git status potwierdza).
TESTY: Brak testów runtime. Odczyty przez `git show edb8fb56:…` i `git grep` na pinie. 47 pozycji liczbowych ze statusem i dowodem. Wyniki:
- Realne rozbieżności wartości w runtime: C-2 Celtowie Uderzenie +40% vs +15% (REAL); G-3 Germanie Furia +40% vs +15% (REAL, mapowanie do potwierdzenia); E-2b Egipt ruch rydwanów +30% vs +15% (suma dwóch pól w `civMovementMultiplier`).
- Kierunek odwrotny (koszt zamiast redukcji): R-3 Rzymianie budowa ×1.20 zamiast −20%; Z-2a/Z-2b Zulusi rekrutacja ×1.10 zamiast −10%.
- Dane zgodne, ale efekt BLOCKED w runtime (`excludedG1`): Ch-1, E-1, Gr-1, R-1, R-2, S-1, S-2, S-3.
- Brak pola: G-2 zasadzka, S-4 obrona rydwanów, R-4 szybsza budowa dróg, zasięg łuczników.
- Rozbieżność klasyfikatora z kodem: `walka_ruch_bitwa_proc`, `walka_ruch_rydwany` i `walka_ruch_piechota_teren_plytkie_morze` są w `civ-matrix-semantic.ts` jako BLOCKED/UNWIRED, a `civMovementMultiplier` (`civ-bonuses.ts` ok. l. 297–330, `battleScene.ts` ok. l. 7183) je stosuje.
- Mnożniki waluty i profile AI zgodne we wszystkich 9.
BLOKADY: Brak twardych. Pozycje niedokończone wymagające Evaluatora są wymienione w §4 raportu (mapowanie „pierwsze uderzenie/na starciu", klasyfikator vs kod, sumowanie ruchu rydwanów Egiptu, baza „standard 10%", konsumenci `eko_*`, warunki nieodwzorowane w danych).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium), adwersarialna weryfikacja §4 pkt 1–6, zwłaszcza E-2b i rozbieżność klasyfikatora dla pól ruchu.
DEPLOY/PUSH: NIE WYKONANO