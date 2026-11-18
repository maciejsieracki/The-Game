STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt, bez zmian kodu)
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-ADVANTAGE-DOUBLE-COUNT-AUDIT-Q1
GOAL: rozstrzygnąć, czy „Przewaga militarna” (+15) liczy się w Respekcie dwa razy.
ZMIANY/COMMIT: kandydat 9143c12e4; `git merge-base --is-ancestor 468488084cf8cd8d654300afffd8c3501d3e888d 9143c12e4` = OK. `git diff --stat`: 2 pliki, +102 (tylko 10-operator-claude.md i 30-obrona-claude.md w katalogu runu). Zero zmian w gra/. Allowlista zachowana.
WERDYKT MERYTORYCZNY: wniosek A (brak podwójnego liczenia w pasku Respektu) potwierdzony własnym odczytem kodu.
- main.ts:13049 zapisuje respektMilOffset jako NOMINAŁ (+15/-10), ZASTĘPUJE poprzedni (nie kumuluje); powrót do pasma neutralnego zeruje (13034).
- main.ts:3078-3080 (respektBarWithMilitaryOffset) i tick main.ts:45388-45393 liczą pasek jako clamp(baza z Mocy + jeden offset). Offset dodawany raz w obu ścieżkach; brak drugiego źródła +15 w rel.respekt.
OCENA ZARZUTÓW:
1. Brak odtworzenia zapisu właściciela w przeglądarce: ODDAL (uwaga). Wniosek oparty o kod i symulację; baza 72 nieweryfikowalna ze zrzutu. Nie blokuje.
2. +5 „Wygrana bitwy” nadpisywane przez tick (main.ts:13263-13270 vs 45388): nie zmierzone w runtime, poza zakresem. ODDAL jako uwaga.
3. Zakres linii funkcji 13010-13055: kosmetyka. ODDAL.
TESTY (własne, surowe, gra/ po npm ci --ignore-scripts):
tsc --noEmit exit 0; logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6 pass 0 fail;
diplo-respect-military-edge 12 OK/0 FAIL; -events 30 OK/0 FAIL; -offset 12 OK/0 FAIL.
NIE ZMIERZONO: diplo-respect-military-live-test (brak Chromium w oczekiwanej ścieżce), generator mapy, mgła-inwariant, mutacja.
BLOKADY: brak.
RUNDY: 2/5 (FC po Evaluatorze A i obronie PASS-WITH-NOTES).
UWAGI-DLA-ORKIESTRATORA (do pytania ABC właściciela):
(a) panel „ZA CO CIĘ LUBIĄ” pokazuje dwa wiersze +15 (suma +30), podczas gdy pasek ma +15; renderer nie sprawdzony - to najbardziej prawdopodobne źródło wrażenia „liczy się dwa razy" (rozbieżność prezentacji, nie obliczeń).
(b) +5 za wygraną bitwę może nie wchodzić do paska (nadpisanie przez tick) - do zmierzenia w osobnym temacie.
NASTĘPNY KROK: orkiestrator: pytanie ABC (a)/(b); ewentualny temat R-WEB-* na spójność panelu.
DEPLOY/PUSH: NIE WYKONANO
