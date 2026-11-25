# Wojna: wszystkie ścieżki końca stanu wojny (R-WEB-WAR-END-PATHS-Q1), runda 2

DATA: 2026-11-25 · BAZA: origin/main `78b14aba3` · zakres: wyłącznie analiza kodu `gra/src` i `gra/data` (zero zmian w grze).
Zakres: każda ścieżka, która zmienia relację pary z `wojna` na `pokoj` / `sojusz` / `neutralni` albo kończy wojnę inaczej
(eliminacja, reset, wczytanie). Numery linii = stan bazy `78b14aba3`; weryfikacja: `grep -n` po podanych nazwach funkcji.
Źródło danych pomiarowych: `dyspozycje/autobot/runs/R-WEB-MEASURE-WAR-DURATION-END-REASON-Q1/dane/summary.json` (w bazie `78b14aba3`).

Legenda „widoczność”: TAK = gracz dostaje modal / wpis w stole / wpis „Ważne” / podpowiedź; NIE = tylko `console.log`
albo brak komunikatu.

Konwencje z `gra/tools/war-duration-summarize.cjs`: `start` = pierwsza tura wojny; `end` = pierwsza tura bez wojny (`rec.turn`);
`duration` = wartość licznika `turnsAtWar` (`tw`) w OSTATNIM rekordzie wojny (czyli dla wojny zakończonej w turze `end` licznik
w ostatniej turze wojny = `end − start − 1`). Dla wojny 0 vs 1 (seed 4242): end 83 − start 42 = 41 tur, a `duration` = 40;
zgodność formuły sprawdzona na dwóch wojnach zakończonych cytowanych tutaj (0 vs 1: 83 − 42 − 1 = 40; 1 vs 7: 118 − 108 − 1 = 9).

## 1. Tabela ścieżek (plik:linia, funkcja, warunek, inicjator, min. tura, zależności, gracz, widoczność)

| # | Ścieżka | Miejsce (plik:linia) | Warunek | Kto inicjuje | Min. tura wojny | Zależy od | Dotyczy gracza | Widoczność dla gracza |
|---|---|---|---|---|---|---|---|---|
| P1 | Pokój z propozycji AI przyjęty przez gracza (stół/skrzynka) | `main.ts:22998` (`respondToHumanProposal`, akceptacja: `finalizePeaceTreatyBetween`), `main.ts:22832-22836` (`logPeaceVazne`) | gracz klika „przyjmij” na `zaproponuj_pokoj` | AI proponuje, gracz akceptuje | brak twardego minimum w samej akceptacji; to AI generuje propozycję dopiero gdy `aiPeaceTimeOk` (10 tur, P3) | gate AI: `ai.ts:7382` | TAK | stół + wpis „Ważne” (`main.ts:27029-27030` gate `logPeaceVazne`) |
| P2 | Pokój z cesją miasta: AI oddaje miasto za pokój | `ai.ts:7436` (`oferuj_miasto_za_pokoj`) → stół → jak P1 | AI `slabsza` militarnie, `cenaPokojuPn` pokryte miastami, `!csBlocksCession`, `!aiFeelsStronger` | AI | `aiPeaceTimeOk` = tury ≥ max(minTurWojny, 10) (`ai.ts:7382`) | zmęczenie (`wearinessPeaceCashPn`), miasta AI | TAK (gracz decyduje) | stół (oferta) |
| P3 | Oferta pokoju/rozejmu AI (bez miast, gdy AI słabsza lub sygnały pokoju) | `ai.ts:7546` (`zaproponuj_pokoj`, rodzaj pokoj/rozejm) | `stanWojny && !aiFeelsStronger && aiPeaceTimeOk && !peaceWeakerNoCityVsPlayer && (slabsza || wantsPeace)` | AI | **10 tur** (`PEACE_PROPOSAL_MIN_WAR_TURNS`, `diplomacy-peace-proposal-timing.ts:2`) | pozycja militarna, zmęczenie, zaufanie | TAK | stół |
| P4 | Żądanie miasta przez AI (zamiast pokoju) | `ai.ts:7468` (`zada_miasto_za_pokoj`) | `rw ≥ AI_MIASTO_ZADANIE_RW` i (tury ≥ próg lub zdobyte miasta) | AI żąda, gracz decyduje | `aiPeaceTimeOk` (10) | respekt, miasta gracza | TAK | stół |
| P5 | Pokój/rozejm proponowany przez gracza, oceniany przez AI | `main.ts:27616` (`peaceProposalIsTooEarly(ME(), ownerId, actionId)`), `main.ts:12508-12512` (`peaceProposalIsTooEarly` → `peaceProposalBlocked`), ocena AI: `game/diplomacy-proposals.ts:1579` (`ctx.warState && peaceProposalBlocked(...)` → `Pokój i rozejm dostępne po 10 pełnych turach wojny`), akcja `main.ts:27257` (`cywAction === 'pokoj'`), `main.ts:27269` (rozejm 5/10/15 tur) | propozycja gracza, akceptacja wg reguł AI (`evaluate`) po przejściu bramki czasu | gracz → AI | **10 pełnych tur wojny** (`peaceProposalBlocked`, `diplomacy-peace-proposal-timing.ts:5-9`); poza bramką czasu zależy od oceny AI (`diplomacy-proposals.ts`, pozycja, Respekt) | pozycja, Respekt, stance | TAK | wpis „Ważne” (`logPeaceVazne`) + podpowiedź (rozejm, `main.ts:27271`) |
| P6 | Rozejm (status przechodzi na `pokoj` od razu, z `truceUntilTurn`) | `main.ts:12940-12971` (`finalizePeaceTreatyBetween`, gałąź `isTruce`); bramka gracza: `main.ts:27616`, `main.ts:21539`, `main.ts:22300/22334`; blokada UI: `game/diplomacy-locks.ts:326` (trybut), `:354` (pokój/rozejm: „dostępne za N tur”) | zawarcie rozejmu (gracz lub AI) | gracz lub AI | **10 pełnych tur wojny** (ta sama reguła `peaceProposalBlocked`, `'rozejm'` w `PeaceProposalAction`); AI-propozycja: `aiPeaceTimeOk` (10) | długość 5/10/15 | TAK (wpis przy rozejmie gracza, `main.ts:27270`) | wpis + podpowiedź; przycisk zablokowany z licznikiem tur (`diplomacy-locks.ts:354`) |
| P7 | Koniec rozejmu → wojna (bez oferty) | `game/diplomacy-peace-lock.ts:257` (`truceEndToWarCore`) → `main.ts:13109-13113` (`declareWarAfterTruce`: `setDiploRelation(a, b, applyDiploEventTracked(..., 'wojna_wypowiedziana'))`) | wygaśnięcie rozejmu (`truceExpiryAction` `revert_to_war`), AI odrzuca / brak wojskowej zgody | tick (`main.ts:13211` `tickTruceExpiries`) | po wygaśnięciu rozejmu | siła armii (`truceEndAiAccepts`, `peace-lock.ts:171`) | to NIE jest koniec wojny (wraca wojna) | NIE: `applyDiploEventTracked` (`main.ts:13397-13412`) nie dopisuje wpisu do `warEventLog` ani nie pokazuje komunikatu; `declareWarAfterTruce` nie wywołuje żadnego logu |
| P8 | Koniec rozejmu → oferta pokoju dla gracza (skrzynka, timeout) | `game/diplomacy-peace-lock.ts:267-294`; `main.ts:13143` (`enqueueTruceEndOffer`); akceptacja: `main.ts:13119-13125` (`finalizePeace` → `finalizePeaceTreatyBetween`, wpis „Ważne” przy udziale gracza) | gracz to strona oferty; timeout w kolejnej turze → wojna (`truceEndOfferExpired`) | tick; zgoda gracza | po wygaśnięciu rozejmu | — | TAK | podpowiedź + wpis w skrzynce |
| P9 | Gracz odrzuca pokój po rozejmie | `main.ts:22874-22875` → `truceEndToWar` (`main.ts:13225`) | odmowa oferty z P8 | gracz | po rozejmie | — | TAK | jak P8 (wojna wraca; widoczność wpisem w skrzynce) |
| P10 | Pokój wymuszony 100% zmęczenia (para z graczem i para AI↔AI) | `game/war-weariness.ts:398-428` (`wearinessForcedPeaceDue`, próg `progWymuszonyPokoj` = 1,0 — pole `war-weariness.ts:27`, użycie `:360`), `main.ts:40745-40830` (`tickAiAiWarWeariness`), wywołanie raz na turę `main.ts:48531` | poziom = min(1, t/40 + 0,1·L) ≥ 1,0; `battlePending` odracza o turę (`war-weariness.ts:397`) | tick (silnik) | min. **10 tur** (`war-weariness.ts:380`); przy 10 turach wymagane L ≥ 8 | L = miasta utracone przez obie strony | TAK (para z graczem: `deferForcedPeace` → okno bez odmowy, `main.ts:26940-27020`) | modal `showForcedPeaceModal` (`ui/diplomacyAudience.ts:1248`) |
| P11 | Zmęczenie AI↔AI: oferta przegrywającego z ceną w miastach/ogonie (zaakceptowana) | `war-weariness.ts:477-493` (`offer_accepted`, `d.finalize`) | para AI↔AI (para z graczem: `war-weariness.ts:436` zwraca `none`), `turnsAtWar ≥ 10`, stopień > 0, cooldown 3 tury, cena pokryta, bilans ≥ −tolerancja | tick | **10 tur** (`war-weariness.ts:380`) | despair, cena `wearinessPeaceCashPn`, `karencjaPoPokojuTur 40` / `karencjaChronionegoTur 100` | NIE (tylko AI↔AI) | `console.log` (`[Dyplomacja] R-WEB-WEARINESS`) |
| P12 | Auto-pokój AI↔AI po 2 miastach zdobytych przez jedną stronę (bez zapłaty) | `main.ts:40863-40904` (`maybeResolveRegularWarOnCityCapture`), wywołania `main.ts:19066` (kapitulacja głodowa) i `main.ts:40969` (podbój); próg `forced-war-bronze.ts:55` = 2; `shouldEndForcedWarByCityCount` `forced-war-common.ts:65` | para AI↔AI (`main.ts:40865` `oldOwner===0 \|\| newOwner===0` → exit), para NIE w rejestrze wymuszonej wojny (`main.ts:40868-40873`), relacja `wojna`, bilans PW ≥ 0 u obu AI | silnik (zdobycie miasta) | **brak** minimum tur | liczba zdobytych miast (licznik `regularWarCapturedByPairKey`) | NIE | `console.log` (`[Dyplomacja] R-AI-WOJNY-ZWYKLE-CAP-DWA-MIASTA`) |
| P13 | Wojna wymuszona epoki (Kamień/Brąz/Żelazo): koniec przez pokój (dowolna ścieżka) → sprzątanie | `main.ts:12819` (stone), `12838` (iron), `13005-13009` (bronze), wywoływane z `finalizePeaceTreatyBetween` (`main.ts:12913`) | każdy pokój tej pary | jak wyżej | — | — | TAK/NIE jak ścieżka pokoju | jak ścieżka pokoju |
| P14 | Wojna wymuszona epoki: koniec przez limit 2 miast / limit 20 tur | **NIE WDROŻONE jako mechanizm końca** (patrz §3 L2): liczniki `capturedByAttacker/Defender` tylko zerowane (`main.ts:30614, 31531, 31677, 47422-47452`), stałe `WOJNA_*_MAX_CZAS_TRWANIA_TUR = 20` (`forced-war-bronze.ts:100`, `forced-war-iron.ts:93`, `forced-war-stone.ts:32`) bez konsumenta. Miasta NIE kończą wojny epoki świadomie: `main.ts:19063-19065` (R9) | — | — | — | — | — | — |
| P15 | Wojna wymuszona epoki: karencja po pokoju wymuszonym (`forcedEraPeaceUntilNextEra`) | `main.ts:12923-12928` | pokój między parą wojny wymuszonej | silnik | — | epoka | — | — |
| P16 | Eliminacja strony | `main.ts:40109` (`eliminateOwner`) | ostatnie miasto utracone | silnik | — | — | TAK (wpis eliminacji) | **Relacja NIE jest zamykana**: w `eliminateOwner` (`main.ts:40109-40260`) brak `setDiploRelation` (grep = 0 trafień); wojna z martwym ownerem zostaje w `wojna`, sprzątana przez `prunePendingForcedPeace` (`main.ts:26940`) i `sweepStaleForcedWarEntries` |
| P17 | Sojusz zerwany / wasalizacja | `main.ts:24664` (`if (!stillAllied) next = {...status:'pokoj'}`) — tylko z `sojusz`, nie z `wojna`; `syncRelationFromDeals` (`main.ts:24708`) ma `if (rel.status === 'wojna') return;` | — | — | — | — | — | **NIE kończy wojny** (sojusz nie wchodzi w `wojna`). Wasalizacja: NIE ZBADANO w pełni (akcja `12` w `diplomacyTradeBasket.ts`) |
| P18 | Reset/wczytanie gry | `main.ts:42391-42424` (zapis), `main.ts:52269-52378` (odczyt), `main.ts:50725`, `52276` (`regularWarCapturedByPairKey.clear()`) | wczytanie / nowa gra | gracz | — | — | — | brak zdarzenia końca (stan przywracany) |
| P19 | Testowe hooki kończące wojnę | `main.ts:31703` (`endWarByPeaceForTest`), `31395` (`setPeaceLock`), `30009`, `30722`, `32308`, `32733`, `31925`-`31928` | tylko `window.__…Test…` | test | — | — | — | NIE dotyczy gry |
| P20 | Pokój AI↔AI po prośbie przegrywającej AI (tor „R-AI-PEACE-2T”) | rejestracja: `main.ts:47535` (`registerAiAiPeaceRequest`) z komendy `zaproponuj_pokoj` / `oferuj_trybut_za_pokoj` w `main.ts:47530-47538`; tick: `main.ts:40646-40660` (`tickAiAiPeaceRequests`; `peaceAllowed` = `turnsAtWar ≥ PEACE_PROPOSAL_MIN_WAR_TURNS` w `main.ts:40654`); logika: `game/diplomacy-ai-forced-peace.ts:370` (`runAiAiPeaceTick`: `pairEligible` → `peaceAllowed` → `gateVerdict` → `accept_paid` / `force`); wywołanie raz na turę `main.ts:48525`; finalizacja `main.ts:40734` (`finalizePeaceTreatyBetween(loser, winner, undefined, rozejm?5-10-15)`) | prośba przegrywającej AI zarejestrowana; tura ≥ próg; werdykt bramki AI | AI ↔ AI (tick silnika) | **10 tur** (`main.ts:40654`) | pozycja militarna (`evaluatePeaceAiGate`: `wynik pozycjaMilitarna + turnsAtWar`), zapłata (`accept_paid`) | NIE (`pairEligible` odrzuca pary z graczem przy AI↔AI; log: `main.ts:40736` `console.log` `R-AI-PEACE-2T`) | `console.log` (wpis „Ważne” pominięty przez `logPeaceVazne` gate `main.ts:27029-27030`) |
| P21 | Pokój gracz↔gracz (hot-seat / propozycja międzyludzka) | `main.ts:22998` (`respondToHumanProposal`, akcja `accept`, `finalizePeaceTreatyBetween(p.fromOwnerId, p.toOwnerId)`), wpis „Ważne” `main.ts:22999-23003`; warunek ścieżki: `interHumanDiplomacyInbox`, `toOwnerId` = fotel akceptujący | fotel `toOwnerId` akceptuje propozycję `zaproponuj_pokoj` od innego fotela | gracz ↔ gracz (fotele) | **brak** twardego minimum w akceptacji (propozycja międzyludzka nie przechodzi `peaceProposalIsTooEarly`; NIE ZBADANO, czy UI blokuje ją przed 10 turą) | — | TAK (oba fotele) | wpis „Ważne” (`logPeaceVazne`, gdy `ME()` jest w parze) |

Uwagi do tabeli:
- Min. tura: **żadna** ścieżka AI→gracz i gracz→AI nie kończy wojny przed 10. turą wojny (P3, P4, P5, P6 — przez `peaceProposalBlocked`, `diplomacy-peace-proposal-timing.ts:5-9`; P1/P2 przez generację propozycji AI przy `aiPeaceTimeOk`). Od 10. tury działają P2, P3, P4, P10 (przy L ≥ 8), P11 (AI↔AI), P20 (AI↔AI, gdy istnieje prośba przegrywającej AI).
- P12 jest jedyną ścieżką AI↔AI bez progu czasu (nie wymaga 10 tur), ale wymaga zdobycia 2 miast.
- Para z graczem (`ME()` = 0): P10 działa (pokój wymuszony, okno z decyzją); P11 **nie działa** (`war-weariness.ts:436`); P12 **nie działa** (`main.ts:40865`, exit dla `0`); P20 **nie działa** (`pairEligible`); P3/P2/P4/P5/P6 działają przez stół; P21 działa między fotelami.
- P17 wasalizacja: poza zakresem dowodu; oznaczona NIE ZBADANO (nie twierdzimy, że nie kończy wojny).

## 2. Odpowiedź: co może skończyć wojnę gracza PRZED 40. turą

Gracz (cywilizacja 0) vs AI. Warunki wg kodu:

| Ścieżka | Najwcześniej | Warunek | Automatycznie? |
|---|---|---|---|
| P10 pokój wymuszony 100% | tura 10 (wymaga ≥ 8 miast utraconych przez obie strony) · tura 20 (≥ 5) · tura 24 (≥ 4) · tura 30 (≥ 3) · tura 36 (≥ 1) · tura 40 (0) | poziom = t/40 + 0,1·L ≥ 1,0; brak bitwy w toku | **Tak** w sensie skutku: gracz nie może odmówić, ale musi nacisnąć „przyjmij” w oknie (`deferForcedPeace`, `main.ts:26940-27020`); do tego czasu blokuje „Zakończ turę” |
| P1/P2/P3/P4 propozycje AI (pokój, pokój z miastem, żądanie miasta) | tura 10 | AI słabsza militarnie lub sygnały pokoju; `aiPeaceTimeOk` (`ai.ts:7382`) | **Nie**: gracz musi przyjąć/odrzucić |
| P5 propozycja gracza | tura 10 (`peaceProposalBlocked`, `diplomacy-peace-proposal-timing.ts:5-9`), potem decyzja AI | akceptacja AI wg `diplomacy-proposals.ts` | **Nie** (zgoda AI) |
| P6 rozejm (gracz lub AI) | tura 10 | zgoda obu stron | **Nie** |
| P8/P9 koniec rozejmu | po wygaśnięciu rozejmu (rozejm wymaga wcześniejszego zawarcia, czyli ≥ 10 tury wojny) | zgoda gracza na pokój, inaczej wojna | **Nie** |
| P21 pokój gracz↔gracz | brak progu w akceptacji (NIE ZBADANO w UI) | zgoda drugiego fotela | **Nie** (dotyczy tylko hot-seat, gdzie gracz jest jednym z foteli) |

Wniosek: przed 10. turą wojny gracz nie może zakończyć wojny z AI przez propozycje (P1–P6 blokowane czasem lub przez `aiPeaceTimeOk`). Od 10. tury gracz może zakończyć wojnę przez propozycje (P1, P2, P5, P6), które wymagają jego zgody lub zgody AI, oraz przez pokój wymuszony (P10), który wymaga kliknięcia, ale przy wyższym zmęczeniu z miast (L). Ścieżek automatycznych bez zgody gracza przed 40. turą nie ma poza P10. Gracz↔gracz (P21) nie ma progu czasu w akceptacji (NIE ZBADANO w UI).

## 3. Lista luk do osobnych tematów

- **L1. Brak logu powodu końca wojny.** Ścieżki AI↔AI kończą się tylko w `console.log` (P10 `war-weariness.ts`, P11, P12, P20 `main.ts:40737`). Brak zdarzenia w grze i w UI. Skutek: nie da się zmierzyć przyczyny końca bez kodu (potwierdza dispatch).
- **L2. Komentarze i martwe stałe wojen epoki (korekta po zarzucie 6).** Pierwotnie opisane jako brakujące wdrożenie. Po weryfikacji: usunięcie zakończenia wojny epoki przez miasta jest **świadomą decyzją R9** (`main.ts:19063-19065`: „wojny wymuszone Kamienia/Brązu/Żelaza NIE kończą się już automatycznie po zdobyciu miast … kończą się wyłącznie pokojem”). Pozostają: nieaktualne komentarze „2 miasta → pokój” (`forced-war-bronze.ts:19`, `forced-war-iron.ts:46`) oraz martwe stałe `WOJNA_*_MAX_CZAS_TRWANIA_TUR = 20` bez konsumenta (P14). Klasyfikacja: **higiena (nieaktualne komentarze i martwe stałe)**, a nie brakujący mechanizm. Pytanie, czy wojna epoki ma mieć limit czasu, jest decyzją właściciela o balansie (do rozstrzygnięcia osobno), nie błędem wdrożenia.
- **L3. Pokoje AI↔AI niewidoczne dla gracza.** `logPeaceVazne` ignoruje pary bez gracza (`main.ts:27029-27030`, gate `if (a !== ME() && b !== ME()) return;`). P10 (AI↔AI), P11, P12, P20 nie dają wpisu w grze.
- **L4. Koniec rozejmu bez oferty = cicha wojna.** `declareWarAfterTruce` (`main.ts:13109-13113`) zmienia relację przez `applyDiploEventTracked` (`main.ts:13397-13412`), który nie dopisuje wpisu do `warEventLog`. Brak komunikatu. Dotyczy też gracza, gdy `truceEndOffer` nie powstał.
- **L5. Eliminacja nie zamyka relacji.** Relacja pary z martwym ownerem zostaje `wojna` (`eliminateOwner` `main.ts:40109`, grep 40109-40260 bez `setDiploRelation`); sprzątanie tylko przez pomocnicze pętle. Do zbadania, czy wpływa na liczniki wojen (`countActiveWarsForOwner`).
- **L6. Wartości NIE ZBADANO:** wasalizacja jako zakończenie wojny (P17, akcja `12` w `diplomacyTradeBasket.ts`), czy UI blokuje propozycję międzyludzką pokoju przed 10. turą (P21).
- **L7. Ścieżka P20 bez wpisu w grze.** Pokój AI↔AI po prośbie przegrywającej AI jest niewidoczny (`logPeaceVazne`), tak jak P10/P11 (ta sama luka co L3, wymieniona osobno, bo P20 wymaga rejestracji komendą AI).

## 4. Hipoteza dla wojny 1 vs 7 (seed 7, 9 tur, zmęczenie 0,225)

Dane (`git show 78b14aba3:…/dane/summary.json`, plik `war-kontynenty-7.jsonl`): para `1 vs 7`, `start 108`, `end 118`, `duration 9`, `type naturalna`, `reason inne/nieznane (nie zapisane w logu)`, `fatigueAtEnd 0.225`, `citiesChanged 0`.

Wnioski z kodu i danych:
- Zmęczenie 0,225 = 9/40 + 0,1·0 (brak utraconych miast) — spójne z `citiesChanged 0`.
- `end = 118` to pierwsza tura bez wojny, a licznik wojny w ostatnim rekordzie (turze 117) wynosił 9. Zatem licznik `turnsAtWar` osiągnąłby **10** dokładnie w turze, w której wojna zniknęła. Próg 10 tur jest tym samym progiem, który otwiera P3/P4/P2 (AI↔gracz), P11 i P20 (AI↔AI). Zbieżność czasowa jest silną wskazówką, ale NIE jest dowodem przyczynowości.
- Wykluczone przy spójnym liczeniu: P10 (poziom 0,225 < 1,0), P12 (wymaga 2 zdobytych miast; `citiesChanged 0` oznacza zero zmian właściciela miasta, a licznik `regularWarCapturedByPairKey` jest zasilany tym samym zdarzeniem: `main.ts:19066`, `40969`), P16 (brak eliminacji; `citiesChanged 0`), P7/P8/P9 (to nie była wojna po rozejmie, typ `naturalna`), P3/P2/P4 (nie są ścieżkami AI↔AI).
- Kandydaci AI↔AI od 10. tury: **P20** (`tickAiAiPeaceRequests`, `main.ts:40646`) i **P11** (`tickAiAiWarWeariness`, `war-weariness.ts:477-493`). Oba wymagają progu `turnsAtWar ≥ 10`, oba logują tylko do konsoli. P20 wymaga wcześniejszej prośby przegrywającej AI (`main.ts:47530-47538`); P11 wymaga cooldownu 3 tur i pokrycia ceny. Która z nich zadziałała, rozstrzyga dopiero log powodu (L1).

NIE ZMIERZONO: przyczyna końca wojny 1 vs 7. Najbardziej prawdopodobny kandydat to ścieżka AI↔AI z progiem 10 tur (P20 lub P11); wybór między nimi wymaga logu.

## 5. Odniesienie do zgłoszenia właściciela

- Zgłoszenie „wojny kończą się znacznie szybciej niż po 40 turach” ma w kodzie wyjaśnienie w ścieżkach zależnych od zmęczenia i strat: P10 (od 10. tury przy dużej liczbie miast) oraz w ścieżkach AI↔AI bez zgody gracza: P11, P20 (od 10. tury), P12 (bez progu czasu, ale wymaga 2 miast).
- Dla gracza najszybsze realne zakończenia to propozycje AI (P1/P2, od 10. tury) i rozejm/propozycja gracza (P5/P6, od 10. tury), oraz P10 (wymuszone przy ≥ 8 miastach w 10. turze). Zakończenie bez zgody gracza przed 40. turą istnieje tylko w P10.
- Pomiar WARDUR (seed 4242, 0 vs 1, 42→83) potwierdza 40 tur dla pokoju wymuszonego (P10) przy zerowej liczbie zmienionych miast, czyli zmęczenie czasem; wojna 1 vs 7 nie została wyjaśniona (§4).
- Pozycja L2 nie tłumaczy obserwacji „szybszych wojen”: wojny epoki wg kodu nie kończą się przez miasta (R9).

## 6. Kandydaci do osobnych tematów (orkiestrator decyduje; bez pytań do właściciela)

1. R-WEB-WAR-END-REASON-LOG — zdarzenie/log powodu końca każdej wojny (P7, P10, P11, P12, P20), widoczne w UI dla pary z graczem (L1, L3, L7).
2. R-WEB-EPOCH-WAR-STALE-COMMENTS — usunięcie nieaktualnych komentarzy „2 miasta → pokój” i martwych stałych `WOJNA_*_MAX_CZAS_TRWANIA_TUR` (L2). Czy wojna epoki ma mieć limit czasu, to osobna decyzja właściciela o balansie.
3. R-WEB-TRUCE-END-SILENT — komunikat przy wojnie po rozejmie bez oferty (P7, L4).
4. R-WEB-ELIMINATED-RELATION-CLOSE — zamknięcie relacji pary z martwym ownerem (P16, L5), po sprawdzeniu wpływu na liczniki wojen.
5. R-WEB-WAR-END-MEASURE-9T — pomiar 1 vs 7 z licznikiem przejęć miast i logiem (po L1).
6. R-WEB-PEACE-PAIR-NO-TIME-GATE-CHECK — zbadanie, czy propozycja międzyludzka (P21) i wasalizacja (P17) mają bramkę czasu (L6).

## 7. Korekta punktu 6 (R-WEB-ERA-WAR-END-LIKE-CLASSIC-Q1, 2026-11-25)

Pozycja 6 ("usunięcie pominięć P12/P20 dla wojen epoki") została zrealizowana: wojny epoki (Kamień/Brąz/Żelazo) AI↔AI
kończą się tymi samymi ścieżkami co klasyczne. Usunięte wykluczenia:
- `gra/src/main.ts` `maybeResolveRegularWarOnCityCapture` — wczesny return dla pary z aktywną wojną wymuszoną (P12: auto-pokój po 2 miastach działa też dla wojen epoki, z tym samym warunkiem bilansu ≥ 0 u obu AI; sprzątanie i karencja idą przez `finalizePeaceTreatyBetween`).
- `gra/src/main.ts` `aiAiForcedPeacePairEligible` i pole `forcedEpochWar` w `gra/src/game/diplomacy-ai-forced-peace.ts` `isForcedPeaceEligiblePair` (P20: prośby o pokój/rozejm AI↔AI obejmują wojny epoki; P11 bez zmian).
Para gracz↔AI bez zmian. Test: `gra/tools/era-war-end-like-classic-test.cjs`.
