# AUDYT: rozejm (czasowy) vs pokój stały — stan kodu

BAZA: origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 @ 54557c3cc (checkout detach w worktree wf_fbd0b010-f02-1). Zero zmian w gra/.
Ścieżki względem `gra/` chyba że podano inaczej. Numery linii z tego SHA.

## Wynik w skrócie

Kod ma JEDNĄ ścieżkę zakończenia wojny: „pokój” (akcja 10, `actionId 'pokoj'`). Nie ma żadnej ścieżki zawierającej rozejm z wyborem długości.
- `StanWojny.Rozejm` (types/diplomacy.ts:36) i `RodzajTraktatu.Rozejm` (types/diplomacy.ts:28) są zdefiniowane, ale NIGDZIE nie są przypisywane ani tworzone w silniku (grep po `src/`: tylko mapowania w `toRelation` diplomacy.ts:1416-1418, etykieta diplomacy-display.ts:362 i test diplomacy-test.cjs:308).
- Spec w data/diplomacy.json:302-307 opisuje rozejm („5–15 tur bez kary za wznowienie”), ale spec nie jest zaimplementowany.
- Zrzut właściciela („Rozejm na 10 tur (runda 1/3)”, „WYMAGA DECYZJI”) NIE daje się odtworzyć z tego SHA: ciągu „Rozejm na … tur” nie ma w src/. NIE_ZMIERZONO skąd dokładnie pochodzi (możliwe: inna build, robocza kopia, lub etykieta z innego miejsca). Liczba 10 pokrywa się jednak z `PEACE_TREATY_LOCK_TURNS = 10` (diplomacy-peace-lock.ts:11) — to najbardziej prawdopodobne źródło „10 tur”.

## (1) Gracz: rozejm vs pokój w UI i powiadomieniach

- Audiencja: jedyny przycisk zakończenia wojny to `{ aid: '10', label: 'Zaproponuj pokój' }` (src/ui/diplomacyAudience.ts:1652). Brak drugiego przycisku, brak wyboru długości.
- Dostępność: akcja '10' zablokowana, gdy nie trwa wojna (src/game/diplomacy-locks.ts:286-291). Brak parametru trybu.
- Stół negocjacyjny: `'10' → 'pokoj'` (src/ui/diplomacyNegotiationModal.ts:559; src/ui/diplomacyTradeBasket.ts:1400). Brak pola czasu trwania.
- Warunek: `pokoj` bez wojny odrzucany (src/game/diplomacy-proposals.ts:1019).
- Ocena: `case 'pokoj'` (diplomacy-proposals.ts:1189-1215) — bramka bilansu PW, bez gałęzi czasowej.
- Powiadomienia: etykiety `'Propozycja pokoju (PW baza 500)'` (src/main.ts:17106). Brak tekstu rozejmu.
- Wniosek: gracz NIE może zaproponować rozejmu ani wybrać długości. Może tylko „pokój”.

## (2) AI: które traktaty proponuje i wg jakiej logiki

- Priorytet 1 (src/game/ai.ts:5233-5244): `oferuj_trybut_za_pokoj` przy `rw <= progTrybutKrytyczny` (słabość krytyczna).
- Priorytet 2 (src/game/ai.ts:5246-5252): `zaproponuj_pokoj` przy `rw <= progPokojSlabosc` w trakcie wojny. Jedyny warunek to słabość względna.
- Komenda → `pendingProposal` z `actionId: 'pokoj'`, `payload: {}` (src/game/diplomacy-proposals.ts:1858-1862). Brak czasu trwania w payloadzie.
- Tekst dla AI: „Proponujemy zawarcie pokoju i zakończenie wojny.” (diplomacy-proposals.ts:1803-1804).
- AI nigdy nie produkuje rozejmu. Nie ma logiki „kiedy rozejm, kiedy pokój”. Licznik „runda 1/3” NIE_ZMIERZONO w src (nie znaleziono licznika rund negocjacji w tym kontekście).

## (3) Co dzieje się po końcu „rozejmu” i czym pokój stały różni się od rozejmu

Ponieważ rozejm nie istnieje, opisuję skutki faktycznego pokoju (jedynej ścieżki):
- `finalizePeaceTreatyBetween` (src/main.ts:9228): `applyDiploEventTracked(..., 'pokoj')` + `startPeaceTreatyLock(meta, turn, lockTurns)` + sprzątanie wymuszonych wojen (Kamień/Brąz).
- Efekt relacji (src/game/diplomacy.ts:885-889): `dZ = +5` Zaufanie, `newStatus = 'pokoj'`. Jednorazowo.
- Blokada DOW: `peaceUntilTurn = turn + 10` (diplomacy-peace-lock.ts:11, 27-37). Egzekwowana w `ownerDeclareWarOn` (src/main.ts:10257-10261: `isPeaceLockedBetween` → return). Po upływie 10 tur para może ponownie wypowiedzieć wojnę. Brak kary, brak cooldownu, brak zdarzenia „koniec rozejmu”.
- Po wygaśnięciu blokady status pozostaje `'pokoj'` (bezterminowy). Nie ma automatycznego powrotu do wojny, bo nie ma czasu wygaśnięcia.
- Wymuszone pokoje (forced-war-bronze / forced-war-iron / stone, main.ts:28633-28805) używają innych `lockTurns` (np. `WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR`). To inna długość, nie tryb.
- Różnica „pokój stały vs rozejm” w skutkach: NIE ISTNIEJE. Jedyny element czasowy to 10-turowa blokada DOW, identyczna dla każdego pokoju. Pokój nie ma „wygasa”, więc w grze nie ma czego odróżnić od rozejmu.
- Konsekwencja techniczna: `toRelation` mapuje `StanWojny.Rozejm` na `'pokoj'` (diplomacy.ts:1416-1418) — gdyby rozejm zaczęto zapisywać, UI i AI traktowałyby go jak pokój, chyba że zmieni się mapowanie.

## (4) Luki względem postulatu właściciela

| Postulat | Stan | Luka |
|---|---|---|
| Dwa tryby w propozycji: rozejm (np. 10 tur) i pokój stały | Brak rozejmu | Brak `StanWojny.Rozejm` w przepływie, brak pola czasu w `pokoj` |
| Gracz wybiera długość rozejmu | Brak | Brak UI i payloadu |
| AI proponuje oba, wg logiki | AI tylko pokój, wg słabości | Brak logiki wyboru trybu |
| Powrót do wojny po końcu rozejmu | Brak mechanizmu | Brak wygaśnięcia, brak zdarzenia, brak przejścia do Wojna |
| Różne skutki relacji (rozejm bez +5 Zaufania?) | Brak rozróżnienia | Pokój daje +5 Zaufanie; rozejm nie istnieje |
| Cooldown po wygaśnięciu rozejmu | Brak | Brak |
| Możliwość wypowiedzenia | Pokój: blokada 10 tur, potem wolno | Dla rozejmu brak reguły |

Wzorzec do ponownego użycia: NAP ma już terminowość i etykietę (`resolveNapDealExpiry`, diplomacy-proposals.ts:449-459, zakres 10–20 tur, `label: 'Pakt nieagresji na N tur'`). Rozejm może pójść tym samym szlakiem.

## Propozycja minimalnych zmian (do ABC, NIE wdrażać)

1. Payload `pokoj` dostaje opcjonalne `treatyTurns` (0/brak = pokój stały; >0 = rozejm na N tur, klamra np. 5–15, wzór z NAP).
2. Silnik: rozejm ustawia `StanWojny.Rozejm` + `wygasaTura`; w `runDiplomacyTurnTick` po wygaśnięciu przejście na `Wojna` (lub `Pokoj`, do ustalenia).
3. `toRelation` / UI: rozejm osobno od pokoju (obecnie zlepione w 'pokoj').
4. UI: dwa przyciski albo wybór w audiencji (rozejm 5/10/15 tur, pokój stały).
5. AI: reguła wyboru trybu (np. rozejm przy wysokim ryzyku/słabości, pokój przy stabilnej przewadze) — wymaga decyzji właściciela.

## Pytania ABC do właściciela (przygotowane, NIE zadane przez Operatora)

A. Długość rozejmu: stała 10 tur (jak zrzut) czy wybór 5/10/15 (jak spec data/diplomacy.json)?
B. Koniec rozejmu: automatycznie wojna, czy powrót do stanu wojny z wymaganą renegocjacją / cooldownem N tur?
C. Czy rozejm daje +5 Zaufania jak pokój, czy 0 (rozejm to „zawieszenie”, nie „pokój”)?
D. Czy blokada DOW 10 tur ma obowiązywać także po rozejmie?
E. Kiedy AI wybiera rozejm zamiast pokoju (słabość, zmęczenie wojną, liczba miast)?
F. Skąd pochodzi zrzut „Rozejm na 10 tur (runda 1/3)” — z innej buildu/kopii? (NIE_ZMIERZONO w tym SHA.)

## Zakres kontroli

- Przeszukano `gra/src` (grep: Rozejm, rozejm, truce, ceasefire, zawieszeni, pokoj, Pokoj, StanWojny.*, RodzajTraktatu.*).
- Przeczytano: types/diplomacy.ts, game/diplomacy-treaties.ts (nagłówek), game/diplomacy-peace-lock.ts, game/diplomacy-locks.ts (case '10'), game/diplomacy.ts (applyDiplomaticEvent 'pokoj', toRelation), game/diplomacy-display.ts (etykiety), game/diplomacy-proposals.ts (1019, 1189-1215, 1803, 1858, 449-459), game/ai.ts (5233-5252), main.ts (9176-9240, 10252-10262, 17098-17110).
- NIE sprawdzono: pełnego UI rendera pendingów (renderPnBalancePanelForPeace) i testów runtime; nie uruchamiano gry (zero zmian, audyt read-only).
- Kopia `gra-robocza/srcKopiaMaster/` zawiera `RodzajTraktatu.Rozejm` w main.ts:4635 i komentarz „NAP / rozejm — 10–20 tur” w diplomacy-proposals.ts:54 — to stara kopia, nie aktualny kod.
