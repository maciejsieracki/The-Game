STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza kodu; zero zmian w gra/)
TEMAT: R-WEB-WAR-END-PATHS-Q1
GOAL: pełna tabela ścieżek końca wojny (plik:linia), odpowiedź „co może skończyć wojnę gracza przed 40. turą", widoczność dla gracza, luki; po obronie: wszystkie zarzuty Evaluatora (1-7) rozstrzygnięte z dowodem.
ZMIANY/COMMIT: dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md (przepisany, commit ee96ee3f5); dyspozycje/autobot/runs/R-WEB-WAR-END-PATHS-Q1/30-obrona-claude.md (ten plik). Kandydat bazy: c7647f0e7. Zero zmian w gra/src i gra/data (git diff 78b14aba3 HEAD -- gra: pusty).
TESTY: NIE DOTYCZY (analiza kodu, bez bramek gry). Weryfikacja grep (surowe trafienia):
- `grep -n "peaceProposalIsTooEarly"` main.ts: 12508 (definicja), 21539, 22300, 22334, 27616.
- `grep -n "PEACE_PROPOSAL_MIN_WAR_TURNS"`: diplomacy-peace-proposal-timing.ts:2,5-9; diplomacy-proposals.ts:1579; diplomacy-locks.ts:326,354.
- `grep -n "R-AI-PEACE-2T" main.ts`: 40589 (log prośby), 40736 (log finalize).
- `grep -n "setDiploRelation"` w zakresie 40109-40260 (eliminateOwner): 0 trafień.
- `grep -n "function applyDiploEventTracked" main.ts` 13397; zakres 13397-13412 bez `warEventLog`.
- summary.json (78b14aba3): para 1 vs 7, start 108, end 118, duration 9, fatigueAtEnd 0.225, citiesChanged 0, plik war-kontynenty-7.jsonl; para 0 vs 1, 42, 83, 40, 1, 0.
BLOKADY: brak blokad wykonania. NIE ZBADANO (jawnie w dokumencie): wasalizacja jako koniec wojny (P17, akcja 12 w diplomacyTradeBasket.ts); czy UI blokuje propozycję międzyludzką pokoju przed 10. turą (P21); przyczyna końca wojny 1 vs 7 (brak logu powodu, L1).
RUNDY: 2/5 (runda 1: BLOCK z zarzutami 1-7 od Evaluatora; ta runda: odpowiedź).

## Odpowiedź na zarzuty Evaluatora

1. Pominięta ścieżka AI↔AI prośba o pokój (tickAiAiPeaceRequests): PRZYJMUJĘ. Dodano P20 z plik:linia: rejestracja `main.ts:47535` (komenda `main.ts:47530-47538`), tick `main.ts:40646-40660` z bramką `turnsAtWar ≥ 10` (`main.ts:40654`), logika `game/diplomacy-ai-forced-peace.ts:370` (`runAiAiPeaceTick`), wywołanie `main.ts:48525`, finalizacja `main.ts:40734`, log `main.ts:40736`, brak widoczności (L7).

2. Pominięte pokój gracz↔gracz (hot-seat) i finalizePeace: PRZYJMUJĘ. Dodano P21 (`main.ts:22998` `respondToHumanProposal` → `finalizePeaceTreatyBetween(p.fromOwnerId, p.toOwnerId)`, wpis „Ważne” w `main.ts:22999-23003`) i wpisano `finalizePeace` (`main.ts:13119-13125`, pokój po rozejmie) do P8.

3. P5/P6 „brak twardego minimum / NIE ZBADANO”: PRZYJMUJĘ. Zbadano: `peaceProposalBlocked` (`diplomacy-peace-proposal-timing.ts:5-9`) blokuje pokój, rozejm i trybut przed 10 pełnymi turami wojny; stosowane w `peaceProposalIsTooEarly` (`main.ts:12508-12512`, użycia 21539, 22300, 22334, 27616), w ocenie AI (`game/diplomacy-proposals.ts:1579`) i w UI (`game/diplomacy-locks.ts:326, 354`, przycisk z licznikiem tur). Tabela §1 i §2 poprawione (P5, P6: 10 tur; §2 bez „brak progu”). Pozostałe NIE ZBADANO wskazane wyraźnie (P17, P21).

4. Dane WARDUR „NIE ODCZYTANE”: PRZYJMUJĘ. Dane odczytane z `78b14aba3` (`git show`): summary.json, plik war-kontynenty-7.jsonl; para 1 vs 7: start 108, end 118, duration 9, fatigue 0,225, citiesChanged 0. Pkt 4 dispatchu wykonany z summary.json.

5. Hipoteza 1 vs 7 bez konwencji end/duration i z mylącym rankingiem: PRZYJMUJĘ. Konwencja z `gra/tools/war-duration-summarize.cjs`: `end` = pierwsza tura bez wojny, `duration` = `turnsAtWar` w ostatnim rekordzie wojny (`end − start − 1`: 83−42−1=40; 118−108−1=9). Ranking przebudowany (§4): P10 wykluczone (poziom 0,225 < 1,0), P12 wykluczone (citiesChanged 0; licznik przejęć zasilany tym samym zdarzeniem, co zmiany właściciela), P16 wykluczone. Zbieżność: licznik wojny osiągnąłby 10 w turze 118, czyli w turze zakończenia; kandydaci AI↔AI z progiem 10 tur to P20 i P11 (oba console-only). Wybór między nimi wymaga logu (L1). Hipoteza oznaczona jako wskazówka, nie dowód.

6. Luka L2 jako „rozbieżność kod↔opis”, pominięta świadoma decyzja R9: PRZYJMUJĘ reklasyfikację. `main.ts:19063-19065` (R9) jawnie usunęło automatyczne kończenie wojen epoki przez miasta. L2 w dokumencie to teraz: nieaktualne komentarze (`forced-war-bronze.ts:19`, `forced-war-iron.ts:46`) i martwe stałe `WOJNA_*_MAX_CZAS_TRWANIA_TUR = 20` (P14), klasyfikacja higiena. Pytanie o limit czasu wojny epoki pozostaje osobną decyzją właściciela o balansie.

7. Niska waga: dowody widoczności: PRZYJMUJĘ korektę. `main.ts:27029-27030` to bramka `logPeaceVazne` (`if (a !== ME() && b !== ME()) return;`), nie dowód wpisu. Dla P7 sprawdzono `applyDiploEventTracked` (`main.ts:13397-13412`): nie dopisuje do `warEventLog`; `declareWarAfterTruce` (`main.ts:13109-13113`) nie loguje. Stąd P7 widoczność „NIE” ma teraz uzasadnienie wprost w tabeli.

## Dane pomiarowe (z dispatchu, bez zmian)
- WARDUR seed 4242: 0 vs 1, 42→83, 40 tur, pokój wymuszony 100%, zmienione miasta 0.
- WARDUR seed 7: 1 vs 7, 108→118, 9 tur, naturalna, zmęczenie 0,225, zmienione miasta 0, powód nieznany.

## Luki do osobnych tematów (w dokumencie §6)
R-WEB-WAR-END-REASON-LOG; R-WEB-EPOCH-WAR-STALE-COMMENTS (+ osobna decyzja o limicie czasu wojny epoki); R-WEB-TRUCE-END-SILENT; R-WEB-ELIMINATED-RELATION-CLOSE; R-WEB-WAR-END-MEASURE-9T; R-WEB-PEACE-PAIR-NO-TIME-GATE-CHECK (P21, P17).

NASTĘPNY KROK: orkiestrator: przegląd Evaluatora (runda 3) dokumentu ee96ee3f5 i tego raportu; decyzja o włączeniu luk w kolejkę (nie ten temat).
DEPLOY/PUSH: NIE WYKONANO
