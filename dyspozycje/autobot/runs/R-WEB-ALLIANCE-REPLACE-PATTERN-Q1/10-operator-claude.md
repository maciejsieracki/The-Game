STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza istniejących danych; bez zmian w gra/)
TEMAT: R-WEB-ALLIANCE-REPLACE-PATTERN-Q1
GOAL: Ustalić, którą ścieżką usuwania znikają sojusze AI↔AI przy podmianie (1-13 t33→t40, 1-19 t33→t58) i czy limit 2 sojuszy na cywilizację jest zachowany tura po turze.
ZMIANY/COMMIT: dyspozycje/analizy/SOJUSZE-PODMIANA-WZORZEC-2026-11-25.md (nowy) + dyspozycje/autobot/runs/R-WEB-ALLIANCE-REPLACE-PATTERN-Q1/10-operator-claude.md (ten raport). Commit: patrz sekcja SHA niżej. Zero zmian w gra/src i gra/data.
TESTY: nie wymagane (brak zmian kodu). `git diff --stat` przed commitem: tylko dyspozycje/ (potwierdzić w commicie).
BLOKADY: brak dowodu ścieżki usunięcia dla obu podmian (log ALLY66 nie ma wpisów [AA-REMOVE]; ALLYPATH nie odtworzył pary 1-13/1-19 z sojuszem). Limit 2 nie da się rozstrzygnąć między wierszami SYNC.
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator decyduje o biegu seed 4242 harder 0 z hakiem [AA-REMOVE] i licznikiem sojuszy civ, t30–t70, żeby rozstrzygnąć hipotezę płatności (platnosc-broken-tickDiplomacyPayments, dopłata D) i okno limitu. Nie ma decyzji o grze do właściciela.
DEPLOY/PUSH: NIE WYKONANO

## Najważniejsze ustalenia (skrót)
- Sojusz AI↔AI jest bezterminowy (wygasaTura = null, ai-ai-alliance-tick.ts): expireTreaties nie usuwa sojuszy. Kandydaci usunięcia: pozostałe 7 ścieżek z listy ALLYPATH.
- Hipoteza do sprawdzenia (nie ustalenie): platnosc-broken przy dopłacie D z płatnika, po której para ponownie zawiera sojusz przez tor tickAiAiAllianceRequests.
- Log ALLY66 ma tylko ALLIANCE-SYNC i ALLIANCE-PLAN; brak [AA-REMOVE], więc klasyfikacja podmian = NIE ZMIERZONO (nie ŁAMIE, nie ZGODNE).
- W ALLYPATH zaobserwowano sojusz_siostry_40_41 usunięty dwa razy (t55 i t56, zawarta=55): do wyjaśnienia, poza tym tematem.

## UWAGI-DLA-ORKIESTRATORA
- Szczegóły i cytaty w analizie: dyspozycje/analizy/SOJUSZE-PODMIANA-WZORZEC-2026-11-25.md.
- Nie zadawałem pytań do właściciela (zgodnie z dispatchem). Nie znaleziono decyzji o grze wymagającej ABC w tym temacie.
- Nie czytałem rejestru reguł ani przewodnika (poza kodem i komentarzami), więc klasyfikacja ZGODNE/ŁAMIE wymaga kolejnego kroku.
