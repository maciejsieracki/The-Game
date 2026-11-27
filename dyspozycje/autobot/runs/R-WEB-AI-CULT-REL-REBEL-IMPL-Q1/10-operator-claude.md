STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CULT-REL-REBEL-IMPL-Q1 (tag AIREBEL), runda 3/5 (DODATEK orkiestratora: ochrona ostatniego miasta AI)
GOAL: miasto AI będące OSTATNIM miastem swojego właściciela nie buntuje się (wariant OCHRONNY, bo nie istnieje ścieżka „AI bez miast → eliminateOwner”); gracz i tryb zgodności (null) bez zmian
BAZA: a3ffe64a7a8916a247e65eb8a95fd57293a5accb (origin/main, FC PASS-WITH-NOTES, runda 2)
ZMIANY/COMMIT: allowlista. gra/src/game/society-breakdown.ts (`shouldStartCityRebellion` + szósty argument `ownerOtherCities`), gra/src/main.ts (liczenie na żywo `rebelOwnerOtherCities` przed bramką, wywołanie z 6 argumentami), gra/tools/ai-city-rebellion-gate-test.cjs (sekcja R3 + asercje okablowania), dyspozycje/analizy/AI-REBELIA-WDROZENIE-2026-11-27.md (sekcja „Ostatnie miasto AI (AIREBEL-R3)"), dyspozycje/autobot/runs/R-WEB-AI-CULT-REL-REBEL-IMPL-Q1/10-operator-claude.md. SHA: patrz pole sha w wyniku (commit tej rundy). Pliki poza allowlistą: brak. Zmieniono przy okazji tylko kod z dispatchu; `gra/node_modules` (npm ci) usunięty po pracy.
TESTY:
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/0 (PASSED 33 / FAILED 0)
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed (exit 0)
- ai-test: 297 passed, 0 failed
- society-breakdown-test: 56 OK, 0 FAIL
- culture-religion-level-test: 59 pass / 0 fail
- culture-religion-test: 65 passed, 0 failed
- ai-city-order-need-wiring-test: 231 passed, 0 failed (of 231)
- ai-city-rebellion-gate-test: WYNIK PASS=37 FAIL=0 (w tym R3: AI 0 innych miast → brak startu na trudnym i łatwym; AI 1 inne → start; gracz 0 innych → start; null → brak startu; wiring 6 argumentów i liczenie na żywo)
- Mutacja czerwona R3 (zdjęcie `!aiKeepsLastCity` z bramki): FAIL 2/2 (przypadki „AI ostatnie miasto + trudny/łatwy → BRAK startu”); plik przywrócony, PASS=37/0 potwierdzone po przywróceniu.
- Pomiar MAKSIMUM (Trudny, Kultura i religia trudny, Koszty jednostek Wysoki ×4 = `--pace wysoki`, 60 tur, `--city-state 1`, seed 4242 i 7; bundle live zbudowany poza repo przez vite, scratchpad):
  PRZED = a3ffe64 (bundle z git archive tej bazy), PO = ten commit.
  | Ziarno | Stan | Miasta AI t60 | AI krytyczne t60 | Miasta w buncie (−99) t60 | Jednostki wojskowe AI t60 | AI z 0 miast w dowolnej turze |
  |---|---|---|---|---|---|---|
  | 4242 | PRZED | 148 | 59 | 10 | 148 | 0 |
  | 4242 | PO | 148 | 59 | 10 | 148 | 0 |
  | 7 | PRZED | 137 | 55 | 16 | 134 | 0 |
  | 7 | PO | 137 | 55 | 16 | 134 | 0 |
  Wynik: zombie-AI (cywilizacja AI bez miast) = 0 w PRZED i w PO; PO nie zmienia żadnego wyniku w tych dwóch ziarnach (ochrona nie została wywołana przez symulację).
- Round-trip zapisu, hotseat, wygląd wpisu w przeglądarce: NIE ZMIERZONO (bez zmian w tej rundzie).
- Dłuższe biegi (>60 tur), inne ziarna, wymuszony scenariusz AI z 1 miastem w buncie skrajnym: NIE ZMIERZONO.
BLOKADY: brak dla kodu. Pomiar działa w pełnych przebiegach jednym wywołaniem (Chromium, ~5 min na ziarno), bez wznowień.
RUNDY: 3/5
NASTĘPNY KROK: FC (Final Control) przeciwko SHA czubka tej rundy; integracja i ewentualny deploy wyłącznie po READY_FOR_DEPLOY przez orkiestratora (Operator nie integruje, nie deployuje, nie pushuje).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Ochrona ostatniego miasta: sprawdzono, że nie istnieje ścieżka „AI bez miast → eliminateOwner”. Jedyne wywołania eliminateOwner w gra/src/main.ts: aneksja państwa-miasta (ok. linii 40383) i zdobycie stolicy (ok. 9410). Dowód: grep `eliminateOwner(` w main.ts; wariant OCHRONNY wybrany zgodnie z DODATKIEM.
- Wpis „Wydarzenia na świecie” dla buntu AI: poza zakresem tej rundy (zostaje warEventLog), zgodnie z DODATKIEM pkt 4. Do decyzji właściciela, czy bunt AI ma trafiać do trwałej listy Wydarzeń.
- Miasta w buncie AI są w pomiarze rozpoznawane jako owner −99 (brak haka „poprzedni właściciel”); przypisanie do AI pozostaje wnioskiem, NIE ZMIERZONO bezpośrednio.
- Pomiar PRZED/PO na tej samej bazie daje identyczne liczby: runner jest deterministyczny w tych dwóch ziarnach przy tym samym bundle'u logiki, więc różnice rzędu 1–2 miast z rundy 2 (PRZED 59 vs 57) dotyczyły raczej różnic między bundlami/przebiegami niż tej zmiany.
- Procesowo: podczas pracy wywołano `git checkout -- gra/src/game/society-breakdown.ts` przez pomyłkę w mutacji — NIE wykonano (polecenie odrzucone przez bramkę worktree); plik zweryfikowano (aiKeepsLastCity obecne, PASS=37/0).
