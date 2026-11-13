STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-EKO-WEALTH-MANPOWER-SPOL-PROD-REBASE-Q1-20260925 / G11
GOAL: Ograniczyć rabat werbunkowy Zulusów do Impi i stosować jeden floor/minimum1 po sumie dopuszczonych rabatów, przed tempem/trudnością.

Baza: istniejący checkout /workspace/The-Game, HEAD edb8fb56115e9dec0a58614dfb23ca6173d60c9a. Właściciel przeniósł zadania z Hermesa do Codexa, bez Kanbana. Zastane lokalne zmiany MP i F05 zostały zachowane. Bez worktree, commitów, pushu, deployu i harnessu po run55.

Źródło kontraktu: /workspace/handoff-pr141/owner-decisions/26-owner-decisions-20261015.md, decyzje 2A, 3B, 5A. Lokalne instrukcje README/proces/hand-off mają starszy routing Hermesa; obecna jawna dyspozycja właściciela obowiązuje w sprawie wykonania w Codexie.

Zmiany:
- production.ts: unitMoneyCost otrzymuje opcjonalną tożsamość jednostki. Wszystkie cztery rzeczywiste ścieżki przekazują Jednostka z danych: unitProductionItem, availableProduction, availableReplacementsFor, unitPurchaseCost. W całym src nie istnieją inne callery unitMoneyCost.
- civRecruitmentDiscount sumuje dodatnie, skończone rabaty rekrutacji z realizuje=ekonomia. Impi rozpoznaje przez jawny cel lub historyczny opis; przy braku nazwy jednostki rabat Impi pozostaje nieaktywny. Pojedynczy floor/max1 znajduje się po sumie w unitMoneyCost; tempo i trudność są stosowane później.
- civ-bonuses.ts: wyłącznie wpis recruitment Zulusów otrzymuje cel=Impi (wcześniej jednostki). Pozostałe cywilizacje zachowują dotychczasowy zakres.
- nowy test tools/impi-recruitment-discount-test.cjs; tools/civ-bonusy-test.cjs ma jawne fixture Impi i trzy dodatkowe negatywne kontrole zamiast dawnych oczekiwań ceny jednostki bez nazwy.

TESTY:
- node tools/impi-recruitment-discount-test.cjs: 680/680 PASS. Rzeczywiste dane Impi, Wojownika i Oszczepnika Zulu; rabaty 0/.1/.23/.87/1.2 w izolowanej fixture JSON, wszystkie tempa, owner0/owner1, trzy trudności; realne listy rekrutacji i zamiany. Sumowanie z dodatkowym dozwolonym rabatem, single-floor, minimum1, brak tożsamości, finite guard, wykluczenie F04 i wszystkie pozostałe cywilizacje.
- node tools/civ-bonusy-test.cjs: 39/39 PASS (wcześniej 36 asercji, trzy dodatkowe kontrole zakresu).
- node tools/unit-epoch-cost-test.cjs: 57/57 PASS.
- node tools/recruitment-cost-50-wood-test.cjs: 190/190 PASS.
- npm run typecheck: PASS.
- git diff --check: PASS.

Limity: prod_koszt_jednostki_proc NIE został podłączony. Wartości F04 niezatwierdzone; decyzja 3B zatwierdza regułę sumy, ale nie te dane. Test z syntetycznym legalnym rabatem dowodzi mechaniki sumowania bez zatwierdzania F04. Nie wykonano pełnego harnessu runtime/UI ani acceptance całego PR141. Zmiana nie ingeruje w zapis gry; ceny są wyliczane istniejącymi funkcjami, opłaconych kolejek nie przeliczano wstecz.

Niezależny review przekazany do /root/review_g11; niniejszy raport nie zastępuje Evaluatora/Final Control. Raport obejmuje wyłącznie hunki G11, nie zastane MP ani równoległą korektę F05.
BLOKADY: F04 nadal wymaga zatwierdzonego źródła danych; pełne acceptance PR141 i publikacja nie zostały wykonane.
RUNDY: pierwszy nowy ograniczony zakres Codex G11; historycznych liczników Hermesa nie resetowano ani nie odtwarzano.
NASTĘPNY KROK: niezależny Evaluator, potem osobny Final Control.
DEPLOY/PUSH: NIE WYKONANO
