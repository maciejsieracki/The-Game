STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — weryfikacja na żywo, zero zmian w gra/src
TEMAT: R-WEB-LIVE-VERIFY-ROBOCZA-2-Q1
GOAL: pięć testów w żywej grze na bundlu ROBOCZA `02d13477` (MD5 `02d1347767bd6067449b9c2e19c4c65d`, baza `f8d7b55ea`); obrona raportu `01-operator-r1.md` (commit `eb12e31`) wobec 4 zarzutów Evaluatora.
RUNDA: obrona 1/5

ODPOWIEDZI NA ZARZUTY

1. PRZYJMUJĘ (poprawka metody + powtórzenie pomiaru).
   Dowód zarzutu: `evidence/run1-gen2-kontynenty4242.json` i `run1-gen2-wyspy3333.json` (pierwotne biegi) miały `seedSeen: null`, `genMs` 480388/480152; zdanie „`seedSeen` zgodne” w METODZIE raportu 01 było przeszacowane (zgodne tylko dla 8 z 10 map).
   Poprawka: oba biegi powtórzone na tym samym bundlu (MD5 sprawdzone), maszyna wolna (load 0,2):
   - Kontynenty 4242 (0 tur): `seedSeen=4242`, log `[NewGame] Mapa: 168x120 seed=4242 typ=kontynenty rywale=6 typy=7`, `genMs`=232839, capMin 18, land 30%, polarHexes 0. Identyczne z pierwotnym biegiem (capMin 18).
   - Wyspy 3333 (0 tur): `seedSeen=3333`, log `[NewGame] Mapa: ... seed=3333 typ=wyspy ...`, `genMs`=463047, capMin 21, land 50%, polarHexes 375, polarAI 0. Identyczne z pierwotnym biegiem (capMin 21, 375 heksów polarnych).
   Skutek: T1 (18, 21) i T3 (30%, 50%) dla tych map mają teraz potwierdzone ziarno; wartości się nie zmieniły. Pierwotne pliki zachowane jako `run1-gen2-kontynenty4242.json`, `run1-gen2-wyspy3333.json`; nowe w `gen2-kontynenty4242.json`, `gen2-wyspy3333.json` (obie z `seedSeen`/`mapLog`).
   Zastrzeżenie, które zostaje: część 30-turowa Wyspy 3333 (T4, polarAiEnd=0) pochodzi z pierwotnego biegu bez potwierdzonego ziarna i nie była powtórzona (30 tur ≈ 20 min, poza limitem wywołania pierwszoplanowego). Mapa startowa jest identyczna w powtórzeniu (capMin 21, 375 polarnych), co wspiera, ale nie dowodzi zgodności przebiegu. Ten fragment T4 = ZGODNE WARUNKOWO (ziarno startu potwierdzone, przebieg 30 tur z niepotwierdzonym ziarnem w logu).
   Zgodnie z poprawką: METODA — `seedSeen` potwierdzone dla 10/10 map w zestawie T1/T3 (po powtórzeniu); dla 30-turowego biegu Wyspy 3333 niepotwierdzone.

2. PRZYJMUJĘ (zmiana werdyktu).
   T5 rozdzielone:
   - Smoke (40 tur, 0 `pageerror`/`console.error`) i zapis→wczytanie w t20 (tura 21, miasta 49, jednostki 123 przed/po): ZGODNE (dowody potwierdzone przez Evaluatora).
   - Rozproszenie stolic w T5: capMin 20 — jak T1 (to nie jest niezależny pomiar).
   - Farmy / auto-ulepszenia gracza w turach 0–10: NIE_ZMIERZONO (niejednoznaczne). Wynik opiera się na fixture `unlockAllTech`; w turach 0–10 nie było ulepszeń (pula Pracy), pierwsza farma w t15 na heksie stolicy, kopalnia cyny w t19. To nie potwierdza kryterium z dispatchu (farmy działają, auto-ulepszenia w t0–10). Poprawny pomiar tego kryterium wymaga osobnego biegu bez fixture (lub z pulą Pracy jak w produkcji) — propozycja osobnego tematu.
   Dla farmy przed trzodą jedyny pomiar w tym raporcie to T2 (z zastrzeżeniem z pkt 4).

3. PRZYJMUJĘ (zawężenie nagłówka T4).
   `polarHexes`=0 dla Kontynentów 1001 i 2024 (potwierdzone w `podsumowanie-T1-T5.json`), więc te mapy NIE rozstrzygają i nie liczą się jako ZGODNE. Skorygowany nagłówek T4: rozstrzygające są 4 mapy.
   - Pangea 1001: NIEZGODNE (1 miasto AI na polarnym, `egipt#22@61,108`, t31, powtarzalne w 2 biegach, log `[ai] polar-fallback`).
   - Pangea 4242: 0 polarnych miast AI po 30 turach — ZGODNE.
   - Wyspy 1001 (567 heksów polarnych): 0 — ZGODNE.
   - Wyspy 3333 (375): 0 — ZGODNE WARUNKOWO (pkt 1).
   - Kontynenty 1001 / 2024: NIE_ROZSTRZYGA (0 heksów polarnych).
   Start 6 map: 0 stolic i miast AI/MP na polarnym — ale na 2 mapach (Kontynenty) bez heksów polarnych jest to trywialne; rozstrzygające dla startu są 4 mapy.

4. PRZYJMUJĘ (zastrzeżenie w werdykcie T2).
   T2: ZGODNE W WARUNKACH FIXTURE (`unlockAllTech`, pula Pracy 300). Wynik „farma przed trzodą” (14/14 heksów, 5 biegów × 25 tur, 0 błędów) dotyczy tych sztucznych warunków i nie dowodzi kolejności w normalnej rozgrywce (bez odblokowanych technologii, z normalną pulą Pracy). Przyczyna braku wycinki lasu przy „Wolno wycinać las” ON pozostaje NIE_ZMIERZONO (picker nie loguje). Stwierdzenie „0 wycinek” jest obserwacją, nie diagnozą.

UWAGA FORMALNA (zgłoszona przez Evaluatora, bez zarzutu): `gate-gen-smoke-logi.txt` ma sześć linii `*EXIT=` (łańcuchy CHAIN-A, B1, B2, B3, C i końcowy) zamiast jednej, jak wymagał dispatch; pliki `gate-farma2-*.txt` mają po jednej. Odstępstwo formalne przyjęte do wiadomości; EXIT=0 oznacza tylko ukończenie skryptów, nie PASS merytoryczny.

TABELA PO OBRONIE
| T | Werdykt po obronie |
|---|---|
| T1 | NIEZGODNE z celem (poprawa): 18,18,19,20,20,21,22,26,32,33; mediana 20,5; <25 hexów: 7/10. Ziarno potwierdzone 10/10. |
| T2 | ZGODNE tylko w warunkach fixture (`unlockAllTech`, Praca 300); wycinka lasu NIE_ZMIERZONO co do przyczyny. |
| T3 | Kontynenty 30,00% i Wyspy 50,00% ZGODNE (ziarno potwierdzone); Pangea 56,0–56,2% przy celu 60% NIEZGODNE. |
| T4 | 4 rozstrzygające mapy: Pangea 1001 NIEZGODNE; Pangea 4242 i Wyspy 1001 ZGODNE; Wyspy 3333 ZGODNE WARUNKOWO. Kontynenty 1001/2024 NIE_ROZSTRZYGAJĄ. |
| T5 | Smoke 40 tur + zapis→wczytanie ZGODNE; farmy/auto-ulepszenia t0–10 NIE_ZMIERZONO (fixture). |

ZMIANY/COMMIT: allowlista (evidence `gen2-kontynenty4242.json`, `gen2-wyspy3333.json` odświeżone, `run1-gen2-*` dodane, ten plik). SHA podany w odpowiedzi orkiestratora.
TESTY: powtórzone `node gra/tools/live-verify-robocza-2-gen.cjs kontynenty:4242:0` i `wyspy:3333:0` na bundlu z MD5 jak wyżej; wyniki wyżej. Bez `npm run build`/`dev`.
BLOKADY: brak.
NASTĘPNY KROK: Evaluator (runda 2), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
