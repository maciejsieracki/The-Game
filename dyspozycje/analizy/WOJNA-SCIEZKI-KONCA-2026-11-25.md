# Wojna: wszystkie ścieżki końca stanu wojny (R-WEB-WAR-END-PATHS-Q1)

DATA: 2026-11-25 · BAZA: origin/main `78b14aba3` · zakres: wyłącznie analiza kodu `gra/src` i `gra/data` (zero zmian w grze).
Zakres: każda ścieżka, która zmienia relację pary z `wojna` na `pokoj` / `sojusz` / `neutralni` albo kończy wojnę inaczej
(eliminacja, reset, wczytanie). Numery linii = stan bazy; weryfikacja: `grep -n` po podanych nazwach funkcji.

Legenda „widoczność”: TAK = gracz dostaje modal / wpis w stole / wpis „Ważne” / podpowiedź; NIE = tylko `console.log`
albo brak komunikatu.

## 1. Tabela ścieżek (plik:linia, funkcja, warunek, inicjator, min. tura, zależności, gracz, widoczność)

| # | Ścieżka | Miejsce (plik:linia) | Warunek | Kto inicjuje | Min. tura wojny | Zależy od | Dotyczy gracza | Widoczność dla gracza |
|---|---|---|---|---|---|---|---|---|
| P1 | Pokój zaakceptowany przez gracza z propozycji AI (stół/skrzynka) | `main.ts:22832-22836` (`finalizePeaceTreatyBetween`, `logPeaceVazne`) | gracz klika „przyjmij” na `zaproponuj_pokoj` | AI proponuje, gracz akceptuje | brak twardego minimum w tej ścieżce; propozycja AI wymaga `aiPeaceTimeOk` (P3) | gate AI: `ai.ts:7382` | TAK | stół + wpis „Ważne” (`main.ts:27029` logPeaceVazne) |
| P2 | Pokój z cesją miasta: AI oddaje miasto za pokój | `ai.ts:7436` (`oferuj_miasto_za_pokoj`) → stół → jak P1 | AI `slabsza` militarnie, `cenaPokojuPn` pokryte miastami, `!csBlocksCession`, `!aiFeelsStronger` | AI | `aiPeaceTimeOk` = tury ≥ max(minTurWojny, 10) (`ai.ts:7382`) | zmęczenie (`wearinessPeaceCashPn`), miasta AI | TAK (gracz decyduje) | stół (oferta) |
| P3 | Oferta pokoju/rozejmu AI (bez miast, gdy AI słabsza lub sygnały pokoju) | `ai.ts:7546` (`zaproponuj_pokoj`, rodzaj pokoj/rozejm) | `stanWojny && !aiFeelsStronger && aiPeaceTimeOk && !peaceWeakerNoCityVsPlayer && (slabsza || wantsPeace)` | AI | **10 tur** (`PEACE_PROPOSAL_MIN_WAR_TURNS`, `diplomacy-peace-proposal-timing.ts:2`) | pozycja militarna, zmęczenie, zaufanie | TAK | stół |
| P4 | Żądanie miasta przez AI (zamiast pokoju) | `ai.ts:7468` (`zada_miasto_za_pokoj`) | `rw ≥ AI_MIASTO_ZADANIE_RW` i (tury ≥ próg lub zdobyte miasta) | AI żąda, gracz decyduje | `aiPeaceTimeOk` (10) | respekt, miasta gracza | TAK | stół |
| P5 | Pokój/rozejm proponowany przez gracza, akceptowany przez AI | `main.ts:27257` (`cywAction === 'pokoj'`), `main.ts:27269` (rozejm 5/10/15 tur) | propozycja gracza zaakceptowana w silniku stołu | gracz → AI | **NIE ZBADANO**: kryteria akceptacji AI nie są w tej analizie (diplomacy-proposals) | — | TAK | wpis „Ważne” (`logPeaceVazne`) + podpowiedź (rozejm, `main.ts:27271`) |
| P6 | Rozejm (status przechodzi na `pokoj` od razu, z `truceUntilTurn`) | `main.ts:12940-12971` (`finalizePeaceTreatyBetween`, gałąź `isTruce`) | zawarcie rozejmu (gracz lub AI) | gracz lub AI | **brak** twardego minimum w `finalize`; gracz: **NIE ZBADANO** bramka w UI (`main.ts:27840` `playerDiplomacyActionAllowed`) | długość 5/10/15 | TAK (wpis przy rozejmie gracza, `main.ts:27270`) | wpis + podpowiedź |
| P7 | Koniec rozejmu → wojna (bez oferty) | `game/diplomacy-peace-lock.ts:257` (`truceEndToWarCore`) → `main.ts:13109-13113` (`declareWarAfterTruce` = czysta zmiana relacji na `wojna_wypowiedziana`) | wygaśnięcie rozejmu (`truceExpiryAction` `revert_to_war`), AI odrzuca / brak wojskowej zgody | tick (`main.ts:13211` `tickTruceExpiries`) | po wygaśnięciu rozejmu | siła armii (`truceEndAiAccepts`, `peace-lock.ts:171`) | to NIE jest koniec wojny (wraca wojna) | NIE (brak komunikatu w `declareWarAfterTruce`) |
| P8 | Koniec rozejmu → oferta pokoju dla gracza (skrzynka, timeout) | `game/diplomacy-peace-lock.ts:267-294`; `main.ts:13143` (`enqueueTruceEndOffer`) | gracz to strona oferty; timeout w kolejnej turze → wojna (`truceEndOfferExpired`) | tick | po wygaśnięciu rozejmu | — | TAK | podpowiedź + wpis w skrzynce |
| P9 | Gracz odrzuca pokój po rozejmie | `main.ts:22874-22875` → `truceEndToWar` (`main.ts:13225`) | odmowa oferty z P8 | gracz | po rozejmie | — | TAK | jak P8 |
| P10 | Pokój wymuszony 100% zmęczenia (para z graczem i para AI↔AI) | `game/war-weariness.ts:398-428` (`wearinessForcedPeaceDue`, `progWymuszonyPokoj = 1,0`), `main.ts:40745-40830` (`tickAiAiWarWeariness`), wywołanie raz na turę `main.ts:48531` | poziom = min(1, t/40 + 0,1·L) ≥ 1,0; `battlePending` odracza o turę (`war-weariness.ts:397`) | tick (silnik) | min. **10 tur** (`war-weariness.ts:380`); przy 10 turach wymagane L ≥ 8 | L = miasta utracone przez obie strony | TAK (para z graczem: `deferForcedPeace` → okno bez odmowy, `main.ts:26940-27020`) | modal `showForcedPeaceModal` (`ui/diplomacyAudience.ts:1248`) |
| P11 | Zmęczenie AI↔AI: oferta przegrywającego z ceną w miastach/ogonie (zaakceptowana) | `war-weariness.ts:477-493` (`offer_accepted`, `d.finalize`) | para AI↔AI (para z graczem: `war-weariness.ts:436` zwraca `none`), `turnsAtWar ≥ 10`, stopień > 0, cooldown 3 tury, cena pokryta, bilans ≥ −tolerancja | tick | **10 tur** (`war-weariness.ts:380`) | despair, cena `wearinessPeaceCashPn`, `karencjaPoPokojuTur 40` / `karencjaChronionegoTur 100` | NIE (tylko AI↔AI) | `console.log` (`[Dyplomacja] R-WEB-WEARINESS`) |
| P12 | Auto-pokój AI↔AI po 2 miastach zdobytych przez jedną stronę (bez zapłaty) | `main.ts:40863-40904` (`maybeResolveRegularWarOnCityCapture`), wywołania `main.ts:19066` i `main.ts:40969`; próg `forced-war-bronze.ts:55` = 2; `shouldEndForcedWarByCityCount` `forced-war-common.ts:65` | para AI↔AI (`main.ts:40865` `oldOwner===0 \|\| newOwner===0` → exit), para NIE w rejestrze wymuszonej wojny (`main.ts:40868-40873`), relacja `wojna`, bilans PW ≥ 0 u obu AI | silnik (zdobycie miasta) | **brak** minimum tur | liczba zdobytych miast (licznik `regularWarCapturedByPairKey`) | NIE | `console.log` (`[Dyplomacja] R-AI-WOJNY-ZWYKLE-CAP-DWA-MIASTA`) |
| P13 | Wojna wymuszona epoki (Kamień/Brąz/Żelazo): koniec przez pokój (dowolna ścieżka) → sprzątanie | `main.ts:12819` (stone), `12838` (iron), `13005-13009` (bronze), wywoływane z `finalizePeaceTreatyBetween` (`main.ts:12913`) | każdy pokój tej pary | jak wyżej | — | — | TAK/NIE jak ścieżka pokoju | jak ścieżka pokoju |
| P14 | Wojna wymuszona epoki: limit 2 miast i czas 20 tur | **NIE WDROŻONE** (patrz §3 L2) — stała `forced-war-bronze.ts:100`, `forced-war-iron.ts:93`, `forced-war-stone.ts:32` bez konsumenta; liczniki `capturedByAttacker/Defender` tylko inicjalizowane do 0 (`main.ts:30614, 31531, 31677, 47422-47452`) | — | — | — | — | — | — |
| P15 | Wojna wymuszona epoki: karencja po pokoju wymuszonym (`forcedEraPeaceUntilNextEra`) | `main.ts:12923-12928` | pokój między parą wojny wymuszonej | silnik | — | epoka | — | — |
| P16 | Eliminacja strony | `main.ts:40109` (`eliminateOwner`) | ostatnie miasto utracone | silnik | — | — | TAK (wpis eliminacji) | **Relacja NIE jest zamykana** (brak `setDiploRelation` w `eliminateOwner`, grep 40109-40260); wojna z martwym ownerem zostaje w `wojna`, sprzątane przez `prunePendingForcedPeace` (`main.ts:26940`) i `sweepStaleForcedWarEntries` |
| P17 | Sojusz zerwany / wasalizacja | `main.ts:24664` (`if (!stillAllied) next = {...status:'pokoj'}`) — tylko z `sojusz`, nie z `wojna`; `syncRelationFromDeals` (`main.ts:24708`) ma `if (rel.status === 'wojna') return;` | — | — | — | — | — | **NIE kończy wojny** (sojusz nie wchodzi w `wojna`). Brak ścieżki wasalizacji kończącej wojnę znaleziona (NIE ZBADANO w pełni: akcja `12` w `diplomacyTradeBasket.ts`) |
| P18 | Reset/wczytanie gry | `main.ts:42391-42424` (zapis), `main.ts:52269-52378` (odczyt), `main.ts:50725`, `52276` (`regularWarCapturedByPairKey.clear()`) | wczytanie / nowa gra | gracz | — | — | — | brak zdarzenia końca (stan przywracany) |
| P19 | Testowe hooki kończące wojnę | `main.ts:31703` (`endWarByPeaceForTest`), `31395` (`setPeaceLock`), `30009`, `30722`, `32308`, `32733`, `31925`-`31928` | tylko `window.__…Test…` | test | — | — | — | NIE dotyczy gry |

Uwagi do tabeli:
- Min. tura: **żadna** ścieżka nie kończy wojny przed 10. turą wojny; od 10. tury działają P2, P3, P4, P10 (przy L ≥ 8), P11. P1 i P5 zależą od propozycji, P6 od decyzji gracza. P12 nie ma minimum — jest jedyną ścieżką AI↔AI bez progu czasu.
- Para z graczem (`ME()` = 0): P10 działa (pokój wymuszony, okno z decyzją); P11 **nie działa** (`war-weariness.ts:436`); P12 **nie działa** (`main.ts:40869`); P3/P2/P4 działają przez stół.

## 2. Odpowiedź: co może skończyć wojnę gracza PRZED 40. turą

Gracz (cywilizacja 0) vs główna AI. Warunki wg kodu:

| Ścieżka | Najwcześniej | Warunek | Automatycznie? |
|---|---|---|---|
| P10 pokój wymuszony 100% | tura 10 (wymaga ≥ 8 miast utraconych przez obie strony) · tura 20 (≥ 5) · tura 24 (≥ 4) · tura 30 (≥ 3) · tura 36 (≥ 1) · tura 40 (0) | poziom = t/40 + 0,1·L ≥ 1,0; brak bitwy w toku | **Tak**: wojna kończy się na tym, że gracz musi nacisnąć „przyjmij” w oknie (bez opcji odmowy); do tego czasu blokuje „Zakończ turę” |
| P1/P2 pokój lub pokój z miastem z propozycji AI | tura 10 | AI słabsza militarnie lub sygnały pokoju; `aiPeaceTimeOk` | **Nie**: gracz musi przyjąć |
| P5 propozycja gracza | brak twardego minimum w tej ścieżce (**NIE ZBADANO**, kryteria AI) | akceptacja AI | **Nie** |
| P6 rozejm (gracz lub AI) | od razu po zawarciu (status `pokoj` + okno 5/10/15 tur) | zgoda obu stron | **Nie** |
| P8/P9 koniec rozejmu | po wygaśnięciu rozejmu | zgoda gracza na pokój, inaczej wojna | **Nie** |

Wniosek: gracz może zakończyć wojnę przed 40. turą przez **propozycje (P1, P2, P5, P6)**, które wymagają jego zgody, oraz przez **pokój wymuszony (P10)**, który wymaga kliknięcia, ale przy wyższym zmęczeniu z miast (L). Wojna bez utraty miast nie zakończy się przed turą 36 przez zmęczenie. Ścieżek automatycznych bez zgody gracza przed 40. turą nie ma poza P10.

## 3. Lista luk do osobnych tematów

- **L1. Brak logu powodu końca wojny.** Każda ścieżka AI↔AI kończy się tylko w `console.log` (P10 `main.ts`/`war-weariness.ts` `d.log`, P11, P12). Brak zdarzenia w grze i w UI. Skutek: nie da się zmierzyć przyczyny końca bez kodu (potwierdza dispatch).
- **L2. Wojny epoki: limit 2 miast i 20 tur NIE są wdrożone.** Komentarze w `forced-war-bronze.ts:19`, `forced-war-iron.ts:46` obiecują „2 miasta → pokój”. W kodzie: liczniki `capturedByAttacker/Defender` są tylko zerowane, nigdy nie są zwiększane; `WOJNA_*_MAX_CZAS_TRWANIA_TUR = 20` nie ma konsumenta; `maybeResolveRegularWarOnCityCapture` (`main.ts:40868-40873`) wprost pomija pary z rejestru wojny wymuszonej. Dispatch i poradnik zakładają ten mechanizm — **to rozbieżność kod ↔ opis**. Do decyzji właściciela (czy wdrożyć, czy usunąć obietnicę).
- **L3. Pokoje AI↔AI niewidoczne dla gracza.** `logPeaceVazne` ignoruje pary bez gracza (`main.ts:27030`). P10 (AI↔AI), P11, P12 nie dają wpisu w grze.
- **L4. Koniec rozejmu bez oferty = cicha wojna.** `declareWarAfterTruce` (`main.ts:13109-13113`) tylko zmienia relację; brak komunikatu. Dotyczy też gracza, gdy `truceEndOffer` nie powstał.
- **L5. Eliminacja nie zamyka relacji.** Relacja pary z martwym ownerem zostaje `wojna` (`eliminateOwner` `main.ts:40109`); sprzątanie tylko przez pomocnicze pętle. Do zbadania, czy wpływa na liczniki wojen (`countActiveWarsForOwner`).
- **L6. Brak wartości `NIE ZBADANO`:** kryteria akceptacji pokoju przez AI przy propozycji gracza (P5), bramka czasu dla propozycji rozejmu przez gracza (P6), wasalizacja jako zakończenie wojny (P17).

## 4. Hipoteza dla wojny 1 vs 7 (9 tur, zmęczenie 0,225)

Dane pomiaru WARDUR (`30-obrona-claude.md`, `dane/summary.json`) **NIE ODCZYTANE**: plik nie jest w `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`git show` zwrócił błąd), więc wartość 0,225 pochodzi z dispatchu.

Wnioski z kodu:
- Zmęczenie 0,225 = 9/40 + 0,1·0 ⇒ przy spójnym liczniku **żadne miasto nie zmieniło właściciela** w tej wojnie.
- Przy 9 turach wykluczone są: P3/P2/P4/P11 (`PEACE_PROPOSAL_MIN_WAR_TURNS = 10`, `ai.ts:7382`, `war-weariness.ts:380`) oraz P10 (poziom < 1,0).
- P12 (auto-pokój po 2 miastach) wymagałby 2 zdobytych miast; przy L = 0 jest mało prawdopodobny — **chyba że** licznik zmęczenia i `regularWarCapturedByPairKey` liczą różne zdarzenia (oba są zasilane z tego samego przejęcia, `main.ts:19066`, `40969`, `diploRelWarFields` `main.ts:12467`). To jest jedyna ścieżka bez progu czasu, dlatego jest **najbardziej prawdopodobnym kandydatem**, pod warunkiem błędu w danych pomiaru.
- Jeśli dane są poprawne, **nie znaleziono ścieżki kończącej wojnę AI↔AI w 9 turach bez miast**. Hipoteza wymaga logu powodu (L1) albo ponownego pomiaru z licznikiem przejęć.

NIE ZMIERZONO: przyczyna końca wojny 1 vs 7.

## 5. Odniesienie do zgłoszenia właściciela

- Zgłoszenie „wojny kończą się znacznie szybciej niż po 40 turach” ma w kodzie wyjaśnienie w trzech ścieżkach zależnych od zmęczenia i strat: P10 (od 10. tury przy dużej liczbie miast), P11 (tylko AI↔AI), P12 (bez progu czasu, tylko AI↔AI). Dla gracza najszybsze realne zakończenia to P1/P2 (propozycje AI od 10. tury) i P10 (wymuszone przy ≥ 8 miastach w 10. turze). Zakończenie bez zgody gracza przed 40. turą istnieje tylko w P10.
- Rozbieżność L2 (wojna epoki „2 miasta → pokój”) może tłumaczyć część obserwacji w inną stronę, ale wojny epoki wg kodu w ogóle nie kończą się przez miasta.

## 6. Kandydaci do osobnych tematów (orkiestrator decyduje; bez pytań do właściciela)

1. R-WEB-WAR-END-REASON-LOG — zdarzenie/log powodu końca każdej wojny (P10, P11, P12, P7), widoczne w UI dla pary z graczem.
2. R-WEB-EPOCH-WAR-CITY-LIMIT-WIRE — decyzja: wdrożyć limit 2 miast i 20 tur dla wojen epoki (zgodnie z komentarzami) albo usunąć obietnicę; wymaga decyzji właściciela o balansie.
3. R-WEB-TRUCE-END-SILENT — komunikat przy wojnie po rozejmie bez oferty (P7).
4. R-WEB-ELIMINATED-RELATION-CLOSE — zamknięcie relacji pary z martwym ownerem (P16), po sprawdzeniu wpływu na liczniki wojen.
5. R-WEB-WAR-END-MEASURE-9T — pomiar 1 vs 7 z licznikiem przejęć miast i logiem (po L1).
