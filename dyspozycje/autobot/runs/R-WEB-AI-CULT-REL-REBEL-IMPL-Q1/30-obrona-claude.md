STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CULT-REL-REBEL-IMPL-Q1 (tag AIREBEL)
GOAL: miasta AI w buncie skrajnym po wyczerpaniu łaski buntują się tak samo jak miasta gracza (decyzja 39B), tylko przy ustawieniu „Kultura i religia” ≠ null; tryb zgodności (null) bez zmian. Obrona: odpowiedź na 4 zarzuty Evaluatora.
ZMIANY/COMMIT: baza kandydat 88b933e0d (detach). Commit obrony (czubek = pole sha): gra/src/game/society-breakdown.ts (nowa czysta bramka shouldStartCityRebellion), gra/src/main.ts (wywołanie bramki, import), gra/tools/ai-city-rebellion-gate-test.cjs (sekcja A i D przepisane na zachowanie), dyspozycje/analizy/AI-REBELIA-WDROZENIE-2026-11-27.md (tabela PRZED/PO ponowiona, NIE ZMIERZONO), ten raport.
TESTY (surowe wyniki tej rundy):
- tsc --noEmit: exit 0
- ai-city-rebellion-gate-test: PASS=31 FAIL=0 (było 18/0; dodano 13 asercji zachowania bramki startu)
- Mutacje czerwone na bramce (w society-breakdown.ts, każda cofnięta, test po cofnięciu 31/0):
  - ignorowanie poziomu (`return isAiOwnerCity`): FAIL=2
  - usunięty warunek `!hasRebelState`: FAIL=2
  - AI bez warunku poziomu (`ownerIsHuman || ownerIsAi`): FAIL=1
- society-breakdown-test: 56 OK, 0 FAIL
- culture-religion-level-test: 59 pass / 0 fail
- culture-religion-test: 65 passed, 0 failed
- ai-test: 297 passed, 0 failed
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: ALL GREEN
- combat-test: All sanity checks passed (exit 0)
- ai-city-order-need-wiring-test: 231 passed, 0 failed (of 231)
- Pomiar PRZED ponowiony w tej rundzie (baza 44649038c, bundle z git archive, ten sam runner, 60 tur, Trudny / Kultura i religia trudny / Koszty jednostek Wysoki ×4, --city-state 1):
  - seed 4242 PRZED: miasta AI 149, krytyczne 59, jednostki AI 144, bunt 0
  - seed 7 PRZED: miasta AI 149, krytyczne 75, jednostki AI 138, bunt 0
- Pomiar PO ponowiony (kandydat + poprawka obrony, bundle z worktree):
  - seed 4242 PO: miasta AI 148, krytyczne 59, jednostki AI 148, bunt (−99) 10
  - seed 7 PO: miasta AI 137, krytyczne 55, jednostki AI 134, bunt (−99) 16
  - Poprzednia runda Operatora dała dla s7 PO 138/56/134/16; różnica 1 miasta i 1 krytycznego to szum przebiegów (niedeterminizm), NIE ZMIERZONO wielu przebiegów.
- NIE ZMIERZONO: round-trip zapisu miasta w buncie AI, hotseat, wygląd wpisu w przeglądarce.
BLOKADY: brak dla kodu. Chromium padł raz przy wznowieniu z slotu (PRZED s7, t30); ponowienie tym samym poleceniem przeszło.
RUNDY: 2/5 (runda 1: Operator 10-operator-claude.md; runda 2: ta obrona)

ODPOWIEDŹ NA ZARZUTY EVALUATORA:

1. Test sekcja D dowodzi okablowania tekstem main.ts; zachowanie tylko przez czystą funkcję.
   PRZYJMUJĘ i POPRAWIAM. Warunek startu buntu wyodrębniony do czystej funkcji `shouldStartCityRebellion(shouldTrigger, hasRebelState, ownerIsHuman, ownerIsAi, level)` w society-breakdown.ts; main.ts woła tę funkcję (zamiast składać warunek inline). Sekcja A testuje ją na wejściach (AI/gracz/barbarzyńca × łatwy/normalny/trudny/null × bunt/brak × już w buncie). Mutacje z zarzutu (wyłączenie bramki AI, ignorowanie poziomu) są teraz wykrywane przez zachowanie, nie przez tekst. Sekcja D zostaje tekstowa wyłącznie dla samego wywołania w main.ts (main.ts nie daje się wykonać w teście jednostkowym); to jedyny fragment nieprzetestowany zachowaniowo i jest jawnie opisany w nagłówku testu.

2. Wpis buncu AI idzie do warEventLog (dziennik Wydarzeń), a nie do worldDiploNewsList („Wydarzenia na świecie”); dodatkowo wpis tylko gdy gracz ma kontakt z właścicielem.
   PRZYJMUJĘ jako odstępstwo od dispatchu pkt 3 (dispatch wymagał „Wydarzeń na świecie”). NIE POPRAWIAM w tej rundzie, bo poprawka wykracza poza allowlistę: wpis w worldDiploNewsList wymaga rozszerzenia typu WorldDiploNewsEntry (gra/src/game/diplo-world-news.ts: newsKind, pary a/b) i renderu w gra/src/ui/diploListHud.ts, plus zapisu w meta (round-trip). Warunek kontaktu zostaje — odpowiada na „widoczne/znane graczowi” z dispatchu.
   DECYZJA DLA ORKIESTRATORA: (a) zostaje dziennik Wydarzeń (stan obecny, bez zmiany zapisu i UI), albo (b) osobny temat z rozszerzeniem allowlisty o diplo-world-news.ts i diploListHud.ts. Operator nie rozstrzyga.

3. Pomiar PRZED nieponowiony (wartości z dokumentu), sumy miast nieporównywalne, bunty rozpoznane jako owner −99.
   PRZYJMUJĘ i POPRAWIAM: PRZED zmierzony ponownie tym samym runnerem na bazie 44649038c; PO ponowione na bundle kandydata z poprawką. Tabela w dyspozycje/analizy/AI-REBELIA-WDROZENIE-2026-11-27.md. Ponowny PRZED s4242 dał 59 krytycznych (dokument: 57), więc wartości z dokumentu były przesunięte o szum. Sumy miast AI + w buncie (PO s4242 158, PO s7 153) są wyższe niż PRZED (149) i porównanie jest przybliżone; przypisanie buntów do AI pozostaje wnioskiem (brak haka „poprzedni właściciel”), NIE ZMIERZONO bezpośrednio.

4. NIE ZMIERZONO: round-trip zapisu, hotseat, wygląd wpisu, skutki dla eliminacji cywilizacji AI przy buncie ostatniego/stołecznego miasta.
   PRZYJMUJĘ jako NIE ZMIERZONO (bez poprawki w tej rundzie: wymaga osobnych przebiegów z zapisem i hotseatem, których ta runda nie obejmuje). Ustalenie z kodu, bez pomiaru: ścieżka `transferCityToRebelFactionWithLedger` (main.ts, ~41737) tylko przepisuje `city.ownerId` na frakcję −99 i nie wywołuje `eliminateOwner`; eliminacja przy przejęciu stolicy jest w ścieżce podboju (~9410). Czy cywilizacja AI bez miast po buncie ostatniego miasta pozostaje „żywa”, NIE ZBADANO. Zgłaszam do orkiestratora jako ryzyko do osobnego sprawdzenia przed deployem.

UWAGI-DLA-ORKIESTRATORA:
- Decyzja o miejscu wpisu buncu AI (punkt 2): dziennik Wydarzeń vs „Wydarzenia na świecie”.
- Ryzyko eliminacji (punkt 4, kod): bunt ostatniego/stołecznego miasta AI może zostawić cywilizację bez miast; wymaga pomiaru lub testu przed deployem.
- Poziom maksymalny: gra Trudny, Kultura i religia trudny, Koszty jednostek Wysoki ×4 (przyjęte za maksimum; nie sprawdzano, czy runner oferuje wyższy poziom — NIE ZWERYFIKOWANO).
- Bunty AI w pomiarze PO (10 i 16 miast w t60) to zmiana gry: decyzja właściciela, czy to zamierzony poziom.
- node_modules w gra/ zainstalowane (npm ci, ignorowane przez git) i usunięte po pracy; pliki pomiaru w katalogu scratchpad obrony.

SHA: czubek obrony to commit z tą wiadomością (pole sha w wyniku).
NASTĘPNY KROK: Evaluator (obrona) i Final Control przeciwko SHA czubka; decyzje z UWAG-DLA-ORKIESTRATORA należą do orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
