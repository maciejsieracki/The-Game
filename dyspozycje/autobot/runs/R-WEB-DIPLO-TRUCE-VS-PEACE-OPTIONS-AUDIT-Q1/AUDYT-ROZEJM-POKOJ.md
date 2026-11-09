# AUDYT: rozejm (czasowy) vs pokój stały — stan kodu

BAZA: origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 @ 54557c3cc (checkout detach w worktree wf_fbd0b010-f02-1). Zero zmian w gra/.
Ścieżki względem `gra/` chyba że podano inaczej. Numery linii z tego SHA.

## Wynik w skrócie

Kod ma JEDNĄ ścieżkę zakończenia wojny: „pokój” (akcja 10, `actionId 'pokoj'`). Nie ma żadnej ścieżki zawierającej rozejm z wyborem długości.
- `StanWojny.Rozejm` (types/diplomacy.ts:36) i `RodzajTraktatu.Rozejm` (types/diplomacy.ts:28) są zdefiniowane, ale NIGDZIE nie są przypisywane ani tworzone w silniku (grep po `src/`: tylko mapowania w `toRelation` diplomacy.ts:1416-1418, etykieta diplomacy-display.ts:362 i test diplomacy-test.cjs:308).
- Spec w data/diplomacy.json:302-307 opisuje rozejm („5–15 tur bez kary za wznowienie”), ale spec nie jest zaimplementowany.
- Zrzut właściciela („Rozejm na 10 tur (runda 1/3)”, „WYMAGA DECYZJI”) NIE daje się odtworzyć z tego SHA: ciągu „Rozejm na … tur” nie ma w src/. NIE_ZMIERZONO skąd dokładnie pochodzi (możliwe: inna build, robocza kopia, lub etykieta z innego miejsca). Hipoteza r1 (liczba 10 = `PEACE_TREATY_LOCK_TURNS`, diplomacy-peace-lock.ts:11) jest SPEKULACJĄ — ta blokada dotyczy wypowiedzenia wojny, a notyfikacja pokoju jej nie pokazuje (patrz rewizja r2, pkt R2-2). Źródło zrzutu: NIE_ZMIERZONO.
- Korekta r2: część „(runda 1/3)” z zrzutu JEST wyjaśniona kodem — to licznik rund negocjacji (patrz sekcja „Rewizja r2”, pkt R2-1).

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
- AI nigdy nie produkuje rozejmu. Nie ma logiki „kiedy rozejm, kiedy pokój”. Licznik rund: patrz rewizja r2, pkt R2-1 (r1 błędnie twierdziła, że licznika nie ma).

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

## Rewizja r2 (odpowiedź na zarzuty; korekty nadpisują r1)

BAZA r2: 7620dd14a (SHA operatora r1). Zero zmian w gra/. Weryfikacja: grep i odczyt linii z tego SHA.

### R2-1. Licznik rund negocjacji — ISTNIEJE (zarzut 1: PRZYJĘTE; r1 był błędny)
- `NEGOTIATION_MAX_ROUNDS = 3` (gra/src/game/diplomacy-proposals.ts:2230), komentarz: „Limit rund kontrofert w JEDNEJ negocjacji (C-DYP-Q1=A pkt 3)”.
- `PendingNegotiation.round` (diplomacy-proposals.ts:2251): 1 = pierwsza propozycja, +1 za każdą kontrofertę.
- `canPlayerCounterNegotiation` (diplomacy-proposals.ts:2358-2360): `round < NEGOTIATION_MAX_ROUNDS`. `canCounterNegotiation` odejmuje tylko `NEGOTIATION_NO_ENGINE_COUNTER`, który jest PUSTY, więc auto-kontroferta silnika AI jest dostępna także dla `pokoj`.
- Kolejka zdarzeń tury (gra/src/main.ts:15295): `negotiationSummary(n, true) + ' (runda ${n.round}/${NEGOTIATION_MAX_ROUNDS})'`. Format zrzutu „(runda 1/3)” jest dokładnie tym formatem.
- UI audiencji: `pendingNegotiationMetaHtml` (gra/src/ui/diplomacyAudience.ts ~1890-1910): „Kontroferta r/max”, gdy round > 1.
- Wniosek: część „(runda 1/3)” zrzutu jest wyjaśniona kodem (runda 1 = pierwsza propozycja, bez kontroferty). Rozejm/pokój NIE są jednorazowe w sensie stołu: przechodzą przez negocjację z max 3 rundami. Zmiana pola `treatyTurns` w kontrofercie to wariant do decyzji właściciela (pytanie G).

### R2-2. Źródło tekstu „Rozejm na 10 tur” — NIE_ZMIERZONO (zarzut 2: PRZYJĘTE)
- `rg "Rozejm na" gra/src` w tym SHA: brak trafienia. Tekst „Rozejm na N tur” nie jest budowany przez `negotiationSummary` (gra/src/main.ts:17070-17110).
- `pokoj` → `basketDetail || 'Propozycja pokoju (PW baza 500)'` (main.ts:17106). Nie „Rozejm”.
- `nap` → `Pakt nieagresji na N tur` (main.ts:17080-17083), N z `resolveNapDealExpiry` (diplomacy-proposals.ts:449-459, clamp 10–20). Też nie „Rozejm”. R1 mylnie sugerowała NAP jako źródło; odrzucam to jako ustalenie, zostaje tylko możliwość innej buildu/kopii.
- Hipoteza r1 „10 tur = PEACE_TREATY_LOCK_TURNS” (diplomacy-peace-lock.ts:11) jest SPEKULACJĄ i zostaje wycofana. Ta blokada dotyczy wypowiedzenia wojny; notyfikacja pokoju jej nie pokazuje.
- Źródło zrzutu: NIE_ZMIERZONO. Nie jest to pytanie do właściciela (pkt F z r1 usunięty, patrz niżej).

### R2-3. Logika AI (zarzut 3: PRZYJĘTE; uzupełnienie)
- Priorytety decyzji pokoju (gra/src/game/ai.ts:5233-5252) używają WYŁĄCZNIE `rw` (respektWzgledny) i progów `progTrybutKrytyczny` / `progPokojSlabosc`. Nie używają `peaceW`.
- `willingnessPeace` (gra/src/game/diplomacy.ts:1284-1294): w wojnie = `clamp(turnsAtWar/20, 0, 0.5)` + `(1 − militaryRatio) × 0,40` gdy ratio < 1 + `(zaufanie/100) × 0,20`; poza wojną = 0,80. Zwracana w diplomacy.ts:1349 w obiekcie stance.
- Konsument: w gra/src NIE znaleziono odczytu pola `willingnessPeace` poza jego zwrotem (diplomacy.ts:1229 i 1250 to inne literały obiektów, 1349 to zwrot). Wniosek: składowa zmęczenia wojną NIE wpływa na decyzję AI o pokoju w tym SHA (wartość martwa). Potwierdzenie runtime: NIE_ZMIERZONO.
- Heurystyka `turnsAtWar: rel.stanWojny ? 5 : 0` (ai.ts:5205; także diplomacy-proposals.ts:371): stała 5 zamiast realnego czasu wojny; składowa zmęczenia byłaby stale 5/20 = 0,25.
- Wypowiedzenie wojny przez AI (ai.ts:5395) używa `stance.willingnessWar`, nie `peaceW`.
- AI→AI: `decideAIDiplomacy` wołane w gra/src/main.ts:33438 w pętli po właścicielach AI, z relacjami per partner (`relacjeDip`). Czy partnerami są też inne AI i jaki jest pełny przepływ AI↔AI (zadanie #131 PEACE-AI-AI, FALA 572): NIE_ZMIERZONO w tej rundzie. To luka zakresu r1 do domknięcia przed implementacją.
- Gdzie AI wybiera rozejm zamiast pokoju: NIE MA takiej logiki. AI ma jeden typ propozycji pokoju (`zaproponuj_pokoj`, payload `{}`, diplomacy-proposals.ts:1858-1862) i jeden typ trybutu.

### R2-4. Zakres kontroli rozszerzony (zarzut 4: PRZYJĘTE)
- Kolejka zdarzeń (gra/src/main.ts:15275-15300): dwie ścieżki. (a) `pendingDiplomacyInbox`: tytuł `diploPendingTitle(p.cmdType)` (main.ts:16365-16376): `zaproponuj_pokoj` → „Propozycja pokoju”, `oferuj_trybut_za_pokoj` → „Trybut za pokój”, reszta → „Propozycja dyplomatyczna”. (b) `negotiationTable`: subtitle = `negotiationSummary` + runda (R2-1). Brak etykiety rozejmu w obu ścieżkach.
- Render bilansu pokoju: `renderPnBalancePanelForPeace` (gra/src/ui/diplomacyAcceptanceBalance.ts:874) to alias `@deprecated` → `renderPnBalancePanelForTreaty` z etykietą „Traktat pokoju”. Brak wariantu rozejmu.
- Spec (gra/data/diplomacy.json, Akcja „10. Propozycja pokoju / zawieszenia broni”): „Zakończenie aktywnej wojny pokojem (trwałym) lub rozejmem (tymczasowym)”; Efekt: „Pokój: +5 Relacja po czasie. Rozejm: na 5–15 tur bez kary za wznowienie”.
- Kod (gra/src/game/diplomacy.ts:883-889): `case 'pokoj': dZ = 5` jako ZAUFANIE, natychmiast („soft approximation”). Sprzeczność spec ↔ kod: spec mówi Relacja po czasie, kod Zaufanie od razu. Spec JUŻ opisuje oba tryby, więc postulat właściciela jest zgodny ze specem, a kod go nie realizuje.
- Blokada DOW (gra/src/game/diplomacy-peace-lock.ts:3-4, 11): dotyczy AI decideAIDiplomacy, kaskady sojuszu, losowego DOW państw-miast i gracza.

### Tabela luk (korekta r2)
| Postulat | Stan w 7620dd14a | Luka |
|---|---|---|
| Dwa tryby (rozejm N tur / pokój stały) | Spec ma oba; kod tylko pokój | Brak `StanWojny.Rozejm` w przepływie, brak pola czasu |
| Gracz wybiera długość | Brak | Brak UI (jeden przycisk „Zaproponuj pokój”, diplomacyAudience.ts:1652) |
| AI wybiera tryb wg logiki | AI tylko `zaproponuj_pokoj` wg `rw` | Brak wyboru trybu; `willingnessPeace` martwa |
| Negocjacja z kontrofertami dla rozejmu/pokoju | JEST (max 3 rundy, R2-1) | Kontroferta nie zmienia długości, brak pola |
| Koniec rozejmu | Nie istnieje | Brak wygaśnięcia, zdarzenia, powrotu do wojny |
| Różne skutki relacji | Pokój: dZ=5 Zaufanie | Brak rozróżnienia; spec mówi Relacja |
| Cooldown po wygaśnięciu | Nie istnieje | Brak |
| Wzorzec | NAP: `treatyTurns`, clamp 10–20 (resolveNapDealExpiry) | Do ponownego użycia |

### Propozycja minimalnych zmian (do ABC, NIE wdrażać)
1. Payload `pokoj` dostaje opcjonalne `treatyTurns` (0/brak = pokój stały; >0 = rozejm na N tur; klamra wzorem NAP, np. 5–15 jak w specu). Zgodne z polem już używanym przez `resolveNapDealExpiry`.
2. Silnik: rozejm ustawia `StanWojny.Rozejm` i `wygasaTura`; w ticku tury po wygaśnięciu przejście do `Wojna` (lub do pokoju, pytanie B).
3. `toRelation` (diplomacy.ts:1416-1418) mapuje Rozejm na `pokoj`; trzeba rozdzielić, inaczej UI i AI traktują rozejm jak pokój.
4. UI: wybór w audiencji (rozejm 5/10/15 tur albo pokój stały) zamiast jednego przycisku; etykiety w `negotiationSummary` i `diploPendingTitle`.
5. AI: reguła wyboru trybu wymaga decyzji właściciela (pytanie E); ewentualnie podpięcie albo usunięcie `willingnessPeace`.

### Pytania ABC do właściciela (rewizja r2)
A. Długość rozejmu: stała 10 tur (jak zrzut) czy wybór 5/10/15 (jak spec data/diplomacy.json)?
B. Koniec rozejmu: automatycznie wojna, czy powrót do stanu wojny z wymaganą renegocjacją / cooldownem N tur?
C. Czy rozejm daje +5 Zaufania jak pokój, czy 0 (rozejm = zawieszenie, nie pokój)? Spec mówi „+5 Relacja po czasie” dla pokoju: czy to ma być Relacja, czy zostaje Zaufanie?
D. Czy blokada DOW (PEACE_TREATY_LOCK_TURNS = 10) ma obowiązywać także po rozejmie?
E. Kiedy AI wybiera rozejm zamiast pokoju? Obecnie AI nie ma takiej logiki, a składowa zmęczenia wojną (willingnessPeace) jest martwa.
F. (USUNIĘTE w r2) Pytanie o źródło zrzutu nie jest pytaniem do właściciela; źródło zostaje NIE_ZMIERZONO w audycie.
G. Czy rozejm/pokój mają przechodzić przez stół negocjacyjny z kontrofertami (max 3 rundy, zmiana `treatyTurns` w kontrofercie), czy pozostać jednorazową propozycją?

### Zakres kontroli r2
- Dodatkowo odczytano: gra/src/game/diplomacy-proposals.ts:2225-2262, 2340-2375, 2532; gra/src/main.ts:15270-15305, 16365-16376, 16660-16700, 17070-17110, 17325-17340, 33420-33440; gra/src/ui/diplomacyAudience.ts:1890-1910; gra/src/ui/diplomacyAcceptanceBalance.ts:870-900; gra/src/game/ai.ts:5195-5260, 4744-4750, 5395-5403; gra/src/game/diplomacy.ts:878-892, 1275-1350; gra/src/game/diplomacy-peace-lock.ts:1-30; gra/data/diplomacy.json:296-312.
- NIE_ZMIERZONO: testy runtime; render pendingów w przeglądarce; pełny przepływ AI↔AI; historia gałęzi w poszukiwaniu źródła zrzutu (`git log -S` przekroczyło limit czasu bez wyniku).
