STATUS: PASS
DOMAIN: GAME (pomiar, bez zmian kodu gry)
TEMAT: R-WEB-DIPLO-ALLIANCE-COUNT-MEASURE-Q1 (ALLYMEAS, #153)
GOAL: sprawdzić, czy czyszczenie relacji „sojusz” po zniknięciu umowy (ALLYCLEAN, FALA 913) nie zmniejszyło liczby sojuszy AI o ponad 30% względem stanu sprzed (b1e4e04ab). Zero zmian gra/** i gra/data/**.
ZMIANY/COMMIT: tylko pliki pomiaru i raportu, bez zmian w gra/**: dyspozycje/analizy/SOJUSZE-LICZBA-PRZED-PO-ALLYCLEAN-2026-11-26.md, dyspozycje/analizy/SOJUSZE-LICZBA-PRZED-PO-ALLYCLEAN-2026-11-26.json, dyspozycje/analizy/allyclean-count-measure.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-ALLIANCE-COUNT-MEASURE-Q1/10-operator-claude.md. Commit: patrz SHA w StructuredOutput.
TESTY: pomiar (nie bramki kodu). Bundle PRZED z b1e4e04ab i PO z 107e30f5e, `vite build` poza repo (bez npm run build/dev). Runner diplomacy-harder-measure-run.cjs, Chromium 1243, seedy 4242 i 7, tury 2–67, 66 wierszy na przebieg (bez duplikatów).
Wyniki (sojusze AI↔AI wg pokoj=sojusz):
- seed 4242: tura 30/40/50/60/67 PRZED = 2/2/2/3/3, PO = 2/2/2/3/3; maks. 3/3; różnica 0%.
- seed 7: tura 30/40/50/60/67 PRZED = 0/2/2/2/5, PO = 0/2/2/3/6; maks. 5/6; w turze 67 PO wyższe (+20%), nie niższe.
- Limit 2 na cywilizację: maks. 2 na wszystkich przebiegach, 0 naruszeń.
- Sojusze z graczem: 0.
- Nowe umowy / usunięcia (seed 4242): 3/0 PRZED i 3/0 PO. (seed 7): 8/3 PRZED i 9/3 PO.
- Pary „sojusz” bez umowy (status=sojusz, pokoj≠sojusz), suma par-tur: seed 4242 0/0; seed 7 PRZED 24 (maks. 3 na turę), PO 0.
- Podmiany partnera (seed 7): 3 PRZED i 3 PO; odnowienie po jednej turze bez umowy: 1 PRZED i 0 PO.
BLOKADY: brak. Uwagi dotyczące Chromium: przebieg seed 7 wymagał kilku wznowień ze slotu (Chromium zamykał stronę, runner ponawiał start); w ostatnich wznowieniach ustawiono MEASURE_CHROME_ARGS="--disable-gpu --mute-audio" (flagi renderu). Przebieg seed 4242 PRZED miał jedno nieudane wznowienie (exit 1) i poprawne kolejne. Dane wejściowe przebiegów są w scratchpad (poza repo).
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (przegląd wyniku PASS; brak decyzji właściciela z kryterium DECISION_REQUIRED). Obserwacja poza kryterium: podmiany partnera (3) występują w obu wersjach, więc nie są skutkiem ALLYCLEAN; osobny wątek wzorca podmiany (SOJUSZE-PODMIANA-WZORZEC-2026-11-25.md).
ZAŁOŻENIA: (1) PRZED = b1e4e04ab, PO = 107e30f5e zgodnie z dispatchem. (2) Ustawienia nowej gry: domyślne (--harder 0, bez --all-flags, player-ai 1), bo dispatch nie podawał flag; wynik dotyczy wariantu z flagami OFF. (3) Liczba sojuszy AI liczona z pokoj=sojusz (activeDeals), nie z status.
UWAGI-DLA-ORKIESTRATORA: (a) runner pomiaru ma wynik dla flag OFF; pomiar z flagami ON (ENABLEFLAGS) nie był zakresem tego dispatchu. (b) Tury powyżej 67 nie mierzone. (c) Dane dwóch ziaren; zalecany pełny bieg 150 tur po decyzjach o flagach dyplomacji.
DEPLOY/PUSH: NIE WYKONANO
