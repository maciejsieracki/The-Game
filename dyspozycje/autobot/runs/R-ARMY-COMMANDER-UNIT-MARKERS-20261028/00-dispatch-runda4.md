# AutoBot dispatch — map render proof and adjacent baseline

TEMAT: `R-ARMY-COMMANDER-UNIT-MARKERS-20261028`  
RUNDA OPERATORA: 4/5  
DATA: 2026-10-28  
BAZA: `origin/main` = `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`  
WORKTREE: `/tmp/the-game-commander-markers-20261028`  
BRANCH: `codex/R-ARMY-COMMANDER-UNIT-MARKERS-20261028-integration`

## Zlecenie

Naprawić braki dowodowe z FC r3 w tej samej karcie: uruchomić Chromium aż do gotowej mapy i wykonać screen z odznaką na produkcyjnej jednostce, albo zapisać start/timeout/błędy i przygotować wierny render sceny mapy w rzeczywistej skali/kamerze z produkcyjnym rendererem. Uruchomić wybrany sąsiedni zestaw testów na czystym `85f8c5f0` oraz kandydacie i podać liczbowe delty.

## Kryteria dowodu

- Zrzut gotowej mapy w rozdzielczości viewportu gry z gwiazdą Wodza nad gwiazdkami XP i widocznym emblematem; albo jeśli mapgen nie kończy się w rozsądnym limicie, pełna scena mapowa z właściwą kamerą/skalą i produkcyjnymi obiektami renderera oraz jednoznaczne oznaczenie, że to harness.
- Zapis czasu startu, czasu oczekiwania, kroku mapgen przy timeout oraz dokładnych błędów/URL 404.
- Ten sam wybrany zestaw testów sąsiednich uruchomiony na bazie i kandydacie; wyniki liczbowo oraz różnica.
- Raport Operatora aktualizuje r3 bez wydawania werdyktu Evaluatora/Final Control.

## Zakres

Nie zmieniać kodu produktu w tej rundzie, chyba że render-harness wymaga naprawy testowej w allowliście; każdą taką zmianę jawnie opisać. Allowlista raportów i dowodów w tym katalogu oraz odczytany kod testów. Bez zmian poza zatwierdzoną allowlistą produktu z rundy 3. Bez git add/commit/push/checkout/reset/stash, integracji i deployu.
