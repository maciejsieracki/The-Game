# R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 — Final Control (runda 1/5)

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1
GOAL: ilość odbioru AI wynika z nadwyżki gracza (nie sztywny krok 10); uczciwość wyceny, cooldown 15, limit 1 oferty/AI bez zmian.
ZMIANY/COMMIT: oceniany kandydat c6d9830c9 (potomek bazy f1886bacf — potwierdzone; kod: tylko ai-trade-proposal.ts -7/+3 i test ai-trade-need-from-surplus-test.cjs). Ten raport = jedyna zmiana FC. Do integracji: NIC (integration_sha pusty).

## TESTY (surowe wyniki, własne uruchomienia na c6d9830c9)
- tsc --noEmit: exit 0
- ai-trade-need-from-surplus-test 8/0; ai-trade-proposal-to-player-test 25 OK; ai-trade-proposal-branch-test 10/0
- Bramki: logic 213/213; tech-tree 20/0; research ALL GREEN; unit-replace 21/21; combat exit 0; unit-power 6/0
- git diff --check baza..kandydat: czysty; merge-tree z origin/main: bez konfliktów (drzewo 5cdf2163)
- ai-trade-oneshot-overpay-limit-test: czerwony na bazie (dług #379), nie uruchamiano ponownie.

## DOWÓD DECYDUJĄCY — REGRESJA W ŻYWEJ GRZE (ZMIERZONO)
`node tools/ai-trade-wiring-e2e-live-test.cjs` (headless Chromium, realny endTurn, vite build poza repo):
- BAZA f1886bacf (ai-trade-proposal.ts z bazy): exit 0, "44 pass, 0 fail".
- KANDYDAT c6d9830c9: exit 1 (powtórzone 2x, w tym drugi raz na tym samym bundle). FAIL „REALNY endTurn: AI składała graczowi propozycję wymiany cyklicznej" — stół pusty (tableLen 0), wiring przerwany, kolejne fazy (ignorowanie, zapis/wczytanie, akceptacja, okno dyplomacji) nie wykonane.
- Selekcja w teście (selectAiTradeBarter, ta sama funkcja) NADAL zwraca ofertę; oferta nie dociera na stół przy realnym endTurn. Przyczyna NIE ZMIERZONA (hipoteza: większe ilości bez sufitu odpadają na późniejszym filtrze enqueue/podglądzie gracza). Zmiana na bazie rzeczywiście jedyna różnica (bundle budowany z samego ai-trade-proposal.ts bazy vs kandydata).
To ŁAMIE kryterium (c) i sens GOAL: po zmianie AI w scenariuszu E2E przestaje składać ofertę graczowi. Evaluator i Obrona tego nie wykryli (zarzut 8 mówił „niezmierzone").

## ZARZUTY EVALUATORA
1. Brak pomiaru (a): NAPRAW (brak liczb przed/po; dispatch dopuszcza NIE_OSIĄGNIĘTO wyłącznie z liczbami).
2. Brak zrzutu Chromium (d): NAPRAW (dispatch: „NIE pomijaj"). Dodatkowo zrzut jest nieosiągalny, dopóki oferta nie trafia na stół (regresja wyżej).
3. Test behawioralny słaby (atrapy wyceny, A3 nie rozróżnia): NAPRAW — realny E2E pokazał, że atrapa przeoczyła regresję; dodać asercję na realnej wycenie/gate lub na wyniku endTurn.
4. Ryzyko wydajności bez sufitu: NAPRAW (pętla giveQty×receiveQty rośnie >1000×; trzeba pomiaru kosztu tury lub górnego limitu pętli — limit jest NOWYM progiem, więc wymaga propozycji/ABC albo wprost dowodu, że koszt jest znikomy).
5. Zmiana balansu (odbiór ograniczony tylko nadwyżką gracza, bez potrzeby AI): DO DECYZJI CZŁOWIEKA — realna decyzja produktowa; Obrona słusznie traktuje to jako literalny GOAL, ale właściciel powinien potwierdzić, że AI może prosić o całą nadwyżkę przy małym deficycie. Brak testu na limit 1/AI i cooldown 15 w tym temacie: ODDAL (kodu nie ruszano, istniejące testy branch 10/0 zielone) — o ile po naprawie e2e znów przechodzi.
6. Scenariusz właściciela — JEDNO miasto, 20 obywateli, epoka kamienia i epoka brązu (NIE 3 miasta/3 relacje): NAPRAW — niezmierzone; wymagane w następnej rundzie jako pomiar w żywej grze: miasto gracza z 20 obywatelami w Kamieniu i w Brązie, ilości oferty AI→gracz przed/po, zrzut okna oferty.
7. Baza nieaktualna względem origin/main (159d443b4+): ODDAL — merge-tree bez konfliktów.
8. Bramki referencyjne: ODDAL (odtworzone zielone, patrz wyżej); wiring-e2e-live ZMIERZONY przez FC i CZERWONY na kandydacie.

Liczba NAPRAW: 5 (1, 2, 3, 4, 6) + regresja własna => FAIL.

## BLOKADY
Harness measure-ai-trade-offer-frequency(-matrix).cjs zawiesza się w turze 10 (wg Obrony, także na bazie) — pomiar (a) wymaga naprawy harnessu albo osobnego, prostego pomiaru jednego miasta (wymóg właściciela), np. rozszerzenie ai-trade-wiring-e2e-live-test.cjs o ustawienie 20 obywateli i epokę Kamienia/Brązu.

## RUNDY
1/5 FC. Ostatni werdykt: FAIL.

## NASTĘPNY KROK
Operator (TEN SAM ID, runda 2): (1) znaleźć przyczynę, dla której oferta z kandydata nie trafia na stół w realnym endTurn, naprawić tak, by ai-trade-wiring-e2e-live-test dał 44/0; (2) pomiar jednego miasta z 20 obywatelami w epoce Kamienia i w epoce Brązu, ilości oferty przed/po (baza vs kandydat) + zrzut okna oferty; (3) test behawioralny na realnej wycenie; (4) koszt pętli bez sufitu zmierzony lub limit z propozycją ABC; (5) ABC właściciela dla zarzutu 5.

## UWAGI-DLA-ORKIESTRATORA
- Zarzut 5 (balans) wymaga ABC właściciela przed ponownym FC.
- Procesowo: Evaluator/Obrona nie uruchomili wiring-e2e-live; należy go dodać do obowiązkowych bramek tematów AI-trade.

DEPLOY/PUSH: NIE WYKONANO

---

# Final Control — RUNDA 2/5 (kandydat 68d61aa45f5683e0b015df291164ea9fcb969c3a)

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1
GOAL: ilość odbioru AI wynika z nadwyżki gracza (nie sztywny krok 10); uczciwość wyceny, cooldown 15, limit 1 oferty/AI bez zmian.
ZMIANY/COMMIT: kandydat 68d61aa45 jest potomkiem 53a13c35b i e956b5015 (merge-base --is-ancestor: tak). Kod gry: ai-trade-proposal.ts (zdjęty sufit needMax, bez zmian w r2), main.ts (+hooki testowe nnsDiag/setSpichlerzPanstwa/setCityPopulation, za bramką civTest), narzędzia testowe. Ten raport = jedyna zmiana FC. Do integracji: NIC (integration_sha pusty).
TESTY (surowe, uruchomione przez FC):
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/ai-trade-need-from-surplus-test.cjs`: 8 passed, 0 failed (test na atrapach — nie dowodzi uczciwości realnej wyceny).
- `ai-trade-wiring-e2e-live-test` AITW_POP=20, bundle kandydata (/tmp/claude-0/r2/bundle; zawiera hook setCityPopulation, brak aiNeedPerTurn): **39 pass, 7 fail**, exit 1. Oferta na stole `cegla 70 / drewno 350`, selekcja probe `cegla 200 -> zelazo 50`; realna wycena (diagPayload): givePn 350, receivePn 7000, fairBlock „Oferta nieuczciwa dla partnera … wymagane >= 7000 PW”, accepted false, a podgląd gracza (playerOk true) pokazuje 350=350. Odtworzone niezależnie przez FC (log /tmp/claude-0/fc/pop20-cand.log).
- Ten sam scenariusz, bundle bazy (sufit przywrócony): 43 pass, 3 fail (nadwyżka gracza = 10 — oczekiwane na bazie, oraz dwa ticki dostaw; ticki dostaw padają w POP=20 także na bazie, więc to nie regresja tematu). Oferta bazy przechodzi bramki uczciwości — różnica w parze/wycenie wynika ze zdjęcia sufitu.
- 5 bramek referencyjnych, unit-power, `git diff --check`: NIE ZMIERZONO przez FC (wyrok FAIL zapada na defekcie; dysk 147 MB wolnego, 100%); `diff --check` wg raportu obrony: czysty.
- Bundle: nie przebudowywany (brak miejsca); zgodność bundla z kandydatem potwierdzona pośrednio (grep: hook setCityPopulation obecny, aiNeedPerTurn nieobecny) — NIE jest to dowód bit-w-bit.

ZARZUTY:
1. Brak pomiaru 20 obywateli — pomiar teraz ISTNIEJE (obrona), ale ujawnia DEFEKT: NAPRAW. Realny endTurn kładzie na stół ofertę, którą bramka uczciwości AI sama odrzuca (7000 PW vs 350 PW), a okno gracza pokazuje „Możesz przyjąć”. Gracz może przyjąć umowę, której silnik wyceny nie uznaje za uczciwą (rozjazd podgląd vs bramka) — to wyciek uczciwości wprost naruszający GOAL („uczciwość wyceny BEZ ZMIAN”).
2. Test na atrapach — częściowo zaadresowany asercjami e2e (dolna granica > 10, diagPayload), ale właśnie te asercje są czerwone w POP=20 na kandydacie: NAPRAW (test jest bramką i musi być zielony, nie ominięty).
3. Koszt pętli bez sufitu na realnej wycenie — pomiar jednoscenariuszowy (probeBarter 296/425 ms kandydat vs 505 ms baza); skalowanie 20000/5000/100000 NIE ZMIERZONO, brak limitu wydajnościowego: NAPRAW albo uzasadnienie liczbami (po naprawie pkt 1).
4. Uwaga o hakach testowych/harness: ODDAL (informacyjnie).
5. Limit gameplayowy odbioru A/B/C: DO DECYZJI CZŁOWIEKA (orkiestrator -> właściciel). Defekt z pkt 1 jest argumentem za limitem lub korektą wyceny, ale wybór pozostaje decyzją produktową.
Co najmniej jedno NAPRAW => FAIL.

BLOKADY: defekt wyceny drewna w scenariuszu 20 obywateli (rozjazd pary selekcja vs stół: zelazo 50 vs drewno 350; receivePn drewna 7000 przy 350 sztukach vs 350 w podglądzie). Przyczyna niezbadana — dla Operatora r3: porównać opcje wyceny (`pnCyclicOpts` w enqueue, main.ts ~20977-21000) z `diagPayload`/`previewIncomingPlayerAccept`, sprawdzić czy wycena drewna zależy nieliniowo od ilości (cena skokowa/próg) i dlaczego filtr enqueue przepuszcza parę odrzucaną przez `handelFairnessGate`. Poprawka ma dotyczyć spójności wyceny/wyboru pary, nie progów uczciwości.
RUNDY: FC r2 po 2 rundach Operatora; limit 5 niewyczerpany (wraca do Operatora r3, to samo ID).
NASTĘPNY KROK: Operator r3 (naprawa jw., AITW_POP=20 ma dać pełny PASS na kandydacie, 5 bramek referencyjnych, pomiar kosztu pętli), Evaluator r3, FC r3; równolegle ABC właściciela o limicie odbioru (A bez limitu / B <=3x potrzeba AI / C powrót do sufitu).
UWAGI-DLA-ORKIESTRATORA: dysk / = 100% (147 MB wolnego) — sprzątanie przed kolejnymi rundami; w worktree FC symlink gra/node_modules (niecommitowany).
DEPLOY/PUSH: NIE WYKONANO
