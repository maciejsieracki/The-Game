STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1
GOAL: domyslne wlaczenie szesciu flag twardszej dyplomacji (decyzja wlasciciela 2026-11-19), z zachowaniem skalowania FALI 886 i pokrycia OFF w testach.

ZMIANY/COMMIT:
- Kandydat 21cdc8937e16571bb0d8717b284b368e1c7e7210. `git merge-base --is-ancestor 46a706e4e... 21cdc8937...` = tak; origin/main (8f50028c3) tez jest przodkiem kandydata.
- `git diff --stat origin/main 21cdc8937`: 28 plikow, +254/-55. Kod gry = tylko 5 plikow danych JSON (flagi true; limit wojen: tylko `limitWojenAktywny.wartosc`, maxWojenEpoki/Naturalnych bez zmian, dopłata D = 1.0 bez zmian), komentarze w 7 plikach src/game, `DIPLO_HARDER_ENABLED_DEFAULT` czytane z danych (diplomacy-harder.ts, obok `harderParamsNow()` z FALI 886), hak `__diploAllFlagsMeasure.setAll` w main.ts. Reszta = testy diplomacji/AI i dyspozycje/autobot/runs/R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1/**. Wszystko w allowliscie; brak gra-robocza/, WERSJE.md, manifestu, rust-port.
- Raport FC: ten plik (commit tylko tego pliku).

TESTY (wlasne uruchomienie na kandydacie, surowe wyniki):
- tsc --noEmit: exit 0.
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0.
- ai-test: 292 passed / 5 failed — identycznie na origin/main (8f50028c3), przedistniejace.
- harder-unit 53/0; alliance-strength 34/0; zero-trust 44/0; war-limit 57/0; alliance-tick 19/19 (mutanty 8/8); alliance-limit 4/4 + wiring 4/4; coalition ZIELONE; all-flags-hook 35/0; ai-ai-alliance-measure-hook ZIELONY; diplomacy-war-level 28/28 (mutanty wykryte); penalty-preview 9/0.
- Przemiatanie wszystkich testow nie-live diplomacji/AI↔AI (war-rules*, diplomacy-*, ai-ai-*, diplo-*): jedyny czerwony test = war-rules-multiwar-main-guard (18 PASS / 3 FAIL); na origin/main wynik identyczny (3 te same FAIL). diplo-peace-gate-mutation-run 13/16 identycznie na main. Pozostale "RED" to analizatory/runnery wymagajace argumentow (rc=2), nie testy.
- Zywe: bundle vite poza repo (exit 0) + ai-ai-treaty-live-proof-breach-test: 12 OK / 0 FAIL, zero pageerror/console.error (potwierdza zarzut 2/odpowiedz 2).
- Pomiar ON (artefakty operatora, NIE powtarzalem): seed 4242 t5-t75 (15 wierszy), seed 7 t5-t70 (14 wierszy; plik pomiar-ON-seed7-summary.json/podsumowanie istnieje, wbrew zdaniu obrony "seed 7 nie uruchomiono" — rozbieznosc opisowa): 0 wierszy z NaN/Infinity, wojnyMax 1-2, maxSojDegPairs max 2 (limit 2 sojuszy nieprzekroczony w oknie), zero zachowan destrukcyjnych widocznych w oknie. 90 tur NIE ZMIERZONO.

OCENA ZARZUTOW (bez etykiet rol):
1. Hak setAll bez toru NAP -> ODDAL (uwaga). Dispatch definiuje pakiet jako szesc flag; torAktywny (dane false) nie jest w pakiecie, setAll nadal ustawia jawnie true/false szesc flag (nie null), test hooka pilnuje i mutuje oba warianty. Skutek: nowe pomiary ON nie sa porownywalne 1:1 z pomiarami r1 z rejestru (tam napTor=true) — do odnotowania w rejestrze.
2. Test breach z setWarLimitEnabled(false) -> ODDAL. Zweryfikowane przeze mnie na zywo: 12/0.
3. Pomiar r1 PARTIAL (t70-78), limit 2 sojuszy w runtime i t50 niepelne -> ODDAL (uwaga). Zgodnie z DODATKIEM 1 pomiar 90 tur przechodzi do VERIFY-LIVE; dostepne dane nie wykazuja przekroczenia limitu ani NaN.
4. war-rules-multiwar-main-guard 18/3 -> ODDAL (dlug testowy przedistniejacy, potwierdzone na origin/main).
Zadnego zarzutu nie kwalifikuje do NAPRAW.

BLOKADY: brak.
RUNDY: 3/5 (FC rundy 3; wczesniejszy FC r1 PASS-WITH-NOTES).
NASTEPNY KROK: integracja orkiestratora (merge, bramki, deploy na ROBOCZA po osobnej autoryzacji); VERIFY-LIVE: bieg wznawialny 90 tur seed 4242 i 7, limit 2 sojuszy w runtime, zaufanie t50; rejestr: opis napTor=true w pomiarach r1; dlug testowy war-rules-multiwar-main-guard (3 FAIL na main).

UWAGI-DLA-ORKIESTRATORA: decyzje wlasciciela otwarte: napTor (torAktywny, dane false) i dopłata D (1.0). Nie tworzono sesji, zadan ani harmonogramow.
DEPLOY/PUSH: NIE WYKONANO
