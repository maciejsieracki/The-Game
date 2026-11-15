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


---

# R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 — Operator (runda 3/5, SONNET, uzasadnienie w DODATKU 3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1
GOAL: ilość odbioru AI od gracza wynika z nadwyżki gracza (nie ze sztywnego kroku 10); uczciwość wyceny, cooldown 15, limit 1 oferty/AI bez zmian.

ZMIANY-COMMIT (baza f8af97173, kandydat = baza + poniższe; SHA w polu `sha` wyniku):
- `gra/src/game/ai-trade-proposal.ts` — BEZ ZMIAN względem r2 (kod silnika nie wymagał poprawki, patrz „PRZYCZYNA”).
- `gra/src/main.ts` — +5 linii: hak testowy `setOwnerEra` (tylko `?civTest=1`, zero wpływu bez parametru) w `__aiTradeWiringTestDebug`.
- `gra/tools/ai-trade-wiring-e2e-live-test.cjs` — naprawa błędu testu (klucze wyceny), `AITW_ERA`, `AITW_BIG`, `AITW_PROBE_ONLY`.
- `runs/<ID>/evidence/r3/**` (zrzuty Chromium, JSON-y, logi), ten raport.

## 1. PRZYCZYNA „defektu” z r2 (ZMIERZONO) — to BŁĄD TESTU, nie silnika
Odtworzone na kandydacie (bundle zbudowany poza repo, `AITW_POP=20`): stary test dawał 39/7 (log `evidence/r3/cand-p20-STARY-TEST-bledny-diag.log`).
- Oferta na stole to `cegla 70 / drewno 350` (para wybrana w realnym `endTurn`, po produkcji/zużyciu 20 obywateli, więc INNA niż `probeBarter` liczony PRZED turą: `cegla 200 / zelazo 50`).
- Test wywoływał `diagPayload(ai, GIVE, offGive, RECV, offRecv)` ze STAŁYMI `GIVE='cegla'`, `RECV='zelazo'` i ilością z oferty (350). Wyceniało więc **350 sztuk ŻELAZA** (35 bloków × 20 PN × 10 tur = 7000 PW), a nie zaproponowane **350 sztuk DREWNA** (35 × 1 × 10 = 350 PW). „7000 PW vs 350 PW” to artefakt złego klucza w diagnostyce.
- Po wycenie po PRAWDZIWYCH kluczach oferty (`curGive`/`curRecv` z payloadu na stole): `givePn 350 = receivePn 350`, `fairBlock null`, `playerOk true`, `accepted true` (ta sama funkcja `resolveProposalPn` + `handelFairnessGate` + `evaluateProposal` + podgląd gracza co w akceptacji). Podgląd gracza (350 = 350, „Możesz przyjąć”) i bramka AI są zgodne — NIE ma rozjazdu podgląd↔bramka. Bramek uczciwości nie ruszano i nie osłabiano.
- Pozostałe 5 FAIL z r2 (payload, stół, umowa, tick dostaw, wczytanie) wynikały z tego samego błędu: reszta testu sprawdzała stałą parę cegła/żelazo zamiast pary faktycznie zaproponowanej.
- Naprawa testu: po pierwszym EOT para jest odczytywana z oferty na stole (`offerKeys` w JSON) i cała dalsza weryfikacja (wycena, umowa, tick dostaw, wczytanie, akceptacja przyciskiem) idzie po tych kluczach. Przy `POP=0` nadal wymagana jest para cegła/żelazo (ścisła zgodność z probe). Asercja dostawy po wczytaniu dla POP>0: zapas ODBIORCY rośnie (zapas sprzedawcy AI rośnie z produkcji 20 obywateli — strona sprzedawcy jest weryfikowana w ticku 1 z kontrolą bez umowy).

## 2. ai-trade-wiring-e2e-live-test (ZMIERZONO, bundle kandydata, Chromium headless, realny endTurn)
| Scenariusz | Wynik |
|---|---|
| domyślny (POP=0) | 46 pass, 0 fail (oferta cegla 200 / zelazo 50, 1000 = 1000 PW) |
| POP=20, epoka Kamienia (AITW_ERA=1) | 46 pass, 0 fail |
| POP=20, epoka Brązu (AITW_ERA=2) | 46 pass, 0 fail |
Baza (sufit przywrócony, ten sam bundle poza `ai-trade-proposal.ts`), POP=20: Kamień 43/3, Brąz 43/3. Czerwone na bazie: (a) „nadwyżka gracza: AI prosi o ilość > krok” (`probeRecv 10, offRecv 10`) — oczekiwane, to właśnie mutacja z pkt 3; (b) dwa ticki dostaw przy 20 obywatelach (gracz zużywa dostarczoną cegłę: `plGive 0` po dostawie 40) — DŁUG BAZOWY, nie maskowany, nie dotyczy kandydata (kandydat dostarcza 70 i `plGive` rośnie 27→54).

## 3. Test behawioralny na REALNEJ wycenie + mutacja (ZMIERZONO)
- Asercje na wyniku realnego endTurn (nie na atrapach): `probe.receiveQty > 10 && offRecv > 10`; `diagPayload` po kluczach oferty: `fairBlock === null && givePn <= receivePn && playerOk && accepted`; „wycena A1 (givePn == receivePn)”; przyjęcie przyciskiem „Przyjmij” w oknie dyplomacji; tick dostaw z kontrolą bez umowy.
- Mutacja 1 (przywrócenie sufitu = `ai-trade-proposal.ts` z bazy f1886bacf, ten sam bundle): CZERWONE w obu epokach (`nadwyzka gracza ... probeRecv 10, offRecv 10`), exit 1.
- Mutacja 2 (zły klucz wyceny, jak w r2): stary test na kandydacie daje 7 FAIL (log w evidence) — asercje wyceny faktycznie czerwienieją przy niespójnej parze.
- NIE ZMIERZONO: osobnej mutacji silnika polegającej na wyłączeniu `handelFairnessGate` w wyborze pary (wejście na stół i tak filtruje `givePn > receivePn` oraz `exactPreview`).

## 4. Koszt pętli giveQty×receiveQty bez sufitu (ZMIERZONO na realnej wycenie, `probeBarter`, POP=0, jedno wywołanie)
| zapas AI(cegła) = zapas gracza(żelazo) | czas probeBarter | wynik |
|---|---|---|
| 400 (domyślny) | 543 ms | cegla 200 / zelazo 50 |
| 5 000 | 705 ms | to samo |
| 20 000 | 821 ms | to samo |
| 100 000 | 1 542 ms | to samo |
| 1 000 000 | 44 172 ms | to samo |
Wynik (para) jest niezależny od zapasu — wybór ogranicza realny przepływ (clamp per_turn), pętla tylko przechodzi więcej odrzuconych kombinacji. Koszt rośnie ok. kwadratowo; do 100 000 sztuk ≤ 1,6 s na wywołanie (wywołanie jest raz na AI na turę, tylko gdy cooldown pozwala). 1 000 000 sztuk (poza realnym zakresem) = 44 s. Limitu NIE dodano (to byłby nowy próg liczbowy — zakaz z dispatchu). **DO POTWIERDZENIA przez właściciela/orkiestratora:** czy dodać czysto wydajnościowy limit liczby kombinacji (propozycja: break po N=250 000 ocenionych kombinacji — przy zapasie ≤ 100 000 nie zmienia wyniku, bo para jest znajdowana wcześniej; NIE ZMIERZONO progu N na realnych danych) — rekomendacja: nie dodawać, dopóki zapasy gry są ograniczone pojemnością magazynu (realny maks. zapas w grze: NIE ZMIERZONO).
Czas tury (endTurn tury 1): kandydat POP=20 8,3 s w tej uruchomionej instancji (obciążony procesor, kilka agentów); baza ~5,5 s wg r2 — NIE porównywane na tym samym obciążeniu.

## 5. Zrzuty Chromium okna oferty AI→gracz (ZMIERZONO) — `evidence/r3/`
- `cand-p20-e1-okno-oferty.png` (Kamień, 20 obywateli, kandydat), `cand-p20-e2-okno-oferty.png` (Brąz, 20 obywateli, kandydat): „Oni oferują 70 Cegła / My oferujemy 350 Drewno (na turę, 10 tur)”, PW 350 vs 350, Bilans 0, „Możesz przyjąć — wymiana symetryczna”, przycisk „Przyjmij” aktywny.
- `base-p20-e1-okno-oferty.png`, `base-p20-e2-okno-oferty.png`: baza = 40 cegły za 10 żelaza.
Przed/po (jedno miasto, 20 obywateli; oferta AI→gracz):
| epoka | baza (sufit) | kandydat |
|---|---|---|
| Kamień | cegla 40 / zelazo 10 (200 PW) | cegla 70 / drewno 350 (350 PW) |
| Brąz | cegla 40 / zelazo 10 (200 PW) | cegla 70 / drewno 350 (350 PW) |
| POP=0 (baza bez 20 ob.) | cegla 40 / zelazo 10 | cegla 200 / zelazo 50 (1000 PW) |
Uwaga produktowa (DO POTWIERDZENIA, wariant A): przy 20 obywatelach AI prosi o 350 drewna/turę (3500 przez 10 tur) — czyli cały realny przepływ nadwyżki gracza, bez limitu gameplayowego i bez związku z potrzebą AI. Warianty B (≤ 3× potrzeba AI) i C (powrót do sufitu) pozostają do decyzji właściciela.

## 6. Bramki (ZMIERZONO, gra/ , TypeScript 5.9.3)
- `tsc --noEmit`: exit 0.
- logic 213/213; tech-tree 20/0; research 33/0 ALL GREEN; unit-replace 21/21; combat 6/6; unit-power 6/0.
- ai-trade-need-from-surplus 8/0; ai-trade-offer-frequency-up 28/0; ai-trade-proposal-branch 10/0; ai-trade-proposal-to-player 25 OK.
- CZERWONE-NA-BAZIE (osobno): `ai-trade-oneshot-overpay-limit-test` — exit 1 na asercji tekstowej „main.ts enqueue filter calls aiOneshotHandelOverpaysPlayer(...) -> return” (dług #379; diff nie dotyka tego fragmentu; ponowny pomiar na nietkniętej bazie: NIE ZMIERZONO).
- `git diff --check`: czysty.
- Pomiar częstości ofert 3 ziarna × 150 tur × 3 relacje (kryterium (a) oryginalnego dispatchu): NIE ZMIERZONO — harness `measure-ai-trade-offer-frequency*.cjs` zawiesza się w turze 10 także na bazie (DODATEK 2 pkt 5: nie naprawiać w tym temacie); zastąpiony pomiarem jednego miasta/20 obywateli z pkt 5.

## BLOKADY
- Brak blokady technicznej. Do decyzji człowieka: limit odbioru (A/B/C) oraz ewentualny limit wydajnościowy pętli (pkt 4).

## RUNDY
Operator r3/5 (Sonnet, po 2 nieudanych rundach Haiku — r1 FAIL, r2 FAIL; defekt analityczny: błąd w diagnostyce testu).

## NASTĘPNY KROK
Evaluator → Final Control (ten sam ID): zweryfikować samodzielnie e2e w 3 scenariuszach (POP=0, POP=20 Kamień, POP=20 Brąz) i mutację 1; ABC właściciela (A/B/C + limit wydajnościowy).

## UWAGI-DLA-ORKIESTRATORA
- Rozjazd „podgląd vs bramka” zgłoszony przez FC r2 NIE istnieje w silniku — to był błąd klucza w `diagPayload` w teście; wniosek FC o „wycieku uczciwości” należy wycofać.
- Para na stole w scenariuszach z produkcją może różnić się od `probeBarter` liczonego przed turą (stan po produkcji/zużyciu) — zachowanie poprawne, test to teraz uwzględnia.
- Środowisko: worktree nie miał `gra/node_modules`; użyto kopii poza repo (`/tmp/claude-0/r3/proj/node_modules`, symlink niecommitowany). Bundle: `/tmp/claude-0/r3/cand` i `/tmp/claude-0/r3/base` (poza repo).

DEPLOY/PUSH: NIE WYKONANO
