STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-MOVE-PASS-THROUGH-OWN-UNITS-Q1
GOAL: Wlasne jednostki przejezdne, obce blokuja, laczenie tylko gdy ruch KONCZY sie na wlasnej; parytet gracz/AI/barbarzyncy/zwiad.
ZMIANY/COMMIT: ocena 1f3dc5d7d (baza 522271468); allowlista zachowana (main.ts tylko wspolna zajetosc/okno laczenia; reszta: setup.ts, planned-march.ts, ai*.ts, barbarians.ts, scout-auto-explore.ts, city-hex-movement.ts, warAllInCapital.ts, testy, runs/**). Brak WERSJE.md, gra-robocza, rust-port, src-tauri.

WERDYKTY ZARZUTOW:
1. Resztka mutacji w checkBarbCampDestroyedAt: ODDAL (naprawione d61a7afbf; main.ts:29580 ma clearedBarbCampHexes.add(keyOf(q, r)); grep MUTATION w gra/src = 0).
2. Regresja barb-camp-blacklist: ODDAL (samodzielnie 19 passed / 0 failed).
3. Oslabienie T7: ODDAL (zmierzone: remis rownowaznych tras, nie marsz na stolice; asercja zaostrzona o brak zblizania do ENEMY_CAPITAL; 24/0).
4. Chromium a-e i pomiar objazdow: ODDAL jako NIE_ZMIERZONO (brak vite build poza repo; zastepczo test jednostkowy z mutacjami 34/0). Diagnostyka ai.ts naprawiona. Podglad main.ts:7199 i :25294 to heurystyka wodza i hook testowy z pustym zbiorem (identycznie jak na bazie), nie podglad trasy gracza; podglad/zasieg uzywa occupiedForMove.
Brak NAPRAW. Brak DO DECYZJI CZLOWIEKA.

TESTY (wlasne, na 1f3dc5d7d, npm ci --ignore-scripts, node_modules usuniete): tsc --noEmit EXIT=0; move-pass-through-own-units 34/0; barb-camp-blacklist 19/0; war-allin-general-path-barb-defense 24/0; planned-march 18/0; ai-move-range 46/0; scout-auto-explore 25/0. Pozostale z raportu Obrony nie powtarzane. git diff --check nie uruchomiono (srodowisko blokuje forme polecenia): NIE_ZMIERZONO.
BLOKADY: Chromium a-e + pomiar objazdow AI (60 tur x 3 ziarna) NIE_ZMIERZONO; zastane czerwone: barb-camp-destruction 2 FAIL (jak baza), army-stack-commander-identity, egypt-movement-precedence, ai-march-avoid-foreign-territory C7. Hashe war-allin-capital-quick zmienione (uzasadnione), nie weryfikowane w tej rundzie.
RUNDY: 2/5 (FC)
KOLEJNOSC: origin/main = 522271468 (baza, bez zmian); SHA do integracji = commit tego raportu na 1f3dc5d7d; scalic na origin/main; wzgledem origin/rust-port/parity-v2 (b520768b0) niezalezne -- web nie wplywa na parity-v2, REPIN Rust po calosci weba.
NASTEPNY KROK: integracja orkiestratora, potem READY_FOR_DEPLOY; dopisac dlug Chromium a-e.
DEPLOY/PUSH: NIE WYKONANO
