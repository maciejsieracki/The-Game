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
