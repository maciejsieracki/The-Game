STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar)
TEMAT: R-WEB-MEASURE-WARS-4242-VERIFY-Q1
GOAL: Obrona po ocenie Evaluatora (kandydat e6e10c565, raport 21c52cc5): odpowiedź na 5 zarzutów, poprawka dokumentu analizy, bez zmian kodu gry.
ZMIANY/COMMIT: dyspozycje/analizy/POMIAR-WOJNY-4242-PO-FALACH-891-896-2026-11-25.md (poprawki tabeli, kandydatów i ograniczeń); dyspozycje/autobot/runs/R-WEB-MEASURE-WARS-4242-VERIFY-Q1/30-obrona-claude.md (ten raport). Zero zmian w gra/, dane/ bez zmian (SHA256 bez zmian). Commit: SHA w polu sha wyniku.
TESTY: NIE URUCHOMIONO w tej rundzie. Zmiana dotyczy wyłącznie dokumentów; kod gry nieruszony, więc bramki z rundy 1 (tsc 0, logic 213/213, ai-test 297/0 z surowego wyjścia Operatora w 10-operator-claude.md) pozostają ważne dla tego samego kodu. Dane/ weryfikowane ponownie odczytem JSONL (zcat do katalogu roboczego poza repo).

ODPOWIEDZI NA ZARZUTY:

1. Werdykt sojuszy NIE DZIAŁA opiera się na jednej parze. PRZYJĘTE.
   Dowód z JSONL (diplo-seed4242-harder0.jsonl.gz): para 1–13 ma status=sojusz w turach 61–67; pokoj=sojusz w turach 61–65, pokoj=pokoj w turach 66–67. Pary 1–10 (nowa w t66) i 1–19 mają pokoj=sojusz. Bez pary 1–13 AI 1 ma 2 sojusze, czyli brak naruszenia. Werdykt w dokumencie zmieniony na „NIE DZIAŁA (do potwierdzenia)” z tym wyjaśnieniem. Dwie nowe pary w t66 (1–10, 7–13) potwierdzone danymi: w t65 ich nie było.

2. Brak ścieżki kodu w minimalnym odtworzeniu. PRZYJĘTE (częściowo).
   Dane JSONL nie zawierają pola ścieżki zawarcia; NIE ZMIERZONO, która ścieżka zawarła 1–10 i 7–13. Obie ścieżki wołają tę samą bramkę sojuszLimitPozwala (gra/src/main.ts ~25833: aiAiAllianceLimitPozwala; tickAiAiAllianceRequests w main.ts ~25846; gałąź sojusz_siostry_* w main.ts ~24932, komentarz „ta sama bramka limitu co w tickAiAiAllianceRequests”). Licznik to liczbaSojuszyCywilizacji z activeDeals (gra/src/game/ai-ai-alliance-limit.ts). Kandydat R-WEB opisany w dokumencie: zrzut activeDeals dla AI 1 w turach 65–66 przy tym samym seedzie. Hipoteza (NIE POTWIERDZONA): para 1–13 nie była w activeDeals jako aktywny sojusz przy bramce 1–10, skoro bramka przepuściła 1–10 przy liczniku < 2.

3. Porównanie 24×/68 tur z 3×/37–50 tur nie jest równe; dominujące powody to isAlreadyAtWarAnyRole i prog-tur-od-epoki. PRZYJĘTE.
   Zweryfikowane na era-seed4242.jsonl.gz (newRejections, era=bronze, 85 wierszy, tury 2–86): isAlreadyAtWarAnyRole 178, prog-tur-od-epoki 116; pairing-unresolved 3 (t77, t80, t83). Zakres pending Brązu poprawiony: liczba tur z pendingBraz=true to 40–50 (AI 1: 41, 4: 43, 7: 41, 10: 42, 13: 50, 16: 40, 19: 47); tury startu 37–46. Dokument oznacza porównanie 24→3 jako NIE like-for-like (bieg 68 vs 86 tur, inny stan gry i zestaw właścicieli). Sojusz jako przyczyna braku wojny Brązu: 3 odrzucenia pairing-unresolved (t77, t80, t83) wobec 294 odrzuceń bronze z powodami „już w wojnie” i progiem tur; sojusz nie dominuje.

4. Pomiar niepełny (era do t86, jedno ziarno, jeden bieg; runnery o różnych zestawach właścicieli). PRZYJĘTE jako notę.
   Dokument rozszerzony o zapis, że wyniki obu runnerów nie są łączone w jeden werdykt; cel 90/120 pozostaje NIE ZMIERZONO.

5. Niespójność z rejestrem (#85: „limit sojuszy DZIAŁA, seed 4242, 66 tur”) z nowym biegiem (naruszenie t66–67). PRZYJĘTE; wyjaśnienie częściowe.
   Źródło wpisu #85: dyspozycje/analizy/POMIAR-LIMITY-FLEE-FORTRING-2026-11-25.md, bieg --all-flags 1 (ON), maxSojuszyAI 2, naruszeniaSojuszyAI 0, 66 tur, inny bundle. Bieg w tej rundzie: flagi domyślne, origin/main 6fe46ac. Różne flagi dają inną trajektorię decyzji AI, więc wcześniejszy pomiar nie obejmuje tego samego stanu w t66. Rozbieżność NIE WYJAŚNIONA w pełni. Wpis #85 należy traktować jako „DZIAŁA w biegu ON z tamtej trajektorii”. Decyzja o korekcie rejestru po stronie orkiestratora.

BLOKADY: brak blokad kodowych. Otwarte: ścieżka zawarcia 1–10 i 7–13 (NIE ZMIERZONO), zgodność pola pokoj z activeDeals (NIE ZMIERZONO), wojny epoki do t120 (NIE ZMIERZONO, temat #90).

UWAGI-DLA-ORKIESTRATORA:
- Rekomendowane kandydaty R-WEB (nie naprawiane, zakaz tematu): (a) zrzut activeDeals dla AI 1, tury 65–66, seed 4242; (b) przyczyny „już w wojnie” (178) i progu tur od epoki (116) dla Brązu; (c) korekta wpisu #85 w rejestrze.
- Bundle /tmp/wars4242-dist i gra/node_modules w worktree do usunięcia przed sprzątaniem.

RUNDY: 2/5 (runda obrony po ocenie Evaluatora; Evaluator i Final Control jeszcze nie oceniali tej poprawki)
NASTĘPNY KROK: ponowna ocena Evaluatora dokumentu (zmiany: werdykt sojuszy „do potwierdzenia”, poprawione zakresy Brązu, nowe akapity o rozbieżności z #85).
DEPLOY/PUSH: NIE WYKONANO
