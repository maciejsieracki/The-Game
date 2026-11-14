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
