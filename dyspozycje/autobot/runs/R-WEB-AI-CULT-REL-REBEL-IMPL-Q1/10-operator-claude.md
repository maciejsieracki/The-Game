STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CULT-REL-REBEL-IMPL-Q1 (tag AIREBEL)
GOAL: miasta AI w buncie skrajnym po wyczerpaniu łaski buntują się tak samo jak miasta gracza (decyzja 39B), tylko przy ustawieniu „Kultura i religia” ≠ null; tryb zgodności (null) bez zmian.
ZMIANY/COMMIT: allowlista: gra/src/main.ts (bramka rebelii + wpis dziennika buntu AI), gra/src/game/society-breakdown.ts (helper aiCityRebellionEnabled), gra/tools/ai-city-rebellion-gate-test.cjs (nowy), dyspozycje/analizy/AI-REBELIA-WDROZENIE-2026-11-27.md, dyspozycje/autobot/runs/R-WEB-AI-CULT-REL-REBEL-IMPL-Q1/10-operator-claude.md. Commit: patrz sekcja SHA niżej (czubek pracy). Baza: 44649038c (origin/main). Runner pomiaru NIE zmieniany.
TESTY:
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/0 ALL GREEN
- unit-replace-test: exit 0
- combat-test: All sanity checks passed (exit 0)
- ai-test: 297 passed, 0 failed
- society-breakdown-test: 56 OK, 0 FAIL
- culture-religion-level-test: 59 pass / 0 fail
- culture-religion-test: 65 passed, 0 failed
- ai-city-order-need-wiring-test: 231 passed, 0 failed
- ai-city-rebellion-gate-test (nowy): PASS=18 FAIL=0
- Mutacja M1 (bramka wraca do samego isHuman w main.ts): FAIL (2 asercje). Mutacja M2 (helper ignoruje poziom): FAIL (1 asercja). Obie cofnięte; plik po cofnięciu PASS=18.
- Pomiar (60 tur, Trudny, Kultura i religia trudny, Koszty jednostek Wysoki ×4, runner --city-state 1 --pace wysoki): seed 4242 PO: AI miasta 148, AI krytyczne 59, miasta w buncie (frakcja −99) 10, AI jednostki wojskowe 148; seed 7 PO: AI miasta 138, krytyczne 56, w buncie 16, jednostki 134. PRZED (z dokumentu AICULTREBEL, nie ponowione): s4242 149/57, s7 149/75; buntów AI 0.
- Round-trip zapisu, hotseat, wygląd wpisu w przeglądarce: NIE ZMIERZONO.
BLOKADY: brak dla kodu. Pomiar: wznowienie z zapisu slotu padało w Chromium dwa razy (SIGSEGV przy ładowaniu); pełne przebiegi jednym wywołaniem przeszły. PRZED nie ponowione w tej rundzie.
RUNDY: 1/5
NASTĘPNY KROK: FC (Final Control) przeciwko SHA czubka; orkiestrator decyduje o integracji i ewentualnym deployu (Operator nie deployuje).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Wpis buntu AI idzie do dziennika Wydarzeń (warEventLog), nie do trwałej listy „Wydarzenia na świecie” w oknie dyplomacji: tamta lista jest typowana pod wojny/pokoje par AI (newsKind), a zmiana wymagałaby zmiany typu zapisu i UI. Do rozstrzygnięcia, jeśli właściciel chce dokładnie „Wydarzenia na świecie”.
- Miasta w buncie AI są rozpoznawane w pomiarze jako owner −99 (brak haka „poprzedni właściciel”); przypisanie do AI to wniosek, nie bezpośredni pomiar.
- Suma miast AI + miast w buncie po rozejściu symulacji (158 / 154) jest wyższa niż PRZED (149); porównanie PRZED/PO jest przybliżone.
- Zmienione pliki poza dispatchem: brak. Dodano node_modules w gra/ (npm ci, ignorowane przez git) — usunięte po pracy.

SHA: patrz wiadomość końcowa Operatora (commit z kodem i raportem).
