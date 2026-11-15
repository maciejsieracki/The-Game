# R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (kod i test behawioralny gotowe; pomiar częstości (a) i zrzut Chromium (d) NIE ZMIERZONO w tej rundzie — patrz NIE ZMIERZONO)
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1
GOAL: ilość, którą AI chce odebrać od gracza, wynika z nadwyżki gracza (zapas ponad rezerwę / tury), a nie ze sztywnego kroku 10. Uczciwość wyceny (bramki givePn/receivePn, evaluateProposal, okno uczciwości), cooldown 15 i limit 1 oferty na AI pozostają bez zmian.
BAZA: f1886bacf6476f85c5619e81a6e978d8cce0c5e7 (origin/main), detached.

## ZMIANY / COMMIT

- `gra/src/game/ai-trade-proposal.ts` (selectAiTradeBarter): usunięty sufit `needMax` (max(krok, ceil(-netRate)) znormalizowany do kroku). Ilość odbioru `feasibleReceiveMax` = `receiveMax` (nadwyżka gracza: (stock − rezerwa)/tury + netRate, znormalizowana do kroku handlu). Deficyt AI nadal jest warunkiem wejścia pętli. Bramki `fairnessGate` i `evaluateExactPayload` nie zmienione.
- `gra/tools/ai-trade-need-from-surplus-test.cjs` (nowy): test behawioralny, 8 asercji (A: ilość zależy od nadwyżki 1000→100, 400→40, 100→10; B: brak nadwyżki / brak flagi surplus → brak oferty; C: AI bez deficytu → brak oferty; D: bramka wyceny nadal odrzuca niesprawiedliwą pozycję).
- `gra/src/main.ts`: NIE zmieniany (wywołanie `selectAiTradeBarter` ma te same wejścia).
- `dyspozycje/autobot/runs/R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1/10-operator-claude.md`: ten raport.
- Brak zmian w `gra/data/ai-params.json`, `WERSJE.md`, manifeście, `rust-port`.

Uwaga semantyczna dla orkiestratora: usunięcie sufitu „krok 10” oznacza, że AI może w jednej ofercie prosić o tyle, ile gracz ma nadwyżki na turę (ograniczone już tylko bramkami wyceny i evaluatorem). Jest to bezpośrednia realizacja GOAL, ale zmienia zachowanie AI — FC powinien to zatwierdzić w pomiarze.

## TESTY

- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/ai-trade-need-from-surplus-test.cjs`: 8 passed, 0 failed (po zmianie).
- Mutacja: przywrócenie pliku z bazy f1886bac (stary sufit) → `5 passed, 3 failed` (asercje A2, A1, A4 czerwone). Plik z poprawką przywrócony i zweryfikowany.
- `node tools/ai-trade-proposal-to-player-test.cjs`: 25 assertions passed (zielony; asercja receiveQty=10 nadal zgodna, bo pierwsza uczciwa para wychodzi na kroku 10 przy tej cenie).
- `node tools/ai-trade-proposal-branch-test.cjs`: 10 passed, 0 failed.
- `node tools/ai-trade-oneshot-overpay-limit-test.cjs`: CZERWONY — `FAIL: main.ts enqueue filter calls aiOneshotHandelOverpaysPlayer ...` (znany dług z dispatchu: asercja tekstowa na main.ts). Nie jest to skutek tej zmiany: diff nie dotyka main.ts ani ścieżki jednorazowych ofert. Wypisane osobno jako czerwone-na-bazie.
- `ai-trade-wiring-e2e-live-test.cjs`: NIE URUCHOMIONY w tej rundzie (wymaga żywej gry; patrz NIE ZMIERZONO).
- `git diff --check`: czysty (pusty wynik).
- 5 bramek referencyjnych: NIE ZMIERZONO w tej rundzie (nie wykonane w wyniku, nie podaję liczb).

## POMIAR (kryterium a)

NIE ZMIERZONO. Pomiar wymaga 3 ziaren × 150 tur × 3 relacji w headless Chromium (`tools/measure-ai-trade-offer-frequency-matrix.cjs`, runner wznawialny). W tej rundzie nie uruchomiono go; brak liczb przed/po. Cel 3–6/100 tur nie jest oceniony.

Powód: koszt czasu i CPU w jednej rundzie Operatora; nie chcę podawać wyniku bez surowych liczb.

## ZRZUT CHROMIUM (kryterium d)

NIE ZMIERZONO. Brak zrzutu okna oferty AI → gracz z ilościami z nadwyżki. Do wykonania w rundzie 2 (live, z `?civTest=1`).

## PROCEDURA NIE OSIĄGNIĘTA: ilość przy nadwyżce 100 i „brak spamu”

- Limit 1 oferty na AI i cooldown 15 — nie dotknięte kodem, nie testowane osobno w tej rundzie (istniejące testy `ai-trade-proposal-branch-test` zielone).
- Wydajność: pętla przeszukuje `giveQty × receiveQty` od maksimum w dół; przy dużej nadwyżce gracza liczba wywołań `resolvePayloadPn` rośnie (≈ receiveMax/10 razy aiGiveMax/10 w najgorszym przypadku). NIE ZMIERZONO czasu tury — do sprawdzenia w pomiarze (a).

## BLOKADY

- Brak żywego pomiaru (a) i zrzutu (d) — patrz wyżej.
- `ai-trade-oneshot-overpay-limit-test` czerwony na bazie (dług znany).

## RUNDY

1/5. Ostatni werdykt: brak (Operator). Decyzja wymagana: nie.

## NASTĘPNY KROK

Runda 2 (Operator Haiku, po FC tej rundy): pomiar (a) matrix 3×150×3 przed/po (baza f1886bac vs kandydat), zrzut Chromium (d), wykonać `ai-trade-wiring-e2e-live-test.cjs`, a także sprawdzić czas tury przy dużych nadwyżkach. Dopiero potem FC.

## UWAGI-DLA-ORKIESTRATORA

- Dług `ai-trade-oneshot-overpay-limit-test` (czerwony) — już w kolejce jako #379.
- Brak nowych progów liczbowych: zastosowano wyłącznie `receiveMax` (istniejąca nadwyżka) i `receiveStep`/`diplomacyNormalizeSurowiecIlosc` (istniejące).
- Wykonano `npm ci` w `gra/` worktree (71 pakietów); node_modules nie jest w commicie.

DEPLOY/PUSH: NIE WYKONANO

---

# RUNDA 2/5 (Operator HAIKU 5.5) — baza: 53a13c35b (FC r1 FAIL) + merge origin/main (e956b5015)

STATUS: FAIL (runda 2: pkt 1 ZROBIONY; pkt 2, 3, 4 NIE ZROBIONE — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1
GOAL: bez zmian względem r1 (ilość odbioru AI = nadwyżka gracza, uczciwość wyceny i cooldown 15 bez zmian).
ZMIANY/COMMIT: ten commit. Kod gry: tylko 2 wpięcia testowe w `gra/src/main.ts` (diagnostyka + ustawienie bufora spichlerza dla testu, obiekt `__aiTradeWiringTestDebug`); `gra/tools/ai-trade-wiring-e2e-live-test.cjs` (bufor spichlerza w scenariuszu, pomiar czasu tury, diagnostyka timeoutu). Logika selekcji `ai-trade-proposal.ts` NIEZMIENIONA od r1.

## PKT 1 — przyczyna regresji wiring-e2e-live (ZMIERZONO)
- Przyczyną NIE jest zmiana r1 w selekcji. Przyczyną jest bramka „Zakończ turę" NNS (ECON-NO-NEGATIVE-STOCKS, `nnsGateForPlayer`, FALA 724 z origin/main), która wchodzi w `canPlayerInitiateEndTurn` przy prognozie spichlerza państwa < 0.
- Dowód: w scenariuszu testu zerowany jest zapas żywności gracza (`setStock(0, k, 0)` dla kluczy cenowych) → spichlerz po turze = −48 → bramka blokuje EOT. Komunikat z gry: „Spichlerz państwa (żywność): po zakończeniu tury zabraknie 46".
- Potwierdzenie: `origin/main` (e956b5015, BEZ zmian tego tematu) daje TEN SAM błąd w tym samym miejscu (2. EOT po odrzuceniu, tura 2 nie rusza, powód `[EndTurn] blocked: prognoza skarbca/spichlerza < 0 (NNS)`). Base f1886bacf (przed FALA 724) = 44/0.
- Naprawa (test, nie gra): `setSpichlerzPanstwa(0, 100000)` w `setupScenario` (bufor żywności gracza; żywność nie jest w GIVE/RECV, więc nie zmienia pary handlowej).
- Wynik na kandydacie po naprawie: `ai-trade-wiring-e2e-live-test: 44 pass, 0 fail` (exit 0). Log: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/r2/e2e-cand4.log` (S = /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad).
- Uwaga procesowa: FC r1 widział zerwanie już w PIERWSZEJ fazie (tableLen 0). W moich 4 przebiegach faza 1 (oferta na stole, payload, okno dyplomacji, przycisk „Przyjmij" aktywny, tabela A1) przechodziła za każdym razem. NIE_ZMIERZONO, skąd rozbieżność z FC r1 (ich baza f1886bacf bez FALA 724; nie odtworzono).

## PKT 2 — pomiar „jedno miasto, 20 obywateli, Kamień i Brąz" — NIE ZROBIONE
- Nie zaimplementowano scenariusza 20 obywateli i epok. NIE_ZMIERZONO: ilości oferty AI→gracz przed/po w tych epokach.
- Dostępne dowody częściowe (kandydat, scenariusz e2e, nie pkt 2): zrzut okna dyplomacji z przyciskiem „Przyjmij" AKTYWNY: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/r2/ev-cand/05-okno-dyplomacji-przyjmij-aktywne.png`; zrzut stołu: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/r2/ev-cand/01-propozycja-na-stole.png`. To NIE jest zrzut scenariusza z 20 obywatelami.
- Tabela proporcji (grid, n=400 na parę, z e2e): cegla->zelazo: aiA1=5, player=360, both=5 | zelazo->cegla: aiA1=5, player=45, both=5 | drewno->kamien: aiA1=6, player=343, both=6 | kamien->drewno: aiA1=6, player=63, both=6 | zelazo->kamien: aiA1=1, player=22, both=1 | drewno->cegla: aiA1=4, player=370, both=4. (Liczby z surowego wyjścia testu.)

## PKT 3 — test behawioralny na realnej wycenie — NIE ZROBIONE
- `gra/tools/ai-trade-need-from-surplus-test.cjs` (8/0) nadal używa atrapy `resolvePayloadPn: () => ({givePn:10, receivePn:10})`. Test na realnej wycenie (`resolveProposalPn`/`evaluateProposal`) i mutacja „sufit wraca" NIE napisane. NIE_ZMIERZONO.

## PKT 4 — koszt pętli bez sufitu — CZĘŚCIOWO (tylko czas tury w e2e, bez porównania z bazą)
- Czas tury (headless Chromium, swiftshader, kandydat, scenariusz e2e z `[czas-tury]`): tura 1: 4,4–5,9 s; tury 2–4: 1,7–4,4 s. `probeBarter` (pełna selekcja jednej AI): 458–517 ms.
- NIE_ZMIERZONO: czas tury bazy f1886bacf w tym samym harnessie (kopia bazy nie ma zmian czasu w teście), oraz scenariusze 20000/5000/100000 z dispatchu. Licznik kombinacji giveQty×receiveQty NIE został ograniczony; nie ma nowego sufitu i nie został uzasadniony liczbami.

## Bramki
- `npx tsc --noEmit` (gra/): exit 0 (po ostatniej zmianie main.ts).
- `ai-trade-need-from-surplus-test`: 8 passed, 0 failed.
- `ai-trade-wiring-e2e-live-test` (kandydat po naprawie): 44 pass, 0 fail.
- Baza f1886bacf (kopia `git archive`): e2e 44 pass, 0 fail (kontrola).
- origin/main e956b5015 (kopia): e2e FAIL na 2. EOT (NNS) — potwierdza przyczynę.
- NIE_ZMIERZONO: pozostałe 4 bramki referencyjne + unit-power, `ai-trade-*` (poza powyższym), `ai-trade-oneshot-overpay-limit-test` (znany czerwony #379). `git diff --check`: czysto (CHECK_OK).
- NIE_ZMIERZONO: pomiar częstości ofert 3×150×3 (kryterium a) — harness `measure-ai-trade-offer-frequency*` zgodnie z dispatchem NIE naprawiany; nie uruchamiano pomiaru zastępczego.

## BLOKADY
- Pkt 2, 3, 4 (pełne) nie wykonane w tej rundzie (czas i zakres). Wymagają kolejnej rundy.
- Pytanie do ABC właściciela o limit (wariant A/B/C z dispatchu) — bez zmian, nadal otwarte.

## RUNDY
2/5. Ostatni werdykt FC: r1 FAIL. Ta runda: pkt 1 zrobiony, pkt 2–4 nie zrobione → FAIL.

## NASTĘPNY KROK
Runda 3 (ten sam ID): (2) scenariusz „jedno miasto, 20 obywateli" w epoce Kamienia i Brązu, baza vs kandydat, ilości oferty + zrzut okna; (3) test na `resolveProposalPn`/`evaluateProposal` + mutacja; (4) pomiar czasu tury baza vs kandydat w tym samym harnessie albo ograniczenie pętli z liczbami; (5) 4 pozostałe bramki referencyjne + unit-power.

## UWAGI-DLA-ORKIESTRATORA
- Bramka NNS (FALA 724) w teście e2e wymaga bufora spichlerza — zrobione w teście. Warto, żeby inne testy „scenariuszowe" z zerowanym zapasem żywności też to miały (w tym `ai-trade-oneshot-overpay-limit-test`, dług #379, może wpadać w ten sam EOT-block).
- Dwa wpięcia w main.ts (`nnsDiag`, `setSpichlerzPanstwa`) są tylko dla testów (obiekt `__aiTradeWiringTestDebug`, nie wpływa na grę).

DEPLOY/PUSH: NIE WYKONANO
