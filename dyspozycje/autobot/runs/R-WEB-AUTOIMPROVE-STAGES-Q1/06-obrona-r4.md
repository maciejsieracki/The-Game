STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTOIMPROVE-STAGES-Q1
ROLA: Operator (obrona) po Evaluatorze R4; baza d601f293b

Zarzut 1 (brak Chromium) — PRZYJMUJE. Zbudowano bundle do scratch poza repo (vite build --outDir), Chromium
/opt/pw-browsers/chromium-1194 uruchomiony, realna gra (seed 778899), gracz K2 (przycisk „Zrown.", zakres Panstwo),
unlockAllTech + pula Pracy 100000, 40 prob konca tury. Dowod: pomiar-r4o-live-chromium-k2.txt, skrypt live-r4o-chromium.cjs.
Wynik (tura 21): centrum miasta (47,24) = farma, bydlo, irygacja (korekta F zywo); poza tym kamieniolom, tartak,
warzelnia_soli (niedobory), lodzie_rybackie; ZERO drog, fortow, posterunkow. Ograniczenia (NIE_ZMIERZONO): przelacznik
wyrebu [data-ulepszenia-empire-wyrab] nie znaleziony w DOM (wolnoWycinacLas wylaczone) — wieloturowy wyrab gracza
live nadal NIE_ZMIERZONO; niedobory w grze to realne, nie wymuszone.

Zarzut 2 (19 rozkazow bez obywateli) — ODRZUCAM (dowod). Rozbicie pomiaru scenariusza A (5 ziaren x 40 tur):
wszystkie 19 to CENTRUM miasta (farma 8, irygacja 4, lodzie_rybackie 3, wyrab 3, bydlo 1); drogi poza obrabianymi
heksami: 0 (INNY:droga = 0). Zasada „budowa tylko przy obywatelach" dla drog zachowana. Centrum jest zawsze
pracowane (okolica.ts:626), a workedHexCoordsForCity je pomija (okolica.ts:276) — dlatego liczy sie jako „bez
obywateli" w pomiarze. Dowod: pomiar-r4o-bez-obywateli-centrum-vs-inne.txt. Uwaga dodatkowa: scenariusz B ma 10 tartakow
i 6 obozow na heksach nie-centrum bez obywateli (AI „surowce wszedzie", ECHO 2026-09-08), baza miala 370 takich
rozkazow nie-zlozowych.

Zarzut 3 (drogi przy stalym niedoborze drewna — decyzja operatora) — ODRZUCAM jako zarzut kodu, ZGLASZAM orkiestratorowi
jako pytanie ABC do wlasciciela (nieblokujace, kontekst K2/K3). Dispatch dopuszczal ZALOZENIE; zostaje opisane.
Pytanie: gdy niedobor surowca trwa mimo osiagnietego limitu tartakow (brak miejsca na ulepszenie), czy drogi
(a) startuja (obecnie, scenariusz B: droga 14, droga_brukowana 14), (b) czekaja do zaspokojenia niedoboru,
(c) startuja po N turach. Rekomendacja A (inaczej stale niedobory blokuja drogi bez konca). Kod bez zmian.

Zarzut 4 (fikstura nakladka='brak' w ai2-heks-po-heksie) — PRZYJMUJE CZESCIOWO. Fikstura zostaje (odwzorowuje
produkcje: centrum nie ma lasu po R-WEB-CITY-CLEARS-FOREST-Q1), ale lukê pokrycia zamknieto: (k3) w
autoimprove-stages-q1-test.cjs zmieniono z pomiaru na ASERCJE: centrum z lasem + niedobor drewna w K2 i K3 dostaje
tartak i ma identyczna sekwencje jak zwykly heks z lasem; parytet K2/K3. Przywrocenie filtra centrum (mutacje M3a/M3b
z mutacje-r4-autoimprove-stages-q1.txt) kasuje te asercje. Wynik: autoimprove-stages-q1 184/0 (bylo 179/0),
gate-r4o-autoimprove-stages-q1-test.txt EXIT=0. Zmieniony tylko gra/tools/autoimprove-stages-q1-test.cjs.

ZMIANY/COMMIT: gra/tools/autoimprove-stages-q1-test.cjs + pliki w katalogu runu; zero zmian w gra/src.
BLOKADY: brak. Niezmierzone: wyrab gracza live (wolnoWycinacLas).
RUNDY: obrona po R4
NASTEPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
Sprzatanie: node_modules, scratch i dist usuniete.
