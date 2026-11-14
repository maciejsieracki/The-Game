STATUS: PASS-WITH-NOTES (punkt 1 TITLE: rozstrzygnięte (a) artefakt haka; punkt 2 DŹWIGNIA PODATKU: PASS na ziarnach 11 i 13; punkt 3 nie dotyczy — brak defektu; recepta „recruit przez panel” NIE_ZMIERZONO, patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-A1-GATE-TITLE-TAX-LEVER-Q1 — runda 1/5 (Operator SONNET, uzasadnienie w dispatchu: 3 nieudane rundy Haiku W80A)
GOAL: dowód w żywej grze (Chromium, bundle vite poza repo, ?civTest=1): (1) title przycisku „Zakończ turę” w blokadzie po REALNEJ akcji UI; (2) dźwignia podatku suwakiem UI: canEnd false→true, klik kończy turę.
BAZA: 735fde524 (origin/main), kod gry bez zmian (zero zmian gra/src i gra/data).
ZMIANY-COMMIT: nowy gra/tools/live-verify-wave-689-697-a1-title-tax.cjs; evidence: dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-689-697-A1-GATE-TITLE-TAX-LEVER-Q1/evidence/r1/ ; ten raport. Commit tylko tych ścieżek (git add <ścieżki>). SHA: patrz pole sha w wyniku (czubek tej pracy).

METODA (zero grantPlayerGold — w skrypcie występuje wyłącznie w komentarzu „ZERO grantPlayerGold”, żadnego wywołania):
- vite build --outDir <scratchpad>/dist-a1 (exit 0, „✓ built in 22.42s”); gra/node_modules = symlink do node_modules innego worktree (gitignored, poza commitem).
- Tury 1–10 naturalne (tryb przyspieszony), tura 11, render przywrócony (setFast false).
- Deficyt: 2 REALNE jednostki utrzymania gracza (hak spawnAiUnits(0,1) ×2) + disbandPlayerUnits(0) (zero usunięć, tylko markCityStateDirty) — tylko to jest hak. Od tej chwili WSZYSTKIE akcje to UI: realny klik chipa „Skarbiec” (data-act=skarbiec, element.click()), suwaki podatku `input[data-handel-key]` (Playwright fill = zdarzenie input, ten sam handler co mysz), suwak „Wyżywienie” `input[data-racje-key=poziom]` w sekcji Spichlerz panelu imperium, klik przycisku „Zakończ turę”.

WYNIKI (liczby z surowego wyjścia; evidence/r1/*stdout.txt i run1-*.json, gold-seed*-stdout.txt, result-a1-gold-seed*.json, zrzuty a1-seed*-g*.png):

(1) TITLE — ROZSTRZYGNIĘCIE: (a) ARTEFAKT HAKA, nie defekt gry.
 - Run 1 (seed 11, evidence/r1/run1-food-block-seed11-stdout.txt): blokada przy 2 jednostkach (turn 11). Po haku (bez updateHud): przycisk cls „end-turn is-disabled”, title = "" (jak w v4). Po REALNYM kliku w chip Skarbiec (otwarcie panelu): title = „Nie można zakończyć tury: Spichlerz państwa (żywność): po turze zabraknie 3. Pomogą: podatek złota: +2 złota/turę; obniżka racji żywności: +8 żywności/turę; rozwiązanie jednostek (złoto): +12 złota/turę; rozwiązanie jednostek (żywność): +12 żywności/turę.” Po realnym ruchu suwaka Nauka→60 title odświeżony na żywo (liczba „podatek złota” +2 → +6). Czyli ścieżka UI (updateHud/refreshD1bHud) odświeża tooltip; hak spawnAiUnits/disbandPlayerUnits nie woła updateHud, więc tooltip zostaje pusty do pierwszej akcji UI.
 - Run 2 (seed 11, gold-seed11-stdout.txt) i seed 13 (gold-seed13-stdout.txt): po suwakach UI i po zdjęciu żywności suwakiem Wyżywienie title = „Nie można zakończyć tury: Skarbiec (złoto): po turze zabraknie 2. Pomogą: podatek złota: +5 złota/turę; rozwiązanie jednostek (złoto): +12 złota/turę; rozwiązanie jednostek (żywność): +12 żywności/turę.” (zasób, kwota minusu, dźwignie — zgodne z komunikatBramki). Zrzut tooltipu: nie (natywny `title` nie jest renderowany w headless screenshot); dowód = getAttribute('title') w JSON (kryterium dopuszcza).
 - Przy canEnd false→true (po dźwigni) title znika (""), przycisk cls „end-turn et-signal” (bez is-disabled).

(2) DŹWIGNIA PODATKU (suwak UI) — PASS na seed 11 i seed 13 (identyczne wartości):
 - Stan blokady (tylko złoto: brakuje 2; żywność zdjęta suwakiem Wyżywienie 8→0): split przed = Skarb 0% / Nauka 60% / Zamożność 40%; canEnd false; klik „Zakończ turę” w blokadzie: tura 11→11 (blokada działa, brak zakleszczenia widocznego klikiem).
 - Dźwignia: suwak Zamożność→20, Nauka→0; split po = Skarb 50% / Nauka 0% / Zamożność 50% (adjustHandelSplit rozdziela resztę); canEnd false→true; HUD Skarbiec „+4 / −8” (netto po zmianie, skarbiec 10 → po turze ≥ 0); klik „Zakończ turę”: tura 11→12 (PASS).
 - Zapisane wartości suwaka przed/po: wyżej (lever_split w result-a1-gold-seed{11,13}.json).
 - Uwaga: kwota „podatek złota: +5” w tooltipie vs faktyczna poprawa: 2 brakujące złota pokryte (po zmianie netto −8 vs −12 przed: +4 widoczne w HUD; zgodne co do znaku i wystarczalności).

 Wyniki pomocnicze (run 1, deficyt żywności i złota): przy blokadzie spichlerza (żywność 3) dźwignia podatku NIE zdejmuje blokady (zgodnie z kodem: czyRuchNaprawczy per stock) — ostatnia dźwignia „obniżka racji” (suwak Wyżywienie) jest osobną; w run 1 po Nauka→0/Skarb 80% canEnd pozostał false, title zmienił się na wariant bez „podatek złota” (lever_button) — tooltip dynamicznie wypada z listy dźwignię, której zysk spadł do 0. Spójne.

TESTY:
- node --check skryptu: ok. Runner: seed 11 run1 (food) fatal -, errors []; seed 11 run2 (gold) fatal -, errors []; seed 13 fatal -, errors [].
- seed 12: NIE_ZMIERZONO — dwa uruchomienia: „page.evaluate: Target page, context or browser has been closed” w pętli tur 1–11 (stdout „[]”, evidence/r1/gold-seed12-stdout.txt); powód: crash karty Chromium przed turą 11 (nie zbadany; infra, nie ścieżka bramki). Zastąpione ziarnem 13 (wymóg „2 ziarna”: 11 i 13).
- git diff --check: czysty (patrz sekcja ZMIANY, wykonane przed commitem).
- grantPlayerGold: 0 wywołań.

BLOKADY / NIE_ZMIERZONO:
1. Deficyt zbudowany haczykiem spawnAiUnits (realne jednostki w `units`), a nie rekrutacją przez panel rekrutacji — hak jest jedyną nie-UI częścią; recepta „title po rekrutacji przez UI” NIE_ZMIERZONO (konkretnie: ścieżka rekrutacji przez panel wymagałaby selektorów kart rekrutacji i zakupu jednostek, których wpływ na updateHud nie jest wykazany w tej rundzie; dowód (a) opiera się na suwaku podatku/chipie, które wołają updateHud w kodzie: main.ts ~27973 onOwnerDefaultChange → markCityStateDirty(); updateHud()).
2. seed 12 crash Chromium — patrz TESTY.

UWAGI-DLA-ORKIESTRATORA:
UWAGA-1: Przy „disbandPlayerUnits/spawnAiUnits” hak nie odświeża HUD; jeśli kiedyś realny przepływ „jednostka zmienia prognozę bez updateHud” istnieje w grze (np. rozwiązanie jednostki przez UI, rekrutacja), tooltip mógłby się opóźniać — nie zmierzone; minimalna propozycja na wypadek wykrycia: wywołanie updateHud()/refreshEndTurnButton po markCityStateDirty w ścieżkach rekrutacji/rozwiązania (brak dowodu defektu, tylko hipoteza).
UWAGA-2: Przycisk w blokadzie ma `is-disabled` i `disabled:false` (klik jest obsługiwany i odrzucany w canPlayerInitiateEndTurn) — to zachowanie zamierzone (klik 11→11), nie defekt.
UWAGA-3: Skarbiec w tym scenariuszu: bramka blokuje przy skarbcu 10 i prognozie −12 (po turze zabraknie 2); w gate liczona jest prognoza po ZAKOŃCZENIU TURY, a nie „gold < 0 teraz”.
UWAGA-4: Szybki powód awarii seed 12 nieznany; w środowisku było ~2.3 GB wolnej RAM podczas startu (free -m), możliwy OOM karty; do potwierdzenia osobno.

RUNDY: 1/5 (Operator SONNET).
NASTĘPNY KROK: Evaluator (SONNET): zweryfikować wyniki z evidence/r1/ (surowe stdouty + JSON), ocenić czy recepta „rekrutacja UI” jest wymagana do zamknięcia (a); Obrona (HAIKU).
DEPLOY/PUSH: NIE WYKONANO (brak READY_FOR_DEPLOY; commit lokalny w worktree, bez pushu).
