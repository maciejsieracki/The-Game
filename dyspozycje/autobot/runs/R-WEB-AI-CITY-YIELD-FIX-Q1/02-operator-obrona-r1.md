STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-YIELD-FIX-Q1
GOAL: Naprawić dopasowanie terenu w `hexCityScore`, zmierzyć wpływ na tempo ekspansji AI, ograniczyć skalowaniem (waga plonu). Decyzja o wdrożeniu: orkiestrator/właściciel.

OBRONA rundy 1 (Evaluator: PASS-WITH-NOTES, 6 zarzutów). Baza: commit Operatora `496865102`. Kod (`ai.ts`, `ai-params.json`, testy) BEZ zmian w obronie.

1. Brak pomiaru pełnej gry (kryterium 3): PRZYJMUJĘ w części, nie do naprawienia w rundzie. Pełna gra to ok. 200 s generacji świata i ok. 32 s na turę, czyli ok. 1 h na bieg, a Bash ma limit 590 s i zakaz tła. Pozostaje NIE_ZMIERZONO i DECYZJA_WYMAGANA dla orkiestratora: albo przyjąć pomiar zastępczy, albo zlecić 1 bieg (1 mapa × 100 tur) harnessem `--prepare`/`--dist`. Rekomendacja bez zmian: nie wdrażać do ROBOCZEJ przed tym jednym potwierdzeniem.
2. Zdegenerowana baza (PRE = 5 miast major na mapę Pangea): PRZYJMUJĘ jako ograniczenie, nie jako błąd. Procenty na małych liczbach nie są wskaźnikiem tempa. W raporcie liczby bezwzględne per ziarno zapisano w `evidence-sim-table-sensitivity.txt` (Pangea PRE [5,5,5,5,5] → 0,3: [5,5,5,10,5]). Ekonomia w symulacji pozostaje atrapą, co potwierdzam. Wartość wnioskowa symulacji: kierunek i rząd wielkości (waga 1 = +391%), nie dokładne tempo.
3. Wąskie plateau wagi: PRZYJMUJĘ, z dowodem. Nowy pomiar (15 map, 168×120, ten sam harness) mierzy dolny brzeg plateau: waga 0,20 = dokładnie PRE (130 → 130, no-op), waga 0,25 = waga 0,30 (130 → 135, +3,8%; Pangea +20%, Kontynenty i Wyspy 0%). Plateau to więc 0,25–0,30, a skok jest od 0,35 (wcześniejszy pomiar Operatora: Wyspy +27%). Po stronie niebezpiecznej (więcej ekspansji) margines 0,30 do 0,35 jest wąski; wartość 0,25 daje identyczny wynik i większy margines. Zostawiłem 0,30, żeby nie zmieniać zweryfikowanego przez Evaluatora kodu i testu (`ai-city-yield-test.cjs` asercja `= 0.3`), ale to jest bezpieczna korekta na decyzję orkiestratora (jedna wartość w JSON + jedna asercja). Zależność od odtworzenia `powerRank`/`clusterCenter` (wariant `--noboost`) pozostaje nieprzebadana w grze: NIE_ZMIERZONO, wchodzi w pomiar pełnej gry z pkt 1.
4. Czwarta kopia mapy id↔nazwa: ODRZUCAM jako wadę poprawki, PRZYJMUJĘ jako dług. `TERRAIN_NAME_TO_ENUM` (economy.ts:375) nie jest eksportowane, a `economy.ts` jest poza allowlistą (`ai.ts` tylko `hexCityScore` + helper). Eksport i unifikacja = osobny temat, np. `R-WEB-TERRAIN-ID-NAME-MAP-UNIFY-Q1` (economy.ts, units/setup.ts:423, hexContextTooltip.ts:86, helper w ai.ts). Do rejestru przez orkiestratora.
5. Mylące dowody (tabela dla wagi 0,4): PRZYJMUJĘ, poprawione. `evidence-sim-table.txt` przemianowany na `evidence-sim-table-w0.4-SUPERSEDED.txt` (git mv). Dodany `evidence-sim-table-sensitivity.txt` z tabelą dla wdrażanej wagi 0,3 oraz 0,2, 0,25, 1 i PRE, liczoną skryptem z surowych JSON (`evidence-sim-pre.json`, `evidence-sim-w0.3-final.json`, `evidence-sim-w1.json`; nowe biegi 0,2 i 0,25 w tym samym formacie). Uwaga w `01-operator-r1.md` pkt o dowodach nadal prawdziwa (wskazuje starą nazwę pliku; jest to zapis historyczny rundy 1).
6. Evaluator nie odtworzył całości (timeout generacji Wyspy): nie jest zarzutem do kodu. W obronie wygenerowałem 15 map od nowa (Wyspy ok. 115 s na mapę przy równoległym uruchomieniu), wynik 0,25 i 0,2 spójny z surowymi danymi Operatora (PRE i 0,3), co dodatkowo potwierdza determinizm harnessu.

TESTY: `node gra/tools/ai-city-yield-test.cjs` 42 PASS, 0 FAIL (powtórzone); `tsc --noEmit` EXIT=0 (powtórzone). Kod produkcyjny nie zmieniony od `496865102`.
ZMIANY/COMMIT: tylko `dyspozycje/autobot/runs/R-WEB-AI-CITY-YIELD-FIX-Q1/**` (ten plik, `evidence-sim-table-sensitivity.txt`, rename starej tabeli). SHA: patrz końcowa odpowiedź.
BLOKADY: pomiar pełnej gry (NIE_ZMIERZONO), DECYZJA_WYMAGANA po stronie orkiestratora (pkt 1, opcjonalnie pkt 3: waga 0,25).
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control, potem integracja orkiestratora; decyzja o pomiarze pełnej gry.
DEPLOY-PUSH: NIE WYKONANO
